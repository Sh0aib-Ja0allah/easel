# Changelog

Each plugin is versioned and tagged separately as `<plugin>--v<version>`.

## Unreleased: fixes from the v1.0.0 QA review (2026-10-11)

On `main`, not yet tagged: versions are unchanged, so installed copies do not update until a
release bumps them. Decisions D27-D34 in `docs/findings-and-decisions.md`.

- **Licences and notices:** the shipped `Apache-2.0.txt` (root, core, design, illustrate) was an
  edited copy and is now the official text, checked by hash; GSAP's non-open-source licence is
  named at setup and in the notices; STIX Two's reserved-name and trademark lines; full huashu
  copyright line; missing attribution headers; one grammar no longer describes a known channel's
  mascot; "manim-style" wording replaced.
- **easel-core:** `qa` measures each element's own text, skips visually hidden text and skip
  links, reads every CSS colour format, fails a named check it cannot run and bounds its
  thresholds; inline pages no longer collide or overwrite files; qa's media inputs must be local
  files; output names cannot leave the job folder; `__ready` from external scripts is honoured and
  `ASSETS_READY` times out; failed videos leave no partial file; page-declared lengths and sizes
  are bounded; renders run in UTC/en-US with seeded `crypto`; CLI refuses prototype keys and keeps
  strings as strings; new `embed_fonts` tool.
- **easel-ai-media:** paid calls need the quote of a dry run of the same request; the voice-clone
  gate refuses Easel's own output, silence, too-short recordings and refusing statements; refs
  must be images inside the project; keys never follow redirects to other hosts; nothing paid is
  overwritten or lost; fixtures are described as synthetic.
- **easel-pixel:** marked Preview; its docs say the local bridge accepts commands from any program
  while it runs (the "Lua off" setting only hides the MCP tool).
- **easel-motion / design / illustrate:** wordmark and label SVGs are delivered with their fonts
  embedded; ui-motion ends in a critique; style samples captured after their write-ons; stronger
  brand, font and contrast lints with text-safe colours in the design systems; `svg-check`
  accepts valid SVG it used to reject; `build.mjs` mixes multi-line kits and string `mix` values.
- **Repository:** CI cache path fixed; the install check pins the pushed commit, checks
  `claude mcp list` and the easel-core dependency install; a version-consistency test; docs
  reconciled (tasks and roadmap list what is deferred or below threshold).

Fixes from the full check of `972821c` (2026-10-11, report Q-01..Q-44), also unreleased.
Decisions D35-D47.

- **Safety and data loss:** `mux_audio` can no longer overwrite its own input through a link or a
  case-variant name, and writes every output through a partial file renamed into place; engine
  outputs are never written through a link. The voice-clone gate needs an English statement with
  a consenting sentence that names the speaker and carries no refusal word, refuses other
  languages with an explicit message, and also recognises Easel's own speech by its decoded sound.
  Quotes are signed with a per-install key and cover the bytes of every reference and sample; the
  dry run shows every quoted field; each provider either sends an argument as quoted or refuses
  it before any spend; a paid result is reported even when bookkeeping fails, and an empty result
  is an error that says it may have been charged; references are parsed to their end and hard
  links are refused.
- **Gates that lied:** `qa` text_clipping measures the letters, not the font's line box; contrast
  scores each line on its own, measures form fields, shadow DOM and filtered text, lists what it
  cannot measure, and fails a named contrast check that measured nothing; inactive controls and
  art marked `data-easel-bleed` are exempt and listed; canvas_text refuses an incomplete TIMELINE;
  media checks run without blocking the server. SVG files must be well-formed XML in the engine,
  `svg-check` and `embed_fonts`; SVG SMIL animation is seeked; a dark render of an SVG has a dark
  page; wrapper pages go in the job folder, never beside the user's files.
- **Skills that could not finish:** `filmstrip` reads local video files; `assemble` and the
  engine's mastering land on -14 LUFS (measured gain and a true-peak limiter, not loudnorm), and
  `assemble` takes narration per clip or per time; `embed_fonts` takes HTML pages, and the design
  skills that deliver HTML deliver the `-embedded.html`; design skills run qa at the piece's own
  size with `fixedFrame`; synthwave, liquid and aurora-glass call qa with `castMaxRatio: 1`;
  image and ai-video end in a critique; allowed-tools gaps closed.
- **Routing:** one tie-break sentence in each skill of every overlapping pair (favicons, sprites,
  charts, loaders and hover effects, "a video", looping animation, product shots, reviewing UI
  motion, empty states) and new routing eval cases.
- **Docs, lints and small items:** name lints catch CLAUDE.md's own examples after folding
  accents and dashes; design systems name only bundled weights (checked); `svg-check` fails XML
  errors, more external-reference forms and email-unsafe elements, and accepts honest labels;
  linyaosky-derived example SVGs carry attribution; easel-pixel's Preview text is one string on
  every surface and its `doctor` installs nothing; CI gained a tree-hygiene step and a Node 20
  runtime job; `scripts/release-check.mjs` reports plugins changed since their tag without a
  version bump; engine, CLI and argument bounds tightened (render_pdf sizes, `t`, seeds, crops,
  points, `lufsMin`/`lufsMax`, cancellation).

