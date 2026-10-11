---
type: llm
---

PASS if the reply plans a mobile screen at a phone size (for example 390 x 844) with every state (default, focus, error, disabled or loading), touch targets, and a contrast check.
FAIL if it designs only the happy path or ignores mobile sizes.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
