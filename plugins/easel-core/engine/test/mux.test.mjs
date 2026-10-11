// QA D-1 #5: mux_audio puts a track on a video that already exists (the video stream is copied).
// Needs ffmpeg and ffprobe; skips otherwise.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { copyFileSync, existsSync, linkSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { doctorReport } from '../lib/doctor.mjs';
import { requireBinary } from '../lib/binaries.mjs';

const ok = (n) => doctorReport().checks.find((c) => c.name === n)?.ok;
const skip = ok('ffmpeg') && ok('ffprobe') ? false : 'needs ffmpeg and ffprobe';
let out, m;
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
// a symbolic link where the OS allows one (Windows needs developer mode), else a hard link: both reach the same file
const link = (target, at) => { try { symlinkSync(target, at); return 'symlink'; } catch { linkSync(target, at); return 'hard link'; } };
const lavfi = (name, spec, extra = []) => {
  const f = join(out, name);
  const r = spawnSync(requireBinary('ffmpeg'), ['-y', '-v', 'error', '-f', 'lavfi', '-i', spec, ...extra, f], { encoding: 'utf8', windowsHide: true });
  assert.equal(r.status, 0, r.stderr);
  return f;
};
before(async () => {
  out = mkdtempSync(join(tmpdir(), 'easel-mux-'));
  m = { ...(await import('../lib/audio.mjs')), ...(await import('../lib/probe.mjs')), ...(await import('../lib/qa.mjs')) };
});
after(() => rmSync(out, { recursive: true, force: true }));

test('mux_audio: a silent video gets the track, cut to the shorter stream; the input is untouched', { skip }, async () => {
  const video = lavfi('launch.mp4', 'testsrc=size=160x90:rate=10', ['-t', '2', '-pix_fmt', 'yuv420p', '-c:v', 'libx264']);
  const audio = lavfi('track.wav', 'sine=frequency=440:sample_rate=48000', ['-t', '3', '-ac', '2']);
  const r = await m.muxAudio({ video, audio, outDir: join(out, 'a') });
  assert.equal(r.file, join(out, 'a', 'launch-audio.mp4'));
  const p = m.probe(r.file), src = m.probe(video);
  assert.ok(p.audio, 'has an audio stream');
  assert.ok(Math.abs(p.duration - 2) < 0.15, `cut to the video: ${p.duration}`);
  assert.equal(p.video.codec, src.video.codec);
  assert.ok(!m.probe(video).audio, 'the input video is not changed');
  assert.equal(typeof r.loudness.lufs, 'number');
  assert.equal(r.loudness.inRange, r.loudness.lufs >= -16 && r.loudness.lufs <= -12);
  if (!r.loudness.inRange) assert.match(r.loudness.fix, /master: true/);
  const longer = await m.muxAudio({ video, audio, outDir: join(out, 'a'), name: 'long', shortest: false });
  assert.ok(m.probe(longer.file).duration > 2.8, 'shortest: false keeps the longer track');
});

test('mux_audio: master: true brings a quiet track to -14 LUFS; bad input is refused clearly', { skip }, async () => {
  const video = lavfi('v.mp4', 'testsrc=size=160x90:rate=10', ['-t', '3', '-pix_fmt', 'yuv420p', '-c:v', 'libx264']);
  const quiet = lavfi('quiet.wav', 'sine=frequency=330:sample_rate=48000', ['-t', '3', '-ac', '2', '-af', 'volume=-30dB']);
  const r = await m.muxAudio({ video, audio: quiet, master: true, outDir: join(out, 'b'), name: 'mastered' });
  const loud = await m.loudness(r.file);
  assert.ok(Math.abs(loud.value + 14) <= 1.5, JSON.stringify(loud));
  assert.equal(r.loudness.inRange, true, JSON.stringify(r.loudness));
  assert.deepEqual(readdirSync(join(out, 'b')), ['mastered.mp4'], 'the temporary master is removed');
  await assert.rejects(m.muxAudio({ video, outDir: out }), /Give video/);
  await assert.rejects(m.muxAudio({ video, audio: join(out, 'nope.wav'), outDir: out }), /not found/);
  await assert.rejects(m.muxAudio({ video, audio: quiet, outDir: out, name: 'v' }), /overwrite the input/);
});

