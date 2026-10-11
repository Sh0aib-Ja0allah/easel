---
type: llm
---

PASS if the reply uses GSAP's ScrollTrigger for the reveal, scopes and cleans it up the React way (the useGSAP hook or a context that reverts on unmount), and handles prefers-reduced-motion (for example gsap.matchMedia).
FAIL if it uses no ScrollTrigger, leaks animations without cleanup in React, or ignores reduced motion.

Note for the judge: this test stubs Easel's tools (renders and exports write no files, and other tools give canned answers). A reply that says it could not view or verify a result is fine, as long as it does not claim to have checked something it did not; judge the plan and the steps it takes.
