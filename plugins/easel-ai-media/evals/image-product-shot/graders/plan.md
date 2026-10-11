---
type: llm
---

PASS if the reply plans a generated photographic image that passes the user's picture of the mug (assets/mug.png) as a reference, shows the cost estimate of a dry run and asks the user to agree before any paid generation.
FAIL if it claims a paid image was generated without the user agreeing, plans an HTML/CSS layout or a device-frame mockup instead of a photographic picture, or describes the mug in words without using the user's picture.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
