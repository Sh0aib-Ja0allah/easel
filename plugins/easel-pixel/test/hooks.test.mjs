// T4.5: the hooks (adapted from aseprite-ai-artist): the look nudge fires once per session after a
// pixel change, and the session status says whether the bridge is set up and reachable.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import net from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HOOKS = fileURLToPath(new URL('../hooks/', import.meta.url));
const base = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(ASEPRITE|CLAUDE_PLUGIN)/.test(k)));
const hook = (name, env, input = '') => {
  const r = spawnSync(process.execPath, [join(HOOKS, name)], { input, encoding: 'utf8', env: { ...base, ...env }, windowsHide: true, timeout: 10000 });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout ? JSON.parse(r.stdout).hookSpecificOutput : null;
};
const freePort = () => new Promise((res) => { const s = net.createServer().listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => res(port)); }); });

test('hooks.json: exec form (no shell), matchers on the pixel-changing tools only', () => {
  const { hooks } = JSON.parse(readFileSync(join(HOOKS, 'hooks.json'), 'utf8'));
  for (const h of [...hooks.SessionStart, ...hooks.PostToolUse].flatMap((x) => x.hooks)) {
    assert.equal(h.command, 'node');
    assert.match(h.args[0], /^\$\{CLAUDE_PLUGIN_ROOT\}\/hooks\/[\w-]+\.mjs$/);
  }
  assert.equal(hooks.PostToolUse[0].matcher, ['draw', 'recolor', 'transform'].map((t) => `mcp__plugin_easel-pixel_aseprite__${t}`).join('|'));
});

test('look nudge: once per session, a safe marker file name, nothing on bad input', () => {
  const data = mkdtempSync(join(tmpdir(), 'easel-pixel-hook-'));
  try {
    const env = { CLAUDE_PLUGIN_DATA: data };
    const first = hook('look-nudge.mjs', env, JSON.stringify({ session_id: '../../evil/s1', tool_name: 'mcp__plugin_easel-pixel_aseprite__draw' }));
    assert.equal(first.hookEventName, 'PostToolUse');
    assert.match(first.additionalContext, /mcp__plugin_easel-pixel_aseprite__look/);
    assert.equal(hook('look-nudge.mjs', env, JSON.stringify({ session_id: '../../evil/s1' })), null);
    assert.deepEqual(readdirSync(join(data, 'look-nudge')), ['______evil_s1.seen']);
    assert.ok(hook('look-nudge.mjs', env, JSON.stringify({ session_id: 's2' })));
    assert.equal(hook('look-nudge.mjs', env, 'not json'), null);
  } finally { rmSync(data, { recursive: true, force: true }); }
});

test('look nudge: markers of sessions older than a week are removed when a new session writes one', () => {
  const data = mkdtempSync(join(tmpdir(), 'easel-pixel-hook-'));
  try {
    const dir = join(data, 'look-nudge'), week = 7 * 24 * 3600;
    mkdirSync(dir, { recursive: true });
    for (const n of ['old.seen', 'recent.seen', 'keep.txt']) writeFileSync(join(dir, n), '1');
    const t = Date.now() / 1000;
    utimesSync(join(dir, 'old.seen'), t - week - 3600, t - week - 3600);
    utimesSync(join(dir, 'recent.seen'), t - week + 3600, t - week + 3600);
    assert.ok(hook('look-nudge.mjs', { CLAUDE_PLUGIN_DATA: data }, JSON.stringify({ session_id: 's3' })));
    assert.deepEqual(readdirSync(dir).sort(), ['keep.txt', 'recent.seen', 's3.seen']);
  } finally { rmSync(data, { recursive: true, force: true }); }
});

test('session status: not set up, set up but no bridge, bridge up, headless', async () => {
  const data = mkdtempSync(join(tmpdir(), 'easel-pixel-hook-'));
  try {
    assert.match(hook('session-status.mjs', { CLAUDE_PLUGIN_DATA: data }).additionalContext, /not set up yet[\s\S]*easel-pixel:pixel/);
    const pj = join(data, 'aseprite-ai-artist-0.8.0', 'node_modules', '@pebbly', 'aseprite-ai-artist');
    mkdirSync(pj, { recursive: true }); writeFileSync(join(pj, 'package.json'), '{}');
    const port = await freePort();
    assert.match(hook('session-status.mjs', { CLAUDE_PLUGIN_DATA: data, ASEPRITE_AI_CONTROL_PORT: String(port) }).additionalContext, new RegExp(`no Aseprite bridge on :${port}`));
    const server = net.createServer((s) => s.end()).listen(0, '127.0.0.1');
    await new Promise((r) => server.once('listening', r));
    const up = server.address().port;
    // spawn (not spawnSync): the probe needs this process's event loop to accept the connection
    const out = await new Promise((res) => { const c = spawn(process.execPath, [join(HOOKS, 'session-status.mjs')], { env: { ...base, CLAUDE_PLUGIN_DATA: data, ASEPRITE_AI_CONTROL_PORT: String(up) } }); let s = ''; c.stdout.on('data', (d) => { s += d; }); c.on('close', () => res(JSON.parse(s).hookSpecificOutput)); });
    server.close();
    assert.match(out.additionalContext, new RegExp(`bridge is up on :${up}`));
    assert.match(hook('session-status.mjs', { CLAUDE_PLUGIN_DATA: data, CLAUDE_PLUGIN_OPTION_HEADLESS: 'true' }).additionalContext, /headless mode/);
  } finally { rmSync(data, { recursive: true, force: true }); }
});
