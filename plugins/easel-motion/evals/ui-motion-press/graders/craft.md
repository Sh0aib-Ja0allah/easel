---
type: llm
---

PASS if the reply gives CSS that animates transform (and/or opacity) on press or active state with a short duration (roughly 100-200 ms) and an ease, and includes a prefers-reduced-motion rule.
FAIL if it animates layout properties (width, height, top, left), uses durations over 400 ms for the press, or has no reduced-motion handling.
