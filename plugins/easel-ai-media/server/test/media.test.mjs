// T4.1-T4.4: the provider layer. No network: every call is answered from test/fixtures (fixture
// mode: synthetic responses shaped from each provider's documentation, not recorded from live
// accounts), and every request is recorded so the tests can check what would have been sent. Keys
// are fake strings; the tests check they never reach a result, a file or a log.
import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join, relative } from 'node:path';
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
for (const k of Object.keys(process.env)) if (/^EASEL_CFG_|^EASEL_MEDIA_MAX_USD$|^EASEL_MEDIA_DATA$/.test(k)) delete process.env[k];
const m = { ...(await import('../lib/media.mjs')), ...(await import('../lib/keys.mjs')), ...(await import('../lib/http.mjs')) };
const { findBinary } = await import('../lib/binaries.mjs');
const c = await import('../lib/consent.mjs');
const o = await import('../lib/outputs.mjs');
const jobs = (dir) => readFileSync(join(dir, 'jobs.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const sent = () => (existsSync(rec) ? readFileSync(rec, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
beforeEach(() => { m.resetFixtures(); rmSync(rec, { force: true }); });
after(() => { process.chdir(tmpdir()); rmSync(root, { recursive: true, force: true }); });
const noSecrets = (text) => { for (const v of Object.values(KEYS)) assert.ok(!String(text).includes(v), `a key leaked: ${v.slice(0, 8)}...`); };
// reference images are the user's files inside the project folder
const PNG = join(root, 'tiny.png'); copyFileSync(join(FIX, 'tiny.png'), PNG);
// a paid call the way the skills make it: a dry run, then confirm with its quote
const quoteOf = async (args) => { const dry = await m.generate({ ...args, confirm: undefined, quote: undefined }); assert.equal(dry.dryRun, true, JSON.stringify(dry)); return dry.quote; };
const paid = async (args) => m.generate({ ...args, confirm: true, quote: await quoteOf(args) });
// a fixture folder of its own: { 'provider.json': routes, 'file': bytes }
const fixtures = (files) => { const d = mkdtempSync(join(tmpdir(), 'easel-fx-')); for (const [f, v] of Object.entries(files)) writeFileSync(join(d, f), typeof v === 'string' || Buffer.isBuffer(v) ? v : JSON.stringify(v)); return d; };
const withFixtures = async (dir, fn) => { const saved = process.env.EASEL_MEDIA_FIXTURES; process.env.EASEL_MEDIA_FIXTURES = dir; m.resetFixtures(); try { return await fn(); } finally { process.env.EASEL_MEDIA_FIXTURES = saved; m.resetFixtures(); rmSync(dir, { recursive: true, force: true }); } };

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
  const big = { kind: 'video', provider: 'fal', model: 'fal-ai/kling-video/v3/pro/image-to-video', prompt: 'x', seconds: 10, refs: [PNG], outDir: join(root, 'lim') };
  const dry = await m.generate(big);
  assert.match(dry.next, /approvedUsd >= 1\.4/);
  const refused = await m.generate({ ...big, confirm: true, quote: dry.quote });
  assert.equal(refused.refused, true);
  assert.match(refused.reason, /above the limit \(0\.5 USD\)/);
  assert.equal((await m.generate({ ...big, confirm: true, quote: dry.quote, approvedUsd: 1.39 })).refused, true, 'an approval below the estimate is not enough');
  assert.deepEqual(sent(), []);
  // the approved amount covers it: the job runs, asking for the clip length that was priced
  const ok = await m.generate({ ...big, confirm: true, quote: dry.quote, approvedUsd: 1.4 });
  assert.equal(ok.estimate.usd, 1.4);
  assert.equal(sent()[0].body.duration, '10');
  // a model with no listed price needs an explicit, non-zero approval
  const saved0 = m.PRICES.models['replicate/black-forest-labs/flux-schnell']; delete m.PRICES.models['replicate/black-forest-labs/flux-schnell'];
  try {
    const unpriced = { kind: 'image', provider: 'replicate', prompt: 'x', outDir: join(root, 'np') };
    const q = await quoteOf(unpriced);
    assert.match((await m.generate({ ...unpriced, confirm: true, quote: q })).reason, /no price is listed/);
    assert.equal((await m.generate({ ...unpriced, confirm: true, quote: q, approvedUsd: 0 })).refused, true);
  } finally { m.PRICES.models['replicate/black-forest-labs/flux-schnell'] = saved0; }
  // requests a provider would reject or ignore after charging are refused before any spend
  rmSync(rec, { force: true });
  await assert.rejects(m.generate({ kind: 'video', provider: 'fal', prompt: 'x', confirm: true, approvedUsd: 1, outDir: join(root, 'lim') }), /give the keyframe image in refs/);
  await assert.rejects(m.generate({ kind: 'image', provider: 'fal', model: 'fal-ai/z-image/turbo', prompt: 'x', refs: [PNG], confirm: true, outDir: join(root, 'lim') }), /takes no reference images/);
  await assert.rejects(m.generate({ kind: 'image', provider: 'openai', prompt: 'x', outDir: '../outside' }), /outDir must be inside the project folder/);
  assert.deepEqual(sent(), []);
  const saved = process.env.REPLICATE_API_TOKEN; delete process.env.REPLICATE_API_TOKEN;
  try { await assert.rejects(paid({ kind: 'image', provider: 'replicate', prompt: 'x', outDir: join(root, 'nokey') }), /no replicate key: set REPLICATE_API_TOKEN/); }
  finally { process.env.REPLICATE_API_TOKEN = saved; }
});

