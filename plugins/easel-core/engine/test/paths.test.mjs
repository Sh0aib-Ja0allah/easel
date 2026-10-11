import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, resolve, sep } from 'node:path';
import { browsersPath, dataDir, defaultDataDir, jobDir } from '../lib/paths.mjs';

test('EASEL_DATA wins, then CLAUDE_PLUGIN_DATA', () => {
  assert.equal(dataDir({ EASEL_DATA: '/x/a', CLAUDE_PLUGIN_DATA: '/x/b' }), resolve('/x/a'));
  assert.equal(dataDir({ CLAUDE_PLUGIN_DATA: '/x/b' }), resolve('/x/b'));
});

test('an unsubstituted ${CLAUDE_PLUGIN_DATA} counts as unset', () => {
  const env = { EASEL_DATA: '${CLAUDE_PLUGIN_DATA}', LOCALAPPDATA: 'C:\\L' };
  assert.equal(dataDir(env, 'win32'), defaultDataDir(env, 'win32'));
});

test('per-OS defaults never use /tmp', () => {
  assert.equal(defaultDataDir({ LOCALAPPDATA: 'C:\\L' }, 'win32'), join('C:\\L', 'easel', 'data'));
  assert.match(defaultDataDir({}, 'darwin'), /Library.Application Support.easel$/);
  assert.equal(defaultDataDir({ XDG_DATA_HOME: '/xdg' }, 'linux'), join('/xdg', 'easel'));
  for (const os of ['win32', 'darwin', 'linux']) assert.doesNotMatch(defaultDataDir({ LOCALAPPDATA: 'C:\\L' }, os), /^\/tmp/);
});

test('browsers live in the data dir unless PLAYWRIGHT_BROWSERS_PATH is set', () => {
  assert.equal(browsersPath({ EASEL_DATA: '/d' }), join(resolve('/d'), 'ms-playwright'));
  assert.equal(browsersPath({ EASEL_DATA: '/d', PLAYWRIGHT_BROWSERS_PATH: '/b' }), resolve('/b'));
});

test('job dirs stay inside easel-out', () => {
  const base = join(resolve('/proj'), 'easel-out');
  assert.equal(jobDir('My Logo!', '/proj'), join(base, 'my-logo'));
  for (const evil of ['../../etc', '..', '/abs/path', 'a/../../b', '']) {
    const d = jobDir(evil, '/proj');
    assert.ok(d.startsWith(base + sep), `${evil} -> ${d}`);
  }
});

test('PLAYWRIGHT_BROWSERS_PATH=0 (Playwright\'s "inside the package") counts as unset: the data dir is used', () => {
  assert.equal(browsersPath({ EASEL_DATA: '/d', PLAYWRIGHT_BROWSERS_PATH: '0' }), join(resolve('/d'), 'ms-playwright'));
});
