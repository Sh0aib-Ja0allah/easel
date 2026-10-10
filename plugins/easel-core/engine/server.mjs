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
  const send = (msg) => output.write(JSON.stringify(msg) + '\n');
  const rl = createInterface({ input, crlfDelay: Infinity });
  rl.on('line', (line) => {
    if (!line.trim()) return;
    const parsed = parseLine(line);
    if (!parsed.ok) return send(parsed.response);
    const p = handle(parsed.msg, tools)
      .then((res) => { if (res) send(res); })
      .catch((err) => process.stderr.write(`easel: unexpected error: ${err && err.stack}\n`))
      .finally(() => pending.delete(p));
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
