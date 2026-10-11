// T3.5-T3.7: every easel-illustrate example renders through the easel-core engine (offline, no page
// errors) and passes qa with a fixed frame; the generative piece is seekable, deterministic, loops
// without a seam and renders to MP4. Needs the engine's Playwright, Chromium, ffmpeg and p5.js
// (doctor --install); skips otherwise, so a local run must show 0 skipped.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PLUGIN } from './paths.mjs';

const ENGINE = join(PLUGIN, '..', 'easel-core', 'engine', 'lib');
const eng = async (f) => import(pathToFileURL(join(ENGINE, f)).href);
const { doctorReport } = await eng('doctor.mjs');
const ready = ['playwright-core', 'chromium', 'ffmpeg', 'ffprobe', 'p5'].every((n) => doctorReport().checks.find((c) => c.name === n)?.ok);
const skip = ready ? false : 'needs the easel-core engine installed (doctor --install: Chromium, p5.js) and ffmpeg';
const { pieces } = JSON.parse(readFileSync(join(PLUGIN, 'examples', 'manifest.json'), 'utf8'));
let out, m, browser;
before(async () => {
  if (!ready) return;
  out = mkdtempSync(join(tmpdir(), 'easel-illustrate-'));
  m = { ...(await eng('render.mjs')), ...(await eng('qa.mjs')), ...(await eng('browser.mjs')), ...(await eng('image.mjs')), ...(await eng('video.mjs')), ...(await eng('probe.mjs')) };
  browser = await m.openBrowser();
});
after(async () => { if (browser) await browser.close(); if (out) rmSync(out, { recursive: true, force: true }); });

pieces.forEach((p, i) => {
  test(`${p.skill}: ${p.file} at ${p.width}x${p.height} renders offline (light and dark) and passes qa`, { skip }, async () => {
    const file = join(PLUGIN, 'examples', p.file);
    const r = await m.renderStill({ file, outDir: join(out, `png-${i}`), width: p.width, height: p.height, theme: 'both' }, { browser });
    assert.equal(r.warnings, undefined, JSON.stringify(r.warnings));
    assert.equal(r.files.length, 2);
    const q = await m.qa({ file, width: p.width, height: p.height, fixedFrame: true, checks: ['text_clipping', 'contrast'], outDir: join(out, `qa-${i}`) });
    assert.equal(q.pass, true, JSON.stringify(q.checks.map((c) => [c.name, c.pass, c.findings])));
    assert.equal(q.checks.find((c) => c.name === 'contrast').findings.length, 0);
  });
});

test('generative-art: frames are a function of t (seekable out of order, repeatable), the last frame flows into the first, and it renders to MP4', { skip }, async () => {
  const p = pieces.find((x) => x.skill === 'generative-art'), file = join(PLUGIN, 'examples', p.file), dir = join(out, 'gen');
  const fps = 30, step = 1 / fps;
  const shot = async (name, t) => (await m.renderStill({ file, outDir: dir, name, width: p.width, height: p.height, scale: 0.5, t }, { browser })).files[0].file;
  const [a0, a0b, a1, aLast, aMid] = [await shot('t0', 0), await shot('t0b', 0), await shot('t1', step), await shot('tlast', p.loop - step), await shot('tmid', p.loop / 2)];
  assert.ok((await m.compareImages(browser, a0, a0b)).psnr >= 60, 'the same t gives the same frame');
  // The seam: the step from the last frame back to frame 0 must look like any other one-frame step.
  // (Comparing t = duration with t = 0 proves nothing: the viewer wraps time, so both are paint(0).)
  const normal = (await m.compareImages(browser, a0, a1)).psnr, seam = (await m.compareImages(browser, aLast, a0)).psnr;
  assert.ok(seam >= normal - 3, `the loop jumps at the seam: last->first PSNR ${seam.toFixed(1)} vs one ordinary step ${normal.toFixed(1)}`);
  assert.ok((await m.compareImages(browser, a0, aMid)).psnr < 30, 'it moves: the middle of the loop differs');
  // Seekable: one page seeked out of order (3 s, 1 s, 3 s) shows the same frame both times at 3 s.
  mkdirSync(dir, { recursive: true });
  const { page, context } = await m.newPage(browser, { width: p.width, height: p.height, scale: 0.5 });
  try {
    await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
    await m.waitReady(page);
    const at = async (t, f) => { await page.evaluate((tt) => window.__easelSeek(tt), t); await page.screenshot({ path: join(dir, f) }); return join(dir, f); };
    const first = await at(3, 'seek-a.png'); await at(1, 'seek-b.png'); const again = await at(3, 'seek-c.png');
    assert.ok((await m.compareImages(browser, first, again)).psnr >= 60, 'seeking back gives the same frame (nothing piles up between frames)');
  } finally { await context.close(); }
  const v = await m.renderVideo({ file, outDir: join(dir, 'mp4'), name: 'loop', duration: 1, preset: 'ultrafast' });
  assert.equal(v.warnings, undefined, JSON.stringify(v.warnings));
  const probe = m.probe(v.videos[0].file);
  assert.deepEqual([probe.video.width, probe.video.height, probe.video.fps, probe.video.frames], [1200, 1200, 30, 30]);
});

test('svg: CSS animation is seeked by time (filmstrip frames differ), and reduced motion slows it down', { skip }, async () => {
  const file = join(PLUGIN, 'examples', 'svg', 'spinner.svg'), dir = join(out, 'spin');
  const f = await m.filmstrip({ file, outDir: dir, name: 'spin', times: [0, 0.1, 0.2], width: 96, height: 96, columns: 3 });
  // count alone works too, as the skills tell the model: the length is measured from the CSS animation
  const byCount = await m.filmstrip({ file, outDir: dir, name: 'spin-count', count: 4, width: 96, height: 96 });
  assert.equal(byCount.frames.length, 4);
  const [a, b, c] = f.frames.map((x) => x.file);
  assert.ok((await m.compareImages(browser, a, b)).psnr < 40, 'frames at 0 and 0.1 s differ (the spinner turns)');
  assert.ok((await m.compareImages(browser, b, c)).psnr < 40);
  const at = async (name, t, reducedMotion) => (await m.renderStill({ file, outDir: dir, name, width: 96, height: 96, t, reducedMotion }, { browser })).files[0].file;
  // 0.8 s per turn normally, 2.4 s under reduced motion: at t = 0.2 s the reduced frame has turned a third as far
  const [n0, n2, r2] = [await at('n0', 0), await at('n2', 0.2), await at('r2', 0.2, 'reduce')];
  assert.ok((await m.compareImages(browser, n0, r2)).psnr > (await m.compareImages(browser, n0, n2)).psnr, 'reduced motion moves less in the same time');
});

test('no wrapper pages are left beside the examples', { skip }, () => {
  for (const d of ['svg', 'svg-illustration', 'concept-illustration']) assert.deepEqual(readdirSync(join(PLUGIN, 'examples', d)).filter((f) => f.startsWith('.easel-wrap-')), [], d);
});
