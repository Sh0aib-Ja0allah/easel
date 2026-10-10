---
name: design
title: Design rubric (graphics, UI, posters, decks, logos)
applies_to: [design, ui, poster, presentation, logo, social]
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

# Design rubric

Shared scale and rules: [README](README.md). Score each dimension 1-10.

| Dimension | What a 7 looks like |
|---|---|
| **Hierarchy** | In 3 seconds the eye goes 1-2-3 in the intended order; one clear focal point; the main action is obvious |
| **Composition and spacing** | Spacing follows one unit; alignment is deliberate; white space groups things; no cramped edges |
| **Typography** | Two families at most; a clear scale; comfortable measure and leading; no clipped or orphaned text (`qa` text_clipping) |
| **Colour** | A layered palette with one accent used sparingly; contrast passes AA (`qa` contrast); dark mode re-checked |
| **Distinctiveness** | At least one specific, recognisable choice; passes the blur test against the anti-references (craft: anti-generic) |
| **Brand fit** | Uses the colours, faces and voice in `.easel/brand.md`; nothing off-brand |
| **Accessibility** (UI only) | Targets 24 px or more, visible focus, labels, reduced motion respected (craft: accessibility) |

## Domain checks

- **Logos:** read at 16 and 32 px on light and dark (`contact_sheet` ladder); a one-colour version
  works; no hairlines that vanish when small; distinct silhouette.
- **Decks:** one idea per slide; titles state the point; 30 words or fewer per slide outside
  quotes; charts labelled directly.
- **Posters:** readable at thumbnail and at full size; the headline survives from 3 metres.
