---
name: brand-identity
description: >-
  A complete visual identity, in phases with an approval gate at each: an emotional brief,
  structurally different directions, the logo (through easel-design:logo), the colour and type
  system, patterns and textures, application examples (cards, social avatars, favicons) and a
  brand-kit folder with guidelines. Everything is built in SVG/HTML and rendered by the Easel
  engine, and the result is saved as .easel/brand.md for every other skill.
when_to_use: >-
  The user asks for a brand, a brand kit, a visual identity, a rebrand or brand guidelines. For a
  logo alone use easel-design:logo; for colours or type alone use easel-design:design-system; to
  record an existing brand use easel-core:brand.
argument-hint: "[company or product] [what it stands for]"
allowed-tools: mcp__plugin_easel-core_easel__render_still mcp__plugin_easel-core_easel__render_pdf mcp__plugin_easel-core_easel__contact_sheet mcp__plugin_easel-core_easel__qa mcp__plugin_easel-core_easel__craft mcp__plugin_easel-core_easel__validate mcp__plugin_easel-core_easel__embed_fonts Read Write Edit Glob Grep Bash(node:*)
---

# Brand identity

A brand is a set of decisions made in order, each approved before the next. Work in
`./easel-out/<slug>/`; the final kit goes in `./easel-out/<slug>/brand-kit/`.

Reference: [reference/brand-identity.md](reference/brand-identity.md) (logo principles and
variations, colour and type systems, patterns, clear space, guideline structure, favicons and app
icons, avatars, applications, the checklist).

## Phases (stop for approval after each)

1. **Brief:** what the company does, for whom, three words for how it should feel, what it must
   never look like, competitors to stand apart from. Use `easel-core:brief` for a larger job.
2. **Directions:** run `easel-design:directions` for 3-5 structurally different directions (each
   names the convention it breaks). The user keeps one; nothing is blended.
3. **Mark:** run `easel-design:logo` in the kept direction (concepts, size ladder, mono, export).
4. **System:** colour scales and type from `easel-design:design-system` (the palette tool:
   `node "${CLAUDE_PLUGIN_ROOT}/tools/palette.mjs" --from "<hex>"`, the
   type scale); patterns and textures from the reference.
5. **Applications:** a business card (`mcp__plugin_easel-core_easel__render_pdf`, 3.5 x 2 in trim plus 1/8 in
   bleed on every side: a 3.75 x 2.25 in page, every word at least 1/8 in inside the trim; ask the printer for
   their spec), social avatars and a cover,
   favicons and app icons (`mcp__plugin_easel-core_easel__render_still` `sizes`), one hero or poster in the brand. Lay them
   out with `mcp__plugin_easel-core_easel__contact_sheet` and check each with `mcp__plugin_easel-core_easel__qa`
   (`width` and `height` of the piece, `fixedFrame: true`, `checks: ["text_clipping", "contrast"]`); fix every hard
   failure and every contrast finding.
6. **Kit:** `brand-kit/` with the logo files, colour and type tokens, the application renders and
   a guidelines page (HTML and PDF). Every SVG in the kit with `<text>` (a wordmark, a lock-up) goes
   in as the `-embedded.svg` that `mcp__plugin_easel-core_easel__embed_fonts` writes, so it keeps
   its bundled face in browsers and web pages (an `<img>`, inline SVG, a CSS background). Design tools
   and slide apps usually ignore fonts inside an SVG: there the user needs the font installed or the
   text outlined in a vector editor, or uses the PNGs; say so. The guidelines page goes in the same
   way: run `mcp__plugin_easel-core_easel__embed_fonts` (`{"file": ".../guidelines.html"}`) and put the
   `guidelines-embedded.html` it writes in the kit. Then write `.easel/brand.md` with `easel-core:brand` and
   validate it (`mcp__plugin_easel-core_easel__validate` `{"kind": "brand", ...}`).
7. **Critique** the kit with `easel-core:critique` (**design** rubric) before calling it done.

Names: never base a brand on another company's marks, names or trade dress; if the user's
direction is "like <brand>", translate it into the qualities they mean.
