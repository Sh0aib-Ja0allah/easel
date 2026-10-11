# Tasks

> Status: all tasks done or deferred (2026-10-11); QA fixes after v1.0.0 in progress · Phases: [roadmap.md](roadmap.md) · Run report: easel-runner `team/` (STATE, BACKLOG, QA reports)

Task IDs are `T<phase>.<n>` and stay the same even if tasks are reordered. **Done when** describes the result we can check. **Needs** lists the tasks that must be finished first.

Marks: ✅ done, with its commit; ⏸ **DEFERRED**, with the reason and what unblocks it. Where a ✅ task met its "Done when" only in part (mostly eval thresholds), the gap is written next to it and in [evals-v1.md](evals-v1.md).

## Phase 0: Foundations and spikes

| ID | Task | Done when | Needs |
| --- | --- | --- | --- |
| T0.1 | ✅ Done 2026-10-11 (`c9a7f25`): MIT `LICENSE` added and README updated. `licenses/Apache-2.0.txt` was added with the first Apache-derived files (craft rulebooks, QA C-1 fixes). | `LICENSE` committed; README updated | |
| T0.2 | ✅ Done (`68c062e`). Repo skeleton: `.claude-plugin/marketplace.json`, six `plugins/easel-*/.claude-plugin/plugin.json` (with `dependencies: ["easel-core"]` on the others; the object form with `^1.0.0` since v1.0.0, D24), placeholder READMEs | `claude plugin validate . --strict` passes locally | T0.1 |
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
| T1.9 | ✅ Done (`d47a823`, tag `easel-core--v0.1.0`). Release v0.1.0 (bump version, `claude plugin tag --push`) | Tag `easel-core--v0.1.0` exists | T1.8 |

## Phase 2: easel-motion v1

