# easel-illustrate evals

Seven routing cases: one per skill, plus one where a famous character must be declined and one
unclear request that must be routed by kind of picture. Each has a "skill fired" grader and an
LLM grader on the plan the skill produces. Renders are covered by the plugin's tests
(`npm --prefix plugins/easel-illustrate test`).

## Run (real model calls on your account; once per release)

```text
claude plugin eval . --eval-dir plugins/easel-illustrate/evals --ablation none --allow-tools Write Edit --runs 2 --trust-plugin
```

The target is the repository root so that each case can load easel-core beside this plugin
(`plugins: ["../..", "../../../easel-core"]` in every case): an eval loads only the plugins a
case names, and this plugin does not load without its dependency. Engine tools are answered by
the mocks in `mocks/easel/` (a copy of easel-core's; a test keeps them equal).

Results go to `evals/results/<timestamp>/` (git-ignored); the cost is in
`aggregate-result.json` (`costUsd`).
