// render_pdf: a page (HTML or SVG) -> a print PDF (posters, flyers, business cards, decks), with
// the same offline page setup as render_still (bundled fonts, seeded random, no network).
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { newPage, openBrowser, waitReady } from './browser.mjs';
import { outputDir } from './render.mjs';
import { releaseSource, resolveSource } from './source.mjs';

const slugOf = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'print';
export const PAPER = ['Letter', 'Legal', 'Tabloid', 'Ledger', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6'];
const LENGTH = /^\d+(\.\d+)?(px|in|cm|mm)$/;

// pages in a PDF Chromium wrote: count the /Type /Page objects (not /Pages)
export function pdfPages(file) {
  const s = readFileSync(file, 'latin1');
  return (s.match(/\/Type\s*\/Page(?![s\w])/g) || []).length;
}

export async function renderPdf(args) {
  const t0 = Date.now();
  if (args.format && !PAPER.includes(args.format)) throw new Error(`format must be one of ${PAPER.join(', ')}`);
  for (const k of ['width', 'height']) if (args[k] !== undefined && !LENGTH.test(String(args[k]))) throw new Error(`${k} must be a length such as "8.5in", "210mm", "5cm" or "1280px"`);
  if (!!args.width !== !!args.height) throw new Error('give both width and height, or neither');
  const out = outputDir(args);
  mkdirSync(out, { recursive: true });
  const name = slugOf(args.name || 'print');
  const src = resolveSource(args, out, name);
  if (src.kind === 'image' && !/\.svg$/i.test(src.wrapperFor)) { releaseSource(src); throw new Error('render_pdf takes a page (.html or .svg); place an image in an HTML page first'); }
  let browser = null;
  const warnings = [];
  try {
    browser = await openBrowser();
    const { page, context, blocked, errors } = await newPage(browser, { width: args.viewportWidth || 1280, height: args.viewportHeight || 720, seed: args.seed ?? 1, colorScheme: args.theme || 'light' });
    try {
      await page.goto(src.url, { waitUntil: 'load', timeout: 60000 });
      await waitReady(page);
      await page.evaluate((t) => window.__easelSeek(t), typeof args.t === 'number' ? args.t : 0);
      await page.emulateMedia({ media: 'print' });
      const file = join(out, `${name}.pdf`);
      const size = args.width ? { width: String(args.width), height: String(args.height) } : args.format ? { format: args.format } : {};
      await page.pdf({
        path: file, printBackground: args.printBackground !== false, landscape: !!args.landscape,
        // the page's own @page size wins unless a size is given here
        preferCSSPageSize: !args.width && !args.format, ...size,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });
      if (blocked.length) warnings.push(`Blocked network requests (render is offline): ${[...new Set(blocked)].slice(0, 5).join(', ')}`);
      if (errors.length) warnings.push(`Page errors: ${[...new Set(errors)].slice(0, 5).join(' | ')}`);
      return { file, pages: pdfPages(file), bytes: statSync(file).size, ms: Date.now() - t0, ...(warnings.length ? { warnings } : {}) };
    } finally {
      await context.close();
    }
  } finally {
    if (browser) await browser.close();
    releaseSource(src);
  }
}
