// Measure reference images, and compare a reference with our render, for matching a look.
//   measure_image: trims screenshot borders, reports size, aspect, the content box, the most common
//     colours (16-level buckets; the mean of each bucket is the exact colour), sampled points, and with
//     accent the bright saturated colours by hue family (core and halo).
//   compare_images: the reference and our frame side by side at the same height on a 10% proportion
//     grid, with both palettes, so a look is matched by proportions, line weight and palette, not pixels.
// Adapted for Easel from cth9191/animate @ 7e5eb56feb2dd573f890e1b7b34748af43d58263
// (plugins/animate/skills/animate/tools/measure/refs.mjs and tools/compare.mjs), MIT License,
// Copyright (c) 2026 cth9191. Modified by Easel (2026-10-11): engine tools (offline page, images as
// files, results as JSON); compare takes two images (render the frame first with render_still).
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { newPage, openBrowser } from './browser.mjs';
import { dataUrl } from './image.mjs';
import { outputDir } from './render.mjs';

const IMG = /\.(png|jpe?g|webp)$/i;

// Runs in the page: decode, trim, palette, points, accents. Returns the trimmed PNG as base64.
function measureInPage({ url, top, points, accent, trim, crop }) {
  return (async () => {
    const img = new Image(); img.src = url; await img.decode();
    const W = img.naturalWidth, H = img.naturalHeight, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, W, H).data;
    const px = (x, y) => { const i = (y * W + x) * 4; return [d[i], d[i + 1], d[i + 2]]; };
    let x0 = 0, y0 = 0, x1 = W - 1, y1 = H - 1;
    if (trim) {
      // a border line is "flat" when every pixel is within 14 levels of the corner colour
      const corner = px(0, 0), near = (p) => Math.abs(p[0] - corner[0]) + Math.abs(p[1] - corner[1]) + Math.abs(p[2] - corner[2]) < 42;
      const rowFlat = (y) => { for (let x = 0; x < W; x += 2) if (!near(px(x, y))) return false; return true; };
      const colFlat = (x) => { for (let y = 0; y < H; y += 2) if (!near(px(x, y))) return false; return true; };
      while (y0 < y1 && rowFlat(y0)) y0++; while (y1 > y0 && rowFlat(y1)) y1--;
      while (x0 < x1 && colFlat(x0)) x0++; while (x1 > x0 && colFlat(x1)) x1--;
    }
    if (crop) { x0 += crop[0]; y0 += crop[1]; x1 = Math.min(x1, x0 + crop[2] - 1); y1 = Math.min(y1, y0 + crop[3] - 1); }
    const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
    const t = document.createElement('canvas'); t.width = cw; t.height = ch; t.getContext('2d').drawImage(c, x0, y0, cw, ch, 0, 0, cw, ch);
    const td = t.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, cw, ch).data, m = new Map();
    for (let i = 0; i < td.length; i += 8) { const k = ((td[i] >> 4) << 8) | ((td[i + 1] >> 4) << 4) | (td[i + 2] >> 4); const v = m.get(k) || [0, 0, 0, 0]; v[0] += td[i]; v[1] += td[i + 1]; v[2] += td[i + 2]; v[3]++; m.set(k, v); }
    const n = td.length / 8;
    const hex = (rgb) => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');
    const palette = [...m.values()].sort((a, b) => b[3] - a[3]).slice(0, top).map(([r, gg, b, k]) => { const rgb = [r / k, gg / k, b / k].map(Math.round); return { hex: hex(rgb), rgb, share: +(k / n).toFixed(4) }; });
    const med = (x, y) => { const vs = [[], [], []]; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = Math.min(cw - 1, Math.max(0, x + dx)), yy = Math.min(ch - 1, Math.max(0, y + dy)), i = (yy * cw + xx) * 4; for (let k = 0; k < 3; k++) vs[k].push(td[i + k]); } return vs.map((v) => v.sort((a, b) => a - b)[12]); };
    let accents = null;
    if (accent) {   // bright + saturated pixels, grouped into 12 hue families of 30 degrees
      const fam = Array.from({ length: 12 }, () => []); let nAcc = 0;
      for (let i = 0; i < td.length; i += 8) {
        const r = td[i], gg = td[i + 1], b = td[i + 2], mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), sat = mx ? (mx - mn) / mx : 0;
        if (mx < 120 || sat < 0.35) continue;
        let h = mx === mn ? 0 : mx === r ? ((gg - b) / (mx - mn)) % 6 : mx === gg ? (b - r) / (mx - mn) + 2 : (r - gg) / (mx - mn) + 4;
        h = ((h * 60) + 360) % 360; fam[Math.floor(h / 30) % 12].push([r, gg, b, 0.2126 * r + 0.7152 * gg + 0.0722 * b]); nAcc++;
      }
      const NAMES = ['red-orange', 'yellow', 'yellow-green', 'green', 'green-2', 'green-cyan', 'cyan', 'azure', 'blue', 'violet', 'magenta', 'pink-red'];
      const medOf = (a) => [0, 1, 2].map((k) => a.map((p) => p[k]).sort((x, y) => x - y)[Math.floor(a.length / 2)]);
      accents = { share: +(nAcc / n).toFixed(4), families: fam.map((a, k) => ({ k, n: a.length })).filter((f) => f.n > nAcc * 0.02).sort((a, b) => b.n - a.n).map((f) => {
        const a = fam[f.k].sort((p, q) => q[3] - p[3]), cut = Math.max(1, Math.floor(a.length * 0.2)), core = medOf(a.slice(0, cut)), halo = medOf(a.slice(cut).length ? a.slice(cut) : a);
        return { name: NAMES[f.k], share: +(f.n / nAcc).toFixed(3), core: hex(core), halo: hex(halo) };
      }) };
    }
    return { width: W, height: H, box: [x0, y0, cw, ch], aspect: +(cw / ch).toFixed(3), orientation: cw < ch ? 'portrait' : cw > ch ? 'landscape' : 'square', palette, ...(accents ? { accents } : {}), points: points.map(([x, y]) => ({ x, y, rgb: med(x, y), hex: hex(med(x, y)) })), png: t.toDataURL('image/png').split(',')[1] };
  })();
}

