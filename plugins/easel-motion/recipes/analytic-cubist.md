<!-- Easel: translated and adapted from alchaincyf/huashu-art-motion @ 9ff59339f934e08483ba0a5b1db20f4c2c421b35
     (github.com/alchaincyf/huashu-art-motion, references/风格配方/11_cubism.md).
     MIT License, Copyright (c) 2026 alchaincyf (花叔 · 花生); full text in THIRD_PARTY_NOTICES.md.
     Modified by Easel (2026-10-11): translated to English; renamed after the movement, not an artist; removed the source's characters, rig, transition ids and scene/cache/helper/function names; replaced a quoted collage headline with a generic description; generalised figure techniques to "the figure" and "the hero"; reorganised into Easel recipe sections. -->

# Analytic cubist

Analytic cubism of 1912: a cafe interior broken into overlapping translucent planes in a narrow palette of paper beige, ochre, brown and grey. Each plane is lit on one side and shaded on the other, planes pass through one another, and thin straight lines run across the whole picture (passage). Collage-like elements - stencilled letters, a newspaper fragment, comb-grained faux wood, cane chair weave - sit inside the planes, and the figures are themselves cut into large light/dark triangular facets whose edges spill past their contours. Coordinates below are for a 1920x1080 frame; `lt` is local time in seconds within the style's segment (about 0.47s on screen).

## Palette

- Paper: `#d6c8ac` (ground).
- Off-white: `#ece3cf` (plane highlights, light sand dashes).
- Ochre: `#b8975f`.
- Brown: `#6e5538`.
- Dark brown: `#3a2c1e` (plane shadows, dark sand dashes).
- Grey: `#a8a395`.
- Blue-grey: `#8e9eab` (also the front half of the face).
- Dark grey: `#5a5852`.
- Window view: `#c9d3da` / `#8fa3b3` / `#e4e6e2` / `#6f8597` / `#b4c1cb` / `#5f7385`.
- Figure skirt: `#6a7a8b`; sleeve: `#3c4857` (must be darker than the skirt; see Pitfalls).
- Skin: `#e2cfae`.
- Blonde hair: `#c9a256`.
- Hero fur: `#c8773a` / `#e8dfc9`.
- Lips: red; hero eyes: yellow.

## How it is drawn

Performance: warm frames average 13ms, max 19ms; the first frame (building caches) about 100ms. Deterministic. Motion between lt 0.34 and 0.46 changes 6.9% of pixels.

