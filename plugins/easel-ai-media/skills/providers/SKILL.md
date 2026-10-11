---
name: providers
description: >-
  Set up and choose the AI media providers Easel can use with the user's own keys (Google Gemini,
  OpenAI, fal.ai, Replicate, Atlas Cloud, ElevenLabs): which keys are set (names only), what each
  provider and model does, what a job will cost before anything is spent, and the spending limit
  above which an approved amount is needed. Keys stay in the environment or the plugin's secure
  settings, never in project files.
when_to_use: >-
  The user asks to set up an API key, which image or video model to use, what something will cost,
  or a generation failed for a missing key. To make an image use easel-ai-media:image, a video
  easel-ai-media:ai-video, speech easel-ai-media:voice; to check that Easel itself works use
  easel-core:setup.
argument-hint: "[provider or question]"
allowed-tools: mcp__plugin_easel-ai-media_media__providers mcp__plugin_easel-ai-media_media__estimate Read
---

<!-- Easel's own (MIT). Prices in server/prices.json come from each provider's pricing page, or are marked verify. -->

# Providers

Easel never pays for anything itself: every generation runs on the user's own account with a
provider, and nothing is spent without the user saying yes.

## What is set up

`mcp__plugin_easel-ai-media_media__providers` lists each provider, whether its key is set (and where it came from: an
environment variable or the plugin setting), its kinds (image, video, tts, music, voice-clone),
its models with the price used for estimates (its source, and whether it was checked or must be
verified), and the current limit. Never ask the user to paste a key into the chat, and never
print one.

## Setting a key (tell the user; they do it)

- **Plugin settings (recommended):** `/plugin configure easel-ai-media` in Claude Code; the key
  fields are masked and stored in the system's secure credential store.
- **Environment variable:** `GEMINI_API_KEY` (or `GOOGLE_API_KEY`), `OPENAI_API_KEY`,
  `FAL_KEY`, `REPLICATE_API_TOKEN`, `ATLASCLOUD_API_KEY`, `ELEVENLABS_API_KEY`. On Windows:
  `setx OPENAI_API_KEY "<key>"` in a terminal, then restart Claude Code.
- Keys come from each provider's own console; Easel is not affiliated with any of them.

## Choosing

| Need | Good first choice | Why |
|---|---|---|
| An image with readable text, or editing with references | Gemini (gemini-2.5-flash-image) or OpenAI (gpt-image-1) | strong text and reference handling |
| Many cheap drafts | Replicate (flux-schnell) or fal (z-image turbo) | a fraction of a cent each |
| Image to video | fal (Kling) or Atlas Cloud (gemini-omni-flash) | per-second pricing; check the length limits |
| Narration with word timings | ElevenLabs | timings come back with the audio (captions, cuts) |
| Music under a video | Atlas Cloud (minimax music) or `easel-core:score` | score is free and offline |

## Cost and the limit

`mcp__plugin_easel-ai-media_media__estimate` gives the USD for a request (count, size, quality, seconds, text length) and
how it was worked out. A generation itself is always a dry run first: it returns the estimate and
a `quote`, and the paid call must repeat the same request with `confirm: true` and that quote, so
what is paid for is what the user saw. Prices marked `verify` come from secondary notes: say so. The limit
(default 0.50 USD per call, set in the plugin settings) means any single call above it needs the
user's explicit approval of that amount. A provider's bill is what counts; estimates are a guide.
