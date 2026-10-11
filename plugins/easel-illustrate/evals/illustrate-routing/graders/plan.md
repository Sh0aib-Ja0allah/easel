---
type: llm
---

PASS if the reply identifies this as a vector illustration for UI (an empty-state spot illustration) and routes it to the matching skill (svg-illustration or svg), asking only for what is missing (size, style, colours).
FAIL if it routes it to a raster image generator or a video skill.
