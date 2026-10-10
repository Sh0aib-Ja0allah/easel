---
name: brand
description: >-
  Find or create the shared brand file .easel/brand.md (colours, typefaces, spacing, layout,
  components, motion, voice, anti-patterns, logo use) that every Easel skill reads. Use when the
  user says "use my brand", "set up our brand", "what are our colours", gives brand colours or
  fonts, or when designs keep drifting off-brand. Reads Tailwind config, CSS variables, design
  tokens or an existing DESIGN.md before asking. For a full new brand identity with logo
  directions use easel-design:brand-identity; for one-off palette questions use
  easel-design:design-system.
when_to_use: Before design work in a project that has (or should have) a brand, or whenever brand colours or fonts are mentioned.
allowed-tools: Read Glob Grep Write Edit mcp__plugin_easel-core_easel__validate mcp__plugin_easel-core_easel__render_still mcp__plugin_easel-core_easel__qa
---

# Brand file

One file holds the brand for every Easel skill: `.easel/brand.md` in the user's project, in nine
DESIGN.md sections plus an optional Logo section. Get the template with
`mcp__plugin_easel-core_easel__validate` `{"kind": "brand", "schema": true}`.

## 1. Look before asking

If `.easel/brand.md` exists, read it, validate it, and use it. Otherwise search the project:

- `tailwind.config.*` (theme colours, fontFamily), CSS custom properties in `:root`
  (`--color-*`, `--font-*`), DTCG token files (`*.tokens.json`, `tokens/*.json`), `DESIGN.md`,
  `theme.*`, a logo in `public/`, `assets/` or `brand/`.
- Note where each value came from.

## 2. Ask for what is missing

Ask in one message for the gaps only, with suggestions: primary and accent colours (hex),
display and body typefaces, the feel in three words, what the brand must never look like.
If the user has no typefaces in mind, suggest the bundled ones (Space Grotesk, Source Serif 4,
Inter, JetBrains Mono); renders work offline with those.

## 3. Write `.easel/brand.md`

Fill every section with concrete values: hex or OKLCH colours with roles (background, surface,
text, accent), named faces with weights and sizes, a spacing unit, component rules, motion
timings, voice rules, anti-patterns. Keep it short; numbers beat adjectives.

## 4. Check it

1. Validate with `mcp__plugin_easel-core_easel__validate` `{"kind": "brand", "file": ".easel/brand.md"}`
   and fix every problem.
2. Render a brand sheet with `mcp__plugin_easel-core_easel__render_still`: colour swatches with hex
   labels, a type specimen in each face, body text on the background and on the surface, and an
   accent button. Use `"theme": "both"` if the brand has a dark mode.
3. Run `mcp__plugin_easel-core_easel__qa` on the same page with `"mode": "ui"`; if any text pair
   fails contrast, propose a darker or lighter shade and update the file.
4. Open the sheet with Read, show it, and say which values were found in the project and which
   came from the user.
