// Where the engine keeps installs and writes output. Never ${CLAUDE_PLUGIN_ROOT} for installs:
// it changes on every plugin update. Never /tmp: job output goes to ./easel-out/<slug>/.
import { lstatSync, realpathSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ENGINE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const PLUGIN_DIR = resolve(ENGINE_DIR, '..');

// A value Claude Code did not substitute (e.g. the literal "${CLAUDE_PLUGIN_DATA}") counts as unset.
const usable = (v) => typeof v === 'string' && v.trim() !== '' && !v.includes('${');

export function defaultDataDir(env = process.env, os = platform()) {
  if (os === 'win32') return join(env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), 'easel', 'data');
  if (os === 'darwin') return join(homedir(), 'Library', 'Application Support', 'easel');
  return join(usable(env.XDG_DATA_HOME) ? env.XDG_DATA_HOME : join(homedir(), '.local', 'share'), 'easel');
}

export function dataDir(env = process.env, os = platform()) {
  if (usable(env.EASEL_DATA)) return resolve(env.EASEL_DATA);
  if (usable(env.CLAUDE_PLUGIN_DATA)) return resolve(env.CLAUDE_PLUGIN_DATA);
  return defaultDataDir(env, os);
}

// Chromium lives in the data dir unless PLAYWRIGHT_BROWSERS_PATH names a folder. "0" (Playwright's
// "inside the package" setting) counts as unset: doctor installs and the engine launches from one place.
export function browsersPath(env = process.env, os = platform()) {
  if (usable(env.PLAYWRIGHT_BROWSERS_PATH) && env.PLAYWRIGHT_BROWSERS_PATH.trim() !== '0') return resolve(env.PLAYWRIGHT_BROWSERS_PATH);
  return join(dataDir(env, os), 'ms-playwright');
}

// Job folder in the user's project. The slug is sanitised so it can never escape easel-out/.
export function jobDir(slug, cwd = process.cwd()) {
  const safe = String(slug || 'job').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^[.-]+|[.-]+$/g, '') || 'job';
  return join(resolve(cwd), 'easel-out', safe);
}

// Every file a tool writes goes through this check first. A link already in a job folder (a cloned
// repo can ship easel-out/demo/still.png -> ../../notes.txt) must not redirect the write: the output
// may not be a symbolic link or a file with other hard links, and its folder's real path must stay
// inside root (the tool's output folder, itself free to live anywhere). Returns the path.
export function safeOutput(file, root = dirname(file)) {
  let st = null;
  try { st = lstatSync(file); } catch (err) { if (err.code !== 'ENOENT') throw err; }
  const why = 'Easel does not write through links; delete it or choose another name or outDir';
  if (st && st.isSymbolicLink()) throw new Error(`${file} is a symbolic link: ${why}.`);
  if (st && !st.isFile()) throw new Error(`${file} exists and is not a file; choose another name or outDir.`);
  if (st && st.nlink > 1) throw new Error(`${file} has other hard links: ${why}.`);
  let inside = '';
  try { inside = relative(realpathSync(root), realpathSync(dirname(file))); } catch (err) { if (err.code !== 'ENOENT') throw err; }
  if (isAbsolute(inside) || inside.split(sep)[0] === '..') throw new Error(`${file} is in a folder that links outside ${root}: ${why}.`);
  return file;
}
