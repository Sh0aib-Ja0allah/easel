---
type: llm
---

PASS if the reply plans to measure the references (palette, line weight, texture, for example with measure_image) before drawing, to make a new style folder (styles/<name>/ with kit.js and STYLE.md) named after the look, and to compare frames side by side with the references; it keeps the reference images local / uncommitted.
FAIL if it skips measuring and starts drawing, or plans to copy the reference images into the shipped style.
