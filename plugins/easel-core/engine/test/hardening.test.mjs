// Regression tests for the v1.0.0 engine QA review: qa measurement and gates, inline pages, page
// readiness, partial videos, page-declared limits, determinism, file names. Each one failed before its fix.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { doctorReport } from '../lib/doctor.mjs';
import { validateArgs } from '../lib/validate.mjs';
import { tools } from '../tools.mjs';

const ok = (n) => doctorReport().checks.find((c) => c.name === n)?.ok;
const page = ['playwright-core', 'chromium'].every(ok) ? false : 'needs Chromium (doctor --install)';
const media = ok('ffmpeg') ? false : 'needs ffmpeg';
const pageAndMedia = page || media;
const fx = (f) => fileURLToPath(new URL(`./fixtures/${f}`, import.meta.url));
const CLI = fileURLToPath(new URL('../cli.mjs', import.meta.url));
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
let out, m;
const ff = (args) => { const r = spawnSync('ffmpeg', ['-y', '-v', 'error', ...args], { encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); };
const dir = (name) => { const d = join(out, name); mkdirSync(d, { recursive: true }); return d; };
const check = (r, n) => r.checks.find((c) => c.name === n);
const doc = (css, body) => `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font:16px Inter,sans-serif;color:#111;background:#fff}${css}</style></head><body>${body}</body></html>`;
before(async () => {
  out = mkdtempSync(join(tmpdir(), 'easel-hard-'));
  m = { ...(await import('../lib/qa.mjs')), ...(await import('../lib/render.mjs')), ...(await import('../lib/contact.mjs')), ...(await import('../lib/image.mjs')), ...(await import('../lib/browser.mjs')), ...(await import('../lib/video.mjs')) };
});
after(() => rmSync(out, { recursive: true, force: true }));

// ---------- qa: what is measured ----------
test('contrast measures an element by its own text: a card holding a dark badge is not scored against the badge', { skip: page }, async () => {
  const html = doc('.card{margin:40px;padding:16px;background:#fff;width:400px;font-size:20px}.badge{display:inline-block;background:#111;color:#fff;padding:20px 30px}', '<div class="card">Project title <span class="badge">NEW</span></div>');
  const r = await m.qa({ html, width: 640, height: 360, mode: 'ui', checks: ['contrast'], outDir: dir('card') });
  assert.equal(r.pass, true, JSON.stringify(check(r, 'contrast').findings));
  assert.ok(check(r, 'contrast').value > 15, `min ratio ${check(r, 'contrast').value}`);
});

test('text_clipping and contrast skip visually hidden text and skip links; off-screen text that never shows still fails', { skip: page }, async () => {
  const a11y = doc('.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0}.vh{position:absolute;clip-path:inset(50%);white-space:nowrap}.skip{position:absolute;left:-9999px;top:0}.skip:focus{left:8px}.skip2{position:absolute;top:0;left:8px;transform:translateY(-120%);transition:transform .3s}.skip2:focus-visible{transform:none}',
    '<a class="skip" href="#main">Skip to content</a><a class="skip2" href="#main">Skip again</a><main id="main"><h1>Dashboard</h1><button><svg width="16" height="16" aria-hidden="true"><rect width="16" height="16"/></svg><span class="sr-only">Close dialog</span></button><span class="vh">Clipped label</span></main>');
  const r = await m.qa({ html: a11y, width: 640, height: 360, mode: 'ui', outDir: dir('a11y') });
  assert.equal(r.pass, true, JSON.stringify(r.checks));
  const lost = doc('.lost{position:absolute;left:-9999px;top:0}.off{position:absolute;left:-200px;top:40px;white-space:nowrap}', '<a class="lost" href="#x">Lost link</a><p class="off">Headline off the left edge</p>');
  const b = await m.qa({ html: lost, width: 640, height: 360, checks: ['text_clipping'], outDir: dir('a11y') });
  const els = check(b, 'text_clipping').findings.map((f) => f.element).join(' | ');
  assert.match(els, /Lost link/);
  assert.match(els, /Headline off the left edge/);
});

test('contrast reads modern CSS colours (oklch, color-mix) instead of assuming black; a gradient SVG fill is unmeasured', { skip: page }, async () => {
  const html = doc('body{padding:20px}.faint{color:oklch(0.85 0 0)}.dark{background:#111;color:oklch(0.97 0 0);padding:8px}.mix{color:color-mix(in srgb, #ccc 90%, white)}',
    '<p class="faint">Faint oklch caption</p><p class="dark">Light oklch text on dark</p><p class="mix">Faint color-mix text</p><svg width="300" height="40"><defs><linearGradient id="g"><stop offset="0" stop-color="#d1603d"/><stop offset="1" stop-color="#335c67"/></linearGradient></defs><text x="0" y="30" font-size="24" fill="url(#g)">Gradient SVG label</text></svg>');
  const r = await m.qa({ html, width: 640, height: 360, mode: 'ui', checks: ['contrast'], outDir: dir('oklch') });
  const c = check(r, 'contrast');
  const failed = c.findings.map((f) => f.element).join(' | ');
  assert.match(failed, /Faint oklch caption/);
  assert.match(failed, /Faint color-mix text/);
  assert.doesNotMatch(failed, /Light oklch text on dark/, 'near-white on near-black passes');
  const faint = c.findings.find((f) => /Faint oklch/.test(f.element));
  assert.ok(faint.fg.every((v) => Math.abs(v - 206) <= 1), `oklch(0.85 0 0) is about rgb(206, 206, 206), got ${faint.fg}`);
  assert.match(JSON.stringify(c.unmeasured || []), /Gradient SVG label.*gradient or pattern fill/);
});

// ---------- qa: gates ----------
test('qa: a named check that cannot run fails (loudness on a video with no audio track, a page check without a page)', { skip: media }, async () => {
  const v = join(dir('gates'), 'noaudio.mp4');
  ff(['-f', 'lavfi', '-i', 'testsrc2=s=160x90:d=2:r=10', '-pix_fmt', 'yuv420p', v]);
  const a = await m.qa({ video: v, checks: ['loudness'] });
  assert.equal(a.pass, false);
  assert.deepEqual(a.hardFailures, ['loudness']);
  assert.match(check(a, 'loudness').findings[0].fix, /no audio track/);
  const b = await m.qa({ video: v, checks: ['stillness', 'contrast'] });
  assert.equal(b.pass, false);
  assert.deepEqual(b.hardFailures, ['contrast']);
  assert.match(check(b, 'contrast').findings[0].fix, /needs a page/);
  // not named: a video without audio is simply not checked for loudness
  const c = await m.qa({ video: v });
  assert.deepEqual(c.checks.map((x) => x.name).sort(), ['colour_cast', 'stillness']);
});

test('qa: thresholds cannot loosen the media gates past -18..-10 LUFS and 5 s still; the schema says so', { skip: media }, async () => {
  const quiet = join(dir('gates'), 'quiet.wav');
  ff(['-f', 'lavfi', '-i', 'sine=frequency=440:duration=4', '-af', 'volume=-30dB', quiet]);
  const r = await m.qa({ audio: quiet, lufsMin: -60, lufsMax: 0 });
  assert.equal(r.pass, false);
  assert.equal(check(r, 'loudness').threshold, '-18 to -10 LUFS integrated');
  const still = join(dir('gates'), 'still.mp4');
  ff(['-f', 'lavfi', '-i', 'color=c=0x336699:s=160x90:d=7:r=10', '-pix_fmt', 'yuv420p', still]);
  const s = await m.qa({ video: still, stillSeconds: 30, checks: ['stillness'] });
  assert.equal(s.pass, false);
  assert.match(check(s, 'stillness').threshold, /longer than 5 s/);
  const schema = tools.qa.inputSchema;
  assert.match(validateArgs(schema, { audio: 'a.wav', lufsMin: -60 }).join(), /lufsMin must be >= -18/);
  assert.match(validateArgs(schema, { audio: 'a.wav', lufsMax: -2 }).join(), /lufsMax must be <= -10/);
  assert.match(validateArgs(schema, { video: 'a.mp4', stillSeconds: 30 }).join(), /stillSeconds must be <= 5/);
  assert.deepEqual(validateArgs(schema, { audio: 'a.wav', lufsMin: -16, lufsMax: -12, stillSeconds: 2 }), []);
});

test('qa: video, audio and image must be local files (ffmpeg would fetch a URL)', async () => {
  for (const k of ['video', 'audio', 'image']) {
    await assert.rejects(m.qa({ [k]: 'http://127.0.0.1:9/x.mp4' }), new RegExp(`${k} must be a local file`));
    await assert.rejects(m.qa({ [k]: 'concat:a.mp4|b.mp4' }), new RegExp(`${k} must be a local file`));
  }
});

// ---------- inline pages ----------
test('inline html: concurrent qa calls each check their own page, and nothing is left in the job folder', { skip: page }, async () => {
  const d = dir('race');
  const bad = (k) => `<!doctype html><body style="margin:0;background:#fff;font:16px Inter"><p style="color:#bbb">FAINT ${k}</p></body>`;
  const good = (k) => `<!doctype html><body style="margin:0;background:#fff;font:16px Inter"><p style="color:#111">DARK ${k}</p></body>`;
  const calls = [];
  for (let k = 0; k < 3; k++) for (const [kind, html] of [['bad', bad(k)], ['good', good(k)]]) calls.push(m.qa({ html, mode: 'ui', checks: ['contrast'], width: 300, height: 100, outDir: d }).then((r) => ({ kind, k, r })));
  for (const { kind, k, r } of await Promise.all(calls)) {
    if (kind === 'bad') { assert.equal(r.pass, false); assert.match(check(r, 'contrast').findings[0].element, new RegExp(`FAINT ${k}`)); }
    else assert.equal(r.pass, true, `good ${k}: ${JSON.stringify(check(r, 'contrast').findings)}`);
  }
  assert.deepEqual(readdirSync(d), []);
});

test('inline html never overwrites the user\'s own <name>.html in the job folder', { skip: page }, async () => {
  const d = dir('clobber');
  const mine = { 'qa-page.html': '<p>my qa page</p>', 'qa-canvas.html': '<p>my canvas page</p>', 'still.html': '<p>my still page</p>', 'video.html': '<p>my video</p>' };
  for (const [f, t] of Object.entries(mine)) writeFileSync(join(d, f), t);
  await m.qa({ html: '<p>checked</p>', outDir: d });
  await m.renderStill({ html: '<p>rendered</p>', outDir: d, width: 64, height: 32 });
  for (const [f, t] of Object.entries(mine)) assert.equal(readFileSync(join(d, f), 'utf8'), t, f);
  assert.deepEqual(readdirSync(d).filter((f) => f.startsWith('.easel-')), []);
});

test('a size name is slugged: it cannot write outside the job folder', { skip: page }, async () => {
  const d = dir('trav/job');
  const r = await m.renderStill({ html: '<p>x</p>', outDir: d, sizes: [{ width: 20, height: 20, name: '../../../escaped' }, { width: 24, height: 24, name: 'Story 9:16' }] });
  for (const f of r.files) assert.ok(f.file.startsWith(d + sep) && existsSync(f.file), f.file);
  assert.deepEqual(r.files.map((f) => f.file.slice(d.length + 1)), ['still-escaped.png', 'still-story-9-16.png']);
});

test('the image wrapper is removed when the browser cannot start', () => {
  const d = dir('leak');
  writeFileSync(join(d, 'logo.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>');
  const env = { ...process.env, PLAYWRIGHT_BROWSERS_PATH: dir('no-browsers') };
  for (const tool of ['render_still', 'qa']) {
    const r = spawnSync(process.execPath, [CLI, tool, '--file', join(d, 'logo.svg'), '--out-dir', join(out, 'leak-out')], { encoding: 'utf8', env });
    assert.equal(r.status, 1, `${tool} should fail to launch: ${r.stdout}${r.stderr}`);
    assert.deepEqual(readdirSync(d), ['logo.svg'], `${tool} left a wrapper`);
  }
});

// ---------- page readiness ----------
test('window.__ready set by an external script is waited for', { skip: page }, async () => {
  const d = dir('ready');
  writeFileSync(join(d, 'main.js'), "window.__ready = false;\nsetTimeout(() => { document.body.style.background = 'rgb(0, 128, 0)'; window.__ready = true; }, 800);\n");
  writeFileSync(join(d, 'ext.html'), '<!doctype html><html><body style="margin:0;background:rgb(255,0,0)"><script src="main.js"></script></body></html>');
  const r = await m.renderStill({ file: join(d, 'ext.html'), outDir: join(d, 'out'), width: 20, height: 20 });
  const browser = await m.openBrowser();
  try {
    const px = await m.withPixels(browser, [r.files[0].file], (imgs) => [...imgs[0].data.slice(0, 3)]);
    assert.deepEqual(px, [0, 128, 0]);
  } finally { await browser.close(); }
});

test('a window.ASSETS_READY promise that never settles fails after the timeout instead of hanging', { skip: page }, async () => {
  const browser = await m.openBrowser();
  try {
    const { page: p, context } = await m.newPage(browser, { width: 20, height: 20 });
    try {
      await p.setContent('<script>window.ASSETS_READY = new Promise(() => {}); window.renderFrame = () => {};</script>');
      const t0 = Date.now();
      await assert.rejects(m.waitReady(p, 800), /ASSETS_READY did not settle within 0.8 s/);
      assert.ok(Date.now() - t0 < 10000);
    } finally { await context.close(); }
  } finally { await browser.close(); }
});

// ---------- render_video ----------
test('a render that fails half way leaves no partial MP4 and keeps the good earlier one', { skip: pageAndMedia }, async () => {
  const d = dir('partial');
  const good = await m.renderVideo({ file: fx('anim-renderat.html'), outDir: d, name: 'clip', duration: 0.2, width: 64, height: 64, preset: 'ultrafast' });
  const before = sha(good.videos[0].file);
  const boom = '<!doctype html><body style="margin:0"><canvas id=c width=64 height=64></canvas><script>window.renderAt = (t) => { if (t > 0.5) throw new Error("boom at " + t); const g = document.getElementById("c").getContext("2d"); g.fillStyle = `hsl(${t * 100},80%,50%)`; g.fillRect(0, 0, 64, 64); };</script></body>';
  await assert.rejects(m.renderVideo({ html: boom, outDir: d, name: 'clip', duration: 1, width: 64, height: 64, preset: 'ultrafast' }), /boom/);
  assert.equal(sha(good.videos[0].file), before, 'the earlier video is untouched');
  await assert.rejects(m.renderVideo({ html: boom, outDir: d, name: 'fresh', duration: 1, width: 64, height: 64, preset: 'ultrafast' }), /boom/);
  assert.deepEqual(readdirSync(d).sort(), ['clip.mp4'], 'no partial or failed file left');
});

test('durations, fps and sizes a page declares meet the argument bounds', { skip: pageAndMedia }, async () => {
  const d = dir('declared');
  const run = (html, extra = {}) => m.renderVideo({ html, outDir: d, preset: 'ultrafast', ...extra });
  await assert.rejects(run('<style>div{width:10px;height:10px;background:red;animation:s 1s linear 100000}@keyframes s{to{transform:rotate(1turn)}}</style><div></div>', { width: 32, height: 32 }), /CSS animations last 100000 s/);
  await assert.rejects(run('<div data-composition-id="x" data-duration="1" data-fps="240" data-width="64" data-height="64"></div>'), /declares fps 240.*1 to 120/);
  await assert.rejects(run('<div data-composition-id="x" data-duration="86400" data-fps="30" data-width="64" data-height="64"></div>'), /declares duration 86400/);
  await assert.rejects(run('<div data-composition-id="x" data-duration="1" data-fps="30" data-width="20000" data-height="64"></div>'), /declares width 20000.*16 to 7680/);
  await assert.rejects(run('<script>window.TIMELINE = { width: 64, height: 64, fps: -5, duration: -3 };</script>'), /declares (fps -5|duration -3)/);
  await assert.rejects(m.filmstrip({ html: '<div data-composition-id="x" data-duration="86400" data-width="64" data-height="64"></div>', outDir: d, count: 2 }), /declares duration 86400/);
  // the arguments win over what the page declares, as before
  const v = await run('<div data-composition-id="x" data-duration="86400" data-fps="240" data-width="64" data-height="64"></div>', { duration: 0.1, fps: 10 });
  assert.equal(v.videos[0].frames, 1);
});

// ---------- determinism ----------
test('every page runs in UTC with en-US, and crypto random values follow the seed', { skip: page }, async () => {
  const browser = await m.openBrowser();
  const file = join(dir('det'), 'det.html');
  writeFileSync(file, '<p>x</p>');   // a file: page is a secure context, so crypto.randomUUID exists
  const probe = async (seed) => {
    const { page: p, context } = await m.newPage(browser, { width: 20, height: 20, seed });
    try {
      await p.goto(pathToFileURL(file).href);
      return await p.evaluate(() => {
        window.__easelSeek(0);
        let float = null; try { crypto.getRandomValues(new Float32Array(2)); } catch (e) { float = e.name; }
        return { tz: Intl.DateTimeFormat().resolvedOptions().timeZone, lang: navigator.language, hours: new Date().getHours(), str: new Date().toLocaleString(), num: (1234.5).toLocaleString(), bytes: [...crypto.getRandomValues(new Uint8Array(12))], words: [...crypto.getRandomValues(new Uint32Array(2))], uuid: crypto.randomUUID(), rnd: Math.random(), float };
      });
    } finally { await context.close(); }
  };
  try {
    const [a, b, c] = [await probe(1), await probe(1), await probe(2)];
    assert.equal(a.tz, 'UTC');
    assert.equal(a.lang, 'en-US');
    assert.equal(a.hours, 0);
    assert.match(a.str, /^1\/1\/2026, 12:00:00\sAM$/u);
    assert.equal(a.num, '1,234.5');
    assert.deepEqual(a, b, 'same seed, same values');
    assert.notDeepEqual(a.bytes, c.bytes);
    assert.notEqual(a.uuid, c.uuid);
    assert.match(a.uuid, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.equal(a.float, 'TypeMismatchError', 'bad arguments still throw as they would');
  } finally { await browser.close(); }
});

// ---------- file names ----------
test('image names with #, %, ? or spaces render (render_still and contact_sheet)', { skip: page }, async () => {
  const d = dir('hash');
  const red = await m.renderStill({ html: '<body style="margin:0;background:#e00000"></body>', outDir: d, name: 'red', width: 100, height: 100 });
  const names = ['logo#2.png', 'a%20b.png', 'why?.png', 'with space.png'].filter((n) => process.platform !== 'win32' || !n.includes('?'));
  const browser = await m.openBrowser();
  try {
    for (const n of names) {
      const f = join(d, n);
      writeFileSync(f, readFileSync(red.files[0].file));
      const r = await m.renderStill({ file: f, outDir: join(d, 'out'), name: `still-${names.indexOf(n)}`, width: 40, height: 40 });
      assert.deepEqual(await m.withPixels(browser, [r.files[0].file], (imgs) => [...imgs[0].data.slice(4 * (20 * 40 + 20), 4 * (20 * 40 + 20) + 3)]), [224, 0, 0], `render_still ${n}`);
      const s = await m.contactSheet({ items: [{ file: f }], outDir: join(d, `cs-${names.indexOf(n)}`) });
      // one 100x100 cell: page padding 16 + border 1, centred in a 184 px column, 12 px well padding
      assert.deepEqual(await m.withPixels(browser, [s.sheet], (imgs) => { const i = (79 * imgs[0].width + 108) * 4; return [...imgs[0].data.slice(i, i + 3)]; }), [224, 0, 0], `contact_sheet ${n}`);
    }
  } finally { await browser.close(); }
});
