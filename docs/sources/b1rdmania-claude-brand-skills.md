# b1rdmania/claude-brand-skills

- **Link:** https://github.com/b1rdmania/claude-brand-skills
- **License:** ⚠️ **None.** The API license field is null, and there's no LICENSE file in the repo root. The README says "use and modify, attribution appreciated", which isn't a license.
  - **Ideas only.** We can reuse ideas and methods, written in our own words. We can't copy any text.
- **Status (2026-10-10):** 25 stars, last push February 2026. About 23 MB and 478 files, mostly one client's project history.
- **Type:** four skill folders: `brand-skill`, `art`, `canvas-design`, `frontend-design`. There's no plugin manifest.

## Contents

### brand-skill

An 8-phase brand-development process, with phases 0–7 plus a 5.5. Each phase has its own workflow file. Progress and approval gates are tracked in `.brand-progress.md`.

It produces:

- narrative and philosophy docs
- mark and wordmark SVGs
- design guidelines for web and iOS
- an HTML page per design variant, plus a comparison index
- a single `DESIGN.md` as the source of truth
- a packaged `brand-kit/` folder: favicons, OG image (1200×630), avatar (400×400), and mono, white and dark versions of the mark

Tools it calls: `rsvg-convert`/`qlmanage` (SVG→PNG), `vtracer`/`potrace` (PNG→SVG tracing), and `svgo`.

### art

A bun command-line tool (`Generate.ts`) that calls several image services:

- Gemini (nano-banana-pro)
- Replicate (Flux)
- gpt-image-1
- remove.bg

It's almost certainly an early copy of the Art tool from danielmiessler/Personal_AI_Infrastructure (MIT).

### canvas-design

A **byte-identical copy** of Anthropic's `canvas-design` skill from anthropics/skills (Apache-2.0), including 81 OFL fonts. The copyright line in its license file was left blank.

### frontend-design

Anthropic's December 2025 `frontend-design` skill (Apache-2.0), with an added "LLM limitations" section.

### projects/infrasingularity

About 330 files of iteration history for one client. It's a worked example, not reusable material.

## Ideas worth re-implementing (our own words)

### Escaping the "average" output

LLMs tend to produce the most typical design. To avoid that:

1. Generate 3–5 layouts with **structurally different** designs. For each, name the convention it fights and an inspiration from outside the industry.
2. The user **keeps or kills** each one. Never blend them.
3. The survivor gets 2–3 named, reversible "breaks" from convention.
4. Repeat.

Supporting checks:

- **Anti-reference list:** sites and patterns the design must not resemble.
- **Blur test:** blur the layout to about 20% visibility. Its silhouette must look different from everything on the anti-reference list.
- **Ask what the user hates,** not only what they like.

### Process gates

- Write an **emotional brief** (Phase 0) before any visuals.
- **Choose the font** before designing the wordmark, and avoid the default Inter and JetBrains Mono.

### Logo craft

- Trace a bitmap rather than hand-writing complex SVG.
- Render after every edit.
- Change direction after 5–8 rounds without progress.
- Always test the mark at 16 px and 32 px.

### Brand kit

- One `DESIGN.md` is the single source of truth.
- It ends with a section recording the layout identity.

## Proposed use

**reference only.** Re-implement the ideas above in our brand and design plugins.

If we want `canvas-design` or `frontend-design`, take them **from anthropics/skills directly**, under Apache-2.0 with attribution, not from this repo.