| ID | Task | Done when | Needs |
| --- | --- | --- | --- |
| T2.1 | ✅ Done (`e3948c4` + `953a665`; engine 90 tests, easel-motion 25, 0 skipped). Port animate's kit + 7 styles to the engine contract (fix the shared-globals issue so styles can mix) | Each style renders its demo; golden frames stored | T1.3 |
| T2.2 | ✅ Done (`2724748`; example `water-cycle` rendered in 16:9 + 9:16, qa green in both, cold critic read applied). `animate` skill (entry), using `brief` check-ins, grammars and the quality loop | Topic → reviewed MP4 in 16:9 + 9:16 | T2.1, T1.8 |
| T2.3 | ✅ Done (`51a0b2a`; example: 3 reference sheets -> `blueprint` style -> piece in 9:16 + 16:9 -> comparison sheets). `style-match` (new-style procedure + reference breakdown) | Builds a style from 3 reference images; comparison sheet output | T2.1 |
| T2.4 | ✅ Done (`1411085`; D16: JS synth, no Python; `audio_score` + `score` skill, -14 LUFS, deterministic within 8 LSB). Audio decision + `score` skill: port mgaudio to Node **or** a JS synth with optional Python | Cue sheet → mastered WAV in the −16 to −12 LUFS range | T1.5 |
| T2.5 | ✅ Done (`1411085`; 10 recipes in `recipes/`, 9 grammars in `grammars/`, test checks names and English). Translate and rename the first ~10 huashu styles + the 9 grammars | English `STYLE.md` + grammar files; no creator names in style names | T2.1 |
| T2.6 | ✅ Done (`2a6c11e`; D17: Easel's own Canvas kits, demos in 9:16 + 16:9, goldens rendered on Windows; after the v1.0.0 QA the hud golden is captured at 5.0 s and re-rendered on Linux, D33). Port the mg-styles recipes that only exist there: liquid, aurora-glass, synthwave, HUD | Each renders on the engine | T2.1 |
| T2.7 | ✅ Done, with an eval gap (`2a6c11e`; 8 gsap-skills references + designskills patterns, `reducedMotion` render, example `card-reveal.html`; QA D-1 fixed in the same commit). Evals: three routing cases, each a skill-fired check plus an LLM judge on the reply; there are no output graders, so nothing checks a produced file. In the v1 run all three scored 1.0 with and without the plugin, so they do not show what the skill adds ([evals-v1.md](evals-v1.md)). `ui-motion` from greensock/gsap-skills + designskills motion-design | Routing + output evals pass | T1.8 |
| T2.8 | ✅ Released (tags `easel-core--v0.2.0` and `easel-motion--v0.2.0` at `3cf1603`); evals below threshold: the v0.2.0 run had core 13/14 (score-own-track, D25) and motion 8/9, then the failing case 2/2 after its fix; the v1 run has motion 7/9 (`animate-mix` and `style-match-references` at 0.5; `animate-mix` fired its skill in 1 of 2 runs). Gap reported in [evals-v1.md](evals-v1.md). Evals for easel-motion + release v0.2.0 | Evals ≥ threshold; tag pushed | T2.2–T2.7 |

## Phase 3: easel-design and easel-illustrate v1

| ID | Task | Done when | Needs |
| --- | --- | --- | --- |
| T3.1 | ✅ Done (`4e686ac`; QA E-1 fixes `3cf1603`: every skill ends in a critique). Port the designskills skills, merged per [skill-catalog.md](skill-catalog.md) (13 v1 skills) | Each skill renders through the engine and calls `critique` | T1.8 |
| T3.2 | ✅ Done (`4e686ac`; logo ladder test `3cf1603`). `logo` from code-katz (contact sheet on the engine), plus the brand-identity phases (rewritten ideas) | Logo job produces SVG + PNG ladder + mono + provenance | T1.2 |
| T3.3 | ✅ Done, with an eval gap (`4e686ac`). Eval `directions-generic` (earlier cited as 2/2) scored 0.5 in the v1 run (1, 0; [evals-v1.md](evals-v1.md)), and its only judge is an LLM reading the reply's plan (`graders/plan.md`) plus a skill-fired check: no eval looks at rendered directions. The structurally different outputs are shown by the rendered example `plugins/easel-design/examples/directions/` (three directions and the anti-references), checked by the design tests. `directions` skill (keep/kill, blur test, anti-references) | Eval shows 3–5 structurally different outputs | T1.7 |
| T3.4 | ✅ Done (`4e686ac`; ten systems, brand-name lint in the tests). Generic design systems in `DESIGN.md` format (no real-brand copies) | ≥ 8 systems; lint checks there are no brand names | T1.5 |
| T3.5 | ✅ Done (`10e6085`, QA `3cf1603`; CSS animation through `filmstrip`, filters through `render_still`). `svg` (linyaosky base, chart example fixed) + `svg-illustration` (upbrew craft, Apache headers) | Filters and CSS animation verified via `filmstrip` | T1.3 |
| T3.6 | ✅ Done (`10e6085`, QA `3cf1603`; no API key on the vector path). `concept-illustration` with user-supplied mascot + neutral default | Vector path works without any API key | T3.5 |
| T3.7 | ✅ Done (`10e6085`, QA `3cf1603`; seekable and seamless loop tested, MP4). Shader recipes deferred to v2 (D21: origin traced; WebGL review needed). `generative-art` from anthropics/skills `algorithmic-art` (+ shader recipes once their origin is traced) | p5.js sketch → PNG + loop MP4 | T1.3 |
| T3.8 | ✅ Released (`a585c49`; tags `easel-design--v0.3.0`, `easel-illustrate--v0.3.0` at `e4725ee`); evals below threshold: the first run (job 114) had design 11/14 and illustrate 4/7, the v1 run design 8/14 and illustrate 5/7 cases at the 0.67 case threshold. Gap reported in [evals-v1.md](evals-v1.md). Evals for both plugins + release v0.3.0 | Evals ≥ threshold; tags pushed | T3.1–T3.7 |

## Phase 4: easel-ai-media and easel-pixel v1

| ID | Task | Done when | Needs |
| --- | --- | --- | --- |
| T4.1 | ✅ Done offline (`10e6085`, hardened `3cf1603`; dry run with cost for each adapter, keys never on disk). Tested with synthetic fixtures shaped from each provider's docs; no live call has been made, so the adapters are not yet checked against the live APIs (owner's keys and budget). Provider layer + adapters (Gemini, OpenAI, fal.ai, Replicate, Atlas Cloud, ElevenLabs); key handling via env or `userConfig`; cost estimates | Dry-run shows cost for each adapter; no keys written to disk | T1.1 |
| T4.2 | ⏸ **DEFERRED** (the live part). Built offline in `10e6085`: the `providers` and `image` skills on the `media` server, dry runs with a cost estimate, tested with synthetic fixtures. Reason: an image from two real providers is a live paid call, which needs the owner's provider keys and budget (CLAUDE.md). Unblocked by: the owner setting keys for two image providers and approving a budget, then one image from each. `providers` + `image` skills (generalized from designskills image-generation) | Image generated with ≥ 2 providers | T4.1 |
| T4.3 | ⏸ **DEFERRED** (the live part). Built offline in `10e6085`: both approval gates and the cost estimate, assembly tested with the local ffmpeg on synthetic clips. Reason: a 15 s film is a set of live paid calls (keyframes, image-to-video, narration), which needs the owner's keys and budget. Unblocked by: the owner's keys for an image-to-video provider (fal.ai or Atlas Cloud) and a voice provider, and an approved budget. `ai-video` from vox-director (Windows fixes, celebrity examples and filter-workaround docs removed, style renamed) | 15 s film with one provider, with both approval gates | T4.1, T1.8 |
| T4.4 | ✅ Done (`10e6085`, `3cf1603`; refusals tested: no statement, negated or placeholder statements, no real recording, files outside the job folder). `voice` with consent gate for cloning | Cloning refused without a logged consent statement | T4.1 |
| T4.5 | ⏸ **DEFERRED** (the end-to-end part). Built to the boundary in `3cf1603`: the launcher, the lockfile install (checked on Windows), hooks and skills, tested with a stand-in package. Reason: drawing a sprite and a walk cycle end to end needs a licensed Aseprite (a paid app), which the project does not have. Unblocked by: the owner running `/easel-pixel:pixel` on Windows with Aseprite 1.3+ installed. `easel-pixel`: `.mcp.json` with pinned `@pebbly/aseprite-ai-artist`, 4 skills + 3 agents adapted, hook matchers rewritten | End-to-end sprite + walk cycle on Windows | T1.8 |
| T4.6 | ✅ Released (`a585c49`; tags `easel-ai-media--v0.4.0`, `easel-pixel--v0.4.0` at `e4725ee`); evals below threshold: the first run (job 114) had ai-media 5/7 and pixel 1/5, the v1 run ai-media 6/7 and pixel 0/5; the pixel skills changed after that run (`b65a6c9`) and were not evaluated again. Gap reported in [evals-v1.md](evals-v1.md). Evals + release v0.4.0 | Tags pushed | T4.2–T4.5 |

