// T2.4: audio_score (cue sheet -> synthesized, mastered WAV). Needs Chromium and ffmpeg; skips otherwise.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { doctorReport } from '../lib/doctor.mjs';
import { parseKey, planScore } from '../lib/score.mjs';

const ready = ['playwright-core', 'chromium', 'ffmpeg', 'ffprobe'].every((n) => doctorReport().checks.find((c) => c.name === n)?.ok);
const skip = ready ? false : 'needs Chromium and ffmpeg (doctor --install)';
const example = fileURLToPath(new URL('../../schemas/examples/cues.json', import.meta.url));
// 16-bit PCM samples of a WAV (finds the data chunk; ffmpeg may add a LIST chunk first)
const samples = (f) => { const b = readFileSync(f); let o = 12; while (o < b.length) { const id = b.toString('latin1', o, o + 4), n = b.readUInt32LE(o + 4); if (id === 'data') return new Int16Array(b.buffer.slice(b.byteOffset + o + 8, b.byteOffset + o + 8 + n)); o += 8 + n + (n % 2); } throw new Error('no data chunk'); };
let out, m;
before(async () => {
  if (!ready) return;
  out = mkdtempSync(join(tmpdir(), 'easel-score-'));
  m = { ...(await import('../lib/score.mjs')), ...(await import('../lib/probe.mjs')), ...(await import('../lib/qa.mjs')) };
});
after(() => { if (out) rmSync(out, { recursive: true, force: true }); });

test('keys parse to a root and a mode', () => {
  assert.deepEqual(parseKey('D major'), { root: 50, minor: false });
  assert.deepEqual(parseKey('A minor'), { root: 57, minor: true });
  assert.deepEqual(parseKey('F#m'), { root: 54, minor: true });
  assert.deepEqual(parseKey('Bb'), { root: 58, minor: false });
  assert.throws(() => parseKey('H major'), /unknown key/);
});

test('the plan: one section per scene, bass on the BPM grid, hits and named effects in place', () => {
  const cues = JSON.parse(readFileSync(example, 'utf8'));   // 12 s, 30 fps, 100 BPM, scenes at 0, 4, 8 s, a pop at 4.4 s, music-stop at 359
  const p = planScore(cues);
  assert.deepEqual(p.sections, [{ t0: 0, t1: 4 }, { t0: 4, t1: 8 }, { t0: 8, t1: 11.967 }]);
  // 0.6 s beats counted from the music start, not from each scene: 0-3.6, 4.2-7.8, 8.4-11.4
  const bass = p.events.filter((e) => e.type === 'bass');
  assert.equal(bass.length, 7 + 7 + 6);
  for (const e of bass) assert.ok(Math.abs(e.t / 0.6 - Math.round(e.t / 0.6)) < 1e-9, `bass at ${e.t} is off the grid`);
  assert.deepEqual(bass.filter((e) => e.accent).map((e) => +e.t.toFixed(3)), [0, 2.4, 4.8, 7.2, 9.6]);   // every bar's downbeat
  // 90 BPM: the downbeat at 10.667 s keeps its accent (no float drift from repeated addition)
  const p90 = planScore({ ...cues, bpm: 90 });
  assert.deepEqual(p90.events.filter((e) => e.type === 'bass' && e.accent).map((e) => +e.t.toFixed(3)), [0, 2.667, 5.333, 8, 10.667]);
  assert.deepEqual(p.events.filter((e) => e.type === 'sfx').map((e) => [e.name, +e.t.toFixed(2)]), [['pop', 4.4]]);
  const withHit = planScore({ ...cues, cues: [...cues.cues, { name: 'payoff', frame: 270, kind: 'hit' }, { name: 'odd', frame: 30, kind: 'sfx', sfx: 'kazoo' }] });
  assert.deepEqual(withHit.hits, [9]);
  assert.equal(withHit.events.find((e) => e.unknown).unknown, 'kazoo');
});

