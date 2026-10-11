// QA D-1 #5: mux_audio puts a track on a video that already exists (the video stream is copied).
// Needs ffmpeg and ffprobe; skips otherwise.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { doctorReport } from '../lib/doctor.mjs';
import { requireBinary } from '../lib/binaries.mjs';

const ok = (n) => doctorReport().checks.find((c) => c.name === n)?.ok;
const skip = ok('ffmpeg') && ok('ffprobe') ? false : 'needs ffmpeg and ffprobe';
let out, m;
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

test('mux_audio: a silent video gets the track, cut to the shorter stream; the input is untouched', { skip }, () => {
  const video = lavfi('launch.mp4', 'testsrc=size=160x90:rate=10', ['-t', '2', '-pix_fmt', 'yuv420p', '-c:v', 'libx264']);
  const audio = lavfi('track.wav', 'sine=frequency=440:sample_rate=48000', ['-t', '3', '-ac', '2']);
  const r = m.muxAudio({ video, audio, outDir: join(out, 'a') });
  assert.equal(r.file, join(out, 'a', 'launch-audio.mp4'));
  const p = m.probe(r.file), src = m.probe(video);
  assert.ok(p.audio, 'has an audio stream');
  assert.ok(Math.abs(p.duration - 2) < 0.15, `cut to the video: ${p.duration}`);
  assert.equal(p.video.codec, src.video.codec);
  assert.ok(!m.probe(video).audio, 'the input video is not changed');
  const longer = m.muxAudio({ video, audio, outDir: join(out, 'a'), name: 'long', shortest: false });
  assert.ok(m.probe(longer.file).duration > 2.8, 'shortest: false keeps the longer track');
});

test('mux_audio: master: true brings a quiet track to -14 LUFS; bad input is refused clearly', { skip }, () => {
  const video = lavfi('v.mp4', 'testsrc=size=160x90:rate=10', ['-t', '3', '-pix_fmt', 'yuv420p', '-c:v', 'libx264']);
  const quiet = lavfi('quiet.wav', 'sine=frequency=330:sample_rate=48000', ['-t', '3', '-ac', '2', '-af', 'volume=-30dB']);
  const r = m.muxAudio({ video, audio: quiet, master: true, outDir: join(out, 'b'), name: 'mastered' });
  assert.ok(Math.abs(m.loudness(r.file).value + 14) <= 1.5, JSON.stringify(m.loudness(r.file)));
  assert.ok(!existsSync(join(out, 'b', 'mastered.master.wav')), 'the temporary master is removed');
  assert.throws(() => m.muxAudio({ video, outDir: out }), /Give video/);
  assert.throws(() => m.muxAudio({ video, audio: join(out, 'nope.wav'), outDir: out }), /not found/);
  assert.throws(() => m.muxAudio({ video, audio: quiet, outDir: out, name: 'v' }), /overwrite the input/);
});
