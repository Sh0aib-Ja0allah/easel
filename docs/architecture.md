# Architecture

> Status: draft · Last updated: 2026-10-11 · Plugin facts were checked against the Claude Code docs on 2026-10-11 (links inline).

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
│   │   ├── engine/               # Node: MCP server + CLI, render, audio, providers
│   │   ├── craft/                # shared rulebooks (anti-generic, type, colour, a11y, motion)
│   │   ├── rubrics/              # critique rubrics per domain
│   │   └── schemas/              # brief.json, beats.json, cues.json, brand.md
│   ├── easel-motion/
│   │   ├── skills/{animate,style-match,ui-motion}/
│   │   ├── kit/                  # the animate renderer (core, morph, board, score)
│   │   ├── styles/<id>/{STYLE.md,kit.js,sample.png,demo/}
│   │   ├── templates/            # starter pieces and a starter style
│   │   ├── tools/build.mjs       # assembles a piece's index.html (styles can mix)
│   │   └── grammars/<id>.md
│   ├── easel-design/
│   │   ├── skills/…              # see skill-catalog.md
│   │   └── design-systems/<id>/DESIGN.md   # generic styles only (D8)
│   ├── easel-illustrate/
│   ├── easel-ai-media/
│   └── easel-pixel/
├── plugins/<plugin>/evals/       # claude plugin eval suites live inside each plugin (the CLI's default)
├── docs/                         # planning docs (this folder)
├── LICENSE                       # MIT
├── THIRD_PARTY_NOTICES.md        # from docs/third-party-notices-draft.md
└── README.md
```

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

- `source` paths are relative to the marketplace root, and `..` is rejected.
- `strict` stays at its default (`true`), so each `plugin.json` is the main manifest.

### `plugin.json` (example)

Reference: <https://code.claude.com/docs/en/plugins/manifest-reference>

```json
{
  "name": "easel-motion",
  "displayName": "Easel Motion",
  "version": "0.1.0",
  "description": "Code-drawn animation and video, style catalog, UI motion",
  "author": { "name": "Sh0aib-Ja0allah" },
  "repository": "https://github.com/Sh0aib-Ja0allah/easel",
  "license": "MIT",
  "keywords": ["animation", "video", "motion-graphics"],
  "dependencies": ["easel-core"]
}
```

**Versioning.** Once `version` is set, users only receive updates when it is bumped. Every release therefore bumps `version` and tags `<plugin>--v<version>` with `claude plugin tag --push`. Dependency version ranges resolve against those tags. See <https://code.claude.com/docs/en/plugins/dependencies>.

## 3. How plugins share code

**Constraint.** Installed plugins are copied into a cache, so `../shared` imports break. See <https://code.claude.com/docs/en/plugins/loading>. Symlinks between plugins are dereferenced at install, but creating them on Windows needs Developer Mode or an elevated prompt, so they're a poor fit for contributors.

**Design:**

1. **`easel-core` owns all shared code.** Its `engine/` directory holds the render engine, audio, provider layer, schemas and QA scripts.
2. **The other plugins declare `"dependencies": ["easel-core"]`.** Installing `easel-motion` then pulls in core automatically.
3. **Core exposes the engine as an MCP server** (`.mcp.json`, stdio, `node ${CLAUDE_PLUGIN_ROOT}/engine/server.mjs`). Other plugins' skills call its tools by full name, for example `mcp__plugin_easel-core_easel__render`.
4. **The same engine also runs as a CLI** (`node …/engine/cli.mjs`) for long jobs and scripting.
5. **Shared rulebooks** (`craft/`, `rubrics/`, `schemas/`) are read through an MCP resource or tool (`easel.craft(name)`), not by file path. That way they work from any plugin.

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
- `window.__ready = true` signals that fonts and assets have loaded.
- The engine tells a page which format it is rendering in `window.__easel.aspect` (`'16:9'`, `'9:16'`, `'1:1'`, `'4:5'`, or `null` for the page's own size), so a piece can lay itself out per format instead of being cropped.

### Implementation (decision D7 = B, 2026-10-11)

**Our own capture loop.** Playwright launches Chromium's headless shell from `${CLAUDE_PLUGIN_DATA}`, opens the page, waits for `__ready` and `document.fonts.ready`, and for each frame `n` seeks to `t = n / fps` (`renderAt(t)`, else `renderFrame(t)`, else every `__timelines` entry with `seek(t, false)`, then every Web Animation's `currentTime`). It screenshots each frame and pipes the frames to ffmpeg. Motion blur, if wanted, comes from sub-frame sampling. HyperFrames was evaluated and not adopted; see [spikes/hyperframes.md](spikes/hyperframes.md). Its composition format is supported so compositions stay portable.

### MCP tools (draft)

| Tool | Purpose |
| --- | --- |
| `doctor` | Check Node, Chromium, ffmpeg and optional tools; report Windows fixes |
| `render_still` | HTML/SVG/canvas → PNG at given sizes; light/dark |
| `contact_sheet` | Many renders or sizes on one sheet (logo 16–512 px, storyboard panels) |
| `render_video` | Page + duration + fps + aspect ratios → MP4 (and ProRes with alpha, v2) |
| `filmstrip` | Frames at chosen times side by side, so a vision model can review motion |
| `qa` | Measured checks: text clipping, contrast, canvas text (cut off, overlapping, under the phone UI) and beat grid for canvas pieces, dead or still stretches, loudness, colour-cast gate |
| `audio_score` | Cue sheet → synthesized music and SFX → WAV mastered to −14 LUFS |
| `measure_image` | Reference images → trimmed copies, size and aspect, exact palette with shares, sampled points, accent families (for matching a look) |
| `compare_images` | A reference and our frame side by side on a 10% proportion grid, with both palettes |
| `craft` | Return a craft rulebook or rubric by name |
| `generate` | Provider-layer call (§6); used by `easel-ai-media` |

### Determinism

- Every page receives a seed.
- Without a seed, `Math.random` and `Date.now` are banned in kits.
- Fonts are local or embedded, never loaded from a CDN at render time.

### Audio

- **Preferred: port `mgaudio` (Python) to Node.** It's the most complete synthesizer and mastering chain among the sources.
- **If porting is too costly:** make Python an *optional* dependency that only `score` needs, and keep a simple JS synth (like animate's) as the default.
- Track this as task T2.4.

### Setup and caching

- **First run:** `doctor` installs engine `node_modules` and Playwright Chromium into `${CLAUDE_PLUGIN_DATA}`. That directory survives plugin updates; `${CLAUDE_PLUGIN_ROOT}` changes on every update.
- **ffmpeg:** we check for it on the system rather than bundling it. `doctor` prints install commands, including `winget install --id Gyan.FFmpeg -e` on Windows.

## 5. Optional external pieces

| Piece | How | Notes |
| --- | --- | --- |
| Aseprite bridge | `easel-pixel/.mcp.json` → `npx -y @pebbly/aseprite-ai-artist@<pinned> serve` | The user installs the Lua extension once (`npx @pebbly/aseprite-ai-artist install-extension`). Their hook matchers are rewritten for our tool names. |
| HyperFrames | Not a dependency (D7 = B). Users may install it themselves; Easel compositions follow its format | Apache-2.0; credited for the composition-format idea |
| Image/video/voice APIs | Provider layer (§6) | Bring your own key |
| Figma / Canva / Recraft / Hugging Face MCP | Documented as optional backends in `easel-ai-media:providers` | No bundled config; the user installs these themselves |

## 6. Provider layer (decision D3)

```text
generate({ kind: image|video|tts|stt|music|bg-remove|upscale, model?, prompt, refs?, size?, seconds?, voice? })
  → { files[], cost_estimate, provider, model }
