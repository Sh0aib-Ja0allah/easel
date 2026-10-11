<!-- Easel: translated and adapted from alchaincyf/huashu-art-motion @ 9ff59339f934e08483ba0a5b1db20f4c2c421b35
     (github.com/alchaincyf/huashu-art-motion, references/风格配方/10_nouveau.md).
     MIT License, Copyright (c) 2026 alchaincyf (花叔 · 花生); full text in NOTICE.md.
     Modified by Easel (2026-10-11): translated to English; renamed after the movement, not an artist; removed the source's characters, rig, choreography, transition ids and scene/cache/helper/function names; generalised figure techniques to "the figure" and "the hero"; reorganised into Easel recipe sections. -->

# Art nouveau poster

An 1896 art nouveau poster: a flat, lithographic composition inside a gold frame, with soft grey-green to peach backgrounds, a polka-dot ornament field, a mosaic band, a lettered banner and an arched stained-glass window with a rising sun. Everything is drawn with "whiplash" lines - variable-width ribbons that swell in the middle and taper at both ends, ending in spirals. Figures carry large decorative halos and have a thick dark outer contour with thin inner lines. A warm grain sits over everything, like a colour lithograph. Coordinates below are for a 1920x1080 frame; `lt` is local time in seconds within the style's segment (about 0.7s on screen).

## Palette

