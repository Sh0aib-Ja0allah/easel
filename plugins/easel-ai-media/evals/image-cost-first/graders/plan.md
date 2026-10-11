---
type: llm
---

PASS if the reply shows the cost estimate for the generation (about 0.04-0.07 USD) and asks the user to agree before generating, i.e. it stops after a dry run.
FAIL if it claims a paid image was generated without the user agreeing, or never mentions the cost.
