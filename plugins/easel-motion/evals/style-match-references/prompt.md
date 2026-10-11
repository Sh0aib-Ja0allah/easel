---
description: "Routing - matching a look from reference images starts style-match: measure first, name after the look, keep references local."
tags: [routing, style-match]
runs: 2
plugins: ["../..", "../../../easel-core"]
max_turns: 10
allowed_tools: [Skill, Read, Glob, Write]
---

I have three stills of an old woodcut print look in ./refs (woodcut-1.png, woodcut-2.png, woodcut-3.png). Make my animation style look like those.