- Line: `#4e3320` (dark brown) - all contours, title outline, inner frame lines.
- Gold: `#c9a24a` / `#9c7a2e` - frame, ornaments.
- Cream: `#f6eedb` - title fill, steam ribbons.
- Background gradient: `#b9cba0` (grey-green) -> `#cfd3a6` (beige-green) -> `#ecc9a2` (peach).
- Dot ornament: `rgba(120,140,100,.38)`.
- Green banner: `#8fac80`.
- Skin: `#f6dcc4`.
- Blonde hair: `#e8bf55`, highlight `#f6dc8a`, shadow `#b9862a`.
- Dress: `#f4ecda`.
- Pink shawl: `#e6aaa5`, folds `#d48e8c`.
- Poppies: `#d9706a` / `#b4504b`, centres `#3f6a4a` with gold dots.
- Lilies: `#f7f2e6`.
- Wrought iron: `#3d7763`.
- Orange-furred hero: fur `#e39a4c`, cream `#fbf3e3`, stripes `#c0672c`, eyes `#e6c040`.
- Halos: pink `#ebb8b2`, teal ring `#5f9a8a`, red (the hero's small halo) `#b8473a`.
- Grain: warm brown.

## How it is drawn

Performance: warm frames average 29ms, max 37ms; the first frame (building caches) about 80ms. Deterministic: the same `lt` rendered twice is pixel-identical. Motion between lt 0.35 and 0.65 changes 13.1% of pixels.

1. Background, fully cached:
   - Three-stop vertical gradient grey-green -> beige-green -> peach (`#b9cba0` -> `#cfd3a6` -> `#ecc9a2`), filling only the inner frame area x 34..1886, y 32..907.
   - Dot ornament: each motif is a ring of radius 10 plus a centre dot of radius 2.6; row spacing 54, column spacing 62, odd rows shifted by 31 (diamond stagger); colour `rgba(120,140,100,.38)`.
   - Lithographic mottling: a small 240x135 fbm noise image scaled up and drawn at alpha 0.5 (hundreds of times faster than computing full-screen noise).
   - Mosaic floor band: 20x24 cells, 9 colours cycled with index `(k*7 + (k>>2)) % 9` to break up the pattern.
   - Green banner `#8fac80`.
   - Title: Marcellus regular (400), 76px, letter spacing 12; first a 7px dark-brown stroke, then a cream fill.
   - Gold frame: an outer 6px gold `#c9a24a` band with a 2px dark-brown line on each side of it.
2. Variable-width ribbon path, used for every whiplash line (stems, leaves, wrought-iron table legs, banner scrolls, hair, steam):
   - Densify the control points with an interpolating cubic spline that passes through every control point (4-10 points per segment).
   - Offset each point by w/2 to both sides along the normal and join both sides into one closed polygon; fill it.
   - Swell profile: width is thin at both ends and widest in the middle (a sine envelope up to `wmax`). This is the thick-thin "breathing" of the art nouveau line.
   - Spiral terminal: a spiral defined by centre, start radius, start angle, number of turns and direction, with the radius shrinking linearly to 15%.
3. Thick outer contour, thin inner lines - the whole-silhouette offset trick:
   - Draw the whole figure group (bodies, hair, shawl, the hero) into an offscreen layer L, with fills and 2px inner lines drawn part by part in paint order, so lines of hidden parts are covered correctly.
   - Copy L and tint the copy solid dark brown `#4e3320` with `source-in`.
   - On the main canvas, draw the tinted copy under L three times, at offsets (-1.5,-1.5), (3.5,4.5) and (2,2.5), then draw L.
   - Result: a 1.5px rim around the silhouette, 4-5px thick on the lower-right side, while inner lines stay 2px. Cost: only 3 extra full-screen `drawImage` calls.
4. Arched stained-glass window:
   - The sun is drawn first, then the hill bands over it, so the hills hide the sun naturally ("rising from behind the hill").
   - 14 radial lead lines from the sun centre, from radius 92 to radius 420.
   - Glass border: along the inner edge of the arch (straight sides plus an elliptical arc, rx 219, ry 130), one 14x14 colour chip every 17px, rotated to the tangent, cycling 6 colours.
5. Flowers: poppies and lilies on ribbon stems (three control points per stem curve), leaves as ribbons.
6. Halos: the figure's halo, radius 172, with 18 round studs and an inner ring of 32 rose-window petals; the hero's halo, radius 106, an eight-petal orange flower with a gold dashed ring.
7. Hair on the figure:
   - A large base mass: a 16-point smoothed shape whose outer edge waves by `sin(6t + y*0.035)*9`.
   - 7 curls behind the shoulders plus 2 curls in front of the shoulder. Each curl is a 12-point S-curve offset by `sin(7.4q + φ - 7t)*(6 + 20q)` (q = 0..1 along the curl, so a travelling wave runs downward), ending in a 1.2-turn spiral. Width tapers from 14-18 down to 2.5. Each curl has a cream-yellow highlight core and a thin dark-gold line.
   - 6 small curls along the top outer edge of the head for volume.
   - Every point follows the head-centre offset (when the head tilts, the hair moves with it; points further down follow less).
8. Decorative S-shaped steam from a cup:
   - 3 cream ribbons (widths 26, 20, 14), each with a 1.8px brown outline and a centre line.
   - Travelling wave `sin(4q + φ - 6t)*(18 + 70q)`; horizontal spacing spreads with height by a factor of `(1 + 2.6q)`; each ends in a 34px spiral.
   - The whole plume leans by `lean = -90 - 160*c`, where c (0..1) is how far the cup has been raised, so the steam tilts toward the window.
9. If a cup is lifted from the table, leave its saucer behind so the table does not look empty.
10. Grain over the top layer in warm brown (the source passes 0.05 and 0.14 to its grain helper, most likely grain scale and opacity), like a lithographic print.

## Motion

Every motif must read within the 0.7s on screen. The segment enters with an organic wave transition of 0.24s that grows out of the figure's halo at (1330,320).

- Sun rising: measured from the reference footage (frame 509 at (583,400) -> frame 530 at (576,299), about -5px per frame): `sy = 400 - (lt - 0.267)*288`, `sx = 583 - (lt - 0.267)*20`. At lt=0 the sun is at y=477 (hidden behind the hill); at lt=0.7 it reaches y=275.
- Lead lines turning: the 14 radial lead lines rotate by `+lt*0.9*0.25` with a ±0.04 wobble. They move with the sun, so the whole window's glass division changes - the most visible motion in the window.
- Poppies and lilies sway: flower head horizontal offset `sin(7.5t + φ)*13 + sin(3.1t + 2φ)*5`; only the upper part of each three-control-point stem curve is pushed; left and right clumps are in opposite phase; leaves at 0.3x the amplitude.
- Halos turn: the figure's halo studs rotate `+0.9t`, its inner petals counter-rotate `-0.63t`; the hero's flower halo rotates `-1.1t` and its gold dashed ring crawls via `lineDashOffset`.
- Hair: the base mass edge waves (`sin(6t + y*0.035)*9`); curls carry the downward travelling wave (`-7t`).
- Steam: travelling wave (`-6t`) and a lean that follows the cup.

## Pitfalls

- Drawing the figures' line art in a separate line-only pass on top makes hidden part outlines (for example a far sleeve) cut straight through the torso. Fix: draw fills and lines together, part by part in paint order, in an offscreen layer, then add the thick outer contour to the whole group.
- The first hair was 7 long 34px-wide bands, which looked like sausages or noodles. Art nouveau hair is one base mass plus thin S-curled locks ending in spirals, no wider than 18.
- Steam rising straight up crossed the figure's face once the cup reached the mouth. It must lean toward the window as the cup rises.
- For self-check diffs, do not use frames with lt < 0.33: in the first 20 frames after a transition starts the engine applies a 1.03x "beat impact" zoom, and the diff lights up across the whole screen.

## Not done yet

- The figures still use generic, realistic poses; the design calls for poses redrawn in the style. The art nouveau feel currently rests mostly on the halos and the thick-thin line.
- The title uses Marcellus; the design calls for rounder, hand-drawn art nouveau lettering. A custom set of letter paths could be drawn.

## Status

Recipe only: no Easel kit yet. Build one with easel-motion:style-match (use this recipe as the measured reference), on top of easel-motion's kit/core.js.
