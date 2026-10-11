// qa canvas_text and the format arguments after the second review (EN-06, EN-20): a TIMELINE the check
// cannot sample is refused, nothing sampled or text it could not trace fails, and aspect and theme reach
// the page checks and the canvas checks. Each test failed before its fix.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { doctorReport } from '../lib/doctor.mjs';

const ok = (n) => doctorReport().checks.find((c) => c.name === n)?.ok;
const page = ['playwright-core', 'chromium'].every(ok) ? false : 'needs Chromium (doctor --install)';
let out, qa;
const dir = (name) => { const d = join(out, name); mkdirSync(d, { recursive: true }); return d; };
const check = (r, n) => r.checks.find((c) => c.name === n);
// a piece that draws a label running off the right edge on every frame
const piece = (timeline, draw = "x.fillText('CUT OFF HEADLINE TEXT', 250, 150);", canvas = 'cv || c') => `<!doctype html><html><body style="margin:0;background:#000"><canvas id="c" width="400" height="300"></canvas><script>
window.TIMELINE = ${timeline};
const c = document.getElementById('c');
window.renderFrame = (t, cv) => { const x = (${canvas}).getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, 400, 300); x.fillStyle = '#fff'; x.font = '40px Inter'; ${draw} };
</script></body></html>`;
before(async () => { out = mkdtempSync(join(tmpdir(), 'easel-qa-canvas-')); ({ qa } = await import('../lib/qa.mjs')); });
after(() => rmSync(out, { recursive: true, force: true }));

test('canvas_text refuses a TIMELINE it cannot sample: missing or non-finite duration, fps or size, and an unbounded frame count', { skip: page }, async () => {
  const run = (t) => qa({ html: piece(t), checks: ['canvas_text'], outDir: dir('refuse') });
  await assert.rejects(run('{ width: 400, height: 300, fps: 30 }'), /TIMELINE\.duration must be a finite number/);
  await assert.rejects(run('{ width: 400, height: 300, duration: "two", fps: 30 }'), /TIMELINE\.duration must be a finite number.*got "two"/);
  await assert.rejects(run('{ width: 400, height: 300, duration: 2, fps: Infinity }'), /TIMELINE\.fps must be a finite number.*got Infinity/);
  await assert.rejects(run('{ duration: 2, fps: 30 }'), /TIMELINE\.width must be/);
  await assert.rejects(run('{ width: 400, height: 300, duration: 2, fps: 30, frames: 3e7 }'), /TIMELINE\.frames must be a whole number from 1 to 61/);
  await assert.rejects(run('{ width: 400, height: 300, duration: 2, fps: 500 }'), /TIMELINE\.fps.*1 to 120/);
  // the full TIMELINE is checked as before
  const full = await qa({ html: piece('{ width: 400, height: 300, duration: 2, fps: 30 }'), checks: ['canvas_text'], outDir: dir('refuse') });
  assert.equal(full.pass, false);
  assert.equal(check(full, 'canvas_text').value, 1);
});

test('canvas_text fails when it sampled no frame or could not trace the text drawn; a piece with no text passes and says so', { skip: page }, async () => {
  const none = await qa({ html: piece('{ width: 400, height: 300, duration: 0.04, fps: 1 }'), checks: ['canvas_text'], outDir: dir('zero') });
  assert.equal(none.pass, false);
  assert.match(JSON.stringify(check(none, 'canvas_text').findings), /no frame was sampled/);
  // text drawn on a 2x canvas the piece composites: canvas_text traces only the TIMELINE-sized canvas
  const big = piece('{ width: 400, height: 300, duration: 1, fps: 10 }', "x.fillText('CUT OFF HEADLINE TEXT', 250, 150);", 'big');
  const twice = await qa({ html: big.replace("const c =", "const big = document.createElement('canvas'); big.width = 800; big.height = 600; const c ="), checks: ['canvas_text'], outDir: dir('2x') });
  assert.equal(twice.pass, false);
  assert.match(JSON.stringify(check(twice, 'canvas_text').findings), /not 400x300/);
  const plain = await qa({ html: piece('{ width: 400, height: 300, duration: 1, fps: 10 }', "x.fillRect(10, 10, 50, 50);"), checks: ['canvas_text'], outDir: dir('plain') });
  assert.equal(plain.pass, true, JSON.stringify(plain.checks));
  assert.equal(check(plain, 'canvas_text').textTraced, 0);
  assert.match(check(plain, 'canvas_text').note, /drew no text/);
});

test('aspect sets the page checks\' size and window.__easel.aspect; theme reaches the canvas checks', { skip: page }, async () => {
  const html = '<!doctype html><body style="margin:0;background:#fff;font:20px Inter"><p id="a" style="color:#bbb;margin:20px"></p><p style="position:absolute;left:1300px;top:100px;white-space:nowrap;color:#111;margin:0">Wide format label</p><script>document.getElementById("a").textContent = "Format " + window.__easel.aspect;</script></body>';
  const r = await qa({ html, aspect: '16:9', checks: ['text_clipping', 'contrast'], outDir: dir('aspect') });
  assert.equal(check(r, 'text_clipping').pass, true, 'at 1920x1080 the label fits');
  assert.match(check(r, 'contrast').findings[0].element, /Format 16:9/);
  const narrow = await qa({ html, checks: ['text_clipping'], outDir: dir('aspect') });
  assert.match(check(narrow, 'text_clipping').findings[0].reason, /outside the 1200x630 frame/);
  // a piece that draws a label off the frame only in the dark theme
  const dark = piece('{ width: 400, height: 300, duration: 1, fps: 10 }', "if (matchMedia('(prefers-color-scheme: dark)').matches) x.fillText('CUT OFF HEADLINE TEXT', 250, 150); else x.fillText('Fits', 20, 100);");
  assert.equal((await qa({ html: dark, checks: ['canvas_text'], outDir: dir('theme') })).pass, true);
  const d = await qa({ html: dark, theme: 'dark', checks: ['canvas_text'], outDir: dir('theme') });
  assert.equal(d.pass, false);
  assert.equal(check(d, 'canvas_text').findings[0].kind, 'cut off by the frame edge');
});
