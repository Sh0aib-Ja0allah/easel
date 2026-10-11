// qa contrast after the second review (Q-10, Q-11, C3, EN-15): each line of text is scored on its own,
// text the scan used to skip is measured or listed, a contrast check that measured nothing is never a
// pass, and inactive controls are exempt. Each test failed before its fix.
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
before(async () => { out = mkdtempSync(join(tmpdir(), 'easel-qa-contrast-')); ({ qa } = await import('../lib/qa.mjs')); });
after(() => rmSync(out, { recursive: true, force: true }));

test('contrast scores each line on its own: dark inline code or a badge between text nodes, and text wrapping a dark float, pass', { skip: page }, async () => {
  const html = doc('body{width:600px}p{margin:20px}.float{float:left;width:300px;height:120px;background:#000;margin:0 12px 0 0}',
    '<p>Run <code style="background:#1e1e1e;color:#fff;padding:2px 6px">npm install easel</code> and then the tests.</p>' +
    '<p style="color:#333">Status <span style="background:#111;color:#fff;padding:2px 30px">NEW RELEASE BADGE</span> now</p>' +
    '<div class="float"></div><p id="wrap" style="color:#222;margin:0">This paragraph wraps around a dark floated photo. It has dark text on a white page and is perfectly readable. It keeps going for a few more lines so that it wraps below the float as well as beside it.</p>' +
    '<p style="clear:both;color:#bbb">Faint <b style="color:#111">bold</b> words</p>');
  const r = await qa({ html, width: 640, height: 600, mode: 'ui', checks: ['contrast'], outDir: dir('lines') });
  assert.deepEqual(check(r, 'contrast').findings.map((f) => f.element), ['p "Faint words"'], JSON.stringify(check(r, 'contrast').findings));
});

test('contrast measures field values, placeholders, open shadow DOM, a shown child of a hidden parent and filter: opacity(); generated text is listed', { skip: page }, async () => {
  const html = doc('body{padding:10px}input,textarea{font:18px Inter;border:1px solid #888;color:#ddd;display:block;margin:6px 0}input::placeholder{color:#e0e0e0}#gen::after{content:"Generated label";color:#d8d8d8}.vp{visibility:hidden}.vc{visibility:visible;color:#d0d0d0}#filt{filter:opacity(0.12)}.dc{display:contents;opacity:.3}',
    '<input id="inp" value="Typed value text"><input id="ph" placeholder="Placeholder text"><textarea id="ta">Textarea text</textarea>' +
    '<p id="gen"></p><div class="vp"><span class="vc">Shown child of hidden parent</span></div><p id="filt">Filtered almost invisible text</p>' +
    '<div class="dc"><p style="color:#595959">Contents parent with opacity</p></div><div id="host"></div><div id="host2"></div>' +
    '<script>document.getElementById("host").attachShadow({ mode: "open" }).innerHTML = \'<p style="color:#d5d5d5;margin:0">Faint shadow text</p>\';' +
    'document.getElementById("host2").attachShadow({ mode: "open" }).innerHTML = \'<p style="color:#111;margin:0">Dark shadow text</p>\';</script>');
  const r = await qa({ html, width: 640, height: 600, mode: 'ui', checks: ['contrast'], outDir: dir('skipped') });
  const c = check(r, 'contrast');
  const failed = c.findings.map((f) => f.element).join(' | ');
  for (const t of ['Typed value text', 'Placeholder text', 'Textarea text', 'Faint shadow text', 'Shown child of hidden parent', 'Filtered almost invisible text']) assert.match(failed, new RegExp(t), `${t} measured and failed: ${failed}`);
  assert.doesNotMatch(failed, /Dark shadow text/, 'shadow DOM text is hidden for the background capture too');
  assert.doesNotMatch(failed, /Contents parent/, 'opacity on a display: contents box applies to nothing');
  assert.ok(c.unmeasured.some((u) => u.element === 'p#gen::after "Generated label"' && /generated text/.test(u.reason)), JSON.stringify(c.unmeasured));
});

test('contrast that measured nothing is not a pass: named in checks it fails, unasked it is reported as not run, and canvas pieces still pass', { skip: page }, async () => {
  const canvas = '<!doctype html><body style="margin:0;background:#000"><canvas id="c" width="400" height="300"></canvas><script>const g = document.getElementById("c").getContext("2d"); g.fillStyle = "#333"; g.font = "40px Inter"; g.fillText("Canvas words", 20, 100);</script></body>';
  const named = await qa({ html: canvas, width: 400, height: 300, mode: 'ui', checks: ['contrast', 'text_clipping'], outDir: dir('none') });
  assert.equal(named.pass, false);
  assert.deepEqual(named.hardFailures, ['contrast']);
  assert.match(check(named, 'contrast').findings[0].fix, /no HTML or SVG text/);
  const unasked = await qa({ html: canvas, width: 400, height: 300, mode: 'ui', outDir: dir('none') });
  const c = check(unasked, 'contrast');
  assert.equal(c.pass, null);
  assert.equal(c.hard, false);
  assert.match(c.notRun, /no HTML or SVG text/);
  assert.equal(unasked.pass, true, 'text_clipping ran');
  // only text that cannot be measured (gradient text) is nothing measured as well
  const grad = doc('.g{font:700 40px Inter;background:linear-gradient(90deg,#d1603d,#335c67);-webkit-background-clip:text;background-clip:text;color:transparent}', '<p class="g">Gradient words</p>');
  const g = await qa({ html: grad, mode: 'ui', checks: ['contrast'], outDir: dir('none') });
  assert.equal(g.pass, false);
  assert.match(JSON.stringify(check(g, 'contrast').unmeasured), /Gradient words/);
  // an animate piece checked with every check: contrast is not run, canvas_text decides
  const piece = await qa({ file: fx('anim-renderframe.html'), outDir: dir('piece') });
  assert.equal(piece.pass, true, JSON.stringify(piece.checks));
  assert.equal(check(piece, 'contrast').pass, null);
  assert.equal(check(piece, 'canvas_text').pass, true);
});

test('contrast exempts inactive controls (:disabled, aria-disabled, a disabled fieldset) and lists them; enabled faint text still fails', { skip: page }, async () => {
  const html = doc('body{padding:10px}input{font:18px Inter;color:#ccc}',
    '<button disabled style="opacity:.5">Save</button> <a href="#" aria-disabled="true" style="color:#bbb">Archive</a>' +
    '<fieldset disabled><label style="color:#c8c8c8">Name</label> <input value="Ada"></fieldset><input disabled value="Off">' +
    '<p style="color:#bbb">Enabled faint text</p>');
  const r = await qa({ html, width: 640, height: 400, mode: 'ui', checks: ['contrast'], outDir: dir('inactive') });
  const c = check(r, 'contrast');
  assert.deepEqual(c.findings.map((f) => f.element), ['p "Enabled faint text"']);
  const exempt = c.exempt.map((e) => `${e.element}: ${e.reason}`).join(' | ');
  for (const [t, why] of [['Save', /:disabled/], ['Archive', /aria-disabled/], ['Name', /disabled fieldset/], ['Ada', /:disabled|disabled fieldset/], ['Off', /:disabled/]]) {
    assert.ok(c.exempt.some((e) => e.element.includes(t) && why.test(e.reason) && e.ratio < 4.5), `${t} exempt: ${exempt}`);
  }
});
