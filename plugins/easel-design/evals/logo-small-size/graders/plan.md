---
type: llm
---

PASS if the reply plans several (3 to 5) different SVG concepts, checks them on a contact sheet at small sizes including 16 px on light and dark, and fixes the worst failure before exporting.
FAIL if it produces one logo without checking small sizes, or proposes an AI image generator as the main path.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
