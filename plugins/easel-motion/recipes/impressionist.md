<!-- Easel: translated and adapted from alchaincyf/huashu-art-motion @ 9ff59339f934e08483ba0a5b1db20f4c2c421b35
     (github.com/alchaincyf/huashu-art-motion, references/风格配方/08_impressionism.md).
     MIT License, Copyright (c) 2026 alchaincyf (花叔 · 花生); full text in THIRD_PARTY_NOTICES.md.
     Modified by Easel (2026-10-11): translated to English; renamed after the movement, not an artist; removed the source's characters, rig, choreography and scene/helper/function names; replaced painting titles with generic descriptions; generalised figure lessons to "the figure" and "the hero"; folded the v2 revision into the sections below; reorganised into Easel recipe sections. -->

# Impressionist

Impressionism of 1874: a sunlit interior with a window onto a summer garden full of red poppies, painted entirely in short, broken strokes of pure colour over a pale ground. The wall is pink-lilac washed with warm yellow sunlight; shadows are lilac and blue, never black. Nothing is outlined. The picture is made of a flat colour base that is repainted by flow-field strokes picking from per-region swatches, and it stays alive through flickering patches of sunlight and gently swaying flowers rather than through boiling strokes. Coordinates below are for a 1920x1080 frame.

## Palette

- Ground (canvas primer): `#f2e6ee`, left showing in the gaps between strokes.
- Wall base: vertical gradient `#d8bede` -> `#f0c8cc` -> `#f2c4d4` (pink-lilac).
- Sunlight on the wall: a warm yellow radial gradient, radius 900, at the upper right.
- Region swatches (strokes pick from these; each pick is mixed 30-45% with the base colour underneath):
  - Wall: 9 colours, pinks, lilacs and yellows.
  - Sunlit wall: 7 colours, creamy yellows.
  - Floor: 7 colours, rose, orange and violet.
  - Sky, grass green, pale lilac curtain, blue-violet tablecloth: one swatch each.
- Window frame: white. Any base pixel brighter than (240,236,225) is mixed back toward white instead of taking a wall colour.
- Poppies: their red is not swatched; the base colour is kept as painted.
- White dress on a figure: sampled from a four-colour swatch of whites, pale lilac and cream yellow.
- Facial features: thin pale lilac lines.
- Sunlight patches and wall glints: bright yellow-white.
- Steam: white.

## How it is drawn

1. Flat colour base, redrawn every frame (the poppies, clouds, bouquet, potted plant and curtains all move):
   - Pink-lilac wall (`#d8bede` -> `#f0c8cc` -> `#f2c4d4`) with a radius-900 warm yellow sunlight radial gradient at the upper right.
   - Garden through the window: sky, a band of woods, a red-roofed house, meadow, 70 poppies, a woman with a parasol and a child among the flowers, flower clumps.
   - White window frame, pale lilac curtains, a small framed picture of a harbour sunrise on the wall, a round table with a white-and-lilac cloth, a vase, a teapot, a potted plant at the right.
2. Fill the canvas with `#f2e6ee` before the strokes, so the light ground shows through the gaps.
3. Stroke repaint in two passes:
   - Main picture: grid cell 11, stroke length 20, stroke width 7, outline 0, colour jitter 26. A mask excludes the window view and the small framed picture.
   - Window view and the framed picture: cell 6, length 11, width 4.5, drawn only inside that mask.
   - The framed sunrise picture uses horizontal "rippling water" strokes instead of diagonal ones.
4. Direction field:
   - Wall: slanting up to the right, -0.95 rad in the sunlit area and -0.55 rad elsewhere, plus ±0.55 noise.
   - Floor: close to horizontal.
   - Curtains and tablecloth: vertical.
   - Potted plant: radiating outward from the pot rim.
   - Sky in the window: horizontal.
