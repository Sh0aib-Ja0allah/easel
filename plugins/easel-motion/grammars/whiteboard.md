<!-- Easel: translated and adapted from alchaincyf/huashu-art-motion @ 9ff59339f934e08483ba0a5b1db20f4c2c421b35
     (github.com/alchaincyf/huashu-art-motion, references/动画语法/y3_whiteboard.md).
     MIT License, Copyright (c) 2026 alchaincyf (花叔 · 花生); full text in NOTICE.md.
     Modified by Easel (2026-10-11): translated to English; replaced series, channel, studio, illustrator, presenter, tool and font names with neutral descriptions (the two reference types renamed "lecture-board" and "page-per-shot"); removed source-project paths, scripts, function names and demo-film references (useful demo values kept, tagged [tested]); replaced named characters with generic ones; rewrote the implementation notes engine-neutrally; condensed the review and QA sections into tool-independent lessons; dropped reference links. -->

# Whiteboard explainer

A video animation grammar card (lecture-board type).

In one sentence: the speaker says a line, and a hand writes a line or draws a picture on a big whiteboard. The camera moves across the board with the argument and finally pulls out, so viewers see the whole argument as one picture.

Basis: research on this style. One episode of a well-known whiteboard lecture series and one episode of a one-page-per-shot science channel were measured, and the official documentation of commercial whiteboard tools and first-hand statements by the series' illustrator and the channel's creator were checked. The raw research is not included; the figures used are copied into this card.

Tags used below:
- [measured] = measured from the samples.
- [first-hand] = from the creators' or tool makers' own statements and documentation.
- [second-hand] = from secondary sources.
- [inferred] = generalised or deduced from the samples.
- [tested] = a value that worked in a test build of this grammar.

**Pick one grammar first; do not mix them:**
- Lecture-board type: one big whiteboard, with the camera moving across it, 5.3 moves per minute.
- Page-per-shot type: one sheet of paper per shot, hard cuts between sheets, 8.1 per minute, camera static.
- This card follows the lecture-board type. The key points of the page-per-shot type are in sections 4 and 8.

## Before you start

1. **"Draws too little, writes too much" is a storyboard problem: fix the visual metaphor before drawing.** For each board, first write down the object or joke to draw, then decide what words to write. A handwritten full sentence is never longer than one line. Count it: if more than half the words on the board repeat the narration spoken at the same moment, the board draws too little and writes too much. Puns and icons added later will not save it.
2. **Rotate block templates.** Blocks with the same structure, such as "year -> object -> orange label" or "bullet -> one line of text -> an icon", are used no more than 3 times in a row across the film. Switch to a comparison (two pictures side by side), a process (linked by arrows), a zoomed-in detail, or one large full picture.
3. **Do not hand-type camera coordinates when framing.** Work back from the bounding box of the strokes in this block (frame it, then add a margin). Push old text that the frame edge would cut in half out of frame.
4. **Fix the line types from the first stroke.** Solid = has happened, dashed = planned, dotted = a leader line across blocks. Things on the board can only be erased or left; they never fade out.
5. **Check every object's silhouette for anything that could read as an indecent shape.** Upright, elongated objects with a round head, sides flaring out and a round base are the riskiest. Give them a pointed tip and a flat base before drawing.

---

## 1. When to use it

**Use it:**
- Argument-led content: talks, viewpoints, chains of cause and effect, historical threads. Best when concepts relate to each other and can be drawn as a map. The series' illustrator: "lay information out in space so people can see the relationships between things" [first-hand].
- A short science piece built on one chain of reasoning: use the page-per-shot type.
- Steady narration with clear keywords. In the lecture series the writing speed is about the same as the speaking speed, like "subtitles being written out by hand" [measured].

**Don't use it:**
- Content that needs precise data charts. Hand-drawing error is too large.
- Content with complex action and spatial relationships. A whiteboard has no depth.
- Content that needs emotional intensity. Single-colour line art is weak at it.
- To "improve understanding". The experiment by Türkay (2016) found no learning advantage of whiteboard animation over other formats. Its value is attention and a sense of companionship [second-hand].

## 2. Composition

