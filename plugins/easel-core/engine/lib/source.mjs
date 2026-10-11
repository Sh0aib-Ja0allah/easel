// Turns a render source (inline HTML, an HTML file, or an SVG/PNG/JPG image) into a file URL the
// browser can open. Inline HTML is written into the job folder, never to a temp dir.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomBytes } from 'node:crypto';

const IMAGE = new Set(['.svg', '.png', '.jpg', '.jpeg', '.webp', '.gif']);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export function imageWrapper(src, { fit = 'contain', background = 'transparent' } = {}) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:100%;height:100%;background:${background};}
img{display:block;width:100%;height:100%;object-fit:${fit};}</style></head><body><img src="${esc(src)}" alt=""></body></html>`;
}

export function svgWrapper(svg) {
  let body = svg.replace(/^\uFEFF/, '').replace(/<\?xml[\s\S]*?\?>/, '').replace(/<!DOCTYPE[\s\S]*?>/i, '').trim();
  // Without a viewBox an SVG does not scale to the page; derive one from width/height when possible.
  const open = body.match(/<svg\b[^>]*>/i);
  if (open && !/viewBox=/i.test(open[0])) {
    const w = open[0].match(/\bwidth=["']?([\d.]+)/i), h = open[0].match(/\bheight=["']?([\d.]+)/i);
    if (w && h) body = body.replace(open[0], open[0].replace(/<svg\b/i, `<svg viewBox="0 0 ${w[1]} ${h[1]}"`));
  }
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:100%;height:100%;background:transparent;}
body>svg{display:block;width:100%;height:100%;}</style></head><body>${body}</body></html>`;
}

export function resolveSource({ html, file }, workDir, name = 'page') {
  if (html && file) throw new Error('Give either html or file, not both.');
  if (!html && !file) throw new Error('Give html (a string) or file (a path to .html, .svg, .png or .jpg).');
  mkdirSync(workDir, { recursive: true });
  if (html) {
    const p = join(workDir, `${name}.html`);
    writeFileSync(p, html);
    return { url: pathToFileURL(p).href, path: p, kind: 'html' };
  }
  const abs = resolve(file);
  if (!existsSync(abs)) throw new Error(`File not found: ${abs}`);
  const ext = extname(abs).toLowerCase();
  if (IMAGE.has(ext)) {
    // Wrap images in a page that sits next to them so relative references keep working. SVG is
    // inlined, so its text uses the bundled fonts and the qa page checks can see it.
    // Unique per call: two renders of the same file at once must not share (and delete) one wrapper.
    const p = join(dirname(abs), `.easel-wrap-${basename(abs)}-${process.pid}-${randomBytes(4).toString('hex')}.html`);
    writeFileSync(p, ext === '.svg' ? svgWrapper(readFileSync(abs, 'utf8')) : imageWrapper(basename(abs)));
    return { url: pathToFileURL(p).href, path: p, kind: 'image', wrapperFor: abs };
  }
  if (ext !== '.html' && ext !== '.htm') throw new Error(`Unsupported file type ${ext}; use .html, .svg, .png or .jpg.`);
  return { url: pathToFileURL(abs).href, path: abs, kind: 'html' };
}
