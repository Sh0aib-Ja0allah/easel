---
name: poster
description: >-
  Posters, flyers and print pieces in HTML/CSS: event and gig posters, promotional flyers,
  announcements, art prints. Sets the print size with bleed, builds a strong hierarchy readable from
  a distance, renders a PNG proof and a print PDF through the Easel engine, and checks text and
  contrast. Adapted from designskills' poster method plus Anthropic's canvas-design approach for art
  prints.
when_to_use: >-
  The user asks for a poster, flyer, print piece, art print or something "to print". For social
  posts use easel-design:social-graphic; for slides use easel-design:presentation.
argument-hint: "[event or message] [size, e.g. A3 or 18x24in]"
allowed-tools: mcp__plugin_easel-core_easel__render_still mcp__plugin_easel-core_easel__render_pdf mcp__plugin_easel-core_easel__contact_sheet mcp__plugin_easel-core_easel__qa mcp__plugin_easel-core_easel__craft Read Write Edit Glob Grep
---

# Poster

A poster is read from across a room in three seconds: one dominant element, a clear order, and
the facts (what, when, where) findable at a glance. Work in `./easel-out/<slug>/`.

References:

- [reference/poster.md](reference/poster.md): print sizes and bleed, hierarchy, layouts, type
  sizes for distance, print colour, the checklist.
- [reference/canvas-design.md](reference/canvas-design.md): for an art print or a poster that is
  mostly image: a design philosophy first, then one composition expressed with intent.

## Steps

1. **Brand:** read `.easel/brand.md`; if there is none, run `easel-core:brand` or ask for the
   colours and faces, and say when defaults were used.
2. **Brief:** the size (A-series, US sizes or pixels), where it hangs or is shared, the exact copy
   (title, date, time, place, CTA), images the user owns, any print shop specs (bleed, colour).
3. **Rules:** the hierarchy and distance-reading rules in the reference; the `anti-generic` and
   `typography` rulebooks (`mcp__plugin_easel-core_easel__craft`).
4. **Build** one page at the trim size plus bleed (`@page { size: ... }`, a root sized to it, and
   every background extended into the bleed). Use the brand faces if the project has their font files, otherwise a bundled face (Inter, Space
   Grotesk, Newsreader, JetBrains Mono, Caveat, STIX Two Text, Noto Sans Math). Bundled weights are
   400 and 700 (Inter also 900); 500 renders as 400 and 600 as 700. No CDNs: renders
   are offline. Art that runs off the edge on purpose (a shape, a photo, a cropped numeral drawn
   as a shape) carries the attribute `data-easel-bleed`, so qa lists it as exempt instead of
   failing the frame; never put it on text, which stays inside the trim and its safe margin.
5. **Proof:** `mcp__plugin_easel-core_easel__render_still` at screen size (and `scale: 2`), plus a small version (about 300 px
   tall) to test hierarchy from a distance. Look at both.
6. **Check** with `mcp__plugin_easel-core_easel__qa` (`width` and `height`: the root's size in CSS px with the bleed,
   mm x 96 / 25.4; `fixedFrame: true`; `checks: ["text_clipping", "contrast"]`); fix every hard failure and every
   contrast finding (graphic mode reports contrast without refusing, but a finding is still text below AA).
7. **Print file:** `mcp__plugin_easel-core_easel__render_pdf` (`file`; the page's `@page` size is used, so include the bleed).
   Report the page size (the `@page` size you set, bleed included, in mm or inches) and the page
   count. Tell the user that CMYK conversion, if
   the printer needs it, is done with the printer's profile in a layout tool.
8. **Critique:** `easel-core:critique` with the **design** rubric. Fix what scores below 7 when the
   fix is in reach; re-render, re-check.
9. **Deliver** the PDF, the PNG proof, the HTML, and the qa numbers.
