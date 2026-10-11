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

// QA: only a declaration's first line was read, so `const INK = '#123',\n  PAPER = '#fff';` lost PAPER when mixed
test('topLevelNames: declarations over several lines keep every name; a mixed kit exports them', () => {
  const code = [
    "const INK = '#123',", "  PAPER = '#fff';", 'const PAL = {', "  a: 1,   // the hero's colour, not a name", '  b: [1, 2],', "}, HANDF = 'x';",
    'let x = 1 /* a, b */,', '  y = 2;', 'const T = `a,', '${T0}, b`, U = 2;', 'const LONG =', '  3;', 'const draw = (s) => {', '  const inner = s;', '  return inner;', '};',
    'function later() {}', '  const indented = 1;', 'const lone = 1', 'other = 2;',
  ].join('\n');
  assert.deepEqual(topLevelNames(code).sort(), ['HANDF', 'INK', 'LONG', 'PAL', 'PAPER', 'T', 'U', 'draw', 'later', 'lone', 'x', 'y'].sort());
  const ctx = { KITS: {} };
  new vm.Script(wrapKit('mine', "const INK = '#123',\n  PAPER = '#fff';\nconst STYLE = { name: 'mine' };\n")).runInNewContext(ctx);
  assert.deepEqual([ctx.KITS.mine.INK, ctx.KITS.mine.PAPER], ['#123', '#fff']);
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

// QA: "mix": "riso" (a string) crashed with "(meta.mix || []).filter is not a function"
test('mix: one style name as a string builds; a mix that is not a name or a list is refused clearly', () => {
  const d = copy('templates/piece');
  try {
    const meta = JSON.parse(readFileSync(join(d, 'piece.json'), 'utf8'));
    const withMix = (mix) => writeFileSync(join(d, 'piece.json'), JSON.stringify({ ...meta, mix }));
    withMix('riso');
    assert.deepEqual(build(d).mix, ['riso']);
    withMix('riso, hud');
    assert.deepEqual(build(d).mix, ['riso', 'hud']);
    for (const bad of [5, { riso: true }, [['riso']]]) { withMix(bad); assert.throws(() => build(d), /"mix" must be a style name or a list of style names/, JSON.stringify(bad)); }
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

// QA: ui-motion delivered without a cold read. Every skill ends in easel-core:critique with the
// motion rubric; style-match ends by handing its piece to animate, which runs it.
test('every skill ends in a critique by easel-core:critique with the motion rubric (style-match through animate)', () => {
  const skills = readdirSync(join(PLUGIN, 'skills')).filter((d) => existsSync(join(PLUGIN, 'skills', d, 'SKILL.md'))).sort();
  assert.deepEqual(skills, ['animate', 'style-match', 'ui-motion']);
  const text = (s) => readFileSync(join(PLUGIN, 'skills', s, 'SKILL.md'), 'utf8');
  for (const s of skills) {
    if (s === 'style-match') assert.match(text(s), /continue in `easel-motion:animate` \([^)]*review\)\.\s*(`<easel-motion>[\s\S]*)?$/, s);
    else assert.match(text(s), /easel-core:critique[\s\S]{0,80}\*\*motion\*\* rubric/, s);
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

// Creator and channel names, the never-ship huashu assets (CLAUDE.md "Never copy or ship") and the
// fan-work and game names: none may appear in a file name or a body, nor in a built piece.
const NEVER_NAMES = /3blue1brown|3b1b|kurzgesagt|\bvox\b|rsa animate|minute physics|ghibli|kusama|\bharing\b|shinkai|kirby|dal[ií]\b|mario|nintendo|clawd|monet|van gogh|mucha|picasso|braque|leonardo|da vinci|klimt|munch|seurat|matisse|rembrandt|hopper|huashu|xiaohei|peanut|rig_huashu|_shared\/hero|long_scroll|角色/i;
// A well-known science channel's bird mascot is an egg-shaped body with big white eyes, pupils set
// toward the front and a triangular beak; a critter described with that combination copies it,
// whatever it is called. A paragraph fails when it names an egg body with a triangular beak, nose or
// horn, or any three of the five traits.
const MASCOT = {
  egg: /\begg[- ]?(?:shaped|like)\b|\begg (?:body|bodies)\b|\boval body\b/i,
  eyes: /\b(?:big|large|huge) white eyes\b/i,
  pupils: /\bpupils?\b[^.\n]{0,40}\b(?:toward|towards|to) the front\b|\bforward[- ](?:set|facing) pupils?\b/i,
  beak: /\btriangular\b[^.\n]{0,40}\b(?:beak|bill|nose|horn)s?\b|\b(?:beak|bill)s?\b[^.\n]{0,40}\btriangular\b/i,
  leaves: /\bleaf[- ]shaped\b[^.\n]{0,30}\b(?:limbs?|wings?|arms?|legs?)\b|\b(?:limbs?|wings?|arms?|legs?)\b[^.\n]{0,40}\bleaf[- ]?shapes?\b/i,
};
const mascotTraits = (text) => text.split(/\n\s*\n/).map((p) => Object.keys(MASCOT).filter((k) => MASCOT[k].test(p))).filter((hit) => (hit.includes('egg') && hit.includes('beak')) || hit.length >= 3);
// text files under a plugin folder; a body is the text after the attribution comment (which may name
// the source file it came from)
const textFiles = (dir) => readdirSync(join(PLUGIN, dir), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? textFiles(join(dir, e.name)) : [join(dir, e.name)])).filter((f) => /\.(md|js|mjs|html|json|svg|css|txt)$/.test(f));
const bodyOf = (f) => { const text = readFileSync(join(PLUGIN, f), 'utf8').replaceAll('alchaincyf/huashu-art-motion', 'SOURCE'); return text.startsWith('<!--') ? text.slice(text.indexOf('-->') + 3) : text; };

test('translated grammars and recipes: English bodies, attribution headers, no creator names in names or text', () => {
  const names = NEVER_NAMES;
  const files = [...readdirSync(join(PLUGIN, 'grammars')).map((f) => join('grammars', f)), ...readdirSync(join(PLUGIN, 'recipes')).map((f) => join('recipes', f))].filter((f) => f.endsWith('.md'));
  const huashu = files.filter((f) => readFileSync(join(PLUGIN, f), 'utf8').includes('alchaincyf/huashu-art-motion @ 9ff59339f934e08483ba0a5b1db20f4c2c421b35'));
  assert.equal(huashu.length, 19, huashu.join(', '));   // 9 grammars + 10 recipes
  for (const f of files) {
    assert.doesNotMatch(f, names, f);
    // the source repository's own name is the attribution, not a style name
    const body = bodyOf(f);
    assert.doesNotMatch(body, /[　-鿿＀-￯]/, `${f}: Chinese text outside the header`);
    assert.doesNotMatch(body, names, f);
  }
  // the same names in the kit, the styles, the templates and the examples (everything a piece is
  // built from), and no description of a known channel's mascot anywhere
  const parts = ['kit', 'styles', 'templates', 'examples'].flatMap(textFiles);
  assert.ok(parts.length > 80, `${parts.length} files`);
  for (const f of [...files, ...parts]) {
    assert.doesNotMatch(f, names, f);
    const m = names.exec(bodyOf(f));
    assert.ok(!m, `${f}: "${m && m[0]}"`);
    assert.deepEqual(mascotTraits(bodyOf(f)), [], `${f}: describes a known channel's mascot (egg body, big white eyes, forward pupils, triangular beak)`);
  }
});

test('the name scan is not vacuous: asset paths, fan-work names and the mascot recipe are caught', () => {
  for (const s of ['import "lib/rig_huashu.js"', 'demos/_shared/hero/walk.png', 'long_scroll/frames/001.png', 'assets/角色/a.png', 'a Clawd cameo', 'MARIO-style coins', 'a Nintendo look']) assert.match(s, NEVER_NAMES, s);
  assert.deepEqual(mascotTraits('A critter: egg-shaped body, big white eyes, one simple triangular feature (a beak, a nose or a horn).'), [['egg', 'eyes', 'beak']]);
  assert.equal(mascotTraits('An oval body with big white eyes, small black pupils set toward the front.').length, 1);
  assert.equal(mascotTraits('Wings are leaf shapes one step darker; huge white eyes; a triangular nose.').length, 1);
  assert.deepEqual(mascotTraits('A round robot.\n\nIts beak is triangular.\n\nAn egg-shaped stone.'), [], 'traits in separate paragraphs');
});

test('a built piece carries none of the never-ship names (every demo, template and example, built)', () => {
  const pieces = [...STYLES.map((s) => [`styles/${s}/demo`]), ['templates/piece'], ['templates/beat-cut'], ['templates/blank'], ['examples/water-cycle'], ['examples/style-match', 'piece']];
  for (const [rel, sub] of pieces) {
    const d = copy(rel);
    try {
      const { file, board } = build(sub ? join(d, sub) : d);
      for (const f of [file, board]) { const m = NEVER_NAMES.exec(readFileSync(f, 'utf8')); assert.ok(!m, `${rel}: "${m && m[0]}"`); }
    } finally { rmSync(d, { recursive: true, force: true }); }
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
