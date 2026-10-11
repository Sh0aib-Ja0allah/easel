# Notices for easel-illustrate

easel-illustrate is MIT licensed (see [LICENSE](LICENSE)). It includes material adapted from the
projects below. The notices are kept here so they travel with the installed plugin; the
repository-wide list is `THIRD_PARTY_NOTICES.md` at the root of the Easel repository. Every adapted
file starts with a header naming its source file, the commit and what Easel changed.

## linyaosky/svg-skill (MIT)

`skills/svg/` (the skill and its scenarios, syntax and examples references) is adapted from
[linyaosky/svg-skill](https://github.com/linyaosky/svg-skill) at commit
`2103b92cb47f588a97a6c38aa6c40571fadbd4f8`, and `tools/svg-check.mjs` follows its quality
checklist. The three files in `examples/svg/` (the bar chart, the progress ring and the spinner)
are its examples as corrected in the skill's examples reference; each carries the header.
Copyright (c) 2026 svg-skill contributors. MIT License (text below). Easel fixed the upstream bar
chart example (the bars did not sit on the axis and were not proportional).

## upbrew-tech/svg-creator-skill (Apache-2.0)

`skills/svg-illustration/` (the skill and its advanced-techniques and effects-and-motion
references) is adapted from [upbrew-tech/svg-creator-skill](https://github.com/upbrew-tech/svg-creator-skill)
at commit `1eb83d602a992b69a1771c4e0116a9f7de6ffaa2`. Copyright 2025 SVG Creator Skill Contributors. Licensed under the Apache License, Version 2.0: the text is in
[licenses/Apache-2.0.txt](licenses/Apache-2.0.txt). No NOTICE file exists upstream. Every adapted
file says "Modified by Easel" and what changed.

## aishwaryaashok14/peanut-illustrations (MIT), with portions from ian-xiaohei-illustrations (MIT)

The concept-illustration method (`skills/concept-illustration/`: compose first, one idea per
image, structure types, fresh metaphors, the character doing the action, the style and QA rules)
is adapted from **Peanut Illustrations** by Aishwarya Ashok,
[aishwaryaashok14/peanut-illustrations](https://github.com/aishwaryaashok14/peanut-illustrations)
at commit `1e5c645892a2d70242062f23ee2277b18240e05c`: Copyright (c) 2026 Aishwarya Ashok. Peanut
Illustrations is itself adapted in part from
[ian-xiaohei-illustrations](https://github.com/helloianneo/ian-xiaohei-illustrations) by Ian:
Copyright (c) 2026 Ian. Both under the MIT License (text below). Neither project's character (the
peanut, Xiaohei) nor any of their images is used: Easel's default mascot is its own, and users can
supply theirs.

## anthropics/skills (Apache-2.0)

`skills/generative-art/SKILL.md` (method) and `reference/algorithmic-philosophy.md` are adapted
from `skills/algorithmic-art` of [anthropics/skills](https://github.com/anthropics/skills) at
commit `dbd4588f9e1033efb41dad4bef2f7947c8993d44`. Copyright 2026 Anthropic, PBC. Licensed under
the Apache License, Version 2.0 (text in [licenses/Apache-2.0.txt](licenses/Apache-2.0.txt));
modified by Easel as each file says. The viewer template is Easel's own (the upstream branded
template is not used).

## code-katz/claude-illustrate-skill (MIT)

The routing by asset class in `skills/illustrate/SKILL.md` follows
[code-katz/claude-illustrate-skill](https://github.com/code-katz/claude-illustrate-skill) at commit
`7189cde8c29c36faf5c7fc8b57bc1b15e5ae4cbd`. Copyright (c) 2026 Will Curran (Code Katz). MIT
License (text below).

## Installed at run time, not redistributed

p5.js 1.11.13 (LGPL-2.1, the Processing Foundation and contributors) is installed by easel-core's
doctor into the plugin data folder and served to pages offline; Easel does not ship it.

## Easel's own

The mascot ("the card"), the viewer template, `examples/` (except the three linyaosky examples in
`examples/svg/`) and the routing tables are Easel's own work under the MIT License.

## The MIT License (text, for each MIT source above)

```
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute,
sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or
substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
