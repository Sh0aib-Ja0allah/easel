<!-- Easel: translated and adapted from alchaincyf/huashu-art-motion @ 9ff59339f934e08483ba0a5b1db20f4c2c421b35
     (github.com/alchaincyf/huashu-art-motion, references/动画语法/t3_finance_chart.md).
     MIT License, Copyright (c) 2026 alchaincyf (花叔 · 花生); full text in NOTICE.md.
     Modified by Easel (2026-10-11): translated to English; replaced publication, news-channel, data-terminal, charting-tool and font-brand names with neutral descriptions; dropped reference URLs that carry brand names (kept academic citations, with DOI/arXiv ids); removed the source engine's paths, scripts, spec fields, CLI flags, function names and demo-render lines; restated the implementation notes without the source's library; renamed the demo shots to Shot 1-3; wrote the review severity icons as words; pointed cross-references at other grammars by description. -->

# Finance chart

> One-line grammar: **Build the axes first, then let the data "grow", and finally annotate just one thing. One colour tells the hero's story; the rest go grey. Values are always honest (bars start at 0; unit and source are written on the chart). Animation decides only "how it appears", never "how much it is".**

## Pre-flight checks

1. **For each chart, first write down its "one thing".** The title is that conclusion sentence, and the annotation marks only that. If you cannot write the sentence, do not make the chart: use one big number or another grammar instead.
2. **Figures must be derivable from each other.** A multiple in the title must be computable from the numbers on the chart (write a / b in the annotation). The same number must match across shots. Keep "grew to" and "grew by" apart.
3. **Time the data's growth to the word in the voice-over.** For a bar chart, use several bar cues, each tied to particular bars, so each bar grows only when it is named. Do not put the title up at second 0 and then grow everything in one go.
4. **Hold after landing.** Hold at least 0.5 s after the numbers land; no constant slow push. To look at a detail, at the moment the voice-over points to it, do a fast push of 0.28 s that closes in by 18-32% and then stops, or zoom through to that point.
5. **Do not use the same layout for more than 3 charts in a row.** Thin accent rule + title + chart three times in a row is flipping through a report. In between, insert a push into a detail, a slammed big number, or a cut back to real footage.
6. **Keep the chart inside the film's world.** A chart shot's background stays in the same colour family as the shots around it: in a dark film, use a dark chart theme, or set the chart background to the film's background colour (switching to light text on a dark background). Use a white report-style background only in films that are already white paper or web pages. Better still, draw the chart onto an object in the film's world: render it with a transparent background and composite it onto a screen, a blackboard or a sheet of paper in the scene. A sudden white line chart with a fixed title bar in a night-scene film gets flagged in review as "disconnected from the rest of the film".

## 1. When to use it

- **Use it** for growth in revenue, profit or users; stock price trends; market share ranking changes (bar chart race); regional comparisons (map shading); the turning point before and after an event. Use it when the voice-over contains **specific numbers, times and comparisons** ("up to 8.7x in five years", "after March 2023").
- **Use it** for sections that need to be "credible": viewers will screenshot, share and nitpick.
- **Don't use it** when there is only one number (just show a big number with the keynote UI grammar's count-up). Don't use it when the data is unreliable or you are unwilling to cite a source (better to make no chart). Don't use it to explain principles (use the math explainer grammar).

## 2. Composition

