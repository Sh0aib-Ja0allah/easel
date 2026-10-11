<!-- Easel: translated and adapted from alchaincyf/huashu-art-motion @ 9ff59339f934e08483ba0a5b1db20f4c2c421b35
     (github.com/alchaincyf/huashu-art-motion, references/动画语法/y4_storytime.md).
     MIT License, Copyright (c) 2026 alchaincyf (花叔 · 花生); full text in THIRD_PARTY_NOTICES.md.
     Modified by Easel (2026-10-11): translated to English; removed creator, channel, studio, video and tool names;
     replaced the source's mascot with a generic hero; dropped the source's demo film, file paths, scripts, JS function
     names and TTS notes; restated demo-specific findings as general rules; folded the review and QA notes into rules. -->

# Storytime animation

> Grammar in one line: **the voice-over is the star, and the picture is a "reaction sticker" for it. The character snaps between a few poses (0.1s), then holds. The laughs come from cutting to a big reaction close-up and staying silent in that moment.**

Typical makers: popular first-person storytime animation channels. Background only (not confirmed from a primary source): the best-known ones started in vector animation software.

---

## 1. When to use it

**Use it:**
- First-person stories, mishaps, "the first time I...": the voice-over has a setup, a turn and a punchline with a pause.
- The audience comes for "this person": the maker's cartoon avatar appears every episode, and people recognise the persona, not the drawing skill (Pappis's genre study: avatars "can often only be told apart by their hair").
- Tight budget, steady weekly output: one character, five or six poses and three mouths can carry a whole episode.

**Don't use it:**
- Dense tutorials or data explainers -> use kinetic type or an infographic. Viewers watch the character waiting for jokes and don't remember the numbers.
- Content with no "I" (industry news, product comparisons) -> the character has no stance to act out and becomes a sticker that opens its mouth.
- A voice-over that isn't funny and has no pauses -> this style amplifies the voice-over; it can't rescue it.

## 2. Composition

**Framing**
- Default shot is a medium shot (waist up, head = 25-35% of frame height). The character sits centred but off to one side; the other side holds "the thing they're talking about" (a computer, another person, an object).
- The background only says "where": a wall, a desk, a window, 3-5 large colour blocks. A white or flat-colour background works fine too (Pappis: "a white background or a rough sketch of a setting").
- Reaction shots remove the setting: the face fills the frame (head radius ~1/3 of frame height), background becomes a flat colour plus a vignette.
- Punchline shots often go the other way: cut to a **very wide shot** where the character is tiny ("small and helpless" is the joke).

**Palette (reference values)**

| Part | Colour | Notes |
|---|---|---|
| Skin | `#FFE2CC` | Light, close to white. One well-known channel uses pure white ("marshmallow people"), another uses a warm white |
| Hat / white T-shirt | `#FFFFFF`, hat band `#E4E4E8` | White objects stand up through their black outline |
| Shorts | `#CDBB97` | |
| Character line | `#1B1B1F` | The darkest thing in the film |
| Wall / desk / floor | `#DCE9EC` / `#E2C29B` / `#E8DCC8` | Low saturation, high lightness: the background is always "lighter" than the character |
| Background line | `#5B6470`, 3px | Lighter than the character line and less than half as thick |
| Reaction-shot void | `#3D405B` plus a radial vignette | Cool and dark, pushes all attention onto the face |
| Mouth / tongue / blush | `#6E2430` / `#F07B7B` / `rgba(255,140,120,.35)` | The only saturated colour in the mouth, so mouth flaps read clearly |

**Line width**: character line = head radius x 0.05 (minimum 4px). Medium shot R=165 -> 8px; big close-up R=360 -> 12px; wide R=95 -> 6px. The line scales with the shot (the default in vector animation software); background lines stay fixed at 3px. **Character line >= 2 x background line** is the root of this style's "the character always pops out".

**Shape language**: all round, all blunt. The head is a slightly flattened circle (width 1.0R x height 0.93R), the body is a bean (width 1.0R x height 1.2R), the full figure is 3.2R tall - **the head is about 58% of body height**. An arm is one tube with round ends, no elbow, no fingers; the hand is a circle. No right angles except on props.

