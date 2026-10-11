# Evals for v1.0.0 (T5.4)

Run 2026-10-11 on the owner's Windows PC (job 121, commit `a585c49`, Claude Code 2.1.296), every
plugin's suite with a **no-plugin baseline arm** (`--ablation with-without`), Sonnet, 2 runs per
case and arm, threshold 0.67. Commands: each plugin's `evals/README.md`. Under with-without the
`skill-fired` graders are an indicator, not part of the score (shown separately below).

## Summary

| Plugin | Cases at or above 0.67 | Score with plugin | Mean delta vs no plugin | Cost (USD) |
|---|---|---|---|---|
| easel-core | 14/15 | 0.97 | +0.87 | 3.96 |
| easel-motion | 7/9 | 0.89 | +0.33 | 3.19 |
| easel-design | 8/14 | 0.71 | +0.18 | 6.05 |
| easel-illustrate | 5/7 | 0.79 | +0.50 | 3.01 |
| easel-ai-media | 6/7 | 0.93 | +0.71 | 2.00 |
| easel-pixel | 0/5 | 0.10 | +0.10 | 2.48 |

Total cost: 20.70 USD for this run. All eval runs in the v0.2.0-v1.0.0 work cost about 38 USD (v0.2.0
runs 8.6, re-runs 0.3, the first v0.3.0/v0.4.0 run 8.6, this run 20.7).

"Mean delta" is the score with the plugin minus the score without it, averaged over cases. On
average every plugin improves on plain Claude, most where the skills carry a procedure Claude does
not know (core +0.87, ai-media +0.71, illustrate +0.50). That is true per plugin, not per case:
plain Claude scored higher than the plugin on two design cases, `design-system-palette` (0 with the
plugin, 0.5 without) and `ui-design-states` (0.5 with, 1.0 without).

## Limits of this run

Read the numbers above with these limits (added 2026-10-11 after the v1.0.0 QA review):

- **11 of the 57 cases do not discriminate:** they score 1.0 in both runs with and without the
  plugin, so they cannot show what the plugin adds. Motion: `animate-formats`,
  `animate-not-for-ui`, `ui-motion-press`, `ui-motion-review`, `ui-motion-scroll`; design:
  `ad-creative-sizes`, `design-mockup`, `logo-brand-copy`, `poster-print`; illustrate: `svg-chart`;
  ai-media: `ai-video-real-person`. (Their skill-fired indicator still shows routing.)
- **Two plugins fell against the first v0.3.0/v0.4.0 run** (job 114, D26): design from 11/14 to
  8/14 cases at the threshold and pixel from 1/5 to 0/5, while illustrate rose from 4/7 to 5/7 and
  ai-media from 5/7 to 6/7. With 2 runs per case, a single run decides many cases.
- **The shipped pixel skills were never evaluated.** This run was at `a585c49`; the v1.0.0 commit
  `b65a6c9` then changed the `pixel` and `pixel-draw` skills and the turn limits of 4 of the 5
  pixel eval prompts. The easel-pixel numbers are for the earlier skills.
- **The judge model is not recorded.** Sonnet is the model under test; which model judged the LLM
  graders (and played the Aseprite mock) was not recorded for this run.
- **Not reproducible from the repository.** Eval results go to `evals/results/` and
  `plugins/*/evals/results/`, which are git-ignored; the tables in this file are the only record
  in the repo.
- **Most cases judge a reply, not files.** The engine mocks write no files, so every design,
  illustrate, ai-media and pixel case is a skill-fired check plus an LLM judge on the plan in the
  reply; only two easel-core cases check a written file.

## What did not reach the threshold, and why

- **Render stubs.** In an eval the engine is mocked: renders write no file, so a careful reply
  says it could not view its work and often stops before the steps that depend on seeing it
  (fix the worst failure, export). The judge then fails "plans the 16 px check and fixes the worst
  failure" even when the plan is right (design `logo-small-size`, `icons-set`, `ui-design-states`;
  illustrate `svg-illustration-scene`). D26 marked the stubs and told the judge; it helped
  (ad-creative went from 0.5 to 1.0) but not everywhere. Real renders are covered by each plugin's
  tests, which render every example through the engine on Windows, macOS and Linux.
- **No shell in evals.** Bash is not granted (Windows has no eval sandbox), so the palette tool
  cannot run (design `design-system-palette`).
- **Good refusals judged as gaps.** Asking for missing facts instead of inventing them
  (`directions-generic`, `presentation-deck` run 2) is what the skills require; the judge wanted
  the deliverable.
