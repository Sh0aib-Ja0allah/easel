---
name: svg
description: >-
  Write production-ready SVG source by hand for UI and code: icons (outline, filled,
  multi-colour), favicons, empty-state graphics, flowcharts and architecture diagrams, bar,
  line and donut charts, progress rings, avatars, badges, wave dividers, map pins, sprite
  sheets, CSS backgrounds and masks, loaders and hover effects, React, Vue or Svelte icon
  components, and email-safe inline SVG. Every file is checked with Easel's svg-check and
  rendered through the Easel engine (light and dark, small sizes, animation frames) before it
  is delivered.
when_to_use: >-
  The user asks for an SVG, a vector or inline graphic, an icon or a few icons, a chart or
  diagram as SVG, a sprite, a CSS mask, an animated loader, or an SVG component for their code.
  Routing - for scenes, characters, mascots or spot illustrations with lighting and materials
  use easel-illustrate:svg-illustration; for a logo use easel-design:logo; for a full icon
  family use easel-design:icons; for one idea drawn as a sketch with a mascot use
  easel-illustrate:concept-illustration; for p5.js or algorithmic art use
  easel-illustrate:generative-art; for a data infographic use easel-design:infographic.
argument-hint: "[what to draw] [where it goes: file, React, Vue, CSS, email]"
allowed-tools: mcp__plugin_easel-core_easel__render_still mcp__plugin_easel-core_easel__contact_sheet mcp__plugin_easel-core_easel__filmstrip mcp__plugin_easel-core_easel__qa mcp__plugin_easel-core_easel__embed_fonts Bash(node:*) Read Write Edit Glob Grep mcp__plugin_easel-core_easel__craft
---

<!-- Easel: adapted from linyaosky/svg-skill @ 2103b92cb47f588a97a6c38aa6c40571fadbd4f8
     (github.com/linyaosky/svg-skill, SKILL.md), MIT License, Copyright (c) 2026 svg-skill contributors;
     see NOTICE.md. Modified by Easel (2026-10-11): Easel frontmatter and routing; validate.sh and xmllint replaced by svg-check.mjs and engine renders; render-and-look step added; logos and icon families routed to easel-design; output to ./easel-out/<slug>/; standalone files with text delivered with their bundled faces embedded. -->

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
| Favicon / app icon | 0 0 32 32 | minimal, high contrast | file |
| Illustration / empty state | 0 0 100 100+ | flat shapes | SVG / inline |
| Flowchart / architecture | content-based | marker arrows, grid alignment | UTF-8 file |
| Charts (bar/line/pie) | data-based | coordinates from a computed scale | title + desc |
| Progress ring / bar | 0 0 24 24 or bar | `stroke-dasharray` or rect width | animatable |
| Avatar fallback | 0 0 40 40 | circle + letter / person path | currentColor |
| Badge / label | text-based | rounded rect + text | fixed colours |
| Wave divider | 0 0 1200 120 | Bezier path, `preserveAspectRatio="none"` | full-width |
| Map pin | 0 0 24 24 | teardrop path + centre dot | theme or fixed colour |
| Sprite sheet | per symbol | `<symbol>` + `<use href="#id">` | single sprite.svg |
| CSS background / mask | same as icons | external file or data URI | CSS snippet |
| Loading animation | 0 0 24 24 | CSS `@keyframes` or stroke-dash | inline SVG |
| Hover interaction | any | CSS `:hover` on fill/stroke/transform | inline + style |
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

### Quality checklist

- [ ] `xmlns` + `viewBox`
- [ ] Non-ASCII text -> UTF-8 + XML declaration
- [ ] No empty or unfinished paths, no editor metadata
- [ ] `id`s unique within the file (sprites especially)
- [ ] Charts have a title; decorative icons use aria-hidden
- [ ] Nothing touches or crosses the viewBox edge unless it is meant to bleed
- [ ] File opens and previews on its own

## Check and render

