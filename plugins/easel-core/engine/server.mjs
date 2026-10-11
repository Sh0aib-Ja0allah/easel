#!/usr/bin/env node
// Easel engine MCP server (stdio transport, JSON-RPC 2.0, one message per line).
// Zero npm dependencies on purpose (decision D9): installed plugins are copied into a cache
// without node_modules, so this layer must start before anything is installed.
import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';
import { format } from 'node:util';
import { handle, parseLine } from './lib/rpc.mjs';
import { tools } from './tools.mjs';

export function startServer({ input = process.stdin, output = process.stdout } = {}) {
  // stdout belongs to the protocol: route any stray console output to stderr.
  for (const k of ['log', 'info', 'debug', 'warn']) console[k] = (...a) => process.stderr.write(format(...a) + '\n');
  const pending = new Set();
  // tools/call requests in flight, by id: notifications/cancelled aborts one (the tool stops where it
  // can) and its response is never sent, as MCP asks.
  const inflight = new Map();
  const send = (msg) => output.write(JSON.stringify(msg) + '\n');
  const rl = createInterface({ input, crlfDelay: Infinity });
  rl.on('line', (line) => {
    if (!line.trim()) return;
    const parsed = parseLine(line);
    if (!parsed.ok) return send(parsed.response);
    const msg = parsed.msg;
    const isObj = msg !== null && typeof msg === 'object' && !Array.isArray(msg);
    if (isObj && msg.method === 'notifications/cancelled' && (msg.id === undefined || msg.id === null)) {
      const ctl = msg.params && typeof msg.params === 'object' ? inflight.get(msg.params.requestId) : undefined;
      if (ctl) ctl.abort();
      return;
    }
    const ctl = isObj && msg.method === 'tools/call' && msg.id !== undefined && msg.id !== null ? new AbortController() : null;
    if (ctl) inflight.set(msg.id, ctl);
    const p = handle(msg, tools, ctl ? { signal: ctl.signal } : {})
      .then((res) => { if (res && !(ctl && ctl.signal.aborted)) send(res); })
      .catch((err) => process.stderr.write(`easel: unexpected error: ${err && err.stack}\n`))
      .finally(() => { pending.delete(p); if (ctl && inflight.get(msg.id) === ctl) inflight.delete(msg.id); });
    pending.add(p);
  });
  rl.on('close', async () => {
    await Promise.allSettled([...pending]);
    process.exit(0);
  });
  return rl;
}

process.on('unhandledRejection', (err) => process.stderr.write(`easel: unhandled rejection: ${err && err.stack}\n`));

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) startServer();
