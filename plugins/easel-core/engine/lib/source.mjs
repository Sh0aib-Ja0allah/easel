// Turns a render source (inline HTML, an HTML file, or an SVG/PNG/JPG image) into a file URL the
// browser can open. Inline HTML and image wrappers are written into the job folder, never to a temp
// dir and never beside the user's file, under a name unique to the call (two calls at once never
// share a page, and a user's own <name>.html is never overwritten); callers remove it with
// releaseSource when they are done.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomBytes } from 'node:crypto';

const IMAGE = new Set(['.svg', '.png', '.jpg', '.jpeg', '.webp', '.gif']);
const unique = () => `${process.pid}-${randomBytes(4).toString('hex')}`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export function imageWrapper(src, { fit = 'contain', background = 'transparent' } = {}) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:100%;height:100%;background:${background};}
img{display:block;width:100%;height:100%;object-fit:${fit};}</style></head><body><img src="${esc(src)}" alt=""></body></html>`;
}

// The SVG is inlined into an HTML page, whose parser forgives what an XML parser refuses (a bare &,
// &nbsp;, a repeated attribute): the file would render here and then fail as a file or in an <img>.
// So the page also parses the original text as XML and leaves the parser's message in
// window.__easelXmlError ({ file, message, cp }) for waitReady (browser.mjs) to refuse; cp is the
// code point of an HTML-only entity, for the fix.
const xmlCheck = (text, file) => `(()=>{const d=new DOMParser().parseFromString(${JSON.stringify(text).replace(/</g, '\\u003c')},'image/svg+xml');const e=d.querySelector('parsererror');
if(e){const message=((e.querySelector('div')||e).textContent||'').trim(),n=message.match(/Entity '(\\w+)' not defined|Unexpected entity: (\\w+)/),n1=n&&(n[1]||n[2]),h=n&&new DOMParser().parseFromString('&'+n1+';','text/html').body.textContent;window.__easelXmlError={file:${JSON.stringify(file).replace(/</g, '\\u003c')},message,cp:h&&h[0]!=='&'?h.codePointAt(0):null};}
else if(d.documentElement.namespaceURI!=='http://www.w3.org/2000/svg')console.error(${JSON.stringify(`${file}: the root element is not <svg xmlns="http://www.w3.org/2000/svg">, so the file does not open as an image on its own (an <img> shows it broken); add xmlns="http://www.w3.org/2000/svg" to the <svg> tag`).replace(/</g, '\\u003c')});})();`;

// The error for an SVG that is not well-formed XML: the parser's message and the fix for its usual cause.
export function xmlProblem({ file, message, cp }) {
  // Chromium's parser messages changed wording (libxml2's up to about v150, a newer parser after), so
  // each fix matches both
  const m = String(message || '').replace(/\s+/g, ' ').trim();
  const ent = m.match(/Entity '(\w+)' not defined|Unexpected entity: (\w+)/), name = ent && (ent[1] || ent[2]);
  const fix = /EntityRef|expecting ';'|inside entity/.test(m) ? 'write a literal & as &amp; (R&D -> R&amp;D)'
    : ent ? `XML knows only &amp; &lt; &gt; &quot; &apos;: write &${name}; as a numeric reference (${cp ? `&${name}; -> &#${cp};` : 'e.g. &nbsp; -> &#160;'})`
    : /redefined/.test(m) ? 'give each attribute once per element'
    : /Double hyphen|'--'/.test(m) ? 'remove "--" from inside the comment'
    : /XML declaration allowed only at the start|Invalid processing instruction: <\?xml/.test(m) ? 'put the <?xml ...?> declaration at the very start of the file (nothing before it, not even a comment or a blank line), or delete it'
    : /Unescaped '<'|'<'.*attribute|attribute.*'<'/i.test(m) ? 'write < inside an attribute value as &lt;'
    : 'the usual causes are a bare & (write &amp;) and HTML entities such as &nbsp; (write &#160;)';
  return `${file} is not well-formed XML (${m}): it would render here, but browsers, <img> and editors refuse it. Fix: ${fix}, then render again.`;
}

// base: the URL relative references resolve against (the SVG's own folder; the wrapper lives elsewhere).
// file: the name the XML check reports. The call shape svgWrapper(text) still works.
export function svgWrapper(svg, { base = null, file = 'the SVG' } = {}) {
  const text = svg.replace(/^\uFEFF/, '');
  let body = text.replace(/<\?xml[\s\S]*?\?>/, '').replace(/<!DOCTYPE[\s\S]*?>/i, '').trim();
  // Without a viewBox an SVG does not scale to the page; derive one from width/height when possible.
  const open = body.match(/<svg\b[^>]*>/i);
  if (open && !/viewBox=/i.test(open[0])) {
    const w = open[0].match(/\bwidth=["']?([\d.]+)/i), h = open[0].match(/\bheight=["']?([\d.]+)/i);
    if (w && h) body = body.replace(open[0], open[0].replace(/<svg\b/i, `<svg viewBox="0 0 ${w[1]} ${h[1]}"`));
  }
  // Printed (render_pdf), the page is the SVG's own size: width/height, else the viewBox, in CSS px.
  const tag = (body.match(/<svg\b[^>]*>/i) || [''])[0];
  const attr = (k) => { const m = tag.match(new RegExp(`\\b${k}=["']?([\\d.]+)(px)?["'\\s>]`, 'i')); return m ? Number(m[1]) : null; };
  const vb = (tag.match(/viewBox=["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i) || []).slice(1).map(Number);
  const [pw, ph] = attr('width') && attr('height') ? [attr('width'), attr('height')] : vb.length === 2 ? vb : [null, null];
  const pageRule = pw > 0 && ph > 0 ? `@page{size:${pw}px ${ph}px;margin:0}` : '';
  // currentColor follows the theme: dark ink on light, light ink on a dark page (icons and mono logos as
  // they show in a dark UI). The dark page is on html only, so transparent: true (newPage) clears it.
  return `<!doctype html><html><head><meta charset="utf-8">${base ? `<base href="${esc(base)}">` : ''}<style>${pageRule}html,body{margin:0;width:100%;height:100%;background:transparent;color:#111;}
@media (prefers-color-scheme: dark){html{background:#141414;}html,body{color:#f2f2f2;}}
body>svg{display:block;width:100%;height:100%;}</style><script>${xmlCheck(text, file)}</script></head><body>${body}</body></html>`;
}

export function resolveSource({ html, file }, workDir, name = 'page') {
  if (html && file) throw new Error('Give either html or file, not both.');
  if (!html && !file) throw new Error('Give html (a string) or file (a path to .html, .svg, .png or .jpg).');
  mkdirSync(workDir, { recursive: true });
  if (html) {
    const p = join(workDir, `.easel-page-${name}-${unique()}.html`);
    writeFileSync(p, html);
    return { url: pathToFileURL(p).href, path: p, kind: 'html', temp: true };
  }
  const abs = resolve(file);
  if (!existsSync(abs)) throw new Error(`File not found: ${abs}`);
  const ext = extname(abs).toLowerCase();
  if (IMAGE.has(ext)) {
    // Wrap images in a page in the job folder: beside the user's file it would fail in a read-only
    // folder and an interrupted run would leave it among their assets. SVG is inlined (its text uses
    // the bundled fonts and the qa page checks can see it), under a <base> at the SVG's own folder so
    // its relative references still load; a raster image is referenced by its absolute file URL.
    // Unique per call: two renders of the same file at once must not share (and delete) one wrapper.
    const p = join(workDir, `.easel-wrap-${basename(abs)}-${unique()}.html`);
    const folder = dirname(abs);
    writeFileSync(p, ext === '.svg' ? svgWrapper(readFileSync(abs, 'utf8'), { base: pathToFileURL(folder.endsWith(sep) ? folder : folder + sep).href, file: abs }) : imageWrapper(pathToFileURL(abs).href));
    return { url: pathToFileURL(p).href, path: p, kind: 'image', wrapperFor: abs, temp: true };
  }
  if (ext !== '.html' && ext !== '.htm') throw new Error(`Unsupported file type ${ext}; use .html, .svg, .png or .jpg.`);
  return { url: pathToFileURL(abs).href, path: abs, kind: 'html' };
}

// Removes the page resolveSource wrote for this call (inline HTML or an image wrapper), if any.
export function releaseSource(src) {
  if (src && src.temp) rmSync(src.path, { force: true });
}
