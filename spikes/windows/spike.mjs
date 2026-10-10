#!/usr/bin/env node
// Spike T0.5: Windows toolchain. Simulates what `doctor` will do with ${CLAUDE_PLUGIN_DATA}.
// Usage: node spikes/windows/spike.mjs "<data dir, may contain spaces>" "<out dir>"
// Never writes outside those two folders and PLAYWRIGHT_BROWSERS_PATH.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { platform, tmpdir } from 'node:os';

const DATA = resolve(process.argv[2] || join(process.cwd(), 'spike data dir'));
const OUT = resolve(process.argv[3] || join(process.cwd(), 'spikes', 'windows', 'out'));
const PW_VERSION = '1.64.0';
const FONT_PKG = '@fontsource/inter@5.2.8';
const report = { platform: platform(), node: process.version, tmpdir: tmpdir(), data: DATA, out: OUT, steps: [] };
const win = platform() === 'win32';
const tmpProbe = win ? 'C:\\tmp' : '/tmp/easel-spike-probe';
function tmpSnapshot() {
  if (!existsSync(tmpProbe)) return null;
  return readdirSync(tmpProbe).map((n) => { try { return `${n}@${statSync(join(tmpProbe, n)).mtimeMs}`; } catch { return n; } }).sort().join('|');
}
const tmpBefore = tmpSnapshot();

function step(name, fn) {
  const t0 = Date.now();
  try {
    const detail = fn();
    report.steps.push({ name, ok: true, ms: Date.now() - t0, detail });
    return detail;
  } catch (err) {
    report.steps.push({ name, ok: false, ms: Date.now() - t0, error: String(err && err.message || err) });
    return undefined;
  }
}
async function astep(name, fn) {
  const t0 = Date.now();
  try {
    const detail = await fn();
    report.steps.push({ name, ok: true, ms: Date.now() - t0, detail });
    return detail;
  } catch (err) {
    report.steps.push({ name, ok: false, ms: Date.now() - t0, error: String(err && err.stack || err) });
    return undefined;
  }
}
function run(cmd, args, opts = {}) {
  // Node >= 20.12 refuses to spawn .cmd/.bat without a shell (CVE-2024-27980), so npm needs shell on Windows.
  const r = spawnSync(cmd, args, { encoding: 'utf8', shell: win && /^(npm|npx)$/.test(cmd), ...opts });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`${cmd} exited ${r.status}: ${(r.stderr || r.stdout || '').slice(-800)}`);
  return (r.stdout || '').trim();
}
const q = (s) => (win ? `"${s}"` : s);

function findFfmpeg(envPath) {
  const r = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8', env: { ...process.env, PATH: envPath ?? process.env.PATH } });
  if (r.error || r.status !== 0) {
    return {
      found: false,
      message: win
        ? 'ffmpeg was not found on PATH. Install it with: winget install --id Gyan.FFmpeg -e  (then open a new terminal)'
        : platform() === 'darwin' ? 'ffmpeg was not found on PATH. Install it with: brew install ffmpeg'
        : 'ffmpeg was not found on PATH. Install it with your package manager, e.g. sudo apt install ffmpeg',
    };
  }
  return { found: true, version: r.stdout.split('\n')[0].trim() };
}

mkdirSync(DATA, { recursive: true });
mkdirSync(OUT, { recursive: true });

step('npm install into data dir (path with spaces)', () => {
  writeFileSync(join(DATA, 'package.json'), JSON.stringify({ name: 'easel-spike-data', private: true }, null, 2));
  run('npm', ['install', '--prefix', q(DATA), '--no-audit', '--no-fund', '--save-exact', `playwright-core@${PW_VERSION}`, FONT_PKG]);
  return readdirSync(join(DATA, 'node_modules')).filter((n) => !n.startsWith('.'));
});

step('install Chromium into PLAYWRIGHT_BROWSERS_PATH', () => {
  const cli = join(DATA, 'node_modules', 'playwright-core', 'cli.js');
  const outp = run(process.execPath, [cli, 'install', 'chromium'], { env: process.env });
  return { browsersPath: process.env.PLAYWRIGHT_BROWSERS_PATH, entries: readdirSync(process.env.PLAYWRIGHT_BROWSERS_PATH || '.'), tail: outp.slice(-300) };
});

