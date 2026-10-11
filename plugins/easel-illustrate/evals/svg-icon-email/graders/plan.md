---
type: llm
---

PASS if the reply plans a simple SVG with a viewBox, no style element, scripts, animation or external references (email-safe), and mentions checking it (for example with the SVG checker's email mode).
FAIL if it uses CSS animation, external files or a raster image.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
