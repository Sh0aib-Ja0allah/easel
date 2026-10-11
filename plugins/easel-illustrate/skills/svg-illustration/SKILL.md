---
name: svg-illustration
description: >-
  Draw rich SVG illustrations by hand and refine them by looking at real renders: scenes and
  landscapes, characters, mascots and animals, spot and empty-state illustrations, lit object
  studies, icon tiles with depth, and patterns and backgrounds. Uses multi-stop gradients,
  five-zone lighting, coloured shadows, filter recipes (shadows, glow, grain, paper, specular
  and diffuse light, glass), material looks (metal, gold, glass, wood, water, stone, fabric),
  layered composition, atmosphere, and CSS or SMIL animation with a reduced-motion path. Every
  draft is rendered through the Easel engine, read and fixed before delivery.
when_to_use: >-
  The user wants an illustration, a scene, a character or mascot, a hero, spot or empty-state
  image for an app, an object with lighting and texture, or an animated illustrative SVG.
  Routing - for icons, UI graphics, charts, diagrams, icon sprite sheets, masks, framework
  components or email-safe SVG use easel-illustrate:svg; for a logo, or a favicon or app icon
  (the icon and its sizes), use easel-design:logo; for a full icon family use
  easel-design:icons; for one idea as a hand-drawn sketch with a mascot use
  easel-illustrate:concept-illustration; for p5.js or algorithmic art use
  easel-illustrate:generative-art; for a data infographic use easel-design:infographic; for
  video use easel-motion:animate.
argument-hint: "[subject] [style or mood] [size]"
allowed-tools: mcp__plugin_easel-core_easel__render_still mcp__plugin_easel-core_easel__contact_sheet mcp__plugin_easel-core_easel__filmstrip mcp__plugin_easel-core_easel__qa mcp__plugin_easel-core_easel__embed_fonts Bash(node:*) Read Write Edit Glob Grep mcp__plugin_easel-core_easel__craft
---

<!-- Easel: adapted from upbrew-tech/svg-creator-skill @ 1eb83d602a992b69a1771c4e0116a9f7de6ffaa2
     (github.com/upbrew-tech/svg-creator-skill, SKILL.md), Apache License 2.0, Copyright 2025 SVG Creator Skill Contributors;
     license text in licenses/Apache-2.0.txt, see NOTICE.md. Modified by Easel (2026-10-11): Easel frontmatter and routing; the svg_loop.py render/finish loop replaced by Easel engine renders and svg-check.mjs; heredocs, fixed paths and present_files removed; animated characters use an inline forward-kinematics script rendered by the engine instead of a React artifact; logos, icons and charts routed to sibling skills; bundled fonts, embedded in delivered files with text; favicons, app icons and empty states routed, the famous-character refusal and the dark render check added. -->

# SVG illustration

## The mandatory loop

Every illustration goes through render-and-look. You cannot deliver an SVG you have not
rendered and looked at.

```
WRITE SVG -> RENDER -> READ PNG -> ASSESS -> FIX -> RENDER -> READ -> ... -> DELIVER
```

**1. Write the SVG** to `./easel-out/<slug>/<name>.svg` with the Write tool (no shell
heredocs). Start from the document structure below.

**2. Render it** with `mcp__plugin_easel-core_easel__render_still`:
`file` (the SVG), `width` and `height` at the viewBox aspect, `scale: 2` for fine detail; the
PNG lands in `./easel-out/<slug>/`. Add `theme: "both"` when the piece uses `currentColor` or
must sit on dark and light pages: the dark render paints a dark page background behind the SVG,
as a dark UI would, so `currentColor` turns light there, and a dark detail that would sink into
a dark page is visibly lost.

**3. Read the PNG.** Actually look at it with the Read tool. Study what you see, not what you
meant to draw.

**4. Assess:**

- Are elements where they should be? Any gaps, overlaps, misalignment?
- Do proportions look right? Does anything touch or fall off the edge by accident?
- Do the colours and gradients work? Is the light coming from one consistent direction?
- Do shadows sit under their objects (contact shadow touching the base)?
- For characters: are body parts connected naturally?

**5. Fix** the SVG (Edit, or rewrite the file) and go back to step 2.

