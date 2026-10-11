#!/usr/bin/env node
// easel-pixel launcher (Easel's own, MIT). Runs the pinned @pebbly/aseprite-ai-artist package (the
// Aseprite bridge and MCP server, MIT, by with-pebbly; Easel is not affiliated with it, with
// Aseprite or with Igara Studio) from the plugin data folder:
//
//   node launch.mjs serve                  the MCP server (what .mcp.json starts); never installs
//   node launch.mjs setup  --data <dir>    install the pinned package, then the Aseprite extension
//   node launch.mjs doctor --data <dir>    the package's own diagnosis
//   node launch.mjs version                the pinned version and whether it is installed
//
// setup installs into <data>/aseprite-ai-artist-<version>/ (CLAUDE_PLUGIN_DATA, never the plugin
// root) from the lockfile shipped next to this script (server/bridge-lock.json: every dependency
// pinned with its integrity hash), with `npm ci` run by the same Node (no npx, no .cmd shims, no
// shell) and install scripts off, one install at a time. serve only runs what setup installed, so a
// session start never waits on the network. While serving, nothing but the MCP protocol is written
// to stdout. The run_lua MCP tool stays off (ASEPRITE_AI_ALLOW_LUA=0), whatever is passed. That only
// hides the tool from this MCP server: the package's bridge, a detached process listening on
// 127.0.0.1 only (ports 9931 and 9932, as the pinned 0.8.0 source binds them), has no
// authentication or Origin check and forwards any command a local program sends, lua.run and
// exports to any path included, to the Aseprite extension while Aseprite is open. Easel does not
// patch the package; the README tells users to run it only while drawing.
import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PACKAGE = '@pebbly/aseprite-ai-artist';
export const VERSION = '0.8.0';
const log = (...a) => process.stderr.write(`easel-pixel: ${a.join(' ')}\n`);

// An unset ${user_config.x} or ${VAR} reaches the process as its literal text, or as ''.
const unset = (v) => v === undefined || v === null || String(v).trim() === '' || /^\$\{[^}]*\}$/.test(String(v).trim());

export function dataDir(argv, env = process.env) {
  const i = argv.indexOf('--data');
  const fromArg = i >= 0 ? argv[i + 1] : undefined;
  for (const v of [fromArg, env.EASEL_PIXEL_DATA, env.CLAUDE_PLUGIN_DATA]) if (!unset(v)) return resolve(v);
  return null;
}

export function packageDir(data) { return join(data, `aseprite-ai-artist-${VERSION}`); }

// The installed package's CLI, if the pinned version is there. EASEL_PIXEL_PACKAGE_DIR points at a
// stand-in package for the tests, and is only honoured for one (its description says so).
export function installed(data, env = process.env) {
  let dir = data && join(packageDir(data), 'node_modules', ...PACKAGE.split('/'));
  if (!unset(env.EASEL_PIXEL_PACKAGE_DIR)) {
    const alt = resolve(env.EASEL_PIXEL_PACKAGE_DIR);
    try { if (/^Easel test stand-in/.test(JSON.parse(readFileSync(join(alt, 'package.json'), 'utf8')).description || '')) dir = alt; } catch { /* not a stand-in */ }
  }
  if (!dir) return null;
  const pj = join(dir, 'package.json');
  if (!existsSync(pj)) return null;
  const meta = JSON.parse(readFileSync(pj, 'utf8'));
  if (meta.name !== PACKAGE || meta.version !== VERSION) return { stale: true, version: meta.version, dir };
  const bin = typeof meta.bin === 'string' ? meta.bin : meta.bin && meta.bin['aseprite-ai-artist'];
  const cli = join(dir, bin || 'dist/cli.js');
  return existsSync(cli) ? { dir, cli, version: meta.version } : null;
}

