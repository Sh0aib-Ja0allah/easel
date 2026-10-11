<!-- Easel: translated and adapted from alchaincyf/huashu-art-motion @ 9ff59339f934e08483ba0a5b1db20f4c2c421b35
     (github.com/alchaincyf/huashu-art-motion, references/动画语法/t1_3b1b.md).
     MIT License, Copyright (c) 2026 alchaincyf (花叔 · 花生); full text in NOTICE.md.
     Modified by Easel (2026-10-11): translated to English; replaced the channel, creator and source-repo names and URLs with neutral descriptions; removed the source engine's paths, scripts, function names and demo-render lines; restated the implementation notes without the source's library; renamed the demo shots to Shot 1-3; replaced the network's animal example class with "the target class"; generalised the CJK font notes; wrote the review severity icons as words; pointed cross-references at other grammars by description; paraphrased the creator's quoted words. -->

# Math explainer

> One-line grammar: **On a black background, show only "the one thing being explained right now". Use smooth morphing (Transform) to turn the previous concept directly into the next one. A colour is a concept's name. Almost never cut.**

## Pre-flight checks

1. **For every shot, write down "what turns into what".** Name the object before and the object after (grid -> circle, one curve -> another, pixels -> neurons). If you cannot write that one sentence about the morphing object, do not use this grammar. Switch to kinetic type or whiteboard.
2. **The first frame is the object.** Axes, grids and curves come first. Titles and formulas arrive later. Do not Write a title line at second 0.
3. **Count the text on screen.** At most 2 bullet points on screen at the same time. Before a third one appears, the earlier ones must either turn into a picture or be cleared away. Writing bullets one by one as a list is just a slide deck on black.
4. **Write the colour table first.** One colour per concept. Symbols in the formula share the colour of the matching objects in the picture. At most 4 semantic colours in the whole piece.
5. **Hold still during waits.** No constant slow push, breathing or floating. The camera moves only to look at the next object, and stops when it gets there (see 3, "Camera").

## 1. When to use it

