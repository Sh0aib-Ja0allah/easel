---
name: svg
description: >-
  Write production-ready SVG source by hand for UI and code: icons (outline, filled,
  multi-colour), flowcharts and architecture diagrams, bar, line and donut charts, progress
  rings, avatars, badges, wave dividers, map pins, SVG icon sprite sheets, CSS backgrounds and
  masks, SVG loaders and hover effects, React, Vue or Svelte icon components, and email-safe
  inline SVG. Every file is checked with Easel's svg-check and rendered through the Easel engine
  (light and dark, small sizes, animation frames) before it is delivered.
when_to_use: >-
  The user asks for an SVG, a vector or inline graphic, an icon or a few icons, a chart or
  diagram for a page or app, an icon sprite sheet, a CSS mask, an animated SVG loader, or an SVG
  component for their code. Routing - for scenes, characters, mascots, spot or empty-state
  illustrations use easel-illustrate:svg-illustration; for a logo, favicon or app icon use
  easel-design:logo; for a full icon family use easel-design:icons; for a game or pixel-art
  sprite use easel-pixel:pixel; for a chart as a designed standalone graphic, or a data
  infographic, use easel-design:infographic; for a loader or hover effect written as motion code
  in the user's own components use easel-motion:ui-motion; for one idea drawn as a sketch with a
  mascot use easel-illustrate:concept-illustration; for p5.js or algorithmic art use
  easel-illustrate:generative-art.
argument-hint: "[what to draw] [where it goes: file, React, Vue, CSS, email]"
allowed-tools: mcp__plugin_easel-core_easel__render_still mcp__plugin_easel-core_easel__contact_sheet mcp__plugin_easel-core_easel__filmstrip mcp__plugin_easel-core_easel__qa mcp__plugin_easel-core_easel__embed_fonts Bash(node:*) Read Write Edit Glob Grep mcp__plugin_easel-core_easel__craft
---

<!-- Easel: adapted from linyaosky/svg-skill @ 2103b92cb47f588a97a6c38aa6c40571fadbd4f8
     (github.com/linyaosky/svg-skill, SKILL.md), MIT License, Copyright (c) 2026 svg-skill contributors;
     see NOTICE.md. Modified by Easel (2026-10-11): Easel frontmatter and routing; validate.sh and xmllint replaced by svg-check.mjs and engine renders; render-and-look step added; logos and icon families routed to easel-design; output to ./easel-out/<slug>/; standalone files with text delivered with their bundled faces embedded; favicons, empty states, game sprites, standalone charts and UI motion code routed to their skills; rules for non-Latin and email text; XML well-formedness checked. -->

# SVG for UI and code

Write SVG source directly. Do not use image generation for anything that can be drawn as
vectors (for an AI raster, use easel-ai-media). Work in `./easel-out/<slug>/` unless the user
names a folder in their project.

## Scenario index

Match the request, then pick a path. Steps per scenario in
[reference/scenarios.md](reference/scenarios.md), full code in
[reference/examples.md](reference/examples.md), syntax and formulas in
[reference/syntax.md](reference/syntax.md).

| Scenario | viewBox | Key technique | Deliverable |
|----------|---------|---------------|-------------|
| UI icons (outline/filled) | 0 0 24 24 | `currentColor`, uniform stroke-width | file / component |
| Multi-colour icons | 0 0 24 24 | separate paths + fixed fill | file |
| Logo / brand mark | mark-specific | path outlines, safe margin | use easel-design:logo for a full logo |
| Favicon / app icon | 0 0 32 32 | minimal, high contrast | use easel-design:logo (the icon and its sizes); here only an SVG of a mark the user already has |
| Simple flat decoration | 0 0 100 100+ | flat shapes | SVG / inline; an empty-state or spot illustration is easel-illustrate:svg-illustration |
| Flowchart / architecture | content-based | marker arrows, grid alignment | UTF-8 file |
| Charts (bar/line/pie) | data-based | coordinates from a computed scale | title + desc; a chart as a designed standalone graphic is easel-design:infographic |
| Progress ring / bar | 0 0 24 24 or bar | `stroke-dasharray` or rect width | animatable |
| Avatar fallback | 0 0 40 40 | circle + letter / person path | currentColor |
| Badge / label | text-based | rounded rect + text | fixed colours |
| Wave divider | 0 0 1200 120 | Bezier path, `preserveAspectRatio="none"` | full-width |
| Map pin | 0 0 24 24 | teardrop path + centre dot | theme or fixed colour |
| Icon sprite sheet | per symbol | `<symbol>` + `<use href="#id">` | single sprite.svg; a game or pixel-art sprite is easel-pixel:pixel |
| CSS background / mask | same as icons | external file or data URI | CSS snippet |
| Loading animation | 0 0 24 24 | CSS `@keyframes` or stroke-dash | inline SVG; motion code in the user's own components is easel-motion:ui-motion |
| Hover interaction | any | CSS `:hover` on fill/stroke/transform | inline + style (the same split) |
| Clip shapes | container-based | `<clipPath>` / `<mask>` | defs reference |
| Shadow / blur | any | `<filter>` feDropShadow / feGaussianBlur | defs reference |
| Pattern texture | small unit | `<pattern>` tile | defs reference |
| React / Vue component | 0 0 24 24 | spread props, camelCase attrs | .tsx / .vue |
| Email inline | minimal | no style, animation or external refs | compact snippet |

