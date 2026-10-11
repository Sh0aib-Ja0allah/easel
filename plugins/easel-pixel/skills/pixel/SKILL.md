---
name: pixel
description: >-
  Entry point for pixel art with Easel: sprites, characters, props, tiles and animated cycles
  drawn in the user's own Aseprite through the `aseprite` MCP server. Connects and checks
  Aseprite, settles the brief in one message, then runs draw, animate, an independent critique
  with the core critic and the pixel rubric, and export, looking at the canvas after every step
  that changed pixels. Works live in the user's window or headless with no window.
when_to_use: >-
  The user says "pixel art", "sprite", "Aseprite", "8-bit look", "tileset" or "spritesheet", or a
  pixel job spans several steps ("an animated knight for my game"). Routing - for one drawing,
  shading or palette job use easel-pixel:pixel-draw; for rigging and cycles on an existing sprite
  use easel-pixel:pixel-animate; for files out of a finished sprite use easel-pixel:pixel-export.
  A sprite or animated character for a game, drawn in Aseprite, is this skill; an SVG sprite
  sheet (icons as SVG symbols for a web page) or vector icons use easel-illustrate:svg; a video in
  a pixel-art style (an MP4 to watch, not game art) uses easel-motion:animate.
argument-hint: "[what to make] [size, palette or engine if known] [--headless | --live]"
allowed-tools: mcp__plugin_easel-pixel_aseprite__preflight mcp__plugin_easel-pixel_aseprite__sprite_info mcp__plugin_easel-pixel_aseprite__sprite_manage mcp__plugin_easel-pixel_aseprite__look mcp__plugin_easel-pixel_aseprite__validate mcp__plugin_easel-pixel_aseprite__export mcp__plugin_easel-pixel_aseprite__reference mcp__plugin_easel-core_easel__contact_sheet Agent Bash(node:*) Read Write Glob ReadMcpResourceTool ListMcpResourcesTool
---

<!-- Easel: adapted from with-pebbly/aseprite-ai-artist @ f51fe6908223ef9ac476de1568234c699594722d
     (github.com/with-pebbly/aseprite-ai-artist, skills/studio/SKILL.md), MIT License, Copyright (c) 2026 with-pebbly;
     see NOTICE.md. Modified by Easel (2026-10-11): Easel frontmatter, routing and tool names; setup through the
     plugin's launch.mjs; brief through one message or easel-core:brief; the concept/image-model step dropped;
     critique through easel-core:critic with the pixel rubric on exported views; output to ./easel-out/<slug>/;
     the note on what the local bridge exposes. -->

# Pixel art in Aseprite

This skill owns a pixel job from the first question to the last file. It decides which of the
three working skills the request needs, runs them in the order that keeps mistakes cheap, and
does not call anything finished until it has been looked at and critiqued. At each stage, load
the skill it names and follow it; do not do the stage from memory.

Never recreate a copyrighted or trademarked character (a famous game mascot or plumber, a film
or cartoon hero): offer an original character with the qualities the user wants instead. The alternative shares the mood or genre, never the character's signature features: no matching
outfit, headwear, facial hair, colour scheme, job or name pun, so it cannot read as the original.

## 1. Connect

Aseprite 1.3 or later is the user's own app, bought and installed by them. The first time you
set up, tell the user these three things once:

- easel-pixel is a Preview: it has not yet been tested end to end with a real Aseprite, so report
  plainly anything that does not work the way the tools describe.
- Easel is not affiliated with, endorsed by or sponsored by Aseprite or Igara Studio.
- While the bridge runs and Aseprite is open, any program on this computer can send Aseprite
  commands through it, Lua scripts included: the bridge has no password, and Easel only keeps the
  Lua tool away from Claude. Close Aseprite when not drawing (the plugin README has the details).

1. Call `mcp__plugin_easel-pixel_aseprite__preflight`. If `ready` is true, go to step 2.
2. If the `aseprite` tools are missing or preflight is not ready on first use, the bridge needs
   its one-time setup. Tell the user what it installs (the pinned `@pebbly/aseprite-ai-artist`
   0.8.0 and its locked dependencies into the plugin data folder, then its extension into
   Aseprite) and run it when they agree, with the Bash tool:
   `node "${CLAUDE_PLUGIN_ROOT}/server/launch.mjs" setup --data "${CLAUDE_PLUGIN_DATA}"`.
   Then the user quits and reopens Aseprite, and runs `/mcp` to reconnect the `aseprite` server
   if its tools are still missing. Call preflight again.
