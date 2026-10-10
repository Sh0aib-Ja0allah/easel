// qa: measured quality checks. Hard gates refuse delivery until they pass (architecture §8).
//   text_clipping  (page)  text cut off by its own box, an ancestor that clips, or the frame
//   contrast       (page)  WCAG 2.x contrast of each text run against what is really behind it
//   stillness      (video) a still or empty stretch longer than N seconds (ffmpeg freezedetect)
//   colour_cast    (video/image) share of frames dominated by blue-purple hues
//   loudness       (audio/video) integrated loudness in LUFS (ffmpeg ebur128)
import { spawnSync } from 'node:child_process';
import { extname } from 'node:path';
import { newPage, openBrowser, waitReady } from './browser.mjs';
import { requireBinary } from './binaries.mjs';
import { resolveSource } from './source.mjs';
import { outputDir } from './render.mjs';

const VIDEO = new Set(['.mp4', '.mov', '.webm', '.mkv', '.gif']);

// ---------- page checks (run inside the page) ----------
function pageScan() {
  const W = innerWidth, H = innerHeight;
  const parse = (s) => {
    const m = String(s).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  };
  const over = (top, bottom) => { const a = top[3]; return [0, 1, 2].map((i) => top[i] * a + bottom[i] * (1 - a)).concat(1); };
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const L = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const label = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += `#${el.id}`; else if (el.classList.length) s += `.${[...el.classList].slice(0, 2).join('.')}`; return s; };
  const visible = (el) => { for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false; } return true; };
  const opacityOf = (el) => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= Number(getComputedStyle(e).opacity); return o; };
  const clipping = (cs) => /(hidden|clip|scroll|auto)/.test(cs.overflow + cs.overflowX + cs.overflowY);

  const clip = [], contrast = [];
  const els = [...document.body.querySelectorAll('*')].filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
  for (const el of els) {
    if (!visible(el)) continue;
    const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(' ').trim().replace(/\s+/g, ' ');
    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
    if (!rects.length) continue;
    const box = rects.reduce((a, r) => ({ left: Math.min(a.left, r.left), top: Math.min(a.top, r.top), right: Math.max(a.right, r.right), bottom: Math.max(a.bottom, r.bottom) }), { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity });
    const cs = getComputedStyle(el);
    const what = `${label(el)} "${text.slice(0, 40)}"`;
    // 1. the element clips its own overflowing text
    if (clipping(cs) && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) clip.push({ element: what, reason: cs.textOverflow === 'ellipsis' ? 'truncated with an ellipsis' : 'overflows its box and is clipped' });
    // 2. an ancestor clips the text
    else for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      if (!clipping(getComputedStyle(a))) continue;
      const r = a.getBoundingClientRect();
      if (box.left < r.left - 1 || box.right > r.right + 1 || box.top < r.top - 1 || box.bottom > r.bottom + 1) { clip.push({ element: what, reason: `cut off by ${label(a)}` }); break; }
    }
    // 3. text outside the frame
    if (box.left < -1 || box.top < -1 || box.right > W + 1 || box.bottom > H + 1) clip.push({ element: what, reason: `outside the ${W}x${H} frame` });

    // contrast: composite backgrounds up the tree; gradients or images mean "sample the pixels"
    let bg = [255, 255, 255, 1], layers = [], needsSample = false;
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const ecs = getComputedStyle(e);
      if (ecs.backgroundImage && ecs.backgroundImage !== 'none') { needsSample = true; break; }
      const c = parse(ecs.backgroundColor);
      if (c && c[3] > 0) { layers.push(c); if (c[3] >= 1) break; }
    }
    if (!needsSample) for (let i = layers.length - 1; i >= 0; i--) bg = over(layers[i], bg);
    const fgRaw = parse(cs.color) || [0, 0, 0, 1];
    const fgA = fgRaw[3] * opacityOf(el);
    const size = parseFloat(cs.fontSize), bold = Number(cs.fontWeight) >= 700;
    const large = size >= 24 || (bold && size >= 18.66);
    contrast.push({ element: what, fg: fgRaw.slice(0, 3), fgAlpha: fgA, bg: needsSample ? null : bg.slice(0, 3), ratio: needsSample ? null : ratio(over([...fgRaw.slice(0, 3), fgA], bg), bg), required: large ? 3 : 4.5, box: [box.left, box.top, box.right, box.bottom].map((v) => Math.round(v)) });
  }
  return { clip, contrast, width: W, height: H };
}

