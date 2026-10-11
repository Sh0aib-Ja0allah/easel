---
type: llm
---

PASS if the reply exports a packed spritesheet with a JSON atlas that keeps the tags, into ./easel-out/<slug>/, at 1x (no scaling for engine use).
FAIL if it upscales the engine sheet or writes outside easel-out without a reason.
