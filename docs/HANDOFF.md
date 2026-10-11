# Easel: handoff for the next agent

> **Historical document.** This is the pre-build planning handoff of 2026-10-11, kept for history.
> It is superseded by [CLAUDE.md](../CLAUDE.md) (the binding rules for every session) and
> [tasks.md](tasks.md) (what is done and what is deferred). Where this file differs from them, from
> the code or from [findings-and-decisions.md](findings-and-decisions.md), they are right.
> Sections 6-12 describe the machine, the CLI and the next steps as they were before Phase 0; they
> are not instructions.

> **Written:** 2026-10-11, at the end of the planning sessions in Claude Code.
> **For:** a Claude agent (Claude Desktop / Cowork) continuing the work with no memory of earlier sessions.
> **Read this first, then the docs it links to.** Everything here was true on 2026-10-11. Re-check anything you rely on.

---

## 1. What Easel is (30-second version)

Easel is a **public, open-source Claude Code plugin marketplace** for creative work: animation, illustration, drawing, video and design. It doesn't start from scratch. It adapts the best parts of 13 existing open-source GitHub plugins and skills into one consistent, well-credited set of **six plugins**.

| Plugin | Purpose |
|---|---|
| `easel-core` | Shared foundation: planning check-ins, brand context, render engine (MCP server), audio, critic agent, craft rules |
| `easel-motion` | Code-drawn animation and video, a style catalog, explainer grammars, UI motion (GSAP) |
| `easel-design` | Graphic, UI, social, posters, decks, design systems, logos, icons, brand identity |
| `easel-illustrate` | SVG illustration and characters, concept illustration with a mascot, generative art |
| `easel-ai-media` | AI images, video and voice using the user's **own** API keys (its own provider server, D22) |
| `easel-pixel` | Pixel art in Aseprite (optional; Aseprite is a paid app) |

**Status (2026-10-11):** Phases 0-5 are built. All six plugins are in the repo with their tests,
evals and notices; CI runs on Windows, macOS and Linux, including a clean install of the
marketplace. Releases are tagged per plugin (`<plugin>--v<version>`; see CHANGELOG.md). What the
project could not do itself is listed in the run report: live paid provider calls (needs the
owner's keys and budget), drawing in a licensed Aseprite, and a test on a real Mac (CI covers
macOS). Decisions D1-D26 are in findings-and-decisions.md. The sections below are the original
planning handoff, kept for history; where they differ, the code, CHANGELOG and
findings-and-decisions.md are right.

---

## 2. Where everything is

| Thing | Location |
|---|---|
| GitHub repo (public) | https://github.com/Sh0aib-Ja0allah/easel (branch `main`) |
| Local working copy | `C:\Users\shoib\Desktop\Collection\Animation` |
| Planning docs | `docs/` in the repo (map in §9) |
| Owner's Obsidian vault | `C:\Users\shoib\Desktop\SecondBrain`. Project note: `Projects/Creative Plugin Marketplace.md` (alias "Easel"). Dev logs: `Dev Logs/2026-10-10 - …` and `Dev Logs/2026-10-11 - …` |
| GitHub account | `Sh0aib-Ja0allah` (the `gh` CLI is logged in on this machine) |

### Commits so far (on `main`)

| Commit | Content |
|---|---|
| `69b1c5f` | README + vision, sources (13 repos), findings and decisions |
| `b072932` | Skill catalog, architecture, roadmap, tasks, third-party notices draft |
| `c9a7f25` | MIT `LICENSE` ("Copyright (c) 2026 Sh0aib-Ja0allah") |
| *(next)* | This handoff file |

### ⚠️ Folder trap: read this before running any git command

