# Third-party notices (draft)

> Status: draft · Last updated: 2026-10-11 · Becomes `THIRD_PARTY_NOTICES.md` at the repo root once code is added.
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
| [cth9191/animate](https://github.com/cth9191/animate) | Copyright (c) 2026 cth9191 | Workflow, check-ins, STYLE interface, kits, QA (easel-motion, easel-core) | TBD |
| [Alisa0808/vox-director](https://github.com/Alisa0808/vox-director) | Copyright (c) 2026 Alisa Qian | beats.json, arcs, prompt guide, provider idea, pipeline (easel-ai-media) | TBD |
| [alchaincyf/huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion) | Copyright (c) 2026 alchaincyf (花叔 · 花生) | Art styles, grammars, quality gates, libs; translated (easel-motion). **Excluded:** character assets, Mario/Clawd showcases. | TBD |
| [Vincentwei1021/mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15) | Copyright (c) 2026 Vincentwei1021 | Style recipes, rubric, template, renderAt contract, cue sheet, mgaudio (easel-motion, easel-core) | TBD |
| [with-pebbly/aseprite-ai-artist](https://github.com/with-pebbly/aseprite-ai-artist) | Copyright (c) 2026 with-pebbly | Skill and agent text adapted; MCP package used as a dependency (easel-pixel). Lospec palettes keep their per-author credits. | TBD |
| [ArnavPuri/designskills](https://github.com/ArnavPuri/designskills) | Copyright (c) 2026 Arnav Puri | Design skills, design-context, critique, eval approach (easel-design, easel-core) | TBD |
| [linyaosky/svg-skill](https://github.com/linyaosky/svg-skill) | Copyright (c) 2026 svg-skill contributors | SVG authoring rules (easel-illustrate) | TBD |
| [code-katz/claude-illustrate-skill](https://github.com/code-katz/claude-illustrate-skill) | Copyright (c) 2026 Will Curran (Code Katz) | Logo/icon method, contact sheet, provenance, IP guide (easel-design) | TBD |
| [aishwaryaashok14/peanut-illustrations](https://github.com/aishwaryaashok14/peanut-illustrations) | Copyright (c) 2026 Aishwarya Ashok · **and** Copyright (c) 2026 Ian (portions adapted from [helloianneo/ian-xiaohei-illustrations](https://github.com/helloianneo/ian-xiaohei-illustrations)) | Concept-illustration method (easel-illustrate). Characters and example images are **not** used. Also credits "Peanut Illustrations" per its NOTICE.md request. | TBD |
| [greensock/gsap-skills](https://github.com/greensock/gsap-skills) | Copyright (c) 2026 GreenSock | GSAP skills (easel-motion `ui-motion`) | TBD |

## Apache-2.0 sources

| Source | Copyright / NOTICE | What Easel uses | Upstream SHA |
| --- | --- | --- | --- |
| [upbrew-tech/svg-creator-skill](https://github.com/upbrew-tech/svg-creator-skill) | Copyright 2025 SVG Creator Skill Contributors (no NOTICE file) | Illustration and character craft (easel-illustrate `svg-illustration`) | TBD |
| [nexu-io/open-design](https://github.com/nexu-io/open-design) | Copyright 2026 Open Design contributors (LICENSE appendix) | craft rulebooks, DESIGN.md format, generic design systems. Each skill is checked separately; some have their own MIT/Apache license. | TBD |
| [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | Copyright 2026 HeyGen, Inc. | Render engine dependency, if decision D7 = A. Catalogue thumbnails (© HeyGen) are not used. | TBD |
| [anthropics/skills](https://github.com/anthropics/skills): `algorithmic-art`, `canvas-design`, `slack-gif-creator`, `theme-factory` | Copyright 2026 Anthropic, PBC. | Generative art, poster/art prints, GIF export, themes | TBD |

## To trace before use

These skills come from open-design. Traced 2026-10-11 (D21); all three deferred to v2:

- `shader-dev`: MiniMax-AI/skills (MIT) @ `60aaae52bb2af8162732751a4332f62a5fef518b`
- `hand-drawn-diagrams`: muthuishere/hand-drawn-diagrams (licence not identified by GitHub) @ `c8ffd6c3febbc0e745ab6691ea81c8703a9829c8`
- `threejs`: CloudAI-X/threejs-skills (no licence) @ `b1c623076c661fc9b03dac19292e825a5d106823`
- `emil-design-eng` and `review-animations` (believed to be MIT, Matt Pocock; confirm)
- `brandkit` (believed to be MIT, Leonxlnx; confirm)
- the slide skills

## Inspiration only (no license, nothing copied)

- [b1rdmania/claude-brand-skills](https://github.com/b1rdmania/claude-brand-skills): brand phases, the anti-average layout method, brand kit structure.
- [VicUgochukwu/brand-design-skill](https://github.com/VicUgochukwu/brand-design-skill): LinkedIn format and readability rules.

## Assets

| Asset | License | Source |
| --- | --- | --- |
| Fonts | OFL (Google Fonts); list each family when it's bundled | TBD |
| Paintings used in style references | CC0 (The Met Open Access), if any are bundled | TBD |
| Instrument samples (if mgaudio is ported) | CC0 (VCSL) | TBD |

## Trademarks

- Aseprite is a trademark of Igara Studio. Easel is not affiliated with Igara Studio.
- Style names avoid trademarks and the names of living or protected creators. See [findings-and-decisions.md](findings-and-decisions.md) §1.5.