function listImages(paths) {
  return paths.flatMap((p) => {
    const a = resolve(p);
    if (!existsSync(a)) throw new Error(`File not found: ${a}`);
    if (statSync(a).isDirectory()) return readdirSync(a).filter((n) => IMG.test(n) && !/\.trim\.png$|^compare([-.]|$)/i.test(n)).sort().map((n) => join(a, n));
    if (!IMG.test(a)) throw new Error(`Not a PNG, JPG or WEBP image: ${a}`);
    return [a];
  });
}

export async function measureImage(args) {
  const t0 = Date.now();
  const files = listImages(args.images);
  if (!files.length) throw new Error('No PNG, JPG or WEBP images found.');
  const out = args.outDir || args.slug ? outputDir(args) : null;
  if (out) mkdirSync(out, { recursive: true });
  const browser = await openBrowser();
  const results = [];
  try {
    const { page, context } = await newPage(browser, { width: 16, height: 16, fonts: false });
    try {
      for (const f of files) {
        const r = await page.evaluate(measureInPage, { url: dataUrl(f), top: args.top || 10, points: args.points || [], accent: !!args.accent, trim: args.trim !== false, crop: null });
        const { png, ...rest } = r;
        let trimmed;
        if (out && (rest.box[0] || rest.box[1] || rest.box[2] !== rest.width || rest.box[3] !== rest.height)) { trimmed = join(out, `${basename(f, extname(f))}.trim.png`); writeFileSync(trimmed, Buffer.from(png, 'base64')); }
        results.push({ file: f, ...rest, ...(trimmed ? { trimmed } : {}) });
      }
    } finally { await context.close(); }
  } finally { await browser.close(); }
  return { images: results, note: 'Thin lines read lighter than they are in a screenshot (anti-aliasing): take line colours from the source (SVG or CSS) when there is one.', ms: Date.now() - t0 };
}

