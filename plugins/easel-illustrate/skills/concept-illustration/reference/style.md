<!-- Easel: adapted from aishwaryaashok14/peanut-illustrations @ 1e5c645892a2d70242062f23ee2277b18240e05c
     (github.com/aishwaryaashok14/peanut-illustrations, peanut-illustrations/references/style-dna.md), MIT License,
     Copyright (c) 2026 Aishwarya Ashok, with portions adapted from ian-xiaohei-illustrations, Copyright (c)
     2026 Ian; see NOTICE.md. Modified by Easel (2026-10-11): the peanut and its watermark removed (Easel images carry no watermark); the upstream author line dropped (credited in NOTICE.md); "not vector" reworded for SVG drawing; a section on drawing the style as SVG added. -->

# Style DNA

## One sentence

Pure white, minimal, hand-drawn, lots of whitespace, restrained, deadpan, slightly absurd, product-sketch feeling — one black line, one warm-orange accent, structure clear but never an instruction manual.

Like someone quickly sketching one explanatory drawing on a blank sheet of paper.

## Must have

- 16:9 horizontal concept illustration.
- Pure white background: no beige, no warm gray, no paper texture, no gradient, no shadow, no noise, no vintage feel.
- Mostly black hand-drawn line art: thin lines, slightly wobbly, not mechanical (even when drawn as SVG paths), not heavy outlines.
- Lots of whitespace: the main subject fills about 40%-60% of the canvas, at least 35% stays empty, ideally one whole quiet zone.
- A few short handwritten English labels: at most 5-8, each as short as possible (1-3 words).
- One image expresses only one core action, structure, state, or metaphor.
- Let structure read naturally — never write the structure type name on the image.

## Color

This is a **single-accent duotone**: black plus exactly one accent color.

- **Black** — line art, the mascot, frames, structure, main text, the main objects.
- **Warm orange** (the single accent) — the one thing the eye should follow: the main flow, the key arrow, the critical word, the result, the moment of emphasis.

Use the accent sparingly — one job per image. Never introduce a second or third color. If you are tempted to add a color, make it orange or make it black. (Default accent is warm orange; if the user asks for a different signature color, swap orange for that one color everywhere — still only one accent.)

## Never

- No commercial illustration.
- No PPT infographic.
- No formal flowchart.
- No course slide.
- No cute cartoon poster.
- No children's illustration.
- No complex architecture diagram.
- No polished flat illustration.
- No techy UI.
- No realistic app screenshot.
- No complex background, gradient, shadow, or texture.
- Do not explain every single node.
- No second accent color.
- No type-title in the top-left corner ("Workflow / System Diagram / Common Pitfalls / Roadmap", etc.).

## Aesthetic direction

Aim for deadpan, inventive, interesting, clean, and a little absurd.

Avoid cute, childish, over-complicated, or stiff.

## In Easel's vector path

- The canvas is one SVG (or an HTML page holding it) at 1600 x 900 (16:9), white background.
- Hand-drawn line: `stroke="#111"`, `stroke-width` 2.5-3.5, round caps and joins, and a light
  wobble from an SVG filter (`feTurbulence` with `baseFrequency` about 0.02 and a fixed `seed`,
  then `feDisplacementMap` with `scale` 2-3) applied to the line-art group, never to the labels.
- Labels in the bundled handwriting face, Caveat (400 or 700), 30-44 px, black; the one key word
  may take the accent.
- The accent is one colour (default warm orange `#E8772E`) on one element: the main arrow, the
  result, the key word.
