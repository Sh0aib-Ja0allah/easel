---
type: llm
---

PASS if the review flags at least two of: animating layout properties (`top`, `height`) instead of transform and opacity, linear easing, a 1.4 s duration far too long for a menu (around 200-300 ms), no reduced-motion handling; and gives a concrete fix for each.
FAIL if it calls the motion fine, or judges it from the code alone without rendering or measuring it.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
