# easel-motion evals

Twelve routing cases (`animate` 6, `style-match` 2, `ui-motion` 4), including one that
must go to `animate` rather than `ui-motion`, one that must refuse a studio name for a style, and
three with a phrase another plugin also claims and no word to settle it: "a short video" and "a
looping animation" (animate, not AI video or generative art) and "a loader" (ui-motion, not an
SVG asset).
The skills' render steps call easel-core's engine, which is mocked in the eval (canned results),
so the graders check routing and the plan or code the skill produces
(questions before rendering, the story check, measuring before drawing, CSS and GSAP craft), not
renders. Renders are covered by the plugin's tests (`npm --prefix plugins/easel-motion test`).

## Run (real model calls on your account; once per release)

```text
claude plugin eval . --eval-dir plugins/easel-motion/evals --ablation none --allow-tools Write Edit --runs 2 --trust-plugin
```

The target is the repository root so that each case can load easel-core beside this plugin
(`plugins: ["../..", "../../../easel-core"]` in every case): an eval loads only the plugins a
case names, and this plugin does not load without its dependency. Engine tools are answered by
the mocks in `mocks/easel/` (a copy of easel-core's; a test keeps them equal).

Results go to `evals/results/<timestamp>/` (git-ignored); the cost is in
`aggregate-result.json` (`costUsd`).