| Item | Value | Basis |
|---|---|---|
| Background | White `#FFFFFF`, or a warm paper `#F7F3EC`. In dark films use a dark theme (`#0E1116` background, light text, cyan main bars) | Common practice in published chart style guides |
| Layout | **Thin accent rule at the top (6px, your piece's accent colour) + bold title (one conclusion sentence) + subtitle (metric, unit) + source at the bottom left.** Pick your own accent; don't recreate a publication's rule-and-tag mark | Common layout in published chart style guides |
| Main palette | Accent `#2F6FDE`, teal `#2BA59A`, amber `#E8A33D`, coral `#E2674A`, plum `#7A5BA8`, grey `#7C8A96`, ink `#15181C` | Easel's own palette: distinct in hue and lightness, readable for most colour-vision types |
| Emphasis | **One colour for the hero; the rest turn light grey** (reference piece: the last bar keeps the accent, the others transition to `#C6D2D8`) | A charting tool's guidance: "use grey to push back secondary data" |
| Grid | Horizontal gridlines only, thin and grey (reference piece: alpha 0.13, 1.5px). **Only the zero baseline is a solid black line** (3px). Y-axis tick values sit on the right, above the gridlines | Style guide |
| Fonts | A condensed sans for numbers (the reference piece uses Roboto Condensed) + a CJK sans for CJK text. Title weight 700, subtitle and axes 400. Axis text is the smallest; the source line is smallest and lightest (75% black) | Same |
| Up/down colours | **Mainland China A-shares: red up, green down** (reference piece). Hong Kong, Europe and the US: green up, red down. For Chinese-speaking audiences you must state "red up, green down" on the chart. Colour-blind-friendly alternative: blue/orange + ▲▼ symbols | Jiang et al. 2014 (JBDM); a financial data terminal's colour-blind mode |
| Line width | Main data line 5px (reference piece), moving average 4px, annotation leader 2px | - |
| Shape language | Rectangular bars, line + end dot, candlestick bodies + wicks, small dot + leader annotations | - |

## 3. Motion

- **Order (staging)**: layout 0-0.5 s -> gridlines drawn one by one from left to right (lag 0.12, easeOutQuint) -> x-axis labels fade in and rise in turn -> data -> emphasis colour change -> annotation. Each stage takes about 0.5-1.3 s. Heer & Robertson 2007: stage complex changes, always ease in and out, and let each step take "as long as it needs", about 1 s. Axes before data is industry convention (there is no empirical study, but it lets viewers learn the "ruler" before they see the "amount").
- **Bars**: grow from the 0 baseline with easeOutQuint, staggered (lag 0.22, 1.3 s in total). Value labels ride the bar tops and count up in sync.
- **Lines**: advance by **x (time)**, not by arc length. Time flows evenly, so steep segments naturally draw faster and a "surge" reads as one. A 9px head dot + price label follows the head (tabular digits). Area gradient alpha 0.14 -> 0. Reference piece: 1.5 s, smooth (the last price "lands" on the dot). The official D3 example uses 5000 ms linear, which suits a standalone chart; in video, compress to 1.5-2 s.
- **Annotation**: triggered at the moment the line head **passes** the event point (compute the hit time from the inverse of the easing). The dot pops (spring d 0.45 bounce 0.25) + one pulse ring -> 0.12 s later the leader draws -> 0.3 s later the text fades in. **Annotate only one thing per shot.**
- **Candlesticks**: appear one by one (lag 0.06, over 0.2-1.3 s). The body grows from the open price to the close price, and the wick unfolds after it. Volume bars move in sync. The price at the top right rolls with "the most recent candle", coloured by its rise or fall relative to the start of the range.
- **Numbers**: count-up with easeOutExpo (CountUp.js defaults to 2 s; in video use 0.9-1.3 s). All rolling numbers use tabular digits to prevent jitter.
- **Camera (pulse rhythm)**: once the chart lands, the camera holds; no constant slow push. Put camera moves at the moment the voice-over points to a data point: a fast push of 0.28 s that closes in by 18-32%, then stop, or a pan at the same zoom for 0.30 s to the next group of data. During a push transition the camera keeps pushing in vector space (it does not scale up a bitmap). A constant push of 1 -> 1.03 per shot is the old approach; do not copy it in new work.
- **Ranking race (not used in the reference piece)**: the official D3 bar chart race uses 250 ms per keyframe, 10 linearly interpolated frames between keyframes, and shows 12 bars. A position swap takes about 0.5 s. Stagger rank changes so the bars do not all jump up and down at once.

## 4. Transitions (5 common ones)

1. **Panel slide push**: the new panel pushes in from the right while the old one pushes out to the left, led by a vertical accent bar, 0.5 s, `cubic-bezier(.7,0,.2,1)`. Reference piece: shot 1 -> 2. The new panel starts building its layout while it slides in (accent rule grows, title surfaces).
2. **Zoom into a detail (zoom through, with the old shot kept live)**: the camera pushes in 6x around the latest data point (the old shot redraws itself as vectors). The new picture (the last 20 days of candlesticks) dissolves in from 0.6x, with its subject (the latest candle) aligned with the push point. Reference piece: shot 2 -> 3. When there is no circular opening, make sure the new picture's background fills the frame from the start; otherwise the new picture looks like a small card floating in the middle.
3. **Morph between charts**: the same data in a different form (bar -> dot -> line). Move into place first, then change shape (Heer & Robertson: scatter -> bars moves sideways first, then morphs; stacked -> grouped changes width first, then drops). **Do not morph between different metrics** (revenue bars turning into a stock price line implies the two share units).
4. **Axis rescale**: when the data range changes, change the scale first (old ticks fade out, new ticks fade in), then move the data.
5. **Hard cut, layout fixed**: same layout, new chart. The accent rule and title stay in place; only the content changes. This is the most common transition in news chart videos.

## 5. Rhythm and text

- **Shot length**: 2.5-6 s per chart. The reference piece's 2.8/2.7/2.5 s is a compressed version (in real use, one chart goes with one or two sentences of voice-over). Narrative structure: Establisher -> Initiator -> Peak -> Release (Amini et al. 2015, a study of 50 professional data videos).
- **Sync with the voice-over**: a number **lands exactly as it is spoken**. The bar finishes growing and its label stops at 107.9 at the moment the voice-over says "one hundred seven point nine" (in the chart's unit). The annotation pops when the line head passes the event, matching "after the large model launched in March 2023". So fix the voice-over timing first, then work backward to the animation start times.
- **Text**: the title states the conclusion ("Revenue grew to nearly 9x in five years". **"Grew to", not "grew by"**: 8.7x means rising to 8.7 times the original, which is an increase of 7.7x; review caught this once). The subtitle states the metric and unit ("annual revenue, 100 million CNY"). The multiple must be computable from the numbers on the chart (107.9 / 12.4 = 8.70). If the axis does not start at 0, say so in the subtitle ("y-axis does not start at 0"). The source goes on one line at the bottom left. Fictional data carries an "illustrative data" badge at the bottom right in every shot.

## 6. Implementation notes

- Building blocks this grammar needs: a linear scale with an inverse; tick generation (steps of 1/2/2.5/5 x 10^k); gridlines drawn one by one, with a bold zero line and tick values on the right; x-axis labels; bars (grow from 0 + synced count-up + highlight/grey-out); lines (advance by x, head dot, area fill); a y-at-x lookup; candlesticks (up/down colours configurable); callouts (dot -> leader -> text); the small red tag; the "illustrative data" badge; hex colour mixing.
- Motion: a lagged-start helper, quintOut and expoOut easing, a spring (for the annotation dot); count-up, tabular digits and number formatting.
- Transitions: panel slide push and zoom through (old shot live, background fill, focus point).
- Generate fictional data from a fixed seed so it is reproducible.
- Event trigger time: `tHit = start + duration * smooth^-1(event x fraction)` (invert the easing by bisection). The annotation then always stays in sync with the line head, and changing the line's duration needs no hand-tuning.
- Check every shot on a filmstrip before review.

## 7. Representative work and primary references

- Representative work: a major economics weekly's web charts and videos; a financial newspaper's charts; the data segments of a financial news channel's original documentaries and explainers; bar chart races made with a data-visualisation tool.
- The economics weekly's 2017 chart style guide.
- The financial newspaper's open-source colour palette source.
- Heer & Robertson 2007, "Animated Transitions in Statistical Data Graphics": https://idl.cs.washington.edu/files/2007-AnimatedTransitions-InfoVis.pdf
- The official D3 "bar chart race, explained" example.
- Correll et al. 2020 (the exaggeration effect of truncated axes; axis-break marks do not rescue it): arXiv:1907.02035
- A charting tool's articles: why column and bar charts start at zero; dual axes; colour blindness.
- Cultural differences in red/green for up/down (Jiang et al. 2014): doi:10.1002/bdm.1800
- CountUp.js (easeOutExpo, 2 s default).

## 8. The 3 most common mistakes

1. **Truncated axes.** Bar charts always start at 0. Line and candlestick charts may start elsewhere, but must say so on the chart. A lie factor (effect shown on the chart / effect in the data; Tufte 1983) outside 0.95-1.05 counts as distortion.
2. **Too many colours; everything is the hero.** One colour tells the story; the rest go grey. State what red and green mean for your audience (A-shares: red is up; Europe/US: red is down).
3. **Animation too fancy to read the numbers.** No bouncing bars, 3D bars or spinning pies. Stage it, ease in and out, about 1 s per step. Hold at least 0.5 s after numbers land so people can read them.

## Reference QA figures (before review)

Measured on an 8-second, 3-shot reference piece in this style (all data fictional). Columns: share of fast-motion frames, share of still frame pairs, isolated jumps, mean/peak render time per frame, deterministic.

| Shot | Motion % | Still frame pairs % | Jumps | Mean/peak ms | Deterministic |
|---|---|---|---|---|---|
| Shot 1 | 1.39 | 0.0 | 3 | 1.3/1.9 | yes |
| Shot 2 | 2.37 | 4.7 | 0 | 1.9/2.8 | yes |
| Shot 3 | 0.96 | 0.0 | 0 | 1.6/2.3 | yes |

Note: shot 1's 3 "jumps" fall at local time 2.10/2.20/2.27 s, exactly the frames where four bars turn from blue to grey at once (highlighting the hero) and the annotation pops. This is an intended large-area change, not a glitch.

## Revision (independent review, one round)

| Review finding | Fix |
|---|---|
| Red - the title "grew by nearly 9x" conflicts with the 8.7x annotation (it should be "grew to") | Changed to "Revenue grew to nearly 9x in five years". The stock price page uses the same wording: "grew to 7.5x" |
| Red - the monthly line ends at ¥268, which does not match the daily candlesticks' 286.40 (and the push targets exactly that point) | Monthly line end = latest price 286.4; the second-to-last month's close = the daily candles' starting point 242. **Numbers across two shots must be derivable from each other** |
| Yellow - at 5.6 s, "¥268" and the counting price show as two big red numbers on top of each other | The stock price head label is cleared within 0.2 s of the push transition starting |
| Yellow - the "Volume" label overlaps the candles, and the volume bars touch the 240 gridline | Label moved to the empty bottom-right area. Volume bars normalised to the maximum volume, with a 6px gap |
| Yellow - the daily candlestick page cannot be read in 2 s | Removed the 5-day moving average. Candles finish in 1.3 s, the bracketed note lands at 1.75 s, then hold 0.75 s |
| Minor - red-up/green-down clashes with the brand red | Kept (the audience follows A-shares). The subtitle says "red up, green down (A-share convention)". For an international version, switch to green up or to blue/orange |

QA after the revision:

| Shot | Motion % | Still frame pairs % | Jumps | Mean/peak ms | Deterministic |
|---|---|---|---|---|---|
| Shot 1 | 1.44 | 0.0 | 3 | 1.3/1.7 | yes |
| Shot 2 | 2.45 | 4.7 | 0 | 1.9/2.6 | yes |
| Shot 3 | 0.91 | 0.0 | 0 | 1.7/2.9 | yes |
