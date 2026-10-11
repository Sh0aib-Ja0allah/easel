// HTTP for the adapters. Live calls use fetch with a real User-Agent; POSTs that create billable
// jobs are never retried, GET polls are. With EASEL_MEDIA_FIXTURES=<dir> nothing leaves the
// machine: every request is answered from <dir>/<provider>.json ({ "routes": [{ "method", "match",
// "status", "json" | "text" | "file", "contentType" }] }, matched in order, each used once unless
// "repeat": true) and recorded to EASEL_MEDIA_RECORD (a .jsonl file) for the tests.
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { maskSecrets } from './keys.mjs';
import { MEDIA_VERSION } from './version.mjs';

export const USER_AGENT = `easel-ai-media/${MEDIA_VERSION} (+github.com/Sh0aib-Ja0allah/easel)`;
const used = new Map();

function fixtureRoute(provider, method, url) {
  const dir = process.env.EASEL_MEDIA_FIXTURES;
  const file = join(dir, `${provider}.json`);
  if (!existsSync(file)) throw new Error(`fixture mode: no ${provider}.json in ${dir}`);
  const { routes } = JSON.parse(readFileSync(file, 'utf8'));
  const key = `${dir}|${provider}`;
  const usedHere = used.get(key) || new Set();
  used.set(key, usedHere);
  const i = routes.findIndex((r, idx) => (r.repeat || !usedHere.has(idx)) && (r.method || 'GET') === method && url.includes(r.match));
  if (i < 0) throw new Error(`fixture mode: no ${method} route for ${url} in ${provider}.json`);
  usedHere.add(i);
  return { route: routes[i], dir };
}

// Where a URL may go. Every URL a provider hands back (status, result, download) is checked before
// it is fetched: https only, never a loopback, private, link-local or metadata address. A URL that
// will carry the API key must also be on that provider's own hosts.
export const KEY_HOSTS = { fal: ['fal.run', 'fal.ai'], replicate: ['api.replicate.com'], atlas: ['api.atlascloud.ai'], openai: ['api.openai.com'], gemini: ['generativelanguage.googleapis.com'], elevenlabs: ['api.elevenlabs.io'] };
const PRIVATE_V4 = [/^0\./, /^10\./, /^127\./, /^169\.254\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./, /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, /^(22[4-9]|2[3-5]\d)\./];
export function checkUrl(raw, { keyFor } = {}) {
  let u;
  try { u = new URL(raw); } catch { throw new Error(`not a valid URL: ${String(raw).slice(0, 100)}`); }
  if (u.protocol !== 'https:') throw new Error(`refused a non-https URL from the provider: ${u.protocol}//${u.host}`);
  if (u.username || u.password) throw new Error('refused a URL with credentials in it');
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local') || host === 'metadata.google.internal') throw new Error(`refused a local address: ${host}`);
  if (/^[\d.]+$/.test(host) && PRIVATE_V4.some((re) => re.test(host))) throw new Error(`refused a private or local address: ${host}`);
  if (host.includes(':') && (host === '::1' || host === '::' || /^f[cd]/.test(host) || /^fe[89ab]/.test(host) || host.startsWith('::ffff:'))) throw new Error(`refused a private or local address: ${host}`);
  if (keyFor) {
    const ok = (KEY_HOSTS[keyFor] || []).some((h) => host === h || host.endsWith(`.${h}`));
    if (!ok) throw new Error(`refused to send the ${keyFor} key to ${host} (not a ${keyFor} host)`);
  }
  return u.href;
}

export const MAX_DOWNLOAD = 1024 * 1024 * 1024; // 1 GB
const MEDIA_TYPE = /^(image|video|audio)\/|^application\/(octet-stream|binary)|^binary\/octet-stream/;

