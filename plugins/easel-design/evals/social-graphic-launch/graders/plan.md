---
type: llm
---

PASS if the reply plans HTML/CSS graphics at the exact platform sizes (1080x1080 or 1080x1350 for the post, 1080x1920 for the story), mentions the story's safe zones or keeping text clear of the top and bottom, and plans to render and check them.
FAIL if it only describes a design in words with no sizes, or sends the user to an AI image generator as the main path.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