// The comparison sheet, drawn in the page: both images at the same height, a 10% grid on each, labels.
function sheetInPage({ a, b, height, grid, labels }) {
  return (async () => {
    const load = async (u) => { const i = new Image(); i.src = u; await i.decode(); return i; };
    const [A, B] = [await load(a.url), await load(b.url)];
    const fit = (img, box) => { const [, , w, h] = box || [0, 0, img.naturalWidth, img.naturalHeight]; return { w: Math.round(w * height / h), h: height }; };
    const fa = fit(A, a.box), fb = fit(B, b.box), GAP = 40, PAD = 40, HEAD = 70;
    const c = document.createElement('canvas'); c.width = PAD * 2 + fa.w + GAP + fb.w; c.height = HEAD + height + PAD;
    const g = c.getContext('2d');
    g.fillStyle = '#1f1d1b'; g.fillRect(0, 0, c.width, c.height);
    const place = (img, box, x, f, label) => {
      const [sx, sy, sw, sh] = box || [0, 0, img.naturalWidth, img.naturalHeight];
      g.drawImage(img, sx, sy, sw, sh, x, HEAD, f.w, f.h);
      if (grid) { g.strokeStyle = 'rgba(255,64,160,0.55)'; g.lineWidth = 1; for (let i = 1; i < 10; i++) { g.beginPath(); g.moveTo(x + f.w * i / 10 + 0.5, HEAD); g.lineTo(x + f.w * i / 10 + 0.5, HEAD + f.h); g.moveTo(x, HEAD + f.h * i / 10 + 0.5); g.lineTo(x + f.w, HEAD + f.h * i / 10 + 0.5); g.stroke(); } }
      g.fillStyle = '#f2ece2'; g.font = "700 26px 'Inter', sans-serif"; g.fillText(label, x, 46);
    };
    place(A, a.box, PAD, fa, labels[0]); place(B, b.box, PAD + fa.w + GAP, fb, labels[1]);
    return { width: c.width, height: c.height, png: c.toDataURL('image/png').split(',')[1] };
  })();
}

export async function compareSheet(args) {
  const t0 = Date.now();
  const [ref, ours] = listImages([args.reference, args.ours]);
  const out = outputDir(args);
  mkdirSync(out, { recursive: true });
  const name = String(args.name || 'compare').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^[.-]+|[.-]+$/g, '') || 'compare';
  const browser = await openBrowser();
  try {
    const { page, context } = await newPage(browser, { width: 16, height: 16 });
    try {
      await page.setContent('<!doctype html><html><body></body></html>');
      await page.evaluate(() => document.fonts.ready);
      const mRef = await page.evaluate(measureInPage, { url: dataUrl(ref), top: args.top || 6, points: [], accent: false, trim: !!args.autoTrim, crop: args.crop || null });
      const mOurs = await page.evaluate(measureInPage, { url: dataUrl(ours), top: args.top || 6, points: [], accent: false, trim: false, crop: args.cropOurs || null });
      const sheet = await page.evaluate(sheetInPage, { a: { url: dataUrl(ref), box: mRef.box }, b: { url: dataUrl(ours), box: mOurs.box }, height: args.height || 960, grid: args.grid !== false, labels: [args.referenceLabel || 'reference', args.oursLabel || 'ours'] });
      const file = join(out, `${name}.png`);
      writeFileSync(file, Buffer.from(sheet.png, 'base64'));
      const strip = ({ png, ...r }) => r;
      return { sheet: file, width: sheet.width, height: sheet.height, reference: { file: ref, ...strip(mRef) }, ours: { file: ours, ...strip(mOurs) }, check: 'Compare in this order: proportions on the 10% grid (subject size, margins, line weight relative to the subject), the palette numbers, the texture, the type.', ms: Date.now() - t0 };
    } finally { await context.close(); }
  } finally { await browser.close(); }
}
