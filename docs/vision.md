# Vision

> Status: v1.0.0 released · Last updated: 2026-10-11 · Project name: **Easel**

## What this is

**Easel** is a public Claude Code plugin marketplace that bundles many skills for visual and creative work:

- Animation
- Illustration
- Drawing
- Video creation
- Design

The plugin is built by studying and adapting existing open-source Claude Code plugins and skills on GitHub (see [sources.md](sources.md)), then unifying them into one consistent, well-documented package.

## Who it is for

Anyone using Claude Code who wants to produce visual or motion output (designers, developers, content creators) without hunting for and installing many separate plugins.

## Goals

1. One install gives a coherent set of creative skills.
2. Every skill follows the same structure, naming, and quality bar.
3. Every adapted skill respects its source license and credits its origin.
4. Skills trigger reliably from natural requests ("animate this logo", "make a 30s explainer video").

## Non-goals (for v1)

- Hosting or running media-generation services ourselves.
- Covering every creative domain on day one. The domain list above is the v1 scope.

## Open questions

- [x] Project and repo name: **Easel** (decided 2026-10-11).
- [x] License: MIT for our code (decided 2026-10-11); Apache-2.0 material keeps its own license (see [findings-and-decisions.md](findings-and-decisions.md), D6).
- [x] External tools: Node + Playwright + ffmpeg as the base; Aseprite and paid AI APIs only in optional plugins. The render engine is Easel's own Playwright capture loop, not HyperFrames: D7 = B, decided by Claude for the owner after the HyperFrames spike ([spikes/hyperframes.md](spikes/hyperframes.md)); the owner's confirmation is still pending. Easel reads the HyperFrames composition format, so compositions stay portable.
- [x] Distribution: own marketplace in this repo with several plugins (D1).

Decisions so far are recorded in [findings-and-decisions.md](findings-and-decisions.md).
