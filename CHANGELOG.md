# Changelog

Each plugin is versioned and tagged separately as `<plugin>--v<version>`.

## easel-core 0.1.0 (2026-10-11)

First release of the shared foundation.

- **Render engine** (MCP server `easel` + CLI, no npm dependencies in the MCP layer):
  `render_still`, `contact_sheet`, `render_video`, `filmstrip`. Renders are offline and
  deterministic: bundled OFL fonts, seeded `Math.random`, render-time clocks, every frame seeked
  to `t = n / fps`. Reads `window.renderAt(t)`, GSAP timelines in the HyperFrames composition
  format, and CSS animations.
- **Quality gates** (`qa`): text clipping, WCAG contrast measured against the real pixels behind
  text, still or empty video stretches, blue-purple colour cast, loudness.
- **Data formats** (`validate`): `brief.json`, `beats.json`, `cues.json`, `provenance.json`,
  `.easel/brand.md`.
- **Craft rulebooks and rubrics** (`craft`): anti-generic, typography, colour, accessibility,
  motion; rubrics for design, motion, illustration, pixel and social work.
- **Skills:** `setup`, `brief`, `brand`, `critique`; read-only `critic` agent.
- **doctor** installs Playwright's Chromium headless shell and pinned packages into the plugin
  data folder; Windows, macOS and Linux are tested in CI.
- Evals: 12 routing cases, all at or above threshold (mean 0.94, Claude Code 2.1.296, Sonnet).