- **Use it** to explain how a mechanism "turns step by step into something else": a neural network forward pass, attention, matrix transforms, gradient descent, probability distributions, algorithm flow. It fits best when the voice-over uses **action sentences** such as "we flatten this image into a column" or "each pixel is multiplied by a weight". Each sentence maps to one Transform.
- **Use it** when the audience needs to "see the math": symbols in the formula map one to one to objects in the picture (the W in the formula is blue, and so are the edges).
- **Don't use it** for product launches or emotional/brand films (white lines on black are too cold and too slow). Don't use it for real data trends (that is the finance chart grammar's job). Don't use it when the voice-over is opinion, story or punchlines (there is nothing to morph, and forcing it leaves only decoration). It also does not suit fast cuts under 8 seconds. The native rhythm is one animation of 1-3 s plus a 1 s hold (see 5). Three shots in 8 seconds is already the limit.

## 2. Composition

| Item | Value | Basis |
|---|---|---|
| Background | **Pure black #000000** | The channel creator's own config file. The "deep navy #0E1525" quoted online comes from marketing blogs, not from the original |
| Saturation | Use the Manim colour constants, then boost the saturation of the whole frame **x1.5** | The creator exports with ffmpeg `saturation=1.5`; the raw values look grey |
| Main colours (raw values; the x1.5 boost is applied on top) | BLUE_C `#58C4DD`, RED_C `#FC6255`, YELLOW `#FFFF00` (the original Manim uses pure yellow, not the community edition's cream `#F7D96F`), TEAL_C `#5CD0B3`, GREEN_C `#83C167`, GREY_A-E `#DDD/#BBB/#888/#444/#222` | Manim `default_config.yml` |
| Colour coding | One colour stands for one concept and never changes during the piece. In the reference piece: **yellow = activation/signal, blue = positive weight, red = negative weight**. In the formula, `a` is yellow and `W`/`w` are blue | The channel's neural-network episode 2 source: positive weights BLUE, negative weights RED |
| Line width | Default stroke 4 (about 4px at 1080p). Axes and network edges 2. Grid major lines 2, minor lines 1 at 0.25 opacity | Manim coordinate systems source |
| Units | Frame height = 8 Manim units -> **1 unit = 135px** | Manim default frame_height=8 |
| Neurons | White stroke 2px. **Fill opacity = activation value**. Radius 0.15 units (about 20px), spacing 0.25 units within a layer. Draw at most 16 per layer; show the rest as a vertical ellipsis plus a brace | The channel's neural-network episode source, part 1 |
| Edges | From circle edge to circle edge. Width `3 * (abs(w)/max)^3` (reference piece: `0.6 + 3.2 * abs(w)^3` px). Positive blue, negative red | Part 2 source |
| Fonts | Formulas in **Computer Modern** (CMU Serif, roman and italic). For CJK text, pair it with a CJK serif (also a serif, with similar stroke contrast) | Creator's config: Text font "CMU Serif" |
| Composition | One subject per screen, centred or left/right symmetric. Title/formula fixed in the top 1/8 (y about 110-150); it does not move with the camera | - |
| Shape language | Circles, grids, straight lines, braces, arrows. **Almost no glow**: the "glow" feeling comes from thin, saturated lines on pure black, not from bloom | Observed in the originals. For emphasis, use Indicate (turn yellow), not a halo |

## 3. Motion

- **Easing**: the default is `smooth = 6t^5 - 15t^4 + 10t^3` (the original Manim version, with zero velocity and zero acceleration at both ends; the community edition uses a sigmoid). **Use it for almost every animation.** Use linear only for Write, constant rotation, and the progress of ShowPassingFlash. Use `there_and_back` for Indicate, and `rush_into`/`rush_from` for "rushing in" and "rushing out".
- **Default durations**: Animation run_time = 1 s, wait = 1 s. Counts of explicit run_time in the creator's 2023-24 source: 2 s is most common (481 times), then 3 s (333), 1 s (187), 4 s (145).
- **LaggedStart**: default lag_ratio 0.05; 0.1 is the most used value in the source. Timing: item i occupies `[i*r, i*r + 1]`, total length `1 + (n-1)*r`. Reference piece: 100 pixels -> neurons with 0.01 (done in 1.1 s), 160 edges with 0.006.
- **Write**: linear. Fewer than 15 sub-objects: 1 s; otherwise 2 s. Lag between sub-objects = `min(4/(n+1), 0.2)`. Each glyph is "outline first, then fill": the stroke is drawn with an advancing line dash, then over the last 60% the fill fades in and the stroke fades out.
- **Transform**: resample both shapes to the same number of points, **align the start points** (both start at the top left and go clockwise), then interpolate point by point along straight lines (path_arc=0), plus colour interpolation. Reference piece: grid square -> circle (pixel -> neuron), and a grid of weights flying into one neuron (weighted sum).
- **Enter/exit**: FadeIn/FadeOut with a shift (24-40px in the reference piece; "from below, upward" or "fade away upward"). Neurons of a new layer fade in from 24px to the right. Things being replaced shrink to a point and merge into the vertical ellipsis.
- **Signal**: ShowPassingFlash (time_width 2). Copy the edge, colour it yellow, line width x1.5. Visible segment `[max(0, u-2), min(1, u)]`, with u going from 0 to 3. Stagger by input row with lag 0.04.
- **Camera**: a moving-camera frame animation. A camera move is an event: hold -> push to the next object to look at -> hold. Pick one of two pushes: the original's single smooth push (about 1 s), or a fast push of 0.28 s that closes in by 18-32% and then stops. A 3D orbit at 0.5-3 deg/s (the original's default is 1 deg/s) is only for explaining spatial relations. In the reference piece, the push toward the output layer (1 -> 1.08) is an event push. The constant slow push around the grid (1 -> 1.025) is the old approach; do not copy it in new work.
- **Still during waits**: the originals are usually **static** during waits. This is the biggest difference from launch-keynote pieces. Do not add constant slow pushes, breathing or floating to fake motion. The energy comes from the next Transform.

## 4. Transitions (4 common ones)

1. **Transform continuity (no cut)**: the last frame of one shot is the first frame of the next. The morph turns the old object into the new one. Reference piece, shot 1 -> 2: 100 pixel squares become a column of input neurons, and the first frame of shot 2 is pixel-identical to the last frame of shot 1. This is the original's number-one transition and covers the large majority of cases.
2. **Zoom through**: the camera pushes in exponentially around an object (`zoom = Z^e`, so the perceived speed is constant). The object's circle becomes an opening with the new picture inside. Parameters: keep the old shot live (it keeps pushing its own camera past its duration and is redrawn as vectors, so it does not blur); `r0` is the object's radius; `zoom >= 1100/r0` (otherwise the opening does not cover the screen and the last frame jumps); `focus` (the new picture's subject first sits in the middle of the opening and only settles into place after e > 0.55). Reference piece, shot 2 -> 3: first outline in yellow the hidden neuron with activation 0.95 ("let's look at this one"), then push into it 48x in 0.75 s.
3. **FadeOut(shift=UP) + FadeIn(shift=UP)**: when changing topic, everything fades away upward and the new content fades in from below.
4. **ReplacementTransform of titles/formulas**: the old formula's symbols move to the positions of the same-named symbols in the new formula (TransformMatchingTex; 2 s by default in the original version). Symbols that do not match fade out and in.

## 5. Rhythm and text

- **Shot length**: the original is made of continuous scenes. A single animation is 1-3 s followed by a 1 s wait. One "shot" (one concept) is often 8-20 s. The 8-second, 3-shot reference piece (2.6/2.8/2.6 s) is a **compressed version**; in real voice-over work, stretch it 2-3x.
- **Sync with the voice-over**: in this grammar **the animations are laid out first and the voice-over is recorded after**, which leaves only a short editing pass. So the sync rule is "one sentence = one animation": the animation starts when the sentence says the action verb, and after the sentence lands, wait about 1 s so the viewer can look.
- **Text**: the title or question is Written before the action (ask first, then show). Formulas appear together with the picture, in the same colours. Numbers (0.95) count along with the fill and never appear ahead of the picture. On screen at most one title line plus one note line.
- **Purpose principle**: every movement on screen is there on purpose and you can say what it explains. Delete any movement that has no explanatory purpose.

## 6. Implementation notes

- Building blocks this grammar needs: a palette plus the x1.5 saturation step; a world-to-screen camera mapping; point resampling for Transform (rectangle points, circle points, morph between point lists, shape drawing); neuron, edge-endpoint and edge drawing; ShowPassingFlash; Indicate; Circumscribe; formula layout plus Write; braces.
- Easing set shared with the other grammars: smooth, the community-edition smooth, there_and_back, rush_into, rush_from, double_smooth, and a lagged-start helper. Numbers need count-up, formatting and tabular (fixed-width) digits.
- Transitions: zoom through and fade-with-shift.
- Let each segment set its own duration in seconds. Turn off any beat-synced camera punch on transitions: an explainer does not want that hit.
- Key parameters: neuron radius 17/22/32px. When you draw a neuron's weights as an image, it must be a **hidden-layer** neuron: its 100 weights can be drawn as a 10x10 image, while an output neuron connects to the hidden layer, not to the pixels (a logic error caught in review). Edge alpha 0.7-0.85. Yellow signal lines 3-4.5px. Write font size 58 (title) / 64 (formula).
- Fonts: subset large CJK fonts to the glyphs actually used (full font 25MB -> 300KB). CMU Serif web fonts come from the open-source cm-web-fonts package as woff files (the path is `font/Serif/`, not `fonts/`).
- Check every shot on a filmstrip before review.

## 7. Representative work and primary references

- Representative work: a well-known math-animation channel's introduction to neural networks (2017), its linear-algebra series, and its 2024 series on transformers.
- The channel's video-source config file (background #000, CMU Serif, saturation 1.5).
- The original Manim library source: default config (colour values), rate functions (smooth and others), creation animations (Write/ShowCreation parameters).
- The channel's 2017 neural-network episode source, parts 1 and 2 (how neurons and weights are drawn).
- Manim Community Edition rate functions (for comparison with the community edition).
- The channel's FAQ ("Avoid pointless animations").
- An interview with the channel's creator (animations are laid out first, the voice-over is recorded after).

## 8. The 3 most common mistakes

1. **Treating "glow" as the signature and adding bloom and a deep-blue gradient background.** The original is pure black + thin saturated lines + x1.5 saturation, with almost no halo. Add a halo and it turns into "techy slides".
2. **Using linear or a generic ease everywhere, with animations that are too fast and too many.** The default must be smooth (the quintic polynomial). One animation takes 1-3 s, then hold 1 s. Every action should match a verb in the voice-over.
3. **Changing the colour coding midway, or using too many colours.** One colour = one concept, and formula symbols share the colour of the objects in the picture. Past 3-4 semantic colours, the audience cannot keep track.

## Reference QA figures (before review)

Measured on an 8-second, 3-shot reference piece in this style. Columns: share of fast-motion frames, share of still frame pairs, isolated jumps, mean/peak render time per frame, deterministic.

| Shot | Motion % | Still frame pairs % | Jumps | Mean/peak ms | Deterministic |
|---|---|---|---|---|---|
| Shot 1 | 1.83 | 17.7 | 0 | 1.5/2.4 | yes |
| Shot 2 | 7.1 | 0.0 | 0 | 2.2/3.1 | yes |
| Shot 3 | 3.26 | 0.0 | 0 | 1.0/2.2 | yes |

## Revision (independent review, one round)

The reviewer watched only the finished piece and raised 2 red (blocking) and 2 yellow (should-fix) issues:

| Review finding | Fix |
|---|---|
| Red - logic error: shot 3 drew the weights of an output neuron (the target class) as a 10x10 pixel template, but the output layer connects to the hidden layer | Push into **the hidden-layer neuron with activation 0.95** instead (the original draws hidden-layer weights as an image in exactly this way). The conclusion "looks like the target pattern, 0.95" now matches that neuron's brightness in shot 2. The formula a^(1) already refers to the hidden layer, so it needs no change |
| Red - the conclusion has no hold: 0.92 is only reached in the last 0.1 s, and the legend fades out early | Move shot 3's whole timeline earlier: count to 0.95 at 1.65-2.0 s, Indicate until 2.3 s, then **hold 0.6 s**. The legend stays until the end |
| Yellow - the hold before the push is too short, and thick edge ghosts linger when the new title appears | Outline the target neuron in yellow for 0.3 s before the push. The old picture outside the opening now clears completely between p 0.45 and 0.8. The new title starts writing at 0.75 s |
| Yellow - 5 concepts crammed into 8 s | Kept 8 s (a task requirement); section 5 states that real use should stretch it 2-3x |

Also: after shot 1 settles, the neurons are drawn as true circles (previously 48-sided polygons), so the last frame of shot 1 and the first frame of shot 2 are **pixel-identical** (measured difference 0).

QA after the revision:

| Shot | Motion % | Still frame pairs % | Jumps | Mean/peak ms | Deterministic |
|---|---|---|---|---|---|
| Shot 1 | 1.9 | 15.8 | 0 | 1.6/2.7 | yes |
| Shot 2 | 8.41 | 4.2 | 0 | 2.1/2.8 | yes |
| Shot 3 | 2.66 | 15.1 | 8 | 0.9/2.0 | yes |

Shot 3's 8 "jumps" fall at local time 1.06-1.23 s (the pixel image slides as a whole onto the weight image) and 1.51-1.54 s (the 100 squares collapse). Checked frame by frame, they are intended large moves, not glitches. The 15% still frame pairs come from the 0.6 s hold at the end (the original's wait, intentional).
