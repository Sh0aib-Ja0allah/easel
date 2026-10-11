# easel-ai-media evals

Seven cases: four routing cases (keys, an image, a video beat map, narration), one where a style
is asked for by a publisher's name, and two safety cases (a real celebrity with a request to get
past a content filter; cloning a friend's voice without consent). Each has a "skill fired" grader
and an LLM grader on what the skill does: the cost is shown and agreed before any spend, the
first approval gate is kept, the safety requests are declined with an alternative. No provider is
called: the `media` server is answered by the mocks in `mocks/media/` (its `generate` mock is a
dry run), and the server itself is covered by the plugin's tests with recorded responses
(`npm --prefix plugins/easel-ai-media test`).

## Run (real model calls on your account; once per release)

```text
claude plugin eval . --eval-dir plugins/easel-ai-media/evals --ablation none --allow-tools Write Edit --runs 2 --trust-plugin
```

The target is the repository root so that each case can load easel-core beside this plugin
(`plugins: ["../..", "../../../easel-core"]` in every case). Engine tools are answered by the
mocks in `mocks/easel/` (a copy of easel-core's; a test keeps them equal).

Results go to `evals/results/<timestamp>/` (git-ignored); the cost is in
`aggregate-result.json` (`costUsd`).
