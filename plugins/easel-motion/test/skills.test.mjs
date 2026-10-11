// QA fixes (Q-06, Q-29, Q-38): static checks on the skills, styles and references. Pure Node.
// Every tool a skill's text tells the model to use is in its allowed-tools; the blue-purple styles
// document their colour_cast argument; the sample, sheet, review and routing instructions agree.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PLUGIN } from '../tools/build.mjs';

const read = (...p) => readFileSync(join(PLUGIN, ...p), 'utf8');
const CORE = join(PLUGIN, '..', 'easel-core');
const SKILLS = ['animate', 'style-match', 'ui-motion'];
const STYLES = readdirSync(join(PLUGIN, 'styles')).filter((n) => existsSync(join(PLUGIN, 'styles', n, 'kit.js'))).sort();
const front = (s) => /^---\n([\s\S]*?)\n---\n/.exec(read('skills', s, 'SKILL.md'))[1];
const field = (fm, k) => { const m = new RegExp(`^${k}: (>-\\n((?:  .*\\n?)+)|.*)$`, 'm').exec(fm); return m ? (m[2] ? m[2].replace(/\n\s*/g, ' ').trim() : m[1]) : ''; };
const routing = (s) => `${field(front(s), 'description')} ${field(front(s), 'when_to_use')}`;
// the skill's text: SKILL.md and the supporting files beside it (not the verbatim gsap/ references)
const skillText = (s) => readdirSync(join(PLUGIN, 'skills', s)).filter((f) => f.endsWith('.md')).map((f) => read('skills', s, f)).join('\n');
const section = (text, head) => { const i = text.indexOf(head); assert.ok(i >= 0, head); const j = text.indexOf('\n#', i + head.length); return text.slice(i, j < 0 ? undefined : j); };

