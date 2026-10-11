// doctor: checks (and optionally installs) everything the engine needs.
// Never prints secret values: provider keys are reported by name only.
import { spawnSync } from 'node:child_process';
import { accessSync, constants, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { platform, arch } from 'node:os';
import { browsersPath, dataDir } from './paths.mjs';
import { findPackage, pinnedVersions } from './deps.mjs';
import { findBinary, installHint } from './binaries.mjs';
import { ENGINE_VERSION } from './version.mjs';

export const PROVIDER_KEYS = ['GEMINI_API_KEY', 'OPENAI_API_KEY', 'FAL_KEY', 'REPLICATE_API_TOKEN', 'ATLASCLOUD_API_KEY', 'ELEVENLABS_API_KEY'];
const MIN_NODE = 20;

function headlessShellRevision(pwDir) {
  try {
    const b = JSON.parse(readFileSync(join(pwDir, 'browsers.json'), 'utf8'));
    const shell = b.browsers.find((x) => x.name === 'chromium-headless-shell') || b.browsers.find((x) => x.name === 'chromium');
    return shell && shell.revision;
  } catch {
    return null;
  }
}

function checkWritable(dir) {
  try {
    mkdirSync(dir, { recursive: true });
    accessSync(dir, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function asepritePaths(env, os) {
  if (os === 'win32') {
    const pf = env.ProgramFiles || 'C:\\Program Files';
    const pf86 = env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    return [join(pf, 'Aseprite', 'Aseprite.exe'), join(pf86, 'Steam', 'steamapps', 'common', 'Aseprite', 'Aseprite.exe'), join(pf, 'Steam', 'steamapps', 'common', 'Aseprite', 'Aseprite.exe')];
  }
  if (os === 'darwin') return ['/Applications/Aseprite.app/Contents/MacOS/aseprite'];
  return [join(env.HOME || '', '.steam', 'steam', 'steamapps', 'common', 'Aseprite', 'aseprite')];
}

export function doctorReport(env = process.env, os = platform()) {
  const checks = [];
  const add = (name, ok, required, detail, fix) => checks.push({ name, ok, required, detail, ...(ok ? {} : { fix }) });
  const pins = pinnedVersions();
  const data = dataDir(env, os);
  const browsers = browsersPath(env, os);

  const major = Number(process.versions.node.split('.')[0]);
  add('node', major >= MIN_NODE, true, `v${process.versions.node}`, `Install Node.js ${MIN_NODE} or newer from https://nodejs.org`);
  add('data dir', checkWritable(data), true, data, 'The plugin data folder is not writable; check permissions.');

  for (const name of Object.keys(pins)) {
    const found = findPackage(name, env);
    const ok = !!found && found.version === pins[name];
    add(name, ok, name === 'playwright-core', found ? `${found.version} (${found.from})` : 'not installed',
      found ? `Version ${found.version} is installed but ${pins[name]} is pinned. Run doctor with install: true.` : 'Run doctor with install: true (or /easel-core:setup).');
  }

  const pw = findPackage('playwright-core', env);
  const rev = pw && headlessShellRevision(pw.dir);
  const shellDir = rev ? join(browsers, `chromium_headless_shell-${rev}`) : null;
  const shellOk = !!shellDir && existsSync(shellDir) && readdirSync(shellDir).length > 0;
  add('chromium', shellOk, true, shellOk ? shellDir : `missing (expected in ${browsers})`, 'Run doctor with install: true. It downloads Chromium headless shell (about 110 MB) into the plugin data folder.');

  for (const bin of ['ffmpeg', 'ffprobe']) {
    const b = findBinary(bin, env, os);
    add(bin, !!b, true, b ? `${b.version}${b.onPath ? '' : ` (found at ${b.path}, not on PATH; restart Claude Code to pick up PATH)`}` : 'not found', installHint(bin, os));
  }

  // Easel calls Python as `python`; on macOS and Linux only `python3` may exist, so report either.
  let py = spawnSync('python', ['--version'], { encoding: 'utf8', windowsHide: true, timeout: 10000, env });
  if ((py.error || py.status !== 0) && os !== 'win32') py = spawnSync('python3', ['--version'], { encoding: 'utf8', windowsHide: true, timeout: 10000, env });
  add('python (optional)', !py.error && py.status === 0, false, py.status === 0 ? (py.stdout || py.stderr).trim() : 'not found', 'Only needed for optional audio features.');
  const ase = asepritePaths(env, os).find((p) => existsSync(p));
  add('aseprite (optional)', !!ase, false, ase || 'not found', 'Only needed for easel-pixel. Aseprite is a paid app from https://www.aseprite.org (Easel is not affiliated with it).');

  const keys = PROVIDER_KEYS.filter((k) => typeof env[k] === 'string' && env[k].trim() !== '');
  add('provider keys (optional)', keys.length > 0, false, keys.length ? `set: ${keys.join(', ')}` : 'none set', `Only needed for easel-ai-media. Set one of: ${PROVIDER_KEYS.join(', ')}.`);

  const ok = checks.filter((c) => c.required).every((c) => c.ok);
  return { ok, engine: ENGINE_VERSION, platform: `${os}-${arch()}`, node: process.version, dataDir: data, browsersPath: browsers, checks };
}

function run(cmd, args, opts) {
  const win = platform() === 'win32';
  const r = spawnSync(cmd, args, { encoding: 'utf8', windowsHide: true, shell: win && cmd === 'npm', ...opts });
  const tail = `${r.stdout || ''}${r.stderr || ''}`.trim().split(/\r?\n/).slice(-6).join('\n');
  if (r.error || r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed (${r.error ? r.error.message : `exit ${r.status}`}):\n${tail}`);
  return tail;
}

export function install(env = process.env) {
  const data = dataDir(env);
  mkdirSync(data, { recursive: true });
  const steps = [];
  writeFileSync(join(data, 'package.json'), JSON.stringify({ name: 'easel-engine-data', private: true, description: 'Dependencies installed by the Easel doctor tool', dependencies: pinnedVersions() }, null, 2) + '\n');
  // cwd instead of --prefix: no path quoting through the Windows shell.
  steps.push({ step: 'npm install', log: run('npm', ['install', '--no-audit', '--no-fund', '--omit=dev'], { cwd: data, env }) });
  const pw = findPackage('playwright-core', { ...env, EASEL_DATA: data });
  if (!pw || pw.from !== 'data') throw new Error('playwright-core did not install into the data folder.');
  const browsers = browsersPath(env);
  steps.push({ step: 'chromium headless shell', log: run(process.execPath, [join(pw.dir, 'cli.js'), 'install', '--only-shell', 'chromium'], { cwd: data, env: { ...env, PLAYWRIGHT_BROWSERS_PATH: browsers } }) });
  return steps;
}

export async function doctor(args = {}, env = process.env) {
  if (args.install) {
    const steps = install(env);
    return { installed: steps.map((s) => s.step), ...doctorReport(env) };
  }
  return doctorReport(env);
}