`C:\Users\shoib\Desktop\Collection\` is itself a git repo with **no commits**. It holds private material: `KEY.keystore`, `GRANTS/`, `CS/`, PDFs and media.

`Animation\` has its **own separate repo** (`git init` was run inside it). Two rules follow:

- Always run git **inside `Animation\`**.
- **Never** run `git add`, `commit` or `push` from `Collection\`.

To check, run `git rev-parse --show-toplevel` before any git command. It must print `C:/Users/shoib/Desktop/Collection/Animation`.

---

## 3. The owner and how they like to work

- **Owner:** GitHub `Sh0aib-Ja0allah` (email `info@menatal.com`). On Windows 11.
- **How sessions have gone:** they asked for a **planning-only** session first: only `.md` docs, plus creating the repo. That planning phase is now finished. **Ask them before writing code**, unless they've told you directly to start building.
- **Decisions:** they choose quickly from options with a recommendation. Give a recommended option first, with a short reason.
- **Writing for them:** they want the result and the next step, not process narration.
- **Confirm first:** anything outward-facing, such as pushing, publishing, or creating repos, packages or releases.
- **Commit messages:** end each one with a `Co-Authored-By:` line naming the model that wrote it, as the earlier commits do. Never skip hooks.
- **Vault logging** (their standing rule, if you can reach the vault): when a work item finishes or a real decision is made, add a dev log to `SecondBrain/Dev Logs/YYYY-MM-DD - <description>.md`.
  - Follow the conventions in the vault's `_CLAUDE.md`. AI-first notes need a `## For future Claude` preamble, frontmatter with `type`, `date`, `tags` and `ai-first: true`, and `[[wikilinks]]`.
  - In those notes, use plain `-` dashes and straight quotes, never em-dashes or curly quotes.
  - Also update `Projects/Creative Plugin Marketplace.md` (Recent Activity, Key Decisions) and that day's `Daily/YYYY-MM-DD.md`.
  - When writing vault files from PowerShell, **never** use `-Encoding utf8` (Windows PowerShell 5.1 adds a BOM, which breaks Obsidian). Use a normal file-write tool, or write UTF-8 without a BOM.

---

## 4. Decisions already made: don't re-open these

All of these are recorded in [findings-and-decisions.md](findings-and-decisions.md).

| ID | Decision |
|---|---|
| D1 | **A marketplace with several plugins** (the six above), not one big plugin. The other plugins declare `"dependencies": ["easel-core"]`. *(Shipped form since v1.0.0: the object form `[{"name": "easel-core", "version": "^1.0.0"}]`, see D24.)* |
| D2 | **Render engine runtime: Node + Playwright** (+ ffmpeg). |
| D3 | **A provider layer where users bring their own key** for images, video **and** audio. No vendor lock-in, no watermark or tracking tags. Show a cost estimate before spending. |
| D4 | **English-first.** Translate Chinese source content while porting it. |
| D5 | More sources were collected; design, illustration and drawing are now covered. |
| D6 | **Name: Easel. License: MIT** for our own code and docs. Apache-2.0 material keeps its license, with notices. |
| D7 | **Test HyperFrames first** (task T0.4). If it passes on Windows, depend on it as the render engine. If not, build our own engine using its contract as a model. *(Outcome: B, Easel's own Playwright loop, decided by Claude for the owner after the spike; the owner's confirmation is pending. See D7.)* |
| D8 | **Ship only generic design systems.** No copies of real brands (Stripe, Apple, Linear…). |

---

## 5. Hard rules: legal, safety, platform

Breaking any of these causes real problems. The full checklist is in [findings-and-decisions.md](findings-and-decisions.md) §1.5, with per-source detail in [sources/](sources/).

### Licensing

- **No text may be copied from unlicensed repos.** `b1rdmania/claude-brand-skills` and `VicUgochukwu/brand-design-skill` are ideas-only. Rewrite everything in our own words.
- **MIT sources:** keep the copyright line and the MIT notice in `THIRD_PARTY_NOTICES.md`. The exact lines are already collected in [third-party-notices-draft.md](third-party-notices-draft.md). `peanut-illustrations` needs **two** notices: Aishwarya Ashok **and** Ian.
- **Apache-2.0 sources** (`upbrew-tech/svg-creator-skill`, `nexu-io/open-design`, `heygen-com/hyperframes`, `anthropics/skills`):
  - ship `licenses/Apache-2.0.txt`
  - keep the copyright and NOTICE lines
  - put a **"Modified by Easel"** header in every changed file
