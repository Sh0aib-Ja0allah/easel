// T4.3: assemble joins clips into one film with the local ffmpeg. Needs ffmpeg and ffprobe; skips otherwise.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assemble, duration } from '../lib/assemble.mjs';
import { findBinary } from '../lib/binaries.mjs';
const bin = (n) => findBinary(n).path;

const skip = findBinary('ffmpeg') && findBinary('ffprobe') ? false : 'needs ffmpeg and ffprobe';
// a temporary project folder (job folders must be inside the project)
const root = realpathSync(mkdtempSync(join(tmpdir(), 'easel-assemble-')));
process.chdir(root);
after(() => { process.chdir(tmpdir()); rmSync(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }); });
const lavfi = (name, spec, extra = []) => { const f = join(root, name); const r = spawnSync(bin('ffmpeg'), ['-y', '-v', 'error', '-f', 'lavfi', '-i', spec, ...extra, f], { encoding: 'utf8', windowsHide: true }); assert.equal(r.status, 0, r.stderr); return f; };
const probe = (f) => JSON.parse(spawnSync(bin('ffprobe'), ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', f], { encoding: 'utf8', windowsHide: true }).stdout);

// mean level in dB of the audio from start for dur seconds, optionally through a band-pass at hz
const levelDb = (f, start, dur, hz) => {
  const af = `${hz ? `bandpass=f=${hz}:width_type=h:w=60,` : ''}astats=metadata=0:reset=0`;
  const r = spawnSync(bin('ffmpeg'), ['-v', 'info', '-ss', String(start), '-t', String(dur), '-i', f, '-vn', '-af', af, '-f', 'null', '-'], { encoding: 'utf8', windowsHide: true });
  const m = /Overall[\s\S]*?RMS level dB: (-?[\d.]+|-inf)/.exec(r.stderr);
  return m ? (m[1] === '-inf' ? -200 : Number(m[1])) : NaN;
};
// one RGB pixel of the frame at time t
const pixel = (f, t, x, y) => { const r = spawnSync(bin('ffmpeg'), ['-v', 'error', '-ss', String(t), '-i', f, '-frames:v', '1', '-vf', `format=rgb24,crop=2:2:${x}:${y}`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { windowsHide: true }); return [...r.stdout].slice(0, 3); };
// stretches where the picture does not change for at least d seconds
const freezes = (f, d = 0.3) => (spawnSync(bin('ffmpeg'), ['-v', 'info', '-i', f, '-vf', `freezedetect=n=0.001:d=${d}`, '-an', '-f', 'null', '-'], { encoding: 'utf8', windowsHide: true }).stderr.match(/freeze_start/g) || []).length;

test('assemble: clips fill the frame, short clips are slowed (never frozen) to their beat, captions show at their times, music ducks under the voice', { skip }, () => {
  const a = lavfi('a.mp4', 'testsrc=size=640x480:rate=24', ['-t', '2', '-pix_fmt', 'yuv420p']);
  const b = lavfi('b.mp4', 'testsrc2=size=1280x720:rate=30', ['-t', '1', '-pix_fmt', 'yuv420p']);
  // c: 1 s of picture in a 2.5 s file (its audio runs on): slowed to its 2 s beat by its picture length
  const c = join(root, 'c.mp4');
  assert.equal(spawnSync(bin('ffmpeg'), ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=30:duration=1', '-f', 'lavfi', '-i', 'sine=frequency=200:duration=2.5', '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-c:a', 'aac', c], { encoding: 'utf8', windowsHide: true }).status, 0);
  const vo = lavfi('vo.wav', 'sine=frequency=300:sample_rate=48000', ['-t', '2.5']);
  const music = lavfi('music.wav', 'sine=frequency=2000:sample_rate=48000', ['-t', '10']);
  const cap = lavfi('cap.png', 'color=c=red:s=200x80,format=rgba', ['-frames:v', '1']);
  const r = assemble({ clips: [{ file: a, seconds: 1.5 }, { file: b, seconds: 2 }, { file: c, seconds: 2 }], size: '540x960', fps: 30, narration: vo, music, overlays: [{ file: cap, start: 0.5, end: 2 }], outDir: join(root, 'out'), name: 'Test Film', preset: 'ultrafast' });
  assert.equal(r.file, join(root, 'out', 'test-film.mp4'));
  assert.deepEqual(r.beats.map((x) => [x.start, x.seconds]), [[0, 1.5], [1.5, 2], [3.5, 2]]);
  const p = probe(r.file), v = p.streams.find((s) => s.codec_type === 'video'), au = p.streams.find((s) => s.codec_type === 'audio');
  assert.deepEqual([v.width, v.height, v.r_frame_rate], [540, 960, '30/1']);
  assert.ok(au, 'narration and music are mixed in');
  assert.ok(Math.abs(duration(r.file) - 5.5) < 0.1, `film length ${duration(r.file)}`);
  assert.equal(freezes(r.file), 0, 'no frozen stretch: short clips are slowed, not held');
  // the caption (an opaque red box, centred) is there between 0.5 and 2 s and gone after
  const [rr, gg, bb] = pixel(r.file, 1.0, 270, 480);
  assert.ok(rr > 200 && gg < 60 && bb < 60, `caption at 1 s: ${[rr, gg, bb]}`);
  const after = pixel(r.file, 3.0, 270, 480);
  assert.ok(!(after[0] > 200 && after[1] < 60 && after[2] < 60), `caption gone at 3 s: ${after}`);
  // the music (2 kHz) is ducked while the voice speaks and comes back after
  const ducked = levelDb(r.file, 0.6, 1.4, 2000), open = levelDb(r.file, 3.4, 1.5, 2000);
  assert.ok(open - ducked >= 6, `music under the voice ${ducked.toFixed(1)} dB vs alone ${open.toFixed(1)} dB`);
  // provenance: the film is a composited asset listing its inputs
  const prov = JSON.parse(readFileSync(join(root, 'out', 'provenance.json'), 'utf8'));
  const film = prov.assets.find((x) => x.file === 'test-film.mp4');
  assert.equal(film.method, 'composited');
  assert.equal(film.inputs.length, 6);
  assert.throws(() => assemble({ clips: [{ file: a }], size: '541x960', outDir: root }), /even numbers/);
  assert.throws(() => assemble({ clips: [{ file: join(root, 'nope.mp4') }], outDir: root }), /file not found/);
  assert.throws(() => assemble({ clips: [], outDir: root }), /give clips/);
  assert.throws(() => assemble({ clips: [{ file: a }], outDir: tmpdir() }), /inside the project folder/);
});

test('assemble never overwrites: a used name gets -2, an input is never the output, a failed run leaves nothing', { skip }, () => {
  const out = join(root, 'keep'); mkdirSync(out, { recursive: true });
  const film = lavfi('keep/film.mp4', 'testsrc=size=320x240:rate=24', ['-t', '1', '-pix_fmt', 'yuv420p']);
  const clip = lavfi('keep/video.mp4', 'testsrc2=size=320x240:rate=24', ['-t', '1', '-pix_fmt', 'yuv420p']);
  const hash = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
  const before = [hash(film), hash(clip)];
  // the default name is one of the inputs: the film goes next to it
  const a = assemble({ clips: [{ file: film, seconds: 1 }], size: '320x240', outDir: out, preset: 'ultrafast' });
  assert.equal(a.file, join(out, 'film-2.mp4'));
  // the name of an earlier (paid) clip
  const b = assemble({ clips: [{ file: film, seconds: 1 }, { file: clip, seconds: 1 }], size: '320x240', outDir: out, name: 'video', preset: 'ultrafast' });
  assert.equal(b.file, join(out, 'video-2.mp4'));
  assert.deepEqual([hash(film), hash(clip)], before, 'the inputs and the earlier files are untouched');
  // each film is recorded by its content hash (the consent gate never takes it for a recording)
  const jobs = readFileSync(join(out, 'jobs.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual(jobs.map((j) => [j.kind, j.status, j.files[0], j.sha256[j.files[0]]]), [['assemble', 'saved', 'film-2.mp4', hash(a.file)], ['assemble', 'saved', 'video-2.mp4', hash(b.file)]]);
  // ffmpeg fails (an overlay that is not an image): no empty file is left under the claimed name
  writeFileSync(join(root, 'not-an-image.png'), 'text');
  assert.throws(() => assemble({ clips: [{ file: film, seconds: 1 }], overlays: [{ file: join(root, 'not-an-image.png') }], size: '320x240', outDir: out, name: 'broken', preset: 'ultrafast' }), /ffmpeg failed/);
  assert.ok(!existsSync(join(out, 'broken.mp4')));
});
