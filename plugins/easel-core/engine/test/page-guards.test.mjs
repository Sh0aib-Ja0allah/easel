// Page tools' guards and bounds, from the 2026-10-11 full check (EN-08, EN-09, EN-11, EN-13, EN-16,
// EN-17, EN-20, Q-33, Q-43). Each one failed before its fix. Needs Chromium.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { linkSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { doctorReport } from '../lib/doctor.mjs';
import { safeOutput } from '../lib/paths.mjs';
import { validateArgs } from '../lib/validate.mjs';
import { tools } from '../tools.mjs';

const ready = ['playwright-core', 'chromium'].every((n) => doctorReport().checks.find((c) => c.name === n)?.ok);
const skip = ready ? false : 'needs Chromium (doctor --install)';
const CLI = fileURLToPath(new URL('../cli.mjs', import.meta.url));
let out, browser, m;
const dir = (name) => { const d = join(out, name); mkdirSync(d, { recursive: true }); return d; };
const pixel = (file, x, y) => m.withPixels(browser, [file], (imgs, [px, py]) => [...imgs[0].data.slice((py * imgs[0].width + px) * 4, (py * imgs[0].width + px) * 4 + 3)], [x, y]);
const bg = (c) => `<!doctype html><body style="margin:0;background:${c}"></body>`;

before(async () => {
  out = mkdtempSync(join(tmpdir(), 'easel-page-guards-'));
  if (!ready) return;
  m = { ...(await import('../lib/render.mjs')), ...(await import('../lib/contact.mjs')), ...(await import('../lib/pdf.mjs')), ...(await import('../lib/image.mjs')), ...(await import('../lib/browser.mjs')) };
  browser = await m.openBrowser();
});
after(async () => { if (browser) await browser.close(); rmSync(out, { recursive: true, force: true }); });

// ---------- EN-08: links in the job folder ----------
test('safeOutput refuses a symbolic link, a hard-linked file and a linked folder; a plain file passes', () => {
  const d = dir('links'), job = join(d, 'job'), outside = join(d, 'outside');
  mkdirSync(job); mkdirSync(outside);
  writeFileSync(join(outside, 'notes.txt'), 'mine');
  assert.equal(safeOutput(join(job, 'new.png'), job), join(job, 'new.png'));
  writeFileSync(join(job, 'old.png'), 'x');
  assert.equal(safeOutput(join(job, 'old.png'), job), join(job, 'old.png'));
  linkSync(join(outside, 'notes.txt'), join(job, 'hard.png'));
  assert.throws(() => safeOutput(join(job, 'hard.png'), job), /other hard links/);
  // symbolic links need a privilege on Windows; a junction does not
  let sym = true;
  try { symlinkSync(join(outside, 'notes.txt'), join(job, 'still.png')); } catch (err) { if (process.platform !== 'win32') throw err; sym = false; }
  if (sym) assert.throws(() => safeOutput(join(job, 'still.png'), job), /is a symbolic link/);
  symlinkSync(outside, join(job, 'cells'), 'junction');
  assert.throws(() => safeOutput(join(job, 'cells', 'a.png'), job), /links outside/);
  assert.equal(readFileSync(join(outside, 'notes.txt'), 'utf8'), 'mine');
});

test('render_still, render_pdf and contact_sheet do not write through a link planted in the job folder', { skip }, async () => {
  const d = dir('planted'), job = join(d, 'easel-out', 'demo'), outside = join(d, 'outside');
  mkdirSync(job, { recursive: true }); mkdirSync(outside);
  const notes = join(outside, 'notes.txt');
  writeFileSync(notes, 'my notes');
  linkSync(notes, join(job, 'still.png'));
  await assert.rejects(m.renderStill({ html: bg('#123'), outDir: job, width: 20, height: 20 }, { browser }), /other hard links/);
  linkSync(notes, join(job, 'print.pdf'));
  await assert.rejects(m.renderPdf({ html: '<p>x</p>', outDir: job }), /other hard links/);
  symlinkSync(outside, join(job, 'cells'), 'junction');
  await assert.rejects(m.contactSheet({ items: [{ html: bg('#123') }], sizes: [16], outDir: job }), /links outside/);
  assert.equal(readFileSync(notes, 'utf8'), 'my notes');
});

