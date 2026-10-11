#!/usr/bin/env node
// Start a new style folder for style-match: <dir>/kit.js (from the blank template or the closest shipped
// style) and a STYLE.md skeleton with the sections a style needs. Never overwrites.
//   usage: node <easel-motion>/tools/new-style.mjs <project>/styles/<name> [--from blank|<shipped style>]
// A piece uses it with "style": "<name>" in piece.json: tools/build.mjs finds styles/<name>/ beside the
// piece or in any folder above it. Name the style after the look (e.g. "blueprint"), never after a
// person, a studio or a brand.
// Part of Easel (MIT). Uses only Node built-ins.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SKELETON = (name, from) => `# ${name}

<!-- Made with easel-motion style-match on ${new Date().toISOString().slice(0, 10)}, starting from ${from}. Fill every section; delete none. -->

## The look

One paragraph: the medium, the mood, what a stranger would call it (in descriptive words; no artist,
studio or brand names).

## Measured (from the references, with measure_image)

| What | Value | Means |
|---|---|---|
| Ground | | |
| Line | | |
| Accent | | |
| Line weight | px at 1080 wide, relative to the subject | |
| Texture | | |
| Type | bundled family, size as % of height | |

## Motion

On 1s or 2s; easing; what moves when nothing happens.

## Frame checklist (on top of grammars/frame.md)

1.
2.
3.

## Kit API

\`styles/${name}/kit.js\`: the functions a scene calls, and the \`STYLE\` hooks.

## Do / don't

- **Do**
- **Don't**

## Not matched

What still differs from the references, on purpose or not.

## Proven on

The pieces this style has carried.
`;

export function newStyle(dir, { from = 'blank' } = {}) {
  const D = path.resolve(dir), name = path.basename(D);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) throw new Error(`style folder name must be lower-case words joined by "-": ${name}`);
  if (path.basename(path.dirname(D)) !== 'styles') throw new Error(`put the style in a folder called styles/ (got ${path.dirname(D)}), so build.mjs can find it`);
  if (fs.existsSync(path.join(D, 'kit.js'))) throw new Error(`${D} already has a kit.js; not overwriting it`);
  const src = from === 'blank' ? path.join(PLUGIN, 'templates', 'style', 'kit.js') : path.join(PLUGIN, 'styles', from, 'kit.js');
  if (!fs.existsSync(src)) throw new Error(`unknown starting kit "${from}" (blank, or a shipped style)`);
  fs.mkdirSync(D, { recursive: true });
  let kit = fs.readFileSync(src, 'utf8');
  kit = kit.replace(/(\bconst STYLE\s*=\s*\{\s*\n?\s*name:\s*)'[^']*'/, `$1'${name}'`);
  fs.writeFileSync(path.join(D, 'kit.js'), `// style "${name}", made with easel-motion style-match from ${from === 'blank' ? 'templates/style/kit.js' : `styles/${from}/kit.js`} (MIT; see that file's header).\n${kit}`);
  fs.writeFileSync(path.join(D, 'STYLE.md'), SKELETON(name, from === 'blank' ? 'the blank kit' : `the ${from} kit`));
  return { dir: D, name, from };
}

// run as a command (also when started through a symlink or a differently cased path on Windows)
const isMain = (() => {
  if (!process.argv[1]) return false;
  try {
    const a = fs.realpathSync(process.argv[1]), b = fs.realpathSync(fileURLToPath(import.meta.url));
    return process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b;
  } catch { return false; }
})();
if (isMain) {
  const args = process.argv.slice(2), dir = args[0], fi = args.indexOf('--from');
  const rest = args.slice(1);
  if (!dir || dir.startsWith('--') || !(rest.length === 0 || (rest.length === 2 && rest[0] === '--from' && !rest[1].startsWith('--')))) { console.error('usage: node tools/new-style.mjs <project>/styles/<name> [--from blank|<shipped style>]'); process.exit(2); }
  try { const r = newStyle(dir, { from: fi >= 0 ? args[fi + 1] : 'blank' }); console.log(`new style "${r.name}" in ${r.dir} (from ${r.from})`); } catch (e) { console.error(e.message); process.exit(1); }
}
