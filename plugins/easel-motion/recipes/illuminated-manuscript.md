<!-- Easel: translated and adapted from alchaincyf/huashu-art-motion @ 9ff59339f934e08483ba0a5b1db20f4c2c421b35
     (github.com/alchaincyf/huashu-art-motion, references/风格配方/05_gothic.md).
     MIT License, Copyright (c) 2026 alchaincyf (花叔 · 花生); full text in NOTICE.md.
     Modified by Easel (2026-10-11): translated to English; removed the source's characters, rig, drink choreography, scene file names, helper names and the Latin sample words; replaced a named font with a generic description; generalized figure and animal techniques; folded the v2 tweaks into motion; reordered into the Easel recipe structure; "Not done yet" restates the source's last measurement (the source has no open-items list). -->

# Illuminated manuscript

A Gothic illuminated manuscript page, around 1290: burnished gold-leaf ground tooled with a diamond lattice, an architectural frame of gables, pinnacles and side columns, a pointed-arch window with stained glass, a column of blackletter text with red rubrics, ivy-vine borders, and small marginal creatures (a snail, a mouse, a tiny knight). The signature is the gold: a fine texture plus a moving highlight that catches every gold area on the page.

## Palette

- Parchment: `rgb(236,223,194)`.
- Gold leaf, interpolated across three stops: low `#9c6a1a`, mid `#d9a63a`, high `#f8de86`.
- Ivy leaves: rotating blue / red / gold; gold balls on the vine.
- Rubrics (sentence-initial words): vermilion.
- Halo: red ring with stamped dots on gold.
- Robe: red with thin gold vertical stripes and a gold hem; cloak: blue with a gold border.
- Steam: thin ink lines.
- Stained-glass glints: white radial glow.

## How it is drawn

1. **Static layer (cached).** In order: parchment -> gold leaf -> diamond-lattice tooling -> gable, pinnacles, side columns -> pointed-arch window and stained glass -> table, throne -> Latin text column -> small marginal knight.
2. **Gold mask (built once at init with the static layer).** For every pixel of the static layer compute a "goldness" `clamp((r - b - 70)/50) * clamp((g - b - 30)/40) * clamp((r - 140)/40)` and use it as alpha. Parchment (236,223,194) has r - b of only 42 and is excluded; pink bands have high b and are excluded too. **No need to redraw gold shapes to build the mask**: everything gold (background, initials, gold balls, gable finials) is caught by the highlight automatically.
3. **Gold-leaf texture** (fine texture plus highlight), shaded per pixel: `f = 0.52 + fbm(x*.0035)*0.42 + noise(x*.004, y*.09)*0.5 (horizontal burnishing) + upper-left light + grain +/-0.05`, then interpolated between the three gold stops. The burnishing noise's y frequency is over 20x its x frequency, so it reads as horizontal brushed metal.
4. **Diamond lattice.** Spacing 46 px, two families of diagonal lines (x + y = const and x - y = const). Draw each line twice: a dark line, then a light line offset 1.2 px, so it looks tooled into the gold. Press 4 dots into each diamond centre, light upper left, dark lower right.
5. **Leaf seams.** Every 118 x 125 px a very faint square seam, imitating separate sheets of gold leaf.
6. **Diagonal highlight.** On a 920 px wide scratch canvas draw a linear-gradient band with slope K = 0.45 ("/" direction). Multiply it by the gold mask with `destination-in`, then add it back onto the picture with `lighter` at alpha 0.85 (first version 0.62 with a narrower band).
7. **Four-point star glints.** The halo and 11 fixed points flash a four-point star while the highlight passes, tested by `|u - sweepX| < 70`. A gold vessel also gets a twinkling four-point star on its rim.
8. **Per-frame order:** stained-glass glints -> diagonal highlight -> four-point stars -> ivy vines -> snail -> running mouse -> animal -> human figure -> grain.
9. **Ivy vines.** Two stems of about 120 points each. Every 3-5 points hang a three-lobed ivy leaf (blue, red or gold in turn) or a gold ball with 3 tendrils. Leaf scale 1.05-1.45.
10. **Human figure, drawn layer by layer** (not through a one-call figure renderer, so the halo and cloak can be inserted between body layers): halo (centred on the head, offset (16, -22), r = 114, red ring with 36 stamped dots) -> long wavy hair -> red robe (thin gold vertical stripes every 20 px, a gold hem border) -> blue cloak (anchored at the nape and back, gold border) -> head -> gold vessel.
11. **Animal in the marginal-drollery manner.** A human-like face: a cream oval face, almond eyes with the pupils pushed to one side in a sidelong glance, heavy upper lids, raised brows, down-turned mouth corners, red cheeks. Draw only one front leg from the standard pose and add the other as a separate limb in a raised position.
12. **Text.** A blackletter (Fraktur) font at 44 px; at 50 px the line ran off the right edge. Sentence-initial words in vermilion, the medieval rubrication practice.

Performance: 11-22 ms per frame (median 12 ms); the static layer and gold mask are built once at init.

## Motion

All motifs are visible inside the 0.25-1.4 s window.

- **Highlight sweep at constant speed:** `x = lerp(150, 1650, (lt - 0.08)/1.15)`. It reaches the window at about 0.3 s and crosses the main figure at about 0.9 s.
- **Vines.** Each point sways `sin(t*2.1 + i*.09)*5` (amplitude 2.5 doubled in v2). Leaves swing about their attachment point by `sin(t*3.1 + k*1.7)*0.42` (0.28 in the first version).
- **Stained glass.** 40 random points (26 in the first version); a point lights up as a white radial glow while `sin(t*5 + h*40) > 0.6`.
- **Hanging creature.** A small creature held by the tail from a raised paw swings like a pendulum, `0.32*sin(t*5.5)`, legs kicking.
- **Snail** crawls left at 62 px/s with wobbling tentacles.
- **Mouse** runs 360 px under the text column between 0.12 and 1.17 s, legs swinging at 40 rad/s.
- **Steam** from a vessel as thin ink lines.
- Static-section frame difference: 1.10 -> 1.32 after the v2 tweaks (reference 1.64).

## Pitfalls

- **Eased highlight missed the figure.** With in-out easing the highlight had already left the gold area by 0.9 s, so it never showed on the figure. Moving it at constant speed fixed the timing.
- **Sparse vines.** Leaf scale 0.85 was too small and too sparse; 1.05-1.45 matched the reference density.
- **Beat zoom fakes motion.** A motion diff that uses lt = 0 as the baseline is polluted by the host's camera punch (1.03 zoom) during the first 20 frames. Take the baseline at lt >= 0.35.
- **Shared scratch folders.** When several people or sessions share one scratch folder, a self-check script got overwritten once. Keep self-check scripts in your own subdirectory.

## Not done yet

The source lists no open items. Its last measurement left static-section motion at 1.32 against the reference's 1.64.

## Status

Recipe only: no Easel kit yet. Build one with easel-motion:style-match (use this recipe as the measured reference), on top of easel-motion's kit/core.js.