// Q-01: the input is never the output, however it is reached: through a link, or (on a file system that
// ignores case, Windows and macOS) by a name that differs only in case. Each case leaves the input's bytes as they were.
test('mux_audio never writes over its input: a link to it, a case variant of its name', { skip }, async () => {
  const dir = join(out, 'same'), clips = join(dir, 'clips');
  mkdirSync(clips, { recursive: true });
  const audio = lavfi('same/a.wav', 'sine=frequency=440:sample_rate=48000', ['-t', '2', '-ac', '2']);
  const video = lavfi('same/clips/final.mp4', 'testsrc=size=160x90:rate=10', ['-t', '2', '-pix_fmt', 'yuv420p', '-c:v', 'libx264']);
  const before = sha(video);
  // the reviewer's case: clips/Take.mp4 -> final.mp4, output clips/final.mp4
  const kind = link(video, join(clips, 'Take.mp4'));
  await assert.rejects(m.muxAudio({ video: join(clips, 'Take.mp4'), audio, outDir: clips, name: 'final' }), /overwrite the input/, kind);
  assert.equal(sha(video), before, `the input is unchanged (${kind})`);
  // and the other way round: the output name is a link to the input
  link(video, join(clips, 'out.mp4'));
  await assert.rejects(m.muxAudio({ video, audio, outDir: clips, name: 'out' }), /overwrite the input/);
  assert.equal(sha(video), before);
  // a name that differs only in case is the same file where the file system ignores case (Windows, macOS)
  const upper = join(clips, 'Final.mp4');
  if (existsSync(upper)) {
    await assert.rejects(m.muxAudio({ video: upper, audio, outDir: clips, name: 'final' }), /overwrite the input/);
    assert.equal(sha(video), before, 'the input is unchanged');
  } else {
    // a case-sensitive file system (Linux): Final.mp4 is another file, and muxing it into final.mp4 is allowed
    copyFileSync(video, upper);
    await m.muxAudio({ video: upper, audio, outDir: clips, name: 'final' });
    assert.equal(sha(upper), before, 'the input is unchanged');
    assert.equal(m.sameFile(video, upper, 'linux'), false);
  }
  // the comparison as it runs on Windows and macOS, simulated on any OS: the same real paths, case-folded
  for (const os of ['win32', 'darwin']) {
    assert.equal(m.sameFile(join(clips, 'Take.mp4'), upper, os), true, os);
    assert.equal(m.sameFile(video, join(clips, 'FINAL.MP4'), os), true, os);
    assert.equal(m.sameFile(video, join(clips, 'other.mp4'), os), false, os);
  }
  // the audio input is an input too (a track taken from an earlier video of the same name)
  const other = lavfi('same/other.mp4', 'testsrc=size=160x90:rate=10', ['-t', '1', '-pix_fmt', 'yuv420p', '-c:v', 'libx264']);
  const track = sha(video);
  await assert.rejects(m.muxAudio({ video: other, audio: video, outDir: clips, name: 'final' }), /overwrite the input audio/);
  assert.equal(sha(video), track);
});

// EN-10, EN-08: the result is written to a partial file and renamed into place, so a failed mux leaves no
// empty or half-written file and keeps an earlier good one, and an output name that is a link is replaced, not written through.
test('mux_audio: a failed mux keeps the earlier output and leaves nothing behind; a link at the output name is replaced', { skip }, async () => {
  const dir = join(out, 'fail');
  mkdirSync(dir, { recursive: true });
  const video = lavfi('fail-v.mp4', 'testsrc=size=160x90:rate=10', ['-t', '1', '-pix_fmt', 'yuv420p', '-c:v', 'libx264']);
  const audio = lavfi('fail-a.wav', 'sine=frequency=440:sample_rate=48000', ['-t', '1', '-ac', '2']);
  const noise = join(out, 'noise.wav');
  writeFileSync(noise, randomBytes(64 * 1024));
  const good = await m.muxAudio({ video, audio, outDir: dir, name: 'keep' });
  const before = sha(good.file);
  await assert.rejects(m.muxAudio({ video, audio: noise, outDir: dir, name: 'keep' }), /ffmpeg/);
  await assert.rejects(m.muxAudio({ video, audio: noise, outDir: dir, name: 'keep', master: true }), /ffmpeg|loudness/);
  assert.equal(sha(good.file), before, 'the earlier output is untouched');
  assert.deepEqual(readdirSync(dir), ['keep.mp4'], 'no partial, empty or temporary file left');
  const outside = join(out, 'outside.txt');
  writeFileSync(outside, 'notes');
  try { symlinkSync(outside, join(dir, 'linked.mp4')); } catch { return; } // Windows without developer mode cannot make the link
  const r = await m.muxAudio({ video, audio, outDir: dir, name: 'linked' });
  assert.equal(readFileSync(outside, 'utf8'), 'notes', 'the link target is not written');
  assert.ok(m.probe(r.file).audio, 'the output is a real file');
});

// EN-20: lufs means mastering to that target (it implies master: true); master: false with lufs contradicts itself.
test('mux_audio: lufs implies master; master: false with lufs is refused', { skip }, async () => {
  const video = lavfi('l-v.mp4', 'testsrc=size=160x90:rate=10', ['-t', '3', '-pix_fmt', 'yuv420p', '-c:v', 'libx264']);
  const quiet = lavfi('l-quiet.wav', 'sine=frequency=330:sample_rate=48000', ['-t', '3', '-ac', '2', '-af', 'volume=-30dB']);
  const r = await m.muxAudio({ video, audio: quiet, lufs: -15, outDir: join(out, 'l'), name: 'implied' });
  assert.equal(r.mastered.target, -15);
  assert.ok(Math.abs(r.loudness.lufs + 15) <= 1.5, JSON.stringify(r.loudness));
  await assert.rejects(m.muxAudio({ video, audio: quiet, lufs: -15, master: false, outDir: join(out, 'l'), name: 'x' }), /lufs.*master/);
});

