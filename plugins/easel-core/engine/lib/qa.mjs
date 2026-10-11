// qa: measured quality checks. Hard gates refuse delivery until they pass (architecture §8).
//   text_clipping  (page)  text cut off by its own box, an ancestor that clips, or the frame
//   contrast       (page)  WCAG 2.x contrast of each text run against what is really behind it
//   canvas_text    (canvas piece) text a renderFrame(t) piece draws: cut off by the frame, overlapping, under the phone UI
//   beat_grid      (canvas piece) cuts and morph centres on the 8th-note grid of TIMELINE.bpm
//   stillness      (video) a still or empty stretch longer than N seconds (ffmpeg freezedetect)
//   colour_cast    (video/image) share of frames dominated by blue-purple hues
//   loudness       (audio/video) integrated loudness in LUFS (ffmpeg ebur128)
import { spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { newPage, openBrowser, waitReady } from './browser.mjs';
import { requireBinary } from './binaries.mjs';
import { releaseSource, resolveSource } from './source.mjs';
import { outputDir } from './render.mjs';
import { canvasChecks } from './canvastext.mjs';

const VIDEO = new Set(['.mp4', '.mov', '.webm', '.mkv', '.gif']);

// ---------- page checks ----------
// Runs inside the page: finds every visible text run, its box, its colour, and clipping problems.
function pageScan() {
  const W = innerWidth, H = innerHeight;
  const scrolls = document.documentElement.scrollHeight > H + 1 && !document.querySelector('[data-composition-id]');
  // Any colour the browser can paint (rgb(), and the CSS Color 4 forms Chromium computes modern colours
  // to: oklch(), lab(), color(srgb ...), color-mix() ...) as sRGB [r, g, b, alpha]. Painted over black
  // and over white on a 2x1 canvas, which gives both the colour and its alpha. null when the browser
  // cannot resolve it: never assumed to be black.
  const cv = document.createElement('canvas'); cv.width = 2; cv.height = 1;
  const g = cv.getContext('2d', { willReadFrequently: true });
  const takes = (s) => { g.fillStyle = '#000'; g.fillStyle = s; if (g.fillStyle !== '#000000') return true; g.fillStyle = '#fff'; g.fillStyle = s; return g.fillStyle !== '#ffffff'; };
  const memo = new Map();
  const parse = (s) => {
    s = String(s || '').trim();
    if (!memo.has(s)) {
      let c = null;
      const m = s.match(/^rgba?\(([^)]+)\)$/);
      const p = m ? m[1].split(/[\s,/]+/).filter(Boolean).map(Number) : [];
      if (p.length >= 3 && p.every(Number.isFinite)) c = [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
      else if (s && s !== 'none' && !s.startsWith('url(') && takes(s)) {
        g.fillStyle = '#000'; g.fillRect(0, 0, 1, 1); g.fillStyle = '#fff'; g.fillRect(1, 0, 1, 1);
        g.fillStyle = s; g.fillRect(0, 0, 2, 1);
        const d = g.getImageData(0, 0, 2, 1).data;
        const a = Math.min(1, Math.max(0, 1 - (d[4] - d[0] + d[5] - d[1] + d[6] - d[2]) / 765));
        c = a < 0.004 ? [0, 0, 0, 0] : [0, 1, 2].map((k) => Math.min(255, Math.round(d[k] / a))).concat(a);
      }
      memo.set(s, c);
    }
    const c = memo.get(s);
    return c ? [...c] : null;
  };
  const label = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += `#${el.id}`; else if (el.classList.length) s += `.${[...el.classList].slice(0, 2).join('.')}`; return s; };
  const visible = (el) => { for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return false; } return true; };
  const opacityOf = (el) => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= Number(getComputedStyle(e).opacity); return o; };
  const clipping = (cs) => /(hidden|clip|scroll|auto)/.test(cs.overflow + cs.overflowX + cs.overflowY);
  // Visually hidden on purpose (the sr-only pattern, text for screen readers): clipped to nothing by
  // clip or clip-path, or inside a box of 1px or less that hides its overflow. Neither check applies.
  const srOnly = (el) => {
    for (let e = el; e && e.nodeType === 1 && e !== document.body; e = e.parentElement) {
      const cs = getComputedStyle(e), r = e.getBoundingClientRect();
      if (/^rect\(/.test(cs.clip) && /^(absolute|fixed)$/.test(cs.position)) {
        const [t, rt, b, l] = cs.clip.slice(5, -1).split(/\s*,\s*|\s+/).map((v, i) => (v === 'auto' ? [0, r.width, r.height, 0][i] : parseFloat(v)));
        if (b - t <= 1 || rt - l <= 1) return true;
      }
      const cp = cs.clipPath || 'none';
      const inset = cp.match(/^inset\(\s*([\d.]+)%/);
      const pts = cp.startsWith('polygon(') ? cp.slice(8, -1).split(',').map((p) => p.trim()) : [];
      if ((inset && Number(inset[1]) >= 50) || /^(circle|ellipse)\(\s*0(px|%)?[\s)]/.test(cp) || (pts.length && new Set(pts).size === 1)) return true;
      if (/(hidden|clip)/.test(cs.overflow + cs.overflowX + cs.overflowY) && (r.width <= 1 || r.height <= 1)) return true;
    }
    return false;
  };
  // A focus target parked off-screen (a skip link at left:-9999px) that comes into view when focused:
  // focus it, look, and put focus back. Transitions started by the focus change are finished at once,
  // so the page is captured as it was.
  const FOCUSABLE = 'a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"])';
  const showsOnFocus = (el) => {
    const f = el.closest(FOCUSABLE);
    if (!f || typeof f.focus !== 'function') return false;
    const prev = document.activeElement, before = new Set(document.getAnimations());
    const settle = () => { for (const a of document.getAnimations()) if (!before.has(a)) a.finish(); };
    f.focus({ preventScroll: true }); settle();
    const r = el.getBoundingClientRect();
    const shown = document.activeElement === f && r.right > 0 && r.left < W && r.bottom > 0 && (scrolls || r.top < H);
    f.blur();
    if (prev && prev !== document.body && typeof prev.focus === 'function') prev.focus({ preventScroll: true });
    settle();
    return shown;
  };

  const clip = [], texts = [];
  const els = [...document.body.querySelectorAll('*')].filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
  for (const el of els) {
    if (!visible(el) || srOnly(el)) continue;
    // The element's own text only: a child (a badge, a link) is measured on its own, against its own background.
    const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim());
    const text = own.map((n) => n.textContent).join(' ').trim().replace(/\s+/g, ' ');
    const rects = own.flatMap((n) => { const range = document.createRange(); range.selectNodeContents(n); return [...range.getClientRects()]; }).filter((r) => r.width > 0 && r.height > 0);
    if (!rects.length) continue;
    const box = rects.reduce((a, r) => ({ left: Math.min(a.left, r.left), top: Math.min(a.top, r.top), right: Math.max(a.right, r.right), bottom: Math.max(a.bottom, r.bottom) }), { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity });
    // Sideways overflow is always wrong; below the fold is only wrong for fixed-size frames.
    const offFrame = box.left < -1 || box.right > W + 1 || (!scrolls && (box.top < -1 || box.bottom > H + 1));
    if (offFrame && showsOnFocus(el)) continue;
    const cs = getComputedStyle(el);
    const what = `${label(el)} "${text.slice(0, 40)}"`;
    if (clipping(cs) && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) clip.push({ element: what, reason: cs.textOverflow === 'ellipsis' ? 'truncated with an ellipsis' : 'overflows its box and is clipped' });
    else for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      if (!clipping(getComputedStyle(a))) continue;
      const r = a.getBoundingClientRect();
      if (box.left < r.left - 1 || box.right > r.right + 1 || box.top < r.top - 1 || box.bottom > r.bottom + 1) { clip.push({ element: what, reason: `cut off by ${label(a)}` }); break; }
    }
    if (offFrame) clip.push({ element: what, reason: `outside the ${W}x${H} frame` });

    // The paint the glyphs really get: SVG text paints with fill (and fill-opacity); HTML text with
    // -webkit-text-fill-color, which is the CSS color unless a page sets it (transparent for gradient text).
    const isSvg = typeof SVGElement !== 'undefined' && el instanceof SVGElement;
    const paint = String((isSvg ? cs.fill : cs.webkitTextFillColor || cs.color) || '');
    const server = paint === 'none' || paint.startsWith('url(');
    const fg = server ? null : parse(paint);
    if (fg && isSvg) fg[3] *= Number(cs.fillOpacity || 1);
    const alpha = fg ? fg[3] * opacityOf(el) : 0;
    const size = parseFloat(cs.fontSize), bold = Number(cs.fontWeight) >= 700;
    texts.push({
      element: what, fg: fg ? fg.slice(0, 3) : [0, 0, 0], fgAlpha: alpha,
      // Gradient or image text, outlined SVG text and colours the browser cannot resolve are not measured this way.
      unmeasured: paint === 'none' ? 'no fill (outlined text); check by eye'
        : server ? 'gradient or pattern fill; check by eye'
          : !fg ? `colour "${paint}" could not be resolved to sRGB; check by eye`
            : alpha === 0 ? 'transparent text fill (gradient or image text); check by eye' : null,
      required: size >= 24 || (bold && size >= 18.66) ? 3 : 4.5,
      box: [box.left, box.top, box.right, box.bottom].map((v) => Math.round(v)),
    });
  }
  return { clip, texts, width: W, height: H };
}

