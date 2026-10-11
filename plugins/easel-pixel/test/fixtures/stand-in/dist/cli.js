// Easel test stand-in for the pinned package's CLI (Easel's own): answers one MCP request with the
// command and the settings it received, so the launcher tests need no network and no Aseprite.
import { createInterface } from 'node:readline';
const cmd = process.argv[2];
const seen = Object.fromEntries(['ASEPRITE_AI_ALLOW_LUA', 'ASEPRITE_AI_PROMPTS', 'ASEPRITE_AI_HEADLESS', 'ASEPRITE_PATH', 'ASEPRITE_AI_CONTROL_PORT'].map((k) => [k, process.env[k] ?? null]));
if (cmd === 'serve') {
  const rl = createInterface({ input: process.stdin });
  rl.on('line', (line) => { const msg = JSON.parse(line); process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { cmd, args: process.argv.slice(3), seen } }) + '\n'); });
} else {
  process.stdout.write(JSON.stringify({ cmd, args: process.argv.slice(3), seen }) + '\n');
}
