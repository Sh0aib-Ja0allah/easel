# Changelog

Each plugin is versioned and tagged separately as `<plugin>--v<version>`.

## Unreleased

- **easel-core engine:** reads the animate kit's page contract: `window.renderFrame(t)`,
  `window.TIMELINE` / `window.__composition` (size, fps, duration) and `window.ASSETS_READY`.
  `render_video` takes `audio: "page"` (the page's own score from `window.renderAudioWav()`,
  mastered to -14 LUFS with two-pass loudnorm and saved beside the video). Pages learn the format
  being rendered from `window.__easel.aspect`; `render_still` and `filmstrip` take `aspect`.
- **easel-core qa:** `canvas_text` (every string a canvas piece draws, traced to screen: cut off
  or overlapping fails, under the phone UI warns; per format) and `beat_grid` (cuts and morph
  centres on the 8th-note grid). `render_still` reports the real size of element and full-page
  captures.
- **easel-core `score` skill and `audio_score` tool:** a cue sheet becomes a synthesized score
  (sections, a dip before the payoff hit, named effects) mastered to -14 LUFS; JavaScript synth,
  no Python (decision D16).
- **easel-core:** `measure_image` and `compare_images` tools for matching a look from references
  (adapted from animate's reference tools).
- **easel-core fonts:** Caveat, STIX Two Text (with italics), Noto Sans Math and Inter 900 (OFL).
- **easel-motion:** the animate kit, seven styles (crosshatch, cut-paper, isometric, math, pixel,
  riso, sketchbook) with demos and golden frames, starter templates, story grammars and the build
  tool, adapted from cth9191/animate. Styles can now mix in one piece (`"mix"`, `KITS.<name>`).
- **easel-motion `animate` skill:** brief check-ins (story, look, storyboard), a new piece from any
  style in any formats (`tools/new-piece.mjs`), the storyboard page (`board.html`), renders in every
  format with the piece's own score, and the quality loop (qa per format, filmstrips, the critic).
  An 8 s example piece (`examples/water-cycle`) renders in 16:9 and 9:16.
- **easel-motion grammars and recipes:** nine explainer grammars (math explainer, keynote UI,
  finance chart, science cartoon, editorial collage, whiteboard, storytime, kinetic type,
  presenter) and ten style recipes (cave painting to analytic cubist), translated from
  huashu-art-motion and named after the look, never an artist or channel.
- **easel-motion styles synthwave, liquid, aurora-glass and hud** (Easel originals after
  mg-styles-15's style notes; decision D17), each with a 6 s demo in 9:16 and 16:9 and a golden
  frame. Eleven styles in all.
- **easel-motion `ui-motion` skill:** CSS-first UI motion, GSAP when there is a sequence or scroll
  (the eight official GSAP skills as references, from greensock/gsap-skills), patterns from
  designskills' motion-design, reduced motion always, previewed offline as a paused timeline and
  checked with qa in UI mode. Example: `examples/ui-motion/card-reveal.html`.
- **easel-motion `style-match` skill:** a new style from the user's references: measure, start
  the kit (`tools/new-style.mjs`), draw the piece's own frames, compare on a proportion grid, one
  check-in, save `styles/<name>/`. A blank starter piece (`templates/blank`) runs in any style.
  Example: `examples/style-match` (three reference sheets -> the `blueprint` style -> a piece in
  9:16 and 16:9 -> comparison sheets).
- **easel-core `mux_audio` tool:** puts a score or the user's own track on a video that already
  exists (video stream copied, optional mastering, never overwrites the input).
- **easel-core:** `reducedMotion: "reduce"` on `render_still`, `render_video`, `filmstrip` and `qa`
  renders a page's reduced-motion path; `beat_grid` allows 16ths inside a piece's fast window
  (`TIMELINE.fastFrom` to `fastTo`) and fails when asked for on a piece without a BPM.
- **Licensing:** every plugin carries its own `LICENSE`; easel-core and easel-motion carry a
  `NOTICE.md` with the license texts their adapted files need, so the notices travel with an
  installed plugin.
- **Phase 2 QA (team/qa D-1):** 23 findings; 22 fixed with tests, one part rejected with a reason
  (see `docs/findings-and-decisions.md`).

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
