<!-- Easel: adapted from Alisa0808/vox-director @ 6a85a7c341610442a6a5b1885e6e0217ab82a11f
     (github.com/Alisa0808/vox-director, references/models-and-gotchas.md), MIT License, Copyright (c) 2026 Alisa Qian;
     see NOTICE.md. Modified by Easel (2026-10-11): content-block section and the real-people model row replaced by the Easel policy; Python, curl and Pillow gotchas restated as what the Easel media and core tools do; ffmpeg notes tied to the assemble tool; host-mode recipe and catalogue URLs dropped; cost section recomputed from per-second video pricing; loudness mastering, per-beat narration and filmstrip on video files added for the Easel tools; ASCII punctuation. -->

# Models and gotchas

Everything here was learned the hard way while building an editorial collage pipeline. Read it
before debugging: most failures are already solved below. For the prompts themselves see
[prompt-guide.md](prompt-guide.md); for the story structure see [beat-layer.md](beat-layer.md).

## The Easel tools in this pipeline

| Step | Tool |
|---|---|
| See which providers have a key, their models and the prices used for estimates | `mcp__plugin_easel-ai-media_media__providers` |
| Price a step before spending | `mcp__plugin_easel-ai-media_media__estimate` |
| Keyframes, clips, narration, music | `mcp__plugin_easel-ai-media_media__generate` kinds `image`, `video`, `tts`, `music` (a dry run with a cost estimate and a `quote` unless `confirm: true` with the `quote` of a dry run of the same request; above the spending limit it also needs `approvedUsd`) |
| A cloned narrator voice | the `voice` skill only (generate kind `voice-clone`, consent required; see [voices.md](../../voice/reference/voices.md)) |
| Caption and watermark PNGs | `mcp__plugin_easel-core_easel__render_still` with `transparent: true` |
| Join clips, overlays, narration and music, and master the loudness | `mcp__plugin_easel-ai-media_media__assemble` |
| Check the result | `mcp__plugin_easel-core_easel__filmstrip` on the clip or film file, and `mcp__plugin_easel-core_easel__qa` |
| Review before delivering | `easel-core:critique` with the **motion** rubric |

Every generated file lands in `./easel-out/<slug>/` with a `provenance.json` entry.

## Model selection (verify ids and prices before spending)

Model ids change. Run `providers` first to see what Easel can call today, and check the
provider's own model catalogue before a large job. The Atlas Cloud ids and prices below are
**approximate; verify before spending**.