// EN-12: ffmpeg runs without blocking the engine (the MCP server answers other calls meanwhile) and is
// stopped when it runs past its time.
test('mux_audio does not block the event loop; a media run past its timeout is stopped', { skip }, async () => {
  const video = lavfi('b-v.mp4', 'testsrc=size=160x90:rate=10', ['-t', '20', '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-preset', 'ultrafast']);
  const audio = lavfi('b-a.wav', 'sine=frequency=440:sample_rate=48000', ['-t', '20', '-ac', '2']);
  let ticks = 0;
  const timer = setInterval(() => ticks++, 5);
  try { await m.muxAudio({ video, audio, master: true, outDir: join(out, 'block'), name: 'b' }); } finally { clearInterval(timer); }
  assert.ok(ticks >= 3, `the event loop ran ${ticks} times during the mux`);
  const t0 = Date.now();
  await assert.rejects(m.run(requireBinary('ffmpeg'), ['-hide_banner', '-nostdin', '-f', 'lavfi', '-i', 'testsrc=size=64x64:rate=10', '-f', 'null', '-'], { timeout: 800 }), /did not finish within 0.8 s/);
  assert.ok(Date.now() - t0 < 5000, 'stopped promptly');
});

// Mastering short or peaky audio (voice lines): loudnorm's dynamic mode undershot these by several LU, so
// mux_audio master: true could fail qa's -16 to -12 gate. Measured here with ffmpeg's ebur128, as qa measures.
const ebur = (f) => {
  const r = spawnSync(requireBinary('ffmpeg'), ['-hide_banner', '-nostats', '-i', f, '-map', '0:a:0', '-af', 'ebur128=peak=true:framelog=verbose', '-f', 'null', '-'], { encoding: 'utf8', windowsHide: true });
  const s = r.stderr.slice(r.stderr.lastIndexOf('Summary:'));
  return { i: Number((/I:\s+(-?[\d.]+) LUFS/.exec(s) || [])[1]), tp: Number((/Peak:\s+(-?[\d.]+) dBFS/.exec(s) || [])[1]) };
};
test('master: a 2 s line at about -24 LUFS and a 4 s peaky line land within 1 LU of -14 with true peak at most -1 dBTP', { skip }, async () => {
  const dir = join(out, 'short');
  mkdirSync(dir, { recursive: true });
  // spoken-line stand-ins: a modulated tone with sharp clicks, and syllables on a harmonic tone with
  // plosive bursts; both peak near -1 dBFS, so a plain gain to -14 would clip and the limiter has to work
  const line = lavfi('short/line2.wav', "aevalsrc='0.1*sin(2*PI*210*t)*(0.5+0.5*sin(2*PI*5*t))+0.8*lt(mod(t\\,0.37)\\,0.002)*sin(2*PI*2500*t)':s=48000:d=2");
  const peaky = lavfi('short/peaky4.wav', "aevalsrc='(0.12*sin(2*PI*160*t)+0.06*sin(2*PI*320*t)+0.03*sin(2*PI*640*t))*max(0\\,sin(2*PI*3.3*t))+0.85*lt(mod(t\\,0.61)\\,0.012)*sin(2*PI*900*t)':s=48000:d=4");
  assert.ok(Math.abs(ebur(line).i + 24) <= 1.5, `the line starts near -24 LUFS: ${JSON.stringify(ebur(line))}`);
  for (const f of [line, peaky]) { const e = ebur(f); assert.ok(e.tp - e.i - 14 > -1.5, `needs the limiter: ${JSON.stringify(e)}`); }
  const video = lavfi('short/v.mp4', 'testsrc=size=160x90:rate=10', ['-t', '4', '-pix_fmt', 'yuv420p', '-c:v', 'libx264']);
  for (const src of [line, peaky]) {
    const name = basename(src, '.wav');
    const wav = await m.masterWav(src, join(dir, `${name}-mastered.wav`));
    const a = ebur(wav.file);
    assert.ok(Math.abs(a.i + 14) <= 1 && a.tp <= -1, `masterWav ${name}: ${JSON.stringify(a)}`);
    const muxed = await m.muxAudio({ video, audio: src, master: true, outDir: dir, name });
    const b = ebur(muxed.file);
    assert.ok(Math.abs(b.i + 14) <= 1 && b.tp <= -1, `mux_audio ${name}: ${JSON.stringify(b)}`);
    assert.equal(muxed.loudness.inRange, true, JSON.stringify(muxed.loudness));
  }
});
