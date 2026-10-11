---
name: illustrate
description: >-
  Entry point for illustration and drawing with Easel: decides what kind of picture is wanted and
  hands it to the right easel-illustrate skill (svg for UI graphics, icons, charts and diagrams;
  svg-illustration for scenes and characters; concept-illustration for one idea drawn as a sketch
  with a mascot; generative-art for p5.js algorithmic art), or to easel-design (logos, posters)
  and easel-ai-media (photographic or painted rasters, when installed). Vector work is drawn as
  code and checked through the Easel engine, with no API key.
when_to_use: >-
  The user says "draw", "illustrate", "make an illustration", "make a picture of", or asks for a
  graphic without saying what kind. For animation use easel-motion:animate.
argument-hint: "[what to draw] [where it will be used]"
allowed-tools: mcp__plugin_easel-core_easel__render_still Read Glob
---

<!-- Easel: routing by asset class (vector mark, raster illustration, composed layout) before choosing
     a tool follows code-katz/claude-illustrate-skill @ 7189cde8c29c36faf5c7fc8b57bc1b15e5ae4cbd
     (github.com/code-katz/claude-illustrate-skill, SKILL.md "Route first"), MIT License, Copyright (c)
     2026 Will Curran (Code Katz); see NOTICE.md. Modified by Easel (2026-10-11): Easel's skills as the
     routes. -->

# Illustrate

Say which kind of picture this is before choosing how to make it: most requests that sound like
"generate an image" are vector graphics or layouts, and drawing them as code is exact, editable
and free.

| The user wants | Kind | Use |
|---|---|---|
| An icon, a UI graphic, a chart, a diagram, a progress ring, a sprite, an email-safe SVG, a React/Vue SVG component | vector for code | `easel-illustrate:svg` |
| A scene, a character, a mascot, a spot or empty-state illustration, an object study | vector illustration | `easel-illustrate:svg-illustration` |
| One idea, metaphor or process drawn as a quick sketch for an article or a post | concept sketch | `easel-illustrate:concept-illustration` |
| Generative, algorithmic or "code" art, a flow field, particles, an abstract loop | generative | `easel-illustrate:generative-art` |
| A logo, wordmark, favicon or app icon | brand mark | `easel-design:logo` |
| A poster, social graphic or other layout with text | composed layout | `easel-design:design` |
| A photo-like or painted image | raster | `easel-ai-media:image` when installed (the user's own key, a cost estimate first); otherwise say so and offer a vector route |
| Moving pictures with a story | video | `easel-motion:animate` |

Whichever skill makes it, the picture is rendered, looked at and critiqued with
`easel-core:critique` (**illustration** rubric; **design** for UI graphics) before it is called
finished.

If two fit, take the one closest to where the picture will be used and say so in one line. Never
copy a well-known character or another artist's work, and never name a living artist or studio
as a style: describe the look instead.
