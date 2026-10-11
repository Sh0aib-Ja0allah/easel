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

const skillText = (s) => read(join(PLUGIN, 'skills', s, 'SKILL.md'));
const bodyOf = (s) => skillText(s).replace(/^---\n[\s\S]*?\n---\n/, '');
// A SKILL.md body as its steps and paragraphs (a numbered or bulleted item with its wrapped lines).
const items = (s) => bodyOf(s).split(/\n(?=\s*(?:\d+\.|-) )|\n\s*\n/).map((x) => x.replace(/\s+/g, ' ').trim()).filter(Boolean);
const QA = 'mcp__plugin_easel-core_easel__qa';
const refsOf = (s) => (existsSync(join(PLUGIN, 'skills', s, 'reference')) ? walk(join(PLUGIN, 'skills', s, 'reference')) : []);

test('every engine tool a SKILL.md body names is in its allowed-tools', () => {
  for (const s of SKILLS) {
    const allowed = new Set((field(frontmatter(skillText(s)), 'allowed-tools') || '').split(/\s+/));
    for (const t of new Set(bodyOf(s).match(/mcp__plugin_easel-core_easel__\w+/g) || [])) assert.ok(allowed.has(t), `${s}: ${t} is used but not allowed`);
  }
});

// QA (Q-07): qa ran at its default 1200x630 with no frame check, so an overflowing 1080x1350 post passed
const FIXED = ['ad-creative', 'brand-identity', 'design', 'directions', 'infographic', 'poster', 'presentation', 'social-graphic'];
test('fixed-size skills run qa at the piece\'s width and height with fixedFrame: true; page skills at their width', () => {
  for (const s of FIXED) {
    const qa = items(s).filter((x) => x.includes(QA));
    assert.ok(qa.length, `${s}: a qa step`);
    for (const x of qa) for (const want of [/\bwidth\b/, /\bheight\b/, /fixedFrame: true/]) assert.match(x, want, `${s}: ${x}`);
    for (const f of refsOf(s)) for (const line of read(f).split('\n').filter((l) => l.includes(QA) && /checks/.test(l))) assert.match(line, /fixedFrame: true/, `${relative(PLUGIN, f)}: ${line.slice(0, 120)}`);
  }
  for (const s of ['landing-page', 'ui-design', 'design-system']) for (const x of items(s).filter((y) => y.includes(QA))) assert.match(x, /\bwidth\b/, `${s}: ${x}`);
});

// QA (Q-08): approved HTML pages lost their bundled fonts in the user's browser
test('skills that deliver HTML embed its fonts (embed_fonts on the page, the -embedded.html delivered); SVG skills keep D32', () => {
  for (const s of ['ad-creative', 'brand-identity', 'landing-page', 'presentation', 'ui-design']) {
    assert.match(field(frontmatter(skillText(s)), 'allowed-tools'), /mcp__plugin_easel-core_easel__embed_fonts/, s);
    const x = items(s).find((y) => /embed_fonts\b.{0,60}\.html/.test(y));
    assert.ok(x, `${s}: runs embed_fonts on the HTML page`);
    assert.match(bodyOf(s), /-embedded\.html/, s);
  }
  assert.match(items('ad-creative').find((y) => /embed_fonts/.test(y)), /\bKB\b/, 'ad-creative: the size the fonts add against the network cap');
  for (const s of ['brand-identity', 'logo']) {
    assert.match(bodyOf(s), /-embedded\.svg/, s);
    // embedding helps browsers; editors and slide apps need the font installed or the text outlined (Q-33)
    const x = items(s).filter((y) => /embed_fonts/.test(y)).join(' ');
    assert.match(x, /browsers?/, s);
    assert.match(x, /outline/, s);
    assert.doesNotMatch(x, /in their tools|Figma|slides/i, s);
  }
});

