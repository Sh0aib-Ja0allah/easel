# Easel

> **Status: v1.0.0.** Six plugins, each tagged `<plugin>--v1.0.0`. Tested on Windows, macOS and
> Linux (CI, including a clean install of the marketplace). easel-ai-media's live provider calls
> and easel-pixel's drawing in Aseprite run on your own keys and app; the project tests them with
> recorded responses and a stand-in, not live.

Easel is a Claude Code plugin marketplace for visual and creative work: animation, illustration,
drawing, video and design. It brings together and adapts the best open-source Claude Code plugins
and skills into one set: every skill renders its work offline, looks at it, measures it and has it
critiqued before calling it finished, and credits its sources. It runs on Windows, macOS and
Linux.

## Plugins

| Plugin | What it does | Needs |
| --- | --- | --- |
| `easel-core` | Planning check-ins, brand context, the offline render engine (MCP server), music and sound, the critic agent and craft rules | Node 20+, ffmpeg; Chromium is installed on first use |
| `easel-motion` | Code-drawn animation and video in every format, a style catalog, explainer grammars, style matching, UI motion | `easel-core` |
| `easel-design` | Graphics, posters, social, ads, infographics, decks, UI, landing pages, design systems, brand identities, logos, icons | `easel-core` |
| `easel-illustrate` | SVG for UI and charts, lit SVG illustration, concept sketches with a mascot, p5.js generative art | `easel-core` |
| `easel-ai-media` | AI images, narrated AI video and voice through your own provider keys, with a cost estimate before anything is spent | `easel-core`, your API key(s), ffmpeg |
| `easel-pixel` | Pixel art in your own Aseprite: draw, shade, animate, export | `easel-core`, Aseprite (paid) |

## Install

```text
/plugin marketplace add Sh0aib-Ja0allah/easel
/plugin install easel-core@easel
/plugin install easel-motion@easel
```

Then run `/easel-core:setup` once: it checks Node and ffmpeg and installs the render engine's
browser into the plugin's data folder. Each plugin's README says what else it needs.

## Docs

- **Each plugin's README** (what it does, its skills, what it needs):
  [easel-core](plugins/easel-core/README.md), [easel-motion](plugins/easel-motion/README.md),
  [easel-design](plugins/easel-design/README.md), [easel-illustrate](plugins/easel-illustrate/README.md),
  [easel-ai-media](plugins/easel-ai-media/README.md), [easel-pixel](plugins/easel-pixel/README.md).
- [Gallery](docs/gallery.md): examples Easel made, rendered and checked by its tests.
- [CHANGELOG](CHANGELOG.md) and [third-party notices](THIRD_PARTY_NOTICES.md).
- [Handoff](docs/HANDOFF.md): current state, decisions, hard rules, verified plugin facts.
- [Vision](docs/vision.md), [Roadmap](docs/roadmap.md), [Tasks](docs/tasks.md).
- [Architecture](docs/architecture.md): repo layout, how plugins share code, the render engine,
  the provider layer, data formats, Windows requirements.
- [Skill catalog](docs/skill-catalog.md): every skill and agent, with its sources.
- [Sources](docs/sources.md) and [findings and decisions](docs/findings-and-decisions.md).

## Credits

Easel adapts the work of these authors and projects (exact files, commits and licence texts are in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and each plugin's `NOTICE.md`):

- cth9191, [animate](https://github.com/cth9191/animate): the animate kit, styles, story grammars
  and check-ins.
- alchaincyf, [huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion): explainer
  grammars, style recipes, film gates.
- Vincentwei1021, [mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15): rubric ideas and
  four screen-style looks.
- GreenSock, [gsap-skills](https://github.com/greensock/gsap-skills): the official GSAP skills.
- Arnav Puri, [designskills](https://github.com/ArnavPuri/designskills): design references, the
  palette tool, critique and motion ideas.
- Anthropic, [skills](https://github.com/anthropics/skills) (Apache-2.0): canvas-design,
  theme-factory, algorithmic-art.
- Open Design contributors, [open-design](https://github.com/nexu-io/open-design) (Apache-2.0):
  the craft rulebooks; Refero, [refero_skill](https://github.com/referodesign/refero_skill).
- Will Curran (Code Katz), [claude-illustrate-skill](https://github.com/code-katz/claude-illustrate-skill):
  the logo method and illustration routing.
- svg-skill contributors, [svg-skill](https://github.com/linyaosky/svg-skill), and SVG Creator
  Skill Contributors, [svg-creator-skill](https://github.com/upbrew-tech/svg-creator-skill)
  (Apache-2.0): the SVG skills.
- Aishwarya Ashok, [Peanut Illustrations](https://github.com/aishwaryaashok14/peanut-illustrations),
  and Ian, [ian-xiaohei-illustrations](https://github.com/helloianneo/ian-xiaohei-illustrations):
  the concept-illustration method (their characters are not used).
- Alisa Qian, [vox-director](https://github.com/Alisa0808/vox-director): the AI video pipeline.
- with-pebbly, [aseprite-ai-artist](https://github.com/with-pebbly/aseprite-ai-artist): the pixel
  skills, agents and the Aseprite bridge.
- HeyGen, [HyperFrames](https://github.com/heygen-com/hyperframes): the composition format the
  renderer reads (no code included).
- Fonts under the SIL Open Font License, listed in THIRD_PARTY_NOTICES.md.

Easel is not affiliated with Aseprite or Igara Studio, with any AI provider, or with any of the
projects above.

## License

Easel's own code and docs are released under the [MIT License](LICENSE). Adapted third-party
material keeps its original license: Apache-2.0 material ships with its license text, its notices
and a "Modified by Easel" header in every changed file.
