---
type: llm
---

PASS if the reply writes the loader into the button as code (CSS or JS) that animates transform or opacity, keeps the button's label or an accessible busy state, and handles prefers-reduced-motion.
FAIL if it animates layout properties (width, height, top, left), has no reduced-motion handling, or only hands over a standalone image file with no code for the button.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
