// render_pdf: a page (HTML or SVG) -> a print PDF (posters, flyers, business cards, decks), with
// the same offline page setup as render_still (bundled fonts, seeded random, no network).
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { newPage, openBrowser, waitReady } from './browser.mjs';
import { outputDir, stopIfCancelled } from './render.mjs';
import { releaseSource, resolveSource } from './source.mjs';
import { safeOutput } from './paths.mjs';

const slugOf = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'print';
export const PAPER = ['Letter', 'Legal', 'Tabloid', 'Ledger', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6'];
const LENGTH = /^\d+(\.\d+)?(px|in|cm|mm)$/;
// A page side is more than 0 and at most 200 in (14,400 pt), the largest page common PDF readers open.
const PER_INCH = { in: 1, cm: 2.54, mm: 25.4, px: 96 };
export const MAX_INCHES = 200;
const inches = (v) => { const m = String(v).match(/^([\d.]+)(px|in|cm|mm)$/); return Number(m[1]) / PER_INCH[m[2]]; };

// pages in a PDF Chromium wrote: count the /Type /Page objects (not /Pages)
export function pdfPages(file) {
  const s = readFileSync(file, 'latin1');
  return (s.match(/\/Type\s*\/Page(?![s\w])/g) || []).length;
}

// the size of each page, from its MediaBox, in PDF points (1 in = 72 pt)
export function pdfPageSizes(file) {
  return [...readFileSync(file, 'latin1').matchAll(/\/MediaBox\s*\[\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)\s*\]/g)].map((m) => [Number(m[1]), Number(m[2])]);
}

export async function renderPdf(args, { signal } = {}) {
  const t0 = Date.now();
  if (args.format && !PAPER.includes(args.format)) throw new Error(`format must be one of ${PAPER.join(', ')}`);
  for (const k of ['width', 'height']) {
    if (args[k] === undefined) continue;
    if (!LENGTH.test(String(args[k]))) throw new Error(`${k} must be a length such as "8.5in", "210mm", "5cm" or "1280px"`);
    // "0px" would silently print Letter, and a huge size a page no reader opens
    const n = inches(args[k]);
    if (!(n > 0) || n > MAX_INCHES) throw new Error(`${k} must be more than 0 and at most ${MAX_INCHES}in (5080mm, 19200px), the largest page common PDF readers open; got ${args[k]}`);
  }
  if (!!args.width !== !!args.height) throw new Error('give both width and height, or neither');
  const out = outputDir(args);
  mkdirSync(out, { recursive: true });
  const name = slugOf(args.name || 'print');
  stopIfCancelled(signal);
  const src = resolveSource(args, out, name);
  if (src.kind === 'image' && !/\.svg$/i.test(src.wrapperFor)) { releaseSource(src); throw new Error('render_pdf takes a page (.html or .svg); place an image in an HTML page first'); }
  let browser = null;
  const warnings = [];
  try {
    browser = await openBrowser();
    stopIfCancelled(signal);
    const { page, context, blocked, errors } = await newPage(browser, { width: args.viewportWidth || 1280, height: args.viewportHeight || 720, seed: args.seed ?? 1, colorScheme: args.theme || 'light', reducedMotion: args.reducedMotion });
    const cancel = () => { context.close().catch(() => {}); };
    if (signal) { signal.addEventListener('abort', cancel, { once: true }); if (signal.aborted) cancel(); }
    try {
      await page.goto(src.url, { waitUntil: 'load', timeout: 60000 });
      await waitReady(page);
      await page.evaluate((t) => window.__easelSeek(t), typeof args.t === 'number' ? args.t : 0);
      await page.emulateMedia({ media: 'print' });
      const file = join(out, `${name}.pdf`);
      const size = args.width ? { width: String(args.width), height: String(args.height) } : args.format ? { format: args.format } : {};
      const pdf = await page.pdf({
        printBackground: args.printBackground !== false, landscape: !!args.landscape,
        // the page's own @page size wins unless a size is given here
        preferCSSPageSize: !args.width && !args.format, ...size,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });
      writeFileSync(safeOutput(file, out), pdf);
      if (blocked.length) warnings.push(`Blocked network requests (render is offline): ${[...new Set(blocked)].slice(0, 5).join(', ')}`);
      if (errors.length) warnings.push(`Page errors: ${[...new Set(errors)].slice(0, 5).join(' | ')}`);
      // the size every page came out at (the first page's; a deck of mixed sizes lists them all)
      const sizes = pdfPageSizes(file).map(([w, h]) => ({ widthPt: +w.toFixed(2), heightPt: +h.toFixed(2), widthMm: +((w * 25.4) / 72).toFixed(1), heightMm: +((h * 25.4) / 72).toFixed(1) }));
      const mixed = sizes.some((s) => s.widthPt !== sizes[0].widthPt || s.heightPt !== sizes[0].heightPt);
      return { file, pages: pdfPages(file), pageSize: sizes[0] || null, ...(mixed ? { pageSizes: sizes } : {}), bytes: statSync(file).size, ms: Date.now() - t0, ...(warnings.length ? { warnings } : {}) };
    } finally {
      if (signal) signal.removeEventListener('abort', cancel);
      await context.close();
    }
  } finally {
    if (browser) await browser.close();
    releaseSource(src);
  }
}
