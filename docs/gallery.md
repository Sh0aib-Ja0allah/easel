# Gallery

Every picture here was made by Easel itself (no third-party media): the style samples are frames
rendered by the engine from each style's demo, and the SVGs are the plugins' own examples, checked
by the tests. The HTML examples render with `node plugins/easel-core/engine/cli.mjs render_still
--json @args.json` (or ask Claude: "render this example").

## easel-motion: the style catalog

One frame from each style's short demo (`plugins/easel-motion/styles/<style>/demo/`; 6 seconds,
cut-paper's 8). Styles can be mixed inside one piece.

| | | |
| --- | --- | --- |
| <img src="../plugins/easel-motion/styles/crosshatch/sample.png" width="220" alt="crosshatch style sample frame"> | <img src="../plugins/easel-motion/styles/cut-paper/sample.png" width="220" alt="cut-paper style sample frame"> | <img src="../plugins/easel-motion/styles/isometric/sample.png" width="220" alt="isometric style sample frame"> |
| `crosshatch` | `cut-paper` | `isometric` |
| <img src="../plugins/easel-motion/styles/math/sample.png" width="220" alt="math style sample frame"> | <img src="../plugins/easel-motion/styles/pixel/sample.png" width="220" alt="pixel style sample frame"> | <img src="../plugins/easel-motion/styles/riso/sample.png" width="220" alt="riso style sample frame"> |
| `math` | `pixel` | `riso` |
| <img src="../plugins/easel-motion/styles/sketchbook/sample.png" width="220" alt="sketchbook style sample frame"> | <img src="../plugins/easel-motion/styles/synthwave/sample.png" width="220" alt="synthwave style sample frame"> | <img src="../plugins/easel-motion/styles/liquid/sample.png" width="220" alt="liquid style sample frame"> |
| `sketchbook` | `synthwave` | `liquid` |
| <img src="../plugins/easel-motion/styles/aurora-glass/sample.png" width="220" alt="aurora-glass style sample frame"> | <img src="../plugins/easel-motion/styles/hud/sample.png" width="220" alt="hud style sample frame"> |
| `aurora-glass` | `hud` |

The style-match example (a style made from three reference sheets, compared on a 10% grid):

<img src="../plugins/easel-motion/examples/style-match/compare/compare-idea.png" width="680" alt="our frame next to the reference, on a grid">

## easel-illustrate

| | | |
| --- | --- | --- |
| <img src="../plugins/easel-illustrate/examples/svg-illustration/lighthouse.svg" width="260" alt="lit lighthouse scene"> | <img src="../plugins/easel-illustrate/examples/concept-illustration/meeting-email.svg" width="260" alt="concept sketch: a meeting that could have been an email, with the card mascot"> | <img src="../plugins/easel-illustrate/examples/svg/bar-chart.svg" width="200" alt="bar chart with bars on the baseline"> |
| `svg-illustration`: a lit scene | `concept-illustration`: one idea, the card mascot | `svg`: a chart (bars on the baseline, proportional) |
| <img src="../plugins/easel-illustrate/examples/svg/progress-ring.svg" width="120" alt="progress ring"> | <img src="../plugins/easel-illustrate/examples/svg/spinner.svg" width="80" alt="spinner"> | `generative-art`: [tidal-script.html](../plugins/easel-illustrate/examples/generative-art/tidal-script.html), a seeded p5.js loop, with its [philosophy](../plugins/easel-illustrate/examples/generative-art/philosophy.md) |
| `svg`: a progress ring | `svg`: a CSS spinner (reduced-motion aware) | |

## easel-design

| | | |
| --- | --- | --- |
| <img src="../plugins/easel-design/examples/logo/concepts/a-letterform.svg" width="160" alt="logo concept: letterform"> | <img src="../plugins/easel-design/examples/logo/concepts/b-vial.svg" width="160" alt="logo concept: vial"> | <img src="../plugins/easel-design/examples/logo/concepts/c-grid.svg" width="160" alt="logo concept: grid"> |
| `logo`: three concepts | (each checked on a 16-512 px ladder, light and dark) | |

Icons (`icons`, a 24 px grid, `currentColor`):
<img src="../plugins/easel-design/examples/icons/svg/home.svg" width="32" alt="home icon"> <img src="../plugins/easel-design/examples/icons/svg/search.svg" width="32" alt="search icon"> <img src="../plugins/easel-design/examples/icons/svg/calendar.svg" width="32" alt="calendar icon"> <img src="../plugins/easel-design/examples/icons/svg/bell.svg" width="32" alt="bell icon"> <img src="../plugins/easel-design/examples/icons/svg/user.svg" width="32" alt="user icon"> <img src="../plugins/easel-design/examples/icons/svg/edit.svg" width="32" alt="edit icon"> <img src="../plugins/easel-design/examples/icons/svg/download.svg" width="32" alt="download icon"> <img src="../plugins/easel-design/examples/icons/svg/check-circle.svg" width="32" alt="check icon">

Pages (HTML; every one is rendered and checked by the tests, PDFs at their print size):
[feed post](../plugins/easel-design/examples/social-graphic/feed-post-1080x1080.html),
[story](../plugins/easel-design/examples/social-graphic/story-1080x1920.html),
[ads](../plugins/easel-design/examples/ad-creative/),
[A3 poster (PDF)](../plugins/easel-design/examples/poster/poster-a3.html),
[infographic](../plugins/easel-design/examples/infographic/home-delivery.html),
[deck (PDF)](../plugins/easel-design/examples/presentation/members-meeting.html),
[UI states](../plugins/easel-design/examples/ui-design/component-states.html),
[mobile screen](../plugins/easel-design/examples/ui-design/mobile-bills.html),
[landing page](../plugins/easel-design/examples/landing-page/home-physio.html),
[design-system specimen](../plugins/easel-design/examples/design-system/specimen.html),
[brand card (PDF)](../plugins/easel-design/examples/brand-identity/card.html),
[three directions](../plugins/easel-design/examples/directions/).

## easel-ai-media and easel-pixel

No gallery yet: their outputs come from your own provider account or your own Aseprite, and the
Easel project has not made live paid generations or drawn in Aseprite (both are on the owner's
list in the run report).
