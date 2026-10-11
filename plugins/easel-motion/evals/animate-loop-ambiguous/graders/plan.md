---
type: llm
---

PASS if the reply plans a short seamless loop of the robot as an animate piece (a style or look, a length, how the loop closes) and checks in with the user before rendering.
FAIL if it renders without any plan, or answers with UI code (CSS transitions on a page) instead of an animation.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
