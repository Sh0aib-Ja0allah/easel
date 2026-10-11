<!-- Easel: adapted from cth9191/animate @ 7e5eb56feb2dd573f890e1b7b34748af43d58263
     (github.com/cth9191/animate, plugins/animate/skills/animate/craft.md).
     MIT License, Copyright (c) 2026 cth9191; full text in NOTICE.md.
     Modified by Easel (2026-10-11): review steps use easel-core tools (qa canvas_text, beat_grid, stillness, loudness; filmstrip; the critic) instead of upstream scripts; styles can mix. -->
# Craft: the rules that came out of building these pieces

Each rule was learned the hard way on a real piece. Follow them unless the user asks otherwise; if one turns out wrong, propose a change.

## Story
- **The plot is a true process.** The real steps, in their real order; every beat follows from the one before. Pace belongs to what a beat *means*, not to fixed seconds.
- **One constant the eye can hold** — a hero, a stage, a page — while everything else changes.
- **Colour means one thing** for the whole piece (e.g. orange = the machine's mind, red = sound). Never spend that colour on decoration.
- **Silence before the payoff, loudest on the payoff.** A 0.5–4s drop to near-silence on a held image, then the single loudest hit. Find the beat the true story already has (video models were silent until 2025; ChatGPT appeared on an empty box).
- **The busiest moment is not the loudest.** Peak density goes just before the silence; the loud hit is the turn.
- **The end is the start, changed.** Return to the opening image with the difference that the story made (Turing's page, now answered).
- **One device you can say in a sentence** ("the spark gains a ray each era").
- **A history's facts can supply the arc** — and must be true. Web-check every date and number; say "a", not "the first", unless sourced.

## Frame (see `<easel-motion>/grammars/frame.md` and the style's own checklist in its STYLE.md)
- **Banned defaults** (they read as generic AI video): a centred title on a gradient; everything fading in; labels or frame borders in the corners; glows on UI chrome; generic particle bursts; a logo sting as the only ending. Every frame should look like *this* style and *this* subject.
- **Something new every 2–4 seconds:** a move, a reveal, a cut, a reaction. easel-core `qa` → `stillness` flags still stretches over 2 s (a silence act may need `stillSeconds` raised, say why). Look at a `filmstrip` of one frame a second at phone size before calling a piece done.
- **One constant the eye can hold** in every frame: a hero with a face in character styles, the object or the axes in diagram styles.
- **The medium shows** at phone size: torn edges in cut paper, hatching in ink, dots in riso, graphite in sketchbook, crisp pixels in pixel art.
- **Small life even in held frames** (steam, a blink, a blinking LED, a cursor); character styles want 3+ details of background life per frame.
- **Act ideas out literally** ("AI winter" = snow on a closed lab and an empty piggy bank).
- **Vary scale across the board**, including at least one extreme close-up.
- **Phone scale:** anything that matters is ≥ ~100px on the 1080-wide frame; captions ≥ 50px; keep 9:16 content inside x 60–940, y 250–1500 (the platform UI covers the rest).
- **Eras that differ only in motion look identical on a contact sheet** — give each a still-visible signature.

## Transitions
- **Match the transition to the format.** Chronologies transition *from the scene*: a shape morph (sun → eye) or draw-off/draw-on. Character and catalogue pieces cut hard on the beat.
- **Keep at most one hard cut in a morph-joined piece** — the slam on the payoff.
- **Budget morphs in short pieces.** Each bridge costs 1.2s by default (0.4s of it blank paper): under 30s use 3 morphs or fewer, or shorten them with `{ tc, d: 0.4, ... }` (0.8s). Bridge objects should be ≥ 200px at the boundary, or the world shrinks into a tiny window early.
- **Shape-morph bridge (kit/morph.js):** the old world closes in on one object through a window shaped like it (the style draws the window: a torn hole, an inked iris, a printed circle), the object blends into its counterpart on blank paper, the new world opens out of the counterpart. Write one bridge per beat at the storyboard stage and build those bridges.
- **The bridge object must be in frame at the boundary** — pull push-ins back first.
- **Hero-to-hero bridges draw the hero itself** (blended position/size), not two outlines.
- **Morph on the style's blank sheet** (`STYLE.paper`), not a blend of two wall colours (mud).

## Motion
- **Springs over easing curves** for anything with mass: `springMove` / `springTrack` (kit/core.js). A tiny overshoot on UI, none on big type. A value with many targets gets one spring per change (`springTrack`), never a restarted ease.
- **Everything moves on 2s:** time is `TT = B * 2 / FPS`; the boil, the camera and every move share the boil index `B = floor(F / 2)`.
- **Event helpers:** `ev(t, d)` (0..1 progress), `popS(t)` (back-eased pop-in), `handText(..., { frac })` / `ink(..., { frac })` write-ons, `monoText(..., { count })` typing. Schedule actions on cue times listed in `TIMELINE.cues`.
- **Idle life is free:** the spark bobs, blinks and sways on its own; keep heroes alive in held shots.
- **Cameras put a world point on a screen point** (`camOf({ z, p, to })`, `push()`), never "zoom about a point" — that drops the subject under the caption.
- **Pin the hero in the fastest stretch** by centring zoom bumps on it; check it on a filmstrip of that stretch.
- **Hard cuts land on finished frames:** what defines the new shot is fully drawn on its first frame; write-ons start a few frames early.
- **What existed before the step is on screen from frame 0.** Only the step's own effects animate in (the files were staged before `git commit`; they don't pop in during it).
- **Beat-cut pieces: a shot is complete on its first frame.** Tags and captions that pop or write on after `E0` never appear in shots under ~1s; give short shots no caption, or draw it finished. Cuts on 16ths land on odd frames at 24fps — the renderer picks the era by frame, so they're exact (start from `templates/beat-cut/`).
- **Captions hold:** each on screen ≥ 1.25s and ≤ 3.5 words/s; pop the year tag, write the caption on just after.

## Timing
- **24fps + 120 BPM:** an 8th = 6 frames, a 16th = 3 — every cut and morph is a whole frame. (30fps → 112.5 BPM; 60fps → 900/7 BPM.)
- **Cuts and morph centres on the 8th grid**, proven by easel-core `qa` → `beat_grid`, not by eye.
- **Loop length = NFRAMES / FPS** so the loop point sits on the frame grid; fold the audio tail over the start.

- **Act roles** (`TIMELINE.acts[].role`, the plan the score follows): `build`, `journey`, `peak` (the busiest), `silence` (the drop before the turn), `gift` (the payoff: the loudest), `goodbye` (the decay). Leave a role out when the piece has no such act.

## Sound
- **With a voice-over, the voice is the clock and the payoff sits in a pause.** Each beat starts ~0.3s after a sentence ends; land the payoff hit (and the picture's return) in the silence *before* the line that names it — under speech the duck swallows it. Judge the arc on the score without the voice.
- **With the user's track, the song is the arc.** Ask the user where its drop and its biggest hit are (in seconds; you can't listen) and put the turn and the payoff there; cut on its beats (`onBeat`, from `piece/beatmap.json`).
- **The score improves with the story** (thin early, fullest at the peak); motifs carry characters (the spark = a rising fifth).
- **A loudness stage** (RMS-normalise to −17 dBFS, look-ahead limiter at −1 dBFS) is in `kit/score-tail.js`; stems share the mix gain so they sum back to it.
- **Under that stage, balance by removing energy, not adding it** — every relative boost is partly undone.
- **The sustained pad sets a section's p90**, not the plucks; cut the pad to quiet a section.
- **Payoff recipe:** a short chord stab (~0.4s) + a sub on the hit, a *flat* chord after it, nothing busy on top. Otherwise the held chord or a busy section outscores the hit.
- **Silence needs a hard stop:** dry sends in the last beat before it, every event ending before it, a faint room tone at most.
- **You can't hear the score.** Measure it (`qa` → `loudness` on the mastered WAV; the score body says where the loudest hit is) and tell the user to listen.

## Code
- **A style is a plug-in:** `piece.json` `"style"` picks `styles/<name>/kit.js`; the renderer only calls its `STYLE` hooks. More styles join with `"mix"` (each under `KITS.<name>`; an era names its style as the 4th `ERA_LIST` item).
- **Every frame starts from a clean sheet:** never rely on what the last frame left on a canvas (the renderer clears the era layer to `STYLE.paper`); render one frame twice with `render_still` and compare.
- **`trace()` rounds corners through midpoints:** give it dense points (`resample(P, true, 30)`) for boxes that must cover the frame.
- **One file, built:** `<easel-motion>/tools/build.mjs` concatenates `src/` parts with `kit/` files; edit the parts, never the built `index.html`.
- **Deterministic:** `RNG(...)` seeded by keys; `wobble(..., key)` reseeds per boil step; never `Math.random`/`Date` (the engine seeds and freezes them anyway, but a piece must not depend on it).
- **Write big files in ~200-line parts**, one per message; write scripts with the Write tool rather than long shell heredocs.
- **`paint()`/`hatch()`/`pencil()` reset `globalAlpha`** — to hide a prop, skip it; don't fade it.
- **Offscreen layers** for windows, masks and resolution tricks (render at the true resolution, scale up nearest-neighbour).

## Review
- **Three layers, every time:** filmstrips while building (look at them), `qa` numbers (canvas_text, beat_grid, stillness, colour_cast, loudness), and the critic's cold read against the motion rubric, with a written PASS table.
- **Don't trust your eye for text.** A fresh run passed a shot whose commit sheet was cut off at the frame edge with a tag over its hash; `qa` → `canvas_text` finds those, per format. Deliberate crowding goes in `piece.json` `review.textIgnore` with a reason, passed to `qa` as `textIgnore`.
- **Name the weakest shot and what would fix it** in the log — it's the next run's to-do list.
- **Iterate the mix on a short render:** `render_video` with `audio: "page"` and a short `duration` re-renders the whole score; listen-check numbers come from `qa` on `<name>.wav`.

## References
- **Reference media stays local and uncommitted** — it's other people's work, kept for study.
- **Measure a reference into a timed table before writing** (a `filmstrip` of the reference video's frames, or the user's notes): cuts, holds, what's on screen, the loudest moment, the silence.
- **Map its beats to the new subject; don't reskin them.** Find its thesis, its spine, its problem and its callback, and give each a true counterpart.
- **Compare proportions, not pixels** (element width as % of frame) when matching a look.
