<!-- Easel: adapted from cth9191/animate @ 7e5eb56feb2dd573f890e1b7b34748af43d58263
     (github.com/cth9191/animate, plugins/animate/skills/animate/styles/pixel/STYLE.md).
     MIT License, Copyright (c) 2026 cth9191; full text in NOTICE.md.
     Modified by Easel (2026-10-11): links follow the Easel layout (grammars/); resolutions per format
     (pixels stay square in 16:9, 1:1 and 4:5 too). -->
# Pixel

![sample](sample.png)

Pixel art. Every picture is drawn at a low internal resolution — 90x160, 135x240, 180x320 for a 9:16 frame; 160x90, 240x135, 320x180 for 16:9 — with whole-pixel primitives in a limited palette, then scaled up nearest-neighbour to the frame. Hard square pixels, ordered (Bayer) dithering instead of gradients, a built-in 5x7 bitmap font, sprites from string arrays, and screen effects that belong to a device: an LCD grid for a handheld, scanlines and a curved-tube vignette for an arcade. **Resolution can tell time:** an early era is chunkier than a later one, so a chronology gets sharper as it goes.

## Resolutions per era

Each era picks a pixel size that divides the frame exactly, so every pixel is a whole square on screen. Declare it in `src/bridges.js` as `ERA_RES = [[w, h], ...]` or as pixel sizes (`ERA_RES = [12, 6]`); scenes draw with `lowres(ERA_RES[e], ...)`, and the STYLE hooks read it to size morph windows, the morphing blob and the post effects.

**Pixels stay square in every format.** The kit reads a `[w, h]` pair by its short side, so `[90, 160]` means 12 px pixels: 90x160 on 9:16, 160x90 on 16:9, 90x90 on 1:1. It never stretches a picture to a frame of another shape. A scene drawn for 90x160 has to be laid out again for 16:9: place things with the `w, h` that `lowres` passes to `draw(w, h)` (or `PORTRAIT` / `WIDE`), as other styles use `LX` / `LY`.

| pixel size | 9:16 (1080x1920) | 16:9 (1920x1080) | 1:1 (1080x1080) | feels like | glyphs across 9:16 / 16:9 (5x7 font) |
|---|---|---|---|---|---|
| 20 / 15 px | 54x96 / 72x128 | 96x54 / 128x72 | 54x54 / 72x72 | the earliest, blockiest eras | 9 / 12, 16 / 21 |
| 12 px | 90x160 | 160x90 | 90x90 | a 4-colour handheld | 15 / 26 |
| 8 px | 135x240 | 240x135 | 135x135 | an early home console | 22 / 40 |
| 6 px | 180x320 | 320x180 | 180x180 | a 16-colour arcade | 30 / 53 |
| 4 px | 270x480 | 480x270 | 270x270 | a late, detailed era | 45 / 80 |

Divisors of both 1080 and 1920 (9:16, 16:9 and 1:1): 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30, 40, 60, 120. **4:5** (1080x1350) needs a size that also divides 1350: 6 (180x225), 10 (108x135), 15 (72x90), 18 (60x75) or 30 (36x45); any other size is cropped by a few pixels at the bottom. Keep at least a 2x step between neighbouring eras so the change reads on a phone. The demo goes 90x160 (12 px) → 180x320 (6 px): the moon is 17 pixels across, the coin it becomes is 37.

## Palettes

`PAL16` and `HANDHELD` in `kit.js`. One palette per era; give each era a different one when the eras are different devices.

- **PAL16** (16 colours): ink `#14101e`, night `#232a4e`, blue `#2f5fa8`, sky `#5fb4e6`, ice `#a8f0f0`, white `#f4f0e6`, grey `#8a8ca0`, slate `#4a4e66`, green `#2e8a4a`, lime `#8ad04a`, yellow `#f6d64a`, orange `#f08a32`, red `#d83a3a`, pink `#f07aa8`, purple `#6a3a8a`, brown `#7a4a2a`. **Orange is the hero's body** (`HERO_PAL`).
- **HANDHELD** (4 greens, darkest first): `#0f2a14`, `#306a2e`, `#8aac2a`, `#c4d870`. Everything in such an era — sky, trees, hero (`HERO_HH`), text, window rims — is one of these four.
- **Enforce it:** `lowres(res, draw, { fx: { pal: HANDHELD } })` snaps every pixel of the era's picture to the nearest palette colour after drawing. Set `ERA_POST[e].pal` too, so the morph's backdrop and blob dither with the era's own colours.
- The paper (the blank screen a morph happens on) is ink `#14101e`; in an era with its own palette it snaps to that palette's darkest colour.

