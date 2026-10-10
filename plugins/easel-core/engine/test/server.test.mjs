import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SERVER = fileURLToPath(new URL('../server.mjs', import.meta.url));

function session(lines) {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [SERVER], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('error', reject);
    p.on('close', (code) => resolve({ code, out, err, msgs: out.split('\n').filter(Boolean).map((l) => JSON.parse(l)) }));
    for (const l of lines) p.stdin.write(l + '\n');
    p.stdin.end();
  });
}

test('server survives garbage and keeps answering', async () => {
  const r = await session([
    'null', '42', '[]', '{bad json', '"str"', '',
    JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '0' } } }),
    JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
    JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' }),
    JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'ping', arguments: { message: 'x' } } }),
  ]);
  assert.equal(r.code, 0, r.err);
  const byId = Object.fromEntries(r.msgs.filter((m) => m.id !== null).map((m) => [m.id, m]));
  assert.equal(byId[1].result.protocolVersion, '2025-06-18');
  assert.ok(byId[2].result.tools.length >= 2);
  assert.equal(JSON.parse(byId[3].result.content[0].text).echo, 'x');
  const errors = r.msgs.filter((m) => m.id === null).map((m) => m.error.code).sort();
  assert.deepEqual(errors, [-32700, -32600, -32600, -32600, -32600].sort());
});

test('every stdout line is JSON-RPC (no stray output)', async () => {
  const r = await session([JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' })]);
  for (const line of r.out.split('\n').filter(Boolean)) assert.equal(JSON.parse(line).jsonrpc, '2.0');
});

test('replies to every request before exiting when stdin closes', async () => {
  const lines = [];
  for (let i = 1; i <= 25; i++) lines.push(JSON.stringify({ jsonrpc: '2.0', id: i, method: 'tools/call', params: { name: 'ping', arguments: {} } }));
  const r = await session(lines);
  assert.equal(r.msgs.length, 25);
});
