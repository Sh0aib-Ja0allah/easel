<!-- Easel (MIT): an original kit. The look follows the signature features of Vincentwei1021/mg-styles-15's
     22-hud prompt @ 49052d80bfaf9fa8412cc9710530e5e95a3b8d8c (github.com/Vincentwei1021/mg-styles-15,
     prompts/22-hud.md), MIT License, Copyright (c) 2026 Vincentwei1021; full text in NOTICE.md.
     No code, media or fonts from that repository are used. -->
# HUD

A fictional heads-up display: cyan linework on deep teal-black that builds up in staggered layers (a
hex grid, rotating rings with ticks, a radar sweep with blips, rolling monospace data, typewriter
status lines), then finds a target: lock-on brackets snap in and everything flips to alert orange.
Glow, a little chromatic offset and scanlines unify it. Motion on 1s.

## Palette

| Name (`HD.*`) | Value | Means |
|---|---|---|
| `ground` / `groundHi` | `#031417` / `#06262b` | the deep teal-black field |
| `cyan` | `#00e5ff` | every line and number in the normal state |
| `alert` | `#ff6a00` | the alert state (`HD_ALERT` blends everything toward it) |
| `ink` | `#d9fbff` | bright text |

## Signature techniques

1. **Layered build-up:** each element draws on in order (`hdRing(..., { draw })`, `hdRadar(..., { draw })`, `hdHex(size, reveal)` from the centre out), staggered by a few frames.
2. **Rings with ticks** rotating at different speeds and directions; one partial ring for asymmetry.
3. **The radar:** a conic sweep wedge, blips that flash as the sweep passes and fade (`hdRadar(x, y, r, { period, blips })`).
4. **Rolling data:** numbers scramble for about 0.18 s, then settle on their real values (`hdData`).
5. **Typewriter status lines** with a blinking block cursor (`hdType`).
6. **Lock-on:** four corner brackets snap from 1.4x to 1.0x with a fast-out, slow-in curve (`hdLock`), then `HD_ALERT` turns the display orange.
7. **The post pass:** a faint offset copy (chromatic edge), scanlines every 3 px, a vignette (`hdPost`).

## Frame checklist (on top of grammars/frame.md)

1. Cyan for normal, orange only for the alert; never both as decoration.
2. Small text is monospace (JetBrains Mono), uppercase for status, and stays inside the safe area.
3. Density with restraint: one centre of attention (the radar or the target), data at the edges.
4. Every number either rolls or holds; nothing jitters without meaning.

## Kit API

`hdGround()`, `hdHex(size, reveal)`, `hdRing(x, y, r, { draw, speed, span, ticks, w, phase })`, `hdRadar(x, y, r, { period, blips, draw })`,
`hdData(lines, x, y, size, { t0, stagger, roll })`, `hdType(str, x, y, size, t0, cps, { align, color })`, `hdLock(x, y, w, h, t0)`,
`hdPost()`, `hdHero`, `hdCaption`, `hdSnap`, `hdCol(alpha)`; the alert level `HD_ALERT` (0..1, set by the scene each frame); palette `HD`.
STYLE hooks: `backdrop` (ground and hex grid), `window` (a glowing frame), `blob` (an outlined shape), `hero` (a small reticle drone), `post`, `ones: true`.

## Do / don't

- **Do** stagger every build; snap the lock on a beat with a rising tone into it.
- **Don't** fill shapes solid, use real place names in the story text, or draw real military insignia.

## Not matched

The source film had a 3D wireframe hologram (three.js); this kit is Canvas 2D and has none.

## Proven on

`demo/` (6 s, 9:16 and 16:9).
