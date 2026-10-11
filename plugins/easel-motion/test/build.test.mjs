// T2.1: the ported build tool. Pure Node (no browser): every demo and template builds, the
// name scan finds a kit's top-level names, and "mix" wraps each extra style in its own scope so
// kits that share names (PAL, hand, rect, ...) no longer collide.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';
import { build, topLevelNames, wrapKit, PLUGIN } from '../tools/build.mjs';

export const STYLES = ['aurora-glass', 'crosshatch', 'cut-paper', 'hud', 'isometric', 'liquid', 'math', 'pixel', 'riso', 'sketchbook', 'synthwave'];
const copy = (rel) => { const d = mkdtempSync(join(tmpdir(), 'easel-motion-')); cpSync(join(PLUGIN, rel), d, { recursive: true }); return d; };

test('all eleven styles are present, each with STYLE.md, kit.js, a demo and a sample', () => {
  const have = readdirSync(join(PLUGIN, 'styles')).filter((n) => existsSync(join(PLUGIN, 'styles', n, 'kit.js'))).sort();
  assert.deepEqual(have, STYLES);
  for (const s of STYLES) for (const f of ['STYLE.md', 'demo/piece.json', 'demo/src/head.html', 'sample.png']) assert.ok(existsSync(join(PLUGIN, 'styles', s, f)), `${s}/${f}`);
});