- **Take each skill from its original repo, not from a copy:**
  - Anthropic's skills (`algorithmic-art`, `canvas-design`, `slack-gif-creator`, `theme-factory`) → from `anthropics/skills`
  - GSAP skills → from `greensock/gsap-skills` (MIT)
  - **Not** via open-design or b1rdmania.
- **Trace before using:** the open-design skills `shader-dev`, `hand-drawn-diagrams` and `threejs` have unknown origins. Find their original repo and license first.
- **Use upstream, not the fork:** `Vidyard/open-design` is an outdated fork. Use `nexu-io/open-design`.

### Never copy or ship

- **Character and brand imagery:**
  - huashu-art-motion character assets: `demos/_shared/hero/`, `long_scroll/frames/`, `assets/角色/`, `lib/rig_huashu.js`
  - the Mario/Nintendo showcase
  - the Clawd fan work
  - the peanut and Xiaohei characters and their example images
- **Real people:** vox-director's Ronaldo/CR7 examples, and its docs on getting around model content filters.
- **Unsourced media:** mg-styles-15 media with no stated source.

### Naming

Never name a style after a trademark or a living or protected creator. Use descriptive names instead.

| Avoid | Use instead (example) |
|---|---|
| Vox | editorial collage |
| Ghibli | watercolour anime |
| Kusama | polka-dot pop |
| Haring | bold-line street art |

The same applies to Shinkai, Kirby, Dalí and "Mario-style".

### Safety

- **Voice cloning:** never clone a voice without a recorded consent statement from the voice owner.
- **Affiliation:** state that Easel is **not affiliated** with Aseprite / Igara Studio.

### Platform

**Windows is a must**, not a nice-to-have.

- Write tooling in Node, with no bash-only scripts.
- Never hardcode `/tmp`, `/usr/bin` or Mac font paths.
- Bundle OFL fonts with the plugin.
- Write job output to `./easel-out/<slug>/`.
- Store first-run installs (node_modules, Chromium) in `${CLAUDE_PLUGIN_DATA}`. `${CLAUDE_PLUGIN_ROOT}` changes on every update.

---

## 6. Verified Claude Code plugin facts (checked 2026-10-11)

> **Historical (2026-10-11, before the build).** Sections 6-12 are kept as they were written. They
> are superseded by [CLAUDE.md](../CLAUDE.md) (rules and the verified plugin facts) and
> [tasks.md](tasks.md) (status): Phases 0-5 are done or deferred, ffmpeg and the newer Claude Code
> CLI were installed during the build, and "what to do next" no longer applies.

These come from the official docs at https://code.claude.com/docs. Use them instead of guessing.

### Marketplace

- File: `.claude-plugin/marketplace.json` at the repo root. Required fields: `name`, `owner.name`, `plugins[]`.
- Each plugin entry needs `name` and `source`. A relative path such as `"./plugins/easel-core"` is resolved from the marketplace root, and `..` is rejected.
- `strict` defaults to `true`.

### plugin.json

- File: `plugins/<name>/.claude-plugin/plugin.json`. Only `name` is required (kebab-case).
- Useful optional fields: `displayName`, `version`, `description`, `author`, `homepage`, `repository`, `license`, `keywords`, `dependencies`, `userConfig`.
- **Dependencies exist:** `"dependencies": ["easel-core"]` or `[{"name": "easel-core", "version": "~0.1.0"}]`.
  - Version ranges resolve against git tags named `<plugin>--v<version>`.
  - Create those tags with `claude plugin tag --push`.
- If `version` is set, users get no updates until you bump it.

### Sharing code

