---
name: pixel-draw
description: >-
  Draw, shade and colour a pixel-art sprite in Aseprite through the `aseprite` MCP server: set up
  the canvas, palette and layers, block in the silhouette as a text grid, separate materials,
  shade with hue-shifted ramps, outline, and verify pixel by pixel, calling `look` after every
  change. Also builds hue-shifted palettes and repairs a palette whose colours have sprawled.
when_to_use: >-
  The user wants one sprite, prop, portrait, tile or icon drawn, a sprite shaded ("it looks
  flat"), a palette chosen or cleaned up, or words drawn on pixel art. Routing - for a whole job
  with brief, critique and export use easel-pixel:pixel; to rig and animate use
  easel-pixel:pixel-animate; for spritesheets, GIFs and tilesets use easel-pixel:pixel-export;
  for vector art use easel-illustrate:svg-illustration.
argument-hint: "[what to draw] [canvas size] [palette]"
allowed-tools: mcp__plugin_easel-pixel_aseprite__preflight mcp__plugin_easel-pixel_aseprite__sprite_info mcp__plugin_easel-pixel_aseprite__sprite_manage mcp__plugin_easel-pixel_aseprite__palette mcp__plugin_easel-pixel_aseprite__layer mcp__plugin_easel-pixel_aseprite__draw mcp__plugin_easel-pixel_aseprite__look mcp__plugin_easel-pixel_aseprite__read_pixels mcp__plugin_easel-pixel_aseprite__select mcp__plugin_easel-pixel_aseprite__transform mcp__plugin_easel-pixel_aseprite__recolor mcp__plugin_easel-pixel_aseprite__validate mcp__plugin_easel-pixel_aseprite__reference Read Write Glob ReadMcpResourceTool ListMcpResourcesTool
---

<!-- Easel: adapted from with-pebbly/aseprite-ai-artist @ f51fe6908223ef9ac476de1568234c699594722d
     (github.com/with-pebbly/aseprite-ai-artist, skills/draw/SKILL.md, skills/shade/SKILL.md, skills/new/SKILL.md,
     skills/palette/SKILL.md), MIT License, Copyright (c) 2026 with-pebbly; see NOTICE.md. Modified by Easel
     (2026-10-11): four skills merged into one procedure; Easel tool names; palettes described by their colours
     instead of named presets; the rulebook read as MCP resources; files saved under ./easel-out/<slug>/. -->

# Draw a pixel sprite

Order matters more than technique. Detail added before the form is right only makes the wrong
form harder to see and dearer to fix. Draw, then `look`, then fix: call
`mcp__plugin_easel-pixel_aseprite__look` after **every** call that changed pixels.

Never recreate a copyrighted or trademarked character; offer an original one with the qualities
the user asked for. The alternative shares the mood or genre, never the character's signature features: no matching
outfit, headwear, facial hair, colour scheme, job or name pun, so it cannot read as the original.

## 0. Connect and read

`mcp__plugin_easel-pixel_aseprite__preflight`; stop if not ready (setup lives in
`easel-pixel:pixel`). Then `sprite_info` for the real layer names, frame count and palette. A
wrong layer name means drawing into the user's finished art.

Read the rulebook for the subject: `rules://index` once, then two or three subject files
(ReadMcpResourceTool, server `plugin:easel-pixel:aseprite`). A hand, a face, an animal, an
isometric crate or water each has its own file with size budgets and `grid` templates. A
template is a starting point you transcribe with `draw` kind `grid`, mapping its legend onto
your palette; adapt it to the pose instead of inventing the shape from nothing.

## 1. Set up a new document (skip when editing)

Setup mistakes are the dearest: a wrong canvas means redrawing, a palette chosen after the art
means repainting.

1. `sprite_manage op="new" width=32 height=32 colorMode="rgb"`. RGB unless the user wants the
   palette enforced by the file (indexed). Fit the game's grid (16x16 tiles want characters a
   multiple of 16 in one dimension) and leave headroom: a 28px character on 32x32 has room for
   a raised weapon or a squash.
2. Set the palette before drawing (see *Palette* below).
3. Layers in one batch (one undo step):
   `layer batch=[{op:"create",name:"sketch"},{op:"create",name:"base"},{op:"create",name:"shading"},{op:"create",name:"outline"}]`.
   Anything that will be animated gets the full rig instead (`easel-pixel:pixel-animate`, or the
   `easel-pixel:rig-builder` agent): splitting baked pixels later is real work.
4. Save at once so undo has an anchor and the user has a file:
   `sprite_manage op="save_as" path="<project>/easel-out/<slug>/<slug>.aseprite"`. Aseprite writes
   from its own process, so the path is absolute.

## 2. Block in the silhouette as a text grid

One flat colour, no detail, on `base`, in one `draw` call. Up to about 32x32, write it as a
`grid`: one character per pixel, so you see the whole silhouette while writing it.

```
draw layer="base" label="block in slime" ops=[
  { kind:"grid", x:8, y:10, legend:{ "O":"#5f574f" }, rows:[
    "....OOOO....",
    "..OOOOOOOO..",
    ".OOOOOOOOOO.",
    "OOOOOOOOOOOO",
    ".OOOOOOOOOO." ] } ]
```

