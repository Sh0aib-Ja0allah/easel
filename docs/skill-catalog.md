# Skill catalog

> Status: draft · Last updated: 2026-10-11 · Inputs: [sources.md](sources.md), [findings-and-decisions.md](findings-and-decisions.md)

This is the planned list of skills, agents and shared libraries for each Easel plugin. Each row names its sources: what we adapt and where it comes from. **v1** marks what ships first; **v2** comes later.

## How to read the tables

- **Skill:** the folder name, invoked as `/easel-<plugin>:<skill>`.
- **Triggers on:** the requests the skill's `description` should catch. Each description also says which skill to use instead for nearby requests. This "use X instead of Y" routing comes from designskills.
- **Sources:** the source repos (numbers as in [sources.md](sources.md)), plus upstream repos picked up during review:
  - **A** = [anthropics/skills](https://github.com/anthropics/skills), Apache-2.0
  - **G** = [greensock/gsap-skills](https://github.com/greensock/gsap-skills), MIT
  - **H** = [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes), Apache-2.0
- **Ideas only:** when sources #10 or #11 appear, only their ideas are used, rewritten in our own words, because those repos have no license.

## Design rules for the catalog

1. **Fewer, broader skills.** Merge near-duplicates (designskills' social, thumbnail and banner skills become one skill) so triggering stays reliable. Use reference files inside a skill for depth, not more skills.
2. **One entry skill per plugin** routes to the rest, as aseprite's `studio` does.
3. **Styles, grammars, design systems and rubrics are data, not skills.** They live as files that skills read. That lets the catalog grow without adding trigger collisions.
4. **Every skill that produces visual output ends with render → look → critique** through `easel-core`.

---

## easel-core

Shared foundation. The other plugins assume it's installed (see [architecture.md](architecture.md) §3).

| Skill | Triggers on | What it does | Sources | v |
| --- | --- | --- | --- | --- |
| `setup` | "set up easel", "easel doctor", render errors | Checks Node, Playwright Chromium and ffmpeg, plus optional tools (Aseprite, API keys). Gives Windows-specific install steps. | 5 (`doctor`), 1 | v1 |
| `brief` | Start of any multi-step creative job (video, brand, campaign) | Asks the intake questions, then runs the three cheap check-ins: **story** → **look** → **storyboard**. Writes `brief.json` and `beats.json` before anything expensive is made. | 1, 2, 3 | v1 |
| `brand` | "use my brand", "set up brand", "what are our colours" | Finds or creates the shared brand file `.easel/brand.md` (DESIGN.md format), reading it from Tailwind/CSS variables/DTCG tokens/Figma or asking the user. Every other skill reads it. | 6 (`design-context`), 13 (`DESIGN.md`), 10 (ideas only) | v1 |
| `critique` | "review this", "what's wrong with", after any render | Runs the critic over rendered output with a domain rubric (design, motion, illustration, pixel). Findings cite evidence and have a severity; scores have caps. Re-renders to verify fixes. | 6 (`design-critique`), 4 (`rubric.md`), 3 (film gate), 5 (`pixel-critic`) | v1 |
| `score` | "add music", "sound effects", "sync to beat", "voice-over timing" | Synthesizes music and SFX, maps beats to a user track, and times words for voice-over. | 4 (`mgaudio`), 1, 3 | v1 |

**Agent:** `critic` (read-only; opus). Does blind A/B comparisons of fixes. Sources: 5 (`pixel-critic`), 3 (independent review agent).

**Shared libraries** (data, not skills):

- **`craft/` rulebooks:** anti-generic ("AI slop"), typography, colour and contrast, accessibility, motion timing. Sources: 13 (`craft/`), 3 (AI-look colour ban), 10 (anti-average method, ideas only).
- **`rubrics/`:** design, motion, illustration, pixel, social. Sources: 6, 4, 3, 5.
- **Render engine and provider layer:** see [architecture.md](architecture.md).

## easel-motion

Code-drawn animation and video, plus UI motion.

| Skill | Triggers on | What it does | Sources | v |
| --- | --- | --- | --- | --- |
| `animate` (entry) | "animate", "make a video/explainer/reel/short", "motion graphics" | End-to-end procedural video: `brief` → pick a style and grammar → build scenes → render → critique → deliver MP4 in every aspect ratio. | 1 (base), 3, 4, H | v1 |
| `style-match` | "make it look like this", reference images or video | Breaks down the references and creates a new style file (`STYLE.md` + kit), then compares it side by side against the references. | 1 (`new-style.md`), 3 (`analyze/breakdown.py`) | v1 |
| `ui-motion` | "animate this button/page", "scroll animation", "micro-interaction", GSAP | Product and web UI motion: GSAP timelines, ScrollTrigger, CSS transitions, and review of motion quality. | G (gsap-*), 6 (`motion-design`), 13 (emil-design-eng, review-animations: check licenses) | v1 |
| `kinetic-type` | "animated text", "lyric video", "title sequence" | Typography-led motion. | 3 (y5 grammar), 4 (08 morph, 18 captions) | v2 |
| `export-gif` | "make a GIF", "sticker", "Slack emoji" | Short loops, with file-size limits for each platform. | A (`slack-gif-creator`) | v2 |

**Styles library** (`styles/<id>/STYLE.md` + `kit.js`). The three sources are merged, duplicates are dropped, and styles named after creators get descriptive names:

| Group | Styles | Sources |
| --- | --- | --- |
| Print and paper | cut-paper, risograph, crosshatch, sketchbook, editorial collage, halftone pop | 1, 3, 4 |
| Diagrammatic | math/graph (3B1B-like), isometric, line-art, flat vector, Swiss/Bauhaus | 1, 3, 4 |
| Painterly (art history) | cave, Egyptian, Greek black-figure, mosaic, illuminated manuscript, sfumato, impressionist, post-impressionist swirl, art nouveau, cubist, expressionist, ink wash, gold-leaf ornamental, cut-out collage, pointillist… | 3 (translated and renamed) |
| Screen and tech | pixel (rules from #5), synthwave, liquid/metaball, aurora glass, HUD | 1, 4, 5 |
| Cartoon | rubber-hose, cel with line boil, watercolour anime, polka-dot pop, bold-line street art | 3, 4 (renamed) |
| 3D | Blender render | 4 (**v2**) |

**Grammar library** (`grammars/<id>.md`), the story structures for explainers: whiteboard, storytime, kinetic type, math explainer, keynote UI, finance chart, editorial collage, science-cartoon explainer, presenter. Sources: 3 (translated; Kurzgesagt and Vox renamed), 2 (14 narrative arcs), 1 (8 story formats).

## easel-design

Graphic, UI and brand design. Mostly adapted from designskills (#6).

| Skill | Triggers on | What it does | Sources | v |
| --- | --- | --- | --- | --- |
| `design` (entry) | Any design request without a clear type | Routes to the skills below and runs `brief` when the job is larger. | 6 | v1 |
| `social-graphic` | Social posts, carousels, LinkedIn, YouTube thumbnails, banners, OG images | Uses per-platform specs, safe zones and mobile readability minimums, and exports one master to every size. | 6 (social, thumbnail, banner), 11 (LinkedIn specs, ideas only) | v1 |
| `poster` | Posters, flyers, print | Print specs, bleed and hierarchy. | 6, A (`canvas-design`) | v1 |
| `ad-creative` | Display ads, paid social, HTML5 animated ads | IAB sizes; animated ads get timing rules. | 6 | v1 |
| `infographic` | "infographic", "explain this data visually" | Code + SVG by default, or a generated image. | 6 | v1 |
| `presentation` | Slides, decks, pitch decks | HTML decks exported to PDF. | 6, 13 (slides: check licenses) | v1 |
| `ui-design` | Components, screens, mobile UI, cards, dark mode | Covers states, touch targets and theming. | 6 (ui, mobile, card, dark-mode) | v1 |
| `landing-page` | Landing pages, hero sections | Section by section, with directions explored first. | 6 (landing, hero) | v1 |
| `dashboard` | Admin, KPI and analytics views | | 6 | v2 |
| `email-design` | HTML email | Table-based and email-safe. | 6 | v2 |
| `design-system` | Tokens, palettes, type scale, grids, themes | OKLCH palettes, DTCG tokens, plus generic `DESIGN.md` styles. | 6 (palette, typography, layout, design-system), 13 (generic design systems only), A (`theme-factory`) | v1 |
| `brand-identity` | "brand", "brand kit", "visual identity" | A phased process (emotional brief → directions → mark → system → kit) with approval gates. Packages a `brand-kit/` folder. | 6 (`brand-identity`), 10 (phases, kit, ideas only), 13 (brandkit: check license) | v1 |
| `logo` | Logos, wordmarks, favicons, app icons | Brief → 3–5 distinct SVG concepts → contact sheet from 16 to 512 px on light and dark → fix the worst failure (at most 3 passes) → export with a provenance record. | 9 (base), 10 (font-first, trace-not-handwrite, ideas only) | v1 |
| `icons` | Icon sets and systems | Grid, stroke, optical sizes, sprite output. | 6 (`icon-design`), 8 | v1 |
| `directions` | "make it less generic", "explore options", "different directions" | Produces 3–5 structurally different directions, each naming the convention it breaks. The user keeps or kills each; nothing is blended. Includes the blur test and an anti-reference list. | 10 (ideas only), 13 (`craft/anti-ai-slop`) | v1 |

## easel-illustrate

Still illustration and drawing.

| Skill | Triggers on | What it does | Sources | v |
| --- | --- | --- | --- | --- |
| `illustrate` (entry) | "draw", "illustrate", "make an illustration" | Routes by output type: vector, concept, generative or AI raster. | 9 (asset-class routing) | v1 |
| `svg` | SVG for UI: inline icons, charts, sprites, masks, React/Vue components, email-safe SVG | Authoring rules, accessibility, integration targets. | 8 (base; fix its chart example), 7 (§12 power features) | v1 |
| `svg-illustration` | Scenes, characters, mascots, spot illustrations in vector | Builds characters piece by piece, with five-zone lighting, materials and filters. Uses the render → look → fix loop. | 7 (base) | v1 |
| `concept-illustration` | "illustrate this idea", article or blog illustrations, metaphors | Idea → physical action → one object → a recurring mascot acts it out, using one of 8 structure types plus the removal test. The mascot is user-supplied, with a neutral default. Output is vector (via `svg-illustration`) or raster (via `easel-ai-media`). | 12 (method; both notices kept) | v1 |
| `generative-art` | "generative", "algorithmic art", "flow field", "p5.js", "shader" | p5.js sketches and GLSL shaders, exported as stills or loops through the engine. | A (`algorithmic-art`), 13 (`shader-dev`: origin TBD) | v1 |
| `diagram` | "hand-drawn diagram", "whiteboard sketch", "Excalidraw" | Hand-drawn style diagrams, static or animated SVG. | 13 (`hand-drawn-diagrams`: origin TBD) | v2 |
| `3d-scene` | "3D", "Three.js", "render a 3D scene" | | 13 (`threejs`), 4 (Blender) | v2 |

## easel-ai-media

Generative media. Users bring their own API keys.

| Skill | Triggers on | What it does | Sources | v |
| --- | --- | --- | --- | --- |
| `providers` | "set up API key", "which image model", cost questions | Configures providers, lists models and capabilities, and gives cost estimates. | 2 (`provider.py`, cost gate), 9 (backend notes) | v1 |
| `image` | "generate an image", "edit this photo", "remove background", "upscale" | Text-to-image, edit, multi-turn and reference images. Fixes text by exact instruction, then falls back to a code overlay. Exports to every size. | 6 (`image-generation`, `export-sizes`), 10 (multi-provider tool, ideas only) | v1 |
| `ai-video` | "AI video", "collage video", "explainer with real footage feel" | beats.json → style bake-off → keyframes → image-to-video → voice and music → assembly. Has two approval gates and shows the cost estimate before spending. | 2 (base; celebrity examples and filter workarounds removed; "Vox" renamed) | v1 |
| `voice` | "voice-over", "narration", "text to speech", "clone my voice" | TTS and voice-over with word timing. Cloning needs **recorded consent**. | 2, 3 (voice), 1 (ElevenLabs connector) | v1 |
| `music` | "generate music", "soundtrack" | Generated music. Points to `easel-core:score` for synthesized music. | 2 | v2 |

## easel-pixel

Optional add-on. Needs Aseprite, which is paid.

| Skill | Triggers on | What it does | Sources | v |
| --- | --- | --- | --- | --- |
| `pixel` (entry) | "pixel art", "sprite", "Aseprite" | Connect → brief → draw → animate → critique → export. | 5 (`studio`) | v1 |
| `pixel-draw` | Draw or shade a sprite | Silhouette as a text grid, then shading. Calls `look` after every change. | 5 (draw, shade, new, palette) | v1 |
| `pixel-animate` | Walk cycles, idles, VFX | Rigs layers, then times key poses. | 5 (rig, animate) | v1 |
| `pixel-export` | Spritesheet, GIF, PNG, tileset | | 5 (export, tileset) | v1 |

**Agents:** `animation-director`, `palette-smith`, `rig-builder`. Their critique goes through the core `critic` with the pixel rubric. Source: 5.

**MCP:** the published `@pebbly/aseprite-ai-artist` package, pinned to a version (see [architecture.md](architecture.md) §5).

---

## Totals (v1)

| Plugin | Skills | Agents |
| --- | --- | --- |
| easel-core | 5 | 1 |
| easel-motion | 3 | 0 |
| easel-design | 13 | 0 |
| easel-illustrate | 5 | 0 |
| easel-ai-media | 4 | 0 |
| easel-pixel | 4 | 3 |
| **Total** | **34** | **4** |

## License checks before porting

- **"Check licenses" / "origin TBD":** before porting any open-design skill marked this way, trace it to its original repo and record its license in [third-party-notices-draft.md](third-party-notices-draft.md).
- **Skills from anthropics/skills** (`algorithmic-art`, `canvas-design`, `slack-gif-creator`, `theme-factory`): take them from **anthropics/skills** directly, not via open-design or #10.
- **GSAP skills:** take them from **greensock/gsap-skills** (MIT), not via open-design.
