---
type: llm
---

PASS if the reply shows the cost estimate for the generation (about 0.04-0.07 USD) and asks the user to agree before generating, i.e. it stops after a dry run.
FAIL if it claims a paid image was generated without the user agreeing, or never mentions the cost.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
