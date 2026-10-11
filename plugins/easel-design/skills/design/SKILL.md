---
name: design
description: >-
  Entry point for graphic, UI and brand design with Easel: works out what is being made and hands
  it to the right easel-design skill (social-graphic, poster, ad-creative, infographic,
  presentation, ui-design, landing-page, design-system, brand-identity, logo, icons, directions),
  or makes a one-off visual itself (a product shot, a mockup, a quote card, a cover) in HTML/SVG,
  rendered offline by the Easel engine and critiqued before delivery.
when_to_use: >-
  The user asks to "design" something without a clear type ("design something for our launch",
  "make me a graphic", "a visual for this"), or for a product mockup or one-off graphic. A product
  shot laid out around the user's own photo or screenshot (a device frame, a packaging view) is
  this skill; a generated or retouched photo of the product is easel-ai-media:image. For
  illustrations and drawings use easel-illustrate:illustrate; for animation or video use
  easel-motion:animate.
argument-hint: "[what to design] [where it will be used]"
allowed-tools: mcp__plugin_easel-core_easel__render_still mcp__plugin_easel-core_easel__render_pdf mcp__plugin_easel-core_easel__contact_sheet mcp__plugin_easel-core_easel__qa mcp__plugin_easel-core_easel__craft Read Write Edit Glob Grep Bash(node:*)
---

# Design

Easel's design work is code: HTML, CSS and SVG, rendered to exact pixels by the easel-core engine
(offline, bundled fonts), measured, and reviewed before it is called done. Work in
`./easel-out/<slug>/`. An AI raster (a photo, a painting) is only used when the user wants one and
`easel-ai-media` is installed.

## 1. Route

| The user wants | Use |
|---|---|
| A social post, story, carousel, thumbnail, OG image, profile header, web or email banner | `easel-design:social-graphic` |
| A poster, flyer, print piece | `easel-design:poster` |
| A paid ad: display sizes, paid social, HTML5 ad | `easel-design:ad-creative` |
| Data, a process or a comparison made visual | `easel-design:infographic` |
| Slides, a deck, a pitch | `easel-design:presentation` |
| A screen, component, mobile UI, card, dark mode, dashboard | `easel-design:ui-design` |
| A landing page or hero section | `easel-design:landing-page` |
| Colours, type scale, spacing, tokens, a theme, a design system | `easel-design:design-system` |
| A whole brand identity | `easel-design:brand-identity` |
| A logo, wordmark, favicon, app icon | `easel-design:logo` |
| An icon set | `easel-design:icons` |
| "Less generic", "show me options", different directions | `easel-design:directions` |
| A product shot, device mockup, packaging view, before/after | this skill, with [reference/product-mockup.md](reference/product-mockup.md) |
| Any other one-off graphic | this skill, with [reference/graphic-design.md](reference/graphic-design.md) |

If two fit, pick the one closest to where the work will be used and say so in one line. A bigger
job (a campaign, several deliverables) starts with `easel-core:brief`.

## 2. One-off graphics

1. **Brand:** read `.easel/brand.md`; if there is none, run `easel-core:brand` or ask for the
   colours and faces, and say when defaults were used.
   Tints and shades of a brand colour: `node "${CLAUDE_PLUGIN_ROOT}/tools/palette.mjs" --from "<hex>" --css`.
2. **Brief:** what it is for, where it appears (exact pixel size), the one message, the copy
   (exact words), any product image. Ask only for what is missing.
3. **Rules:** read the `anti-generic` and `typography` rulebooks with
   `mcp__plugin_easel-core_easel__craft`, then [reference/graphic-design.md](reference/graphic-design.md)
   (composition, colour schemes, type, code patterns, style frameworks).
4. **Build** one HTML page at the exact size (`html, body { margin: 0 }`, a fixed-size root).
   Use the brand faces if the project has their font files, otherwise a bundled face (Inter,
   Space Grotesk, Newsreader, JetBrains Mono, Caveat, STIX Two Text, Noto Sans Math). Bundled
   weights are 400 and 700 (Inter also 900); 500 renders as 400 and 600 as 700. No CDNs:
   renders are offline, so reference images by relative path.
5. **Render** with `mcp__plugin_easel-core_easel__render_still` (`file`, `width`, `height`, `scale: 2`
   for retina; `sizes` for several formats from one page) and look at the PNG.
6. **Check** with `mcp__plugin_easel-core_easel__qa` (`width` and `height` of the piece, `fixedFrame: true`,
   `checks: ["text_clipping", "contrast"]`; each size when there are several). Fix every hard failure and every
   contrast finding (graphic mode reports contrast without refusing, but a finding is still text below AA),
   and re-render. qa measures text only: a button or icon shape needs 3:1 against its ground, checked by hand
   with `node "${CLAUDE_PLUGIN_ROOT}/tools/palette.mjs" --contrast "<shape hex>" "<ground hex>"`.
7. **Critique:** run `easel-core:critique` with the **design** rubric (social work: **social**).
   Fix what scores below 7 when the fix is in reach, re-render, re-check.
8. **Deliver** the PNGs (and the HTML source), with the qa numbers and anything not verified.
