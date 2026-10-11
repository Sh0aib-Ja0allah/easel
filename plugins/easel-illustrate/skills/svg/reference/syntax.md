<!-- Easel: adapted from linyaosky/svg-skill @ 2103b92cb47f588a97a6c38aa6c40571fadbd4f8
     (github.com/linyaosky/svg-skill, reference.md), MIT License, Copyright (c) 2026 svg-skill contributors;
     see NOTICE.md. Modified by Easel (2026-10-11): renamed syntax.md; xmllint replaced by svg-check.mjs; chart math centres bars and pins them to the baseline; contrast and bundled-font notes added; legacy-browser row removed; non-ASCII declaration is a convention (svg-check warns); text delivered with embedded faces. -->

# SVG syntax reference

Indexed from [../SKILL.md](../SKILL.md). Steps per scenario in [scenarios.md](scenarios.md).

## Encoding and text

Standalone files with non-ASCII characters: save as UTF-8, with
`<?xml version="1.0" encoding="UTF-8"?>` as the first line (XML reads a file without it as
UTF-8, so it is a convention for older tools; `svg-check.mjs` warns when it is missing).

Pure icons may omit the XML declaration. Formal logos are made with easel-design:logo. Text that
stays text: `font-family="Inter, sans-serif"` (or Space Grotesk, Newsreader, JetBrains Mono,
Caveat, STIX Two Text, Noto Sans Math, the faces the Easel engine bundles); never a web-font link.
A standalone file with `<text>` is delivered with its face embedded (`embed_fonts`, see
[../SKILL.md](../SKILL.md)), because the user's site does not have the bundled fonts.

## Coordinate system

- Origin top-left; x right, y down
- `viewBox="min-x min-y width height"`
- `preserveAspectRatio`: `xMidYMid meet` (default, proportional) | `none` (stretch to fill)

## Path commands

| Command | Meaning |
|---------|---------|
| M/m L/l H/h V/v | move, line |
| C/c S/s Q/q T/t | Bezier curves |
| A/a | elliptical arc `A rx ry rot large-arc sweep x y` |
| Z/z | close |

Upper case is absolute, lower case relative to the current point. Pie arcs: centre (cx,cy),
start at 12 o'clock, large-arc flag 1 when the slice is over 180 degrees.

## `<defs>` resources

| Element | Purpose |
|---------|---------|
| `linearGradient` / `radialGradient` | gradient fill |
| `pattern` | tiled texture |
| `clipPath` | clipping |
| `mask` | alpha mask |
| `filter` | shadow, blur |
| `symbol` | sprite icon |
| `marker` | line arrows |

Reference: `fill="url(#id)"` `clip-path="url(#id)"` `filter="url(#id)"` `href="#id"` (use)

**id rules**: unique per file; prefix them when several SVGs share one page (inline icons from
two files that both define `#a` collide). svg-check fails duplicate ids and references to ids
that do not exist.

## Chart coordinate math

Compute these first and keep them in a comment at the top of the chart:

```
plotWidth  = viewWidth  - marginLeft - marginRight
plotHeight = viewHeight - marginTop  - marginBottom
baseline   = marginTop + plotHeight            (the x-axis line)
scale      = plotHeight / maxValue             (px per unit; maxValue >= largest value)

step       = plotWidth / n
centre(i)  = marginLeft + step * (i + 0.5)     (category label x)
barW       = step * 0.6
barX(i)    = centre(i) - barW / 2
barH(v)    = v * scale
barY(v)    = baseline - barH(v)                 (so barY + barH = baseline)

x(i)       = centre(i)                          (line chart)
y(v)       = baseline - v * scale
linePath   = values.map((v,i) => `${i===0?'M':'L'} ${x(i)} ${y(v)}`).join(' ')
```

Check one bar by hand before writing the rest: its bottom edge (`y + height`) must equal the
baseline, and two bars' heights must have the same ratio as their values. Rounded bars: use
`rx` only on a path that rounds the top corners, or the bottom corners lift off the axis.

## Progress ring formula

Circumference `C = 2 * pi * r`; progress p (0-1):

- `stroke-dasharray="C"`
- `stroke-dashoffset="C * (1 - p)"`
- `transform="rotate(-90 cx cy)"` to start at the top

Example: r = 9 -> C = 56.55; p = 0.75 -> offset 14.14.

## Outline vs filled icons

| Style | Attributes |
|-------|------------|
| Outline | `fill="none" stroke="currentColor" stroke-width="2"` |
| Filled | `fill="currentColor"` |
| Dual-stroke | thick background path + normal foreground (rare) |

## Optimization

1. Merge paths with the same attributes
2. Reduce transform nesting
3. Round coordinates to 1-2 decimals
4. Icons: presentation attributes; use `<style>` only for animation/hover
5. Remove metadata, comments and unused groups from the delivered file (keep the chart-scale
   comment while working; it is fine to keep it in source)

## Accessibility

| Case | Handling |
|------|----------|
| Decorative icon | `aria-hidden="true"` on the root |
| Meaningful graphic | `role="img"` + `<title>` (or `aria-label` on the root) |
| Chart | `<title>` + `<desc>` with a data summary |
| Icon in a button | `aria-label` on the button, icon `aria-hidden` |
| Text in the graphic | 4.5:1 contrast (3:1 for 24px+ or bold 18.66px+); check with `qa` |

## Framework attribute map

| SVG/HTML | React |
|----------|-------|
| `class` | `className` |
| `stroke-width` | `strokeWidth` |
| `stroke-linecap` | `strokeLinecap` |
| `fill-opacity` | `fillOpacity` |
| `clip-path` | `clipPath` |

```css
.icon { width: 1.25rem; height: 1.25rem; color: var(--text); }
.icon--em { width: 1em; height: 1em; vertical-align: -0.125em; }
```

## Recommended viewBox sizes

| Type | viewBox |
|------|---------|
| UI icon | 24x24 |
| Compact icon | 20x20 |
| Favicon | 32x32 |
| Chart | data-dependent, often 400x300 |
| Full-width wave | 1200x120 |
| Illustration | 100x100 - 200x200 |

## Compatibility notes

| Environment | Notes |
|-------------|-------|
| Current browsers | full support |
| WebKit-based browsers, mask | needs `-webkit-mask` as well as `mask` |
| SVG as `<img>` or CSS background | no scripts, no external resources, CSS animation inside the file still runs, no `currentColor` from the page |
| Email clients | no defs, animation or `<style>`; inline attributes; PNG fallback |
