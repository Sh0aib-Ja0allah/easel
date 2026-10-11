# easel-design

Graphic, UI and brand design made in code (HTML, CSS, SVG), rendered offline to exact pixels by
the easel-core engine, measured (clipped text, contrast, frame overflow) and critiqued before
delivery.

**Status:** in development for v0.3.0 (Phase 3; see [the roadmap](../../docs/roadmap.md)).

**Requires:** `easel-core` (installed automatically as a dependency). An AI raster (a photo, a
painting) is only used when the user asks for one and `easel-ai-media` is installed.

## Skills

| Skill | Use it for |
|---|---|
| `/easel-design:design` | Anything design without a clear type; product mockups and one-off graphics |
| `/easel-design:social-graphic` | Posts, stories, carousels, thumbnails, OG images, headers, banners |
| `/easel-design:poster` | Posters, flyers, print (PDF with bleed), art prints |
| `/easel-design:ad-creative` | Display ads in every size, paid social, HTML5 ads, A/B variants |
| `/easel-design:infographic` | Data, processes, timelines and comparisons made visual |
| `/easel-design:presentation` | Slide decks and pitch decks (HTML to PDF) |
| `/easel-design:ui-design` | Screens, components, mobile UI, cards, dark mode, dashboards |
| `/easel-design:landing-page` | Landing pages and hero sections |
| `/easel-design:design-system` | Palettes, type scales, spacing, tokens, themes, a starting system |
| `/easel-design:brand-identity` | A whole identity in phases, ending in a brand kit |
| `/easel-design:logo` | Logos, wordmarks, favicons, app icons (SVG, checked at 16 px) |
| `/easel-design:icons` | Icon sets on one grid and stroke |
| `/easel-design:directions` | Less generic: 3-5 structurally different directions, keep or kill |

## What's here

| Folder | What it is |
|---|---|
| `skills/<name>/` | Each skill's procedure (`SKILL.md`) and its reference files |
| `systems/` | Ten generic design systems in DESIGN.md format (no real brands) |
| `tools/palette.mjs` | OKLCH shade scales (50-950) with contrast per step: `node tools/palette.mjs --from "#2563eb" --css` |
| `examples/` | A finished example per skill, rendered and checked by the tests (`examples/manifest.json`) |
| `evals/` | Routing evals (see its README) |

## Install

```text
/plugin install easel-design --marketplace Sh0aib-Ja0allah/easel
```

On Claude Code older than 2.1.275, add the marketplace first:
`/plugin marketplace add Sh0aib-Ja0allah/easel`, then `/plugin install easel-design@easel`.

Licences: MIT; adapted material is listed in [NOTICE.md](NOTICE.md).