- **easel-pixel (0/5).** The Aseprite bridge is played by the judge model (D26); it contradicted
  itself (a validator reporting a drawn sprite blank), the long cases hit their turn limits, and one
  run hit the mock-call budget. One real finding: when declining a famous character, the
  alternative kept its signature features; the pixel skills now forbid that (v1.0.0). Turn limits
  are raised for the next run. The meaningful pixel check is the end-to-end run with a licensed
  Aseprite (owner's list).
- **score-own-track** (core) now scores 1.0/1.0; the skill still does not fire for this one-tool
  job (0/2), reported as D25.

## Per case


| Plugin | Case | With (2 runs) | Without (2 runs) | Skill fired |
|---|---|---|---|---|
| easel-core | brand-drift | 1, 1 | 0, 0 | 2/2 |
| easel-core | brand-given-values | 1, 1 | 0, 0 | 2/2 |
| easel-core | brand-new-business | 1, 1 | 0, 0 | 2/2 |
| easel-core | brief-campaign | 0, 1 | 0, 0 | 2/2 |
| easel-core | brief-explainer | 1, 1 | 0, 0 | 2/2 |
| easel-core | brief-storyboard | 1, 1 | 0, 0 | 2/2 |
| easel-core | critique-landing-hero | 1, 1 | 0.5, 0.5 | 2/2 |
| easel-core | critique-logo | 1, 1 | 0.5, 0.5 | 2/2 |
| easel-core | critique-video | 1, 1 | 0, 0 | 2/2 |
| easel-core | score-add-music | 1, 1 | 0, 1 | 2/2 |
| easel-core | score-animate-piece | 1, 1 | 0, 0 | 1/2 |
| easel-core | score-own-track | 1, 1 | 0, 0 | 0/2 |
| easel-core | setup-ffmpeg | 1, 1 | 0, 0 | 2/2 |
| easel-core | setup-fresh-install | 1, 1 | 0, 0 | 2/2 |
| easel-core | setup-render-error | 1, 1 | 0, 0 | 2/2 |
| easel-motion | animate-explainer | 1, 1 | 0, 0 | 2/2 |
| easel-motion | animate-formats | 1, 1 | 1, 1 | 2/2 |
| easel-motion | animate-mix | 0, 1 | 0, 0 | 1/2 |
| easel-motion | animate-not-for-ui | 1, 1 | 1, 1 | 2/2 |
| easel-motion | style-match-naming | 1, 1 | 0, 0 | 2/2 |
| easel-motion | style-match-references | 1, 0 | 0, 0 | 2/2 |
| easel-motion | ui-motion-press | 1, 1 | 1, 1 | 2/2 |
| easel-motion | ui-motion-review | 1, 1 | 1, 1 | 2/2 |
| easel-motion | ui-motion-scroll | 1, 1 | 1, 1 | 2/2 |
| easel-design | ad-creative-sizes | 1, 1 | 1, 1 | 2/2 |
| easel-design | brand-identity-phases | 1, 1 | 0, 0 | 2/2 |
| easel-design | design-mockup | 1, 1 | 1, 1 | 2/2 |
| easel-design | design-system-palette | 0, 0 | 1, 0 | 2/2 |
| easel-design | directions-generic | 1, 0 | 0, 0 | 2/2 |
| easel-design | icons-set | 0, 1 | 1, 0 | 2/2 |
| easel-design | infographic-data | 1, 1 | 0, 1 | 2/2 |
| easel-design | landing-page-hero | 1, 1 | 0, 1 | 2/2 |
| easel-design | logo-brand-copy | 1, 1 | 1, 1 | 2/2 |
| easel-design | logo-small-size | 0, 0 | 0, 0 | 2/2 |
| easel-design | poster-print | 1, 1 | 1, 1 | 2/2 |
| easel-design | presentation-deck | 1, 0 | 0, 1 | 2/2 |
| easel-design | social-graphic-launch | 1, 1 | 0, 0 | 2/2 |
| easel-design | ui-design-states | 0, 1 | 1, 1 | 2/2 |
| easel-illustrate | concept-meeting | 1, 1 | 0, 0 | 2/2 |
| easel-illustrate | concept-no-famous-character | 1, 1 | 0, 1 | 2/2 |
| easel-illustrate | generative-flowfield | 1, 0 | 0, 0 | 2/2 |
| easel-illustrate | illustrate-routing | 1, 1 | 1, 0 | 2/2 |
| easel-illustrate | svg-chart | 1, 1 | 1, 1 | 2/2 |
| easel-illustrate | svg-icon-email | 1, 1 | 0, 0 | 2/2 |
| easel-illustrate | svg-illustration-scene | 0, 0 | 0, 0 | 2/2 |
| easel-ai-media | ai-video-beat-map-gate | 1, 1 | 0, 0 | 2/2 |
| easel-ai-media | ai-video-named-style | 1, 1 | 0, 0 | 2/2 |
| easel-ai-media | ai-video-real-person | 1, 1 | 1, 1 | 2/2 |
| easel-ai-media | image-cost-first | 1, 1 | 0, 0 | 2/2 |
| easel-ai-media | providers-key-setup | 1, 1 | 1, 0 | 2/2 |
| easel-ai-media | voice-clone-no-consent | 1, 1 | 0, 0 | 2/2 |
| easel-ai-media | voice-narration | 1, 0 | 0, 0 | 2/2 |
| easel-pixel | pixel-character-chain | 0, 0 | 0, 0 | 2/2 |
| easel-pixel | pixel-draw-shading | 0, 1 | 0, 0 | 2/2 |
| easel-pixel | pixel-famous-character | 0, 0 | 0, 0 | 2/2 |
| easel-pixel | pixel-spritesheet | 0, 0 | 0, 0 | 2/2 |
| easel-pixel | pixel-walk-cycle | 0, 0 | 0, 0 | 1/2 |
