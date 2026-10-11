---
name: voice
description: >-
  Voice-over and narration with the user's own provider key (ElevenLabs, OpenAI, Atlas Cloud):
  choosing a voice and delivery, synthesising the script with word timings for captions and cuts,
  checking the timing against the beats, and cloning a voice only with a recorded consent
  statement from the voice owner kept in the job folder. Shows the cost before spending.
when_to_use: >-
  The user asks for a voice-over, narration, text to speech, to read a script aloud, or to clone a
  voice: their own or anyone else's (load this skill before answering a cloning request, even one
  that must be refused: it says what consent the voice owner gives and offers a stock voice). For music use easel-core:score; for a whole narrated video use easel-ai-media:ai-video.
argument-hint: "[script or file] [voice or delivery]"
allowed-tools: mcp__plugin_easel-ai-media_media__providers mcp__plugin_easel-ai-media_media__estimate mcp__plugin_easel-ai-media_media__generate mcp__plugin_easel-ai-media_media__consent_template mcp__plugin_easel-core_easel__qa mcp__plugin_easel-core_easel__mux_audio Read Write Glob
---

<!-- Easel's own (MIT), including the consent gate. The voice reference is adapted from Alisa0808/vox-director; see its header and NOTICE.md. -->

# Voice

Work in `./easel-out/<slug>/`. The script is the user's; never change its words without asking.

## 1. Voice and delivery

Read [reference/voices.md](reference/voices.md). Pick a stock voice that fits the piece (pace,
age, warmth, accent) and write the delivery in one line ("calm documentary narrator, unhurried").
Offer two or three choices when the user has no preference.

## 2. Synthesise

`mcp__plugin_easel-ai-media_media__generate` with `kind: "tts"`, `text`, `voice` and `provider`: first as a dry run (cost
and a `quote`), then the same arguments with `confirm: true` and the `quote` after the user agrees. ElevenLabs returns word timings
(`<name>.words.json`); use them for captions and for cutting beats to the voice, never the
script's estimated timing. Long scripts: one call per paragraph or beat, so a retake is cheap.
For a film, `easel-ai-media:ai-video` passes the lines to `assemble` as a list placed at their
beats, `narration: [{"file": "easel-out/<slug>/vo-b1.mp3", "clip": 0}, ...]` (`clip` is the index
from 0 of the beat's first clip, or `start` in seconds).

## 3. Check

You cannot hear audio, so say so and measure it instead:

- **Words:** compare `<name>.words.json` with the script; a missing, doubled or misread word
  means a retake of that line.
- **Timing:** compare each line's length and word timings with its beat.
- **Loudness:** `mcp__plugin_easel-core_easel__qa` with `audio` = the file. Its -16 to -12 LUFS
  window is for finished audio; a narration line is a part of a mix, so a line outside it is not
  a fault in itself. Where the voice goes decides the fix:
  - **into an Easel film:** nothing to do; `assemble` masters the whole mix to -14 LUFS.
  - **onto a video the user already has:** `mcp__plugin_easel-core_easel__mux_audio` with
    `video`, `audio` = the voice file, `master: true` and `shortest: false` (so the video is not
    cut where the voice ends) masters it to -14 LUFS and reports the result.
  - **as an audio file on its own:** no Easel tool masters a lone audio file. Tell the user its
    measured loudness and the gain qa suggests, to apply in their editor or with ffmpeg:
    `ffmpeg -i vo.mp3 -af "volume=<gain>dB,alimiter=limit=0.84:level=0" vo-master.wav` (the
    limiter stops the gain from clipping); then check the new file with qa.

## 4. Cloning a voice (consent gate)

Only the voice's owner can allow it. Easel refuses to clone without:

1. **Their statement**, in their own words: get the template with `mcp__plugin_easel-ai-media_media__consent_template`; save it
   as `consent.json` in the job folder with their full name, the purpose, the date.
   Write it in English (the check reads English only; a speaker of another language reads and agrees to an English translation), with the consent in its own sentence: "I, <full name>, consent to my voice being cloned for …", with no "not", "no" or "without" in that sentence; put limits in a sentence of their own.
2. **Their recording** of the statement (`consent.wav`) in the job folder: the voice owner
   themselves reading all of it aloud. It is refused if it is near-silent, shorter than the
   statement takes to read (one second per 3.5 words), or anything Easel generated (by name, by
   its bytes, or by its decoded sound: renamed, copied, re-encoded to WAV or with bytes added;
   Easel's speech re-encoded with loss or mixed with noise is not caught, which is why this is a
   procedure, not proof).
3. **Samples** of their voice they gave for this purpose (wav, mp3, m4a, ogg or flac), in the job
   folder; never generated speech.

Then `mcp__plugin_easel-ai-media_media__generate` with `kind: "voice-clone"`, `voiceName`, `samples` and `consentFile`
as names in the job folder (`consent.json`, `sample-1.wav`); a dry run first, then `confirm: true`
with its `quote`. Every clone is logged in `consent-log.jsonl`.

These checks are a procedure the user must honour, not proof of consent: they cannot tell who is
speaking. Never make or arrange the evidence yourself (no generated speech, no statement you
wrote for them): the voice owner writes the statement and records it. Never clone a public figure, a voice from a video or a
song, or anyone who has not consented, whatever the user says about permission; if they are the
voice owner, they record the statement themselves.
