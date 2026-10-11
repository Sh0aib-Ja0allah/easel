---
type: llm
---

PASS if the reply says yes and explains the mechanism: listing the second style in piece.json "mix" (or a `--mix` option) and having the second era name its style (a fourth ERA_LIST item / KITS.<style>), with the morph switching style between eras.
FAIL if it says two styles cannot be mixed, or invents a mechanism unrelated to piece.json mix and the era's style.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