// npm's own script, run with this Node: works on Windows without a shell.
export function npmCli(execPath = process.execPath) {
  const base = dirname(execPath);
  for (const p of [join(base, 'node_modules', 'npm', 'bin', 'npm-cli.js'), join(base, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js')]) if (existsSync(p)) return p;
  return null;
}

export const LOCKFILE = join(dirname(fileURLToPath(import.meta.url)), 'bridge-lock.json');
export function installArgs(prefix) {
  return ['ci', '--prefix', prefix, '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund', '--loglevel=error'];
}
export function bridgePackageJson() {
  return { name: 'easel-pixel-bridge', private: true, description: `Installed by easel-pixel: ${PACKAGE}@${VERSION}`, dependencies: { [PACKAGE]: VERSION } };
}

const sleepSync = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
// One install at a time per data folder: a lock file, taken atomically; a lock older than ten
// minutes is left over from a crash and is taken over.
function withLock(data, fn) {
  const lock = join(data, '.install.lock');
  const t0 = Date.now();
  for (;;) {
    try { writeFileSync(lock, String(process.pid), { flag: 'wx' }); break; } catch (err) {
      if (err.code !== 'EEXIST') throw err;
      let age = 0;
      try { age = Date.now() - statSync(lock).mtimeMs; } catch { continue; }
      if (age > 600000) { rmSync(lock, { force: true }); continue; }
      if (Date.now() - t0 > 300000) throw new Error('another install of the Aseprite bridge is still running; try again in a few minutes');
      sleepSync(1000);
    }
  }
  try { return fn(); } finally { rmSync(lock, { force: true }); }
}

export function install(data) {
  const have = installed(data);
  if (have && !have.stale) return have;
  const npm = npmCli();
  if (!npm) throw new Error('npm was not found next to Node. Install Node 22.6 or newer from nodejs.org (it includes npm) and try again.');
  if (!existsSync(LOCKFILE)) throw new Error(`the lockfile ${LOCKFILE} is missing: reinstall the easel-pixel plugin`);
  mkdirSync(data, { recursive: true });
  return withLock(data, () => {
    const again = installed(data);
    if (again && !again.stale) return again; // another run installed it while we waited
    const final = packageDir(data), stage = `${final}.tmp-${process.pid}`;
    rmSync(stage, { recursive: true, force: true });
    mkdirSync(stage, { recursive: true });
    writeFileSync(join(stage, 'package.json'), JSON.stringify(bridgePackageJson(), null, 2));
    copyFileSync(LOCKFILE, join(stage, 'package-lock.json'));
    log(`installing ${PACKAGE}@${VERSION} (and its locked dependencies) into the plugin data folder...`);
    const r = spawnSync(process.execPath, [npm, ...installArgs(stage)], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', windowsHide: true, timeout: 300000 });
    if (r.status !== 0) { rmSync(stage, { recursive: true, force: true }); throw new Error(`npm ci failed (exit ${r.status}): ${(r.stderr || r.stdout || String(r.error || '')).trim().slice(-800)}`); }
    rmSync(final, { recursive: true, force: true });
    renameSync(stage, final);
    const now = installed(data);
    if (!now || now.stale) throw new Error(`${PACKAGE}@${VERSION} did not install correctly into ${final}`);
    return now;
  });
}

// The environment for the package: the run_lua tool off, unset settings removed, prompts off
// (Easel's skills are the workflows).
export function childEnv(env = process.env) {
  const out = { ...env };
  for (const k of ['ASEPRITE_PATH', 'ASEPRITE_AI_HEADLESS', 'ASEPRITE_AI_PLUGIN_PORT', 'ASEPRITE_AI_CONTROL_PORT', 'ASEPRITE_USER_FOLDER']) if (unset(out[k])) delete out[k];
  if (out.ASEPRITE_AI_HEADLESS !== undefined) out.ASEPRITE_AI_HEADLESS = /^(1|true|yes)$/i.test(String(out.ASEPRITE_AI_HEADLESS).trim()) ? '1' : '0';
  out.ASEPRITE_AI_ALLOW_LUA = '0';
  out.ASEPRITE_AI_PROMPTS = '0';
  return out;
}

function run(cli, args, stdio) {
  return new Promise((done) => {
    const child = spawn(process.execPath, [cli, ...args], { stdio, env: childEnv(), windowsHide: true });
    for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));
    child.on('exit', (code, signal) => done(code ?? (signal ? 1 : 0)));
    child.on('error', (err) => { log(String(err.message || err)); done(1); });
  });
}

export async function main(argv = process.argv.slice(2)) {
  const cmd = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'serve';
  const rest = argv.slice(argv[0] === cmd ? 1 : 0);
  // only --data is read; nothing else is passed on (no flag can turn the run_lua tool back on)
  const ignored = rest.filter((a, i) => a !== '--data' && rest[i - 1] !== '--data');
  if (ignored.length) log(`ignoring ${ignored.join(' ')} (settings come from /plugin configure easel-pixel)`);
  const data = dataDir(rest);
  if (cmd === 'version') {
    const have = data && installed(data);
    process.stdout.write(JSON.stringify({ package: PACKAGE, pinned: VERSION, installed: have && !have.stale ? have.version : null, data }) + '\n');
    return 0;
  }
  if (!['serve', 'setup', 'doctor'].includes(cmd)) { log(`unknown command '${cmd}' (use serve, setup, doctor or version)`); return 2; }
  const pkg0 = installed(data);
  if (!data && !pkg0) { log('no data folder: pass --data "<plugin data folder>" (the pixel skill shows the exact command)'); return 2; }
  if (cmd === 'serve') {
    if (!pkg0 || pkg0.stale) { log(`the Aseprite bridge (${PACKAGE}@${VERSION}) is not set up yet. Ask for pixel art and the easel-pixel:pixel skill runs its setup step, then reconnect "aseprite" with /mcp.`); return 1; }
    return run(pkg0.cli, ['serve'], 'inherit');
  }
  let pkg;
  try { pkg = install(data); } catch (err) { log(String(err.message || err)); return 1; }
  if (cmd === 'doctor') return run(pkg.cli, ['doctor'], 'inherit');
  // setup: the package is in place; now the Lua extension into Aseprite's user folder.
  log(`${PACKAGE}@${VERSION} is installed in ${packageDir(data)}`);
  const code = await run(pkg.cli, ['install-extension'], 'inherit');
  if (code === 0) log('done. Quit and reopen Aseprite, then run /mcp in Claude Code and reconnect "aseprite" if its tools are missing.');
  return code;
}

const isMain = (() => { try { const a = realpathSync(process.argv[1]), b = realpathSync(fileURLToPath(import.meta.url)); return process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b; } catch { return false; } })();
if (isMain) main().then((code) => { process.exitCode = code; });