```

**Adapters (v1):**

- Gemini (image)
- OpenAI (image, TTS)
- fal.ai (image, video, lip-sync)
- Replicate (image, video)
- Atlas Cloud (everything vox-director uses)
- ElevenLabs (voice)

**Keys and configuration:**

- Keys come from environment variables (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `FAL_KEY`, `REPLICATE_API_TOKEN`, `ATLASCLOUD_API_KEY`, `ELEVENLABS_API_KEY`) or from the plugin's `userConfig`.
- Keys are never written to project files.

**Required behaviour:**

- Show the **cost estimate before spending**, as vox's host mode does.
- Ask for confirmation when the estimate exceeds a threshold the user sets.
- No watermarks or tracking parameters.
- **Voice cloning requires an explicit consent statement** from the voice owner, logged in the job folder.

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
- **Python:** call it as `python` rather than `python3`, and only for optional features.
- **CI:** run engine smoke tests on `windows-latest`, `ubuntu-latest` and `macos-latest` (task T1.6).

## 10. Testing

- **`claude plugin validate . --strict`:** run in CI on every push. See <https://code.claude.com/docs/en/plugins/cli-reference>.
- **`claude plugin eval`:** for each plugin, cases in `plugins/<plugin>/evals/<case>/prompt.md` with `graders/*.md`; engine tools are answered by mocks in `plugins/<plugin>/evals/mocks/easel/`. See <https://code.claude.com/docs/en/plugin-evals>.
  - Routing cases check that the right skill triggers, using the `tool_used` grader.
  - Output cases check `file_exists`, plus a regex or llm judge.
  - A baseline run without the plugin shows what the plugin adds.
  - Evals are real model calls, so they run on demand and before releases, not on every push.
- **Engine unit tests:** golden-frame image comparisons for each style kit.
