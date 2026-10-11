---
type: llm
---

PASS if the reply plans a rig (separate limb layers) or checks for one, names key poses (contact, down, passing, up or similar), gives frame timing in milliseconds, and tags the cycle.
FAIL if it draws frames with no pose plan or timing.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