// QA (Q-30): graphic-mode contrast findings shipped, the dark theme was never checked, disabled
// controls were refused, and three references said qa measures icon and button contrast
test('qa steps fix every contrast finding, check the dark theme too, and claim no non-text measurement', () => {
  for (const s of SKILLS) {
    for (const x of items(s).filter((y) => y.includes(QA) && /contrast/.test(y))) assert.match(x, /every contrast finding/, `${s}: ${x}`);
    if (/theme: "both"/.test(bodyOf(s))) assert.match(bodyOf(s), new RegExp(`${QA}[^\\n]*[\\s\\S]{0,400}theme: "dark"`), `${s} renders a dark theme but never runs qa on it`);
  }
  const ui = read(join(PLUGIN, 'skills', 'ui-design', 'reference', 'ui-design.md'));
  assert.match(ui, /aria-disabled="true"/);
  assert.match(ui, /exempt/);
  assert.doesNotMatch(ui, /disabled:pointer-events-none/, 'the reference says not to add pointer-events: none');
  assert.match(bodyOf('ui-design'), /aria-disabled/);
  for (const s of SKILLS) {
    for (const f of [join(PLUGIN, 'skills', s, 'SKILL.md'), ...refsOf(s)]) {
      for (const line of read(f).split('\n').filter((l) => /\bqa\b|easel__qa/.test(l) && /non-text|UI shapes|CTA button|button against|icons?'? (?:own )?contrast/i.test(l)))
        assert.match(line, /text only|by hand/, `${relative(PLUGIN, f)}: qa measures text, not shapes: ${line.slice(0, 140)}`);
    }
  }
});

// QA (Q-31): the bundled weights are 400 and 700 (Inter also 900); 500 and 600 render as 400 and 700
test('skills that name the bundled faces name the bundled weights', () => {
  for (const s of SKILLS.filter((x) => /otherwise a bundled face/.test(bodyOf(x)))) assert.match(bodyOf(s), /400 and 700 \(Inter also 900\)/, s);
});

// QA (Q-33): logo and design details
test('logo, poster, directions, social-graphic and infographic: sizes, small-size sheet, bleed, feed-size sheet, SMIL', () => {
  const logo = bodyOf('logo');
  assert.match(logo, /render_still`[^.]*`sizes: \[\{width: 16, height: 16/, 'logo: render_still sizes as {width, height, name}');
  assert.match(logo, /image-rendering: pixelated/, 'logo: an enlarged small-size sheet');
  for (const s of ['poster', 'directions']) assert.match(bodyOf(s), /data-easel-bleed/, s);
  assert.match(items('social-graphic').find((y) => /contact_sheet/.test(y)), /PNGs? as (?:the )?items/, 'social-graphic: the feed-size sheet takes the rendered PNGs');
  assert.match(bodyOf('infographic'), /filmstrip/, 'infographic: an entrance animation is checked with filmstrip');
  assert.match(read(join(PLUGIN, 'skills', 'infographic', 'reference', 'infographic.md')), /<animate>[^\n]*filmstrip/, 'infographic reference: SMIL checked with filmstrip');
});

// QA (Q-29, Q-41): one tie-break sentence in each skill of an overlapping pair
test('routing tie-breaks with the skills in other plugins that claim the same words', () => {
  for (const [s, phrase, other] of [['logo', /favicon or app icon/, 'easel-illustrate:svg'], ['icons', /\ban icon\b/i, 'easel-illustrate:svg'], ['infographic', /\ba chart\b/i, 'easel-illustrate:svg'], ['design', /product shot/, 'easel-ai-media:image']]) {
    const when = field(frontmatter(skillText(s)), 'when_to_use');
    const sentence = when.split(/(?<=\.)\s+/).find((x) => phrase.test(x) && x.includes(other));
    assert.ok(sentence, `${s}: a sentence naming ${phrase} and ${other}`);
  }
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
// naming rule, including CLAUDE.md's own examples). Matched case-insensitively, after folding
// accents and typographic punctuation; a space or hyphen in a name may be written as either or
// left out ("Coca Cola", "Wes-Anderson", "air-bnb").
const NEVER = ['Stripe', 'Vercel', 'Air bnb', 'Notion', 'Spotify', 'Revolut', 'Dropbox', 'Mailchimp', 'Shopify', 'Netflix', 'Uber', 'Nike', 'Coca-Cola', 'Tesla', 'IBM', 'Atlassian', 'Discord', 'Duolingo', 'Twitch', 'Substack', 'Bloomberg', 'Economist', 'Linear',
  'Pixar', 'Disney', 'Ghibli', 'Miyazaki', 'Kusama', 'Haring', 'Shinkai', 'Wes Anderson', 'Banksy', 'Vox', 'Kirby', 'Dalí', 'Mario', 'Nintendo', 'Clawd', 'Kurzgesagt'];
// Platforms and tools: named only where a file needs them (PLATFORM_OK), never in a system.
const PLATFORMS = ['Google', 'Apple', 'Microsoft', 'Amazon', 'Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'YouTube', 'Pinterest', 'TikTok', 'GitHub', 'Slack', 'Figma', 'Adobe'];
// Accents off (Dalí -> Dali), curly quotes straight, every dash a hyphen, no-break spaces plain.
const fold = (s) => s.normalize('NFKD').replace(/\p{M}/gu, '').replace(/[‘’ʼ]/g, "'").replace(/[‐-―−]/g, '-').replace(/[  ]/g, ' ');
const key = (s) => fold(s).toLowerCase().replace(/[-\s_]+/g, '');
const pattern = (sep) => [...NEVER, ...PLATFORMS].map((n) => fold(n).split(/[-\s]+/).join(sep)).join('|');
// The name, then a glued look suffix ("stripeish", "Linear-ish", "notion_like") if there is one.
const NAMES = new RegExp(`(?<![\\p{L}\\p{N}])(${pattern('[-\\s_]*')})((?:[-_]?(?:style|like|inspired|esque|ish))?)(?![\\p{L}\\p{N}])`, 'giu');
const canon = (w) => [...NEVER, ...PLATFORMS].find((n) => key(n) === key(w));
// Ordinary words: these lowercase spellings are the common word (a linear scale, a stripe pattern,
// an apple, a notion), unless a style suffix, a possessive or "in the style of" turns them into the name.
const ORDINARY = new Set(['linear', 'apple', 'notion', 'stripe', 'slack', 'discord', 'tesla', 'twitch', 'economist']);
const ORDINARY_PHRASES = /\b(?:repeating-)?linear-gradients?\b|\bLinear gradients?\b|-apple-system\b|\bapple-touch-icon\b/g;
// "X-style", "X-like", "X-inspired", "X-esque", "X-ish", "X look", "X's aesthetic": a name used as a look fails everywhere
const AS_A_LOOK = /^(?:[- ](?:style|like|inspired|esque|ish)\b|(?:'s)? (?:look|aesthetic|vibe|feel)\b)/i;
// "in the style of X", "styled after X", "inspired by X", "like X": the same, written before the name
const STYLED_AFTER = /(?:in the (?:style|manner|spirit) of|styled (?:after|on|like)|inspired by|modell?ed (?:on|after)|(?:a|à) la|reminiscent of|the (?:look|feel|vibe|aesthetic) of|(?:looks?|feels?|just) like|like)\s+(?:an?\s+|the\s+)?$/i;
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
// The brand and creator names in a text, after its attribution comments, XML namespaces and
// base64 data (an embedded font is not text).
const DATA_URI = /data:[\w/+.-]+;base64,[A-Za-z0-9+/=]+/g;
export function brandFindings(text, rel) {
  const allowed = new Set((PLATFORM_OK[rel.split(sep).join('/')] || [[]])[0]);
  const body = fold(text).replace(/<!--\s*Easel[\s\S]*?-->/g, '').replace(/xmlns(:\w+)?="[^"]*"/g, '').replace(DATA_URI, '').replace(ORDINARY_PHRASES, ' ');
  const found = [];
  for (const m of body.matchAll(NAMES)) {
    const end = m.index + m[0].length, after = body.slice(end, end + 24), name = canon(m[1]);
    if (m[2]) { found.push(m[0]); continue; }
    if (AS_A_LOOK.test(after)) { found.push(m[0] + after.match(AS_A_LOOK)[0]); continue; }
    if (STYLED_AFTER.test(body.slice(Math.max(0, m.index - 40), m.index))) { found.push(m[0]); continue; }
    if (ORDINARY.has(m[1]) && !/^'s\b/.test(after)) continue;
    if (PLATFORMS.includes(name) && allowed.has(name)) continue;
    found.push(m[0]);
  }
  return found;
}
// A file or folder named after one, whatever the case or separator ("stripe-like", "Pixar_warm",
// "air-bnb"), with a glued look suffix too ("stripeish", "notionlike")
const nameFindings = (name) => [...fold(name).toLowerCase().matchAll(new RegExp(`(?<![a-z0-9])(${pattern('[-_ ]*')})(?:[-_ ]?(?:style|like|inspired|esque|ish))?(?![a-z0-9])`, 'giu'))].map((m) => m[1]);

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

// QA (Q-32): CLAUDE.md's own examples, typographic punctuation, lowercase "in the style of", spacing
// variants and glued suffixes all passed the lint
test('the brand lint catches CLAUDE.md\'s names, curly apostrophes, dashes, spacing variants and glued suffixes', () => {
  const ref = join('skills', 'design', 'reference', 'graphic-design.md');
  for (const s of ['a Vox-style explainer', 'Mario-style pipes', 'Kirby-pink cheeks', 'a Dalí-esque melt', 'a Dali-esque melt', 'a Nintendo palette', 'Ghibli skies', 'a Kusama dot field', 'Haring figures', 'a Shinkai sunset',
    'stripe’s aesthetic', 'notion’s aesthetic', 'in the style of stripe', 'styled after notion', 'linear–like', 'linear—ish', 'Coca Cola red', 'CocaCola red', 'Wes-Anderson symmetry', 'an air-bnb card', 'an Air BnB card', 'stripeish gradients', 'a notionlike page', 'like Stripe'])
    assert.notDeepEqual(brandFindings(s, ref), [], s);
  for (const n of ['stripeish', 'notionlike', 'air-bnb', 'Air_BnB', 'vox-explainer', 'mario_pipes', 'dalí-melt', 'kirby', 'nintendo-palette', 'coca cola']) assert.notDeepEqual(nameFindings(n), [], n);
  // the ordinary words stay ordinary
  for (const s of ['a stripe pattern', 'a linear scale', 'the notion of scale', 'slack in the line', 'a linear-gradient wash', 'stripes and dots', 'a voxel grid', 'Mariolatry']) assert.deepEqual(brandFindings(s, ref), [], s);
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

const { contrast } = await import(pathToFileURL(join(PLUGIN, 'tools', 'palette.mjs')).href);
// Every line of a system's Color section is "- Role: #RRGGBB (note)" (or #RGB) or the Contrast line;
// any other line is reported, never skipped. A text role ("Text", "Muted text", "Link-text") passes
// AA on the grounds (Background, Surface); any other colour below AA there says "not for text".
export function colourFindings(text) {
  const out = [], roles = [];
  const section = (text.split(/^## 2\. Colou?r\b.*$/m)[1] || '').split(/^## 3\./m)[0];
  for (const line of section.split('\n').filter((l) => l.trim())) {
    const m = /^- ([^:]+?): #([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})(?![0-9A-Za-z])(.*)$/.exec(line);
    if (m) roles.push({ role: m[1].trim(), hex: `#${m[2].length === 3 ? [...m[2]].map((c) => c + c).join('') : m[2]}`, note: m[3] });
    else if (!/^- Contrast: [^#]*$/.test(line)) out.push(`not a colour line: "${line}" (write "- Role: #RRGGBB (note)")`);
  }
  const hex = (r) => (roles.find((x) => x.role === r) || {}).hex;
  const grounds = [hex('Background'), hex('Surface')].filter(Boolean);
  if (!hex('Background') || !hex('Text')) return [...out, 'needs Background and Text colours'];
  for (const { role, hex: c, note } of roles) {
    if (/^(Background|Surface|Raised|Border)$/.test(role)) continue;
    const worst = Math.min(...grounds.map((g) => contrast(c, g)));
    if (/(^|[\s-])text\b/i.test(role)) { if (worst < 4.5) out.push(`${role} ${c} is ${worst.toFixed(2)}:1 on its grounds`); }
    else if (worst < 4.5 && !/\bnot for (?:body |small )?text\b/i.test(note)) out.push(`${role} ${c} is ${worst.toFixed(2)}:1 on its grounds: say "not for text" or add a "${role} text" colour that passes AA`);
  }
  return out;
}

// The bundled faces (easel-core/fonts/fonts.json): a weight or italic no face has renders as another
// weight (500 as 400, 600 as 700) or a slanted copy, so a system or example may name only real faces.
const BUNDLED = JSON.parse(read(join(CORE, 'fonts', 'fonts.json'))).faces.map((f) => ({ family: f.family.toLowerCase(), weight: f.weight, style: f.style || 'normal' }));
const WEIGHT_WORDS = { thin: 100, hairline: 100, extralight: 200, ultralight: 200, light: 300, regular: 400, normal: 400, book: 400, medium: 500, semibold: 600, demibold: 600, bold: 700, extrabold: 800, ultrabold: 800, black: 900, heavy: 900 };
const GENERIC_FAMILY = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-\w+|math|emoji|inherit|initial|unset)$/i;
const faceExists = (family, weight, style = 'normal') => BUNDLED.some((f) => f.family === family.toLowerCase() && (weight === undefined || f.weight === weight) && f.style === style);
const weightsOf = (family) => [...new Set(BUNDLED.filter((f) => f.family === family.toLowerCase()).map((f) => f.weight))].join(', ');
// A Typography line: "- Display: Space Grotesk 600, 32-48px" names Space Grotesk at 600.
export function typographyWeightFindings(line) {
  const face = faceOf(line);
  if (!face || !BUNDLED.some((f) => f.family === face.toLowerCase())) return [];
  const rest = /^\s*[-*] [^:]+:\s*(.*)$/.exec(line)[1].split(',')[0].slice(face.length).toLowerCase().replace(/[-\s]+(?=bold|light)/g, '');
  const num = /\b([1-9]00)\b/.exec(rest), word = Object.keys(WEIGHT_WORDS).find((w) => new RegExp(`\\b${w}\\b`).test(rest));
  const weight = num ? Number(num[1]) : word ? WEIGHT_WORDS[word] : undefined, style = /\b(italic|oblique)\b/.test(rest) ? 'italic' : 'normal';
  return (weight === undefined && style === 'normal') || faceExists(face, weight, style) ? [] : [`${face} ${weight || ''}${style === 'italic' ? ' italic' : ''} is not bundled (${face}: ${weightsOf(face)}${BUNDLED.some((f) => f.family === face.toLowerCase() && f.style === 'italic') ? ', italic' : ''})`];
}
// An example's CSS and SVG: every font-weight and font-style it names, in a rule, a style attribute,
// a font shorthand or an SVG attribute, against the family named beside it (custom properties
// resolved), or, where the rule names none, against every bundled family the file uses.
export function exampleWeightFindings(text) {
  const vars = new Map([...text.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+)/g)].map((m) => [m[1], m[2].trim()]));
  const sub = (v, depth = 0) => (depth > 4 ? v : v.replace(/var\((--[\w-]+)(?:,([^)]*))?\)/g, (_, n, d) => sub(vars.get(n) ?? d ?? '', depth + 1)));
  const first = (list) => (sub(list).match(/"[^"]+"|'[^']+'|[^,]+/g) || []).map((s) => s.trim().replace(/^["']|["']$/g, '')).find((s) => s && !GENERIC_FAMILY.test(s));
  const blocks = [...text.matchAll(/\{([^{}]*)\}/g), ...text.matchAll(/\bstyle="([^"]*)"/g)].map((m) => m[1]);
  const decls = blocks.map((b) => {
    const d = {};
    for (const part of b.split(';')) {
      const m = /^\s*(font-family|font-weight|font-style|font)\s*:\s*(.+?)\s*$/i.exec(part);
      if (!m) continue;
      const v = sub(m[2]);
      if (m[1] === 'font-family') d.family = first(v);
      else if (m[1] === 'font-weight') d.weight = v;
      else if (m[1] === 'font-style') d.style = v;
      else {
        // font: [style] [weight] size[/line-height] family
        const s = /^((?:[\w-]+\s+)*?)(\d*\.?\d+(?:px|r?em|%|pt|vw|vh|ch)|(?:x+-)?(?:small|large)|medium|smaller|larger)(?:\s*\/\s*\S+)?\s+(.+)$/i.exec(v);
        if (!s) continue;
        d.family = first(s[3]);
        for (const tok of s[1].split(/\s+/).filter(Boolean)) { if (/^([1-9]00|bold|normal)$/i.test(tok)) d.weight ??= tok; else if (/^(italic|oblique)$/i.test(tok)) d.style = tok; }
      }
    }
    return d;
  });
  for (const m of text.matchAll(/<[a-z]+\b[^>]*\bfont-(?:weight|style|family)="[^>]*>/gi)) {
    const a = (k) => (new RegExp(`\\bfont-${k}="([^"]+)"`).exec(m[0]) || [])[1];
    decls.push({ family: a('family') && first(a('family')), weight: a('weight'), style: a('style') });
  }
  const used = [...new Set(decls.map((d) => d.family).filter((f) => f && BUNDLED.some((b) => b.family === f.toLowerCase())))];
  const out = [];
  for (const d of decls) {
    const fams = d.family && BUNDLED.some((b) => b.family === d.family.toLowerCase()) ? [d.family] : used;
    if (!fams.length) continue;
    const w = d.weight && (/^\d+$/.test(d.weight) ? Number(d.weight) : { normal: 400, bold: 700 }[d.weight.toLowerCase()]);
    if (w && !fams.some((f) => faceExists(f, w))) out.push(`font-weight ${d.weight} (${fams.map((f) => `${f}: ${weightsOf(f)}`).join('; ')})`);
    if (d.style && /italic|oblique/i.test(d.style) && !fams.some((f) => faceExists(f, undefined, 'italic'))) out.push(`font-style ${d.style} (${fams.join(', ')} has no italic face)`);
  }
  return out;
}

test('the generic design systems: ten or more, valid DESIGN.md brand files, AA text, bundled faces and weights only', async () => {
  const { validateData } = await import(pathToFileURL(join(CORE, 'engine', 'lib', 'schemas.mjs')).href);
  const systems = readdirSync(join(PLUGIN, 'systems')).filter((d) => statSync(join(PLUGIN, 'systems', d)).isDirectory());
  assert.ok(systems.length >= 8, systems.join(', '));
  const index = read(join(PLUGIN, 'systems', 'README.md'));
  for (const s of systems) {
    const text = read(join(PLUGIN, 'systems', s, 'DESIGN.md'));
    assert.deepEqual(validateData('brand', text), [], s);
    assert.ok(index.includes(`(${s}/DESIGN.md)`), `${s} is listed in systems/README.md`);
    assert.deepEqual(colourFindings(text), [], s);
    // every line of the Typography section: the face each role names is a bundled one, in a bundled weight
    const typo = text.split('## 3. Typography')[1].split('## 4.')[0].split('\n').filter((l) => l.trim());
    assert.ok(typo.length >= 2, `${s}: Typography lines`);
    for (const line of typo) {
      const face = faceOf(line);
      if (face === null) assert.doesNotMatch(line, SYSTEM_FACES, `${s}: ${line}`);
      else if (face !== undefined) assert.match(face, FACES, `${s}: "${line}" names ${face}`);
      assert.deepEqual(typographyWeightFindings(line), [], `${s}: ${line}`);
    }
  }
});

// QA (Q-32): a role with "-" or "(" or a 3-digit hex was never checked
test('the colour lint reads every Color line: roles with hyphens or brackets, 3-digit hex, and lines it cannot parse', () => {
  const sys = (lines) => `## 2. Color\n- Background: #FFFFFF (page)\n- Surface: #F5F5F5 (cards)\n- Text: #111111 (body)\n${lines.join('\n')}\n- Contrast: body text meets WCAG AA (4.5:1)\n\n## 3. Typography\n`;
  assert.deepEqual(colourFindings(sys(['- Muted text: #555 (captions)', '- Accent: #FFB020 (shapes; not for text)', '- Link-text: #1A5FB4 (links)'])), []);
  for (const bad of ['- Link-text: #9AB8B5 (links)', '- Accent (CTA): #FFB020 (buttons)', '- Muted text: #999 (captions)', '- Primary #2F5BEA (buttons)', '- Glass: #CCCCCC80 (panels)', '- Accent: teal, #1E8C93', '- Secondary: rgb(30, 140, 147)'])
    assert.notDeepEqual(colourFindings(sys([bad])), [], bad);
  assert.notDeepEqual(colourFindings('## 2. Color\n- Background: #FFFFFF\n\n## 3. Typography\n'), [], 'no Text colour');
});

// QA (Q-31): systems and examples named 500 and 600, which are not bundled and render as 400 and 700
test('the weight lint: Typography lines and example CSS name only bundled weights of their family', () => {
  for (const line of ['- Display: Space Grotesk 600, 32-48px', '- Labels: Inter 500, 11px', '- Display: Newsreader SemiBold, 64px', '- Body: Newsreader Italic, 19px', '- Notes: Caveat 900'])
    assert.notDeepEqual(typographyWeightFindings(line), [], line);
  for (const line of ['- Display: Space Grotesk 700, 32-48px', '- Body: Inter 400, 16px', '- Display: Inter 900', '- Quote: STIX Two Text Italic, 22px', '- Mono: JetBrains Mono', '- Body: Arial, 16px', '- Scale: 1.25'])
    assert.deepEqual(typographyWeightFindings(line), [], line);
  for (const css of ['.a { font-family: "Space Grotesk"; font-weight: 600 }', '.a{font-family:"JetBrains Mono",monospace;font-weight:500}', ':root{--sans:"Inter"} .b { font: 600 15px/1 var(--sans) }',
    '.c { font-family: "Newsreader"; font-style: italic }', '<p style="font-family:Inter;font-weight:500">x</p>', '<text font-family="Space Grotesk" font-weight="600">P</text>', 'body{font-family:"Inter"} .d { font-weight: 300 }', '.e { font: italic 400 19px/1.5 "Newsreader", serif }'])
    assert.notDeepEqual(exampleWeightFindings(css), [], css);
  for (const css of ['.a { font-family: "Space Grotesk"; font-weight: 700 }', ':root{--sans:"Inter"} .b { font: 900 15px/1 var(--sans) }', 'body{font-family:"Inter"} .d { font-weight: bold }', '.q { font: italic 700 22px "STIX Two Text" }', '.n { font-style: normal; font-weight: 400 }', '<text font-family="Space Grotesk" font-weight="700">P</text>'])
    assert.deepEqual(exampleWeightFindings(css), [], css);
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
  // QA (DS-20): --from moved the brand colour itself (#0F7B6C became #1e8374 at step 500)
  for (const brand of ['#0F7B6C', '#c8553d', '#2563eb', '#FFB020']) {
    const steps = JSON.parse(run('--from', brand, '--json').stdout).brand;
    const kept = steps.find((s) => s.hex === brand.toLowerCase());
    assert.ok(kept, `${brand} is a step of its own scale`);
    assert.equal(kept.on_white, Math.round(p.contrast(brand, '#ffffff') * 100) / 100);
    assert.ok(steps.every((s, i) => i === 0 || p.hexToOklch(s.hex)[0] < p.hexToOklch(steps[i - 1].hex)[0]), `${brand}: lightness still falls step by step`);
  }
  // QA (Q-30): a non-text pair (an icon, a button shape) is checked by hand with --contrast
  const pair = run('--contrast', '#E4E8ED', '#FFF');
  assert.equal(pair.status, 0, pair.stderr);
  assert.match(pair.stdout, /^1\.23:1 /);
  assert.deepEqual(JSON.parse(run('--contrast', '#20706B', '#F7FAF9', '--json').stdout), { fg: '#20706b', bg: '#f7faf9', contrast: 5.57, grade: 'AA' });
  assert.equal(run('--contrast', '#fff').status, 2);
});

test('examples: every skill has one, only bundled faces, no URLs, and the logo provenance validates', async () => {
  const man = JSON.parse(read(join(PLUGIN, 'examples', 'manifest.json')));
  const covered = new Set(man.pieces.map((p) => p.skill));
  for (const s of SKILLS.filter((x) => x !== 'design')) assert.ok(covered.has(s), `no example for ${s}`);
  for (const p of man.pieces) assert.ok(existsSync(join(PLUGIN, 'examples', p.file)), p.file);
  const sysFonts = /Ink Free|Segoe|Arial|Helvetica|Georgia|Times New Roman|Consolas|Menlo|Comic Sans|DejaVu|Roboto|Open Sans|Montserrat|Poppins|Lato\b|system-ui|-apple-system/;
  for (const f of walk(join(PLUGIN, 'examples')).filter((x) => /\.(html|css|svg)$/.test(x))) {
    const t = read(f).replace(/xmlns(:\w+)?="[^"]*"/g, '').replace(DATA_URI, '');
    assert.doesNotMatch(t, sysFonts, f);
    assert.doesNotMatch(t, /https?:\/\//, f);
    assert.deepEqual(exampleWeightFindings(t), [], relative(PLUGIN, f));
  }
  // the weights the examples' prose names ("Space Grotesk 600" in a note) are real faces too
  for (const f of walk(join(PLUGIN, 'examples')).filter((x) => /\.(html|md|json)$/.test(x))) {
    for (const [, fam, w] of fold(read(f)).matchAll(/\b(Inter|Space Grotesk|Newsreader|JetBrains Mono|Caveat|STIX Two Text|Noto Sans Math) ([1-9]00)\b/g)) assert.ok(faceExists(fam, Number(w)), `${relative(PLUGIN, f)}: ${fam} ${w} is not bundled (${weightsOf(fam)})`);
  }
  const { validateFile } = await import(pathToFileURL(join(CORE, 'engine', 'lib', 'schemas.mjs')).href);
  assert.deepEqual(validateFile('provenance', join(PLUGIN, 'examples', 'logo', 'provenance.json')), []);
});

// QA (Q-33, D32): no example carried an SVG with its fonts embedded
test('the logo example delivers its wordmark lock-up as an -embedded.svg that carries every face its text uses', () => {
  const dir = join(PLUGIN, 'examples', 'logo', 'export');
  const bare = read(join(dir, 'lockup.svg')), emb = read(join(dir, 'lockup-embedded.svg'));
  assert.match(bare, /<text\b/);
  assert.doesNotMatch(bare, /@font-face/);
  const faces = [...emb.matchAll(/@font-face\{font-family:'([^']+)';src:url\(data:font\/woff2;base64,[A-Za-z0-9+/=]{1000,}\) format\('woff2'\);font-weight:(\d+);font-style:(\w+);\}/g)].map((m) => `${m[1]} ${m[2]} ${m[3]}`);
  // every <text> run's family and weight (attributes or the bare file's own CSS) has its face inside
  const runs = [...bare.matchAll(/<text\b[^>]*>/g)].map((m) => { const a = (k) => (new RegExp(`\\b${k}="([^"]+)"`).exec(m[0]) || [])[1]; return `${(a('font-family') || '').split(',')[0].replace(/["']/g, '').trim()} ${a('font-weight') || 400} ${a('font-style') || 'normal'}`; });
  assert.ok(runs.length, 'text runs');
  for (const r of runs) assert.ok(faces.includes(r), `${r} is not embedded (${faces.join('; ')})`);
  assert.equal(emb.replace(/\n<style>\n\/\* Embedded by Easel embed_fonts[\s\S]*?<\/style>/, ''), bare, 'the embedded copy is the lock-up plus its fonts');
  const man = JSON.parse(read(join(PLUGIN, 'examples', 'manifest.json')));
  assert.ok(man.pieces.some((p) => p.file === 'logo/export/lockup-embedded.svg'), 'the manifest renders and checks it');
  const prov = JSON.parse(read(join(PLUGIN, 'examples', 'logo', 'provenance.json'))).assets.map((a) => a.file);
  for (const f of ['export/lockup.svg', 'export/lockup-embedded.svg']) assert.ok(prov.includes(f), `provenance: ${f}`);
});
