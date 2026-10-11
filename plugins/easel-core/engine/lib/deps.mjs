// Loads heavy dependencies (Playwright) from the data dir that doctor installs into, falling
// back to engine/node_modules when developing in the repo.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ENGINE_DIR, browsersPath, dataDir } from './paths.mjs';

export function pinnedVersions() {
  const pkg = JSON.parse(readFileSync(join(ENGINE_DIR, 'package.json'), 'utf8'));
  return { ...(pkg.dependencies || {}) };
}

export function findPackage(name, env = process.env) {
  for (const base of [dataDir(env), ENGINE_DIR]) {
    const dir = join(base, 'node_modules', ...name.split('/'));
    const pj = join(dir, 'package.json');
    if (existsSync(pj)) {
      const { version } = JSON.parse(readFileSync(pj, 'utf8'));
      return { dir, version, from: base === ENGINE_DIR ? 'engine' : 'data' };
    }
  }
  return null;
}

let playwright;
export async function loadPlaywright(env = process.env) {
  if (playwright) return playwright;
  const found = findPackage('playwright-core', env);
  if (!found) throw new Error('playwright-core is not installed. Run the Easel doctor tool with install: true (or /easel-core:setup).');
  // Playwright reads PLAYWRIGHT_BROWSERS_PATH when it is imported. Always the folder doctor checks and
  // installs into (browsersPath), so "0", a relative path or an unsubstituted ${...} cannot split them.
  process.env.PLAYWRIGHT_BROWSERS_PATH = browsersPath(env);
  playwright = await import(pathToFileURL(join(found.dir, 'index.mjs')).href);
  return playwright;
}

// Path to a library file (e.g. gsap.min.js) installed by doctor into the data dir, or null.
export function libraryFile(pkgName, relPath, env = process.env) {
  const found = findPackage(pkgName, env);
  if (!found) return null;
  const file = join(found.dir, ...relPath.split('/'));
  return existsSync(file) ? file : null;
}
