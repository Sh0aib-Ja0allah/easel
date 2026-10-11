---
name: motion
title: Motion rules
applies_to: [motion, video, ui, animation]
version: 1
---
<!--
Adapted for Easel from nexu-io/open-design @ 17e255959703a3fad7c8eb7f7b70dcafccc5629a, craft/animation-discipline.md.
Copyright 2026 Open Design contributors. Licensed under the Apache License, Version 2.0
(licenses/Apache-2.0.txt in this plugin). open-design adapted parts of its craft files from
referodesign/refero_skill @ a9b54a3e62a6391f5f5ab7a20e4ddb32fb79a27d
(refero_skill, Copyright (c) 2026 Refero, MIT; see NOTICE.md).
Modified by Easel (2026-10-11): rewritten in new words and restructured for Easel; extended from
UI to illustration, motion and video; thresholds aligned with Easel's qa tool. Other sources of ideas:
- alchaincyf/huashu-art-motion @ 9ff59339f934e08483ba0a5b1db20f4c2c421b35, scripts/film_gate.py
  and scripts/storyboard_lint.py (MIT): no slideshow films, no blank stretches, a locked shot plan
- cth9191/animate @ 7e5eb56feb2dd573f890e1b7b34748af43d58263 (MIT): cheap check-ins (story, look, storyboard) before rendering
-->

# Motion rules

## Every movement has a job

Motion shows a change of state, directs attention, explains a relationship or sets a rhythm. If
a movement does none of these, remove it.

## UI timing

| Duration | Use |
|---|---|
| 80-120 ms | Press, toggle, hover feedback |
| 150-200 ms | Small state changes (a chip, a checkbox) |
| 200-300 ms | Things entering: menus, dialogs, sheets |
| 300-500 ms | Moves between views, shared-element transitions |
| over 500 ms | Rare; staged sequences only |

- **Ease out** when something enters (fast start, gentle stop); **ease in** when it leaves;
  ease in-out for moves on screen. Linear only for constant motion (spinners, scrolling tickers).
- Exits are shorter than entrances (about 70%).
- Stagger groups by 20-60 ms per item and cap the total stagger at about 300 ms.
- Springs suit direct manipulation (drag, swipe); keep bounce subtle (damping ratio 0.7-0.9).
- Animate `transform` and `opacity`; avoid animating layout properties.

## Video and explainers

- **Plan before rendering.** Lock the beats (`beats.json`), the look and a storyboard, and get a
  check-in on each, before rendering video. They are cheap; renders are not.
- **No slideshow.** Each shot moves inside itself: a camera push, parallax layers, a drawing
  that builds, data that grows. Cutting between still cards is not animation.
- **No dead air.** No still or empty stretch over 2 seconds unless it is a deliberate pause
  that the story needs *(measured: `qa` stillness)*.
- **Reading time wins.** Hold on-screen text for 0.3 s per word plus 1 s; never move text the
  viewer is still reading.
- **One focal motion at a time.** Secondary motion (drift, grain, breathing) stays at low
  amplitude so the eye knows where to look.
- **Cut on action** and on the beat; let `cues.json` carry the shared timing for picture and sound.
- **Overlap and follow-through:** parts of an object settle slightly after the main move; that is
  what makes motion feel physical.
- **Deterministic:** seed every random choice and drive everything from time `t`; renders must
  repeat exactly (see CONTRIBUTING.md).

## Accessibility

- Respect `prefers-reduced-motion` in UI; offer a reduced version of ambient motion.
- Nothing flashes more than three times per second.
