<!-- Easel: adapted from linyaosky/svg-skill @ 2103b92cb47f588a97a6c38aa6c40571fadbd4f8
     (github.com/linyaosky/svg-skill, scenarios.md), MIT License, Copyright (c) 2026 svg-skill contributors;
     see NOTICE.md. Modified by Easel (2026-10-11): render checks through the Easel engine and svg-check.mjs added per scenario; chart steps state the plot area and baseline; logos and icon families routed to easel-design; bundled fonts; email client names made generic; favicons, empty states, game sprites and UI motion code routed to their skills; email text never embedded. -->

# SVG scenario guide

Step by step per scenario. Indexed from [../SKILL.md](../SKILL.md); code in
[examples.md](examples.md); formulas in [syntax.md](syntax.md).

---

## 1. UI icons

**Outline**: `fill="none" stroke="currentColor" stroke-width="2"`; keep about 1 unit of inset
(draw inside 2..22 on a 24 grid) for visual centring.

**Filled**: `fill="currentColor"`, one or a few paths.

**Multi-colour**: each region gets a fixed `fill="#..."`, not currentColor.

Check: 24x24 grid alignment; visual weight matches sibling icons. Render a
`contact_sheet` at `sizes: [16, 24, 32, 48]` on light and dark. A family of 10+ icons with a
shared grid and keyline shapes: use easel-design:icons.

---

## 2. Logo / favicon

**Logo**: 10% safe margin; prefer path outlines over `<text>` that depends on a font. A full
logo (concept, wordmark, lockups, usage) is easel-design:logo.

**Favicon 32x32**: a favicon or app icon for a brand or app (the icon and its export sizes) is
easel-design:logo. Here only an SVG of a mark the user already has: 1-2 shapes at most; avoid
thin strokes (under 2 units); high contrast. Check it on a `contact_sheet` at 16 and 32 on light
and dark.

---

## 3. Simple flat decoration

An empty-state, onboarding or spot illustration is easel-illustrate:svg-illustration (it keeps
them flat when the UI needs flat). Here only small decorations that sit beside UI:

- Flat colour blocks and simple shapes, minimal detail
- Simple objects: an empty box or folder as a trapezoid or path for perspective
- viewBox 100x100 or 200x200

---

## 4. Flowchart / architecture

1. Set the canvas width and node spacing (e.g. 100-unit horizontal step)
2. Define the arrow marker in `<defs>`; lines use `marker-end="url(#arrow)"`
3. Nodes: `<rect rx="6">` + `<text text-anchor="middle" font-family="Inter, sans-serif">`
4. Non-ASCII labels -> XML declaration + UTF-8
5. Complex diagrams: layer with `<g id="layer-nodes">`, `<g id="layer-edges">`

Architecture extras: dashed border = external service; cylinder = database (two ellipses +
rect). Arrows end at the node edge, not inside the box. Run `qa` with
`checks: ["text_clipping", "contrast"]` to catch labels wider than their boxes.

The bundled faces are Latin-first. For CJK, Arabic or other scripts, render and look: if the
glyphs fall back or show boxes, let the host page supply the font or convert text to paths.

---

## 5. Charts

Compute before drawing, and write the result in a comment at the top of the SVG:

1. Margins (e.g. left 50 / right 30 / top 40 / bottom 60) -> plot area
   (`x0..x1`, `yTop..yBase`). The baseline `yBase` is the x-axis line.
2. Scale: `scale = plotHeight / max` (pick a round max at or above the largest value).
3. Every value maps through the scale; nothing is eyeballed.

**Bar chart**: `step = plotWidth / n`; `barWidth = step * 0.6`;
`centre(i) = x0 + step * (i + 0.5)`; `x = centre - barWidth / 2`; `height = value * scale`;
`y = yBase - height`. So `y + height = yBase` for every bar. Category labels at `centre(i)`
below the baseline; value labels at `centre(i)`, a few units above `y`.

**Line chart**: data -> `M x y L x y ...`; optional `<circle>` data points; y from the same
scale and baseline.

**Pie/donut**: `A` arc commands, or `stroke-dasharray` on a circle; start at 12 o'clock;
donut = outer arc + inner arc closed.

Required: `role="img"` + `<title>` summarizing the data; repeat key values in `<desc>`. Label
text at 4.5:1 contrast or better on its background. Keep a margin: no label touches the viewBox
edge. Check with `qa` (`checks: ["text_clipping", "contrast"]`, `fixedFrame: true`). Charts
built into a data infographic: easel-design:infographic.

---

## 6. Progress ring / bar

**Ring**: background circle `stroke="currentColor" stroke-opacity="0.18"` (a fixed light grey
track disappears against a light progress arc on dark pages; check with `theme: "both"`);
progress circle, same radius,
`stroke-dasharray="C"` with `C = 2 * pi * r`, `stroke-dashoffset = C * (1 - p)` for progress
`p`; `transform="rotate(-90 cx cy)"` to start at the top. With `stroke-linecap="round"` the
caps add half a stroke width at each end, so the arc reads slightly longer than `p`.

**Bar**: background rect + foreground rect, width `percent%` of the track.

Animate: CSS transition on `stroke-dashoffset` or `width`. Check frames with `filmstrip`.

---

