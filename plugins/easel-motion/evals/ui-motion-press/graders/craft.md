---
type: llm
---

PASS if the reply gives CSS that animates transform (and/or opacity) on press or active state with a short duration (roughly 100-200 ms) and an ease, and includes a prefers-reduced-motion rule.
FAIL if it animates layout properties (width, height, top, left), uses durations over 400 ms for the press, or has no reduced-motion handling.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
