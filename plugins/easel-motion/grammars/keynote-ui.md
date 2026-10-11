<!-- Easel: translated and adapted from alchaincyf/huashu-art-motion @ 9ff59339f934e08483ba0a5b1db20f4c2c421b35
     (github.com/alchaincyf/huashu-art-motion, references/动画语法/t2_keynote_ui.md).
     MIT License, Copyright (c) 2026 alchaincyf (花叔 · 花生); full text in NOTICE.md.
     Modified by Easel (2026-10-11): translated to English; replaced company, product, framework, event, font-brand and book names and the reference URLs with neutral descriptions; replaced the fictional product name in the voice-over example; removed the source engine's paths, scripts, spec fields, function names and demo-render lines; restated the implementation notes and pitfalls without the source's library; renamed the demo shots to Shot 1-3; adapted CJK character-count limits with rough English equivalents; wrote the review severity icons as words; pointed cross-references at other grammars by description. -->

# Keynote UI

> One-line grammar: **One thing per screen. The product itself (screenshot, screen recording, physical object) is the hero. Nouns and numbers land at the moment the voice-over says them. Text is tightly spaced; springs have no bounce or a light bounce.** Light-blob gradient backgrounds, frosted-glass cards, gradient text, centred blur-in and decorative floating are all optional wrapping. Use them sparingly (see "Pre-flight checks").

## Pre-flight checks