**Drawing the hero**
- Give the hero one or two signature items and draw them with care, for example a plain white hat (rounded-trapezoid crown, wide brim sloping down, light-grey band) and round black glasses (frame line 1.5x the outline width - the glasses become the "eyes" of the face). Keep the rest simple: a white T-shirt, khaki shorts, a black watch (a small black patch on the near wrist).
- Eyes are black dots inside the lenses (0.075R) with one white highlight. For "dead-fish eyes" shrink the dot to 0.035R and remove the highlight.
- Expression lives mostly in the **eyebrows** (a short thick line between brim and glasses frame): raised = surprised, inner ends raised = hurt, flat = unimpressed. Mouths are only five: smile arc, straight line, wavy (worried), half open, fully open.
- Show a little black hair at the temples so viewers know there is hair under the hat, not a bald head.

## 3. Motion

**Measured from original films** (480p re-uploads, first and last 10 seconds removed; method: 160x90 greyscale frame differences)

| | Channel A, one episode (30fps, 475s) | Channel B, one episode (24fps, 902s) |
|---|---|---|
| Average shot length | **2.43s** (median 1.87s, quartiles 1.03-3.07s) | **5.73s** (median 3.21s, quartiles 1.67-6.67s) |
| Fully static adjacent frames | **70.7%** | 51.2% |
| Static run length | median **0.40s**, p75 0.70s | median 0.08s (= a hold on twos) |
| Motion run length | median **100ms** (3 frames) | median 42ms (1 frame) |

How to read it: Channel A is **snap (0.1s) -> hold (0.4-0.7s) -> snap again**, and the picture is completely still 70% of the time. Channel B **moves continuously on twos** (12 drawings per second) with longer shots. The animation director of a streaming series adapted from Channel A put it best: it is "pose-to-pose, very little animation... basically cutting between pictures", and the hardest part of turning it into a series was keeping that snappiness and not going "too soft, too slow". A good middle ground: pose snaps like Channel A, breathing and lip sync like Channel B.

**Parameters**

| Motion | How | Numbers |
|---|---|---|
| Character frame rate | All character motion steps at 24fps; the camera moves smoothly at 60fps | 24 is the vector-animation default |
| Pose change | Arm target points interpolated with `expoOut` | **0.10s** (2-3 frames at 24fps) |
| Pose-change bounce | At the switch, squash the body 7% vertically, then spring back (inertial bounce, volume kept: width moves the opposite way) | amplitude -0.07, freq 3.5, decay 9; settles in ~0.35s |
| Lip sync | Read the voice-over RMS envelope; **the mouth may change shape only every 1/12s** (on twos); three mouths | envelope < 0.06 closed, < 0.22 half open, else fully open |
| Talking nod | Head dips while the mouth is open | 0.015R x mouth level |
| Breathing | Vertical body scale | +/-1.2%, period 1.6s |
| Blinks | Fixed schedule, every 2.4-3.6s | closed for 2 frames at 24fps (83ms); an "unimpressed" slow blink is 3 frames |
| Eye direction | When pointing at something, the pupil moves that way | 0.09R |
| Camera | Earlier practice used medium, close-up, slow push-ins and slow pull-outs. New films should prefer holding still; change the view with hard cuts, jump-ins and smash cuts | earlier values: medium +3.5% over 2.0s; close-up +6% over 1.2s; wide 0.53 -> 0.50 (quintOut); close 1.90 -> 1.98 |
| Opening | Camera settles 1.04 -> 1.01 (0.5s expoOut) instead of a frozen first frame | |
| Sweat drop | Slides down the side of the face from the temple | 0.9s, expoOut blended with linear |
| Lens glint | A white diagonal band sweeps across both lenses | 0.3s |
| "?" | Pops above the head, backOut with 30% overshoot, then wobbles +/-3 deg | 0.26s |

Entrances and exits: storytime has almost no "entrance animation". The character is already in place and already talking on the first frame of the cut. Only props and symbols (?, !, sweat drops, numbers) pop in (`backOut`, 15-30% overshoot).

