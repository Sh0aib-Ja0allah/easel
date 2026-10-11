// T3.5-T3.7: easel-illustrate's skills, references, attribution and the SVG checker. Pure Node.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PLUGIN } from './paths.mjs';

const CORE = join(PLUGIN, '..', 'easel-core');
const SKILLS = ['concept-illustration', 'generative-art', 'illustrate', 'svg', 'svg-illustration'];
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
const read = (f) => readFileSync(f, 'utf8');
const field = (fm, k) => { const m = new RegExp(`^${k}: (?:>-\\n((?:  .*\\n?)+)|(.*))`, 'm').exec(fm + '\n'); return m ? (m[1] ? m[1].split('\n').map((l) => l.trim()).join(' ').trim() : m[2].trim()) : null; };
const engineTools = new Set([...read(join(CORE, 'engine', 'tools.mjs')).matchAll(/^ {2}(\w+): \{$/gm)].map((m) => m[1]));
// Source characters, creators, studios and brands whose look must not be named or copied, and the
// fonts the sources used (case-insensitive). 小黑 sits outside \b, which needs a word character.
const NAMES = /\b(xiaohei|peanut|ghibli|kusama|haring|shinkai|kirby|mario|nintendo|vox|dali|pixar|disney|miyazaki|wes anderson|banksy|studio ghibli|kurzgesagt|vercel|airbnb|spotify|revolut|anthropic branding|Poppins|Lora)\b|小黑/i;
// accents, curly quotes, dashes and no-break spaces folded before matching ("Dalí-esque", "Kirby‑pink")
const fold = (t) => t.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[\u2018\u2019\u201b\u2032]/g, "'").replace(/[\u2010-\u2015\u2212]/g, '-').replace(/[\u00a0\u202f]/g, ' ');
// a brand or platform used as a look ("stripe-like", "Instagram-style"), even where the word is ordinary
const AS_A_LOOK = /\b(stripe|notion|linear|apple|figma|instagram|google|slack|github)[- ](?:style|like|inspired|esque|ish)\b/i;

