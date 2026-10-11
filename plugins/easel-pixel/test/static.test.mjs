// T4.5: easel-pixel's skills, agents, settings and attribution: every tool named exists in the pinned
// package (test/pebbly-tools.json, read from its source at the pinned commit), Lua stays off, no
// trademark style names, the non-affiliation notice, Windows-safe steps. Pure Node.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PLUGIN = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CORE = join(PLUGIN, '..', 'easel-core');
const read = (f) => readFileSync(join(PLUGIN, f), 'utf8');
const json = (f) => JSON.parse(read(f));
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
const field = (fm, k) => { const m = new RegExp(`^${k}: (?:>-\\n((?:  .*\\n?)+)|(.*))`, 'm').exec(fm + '\n'); return m ? (m[1] ? m[1].split('\n').map((l) => l.trim()).join(' ').trim() : m[2].trim()) : null; };
const PEBBLY = json('test/pebbly-tools.json');
const coreTools = new Set([...readFileSync(join(CORE, 'engine', 'tools.mjs'), 'utf8').matchAll(/^ {2}(\w+): \{$/gm)].map((m) => m[1]));
const BUILTIN = new Set(['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Agent', 'Bash', 'ReadMcpResourceTool', 'ListMcpResourcesTool']);
const known = (t) => {
  let m;
  if ((m = /^mcp__plugin_easel-pixel_aseprite__(\w+)$/.exec(t))) return Object.hasOwn(PEBBLY.tools, m[1]);
  if ((m = /^mcp__plugin_easel-core_easel__(\w+)$/.exec(t))) return coreTools.has(m[1]);
  return BUILTIN.has(t) || t === 'Bash(node:*)';
};
const SKILLS = ['pixel', 'pixel-animate', 'pixel-draw', 'pixel-export'];
const AGENTS = ['animation-director.md', 'palette-smith.md', 'rig-builder.md'];
const files = () => [...SKILLS.map((s) => `skills/${s}/SKILL.md`), ...AGENTS.map((a) => `agents/${a}`)];
const body = (f) => read(f).replace(/^(---\n[\s\S]*?\n---\n)?\s*<!--[\s\S]*?-->/, '');

test('four skills and three agents; every tool they name exists in the pinned package or easel-core; run_lua never', () => {
  assert.deepEqual(readdirSync(join(PLUGIN, 'skills')).sort(), SKILLS);
  assert.deepEqual(readdirSync(join(PLUGIN, 'agents')).sort(), AGENTS);
  assert.ok(!Object.hasOwn(PEBBLY.tools, 'run_lua'));
  for (const f of files()) {
    const text = read(f), fm = /^---\n([\s\S]*?)\n---\n/.exec(text)[1];
    const list = f.startsWith('skills/') ? (field(fm, 'allowed-tools') || '').split(/\s+/) : (field(fm, 'tools') || '').split(/,\s*/);
    for (const t of list.filter(Boolean)) assert.ok(known(t), `${f}: ${t}`);
    for (const t of text.match(/mcp__plugin_[\w-]+?__\w+/g) || []) assert.ok(known(t), `${f}: ${t}`);
    assert.doesNotMatch(text, /run_lua|ALLOW_LUA/, f);
    if (f.startsWith('skills/')) {
      assert.equal(field(fm, 'name'), f.split('/')[1]);
      const len = field(fm, 'description').length + field(fm, 'when_to_use').length;
      assert.ok(len <= 1536, `${f}: ${len}`);
    } else {
      assert.equal(field(fm, 'name'), f.slice(7, -3));
      assert.match(field(fm, 'model'), /^(sonnet|opus|haiku|inherit)$/);
    }
    for (const [p] of text.matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/[\w./-]+/g)) assert.ok(existsSync(join(PLUGIN, p.replace('${CLAUDE_PLUGIN_ROOT}/', ''))), `${f}: ${p}`);
    for (const [, href] of text.matchAll(/\]\(([^)#\s]+\.md)\)/g)) assert.ok(existsSync(join(PLUGIN, dirname(f), href)), `${f}: ${href}`);
  }
});

test('attribution: every skill, agent and hook script names the source, commit and licence', () => {
  for (const f of [...files(), 'hooks/shared.mjs', 'hooks/look-nudge.mjs', 'hooks/session-status.mjs']) {
    const head = read(f).slice(0, 3200).replace(/\n\/\/ ?/g, '\n');
    assert.match(head, /adapted from with-pebbly\/aseprite-ai-artist\s+@\s+f51fe6908223ef9ac476de1568234c699594722d/, f);
    assert.match(head, /MIT License,?\s+Copyright \(c\) 2026\s+with-pebbly/, f);
    assert.match(head, /Modified\s+by\s+Easel\s+\(\d{4}-\d{2}-\d{2}\)/, f);
  }
  const notice = read('NOTICE.md');
  for (const s of ['Copyright (c) 2026 with-pebbly', 'f51fe6908223ef9ac476de1568234c699594722d', 'Permission is hereby granted', '@pebbly/aseprite-ai-artist', '0.8.0']) assert.ok(notice.includes(s), `NOTICE.md: ${s}`);
  for (const f of ['NOTICE.md', 'README.md', 'skills/pixel/SKILL.md']) assert.match(read(f), /not\s+affiliated\s+with[\s\S]{0,40}Aseprite[\s\S]{0,20}Igara\s+Studio/, f);
  assert.match(json('.claude-plugin/plugin.json').description, /not affiliated with Aseprite or Igara Studio/);
});

test('no trademark or creator style names, no copied characters, Windows-safe steps', () => {
  const NAMES = /\b(pico-?8|nes|snes|game ?boy|nintendo|mario|zelda|pok[eé]mon|sega|kirby|ghibli|stardew|celeste|undertale|minecraft|terraria|sonic|mega ?man|castlevania|final fantasy|commodore|c64|zx spectrum|atari|msx|unity)\b/i;
  for (const f of files()) {
    const b = body(f);
    assert.doesNotMatch(b, NAMES, f);
    assert.doesNotMatch(b, /\bnpx\b|\bcurl\b|python3? |\/tmp\/|\/usr\/(local\/)?bin|~\/Library|\/Applications\/|\bopen -a\b/, f);
    assert.doesNotMatch(b, /[–—‘’“”]/, `${f}: ASCII punctuation`);
  }
  for (const s of ['pixel', 'pixel-draw']) assert.match(body(`skills/${s}/SKILL.md`), /copyrighted or trademarked character/, s);
  assert.match(body('skills/pixel-export/SKILL.md'), /easel-out\/<slug>/);
});

test('server config: the launcher from the plugin root, Lua off, settings declared, nothing secret', () => {
  const s = json('.mcp.json').mcpServers.aseprite;
  assert.equal(s.command, 'node');
  assert.deepEqual(s.args, ['${CLAUDE_PLUGIN_ROOT}/server/launch.mjs', 'serve']);
  assert.equal(s.env.ASEPRITE_AI_ALLOW_LUA, '0');
  assert.equal(s.env.ASEPRITE_AI_PROMPTS, '0');
  assert.equal(s.env.EASEL_PIXEL_DATA, '${CLAUDE_PLUGIN_DATA}');
  const { userConfig } = json('.claude-plugin/plugin.json');
  for (const [, k] of JSON.stringify(s).matchAll(/\$\{user_config\.(\w+)\}/g)) assert.ok(userConfig[k], `userConfig.${k}`);
  assert.equal(userConfig.headless.default, false);
  const { VERSION } = { VERSION: /export const VERSION = '([\d.]+)'/.exec(read('server/launch.mjs'))[1] };
  assert.equal(VERSION, PEBBLY.version);
  assert.match(read('hooks/shared.mjs'), new RegExp(`PINNED = '${VERSION.replace(/\./g, '\\.')}'`));
  assert.match(body('skills/pixel/SKILL.md'), new RegExp(VERSION.replace(/\./g, '\\.')));
});

test('the eval mocks describe the pinned package\'s tools; one stateful agent answers every tool, per case where a sprite is open', () => {
  const dir = join(PLUGIN, 'evals', 'mocks', 'aseprite');
  const listed = JSON.parse(readFileSync(join(dir, '_tools.json'), 'utf8')).tools;
  assert.deepEqual(listed.map((t) => [t.name, t.description]), Object.entries(PEBBLY.tools));
  const servers = [join(dir, '_server.md'), ...readdirSync(join(PLUGIN, 'evals')).map((c) => join(PLUGIN, 'evals', c, 'mocks', 'aseprite', '_server.md')).filter(existsSync)];
  assert.ok(servers.length >= 4, `${servers.length} agent mocks`);
  for (const f of servers) {
    const fm = /^---\n([\s\S]*?)\n---\n/.exec(readFileSync(f, 'utf8'))[1];
    assert.match(fm, /^type: agent$/m, f);
    const tools = /^tools: \[(.*)\]$/m.exec(fm)[1].split(/,\s*/);
    for (const t of listed) assert.ok(tools.includes(t.name) || existsSync(join(dirname(f), `${t.name}.md`)), `${f}: ${t.name}`);
    assert.doesNotMatch(readFileSync(f, 'utf8'), /run_lua is on|ALLOW_LUA=1/);
  }
});

test('honest about status and the bridge: a preview until the end-to-end run; Lua off means the tool, not the bridge', () => {
  const pj = json('.claude-plugin/plugin.json');
  assert.match(pj.description, /^Preview: /);
  assert.equal(pj.version, '1.0.0');
  const readme = read('README.md'), top = readme.split('\n## ')[0];
  assert.match(top, /\*\*Preview\.\*\*/);
  assert.match(top, /never been tested end to end with a real Aseprite/);
  assert.match(top, /0\/5/);
  assert.match(top, /\/easel-pixel:pixel[\s\S]*Aseprite 1\.3\+/, 'says what the owner runs to lift the preview');
  assert.doesNotMatch(readme, /Lua execution in Aseprite stays off/);
  assert.match(readme, /only keeps the package's `run_lua` tool\s+out of the `aseprite` MCP server/);
  assert.match(readme, /127\.0\.0\.1/);
  assert.match(readme, /any program on your\s+computer can send Aseprite commands through it, Lua included/);
  assert.match(readme, /Run it only while you draw/);
  const launcher = read('server/launch.mjs');
  assert.doesNotMatch(launcher, /Lua execution \(run_lua\) stays off/);
  assert.match(launcher, /no\s+(?:\/\/ )?authentication or Origin check/);
  assert.match(body('skills/pixel/SKILL.md'), /any program on\s+this computer can send Aseprite\s+commands through it/);
});

// D30: every surface a user reads says the same four things. Whitespace and blockquote markers are
// folded so wrapped Markdown lines match.
const flat = (s) => s.replace(/\s*\n>?\s*/g, ' ');
test('one Preview description everywhere: untested end to end, not affiliated, the bridge accepts Lua (D30)', () => {
  const REPO = join(PLUGIN, '..', '..');
  const entry = JSON.parse(readFileSync(join(REPO, '.claude-plugin', 'marketplace.json'), 'utf8')).plugins.find((p) => p.name === 'easel-pixel');
  const pj = json('.claude-plugin/plugin.json');
  assert.equal(entry.description, pj.description, 'the marketplace entry and plugin.json carry one description');
  const rootRow = readFileSync(join(REPO, 'README.md'), 'utf8').split('\n').find((l) => l.startsWith('| `easel-pixel` |'));
  assert.ok(rootRow, 'the root README lists easel-pixel');
  const surfaces = { 'plugin.json': pj.description, 'README.md': flat(read('README.md')), 'skills/pixel/SKILL.md': flat(body('skills/pixel/SKILL.md')), 'root README row': rootRow };
  for (const [name, text] of Object.entries(surfaces)) {
    assert.match(text, /\bpreview\b/i, `${name}: Preview`);
    assert.match(text, /(?:not yet|never)(?: been)? (?:tested|run) end to end with a real Aseprite/i, `${name}: not tested end to end`);
    assert.match(text, /any program on (?:this|your) computer/i, `${name}: the bridge takes commands from any local program`);
    assert.match(text, /\bLua\b/, `${name}: Lua included`);
  }
  for (const name of ['plugin.json', 'README.md', 'skills/pixel/SKILL.md']) assert.match(surfaces[name], /not affiliated with[\s\S]{0,40}Aseprite[\s\S]{0,20}Igara Studio/i, `${name}: not affiliated`);
  // only the MCP tool is off; the skill may not name run_lua (the first test), so it says "the Lua tool"
  for (const name of ['plugin.json', 'README.md']) assert.match(surfaces[name], /only[\s\S]{0,40}run_lua/, `${name}: only run_lua is off`);
  assert.match(surfaces['skills/pixel/SKILL.md'], /only keeps the Lua tool away from Claude/, 'skill: only the Lua tool is off');
});

test('setup and doctor run with Bash: the skill pre-approves node, every command starts with node, and it asks first', () => {
  const text = read('skills/pixel/SKILL.md'), fm = /^---\n([\s\S]*?)\n---\n/.exec(text)[1];
  assert.ok(field(fm, 'allowed-tools').split(/\s+/).includes('Bash(node:*)'), 'Bash(node:*) in allowed-tools');
  const cmds = [...body('skills/pixel/SKILL.md').matchAll(/`([^`]*)`/g)].map((m) => m[1]).filter((c) => c.includes('launch.mjs'));
  assert.ok(cmds.length >= 2, cmds.join('\n'));
  for (const c of cmds) assert.match(c, /^node "\$\{CLAUDE_PLUGIN_ROOT\}\/server\/launch\.mjs" (setup|doctor) --data "\$\{CLAUDE_PLUGIN_DATA\}"$/, c);
  assert.match(flat(body('skills/pixel/SKILL.md')), /run it when they agree/, 'setup installs packages and an extension: the user agrees first');
  for (const s of SKILLS.filter((x) => x !== 'pixel')) assert.doesNotMatch(read(`skills/${s}/SKILL.md`), /Bash tool|launch\.mjs" (setup|doctor)/, `${s}: setup lives in the pixel skill`);
});

test('critique views: the real size and a zoom, and frame numbers that say which frame a file is', () => {
  const critique = flat(body('skills/pixel/SKILL.md').split('## 5. Critique')[1].split('**Ship rule.**')[0]);
  assert.match(critique, /scale=1\b/, 'a 1x view (the pixel rubric looks at 1x and a zoom)');
  assert.match(critique, /scale=8\b/);
  assert.match(critique, /`f_0\.png` is frame 1/, 'export op=frames numbers files from 0; the tools count frames from 1');
  assert.doesNotMatch(critique, /labelled by frame\)/, 'say which numbering a label uses');
  // the pinned 0.8.0's schemas: `frame` is "1-based" (dist/tools/kit.js), and op "frames" expands
  // {frame} "into one file per frame, numbered from 0" (dist/tools/assets.js)
  assert.match(flat(body('skills/pixel-export/SKILL.md')), /numbered from 0 \(`<slug>_0\.png` is frame 1/);
});

test('routing: a game sprite in Aseprite (pixel), an SVG sprite sheet (svg), a pixel-art style video (animate); every routed skill exists', () => {
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(read('skills/pixel/SKILL.md'))[1];
  const routing = `${field(fm, 'description')} ${field(fm, 'when_to_use')}`;
  assert.match(routing, /sprite[^.;]*game[^.;]*Aseprite[^.;]*this skill/i, 'a game sprite drawn in Aseprite: this skill');
  assert.match(routing, /SVG sprite sheet[^.;]*easel-illustrate:svg\b/, 'an SVG sprite sheet: svg');
  assert.match(routing, /pixel-art style[^.;]*video[^.;]*easel-motion:animate|video[^.;]*pixel-art style[^.;]*easel-motion:animate/, 'a pixel-art style video: animate');
  for (const f of files()) {
    // a skill or an agent of that plugin (not the MCP server name plugin:easel-pixel:aseprite)
    for (const [, p, s] of read(f).matchAll(/(?<!plugin:)\b(easel-[a-z-]+?):([a-z][a-z-]*[a-z])\b/g)) {
      assert.ok(existsSync(join(PLUGIN, '..', p, 'skills', s, 'SKILL.md')) || existsSync(join(PLUGIN, '..', p, 'agents', `${s}.md`)), `${f}: ${p}:${s}`);
    }
  }
  // the routing evals: no word that gives the answer away
  assert.doesNotMatch(read('evals/pixel-game-sprite/prompt.md').split('---').pop(), /pixel|aseprite|8-bit/i);
  assert.match(read('evals/pixel-game-sprite/graders/skill-fired.md'), /easel-pixel:\)\?pixel"/);
  assert.match(read('evals/pixel-style-video/graders/names-animate.md'), /^type: regex$/m);
});

test('the famous-character eval fails an alternative that keeps any signature feature', () => {
  const g = read('evals/pixel-famous-character/graders/plan.md');
  const pass = /^PASS .*$/m.exec(g)[0], fail = /^FAIL .*$/m.exec(g)[0];
  assert.doesNotMatch(pass, /plumber|overalls|moustache|mustache|\bcap\b/i, 'the PASS example shares only genre and mood');
  for (const k of ['job', 'outfit', 'headwear', 'facial hair', 'colour', 'name']) assert.match(fail, new RegExp(k, 'i'), `FAIL names ${k}`);
  assert.match(body('skills/pixel/SKILL.md'), /no matching\s+outfit, headwear, facial hair, colour scheme, job or name pun/);
});

