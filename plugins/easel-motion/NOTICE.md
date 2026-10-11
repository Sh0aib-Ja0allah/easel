# Notices for easel-motion

easel-motion is MIT licensed (see [LICENSE](LICENSE)). It includes material adapted from the
projects below, each under the MIT License; the copyright lines are here and the license text is at
the end of this file, so the notices travel with the installed plugin. The repository-wide list is
`THIRD_PARTY_NOTICES.md` at the root of the Easel repository.

## cth9191/animate (MIT)

The animate kit (`kit/`), seven of the styles (crosshatch, cut-paper, isometric, math, pixel, riso,
sketchbook), the starter templates (`templates/`), the
story grammars (`grammars/formats.md`, `frame.md`, `story.md`), `tools/build.mjs`, the format
table, safe areas and canvas CSS in `tools/new-piece.mjs`, and the pad and sweep lines in the
example scores (`examples/water-cycle/src/score.js`, `examples/style-match/piece/src/score.js`)
are adapted
from [cth9191/animate](https://github.com/cth9191/animate) at commit
`7e5eb56feb2dd573f890e1b7b34748af43d58263` (`plugins/animate/skills/animate/`).

Copyright (c) 2026 cth9191. MIT License (text below). Every adapted `.js`, `.html` and `.md` file starts with a header naming
its upstream path and what Easel changed. The `piece.json` files cannot hold comments; they are
copied unchanged from the same commit and the same paths.

What Easel changed, across the port:

- fonts: system font stacks replaced with the OFL fonts bundled in easel-core;
- `kit/morph.js` and `tools/build.mjs`: styles can mix in one piece (decision D13);
- `kit/score-head.js`: no live preview while the Easel engine renders;
- `templates/piece`: the format also comes from the engine (`window.__easel.aspect`);
- the math hero and the crosshatch/sketchbook crown marks are original designs (decision D15).

Not ported: upstream's `examples/`, its Playwright tools (`export`, `review`, `capture`, ...;
the easel-core engine does that work) and its Python helpers.

## Vincentwei1021/mg-styles-15 (MIT)

The synthwave, liquid, aurora-glass and hud styles are Easel's own code; their looks follow the
signature features described in mg-styles-15's prompts (`prompts/10-synthwave.md`, `07-liquid.md`,
`12-aurora-glass.md`, `22-hud.md`) at commit `49052d80bfaf9fa8412cc9710530e5e95a3b8d8c`.
Copyright (c) 2026 Vincentwei1021, MIT License. No code, media or fonts from that repository are used.

## alchaincyf/huashu-art-motion (MIT)

`grammars/` (nine explainer grammars) and `recipes/` (ten style recipes) are translated and adapted
from huashu-art-motion at commit `9ff59339f934e08483ba0a5b1db20f4c2c421b35`. Copyright (c) 2026
alchaincyf (花叔 · 花生). MIT License. Each file names its source; characters, rig and tooling were
removed, and no grammar describes a character from any channel or brand.

## greensock/gsap-skills (MIT)

`skills/ui-motion/gsap/` holds the eight official GSAP skills from
[greensock/gsap-skills](https://github.com/greensock/gsap-skills) at commit
`aed9cfd3277740755f6bfc1155c7aa645403b760`, text unchanged with a header added. Copyright (c) 2026
GreenSock. MIT License. GSAP itself is not shipped: easel-core's `doctor` installs it at run time,
to render previews, under GreenSock's "standard no-charge" license
(https://gsap.com/standard-license; not an open-source licence; decision D10).

## ArnavPuri/designskills (MIT)

`skills/ui-motion/ui-patterns.md` is adapted from the `motion-design` skill of
[ArnavPuri/designskills](https://github.com/ArnavPuri/designskills) at commit
`c7873015add8571ca95043febad0d9e6c97ee5c6`. Copyright (c) 2026 Arnav Puri. MIT License.

## The MIT License (text, for each source above)

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
