<!-- Easel: translated and adapted from alchaincyf/huashu-art-motion @ 9ff59339f934e08483ba0a5b1db20f4c2c421b35
     (github.com/alchaincyf/huashu-art-motion, references/风格配方/04_roman.md).
     MIT License, Copyright (c) 2026 alchaincyf (花叔 · 花生); full text in THIRD_PARTY_NOTICES.md.
     Modified by Easel (2026-10-11): translated to English; removed the source's characters, rig, drink choreography and arm-pose path, scene file names and helper names; removed researcher, font and eponymous pattern names (described the methods instead); folded the review revisions into the drawing steps, motion and pitfalls; reordered into the Easel recipe structure. -->

# Roman mosaic

Pompeian floor and wall mosaic, around AD 79: thousands of small stone tesserae set in grey mortar, laid in rows that follow the outlines of each figure (andamento), with a white halo of stones around every figure, a wave-scroll border, and an inset picture of a smoking Vesuvius. The core idea for animation: **the stone layout is computed once; colour flows through the stones each frame.** In a real mosaic the stones are fixed to the wall and only the image moves across them.

## Palette

- Wall: `#e4ddcd`.
- Halo (a 44-50 px white ring drawn around every figure and object so the stones lay a white edge along it): `#f5f1e8`.
- Outline: `#46322a`, 8 px (faces 8 px too, so they lay in rows; later raised to 10 px on faces).
- Mortar: `rgb(112,103,92)` with +/-8 noise.
- Picture frame: red `#a8322a`, then inward a dark red `#7c221d` line, a gold `#d0a23c` line, and a dark line.
- Volcano faces: light `#7c84b8`, mid `#4e5796`, dark `#2f3672`.
- Sky: `#9ec0d8` -> `#d3e3e4`.
- Hillsides: `#6f9341` / `#92b254`. Ground: `#cba344`. Cypress: `#2b5a2f`.
- Lava: `#d64a22` / `#f2952c`.
- Smoke: dark `#3f3c3a` -> light `#a29c94`.
- Figure dress: cream garment `#efe7d5` with red hem stripes `#a8322a`; red mantle fold lines `#7c221d`; gold brooch.
- Hair: gold `#dcaa42`, layering lines `#9c6c1c`.
- Lips: red `#a8282a`.
- Animal: orange `#dc8530`, darker back `#c06a24`, stripes `#9c4818`, white `#f7f2e8`, eye yellow `#e9c22c`, red collar `#b02a22` with a gold pendant.

## How it is drawn

1. **Split the renderer in two.**
   - **Init (about 206 ms, once at boot):** compute where every stone is, its size, orientation, which pixels belong to it and its bevel shading. Store `ID` (Int32 per pixel: stone index, -1 for mortar) and `SH` (Uint8 per pixel: shade, 128 = 1.0).
   - **Per frame:** redraw the flat colour "cartoon" underneath, `getImageData` once, sample the colour at each dynamic stone's centre (plus that stone's fixed colour jitter), fill the pixels of each dynamic rectangle with `colour * shade >> 7`, `putImageData` into your own offscreen canvas, and `drawImage` that onto the main canvas.
   - Only about 1 million pixels per frame are processed (the 4 border bands, the inset picture, the moving figures); a JS loop takes about 5 ms. Create every offscreen context with `{willReadFrequently: true}` so `getImageData` is fast.
   - Scale: about 17,900 stones, of which about 13,100 are in dynamic regions and get re-coloured every frame.
2. **Structure map.** Render the static cartoon plus frame 0 of the moving figures (leaving out any limb that moves a lot), downsample to 960x540. Mark an edge where the summed RGB difference between neighbouring pixels exceeds 34; also mark the boundaries between region classes (for example the border bands) as edges.
3. **Distance field.** An exact Euclidean distance transform (the two-pass, 1D lower-envelope method); about 20 ms at half resolution.
4. **Lay stones along the contours (andamento),** simplified from the classic decorative-mosaic simulation approach.
   - Candidate pixels satisfy `|d - (k + 1/2)*s| < 1.5` with k below the class's ring count, i.e. bands along the distance-field iso-lines.
   - From an unvisited candidate, walk the 8-neighbourhood, preferring the candidate most aligned with the previous step (direction smoothed 0.6 / 0.4); place a stone whenever the distance from the last one reaches s.
   - Stone orientation = tangent of the distance-field gradient.
   - A spatial hash keeps any two stones at least 0.8 x the mean size apart.
