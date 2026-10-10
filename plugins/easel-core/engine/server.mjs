#!/usr/bin/env node
// Easel engine MCP server (stdio). Zero runtime dependencies on purpose: installed plugins are
// copied into a cache without node_modules, so the MCP layer must start before anything is
// installed. Heavy dependencies (Playwright) are loaded later from ${CLAUDE_PLUGIN_DATA}.
// Protocol: JSON-RPC 2.0, one message per line on stdin/stdout (MCP stdio transport).
import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';
import { tools } from './tools.mjs';

const SERVER_INFO = { name: 'easel', version: '0.0.1' };
const SUPPORTED = ['2025-06-18', '2025-03-26', '2024-11-05'];

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

function reply(id, result) {
  send({ jsonrpc: '2.0', id, result });
}

function fail(id, code, message) {
  send({ jsonrpc: '2.0', id, error: { code, message } });
}

export async function handle(msg) {
  const { id, method, params } = msg;
  const isRequest = id !== undefined && id !== null;
  switch (method) {
    case 'initialize': {
      const asked = params && params.protocolVersion;
      const protocolVersion = SUPPORTED.includes(asked) ? asked : SUPPORTED[0];
      return { protocolVersion, capabilities: { tools: { listChanged: false } }, serverInfo: SERVER_INFO };
    }
    case 'ping':
      return {};
    case 'tools/list':
      return {
        tools: Object.entries(tools).map(([name, t]) => ({
          name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      };
    case 'tools/call': {
      const name = params && params.name;
      const tool = tools[name];
      if (!tool) throw Object.assign(new Error(`Unknown tool: ${name}`), { code: -32602 });
      try {
        const out = await tool.run((params && params.arguments) || {});
        const text = typeof out === 'string' ? out : JSON.stringify(out, null, 2);
        return { content: [{ type: 'text', text }], isError: false };
      } catch (err) {
        return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
      }
    }
    default:
      if (!isRequest || (method && method.startsWith('notifications/'))) return undefined;
      throw Object.assign(new Error(`Method not found: ${method}`), { code: -32601 });
  }
}

function main() {
  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
  rl.on('line', async (line) => {
    if (!line.trim()) return;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      return fail(null, -32700, 'Parse error');
    }
    const isRequest = msg.id !== undefined && msg.id !== null;
    try {
      const result = await handle(msg);
      if (isRequest) reply(msg.id, result === undefined ? {} : result);
    } catch (err) {
      if (isRequest) fail(msg.id, err.code || -32603, err.message);
    }
  });
  rl.on('close', () => process.exit(0));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
