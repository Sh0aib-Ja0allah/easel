---
name: social-graphic
description: >-
  Organic social graphics and banners in HTML/CSS, rendered to exact platform pixels: feed posts,
  stories, carousels, profile headers and covers (Instagram, X, LinkedIn, Facebook, Pinterest,
  TikTok), YouTube thumbnails, OG and link images, website and email banners. Applies each
  platform's safe zones and phone-size readability minimums, exports one master to every size, and
  checks text and contrast before delivery.
when_to_use: >-
  The user asks for a social post, story, carousel, thumbnail, cover, header, OG image or banner.
  For paid ads use easel-design:ad-creative; for posters and print use easel-design:poster; for
  animated social video use easel-motion:animate.
argument-hint: "[platform or size] [message]"
allowed-tools: mcp__plugin_easel-core_easel__render_still mcp__plugin_easel-core_easel__contact_sheet mcp__plugin_easel-core_easel__qa mcp__plugin_easel-core_easel__craft Read Write Edit Glob Grep
---

# Social graphics

One message, readable on a phone at feed size, inside the platform's safe zone. Built as HTML at
the exact pixel size and rendered by the Easel engine. Work in `./easel-out/<slug>/`.

References (read the one that fits before building):

- [reference/social-media.md](reference/social-media.md): platform sizes, safe zones, carousels,
  layouts per platform.
- [reference/thumbnails.md](reference/thumbnails.md): YouTube thumbnails, video covers, OG and
  article images, the small-size test.
- [reference/banners.md](reference/banners.md): website, email and event banners.

## Steps

1. **Brand:** read `.easel/brand.md`; if there is none, run `easel-core:brand` or ask for the
   colours and faces, and say when defaults were used.
2. **Brief:** platform(s) and format(s), the one message, the exact copy, images the user owns.
   If several platforms, list every size now: one master layout, one page per size (or one page
   that reads `window.innerWidth`).
3. **Rules:** the platform table and safe zones from the reference; the `anti-generic` and
   `typography` rulebooks (`mcp__plugin_easel-core_easel__craft`). Text at least the reference's minimum size at
   feed size; one focal point; the hook in the area the feed shows.
4. **Build** the page. Use the brand faces if the project has their font files, otherwise a bundled face (Inter, Space
   Grotesk, Newsreader, JetBrains Mono, Caveat, STIX Two Text, Noto Sans Math). Bundled weights are
   400 and 700 (Inter also 900); 500 renders as 400 and 600 as 700. No CDNs: renders
   are offline. Draw a hidden safe-zone guide while you lay out (a dashed outline
   with `display: none` for the final render).
5. **Render** every size with `mcp__plugin_easel-core_easel__render_still` (`sizes: [{width, height, name}]`); put the
   results side by side with `mcp__plugin_easel-core_easel__contact_sheet` and look at them at feed size: the rendered
   PNGs as items (a page given as an item is cropped to the cell, not scaled) with
   `sizes: [{width: 360, height: 450}]` for 4:5 (360 wide at the format's ratio; one sheet per format).
6. **Check** each size with `mcp__plugin_easel-core_easel__qa` (`width` and `height` of that size, `fixedFrame: true`,
   `checks: ["text_clipping", "contrast"]`); fix every hard failure and every contrast finding (graphic mode reports
   contrast without refusing, but a finding is still text below AA). For thumbnails also render the 168 x 94 test
   from the reference and read it.
7. **Critique:** `easel-core:critique` with the **social** rubric. Fix what scores below 7 when
   the fix is in reach; re-render and re-check.
8. **Deliver** one PNG per size (named by platform and size), the HTML, the qa numbers.

Carousels: every slide the same ratio as the first; one HTML file per slide sharing one CSS file;
render them all and check them as a strip on a contact sheet (does slide 1 make you swipe?).
