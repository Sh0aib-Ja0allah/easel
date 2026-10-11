# Tasks

> Status: draft · Last updated: 2026-10-11 · Phases: [roadmap.md](roadmap.md)

Task IDs are `T<phase>.<n>` and stay the same even if tasks are reordered. **Done when** describes the result we can check. **Needs** lists the tasks that must be finished first.

## Phase 0: Foundations and spikes

| ID | Task | Done when | Needs |
| --- | --- | --- | --- |
| T0.1 | ✅ Done 2026-10-11: MIT `LICENSE` added and README updated. `licenses/Apache-2.0.txt` was added with the first Apache-derived files (craft rulebooks, QA C-1 fixes). | `LICENSE` committed; README updated | |
| T0.2 | ✅ Done (`68c062e`). Repo skeleton: `.claude-plugin/marketplace.json`, six `plugins/easel-*/.claude-plugin/plugin.json` (with `dependencies: ["easel-core"]` on the others), placeholder READMEs | `claude plugin validate . --strict` passes locally | T0.1 |
| T0.3 | ✅ Done (`647e91f`). **Spike: cross-plugin MCP visibility.** Core exposes a dummy MCP tool; a skill in `easel-motion` calls it by full name | Written result in `docs/spikes/cross-plugin-mcp.md`; architecture §3 updated | T0.2 |
| T0.4 | ✅ Done (`fcc7dda`; D7 = B, own loop). **Spike: HyperFrames** on Windows. Render one animate canvas style and one SVG/CSS animation as compositions, and install it as a pinned npm dependency | `docs/spikes/hyperframes.md` with timings, Windows notes and a recommendation; D7 decided | |
| T0.5 | ✅ Done (`7caf801`). **Spike: Windows toolchain.** Playwright Chromium install into `${CLAUDE_PLUGIN_DATA}`, ffmpeg detection, font loading, long paths | `docs/spikes/windows.md` | T0.2 |
| T0.6 | ✅ Done (`2f2cce4`; workflow updated in `59b017e`, CI run 38092897533 green). CI: GitHub Actions running `claude plugin validate --strict` on push | Green check on `main` | T0.2 |
| T0.7 | ✅ Done (`59b017e`). `CONTRIBUTING.md`: skill authoring rules (frontmatter, routing lines, render → look → critique ending, attribution header for adapted files) | File committed | T0.2 |

## Phase 1: easel-core MVP

| ID | Task | Done when | Needs |
| --- | --- | --- | --- |
| T1.1 | ✅ Done (`3cd9ed8`, CI 38094001682). Engine skeleton: MCP server (stdio) + CLI sharing one module; `doctor` tool | `doctor` reports Node/Chromium/ffmpeg status on Windows/macOS/Linux | T0.3, T0.5 |
| T1.2 | ✅ Done (`f5de4e3`, CI 38094643853). `render_still` + `contact_sheet` (sizes, light and dark) | Golden image test passes | T1.1 |
| T1.3 | ✅ Done (`44f2159`, CI 38094979188). `render_video` + `filmstrip` (our own Playwright loop, D7 = B) | 5 s, 30 fps MP4 from a `renderAt(t)` page and from a GSAP timeline page | T1.1, T0.4 |
| T1.4 | ✅ Done (`459ec0c`, CI 38095269491). `qa` checks: text clipping, contrast, stillness, colour-cast, loudness | Each check has a failing and a passing fixture | T1.2, T1.3 |
| T1.5 | ✅ Done (`ec6df72`, CI 38095553577). Schemas: `brand.md`, `brief.json`, `beats.json`, `cues.json`, `provenance.json` + validators | JSON Schema files + tests | T1.1 |
| T1.6 | ✅ Done (`ed0323d` + `2c5878f`, CI 38096017881: 68 tests, 0 skipped on all three). Cross-OS CI smoke tests for the engine | Windows/macOS/Linux jobs green | T1.3 |
| T1.7 | ✅ Done (`01562ee`, CI 38096376410). Craft rulebooks (anti-generic, typography, colour, a11y, motion), merged from open-design `craft/`, huashu gates and the anti-average ideas (rewritten) | Files in `craft/` with attribution headers; `craft` tool serves them | T1.1 |
| T1.8 | ✅ Done (`62f1a53`; QA fixes `3ab529a`, `7acc756`; eval 12/12 cases, mean 0.94, run 2026-10-11T00-43-15). Skills: `setup`, `brief`, `brand`, `critique` + `critic` agent + rubrics | Routing evals pass (≥ 3 cases each) | T1.2–T1.7 |
| T1.9 | ✅ Done (tag `easel-core--v0.1.0`). Release v0.1.0 (bump version, `claude plugin tag --push`) | Tag `easel-core--v0.1.0` exists | T1.8 |

## Phase 2: easel-motion v1

