// render_video: seek a page frame by frame (t = n / fps) and pipe PNG frames into ffmpeg.
// filmstrip: a few frames at chosen times on one sheet, so a vision model can review motion: of a
// page (seeked in the browser) or of a video file (frames grabbed with ffmpeg).
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { ASPECTS, newPage, openBrowser, waitReady } from './browser.mjs';
import { masterWav, writeBase64 } from './audio.mjs';
import { requireBinary } from './binaries.mjs';
import { commit, killTree, mediaInfo, partialPath, removeQuietly, run } from './probe.mjs';
import { outputDir } from './render.mjs';
import { releaseSource, resolveSource } from './source.mjs';
import { composeSheet } from './sheet.mjs';
import { pngSize, writeOutput } from './image.mjs';

const slugOf = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'video';

// Size, duration and fps the page declares: the HyperFrames-style root (data-width/height/
// duration/fps), else a window.__composition or window.TIMELINE object (the animate kit) with
// width, height, duration and fps.
export async function compositionInfo(page) {
  return page.evaluate(() => {
    const num = (v) => (v === undefined || v === null || v === '' || !Number.isFinite(Number(v)) ? undefined : Number(v));
    const root = document.querySelector('[data-composition-id]');
    if (root) return { id: root.dataset.compositionId, width: num(root.dataset.width), height: num(root.dataset.height), duration: num(root.dataset.duration), fps: num(root.dataset.fps) };
    const o = window.__composition || window.TIMELINE;
    if (o && typeof o === 'object') return { id: o.id || o.name, width: num(o.width), height: num(o.height), duration: num(o.duration), fps: num(o.fps) };
    // A plain page or SVG with CSS animations: the longest one (delay + duration x iterations; one
    // iteration of an infinite loop), so filmstrip count and render_video work without a duration.
    let css = 0;
    for (const a of document.getAnimations()) {
      const t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null;
      if (!t || !Number.isFinite(Number(t.duration))) continue;
      const iters = Number.isFinite(t.iterations) ? t.iterations : 1;
      css = Math.max(css, (Number(t.delay) || 0) + Number(t.duration) * iters);
    }
    return css > 0 ? { duration: +(css / 1000).toFixed(3), fromCss: true } : {};
  });
}

// The bounds of the render_video arguments. What a page declares (data-*, TIMELINE, __composition, or
// the length of its CSS animations) must meet them too, or a page could ask for a day-long or a
// 20000 px render that the arguments would refuse.
export const LIMITS = { duration: [0.04, 600, ' s'], fps: [1, 120, ' fps'], width: [16, 7680, ' px'], height: [16, 7680, ' px'] };
export function checkDeclared(info, keys) {
  for (const k of keys) {
    const v = info[k];
    if (v === undefined) continue;
    const [lo, hi, unit] = LIMITS[k];
    if (v >= lo && v <= hi) continue;
    if (k === 'duration' && info.fromCss) throw new Error(`the page's CSS animations last ${v} s (every iteration counted); the duration must be ${lo} to ${hi} s: pass duration, or shorten the animation (an infinite one counts one loop)`);
    throw new Error(`the page declares ${k} ${v} (data-${k} on the composition root, or TIMELINE / __composition); it must be ${lo} to ${hi}${unit}: fix the page or pass ${k}`);
  }
}

