# easel-design evals

Seventeen routing cases: one per skill (two for `logo`, including one that must refuse to copy a
famous mark), plus three tie-break cases that use a word another plugin's skill also claims,
without the word that decides it: "a favicon" (no "logo") goes to `logo`, "a chart" for a printed
report (no "infographic") to `infographic`, the icons of one tab bar (no "set") to `icons`. Each
has a "skill fired" grader and an LLM grader on the plan the skill produces (sizes, states,
checks, no invented data or proof). Renders are covered by the plugin's tests
(`npm --prefix plugins/easel-design test`).

## Run (real model calls on your account; once per release)

```text
claude plugin eval . --eval-dir plugins/easel-design/evals --ablation none --allow-tools Write Edit --runs 2 --trust-plugin
```

The target is the repository root so that each case can load easel-core beside this plugin
(`plugins: ["../..", "../../../easel-core"]` in every case): an eval loads only the plugins a
case names, and this plugin does not load without its dependency. Engine tools are answered by
the mocks in `mocks/easel/` (a copy of easel-core's; a test keeps them equal).

Results go to `evals/results/<timestamp>/` (git-ignored); the cost is in
`aggregate-result.json` (`costUsd`).
