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
const NAMES = /\b(xiaohei|小黑|peanut|ghibli|kusama|haring|shinkai|kirby|mario|pixar|disney|studio ghibli|kurzgesagt|anthropic branding|Poppins|Lora)\b/i;

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
    const body = read(f).replace(/<!--\s*Easel[\s\S]*?-->/, '');
    assert.doesNotMatch(body, NAMES, f);
    for (const m of body.match(/https?:\/\/[^\s"'<>)]+/g) || []) assert.match(m, /^http:\/\/www\.w3\.org\/|^https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/p5\.js\/1\.11\.13\/p5\.min\.js$|example\.com/, `${f}: ${m}`);
    assert.doesNotMatch(body, /python3? |pip install|svg_loop\.py|validate\.sh|xmllint|\/tmp\/|\/usr\/bin|\/home\/claude|\/mnt\/user-data/, f);
  }
  assert.doesNotMatch(read(join(PLUGIN, 'skills', 'concept-illustration', 'reference', 'mascot.md')), /peanut|xiaohei/i);
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
    ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 9" aria-hidden="true"><text>Café</text></svg>', /UTF-8/],
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

test('examples: every skill but the entry has one; every SVG passes svg-check; only bundled faces, no URLs', async () => {
  const { checkSvg } = await import(pathToFileURL(join(PLUGIN, 'tools', 'svg-check.mjs')).href);
  const { pieces } = JSON.parse(read(join(PLUGIN, 'examples', 'manifest.json')));
  for (const s of SKILLS.filter((x) => x !== 'illustrate')) assert.ok(pieces.some((p) => p.skill === s), s);
  for (const f of walk(join(PLUGIN, 'examples'))) {
    const t = read(f);
    if (f.endsWith('.svg')) assert.deepEqual(checkSvg(t).problems, [], f);
    assert.doesNotMatch(t.replace(/xmlns(:\w+)?="[^"]*"/g, '').replace('https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.13/p5.min.js', ''), /https?:\/\//, f);
    assert.doesNotMatch(t, /Arial|Helvetica|Segoe|Georgia|Times New Roman|Consolas|Menlo|Comic Sans|DejaVu|Poppins|Lora\b|system-ui/, f);
    assert.doesNotMatch(t, NAMES, f);
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
