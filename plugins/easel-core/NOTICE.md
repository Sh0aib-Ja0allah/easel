# Notices for easel-core

easel-core is MIT licensed (see [LICENSE](LICENSE)). It includes material adapted from the projects
below and bundles fonts under their own licenses. The notices are kept here so they travel with
the installed plugin; the repository-wide list is `THIRD_PARTY_NOTICES.md` at the root of the
Easel repository.

## nexu-io/open-design (Apache-2.0)

`craft/anti-generic.md`, `typography.md`, `colour.md`, `accessibility.md` and `motion.md` are
adapted (rewritten and modified by Easel; each file says so in its header) from open-design's
`craft/` rulebooks at commit `17e255959703a3fad7c8eb7f7b70dcafccc5629a`. Copyright 2026 Open Design
contributors. Licensed under the Apache License, Version 2.0: the text is in
[licenses/Apache-2.0.txt](licenses/Apache-2.0.txt). No NOTICE file exists upstream at this commit.
The `.easel/brand.md` section layout follows open-design's `DESIGN.md` format.

## MIT sources

| Source | Copyright | Used in easel-core | Upstream commit |
|---|---|---|---|
| referodesign/refero_skill | Copyright (c) 2026 Refero | reached through open-design's craft rulebooks, which adapt it | `a9b54a3e62a6391f5f5ab7a20e4ddb32fb79a27d` |
| alchaincyf/huashu-art-motion | Copyright (c) 2026 alchaincyf | ideas for the film gates in `qa` and the motion rulebook | `9ff59339f934e08483ba0a5b1db20f4c2c421b35` |
| ArnavPuri/designskills | Copyright (c) 2026 Arnav Puri | critique procedure ideas in the rubrics and the critique skill | `c7873015add8571ca95043febad0d9e6c97ee5c6` |
| Vincentwei1021/mg-styles-15 | Copyright (c) 2026 Vincentwei1021 | rubric ideas; the `renderAt(t)` contract and cue sheet ideas | `49052d80bfaf9fa8412cc9710530e5e95a3b8d8c` |
| with-pebbly/aseprite-ai-artist | Copyright (c) 2026 with-pebbly | critic agent ideas | `f51fe6908223ef9ac476de1568234c699594722d` |
| cth9191/animate | Copyright (c) 2026 cth9191 | the `renderFrame(t)` page contract; `engine/lib/canvastext.mjs` (canvas_text, beat_grid), `refs.mjs` (measure_image, compare_images) and the `audio_score` synth in `score.mjs`; the brief skill's check-ins | `7e5eb56feb2dd573f890e1b7b34748af43d58263` |

## Bundled fonts (SIL Open Font License 1.1)

Inter, Newsreader, JetBrains Mono, Space Grotesk, Caveat, STIX Two Text and Noto Sans Math, in
`fonts/`, each folder with its `OFL.txt` and copyright line (see `fonts/README.md`).

## Installed at run time, not redistributed

`doctor` installs `playwright-core` (Apache-2.0, Microsoft) with its Chromium build, and `gsap`
(GreenSock's Standard License, decision D10), into the user's plugin data folder.

## Trademarks

Aseprite is a trademark of Igara Studio; Easel is not affiliated with Igara Studio.

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
