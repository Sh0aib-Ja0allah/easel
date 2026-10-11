<!-- Easel (MIT): an original kit. The look follows the signature features of Vincentwei1021/mg-styles-15's
     12-aurora-glass prompt @ 49052d80bfaf9fa8412cc9710530e5e95a3b8d8c (github.com/Vincentwei1021/mg-styles-15,
     prompts/12-aurora-glass.md), MIT License, Copyright (c) 2026 Vincentwei1021; full text in NOTICE.md.
     No code, media or fonts from that repository are used. -->
# Aurora glass

Slow, translucent, expensive: large blurred aurora blobs in adjacent hues drift over a deep indigo
ground, frosted glass cards float above them with small UI inside, and a glass lens glides across,
magnifying the light. Everything eases on a sine; nothing is fast. Motion on 1s.

## Palette

| Name (`AG.*`) | Value | Means |
|---|---|---|
| `ground` | `#0b0a1f` | the deep indigo base |
| `blobs` | `#7b5cff #3d6bff #3ee0ff #c45cff #5c8cff` | the aurora: violet, blue, cyan, magenta (adjacent hues only) |
| `ink` / `inkDim` | `#f4f2ff` / 62% of it | type and UI |

## Signature techniques

1. **The aurora:** five big circles on 20-40 s closed paths, blurred about 120 px and added together, with 4% grain on top so gradients never band (`agAurora`).
2. **Frosted glass cards:** the aurora blurred 30 px behind the card, a 7% white fill, a 1.5 px 30% white highlight, a 44 px radius, a soft shadow, a slight tilt; they float in with opacity and an 8 px rise (`agCard(x, y, w, h, { rise, tilt, draw })`).
3. **Micro-UI inside cards:** a breathing voice waveform (`agWave`), toggles (`agToggle`), light type (`agText`, weight 200-400, tracked).
4. **The glass lens:** a circle that magnifies the aurora under it, with a dispersed rim (magenta and cyan rings offset) and a specular edge (`agLens(x, y, r, zoom)`).
5. **Sine easing everywhere** (`agSine`); text enters with opacity and a small rise only.

## Frame checklist (on top of grammars/frame.md)

1. Two or three adjacent hues at most; complementary colours look dirty here.
2. Dark ground, bright blobs; never a light ground.
3. Every glass surface has its 1 px highlight and something blurred behind it.
4. Nothing moves faster than a slow breath.

## Kit API

`agAurora({ intensity })`, `agCard(x, y, w, h, { rise, tilt, radius, draw: (w, h) => ... })`, `agText(str, x, y, size, { rise, weight, align, track, color, alpha })`,
`agWave(x, y, w, h, { bars, level })`, `agToggle(x, y, scale, on)`, `agLens(x, y, r, zoom)`, `agHero`, `agCaption`, `agSine`; palette `AG`.
STYLE hooks: `backdrop` (the aurora), `window` (a soft glowing rim), `blob` (glass), `hero` (a small glass orb), `ones: true`.

## Do / don't

- **Do** keep cards few and large; let the aurora show around them.
- **Don't** use fast cuts, bounces or saturated complementary accents.

## Not matched

The source film refracted the scene through the lens in a shader; this kit magnifies the aurora
layer only (cards under the lens are not magnified).

## Proven on

`demo/` (6 s, 9:16 and 16:9).
