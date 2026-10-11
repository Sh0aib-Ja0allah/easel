// render_still: a page (HTML, SVG or image) -> PNG at one or more sizes, light and/or dark.
import { mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { jobDir } from './paths.mjs';
import { newPage, openBrowser, waitReady } from './browser.mjs';
import { resolveSource } from './source.mjs';

const slugOf = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'still';

export function outputDir(args) {
  return args.outDir ? resolve(args.outDir) : jobDir(args.slug || 'render');
}

export async function renderStill(args, { browser: shared } = {}) {
  const t0 = Date.now();
  const out = outputDir(args);
  mkdirSync(out, { recursive: true });
  const name = slugOf(args.name || 'still');
  const sizes = args.sizes && args.sizes.length ? args.sizes : [{ width: args.width || 1200, height: args.height || 630 }];
  const themes = args.theme === 'both' ? ['light', 'dark'] : [args.theme || 'light'];
  const src = resolveSource(args, out, name);
  const browser = shared || (await openBrowser());
  const files = [];
  const warnings = [];
  try {
    for (const theme of themes) {
      for (const size of sizes) {
        const { page, context, blocked, errors } = await newPage(browser, { width: size.width, height: size.height, scale: args.scale || 1, colorScheme: theme, seed: args.seed ?? 1, transparent: !!args.transparent });
        try {
          await page.goto(src.url, { waitUntil: 'load', timeout: 60000 });
          await waitReady(page);
          // Stills are the state at t (default 0), never whatever wall-clock time the capture lands on.
          await page.evaluate((t) => window.__easelSeek(t), typeof args.t === 'number' ? args.t : 0);
          const suffix = `${sizes.length > 1 || size.name ? `-${size.name || `${size.width}x${size.height}`}` : ''}${themes.length > 1 || args.theme === 'dark' ? `-${theme}` : ''}`;
          const file = join(out, `${name}${suffix}.png`);
          const target = args.selector ? page.locator(args.selector).first() : page;
          await target.screenshot({ path: file, omitBackground: !!args.transparent, ...(args.selector ? {} : { fullPage: !!args.fullPage }), animations: 'allow' });
          files.push({ file, width: size.width * (args.scale || 1), height: size.height * (args.scale || 1), theme });
          if (blocked.length) warnings.push(`Blocked network requests (render is offline): ${[...new Set(blocked)].slice(0, 5).join(', ')}`);
          if (errors.length) warnings.push(`Page errors: ${[...new Set(errors)].slice(0, 5).join(' | ')}`);
        } finally {
          await context.close();
        }
      }
    }
  } finally {
    if (!shared) await browser.close();
    if (src.kind === 'image') rmSync(src.path, { force: true });
  }
  return { files, ms: Date.now() - t0, ...(warnings.length ? { warnings: [...new Set(warnings)] } : {}) };
}