test('each adapter: confirmed calls send the right request, poll, download, and write files with provenance', async () => {
  const out = join(root, 'gen');
  const runs = [
    [{ kind: 'image', provider: 'openai', prompt: 'a paper boat', name: 'boat-openai' }, 'boat-openai.png', /api\.openai\.com\/v1\/images\/generations/],
    [{ kind: 'image', provider: 'gemini', prompt: 'a paper boat', aspect: '16:9', name: 'boat-gemini' }, 'boat-gemini.png', /gemini-2\.5-flash-image:generateContent/],
    [{ kind: 'image', provider: 'replicate', prompt: 'a paper boat', name: 'boat-replicate' }, 'boat-replicate.webp', /flux-schnell\/predictions/],
    [{ kind: 'image', provider: 'atlas', prompt: 'a paper boat', name: 'boat-atlas' }, 'boat-atlas.png', /api\.atlascloud\.ai\/api\/v1\/model\/generateImage/],
    [{ kind: 'video', provider: 'fal', prompt: 'the boat drifts', seconds: 5, refs: [PNG], name: 'drift', approvedUsd: 1 }, 'drift.mp4', /queue\.fal\.run\/fal-ai\/kling-video/],
    [{ kind: 'tts', provider: 'openai', text: 'Hello there.', name: 'vo-openai' }, 'vo-openai.mp3', /\/v1\/audio\/speech/],
    [{ kind: 'tts', provider: 'elevenlabs', text: 'Hi there', name: 'vo-eleven' }, 'vo-eleven.mp3', /with-timestamps/],
  ];
  for (const [args, file, url] of runs) {
    m.resetFixtures(); rmSync(rec, { force: true });
    const r = await paid({ ...args, outDir: out });
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
  const again = await paid({ kind: 'image', provider: 'openai', prompt: 'a paper boat', name: 'boat-openai', outDir: out });
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
    await assert.rejects(paid({ kind: 'video', provider: 'fal', prompt: 'x', refs: [PNG], approvedUsd: 1, outDir: job }), /non-https|refused/);
    assert.ok(!sent().some((q) => /169\.254|evil\.example/.test(q.url)), 'nothing went to the address the provider named');
    assert.match(readFileSync(join(job, 'jobs.jsonl'), 'utf8'), /"id":"r9"/, 'the job id was recorded before polling');
    await assert.rejects(paid({ kind: 'image', provider: 'replicate', prompt: 'x', outDir: job }), /private or local address[\s\S]*charged/);
    await assert.rejects(paid({ kind: 'image', provider: 'replicate', prompt: 'x', outDir: job }), /not media \(content type text\/html\)/);
    await assert.rejects(paid({ kind: 'image', provider: 'replicate', prompt: 'x', outDir: job }), /non-https/);
    assert.ok(!sent().some((q) => /127\.0\.0\.1|localhost/.test(q.url)));
    assert.match(readFileSync(join(job, 'jobs.jsonl'), 'utf8'), /"status":"paid-not-saved"/);
    assert.deepEqual(readdirSync(job).filter((f) => f.endsWith('.webp')), [], 'no empty file is left under a name claimed for a download that failed');
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
  wav(join(job, 'consent.wav'), 12); // the statement is 33 words: at least 9.4 s to read aloud
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
  assert.equal((await tryWith({})).refused, true, 'a confirmed clone still needs the quote of a dry run');
  writeFileSync(cf, JSON.stringify(good));
  const ok = await paid({ ...base, consentFile: cf });
  assert.equal(JSON.parse(readFileSync(ok.files[0].file, 'utf8')).voice_id, 'v_123');
  const reqs = sent();
  assert.deepEqual(Object.keys(reqs[0].form), ['name', 'description', 'files'], 'ElevenLabs takes the samples as "files"');
  assert.deepEqual([reqs[0].form.name, reqs[0].form.files.map((f) => f.file)], [['Narrator A'], ['sample-1.wav']]);
  const log = readFileSync(join(job, 'consent-log.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual([log.length, log[0].speaker, log[0].voiceId, log[0].consentFile, log[0].recording, log[0].samples], [1, 'Dana Reyes', 'v_123', 'consent.json', 'consent.wav', ['sample-1.wav']]);
});

test('quote: a paid call needs the quote of a dry run of the very same request; any change needs a new dry run', async () => {
  const req = { kind: 'image', provider: 'openai', prompt: 'a paper boat', size: '1024x1024', outDir: join(root, 'quote') };
  const dry = await m.generate(req);
  assert.match(dry.quote, /^[0-9a-f]{12}$/);
  assert.ok(dry.next.includes(`quote: "${dry.quote}"`), dry.next);
  assert.equal((await m.generate(req)).quote, dry.quote, 'stateless: the same request always gets the same quote (it survives a restart)');
  assert.equal((await m.generate({ ...req, outDir: undefined, slug: 'elsewhere', name: 'boat' })).quote, dry.quote, 'where the file goes is not part of it');
  // without a quote, or with the quote of another request: refused, nothing sent, no quote handed out
  const none = await m.generate({ ...req, confirm: true });
  assert.equal(none.refused, true);
  assert.match(none.reason, /needs the quote from a dry run of the same request/);
  assert.match(none.fix, /without confirm \(a dry run\)/);
  assert.ok(!JSON.stringify(none).includes(dry.quote));
  for (const change of [{ count: 2 }, { size: '1536x1024' }, { quality: 'high' }, { provider: 'gemini' }, { model: 'gpt-image-1', prompt: 'a paper boat at night' }, { refs: [PNG] }]) {
    const r = await m.generate({ ...req, ...change, confirm: true, quote: dry.quote });
    assert.equal(r.refused, true, JSON.stringify(change));
    assert.match(r.reason, /not the one that was quoted/, JSON.stringify(change));
  }
  assert.equal((await m.generate({ kind: 'tts', provider: 'elevenlabs', text: 'Hello there', outDir: req.outDir, confirm: true, quote: (await m.generate({ kind: 'tts', provider: 'elevenlabs', text: 'Hello there!', outDir: req.outDir })).quote })).refused, true, 'another text');
  // the estimate is part of it: a price change means the user has not seen this price
  const tiers = m.PRICES.models['openai/gpt-image-1'].tiers.medium, was = tiers['1024x1024'];
  tiers['1024x1024'] = was * 2;
  try { assert.notEqual((await m.generate(req)).quote, dry.quote); } finally { tiers['1024x1024'] = was; }
  assert.deepEqual(sent(), []);
  const ok = await m.generate({ ...req, confirm: true, quote: dry.quote });
  assert.equal(ok.files.length, 1);
  const { tools } = await import('../tools.mjs');
  assert.deepEqual(tools.generate.inputSchema.properties.quote.pattern, '^[0-9a-f]{12}$');
});

test('two calls with the same name at the same time: each paid file gets its own name, neither is overwritten', async () => {
  const dir = fixtures({ 'replicate.json': { routes: [
    { method: 'POST', match: '/predictions', json: { id: 'pa', status: 'succeeded', output: ['https://replicate.delivery/x/a.webp'], urls: { get: 'https://api.replicate.com/v1/predictions/pa' } } },
    { method: 'POST', match: '/predictions', json: { id: 'pb', status: 'succeeded', output: ['https://replicate.delivery/x/b.webp'], urls: { get: 'https://api.replicate.com/v1/predictions/pb' } } },
    { match: 'replicate.delivery/x/a.webp', file: 'a.webp', contentType: 'image/webp' },
    { match: 'replicate.delivery/x/b.webp', file: 'b.webp', contentType: 'image/webp' },
  ] }, 'a.webp': 'AAAA', 'b.webp': 'BBBB' });
  await withFixtures(dir, async () => {
    const req = { kind: 'image', provider: 'replicate', prompt: 'x', slug: 'par' };
    const quote = await quoteOf(req);
    const [a, b] = await Promise.all([m.generate({ ...req, confirm: true, quote }), m.generate({ ...req, confirm: true, quote })]);
    const job = join(root, 'easel-out', 'par');
    assert.notEqual(a.files[0].file, b.files[0].file);
    assert.deepEqual(readdirSync(job).filter((f) => f.endsWith('.webp')).sort(), ['image-2.webp', 'image.webp']);
    assert.deepEqual([readFileSync(join(job, 'image.webp'), 'utf8'), readFileSync(join(job, 'image-2.webp'), 'utf8')].sort(), ['AAAA', 'BBBB'], 'both paid results are kept');
    // every saved file is recorded with its content hash
    const saved = jobs(job).filter((j) => j.status === 'saved');
    assert.deepEqual(saved.flatMap((j) => Object.values(j.sha256)).sort(), [o.sha256('AAAA'), o.sha256('BBBB')].sort());
  });
});

test('reference images: only PNG, JPEG or WebP files inside the project folder are ever uploaded', async () => {
  const outside = realpathSync(mkdtempSync(join(tmpdir(), 'easel-outside-')));
  try {
    const keystore = join(outside, 'KEY.keystore'); writeFileSync(keystore, 'not for anyone');
    const photo = join(outside, 'photo.png'); copyFileSync(PNG, photo);
    writeFileSync(join(root, 'KEY.keystore'), 'not for anyone');
    writeFileSync(join(root, 'notes.png'), 'plain text that only has an image name');
    const job = join(root, 'refs');
    const g = (refs, extra = {}) => m.generate({ kind: 'image', provider: 'gemini', prompt: 'restyle', refs, outDir: job, ...extra });
    for (const f of [photo, keystore, relative(root, photo)]) {
      await assert.rejects(g([f]), /outside the project folder/, f);
      await assert.rejects(g([f], { confirm: true, quote: '000000000000' }), /outside the project folder/, f);
    }
    await assert.rejects(g(['KEY.keystore']), /not an image the providers take \(\.png, \.jpg, \.jpeg, \.webp\)/);
    await assert.rejects(g(['notes.png']), /contents do not match its name/);
    await assert.rejects(g(['missing.png']), /file not found/);
    // a link inside the project to a file outside it is outside
    let linked = false;
    try { symlinkSync(photo, join(root, 'photo-link.png')); linked = true; } catch { /* no symlink rights (Windows without developer mode) */ }
    if (linked) await assert.rejects(g(['photo-link.png']), /outside the project folder/);
    assert.deepEqual(sent(), [], 'nothing was sent');
    // the user's own image inside the project, by its project path: uploaded as an image
    const ok = await paid({ kind: 'image', provider: 'gemini', prompt: 'restyle', refs: ['tiny.png'], outDir: job });
    assert.equal(ok.files.length, 1);
    const part = sent()[0].body.contents[0].parts[1].inlineData;
    assert.equal(part.mimeType, 'image/png');
    assert.equal(part.data, readFileSync(PNG).toString('base64'));
  } finally { rmSync(outside, { recursive: true, force: true }); }
});

test('outDir: a link inside the project that leads outside it counts as outside', async () => {
  const outside = realpathSync(mkdtempSync(join(tmpdir(), 'easel-outside-')));
  try {
    mkdirSync(join(root, 'real-jobs'), { recursive: true });
    assert.equal(o.realInsideRoot(join(root, 'not', 'made', 'yet'), root), true);
    assert.equal(o.realInsideRoot(join(outside, 'x'), root), false);
    await assert.rejects(m.generate({ kind: 'image', provider: 'openai', prompt: 'x', outDir: outside }), /outDir must be inside the project folder/);
    // junctions need no special rights on Windows; elsewhere the type is ignored
    let linked = false;
    try { symlinkSync(outside, join(root, 'out-link'), 'junction'); symlinkSync(join(root, 'real-jobs'), join(root, 'in-link'), 'junction'); linked = true; } catch { /* links not allowed here */ }
    if (linked) {
      await assert.rejects(m.generate({ kind: 'image', provider: 'openai', prompt: 'x', outDir: 'out-link/job' }), /leads outside it through a link/);
      await assert.rejects(m.generate({ kind: 'image', provider: 'openai', prompt: 'x', outDir: 'out-link/job', confirm: true, quote: '000000000000' }), /leads outside it through a link/);
      assert.deepEqual(readdirSync(outside), [], 'nothing was written outside the project');
      // a link that stays inside the project is fine
      const ok = await paid({ kind: 'image', provider: 'openai', prompt: 'x', outDir: 'in-link/job' });
      assert.ok(existsSync(join(root, 'real-jobs', 'job', 'image.png')), JSON.stringify(ok));
    }
    assert.deepEqual(sent().filter((q) => q.method === 'POST').length, linked ? 1 : 0);
  } finally { rmSync(outside, { recursive: true, force: true }); }
});

test('count > 1 as one call per image (Gemini, Atlas): a failure part-way keeps and logs the images already paid for; Atlas returns what it charges for', async () => {
  const img = { candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: readFileSync(PNG).toString('base64') } }] } }] };
  const ok = { method: 'POST', match: ':generateContent', json: img };
  await withFixtures(fixtures({ 'gemini.json': { routes: [ok, ok, ok, { method: 'POST', match: ':generateContent', status: 429, json: { error: { code: 429, message: 'Resource has been exhausted' } } }] } }), async () => {
    const job = join(root, 'partial');
    await assert.rejects(paid({ kind: 'image', provider: 'gemini', prompt: 'a kite', count: 4, name: 'kite', outDir: job }), /HTTP 429[\s\S]*3 of 4 were made and charged before this failed; they are saved: kite-1\.png, kite-2\.png, kite-3\.png/);
    assert.equal(sent().filter((q) => q.method === 'POST').length, 4);
    assert.deepEqual(readdirSync(job).filter((f) => f.endsWith('.png')).sort(), ['kite-1.png', 'kite-2.png', 'kite-3.png']);
    const last = jobs(job).at(-1);
    assert.deepEqual([last.status, last.requested, last.paid, last.saved, last.files.length], ['partial', 4, 3, 3, 3]);
    assert.match(last.error, /429/);
    assert.equal(JSON.parse(readFileSync(join(job, 'provenance.json'), 'utf8')).assets.length, 3);
  });
  // a failure on the first call: nothing was made, nothing to keep
  await withFixtures(fixtures({ 'gemini.json': { routes: [{ method: 'POST', match: ':generateContent', status: 429, json: { error: { code: 429 } } }] } }), async () => {
    const job = join(root, 'partial-0');
    await assert.rejects(paid({ kind: 'image', provider: 'gemini', prompt: 'a kite', count: 4, outDir: job }), (e) => /HTTP 429/.test(e.message) && !/were made/.test(e.message));
    assert.equal(jobs(job).at(-1).status, 'failed');
  });
  // Atlas: count images, the size as an aspect ratio; the estimate and the files agree
  const routes = [1, 2, 3].flatMap((i) => [
    { method: 'POST', match: '/model/generateImage', json: { data: { id: `n${i}` } } },
    { match: `/model/prediction/n${i}`, json: { data: { status: 'completed', outputs: [`https://oss.atlascloud.ai/n${i}.png`] } } },
    { match: `oss.atlascloud.ai/n${i}.png`, file: 'tiny.png', contentType: 'image/png' },
  ]);
  await withFixtures(fixtures({ 'atlas.json': { routes }, 'tiny.png': readFileSync(PNG) }), async () => {
    const req = { kind: 'image', provider: 'atlas', prompt: 'a kite', count: 3, size: '1536x1024', name: 'kite', outDir: join(root, 'atlas-n') };
    const est = m.estimate(req);
    assert.equal(est.usd, 0.24);
    assert.match(est.basis, /^3 x 0\.08 USD/);
    const r = await paid(req);
    assert.equal(r.files.length, 3, 'three images priced, three made');
    const posts = sent().filter((q) => q.provider === 'atlas' && q.method === 'POST');
    assert.equal(posts.length, 3);
    assert.ok(posts.every((q) => q.body.aspect_ratio === '3:2'), JSON.stringify(posts.map((q) => q.body)));
  });
});

