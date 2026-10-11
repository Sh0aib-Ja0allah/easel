<!-- Easel: translated and adapted from alchaincyf/huashu-art-motion @ 9ff59339f934e08483ba0a5b1db20f4c2c421b35
     (github.com/alchaincyf/huashu-art-motion, references/风格配方/03_greek.md).
     MIT License, Copyright (c) 2026 alchaincyf (花叔 · 花生); full text in NOTICE.md.
     Modified by Easel (2026-10-11): translated to English; removed the source's characters, rig, drink choreography and cup IK, scene file names and helper names; generalized figure and animal techniques; folded the review revisions into the drawing steps and pitfalls; reordered into the Easel recipe structure; added an empty "Not done yet" note (the source has none). -->

# Greek black-figure

Attic black-figure vase painting, around 530 BC: figures and objects as near-black glaze silhouettes on orange terracotta, details scratched through the black as fine clay-coloured incisions, and accents in added purple-red and white. The three parts are the whole trick and all three are required: **black silhouette + incised line + added colour**. With those, no texture is needed for the picture to read as a Greek vase. Pure Canvas 2D, no images.

## Palette

- Terracotta ground: `#dc6a2f`; bright terracotta (vase panel): `#e8803f`.
- Black glaze (all figures and objects, warm near-black, no outline): `#1b120d`.
- Incised line (scratched through the black to the clay): `#e8904c`, 1.5-2 px.
- Added purple-red (bands on hair ribbons, cuffs, hems, collars, cushions): `#8a2a37`.
- Added white dots: `#f6ead6`, r about 2, spacing 11-17 px.
- Added white on an animal (chest, muzzle, paws): `#efe1c8`.
- Reserved clay (areas left unpainted to read as white): `#f3cfa4`.
- Gold accent (hair in added colour): `#f2bd48`.
- Light orange incision on animals (stripe markings): `#f2913f`; animal nose pink `#e7897a` (later replaced by purple-red).
- Vignette outer edge: `rgba(30,6,0,.62)`.

## How it is drawn

1. **Clay ground (cached).** At low resolution (480x270) compute per pixel: fbm(x*0.016, 4 octaves) mottling +/-30, plus **horizontal banding noise** `noise(x*0.006, y*0.85)` +/-9 (wheel-throwing marks). Upscale to 1920x1080 (low frequencies are blurry anyway; 16x cheaper). Then:
   - 560 random horizontal hairlines (length 150-1050, alpha 0.03-0.08, dark and light) for fine throwing lines.
   - 420 small dark specks and 120 light specks; two grain layers.
   - 5 cracks: segments every 9 px with +/-2 px jitter; along the lower side draw a faint light edge offset 1 px, which instantly gives the crack thickness.
   - A warm radial brightening in the centre, 0.16.
   - Cold build of a whole frame: about 80 ms.
2. **Vignette (cached).** Radial 380 -> 1180, outer edge `rgba(30,6,0,.62)`; drawn last over everything, bands included.
3. **Static black-figure layer (cached).**
   - Picture frame: 18 px black border, a string of white dots at 11.6 px spacing, an inner fine line.
   - Grapevine: sine-wave stem with triangular grape clusters of 3-2-1 dots.
   - Table with animal-paw feet.
   - Turned chair legs: a width table of `[y, w]` pairs drawn as a mirrored polyline.
   - Swan-neck chair back: a 13 px thick stroked curve, an ellipse head and a triangular beak.
   - Amphora: 24 symmetric outline points, smoothed; the panel is reserved clay with a small black animal on it, a ray pattern at the foot, and a vertical gloss gradient at 0.09.
   - Two Greek inscriptions (step 4).
4. **Greek inscriptions.** The font set has no Greek glyphs, so write a **stroke table**: each letter is 1-3 polylines in a 0..1 unit cell. Letter height 30, stroke width 3.4, each letter's height x(0.9-1.06) at random, baseline jitter +/-6%, vertex jitter +/-0.7 px. Draw Omicron as a small circle (0.25 of letter height, as on the originals) and Iota 2 px wide. The hand-painted feel comes mainly from unequal letter heights and the small o.
5. **Scrolling pattern bands.** Pre-render each band as a strip of width W + 2P and draw it each frame with `drawImage(strip, -(off mod P))`.
   - Top: meander (Greek key), period 60 px, 7 px black line, unit polyline `[[4,46],[4,0],[50,0],[50,34],[18,34],[18,14],[36,14],[36,22]]` plus a continuous base line.
   - Bottom: lotus-bud chain plus ray pattern. The unit is 38 px but odd buds are filled purple-red, so the true period is 76 px (two units) and the strip must wrap at 76.
6. **Motifs inside the frame** (drawn every frame, clipped to the frame).
   - 6 dolphins as hand-written Bezier silhouettes: beak, dorsal fin, pectoral fin, forked tail, a belly incision and a white eye dot.
   - A ship: white sail with purple-red seams, crescent hull with a scorpion-tail stern, purple-red cabin, a reclining figure.