5. **Fill the gaps with regular rows.** For each class lay a grid with every other row offset by half a stone (row jitter +/-5%, column jitter +/-9%); place a stone wherever the minimum-spacing check (0.86) passes. This fills both the gaps between contour rows and the gaps along medial axes.
6. **Border bands laid separately.** Each side is laid in its own local coordinates as 11 rows of 7.6 px stones, widths along the band random in 0.86-1.14; corners are 11x11 square grids.
7. **Per-class settings.**

   | Class | Stone size px | Contour rings | Colour jitter |
   |---|---|---|---|
   | Wall | 12 | 1, then regular rows | +/-8%; 7% of stones darkened a further 12% |
   | Halo (white edge around figures and objects) | 11 | 9 (the whole halo follows contours) | +/-5% |
   | Figure bodies and objects | 10 | all | +/-5% |
   | Faces and animal heads | 6 (faces later 5) | all | +/-4% |
   | Hair | 8 | all | +/-5% |
   | Inset volcano picture | 9 | 2 | +/-6% |
   | Outer border bands | 7.6 | rows along the side | +/-5% |
   | Lettering | 7 | all | +/-5% |
   | Ground band | 13 | 1 | +/-6.5% |

   On top of the table: every stone gets an additive grey jitter of +/-7; 9% of stones lean warm (+12, +4, -8) and 7% lean cool (-6, 0, +9).
8. **Stone shape and mortar: weighted L-infinity Voronoi.**
   - Each stone is a rotated square. Its four half-extents are drawn independently as `s/2 * (1.08-1.28)`, and its rotation is jittered +/-0.06 rad. Distance from a pixel to stone k: `D = max(|u|/h+-, |v|/h+-)`, where (u, v) is the pixel in the stone's local frame and h is the half-extent on that side.
   - Rasterize by recording, per pixel, the smallest D1, the second smallest D2 and the owning stone; each stone visits its bounding box of 1.5h.
   - **Mortar** where `D1 > 1` or `(D2 - D1)*h/2 < g` with `g = clamp(0.1*s, 0.75, 1.25)` px, i.e. near the bisector between two stones. Joints come out about 1.5-2.5 px wide, and each stone gets an irregular edge cut by its neighbours, like real cut stone.
   - **Bevel shading:** within 2.2 px of the edge, brighten or darken by +/-16% from the dot product of the outward normal with the light direction (-0.6, -0.8) (lit top left, dark bottom right). Add a dome term of `-5% * D1^2` and +/-3% per-pixel grain.
9. **Faces readable in stone.** Face stones 5 px. Eyes: white 13x7 with a dark 8x7 (about 3 dark stones plus white); lips a red 8.5x6 ellipse (about 2 stones); brows 6 px dark brown. At first, eyes drawn as a 10x6 white plus a r 5.5 dark landed exactly as one white and one dark 6 px stone. At half-size 1080p the eyes and mouth read.
10. **Figure in Roman dress.** Cream garment with two red hem stripes; a red mantle in three pieces (diagonal across the back, across the knees, hanging down the front) with fold lines and a gold brooch; short sleeves made by clipping a circle of radius 62 centred on the shoulder inside the upper arm, with a red edge; gold hair with layering lines and a spiral bun at the back; a red ribbon drawn as a cubic Bezier that rotates with the head tilt.
11. **Animal head, Pompeian front view.** Two large r 17 yellow round eyes (radius 1.65 x the default), black slit pupils, 7 px dark eye rims, an 11 px dark head outline; in the class map the head is also drawn with 6 px stones so its outline lays in rows. Smooth the body outline into a pear shape instead of a polygon. Tail rings: `setLineDash([9,13])`.
12. **Lettering.** A short Latin warning inscription in hand-built **monoline heavy letters** (C as an elliptical arc; A, V, E, T, M as polylines): stroke 14 px, letter height 60 px, spacing 16, scaled horizontally to 600 px wide. Rule: mosaic lettering = monoline heavy strokes, each about 2 stones wide.
13. **Small props as moving inset tiles (emblema).** Take small props out of the cartoon and build them as a sprite of 4.4 px stones: for a two-handled cup at 1.3x, dark outline stones, a gold body darkened on the right, a bright rim with a dark interior, two handles and a foot. Each frame, overlay the whole sprite at the prop's position and tilt. Steam becomes two columns of white square stones rising on a sine, with mortar edges. Leave only the prop's white halo in the cartoon. Fade steam with alpha `1 - 0.85*progress` as the prop rises.
14. **Border as a conveyor belt.** At init, pre-bake a 2106 px stone strip (26 periods of the 81 px pattern). The stone layout also repeats every 81 px: each row has 11 stones of random widths normalized to exactly 81 px, and the jitter is reused per period, so the strip joins seamlessly at any phase. Each frame, for each of the four sides, `c.transform(side's local frame)`, clip, and `drawImage(strip, BW - 2*81 + phase, 0)`. The stones travel with the pattern. Corner squares stay static.
15. **Dynamic rectangles.** At init, sample every moving element across its range of poses (for example progress 0..1 in steps of 0.05, tail within +/-0.75), take the bounding boxes and pad by 58 px to cover halo and steam. Outside these rectangles, show the static frame-0 mosaic.

