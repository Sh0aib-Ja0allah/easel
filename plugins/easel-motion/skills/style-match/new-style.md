<!-- Easel: adapted from cth9191/animate @ 7e5eb56feb2dd573f890e1b7b34748af43d58263
     (github.com/cth9191/animate, plugins/animate/skills/animate/new-style.md).
     MIT License, Copyright (c) 2026 cth9191; full text in NOTICE.md.
     Modified by Easel (2026-10-11): measuring and comparing are easel-core tools (measure_image,
     compare_images, render_still); new-style.mjs and new-piece.mjs start the style and its piece;
     references stay in the job folder. -->
# Making a new style from references

Use this when the user names or shows a look that no style in `<easel-motion>/styles/` covers. The output is a reusable style folder, made the same way the shipped ones were. Budget: a measure pass, the piece's 2–4 style frames matched against the references, **one** check-in (the animate skill's look check), then save after the piece.

**Reference media stays local.** Screenshots, downloaded videos and frame sheets go in the job folder (`./easel-out/<slug>/references/`, which is git-ignored like all of `easel-out/`). That includes anything derived from them: trimmed copies, zoom crops, compare sheets. **Anything with reference pixels in it stays in `./easel-out/<slug>/references/`.** Never commit them, never copy their code, and don't name the artist in what you publish unless the user asks you to credit them. A licence that allows reuse (MIT etc.) still means: credit it if you reuse code; studying the look needs no copying at all.

**Paths.** The measuring and comparing are easel-core tools (`measure_image`, `compare_images`, `render_still`); the style lives in the user's project at `styles/<name>/` (beside or above the piece, where `build.mjs` finds it); the references stay in the job folder. `<easel-motion>` is this plugin's folder (SKILL.md gives the path).

## 1. Gather

- **Video:** ask for a file the user has. Extract stills with ffmpeg (`ffmpeg -i ref.mp4 -vf fps=2,scale=540:-1 <job>/references/f%03d.png`; easel-core's `doctor` checks that ffmpeg is installed), and look at them on a `contact_sheet`.
- **A web page or an SVG/canvas demo the user points to:** render it with `render_still` (or have the user screenshot it) and look at the drawings large — at a portrait (9:16) viewport if you can, so a crop has the same shape as our frame. If the drawing is SVG, read its computed styles (stroke colours and widths, fills, the viewBox): **those numbers beat any screenshot**, because thin lines get downsampled lighter in screenshots.
- **Stills:** use them as they are. Ask for 3–6 that show the range (a wide, a close-up, text, a character).

## 2. Measure (write the numbers into the new STYLE.md)

| what | how |
|---|---|
| **Palette** | easel-core `measure_image` with `images: ["<job>/references"]` and `outDir` in the job folder: it trims screenshot borders (writes `<name>.trim.png`), reports each picture's size and aspect, its most common colours, `points: [[x, y], ...]` samples flat areas exactly, and `accent: true` lists bright, saturated colours by hue family with a core and a halo value (neon, inks on black: the plain palette there is all ground). Exact values from the source (computed SVG styles, CSS) beat it when there is one; thin lines read lighter in screenshots. Note what each colour *means* (ground, line, accent, the hero). |
| **Line** | weight relative to the **drawing's** size, then scaled to the size the drawing will have in our frame: a 0.9px line on a 400px-wide figure, drawn 800px wide at 1080, is ~1.8px. Constant or tapered; does it boil (wobble on 2s) or stay rigid; caps and joins. |
| **Fill and texture** | flat, gradient, halftone, hatch, grain, paper; shadows (none, drop, cast, hatched). |
| **Geometry** | perspective (flat, isometric 2:1, true 3D), corner rounding, how text is set (font class, size as % of height). |
| **Motion** | on 1s or 2s (step through 12 consecutive frames: do lines jitter in pairs?); easing (springs, ease-in-out, linear); what moves when nothing happens (idle). |
| **Cuts** | step through the extracted stills (or a `filmstrip`-style contact sheet at the real fps) for cut times; then hard cuts, morphs or one continuous move; a beat grid? (see `<easel-motion>/grammars/formats.md` → Measuring a reference). |
| **Camera** | still, slow push, pans between stations, zoom bumps. |
| **Composition** | how much of the frame is empty; one subject or a full-bleed world; where text sits. |

## 3. Match 1–2 frames

1. Make `styles/<name>/` in the user's project: `node "<easel-motion>/tools/new-style.mjs" styles/<name> [--from <closest shipped style>]`. It writes `kit.js` (the closest shipped style's kit, or the blank kit from `templates/style/kit.js`: a shape, text, a hero, captions and the full `STYLE` block) and a `STYLE.md` skeleton. build.mjs refuses a kit without `const STYLE`; refine the hooks in step 5. Keep `kit/core.js` underneath and don't redeclare its names (see `<easel-motion>/styles/README.md` → Names a kit must not reuse).
   - The frames you match are **the piece's own style frames** (the animate skill's look check): `node "<easel-motion>/tools/new-piece.mjs" ./easel-out/<slug>/piece --style <name> --formats ...` starts it from the blank starter (its scenes use only the STYLE hooks), then draw its 2–4 most different beats with the new kit. No separate demo is needed before the check-in.
