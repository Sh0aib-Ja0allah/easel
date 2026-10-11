# Contributing to Easel

Easel is a Claude Code plugin marketplace: six plugins under `plugins/`, one
`.claude-plugin/marketplace.json`. These rules keep the skills consistent, credited and working
on Windows. The repo contract for AI sessions is [CLAUDE.md](CLAUDE.md); the design is in
[docs/architecture.md](docs/architecture.md).

## 1. Where things go

| Thing | Path |
|---|---|
| A skill | `plugins/<plugin>/skills/<skill>/SKILL.md` (+ `references/*.md` for depth) |
| An agent | `plugins/<plugin>/agents/<name>.md` |
| Engine code (Node) | `plugins/easel-core/engine/` |
| Rulebooks, rubrics, schemas | `plugins/easel-core/{craft,rubrics,schemas}/` (served by the `craft` tool) |
| Styles, grammars, design systems | data files in their plugin: `styles/<id>/`, `grammars/<id>.md`, `design-systems/<id>/DESIGN.md` |
| Eval cases | `plugins/<plugin>/evals/<case>/` (`prompt.md` + `graders/*.md`; engine mocks in `evals/mocks/easel/`) |
| Third-party credits | `THIRD_PARTY_NOTICES.md`; Apache-2.0 text in `licenses/Apache-2.0.txt` |

**Styles, grammars, design systems and rubrics are data, not skills.** Add a file, not a skill,
so the catalog grows without trigger collisions.

## 2. Writing a skill

### Frontmatter

```yaml
---
name: logo
description: >-
  Design a logo, wordmark, favicon or app icon as SVG, checked from 16 to 512 px on light and dark.
  Use for marks and icons of one brand. For a full brand system use easel-design:brand-identity;
  for icon sets use easel-design:icons.
when_to_use: The user asks for a logo, wordmark, monogram, favicon or app icon.
allowed-tools: mcp__plugin_easel-core_easel__render_still mcp__plugin_easel-core_easel__contact_sheet
---
```

- `name`: kebab-case, the folder name. It is invoked as `/<plugin>:<name>`.
- `description` + `when_to_use` together stay under **1,536 characters** (the listing cuts them).
- **Routing lines.** Every description ends with "use X instead" pointers for the nearest
  neighbouring skills. One entry skill per plugin routes to the rest.
- Other supported fields: `argument-hint`, `arguments`, `disable-model-invocation`,
  `user-invocable`, `model`, `effort`, `context`, `agent`, `hooks`, `paths`, `shell`.

### Calling the engine

- Engine tools live in `easel-core`'s MCP server and are **deferred**: name each one by its
  **full** name in the skill body, so the model can find and load it, e.g.
  `mcp__plugin_easel-core_easel__render_video`.
- Never call engine scripts by file path from another plugin: installed plugins are copied into
  separate caches. Go through the MCP tools (or the `easel` CLI that core documents).
- `${CLAUDE_PLUGIN_ROOT}` and `${CLAUDE_PLUGIN_DATA}` are substituted in skill bodies, hooks and
  MCP config, **not** inside Bash tool commands.

### Every visual skill ends the same way

> render -> **look** (`filmstrip` or `contact_sheet`) -> `qa` measurements -> `critique` (the read-only
> `critic` agent with the domain rubric) -> fix -> re-render -> deliver **with numbers**

Delivery is refused while a hard gate fails (text clipping, WCAG AA contrast for UI, a still or
empty stretch in video, colour cast, loudness outside -16 to -12 LUFS). Say what was measured.

### Output

Jobs write to `./easel-out/<slug>/` in the user's project, plus a `provenance.json` for every
exported asset (sources, models, prompts, licenses of inputs).

## 3. Animation kits and compositions

- A page is ready when it sets `window.__ready = true` after fonts and assets load.
- Animate through **one** of: `window.renderAt(t)`, or a paused GSAP timeline at
  `window.__timelines[<data-composition-id>]` (the HyperFrames composition format). CSS animations
  are seeked through the Web Animations API, so keep them declarative.
- **Deterministic:** no `Math.random()` without a seed, no `Date.now()`, no `requestAnimationFrame`
  loops, no timers. Same `t` -> same pixels.
- **No network at render time:** fonts are bundled OFL files loaded with `@font-face`; libraries
  (GSAP, p5.js) are local files, never a CDN.
- Kits must not rely on shared globals that collide when two styles share a page; namespace them.
- Every style has a demo composition and a frozen golden frame (reviewed by eye once, then frozen).

## 4. Licensing and credit

- **Our own code and docs: MIT.**
- **Take each piece from its original repo** at a pinned commit SHA, and re-check its LICENSE at
  that SHA before porting.
- **Unlicensed repos are ideas only** (`b1rdmania/claude-brand-skills`,
  `VicUgochukwu/brand-design-skill`): never copy their text; write it fresh.
- **Never ship** the excluded assets listed in CLAUDE.md ("Never copy or ship").
- **No creator or brand names** in style, system or file names: use descriptive names
  ("watercolour anime", not a studio's name). Design systems are generic only.

### Attribution header (every adapted file)

Markdown (place it right after the frontmatter, if any):

```markdown
<!--
Adapted from: cth9191/animate @ 1a2b3c4 (styles/cut-paper/STYLE.md)
License: MIT, Copyright (c) 2026 <holder>. Full notice: THIRD_PARTY_NOTICES.md
Changes: translated to English; renamed; ported to the Easel engine contract.
-->
```

JavaScript:

```js
// Adapted from: cth9191/animate @ 1a2b3c4 (styles/cut-paper/kit.js)
// License: MIT, Copyright (c) 2026 <holder>. Full notice: THIRD_PARTY_NOTICES.md
// Changes: namespaced globals; seeded randomness.
```

**Apache-2.0 sources** (`anthropics/skills`, `upbrew-tech/svg-creator-skill`,
`nexu-io/open-design`) additionally need the line `Modified by Easel (<date>): <what changed>`
in every changed file, the license text in `licenses/Apache-2.0.txt`, and their copyright and
NOTICE lines in `THIRD_PARTY_NOTICES.md`.

## 5. Windows first

- Tooling is Node only: no bash-only or PowerShell-only scripts in plugins.
- Use `path.join`; never hardcode `/tmp`, `/usr/bin`, `python3` or Mac font paths. Call `python`
  only for optional features.
- Spawning `npm`/`npx` on Windows needs `shell: true` (Node refuses `.cmd` files otherwise); prefer
  `process.execPath` with a `.js` entry point.
- First-run installs go to `${CLAUDE_PLUGIN_DATA}`, never `${CLAUDE_PLUGIN_ROOT}`.
- Text files are LF (`.gitattributes`).

## 6. Checks before a commit

```text
claude plugin validate . --strict
claude plugin validate plugins/<each plugin> --strict
node --check <every changed .mjs/.js>
npm --prefix plugins/easel-core/engine test     # once the engine has tests
```

CI runs the same on every push. Each skill needs eval cases in `plugins/<plugin>/evals/` (at least
three routing cases, plus output cases for visual skills); `claude plugin eval` makes real model calls,
so it runs before releases, not on every push.

## 7. Releases

Bump `version` in the plugin's `plugin.json` (users get nothing until it changes), then
`claude plugin tag --push` in the plugin folder to create the `<plugin>--v<version>` tag that
dependency ranges resolve against.