## The font

`FONT5`: 5x7 glyphs, one number per row (bit 16 = the left column), A–Z, 0–9 and `. , ! ? : - + / ' " > < * = ( ) # % _ $`; lower case draws as upper case. A glyph advances 6 pixels. `pixText(str, x, y, colour, { scale, count, align, shadow, cursor })` draws it with whole-pixel rects (one per run of lit pixels). `count` is the typing reveal; `cursor` blinks a block after the last typed glyph. Text always lives in the era's own resolution, so it is chunkier in early eras — that's the point. Never use a system font for on-screen text.

## Dithering

A 4x4 Bayer matrix (`bayer(x, y)` → a threshold in 0..1). `pgrad(x, y, w, h, colours)` dithers a vertical (or `horiz`) gradient through a list of palette colours; `pdither(x, y, w, h, a, b, f)` puts colour b wherever `f(x, y)` beats the threshold; `pglow(cx, cy, r0, r1, colour, amt)` is a dithered halo for moons, lamps and coins. Shading on round things (the hero, the blob) is a light top-left and dark bottom-right, dithered at the boundary. Never use a smooth gradient: a gradient is two or three palette colours and a dither.

## Era effects

Two places, both deterministic (keyed on `B`):
- **On the low-res picture**, `lowres(..., { fx })`: `pal` (snap to palette), `posterize: n`, `noise: count` + `noiseAmt` (colour noise), `blocks: frac` + `bs` (JPEG-ish flattened blocks), `flicker: amt` (brightness jitter), `blur: px` (a soft, early-generative look; it breaks the palette, so keep it to one era).
- **On the screen**, `ERA_POST[e] = { scan, lcd, vignette, rim, pal }` drawn by `STYLE.post` on the era's pixel grid: `scan` darkens the bottom third of each pixel row, `lcd` draws a thin gap between pixels, `vignette` dithers the corners dark (a curved tube), `rim: [light, dark]` colours the morph window's rims.

## Motion habits

- **On 2s** (`STYLE.ones = false`). TT steps at 12 fps; a one-pixel-per-step move is a steady 12 low-res px/s, sprites have two frames, and on-1s motion would only add in-between positions that pixel art doesn't draw. A piece that needs smooth scrolling can set `STYLE.ones = true` in its scenes.
- **Whole-pixel moves only.** Positions are integers in pixel space (`Math.floor(TT * 12)` per boil, `Math.round` on eased paths). Nothing slides by a fraction of a pixel.
- **Sprite frames flip on beats** (`Math.floor(TT / BEAT) % 2`): idle squash, ears, tufts of grass, tree tips. Walk cycles flip every pixel or two. Spins step through 4–6 widths on 8ths.
- **Jumps are parabolas in whole pixels** (`Math.round(Hmax * 4u(1 - u))`), with the shadow shrinking under them.
- **Things blink rather than fade:** stars, fireflies, lit windows, cursors — on/off keyed on `B` or the beat, never an alpha ramp.
- **No camera.** `pieceCam` returns null; move the world instead. A camera on the context is honoured (pans snap to whole pixels) but zooms would make pixels uneven; to "zoom in", cut to a finer resolution.
- The morph: the old era shrinks into a stepped window on its own grid, the blob morphs while its grid steps from the old era's pixel size to the new one (12 → 10 → 8 → 6 px), and the new era opens from a stepped window on its finer grid.

## Frame checklist (on top of grammars/frame.md)

