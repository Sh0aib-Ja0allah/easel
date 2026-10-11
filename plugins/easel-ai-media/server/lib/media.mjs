// estimate / generate / providers: the provider layer's behaviour (architecture §6, decision D3).
// Nothing is spent without confirm: true and the quote of a dry run of the same request; above the
// user's limit an approved amount is also needed.
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROVIDERS, atlasSeconds, falSeconds } from '../providers/index.mjs';
import { keyFor, keyStatus, maskSecrets } from './keys.mjs';
import { download } from './http.mjs';
import { checkConsent, logConsent } from './consent.mjs';
import { projectImage, realInsideRoot, recordOutputs, reservePath, sha256 } from './outputs.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const PRICES = JSON.parse(readFileSync(join(ROOT, 'prices.json'), 'utf8'));
export const KINDS = ['image', 'video', 'tts', 'music', 'voice-clone'];
const slugOf = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'media';

// The job folder: ./easel-out/<slug>/, or an outDir inside the project folder (never elsewhere:
// paid files, the consent statement and its log all live here), also once links are followed.
export function jobDir(args, cwd = process.cwd()) {
  const root = resolve(cwd);
  const dir = args.outDir ? resolve(root, args.outDir) : join(root, 'easel-out', slugOf(args.slug || 'media'));
  if (dir !== root && !dir.startsWith(root + sep)) throw new Error(`outDir must be inside the project folder (${root}); got ${dir}`);
  if (!realInsideRoot(dir, root)) throw new Error(`the job folder must be inside the project folder (${root}); ${dir} leads outside it through a link`);
  return dir;
}
export function limitUsd(env = process.env) {
  const raw = String(env.EASEL_MEDIA_MAX_USD ?? '').trim();
  const v = Number(raw);
  // unset, empty or an unexpanded ${...} -> the default
  return raw !== '' && !/^\$\{/.test(raw) && Number.isFinite(v) && v >= 0 ? v : 0.5;
}

export function listProviders(env = process.env) {
  const keys = keyStatus(env);
  return {
    providers: Object.entries(PROVIDERS).map(([id, p]) => ({
      id, label: p.label, key: keys[id],
      kinds: Object.fromEntries(Object.entries(p.kinds).map(([k, models]) => [k, models.map((m) => { const pr = PRICES.models[`${id}/${m}`]; return { model: m, price: pr ? priceText(pr) : 'no price listed', ...(pr ? { source: pr.source, ...(pr.checked ? { checked: pr.checked } : { verify: true }) } : {}) }; })])),
    })),
    limitUsd: limitUsd(env),
    note: PRICES.note,
  };
}
function priceText(pr) {
  if (pr.tiers) return `${Object.entries(pr.tiers).map(([t, s]) => `${t} ${Object.values(s)[0]}-${Math.max(...Object.values(s))}`).join(', ')} USD per image (by quality and size)`;
  return `${pr.usd} USD per ${pr.unit.replace('1k_chars', '1,000 characters')}${pr.min_seconds ? ` (minimum ${pr.min_seconds} s)` : ''}`;
}

// Choose provider and model: the asked ones, or the first provider with a key that does this kind.
export function resolveModel(args, env = process.env) {
  if (!KINDS.includes(args.kind)) throw new Error(`kind must be one of ${KINDS.join(', ')}`);
  let provider = args.provider, model = args.model;
  if (provider && !PROVIDERS[provider]) throw new Error(`unknown provider "${provider}" (use ${Object.keys(PROVIDERS).join(', ')})`);
  if (!provider) {
    const withKey = Object.keys(PROVIDERS).filter((p) => PROVIDERS[p].kinds[args.kind] && keyFor(p, env));
    const any = Object.keys(PROVIDERS).filter((p) => PROVIDERS[p].kinds[args.kind]);
    provider = withKey[0] || any[0];
  }
  const models = PROVIDERS[provider].kinds[args.kind];
  if (!models) throw new Error(`${provider} does not do ${args.kind} (providers that do: ${Object.keys(PROVIDERS).filter((p) => PROVIDERS[p].kinds[args.kind]).join(', ')})`);
  model = model || models[0];
  if (!models.includes(model)) throw new Error(`${provider} has no ${args.kind} model "${model}" (known: ${models.join(', ')})`);
  return { provider, model };
}

export function estimate(args, env = process.env) {
  const { provider, model } = resolveModel(args, env);
  const pr = PRICES.models[`${provider}/${model}`];
  if (!pr) return { provider, model, usd: null, basis: 'no price listed for this model: check the provider before spending', verify: true };
  const n = args.count || 1;
  let usd, basis;
  if (pr.tiers) {
    const tier = args.quality || pr.default_tier, size = args.size || '1024x1024';
    const each = (pr.tiers[tier] || {})[size];
    if (each === undefined) throw new Error(`no ${provider}/${model} price for quality "${tier}" at ${size} (sizes: ${Object.keys(pr.tiers[pr.default_tier]).join(', ')})`);
    usd = each * n; basis = `${n} x ${each} USD (${tier}, ${size})`;
  } else if (pr.unit === 'image') { const each = (pr.per_resolution && args.resolution && pr.per_resolution[args.resolution]) || pr.usd; usd = each * n; basis = `${n} x ${each} USD per image`; }
  else if (pr.unit === 'megapixel') { const [w, h] = (args.size || '1024x1024').split('x').map(Number); const mp = (w * h) / 1e6; usd = pr.usd * mp * n; basis = `${n} x ${mp.toFixed(2)} MP x ${pr.usd} USD`; }
  else if (pr.unit === 'second') { const s = provider === 'fal' ? falSeconds(args.seconds) : provider === 'atlas' ? atlasSeconds(args.seconds, pr.min_seconds) : Math.max(args.seconds || 5, pr.min_seconds || 0); usd = pr.usd * s * n; basis = `${n} x ${s} s x ${pr.usd} USD (the clip length the provider is asked for)`; }
  else if (pr.unit === 'minute') { const chars = (args.text || '').length; const min = chars / 900; usd = pr.usd * Math.max(min, 1 / 60); basis = `about ${min.toFixed(2)} min of speech (${chars} characters at about 150 words a minute) x ${pr.usd} USD`; }
  else if (pr.unit === '1k_chars') { const chars = (args.text || '').length; usd = (pr.usd * chars) / 1000; basis = `${chars} characters x ${pr.usd} USD per 1,000`; }
  else { usd = pr.usd * n; basis = `${n} x ${pr.usd} USD per request`; }
  return { provider, model, usd: +usd.toFixed(4), basis, source: pr.source, ...(pr.checked ? { checked: pr.checked } : { verify: true }) };
}

// The quote: a short hash of everything a paid call is priced on and makes (provider, model, kind,
// count, size, quality, length, voice, the reference and sample files, the prompt and text) and of
// the estimate itself. A dry run returns it; a paid call must bring the quote of the same request,
// so what is confirmed is what the user was shown. Stateless: it survives a server restart.
export function quoteFor(args, est, files = {}) {
  const t = (v) => (v === undefined || v === null || v === '' ? null : v);
  const norm = {
    provider: est.provider, model: est.model, kind: args.kind, count: args.count || 1, size: t(args.size), aspect: t(args.aspect), quality: t(args.quality), resolution: t(args.resolution),
    seconds: t(args.seconds), voice: t(args.voice), language: t(args.language), instructions: t(args.instructions), voiceName: t(args.voiceName),
    refs: files.refs || [], samples: files.samples || [],
    prompt: args.prompt ? sha256(String(args.prompt)) : null, text: args.text ? { length: String(args.text).length, sha256: sha256(String(args.text)) } : null,
    usd: est.usd,
  };
  return sha256(JSON.stringify(norm)).slice(0, 12);
}

function requestPreview(args, provider, model) {
  const { prompt, text, refs, size, quality, seconds, aspect, voice, count, samples } = args;
  return { provider, model, kind: args.kind, ...(prompt ? { prompt } : {}), ...(text ? { text: text.length > 200 ? `${text.slice(0, 200)}...` : text } : {}), ...(refs ? { refs } : {}), ...(samples ? { samples } : {}), ...(size ? { size } : {}), ...(quality ? { quality } : {}), ...(seconds ? { seconds } : {}), ...(aspect ? { aspect } : {}), ...(voice ? { voice } : {}), ...(count ? { count } : {}) };
}

export async function generate(args, env = process.env) {
  const t0 = Date.now();
  // reference images: real image files inside the project folder (nothing else is ever uploaded)
  const refs = (args.refs || []).map((f) => projectImage(f));
  if ((args.kind === 'image' || args.kind === 'video' || args.kind === 'music') && !args.prompt) throw new Error(`${args.kind} needs a prompt`);
  if (args.kind === 'tts' && !args.text) throw new Error('tts needs text');
  const est = estimate(args, env);
  const { provider, model } = est;
  // requests the provider would reject or ignore after charging are refused here, before any spend
  if (args.kind === 'video' && !refs.length) throw new Error('video is image-to-video: give the keyframe image in refs');
  if (provider === 'fal' && /z-image/.test(model) && refs.length) throw new Error(`${model} takes no reference images; use fal-ai/nano-banana (edit) or another provider`);
  if (provider === 'replicate' && refs.length) throw new Error('the Replicate model takes no reference images; use openai, gemini or fal');
  const out = jobDir(args);
  let consent = null;
  if (args.kind === 'voice-clone') {
    consent = checkConsent(args, out, { env });
    if (!consent.ok) return { refused: true, reason: consent.reason, fix: consent.fix };
  }
  const key = keyFor(provider, env);
  const limit = limitUsd(env);
  const preview = requestPreview(args, provider, model);
  const quote = quoteFor(args, est, { refs, samples: consent ? consent.samples : [] });
  if (!args.confirm) {
    return { dryRun: true, quote, estimate: est, limitUsd: limit, key: key ? `set (${key.from})` : `missing: set ${Object.values(keyStatus(env)[provider].env || []).join(' or ')} or the plugin setting`, request: preview,
      next: `Show the user the estimate and the request. Only after they agree, call again with the same arguments plus confirm: true and quote: "${quote}"` + (est.usd !== null && est.usd > limit ? `, and with approvedUsd >= ${est.usd} (above the ${limit} USD limit)` : '') + '. Any change to the request needs a new dry run.' };
  }
  if (args.quote !== quote) {
    return { refused: true, reason: args.quote ? 'this request is not the one that was quoted: it changed since the dry run (provider, model, size, count, length, files, prompt or text), so the user has not seen its estimate' : 'a paid call needs the quote from a dry run of the same request', fix: 'Call generate without confirm (a dry run), show the user the estimate and the request it returns, and only after they agree call again with the same arguments plus confirm: true and the quote from that dry run.' };
  }
  if (!key) throw new Error(`no ${provider} key: set ${keyStatus(env)[provider].env.join(' or ')} in the environment or the easel-ai-media plugin settings (/plugin configure easel-ai-media)`);
  const approved = typeof args.approvedUsd === 'number' && (est.usd === null ? args.approvedUsd > 0 : args.approvedUsd >= est.usd);
  if ((est.usd === null || est.usd > limit) && !approved) {
    return { refused: true, reason: est.usd === null ? 'no price is listed for this model, so the spend cannot be estimated' : `the estimate (${est.usd} USD) is above the limit (${limit} USD)`, fix: 'ask the user, then call again with approvedUsd set to the amount they approved' };
  }
  // every paid job is recorded in jobs.jsonl before polling, so a failure after the provider has
  // charged leaves its id (to fetch the result from the provider instead of paying again)
  mkdirSync(out, { recursive: true });
  const jobLog = (rec) => appendFileSync(join(out, 'jobs.jsonl'), JSON.stringify({ at: new Date().toISOString(), provider, model, kind: args.kind, ...rec }) + '\n');
  let outputs, submitted = null, partial = null;
  const onSubmit = (info) => { submitted = { ...submitted, ...info }; jobLog({ status: 'submitted', ...info, estimateUsd: est.usd }); };
  try { outputs = await PROVIDERS[provider].run(args.kind, model, { ...args, refs, samples: consent ? consent.samples : args.samples, voiceName: args.voiceName, onSubmit }, key.value); }
  catch (e) {
    const msg = maskSecrets(e.message, env);
    // several calls for one request (count > 1): the ones made before the failure were paid for and
    // are saved below; the error is reported after that
    if (e.partial && e.partial.length) { partial = { error: msg, requested: e.requested || args.count || 1 }; outputs = e.partial; }
    else { jobLog({ status: 'failed', error: msg.slice(0, 300) }); throw new Error(msg + (submitted && submitted.id ? ` (job ${submitted.id} is recorded in ${join(out, 'jobs.jsonl')}; check the provider's dashboard before paying again)` : '')); }
  }
  const name = slugOf(args.name || args.kind);
  const files = [], rel = (f) => relative(out, f).split(sep).join('/');
  const hashes = () => Object.fromEntries(files.map((f) => [rel(f.file), f.sha256]));
  let reserved = null;
  try {
    for (const [i, o] of outputs.entries()) {
      // the name is claimed before the download, so a call running alongside picks the next one
      reserved = reservePath(out, `${name}${outputs.length > 1 ? `-${i + 1}` : ''}`, o.ext);
      const data = o.json ? JSON.stringify(o.json, null, 2) + '\n' : o.bytes ? o.bytes : (await download(provider, o.url)).buffer;
      writeFileSync(reserved, data);
      files.push({ file: reserved, bytes: statSync(reserved).size, sha256: sha256(data), ...(o.words ? { words: o.words } : {}) });
      reserved = null;
      if (o.words && o.words.length) writeFileSync(files[files.length - 1].file.replace(/\.[^.]+$/, '.words.json'), JSON.stringify(o.words, null, 2) + '\n');
    }
  } catch (e) {
    if (reserved) rmSync(reserved, { force: true }); // the empty name claimed for the file that failed
    const msg = maskSecrets(e.message, env);
    recordOutputs(files, args.kind, env);
    jobLog({ status: 'paid-not-saved', error: msg.slice(0, 300), urls: outputs.filter((o) => o.url).map((o) => String(o.url).slice(0, 300)), ...(files.length ? { files: files.map((f) => rel(f.file)), sha256: hashes() } : {}) });
    throw new Error(`${msg} (the generation succeeded and was charged; its result URLs are in ${join(out, 'jobs.jsonl')})`);
  }
  recordOutputs(files, args.kind, env);
  jobLog({ status: partial ? 'partial' : 'saved', files: files.map((f) => rel(f.file)), sha256: hashes(), ...(partial ? { requested: partial.requested, paid: outputs.length, saved: files.length, error: partial.error.slice(0, 300) } : {}) });
  if (consent) logConsent(args, out, consent, outputs[0] && outputs[0].json && outputs[0].json.voice_id);
  appendProvenance(out, files.map((f) => f.file), { provider, model, prompt: args.prompt || args.text, costEstimateUsd: est.usd, refs, tool: `easel-ai-media:${args.kind === 'tts' || args.kind === 'voice-clone' ? 'voice' : args.kind === 'video' || args.kind === 'music' ? 'ai-video' : 'image'}` });
  if (partial) throw new Error(`${partial.error} (${outputs.length} of ${partial.requested} were made and charged before this failed; they are saved: ${files.map((f) => rel(f.file)).join(', ')} in ${out}, and recorded in jobs.jsonl. Ask the user before generating the rest.)`);
  return { files, provider, model, estimate: est, ms: Date.now() - t0 };
}

export function readProvenanceFiles(out) {
  const pf = join(out, 'provenance.json');
  try { return JSON.parse(readFileSync(pf, 'utf8')).assets.map((a) => a.file); } catch { return []; }
}
export function appendAsset(out, asset) {
  const pf = join(out, 'provenance.json');
  const doc = existsSync(pf) ? JSON.parse(readFileSync(pf, 'utf8')) : { version: 1, assets: [] };
  doc.assets.push({ file: asset.file, created: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'), tool: asset.tool, method: asset.method, inputs: asset.inputs, ...(asset.notes ? { notes: asset.notes } : {}) });
  writeFileSync(pf, JSON.stringify(doc, null, 2) + '\n');
  return pf;
}

export function appendProvenance(out, files, { provider, model, prompt, costEstimateUsd, refs = [], tool }) {
  const pf = join(out, 'provenance.json');
  const doc = existsSync(pf) ? JSON.parse(readFileSync(pf, 'utf8')) : { version: 1, assets: [] };
  const rel = (f) => (isAbsolute(f) ? relative(out, f).split('\\').join('/') : f);
  for (const f of files) {
    doc.assets.push({
      file: rel(f), created: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'), tool, method: 'generated',
      inputs: [...(prompt ? [{ kind: 'user', name: 'prompt', license: 'user-owned' }] : []), ...refs.map((r) => ({ kind: 'user', name: rel(r), license: 'user-owned' })), { kind: 'model', name: `${provider}/${model}`, license: 'provider-terms' }],
      model: { provider, name: model, ...(prompt ? { prompt: String(prompt).slice(0, 2000) } : {}), ...(typeof costEstimateUsd === 'number' ? { costEstimateUsd } : {}) },
    });
  }
  writeFileSync(pf, JSON.stringify(doc, null, 2) + '\n');
  return pf;
}
