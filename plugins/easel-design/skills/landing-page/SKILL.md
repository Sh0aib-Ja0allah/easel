---
name: landing-page
description: >-
  Landing pages and hero sections in HTML/CSS, section by section: hero (headline hierarchy,
  split, centred, minimal or video patterns), social proof, features, pricing, FAQ and the final
  CTA, responsive from phone to desktop, with performance and accessibility in mind. Explores
  directions first when asked, renders full pages at desktop and phone sizes through the Easel
  engine, checks them and critiques them.
when_to_use: >-
  The user asks for a landing page, a homepage, a hero section, a product or launch page, or to
  make a page convert better. For a single screen or component use easel-design:ui-design; for
  several different looks first use easel-design:directions.
argument-hint: "[product] [goal of the page]"
allowed-tools: mcp__plugin_easel-core_easel__render_still mcp__plugin_easel-core_easel__contact_sheet mcp__plugin_easel-core_easel__qa mcp__plugin_easel-core_easel__craft Read Write Edit Glob Grep
---

# Landing page

The hero earns the scroll; every section after it answers the next objection. Work in the user's
project when they have one, otherwise `./easel-out/<slug>/index.html`. Easel renders offline:
compile Tailwind locally or write the tokens as CSS.

References:

- [reference/landing-page.md](reference/landing-page.md): page structure, section patterns,
  social proof, pricing, CTAs, the checklist.
- [reference/hero.md](reference/hero.md): headline hierarchy, hero patterns, backgrounds,
  responsive heroes, LCP.

## Steps

1. **Brand:** read `.easel/brand.md`; if there is none, run `easel-core:brand` or ask for the
   colours and faces, and say when defaults were used.
2. **Brief:** the product, the one action the page asks for, the audience, real proof the user
   has (testimonials, numbers, customers who agreed to be named). Never invent proof.
3. **Direction:** if the user wants options or the look is open, run `easel-design:directions`
   for the hero first and build the kept one.
4. **Build** section by section from the references. Use the brand faces if the project has their font files, otherwise a bundled face (Inter, Space
   Grotesk, Newsreader, JetBrains Mono, Caveat, STIX Two Text, Noto Sans Math). No CDNs: renders
   are offline.
5. **Render** the full page with `mcp__plugin_easel-core_easel__render_still` (`fullPage: true`) at 1440 and 390 wide, and the
   hero alone at 1440 x 900 and 390 x 844 (what shows before any scroll).
6. **Check** with `mcp__plugin_easel-core_easel__qa` (`mode: "ui"`, `checks: ["text_clipping", "contrast"]`); fix every hard
   failure.
7. **Critique:** `easel-core:critique` with the **design** rubric; fix what scores below 7.
8. **Deliver** the page, the renders, the qa numbers, and what to measure after launch.
