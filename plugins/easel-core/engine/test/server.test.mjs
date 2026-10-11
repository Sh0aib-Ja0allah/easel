import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { doctorReport } from '../lib/doctor.mjs';

const SERVER = fileURLToPath(new URL('../server.mjs', import.meta.url));
const cancelSkip = ['playwright-core', 'chromium'].every((n) => doctorReport().checks.find((c) => c.name === n)?.ok) ? false : 'needs Chromium (doctor --install)';

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

test('a cancelled tools/call gets no response, and its render stops instead of running to the end', { skip: cancelSkip }, async () => {
  const d = mkdtempSync(join(tmpdir(), 'easel-cancel-'));
  try {
    const p = spawn(process.execPath, [SERVER], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    p.stdout.on('data', (x) => (out += x));
    const closed = new Promise((r) => p.on('close', r));
    const t0 = Date.now();
    // a page that is not ready for 25 s: a server that ignored the cancel would wait for it before exiting
    const html = '<script>window.__ready = false; setTimeout(() => { window.__ready = true; }, 25000);</script>';
    p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'render_still', arguments: { html, outDir: d, width: 20, height: 20 } } }) + '\n');
    await new Promise((r) => setTimeout(r, 1500));
    p.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/cancelled', params: { requestId: 7, reason: 'the user stopped it' } }) + '\n');
    p.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: 8, method: 'ping' }) + '\n');
    p.stdin.end();
    await closed;
    assert.deepEqual(out.split('\n').filter(Boolean).map((l) => JSON.parse(l).id), [8]);
    assert.ok(Date.now() - t0 < 15000, `the server ran on for ${Date.now() - t0} ms`);
    assert.deepEqual(readdirSync(d), [], 'no still, no page left');
  } finally { rmSync(d, { recursive: true, force: true }); }
});
