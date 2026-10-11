// T4.3: assemble joins clips into one film with the local ffmpeg. Needs ffmpeg and ffprobe; skips otherwise.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assemble, duration } from '../lib/assemble.mjs';
import { findBinary } from '../lib/binaries.mjs';
const bin = (n) => findBinary(n).path;

const skip = findBinary('ffmpeg') && findBinary('ffprobe') ? false : 'needs ffmpeg and ffprobe';
const root = mkdtempSync(join(tmpdir(), 'easel-assemble-'));
after(() => rmSync(root, { recursive: true, force: true }));
const lavfi = (name, spec, extra = []) => { const f = join(root, name); const r = spawnSync(bin('ffmpeg'), ['-y', '-v', 'error', '-f', 'lavfi', '-i', spec, ...extra, f], { encoding: 'utf8', windowsHide: true }); assert.equal(r.status, 0, r.stderr); return f; };
const probe = (f) => JSON.parse(spawnSync(bin('ffprobe'), ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', f], { encoding: 'utf8', windowsHide: true }).stdout);

test('assemble: clips of other sizes fill the frame, short clips are slowed to their beat, overlays and ducked music are mixed', { skip }, () => {
  const a = lavfi('a.mp4', 'testsrc=size=640x480:rate=24', ['-t', '2', '-pix_fmt', 'yuv420p']);
  const b = lavfi('b.mp4', 'testsrc2=size=1280x720:rate=30', ['-t', '1', '-pix_fmt', 'yuv420p']);
  const vo = lavfi('vo.wav', 'sine=frequency=300:sample_rate=48000', ['-t', '2.5']);
  const music = lavfi('music.wav', 'sine=frequency=520:sample_rate=48000', ['-t', '10']);
  const cap = lavfi('cap.png', 'color=c=white@0.0:s=400x80,format=rgba', ['-frames:v', '1']);
  const r = assemble({ clips: [{ file: a, seconds: 1.5 }, { file: b, seconds: 2 }], size: '540x960', fps: 30, narration: vo, music, overlays: [{ file: cap, start: 0.5, end: 2 }], outDir: join(root, 'out'), name: 'Test Film', preset: 'ultrafast' });
  assert.equal(r.file, join(root, 'out', 'test-film.mp4'));
  assert.deepEqual(r.beats.map((x) => [x.start, x.seconds]), [[0, 1.5], [1.5, 2]]);
  const p = probe(r.file), v = p.streams.find((s) => s.codec_type === 'video'), au = p.streams.find((s) => s.codec_type === 'audio');
  assert.deepEqual([v.width, v.height, v.r_frame_rate], [540, 960, '30/1']);
  assert.ok(au, 'narration and music are mixed in');
  assert.ok(Math.abs(duration(r.file) - 3.5) < 0.1, `film length ${duration(r.file)}`);
  assert.throws(() => assemble({ clips: [{ file: a }], size: '541x960', outDir: root }), /even numbers/);
  assert.throws(() => assemble({ clips: [{ file: join(root, 'nope.mp4') }], outDir: root }), /file not found/);
  assert.throws(() => assemble({ clips: [], outDir: root }), /give clips/);
});
