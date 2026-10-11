// Q-03 / C2: filmstrip on a video file. Frames are grabbed with ffmpeg at the given times (count evenly
// spaced over the probed duration) and laid out on the usual sheet; page-only arguments are refused.
// Needs Chromium (the sheet) and ffmpeg; skips otherwise.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { doctorReport } from '../lib/doctor.mjs';
import { requireBinary } from '../lib/binaries.mjs';

const ready = ['playwright-core', 'chromium', 'ffmpeg', 'ffprobe'].every((n) => doctorReport().checks.find((c) => c.name === n)?.ok);
const skip = ready ? false : 'needs Chromium and ffmpeg (doctor --install)';
let out, m, clip;
const lavfi = (name, args) => {
  const f = join(out, name);
  const r = spawnSync(requireBinary('ffmpeg'), ['-y', '-v', 'error', ...args, f], { encoding: 'utf8', windowsHide: true });
  assert.equal(r.status, 0, r.stderr);
  return f;
};
before(async () => {
  if (!ready) return;
  out = mkdtempSync(join(tmpdir(), 'easel-avstrip-'));
  m = { ...(await import('../lib/video.mjs')), ...(await import('../lib/image.mjs')), ...(await import('../lib/browser.mjs')) };
  // 4 s of testsrc: a moving sweep and a frame counter, so frames at different times differ
  clip = lavfi('clip.mp4', ['-f', 'lavfi', '-i', 'testsrc=size=160x90:rate=10', '-t', '4', '-pix_fmt', 'yuv420p', '-c:v', 'libx264']);
});
after(() => { if (out) rmSync(out, { recursive: true, force: true }); });

test('filmstrip on an mp4: count frames evenly spaced over its length, on one sheet, all different', { skip }, async () => {
  const r = await m.filmstrip({ file: clip, count: 4, outDir: join(out, 'strip'), name: 'clip' });
  assert.deepEqual(r.frames.map((f) => f.label), ['t = 0.50 s', 't = 1.50 s', 't = 2.50 s', 't = 3.50 s']);
  assert.ok(existsSync(r.filmstrip) && r.filmstrip.endsWith('clip.png'));
  assert.equal(r.video.duration, 4);
  assert.deepEqual([r.video.width, r.video.height], [160, 90]);
  for (const f of r.frames) assert.deepEqual(m.pngSize(f.file), { width: 160, height: 90 });
  const sheet = m.pngSize(r.filmstrip);
  assert.ok(sheet.width > 4 * 160 && sheet.height > 90, JSON.stringify(sheet));
  const browser = await m.openBrowser();
  try {
    for (let i = 1; i < r.frames.length; i++) assert.equal((await m.compareImages(browser, r.frames[i - 1].file, r.frames[i].file)).identical, false, `frames ${i - 1} and ${i} differ`);
  } finally { await browser.close(); }
  // times as given; another container (.mkv) works the same way
  const mkv = lavfi('clip.mkv', ['-i', clip, '-c', 'copy']);
  const t = await m.filmstrip({ file: mkv, times: [0, 3.9, 3.95], outDir: join(out, 'strip'), name: 'mkv' });
  assert.deepEqual(t.frames.map((f) => f.label), ['t = 0.00 s', 't = 3.90 s', 't = 3.95 s']);
  // 3.95 s is inside the last frame (3.9 to 4 s at 10 fps): that frame is the picture then
  const b2 = await m.openBrowser();
  try { assert.equal((await m.compareImages(b2, t.frames[1].file, t.frames[2].file)).identical, true); } finally { await b2.close(); }
});

test('filmstrip on a video refuses page-only arguments, times past the end and files with no picture', { skip }, async () => {
  const d = join(out, 'refuse');
  for (const extra of [{ aspect: '9:16' }, { theme: 'dark' }, { seed: 2 }, { reducedMotion: 'reduce' }, { width: 320 }, { height: 240 }]) {
    await assert.rejects(m.filmstrip({ file: clip, count: 2, outDir: d, ...extra }), new RegExp(`${Object.keys(extra)[0]}.*page`), JSON.stringify(extra));
  }
  await assert.rejects(m.filmstrip({ file: clip, html: '<p>x</p>', outDir: d }), /html/);
  await assert.rejects(m.filmstrip({ file: clip, theme: 'dark', width: 100, outDir: d }), /theme and width are for a page/);
  await assert.rejects(m.filmstrip({ file: 'https://example.com/clip.mp4', count: 2, outDir: d }), /local video file, not a URL/);
  await assert.rejects(m.filmstrip({ file: clip, times: [1, 4.5], outDir: d }), /4\.5 s is past the end of the video \(4 s\)/);
  await assert.rejects(m.filmstrip({ file: clip, count: 2, duration: 9, outDir: d }), /duration 9 s is longer than the video \(4 s\)/);
  const sound = lavfi('sound.mp4', ['-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000', '-t', '1', '-c:a', 'aac']);
  await assert.rejects(m.filmstrip({ file: sound, count: 2, outDir: d }), /no video stream/);
  assert.ok(!existsSync(d) || readdirSync(d).every((f) => f === 'filmstrip-frames'), 'nothing but the frames folder is written for a refused call');
  // duration narrows the span: count frames over the first 2 s
  const r = await m.filmstrip({ file: clip, count: 2, duration: 2, outDir: join(out, 'span') });
  assert.deepEqual(r.frames.map((f) => f.label), ['t = 0.50 s', 't = 1.50 s']);
});
