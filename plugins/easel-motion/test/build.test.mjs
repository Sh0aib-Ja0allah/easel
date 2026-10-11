// T2.1: the ported build tool. Pure Node (no browser): every demo and template builds, the
// name scan finds a kit's top-level names, and "mix" wraps each extra style in its own scope so
// kits that share names (PAL, hand, rect, ...) no longer collide.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';
import { build, topLevelNames, PLUGIN } from '../tools/build.mjs';

export const STYLES = ['crosshatch', 'cut-paper', 'isometric', 'math', 'pixel', 'riso', 'sketchbook'];
const copy = (rel) => { const d = mkdtempSync(join(tmpdir(), 'easel-motion-')); cpSync(join(PLUGIN, rel), d, { recursive: true }); return d; };

test('all seven styles are present, each with STYLE.md, kit.js and a demo', () => {
  const have = readdirSync(join(PLUGIN, 'styles')).filter((n) => existsSync(join(PLUGIN, 'styles', n, 'kit.js'))).sort();
  assert.deepEqual(have, STYLES);
  for (const s of STYLES) for (const f of ['STYLE.md', 'demo/piece.json', 'demo/src/head.html']) assert.ok(existsSync(join(PLUGIN, 'styles', s, f)), `${s}/${f}`);
});

test('every demo and template builds (copied out, so the plugin tree stays clean)', () => {
  for (const rel of [...STYLES.map((s) => `styles/${s}/demo`), 'templates/piece', 'templates/beat-cut', 'examples/water-cycle']) {
    const d = copy(rel);
    try {
      // a copied demo has no styles/ folder beside it: the style comes from the plugin
      const r = build(d);
      assert.ok(r.lines > 500, `${rel}: ${r.lines} lines`);
      assert.deepEqual(r.warnings, []);
    } finally { rmSync(d, { recursive: true, force: true }); }
  }
});

test('topLevelNames: functions, classes, const/let lists, destructuring; not nested names', () => {
  const code = [
    'function a() { const inner = 1; }', 'async function b() {}', 'function* g() {}', 'class K {}',
    'const PAL = { x: 1, y: [1, 2] }, HANDF = "a, b";', 'let RL = null, OUT = null, SHEET_BOX = null;',
    "const pick = (s = 'x,y') => s, other = 2;", 'const [p, q] = [1, 2];', '  const indented = 1;', '// const commented = 1;',
  ].join('\n');
  assert.deepEqual(topLevelNames(code).sort(), ['HANDF', 'K', 'OUT', 'PAL', 'RL', 'SHEET_BOX', 'a', 'b', 'g', 'other', 'p', 'pick', 'q'].sort());
});

test('upstream collision: two kits concatenated as globals do not compile, mixed they do', () => {
  const kit = (s) => readFileSync(join(PLUGIN, 'styles', s, 'kit.js'), 'utf8');
  const shared = STYLES.map((s) => new Set(topLevelNames(kit(s))));
  const clash = topLevelNames(kit('riso')).filter((n) => shared[STYLES.indexOf('cut-paper')].has(n));
  assert.ok(clash.length > 0, 'riso and cut-paper share top-level names (the upstream limit)');
  assert.throws(() => new vm.Script(`"use strict";\n${kit('cut-paper')}\n${kit('riso')}`), SyntaxError);
});