7. **Lyre.** Hangs from a peg; tortoise-shell soundbox = black circle + incised ring + 5 small incised circles.
8. **Rosette.** 8 black elliptical petals, incised petal dividers, purple-red centre.
9. **Human figure in black-figure.**
   - Fill the body parts directly as black silhouettes (far sleeve, skirt, torso, neck). Replace a far hand with a small ellipse: a detailed far hand reads as a blade inside a black silhouette.
   - Draw the head yourself in its rest coordinates (Greek profile: straight nose continuing the line of the forehead, small chin) together with the hair outline. Reproduce the head motion with the canvas transform `translate(neck) * rotate(tilt) * translate(-neck) * T`, and build the same matrix as a `DOMMatrix` so `Path2D.addPath(faceSilhouette, M)` gives a clip region for the face incisions.
   - Hair in added gold, inside a hair clip region: 11 wavy strands on the crown (quadratic Beziers with a normal offset of `2.6px*sin(7*pi*u)`), 8 long back curls (4.5 sine half-waves ending in a small spiral), a double-spiral bun, 4 small forehead curls, two spiral curls at the temples (underlay a 6 px black line, then 2.2 px gold, so they read even outside the silhouette). Gold lines need 2.5 px at 1080p; at 2 px they vanish in thumbnails.
   - Incisions: 16 drapery folds (clipped to the body), an almond eye (light eye white and black pupil; a frontal eye on a profile face), brow, nostril, lips, chin.
   - **Separate black-on-black overlaps with incision**: clip to the union of body and head, then stroke the near arm's outline as an incised line. Without this, an arm raised in front of the face merges into one black blob.
   - Added colour: a 15 px purple-red hem band with white dots; cuff bands (clip to the upper arm, draw a 15 px band along the arm's normal with incised lines above and below); bracelets; 8 small four-petal flowers of white dots; a hair ribbon.
10. **Animal in black-figure** (it must use the same technique as the human figures).
    - Black glaze silhouette. Colour zones only through added colour and incision: a 26 px purple-red saddle band along the back contour, a purple-red patch on the head (ellipse 46x22 clipped to the head), a black tail with a 7 px purple-red core.
    - Stripes are all `#f2913f` 3 px **incised lines**: 14 curved lines placed at equal arc length along the back contour, pointing toward the body centre; 3 on the thigh, 3 on the foreleg; a ring every 2 points along the tail. (Placing stripes by equal arc length along the contour, aimed at the body centre, looks far more natural than placing them by hand; an earlier tapered version used length 30-48 and root width 10.)
    - Chest, muzzle and paws in added white `#efe1c8`, with black incised toes.
    - Archaic incised almond eye: added-white eye, vertical-ellipse black pupil, small incised line at the outer corner; a blink is a single down-curving incised line.
    - Purple-red nose. Whiskers: incised where they cross the black face, black where they cross the clay.
    - Scale the animal 0.9 about its foot anchor to fit its layout box.
11. **Steam or smoke wisps.** Three thin black wavy lines, phase `t*9`.

Performance: warm max 15.9 ms / mean 7.6 ms / cold 80 ms (17 ms warm max after the band retune); deterministic.

## Motion

- **Bands.** Top offset `22*lt + 60*easeInOut((lt - 0.49)/0.35)`, moving left; bottom offset `-(18*lt + 76*easeInOut((lt - 0.477)/0.367))`, moving right. The reference clip only makes one eased one-period jump (its frames 169-191); a constant drift was added so the band visibly moves in the first 0.47 s too. Final drift: top 48 px/s, bottom 30 px/s (see Pitfalls).
- **Dolphins.** Swim +/-9 px back and forth along their own heading, angle +/-0.12 rad, period 0.85 s, phase offset 1.3 between dolphins.
- **Ship.** Bobs +/-4 px and rocks +/-0.025 rad about a pivot near its centre, period 0.9 s.
- **Lyre.** Swings about its peg by `0.09*sin(2*pi*lt/0.8 + 0.5)` (+/-5 degrees; the soundbox moves +/-17 px, clearly visible within 1 s).
- **Rosette.** Rotates at `lt*1.6` rad/s, alternating direction.
- **Animal.** Tail swing, blink, breathing.
- **Steam.** Wavy lines with phase `t*9`.
- Everything above is visible within the first 0-0.94 s. Static-section motion amount (480x270 mean frame difference): 1.87 -> 2.02 after the retune; reference 2.06. First-pass check: 22% of pixels changed between 0.2 s and 0.7 s.

## Pitfalls

- **Head like a helmet.** Scaling a generic hair outline up made the back of the head far too wide. Pull it in and keep long hair short of the shoulders.
- **Black hand, black prop, black face.** A small black prop held up near a black face merged into one blob. Three fixes together: incise the arm's outline where it overlaps the head; shrink the prop (half-width 44 -> 32); give the prop a purple-red rim line.
- **Prop endpoint at the face.** A wide, shallow cup tilted at the nose reads like a beak or a pipe stuck in the face, with the hand covering mouth and chin. Keep any tilt small (5 degrees or less), hold the object from below, and keep the forearm vertical in front of the chest so the profile line (nose, lips, chin) stays fully visible.
- **Animal too tall.** Unscaled, the animal's head poked into the frame above; scale about the foot anchor.
- **Two-unit bands.** When buds alternate colour, the true period is two units (76 px); the strip must wrap at 76 or the colour jumps every 38 px.
- **Identical grain layers.** If the grain generator is seeded from something like its cache key length, two grain layers with keys of equal length get identical patterns; give them different seeds.
- **Style break.** A bright-orange, big-round-eyed cartoon animal stood out instantly against black-figure figures. Every figure and animal must use the same three-part technique.
- **Integer-period scroll looks frozen.** After the top band jumps exactly one 60 px period, the frame is identical to before; stills and sampled frames read as "not moving". Raise the constant drift (top 22 -> 48 px/s, bottom 18 -> 30 px/s) so any two frames differ in phase.

## Not done yet

The source lists no open items for this style.

## Status

Recipe only: no Easel kit yet. Build one with easel-motion:style-match (use this recipe as the measured reference), on top of easel-motion's kit/core.js.
