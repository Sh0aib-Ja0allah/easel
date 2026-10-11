// estimate / generate / providers: the provider layer's behaviour (architecture §6, decision D3).
// Nothing is spent without confirm: true; above the user's limit an approved amount is also needed.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync, appendFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROVIDERS } from '../providers/index.mjs';
import { keyFor, keyStatus, maskSecrets } from './keys.mjs';
import { request } from './http.mjs';
import { checkConsent, logConsent } from './consent.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const PRICES = JSON.parse(readFileSync(join(ROOT, 'prices.json'), 'utf8'));
export const KINDS = ['image', 'video', 'tts', 'music', 'voice-clone'];
const slugOf = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'media';

export function jobDir(args) {
  if (args.outDir) return resolve(args.outDir);
  return resolve(process.cwd(), 'easel-out', slugOf(args.slug || 'media'));
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
  else if (pr.unit === 'second') { const s = Math.max(args.seconds || 5, pr.min_seconds || 0); usd = pr.usd * s * n; basis = `${n} x ${s} s x ${pr.usd} USD`; }
  else if (pr.unit === 'minute') { const chars = (args.text || '').length; const min = chars / 900; usd = pr.usd * Math.max(min, 1 / 60); basis = `about ${min.toFixed(2)} min of speech (${chars} characters at about 150 words a minute) x ${pr.usd} USD`; }
  else if (pr.unit === '1k_chars') { const chars = (args.text || '').length; usd = (pr.usd * chars) / 1000; basis = `${chars} characters x ${pr.usd} USD per 1,000`; }
  else { usd = pr.usd * n; basis = `${n} x ${pr.usd} USD per request`; }
  return { provider, model, usd: +usd.toFixed(4), basis, source: pr.source, ...(pr.checked ? { checked: pr.checked } : { verify: true }) };
}

function requestPreview(args, provider, model) {
  const { prompt, text, refs, size, quality, seconds, aspect, voice, count, samples } = args;
  return { provider, model, kind: args.kind, ...(prompt ? { prompt } : {}), ...(text ? { text: text.length > 200 ? `${text.slice(0, 200)}...` : text } : {}), ...(refs ? { refs } : {}), ...(samples ? { samples } : {}), ...(size ? { size } : {}), ...(quality ? { quality } : {}), ...(seconds ? { seconds } : {}), ...(aspect ? { aspect } : {}), ...(voice ? { voice } : {}), ...(count ? { count } : {}) };
}

export async function generate(args, env = process.env) {
  const t0 = Date.now();
  for (const f of [...(args.refs || []), ...(args.samples || [])]) if (!existsSync(f) || !statSync(f).isFile()) throw new Error(`file not found: ${f}`);
  if ((args.kind === 'image' || args.kind === 'video' || args.kind === 'music') && !args.prompt) throw new Error(`${args.kind} needs a prompt`);
  if (args.kind === 'tts' && !args.text) throw new Error('tts needs text');
  const est = estimate(args, env);
  const { provider, model } = est;
  const out = jobDir(args);
  let consent = null;
  if (args.kind === 'voice-clone') {
    consent = checkConsent(args, out);
    if (!consent.ok) return { refused: true, reason: consent.reason, fix: consent.fix };
  }
  const key = keyFor(provider, env);
  const limit = limitUsd(env);
  const preview = requestPreview(args, provider, model);
  if (!args.confirm) {
    return { dryRun: true, estimate: est, limitUsd: limit, key: key ? `set (${key.from})` : `missing: set ${Object.values(keyStatus(env)[provider].env || []).join(' or ')} or the plugin setting`, request: preview,
      next: 'Show the user the estimate and the request. Call again with confirm: true only after they agree' + (est.usd !== null && est.usd > limit ? `, and with approvedUsd >= ${est.usd} (above the ${limit} USD limit)` : '') + '.' };
  }
  if (!key) throw new Error(`no ${provider} key: set ${keyStatus(env)[provider].env.join(' or ')} in the environment or the easel-ai-media plugin settings (/plugin configure easel-ai-media)`);
  if ((est.usd === null || est.usd > limit) && !(typeof args.approvedUsd === 'number' && (est.usd === null || args.approvedUsd >= est.usd))) {
    return { refused: true, reason: est.usd === null ? 'no price is listed for this model, so the spend cannot be estimated' : `the estimate (${est.usd} USD) is above the limit (${limit} USD)`, fix: 'ask the user, then call again with approvedUsd set to the amount they approved' };
  }
  let outputs;
  try { outputs = await PROVIDERS[provider].run(args.kind, model, { ...args, voiceName: args.voiceName }, key.value); }
  catch (e) { throw new Error(maskSecrets(e.message, env)); }
  mkdirSync(out, { recursive: true });
  const name = slugOf(args.name || args.kind);
  const files = [];
  for (const [i, o] of outputs.entries()) {
    const file = join(out, `${name}${outputs.length > 1 ? `-${i + 1}` : ''}${o.ext}`);
    if (o.json) writeFileSync(file, JSON.stringify(o.json, null, 2) + '\n');
    else if (o.bytes) writeFileSync(file, o.bytes);
    else {
      const r = await request(provider, { url: o.url });
      if (!r.ok || !r.buffer.length) throw new Error(`download failed (HTTP ${r.status}) for the ${provider} result`);
      writeFileSync(file, r.buffer);
    }
    files.push({ file, bytes: statSync(file).size, ...(o.words ? { words: o.words } : {}) });
    if (o.words && o.words.length) writeFileSync(file.replace(/\.[^.]+$/, '.words.json'), JSON.stringify(o.words, null, 2) + '\n');
  }
  if (consent) logConsent(args, out, consent, outputs[0] && outputs[0].json && outputs[0].json.voice_id);
  appendProvenance(out, files.map((f) => f.file), { provider, model, prompt: args.prompt || args.text, costEstimateUsd: est.usd, refs: args.refs, tool: `easel-ai-media:${args.kind === 'tts' || args.kind === 'voice-clone' ? 'voice' : args.kind === 'video' || args.kind === 'music' ? 'ai-video' : 'image'}` });
  return { files, provider, model, estimate: est, ms: Date.now() - t0 };
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
