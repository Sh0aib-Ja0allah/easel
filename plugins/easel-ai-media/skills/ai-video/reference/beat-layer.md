<!-- Easel: adapted from Alisa0808/vox-director @ 6a85a7c341610442a6a5b1885e6e0217ab82a11f
     (github.com/Alisa0808/vox-director, references/beat-layer.md), MIT License, Copyright (c) 2026 Alisa Qian;
     see NOTICE.md. Modified by Easel (2026-10-11): story beats moved to easel-core beats.json and the per-beat and per-shot fields to the job's video-plan.json; tokens changed to kebab-case; brand-framework arc renamed customer-hero; person, studio and channel names removed; source URL list replaced by a one-line framework credit; cadence rules from the source SKILL.md folded in; ASCII punctuation. -->

# Beat and shot layer: narrative arc and per-shot spec

The counterpart to [prompt-guide.md](prompt-guide.md) (the look and theme layer). This covers
the **beat layer**: the narrative skeleton across the whole film, plus the per-shot spec (shot
size, camera move, element motion). One poster per shot; a beat is one narration line with one
or two shots.

## Where the beats live

Two files in the job folder `./easel-out/<slug>/`:

- **`beats.json`** is the story: the single source of truth for what happens when. It is
  written in the easel-core `brief` skill (check-in 1) and validated with
  `mcp__plugin_easel-core_easel__validate` `{"kind": "beats", "file": "..."}` (load the schema
  with `{"kind": "beats", "schema": true}`). Each beat has an `id`, `text`, `visual`,
  `durationSec` and `approval`; the film has an `arc` and `totalSec`.
- **`video-plan.json`** is the ai-video skill's own plan: the look and the per-beat and
  per-shot fields the image and video prompts need. Its beat ids are the `beats.json` ids. The
  ai-video `SKILL.md` is authoritative for the exact shape; this file explains the fields.

Three tiers, three control methods:

- **Narrative arc:** pick from the library below (recommend one from the topic); the **user
  confirms**. It goes in `beats.json` `arc`.
- **Per-beat narration, headline and scene:** drafted from the topic; the **user approves or
  edits** each beat (`approval: "approved"` in `beats.json`). This is the mandatory story gate.
- **Shot size and camera move:** derived from rules (arc position plus anti-monotony), filled
  from a constrained vocabulary; the user can override but rarely needs to. Never free-form:
  left alone, a model will write "orbit" or "dolly-zoom" and break the flat art.

---

## 1. Narrative arc library (pick one; recommend by topic)

| Arc (id) | When to use | Beat shape |
|---|---|---|
| `hook-payoff` | the default for any single idea; safest | Hook, Context, Build, Payoff, Button |
| `pas` | pain-aware ads, urgency | Problem, Agitate, Solve, Proof, CTA |
| `bab` | when the "after" sells better than the pain | Before, After, Bridge, CTA |
| `aida` | cold-audience paid ads | Attention, Interest, Desire, Action |
| `customer-hero` | brand or service, customer as the hero, the brand as the guide | Hero wants, Problem, Guide, Plan, CTA, Stakes |
| `how-it-works` | product, process or system explainer | Hook, What it is, 2-3 shown steps, Benefit, CTA |
| `timeline` | history, "evolution of", journeys | Start, event, event, turning point, present, takeaway |
| `man-in-hole` | case study, comeback, transformation (often the most engaging shape) | OK, fall, deepen, climb out, better than before |
| `story-spine` | mission, brand or founder tales | Once..., Every day..., Until one day..., Because..., Until finally..., Ever since... |
| `origin` | founder, "why we exist" | World, spark, leap, struggle, breakthrough, today |
| `myth-buster` | correcting a misconception | Fact first, the myth, expose the fallacy, what to believe, CTA |
| `listicle` | tips, tools, rankings, "N ways to..." | Promise, item, item, ..., number 1, recap or CTA |
| `three-act` | any narrative 60 s piece | Setup, Confrontation (rising), Resolution |
| `story-circle` | character-driven brand or user stories | You, Need, Go, Search, Find, Take, Return, Change |

