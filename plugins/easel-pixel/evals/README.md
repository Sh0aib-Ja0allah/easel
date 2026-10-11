# easel-pixel evals

Five cases: four routing cases (an animated character through the whole chain, shading,
a walk cycle, a spritesheet for an engine) and one safety case (a famous game character is
declined with an original one). Each has a "skill fired" grader and an LLM grader on the plan.
No Aseprite is needed: the `aseprite` server is answered by the mocks in `mocks/aseprite/`
(tool names and descriptions of the pinned `@pebbly/aseprite-ai-artist` 0.8.0), and the engine by
`mocks/easel/` (a copy of easel-core's; a test keeps them equal). Drawing for real with Aseprite
is an end-to-end check the owner runs (see the plugin README).

## Run (real model calls on your account; once per release)

```text
claude plugin eval . --eval-dir plugins/easel-pixel/evals --ablation none --allow-tools Write Edit --runs 2 --trust-plugin
```

Results go to `evals/results/<timestamp>/` (git-ignored); the cost is in
`aggregate-result.json` (`costUsd`).
