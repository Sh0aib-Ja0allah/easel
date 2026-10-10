import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from '../cli.mjs';

const CLI = fileURLToPath(new URL('../cli.mjs', import.meta.url));
const run = (...a) => spawnSync(process.execPath, [CLI, ...a], { encoding: 'utf8' });

test('parseArgs handles flags, numbers, booleans and --json', () => {
  assert.deepEqual(parseArgs(['render', '--width', '640', '--dark', '--out-dir', 'x', '--json', '{"a":1}']), { name: 'render', args: { width: 640, dark: true, outDir: 'x', a: 1 } });
});

test('cli ping prints JSON', () => {
  const r = run('ping', '--message', 'hello world');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(JSON.parse(r.stdout).echo, 'hello world');
});

test('cli list names the tools', () => {
  const r = run('list');
  assert.match(r.stdout, /ping/);
  assert.match(r.stdout, /doctor/);
});

test('cli rejects unknown tools and bad args', () => {
  assert.equal(run('nope').status, 2);
  assert.equal(run('ping', '--bogus', '1').status, 2);
});

test('cli reads --json @file (UTF-8 BOM tolerated) and explains bad JSON', () => {
  const d = mkdtempSync(join(tmpdir(), 'easel-cli-'));
  try {
    const f = join(d, 'args.json');
    writeFileSync(f, '\uFEFF{"message":"from file"}');
    const r = run('ping', '--json', `@${f}`);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(JSON.parse(r.stdout).echo, 'from file');
    const bad = run('ping', '--json', '{message:x}');
    assert.equal(bad.status, 2);
    assert.match(bad.stderr, /--json @file\.json/);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
});
