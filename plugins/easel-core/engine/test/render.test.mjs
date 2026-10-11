// T1.2: render_still and contact_sheet. Needs Playwright + Chromium (doctor --install); skips otherwise.
// Golden frames live in test/golden/; they were reviewed by eye once and are frozen. Regenerate
// only on purpose: EASEL_UPDATE_GOLDEN=1 npm test, then look at the new PNG before committing.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdtempSync, rmSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { doctorReport } from '../lib/doctor.mjs';

const ready = ['playwright-core', 'chromium'].every((n) => doctorReport().checks.find((c) => c.name === n)?.ok);
const skip = ready ? false : 'Playwright/Chromium not installed (run doctor --install)';
const fx = (f) => fileURLToPath(new URL(`./fixtures/${f}`, import.meta.url));
const golden = (f) => fileURLToPath(new URL(`./golden/${f}`, import.meta.url));
// Text antialiasing differs between operating systems; same-OS renders must be near-identical.
const GOLDEN_PSNR = Number(process.env.EASEL_GOLDEN_PSNR || 40);

let out, browser, mod;
before(async () => {
  if (!ready) return;
  out = mkdtempSync(join(tmpdir(), 'easel-render-'));
  mod = {
    ...(await import('../lib/render.mjs')),
    ...(await import('../lib/contact.mjs')),
    ...(await import('../lib/image.mjs')),
    ...(await import('../lib/browser.mjs')),
  };
  browser = await mod.openBrowser();
});
after(async () => { if (browser) await browser.close(); if (out) rmSync(out, { recursive: true, force: true }); });

test('golden frame matches (light and dark)', { skip }, async (t) => {
  const r = await mod.renderStill({ file: fx('still.html'), outDir: out, name: 'golden', width: 640, height: 360, theme: 'both' }, { browser });
  assert.equal(r.files.length, 2);
  for (const f of r.files) {
    const g = golden(`still-${f.theme}-${process.platform}.png`);
    if (process.env.EASEL_UPDATE_GOLDEN === '1') { copyFileSync(f.file, g); continue; }
    // CI on a new OS: write a candidate golden for a person to review, and say so loudly.
    if (!existsSync(g) && process.env.EASEL_GOLDEN_MISSING === 'write') { copyFileSync(f.file, g); t.diagnostic(`CANDIDATE GOLDEN WRITTEN: ${g} (review by eye, then commit)`); continue; }
    assert.ok(existsSync(g), `missing golden ${g} (generate with EASEL_UPDATE_GOLDEN=1 and review it)`);
    const cmp = await mod.compareImages(browser, f.file, g);
    assert.ok(cmp.sameSize, JSON.stringify(cmp));
    assert.ok(cmp.psnr >= GOLDEN_PSNR, `${f.theme}: PSNR ${cmp.psnr.toFixed(2)} dB < ${GOLDEN_PSNR} (${cmp.diffPixels} px differ)`);
  }
});

test('the golden comparison is not vacuous: a changed render fails it', { skip }, async () => {
  const html = readFileSync(fx('still.html'), 'utf8').replace('Easel golden frame', 'Easel golden frame!').replace('#d1603d', '#3d8bd1');
  const r = await mod.renderStill({ html, outDir: out, name: 'changed', width: 640, height: 360 }, { browser });
  const g = golden(`still-light-${process.platform}.png`);
  if (!existsSync(g)) return;
  const cmp = await mod.compareImages(browser, r.files[0].file, g);
  assert.ok(cmp.psnr < GOLDEN_PSNR, `changed render still passed: ${cmp.psnr}`);
  assert.ok(cmp.diffPixels > 100);
});

test('renders are deterministic, and the seed drives Math.random', { skip }, async () => {
  const a = await mod.renderStill({ file: fx('still.html'), outDir: out, name: 'det-a', width: 640, height: 360 }, { browser });
  const b = await mod.renderStill({ file: fx('still.html'), outDir: out, name: 'det-b', width: 640, height: 360 }, { browser });
  const c = await mod.renderStill({ file: fx('still.html'), outDir: out, name: 'det-c', width: 640, height: 360, seed: 99 }, { browser });
  assert.equal((await mod.compareImages(browser, a.files[0].file, b.files[0].file)).identical, true);
  assert.equal((await mod.compareImages(browser, a.files[0].file, c.files[0].file)).identical, false);
});

test('bundled fonts are used (not a fallback)', { skip }, async () => {
  const { page, context } = await mod.newPage(browser, { width: 400, height: 200 });
  try {
    await page.goto(pathToFileURL(fx('still.html')).href);
    // Load each bundled face explicitly; a family that only falls back would load zero faces.
    const loaded = await page.evaluate(async () => {
      const out = [];
      for (const f of ['Inter', 'Space Grotesk', 'Newsreader', 'JetBrains Mono', 'Caveat', 'STIX Two Text']) for (const w of [400, 700]) out.push([`${f} ${w}`, (await document.fonts.load(`${w} 16px "${f}"`)).length]);
      for (const spec of ['900 16px "Inter"', 'italic 400 16px "STIX Two Text"', 'italic 700 16px "STIX Two Text"', '400 16px "Noto Sans Math"']) out.push([spec, (await document.fonts.load(spec, '\u2248')).length]);
      return out;
    });
    for (const [f, n] of loaded) assert.ok(n > 0, `${f} did not load`);
  } finally { await context.close(); }
});

