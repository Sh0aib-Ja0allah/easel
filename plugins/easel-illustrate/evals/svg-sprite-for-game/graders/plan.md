---
type: llm
---

PASS if the reply treats this as a game sprite (pixel art, usually with animation frames) and routes it to easel-pixel's pixel skill (saying that plugin and the user's own Aseprite are needed when it is not installed), or asks one question to tell a pixel-art game sprite from a vector one before drawing.
FAIL if it plans an SVG icon sprite sheet (`<symbol>` and `<use>`), generates a raster image with an AI provider, or copies a well-known game character.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
