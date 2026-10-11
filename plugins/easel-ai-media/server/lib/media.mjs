// estimate / generate / providers: the provider layer's behaviour (architecture §6, decision D3).
// Nothing is spent without confirm: true and the quote of a dry run of the same request; above the
// user's limit an approved amount is also needed.
import { createHmac, randomBytes } from 'node:crypto';
import { appendFileSync, closeSync, existsSync, mkdirSync, openSync, readFileSync, rmSync, statSync, writeFileSync, writeSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROVIDERS, REQUEST_ARGS, atlasSeconds, falSeconds } from '../providers/index.mjs';
import { keyFor, keyStatus, maskSecrets } from './keys.mjs';
import { download } from './http.mjs';
import { checkConsent, logConsent } from './consent.mjs';
import { dataDir, fileSha256, projectImage, realInsideRoot, recordOutputs, reservePath, sha256 } from './outputs.mjs';

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

// What the adapter will send for this request. Every argument given must be one it puts in the
// provider's request (else it is refused here, before any spend: nothing quoted is dropped), and the
// values it sends in another form (an aspect as the nearest size, a size as a ratio, a clip length as
// one the model makes) are what is priced, quoted and shown.
const given = (args, k) => (k === 'count' ? (args.count || 1) > 1 : args[k] !== undefined && args[k] !== null && args[k] !== '' && !(Array.isArray(args[k]) && !args[k].length));
export function planRequest(args, provider, model) {
  const p = PROVIDERS[provider], takes = p.takes(args.kind, model);
  const extra = REQUEST_ARGS.filter((k) => given(args, k) && !takes.includes(k));
  if (extra.length) {
    const why = [extra.includes('refs') && 'it takes no reference images: for refs use openai, gemini or fal-ai/nano-banana',
      extra.includes('aspect') && (args.kind === 'video' ? 'the clip takes the shape of its start image: make the keyframe in that aspect' : 'it takes a pixel size: give size instead, e.g. 768x1344 for 9:16'),
      extra.includes('count') && 'it makes one result per call: call again for another'].filter(Boolean);
    throw new Error(`${provider} ${model} does not take ${extra.join(', ')} for ${args.kind}${why.length ? ` (${why.join('; ')})` : ''}. Leave ${extra.length > 1 ? 'them' : 'it'} out or choose a provider that does; it takes ${takes.join(', ')}. Nothing was sent.`);
  }
  if (args.kind === 'video' && (args.refs || []).length > 1) throw new Error(`${model} takes one start image: give one keyframe in refs. Nothing was sent.`);
  const { sent = {}, notes = [] } = (p.shape && p.shape(args.kind, model, args)) || {};
  return { sent, notes };
}

export function estimate(args, env = process.env) {
  const { est, plan } = priced(args, env);
  return { ...est, ...(plan.notes.length ? { notes: plan.notes } : {}) };
}
function priced(args, env) {
  const { provider, model } = resolveModel(args, env);
  const plan = planRequest(args, provider, model), a = { ...args, ...plan.sent };
  const pr = PRICES.models[`${provider}/${model}`];
  if (!pr) return { plan, est: { provider, model, usd: null, basis: 'no price listed for this model: check the provider before spending', verify: true } };
  const n = a.count || 1;
  let usd, basis;
  if (pr.tiers) {
    const tier = a.quality || pr.default_tier, size = a.size || '1024x1024';
    const each = (pr.tiers[tier] || {})[size];
    if (each === undefined) throw new Error(`no ${provider}/${model} price for quality "${tier}" at ${size} (sizes: ${Object.keys(pr.tiers[pr.default_tier]).join(', ')})`);
    usd = each * n; basis = `${n} x ${each} USD (${tier}, ${size})`;
  } else if (pr.unit === 'image') { const each = (pr.per_resolution && a.resolution && pr.per_resolution[a.resolution]) || pr.usd; usd = each * n; basis = `${n} x ${each} USD per image`; }
  else if (pr.unit === 'megapixel') { const [w, h] = (a.size || '1024x1024').split('x').map(Number); const mp = (w * h) / 1e6; usd = pr.usd * mp * n; basis = `${n} x ${mp.toFixed(2)} MP x ${pr.usd} USD`; }
  else if (pr.unit === 'second') { const s = provider === 'fal' ? falSeconds(a.seconds) : provider === 'atlas' ? atlasSeconds(a.seconds, pr.min_seconds) : Math.max(a.seconds || 5, pr.min_seconds || 0); usd = pr.usd * s * n; basis = `${n} x ${s} s x ${pr.usd} USD (the clip length the provider is asked for)`; }
  else if (pr.unit === 'minute') { const chars = (a.text || '').length; const min = chars / 900; usd = pr.usd * Math.max(min, 1 / 60); basis = `about ${min.toFixed(2)} min of speech (${chars} characters at about 150 words a minute) x ${pr.usd} USD`; }
  else if (pr.unit === '1k_chars') { const chars = (a.text || '').length; usd = (pr.usd * chars) / 1000; basis = `${chars} characters x ${pr.usd} USD per 1,000`; }
  else { usd = pr.usd * n; basis = `${n} x ${pr.usd} USD per request`; }
  return { plan, est: { provider, model, usd: +usd.toFixed(4), basis, source: pr.source, ...(pr.checked ? { checked: pr.checked } : { verify: true }) } };
}