## 1.0.0: easel-core, easel-motion, easel-design, easel-illustrate, easel-ai-media, easel-pixel (2026-10-11)

The first stable release of the whole marketplace. Every plugin is 1.0.0; the five that build on
easel-core require `^1.0.0`.

- Repository: `scripts/install-check.mjs` and a CI job install the marketplace into an empty Claude Code
  config on Windows, macOS and Linux and use every plugin from its installed copy; a notices test
  ties every adapted file to THIRD_PARTY_NOTICES.md and its plugin's NOTICE.md; a gallery of
  Easel's own examples (`docs/gallery.md`).
- Docs reconciled with what shipped (architecture's provider layer, HANDOFF status, roadmap and
  tasks with their commits); the §1.5 legal checklist is ticked with its evidence; the full eval
  suite with a no-plugin baseline is summarised in `docs/evals-v1.md`.
- Not done by the project and listed for the owner: live paid provider calls, drawing in a
  licensed Aseprite, a test on a real Mac.

## easel-design 0.3.0, easel-illustrate 0.3.0, easel-ai-media 0.4.0, easel-pixel 0.4.0 (2026-10-11)

All four need easel-core 0.2.0 or later.

- **easel-design 0.3.0:** thirteen skills (`design` entry, `social-graphic`,
  `poster`, `ad-creative`, `infographic`, `presentation`, `ui-design`, `landing-page`,
  `design-system`, `brand-identity`, `logo`, `icons`, `directions`) built on code output rendered
  by the engine, with references adapted from designskills, Anthropic's canvas-design and
  theme-factory, and code-katz's logo method; ten generic design systems (`systems/`); an OKLCH
  palette tool; an example per skill rendered and checked by the tests; fourteen routing evals.
- **easel-illustrate 0.3.0:** five skills (`illustrate` entry, `svg`,
  `svg-illustration`, `concept-illustration`, `generative-art`) adapted from linyaosky's svg-skill
  (its bar chart example fixed), upbrew's svg-creator (Apache-2.0, modified), the Peanut
  Illustrations method (with a neutral mascot of Easel's own) and Anthropic's algorithmic-art; an
  SVG checker (`tools/svg-check.mjs`); an example per skill; seven routing evals.
- **easel-ai-media 0.4.0:** the `media` MCP server (Node, no dependencies) with
  adapters for Gemini, OpenAI, fal.ai, Replicate, Atlas Cloud and ElevenLabs on the user's own keys
  (environment or masked plugin settings, sent only to each provider's own hosts); every generation
  a dry run with a cost estimate first, a spending limit above which an approved amount is needed,
  checked result URLs, a job log, provenance for every file and no overwrites; four skills
  (`providers`, `image`, `ai-video` adapted from vox-director as the editorial collage look,
  `voice` with a consent gate for cloning: the owner's statement and recording, checked) and
  `assemble` (clips, captions, narration and ducked music with the local ffmpeg). Tested with
  recorded responses; no live calls yet.
- **easel-pixel 0.4.0:** four skills (`pixel` entry, `pixel-draw`,
  `pixel-animate`, `pixel-export`) and three agents adapted from with-pebbly's aseprite-ai-artist,
  driving the user's own Aseprite through the pinned `@pebbly/aseprite-ai-artist` 0.8.0, which a
  Node launcher installs into the plugin data folder from a shipped lockfile (no npx; Lua execution
  off); the look-nudge and session-status hooks with matchers for Easel's tool names; five evals.
  Not affiliated with Aseprite or Igara Studio.

## easel-motion 0.2.0 (2026-10-11)

First release: code-drawn animation and video. Needs easel-core 0.2.0.

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

## easel-core 0.2.0 (2026-10-11)

The engine side of Phase 2, used by easel-motion.

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
- **easel-core `mux_audio` tool:** puts a score or the user's own track on a video that already
  exists (video stream copied, optional mastering, never overwrites the input).
- **easel-core `render_pdf` tool:** print PDFs from a page (posters, cards, decks): the page's
  `@page` size, a paper format or explicit sizes, one page per CSS page break.
- **easel-core qa `fixedFrame`:** a fixed-size graphic whose content runs past its frame fails
  `frame_overflow` (scrolling pages are unaffected). SVGs drawn in `currentColor` follow the
  theme (dark ink on light cells, light ink on dark) in `render_still` and `contact_sheet`.
- **easel-core:** `reducedMotion: "reduce"` on `render_still`, `render_video`, `filmstrip` and `qa`
  renders a page's reduced-motion path; `beat_grid` allows 16ths inside a piece's fast window
  (`TIMELINE.fastFrom` to `fastTo`) and fails when asked for on a piece without a BPM.
- **easel-core:** p5.js 1.11.13 is installed by doctor and served offline to pages that load any
  p5 1.x from a CDN (2.x and p5.sound are refused with a message). `mux_audio` reports the
  result's loudness. `filmstrip` and `render_video` measure a plain page's or SVG's length from its
  CSS animations when it declares none; an SVG prints at its own size in `render_pdf`; the wrapper
  page written beside an image or SVG is always removed.

Both releases:

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
