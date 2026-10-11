#!/usr/bin/env node
// Easel: adapted from cth9191/animate @ 7e5eb56feb2dd573f890e1b7b34748af43d58263
// (github.com/cth9191/animate, plugins/animate/skills/animate/tools/build.mjs).
// MIT License, Copyright (c) 2026 cth9191; full text in THIRD_PARTY_NOTICES.md.
// Modified by Easel (2026-10-11): also writes board.html (the storyboard page); paths follow the easel-motion layout (kit/ and styles/ at the
// plugin root); styles can mix: piece.json "mix" adds more styles, each wrapped in its own scope as
// KITS.<name> (upstream put every kit's names in one global scope, so two kits collided), and an era
// picks its style with a 4th ERA_LIST item; the build is a function (build(dir)) that throws, so it
// can be tested, with the same command line as before.
//
// Assemble <piece>/index.html from the piece's src/ parts, this plugin's kit/ and the piece's style kit, then check it.
//   usage: node <easel-motion>/tools/build.mjs <piece dir>
// Order comes from <piece>/piece.json "build" (the whole list) or "scenes" (replaces src/scenes.js only), default:
//   head, kit/core, style, scenes, bridges, kit/morph (the renderer), kit/board, kit/score-head, score, kit/score-tail
// Part names:
//   "kit/<file>"            this plugin's kit/
//   "style"                 the kit.js of the style named by piece.json "style" (default "cut-paper"), then every
//                           style in piece.json "mix", each wrapped as KITS.<name> (see "Mixing styles" below)
//   "styles/<name>/<file>"  a file of a named style
//   anything else           relative to the piece dir
// A style is found in a styles/<name>/ folder beside the piece or above it, then in this plugin's styles/
// (so a style made for one project, e.g. <project>/styles/my-look/, works for every piece in that project).
// Checks: the script compiles; the style defines STYLE; no data: URIs and no http(s) URLs in the code.
// Generated parts: <piece>/beats.json -> const BEATS (a supplied track's beat map); <piece>/voice.json -> const VOICE (voice-over timing); <piece>/assets/* -> const ASSETS
// (the user's own screenshots and logos, embedded; window.renderFrame appears once they're decoded).
//
// Mixing styles (Easel): piece.json { "style": "cut-paper", "mix": ["riso"] } builds cut-paper as the
// piece's own style (its names are globals, as upstream) and riso inside its own function scope,
// reachable as KITS.riso (every top-level name of riso's kit.js, read live through getters). An era
// drawn in riso is [t0, t1, () => sceneX(), 'riso'] in ERA_LIST; its scene takes the names it needs:
//   function sceneX() { const { hand, PAL } = KITS.riso; ... }
// kit/morph.js draws each era's paper, windows and post() with that era's STYLE hooks.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT = ['src/head.html', 'kit/core.js', 'style', 'src/scenes.js', 'src/bridges.js', 'kit/morph.js', 'kit/board.js', 'kit/score-head.js', 'src/score.js', 'kit/score-tail.js'];

