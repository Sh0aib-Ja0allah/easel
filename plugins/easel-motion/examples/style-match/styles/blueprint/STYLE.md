# blueprint

<!-- Made with easel-motion style-match on 2026-10-11 from the three reference sheets in ../../references/
     (Easel-made drawings), starting from the blank kit. Easel, MIT. -->

## The look

A technical drawing on blueprint paper: pale constant-width lines on a saturated mid blue with a
fine and a coarse grid, monospace labels with leader lines, dashed dimension lines, and one warm
accent kept for the thing that matters (a filament, the hero).

## Measured (measure_image on house.png, gear.png, bulb.png)

| What | Value | Means |
|---|---|---|
| Ground | `#1d4f91` (83-84% of every sheet) | the paper |
| Minor grid | `#225596` (11%), 40 px at 1080 wide | scale |
| Major grid | `#3364a4` (3%), 200 px | scale |
| Line | `#eaf3ff` (0.7-1.2%) | the drawing |
| Dimension and leader lines | `#bfe0ff`, 2 px, dashed 10/8 | measurements |
| Accent | `#ffd166` (under 0.1%) | the one important part; the hero |
| Line weight | 4 px at 1080 wide, constant, round caps and joins | |
| Type | JetBrains Mono 700; titles 56 px, labels 28-34 px, subtitles 30 px 400 in the dimension colour | |
| Texture | none; no shadows | |

## Motion

On 1s (`STYLE.ones = true`). Lines draw on along their length (`bpLine(..., { frac })`), labels type
on (`bpLabel(..., { count })`); a morph is a line drawing changing shape on the blank sheet; the
hero bobs and blinks.

## Frame checklist (on top of grammars/frame.md)

1. The grid is visible in every frame; nothing covers more than a third of it.
2. One accent colour only, on one thing.
3. Every drawn part has either a label with a leader line or a dimension.
4. Line weights: 4 px for the drawing, 2 px for dimensions and leaders, never mixed on one part.
5. A title block (top left) names the sheet.

## Kit API

`styles/blueprint/kit.js`: `bpSheet(c)`, `bpLine(P, { closed, frac, color, w, dash })`,
`bpCircle(x, y, r, o)`, `bpLabel(str, x, y, size, { count, color, align, weight })`,
`bpDim(a, b, label, { frac, dx, dy })`, `bpHero(x, y, r, { mood, key })`, `bpTitle(str, sub)`,
`bpCaption(str)`; palette `BP`. STYLE hooks: `backdrop` (the sheet), `window` (a drafted rim),
`blob` (an outline only), `hero`, `ones: true`.

## Do / don't

- **Do** label things; let lines draw on; keep the accent for one part.
- **Don't** fill shapes, add shadows or gradients, or use a second accent.

## Not matched

- Leader lines end in a dot in the references; ours end plain.
- Our labels run smaller (24-28 px) to stay left of the 9:16 side buttons.
- The references have no hero; the compass-point hero is ours.

## Proven on

`examples/style-match/piece` (6 s, 9:16 and 16:9).
