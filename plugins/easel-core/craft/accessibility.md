---
name: accessibility
title: Accessibility baseline
applies_to: [ui, design, presentation, social, motion, video]
version: 1
---
<!--
Adapted for Easel from nexu-io/open-design @ 17e255959703a3fad7c8eb7f7b70dcafccc5629a, craft/accessibility-baseline.md.
Copyright 2026 Open Design contributors. Licensed under the Apache License, Version 2.0
(licenses/Apache-2.0.txt at the repo root). open-design adapted parts of its craft files from
referodesign/refero_skill, Copyright (c) 2026 Refero, MIT (see NOTICE.md).
Modified by Easel (2026-10-11): rewritten in new words and restructured for Easel; extended from
UI to illustration, motion and video; thresholds aligned with Easel's qa tool. Other sources of ideas:
- WCAG 2.2 (W3C), success criteria cited by number
-->

# Accessibility baseline

The floor is **WCAG 2.2 level AA**. These are the parts that design and motion work most often
get wrong.

## Seeing

- **Contrast:** 4.5:1 for normal text, 3:1 for large text and for icons, chart marks, input
  borders and focus indicators (1.4.3, 1.4.11). `qa` measures text contrast.
- **Colour is never the only signal** (1.4.1): pair it with text, a pattern or an icon, in charts
  and status messages alike.
- **Text stays text** in UI work, so it can be resized and read aloud; images of text are for
  logos and video frames only.
- **Reflow** (1.4.10): UI layouts must work at 320 px wide without horizontal scrolling.

## Operating

- **Targets:** at least 24 x 24 px (2.5.8); aim for 44 x 44 px for touch.
- **Visible focus** on every interactive element (2.4.7), never removed without a replacement.
- **Keyboard:** everything works with Tab, Enter and Space, in reading order, with no trap
  (2.1.1, 2.1.2, 2.4.3). Prefer native `button`, `a`, `input` over `div` with handlers.
- **Labels:** every input has a visible label, not just a placeholder (3.3.2).

## Understanding

- `lang` on the document (3.1.1); headings in order; landmarks (`header`, `nav`, `main`,
  `footer`).
- Alternative text for meaningful images (1.1.1); empty `alt=""` for decoration.

## Motion and time

- **Respect reduced motion:** with `prefers-reduced-motion: reduce`, replace movement with fades
  or cuts (2.3.3 at AAA; required by Easel for UI work).
- **No flashing** more than three times per second (2.3.1). Avoid large red flashes entirely.
- **Video:** burned-in or sidecar captions for speech; on-screen text held long enough to read
  (see the typography rulebook); no essential information only in sound.
- Anything that moves, blinks or scrolls automatically for more than 5 seconds needs a pause
  control in UI work (2.2.2).
