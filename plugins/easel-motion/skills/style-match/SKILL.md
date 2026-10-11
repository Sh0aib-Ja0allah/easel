---
name: style-match
description: >-
  Make a new animation style from the user's reference images or video: measure the references
  (palette, line weight, type, texture, motion), start a style kit, draw the piece's own frames in
  it, and compare them side by side with the references on a proportion grid, until the
  differences are deliberate. Saves a reusable styles/<name>/ folder (kit.js + STYLE.md with the
  measured numbers and a frame checklist).
when_to_use: >-
  The user shows references and says "make it look like this", "match this style", "in the style
  of these images", or wants an animation in a look none of easel-motion's styles covers. Use it
  inside easel-motion:animate's look check; for a look a shipped style already covers, go straight
  to animate.
argument-hint: "[reference images or folder] [style name]"
allowed-tools: mcp__plugin_easel-core_easel__measure_image mcp__plugin_easel-core_easel__compare_images mcp__plugin_easel-core_easel__render_still mcp__plugin_easel-core_easel__contact_sheet mcp__plugin_easel-core_easel__filmstrip mcp__plugin_easel-core_easel__qa Bash(node:*) Read Write Edit Glob Grep
---

<!-- Easel: the procedure is adapted from cth9191/animate @ 7e5eb56feb2dd573f890e1b7b34748af43d58263
     (github.com/cth9191/animate, plugins/animate/skills/animate/new-style.md), MIT License,
     Copyright (c) 2026 cth9191. This entry file is Easel's. -->

# Style match

A new look, made the way the shipped styles were: measured from the references, matched on the
piece's own frames, checked once with the user, then saved as a style folder any piece can use.
`<easel-motion>` means `${CLAUDE_PLUGIN_ROOT}` (this plugin's folder). The full procedure is in
[new-style.md](new-style.md); read it first. The short version:

## Rules

- **References stay local.** Everything with reference pixels in it (copies, trims, crops,
  comparison sheets) stays in `./easel-out/<slug>/references/`. Never commit it, never copy its
  code, and never name the artist, studio or brand in the style's name, files or published output
  (HANDOFF naming rule): name the style after the look ("blueprint", "neon ink", "woodcut").
- **Re-create the kind of image, not the image.** Same medium, proportions and palette; your own
  subject. No known characters.
- **Numbers over adjectives.** Every colour, weight and size in `STYLE.md` comes from
  `measure_image` or from the source's own CSS or SVG.

## Steps

1. **Gather** 3-6 references that show the range (a wide, a close-up, text, a character) into
   `./easel-out/<slug>/references/`. Look at them together with `contact_sheet`.
2. **Measure** with `mcp__plugin_easel-core_easel__measure_image` (`images: ["<job>/references"]`,
   `accent: true` for inks on dark grounds, `points` for flat areas, `outDir` in the job folder).
   Write what each colour *means*. Note line weight relative to the subject, texture, type,
   motion (on 1s or 2s), camera and composition (new-style.md → Measure).
3. **Start the style** in the user's project, next to or above where pieces live:
   `node "${CLAUDE_PLUGIN_ROOT}/tools/new-style.mjs" styles/<name> --from <closest shipped style or blank>`.
   Then start the piece in it:
   `node "${CLAUDE_PLUGIN_ROOT}/tools/new-piece.mjs" ./easel-out/<slug>/piece --style <name> --formats 16:9,9:16`
   (a new style has no demo, so the piece starts from the blank starter, whose scenes use only the
   STYLE hooks). Write the kit's drawing functions and hooks; draw the piece's 2-4 most different
   beats with them.
4. **Match:** build (`node "${CLAUDE_PLUGIN_ROOT}/tools/build.mjs" ./easel-out/<slug>/piece`),
   render each beat with `render_still` (`aspect`, `t`, `scale: 0.5`), and compare each with its
   closest reference with `mcp__plugin_easel-core_easel__compare_images` (`autoTrim`, `crop` /
   `cropOurs` for one figure; `outDir` = the job's `references/`). Read every sheet. Check in this
   order: proportions on the 10% grid, the palette numbers, the texture, the type. Fix and repeat
   until what still differs is deliberate.
5. **One check-in:** show the comparison sheets and the frames together. Ask: **thumbs up / closer
   to the reference (say where) / push it further from it.** Don't save before a thumbs up.
6. **Save** after the piece is approved: finish the STYLE hooks, fill every section of
   `styles/<name>/STYLE.md` (the measured table, motion, a frame checklist for this look, the kit
   API, do/don't, **not matched**, proven on), and render `styles/<name>/sample.png` from our own
   frames with `render_still`. Check `qa` (`canvas_text`) passes on the piece in each format.
   Then continue in `easel-motion:animate` (storyboard, build, render, review).

`<easel-motion>/examples/style-match/` is a finished run: three reference sheets, the
`blueprint` style made from them, a piece in it (9:16 and 16:9) and the comparison sheets.
