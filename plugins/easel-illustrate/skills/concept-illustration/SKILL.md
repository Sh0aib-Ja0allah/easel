---
name: concept-illustration
description: >-
  Turn one idea (a judgment, a process, a contrast, a state, a metaphor) into one clean,
  hand-drawn concept illustration for an article, a post or a slide: a fresh low-tech metaphor,
  a recurring mascot that performs the core action (the user's own, or Easel's neutral default
  "the card"), black line on white with one accent colour, a few handwritten labels, lots of
  space. Drawn as SVG and rendered by the Easel engine, so it needs no API key; an AI raster is
  optional through easel-ai-media.
when_to_use: >-
  The user asks to "illustrate this idea", wants an article or blog illustration, an explainer
  sketch, a metaphor drawn, or a set of figures for a post. For a detailed scene or character
  illustration use easel-illustrate:svg-illustration; for icons, charts or UI graphics use
  easel-illustrate:svg; for an infographic with data use easel-design:infographic.
argument-hint: "[the idea in one sentence] [the mascot, if any]"
allowed-tools: mcp__plugin_easel-core_easel__render_still mcp__plugin_easel-core_easel__contact_sheet mcp__plugin_easel-core_easel__qa Read Write Edit Glob Grep mcp__plugin_easel-core_easel__craft
---

<!-- Easel: the method (compose first, one idea per image, structure types, fresh metaphors, the
     character doing the action, style and QA rules) is adapted from
     aishwaryaashok14/peanut-illustrations @ 1e5c645892a2d70242062f23ee2277b18240e05c (github.com/aishwaryaashok14/peanut-illustrations),
     MIT License, Copyright (c) 2026 Aishwarya Ashok, itself adapted in part from ian-xiaohei-illustrations,
     Copyright (c) 2026 Ian; see NOTICE.md. Modified by Easel (2026-10-11): neither project's character
     is used (a user-supplied mascot or Easel's neutral default instead); vector output through the
     Easel engine by default; no watermark. -->

# Concept illustration

One image, one idea, read in about a second: a slightly absurd sketch in which the mascot is
doing the idea. Work in `./easel-out/<slug>/`, one SVG and one PNG per image.

References:

- [reference/composition-patterns.md](reference/composition-patterns.md): the structure types
  and how to invent a fresh metaphor.
- [reference/style.md](reference/style.md): the visual rules (white, black line, one accent,
  space) and how to draw them in SVG.
- [reference/mascot.md](reference/mascot.md): the user's mascot, or the default card.
- [reference/qa-checklist.md](reference/qa-checklist.md): checks and fixes.
- [reference/raster-prompt.md](reference/raster-prompt.md): only for the optional AI raster path.

## 1. Read the idea

Decide which kind it is: a judgment, an input-to-output process, a before/after, a state, or a
concept metaphor. That picks the structure type. Illustrate the one idea given; don't expand a
sentence into an article.

## 2. Compose (out loud, briefly)

Before drawing, state in a few lines so the user can catch a wrong take:

- **Metaphor:** a fresh, physical, low-tech one for this idea (never reused from an earlier image).
- **Mascot's action:** what it is physically doing that drives the idea.
- **Labels:** 3-5 short handwritten words (at most 8).
- **Composition:** where the mascot is, the main object, where the eye goes, the empty area.

## 3. Draw (vector path, default)

Write one SVG at `viewBox="0 0 1600 900"` following [reference/style.md](reference/style.md):
white background, black wobbly line art (the filter goes on the drawing group, not on the
labels), Caveat labels, one accent on one element, at least a third of the canvas empty. Draw
the mascot from [reference/mascot.md](reference/mascot.md) in the pose the action needs.
Wrap it in a page (`<html>` with the SVG at 1600 x 900) if you want CSS.

## 4. Render, look, check

`mcp__plugin_easel-core_easel__render_still` at 1600 x 900, then look at it at full size and small
(a 400 px wide copy). Run `mcp__plugin_easel-core_easel__qa` (`checks: ["text_clipping",
"contrast"]`, `fixedFrame: true`) and the QA checklist, including the removal test. Fix the
single worst failure and re-render; at most three passes.

Then `easel-core:critique` with the **illustration** rubric on the PNG (the cold read must name
the idea; if it does not, the metaphor failed: recompose). Fix blocking findings and anything
below 7, re-render.

## 5. Deliver

The SVG and the PNG (and a 1200 x 675 PNG with `sizes` if it is for social), named
`01-<slug>.png`, `02-...` in order when there are several. Report what each image shows in one
line. Several ideas: one image each, the same mascot, a different metaphor each time; show them
together with `mcp__plugin_easel-core_easel__contact_sheet`.

## AI raster path (optional)

Only when the user asks for a painted or photographic raster and `easel-ai-media` is installed:
compose the same way, then follow [reference/raster-prompt.md](reference/raster-prompt.md) and
run the same QA on the result.