**Poor fit for SVG**: photorealism, complex bitmap textures, very detailed illustration. Say so
and suggest a raster image or a simplified style. Lit scenes and characters belong to
easel-illustrate:svg-illustration.

## Workflow

```
- [ ] 1. Pick the scenario and deliverable from the index
- [ ] 2. Set viewBox, style, colours (currentColor vs fixed)
- [ ] 3. Draw: compose shapes -> paths; shared assets in <defs>
- [ ] 4. A11y: decorative aria-hidden / informative role="img" + title (+ desc)
- [ ] 5. Minimize; non-ASCII text -> UTF-8 + XML declaration
- [ ] 6. Write the file; run svg-check
- [ ] 7. Render with the Easel engine, Read the PNG, fix, re-render
```

### Skeleton templates

**Icon only (no text)**:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
</svg>
```

**Non-ASCII text (CJK, Arabic, accented labels)**:

```svg
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 120" role="img" aria-labelledby="title">
  <title id="title">Diagram title</title>
</svg>
```

The declaration is the very first thing in the file (nothing before it, not even a blank line).
CJK, Arabic and other non-Latin text has no glyph in the bundled faces: see drawing rule 9.

**Full-width decor (waves, etc.)**:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
</svg>
```

### Drawing rules

1. **viewBox defines logical coordinates**; display size via CSS `width`/`height`
2. **Monochrome UI assets** default to `currentColor`
3. **Outline icons**: `stroke-width="2"` `stroke-linecap="round"` `stroke-linejoin="round"`
4. **Shared defs**: gradients, arrows, patterns, filters in `<defs>`; short unique `id`s
5. **Charts**: compute margins, plot area and scale first and write them in a comment; every
   bar ends on the baseline; summarize the data in title/desc
6. **Animation**: prefer CSS; SMIL only for simple cases; always a reduced-motion path
7. **Flat by default**: gradients and shadows only when needed
8. **Text**: `font-family="Inter"` or another bundled face (Space Grotesk, Newsreader,
   JetBrains Mono, Caveat, STIX Two Text, Noto Sans Math), with a generic fallback
   (`Inter, sans-serif`); no web-font links. Text on a fill needs 4.5:1 contrast. A standalone
   `.svg` file with `<text>` is delivered as the `-embedded.svg` that
   `mcp__plugin_easel-core_easel__embed_fonts` writes (the face inlined), because the user's site
   or tool does not have Easel's bundled fonts; SVG inlined in the user's own page or component uses
   that page's font instead
9. **Other scripts**: the bundled faces are Latin subsets (English and Western European
   accents). Text in another script (Cyrillic, Greek, CJK, Arabic, and letters such as Ł or ő)
   has no glyph in them, embedded or not, so the viewer's own font draws it. Tell the user, and
   choose on purpose: a generic family (`sans-serif`) that looks different per device, or
   outlines (the words drawn as paths) for a short label that must look the same everywhere
10. **Email SVG is never embedded**: `embed_fonts` adds a `<style>`, which mail clients drop and
   `--email` fails. Outline the text, or give it a generic family (`sans-serif`) and accept the
   reader's font; put longer words in the email's HTML, not in the graphic

### Quality checklist

- [ ] `xmlns` + `viewBox`
- [ ] Non-ASCII text -> UTF-8 + XML declaration
- [ ] No empty or unfinished paths, no editor metadata
- [ ] `id`s unique within the file (sprites especially)
- [ ] Charts have a title; decorative icons use aria-hidden
- [ ] Nothing touches or crosses the viewBox edge unless it is meant to bleed
- [ ] File opens and previews on its own (well-formed XML: `&amp;` for "&", numeric references
  such as `&#160;` instead of HTML entities; svg-check fails the rest)

## Check and render

**1. Validate** with Easel's checker (Node built-ins only, nothing else to install):

```
node "${CLAUDE_PLUGIN_ROOT}/tools/svg-check.mjs" ./easel-out/<slug>/
node "${CLAUDE_PLUGIN_ROOT}/tools/svg-check.mjs" ./easel-out/<slug>/badge.svg --email
```

