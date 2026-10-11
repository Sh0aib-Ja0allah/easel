// QA fixes (Q-38, Q-41): static checks on easel-core's skills, critic agent and rubrics. Pure Node.
// Every tool a skill's text tells the model to use is in its allowed-tools; setup names every package
// doctor pins; score's outputs land in the job folder; the critic says where qa writes; the critique,
// rubric and routing texts agree with easel-motion.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CORE = fileURLToPath(new URL('../../', import.meta.url));
const read = (...p) => readFileSync(join(CORE, ...p), 'utf8');
const SKILLS = readdirSync(join(CORE, 'skills')).sort();
const front = (s) => /^---\n([\s\S]*?)\n---\n/.exec(read('skills', s, 'SKILL.md'))[1];
const field = (fm, k) => { const m = new RegExp(`^${k}: (>-\\n((?:  .*\\n?)+)|.*)$`, 'm').exec(fm); return m ? (m[2] ? m[2].replace(/\n\s*/g, ' ').trim() : m[1]) : ''; };
const body = (s) => read('skills', s, 'SKILL.md').replace(/^---\n[\s\S]*?\n---\n/, '');
const section = (text, head) => { const i = text.indexOf(head); assert.ok(i >= 0, head); const j = text.indexOf('\n#', i + head.length); return text.slice(i, j < 0 ? undefined : j); };

const ENGINE_TOOLS = new Set([...read('engine', 'tools.mjs').matchAll(/^ {2}(\w+): \{$/gm)].map((m) => m[1]));
// What a text asks for, as the allowed-tools entry it needs (with the words that ask for it).
function toolsNamed(text) {
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
  return need;
}

test('allowed-tools: every tool a core skill tells the model to use is listed', () => {
  assert.deepEqual(SKILLS, ['brand', 'brief', 'critique', 'score', 'setup']);
  for (const s of SKILLS) {
    const allowed = new Set(field(front(s), 'allowed-tools').split(/\s+/));
    for (const [tool, why] of toolsNamed(body(s))) assert.ok(allowed.has(tool), `${s}: the text says "${why}" but allowed-tools has no ${tool}`);
  }
  assert.deepEqual([...toolsNamed('Open the PNG with Read. Write `brief.json` and fix every problem it reports; run `filmstrip`.').keys()].sort(), ['Edit', 'Read', 'Write', 'mcp__plugin_easel-core_easel__filmstrip'].sort(), 'the scan is not vacuous');
});

// CM-07: doctor checks every package pinned in engine/package.json; a data folder made before one was
// pinned (p5) is only topped up if setup's install step names it
test('setup names every package doctor pins, in its check list and in its install trigger', () => {
  const pins = Object.keys(JSON.parse(read('engine', 'package.json')).dependencies);
  assert.ok(pins.includes('p5') && pins.includes('gsap') && pins.includes('playwright-core'), pins.join(', '));
  const check = section(body('setup'), '## 1. Check'), install = section(body('setup'), '## 2. Install');
  const trigger = /^If [^\n]*missing[^\n]*/m.exec(install);
  assert.ok(trigger, 'the install step starts with "If ... missing"');
  for (const p of pins) {
    assert.ok(check.includes(`\`${p}\``), `setup step 1 lists the ${p} check`);
    assert.ok(trigger[0].includes(`\`${p}\``), `setup step 2 installs when ${p} is missing: ${trigger[0]}`);
  }
});

// CM-06: without slug or outDir the files land in ./easel-out/render/, not the job folder
test('score: audio_score and mux_audio write into the job folder (slug)', () => {
  const b = body('score');
  for (const tool of ['audio_score', 'mux_audio']) {
    const calls = [...b.matchAll(new RegExp(`mcp__plugin_easel-core_easel__${tool}\`[^.]*`, 'g'))].map((m) => m[0]);
    assert.ok(calls.length, tool);
    for (const c of calls) assert.match(c, /`slug`/, `${tool}: ${c}`);
  }
});

// CM-02 / contract C8: qa writes its working pages into the job's output folder, never beside the source
test('critic.md says where qa writes: its working pages go into the output folder, never beside the source files', () => {
  const c = read('agents', 'critic.md');
  const s = /\(the qa tool[^)]*\)/.exec(c);
  assert.ok(s, 'the sentence about what qa writes');
  assert.match(s[0], /output folder/);
  assert.match(s[0], /SVG|image/);
  assert.match(s[0], /never[^)]*(?:beside|next to)[^)]*source/);
});

// CM-11: a filmstrip takes at most 48 frames, so a frame every 0.5 s covers 24 s
test('critique: a frame every 0.5 s, and a piece longer than 24 s in several filmstrips', () => {
  const b = body('critique');
  assert.match(b, /every\s+0\.5 s/);
  assert.match(b, /24 s[\s\S]{0,200}48|48[\s\S]{0,200}24 s/);
  assert.match(read('rubrics', 'motion.md'), /24 s[\s\S]{0,200}48|48[\s\S]{0,200}24 s/);
});

// Q-06 / contract C4: the blue-purple styles pass qa with castMaxRatio 1; the rubric says so
test('the motion rubric names the colour_cast exemption for synthwave, liquid and aurora-glass only', () => {
  const r = read('rubrics', 'motion.md');
  assert.match(r, /castMaxRatio[`"]?: 1\b/);
  for (const s of ['synthwave', 'liquid', 'aurora']) assert.match(r, new RegExp(s, 'i'));
  assert.match(r, /no other style|every other style/i);
});

// CM-11: the brief's six questions and animate's own intake (two AskUserQuestion calls of four)
test('brief: a making skill with its own intake asks its own questions', () => {
  assert.match(section(body('brief'), '## 1. Intake'), /own intake/);
});

// Q-41: "review the motion in my UI"
test('routing: critique names easel-motion:ui-motion for the motion in UI code', () => {
  const r = `${field(front('critique'), 'description')} ${field(front('critique'), 'when_to_use')}`;
  assert.match(r, /easel-motion:ui-motion/);
  for (const s of SKILLS) assert.ok(`${field(front(s), 'description')} ${field(front(s), 'when_to_use')}`.length <= 1536, s);
});
