---
name: typography
title: Typography rules
applies_to: [design, ui, social, poster, presentation, motion, video]
version: 1
---
<!--
Adapted for Easel from nexu-io/open-design @ 17e255959703a3fad7c8eb7f7b70dcafccc5629a, craft/typography.md and craft/typography-hierarchy.md.
Copyright 2026 Open Design contributors. Licensed under the Apache License, Version 2.0
(licenses/Apache-2.0.txt in this plugin). open-design adapted parts of its craft files from
referodesign/refero_skill @ a9b54a3e62a6391f5f5ab7a20e4ddb32fb79a27d
(refero_skill, Copyright (c) 2026 Refero, MIT; see NOTICE.md).
Modified by Easel (2026-10-11): rewritten in new words and restructured for Easel; extended from
UI to illustration, motion and video; thresholds aligned with Easel's qa tool. Other sources of ideas:
- b1rdmania/claude-brand-skills (ideas only): choose the typeface before drawing a wordmark
- WCAG 2.2 (W3C) for minimum sizes that affect contrast rules
-->

# Typography rules

## Faces

- **Two families at most** in one piece: one for display, one for reading. A monospace third face
  is fine for code and tabular numbers.
- **Brand first.** Use the faces in `.easel/brand.md`. Otherwise use the bundled OFL faces, which
  render offline: Space Grotesk (display), Newsreader (editorial), Inter (UI and body),
  JetBrains Mono (code, data). Never link a web font from a CDN at render time.
- **Choose the face before the wordmark.** A logo's letterforms come from a chosen typeface,
  adjusted by hand, not invented from scratch.

## Scale (screens, at 1x)

| Role | Size | Line height | Letter spacing |
|---|---|---|---|
| Display | 48-96 px | 1.0-1.1 | -0.02 to -0.03 em |
| Heading 1 | 32-48 px | 1.1-1.2 | -0.01 to -0.02 em |
| Heading 2 | 24-32 px | 1.2-1.3 | -0.01 em |
| Body | 16-20 px | 1.45-1.6 | 0 |
| Small, captions | 12-14 px | 1.4-1.5 | +0.01 to +0.02 em |
| ALL CAPS labels | 11-14 px | 1.2 | +0.06 to +0.1 em (always add tracking) |

- Step sizes on a ratio (1.2 to 1.333) instead of picking numbers one by one.
- Use **three weights** at most: a reading weight, an emphasis weight, an announcing weight.
- For Chinese, Japanese and Korean text, add about 0.2 to the line heights above.

## Measure and rhythm

- Body lines run **45-75 characters**. Wider columns need more line height.
- Paragraph spacing is about one line height; space above a heading is larger than below it, so
  it belongs to what follows.
- Align to a baseline grid on the spacing unit from the brand file (often 4 or 8 px).

## Video and social

- Text must be readable on a phone: at 1080 px wide, **body text at least 42 px**, headlines at
  least 72 px. Keep text inside the platform's safe zones.
- Hold time: give on-screen text at least **0.3 s per word plus 1 s**, and never less than
  1.5 s. Do not animate letters faster than people can read them.
- Captions: at most two lines, 32-42 characters each, high contrast or on a solid band.

## Mistakes to catch

- Fake bold or fake italic (a weight that is not bundled): load the real face or choose another.
- Widows and orphans in headlines: rewrite or rebalance with `text-wrap: balance`.
- Text set on busy images without a scrim or band.
- Clipped or overflowing text *(measured: `qa` text_clipping)*.