| Job | Atlas Cloud model | Price (approximate) | Why |
|---|---|---|---|
| Keyframe / collage poster | `google/nano-banana-2/text-to-image` | about $0.08 at 1k, $0.12 at 2k, per image | strong text rendering (Latin and CJK), a clearly layered look |
| Animate a poster | `google/gemini-omni-flash/image-to-video` | about $0.13 per second, 3 s minimum | keeps on-screen text stable, layered parallax motion |
| Animate (alternative) | `kwaivgi/kling-video-o3-pro/image-to-video` (not in Easel's Atlas list yet; Easel reaches Kling through fal.ai) | about $0.095 per second on Atlas | takes a negative prompt in its own API (Easel sends the prompt alone, so phrase it positively); follows the input image's aspect; check fine text for drift |
| Narration | `xai/tts-v1` | about $0.015 per request | clean multilingual TTS with a voice id and language (roster in [voices.md](../../voice/reference/voices.md)) |
| Music | `minimax/music-2.6` | about $0.11 per request | instrumental; returns about 2 minutes, which assembly trims to the film |

The same kinds are available from other providers (fal.ai, Replicate, Gemini, OpenAI,
ElevenLabs); `providers` lists them with the price source and whether it was checked. The
prompt rules in [prompt-guide.md](prompt-guide.md) apply to any of them, with the
negative-prompt caveat noted there.

### Video model limits

- **Aspect.** Gemini Omni Flash does 16:9 and 9:16 only. Pick the film aspect the video model
  supports. If there is no exact match, ask the user before approximating; never silently
  reframe. Every clip in one film shares one aspect.
- **Length.** Omni is verified up to about 10 s per clip and bills a 3 s minimum, which is why
  shots run 3-6 s (see [beat-layer.md](beat-layer.md)).
- **Pricing units differ by model.** Some video models bill per token or per resolution tier,
  and a catalogue's "base price" field is not always a per-second price. Read the model's own
  pricing, then trust `estimate`.

## Real people, brands and content rules

Easel does not depict real people or use brand logos without the rights holder's permission,
and never uses a model choice or prompt trick to get around a provider's content rules. When a
provider refuses a request, the answer is to change the content, not the route. Real people
appear only as the user's own footage or photos, with the consent of the person shown.

## Voice: pin the speaker, time from the real audio

- An **audio-scene model** (one that generates speech plus ambience and effects, rather than a
  plain TTS) given bare narration with no pinned voice adds pauses and sound effects, and gives
  wildly inconsistent lengths (the same 3 lines came back at 22 s, 14 s and 12 s, against a
  plain TTS's steady 8.6, 10.2 and 9.0 s). Pinned to one speaker and asked for "clean dry studio
  vocal only, no background music, no sound effects, no room noise or reverb", the same kind of
  model rendered 62 words in 19.3 s, verbatim, with one natural pause. Default to a plain TTS for
  narration.
- **Always derive final timing from the actual audio, never from the script.** Generate kind
  `tts` returns word timings where the provider gives them; use them to set each beat's real
  length and the caption times.
- Keep one voice for the whole film. Voice choice and cloning rules are in
  [voices.md](../../voice/reference/voices.md).

## Provider API notes (handled by the media tool)

1. **A real User-Agent.** Atlas Cloud's firewall blocks requests with a default library user
   agent (403 Forbidden). The Easel media tool always sends a real User-Agent.
2. **Downloads.** Generated assets are fetched by the tool into the job folder; there is nothing
   to download by hand.
3. **Endpoints.** On Atlas, images go through the image endpoint and video, speech and music
   through the video endpoint; the tool picks the right one per kind.
4. **A failed generation can show as a server error while polling**, not a clean "failed"
   status. The tool stops and reports the provider's message: read it before re-rolling.
5. **Billable submits are never retried**; status polls are. A network blip during polling
   does not create a second paid job.

## Assembly gotchas (what the assemble tool already does)

The assemble tool runs the user's local ffmpeg. It is built around these lessons:

- **Captions and watermark are PNG overlays, not ffmpeg text.** Many ffmpeg builds lack the
  text and subtitle filters, so Easel never relies on them. Render each caption with
  `render_still` and `transparent: true` **at the full frame size** with the text placed where
  you want it (assemble fits each overlay to the frame and centres it), then pass it in
  `overlays` with `start` and `end`. Size the text relative to the shorter side of the frame so
  one layout works in 16:9 and 9:16, and keep it inside the title-safe area.
- **Off-aspect clips are scaled to fill and the overflow is cropped.** Generate clips at the
  film's aspect. If a clip must be off-aspect (a 3:4 card in a 9:16 film), keep the headline and
  key elements in the centre so the crop does not cut them; never pad with black bars.
- **Slow, don't freeze.** When a clip is shorter than its beat, assemble slows it to fill the
  beat instead of freezing the last frame. Slowing more than about 1.5x starts to read as slow
  motion, so generate each clip close to its shot length.
- **Ducking keeps the full length.** The narration is padded to the film's length before the
  music is ducked under it, so a music-only ending (an outro after the last line) is not cut
  off when the voice stops.
- **One line per beat.** `narration` takes one file for the whole film, or a list of lines:
  `[{"file": "vo-b2.mp3", "clip": 2}]` starts a line with that clip (numbered from 0), and
  `[{"file": "vo-b2.mp3", "start": 6.5}]` at a time in seconds. A retake then replaces one line.
  The result warns when a line runs into the next one or past the end of the film.
- **The mix is mastered.** assemble masters the final mix to -14 LUFS integrated with a true
  peak of -1 dBTP (it measures the mix, then applies a gain and, where the peaks need it, a
  true-peak limiter; `lufs` between -18 and -10 sets another target), so the film lands inside
  qa's -16 to -12 LUFS window however loud the narration came back. Its result reports the
  measured `loudness`. `musicDb` sets the music's balance under the voice, not the film's
  loudness.
- **Hard cuts.** Assemble joins shots with hard cuts, so beat start times are simply the sum of
  the earlier shot lengths. If you add crossfades or whip transitions in another editor, each
  overlap shifts every later beat: recompute the caption times.
- **Verify by looking at frames.** You cannot watch an mp4, but `filmstrip` reads frames from
  it: `{"file": "film.mp4", "times": [...]}` (one time per shot at least) or `{"file":
  "clip.mp4", "count": 6}`. Open the sheet; check that the headline letters survived the video
  step, that nothing morphed, and that captions sit where planned. Then run `qa` on the final
  file.

## Cost of a typical film

Per-second video pricing dominates. Worked from the approximate Atlas prices above (verify
before spending; always show the user the `estimate` or dry-run total first):

| Item | 30 s film (6 shots x 5 s) | 60 s film (12 shots x 5 s) |
|---|---|---|
| Look bake-off (3-4 images) | about $0.24-0.32 | about $0.24-0.32 |
| Keyframes at 1k (2k adds about 50%) | 6 x $0.08 = about $0.48 | 12 x $0.08 = about $0.96 |
| Clips at $0.13 per second | 30 s = about $3.90 | 60 s = about $7.80 |
| Narration | about $0.02 | about $0.02-0.03 |
| Music | about $0.11 | about $0.11 |
| **First pass total** | **about $4.75-4.85** | **about $9.10-9.25** |

Budget a few re-rolls on top: re-rolling a keyframe costs cents, re-rolling a clip costs
dollars, which is why every keyframe is checked before it is animated. (The source pipeline
quoted about $0.8-1.0 for a 30 s film; that figure predates per-second video pricing.)
