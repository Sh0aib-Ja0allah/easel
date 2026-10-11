// T2.3: measure_image and compare_images (matching a look from references). Needs Chromium; skips otherwise.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { doctorReport } from '../lib/doctor.mjs';

const ready = ['playwright-core', 'chromium'].every((n) => doctorReport().checks.find((c) => c.name === n)?.ok);
const skip = ready ? false : 'needs Chromium (doctor --install)';
let out, m, ref, ours;
// A "screenshot": a 200x300 picture (teal ground, a red block of 100x60 = 10%) letterboxed in black.
const REF = `<!doctype html><html><body style="margin:0;background:#000"><div style="position:absolute;left:40px;top:40px;width:200px;height:300px;background:#2a9d8f"><div style="position:absolute;left:50px;top:120px;width:100px;height:60px;background:#e63946"></div></div></body></html>`;
const OURS = `<!doctype html><html><body style="margin:0;background:#264653"><div style="position:absolute;left:30px;top:200px;width:300px;height:120px;background:#f4a261"></div></body></html>`;
before(async () => {
  if (!ready) return;
  out = mkdtempSync(join(tmpdir(), 'easel-refs-'));
  m = { ...(await import('../lib/refs.mjs')), ...(await import('../lib/render.mjs')) };
  ref = (await m.renderStill({ html: REF, outDir: out, name: 'ref', width: 280, height: 380 })).files[0].file;
  ours = (await m.renderStill({ html: OURS, outDir: out, name: 'ours', width: 360, height: 640 })).files[0].file;
});
after(() => { if (out) rmSync(out, { recursive: true, force: true }); });

test('measure_image: trims the letterbox, finds the exact colours and their shares, samples points, groups accents', { skip }, async () => {
  const r = await m.measureImage({ images: [ref], outDir: join(out, 'm'), accent: true, points: [[100, 150], [10, 10]] });
  const i = r.images[0];
  assert.deepEqual([i.width, i.height], [280, 380]);
  assert.deepEqual(i.box, [40, 40, 200, 300]);
  assert.equal(i.orientation, 'portrait');
  assert.equal(i.palette[0].hex, '#2a9d8f');
  assert.ok(Math.abs(i.palette[0].share - 0.9) < 0.02, JSON.stringify(i.palette[0]));
  assert.equal(i.palette[1].hex, '#e63946');
  assert.ok(Math.abs(i.palette[1].share - 0.1) < 0.02);
  assert.deepEqual(i.points.map((p) => p.hex), ['#e63946', '#2a9d8f']);
  assert.deepEqual(i.accents.families.map((f) => f.name).sort(), ['green-cyan', 'pink-red'].sort());
  assert.ok(existsSync(i.trimmed), 'trimmed copy written to outDir');
});

test('measure_image: a folder lists its images (not the trimmed copies); a missing file is a clear error', { skip }, async () => {
  const r = await m.measureImage({ images: [out] });
  assert.deepEqual(r.images.map((i) => i.file.split(/[\\/]/).pop()).sort(), ['ours.png', 'ref.png']);
  await assert.rejects(m.measureImage({ images: [join(out, 'nope.png')] }), /File not found/);
  await assert.rejects(m.measureImage({ images: [join(out, 'm')] }), /No PNG, JPG or WEBP images/);
});

test('compare_images: both pictures at one height on a 10% grid, with both palettes', { skip }, async () => {
  const r = await m.compareSheet({ reference: ref, ours, autoTrim: true, height: 480, outDir: join(out, 'c'), name: 'cmp-1' });
  assert.ok(existsSync(r.sheet) && r.sheet.endsWith('cmp-1.png'));
  // reference 200x300 -> 320 wide at 480; ours 360x640 -> 270 wide; pads 40 + gap 40
  assert.deepEqual([r.width, r.height], [40 + 320 + 40 + 270 + 40, 70 + 480 + 40]);
  assert.deepEqual(r.reference.box, [40, 40, 200, 300]);
  assert.equal(r.reference.palette[0].hex, '#2a9d8f');
  assert.equal(r.ours.palette[0].hex, '#264653');
  const cropped = await m.compareSheet({ reference: ref, ours, autoTrim: true, crop: [50, 120, 100, 60], cropOurs: [30, 200, 300, 120], outDir: join(out, 'c'), name: 'cmp-2', height: 240 });
  assert.equal(cropped.reference.palette[0].hex, '#e63946');
  assert.equal(cropped.ours.palette[0].hex, '#f4a261');
  // QA D-1 #13: sheets saved beside the references (default name "compare") are not measured as references
  const shelf = join(out, 'shelf');
  mkdirSync(shelf, { recursive: true });
  copyFileSync(ref, join(shelf, 'ref.png'));
  await m.compareSheet({ reference: ref, ours, outDir: shelf });
  await m.compareSheet({ reference: ref, ours, outDir: shelf, name: 'compare-2' });
  assert.ok(existsSync(join(shelf, 'compare.png')));
  const again = await m.measureImage({ images: [shelf], trim: false });
  assert.deepEqual(again.images.map((i) => i.file.split(/[\\/]/).pop()), ['ref.png']);
});

test('compare_images takes one image on each side: a folder of references is refused, not compared with itself', { skip }, async () => {
  const shelf = join(out, 'two-refs');
  mkdirSync(shelf, { recursive: true });
  copyFileSync(ref, join(shelf, 'a.png'));
  copyFileSync(ours, join(shelf, 'b.png'));
  await assert.rejects(m.compareSheet({ reference: shelf, ours, outDir: join(out, 'c2') }), /reference must be one PNG, JPG or WEBP image; .* is a folder with 2 images/);
  await assert.rejects(m.compareSheet({ reference: ref, ours: shelf, outDir: join(out, 'c2') }), /ours must be one/);
  // a folder holding exactly one image is that image
  const one = join(out, 'one-ref');
  mkdirSync(one, { recursive: true });
  copyFileSync(ref, join(one, 'ref.png'));
  const r = await m.compareSheet({ reference: one, ours, outDir: join(out, 'c2') });
  assert.equal(r.reference.file, join(one, 'ref.png'));
  assert.equal(r.ours.file, ours);
});
