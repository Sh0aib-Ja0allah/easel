// T2.1: the animate-kit page contract in the engine: window.renderFrame(t), window.TIMELINE,
// window.__easel.aspect, window.ASSETS_READY, and audio "page" (window.renderAudioWav, mastered to
// -14 LUFS). Needs Playwright, Chromium and ffmpeg; skips otherwise.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { doctorReport } from '../lib/doctor.mjs';

const ready = ['playwright-core', 'chromium', 'ffmpeg', 'ffprobe'].every((n) => doctorReport().checks.find((c) => c.name === n)?.ok);
const skip = ready ? false : 'needs doctor --install and ffmpeg';
const fx = (f) => fileURLToPath(new URL(`./fixtures/${f}`, import.meta.url));
let out, m, browser;
before(async () => {
  if (!ready) return;
  out = mkdtempSync(join(tmpdir(), 'easel-rf-'));
  m = { ...(await import('../lib/video.mjs')), ...(await import('../lib/probe.mjs')), ...(await import('../lib/image.mjs')), ...(await import('../lib/browser.mjs')), ...(await import('../lib/render.mjs')), ...(await import('../lib/qa.mjs')) };
  browser = await m.openBrowser();
});
after(async () => { if (browser) await browser.close(); if (out) rmSync(out, { recursive: true, force: true }); });

test('window.TIMELINE sets size, fps and duration; renderFrame(t) is seeked frame by frame', { skip }, async () => {
  const dir = join(out, 'tl');
  const v = await m.renderVideo({ file: fx('anim-renderframe.html'), outDir: dir, name: 'v', crf: 4, preset: 'ultrafast' });
  const p = m.probe(v.videos[0].file);
  assert.deepEqual([p.video.width, p.video.height, p.video.fps, p.video.frames], [640, 360, 10, 20]);
  assert.ok(!p.audio, 'no audio unless asked');
  const f0 = m.extractFrame(v.videos[0].file, 0, join(dir, 'f0.png'));
  const f15 = m.extractFrame(v.videos[0].file, 15, join(dir, 'f15.png'));
  const still = await m.renderStill({ file: fx('anim-renderframe.html'), outDir: dir, name: 'still', width: 640, height: 360, t: 1.5 }, { browser });
  assert.ok((await m.compareImages(browser, f0, f15)).psnr < 30, 'frame 0 and frame 15 should differ');
  const same = await m.compareImages(browser, f15, still.files[0].file);
  assert.ok(same.psnr > 35, `frame 15 vs still at t=1.5: ${same.psnr}`);
  assert.equal(v.warnings, undefined, JSON.stringify(v.warnings));
});

test('window.__easel.aspect reaches the page, and each aspect reports its own TIMELINE size', { skip }, async () => {
  for (const [aspect, size] of [[null, [640, 360]], ['9:16', [1080, 1920]], ['1:1', [1080, 1080]]]) {
    const { page, context } = await m.newPage(browser, { width: 400, height: 400, aspect });
    try {
      await page.goto(pathToFileURL(fx('anim-renderframe.html')).href);
      assert.equal(await page.evaluate(() => window.__easel.aspect), aspect);
      const info = await m.compositionInfo(page);
      assert.deepEqual([info.width, info.height, info.fps, info.duration], [...size, 10, 2]);
    } finally { await context.close(); }
  }
  const s = await m.renderStill({ file: fx('anim-renderframe.html'), outDir: join(out, 'aspect'), name: 's', aspect: '4:5', t: 1 }, { browser });
  assert.deepEqual(m.pngSize(s.files[0].file), { width: 1080, height: 1350 });
});

test('audio "page": the page score is mastered to -14 LUFS, saved as <name>.wav and muxed', { skip }, async () => {
  const dir = join(out, 'audio');
  const v = await m.renderVideo({ file: fx('anim-renderframe.html'), outDir: dir, name: 'scored', audio: 'page', preset: 'ultrafast', aspects: ['16:9', '1:1'] });
  const wav = join(dir, 'scored.wav');
  assert.ok(existsSync(wav), 'mastered WAV written next to the video');
  assert.ok(!existsSync(join(dir, 'scored-score-raw.wav')), 'the raw page WAV is removed');
  const loud = m.loudness(wav);
  assert.ok(loud.pass, JSON.stringify(loud));
  assert.ok(Math.abs(loud.value + 14) <= 1, `integrated ${loud.value} LUFS, want -14 +- 1`);
  for (const x of v.videos) {
    const p = m.probe(x.file);
    assert.ok(p.audio, `${x.file} has an audio stream`);
    assert.ok(Math.abs(p.duration - 2) < 0.1, `duration ${p.duration}`);
    assert.equal(x.audio, wav);
  }
  assert.deepEqual(v.videos.map((x) => x.aspect), ['16:9', '1:1']);
});