function encoder(ffmpeg, { fps, file, crf, audio, duration, preset }) {
  const args = ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', 'pipe:0'];
  if (audio) args.push('-i', audio);
  // yuv420p needs even dimensions: pad by one pixel instead of letting x264 crop silently.
  args.push('-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', '-c:v', 'libx264', '-preset', preset, '-crf', String(crf), '-pix_fmt', 'yuv420p', '-movflags', '+faststart');
  if (audio) args.push('-c:a', 'aac', '-b:a', '192k', '-t', String(duration), '-map', '0:v:0', '-map', '1:a:0');
  args.push('-f', 'mp4', file);
  const proc = spawn(ffmpeg, args, { stdio: ['pipe', 'ignore', 'pipe'], windowsHide: true });
  let stderr = '';
  proc.stderr.on('data', (d) => (stderr += d));
  const done = new Promise((resolve, reject) => {
    proc.on('error', reject);
    proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${stderr.trim().slice(-600)}`))));
  });
  let closed = false;
  proc.on('close', () => { closed = true; });
  proc.stdin.on('error', () => {}); // surfaced through the close handler / done promise instead
  const write = (buf) => new Promise((resolve, reject) => {
    if (closed) return reject(new Error(`ffmpeg exited early: ${stderr.trim().slice(-600)}`));
    if (proc.stdin.write(buf)) return resolve();
    const cleanup = () => { proc.stdin.off('drain', onDrain); proc.off('close', onClose); };
    const onDrain = () => { cleanup(); resolve(); };
    const onClose = () => { cleanup(); reject(new Error(`ffmpeg exited early: ${stderr.trim().slice(-600)}`)); };
    proc.stdin.once('drain', onDrain);
    proc.once('close', onClose);
  });
  // abort: stop ffmpeg without letting it finish the file (a failed render must not look playable); on
  // Windows the whole tree, or the real ffmpeg behind a package-manager shim would finalise it
  const abort = async () => { if (!closed) { proc.stdin.destroy(); killTree(proc); } await done.catch(() => {}); };
  return { write, end: async () => { proc.stdin.end(); await done; }, abort };
}

async function renderOne(browser, src, opts) {
  const { page, context, blocked, errors } = await newPage(browser, { width: opts.width, height: opts.height, seed: opts.seed, colorScheme: opts.theme, aspect: opts.aspect || null, reducedMotion: opts.reducedMotion });
  try {
    await page.goto(src.url, { waitUntil: 'load', timeout: 60000 });
    await waitReady(page);
    const info = await compositionInfo(page);
    checkDeclared(info, [...(opts.fps ? [] : ['fps']), ...(opts.duration ? [] : ['duration'])]);
    const fps = opts.fps || info.fps || 30;
    const duration = opts.duration || info.duration;
    if (!duration) throw new Error('No duration: pass duration (seconds) or set data-duration on the [data-composition-id] root (CSS animations are measured when there is neither).');
    const frames = Math.round(duration * fps);
    let audio = opts.audio;
    if (audio === 'page') audio = await opts.pageAudio(page);
    // Encode to a partial file and move it into place only when every frame is in: a render that fails
    // half way leaves no truncated (but playable) MP4 behind, and never replaces a good earlier one.
    const partial = partialPath(opts.file);
    const enc = encoder(opts.ffmpeg, { fps, file: partial, crf: opts.crf, audio, duration, preset: opts.preset });
    try {
      for (let n = 0; n < frames; n++) {
        await page.evaluate((t) => window.__easelSeek(t), n / fps);
        await enc.write(await page.screenshot({ type: 'png', animations: 'allow' }));
      }
      await enc.end();
    } catch (err) {
      await enc.abort();
      removeQuietly(partial);
      throw err;
    }
    commit(partial, opts.file);
    return { file: opts.file, width: opts.width + (opts.width % 2), height: opts.height + (opts.height % 2), fps, duration, frames, bytes: statSync(opts.file).size, ...(opts.aspect ? { aspect: opts.aspect } : {}), ...(audio ? { audio } : {}), blocked: [...new Set(blocked)], errors: [...new Set(errors)] };
  } finally {
    await context.close();
  }
}

export async function renderVideo(args) {
  const t0 = Date.now();
  // aspects sets each format's size: a width or height beside it would be silently ignored
  const sized = ['width', 'height'].filter((k) => args[k] !== undefined);
  if (sized.length && args.aspects && args.aspects.length) throw new Error(`${sized.join(' and ')} cannot be combined with aspects, which sets each format's size (16:9 1920x1080, 9:16 1080x1920, 1:1 1080x1080, 4:5 1080x1350): drop one`);
  const ffmpeg = requireBinary('ffmpeg');
  let audio = args.audio;
  if (audio !== undefined && audio !== 'page') {
    // Renders are offline: ffmpeg would happily fetch a URL, so only local files are accepted (by absolute path).
    audio = resolve(String(args.audio));
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(args.audio) || !existsSync(audio) || !statSync(audio).isFile()) throw new Error(`audio must be a local file that exists (or "page"): ${args.audio}`);
  }
  const out = outputDir(args);
  mkdirSync(out, { recursive: true });
  const name = slugOf(args.name || 'video');
  // audio: "page" -> the page's own score (window.renderAudioWav(), a base64 WAV), rendered once,
  // mastered to -14 LUFS and reused for every aspect.
  let mastered = null;
  const pageAudio = async (page) => {
    if (mastered) return mastered;
    const b64 = await page.evaluate(async () => (typeof window.renderAudioWav === 'function' ? window.renderAudioWav() : null));
    if (!b64) throw new Error('audio is "page" but the page has no window.renderAudioWav()');
    const raw = writeBase64(partialPath(join(out, `${name}-score-raw.wav`)), b64);
    try { mastered = (await masterWav(raw, join(out, `${name}.wav`))).file; } finally { removeQuietly(raw); }
    return mastered;
  };
  const src = resolveSource(args, out, name);
  let browser = null;
  const results = [];
  try {
    browser = await openBrowser();
    // Default size: the composition's data-width/height, else 1920x1080.
    let base = { width: args.width, height: args.height };
    if ((!base.width || !base.height) && !(args.aspects && args.aspects.length)) {
      const { page, context } = await newPage(browser, { width: 1920, height: 1080, seed: args.seed ?? 1, colorScheme: args.theme || 'light', reducedMotion: args.reducedMotion });
      try {
        await page.goto(src.url, { waitUntil: 'load', timeout: 60000 });
        // a page may declare its size only once it is ready (TIMELINE set before __ready flips)
        await waitReady(page);
        const info = await compositionInfo(page);
        checkDeclared(info, ['width', 'height'].filter((k) => !base[k]));
        base = { width: base.width || info.width || 1920, height: base.height || info.height || 1080 };
      } finally { await context.close(); }
    }
    const targets = args.aspects && args.aspects.length
      ? args.aspects.map((a) => ({ tag: a.replace(':', 'x'), aspect: a, width: ASPECTS[a][0], height: ASPECTS[a][1] }))
      : [{ tag: '', ...base }];
    for (const tg of targets) {
      const file = join(out, `${name}${tg.tag ? `-${tg.tag}` : ''}.mp4`);
      results.push(await renderOne(browser, src, { ...args, ...tg, audio, file, ffmpeg, pageAudio, seed: args.seed ?? 1, crf: args.crf ?? 18, preset: args.preset || 'medium', theme: args.theme || 'light' }));
    }
  } finally {
    if (browser) await browser.close();
    releaseSource(src);
  }
  const warnings = [];
  for (const r of results) {
    if (r.blocked.length) warnings.push(`Blocked network requests (render is offline): ${r.blocked.slice(0, 5).join(', ')}`);
    if (r.errors.length) warnings.push(`Page errors: ${r.errors.slice(0, 5).join(' | ')}`);
    delete r.blocked; delete r.errors;
  }
  return { videos: results, ms: Date.now() - t0, ...(warnings.length ? { warnings: [...new Set(warnings)] } : {}) };
}

// count times evenly spaced over a duration, each in the middle of its slice
const spread = (duration, count) => Array.from({ length: count }, (_, i) => +((duration * i) / count + duration / (2 * count)).toFixed(3));

const VIDEO = new Set(['.mp4', '.mov', '.webm', '.mkv', '.m4v']);
const PAGE_ONLY = ['html', 'aspect', 'theme', 'seed', 'reducedMotion', 'width', 'height'];

// One frame of a video at t s, as PNG. Seeking past the last frame's start gives nothing, though that
// frame is still the picture at t: then the last second is decoded, each frame written over the one
// before, and the final frame stays.
async function grabFrame(ffmpeg, file, t, out) {
  const partial = partialPath(out);
  const grab = async (seek, frames = []) => {
    const r = await run(ffmpeg, ['-hide_banner', '-nostdin', '-v', 'error', '-xerror', ...seek, '-i', file, ...frames, '-an', '-sn', '-dn', '-c:v', 'png', '-f', 'image2', '-update', '1', '-y', partial], { timeout: 60000 });
    if (r.status !== 0) throw new Error(`ffmpeg could not take a frame at t = ${t} s from ${file}: ${r.stderr.trim().slice(-400)}`);
    return existsSync(partial) && statSync(partial).size > 0;
  };
  try {
    if (!(await grab(['-ss', String(t)], ['-frames:v', '1'])) && !(await grab(['-sseof', '-1']))) throw new Error(`no frame at t = ${t} s in ${file}`);
  } catch (err) {
    removeQuietly(partial);
    throw err;
  }
  return commit(partial, out);
}

async function videoFilmstrip(args, t0) {
  const page = PAGE_ONLY.filter((k) => args[k] !== undefined);
  if (page.length) throw new Error(`${page.length > 1 ? `${page.slice(0, -1).join(', ')} and ${page.at(-1)} are` : `${page[0]} is`} for a page, not a video: filmstrip on a video file takes times or count (with duration, columns, cellWidth, title, name, slug, outDir)`);
  // ffmpeg would fetch a URL as happily as a file: local files only, as everywhere in the engine
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(String(args.file))) throw new Error(`filmstrip takes a local video file, not a URL: download it into the job folder first (${args.file})`);
  const file = resolve(String(args.file));
  if (!existsSync(file) || !statSync(file).isFile()) throw new Error(`File not found: ${file}`);
  const ffmpeg = requireBinary('ffmpeg');
  const info = await mediaInfo(file);
  if (!info.video) throw new Error(`${file} has no video stream (sound only, or just cover art): there is no picture to look at`);
  if (!(info.duration > 0)) throw new Error(`could not read the length of ${file}`);
  const length = +info.duration.toFixed(3);
  if (args.duration !== undefined && args.duration > length) throw new Error(`duration ${args.duration} s is longer than the video (${length} s): leave it out to spread the frames over the whole video`);
  const times = args.times && args.times.length ? args.times : spread(args.duration || length, args.count || 8);
  for (const t of times) if (t >= length) throw new Error(`t = ${t} s is past the end of the video (${length} s): give times below its length`);
  const out = outputDir(args);
  const framesDir = join(out, 'filmstrip-frames');
  mkdirSync(framesDir, { recursive: true });
  const name = slugOf(args.name || 'filmstrip');
  const cells = [];
  for (const [i, t] of times.entries()) {
    const frame = await grabFrame(ffmpeg, file, t, join(framesDir, `${name}-${String(i).padStart(2, '0')}.png`));
    cells.push({ file: frame, label: `t = ${t.toFixed(2)} s`, ...pngSize(frame), background: 'light' });
  }
  const browser = await openBrowser();
  try {
    const sheet = await composeSheet(browser, { cells, out: join(out, `${name}.png`), columns: args.columns || Math.min(cells.length, 4), title: args.title, maxCell: args.cellWidth || 360 });
    return { filmstrip: sheet.file, frames: cells.map((c) => ({ file: c.file, label: c.label })), video: { file, duration: length, width: cells[0].width, height: cells[0].height }, ms: Date.now() - t0 };
  } finally {
    await browser.close();
  }
}