Every row the same width; `.` is transparent and erases what is under it (`transparent:"skip"`
stamps over existing art). Bigger sprites: one grid per body part, each at its own x/y; long
runs of one character are where counts go wrong, and a ragged row is refused with its number.
Shapes (`rect`, `ellipse`, `gradient` with banded `steps`) suit big regular forms: a floor, a sky.

**Look now:** `look op="preview"`. Is it recognisable as one flat shape? If not, fix it before
anything else. Watch for symmetry that reads as a statue, an arm fused into the torso, limbs all
the same thickness. With a reference layer (`reference op="list"`), use `look op="compare"`
instead, name the three to five largest mismatches, fix only those in one call, compare again;
repeat after materials and after shading.

## 3. Separate materials

Replace regions of the blockout with each material's flat base colour (skin, metal, leather,
cloth). One `draw` call, then `look`.

## 4. Shade

Shading that is the same hue, darker, is the clearest sign of a brightness slider. Shadows rotate
toward blue/purple and lose a little saturation; highlights rotate toward yellow/orange and gain
a little. `recolor op="shade"` does this; use it instead of picking darker hex values.

1. State the light direction (upper left by default). It never moves, across the sprite or frames.
2. One shadow step on the side away from the light: `select op="rect" rect={...}` then
   `recolor op="shade" amount=-0.2 selectionOnly=true` (one ramp step is about 0.15), or `draw`
   the shadow shape when it follows a form a selection cannot describe. `look`: a shadow that
   follows the form's cross-section reads as volume; one that hugs the outline reads as a stain.
3. One light step on the lit side: `amount=0.2`. `look`. Most sprites are finished here.
4. Only if needed: a deep shadow (`-0.4`) in occluded crevices, a one- or two-pixel specular on
   the hardest material, a faint cool reflected light on the shadow side's outer edge (sells metal).

Dither only at 32px and up, only in large flat areas: `draw` kind `dither`, `pattern:"bayer4"`,
two colours adjacent in a ramp. Stop if it reads as noise.

## 5. Outline

Pick one style and keep it. Selective outlining, outside only, is usually right.
`transform op="outline" color=... side="outside"` grows the shape by a pixel; `side="inside"`
recolours its edge and keeps the size; `diagonals=true` fills the corners (squarer), off leaves
them cut (softer). Hand-place breaks where light hits. `look`.

## 6. Text, if the art has words

`draw` kind `text` lays a string out from a bitmap font (default `pixel5x7`). First send only
text ops with `measureOnly: true` to get the ink bounds without touching the sprite, then centre
the label or size its panel and draw it. `look`.

## 7. Verify and validate

`look op="ascii"` catches the pixel one row too low and the line run of 3 among 2s. To fix:
`look op="ascii" layer="base" rulers=false region={...}` returns bare rows and an `origin`; edit
the wrong cells and send the rows back as `draw` kind `grid` at that origin with the legend
`look` gave. Only that region is touched. `read_pixels` returns the same region as data when you
need to compute over it.

Then `validate`. Fix every error; report warnings you chose to keep, with the reason. Save
(`sprite_manage op="save"`).

## Palette

Choose in this order:

1. **The user named a palette or gave a file or screenshot.** `palette op="load" path=...` for a
   `.gpl/.hex/.pal/.png`, or `reference op="sample_palette" path=...` to pull colours from an image.
2. **The user described a look.** "Retro 8-bit": a 16-colour fantasy-console palette. "Old
   handheld": a 4-tone green palette. "Console era": 12-16 colours built as 3-4 hues x 4 values.
   The tool bundles about 2000 palettes: `palette op="preset" preset="<a word>"` with an unknown
   word returns matching keys with their sizes. List them, pick one by its colours and size, load
   it with `replace=true`, and tell the user which one and why.
3. **Joining an existing project.** `sprite_info` an existing asset and match it exactly.
   Consistency beats a nicer palette.
4. **Nothing said.** A compact 16-colour palette, or build it from ramps (below).

**Ramps:** `palette op="ramp" base="#c04030" steps=5 spread=0.55` appends a hue-shifted ramp
(cooler shadows, warmer lights). Three to five steps per material; share the darkest step
across materials, it ties the sprite together and costs no slot.

**Repair a sprawled palette** (validate reports off-palette colours, or ninety near-identical
browns): `palette op="analyze"` (off-palette colours, near-duplicates under dE 3, unused slots,
lowest-contrast pair) -> decide the target palette -> `recolor op="snap" layer=...` (CIELAB
nearest; it reports which colour became which) -> `analyze` again and `look`. The risk is merging
two colours that did different jobs: look for a form gone flat. Art imported at full colour with
no palette: `palette op="extract" maxColors=16` (RGB only), then curate it into ramps.

**Contrast:** value carries readability, not hue. Check with `recolor op="desaturate"` on a
copy (duplicate the layer first, delete it after); if shapes stop reading in grey, the values are
too close.

## Batching rules

- Ops run in array order: fills before outlines, outlines before highlights.
- Keep `paletteLock` on. If a result says a colour moved with dE over 12, the palette lacks it:
  say so, or extend the palette deliberately, rather than turning the lock off.
- Give every call a `label`; it is the user's undo entry.

## Checks before handing back

One light direction? Shadows hue-shifted? No banding (long parallel stripes of adjacent steps)?
No semi-transparent pixels (`validate` reports them)? Silhouette still reads at 1x? Then hand
back to `easel-pixel:pixel` for the critique.