// Top-level names a kit declares (column 0: function, class, const, let, var, including
// `let a = 1, b = 2` and destructuring on the first declarator), exported from a wrapped kit.
export function topLevelNames(code) {
  const names = new Set();
  for (const line of code.split('\n')) {
    let m = line.match(/^(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/) || line.match(/^class\s+([A-Za-z_$][\w$]*)/);
    if (m) { names.add(m[1]); continue; }
    m = line.match(/^(?:const|let|var)\s+(.*)$/);
    if (!m) continue;
    // split the declarators at depth 0, up to the first ';' at depth 0
    let depth = 0, cur = '', q = null;
    const decl = [];
    for (const ch of m[1]) {
      if (q) { cur += ch; if (ch === q) q = null; continue; }
      if (ch === '"' || ch === "'" || ch === '`') { q = ch; cur += ch; continue; }
      if ('([{'.includes(ch)) depth++;
      if (')]}'.includes(ch)) depth--;
      if (depth === 0 && ch === ',') { decl.push(cur); cur = ''; continue; }
      if (depth === 0 && ch === ';') break;
      cur += ch;
    }
    decl.push(cur);
    for (const [i, d] of decl.entries()) {
      const lhs = d.split('=')[0].trim();
      if (/^[A-Za-z_$][\w$]*$/.test(lhs)) names.add(lhs);
      else if (i === 0 && /^[[{]/.test(lhs)) for (const id of lhs.match(/[A-Za-z_$][\w$]*/g) || []) names.add(id);
    }
  }
  return [...names];
}

export function wrapKit(name, code) {
  if (!/\bconst STYLE\s*=/.test(code)) throw new Error(`style "${name}" defines no \`const STYLE = { ... }\``);
  const names = topLevelNames(code).filter((n) => n !== 'STYLE');
  const getters = names.map((n) => `get ${n}() { return ${n}; }`).join(', ');
  return `// ---- style "${name}", mixed in (Easel): its names live under KITS[${JSON.stringify(name)}]
KITS[${JSON.stringify(name)}] = (() => {
${code.replace(/\s*$/, '\n')}const k = { STYLE, ${getters} };
for (const n of Object.keys(k)) void k[n];   // fail at load, not mid-render, if a name is missing
return k;
})();
`;
}

export function build(dir) {
  const ROOT = path.resolve(dir);
  const meta = fs.existsSync(path.join(ROOT, 'piece.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'piece.json'), 'utf8')) : {};
  const styleName = meta.style || 'cut-paper';
  const mix = [...new Set((meta.mix || []).filter((n) => n !== styleName))];
  for (const n of [styleName, ...mix]) if (!/^[a-z0-9][a-z0-9-]*$/.test(n)) throw new Error(`bad style name: ${n}`);
  const warnings = [];
  // a style's folder: the piece's own tree first (walking up), then the plugin
  const styleDir = (name) => {
    for (let d = ROOT; ; d = path.dirname(d)) {
      const c = path.join(d, 'styles', name);
      if (fs.existsSync(path.join(c, 'kit.js'))) return c;
      if (path.dirname(d) === d) break;
    }
    const c = path.join(PLUGIN, 'styles', name);
    if (fs.existsSync(path.join(c, 'kit.js'))) return c;
    const have = fs.readdirSync(path.join(PLUGIN, 'styles')).filter((n) => fs.existsSync(path.join(PLUGIN, 'styles', n, 'kit.js')));
    throw new Error(`unknown style "${name}" (no styles/${name}/kit.js beside the piece or in easel-motion). Styles: ${have.join(', ')}`);
  };
  const resolve = (p) => {
    if (p === 'kit/paper.js') return path.join(PLUGIN, 'styles', 'cut-paper', 'kit.js');   // the v0.1 name
    if (p.startsWith('kit/')) return path.join(PLUGIN, 'kit', p.slice(4));
    const m = p.match(/^styles\/([^/]+)\/(.+)$/);
    if (m && !fs.existsSync(path.join(ROOT, p))) return path.join(styleDir(m[1]), m[2]);
    return path.join(ROOT, p);
  };
  const read = (f) => fs.readFileSync(f, 'utf8').replace(/\s*$/, '\n');
  // "scenes": ["src/era-01.js", ...] swaps src/scenes.js for several files in the default order (one per agent / era)
  const parts = meta.build || (meta.scenes ? DEFAULT.flatMap((p) => (p === 'src/scenes.js' ? meta.scenes : [p])) : DEFAULT);
  if (!parts.includes('style') && mix.length) warnings.push('the build list has no "style" part, so "mix" is ignored');
  let out = '';
  for (const p of parts) {
    if (p === 'style') {
      out += '// ---- styles (Easel): the piece\'s own style is global; mixed-in styles live under KITS.<name>\nconst KITS = {};\n';
      out += read(path.join(styleDir(styleName), 'kit.js'));
      out += `KITS[${JSON.stringify(styleName)}] = { STYLE };\n`;
      for (const n of mix) out += wrapKit(n, read(path.join(styleDir(n), 'kit.js')));
      continue;
    }
    const file = resolve(p);
    if (!fs.existsSync(file)) throw new Error(`missing part: ${p} (${file})`);
    out += read(file);
  }
  const m = out.match(/<script>([\s\S]*)<\/script>/);
  if (!m) throw new Error('no <script> block found');
  if (!/\bconst STYLE\s*=/.test(m[1])) throw new Error('no STYLE hooks: the style kit must define `const STYLE = { ... }` (see styles/cut-paper/kit.js)');
  // the code itself: no data: URIs, no URLs (the user's own assets are added below, from <piece>/assets/ only)
  const bad = out.split('\n').map((l, i) => [i + 1, l]).filter(([, l]) => /data:[a-z]+\/|https?:\/\//i.test(l));
  if (bad.length) throw new Error(`forbidden (data: URI or http URL): ${bad.slice(0, 5).map(([n, l]) => `${n}: ${l.trim().slice(0, 80)}`).join(' | ')}`);

  // ---- generated parts, injected right after "use strict" (before the head's own code runs)
  const inject = [];
  // a supplied music track's beat map (<piece>/beats.json): the head reads BEATS.bpm / BEATS.offset
  const beatsFile = path.join(ROOT, 'beats.json');
  if (fs.existsSync(beatsFile)) inject.push(`// ---- beats.json: the supplied track's tempo, beats, downbeats and hits\nconst BEATS = ${JSON.stringify(JSON.parse(fs.readFileSync(beatsFile, 'utf8')))};`);
  // a voice-over's timing (<piece>/voice.json): lines and word times the scenes cue on
  const voiceFile = path.join(ROOT, 'voice.json');
  if (fs.existsSync(voiceFile)) { const V = JSON.parse(fs.readFileSync(voiceFile, 'utf8')); V.lines.forEach((l) => delete l.take); inject.push(`// ---- voice.json: the voice-over's lines and word times\nconst VOICE = ${JSON.stringify(V)};`); }
  // the user's own assets: screenshots and logos in <piece>/assets/, embedded so the piece stays one file and
  // the canvas stays readable (an image loaded from a file:// URL would taint it and break every check)
  const ASSET_DIR = path.join(ROOT, 'assets'), MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml' };
  const assetFiles = fs.existsSync(ASSET_DIR) ? fs.readdirSync(ASSET_DIR).filter((n) => MIME[n.split('.').pop().toLowerCase()]) : [];
  let assetBytes = 0;
  if (assetFiles.length) {
    const src = {};
    for (const n of assetFiles) { const b = fs.readFileSync(path.join(ASSET_DIR, n)); assetBytes += b.length; src[n] = `data:${MIME[n.split('.').pop().toLowerCase()]};base64,` + b.toString('base64'); }
    inject.push(`// ---- assets/ (embedded by tools/build.mjs): ${assetFiles.join(', ')}\nconst ASSETS = {};\nwindow.ASSETS_READY = Promise.all(Object.entries(${JSON.stringify(src)}).map(([k, u]) => { const i = new Image(); i.src = u; ASSETS[k] = i; return i.decode(); }));`);
  }
  if (inject.length) {
    const at = out.indexOf('"use strict";') >= 0 ? out.indexOf('"use strict";') + '"use strict";'.length : out.indexOf('<script>') + '<script>'.length;
    out = out.slice(0, at) + '\n' + inject.join('\n') + out.slice(at);
  }
  // with assets, tools wait until the images are decoded: window.renderFrame appears only then
  if (assetFiles.length) {
    const end = out.lastIndexOf('</script>');
    out = out.slice(0, end) + '// ---- hold renderFrame until the assets are decoded (the Easel engine waits for ASSETS_READY)\n{ const rf = window.renderFrame; window.renderFrame = undefined; window.ASSETS_READY.then(() => { window.renderFrame = rf; }); }\n' + out.slice(end);
  }
  const m2 = out.match(/<script>([\s\S]*)<\/script>/);
  try { new vm.Script(m2[1], { filename: 'index.html' }); } catch (e) { throw new Error(`syntax error: ${e.message}`); }
  const file = path.join(ROOT, 'index.html');
  fs.writeFileSync(file, out);
  // board.html: the same piece, showing its storyboard (kit/board.js reads EASEL_BOARD)
  const board = path.join(ROOT, 'board.html');
  const bAt = out.indexOf('"use strict";') >= 0 ? out.indexOf('"use strict";') + '"use strict";'.length : out.indexOf('<script>') + '<script>'.length;
  fs.writeFileSync(board, out.slice(0, bAt) + '\nconst EASEL_BOARD = true;   // tools/build.mjs: this page shows the storyboard' + out.slice(bAt));
  if (assetBytes > 12e6) warnings.push(`${(assetBytes / 1e6).toFixed(1)} MB of assets: resize screenshots to the size they're shown at`);
  const extras = [fs.existsSync(beatsFile) ? 'beats.json' : null, fs.existsSync(voiceFile) ? 'voice.json' : null, assetFiles.length ? `${assetFiles.length} asset(s), ${(assetBytes / 1e6).toFixed(1)} MB` : null].filter(Boolean);
  return { file, board, lines: out.split('\n').length, parts: parts.length, style: styleName, mix, extras, warnings };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const dir = process.argv[2];
  if (!dir) { console.error('usage: node tools/build.mjs <piece dir>'); process.exit(2); }
  try {
    const r = build(dir);
    for (const w of r.warnings) console.warn(`warning: ${w}`);
    console.log(`built ${r.file}: ${r.lines} lines from ${r.parts} parts (style: ${r.style}${r.mix.length ? `; mixed in: ${r.mix.join(', ')}` : ''})${r.extras.length ? ' + ' + r.extras.join(' + ') : ''}; syntax ok; no external assets`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