3. Still not ready: run `node "${CLAUDE_PLUGIN_ROOT}/server/launch.mjs" doctor --data "${CLAUDE_PLUGIN_DATA}"`
   (it diagnoses and installs nothing) and tell the user exactly what it reports. Stop there.

Nothing below works without Aseprite. Never write sprite files by another route when it is not
connected; that is not a recovery, it is a file the user never sees.

**Live or headless.** Live is the user's open window: they watch and can undo. Headless is a
batch Aseprite with no window: the only results are `look` previews and saved files. Headless
is a plugin setting (`/plugin configure easel-pixel`: `headless`, `aseprite_path`). For this
session only, `preflight mode="headless"` or `mode="live"` switches, and only when the request
says so (`--headless`, "in the background", files for a build step; `--live`, "in my window",
"so I can watch", "fix this sprite"). Strip the flag before reading the rest of the request.
Choose the mode from the request, never from a failure: if live is not attached, ask "Aseprite
isn't open - open it, or should I work headless and save the files to ./easel-out/<slug>/?" and
switch only on the answer. Headless refuses to touch a file the window has open; accept that.

## 2. Read the room and brief

`mcp__plugin_easel-pixel_aseprite__sprite_info` on whatever is open. An open sprite answers
questions you would otherwise ask ("make it bigger" means that sprite).

- **Specific request** ("add a 1px outline", "export this as a GIF"): no questions, do it.
- **Open-ended request** ("a knight"): ask once, in one message, every question with a default:
  subject and mood; canvas size (default 32x32 for a character, 16x16 for a tile or item); view
  (side, top-down, 3/4); palette (default a compact 16-colour palette); animation cycles and
  where it will run (engine, or a GIF to share). "Just go" means take the defaults and list them.
- **A job with many outputs** (a character set, tiles and animations, a whole level): run
  `easel-core:brief` first, then come back here per asset.

Pick a short slug and write the answers to `./easel-out/<slug>/brief.md` (this also creates the
job folder). Aseprite writes files from its own process, so every path you hand an `aseprite`
tool is absolute: the current project folder joined with `easel-out/<slug>/...`.

If the user supplied reference art, import it as a guide:
`mcp__plugin_easel-pixel_aseprite__reference op="import" path=<file>` (a storyboard sheet:
`grid={columns, rows}` puts panel i on frame i). A reference is for shapes and poses; never
downscale it onto the canvas and call it art.

## 3. Plan the chain

Write the chain down before starting; report progress against it.

| The user wants | Chain |
|---|---|
| Something new (character, prop, scene) | brief -> pixel-draw -> critique -> pixel-export if files are wanted |
| An animated character | brief -> pixel-draw (with a rig) -> pixel-animate -> critique -> pixel-export |
| A cycle for a sprite that exists | pixel-animate -> critique -> pixel-export |
| Tiles, terrain, level art | brief -> pixel-draw (tiles) -> pixel-export (tileset section) -> critique |
| Colours, a limited-palette look, cleanup | pixel-draw (palette section) -> critique |
| "It looks flat" | pixel-draw (shading section) -> critique |
| "Is this good?" | critique only; report, do not edit unless asked |
| Files for an engine or for sharing | critique if not done -> pixel-export |

A request that fits no row is usually one tool call (rename a layer, add a frame): make it,
`look` if pixels changed, and say what you did.

## 4. Draw, then animate

Load `easel-pixel:pixel-draw`, then `easel-pixel:pixel-animate` if anything moves. After every
stage that changed pixels, `mcp__plugin_easel-pixel_aseprite__look`: `preview` for the read,
`ascii` when exact positions matter, `filmstrip` for motion, `compare` against a reference. A
stage is done when you have seen its result, not when a tool reported success.

## 5. Critique (someone who did not draw it)

