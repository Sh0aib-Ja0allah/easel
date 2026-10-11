#!/usr/bin/env node
// easel-ai-media MCP server ("media"): stdio, JSON-RPC 2.0, one message per line. Zero npm
// dependencies (installed plugins are copied without node_modules). Keys come from the environment or
// the plugin's settings and are never written to disk or printed.
import fs from 'node:fs';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { format } from 'node:util';
import { handle, parseLine } from './lib/rpc.mjs';
import { maskSecrets } from './lib/keys.mjs';
import { tools } from './tools.mjs';

export function startServer({ input = process.stdin, output = process.stdout } = {}) {
  for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = (...a) => process.stderr.write(maskSecrets(format(...a)) + '\n');
  const pending = new Set();
  const send = (msg) => output.write(maskSecrets(JSON.stringify(msg)) + '\n');
  const rl = createInterface({ input, crlfDelay: Infinity });
  rl.on('line', (line) => {
    if (!line.trim()) return;
    const parsed = parseLine(line);
    if (!parsed.ok) return send(parsed.response);
    const p = handle(parsed.msg, tools).then((res) => { if (res) send(res); }).catch((err) => process.stderr.write(`easel-media: ${maskSecrets(err && err.stack)}\n`)).finally(() => pending.delete(p));
    pending.add(p);
  });
  rl.on('close', async () => { await Promise.allSettled([...pending]); process.exit(0); });
  return rl;
}
process.on('unhandledRejection', (err) => process.stderr.write(`easel-media: unhandled rejection: ${maskSecrets(err && err.stack)}\n`));
const isMain = (() => { try { const a = fs.realpathSync(process.argv[1]), b = fs.realpathSync(fileURLToPath(import.meta.url)); return process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b; } catch { return false; } })();
if (isMain) startServer();
