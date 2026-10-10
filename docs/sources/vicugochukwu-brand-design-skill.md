# VicUgochukwu/brand-design-skill

- **Link:** https://github.com/VicUgochukwu/brand-design-skill
- **License:** ⚠️ **None.** The README says "MIT", but the repo has no LICENSE file and the API license field is null. That makes it all rights reserved by default.
  - **Ideas only.** We can't copy its text.
- **Status (2026-10-10):** 5 stars, created and last pushed 2026-02-26. The repo has 2 files.
- **Type:** a Claude Code slash command, `.claude/commands/brand-design.md`.

## What it does

It makes on-brand LinkedIn graphics: carousels, banners and article images.

- **Output:** Claude writes **one self-contained HTML file** containing inline CSS brand tokens, Google Fonts and inline SVG.
- **Export:** happens in the browser, using html2canvas and jsPDF loaded from a CDN. It needs no API keys.
- **Hosting:** the file has to be served from localhost, because `file://` blocks the CDN scripts.
- **Other tools:** it sends quick diagrams to the Figma MCP (`generate_diagram`) and mentions the Canva MCP.

## Ideas worth re-implementing (our own words)

### LinkedIn format specs

| Format | Size (px) |
| --- | --- |
| Carousel | 1080 × 1080 |
| Article image | 1080 × 607 |
| Banner | 1584 × 396 |
| Infographic | 1080 × 1350 |

### Mobile readability

- On a phone, LinkedIn shows the canvas at roughly a third of its size.
- So set minimum font sizes: body text at least 18 px, labels at least 12 px.

### Carousel rules

- Alternate dark and light slides.
- Put one idea on each slide.
- Upload the carousel as a **multi-page PDF**, ideally 5–10 pages.

### Export gotcha

html2canvas only supports 2D CSS transforms.

## Proposed use

**reference only.** Put the format specs and readability rules into our own social-media graphic skill, written in our own words. Export through our Playwright engine instead of html2canvas, so no CDN and no localhost server are needed.
