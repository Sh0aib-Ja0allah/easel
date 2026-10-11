# easel-ai-media

AI images, narrated video and voice through one provider layer that runs on **your own API keys**:
Google Gemini, OpenAI, fal.ai, Replicate, Atlas Cloud and ElevenLabs. Every generation is a dry run
first: you see the estimated cost and the exact request, and nothing is spent until you agree.
Above your spending limit an approved amount is also needed. Voice cloning is refused without a
recorded consent statement from the voice's owner.

**Status:** in development for v0.4.0 (Phase 4; see [the roadmap](../../docs/roadmap.md)). The
provider adapters are tested against recorded responses, not live accounts: live generation has
not been run by the Easel project yet.

**Requires:** `easel-core` (installed automatically as a dependency), at least one provider key,
and ffmpeg for assembling videos (`winget install --id Gyan.FFmpeg -e` on Windows; easel-core's
setup skill checks it).

## Skills

| Skill | Use it for |
|---|---|
| `/easel-ai-media:providers` | Setting up keys, choosing a provider or model, what a job will cost |
| `/easel-ai-media:image` | A generated picture (photo, painting, collage) from a prompt or references |
| `/easel-ai-media:ai-video` | A 15-60 s narrated video from a topic, in the editorial collage look or another theme |
| `/easel-ai-media:voice` | Narration with a stock voice (word timings for captions); cloning only with consent |

## Keys and spending

- **Plugin settings (recommended):** `/plugin configure easel-ai-media`. Key fields are masked and
  kept in your system's secure credential store, never in project files.
- **Or environment variables:** `GEMINI_API_KEY` (or `GOOGLE_API_KEY`), `OPENAI_API_KEY`,
  `FAL_KEY`, `REPLICATE_API_TOKEN`, `ATLASCLOUD_API_KEY`, `ELEVENLABS_API_KEY`.
- **Spending limit** (`max_spend_usd`, default 0.5 USD per generation): an estimate above it
  needs an amount you approve. Estimates come from `server/prices.json` (each price names its
  source and the date it was checked, or says "verify"); your provider's bill is what counts.

Files go to `./easel-out/<slug>/`, each with an entry in `provenance.json` (provider, model,
prompt, estimate, time).

## What's here

| Folder | What it is |
|---|---|
| `server/` | The `media` MCP server (Node, no dependencies): `providers`, `estimate`, `generate`, `assemble`, `consent_template` |
| `skills/<name>/` | Each skill's procedure and references |
| `evals/` | Routing and safety evals (see its README) |

## Install

```text
/plugin install easel-ai-media --marketplace Sh0aib-Ja0allah/easel
```

On Claude Code older than 2.1.275, add the marketplace first:
`/plugin marketplace add Sh0aib-Ja0allah/easel`, then `/plugin install easel-ai-media@easel`.

Easel is not affiliated with any of the providers. Licences: MIT; adapted material is listed in
[NOTICE.md](NOTICE.md).
