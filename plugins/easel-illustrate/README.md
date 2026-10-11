# easel-illustrate

Illustration and drawing made as code: SVG for UI graphics, charts and diagrams, lit SVG scenes and
characters, one-idea concept sketches with a mascot, and p5.js generative art. Everything renders
offline through the easel-core engine, is checked (clipped text, contrast, frame overflow, an SVG
checker) and needs no API key.

**Status:** in development for v0.3.0 (Phase 3; see [the roadmap](../../docs/roadmap.md)).

**Requires:** `easel-core` (installed automatically as a dependency; its doctor installs p5.js for
generative art). Photographic or painted rasters go through `easel-ai-media` when it is installed.

## Skills

| Skill | Use it for |
|---|---|
| `/easel-illustrate:illustrate` | Not sure which kind of picture: it routes |
| `/easel-illustrate:svg` | Icons, UI graphics, charts, diagrams, progress rings, sprites, masks, React/Vue SVG, email-safe SVG |
| `/easel-illustrate:svg-illustration` | Scenes, characters, mascots, spot illustrations with lighting, materials and filters |
| `/easel-illustrate:concept-illustration` | One idea drawn as a deadpan sketch with a mascot (yours, or the default card) |
| `/easel-illustrate:generative-art` | p5.js algorithmic art: a philosophy, a seeded sketch, stills and a seamless loop |

## What's here

| Folder | What it is |
|---|---|
| `skills/<name>/` | Each skill's procedure and references (`generative-art/templates/viewer.html` is the p5.js starting page) |
| `tools/svg-check.mjs` | Checks SVG files before delivery: `node tools/svg-check.mjs <file or folder> [--email]` |
| `examples/` | A finished example per skill, rendered and checked by the tests (`examples/manifest.json`) |
| `evals/` | Routing evals (see its README) |

## Install

```text
/plugin install easel-illustrate --marketplace Sh0aib-Ja0allah/easel
```

On Claude Code older than 2.1.275, add the marketplace first:
`/plugin marketplace add Sh0aib-Ja0allah/easel`, then `/plugin install easel-illustrate@easel`.

Licences: MIT; adapted material is listed in [NOTICE.md](NOTICE.md).
