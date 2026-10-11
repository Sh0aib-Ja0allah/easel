---
name: ad-creative
description: >-
  Paid ad creative in HTML/CSS: display ads in the standard IAB sizes, paid social ads, retargeting
  creatives and HTML5 animated ads, built from one master into every size, with a clear value
  proposition, a CTA that reads as a button, A/B variations, and platform limits checked through
  the Easel engine.
when_to_use: >-
  The user asks for ads, banner ads, display ads, paid social creative, ad variations or an HTML5
  animated ad. For organic social posts use easel-design:social-graphic; for a website hero use
  easel-design:landing-page.
argument-hint: "[product or offer] [ad sizes or platform]"
allowed-tools: mcp__plugin_easel-core_easel__render_still mcp__plugin_easel-core_easel__contact_sheet mcp__plugin_easel-core_easel__filmstrip mcp__plugin_easel-core_easel__qa mcp__plugin_easel-core_easel__embed_fonts mcp__plugin_easel-core_easel__craft Read Write Edit Glob Grep Bash(node:*)
---

# Ad creative

An ad has about a second: brand, offer, CTA, in that order, at every size. Work in
`./easel-out/<slug>/`.

Reference: [reference/ad-creative.md](reference/ad-creative.md) (sizes, hierarchy, CTA design,
value propositions, layouts per size, A/B variations, platform rules, HTML5 animation limits).
Product shots: [../design/reference/product-mockup.md](../design/reference/product-mockup.md).

## Steps

1. **Brand:** read `.easel/brand.md`; if there is none, run `easel-core:brand` or ask for the
   colours and faces, and say when defaults were used.
2. **Brief:** the offer, the audience, the exact copy (headline, CTA), the sizes or platforms,
   images and logo files the user owns, the platform's file-size limits.
3. **Build** one master page per layout family (wide, square, tall); each size is a page or a
   CSS variant. Use the brand faces if the project has their font files, otherwise a bundled face (Inter, Space
   Grotesk, Newsreader, JetBrains Mono, Caveat, STIX Two Text, Noto Sans Math). Bundled weights are
   400 and 700 (Inter also 900); 500 renders as 400 and 600 as 700. No CDNs: renders
   are offline. The CTA is a real button shape with enough contrast.
4. **Render** every size with `mcp__plugin_easel-core_easel__render_still` (`sizes`), and lay them out with
   `mcp__plugin_easel-core_easel__contact_sheet` to compare. For HTML5 ads, `mcp__plugin_easel-core_easel__filmstrip` across the animation (it must end
   on a complete frame with the CTA) and a static backup frame.
5. **Check** each size with `mcp__plugin_easel-core_easel__qa` (`width` and `height` of that size, `fixedFrame: true`,
   `checks: ["text_clipping", "contrast"]`); fix every hard failure and every contrast finding (graphic mode reports
   contrast without refusing, but a finding is still text below AA). qa measures text only: check the CTA button's
   own 3:1 against its surroundings by hand, `node "${CLAUDE_PLUGIN_ROOT}/tools/palette.mjs" --contrast "<button>" "<ground>"`.
   Check the small sizes (320 x 50, 300 x 250) by eye: is the offer still readable?
6. **Variations:** when asked for A/B tests, change one thing per variant (headline, image, CTA
   colour) and name the files by what changed.
7. **Critique:** `easel-core:critique` with the **social** rubric (or **design** for display).
   Fix what scores below 7; re-render, re-check.
8. **Deliver** the files per size and variant, the HTML, and the qa numbers. An HTML5 ad goes out
   with its fonts inside: run `mcp__plugin_easel-core_easel__embed_fonts` (`{"file": ".../ad-300x250.html"}`) on each
   approved page and deliver the `-embedded.html` it writes (a browser or ad server has no Easel
   fonts, so the bare page falls back to a default face). Each embedded face adds about 17-33 KB
   (Caveat about 66 KB; the result's `bytes` is the page's size): check it against the network's
   cap (often 150 KB for the first load) and keep to one family in one or two weights.
