<!-- Easel: translated and adapted from alchaincyf/huashu-art-motion @ 9ff59339f934e08483ba0a5b1db20f4c2c421b35
     (github.com/alchaincyf/huashu-art-motion, references/风格配方/02_egypt.md).
     MIT License, Copyright (c) 2026 alchaincyf (花叔 · 花生); full text in NOTICE.md.
     Modified by Easel (2026-10-11): translated to English; removed the source's characters, rig, drink choreography and its motion loop, scene file names and helper names; generalized figure and animal conventions; reordered into the Easel recipe structure; added an empty "Not done yet" note (the source has none). -->

# Egyptian tomb painting

New Kingdom tomb painting, around 1350 BC (the Amarna period): a cream plaster wall, no perspective, flat colour inside clean dark outlines, columns of hieroglyphs, four-colour block borders and the Aten sun disc with rays ending in small hands. The period look comes from the conventions (profile head with a frontal eye, both shoulders shown frontally), the palette and the density of pattern, not from any brush renderer. Lines do not boil.

## Palette

- Wall: `#eadcb8`; mottled dark areas `#d8c597`.
- Four-colour border blocks: red `#b8322a`, blue `#2a58a8`, yellow `#e2b13a`, green `#2e8a55`; off-white between blocks `#f2ead6`; black joints `#231a14`.
- Gold `#e0ab38`, dark gold `#a8741c`, bright gold `#f3d27a`; glyph "being written" flash gold `#f6c846`.
- Deep blue band: `#1c2236`.
- Red column-divider lines: `#9a2b22`.
- Aten sun disc `#c8372b`, rays `#c23a2a`, small hands `#b4452c`.
- Outline: dark brown `#2a1810`, 2.2-2.8 px.
- Skin: `#e6b282` (the light yellow-ochre convention for women).
- Linen pleat lines: `rgba(120,96,70,.5)`.
- Animal: orange `#e08a3c`, stripes `#b45a1c`, white `#f6efe0`, eye yellow `#e8cf4a`.
- Scarab: lapis blue `#2c56b0` with turquoise `#3fa6a0`.

## How it is drawn

1. **Static layer (cached once).** In order: plaster wall -> hieroglyph columns -> window (cornice, colour-block frame, white ground, Aten disc, rearing cobra) -> three pottery jars -> offering table and offerings -> gold chair -> blue bowl -> ground line and stacked bottom friezes -> deep blue band -> top, left and right colour-block borders.
2. **Moving motifs (drawn every frame, cheap):** water-ripple glyphs flowing, Aten rays with small hands opening and closing, two long rays reaching out to offer an ankh, a scarab pushing a sun ball.
3. **Figures** are redrawn in the Egyptian canon (see step 6 and 7) rather than with a generic figure renderer.
4. **Wall surface.** A mottled surface layer composited with `multiply` over the whole picture, plus a grain layer, plus 6 random-walk hairline cracks. The cracks live in the surface layer, so they cross the figures like real wall ageing.
5. **Hieroglyphs (the strongest period signal).**
   - 24 glyph functions: ankh, sun disc, bread, reed, owl, falcon, heron, horned viper, Eye of Horus, cartouche, scarab, seated man, leg, arm, basket, house, three strokes, feather, djed pillar, shen ring, pot, lotus, nfr, mouth, water ripple. Each is drawn in a ~50 px box with 10-20 strokes and carries its own candidate colours. Line width 3.1 (about 3 px after scaling), `round` caps.
   - Column layout measured from the reference: left, 3 columns at x 78-306 / y 66-566; upper centre, 4 columns at x 852-1172 / y 66-452; right, 4 columns at x 1560-1866 / y 252-882; lower left, 1 column at x 298-366 / y 614-886. Leave any title or date plaque area (here 1500-1890 x 40-210) as bare wall; starting the right columns at y 252 avoids it.
   - Packing: seeded RNG (seed 1350), fill each column top to bottom, glyph scale = column width / 78 x (1.0-1.14), gaps 6-11 px. Rules: no identical neighbours in a column, any glyph at most 3 times per column, scarab and water ripple down-weighted by 60%.
   - Compute the layout at module init and store positions, so the water-ripple glyphs can stay out of the cache and be drawn per frame. Guarantee at least 6 water-ripple glyphs.
6. **Human figure in the Egyptian canon.**
   - Profile face with a **frontal eye** drawn on it: almond white, black pupil r 4.2 touching the upper lid, upper liner 3.2 px trailing 18 px back (kohl tail), long brow.
   - **Frontal shoulders**: draw the torso as a wide trapezoid (both shoulders visible, wide at the top, narrow at the waist).
   - Translucent white linen: fill skin first, then white at alpha 0.9 so a little skin shows through. Skirt: 27 thin Bezier pleats fanning from waist to hem, clipped to the skirt, `rgba(120,96,70,.5)` at 1.3 px; vertical chest pleats every 9 px.
   - Broad collar: 5 concentric half-ellipses (blue, red, green, gold, blue; rx 50 -> 88, ry 24 -> 55), with 18 teardrop pendants alternating red and blue on the outer ring.
   - Braided wig: clip to the wig outline and draw 15 vertical braids; each braid is an 11.5 px dark-gold base line plus an 8.5 px gold line, with alternating diagonal segment marks every 8 px (herringbone); stagger the ends.
   - Jewellery: headband as a Bezier stroked 15 px black / 11 px gold / 3 px bright gold, with a trailing ribbon; large gold earrings; armlets (8 px gold with 2.5 px blue bars).
