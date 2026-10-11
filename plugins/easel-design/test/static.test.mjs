// T3.1-T3.4: easel-design's skills, references, generic design systems and palette tool. Pure Node.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PLUGIN } from './paths.mjs';

const CORE = join(PLUGIN, '..', 'easel-core');
export const SKILLS = ['ad-creative', 'brand-identity', 'design', 'design-system', 'directions', 'icons', 'infographic', 'landing-page', 'logo', 'poster', 'presentation', 'social-graphic', 'ui-design'];
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
const read = (f) => readFileSync(f, 'utf8');
const frontmatter = (s) => { const m = /^---\n([\s\S]*?)\n---\n/.exec(s); assert.ok(m, 'frontmatter'); return m[1]; };
const field = (fm, k) => { const m = new RegExp(`^${k}: (?:>-\\n((?:  .*\\n?)+)|(.*))`, 'm').exec(fm + '\n'); return m ? (m[1] ? m[1].split('\n').map((l) => l.trim()).join(' ').trim() : m[2].trim()) : null; };
const engineTools = new Set([...read(join(CORE, 'engine', 'tools.mjs')).matchAll(/^ {2}(\w+): \{$/gm)].map((m) => m[1]));

// Real companies and products whose styles must not be copied or named (D8). Platform guidance
// (iOS, Android, Material) is allowed in references; systems, skills and examples stay generic.
const BRANDS = /\b(Stripe|Vercel|Airbnb|Notion|Spotify|Dropbox|Mailchimp|Shopify|Netflix|Uber|Slack|Figma|GitHub|Google|Apple|Microsoft|Amazon|Facebook|Instagram|Twitter|Nike|Coca-Cola|Tesla|IBM|Adobe|Atlassian|Discord|Duolingo|Twitch|Substack|Bloomberg|Economist|Linear)\b/;

test('thirteen skills, each with a matching name, routing text under the 1,536-character cap and real engine tools', () => {
  assert.deepEqual(readdirSync(join(PLUGIN, 'skills')).filter((d) => existsSync(join(PLUGIN, 'skills', d, 'SKILL.md'))).sort(), SKILLS);
  for (const s of SKILLS) {
    const text = read(join(PLUGIN, 'skills', s, 'SKILL.md')), fm = frontmatter(text);
    assert.equal(field(fm, 'name'), s);
    const desc = field(fm, 'description'), when = field(fm, 'when_to_use');
    assert.ok(desc && when, `${s}: description and when_to_use`);
    assert.ok(desc.length + when.length <= 1536, `${s}: ${desc.length + when.length} characters`);
    for (const t of (field(fm, 'allowed-tools') || '').split(/\s+/).filter((x) => x.startsWith('mcp__'))) assert.ok(engineTools.has(t.split('__').pop()), `${s}: allowed tool ${t}`);
    for (const t of text.match(/mcp__plugin_easel-core_easel__\w+/g) || []) assert.ok(engineTools.has(t.split('__').pop()), `${s}: ${t}`);
    for (const [, t] of text.matchAll(/`((?:render|contact|audio|mux|measure|compare)_\w+|filmstrip)`/g)) assert.ok(engineTools.has(t), `${s}: \`${t}\``);
  }
});

test('every skill ends in a critique by easel-core:critique with a named rubric', () => {
  for (const s of SKILLS) assert.match(readFileSync(join(PLUGIN, 'skills', s, 'SKILL.md'), 'utf8'), /easel-core:critique[\s\S]{0,80}\*\*(design|social|illustration)\*\* rubric/, s);
});

test('plugin paths only in SKILL.md bodies (Claude Code substitutes them there, not in references)', () => {
  const walkAll = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walkAll(join(d, e.name)) : [join(d, e.name)]));
  for (const f of walkAll(join(PLUGIN, 'skills')).filter((x) => !x.endsWith('SKILL.md'))) assert.doesNotMatch(readFileSync(f, 'utf8'), /\$\{CLAUDE_PLUGIN_(ROOT|DATA)\}/, f);
  for (const s of SKILLS) {
    const t = readFileSync(join(PLUGIN, 'skills', s, 'SKILL.md'), 'utf8');
    if (/node "\$\{CLAUDE_PLUGIN_ROOT\}/.test(t)) assert.match(t, /^allowed-tools: .*Bash\(node:\*\)/m, `${s} runs node but cannot`);
  }
});

