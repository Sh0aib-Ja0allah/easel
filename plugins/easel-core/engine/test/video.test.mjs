// T1.3: render_video + filmstrip. Needs Playwright, Chromium and ffmpeg; skips otherwise.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
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

test('an SVG with CSS animation: filmstrip count and render_video take the CSS length; no wrapper file is left beside the SVG', { skip }, async () => {
  const dir = join(out, 'svg-src'); mkdirSync(dir, { recursive: true });
  const svg = join(dir, 'spin.svg');
  writeFileSync(svg, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200" aria-hidden="true"><style>g{transform-origin:50px 50px;animation:s 2s linear infinite}@keyframes s{to{transform:rotate(360deg)}}</style><g><rect x="10" y="45" width="80" height="10" fill="#222"/></g></svg>');
  const r = await m.filmstrip({ file: svg, outDir: join(out, 'svg-strip'), count: 4, width: 200, height: 200 });
  assert.deepEqual(r.frames.map((f) => f.label), ['t = 0.25 s', 't = 0.75 s', 't = 1.25 s', 't = 1.75 s']);
  const v = await m.renderVideo({ file: svg, outDir: join(out, 'svg-video'), preset: 'ultrafast', width: 200, height: 200 });
  assert.ok(Math.abs(m.probe(v.videos[0].file).duration - 2) < 0.1);
  assert.deepEqual(readdirSync(dir), ['spin.svg'], 'wrapper files removed');
  await assert.rejects(m.filmstrip({ file: svg, outDir: join(out, 'svg-strip2'), times: [0], aspect: 'not-a-format' }));
  assert.deepEqual(readdirSync(dir), ['spin.svg'], 'wrapper removed on error too');
});

test('a page without a duration is refused with a clear message', { skip }, async () => {
  await assert.rejects(m.renderVideo({ html: '<html><body>static</body></html>', outDir: join(out, 'nodur') }), /No duration/);
});

// EN-14: the size a page declares is read once the page is ready, not at load.
test('render_video reads the declared size after the page is ready', { skip }, async () => {
  const late = '<!doctype html><body style="margin:0"><canvas id=c></canvas><script>window.__ready = false; setTimeout(() => { window.TIMELINE = { width: 320, height: 240, duration: 0.3, fps: 10 }; const c = document.getElementById("c"); c.width = 320; c.height = 240; window.renderAt = (t) => { const g = c.getContext("2d"); g.fillStyle = `hsl(${t * 300},70%,50%)`; g.fillRect(0, 0, 320, 240); }; window.__ready = true; }, 300);</script></body>';
  const v = await m.renderVideo({ html: late, outDir: join(out, 'late'), preset: 'ultrafast' });
  const p = m.probe(v.videos[0].file);
  assert.deepEqual([p.video.width, p.video.height, p.video.frames], [320, 240, 3]);
});

// EN-20: aspects sets each format's size, so width or height with aspects is refused instead of being ignored.
test('render_video refuses width or height together with aspects', { skip }, async () => {
  await assert.rejects(m.renderVideo({ file: fx('anim-gsap.html'), outDir: join(out, 'mix'), aspects: ['1:1'], width: 640 }), /width.*aspects/);
  await assert.rejects(m.renderVideo({ file: fx('anim-gsap.html'), outDir: join(out, 'mix'), aspects: ['1:1'], height: 640 }), /height.*aspects/);
});

// EN-19: render_video, mux_audio and the sheets write to a hidden partial file that does not end in .mp4
// (or .png), so one left behind after a crash is never mistaken for output (or played as a finished video).
test('the partial file is hidden, beside the output, and not named like a video', async () => {
  const { partialPath } = await import('../lib/probe.mjs');
  const f = join(tmpdir(), 'clip.mp4'), p = partialPath(f);
  assert.equal(dirname(p), dirname(f));
  assert.match(basename(p), /^\.clip\.mp4-\d+-[0-9a-f]{8}\.partial$/);
  assert.notEqual(partialPath(f), p, 'unique per call');
});
