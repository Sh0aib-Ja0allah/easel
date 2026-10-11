// T4.5: the launcher that installs and runs the pinned @pebbly/aseprite-ai-artist. No network and
// no real package: a stand-in package (test/fixtures/stand-in) shows what the launcher passes on.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const LAUNCH = fileURLToPath(new URL('../server/launch.mjs', import.meta.url));
const STAND_IN = fileURLToPath(new URL('./fixtures/stand-in', import.meta.url));
const L = await import(new URL('../server/launch.mjs', import.meta.url));
const base = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(ASEPRITE|EASEL_PIXEL|CLAUDE_PLUGIN)/.test(k)));
const run = (args, env = {}, input = '') => spawnSync(process.execPath, [LAUNCH, ...args], { input, encoding: 'utf8', env: { ...base, ...env }, windowsHide: true, timeout: 20000 });

test('pinned exactly, with every dependency locked by integrity hash; npm ci by this Node, install scripts off', () => {
  assert.equal(L.PACKAGE, '@pebbly/aseprite-ai-artist');
  assert.equal(L.VERSION, '0.8.0');
  const a = L.installArgs('X');
  assert.deepEqual(a.slice(0, 3), ['ci', '--prefix', 'X']);
  for (const f of ['--ignore-scripts', '--omit=dev']) assert.ok(a.includes(f), f);
  assert.deepEqual(L.bridgePackageJson().dependencies, { '@pebbly/aseprite-ai-artist': '0.8.0' });
  const lock = JSON.parse(readFileSync(L.LOCKFILE, 'utf8'));
  const top = lock.packages['node_modules/@pebbly/aseprite-ai-artist'];
  assert.equal(top.version, '0.8.0');
  assert.equal(top.integrity, 'sha512-8sph8Ec5PVY1eZP8vJL1kH3tzj3oP8Fb8A5XFasN1JB7O3G71F9wxRF5mSZ6kAdfrVtfwVCfUn1o0xsgH92/yg==', 'the integrity npm publishes for 0.8.0');
  assert.deepEqual(lock.packages[''].dependencies, { '@pebbly/aseprite-ai-artist': '0.8.0' });
  for (const [k, v] of Object.entries(lock.packages).filter(([k]) => k)) {
    assert.match(v.integrity || '', /^sha512-/, `${k} is locked by hash`);
    assert.match(v.resolved || '', /^https:\/\/registry\.npmjs\.org\//, `${k} comes from the npm registry`);
  }
  assert.ok(L.npmCli(), 'npm-cli.js next to this Node');
  assert.match(L.packageDir(join('D', 'data')), /aseprite-ai-artist-0\.8\.0$/);
  assert.equal(L.dataDir(['--data', 'Q']), join(process.cwd(), 'Q'));
  assert.equal(L.dataDir([], { EASEL_PIXEL_DATA: '${CLAUDE_PLUGIN_DATA}', CLAUDE_PLUGIN_DATA: '' }), null);
});

test('serve never installs: without the bridge it stops at once with the setup advice', () => {
  const data = mkdtempSync(join(tmpdir(), 'easel-pixel-'));
  try {
    const t0 = Date.now();
    const r = run(['serve', '--data', data]);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /not set up yet[\s\S]*easel-pixel:pixel/);
    assert.equal(r.stdout, '', 'nothing on the protocol stream');
    assert.ok(Date.now() - t0 < 10000);
    assert.deepEqual(readdirSync(data), [], 'nothing was installed');
  } finally { rmSync(data, { recursive: true, force: true }); }
});

test('doctor diagnoses and never installs: without the bridge it says so and gives the setup step', () => {
  const data = mkdtempSync(join(tmpdir(), 'easel-pixel-')), cache = mkdtempSync(join(tmpdir(), 'easel-pixel-npm-'));
  // npm offline with an empty cache: if doctor ever installs again, npm fails at once, so neither the
  // network nor the real package is reached
  const npmOff = { npm_config_offline: 'true', npm_config_cache: cache };
  try {
    const r = run(['doctor', '--data', data], npmOff);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /not set up yet[\s\S]*launch\.mjs" setup --data/);
    assert.deepEqual(readdirSync(data), [], 'nothing was installed');
    const stale = join(L.packageDir(data), 'node_modules', '@pebbly', 'aseprite-ai-artist');
    mkdirSync(stale, { recursive: true });
    writeFileSync(join(stale, 'package.json'), JSON.stringify({ name: '@pebbly/aseprite-ai-artist', version: '0.7.1', bin: 'dist/cli.js' }));
    const old = run(['doctor', '--data', data], npmOff);
    assert.equal(old.status, 1);
    assert.match(old.stderr, /0\.7\.1[\s\S]*0\.8\.0[\s\S]*setup/);
    assert.deepEqual(readdirSync(data), ['aseprite-ai-artist-0.8.0'], 'the stale copy is reported, not replaced');
  } finally { for (const d of [data, cache]) rmSync(d, { recursive: true, force: true }); }
});

