---
name: colour
title: Colour rules
applies_to: [design, ui, illustration, motion, video, social]
version: 1
---
<!--
Adapted for Easel from nexu-io/open-design @ 17e255959703a3fad7c8eb7f7b70dcafccc5629a, craft/color.md.
Copyright 2026 Open Design contributors. Licensed under the Apache License, Version 2.0
(licenses/Apache-2.0.txt in this plugin). open-design adapted parts of its craft files from
referodesign/refero_skill @ a9b54a3e62a6391f5f5ab7a20e4ddb32fb79a27d
(refero_skill, Copyright (c) 2026 Refero, MIT; see NOTICE.md).
Modified by Easel (2026-10-11): rewritten in new words and restructured for Easel; extended from
UI to illustration, motion and video; thresholds aligned with Easel's qa tool. Other sources of ideas:
- alchaincyf/huashu-art-motion @ 9ff59339f934e08483ba0a5b1db20f4c2c421b35 (MIT): the AI-look
  colour ban, measured here by qa colour_cast
- WCAG 2.2 (W3C): contrast ratios
-->

# Colour rules

## Build the palette in layers

| Layer | Share of the frame | Notes |
|---|---|---|
| Neutrals (background, surface, text, borders) | 70-90% | Slightly tinted toward the brand hue, never pure grey defaults |
| One accent | 5-10% | The only colour that shouts |
| Status colours (success, warning, error) | 0-5% | Only where they mean status |
| Effects (gradients, glows) | under 1% | Each one needs a reason |

- Take colours from `.easel/brand.md` when it exists. Name them by purpose (`accent`, `surface`),
  not by hue (`blue-500`), so themes can change.
- Prefer OKLCH when deriving shades: equal lightness steps look equal.

## Contrast is a gate

| Pair | Minimum (WCAG 2.x AA) |
|---|---|
| Text under 24 px (under 18.66 px if bold) | 4.5:1 |
| Larger text | 3:1 |
| Icons, chart marks, input borders, focus rings against their neighbours | 3:1 |

`qa` measures text contrast, sampling the real pixels behind text on gradients and photos. In UI
work a failure blocks delivery. If the brand accent is too light for text, use a darker shade of
it for text and keep the bright one for fills.

## Dark themes

- Avoid pure black backgrounds and pure white text; use near-black (about `#111` to `#161616`)
  and off-white (about `#EEE` to `#F2F2F2`) to reduce glare.
- Raise surfaces with lighter steps instead of shadows; borders can be white at 6-10% opacity.
- Re-check every accent against the dark background; most need a lighter variant.

## Accent discipline

- Two visible uses of the accent per screen or frame is plenty (say, a label and the main button).
- Links and focus rings count as accent uses.

## For illustration and video

- Pick the palette before drawing: 3-5 hues plus neutrals, with one dominant hue.
- Keep the dominant hue consistent across shots; change it only to mark a change in the story.
- Unless the brief asks for it, avoid blue-purple as the dominant hue *(measured: `colour_cast`)*.
- Grade the whole film consistently; a sudden cast between shots reads as a mistake.
