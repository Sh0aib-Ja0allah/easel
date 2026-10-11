---
type: llm
---

PASS if the reply uses the user's own track as the audio (for example mux_audio with the track on the existing video, or render_video audio when it is still rendering a page) and checks loudness, without synthesizing a different score.
FAIL if it replaces the user's track with a synthesized score or fetches other music.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
