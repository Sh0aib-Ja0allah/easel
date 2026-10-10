// Tool registry for the Easel engine. Each tool: { description, inputSchema, run(args) }.
export const tools = {
  ping: {
    description: 'Health check for the Easel engine. Returns "pong" with the engine version, Node version and platform.',
    inputSchema: {
      type: 'object',
      properties: { message: { type: 'string', description: 'Optional text echoed back.' } },
      additionalProperties: false,
    },
    async run(args) {
      return { pong: true, echo: args.message ?? null, engine: '0.0.1', node: process.version, platform: process.platform };
    },
  },
};
