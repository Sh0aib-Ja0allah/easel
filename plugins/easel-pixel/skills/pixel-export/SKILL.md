---
name: pixel-export
description: >-
  Get finished pixel art out of Aseprite as the files that are actually used: a spritesheet PNG
  with a JSON atlas split by tag, an animated GIF, integer-scaled PNGs, numbered frames, slices
  for nine-patch panels and pivots, and tilesets (seamless tiles, packing a painted mockup,
  Tiled, Godot and JSON exports, blob47 autotiles). Everything goes to ./easel-out/<slug>/.
when_to_use: >-
  The user asks (load this skill before touching Aseprite) for a spritesheet, an atlas, a GIF, a PNG at 4x or 8x, frames for an engine, a
  tileset or tilemap, nine-slice UI panels, or "export this". Routing - to draw or fix the art
  first use easel-pixel:pixel-draw; to animate use easel-pixel:pixel-animate; for the whole job
  including brief and critique use easel-pixel:pixel.
argument-hint: "[spritesheet | gif | png | tileset] [engine or where it will be used]"
allowed-tools: mcp__plugin_easel-pixel_aseprite__preflight mcp__plugin_easel-pixel_aseprite__sprite_info mcp__plugin_easel-pixel_aseprite__sprite_manage mcp__plugin_easel-pixel_aseprite__validate mcp__plugin_easel-pixel_aseprite__export mcp__plugin_easel-pixel_aseprite__tileset mcp__plugin_easel-pixel_aseprite__layer mcp__plugin_easel-pixel_aseprite__draw mcp__plugin_easel-pixel_aseprite__look Read Write Glob ReadMcpResourceTool ListMcpResourcesTool
---

<!-- Easel: adapted from with-pebbly/aseprite-ai-artist @ f51fe6908223ef9ac476de1568234c699594722d
     (github.com/with-pebbly/aseprite-ai-artist, skills/export/SKILL.md, skills/tileset/SKILL.md), MIT License,
     Copyright (c) 2026 with-pebbly; see NOTICE.md. Modified by Easel (2026-10-11): export and tileset merged;
     Easel tool names; every file written under ./easel-out/<slug>/ with absolute paths for Aseprite; a
     review gate through easel-pixel:pixel; extension updates through the plugin's setup command. -->

# Export pixel art

`mcp__plugin_easel-pixel_aseprite__preflight` first; stop if not ready (setup is in
`easel-pixel:pixel`). Then `sprite_info`.

**Where files go.** Every file goes to `./easel-out/<slug>/`, using the job's slug (or a short one
from the sprite name). Aseprite writes from its own process, so pass absolute paths: the current
project folder joined with `easel-out/<slug>/<file>`. If the folder does not exist yet, create it
by writing the job notes (`./easel-out/<slug>/brief.md` or `export.md`) with Write first. Only
write elsewhere when the user names a folder in their game project.

## Ask what consumes it

The target decides the format; guessing produces files someone re-exports. If unknown, ask once.

| Target | Wants |
|---|---|
| Most game engines, web or canvas | spritesheet PNG + JSON atlas, split by tag |
| Godot | spritesheet PNG + JSON, or the `.aseprite` file through an importer |
| A level editor that reads `.aseprite` directly | just save the document |
| A human, a chat, a README | GIF for motion; PNG at 4-8x for stills |
| Print or a store page | PNG at 4-8x |

## Before exporting

The art should have been through the critique in `easel-pixel:pixel`; exporting broken art only
distributes it. Then check:

- **Tags exist and are named as the engine expects** (`idle`, `walk`, `attack`). `validate`
  errors on untagged multi-frame sprites.
- **Reference and sketch layers are hidden or deleted** (`layer op="set" name="reference"
  visible=false`), or pass `layers=[...]` to export only the art layers.
- **Frame durations are set.** GIFs and most engines read them from the file.

## Spritesheet with atlas

```
export op="spritesheet" path="<project>/easel-out/<slug>/<slug>.png" sheetType="packed" byTag=true padding=1
```

