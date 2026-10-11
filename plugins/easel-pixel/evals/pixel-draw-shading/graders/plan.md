---
type: llm
---

PASS if the reply reads the open sprite, plans shading with a light direction and palette-legal ramps (hue-shifted shadows and highlights), and looks at the canvas after changing pixels.
FAIL if it redraws the sprite from scratch without reason or never looks at the result.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
