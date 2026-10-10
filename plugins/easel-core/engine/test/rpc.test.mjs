import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handle, parseLine, SUPPORTED_PROTOCOLS } from '../lib/rpc.mjs';
import { tools as realTools } from '../tools.mjs';

const tools = {
  ...realTools,
  boom: { description: 'throws', inputSchema: { type: 'object' }, run: async () => { throw new Error('kaboom'); } },
  need: { description: 'needs x', inputSchema: { type: 'object', required: ['x'], properties: { x: { type: 'number' } }, additionalProperties: false }, run: async (a) => a.x * 2 },
};
const call = (name, args, id = 1) => handle({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } }, tools);

test('initialize echoes a supported protocol version', async () => {
  for (const v of SUPPORTED_PROTOCOLS) {
    const r = await handle({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: v } }, tools);
    assert.equal(r.result.protocolVersion, v);
    assert.deepEqual(r.result.capabilities, { tools: { listChanged: false } });
    assert.equal(r.result.serverInfo.name, 'easel');
  }
});

test('initialize falls back to the newest version for an unknown one', async () => {
  const r = await handle({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '1999-01-01' } }, tools);
  assert.equal(r.result.protocolVersion, SUPPORTED_PROTOCOLS[0]);
});

test('notifications get no response', async () => {
  assert.equal(await handle({ jsonrpc: '2.0', method: 'notifications/initialized' }, tools), undefined);
  assert.equal(await handle({ jsonrpc: '2.0', method: 'tools/list' }, tools), undefined);
});

test('non-object messages are -32600, not a crash', async () => {
  for (const bad of [null, 42, 'str', true]) {
    const r = await handle(bad, tools);
    assert.equal(r.error.code, -32600, `for ${JSON.stringify(bad)}`);
    assert.equal(r.id, null);
  }
});

test('batches are rejected with -32600', async () => {
  const r = await handle([{ jsonrpc: '2.0', id: 1, method: 'ping' }], tools);
  assert.equal(r.error.code, -32600);
});

test('a request without a method is -32600; client responses are ignored', async () => {
  assert.equal((await handle({ jsonrpc: '2.0', id: 7 }, tools)).error.code, -32600);
  assert.equal(await handle({ jsonrpc: '2.0', id: 7, result: {} }, tools), undefined);
});

test('unknown method is -32601', async () => {
  const r = await handle({ jsonrpc: '2.0', id: 3, method: 'nope' }, tools);
  assert.equal(r.error.code, -32601);
  assert.equal(r.id, 3);
});

test('ping method returns an empty result', async () => {
  assert.deepEqual((await handle({ jsonrpc: '2.0', id: 'a', method: 'ping' }, tools)).result, {});
});

test('tools/list lists real tools with schemas', async () => {
  const r = await handle({ jsonrpc: '2.0', id: 1, method: 'tools/list' }, realTools);
  const names = r.result.tools.map((t) => t.name);
  assert.ok(names.includes('ping') && names.includes('doctor'));
  for (const t of r.result.tools) assert.equal(t.inputSchema.type, 'object');
});

test('tools/call returns text content', async () => {
  const r = await call('ping', { message: 'hi' });
  assert.equal(r.result.isError, false);
  assert.equal(JSON.parse(r.result.content[0].text).echo, 'hi');
});

test('unknown tool and prototype names are -32602', async () => {
  for (const name of ['nope', 'toString', '__proto__', 'constructor', 'hasOwnProperty']) {
    const r = await call(name, {});
    assert.equal(r.error.code, -32602, name);
  }
});

test('tools/call without a name is -32602', async () => {
  const r = await handle({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: {} }, tools);
  assert.equal(r.error.code, -32602);
});

test('invalid arguments come back as a tool error', async () => {
  for (const args of [{}, { x: 'no' }, { x: 1, y: 2 }, 5]) {
    const r = await call('need', args);
    assert.equal(r.result.isError, true, JSON.stringify(args));
    assert.match(r.result.content[0].text, /Invalid arguments/);
  }
  assert.equal((await call('need', { x: 2 })).result.content[0].text, '4');
});

test('a throwing tool is reported as isError, not a protocol error', async () => {
  const r = await call('boom', {});
  assert.equal(r.result.isError, true);
  assert.match(r.result.content[0].text, /kaboom/);
});

test('parseLine reports parse errors as -32700', () => {
  const p = parseLine('{not json');
  assert.equal(p.ok, false);
  assert.equal(p.response.error.code, -32700);
});
