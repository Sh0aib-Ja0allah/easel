<!-- Easel: translated and adapted from alchaincyf/huashu-art-motion @ 9ff59339f934e08483ba0a5b1db20f4c2c421b35
     (github.com/alchaincyf/huashu-art-motion, references/动画语法/y6_presenter_explainer.md).
     MIT License, Copyright (c) 2026 alchaincyf (花叔 · 花生); full text in NOTICE.md.
     Modified by Easel (2026-10-11): translated to English; dropped the source's reference-film paths, helper function
     names, frame-prep script and QA script names; restated engine-specific notes as general rules. -->

# Presenter explainer

A cartoon presenter links information across paper surfaces, charts and key words. It suits business history, how a product works, and knowledge explainers with emotional reactions. There is no ready-made parametric clip and no character sprite for it: supply your own presenter frames and voice-over.

## Pre-flight checks

- Assign a layout to each shot in the storyboard first: side-on presenting, full-screen number, left/right comparison, the presenter stepping into the chart, reaction close-up. Don't fix "presenter left, chart right" for the whole film.
- Prepare frames in at least two shot sizes: full body and bust. Sitting and leaning need real matching frames.
- In each segment, set the presenter's position (`x`) and scale (`s`) explicitly on the first keyframe, so values carried over from the previous segment can't cause regressions.
- Multiply nested opacity (`*=`) instead of overwriting it, so an outer fade still applies.
- The year in the top bar, the subtitles and the section titles all read from the same time source.
- From the first draft, check text framing on a filmstrip. For a final cut on a light background without subtitles, also check the bottom caption zone separately.

## Frames and motion

The presenter uses generated frames; code controls the foot anchor, position, size and frame changes. Hard-cut between poses with a slight pop; never cross-dissolve, because two different outlines blending make a double image. Switch between talking and closed-mouth frames with the voice-over timing; stop the mouth during pauses. Walking uses full walk-cycle frames. Normalise pose heights to the median. Reaction close-ups use bust frames; don't blow up a full-frame image.

A number lands when the voice-over says it. While it counts up, don't show claims like "over" or "+" early; the emphasis circle appears after the number has landed. Plan the pause after a highlight at the script and voice-over stage.

## Implementation notes

You need helpers for: a presenter frame (pose, mouth state, foot anchor), drawing the figure, a top-bar HUD, year-at-time lookup, a pop-in, and a cast timeline of presenter keyframes. Prepare frames by cutting them out and marking each frame's foot anchor. Use a page-turn transition that turns only the page: the presenter and the top bar stay continuous across pages.

Known limits: the presenter covering text, and the presenter being cropped by a push-in, still need a human look at the filmstrip. A push-in done by scaling a whole rendered frame as a bitmap crops easily; new films should use a scene camera instead. Supply your own assets and voice-over; this card is not a complete film template.
