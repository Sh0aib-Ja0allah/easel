// T4.1-T4.4: the provider layer. No network: every call is answered from test/fixtures (fixture
// mode), and every request is recorded so the tests can check what would have been sent. Keys are
// fake strings; the tests check they never reach a result, a file or a log.
import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const FIX = fileURLToPath(new URL('./fixtures', import.meta.url));
const SERVER = fileURLToPath(new URL('../server.mjs', import.meta.url));
// the tests work in a temporary project folder (job folders must be inside the project)
const root = realpathSync(mkdtempSync(join(tmpdir(), 'easel-media-')));
process.chdir(root);
const KEYS = { OPENAI_API_KEY: 'sk-test-openai-SECRET-1', GEMINI_API_KEY: 'gm-test-SECRET-2', FAL_KEY: 'fal-test-SECRET-3', REPLICATE_API_TOKEN: 'r8-test-SECRET-4', ATLASCLOUD_API_KEY: 'atl-test-SECRET-5', ELEVENLABS_API_KEY: 'el-test-SECRET-6' };
const rec = join(root, 'requests.jsonl');
const env = { ...process.env, ...KEYS, EASEL_MEDIA_FIXTURES: FIX, EASEL_MEDIA_RECORD: rec };
Object.assign(process.env, KEYS, { EASEL_MEDIA_FIXTURES: FIX, EASEL_MEDIA_RECORD: rec });
for (const k of Object.keys(process.env)) if (/^EASEL_CFG_|^EASEL_MEDIA_MAX_USD$/.test(k)) delete process.env[k];
const m = { ...(await import('../lib/media.mjs')), ...(await import('../lib/keys.mjs')), ...(await import('../lib/http.mjs')) };
const { findBinary } = await import('../lib/binaries.mjs');
const sent = () => (existsSync(rec) ? readFileSync(rec, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
beforeEach(() => { m.resetFixtures(); rmSync(rec, { force: true }); });
after(() => { process.chdir(tmpdir()); rmSync(root, { recursive: true, force: true }); });
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
  const big = { kind: 'video', provider: 'fal', model: 'fal-ai/kling-video/v3/pro/image-to-video', prompt: 'x', seconds: 10, refs: [join(FIX, 'tiny.png')], outDir: join(root, 'lim') };
  const dry = await m.generate(big);
  assert.match(dry.next, /approvedUsd >= 1\.4/);
  const refused = await m.generate({ ...big, confirm: true });
  assert.equal(refused.refused, true);
  assert.match(refused.reason, /above the limit \(0\.5 USD\)/);
  assert.equal((await m.generate({ ...big, confirm: true, approvedUsd: 1.39 })).refused, true, 'an approval below the estimate is not enough');
  assert.deepEqual(sent(), []);
  // the approved amount covers it: the job runs, asking for the clip length that was priced
  const ok = await m.generate({ ...big, confirm: true, approvedUsd: 1.4 });
  assert.equal(ok.estimate.usd, 1.4);
  assert.equal(sent()[0].body.duration, '10');
  // a model with no listed price needs an explicit, non-zero approval
  const saved0 = m.PRICES.models['replicate/black-forest-labs/flux-schnell']; delete m.PRICES.models['replicate/black-forest-labs/flux-schnell'];
  try {
    const unpriced = { kind: 'image', provider: 'replicate', prompt: 'x', confirm: true, outDir: join(root, 'np') };
    assert.match((await m.generate(unpriced)).reason, /no price is listed/);
    assert.equal((await m.generate({ ...unpriced, approvedUsd: 0 })).refused, true);
  } finally { m.PRICES.models['replicate/black-forest-labs/flux-schnell'] = saved0; }
  // requests a provider would reject or ignore after charging are refused before any spend
  rmSync(rec, { force: true });
  await assert.rejects(m.generate({ kind: 'video', provider: 'fal', prompt: 'x', confirm: true, approvedUsd: 1, outDir: join(root, 'lim') }), /give the keyframe image in refs/);
  await assert.rejects(m.generate({ kind: 'image', provider: 'fal', model: 'fal-ai/z-image/turbo', prompt: 'x', refs: [join(FIX, 'tiny.png')], confirm: true, outDir: join(root, 'lim') }), /takes no reference images/);
  await assert.rejects(m.generate({ kind: 'image', provider: 'openai', prompt: 'x', outDir: '../outside' }), /outDir must be inside the project folder/);
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
    // result files are downloaded without the key
    for (const d of reqs.filter((q) => /fal\.media|replicate\.delivery|oss\.atlascloud/.test(q.url))) assert.ok(!Object.keys(d.headers || {}).some((h) => /authorization/i.test(h)), d.url);
    if (args.provider === 'fal') {
      assert.match(reqs[0].body.image_url, /^data:image\/png;base64,/, 'the start frame goes as a data URI');
      assert.equal(reqs[0].body.duration, '5');
      assert.equal(reqs.filter((q) => q.method === 'GET' && /\/status$/.test(q.url)).length, 2, 'polled until COMPLETED');
    }
    if (args.provider === 'replicate') assert.ok(reqs.filter((q) => q.method === 'GET' && /predictions\/p1$/.test(q.url)).length >= 1, 'polled');
    if (args.provider === 'atlas') assert.ok(reqs.some((q) => q.method === 'GET' && /prediction\//.test(q.url)), 'polled');
    if (args.kind !== 'tts' || args.provider !== 'openai') {
      const jobs = readFileSync(join(out, 'jobs.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((j) => j.provider === args.provider && j.kind === args.kind);
      assert.equal(jobs[jobs.length - 1].status, 'saved', JSON.stringify(jobs));
    }
  }
  // a second run with the same name never overwrites a paid file
  m.resetFixtures();
  const again = await m.generate({ kind: 'image', provider: 'openai', prompt: 'a paper boat', name: 'boat-openai', confirm: true, outDir: out });
  assert.equal(again.files[0].file, join(out, 'boat-openai-2.png'));
  // elevenlabs gives word timings
  assert.ok(existsSync(join(out, 'vo-eleven.words.json')));
  assert.deepEqual(JSON.parse(readFileSync(join(out, 'vo-eleven.words.json'), 'utf8')).map((w) => w.text), ['Hi', 'there']);
  const prov = JSON.parse(readFileSync(join(out, 'provenance.json'), 'utf8'));
  assert.equal(prov.assets.length, 8);
  assert.ok(prov.assets.every((a) => a.method === 'generated' && a.model && a.model.provider && typeof a.model.costEstimateUsd === 'number'));
  const { validateFile } = await import(new URL('../../../easel-core/engine/lib/schemas.mjs', import.meta.url).href);
  assert.deepEqual(validateFile('provenance', join(out, 'provenance.json')), []);
  for (const f of readdirSync(out)) noSecrets(readFileSync(join(out, f)).toString('latin1'));
});

test('URLs from a provider: the key only goes to its own https hosts; downloads refuse local addresses, redirects there, non-media and oversize', async () => {
  assert.throws(() => m.checkUrl('http://queue.fal.run/x', { keyFor: 'fal' }), /non-https/);
  assert.throws(() => m.checkUrl('https://evil.example/x', { keyFor: 'fal' }), /refused to send the fal key/);
  assert.throws(() => m.checkUrl('https://queue.fal.run.evil.example/x', { keyFor: 'fal' }), /refused to send the fal key/);
  assert.equal(m.checkUrl('https://queue.fal.run/fal-ai/x/requests/1/status', { keyFor: 'fal' }), 'https://queue.fal.run/fal-ai/x/requests/1/status');
  for (const u of ['https://169.254.169.254/latest', 'https://127.0.0.1/a.png', 'https://10.1.2.3/a', 'https://192.168.0.5/a', 'https://localhost/a', 'https://[::1]/a', 'https://user:pw@cdn.example/a.png']) assert.throws(() => m.checkUrl(u), /refused|credentials/, u);
  // a provider answer pointing the next (keyed) call at a metadata address: refused, never sent
  const dir = mkdtempSync(join(tmpdir(), 'easel-fx-'));
  const saved = process.env.EASEL_MEDIA_FIXTURES;
  try {
    for (const f of ['tiny.png', 'tiny.mp4']) writeFileSync(join(dir, f), readFileSync(join(FIX, f)));
    writeFileSync(join(dir, 'fal.json'), JSON.stringify({ routes: [{ method: 'POST', match: 'queue.fal.run', json: { request_id: 'r9', status_url: 'http://169.254.169.254/latest/meta-data', response_url: 'https://evil.example/r9' } }] }));
    writeFileSync(join(dir, 'replicate.json'), JSON.stringify({ routes: [
      { method: 'POST', match: '/predictions', json: { id: 'p9', status: 'succeeded', output: ['https://127.0.0.1/out.webp'], urls: { get: 'https://api.replicate.com/v1/predictions/p9' } } },
      { method: 'POST', match: '/predictions', json: { id: 'p8', status: 'succeeded', output: ['https://replicate.delivery/x/page.html'], urls: { get: 'https://api.replicate.com/v1/predictions/p8' } } },
      { match: 'replicate.delivery/x/page.html', text: '<html>', contentType: 'text/html' },
      { method: 'POST', match: '/predictions', json: { id: 'p7', status: 'succeeded', output: ['https://replicate.delivery/x/moved.webp'], urls: { get: 'https://api.replicate.com/v1/predictions/p7' } } },
      { match: 'replicate.delivery/x/moved.webp', status: 302, location: 'http://localhost:8080/secret', text: '' },
    ] }));
    process.env.EASEL_MEDIA_FIXTURES = dir; m.resetFixtures(); rmSync(rec, { force: true });
    const job = join(root, 'guard');
    await assert.rejects(m.generate({ kind: 'video', provider: 'fal', prompt: 'x', refs: [join(FIX, 'tiny.png')], confirm: true, approvedUsd: 1, outDir: job }), /non-https|refused/);
    assert.ok(!sent().some((q) => /169\.254|evil\.example/.test(q.url)), 'nothing went to the address the provider named');
    assert.match(readFileSync(join(job, 'jobs.jsonl'), 'utf8'), /"id":"r9"/, 'the job id was recorded before polling');
    await assert.rejects(m.generate({ kind: 'image', provider: 'replicate', prompt: 'x', confirm: true, outDir: job }), /private or local address[\s\S]*charged/);
    await assert.rejects(m.generate({ kind: 'image', provider: 'replicate', prompt: 'x', confirm: true, outDir: job }), /not media \(content type text\/html\)/);
    await assert.rejects(m.generate({ kind: 'image', provider: 'replicate', prompt: 'x', confirm: true, outDir: job }), /non-https/);
    assert.ok(!sent().some((q) => /127\.0\.0\.1|localhost/.test(q.url)));
    assert.match(readFileSync(join(job, 'jobs.jsonl'), 'utf8'), /"status":"paid-not-saved"/);
  } finally { process.env.EASEL_MEDIA_FIXTURES = saved; rmSync(dir, { recursive: true, force: true }); }
});

const ffmpeg = findBinary('ffmpeg');
const wav = (file, seconds) => { const r = spawnSync(ffmpeg.path, ['-y', '-v', 'error', '-f', 'lavfi', '-i', `sine=frequency=220:duration=${seconds}`, file], { encoding: 'utf8', windowsHide: true }); assert.equal(r.status, 0, r.stderr); return file; };

test('voice cloning: refused without a real consent statement and recording in the job folder, logged when made', { skip: ffmpeg ? false : 'needs ffmpeg' }, async () => {
  const job = join(root, 'clone'); mkdirSync(job, { recursive: true });
  wav(join(job, 'sample-1.wav'), 3);
  const base = { kind: 'voice-clone', provider: 'elevenlabs', voiceName: 'Narrator A', samples: [join(job, 'sample-1.wav')], outDir: job, confirm: true };
  const good = { speaker: 'Dana Reyes', statement: 'I, Dana Reyes, consent to my voice being cloned for the Harbor podcast narration, by the Harbor team, for use in episodes 1-10. Nobody may use it without my consent for anything else.', purpose: 'podcast narration', date: '2026-10-11', recording: 'consent.wav' };
  const cf = join(job, 'consent.json');
  const tryWith = async (patch, extra = {}) => { writeFileSync(cf, JSON.stringify({ ...good, ...patch })); return m.generate({ ...base, consentFile: cf, ...extra }); };
  const noConsent = await m.generate(base);
  assert.equal(noConsent.refused, true);
  assert.match(noConsent.reason, /no consent statement/);
  assert.match(noConsent.fix, /consent\.json/);
  // the recording is checked after the statement, so first: no recording yet
  assert.match((await tryWith({})).reason, /consent recording consent\.wav is not in the job folder/);
  wav(join(job, 'consent.wav'), 4);
  const refusals = [
    [{ statement: 'I agree to this.' }, /must say that the speaker consents/],
    [{ statement: 'I, Dana Reyes, do NOT consent to my voice being cloned.' }, /does not give consent/],
    [{ statement: "I, Dana Reyes, don't consent to any cloning." }, /does not give consent/],
    [{ statement: 'I, <full name>, consent to my voice being cloned for <purpose>, by <who>, for use in <where>.' }, /placeholders/],
    [{ speaker: 'Full name of the person whose voice this is' }, /missing speaker|voice owner/],
    [{ speaker: ' Dana Reyes', statement: 'I, Dana, consent to my voice being cloned for narration.' }, /name the speaker in full/],
    [{ date: '2099-99-99' }, /real date/],
    [{ date: '2026-02-31' }, /real date/],
    [{ date: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10) }, /not in the future/],
    [{ purpose: 'What the cloned voice will say and where it will be used' }, /missing purpose|placeholders/],
    [{ recording: 'consent.json' }, /must be an audio file/],
    [{ recording: '../elsewhere.wav' }, /recording must be inside this job folder/],
  ];
  wav(join(root, 'elsewhere.wav'), 4);
  for (const [patch, re] of refusals) { const r = await tryWith(patch); assert.equal(r.refused, true, JSON.stringify(patch)); assert.match(r.reason, re, JSON.stringify(patch)); }
  // an empty file, a too-short clip and a renamed text file are not recordings
  writeFileSync(join(job, 'empty.wav'), '');
  assert.match((await tryWith({ recording: 'empty.wav' })).reason, /empty or too short/);
  wav(join(job, 'blip.wav'), 0.5);
  assert.match((await tryWith({ recording: 'blip.wav' })).reason, /0\.5 s long/);
  writeFileSync(join(job, 'fake.wav'), 'x'.repeat(4096));
  assert.match((await tryWith({ recording: 'fake.wav' })).reason, /fake\.wav (has no audio|could not be read)/);
  // a link inside the folder that points outside it counts as outside
  let linked = false;
  try { symlinkSync(join(root, 'elsewhere.wav'), join(job, 'link.wav')); linked = true; } catch { /* no symlink rights (Windows without developer mode) */ }
  if (linked) assert.match((await tryWith({ recording: 'link.wav' })).reason, /recording must be inside this job folder/);
  // the consent file and the samples must be in the job folder too
  const outside = join(root, 'elsewhere.json'); writeFileSync(outside, JSON.stringify(good));
  assert.match((await m.generate({ ...base, consentFile: outside })).reason, /consent file must be inside this job folder/);
  assert.match((await tryWith({}, { samples: [join(root, 'elsewhere.wav')] })).reason, /sample .* must be in this job folder/);
  // the job folder itself cannot be moved out of the project
  await assert.rejects(m.generate({ ...base, consentFile: cf, outDir: tmpdir() }), /outDir must be inside the project folder/);
  assert.deepEqual(sent(), [], 'nothing was sent while refusing');
  assert.ok(!existsSync(join(job, 'consent-log.jsonl')));
  const ok = await tryWith({});
  assert.equal(JSON.parse(readFileSync(ok.files[0].file, 'utf8')).voice_id, 'v_123');
  const reqs = sent();
  assert.deepEqual(reqs[0].form, ['name', 'description', 'files'], 'ElevenLabs takes the samples as "files"');
  const log = readFileSync(join(job, 'consent-log.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual([log.length, log[0].speaker, log[0].voiceId, log[0].consentFile, log[0].recording, log[0].samples], [1, 'Dana Reyes', 'v_123', 'consent.json', 'consent.wav', ['sample-1.wav']]);
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
