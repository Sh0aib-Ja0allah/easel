# Third-party notices (draft)

> Status: working notes, superseded by the root [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) (completed in T5.1) · Last updated: 2026-10-11
>
> Copyright lines were copied from each source's LICENSE file on 2026-10-11. Re-check each one when its content is actually ported, and add the exact upstream commit SHA we ported from.

## Rules

- **MIT:** keep the copyright line and the full MIT permission notice for every source we copy or adapt.
- **Apache-2.0:**
  - ship the Apache-2.0 license text (`licenses/Apache-2.0.txt`)
  - keep the copyright and NOTICE lines
  - put a prominent "Modified by Easel" note at the top of every changed file (§4b)
  - list each source here
- **Ideas only** (sources with no license): no text is copied. We credit them as inspiration in the README, but there's nothing to reproduce here.
- **Per-asset licenses:** list fonts, textures and samples separately at the bottom.

## MIT sources

| Source | Copyright line | What Easel uses | Upstream SHA |
| --- | --- | --- | --- |
| [cth9191/animate](https://github.com/cth9191/animate) | Copyright (c) 2026 cth9191 | Workflow, check-ins, STYLE interface, kits, QA (easel-motion, easel-core) | `7e5eb56feb2dd573f890e1b7b34748af43d58263` |
| [Alisa0808/vox-director](https://github.com/Alisa0808/vox-director) | Copyright (c) 2026 Alisa Qian | beats.json, arcs, prompt guide, provider idea, pipeline (easel-ai-media) | `6a85a7c341610442a6a5b1885e6e0217ab82a11f` |
| [alchaincyf/huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion) | Copyright (c) 2026 alchaincyf (花叔 · 花生) | Art styles, grammars, quality gates, libs; translated (easel-motion). **Excluded:** character assets, Mario/Clawd showcases. | `9ff59339f934e08483ba0a5b1db20f4c2c421b35` |
| [Vincentwei1021/mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15) | Copyright (c) 2026 Vincentwei1021 | Style recipes, rubric, template, renderAt contract, cue sheet, mgaudio (easel-motion, easel-core) | `49052d80bfaf9fa8412cc9710530e5e95a3b8d8c` |
| [with-pebbly/aseprite-ai-artist](https://github.com/with-pebbly/aseprite-ai-artist) | Copyright (c) 2026 with-pebbly | Skill and agent text adapted; MCP package used as a dependency (easel-pixel). Lospec palettes keep their per-author credits. | `f51fe6908223ef9ac476de1568234c699594722d` |
| [ArnavPuri/designskills](https://github.com/ArnavPuri/designskills) | Copyright (c) 2026 Arnav Puri | Design skills, design-context, critique, eval approach (easel-design, easel-core) | `c7873015add8571ca95043febad0d9e6c97ee5c6` |
| [linyaosky/svg-skill](https://github.com/linyaosky/svg-skill) | Copyright (c) 2026 svg-skill contributors | SVG authoring rules (easel-illustrate) | `2103b92cb47f588a97a6c38aa6c40571fadbd4f8` |
| [code-katz/claude-illustrate-skill](https://github.com/code-katz/claude-illustrate-skill) | Copyright (c) 2026 Will Curran (Code Katz) | Logo/icon method, contact sheet, provenance, IP guide (easel-design) | `7189cde8c29c36faf5c7fc8b57bc1b15e5ae4cbd` |
| [aishwaryaashok14/peanut-illustrations](https://github.com/aishwaryaashok14/peanut-illustrations) | Copyright (c) 2026 Aishwarya Ashok · **and** Copyright (c) 2026 Ian (portions adapted from [helloianneo/ian-xiaohei-illustrations](https://github.com/helloianneo/ian-xiaohei-illustrations)) | Concept-illustration method (easel-illustrate). Characters and example images are **not** used. Also credits "Peanut Illustrations" per its NOTICE.md request. | `1e5c645892a2d70242062f23ee2277b18240e05c` |
| [greensock/gsap-skills](https://github.com/greensock/gsap-skills) | Copyright (c) 2026 GreenSock | GSAP skills (easel-motion `ui-motion`) | `aed9cfd3277740755f6bfc1155c7aa645403b760` |

## Apache-2.0 sources

| Source | Copyright / NOTICE | What Easel uses | Upstream SHA |
| --- | --- | --- | --- |
| [upbrew-tech/svg-creator-skill](https://github.com/upbrew-tech/svg-creator-skill) | Copyright 2025 SVG Creator Skill Contributors (no NOTICE file) | Illustration and character craft (easel-illustrate `svg-illustration`) | `1eb83d602a992b69a1771c4e0116a9f7de6ffaa2` |
| [nexu-io/open-design](https://github.com/nexu-io/open-design) | Copyright 2026 Open Design contributors (LICENSE appendix) | craft rulebooks, DESIGN.md format, generic design systems. Each skill is checked separately; some have their own MIT/Apache license. | `17e255959703a3fad7c8eb7f7b70dcafccc5629a` |
| [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | Copyright 2026 HeyGen, Inc. | Not a dependency: Easel's renderer reads the same composition format; no HyperFrames code is included (see THIRD_PARTY_NOTICES.md, "Ideas only"). Catalogue thumbnails (© HeyGen) are not used. | n/a |
| [anthropics/skills](https://github.com/anthropics/skills): `algorithmic-art`, `canvas-design`, `slack-gif-creator`, `theme-factory` | Copyright 2026 Anthropic, PBC. | Generative art, poster/art prints, GIF export, themes | `dbd4588f9e1033efb41dad4bef2f7947c8993d44` |

## To trace before use

These skills come from open-design. Traced 2026-10-11 (D21); all three deferred to v2:

- `shader-dev`: MiniMax-AI/skills (MIT) @ `60aaae52bb2af8162732751a4332f62a5fef518b`
- `hand-drawn-diagrams`: muthuishere/hand-drawn-diagrams (MIT, Copyright (c) 2025 Muthukumaran Navaneethakrishnan; GitHub shows NOASSERTION because the LICENSE file also lists the Excalidraw and excalidraw-animate notices; corrected 2026-10-11 after the v1.0.0 QA) @ `c8ffd6c3febbc0e745ab6691ea81c8703a9829c8`
- `threejs`: CloudAI-X/threejs-skills (no licence) @ `b1c623076c661fc9b03dac19292e825a5d106823`
- `emil-design-eng` and `review-animations` (believed to be MIT, Matt Pocock; confirm), `brandkit` (believed to be MIT, Leonxlnx; confirm) and the slide skills: not used in v1.0.0 (only open-design's own craft rulebooks were taken), so not traced; trace them before any use.

## Inspiration only (no license, nothing copied)

- [b1rdmania/claude-brand-skills](https://github.com/b1rdmania/claude-brand-skills): brand phases, the anti-average layout method, brand kit structure.
- [VicUgochukwu/brand-design-skill](https://github.com/VicUgochukwu/brand-design-skill): LinkedIn format and readability rules.

## Assets

| Asset | License | Source |
| --- | --- | --- |
| Fonts | OFL 1.1 | Fontsource 5.3.0 Latin subsets, each family listed with its license in THIRD_PARTY_NOTICES.md |
| Paintings used in style references | CC0 (The Met Open Access), if any are bundled | none bundled |
| Instrument samples (if mgaudio is ported) | CC0 (VCSL) | not ported (D16: the score is synthesized) |

## Trademarks

- Aseprite is a trademark of Igara Studio. Easel is not affiliated with Igara Studio.
- Style names avoid trademarks and the names of living or protected creators. See [findings-and-decisions.md](findings-and-decisions.md) §1.5.
