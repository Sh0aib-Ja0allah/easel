// SVG inputs, from the 2026-10-11 full check (Q-12, Q-13, Q-14, CM-02/EN-19): SMIL is seeked like CSS
// animation, a file that is not well-formed XML is refused, theme "dark" paints a dark page, and the
// wrapper page is written in the job folder, never beside the user's file. Needs Chromium.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { doctorReport } from '../lib/doctor.mjs';

const ready = ['playwright-core', 'chromium'].every((n) => doctorReport().checks.find((c) => c.name === n)?.ok);
const skip = ready ? false : 'needs Chromium (doctor --install)';
const fx = (f) => fileURLToPath(new URL(`./fixtures/${f}`, import.meta.url));
let out, browser, m;
const dir = (name) => { const d = join(out, name); mkdirSync(d, { recursive: true }); return d; };
// the mean x of the pixels close to rgb, in a PNG
const meanX = (file, rgb) => m.withPixels(browser, [file], (imgs, c) => {
  const i = imgs[0]; let sx = 0, n = 0;
  for (let p = 0; p < i.width * i.height; p++) if (Math.abs(i.data[p * 4] - c[0]) + Math.abs(i.data[p * 4 + 1] - c[1]) + Math.abs(i.data[p * 4 + 2] - c[2]) < 30) { sx += p % i.width; n++; }
  return n ? sx / n : null;
}, rgb);
const pixel = (file, x, y) => m.withPixels(browser, [file], (imgs, [px, py]) => [...imgs[0].data.slice((py * imgs[0].width + px) * 4, (py * imgs[0].width + px) * 4 + 4)], [x, y]);

before(async () => {
  if (!ready) return;
  out = mkdtempSync(join(tmpdir(), 'easel-page-svg-'));
  m = { ...(await import('../lib/render.mjs')), ...(await import('../lib/image.mjs')), ...(await import('../lib/browser.mjs')), ...(await import('../lib/qa.mjs')), ...(await import('../lib/pdf.mjs')), ...(await import('../lib/video.mjs')) };
  browser = await m.openBrowser();
});
after(async () => { if (browser) await browser.close(); if (out) rmSync(out, { recursive: true, force: true }); });

// ---------- Q-12 / C9: SMIL ----------
test('SMIL is seeked: at t=1 the circle is a quarter of the way through its 4 s loop, and renders repeat byte for byte', { skip }, async () => {
  const d = dir('smil');
  const still = async (name, t) => (await m.renderStill({ file: fx('page-smil.svg'), outDir: d, name, width: 400, height: 100, t }, { browser })).files[0].file;
  const a = await still('a', 1);
  await new Promise((r) => setTimeout(r, 400));   // wall-clock time must not matter
  const b = await still('b', 1);
  assert.ok(readFileSync(a).equals(readFileSync(b)), 'two renders at t=1 are byte-identical');
  // cx runs 20 -> 380 -> 20 over 4 s: 200 at t=1, 380 at t=2; the frozen bar runs x 10 -> 370
  assert.ok(Math.abs((await meanX(a, [59, 130, 246])) - 200) <= 3, `circle at ${await meanX(a, [59, 130, 246])}`);
  assert.ok(Math.abs((await meanX(a, [239, 68, 68])) - 110) <= 3, `bar at ${await meanX(a, [239, 68, 68])}`);
  const c = await still('c', 2);
  assert.ok(Math.abs((await meanX(c, [59, 130, 246])) - 380) <= 3, `circle at ${await meanX(c, [59, 130, 246])}`);
  const z = await still('z', 0);
  assert.ok(Math.abs((await meanX(z, [59, 130, 246])) - 20) <= 3, `circle at ${await meanX(z, [59, 130, 246])}`);
});