// The quote: a short keyed hash of everything a paid call is priced on and makes (provider, model,
// kind, count, size, quality, length, voice, the reference and sample files by their bytes, the prompt
// and text, the values sent in another form) and of the estimate itself. A dry run returns it; a paid
// call must bring the quote of the same request, so what is confirmed is what the user was shown.
// Keyed with a secret of this install (quoteKey), so it cannot be worked out from the published code
// without a dry run, and it survives a server restart.
export function quoteMaterial(args, est, files = {}, sent = {}) {
  const t = (v) => (v === undefined || v === null || v === '' ? null : v);
  return {
    provider: est.provider, model: est.model, kind: args.kind, count: args.count || 1, size: t(args.size), aspect: t(args.aspect), quality: t(args.quality), resolution: t(args.resolution),
    seconds: t(args.seconds), voice: t(args.voice), language: t(args.language), instructions: t(args.instructions), voiceName: t(args.voiceName),
    refs: files.refs || [], samples: files.samples || [],
    prompt: args.prompt ? sha256(String(args.prompt)) : null, text: args.text ? { length: String(args.text).length, sha256: sha256(String(args.text)) } : null,
    sent: Object.keys(sent).length ? sent : null,
    usd: est.usd,
  };
}
export const quoteFor = (material, env = process.env) => createHmac('sha256', quoteKey(env)).update(JSON.stringify(material)).digest('hex').slice(0, 12);

// The quote's key: 32 random bytes kept in the plugin's data folder (quote.key, made on first use,
// readable by this user only where the file system allows, never printed or logged). Without a data
// folder, or if it cannot be read or written, one key per server process (a restart then needs a new
// dry run).
const quoteKeys = new Map();
export function quoteKey(env = process.env) {
  const dir = dataDir(env), id = dir || '';
  if (!quoteKeys.has(id)) quoteKeys.set(id, (dir && storedKey(dir)) || randomBytes(32));
  return quoteKeys.get(id);
}
function storedKey(dir) {
  const file = join(dir, 'quote.key');
  const read = () => { try { const t = readFileSync(file, 'utf8').trim(); return /^[0-9a-f]{64}$/.test(t) ? Buffer.from(t, 'hex') : null; } catch { return null; } };
  const had = read();
  if (had) return had;
  try {
    mkdirSync(dir, { recursive: true });
    const fd = openSync(file, 'wx', 0o600);
    try { writeSync(fd, `${randomBytes(32).toString('hex')}\n`); } finally { closeSync(fd); }
  } catch { /* made by another server just now (read it), or the folder cannot be written */ }
  return read();
}

// The request as the user is shown it: every field the quote covers (the estimate is shown beside
// it), the values sent in another form, and notes on how they are sent.
const SHOWN = ['size', 'aspect', 'quality', 'resolution', 'seconds', 'voice', 'language', 'instructions', 'voiceName'];
function requestPreview(args, q, notes) {
  const { text } = args;
  return { provider: q.provider, model: q.model, kind: q.kind, count: q.count, ...(args.prompt ? { prompt: args.prompt } : {}), ...(text ? { text: text.length > 200 ? `${text.slice(0, 200)}...` : text } : {}),
    ...(q.refs.length ? { refs: args.refs } : {}), ...(q.samples.length ? { samples: args.samples } : {}), ...Object.fromEntries(SHOWN.filter((k) => q[k] !== null).map((k) => [k, q[k]])),
    ...(q.sent ? { sent: q.sent } : {}), ...(notes.length ? { notes } : {}) };
}

