// render_still: a page (HTML, SVG or image) -> PNG at one or more sizes, light and/or dark.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { jobDir, safeOutput } from './paths.mjs';
import { ASPECTS, newPage, openBrowser, waitReady } from './browser.mjs';
import { releaseSource, resolveSource } from './source.mjs';
import { pngSize } from './image.mjs';

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const slugOf = (s) => slug(s) || 'still';

export function outputDir(args) {
  return args.outDir ? resolve(args.outDir) : jobDir(args.slug || 'render');
}

// A cancelled MCP request (notifications/cancelled) aborts signal: stop before the next capture.
export function stopIfCancelled(signal) {
  if (signal && signal.aborted) throw new Error('cancelled');
}

// root: the folder outputs must stay inside (contact_sheet passes its job folder for its cells/).
// signal: aborted when the request is cancelled; the open page is closed so the work stops.
export async function renderStill(args, { browser: shared, signal, root } = {}) {
  const t0 = Date.now();
  const out = outputDir(args);
  mkdirSync(out, { recursive: true });
  const name = slugOf(args.name || 'still');
  const [aw, ah] = args.aspect ? ASPECTS[args.aspect] : [];
  // a size is { width, height, name } or an integer N (an N x N square named "N"), as in contact_sheet
  const sizes = args.sizes && args.sizes.length ? args.sizes.map((s) => (typeof s === 'number' ? { width: s, height: s, name: `${s}` } : s)) : [{ width: args.width || aw || 1200, height: args.height || ah || 630 }];
  const themes = args.theme === 'both' ? ['light', 'dark'] : [args.theme || 'light'];
  stopIfCancelled(signal);
  const src = resolveSource(args, out, name);
  let browser = shared || null;
  const files = [];
  const warnings = [];
  try {
    // inside the try: a browser that fails to launch must not leave the page or wrapper behind
    if (!browser) browser = await openBrowser();
    for (const theme of themes) {
      for (const size of sizes) {
        stopIfCancelled(signal);
        const { page, context, blocked, errors } = await newPage(browser, { width: size.width, height: size.height, scale: args.scale || 1, colorScheme: theme, seed: args.seed ?? 1, transparent: !!args.transparent, aspect: args.aspect || null, reducedMotion: args.reducedMotion });
        const cancel = () => { context.close().catch(() => {}); };
        if (signal) { signal.addEventListener('abort', cancel, { once: true }); if (signal.aborted) cancel(); }
        try {
          await page.goto(src.url, { waitUntil: 'load', timeout: 60000 });
          await waitReady(page);
          // Stills are the state at t (default 0), never whatever wall-clock time the capture lands on.
          await page.evaluate((t) => window.__easelSeek(t), typeof args.t === 'number' ? args.t : 0);
          // a size name is part of a file name: slugged like name, so it can never leave the job folder
          const sizeName = size.name ? slug(size.name) : '';
          const suffix = `${sizes.length > 1 || size.name ? `-${sizeName || `${size.width}x${size.height}`}` : ''}${themes.length > 1 || args.theme === 'dark' ? `-${theme}` : ''}`;
          const file = join(out, `${name}${suffix}.png`);
          const target = args.selector ? page.locator(args.selector).first() : page;
          // a selector that matches nothing (or nothing visible) fails now, not after a 30 s wait
          if (args.selector && !(await target.count())) throw new Error(`selector "${args.selector}" matches no element in the page`);
          if (args.selector && !(await target.isVisible())) throw new Error(`selector "${args.selector}" matches an element that is not visible (display: none, visibility: hidden or no size)`);
          const png = await target.screenshot({ omitBackground: !!args.transparent, ...(args.selector ? {} : { fullPage: !!args.fullPage }), animations: 'allow' });
          writeFileSync(safeOutput(file, root || out), png);
          // an element or a full page has its own size; report what was written
          const real = args.selector || args.fullPage ? pngSize(file) : { width: Math.round(size.width * (args.scale || 1)), height: Math.round(size.height * (args.scale || 1)) };
          files.push({ file, ...real, theme });
          if (blocked.length) warnings.push(`Blocked network requests (render is offline): ${[...new Set(blocked)].slice(0, 5).join(', ')}`);
          if (errors.length) warnings.push(`Page errors: ${[...new Set(errors)].slice(0, 5).join(' | ')}`);
        } finally {
          if (signal) signal.removeEventListener('abort', cancel);
          await context.close();
        }
      }
    }
  } finally {
    if (!shared && browser) await browser.close();
    releaseSource(src);
  }
  return { files, ms: Date.now() - t0, ...(warnings.length ? { warnings: [...new Set(warnings)] } : {}) };
}