const ffmpeg = step('ffmpeg detection (real PATH)', () => findFfmpeg());
step('ffmpeg missing message (PATH emptied)', () => findFfmpeg(''));

let pw;
await astep('import playwright-core from the data dir', async () => {
  pw = await import(pathToFileURL(join(DATA, 'node_modules', 'playwright-core', 'index.mjs')).href);
  return Object.keys(pw).slice(0, 5);
});

// Deep folder with spaces, total path well over 260 characters.
let deep = join(OUT, 'path with spaces');
while (deep.length < 300) deep = join(deep, 'a fairly long folder name with spaces');
mkdirSync(deep, { recursive: true });
report.deepPathLength = deep.length;

await astep('render with bundled OFL font (headless Chromium)', async () => {
  const fontSrc = join(DATA, 'node_modules', '@fontsource', 'inter', 'files', 'inter-latin-700-normal.woff2');
  const fontDir = join(OUT, 'font dir');
  mkdirSync(fontDir, { recursive: true });
  copyFileSync(fontSrc, join(fontDir, 'Inter-Bold.woff2'));
  const html = `<!doctype html><html><head><style>
    @font-face { font-family: 'Easel Test'; src: url('Inter-Bold.woff2') format('woff2'); font-weight: 700; }
    body { margin: 0; background: #f4efe6; }
    #a, #b { display: inline-block; } #a { font: 700 64px 'Easel Test', monospace; } #b { font: 700 64px monospace; }
  </style></head><body><div id="a">Easel 0123 Wg</div><br><div id="b">Easel 0123 Wg</div></body></html>`;
  writeFileSync(join(fontDir, 'font test.html'), html);
  const browser = await pw.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 800, height: 220 } });
  await page.goto(pathToFileURL(join(fontDir, 'font test.html')).href);
  await page.evaluate(() => document.fonts.ready);
  const res = await page.evaluate(() => ({
    loaded: document.fonts.check("700 64px 'Easel Test'"),
    faces: [...document.fonts].map((f) => `${f.family}:${f.status}`),
    widthFont: document.getElementById('a').getBoundingClientRect().width,
    widthFallback: document.getElementById('b').getBoundingClientRect().width,
  }));
  await page.screenshot({ path: join(fontDir, 'font test.png') });
  await browser.close();
  if (!res.loaded || res.widthFont === res.widthFallback) throw new Error('font not applied: ' + JSON.stringify(res));
  return res;
});

await astep('frames into a >260-char path with spaces, then ffmpeg encode there', async () => {
  const browser = await pw.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 320, height: 180 } });
  await page.setContent(`<canvas id=c width=320 height=180></canvas><script>
    window.renderAt = (t) => { const g = document.getElementById('c').getContext('2d');
      g.fillStyle = '#1d3557'; g.fillRect(0, 0, 320, 180); g.fillStyle = '#e9c46a';
      g.beginPath(); g.arc(40 + t * 240, 90, 30, 0, Math.PI * 2); g.fill(); };
    window.__ready = true;</script>`);
  const frames = 30;
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.renderAt(t), i / (frames - 1));
    await page.screenshot({ path: join(deep, `frame_${String(i).padStart(4, '0')}.png`) });
  }
  await browser.close();
  if (!ffmpeg || !ffmpeg.found) throw new Error('ffmpeg not found, skipped encode');
  const mp4 = join(deep, 'clip with spaces.mp4');
  run('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '30', '-i', join(deep, 'frame_%04d.png'), '-pix_fmt', 'yuv420p', '-c:v', 'libx264', mp4]);
  return { frames, mp4Bytes: statSync(mp4).size, pathLength: mp4.length };
});

const tmpAfter = tmpSnapshot();
report.tmp = { probe: tmpProbe, existedBefore: tmpBefore !== null, unchanged: tmpBefore === tmpAfter };
report.ok = report.steps.every((s) => s.ok) && report.tmp.unchanged;
writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
