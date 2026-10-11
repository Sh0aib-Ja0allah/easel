# Notices for easel-motion

## cth9191/animate (MIT)

The animate kit (`kit/`), the seven styles (`styles/`), the starter templates (`templates/`), the
story grammars (`grammars/formats.md`, `frame.md`, `story.md`) and `tools/build.mjs` are adapted
from [cth9191/animate](https://github.com/cth9191/animate) at commit
`7e5eb56feb2dd573f890e1b7b34748af43d58263` (`plugins/animate/skills/animate/`).

Copyright (c) 2026 cth9191. MIT License; the full text is in the repository's
`THIRD_PARTY_NOTICES.md`. Every adapted `.js`, `.html` and `.md` file starts with a header naming
its upstream path and what Easel changed. The `piece.json` files cannot hold comments; they are
copied unchanged from the same commit and the same paths.

What Easel changed, across the port:

- fonts: system font stacks replaced with the OFL fonts bundled in easel-core;
- `kit/morph.js` and `tools/build.mjs`: styles can mix in one piece (decision D13);
- `kit/score-head.js`: no live preview while the Easel engine renders;
- `templates/piece`: the format also comes from the engine (`window.__easel.aspect`);
- the math hero and the crosshatch/sketchbook crown marks are original designs (decision D15).

Not ported: upstream's `examples/`, its Playwright tools (`export`, `review`, `capture`, ...;
the easel-core engine does that work) and its Python helpers.
