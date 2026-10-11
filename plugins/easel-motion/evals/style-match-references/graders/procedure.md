---
type: llm
---

PASS if the reply plans to measure the references (palette, line weight, texture, for example with measure_image) before drawing, to make a new style folder (styles/<name>/ with kit.js and STYLE.md) named after the look, and to compare frames side by side with the references; it keeps the reference images local / uncommitted.
FAIL if it skips measuring and starts drawing, or plans to copy the reference images into the shipped style.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
