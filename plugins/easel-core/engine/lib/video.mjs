// render_video: seek a page frame by frame (t = n / fps) and pipe PNG frames into ffmpeg.
// filmstrip: a few frames at chosen times on one sheet, so a vision model can review motion.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ASPECTS, newPage, openBrowser, waitReady } from './browser.mjs';
import { masterWav, writeBase64 } from './audio.mjs';
import { requireBinary } from './binaries.mjs';
import { outputDir } from './render.mjs';
import { resolveSource } from './source.mjs';
import { composeSheet } from './sheet.mjs';

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
    return {};
  });
}

function encoder(ffmpeg, { fps, file, crf, audio, duration, preset }) {
  const args = ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', 'pipe:0'];
  if (audio) args.push('-i', audio);
  // yuv420p needs even dimensions: pad by one pixel instead of letting x264 crop silently.
  args.push('-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', '-c:v', 'libx264', '-preset', preset, '-crf', String(crf), '-pix_fmt', 'yuv420p', '-movflags', '+faststart');
  if (audio) args.push('-c:a', 'aac', '-b:a', '192k', '-t', String(duration), '-map', '0:v:0', '-map', '1:a:0');
  args.push(file);
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
  return { write, end: async () => { proc.stdin.end(); await done; } };
}

async function renderOne(browser, src, opts) {
  const { page, context, blocked, errors } = await newPage(browser, { width: opts.width, height: opts.height, seed: opts.seed, colorScheme: opts.theme, aspect: opts.aspect || null, reducedMotion: opts.reducedMotion });
  try {
    await page.goto(src.url, { waitUntil: 'load', timeout: 60000 });
    await waitReady(page);
    const info = await compositionInfo(page);
    const fps = opts.fps || info.fps || 30;
    const duration = opts.duration || info.duration;
    if (!duration) throw new Error('No duration: pass duration (seconds) or set data-duration on the [data-composition-id] root.');
    const frames = Math.round(duration * fps);
    let audio = opts.audio;
    if (audio === 'page') audio = await opts.pageAudio(page);
    const enc = encoder(opts.ffmpeg, { fps, file: opts.file, crf: opts.crf, audio, duration, preset: opts.preset });
    try {
      for (let n = 0; n < frames; n++) {
        await page.evaluate((t) => window.__easelSeek(t), n / fps);
        await enc.write(await page.screenshot({ type: 'png', animations: 'allow' }));
      }
    } finally {
      await enc.end();
    }
    return { file: opts.file, width: opts.width + (opts.width % 2), height: opts.height + (opts.height % 2), fps, duration, frames, bytes: statSync(opts.file).size, ...(opts.aspect ? { aspect: opts.aspect } : {}), ...(audio ? { audio } : {}), blocked: [...new Set(blocked)], errors: [...new Set(errors)] };
  } finally {
    await context.close();
  }
}

export async function renderVideo(args) {
  const t0 = Date.now();
  const ffmpeg = requireBinary('ffmpeg');
  if (args.audio !== undefined && args.audio !== 'page') {
    // Renders are offline: ffmpeg would happily fetch a URL, so only local files are accepted.
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(args.audio) || !existsSync(args.audio)) throw new Error(`audio must be a local file that exists (or "page"): ${args.audio}`);
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
    const raw = writeBase64(join(out, `${name}-score-raw.wav`), b64);
    mastered = masterWav(raw, join(out, `${name}.wav`)).file;
    rmSync(raw, { force: true });
    return mastered;
  };
  const src = resolveSource(args, out, name);
  const browser = await openBrowser();
  const results = [];
  try {
    // Default size: the composition's data-width/height, else 1920x1080.
    let base = { width: args.width, height: args.height };
    if (!base.width || !base.height) {
      const { page, context } = await newPage(browser, { width: 1920, height: 1080 });
      try { await page.goto(src.url, { waitUntil: 'load' }); const info = await compositionInfo(page); base = { width: base.width || info.width || 1920, height: base.height || info.height || 1080 }; } finally { await context.close(); }
    }
    const targets = args.aspects && args.aspects.length
      ? args.aspects.map((a) => ({ tag: a.replace(':', 'x'), aspect: a, width: ASPECTS[a][0], height: ASPECTS[a][1] }))
      : [{ tag: '', ...base }];
    for (const tg of targets) {
      const file = join(out, `${name}${tg.tag ? `-${tg.tag}` : ''}.mp4`);
      results.push(await renderOne(browser, src, { ...args, ...tg, file, ffmpeg, pageAudio, seed: args.seed ?? 1, crf: args.crf ?? 18, preset: args.preset || 'medium', theme: args.theme || 'light' }));
    }
  } finally {
    await browser.close();
  }
  const warnings = [];
  for (const r of results) {
    if (r.blocked.length) warnings.push(`Blocked network requests (render is offline): ${r.blocked.slice(0, 5).join(', ')}`);
    if (r.errors.length) warnings.push(`Page errors: ${r.errors.slice(0, 5).join(' | ')}`);
    delete r.blocked; delete r.errors;
  }
  return { videos: results, ms: Date.now() - t0, ...(warnings.length ? { warnings: [...new Set(warnings)] } : {}) };
}

export async function filmstrip(args) {
  const t0 = Date.now();
  const out = outputDir(args);
  const framesDir = join(out, 'filmstrip-frames');
  mkdirSync(framesDir, { recursive: true });
  const name = slugOf(args.name || 'filmstrip');
  const src = resolveSource(args, out, name);
  const browser = await openBrowser();
  try {
    const [aw, ah] = args.aspect ? ASPECTS[args.aspect] : [];
    const { page, context } = await newPage(browser, { width: args.width || aw || 1920, height: args.height || ah || 1080, seed: args.seed ?? 1, colorScheme: args.theme || 'light', aspect: args.aspect || null, reducedMotion: args.reducedMotion });
    let cells = [];
    try {
      await page.goto(src.url, { waitUntil: 'load', timeout: 60000 });
      await waitReady(page);
      const info = await compositionInfo(page);
      if ((!args.width || !args.height) && !args.aspect && info.width && info.height) await page.setViewportSize({ width: args.width || info.width, height: args.height || info.height });
      const duration = args.duration || info.duration;
      let times = args.times;
      if (!times || !times.length) {
        if (!duration) throw new Error('Give times (seconds) or a duration (or data-duration on the composition root).');
        const count = args.count || 8;
        times = Array.from({ length: count }, (_, i) => +((duration * i) / count + duration / (2 * count)).toFixed(3));
      }
      const vp = page.viewportSize();
      for (const [i, t] of times.entries()) {
        await page.evaluate((tt) => window.__easelSeek(tt), t);
        const file = join(framesDir, `${name}-${String(i).padStart(2, '0')}.png`);
        await page.screenshot({ path: file, animations: 'allow' });
        cells.push({ file, label: `t = ${t.toFixed(2)} s`, width: vp.width, height: vp.height, background: 'light' });
      }
    } finally {
      await context.close();
    }
    const sheet = await composeSheet(browser, { cells, out: join(out, `${name}.png`), columns: args.columns || Math.min(cells.length, 4), title: args.title, maxCell: args.cellWidth || 360 });
    return { filmstrip: sheet.file, frames: cells.map((c) => ({ file: c.file, label: c.label })), ms: Date.now() - t0 };
  } finally {
    await browser.close();
  }
}