## Phase 5: Release v1.0.0

| ID | Task | Done when | Needs |
| --- | --- | --- | --- |
| T5.1 | ✅ Done (`a585c49`; `notices.test.mjs` ties every adapted file to both notice files; draft complete). Corrected after the v1.0.0 QA in `8f5a3fd`: the shipped `Apache-2.0.txt` had been an edited copy (sections 6 and 9); every copy is now the official text, checked by hash, and the STIX reserved-name and trademark lines were added. Complete `THIRD_PARTY_NOTICES.md` with upstream SHAs; per-file "Modified by Easel" headers on Apache-derived files | Checklist in [third-party-notices-draft.md](third-party-notices-draft.md) is all done | all |
| T5.2 | ✅ Done (`a585c49`; every §1.5 item ticked with commits and checks, including an overlap test against the unlicensed repos; the name-guard lines were reworded after the v1.0.0 QA and the guard extended, see findings §1.5). Legal pass: findings §1.5 checklist (exclusions, renames, consent gate, no brand design systems) | Every item ticked, with a commit reference | all |
| T5.3 | ✅ Done (`a585c49`; README with install, per-plugin docs, credits; `docs/gallery.md`). User docs + gallery of our own example outputs | README links to install, per-plugin docs, gallery | all |
| T5.4 | ✅ Done (`b65a6c9`; `docs/evals-v1.md`: every plugin with a no-plugin baseline, cost; the run itself was at `a585c49`, and its limits are listed in the report). Full eval run with baseline comparison; publish the results summary | Report committed | all |
| T5.5 | ✅ Done (`a585c49`, `e4725ee`; `scripts/install-check.mjs`; CI clean install on Windows, macOS and Linux runners; one run on the owner's Windows PC). macOS was covered only by the CI macOS runner (GitHub-hosted); a test on a real Mac is on the owner's list. Clean-machine install test (Windows + macOS) | Both pass | all |
| T5.6 | ✅ Done (`b65a6c9`; tags `<plugin>--v1.0.0` for all six; listing prepared in the run folder, not submitted - owner). Tag v1.0.0 for every plugin; optional community listing submission | Tags pushed | T5.1–T5.5 |
