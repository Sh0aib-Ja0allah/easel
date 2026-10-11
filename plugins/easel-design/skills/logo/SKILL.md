---
name: logo
description: >-
  Logos, wordmarks, favicons and app icons as hand-authored SVG: a brief that names the smallest
  use size, 3-5 structurally different concepts, a contact sheet of every concept from 16 to 512 px
  on light and dark (rendered by the Easel engine), one named worst failure fixed per pass (three
  passes at most), then the export set (SVG, PNG ladder, mono and reversed versions, favicon and
  app icon sizes) with a provenance record. No image model or API key needed.
when_to_use: >-
  The user asks for a logo, logomark, wordmark, monogram, favicon, app icon or brand mark, to fix
  one that falls apart at small sizes, or for a logo "like" or "exactly like" another company's
  mark (this skill turns that into an original mark with the qualities they admire). A favicon or
  app icon is this skill, not easel-illustrate:svg or svg-illustration (they draw one-off SVG
  graphics and illustrations, not a mark with its size ladder and export set). For a whole identity (colours, type, guidelines) use
  easel-design:brand-identity; for a set of UI icons use easel-design:icons.
argument-hint: "[name] [what it stands for] [smallest use size]"
allowed-tools: mcp__plugin_easel-core_easel__contact_sheet mcp__plugin_easel-core_easel__render_still mcp__plugin_easel-core_easel__embed_fonts mcp__plugin_easel-core_easel__validate mcp__plugin_easel-core_easel__craft Read Write Edit Glob Grep
---

<!-- Easel: the method (route by asset class, brief fields, distinct SVG concepts, the contact sheet
     at a size ladder, one worst failure per pass, three passes, provenance) is adapted from
     code-katz/claude-illustrate-skill @ 7189cde8c29c36faf5c7fc8b57bc1b15e5ae4cbd
     (github.com/code-katz/claude-illustrate-skill, SKILL.md), MIT License, Copyright (c) 2026 Will
     Curran (Code Katz); see NOTICE.md. Modified by Easel (2026-10-11): rendering through the Easel
     engine instead of a shell Chromium; provenance.json instead of a Markdown manifest; raster
     backends left to easel-ai-media. -->

# Logo

A logo that reads at 512 px and turns to mud at 16 px is a picture of a logo. Everything here is
judged at the smallest size it will be used. Work in `./easel-out/<slug>/`.

## 1. Brief (ask for what is missing; never invent values)

| Field | Why |
|---|---|
| Name and what it stands for | The idea the mark carries |
| **Smallest use size** | The binding constraint: a 16 px favicon and a 512 px app icon are different designs |
| One-colour requirement | Stamps, embroidery, dark mode: the mark must survive as one flat colour |
| Palette | Exact hex values (from `.easel/brand.md` if there is one) |
| Type | Families and weights for a wordmark (bundled faces only, see below) |
| Style reference | Specific and described ("geometric, monoline, rounded terminals"), never "modern" or "clean" |
| Set membership | Existing assets it must match, or none |
| Avoid | What it must not look like; competitors' marks to stay clear of |

Never base a mark on another company's logo, name or trade dress. If the user names a brand as
the reference, ask which qualities they mean and design from those.

## 2. Concepts: 3 to 5, structurally different

One SVG file per concept in `concepts/`, each a different idea (a letterform, a symbol, an
abstract shape, a negative-space trick), not recolours of one idea: if they share a silhouette,
that is one concept. For each:

- a square `viewBox="0 0 512 512"`, no `width`/`height` attributes;
- few nodes and clean curves; no stroke thinner than about 2 units per 100 of viewBox;
- no gradients, filters or shadows in a first mark unless the brief asks;
- text only if it stays legible at the smallest size; below that it is an icon, not a wordmark.

**Wordmarks start from a real typeface** (font-first): set the name as `<text>` in a bundled OFL
face (Inter, Space Grotesk, Newsreader, JetBrains Mono, Caveat or STIX Two Text) at a bundled
weight (400 or 700; Inter also 900), then adjust
spacing, cut or join letters deliberately. Don't hand-draw letters from scratch. Only bundled faces,
because only they can be embedded in the delivered file (section 5). If the brand has its own
font, design in the closest bundled face and tell the user the final lettering needs that font
outlined in a vector editor, under a licence that allows logo use.

