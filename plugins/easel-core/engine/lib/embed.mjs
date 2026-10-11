// embed_fonts: an SVG or HTML page whose text names a bundled family (font-family="Space Grotesk")
// looks right in Easel's renders, which inject the bundled faces, and falls back to a default font in
// a browser that opens the file on its own. This writes a copy that carries the faces its text uses
// as base64 WOFF2 @font-face rules, so it looks the same in any browser or web page. (Design apps,
// slide tools and email clients often ignore embedded fonts.) Only the bundled OFL faces are
// embedded. Which family, weight and style each piece of text uses is read from the computed style in
// the engine's browser, so CSS classes, stylesheets, the font shorthand and inheritance all count.
import { brotliDecompressSync } from 'node:zlib';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { FONTS_DIR, newPage, openBrowser, waitReady } from './browser.mjs';
import { svgWrapper } from './source.mjs';

const GENERIC = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded', 'math', 'emoji', 'fangsong', '-apple-system', 'blinkmacsystemfont']);
const UNSET = 'easel-no-font-family';
// Text that names no family shows in the marker family. The rule sits in a cascade layer declared
// before any of the page's, so every rule of the page wins (layered or not); form controls and code
// get it too, as they otherwise take the browser's own font rather than the page's.
const MARKER = `@layer easel-unset{:where(html,button,input,select,textarea,optgroup,code,kbd,samp,pre,tt,xmp,listing,plaintext){font-family:"${UNSET}"}}`;
const SVG_NS = 'http://www.w3.org/2000/svg';
const LICENCE = '/* Embedded by Easel embed_fonts: faces under the SIL Open Font License 1.1. */';
// Characters no text face is expected to carry: spaces, controls and format marks, emoji.
const QUIET = /[\s\p{Cc}\p{Cf}\p{Variation_Selector}\p{Extended_Pictographic}\p{Emoji_Component}]/u;

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

// The code points a bundled face has glyphs for, from the cmap table of its WOFF2 file (fonts.json
// has no unicode-range). WOFF2 is a table directory and one Brotli stream holding the tables in
// directory order; cmap is never transformed, so it is read as in any OpenType font.
const coverage = new Map();
export function faceCoverage(file) {
  if (coverage.has(file)) return coverage.get(file);
  const woff = readFileSync(join(FONTS_DIR, ...file.split('/')));
  if (woff.toString('latin1', 0, 4) !== 'wOF2' || woff.toString('latin1', 4, 8) === 'ttcf') throw new Error(`not a single-font WOFF2 file: ${file}`);
  let p = 48, offset = 0, cmap = null;
  const base128 = () => { let v = 0; for (let i = 0; i < 5; i++) { const b = woff[p++]; v = v * 128 + (b & 127); if (b < 128) return v; } throw new Error(`bad WOFF2 table directory: ${file}`); };
  for (let t = 0, n = woff.readUInt16BE(12); t < n; t++) {
    const flags = woff[p++], known = flags & 63;
    const tag = known === 63 ? woff.toString('latin1', p, (p += 4)) : null;
    const length = base128();
    // glyf and loca (known tags 10, 11) are transformed unless version 3; every other table unless 0
    const transformed = known === 10 || known === 11 || tag === 'glyf' || tag === 'loca' ? flags >> 6 !== 3 : flags >> 6 !== 0;
    const stored = transformed ? base128() : length;
    if (known === 0 || tag === 'cmap') cmap = { offset, length: stored };
    offset += stored;
  }
  if (!cmap) throw new Error(`no cmap table in ${file}`);
  const c = brotliDecompressSync(woff.subarray(p, p + woff.readUInt32BE(20))).subarray(cmap.offset, cmap.offset + cmap.length);
  const cps = new Set();
  for (let i = 0, n = c.readUInt16BE(2); i < n; i++) {
    const platform = c.readUInt16BE(4 + i * 8), encoding = c.readUInt16BE(6 + i * 8), at = c.readUInt32BE(8 + i * 8);
    if (!(platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10)))) continue;   // Unicode subtables only
    const format = c.readUInt16BE(at);
    if (format === 4) {
      const seg2 = c.readUInt16BE(at + 6), ends = at + 14, starts = ends + seg2 + 2, deltas = starts + seg2, ranges = deltas + seg2;
      for (let s = 0; s < seg2; s += 2) {
        const end = c.readUInt16BE(ends + s), start = c.readUInt16BE(starts + s), delta = c.readUInt16BE(deltas + s), ro = c.readUInt16BE(ranges + s);
        for (let cp = start; cp <= end && cp !== 0xffff; cp++) {
          const g = ro ? c.readUInt16BE(ranges + s + ro + (cp - start) * 2) : cp;
          if (g && (g + delta) & 0xffff) cps.add(cp);
        }
      }
    } else if (format === 12) {
      for (let g = 0, n = c.readUInt32BE(at + 12); g < n; g++) {
        const b = at + 16 + g * 12, start = c.readUInt32BE(b), end = c.readUInt32BE(b + 4), glyph = c.readUInt32BE(b + 8);
        for (let cp = start; cp <= end; cp++) if (glyph + cp - start) cps.add(cp);
      }
    }
  }
  coverage.set(file, cps);
  return cps;
}