test('five skills with matching names, routing text under the cap, real engine tools, links that resolve', () => {
  assert.deepEqual(readdirSync(join(PLUGIN, 'skills')).filter((d) => existsSync(join(PLUGIN, 'skills', d, 'SKILL.md'))).sort(), SKILLS);
  for (const s of SKILLS) {
    const text = read(join(PLUGIN, 'skills', s, 'SKILL.md')), fm = /^---\n([\s\S]*?)\n---\n/.exec(text)[1];
    assert.equal(field(fm, 'name'), s);
    const len = field(fm, 'description').length + field(fm, 'when_to_use').length;
    assert.ok(len <= 1536, `${s}: ${len}`);
    for (const t of (field(fm, 'allowed-tools') || '').split(/\s+/).filter((x) => x.startsWith('mcp__'))) assert.ok(engineTools.has(t.split('__').pop()), `${s}: ${t}`);
    for (const f of walk(join(PLUGIN, 'skills', s)).filter((x) => x.endsWith('.md'))) {
      const body = read(f);
      for (const t of body.match(/mcp__plugin_easel-core_easel__\w+/g) || []) assert.ok(engineTools.has(t.split('__').pop()), `${f}: ${t}`);
      for (const [, href] of body.matchAll(/\]\(([^)#\s]+\.(?:md|svg|html|js))(?:#[^)]*)?\)/g)) assert.ok(existsSync(join(dirname(f), href)), `${f}: ${href}`);
      for (const [p] of body.matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/[\w./-]+/g)) assert.ok(existsSync(join(PLUGIN, p.replace('${CLAUDE_PLUGIN_ROOT}/', ''))), `${f}: ${p}`);
    }
  }
});

test('adapted files name their source, commit and licence; Apache sources say what Easel changed', () => {
  const files = SKILLS.flatMap((s) => walk(join(PLUGIN, 'skills', s))).filter((f) => /\.(md|html|js)$/.test(f));
  let adapted = 0;
  for (const f of files) {
    const text = read(f), m = /Easel: (?:the [\w ,()-]+ (?:is|are|follows?) )?adapted from|Easel: [\s\S]{0,200}?adapted from|follows? [\w/-]+ @ [0-9a-f]{40}/.exec(text.slice(0, 2800));
    if (!m) { assert.match(text.slice(0, 600), /Easel's own|Easel generative-art viewer \(MIT, Easel's own\)/, `${f}: no attribution or "Easel's own" note`); continue; }
    adapted++;
    const head = text.slice(0, 2800);
    assert.match(head, /[\w.-]+\/[\w.-]+ @ [0-9a-f]{40}/, f);
    assert.match(head, /MIT License|Apache License 2\.0/, f);
    assert.match(head, /Modified by Easel \(\d{4}-\d{2}-\d{2}\)|This file is Easel's/, f);
    if (/Apache License 2\.0/.test(head)) assert.match(head, /licenses\/Apache-2\.0\.txt/, f);
  }
  assert.ok(adapted >= 14, `${adapted} adapted files`);
  assert.ok(existsSync(join(PLUGIN, 'licenses', 'Apache-2.0.txt')));
  for (const s of ['Aishwarya Ashok', 'Copyright (c) 2026 Ian', 'Anthropic, PBC', 'SVG Creator Skill Contributors', 'svg-skill contributors', 'Will Curran']) assert.ok(read(join(PLUGIN, 'NOTICE.md')).includes(s), `NOTICE.md: ${s}`);
});

test('no source characters, branded styling, external URLs, Python or shell-only steps in the skills', () => {
  for (const f of SKILLS.flatMap((s) => walk(join(PLUGIN, 'skills', s)))) {
    // only the attribution comment is skipped (it must name its source); the frontmatter is scanned too
    const body = fold(read(f).replace(/<!--\s*Easel[\s\S]*?-->/, ''));
    assert.doesNotMatch(body, NAMES, f);
    assert.doesNotMatch(body, AS_A_LOOK, f);
    for (const m of body.match(/https?:\/\/[^\s"'<>)]+/g) || []) assert.match(m, /^http:\/\/www\.w3\.org\/|^https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/p5\.js\/1\.11\.13\/p5\.min\.js$|example\.com/, `${f}: ${m}`);
    assert.doesNotMatch(body, /python3? |pip install|svg_loop\.py|validate\.sh|xmllint|\/tmp\/|\/usr\/bin|\/home\/claude|\/mnt\/user-data/, f);
  }
  assert.doesNotMatch(read(join(PLUGIN, 'skills', 'concept-illustration', 'reference', 'mascot.md')), /peanut|xiaohei/i);
  // file and folder names too, whatever the separator
  const all = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? [e.name, ...all(join(d, e.name))] : [e.name]));
  for (const n of [...all(join(PLUGIN, 'skills')), ...all(join(PLUGIN, 'examples'))]) { assert.doesNotMatch(n.replace(/[-_]/g, ' '), NAMES, n); assert.doesNotMatch(n.replace(/_/g, '-'), AS_A_LOOK, n); }
});

test('the name lint is not vacuous: creators, studios, brands and brand looks fail in any case', () => {
  for (const s of ['a Miyazaki forest', 'a BANKSY stencil', 'Wes Anderson symmetry', 'pixar warmth', 'like the xiaohei cat', '小黑 style', 'a Vercel card', 'a Vox-style explainer', 'Dalí-esque clocks', 'Mario-style hero', 'Kirby\u2011pink', 'a Nintendo palette']) assert.match(fold(s), NAMES, s);
  assert.match(fold('a Stripe\u2011like card'), AS_A_LOOK);
  for (const s of ['a stripe-like card', 'Instagram-style grid', 'notion-ish', 'Figma-inspired']) assert.match(s, AS_A_LOOK, s);
  for (const s of ['feFuncR type="linear"', 'animation: spin 1s linear infinite', 'a striped stripe pattern', 'material simulation']) { assert.doesNotMatch(s, NAMES, s); assert.doesNotMatch(s, AS_A_LOOK, s); }
  assert.match('pixar-look'.replace(/[-_]/g, ' '), NAMES);
});

test('every skill ends in a critique by easel-core:critique with a named rubric', () => {
  for (const s of SKILLS) assert.match(read(join(PLUGIN, 'skills', s, 'SKILL.md')), /easel-core:critique[\s\S]{0,80}\*\*(illustration|design)\*\* rubric/, s);
});

test('the corrected bar chart: every bar on the baseline, heights proportional to the data', () => {
  const svg = read(join(PLUGIN, 'examples', 'svg', 'bar-chart.svg'));
  const base = Number(/<line[^>]*\by1="([\d.]+)"[^>]*\by2="\1"/.exec(svg)[1]);
  const bars = [...svg.matchAll(/<rect\b[^>]*\by="([\d.]+)"[^>]*\bheight="([\d.]+)"/g)].map((m) => [Number(m[1]), Number(m[2])]).filter(([, h]) => h > 0);
  assert.equal(bars.length, 4);
  for (const [y, h] of bars) assert.equal(y + h, base, `bar ends at ${y + h}, baseline ${base}`);
  const values = [40, 65, 50, 80], k = bars[3][1] / 80;
  bars.forEach(([, h], i) => assert.ok(Math.abs(h - values[i] * k) < 0.01, `bar ${i}: ${h} vs ${values[i] * k}`));
  // the same chart in the reference file
  assert.ok(read(join(PLUGIN, 'skills', 'svg', 'reference', 'examples.md')).includes('y="77.5"'), 'the reference shows the corrected chart');
});

test('svg-check: good files pass, broken ones fail with the reason, and the command line reports it', async () => {
  const { checkSvg } = await import(pathToFileURL(join(PLUGIN, 'tools', 'svg-check.mjs')).href);
  const ok = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 2h20"/></svg>';
  assert.deepEqual(checkSvg(ok).problems, []);
  const cases = [
    ['<svg viewBox="0 0 24 24" aria-hidden="true"></svg>', /xmlns/],
    ['<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true"></svg>', /viewBox/],
    ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 9"><path d=""/></svg>', /empty <path>/],
    ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 9"><rect/></svg>', /accessible name/],
    ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 9" aria-hidden="true"><g id="a"/><g id="a"/></svg>', /duplicate ids: a/],
    ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 9" aria-hidden="true"><use href="#nope"/></svg>', /#nope/],
    ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 9" aria-hidden="true"><image href="https://x.example/a.png"/></svg>', /external reference/],
    ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 9" aria-hidden="true"><script>1</script></svg>', /scripts/],
    ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 9" aria-hidden="true"><g></svg>', /closes|unclosed/],
  ];
  for (const [svg, re] of cases) { const r = checkSvg(svg); assert.equal(r.pass, false, svg); assert.match(r.problems.join(' | '), re, svg); }
  assert.match(checkSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 9" aria-hidden="true"><style>a{}</style></svg>', { email: true }).problems.join(), /email/);
  // a sprite sheet: the symbols carry the viewBox, the root needs none
  assert.deepEqual(checkSvg('<svg xmlns="http://www.w3.org/2000/svg"><symbol id="a" viewBox="0 0 24 24"><path d="M2 2h20"/></symbol></svg>').problems, []);
  assert.match(checkSvg('<svg xmlns="http://www.w3.org/2000/svg"><symbol id="a"><path d="M2 2h20"/></symbol></svg>').problems.join(), /#a\) has no viewBox/);
  const dir = mkdtempSync(join(tmpdir(), 'easel-svgcheck-'));
  try {
    writeFileSync(join(dir, 'good.svg'), ok);
    writeFileSync(join(dir, 'bad.svg'), cases[0][0]);
    const run = (...a) => spawnSync(process.execPath, [join(PLUGIN, 'tools', 'svg-check.mjs'), ...a], { encoding: 'utf8', windowsHide: true });
    assert.equal(run(join(dir, 'good.svg')).status, 0);
    const both = run(dir);
    assert.equal(both.status, 1);
    assert.match(both.stdout, /FAIL .*bad\.svg[\s\S]*xmlns/);
    assert.equal(run(dir, '--nope').status, 2);
    assert.equal(run(join(dir, 'missing.svg')).status, 2);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// QA: svg-check refused valid SVG (single quotes, a ">" in an attribute, an exponent in the viewBox,
// an id with "placeholder" in it, non-ASCII without a declaration) and let --email keep <defs>
test('svg-check: valid SVG it used to refuse passes; non-ASCII is a warning; --email refuses defs and gradients', async () => {
  const { checkSvg } = await import(pathToFileURL(join(PLUGIN, 'tools', 'svg-check.mjs')).href);
  const NS = 'xmlns="http://www.w3.org/2000/svg"';
  const valid = [
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' aria-hidden='true'><path d='M2 2h20'/></svg>",
    `<svg ${NS} viewBox="0 0 48 48" aria-hidden="true"><circle id="avatar-placeholder" cx="24" cy="24" r="20" class="placeholder-ring"/></svg>`,
    `<svg ${NS} viewBox="0 0 24 24" role="img" aria-label="a > b"><g transform="scale(1)"><path d="M2 2h20"/></g></svg>`,
    `<svg ${NS} viewBox="0 0 1e3 1e3" aria-hidden="true"><rect width="1e3" height="5E2"/></svg>`,
    `<svg ${NS} viewBox="-.5 -0.5 24.5,24.5" aria-hidden="true"><path d="M2 2h20"/></svg>`,
  ];
  for (const svg of valid) assert.deepEqual(checkSvg(svg).problems, [], svg);
  const cafe = checkSvg(`<svg ${NS} viewBox="0 0 9 9" aria-hidden="true"><text>Café</text></svg>`);
  assert.equal(cafe.pass, true);
  assert.match(cafe.warnings.join(), /UTF-8/);
  assert.deepEqual(checkSvg(`<?xml version="1.0" encoding="UTF-8"?>\n<svg ${NS} viewBox="0 0 9 9" aria-hidden="true"><text>Café</text></svg>`).warnings, []);
  const fails = [
    [`<svg ${NS} viewBox="0 0 24" aria-hidden="true"></svg>`, /viewBox "0 0 24"/],
    [`<svg ${NS} viewBox="0 0 -1 5" aria-hidden="true"></svg>`, /positive width and height/],
    [`<svg ${NS} viewBox="0 0 9 9" aria-hidden="true"><text>TODO: real copy</text></svg>`, /TODO or placeholder/],
    [`<svg ${NS} viewBox="0 0 9 9" aria-hidden="true"><!-- placeholder: swap in the logo --><rect width="9" height="9"/></svg>`, /TODO or placeholder/],
    [`<svg ${NS} viewBox="0 0 9 9" role="img" aria-label="Placeholder"><rect width="9" height="9"/></svg>`, /TODO or placeholder/],
    [`<svg ${NS} viewBox="0 0 9 9" aria-hidden="true"><text>a < b</text></svg>`, /not a well-formed tag/],
    [`<svg ${NS} viewBox="0 0 9 9" aria-hidden="true"><rect width=9 height="9"/></svg>`, /not a well-formed tag/],
    ["<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9 9' aria-hidden='true'><use href='#nope'/></svg>", /#nope/],
    [`<svg ${NS} viewBox="0 0 9 9" aria-hidden="true"><image href='https://x.example/a.png'/></svg>`, /external reference/],
  ];
  for (const [svg, re] of fails) { const r = checkSvg(svg); assert.equal(r.pass, false, svg); assert.match(r.problems.join(' | '), re, svg); }
  // email: <defs>, gradients and #id references are dropped by desktop mail clients (scenarios.md, Email inline)
  const grad = `<svg ${NS} viewBox="0 0 9 9" width="9" height="9" aria-hidden="true"><defs><linearGradient id="g"><stop offset="0" stop-color="#000"/></linearGradient></defs><rect width="9" height="9" fill="url(#g)"/></svg>`;
  assert.deepEqual(checkSvg(grad).problems, []);
  assert.match(checkSvg(grad, { email: true }).problems.join(), /email: <defs>, <linearGradient>/);
  assert.match(checkSvg(`<svg ${NS} viewBox="0 0 9 9" width="9" height="9" aria-hidden="true"><radialGradient id="r"/><circle r="4" fill="url(#r)"/></svg>`, { email: true }).problems.join(), /email: <radialGradient>/);
  const flat = checkSvg(`<svg ${NS} viewBox="0 0 9 9" width="9" height="9" aria-hidden="true"><rect width="9" height="9" fill="#123456"/></svg>`, { email: true });
  assert.deepEqual([flat.problems, flat.warnings], [[], []]);
  assert.match(checkSvg(`<svg ${NS} viewBox="0 0 9 9" aria-hidden="true"><rect width="9" height="9"/></svg>`, { email: true }).warnings.join(), /width and height/);
});

// QA (C6): the engine inlines an SVG into an HTML page, which forgives XML errors, so these passed
// every check and the delivered file showed an XML error page when opened on its own
test('svg-check: XML errors that an HTML page forgives fail, each with a fix', async () => {
  const { checkSvg } = await import(pathToFileURL(join(PLUGIN, 'tools', 'svg-check.mjs')).href);
  const open = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img"><title>x</title>';
  const fails = [
    [`${open}<text>R&D costs</text></svg>`, /bare "&"[\s\S]*&amp;/],
    [`${open}<text>a&nbsp;b</text></svg>`, /&nbsp;[\s\S]*&#160;/],
    [`${open}<a href="https://x.example/?a=1&b=2"><rect width="2" height="2"/></a></svg>`, /bare "&"/],
    [`${open}<rect data-note="a<b" width="2" height="2"/></svg>`, /"<" inside the value of data-note[\s\S]*&lt;/],
    [`${open}<rect width="2" width="3" height="2"/></svg>`, /"width" twice/],
    [`${open}<!-- a -- b --><rect width="2" height="2"/></svg>`, /comment[\s\S]*"--"/],
    [`${open}<!-- arrow ---><rect width="2" height="2"/></svg>`, /comment[\s\S]*"--"/],
    [`<!-- c --><?xml version="1.0"?>${open}</svg>`, /XML declaration[\s\S]*very start/],
    [`\n<?xml version="1.0" encoding="UTF-8"?>\n${open}</svg>`, /XML declaration[\s\S]*very start/],
    [`${open}<rect width="2" height="2" hidden/></svg>`, /"hidden" on <rect> has no value/],
    [`${open}<rect id="r" width="2" height="2"/><use xlink:href="#r"/></svg>`, /prefix "xlink:"[\s\S]*xmlns:xlink/],
  ];
  for (const [svg, re] of fails) { const r = checkSvg(svg); assert.equal(r.pass, false, svg); assert.match(r.problems.join(' | '), re, svg); }
  // the line is named, so a long file can be fixed
  assert.match(checkSvg(`${open}\n<g>\n<text>Q&A</text></g></svg>`).problems.join(), /line 3/);
  const valid = [
    `<?xml version="1.0" encoding="UTF-8"?>\n${open}<text>a &lt; b &amp; c &#169; &#x263A; &quot;q&quot; &apos;</text></svg>`,
    `${open}<!-- a - b, if a < b & c --><style><![CDATA[ a > b { fill: red } /* x & y */ ]]></style><rect width="2" height="2"/></svg>`,
    `<!DOCTYPE svg [ <!ENTITY brand "Easel"> ]>\n${open}<text>&brand;</text></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24" aria-hidden="true"><rect id="r" width="2" height="2" xml:space="preserve"/><use xlink:href="#r"/></svg>`,
  ];
  for (const svg of valid) assert.deepEqual(checkSvg(svg).problems, [], svg);
});

// QA (IP-3, IP-4): external CSS hidden in CDATA, a stylesheet instruction, url( '...') with spaces,
// javascript: links and email-unsafe <set> and <foreignObject> passed; honest labels failed
test('svg-check: external CSS, script links and email-unsafe elements fail; honest labels with "todo" or "placeholder" pass', async () => {
  const { checkSvg } = await import(pathToFileURL(join(PLUGIN, 'tools', 'svg-check.mjs')).href);
  const open = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" role="img"><title>x</title>';
  const fails = [
    [`${open}<style><![CDATA[@import url(https://fonts.example.com/x.css);]]></style></svg>`, /external CSS/],
    [`${open}<style><![CDATA[.a{fill:url(#nope)}]]></style><rect class="a" width="2" height="2"/></svg>`, /url\(#nope\)/],
    [`<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet type="text/css" href="https://fonts.example.com/css2"?>\n${open}</svg>`, /xml-stylesheet/],
    [`${open}<style>.a{fill:url( 'https://x.example/p.svg#g' )}</style></svg>`, /external CSS/],
    [`${open}<a href="javascript:alert(1)"><rect width="2" height="2"/></a></svg>`, /javascript:/],
    [`${open}<a xlink:href=" JavaScript:x()"><rect width="2" height="2"/></a></svg>`, /javascript:/],
  ];
  for (const [svg, re] of fails) { const r = checkSvg(svg); assert.equal(r.pass, false, svg); assert.match(r.problems.join(' | '), re, svg); }
  const set = `${open}<rect width="2" height="2"><set attributeName="fill" to="red" begin="1s"/></rect></svg>`;
  assert.deepEqual(checkSvg(set).problems, []);
  assert.match(checkSvg(set, { email: true }).problems.join(), /email: animation/);
  const fo = `${open}<foreignObject width="24" height="24"><div xmlns="http://www.w3.org/1999/xhtml">hi</div></foreignObject></svg>`;
  assert.match(checkSvg(fo, { email: true }).problems.join(), /email: <foreignObject>/);
  // accurate names are not leftover notes
  const NS = 'xmlns="http://www.w3.org/2000/svg"';
  for (const svg of [
    `<svg ${NS} viewBox="0 0 24 24" role="img"><title>Todo list</title><path d="M4 6h16" stroke="currentColor"/></svg>`,
    `<svg ${NS} viewBox="0 0 24 24" role="img" aria-label="Image placeholder"><rect x="3" y="5" width="18" height="14"/></svg>`,
    `<svg ${NS} viewBox="0 0 320 60" role="img"><title>Tasks</title><text x="10" y="35">3 TODO, 5 done</text></svg>`,
  ]) assert.deepEqual(checkSvg(svg).problems, [], svg);
  // unfinished notes still fail: in a comment, or note-shaped in the text
  for (const svg of [
    `<svg ${NS} viewBox="0 0 9 9" aria-hidden="true"><!-- todo swap the colours --><rect width="9" height="9"/></svg>`,
    `<svg ${NS} viewBox="0 0 9 9" role="img"><title>Chart</title><text>FIXME</text></svg>`,
    `<svg ${NS} viewBox="0 0 9 9" role="img"><title>Chart</title><text>[placeholder copy]</text></svg>`,
    `<svg ${NS} viewBox="0 0 9 9" role="img"><title>Chart</title><text>Lorem ipsum dolor</text></svg>`,
  ]) assert.match(checkSvg(svg).problems.join(), /TODO or placeholder/, svg);
});

test('examples: every skill but the entry has one; every SVG passes svg-check; only bundled faces, no URLs', async () => {
  const { checkSvg } = await import(pathToFileURL(join(PLUGIN, 'tools', 'svg-check.mjs')).href);
  const { pieces } = JSON.parse(read(join(PLUGIN, 'examples', 'manifest.json')));
  for (const s of SKILLS.filter((x) => x !== 'illustrate')) assert.ok(pieces.some((p) => p.skill === s), s);
  for (const f of walk(join(PLUGIN, 'examples'))) {
    const t = read(f);
    if (f.endsWith('.svg')) assert.deepEqual(checkSvg(t).problems, [], f);
    assert.doesNotMatch(t.replace(/xmlns(:\w+)?="[^"]*"/g, '').replace('https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.13/p5.min.js', ''), /https?:\/\//, f);
    assert.doesNotMatch(t, /Arial|Helvetica|Segoe|Georgia|Times New Roman|Consolas|Menlo|Comic Sans|DejaVu|Poppins|Lora\b|system-ui/, f);
    assert.doesNotMatch(fold(t), NAMES, f);
  }
});

test('every complete SVG in the references and in easel-design\'s examples passes svg-check, as the skills promise', async () => {
  const { checkSvg } = await import(pathToFileURL(join(PLUGIN, 'tools', 'svg-check.mjs')).href);
  let n = 0;
  for (const f of SKILLS.flatMap((s) => walk(join(PLUGIN, 'skills', s))).filter((x) => x.endsWith('.md'))) {
    for (const [, code] of read(f).matchAll(/```(?:svg|xml)\n([\s\S]*?)```/g)) {
      const t = code.trim();
      if (!/^(<\?xml[^>]*>\s*)?<svg\b[\s\S]*<\/svg>$/.test(t)) continue; // fragments are not files
      n++;
      assert.deepEqual(checkSvg(t).problems, [], `${f}: ${t.slice(0, 80)}`);
    }
  }
  assert.ok(n >= 10, `${n} complete SVGs in the references`);
  const DESIGN = join(PLUGIN, '..', 'easel-design', 'examples');
  for (const f of walk(DESIGN).filter((x) => x.endsWith('.svg'))) assert.deepEqual(checkSvg(read(f)).problems, [], f);
});

// QA (IP-5 to IP-18): what the skills tell the model, checked where a check is reasonable
const skill = (s) => read(join(PLUGIN, 'skills', s, 'SKILL.md'));
const ref = (s, f) => read(join(PLUGIN, 'skills', s, 'reference', f));
const routing = (s) => { const fm = /^---\n([\s\S]*?)\n---\n/.exec(skill(s))[1]; return `${field(fm, 'description')} ${field(fm, 'when_to_use')}`; };
// WCAG 2 contrast of a #rrggbb colour on white
const onWhite = (hex) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 1.05 / (0.2126 * r + 0.7152 * g + 0.0722 * b + 0.05); };

test('skill text: email SVG is never embedded, the bundled faces are Latin only, dark renders and SMIL as the engine does them', () => {
  const svg = skill('svg'), ill = skill('svg-illustration'), motion = ref('svg-illustration', 'effects-and-motion.md');
  // embed_fonts adds a <style>, which --email refuses (IP-5)
  assert.match(svg, /Email SVG is never embedded/);
  assert.match(/## 15\. Email inline[\s\S]*?\n---/.exec(ref('svg', 'scenarios.md'))[0], /embed_fonts[\s\S]*outline/i);
  // non-Latin text has no glyph in the bundled faces, embedded or not (IP-6)
  for (const [n, t] of [['svg', svg], ['svg-illustration', ill]]) assert.match(t, /Latin/, n);
  // C7: the dark render paints a dark page, so currentColor shows light ink there
  for (const [n, t] of [['svg', svg], ['svg-illustration', ill]]) assert.match(t, /dark page background/, n);
  // C9: the engine seeks SMIL like CSS; check it with filmstrip, no hand-made seek page
  for (const [n, t] of [['svg', svg], ['effects-and-motion', motion]]) { assert.doesNotMatch(t, /own clock|pauseAnimations/, n); assert.match(t, /SMIL[^.]*filmstrip/, n); }
});

test('skill text: concept labels in a text-safe accent, the mascot test, the full raster constraints, svg-check in every SVG skill', () => {
  // the key word's accent reaches AA on white (IP-7: #E8772E is 2.95:1)
  const key = /key word[^.]*?(#[0-9A-Fa-f]{6})/.exec(ref('concept-illustration', 'style.md'));
  assert.ok(key, 'style.md names the colour a key word may take');
  assert.ok(onWhite(key[1]) >= 4.5, `${key[1]} on white: ${onWhite(key[1]).toFixed(2)}`);
  // "removal test" is the rubric's (caption away, still reads); the concept skill's is the mascot test (IP-13)
  for (const f of walk(join(PLUGIN, 'skills', 'concept-illustration'))) assert.doesNotMatch(read(f), /removal test/, f);
  assert.match(ref('concept-illustration', 'qa-checklist.md'), /the mascot test: delete the mascot/);
  // the raster prompt keeps its constraints, minus the watermark (IP-12)
  const prompt = ref('concept-illustration', 'raster-prompt.md');
  assert.match(prompt, /Constraints:\n\S.*40%-60%.*35%.*fresh visual metaphor/);
  assert.doesNotMatch(prompt.replace(/<!--[\s\S]*?-->/, ''), /watermark/i);
  // every skill that writes SVG files runs svg-check, and may run node for it (IP-11)
  for (const s of ['svg', 'svg-illustration', 'concept-illustration']) {
    assert.match(skill(s), /node "\$\{CLAUDE_PLUGIN_ROOT\}\/tools\/svg-check\.mjs"/, s);
    assert.match(skill(s), /^allowed-tools: .*Bash\(node:\*\)/m, s);
  }
});

test('skill text: famous characters refused with no look-alike, a seamless p5 1.x noise loop, the illustration rubric for SVG drawings', () => {
  // svg-illustration draws characters and mascots too; the alternative keeps no signature feature (IP-8)
  for (const [n, t] of [['svg-illustration', skill('svg-illustration')], ['mascot.md', ref('concept-illustration', 'mascot.md')]]) {
    assert.match(t, /copyrighted or trademarked character/, n);
    assert.match(t, /never the character's signature features/, n);
  }
  // p5 1.x noise() takes three coordinates at most: a fourth is dropped and the loop plays back and forth (IP-16)
  for (const f of [join(PLUGIN, 'skills', 'generative-art', 'SKILL.md'), join(PLUGIN, 'skills', 'generative-art', 'templates', 'viewer.html')]) {
    assert.match(read(f), /noise\(x \* s \+ r \* cos\(a\), y \* s \+ r \* sin\(a\)\)/, f);
  }
  // the svg skill's drawings use the illustration rubric; charts and text-led graphics the design one (IP-18)
  assert.match(skill('svg'), /easel-core:critique[\s\S]{0,80}\*\*illustration\*\* rubric[\s\S]{0,200}\*\*design\*\* rubric/);
});

// QA (Q-29): one tie-break sentence on our side of each overlapping pair, and the entry agrees with its children
test('routing: tie-breaks with design, pixel and motion skills; empty states belong to svg-illustration', () => {
  const svg = routing('svg');
  assert.match(svg, /favicon or app icon use easel-design:logo/);
  assert.match(svg, /sprite[^;]*use easel-pixel:pixel/);
  assert.match(svg, /chart[^;]*use easel-design:infographic/);
  assert.match(svg, /loader or hover effect[^;]*use easel-motion:ui-motion/);
  assert.doesNotMatch(svg, /empty-state graphics|favicons/);
  assert.match(svg, /empty-state[^;]*use easel-illustrate:svg-illustration/);
  assert.match(routing('svg-illustration'), /favicon or app icon[^;]*use easel-design:logo/);
  assert.match(routing('svg-illustration'), /empty-state/);
  assert.match(routing('generative-art'), /looping animation[^.]*easel-motion:animate/);
  const entry = skill('illustrate');
  assert.match(entry, /empty-state illustration[^|]*\| [^|]+ \| `easel-illustrate:svg-illustration`/);
  assert.match(entry, /\| `easel-pixel:pixel`/);
  assert.doesNotMatch(/\| An icon[^\n]*/.exec(entry)[0], /empty/);
  // the routing eval for an empty state expects svg-illustration only
  assert.doesNotMatch(read(join(PLUGIN, 'evals', 'illustrate-routing', 'graders', 'plan.md')), /svg-illustration or svg/);
});

// QA (Q-44): the svg examples are linyaosky's examples, corrected; they carry its header like the skill files
test('the svg examples adapted from linyaosky/svg-skill carry its attribution header, and NOTICE.md lists them', () => {
  for (const f of ['bar-chart.svg', 'progress-ring.svg', 'spinner.svg']) {
    const head = read(join(PLUGIN, 'examples', 'svg', f)).slice(0, 1200);
    assert.match(head, /^<svg[^>]*>\s*<!-- Easel: adapted from linyaosky\/svg-skill @ 2103b92cb47f588a97a6c38aa6c40571fadbd4f8/, f);
    assert.match(head, /MIT License, Copyright \(c\)\s+2026\s+svg-skill contributors[\s\S]*Modified by Easel \(\d{4}-\d{2}-\d{2}\)/, f);
  }
  assert.match(read(join(PLUGIN, 'NOTICE.md')), /## linyaosky\/svg-skill[\s\S]*?`examples\/svg\/`[\s\S]*?## upbrew/);
});
