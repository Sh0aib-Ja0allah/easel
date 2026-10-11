<!-- Easel: translated and adapted from alchaincyf/huashu-art-motion @ 9ff59339f934e08483ba0a5b1db20f4c2c421b35
     (github.com/alchaincyf/huashu-art-motion, references/动画语法/y5_kinetic_type.md).
     MIT License, Copyright (c) 2026 alchaincyf (花叔 · 花生); full text in THIRD_PARTY_NOTICES.md.
     Modified by Easel (2026-10-11): translated to English; removed designer, film, song, artist, channel, tutorial,
     font and software names; dropped the source's demo film, file paths, scripts, JS function names and font tooling;
     restated demo-specific values as general rules and examples; adapted CJK character limits with English equivalents;
     folded the review and QA notes into rules. -->

# Kinetic type

> Grammar in one line: **the words are the actors. Each key word slams in on an accent; the main word is big enough to read at a glance; the rest rise out of a "slot" to match what the ear hears. There is only ever one focus on screen. The camera and background keep moving; the words stop once they land.**

Lineage: a celebrated 1959 feature-film title sequence is widely seen as the first large-scale use of moving type in a feature film. From 2008 on, lyric and dialogue kinetic-type videos made with motion-graphics software turned it into a standard grammar for explainers, lists, quotes and data openers.

## Pre-flight checks

1. **First confirm the words should be the star here.** Use it only for lists, quotes, numbers and chapter cards. If more than 30-60 seconds in a row is all text, switch grammar, or insert an image or an evidence object (screenshot, code card, chat bubble) every 2 pages.
2. **Count the words.** Main word <= 4 CJK characters (in English, 1-2 short words); support line <= 14 CJK characters (roughly 6-8 English words). Only one thing enters at any moment. If it doesn't fit, split the page; don't shrink the type to cram it in.
3. **No more than 3 pages of the same layout in a row.** Four pages of "big word + support line + top-left label" is a slideshow. Insert a number slam, an evidence object page, or a zoom-into-a-colour-block transition between them.
4. **Write every hit as a beat number or a word in the voice-over.** A hit that is neither on the beat grid nor on a word gets deleted or moved onto one.
5. **Words stop once they land.** Leave the energy to beat bumps, page changes and evidence objects entering. The main word doesn't drift and doesn't breathe.

---

## 1. When to use it

**Use it:**
- Openers and chapter cards for explainers, lists, "X stages", "3 reasons": the information is **structure** (how many, which one, from what to what), not imagery.
- Quotes, key lines, one-line conclusions: viewers remember what they "read while watching" better than what they "hear and try to remember".
- Number explainers: one number per shot, the number itself is the star.
- A voice-over with clear stressed words ("it's not writing code, it's **stating the need**").

**Don't use it:**
- Stories and emotional arcs -> with no face, viewers struggle to empathise (use a storytime character).
- Long explanatory voice-over with a screen full of text -> viewers only read and stop listening, and can't keep up with the reading either. A whole film of moving text over 30-60 seconds is tiring; use it for openers, chapter cards and conclusion cards.
- Long lists (> 5 items) -> make a static infographic and talk through it slowly.

## 2. Composition

**Framing**: one main word per screen. The main word is left-aligned in the left 1/3-1/2 of the frame (or mirrored to the right), the support line sits tight under it, and the other side holds an "evidence object" (a code card, chat bubble, checklist). A small label sits in the top corner ("Stage 01") with a progress rail. Keep at least 130px of margin all round.

**Type scale**: main word 340px (Black weight) : support line 96px (Heavy) : label 40px (Bold, letter spacing 6px) ~ **3.4 : 1 : 0.4**. The main word must be read in 0.3 seconds, so give it only 2 CJK characters (one short word in English).

**Colour**: each chapter gets one full-screen background colour; a new chapter = a new background (the colour itself is the chapter number).

| Shot | Background | Main word | Accent |
|---|---|---|---|
| Title | yellow `#FFD23F` | ink `#111111` | white "3" in a coral circle `#FF5A36` |
| Chapter 1 | coral `#FF5A36` | white | yellow highlighter `#FFD23F` |
| Chapter 2 | navy `#14213D` | yellow | yellow highlighter, blue bubble `#3A86FF` |
| Chapter 3 | off-white `#F4EFE6` | ink | coral underline, green tick `#2BB673` |