The JSON atlas is written beside the PNG (`includeJson` defaults on) with per-frame rectangles
and per-tag ranges. `padding=1` stops texture bleed at non-integer zoom (a thin line of the
neighbouring frame along an edge); keep 1 unless the engine says otherwise. `sheetType` is
`horizontal`, `vertical`, `rows`, `columns` or `packed`; `trim=true` drops transparent margins and
the atlas keeps the offsets; `tags=["walk"]` exports only those frames.

**Nine-patch panels and hotspots:** before exporting, `sprite_manage op="slice_create"
name="panel" bounds={x,y,width,height} center={...}` (the stretchable middle, relative to
bounds) or `pivot={x,y}`. A spritesheet export carries slices into its atlas.

## GIF, PNG and frames

- Animation for a human: `export op="gif" path=".../<slug>-walk.gif" tags=["walk"] scale=4`.
  The first GIF of a session can take tens of seconds while Aseprite warms up; wait for it.
- Still: `export op="png" path=".../<slug>@8x.png" scale=8 frame=1`. A single-frame export uses
  the active frame unless you pass `frame`; name it.
- Numbered frames: `export op="frames" path=".../frames/<slug>_{frame}.png" scale=1`, numbered
  from 0 (`<slug>_0.png` is frame 1; the tools count frames from 1).

Integer scale only, nearest-neighbour. Any other resize destroys what you made. Check a scaled
export by opening it with Read.

## Tilesets

Requires the extension's `tileset` feature: check `features` in preflight. If it is missing, the
extension is older than the server: run the setup command from `easel-pixel:pixel` again and
restart Aseprite.

**Decide the tile size first.** It belongs to the game, not the art; ask if unknown (16x16 and
32x32 are common).

**Seamless tiles.** A tile is seamless when its right edge continues into its own left edge and
its bottom into its top.

1. Draw the interior first, ignoring edges (`easel-pixel:pixel-draw`).
2. Draw the edge pattern on one side.
3. `look op="ascii"` the first and last columns and make them continue into each other: exact
   work, done in the text grid, not by eye. Same for the top and bottom rows.
4. Stamp the tile in a 3x3 block (`draw` kind `blit`) on a scratch layer and `look op="preview"`:
   seams that hide in isolation show at once when tiled. Delete the scratch layer after.

Keep repeating tiles low-contrast; a distinctive rock in a grass tile becomes a visible grid.
Put distinctive details in occasional variant tiles.

**From a painted mockup** (better tilesets than authoring tiles alone, because you see the whole
picture): paint the level on a normal layer whose canvas is a whole number of tiles each way,
then

```
tileset op="pack" layer="mockup" name="terrain" tileWidth=16 tileHeight=16
```

You get a tileset plus a tilemap layer that rebuilds the mockup exactly; the mockup is hidden, not
deleted. Compare `cellCount` with `tileCount`: 400 cells giving 300 tiles means it was painted
without the grid, and the fix is to repaint on the grid, not accept it. `tolerance` (0-255 per
channel) merges near-identical cells, but then the map approximates the mockup; the result says
how many cells it touched. `tileset op="stamp" tiles=[{x,y,tile}]` places tiles by grid cell.

**Export:**

```
tileset op="export" layer="terrain" format="tiled" path="<project>/easel-out/<slug>/terrain.tsj"
```

- `tiled` writes the packed PNG, the `.tsj` tileset and a `.tmj` map that uses it.
- `godot` writes a Godot 4 `TileSet` resource (`.tres`).
- `json` writes the tile grid and tilemap layout for a custom engine, with its index convention.

Aseprite reserves tile 0 for the empty tile; the exporter drops it so engine indices line up and
0 means "no tile".

**Autotiling:** `layout="blob47"` adds a Tiled wangset for 4-connected autotiling. It assumes the
47 tiles are in canonical blob47 order (the 47 distinct neighbour masks ascending, after the empty
tile) and refuses an incomplete set. Build the terrain body first, then edges and corners. Unsure
of the order: export `format="json"` first, which reports the index-to-mask mapping, and check a
few tiles by eye.

## Save the source and report

Exporting does not save the working document: `sprite_manage op="save"` (or `save_as` to
`<project>/easel-out/<slug>/<slug>.aseprite`). The `.aseprite` file is the asset; the PNGs are
build output.

Report every file written (full path under `./easel-out/<slug>/`), its dimensions, the frame
count and the tags: that is what the person wiring it into an engine needs.