7. **Seated animal in the temple-statue pose.**
   - Silhouette: upright chest and round haunch; **keep the front legs inside the silhouette** as one white area from chest to paws, separated into two legs by two lines plus toe lines.
   - Profile head with tall pointed ears and a frontal almond eye (yellow, slit pupil, black liner tail), white muzzle, whiskers, gold earring.
   - Clip the collar to the union of body and head (`Path2D.addPath`), otherwise the round head stroke pokes through the neck. Gold Eye-of-Horus pendant.
   - Stripes: 9 dark arcs on the back, 4 on the thigh, 5 on the head; a tail band every 3 sample points; white tail tip.
8. **Scarab** scaled x1.22 overall, ball r = 23 x 1.22.

Performance: warm max 20.7 ms / mean 10.5 ms at 1920x1080 (21.7 ms max after the motion retune). Prewarm caches at boot so the first frame does not stall; deterministic.

## Motion

All motion is driven only by local section time `lt` and global time `t`, so it is deterministic.

| Motif | How | Numbers |
|---|---|---|
| Scarab pushing sun ball | `x(lt) = 800 + 642*(lt - 0.394)`, measured from the reference at 10.7 px/frame; wraps mod 2160; ball spin angle = ball centre x / radius; legs switch between two poses at `floor(lt*15) % 2` (every 4 frames at 60 fps) | scale x1.22 |
| Aten hands opening | `open = 0.5 + 0.5*sin(2*pi*lt/0.4 + k*0.9)`; finger spread `0.1 + 0.24*open` | period 0.4 s; 13 hands inside the window, 2 outside |
| Ray tremor | ray end `x += 3*sin(7t + 1.3k)`, `y += 2*cos(6t + k)` | +/-3 px |
| Water-ripple glyphs | zigzag phase = `floor(lt*12)*0.5`; steps at 12 fps, 4 steps per cycle | 0.33 s per cycle, reads as hand-drawn frame by frame |
| Animal | tail swish, blink, breathing upper body | - |

First-pass motion between lt 0.45 and 0.9 was 3.5% of pixels, concentrated on the hands, tail and figure: small, but all on focal points.

**Motion retune (v2).** Metric: mean absolute per-frame difference at 480x270 over the static section. Before 0.32, after 0.84 (reference 0.90).

- **Inscriptions being written.** Every 0.12 s take 6 glyphs from a shuffled list (seed 77, across all columns). Erase each one by `drawImage`-ing the matching sub-rectangle of the wall texture, then re-stroke it with `setLineDash([p*95, 999])` so it is traced stroke by stroke (each sub-path restarts its dash, which looks exactly like writing one stroke at a time). Filled parts appear only when p > 0.55. Stroke colour starts at bright gold `#f6c846` and settles back to the glyph colour, with a 10 px gold `shadowBlur` afterglow. A glyph takes 0.36 s; about 18 are being written at once.
- **Aten pulse.** Period 0.45 s. Ray length varies +/-9% in sequence across the fan (phase -0.55k, like a wave sweeping through); ray width 2.2 -> 3.8; hands scale 0.9-1.2 and finger spread 0.03-0.45. A gold halo and bright ring pulse outside the disc; redraw the disc on top so it stays red. Clamp hand positions inside the window (x 428-752, y <= 512) or extended hands get clipped by the frame.
- **Animal.** Tail amplitude `tail*2.1 + 0.25*sin(9.5t)`; the two ears flick out of phase (one 0.1 s flick every ~0.38 s, rotating 0.32-0.38 rad about the ear-base midpoint).
- A looping arm-and-head action on the main figure contributed the most motion of any change.

## Pitfalls

- **Scarab wallpaper.** The first glyph layout had no limits and the screen filled with scarabs like stickers. Fix: the per-column repeat limits and down-weighting above.
- **Wig as caviar.** Small round beads all over the wig read as "gold caviar". Long strands with diagonal segment marks read as braids.
- **Bowling-pin legs.** Front legs drawn as two separate white columns looked like bowling pins. Keep them inside the silhouette.
- **Collar poking through.** Without clipping to body union head, the head's stroke shows through the collar.
- **Beat zoom fakes motion.** A motion diff between 0.2 s and 0.7 s showed "the whole frame moving": that was the host's beat punch zoom (lt < 0.36 s), not the scene. Compare frames with lt >= 0.4.
- **First texture build stalls.** The surface texture takes about 170 ms to generate the first time; prewarm it at init or the first transition frame hitches.
- **Do not copy transition debris.** Rubble in the reference frames was left over from a transition, not part of the picture.
- **Tall parts against neighbours.** An animal's ear tips (y ~530) overlapped the window's bottom colour blocks (y 530-560), as if the head were stuck into the frame. Fix: scale the animal 0.85 about its foot anchor (ear tips to y ~585), transform the long rays' end points by the same transform so the hands still land at the head, and move the back line and haunch forward 12-20 px for a longer seated pose. Lesson: aligning each element to its own layout box is not enough when two boxes sit close (here y ~540-600); check parts that exceed the skeleton box, such as tall ears, against nearby objects separately.
- **Thin lines do not register as motion.** Rays and ripple glyphs barely score in a 480x270 frame diff. "Visibly moving" needs local actions with enough area (arm plus head, whole glyphs erased and rewritten); thin-line wiggle is only garnish.
- **Pulse washed the disc orange.** A semi-transparent orange overlay on the disc turned the red disc orange at peak. Use a halo and bright ring outside the disc instead.

## Not done yet

The source lists no open items for this style.

## Status

Recipe only: no Easel kit yet. Build one with easel-motion:style-match (use this recipe as the measured reference), on top of easel-motion's kit/core.js.
