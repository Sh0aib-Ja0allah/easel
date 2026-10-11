// assemble's sound: the mix is mastered to a loudness target (so quiet or loud narration still gives
// a film inside qa's -16 to -12 LUFS window), and narration can be several files placed at clips or
// times. Needs ffmpeg and ffprobe; skips otherwise.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assemble } from '../lib/assemble.mjs';
import { findBinary } from '../lib/binaries.mjs';
import { validateArgs } from '../lib/validate.mjs';
import { tools } from '../tools.mjs';
const bin = (n) => findBinary(n).path;

const skip = findBinary('ffmpeg') && findBinary('ffprobe') ? false : 'needs ffmpeg and ffprobe';
const root = realpathSync(mkdtempSync(join(tmpdir(), 'easel-assemble-audio-')));
process.chdir(root);
after(() => { process.chdir(tmpdir()); rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }); });
const ff = (args) => { const r = spawnSync(bin('ffmpeg'), ['-y', '-hide_banner', '-nostats', ...args], { encoding: 'utf8', windowsHide: true }); assert.equal(r.status, 0, r.stderr); return r; };
// integrated loudness and true peak as easel-core's qa measures them (ffmpeg ebur128)
const ebur = (f) => {
  const s = ff(['-i', f, '-map', '0:a:0', '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr;
  const sum = s.slice(s.lastIndexOf('Summary:'));
  return { lufs: Number((/I:\s+(-?[\d.]+) LUFS/.exec(sum) || [])[1]), peak: Number((/Peak:\s+(-?[\d.]+) dBFS/.exec(sum) || [])[1]) };
};
// a lavfi source written to a file, then set to `lufs` integrated by a plain gain (a linear gain
// moves integrated loudness by exactly its dB)
const source = (name, spec, seconds, lufs) => {
  const raw = join(root, `raw-${name}.wav`), f = join(root, name);
  ff(['-f', 'lavfi', '-i', spec, '-t', String(seconds), '-ar', '48000', raw]);
  if (lufs === undefined) return raw;
  ff(['-i', raw, '-af', `volume=${(lufs - ebur(raw).lufs).toFixed(2)}dB`, f]);
  return f;
};
// speech-like narration: band-limited noise in syllable bursts with pauses (a high crest factor, as
// real speech has)
const speech = (name, seconds, lufs) => source(name, `anoisesrc=color=pink:seed=7:sample_rate=48000,bandpass=f=900:width_type=h:w=1400,volume='if(lt(mod(t,0.5),0.3),1,0.02)':eval=frame`, seconds, lufs);
const clip = (name, seconds) => { const f = join(root, name); ff(['-f', 'lavfi', '-i', `testsrc2=size=320x240:rate=24:duration=${seconds}`, '-pix_fmt', 'yuv420p', f]); return f; };
// mean level in dB of the audio from start for dur seconds through a band-pass at hz
const bandDb = (f, start, dur, hz) => {
  const r = spawnSync(bin('ffmpeg'), ['-v', 'info', '-ss', String(start), '-t', String(dur), '-i', f, '-vn', '-af', `bandpass=f=${hz}:width_type=h:w=40,astats=metadata=0:reset=0`, '-f', 'null', '-'], { encoding: 'utf8', windowsHide: true });
  const m = /Overall[\s\S]*?RMS level dB: (-?[\d.]+|-inf)/.exec(r.stderr);
  return m ? (m[1] === '-inf' ? -200 : Number(m[1])) : NaN;
};

test('assemble masters the mix: quiet narration (-20 LUFS) under music gives a film inside qa\'s -16 to -12 LUFS', { skip }, () => {
  const v = clip('v.mp4', 6);
  const vo = speech('vo-quiet.wav', 6, -20), music = source('music.wav', 'sine=frequency=330:sample_rate=48000', 8, -14);
  assert.ok(Math.abs(ebur(vo).lufs + 20) < 0.5, `the narration fixture is about -20 LUFS: ${ebur(vo).lufs}`);
  const r = assemble({ clips: [{ file: v, seconds: 6 }], size: '320x240', narration: vo, music, outDir: join(root, 'out'), name: 'quiet', preset: 'ultrafast' });
  const m = ebur(r.file);
  assert.ok(m.lufs >= -16 && m.lufs <= -12, `film at ${m.lufs} LUFS`);
  assert.ok(Math.abs(m.lufs + 14) <= 1, `close to the -14 LUFS default: ${m.lufs}`);
  assert.ok(m.peak <= -1, `true peak ${m.peak} dBTP stays under -1`);
  assert.equal(r.loudness.target, -14);
  assert.ok(Math.abs(r.loudness.lufs - m.lufs) < 0.3, `the result reports the film's loudness: ${r.loudness.lufs} vs ${m.lufs}`);
});

test('assemble masters loud narration and music alone too, and takes a lufs target', { skip }, () => {
  const v = clip('w.mp4', 5);
  // loud, peaky narration: lowering it is linear; music alone is mastered as well
  const loud = speech('vo-loud.wav', 5, -9);
  const a = assemble({ clips: [{ file: v, seconds: 5 }], size: '320x240', narration: loud, outDir: join(root, 'out'), name: 'loud', preset: 'ultrafast' });
  const la = ebur(a.file).lufs;
  assert.ok(la >= -16 && la <= -12, `loud narration -> film at ${la} LUFS`);
  const quietMusic = source('music-quiet.wav', 'sine=frequency=440:sample_rate=48000', 6, -26);
  const b = assemble({ clips: [{ file: v, seconds: 5 }], size: '320x240', music: quietMusic, outDir: join(root, 'out'), name: 'music', preset: 'ultrafast' });
  const lb = ebur(b.file).lufs;
  assert.ok(lb >= -16 && lb <= -12, `music alone -> film at ${lb} LUFS`);
  const vo = speech('vo-17.wav', 5, -20);
  const c = assemble({ clips: [{ file: v, seconds: 5 }], size: '320x240', narration: vo, lufs: -16, outDir: join(root, 'out'), name: 'target', preset: 'ultrafast' });
  const lc = ebur(c.file).lufs;
  assert.ok(Math.abs(lc + 16) <= 1, `lufs -16 -> film at ${lc} LUFS`);
  // a 2 s film of quiet, peaky narration (the peaks need the limiter; a few seconds is where
  // ffmpeg's loudnorm misses by several LU)
  const short = speech('vo-short.wav', 2, -22);
  const d = assemble({ clips: [{ file: v, seconds: 2 }], size: '320x240', narration: short, outDir: join(root, 'out'), name: 'short', preset: 'ultrafast' });
  const ld = ebur(d.file);
  assert.ok(ld.lufs >= -16 && ld.lufs <= -12 && ld.peak <= -1, `2 s film at ${ld.lufs} LUFS, true peak ${ld.peak}`);
  assert.deepEqual(validateArgs(tools.assemble.inputSchema, { clips: [{ file: 'a.mp4' }], lufs: -9 }), ['lufs must be <= -10']);
  assert.deepEqual(validateArgs(tools.assemble.inputSchema, { clips: [{ file: 'a.mp4' }], lufs: -19 }), ['lufs must be >= -18']);
});

test('narration as a list: each file starts at its clip or at its time, mixed and ducked like one file', { skip }, () => {
  const a = clip('a.mp4', 2), b = clip('b.mp4', 2), c = clip('c.mp4', 2);
  const line1 = source('line1.wav', 'sine=frequency=600:sample_rate=48000', 1), line2 = source('line2.wav', 'sine=frequency=1000:sample_rate=48000', 1);
  // 2.4 kHz, not 2.5: ffmpeg 8's probe reads a 2.5 kHz sine at this level as MPEG-TS (CI on macOS)
  const music = source('bed.wav', 'sine=frequency=2400:sample_rate=48000', 8, -14);
  const narration = [{ file: line1, clip: 1 }, { file: line2, start: 4.5 }];
  assert.deepEqual(validateArgs(tools.assemble.inputSchema, { clips: [{ file: a }], narration }), []);
  assert.deepEqual(validateArgs(tools.assemble.inputSchema, { clips: [{ file: a }], narration: 'vo.wav' }), []);
  const r = assemble({ clips: [{ file: a, seconds: 2 }, { file: b, seconds: 2 }, { file: c, seconds: 2 }], size: '320x240', narration, music, outDir: join(root, 'out'), name: 'lines', preset: 'ultrafast' });
  assert.deepEqual(r.narration.map((n) => [n.start, Math.round(n.seconds * 10) / 10]), [[2, 1], [4.5, 1]]);
  // line 1 (600 Hz) is heard from 2 s (clip 1's start), not before; line 2 (1 kHz) from 4.5 s
  const l1 = [bandDb(r.file, 0.2, 1.5, 600), bandDb(r.file, 2.2, 0.6, 600)], l2 = [bandDb(r.file, 2.2, 1.5, 1000), bandDb(r.file, 4.7, 0.6, 1000)];
  assert.ok(l1[1] - l1[0] >= 20, `line 1 at its clip: ${l1}`);
  assert.ok(l2[1] - l2[0] >= 20, `line 2 at 4.5 s: ${l2}`);
  // the music (2.4 kHz) ducks under each line and comes back between them
  const under = bandDb(r.file, 2.2, 0.6, 2400), between = bandDb(r.file, 3.4, 0.8, 2400);
  assert.ok(between - under >= 6, `music under a line ${under.toFixed(1)} dB vs between lines ${between.toFixed(1)} dB`);
  // overlapping lines are reported
  const o = assemble({ clips: [{ file: a, seconds: 2 }], size: '320x240', narration: [{ file: line1, start: 0 }, { file: line2, start: 0.5 }], outDir: join(root, 'out'), name: 'overlap', preset: 'ultrafast' });
  assert.match(o.warnings.join(' '), /overlap/);
  // wrong placements are refused before ffmpeg runs
  const clips = [{ file: a, seconds: 2 }];
  assert.throws(() => assemble({ clips, narration: [{ file: line1, clip: 3 }], outDir: join(root, 'out') }), /clip 3/);
  assert.throws(() => assemble({ clips, narration: [{ file: line1, clip: 0, start: 1 }], outDir: join(root, 'out') }), /clip or start/);
  assert.throws(() => assemble({ clips, narration: [{ file: line1 }], outDir: join(root, 'out') }), /clip or start/);
  assert.throws(() => assemble({ clips, narration: [{ file: line1, start: 2 }], outDir: join(root, 'out') }), /after the film ends/);
  assert.throws(() => assemble({ clips, narration: [{ file: join(root, 'nope.wav'), start: 0 }], outDir: join(root, 'out') }), /file not found/);
});
