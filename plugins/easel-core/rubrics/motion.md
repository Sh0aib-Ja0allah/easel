---
name: motion
title: Motion rubric (animation, explainers, video)
applies_to: [motion, video, animation]
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

# Motion rubric

Shared scale and rules: [README](README.md). Review from a `filmstrip` (a frame every 0.5 s; one
call takes at most 48 frames, so a piece longer than 24 s comes as several filmstrips), single
frames at the key moments at full size, and the `qa` numbers. Score each dimension 1-10.

| Dimension | What a 7 looks like |
|---|---|
| **Story and hook** | The point lands; something worth watching in the first second; a clear hero moment; a resolved last frame |
| **Style fidelity** | The chosen style's signature traits are all present and consistent across shots |
| **Motion craft** | Easing, spacing, overlap and follow-through feel physical; no linear drift, popping or jitter; one focal motion at a time |
| **Composition and type** | Each frame composes as a still; text sized for the format and held long enough to read (craft: typography) |
| **Finish** | Textures, lighting and edges suit the style; no banding, aliasing, clipping or fallback fonts |
| **Sound and sync** (if audio) | Music fits, hits land on cuts (`cues.json`), loudness -16 to -12 LUFS (`qa` loudness) |
| **Technical** | Exact duration, fps and size for every aspect; no unintended still or empty stretch (`qa` stillness); no blue-purple cast (`qa` colour_cast; see below) |

## Blocking in motion work

- A slideshow: shots with no movement inside them.
- Text on screen shorter than its reading time.
- Any open `qa` hard gate.

## The blue-purple styles

easel-motion's synthwave, liquid and aurora-glass styles are blue-purple by design, so `qa`
colour_cast fails every frame of them. When the user chose one of them, the palette is not a cast:
their `qa` runs with `castMaxRatio: 1` (each style's `STYLE.md` says so) and colour_cast is not a
finding. No other style gets this; anywhere else a blue-purple cast is a hard gate.