**1. Validate** with Easel's checker (Node built-ins only, nothing else to install):

```
node "${CLAUDE_PLUGIN_ROOT}/tools/svg-check.mjs" ./easel-out/<slug>/
node "${CLAUDE_PLUGIN_ROOT}/tools/svg-check.mjs" ./easel-out/<slug>/badge.svg --email
```

It takes files or folders and fails a file for: tags that do not close in order, or a `<` that
is not a well-formed tag (write `&lt;` in text); a root `<svg>` without
`xmlns="http://www.w3.org/2000/svg"`, or without a `viewBox` of four numbers with a positive width
and height; an empty `<path>`; a TODO, FIXME or "placeholder" left in the text, a comment or an
`aria-label` (ids and classes may say anything); duplicate ids; `href="#id"` or `url(#id)`
pointing at an id that does not exist; no accessible name (a `<title>` or root `aria-label`) and
no root `aria-hidden="true"`; `<script>` or `on...=` handlers; external `href`/`src`,
`@import` or `url(http...)`. It warns on non-ASCII text without the
`<?xml ... encoding="UTF-8"?>` declaration (save the file as UTF-8), on editor metadata and on
`<image>` bitmaps. `--email` also fails `<style>`, animation, filters, `<defs>`, gradients and
other `#id` references, and warns when the root has no `width` and `height`. `--json` prints
machine-readable results. Fix every FAIL.

**2. Render and look.** An SVG file is wrapped in a page and scaled for you.

- One graphic: `mcp__plugin_easel-core_easel__render_still` with `file`, `width`, `height`
  (and `scale: 2` for crisp detail). `theme: "both"` renders light and dark; `currentColor`
  follows the theme (dark ink on light, light ink on dark), so a fixed colour that vanishes on
  dark shows up here.
- Icons, favicons, sprites' symbols as single files, any set: `mcp__plugin_easel-core_easel__contact_sheet`
  with `items: [{file}, ...]`, `sizes: [16, 24, 32, 48]`, `themes: ["light", "dark"]`. Look
  for strokes that blur or vanish at 16 px and icons whose weight differs from their siblings.
- CSS animation (spinners, stroke draws, hover-free loops): `mcp__plugin_easel-core_easel__filmstrip`
  with `file` and `times`, or `count` (spread over the CSS animation's length; pass `duration`
  for anything else); `render_still` with `t` for one moment, and
  `reducedMotion: "reduce"` to check the reduced-motion path. The engine seeks CSS animations;
  SMIL runs on its own clock, so to check SMIL frames write a small HTML page that inlines the
  SVG and defines `window.renderAt = (t) => { svg.pauseAnimations(); svg.setCurrentTime(t); }`.
- Charts, badges, diagrams with text: `mcp__plugin_easel-core_easel__qa` with
  `checks: ["text_clipping", "contrast"]` and `fixedFrame: true`.

Read every PNG. Fix what is wrong (misalignment, bars off the baseline, clipped labels, a
stroke too thin at small size) and render again. Deliver only what you have rendered and looked
at; icons usually need 1-2 passes, diagrams and charts 2-3.

Before delivering anything people will see (an illustration-like graphic, a chart, a set of
icons), run `easel-core:critique` with the **design** rubric on the render; fix blocking findings
and anything below 7. A single utility icon needs only the checks above.

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
- Add animation, `<style>`, filters or external references to email SVG
- Link web fonts or any external URL; the only URL in an SVG is its namespace
- Write files with shell heredocs; write the file with the Write tool

## References

| Resource | Description |
|----------|-------------|
| [reference/scenarios.md](reference/scenarios.md) | Per-scenario steps |
| [reference/syntax.md](reference/syntax.md) | Path syntax, defs, chart and ring formulas, a11y, frameworks |
| [reference/examples.md](reference/examples.md) | Full code samples |
| `${CLAUDE_PLUGIN_ROOT}/tools/svg-check.mjs` | Batch validation (Node, no dependencies) |