// Runs inside the page on a screenshot taken with all text hidden: for each text box, contrast of the
// text colour against every background pixel under it; the 10th percentile is the score.
function measureContrast(imgs, items) {
  const [img] = imgs;
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const L = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  return items.map(({ box, fg, fgAlpha }) => {
    const [x0, y0, x1, y1] = [Math.max(0, box[0]), Math.max(0, box[1]), Math.min(img.width, box[2]), Math.min(img.height, box[3])];
    if (x1 <= x0 || y1 <= y0) return null;
    const step = Math.max(1, Math.floor(Math.sqrt(((x1 - x0) * (y1 - y0)) / 6000)));
    const ratios = [];
    let sum = [0, 0, 0];
    for (let y = y0; y < y1; y += step) for (let x = x0; x < x1; x += step) {
      const i = (y * img.width + x) * 4;
      const bg = [img.data[i], img.data[i + 1], img.data[i + 2]];
      const f = fg.map((c, k) => c * fgAlpha + bg[k] * (1 - fgAlpha));
      const a = L(f), b = L(bg);
      ratios.push((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05));
      sum = sum.map((v, k) => v + bg[k]);
    }
    ratios.sort((a, b) => a - b);
    return { ratio: ratios[Math.floor(ratios.length * 0.1)], bg: sum.map((v) => Math.round(v / ratios.length)) };
  });
}

