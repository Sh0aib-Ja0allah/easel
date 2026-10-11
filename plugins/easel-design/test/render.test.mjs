// T3.1-T3.4: every easel-design example renders through the easel-core engine (offline, no page
// errors) and passes qa; PDFs have the expected page count. Needs the engine's Playwright and
// Chromium (doctor --install); skips otherwise, so a local run must show 0 skipped.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

// D32 (Q-33): the delivered -embedded.svg keeps its face where Easel's fonts are absent (a browser
// showing it as an <img>); the bare lock-up falls back to another face there
test('logo: the lock-up -embedded.svg looks the same in a plain browser page as in Easel, the bare SVG does not', { skip }, async () => {
  const { compareImages } = await eng('image.mjs');
  const dir = join(PLUGIN, 'examples', 'logo', 'export'), d32 = join(out, 'd32');
  mkdirSync(d32, { recursive: true });
  const easel = (await m.renderStill({ file: join(dir, 'lockup.svg'), outDir: d32, width: 748, height: 240, name: 'easel' }, { browser })).files[0].file;
  const plain = async (name) => {
    const html = join(d32, `plain-${name}.html`), png = join(d32, `plain-${name}.png`);
    writeFileSync(html, `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#fff}img{display:block}</style></head><body><img src="${pathToFileURL(join(dir, name)).href}" width="748" height="240" alt=""></body></html>`);
    const { page, context } = await m.newPage(browser, { width: 748, height: 240, fonts: false });
    try {
      await page.goto(pathToFileURL(html).href, { waitUntil: 'load' });
      await page.evaluate(async () => { await Promise.all([...document.images].map((i) => i.decode())); await document.fonts.ready; });
      await page.screenshot({ path: png, type: 'png' });
    } finally { await context.close(); }
    return compareImages(browser, easel, png);
  };
  const emb = await plain('lockup-embedded.svg'), bare = await plain('lockup.svg');
  assert.ok(emb.identical || emb.psnr >= 35, `embedded: ${JSON.stringify(emb)}`);
  assert.ok(bare.diffRatio > 0.01, `the bare SVG should fall back to another face without Easel's fonts: ${JSON.stringify(bare)}`);
});

// Q-08 (C1): the HTML deliverables carry their faces. embed_fonts writes an -embedded.html whose
// @font-face rules cover every bundled family the page and its local stylesheets name, and changes
// nothing else
test('HTML deliverables: embed_fonts gives each page @font-face for every bundled family it names', { skip }, async () => {
  const { embedFonts, bundledFaces } = await eng('embed.mjs');
  const families = [...new Set(bundledFaces().map((f) => f.family))];
  for (const f of ['landing-page/home-physio.html', 'ui-design/mobile-bills.html', 'presentation/members-meeting.html', 'brand-identity/card.html', 'ad-creative/ad-300x250.html']) {
    const page = join(PLUGIN, 'examples', f), src = readFileSync(page, 'utf8');
    const css = [...src.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map((l) => readFileSync(join(page, '..', l[1]), 'utf8')).join('\n');
    const named = families.filter((x) => (src + css).includes(x));
    assert.ok(named.length, `${f} names no bundled family`);
    const r = await embedFonts({ file: page, outDir: join(out, 'c1', f.split('/')[0]) });
    const copy = readFileSync(r.file, 'utf8'), block = /<style data-easel-fonts>([\s\S]*?)<\/style>/.exec(copy);
    assert.ok(block, `${f}: no data-easel-fonts block`);
    assert.equal(copy.replace(/<style data-easel-fonts>[\s\S]*?<\/style>\n?/, ''), src, `${f}: the copy differs from the page outside the font block`);
    for (const x of named) assert.match(block[1], new RegExp(`font-family:\\s*['"]${x}['"]`), `${f}: no @font-face for ${x}`);
  }
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
