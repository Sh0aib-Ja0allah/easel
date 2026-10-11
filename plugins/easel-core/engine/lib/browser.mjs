// Browser sessions for rendering. Every page is offline: file:, data: and blob: load normally,
// https://easel.local/... is served from the plugin (fonts) and the data dir (libraries), known
// CDN URLs for GSAP are mapped to the local copy, and every other network request is blocked.
// An init script makes Math.random and crypto random values seeded and Date/performance clocks follow
// the render time; every context runs in UTC with the en-US locale, whatever the machine's settings.
import { existsSync, readFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { loadPlaywright, findPackage } from './deps.mjs';
import { PLUGIN_DIR } from './paths.mjs';

export const FONTS_DIR = join(PLUGIN_DIR, 'fonts');
const LOCAL_ORIGIN = 'https://easel.local';
const MIME = { '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

// Libraries doctor installs into the data dir, addressable as https://easel.local/lib/<file>.
const LIBRARIES = { 'gsap.min.js': ['gsap', 'dist/gsap.min.js'], 'gsap.js': ['gsap', 'dist/gsap.js'], 'p5.min.js': ['p5', 'lib/p5.min.js'], 'p5.js': ['p5', 'lib/p5.js'] };
const CDN_PATTERNS = [
  /^https:\/\/cdn\.jsdelivr\.net\/npm\/gsap@[^/]+\/dist\/([\w.-]+\.js)$/,
  /^https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/gsap\/[^/]+\/([\w.-]+\.js)$/,
  /^https:\/\/unpkg\.com\/gsap@[^/]+\/dist\/([\w.-]+\.js)$/,
];
// p5.js (easel-illustrate:generative-art): served from the copy doctor installed (1.11.13) for any
// p5 1.x the page names; a 2.x or "latest" URL is refused (p5 2 changed its API), as is p5.sound.
// Groups: version, file (bare jsdelivr/unpkg URLs mean p5.min.js).
const P5_PATTERNS = [
  /^https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/p5\.js\/([^/]+)\/(p5(?:\.min)?\.js)$/,
  /^https:\/\/cdn\.jsdelivr\.net\/npm\/p5@([^/]+)\/lib\/(p5(?:\.min)?\.js)$/,
  /^https:\/\/unpkg\.com\/p5@([^/]+)\/lib\/(p5(?:\.min)?\.js)$/,
  /^https:\/\/(?:cdn\.jsdelivr\.net\/npm|unpkg\.com)\/p5(?:@([^/]+))?\/?()$/,
];
export function p5Request(url) {
  const u = url.split(/[?#]/)[0];
  for (const re of P5_PATTERNS) {
    const m = u.match(re);
    if (!m) continue;
    const version = m[1] || 'latest';
    if (!/^1(\.|$)/.test(version)) return { error: `p5.js ${version} requested: Easel serves p5.js 1.x offline (1.11.13). Load https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.13/p5.min.js and use the 1.x API.` };
    return { lib: m[2] || 'p5.min.js' };
  }
  if (/\/p5(?:@[^/]+)?\/lib\/addons\/|\/p5\.js\/[^/]+\/addons\//.test(u)) return { error: 'p5.js add-ons (p5.sound) are not available offline; Easel sketches draw only.' };
  return null;
}

function libraryPath(file) {
  if (Object.hasOwn(LIBRARIES, file)) {
    const [pkg, rel] = LIBRARIES[file];
    const found = findPackage(pkg);
    if (found) { const p = join(found.dir, ...rel.split('/')); if (existsSync(p)) return p; }
  }
  const gsap = findPackage('gsap'); // any other GSAP dist file, e.g. ScrollTrigger.min.js
  if (gsap && /^[\w.-]+\.js$/.test(file)) { const p = join(gsap.dir, 'dist', file); if (existsSync(p)) return p; }
  return null;
}

function fontPath(rel) {
  if (!/^[\w./-]+$/.test(rel) || rel.includes('..')) return null;
  const p = join(FONTS_DIR, ...rel.split('/'));
  return existsSync(p) ? p : null;
}

export function fontFaceCss() {
  const manifest = join(FONTS_DIR, 'fonts.json');
  if (!existsSync(manifest)) return '';
  const { faces } = JSON.parse(readFileSync(manifest, 'utf8'));
  return faces.map((f) => `@font-face{font-family:'${f.family}';src:url('${LOCAL_ORIGIN}/fonts/${f.file}') format('woff2');font-weight:${f.weight};font-style:${f.style || 'normal'};font-display:block;}`).join('\n');
}

const INIT_SCRIPT = ({ seed, css, aspect }) => {
  // Runs in the page before any of its scripts.
  let s = seed >>> 0 || 1;
  Math.random = function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // crypto.getRandomValues and crypto.randomUUID follow the seed as well, from a stream of their own
  // (Math.random gives the same numbers as before). The real call runs first, so bad arguments throw
  // exactly as they would; its random bytes are then overwritten.
  let cs = (Math.imul(seed >>> 0 || 1, 0x9e3779b1) ^ 0x85ebca6b) >>> 0 || 1;
  const next32 = () => {
    cs = (cs + 0x6d2b79f5) | 0;
    let t = Math.imul(cs ^ (cs >>> 15), 1 | cs);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  };
  if (window.crypto && typeof crypto.getRandomValues === 'function') {
    const real = crypto.getRandomValues.bind(crypto);
    const getRandomValues = (arr) => {
      real(arr);
      const b = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
      for (let i = 0; i < b.length; i += 4) { const v = next32(); for (let k = 0; k < 4 && i + k < b.length; k++) b[i + k] = (v >>> (8 * k)) & 255; }
      return arr;
    };
    crypto.getRandomValues = getRandomValues;
    if (typeof crypto.randomUUID === 'function') {
      crypto.randomUUID = () => {
        const b = getRandomValues(new Uint8Array(16));
        b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;   // version 4, RFC 4122 variant
        const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
        return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
      };
    }
  }
  const EPOCH = Date.UTC(2026, 0, 1);
  // aspect: the format being rendered ('16:9', '9:16', '1:1', '4:5'), for pages that lay themselves
  // out per format (the animate kit reads it); null when the caller did not ask for one.
  window.__easel = { t: 0, seed, aspect: aspect || null };
  const RealDate = Date;
  const now = () => EPOCH + Math.round(window.__easel.t * 1000);
  // Date() as a function returns a string; new Date() with no arguments is the render time.
  function EaselDate(...a) {
    if (!new.target) return new RealDate(now()).toString();
    return a.length ? new RealDate(...a) : new RealDate(now());
  }
  EaselDate.prototype = RealDate.prototype;
  EaselDate.now = now;
  EaselDate.UTC = RealDate.UTC;
  EaselDate.parse = RealDate.parse;
  window.Date = EaselDate;
  performance.now = () => window.__easel.t * 1000;
  if (css) {
    const add = () => { const st = document.createElement('style'); st.setAttribute('data-easel', 'fonts'); st.textContent = css; (document.head || document.documentElement).prepend(st); };
    if (document.documentElement) add(); else document.addEventListener('DOMContentLoaded', add, { once: true });
  }
  // Seek the page to time t (seconds): renderAt(t), else renderFrame(t) (the animate kit's canvas
  // contract), else every registered GSAP timeline; then every CSS animation/transition through the
  // Web Animations API.
  window.__easelSeek = (t) => {
    window.__easel.t = t;
    if (typeof window.renderAt === 'function') window.renderAt(t);
    else if (typeof window.renderFrame === 'function') window.renderFrame(t);
    else if (window.__timelines) for (const tl of Object.values(window.__timelines)) { if (tl && typeof tl.seek === 'function') tl.seek(t, false); }
    const anims = document.getAnimations();
    for (const a of anims) { a.pause(); a.currentTime = t * 1000; }
    // Let the caller wait for a face first used at this time, and for the paused animation state to
    // be committed to a frame (two rAFs; 100 ms fallback so nothing can hang).
    const waits = [];
    if (document.fonts.status !== 'loaded') waits.push(document.fonts.ready);
    if (anims.length) waits.push(Promise.race([new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))), new Promise((r) => setTimeout(r, 100))]));
    return waits.length ? Promise.all(waits).then(() => null) : null;
  };
};

export async function openBrowser() {
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({
    args: [
      '--font-render-hinting=none', '--disable-lcd-text', '--force-color-profile=srgb',
      // Run CSS animations on the main thread, where __easelSeek pauses them; the compositor thread
      // otherwise showed a frame of motion before the pause landed (seen on macOS).
      '--disable-threaded-animation', '--disable-threaded-scrolling',
      // Offline by construction: no name resolves, nothing prefetches, WebRTC cannot go direct.
      '--host-resolver-rules=MAP * ~NOTFOUND', '--dns-prefetch-disable', '--no-pings',
      '--disable-background-networking', '--disable-component-update',
      '--force-webrtc-ip-handling-policy=disable_non_proxied_udp',
    ],
    // Anything that slips past the request router goes to a closed local port.
    proxy: { server: 'http://127.0.0.1:9' },
  });
  return browser;
}

export const ASPECTS = { '16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080], '4:5': [1080, 1350] };

export async function newPage(browser, { width, height, scale = 1, colorScheme = 'light', seed = 1, transparent = false, fonts = true, allowNetwork = false, aspect = null, reducedMotion = 'no-preference' } = {}) {
  // reducedMotion 'reduce' renders the page's prefers-reduced-motion path (render_still, filmstrip, render_video, qa)
  // UTC and en-US: dates, number formats and Intl output must not depend on the machine rendering them.
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, colorScheme, reducedMotion: reducedMotion === 'reduce' ? 'reduce' : 'no-preference', timezoneId: 'UTC', locale: 'en-US' });
  const blocked = [];
  await context.route('**/*', async (route) => {
    const url = route.request().url();
    if (/^(file|data|blob|about):/.test(url)) return route.continue();
    if (url.startsWith(`${LOCAL_ORIGIN}/fonts/`)) {
      const p = fontPath(decodeURIComponent(url.slice(`${LOCAL_ORIGIN}/fonts/`.length).split('?')[0]));
      return p ? route.fulfill({ path: p, contentType: MIME[extname(p)] || 'application/octet-stream', headers: { 'access-control-allow-origin': '*' } }) : route.fulfill({ status: 404, body: 'font not found' });
    }
    let lib = url.startsWith(`${LOCAL_ORIGIN}/lib/`) ? basename(url.split('?')[0]) : null;
    if (!lib) {
      const p5 = p5Request(url);
      if (p5 && p5.error) { blocked.push(url); return route.fulfill({ status: 404, contentType: 'text/plain', body: p5.error }); }
      if (p5) lib = p5.lib;
    }
    if (!lib) { const bare = url.split(/[?#]/)[0]; for (const re of CDN_PATTERNS) { const m = bare.match(re); if (m) { lib = m[1]; break; } } }
    if (lib) {
      const p = libraryPath(lib);
      return p ? route.fulfill({ path: p, contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' } }) : route.fulfill({ status: 404, body: `library ${lib} not installed; run doctor with install: true` });
    }
    if (allowNetwork) return route.continue();
    blocked.push(url);
    return route.abort('blockedbyclient');
  });
  if (typeof context.routeWebSocket === 'function') await context.routeWebSocket(/.*/, (ws) => { blocked.push(ws.url()); ws.close(); });
  await context.addInitScript(INIT_SCRIPT, { seed, css: fonts ? fontFaceCss() : '', aspect });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message || e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  if (transparent) await page.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { document.documentElement.style.background = 'transparent'; }); });
  return { page, context, blocked, errors };
}

// Wait until the page says it is ready (window.__ready, if the page uses it; window.ASSETS_READY,
// the animate kit's promise for embedded images), fonts are loaded and images are decoded. Every wait
// is bounded by timeoutMs, so a page that never gets ready fails with a message instead of hanging.
export async function waitReady(page, timeoutMs = 30000) {
  await page.waitForLoadState('load');
  // __ready is used when an inline script names it or any script (inline or external) has set it by
  // load (typically to false, flipped to true later); a page that never mentions it is not slowed down.
  const usesReady = await page.evaluate(() => window.__ready !== undefined || [...document.scripts].some((s) => s.textContent.includes('__ready')));
  if (usesReady) {
    try {
      await page.waitForFunction(() => !!window.__ready, null, { timeout: timeoutMs });
    } catch (err) {
      if (/timeout/i.test(String(err && err.message))) throw new Error(`the page set window.__ready but it did not become true within ${timeoutMs / 1000} s`);
      throw err;
    }
  }
  if (await page.evaluate(() => !!window.ASSETS_READY)) {
    const settled = await page.evaluate((ms) => Promise.race([Promise.resolve(window.ASSETS_READY).then(() => true), new Promise((r) => setTimeout(() => r(false), ms))]), timeoutMs);
    if (!settled) throw new Error(`window.ASSETS_READY did not settle within ${timeoutMs / 1000} s: an embedded image or font never loaded (renders are offline; check the asset paths)`);
    await page.waitForFunction(() => typeof window.renderFrame === 'function' || typeof window.renderAt === 'function', null, { timeout: timeoutMs });
  }
  await page.evaluate(async () => {
    // Load every declared face now (bundled and page fonts), not lazily on first use mid-render.
    await Promise.all([...document.fonts].filter((f) => f.status === 'unloaded').map((f) => f.load().catch(() => null)));
    await document.fonts.ready;
    await Promise.all([...document.images].map((img) => (img.complete ? null : img.decode().catch(() => null))));
  });
}