const HIDE_TEXT = '*,*::before,*::after{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;text-decoration-color:transparent!important;caret-color:transparent!important}text,tspan,textPath{fill:transparent!important;stroke:transparent!important}';

async function pageChecks(args, out) {
  const src = resolveSource(args, out, 'qa-page');
  let browser = null;
  const clip = [], contrast = [], unmeasured = [], overflow = [];
  try {
    browser = await openBrowser();
    const { page, context } = await newPage(browser, { width: args.width || 1200, height: args.height || 630, colorScheme: args.theme || 'light', reducedMotion: args.reducedMotion });
    try {
      await page.goto(src.url, { waitUntil: 'load', timeout: 60000 });
      await waitReady(page);
      for (const t of args.times && args.times.length ? args.times : [0]) {
        await page.evaluate((tt) => window.__easelSeek(tt), t);
        const scan = await page.evaluate(pageScan);
        const at = args.times && args.times.length ? { t } : {};
        // a fixed-size graphic (a post, a poster, a slide) must not grow past its frame: below the fold is not allowed
        if (args.fixedFrame) {
          const o = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight, vw: window.innerWidth, vh: window.innerHeight }));
          if (o.w > o.vw + 1 || o.h > o.vh + 1) overflow.push({ element: 'page', content: `${o.w}x${o.h}`, frame: `${o.vw}x${o.vh}`, fix: 'the content runs past the fixed frame: tighten the layout or fix the root size', ...at });
        }
        clip.push(...scan.clip.map((c) => ({ ...c, ...at })));
        const measurable = scan.texts.filter((c) => !c.unmeasured);
        unmeasured.push(...scan.texts.filter((c) => c.unmeasured).map((c) => ({ element: c.element, reason: c.unmeasured, ...at })));
        if (!measurable.length || !args.wantContrast) continue;
        const style = await page.addStyleTag({ content: HIDE_TEXT });
        let shot;
        try {
          shot = await page.screenshot({ type: 'png', fullPage: true, animations: 'allow' });
        } catch {
          // Chromium occasionally refuses a full-page capture right after a style change; retry once.
          await page.waitForTimeout(250);
          shot = await page.screenshot({ type: 'png', fullPage: true, animations: 'allow' });
        }
        await style.evaluate((n) => n.remove());
        const res = await page.evaluate(async ({ url, items, fn }) => {
          const img = new Image(); img.src = url; await img.decode();
          const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
          const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
          // eslint-disable-next-line no-new-func
          return new Function('imgs', 'items', `return (${fn})(imgs, items);`)([{ data: g.getImageData(0, 0, c.width, c.height).data, width: c.width, height: c.height }], items);
        }, { url: `data:image/png;base64,${shot.toString('base64')}`, items: measurable, fn: measureContrast.toString() });
        measurable.forEach((c, i) => { if (res[i]) contrast.push({ ...c, ratio: res[i].ratio, bg: res[i].bg, ...at }); });
      }
    } finally {
      await context.close();
    }
  } finally {
    if (browser) await browser.close();
    releaseSource(src);
  }
  const fails = contrast.filter((c) => c.ratio < c.required);
  return [
    ...(args.fixedFrame ? [{ name: 'frame_overflow', pass: overflow.length === 0, hard: true, value: overflow.length, threshold: 'content fits the frame (fixedFrame)', findings: overflow }] : []),
    { name: 'text_clipping', pass: clip.length === 0, hard: true, value: clip.length, threshold: 0, findings: clip.slice(0, 20) },
    {
      name: 'contrast', pass: fails.length === 0, hard: args.mode === 'ui', value: contrast.length ? +Math.min(...contrast.map((c) => c.ratio)).toFixed(2) : null, threshold: 'WCAG AA (4.5, large text 3), 10th percentile of the pixels behind each text run',
      findings: fails.slice(0, 20).map((c) => ({ element: c.element, ratio: +c.ratio.toFixed(2), required: c.required, fg: c.fg, bg: c.bg, ...(c.t !== undefined ? { t: c.t } : {}) })),
      ...(unmeasured.length ? { unmeasured: unmeasured.slice(0, 20) } : {}),
    },
  ];
}

