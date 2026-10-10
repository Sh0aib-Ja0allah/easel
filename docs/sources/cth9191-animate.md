# cth9191/animate

- **Link:** https://github.com/cth9191/animate
- **License:** MIT (© 2026 cth9191). Ships no third-party assets (system fonts only, no music or images beyond its own samples).
- **Status (2026-10-10):** v0.4.0, ~400 stars, public since 2026-10-04. Young; the README calls several formats and the isometric style unproven.
- **Type:** Claude Code plugin with its own marketplace (`.claude-plugin/marketplace.json` → `plugins/animate/`).

## What it does

Makes short procedural videos (explainers, histories, product reels) entirely in code. Each frame is drawn on a single deterministic `<canvas>`, the music is synthesized, and the result is rendered to MP4.

### Workflow

1. **Intake:** asks up to 8 questions (subject, formats, voice, look, hero, music, product, brand).
2. **Story check:** story format plus a numbered beat table; facts are checked with web search.
3. **Look check:** 2–4 full-size style frames.
4. **Storyboard check:** the user gives a thumbs up or down on each panel. Nothing is animated before this approval.
5. **Build:** build → tile → score → export → review.
6. **Deliver:** MP4 plus the measured QA numbers.
7. **Learn:** proposes new rules for `craft.md`.

## Structure

- **Skill:** a single skill, `animate`, with argument hint `[what the video is about] [style or reference]`.
- **Not present:** commands, agents, hooks, and MCP servers.
- **Contents:**
  - `kit/`: core, morph, board, and score code
  - `tools/`: 14 `.mjs` scripts and 2 Python scripts
  - `styles/`, `templates/`, `grammar/` (STORY, FRAME, FORMATS), and `examples/`

## Features

- **7 styles:** cut-paper, crosshatch, riso, sketchbook, math (manim-like), pixel, isometric.
- **Custom styles:** match a new style from the user's references (`new-style.md`, `refs.mjs`, `compare.mjs`).
- **Story formats:** 8.
- **Motion:** shape-morph transitions, springs, and motion blur.
- **Sound:** beat-mapped cuts to the user's own track, and voice-over (ElevenLabs connector or the user's own recording) with word timing.
- **Product shots:** captures real product screenshots.
- **Aspect ratios:** 9:16, 1:1, 4:5, and 16:9, all from one piece.

## Dependencies

- **Required:** Node 18+, Playwright with Chromium installed globally, ffmpeg on PATH.
- **Optional:** Python with faster-whisper (word timing), numpy, and the ElevenLabs connector.
- **Windows:** handled explicitly (SAPI scratch voice, ANGLE/D3D11 flags, no `/tmp`).

## Keep

- The three cheap check-ins before any expensive work.
- The pluggable `STYLE` hook interface (`styles/README.md`).
- Deterministic, seeded drawing.
- The measured review: text clipping, loudness, dead beats.
- The procedure for building a new style from references.

## Gaps

- **Output:** video only. No still illustration or design.
- **Size:** one very large `SKILL.md`.
- **Styles:** only one style per piece, because the kits reuse the same global names.
- **Setup:** relies on fragile global installs.
- **Cost:** generates long hand-written JS for each piece, which uses many tokens.

## Proposed use

**adapt.** This is the strongest base for the "procedural code animation" core: the workflow, check-ins, style interface, and QA.
