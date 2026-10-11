// The fixes from the 2026-10-11 check (Q-02, Q-04, Q-17..Q-23): the consent statement, Easel's own
// audio after a re-encode, the quote (keyed, over the bytes of every file, all of it shown), what each
// adapter sends, the reference files, and paid calls that go wrong after the charge. No network:
// every call is answered from fixtures and recorded; the keys are fake.
import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import fs, { appendFileSync, copyFileSync, existsSync, linkSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { createHash, createHmac } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const FIX = fileURLToPath(new URL('./fixtures', import.meta.url));
const SERVER = fileURLToPath(new URL('../server.mjs', import.meta.url));
// a temporary project folder (job folders and references must be inside it) and the plugin's data
// folder (outside it, as ${CLAUDE_PLUGIN_DATA} is)
const root = realpathSync(mkdtempSync(join(tmpdir(), 'easel-safety-')));
const data = realpathSync(mkdtempSync(join(tmpdir(), 'easel-safety-data-')));
process.chdir(root);
const KEYS = { OPENAI_API_KEY: 'sk-FAKE-openai-111111', GEMINI_API_KEY: 'gm-FAKE-gemini-222222', FAL_KEY: 'fal-FAKE-333333', REPLICATE_API_TOKEN: 'r8-FAKE-444444', ATLASCLOUD_API_KEY: 'atl-FAKE-555555', ELEVENLABS_API_KEY: 'el-FAKE-666666' };
const rec = join(root, 'requests.jsonl');
for (const k of Object.keys(process.env)) if (/^EASEL_CFG_|^EASEL_MEDIA_MAX_USD$/.test(k)) delete process.env[k];
Object.assign(process.env, KEYS, { EASEL_MEDIA_FIXTURES: FIX, EASEL_MEDIA_RECORD: rec, EASEL_MEDIA_DATA: data });
const m = { ...(await import('../lib/media.mjs')), ...(await import('../lib/http.mjs')) };
const c = await import('../lib/consent.mjs');
const o = await import('../lib/outputs.mjs');
const { PROVIDERS } = await import('../providers/index.mjs');
const { findBinary } = await import('../lib/binaries.mjs');
const ffmpeg = findBinary('ffmpeg');
const needsFfmpeg = { skip: ffmpeg ? false : 'needs ffmpeg' };

const sha = (s) => createHash('sha256').update(s).digest('hex');
const sent = () => (existsSync(rec) ? readFileSync(rec, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
const jobs = (dir) => readFileSync(join(dir, 'jobs.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
beforeEach(() => { m.resetFixtures(); rmSync(rec, { force: true }); });
after(() => { process.chdir(tmpdir()); for (const d of [root, data]) rmSync(d, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }); });
const quoteOf = async (args) => { const dry = await m.generate({ ...args, confirm: undefined, quote: undefined }); assert.equal(dry.dryRun, true, JSON.stringify(dry)); return dry.quote; };
const paid = async (args) => m.generate({ ...args, confirm: true, quote: await quoteOf(args) });
const fixtures = (files) => { const d = mkdtempSync(join(tmpdir(), 'easel-fx-')); for (const [f, v] of Object.entries(files)) writeFileSync(join(d, f), typeof v === 'string' || Buffer.isBuffer(v) ? v : JSON.stringify(v)); return d; };
const withFixtures = async (dir, fn) => { const saved = process.env.EASEL_MEDIA_FIXTURES; process.env.EASEL_MEDIA_FIXTURES = dir; m.resetFixtures(); try { return await fn(); } finally { process.env.EASEL_MEDIA_FIXTURES = saved; m.resetFixtures(); rmSync(dir, { recursive: true, force: true }); } };
const PNG = join(root, 'tiny.png'); copyFileSync(join(FIX, 'tiny.png'), PNG);
const ff = (args) => { const r = spawnSync(ffmpeg.path, ['-y', '-v', 'error', ...args], { encoding: 'utf8', windowsHide: true }); assert.equal(r.status, 0, r.stderr); };
const tone = (file, seconds, hz = 220) => { ff(['-f', 'lavfi', '-i', `sine=frequency=${hz}:duration=${seconds}`, file]); return file; };
// speech-like: quiet edges, a level that moves (what a text-to-speech result looks like to ffmpeg)
const speech = (file, seconds) => { ff(['-f', 'lavfi', '-i', `sine=frequency=180:duration=${seconds}`, '-f', 'lavfi', '-i', `anoisesrc=a=0.05:d=${seconds}:seed=7`, '-filter_complex', `[0][1]amix=inputs=2,afade=t=in:d=0.3,afade=t=out:st=${seconds - 0.5}:d=0.4,adelay=200`, '-ar', '24000', '-ac', '1', file]); return file; };

test('consent (Q-02): refusals in other words are refused, consent in another language gets the English-only refusal, plain consent passes', needsFfmpeg, () => {
  const job = join(root, 'statements'); mkdirSync(job, { recursive: true });
  tone(join(job, 'consent.wav'), 16); tone(join(job, 'sample-1.wav'), 3, 330);
  const check = (speaker, statement) => {
    writeFileSync(join(job, 'consent.json'), JSON.stringify({ speaker, statement, purpose: 'podcast narration', date: '2026-10-11', recording: 'consent.wav' }));
    return c.checkConsent({ voiceName: 'v', samples: ['sample-1.wav'], consentFile: 'consent.json' }, job);
  };
  const ENGLISH_ONLY = /the consent check reads English only; record the statement in English \(a translation the speaker reads and agrees to\)/;
  // the ten from the check: seven English rewordings, then Spanish, French and Portuguese
  const REFUSE = [
    ['Jane Example', 'I, Jane Example, do not, under any circumstances, consent to my voice being cloned.'],
    ['Jane Example', 'I, Jane Example, state that consent is not given for cloning my voice.'],
    ['Jane Example', 'I, Jane Example, consent to nothing. My voice must not be cloned.'],
    ['Jane Example', 'I, Jane Example, give zero consent to cloning my voice.'],
    ['Jane Example', 'Do I, Jane Example, consent to my voice being cloned? No.'],
    ['Jane Example', 'I, Jane Example, object and am against consenting to any clone of my voice.'],
    ['Jane Example', 'I, Jane Example, do not want my voice cloned, even though I was asked to consent.'],
  ];
  for (const [speaker, s] of REFUSE) { const r = check(speaker, s); assert.equal(r.ok, false, s); assert.match(r.reason, /does not give consent/, s); assert.equal(c.refusesConsent(s), true, s); }
  const FOREIGN = [
    ['Maria Lopez', 'Yo, Maria Lopez, no doy mi consentimiento para que se clone mi voz.'],
    ['Marie Dupont', 'Moi, Marie Dupont, je ne donne pas mon consentement au clonage de ma voix.'],
    ['Ana Souza', 'Eu, Ana Souza, nao dou o meu consentimento para clonar a minha voz.'],
    ['Ana Souza', 'Eu, Ana Souza, não dou o meu consentimento para clonar a minha voz.'],
    ['ليلى حسن', 'أنا، ليلى حسن، لا أوافق على استنساخ صوتي.'],
    ['张伟', '我，张伟，不同意克隆我的声音。'],
    // and genuine consent in Spanish, Arabic and Chinese: the explicit English-only refusal, not a guess
    ['Maria Lopez', 'Yo, Maria Lopez, consiento que se clone mi voz para el podcast del equipo Harbor.'],
    ['ليلى حسن', 'أنا، ليلى حسن، أوافق على استنساخ صوتي لبودكاست هاربور.'],
    ['张伟', '我，张伟，同意为海港播客克隆我的声音。'],
  ];
  for (const [speaker, s] of FOREIGN) { const r = check(speaker, s); assert.equal(r.ok, false, s); assert.match(r.reason, ENGLISH_ONLY, s); }
  // fail safe: anything short of a plain yes in its own sentence is refused, with the reason
  const UNSURE = [
    ['I, Jane Example, consent to my voice being cloned for narration - not.', /sentence that gives consent also has "not" in it/],
    ['I, Jane Example, consent to my voice being cloned for narration. Just kidding.', /does not give consent/],
    ['I, Jane Example, consent to my voice being cloned for narration. No.', /does not give consent/],
    ['Do I, Jane Example, consent to my voice being cloned for narration? Yes.', /must say that the speaker consents[\s\S]*"I, Jane Example, consent to my voice being cloned/],
    ['I consent to my voice being cloned for narration. My name is Jane Example.', /must say that the speaker consents[\s\S]*"I, Jane Example, consent to my voice being cloned/],
    ['I, Jane Example, consent to cloning for narration.', /must say that the speaker consents/],
    ['I agree to this, Jane Example.', /must say that the speaker consents[\s\S]*reads English only/],
    ['I, Jane Example, consent to my voice being cloned for narration, but not for advertising.', /sentence that gives consent also has "not" in it[\s\S]*a sentence of its own/],
    ['I, Jane Example, consent to my voice being cloned for narration. Nobody may use it without my consent for anything else, I do not agree.', /does not give consent/],
  ];
  for (const [s, re] of UNSURE) { const r = check('Jane Example', s); assert.equal(r.ok, false, s); assert.match(r.reason, re, s); }
  // the forms accepted before still pass, and so do limits and rights in sentences of their own
  const ACCEPT = [
    ['Dana Reyes', 'I, Dana Reyes, consent to my voice being cloned for the Harbor podcast narration, by the Harbor team, for use in episodes 1-10. Nobody may use it without my consent for anything else.'],
    ['Jane Example', 'I, Jane Example, consent to my voice being cloned for the podcast. It must not be used for anything else without my consent.'],
    ['Jane Example', 'I, Jane Example, consent to my voice being cloned for narration. Nobody may use it without my consent for anything else.'],
    ['Jane Example', 'I, Jane Example, give my full consent to my voice being cloned for narration. I may revoke this consent at any time.'],
    ['Jane Example', 'I, Jane Example, consent to my voice being cloned for the Harbor podcast narration, by the Harbor team, for use in episodes one to ten of season two and their trailers. I can withdraw this consent at any time.'],
    ['Jane Example', 'I, Jane Example, consent to my voice being cloned for a demo, by Easel, for use in this project.'],
    ['Jane Example', 'I, Jane Example, consent to my voice being cloned for narration. It must not be used for advertising.'],
    ['Jane Example', 'I, Jane Example, hereby consent to the Harbor team cloning my voice for narration. I give this consent freely and have not been pressured.'],
    // an English statement from a speaker whose name is in another script, or has accents; places
    // and names that are also words in other languages do not make it foreign
    ['ليلى حسن', 'I, ليلى حسن, consent to my voice being cloned for the Harbor podcast, recorded in Los Angeles and Las Vegas.'],
    ['José Núñez', 'I, José Núñez, consent to my voice being cloned for the café podcast, an MIT-licensed project.'],
  ];
  for (const [speaker, s] of ACCEPT) { const r = check(speaker, s); assert.equal(r.ok, true, `${s}: ${r.reason}`); assert.equal(c.refusesConsent(s), false, s); }
});

test('consent (Q-17): Easel\'s own speech is recognised after a re-encode or an appended byte, as the recording or a sample', needsFfmpeg, async () => {
  const job = join(root, 'own'); mkdirSync(job, { recursive: true });
  const statement = 'I, Jane Example, consent to my voice being cloned for a demo, by Easel, for use in this project.';
  const fx = mkdtempSync(join(tmpdir(), 'easel-fx-'));
  speech(join(fx, 'speech.mp3'), 8);
  writeFileSync(join(fx, 'openai.json'), JSON.stringify({ routes: [{ method: 'POST', match: '/v1/audio/speech', file: 'speech.mp3', contentType: 'audio/mpeg', repeat: true }] }));
  await withFixtures(fx, async () => { await paid({ kind: 'tts', provider: 'openai', text: statement, name: 'statement', outDir: job }); });
  // the ledger in the data folder holds the decoded-audio hash as well as the file's
  const line = readFileSync(join(data, 'outputs.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l)).at(-1);
  assert.match(line.pcm || '', /^[0-9a-f]{64}$/, JSON.stringify(line));
  assert.equal(line.sha256, o.fileSha256(join(job, 'statement.mp3')));
  ff(['-i', join(job, 'statement.mp3'), join(job, 'rec.wav')]);
  copyFileSync(join(job, 'statement.mp3'), join(job, 'plus1.mp3')); appendFileSync(join(job, 'plus1.mp3'), '\n');
  assert.notEqual(o.fileSha256(join(job, 'plus1.mp3')), line.sha256);
  assert.equal(o.pcmSha256(join(job, 'rec.wav')), line.pcm, 'a re-encode decodes to the same audio');
  assert.equal(o.pcmSha256(join(job, 'plus1.mp3')), line.pcm);
  assert.equal(o.pcmSha256(PNG), null, 'no audio, no hash');
  tone(join(job, 'sample-1.wav'), 3, 330);
  const check = (recording, samples = ['sample-1.wav']) => {
    writeFileSync(join(job, 'consent.json'), JSON.stringify({ speaker: 'Jane Example', statement, purpose: 'demo narration', date: '2026-10-11', recording }));
    return c.checkConsent({ voiceName: 'v', samples, consentFile: 'consent.json' }, job);
  };
  assert.match(check('rec.wav').reason, /consent recording rec\.wav was made by Easel/);
  assert.match(check('plus1.mp3').reason, /consent recording plus1\.mp3 was made by Easel/);
  tone(join(job, 'real.wav'), 8);
  assert.match(check('real.wav', ['sample-1.wav', 'rec.wav']).reason, /voice sample rec\.wav was made by Easel/);
  assert.match(check('real.wav', ['plus1.mp3']).reason, /voice sample plus1\.mp3 was made by Easel/);
  assert.equal(check('real.wav').ok, true, 'a recording Easel did not make still passes');
});

test('quote (Q-18): keyed with a secret in the data folder; a quote worked out without it is refused', async () => {
  const req = { kind: 'image', provider: 'openai', prompt: 'a paper boat', size: '1024x1024', outDir: join(root, 'forge'), name: 'boat' };
  // the quote algorithm before this fix, computed without the server (as the check did)
  const norm = { provider: 'openai', model: 'gpt-image-1', kind: 'image', count: 1, size: '1024x1024', aspect: null, quality: null, resolution: null, seconds: null, voice: null, language: null, instructions: null, voiceName: null, refs: [], samples: [], prompt: sha('a paper boat'), text: null, usd: 0.042 };
  const forged = sha(JSON.stringify(norm)).slice(0, 12);
  const first = await m.generate({ ...req, confirm: true, quote: forged });
  assert.equal(first.refused, true, JSON.stringify(first));
  assert.deepEqual(sent(), [], 'nothing was paid for');
  const dry = await m.generate(req);
  const keyFile = join(data, 'quote.key');
  assert.ok(existsSync(keyFile), 'the secret is made on first use, in the data folder');
  const secret = readFileSync(keyFile, 'utf8').trim();
  assert.match(secret, /^[0-9a-f]{64}$/);
  if (process.platform !== 'win32') assert.equal(statSync(keyFile).mode & 0o777, 0o600, 'readable by this user only');
  assert.ok(!JSON.stringify(dry).includes(secret));
  // the quoted material, unkeyed or keyed with anything else: refused
  const material = JSON.stringify(m.quoteMaterial(req, m.estimate(req), {}));
  for (const q of [sha(material).slice(0, 12), createHmac('sha256', 'not-the-secret').update(material).digest('hex').slice(0, 12)]) {
    assert.notEqual(q, dry.quote);
    assert.match((await m.generate({ ...req, confirm: true, quote: q })).reason, /not the one that was quoted/);
  }
  assert.equal(createHmac('sha256', Buffer.from(secret, 'hex')).update(material).digest('hex').slice(0, 12), dry.quote);
  assert.deepEqual(sent(), []);
  // another install (another data folder) has another secret
  const other = mkdtempSync(join(tmpdir(), 'easel-safety-other-'));
  try {
    process.env.EASEL_MEDIA_DATA = other;
    assert.notEqual((await m.generate(req)).quote, dry.quote);
    assert.equal((await m.generate({ ...req, confirm: true, quote: dry.quote })).refused, true);
  } finally { process.env.EASEL_MEDIA_DATA = data; rmSync(other, { recursive: true, force: true }); }
  assert.equal((await m.generate(req)).quote, dry.quote, 'the same request on the same install keeps its quote');
  // a restart (another server process, the same data folder) takes the quote; the secret is never printed
  const job = join(root, 'forge2'), boat = { ...req, outDir: job };
  const input = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'generate', arguments: { ...boat, confirm: true, quote: await quoteOf(boat) } } }) + '\n';
  const r = spawnSync(process.execPath, [SERVER], { input, encoding: 'utf8', env: { ...process.env }, windowsHide: true });
  const res = JSON.parse(r.stdout.trim().split('\n')[0]).result;
  assert.equal(res.isError, false, res.content[0].text);
  assert.match(res.content[0].text, /"files"/);
  assert.ok(!(r.stdout + r.stderr).includes(secret));
  for (const f of readdirSync(job)) assert.ok(!readFileSync(join(job, f), 'latin1').includes(secret), f);
});

test('quote (Q-19): it covers the bytes of each reference and sample, not just their names', async () => {
  const job = join(root, 'swap');
  copyFileSync(PNG, join(root, 'photo.png'));
  const req = { kind: 'image', provider: 'gemini', prompt: 'restyle', refs: ['photo.png'], outDir: job };
  const dry = await m.generate(req);
  const other = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR42mNgYGAAAAAEAAHI6uv5AAAAAElFTkSuQmCC', 'base64');
  writeFileSync(join(root, 'photo.png'), other); // another valid image under the same name
  const r = await m.generate({ ...req, confirm: true, quote: dry.quote });
  assert.equal(r.refused, true, JSON.stringify(r));
  assert.match(r.reason, /not the one that was quoted/);
  assert.deepEqual(sent(), []);
  const ok = await paid(req);
  assert.equal(ok.files.length, 1);
  assert.equal(sent()[0].body.contents[0].parts[1].inlineData.data, other.toString('base64'), 'the bytes that were quoted are the bytes sent');
});

test('quote (Q-19): a voice sample changed after the dry run needs a new one', needsFfmpeg, async () => {
  const job = join(root, 'swap-voice'); mkdirSync(job, { recursive: true });
  tone(join(job, 'consent.wav'), 8); tone(join(job, 'sample-1.wav'), 3, 330);
  writeFileSync(join(job, 'consent.json'), JSON.stringify({ speaker: 'Jane Example', statement: 'I, Jane Example, consent to my voice being cloned for narration.', purpose: 'narration', date: '2026-10-11', recording: 'consent.wav' }));
  const req = { kind: 'voice-clone', provider: 'elevenlabs', voiceName: 'Jane', samples: ['sample-1.wav'], consentFile: 'consent.json', outDir: job };
  const dry = await m.generate(req);
  assert.equal(dry.dryRun, true, JSON.stringify(dry));
  tone(join(job, 'sample-1.wav'), 3, 440);
  assert.match((await m.generate({ ...req, confirm: true, quote: dry.quote })).reason, /not the one that was quoted/);
  assert.deepEqual(sent(), []);
});

test('preview (Q-20): the dry run shows every field the quote covers', async () => {
  // the quoted material has exactly these fields; a new one must be added to the preview too
  const FIELDS = ['provider', 'model', 'kind', 'count', 'size', 'aspect', 'quality', 'resolution', 'seconds', 'voice', 'language', 'instructions', 'voiceName', 'refs', 'samples', 'prompt', 'text', 'sent', 'usd'];
  assert.deepEqual(Object.keys(m.quoteMaterial({ kind: 'image' }, { provider: 'openai', model: 'gpt-image-1', usd: 0 }, {})), FIELDS);
  const reqs = [
    { kind: 'image', provider: 'atlas', prompt: 'a kite', resolution: '2k', aspect: '16:9', count: 2 },
    { kind: 'image', provider: 'openai', prompt: 'a kite', aspect: '9:16', quality: 'high', refs: ['tiny.png'], count: 2 },
    { kind: 'image', provider: 'fal', model: 'fal-ai/z-image/turbo', prompt: 'a kite', size: '1024x768' },
    { kind: 'tts', provider: 'openai', text: 'Hello there.', voice: 'alloy', instructions: 'whisper, slowly' },
    { kind: 'tts', provider: 'atlas', text: 'Hello there.', voice: 'f8cf5c2c78d4', language: 'en' },
    { kind: 'video', provider: 'fal', prompt: 'the kite rises', refs: ['tiny.png'], seconds: 7 },
  ];
  for (const req of reqs) {
    const dry = await m.generate({ ...req, outDir: join(root, 'preview') });
    const est = m.estimate(req), { sent: values } = m.planRequest(req, est.provider, est.model);
    const material = m.quoteMaterial(req, est, { refs: (req.refs || []).map((f) => ({ file: f, sha256: 'x' })) }, values);
    for (const [k, v] of Object.entries(material)) {
      if (k === 'usd') { assert.equal(dry.estimate.usd, v); continue; }
      if (v === null || (Array.isArray(v) && !v.length)) continue;
      assert.ok(Object.hasOwn(dry.request, k), `${JSON.stringify(req)}: ${k} is quoted but not shown`);
    }
  }
  const atlas = await m.generate({ ...reqs[0], outDir: join(root, 'preview') });
  assert.equal(atlas.request.resolution, '2k');
  assert.equal(atlas.estimate.usd, 0.24, '2 x 0.12 at 2k');
  const tts = await m.generate({ ...reqs[3], outDir: join(root, 'preview') });
  assert.equal(tts.request.instructions, 'whisper, slowly');
  // a value sent in another form is shown as it is sent
  const kite = await m.generate({ ...reqs[1], outDir: join(root, 'preview') });
  assert.deepEqual(kite.request.sent, { size: '1024x1536' });
  assert.match(kite.request.notes.join(' '), /aspect 9:16 is sent as size 1024x1536/);
  const clip = await m.generate({ ...reqs[5], outDir: join(root, 'preview') });
  assert.deepEqual(clip.request.sent, { seconds: 10 });
  assert.deepEqual(sent(), []);
});

// Every provider at once, answering whatever the adapters ask (count 2 where a call makes several).
const ALL = () => fixtures({
  'tiny.png': readFileSync(PNG), 'tiny.mp4': readFileSync(join(FIX, 'tiny.mp4')), 'tiny.mp3': readFileSync(join(FIX, 'tiny.mp3')),
  'openai.json': { routes: [
    { method: 'POST', match: '/v1/images/', json: { data: [{ b64_json: readFileSync(PNG).toString('base64') }, { b64_json: readFileSync(PNG).toString('base64') }] }, repeat: true },
    { method: 'POST', match: '/v1/audio/speech', file: 'tiny.mp3', contentType: 'audio/mpeg', repeat: true }] },
  'gemini.json': { routes: [{ method: 'POST', match: ':generateContent', json: { candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: readFileSync(PNG).toString('base64') } }] } }] }, repeat: true }] },
  'fal.json': { routes: [
    { method: 'POST', match: 'queue.fal.run/', json: { request_id: 'r1', status_url: 'https://queue.fal.run/x/requests/r1/status', response_url: 'https://queue.fal.run/x/requests/r1' }, repeat: true },
    { match: '/requests/r1/status', json: { status: 'COMPLETED' }, repeat: true },
    { match: '/requests/r1', json: { images: [{ url: 'https://v3.fal.media/files/a.png' }, { url: 'https://v3.fal.media/files/b.png' }], video: { url: 'https://v3.fal.media/files/clip.mp4' } }, repeat: true },
    { match: 'v3.fal.media/files/clip.mp4', file: 'tiny.mp4', contentType: 'video/mp4', repeat: true },
    { match: 'v3.fal.media/files/', file: 'tiny.png', contentType: 'image/png', repeat: true }] },
  'replicate.json': { routes: [
    { method: 'POST', match: '/predictions', json: { id: 'p1', status: 'succeeded', output: ['https://replicate.delivery/x/a.webp', 'https://replicate.delivery/x/b.webp'], urls: { get: 'https://api.replicate.com/v1/predictions/p1' } }, repeat: true },
    { match: 'replicate.delivery/x/', file: 'tiny.png', contentType: 'image/webp', repeat: true }] },
  'atlas.json': { routes: [
    { method: 'POST', match: '/model/uploadMedia', json: { data: { download_url: 'https://oss.atlascloud.ai/up/key.png' } }, repeat: true },
    { method: 'POST', match: '/model/generate', json: { data: { id: 'a1' } }, repeat: true },
    { match: '/model/prediction/a1', json: { data: { status: 'completed', outputs: ['https://oss.atlascloud.ai/out/a1.bin'] } }, repeat: true },
    { match: 'oss.atlascloud.ai/out/', file: 'tiny.png', contentType: 'application/octet-stream', repeat: true }] },
  'elevenlabs.json': { routes: [
    { method: 'POST', match: '/with-timestamps', json: { audio_base64: readFileSync(join(FIX, 'tiny.mp3')).toString('base64'), alignment: { characters: ['H', 'i'], character_start_times_seconds: [0, 0.1], character_end_times_seconds: [0.1, 0.2] } }, repeat: true },
    { method: 'POST', match: '/v1/voices/add', json: { voice_id: 'v_9' }, repeat: true }] },
});

