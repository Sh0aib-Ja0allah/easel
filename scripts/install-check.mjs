#!/usr/bin/env node
// Clean-machine install check (T5.5). Installs the Easel marketplace into an empty Claude Code
// config folder, then uses each installed copy the way a user's session would: easel-core's
// doctor installs the engine into a fresh data folder and renders, every MCP server answers
// initialize and tools/list, easel-motion builds and renders a new piece, easel-design and
// easel-illustrate render their examples, easel-ai-media gives a dry run (no keys, nothing spent),
// easel-pixel's launcher reports its pinned bridge (Aseprite is not needed or run).
//
// Claude Code itself then starts the MCP servers through each plugin's .mcp.json (`claude mcp
// list`), and installing easel-motion alone into a second empty config pulls in easel-core.
//
//   node scripts/install-check.mjs --source <marketplace> --work <empty folder> [--expect-sha <sha>]
//     --source      Sh0aib-Ja0allah/easel (default; what users add) or a git URL or path
//     --work        a scratch folder: config/, config-dep/, data/ and out/ are created inside it
//     --expect-sha  the commit the installed copies must come from (CI passes the pushed commit, so
//                   the check fails instead of silently testing a newer or older main)
// Node only, no dependencies; Windows, macOS and Linux. Needs the claude CLI, Node 22 and ffmpeg.
// Easel's own (MIT).
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const source = arg('--source', 'Sh0aib-Ja0allah/easel');
const work = resolve(arg('--work', ''));
const expectSha = arg('--expect-sha', '');
if (!arg('--work')) { console.error('usage: node scripts/install-check.mjs --work <empty folder> [--source <marketplace>] [--expect-sha <sha>]'); process.exit(2); }
const config = join(work, 'config'), configDep = join(work, 'config-dep'), dataRoot = join(work, 'data'), out = join(work, 'out');
for (const d of [config, configDep, dataRoot, out]) mkdirSync(d, { recursive: true });
if (readdirSync(config).length || readdirSync(configDep).length) { console.error(`${work} is not empty: use a fresh --work folder`); process.exit(2); }

const env = { ...process.env, CLAUDE_CONFIG_DIR: config };
const results = [];
const step = (name, fn) => {
  const t0 = Date.now();
  try { const detail = fn(); results.push({ step: name, ok: true, ms: Date.now() - t0, ...(detail ? { detail } : {}) }); console.log(`ok   ${name}${detail ? `  ${JSON.stringify(detail)}` : ''}`); }
  catch (e) { results.push({ step: name, ok: false, ms: Date.now() - t0, error: String(e.message || e).slice(0, 1500) }); console.log(`FAIL ${name}\n     ${String(e.message || e).split('\n').join('\n     ')}`); }
};
// the claude CLI is a .cmd shim on Windows: run it through the shell there (fixed arguments only)
const claudeIn = (configDir, cwd, ...a) => {
  const r = spawnSync('claude', a, { env: { ...env, CLAUDE_CONFIG_DIR: configDir }, cwd, encoding: 'utf8', windowsHide: true, timeout: 300000, shell: process.platform === 'win32' });
  if (r.status !== 0) throw new Error(`claude ${a.join(' ')} -> exit ${r.status}: ${(r.stderr || r.stdout || String(r.error || '')).trim().slice(-800)}`);
  return r.stdout;
};
const claude = (...a) => claudeIn(config, undefined, ...a);
const installedRecords = (configDir) => JSON.parse(readFileSync(join(configDir, 'plugins', 'installed_plugins.json'), 'utf8')).plugins;
const node =(args, { extraEnv = {}, input, cwd } = {}) => {
  const r = spawnSync(process.execPath, args, { env: { ...env, ...extraEnv }, input, cwd, encoding: 'utf8', windowsHide: true, timeout: 900000, maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`node ${args.map((x) => String(x).slice(-60)).join(' ')} -> exit ${r.status}: ${(r.stderr || r.stdout || '').trim().slice(-800)}`);
  return r.stdout;
};
const mcp = (cmdArgs, extraEnv, wantTools) => {
  const lines = [{ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'install-check', version: '0' } } }, { jsonrpc: '2.0', id: 2, method: 'tools/list' }].map((x) => JSON.stringify(x)).join('\n') + '\n';
  const msgs = node(cmdArgs, { extraEnv, input: lines }).trim().split('\n').map((l) => JSON.parse(l));
  const tools = msgs.find((m) => m.id === 2).result.tools.map((t) => t.name);
  for (const t of wantTools) if (!tools.includes(t)) throw new Error(`tools/list has no ${t} (${tools.join(', ')})`);
  return { protocol: msgs.find((m) => m.id === 1).result.protocolVersion, tools: tools.length };
};

