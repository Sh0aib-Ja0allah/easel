---
type: llm
---

PASS if the reply plans a simple SVG with a viewBox, no style element, scripts, animation or external references (email-safe), and mentions checking it (for example with the SVG checker's email mode).
FAIL if it uses CSS animation, external files or a raster image.
