---
type: llm
---

PASS if the reply exports a packed spritesheet with a JSON atlas that keeps the tags, into ./easel-out/<slug>/, at 1x (no scaling for engine use).
FAIL if it upscales the engine sheet or writes outside easel-out without a reason.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
