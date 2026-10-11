---
name: design-system
description: >-
  Design foundations and systems: OKLCH colour scales from a brand colour (with contrast per step),
  semantic and dark-mode colours, type scales and font pairing, spacing, grids and layout, radii,
  shadows, motion tokens, CSS custom properties, Tailwind config and DTCG tokens, and Easel's
  generic DESIGN.md systems as starting points. Shows the system as a rendered specimen page and
  checks every text pair for contrast.
when_to_use: >-
  The user asks for a palette, colours, a type scale, fonts that pair, spacing, a grid, tokens, a
  theme or a design system, or wants a starting style ("make it look like a clean SaaS"). For a
  whole new brand with a logo use easel-design:brand-identity; to save the brand for every skill
  use easel-core:brand.
argument-hint: "[brand colour or starting style] [what it is for]"
allowed-tools: mcp__plugin_easel-core_easel__render_still mcp__plugin_easel-core_easel__qa mcp__plugin_easel-core_easel__craft Read Write Edit Glob Grep
---

# Design system

Decisions as tokens, shown on one specimen page and measured. Work in the user's project when
they have one, otherwise `./easel-out/<slug>/`.

References:

- [reference/colour.md](reference/colour.md): scales, semantic colours, neutrals, WCAG, dark
  mode, gradients, Tailwind and CSS output.
- [reference/typography.md](reference/typography.md): scale ratios, pairings, hierarchy, body
  text, `clamp()`, variable fonts, loading.
- [reference/layout.md](reference/layout.md): grids, flexbox, bento, whitespace, hierarchy,
  responsive and container queries.
- [reference/design-system.md](reference/design-system.md): token hierarchy, components,
  theming, spacing, elevation, radii, motion tokens, documentation.
- [reference/theme-factory.md](reference/theme-factory.md): applying a ready-made theme to an
  artifact.
- Starting systems: `${CLAUDE_PLUGIN_ROOT}/systems/<name>/DESIGN.md` (generic styles, no real
  brands; the list is in `${CLAUDE_PLUGIN_ROOT}/systems/README.md`).

## Steps

1. **Start from what exists:** `.easel/brand.md`, the project's tokens or Tailwind config. If
   the user wants a starting style, pick the closest system in `systems/` and adapt it; never
   copy a real company's design system or name one.
2. **Colour:** generate scales with
   `node "${CLAUDE_PLUGIN_ROOT}/tools/palette.mjs" --from "<brand hex>" --name brand` (`--css` or
   `--json` for output; `HUE CHROMA` for a neutral, e.g. `250 0.02 --name gray`). Pick text, border
   and fill steps from its contrast columns.
3. **Type, spacing, layout, the rest** from the references; write them as CSS custom properties
   (and Tailwind or DTCG if the project uses them).
4. **Specimen:** build one page that shows the scales, type ramp, spacing, a few components and
   both themes. Render it with `mcp__plugin_easel-core_easel__render_still` (`fullPage: true`, `theme: "both"` when there is
   a dark theme).
5. **Check** with `mcp__plugin_easel-core_easel__qa` (`mode: "ui"`, `checks: ["contrast", "text_clipping"]`): every text
   and background pair the system allows must pass.
6. **Save:** offer to write the result into `.easel/brand.md` with `easel-core:brand`, so every
   Easel skill uses it.
7. **Deliver** the tokens, the specimen render and the qa numbers.
