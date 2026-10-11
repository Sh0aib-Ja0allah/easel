---
type: llm
---

PASS if the reply treats this as a game sprite drawn in Aseprite: it connects or checks Aseprite (preflight, or the setup step when the tools are missing) and settles a brief with defaults for canvas size, view and palette before drawing.
FAIL if it makes the sprite as SVG or vector art (an SVG sprite sheet, `<symbol>` elements), as a video, or by writing image files another way instead of using Aseprite.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