Four backgrounds + ink + white for the whole film. There is only ever one accent colour.

**Shape language**: the words are the biggest shapes. Supporting shapes are only rounded rectangles (cards r=26, bubbles r=30, keycaps r=22), circles (behind numbers) and slanted blocks (highlighter, slope 0.18). The background is a dot grid at 64px spacing (6-10% opacity). No outlined text and no drop-shadowed text (the only shadow is an offset shadow under cards at 8-18%).

## 3. Motion

**Entrances (choose by importance)**

| Element | Method | Curve and duration |
|---|---|---|
| Main word | **Slam**: scale from 1.7x to 1, opacity 0 -> 1 over the first 0.06s | underdamped spring `1-e^(-10t)*cos(2*pi*2.2t)`, ~8% overshoot, settles in ~0.35s |
| First word of a title | Slam + rotate back to level, -8 deg -> 0 | same as above |
| Support line, label | **Rise from a slot**: the text is pushed from +1.2x its height below the baseline to 0, inside a mask | `expoOut`, 0.30-0.35s |
| Number / icon / bubble / keycap | **Pop**: scale 0 -> 1 | `backOut`, s=2.6-3.0 (17-20% overshoot), 0.30-0.42s |
| Card | **Slide in**: from +700px to the side or +260px below, rotating back from 3.4 deg | `expoOut` 0.40s |
| Typing | Truncate by character | 13 characters in 0.5s (26 characters/second), cursor blinks at 2Hz |
| Code completion | Grey text appears in **0 frames** (completions really do appear instantly) -> becomes solid when Tab is pressed | keycap press compresses 14%, springs back with e^(-18t) |
| Highlighter / underline | Brushed in from left to right | `expoOut` 0.30s, 1-3 eighth notes after the word appears |
| Key-word zoom | On the accent beat, scale to 1.35x and pin it; the highlighter scales with it | spring freq 2.5 / decay 9, on the same beat as the matching action (pressing Tab, ticking a box) |
| Giant stage number | 900px, 5-13% opacity, in the lower right, drops from 1.35x to 1, then drifts diagonally at 14/10 px/s | spring freq 2 / decay 8 |
| Tick | The tick stroke is drawn along its arc length; the box goes 1 -> 1.25 -> 1 at the same time | 0.22s; the strike-through follows 0.08s later |

**Exits**: faster than entrances and accelerating (`expoIn`), 0.18s, staggered 0.03s between elements; each one scales to 0.6, drops 60px and fades out. **Exits are faster than entrances** - the viewer's attention has already moved on before the exit starts. On the last beat of a title shot, exit everything except the one shape the next transition will zoom into.

**Stagger**: words on the same line are one eighth note apart (0.25s at 120 BPM); a group of small elements (three ticks) is also one eighth note apart.