// ---------- media checks (ffmpeg) ----------
function ff(args) {
  const r = spawnSync(requireBinary('ffmpeg'), ['-hide_banner', '-nostats', ...args], { encoding: 'utf8', windowsHide: true, maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${(r.stderr || '').slice(-600)}`);
  return r;
}

// A sample is "still" when almost no pixels change between consecutive samples. Frames are decoded
// small (160x90 grey at 10 fps) and lightly blurred, so grain and noise do not count as motion while
// a small object moving slowly across a flat background still does. (ffmpeg freezedetect averages
// the whole frame and calls such shots frozen.)
export function stillness(file, { seconds = 2, diff = 10, minPixels = 4 } = {}) {
  const W = 160, H = 90, FPS = 10;
  const r = spawnSync(requireBinary('ffmpeg'), ['-v', 'error', '-i', file, '-map', '0:v:0', '-vf', `fps=${FPS},scale=${W}:${H}:flags=area,format=gray,gblur=sigma=0.8`, '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], { windowsHide: true, maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${String(r.stderr).slice(-400)}`);
  const buf = r.stdout, frames = Math.floor(buf.length / (W * H));
  const runs = [];
  let start = null;
  for (let f = 1; f < frames; f++) {
    let changed = 0;
    const a = (f - 1) * W * H, b = f * W * H;
    for (let i = 0; i < W * H && changed < minPixels; i++) if (Math.abs(buf[a + i] - buf[b + i]) > diff) changed++;
    const still = changed < minPixels;
    const last = f === frames - 1;
    if (still && start === null) start = f - 1;
    if (start !== null && (!still || last)) {
      const end = still ? f : f - 1;
      const duration = +((end - start) / FPS).toFixed(2);
      if (duration >= seconds) runs.push({ start: +(start / FPS).toFixed(2), duration });
      start = null;
    }
  }
  return { name: 'stillness', pass: runs.length === 0, hard: true, value: runs.length ? Math.max(...runs.map((x) => x.duration)) : 0, threshold: `no still or empty stretch longer than ${seconds} s`, findings: runs };
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
  const silent = !Number.isFinite(I) || I <= -70;
  const ok = !silent && I >= min && I <= max;
  return { name: 'loudness', pass: ok, hard: true, value: Number.isFinite(I) ? I : null, threshold: `${min} to ${max} LUFS integrated`, findings: ok ? [] : [{ integratedLufs: Number.isFinite(I) ? I : '-inf', truePeakDbfs: Number.isFinite(peak) ? peak : null, fix: silent ? 'the track is silent (below -70 LUFS): check that the audio was mixed in' : `apply ${(-14 - I).toFixed(1)} dB of gain, or loudnorm=I=-14:TP=-1` }] };
}

function hasAudio(file) {
  const r = spawnSync(requireBinary('ffmpeg'), ['-hide_banner', '-i', file], { encoding: 'utf8', windowsHide: true });
  return /Stream #\d+:\d+.*: Audio:/.test(r.stderr || '');
}

// ffmpeg would read a URL (or a protocol such as concat:) as happily as a file: qa checks local files
// only, by absolute path (the same rule as render_video's audio).
function localFile(p, what) {
  const abs = resolve(String(p));
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(String(p)) || !existsSync(abs) || !statSync(abs).isFile()) throw new Error(`${what} must be a local file that exists: ${p}`);
  return abs;
}

