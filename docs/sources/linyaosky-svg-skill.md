# linyaosky/svg-skill

- **Link:** https://github.com/linyaosky/svg-skill
- **License:** MIT ("Copyright (c) 2026 svg-skill contributors").
- **Status (2026-10-10):** 4 stars, a single commit (2026-06-08).
- **Type:** a bare skill folder (`svg-skill`). It has no plugin manifest.

## What it does

It's a guide to writing production-ready SVG for user interfaces. A table of 17 scenarios gives the right `viewBox`, technique and deliverable for each use, followed by a six-step checklist.

It produces:

- static SVG
- CSS hover and keyframe animations
- React and Vue components
- CSS mask and background snippets
- sprites
- SVG that works in email

Its description tells the agent to prefer SVG over image generation when scaling, theming or CSS control matters.

## Tooling

- **No visual check.** It never turns the SVG into an image to look at it. `validate.sh` only uses grep to check for `xmlns`, `viewBox`, leftover placeholders and editor metadata.
- **Optional XML check.** It runs `xmllint` if that's installed. On Windows it usually isn't, and the check is skipped without warning.
- **Bash-only.** All scripts need a Bash shell.
- **Weak tests.** `run-tests.sh` hardcodes `~/.cursor/...` and only checks that fixture files exist.

## Keep

- **The scenario index** (17 use cases).
- **The integration targets:** React, Vue, email, mask and sprite.
- **The accessibility table.**
- **Practical notes:**
  - the math for progress-ring dashes
  - formulas for chart margins and scales
  - "don't preview sprites through `<img>`"
  - declare UTF-8 when the SVG contains Chinese, Japanese or Korean text

## Gaps

- **Wrong example.** The bar chart in `examples.md` is wrong: the data is 40, 65, 50 and 80, but the bar heights are 160, 185, 145 and 200.
- **Flat style only.** It has no depth on illustration or characters.
- **No visual verification.**

## Proposed use

**adapt.** Use it as the base for the **SVG authoring rules** (the UI and integration side) in the SVG skill, and merge in upbrew's advanced techniques. Fix the bar-chart example.
