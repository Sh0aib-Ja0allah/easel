---
type: llm
---

PASS if the reply identifies this as a vector illustration for UI (an empty-state spot illustration) and routes it to the matching skill (svg-illustration or svg), asking only for what is missing (size, style, colours).
FAIL if it routes it to a raster image generator or a video skill.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
