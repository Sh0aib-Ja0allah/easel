// qa text_clipping and frame_overflow after the second review (Q-09, EN-15, C3): text is cut off only
// where its ink is, scroll boxes and image replacement are not cut-off text, a partial clip-path inset
// is, and art marked data-easel-bleed may run past a fixed frame. Each test failed before its fix.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { doctorReport } from '../lib/doctor.mjs';

const ok = (n) => doctorReport().checks.find((c) => c.name === n)?.ok;
const page = ['playwright-core', 'chromium'].every(ok) ? false : 'needs Chromium (doctor --install)';
const fx = (f) => fileURLToPath(new URL(`./fixtures/${f}`, import.meta.url));
let out, qa;
const dir = (name) => { const d = join(out, name); mkdirSync(d, { recursive: true }); return d; };
const check = (r, n) => r.checks.find((c) => c.name === n);
const doc = (css, body) => `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#fff;color:#111;font:18px Inter,sans-serif}${css}</style></head><body>${body}</body></html>`;
before(async () => { out = mkdtempSync(join(tmpdir(), 'easel-qa-clip-')); ({ qa } = await import('../lib/qa.mjs')); });
after(() => rmSync(out, { recursive: true, force: true }));

test('text_clipping reads the ink, not the font box: a tight SVG wordmark and line-height .9 display type pass; cut letters still fail', { skip: page }, async () => {
  // Space Grotesk at 150 px: the font box reaches about 7 px above the viewBox, the letters do not
  const mark = await qa({ file: fx('qa-wordmark.svg'), width: 600, height: 200, checks: ['text_clipping'], outDir: dir('mark') });
  assert.equal(mark.pass, true, JSON.stringify(check(mark, 'text_clipping').findings));
  const display = doc('html,body{height:100%;overflow:hidden}.d{position:absolute;top:0;left:20px;margin:0;font:700 120px/.9 "Space Grotesk"}.card{position:absolute;left:20px;top:200px;width:560px;height:108px;overflow:hidden}.card h2{margin:0;font:700 120px/.9 "Space Grotesk"}',
    '<h1 class="d">Display</h1><div class="card"><h2>Card title</h2></div><svg style="position:absolute;left:20px;top:330px" width="600" height="200" viewBox="0 0 600 200"><text x="20" y="140" font-family="Space Grotesk" font-weight="700" font-size="150">Lumen</text></svg>');
  const a = await qa({ html: display, width: 900, height: 600, fixedFrame: true, checks: ['text_clipping'], outDir: dir('display') });
  assert.equal(a.pass, true, JSON.stringify(a.checks));
  // body alone hides its overflow here, so it is the viewport's: the frame decides
  const cut = doc('html,body{height:100%}body{overflow:hidden}.d{position:absolute;top:-40px;left:20px;margin:0;font:700 120px/.9 "Space Grotesk"}.card{position:absolute;left:20px;top:200px;width:560px;height:60px;overflow:hidden}.card h2{margin:0;font:700 120px/.9 "Space Grotesk"}',
    '<h1 class="d">Display</h1><div class="card"><h2>Card title</h2></div><svg style="position:absolute;left:20px;top:330px" width="600" height="200" viewBox="0 0 600 200"><text x="20" y="90" font-family="Space Grotesk" font-weight="700" font-size="150">Lumen</text></svg>');
  const b = await qa({ html: cut, width: 900, height: 600, checks: ['text_clipping'], outDir: dir('cut') });
  const found = check(b, 'text_clipping').findings.map((f) => `${f.element}: ${f.reason}`);
  assert.ok(found.some((f) => /Display/.test(f) && /outside the 900x600 frame/.test(f)), found.join(' | '));
  assert.ok(found.some((f) => /Card title/.test(f) && /cut off by div\.card/.test(f)), found.join(' | '));
  assert.ok(found.some((f) => /Lumen/.test(f) && /cut off by svg/.test(f)), found.join(' | '));
});

test('text_clipping: image replacement and a scrollable <pre> are not cut off; half a clip-path inset is; a fixed frame cannot scroll', { skip: page }, async () => {
  const html = doc('body{width:700px}h1.logo{width:200px;height:40px;background:#2a6;text-indent:-9999px;overflow:hidden;margin:10px}pre{overflow-x:auto;background:#f4f4f4;padding:8px;width:300px;margin:10px}.vh{position:absolute;clip-path:inset(50%);white-space:nowrap}.half{clip-path:inset(50% 0 0 0);font-size:40px;margin:10px}',
    '<h1 class="logo">Acme Logo Text</h1><pre>npm install --save-dev some-really-long-package-name-that-scrolls-horizontally</pre><span class="vh">Screen reader label</span><p class="half">Top half clipped by clip-path</p>');
  const r = await qa({ html, checks: ['text_clipping'], outDir: dir('misc') });
  const c = check(r, 'text_clipping');
  assert.deepEqual(c.findings.map((f) => `${f.element}: ${f.reason}`), ['p.half "Top half clipped by clip-path": cut off by clip-path on p.half']);
  // the same page as a fixed-size graphic: a PNG cannot be scrolled, so the <pre> cuts its line off
  const f = await qa({ html, fixedFrame: true, checks: ['text_clipping'], outDir: dir('misc-fixed') });
  assert.ok(check(f, 'text_clipping').findings.some((x) => /^pre /.test(x.element) && /overflows its box and is clipped/.test(x.reason)), JSON.stringify(check(f, 'text_clipping').findings));
});

test('frame_overflow: art marked data-easel-bleed may run past a fixed frame and is listed as exempt; other overflow still fails', { skip: page }, async () => {
  const art = '<div data-easel-bleed style="position:absolute;left:250px;top:40px;width:300px;height:120px;background:#c33"></div><div data-easel-bleed style="width:700px;height:20px;background:#333"><div style="width:900px;height:10px;background:#555"></div></div><p style="margin:20px">Fits the frame</p>';
  const a = await qa({ html: doc('', art), width: 400, height: 300, fixedFrame: true, checks: ['text_clipping'], outDir: dir('bleed') });
  assert.equal(a.pass, true, JSON.stringify(a.checks));
  const fo = check(a, 'frame_overflow');
  assert.equal(fo.pass, true);
  assert.equal(fo.exempt.length, 2);
  assert.match(fo.exempt[0].reason, /data-easel-bleed/);
  const b = await qa({ html: doc('', `${art}<div style="position:absolute;left:350px;top:200px;width:200px;height:20px;background:#00f"></div>`), width: 400, height: 300, fixedFrame: true, checks: ['text_clipping'], outDir: dir('bleed2') });
  assert.deepEqual(b.hardFailures, ['frame_overflow']);
  assert.equal(check(b, 'frame_overflow').findings[0].content, '550x300');
});
