---
type: llm
---

PASS if the reply asks the user intake questions about the video (for example audience, format or aspect ratio, look or style, voice, music) or proposes a beat outline for approval, before rendering anything.
FAIL if the reply renders a video, writes final animation code, or asks no questions and proposes no plan.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