// ---------- EN-09 / EN-20: contact_sheet ----------
test('two contact sheets made at once in one job folder keep their own cells', { skip }, async () => {
  const d = dir('race');
  const [a, b] = await Promise.all([
    m.contactSheet({ items: [{ html: bg('#d00000') }], sizes: [32], outDir: d, name: 'red' }),
    m.contactSheet({ items: [{ html: bg('#0000d0') }], sizes: [32], outDir: d, name: 'blue' }),
  ]);
  assert.notEqual(a.cells[0].file, b.cells[0].file);
  assert.match(a.cells[0].file, /red-1-light/);
  assert.deepEqual(await pixel(a.cells[0].file, 16, 16), [208, 0, 0]);
  assert.deepEqual(await pixel(b.cells[0].file, 16, 16), [0, 0, 208]);
});

test('a contact_sheet item with both file and html, or neither, is refused', { skip }, async () => {
  const d = dir('both');
  await assert.rejects(m.contactSheet({ items: [{ html: bg('#fff'), file: join(d, 'x.html') }], outDir: d }), /items\[0\]: give file or html, not both/);
  await assert.rejects(m.contactSheet({ items: [{ html: bg('#fff') }, { label: 'empty' }], outDir: d }), /items\[1\]: give file/);
});

// ---------- EN-11: a malformed %-escape ----------
test('a malformed %-escape in an easel.local font URL is a 404, not a crash or a 60 s stall', { skip }, () => {
  const d = dir('escape');
  const args = join(d, 'args.json');
  writeFileSync(args, JSON.stringify({ html: '<!doctype html><style>@font-face{font-family:X;src:url(https://easel.local/fonts/%E0%A4%A.woff2)}p{font-family:X}</style><p>x</p><img src="https://easel.local/fonts/%zz.png">', outDir: d, width: 40, height: 20 }));
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [CLI, 'render_still', '--json', `@${args}`], { encoding: 'utf8', timeout: 45000 });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(Date.now() - t0 < 30000, `took ${Date.now() - t0} ms`);
  assert.equal(JSON.parse(r.stdout).files.length, 1);
});

// ---------- EN-13: window.__ready ----------
test('__ready: a name like __readyQueue is not waited for; an external script that sets it later is', { skip }, async () => {
  const d = dir('ready');
  const t0 = Date.now();
  await m.renderStill({ html: '<!doctype html><body><script>window.__readyQueue = [];</script></body>', outDir: d, name: 'queue', width: 20, height: 20 }, { browser });
  assert.ok(Date.now() - t0 < 10000, `waited ${Date.now() - t0} ms for a page that never uses __ready`);
  writeFileSync(join(d, 'late.js'), "setTimeout(() => { document.body.style.background = 'rgb(0, 128, 0)'; window.__ready = true; }, 800);\n");
  writeFileSync(join(d, 'late.html'), '<!doctype html><body style="margin:0;background:rgb(255,0,0)"><script src="late.js"></script></body>');
  const r = await m.renderStill({ file: join(d, 'late.html'), outDir: d, name: 'late', width: 20, height: 20 }, { browser });
  assert.deepEqual(await pixel(r.files[0].file, 10, 10), [0, 128, 0]);
});

// ---------- EN-16 / EN-20 / Q-33 / Q-43: arguments ----------
test('render_still: sizes take an integer N (an N x N square), as contact_sheet does', { skip }, async () => {
  assert.deepEqual(validateArgs(tools.render_still.inputSchema, { sizes: [16, 32, { width: 40, height: 20, name: 'wide' }] }), []);
  const r = await m.renderStill({ html: bg('#345'), outDir: dir('int-sizes'), name: 'mark', sizes: [16, 32, { width: 40, height: 20, name: 'wide' }] }, { browser });
  assert.deepEqual(r.files.map((f) => [basename(f.file), f.width, f.height]), [['mark-16.png', 16, 16], ['mark-32.png', 32, 32], ['mark-wide.png', 40, 20]]);
  for (const f of r.files) assert.deepEqual(m.pngSize(f.file), { width: f.width, height: f.height });
});

