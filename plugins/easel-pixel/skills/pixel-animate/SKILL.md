---
name: pixel-animate
description: >-
  Rig and animate a pixel-art sprite in Aseprite through the `aseprite` MCP server: split the
  character onto named part layers, plan key poses, move cels instead of redrawing, add
  in-betweens, set millisecond timing that reads as motion, tag the cycle and review it as a
  filmstrip. Covers idles, walks, runs, jumps, attacks, secondary motion and simple effects.
when_to_use: >-
  The user wants a sprite to move (load this skill before touching Aseprite): a walk or run cycle, an idle breath, an attack, a jump, a
  flickering torch, a bobbing pickup, or limbs split onto layers for animation. Routing - to draw
  or shade the sprite first use easel-pixel:pixel-draw; for the whole job with brief, critique
  and export use easel-pixel:pixel; for the spritesheet or GIF use easel-pixel:pixel-export.
argument-hint: "[cycle: idle, walk, run, attack, jump...] [frame count or engine]"
allowed-tools: mcp__plugin_easel-pixel_aseprite__preflight mcp__plugin_easel-pixel_aseprite__sprite_info mcp__plugin_easel-pixel_aseprite__layer mcp__plugin_easel-pixel_aseprite__draw mcp__plugin_easel-pixel_aseprite__look mcp__plugin_easel-pixel_aseprite__frame mcp__plugin_easel-pixel_aseprite__cel mcp__plugin_easel-pixel_aseprite__tag mcp__plugin_easel-pixel_aseprite__validate mcp__plugin_easel-pixel_aseprite__reference Read Glob ReadMcpResourceTool ListMcpResourcesTool
---

<!-- Easel: adapted from with-pebbly/aseprite-ai-artist @ f51fe6908223ef9ac476de1568234c699594722d
     (github.com/with-pebbly/aseprite-ai-artist, skills/rig/SKILL.md, skills/animate/SKILL.md), MIT License,
     Copyright (c) 2026 with-pebbly; see NOTICE.md. Modified by Easel (2026-10-11): rig and animate merged into
     one procedure; Easel tool names and agents; the concept-skill storyboard step reduced to importing a
     user's storyboard; the rulebook read as MCP resources. -->

# Rig and animate a sprite

Animating by nudging pixels frame to frame accumulates drift: by frame six the character is a
different size. Rig first, plan keys, then fill in. Call `mcp__plugin_easel-pixel_aseprite__look`
after every call that changed pixels.

## 0. Connect and read

`mcp__plugin_easel-pixel_aseprite__preflight` (stop if not ready; setup is in
`easel-pixel:pixel`), then `sprite_info`. Read `rules://05-animation` and
`rules://40-timing-and-spacing`, then the cycle file: `41-idle-and-breathing`,
`42-walk-and-run`, `43-jump-fall-land`, `44-attacks-and-impacts`, `45-secondary-motion`,
`46-subpixel-animation`, `47-top-down-animation`; animals `51-animal-gaits`,
`52-birds-and-flight`; effects `80-vfx-fire-smoke-magic`, `81-impacts-and-game-feel`
(ReadMcpResourceTool, server `plugin:easel-pixel:aseprite`). Take frame counts and durations
from their tables, not from feel.

## 1. Rig

Pixels baked into one layer cannot be animated without redrawing them. The standard rig, bottom
to top so nearer parts draw over farther ones:

```
arm-near     camera-side arm (top)
leg-near
head
torso
arm-far      partly hidden by the torso; this sells depth
leg-far
shadow       ground contact, if the style has one (bottom)
```

Add `weapon`, `cape`, `hair-front`, `hair-back` as the design needs. Keep names stable; every
later call uses them. Two layers with one name in different groups (`left/arm`, `right/arm`)
must always be addressed by `group/child` path: the bare name is refused.

**Fresh:** one `layer` call with `batch` (one undo step), creating `shadow`, `leg-far`, `arm-far`,
`torso`, `head`, `leg-near`, `arm-near` in that order; then draw each part on its own layer with
`easel-pixel:pixel-draw`.

**Splitting baked art:**

1. `look op="ascii"` to find exact part boundaries. Guessed coordinates clip limbs.
2. Create the rig layers.
3. Per part, one `draw` call on its target layer:
   `draw layer="head" ops=[{ kind:"blit", fromLayer:"<source>", from:{x:12,y:4,width:8,height:8}, to:{x:12,y:4} }]`
   (`skipTransparent` keeps the copy clean).
