// Version facts the plugin validator does not check (it accepts "version": "banana" and a dependency
// with a misspelt key): every plugin.json version is plain semver, easel-core's version matches the
// engine's package.json and ENGINE_VERSION, easel-ai-media's matches MEDIA_VERSION, the marketplace
// lists exactly the plugin folders, and every dependency on easel-core is the object form with a
// caret range that easel-core's own version satisfies. Pure Node; runs from the repository.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENGINE_VERSION } from '../lib/version.mjs';

const REPO = fileURLToPath(new URL('../../../../', import.meta.url));
const PLUGINS = join(REPO, 'plugins');
const skip = existsSync(join(REPO, '.claude-plugin', 'marketplace.json')) ? false : 'not in the repository';
const json = (...p) => JSON.parse(readFileSync(join(...p), 'utf8'));
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

test('plugin versions are semver and agree with the engine and media servers', { skip }, async () => {
  const names = readdirSync(PLUGINS).filter((p) => existsSync(join(PLUGINS, p, '.claude-plugin', 'plugin.json')));
  assert.equal(names.length, 6, names.join(', '));
  for (const p of names) {
    const m = json(PLUGINS, p, '.claude-plugin', 'plugin.json');
    assert.equal(m.name, p);
    assert.match(m.version, SEMVER, `${p} version`);
  }
  const core = json(PLUGINS, 'easel-core', '.claude-plugin', 'plugin.json').version;
  assert.equal(json(PLUGINS, 'easel-core', 'engine', 'package.json').version, core, 'engine package.json');
  assert.equal(ENGINE_VERSION, core, 'ENGINE_VERSION');
  const { MEDIA_VERSION } = await import(new URL('../../../easel-ai-media/server/lib/version.mjs', import.meta.url));
  assert.equal(MEDIA_VERSION, json(PLUGINS, 'easel-ai-media', '.claude-plugin', 'plugin.json').version, 'MEDIA_VERSION');
  const market = json(REPO, '.claude-plugin', 'marketplace.json').plugins;
  assert.deepEqual(market.map((x) => x.name).sort(), [...names].sort());
  for (const e of market) assert.equal(e.source, `./plugins/${e.name}`);
});

test('every dependency on easel-core is {name, version: ^x.y.z} and easel-core satisfies it', { skip }, () => {
  const [cMaj, cMin, cPat] = json(PLUGINS, 'easel-core', '.claude-plugin', 'plugin.json').version.match(SEMVER).slice(1).map(Number);
  for (const p of readdirSync(PLUGINS).filter((x) => x !== 'easel-core')) {
    const deps = json(PLUGINS, p, '.claude-plugin', 'plugin.json').dependencies;
    assert.ok(Array.isArray(deps) && deps.length === 1, `${p}: one dependency`);
    assert.deepEqual(Object.keys(deps[0]).sort(), ['name', 'version'], `${p}: dependency keys`);
    assert.equal(deps[0].name, 'easel-core', p);
    const m = deps[0].version.match(/^\^(\d+)\.(\d+)\.(\d+)$/);
    assert.ok(m, `${p}: ${deps[0].version} is not a caret range`);
    const [maj, min, pat] = m.slice(1).map(Number);
    const ok = cMaj === maj && (cMin > min || (cMin === min && cPat >= pat));
    assert.ok(maj > 0 && ok, `${p} needs easel-core ${deps[0].version}`);
  }
});
