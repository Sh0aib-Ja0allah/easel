// T4.1-T4.4: the provider layer. No network: every call is answered from test/fixtures (fixture
// mode), and every request is recorded so the tests can check what would have been sent. Keys are
// fake strings; the tests check they never reach a result, a file or a log.
import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const FIX = fileURLToPath(new URL('./fixtures', import.meta.url));
const SERVER = fileURLToPath(new URL('../server.mjs', import.meta.url));
const root = mkdtempSync(join(tmpdir(), 'easel-media-'));
const KEYS = { OPENAI_API_KEY: 'sk-test-openai-SECRET-1', GEMINI_API_KEY: 'gm-test-SECRET-2', FAL_KEY: 'fal-test-SECRET-3', REPLICATE_API_TOKEN: 'r8-test-SECRET-4', ATLASCLOUD_API_KEY: 'atl-test-SECRET-5', ELEVENLABS_API_KEY: 'el-test-SECRET-6' };
const rec = join(root, 'requests.jsonl');
const env = { ...process.env, ...KEYS, EASEL_MEDIA_FIXTURES: FIX, EASEL_MEDIA_RECORD: rec };
Object.assign(process.env, KEYS, { EASEL_MEDIA_FIXTURES: FIX, EASEL_MEDIA_RECORD: rec });
for (const k of Object.keys(process.env)) if (/^EASEL_CFG_|^EASEL_MEDIA_MAX_USD$/.test(k)) delete process.env[k];
const m = { ...(await import('../lib/media.mjs')), ...(await import('../lib/keys.mjs')), ...(await import('../lib/http.mjs')) };
const sent = () => (existsSync(rec) ? readFileSync(rec, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
beforeEach(() => { m.resetFixtures(); rmSync(rec, { force: true }); });
after(() => rmSync(root, { recursive: true, force: true }));
const noSecrets = (text) => { for (const v of Object.values(KEYS)) assert.ok(!String(text).includes(v), `a key leaked: ${v.slice(0, 8)}...`); };

test('keys: from the environment or the plugin setting; an unexpanded ${VAR} counts as unset; status shows names only', () => {
  assert.equal(m.keyFor('openai', { OPENAI_API_KEY: 'k1' }).from, 'OPENAI_API_KEY');
  assert.equal(m.keyFor('openai', { OPENAI_API_KEY: '${OPENAI_API_KEY}' }), null);
  assert.equal(m.keyFor('openai', { EASEL_CFG_OPENAI: 'k2', OPENAI_API_KEY: 'k1' }).value, 'k2');
  assert.equal(m.keyFor('openai', { EASEL_CFG_OPENAI: '${user_config.openai_api_key}', OPENAI_API_KEY: 'k1' }).value, 'k1');
  const s = m.keyStatus({ FAL_KEY: 'zzzzzz' });
  assert.deepEqual(s.fal, { set: true, from: 'FAL_KEY' });
  assert.deepEqual(s.openai, { set: false, env: ['OPENAI_API_KEY'] });
  noSecrets(JSON.stringify(m.listProviders()));
  assert.equal(m.maskSecrets('error: Bearer sk-test-openai-SECRET-1 rejected'), 'error: Bearer sk-*** rejected');
  assert.equal(m.keyFor('openai', { OPENAI_API_KEY: '' }), null);
  // the spending limit: the plugin setting, else 0.5; empty or unexpanded means unset, 0 is a real limit
  assert.equal(m.limitUsd({}), 0.5);
  assert.equal(m.limitUsd({ EASEL_MEDIA_MAX_USD: '' }), 0.5);
  assert.equal(m.limitUsd({ EASEL_MEDIA_MAX_USD: '${user_config.max_spend_usd}' }), 0.5);
  assert.equal(m.limitUsd({ EASEL_MEDIA_MAX_USD: '2' }), 2);
  assert.equal(m.limitUsd({ EASEL_MEDIA_MAX_USD: '0' }), 0);
  assert.equal(m.limitUsd({ EASEL_MEDIA_MAX_USD: '-1' }), 0.5);
});

test('estimates: every adapter has a priced default model, worked out from its unit, with the source', () => {
  const cases = [
    [{ kind: 'image', provider: 'openai', quality: 'high', size: '1536x1024', count: 2 }, 0.5],
    [{ kind: 'image', provider: 'gemini' }, 0.039],
    [{ kind: 'image', provider: 'fal', model: 'fal-ai/z-image/turbo', size: '1000x1000' }, 0.005],
    [{ kind: 'video', provider: 'fal', seconds: 10 }, 0.7],
    [{ kind: 'image', provider: 'replicate', count: 4 }, 0.012],
    [{ kind: 'video', provider: 'atlas', seconds: 2 }, 0.39],   // 3 s minimum
    [{ kind: 'image', provider: 'atlas', resolution: '2k' }, 0.12],
    [{ kind: 'tts', provider: 'elevenlabs', text: 'x'.repeat(2500) }, 0.2],
    [{ kind: 'tts', provider: 'openai', text: 'x'.repeat(900) }, 0.015],
  ];
  for (const [args, usd] of cases) { const e = m.estimate(args); assert.equal(e.usd, usd, JSON.stringify([args, e])); assert.ok(e.source && e.basis, JSON.stringify(e)); }
  for (const p of m.listProviders().providers) assert.ok(Object.values(p.kinds).flat().some((x) => x.price !== 'no price listed'), p.id);
  assert.throws(() => m.estimate({ kind: 'video', provider: 'gemini' }), /does not do video/);
  assert.throws(() => m.estimate({ kind: 'image', provider: 'openai', model: 'dall-e-9' }), /no image model/);
  assert.throws(() => m.estimate({ kind: 'sculpture' }), /kind must be one of/);
});

test('dry run by default: an estimate and the request, nothing sent, no files', async () => {
  const r = await m.generate({ kind: 'image', provider: 'openai', prompt: 'a paper boat', outDir: join(root, 'dry') });
  assert.equal(r.dryRun, true);
  assert.equal(r.estimate.usd, 0.042);
  assert.match(r.key, /^set \(OPENAI_API_KEY\)$/);
  assert.deepEqual(sent(), []);
  assert.ok(!existsSync(join(root, 'dry')));
  noSecrets(JSON.stringify(r));
});

test('above the limit an approved amount is needed; a missing key is a clear error', async () => {
  const big = { kind: 'video', provider: 'fal', model: 'fal-ai/kling-video/v3/pro/image-to-video', prompt: 'x', seconds: 10, outDir: join(root, 'lim') };
  const dry = await m.generate(big);
  assert.match(dry.next, /approvedUsd >= 1\.4/);
  const refused = await m.generate({ ...big, confirm: true });
  assert.equal(refused.refused, true);
  assert.match(refused.reason, /above the limit \(0\.5 USD\)/);
  assert.deepEqual(sent(), []);
  const saved = process.env.REPLICATE_API_TOKEN; delete process.env.REPLICATE_API_TOKEN;
  try { await assert.rejects(m.generate({ kind: 'image', provider: 'replicate', prompt: 'x', confirm: true, outDir: join(root, 'nokey') }), /no replicate key: set REPLICATE_API_TOKEN/); }
  finally { process.env.REPLICATE_API_TOKEN = saved; }
});

test('each adapter: confirmed calls send the right request, poll, download, and write files with provenance', async () => {
  const out = join(root, 'gen');
  const runs = [
    [{ kind: 'image', provider: 'openai', prompt: 'a paper boat', name: 'boat-openai' }, 'boat-openai.png', /api\.openai\.com\/v1\/images\/generations/],
    [{ kind: 'image', provider: 'gemini', prompt: 'a paper boat', aspect: '16:9', name: 'boat-gemini' }, 'boat-gemini.png', /gemini-2\.5-flash-image:generateContent/],
    [{ kind: 'image', provider: 'replicate', prompt: 'a paper boat', name: 'boat-replicate' }, 'boat-replicate.webp', /flux-schnell\/predictions/],
    [{ kind: 'image', provider: 'atlas', prompt: 'a paper boat', name: 'boat-atlas' }, 'boat-atlas.png', /api\.atlascloud\.ai\/api\/v1\/model\/generateImage/],
    [{ kind: 'video', provider: 'fal', prompt: 'the boat drifts', seconds: 5, refs: [join(FIX, 'tiny.png')], name: 'drift', approvedUsd: 1 }, 'drift.mp4', /queue\.fal\.run\/fal-ai\/kling-video/],
    [{ kind: 'tts', provider: 'openai', text: 'Hello there.', name: 'vo-openai' }, 'vo-openai.mp3', /\/v1\/audio\/speech/],
    [{ kind: 'tts', provider: 'elevenlabs', text: 'Hi there', name: 'vo-eleven' }, 'vo-eleven.mp3', /with-timestamps/],
  ];
  for (const [args, file, url] of runs) {
    m.resetFixtures(); rmSync(rec, { force: true });
    const r = await m.generate({ ...args, confirm: true, outDir: out });
    assert.equal(r.files[0].file, join(out, file), JSON.stringify(r));
    assert.ok(r.files[0].bytes > 0);
    const reqs = sent();
    assert.match(reqs[0].url, url);
    assert.equal(reqs[0].method, 'POST');
    noSecrets(JSON.stringify(reqs) + JSON.stringify(r));
  }
  // polling happened (fal: two status calls, replicate: one poll), and the image-to-video start frame went as a data URI
  // elevenlabs gives word timings
  assert.ok(existsSync(join(out, 'vo-eleven.words.json')));
  assert.deepEqual(JSON.parse(readFileSync(join(out, 'vo-eleven.words.json'), 'utf8')).map((w) => w.text), ['Hi', 'there']);
  const prov = JSON.parse(readFileSync(join(out, 'provenance.json'), 'utf8'));
  assert.equal(prov.assets.length, 7);
  assert.ok(prov.assets.every((a) => a.method === 'generated' && a.model && a.model.provider && typeof a.model.costEstimateUsd === 'number'));
  const { validateFile } = await import(new URL('../../../easel-core/engine/lib/schemas.mjs', import.meta.url).href);
  assert.deepEqual(validateFile('provenance', join(out, 'provenance.json')), []);
  for (const f of readdirSync(out)) noSecrets(readFileSync(join(out, f)).toString('latin1'));
});

test('voice cloning is refused without a consent statement and recording in the job folder, and logged when made', async () => {
  const job = join(root, 'clone'); mkdirSync(job, { recursive: true });
  writeFileSync(join(job, 'sample-1.wav'), 'RIFF....WAVE');
  const base = { kind: 'voice-clone', provider: 'elevenlabs', voiceName: 'Narrator A', samples: [join(job, 'sample-1.wav')], outDir: job, confirm: true };
  const noConsent = await m.generate(base);
  assert.equal(noConsent.refused, true);
  assert.match(noConsent.reason, /no consent statement/);
  assert.match(noConsent.fix, /consent\.json/);
  writeFileSync(join(job, 'consent.json'), JSON.stringify({ speaker: 'Dana Reyes', statement: 'I agree to this.', purpose: 'narration', date: '2026-10-11', recording: 'consent.wav' }));
  const weak = await m.generate({ ...base, consentFile: join(job, 'consent.json') });
  assert.match(weak.reason, /consent/);
  writeFileSync(join(job, 'consent.json'), JSON.stringify({ speaker: 'Dana Reyes', statement: 'I, Dana Reyes, consent to my voice being cloned for the Harbor podcast narration, by the Harbor team, for use in episodes 1-10.', purpose: 'podcast narration', date: '2026-10-11', recording: 'consent.wav' }));
  const noRecording = await m.generate({ ...base, consentFile: join(job, 'consent.json') });
  assert.match(noRecording.reason, /consent recording consent\.wav is not in the job folder/);
  const outside = join(root, 'elsewhere.json'); writeFileSync(outside, readFileSync(join(job, 'consent.json')));
  assert.match((await m.generate({ ...base, consentFile: outside })).reason, /inside this job folder/);
  const escape = JSON.parse(readFileSync(join(job, 'consent.json'), 'utf8')); escape.recording = '../elsewhere.wav';
  writeFileSync(join(root, 'elsewhere.wav'), 'RIFF....WAVE'); writeFileSync(join(job, 'consent.json'), JSON.stringify(escape));
  assert.match((await m.generate({ ...base, consentFile: join(job, 'consent.json') })).reason, /recording must be inside this job folder/);
  escape.recording = 'consent.wav'; writeFileSync(join(job, 'consent.json'), JSON.stringify(escape));
  assert.deepEqual(sent(), [], 'nothing was sent while refusing');
  assert.ok(!existsSync(join(job, 'consent-log.jsonl')));
  writeFileSync(join(job, 'consent.wav'), 'RIFF....WAVE');
  const ok = await m.generate({ ...base, consentFile: join(job, 'consent.json') });
  assert.equal(JSON.parse(readFileSync(ok.files[0].file, 'utf8')).voice_id, 'v_123');
  const log = readFileSync(join(job, 'consent-log.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual([log.length, log[0].speaker, log[0].voiceId, log[0].consentFile, log[0].recording], [1, 'Dana Reyes', 'v_123', 'consent.json', 'consent.wav']);
});

test('the MCP server lists five tools, answers a dry run, and never prints a key', () => {
  const lines = [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } },
    { jsonrpc: '2.0', id: 2, method: 'tools/list' },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'generate', arguments: { kind: 'image', provider: 'gemini', prompt: 'a kite', outDir: join(root, 'srv') } } },
    { jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'providers', arguments: {} } },
  ].map((x) => JSON.stringify(x)).join('\n') + '\n';
  const r = spawnSync(process.execPath, [SERVER], { input: lines, encoding: 'utf8', env, windowsHide: true });
  const msgs = r.stdout.trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual(msgs[1].result.tools.map((t) => t.name), ['providers', 'estimate', 'generate', 'assemble', 'consent_template']);
  assert.match(msgs[2].result.content[0].text, /"dryRun": true/);
  noSecrets(r.stdout + r.stderr);
});
