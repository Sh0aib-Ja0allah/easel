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
  return BUILTIN.has(t);
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