2. The frames re-create the *kind* of image in the references — the same medium, proportions and palette — with your own subject, not a copy of theirs.
3. Render the frame with `render_still` (`t`, `aspect`, `scale: 0.5`), then compare side by side with easel-core `compare_images` (`autoTrim` drops screenshot borders, `crop: [x, y, w, h]` picks the region of the reference, crop at 9:16 around one figure, and `cropOurs` the matching region of our frame, so both palettes describe the same kind of area). Write the sheets into `<job>/references/`. Check, in this order: proportions on the 10% grid (subject size, margins, line weight relative to the subject), the palette numbers, the texture, the type. A landscape reference won't match 9:16 composition exactly — compare the drawing, and decide the composition from the format. Fix and repeat until the differences are deliberate. Write what still differs in STYLE.md ("not matched").

## 4. The check-in

This is the piece's look check (the animate skill's step 2): one check-in, not two. Show the compare sheets and the piece's frames together. Ask with options: **thumbs up / closer to the reference (say where) / push it further from the reference.** Don't save the style before a thumbs up.

## 5. Save it (after the piece is approved and built)

1. Finish `kit.js` with the `STYLE` hooks (backdrop, window, blob, hero, captions, post, `ones`); see `<easel-motion>/styles/README.md` for the contract and the renderer's quirks (hex colours, `rgb()` mid-morph, the camera transform).
2. The demo: the finished piece is the style's first proof. If the user wants the style shared or reused, add a 4–8s `demo/` (two eras, one shape morph, a hero, a caption, background life; bridge shapes of similar proportions — a dot into a long thin bar pinches into a bowtie). `node "<easel-motion>/tools/build.mjs" styles/<name>/demo`, then a `filmstrip` of it; render one frame twice with `render_still` and check the pixels match.
3. `render_still` of the piece or the demo at a good moment, `scale: 0.5`, saved as `styles/<name>/sample.png` (our own pixels only, never a reference).
4. `STYLE.md`: what the look is, the measured numbers, motion habits, **a frame checklist specific to this look** (on top of the universal `<easel-motion>/grammars/frame.md`), the kit API, do/don't, not matched, proven on.
5. Pieces use it with `"style": "<name>"`; `build.mjs` finds `styles/<name>/` beside or above the piece. Variants (a dark ground, a second palette) are a small extra part listed in the piece's `piece.json` `"build"` before the style, e.g. `src/options.js` with `const ISO_DARK = true;`, which the kit reads with `typeof ISO_DARK !== 'undefined'`. If the user wants the style shared, it is a folder they can copy to another project (with its sample, without any reference media).