test('a request that carries a key never follows a redirect off the provider\'s own hosts', async () => {
  // the decision
  assert.equal(m.keyedRedirect('elevenlabs', 'https://api.elevenlabs.io/v1/a', '/v1/b'), 'https://api.elevenlabs.io/v1/b');
  assert.equal(m.keyedRedirect('fal', 'https://queue.fal.run/x', 'https://rest.alpha.fal.ai/y'), 'https://rest.alpha.fal.ai/y');
  for (const [p, loc] of [['elevenlabs', 'https://evil.example/steal'], ['gemini', 'http://localhost:8080/steal'], ['gemini', 'https://generativelanguage.googleapis.com.evil.example/x'], ['openai', 'http://api.openai.com/v1/x'], ['fal', 'https://169.254.169.254/latest'], ['atlas', 'https://api.elevenlabs.io/v1/x']]) {
    assert.throws(() => m.keyedRedirect(p, `https://${m.KEY_HOSTS[p][0]}/v1/a`, loc), /refused to follow a redirect of a request that carries the key/, `${p} -> ${loc}`);
  }
  // live: fetch is told not to follow, and the hop is refused before anything is sent there
  const savedFetch = globalThis.fetch, savedFx = process.env.EASEL_MEDIA_FIXTURES, calls = [];
  delete process.env.EASEL_MEDIA_FIXTURES;
  try {
    globalThis.fetch = async (url, init) => { calls.push([String(url), init.method, init.redirect]); return new Response(null, { status: 307, headers: { location: 'https://evil.example/steal' } }); };
    for (const [p, url, headers] of [['elevenlabs', 'https://api.elevenlabs.io/v1/text-to-speech/v/with-timestamps', { 'xi-api-key': 'el-FAKE-123456' }], ['gemini', 'https://generativelanguage.googleapis.com/v1beta/models/m:generateContent', { 'x-goog-api-key': 'gm-FAKE-123456' }], ['openai', 'https://api.openai.com/v1/images/generations', { Authorization: 'Bearer sk-FAKE-123456' }]]) {
      calls.length = 0;
      await assert.rejects(m.request(p, { method: 'POST', url, headers, body: {} }), /refused to follow a redirect/, p);
      assert.deepEqual(calls, [[url, 'POST', 'manual']], p);
    }
    // a redirect on the provider's own host is followed (a 303 as a GET), checked again, key and all
    calls.length = 0;
    globalThis.fetch = async (url, init) => { calls.push([String(url), init.method, init.redirect, Object.keys(init.headers).includes('xi-api-key')]); return calls.length === 1 ? new Response(null, { status: 303, headers: { location: '/v1/result/1' } }) : new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } }); };
    const r = await m.request('elevenlabs', { method: 'POST', url: 'https://api.elevenlabs.io/v1/x', headers: { 'xi-api-key': 'el-FAKE-123456' }, body: {} });
    assert.deepEqual(r.json(), { ok: true });
    assert.deepEqual(calls, [['https://api.elevenlabs.io/v1/x', 'POST', 'manual', true], ['https://api.elevenlabs.io/v1/result/1', 'GET', 'manual', true]]);
  } finally { globalThis.fetch = savedFetch; process.env.EASEL_MEDIA_FIXTURES = savedFx; }
  // a whole call through the fixtures: refused, nothing goes to the other host, the failure is logged
  await withFixtures(fixtures({ 'elevenlabs.json': { routes: [{ method: 'POST', match: '/with-timestamps', status: 307, location: 'https://evil.example/steal', text: '' }] } }), async () => {
    const job = join(root, 'redir');
    await assert.rejects(paid({ kind: 'tts', provider: 'elevenlabs', text: 'Hi there', outDir: job }), /refused to follow a redirect/);
    assert.deepEqual(sent().map((q) => q.url.split('/')[2]), ['api.elevenlabs.io']);
    assert.equal(jobs(job).at(-1).status, 'failed');
  });
});