test('adapters (Q-04): every argument shown in the dry run reaches the provider\'s request, or is refused before any spend', async () => {
  // every generate argument is either checked against what the adapter takes, or changes nothing sent
  const { tools } = await import('../tools.mjs');
  const { REQUEST_ARGS } = await import('../providers/index.mjs');
  for (const k of Object.keys(tools.generate.inputSchema.properties)) assert.ok(REQUEST_ARGS.includes(k) || ['kind', 'provider', 'model', 'confirm', 'quote', 'approvedUsd', 'name', 'slug', 'outDir', 'consentFile'].includes(k), `generate argument ${k} is neither checked against the adapter nor known to change nothing sent`);
  const posts = () => sent().filter((q) => q.method === 'POST');
  const body = () => posts().at(-1).body, form = () => posts().at(-1).form;
  const P = 'a kite over the sea';
  const VALUES = { prompt: P, text: 'Hello there.', refs: [PNG], count: 2, size: '1024x1024', aspect: '1:1', quality: 'high', resolution: '1k', seconds: 5, voice: 'v1', language: 'en', instructions: 'calm', voiceName: 'Narrator', samples: ['sample-1.wav'] };
  // [provider, kind, model, the arguments it takes, where each one is in what was sent]
  const CASES = [
    ['openai', 'image', 'gpt-image-1', { prompt: P, refs: [PNG], count: 2, aspect: '9:16', quality: 'high' }, () => { const f = form(); assert.deepEqual([f.prompt, f.n, f.size, f.quality, f['image[]'].length], [[P], ['2'], ['1024x1536'], ['high'], 1]); }],
    ['openai', 'image', 'gpt-image-1', { prompt: P, count: 2, size: '1536x1024', quality: 'low' }, () => { const b = body(); assert.deepEqual([b.prompt, b.n, b.size, b.quality], [P, 2, '1536x1024', 'low']); }],
    ['openai', 'tts', 'gpt-4o-mini-tts', { text: 'Hello there.', voice: 'nova', instructions: 'calm' }, () => { const b = body(); assert.deepEqual([b.input, b.voice, b.instructions], ['Hello there.', 'nova', 'calm']); }],
    ['gemini', 'image', 'gemini-2.5-flash-image', { prompt: P, refs: [PNG], count: 2, aspect: '9:16' }, () => { assert.equal(posts().length, 2); const b = body(); assert.deepEqual([b.contents[0].parts[0].text, b.contents[0].parts.length, b.generationConfig.imageConfig.aspectRatio], [P, 2, '9:16']); }],
    ['gemini', 'image', 'gemini-2.5-flash-image', { prompt: P, size: '1536x1024' }, () => assert.equal(body().generationConfig.imageConfig.aspectRatio, '3:2')],
    ['fal', 'image', 'fal-ai/nano-banana', { prompt: P, refs: [PNG], count: 2, aspect: '4:5' }, () => { const q = posts().at(-1), b = q.body; assert.match(q.url, /nano-banana\/edit$/); assert.deepEqual([b.prompt, b.num_images, b.aspect_ratio, b.image_urls.length], [P, 2, '4:5', 1]); }],
    ['fal', 'image', 'fal-ai/nano-banana-2', { prompt: P, count: 2, size: '1024x1024' }, () => { const b = body(); assert.deepEqual([b.prompt, b.num_images, b.aspect_ratio], [P, 2, '1:1']); }],
    ['fal', 'image', 'fal-ai/z-image/turbo', { prompt: P, count: 2, size: '1024x768' }, () => { const b = body(); assert.deepEqual([b.prompt, b.num_images, b.image_size], [P, 2, { width: 1024, height: 768 }]); }],
    ['fal', 'video', 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video', { prompt: P, refs: [PNG], seconds: 10 }, () => { const b = body(); assert.deepEqual([b.prompt, b.image_url.slice(0, 22), b.duration], [P, 'data:image/png;base64,', '10']); }],
    ['replicate', 'image', 'black-forest-labs/flux-schnell', { prompt: P, count: 2, aspect: '16:9' }, () => { const b = body().input; assert.deepEqual([b.prompt, b.num_outputs, b.aspect_ratio], [P, 2, '16:9']); }],
    ['atlas', 'image', 'google/nano-banana-2/text-to-image', { prompt: P, count: 2, aspect: '9:16', resolution: '2k' }, () => { assert.equal(posts().length, 2); const b = body(); assert.deepEqual([b.prompt, b.aspect_ratio, b.resolution], [P, '9:16', '2k']); }],
    ['atlas', 'video', 'google/gemini-omni-flash/image-to-video', { prompt: P, refs: [PNG], seconds: 4, aspect: '9:16' }, () => { const b = body(); assert.deepEqual([b.prompt, b.image, b.duration, b.aspect_ratio], [P, 'https://oss.atlascloud.ai/up/key.png', 4, '9:16']); }],
    ['atlas', 'tts', 'xai/tts-v1', { text: 'Hello there.', voice: 'f8cf5c2c78d4', language: 'en' }, () => { const b = body(); assert.deepEqual([b.text, b.voice_id, b.language], ['Hello there.', 'f8cf5c2c78d4', 'en']); }],
    ['atlas', 'music', 'minimax/music-2.6', { prompt: P }, () => assert.equal(body().prompt, P)],
    ['elevenlabs', 'tts', 'eleven_flash_v2_5', { text: 'Hello there.', voice: 'JBFq' }, () => { const q = posts().at(-1); assert.match(q.url, /text-to-speech\/JBFq\/with-timestamps/); assert.deepEqual([q.body.text, q.body.model_id], ['Hello there.', 'eleven_flash_v2_5']); }],
  ];
  const fx = ALL();
  await withFixtures(fx, async () => {
    for (const [provider, kind, model, args, check] of CASES) {
      const req = { kind, provider, model, ...args, outDir: join(root, 'adapters'), approvedUsd: 5 };
      const dry = await m.generate(req);
      assert.equal(dry.dryRun, true, JSON.stringify(dry));
      for (const k of Object.keys(args)) assert.ok(Object.hasOwn(dry.request, k), `${provider} ${model}: ${k} is not shown`);
      m.resetFixtures(); rmSync(rec, { force: true });
      const r = await m.generate({ ...req, confirm: true, quote: dry.quote });
      assert.ok(r.files && r.files.length >= 1, `${provider} ${model}: ${JSON.stringify(r)}`);
      check();
    }
    // and the arguments a model does not take: refused in the dry run, nothing sent
    for (const [provider, p] of Object.entries(PROVIDERS)) {
      for (const [kind, models] of Object.entries(p.kinds)) {
        if (kind === 'voice-clone') continue;
        for (const model of models) {
          const takes = p.takes(kind, model);
          const base = { kind, provider, model, outDir: join(root, 'adapters'), ...(kind === 'tts' ? { text: 'Hello there.' } : { prompt: P }), ...(kind === 'video' ? { refs: [PNG] } : {}) };
          for (const [k, v] of Object.entries(VALUES)) {
            if (takes.includes(k) || Object.hasOwn(base, k)) continue;
            rmSync(rec, { force: true });
            await assert.rejects(m.generate({ ...base, [k]: v }), /does not take|takes no/, `${provider} ${model} ${kind}: ${k}`);
            await assert.rejects(m.generate({ ...base, [k]: v, confirm: true, quote: '000000000000', approvedUsd: 5 }), /does not take|takes no/, `${provider} ${model} ${kind}: ${k}`);
            assert.deepEqual(sent(), [], `${provider} ${model}: ${k}`);
          }
        }
      }
    }
  });
  // the cases from the check, by name
  const kf = await m.generate({ kind: 'image', provider: 'openai', prompt: 'collage poster', aspect: '9:16', outDir: join(root, 'adapters') });
  assert.deepEqual([kf.request.sent.size, kf.estimate.usd], ['1024x1536', 0.063], 'the size that is sent is the size that is priced');
  await assert.rejects(m.generate({ kind: 'image', provider: 'atlas', prompt: 'my product on a beach', refs: [PNG], outDir: join(root, 'adapters') }), /takes no reference images/);
  await assert.rejects(m.generate({ kind: 'image', provider: 'fal', model: 'fal-ai/z-image/turbo', prompt: 'x', aspect: '9:16', outDir: join(root, 'adapters') }), /does not take aspect[\s\S]*give size/);
  await assert.rejects(m.generate({ kind: 'video', provider: 'fal', prompt: 'x', refs: [PNG], aspect: '9:16', outDir: join(root, 'adapters') }), /does not take aspect[\s\S]*shape of its start image/);
  await assert.rejects(m.generate({ kind: 'video', provider: 'fal', prompt: 'x', refs: [PNG, PNG], outDir: join(root, 'adapters') }), /one start image/);
  await assert.rejects(m.generate({ kind: 'image', provider: 'gemini', prompt: 'x', size: '1024x1024', aspect: '9:16', outDir: join(root, 'adapters') }), /size or aspect, not both/);
  assert.throws(() => m.estimate({ kind: 'image', provider: 'atlas', refs: [PNG] }), /takes no reference images/, 'estimate refuses it too');
  assert.deepEqual(sent(), []);
});

test('paid calls (Q-21, AM-13): a clean-up that Windows blocks still logs the charge and the result URLs, with keys masked', async () => {
  const leaky = `https://replicate.delivery/x/page.html?token=${KEYS.REPLICATE_API_TOKEN}`;
  const dir = fixtures({ 'replicate.json': { routes: [
    { method: 'POST', match: '/predictions', json: { id: 'pe', status: 'succeeded', output: [leaky], urls: { get: 'https://api.replicate.com/v1/predictions/pe' } } },
    { match: 'replicate.delivery/x/page.html', text: '<html>', contentType: 'text/html' }] } });
  const job = join(root, 'ebusy');
  await withFixtures(dir, async () => {
    const req = { kind: 'image', provider: 'replicate', prompt: 'x', name: 'img', outDir: job };
    const quote = await quoteOf(req);
    const real = fs.rmSync, tried = [];
    fs.rmSync = (p, opts) => { tried.push([p, opts]); throw Object.assign(new Error(`EBUSY: resource busy or locked, unlink '${p}'`), { code: 'EBUSY' }); };
    syncBuiltinESMExports();
    try { await assert.rejects(m.generate({ ...req, confirm: true, quote }), /not media[\s\S]*succeeded and was charged; its result URLs are in/); }
    finally { fs.rmSync = real; syncBuiltinESMExports(); }
    assert.equal(tried.length, 1);
    assert.equal(tried[0][1].maxRetries, 10, 'removed with retries');
  });
  const last = jobs(job).at(-1);
  assert.equal(last.status, 'paid-not-saved');
  assert.equal(last.urls.length, 1);
  assert.ok(!readFileSync(join(job, 'jobs.jsonl'), 'utf8').includes(KEYS.REPLICATE_API_TOKEN), 'the key in a result URL is masked');
  assert.match(last.urls[0], /token=r8-\*\*\*/);
});

test('paid calls (Q-22): a broken provenance.json does not hide a saved paid result; 0 or too few results are errors that say so', async () => {
  const job = join(root, 'prov'); mkdirSync(job, { recursive: true });
  const broken = '{ "version": 1, "assets": [ { "file": "a.png", }';
  writeFileSync(join(job, 'provenance.json'), broken);
  const r = await paid({ kind: 'image', provider: 'openai', prompt: 'a boat', name: 'boat', outDir: job });
  assert.equal(r.files.length, 1);
  assert.ok(existsSync(join(job, 'boat.png')));
  assert.match(r.warnings.join(' '), /provenance\.json could not be read[\s\S]*left as it is[\s\S]*provenance-unmerged\.json/);
  assert.equal(readFileSync(join(job, 'provenance.json'), 'utf8'), broken, 'the user\'s file is not overwritten');
  assert.equal(JSON.parse(readFileSync(join(job, 'provenance-unmerged.json'), 'utf8')).assets[0].file, 'boat.png');
  assert.equal(jobs(job).at(-1).status, 'saved');
  // the provider answers, but with nothing: an error that says the call was made and charged
  const none = fixtures({ 'atlas.json': { routes: [{ method: 'POST', match: '/model/generateImage', json: { data: { id: 'e1' } } }, { match: '/model/prediction/e1', json: { data: { status: 'completed', outputs: [] } } }] } });
  await withFixtures(none, async () => {
    await assert.rejects(paid({ kind: 'image', provider: 'atlas', prompt: 'x', outDir: join(root, 'empty') }), /returned no result \(0 of 1\)[\s\S]*charged[\s\S]*job e1/);
  });
  assert.deepEqual([jobs(join(root, 'empty')).at(-1).status, jobs(join(root, 'empty')).at(-1).requested], ['empty', 1]);
  // fewer than were asked for and priced: the ones made are saved, and it is an error
  const few = fixtures({ 'tiny.png': readFileSync(PNG), 'fal.json': { routes: [
    { method: 'POST', match: 'queue.fal.run/', json: { request_id: 'f1', status_url: 'https://queue.fal.run/x/requests/f1/status', response_url: 'https://queue.fal.run/x/requests/f1' } },
    { match: '/requests/f1/status', json: { status: 'COMPLETED' } },
    { match: '/requests/f1', json: { images: [{ url: 'https://v3.fal.media/files/one.png' }] } },
    { match: 'v3.fal.media/files/one.png', file: 'tiny.png', contentType: 'image/png' }] } });
  await withFixtures(few, async () => {
    await assert.rejects(paid({ kind: 'image', provider: 'fal', prompt: 'x', count: 2, name: 'pair', outDir: join(root, 'few') }), /returned 1 of 2[\s\S]*charged[\s\S]*saved: pair-1\.png|returned 1 of 2[\s\S]*charged[\s\S]*saved: pair\.png/);
  });
  const last = jobs(join(root, 'few')).at(-1);
  assert.deepEqual([last.status, last.requested, last.saved], ['partial', 2, 1]);
});

test('references (Q-23): only a whole image with nothing after it is sent; a hard link is refused', needsFfmpeg, async () => {
  const job = join(root, 'refs23');
  const g = (refs) => m.generate({ kind: 'image', provider: 'gemini', prompt: 'restyle', refs, outDir: job });
  const png = readFileSync(PNG);
  writeFileSync(join(root, 'poly.png'), Buffer.concat([png, Buffer.from('KEYSTORE-SECRET-DATA')]));
  writeFileSync(join(root, 'cut.png'), png.subarray(0, png.length - 12));
  ff(['-f', 'lavfi', '-i', 'color=red:s=16x16', '-frames:v', '1', join(root, 'red.jpg')]);
  writeFileSync(join(root, 'poly.jpg'), Buffer.concat([readFileSync(join(root, 'red.jpg')), Buffer.from('KEYSTORE-SECRET-DATA')]));
  const webp = Buffer.from('UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==', 'base64');
  writeFileSync(join(root, 'ok.webp'), webp);
  writeFileSync(join(root, 'poly.webp'), Buffer.concat([webp, Buffer.from('KEYSTORE-SECRET-DATA')]));
  const grown = Buffer.from(webp); grown.writeUInt32LE(webp.length - 8 + 20, 4);
  writeFileSync(join(root, 'grown.webp'), Buffer.concat([grown, Buffer.from('KEYSTORE-SECRET-DATA')]));
  for (const f of ['poly.png', 'poly.jpg', 'poly.webp']) await assert.rejects(g([f]), /has data after the end of its image/, f);
  for (const f of ['cut.png', 'grown.webp']) await assert.rejects(g([f]), /is not a complete PNG, JPEG or WebP image/, f);
  for (const f of ['tiny.png', 'red.jpg', 'ok.webp']) assert.equal((await g([f])).dryRun, true, f);
  // a hard link: the same file under a name inside the project and maybe one outside it
  const outside = realpathSync(mkdtempSync(join(tmpdir(), 'easel-outside-')));
  try {
    copyFileSync(PNG, join(outside, 'photo.png'));
    let linked = false;
    try { linkSync(join(outside, 'photo.png'), join(root, 'hard.png')); linked = true; } catch { /* no hard links on this file system */ }
    if (linked) await assert.rejects(g(['hard.png']), /is a hard link/);
  } finally { rmSync(outside, { recursive: true, force: true }); }
  assert.deepEqual(sent(), [], 'nothing was sent');
  // a voice sample that is a hard link is refused the same way
  const vjob = join(root, 'hard-voice'); mkdirSync(vjob, { recursive: true });
  tone(join(vjob, 'consent.wav'), 8); tone(join(root, 'elsewhere.wav'), 3, 330);
  writeFileSync(join(vjob, 'consent.json'), JSON.stringify({ speaker: 'Jane Example', statement: 'I, Jane Example, consent to my voice being cloned for narration.', purpose: 'narration', date: '2026-10-11', recording: 'consent.wav' }));
  let linked = false;
  try { linkSync(join(root, 'elsewhere.wav'), join(vjob, 'sample-1.wav')); linked = true; } catch { /* no hard links */ }
  if (linked) assert.match(c.checkConsent({ voiceName: 'v', samples: ['sample-1.wav'], consentFile: 'consent.json' }, vjob).reason, /voice sample sample-1\.wav is a hard link/);
});
