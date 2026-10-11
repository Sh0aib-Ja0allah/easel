---
name: icons
description: >-
  Icon sets and systems in SVG: a grid and keylines, one stroke weight and corner style, optical
  corrections, filled and outlined variants, sizes from 16 to 48 px, accessible markup, an SVG
  sprite and a review sheet at every size on light and dark backgrounds, rendered by the Easel
  engine.
when_to_use: >-
  The user asks for icons, an icon set, a UI icon family or consistent iconography. For one logo or
  app icon use easel-design:logo; for illustrations use easel-illustrate:illustrate.
argument-hint: "[icons needed] [style: outline | filled | duotone]"
allowed-tools: mcp__plugin_easel-core_easel__render_still mcp__plugin_easel-core_easel__contact_sheet mcp__plugin_easel-core_easel__qa mcp__plugin_easel-core_easel__craft Read Write Edit Glob Grep
---

# Icons

One grid, one stroke, one corner radius: a set reads as a family. Work in `./easel-out/<slug>/`.

Reference: [reference/icon-design.md](reference/icon-design.md) (SVG fundamentals, the grid,
optical corrections, styles, semantic choices, custom techniques, icon and text alignment,
animated icons, accessibility, common UI icons).

## Steps

1. **Brand:** read `.easel/brand.md`; if there is none, run `easel-core:brand` or ask for the
   colours and faces, and say when defaults were used. Match the stroke weight and corner style to the brand's type.
2. **List** the icons and their meanings; for common actions use the conventional metaphor
   (reference: Semantic Icon Selection). Ask before inventing a new metaphor for a common action.
3. **Build** each icon as its own SVG on a 24 x 24 grid (2 px padding, `stroke="currentColor"`,
   one stroke width, `stroke-linecap="round"` or square for the whole set). Then a sprite
   (`<symbol>` per icon).
4. **Review sheet:** `mcp__plugin_easel-core_easel__contact_sheet` with every icon at `sizes: [16, 20, 24, 32, 48]` on
   `themes: ["light", "dark"]`. Look at 16 px first: does every icon still read?
5. **Fix** the worst failure (a muddy detail at 16 px, an optical size mismatch), re-render; at
   most three passes.
6. **Check** an icon-and-label row with `mcp__plugin_easel-core_easel__qa` (`mode: "ui"`, `checks: ["contrast"]`).
7. **Deliver** the SVGs, the sprite, the review sheet, and usage notes (labels, `aria-hidden`).