Performance: warm max 17-21 ms, p90 17.4 ms, mean 13-14 ms at 1920x1080; init 206 ms once at boot; all frames in this section (including transitions where two scenes are drawn) under 40 ms except the first cold-cache entry; deterministic.

## Motion

- **Wave-scroll border flowing clockwise.** Each side switches to local coordinates with `setTransform` (u along the clockwise direction, v from outside in) and draws the same running wave scroll: start from the inner black band, spiral radius 24 -> 5 over 2.25 turns, line width 13, period 81 px. Phase `15*lt + 81*easeInOut((lt - 0.485)/0.365)`: a constant drift plus one extra period during the reference clip's frames 226-248. (First version: drift 42 px/s with colour flowing through fixed stones; about 20% of border-band pixels changed between 0.4 and 0.9 s.)
- **Vesuvius smoking.** The crater is only 70 px below the frame top, so rising smoke is clipped almost at once. Instead, the whole grey cloud band drifts right at 55 px/s (period 380 px), 9 smoke puffs (`#3f3c3a` -> `#a29c94`) drift right low across the sky, 12 sparks (10 px squares on parabolic paths) fly, and the lava in the crater pulses. 4.4% of pixels inside the frame change.
- **Animal.** Tail swing amplitude x1.6 (the default amplitude is invisible at 9 px stones); on a blink the eye becomes orange stones with one dark line.
- **Held prop.** The emblema sprite follows the hand's path and tilt (tilt at most about 0.15 rad / 8.6 degrees, held from below so the forearm stays in front of the chin and the face stays visible).
- **Measured motion** (0.4 -> 0.9 s, after the beat zoom): whole frame 6.2%; border bands 20.4%, main figure 8.4%, inset picture 4.4%, animal 0.8%. Static-section motion amount after the conveyor-belt border (480x270 mean frame difference, frames 222-253): 1.98 -> 4.62, reference 2.90 (5.5 with 42 px/s drift, so the drift was lowered to 15 px/s).

## Pitfalls

- **`putImageData` ignores the canvas transform and clip.** Writing straight onto the main canvas bypasses the host's punch zoom and transition clipping. Write into an offscreen canvas, then `drawImage`.
- **Narrow shapes with no stones.** Allowing grid stones only where distance >= K x s left a 26 px wide tail with no stones at all, showing bare mortar. Relying only on the minimum-spacing check fixed it.
- **Too much mortar.** With half-extents `s/2 * (0.9-1.1)` the stones were smaller than their spacing and mortar covered about 40% of the area: sparse and weak. Make stones 8-28% larger than half the spacing and let the bisectors cut them; this is the key to the texture.
- **Thin letters break.** Filling text with a classical serif font, thin horizontal strokes broke at 7-9 px stones (E became F, A lost its bar) and tight spacing glued letters together. After three iterations: monoline heavy strokes, about 2 stones wide each.
- **Mush at large stone sizes.** At 15 px wall stones the hand and prop dissolved into big stones. A region of 8.5 px stones just for the arm's sweep looked like a pale patch when still. Final: one uniform 12 px wall (also closer to the reference's wall scale), with the dynamic wall sharing the same layout and only re-coloured. Never change stone size inside a dynamic region for detail; at rest it reads as a patch.
- **Half-updated stones.** Dynamic rectangles must be big enough, or stones crossing the boundary show half new colour, half old.
- **Smoke clipped away.** Smoke rising from a crater near the frame top is invisible; drift it sideways along the sky instead.
- **Colour-only motion is quantized away.** A slow pattern moving 1-3 px per frame barely registers once quantized by 7.6 px stones. Either move the stones with the pattern (conveyor belt) or make the displacement much larger than a stone.
- **Props under 3 stones wide do not read** in a fixed layout. Make them moving emblema sprites with smaller stones.
- **Too tall an animal.** Ear tips at y ~540 put the halo against the frame. Scaling 0.85 about the foot anchor (with the class map and dynamic rectangles scaled too) dropped them to ~590.
- **Beat zoom fakes motion.** A motion diff between 0.2 and 0.7 s reported 68% because the whole frame was zooming for lt < 0.37. Measure 0.4 -> 0.9 s.

## Not done yet

- When a figure raises a small prop to the face, hand, prop and face crowd together and are slightly blurry at 6-8.5 px stone sizes.

## Status

Recipe only: no Easel kit yet. Build one with easel-motion:style-match (use this recipe as the measured reference), on top of easel-motion's kit/core.js.
