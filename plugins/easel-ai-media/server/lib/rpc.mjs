// MCP JSON-RPC message handling for the easel-ai-media server (a copy of easel-core's engine rpc.mjs:
// installed plugins cannot import each other's files).
// Transport-free: handle(msg, tools) returns the response object, or undefined for notifications.
import { validateArgs } from './validate.mjs';
import { MEDIA_VERSION } from './version.mjs';

export const SUPPORTED_PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05'];
export const SERVER_INFO = { name: 'easel-media', version: MEDIA_VERSION };

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const hasId = (m) => Object.hasOwn(m, 'id') && m.id !== null && m.id !== undefined;
const error = (id, code, message) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });
const result = (id, value) => ({ jsonrpc: '2.0', id, result: value });

export function parseLine(line) {
  try {
    return { ok: true, msg: JSON.parse(line) };
  } catch {
    return { ok: false, response: error(null, -32700, 'Parse error') };
  }
}

export async function handle(msg, tools) {
  if (Array.isArray(msg)) return error(null, -32600, 'Invalid Request: batches are not supported');
  if (!isObject(msg)) return error(null, -32600, 'Invalid Request: expected a JSON object');
  const request = hasId(msg);
  const { id, method, params } = msg;
  if (typeof method !== 'string') {
    // A response object from the client (we never send requests) or garbage: ignore responses.
    if (Object.hasOwn(msg, 'result') || Object.hasOwn(msg, 'error')) return undefined;
    return error(request ? id : null, -32600, 'Invalid Request: missing method');
  }
  if (!request) return undefined; // notifications get no response
  try {
    switch (method) {
      case 'initialize': {
        const asked = isObject(params) ? params.protocolVersion : undefined;
        const protocolVersion = SUPPORTED_PROTOCOLS.includes(asked) ? asked : SUPPORTED_PROTOCOLS[0];
        return result(id, {
          protocolVersion,
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER_INFO,
          instructions: 'Easel media providers (the user\'s own keys). Every generate call is a dry run with a cost estimate unless confirm is true; never confirm without the user\'s go-ahead.',
        });
      }
      case 'ping':
        return result(id, {});
      case 'tools/list':
        return result(id, {
          tools: Object.entries(tools).map(([name, t]) => ({ name, description: t.description, inputSchema: t.inputSchema })),
        });
      case 'tools/call': {
        if (!isObject(params) || typeof params.name !== 'string') return error(id, -32602, 'Invalid params: name is required');
        if (!Object.hasOwn(tools, params.name)) return error(id, -32602, `Unknown tool: ${params.name}`);
        const tool = tools[params.name];
        const args = params.arguments === undefined ? {} : params.arguments;
        const problems = validateArgs(tool.inputSchema, args);
        if (problems.length) return result(id, toolError(`Invalid arguments: ${problems.join('; ')}`));
        try {
          const out = await tool.run(args);
          return result(id, toolResult(out));
        } catch (err) {
          return result(id, toolError(err && err.message ? err.message : String(err)));
        }
      }
      default:
        return error(id, -32601, `Method not found: ${method}`);
    }
  } catch (err) {
    return error(id, -32603, `Internal error: ${err && err.message}`);
  }
}

export function toolResult(out) {
  if (out && out.__mcp) return out.__mcp; // tools may return a raw MCP result (e.g. with images)
  const text = typeof out === 'string' ? out : JSON.stringify(out, null, 2);
  return { content: [{ type: 'text', text }], isError: false };
}

export function toolError(message) {
  return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true };
}