test('sizes and image sources: SVG at a size ladder has exact pixel sizes', { skip }, async () => {
  const r = await mod.renderStill({ file: fx('mark.svg'), outDir: out, name: 'mark', sizes: [{ width: 16, height: 16 }, { width: 64, height: 64 }, { width: 512, height: 512 }], transparent: true }, { browser });
  assert.deepEqual(r.files.map((f) => mod.pngSize(f.file)), [{ width: 16, height: 16 }, { width: 64, height: 64 }, { width: 512, height: 512 }]);
  assert.deepEqual(readdirSync(fx('.')).filter((f) => f.startsWith('.easel-wrap-mark.svg') && f.includes(`-${process.pid}-`)), [], 'wrapper page cleaned up');
});

test('renders are offline; GSAP CDN URLs are served from the local copy', { skip }, async () => {
  const r = await mod.renderStill({ file: fx('offline.html'), outDir: out, name: 'offline', width: 200, height: 100 }, { browser });
  assert.match((r.warnings || []).join(' '), /Blocked network requests.*example\.com/);
  const { page, context } = await mod.newPage(browser, { width: 200, height: 100 });
  try {
    await page.goto(pathToFileURL(fx('offline.html')).href);
    const v = await page.textContent('#v');
    assert.equal(v, 'gsap 3.14.2');
  } finally { await context.close(); }
});

test('p5.js CDN URLs are served from the copy doctor installed, and renderAt(t) seeks a p5 sketch', { skip: skip || (!(await import('../lib/deps.mjs')).findPackage('p5') && 'needs p5 (doctor --install)') }, async () => {
  const at = async (name, t) => (await mod.renderStill({ file: fx('p5-offline.html'), outDir: join(out, 'p5'), name, width: 120, height: 60, t }, { browser })).files[0];
  const a = await at('p5-0', 0), b = await at('p5-half', 0.5);
  const px = await mod.withPixels(browser, [a.file, b.file], (imgs) => imgs.map((i) => { const at = (x, y) => Array.from(i.data.slice((y * i.width + x) * 4, (y * i.width + x) * 4 + 3)); return [at(15, 30), at(55, 30)]; }));
  assert.deepEqual(px[0], [[244, 162, 97], [42, 157, 143]], 'at t=0 the square is on the left');
  assert.deepEqual(px[1], [[42, 157, 143], [244, 162, 97]], 'at t=0.5 it has moved to the middle');
  const { page, context } = await mod.newPage(browser, { width: 120, height: 60 });
  try {
    await page.goto(pathToFileURL(fx('p5-offline.html')).href);
    await page.waitForFunction(() => window.__ready === true);
    assert.equal(await page.title(), 'p5 1.11.13');
  } finally { await context.close(); }
});

test('contact_sheet: logo ladder on light and dark', { skip }, async () => {
  const r = await mod.contactSheet({ items: [{ file: fx('mark.svg'), label: 'mark' }], sizes: [16, 32, 64, 128], themes: ['light', 'dark'], outDir: join(out, 'sheet'), title: 'Size ladder' });
  assert.equal(r.cells.length, 8);
  assert.ok(existsSync(r.sheet));
  const s = mod.pngSize(r.sheet);
  assert.ok(s.width > 600 && s.height > 150, JSON.stringify(s));
});

test('contact_sheet: existing PNGs are laid out as-is', { skip }, async () => {
  const a = await mod.renderStill({ file: fx('still.html'), outDir: out, name: 'panel', width: 320, height: 180, theme: 'both' }, { browser });
  const r = await mod.contactSheet({ items: a.files.map((f) => ({ file: f.file, label: f.theme })), outDir: join(out, 'panels'), columns: 2 });
  assert.equal(r.cells.length, 2);
  assert.ok(existsSync(r.sheet));
});

test('an SVG drawn in currentColor follows the theme: dark ink on light, light ink on dark', { skip }, async () => {
  const { mkdirSync, writeFileSync } = await import('node:fs');
  const dir = join(out, 'cc'); mkdirSync(dir, { recursive: true });
  const svg = join(dir, 'icon.svg');
  writeFileSync(svg, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="0" y="0" width="24" height="24" fill="currentColor"/></svg>');
  const r = await mod.renderStill({ file: svg, outDir: dir, name: 'cc', width: 24, height: 24, theme: 'both' }, { browser });
  const px = await mod.withPixels(browser, r.files.map((f) => f.file), (imgs) => imgs.map((i) => Array.from(i.data.slice(0, 3))));
  assert.deepEqual(px, [[17, 17, 17], [242, 242, 242]]);
});