export async function filmstrip(args) {
  const t0 = Date.now();
  if (args.file && VIDEO.has(extname(String(args.file)).toLowerCase())) return videoFilmstrip(args, t0);
  const out = outputDir(args);
  const framesDir = join(out, 'filmstrip-frames');
  mkdirSync(framesDir, { recursive: true });
  const name = slugOf(args.name || 'filmstrip');
  const src = resolveSource(args, out, name);
  let browser = null;
  try {
    browser = await openBrowser();
    const [aw, ah] = args.aspect ? ASPECTS[args.aspect] : [];
    const { page, context } = await newPage(browser, { width: args.width || aw || 1920, height: args.height || ah || 1080, seed: args.seed ?? 1, colorScheme: args.theme || 'light', aspect: args.aspect || null, reducedMotion: args.reducedMotion });
    let cells = [];
    try {
      await page.goto(src.url, { waitUntil: 'load', timeout: 60000 });
      await waitReady(page);
      const info = await compositionInfo(page);
      if ((!args.width || !args.height) && !args.aspect && info.width && info.height) {
        checkDeclared(info, ['width', 'height'].filter((k) => !args[k]));
        await page.setViewportSize({ width: args.width || info.width, height: args.height || info.height });
      }
      const duration = args.duration || info.duration;
      let times = args.times;
      if (!times || !times.length) {
        if (!args.duration) checkDeclared(info, ['duration']);
        if (!duration) throw new Error('Give times (seconds) or a duration (or data-duration on the composition root; CSS animations are measured when there is neither).');
        times = spread(duration, args.count || 8);
      }
      const vp = page.viewportSize();
      for (const [i, t] of times.entries()) {
        await page.evaluate((tt) => window.__easelSeek(tt), t);
        const file = writeOutput(join(framesDir, `${name}-${String(i).padStart(2, '0')}.png`), await page.screenshot({ animations: 'allow' }));
        cells.push({ file, label: `t = ${t.toFixed(2)} s`, width: vp.width, height: vp.height, background: 'light' });
      }
    } finally {
      await context.close();
    }
    const sheet = await composeSheet(browser, { cells, out: join(out, `${name}.png`), columns: args.columns || Math.min(cells.length, 4), title: args.title, maxCell: args.cellWidth || 360 });
    return { filmstrip: sheet.file, frames: cells.map((c) => ({ file: c.file, label: c.label })), ms: Date.now() - t0 };
  } finally {
    if (browser) await browser.close();
    releaseSource(src);
  }
}
