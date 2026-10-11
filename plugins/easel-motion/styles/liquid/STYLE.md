<!-- Easel (MIT): an original kit. The look follows the signature features of Vincentwei1021/mg-styles-15's
     07-liquid prompt @ 49052d80bfaf9fa8412cc9710530e5e95a3b8d8c (github.com/Vincentwei1021/mg-styles-15,
     prompts/07-liquid.md), MIT License, Copyright (c) 2026 Vincentwei1021; full text in NOTICE.md.
     No code, media or fonts from that repository are used. -->
# Liquid

Glossy candy liquid on a deep plum ground: drops fall and squash, blobs fuse as metaballs with
stretched necks, a wave floods across, and a wordmark coalesces out of the liquid. Everything is
flung, never uniform. Motion on 1s.

## Palette

| Name (`LQ.*`) | Value | Means |
|---|---|---|
| `ground` / `groundHi` | `#2a0a2e` / `#4a1450` | the plum ground (a soft radial lift in the middle) |
| `orange` / `pink` / `violet` | `#ff7a1a` / `#ff3d8b` / `#8a3dff` | the liquid's ramp, top to bottom |
| `spec` | `#fff4fa` | specular highlights |
| `ink` | `#ffe9f3` | captions |

## Signature techniques

1. **Metaballs:** a scalar field (sum of r^2 / d^2 per ball, softened with `tanh`) on a quarter-resolution grid, thresholded with an anti-aliased rim, scaled up smoothly (`lqField(balls, { wave, mask, hue })`).
2. **Fake 3D light:** normals from the field's gradient; a diffuse term, a Blinn-Phong highlight and a fresnel rim, so the liquid reads as thick and glossy, not flat.
3. **Drops:** fall with ease-in, squash flat on landing and throw two small droplets that follow a beat late (`lqDrop`).
4. **The flood:** a liquid floor with a wavy front of several phase-offset bulges rises across the frame (`wave`).
5. **The wordmark:** the word is drawn into a blurred mask that joins the field, so letters fuse with blobs as they coalesce (`lqWordMask(str, x, y, size, coalesce)`).
6. **Easing:** `lqEase` (fast out, slow in); nothing moves at constant speed.

## Frame checklist (on top of grammars/frame.md)

1. The liquid always has a highlight and a rim; a flat-coloured blob is a bug.
2. Fusions show a neck before they merge; drops squash on landing.
3. Keep the ground dark and plain; the liquid carries all the colour.
4. One wordmark at a time, set large in Space Grotesk 700.

## Kit API

`lqGround()`, `lqField(balls, { wave: { y, amp, phase }, mask, hue })`, `lqDrop(x, y0, y1, r, t0, dur)` (returns balls),
`lqWordMask(str, x, y, size, coalesce)`, `lqHero(x, y, r, { mood, key })`, `lqCaption(str)`, `lqEase(u)`; palette `LQ`.
STYLE hooks: `backdrop` (the ground), `window` (a glossy rim), `blob` (a candy gradient shape with a highlight), `hero`, `ones: true`.

## Review: colour cast

Liquid is blue-purple by design (violet liquid on a deep plum ground), so easel-core's `qa`
colour_cast check (it refuses a video or still where more than 30% of frames are dominated by
blue-purple) fails every frame of it. The user chose this palette, so run `qa` on this style's
videos and stills with `"castMaxRatio": 1` and say so in the review. Every other check keeps its
default, and so does every other style (only synthwave, liquid and aurora-glass are blue-purple by
design).

## Do / don't

- **Do** keep balls few (under a dozen per frame) and large; the field is computed every frame.
- **Don't** use thin lines or small text near the liquid; it reads as clutter.

## Not matched

The source film rendered signed-distance metaballs in a WebGL shader at full resolution; this kit
computes the field on the CPU at quarter resolution and scales it up, so edges are softer.

## Proven on

`demo/` (6 s, 9:16 and 16:9).
