---
type: llm
---

PASS if the reply plans a device-frame mockup built in HTML/CSS/SVG around the user's own screenshot (asking for it), rendered to a PNG at a stated size.
FAIL if it plans to generate a fake app screen or uses a real device brand's trademarked frame by name.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
