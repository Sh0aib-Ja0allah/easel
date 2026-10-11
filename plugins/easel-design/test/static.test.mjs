// T3.1-T3.4: easel-design's skills, references, generic design systems and palette tool. Pure Node.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PLUGIN } from './paths.mjs';

const CORE = join(PLUGIN, '..', 'easel-core');
export const SKILLS = ['ad-creative', 'brand-identity', 'design', 'design-system', 'directions', 'icons', 'infographic', 'landing-page', 'logo', 'poster', 'presentation', 'social-graphic', 'ui-design'];
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
const read = (f) => readFileSync(f, 'utf8');
const frontmatter = (s) => { const m = /^---\n([\s\S]*?)\n---\n/.exec(s); assert.ok(m, 'frontmatter'); return m[1]; };
const field = (fm, k) => { const m = new RegExp(`^${k}: (?:>-\\n((?:  .*\\n?)+)|(.*))`, 'm').exec(fm + '\n'); return m ? (m[1] ? m[1].split('\n').map((l) => l.trim()).join(' ').trim() : m[2].trim()) : null; };
const engineTools = new Set([...read(join(CORE, 'engine', 'tools.mjs')).matchAll(/^ {2}(\w+): \{$/gm)].map((m) => m[1]));

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

// Real companies, products and creators whose look must not be copied or named (D8, CLAUDE.md
// naming rule). Matched case-insensitively.
const NEVER = ['Stripe', 'Vercel', 'Airbnb', 'Notion', 'Spotify', 'Revolut', 'Dropbox', 'Mailchimp', 'Shopify', 'Netflix', 'Uber', 'Nike', 'Coca-Cola', 'Tesla', 'IBM', 'Atlassian', 'Discord', 'Duolingo', 'Twitch', 'Substack', 'Bloomberg', 'Economist', 'Linear',
  'Pixar', 'Disney', 'Ghibli', 'Miyazaki', 'Kusama', 'Haring', 'Shinkai', 'Wes Anderson', 'Banksy'];
// Platforms and tools: named only where a file needs them (PLATFORM_OK), never in a system.
const PLATFORMS = ['Google', 'Apple', 'Microsoft', 'Amazon', 'Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'YouTube', 'Pinterest', 'TikTok', 'GitHub', 'Slack', 'Figma', 'Adobe'];
const NAMES = new RegExp(`\\b(${[...NEVER, ...PLATFORMS].map((n) => n.replace(/[-\s]/g, (c) => (c === '-' ? '-' : '\\s+'))).join('|')})\\b`, 'gi');
const canon = (w) => [...NEVER, ...PLATFORMS].find((n) => n.toLowerCase() === w.toLowerCase().replace(/\s+/g, ' '));
// Ordinary words: these lowercase spellings are the common word (a linear scale, a stripe pattern,
// an apple, a notion), unless a style suffix or a possessive turns them into the name.
const ORDINARY = new Set(['linear', 'apple', 'notion', 'stripe', 'slack', 'discord', 'tesla', 'twitch', 'economist']);
const ORDINARY_PHRASES = /\b(?:repeating-)?linear-gradients?\b|\bLinear gradients?\b|-apple-system\b|\bapple-touch-icon\b/g;
// "X-style", "X-like", "X-inspired", "X-esque", "X-ish", "X look", "X's aesthetic": a name used as a look fails everywhere
const AS_A_LOOK = /^(?:[- ](?:style|like|inspired|esque|ish)\b|(?:'s)? (?:look|aesthetic|vibe)\b)/i;
// Where a platform or tool may be named, and why: the sizes, safe zones and rules of the place a
// piece is published, or the tool the user hands their design over in. Paths are plugin-relative.
const PLATFORM_OK = {
  'skills/ad-creative/reference/ad-creative.md': [['Google', 'Facebook', 'Instagram', 'LinkedIn', 'Twitter'], 'ad platforms: sizes, text and file rules'],
  'skills/brand-identity/reference/brand-identity.md': [['Apple', 'Twitter', 'LinkedIn', 'Instagram', 'GitHub', 'Slack'], 'touch-icon and avatar sizes per platform'],
  'skills/design/reference/product-mockup.md': [['Amazon'], "a marketplace's main-image rule"],
  'skills/design-system/reference/design-system.md': [['Figma'], 'exporting tokens to the design tool'],
  'skills/design-system/reference/typography.md': [['Google'], 'where open fonts are published and their licences'],
  'skills/icons/reference/icon-design.md': [['Apple'], 'platform touch-target guidance'],
  'skills/landing-page/reference/hero.md': [['Figma'], "reading the user's design file"],
  'skills/landing-page/reference/landing-page.md': [['Figma'], "reading the user's design file"],
  'skills/logo/reference/ip-and-licensing.md': [['Adobe'], "an AI image vendor's indemnity terms"],
  'skills/poster/reference/poster.md': [['Instagram'], 'the social poster size'],
  'skills/social-graphic/SKILL.md': [['Instagram', 'LinkedIn', 'Facebook', 'Pinterest', 'TikTok', 'YouTube'], 'the platforms it sizes for'],
  'skills/social-graphic/reference/banners.md': [['Apple'], 'which email clients render web fonts'],
  'skills/social-graphic/reference/social-media.md': [['Instagram', 'Twitter', 'LinkedIn', 'Facebook', 'Pinterest', 'TikTok', 'YouTube'], 'platform sizes, safe zones and calls to action'],
  'skills/social-graphic/reference/thumbnails.md': [['YouTube', 'LinkedIn', 'Slack', 'Apple', 'Twitter'], 'thumbnail and link-preview sizes'],
  'skills/ui-design/reference/cards.md': [['Figma'], "reading the user's design file"],
  'skills/ui-design/reference/dark-mode.md': [['Figma'], "reading the user's design file"],
  'skills/ui-design/reference/dashboards.md': [['Figma'], "reading the user's design file"],
  'skills/ui-design/reference/mobile.md': [['Figma', 'Apple'], "reading the user's design file; platform touch-target guidance"],
  'skills/ui-design/reference/ui-design.md': [['Figma', 'Apple'], "reading the user's design file; platform touch-target guidance"],
  'examples/social-graphic/README.md': [['Instagram'], 'the platform the example is sized for'],
  'examples/social-graphic/feed-post-1080x1080.html': [['Instagram'], 'the platform the example is sized for'],
  'examples/social-graphic/story-1080x1920.html': [['Instagram'], 'the platform the example is sized for'],
};
// The brand and creator names in a text, after its attribution comments and XML namespaces.
export function brandFindings(text, rel) {
  const allowed = new Set((PLATFORM_OK[rel.split(sep).join('/')] || [[]])[0]);
  const body = text.replace(/<!--\s*Easel[\s\S]*?-->/g, '').replace(/xmlns(:\w+)?="[^"]*"/g, '').replace(ORDINARY_PHRASES, ' ');
  const found = [];
  for (const m of body.matchAll(NAMES)) {
    const after = body.slice(m.index + m[0].length, m.index + m[0].length + 24), name = canon(m[0]);
    if (AS_A_LOOK.test(after)) { found.push(m[0] + after.match(AS_A_LOOK)[0]); continue; }
    if (ORDINARY.has(m[0]) && !/^'s\b/.test(after)) continue;
    if (PLATFORMS.includes(name) && allowed.has(name)) continue;
    found.push(m[0]);
  }
  return found;
}
// A file or folder named after one, whatever the case or separator ("stripe-like", "Pixar_warm")
const nameFindings = (name) => [...name.toLowerCase().matchAll(new RegExp(`(?<![a-z0-9])(${[...NEVER, ...PLATFORMS].map((n) => n.toLowerCase().replace(/[-\s]/g, '[-_ ]?')).join('|')})(?![a-z0-9])`, 'g'))].map((m) => m[1]);

test('no brand or creator names in the skills, references, design systems or examples, nor in file names (D8)', () => {
  const walkAll = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? [join(d, e.name), ...walkAll(join(d, e.name))] : [join(d, e.name)]));
  const entries = ['skills', 'systems', 'examples'].flatMap((d) => walkAll(join(PLUGIN, d)));
  for (const f of entries) assert.deepEqual(nameFindings(basename(f)), [], relative(PLUGIN, f));
  const files = entries.filter((f) => /\.(md|html|css|svg|json)$/.test(f));
  assert.ok(files.filter((f) => f.includes(`${sep}reference${sep}`)).length >= 25, 'the references are scanned');
  for (const f of files) assert.deepEqual(brandFindings(read(f), relative(PLUGIN, f)), [], relative(PLUGIN, f));
  // every allow-list entry is a real file that still needs it (a stale entry is a hole)
  for (const [rel, [names]] of Object.entries(PLATFORM_OK)) {
    assert.ok(existsSync(join(PLUGIN, rel)), rel);
    const text = read(join(PLUGIN, rel)).replace(/<!--\s*Easel[\s\S]*?-->/g, '');
    for (const n of names) assert.match(text, new RegExp(`\\b${n}\\b`, 'i'), `${rel} no longer names ${n}`);
  }
});

test('the brand lint is not vacuous: looks named after brands or creators fail, platform sizes and ordinary words pass', () => {
  const ref = join('skills', 'design', 'reference', 'graphic-design.md'), social = join('skills', 'social-graphic', 'reference', 'social-media.md');
  for (const s of ['a stripe-like fintech look', 'vercel-style dark', 'Pixar warmth', 'like Notion', 'a Wes Anderson palette', "stripe's checkout", 'a Revolut card', 'Linear-ish', 'a BANKSY wall']) assert.notDeepEqual(brandFindings(s, ref), [], s);
  for (const s of ['an Instagram-style grid', 'the YouTube look', 'Spotify Wrapped colours']) assert.notDeepEqual(brandFindings(s, social), [], s);
  assert.notDeepEqual(brandFindings('Instagram feed 1080x1080', ref), [], 'a platform outside its allowed files');
  assert.notDeepEqual(brandFindings('Instagram feed 1080x1080', join('systems', 'calm-care', 'DESIGN.md')), [], 'a platform in a system');
  assert.deepEqual(brandFindings("Instagram feed 1080x1080; YouTube's duration badge", social), []);
  assert.deepEqual(brandFindings('background: linear-gradient(90deg, #000, #fff); Linear gradient at 200%; animation: spin 1s linear infinite; a stripe pattern; diagonal stripes; font: -apple-system; an apple on the table; the notion of scale; slack in the line', ref), []);
  for (const n of ['stripe-like', 'vercel_dark', 'pixar', 'Wes-Anderson', 'notion.md']) assert.notDeepEqual(nameFindings(n), [], n);
  for (const n of ['social-graphic', 'linearity', 'warm-minimal', 'clean-product', 'stripes.svg']) assert.deepEqual(nameFindings(n), [], n);
});

// The bundled faces, and the face a Typography line names: the text after "- Role:" up to the first
// comma, weight or size ("- Display: Space Grotesk 700, 40-64px" is Space Grotesk; "- Mono: Menlo"
// is Menlo). Scale and rhythm lines name no face (undefined); a line that is not "- Role: ..." is null.
const FACES = /^(Inter|Space Grotesk|Newsreader|JetBrains Mono|Caveat|STIX Two Text|Noto Sans Math)$/;
const SYSTEM_FACES = /Ink Free|Segoe|Arial|Helvetica|Georgia|Times New Roman|Consolas|Menlo|Monaco|Comic Sans|DejaVu|Roboto|Open Sans|Montserrat|Poppins|Lato\b|SF Pro|San Francisco|system-ui|-apple-system/i;
const WEIGHT = /\s+(?=\d|(?:thin|hairline|extra[- ]?light|ultra[- ]?light|light|regular|normal|book|medium|semi[- ]?bold|demi[- ]?bold|bold|extra[- ]?bold|ultra[- ]?bold|black|heavy|italic|oblique)\b)/i;
const faceOf = (line) => {
  const m = /^\s*[-*] ([^:]+):\s*(.*)$/.exec(line);
  if (!m) return null;
  if (/^(scale|ratio|line height|leading|measure|rhythm|tracking)$/i.test(m[1].trim())) return undefined;
  return m[2].split(',')[0].split(WEIGHT)[0].trim();
};

test('the generic design systems: ten or more, valid DESIGN.md brand files, AA text, bundled faces only', async () => {
  const { validateData } = await import(pathToFileURL(join(CORE, 'engine', 'lib', 'schemas.mjs')).href);
  const { contrast } = await import(pathToFileURL(join(PLUGIN, 'tools', 'palette.mjs')).href);
  const systems = readdirSync(join(PLUGIN, 'systems')).filter((d) => statSync(join(PLUGIN, 'systems', d)).isDirectory());
  assert.ok(systems.length >= 8, systems.join(', '));
  const index = read(join(PLUGIN, 'systems', 'README.md'));
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
    // every colour but a ground: a text role ("Text", "... text") passes AA on the grounds; any other
    // colour below AA there says "not for text" (and the system may give its "<role> text" variant)
    const grounds = [bg, colour('Surface')].filter(Boolean);
    for (const [, role, hex, note] of text.split('## 2. Color')[1].split('## 3.')[0].matchAll(/^- ([\w ]+): (#[0-9A-Fa-f]{6})\b(.*)$/gm)) {
      if (/^(Background|Surface|Raised|Border)$/.test(role)) continue;
      const worst = Math.min(...grounds.map((g) => contrast(hex, g)));
      if (/(^|\s)text$/i.test(role)) assert.ok(worst >= 4.5, `${s}: ${role} ${hex} is ${worst.toFixed(2)}:1 on its grounds`);
      else if (worst < 4.5) assert.match(note, /\bnot for (?:body |small )?text\b/i, `${s}: ${role} ${hex} is ${worst.toFixed(2)}:1 on its grounds: say "not for text" or add a "${role} text" colour that passes AA`);
    }
    // every line of the Typography section: the face each role names is a bundled one
    const typo = text.split('## 3. Typography')[1].split('## 4.')[0].split('\n').filter((l) => l.trim());
    assert.ok(typo.length >= 2, `${s}: Typography lines`);
    for (const line of typo) {
      const face = faceOf(line);
      if (face === null) assert.doesNotMatch(line, SYSTEM_FACES, `${s}: ${line}`);
      else if (face !== undefined) assert.match(face, FACES, `${s}: "${line}" names ${face}`);
    }
  }
});

// QA: the font lint only saw lines with a numeric weight
test('the font lint reads every Typography line: a face with no weight, before a comma or with a weight word', () => {
  for (const [line, face] of [['- Body: Arial, 16px / 1.5', 'Arial'], ['- Display: Helvetica Neue Bold, 40px', 'Helvetica Neue'], ['- Mono: Menlo', 'Menlo'], ['- Display: Space Grotesk 700, 40-64px', 'Space Grotesk'], ['- Hand notes: Caveat 400', 'Caveat'], ['- Body: Newsreader Italic, 19px', 'Newsreader'], ['- Data and code: JetBrains Mono', 'JetBrains Mono']]) assert.equal(faceOf(line), face, line);
  for (const line of ['- Body: Arial, 16px / 1.5', '- Display: Helvetica Neue Bold, 40px', '- Mono: Menlo', '- Body: Inter Tight 400']) assert.doesNotMatch(faceOf(line), FACES, line);
  assert.equal(faceOf('- Scale: 1.25 (12, 14, 16, 20)'), undefined);
  assert.match('Headlines in Helvetica, body in Inter.', SYSTEM_FACES, 'prose lines are checked too');
});

// QA: the specimen said 10.9:1 and 4.9:1 for pairs that measure 10.79:1 and 4.71:1
test('every contrast ratio an example states is the measured one (palette.mjs contrast, within 0.05)', async () => {
  const { contrast } = await import(pathToFileURL(join(PLUGIN, 'tools', 'palette.mjs')).href);
  const NAMED = { white: '#ffffff', black: '#000000' };
  let n = 0;
  for (const f of walk(join(PLUGIN, 'examples')).filter((x) => /\.(html|css|svg|md)$/.test(x))) {
    const t = read(f), rel = relative(PLUGIN, f);
    // "#FG / #BG · 10.8:1" (a specimen pair) and "#FG is 4.3:1 on white" (a token comment)
    const claims = [...[...t.matchAll(/(#[0-9A-Fa-f]{6})\s*\/\s*(#[0-9A-Fa-f]{6})\s*(?:&middot;|\u00b7)\s*(\d+(?:\.\d+)?):1/g)].map((m) => [m[1], m[2], m[3]]),
      ...[...t.matchAll(/(#[0-9A-Fa-f]{6}) is (\d+(?:\.\d+)?):1 on (white|black|#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], NAMED[m[3]] || m[3], m[2]])];
    for (const [fg, bg, said] of claims) {
      n++;
      const real = contrast(fg, bg);
      assert.ok(Math.abs(real - Number(said)) <= 0.05, `${rel}: ${fg} on ${bg} is ${real.toFixed(2)}:1, the page says ${said}:1`);
    }
  }
  assert.ok(n >= 7, `${n} claims`);
  // the specimen's swatches: the number under each step is its contrast on white, to two decimals
  const spec = read(join(PLUGIN, 'examples', 'design-system', 'specimen.html'));
  const sw = [...spec.matchAll(/background:(#[0-9a-f]{6})"><b>\d+<\/b><span>\1<br>(\d+\.\d\d)<\/span>/gi)];
  assert.equal(sw.length, 33);
  for (const [, hex, said] of sw) assert.ok(Math.abs(contrast(hex, '#ffffff') - Number(said)) <= 0.006, `${hex}: ${contrast(hex, '#ffffff').toFixed(2)}, the swatch says ${said}`);
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