// Runs in the page: what an XML parser (a browser opening the SVG on its own) makes of it.
function xmlCheck(text) {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const err = doc.querySelector('parsererror');
  return err ? { error: err.textContent } : { root: doc.documentElement.localName, ns: doc.documentElement.namespaceURI };
}

// Runs in the page: the family, weight and style of every piece of text and the characters it holds:
// text nodes, form-control values and placeholders, ::before/::after content, and ::first-letter,
// ::first-line and list markers that change the font. Text in <defs> or a <symbol> is drawn by a
// <use> and inherits the <use>'s font, so each <use> gets a stand-in copy of its target. Also the
// families the file declares itself with @font-face (it carries those already).
function fontUse(unset) {
  const SVG = 'http://www.w3.org/2000/svg';
  const skip = 'head,style,script,template,noscript,title,desc,metadata,datalist';
  const runs = new Map();
  const add = (cs, text, tag) => {
    const key = JSON.stringify([cs.fontFamily, cs.fontWeight, cs.fontStyle]);
    if (!runs.has(key)) runs.set(key, { family: cs.fontFamily, weight: cs.fontWeight, style: cs.fontStyle, n: 0, chars: new Set(), tags: new Set() });
    const r = runs.get(key);
    r.n++; r.tags.add(tag);
    for (const ch of text.normalize('NFC')) r.chars.add(ch);
  };
  // The text a computed `content` adds (attr() is already resolved to a string), or null for none.
  const generated = (content) => {
    const rest = String(content).replace(/url\((?:"(?:[^"\\]|\\.)*"|[^)]*)\)/g, '');
    const strings = [...rest.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1].replace(/\\(.)/g, '$1')).join('');
    return strings.trim() || /counter|quote/.test(rest.replace(/"(?:[^"\\]|\\.)*"/g, '')) ? strings : null;
  };
  const differs = (a, b) => a.fontFamily !== b.fontFamily || a.fontWeight !== b.fontWeight || a.fontStyle !== b.fontStyle;
  const visit = (el) => {
    const tag = el.localName, cs = getComputedStyle(el);
    let text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.data).join('');
    if (tag === 'input' && !/^(hidden|checkbox|radio|range|color|image|file)$/.test(el.type)) text += el.value;
    if (text.trim()) add(cs, text, tag);
    if (el.namespaceURI === SVG) return;   // SVG text has no pseudo-elements
    if ((tag === 'input' || tag === 'textarea') && el.placeholder) add(getComputedStyle(el, '::placeholder'), el.placeholder, tag);
    for (const p of ['::before', '::after']) { const ps = getComputedStyle(el, p), g = generated(ps.content); if (g !== null) add(ps, g, tag); }
    // disc, circle and square markers are drawn as shapes; counters and strings are text
    if (/list-item/.test(cs.display) && !/^(none|disc|circle|square|disclosure-open|disclosure-closed)$/.test(cs.listStyleType)) add(getComputedStyle(el, '::marker'), generated(cs.listStyleType) || '', tag);
    if (el.textContent.trim()) for (const p of ['::first-letter', '::first-line']) { const ps = getComputedStyle(el, p); if (differs(ps, cs)) add(ps, el.textContent, tag); }
  };
  // Only what is drawn: <defs> and <symbol> content shows through a <use>, except paint servers, masks, clips and markers.
  const placed = (el) => { const d = el.closest('defs,symbol'); if (!d) return true; const p = el.closest('pattern,mask,clipPath,marker'); return !!p && d.contains(p); };
  for (const el of [document.body, ...document.body.querySelectorAll('*')]) if (!el.closest(skip) && placed(el)) visit(el);
  const stand = [];
  const expand = (use, depth) => {
    const ref = (use.href && use.href.baseVal) || use.getAttribute('href') || '';
    const target = ref.startsWith('#') && depth < 8 ? document.getElementById(ref.slice(1)) : null;
    if (!target) return;
    const cs = getComputedStyle(use), g = document.createElementNS(SVG, 'g');
    g.style.fontFamily = cs.fontFamily; g.style.fontWeight = cs.fontWeight; g.style.fontStyle = cs.fontStyle;
    g.append(target.cloneNode(true));
    use.after(g);
    stand.push(g);
    for (const el of g.querySelectorAll('*')) if (!el.closest(skip)) { if (el.localName === 'use') expand(el, depth + 1); else visit(el); }
  };
  for (const use of [...document.body.querySelectorAll('use')]) if (!use.closest(skip) && placed(use)) expand(use, 0);
  stand.forEach((g) => g.remove());
  return {
    runs: [...runs.values()].map((r) => ({ family: r.family, weight: r.weight, style: r.style, n: r.n, chars: [...r.chars].join(''), tags: [...r.tags], unset: r.family.replace(/["']/g, '') === unset })),
    own: [...document.fonts].filter((f) => f.status !== 'error').map((f) => f.family.replace(/^["']|["']$/g, '')),
  };
}

// The same text seen at several viewport sizes: one run per family/weight/style, characters merged.
function merge(passes) {
  const runs = new Map();
  for (const r of passes.flatMap((p) => p.runs)) {
    const k = JSON.stringify([r.family, r.weight, r.style]), m = runs.get(k);
    if (!m) runs.set(k, { ...r });
    else Object.assign(m, { n: Math.max(m.n, r.n), chars: [...new Set([...m.chars, ...r.chars])].join(''), tags: [...new Set([...m.tags, ...r.tags])] });
  }
  return { runs: [...runs.values()], own: [...new Set(passes.flatMap((p) => p.own))] };
}

// Where the root element's start tag ends in a well-formed XML file (read as latin1, so an index is a
// byte offset): only a BOM, the XML declaration, comments, processing instructions, a doctype and
// white space can come before it. -1 for an empty root (<svg/>).
function rootTagEnd(xml) {
  const prolog = /[ \t\r\n]+|<\?[\s\S]*?\?>|<!--[\s\S]*?-->|<!DOCTYPE(?:[^[>"']|"[^"]*"|'[^']*'|\[(?:<!--[\s\S]*?-->|[^\]"']|"[^"]*"|'[^']*')*\])*>/y;
  let i = xml.startsWith('\xEF\xBB\xBF') ? 3 : 0;
  for (prolog.lastIndex = i; prolog.exec(xml); prolog.lastIndex = i) i = prolog.lastIndex;
  const tag = /<[^\s/>]+(?:[^>"']|"[^"]*"|'[^']*')*>/y;
  tag.lastIndex = i;
  const m = tag.exec(xml);
  return m && !m[0].endsWith('/>') ? i + m[0].length : -1;
}

// Where the faces go in an HTML file (read as latin1): before the first </head> or <body> that is not
// inside a comment, a script or other raw text; else after the last doctype, <html>, <head> or
// <meta charset> (never ahead of the doctype, which would switch the page to quirks mode, nor ahead of
// <meta charset>, which must stay within the first 1024 bytes).
const QUOTED = `(?:[^>"']|"[^"]*"|'[^']*')*`;
const HEAD = new RegExp(`<!--[\\s\\S]*?(?:-->|$)|<(script|style|textarea|title|xmp|iframe|noembed|noframes|noscript)\\b${QUOTED}>[\\s\\S]*?(?:</\\1\\s*>|$)|</head\\s*>|<body\\b|<!doctype${QUOTED}>|<(?:html|head|meta)\\b${QUOTED}>`, 'gi');
function headEnd(html) {
  let at = html.startsWith('\xEF\xBB\xBF') ? 3 : 0;
  for (const m of html.matchAll(HEAD)) {
    const t = m[0].toLowerCase();
    if (t.startsWith('</head') || t.startsWith('<body')) return m.index;
    if (/^<(!doctype|html\b|head\b)/.test(t) || (/^<meta\b/.test(t) && t.includes('charset'))) at = m.index + m[0].length;
  }
  return at;
}

const safeName = (s) => String(s).replace(/\.(svg|html?)$/i, '').replace(/[<>:"/\\|?*\x00-\x1f]+/g, '-').replace(/^[.\s-]+|[.\s]+$/g, '');
const exists = (file) => `${file} already exists: embed_fonts never replaces a file. Give another name or outDir, or remove the old copy first.`;

export async function embedFonts(args) {
  const t0 = Date.now();
  if (!args.file) throw new Error('Give file: the .svg or .html to embed fonts into.');
  const input = resolve(String(args.file));
  if (!existsSync(input) || !statSync(input).isFile()) throw new Error(`File not found: ${input}`);
  const ext = extname(input).toLowerCase(), html = ext === '.html' || ext === '.htm';
  if (!html && ext !== '.svg') throw new Error(`embed_fonts takes an .svg or .html file: ${input}`);
  const out = args.outDir ? resolve(String(args.outDir)) : dirname(input);
  const name = safeName(args.name || `${basename(input, extname(input))}-embedded`) || 'embedded';
  const file = join(out, `${name}${html ? '.html' : '.svg'}`);
  const same = (a, b) => (process.platform === 'win32' || process.platform === 'darwin' ? a.toLowerCase() === b.toLowerCase() : a === b);
  if (same(file, input)) throw new Error(`the output would overwrite the input ${html ? 'page' : 'SVG'}; give another name or outDir`);
  if (existsSync(file)) throw new Error(exists(file));
  const bytes = readFileSync(input);
  const raw = bytes.toString('latin1');
  const text = bytes.toString('utf8').replace(/^\uFEFF/, '');

  const browser = await openBrowser();
  let use;
  try {
    const { page, context } = await newPage(browser, { width: html ? 1440 : 64, height: html ? 900 : 64, fonts: false });
    const marker = (css) => { const s = document.createElement('style'); s.textContent = css; document.head.prepend(s); };
    try {
      if (html) {
        // Opened from its own folder so its stylesheets load; seen at desktop and phone widths, where media queries may change the type.
        await page.goto(pathToFileURL(input).href, { waitUntil: 'load', timeout: 60000 });
        await waitReady(page);
        await page.evaluate(marker, MARKER);
        const passes = [];
        for (const [width, height] of [[1440, 900], [390, 844]]) {
          await page.setViewportSize({ width, height });
          await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));
          passes.push(await page.evaluate(fontUse, UNSET));
        }
        use = merge(passes);
      } else {
        // A browser opening the copy on its own parses it as XML, unlike Easel's renders, which inline it into HTML.
        const x = await page.evaluate(xmlCheck, text);
        if (x.error) {
          const m = x.error.match(/error on (line \d+ at column \d+): ([^\n]*)/);
          throw new Error(`${input} is not well-formed XML (${m ? `${m[1]}: ${m[2].trim()}` : x.error.trim()}), so a browser opening it shows an error page instead of the image. The usual causes: a bare & (write &amp;), an HTML entity such as &nbsp; or &copy; (write &#160; or &#169;), < inside an attribute value (write &lt;), a duplicate attribute, "--" inside a comment, or anything before <?xml ...?>. Fix the file and run embed_fonts again.`);
        }
        if (x.root !== 'svg') throw new Error(`the root element is <${x.root}>, not <svg>: ${input}`);
        if (x.ns !== SVG_NS) throw new Error(`the root <svg> has no xmlns="${SVG_NS}", so a browser opening the file on its own shows XML text, not an image. Add that attribute to the <svg> tag: ${input}`);
        // Inlined the way the engine renders it, with the marker family under everything the SVG sets
        // (in the page from the start: added afterwards, it costs a second style pass over every element).
        const wrapped = svgWrapper(text), head = wrapped.includes('</head>');
        await page.setContent(head ? wrapped.replace('</head>', `<style>${MARKER}</style></head>`) : wrapped, { waitUntil: 'load' });
        if (!head) await page.evaluate(marker, MARKER);
        use = await page.evaluate(fontUse, UNSET);
      }
    } finally { await context.close(); }
  } finally { await browser.close(); }

  const faces = bundledFaces();
  const byFamily = new Map();
  for (const f of faces) { const k = f.family.toLowerCase(); if (!byFamily.has(k)) byFamily.set(k, []); byFamily.get(k).push(f); }
  const faceFor = (list, run) => {
    const italic = /^(italic|oblique)/.test(run.style) && list.some((f) => f.style === 'italic');
    const pool = list.filter((f) => (f.style === 'italic') === italic);
    const w = pickWeight(pool.map((f) => f.weight), Number(run.weight) || 400);
    return pool.find((f) => f.weight === w);
  };
  const own = new Set(use.own.map((f) => f.toLowerCase()));
  const picked = new Map(), missing = new Set(), fallbacks = new Set(), unsetTags = new Set(), gaps = new Map();
  let unstyled = 0, carried = 0;
  for (const run of use.runs) {
    if (run.unset) { unstyled += run.n; run.tags.forEach((t) => unsetTags.add(t)); continue; }
    // The first named family is the one the text shows in; families after it are fallbacks the embedded face pre-empts.
    const names = familyList(run.family).filter((f) => !GENERIC.has(f.toLowerCase()) && f !== UNSET);
    if (!names.length) continue;
    const [first, ...rest] = names;
    rest.forEach((f) => fallbacks.add(f));
    if (own.has(first.toLowerCase())) { carried++; continue; }
    const list = byFamily.get(first.toLowerCase());
    if (!list) { missing.add(first); continue; }
    const face = faceFor(list, run);
    picked.set(face.file, face);
    // ...except for characters the face lacks: as in the browser, they fall through the list, so a bundled family further on that has them is embedded too.
    let left = [...run.chars].filter((ch) => !faceCoverage(face.file).has(ch.codePointAt(0)) && !QUIET.test(ch));
    for (const f of rest) {
      if (!left.length || own.has(f.toLowerCase())) { left = []; break; }
      if (!byFamily.has(f.toLowerCase())) continue;
      const fb = faceFor(byFamily.get(f.toLowerCase()), run), has = faceCoverage(fb.file);
      if (left.some((ch) => has.has(ch.codePointAt(0)))) { picked.set(fb.file, fb); left = left.filter((ch) => !has.has(ch.codePointAt(0))); }
    }
    if (left.length) { if (!gaps.has(first)) gaps.set(first, new Set()); left.forEach((ch) => gaps.get(first).add(ch)); }
  }
  const families = [...new Set(faces.map((f) => f.family))];
  if (missing.size) throw new Error(`not a bundled font family: ${[...missing].join(', ')}. Easel can embed only its bundled families (${families.join(', ')}); use one of them (generic fallbacks such as sans-serif are fine) and render again.`);

  const chosen = [...picked.values()].sort((a, b) => a.family.localeCompare(b.family) || a.weight - b.weight || a.style.localeCompare(b.style));
  const css = chosen.map((f) => `@font-face{font-family:'${f.family}';src:url(data:font/woff2;base64,${readFileSync(join(FONTS_DIR, ...f.file.split('/'))).toString('base64')}) format('woff2');font-weight:${f.weight};font-style:${f.style};}`).join('\n');
  // SVG: first inside the root element, so it applies before any text (XML needs the attribute's value).
  // HTML: at the end of <head>.
  // The rest of the file is kept byte for byte.
  let data = bytes;
  if (chosen.length) {
    const at = html ? headEnd(raw) : rootTagEnd(raw);
    if (at < 0) throw new Error(`no root element to hold the faces in ${input}`);
    const block = html ? `<style data-easel-fonts>\n${LICENCE}\n${css}\n</style>\n` : `\n<style data-easel-fonts="">\n${LICENCE}\n${css}\n</style>`;
    data = Buffer.concat([bytes.subarray(0, at), Buffer.from(block), bytes.subarray(at)]);
  }
  mkdirSync(out, { recursive: true });
  try { writeFileSync(file, data, { flag: 'wx' }); } catch (e) { throw e.code === 'EEXIST' ? new Error(exists(file)) : e; }
  const warnings = [];
  if (unstyled) warnings.push(`${unstyled} text element(s) name no font-family (${[...unsetTags].sort().join(', ')}): they show in each viewer's default font. Set font-family to a bundled family${html ? ' (form controls and code take the browser\'s own font unless a rule sets one, e.g. button,input,select,textarea{font:inherit} and code,pre{font-family:"JetBrains Mono"})' : ''}.`);
  for (const [family, chars] of gaps) warnings.push(`${family}: ${chars.size} character(s) the embedded faces do not cover (${[...chars].slice(0, 12).join(' ')}${chars.size > 12 ? ' ...' : ''}). The bundled faces are Latin subsets, so every browser (and Easel's renders) draws these in a fallback font of its own, which differs from machine to machine. Where the exact look matters, outline that text or deliver an image.`);
  if (!chosen.length && !unstyled) warnings.push(carried ? `the text uses only faces the ${html ? 'page' : 'SVG'} declares itself (@font-face): nothing was embedded, the copy matches the input` : `no text in this ${html ? 'page' : 'SVG'} uses a bundled family: nothing was embedded, the copy matches the input`);
  if (html && !same(out, dirname(input))) warnings.push(`the copy is in ${out}, not beside the page: relative links in it (images, stylesheets, scripts) now resolve from there`);
  const embedded = new Set(chosen.map((f) => f.family.toLowerCase()));
  const ignored = [...fallbacks].filter((f) => !embedded.has(f.toLowerCase()) && !own.has(f.toLowerCase()));
  return {
    file, source: input,
    families: [...new Set(chosen.map((f) => f.family))],
    faces: chosen.map((f) => ({ family: f.family, weight: f.weight, style: f.style, file: f.file })),
    bytes: statSync(file).size,
    ...(ignored.length ? { ignoredFallbacks: ignored } : {}),
    ...(warnings.length ? { warnings } : {}),
    ms: Date.now() - t0,
  };
}
