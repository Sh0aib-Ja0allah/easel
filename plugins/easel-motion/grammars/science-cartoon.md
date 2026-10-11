<!-- Easel: translated and adapted from alchaincyf/huashu-art-motion @ 9ff59339f934e08483ba0a5b1db20f4c2c421b35
     (github.com/alchaincyf/huashu-art-motion, references/动画语法/y1_kurzgesagt.md).
     MIT License, Copyright (c) 2026 alchaincyf (花叔 · 花生); full text in NOTICE.md.
     Modified by Easel (2026-10-11): translated to English; replaced channel, course and composer names with neutral descriptions; removed source-project paths, scripts, function names and demo-film references (useful demo values kept, tagged [tested]); replaced named characters with generic ones; rewrote the implementation notes engine-neutrally; condensed the review and QA sections into tool-independent lessons; dropped reference links. -->

# Science-cartoon explainer

Flat, colourful science explainer: a video animation grammar card.

In one sentence: draw an abstract idea as a concrete object, put it in a glowing world you can zoom into without end, and let the camera travel between scales. The ambient layer (stars, particles) may keep moving gently. The subject and the information change on narration beats, then settle and hold.

Basis: research on the style of a well-known flat-design science channel. Two 2025 episodes and one 2014 episode were measured frame by frame, and the transcript of the channel's official motion-graphics course was read. The raw research is not included; the figures used are copied into this card.

Tags used below:
- [measured] = measured from the sample episodes.
- [first-hand] = from the channel's own course or statements.
- [inferred] = generalised from the samples.
- [tested] = a value that worked in a test build of this grammar.

## Before you start

1. **Write the visual metaphor for the segment first: what object does the abstract idea become?** (A cell, gears, pipes, a city, a drop of water...) If you cannot name an object for a line, do not fall back to a glowing ball with a few label pills.
2. **An orange glowing central planet is one way to draw it, not the signature of this grammar.** Change the central object's shape and colour with the topic. A "central object plus satellite nodes" layout suits layered "what's inside" explanations. If the topic does not have that structure, compose your own shots, or pick another grammar.
3. **At least one state change per narration sentence** (pop, morph, dive in, pull out). Count sentence by sentence. If the picture does not change across two sentences in a row, add an event. Do not fill the gap with floating and slow pushes.
4. **Once the subject settles, hold it.** The ambient layer (star twinkle, drifting particles, distant clouds) may keep moving gently. Do not give the subject and labels float or breathing. Do not fill pauses with constant-speed slow pushes.
5. **Pause before diving in.** Before a scale transition, hold the object you will dive into for at least 0.3s and light it up, so viewers know which one comes next. Interpolate the zoom logarithmically.

---

## 1. When to use it

**Use it:**
- Content about scale or "what's inside": from a cell to a galaxy, from one pixel to a model, or "zoom in and you find...". Scale transitions are standard in this style.
- Mechanisms and systems: neural networks, the immune system, energy flows. It is best at drawing invisible processes as glowing particles and links.
- Calm, storytelling science narration. The reference channel runs at about 168 words per minute, with about 2 sentences per hard-cut shot [measured].
- A "serious but cute" tone, where a mascot or a flock of birds can come in to deliver a joke.

**Don't use it:**
- Real people, real events, archival evidence. Flat cartoons dilute credibility. Use the editorial collage grammar instead.
- Steps and chains of reasoning. Writing them out step by step is clearer. Use the whiteboard grammar.
- Small budgets. The quality of this style depends on "something moves in every frame". One official episode takes over 1,200 hours [first-hand]. A corner-cut version looks like a cheap slide deck.

## 2. Composition

- **Pick the era first.** The 2025 look is dark: 61-68% dark pixels, median saturation 0.84-0.89. The 2014 look is a light grey-white base with low saturation. Do not mix them [measured]. You can switch to a whole new colour temperature when the section changes (for example two dark shots, then a bright daytime third shot), as the channel does.
- **Palette** (2025 dark look, sampled):
  - Base: `#05020F` / `#0E0631` / `#25155E`
  - Secondary base: `#191670`, `#3826A3`, `#5F58DB`
  - Cyan accents: `#32BAEE`, `#7DD3DC`
  - Orange-yellow accents (glowing objects): `#F48301`, `#E07919`, `#FACC12`; glow core `#F9EF93`
  - Magenta: `#BE3A95`, `#C83C7F`
  - Highlights and white text: `#E7DFE1`, `#F9FCFB`
  - Rule: one dark base with 2-3 highly saturated accents. The accents contrast with each other (orange-yellow against indigo-violet, cyan against magenta) [measured + inferred].
  - **The deep-purple base above is a record of the analysis. Do not copy it into finished films.** After seeing many AI-made films, the source author's verdict was: "avoid blue and purple gradient junk palettes; they look very AI slop". A deep-purple starfield is the most common giveaway of that look. For a dark look, use a deep ink (near-black) or a flat navy, and keep the rule "one dark base, 2-3 saturated accents". When in doubt, default to a flat deep ink.
