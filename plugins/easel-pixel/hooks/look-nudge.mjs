#!/usr/bin/env node
// Easel: adapted from with-pebbly/aseprite-ai-artist @ f51fe6908223ef9ac476de1568234c699594722d
// (hooks/look-nudge.mjs), MIT License, Copyright (c) 2026 with-pebbly; see NOTICE.md. Modified by
// Easel (2026-10-11): session ids are sanitised before they name a file; markers live only in the
// plugin data folder (no temp-dir fallback); markers older than a week are removed.
// After a pixel-changing call, remind the model once per session to look at the result.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LOOK_NUDGE } from './shared.mjs';

let payload = {};
try { payload = JSON.parse(readFileSync(0, 'utf8')); } catch { process.exit(0); }
const sessionId = String(payload.session_id || 'unknown').replace(/[^\w-]/g, '_').slice(0, 120);
const data = process.env.CLAUDE_PLUGIN_DATA;
if (data && !/^\$\{/.test(data)) {
  const dir = join(data, 'look-nudge'), marker = join(dir, `${sessionId}.seen`);
  if (existsSync(marker)) process.exit(0);
  try { mkdirSync(dir, { recursive: true }); writeFileSync(marker, String(Date.now())); } catch { /* still nudge once */ }
  // one marker per session would pile up: a new session clears those older than a week (a session
  // resumed after that gets one more nudge at most)
  try {
    for (const f of readdirSync(dir).filter((n) => n.endsWith('.seen'))) {
      try { if (Date.now() - statSync(join(dir, f)).mtimeMs > 7 * 24 * 3600e3) rmSync(join(dir, f), { force: true }); } catch { /* gone or busy */ }
    }
  } catch { /* nothing to clear */ }
}
process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: LOOK_NUDGE } }));