test('every demo and template builds (copied out, so the plugin tree stays clean)', () => {
  for (const rel of [...STYLES.map((s) => `styles/${s}/demo`), 'styles/isometric/demo-dark', 'templates/piece', 'templates/beat-cut', 'templates/blank', 'examples/water-cycle']) {
    // demo-dark reuses ../demo/src, so it is copied with its style folder
    const dark = rel.endsWith('/demo-dark'), d = copy(dark ? rel.replace(/\/demo-dark$/, '') : rel);
    try {
      // a copied demo has no styles/ folder beside it: the style comes from the plugin
      const r = build(dark ? join(d, 'demo-dark') : d);
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

test('mix: one piece with all eleven styles builds; each mixed kit is KITS.<name> with live getters', () => {
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
      // a 9:16-only demo head gets the FORMATS block; an already format-aware head gets 16:9 as its main format
      assert.match(head, /const PIECE_FORMATS = \["16:9","9:16"\];|\|\| "16:9";/);
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

test('the skills name only engine tools and plugin files that exist', () => {
  const engineTools = new Set([...readFileSync(join(PLUGIN, '..', 'easel-core', 'engine', 'tools.mjs'), 'utf8').matchAll(/^ {2}(\w+): \{$/gm)].map((m) => m[1]));
  assert.ok(engineTools.has('render_video') && engineTools.has('measure_image'), [...engineTools].join(','));
  for (const skill of ['animate', 'style-match', 'ui-motion']) {
    const dir = join(PLUGIN, 'skills', skill), text = readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');
    for (const t of text.match(/mcp__plugin_easel-core_easel__\w+/g) || []) assert.ok(engineTools.has(t.split('__').pop()), `${skill}: ${t}`);
    // bare tool names in backticks (`render_still`, `qa` ...) must be engine tools too
    for (const [, t] of text.matchAll(/`((?:render|contact|audio|mux|measure|compare)_\w+|filmstrip)`/g)) assert.ok(engineTools.has(t), `${skill}: \`${t}\` is not an engine tool`);
    for (const rel of text.match(/<easel-motion>\/[\w./-]+/g) || []) {
      const p = join(PLUGIN, rel.replace('<easel-motion>/', '').replace(/\/<id>\/.*$/, '').replace(/\/$/, ''));
      assert.ok(existsSync(p), `${skill}: ${rel} -> ${p}`);
    }
    for (const m of text.match(/\$\{CLAUDE_PLUGIN_ROOT\}\/[\w./-]+/g) || []) assert.ok(existsSync(join(PLUGIN, m.replace('${CLAUDE_PLUGIN_ROOT}/', ''))), `${skill}: ${m}`);
  }
});

test('new-style: a blank or shipped starting kit, a STYLE.md skeleton, only under styles/, never overwriting', async () => {
  const { newStyle } = await import('../tools/new-style.mjs');
  const root = mkdtempSync(join(tmpdir(), 'easel-newstyle-'));
  try {
    const a = newStyle(join(root, 'styles', 'neon-ink'));
    assert.equal(a.from, 'blank');
    assert.match(readFileSync(join(root, 'styles', 'neon-ink', 'kit.js'), 'utf8'), /name: 'neon-ink'/);
    for (const h of ['## Measured', '## Frame checklist', '## Not matched', '## Proven on']) assert.ok(readFileSync(join(root, 'styles', 'neon-ink', 'STYLE.md'), 'utf8').includes(h), h);
    newStyle(join(root, 'styles', 'warm-print'), { from: 'riso' });
    assert.match(readFileSync(join(root, 'styles', 'warm-print', 'kit.js'), 'utf8'), /name: 'warm-print'/);
    assert.throws(() => newStyle(join(root, 'styles', 'neon-ink')), /not overwriting/);
    assert.throws(() => newStyle(join(root, 'looks', 'x')), /folder called styles/);
    assert.throws(() => newStyle(join(root, 'styles', 'Bad Name')), /lower-case/);
    assert.throws(() => newStyle(join(root, 'styles', 'y'), { from: 'nope' }), /unknown starting kit/);
    // a piece in the new style starts from the blank starter and builds
    const { newPiece } = await import('../tools/new-piece.mjs');
    const r = newPiece(join(root, 'easel-out', 'job', 'piece'), { style: 'neon-ink', formats: ['16:9'] });
    assert.equal(r.from, 'templates/blank');
    assert.ok(build(join(root, 'easel-out', 'job', 'piece')).lines > 500);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('translated grammars and recipes: English bodies, attribution headers, no creator names in names or text', () => {
  const names = /3blue1brown|3b1b|kurzgesagt|\bvox\b|rsa animate|minute physics|ghibli|kusama|\bharing\b|shinkai|kirby|dal[ií]\b|mario|monet|van gogh|mucha|picasso|braque|leonardo|da vinci|klimt|munch|seurat|matisse|rembrandt|hopper|huashu|xiaohei|peanut/i;
  const files = [...readdirSync(join(PLUGIN, 'grammars')).map((f) => join('grammars', f)), ...readdirSync(join(PLUGIN, 'recipes')).map((f) => join('recipes', f))].filter((f) => f.endsWith('.md'));
  const huashu = files.filter((f) => readFileSync(join(PLUGIN, f), 'utf8').includes('alchaincyf/huashu-art-motion @ 9ff59339f934e08483ba0a5b1db20f4c2c421b35'));
  assert.equal(huashu.length, 19, huashu.join(', '));   // 9 grammars + 10 recipes
  for (const f of files) {
    assert.doesNotMatch(f, names, f);
    // the source repository's own name is the attribution, not a style name
    const text = readFileSync(join(PLUGIN, f), 'utf8').replaceAll('alchaincyf/huashu-art-motion', 'SOURCE'), body = text.startsWith('<!--') ? text.slice(text.indexOf('-->') + 3) : text;
    assert.doesNotMatch(body, /[\u3000-\u9fff\uff00-\uffef]/, `${f}: Chinese text outside the header`);
    assert.doesNotMatch(body, names, f);
  }
});

// QA D-1 #20: a mixed kit may declare any top-level name, even the wrapper's own
test('mix: a kit with a top-level `k` (or any common name) still mixes in', () => {
  const code = wrapKit('mine', 'const k = 1;\nconst STYLE = { name: "mine" };\nfunction draw() { return k; }\n');
  const ctx = { KITS: {} };
  new vm.Script(code).runInNewContext(ctx);
  assert.equal(ctx.KITS.mine.draw(), 1);
  assert.equal(ctx.KITS.mine.k, 1);
});

// QA D-1 #6: the supplied track's beat map is piece/beatmap.json, separate from the story beats.json
test('beatmap.json is injected as BEATS; a map without a bpm is refused', () => {
  const d = copy('templates/blank');
  try {
    writeFileSync(join(d, 'beatmap.json'), JSON.stringify({ bpm: 96, offset: 0.42 }));
    const r = build(d);
    assert.deepEqual(r.extras, ['beatmap.json']);
    assert.match(readFileSync(r.file, 'utf8'), /const BEATS = \{"offset":0\.42,"bpm":96\};|const BEATS = \{"bpm":96,"offset":0\.42\};/);
    writeFileSync(join(d, 'beatmap.json'), JSON.stringify({ beats: [0.5, 1] }));
    assert.throws(() => build(d), /needs "bpm"/);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

// QA D-1 #9 and #22: the command lines run (also through a symlinked plugin folder) and refuse unknown flags
test('tools run as commands, also through a symlink; new-piece and new-style refuse unknown flags', () => {
  const root = mkdtempSync(join(tmpdir(), 'easel-cli-'));
  try {
    let tools = join(PLUGIN, 'tools');
    try { symlinkSync(PLUGIN, join(root, 'link'), process.platform === 'win32' ? 'junction' : 'dir'); tools = join(root, 'link', 'tools'); } catch { /* no symlinks here: the plain path still runs the commands */ }
    const run = (tool, ...args) => spawnSync(process.execPath, [join(tools, tool), ...args], { encoding: 'utf8', cwd: root, windowsHide: true });
    const np = run('new-piece.mjs', join(root, 'p'), '--style', 'riso', '--formats', '16:9');
    assert.equal(np.status, 0, np.stderr);
    assert.match(np.stdout, /new piece in .* formats 16:9/);
    const b = run('build.mjs', join(root, 'p'));
    assert.equal(b.status, 0, b.stderr);
    assert.match(b.stdout, /^built /);
    assert.ok(existsSync(join(root, 'p', 'index.html')) && existsSync(join(root, 'p', 'board.html')));
    const typo = run('new-piece.mjs', join(root, 'q'), '--format', '16:9');
    assert.equal(typo.status, 2);
    assert.match(typo.stderr, /bad option "--format"/);
    assert.ok(!existsSync(join(root, 'q')), 'nothing is written on a bad flag');
    assert.equal(run('new-piece.mjs', join(root, 'q'), '--style').status, 2, 'a flag without a value');
    mkdirSync(join(root, 'proj'));
    const ns = run('new-style.mjs', join(root, 'proj', 'styles', 'mine'), '--from', 'riso');
    assert.equal(ns.status, 0, ns.stderr);
    assert.match(ns.stdout, /new style "mine"/);
    assert.equal(run('new-style.mjs', join(root, 'proj', 'styles', 'other'), '--form', 'riso').status, 2);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