- **Shape language:**
  - No outlines. Shadows are blocks of the same hue, one step darker. Highlights are a white ellipse or a single arc [inferred].
  - Rounded corners everywhere. Living things are organic blobs. Character heads are round. Limbs are tubes with round ends.
  - Every glowing object has a radial glow. The whole point of the dark base is to make the glow work.
- **Dual-tone facets [tested]:** inside each shape, offset the shape twice. Leave a shadow band at the lower right and a thin highlight edge at the upper left. Offset about (10,12)px, width about (4,5)px. Pass every part of every character through the same step, so characters and scene are drawn the same way and do not look pasted on.
- **Layout:** put the subject on the lower-third line, a little below centre. Leave sky above for stars and callouts. Split the scene into 5-6 parallax layers [tested]: starfield d=0.05, moon 0.12, far hills 0.3, near slope 0.65, subject 1.0, foreground leaves 1.5 (the near layer blurred and dark). The channel has not published its layer count; the samples show 2-5 [inferred].
- **Characters:**
  - A small critter of your own: egg-shaped body, big white eyes, small black pupils set toward the front, one simple triangular feature (a beak, a nose or a horn). Limbs or wings are leaf shapes one step darker than the body. Give each critter in a cast a different body colour. Do not reproduce any channel's mascots.
  - [tested] An animal character: teardrop body with a round head, triangular ears with magenta inner ears, big white eyes. A robot: rounded shell, dark screen face, one glowing lens eye. The hero: every part goes through the dual-tone facet step.

## 3. Motion

- **Official easing** [first-hand, official course]:
  - A normal move is 50 frames (0.83s at 60fps). For a crisper move use 30/20/10 frames. Pops take 5-10 frames.
  - Loops use a symmetric ease at 33.3% influence, about `cubic-bezier(.333,0,.667,1)`.
  - Everything else uses 75% influence, about `cubic-bezier(.75,0,.25,1)`: very soft start, fast middle, very soft end.
- **Pop** [measured]: a card grows to 90% in 0.25s, overshoots to 108% at frame 20 (114% on one probe card), and settles at 100% at about 0.5s.
  - [tested] Recognition labels: back-out easing with overshoot 1.1, 0.5s.
- **Stagger:** elements of the same kind 10-20 frames apart, limbs 3-4 frames apart, a 20-frame pause between actions [first-hand].
  - [tested] Titles: 45ms stagger per character, each character 0.5s cubicOut. A pixel figure of 144 blocks: staggered by distance to centre, 35ms per cell, each block flying in from the edges over 0.5s with back-out (overshoot 1.4). A neural network: lit layer by layer at 0.32s intervals, each node a 0.35s bounce.
- **Ambient motion and subject holds:** in the 2025 episodes, fully still 0.5s windows are only 0.3% of the time [measured]. What moves is mainly the ambient layer (star twinkle, particle drift, glow) and the thing being discussed.
  - Explainer shots: once the subject and information elements settle, they stay still. Put actions on narration beats (pop, morph, push in, dive in).
  - Pure-atmosphere shots (openings, breathers between sections) may keep light ambient motion: stars twinkle, particles drift, the far distance moves slowly.
  - Blinks: 5 frames to close, 10 to open, at irregular intervals. **The eye never shrinks to 0** [first-hand].
  - [tested] 170 stars, each twinkling at its own phase, 1-3.5 rad/s. Foreground leaves blurred by 7px for depth of field. A robot bobbing ±12px, its thrust glow jittered by two sines at 23/37Hz. A tail swinging as two bezier segments. Grass blades swaying at 2.1 rad/s. Firefly particles drifting in layers 0.8-1.3. Signal pulses looping along links.
