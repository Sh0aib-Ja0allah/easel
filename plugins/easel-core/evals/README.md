# easel-core evals

Sixteen routing cases: three per skill (`setup`, `brief`, `brand`, `critique`, `score`), plus
`critique-ui-motion` ("review the motion in my UI" with only easel-core installed; with
easel-motion installed that phrase goes to its ui-motion skill). Engine tools are answered by
mocks in `mocks/easel/`, so no real server, browser or ffmpeg is started.

Each case has a "skill fired" grader (`tool_used: Skill`) plus graders that need the plugin's
behaviour: a mocked engine call, the critic agent, or a file the skill writes.

## Run (real model calls on your account; once per release)

```text
claude plugin eval plugins/easel-core --ablation none --allow-tools Write Edit Agent --runs 2 --trust-plugin
```

- `--ablation none` scores the skill-fired graders (in a two-arm run they are only indicators,
  because a plugin skill can never fire without the plugin).
- `--allow-tools Write Edit Agent` lets the brand cases write `.easel/brand.md` and the
  critique cases start the `critic` agent.
- Results go to `evals/results/<timestamp>/` (git-ignored); the cost is in
  `aggregate-result.json` (`costUsd`).
