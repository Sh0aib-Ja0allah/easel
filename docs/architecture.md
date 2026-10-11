# Architecture

> Status: reflects v1.0.0 (2026-10-11); QA fixes after v1.0.0 in progress · Plugin facts were checked against the Claude Code docs on 2026-10-11 (links inline). Where this file and the code differ, the code is right.

## 1. Repo layout

```text
easel/
├── .claude-plugin/
│   └── marketplace.json          # one marketplace, six plugins
├── plugins/
│   ├── easel-core/
│   │   ├── .claude-plugin/plugin.json
│   │   ├── skills/{setup,brief,brand,critique,score}/SKILL.md
│   │   ├── agents/critic.md
│   │   ├── .mcp.json             # the "easel" MCP server (render engine)
│   │   ├── engine/               # Node: MCP server + CLI (server.mjs, cli.mjs, tools.mjs, lib/), tests
│   │   ├── craft/                # shared rulebooks (anti-generic, typography, colour, accessibility, motion)
│   │   ├── rubrics/              # critique rubrics per domain
│   │   ├── schemas/              # brief, beats, cues, provenance (*.schema.json), brand.template.md
│   │   ├── fonts/                # bundled OFL fonts
│   │   └── LICENSE, NOTICE.md, licenses/
│   ├── easel-motion/
│   │   ├── skills/{animate,style-match,ui-motion}/
│   │   ├── kit/                  # the animate renderer (core, morph, board, score)
│   │   ├── styles/<id>/{STYLE.md,kit.js,sample.png,demo/}
│   │   ├── recipes/<id>.md       # looks written down, no kit yet
│   │   ├── templates/            # starter pieces and a starter style
│   │   ├── tools/{build,new-piece,new-style}.mjs   # build assembles a piece's index.html (styles can mix)
│   │   ├── grammars/<id>.md
│   │   └── examples/, test/
│   ├── easel-design/
│   │   ├── skills/…              # see skill-catalog.md
│   │   ├── systems/<id>/DESIGN.md   # generic styles only (D8)
│   │   ├── tools/palette.mjs     # OKLCH palette tool
│   │   └── examples/, test/
│   ├── easel-illustrate/         # skills/, tools/svg-check.mjs, examples/, test/
│   ├── easel-ai-media/           # skills/, .mcp.json + server/ (the "media" provider server, D22), test/
│   └── easel-pixel/              # skills/, agents/, hooks/, .mcp.json + server/launch.mjs (D23), test/
├── plugins/<plugin>/evals/       # claude plugin eval suites live inside each plugin (the CLI's default)
├── docs/                         # planning docs, decisions, eval report (this folder)
├── scripts/install-check.mjs     # clean install of the marketplace into an empty Claude Code config
├── spikes/                       # code of the HyperFrames and Windows spikes (T0.4, T0.5)
├── licenses/Apache-2.0.txt
├── LICENSE                       # MIT
├── THIRD_PARTY_NOTICES.md
├── CHANGELOG.md, CONTRIBUTING.md, CLAUDE.md
└── README.md
```

Every plugin also carries its own `LICENSE`, and those with adapted material a `NOTICE.md` (D18).

## 2. Manifests

### `marketplace.json`

Reference: <https://code.claude.com/docs/en/plugins/marketplace-reference>

```json
{
  "name": "easel",
  "owner": { "name": "Sh0aib-Ja0allah" },
  "description": "Claude Code plugins for animation, illustration, drawing, video and design",
  "plugins": [
    { "name": "easel-core",       "source": "./plugins/easel-core" },
    { "name": "easel-motion",     "source": "./plugins/easel-motion" },
    { "name": "easel-design",     "source": "./plugins/easel-design" },
    { "name": "easel-illustrate", "source": "./plugins/easel-illustrate" },
    { "name": "easel-ai-media",   "source": "./plugins/easel-ai-media" },
    { "name": "easel-pixel",      "source": "./plugins/easel-pixel" }
  ]
}
```

- Shortened: the real file also gives each plugin entry a `description`.
- `source` paths are relative to the marketplace root, and `..` is rejected.
- `strict` stays at its default (`true`), so each `plugin.json` is the main manifest.

### `plugin.json` (example)

Reference: <https://code.claude.com/docs/en/plugins/manifest-reference>