1. **This set reads as an AI template more easily than any other.** Light-blob gradient + glass card + gradient text + centred blur-in from nothing + floating cards: put all five together and the audience recognises a template at a glance. Before you start, ask: is there a real product screenshot, screen recording or product photo? If there is, make it full-frame as the main picture and push in to the part being discussed; skip the blobs and glass cards. Of the five wrappings, pick at most two per piece.
2. **Screenshots must be big.** In a shot with a screenshot, the screenshot is at least 80% of the frame width (at least 90% in vertical video). Then push in to the part the voice-over is talking about (a fast push of 0.28 s that closes in by 18-32%, then stop). A small card floating on a big field of blobs is the "dead background" failure. The default treatment: lay the screenshot out full-frame (scaled proportionally, never cropped; pad the surroundings with a darkened, blurred copy of the same image), fast-push to the highlighted part at the moment it is called out, and between two consecutive screenshots pan at the same zoom for 0.30 s. The old glass card should be something you opt into explicitly.
3. **Count the layouts.** Write down the layout of every screen in the storyboard (title screen, three cards side by side, big number, screenshot card). If the same layout appears on 2 or more screens in a row, switch to another: a screenshot push-in, a number slam, a before/after. Looping "title -> three feature cards -> big number" through the whole piece is a flip-through slide deck.
4. **Hold after landing.** No floating cards, no constant slow push to fill pauses. Put the next action at the moment the voice-over says a noun or a number. When the number is about the screenshot just shown (a ratio of two timings, this page's conclusion), lay it over the screenshot: the camera pulls back to the whole screenshot, the screenshot darkens, and the number slams down on top. Do not cut to a separate screen on a blob background.
5. **Colours follow the product.** Take the background and accent colours from the product's own brand colours. Do not default to purple-blue-cyan blobs. For bad news, serious events or non-launch topics, do not use this dark launch background.

## 1. When to use it

- **Use it** for product/feature launches, version updates, "three new features", price and spec announcements, opening brand films, and the "what is this product" section of a video. It fits best when the voice-over is **noun + number** ("Model 2", "320 ms latency", "1 million tokens"): one sentence per screen, text surfaces as the noun is said, the number lands as it is said.
- **Use it** when a UI screenshot needs explaining: the screenshot goes full-frame and the camera pushes in to the part being discussed. Putting it in a glass card or turning it face-on in 3D is optional wrapping; use it sparingly.
- **Don't use it** to explain how a mechanism works (glass and blobs carry no logic; use the math explainer grammar). Don't use it for data trends (use the finance chart grammar). Don't use it for serious incidents or bad financial results (this visual language carries built-in "good news" emotion). Don't use it when the content has no "hero" that can be enlarged (only empty blob shots would remain). For popular science, stories, news and other non-launch topics, do not treat this background as a generic template.

## 2. Composition

| Item | Value | Basis |
|---|---|---|
| Background | Near black: reference piece `#050508`; a large consumer-tech maker's site `#000/#161617/#1d1d1f`; a project-management software site `#08090a` (next level up `#0f1011/#141516`, body text `#f7f8f8`, stroke `#ffffff14`) | Measured from both sites' CSS |
| Light blobs (optional, use sparingly) | 4 radial gradients combined with a screen blend -> blur 90px at 1/4 size -> scale up to fill the frame -> add 3.5% static grain against banding. Hues follow a payments company's palette: purple `(150,90,238)`, blue `(56,104,255)`, cyan `(120,214,255)`, a touch of warm red `(255,96,84)`. In the centre, lay a 38% black radial gradient so white text has contrast | That company's 2021 site gradient `#a960ee #ff333d #90e0ff #ffcb57` |
| Blob motion (optional) | Each blob drifts with an amplitude of 90-260px and a period of 9.5-13 s. **Avoid a 5 s period** (guidelines: avoid sustained oscillation around 0.2 Hz) | A major platform's human interface guidelines, Motion |
| Glass card (optional, use sparingly) | Sample the background and blur it 40px (the consumer-tech site's navigation uses `saturate(180%) blur(20px)`; UX research says bigger is better) + 7.5% white fill + a 14% white gradient light band at the top + a 1.5px gradient stroke (light at top left, dark at bottom right) + a large shadow (blur 70-80, y +30-40, alpha 0.5) | That site's global header CSS; a UX research firm's article on glassmorphism |
| Corner radius | Cards 36px. **Concentric radii**: inner icon background radius = 36 - padding 14 = 22 | A 2025 platform design talk: "child radius = parent radius - padding" |
| Fonts | Inter (the closest open-source match to the common system UI font; the project-management site uses Inter); a CJK sans for CJK text. Titles at weight 600, **tighten letter spacing on large sizes to -0.02 to -0.03em** | Measured on three product sites: 96px at -0.015em, 64px at -0.022em, 64px at -0.03em |
| Text hierarchy | Primary white `#f5f5f7`, secondary `rgba(235,235,245,.6)`, eyebrow `#a7a7b4` (letter spacing +6px). The product name may use a horizontal white -> pale purple -> pale cyan gradient (optional, use sparingly: gradient text together with blobs is a template) | Hierarchy convention on a consumer-tech site |
| Composition | One focus per screen. With a screenshot, it goes full-frame (width at least 80%) and the camera pushes in to the part discussed. Centred, symmetric three cards side by side (equal width 480, gap 52) only for feature lists with no screenshot. A big number takes more than 55% of the frame width | - |
| Shape language | Rounded rectangles, pills, thin line icons (round caps, uniform stroke, system-icon feel) | - |

## 3. Motion

- **Springs (the main tool)**: parameterised by duration + bounce, as in a native UI framework: mass = 1, stiffness = (2π/d)^2, damping = 4π(1 - bounce)/d, so the damping ratio ζ = 1 - bounce. **Default bounce is 0** (the most general). 0.15 is crisp and barely bounces (reference piece: card entrance d = 0.75, bubbles d = 0.5). 0.3 bounces visibly. Above 0.4 is exaggerated for UI. The framework's smooth, snappy and bouncy presets all use d = 0.5.
- **Curves (non-spring)**: the consumer-tech site's navigation uses `.32s cubic-bezier(.4,0,.6,1)`. The reference piece's text surfacing uses CSS `ease` = `(.25,.1,.25,1)`. The project-management site mainly uses ease-out-quad `(.25,.46,.45,.94)` at .16s. The payments company recommends under 500 ms and `(.2,1,.2,1)`. A general cubic-bezier function covers all of these.
- **Text entrance** (centred blur-in is optional; use it sparingly, because every screen surfacing this way becomes a template): blur 18-26px -> 0, rise 16-40px -> 0, opacity -> 1, over 0.7-1.0 s. Eyebrow -> product name -> subtitle, staggered by 0.2-0.4 s.
- **Card entrance**: from 170px below, rotated around the Y axis by ±0.55 rad (about 31°, side cards facing outward), scale 0.9 -> spring into place. Three cards staggered by 0.1 s. Do the 3D with vertical-strip slice perspective (perspective 1800px; the payments site uses 600, the project-management site 1000).
- **Camera and holds (pulse rhythm)**: hold after landing; no decorative floating, no constant slow push to fill pauses. Put camera moves at the moment the voice-over says a noun or a number: a fast push of 0.28 s that closes in by 18-32%, then stop (on the part of the screenshot being discussed); a pan at the same zoom for 0.30 s to the next part; a number or big text slams in over 0.17 s (scale 1.55 -> 0.94 -> 1.0). Hold for as long as the voice-over needs. A 7px card float and a constant camera push of 1 -> 1.045 are the old approach; do not copy them in new work.
- **Counting**: starts 0.25 s after the card lands and runs for 0.9 s. Count each number only once: when the card expands to full screen, keep showing "1M" and do not recount from 0. Use easeOutExpo (the CountUp.js default easing), so the last digit settles slowly. Lay digits out **tabular** (fixed width): a canvas cannot turn on `tnum`, and without it the digits jitter.
- **Light sweep**: a band slanted at -20°, 110-140px wide, sweeps across in 0.8-0.9 s. On offscreen text use `source-atop` compositing (light only on the glyphs); on cards use `lighter`. For three cards, compute each card's progress from its screen position, so it reads as one single sweep.

## 4. Transitions (5 common ones)

1. **Blur push**: the old picture shrinks to 0.92 + blurs 24px + fades out; the new picture comes in from 1.06 with blur and lands at 1.0, sharp, over 0.55 s with `ease`. **First lay down a heavily blurred copy of the old picture scaled to 1.08 underneath**, so the shrinking picture does not reveal black edges. Reference piece: shot 1 -> 2.
2. **Shared-element expand**: (load the new picture **opaque** into the card from its very first frame: the card is translucent, so any cross-fade would show the old and new text overlapping.) The selected card (first enlarged to 1.06, while the side cards recede and dim to 45%) expands from its own screen rectangle to full screen, corner radius 38 -> 0, spring d = 0.55 bounce 0. The new picture starts scaled to the card's size, inside the card. **The selected card stops floating before it expands**, so the transition starts from a stable rectangle. Reference piece: shot 2 -> 3.
3. **Match cut**: the same object in the same position in both shots (product name -> card title position).
4. **Mask wipe / light-sweep cut**: swap the picture behind a passing band of light.
5. **Refraction instead of cross-fade** (from a recent glass-material design language): elements leave by gradually changing their refraction/blur strength, rather than just lowering opacity. (The reference piece's blur-in text follows this idea.)

## 5. Rhythm and text

- **Shot length**: in a keynote talk, one screen often lasts 5-8 s (a famous 2007 phone launch keynote: 9 screens in 70 seconds, about 7.8 s per screen). Fast-cut product films: 1.5-3 s. Reference piece: 2.6/3.0/2.4 s.
- **One thing per screen**: one noun, one number, one card. After a dense passage, put in an empty screen so the audience can breathe (what presentation-design writing calls a counterweight).
- **Sync with the voice-over**: text starts surfacing 0.2-0.3 s before the noun is said (surfacing itself takes 0.7 s, so it is sharp right when it is said). A number **lands** at the moment the voice-over says the value: count start = moment the number is spoken - count duration. Three cards enter one after another to match "first, second, third".
- **Text**: title at most 6 CJK characters (about 2-3 English words) or one product name. Subtitle: one sentence of at most 16 CJK characters (about 8 English words). Card: a 4-character title (CJK; one or two English words) + one line of description + one big number + unit (one size smaller and one grey step lighter).

## 6. Implementation notes

- Building blocks this grammar needs: a light-blob background; a grain texture; a blurred backdrop copy (sampled by glass cards); shadow-only drawing; the glass card; the light sweep (with its composite mode as a parameter); pseudo-3D rotation around the Y/X axis by slicing; line icons; rounded-rectangle paths; a scratch canvas.
- Motion: springs (generic, smooth, snappy, bouncy), cubic-bezier curves, and a float helper (old approach only). Text and numbers: count-up, tabular digits, blur-in text.
- Transitions: blur push and shared-element expand.
- Performance: draw the blobs once per frame (at 1/4 size) plus one blurred background copy. This averages 40-60 ms per frame (including a GPU flush); 8 seconds at 60 fps renders in about 1 minute.
- Pitfalls:
  1. **Blur pulls transparent pixels in from outside the canvas.** Drawn into an offscreen canvas that is never cleared, it accumulates frame by frame and breaks determinism. First lay an unblurred copy underneath.
  2. Adjacent perspective slices that overlap by 0.75px produce stripes on translucent textures. Snap slice boundaries to whole pixels, end to end, draw them into an offscreen canvas first, then composite the whole thing back with alpha.
  3. A sweep helper that sets its own composite mode internally overrides an outer `source-atop`, so make the composite mode a parameter.
- Check every shot on a filmstrip before review.

## 7. Representative work and primary references

- Representative work: a large consumer-tech maker's phone and AI-feature launch films and product pages; an AI lab's model launch videos; a project-management software company's website and release videos; a payments company's 2020-21 website gradients.
- A 2023 platform developer talk on animating with springs (duration/bounce).
- A 2018 platform developer talk on designing fluid interfaces (start from 100% damping).
- A 2025 platform developer talk introducing a glass material.
- The platform's human interface guidelines: materials, motion, typography.
- A UX research firm's article on glassmorphism.
- An archived 2021 snapshot of the payments company's homepage (gradient colour values).
- The payments company's engineering blog post on its front-end experience (under 500 ms, curves).
- The project-management company's article on redesigning its UI (LCH colour, Inter).

## 8. The 3 most common mistakes

1. **Nothing behind the glass.** Frosted glass only blurs what is behind it. "Glass" on a flat dark background is just a grey rectangle. First paint colourful, varied blobs, then sample and blur them at the card's screen position.
2. **Springs too bouncy, too much moving.** Bounce defaults to 0; entrances use at most 0.15-0.3. Above 0.4 it looks cheap at once. Move only one group of things at a time.
3. **Large text not tightened; muddy blob colours.** At 64px and above, use -0.015 to -0.03em. Give each blob colour its own area (screen blend + large blur). Do not average several colours linearly into a grey-purple mud.

## Reference QA figures (before review)

Measured on an 8-second, 3-shot reference piece in this style. Columns: share of fast-motion frames, share of still frame pairs, isolated jumps, mean/peak render time per frame, deterministic.

| Shot | Motion % | Still frame pairs % | Jumps | Mean/peak ms | Deterministic |
|---|---|---|---|---|---|
| Shot 1 | 0.58 | 35.4 | 0 | 39.8/51.4 | yes |
| Shot 2 | 2.62 | 8.5 | 0 | 60.2/65.0 | yes |
| Shot 3 | 1.84 | 9.6 | 0 | 44.3/51.0 | yes |

Note: shot 1's 35% still frame pairs come from the reference piece's blob drift and its 4.5% constant push (the old approach). The change per frame stays below the QA pixel threshold (more than 12 levels). Comparing two frames 1 second apart (1.6 s vs 2.6 s in the piece), 26.8% of the pixels change by more than 12 levels and 78% by more than 4 levels. A high or low still-frame-pair figure says nothing about quality on its own: a pulse-rhythm piece is right to hold still for long stretches, while a piece that drifts slowly and constantly has very few still pairs and still looks like flipping slides.

## Revision (independent review, one round)

| Review finding | Fix |
|---|---|
| Red - at 2.55-2.75 s and 5.6-5.85 s the transitions show black edges | Underlay the blur push and the shared-element expand with a copy of the old picture scaled to 1.08 and blurred 30px |
| Red - when the card expands, the "long-term memory" label and the "1M" figure show double; after expanding, the count restarts from 0 | Load the new picture opaque into the card from its first frame. The full-screen page keeps the same "1M tokens" figure and does not recount |
| Red - at 6.95 s the count jumps in one frame from 999,023 to 1,000,000, and "tokens" gets squeezed | The duplicate count is gone with the previous fix. The unit is laid out using the measured widths of the three parts and no longer butts against the number |
| Yellow - the end card is on screen for only 0.4 s, and at y about 1020 it is outside the safe area | The end card surfaces at 1.2-1.8 s and holds 0.6 s, at y = 972. The conversation panel moves up 65px |
| Minor - the card shows the short form "1M" while the full-screen page shows "1,000,000" | Unified on the short form |

QA after the revision:

| Shot | Motion % | Still frame pairs % | Jumps | Mean/peak ms | Deterministic |
|---|---|---|---|---|---|
| Shot 1 | 0.58 | 35.4 | 0 | 39.5/51.6 | yes |
| Shot 2 | 2.62 | 8.5 | 0 | 57.2/59.9 | yes |
| Shot 3 | 0.97 | 15.4 | 0 | 43.0/48.7 | yes |

(Transition smoke test: the blur push is slowest at about 137 ms per frame, including two full-screen blurs.)
