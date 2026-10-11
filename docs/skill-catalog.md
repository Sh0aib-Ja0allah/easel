# Skill catalog

> Status: reflects v1.0.0 (2026-10-11; reconciled with the shipped skills after the v1.0.0 QA review) · Inputs: [sources.md](sources.md), [findings-and-decisions.md](findings-and-decisions.md)

This is the list of skills, agents and shared libraries each Easel plugin ships, with the sources each one adapts. **v1** marks what shipped in v1.0.0 (34 skills and 4 agents, every one under `plugins/*/skills/` and `plugins/*/agents/`); **v2** marks what is planned and not shipped. The "What it does" column follows each skill's `SKILL.md`; where they differ, the `SKILL.md` is right.

## How to read the tables

- **Skill:** the folder name, invoked as `/easel-<plugin>:<skill>`.
- **Triggers on:** the requests the skill's `description` should catch. Each description also says which skill to use instead for nearby requests. This "use X instead of Y" routing comes from designskills.
- **Sources:** the source repos (numbers as in [sources.md](sources.md)), plus upstream repos picked up during review. Exact files and commits are in [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).
  - **A** = [anthropics/skills](https://github.com/anthropics/skills), Apache-2.0
  - **G** = [greensock/gsap-skills](https://github.com/greensock/gsap-skills), MIT
  - **H** = [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes), Apache-2.0 (the composition format only; no code)
- **Ideas only:** when sources #10 or #11 appear, only their ideas are used, rewritten in our own words, because those repos have no license.

## Design rules for the catalog

1. **Fewer, broader skills.** Merge near-duplicates (designskills' social, thumbnail and banner skills become one skill) so triggering stays reliable. Use reference files inside a skill for depth, not more skills.
2. **One entry skill per plugin** routes to the rest, as aseprite's `studio` does.
3. **Styles, grammars, design systems and rubrics are data, not skills.** They live as files that skills read. That lets the catalog grow without adding trigger collisions.
4. **Every skill that produces visual output ends with render → look → critique** through `easel-core`.

---

## easel-core

Shared foundation. The other plugins depend on it (see [architecture.md](architecture.md) §3).

| Skill | Triggers on | What it does | Sources | v |
| --- | --- | --- | --- | --- |
| `setup` | "set up easel", "easel doctor", "is everything installed", render errors that name a missing dependency | Runs `doctor`: Node, the Playwright Chromium headless shell and the pinned npm packages (installed into the plugin data folder after asking), ffmpeg and ffprobe, plus optional Python, Aseprite and provider keys (names only). Gives the install command for the user's OS. | 5 (`doctor`), 1 | v1 |
| `brief` | Start of any multi-step creative job (video, explainer, campaign, multi-format social set, brand job), "plan", "storyboard" | Asks the intake questions, then runs the three cheap check-ins: **story** → **look** → **storyboard**. Writes `brief.json` and `beats.json` before anything expensive is made. | 1, 2, 3 | v1 |
| `brand` | "use my brand", "set up our brand", "what are our colours", brand colours or fonts given, designs drifting off-brand | Finds or creates the shared brand file `.easel/brand.md` (DESIGN.md sections), reading Tailwind config, CSS variables, design tokens or an existing DESIGN.md before asking. Every other skill reads it. | 6 (`design-context`), 13 (`DESIGN.md`), 10 (ideas only) | v1 |
| `critique` | "review this", "what's wrong with", "is this any good", pasted HTML/SVG, after any render | Renders and measures the work first, then runs the read-only `critic` agent with a domain rubric (design, motion, illustration, pixel, social). Findings cite evidence and have a severity; scores have caps. Re-renders and re-checks after fixes. | 6 (`design-critique`), 4 (`rubric.md`), 3 (film gate), 5 (`pixel-critic`) | v1 |
| `score` | "add music", "add sound", "sound effects", "score this", "sync it to the beat", "put my track on this render" | Turns a piece's timing into a cue sheet (`cues.json`), synthesizes music and named effects from it in the engine (`audio_score`: warm, bright or retro palette, a dip before the payoff and the loudest hit on it), masters to -14 LUFS, checks loudness with `qa` and muxes it (`mux_audio`). The user's own track is muxed as is, with its loudness checked. An animate piece keeps its own in-piece score. No beat detection and no voice-over timing (word timings come from `easel-ai-media:voice`). | 1 (synth), 4 (cue sheet idea; `mgaudio` not ported, D16) | v1 |

**Agent:** `critic` (read-only; opus). Scores work against a rubric with evidence and does blind A/B comparisons of fixes. Sources: 5 (`pixel-critic`), 3 (independent review agent).

**Shared libraries** (data, not skills):

- **`craft/` rulebooks:** anti-generic, typography, colour, accessibility, motion. Served by the `craft` tool. Sources: 13 (`craft/`, Apache-2.0, D12), 3 (AI-look colour ban), 10 (anti-average method, ideas only).
- **`rubrics/`:** design, motion, illustration, pixel, social. Served by the `craft` tool. Sources: 6, 4, 3, 5.
- **`schemas/`:** brief, beats, cues, provenance (JSON Schema) and the brand template. Served by the `validate` tool.
- **`fonts/`:** bundled OFL faces (Inter, Newsreader, JetBrains Mono, Space Grotesk, Caveat, STIX Two Text, Noto Sans Math).
- **Render engine:** see [architecture.md](architecture.md) §4. The provider layer is easel-ai-media's own server (D22).

## easel-motion

Code-drawn animation and video, plus UI motion.

| Skill | Triggers on | What it does | Sources | v |
| --- | --- | --- | --- | --- |
| `animate` (entry) | "animate", "make a video/explainer/reel/short", "motion graphics", a looping animation in code | A short animated video as a canvas piece with a synthesized score: `brief` check-ins (story, look, storyboard) → pick a style and grammar → build the piece → render to MP4 in every format asked for (16:9, 9:16, 1:1, 4:5) → measured checks and the critic. Styles can be mixed in one piece (D13). | 1 (base), 3 (grammars), 4 (style looks), H (composition format) | v1 |
| `style-match` | "make it look like this", "match this style", reference images or video, a look no shipped style covers | Measures the references (`measure_image`: palette, sizes, accents), starts a style kit, draws the piece's own frames in it and compares them side by side on a proportion grid (`compare_images`) until the differences are deliberate. Saves `styles/<name>/` (`kit.js` + `STYLE.md`). | 1 (`new-style.md`) | v1 |
| `ui-motion` | "animate this button/page", "scroll animation", "micro-interaction", GSAP, page transitions | Product and web UI motion: micro-interactions, transitions, scroll reveals, loaders, staggers and GSAP timelines (ScrollTrigger, Flip, SplitText, React/Vue/Svelte), with a reduced-motion path, previewed and checked offline through the engine. Also reviews the motion in an existing UI on a filmstrip. | G (the eight gsap-skills, text unchanged), 6 (`motion-design`) | v1 |
| `kinetic-type` | "animated text", "lyric video", "title sequence" | Typography-led motion as its own skill. v1 ships a `kinetic-type` grammar that `animate` uses instead. | 3 (y5 grammar), 4 (08 morph, 18 captions) | v2 |
| `export-gif` | "make a GIF", "sticker", "Slack emoji" | Short loops, with file-size limits for each platform. | A (`slack-gif-creator`) | v2 |

**Styles library** (`styles/<id>/`: `STYLE.md` + `kit.js` + `sample.png` + a demo piece and a golden frame). Eleven styles ship:

| Group | Styles | Sources |
| --- | --- | --- |
| Print and paper | `cut-paper`, `riso`, `crosshatch`, `sketchbook` | 1 |
| Diagrammatic | `math`, `isometric` | 1 |
| Screen and tech | `pixel` | 1 |
| Screen and tech (Easel's own kits, D17) | `synthwave`, `liquid`, `aurora-glass`, `hud` | 4 (looks from the style prompts; no code or media) |

**Style recipes** (`recipes/<id>.md`): ten looks written down with palette, drawing method and motion, but no kit yet. A user turns one into a style with `style-match`. Translated and renamed from 3: `cave-painting`, `egyptian-tomb`, `greek-black-figure`, `roman-mosaic`, `illuminated-manuscript`, `renaissance-sfumato`, `impressionist`, `post-impressionist-swirl`, `art-nouveau-poster`, `analytic-cubist`.

**Not shipped (v2 candidates)** from the planned style list: editorial collage and halftone pop as procedural styles (editorial collage ships as a grammar and as `ai-video`'s look), line-art, flat vector, Swiss/Bauhaus, the remaining painterly looks (expressionist, ink wash, gold-leaf ornamental, cut-out collage, pointillist), the cartoon group (rubber-hose, cel with line boil, watercolour anime, polka-dot pop, bold-line street art) and 3D (Blender).

**Grammar library** (`grammars/<id>.md`): nine explainer grammars translated and renamed from 3 (whiteboard, storytime, kinetic type, math explainer, keynote UI, finance chart, editorial collage, science cartoon, presenter; channel and creator names removed), plus three structure files from 1 (`formats.md`, `frame.md`, `story.md`).

## easel-design

Graphic, UI and brand design. Mostly adapted from designskills (#6). Every skill builds HTML/CSS/SVG and renders it with the engine (D19).

| Skill | Triggers on | What it does | Sources | v |
| --- | --- | --- | --- | --- |
| `design` (entry) | Any design request without a clear type | Routes to the skills below, or makes a one-off visual itself (a product shot, a mockup, a quote card, a cover), rendered and critiqued. | 6 | v1 |
| `social-graphic` | Social posts, stories, carousels, profile headers, YouTube thumbnails, OG images, web and email banners | Per-platform pixel sizes, safe zones and phone readability minimums; exports one master to every size. | 6 (social, thumbnail, banner), 11 (LinkedIn specs, ideas only) | v1 |
| `poster` | Posters, flyers, print | Print size with bleed, hierarchy readable from a distance, a PNG proof and a print PDF (`render_pdf`). | 6, A (`canvas-design`) | v1 |
| `ad-creative` | Display ads, paid social, HTML5 animated ads | IAB sizes from one master; animated ads get timing rules. | 6 | v1 |
| `infographic` | "infographic", "explain this data visually", a standalone chart | HTML/SVG with exact numbers as live text; PNG, and PDF for print. | 6 | v1 |
| `presentation` | Slides, decks, pitch decks | One HTML file with a 16:9 page per slide, exported to PDF, with speaker notes and a contact sheet of every slide. | 6 | v1 |
| `ui-design` | Components, screens, mobile UI, cards, dark mode, dashboards | Every state designed (hover, focus, active, disabled, loading, empty, error), touch targets and theming; rendered at desktop and phone sizes. | 6 (ui, mobile, card, dark-mode, dashboard) | v1 |
| `landing-page` | Landing pages, hero sections | Section by section, responsive, with directions explored first when asked. | 6 (landing, hero) | v1 |
| `email-design` | HTML email | Table-based and email-safe. | 6 | v2 |
| `design-system` | Tokens, palettes, type scale, grids, themes | OKLCH palettes (`tools/palette.mjs`), DTCG tokens, Tailwind config, and the generic `DESIGN.md` systems as starting points; a rendered specimen with every text pair checked for contrast. | 6 (palette, typography, layout, design-system), 13 (`DESIGN.md` format), A (`theme-factory`) | v1 |
| `brand-identity` | "brand", "brand kit", "visual identity" | A phased process (emotional brief → directions → mark → system → kit) with an approval gate at each. Packages a `brand-kit/` folder and saves `.easel/brand.md`. | 6 (`brand-identity`), 10 (phases, kit, ideas only) | v1 |
| `logo` | Logos, wordmarks, favicons, app icons | Brief → 3–5 distinct SVG concepts → contact sheet from 16 to 512 px on light and dark → fix the worst failure (at most 3 passes) → export with a provenance record. | 9 (base), 10 (font-first, trace-not-handwrite, ideas only) | v1 |
| `icons` | Icon sets and systems | Grid, keylines, one stroke weight, optical corrections, sizes from 16 to 48 px, an SVG sprite and a review sheet. | 6 (`icon-design`) | v1 |
| `directions` | "make it less generic", "explore options", "different directions" | Lists the anti-references, then builds 3–5 structurally different directions, each naming the convention it breaks, with a blur test. The user keeps or kills each; nothing is blended. | 10 (ideas only), 13 (`craft/anti-ai-slop`) | v1 |

Dashboards are part of `ui-design` (D19), not a separate skill.

**Design systems** (`systems/<id>/DESIGN.md`, generic only, D8): ten ship: `brutalist`, `calm-care`, `clean-product`, `dark-tech`, `editorial`, `luxury`, `playful`, `retro-print`, `swiss-grid`, `warm-minimal`.

## easel-illustrate

Still illustration and drawing.

| Skill | Triggers on | What it does | Sources | v |
| --- | --- | --- | --- | --- |
| `illustrate` (entry) | "draw", "illustrate", "make an illustration", art for an app screen | Routes by output type: `svg`, `svg-illustration`, `concept-illustration`, `generative-art`, or out to easel-design (logos, posters) and easel-ai-media (photographic or painted rasters). | 9 (asset-class routing) | v1 |
| `svg` | SVG for UI: icons, charts, diagrams, progress rings, sprites, masks, React/Vue/Svelte components, email-safe SVG | Authoring rules, accessibility, integration targets; every file checked with `tools/svg-check.mjs` and rendered through the engine. | 8 (base; its chart example fixed), 7 (power features) | v1 |
| `svg-illustration` | Scenes, characters, mascots, spot illustrations in vector | Builds characters piece by piece, with five-zone lighting, materials and filters, using the render → look → fix loop. | 7 (base, Apache-2.0, modified) | v1 |
| `concept-illustration` | "illustrate this idea", article or blog illustrations, metaphors | Idea → physical action → one object → a recurring mascot acts it out, plus the removal test. The mascot is the user's own or Easel's neutral "card". Drawn as SVG with no API key; an AI raster is optional through `easel-ai-media`. | 12 (method; both notices kept) | v1 |
| `generative-art` | "generative", "algorithmic art", "flow field", "p5.js", creative coding | **p5.js only:** an algorithmic philosophy, then one seeded sketch whose frames are a pure function of time, exported as PNG stills and a seamless loop MP4 through the engine. GLSL shaders are not covered (deferred, D21). | A (`algorithmic-art`) | v1 |
| `diagram` | "hand-drawn diagram", "whiteboard sketch", "Excalidraw" | Hand-drawn style diagrams, static or animated SVG. | 13 → muthuishere/hand-drawn-diagrams (MIT; traced and deferred, D21) | v2 |
| `3d-scene` | "3D", "Three.js", "render a 3D scene" | | 13 → CloudAI-X/threejs-skills (no licence; deferred, D21), 4 (Blender) | v2 |

## easel-ai-media

Generative media. Users bring their own API keys. Its own `media` MCP server (D22); the adapters are tested offline with synthetic fixtures and have not yet been checked against the live APIs.

| Skill | Triggers on | What it does | Sources | v |
| --- | --- | --- | --- | --- |
| `providers` | "set up API key", "which image model", cost questions, a missing-key error | Shows which keys are set (names only), what each provider and model does, what a job will cost, and the spending limit. | 2 (`provider.py`, cost gate), 9 (backend notes) | v1 |
| `image` | "generate an image", "edit this photo", a photographic background for a design | Text-to-image and edits with reference images (Gemini, OpenAI, fal.ai, Replicate, Atlas Cloud); cost shown first; text fixed by exact instruction or moved to a code overlay; several sizes from one master; provenance recorded. | 6 (`image-generation`, `export-sizes`), 10 (multi-provider tool, ideas only) | v1 |
| `ai-video` | "AI video", "collage video", a narrated short from a topic | beats.json → style bake-off → keyframes → image-to-video → narration, music, captions → assembly with the local ffmpeg. Two approval gates and a cost estimate before every spend; real people only from the user's own footage with consent. | 2 (base; celebrity examples and filter workarounds removed; "Vox" renamed editorial collage) | v1 |
| `voice` | "voice-over", "narration", "text to speech", "clone my voice" | TTS and voice-over with word timings (ElevenLabs, OpenAI, Atlas Cloud). Cloning needs a **recorded consent** statement from the voice owner in the job folder. | 2, 3 (voice), 1 (ElevenLabs connector) | v1 |
| `music` | "generate music", "soundtrack" | Generated music. Points to `easel-core:score` for synthesized music. (The `media` server can already call one Atlas music model, D22.) | 2 | v2 |

## easel-pixel

Optional add-on, **Preview**: it needs Aseprite (a paid app) and has not been run end to end with a real Aseprite by the project.

| Skill | Triggers on | What it does | Sources | v |
| --- | --- | --- | --- | --- |
| `pixel` (entry) | "pixel art", "sprite", "Aseprite" | Connect → brief → draw → animate → critique (core `critic`, pixel rubric) → export, looking at the canvas after every step that changes pixels. | 5 (`studio`) | v1 |
| `pixel-draw` | Draw, shade or recolour a sprite; palettes | Silhouette as a text grid, materials, hue-shifted ramps, outline. Calls `look` after every change. | 5 (draw, shade, new, palette) | v1 |
| `pixel-animate` | Walk cycles, idles, runs, jumps, attacks, VFX | Rigs part layers, plans key poses, moves cels, adds in-betweens and millisecond timing. | 5 (rig, animate) | v1 |
| `pixel-export` | Spritesheet, GIF, PNG, tileset | Spritesheet PNG with a JSON atlas by tag, GIF, integer-scaled PNGs, frames, slices, tilesets into `./easel-out/<slug>/`. | 5 (export, tileset) | v1 |

**Agents:** `animation-director`, `palette-smith`, `rig-builder` (sonnet). Their critique goes through the core `critic` with the pixel rubric. Source: 5.

**MCP:** the published `@pebbly/aseprite-ai-artist` package, pinned to 0.8.0 and installed by a Node launcher from a shipped lockfile (D23; see [architecture.md](architecture.md) §5).

---

## Totals (v1.0.0)

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

- **Traced open-design skills:** `shader-dev`, `hand-drawn-diagrams` and `threejs` were traced to their original repos in D21 and deferred to v2; re-check the licence at the pinned commit and record it in [third-party-notices-draft.md](third-party-notices-draft.md) before porting any of them.
- **Skills from anthropics/skills** (`algorithmic-art`, `canvas-design`, `slack-gif-creator`, `theme-factory`): take them from **anthropics/skills** directly, not via open-design or #10.
- **GSAP skills:** take them from **greensock/gsap-skills** (MIT), not via open-design.