- **Camera** [measured]:
  - In the 2025 episodes, about 1/3 of the time is spent zooming, about 10% panning, about 5% rotating. Pull-outs outnumber push-ins. Zooms are mostly scale journeys and reveals, not pause fillers.
  - For new films, use a pulse rhythm: hold -> quick 0.28s push in by 18-32% -> hold. Lateral moves at the same zoom take 0.30s. A slam-in takes 0.17s (1.55 -> 0.94 -> 1.0). Hold length follows the narration. Scale journeys use the durations in section 4.
  - A constant-speed 2.6s push (1.00 -> 1.10) to fill a shot is the old approach. Do not copy it.

## 4. Transitions (6 common ones)

1. **Push through -> the object's colour fills the screen -> new scene** (the standard scale transition).
   - Measured: in the 2014 sample at 1:48, about 1.4s, accelerating then decelerating, with the speed peak mid-way.
   - [tested] Push (log interpolation) into a lit output node, 0.45s cubicIn, until the screen is solid yellow. Within ±3 frames of the midpoint, dissolve to the yellow-glowing eye of a character in the next scene. Both have their highlight at the upper left, so the cut is invisible. Then pull out with cubicInOut over 1.45s (42x -> 1x), landing in a new daytime palette.
   - Do not use expoOut here. Its start slope is so steep that the first frame jumps most of the scale.
2. **Dive into an object; inside it is the next world** (a variant of push-through).
   - [tested] 1.0s: the camera pushes logarithmically into a robot's lens with `bezier(.75,0,.25,1)` (1.1x -> 60x). The next shot shows only inside the "lens circle". The circle grows with the push until it covers the screen, with a cyan glow ring at its edge. At the same time the next shot emerges from 0.42x with expoOut.
3. **Fast pull-out reveal:** 0.2-2s, fast start, long tail (measured zoom factor per 0.2s: 1.074 -> 1.040 -> ... -> 1.0006). Use it to link micro and macro.
4. **Light or a flash fills the frame:** use a light source in the picture as the white-out, about 0.5s.
5. **Sweep wipe:** an object or a band of light sweeps diagonally across the frame with speed lines, about 0.4s.
6. **Multiply until it fills the frame:** for "so many that...", 3-6s.

Two more points [measured]:
- Hard cuts are rare, about 5 per minute. They follow sentence starts, landing 0-0.2s before the sentence begins.
- Most other picture changes are 0.3-0.6s designed transitions, one every 4.6-6.7s.

## 5. Rhythm and text

- **Shot length** [measured]:
  - Hard-cut shots: median 7-9s, mean about 11.5s.
  - But the "visual unit" changes every 4.6-6.7s, through designed transitions.
  - At least one state change per narration sentence: pop a label, change a callout, morph, or transition.
- **Sync with narration:** use the narration's sentence timestamps as the skeleton. Put hard cuts 0-0.2s before a new sentence starts [measured]. The music is composed after the picture is finished, by the channel's composers [first-hand].
- **Text:**
  - Callouts: first draw a thin white leader line, then type the text character by character at about 40 characters per second. One callout per narration sentence. Hold it for about 3s, then erase it character by character [measured].
  - Chapter title cards every 2-3 minutes: full screen, word by word, background blurred.
  - Label pills: large corner radius, filled with a saturated solid colour, bold sans-serif text inside.
- **[tested]:**
  - A test that packed 3 shots into 8s ran at about 3 times normal density, only to show the whole grammar at once. In real films, use one shot per 7-9s.
  - Title: a heavy sans-serif at 76px, each character rising in.
  - Layer labels: a medium sans-serif at 40px, with an underline extending out.

## 6. Implementation notes

- Keep renders deterministic: cache drawn sprites and use a seeded random generator, so every render is pixel-identical.
- Smooth point lists into paths for organic shapes (characters, hills, leaves). Use noise for texture.
- Keyframe camera with logarithmic zoom interpolation. Each frame then magnifies by the same factor, so a scale transition reads as a steady journey. For holds and call-outs, use a tracked camera: 0.28s quick push, 0.30s lateral move, 0.17s slam-in, and stillness the rest of the time.
- Anchor: while zooming, move the target point smoothly to the centre of the frame.
- Bezier easing: port cubic-bezier easings from motion-graphics software or CSS into code, solved with Newton's method.
- Standard easing families: sine, quint, expo, back, elastic, and so on.
- Per-character text entrances.
- Dual-tone facets as a reusable shape-fill helper.
- Parallax layer with depth d: displacement is linear in d, scale is z^d, so far layers barely move during a deep push.
- **Key architecture:**
  - The camera depends only on global film time. During a transition window, keep drawing the previous shot into its own buffer; the previous shot computes its own "dive in" camera.
  - So a zoom transition is always a vector redraw. A 1920px bitmap is never scaled up 60 times into blur.
  - The transition itself only decides how the two buffers combine (for example a lens reveal or a match cut).
