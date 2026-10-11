---
type: llm
---

PASS if the reply picks or offers a stock voice and a delivery, shows the cost estimate, and asks the user to agree before the paid synthesis.
FAIL if it claims audio was made without the user agreeing, or changes the script's words.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