5. Region swatches as listed in the Palette, mix-with-base 0.3-0.45. Two special cases: white window frame pixels (brighter than (240,236,225)) are mixed back to white, otherwise the frame is repainted in wall colours and disappears; poppy red returns "keep the base colour".
6. Make the stroke pass stable (see Pitfalls): stroke positions are fixed (no boil), and the palette lookup consumes exactly one random number per cell and always returns a colour.
7. Figures:
   - Flat-fill each figure first (no lines).
   - On the figure layer, run a stroke pass with `source-atop` (cell 7, length 13), so strokes land only inside the figure. Use a hand-written loop where each cell's random numbers come from a hash of its grid position (i,j), not from a running stream or an alpha mask.
   - A white dress samples a four-colour swatch of white, pale lilac and cream yellow.
   - Then add only the facial features in thin pale lilac lines. Impressionist figures get no outlines.
   - Hats, ribbons and sashes flutter.
8. Accents drawn on top: sunlight patches, sunlit wall glints, glints on the hero's lit side, steam.

Performance: about 69ms per frame (65-76ms), mostly two full-screen stroke passes plus one figure stroke pass.

## Motion

- Sunlight patches flicker and drift: 26 patches (6 on the table top, 20 on the floor). Intensity per patch is `0.5 + 0.5*sin(t*sp + ph)*sin(t*sp*0.53 + 2*ph)`, clamped, so the on/off rhythm is irregular. Flicker frequency `sp` is 5-11. Patches drift sideways ±44px (first version ±10px). Each patch is 40 short bright yellow-white strokes, reseeded at 8fps so the patch shimmers. Drawn with `source-over` at alpha 0.95.
- Sunlit wall: 60 diagonal bright strokes in the sunlit area, reseeded at 6fps so they flicker.
- Poppies: stem bases stay put; flower heads sway sideways by `sin(t*3.2 + ph + x*0.02)*(6 + r*0.6)`, with the amplitude raised to 10+ in v2.
- Clouds drift sideways at 45px/s.
- Curtains sway; the potted plant's whole foliage mass sways by `sin(t*1.9)*8`.
- Window flowers and grass: their strokes turn ±0.22 rad with the wind.
- Hero glints: 60 candidate points, limited with `isPointInPath` to the left (lit) half of the hero's body and head, each blinking with `sin(t*7 + h*30)`.
- Figures: ribbons and sashes flutter; secondary sway amplified about 2.2x in v2.
- Steam: white.
- The main stroke field itself does not move (no boil). Measured hold-section frame difference (at 480x270, frame counter masked, end-of-section transition frames removed): v2 mean 0.57, peak 1.9. The reference footage measures 0.77.

## Pitfalls

- A single coarse stroke pass blurred away the house and the woman with the parasol in the window, and brushed the small framed sunrise into a smear of diagonals. Fix: two passes (fine strokes for the window and the framed picture), and horizontal ripple strokes in the framed picture.
- White window frames were repainted in wall colours and vanished. Fix: detect base pixels brighter than (240,236,225) and mix them back to white.
- Sunlight patches composited with `screen` at alpha 0.75 were nearly invisible on the pink ground. Fix: `source-over` at alpha 0.95.
- If the figure drawer strokes some parts (hair locks, eyelids) even at line width 0, set its line colour to the hair gold (and set every other line colour it uses), or its dark default leaves black streaks beside the face.
- v1 boiled the whole picture at 8fps, and review found the full screen of strokes reshuffled every 7-8 frames (frame difference 18): v1 hold-section mean 4.14, peak 20.5, which reads as strobing. Fixing the seed was not enough. The stroke generator draws from one sequential random stream, and when the palette returns "keep the base colour" the colour jitter consumes 3 extra numbers. Whether a cell returns that depends on the base colour, so as soon as a poppy or the plant moves, every later cell's stroke is reshuffled. Fix: set boil to 0 and wrap the palette so each cell consumes exactly one random number and never returns "keep base" (it returns the base colour instead).
- The figure stroke pass originally used an alpha mask; when an arm moved, the set of skipped cells changed and the whole layer reshuffled. Fix: a hand-written loop with per-cell hashed random numbers. This also cut frame time from 115ms back to 72ms.
- "Alive" must come from local motion (light patches, flowers, clouds, curtains, plant, figure sway), not from re-rolling strokes.
- Performance: during a transition the engine draws both neighbouring styles at once; impressionist plus post-impressionist is about 69 + 110ms, over a 150ms budget, but only for the dozen or so transition frames.

## Not done yet

The source lists no open items.

## Status

Recipe only: no Easel kit yet. Build one with easel-motion:style-match (use this recipe as the measured reference), on top of easel-motion's kit/core.js.
