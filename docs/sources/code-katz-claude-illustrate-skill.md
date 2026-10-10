# code-katz/claude-illustrate-skill

- **Link:** https://github.com/code-katz/claude-illustrate-skill
- **License:** MIT ("Copyright (c) 2026 Will Curran (Code Katz)"). It credits neonwatty/logo-designer-skill, designrique/ai-graphic-design-skill and jezweb/claude-skills as inspiration, and says it copied no text from them.
- **Status (2026-10-10):** 1 star, created July 2026.
- **Type:** a bare skill folder (`illustrate`). It has no plugin manifest.

## What it does

It makes brand assets: logos, wordmarks, favicons, icon sets, illustrations and marketing graphics. It can also answer questions about which AI image tool to use and about IP and licensing.

### Workflow

1. **Sort the request.** Classify it as a vector mark, a raster illustration, or a composed layout.
2. **Write a brief.** Record the smallest size it will be used at, whether it needs a single-colour version, the hex palette, and the font licenses.
3. **Draft concepts.** Write 3–5 SVG concepts that are structurally different from each other.
4. **Check them.** Render a contact sheet showing each concept at sizes from 16 px to 512 px, on light and dark backgrounds.
5. **Refine.** Name the single worst failure and fix it. Stop after 3 passes at most.
6. **Export.** Produce the SVG, the PNGs and a mono variant, plus a provenance row recording where the asset came from.

## Tooling

- **Renderer:** headless Chromium using its `--screenshot` flag, with `rsvg-convert` as a fallback.
- **Platforms:** the scripts are bash `printf` and `sed`. The README says macOS and Linux only.

### Raster backends (documented)

| Backend | Access | Notes |
|---|---|---|
| Recraft | Remote MCP, OAuth | Paid per image. The only one that returns true vector paths. |
| Hugging Face | MCP, anonymous or `HF_TOKEN` | FLUX via Spaces. Free tier is rate-limited. Weak at text. |
| Canva | MCP, OAuth | Brand kits and autofill need Canva Enterprise. |
| Figma | Official plugin, remote server, or desktop server | Needs a paid Dev or Full seat. |

## Keep

- **Asset-class routing:** sorting each request into vector, raster or layout before starting.
- **Brief template.**
- **Several distinct concepts** rather than one draft.
- **The contact sheet,** showing each concept across a range of sizes on light and dark.
- **The provenance manifest.**
- **The IP and licensing guide.**
- **Chromium pitfalls:**
  - `--window-size` crops an SVG that has `width` and `height` set instead of scaling it.
  - Use inline SVG in the contact sheet, not `<img>`.
  - Use `--virtual-time-budget` so the page finishes rendering before the screenshot.

## Gaps

- Thin on illustration craft.
- No animation.
- Unix-only scripts.

## Proposed use

**adapt.** Make it the core of **logo, icon and brand-mark design**, and run its contact sheet on our Playwright engine. Move the backend notes into the provider-layer docs.
