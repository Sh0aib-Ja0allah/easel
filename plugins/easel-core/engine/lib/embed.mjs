// embed_fonts: an SVG whose text names a bundled family (font-family="Space Grotesk") looks right in
// Easel's renders, which inject the bundled faces, and falls back to a default serif everywhere else
// (a browser, Figma, slides). This writes a copy that carries the faces its text uses as base64 WOFF2
// @font-face rules, so it looks the same wherever it goes. Only the bundled OFL faces are embedded.
// Which family, weight and style each text run uses is read from the computed style in the engine's
// browser, so CSS classes, the font shorthand and inheritance all count.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { FONTS_DIR, newPage, openBrowser } from './browser.mjs';
import { svgWrapper } from './source.mjs';

const GENERIC = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded', 'math', 'emoji', 'fangsong', '-apple-system', 'blinkmacsystemfont']);
const UNSET = 'easel-no-font-family';

export function bundledFaces() {
  return JSON.parse(readFileSync(join(FONTS_DIR, 'fonts.json'), 'utf8')).faces.map((f) => ({ family: f.family, weight: Number(f.weight), style: f.style || 'normal', file: f.file }));
}

// A computed font-family list -> family names, quotes removed.
export function familyList(list) {
  return (String(list).match(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^,]+/g) || []).map((s) => s.trim().replace(/^(["'])([\s\S]*)\1$/, '$2').trim()).filter(Boolean);
}

// CSS font matching for weight (CSS Fonts 4, 5.2): the face a browser picks from those available.
export function pickWeight(available, w) {
  const asc = [...new Set(available)].sort((a, b) => a - b);
  if (asc.includes(w)) return w;
  const below = asc.filter((x) => x < w).reverse(), above = asc.filter((x) => x > w);
  if (w >= 400 && w <= 500) return asc.find((x) => x > w && x <= 500) ?? below[0] ?? above[0];
  return w < 400 ? below[0] ?? above[0] : above[0] ?? below[0];
}

// Runs in the page: family, weight and style of every element that holds text, and the families the
// SVG declares itself with @font-face (it carries those already).
function fontUse(unset) {
  const skip = 'style,script,title,desc,metadata';
  const use = new Map();
  for (const el of document.querySelectorAll('body svg, body svg *')) {
    if (el.closest(skip) || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const cs = getComputedStyle(el);
    const key = JSON.stringify([cs.fontFamily, cs.fontWeight, cs.fontStyle]);
    use.set(key, (use.get(key) || 0) + 1);
  }
  return { runs: [...use].map(([k, n]) => { const [family, weight, style] = JSON.parse(k); return { family, weight, style, n, unset: family.replace(/["']/g, '') === unset }; }), own: [...document.fonts].map((f) => f.family.replace(/^["']|["']$/g, '')) };
}

const safeName = (s) => String(s).replace(/\.svg$/i, '').replace(/[<>:"/\\|?*\x00-\x1f]+/g, '-').replace(/^[.\s-]+|[.\s]+$/g, '');

export async function embedFonts(args) {
  const t0 = Date.now();
  if (!args.file) throw new Error('Give file: the .svg to embed fonts into.');
  const input = resolve(String(args.file));
  if (!existsSync(input) || !statSync(input).isFile()) throw new Error(`File not found: ${input}`);
  if (extname(input).toLowerCase() !== '.svg') throw new Error(`embed_fonts takes an .svg file: ${input}`);
  const out = args.outDir ? resolve(String(args.outDir)) : dirname(input);
  const name = safeName(args.name || `${basename(input, extname(input))}-embedded`) || 'embedded';
  const file = join(out, `${name}.svg`);
  const same = (a, b) => (process.platform === 'win32' || process.platform === 'darwin' ? a.toLowerCase() === b.toLowerCase() : a === b);
  if (same(file, input)) throw new Error('the output would overwrite the input SVG; give another name or outDir');
  const svg = readFileSync(input, 'utf8').replace(/^\uFEFF/, '');
  const open = svg.match(/<svg\b(?:[^>"']|"[^"]*"|'[^']*')*>/i);
  if (!open) throw new Error(`no <svg> element in ${input}`);

  const browser = await openBrowser();
  let use;
  try {
    const { page, context } = await newPage(browser, { width: 64, height: 64, fonts: false });
    try {
      // Inlined the way the engine renders it, with a marker font on the page so text that names no family shows up as such.
      await page.setContent(svgWrapper(svg).replace('</head>', `<style>html,body{font-family:"${UNSET}"!important}</style></head>`), { waitUntil: 'load' });
      use = await page.evaluate(fontUse, UNSET);
    } finally { await context.close(); }
  } finally { await browser.close(); }

  const faces = bundledFaces();
  const byFamily = new Map();
  for (const f of faces) { const k = f.family.toLowerCase(); if (!byFamily.has(k)) byFamily.set(k, []); byFamily.get(k).push(f); }
  const own = new Set(use.own.map((f) => f.toLowerCase()));
  const picked = new Map(), missing = new Set(), fallbacks = new Set();
  let unstyled = 0;
  for (const run of use.runs) {
    if (run.unset) { unstyled += run.n; continue; }
    // The first named family is the one the text shows in; families after it are fallbacks the embedded face pre-empts.
    const names = familyList(run.family).filter((f) => !GENERIC.has(f.toLowerCase()) && f !== UNSET);
    if (!names.length) continue;
    const [first, ...rest] = names;
    rest.forEach((f) => fallbacks.add(f));
    if (own.has(first.toLowerCase())) continue;
    const list = byFamily.get(first.toLowerCase());
    if (!list) { missing.add(first); continue; }
    const italic = /^(italic|oblique)/.test(run.style) && list.some((f) => f.style === 'italic');
    const pool = list.filter((f) => (f.style === 'italic') === italic);
    const w = pickWeight(pool.map((f) => f.weight), Number(run.weight) || 400);
    const face = pool.find((f) => f.weight === w);
    picked.set(face.file, face);
  }
  const families = [...new Set(faces.map((f) => f.family))];
  if (missing.size) throw new Error(`not a bundled font family: ${[...missing].join(', ')}. Easel can embed only its bundled families (${families.join(', ')}); use one of them (generic fallbacks such as sans-serif are fine) and render again.`);

  const chosen = [...picked.values()].sort((a, b) => a.family.localeCompare(b.family) || a.weight - b.weight || a.style.localeCompare(b.style));
  const css = chosen.map((f) => `@font-face{font-family:'${f.family}';src:url(data:font/woff2;base64,${readFileSync(join(FONTS_DIR, ...f.file.split('/'))).toString('base64')}) format('woff2');font-weight:${f.weight};font-style:${f.style};}`).join('\n');
  // The style goes first inside the <svg>, so it applies before any text; the rest of the file is untouched.
  const text = chosen.length ? svg.replace(open[0], `${open[0]}\n<style>\n/* Embedded by Easel embed_fonts: faces under the SIL Open Font License 1.1. */\n${css}\n</style>`) : svg;
  mkdirSync(out, { recursive: true });
  writeFileSync(file, text);
  const warnings = [];
  if (unstyled) warnings.push(`${unstyled} text element(s) name no font-family: they show in each viewer's default font. Set font-family to a bundled family.`);
  if (!chosen.length && !unstyled) warnings.push('no text in this SVG uses a bundled family: nothing was embedded, the copy matches the input');
  return {
    file, source: input,
    families: [...new Set(chosen.map((f) => f.family))],
    faces: chosen.map((f) => ({ family: f.family, weight: f.weight, style: f.style, file: f.file })),
    bytes: statSync(file).size,
    ...(fallbacks.size ? { ignoredFallbacks: [...fallbacks] } : {}),
    ...(warnings.length ? { warnings } : {}),
    ms: Date.now() - t0,
  };
}