test('audio "page" on a page without a score is a clear error', { skip }, async () => {
  await assert.rejects(m.renderVideo({ file: fx('anim-assets.html'), outDir: join(out, 'noscore'), name: 'x', audio: 'page', preset: 'ultrafast' }), /renderAudioWav/);
});

test('window.ASSETS_READY: rendering waits until renderFrame appears', { skip }, async () => {
  const s = await m.renderStill({ file: fx('anim-assets.html'), outDir: join(out, 'assets'), name: 'a', width: 320, height: 180, t: 0.5 }, { browser });
  const px = await m.withPixels(browser, [s.files[0].file], (imgs) => Array.from(imgs[0].data.slice(0, 3)));
  assert.deepEqual(px, [0x2a, 0x9d, 0x8f], 'the frame was drawn by renderFrame, not left black');
});

test('qa canvas_text: cut off and overlapping text fail, the phone-UI band warns, textIgnore allows', { skip }, async () => {
  const r = await m.qa({ file: fx('canvas-text.html'), checks: ['canvas_text'], every: 1, outDir: join(out, 'ct') });
  const c = r.checks.find((x) => x.name === 'canvas_text');
  assert.equal(c.pass, false);
  assert.equal(r.pass, false);
  const kinds = c.findings.map((f) => `${f.severity}:${f.kind}:${f.text}`).sort();
  assert.deepEqual(kinds, [
    'fail:cut off by the frame edge:runs off the edge',
    'fail:overlaps other text:"first label" × "second one"',
    'warn:under the phone UI (safe zone):under the buttons',
  ]);
  const cut = c.findings.find((f) => f.kind === 'cut off by the frame edge');
  assert.deepEqual([cut.t0, cut.t1, cut.frames], [0.5, 0.9, 5]);
  const ok = await m.qa({ file: fx('canvas-text.html'), checks: ['canvas_text'], every: 1, textIgnore: [[0, 0.3, 'a deliberate pile-up'], [0.5, 1, 'the label exits']], outDir: join(out, 'ct2') });
  assert.equal(ok.pass, true, JSON.stringify(ok.checks));
  assert.equal(ok.checks[0].allowed, 2);
});

test('qa canvas_text: a clean piece passes; a page that is not a canvas piece is reported when asked', { skip }, async () => {
  const r = await m.qa({ file: fx('anim-renderframe.html'), checks: ['canvas_text'], outDir: join(out, 'ct3') });
  assert.equal(r.pass, true, JSON.stringify(r.checks));
  assert.equal(r.checks[0].framesSampled, 4);
  const sq = await m.qa({ file: fx('anim-renderframe.html'), checks: ['canvas_text'], aspect: '9:16', outDir: join(out, 'ct4') });
  assert.equal(sq.checks[0].aspect, '9:16');
  const no = await m.qa({ file: fx('still.html'), checks: ['canvas_text'], outDir: join(out, 'ct5') });
  assert.equal(no.pass, false);
  assert.match(JSON.stringify(no.checks[0].findings), /window\.renderFrame/);
});

test('qa beat_grid: a cut off the 8th-note grid fails with the nearest grid time; no checks named runs every canvas check', { skip }, async () => {
  const r = await m.qa({ file: fx('canvas-text.html'), checks: ['beat_grid'], outDir: join(out, 'bg') });
  assert.deepEqual(r.checks.map((c) => c.name), ['beat_grid']);
  const g = r.checks[0];
  assert.equal(g.pass, false);
  assert.equal(g.eventsChecked, 3);
  assert.deepEqual(g.findings.map((f) => [f.kind, f.t, f.nearest]), [['cut', 0.6, 0.5]]);
  const all = await m.qa({ file: fx('canvas-text.html'), outDir: join(out, 'bg2') });
  assert.deepEqual(all.checks.map((c) => c.name).sort(), ['beat_grid', 'canvas_text', 'contrast', 'text_clipping']);
  assert.deepEqual(all.hardFailures.sort(), ['beat_grid', 'canvas_text']);
});
