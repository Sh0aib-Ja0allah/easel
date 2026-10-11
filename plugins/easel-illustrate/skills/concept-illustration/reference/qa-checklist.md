<!-- Easel: adapted from aishwaryaashok14/peanut-illustrations @ 1e5c645892a2d70242062f23ee2277b18240e05c
     (github.com/aishwaryaashok14/peanut-illustrations, peanut-illustrations/references/qa-checklist.md), MIT License,
     Copyright (c) 2026 Aishwarya Ashok, with portions adapted from ian-xiaohei-illustrations, Copyright (c)
     2026 Ian; see NOTICE.md. Modified by Easel (2026-10-11): the peanut and its watermark checks removed; the mascot test and the engine checks added. -->

# QA Checklist

## Must pass

- It is 16:9 horizontal.
- The background is clean white.
- The mascot is present.
- The mascot performs the core action, not just decoration (the mascot test: delete the mascot; if the idea reads exactly the same, it was decoration).
- The metaphor is freshly invented for this prompt.
- The image is deadpan, inventive, and interesting.
- Clean and sparse — the main subject is under ~60% of the canvas.
- One image expresses only one core structure.
- Labels are few, short, and readable English.
- Exactly one accent color (warm orange by default), used only for the single point of emphasis (a key word in the accent's darker text shade is the same accent).
- No second or third color crept in.

## Failure signals

If any of these appear, regenerate or do a local edit:

- A type-title in the top-left ("Common Pitfalls / Workflow / System Diagram / Roadmap").
- The mascot looks like an emoji, a sticker or a cute cartoon.
- It looks like a slide, a course deck, or a formal flowchart.
- Too many elements, arrows, or nodes.
- Text turns into long paragraphs.
- The background has paper texture, shadow, gradient, beige, or noise.
- A realistic UI screenshot or techy interface.
- Garbled text or unreadable labels.
- A second accent color appears.
- It is too stiff, with no absurd metaphor.

## Iteration moves

- Too plain: make the mascot the subject of the action and add one strange-but-valid metaphor.
- Too busy: cut nodes; keep one action and 3-5 short labels.
- Too cute: emphasize deadpan, blank serious expression, not cute, not mascot.
- Too PPT: remove titles, frames, tidy grids, and excess arrows; make it a hand-drawn scene.
- Wrong color: ensure only the single warm-orange accent is used; everything else is black on white.
- Text errors: prefer a local edit; if there are many, regenerate and reduce the number of labels.

## Delivery test

A good image should make the reader feel "huh, a little strange" first, then understand the structure within one second.

If the first impression is a tutorial page rather than a strange product sketch on blank paper, it fails.

## Measured checks (Easel)

- Render with `mcp__plugin_easel-core_easel__render_still` at 1600 x 900 and look at it at full
  size and at 400 x 225 (the size it is often seen in an article).
- `mcp__plugin_easel-core_easel__qa` with `checks: ["text_clipping", "contrast"]` and
  `fixedFrame: true`: no label cut off, nothing past the frame, labels at AA contrast.