test('installed(): only the pinned version counts; another version is stale and gets replaced', () => {
  const data = mkdtempSync(join(tmpdir(), 'easel-pixel-'));
  try {
    assert.equal(L.installed(data), null);
    const dir = join(L.packageDir(data), 'node_modules', '@pebbly', 'aseprite-ai-artist');
    mkdirSync(join(dir, 'dist'), { recursive: true });
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: '@pebbly/aseprite-ai-artist', version: '0.7.1', bin: 'dist/cli.js' }));
    writeFileSync(join(dir, 'dist', 'cli.js'), '');
    assert.equal(L.installed(data).stale, true);
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: '@pebbly/aseprite-ai-artist', version: '0.8.0', bin: { 'aseprite-ai-artist': 'dist/cli.js' } }));
    assert.equal(L.installed(data).cli, join(dir, 'dist', 'cli.js'));
    const v = JSON.parse(run(['version', '--data', data]).stdout);
    assert.deepEqual([v.pinned, v.installed], ['0.8.0', '0.8.0']);
  } finally { rmSync(data, { recursive: true, force: true }); }
});

test('serve: stdio passes through; Lua and prompts are forced off; unset settings are dropped', () => {
  const env = { EASEL_PIXEL_PACKAGE_DIR: STAND_IN, ASEPRITE_AI_ALLOW_LUA: '1', ASEPRITE_AI_PROMPTS: '1', ASEPRITE_PATH: '${user_config.aseprite_path}', ASEPRITE_AI_HEADLESS: 'true', ASEPRITE_AI_CONTROL_PORT: '9932' };
  const r = run(['serve'], env, JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize' }) + '\n');
  assert.equal(r.status, 0, r.stderr);
  const lines = r.stdout.trim().split('\n');
  assert.equal(lines.length, 1, 'only protocol on stdout');
  const { result } = JSON.parse(lines[0]);
  assert.equal(result.cmd, 'serve');
  assert.deepEqual(result.seen, { ASEPRITE_AI_ALLOW_LUA: '0', ASEPRITE_AI_PROMPTS: '0', ASEPRITE_AI_HEADLESS: '1', ASEPRITE_PATH: null, ASEPRITE_AI_CONTROL_PORT: '9932' });
  const off = JSON.parse(run(['serve'], { EASEL_PIXEL_PACKAGE_DIR: STAND_IN, ASEPRITE_AI_HEADLESS: '${user_config.headless}', ASEPRITE_PATH: 'C:\\Apps\\Aseprite.exe' }, '{"id":2}\n').stdout).result.seen;
  assert.deepEqual([off.ASEPRITE_AI_HEADLESS, off.ASEPRITE_PATH], [null, 'C:\\Apps\\Aseprite.exe']);  // no argument reaches the package: a flag cannot turn Lua back on
  const flagged = run(['serve', '--allowLua', '--allow-lua', 'true'], { EASEL_PIXEL_PACKAGE_DIR: STAND_IN }, '{"id":3}\n');
  const res = JSON.parse(flagged.stdout).result;
  assert.deepEqual([res.args, res.seen.ASEPRITE_AI_ALLOW_LUA], [[], '0']);
  assert.match(flagged.stderr, /ignoring --allowLua/);
});

test('the package-folder override only accepts the test stand-in; the launcher runs through a linked path', () => {
  const other = mkdtempSync(join(tmpdir(), 'easel-pixel-other-'));
  try {
    mkdirSync(join(other, 'dist'), { recursive: true });
    writeFileSync(join(other, 'package.json'), JSON.stringify({ name: '@pebbly/aseprite-ai-artist', version: '0.8.0', description: 'something else', bin: 'dist/cli.js' }));
    writeFileSync(join(other, 'dist', 'cli.js'), 'process.stdout.write("RAN")');
    const r = run(['serve'], { EASEL_PIXEL_PACKAGE_DIR: other });
    assert.equal(r.status, 2, 'not a stand-in: ignored, so there is no package and no data folder');
    assert.doesNotMatch(r.stdout, /RAN/);
    let linked = false;
    try { symlinkSync(LAUNCH, join(other, 'launch-link.mjs')); linked = true; } catch { /* no symlink rights */ }
    if (linked) {
      const v = spawnSync(process.execPath, [join(other, 'launch-link.mjs'), 'version'], { encoding: 'utf8', env: base, windowsHide: true });
      assert.equal(JSON.parse(v.stdout).pinned, '0.8.0');
    }
  } finally { rmSync(other, { recursive: true, force: true }); }
});

test('setup and doctor run the package\'s own commands; --data is not passed on; bad calls exit 2', () => {
  const setup = run(['setup', '--data', 'unused'], { EASEL_PIXEL_PACKAGE_DIR: STAND_IN });
  assert.equal(setup.status, 0, setup.stderr);
  assert.deepEqual(JSON.parse(setup.stdout).cmd, 'install-extension');
  assert.deepEqual(JSON.parse(setup.stdout).args, []);
  assert.match(setup.stderr, /Quit and reopen Aseprite/);
  assert.equal(JSON.parse(run(['doctor'], { EASEL_PIXEL_PACKAGE_DIR: STAND_IN }).stdout).cmd, 'doctor');
  const none = run(['serve']);
  assert.equal(none.status, 2);
  assert.match(none.stderr, /no data folder/);
  assert.equal(run(['bridge', '--data', 'x']).status, 2);
});
