# CLAUDE.md - Easel

The binding contract for any Claude session working in this repo. Written 2026-10-11 on the owner's
direct order from `docs/HANDOFF.md` §3, §5 and §6. Only the owner changes the rules here; a session
may update the **Commands** section as new gates land, nothing else.

Easel is a public, MIT-licensed Claude Code plugin marketplace for animation, illustration,
drawing, video and design: six plugins (`easel-core`, `easel-motion`, `easel-design`,
`easel-illustrate`, `easel-ai-media`, `easel-pixel`) under `plugins/`, one
`.claude-plugin/marketplace.json` at the root. Planning docs are in `docs/` (map: HANDOFF §9).

## Folder trap (read before any git command)

- `C:\Users\shoib\Desktop\Collection\` is a **different** git repo holding private files
  (`KEY.keystore`, `GRANTS/`, `CS/`). Never run git there.
- This repo is `C:\Users\shoib\Desktop\Collection\Animation`, branch `main`, remote
  `https://github.com/Sh0aib-Ja0allah/easel`.
- Before any git write, `git rev-parse --show-toplevel` must print
  `C:/Users/shoib/Desktop/Collection/Animation`.

## Owner and how to work

- Owner: GitHub `Sh0aib-Ja0allah`, on Windows 11.
- Ask before writing code and before pushing, unless the owner has told you directly to build
  and push in that session.
- Decisions: offer options with the recommended one first and a one-line reason.
- Report the result and the next step, not process narration.
- Confirm before anything outward-facing (publishing, new repos, packages, listings).
- Decisions D1-D8 in `docs/findings-and-decisions.md` are final. Record any new decision there
  with who made it and the date.

## Hard rules (HANDOFF §5)

### Licensing