4. Rename the original `flat-original` and hide it (`layer op="set" visible=false`). Hide, do not
   delete: if a boundary was wrong you want it back.
5. `look op="preview"` with the original hidden: the sprite must look unchanged. A limb that lost
   pixels means a wrong boundary.

**Overlap:** give each limb a pixel or two under the torso, or a gap opens the moment it moves;
the stacking order hides the excess. A part reused from another open sprite:
`layer op="duplicate" toSprite="#<id>"`. For a large or tricky rig, hand it to the
`easel-pixel:rig-builder` agent.

## 2. Plan the key poses in writing

Write the plan before touching a frame (or hand planning to `easel-pixel:animation-director`):
frame count and why, each key pose in words specific enough to draw, which in-betweens are
needed, milliseconds per frame, tag name and direction, and what is hand-keyed versus generated.

- **Walk (8):** contact (widest stance, front heel down), down (body lowest), pass (legs
  together, body highest - the frame people forget, and why a walk slides), up (pushing off),
  then mirrored. A 4-frame walk uses contact and pass per leg.
- **Run (6-8):** like a walk with an airborne frame and more forward lean.
- **Idle (2-4):** a breath. Chest rises a pixel, shoulders follow a frame later. 200-400 ms.
- **Attack (4-6):** anticipation, strike (fast, 40-60 ms), hold (150-250 ms), recover. No
  anticipation reads weightless.

If the user gave a storyboard, its panels are the keys: once the frames exist,
`reference op="import" path=... grid={columns:N, rows:1}` puts panel i on frame i, and
`look op="compare" frame=i` checks each key against its panel. Say where the pixel size forces
a departure (a 4px jump the timing cannot carry).

## 3. Frames and key poses

`frame op="add" count=7` (for 8 frames). Move parts by moving cels, not by redrawing:

```
cel op="copy" layer="arm-near" frame=1 toFrame=3
cel op="move" layer="arm-near" frame=3 dx=2 dy=-1
```

`cel op="link"` shares one image across frames so a static part stays in sync. Redraw only where
a part truly changes shape (a bending knee, a foreshortened arm), and do it as a grid: `look
op="ascii" layer=... frame=<previous key> rulers=false region=...`, edit the rows into the new
shape, `draw` kind `grid` onto the new frame at the same origin. Every pixel you did not change
stays put, so the part's volume cannot drift.

## 4. Look at the keys before in-betweens

`look op="filmstrip"`: a vision model reads only the first frame of a GIF, so the filmstrip is
how you see motion. Check volume and height now, while there are four frames to fix, not eight.
Then `look op="preview" frame=n` at full size on the first, the last and each hold frame.

## 5. In-betweens

Only once the keys read. Spacing is easing: poses close together read slow, far apart fast.
`look op="onion" frame=n` (pass `layer` over an opaque background) judges an in-between against
its ghosted neighbours.

Secondary motion nobody should consciously notice (a bob, a cape drift, a lantern sway, a
floating pickup) can be generated:
`cel op="oscillate" layer="hair-back" fromFrame=1 toFrame=8 amplitudeY=1 period=8`, or
`cel op="tween" property="position" fromFrame=1 toFrame=4 to={x,y} easing="ease_in_out"`.
Caveat: offsets round to whole pixels, and at 1-2px amplitude two neighbours can land on the same
value and then jump (a stutter). Hand-key primary motion.

Something that grows or shrinks on screen (a cart coming closer, a bird flying away) is drawn by
hand at three or four sizes, each complete, and every frame uses the nearest. Below about 12px a
scaled shape loses or merges parts. Check its largest and smallest frames with `look op="preview"`.

## 6. Timing

`frame op="set_duration" durations=[150,100,80,100,150,100,80,100]`. Hold contacts longer than
passes; uniform timing reads mechanical however good the drawings are.

## 7. Tag

`tag op="create" name="walk" from=1 to=8 direction="forward"` (also `pingpong`, `reverse`;
`repeats=0` loops forever). Untagged frames are unusable by an engine, and `validate` treats a
multi-frame untagged sprite as an error.

## 8. Review

`look op="filmstrip"` again, then check: volume and height constant, clean loop (last frame
flows into the first), anticipation before strong actions, light that does not move, nothing
that snaps. Run `validate` with an `expect` built from the plan:

```
validate expect={ layerFrames:{ "slash-trail":[[3,4]] }, mustNotOverlap:[["weapon","head"]] }
```

Fix every error, then hand back to `easel-pixel:pixel` for the critique, or straight to
`easel-pixel:pixel-export` if the critique already passed.
