<!-- Easel: translated and adapted from alchaincyf/huashu-art-motion @ 9ff59339f934e08483ba0a5b1db20f4c2c421b35
     (github.com/alchaincyf/huashu-art-motion, references/动画语法/y2_vox.md).
     MIT License, Copyright (c) 2026 alchaincyf (花叔 · 花生); full text in NOTICE.md.
     Modified by Easel (2026-10-11): translated to English; replaced channel, series, creator, staff, company and font names with neutral descriptions (samples relabelled A-D); removed source-project paths, scripts, function names and demo-film references (useful demo values kept, tagged [tested]); replaced named characters with generic ones; rewrote the implementation notes engine-neutrally; condensed the review and QA sections into tool-independent lessons; dropped reference links. -->

# Editorial collage explainer

A video animation grammar card.

In one sentence: lay the argument out on a desk covered with real material - clippings, photos, documents - and move the camera over it like an investigative reporter's eye. Lines and pen marks go on in steps, a frame at a time. The sense of evidence comes from "these things were really put here".

Basis: research on the collage style of an explanatory news channel. Five samples:
- Sample A: the channel's slow archival-collage series (2022).
- Sample B: an episode on the history of a 1960s poster style (2019).
- Sample C: the channel's map-led border series (2018).
- Sample D: an independent map-journalism creator (2026).
- Plus a 2026 live-action episode from the channel, for contrast.

13 camera moves were fitted with easing curves, and colours were sampled. The raw research is not included; the figures used are copied into this card.

Tags used below:
- [measured] = measured from the samples.
- [first-hand] = from the creators' own statements.
- [tested] = a value that worked in a test build of this grammar.

## Before you start

1. **Real material is the main picture.** Screenshots, original text and photos fill or nearly fill the frame. Push in to the line that must be read. The desk is the world the camera travels through, not a backdrop for small pictures. Measure it: if more than 2 shots in a row show material narrower than 60% of the frame width, you have made a "picture-frame layout".
2. **Rotate "slide in -> typed label -> red circle".** When storyboarding, list the reveal actions: just there (appears on the cut), push in, pan to the next item, highlighter sweep, red string link, stamp, tear off... Do not use the same reveal sequence more than 3 times in a row. Evidence: in one long film, 36 of 37 labels slid in, and by the middle viewers could predict the next move.
3. **Text to be read goes on the top layer and is drawn last,** not at the layer of the object it belongs to. Photos, clips or later cards covering text is the most recurring blunder in this grammar.
4. **Compute the camera target from what must be read at that moment** (frame the target, then add a margin). Do not hand-type coordinates. Push labels on half-visible neighbouring cards out of frame.
5. **On a desk that accumulates cards, each time a new card goes down, read all visible text in reading order.** Words on two cards can join into a false sentence ("more than" sitting right next to "acquired"). Remove a card, or spell out the qualifier.
6. **Play the formal action of one event only once.** If an action already played in the wide overview, do not replay it after pushing in, or it reads as "it happened again".

---

## 1. When to use it

**Use it:**
- Content with real archives, news, history, maps or people: "how did this happen", "who said what, and when".
- Journalistic narration: quotes, evidence, cause and effect. When the narration says "look at this line" or "note this number", the picture highlights that line.
- Moments when you quote a sentence, a set of figures or a year, and viewers need to "see the source with their own eyes".
- Example of suitable real material: the figures from Le et al. (ICML 2012) - 1,000 machines, 16,000 CPU cores, 10 million unlabelled frames taken from online video, no labels.

**Don't use it:**
- Pure mechanism or pure concept with no real material to show. Forcing it produces "fake archives". Use the science-cartoon grammar.
- Derivations and steps: use the whiteboard grammar.
- Content that needs a lot of character acting. Cut-paper characters can only move in steps.

## 2. Composition