const onPath = (n) => String(process.env.PATH || '').split(delimiter).map((d) => join(d, process.platform === 'win32' ? `${n}.exe` : n)).find((f) => existsSync(f));
test('voice cloning: Easel\'s own output, silence, a clip too short for the statement and refusals in other words are not consent; names are job-folder names', { skip: ffmpeg ? false : 'needs ffmpeg' }, async () => {
  const job = join(root, 'clone2'); mkdirSync(job, { recursive: true });
  const statement = 'I, Jane Example, consent to my voice being cloned for the Harbor podcast narration, by the Harbor team, for use in episodes one to ten of season two and their trailers. I can withdraw this consent at any time.';
  const good = { speaker: 'Jane Example', statement, purpose: 'podcast narration', date: '2026-10-11', recording: 'my consent.wav' };
  wav(join(job, 'my consent.wav'), 12);
  wav(join(job, 'sample-1.wav'), 3);
  const cf = join(job, 'consent.json');
  const base = { kind: 'voice-clone', provider: 'elevenlabs', voiceName: 'Jane', outDir: job };
  const check = async (patch = {}, extra = {}) => { writeFileSync(cf, JSON.stringify({ ...good, ...patch })); return m.generate({ ...base, samples: ['sample-1.wav'], consentFile: 'consent.json', ...extra }); };
  // consentFile, the recording (a name with a space) and the samples by their names in the job folder
  const dry = await check();
  assert.equal(dry.dryRun, true, JSON.stringify(dry));
  assert.match((await check({}, { consentFile: 'easel-out/clone2/consent.json' })).reason, /not in the job folder .*relative to the job folder/);
  // the recording must be long enough to read the statement aloud (3.5 words a second at most)
  assert.equal(c.statementWords(statement), 39);
  assert.equal(c.minRecordingSeconds(statement), 39 / 3.5);
  assert.equal(c.minRecordingSeconds('I, Al Bo, consent.'), 2);
  wav(join(job, 'tone.wav'), 2.05);
  assert.match((await check({ recording: 'tone.wav' })).reason, /tone\.wav is 2\.\d s long: reading the statement \(39 words\) aloud takes at least 11\.1 s/);
  // silence and near-silence, as the recording or a sample
  const lav = (name, spec) => { const r = spawnSync(ffmpeg.path, ['-y', '-v', 'error', '-f', 'lavfi', '-i', spec, '-t', '12', join(job, name)], { encoding: 'utf8', windowsHide: true }); assert.equal(r.status, 0, r.stderr); };
  lav('silence.wav', 'anullsrc=r=16000:cl=mono');
  lav('quiet.wav', 'sine=frequency=220:duration=12,volume=-45dB');
  assert.match((await check({ recording: 'silence.wav' })).reason, /silence\.wav is near-silent \(mean -\d+\.\d dB, peak -\d+\.\d dB\)/);
  assert.match((await check({ recording: 'quiet.wav' })).reason, /quiet\.wav is near-silent/);
  assert.match((await check({}, { samples: ['silence.wav'] })).reason, /voice sample silence\.wav is near-silent/);
  writeFileSync(join(job, 'KEY.keystore'), 'x'.repeat(4096));
  assert.match((await check({}, { samples: ['KEY.keystore'] })).reason, /voice sample KEY\.keystore is not an audio recording/);
  // refusing, withholding or taking back consent in other words; real statements of consent pass
  const REFUSE = ['I, Jane Example, do ｎｏｔ consent to my voice being cloned.', 'I, Jane Example, give no consent for cloning.', 'I, Jane Example, withhold consent to cloning.', 'I, Jane Example, hereby revoke my consent.', 'I, Jane Example, am cloned without consent.', 'I, Jane Example, am cloned without my consent.', 'I, Jane Example, don’t consent to any cloning.', 'I, Jane Example, do not give consent.', 'I, Jane Example, will never consent.', 'I, Jane Example, do n​ot consent.', 'I, Jane Example, refuse to consent.', 'I, Jane Example, no longer consent.', 'I, Jane Example, consent. My consent is hereby withdrawn.'];
  for (const s of REFUSE) { assert.equal(c.refusesConsent(s), true, s); assert.match((await check({ statement: s })).reason, /does not give consent/, s); }
  const ACCEPT = ['I, Jane Example, consent to my voice being cloned for the podcast. It must not be used for anything else without my consent.', 'I, Jane Example, consent to my voice being cloned for narration. Nobody may use it without my consent for anything else.', 'I, Jane Example, give my full consent to my voice being cloned for narration. I may revoke this consent at any time.', statement];
  for (const s of ACCEPT) { assert.equal(c.refusesConsent(s), false, s); assert.equal((await check({ statement: s })).dryRun, true, s); }
  // the speaker is named as a whole name, not as part of a word
  assert.match((await check({ speaker: 'Al', statement: 'I consent to this voice being cloned for whatever anyone always likes.' })).reason, /name the speaker in full/);
  // Easel's own speech is never the recording or a sample: by its name, renamed, or copied from another job
  const fx = mkdtempSync(join(tmpdir(), 'easel-fx-'));
  assert.equal(spawnSync(ffmpeg.path, ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'sine=frequency=180:duration=12', join(fx, 'speech.mp3')], { windowsHide: true }).status, 0);
  writeFileSync(join(fx, 'openai.json'), JSON.stringify({ routes: [{ method: 'POST', match: '/v1/audio/speech', file: 'speech.mp3', contentType: 'audio/mpeg', repeat: true }] }));
  await withFixtures(fx, async () => {
    await paid({ kind: 'tts', provider: 'openai', text: statement, name: 'consent', outDir: job });
    await paid({ kind: 'tts', provider: 'openai', text: 'Some words for a sample.', name: 'sample', outDir: join(root, 'other-job') });
  });
  assert.match((await check({ recording: 'consent.mp3' })).reason, /consent recording consent\.mp3 was made by Easel/);
  copyFileSync(join(job, 'consent.mp3'), join(job, 'take 2.mp3'));
  assert.match((await check({ recording: 'take 2.mp3' })).reason, /take 2\.mp3 was made by Easel/);
  copyFileSync(join(root, 'other-job', 'sample.mp3'), join(job, 'sample-2.mp3'));
  assert.match((await check({}, { samples: ['sample-1.wav', 'sample-2.mp3'] })).reason, /voice sample sample-2\.mp3 was made by Easel/);
  assert.match((await check({}, { samples: ['consent.mp3'] })).reason, /voice sample consent\.mp3 was made by Easel/);
  // the outputs ledger: the plugin's data folder when it is set (all projects), and the project's
  const data = mkdtempSync(join(tmpdir(), 'easel-data-')), h = 'f'.repeat(64);
  try {
    o.recordOutputs([{ sha256: h }], 'tts', { EASEL_MEDIA_DATA: data });
    assert.equal(o.knownOutputs(job, { EASEL_MEDIA_DATA: data }).hashes.has(h), true);
    assert.equal(o.knownOutputs(job, {}).hashes.has(h), false);
    assert.deepEqual(o.ledgerFiles({ EASEL_MEDIA_DATA: '${CLAUDE_PLUGIN_DATA}' }, root), [join(root, 'easel-out', '.media-outputs.jsonl')], 'an unexpanded data folder counts as unset');
  } finally { rmSync(data, { recursive: true, force: true }); }
  // without ffmpeg the recording cannot be checked: refused, never waved through
  const ffprobePath = onPath('ffprobe');
  if (ffprobePath) {
    const saved = { PATH: process.env.PATH, LOCALAPPDATA: process.env.LOCALAPPDATA, EASEL_FFPROBE: process.env.EASEL_FFPROBE, EASEL_FFMPEG: process.env.EASEL_FFMPEG };
    Object.assign(process.env, { PATH: '', LOCALAPPDATA: '', EASEL_FFPROBE: ffprobePath }); delete process.env.EASEL_FFMPEG;
    try { assert.match((await check()).reason, /cannot be checked for sound: ffmpeg was not found/); }
    finally { for (const [k, v] of Object.entries(saved)) if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  }
  // a real recording still passes; the clone is made and logged with the job-folder names
  writeFileSync(cf, JSON.stringify(good));
  const made = await paid({ ...base, samples: ['sample-1.wav'], consentFile: 'consent.json' });
  assert.equal(JSON.parse(readFileSync(made.files[0].file, 'utf8')).voice_id, 'v_123');
  const log = readFileSync(join(job, 'consent-log.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual([log.length, log[0].recording, log[0].samples, log[0].consentFile], [1, 'my consent.wav', ['sample-1.wav'], 'consent.json']);
});

test('the MCP server lists five tools, answers a dry run, a confirmed call and an error, and never prints a key', async () => {
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
  // a confirmed call (its quote from a dry run in this process: the quote's key is in the shared data
  // folder, so it survives a restart), a provider error that echoes the key back, and a confirm
  // without a quote, all over stdio
  const fx = fixtures({ 'gemini.json': readFileSync(join(FIX, 'gemini.json')), 'openai.json': { routes: [{ method: 'POST', match: '/v1/images/generations', status: 401, json: { error: { message: `Incorrect API key provided: ${KEYS.OPENAI_API_KEY}` } } }] } });
  const data = mkdtempSync(join(tmpdir(), 'easel-data-'));
  process.env.EASEL_MEDIA_DATA = data;
  try {
    const job = join(root, 'srv2'), kite = { kind: 'image', provider: 'gemini', prompt: 'a kite', outDir: job }, boat = { kind: 'image', provider: 'openai', prompt: 'a boat', outDir: job };
    const call = (id, args) => JSON.stringify({ jsonrpc: '2.0', id, method: 'tools/call', params: { name: 'generate', arguments: args } });
    const input = [call(1, { ...kite, confirm: true, quote: await quoteOf(kite) }), call(2, { ...boat, confirm: true, quote: await quoteOf(boat) }), call(3, { ...kite, name: 'again', confirm: true })].join('\n') + '\n';
    const r2 = spawnSync(process.execPath, [SERVER], { input, encoding: 'utf8', env: { ...env, EASEL_MEDIA_FIXTURES: fx, EASEL_MEDIA_DATA: data }, windowsHide: true });
    const res = Object.fromEntries(r2.stdout.trim().split('\n').map((l) => JSON.parse(l)).map((x) => [x.id, x.result]));
    assert.equal(res[1].isError, false, res[1].content[0].text);
    assert.match(res[1].content[0].text, /"files"/);
    assert.equal(res[2].isError, true);
    assert.match(res[2].content[0].text, /HTTP 401[\s\S]*Incorrect API key provided: sk-\*\*\*/);
    assert.match(res[3].content[0].text, /"refused": true[\s\S]*needs the quote/);
    noSecrets(r2.stdout + r2.stderr);
    for (const f of readdirSync(job)) noSecrets(readFileSync(join(job, f)).toString('latin1'));
  } finally { delete process.env.EASEL_MEDIA_DATA; for (const d of [fx, data]) rmSync(d, { recursive: true, force: true }); }
});