**6. Deliver** when it looks right: run
`node "${CLAUDE_PLUGIN_ROOT}/tools/svg-check.mjs" ./easel-out/<slug>/` and fix every FAIL
(xmlns and viewBox, unique ids, every `url(#id)` defined, an accessible name or
`aria-hidden="true"`, no scripts or external references, UTF-8 declaration for non-ASCII
text, a well-formed file: `&amp;` for "&"), render once more, then hand over the SVG with the PNG
you looked at. Deliver only what you have rendered and seen. For an email, hand over the PNG:
mail clients drop gradients, filters and an embedded font's `<style>` (an email-safe SVG is
easel-illustrate:svg's job).

### Iteration guidelines

- **Simple icons, logos, patterns:** 1-2 passes usually enough
- **Diagrams, infographics:** 2-3 passes
- **Scenes, illustrations:** 3-5 passes
- **Characters, figures, animals:** 5-8 passes, built part by part (torso first, then limbs
  one at a time, rendering after each addition)

To compare variations or check a mascot at small sizes, use
`mcp__plugin_easel-core_easel__contact_sheet` (`items: [{file}, ...]`, `sizes`, `themes`).
If the illustration carries text, run `mcp__plugin_easel-core_easel__qa` with
`checks: ["text_clipping", "contrast"]` and `fixedFrame: true`.

---

## Visual quality techniques

Apply these while building. They work for every kind of illustration.

### Multi-stop gradients (4+ stops)

Two-stop gradients look flat. Use 4-8 stops with hue shifts:

```xml
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1" color-interpolation="linearRGB">
  <stop offset="0%" stop-color="#0f172a"/>
  <stop offset="25%" stop-color="#1e3a5f"/>
  <stop offset="50%" stop-color="#3b82f6"/>
  <stop offset="75%" stop-color="#93c5fd"/>
  <stop offset="90%" stop-color="#fde68a"/>
  <stop offset="100%" stop-color="#f97316"/>
</linearGradient>
```

For spheres: a radial gradient with `fx="0.3" fy="0.3"` (focus offset toward the light).

### Five-zone lighting

Every non-trivial object needs: specular highlight (bright, warm), light area, half-tone (the
true colour), form shadow (a cooler hue, blue or purple, never black), reflected light (a
subtle warm glow on the shadow edge, opacity 0.10-0.20). Plus a contact shadow where it meets
the ground and a softer cast shadow away from the light.

### Coloured shadows

