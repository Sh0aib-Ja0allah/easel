---
name: anti-generic
title: Anti-generic rules
applies_to: [design, illustration, motion, video, social, ui]
version: 1
---
<!--
Adapted for Easel from nexu-io/open-design @ 17e255959703a3fad7c8eb7f7b70dcafccc5629a, craft/anti-ai-slop.md.
Copyright 2026 Open Design contributors. Licensed under the Apache License, Version 2.0
(licenses/Apache-2.0.txt at the repo root). open-design adapted parts of its craft files from
referodesign/refero_skill, Copyright (c) 2026 Refero, MIT (see NOTICE.md).
Modified by Easel (2026-10-11): rewritten in new words and restructured for Easel; extended from
UI to illustration, motion and video; thresholds aligned with Easel's qa tool. Other sources of ideas:
- alchaincyf/huashu-art-motion @ 9ff59339f934e08483ba0a5b1db20f4c2c421b35, scripts/film_gate.py (MIT):
  the blue-purple frame limit and the "slideshow" check
- b1rdmania/claude-brand-skills (no license; ideas only, re-expressed): structurally different
  directions, keep-or-kill, anti-references, blur test
-->

# Anti-generic rules

A model left alone drifts to the most average answer. These rules name the usual tells and
give the move that replaces each. **Blocking** rules must be fixed before delivery; the
`qa` tool measures the ones marked *(measured)*.

## Blocking

1. **No unearned blue-purple.** A violet-to-blue gradient, an indigo accent or a mostly
   blue-purple video is the house style of machine output. Use it only when the brand file or the
   user asks for it. Videos with more than 30% blue-purple frames fail *(measured: `colour_cast`)*.
2. **No invented facts.** Statistics, quotes, logos of real companies and testimonials appear only
   when the user supplied them. Otherwise use a clearly labelled placeholder.
3. **No filler text.** "Lorem ipsum", "Feature one", "Your tagline here" are a layout problem in
   disguise. Write real copy from the brief, or cut the slot.
4. **No emoji standing in for icons.** Draw a simple icon (consistent stroke, `currentColor`) or
   use none.
5. **No slideshow video.** Every shot needs movement inside it, not only cuts between still
   cards, and no still or empty stretch may run past 2 seconds *(measured: `stillness`)*.

## Should fix

- **The template skeleton.** Hero, three feature cards, pricing, FAQ, call to action, in that
  order, with nothing changed. Break at least one section with a different structure.
- **Everything centred and symmetric.** One deliberate asymmetry (an off-grid image, a large
  number hanging into the margin) reads as a decision.
- **Accent everywhere.** Use the accent colour for at most two things per screen or frame.
- **Default faces as the whole personality.** A system or default sans set for every role says
  nothing. Pick a display face on purpose (the bundled Space Grotesk or Newsreader are a
  start), and keep the workhorse face for body text.
- **Decoration with no job.** Blobs, waves, glows and noise that support nothing. Every element
  should carry meaning, hierarchy or rhythm.

## How to get away from average

1. **Directions before details.** Make 3 to 5 directions that differ in *structure* (layout,
   scale, type, colour logic), not just colour. Name, for each, the convention it breaks.
2. **Keep or kill, never blend.** The user keeps one or kills each. Averaging two directions
   brings back the generic result.
3. **Anti-references.** Ask what the user dislikes and list examples the work must not resemble.
4. **Blur test.** Blur the render heavily (or view it as a 64 px thumbnail). If its silhouette could
   belong to any of the anti-references, change the structure.
5. **About 80/20.** Most of a piece follows proven patterns; one or two bold, specific choices make
   it recognisable. If nobody could tell which product or story it belongs to, it is a template.