test('audio_score: the example cue sheet becomes a 12 s stereo WAV at -14 LUFS, the same every time', { skip }, async () => {
  const a = await m.audioScore({ file: example, outDir: out, name: 'a' });
  const b = await m.audioScore({ file: example, outDir: out, name: 'b' });
  assert.equal(a.pass, true, JSON.stringify(a));
  assert.ok(Math.abs(a.lufs + 14) <= 1, `integrated ${a.lufs}`);
  const p = m.probe(a.file);
  assert.equal(p.audio.channels, 2);
  assert.equal(p.audio.sampleRate, 48000);
  assert.ok(Math.abs(p.duration - 12) < 0.05, `duration ${p.duration}`);
  // Chromium's Web Audio rounds a few hundred samples differently run to run (1 LSB of 16 bits before
  // mastering, a few after its gain); more than 8 LSB (-72 dB below full scale) would be a real difference.
  const A = samples(a.file), B = samples(b.file);
  assert.equal(A.length, B.length);
  let max = 0; for (let i = 0; i < A.length; i++) max = Math.max(max, Math.abs(A[i] - B[i]));
  assert.ok(max <= 8, `two renders differ by up to ${max} LSB`);
  assert.equal(a.lufs, b.lufs);
  assert.ok(m.loudness(a.file).pass, 'inside the -16 to -12 LUFS gate');
});

test('audio_score: palettes differ, a custom target is met, bad input is refused clearly', { skip }, async () => {
  const cues = JSON.parse(readFileSync(example, 'utf8'));
  const extra = [...cues.cues, { name: 'payoff', frame: 270, kind: 'hit' }, { name: 'x', frame: 30, kind: 'sfx', sfx: 'kazoo' }].sort((p, q) => p.frame - q.frame);
  const retro = await m.audioScore({ cues: { ...cues, cues: extra }, palette: 'retro', outDir: out, name: 'retro', lufs: -16 });
  assert.ok(Math.abs(retro.lufs + 16) <= 1, `retro ${retro.lufs}`);
  assert.equal(retro.hits, 1);
  assert.match(retro.warnings[0], /kazoo/);
  // the same cue sheet at the same target: only the palette differs, so the samples must differ well beyond rounding
  const warm = await m.audioScore({ cues: { ...cues, cues: extra }, palette: 'warm', outDir: out, name: 'warm', lufs: -16 });
  const W = samples(warm.file), R = samples(retro.file);
  let diff = 0; for (let i = 0; i < W.length; i++) diff = Math.max(diff, Math.abs(W[i] - R[i]));
  assert.ok(diff > 1000, `warm and retro differ by only ${diff} LSB`);
  await assert.rejects(m.audioScore({ cues: { version: 1, fps: 30 }, outDir: out }), /not valid/);
  await assert.rejects(m.audioScore({ file: example, palette: 'jazz', outDir: out }), /palette must be one of/);
});

test('audio_score: effects on frame 0 (whoosh, swish, riser) render instead of failing', { skip }, async () => {
  const cues = { version: 1, fps: 30, durationSec: 3, bpm: 120, key: 'C major', cues: [
    { name: 'open', frame: 0, kind: 'scene' }, { name: 'w', frame: 0, kind: 'sfx', sfx: 'whoosh' },
    { name: 's', frame: 0, kind: 'sfx', sfx: 'swish' }, { name: 'r', frame: 0, kind: 'sfx', sfx: 'riser' } ] };
  const r = await m.audioScore({ cues, outDir: out, name: 'frame0' });
  assert.equal(r.pass, true, JSON.stringify(r));
  assert.ok(Math.abs(m.probe(r.file).duration - 3) < 0.05);
});

test('audio_score refuses a cue sheet longer than 1800 s with a clear message (not "the page returned no audio")', async () => {
  const { audioScore, MAX_SCORE_SEC } = await import('../lib/score.mjs');
  assert.equal(MAX_SCORE_SEC, 1800);
  // the cue sheet schema caps durationSec at 1800 too (so `validate` agrees); either refusal names
  // the limit, and neither is the misleading "the page returned no audio"
  await assert.rejects(audioScore({ cues: { version: 1, fps: 30, durationSec: 2000, cues: [] } }), (e) => /durationSec/.test(e.message) && /1800/.test(e.message) && !/no audio/.test(e.message));
});
