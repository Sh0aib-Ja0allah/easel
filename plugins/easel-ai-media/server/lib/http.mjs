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

export async function request(provider, { method = 'GET', url, headers = {}, body, form, binary = false }) {
  const record = process.env.EASEL_MEDIA_RECORD;
  if (process.env.EASEL_MEDIA_FIXTURES) {
    const { route, dir } = fixtureRoute(provider, method, url);
    if (record) appendFileSync(record, JSON.stringify({ provider, method, url, headers: Object.fromEntries(Object.entries(headers).map(([k, v]) => [k, maskSecrets(v)])), body: body === undefined ? undefined : body, form: form ? Object.keys(form) : undefined }) + '\n');
    const status = route.status || 200;
    const buf = route.file ? readFileSync(join(dir, route.file)) : Buffer.from(route.json !== undefined ? JSON.stringify(route.json) : route.text || '');
    return { status, ok: status < 400, contentType: route.contentType || (route.json !== undefined ? 'application/json' : 'application/octet-stream'), buffer: buf, json: () => JSON.parse(buf.toString('utf8')) };
  }
  const init = { method, headers: { 'User-Agent': USER_AGENT, ...headers } };
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
      const buffer = Buffer.from(await res.arrayBuffer());
      return { status: res.status, ok: res.ok, contentType: res.headers.get('content-type') || '', buffer, json: () => JSON.parse(buffer.toString('utf8')) };
    } catch (e) { last = e; if (i < tries - 1) await new Promise((r) => setTimeout(r, 1000 * 2 ** i)); }
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
