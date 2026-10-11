---
name: presentation
description: >-
  Slide decks and pitch decks as one HTML file (a 16:9 page per slide), exported to PDF by the Easel
  engine: title, section, content, data, quote and closing layouts, one idea per slide, a type
  scale readable on a projector, speaker notes, and a contact sheet of every slide for review.
when_to_use: >-
  The user asks for slides, a deck, a pitch deck, a keynote or a presentation. For a single
  poster-style graphic use easel-design:poster; for a video use easel-motion:animate.
argument-hint: "[topic or outline] [number of slides]"
allowed-tools: mcp__plugin_easel-core_easel__render_still mcp__plugin_easel-core_easel__render_pdf mcp__plugin_easel-core_easel__contact_sheet mcp__plugin_easel-core_easel__qa mcp__plugin_easel-core_easel__embed_fonts mcp__plugin_easel-core_easel__craft Read Write Edit Glob Grep
---

# Presentation

One idea per slide, readable from the back of the room. The deck is one HTML file: each slide a
`<section>` of 1280 x 720 px with `break-after: page`, and `@page { size: 1280px 720px; margin: 0 }`.
Work in `./easel-out/<slug>/`.

Reference: [reference/presentation.md](reference/presentation.md) (deck structures, slide layouts,
type scale, data slides, consistency, speaker notes).

## Steps

1. **Brand:** read `.easel/brand.md`; if there is none, run `easel-core:brand` or ask for the
   colours and faces, and say when defaults were used.
2. **Outline:** the audience, the one thing they should remember, the length. Write the slide
   list (title and one-line point per slide) and show it before building a long deck.
3. **Build** the deck. Use the brand faces if the project has their font files, otherwise a bundled face (Inter, Space
   Grotesk, Newsreader, JetBrains Mono, Caveat, STIX Two Text, Noto Sans Math). Bundled weights are
   400 and 700 (Inter also 900); 500 renders as 400 and 600 as 700. No CDNs: renders
   are offline. Body text at least 24 px, titles 40 px or more; one accent colour;
   data slides use real numbers from the user. Speaker notes go in `<aside class="notes">`
   (hidden in print).
4. **PDF:** `mcp__plugin_easel-core_easel__render_pdf` (`file`; one page per slide). Check the page count equals the slide
   count.
5. **Look:** render each slide (a copy of the deck showing slide n, or one page per slide) with
   `mcp__plugin_easel-core_easel__render_still` at 1280 x 720 and lay them out with `mcp__plugin_easel-core_easel__contact_sheet`: is the deck
   consistent, is any slide overloaded?
6. **Check** each slide page from step 5 with `mcp__plugin_easel-core_easel__qa` (`width: 1280`, `height: 720`,
   `fixedFrame: true`, `checks: ["text_clipping", "contrast"]`): a slide whose content runs past its 720 px fails.
   Fix every hard failure and every contrast finding (graphic mode reports contrast without refusing, but a
   finding is still text below AA).
7. **Critique:** `easel-core:critique` with the **design** rubric on the contact sheet; fix what
   scores below 7.
8. **Deliver** the PDF, the HTML deck, the contact sheet, the qa numbers. The HTML deck goes out
   with its fonts inside: run `mcp__plugin_easel-core_easel__embed_fonts` (`{"file": ".../deck.html"}`) on the
   approved deck and deliver the `-embedded.html` it writes (a browser that opens the bare deck has
   no Easel fonts and falls back to a default face). The PDF already carries its fonts.
