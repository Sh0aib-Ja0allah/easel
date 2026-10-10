# alchaincyf/huashu-art-motion

- **Link:** https://github.com/alchaincyf/huashu-art-motion
- **License:** MIT, with exclusions. See [License notes](#license-notes).
- **Status (2026-10-10):** about 3.2k stars, pushed today, has a CHANGELOG, and CI includes a Windows render smoke test.
- **Type:** a standalone skill, installed with `npx skills add`. It is **not** a Claude Code plugin. Docs, code comments, CLI messages and file names are all in **Chinese**.

## What it does

Claude writes Canvas JS that paints in a chosen art style. Headless Chromium renders it frame by frame, and ffmpeg encodes the frames to video. There are two paths:

- **"Open" path:** for Opus 5.5 or stronger models.
- **"Rail" path:** a fixed sequence of steps for weaker models.

### Rail path

1. Write a shot table that locks the style, the palette and whether there is a character. `storyboard_lint.py` must pass before any code is written.
2. Write each shot as either a JSON-spec clip (`render.py --spec`, up to 8 s) or a style scene JS file.
3. Join the shots with ffmpeg.
4. Run `qa.py`, then an independent review agent.
5. Run `deliver.py`. Its `film_gate.py` blocks delivery if the film:
   - looks "PPT-like" (no fast motion within shots),
   - has blank stretches, or
   - is more than 30% blue-purple frames.

### Other features

- Break down a reference video (`analyze/breakdown.py`).
- Music synthesized in code.
- AI-generated character frames composited by code.
- "Long-scroll" films where a character walks through paintings.

## Content

### 35 art styles

| Group | Styles |
|-------|--------|
| Ancient | Cave, Egyptian, Greek black-figure, Pompeii mosaic |
| Medieval to Renaissance | Gothic illuminated, Renaissance sfumato, Rembrandt |
| 19th century and modernism | Impressionism, Monet, Seurat, Van Gogh, Munch, Mucha Nouveau, Klimt, Cubism, Bauhaus, Constructivism, Matisse cut-outs, Picasso Blue, Dalí, Hopper |
| Asian traditions | Chinese ink, Dunhuang, Shadow puppet |
| Pop and illustration | Lichtenstein Pop, Jack Kirby comics, Haring, Kusama, Rubber-hose |
| Anime | Ghibli watercolor, Shinkai light |
| Digital | 8-bit, early raytrace CGI, Vaporwave, 2026 flat illustration |

### 9 explainer grammars

Kurzgesagt, Vox collage, Whiteboard/RSA, Storytime, Kinetic type, 3Blue1Brown, Keynote UI, Finance chart, Presenter. The Presenter grammar is only a card and code snapshot; it has no rendered clip.

### Code libraries

17 libraries, including brush, render, post, camera, motion, chart, collage and transitions.

## Dependencies

- **Required:** uv, Python, ffmpeg/ffprobe, Playwright Chromium. Node is not needed.
- **Voice (optional), one of:**
  - Volcengine Doubao voice clone (China-only, needs `VOLC_SPEECH_*` keys)
  - macOS `say`
  - existing recordings
- **Image generation:** no image API is built in. Generation is handed to whatever tool the host offers.
- **Windows:** mostly works but needs `PYTHONUTF8=1`. Paths are in Chinese, and the docs use POSIX shell commands.

## Output

- **Video:** MP4 (H.264; 60 fps for films, 30 fps for clips), and ProRes 4444 `.mov` with alpha.
- **Stills:** PNG.
- **Audio:** WAV with a JSON sidecar.
- **Review material:** comparison JPGs, QA reports, and a delivery note.

## Translation effort: heavy

| Content | Size | Notes |
|---------|------|-------|
| Markdown (Chinese) | about 520 KB | 460 KB of it is references |
| JS/Python | about 2.8 MB across 210 files | Chinese comments, CLI messages and file names |
| Fonts | about 20 MB | Mostly CJK. Can be dropped for an English-first plugin. |

The lint script parses Chinese keys (画风 "style", 色板 "palette", 角色 "character"), so translating the docs also means changing the code.

## Keep

- **Quality gates:**
  - the PPT-motion check
  - the AI-look color ban
  - the "six failure modes" checklist
- **Frame-exact clip contract:** the 9-step `--spec` format.
- **Code libraries:** the 17 libraries listed above.
- **Style catalog:** the per-style quality ratings.
- **Video breakdown:** the reference breakdown script.
- **Lessons file:** `07-正面经验.md` ("positive experience", i.e. what worked).

## Gaps and risks

- **Characters:** weak. Rembrandt is rated ★.
- **Sample variety:** all 35 samples use the same room layout.
- **Scope:** Chinese-centric, with a China-only voice service.
- **Size:** very large for a single skill.
- **Claude Code:** never confirmed working; online testing hit a 429 rate limit.

## License notes

- **Not MIT, do not copy:**
  - The Huashu (花叔) character assets: `demos/_shared/hero/`, `long_scroll/frames/`, `assets/角色/`, and the showcase media.
  - `lib/rig_huashu.js`. Avoid it too.
- **Mario showcase:** uses Nintendo imagery and real-person likenesses ("Sam and Dario"). Do not carry it over, and rename the `14_8bit` "Mario-style" recipe.
- **Clawd demo:** labelled a non-MIT fan work (Clawd is Anthropic's mascot).
- **Paintings:** The Met Open Access (CC0), so they are fine to use.
- **`strokes.js`:** Arphic Public License. Fonts are OFL.
- **Credit:** Tak (@cherry_mx_reds) for the concept.
- **Branding risk:** style names tied to living or protected creators (Ghibli, Shinkai, Kusama, Kirby, Haring, Dalí). Rename these descriptively, for example "watercolor anime", "polka-dot pop" or "bold-line street art".

## Proposed use

**adapt.** Use it for the art-style catalog and the explainer grammars, ported into the shared render engine:

- Translate the content to English.
- Remove the excluded assets.
- Rename the creator-tied styles.
- Keep the quality gates.
