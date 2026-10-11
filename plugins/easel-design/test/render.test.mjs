// T3.1-T3.4: every easel-design example renders through the easel-core engine (offline, no page
// errors) and passes qa; PDFs have the expected page count. Needs the engine's Playwright and
// Chromium (doctor --install); skips otherwise, so a local run must show 0 skipped.
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
const ready = ['playwright-core', 'chromium'].every((n) => doctorReport().checks.find((c) => c.name === n)?.ok);
const skip = ready ? false : 'needs the easel-core engine installed (doctor --install)';
const { pieces } = JSON.parse(readFileSync(join(PLUGIN, 'examples', 'manifest.json'), 'utf8'));
let out, m, browser;
before(async () => {
  if (!ready) return;
  out = mkdtempSync(join(tmpdir(), 'easel-design-'));
  m = { ...(await eng('render.mjs')), ...(await eng('pdf.mjs')), ...(await eng('qa.mjs')), ...(await eng('browser.mjs')) };
  browser = await m.openBrowser();
});
after(async () => { if (browser) await browser.close(); if (out) rmSync(out, { recursive: true, force: true }); });

pieces.forEach((p, i) => {
  const file = join(PLUGIN, 'examples', p.file);
  if (p.pdf) {
    test(`${p.skill}: ${p.file} prints to a ${p.pages}-page PDF, offline`, { skip }, async () => {
      const r = await m.renderPdf({ file, outDir: join(out, `pdf-${i}`) });
      assert.equal(r.warnings, undefined, JSON.stringify(r.warnings));
      assert.equal(r.pages, p.pages);
      const boxes = [...readFileSync(r.file, 'latin1').matchAll(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/g)].map((x) => [Math.round(+x[1]), Math.round(+x[2])]);
      assert.equal(boxes.length, p.pages);
      for (const b of boxes) assert.ok(Math.abs(b[0] - p.pt[0]) <= 1 && Math.abs(b[1] - p.pt[1]) <= 1, `page ${JSON.stringify(b)} pt, want ${JSON.stringify(p.pt)}`);
    });
    return;
  }
  test(`${p.skill}: ${p.file} at ${p.width}x${p.height} renders offline and passes qa${p.fixedFrame ? ' (fixed frame)' : ''}`, { skip }, async () => {
    const r = await m.renderStill({ file, outDir: join(out, `png-${i}`), width: p.width, height: p.height }, { browser });
    assert.equal(r.warnings, undefined, JSON.stringify(r.warnings));
    // default checks: a piece with no text reports contrast as not run (naming contrast would fail it)
    const q = await m.qa({ file, width: p.width, height: p.height, mode: p.mode, fixedFrame: !!p.fixedFrame, outDir: join(out, `qa-${i}`) });
    assert.equal(q.pass, true, JSON.stringify(q.checks.map((c) => [c.name, c.pass, c.findings])));
    const contrast = q.checks.find((c) => c.name === 'contrast');
    assert.equal(contrast.findings.length, 0, `contrast below AA: ${JSON.stringify(contrast.findings)}`);
  });
});

test('logo: every concept and export renders on the size ladder (16-512 px) in light and dark, with ink in every cell', { skip }, async () => {
  const { contactSheet } = await eng('contact.mjs');
  const { measureImage } = await eng('refs.mjs');
  const files = ['concepts/a-letterform.svg', 'concepts/b-vial.svg', 'concepts/c-grid.svg', 'export/logo.svg', 'export/logo-mono.svg'].map((f) => join(PLUGIN, 'examples', 'logo', f));
  const r = await contactSheet({ items: files.map((file) => ({ file })), sizes: [16, 32, 64, 128, 512], themes: ['light', 'dark'], outDir: join(out, 'logo-ladder') });
  assert.equal(r.cells.length, files.length * 5 * 2);
  // every cell has a mark in it (the trimmed content box is not empty), smallest and largest alike
  const { images } = await measureImage({ images: r.cells.filter((x) => /· (16|512) ·/.test(x.label)).map((c) => c.file) });
  for (const im of images) assert.ok(im.box[2] >= 2 && im.box[3] >= 2, `${im.file}: ${JSON.stringify(im.box)}`);
});
