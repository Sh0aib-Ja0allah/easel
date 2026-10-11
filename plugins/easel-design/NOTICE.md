# Notices for easel-design

easel-design is MIT licensed (see [LICENSE](LICENSE)). It includes material adapted from the
projects below. The notices are kept here so they travel with the installed plugin; the
repository-wide list is `THIRD_PARTY_NOTICES.md` at the root of the Easel repository. Every adapted
file starts with a header naming its source file, the commit and what Easel changed.

## ArnavPuri/designskills (MIT)

The reference files under `skills/*/reference/` (except those listed below) are adapted from
[ArnavPuri/designskills](https://github.com/ArnavPuri/designskills) at commit
`c7873015add8571ca95043febad0d9e6c97ee5c6` (its graphic-design, product-mockup, social-media-graphic,
thumbnail-design, banner-design, poster-design, ad-creative-design, infographic,
presentation-design, ui-design, mobile-ui-design, card-design, dark-mode, dashboard-design,
landing-page-design, hero-section, color-palette, typography, layout-composition, design-system,
brand-identity and icon-design skills), and `tools/palette.mjs` is a Node port of its
`color-palette/scripts/palette.py`. Copyright (c) 2026 Arnav Puri. MIT License (text below).
Easel's changes: code (HTML/CSS/SVG rendered by the Easel engine) is the default output instead of
an image model; scripts replaced by engine tools; the brand file is `.easel/brand.md`; real-brand
style references removed.

## code-katz/claude-illustrate-skill (MIT)

The logo method in `skills/logo/SKILL.md` and `skills/logo/reference/ip-and-licensing.md` are
adapted from [code-katz/claude-illustrate-skill](https://github.com/code-katz/claude-illustrate-skill)
at commit `7189cde8c29c36faf5c7fc8b57bc1b15e5ae4cbd`. Copyright (c) 2026 Will Curran (Code Katz).
MIT License (text below).

## anthropics/skills (Apache-2.0)

`skills/poster/reference/canvas-design.md` (from `skills/canvas-design`) and
`skills/design-system/reference/theme-factory.md` (from `skills/theme-factory` and its theme files)
are adapted from [anthropics/skills](https://github.com/anthropics/skills) at commit
`dbd4588f9e1033efb41dad4bef2f7947c8993d44`. Copyright 2026 Anthropic, PBC. Licensed under the Apache
License, Version 2.0: the text is in [licenses/Apache-2.0.txt](licenses/Apache-2.0.txt). Both files
were modified by Easel and say so in their headers.

## Ideas only (no licence; nothing copied)

The `directions` skill's method (anti-references, structurally different directions, keep or
kill, the blur test) and the brand-identity phases follow ideas from b1rdmania/claude-brand-skills,
which has no licence; they are written in Easel's own words.

## Easel's own

`systems/` (the generic design systems), the skills' `SKILL.md` procedures (except the logo method
above) and `examples/` are Easel's own work under the MIT License.

## The MIT License (text, for each MIT source above)

```
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute,
sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or
substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
