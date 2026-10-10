# Spike T0.3: can one plugin's skill call another plugin's MCP tool?

> Run: 2026-10-11 on the owner's Windows 11 machine, Claude Code 2.1.296, Node v22.21.0.
> Runner job `007-t03-spike` (easel-runner). Two headless runs, total cost $0.42.

## Answer

**Yes.** A skill in `easel-motion` called `mcp__plugin_easel-core_easel__ping`, a tool served by
the MCP server that `easel-core` declares, and got the real result back. MCP servers from enabled
plugins are session-wide. **Recommendation: keep the design in [architecture.md](../architecture.md)
§3** (core owns the engine as an MCP server; other plugins call it by full tool name). The CLI shim
fallback is not needed.

## Setup

- `plugins/easel-core/.mcp.json`: stdio server `easel`, `node ${CLAUDE_PLUGIN_ROOT}/engine/server.mjs`.
- `engine/server.mjs` + `engine/tools.mjs`: one tool, `ping`. The server has **no npm
  dependencies** (see decision D9 in [findings-and-decisions.md](../findings-and-decisions.md)).
- A temporary skill `easel-motion/skills/spike-ping/SKILL.md` (removed after the spike; text
  below) with `allowed-tools: mcp__plugin_easel-core_easel__ping`.
- A throwaway project at `%LOCALAPPDATA%\easel-scratch\xplugin\`:

```text
claude plugin marketplace add C:\Users\shoib\Desktop\Collection\Animation --scope project
claude plugin install easel-core@easel --scope project
claude plugin install easel-motion@easel --scope project
claude -p "/easel-motion:spike-ping" --output-format stream-json --verbose --allowedTools mcp__plugin_easel-core_easel__ping
claude -p "Call the tool mcp__plugin_easel-core_easel__ping ..." (same flags)   # control
claude plugin uninstall easel-motion@easel --scope project
claude plugin uninstall easel-core@easel --scope project
claude plugin marketplace remove easel
```

## Evidence (from the stream-json `init` and tool events)

| Item | Run 1 (motion skill) | Run 2 (direct prompt) |
|---|---|---|
| MCP server | `plugin:easel-core:easel`, status `connected`, source `plugin` | same |
| Tool in session | `mcp__plugin_easel-core_easel__ping` | same |
| Skill listed | `easel-motion:spike-ping` | same |
| Tool calls | `ToolSearch select:mcp__plugin_easel-core_easel__ping`, then the tool | same |
| Tool result | `{"pong":true,"echo":"from easel-motion","engine":"0.0.1","node":"v22.21.0","platform":"win32"}` | echo `"direct"` |
| Result | success, 3 turns, $0.216 | success, 3 turns, $0.200 |

## What we learned

1. **The tool name is exactly `mcp__plugin_<plugin>_<server>__<tool>`**, with the plugin name's `-`
   kept: `mcp__plugin_easel-core_easel__ping`.
2. **Plugin MCP tools are deferred.** The model loaded the tool through `ToolSearch` before calling
   it. Skills must therefore name the full tool name in their body, so the model can find and load
   it. `allowed-tools` in the skill frontmatter was accepted.
3. **The dependency works for install:** `easel-motion` declares `dependencies: ["easel-core"]`;
   both installed with project scope.
4. **Directory marketplaces are read in place.** `claude plugin list` showed
   `Read from: C:\Users\shoib\Desktop\Collection\Animation\plugins\easel-core`, so this spike did
   not exercise the cache copy that a GitHub install makes. That copy has no `node_modules`, which
   is why the server is dependency-free (D9). The GitHub-install path is re-tested in T5.5.
5. **No residue in user config.** SHA-256 of `~/.claude/settings.json`,
   `plugins/known_marketplaces.json` and `plugins/installed_plugins.json` were identical before and
   after; the project-scope entries lived only in the scratch project's `.claude/settings.json`.

## The test skill (removed from the plugin after the spike)

```markdown
---
name: spike-ping
description: Spike T0.3 test only. Calls the easel-core engine ping tool from the easel-motion plugin to prove cross-plugin MCP visibility.
allowed-tools: mcp__plugin_easel-core_easel__ping
---

Call the MCP tool `mcp__plugin_easel-core_easel__ping` with the argument `message` set to
`"from easel-motion"`. Then reply with the exact JSON the tool returned, prefixed by the line
`PING RESULT:`.

If no tool with that name is available, reply with the line `TOOL NOT AVAILABLE`, followed by
the names of every available tool whose name contains `easel`.
```