## 7. Avatar fallback

- Circle base: `circle`, or a `clipPath` circle around a photo
- Letter: `<text dominant-baseline="central" text-anchor="middle">` with a single character
- Generic person: head circle + shoulder arc path

`fill="currentColor"`, or a background at `opacity="0.15"` with a darker symbol.

---

## 8. Wave divider / decor strip

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
  <path d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z" fill="currentColor"/>
</svg>
```

CSS: `width:100%; height:80px; display:block;`. `preserveAspectRatio="none"` spans the full
width. Render it at a wide and a narrow size (e.g. 1440x96 and 390x64) to see the stretch.

---

## 9. Map pin

Teardrop path, or triangle + base circle; small centre dot. Usually 24x24, point facing down.

---

## 10. Sprite icon sheet

```svg
<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">
  <symbol id="icon-home" viewBox="0 0 24 24">...</symbol>
  <symbol id="icon-user" viewBox="0 0 24 24">...</symbol>
</svg>
```

Usage: `<svg><use href="#icon-home" width="24" height="24"/></svg>` (same page) or an
external sprite with `<use href="sprite.svg#icon-home">`.

This is an icon sprite sheet; a game or pixel-art sprite (a character, its frames, a tileset)
is easel-pixel:pixel. Each symbol uses currentColor inside; ids unique across the page.
**Never preview a sprite file directly**: its root is `display:none`. To check it, write each
symbol out as its own small SVG (or an HTML page with one `<use>` per symbol) and render a
`contact_sheet`.

---

## 11. CSS background and mask

**Background**:

```css
.icon-home {
  width: 24px; height: 24px;
  background: url('/assets/icons/home.svg') center/contain no-repeat;
}
```

**Mask** (recolour a single shape):

```css
.icon {
  width: 24px; height: 24px;
  background: var(--accent);
  -webkit-mask: url('/assets/icons/home.svg') center/contain no-repeat;
  mask: url('/assets/icons/home.svg') center/contain no-repeat;
}
```

The mask source needs a visible fill area. Use explicit fill colours in a mask SVG, not
currentColor (an SVG used as an image does not inherit `color`).

---

## 12. Animation

| Type | Approach |
|------|----------|
| Spin loader | CSS `@keyframes spin` on a `<g>` |
| Stroke draw | `stroke-dasharray` = path length (or `pathLength="1"`); animate the offset |
| Pulse | CSS `opacity` / `scale` alternate |
| Hover | CSS `svg:hover .part { fill: ... }` |

Always add a reduced-motion path:

```css
@media (prefers-reduced-motion: reduce) { .spinner { animation: none; } }
```

Check with `filmstrip` (`count: 6`) and with `render_still` `reducedMotion: "reduce"`; the
engine seeks SMIL too, so check it the same way (`times`, or `count` with `duration`). No
animation in email. A loader or hover effect written as motion code in the user's own components
(transitions, GSAP, their framework) is easel-motion:ui-motion; here the SVG asset.

---

## 13. Clip / mask / filter

**Rounded avatar clip**:

```svg
<defs>
  <clipPath id="round"><circle cx="20" cy="20" r="20"/></clipPath>
</defs>
<g clip-path="url(#round)"><!-- content --></g>
```

**Drop shadow**: `<filter id="s"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity=".2"/></filter>`

**Pattern**: `<pattern id="p" width="8" height="8" patternUnits="userSpaceOnUse">...</pattern>`

A filter is clipped to its region (default 10% around the shape); widen `x`, `y`, `width`,
`height` on the `<filter>` when a soft shadow looks cut off in the render.

---

## 14. React / Vue / Svelte

**React**: `strokeWidth`, `strokeLinecap` in camelCase; `{...props}` last; `aria-hidden` for
decorative icons.

**Vue 3**: same attribute rules as plain SVG; dynamic colour via `:fill="color"`.

**Svelte**: standard SVG attributes; `class`, not `className`.

To check a component, write the same markup as a plain `.svg` file and render it.

---

## 15. Email inline

- Inline presentation attributes only; no `<style>` and no animation
- Set `width` and `height` on the root
- Simplify paths; avoid `<defs>` references (several desktop mail clients drop them)
- Many clients block SVG entirely: offer a PNG fallback rendered with `render_still`
- Text: never deliver it through `embed_fonts` (its `<style>` is dropped by mail clients and fails
  `--email`). Outline a short label (draw it as paths), or give `<text>` a generic family
  (`font-family="sans-serif"`) and accept the reader's font; longer words go in the email's HTML

Validate with `svg-check.mjs <file> --email`.

---

## 16. Responsive

| Need | Setting |
|------|---------|
| Scale proportionally, centred | default `preserveAspectRatio="xMidYMid meet"` |
| Fill the container | `preserveAspectRatio="none"` |
| Max width | CSS `max-width:100%; height:auto` |
| Icon follows font size | `width:1em; height:1em` |

---

## 17. Inline SVG vs `<img>`

| Need | Use |
|------|-----|
| currentColor / CSS theme | **inline SVG** in HTML |
| Static asset, no theming | `<img src="icon.svg">` or CSS background |
| Sprite symbols | inline `<use href="#id">` |
| Wave with currentColor | inline SVG, not `<img>` |