- **Palette** (measured, lecture series):
  - Base: pure white `#FBFBFB`
  - Lines: black `#0A0503`
  - The only accent: orange. Text `#EB701F`, fills `#F3742D`; areas of hatched light orange about `#E9A67C`.
  - Orange is about 22% of all ink pixels, used only on keywords and hatched fills.
  - The page-per-shot type uses a pinkish off-white paper `#E7DBE1`, with coloured-pencil light yellow `#EDE6A2` and light blue `#B5CBE8`.
- **[tested]:** base `#FBFBFB`, lines `#0A0503`, accent `#EF7226`. A character's body gets a layer of orange at 22% opacity.
- **Line width:** in the lecture series, strokes are about 0.6-0.7% of the frame height, about 6-7px at 1080p. Hatching lines about 0.3%. Title letters about 5.5% of the frame height tall. The page-per-shot type uses thicker lines, about 0.8% [measured]. [tested] Line width 6.5px.
- **Layout:**
  - The lecture series "plans the final full picture first, then draws backwards" [first-hand].
  - Each board area holds 3-6 text-and-picture groups. Fill it, then move on.
  - A smooth move covers only 0.23 frame widths, so the old and new areas overlap heavily and viewers always see the edge of the previous block [measured].
  - The full picture revealed at the end is a long horizontal scroll.
- **Lettering:** the lecture series uses all-caps hand-printed lettering (comic speech-balloon style). [tested] A handwritten-style font, subset to the characters used.
- **The hand:**
  - A real right hand holding a black marker enters from the **lower right**, forearm angled down to the right, covering 15-25% of the frame.
  - When not drawing, the whole hand leaves the frame. Time the hand is in frame: lecture series 49%, page-per-shot 40% [measured].
  - [tested] A hand drawn in code: bare forearm with a shaded side and arm hair, the index finger pressing a black marker, scale 0.82, a gentle sway at 7 rad/s.

## 3. Motion

- **Writing speed** [measured, 9 cases]:
  - Body text: median about 16 characters per second.
  - The opening title goes half as fast, about 7.5 characters per second, to "set the topic".
  - Narration runs at about 13 characters per second, so writing speed roughly equals speaking speed.
  - [tested] Body text at 16 characters per second; a one-word question title at the title speed of 7.5.
- **Drawing speed** [measured + inferred]:
  - Small icons 0.5-1s; a portrait about 2s.
  - In the lecture series, the median new ink area is 0.25% of the frame per second.
  - Complex illustrations are not drawn on camera. Either they are drawn in advance and revealed as the camera moves over them, or the whole image is hard cut in and the hand only adds colour.
- **[tested]:**
  - Pen speed 2600 world pixels per second, about 2 times the real-footage speed of the lecture series. An 8s test had to be compressed; real films should slow down.
  - Stroke duration = stroke length / pen speed, at least 0.04s per stroke, with a 0.02s pen-up gap.
  - Inside each stroke use sineInOut, so the start and end of the stroke are slow.
  - A character is revealed in 0.7s in "reveal" mode: the pen tip walks an 8-row zigzag inside the character's joint bounding box. The area it has passed becomes a clip, and the line art shows only inside the clip.
  - An earlier version traced all parts at the same time with dash offsets while the pen tip followed the joints. The review judged that "the pen does not lead the line", so it was replaced.
  - When a script has no stroke-order data (for example CJK glyphs), reveal each character with a 3-row zigzag, with the pen tip moving back and forth. It reads as writing.
- **Speed-up factor:** the page-per-shot channel's creator shoots one photo per second and holds each photo for 2 frames while drawing, about 12 times real speed. The lecture series is inferred at 5-8 times [first-hand + inferred].
- **Pops without the hand:** in the lecture series, some orange keywords pop in as whole words in post, with no hand drawing them (for example ANAESTHETIC and CREATIVITY) [measured]. [tested] Key phrases pop in with a 0.3s back-out (overshoot 2.2), and the hand does not go there.
- **Pen-tip path:**
  - When the gap between two strokes is under 0.25s, the pen tip slides along an arc from the end of the last stroke to the start of the next (sineInOut, lifted 30px).
  - For longer gaps, the hand leaves the frame: 0.35s cubicIn to off-screen at the lower right.
  - 0.3s before the next stroke starts, it comes back in from the lower right with cubicOut.
