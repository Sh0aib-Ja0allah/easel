---
name: image
description: >-
  Generate or edit a raster image with the user's own provider key (Gemini, OpenAI, fal.ai,
  Replicate, Atlas Cloud): photographic or painted images, product shots from the user's photos,
  backgrounds, edits with reference images, several sizes from one master. Shows the cost before
  spending, writes the prompt from the brand, checks the result (text, colours, crops) and
  records the model in provenance.json.
when_to_use: >-
  The user asks to generate an image, an AI image or photo, to edit or restyle a photo, or a design
  skill needs a photographic background. For layouts with text (posters, social posts, ads) use
  easel-design first and use this only for the picture inside; for vector illustration use
  easel-illustrate.
argument-hint: "[what the image shows] [size or where it will be used]"
allowed-tools: mcp__plugin_easel-ai-media_media__providers mcp__plugin_easel-ai-media_media__estimate mcp__plugin_easel-ai-media_media__generate mcp__plugin_easel-core_easel__render_still mcp__plugin_easel-core_easel__contact_sheet Read Write Glob
---

<!-- Easel's own (MIT). The prompt reference is adapted from ArnavPuri/designskills; see its header and NOTICE.md. -->

# Image

A generated image costs money and can come back wrong, so: one good prompt, a price the user
agreed to, a careful look at the result. Work in `./easel-out/<slug>/`.

## 1. Is a generated image the right tool?

Text-heavy layouts, exact numbers, logos and UI are built as code (easel-design) and stay exact;
vector art is drawn (easel-illustrate). Use a model for photographic or painted pictures, and
put text on top as code when it matters. Never generate real people's likenesses without their
consent, other artists' characters, or brand logos the user does not own.

## 2. The prompt

Read [reference/prompt-craft.md](reference/prompt-craft.md). Build the prompt as format +
subject + style + composition + colour (hex from `.easel/brand.md`) + typography + mood + what to
exclude. Name a medium or a movement, never a living artist or a studio. Pass the user's own
photos or logo as `refs` (PNG, JPEG or WebP files inside the project folder; nothing else is
sent) rather than describing them.

## 3. Price, then generate

1. `mcp__plugin_easel-ai-media_media__generate` without `confirm`: a dry run with the provider, model, the estimate, the
   request and a `quote`. Show the user the prompt and the price in one short message. Pass `slug` (the job
   folder) and a `name` (`hero`, `hero-v2`); a used name gets `-2`, never an overwrite.
2. When they agree, call again with the same arguments plus `confirm: true` and the `quote` (and
   `approvedUsd` if the estimate is above the limit). If anything changes (prompt, size, count,
   provider, references), dry-run again and show the new estimate: a paid call whose request
   differs from the quoted one is refused. Pick the provider with `mcp__plugin_easel-ai-media_media__providers` or let the tool choose one with a key.
3. Several sizes: generate one master at the largest aspect, then crop each size in an HTML page
   (`object-fit: cover` with a focal point) rendered with `mcp__plugin_easel-core_easel__render_still`
   `sizes`. Don't pay for one generation per size.

## 4. Look and check

Read the image at full size and at the size it will be seen. Check text spelling, colours, the
crop at each size and artefacts (hands, edges, extra objects). Fix one thing per new generation,
or move the text into a code overlay. Several candidates: compare them on a
`mcp__plugin_easel-core_easel__contact_sheet`.

## 5. Deliver

The image files, the prompt, the provider and model, what it cost (estimate), and the
`provenance.json` entry the tool wrote. Tell the user when a provider marks its images as
AI-generated.
