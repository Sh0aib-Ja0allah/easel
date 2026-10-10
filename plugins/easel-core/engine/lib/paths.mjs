// Where the engine keeps installs and writes output. Never ${CLAUDE_PLUGIN_ROOT} for installs:
// it changes on every plugin update. Never /tmp: job output goes to ./easel-out/<slug>/.
import { homedir, platform } from 'node:os';
import { dirname, join, resolve } from 'node:path';
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

export function browsersPath(env = process.env, os = platform()) {
  if (usable(env.PLAYWRIGHT_BROWSERS_PATH)) return resolve(env.PLAYWRIGHT_BROWSERS_PATH);
  return join(dataDir(env, os), 'ms-playwright');
}

// Job folder in the user's project. The slug is sanitised so it can never escape easel-out/.
export function jobDir(slug, cwd = process.cwd()) {
  const safe = String(slug || 'job').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^[.-]+|[.-]+$/g, '') || 'job';
  return join(resolve(cwd), 'easel-out', safe);
}
