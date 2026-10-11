---
name: generative-art
description: >-
  Algorithmic and generative art with p5.js: a short algorithmic philosophy first, then one
  seeded, parameterised sketch in an offline viewer page whose frames are a pure function of time,
  rendered by the Easel engine to PNG stills (several seeds side by side) and a seamless loop MP4.
  Flow fields, particle systems, noise, recursion, packing, tilings, harmonic patterns.
when_to_use: >-
  The user asks for generative art, algorithmic art, creative coding, a flow field, particles,
  p5.js, a looping abstract animation or "art made with code". A looping animation that is
  abstract and algorithmic (noise, particles, fields) belongs here; for one of designed shapes,
  text or characters, or one that tells a story, use easel-motion:animate; for a poster or print
  layout use easel-design:poster; for a hand-drawn concept sketch use
  easel-illustrate:concept-illustration. GLSL shaders are not covered yet.
argument-hint: "[idea or mood] [still | loop] [size]"
allowed-tools: mcp__plugin_easel-core_easel__render_still mcp__plugin_easel-core_easel__contact_sheet mcp__plugin_easel-core_easel__filmstrip mcp__plugin_easel-core_easel__render_video mcp__plugin_easel-core_easel__qa Read Write Edit Glob Grep mcp__plugin_easel-core_easel__craft
---

<!-- Easel: the philosophy-first method, seeded randomness, parameter design and craftsmanship rules
     are adapted from anthropics/skills @ dbd4588f9e1033efb41dad4bef2f7947c8993d44
     (github.com/anthropics/skills, skills/algorithmic-art/SKILL.md and templates/generator_template.js),
     Apache License 2.0, Copyright 2026 Anthropic, PBC; license text in licenses/Apache-2.0.txt, see NOTICE.md.
     Modified by Easel (2026-10-11): Easel's own offline viewer (no upstream branding), a time-seekable
     render contract for the engine, renders and loops through the Easel engine; a seamless p5 1.x
     noise loop; routing beside easel-motion:animate. -->

# Generative art

The beauty is in the process, but what the user gets is pictures and a loop. Work in
`./easel-out/<slug>/`: `philosophy.md`, `piece.html`, `stills/`, `loop/`.

Read [reference/algorithmic-philosophy.md](reference/algorithmic-philosophy.md) for how to write
the philosophy and turn it into an algorithm, and start every piece from
[templates/viewer.html](templates/viewer.html) (copy it to `piece.html`).

## 1. Philosophy

Name the movement in one or two words and write 4-6 short paragraphs on how it lives in process,
noise, forces, structure and colour. Name an aesthetic, never a living artist or a studio, and
never copy a known artwork; reinterpret the user's reference as qualities. Keep the user's
subject as a quiet seed of the concept, not an illustration of it.

## 2. The sketch (the contract)

In the copied viewer, fill only the marked part:

- `PIECE`: the canvas size (1200 x 1200 for a square; 1920 x 1080 for 16:9; 1080 x 1350 for a
  portrait print), `fps` and `duration` (the loop length in seconds).
- `params` and `CONTROLS`: the seed plus the 3-8 qualities worth tuning (counts, scales,
  probabilities, angles, palette). Sliders are generated from `CONTROLS`.
- `build()`: everything that depends on the seed and parameters but not on time (seed first:
  `randomSeed`, `noiseSeed`; then grids, particles' starting points, palettes).
- `paint(t)`: the whole frame at time t, **from scratch**, using only `state`, `params` and t.
  No accumulation across frames, no `frameCount`, no `millis()`: the engine seeks frames out of
  order and the same t must give the same picture. Trails are drawn by re-tracing them inside
  `paint(t)` (integrate each particle from its start for a fixed number of steps, offset by t).
- **Loops:** make `paint(0)` equal `paint(duration)`: drive motion by the angle
  `a = TWO_PI * t / duration`, through `sin(a)` and `cos(a)`, or noise whose sampling point moves
  around a circle: `noise(x * s + r * cos(a), y * s + r * sin(a))` (s the noise scale, r the
  loop radius). p5 1.x `noise()` takes at most three coordinates and silently drops a fourth, so
  `noise(x, y, r * cos(a), r * sin(a))` loses the sine term and the loop plays forward, then
  backward.
- Palette: 3-6 colours chosen on purpose (from `.easel/brand.md` when the art is for a brand).
- p5.js 1.x only (the viewer loads 1.11.13; the engine refuses p5 2.x and the p5.sound add-on
  offline). Use the 1.x API.

## 3. Render and look

- **Stills:** `mcp__plugin_easel-core_easel__render_still` on `piece.html` at the piece size
  (`t` for a moment of a loop). Look at it. Then 6-9 seeds: save a copy per seed
  (`seeds/seed-12.html` with only `params.seed` changed) and lay them out with
  `mcp__plugin_easel-core_easel__contact_sheet` (one item per copy, `sizes` at the piece size).
  Keep the seeds that work; say which.
- **Motion:** `mcp__plugin_easel-core_easel__filmstrip` (`count: 8`) to check that it moves the
  way the philosophy says, and `render_still` at `t` = one frame before the end and at `t: 0`:
  the last frame must flow into the first like any other step (no jump at the seam).
- **Loop:** `mcp__plugin_easel-core_easel__render_video` (`file`, the piece's `duration` and
  `fps` are read from the page) and run `mcp__plugin_easel-core_easel__qa` with `video` (no
  still stretch unless intended).
- Refine what is there rather than adding more: one pass on composition and balance, one on
  colour, one on detail. Three passes at most.

- **Critique:** `easel-core:critique` with the **illustration** rubric on the chosen stills and
  a filmstrip. Fix blocking findings and anything below 7.

## 4. Deliver

`philosophy.md`, `piece.html` (opens in any browser with seed and parameter controls; it loads
p5.js from a CDN there, while Easel's renders use the offline copy), the chosen stills, the loop
MP4, and the seeds. p5.js (LGPL-2.1) is installed by easel-core's doctor; it is not bundled.