**Continuous motion (the words don't move once landed; other things do)**
- Camera drift: two sine waves, 5px amplitude, periods of about 7s and 2.7s; a very slow rotation of +/-0.5 deg.
- Beat bump: on every quarter beat the whole frame scales up 1.2% and decays with `e^(-25t)` (~0.12s) - the picture "breathes" with the drum.
- The background dot grid pans diagonally at 36px/s.
- Final beat: the camera pulls back 6% (`expoOut` 0.5s); everything shrinks a little = "closing".

**Measured from originals (two lyric kinetic-type videos, 30fps)**: fully static adjacent frames are only 10.3% and 21.2%. The picture moves 70-80% of the time - the exact opposite of storytime's 71% static. Big visual events (peaks where > 1.5% of the frame changes) come every 0.66s and 0.83s on average, close to **one per beat** (the two songs are about 105 and 99 BPM, a beat is 0.57s and 0.60s). An explainer opener can run one big event per eighth note (0.25s at 120 BPM), twice as dense as the lyric videos; a long film should drop back to one per beat.

## 4. Transitions (3 core + 2 common)

1. **Zoom through**: the camera rushes into a shape on the previous screen (for example the coral circle behind a "3"). The shape's colour = the next screen's background. Once it fills the frame, the next screen drops from 1.25x to 1. For the first 55% of the time, zoom to 30x with `expoIn`; for the last 45%, settle with `expoOut`. Parameters: centre x, centre y, shape size, max zoom, fill colour.
2. **Colour bands**: three slanted colour bands (yellow -> white -> navy) sweep left to right in relay, staggered 12%. The last band is the new screen's background, and the new screen is revealed behind the bands. 0.5s `expoInOut`.
3. **Push**: old and new move together, like sliding along one long canvas to the next panel. 0.35s `expoInOut`.
4. **Mask wipe**: a shape (circle, bar, or the word itself) grows from small as a mask to reveal the new screen. An iris transition works.
5. **Morphing word / word as transition**: a word on the previous screen grows into a full-screen colour block, or a word flies off screen and takes the old screen with it.

**Sync trick (the most valuable rule here)**: if a transition starts at the new segment's start time, then to make the frame where "the new screen is revealed" land exactly on the bar line, set: segment start = **bar line - reveal point x transition duration**. Worked examples at 120 BPM:
- zoom through: reveal point p=0.55, duration 0.45s -> start 1.75 (revealed at 2.00).
- colour bands: reveal point ~0.6, 0.5s -> start 3.70.
- push with `expoInOut`: the eye sees it "arrive" at 90% displacement (p~0.58), not at p=1 -> start 5.80. Computing from p=1 gives 5.65, and the push lands 8 frames before the downbeat.

Write every hit inside a shot as a beat number too, not in seconds.

## 5. Rhythm and text

- **120 BPM, 4 bars + 1 closing beat (8.5s), one shot per bar** (title / stage 1 / stage 2 / stage 3). Inside each shot: beat 1 main word slams (+ the giant stage number behind it), beat 1.5 evidence object, beat 2 support line, beat 3 evidence object action, beat 3.5 key-word zoom + highlight, beat 4 rest or exit. At the end, beat 16 (8.0s) is a closing hit, then hold still for 0.5s. All four shots use the same beat slots and only swap sides and content - from the second shot on, viewers "know where the next hit is", and that is where the feeling of rhythm comes from.
- **Main words land on strong beats (the first beat of each bar)** with a low-frequency impact; small elements land on eighth notes with a pop. A rising noise in the 0.3s before a transition carries the ear into the next bar.
- Every visual hit has a sound, and every accent has a visual. Keep the sound list keyed to the same beat numbers as the shots.
- **Hold long enough to read**: an English video-text guideline sets a floor of 13 characters per second. For Chinese no primary standard was found; the subtitle-industry rule of thumb is a ceiling of 7-9 characters per second (unverified, treat as a working value). A 2-character main word stays at least 0.5s; a 7-8 character support line stays at least 1.0s (in English, scale by the 13 characters/second floor).
- When syncing to voice-over: the main word = the stressed word in the voice-over. **Better early than late, at most 1 frame early** - people are much more sensitive to sound arriving before picture than after it. (Broadcast lip-sync tolerance: audio may lead by at most 40ms and lag by at most 60ms.)

## 6. Implementation notes

- **Tempo**: make BPM configurable (a 128 default is common; this style uses 120). Allow any segment to set its duration in seconds. Turn off any default transition "punch" and use your own beat bump instead, so it hits on the beat and not at the start of the transition.
- **Easing set**: `expoOut`, `expoIn`, `expoInOut`, `quintOut`, `backOut(p, s)`, `spring(t, freq, decay)`, `settle(t, amp, freq, decay)`.
- **Text drawing needs**: scale and rotate around any pivot, stroke, letter spacing, width measurement, mask rise, pop, typing, slanted highlighter block, underline.
- **Camera**: a transform wrapper with x, y, zoom and rotation, plus a drift function.
- **Transitions**: zoom through, colour bands, push.
- **Style helpers**: beat number to time, the type scale, the beat bump, the main-word slam, the dot grid, key words (rise first, then zoom and pin on the accent beat), the giant background stage number, the camera.
- **Progress rail**: draw it on a fixed overlay layer whose value depends only on the film's global time. If it is drawn inside each segment, it jumps with the page on a push.
- **Fonts**: one heavy sans family in four weights (Black / Heavy / Bold / Medium); code cards use a monospace font.
- **Music**: synthesised drums (kick on every beat, clap on 2 and 4, hi-hat on the off-beats) + bass (one root note per bar in eighth notes) + event sounds (main word = boom, small element = pop, typing = click, tick = rising pop, before a transition = riser).

## 7. Representative work and references

- An archive of a celebrated mid-century title designer's work (the 1959 feature-film title sequence).
- A general encyclopedia entry on kinetic typography (two kinds, motion typography and fluid typography; feature-film pioneer in the 1950s).
- A two-part motion-design tutorial on kinetic typography in motion-graphics software. Frame counts: a small word slides in over 4 frames; a main word is flung in over 6 frames + 2 frames of overshoot back to rest; a camera push is 6 frames + a 2-frame pull back; "the camera should move a little late, as if pushed by the sound". Part 3: falls should accelerate, not ease to a stop; on impact, scale the whole composition up and back to 100%.
- A widely used inertial-bounce expression (`amp*sin(2*pi*f*t)/e^(decay*t)`, default freq 3 / decay 5).
- Lee, Forlizzi and Hudson (2002), "The Kinetic Typography Engine" (moving type expressing emotion and tone of voice).
- An English video-text reading-time guideline (13 characters per second).
- The two lyric kinetic-type videos measured above.

## 8. The 3 most common mistakes

1. **All words the same size, moving together.** No hierarchy means no focus, and viewers don't know what to read first. Keep main word to support line at least 3:1, and let only one thing "enter" at a time while everything else stays still.
2. **Words that keep drifting.** Words can't move while being read (they don't go in). Give continuous motion to the camera drift, beat bumps and the dot grid; a word is pinned 0.35s after it slams in.
3. **Animation off the beat, or on the start of the transition.** The first frame of a transition is not the accent; the frame where "the new screen is revealed" is. Move the segment start earlier by "reveal point x duration", then write every hit inside the shot as a beat number. Every hit off the beat grid makes the whole film a little looser.

