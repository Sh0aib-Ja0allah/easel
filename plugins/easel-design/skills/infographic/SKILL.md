---
name: infographic
description: >-
  Infographics in HTML/SVG: statistics, process flows, timelines, comparisons, charts and
  icon-driven data points, with a colour-coding system and exact numbers set as live text. Rendered
  offline by the Easel engine to PNG (and PDF for print), checked for clipped text and contrast,
  and critiqued.
when_to_use: >-
  The user asks for an infographic, wants data, a process, a timeline or a comparison "explained
  visually", or a chart as a standalone graphic. For a dashboard UI use easel-design:ui-design; for
  an animated data explainer use easel-motion:animate.
argument-hint: "[data or topic] [where it will be shown]"
allowed-tools: mcp__plugin_easel-core_easel__render_still mcp__plugin_easel-core_easel__render_pdf mcp__plugin_easel-core_easel__qa mcp__plugin_easel-core_easel__craft Read Write Edit Glob Grep
---

# Infographic

Numbers stay exact, so they are text and SVG, never a generated image. Work in
`./easel-out/<slug>/`.

Reference: [reference/infographic.md](reference/infographic.md) (types, colour coding, process
flows, comparisons, statistics, timelines, SVG charts, icon data points, layout templates, the
checklist).

## Steps

1. **Brand:** read `.easel/brand.md`; if there is none, run `easel-core:brand` or ask for the
   colours and faces, and say when defaults were used.
2. **Data:** get the numbers and their source from the user (or their file). Never invent data; if
   something is missing, ask or leave a marked placeholder. Note the source line for the graphic.
3. **Type:** pick the infographic type from the reference for what the data says (change over
   time, parts of a whole, ranking, process, comparison). One main point; say it as the title.
4. **Build** in HTML with inline SVG charts drawn from the data (compute positions in a small
   script inside the page so the numbers and the shapes agree). Use the brand faces if the project has their font files, otherwise a bundled face (Inter, Space
   Grotesk, Newsreader, JetBrains Mono, Caveat, STIX Two Text, Noto Sans Math). No CDNs: renders
   are offline. Charts start in their
   final state (a still shows one moment).
5. **Render** with `mcp__plugin_easel-core_easel__render_still` at the delivery size (`scale: 2`); `mcp__plugin_easel-core_easel__render_pdf` for print.
6. **Check** with `mcp__plugin_easel-core_easel__qa` (`checks: ["text_clipping", "contrast"]`); check every number on the
   render against the data.
7. **Critique:** `easel-core:critique` with the **design** rubric; fix what scores below 7.
8. **Deliver** the PNG/PDF, the HTML, the data source line, the qa numbers.