```json
{
  "name": "easel-motion",
  "displayName": "Easel Motion",
  "version": "1.0.0",
  "description": "Code-drawn animation and video, a style catalog, explainer grammars and UI motion",
  "author": { "name": "Sh0aib-Ja0allah" },
  "homepage": "https://github.com/Sh0aib-Ja0allah/easel",
  "repository": "https://github.com/Sh0aib-Ja0allah/easel",
  "license": "MIT",
  "keywords": ["animation", "video", "motion-graphics", "gsap"],
  "dependencies": [{ "name": "easel-core", "version": "^1.0.0" }]
}
```

**Versioning.** Once `version` is set, users only receive updates when it is bumped. Every release therefore bumps `version` and tags `<plugin>--v<version>` with `claude plugin tag --push`; before tagging, `node scripts/release-check.mjs` fails for any plugin whose files changed since its latest tag while its version did not ([CONTRIBUTING.md §7](../CONTRIBUTING.md#7-releases)). Since v1.0.0 the five plugins that build on core declare `{ "name": "easel-core", "version": "^1.0.0" }` (D24). In this marketplace that range is not resolved to a tag: installing easel-motion alone (CI run 38139487971, Claude Code 2.1.296) installed easel-core from the marketplace head, the same commit as easel-motion, and checked `^1.0.0` against that copy's version. So the easel-core version on `main` must satisfy every dependent's range (`versions.test.mjs` checks this), and a major bump of easel-core raises the dependents' ranges in the same commit. See <https://code.claude.com/docs/en/plugins/dependencies>.

## 3. How plugins share code

**Constraint.** Installed plugins are copied into a cache, so `../shared` imports break. See <https://code.claude.com/docs/en/plugins/loading>. Symlinks between plugins are dereferenced at install, but creating them on Windows needs Developer Mode or an elevated prompt, so they're a poor fit for contributors.

**Design:**

1. **`easel-core` owns all shared code.** Its `engine/` directory holds the render engine, audio, schema validation and QA code; the data it serves (`craft/`, `rubrics/`, `schemas/`, `fonts/`) sits beside it. The AI provider layer is the exception: it is easel-ai-media's own `media` server (D22), so keys and paid calls stay out of the plugin every user installs.
2. **The other plugins declare a dependency on core**, in the object form with a semver range: `"dependencies": [{ "name": "easel-core", "version": "^1.0.0" }]` (D24). Installing `easel-motion` then pulls in core automatically.
3. **Core exposes the engine as an MCP server** (`.mcp.json`, stdio, `node ${CLAUDE_PLUGIN_ROOT}/engine/server.mjs`). Other plugins' skills call its tools by full name, for example `mcp__plugin_easel-core_easel__render_still` (the full list is in §4).
4. **The same engine also runs as a CLI** (`node …/engine/cli.mjs`) for long jobs and scripting.
5. **Shared data is read through tools, not by file path:** rulebooks and rubrics (`craft/`, `rubrics/`) through the `craft` tool, schemas (`schemas/`) through `validate` (`schema: true`). That way they work from any plugin.

> ✅ **Verified by spike T0.3 (2026-10-11, Windows):** a skill in `easel-motion` called `mcp__plugin_easel-core_easel__ping` and got its result. Plugin MCP servers are session-wide, so the CLI-shim fallback is not needed. Plugin MCP tools are deferred, so every skill names the full tool name in its body. Details: [spikes/cross-plugin-mcp.md](spikes/cross-plugin-mcp.md).

6. **The MCP layer has no npm dependencies** (decision D9). Installed plugins are copied into a cache without `node_modules`, so `engine/server.mjs` speaks MCP's stdio JSON-RPC directly and starts on a fresh install. Heavy dependencies (Playwright) are installed by `doctor` into `${CLAUDE_PLUGIN_DATA}` and loaded from there.

## 4. Render engine (`easel-core/engine`)

### Contract

Every visual artifact is a web page that can be put into an exact state at any time `t`:

- **Stills** (SVG, HTML layouts, canvas art): rendered once at `t = 0`.
- **Animation**, one of these forms:
  - `window.renderAt(t)` (the mg-styles-15 contract), or
  - `window.renderFrame(t)` (the animate kit's canvas contract, easel-motion), with `window.TIMELINE` (or `window.__composition`) giving `width`, `height`, `fps` and `duration`; `window.renderAudioWav()` returns the piece's score as a base64 WAV, which `render_video` uses with `audio: "page"`; `window.ASSETS_READY` (a promise) holds rendering until embedded images are decoded, or
  - the HyperFrames composition contract: a root element with `data-composition-id`, `data-start`, `data-duration`, `data-width`, `data-height` (optional `data-fps`), and a paused GSAP timeline at `window.__timelines[<composition id>]`. CSS animations and transitions on the page are seeked through the Web Animations API (`animation.currentTime`).
- `window.__ready = true` signals that fonts and assets have loaded. The engine waits for it when the page assigns `__ready` before load (an init-script setter sees the assignment) or a script names it (an inline script, or a local external script read from disk, matching the whole word `__ready`); it always waits for the load event, `document.fonts.ready` and decoded images.
- Time `t` is in seconds. The seek order is `renderAt(t)`, else `renderFrame(t)`, else every `__timelines` entry, then every CSS animation and the SMIL clock of every outermost `<svg>` (paused and set to `t`).
- The engine tells a page which format it is rendering in `window.__easel.aspect` (`'16:9'`, `'9:16'`, `'1:1'`, `'4:5'`, or `null` for the page's own size), so a piece can lay itself out per format instead of being cropped.

### Implementation (decision D7 = B, 2026-10-11)

**Our own capture loop.** Playwright launches Chromium's headless shell from `${CLAUDE_PLUGIN_DATA}`, opens the page, waits for `__ready` and `document.fonts.ready`, and for each frame `n` seeks to `t = n / fps` (`renderAt(t)`, else `renderFrame(t)`, else every `__timelines` entry with `seek(t, false)`, then every Web Animation's `currentTime` and the SMIL clock of every outermost `<svg>`). It screenshots each frame and pipes the frames to ffmpeg. The engine itself does no motion blur; the animate kit's `renderFrame(t, canvas, sub)` can draw sub-frame times for it. HyperFrames was evaluated and not adopted; see [spikes/hyperframes.md](spikes/hyperframes.md). Its composition format is supported so compositions stay portable.

### MCP tools

Fifteen tools, defined in `plugins/easel-core/engine/tools.mjs`, each named `mcp__plugin_easel-core_easel__<tool>`. Fourteen shipped in v1.0.0; `embed_fonts` was added after it in the QA fixes (D32) and is in no v1.0.0 tag.

| Tool | Purpose |
| --- | --- |
| `ping` | Health check: engine version, Node version, platform |
| `doctor` | Check Node, Playwright and Chromium, ffmpeg and ffprobe, and optional tools (Python, Aseprite, provider keys by name); with `install: true`, install the pinned npm packages and Chromium into the data folder |
| `render_still` | HTML/SVG/canvas → PNG at given sizes; light/dark |
| `contact_sheet` | Many renders or sizes on one sheet (logo 16–512 px, storyboard panels) |
| `render_video` | Page + duration + fps + aspect ratios → MP4 (and ProRes with alpha, v2) |
| `filmstrip` | Frames at chosen times side by side, from a page or a local video file, so a vision model can review motion |
| `qa` | Measured checks: text clipping, contrast, canvas text (cut off, overlapping, under the phone UI) and beat grid for canvas pieces, dead or still stretches, loudness, colour-cast gate |
| `audio_score` | Cue sheet → synthesized music and SFX (warm, bright or retro) → WAV mastered to −14 LUFS |
| `mux_audio` | Put a track (a score or the user's own) on a video that already exists; the video stream is copied |
| `measure_image` | Reference images → trimmed copies, size and aspect, exact palette with shares, sampled points, accent families (for matching a look) |
| `compare_images` | A reference and our frame side by side on a 10% proportion grid, with both palettes |
| `craft` | Return a craft rulebook or rubric by name |
| `render_pdf` | A page or SVG → print PDF at its `@page` size, a paper format or explicit sizes |
| `validate` | Schema validation of brand/brief/beats/cues/provenance files, or the schema itself (`schema: true`) |
| `embed_fonts` | Make an SVG or HTML page carry the bundled fonts its text uses: writes a `-embedded` copy whose `@font-face` rules hold, as base64 WOFF2, each family, weight and style the text really uses. Never overwrites a file; refuses a family Easel does not bundle (D32). The skills deliver that copy |

### Determinism

- Every page receives a seed: the engine replaces `Math.random` with a seeded generator (`seed`, default 1).
- `Date`, `Date.now()` and `performance.now()` return the render time `t`, not the clock.
- `crypto.getRandomValues` and `crypto.randomUUID` follow the seed as well, from a stream of their own.
- Every page runs in the UTC time zone with the `en-US` locale, whatever the machine's settings, so dates and number formats render the same on every computer (D31).
- Fonts are local or embedded, never loaded from a CDN at render time. The headless browser is offline: names do not resolve and other requests are blocked; GSAP and p5.js URLs are answered from the copies `doctor` installed.

### Audio

- **Decided (D16, T2.4): a JavaScript synth in the engine.** Scores are synthesized with Web Audio in the engine's offline browser and mastered to -14 LUFS (two-pass loudnorm). Animate pieces carry their own score (`render_video` `audio: "page"`); `audio_score` turns a cue sheet into one. mgaudio (Python) was not ported; Python is not needed.
- Two renders of one score match to within a few LSB of 16-bit audio (Chromium's Web Audio rounding), not byte for byte.

### Setup and caching

- **First run:** `doctor` (asked for by the `setup` skill) installs the pinned npm packages (`playwright-core` 1.64.0, `gsap` 3.14.2, `p5` 1.11.13) and the Playwright Chromium headless shell into `${CLAUDE_PLUGIN_DATA}`. That directory survives plugin updates; `${CLAUDE_PLUGIN_ROOT}` changes on every update. Easel does not ship these packages (D10); GSAP is under GreenSock's "standard no-charge" license (<https://gsap.com/standard-license>), not an open-source licence.
- **ffmpeg:** we check for it on the system rather than bundling it. `doctor` prints install commands, including `winget install --id Gyan.FFmpeg -e` on Windows.

## 5. Optional external pieces

| Piece | How | Notes |
| --- | --- | --- |
| Aseprite bridge | `easel-pixel/.mcp.json` → `node ${CLAUDE_PLUGIN_ROOT}/server/launch.mjs serve`, which runs the pinned `@pebbly/aseprite-ai-artist` 0.8.0 installed in the data folder (D23) | The pixel skill runs `launch.mjs setup` once: `npm ci` from the shipped lockfile, then the package's Lua extension. Their hook matchers are rewritten for our tool names. Needs Node 22.6+. The launcher hides the package's `run_lua` tool, but the package's local bridge (127.0.0.1:9932) has no authentication, so any local process can still send it commands, including Lua (see the D23 correction). |
| HyperFrames | Not a dependency (D7 = B). Users may install it themselves; Easel compositions follow its format | Apache-2.0; credited for the composition-format idea |
| Image/video/voice APIs | Provider layer (§6) | Bring your own key |

## 6. Provider layer (decisions D3, D22)

easel-ai-media's own MCP server (`media`, `plugins/easel-ai-media/server/`, Node, no npm
dependencies) with five tools:

```text
providers()                       keys set (names only), kinds, models, prices and their sources, the limit
estimate({ kind, provider?, model?, size?, quality?, seconds?, text?, count? })  -> { usd, basis, source }
generate({ kind: image|video|tts|music|voice-clone, ..., confirm?, approvedUsd?, slug?, name? })
  -> without confirm: a dry run { estimate, request, next }; with confirm: { files[], estimate }
assemble({ clips[], narration? (file | [{file, clip|start}]), music?, musicDb?, lufs?, overlays[], size, fps })  -> one film mastered to -14 LUFS (local ffmpeg)
consent_template()                -> the statement a voice owner gives before cloning
```

**Adapters (v1):** Gemini (image), OpenAI (image, TTS), fal.ai (image, image-to-video), Replicate
(image), Atlas Cloud (image, image-to-video, TTS, music), ElevenLabs (TTS with word timings, voice
clone). Prices for estimates are in `server/prices.json`, each with its source and a checked date
or `verify`.

**Keys and configuration:** environment variables (`GEMINI_API_KEY` or `GOOGLE_API_KEY`,
`OPENAI_API_KEY`, `FAL_KEY`, `REPLICATE_API_TOKEN`, `ATLASCLOUD_API_KEY`, `ELEVENLABS_API_KEY`) or
masked `userConfig` fields (stored in the system's credential store) passed as
`EASEL_CFG_<PROVIDER>`. Keys are never written to disk, are masked in every output, and are sent
only to each provider's own https hosts.

**Required behaviour (implemented and tested offline with synthetic fixtures):** the test fixtures are hand-written responses shaped from each provider's documentation, not recordings of live calls. No live call has been made, so the adapters are not yet checked against the live APIs.

- Every generation is a dry run with a cost estimate until the user confirms; above the limit
  (`max_spend_usd`, default 0.5 USD) or for an unpriced model an approved amount is also needed.
- URLs a provider returns are checked (https, no local or private addresses, redirects checked,
  size cap, media types); every paid job is logged in `jobs.jsonl`; paid files are never
  overwritten; every file gets a `provenance.json` entry; job folders stay inside the project.
- **Voice cloning requires the voice owner's consent statement and a recording of it**, in the
  job folder, checked before any call; every clone is logged in `consent-log.jsonl`.
- No watermarks or tracking parameters. Live calls have not been run by the project (they need the
  owner's keys and budget).

## 7. Shared data formats (`easel-core/schemas`)

| File | Owner skill | Purpose | Based on |
| --- | --- | --- | --- |
| `.easel/brand.md` | `brand` | Brand context in DESIGN.md sections: colours, type, logo usage, voice, layout identity, anti-references | designskills `design-context`, open-design `DESIGN.md` |
| `brief.json` | `brief` | Intake answers: subject, audience, formats, look, voice, music, constraints | animate intake |
| `beats.json` | `brief` | Ordered beats: text, visual intent, duration, grammar, approval state | vox-director `beats.json` |
| `cues.json` | `animate`, `score` | fps, BPM, key, named frames; shared by picture and sound | mg-styles-15 `cues.json` |
| `provenance.json` | every exporter | Source, model, prompt, licenses of inputs per asset | code-katz manifest |

**Job folder:** each job writes to `./easel-out/<slug>/` in the user's project. Nothing goes to `/tmp`, which matters on Windows.

## 8. Quality loop

Every visual skill ends with the same loop:

> render → look (`filmstrip` / `contact_sheet`) → `qa` measurements → `critic` agent with the domain rubric → fix → re-render → deliver with numbers

**Hard gates** (delivery is refused until they pass):

- Text clipping (DOM text, and text a canvas piece draws: `canvas_text`)
- Cuts and morphs off the 8th-note grid in canvas pieces (`beat_grid`)
- Contrast below WCAG AA for UI work
- An empty or still frame run longer than N seconds in video
- More than 30% of frames with a blue-purple cast (from huashu)
- Loudness outside −16 to −12 LUFS

## 9. Windows requirements

- **Node scripts only.** No bash-only or PowerShell-only scripts in the plugins.
- **Paths:** use `path.join` and never hardcode `/tmp`, `/usr/bin` or Mac font paths.
- **Fonts:** ship OFL fonts inside the plugin, so we don't depend on system fonts.
- **Python:** not needed by any Easel feature (D16: audio is synthesized in the engine). `doctor` still reports it as optional, for the user's own scripts.
- **CI:** every plugin's test suite runs on `windows-latest`, `ubuntu-latest` and `macos-latest` (task T1.6 started it with the engine), plus a clean install of the marketplace on all three on pushes to `main` (T5.5).

## 10. Testing

- **`claude plugin validate . --strict`:** run in CI on every push. See <https://code.claude.com/docs/en/plugins/cli-reference>.
- **`claude plugin eval`:** for each plugin, cases in `plugins/<plugin>/evals/<case>/prompt.md` with `graders/*.md`; engine tools are answered by mocks in `plugins/<plugin>/evals/mocks/easel/`. See <https://code.claude.com/docs/en/plugin-evals>.
  - In v1.0.0 nearly every case is a routing case: a `tool_used` grader checks that the right skill triggered, plus an LLM judge on the reply (57 cases at v1.0.0; 71 after the review fixes, which added routing cases for overlapping skills: 77 `tool_used`, 61 `llm`, 7 `regex` and 2 `file_exists` graders). The engine mocks write no files, so only two easel-core `brand` cases check an output file (`.easel/brand.md`); design, illustrate, ai-media and pixel cases judge the plan in the reply. Rendered output is checked by each plugin's tests instead.
  - A baseline run without the plugin shows what the plugin adds ([evals-v1.md](evals-v1.md)).
  - Evals are real model calls, so they run on demand and before releases, not on every push.
- **Plugin tests** (`npm --prefix <engine or plugin> test`, list in CLAUDE.md): golden-frame comparisons for the engine fixtures and every motion style, every design and illustrate example rendered and checked through the engine, the provider server with synthetic fixtures, the pixel launcher with a stand-in package, and the notices test.