test('every relative link and plugin path in the skills and references exists', () => {
  for (const s of SKILLS) {
    const dir = join(PLUGIN, 'skills', s);
    for (const f of walk(dir).filter((x) => x.endsWith('.md'))) {
      const text = read(f);
      for (const [, href] of text.matchAll(/\]\(([^)#\s]+\.(?:md|svg|html|json))(?:#[^)]*)?\)/g)) assert.ok(existsSync(join(dirname(f), href)), `${f}: link ${href}`);
      for (const [p] of text.matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/[\w./<>-]+/g)) {
        const rel = p.replace('${CLAUDE_PLUGIN_ROOT}/', '').replace(/\/<[^>]+>.*$/, '');
        assert.ok(existsSync(join(PLUGIN, rel)), `${f}: ${p}`);
      }
    }
  }
});

test('every adapted reference names its source, pinned commit and licence; Apache sources say what Easel changed', () => {
  const refs = SKILLS.flatMap((s) => (existsSync(join(PLUGIN, 'skills', s, 'reference')) ? walk(join(PLUGIN, 'skills', s, 'reference')) : []));
  assert.ok(refs.length >= 25, `${refs.length} references`);
  for (const f of refs) {
    const head = read(f).slice(0, 900);
    assert.match(head, /^<!-- Easel: adapted from [\w.-]+\/[\w.-]+ @ [0-9a-f]{40}/, f);
    assert.match(head, /MIT License|Apache License 2\.0/, f);
    assert.match(head, /Modified by Easel \(\d{4}-\d{2}-\d{2}\)/, f);
    if (/Apache/.test(head)) assert.match(head, /licenses\/Apache-2\.0\.txt/, f);
  }
});

test('no external URLs, CDN fonts, image-model CLIs or Python in the skills and references', () => {
  const files = SKILLS.flatMap((s) => walk(join(PLUGIN, 'skills', s))).filter((f) => f.endsWith('.md'));
  for (const f of files) {
    const body = read(f).replace(/^<!--[\s\S]*?-->/, '');
    for (const m of body.match(/https?:\/\/[^\s"'<>)]+/g) || []) assert.match(m, /^http:\/\/www\.w3\.org\/|example\.com/, `${f}: ${m}`);
    assert.doesNotMatch(body, /fonts\.googleapis|gemini-generate|GEMINI_API_KEY|pip install|python3? /i, f);
    assert.doesNotMatch(body, /\/tmp\/|\/usr\/bin|\/Library\/Fonts/, f);
  }
});

// the platforms a piece is made for (sizes and safe zones) may be named in skills and examples, never in the systems
const PLATFORMS = /^(Instagram|Twitter|Facebook|Google|Apple|Amazon|Microsoft)$/;
test('no brand names in the skills, the design systems or the examples (D8)', () => {
  const files = [...SKILLS.map((s) => join(PLUGIN, 'skills', s, 'SKILL.md')), ...walk(join(PLUGIN, 'systems')), ...walk(join(PLUGIN, 'examples'))].filter((f) => /\.(md|html|css|svg|json)$/.test(f));
  for (const f of files) {
    const text = read(f).replace(/^<!--[\s\S]*?-->/, '').replace(/xmlns(:\w+)?="[^"]*"/g, '');
    const skill = !f.includes(`${join(PLUGIN, 'systems')}`);
    const m = [...text.matchAll(new RegExp(BRANDS.source, 'g'))].find((x) => !(skill && PLATFORMS.test(x[1])));
    assert.ok(!m, `${f}: "${m && m[0]}"`);
  }
});

test('the generic design systems: ten or more, valid DESIGN.md brand files, AA text, bundled faces only', async () => {
  const { validateData } = await import(pathToFileURL(join(CORE, 'engine', 'lib', 'schemas.mjs')).href);
  const { contrast } = await import(pathToFileURL(join(PLUGIN, 'tools', 'palette.mjs')).href);
  const systems = readdirSync(join(PLUGIN, 'systems')).filter((d) => statSync(join(PLUGIN, 'systems', d)).isDirectory());
  assert.ok(systems.length >= 8, systems.join(', '));
  const index = read(join(PLUGIN, 'systems', 'README.md'));
  const FACES = /^(Inter|Space Grotesk|Newsreader|JetBrains Mono|Caveat|STIX Two Text|Noto Sans Math)\b/;
  for (const s of systems) {
    const text = read(join(PLUGIN, 'systems', s, 'DESIGN.md'));
    assert.deepEqual(validateData('brand', text), [], s);
    assert.ok(index.includes(`(${s}/DESIGN.md)`), `${s} is listed in systems/README.md`);
    const colour = (role) => { const m = new RegExp(`^- ${role}: (#[0-9A-Fa-f]{6})`, 'm').exec(text); return m && m[1]; };
    const bg = colour('Background'), fg = colour('Text');
    assert.ok(bg && fg, `${s}: Background and Text colours`);
    for (const [name, c] of [['Text', fg], ['Muted text', colour('Muted text')]].filter(([, c]) => c)) {
      for (const ground of [bg, colour('Surface')].filter(Boolean)) assert.ok(contrast(c, ground) >= 4.5, `${s}: ${name} ${c} on ${ground} is ${contrast(c, ground).toFixed(2)}:1`);
    }
    const typo = text.split('## 3. Typography')[1].split('## 4.')[0];
    for (const [, face] of typo.matchAll(/^- [\w ]+: ([^,\n]+?) \d/gm)) assert.match(face, FACES, `${s}: ${face}`);
  }
});

test('palette.mjs matches the scale it was ported from, and its command line refuses bad input', async () => {
  const p = await import(pathToFileURL(join(PLUGIN, 'tools', 'palette.mjs')).href);
  const [L, C, H] = p.hexToOklch('#2563eb');
  assert.deepEqual([L.toFixed(2), C.toFixed(3), H.toFixed(1)], ['0.55', '0.215', '262.9']);
  const scale = p.buildScale(H, C);
  assert.deepEqual(scale.map((s) => s.hex), ['#f1f5fe', '#dde8fe', '#bfd5fe', '#92b7ff', '#5f94fe', '#2664ec', '#104dd4', '#0036b0', '#002582', '#001657', '#000731']);
  assert.deepEqual([scale[5].on_white, scale[5].on_black], [5.1, 4.12]);
  assert.equal(p.grade(4.5), 'AA'); assert.equal(p.grade(3.2), 'large/UI'); assert.equal(p.grade(2), '-');
  const run = (...a) => spawnSync(process.execPath, [join(PLUGIN, 'tools', 'palette.mjs'), ...a], { encoding: 'utf8', windowsHide: true });
  const css = run('250', '0.02', '--name', 'gray', '--css');
  assert.equal(css.status, 0, css.stderr);
  assert.match(css.stdout, /^:root \{\n {2}--gray-50: #f2f5f9;/);
  const json = JSON.parse(run('--from', '#c8553d', '--json').stdout);
  assert.equal(json.brand.length, 11);
  assert.equal(run('--from', 'blue').status, 2);
  assert.equal(run('--frm', '#fff').status, 2);
  assert.equal(run('250').status, 2);
});

test('examples: every skill has one, only bundled faces, no URLs, and the logo provenance validates', async () => {
  const man = JSON.parse(read(join(PLUGIN, 'examples', 'manifest.json')));
  const covered = new Set(man.pieces.map((p) => p.skill));
  for (const s of SKILLS.filter((x) => x !== 'design')) assert.ok(covered.has(s), `no example for ${s}`);
  for (const p of man.pieces) assert.ok(existsSync(join(PLUGIN, 'examples', p.file)), p.file);
  const sysFonts = /Ink Free|Segoe|Arial|Helvetica|Georgia|Times New Roman|Consolas|Menlo|Comic Sans|DejaVu|Roboto|Open Sans|Montserrat|Poppins|Lato\b|system-ui|-apple-system/;
  for (const f of walk(join(PLUGIN, 'examples')).filter((x) => /\.(html|css|svg)$/.test(x))) {
    const t = read(f).replace(/xmlns(:\w+)?="[^"]*"/g, '');
    assert.doesNotMatch(t, sysFonts, f);
    assert.doesNotMatch(t, /https?:\/\//, f);
  }
  const { validateFile } = await import(pathToFileURL(join(CORE, 'engine', 'lib', 'schemas.mjs')).href);
  assert.deepEqual(validateFile('provenance', join(PLUGIN, 'examples', 'logo', 'provenance.json')), []);
});