## 4. Transitions (5 common ones)

1. **Hard cut** - the vast majority. One line of voice-over, one shot; new line, new cut. A cut from a close-up to a very wide shot of the same room gets its laugh from the contrast in shot size.
2. **Smash cut to a reaction close-up** - the new picture appears on the first frame, springs from 1.22x back to 1 (freq 3, decay 11), with a 55% white flash over the first 2 frames and a low "thud". Use it for "says something outrageous -> look at their face". Clamp the scale at >= 1 so the spring never shows the frame edge.
3. **Whip pan** - the camera whips toward "what they're looking at", `expoInOut` 0.26s, with 16 offset copies stacked mid-move for horizontal motion blur and a whoosh. Use it for gaze shifts like "I opened my laptop -> (the screen)".
4. **Jump-in** - cut from the same camera position straight to a shot about 2x closer, same background. Use it for "they said it again", "they realised", "the punchline". Example: in a wide shot the hero starts a line, and on the breath before the punchline word you hard-cut to a 1.9x close shot so the face is readable. This only works if the wide and close shots are **the same world canvas with only the camera changed**; otherwise the jump gives the game away.
5. **Over-the-shoulder / point of view** - cut to what they see (screen, phone, another person) with the back of their head in the foreground. Draw the back-view identifiers (hat and band, ears, glasses arms over the ears, short hair, nape, T-shirt collar) and a cool rim light on the screen side; a pure black silhouette reads as "another shadow person". The foreground doesn't follow the camera push, it only rises and falls with breathing; the parallax against the screen gives the shot instant depth.

## 5. Rhythm and text

- **Cut to the voice-over sentences, not to the music beat**: one sentence ~ one shot. Shots of 1.2-2.4s (average ~1.75s) fall inside the measured quartiles of 1.03-3.07s.
- **Put transitions in the breath between sentences, and change subtitles on the same frame as the cut.** A whip that lands on the first words of a sentence reads as "cutting mid-sentence". A working pattern: line ends -> ~0.13s later the whip starts -> it lands 0.26s later -> the next line starts ~0.04s after that.
- **Put reaction shots in the silence between sentences**: a reaction shot can run 1.3s with no line at all, just crickets - that pause is the joke. In the edit, after the outrageous line **don't start the next line straight away**; leave 0.8-1.5s for the face.
- **Hold >= 0.9s after the punchline**: after the "?" pops, hold about 0.95s so the sound effect's tail finishes naturally. Holding only 0.4s gets the note "the laugh beat was cut off".
- **Text**: storytime on most video platforms doesn't burn in subtitles (it relies on closed captions). Only write words in the picture that "need to be seen": words on a screen, key numbers (for example a number in a black-weight sans at 230px, `#FFCB6B`, slammed in with 23% overshoot). Where burned-in captions are expected: white 50px, black stroke 10px, whole sentence cuts in and out, no animation (moving captions fight the character for attention).
- Align an in-picture number with the voice-over **on the same syllable**: the syllable that says the number = the number slams in = a low thump = a screen shake (9Hz, fully decayed in 0.3s).

## 6. Implementation notes

- **Cut by seconds, not beats**: give each segment a duration in seconds instead of rounding to eighth notes - storytime follows the voice-over, not a tempo. Turn off any default beat "punch" on transitions; storytime has no beat hits.
- **The character**: a front-facing bean character with poses rest / talk / point / type / shrug / stiff. Each pose is just two hand target points relative to the shoulders (in head-radius units). The drawing function should return the hand and head positions so props and symbols can be placed on them.
- Procedurally drawn stick-figure characters tend to look generic and machine-made. For a finished film, use a real frame library for the hero; keep code-drawn characters for blocking and previews.
- **Lip sync**: compute a 60fps RMS envelope of the voice-over and quantise it on twos to mouth levels 0/1/2. When the final voice-over replaces a placeholder, recompute the envelope and the mouth shapes follow automatically.
- **Audio**: place the voice-over and add sound effects (whoosh, keyboard, bloop, thump, thud, crickets, pip, boing).
- **One room, three shot sizes**: draw the room once as a world canvas (for example x -1000..2900, y -700..1700, static parts cached as one image). Medium (zoom 1.01-1.045), wide (0.53 -> 0.50) and close (1.90 -> 1.98) only change the camera. Things only visible in the wide shot (bookshelf, plants, ceiling lamp) already live in that world. **Make the world one size bigger than the widest shot**, or camera drift will show black edges.
- Key parameters: character at 24fps, mouth 12 changes per second, pose change 0.1s plus 7% bounce, character line 0.05R.

