---
type: llm
---

PASS if the review flags at least three of: transition on `all`, linear easing, a too-long duration for a modal (should be around 250-300 ms), the same easing for enter and exit, no reduced-motion handling; and gives a concrete fix.
FAIL if it calls the motion fine or gives no concrete fix.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