// Callers may tighten the media gates, never loosen them past these: loudness stays inside -18 to -10
// LUFS (Easel masters to -14 and delivers -16 to -12), and a still stretch is at most 5 s.
export const GATE_LIMITS = { lufsMin: -18, lufsMax: -10, stillSeconds: 5 };
// What each check needs; a check the caller names that cannot run fails instead of being left out.
const NEEDS = {
  text_clipping: 'a page (html or file)', contrast: 'a page (html or file)',
  canvas_text: 'a canvas piece (html or file with window.renderFrame and window.TIMELINE)', beat_grid: 'a canvas piece with TIMELINE.bpm',
  stillness: 'a video', colour_cast: 'a video or an image', loudness: 'an audio file, or a video with an audio track',
};
const cannotRun = (name, why) => ({ name, pass: false, hard: true, value: null, threshold: `needs ${NEEDS[name] || 'a known check name'}`, findings: [{ fix: why }] });

export async function qa(args) {
  const t0 = Date.now();
  if (!args.html && !args.file && !args.video && !args.audio && !args.image) throw new Error('Give a page (html or file) and/or a video, audio or image file to check.');
  const video = args.video ? localFile(args.video, 'video') : null;
  const audio = args.audio ? localFile(args.audio, 'audio') : null;
  const image = args.image ? localFile(args.image, 'image') : null;
  const want = (n) => !args.checks || !args.checks.length || args.checks.includes(n);
  const checks = [];
  const explicit = (n) => !!(args.checks && args.checks.includes(n));
  const lufs = { min: Math.max(GATE_LIMITS.lufsMin, args.lufsMin ?? -16), max: Math.min(GATE_LIMITS.lufsMax, args.lufsMax ?? -12) };
  if ((args.html || args.file) && (want('text_clipping') || want('contrast'))) {
    const out = outputDir(args);
    checks.push(...(await pageChecks({ ...args, wantContrast: want('contrast') }, out)).filter((c) => want(c.name) || c.name === 'frame_overflow'));
  }
  // Canvas pieces (window.renderFrame + window.TIMELINE): asked for by name, or found when no checks are named.
  if ((args.html || args.file) && (want('canvas_text') || want('beat_grid'))) {
    const out = outputDir(args);
    const src = resolveSource(args, out, 'qa-canvas');
    try {
      const cs = await canvasChecks(args, src, want);
      if (cs) checks.push(...cs);
      else for (const n of ['canvas_text', 'beat_grid'].filter(explicit)) checks.push({ name: n, pass: false, hard: true, value: null, threshold: 'a canvas piece', findings: [{ fix: `${n} needs a page with window.renderFrame(t) and window.TIMELINE (an animate piece)` }] });
    } finally { releaseSource(src); }
  }
  if (video) {
    if (want('stillness')) checks.push(stillness(video, { seconds: Math.min(GATE_LIMITS.stillSeconds, args.stillSeconds ?? 2) }));
    if (want('colour_cast')) checks.push(colourCast(video, { maxRatio: args.castMaxRatio ?? 0.3 }));
    if (want('loudness')) {
      if (hasAudio(video)) checks.push(loudness(video, { min: lufs.min, max: lufs.max }));
      else if (explicit('loudness') && !audio) checks.push(cannotRun('loudness', 'the video has no audio track: add one (render_video audio, or mux_audio) or leave loudness out'));
    }
  }
  if (image && want('colour_cast')) checks.push(colourCast(image, { maxRatio: args.castMaxRatio ?? 0.3 }));
  if (audio && want('loudness')) checks.push(loudness(audio, { min: lufs.min, max: lufs.max }));
  for (const n of args.checks || []) if (!checks.some((c) => c.name === n)) checks.push(cannotRun(n, `${n} was asked for but could not run: it needs ${NEEDS[n] || 'a known check name'}`));
  // Nothing measured is not a pass.
  if (!checks.length) return { pass: false, deliver: 'refused: no check ran; give a page, video, audio or image the checks apply to', hardFailures: [], checks, ms: Date.now() - t0 };
  const hardFailures = checks.filter((c) => c.hard && !c.pass).map((c) => c.name);
  return { pass: hardFailures.length === 0, deliver: hardFailures.length === 0 ? 'ok' : `refused: fix ${hardFailures.join(', ')} first`, hardFailures, checks, ms: Date.now() - t0 };
}
