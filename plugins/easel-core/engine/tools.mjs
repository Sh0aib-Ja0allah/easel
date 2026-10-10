// Engine tool registry, shared by the MCP server (server.mjs) and the CLI (cli.mjs).
// Each tool: { description, inputSchema, run(args) }.
import { doctor } from './lib/doctor.mjs';
import { ENGINE_VERSION } from './lib/version.mjs';

export const tools = {
  ping: {
    description: 'Health check for the Easel engine. Returns pong with the engine version, Node version and platform.',
    inputSchema: {
      type: 'object',
      properties: { message: { type: 'string', description: 'Optional text echoed back.' } },
      additionalProperties: false,
    },
    async run(args) {
      return { pong: true, echo: args.message ?? null, engine: ENGINE_VERSION, node: process.version, platform: process.platform };
    },
  },
  doctor: {
    description:
      'Check what the Easel engine needs: Node, Playwright and Chromium (in the plugin data folder), ffmpeg and ffprobe, plus optional Python, Aseprite and provider API keys (names only). ' +
      'With install: true it installs the pinned npm packages and the Chromium headless shell (about 110 MB) into the plugin data folder; tell the user before doing that.',
    inputSchema: {
      type: 'object',
      properties: { install: { type: 'boolean', description: 'Install missing npm packages and Chromium into the plugin data folder.' } },
      additionalProperties: false,
    },
    run: (args) => doctor(args),
  },
};
