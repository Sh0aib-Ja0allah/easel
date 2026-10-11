// T4.1-T4.4: easel-ai-media's skills, attribution, settings and the HANDOFF §5 rules (no creator
// or brand style names, nothing on getting around content filters, the consent gate, no keys on
// disk, Windows-safe steps). Pure Node.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PLUGIN = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CORE = join(PLUGIN, '..', 'easel-core');
const SKILLS = ['ai-video', 'image', 'providers', 'voice'];
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
const read = (f) => readFileSync(f, 'utf8');
const json = (f) => JSON.parse(read(join(PLUGIN, f)));
const field = (fm, k) => { const m = new RegExp(`^${k}: (?:>-\\n((?:  .*\\n?)+)|(.*))`, 'm').exec(fm + '\n'); return m ? (m[1] ? m[1].split('\n').map((l) => l.trim()).join(' ').trim() : m[2].trim()) : null; };
const coreTools = new Set([...read(join(CORE, 'engine', 'tools.mjs')).matchAll(/^ {2}(\w+): \{$/gm)].map((m) => m[1]));
const { tools } = await import(new URL('../server/tools.mjs', import.meta.url));
const { PROVIDER_KEYS } = await import(new URL('../server/lib/keys.mjs', import.meta.url));
const { PROVIDERS } = await import(new URL('../server/providers/index.mjs', import.meta.url));
const mediaTools = new Set(Object.keys(tools));
// a tool name with the exact prefix of its server: mcp__plugin_<plugin>_<server>__<tool>
const toolExists = (t) => {
  let m;
  if ((m = /^mcp__plugin_easel-core_easel__(\w+)$/.exec(t))) return coreTools.has(m[1]);
  if ((m = /^mcp__plugin_easel-ai-media_media__(\w+)$/.exec(t))) return mediaTools.has(m[1]);
  return false;
};
// the skill text as shipped, without the attribution comment (which must name its source)
const body = (f) => read(f).replace(/^(---\n[\s\S]*?\n---\n)?\s*<!--[\s\S]*?-->/, '');

test('tool names are checked against the exact server prefix', () => {
  assert.equal(toolExists('mcp__plugin_easel-ai-media_media__generate'), true);
  assert.equal(toolExists('mcp__plugin_easel-core_easel__render_still'), true);
  for (const t of ['mcp__plugin_easel-WRONG_media__generate', 'mcp__plugin_easel-ai-media_easel__generate', 'mcp__plugin_easel-core_media__render_still', 'mcp__plugin_easel-core_easel__generate', 'mcp__plugin_easel-ai-media_media__render_still', 'mcp__plugin_easel-ai-media_media__nope']) assert.equal(toolExists(t), false, t);
});

test('four skills with matching names, routing text under the cap, real tools, links that resolve', () => {
  assert.deepEqual(readdirSync(join(PLUGIN, 'skills')).filter((d) => existsSync(join(PLUGIN, 'skills', d, 'SKILL.md'))).sort(), SKILLS);
  for (const s of SKILLS) {
    const text = read(join(PLUGIN, 'skills', s, 'SKILL.md')), fm = /^---\n([\s\S]*?)\n---\n/.exec(text)[1];
    assert.equal(field(fm, 'name'), s);
    const len = field(fm, 'description').length + field(fm, 'when_to_use').length;
    assert.ok(len <= 1536, `${s}: ${len}`);
    for (const t of (field(fm, 'allowed-tools') || '').split(/\s+/).filter((x) => x.startsWith('mcp__'))) assert.ok(toolExists(t), `${s}: ${t}`);
    for (const f of walk(join(PLUGIN, 'skills', s)).filter((x) => x.endsWith('.md'))) {
      const b = read(f);
      for (const t of b.match(/mcp__plugin_easel-[\w-]+?_(?:easel|media)__\w+/g) || []) assert.ok(toolExists(t), `${f}: ${t}`);
      for (const [, href] of b.matchAll(/\]\(([^)#\s]+\.(?:md|json|html|js))(?:#[^)]*)?\)/g)) assert.ok(existsSync(join(dirname(f), href)), `${f}: ${href}`);
    }
  }
});

test('adapted files name their source, commit, licence and changes; the rest say they are Easel\'s own', () => {
  let adapted = 0;
  for (const f of SKILLS.flatMap((s) => walk(join(PLUGIN, 'skills', s)))) {
    const head = read(f).slice(0, 2000);
    if (!/Easel: [\s\S]{0,300}?adapted from/.test(head)) { assert.match(head, /Easel's own/, `${f}: no attribution or "Easel's own" note`); continue; }
    adapted++;
    assert.match(head, /[\w.-]+\/[\w.-]+\s+@\s+[0-9a-f]{40}/, f);
    assert.match(head, /MIT\s+License/, f);
    assert.match(head, /Modified\s+by\s+Easel\s+\(\d{4}-\d{2}-\d{2}\)/, f);
  }
  assert.ok(adapted >= 6, `${adapted} adapted files`);
  const notice = read(join(PLUGIN, 'NOTICE.md'));
  for (const s of ['Copyright (c) 2026 Alisa Qian', 'Copyright (c) 2026 Arnav Puri', '6a85a7c341610442a6a5b1885e6e0217ab82a11f', 'c7873015add8571ca95043febad0d9e6c97ee5c6', 'Permission is hereby granted']) assert.ok(notice.includes(s), `NOTICE.md: ${s}`);
  assert.match(notice, /not affiliated with Google, OpenAI, fal\.ai, Replicate, Atlas Cloud or ElevenLabs/);
});

test('HANDOFF §5: no creator or brand style names, no real-people examples, nothing on getting around filters', () => {
  const NAMES = /\b(vox|ronaldo|cr7|messi|ghibli|kusama|haring|shinkai|kirby|dal[ií]|mario|pixar|disney|kurzgesagt|wes anderson)\b/i;
  const AROUND = /(bypass|get(?:ting)? around|work ?around|evad|trick|circumvent|jailbreak|sneak)[\w ]{0,40}(filter|moderation|content polic|safety)|(filter|moderation)[\w ]{0,40}(bypass|get(?:ting)? around|work ?around|evad|trick|circumvent)/i;
  const NEG = /\b(never|not|no|don't|do not|refuse|without)\b/i;
  for (const f of walk(join(PLUGIN, 'skills'))) {
    const b = body(f);
    assert.doesNotMatch(b, NAMES, f);
    for (const line of b.split('\n').filter((l) => AROUND.test(l))) assert.match(line, NEG, `${f}: a line about content filters that is not a refusal: ${line.trim()}`);
    // Windows-first: no curl, Python, POSIX temp or binary paths, Mac fonts
    assert.doesNotMatch(b, /\bcurl\b|python3? |pip install|\/tmp\/|\/usr\/bin|\/usr\/local|\/System\/Library|\/Library\/Fonts|PingFang|Hiragino|Helvetica|\/home\/claude|\/mnt\/user-data/, f);
  }
  const video = body(join(PLUGIN, 'skills', 'ai-video', 'SKILL.md'));
  assert.match(video, /editorial (paper-)?collage/i);
  assert.match(video, /real (people|person)[^.]*(own footage|consent)/i);
});

test('the consent gate is in the voice skill and the tools; cloning is a kind the server refuses without it', () => {
  const voice = body(join(PLUGIN, 'skills', 'voice', 'SKILL.md'));
  assert.match(voice, /consent_template/);
  assert.match(voice, /consent\.json/);
  assert.match(voice, /Never clone a public figure/);
  assert.match(tools.generate.description, /voice-clone \(only with a consent statement/);
  assert.ok(tools.consent_template.run().rules.some((r) => /public figure/.test(r)));
  // honest about what the gate is, and about the recording it needs
  assert.match(voice, /procedure the user must honour, not proof of consent/);
  assert.match(voice, /voice owner\s+themselves reading all of it aloud/);
  assert.match(voice, /names in the job folder/);
  assert.match(body(join(PLUGIN, 'skills', 'voice', 'reference', 'voices.md')), /procedure the user must honour, not proof of consent/);
  assert.ok(tools.consent_template.run().rules.some((r) => /not proof of consent/.test(r)));
});

test('paid calls: every skill that generates confirms with the quote of a dry run of the same request', () => {
  for (const s of ['image', 'ai-video', 'voice']) assert.match(body(join(PLUGIN, 'skills', s, 'SKILL.md')), /confirm: true`[^.]*`quote`|`quote`[^.]*confirm: true/, s);
  assert.match(body(join(PLUGIN, 'skills', 'providers', 'SKILL.md')), /`quote`/);
  assert.match(tools.generate.description, /quote/);
  assert.ok(tools.generate.inputSchema.properties.quote);
  const mock = JSON.parse(read(join(PLUGIN, 'evals', 'mocks', 'media', 'generate.md')));
  assert.match(mock.quote, /^[0-9a-f]{12}$/, 'the eval mock dry run hands out a quote like the server');
  assert.ok(mock.next.includes(mock.quote));
});

test('keys: one masked setting per provider, passed to the server as EASEL_CFG_<PROVIDER>; no literal values', () => {
  const { userConfig } = json('.claude-plugin/plugin.json');
  const env = json('.mcp.json').mcpServers.media.env;
  assert.deepEqual(Object.keys(PROVIDER_KEYS).sort(), Object.keys(PROVIDERS).sort());
  for (const p of Object.keys(PROVIDER_KEYS)) {
    const k = userConfig[`${p}_api_key`];
    assert.ok(k, `userConfig.${p}_api_key`);
    assert.equal(k.sensitive, true, p);
    assert.equal(k.required, false, p);
    assert.equal(env[`EASEL_CFG_${p.toUpperCase()}`], `\${user_config.${p}_api_key}`, p);
    for (const name of PROVIDER_KEYS[p]) assert.equal(env[name], `\${${name}:-}`, name);
  }
  for (const [k, v] of Object.entries(env)) assert.match(v, /^\$\{[\w.:-]+\}$/, `${k} is not a reference`);
  assert.equal(userConfig.max_spend_usd.default, 0.5);
  assert.equal(env.EASEL_MEDIA_MAX_USD, '${user_config.max_spend_usd}');
  assert.equal(json('.mcp.json').mcpServers.media.args[0], '${CLAUDE_PLUGIN_ROOT}/server/server.mjs');
});

test('prices: every model belongs to a provider and says where its price came from', () => {
  const { models } = json('server/prices.json');
  for (const [id, m] of Object.entries(models)) {
    assert.ok(Object.hasOwn(PROVIDERS, id.split('/')[0]), id);
    assert.ok(m.source, `${id}: source`);
    assert.ok(m.verify === true || /^\d{4}-\d{2}-\d{2}$/.test(m.checked || ''), `${id}: checked date or verify`);
  }
});

test('the eval mocks describe the server as it is', () => {
  const dir = join(PLUGIN, 'evals', 'mocks', 'media');
  assert.deepEqual(JSON.parse(read(join(dir, '_tools.json'))).tools, Object.entries(tools).map(([name, t]) => ({ name, description: t.description, inputSchema: t.inputSchema })), 'regenerate evals/mocks/media/_tools.json from server/tools.mjs');
  for (const name of Object.keys(tools)) assert.ok(existsSync(join(dir, `${name}.md`)), `mocks/media/${name}.md`);
});