- **Continuous motion:** a whiteboard film feels alive because the hand is always drawing. In the lecture series, drawing activity and spoken word density are almost uncorrelated (|r|<0.07): when the speech pauses, the hand keeps going [measured].

## 4. Transitions (5 common ones)

1. **Smooth move or push/pull across the board** (the lecture series' main transition, 41 times).
   - 1.2-2.4s, **easeInOutSine**: the measured peak-to-mean speed ratio is 1.49; a theoretical sine ease gives 1.57.
   - One move covers about 0.23 frame widths, overlapping the previous block by about 75%.
   - [tested] 0.9s sineInOut, a diagonal move of about 0.5 frame widths with a push to 1.12x. When the move starts, the hand is drawing an orange connector toward the new area, so the hand leads the camera.
2. **Whip pan:** a fast pan with motion blur, about 0.8s, moving 0.5-1.2 frame widths at once, to jump to a far area of the board (15 times in the lecture series).
   - [tested] 0.8s cubicInOut lateral move of about one full screen. Stack 9 samples along the direction of travel for blur, only during those 0.8s. Smooth moves and pull-outs stay sharp.
3. **Pull out to reveal the whole picture** (the ending).
   - The lecture series' ending: grey fills the board -> a fast 0.6s pull-out -> about 9s of panning across the long scroll -> a further pull-out to the full picture.
   - Commercial whiteboard tools switch on a zoom-out at the end by default [first-hand].
   - [tested] A 0.65s sineInOut pull-out to 0.45x, then a 0.5s hold. At the same time, the whole board takes on a very light grey `#EEEEEC` over 0.5s.
4. **Cloud or explosion wipe:** a cartoon smoke cloud fills the frame and clears, about 1s (once in the lecture series).
5. **Hard cut:** a hard cut to a pre-drawn image (rare in the lecture series); the page-change cut of the page-per-shot type (its main transition, 8.1 per minute); the page-per-shot channel also inverted the whole frame for a topic about night.

**Note:** "pushing into a frame or a speech bubble" and "page turns" did not appear in the samples. An early test pushed into a thought bubble; after the research it was replaced with a whip pan plus smooth moves.

## 5. Rhythm and text

- **Hold per block:** in the lecture series, the median time between two camera moves is 6.6s (interquartile range 4.0-13.8s). In the page-per-shot type the median shot is 7.1s [measured]. A test that put 3 blocks into 8s ran at about 2.5 times real density.
- **Sync with narration (the core)** [measured]:
  - Writing starts 0.2-0.8s after the matching phrase starts, median +0.5s.
  - It finishes within 1s after the phrase ends: write while speaking, slightly behind, **never ahead**.
  - The exception is visual setups (a pill bottle, an arrow), drawn a few seconds early and waiting for the line.
  - In the page-per-shot type the drawing drops in as soon as the noun is spoken, median +0.3s.
- **Transitions follow topics, not pauses:** a new block on the board is a new point [measured + inferred].
- **Music:** the lecture series has **no music** under the speech. The page-per-shot type has music throughout, about 9dB below the voice [measured].
- **Tool defaults:**
  - One commercial whiteboard tool holds 0.5s after drawing by default [first-hand], and moves the camera in 1s by default [second-hand].
  - Another draws each asset over 3s by default [first-hand].

## 6. Implementation notes

- Densify points with Catmull-Rom and resample at equal arc length. Hand-drawn lines add low-frequency noise on top. Use noise and sprite caching.
- Draw polylines progressively by length, returning the pen-tip position.
- A keyframe camera, and motion blur.
- A zigzag reveal mask (added after the review).
- **Stroke timeline:** lines, text, pops and fills are queued in order, with durations computed from length and speed. Print the timeline at delivery and check each block's end time. In an early version the second block ended at 7.9s, 2.5s after the camera had moved on; only the printed timeline caught it.
- **Stroke drawing:** five kinds - line, text, pop, fill, character. Text and characters are revealed with the zigzag mask, and the pen-tip position is taken directly from the mask's leading edge.
- **Pen and hand path:** including the slide between strokes, leaving the frame and entering it.
- **The hand and marker** are drawn as one piece.
- Put the eraser-mark texture in screen space. It follows the camera's pan but not its zoom; otherwise a 5x push turns it into big grey blotches.
- **Key architecture:** all shots draw the same board with the same camera, and every transition keeps the same picture. The "transition" is simply camera motion, so nothing on the board ever jumps during a transition.

## 7. Reference works and first-hand sources

- Samples: one episode of the well-known whiteboard lecture series; one episode of the one-page-per-shot science channel.
- An interview with the series' illustrator (2025).
- The producing studio's own "about" page.
- Official documentation of commercial whiteboard tools: camera and end zoom; the draw entrance; entrance animations; another tool's default video settings.
- Learning-effect research (cited via an encyclopedia article on whiteboard animation), including Türkay (2016).
- Links are omitted in this adaptation.

## 8. The 3 most common mistakes

1. **Filling a whole board before speaking, or speaking before drawing.** The magic of whiteboard films is "say a line, write a line": writing speed equals speaking speed, about 0.5s behind the narration. Drawing first makes viewers wait; speaking first makes the drawing a redundant repeat. Do not draw complex illustrations live: draw them in advance and reveal them as the camera moves over.
2. **Cutting the whole screen to a blank new block every time.** A smooth move in the lecture series covers only 0.23 frame widths, so old and new areas overlap heavily and viewers always know where they are on one big picture. Only use the 0.8s whip pan with blur when jumping far. Always end with a pull-out to the full picture; that is where this genre lands.
3. **Many colours, lines too thin or too even, the hand hanging in the frame all the time.** Use only black plus one accent colour, with a line width of about 0.65% of the frame height. The hand enters only to draw and leaves to the lower right when done; emphasised words can pop in without the hand. Also, do not mix the lecture-board and page-per-shot types: either one big whiteboard with camera moves, or one page per shot with hard cuts.

---

## Review notes (an independent reviewer watched only the finished test film: 6/10, the lowest of the three)

Review comments and the fixes made:
- "The pen tip does not lead the line; several strokes of the hero appear at once; the text is wiped in by a mask":
  - The hero now uses the "reveal" drawing mode of commercial whiteboard tools: the complete line art is hidden underneath, the pen tip walks an 8-row zigzag, everything it passes is revealed, and the pen tip is always on the leading edge.
  - Text is now written character by character: each character gets its own time slot, the pen tip goes back and forth in a 3-row zigzag inside the character's box, and the mask reveals behind it.
  - The reveal mask is a union of square strips all wound in the same direction, so overlaps do not cancel each other under nonzero fill. A zigzag path generator goes with it.
- "A 0.4s dead zone after the whip pan": start drawing the second block earlier, so the hand enters as the whip pan finishes.
- "Screenshot frame lines cross a character's head": fill each frame with the board colour before stroking it, so the frame in front covers the lines of the frame behind.
- "A line of text is cut in half by the top edge": move the third block down 60px as a whole.
- "After the pull-out, the grey board and eraser marks look like a dirty wall": lighten the grey to `#EEEEEC` and halve the opacity of the eraser marks.
- "The overview holds only 0.15s, and the three groups of drawings are not connected":
  - End the first block with an orange arrow pointing right, so the whip pan has a direction.
  - End the second block by drawing an orange connector toward the third block, so the hand leads the camera.
  - Start the pull-out earlier and hold the overview for 0.5s.
- "The hand is a cartoon hand with a blue sleeve": changed to a bare forearm with a shaded side and arm hair, closer to the real hand of the lecture series. It is still drawn in code.

## QA notes

- No shot in a whiteboard film should have jump frames. Every "transition" is a camera move over the same board, so nothing on the board jumps.
- A motion area of about 3-5% comes mainly from the hand and the line being drawn; it rises during camera moves.
- Frames render in under 10ms each, because everything is vector lines with no pixel-level processing.
- Check the pacing on a filmstrip: each sampled frame should show the drawing a little further along.
