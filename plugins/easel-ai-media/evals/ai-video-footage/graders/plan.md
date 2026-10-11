---
type: llm
---

PASS if the reply plans footage made with the user's AI providers (a keyframe image, then an image-to-video clip, narration and assembly) and stops for approval of a beat map or a cost estimate before any paid generation.
FAIL if it starts paid generation without approval, or plans to draw the scene in code (an HTML, canvas or SVG animation) instead of generating footage.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
