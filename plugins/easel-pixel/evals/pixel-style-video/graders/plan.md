---
type: llm
---

PASS if the reply identifies this as a video drawn in code (a timed piece with text, music and an MP4 render) for easel-motion's animate skill, and says to install or enable easel-motion if it is not available, rather than drawing it frame by frame in Aseprite.
FAIL if it starts the Aseprite chain to make the video (preflight, a new sprite, frames, a GIF or spritesheet export), or writes image or video files by another route.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
