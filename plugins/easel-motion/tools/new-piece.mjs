#!/usr/bin/env node
// Start a new animate piece: copy a style's demo (or a starter template) into a job folder, set
// piece.json, and make its head format-aware so one piece renders in every format it lists.
//   usage: node <easel-motion>/tools/new-piece.mjs <dest dir> [--style riso] [--from demo|piece|beat-cut]
//                                                  [--formats 9:16,16:9] [--title "..."] [--mix a,b]
// --from demo (default): the style's own demo, whose scenes already speak its kit. "piece" and
// "beat-cut" are the starter templates (their scenes are drawn with the cut-paper kit, so they take
// --style cut-paper; mix other styles in with --mix).
// Formats: the demo heads are written for 9:16 (W = 1080, H = 1920). With any other format listed,
// the head gets the template's FORMATS block (W, H, SAFE and CX per format, from window.__easel.aspect
// under the engine or ?format= in a browser) and the canvas CSS that keeps its real aspect.
// Scenes still place things in 1080x1920 coordinates until you lay them out with LX / LY / UNIT.
// Part of Easel (MIT). Uses only Node built-ins; never overwrites an existing piece.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const FORMATS = ['9:16', '16:9', '1:1', '4:5'];

const FORMAT_BLOCK = `const FORMATS = { '9:16': [1080, 1920], '4:5': [1080, 1350], '1:1': [1080, 1080], '16:9': [1920, 1080] };
// the format: the Easel engine says which one it renders in window.__easel.aspect; ?format=16:9 in a browser
const FORMAT = new URLSearchParams(location.search).get('format') || (window.__easel && window.__easel.aspect) || PIECE_FORMATS[0];
const FPS = 24, [W, H] = FORMATS[FORMAT];
{ const cv = document.getElementById('c'); cv.width = W; cv.height = H; }`;
const SAFE_BLOCK = `const SAFE = { '9:16': { top: 240, bottom: 420, right: 140 }, '4:5': { top: 80, bottom: 160, right: 60 }, '1:1': { top: 60, bottom: 110, right: 60 }, '16:9': { top: 60, bottom: 110, right: 60 } }[FORMAT];   // the platform UI per format`;
const CANVAS_CSS = '  canvas { max-width: 100vw; max-height: 100vh; width: auto; height: auto; display: block; cursor: pointer; }';

// Make a 9:16-only head format-aware. Throws if the head does not have the lines it expects.
export function formatAwareHead(head, formats) {
  // already format-aware (templates/piece): only the main format changes
  if (head.includes('const FORMATS =')) return head.replace("(window.__easel && window.__easel.aspect) || '9:16'", `(window.__easel && window.__easel.aspect) || ${JSON.stringify(formats[0])}`);
  const swap = (re, by, what) => { if (!re.test(head)) throw new Error(`head.html: cannot find ${what} to make it format-aware`); head = head.replace(re, by); };
  swap(/^const FPS = 24, W = 1080, H = 1920;.*$/m, `const PIECE_FORMATS = ${JSON.stringify(formats)};   // piece.json "formats" (the first is the main one)\n${FORMAT_BLOCK}`, 'const FPS = 24, W = 1080, H = 1920');
  swap(/^const SAFE = \{ top: 240, bottom: 420, right: 140 \};.*$/m, SAFE_BLOCK, 'const SAFE');
  swap(/^const CX = \d+;.*$/m, 'const CX = (W - SAFE.right) / 2;   // caption centre (left of the right-hand UI strip on 9:16)', 'const CX');
  swap(/^ {2}canvas \{ height: min\(100vh, calc\(100vw \* 16 \/ 9\)\); width: auto; aspect-ratio: 9 \/ 16; display: block; cursor: pointer;( image-rendering: pixelated;)? \}$/m,
    (m, px) => CANVAS_CSS.replace(' }', `${px || ''} }`), 'the 9:16 canvas CSS');
  head = head.replace(/^(\s*width: W, height: H, fps: FPS,)/m, '$1 aspect: FORMAT,');
  return head;
}

export function newPiece(dest, { style = 'cut-paper', from = 'demo', formats = ['9:16'], title, mix = [] } = {}) {
  const D = path.resolve(dest);
  if (fs.existsSync(path.join(D, 'piece.json'))) throw new Error(`${D} already has a piece.json; not overwriting it`);
  if (!fs.existsSync(path.join(PLUGIN, 'styles', style, 'kit.js'))) throw new Error(`unknown style "${style}"`);
  for (const f of formats) if (!FORMATS.includes(f)) throw new Error(`unknown format "${f}" (use ${FORMATS.join(', ')})`);
  const srcDir = from === 'demo' ? path.join(PLUGIN, 'styles', style, 'demo') : path.join(PLUGIN, 'templates', from);
  if (!fs.existsSync(path.join(srcDir, 'piece.json'))) throw new Error(`unknown starting point "${from}" (use demo, piece or beat-cut)`);
  // the starter templates' scenes are drawn with the cut-paper kit
  if (from !== 'demo' && style !== 'cut-paper') throw new Error(`the ${from} template is drawn in cut-paper; for ${style}, start from its demo (--from demo), or use --style cut-paper and mix ${style} in (--mix ${style})`);
  fs.mkdirSync(D, { recursive: true });
  fs.cpSync(path.join(srcDir, 'src'), path.join(D, 'src'), { recursive: true });
  for (const f of ['brief.md', 'LOG.md']) if (fs.existsSync(path.join(srcDir, f))) fs.copyFileSync(path.join(srcDir, f), path.join(D, f));
  const meta = JSON.parse(fs.readFileSync(path.join(srcDir, 'piece.json'), 'utf8'));
  const name = path.basename(D).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'piece';
  const piece = { ...meta, name, title: title || meta.title, style, formats, ...(mix.length ? { mix } : {}) };
  delete piece.build;
  fs.writeFileSync(path.join(D, 'piece.json'), JSON.stringify(piece, null, 2) + '\n');
  const headFile = path.join(D, 'src', 'head.html');
  let head = fs.readFileSync(headFile, 'utf8');
  if (formats.length > 1 || formats[0] !== '9:16') head = formatAwareHead(head, formats);
  if (title) head = head.replace(/<title>[^<]*<\/title>/, `<title>${title.replace(/[<&]/g, '')}</title>`);
  fs.writeFileSync(headFile, head);
  return { dir: D, piece, from: path.relative(PLUGIN, srcDir).split(path.sep).join('/') };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2), opt = {};
  const dest = args.shift();
  for (let i = 0; i < args.length; i += 2) opt[args[i].replace(/^--/, '')] = args[i + 1];
  if (!dest || dest.startsWith('--')) { console.error('usage: node tools/new-piece.mjs <dest dir> [--style riso] [--from demo|piece|beat-cut] [--formats 9:16,16:9] [--title "..."] [--mix a,b]'); process.exit(2); }
  try {
    const r = newPiece(dest, { style: opt.style, from: opt.from, formats: opt.formats ? opt.formats.split(',') : undefined, title: opt.title, mix: opt.mix ? opt.mix.split(',') : [] });
    console.log(`new piece in ${r.dir} from ${r.from}: style ${r.piece.style}${r.piece.mix ? ` (+ ${r.piece.mix.join(', ')})` : ''}, formats ${r.piece.formats.join(', ')}`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