// Background under text drawn on gradients or images: from the screenshot, take the pixels in the
// text box and keep the half least like the text colour.
function sampleBackgrounds(imgs, items) {
  const [img] = imgs;
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const L = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  return items.map(({ box, fg, fgAlpha }) => {
    const px = [];
    const [x0, y0, x1, y1] = [Math.max(0, box[0]), Math.max(0, box[1]), Math.min(img.width, box[2]), Math.min(img.height, box[3])];
    const step = Math.max(1, Math.floor(Math.sqrt(((x1 - x0) * (y1 - y0)) / 4000)));
    for (let y = y0; y < y1; y += step) for (let x = x0; x < x1; x += step) { const i = (y * img.width + x) * 4; px.push([img.data[i], img.data[i + 1], img.data[i + 2]]); }
    if (!px.length) return null;
    const d = (p) => Math.abs(L(p) - L(fg));
    px.sort((a, b) => d(b) - d(a));
    const keep = px.slice(0, Math.max(1, Math.floor(px.length / 2)));
    // worst case: the background pixel closest to the text colour among those kept
    const worst = keep[keep.length - 1];
    const f = fg.map((c, i) => c * fgAlpha + worst[i] * (1 - fgAlpha));
    const a = L(f), b = L(worst);
    return { bg: worst, ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
  });
}

async function pageChecks(args, out) {
  const src = resolveSource(args, out, 'qa-page');
  const browser = await openBrowser();
  const clip = [], contrast = [];
  try {
    const { page, context } = await newPage(browser, { width: args.width || 1200, height: args.height || 630, colorScheme: args.theme || 'light' });
    try {
      await page.goto(src.url, { waitUntil: 'load', timeout: 60000 });
      await waitReady(page);
      for (const t of args.times && args.times.length ? args.times : [null]) {
        if (t !== null) await page.evaluate((tt) => window.__easelSeek(tt), t);
        const scan = await page.evaluate(pageScan);
        const at = t === null ? {} : { t };
        clip.push(...scan.clip.map((c) => ({ ...c, ...at })));
        const sampled = scan.contrast.filter((c) => c.ratio === null);
        if (sampled.length) {
          const shot = await page.screenshot({ type: 'png' });
          const res = await page.evaluate(async ({ url, items, fn }) => {
            const img = new Image(); img.src = url; await img.decode();
            const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
            const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
            // eslint-disable-next-line no-new-func
            return new Function('imgs', 'items', `return (${fn})(imgs, items);`)([{ data: g.getImageData(0, 0, c.width, c.height).data, width: c.width, height: c.height }], items);
          }, { url: `data:image/png;base64,${shot.toString('base64')}`, items: sampled, fn: sampleBackgrounds.toString() });
          sampled.forEach((c, i) => { if (res[i]) { c.ratio = res[i].ratio; c.bg = res[i].bg; c.sampled = true; } });
        }
        contrast.push(...scan.contrast.map((c) => ({ ...c, ...at })));
      }
    } finally {
      await context.close();
    }
  } finally {
    await browser.close();
  }
  const fails = contrast.filter((c) => c.ratio !== null && c.ratio < c.required);
  return [
    { name: 'text_clipping', pass: clip.length === 0, hard: true, value: clip.length, threshold: 0, findings: clip.slice(0, 20) },
    {
      name: 'contrast', pass: fails.length === 0, hard: args.mode === 'ui', value: contrast.length ? Math.min(...contrast.filter((c) => c.ratio !== null).map((c) => +c.ratio.toFixed(2))) : null, threshold: 'WCAG AA (4.5, large text 3)',
      findings: fails.slice(0, 20).map((c) => ({ element: c.element, ratio: +c.ratio.toFixed(2), required: c.required, fg: c.fg, bg: c.bg, ...(c.sampled ? { sampled: true } : {}), ...(c.t !== undefined ? { t: c.t } : {}) })),
    },
  ];
}

// ---------- media checks (ffmpeg) ----------
function ff(args) {
  const r = spawnSync(requireBinary('ffmpeg'), ['-hide_banner', '-nostats', ...args], { encoding: 'utf8', windowsHide: true, maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${(r.stderr || '').slice(-600)}`);
  return r;
}

export function stillness(file, { seconds = 2, noise = '-50dB' } = {}) {
  const r = ff(['-i', file, '-vf', `freezedetect=n=${noise}:d=${seconds}`, '-map', '0:v:0', '-f', 'null', '-']);
  const runs = [];
  let start = null;
  for (const line of r.stderr.split(/\r?\n/)) {
    const s = line.match(/freeze_start: ([\d.]+)/); if (s) start = Number(s[1]);
    const d = line.match(/freeze_duration: ([\d.]+)/); if (d) runs.push({ start, duration: Number(d[1]) });
  }
  // A freeze still open at the end of the file reports start but no duration.
  if (start !== null && runs.every((x) => x.start !== start)) runs.push({ start, duration: null, untilEnd: true });
  return { name: 'stillness', pass: runs.length === 0, hard: true, value: runs.length ? Math.max(...runs.map((x) => x.duration ?? seconds)) : 0, threshold: `no still stretch longer than ${seconds} s`, findings: runs };
}

export function colourCast(file, { maxRatio = 0.3, fps = 2 } = {}) {
  const isVideo = VIDEO.has(extname(file).toLowerCase());
  const r = spawnSync(requireBinary('ffmpeg'), ['-v', 'error', '-i', file, '-vf', `${isVideo ? `fps=${fps},` : ''}scale=48:27:flags=area`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { windowsHide: true, maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${String(r.stderr).slice(-400)}`);
  const buf = r.stdout, per = 48 * 27 * 3, frames = Math.floor(buf.length / per);
  let cast = 0;
  const casts = [];
  for (let f = 0; f < frames; f++) {
    let bp = 0;
    for (let i = f * per; i < (f + 1) * per; i += 3) {
      const R = buf[i] / 255, G = buf[i + 1] / 255, B = buf[i + 2] / 255;
      const max = Math.max(R, G, B), min = Math.min(R, G, B), d = max - min;
      if (max < 0.15 || d / (max || 1) < 0.25) continue; // too dark or too grey to carry a hue
      let h = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
      h = (h * 60 + 360) % 360;
      if (h >= 220 && h <= 300) bp++;
    }
    if (bp / (48 * 27) > 0.5) { cast++; if (casts.length < 10) casts.push(isVideo ? +(f / fps).toFixed(2) : 0); }
  }
  const ratio = frames ? cast / frames : 0;
  return { name: 'colour_cast', pass: ratio <= maxRatio, hard: true, value: +ratio.toFixed(3), threshold: `at most ${Math.round(maxRatio * 100)}% of frames dominated by blue-purple`, findings: casts.length ? [{ castFrames: cast, of: frames, firstAt: casts }] : [] };
}

export function loudness(file, { min = -16, max = -12 } = {}) {
  const r = ff(['-i', file, '-map', '0:a:0', '-af', 'ebur128=peak=true', '-f', 'null', '-']);
  const summary = r.stderr.slice(r.stderr.lastIndexOf('Summary:'));
  const I = Number((summary.match(/I:\s+(-?[\d.]+|-inf) LUFS/) || [])[1]);
  const peak = Number((summary.match(/Peak:\s+(-?[\d.]+|-inf) dBFS/) || [])[1]);
  const ok = Number.isFinite(I) && I >= min && I <= max;
  return { name: 'loudness', pass: ok, hard: true, value: Number.isFinite(I) ? I : null, threshold: `${min} to ${max} LUFS integrated`, findings: ok ? [] : [{ integratedLufs: Number.isFinite(I) ? I : '-inf', truePeakDbfs: Number.isFinite(peak) ? peak : null, fix: Number.isFinite(I) ? `apply ${(-14 - I).toFixed(1)} dB of gain, or loudnorm=I=-14:TP=-1` : 'the track is silent' }] };
}

function hasAudio(file) {
  const r = spawnSync(requireBinary('ffmpeg'), ['-hide_banner', '-i', file], { encoding: 'utf8', windowsHide: true });
  return /Stream #\d+:\d+.*: Audio:/.test(r.stderr || '');
}

export async function qa(args) {
  const t0 = Date.now();
  if (!args.html && !args.file && !args.video && !args.audio && !args.image) throw new Error('Give a page (html or file) and/or a video, audio or image file to check.');
  const want = (n) => !args.checks || !args.checks.length || args.checks.includes(n);
  const checks = [];
  if ((args.html || args.file) && (want('text_clipping') || want('contrast'))) {
    const out = outputDir(args);
    checks.push(...(await pageChecks(args, out)).filter((c) => want(c.name)));
  }
  if (args.video) {
    if (want('stillness')) checks.push(stillness(args.video, { seconds: args.stillSeconds ?? 2 }));
    if (want('colour_cast')) checks.push(colourCast(args.video, { maxRatio: args.castMaxRatio ?? 0.3 }));
    if (want('loudness') && hasAudio(args.video)) checks.push(loudness(args.video, { min: args.lufsMin ?? -16, max: args.lufsMax ?? -12 }));
  }
  if (args.image && want('colour_cast')) checks.push(colourCast(args.image, { maxRatio: args.castMaxRatio ?? 0.3 }));
  if (args.audio && want('loudness')) checks.push(loudness(args.audio, { min: args.lufsMin ?? -16, max: args.lufsMax ?? -12 }));
  const hardFailures = checks.filter((c) => c.hard && !c.pass).map((c) => c.name);
  return { pass: hardFailures.length === 0, deliver: hardFailures.length === 0 ? 'ok' : `refused: fix ${hardFailures.join(', ')} first`, hardFailures, checks, ms: Date.now() - t0 };
}
