<!-- Easel (MIT): an original kit. The look follows the signature features of Vincentwei1021/mg-styles-15's
     10-synthwave prompt @ 49052d80bfaf9fa8412cc9710530e5e95a3b8d8c (github.com/Vincentwei1021/mg-styles-15,
     prompts/10-synthwave.md), MIT License, Copyright (c) 2026 Vincentwei1021; full text in NOTICE.md.
     No code, media or fonts from that repository are used. -->
# Synthwave

An 80s retro night drive: a deep purple sky, a striped sunset sun, a neon perspective grid rushing at
the camera, wireframe mountains on the horizon, palm silhouettes, chrome type and a neon script, all
under a light VHS pass. Motion on 1s; the grid never stops moving.

## Palette

| Name (`SW.*`) | Value | Means |
|---|---|---|
| `skyTop` / `skyMid` / `skyLow` / `horizon` | `#12051f` / `#3a0c55` / `#8a1f7a` / `#ff4f9a` | the sky, dark to the hot horizon |
| `sunTop` / `sunMid` / `sunLow` | `#ffe066` / `#ff9a3c` / `#ff2a6d` | the sun's gradient |
| `grid` / `neonCore` | `#ff3df2` / `#ffe3fb` | grid lines and every neon tube's core |
| `cyan` | `#2de2ff` | mountains, the hero, the second neon colour |
| `floor` / `palm` | `#0d0322` / `#07020f` | the ground and silhouettes |
| `chrome` | `#2b2f77 #9fd3ff #ffffff #ff7ad9 #3a1c71` | the chrome type's gradient stops |

## Signature techniques

1. **The perspective grid:** one-point perspective, verticals fanning from the vanishing point, horizontals at `y = horizon + D / (1 + 0.55 z)` scrolling toward the camera (`swGrid(horizonY, rowsPerSecond)`).
2. **The sunset sun:** a gradient disc with horizontal bands cut out (thicker toward the bottom) that drift down slowly; it rises from behind the horizon (`swSun(x, y, r, rise)`).
3. **The double glow:** every neon line is drawn twice, a wide halo (6 px, 30 px blur) and a tight core (2 px, 4 px blur).
4. **Chrome type:** heavy italic sans, a five-stop metal gradient, a white bevel edge, a magenta drop glow, a four-point star glint sliding along the top (`swChrome`), slamming in from 1.6x.
5. **Neon script:** written on left to right, a rare flicker once lit (`swNeon`).
6. **The VHS pass:** 2 px scanlines every 4 px at 10% black, a vignette, an occasional tracking line (`swVHS`, the `post` hook).

## Frame checklist (on top of grammars/frame.md)

1. The horizon sits between 55% and 62% of the height; the grid fills everything below it.
2. Magenta and cyan carry every line; warm colours belong to the sun only.
3. One chrome word at most per frame; the script word is the second voice, smaller and tilted.
4. Something always moves: the grid, the sun's bands, the palms, a flicker.
5. Text stays inside the safe area at its largest moment (the slam overshoot included).

## Kit API

`swSky(horizonY)`, `swSun(x, y, r, rise)`, `swGrid(horizonY, speed, { vx })`, `swMountains(horizonY, { key })`,
`swPalm(x, y, scale, key)`, `swChrome(str, x, y, size, { pop, glint, maxW })`, `swNeon(str, x, y, size, { frac, color, rot, key })`,
`swVHS()`, `swHero(x, y, r, { mood, key })`, `swCaption(str)`; palette `SW`. STYLE hooks: `backdrop` (sky and grid),
`window` (a neon rim), `blob` (a filled shape with a cyan neon outline), `hero`, `post` (the VHS pass), `ones: true`.

## Review: colour cast

Synthwave is blue-purple by design (a purple sky over a violet floor), so easel-core's `qa`
colour_cast check (it refuses a video or still where more than 30% of frames are dominated by
blue-purple) fails every frame of it. The user chose this palette, so run `qa` on this style's
videos and stills with `"castMaxRatio": 1` and say so in the review. Every other check keeps its
default, and so does every other style (only synthwave, liquid and aurora-glass are blue-purple by
design).

## Do / don't

- **Do** keep the camera low and the grid fast; land the chrome slam on a beat with a riser into it.
- **Don't** add a third neon colour, flat white type, or real car or brand logos.

## Not matched

The source film used WebGL with bloom, real 3D mountains and a car; this kit is Canvas 2D: glow comes
from canvas shadows, mountains are a seeded ridge line, and the demo has no car.

## Proven on

`demo/` (6 s, 9:16 and 16:9).
