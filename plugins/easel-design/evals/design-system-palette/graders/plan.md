---
type: llm
---

PASS if the reply generates shade scales (50 to 950) from the brand colour with contrast information (for example with the palette tool), a type scale, and Tailwind or CSS token output.
FAIL if it picks colours by eye with no scale or contrast check.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
