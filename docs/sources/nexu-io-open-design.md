# nexu-io/open-design (linked as Vidyard/open-design)

- **Link given:** https://github.com/Vidyard/open-design. This is a **fork**, 3 commits ahead and about 3,416 behind upstream.
- **Reviewed instead:** **https://github.com/nexu-io/open-design** (upstream).
- **License:** **Apache-2.0**, with no root NOTICE file. Several skills carry their own license (see [License obligations](#license-obligations)).
- **Status (2026-10-10):** about 100k stars, pushed today. Very active.

## Vidyard's fork: ignore it

| Commit | Change |
|---|---|
| `f6a8cd3` | Adds Vidyard's house brand (`design-systems/construction-yard/DESIGN.md`) and makes it the default. Deletes the "no Tailwind indigo" anti-AI-slop rule, because Vidyard's brand is indigo. |
| `e2c4c94` | Adds AWS Bedrock as a bring-your-own-key option in the app's daemon and web UI. |
| `c506e70` | Automated dependency bump. |

All three changes are brand- or app-specific. Use upstream.

## Architecture

It's a pnpm monorepo containing an **app**:

- an Express + SQLite daemon on `127.0.0.1:7456`
- web and desktop front-ends
- an `od` command-line tool

The Claude Code plugin (`plugins/open-design`) is **only an MCP config** that points at the running app.

### Usable without the app

- Almost every `skills/*/SKILL.md`.
- The `craft/*.md` rulebooks. The app normally injects these through the `od.craft.requires` frontmatter field, so without the app they need to be inlined or referenced directly.

### Not usable without the app

The HyperFrames render step, which is hardwired to `$OD_BIN media generate`.

### Size

| Content | Count |
|---|---|
| Skills | 163 |
| Design templates | 115 |
| Design systems | 153 |
| Craft rulebooks | 13 |
| Plugins | 277 |
| Prompt templates | 93 |

## Relevant skills by domain

- **Design / UI:**
  - design-taste-frontend, high-end-visual-design, industrial-brutalist-ui, minimalist, redesign
  - design-brief, design-review, creative-director, color-expert, theme-factory
  - brand-extract, brandkit, brand-guidelines, image-to-code, web-clone, mockup-device-3d
  - figma-* (7 skills)
- **Motion / video:**
  - remotion, video-hyperframes
  - gsap-* (8 skills), frame-* (7 motion presets)
  - emilkowalski-motion, review-animations, vfx-text-cursor
  - sora, fal-video-edit, fal-lip-sync, slack-gif-creator, gif-sticker-maker
- **Illustration / generative:**
  - algorithmic-art (p5.js), canvas-design, shader-dev, threejs
  - hand-drawn-diagrams (Excalidraw), hatch-pet (sprite sheets), d3-visualization
- **Image:**
  - imagegen, imagen
  - fal-* (generate, edit, upscale, restore, 3d, …)
  - venice-*, replicate, image-enhancer, ad-creative
- **Slides and docs:**
  - slides, pptx, frontend-slides, deck-*
  - docx, pdf, article-magazine, resume-modern
- **Audio:** speech, venice-audio-*, ai-music-album

Quality is uneven. Skills come from many authors, many overlap, some are catalogue stubs, and many need paid APIs (fal, Venice, Replicate, MiniMax, OpenAI).

## Design systems

There are **153 folders**. Each is built around a 9-section `DESIGN.md`. Newer ones also include `manifest.json`, `tokens.css`, `components.html` and a Tailwind v4 file.

⚠️ **Trademark risk:** about **70 copy real brands' look**, including Stripe, Linear, Apple, Nike, Ferrari, Tesla, Spotify, Airbnb, OpenAI and Claude. Some name the brand's own fonts and exact hex colours. Most come from VoltAgent/awesome-design-md (MIT), and the only disclaimer is one line. **Take only the generic styles** (brutalism, glassmorphism, editorial, and so on), or rename the brand-derived ones to style names.

## HyperFrames (important for our engine)

[heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) is HeyGen's **Apache-2.0** framework, with about 60k stars and active development.

**How it works:**

1. A video is an HTML file. Elements carry `data-*` timing attributes.
2. A paused GSAP timeline is exposed at `window.__timelines.main`.
3. Headless Chrome (Puppeteer) seeks the timeline frame by frame and captures each frame.
4. FFmpeg encodes the frames to video.

It also has lint, transcribe and TTS commands.

This is essentially the **same design as our planned Node + Playwright + ffmpeg engine**. → See decision D7 in [findings-and-decisions.md](../findings-and-decisions.md).

## Keep

- The **`craft/` rulebooks**, including the anti-AI-slop rules.
- The idea of **opt-in craft injection**: a skill declares which rulebooks it needs.
- The **`DESIGN.md` format** for design systems and brand kits.
- The **gsap-\* skills**, the **frame-\* motion presets**, and the HyperFrames composition rules.
- **algorithmic-art, shader-dev, threejs, hand-drawn-diagrams.** These fill gaps in illustration and generative art.

## License obligations

- **Repo:** keep the Apache-2.0 LICENSE and mark any changes.
- **Per-skill licenses:**

| License | Skills |
|---|---|
| MIT | Leonxlnx skills (brandkit, brutalist, taste, minimalist, redesign, image-to-code, imagegen-*), Matt Pocock (emil-design-eng, review-animations), Vercel Labs (web-design-guidelines), web-clone, guizang-ppt |
| Apache-2.0 | frontend-design, hatch-pet (upstream: openai/skills) |

- **Not covered by Apache:** HyperFrames catalogue thumbnails are © HeyGen.
- **Remotion:** larger companies need a paid company license, so treat it as optional.

## Proposed use

**adapt (selectively), skill by skill.** For each skill we take:

- check its own license
- prefer the original upstream repo when one exists
- don't depend on the open-design app
