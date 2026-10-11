// T3.5-T3.7: every easel-illustrate example renders through the easel-core engine (offline, no page
// errors) and passes qa with a fixed frame; the generative piece is seekable, deterministic, loops
// without a seam and renders to MP4. Needs the engine's Playwright, Chromium, ffmpeg and p5.js
// (doctor --install); skips otherwise, so a local run must show 0 skipped.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
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

test('generative-art: frames are a function of t (seekable, repeatable), the loop has no seam, and it renders to MP4', { skip }, async () => {
  const p = pieces.find((x) => x.skill === 'generative-art'), file = join(PLUGIN, 'examples', p.file), dir = join(out, 'gen');
  const shot = async (name, t) => (await m.renderStill({ file, outDir: dir, name, width: p.width, height: p.height, scale: 0.5, t }, { browser })).files[0].file;
  const [a0, a0b, aEnd, aMid] = [await shot('t0', 0), await shot('t0b', 0), await shot('tend', p.loop), await shot('tmid', p.loop / 2)];
  assert.ok((await m.compareImages(browser, a0, a0b)).psnr >= 60, 'the same t gives the same frame');
  assert.ok((await m.compareImages(browser, a0, aEnd)).psnr >= 50, 'the loop closes: frame at the duration equals frame 0');
  assert.ok((await m.compareImages(browser, a0, aMid)).psnr < 30, 'it moves: the middle of the loop differs');
  const v = await m.renderVideo({ file, outDir: join(dir, 'mp4'), name: 'loop', duration: 1, preset: 'ultrafast' });
  assert.equal(v.warnings, undefined, JSON.stringify(v.warnings));
  const probe = m.probe(v.videos[0].file);
  assert.deepEqual([probe.video.width, probe.video.height, probe.video.fps, probe.video.frames], [1200, 1200, 30, 30]);
});

test('svg: CSS animation is seeked by time (filmstrip frames differ), and reduced motion slows it down', { skip }, async () => {
  const file = join(PLUGIN, 'examples', 'svg', 'spinner.svg'), dir = join(out, 'spin');
  const f = await m.filmstrip({ file, outDir: dir, name: 'spin', times: [0, 0.1, 0.2], width: 96, height: 96, columns: 3 });
  const [a, b, c] = f.frames.map((x) => x.file);
  assert.ok((await m.compareImages(browser, a, b)).psnr < 40, 'frames at 0 and 0.1 s differ (the spinner turns)');
  assert.ok((await m.compareImages(browser, b, c)).psnr < 40);
  const at = async (name, t, reducedMotion) => (await m.renderStill({ file, outDir: dir, name, width: 96, height: 96, t, reducedMotion }, { browser })).files[0].file;
  // 0.8 s per turn normally, 2.4 s under reduced motion: at t = 0.2 s the reduced frame has turned a third as far
  const [n0, n2, r2] = [await at('n0', 0), await at('n2', 0.2), await at('r2', 0.2, 'reduce')];
  assert.ok((await m.compareImages(browser, n0, r2)).psnr > (await m.compareImages(browser, n0, n2)).psnr, 'reduced motion moves less in the same time');
});