// A provider's result file: no key sent, redirects followed by hand (each hop checked), a size cap,
// and a media content type.
export async function download(provider, url, { maxBytes = MAX_DOWNLOAD } = {}) {
  let target = checkUrl(url);
  for (let hop = 0; hop < 5; hop++) {
    const res = await request(provider, { url: target, redirect: 'manual' });
    if (res.status >= 300 && res.status < 400 && res.location) { target = checkUrl(new URL(res.location, target).href); continue; }
    if (!res.ok) throw new Error(`download failed (HTTP ${res.status}) for the ${provider} result`);
    if (!res.buffer.length) throw new Error(`the ${provider} result was empty`);
    if (res.buffer.length > maxBytes) throw new Error(`the ${provider} result is larger than ${Math.round(maxBytes / 1048576)} MB`);
    if (res.contentType && !MEDIA_TYPE.test(res.contentType)) throw new Error(`the ${provider} result is not media (content type ${res.contentType})`);
    return res;
  }
  throw new Error(`too many redirects for the ${provider} result`);
}

export async function request(provider, { method = 'GET', url, headers = {}, body, form, binary = false, redirect = 'follow' }) {
  const record = process.env.EASEL_MEDIA_RECORD;
  // the key only ever goes to the provider's own hosts, over https
  if (Object.keys(headers).some((h) => /^(authorization|x-goog-api-key|xi-api-key)$/i.test(h))) checkUrl(url, { keyFor: provider });
  if (process.env.EASEL_MEDIA_FIXTURES) {
    const { route, dir } = fixtureRoute(provider, method, url);
    if (record) appendFileSync(record, JSON.stringify({ provider, method, url, headers: Object.fromEntries(Object.entries(headers).map(([k, v]) => [k, maskSecrets(v)])), body: body === undefined ? undefined : body, form: form ? Object.keys(form) : undefined }) + '\n');
    const status = route.status || 200;
    const buf = route.file ? readFileSync(join(dir, route.file)) : Buffer.from(route.json !== undefined ? JSON.stringify(route.json) : route.text || '');
    return { status, ok: status < 400, location: route.location, contentType: route.contentType || (route.json !== undefined ? 'application/json' : 'application/octet-stream'), buffer: buf, json: () => JSON.parse(buf.toString('utf8')) };
  }
  const init = { method, redirect, headers: { 'User-Agent': USER_AGENT, ...headers } };
  if (form) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(form)) for (const item of [].concat(v)) fd.append(k, item.blob || item, item.name);
    init.body = fd;
  } else if (body !== undefined) { init.body = typeof body === 'string' || body instanceof Uint8Array ? body : JSON.stringify(body); if (!init.headers['Content-Type'] && !(body instanceof Uint8Array)) init.headers['Content-Type'] = 'application/json'; }
  const tries = method === 'GET' ? 3 : 1;
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, init);
      const len = Number(res.headers.get('content-length') || 0);
      if (len > MAX_DOWNLOAD) throw Object.assign(new Error(`response larger than ${Math.round(MAX_DOWNLOAD / 1048576)} MB`), { fatal: true });
      const buffer = Buffer.from(await res.arrayBuffer());
      return { status: res.status, ok: res.ok, location: res.headers.get('location') || undefined, contentType: res.headers.get('content-type') || '', buffer, json: () => JSON.parse(buffer.toString('utf8')) };
    } catch (e) { last = e; if (e.fatal) break; if (i < tries - 1) await new Promise((r) => setTimeout(r, 1000 * 2 ** i)); }
  }
  throw new Error(maskSecrets(`${method} ${url} failed: ${last && last.message}`));
}

export async function requestJson(provider, req) {
  const res = await request(provider, req);
  let data;
  try { data = res.json(); } catch { data = null; }
  if (!res.ok) throw new Error(maskSecrets(`${provider}: ${req.method || 'GET'} ${req.url.replace(/\?.*$/, '')} -> HTTP ${res.status}: ${(data ? JSON.stringify(data) : res.buffer.toString('utf8')).slice(0, 400)}`));
  return data;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, process.env.EASEL_MEDIA_FIXTURES ? 0 : ms));
// tests: forget which fixture routes were used
export function resetFixtures() { used.clear(); }
