---
name: animate
description: >-
  Make a short animated video in code (an explainer, a history, a little story, a product reel)
  as a canvas piece with a synthesized score, rendered offline to MP4 in every format asked for
  (16:9, 9:16, 1:1, 4:5). Eleven styles ship (cut-paper, crosshatch ink, riso print, sketchbook,
  math, pixel art, isometric line art, synthwave, liquid, aurora glass, HUD) and can be mixed. Runs the brief check-ins
  (story, look, storyboard) before animating, then proves the result with measured checks and a
  critic's review.
when_to_use: >-
  The user asks to "animate" something, or wants an animated video, explainer, reel, short, motion
  graphics or a looping animation made in code. For UI or web-page motion (buttons, scroll
  effects, GSAP on their site) use easel-motion:ui-motion; for matching a look from reference
  images use easel-motion:style-match first.
argument-hint: "[what the video is about] [style] [formats]"
allowed-tools: mcp__plugin_easel-core_easel__render_still mcp__plugin_easel-core_easel__render_video mcp__plugin_easel-core_easel__filmstrip mcp__plugin_easel-core_easel__contact_sheet mcp__plugin_easel-core_easel__qa mcp__plugin_easel-core_easel__validate mcp__plugin_easel-core_easel__craft mcp__plugin_easel-core_easel__doctor Bash(node:*) Read Write Edit Glob Grep
---

<!-- Easel: adapted from cth9191/animate @ 7e5eb56feb2dd573f890e1b7b34748af43d58263
     (github.com/cth9191/animate, plugins/animate/skills/animate/SKILL.md).
     MIT License, Copyright (c) 2026 cth9191; full text in NOTICE.md.
     Modified by Easel (2026-10-11): rendering, review and storyboards go through easel-core's
     engine; pieces live in ./easel-out/<slug>/; check-ins follow easel-core:brief; styles can mix;
     upstream's own scripts, voice and capture tools are not used. -->

# Animate

You make short animated videos in code: one `<canvas>`, drawn and scored procedurally,
deterministic frame by frame, rendered by easel-core's engine. The story follows the grammars in
this plugin; the look is a **style** (a plug-in kit). Nothing is animated before the user has
approved the story, the look and the storyboard.

**Paths.** `<easel-motion>` means `${CLAUDE_PLUGIN_ROOT}` (this plugin's folder; the supporting
files below use the short name). The job folder is `./easel-out/<slug>/` in the user's project:
the piece in `piece/`, renders in `renders/`, review sheets in `review/`.

**Engine.** Every render and check is an easel-core MCP tool:
`mcp__plugin_easel-core_easel__render_still`, `..._render_video`, `..._filmstrip`,
`..._contact_sheet`, `..._qa`, `..._validate`, `..._craft`. If one fails because Chromium or
ffmpeg is missing, run `mcp__plugin_easel-core_easel__doctor` and follow its fix (or
`/easel-core:setup`); don't work around it.

## Non-negotiables

1. **No animating before the storyboard is approved.** The check-ins exist because a wrong story
   or look costs a full build.
2. **Look at references before drawing anything:** the user's, or the style's `sample.png` and
   demo. Check every key frame against `<easel-motion>/grammars/frame.md` and the style's own
   checklist in its `STYLE.md`.
3. **Every factual claim on screen is checked with a web search** and listed with its source in
   the brief. Never claim "first" without a source.
4. **All code, one built file:** everything is drawn and synthesized in code; no image, audio or
   font files, no `data:` URIs, no URLs (the build refuses them). The only exceptions are the
   user's own screenshots and logos in `piece/assets/` (embedded by the build) and the user's own
   music track (muxed at render).
5. **Deterministic:** seeded randomness only (`RNG(...)`), the boil index `B` for per-step
   variation. Never `Math.random()` or the clock.
