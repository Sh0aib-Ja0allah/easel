# Roadmap

> Status: all phases built and released (2026-10-11); Phases 2-5 released with gaps (listed under each phase); QA fixes after v1.0.0 in progress · Task details and commits: [tasks.md](tasks.md) · Releases: [CHANGELOG.md](../CHANGELOG.md)

Phases run in order, because each depends on the one before it. Phases 3 and 4 can overlap once core is stable.

Sizes are relative effort, not dates:

| Size | Effort |
| --- | --- |
| S | under a day |
| M | a few days |
| L | about a week or more |

## Phase 0: Foundations and spikes

> **Done.** Skeleton, spikes (D7 = B: Easel's own render loop) and CI.


**Goal:** settle the remaining risky unknowns before we build anything.

**Contents:**

- Confirm the license.
- Create the repo skeleton: marketplace, six empty plugins, validate in CI.
- Run three spikes:
  - **HyperFrames:** whether it can be our render engine (D7).
  - **Cross-plugin MCP visibility:** whether one plugin's skills can call another plugin's MCP tools.
  - **Windows:** whether the toolchain works there.

**Exit criteria:**

- `claude plugin validate . --strict` passes.
- D7 is decided, with the spike results written up.
- We know whether `easel-motion` skills can call `easel-core` MCP tools.

**Size:** M

## Phase 1: easel-core MVP → v0.1.0

> **Done:** `easel-core--v0.1.0`.


**Goal:** a working render engine and the shared skills that every other plugin relies on.

**Contents:**

- **Engine:** `doctor`, `render_still`, `contact_sheet`, `render_video`, `filmstrip`, `qa`, `craft`.
- **Schemas:** brand, brief, beats, cues, provenance.
- **Skills:** `setup`, `brief`, `brand`, `critique`.
- **Agent:** `critic`.
- **Craft rulebooks:** anti-generic, typography, colour, accessibility, motion.
- **CI:** smoke tests on Windows, macOS and Linux.

**Exit criteria:**

- On a clean Windows machine, `/easel-core:setup` installs everything.
- One HTML page renders to PNG and to a 5-second MP4.
- `critique` returns scored findings.

**Size:** L

## Phase 2: easel-motion v1 → v0.2.0

> **Released with gaps:** `easel-core--v0.2.0`, `easel-motion--v0.2.0`.
>
> - Met: `/easel-motion:animate` turns a topic into a reviewed MP4 in 16:9 and 9:16 (T2.2); every style has a golden-frame test.
> - Not met: **Routing evals pass.** In the v1 run ([evals-v1.md](evals-v1.md)) `animate-mix` fired its skill in 1 of 2 runs and scored 0.5, and `style-match-references` scored 0.5 (motion 7/9 cases at 0.67); easel-core's `score` skill fired in 0 of 2 runs of `score-own-track` (D25) and 1 of 2 of `score-animate-piece`. Unblocked by: routing fixes for these cases and an eval re-run at or above the threshold.


**Goal:** the first plugin users will actually want: code-drawn animated video.

**Contents:**

- Port `animate` and its 7 styles onto the engine.
- `style-match`.
- `ui-motion` (from greensock/gsap-skills).
- `score`, either with mgaudio ported to Node or a JS synth (decided in T2.4).
- The first batch of translated and renamed huashu styles (about 10) and the grammar library.
- The mg-styles recipes that only exist there: liquid, aurora, synthwave, HUD.

**Exit criteria:**

- `/easel-motion:animate` turns a topic into a reviewed MP4 in 16:9 and 9:16.
- Every v1 style has a golden-frame test.
- Routing evals pass.

**Size:** L

## Phase 3: easel-design and easel-illustrate v1 → v0.3.0

> **Released with gaps:** `easel-design--v0.3.0`, `easel-illustrate--v0.3.0`.
>
> - Met: the logo contact sheet and the critique loop run on the engine (the logo ladder test; every example of both plugins is rendered and checked by their tests).
> - Not met: **Each skill has at least 2 eval cases: routing and output.** 12 of the 13 design skills have one case (only `logo` has two), and 3 of the 5 illustrate skills have one (`svg` and `concept-illustration` have two). No design or illustrate case has an output grader: each is a skill-fired check plus an LLM judge on the reply's plan, because the eval mocks write no files. Unblocked by: a second case per skill with a grader on the produced files, which needs eval mocks (or a real engine) that write them.


**Goal:** cover design, illustration and drawing for still output.

**Contents:**

- The 13 design skills, adapted from designskills, with the logo and brand methods merged in.
- Generic design systems in `DESIGN.md` format.
- The 5 illustrate skills: `svg`, `svg-illustration`, `concept-illustration`, `generative-art`, and the `illustrate` router.

**Exit criteria:**

- Each skill has at least 2 eval cases: routing and output.
- The logo contact sheet and design-critique loop run on the engine.

**Size:** L

## Phase 4: easel-ai-media and easel-pixel v1 → v0.4.0

> **Released with gaps:** `easel-ai-media--v0.4.0`, `easel-pixel--v0.4.0`. Two of the three exit criteria are not met.
>
> - Met: every provider has a dry-run mode that shows the cost estimate (tested offline with synthetic fixtures shaped from each provider's docs; the adapters are not yet checked against the live APIs).
> - Not met (DEFERRED, T4.3): **`ai-video` makes a 15-second film with one provider.** Unblocked by: the owner's provider keys and budget.
> - Not met (DEFERRED, T4.5): **Pixel art works end to end with Aseprite on Windows.** Unblocked by: a run with a licensed Aseprite 1.3+ on the owner's Windows PC.


**Goal:** the optional paid add-ons.

**Contents:**

- **Provider layer** with adapters for Gemini, OpenAI, fal.ai, Replicate, Atlas Cloud and ElevenLabs.
- **AI media skills:** `providers`, `image`, `ai-video` (adapted from vox-director), and `voice` with a consent gate.
- **Pixel art:** `easel-pixel`, built on the pinned `@pebbly/aseprite-ai-artist` MCP package.

**Exit criteria:**

- Each provider has a dry-run mode that shows the cost estimate.
- `ai-video` makes a 15-second film with one provider.
- Pixel art works end to end with Aseprite on Windows.

**Size:** L

## Phase 5: Release → v1.0.0

> **Released with gaps:** v1.0.0 tags for all six plugins.
>
> - Met: a fresh install works on Windows (CI and the owner's PC) and on macOS, but macOS only on the CI macOS runner; a test on a real Mac is on the owner's list.
> - Met: the §1.5 legal checklist is ticked (its name-guard lines were reworded after the v1.0.0 QA review, and the guard extended).
> - Not met: **All evals meet their threshold.** 40 of 57 cases are at or above 0.67 in the v1 run (core 14/15, motion 7/9, design 8/14, illustrate 5/7, ai-media 6/7, pixel 0/5; [evals-v1.md](evals-v1.md)). Unblocked by: the fixes for the gaps listed there, a pixel run after its skills changed, and an eval re-run.


**Goal:** a public release people can install with confidence.

**Contents:**

- The full eval suite run, compared against a baseline without the plugins.
- README and user docs.
- A gallery of example outputs (our own, with no third-party media).
- `THIRD_PARTY_NOTICES.md` completed with upstream SHAs.
- Plugin version tags.
- Optionally, a submission to community plugin listings.

**Exit criteria:**

- A fresh install of the marketplace on Windows and macOS works.
- All evals meet their threshold.
- A legal checklist confirms the §1.5 items in [findings-and-decisions.md](findings-and-decisions.md) are done.

**Size:** M

## v2 backlog

- **Motion:** `kinetic-type`, `export-gif`, Blender/3D styles, ProRes with alpha, Lottie/Rive export.
- **Illustration:** `diagram`, `3d-scene`, and GLSL shader recipes for `generative-art` (all three deferred in D21).
- **Design:** `email-design` (dashboards are covered by `ui-design`, D19).
- **AI media:** `music`.
- **Styles:** the remaining translated huashu styles.
- **Localization:** a Chinese translation, if there's demand (D4 chose English-first).
