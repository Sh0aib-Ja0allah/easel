---
name: ai-video
description: >-
  A short narrated video from one topic with the user's own AI providers, in the editorial
  paper-collage look by default (or another theme): a story beat map approved first, a style
  bake-off the user picks from, one collage keyframe per shot, image-to-video clips, narration
  with word timings, music, captions, and assembly with the local ffmpeg. Two approval gates and
  a cost estimate before every spend; real people only from the user's own footage with consent.
when_to_use: >-
  The user wants an AI-generated explainer or ad video, a collage video, a narrated short from a
  topic, or footage made by a video model. For a video drawn in code with no provider costs use
  easel-motion:animate; for a still image use easel-ai-media:image; for narration alone use
  easel-ai-media:voice.
argument-hint: "[topic] [length, e.g. 15s or 30s] [aspect, e.g. 9:16]"
allowed-tools: mcp__plugin_easel-ai-media_media__providers mcp__plugin_easel-ai-media_media__estimate mcp__plugin_easel-ai-media_media__generate mcp__plugin_easel-ai-media_media__assemble mcp__plugin_easel-core_easel__validate mcp__plugin_easel-core_easel__render_still mcp__plugin_easel-core_easel__contact_sheet mcp__plugin_easel-core_easel__filmstrip mcp__plugin_easel-core_easel__qa Read Write Edit Glob
---

<!-- Easel: the pipeline (beat map, style bake-off, keyframe per shot, image-to-video, voice, music,
     assembly, two approval gates, cost shown before spending) is adapted from Alisa0808/vox-director
     @ 6a85a7c341610442a6a5b1885e6e0217ab82a11f (github.com/Alisa0808/vox-director, SKILL.md), MIT
     License, Copyright (c) 2026 Alisa Qian; see NOTICE.md. Modified by Easel (2026-10-11): the look is
     called editorial collage; the Python scripts are replaced by the easel-ai-media and easel-core
     tools (Windows-first, no curl or Mac fonts); examples with real people and all content-filter
     workarounds removed; any provider, not one. -->

# AI video

A topic becomes a 15-60 s narrated film: each beat a finished collage poster that comes alive.
The look is born in the image step and the motion is added after, so the keyframe prompts matter
most. Work in `./easel-out/<slug>/`. You cannot watch or hear the result: check it with
filmstrips and measurements, and say so.

References: [reference/beat-layer.md](reference/beat-layer.md) (arcs, beat counts, shots,
camera and element motion, the `video-plan.json` fields),
[reference/prompt-guide.md](reference/prompt-guide.md) (the style block, themes, image and video
prompt structure), [reference/models-and-gotchas.md](reference/models-and-gotchas.md) (models,
prices, what goes wrong), and `easel-ai-media:voice` for narration.

## 0. Rules

- Every `mcp__plugin_easel-ai-media_media__generate` call is a dry run first. Before each batch (keyframes, clips, voice,
  music) show the user the total estimate and get a yes; then call with `confirm: true` (and
  `approvedUsd` for amounts above the limit). Keep a running total in `LOG.md`.
- No real people's likenesses or brand logos unless the user owns them and the pictured person
  consents; never change model or prompt to get past a provider's content rules. When a
  provider refuses, change the content.
- Name looks by what they are (editorial collage, 1970s groovy, ink wash), never after a
  channel, a studio or an artist.

## 1. Beat map (approval gate 1)

Run the `easel-core:brief` check-ins for the story: pick an arc from beat-layer.md, write
`beats.json` (beat 1 is a hook of 3 s or less; 15 s -> 3-4 beats, 30 s -> 6-8, 60 s -> 10-12),
validate it with `mcp__plugin_easel-core_easel__validate` `{"kind": "beats"}`, and write `video-plan.json` with the
per-beat narration, headline, scene, background, feel and 1-2 shots each (shot size, camera move
varied between neighbours, rich element motion). **Show the beat map and wait for approval.**

## 2. Look (bake-off)

Pick 3-4 themes from prompt-guide.md that fit the topic's era, culture and tone. Generate the
first beat's wide shot in each (`kind: "image"`, same prompt but the style block; after the
estimate), lay them out with `mcp__plugin_easel-core_easel__contact_sheet`, and let the user pick by eye. Record the theme
in `video-plan.json`.

## 3. Keyframes, then clips (approval gate 2)

1. One keyframe per shot in the film's aspect (`aspect`), from the style block + scene +
   background + headline (wide shots only). Look at every one: text spelling, cut-out edges, the
   headline legible at phone size. Regenerate failures (one change at a time).
2. **Show the keyframes and the clip estimate; wait for approval.**
3. One image-to-video clip per shot (`kind: "video"`, `refs: [keyframe]`, `seconds` from the
   plan) with the video prompt from prompt-guide.md (camera move, element motion, stability
   anchors). Check each clip with `mcp__plugin_easel-core_easel__filmstrip` (`count: 6`): text stays stable, nothing
   morphs, the move is the planned one.

## 4. Sound and captions

- Narration: `easel-ai-media:voice` (word timings from the provider). Set each beat's length
  from the real audio, not the script.
- Music: `kind: "music"` (instrumental), or the free `easel-core:score`, or the user's own track.
- Captions: one transparent PNG per caption line, rendered with `mcp__plugin_easel-core_easel__render_still`
  (`transparent: true`, the film's size, a bundled face), timed from the word timings.

## 5. Assemble and check

`mcp__plugin_easel-ai-media_media__assemble` with the clips (each `seconds` = its beat's voiced length; short clips are slowed,
never frozen), `narration`, `music` (ducked under the voice), the caption `overlays`, the film's
`size` and `fps`. Then `mcp__plugin_easel-core_easel__qa` with `video` (loudness, still stretches, colour cast) and a
`mcp__plugin_easel-core_easel__filmstrip` of one frame a second. Fix and re-assemble (assembly is free; regenerations
cost).

## 6. Deliver

The MP4, the keyframes, `beats.json`, `video-plan.json`, `provenance.json` (the tool records
every model and estimate) and the total estimated spend. Say what you could not check (you
cannot watch or hear it).