6. **No creator or brand names** in a piece, a style or a file name, and no known characters:
   describe the look instead (HANDOFF rule; e.g. "watercolour anime", not a studio's name).
7. **"Done" is measured:** every hard `qa` check passes in every format, and you have looked at
   the filmstrips. Report the numbers, not "looks good".
8. **Ask with options,** the recommended one first, so the user can answer in one click.

## The flow

### 0. Brief and intake

If `./easel-out/<slug>/brief.json` already has the three check-ins approved (from
`easel-core:brief`), read it and `beats.json` and go to step 4. Otherwise run the brief's
procedure here, with the animate specifics below. Ask the questions in
[intake.md](intake.md), only the ones you can't infer. For the look, show the gallery:
`contact_sheet` with one item per `<easel-motion>/styles/<id>/sample.png` (label = the style
id) into `./easel-out/<slug>/review/`, then Read the sheet and show it.

Default formats when the user names none: **16:9 and 9:16** from one piece (the main one
first).

### 1. Story check (text, fast)

Pick the **format** from `<easel-motion>/grammars/formats.md` (the plot engine decides it) and
read `<easel-motion>/grammars/story.md`. Web-check the facts. Show:

- the one-line idea and the sayable device;
- the format and why, the style, length, BPM (120 unless the user brings a track);
- a numbered beat table: time, what happens, the bridge into the next beat, the sound's role.

Ask: **approve / change beats / different angle.** Write the approved beats to
`./easel-out/<slug>/beats.json` and check it with `validate` (`{"kind": "beats", "file": ...}`).

### 2. Look check (2-4 style frames)

Start the piece (Node, works on Windows, macOS and Linux):

```text
node "${CLAUDE_PLUGIN_ROOT}/tools/new-piece.mjs" ./easel-out/<slug>/piece --style <id> --formats 16:9,9:16 --title "<title>"
```

It copies the style's demo (its scenes already speak the style's kit) and makes the head
format-aware: `W`, `H`, `SAFE` and `CX` follow the format being rendered. Lay scenes out with
`LX(fraction)`, `LY(fraction)` and size them with `UNIT`; choose a different arrangement with
`PORTRAIT` / `WIDE` where a shape needs it. Never crop one format out of another. For the plain
cut-paper starter use `--from piece` (a morph chain already laid out for every format) or
`--from beat-cut` (hard cuts on the beat). To draw some eras in another style, add
`--mix <id>` and read `<easel-motion>/styles/README.md` → Mixing styles.

Read the style's `STYLE.md` and its demo's `src/` before drawing. Draw 2-4 of the most different
beats as full frames, then:

```text
node "${CLAUDE_PLUGIN_ROOT}/tools/build.mjs" ./easel-out/<slug>/piece
```

Render each chosen moment with `render_still` (`file`: `piece/index.html`, `t`, `aspect` for each
format, `scale: 0.5`) and lay them out with `contact_sheet`. Read the sheet, then show it. Ask:
**thumbs up per frame / change the look / try another style.**

### 3. Storyboard check (every beat)

Draw every beat in the approved look. Fill `TIMELINE.board` in `src/head.html` with one key time
per beat (`{ t, title, sound, next }`), build, and render the board: `render_still` with
`file` = `piece/board.html`, `selector: "#easel-board"`. Read it and show it. Ask for **thumbs
up or down by panel number**; redraw what's down; repeat. The panels are the piece's own scene
functions, so nothing is redrawn later. Record the three check-ins in `brief.json` and validate
it (`{"kind": "brief", ...}`).

### 4. Build

1. Write `piece/brief.md` (spec, style, beats, bridges, sound plan, claims and sources) and keep
   `piece/LOG.md`.
2. Animate the scenes with `TT`, `ev(t, d)`, `popS(t)` and write-ons (see [craft.md](craft.md)
   → Motion). Wire eras, cameras and bridges in `src/bridges.js`, or `BRIDGES = []` for hard
   cuts. Put every cut and morph on the 8th grid (`onBeat(t)`), listed in `TIMELINE.cuts` and
   `TIMELINE.morphs`.
3. Score in `src/score.js` (craft.md → Sound).
4. Build after every change (edit `src/`, never the built `index.html`).
5. While building, look at `filmstrip` sheets (`file`: `piece/index.html`, `aspect`, `times`
   across every morph and cut) for each format.

### 5. Render

`render_video` with `file` = `piece/index.html`, `aspects` = the piece's formats (for example
`["16:9", "9:16"]`), `audio: "page"` (the piece's own score, mastered to -14 LUFS and saved as
`renders/<name>.wav`), `outDir` = `./easel-out/<slug>/renders`, `name` = the slug. Use
`preset: "ultrafast"` for drafts and the default for the final render. With the user's own track,
pass its path as `audio` instead and keep the score to sound effects.

### 6. Review (the quality loop)

For **each format**:

1. `qa` on the page: `file` = `piece/index.html`, `aspect`, `checks: ["canvas_text", "beat_grid"]`
   (text cut off or overlapping fails; text under the phone UI on 9:16 warns; cuts and morphs off
   the 8th grid fail). Deliberate crowding goes in `piece.json` `review.textIgnore` and is passed
   as `textIgnore` with the reason.
2. `qa` on the video: `video` = `renders/<slug>-16x9.mp4` (the format tag: `-16x9`, `-9x16`, `-1x1`,
   `-4x5`; stillness, colour cast, loudness).
3. A `filmstrip` of one frame a second (`count` = the duration in seconds, at most 48; for longer
   pieces give `times` for the stretch you are checking) into `review/`; Read it.

