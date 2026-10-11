<!-- Easel: translated and adapted from alchaincyf/huashu-art-motion @ 9ff59339f934e08483ba0a5b1db20f4c2c421b35
     (github.com/alchaincyf/huashu-art-motion, references/风格配方/06_renaissance.md).
     MIT License, Copyright (c) 2026 alchaincyf (花叔 · 花生); full text in THIRD_PARTY_NOTICES.md.
     Modified by Easel (2026-10-11): translated to English; renamed after the movement, not an artist; removed the source's characters, rig, choreography, scene/cache/helper names and figure-specific idle poses; generalised figure lessons to "the figure"; folded the v2 revision into the sections below; reorganised into Easel recipe sections. -->

# Renaissance sfumato

High Renaissance sfumato, around 1503: a dim interior with a warm brown wall, a perspective tiled floor and an arched window that opens onto a blue, hazy distant landscape (aerial perspective). There are no outlines anywhere. Forms are modelled only with soft gradients and a gentle overall blur, so edges dissolve like smoke while faces stay readable. The surface reads as an old oil panel: yellowed varnish, canvas weave, faint brush texture and craquelure. Coordinates below are for a 1920x1080 frame.

## Palette

- Wall: textured fill from `#43321f` to `#22180e`.
- Distant hills (aerial perspective): from `#9fb4b8` (farthest, bluest, palest) to `#7d9294` (nearer).
- River valley: grey-green in the distance shading to warm ochre nearer (no hex values given).
- River: silvery white.
- Floor tiles: `#a88c64` and `#5c2418` (checkerboard).
- Drapery highlight folds: `rgba(200,70,60,.3)`; drapery shadow folds: `rgba(40,0,0,.45)`.
- Velvet sleeve light band: `rgba(170,200,140,.45)`.
- Tablecloth: white.
- Varnish glaze: a yellow overlay at alpha 0.07.

## How it is drawn

Frame cost: 16-37ms per frame (median 16ms).

1. Static room layer (cached once). Paint the whole room on a plain canvas first, then draw that entire layer into the cache through `filter: blur(1.3px)`. This is a whole-frame sfumato pass. The room contains:
   - Wall: the textured `#43321f` -> `#22180e` fill, plus a radial gradient for the glow around the window, darkened toward the top.
   - Window: a semicircular arched window; the stone frame is lit on its left side; the distant landscape shows through the opening.
   - Floor: a perspective checkerboard computed with a true projection: `y = 420 + f*h/Z`, `x = 960 + f*X/Z`, with `f = 1029`, `h = 5.75`, and `Z` starting at 16 and decreasing by 1.4 per tile row toward the viewer. The first row lands at y=790, then 825, 868, 922, 989, which matches the row spacing of the reference footage. Tile colours `#a88c64` and `#5c2418`, then a soft-light pool of light on top, then a radial gradient centred at (760,960) that darkens everything around it.
   - A square table with a white cloth and a ladder-back chair.
2. Distant landscape (aerial perspective), also static: three layers of hills, bluer and paler with distance (`#9fb4b8` -> `#7d9294`), silhouettes generated with fbm noise. Then a lake, a river valley grading from grey-green to warm ochre, a winding silver-white river whose width grows from 3px (far) to 16px (near), cypress and round trees, and a stone bridge.
3. Per frame, draw in this order: river glints (24 points drifting downstream and twinkling) -> birds -> the ornithopter (these three are clipped to the window opening) -> the figure layer -> light shaft and floating dust -> overlay.
4. Overlay layer (cached, drawn with one `drawImage` per frame):
   - Vignette: alpha 0.3 at radius 0.55, alpha 0.8 at the edge.
   - Yellow varnish glaze: alpha 0.07.
   - Canvas weave: one line every 3px.
   - Oil brush texture: 9000 strokes at alpha 0.022 / 0.028, line width 5-10, random direction.
   - Craquelure: a crack-network layer at alpha 0.32. Then take the same layer through `brightness(0) invert(1)` to turn it into white lines, offset it by 1px and draw it again at alpha 0.16 with `lighter` compositing. This imitates the bright lifted edge of flaking paint.
