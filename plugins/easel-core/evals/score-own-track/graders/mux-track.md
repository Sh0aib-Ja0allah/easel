---
type: llm
---

PASS if the reply uses the user's own track as the audio (for example mux_audio with the track on the existing video, or render_video audio when it is still rendering a page) and checks loudness, without synthesizing a different score.
FAIL if it replaces the user's track with a synthesized score or fetches other music.