| ID | Task | Done when | Needs |
| --- | --- | --- | --- |
| T2.1 | ✅ Done (`e3948c4` + `953a665`; engine 90 tests, easel-motion 25, 0 skipped). Port animate's kit + 7 styles to the engine contract (fix the shared-globals issue so styles can mix) | Each style renders its demo; golden frames stored | T1.3 |
| T2.2 | `animate` skill (entry), using `brief` check-ins, grammars and the quality loop | Topic → reviewed MP4 in 16:9 + 9:16 | T2.1, T1.8 |
| T2.3 | `style-match` (new-style procedure + reference breakdown) | Builds a style from 3 reference images; comparison sheet output | T2.1 |
| T2.4 | Audio decision + `score` skill: port mgaudio to Node **or** a JS synth with optional Python | Cue sheet → mastered WAV in the −16 to −12 LUFS range | T1.5 |
| T2.5 | Translate and rename the first ~10 huashu styles + the 9 grammars | English `STYLE.md` + grammar files; no creator names in style names | T2.1 |
| T2.6 | Port the mg-styles recipes that only exist there: liquid, aurora-glass, synthwave, HUD | Each renders on the engine | T2.1 |
| T2.7 | `ui-motion` from greensock/gsap-skills + designskills motion-design | Routing + output evals pass | T1.8 |
| T2.8 | Evals for easel-motion + release v0.2.0 | Evals ≥ threshold; tag pushed | T2.2–T2.7 |

## Phase 3: easel-design and easel-illustrate v1

| ID | Task | Done when | Needs |
| --- | --- | --- | --- |
| T3.1 | Port the designskills skills, merged per [skill-catalog.md](skill-catalog.md) (13 v1 skills) | Each skill renders through the engine and calls `critique` | T1.8 |
| T3.2 | `logo` from code-katz (contact sheet on the engine), plus the brand-identity phases (rewritten ideas) | Logo job produces SVG + PNG ladder + mono + provenance | T1.2 |
| T3.3 | `directions` skill (keep/kill, blur test, anti-references) | Eval shows 3–5 structurally different outputs | T1.7 |
| T3.4 | Generic design systems in `DESIGN.md` format (no real-brand copies) | ≥ 8 systems; lint checks there are no brand names | T1.5 |
| T3.5 | `svg` (linyaosky base, chart example fixed) + `svg-illustration` (upbrew craft, Apache headers) | Filters and CSS animation verified via `filmstrip` | T1.3 |
| T3.6 | `concept-illustration` with user-supplied mascot + neutral default | Vector path works without any API key | T3.5 |
| T3.7 | `generative-art` from anthropics/skills `algorithmic-art` (+ shader recipes once their origin is traced) | p5.js sketch → PNG + loop MP4 | T1.3 |
| T3.8 | Evals for both plugins + release v0.3.0 | Evals ≥ threshold; tags pushed | T3.1–T3.7 |

## Phase 4: easel-ai-media and easel-pixel v1

| ID | Task | Done when | Needs |
| --- | --- | --- | --- |
| T4.1 | Provider layer + adapters (Gemini, OpenAI, fal.ai, Replicate, Atlas Cloud, ElevenLabs); key handling via env or `userConfig`; cost estimates | Dry-run shows cost for each adapter; no keys written to disk | T1.1 |
| T4.2 | `providers` + `image` skills (generalized from designskills image-generation) | Image generated with ≥ 2 providers | T4.1 |
| T4.3 | `ai-video` from vox-director (Windows fixes, celebrity examples and filter-workaround docs removed, style renamed) | 15 s film with one provider, with both approval gates | T4.1, T1.8 |
| T4.4 | `voice` with consent gate for cloning | Cloning refused without a logged consent statement | T4.1 |
| T4.5 | `easel-pixel`: `.mcp.json` with pinned `@pebbly/aseprite-ai-artist`, 4 skills + 3 agents adapted, hook matchers rewritten | End-to-end sprite + walk cycle on Windows | T1.8 |
| T4.6 | Evals + release v0.4.0 | Tags pushed | T4.2–T4.5 |

## Phase 5: Release v1.0.0

| ID | Task | Done when | Needs |
| --- | --- | --- | --- |
| T5.1 | Complete `THIRD_PARTY_NOTICES.md` with upstream SHAs; per-file "Modified by Easel" headers on Apache-derived files | Checklist in [third-party-notices-draft.md](third-party-notices-draft.md) is all done | all |
| T5.2 | Legal pass: findings §1.5 checklist (exclusions, renames, consent gate, no brand design systems) | Every item ticked, with a commit reference | all |
| T5.3 | User docs + gallery of our own example outputs | README links to install, per-plugin docs, gallery | all |
| T5.4 | Full eval run with baseline comparison; publish the results summary | Report committed | all |
| T5.5 | Clean-machine install test (Windows + macOS) | Both pass | all |
| T5.6 | Tag v1.0.0 for every plugin; optional community listing submission | Tags pushed | T5.1–T5.5 |
