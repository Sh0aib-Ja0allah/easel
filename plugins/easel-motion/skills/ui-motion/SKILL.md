---
name: ui-motion
description: >-
  Product and web UI motion: micro-interactions (hover, press, toggles), page and view transitions,
  scroll-driven reveals, loaders, staggers and GSAP timelines (tweens, ScrollTrigger, Flip, SplitText,
  React/Vue/Svelte), with prefers-reduced-motion handled and motion quality reviewed on a filmstrip.
  Writes code for the user's own site or app, previews it offline with easel-core and checks it.
when_to_use: >-
  The user asks to "animate this button / card / page", wants a "scroll animation", "micro-interaction",
  "page transition", "loading animation", "hover effect", GSAP, ScrollTrigger, or a review of the motion
  in their UI. For a video or an animated explainer use easel-motion:animate instead.
argument-hint: "[element or page] [the motion you want]"
allowed-tools: mcp__plugin_easel-core_easel__filmstrip mcp__plugin_easel-core_easel__render_video mcp__plugin_easel-core_easel__render_still mcp__plugin_easel-core_easel__qa mcp__plugin_easel-core_easel__craft Read Write Edit Glob Grep
---

# UI motion

Motion in an interface has a job: guide attention, give feedback, show what changed or where
something went. This skill writes that motion into the user's own code, previews it frame by frame
with easel-core's engine, and checks it. `<easel-motion>` means `${CLAUDE_PLUGIN_ROOT}`.

## 1. Read first

- The user's code: framework (vanilla, React, Vue, Svelte, Nuxt), existing animation library,
  design tokens (`--duration-*`, `--ease-*`), and `.easel/brand.md` (its Motion & Interaction
  section) if it exists.
- `mcp__plugin_easel-core_easel__craft` `{"name": "motion"}`: Easel's motion rulebook.
- [ui-patterns.md](ui-patterns.md): durations, easing, micro-interaction, transition, scroll,
  loader, stagger, reduced-motion and performance patterns in CSS and JS.

## 2. Choose the tool

- **CSS first** for state changes on one element (hover, press, focus, toggles, simple enter and
  exit) and for loaders: transitions and keyframes on `transform` and `opacity` only.
- **GSAP** when there is a sequence (a timeline), scroll-driven motion, layout changes (Flip),
  text splitting, SVG morphing or motion paths, or many elements choreographed together. If the
  project already uses another library, keep it. Read the matching reference before writing:

| Need | Read |
|---|---|
| tweens, easing, stagger, `matchMedia`, reduced motion | [gsap/core.md](gsap/core.md) |
| sequences, labels, position parameter | [gsap/timeline.md](gsap/timeline.md) |
| scroll-driven motion, pinning, scrub | [gsap/scrolltrigger.md](gsap/scrolltrigger.md) |
| Flip, SplitText, MorphSVG, MotionPath, Draggable... | [gsap/plugins.md](gsap/plugins.md) |
| clamp, mapRange, snap, toArray, quickTo | [gsap/utils.md](gsap/utils.md) |
| React (`useGSAP`, refs, cleanup) | [gsap/react.md](gsap/react.md) |
| Vue, Svelte, Nuxt and other frameworks | [gsap/frameworks.md](gsap/frameworks.md) |
| jank, layout thrash, will-change | [gsap/performance.md](gsap/performance.md) |

GSAP is installed by the user from npm (`npm install gsap`) under its own license; Easel never
ships it (decision D10).

## 3. Write it

- Durations from ui-patterns.md (100-150 ms for press, 200-300 ms for menus and dialogs, 300-400 ms
  for page transitions); exits 20-30% shorter than entrances.
- Ease-out to enter, ease-in to exit, ease-in-out to move; springs only where the brand is playful.
- Animate `transform` and `opacity`; never layout properties in a loop.
- **Reduced motion:** every animation has a `prefers-reduced-motion: reduce` path (CSS media query,
  or `gsap.matchMedia()`), which removes movement and keeps the state change.
- Clean up (kill timelines and ScrollTriggers on unmount in frameworks).

## 4. Preview and check (offline)

Build a preview page in the job folder `./easel-out/<slug>/` that shows the motion as a paused
timeline the engine can seek, in the HyperFrames composition format: a root element with
`data-composition-id`, `data-duration`, `data-width`, `data-height`, and the timeline registered as
`window.__timelines["<id>"]` (paused). Load GSAP from its usual CDN URL or
`https://easel.local/lib/gsap.min.js`: the engine serves the copy `/easel-core:setup` installed, and
nothing loads from the network. CSS transitions and keyframes are seeked too.
`<easel-motion>/examples/ui-motion/card-reveal.html` is a working example.

1. `mcp__plugin_easel-core_easel__filmstrip` with `count` 8-12 across the motion: check spacing,
   overlap, arcs and the end state. Read the sheet.
2. `mcp__plugin_easel-core_easel__qa` on the page with `mode: "ui"` and `times` at the start, the
   middle and the end (text clipping and contrast are hard gates in UI work).
3. Check the reduced-motion path: `render_still` with `reducedMotion: "reduce"` at `t: 0` and at
   the end time, and `qa` with `reducedMotion: "reduce"`. The end state must be there with no
   movement (both stills show it, or the first already does), and nothing may be hidden for good.
4. Optionally `render_video` for the user to watch.

## 5. Review motion (when asked to review, or before delivering)

Report each problem with where it happens (element, time) and the fix:
- purposeless motion, motion that blocks input, durations outside the ranges above;
- linear easing on anything with mass, the same ease for enter and exit;
- animating `width`, `height`, `top`, `left` or `box-shadow` per frame;
- no reduced-motion path; timelines or ScrollTriggers never killed;
- several things starting at once with no stagger, or a stagger so long the last item lags.

## 6. Deliver

The changed files in the user's project, the preview filmstrip, the `qa` result, and one line on
how reduced motion behaves.