- **Three-colour system** (measured on sample A):
  - Near-black base `#171716`
  - Paper white `#E0DCDA`-`#EEEDED`
  - One red in two tones: bright red `#B65255` for lines, dark red `#93403C` for fills
  - Highlighter yellow `#DACF08` (darker and more olive than the channel's logo yellow `#FFF200`, which rarely appears in large areas in the films)
  - Old map paper `#E4DCCF`, parchment `#CFB195`
  - No pure white, no pure black.
- **[tested]:**
  - Desk `#e4ddcf`, a tiled paper texture with fibres and low-frequency light variation.
  - Clue red `#b8433f`, slightly brighter than measured, so it reads at 1080p.
  - Highlighter `rgba(218,207,8,.9)`, with multiply blending.
  - A large black card `#1b1b1a` lying on the desk, with the desk showing at its four edges.
- **Materials:**
  - Photos are always greyscale halftone (45°), with a white border and two strips of translucent tape.
  - Clippings have torn edges, are yellowed, and use serif (Song-style) headlines.
  - Labels are black bars with bold white text, as in the border series (for example a year and a place).
  - Index cards are ruled.
  - Paper texture is **static**. The measured frame difference during holds is 0.0-0.1: no per-frame grain. Per-frame grain is sample D's film-stock look, not this grammar.
- **Shadows are very weak.** On black cards they are almost invisible at 360p [measured]. [tested] Use blur 10, offset (3,6), alpha 0.28 throughout.
- **Deliberate imperfection:** the channel's art director: "You don't want it to look perfect because that might make it look more like an ad than an editorial piece" [first-hand].
- **Characters:** photos of real people cut out as stickers, with a white border and a shadow. [tested] For a drawn hero, offset the silhouette in 16 directions by 12px and lay a paper-white layer underneath as the sticker edge.

## 3. Motion

- **Two frame rates (the core)** [measured]:
  - The camera layer moves smoothly at 24fps.
  - The element layer (map fills growing, red lines tracing a route, typing, hand-drawn circles, pop-ins) steps at 12fps, "on twos". In sample B, 52% of motion frames carry the "move-hold-move" fingerprint.
  - [tested] Compute the camera continuously at 60fps. Quantise every element's time to 12fps before computing its progress. A QA pass then shows a share of still frame pairs (16.9% in the first test shot): these are on-twos holds, not stutter.
- **Camera easing** [measured, 13 moves]:
  - Median length 1.29s, range 0.71-1.96s. **None is linear.**
  - 7 are a symmetric easeInOutSine (like the default ease in common motion-graphics software). Use it for long "find the next card" moves.
  - 6 start fast and settle with a long tail, close to `cubic-bezier(.33,0,.2,1)`. Use it for "pull out to reveal" and "follow the clue".
- **[tested] Camera:**
  - After a highlighter sweep, push to that line with a 1.5s sineInOut (1.14 -> 1.28). In the measured samples, a sweep is often followed by a push.
  - Pan along a string: 1.1s long-tail bezier.
  - Push into a photo: 0.6s sineInOut.
  - Pull out: 0.85s long-tail bezier.
  - A 0.9s slow opening push (1.14 -> 1.165) and a 1%/s slow push after a pull-out are the old approach. Do not copy them.
- **Entrances** [measured]:
  - Archive photos and clippings **appear directly on the cut**. No pop, no drop.
  - Only when following a timeline does the next card slide in from off-screen, tilted 5-15°, flattening as it arrives, in about 0.8s.
  - [tested] Small photos and stickers slide in over 0.55s quartOut, flattening from a 12° tilt, stepped at 12fps.
- **Lines and pens** [measured]:
  - A red underline takes 0.5-1s.
  - A red ellipse takes about 1s, in one stroke, with the ends not closed and slightly crossing.
  - A highlighter line takes 1.5-3s, sweeping along with the narrated words.
  - Typing runs at about 13 characters per second, on twos.
  - [tested] Red circle 0.65s; highlighter 0.9s (compressed for a short test); typing 13 characters per second; red strings 0.5s each, staggered 0.15s; a counter rolling up to 10,000,000 over 1.4s cubicOut.
- **When the desk holds, the camera holds.** The measured frame difference during holds is 0.0-0.1: when this desk stops, it stops. While something animates inside a card (line drawing, highlighting, typing), the camera stays still. If a purely static image holds for a long time, push in to the spot to be read on a narration beat (a quick 0.28s push in by 18-32%, then hold), or move laterally at the same zoom for 0.30s to the next item. No constant-speed slow drift.

## 4. Transitions (6 common ones)

1. **Hard cut:** the vast majority, cut on narration punctuation [measured].
2. **Pan along the red string (timeline tracking):** the camera moves horizontally along a red string, 1.3-1.8s, with long-tail easing. The next card slides in diagonally from the right and flattens.
   - [tested] A red string runs from the highlighted line of a clipping to a counter label on an investigation wall. The camera follows it in 1.1s, with a short motion blur along the direction of travel (7 samples, factor 0.6).
3. **Push into the paper or photo -> cut straight to a high-resolution scan of the same image:** 1.0-1.4s, S-curve easing.
   - [tested] Push until a small photo on the wall fills the frame (log interpolation to z of about 9.6). Hard cut to a large scan of the same image (the halftone goes from fine to coarse, which reads as "swapped for a clearer copy"). Then follow with a pull-out (transition 4).
4. **Pull out from a single photo -> reveal the whole collage:** about 1.0s, fast start, long tail (measured in sample A at 2:30).
5. **Map fills growing, routes tracing:** 2.5-3.5s, on twos, with a solid red dot at the head of the line.
6. **A real hand turning pages or pulling out paper** (sample A's signature). In code, approximate it as "paper slides in along an arc, with a changing shadow".

**Note:** a "torn paper" transition did not appear even once in the 5 samples. It is a common habit of template sites, not part of this grammar. An early test used one and replaced it after the research.

## 5. Rhythm and text

- **Shot length** [measured, collage sections]:
  - Two speeds. Slow (sample A): median 3.3s, about 12 cuts per minute. A card holds 3-7s, carried by line drawing and highlights inside it.
  - Fast (sample B 1.8s, sample D 1.4s): about 25-33 cuts per minute. Images barely move; the rhythm comes from cutting.
- **Sync with narration:**
  - Highlighter, typing and line-drawing speeds lock to the speed of speech, not to music beats.
  - Sample D's creator: "Each word must correspond to a movement or action within the animation". He writes his scripts in two columns [first-hand].
  - One of the channel's producers changes the music section about every 20s [first-hand].
- **Text:**
  - Names and places: small serif text in white, under the photo.
  - Timeline titles on black: typed character by character at 13 characters per second, with a red line across the frame.
  - Quotes appear in a handwritten "ink bleeding in" style over about 2s, then a red bar follows the text line by line [measured].
  - [tested] Clippings and cards in a Song-style serif; big labels in a heavy sans-serif; numbers in a condensed display face.

## 6. Implementation notes

- Draw every paper piece, photo and clipping once into a cached sprite. Use static grain and noise (including fbm) for texture.
- Hand-drawn circles: densify the points with Catmull-Rom and resample them by arc length.
- On twos: quantise element time to 12fps.
- Tileable paper texture: sample the noise on a torus so it tiles seamlessly, and add fibres.
- Halftone: convert greyscale to 45° dots, batched into one path and filled once.
- Torn edges.
- Hand-drawn lines drawn progressively by length.
- Motion blur: stack frames along the direction of travel.
- Real-material pieces for new films:
  - A print: white border, old-paper colour, shadow, tape, croppable to a focus point.
  - A label: a black torn-edge bar, typed at 12fps.
  - A cover: full-bleed, with a focus point and a push-in, used when hard cutting to live footage.
  - Camera: tracked lateral moves and quick pushes. Photos fill 80-90% of the frame, the camera moves laterally to the next piece in 0.30s, highlights get a 0.28s quick push, and there are no slow pushes.
- Long-tail easing: `(.33,0,.2,1)`.
- Tilted slide-in that flattens; a highlighter band with rough edges in multiply; a red string that sags; desk camera keyframes ending with a push.
- **Key architecture:**
  - Shots on the same desk share one world and one camera. The transition between them simply keeps the same picture, and the pan is done entirely by the camera.
  - A large black card on the desk is a separate shot, reached by a hard cut on the frame where the push fills the screen.
- **Performance:** a sticker edge made of 16 offset draws per frame is the heaviest cost (73/89ms mean/peak per frame in a test). Cache the sticker edge and recompute it only when the pose changes on the 12fps step.

## 7. Reference works and first-hand sources

- Samples A-D as listed at the top.
- First-hand: an interview with the channel's art director; an interview with one of its producers about an episode on the first image of a black hole; sample D's creator's own video on how he makes his maps.
- Second-hand: a stock-media blog tutorial on replicating the channel's motion graphics.
- Facts for the example material: Le et al., ICML 2012.
- Links are omitted in this adaptation.

## 8. The 3 most common mistakes

1. **Everything moving smoothly together at 60fps.** Half the handmade feel of collage comes from the two frame rates: "the camera glides, the elements step". All smooth looks like a corporate promo. All at 12fps makes the camera nauseating.
2. **Faking the grammar with template moves:** torn paper, every image popping in and dropping, paper texture jittering every frame. None of these appear in the measurements. In this grammar photos are simply there on the cut, the paper texture is dead still, and most transitions are hard cuts and pushes. The more showy the entrances, the less it looks like editorial work.
3. **Using the logo yellow as a large background, or spreading too many colours.** The yellow in the films is a `#DACF08`-level highlighter, used only to mark key points. The body is three colours, "black, paper white, one red", plus at most one more accent.

---

## Review notes (an independent reviewer watched only the finished test film: 8/10)

Review comments and the fixes made:
- "The third shot goes pure black; the big desk breaks": make it a large black card lying on the same desk, with the desk's paper texture showing at all four edges. It is still sample A's black-card grammar, but the desk stays continuous.
- "0-0.9s is completely static": the test first added a slow opening push (1.14 -> 1.165). The current approach: put the first event within 0.3s (the photo is there on the cut, and the highlighter or red string starts at once), or open with a 0.17s slam-in.
- "A blurry halftone fills the whole screen for too long": shorten the push from 0.7s to 0.6s and the pull-out from 1.0s to 0.85s. Start the pull-out at z=3.68, so the photo has the same screen width on both sides of the hard cut. Add tape at the same positions on the large image. The hard cut then reads as "swapped for a high-resolution scan".
- "An empty paper strip appears first": make the strip slide in tilted, and start typing earlier, at 0.4s.
- "The hero cuts in from the right, half-body, in one frame": start it 1100px off-screen, so the first 12fps step is still outside the frame.
- "The highlighter hasn't finished when the film ends": move typing, the red circle and the highlighter earlier as a group. The highlighter finishes at 1.8s, then holds for 0.3s.
- "The word in the character's thought is too small": raise it to 40px (at 1080p).
- "The camera is smooth throughout; not enough on-twos": not changed. The research measured exactly "camera smooth at 24fps, elements stepping at 12fps". Stepping the camera as well would go against the measurements.

## QA notes

- **Jump frames during deliberate zooms are expected.** In the test, one run of consecutive jump frames was the 0.6s push into a small photo on the wall (up to 9.6x). Another was the 0.85s "pull out to reveal" right after the hard cut. Both are full-screen zooms, i.e. designed camera moves. The hard cut itself falls on the first frame of the next shot.
- **Still frame pairs come from on-twos.** About 3% of frame pairs were still, from the 12fps element holds. The first version, with a static camera at the opening, measured 16.9%; after the review's "0-0.9s completely static" note, a slow opening push lowered it to 3.1%. A lower number does not mean better: a constant slow push can drive still frame pairs very low and still read like flipping slides. The right fix for a static opening is to make the first event happen earlier. Check it on a filmstrip.
- **The sticker edge is the slowest part.** The shot with the hero sticker was the heaviest of the three (73/89ms mean/peak per frame): 16 offset draws per frame for the white edge, plus the black card's texture. To speed it up, recompute the sticker only when the pose changes on the 12fps step and reuse it on the other frames.