Shadows use dark blue (#1a1a4e), purple (#2d1b4e) or teal (#0d3b4f). Never pure black or grey.

### Drop shadow filter

```xml
<filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"
  color-interpolation-filters="linearRGB">
  <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur"/>
  <feOffset in="blur" dx="3" dy="5" result="offset"/>
  <feFlood flood-color="#1e1b4b" flood-opacity="0.30" result="color"/>
  <feComposite in="color" in2="offset" operator="in" result="shadow"/>
  <feMerge><feMergeNode in="shadow"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
```

### Noise texture (breaks digital perfection)

```xml
<filter id="grain" color-interpolation-filters="linearRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" stitchTiles="stitch"/>
  <feColorMatrix type="saturate" values="0"/>
  <feBlend in="SourceGraphic" mode="soft-light"/>
</filter>
```

Apply at 5-15% opacity on surfaces and backgrounds.

### Critical defaults

- All `<filter>` elements: `color-interpolation-filters="linearRGB"`
- All gradient elements: `color-interpolation="linearRGB"`
- Animated elements: `transform-box: fill-box; transform-origin: center;`
- Text: `font-family="Inter, sans-serif"` or another bundled face (Space Grotesk,
  Newsreader, JetBrains Mono, Caveat, STIX Two Text, Noto Sans Math); no web-font links, no
  external URLs. Deliver a file with `<text>` as the `-embedded.svg` that
  `mcp__plugin_easel-core_easel__embed_fonts` writes: the user's site does not have the bundled
  fonts, so bare `<text>` falls back to a default font there. The bundled faces are Latin only:
  text in another script (Cyrillic, Greek, CJK, Arabic) is drawn by the viewer's own font even
  when embedded, so tell the user, and outline a short label (draw it as paths) when its look
  matters

---

## Category guidance

### Characters, figures, animals

Never recreate a copyrighted or trademarked character (a famous game, film, comic or cartoon
character, or a brand's mascot): offer an original character with the qualities the user wants
instead. The alternative shares the mood or genre, never the character's signature features: no
matching outfit, headwear, facial hair, colour scheme, job or name pun, so it cannot read as the
original. Never name a living artist or studio as a style either: describe the look.

The hardest category. Build in steps with aggressive feedback:

1. Draw the torso -> render -> check
2. Add legs -> render -> check the joins
3. Add arms -> render -> check
4. Add the head -> render -> check
5. Add details -> render -> final check

Use thick `<line>` with `stroke-linecap="round"` for limbs. Add a `<circle>` at every joint,
drawn after the limbs. This gives the most reliable connected look.

For animated characters: write an HTML page with the SVG inline and a small inline script that
computes every joint from its parent (forward kinematics: bone lengths are constants, angles
animate) and defines `window.renderAt = (t) => { ... }`, which the Easel engine calls to seek, plus
`window.__composition = { width, height, duration, fps }` (one cycle) so `count` knows the length.
Check the motion with `mcp__plugin_easel-core_easel__filmstrip` (`file`, `count` or `times`)
and single poses with `render_still` `t`. For a video of the character, use
easel-motion:animate. Details in
[reference/effects-and-motion.md](reference/effects-and-motion.md#13-characters-and-figures).

### Mascots and spot illustrations

A mascot is a character: same build order. Keep a limited palette (3-5 colours plus shadow
and highlight tints), a clear silhouette, and test it at small sizes on a `contact_sheet`. A
mascot used to explain one idea as a sketch: easel-illustrate:concept-illustration.

An empty-state or onboarding illustration sits inside an app's UI: keep it flat and calm (2-4
colours from the app's palette, few or no gradients and filters, no text in the art), size it
for the slot (often 160-240 px wide), and check it on light and dark with `theme: "both"` when
the app has a dark mode.

### Icons with depth and app-icon tiles

Grid-aligned, 2px stroke, `stroke-linecap="round"`, `stroke-linejoin="round"`, `fill="none"`,
`stroke="currentColor"`; stay within the 2-22 range on a 24 grid. A tile with depth (gradient,
shine, shadow) is in the composition reference. Plain UI icons: easel-illustrate:svg; a full
family: easel-design:icons; a favicon or app icon for a brand or app (the icon and its export
sizes): easel-design:logo, which can use a tile painted here as its art.

### Logos and badges

Geometric construction, centred, gradient fills for depth, 2-3 colours at most. Check
legibility at 64px wide. A real logo project (concept, wordmark, lockups): easel-design:logo.

### Scenes and landscapes

Layer back to front: sky -> far elements (desaturated, light) -> mid elements -> foreground
(vivid). Add atmospheric haze (a semi-transparent blue-white rect) between layers. Vignette
last.

### Data visualizations

Compute positions from the data first (plot area, baseline, scale); bars end on the baseline.
Gradient fills on bars or segments, subtle grid lines (#f1f5f9), round caps. Plain charts:
easel-illustrate:svg; infographics: easel-design:infographic.

### Patterns

Small repeating tiles. `<pattern>` with `patternUnits="userSpaceOnUse"`;
`patternTransform="rotate(45)"` for diagonal variants.

---

## Critique before delivery

Run `easel-core:critique` with the **illustration** rubric on the rendered PNG (both themes when
the piece uses `currentColor`). Fix blocking findings and anything below 7, re-render, and
deliver only what you have looked at after the last fix.

## Document structure

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"
     role="img" aria-labelledby="svg-title">
  <title id="svg-title">Descriptive title</title>
  <defs><!-- gradients, filters, clipPaths --></defs>
  <g id="background">...</g>
  <g id="midground">...</g>
  <g id="foreground">...</g>
  <g id="effects">...</g>
</svg>
```

## Advanced reference

- [reference/advanced-techniques.md](reference/advanced-techniques.md) (sections 1-5):
  filter chain cookbook, feTurbulence guide, feComponentTransfer colour grading, material
  simulation, composition templates (layered landscape, lit object study, stylized character).
- [reference/effects-and-motion.md](reference/effects-and-motion.md) (sections 6-13):
  atmosphere, icons and logos with depth, animation (CSS + SMIL, reduced motion, engine
  checks), data visualization, patterns and backgrounds, power features, character
  construction and forward kinematics.
