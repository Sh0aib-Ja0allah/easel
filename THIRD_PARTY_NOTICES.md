# Third-party notices

Easel's own code and documentation are MIT licensed (see [LICENSE](LICENSE)). Some files are
adapted from other open-source projects, and some assets are bundled under their own licenses.
This file lists them with the exact upstream commit each was taken from. Files adapted from
Apache-2.0 sources carry a "Modified by Easel" header; the Apache License 2.0 text is in
[licenses/Apache-2.0.txt](licenses/Apache-2.0.txt).

> Status: covers everything shipped up to `easel-core` v0.1.0, plus easel-motion's animate kit
> (T2.1). Completed for v1.0.0 in task T5.1.

## Apache-2.0 sources (adapted)

### nexu-io/open-design

- Repository: https://github.com/nexu-io/open-design @ `17e255959703a3fad7c8eb7f7b70dcafccc5629a`
- Copyright 2026 Open Design contributors. Licensed under the Apache License, Version 2.0. No
  NOTICE file exists upstream at this commit.
- Adapted (rewritten and modified by Easel): `plugins/easel-core/craft/anti-generic.md`,
  `typography.md`, `colour.md`, `accessibility.md`, `motion.md`, from open-design's `craft/`
  rulebooks. The `.easel/brand.md` section layout follows open-design's `DESIGN.md` format.

## MIT sources

The MIT License applies to each source below; its text is reproduced once at the end of this file.

| Source | Copyright | Used for | Upstream commit |
|---|---|---|---|
| [referodesign/refero_skill](https://github.com/referodesign/refero_skill) | Copyright (c) 2026 Refero | Reached through open-design's craft rulebooks, which adapt it | `a9b54a3e62a6391f5f5ab7a20e4ddb32fb79a27d` |
| [alchaincyf/huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion) | Copyright (c) 2026 alchaincyf (花叔 · 花生) | Ideas for the film gates in `qa` (blue-purple share, still stretches) and the motion rulebook; easel-motion's nine explainer grammars (`grammars/`) and ten style recipes (`recipes/`), translated into English and renamed (headers in each file). **Excluded:** character assets and rig, the Mario/Nintendo showcase, the Clawd fan work | `9ff59339f934e08483ba0a5b1db20f4c2c421b35` |
| [ArnavPuri/designskills](https://github.com/ArnavPuri/designskills) | Copyright (c) 2026 Arnav Puri | Critique procedure ideas in the rubrics and the critique skill | `c7873015add8571ca95043febad0d9e6c97ee5c6` |
| [Vincentwei1021/mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15) | Copyright (c) 2026 Vincentwei1021 | Rubric ideas (independent jury, calibrated scale); the `renderAt(t)` contract and cue sheet ideas | `49052d80bfaf9fa8412cc9710530e5e95a3b8d8c` |
| [with-pebbly/aseprite-ai-artist](https://github.com/with-pebbly/aseprite-ai-artist) | Copyright (c) 2026 with-pebbly | Critic agent ideas (cold read, read-only critic) | `f51fe6908223ef9ac476de1568234c699594722d` |
| [cth9191/animate](https://github.com/cth9191/animate) | Copyright (c) 2026 cth9191 | The three check-ins in the brief skill; easel-motion's animate kit (`kit/`), seven styles, templates, story grammars and `tools/build.mjs` (headers in each file, list in `plugins/easel-motion/NOTICE.md`); the `renderFrame(t)` page contract the engine reads; easel-core's `canvas_text` check, `measure_image`, `compare_images` and the `audio_score` synth; the style-match procedure | `7e5eb56feb2dd573f890e1b7b34748af43d58263` |

## Ideas only (no license; nothing copied)

- [b1rdmania/claude-brand-skills](https://github.com/b1rdmania/claude-brand-skills): the
  anti-average method (structurally different directions, keep or kill, anti-references, blur
  test), re-expressed in Easel's own words.
- [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) (Apache-2.0): Easel's
  renderer reads the same composition format (`data-composition-id`, `data-start`,
  `data-duration`, `window.__timelines`); no HyperFrames code is included.

## Bundled fonts (SIL Open Font License 1.1)

Latin subsets from Fontsource 5.3.0, in `plugins/easel-core/fonts/` with each family's license:

| Family | Copyright | License file |
|---|---|---|
| Inter | Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) | `fonts/inter/OFL.txt` |
| Newsreader | Copyright 2020 The Newsreader Project Authors (https://github.com/productiontype/Newsreader) | `fonts/newsreader/OFL.txt` |
| JetBrains Mono | Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono) | `fonts/jetbrains-mono/OFL.txt` |
| Space Grotesk | Copyright 2020 The Space Grotesk Project Authors (https://github.com/floriankarsten/space-grotesk) | `fonts/space-grotesk/OFL.txt` |
| Caveat | Copyright 2014 The Caveat Project Authors (https://github.com/googlefonts/caveat) | `fonts/caveat/OFL.txt` |
| STIX Two Text | Copyright 2001-2021 The STIX Fonts Project Authors (https://github.com/stipub/stixfonts) | `fonts/stix-two-text/OFL.txt` |
| Noto Sans Math | Copyright 2022 Google LLC | `fonts/noto-sans-math/OFL.txt` |

## Installed at run time, not redistributed

`doctor` installs these from npm into the user's plugin data folder: `playwright-core` 1.64.0
(Apache-2.0, Microsoft) and its Chromium build, and `gsap` 3.14.2 (GreenSock's Standard License;
see decision D10). Easel does not ship them.

## Trademarks

Aseprite is a trademark of Igara Studio; Easel is not affiliated with Igara Studio. Easel's style
names avoid trademarks and the names of living or protected creators.

## The MIT License (text)

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