## 3. Contact sheet, then look

`mcp__plugin_easel-core_easel__contact_sheet` with every concept as an item (`file`), `sizes:
[16, 24, 32, 48, 128, 512]` and `themes: ["light", "dark"]`. The engine inlines and scales each
SVG correctly, so small sizes are real renders. Read the sheet itself, at each size:

- Does it read at the smallest use size, or is it a smudge?
- Does it survive as one flat colour (make a mono copy and add it to the sheet)?
- Do the colours match the brief's hex values?
- Is any text spelled and spaced correctly?
- Does it look like an existing well-known mark? If so, drop or change it.

The full sheet is wide (six sizes side by side), so a viewer shows it shrunk and its 16 px cells
read smaller than 16 px. Judge the small sizes on an enlarged sheet: write `small.html` in the job
folder that shows each concept's 16 and 32 px cells (the files in the result's `cells`) as `<img>`
at four times their size with `image-rendering: pixelated`, on light and dark, render it with
`mcp__plugin_easel-core_easel__render_still` and Read that PNG. Every square you see there is one
real pixel of the small render.

Show the user the sheets and let them keep or kill concepts; nothing is blended.

## 4. Refine: one worst failure per pass

Name the **single worst failure** of the kept concept (not a list), fix only that, render the
sheet again, look again. **Three passes at most.** A pass that improves nothing means the
concept is wrong, not underworked: say so and go back to another concept.

## 5. Export

In `export/`:

- `logo.svg` (full colour), `logo-mono.svg` (one colour, `currentColor`), `logo-reversed.svg`
  (for dark grounds), and the wordmark lock-up if there is one;
- **every SVG with `<text>` gets its font inside it:** run
  `mcp__plugin_easel-core_easel__embed_fonts` `{"file": ".../logo.svg"}` on each and deliver the
  `-embedded.svg` it writes (the bundled faces inlined as base64 WOFF2), never the bare file. Easel's
  renders have the bundled fonts; the user's site does not, so a bare `<text>` falls back to a
  default font there and the wordmark changes shape. The `-embedded.svg` keeps its face in browsers
  and web pages (an `<img>`, inline SVG, a CSS background). Design tools and slide apps usually
  ignore fonts inside an SVG: there the user needs the font installed or the text outlined in a
  vector editor, or uses the PNGs; tell them. It refuses a face that is not bundled: change the
  face, or deliver PNGs only;
- PNGs from one HTML page per variant with `mcp__plugin_easel-core_easel__render_still`
  (`sizes: [{width: 16, height: 16, name: "logo-16"}, ...]` for 16, 32, 48, 64, 128, 256, 512, 1024;
  `transparent: true`). For a mark that is not square (a lock-up), the number is the height and the
  width keeps the mark's ratio (`{width: 96, height: 32, name: "lockup-32"}` for 3:1);
- favicon set (16, 32, 48 PNG, plus `favicon.svg`), iOS home-screen icon 180 x 180, Android 192
  and 512 (with padding inside the safe circle), when the brief needs them;
- clear space: the minimum margin around the mark, stated in units of the mark.

## 6. Provenance

Append every exported file to `./easel-out/<slug>/provenance.json` (`method: "procedural"`,
`tool: "easel-design:logo"`, inputs: the brief as `user`, each font with its licence) and check it
with `mcp__plugin_easel-core_easel__validate` `{"kind": "provenance", "file": ...}`. Read
[reference/ip-and-licensing.md](reference/ip-and-licensing.md) and tell the user what it says
about trademark searches before they register the mark. Easel cannot give legal advice.

## 7. Critique

Run `easel-core:critique` with the **design** rubric on the final sheet before delivering. Deliver
the export folder (its SVGs with `<text>` as `-embedded.svg` files), the final contact sheet and
the provenance file.
