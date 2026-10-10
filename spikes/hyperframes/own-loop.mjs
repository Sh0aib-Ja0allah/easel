#!/usr/bin/env node
// Spike T0.4 option B: our own capture loop (Playwright + ffmpeg).
// Usage: node own-loop.mjs <playwright-core dir> <composition dir> <out dir> [fps] [seconds]
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [pwDir, compDir, outDir, fpsArg, secArg] = process.argv.slice(2);
const fps = Number(fpsArg || 30), seconds = Number(secArg || 5);
const { chromium } = await import(pathToFileURL(join(resolve(pwDir), 'index.mjs')).href);
const framesDir = join(resolve(outDir), 'frames');
mkdirSync(framesDir, { recursive: true });
const t0 = Date.now();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(join(resolve(compDir), 'index.html')).href);
await page.waitForFunction(() => window.__ready === true);
await page.evaluate(() => document.fonts.ready);
const total = Math.round(fps * seconds);
for (let i = 0; i < total; i++) {
  const t = i / fps;
  await page.evaluate((t) => {
    if (typeof window.renderAt === 'function') window.renderAt(t);
    else for (const tl of Object.values(window.__timelines || {})) tl.seek(t, false);
    for (const a of document.getAnimations()) { a.pause(); a.currentTime = t * 1000; }
  }, t);
  writeFileSync(join(framesDir, `frame_${String(i).padStart(4, '0')}.png`), await page.screenshot({ type: 'png' }));
}
await browser.close();
const tCapture = Date.now() - t0;
const mp4 = join(resolve(outDir), 'out.mp4');
const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', join(framesDir, 'frame_%04d.png'),
  '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-threads', '1', mp4], { encoding: 'utf8' });
if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
console.log(JSON.stringify({ frames: total, captureMs: tCapture, totalMs: Date.now() - t0, mp4 }));