Never grade your own work in place of the critic: you know what you meant, so you see it.

1. Export views to `./easel-out/<slug>/review/` with `mcp__plugin_easel-pixel_aseprite__export`.
   The pixel rubric reads the sprite at its real size and at a zoom, so for each key frame `n`
   export `op="png" frame=n scale=1 path=".../review/frame<n>@1x.png"` and the same with
   `scale=8` and `@8x`. For an animation also `op="frames" scale=8 path=".../review/f_{frame}.png"`:
   the tools count frames from 1, but `{frame}` in a file name counts from 0, so `f_0.png` is
   frame 1. Put the views side by side with `mcp__plugin_easel-core_easel__contact_sheet`
   (`items` = the PNGs, each labelled with its frame as the tools count it and its scale, such as
   "frame 1, 8x").
2. Run `mcp__plugin_easel-pixel_aseprite__validate` and keep its findings.
3. Start the critic with the **Agent** tool, `subagent_type: "easel-core:critic"`. In its prompt:
   the paths of every view, the validate findings, domain `pixel`, and the brief as a separate
   section at the end. Nothing about how it was made.

**Ship rule.** A draft ships as it is when the critique has no blocking finding and scores 7/10
or more: note the other findings and stop. Otherwise fix, at most three rounds. Each round fixes
the blocking findings, or when there are none the single highest-value fix the critic named,
never a general polish:

- **Snapshot first.** `export op="png"` (or `op="gif"`) the current state and `op="aseprite"`
  a copy to `./easel-out/<slug>/review/`, so a bad round can be restored.
- **Fix, don't redraw.** Change the pixels the finding points at (read the region with
  `look op="ascii" rulers=false`, edit the rows, write them back as a `grid`). If a round touched
  more than about a quarter of a layer's opaque pixels, it was a redraw: restore and make the
  smaller fix. Never touch pixels the brief says must stay.
- **Decide by blind comparison, not by score.** Scores from separate critic calls are not on one
  scale. Export the new version beside the snapshot as `a.png` and `b.png` in coin-flipped order
  and ask one critic call which is better for the brief and whether the blocking finding is gone.
  Keep the fix only if it picks the new one. Two rejected rounds in a row end the loop.

Do not change pixels after the last critique. A cold read that did not name your subject is the
most important finding you can get: the picture does not say what you think it says.

## 6. Export and report

Load `easel-pixel:pixel-export`. Then report in a few lines: what exists (document, layers, tags,
files written under `./easel-out/<slug>/`), the mode used, the defaults you chose, what you
compromised on and why, and the critic's score and remaining findings. Show it: a `look`
preview or a file path, not an adjective.

## Rulebook

The `aseprite` server serves a pixel-art rulebook as MCP resources: read `rules://index` once per
session, then the two or three files for the subject (ReadMcpResourceTool, server
`plugin:easel-pixel:aseprite`; ListMcpResourcesTool shows the exact server name and every rule).
Subject files carry size budgets, common mistakes and `grid` templates to transcribe with `draw`.
Characters: `30-proportions-by-size`, `31-anatomy-and-pose`, `36-character-design`. Animation:
`40-timing-and-spacing` plus the cycle file. Environments: `60`-`67`. Review: `07-review-checklist`,
`92-generated-art-tells`.

## Specialists

Easel ships three agents; give each the brief, the document name and the stage it owns (it
starts with no memory of this chat). Run them one at a time: they share the open document.

| Agent | Takes over |
|---|---|
| `easel-pixel:palette-smith` | proposing, building and repairing a palette |
| `easel-pixel:rig-builder` | planning and building the layer rig, splitting baked art |
| `easel-pixel:animation-director` | key poses, timing and tags before frames are drawn |

## Must not

- Skip the brief on an open-ended request to seem fast: a guessed size or palette costs a redraw.
- Ask about what a default covers (light from the upper left is not worth a round trip), or ask
  more than once per stage.
- Declare done without `look`, `validate` and the critic.
- Leave the user's document in a state they did not ask for: stray scratch layers, a changed
  active frame, colours added to the palette without saying so.
- Name a living artist, studio or commercial game as a style: describe the look instead.
