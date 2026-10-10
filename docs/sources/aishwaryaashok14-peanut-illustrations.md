# aishwaryaashok14/peanut-illustrations

- **Link:** https://github.com/aishwaryaashok14/peanut-illustrations
- **License:** MIT. GitHub shows "NOASSERTION" only because the license file has extra text.
- **Attribution chain** (keep both notices if we adapt it):
  - "Copyright (c) 2026 Aishwarya Ashok"
  - "Copyright (c) 2026 Ian" — the upstream repo, [helloianneo/ian-xiaohei-illustrations](https://github.com/helloianneo/ian-xiaohei-illustrations): MIT, about 12.5k stars, Chinese, starring the 小黑 (Xiaohei) character.
  - `NOTICE.md` also asks us to credit the Peanut Illustrations name and keep the upstream credit. This isn't legally binding, but we should honour it.
- **Status (2026-10-10):** 5 stars, created June 2026.
- **Type:** one skill folder, `peanut-illustrations`, plus a Codex `agents/openai.yaml`. It has no Claude plugin manifest; install is a manual `cp -R`.

## What it does

It turns a short idea into **one** 16:9 hand-drawn concept illustration starring a deadpan peanut.

- **Image generation:** relies on the agent's **built-in image tool**, which is Codex's `image_gen`. Claude Code has no built-in image tool, so on Claude this skill produces nothing until an image provider is added.
- **Watermark:** `scripts/add_watermark.py` adds it with Pillow. Font paths are macOS-only, so on Windows it falls back to a poor default font.
- **Output:** PNG files in `assets/<slug>-illustrations/`.
- **Size:** most of the 14 MB is 7 example PNGs, which carry the author's watermark and character. Link to them; don't bundle them.

## The reusable method (the valuable part)

### Compose before generating

Decide the metaphor, the character's action, 3–8 labels, the layout and the watermark margin. Then generate exactly one image.

### Eight structure types

Workflow, system slice, before/after, character state, concept metaphor, layered method, map/route, mini comic.

### Metaphor recipe

Turn the idea into a physical action → pick one low-tech object → give the action to the character. Use a new metaphor every time.

### Removal test

If the image still works with the character removed, the character is only decoration.

### Character consistency

Every prompt repeats a fixed form description plus "personality" and "don't" lists. This is text only, with no reference image, so the character drifts between images.

### Style rules

- Pure white background
- Wobbly black lines
- One accent colour
- At least 35% whitespace
- No title in the top-left

### QA

A checklist plus ready-made edit prompts for fixing results.

## Proposed use

**adapt (method only).** Generalize it into a **"concept illustration with a recurring mascot"** skill:

- The user supplies the character sheet and the accent colour.
- Ship a neutral default character, **not** the peanut or Xiaohei, since each is its author's personal brand.
- Use reference images through the provider layer to keep the character consistent.
- Fix the watermark font paths for Windows.
