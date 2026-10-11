# easel-motion evals

Nine routing cases (`animate` 4, `style-match` 2, `ui-motion` 3), including one that
must go to `animate` rather than `ui-motion` and one that must refuse a studio name for a style.
The skills' render steps call easel-core's engine, which is not loaded when this plugin is
evaluated on its own, so the graders check routing and the plan or code the skill produces
(questions before rendering, the story check, measuring before drawing, CSS and GSAP craft), not
renders. Renders are covered by the plugin's tests (`npm --prefix plugins/easel-motion test`).

## Run (real model calls on your account; once per release)

```text
claude plugin eval plugins/easel-motion --ablation none --allow-tools Write Edit --runs 2 --trust-plugin
```

Results go to `evals/results/<timestamp>/` (git-ignored); the cost is in
`aggregate-result.json` (`costUsd`).