## 7. Representative work and references

- Three popular first-person storytime animation channels (the measured episodes above come from two of them).
- An industry interview with the studio that adapted one storytime channel into a series ("pose-to-pose, very little animation", "he never did lip sync on his channel", "too soft, too slow").
- Pappis, *Animation Studies* journal article on the rise of storytime animation (genre history and visual grammar: round-faced avatars, white backgrounds, no frame-by-frame animation, closer to animated storyboards): https://journal.animationstudies.org/article/id/135/
- A widely used inertial-bounce expression (the source of freq 3, decay 5).
- A maker's forum tip: "add a little bounce when changing poses".

## 8. The 3 most common mistakes

1. **Treating it as full animation, with everything moving.** The life of this style is "snap + hold": one leading channel has 70% of frames fully static. If everything drifts slowly, it gets soft and loses rhythm (the "too soft, too slow" the series team feared most). Pose changes must be as fast as 0.1s and then **really stop**. Keep continuous small motion only for breathing, blinks and small background things, with amplitude <= 1-2%.
2. **Making the background as interesting as the character.** Background saturation, contrast and line width must sit one step below the character (3px grey background lines vs 8px black character lines). A busy background pulls the eye off the face and the voice-over's joke is lost.
3. **Not giving reaction shots silence.** Starting the next line right after the outrageous one talks over the joke. Put reaction shots in a gap in the voice-over, at least 0.8s. Hold the camera and add only one or two small details (a sweat drop, a slow blink, eyebrows dropping). To push it harder, jump in one step on the punchline (hard cut to ~2x closer) or smash in over 0.17s - don't fill the gap with a slow constant push-in.

---

## Example shot plan (8.75s, 60fps)

Medium shot talking to camera (0-2.0s) -> whip -> over-the-shoulder at a screen with a key number slammed in (2.0-4.4s) -> smash -> big reaction close-up in silence (4.4-5.6s) -> hard cut -> very wide shot of the same room, the hero glances at and points to the computer (5.6-7.25s) -> jump-in -> close shot, shrug, "?" pops, hold (7.25-8.75s).

## Lessons from review

- **Black edges**: they come from a world canvas that is too small, a smash-cut spring that undershoots below 1x, or camera drift. Make the world bigger and clamp the smash scale at >= 1, then check every edge on a filmstrip: zero frames should show black.
- **No room after the punchline**: split out a jump-in shot and hold ~0.95s after the "?".
- **Wide and medium shots must be the same room**: use one world canvas and only move the camera.
- **An over-the-shoulder silhouette that reads as someone else**: draw the back-view identifiers and a rim light.
- **A whip in mid-sentence and late subtitles**: move the whip into the breath, and switch subtitles on the cut frame.
- Small timing details matter: if a sound effect lands and the matching expression (eyebrows dropping) lands 0.15s later, they read as unconnected - sync them. In long holds, add a glance away and back, or a point at the object on the key word.
- Even, uniform vector lines with no hand-drawn wobble are correct for this style; keep them.

## Checking

Check it on a filmstrip. A usual heuristic says "more than 40% static frame pairs reads as stuttering" - **that does not apply to storytime**. One leading channel's originals have 70.7% fully static adjacent frames; that is the style, not a stutter. A version with continuous breathing will have far fewer static pairs (0-16%) and feel more "alive", closer to the on-twos channel. To get closer to the snap-and-hold channel, turn off breathing, nodding and background loops and keep only lip sync and pose snaps (the static-pair ratio will rise sharply).
