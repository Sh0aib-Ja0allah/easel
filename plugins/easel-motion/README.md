# easel-motion

Code-drawn animation and video: the `animate` entry skill, a style catalog, explainer grammars,
`style-match` and GSAP-based `ui-motion`.

**Status:** v1.0.0: all three skills, the kit and eleven styles (see
[the roadmap](../../docs/roadmap.md)).

## Skills

| Skill | Use it for |
|---|---|
| `/easel-motion:animate` | A short animated video made in code, in every format you need (16:9, 9:16, 1:1, 4:5): story, look and storyboard check-ins first, then a render with its own score and measured checks |
| `/easel-motion:ui-motion` | Motion in your own site or app: micro-interactions, transitions, scroll, GSAP timelines, reduced motion, previewed and checked offline |
| `/easel-motion:style-match` | A new style from your reference images: measured, matched side by side on a proportion grid, saved as `styles/<name>/` |

**Requires:** `easel-core` (installed automatically as a dependency). Pieces are rendered by its
engine (`render_video`, `filmstrip`, `render_still`).

## What's here

| Folder | What it is |
|---|---|
| `kit/` | The renderer every piece shares: drawing kit (`core.js`), eras joined by shape morphs (`morph.js`), storyboard sheet (`board.js`), synth score (`score-head.js`, `score-tail.js`) |
| `styles/<id>/` | A look: `STYLE.md` (rules), `kit.js` (drawing functions and `STYLE` hooks), `demo/` (a 6 s piece) |
| `templates/` | Starter pieces (`piece`: a morph chain in every format; `beat-cut`; `blank`: runs in any style) and a starter style kit |
| `grammars/` | Story structure (formats, what goes in a frame, beat-by-beat story rules) and nine explainer grammars: math explainer, keynote UI, finance chart, science cartoon, editorial collage, whiteboard, storytime, kinetic type, presenter |
| `recipes/` | Ten style recipes: the look, palette and motion of a genre, as a starting point for a new style |
| `tools/build.mjs` | Assembles `<piece>/index.html` (and `board.html`, the storyboard page) from the piece's `src/` parts, the kit and its style(s) |
| `tools/new-piece.mjs` | Starts a piece from a style's demo or a template, format-aware for the formats you list |
| `tools/new-style.mjs` | Starts a style folder (`kit.js` + a `STYLE.md` skeleton) for style-match |
| `examples/water-cycle/` | An 8 s cut-paper piece laid out for 16:9 and 9:16 |
| `examples/style-match/` | Three reference sheets, the `blueprint` style made from them, a piece in it and the comparison sheets |
| `skills/animate/` | The entry skill, its intake questions and the craft rules |

Styles: crosshatch, cut-paper, isometric, math, pixel, riso, sketchbook (adapted from animate), and
synthwave, liquid, aurora-glass, hud (Easel originals after mg-styles-15's style notes). A piece names one in
`piece.json` (`"style"`) and can mix in more (`"mix": ["riso"]`); an era then picks its style as
the fourth item of its `ERA_LIST` entry and takes that style's drawing functions from
`KITS.<name>`. See [styles/README.md](styles/README.md).

```text
node tools/build.mjs styles/riso/demo
```

Then render it with easel-core: `render_video` with `file` = the built `index.html` and
`audio: "page"` (the piece's own score, mastered to -14 LUFS). The page follows the engine's
`window.renderFrame(t)` contract, so every frame is exact and repeatable.

Adapted from cth9191/animate (MIT); see [NOTICE.md](NOTICE.md).

## Install

```text
/plugin install easel-motion --marketplace Sh0aib-Ja0allah/easel
```

On Claude Code older than 2.1.275, add the marketplace first:
`/plugin marketplace add Sh0aib-Ja0allah/easel`, then `/plugin install easel-motion@easel`.
