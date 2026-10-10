# with-pebbly/aseprite-ai-artist

- **Link:** https://github.com/with-pebbly/aseprite-ai-artist
- **License:** MIT (© 2026 with-pebbly). The bundled Lospec palettes credit each author and include a takedown list, and the `pixel5x7` font is CC0.
- **Status (2026-10-10):** v0.8.0, about 240 stars, last push 2026-10-08. It has CI and a release workflow.
- **Type:** a Claude Code plugin (`aseprite`) with its own marketplace, plus an MCP server published to npm as `@pebbly/aseprite-ai-artist`.

## What it does

The agent paints pixel art in the user's open Aseprite window, and each action can be undone with Ctrl+Z. If Aseprite isn't connected, it refuses to work instead of editing the files on disk.

The `/aseprite:studio` skill runs the full job:

1. Connect to Aseprite.
2. Write a brief.
3. Optionally prompt for a concept sheet.
4. Draw the silhouette as a text grid.
5. Shade.
6. Rig.
7. Animate.
8. Run a blind critic review.
9. Export as a spritesheet, GIF or PNG.

After every change it calls `look` to see the result.

## Structure

### Skills (14)

`studio` is the entry point and routes to the others: `brief`, `concept`, `new`, `palette`, `draw`, `shade`, `rig`, `animate`, `tileset`, `review`, `fix`, `export`, and `submit` (opens a gallery PR with gh).

### Agents

| Agent | Model | Role |
|-------|-------|------|
| `animation-director` | sonnet | Key poses and timing |
| `palette-smith` | sonnet | Palettes |
| `rig-builder` | sonnet | Splits a character into layers |
| `pixel-critic` | opus | Read-only critic; blind A/B comparison |

### Commands

None. The skills act as the commands.

### Hooks

- **SessionStart:** checks whether the Aseprite bridge is running.
- **PostToolUse** (draw, recolor, transform): reminds the agent once per session to call `look`.

### MCP server

- **Name:** `aseprite`
- **Launch:** `node ${CLAUDE_PLUGIN_ROOT}/bin/aseprite-ai-artist.mjs serve`, which runs `npm install` and a build the first time.
- **Tools (18):** each is a noun with an `op` field. preflight, sprite_info, sprite_manage, look, read_pixels, draw, select, transform, recolor, layer, frame, tag, cel, palette, validate, reference, export, tileset.
- `run_lua` is off by default.

## Dependencies

- **Aseprite 1.3+.** A paid app. The plugin needs its Lua WebSocket API.
- **Node 22.6+.**
- **Lua extension:** install it with `npx @pebbly/aseprite-ai-artist install-extension`, then restart Aseprite. `doctor` checks the setup.
- **Bridge:** the extension connects to a local bridge on `127.0.0.1:9931`, and the MCP server connects to the bridge on `:9932`.
- **Windows:** first-class support. The launcher is written in Node for that reason.
- **Telemetry:** none. The only network access is the first-run `npm install`.

## Keep

- **Small tool surface:** a few noun tools, each with an `op` field.
- **Draw → look loop:** checking the result after every change.
- **Text-grid drawing:** describing the silhouette as text before drawing it.
- **Safety:** refusing instead of editing files on disk.
- **Separate blind critic:** review is done by its own agent.
- **Craft knowledge base:** 62 rules.
- **Docs:** ADR-style decision records.
- **Filmstrip view:** vision models only see the first frame of a GIF, so it shows frames side by side.

## Gaps and risks

- **Scope:** pixel art only, and it needs a paid app.
- **Setup:** the Lua extension must be installed by hand.
- **Quality:** its own benchmark scores are low (2–4 out of 10), and the critic's effect hasn't been measured.
- **Security:**
  - The bridge has no authentication, so any local process can drive Aseprite, including Lua execution.
  - File paths aren't sandboxed.
  - `install` edits `~/.claude.json` and other agents' configs (it takes a backup and writes atomically).
- **Trademark:** "Aseprite" belongs to Igara Studio. We must say we aren't affiliated.

## Proposed use

**Depend on it; don't vendor it.**

- Reference the published npm MCP package, pinned to a version, for example `npx -y @pebbly/aseprite-ai-artist@0.8.0 serve`.
- Adapt the skill text and the 4 agents to our naming.
- Rewrite the hook matchers for our plugin's tool names.
- Make this an **optional add-on**, because it needs Aseprite, a paid app.
- Use its palette and pixel rules as the single source of truth for 8-bit and pixel style across the plugin.