- Installed plugins are **copied into a cache**, so `../shared` imports don't work.
- Symlinks between plugins are dereferenced, but creating them on Windows needs Developer Mode.
- That's why `easel-core` runs the engine as an **MCP server**.

### Default component locations

All relative to the plugin root:

- `skills/<name>/SKILL.md`
- `agents/*.md`
- `hooks/hooks.json`
- `.mcp.json`
- `bin/`
- `commands/` (`skills/` is preferred for new work)

### SKILL.md frontmatter

- Fields: `name`, `description`, `when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `allowed-tools`, `model`, `effort`, `context`, `agent`, `hooks`, `paths`, `shell`.
- `description` + `when_to_use` are cut off at **1,536 characters** in the skill listing.

### Names

- A skill is invoked as `/<plugin>:<skill>`, e.g. `/easel-motion:animate`.
- An MCP tool is named `mcp__plugin_<plugin>_<server>__<tool>`. Characters outside `A-Z a-z 0-9 _ -` become `_`.
- **Not documented:** whether one plugin's skills can see another plugin's MCP tools. Spike **T0.3** must test this.

### Environment variables

- `${CLAUDE_PLUGIN_ROOT}`: the install directory; it changes with each version.
- `${CLAUDE_PLUGIN_DATA}`: persistent; it survives updates.
- `${CLAUDE_PROJECT_DIR}`
- `${CLAUDE_SKILL_DIR}`
- These are substituted in hooks, MCP config and skill bodies. They are **not** set inside Bash tool commands.

### Commands

- **Install:**
  ```text
  /plugin marketplace add Sh0aib-Ja0allah/easel
  /plugin install easel-core@easel
  ```
  To update: `claude plugin update …`, then `/reload-plugins`.
- **Validate:** `claude plugin validate <path> --strict`.
- **Eval:** `claude plugin eval` runs `evals/<case>/prompt.md` against `graders/*.md`.
  - Needs **Claude Code ≥ 2.1.269**. This machine had **2.1.261** on 2026-10-11, so update it first.
  - Every eval is a real model call.

---

## 7. Machine state (checked 2026-10-11)

| Tool | Status |
|---|---|
| Node | v22.21.0 ✅ (aseprite's MCP needs ≥ 22.6) |
| npm | 10.9.4 ✅ |
| Playwright (via npx) | 1.64.0 ✅ |
| Python | 3.12.10 (only optional features need it) |
| git | 2.51.1 ✅ |
| gh | 2.96.0, logged in as `Sh0aib-Ja0allah` ✅ |
| Claude Code CLI | 2.1.261. **Update it** to get `claude plugin eval` |
| **ffmpeg** | ❌ **Not installed.** Needed for video. Suggest `winget install ffmpeg` (ask the owner first). |
| Aseprite | Not checked. Only needed for `easel-pixel` (Phase 4). |

**Line endings:** git warns that LF will be replaced by CRLF. Harmless, but you may want to add a `.gitattributes` with `* text=auto eol=lf` in T0.2.

---

## 8. What to do next: Phase 0

Full table: [tasks.md](tasks.md). Phase goals and exit criteria: [roadmap.md](roadmap.md).

| ID | Task | Done when |
|---|---|---|
| ~~T0.1~~ | ~~License~~ | ✅ Done (`c9a7f25`) |
| **T0.2** | Repo skeleton (steps below) | `claude plugin validate . --strict` passes |
| **T0.3** | Spike: can one plugin's skill call another plugin's MCP tool? | Results in `docs/spikes/cross-plugin-mcp.md` |
| **T0.4** | Spike: HyperFrames as the render engine | Results in `docs/spikes/hyperframes.md`; D7 decided |
| **T0.5** | Spike: Windows toolchain | Results in `docs/spikes/windows.md` |
| **T0.6** | CI: GitHub Actions runs `claude plugin validate --strict` on push | Green check on `main` |
| **T0.7** | `CONTRIBUTING.md` with the skill-writing rules | File committed |

**Suggested order:** T0.2 → T0.3 → T0.5 → T0.4 → T0.6 → T0.7. T0.3 is first among the spikes because its answer can change the architecture.

### T0.2: repo skeleton

1. Add `.claude-plugin/marketplace.json`, using the example in [architecture.md](architecture.md) §2.
2. Add `plugins/easel-{core,motion,design,illustrate,ai-media,pixel}/.claude-plugin/plugin.json`, each with:
   - `"version": "0.0.1"`
   - `"license": "MIT"`
   - `"repository": "https://github.com/Sh0aib-Ja0allah/easel"`
   - `"dependencies": ["easel-core"]` on every plugin except core
3. Add a short `README.md` to each plugin, and `.gitattributes`.
4. Run `claude plugin validate . --strict` and fix any errors.
5. Commit, then **ask the owner before pushing**.

### T0.3: cross-plugin MCP spike

1. In `easel-core`, add `.mcp.json` with a stdio server `easel`: `node ${CLAUDE_PLUGIN_ROOT}/engine/server.mjs`.
2. Expose one tool, `ping`, using `@modelcontextprotocol/sdk`.
3. In `easel-motion`, add a test skill that calls `mcp__plugin_easel-core_easel__ping`.
4. Install the local marketplace:
   ```text
   /plugin marketplace add ./
   /plugin install easel-core@easel
   /plugin install easel-motion@easel
   ```
5. Run the skill in a new session.
6. Record the result. **If the tool isn't reachable,** use the fallback in [architecture.md](architecture.md) §3: each plugin calls the core CLI through a small shim.

### T0.4: HyperFrames spike

Repo: https://github.com/heygen-com/hyperframes (Apache-2.0, ~60k★). Under `spikes/hyperframes/`:

1. Install it as a pinned npm dependency.
2. Render one canvas style. A good choice is `cut-paper` from https://github.com/cth9191/animate, driving the canvas from the GSAP timeline.
3. Render one SVG/CSS animation.
4. Output a 5-second MP4 at 30 fps, on Windows.
5. Record: install friction, render time, determinism (do two renders hash the same?), the Windows issues you hit, and the license/NOTICE requirements.
6. Recommend A (depend on HyperFrames) or B (our own Playwright loop with `window.renderAt(t)`).

### T0.5: Windows spike

Check:

- that Playwright Chromium can be installed into a folder like `${CLAUDE_PLUGIN_DATA}` (`PLAYWRIGHT_BROWSERS_PATH`)
- that ffmpeg is detected on PATH, with a clear install message when it's missing
- that bundled OFL fonts load in headless Chromium
- that long paths and spaces in paths work (`C:\Users\shoib\Desktop\…`)
- that nothing writes to `/tmp`

After Phase 0, build in this order: Phase 1 (`easel-core` MVP, v0.1.0) → Phase 2 (`easel-motion`) → Phase 3 (`easel-design` + `easel-illustrate`) → Phase 4 (`easel-ai-media` + `easel-pixel`) → Phase 5 (v1.0.0 release).

---

## 9. Doc map: read in this order

| # | Doc | Why read it |
|---|---|---|
| 1 | [vision.md](vision.md) | What Easel is, goals, non-goals |
| 2 | [findings-and-decisions.md](findings-and-decisions.md) | Overlaps between sources, coverage, the **legal checklist §1.5**, all decisions D1–D8 |
| 3 | [skill-catalog.md](skill-catalog.md) | The 34 v1 skills and 4 agents per plugin, with source mapping, and the libraries for styles, grammars and design systems |
| 4 | [architecture.md](architecture.md) | Layout, manifests, code sharing, engine contract and MCP tools, provider layer, data formats, quality loop, Windows, testing |
| 5 | [roadmap.md](roadmap.md) | Phases 0–5 with exit criteria |
| 6 | [tasks.md](tasks.md) | Every task with "done when" and dependencies |
| 7 | [sources.md](sources.md) + [sources/](sources/) | One summary row and one detailed note per source repo. **Read the relevant note before porting from that repo.** |
| 8 | [third-party-notices-draft.md](third-party-notices-draft.md) | Copyright lines and obligations; fill in upstream SHAs as you port |

---

## 10. Source repos (quick reference)

| # | Repo | License | Feeds |
|---|---|---|---|
| 1 | https://github.com/cth9191/animate | MIT | motion (base workflow, 7 styles), core (check-ins, QA) |
| 2 | https://github.com/Alisa0808/vox-director | MIT | ai-media (`ai-video`), core (`beats.json`) |
| 3 | https://github.com/alchaincyf/huashu-art-motion | MIT (with exclusions) | motion (35 styles, 9 grammars, quality gates). Chinese; translate it |
| 4 | https://github.com/Vincentwei1021/mg-styles-15 | MIT | motion (style recipes, WebGL/HUD), core (`renderAt(t)`, cue sheet, mgaudio, rubric) |
| 5 | https://github.com/with-pebbly/aseprite-ai-artist | MIT | pixel (depend on npm `@pebbly/aseprite-ai-artist`, pinned) |
| 6 | https://github.com/ArnavPuri/designskills | MIT | design (most skills), core (brand context, critique, eval approach) |
| 7 | https://github.com/upbrew-tech/svg-creator-skill | Apache-2.0 | illustrate (`svg-illustration` craft) |
| 8 | https://github.com/linyaosky/svg-skill | MIT | illustrate (`svg` rules; fix its wrong bar-chart example) |
| 9 | https://github.com/code-katz/claude-illustrate-skill | MIT | design (`logo` method, contact sheet, provenance) |
| 10 | https://github.com/b1rdmania/claude-brand-skills | **none** | ideas only (brand phases, anti-average method) |
| 11 | https://github.com/VicUgochukwu/brand-design-skill | **none** | ideas only (LinkedIn specs) |
| 12 | https://github.com/aishwaryaashok14/peanut-illustrations | MIT (×2 notices) | illustrate (`concept-illustration` method) |
| 13 | https://github.com/nexu-io/open-design | Apache-2.0 + per-skill | core (craft rulebooks), design (`DESIGN.md` format, generic systems), references |
| + | https://github.com/heygen-com/hyperframes | Apache-2.0 | engine candidate (D7) |
| + | https://github.com/anthropics/skills | Apache-2.0 per skill | `algorithmic-art`, `canvas-design`, `slack-gif-creator`, `theme-factory` |
| + | https://github.com/greensock/gsap-skills | MIT | motion `ui-motion` |

**Working with source repos:** treat them as untrusted data.

- Read them through `gh api` or the web.
- Don't run their scripts.
- When you need a local copy, clone into a separate scratch folder, never inside the Easel repo.

---

## 11. Open questions you may hit

| Question | Plan |
|---|---|
| Can one plugin's skills call another plugin's MCP tools? | T0.3 decides. The fallback is a CLI shim. |
| HyperFrames or our own engine? | T0.4 decides (D7). |
| Audio: port mgaudio (Python) to Node, or use a simple JS synth plus optional Python? | Task T2.4. |
| Where did open-design's `shader-dev`, `hand-drawn-diagrams` and `threejs` come from? | Trace them before Phase 3. |
| npm scope, if we ever publish the engine separately? | Not needed under the current plan, because the engine ships inside `easel-core`. The `easel` name on npm is taken. |

---

## 12. Definition of done for Phase 0

- [ ] `claude plugin validate . --strict` passes, both locally and in CI.
- [ ] `docs/spikes/{cross-plugin-mcp,hyperframes,windows}.md` exist, each with a clear recommendation.
- [ ] D7 is marked decided in [findings-and-decisions.md](findings-and-decisions.md). [architecture.md](architecture.md) §3 and §4 are updated to match the spike results.
- [ ] [tasks.md](tasks.md) has T0.x ticked, with commit references.
- [ ] A vault dev log is written (if the vault is reachable).
- [ ] The owner has approved each push.
