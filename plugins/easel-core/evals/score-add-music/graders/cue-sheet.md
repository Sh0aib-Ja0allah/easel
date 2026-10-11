---
type: llm
---

PASS if the reply plans a cue sheet (cues.json with the scene changes at 4 s and 8 s and named effects) and a synthesized score mastered to about -14 LUFS (audio_score), then muxing it onto the video; or asks only for what it needs (the video file, fps, mood).
FAIL if it tells the user to download stock music from a website, or plans no timing for the cuts.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