test('mix: one piece with all seven styles builds; each mixed kit is KITS.<name> with live getters', () => {
  const d = copy('templates/piece');
  try {
    const meta = JSON.parse(readFileSync(join(d, 'piece.json'), 'utf8'));
    writeFileSync(join(d, 'piece.json'), JSON.stringify({ ...meta, style: 'cut-paper', mix: STYLES.filter((s) => s !== 'cut-paper') }));
    const r = build(d);
    assert.deepEqual(r.mix, STYLES.filter((s) => s !== 'cut-paper'));
    const html = readFileSync(r.file, 'utf8');
    for (const s of r.mix) assert.ok(html.includes(`KITS[${JSON.stringify(s)}] = (() => {`), s);
    assert.ok(html.includes('KITS["cut-paper"] = { STYLE };'));
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('mix: an unknown style or a bad name fails the build with a clear message', () => {
  const d = copy('templates/piece');
  try {
    const meta = JSON.parse(readFileSync(join(d, 'piece.json'), 'utf8'));
    writeFileSync(join(d, 'piece.json'), JSON.stringify({ ...meta, mix: ['no-such-style'] }));
    assert.throws(() => build(d), /unknown style "no-such-style"/);
    writeFileSync(join(d, 'piece.json'), JSON.stringify({ ...meta, mix: ['../escape'] }));
    assert.throws(() => build(d), /bad style name/);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('the build still rejects URLs and data: URIs in code', () => {
  const d = copy('templates/piece');
  try {
    const scenes = join(d, 'src', 'scenes.js');
    writeFileSync(scenes, readFileSync(scenes, 'utf8') + "\nconst LOGO = 'https://example.com/x.png';\n");
    assert.throws(() => build(d), /forbidden \(data: URI or http URL\)/);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('no system font names remain in the kit, styles or templates (bundled OFL fonts only)', () => {
  const bad = /Ink Free|Segoe|Arial|Consolas|Cambria|Comic Sans|Menlo|Helvetica|Georgia|Times New Roman|DejaVu|Bradley Hand|Chalkboard|Marker Felt|Cascadia|Impact/;
  const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
  const files = ['kit', 'styles', 'templates', 'examples'].flatMap((d) => walk(join(PLUGIN, d))).filter((f) => /\.(js|html|md)$/.test(f) && !/(index|board)\.html$/.test(f));
  for (const f of files) assert.doesNotMatch(readFileSync(f, 'utf8'), bad, f);
});

test('new-piece: every style starts from its demo with a format-aware head, and builds', async () => {
  const { newPiece } = await import('../tools/new-piece.mjs');
  const root = mkdtempSync(join(tmpdir(), 'easel-newpiece-'));
  try {
    for (const s of STYLES) {
      const r = newPiece(join(root, s), { style: s, formats: ['16:9', '9:16'], title: `A ${s} test` });
      assert.deepEqual(r.piece.formats, ['16:9', '9:16']);
      assert.equal(r.from, `styles/${s}/demo`);
      const head = readFileSync(join(root, s, 'src', 'head.html'), 'utf8');
      assert.match(head, /const PIECE_FORMATS = \["16:9","9:16"\];/);
      assert.match(head, /window\.__easel && window\.__easel\.aspect/);
      assert.doesNotMatch(head, /aspect-ratio: 9 \/ 16/);
      assert.match(head, new RegExp(`<title>A ${s} test</title>`));
      assert.ok(build(join(root, s)).lines > 500);
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('new-piece: a 9:16-only demo piece keeps its head; templates need cut-paper; nothing is overwritten', async () => {
  const { newPiece } = await import('../tools/new-piece.mjs');
  const root = mkdtempSync(join(tmpdir(), 'easel-newpiece-'));
  try {
    newPiece(join(root, 'tall'), { style: 'riso' });
    assert.equal(readFileSync(join(root, 'tall', 'src', 'head.html'), 'utf8'), readFileSync(join(PLUGIN, 'styles', 'riso', 'demo', 'src', 'head.html'), 'utf8'));
    assert.throws(() => newPiece(join(root, 'tall'), { style: 'riso' }), /already has a piece\.json/);
    assert.throws(() => newPiece(join(root, 't'), { style: 'riso', from: 'piece' }), /drawn in cut-paper/);
    assert.throws(() => newPiece(join(root, 'u'), { style: 'nope' }), /unknown style/);
    assert.throws(() => newPiece(join(root, 'v'), { style: 'riso', formats: ['3:2'] }), /unknown format/);
    const t = newPiece(join(root, 'wide'), { style: 'cut-paper', from: 'piece', formats: ['16:9'], mix: ['riso'] });
    assert.deepEqual(t.piece.mix, ['riso']);
    assert.match(readFileSync(join(root, 'wide', 'src', 'head.html'), 'utf8'), /\|\| "16:9"/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('the animate skill names only tools and files that exist', () => {
  const skill = readFileSync(join(PLUGIN, 'skills', 'animate', 'SKILL.md'), 'utf8');
  for (const t of skill.match(/mcp__plugin_easel-core_easel__\w+/g)) assert.match(t, /__(render_still|render_video|filmstrip|contact_sheet|qa|validate|craft|doctor)$/, t);
  for (const rel of skill.match(/<easel-motion>\/[\w./-]+/g)) {
    const p = join(PLUGIN, rel.replace('<easel-motion>/', '').replace(/\/<id>\/.*$/, ''));
    assert.ok(existsSync(p), `${rel} -> ${p}`);
  }
  for (const f of ['intake.md', 'craft.md']) assert.ok(existsSync(join(PLUGIN, 'skills', 'animate', f)), f);
  assert.ok(existsSync(join(PLUGIN, 'tools', 'new-piece.mjs')));
});
