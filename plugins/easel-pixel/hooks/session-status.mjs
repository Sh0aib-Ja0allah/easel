#!/usr/bin/env node
// Easel: adapted from with-pebbly/aseprite-ai-artist @ f51fe6908223ef9ac476de1568234c699594722d
// (hooks/session-status.mjs), MIT License, Copyright (c) 2026 with-pebbly; see NOTICE.md. Modified
// by Easel (2026-10-11): reads the message from shared.mjs, which also reports a missing install.
// Tells the session whether the Aseprite bridge is reachable, before the model tries to draw.
import { bridgeStatusMessage } from './shared.mjs';

process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: await bridgeStatusMessage() } }));