test('SMIL inside an HTML page is seeked too, and the filmstrip frames move', { skip }, async () => {
  const d = dir('smil-html');
  const svg = readFileSync(fx('page-smil.svg'), 'utf8');
  const f = await m.filmstrip({ html: `<!doctype html><body style="margin:0">${svg}</body>`, outDir: d, times: [0, 1, 2], width: 400, height: 100 });
  const xs = [];
  for (const fr of f.frames) xs.push(Math.round(await meanX(fr.file, [59, 130, 246])));
  for (const [i, want] of [20, 200, 380].entries()) assert.ok(Math.abs(xs[i] - want) <= 3, `frames at ${xs}`);
});

// ---------- Q-13 / C6: well-formed XML ----------
const BAD = {
  'bare ampersand': ['<svg xmlns="http://www.w3.org/2000/svg" width="80" height="20"><text y="15">R&D</text></svg>', /EntityRef: expecting ';'/, /&amp;/],
  'HTML entity': ['<svg xmlns="http://www.w3.org/2000/svg" width="80" height="20"><text y="15">Acme&nbsp;Co</text></svg>', /Entity 'nbsp' not defined/, /&#160;/],
  'duplicate attribute': ['<svg xmlns="http://www.w3.org/2000/svg" width="80" height="20"><rect width="5" height="5" fill="#000" fill="#f00"/></svg>', /Attribute fill redefined/, /once/],
  'double hyphen in a comment': ['<svg xmlns="http://www.w3.org/2000/svg" width="80" height="20"><!-- step 1 -- draft --><rect width="5" height="5"/></svg>', /Double hyphen within comment/, /remove "--"/],
  'late XML declaration': ['\n<!-- logo --><?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="80" height="20"/>', /XML declaration allowed only at the start/, /very start/],
};
for (const [kind, [svg, parser, fix]] of Object.entries(BAD)) {
  test(`an SVG that is not well-formed XML is refused with the parser's message: ${kind}`, { skip }, async () => {
    const d = dir(`xml-${kind.replace(/\W+/g, '-')}`);
    const file = join(d, 'bad.svg');
    writeFileSync(file, svg);
    const err = await m.renderStill({ file, outDir: join(d, 'out'), width: 80, height: 20 }, { browser }).then(() => null, (e) => e);
    assert.ok(err, 'render_still refused it');
    assert.match(err.message, /bad\.svg is not well-formed XML/);
    assert.match(err.message, parser);
    assert.match(err.message, fix);
    await assert.rejects(m.qa({ file, outDir: join(d, 'out'), width: 80, height: 20, checks: ['contrast'] }), /not well-formed XML/);
    assert.deepEqual(readdirSync(d).sort(), ['bad.svg', 'out']);
    assert.deepEqual(readdirSync(join(d, 'out')), [], 'no output and no wrapper left');
  });
}

test('a well-formed SVG with a declaration, a DOCTYPE and numeric entities renders', { skip }, async () => {
  const d = dir('xml-good');
  const file = join(d, 'good.svg');
  writeFileSync(file, '﻿<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<svg xmlns="http://www.w3.org/2000/svg" width="80" height="20"><text y="15">R&amp;D&#160;&#x2014;</text></svg>');
  const r = await m.renderStill({ file, outDir: d, width: 80, height: 20 }, { browser });
  assert.equal(r.files.length, 1);
  assert.equal(r.warnings, undefined, JSON.stringify(r.warnings));
});

test('an SVG without the SVG namespace renders, with a warning that it will not open on its own', { skip }, async () => {
  const d = dir('xml-nons');
  const file = join(d, 'bare.svg');
  writeFileSync(file, '<svg viewBox="0 0 10 10"><rect width="10" height="10"/></svg>');
  const r = await m.renderStill({ file, outDir: d, width: 20, height: 20 }, { browser });
  assert.equal(r.files.length, 1);
  assert.match((r.warnings || []).join(' '), /bare\.svg: the root element is not <svg xmlns="http:\/\/www\.w3\.org\/2000\/svg">/);
});

test('render_pdf and filmstrip refuse a malformed SVG too', { skip }, async () => {
  const d = dir('xml-other');
  const file = join(d, 'rd.svg');
  writeFileSync(file, BAD['bare ampersand'][0]);
  await assert.rejects(m.renderPdf({ file, outDir: d }), /rd\.svg is not well-formed XML/);
  await assert.rejects(m.filmstrip({ file, outDir: d, times: [0] }), /rd\.svg is not well-formed XML/);
});

// ---------- Q-14 / C7: dark theme ----------
test('theme "dark" on a currentColor SVG: dark page, light ink; light stays white; transparent stays transparent', { skip }, async () => {
  const d = dir('dark');
  const file = join(d, 'dot.svg');
  writeFileSync(file, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="currentColor"/></svg>');
  const r = await m.renderStill({ file, outDir: d, width: 48, height: 48, theme: 'both' }, { browser });
  const [light, dark] = r.files.map((f) => f.file);
  const [lc, lm, dc, dm] = [await pixel(light, 1, 1), await pixel(light, 24, 24), await pixel(dark, 1, 1), await pixel(dark, 24, 24)];
  assert.deepEqual(lc.slice(0, 3), [255, 255, 255], 'light: white page');
  assert.ok(lm[0] < 40, `light: dark ink ${lm}`);
  assert.ok(dc[0] < 40 && dc[3] === 255, `dark: dark page ${dc}`);
  assert.ok(dm[0] > 200, `dark: light ink ${dm}`);
  const t = await m.renderStill({ file, outDir: d, name: 'clear', width: 48, height: 48, theme: 'dark', transparent: true }, { browser });
  assert.equal((await pixel(t.files[0].file, 1, 1))[3], 0, 'transparent: no page colour');
  assert.ok((await pixel(t.files[0].file, 24, 24))[0] > 200, 'transparent dark: light ink');
});

// ---------- C8 / CM-02 / EN-19: wrapper pages ----------
test('qa and renders of an SVG or PNG never write into the source folder, and relative references still load', { skip }, async () => {
  const src = dir('src'), job = dir('job');
  const red = await m.renderStill({ html: '<body style="margin:0;background:#d00000"></body>', outDir: job, name: 'red', width: 20, height: 20 }, { browser });
  writeFileSync(join(src, 'tex.png'), readFileSync(red.files[0].file));
  writeFileSync(join(src, 'logo.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><defs><linearGradient id="g"><stop offset="0" stop-color="#00a000"/><stop offset="1" stop-color="#00a000"/></linearGradient></defs><rect width="20" height="20" fill="url(#g)"/><image href="tex.png" x="20" width="20" height="20"/><text x="2" y="14" font-size="9" fill="#999">Faint</text></svg>');
  const listing = () => readdirSync(src).sort().join(',');
  const want = listing();
  const seen = new Set();
  const poll = setInterval(() => seen.add(listing()), 5);
  try {
    const r = await m.renderStill({ file: join(src, 'logo.svg'), outDir: job, name: 'logo', width: 40, height: 20 }, { browser });
    await m.qa({ file: join(src, 'logo.svg'), outDir: job, width: 40, height: 20, checks: ['contrast'] });
    await m.renderStill({ file: join(src, 'tex.png'), outDir: job, name: 'tex', width: 20, height: 20 }, { browser });
    assert.deepEqual((await pixel(r.files[0].file, 3, 18)).slice(0, 3), [0, 160, 0], 'url(#g) still resolves');
    assert.deepEqual((await pixel(r.files[0].file, 35, 18)).slice(0, 3), [208, 0, 0], 'the relative image loads from the SVG\'s folder');
  } finally { clearInterval(poll); }
  seen.add(listing());
  assert.deepEqual([...seen], [want], 'the source folder never changed');
  assert.deepEqual(readdirSync(job).filter((f) => f.startsWith('.easel-')), [], 'the wrapper is removed from the job folder');
});