- **No text from unlicensed repos.** `b1rdmania/claude-brand-skills` (#10) and
  `VicUgochukwu/brand-design-skill` (#11) are ideas only: rewrite everything in our own words.
- **MIT sources:** keep the copyright line and MIT notice in `THIRD_PARTY_NOTICES.md` (lines are
  collected in `docs/third-party-notices-draft.md`). `peanut-illustrations` needs two notices:
  Aishwarya Ashok **and** Ian.
- **Apache-2.0 sources** (`upbrew-tech/svg-creator-skill`, `nexu-io/open-design`,
  `heygen-com/hyperframes`, `anthropics/skills`): ship `licenses/Apache-2.0.txt`, keep copyright and
  NOTICE lines, and put a "Modified by Easel" header in every changed file.
- **Every adapted file** gets an attribution header naming the source repo, the pinned SHA and the
  license.
- **Take each skill from its original repo:** Anthropic skills from `anthropics/skills`; GSAP
  skills from `greensock/gsap-skills`. Never via open-design or #10.
- **Trace before using:** open-design `shader-dev`, `hand-drawn-diagrams`, `threejs` - find the
  original repo and license first, or defer.
- Use `nexu-io/open-design`, not the `Vidyard/open-design` fork.
- Re-check a source's LICENSE at the SHA you port from; pin every source to a SHA.

### Never copy or ship

- huashu-art-motion character assets: `demos/_shared/hero/`, `long_scroll/frames/`, `assets/角色/`,
  `lib/rig_huashu.js`; the Mario/Nintendo showcase; the Clawd fan work; the peanut and Xiaohei
  characters and their example images.
- vox-director's Ronaldo/CR7 examples and its docs on getting around model content filters.
- mg-styles-15 media with no stated source.

### Naming

Never name a style, system or file after a trademark or a living or protected creator. Use
descriptive names: Vox -> editorial collage, Ghibli -> watercolour anime, Kusama -> polka-dot pop,
Haring -> bold-line street art. Same for Shinkai, Kirby, Dalí, "Mario-style". Design systems are
generic only (D8): no Stripe, Apple, Linear or other real brands.

### Safety

- Never clone a voice without a recorded consent statement from the voice owner, logged in the
  job folder.
- State that Easel is not affiliated with Aseprite / Igara Studio.
- Never make live paid API calls without the owner's keys and budget; never write keys to disk or
  print them in logs.

### Platform (Windows is a must)

- Tooling in Node; no bash-only or PowerShell-only scripts inside plugins.
- Never hardcode `/tmp`, `/usr/bin` or Mac font paths; use `path.join` / `os.tmpdir()` only where a
  temp dir is truly needed.
- Bundle OFL fonts; no CDN at render time.
- Job output goes to `./easel-out/<slug>/`.
- First-run installs (node_modules, Chromium) go to `${CLAUDE_PLUGIN_DATA}`, never
  `${CLAUDE_PLUGIN_ROOT}` (it changes on every update). These variables are substituted in hooks,
  MCP config and skill bodies, **not** inside Bash tool commands.
- `.gitattributes` keeps text files LF (`core.autocrlf` is true on the owner's machine).

## Verified Claude Code plugin facts (HANDOFF §6, checked 2026-10-11)

- Marketplace: `.claude-plugin/marketplace.json`; required `name`, `owner.name`, `plugins[]`; each
  entry needs `name` and `source`; `source` is `./plugins/easel-...` relative to the repo root;
  `..` is rejected; `strict` defaults to true.
- `plugins/<name>/.claude-plugin/plugin.json`: only `name` is required (kebab-case). Optional:
  `displayName`, `version`, `description`, `author`, `homepage`, `repository`, `license`,
  `keywords`, `dependencies`, `userConfig`.
- `"dependencies": ["easel-core"]`; version ranges resolve against tags `<plugin>--v<version>`,
  created with `claude plugin tag --push`. Once `version` is set, users get no update until it is
  bumped.
- Installed plugins are copied into a cache: no `../shared` imports. Shared code lives in
  `easel-core` and is reached through its MCP server (see `docs/architecture.md` §3 and the T0.3
  spike).
- Component locations: `skills/<name>/SKILL.md`, `agents/*.md`, `hooks/hooks.json`, `.mcp.json`,
  `bin/`, `commands/`.
- SKILL.md frontmatter: `name`, `description`, `when_to_use`, `argument-hint`, `arguments`,
  `disable-model-invocation`, `user-invocable`, `allowed-tools`, `model`, `effort`, `context`,
  `agent`, `hooks`, `paths`, `shell`. `description` + `when_to_use` are cut at 1,536 characters.
- Skills are invoked as `/<plugin>:<skill>`; MCP tools are `mcp__plugin_<plugin>_<server>__<tool>`.

## Git

- Stage by path only; never `git add -A` / `git add .`.
- No force-push, no history rewrite, no `git reset --hard`, no `git clean`, never skip hooks.
- Before every commit: show-toplevel check, `git fetch` and `git log HEAD..origin/main` empty.
- Commit message style (from `git log`): imperative subject under ~60 characters, blank line, a
  short body (prose or `-` bullets) wrapped at ~72 columns, then the trailer
  `Co-Authored-By: <model name> <noreply@anthropic.com>` naming the model that wrote it.
- Never commit secrets, caches, `node_modules`, renders outside fixtures/goldens, or `easel-out/`.

## Commands

Gates - run before every commit, never commit red:

- `git rev-parse --show-toplevel` -> `C:/Users/shoib/Desktop/Collection/Animation`
- `node --check <file>` on every changed `.mjs` / `.js` file (except the score fragments
  `plugins/easel-motion/kit/score-head.js` and `score-tail.js`, which only compile inside a built
  piece; the easel-motion tests build every demo)
- `claude plugin validate . --strict` and `claude plugin validate plugins/<each> --strict` (since T0.2)
- `npm --prefix plugins/easel-core/engine test` (since T1.1). Render tests need Playwright and
  Chromium in the data dir (`node plugins/easel-core/engine/cli.mjs doctor --install`, or set
  `EASEL_DATA` to a folder where doctor installed them); without them they are skipped, so a
  local run must show 0 skipped before a render change is committed.
- `npm --prefix plugins/easel-motion test` (since T2.1): builds every demo and template, renders
  every style through the engine (golden frame per style: its `sample.png`, or a per-OS override
  in `test/golden/`), checks the page score's loudness and style mixing. Same data dir and
  0-skipped rule as the engine tests. `EASEL_MOTION_FULL=1` renders the demos at full length (CI
  on Linux does).
- `npm --prefix plugins/easel-design test` (since T3.1): the skills (names, routing length, engine
  tools, links, attribution headers), the generic design systems (valid DESIGN.md, AA text,
  bundled faces, no brand names), the palette tool, and every example in `examples/manifest.json`
  rendered and checked through the engine. Same data dir and 0-skipped rule.
- `npm --prefix plugins/easel-illustrate test` (since T3.5): the skills and attribution, the SVG
  checker, every example in `examples/manifest.json` through the engine, and the p5.js loop
  (seekable, seamless, MP4). Needs p5.js in the data dir (doctor installs it). Same 0-skipped rule.
- `npm --prefix plugins/easel-ai-media test` (since T4.1): the `media` server with synthetic
  provider fixtures shaped from each provider's docs (no network, fake keys that must never appear
  in output; the adapters are not yet checked against live APIs), the spending
  limit, the voice-clone consent gate and its refusals, assembly with ffmpeg, and the skills,
  attribution and settings. Never run live paid calls from the tests.
- `npm --prefix plugins/easel-pixel test` (since T4.5): the launcher for the pinned
  `@pebbly/aseprite-ai-artist` (a stand-in package, no network), the hooks, and the skills,
  agents, settings and attribution. Drawing with a real Aseprite is the owner's end-to-end check.
- The engine tests include `notices.test.mjs` (since T5.1): every adapted file's source and commit
  must be in `THIRD_PARTY_NOTICES.md` and its plugin's `NOTICE.md`; Apache files say "Modified by
  Easel" and their plugin ships the official licence text (checked by hash). `versions.test.mjs`
  (since the v1.0.0 QA): plugin versions are semver and agree with the engine and media servers,
  and every dependency on easel-core is `{name, version: ^x.y.z}` that core satisfies.
- `node scripts/install-check.mjs --work <empty folder> [--expect-sha <commit>]` (since T5.5):
  installs the marketplace from GitHub (what is on `main` now, not the working tree) into an empty
  Claude Code config, uses every plugin from its installed copy, checks `claude mcp list`
  connects the engine and media servers, and installs easel-motion alone into a second config to
  check easel-core arrives as a dependency (needs network; run before a release, not per commit).
- CI (`.github/workflows/ci.yml`): `validate plugins` (ubuntu), `engine` (every plugin's tests) on
  ubuntu, windows and macos, and on pushes to main `clean install` (install-check with
  `--expect-sha`) on all three.

After every push (once CI exists): `gh run list --branch main --limit 3`, then `gh run view <id>`
until green. A green local run is not enough once CI exists.

Before each release: `claude plugin eval` for the plugins in that release (real model calls; once
per release, not per commit; report the cost from `evals/results/<timestamp>/aggregate-result.json`).

Tree integrity after each batch: no 0-byte source file; no `git diff --numstat` row with deletions
and zero additions.

## Vault logging (owner's standing rule)

When a work item finishes or a real decision is made, write a dev log in the owner's vault
`C:\Users\shoib\Desktop\SecondBrain` with `/obsidian-log`; if that isn't available, write plain
Markdown to `Dev Logs/YYYY-MM-DD - <description>.md` following the vault's `_CLAUDE.md`
(frontmatter `type`, `date`, `tags`, `ai-first: true`; a `## For future Claude` preamble;
`[[wikilinks]]`; plain `-` dashes and straight quotes; UTF-8 without BOM - never
`-Encoding utf8` from Windows PowerShell 5.1). Also update `Projects/Creative Plugin Marketplace.md`
(Recent Activity, Key Decisions) and that day's `Daily/YYYY-MM-DD.md`.