1. **Every edge on the pixel grid.** No anti-aliasing, no sub-pixel motion, no arcs, strokes or font text: zoom into a still at full size and every edge is a staircase of equal squares.
2. **A limited palette per era:** 4 colours for a handheld, 16 for an arcade, each era's own. Enforce with `fx: { pal }`; mixed colours are dithered, never blended.
3. **Readable silhouettes at the true resolution.** Check the scene at its internal size (90x160 is tiny): the hero, the bridge object and the caption read as shapes there. Rim-light dark shapes on dark skies (the demo's pines get a one-pixel moonlit edge).
4. **A hero acting:** `pixHero` with eyes that look at things, a mood (`wow`, `happy`), a hop or a jump, a `!` bubble when it notices something.
5. **3+ details of background life:** blinking stars, fireflies, a walking critter, drifting clouds, windows lighting on the beat, a patrolling slime, sparkles.
6. **A full-bleed world:** sky, horizon and ground to the edges; UI panels (tags, captions, HUD) sit on top of it.
7. **Text in the pixel font, in the era's resolution:** captions type themselves on with a blinking block cursor; tags pop in at double size for one boil.
8. **Resolution tells time:** later eras are sharper (and usually more colourful). The bridge object keeps its screen position and size; only its pixel size changes.
9. **Inside the safe area** (x 60–940, y 250–1500) for every tag, caption, HUD line and the hero.

## Kit API

`styles/pixel/kit.js` (needs `W`, `H`, `CX`, `BEAT` from the piece head; optional `ERA_RES`, `ERA_POST`):

- **The low-res pass:** `lowres(res, draw, { fx, al })` (res = `[w, h]` or a pixel size), `withGrid(G, fn)` (pixel primitives straight onto the screen at G px per pixel), `pixToScreen(x, y)`, `pixToWorld(x, y, res)` (a pixel's centre in frame coordinates — use it to place bridge shapes), `pixFromWorld(x, y, res)`, `PIX` (the current mapping).
- **Primitives (pixel coords):** `pset`, `prect`, `pfill`, `pline` (Bresenham), `pellipse(cx, cy, rx, ry, c, { ring })`, `pcircle`, `ppoly(points, c)`, `polySpans`, `pdither`, `pgrad`, `pglow`, `cellR`.
- **Colour:** `PAL16`, `HANDHELD` (`PAL4`), `PIX_ALL`, `bayer`, `BAYER4`, `ditherPair(c, pal)`, `nearestC`, `posterize`, `shadeC`, `rgbOf`, `hexOf`, `pixFX`.
- **Text and sprites:** `FONT5`, `pixText`, `pixTextW`, `sprite(rows, map, x, y, { flip, scale, anchor })`, `SPR` (spark, twinkle, heart, note).
- **Hero:** `pixHero(x, y, r, { pal, mood, look, hop, frame, blink, key })` → `{ top, foot }`; sets `SPARK_AT`. `HERO_PAL`, `HERO_HH`. `pixBubble(str, x, y, o)`, `pixBox(x, y, w, h, { bg, edge, shadow })`.
- **Overlays (DEFER, in the era's resolution):** `pixCaption(str, { fg, bg, edge, y, cx, at, dur, scale })`, `pixTag(str, o)`, `pixOverlay(draw)` for a HUD or score.
- **Hooks' helpers:** `gridAt(t)`, `gridOfEra(e)`, `eraLook(e)`, `eraPal(...eras)`, `gridMask`, `maskRing`, `maskPath`, `pixPost`.
- **STYLE:** `paper` ink; `backdrop(c)` = c as a two-colour dither on the era's grid; `window(P)` = the world through P rasterised on the era's grid, a stepped edge with light and dark one-pixel rims and a shadow; `blob(P, c)` = P as chunky dithered pixels whose grid steps between the eras' sizes; `hero` = `pixHero` on the current grid; `post` = `ERA_POST` effects; `ones: false`.

## Do / don't

- **Do** pick pixel sizes that divide the frame in every format the piece lists (the table above), and place bridge objects with `pixToWorld` so the morph lands on the drawn object.
- **Do** design sprites at their true size (a 6x4 beetle, an 8x6 slime) and procedural shapes (`pixHero`, `pcircle`) at the era's resolution, so a later era's hero has more pixels, not bigger ones.
- **Do** keep UI panels pixel-native: one-pixel borders with clipped corners, a palette fill, the bitmap font.
- **Do** give dark shapes a one-pixel rim light, and a sparkle or glow to the thing the eye should land on.
- **Don't** draw with `arc`, `stroke`, `fillText`, `filter` or alpha ramps inside `lowres` (the opt-in `fx.blur` aside); don't scale sprites by non-integer amounts; don't move anything by fractions of a pixel.
- **Don't** mix palettes inside an era, or use a smooth CSS/canvas gradient anywhere.
- **Don't** zoom the camera; cut to a finer resolution instead.
- **Don't** imitate any specific commercial game's characters, logos or iconic blocks; the arcade vocabulary (coins, bricks, a score) is generic.

**Proven on:** a fixed-stage history of AI video (each era's picture rendered at its true resolution and scaled up nearest-neighbour, with per-era noise and blur); this demo (a 4-colour handheld dusk at 90x160 whose moon becomes a spinning coin over a 16-colour arcade night at 180x320).
