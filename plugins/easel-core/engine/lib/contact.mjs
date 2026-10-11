// contact_sheet: render items at sizes x themes (or take existing images) and compose one sheet.
import { mkdirSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { openBrowser } from './browser.mjs';
import { renderStill, outputDir, stopIfCancelled } from './render.mjs';
import { composeSheet } from './sheet.mjs';
import { imageSize } from './image.mjs';
import { safeOutput } from './paths.mjs';

const RASTER = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const slugOf = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'contact-sheet';

export async function contactSheet(args, { signal } = {}) {
  const t0 = Date.now();
  for (const [i, item] of args.items.entries()) {
    if (item.file && item.html) throw new Error(`items[${i}]: give file or html, not both`);
    if (!item.file && !item.html) throw new Error(`items[${i}]: give file (a path) or html (a page)`);
  }
  const out = outputDir(args);
  const name = slugOf(args.name || 'contact-sheet');
  const cellsDir = join(out, 'cells');
  mkdirSync(cellsDir, { recursive: true });
  const sizes = (args.sizes || []).map((s) => (typeof s === 'number' ? { width: s, height: s, name: `${s}` } : s));
  const themes = args.themes && args.themes.length ? args.themes : ['light'];
  stopIfCancelled(signal);
  const browser = await openBrowser();
  const cells = [];
  try {
    for (const [i, item] of args.items.entries()) {
      const label = item.label || (item.file ? basename(item.file) : `item ${i + 1}`);
      const isRaster = item.file && RASTER.has(extname(item.file).toLowerCase());
      if (!sizes.length && isRaster) {
        const { width, height } = await imageSize(browser, item.file);
        cells.push({ file: item.file, label, width, height, background: 'checker' });
        continue;
      }
      const useSizes = sizes.length ? sizes : [{ width: 1200, height: 630 }];
      for (const theme of themes) {
        // cells are named after the sheet: two sheets made at once in one job folder never share a cell
        const r = await renderStill({ ...(item.file ? { file: item.file } : { html: item.html }), name: `${name}-${i + 1}-${theme}`, outDir: cellsDir, sizes: useSizes, theme, transparent: !!item.file && !isRaster && extname(item.file).toLowerCase() === '.svg' }, { browser, signal, root: out });
        r.files.forEach((f, k) => cells.push({ file: f.file, label: `${label} · ${useSizes[k].name || `${useSizes[k].width}×${useSizes[k].height}`} · ${theme}`, width: f.width, height: f.height, background: theme }));
      }
    }
    stopIfCancelled(signal);
    const sheet = await composeSheet(browser, { cells, out: safeOutput(join(out, `${name}.png`), out), columns: args.columns || (sizes.length ? Math.min(sizes.length, 6) : 4), title: args.title });
    return { sheet: sheet.file, width: sheet.width, height: sheet.height, cells: cells.map((c) => ({ file: c.file, label: c.label })), ms: Date.now() - t0 };
  } finally {
    await browser.close();
  }
}
