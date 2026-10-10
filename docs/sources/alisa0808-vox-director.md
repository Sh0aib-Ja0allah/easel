# Alisa0808/vox-director

- **Link:** https://github.com/Alisa0808/vox-director
- **License:** MIT. The showcase MP4s are AI-generated (credits: Stav Zilber, rom1trs, Higgsfield, Vox).
- **Status (2026-10-10):** about 2.2k stars, last push 2026-10-05. No tests.
- **Type:** standalone agent skill (`SKILL.md` + `AGENTS.md`, plus a `.skill` zip for the Claude UI). It is **not** a Claude Code plugin.

## What it does

Takes one topic and produces a finished paper-collage explainer or ad video in the style of Vox. Every image, video clip, voice line and music track comes from **AI generation through Atlas Cloud** (a paid API). Assembly runs locally in ffmpeg.

### Pipeline

1. **Beat map.** Writes `beats.json` using one of 14 narrative arcs. **Gate 1:** the user approves the beats.
2. **Style bake-off.** Renders one beat in 3–4 of the 9 theme presets. **Gate 2:** the user picks a look.
3. **Keyframes.** Creates collage stills (`keyframes.py`).
4. **Motion.** Turns the stills into image-to-video clips (`clips.py`).
5. **Audio.** Generates voice-over and music (`audio.py`).
6. **Assembly.** `assemble.py` produces `final.mp4`.

### Other modes

- **A-roll:** restyles a talking-head video.
- **C-roll:** builds a collage around a single photo.
- **Host:** adds a lip-synced presenter.
- **Local keyframe engine:** generates the keyframes locally.

## Dependencies

- **Software:** Python 3, Pillow (plus numpy for lip-sync scoring), ffmpeg/ffprobe.
- **API key:** `ATLASCLOUD_API_KEY`. Atlas Cloud is the only backend today, although `provider.py` defines a pluggable `Provider` interface.
- **Models used through Atlas:**
  - Images: nano-banana-2, gpt-image-2
  - Video: gemini-omni-flash, kling-video-o3-pro, seedance-2.0
  - Voice and speech: xai tts/stt, seed-audio
  - Music: minimax music
  - Background removal: youchuan
- **Windows problems:**
  - `/usr/bin/curl` is hardcoded.
  - Font paths are macOS-only.
  - Docs and scripts assume `python3`, `brew` and POSIX shell checks.

## Cost to end users

The repo's own estimates:

| Item | Cost |
|------|------|
| Keyframe | about $0.08 |
| Video | about $0.13/s |
| Host clips | about $0.36/s |
| 30 s film | about $0.80–1.00 |
| 60 s film | "a couple of dollars" |

Every re-roll is billed again. The watermark reads "Made with Atlas Cloud", and the README links carry Atlas UTM tracking tags.

## Output

MP4 at 24 fps, rendered at 720p and upscaled to 1920×1080, 1080×1920 or 1080×1080. The schema lists 3:4, but `assemble.py` doesn't implement it.

## Keep

- `beats.json` as the single source of truth for the video.
- The two human approval gates.
- Separating the look (image step) from the motion (video step).
- The 14-arc beat library and the prompt guide.
- `models-and-gotchas.md`.
- The provider abstraction.
- The cost-estimate gate.
- Checking results by grabbing frames from the output.

## Gaps and risks

- **One vendor.** It only works with Atlas Cloud, and there is no free path.
- **macOS-specific code.** See the Windows problems above.
- **Hardcoded demo.** `motion.py` is written around the CR7 (Ronaldo) demo.
- **Celebrity content.** The Ronaldo examples are included, and the docs describe Kling and the "zero content filters" local engine as ways around celebrity and brand blocks. This is a right-of-publicity and trademark risk. **Drop these examples.**
- **Voice cloning.** There is no consent gate.
- **"Vox" is a trademark.** Rename the style, for example to "editorial collage".

## Proposed use

**adapt.** Make it the "AI-generated video" path, separate from the procedural code path. Required changes:

- Generalize the provider so users can bring their own API key or model.
- Fix the Windows problems.
- Remove the celebrity examples.
- Add a consent gate for voice cloning.
- Rename the style.
