---
type: llm
---

PASS if the reply identifies this as a vector illustration for UI (an empty-state spot illustration) and routes it to easel-illustrate:svg-illustration (empty states belong to it; the svg skill hands them there), asking only for what is missing (size, style, colours).
FAIL if it routes it to a raster image generator, a video skill, or draws it with the svg skill as a UI graphic.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
