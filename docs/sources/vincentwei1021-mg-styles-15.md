# Vincentwei1021/mg-styles-15

- **Link:** https://github.com/Vincentwei1021/mg-styles-15
- **License:** MIT. Third-party assets are covered in [License notes](#license-notes).
- **Status (2026-10-10):** about 630 stars, last push 2026-10-05. The repo is about 575 MB, of which about 420 MB is video.
- **Type:** a **showcase**, not a plugin or skill. It has no `SKILL.md` and no `plugin.json`.

## Contents

- 15 prompts in `prompts/*.md`. Instructions are in Chinese; prompt bodies are in English.
- Full source code for each film in `demos/<slug>/`.
- The finished MP4 films.
- A frame renderer, `harness/render.mjs`.
- A Python music and sound-effects synthesis library, `lib/audio/mgaudio`.
- A review rubric (`rubric.md`) and a template for new styles (`template.md`).
- A bilingual GitHub Pages site.

## The 15 styles

| # | Style | Tech |
|---|-------|------|
| 01 | flat-vector | SVG, hand-coded easing |
| 02 | line-art | SVG stroke-dashoffset, pen-following camera |
| 03 | isometric | Three.js orthographic + AO |
| 04 | 3d-render | Blender 5.1 Cycles via Python, physics pre-sim, HTML overlay |
| 05 | cel-boil | Canvas2D custom brush, seeded line boil |
| 06 | collage | DOM/Canvas PNG cutouts (rembg), halftone, 12 fps hold |
| 07 | liquid | WebGL2 SDF metaballs, SDF text |
| 08 | morph | SVG path morph from font glyph outlines |
| 09 | bauhaus | SVG/Canvas on a 120 BPM grid |
| 10 | synthwave | WebGL grid/sun + VHS pass |
| 12 | aurora-glass | WebGL aurora + glass refraction |
| 18 | hanazi | 9:16 DOM/SVG variety-show captions over Ken Burns photos |
| 19 | paperclip | Huge canvas + camera transform, d3 charts, stickers |
| 20 | pixel | 320×180 Canvas ×6 nearest-neighbour |
| 22 | hud | SVG/Canvas UI layers + Three.js hologram + topojson maps |

## How it works

### Rendering

1. Each page exposes `window.renderAt(t)` and sets `window.__ready` when loaded.
2. `render.mjs` uses puppeteer-core to screenshot every frame, with optional motion blur.
3. The frames are piped to ffmpeg.

### Timing

`cues.json` holds fps, BPM, key and named frames. The visuals and `audio.py` both read it, so picture and sound stay in sync.

### Audio

mgaudio builds tracks from recipes, synthesizers, drums and sound effects, and masters them to −14 LUFS.

### Dependencies

- Node 22.12+
- Chrome
- ffmpeg
- Python 3.11+ with numpy, scipy, numba, pedalboard, librosa, rembg and opencv
- Blender, for style 04 only

### Windows problems

- The Chrome path defaults to macOS, so the `MG_CHROME` environment variable must be set.
- The render lock path is hardcoded as `/tmp/mg-render-slots`.
- The docs use `python3`.
- Blender assumes Metal or OptiX GPU rendering.

## What can be reused

**Reusable as skill content:**

- The prompt skeleton: treatment → keyframes → motion → sound → final checks → self-score.
- Each prompt's "Signature features / key techniques" section, which are concrete recipes.
- `template.md` and `rubric.md`.
- The `renderAt(t)` determinism contract and the cue-sheet approach.
- `render.mjs` and mgaudio, as tools.

**Demo output only:** the 15 films, the per-film scene code, the generated assets and the site.

## Gaps

- **Missing inputs:** fonts and original photos are not in the repo. The prep scripts read `assets/images/originals/`, which is absent.
- **One-shot briefs:** each prompt is a single brief, not a step-by-step method.
- **Language:** partly in Chinese.
- **Platform:** macOS-first.

## Unique value

Not covered by the other sources:

- **3D:** Blender rendering.
- **WebGL shaders:** liquid, aurora and synthwave.
- **Formats:** the HUD style and the 9:16 vertical captions.
- **Tooling:** a full audio synthesis and mastering engine, plus the review-rubric loop.

## License notes

- **Fonts:** not shipped. Mostly OFL (Google Fonts). Alibaba PuHuiTi, HarmonyOS Sans and Douyin Sans have vendor-specific licenses.
- **Glyph meshes:** stay under OFL.
- **HDRI:** "studio_small_09_2k" matches a Poly Haven name, so likely CC0. Not confirmed.
- **Paper texture:** "Paper001_4K" matches an ambientCG name, so likely CC0. Not confirmed.
- **Instrument samples:** VCSL, CC0.
- **Maps:** Natural Earth, public domain.
- **Images:** the portrait is from the Met (CC0). The cat photos have no stated source.
- **Sound effects:** the collage foley `.wav` files have no stated source.
- **Code:** highlight.js is BSD-3.

## Proposed use

**adapt (selectively).** Take the style recipes, the rubric and template, the `renderAt(t)` contract, the cue sheet, and the audio engine. Prioritize what only this repo has: 3D, WebGL, HUD and vertical captions.

**Do not copy:** the films, the generated assets, or the unsourced media.
