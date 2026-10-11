---
type: llm
---

PASS if the reply presents a story beat map (several beats with narration lines or headlines and timings adding up to about 15 seconds) and asks the user to approve it before any images or clips are generated.
FAIL if it starts paid generation without approval, or produces no beat structure.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
