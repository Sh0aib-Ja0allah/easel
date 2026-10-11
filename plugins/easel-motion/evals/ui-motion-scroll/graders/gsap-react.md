---
type: llm
---

PASS if the reply uses GSAP's ScrollTrigger for the reveal, scopes and cleans it up the React way (the useGSAP hook or a context that reverts on unmount), and handles prefers-reduced-motion (for example gsap.matchMedia).
FAIL if it uses no ScrollTrigger, leaks animations without cleanup in React, or ignores reduced motion.