const PLUGINS = ['easel-core', 'easel-motion', 'easel-design', 'easel-illustrate', 'easel-ai-media', 'easel-pixel'];
let installed = {};
step(`marketplace add ${source}`, () => { claude('plugin', 'marketplace', 'add', source); });
for (const p of PLUGINS) step(`install ${p}@easel`, () => { claude('plugin', 'install', `${p}@easel`); });
step('list: every plugin installed, enabled, copied into the plugin cache', () => {
  const list = JSON.parse(claude('plugin', 'list', '--json'));
  for (const p of PLUGINS) {
    const e = list.find((x) => x.id === `${p}@easel`);
    if (!e || !e.enabled) throw new Error(`${p} is not installed and enabled`);
    if (!existsSync(join(e.installPath, '.claude-plugin', 'plugin.json'))) throw new Error(`${p}: no plugin.json at ${e.installPath}`);
    installed[p] = e.installPath;
  }
  return Object.fromEntries(list.map((x) => [x.id, x.version]));
});
if (expectSha) step(`installed copies come from ${expectSha.slice(0, 12)}`, () => {
  const recs = installedRecords(config);
  for (const p of PLUGINS) {
    const sha = ((recs[`${p}@easel`] || [])[0] || {}).gitCommitSha;
    if (sha !== expectSha) throw new Error(`${p} was installed from ${sha}, not ${expectSha} (main moved on? the newer push's CI checks that commit)`);
  }
});
step('claude mcp list: Claude Code starts the engine and media servers from .mcp.json', () => {
  const text = claudeIn(config, out, 'mcp', 'list');
  // easel-pixel's server needs its one-time setup (the bridge install), so it is not expected here
  for (const s of ['plugin:easel-core:easel', 'plugin:easel-ai-media:media']) {
    const line = text.split('\n').find((l) => l.startsWith(`${s}:`));
    if (!line || !/Connected/.test(line)) throw new Error(`${s}: ${line || 'not listed'}`);
  }
});

const core = () => installed['easel-core'];
const data = (p) => join(dataRoot, p); // stands in for ${CLAUDE_PLUGIN_DATA}
const engineEnv = () => ({ EASEL_DATA: data('easel-core'), EASEL_ROOT: core() });
const cli = (tool, args) => { const f = join(out, `${tool}-${Date.now()}.json`); writeFileSync(f, JSON.stringify(args)); return JSON.parse(node([join(core(), 'engine', 'cli.mjs'), tool, '--json', `@${f}`], { extraEnv: engineEnv() })); };

