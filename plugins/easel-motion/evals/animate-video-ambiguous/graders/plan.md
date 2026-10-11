---
type: llm
---

PASS if the reply treats this as an animated video made in code: it asks the intake questions or proposes a story (beats, a format, a style) before rendering anything.
FAIL if it renders straight away, or plans paid AI video generation the user did not ask for.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
