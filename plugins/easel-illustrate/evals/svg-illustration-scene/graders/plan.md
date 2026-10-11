---
type: llm
---

PASS if the reply plans a layered SVG illustration (background to foreground, lighting and shadows), built and rendered in passes with a look at each render before delivery.
FAIL if it writes the SVG in one go with no render or check, or proposes an AI image generator as the main path.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
