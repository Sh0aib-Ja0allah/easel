// Easel: adapted from with-pebbly/aseprite-ai-artist @ f51fe6908223ef9ac476de1568234c699594722d
// (github.com/with-pebbly/aseprite-ai-artist, hooks/shared.mjs), MIT License,
// Copyright (c) 2026 with-pebbly; see NOTICE.md. Modified by Easel (2026-10-11): tool names are easel-pixel's, the
// setup advice points at the pixel skill's launcher (no npx), and the message says when the pinned
// package is not installed yet.
import net from 'node:net';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const PROBE_BUDGET_MS = 400;
export const PINNED = '0.8.0';

function probe(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port });
    const done = (open) => { socket.destroy(); resolve(open); };
    socket.setTimeout(PROBE_BUDGET_MS);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });
}

const real = (v) => typeof v === 'string' && v.trim() !== '' && !/^\$\{[^}]*\}$/.test(v.trim());

// Cheap and never rejects: a file check and one TCP connect with a 400 ms budget.
export async function bridgeStatusMessage(env = process.env) {
  const data = real(env.CLAUDE_PLUGIN_DATA) ? env.CLAUDE_PLUGIN_DATA : null;
  if (data && !existsSync(join(data, `aseprite-ai-artist-${PINNED}`, 'node_modules', '@pebbly', 'aseprite-ai-artist', 'package.json'))) {
    return 'easel-pixel: the Aseprite bridge is not set up yet. When the user asks for pixel art, follow the easel-pixel:pixel skill\'s setup step first.';
  }
  if (/^(1|true|yes)$/i.test(env.ASEPRITE_AI_HEADLESS ?? env.CLAUDE_PLUGIN_OPTION_HEADLESS ?? '')) {
    return 'easel-pixel: headless mode - a batch Aseprite starts on the first tool call and there is no window. Call preflight first, and save with sprite_manage before finishing.';
  }
  const controlPort = Number(env.ASEPRITE_AI_CONTROL_PORT || 9932);
  return (await probe(controlPort))
    ? `easel-pixel: the Aseprite bridge is up on :${controlPort}. Call preflight before any drawing to confirm Aseprite itself is attached.`
    : `easel-pixel: no Aseprite bridge on :${controlPort} yet - it starts on the first tool call. If drawing fails, run the doctor command in the easel-pixel:pixel skill.`;
}

export const LOOK_NUDGE = 'You just changed pixels. Call `mcp__plugin_easel-pixel_aseprite__look` before deciding whether it worked - op "preview" for the overall read, op "ascii" for exact pixel positions. A tool result saying pixels changed is not evidence that the sprite is right.';
