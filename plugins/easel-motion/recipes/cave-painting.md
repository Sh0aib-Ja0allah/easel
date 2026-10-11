<!-- Easel: translated and adapted from alchaincyf/huashu-art-motion @ 9ff59339f934e08483ba0a5b1db20f4c2c421b35
     (github.com/alchaincyf/huashu-art-motion, references/风格配方/01_cave.md).
     MIT License, Copyright (c) 2026 alchaincyf (花叔 · 花生); full text in NOTICE.md.
     Modified by Easel (2026-10-11): translated to English; removed the source's characters, rig, drink choreography, scene file names and helper names; generalized character-specific techniques to "a figure" / "an animal"; replaced a named font with a generic description; merged the palette into one section; reordered into the Easel recipe structure. -->

# Cave painting

Upper Palaeolithic rock art, around 40,000 BC (the tradition of sites such as Lascaux): ochre and charcoal pigment soaked into a lumpy limestone wall, animals as filled silhouettes with charcoal outlines, negative handprints blown around a hand, all lit by a flickering fire. Everything is drawn in code (no bitmaps); the wall relief is precomputed once and the paint layer picks up the rock texture through a single full-screen composite.

## Palette

- Wall: light ochre `#ce925a`, dark `#6e4426`, red patches `#b6643a` (blended by low-frequency noise).
- Charcoal line: `#21150d`.
- Red ochre (human figures' skin, title): `#9c3520`; dark red ochre `#74261a`.
- Title red: `#9b2a18`.
- Yellow ochre: `#c9772f`; light yellow ochre `#cf8f2c` with dark umber strand lines `#6e3c0e`.
- Hide / fur tone: `#b06a2c`; spots `#4e2610`.
- Chalk white: `#f0dfbf`.
- Bison body `#8c3d22`, bison head `#76301a`.
- Horse: `#cf8236`.
- Stone props: `#c98c50` / `#c08048`.
- Flat rock ledge / table surface: `#d49a5a`.
- Handprint pigment: `#8e2a1a`; handprint highlight fill `#f6e2bc`.
- Embers: `#ffe082`.

## How it is drawn

1. **Rock wall (fully cached).**
   - Compute a height field at half resolution (960x540), using full-resolution pixel coordinates: `fbm(x*0.0022, 4 octaves)*1.0 + fbm(x*0.011, 3 octaves)*0.16 + noise(x*0.05)*0.03`.
   - Normals by finite differences scaled x52. Light L = (-0.55, -0.62, 0.56) (upper left). `shade = clamp(0.5 + (dot - 0.56)*0.9)`.
   - Base colour: blend between `#ce925a` / `#6e4426` / `#b6643a` with two low-frequency fbm layers, then multiply by `(0.72 + shade*0.55)`. Upscale to full screen with smooth interpolation so the relief stays soft.
   - Add two grain layers: dark (density 0.22, alpha 0.32) and light (density 0.10, alpha 0.28).
   - 10 random-walk cracks: each step turns by up to +/-0.45 rad, step length 14-40 px, 12% chance to branch. Under each dark line draw a light line offset by +1.6 px so the crack reads as incised.
   - Vignette: radial gradient r 260 -> 1180, outer alpha 0.8. A static warm centre light composited with `lighter` (alpha 0.36) lights only the wall.
2. **Pigment soaked into the rock.** Every shape uses one drawing routine:
   - First stroke with a **fuzz pattern** (sparse charcoal dots), width `2*lw + 7`.
   - Then stroke with an **ink pattern** (charcoal black with 7% random holes, plus larger holes where noise > 0.58), width `2*lw`.
   - Finally fill flat, which covers the inner half of the stroke. Result: a solid charcoal line with a sprayed, fuzzy outer edge. Painter's order handles occlusion for free (an arm covers the line of the garment behind it).
   - After the whole pigment layer is drawn, composite one figure-texture image over it with `source-atop`: shadowed rock -> black at alpha `(0.5 - v)*150`, lit rock -> warm white at alpha `(v - 0.5)*50`, dark and light grain, low-frequency wet/dry blotches at alpha <= 70. The pigment layer costs only one full-screen composite.
   - All fills are opaque flat colour; the texture is what makes them "dirty". Do not lay pigment on with `multiply`: chalk white disappears.
3. **Negative handprints / paw prints.** On a 320x320 temporary canvas, spray Gaussian dots (sigma 46*s, 3200 dots at alpha 0.15-0.6, plus sigma 28, 1400 dots), then cut out a solid hand mask with `destination-out`, and finally fill the mask at alpha 0.3 with `#f6e2bc`. Fill the hand mask piece by piece (see Pitfalls).
4. **Firelight.** Each frame, one radial gradient centred at `(1000 + 40*noise(t*3.1), 540 + 26*noise(t*2.3))`, intensity `0.13 + 0.09*noise(t*8.5) + 0.04*sin(21t)`, composited with **`overlay`** at alpha = intensity x 2.6. Over it, an outer vignette that breathes opposite to the firelight.
5. **Embers.** Three particle groups (left x 0-360, 11 particles; right x 1540-1920, 12; centre, 5). They drift from y 1110 up to 120 with a 5.5 s life. Bright core r 2.2-4.6 with a glow 3.2x the core radius; flicker `|sin(6t + 1.9i)|`; fade in and out with `sin(q*pi)` over life; composited with `lighter`.
6. **Animals (bison, horse).** Legs are charcoal lines only (as in the originals); bodies are filled silhouettes with a 22 px dark wash along the spine (Lascaux-style shading).
7. **Human figures in the period manner.** Fill exposed skin as a flat red-ochre `#9c3520` silhouette. On a profile face keep a single almond eye (off-white eye, black pupil, one lash; a blink turns it into an arc). Hair: yellow-ochre fill with about 6 wavy strand lines in `#6e3c0e` (wave amplitude grows with strand length) and a wavy outline; the lower half of each strand gradually stops following head rotation, so a head tilt does not swing the whole mass. Hide garments: jag the hem every 15 px by +/-16 px for a fur edge, add about 26 spots (a round blotch plus 7 small dots each) and 18 short fur strokes. Hide seams between two pieces by stroking both edges first and then filling both.
8. **Animal tails and markings.** Stroke a tail in three passes (fuzz, ink, colour) and add a cross stripe every 4 sample points.
9. **Title.** Bold handwritten font at 78 px, letter spacing 7, horizontally scaled to 930 px wide, colour `#9b2a18`. Drawn into the pigment layer so it takes the rock texture too.

Performance: warm max 22 ms / mean 21.1 ms per 1080p frame; cold cache built at boot; deterministic.

## Motion

- **Charcoal "boil".** The two 256 px patterns (fuzz and ink) are randomly translated with `pattern.setTransform` every 1/9 s. Geometry stays still while the grain jumps: cheaper than jittering paths and never distorts the shapes.
- **Animal two-pose cycle.** `ph = floor(t*60/7) % 2` (switch every 7 frames). Leg end points have two coordinate sets (extended / tucked); the head rotates about the neck point by +/-0.07 rad; the whole body alternates y -3 / +1 px. Horse and bison run in opposite phase.
- **Steam / smoke wisps.** Three charcoal lines `x0 + sin(13q - 11t + 1.3j)*6`, 58 px tall.
- **Blink** on any eye: swap the eye for an arc.
- **Title fade.** alpha = 1 while t < 0.933, then `1 - (t - 0.933)/0.2`.
- **Motion-amount retune** (metric: mean per-frame absolute difference at 480x270 over the static section). First pass measured 0.62 against 0.86 in the reference clip: too still. Fix with local motion only, never full-screen flicker:
  - Firelight intensity `0.14 + 0.11*noise(9.5t) + 0.04*sin(23t) + 0.03*sin(37t)`; centre wanders +/-60 / +/-36 px (was +/-40 / +/-26). Going bigger (+/-0.16, +/-90 px) pushed the score to 1.22 and the picture shook; backed off.
  - Embers 28 -> 49 (left 20, right 20, centre 9); core r 2.6-5.4; glow alpha 0.32 at 3.6x; flicker `0.3 + 0.7*|sin|`.
  - Handprints pulse: each gets an r = 105 warm radial gradient (`lighter`) at alpha `0.2*clamp(0.5 + 0.9*noise(7t + 3.7k))`, each with its own phase.
  - Animal bounce raised from +/-3 to 9 px vertical and +/-3 px horizontal; head swing +/-0.12 rad.
  - Small head moves on an animal: a `sin(pi*q)` envelope over about 0.27 s, head lifts and turns -0.16 rad about the neck point, ears tremble +/-0.06 rad at 60 Hz.
  - Result: 0.62 -> 1.06 (reference 0.86); max 22 ms per frame.

## Pitfalls

- **Relief too strong reads as camouflage.** With the mid-frequency term at 0.35 and normals x60, the wall became camouflage / sand dunes, and figures under the texture looked like they wore camo. Dropping the mid-frequency term to 0.16 and normals to x52 made it read as rock.
- **Hand mask with gaps.** Adding the palm ellipse and finger capsules into one Path2D and filling once lets opposite winding directions cancel under the nonzero rule, leaving holes. Fill each piece into the mask separately.
- **`lighter` washes out ochre.** Firelight composited with `lighter` bleached saturated ochres to pinkish white. Switching to `overlay` brought the colour back.
- **Do not `multiply` pigment** onto the wall: chalk white vanishes. Use opaque fills and let the `source-atop` texture dirty them.
- **Tall parts poking into neighbours.** An animal whose ear tips rose into the bottom edge of a painted frame was scaled 0.86 about its foot anchor (translate, scale, translate back), leaving about 30 px of clearance; line widths scale with it and nobody notices.

## Not done yet

- Human figures built from smooth, realistic curves are "too fluent" for real rock art. A more primitive look: downsample the outline to 12-16 points and add more hand-drawn jitter.
- The wall relief is static; the firelight changes brightness but not shadow direction. For relief that seems to move under flickering fire, precompute two shade maps with different light directions and interpolate between them by fire intensity (one extra full-screen composite).

## Status

Recipe only: no Easel kit yet. Build one with easel-motion:style-match (use this recipe as the measured reference), on top of easel-motion's kit/core.js.
