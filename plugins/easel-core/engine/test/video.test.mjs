// T1.3: render_video + filmstrip. Needs Playwright, Chromium and ffmpeg; skips otherwise.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { doctorReport } from '../lib/doctor.mjs';

const ready = ['playwright-core', 'chromium', 'ffmpeg', 'ffprobe', 'gsap'].every((n) => doctorReport().checks.find((c) => c.name === n)?.ok);
const skip = ready ? false : 'needs doctor --install and ffmpeg';
const fx = (f) => fileURLToPath(new URL(`./fixtures/${f}`, import.meta.url));
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
let out, m;
before(async () => {
  if (!ready) return;
  out = mkdtempSync(join(tmpdir(), 'easel-video-'));
  m = { ...(await import('../lib/video.mjs')), ...(await import('../lib/probe.mjs')), ...(await import('../lib/image.mjs')), ...(await import('../lib/browser.mjs')), ...(await import('../lib/render.mjs')) };
});
after(() => { if (out) rmSync(out, { recursive: true, force: true }); });

for (const [fixture, label] of [['anim-renderat.html', 'renderAt(t)'], ['anim-gsap.html', 'GSAP timeline + CSS']]) {
  test(`5 s, 30 fps MP4 from a ${label} page, deterministic`, { skip }, async () => {
    const a = await m.renderVideo({ file: fx(fixture), outDir: join(out, label.replace(/\W+/g, '')), name: 'a' });
    const b = await m.renderVideo({ file: fx(fixture), outDir: join(out, label.replace(/\W+/g, '')), name: 'b' });
    const p = m.probe(a.videos[0].file);
    assert.equal(p.video.codec, 'h264');
    assert.equal(p.video.pixFmt, 'yuv420p');
    assert.equal(p.video.fps, 30);
    assert.equal(p.video.frames, 150);
    assert.ok(Math.abs(p.duration - 5) < 0.05, `duration ${p.duration}`);
    assert.deepEqual([p.video.width, p.video.height], [640, 360]);
    assert.equal(sha(a.videos[0].file), sha(b.videos[0].file), 'two renders must be byte-identical');
    assert.equal(a.warnings, undefined, JSON.stringify(a.warnings));
  });
}

test('frames really move, and frame n matches a still seeked to n / fps', { skip }, async () => {
  const dir = join(out, 'seek');
  const v = await m.renderVideo({ file: fx('anim-gsap.html'), outDir: dir, name: 'v', crf: 4 });
  const f0 = m.extractFrame(v.videos[0].file, 0, join(dir, 'f0.png'));
  const f75 = m.extractFrame(v.videos[0].file, 75, join(dir, 'f75.png'));
  const still = await m.renderStill({ file: fx('anim-gsap.html'), outDir: dir, name: 'still', width: 640, height: 360, t: 2.5 });
  const browser = await m.openBrowser();
  try {
    assert.ok((await m.compareImages(browser, f0, f75)).psnr < 30, 'frame 0 and frame 75 should differ');
    const same = await m.compareImages(browser, f75, still.files[0].file);
    assert.ok(same.psnr > 35, `frame 75 vs still at t=2.5: ${same.psnr}`);
  } finally { await browser.close(); }
});

test('aspects render separate files at the right sizes', { skip }, async () => {
  const v = await m.renderVideo({ file: fx('anim-gsap.html'), outDir: join(out, 'aspects'), name: 'clip', duration: 0.5, aspects: ['9:16', '1:1'], preset: 'ultrafast' });
  assert.deepEqual(v.videos.map((x) => { const p = m.probe(x.file); return [p.video.width, p.video.height, p.video.frames]; }), [[1080, 1920, 15], [1080, 1080, 15]]);
  assert.ok(v.videos[0].file.endsWith('clip-9x16.mp4'));
});

test('audio is muxed and trimmed to the video length', { skip }, async () => {
  const dir = join(out, 'audio');
  const wav = join(out, 'tone.wav');
  const ff = spawnSync('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=3', wav]);
  assert.equal(ff.status, 0);
  const v = await m.renderVideo({ file: fx('anim-renderat.html'), outDir: dir, name: 'withaudio', duration: 1, audio: wav, preset: 'ultrafast' });
  const p = m.probe(v.videos[0].file);
  assert.equal(p.audio.codec, 'aac');
  assert.ok(Math.abs(p.duration - 1) < 0.1, `duration ${p.duration}`);
});

test('filmstrip lays out evenly spaced frames that differ', { skip }, async () => {
  const r = await m.filmstrip({ file: fx('anim-renderat.html'), outDir: join(out, 'strip'), count: 4 });
  assert.equal(r.frames.length, 4);
  assert.ok(existsSync(r.filmstrip));
  assert.deepEqual(r.frames.map((f) => f.label), ['t = 0.63 s', 't = 1.88 s', 't = 3.13 s', 't = 4.38 s']);
  const browser = await m.openBrowser();
  try { assert.equal((await m.compareImages(browser, r.frames[0].file, r.frames[3].file)).identical, false); } finally { await browser.close(); }
});

test('a page without a duration is refused with a clear message', { skip }, async () => {
  await assert.rejects(m.renderVideo({ html: '<html><body>static</body></html>', outDir: join(out, 'nodur') }), /No duration/);
});
