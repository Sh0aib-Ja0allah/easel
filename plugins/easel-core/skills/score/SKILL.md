---
name: score
description: >-
  Add music and sound effects to a video or animation: turn its timing into a cue sheet
  (cues.json), synthesize a score that follows it (a chord per scene, a dip into near-silence
  before the payoff and the loudest hit on it, named effects such as whoosh, pop, click, chime,
  riser, impact), master it to -14 LUFS and mux it. Offline, deterministic, no Python.
when_to_use: >-
  The user asks to "add music", "add sound", "sound effects", "score this", "sync it to the beat",
  or a render has no audio. For an easel-motion animate piece, its own in-piece score is used by
  default (render_video audio "page"); use this skill for any other video, or when the user wants
  a score built from a cue sheet. A user's own music track is muxed as is.
argument-hint: "[video or piece] [mood: warm | bright | retro]"
allowed-tools: mcp__plugin_easel-core_easel__audio_score mcp__plugin_easel-core_easel__validate mcp__plugin_easel-core_easel__render_video mcp__plugin_easel-core_easel__qa Read Write Edit Glob
---

# Score: music and effects from a cue sheet

Everything is synthesized in code on the user's machine (Web Audio in the engine's offline
browser): no samples, no downloads, no paid services. You can't hear it, so you measure it and
say so. Work in the job folder `./easel-out/<slug>/`.

## 1. Which sound

- **An easel-motion animate piece** already has a score in `src/score.js`. Render it with
  `render_video` `audio: "page"` (mastered to -14 LUFS for you). Use this skill only if the user
  wants a different score.
- **The user's own track** (a file they own or licensed): mux it with `render_video` `audio:
  "<path>"`. Never fetch music from a site the user didn't point to.
- **Anything else** (a video without sound, a slideshow, a GSAP piece): build a cue sheet and
  synthesize a score, below.

## 2. The cue sheet

Write `./easel-out/<slug>/cues.json` (get the schema with `mcp__plugin_easel-core_easel__validate`
`{"kind": "cues", "schema": true}`): `fps`, `durationSec`, `bpm` (120 if nothing sets it), `key`
("D major", "A minor"...), and `cues` in frame order, each `{ name, frame, kind }`:

| kind | What it does in the score |
|---|---|
| `scene` | a new section: the next chord of the progression, a short motif |
| `beat` | a soft kick |
| `hit` | the payoff: the music dips for half a second before it, then the loudest moment (a chord stab and a sub) |
| `sfx` | a named effect at that frame: `whoosh`, `swish`, `pop`, `click`, `tick`, `chime`, `riser` (rises into the frame), `impact`, `blip` |
| `caption` | a small blip as the caption appears |
| `music-start`, `music-stop` | where the music plays (default: all of it) |

Take the times from the piece itself (a storyboard's beats, `beats.json`, an animate piece's
`TIMELINE.cuts`, `morphs` and `cues`, or a filmstrip of the video). Put the one `hit` where the
story turns or pays off, with the busiest stretch just before it. Validate the file with
`validate` `{"kind": "cues", "file": ...}` and fix what it reports.

## 3. Synthesize and check

`mcp__plugin_easel-core_easel__audio_score` with `file` = the cue sheet, `palette` = `warm`
(soft; the default), `bright` or `retro` (square waves, for pixel and game pieces), `name` = the
slug. It writes `<name>.wav` mastered to -14 LUFS and reports `lufs` and `pass`. If it warns about
an unknown effect name, use one of the listed names. Then `qa` with `audio` = the WAV (loudness
-16 to -12 LUFS is a hard gate).

## 4. Put it on the video

`render_video` with `audio` = the WAV (it is trimmed to the video length), or give the WAV to the
user for their editor. Run `qa` on the final MP4 (`video`) for loudness and stillness.

## 5. Report

Say what plays where (sections, the hit, the effects), the measured loudness, and that you can't
listen to it: ask the user to listen and say what to change (quieter, busier, another palette, a
different hit).

Decision D16 (findings-and-decisions.md): the synth is JavaScript in the engine; mg-styles-15's
Python `mgaudio` was not ported and Python is not needed.