**Topic to arc heuristic:** product or service ad: `pas`, `bab`, `aida` or `customer-hero`;
concept or system: `how-it-works` or `hook-payoff`; historical or "evolution of": `timeline`;
transformation or case study: `man-in-hole`; brand or mission: `story-spine` or `origin`;
correcting a belief: `myth-buster`; ranking or tips: `listicle`.

The brief skill's short list maps onto this library: problem-solution is `pas`, before-after is
`bab`, three-step how-to is `how-it-works`, countdown is `listicle`, question-answer is
`myth-buster` or `hook-payoff`.

## 2. Hook, pacing and beat count

- **Hook in 3 seconds or less.** Most viewers decide whether to stay within the first few
  seconds. Beat 1's baked headline must carry the payoff promise (a bold claim, a provocative
  question, a surprising stat, "you're doing X wrong"). Never spend beat 1 on setup.
- **Hook patterns (pick one for beat 1, stored as the beat's `hook`):** `mistake-callout`,
  `pain-point`, `surprising-stat`, `direct-question`, `urgent-warning`, `secret-reveal`,
  `experiment-story`, `pattern-interrupt`, `outcome-tease`. The underlying triggers: a
  curiosity gap, a pattern interrupt, a bold claim.
- **Beat count and length:**

  | Duration | Beats | Beat length | Narration words |
  |---|---|---|---|
  | **15 s** | 3-4 | about 4-5 s | about 35-40 |
  | **30 s** | 6-8 | about 4-5 s | about 70-80 |
  | **60 s** | 10-12 | about 5-6 s | about 130-150 |

  (The 15 s row is the 30 s rule scaled down.) With 2 shots per longer beat, a 60 s film is
  about 6 beats x 2 shots x 5 s = 12 shots.
- **Proportions:** hook 1-3 s, body 70-80%, payoff 10-20%, end or CTA 0-2 s.
- **Change something visually every 3-5 s; never hold a static poster longer than 8 s.** Every
  beat needs internal motion (section 3), which is why beats split into short shots.
- **Reading time:** on-screen text needs about 0.3 s per word plus 1 s (the brief skill's
  rule); a beat's `durationSec` must cover both the narration and any headline it shows.
- **Endings:** `hard-cut` (on the payoff; the default, drives rewatches), `quick-cta` (2 s or
  less, one action plus its benefit, 3-5 words), `loop-close` (the last line mirrors the first,
  for a seamless replay).

## 3. Shot rules (per beat)

### Cadence

A common mistake is one long shot per beat. On a 9:16 social piece especially, a static 10 s
shot reads as dead air. Aim for a **cut every 4-6 seconds**:

- **Shots run 3-6 s; never let a single shot run past about 7 s.** Beyond that the AI motion
  has nowhere to go and it feels static. (Most image-to-video models bill a 3 s minimum and are
  verified only up to about 10 s; see [models-and-gotchas.md](models-and-gotchas.md).)
- **A beat whose narration runs 8-10 s gets 2 shots:** a *wide* establishing shot with the
  headline, then a *detail* cut-in without it. The narration plays on across both and the
  picture cuts mid-sentence. This is the single biggest rhythm win.
- Reuse the wide keyframe for shot `a`; generate a tighter detail scene for shot `b`. Set
  `showHeadline: true` only on the wide shot so the headline appears once per beat.

### Shot size (how far the poster's composition is zoomed)

`est-wide` (the whole scene or system: orient, show scale), `wide` (the subject in its
environment), `medium` (one subject centred; the workhorse), `close` (one detail fills the
frame: emphasis, emotion), `detail` (a single texture, word or number: a punch beat).

Coverage plays out **across beats**: move-in `est-wide`, `medium`, `close` builds intensity
and peaks on the close; move-out `close` to `wide` reveals context (a good ending). The best
2-shot beat is **establishing wide, then a detail cut-in**: a wide to orient, a hard cut to a
close of the key element (generate two posters for that beat).

### Camera move: constrained flat-safe vocabulary

Rule: **uniform translate plus uniform scale is safe** (the text moves and scales as one
piece); **anything that warps perspective, blurs, or rotates text off-axis is risky.**

| Safe move (`cameraMove`) | What it does to flat art | Job | Image-to-video phrasing |
|---|---|---|---|
| `static` | no transform, tiny element float | let a stat or quote land | "locked-off static, only subtle paper flutter, text fixed" |
| `push-in` | uniform scale-up (a slow zoom on a still) | tension, focus | "very slow push in, text stays sharp and centred" |
| `pull-out` | uniform scale-down | reveal, the big picture | "slow pull out revealing the full scene, flat, steady" |
| `pan` | translate across a wide poster | read a list or timeline | "slow horizontal pan, flat 2D, no perspective shift" |
| `tilt` | vertical translate | reveal scale, a countdown | "slow vertical tilt, flat parallax, steady" |
| `parallax` | foreground, midground and background layers move at different speeds | the "living paper" signature | "subtle multi-layer parallax, paper layers drift at different speeds, 2.5D, flat" |
| `element` | one cut-out slides or hinges in, the others stay still | introduce or emphasise one item | "one paper element slides in from the edge, the others static, stop-motion feel" |

**Bold or experimental (available, not banned):** `orbit` or `arc`, `dolly-zoom`, `roll`,
`whip`. In testing they *tend to* warp the flat art and smear text, but they are a style
choice, not forbidden. Use them with `constraints: "loose"` in `video-plan.json` and **re-roll**
until a take lands; save them for a beat where the effect earns it. With the default
`constraints: "strict"` the prompt's stability guards fight them (that is the point of strict).
If you only want a dolly-in's *feel*, a 2D `push-in` scales text as one piece and never warps.

### Element motion: the energy engine

`elementMotion` (what moves inside the frame) is a **separate axis from the camera**, and it is
where dynamism actually comes from. Rich element motion is **safe**. A single collage keyframe
animated with "the goat bobs, both traders gesture, coins and shells scatter, and a cut-out
paper bird flaps across the whole frame" stayed perfectly flat with the text intact, and looked
great. So **do not limit it to one gentle verb.** `elementMotion` is a per-beat creative call:
write what actually fits this scene, and make it rich (several things moving). Shot size gates
it: on a `wide`, several elements move; on a `close`, that one thing animates strongly.

- **Encouraged (safe and punchy):** several elements moving at once; coins, petals or scraps
  scattering and bursting; elements popping, sliding, flapping or hinging in; drift, sway,
  flutter, pulse.
- **A "hero" travelling element** (a bird, plane, coin or arrow flying across the frame) is a
  great **occasional** punch on a key beat, **not every shot**: a flyer in every frame reads as
  a formula. Let most beats just move their own elements richly.
- **The only real limits:** keep it **rigid paper** (cut-outs slide, flap and scatter; no
  organic melting, morph, warp or body horror), keep **text stable**, keep it **flat 2D**.
- Camera and element motion are independent: one camera move plus as much element motion as you
  like.

### Anti-monotony (the biggest quality lever)

Every beat is a similar-looking poster, so **no two adjacent shots use the same camera move**;
alternate families (scale, translate, static); and **reserve `static` for the payoff or quote
beat** so the drop in motion signals "this is the point". A 60 s film where all 12 shots were
`push-in` looked like one long zoom.

**Move-rhythm presets (drop in per arc):**

- `hook-payoff` (8 shots): push-in, pan, parallax, static, push-in, tilt, pull-out, static
- `pas` or `bab` (6 shots): push-in, static, pan, parallax, push-in, static
- `listicle`: the same move on every item (pan or tilt) but flip the direction, with parallax on
  number 1 and static on the recap
- `timeline`: pan in the same direction beat to beat (it feels like moving through time),
  push-in on the turning point, pull-out on the takeaway

## 4. The fields in video-plan.json

Plan-level fields (look and motion):

| Field | Meaning |
|---|---|
| `theme` | the chosen theme preset (see [prompt-guide.md](prompt-guide.md) section 6) or a custom mix |
| `aspect` | the film's aspect ratio, e.g. `9:16`; every clip in a film shares one aspect |
| `motionStyle` | amplitude: `calm`, `punchy` or `max` (the theme sets a default) |
| `constraints` | `strict` (default: flat 2D, one-way, no-morph guards, best for text-heavy explainers) or `loose` (lets the model explore bold moves; re-roll the misses) |
| `anchorFreeze` | photo-anchored films only: the freeze line added to every video prompt |

Per-beat fields (the beat `id` matches `beats.json`):

| Field | Meaning | Feeds |
|---|---|---|
| `narration` | the words spoken over this beat (the `beats.json` `text`) | the tts step and the captions |
| `headline` | the short baked-in headline, 2-3 words | image prompt part 4 |
| `scene` | the scene as separate layered cut-out pieces | image prompt part 2 |
| `background` | one bold flat background colour | image prompt part 3, video COLOUR axis |
| `feel` | the emotional tone, e.g. "ancient, humble" | video FEEL axis |
| `hook` | beat 1 only: the hook pattern | the headline's wording |
| `shots` | 1 or 2 shots (below) | |

Per-shot fields:

| Field | Meaning |
|---|---|
| `id` | `a` (wide, with the headline) or `b` (detail cut-in) |
| `seconds` | shot length, 3-6 s; the beat's shots add up to its `durationSec` |
| `showHeadline` | `true` on the wide shot only |
| `shotSize` | `est-wide`, `wide`, `medium`, `close` or `detail` |
| `scene` | this shot's own scene when it differs from the beat's (a tighter detail for `b`) |
| `cameraMove` | one move from the vocabulary above; varied across adjacent shots |
| `elementMotion` | what moves inside the frame; rich, written for this scene |

Example beat:

```json
{
  "id": "before-money",
  "narration": "For most of history, there was no money at all.",
  "headline": "BEFORE MONEY",
  "background": "earthy clay tan",
  "feel": "ancient, humble",
  "hook": "surprising-stat",
  "shots": [
    { "id": "a", "seconds": 5, "showHeadline": true, "shotSize": "wide", "cameraMove": "push-in",
      "scene": "two traders facing each other, a goat, a basket of cowrie shells, a torn BARTER strip",
      "elementMotion": "the traders gesture, the goat bobs, shells scatter, a paper bird flaps across the frame" },
    { "id": "b", "seconds": 5, "showHeadline": false, "shotSize": "close", "cameraMove": "parallax",
      "scene": "close on the shells changing hands",
      "elementMotion": "the goods slide together, halftone pulses" }
  ]
}
```

## 5. Vocabulary tokens (copy and paste)

```
ARCS:    hook-payoff pas bab aida customer-hero how-it-works timeline man-in-hole
         story-spine origin myth-buster listicle three-act story-circle
HOOKS:   mistake-callout pain-point surprising-stat direct-question urgent-warning
         secret-reveal experiment-story pattern-interrupt outcome-tease
SIZES:   est-wide wide medium close detail
MOVES:   static push-in pull-out pan tilt parallax element
         (bold, loose plus re-roll only: orbit arc dolly-zoom roll whip;
          avoid: crane boom pedestal handheld fast-zoom)
ENDINGS: hard-cut quick-cta loop-close
BEATS:   15 s: 3-4 beats; 30 s: 6-8 at 4-5 s (about 75 words); 60 s: 10-12 at 5-6 s
         (about 140 words); hook in 3 s or less; change something every 3-5 s
```

Sources: common ad and documentary frameworks (AIDA, PAS, BAB, StoryBrand, story spine).