test('render_still: t, seed and selector are bounded; seed 0 is its own sequence', { skip }, async () => {
  const s = tools.render_still.inputSchema;
  assert.match(validateArgs(s, { html: 'x', t: 1e306 }).join(' '), /t must be <= 3600/);
  assert.match(validateArgs(s, { html: 'x', seed: 2 ** 32 }).join(' '), /seed must be <= 4294967295/);
  assert.match(validateArgs(s, { html: 'x', seed: -1 }).join(' '), /seed must be >= 0/);
  await assert.rejects(m.newPage(browser, { width: 10, height: 10, seed: 2 ** 32 }), /seed must be an integer from 0 to 4294967295/);
  const d = dir('seed');
  const page = '<!doctype html><body style="margin:0"><div id="v" style="width:20px;height:20px"></div><script>document.getElementById("v").style.background = `rgb(${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)},${Math.floor(Math.random() * 256)})`;</script></body>';
  const px = async (seed) => pixel((await m.renderStill({ html: page, outDir: d, name: `s${seed}`, width: 20, height: 20, seed }, { browser })).files[0].file, 5, 5);
  assert.notDeepEqual(await px(0), await px(1), 'seed 0 is not seed 1');
  assert.deepEqual(await px(0), await px(0));
  const t0 = Date.now();
  await assert.rejects(m.renderStill({ html: bg('#fff'), outDir: d, selector: '#nothing', width: 20, height: 20 }, { browser }), /selector "#nothing" matches no element/);
  await assert.rejects(m.renderStill({ html: '<!doctype html><div id="h" style="display:none">x</div>', outDir: d, selector: '#h', width: 20, height: 20 }, { browser }), /not visible/);
  assert.ok(Date.now() - t0 < 15000, `took ${Date.now() - t0} ms`);
});

test('render_pdf: zero and huge sizes are refused; the page size used is returned; reducedMotion is honoured', { skip }, async () => {
  const d = dir('pdf');
  for (const [w, h] of [['0px', '100px'], ['0mm', '0mm'], ['100000in', '1in'], ['5081mm', '10mm']]) await assert.rejects(m.renderPdf({ html: '<p>x</p>', outDir: d, width: w, height: h }), /more than 0 and at most 200in/, `${w} x ${h}`);
  const a4 = await m.renderPdf({ html: '<p>x</p>', outDir: d, name: 'a4', format: 'A4' });
  // Chromium prints A4 at whole CSS px: 595.92 x 842.88 pt
  for (const [k, want] of [['widthPt', 595], ['heightPt', 842], ['widthMm', 210], ['heightMm', 297]]) assert.ok(Math.abs(a4.pageSize[k] - want) <= 1, `${k} ${a4.pageSize[k]}`);
  const big = await m.renderPdf({ html: '<p>x</p>', outDir: d, name: 'big', width: '200in', height: '10in' });
  assert.equal(Math.round(big.pageSize.widthPt), 14400);
  assert.deepEqual(validateArgs(tools.render_pdf.inputSchema, { html: 'x', reducedMotion: 'reduce' }), []);
  const motion = '<!doctype html><style>@page{size:200px 100px;margin:0}@media (prefers-reduced-motion: reduce){@page{size:300px 100px}}html,body{margin:0}</style><p>A</p>';
  assert.equal(Math.round((await m.renderPdf({ html: motion, outDir: d, name: 'plain' })).pageSize.widthPt), 150);
  assert.equal(Math.round((await m.renderPdf({ html: motion, outDir: d, name: 'reduced', reducedMotion: 'reduce' })).pageSize.widthPt), 225, 'the reduced-motion path printed');
});

// ---------- EN-17: seeded clocks ----------
test('performance.timeOrigin and requestAnimationFrame timestamps follow the render clock', { skip }, async () => {
  const file = join(dir('clock'), 'c.html');
  writeFileSync(file, '<p>x</p>');
  const probe = async () => {
    const { page, context } = await m.newPage(browser, { width: 20, height: 20 });
    try {
      await page.goto(pathToFileURL(file).href);
      return await page.evaluate(async () => {
        const ts = [];
        await new Promise((res) => { const f = (t) => { ts.push(t); if (ts.length < 3) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
        return { origin: performance.timeOrigin, ts };
      });
    } finally { await context.close(); }
  };
  const [a, b] = [await probe(), await probe()];
  assert.equal(a.origin, Date.UTC(2026, 0, 1));
  assert.deepEqual(a, b);
  assert.ok(a.ts[1] > a.ts[0] && a.ts[2] > a.ts[1], `timestamps advance: ${a.ts}`);
});