export async function generate(args, env = process.env) {
  const t0 = Date.now();
  // reference images: real image files inside the project folder (nothing else is ever uploaded)
  const refs = (args.refs || []).map((f) => projectImage(f));
  if ((args.kind === 'image' || args.kind === 'video' || args.kind === 'music') && !args.prompt) throw new Error(`${args.kind} needs a prompt`);
  if (args.kind === 'tts' && !args.text) throw new Error('tts needs text');
  // requests the provider would reject or ignore after charging are refused here (and in planRequest),
  // before any spend
  const { est, plan } = priced(args, env);
  const { provider, model } = est;
  if (args.kind === 'video' && !refs.length) throw new Error('video is image-to-video: give the keyframe image in refs');
  const out = jobDir(args);
  let consent = null;
  if (args.kind === 'voice-clone') {
    consent = checkConsent(args, out, { env });
    if (!consent.ok) return { refused: true, reason: consent.reason, fix: consent.fix };
  }
  const key = keyFor(provider, env);
  const limit = limitUsd(env);
  const samples = consent ? consent.samples : [];
  const material = quoteMaterial(args, est, { refs: refs.map((f) => ({ file: f, sha256: fileSha256(f) })), samples: samples.map((f) => ({ file: f, sha256: fileSha256(f) })) }, plan.sent);
  const quote = quoteFor(material, env), preview = requestPreview(args, material, plan.notes);
  if (!args.confirm) {
    return { dryRun: true, quote, estimate: est, limitUsd: limit, key: key ? `set (${key.from})` : `missing: set ${Object.values(keyStatus(env)[provider].env || []).join(' or ')} or the plugin setting`, request: preview,
      next: `Show the user the estimate and the request. Only after they agree, call again with the same arguments plus confirm: true and quote: "${quote}"` + (est.usd !== null && est.usd > limit ? `, and with approvedUsd >= ${est.usd} (above the ${limit} USD limit)` : '') + '. Any change to the request needs a new dry run.' };
  }
  if (args.quote !== quote) {
    return { refused: true, reason: args.quote ? 'this request is not the one that was quoted: it changed since the dry run (provider, model, size, count, length, the contents of a reference or sample file, prompt or text), or the quote did not come from a dry run here, so the user has not seen its estimate' : 'a paid call needs the quote from a dry run of the same request', fix: 'Call generate without confirm (a dry run), show the user the estimate and the request it returns, and only after they agree call again with the same arguments plus confirm: true and the quote from that dry run.' };
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
  const recorded = () => (submitted && submitted.id ? `job ${submitted.id} is recorded in ${join(out, 'jobs.jsonl')}; ` : '');
  try { outputs = await PROVIDERS[provider].run(args.kind, model, { ...args, ...plan.sent, refs, samples: consent ? samples : args.samples, voiceName: args.voiceName, onSubmit }, key.value); }
  catch (e) {
    const msg = maskSecrets(e.message, env);
    // several calls for one request (count > 1): the ones made before the failure were paid for and
    // are saved below; the error is reported after that
    if (e.partial && e.partial.length) { partial = { error: msg, requested: e.requested || args.count || 1, failed: true }; outputs = e.partial; }
    else { jobLog({ status: 'failed', error: msg.slice(0, 300) }); throw new Error(msg + (submitted && submitted.id ? ` (${recorded()}check the provider's dashboard before paying again)` : '')); }
  }
  // what was asked for and priced: count results where the model makes several, else one
  const requested = PROVIDERS[provider].takes(args.kind, model).includes('count') ? args.count || 1 : 1;
  if (!outputs.length) {
    jobLog({ status: 'empty', requested });
    throw new Error(`the ${provider} call returned no result (0 of ${requested}), but it was made and may have been charged (${recorded()}check the provider's dashboard before paying again)`);
  }
  if (!partial && outputs.length < requested) partial = { error: `the ${provider} call returned ${outputs.length} of ${requested}`, requested };
  const name = slugOf(args.name || args.kind);
  const files = [], warnings = [], rel = (f) => relative(out, f).split(sep).join('/');
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
    // the charge and the result URLs are logged first: nothing after this may lose them
    const msg = maskSecrets(e.message, env);
    try { jobLog({ status: 'paid-not-saved', error: msg.slice(0, 300), urls: outputs.filter((o) => o.url).map((o) => maskSecrets(String(o.url), env).slice(0, 300)), ...(files.length ? { files: files.map((f) => rel(f.file)), sha256: hashes() } : {}) }); } catch { /* the error below still says it was charged */ }
    try { recordOutputs(files, args.kind, env); } catch { /* the ledger is a record; the charge comes first */ }
    if (reserved) {
      // the empty name claimed for the file that failed (Windows may hold it a moment)
      try { rmSync(reserved, { force: true, maxRetries: 10, retryDelay: 200 }); } catch { /* an empty file is left */ }
    }
    throw new Error(`${msg} (the generation succeeded and was charged; its result URLs are in ${join(out, 'jobs.jsonl')})`);
  }
  try { recordOutputs(files, args.kind, env); } catch (e) { warnings.push(`the outputs ledger could not be written (${maskSecrets(e.message, env).slice(0, 200)}), so the consent check may not know these files as Easel's own`); }
  jobLog({ status: partial ? 'partial' : 'saved', files: files.map((f) => rel(f.file)), sha256: hashes(), ...(partial ? { requested: partial.requested, paid: outputs.length, saved: files.length, error: partial.error.slice(0, 300) } : {}) });
  if (consent) {
    const voiceId = outputs[0] && outputs[0].json && outputs[0].json.voice_id;
    try { logConsent(args, out, consent, voiceId); } catch (e) { warnings.push(`the voice was cloned (voice id ${voiceId || 'unknown'}), but consent-log.jsonl could not be written (${maskSecrets(e.message, env).slice(0, 200)}): add this clone to it by hand`); }
  }
  // provenance is a record of a call that is already paid for and saved: a provenance.json that cannot
  // be read is left as it is, this call's entries go to a file of their own, and the files are returned
  const meta = { provider, model, prompt: args.prompt || args.text, costEstimateUsd: est.usd, refs, tool: `easel-ai-media:${args.kind === 'tts' || args.kind === 'voice-clone' ? 'voice' : args.kind === 'video' || args.kind === 'music' ? 'ai-video' : 'image'}` };
  try { appendProvenance(out, files.map((f) => f.file), meta); }
  catch (e) {
    let where = '';
    try { const pf = reservePath(out, 'provenance-unmerged', '.json'); writeFileSync(pf, JSON.stringify({ version: 1, assets: provenanceAssets(out, files.map((f) => f.file), meta) }, null, 2) + '\n'); where = `; this call's entries are in ${basename(pf)}`; } catch { /* nothing more to try */ }
    warnings.push(`the files are saved (the call was charged), but provenance.json could not be read or updated (${maskSecrets(e.message, env).slice(0, 200)}): it was left as it is${where}`);
  }
  if (partial) throw new Error(`${partial.error} (${outputs.length} of ${partial.requested} were made and charged${partial.failed ? ' before this failed' : ''}; they are saved: ${files.map((f) => rel(f.file)).join(', ')} in ${out}, and recorded in jobs.jsonl. Ask the user before generating the rest.)${warnings.length ? ` ${warnings.join(' ')}` : ''}`);
  return { files, provider, model, estimate: est, ms: Date.now() - t0, ...(warnings.length ? { warnings } : {}) };
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

export function provenanceAssets(out, files, { provider, model, prompt, costEstimateUsd, refs = [], tool }) {
  const rel = (f) => (isAbsolute(f) ? relative(out, f).split('\\').join('/') : f);
  return files.map((f) => ({
    file: rel(f), created: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'), tool, method: 'generated',
    inputs: [...(prompt ? [{ kind: 'user', name: 'prompt', license: 'user-owned' }] : []), ...refs.map((r) => ({ kind: 'user', name: rel(r), license: 'user-owned' })), { kind: 'model', name: `${provider}/${model}`, license: 'provider-terms' }],
    model: { provider, name: model, ...(prompt ? { prompt: String(prompt).slice(0, 2000) } : {}), ...(typeof costEstimateUsd === 'number' ? { costEstimateUsd } : {}) },
  }));
}
export function appendProvenance(out, files, meta) {
  const pf = join(out, 'provenance.json');
  const doc = existsSync(pf) ? JSON.parse(readFileSync(pf, 'utf8')) : { version: 1, assets: [] };
  doc.assets.push(...provenanceAssets(out, files, meta));
  writeFileSync(pf, JSON.stringify(doc, null, 2) + '\n');
  return pf;
}