const ENGINE_TOOLS = new Set([...readFileSync(join(CORE, 'engine', 'tools.mjs'), 'utf8').matchAll(/^ {2}(\w+): \{$/gm)].map((m) => m[1]));
// What a text asks for, as the allowed-tools entry it needs (with the words that ask for it).
export function toolsNamed(text) {
  const need = new Map();
  const add = (tool, why) => { if (!need.has(tool)) need.set(tool, why); };
  for (const m of text.matchAll(/mcp__plugin_easel-core_easel__\w+/g)) add(m[0], m[0]);
  for (const m of text.matchAll(/`(\w+)`/g)) if (ENGINE_TOOLS.has(m[1])) add(`mcp__plugin_easel-core_easel__${m[1]}`, m[0]);
  const rules = [
    [/(?:^|[\s(])Read\b/m, 'Read'], [/(?:^|[\s(])Write\b|\bsave it as a file\b/m, 'Write'],
    [/\bEdit\b|\bedit `|\bfix (?:every problem|what) it reports\b|\bApply the fixes\b/, 'Edit'],
    [/\bAgent\b|\bsubagent\b|\bcritic agent\b/, 'Agent'], [/AskUserQuestion|\bone click\b/, 'AskUserQuestion'],
    [/\bweb search\b|\bweb-check\b/i, 'WebSearch'], [/(?:^|`)node (?:"|\S+\.m?js\b)/m, 'Bash(node:*)'], [/(?:^|`)ffmpeg -/m, 'Bash(ffmpeg:*)'],
  ];
  for (const [re, tool] of rules) { const m = re.exec(text); if (m) add(tool, m[0].trim()); }
  // a command that starts with a quoted path ("<path>" -i ...) matches no Bash(<command>:*) permission
  for (const m of text.matchAll(/`"[^"`]*"\s+-\w/g)) add('a Bash(<command>:*) rule (a command starting with a quoted path matches none)', m[0]);
  return need;
}

test('allowed-tools: every tool a skill tells the model to use is listed (engine tools, Read/Write/Edit, Agent, questions, web search, commands)', () => {
  for (const s of SKILLS) {
    const allowed = new Set(field(front(s), 'allowed-tools').split(/\s+/));
    for (const [tool, why] of toolsNamed(skillText(s))) assert.ok(allowed.has(tool), `${s}: the text says "${why}" but allowed-tools has no ${tool}`);
  }
});

test('the allowed-tools scan is not vacuous', () => {
  const need = toolsNamed('Open it with Read. Write `a.json`, then fix what it reports. Run the critic agent. Check every claim with a web search; ask with options in one click. `node x.mjs`, `filmstrip`, `"C:\\ff\\ffmpeg.exe" -i a.mp4`.');
  assert.deepEqual([...need.keys()].sort(), ['AskUserQuestion', 'Agent', 'Bash(node:*)', 'Edit', 'Read', 'WebSearch', 'Write', 'a Bash(<command>:*) rule (a command starting with a quoted path matches none)', 'mcp__plugin_easel-core_easel__filmstrip'].sort());
});

// Q-06 (contract C4): the blue-purple styles fail colour_cast on every frame by design
const BLUE_PURPLE = ['aurora-glass', 'liquid', 'synthwave'];
test('colour_cast: synthwave, liquid and aurora-glass document qa with castMaxRatio: 1 (the user chose that palette); no other style does', () => {
  for (const s of STYLES) {
    const text = read('styles', s, 'STYLE.md');
    if (BLUE_PURPLE.includes(s)) {
      assert.match(text, /castMaxRatio[`"]?: 1\b/, `${s}/STYLE.md: the qa argument`);
      assert.match(text, /colour_cast[\s\S]{0,400}(?:chose|chosen)/, `${s}/STYLE.md: the reason (the user chose the palette)`);
    } else assert.doesNotMatch(text, /castMaxRatio/, `${s}/STYLE.md: only the blue-purple styles loosen colour_cast`);
  }
  for (const [where, text] of [['animate SKILL.md', read('skills', 'animate', 'SKILL.md')], ['the motion rubric', readFileSync(join(CORE, 'rubrics', 'motion.md'), 'utf8')]]) {
    assert.match(text, /castMaxRatio[`"]?: 1\b/, where);
    for (const s of ['synthwave', 'liquid', 'aurora']) assert.match(text, new RegExp(`\\b${s}`, 'i'), `${where} names ${s}`);
    assert.match(text, /no other style|every other style/i, `${where}: the other styles keep the default`);
  }
});

// CM-04: a sample rendered with width and height but no aspect shows a format-aware piece's main format (16:9) letterboxed
test('sample.png instructions render the frame in 9:16 (aspect "9:16")', () => {
  for (const [where, text] of [['styles/README.md', read('styles', 'README.md')], ['new-style.md', read('skills', 'style-match', 'new-style.md')], ['style-match SKILL.md', read('skills', 'style-match', 'SKILL.md')]]) {
    // each list item or paragraph that renders the sample
    const m = text.split(/\n(?=\s*(?:\d+\.|-) )|\n\s*\n/).filter((b) => b.includes('sample.png') && /render_still/.test(b));
    assert.ok(m.length, `${where}: a render_still instruction for sample.png`);
    for (const l of m) assert.match(l, /aspect: "9:16"/, `${where}: ${l}`);
  }
});

// CM-05: measure_image reads every image directly in a folder; sheets in a subfolder are not references
test('style-match keeps contact and compare sheets in references/sheets/ and measures only the references', () => {
  for (const f of ['SKILL.md', 'new-style.md']) {
    const text = read('skills', 'style-match', f);
    assert.match(text, /references\/sheets\//, f);
    assert.doesNotMatch(text, /(?:outDir` = the job's `references\/`|sheets into `<job>\/references\/`)/, `${f}: sheets written into the references folder itself`);
  }
  assert.match(read('skills', 'style-match', 'SKILL.md'), /contact_sheet[^.]*references\/sheets/, 'the gather step\'s contact sheet goes to sheets/');
});

// CM-09: a job planned with easel-core:brief has no piece/ folder yet
test('animate step 0: the brief shortcut starts the piece (step 2\'s new-piece) before step 4', () => {
  const s0 = section(read('skills', 'animate', 'SKILL.md'), '### 0.');
  assert.match(s0, /approved[\s\S]*new-piece[\s\S]*step 4/, s0);
});

// CM-11: defaults, intervals and references agree across the animate flow
test('animate flow: default formats agree, the review filmstrip interval matches the rubric and splits past 48 frames, every style is in the honesty section', () => {
  const skill = read('skills', 'animate', 'SKILL.md'), intake = read('skills', 'animate', 'intake.md');
  assert.match(skill, /Default formats when the user names none: \*\*16:9 and 9:16\*\*/);
  assert.match(section(intake, '## Defaults when unanswered'), /16:9 and 9:16/);
  const review = section(skill, '### 6.');
  assert.match(review, /every 0\.5 s/);
  assert.match(review, /48[\s\S]{0,200}24 s|24 s[\s\S]{0,200}48/, 'past 24 s a filmstrip at 0.5 s needs more than 48 frames: say to split it');
  assert.match(readFileSync(join(CORE, 'rubrics', 'motion.md'), 'utf8'), /every 0\.5 s/);
  const honesty = section(skill, '## Honesty').replace(/\s+/g, ' ');
  for (const s of STYLES) assert.match(honesty, new RegExp(s.replace('-', '[- ]'), 'i'), `honesty section: ${s}`);
});

test('no dangling examples/ paths: every examples/<name> a style, grammar or skill cites ships, or is called upstream\'s', () => {
  const walk = (dir) => readdirSync(join(PLUGIN, dir), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
  const files = ['styles', 'grammars', 'recipes', 'skills'].flatMap(walk).filter((f) => f.endsWith('.md') && !f.includes(join('ui-motion', 'gsap')));
  for (const f of files) {
    for (const m of read(f).matchAll(/[^\n]{0,60}`examples\/([\w-]+)/g)) {
      if (/upstream/i.test(m[0])) continue;
      assert.ok(existsSync(join(PLUGIN, 'examples', m[1])), `${f}: examples/${m[1]} does not ship (say it is upstream's, or drop it)`);
    }
  }
});

// CM-12: ui-motion's references agree with its rules, and its checks capture the end state
test('ui-motion: no box-shadow transition in the patterns; filmstrip times include the end; reduced motion checks a mid-time still', () => {
  for (const m of read('skills', 'ui-motion', 'ui-patterns.md').matchAll(/transition:[^;]*;/g)) assert.doesNotMatch(m[0], /box-shadow|\ball\b/, m[0]);
  const s4 = section(read('skills', 'ui-motion', 'SKILL.md'), '## 4.');
  assert.match(s4, /filmstrip`?[^.]*`times`[^.]*end/, 'filmstrip with times that include the end');
  assert.doesNotMatch(s4, /filmstrip` with `count`/);
  assert.match(s4, /reducedMotion: "reduce"[\s\S]*(?:middle|mid)/, 'a mid-time still for interactions whose start and end are the same');
});

// Q-29 / Q-41: one tie-break sentence on our side of each overlapping pair, within the routing cap
test('routing: tie-breaks with ai-video, generative-art, pixel, svg and critique; animate and style-match agree on the order', () => {
  const a = routing('animate'), sm = routing('style-match'), ui = routing('ui-motion');
  for (const other of ['easel-ai-media:ai-video', 'easel-illustrate:generative-art', 'easel-pixel:pixel', 'easel-motion:style-match', 'easel-motion:ui-motion']) assert.ok(a.includes(other), `animate names ${other}`);
  for (const other of ['easel-illustrate:svg', 'easel-core:critique', 'easel-motion:animate']) assert.ok(ui.includes(other), `ui-motion names ${other}`);
  // with references for a whole video: animate first (intake, story), style-match at its look check (step 2)
  assert.match(a, /look check[^.]*style-match|style-match[^.]*look check/);
  assert.match(sm, /animate[^.]*(?:first|story)[^.]*|(?:first|story)[^.]*animate/);
  assert.match(section(read('skills', 'animate', 'SKILL.md'), '### 2.'), /easel-motion:style-match/, 'the look check runs style-match when the user gave references');
  for (const s of SKILLS) assert.ok(routing(s).length <= 1536, `${s}: ${routing(s).length} characters of routing text`);
});

// Contract C6: the engine refuses an SVG that is not well-formed XML. examples/style-match/references/bulb.svg
// repeated an attribute (the browser kept the first, an XML parser stops).
test('every SVG the plugin ships is well-formed: no repeated attribute in a tag, no bare &', () => {
  const walk = (dir) => readdirSync(join(PLUGIN, dir), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (e.name === 'node_modules' ? [] : walk(join(dir, e.name))) : [join(dir, e.name)]));
  const svgs = walk('.').filter((f) => f.endsWith('.svg'));
  assert.ok(svgs.length >= 3, svgs.join(', '));
  for (const f of svgs) {
    const text = read(f);
    for (const [tag] of text.matchAll(/<[a-zA-Z][^<>]*>/g)) {
      const names = [...tag.matchAll(/\s([\w:-]+)\s*=/g)].map((m) => m[1]);
      assert.equal(new Set(names).size, names.length, `${f}: an attribute repeats in ${tag.slice(0, 120)}`);
    }
    assert.doesNotMatch(text, /&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);)/i, `${f}: a bare & (write &amp;)`);
  }
});