step('easel-core: doctor --install into an empty data folder', () => {
  node([join(core(), 'engine', 'cli.mjs'), 'doctor', '--install', 'true'], { extraEnv: engineEnv() });
  const r = cli('doctor', {});
  // every required check, and the libraries doctor installs (gsap, p5); optional ones (Aseprite,
  // provider keys) are the user's
  const bad = r.checks.filter((c) => !c.ok && (c.required || ['gsap', 'p5'].includes(c.name))).map((c) => c.name);
  if (bad.length) throw new Error(`doctor still reports: ${bad.join(', ')}`);
  return { checks: r.checks.length };
});
step('easel-core: MCP server (installed copy)', () => mcp([join(core(), 'engine', 'server.mjs')], engineEnv(), ['render_still', 'render_video', 'qa', 'render_pdf', 'mux_audio', 'embed_fonts']));
step('easel-core: render_still offline with bundled fonts', () => {
  const r = cli('render_still', { html: '<html><body style="margin:0;font:700 64px Inter;background:#fff;color:#111">Easel</body></html>', width: 400, height: 200, outDir: join(out, 'core') });
  if (r.warnings) throw new Error(JSON.stringify(r.warnings));
  if (!existsSync(r.files[0].file)) throw new Error('no PNG');
  return { png: r.files[0].file };
});
step('easel-motion: new piece from a style, built and rendered through the engine', () => {
  const piece = join(out, 'motion-piece');
  node([join(installed['easel-motion'], 'tools', 'new-piece.mjs'), piece, '--style', 'riso', '--formats', '9:16']);
  node([join(installed['easel-motion'], 'tools', 'build.mjs'), piece]);
  const r = cli('render_still', { file: join(piece, 'index.html'), t: 1, aspect: '9:16', outDir: join(out, 'motion') });
  if (r.warnings) throw new Error(JSON.stringify(r.warnings));
  return { png: r.files[0].file };
});
step('easel-design: an example rendered and checked', () => {
  const ex = join(installed['easel-design'], 'examples', 'logo', 'lockup.html');
  const r = cli('qa', { file: ex, width: 1200, height: 630, mode: 'graphic', fixedFrame: true, checks: ['text_clipping', 'contrast'], outDir: join(out, 'design') });
  if (!r.pass) throw new Error(JSON.stringify(r.checks));
  return { qa: 'pass' };
});
step('easel-illustrate: svg-check and the p5.js generative example (offline)', () => {
  node([join(installed['easel-illustrate'], 'tools', 'svg-check.mjs'), join(installed['easel-illustrate'], 'examples', 'svg')]);
  const r = cli('render_still', { file: join(installed['easel-illustrate'], 'examples', 'generative-art', 'tidal-script.html'), width: 600, height: 600, t: 2, outDir: join(out, 'illustrate') });
  if (r.warnings) throw new Error(JSON.stringify(r.warnings));
  return { png: r.files[0].file };
});
step('easel-ai-media: MCP server and a dry run with no keys (nothing spent)', () => {
  const noKeys = Object.fromEntries(['GEMINI_API_KEY', 'GOOGLE_API_KEY', 'OPENAI_API_KEY', 'FAL_KEY', 'REPLICATE_API_TOKEN', 'ATLASCLOUD_API_KEY', 'ELEVENLABS_API_KEY'].map((k) => [k, '']));
  const s = mcp([join(installed['easel-ai-media'], 'server', 'server.mjs')], noKeys, ['providers', 'estimate', 'generate', 'assemble', 'consent_template']);
  const lines = [{ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'install-check', version: '0' } } }, { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'generate', arguments: { kind: 'image', provider: 'openai', prompt: 'a paper boat', slug: 'install-check' } } }].map((x) => JSON.stringify(x)).join('\n') + '\n';
  const msgs = node([join(installed['easel-ai-media'], 'server', 'server.mjs')], { extraEnv: noKeys, input: lines, cwd: out }).trim().split('\n').map((l) => JSON.parse(l));
  const text = msgs.find((m) => m.id === 2).result.content[0].text;
  if (!/"dryRun": true/.test(text) || !/missing: set OPENAI_API_KEY/.test(text)) throw new Error(text.slice(0, 400));
  return s;
});
step('easel-pixel: launcher reports the pinned bridge (not installed; Aseprite not needed)', () => {
  const v = JSON.parse(node([join(installed['easel-pixel'], 'server', 'launch.mjs'), 'version', '--data', data('easel-pixel')]));
  if (v.pinned !== '0.8.0' || v.installed !== null) throw new Error(JSON.stringify(v));
  return v;
});
step('dependency: installing easel-motion alone into another empty config pulls in easel-core', () => {
  claudeIn(configDep, undefined, 'plugin', 'marketplace', 'add', source);
  claudeIn(configDep, undefined, 'plugin', 'install', 'easel-motion@easel');
  const core = (installedRecords(configDep)['easel-core@easel'] || [])[0];
  if (!core || !existsSync(join(core.installPath, '.claude-plugin', 'plugin.json'))) throw new Error('easel-core was not installed as a dependency');
  // CI run 38139487971 (Claude Code 2.1.296): the dependency came from the marketplace head, with the
  // ^1.0.0 range checked against its version
  return { easelCore: core.resolvedVersion || core.version, from: String(core.gitCommitSha).slice(0, 12) };
});

const failed = results.filter((r) => !r.ok);
writeFileSync(join(work, 'install-check.json'), JSON.stringify({ source, platform: process.platform, node: process.version, at: new Date().toISOString(), passed: results.length - failed.length, failed: failed.length, results }, null, 2) + '\n');
console.log(`\n${results.length - failed.length}/${results.length} steps passed (${join(work, 'install-check.json')})`);
process.exit(failed.length ? 1 : 0);
