// T3.1: render_pdf (print PDFs for posters, cards and decks). Needs Playwright and Chromium; skips otherwise.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { doctorReport } from '../lib/doctor.mjs';

const ready = ['playwright-core', 'chromium'].every((n) => doctorReport().checks.find((c) => c.name === n)?.ok);
const skip = ready ? false : 'needs Chromium (doctor --install)';
let out, m;
before(async () => { out = mkdtempSync(join(tmpdir(), 'easel-pdf-')); m = await import('../lib/pdf.mjs'); });
after(() => rmSync(out, { recursive: true, force: true }));
// the MediaBox of each page, in PDF points (1 in = 72 pt)
const near = (got, want) => assert.ok(got && Math.abs(got[0] - want[0]) <= 1 && Math.abs(got[1] - want[1]) <= 1, `page ${JSON.stringify(got)} pt, want ${JSON.stringify(want)}`);
const boxes = (f) => [...readFileSync(f, 'latin1').matchAll(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/g)].map((x) => [Math.round(+x[1]), Math.round(+x[2])]);

test('render_pdf: the page\'s @page size, a named format, explicit sizes, and one page per break', { skip }, async () => {
  const card = '<!doctype html><style>@page{size:3.5in 2in;margin:0}html,body{margin:0}body{background:#264653;color:#fff;font:700 20px Inter}</style><body>A card</body>';
  const a = await m.renderPdf({ html: card, outDir: out, name: 'card' });
  assert.equal(a.pages, 1);
  near(boxes(a.file)[0], [252, 144]);
  assert.match(readFileSync(a.file, 'latin1').slice(0, 8), /^%PDF-/);
  const deck = '<!doctype html><style>@page{size:1280px 720px;margin:0}html,body{margin:0}section{width:1280px;height:720px;break-after:page;background:#eee;font:700 60px Inter}</style><section>1</section><section>2</section><section>3</section>';
  const d = await m.renderPdf({ html: deck, outDir: out, name: 'deck' });
  assert.equal(d.pages, 3);
  near(boxes(d.file)[0], [960, 540]);
  const a4 = await m.renderPdf({ html: '<p>x</p>', outDir: out, name: 'a4', format: 'A4' });
  near(boxes(a4.file)[0], [595, 842]);
  const mm = await m.renderPdf({ html: '<p>x</p>', outDir: out, name: 'mm', width: '100mm', height: '50mm' });
  near(boxes(mm.file)[0], [283, 142]);
  const svg = join(out, 'mark.svg');
  writeFileSync(svg, '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><circle cx="100" cy="100" r="80" fill="#e76f51"/></svg>');
  const s = await m.renderPdf({ file: svg, outDir: out, name: 'mark', format: 'A6' });
  assert.equal(s.pages, 1);
  near(boxes(s.file)[0], [298, 420]);
  // without a size, an SVG prints at its own size (200 px = 150 pt; a 1600 x 900 viewBox = 1200 x 675 pt)
  near(boxes((await m.renderPdf({ file: svg, outDir: out, name: 'mark-own' })).file)[0], [150, 150]);
  const wide = join(out, 'wide.svg');
  writeFileSync(wide, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="#264653"/></svg>');
  near(boxes((await m.renderPdf({ file: wide, outDir: out, name: 'wide' })).file)[0], [1200, 675]);
});

test('render_pdf: bad sizes and images are refused clearly', { skip }, async () => {
  await assert.rejects(m.renderPdf({ html: '<p>x</p>', outDir: out, format: 'B5' }), /format must be one of/);
  await assert.rejects(m.renderPdf({ html: '<p>x</p>', outDir: out, width: '8.5' , height: '11in' }), /must be a length/);
  await assert.rejects(m.renderPdf({ html: '<p>x</p>', outDir: out, width: '8.5in' }), /both width and height/);
});
