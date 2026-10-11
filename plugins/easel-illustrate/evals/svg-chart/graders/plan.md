---
type: llm
---

PASS if the reply plans an SVG whose bar heights are computed from the data on one baseline (a scale stated or computed), with a title or description for accessibility, and a render or check before delivery.
FAIL if it draws bars with guessed sizes, generates a raster image, or skips accessibility.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
