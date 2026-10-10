---
name: brief
description: >-
  Plan a multi-step creative job before anything expensive is made: ask the intake questions,
  then run three cheap check-ins (story, look, storyboard) and write brief.json and beats.json.
  Use at the start of any video, explainer, animation, campaign, multi-format social set or brand
  job, or when the user says "plan", "storyboard", "outline the video", "let's start a project".
  For a single quick still (one poster, one icon) go straight to the design or illustration
  skill; for the brand file itself use easel-core:brand.
when_to_use: The user starts a creative job that has several outputs, takes time to render, or will be reviewed in stages.
allowed-tools: mcp__plugin_easel-core_easel__validate mcp__plugin_easel-core_easel__render_still mcp__plugin_easel-core_easel__contact_sheet mcp__plugin_easel-core_easel__filmstrip mcp__plugin_easel-core_easel__craft
---

# Brief: plan before rendering

Renders are slow and paid for in time; questions and sketches are cheap. Settle what to make
before making it. Everything goes in the job folder `./easel-out/<slug>/`.

## 1. Intake

Read `.easel/brand.md` if it exists (it is the brand file from `easel-core:brand`). Then ask what
you cannot infer, **in one message, at most six questions, each with a suggested default**:

1. **Subject:** what is it about, in a sentence?
2. **Audience** and what they should think, feel or do afterwards.
3. **Formats:** video (length, aspect ratios such as 16:9 and 9:16), stills, social sizes, deck.
4. **Look:** a style, references they like, and things they dislike (anti-references).
5. **Voice:** tone; on-screen text, voice-over or both; language.
6. **Music** and hard **constraints** (deadline, words that must or must not appear, legal).

If the user says "just go", take your defaults and say which ones you took.

## 2. Check-in 1: story

Draft `beats.json` (load the schema with `mcp__plugin_easel-core_easel__validate`,
`{"kind": "beats", "schema": true}`): ordered beats with on-screen text, the visual intent and a
duration each. Choose an arc that fits (problem-solution, before-after, three-step how-to,
countdown, question-answer). Show it to the user as a numbered list with timings; respect
reading time (0.3 s per word plus 1 s). Revise until they approve. Mark approved beats
`"approval": "approved"`.

## 3. Check-in 2: look

Make 2-3 style frames of the same key beat in structurally different looks (not just
different colours). Render each with `mcp__plugin_easel-core_easel__render_still` and put them
side by side with `mcp__plugin_easel-core_easel__contact_sheet`. Read
`mcp__plugin_easel-core_easel__craft` `{"name": "anti-generic"}` first. Open the sheet with Read,
then show it. The user keeps one; never blend directions.

## 4. Check-in 3: storyboard

One frame per beat in the chosen look, on a contact sheet (or a `filmstrip` of a rough
animated draft). Fix composition problems here, before any full render.

## 5. Write and validate

Write `brief.json` (schema: `{"kind": "brief", "schema": true}`) with the answers and the three
check-ins as `approved`, `changes-requested`, `pending` or `skipped`. Validate both files with
`mcp__plugin_easel-core_easel__validate` (`{"kind": "brief", "file": "..."}` and the same for
`beats`) and fix every problem it reports.

Then hand over to the skill that makes the work (for video, `easel-motion:animate`), passing
the job folder.