- **Engine settings:**
  - Any segment can set its own duration in seconds.
  - Beat-synced camera punches are off by default and switched on only when asked for. Explainers should not jolt on beats.

## 7. Reference works and first-hand sources

- Sample episodes from the flat-design science channel: two 2025 episodes (one on memory, one on space travel) and one 2014 episode on the immune system.
- The channel's official motion-graphics course, parts 1 and 3 (transcripts covering easing, loops, the birds and character animation).
- The channel's behind-the-scenes material (about 1,200 hours per episode) and its own description of how it works.
- Music: scored by the channel's composers after the picture is finished.
- Links are omitted in this adaptation.

## 8. The 3 most common mistakes

1. **Turning "always moving" into "everything breathes".** The 2025 episodes are still only 0.3% of the time, but what moves is the ambient layer and the thing being discussed, not every element floating. Explainer shots: the subject holds once it settles, and actions land on narration beats. Pure-atmosphere shots keep light ambient motion such as star twinkle and particle drift. Motion made of everything floating plus constant-speed slow pushes still reads as a slide deck.
2. **Linear zoom interpolation, or scaling bitmaps up.**
   - With linear interpolation z is slow at first and violent at the end, which breaks the sense of travel. Use logarithmic interpolation.
   - Scaling a screenshot of the previous shot up 20 times turns it into a mosaic. The scene must redraw itself at the larger z.
3. **A bright, busy palette, or outlines.**
   - The 2025 look is "dark base plus 2-3 glowing accents", carried by glow.
   - Black outlines or a mid-brightness base slide into children's picture books or corporate flat illustration.
   - Shadows are the same hue one step darker, never grey.

---

## Review notes (an independent reviewer watched only the finished test film: 7/10)

Review comments and the fixes made:
- "Characters, grass and hills have outlines; it looks like a children's illustration": draw grass blades as filled thin triangles instead of lines. Keep the light edge on hilltops only one step lighter than the base colour.
- "A black blob in the lower left looks like dirt": blur the foreground leaves by 7px for depth of field, and lift their colour from near-black to a dark base tone.
- "The title disappears in one frame": fade it out over 0.55s with sineInOut.
- "A character changes colour with no explanation": keep the familiar version in the shot. Introduce the new one with a leader line and a short caption ("one it has never seen") before its recognition label pops.
- "Flying birds cross the robot": move flying elements to a height clear of the main subject.
- "The ending is almost static": the test first added a slow 4%/s push. The current approach: put an event at the end (a fast pull-out to reveal the whole, or a dive into the next level), then hold.
- "A figure is half cut off by the lens circle during the dive": left unchanged. That is the normal state of a "dive into the lens" reveal.

## QA notes

- **Jump frames during a scale transition are expected.** In the test, 8 consecutive jump frames sat in the middle of a 42x -> 1x pull-out from a character's eye. The whole screen was zooming, so motion area peaked at 92%. That is a designed scale transition, not a one-frame glitch.
  - The first version used expoOut. Its start slope was so steep that the first frame jumped from 42x to 15x, and both the review and the QA check flagged it.
  - With cubicInOut the speed peak falls mid-way, matching the measured shape of the channel's push-throughs.
- **Blur costs render time.** A 7px foreground blur for depth of field raised the per-frame cost from about 9ms to about 33ms. That was still well within budget.
- **Low motion area is normal here.** A motion area of 1.6-3.4% looks low, because this style's micro-motion is many small things each moving: stars, particles, tails, floating, pulses. The channel's episodes are fully still only 0.3% of the time; the test shots had 0% still frame pairs, which matches. But 0% still frame pairs only proves the ambient layer moves, not that the explanation works. Also check on a filmstrip that the frames turn like pages, one new state after another.
