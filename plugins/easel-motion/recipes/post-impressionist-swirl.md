<!-- Easel: translated and adapted from alchaincyf/huashu-art-motion @ 9ff59339f934e08483ba0a5b1db20f4c2c421b35
     (github.com/alchaincyf/huashu-art-motion, references/风格配方/09_postimp.md).
     MIT License, Copyright (c) 2026 alchaincyf (花叔 · 花生); full text in NOTICE.md.
     Modified by Easel (2026-10-11): translated to English; renamed after the movement, not an artist; removed the source's characters, scene file path and helper names; replaced painting references with generic descriptions; generalised the figure technique to "the hero"; reorganised into Easel recipe sections. -->

# Post-impressionist swirl

Post-impressionism of 1889: a bedroom interior with a window onto a swirling night sky, painted in thick, directional, outlined brush strokes. Every region has its own stroke direction (vertical on the wall, along the perspective lines on the floor, spiralling around vortices in the sky) and its own swatch of a dozen or so hues, and the strokes boil at 8fps. This is the source's reference implementation: the impressionist and other stroke-based recipes follow its structure. Coordinates below are for a 1920x1080 frame.

## Palette

- Wall swatch (blues and violets): `#7f9be6 #5f7fd8 #a7bbf2 #6c6fd2 #8ad0e6 #c3cbf6 #4f6cc8 #9a8fe0`.
- Night sky swatch: `#22339a #2f4fb8 #5c86dc #8fb6ee #1b2a78 #3c6bd0`.
- Floor swatch (reds, oranges, with a green accent): `#c0573c #a8453a #d7774a #8e3b30 #5f8f6a #c96a52 #e08a5c`.
- Each stroke picks from its region's swatch and mixes 30-45% with the base colour underneath.
- Stroke outlines: mixed 40-45% toward dark blue.
- Environment line art: dark blue, 4.5px.
- Hero spiral bands: orange and light orange.

## How it is drawn

Performance: about 110ms per frame (three full-frame stroke passes).

1. Flat colour base: large areas only (wall, floor, window, bed).
2. Flow-field stroke repaint with region swatches, in three separate passes:
   - Everything that is not wall or floor: grid cell 10, stroke length 22, stroke width 6.5.
   - Wall: cell 14, length 64, width 8.
   - Floor: cell 12, length 46, width 8.
   - All passes: stroke outline 0.8-0.9, outline colour mixed 40-45% toward dark blue.
3. Direction field:
   - Wall: vertical, -π/2 ± 0.22*noise.
   - Floor: along the perspective lines, pointing at the vanishing point (960,330).
   - Night sky: along the tangent of the nearest vortex, plus a rotation of 0.3*t.
   - Lamp glow: around the circle.
   - Headboard: vertical. Bedsheet: close to horizontal.
4. Props layer: table, chairs, vase, picture frames and hanging lamp drawn as their own layer with their own small strokes using `source-atop`, so small objects are not broken up by the big strokes.
5. Environment line art: dark blue, 4.5px, boiling at 8fps.
6. Figures: flat fill -> a fine stroke pass with `source-atop` -> re-add lines and facial features.
   - On the hero's body: 7 orange / light-orange spiral bands, clipped to the body, rotating at 0.6 rad/s (the "swirling" body of the reference footage).
7. Moving highlights on top: dashed rings of the lamp glow expanding outward, twinkling stars, steam.

## Motion

- All strokes reseed at 8fps (boil), as does the dark blue line art.
- Night sky stroke directions rotate around their vortices at 0.3*t.
- Hero spiral bands rotate at 0.6 rad/s.
- Lamp glow: dashed rings expand outward.
- Stars twinkle; steam rises.

## Pitfalls

- Running one set of stroke parameters over the whole picture turns it into a carpet. Wall, floor and everything else must be three separate passes.
- Small objects get shattered by the big strokes. Always move them to a props layer with their own small strokes.
- Colour jitter alone gives "noise of one blue". The post-impressionist feel comes from region swatches holding a dozen or more different hues.

## Not done yet

The source lists no open items.

## Status

Recipe only: no Easel kit yet. Build one with easel-motion:style-match (use this recipe as the measured reference), on top of easel-motion's kit/core.js.
