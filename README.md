# Easel

> **Status: planning.** There's no installable plugin yet. This repo currently holds only the planning docs.

Easel is a Claude Code plugin marketplace for visual and creative work:

- Animation
- Illustration
- Drawing
- Video creation
- Design

It brings together and adapts the best open-source Claude Code plugins and skills into one set. Every skill follows the same structure and quality bar, and credits its sources.

## Planned plugins

| Plugin | What it does | Needs |
| --- | --- | --- |
| `easel-core` | Planning, brand context, render engine, audio, critic, craft rules, AI provider layer | Node, Playwright, ffmpeg |
| `easel-motion` | Code-drawn animation and video, style catalog, explainer formats, UI motion | `easel-core` |
| `easel-design` | Graphics, UI, social, posters, decks, design systems, logos and icons | `easel-core` |
| `easel-illustrate` | SVG illustration and characters, concept illustrations, generative art | `easel-core` |
| `easel-ai-media` | AI-generated images, video and voice, using your own API key | API key(s) |
| `easel-pixel` | Pixel art in Aseprite | Aseprite (paid) |

Once released, installing will look like this:

```text
/plugin marketplace add Sh0aib-Ja0allah/easel
/plugin install easel-core@easel
/plugin install easel-motion@easel
```

## Planning docs

- [Vision](docs/vision.md): what Easel is, who it's for, goals and non-goals.
- [Sources](docs/sources.md): every repo we draw from, with its license and how we plan to use it. One detailed note per repo is in [docs/sources/](docs/sources/).
- [Findings and decisions](docs/findings-and-decisions.md): overlaps between sources, gaps, legal items, and the decisions made so far.
- [Skill catalog](docs/skill-catalog.md): every planned skill, agent and shared library for each plugin, with its sources.
- [Architecture](docs/architecture.md): repo layout, manifests, how plugins share code, the render engine, the provider layer, data formats, and Windows requirements.
- [Roadmap](docs/roadmap.md): phases 0–5, from foundations and spikes to v1.0.0.
- [Tasks](docs/tasks.md): tasks for each phase, with IDs, completion checks and dependencies.
- [Third-party notices (draft)](docs/third-party-notices-draft.md): copyright lines and obligations for each source.

## Credits

Easel adapts work from several open-source projects. Each one is listed with its license in [docs/sources.md](docs/sources.md). Full copyright notices will be in `THIRD_PARTY_NOTICES.md` once code is added.

## License

To be decided.
