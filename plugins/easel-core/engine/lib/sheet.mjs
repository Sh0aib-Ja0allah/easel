// Composes images into one sheet (contact sheet, logo size ladder, filmstrip) by laying them out
// in an HTML grid next to the images and screenshotting it. No image library needed. Images are
// referenced by file URL, so names with "#", "?", "%" or spaces (and other drives) load. The sheet
// carries Easel's sheet mark, so measuring a folder of references leaves it out.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { newPage } from './browser.mjs';
import { markSheet, writeOutput } from './image.mjs';
import { partialPath, removeQuietly } from './probe.mjs';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const BG = { light: '#ffffff', dark: '#141414', checker: 'repeating-conic-gradient(#e8e8e8 0 25%, #ffffff 0 50%) 0 0 / 16px 16px' };

// cells: [{ file, label, width, height, background: 'light'|'dark'|'checker'|css }]
export async function composeSheet(browser, { cells, out, columns, title, maxCell = 512, gap = 16 }) {
  mkdirSync(dirname(out), { recursive: true });
  const cols = Math.max(1, columns || Math.min(cells.length, 4));
  const shown = cells.map((c) => {
    const k = Math.min(1, maxCell / Math.max(c.width, c.height));
    return { ...c, w: Math.max(1, Math.round(c.width * k)), h: Math.max(1, Math.round(c.height * k)) };
  });
  const colW = Math.max(160, ...shown.map((c) => c.w)) + 24;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;padding:${gap}px;background:#f3f1ec;font:13px/1.35 Inter,system-ui,sans-serif;color:#222;width:${cols * colW + (cols - 1) * gap}px}
    h1{font:700 16px Inter,sans-serif;margin:0 0 ${gap}px}
    .grid{display:grid;grid-template-columns:repeat(${cols},${colW}px);gap:${gap}px;align-items:start}
    figure{margin:0;border-radius:6px;overflow:hidden;border:1px solid #d9d5cc;background:#fff}
    .well{display:flex;align-items:center;justify-content:center;padding:12px;min-height:40px}
    img{display:block;image-rendering:auto}
    figcaption{padding:6px 8px;border-top:1px solid #e6e2da;background:#faf9f6;font-size:12px;overflow-wrap:anywhere}
  </style></head><body>${title ? `<h1>${esc(title)}</h1>` : ''}<div class="grid">${shown
    .map((c) => `<figure><div class="well" style="background:${BG[c.background] || c.background || BG.light}"><img src="${esc(pathToFileURL(c.file).href)}" width="${c.w}" height="${c.h}" alt=""></div><figcaption>${esc(c.label)}</figcaption></figure>`)
    .join('')}</div></body></html>`;
  const htmlPath = `${partialPath(out)}.html`; // unique: two sheets of one name at once never share a page
  writeFileSync(htmlPath, html);
  const { page, context } = await newPage(browser, { width: cols * colW + (cols - 1) * gap + 2 * gap, height: 200 });
  try {
    await page.goto(pathToFileURL(htmlPath).href);
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => i.decode().catch(() => null))); });
    writeOutput(out, markSheet(await page.screenshot({ fullPage: true })));
    const size = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));
    return { file: out, ...size, cells: cells.length };
  } finally {
    await context.close();
    removeQuietly(htmlPath);
  }
}