5. Sfumato on the figure. Draw the figure into an offscreen layer, processing only its region (320,180,1200,780). Composite it back in two passes: first a blurred, fully opaque pass, then a sharp pass on top. Current values (after the v2 fix): blur 1.6px, sharp layer alpha 0.82 (the first version used 2.6px and 0.38; see Pitfalls). Edges stay soft and features stay legible. The figure has no outlines; all volume comes from gradients:
   - Drapery folds: highlight folds `rgba(200,70,60,.3)`, shadow folds `rgba(40,0,0,.45)`.
   - Velvet sleeve: one light band `rgba(170,200,140,.45)` running along the direction of the arm bone.
   - Face: a gradient lit from the left, plus eye-socket shadows.
   - Pale forms: soft inner-edge shading of 14px at alpha 0.22, and blend neighbouring colours into a white area with a radial gradient instead of a hard boundary.
6. Ornithopter (a Renaissance flying-machine design), drawn inside the window: two bat-like wings, each built from a leading-edge spar, 6 radiating ribs and a scalloped trailing membrane; a tail rudder that also swings. The far wing is scaled to 0.78, drawn darker, with its flap phase offset by 0.5.
7. Light shaft: draw the wedge once into a cache through `blur(28px)`, then composite it every frame with `screen`.

## Motion

- Ornithopter: crosses the window from x=440 to x=790 (first version 470 to 740 over 0-1.35s), bobbing up and down and pitching ±0.07 rad. It is drawn at 1.6x its first-version size. Wing flap: `up = 0.5 + 0.5*sin(t*12 + phase)`, wingtip travelling between -118px and +24px. The tail rudder swings.
- Birds: 14 birds in the window, scaled 1-1.8x.
- River glints: 24 points drifting downstream and twinkling.
- Cloud shadows sweep across the river valley outside the window.
- Light shaft brightness varies as 0.75 ± 0.35, as if clouds pass in front of the sun.
- Floating dust: 70 particles (first version 46) rising slowly along the light shaft and twinkling.
- Idle motion on the figures was amplified roughly 1.6x to 3x in the v2 revision.
- Measured hold-section frame difference: 0.20 (review measure) / 0.30 (own measure) in v1, raised to 0.37 in v2. The reference footage measures 0.43.

## Pitfalls

- The first oil-texture pass used 26000 strokes at alpha 0.05 with directions following noise. The whole wall turned into post-impressionist swirls. Dropping to 9000 strokes at alpha 0.025 with random directions brought back the classical oil-panel feel.
- Inner-edge shading on a cream-white form at 26px and alpha 0.45 made it look like a glass dome. Fix: 14px at alpha 0.22, and blend the neighbouring colour into the white area with a radial gradient so there is no hard boundary.
- The first floor was too bright and too contrasty, like a vector illustration. The surroundings must be darkened, leaving only the pool where window light falls.
- The first ornithopter was a flat "paper plane" and nobody recognised it as a Renaissance flying machine. It only read correctly after redrawing the wings as ribbed fans (spar, radiating ribs, scalloped membrane).
- The first light shaft filled a polygon every frame; its two hard edges looked fake. Pre-blurring the wedge (28px) into a cache and compositing with `screen` fixed it.
- v2 review: the scene was too static (frame difference 0.20 vs 0.46 in the reference) and depth of field was inverted - the main figure was blurred while the view through the window was sharp. Fix: sfumato blur 2.6px -> 1.6px and sharp layer alpha 0.38 -> 0.82; enlarge the ornithopter 1.6x with a longer flight path (440 -> 790) and ±0.07 pitch; 14 larger birds; cloud shadows over the valley; light shaft brightness modulated 0.75 ± 0.35; 70 dust particles; stronger idle motion on the figures.

## Not done yet

The source lists no open items. After the v2 fixes, hold-section motion (0.37) is still a little below the reference footage (0.43).

## Status

Recipe only: no Easel kit yet. Build one with easel-motion:style-match (use this recipe as the measured reference), on top of easel-motion's kit/core.js.
