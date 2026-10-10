---
name: pixel
title: Pixel-art rubric (sprites, tiles, animation)
applies_to: [pixel]
version: 1
---
<!--
Easel critique rubric, written for Easel (MIT) on 2026-10-11. No text copied; ideas drawn from:
- ArnavPuri/designskills @ c7873015add8571ca95043febad0d9e6c97ee5c6, skills/design-critique (MIT):
  evidence-backed findings, severity levels, score caps, before/after re-check
- Vincentwei1021/mg-styles-15 @ 49052d80bfaf9fa8412cc9710530e5e95a3b8d8c, rubric.md (MIT):
  an independent reviewer, calibrated 1-10 anchors, fixes ordered by impact with concrete numbers
- with-pebbly/aseprite-ai-artist @ f51fe6908223ef9ac476de1568234c699594722d, agents/pixel-critic.md
  (MIT): the cold read before the brief, critic never fixes, the read failure as a blocker
- alchaincyf/huashu-art-motion @ 9ff59339f934e08483ba0a5b1db20f4c2c421b35 (MIT): film gates
-->

# Pixel-art rubric

Shared scale and rules: [README](README.md). Look at the sprite at 1x and at an integer zoom. Score
each dimension 1-10.

| Dimension | What a 7 looks like |
|---|---|
| **Silhouette** | The cold read names the subject from the outline alone |
| **Value structure** | The lit side is among the lightest values and the core shadow among the darkest; survives desaturation |
| **Shading** | Hue-shifted ramps (warmer lights, cooler shadows); no pillow shading |
| **Palette** | Small and deliberate; no near-duplicates; no off-palette or semi-transparent pixels |
| **Line and cluster quality** | Even line runs, no doubles or jaggies, no stray single pixels that read as noise |
| **Animation** (if any) | Volume and height stay constant; timing varies (holds, anticipation); no frame that snaps |

Blocking: the silhouette does not read, or semi-transparent pixels in a sprite meant for a game.