---

## Example shot plan (8.5s, 60fps, 120 BPM)

Title "the 3 stages of X" -> zoom through the "3" -> stage 1 (an evidence card, e.g. a code card with a grey completion and a Tab press) -> colour bands -> stage 2 (one short line in, a whole block out) -> push -> stage 3 (a three-item to-do list that ticks itself off) with the progress rail filling up.

## Lessons from review

- What works best: a shape (the circle behind the "3") rushing into the camera and becoming the next segment's background. Sound and picture feel near-perfect when every visual event sits on the 120 BPM grid on the same frame as the kick.
- **Support lines held too short** (0.6-0.9s) -> bring them in one beat earlier and cut them to 6-7 CJK characters (a few short English words), giving 1.0-1.5s of reading time; add 0.5s at the end of the film.
- **A support line nearly touching a panel** (14px) -> shorten it, right-align it, keep the gap > 180px.
- **A push landing 8 frames early, with the progress rail jumping** -> recompute the segment start from 90% displacement; move the rail to the fixed overlay layer and change its colour on the reveal frame.
- **Stage shots not kinetic enough** (stage number too small, key word only highlighted, not scaled) -> add giant background stage numbers; zoom the key word to 1.35x on the accent beat.
- **No closing hit, and ticked items all turning grey** -> add a closing hit on beat 16 (camera pulls back 6% + a 3.5% punch + a low thump + a high bell); ticked items turn green, not grey; move the content down 70px to fill the empty space at the bottom.
- Code cards use a monospace font.
- Not adopted: "stretch each shot to 2.5-3s for a 10-11s film". When the target length is fixed (about 8 seconds), cut the word count instead of adding time.

## Checking

Check it on a filmstrip and run qa. In kinetic type, sudden-change flags should fall on the beat: intentional beat flashes are not errors. Compare each flag's time against the beat grid - only the ones off the grid are bugs. Scan all four edges frame by frame: zero frames should show black.