1. Background, fully cached - "transparent overlapping planes":
   - Plane primitive: each plane is a polygon filled with one linear gradient, starting at vertex 0 and ending at a randomly chosen other vertex, with three stops: base colour mixed 25% toward off-white -> base colour -> base colour mixed 40% toward dark brown. Alpha 0.18-0.7.
   - Stacking: 18 hand-placed large planes (following the reference composition) + 9 radial fan planes under the table (radiating from (1000,1090), alternating light and dark, alpha 0.3) + 70 random 3- or 4-sided polygons (kept out of the date area at the upper right). Many semi-transparent gradient planes on top of each other produce the analytic cubist space: transparent, interpenetrating, every plane light on one side and dark on the other.
   - Texture planes: 4 stippled planes (dots of radius 1.6 on a 9px diamond grid), 4 hatched planes (diagonal lines 7px apart), and a sheet of ruled paper along the left edge.
   - Short-dash sand texture: 9000 small dashes, 3-8 x 1.5px; 55% off-white at alpha 0.28, 45% dark brown at alpha 0.16. This gives the brick-like grain of the reference.
   - Passage: 46 thin straight lines running across the picture, 1.3px, alpha 0.55.
   - Faux wood (comb-grained, faux bois): draw S/6 wavy lines along the long edge of the board (S = the board's size); near each knot add a bell-shaped bump `14*exp(-(u-k)^2/0.01)` (u = position along the board, k = knot position); each knot is 4 concentric ellipses. Used for the table top and the board at the right.
   - Cane chair back: a 10px diamond grid of hole dots plus diagonal lines in both directions.
2. Window panes sliding as facets:
   - Cache the window view as one 560x540 image: 55 blue-grey facets, 3 diagonal light beams, the silhouette of a tall iron lattice tower, seagull arcs.
   - Four panes each clip that image with a different offset: `dx = sin(9*lt + 1.7*i)*18` plus a ±3 jitter at 10fps, `dy = cos(7*lt + i)*8`. The same view, misaligned in four panes, reads as several viewpoints combined.
   - In each pane a semi-transparent triangle slides across horizontally at 260px/s.
3. Stencilled "CAFÉ" letters that jump and swap:
   - Draw the word in Alfa Slab One (400), 104px, on a small offscreen layer.
   - Step at 12fps (`step = floor(lt*12)`) through the order list `CAFÉ / ACFÉ / CAÉF / CFAÉ`; on each step each letter gets a y offset of ±13 and a rotation of ±0.11 rad (from a hash).
   - Then cut horizontal and vertical gaps out with `destination-out` to make stencil letters. The gaps show the planes underneath, which looks more real than painting paper-coloured bars.
4. Newspaper fragment:
   - Cache a 300x190 image: "JOU" in Libre Baskerville bold (700) 84px, a two-line 12px French headline, and three columns of grey placeholder text.
   - Each frame it trembles at 8fps (rotation ±0.0125 rad, x ±1.5px), and its top-right dog-ear flips with `sin(20*lt)`.
5. Figures - a hand-written faceting pass:
   - Flat-fill the figure (no lines) into an offscreen layer.
   - Read back the pixels of its bounding box.
   - Build a jittered triangle mesh (each grid cell picks one of its two diagonals at random).
   - For each triangle, sample the colour at its centroid, scale its brightness by `0.8 + 0.38*rand`, and fill with a light-to-dark gradient from vertex 0 to vertex 2.
   - Draw the triangles back without clipping (skip triangles whose centroid alpha is below 120). Not clipping is the key: the silhouette edge is cut into jagged straight edges and some triangles poke out past the contour - the cubist "planes spilling over the contour".
   - Cell sizes: the main figure uses cell 58 (big planes); its hair area is cut again at cell 26, but only on pixels that look like blonde hair (`R > 150 && B < 130 && R - B > 60`); the hero uses cell 26.
6. After faceting, add the cubist structure back:
   - Face: re-lay two skin planes (light and dark), because faceting drags hair colour into the face; a blue-grey plane over the front half of the face at alpha 0.82; a frontal almond eye on a profile face; a spiral ear; red lips.
   - Clothing: a white collar as two triangles (light and dark) with three buttons; the skirt gets 8 radial cut lines from the waist with alternating light and dark wedges.
   - Outer contour as straight line segments, each extended 10-16px beyond both ends (lines overshoot).
   - The hero: a hexagonal head outline in straight lines, a straight-line body outline, yellow diamond eyes with vertical slit pupils, a triangular nose in profile.
7. On top: 5 planes at alpha 0.2 laid over the figures, shifting by `sin(6*lt)*8`. This embeds the figures in the space instead of leaving them pasted on the background.

## Motion

- The segment enters with a 0.24s fragment transition and stays on screen for 0.47s.
- Window panes: each pane's view offset `dx = sin(9*lt + 1.7*i)*18` (+ ±3 jitter at 10fps), `dy = cos(7*lt + i)*8`; a translucent triangle crosses each pane at 260px/s.
- Stencil letters: 12fps steps through `CAFÉ / ACFÉ / CAÉF / CFAÉ`, per-letter y ±13 and rotation ±0.11 rad per step.
- Newspaper: 8fps tremor (rotation ±0.0125 rad, x ±1.5px); dog-ear flips with `sin(20*lt)`.
- Faceted figures boil: at 8fps the mesh vertices jitter by ±8% of a cell and 16-35% of the triangles change brightness by ±12%, so the figures shimmer in place (as in the reference footage around frames 548-562).
- Top planes over the figures shift by `sin(6*lt)*8`.

## Pitfalls

- Non-determinism: the first frame differed from later ones. Two causes, both first-frame only:
  1. The first time an offscreen layer that is later read with `getImageData` is drawn, it is drawn on the GPU; after the readback Chrome switches it to CPU rasterisation, with different antialiasing -> different centroid colours -> different triangle colours.
  2. The bigger cause: the offscreen context's state (`lineJoin = 'round'` set by the faceting pass, `lineCap = 'round'` set by the contour-segment pass) carries over into the next frame, while the first frame used the default miter/butt.
  - Fix: create these layers with `getContext('2d', { willReadFrequently: true })`, and start every frame with `g.reset()` (clears pixels and state) instead of `clearRect`. Found by hashing three renders of the same `lt` and comparing.
- At faceting cell 34 the figure is covered in small triangles and looks like a low-poly 3D model, not cubism. Cell 58 gives the big light/dark planes.
- The second, finer hair pass first used a circular clip, which also turned half the face gold. Fix: filter by colour, only cutting pixels that look like blonde hair.
- The sleeve colour must be darker than the skirt, or a raised arm merges completely into the skirt's facets.

## Not done yet

- The main figure's overall contour is still realistic curves; faceting only changed the edges. A more thorough version would replace the shoulders, elbows and knees with a polyline skeleton before faceting.
- The reference is darker with stronger light/dark contrast (more large dark-brown planes); this version is too light.

## Status

Recipe only: no Easel kit yet. Build one with easel-motion:style-match (use this recipe as the measured reference), on top of easel-motion's kit/core.js.