It takes files or folders and fails a file for: XML that does not parse on its own (the engine
draws the SVG inside an HTML page, which forgives these, but the delivered file would show an
XML error instead of the picture): tags that do not close in order, a `<` that is not a
well-formed tag (write `&lt;` in text and in attribute values), a bare `&` (write `&amp;`, as in
`R&amp;D`), an HTML entity such as `&nbsp;` (write the character or `&#160;`), an attribute
given twice or with no quoted value, `--` inside a comment, an XML declaration that is not the
very first thing in the file, a prefix such as `xlink:` with no `xmlns:xlink`. It also fails a
root `<svg>` without `xmlns="http://www.w3.org/2000/svg"`, or without a `viewBox` of four
numbers with a positive width and height; an empty `<path>`; a TODO, FIXME or "placeholder" left
in a comment, or a note-shaped one in the text or an `aria-label` (`TODO:`, FIXME,
`[placeholder]`, lorem ipsum, a label that is only the word; an honest name such as "Todo list"
passes); duplicate ids; `href="#id"` or `url(#id)` pointing at an id that does not exist; no
accessible name (a `<title>` or root `aria-label`) and no root `aria-hidden="true"`; `<script>`,
`on...=` handlers or a `javascript:` link; external `href`/`src`, `@import` or `url(http...)`
(in CDATA styles too) and `<?xml-stylesheet?>`. It warns on non-ASCII text without the
`<?xml ... encoding="UTF-8"?>` declaration (save the file as UTF-8), on editor metadata and on
`<image>` bitmaps. `--email` also fails `<style>`, animation (`<set>` too), filters,
`<foreignObject>`, `<defs>`, gradients and other `#id` references, and warns when the root has
no `width` and `height`. `--json` prints machine-readable results. Fix every FAIL.

**2. Render and look.** An SVG file is wrapped in a page and scaled for you.

- One graphic: `mcp__plugin_easel-core_easel__render_still` with `file`, `width`, `height`
  (and `scale: 2` for crisp detail). `theme: "both"` renders light and dark: the dark render
  paints a dark page background behind the SVG (with `prefers-color-scheme: dark`), as a dark UI
  would, so `currentColor` ink turns light and a fixed dark colour that would vanish on a dark
  page shows up as near-invisible here. Fix it with `currentColor` or a colour that holds on both.
- Icons, favicons, sprites' symbols as single files, any set: `mcp__plugin_easel-core_easel__contact_sheet`
  with `items: [{file}, ...]`, `sizes: [16, 24, 32, 48]`, `themes: ["light", "dark"]`. Look
  for strokes that blur or vanish at 16 px and icons whose weight differs from their siblings.
- CSS animation (spinners, stroke draws, hover-free loops): `mcp__plugin_easel-core_easel__filmstrip`
  with `file` and `times`, or `count` (spread over the CSS animation's length; pass `duration`
  for anything else); `render_still` with `t` for one moment, and
  `reducedMotion: "reduce"` to check the reduced-motion path. The engine seeks CSS animations
  and SMIL (`<animate>`, `<animateTransform>`) alike, so a frame at the same `t` is the same on
  every run: check SMIL with `filmstrip` too (`times`, or `count` with `duration` set to the SMIL
  cycle).
- Charts, badges, diagrams with text: `mcp__plugin_easel-core_easel__qa` with
  `checks: ["text_clipping", "contrast"]` and `fixedFrame: true`.

Read every PNG. Fix what is wrong (misalignment, bars off the baseline, clipped labels, a
stroke too thin at small size) and render again. Deliver only what you have rendered and looked
at; icons usually need 1-2 passes, diagrams and charts 2-3.

Before delivering anything people will see, run `easel-core:critique` on the render with the
**illustration** rubric for drawn graphics (a set of icons, a decoration, any illustration-like
piece: line quality, silhouette at small size, a clean SVG) and the **design** rubric for a
chart, a diagram or a graphic carried by its text (hierarchy, type, contrast); fix blocking
findings and anything below 7. A single utility icon needs only the checks above.

### Deliverables

| Form | Approach |
|------|----------|
| Standalone `.svg` | the project's assets folder, or `./easel-out/<slug>/` |
| Sprite | multiple `<symbol>` in one file; document `<use>` usage |
| React | `export function XIcon(props: SVGProps<SVGSVGElement>)` + spread |
| Vue | `<template><svg ...></svg></template>` |
| CSS background | `background: url(...)` or inline data URI |
| CSS mask | `-webkit-mask: url(...)`; shape needs a solid fill area |
| Inline HTML | raw `<svg>` fragment, no wrapper div (unless asked for) |

## Do not

- Use `<image>` to fake vectors with bitmaps (unless explicitly asked)
- Use image generation for simple vectorizable graphics
- Leave empty paths or TODOs
- Omit the UTF-8 declaration for non-ASCII text
- Add animation, `<style>`, filters or external references to email SVG, or deliver it embedded
- Link web fonts or any external URL; the only URL in an SVG is its namespace
- Write files with shell heredocs; write the file with the Write tool

## References

| Resource | Description |
|----------|-------------|
| [reference/scenarios.md](reference/scenarios.md) | Per-scenario steps |
| [reference/syntax.md](reference/syntax.md) | Path syntax, defs, chart and ring formulas, a11y, frameworks |
| [reference/examples.md](reference/examples.md) | Full code samples |
| `${CLAUDE_PLUGIN_ROOT}/tools/svg-check.mjs` | Batch validation (Node, no dependencies) |