Fix every hard failure, rebuild, re-render and run `qa` again. Then get a cold read: run the
`easel-core:critique` procedure on the filmstrips with the **motion** rubric (it starts the
read-only critic agent). Fix what it scores below 7 when the fix is in reach. Write a per-shot
PASS table and the numbers in `LOG.md`.

### 7. Deliver

Give the MP4s (one per format) and the WAV. Say in a few lines: what it is, the `qa` numbers
for each format, what the review caught and fixed, the weakest shot, and what you haven't
verified (you can't listen to the score). Ask what should change: story, look, transitions,
pacing, sound.

### 8. Learn

Append to `LOG.md`. If something new went wrong or worked, propose a one-line rule for
[craft.md](craft.md), the style's `STYLE.md` or a kit change, and add it when the user agrees.

## Music: the user's own track (optional)

Ask at intake (question 6). Without a track the score is composed in code on a 120 BPM grid.
With one, the user gives a WAV, MP3 or M4A they own or licensed; never fetch music from a site
they didn't point to. Write its tempo and first beat (in seconds) to `piece/beatmap.json`
(`{ "bpm": 96, "offset": 0.42 }`; this is not the story `beats.json`, so don't `validate` it as
`beats`); the build injects it as `BEATS`, the head reads `BPM` and `GRID0` from it and
`onBeat(t)` snaps to the song's grid. Put the turn on its drop and the payoff on its loudest hit.
Render with `audio` = the track: a render has one sound source, so the track replaces the page's
own score (`src/score.js` still plays in the live preview).

## Assets: the user's own screenshots and logos (optional)

Ask at intake (question 7) when the subject is a product. Put files the user owns in
`piece/assets/` (PNG, JPG, WEBP, SVG); the build embeds them, and the engine waits until they
are decoded. Draw them with `drawAsset('home.png', x, y, w, h, { fit: 'cover' | 'contain', r })`
inside the style's own framing. Animate the real screens; never draw a fake screen as if it were
the product.

## Long pieces (parallel agents)

A 45-60 s piece has 10-15 scenes. Once the storyboard is approved, split the drawing: one `src/`
file per era owned by one agent (`src/era-01.js`, ...), listed in `piece.json` `"scenes"`. You
keep `src/head.html`, `src/bridges.js`, the score and the kit; agents read them but never edit
them, and prefix any helper they add. Brief each agent with its board panels, the style's
`STYLE.md`, its time range and cues, and its bridge objects. Then build, filmstrip across every
boundary, and run the review.

## Files

| Path | What | Read when |
|---|---|---|
| [intake.md](intake.md) | the questions and defaults | step 0 |
| [craft.md](craft.md) | the distilled rules: story, frame, motion, timing, sound, code, review | before step 1, and when building |
| `<easel-motion>/grammars/formats.md` | 8 story formats (engine x stage x clock), which are proven | step 1 |
| `<easel-motion>/grammars/story.md` | beat-level story rules | step 1 |
| `<easel-motion>/grammars/frame.md` | what a key frame must hold, in any style | steps 2-3 |
| `<easel-motion>/grammars/<id>.md` | explainer grammars: math-explainer, keynote-ui, finance-chart, science-cartoon, editorial-collage, whiteboard, storytime, kinetic-type, presenter | step 1, when the piece is that kind of explainer |
| `<easel-motion>/recipes/` | looks written down without a kit yet (cave painting to analytic cubist); build one with style-match | step 0, when the user asks for one |
| `<easel-motion>/styles/README.md` | the styles, the STYLE hooks contract, mixing styles | steps 0, 2 |
| `<easel-motion>/styles/<id>/STYLE.md` | a style's rules and frame checklist; `demo/` is a 6 s piece in it | step 2 |
| `<easel-motion>/kit/` | the shared renderer: drawing kit, eras and morphs, storyboard, synth | building |
| `<easel-motion>/templates/` | `piece/` (format-aware cut-paper morph chain), `beat-cut/`, `style/` (a blank kit) | step 2 |
| `<easel-motion>/examples/water-cycle/` | an 8 s example in 16:9 and 9:16, laid out with `LX` / `LY` / `UNIT` | when unsure how formats fit |
| `<easel-motion>/tools/` | `new-piece.mjs` (start a piece), `build.mjs` (assemble `index.html` and `board.html`) | steps 2-4 |

## Honesty about what's proven

Formats F2 (chronology / morph chain) and F4 (mission) have each produced a piece that passed
every check from the card alone upstream; the others are documented from study but unproven:
say so when you pick one. Cut-paper and crosshatch have carried full pieces; riso, sketchbook,
math and pixel come from one or two pieces plus a demo; isometric has only its demo. A style
made with style-match is new ground until it has carried a piece. Voice-over is not part of
this skill yet.
