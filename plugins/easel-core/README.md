# easel-core

The shared foundation every other Easel plugin depends on: the render engine (an MCP server and a
CLI), measured quality gates, shared data formats, craft rulebooks and critique rubrics, and five
skills.

## Skills

| Skill | Use it to |
|---|---|
| `/easel-core:setup` | Check and install what rendering needs (doctor), then prove it with a test render |
| `/easel-core:brief` | Plan a multi-step job: intake, then story, look and storyboard check-ins |
| `/easel-core:brand` | Create or find `.easel/brand.md`, the brand file every skill reads |
| `/easel-core:critique` | Review rendered work with `qa` measurements and the read-only `critic` agent |
| `/easel-core:score` | Music and sound effects from a cue sheet, synthesized offline and mastered to -14 LUFS |

## Engine tools

Called by skills as `mcp__plugin_easel-core_easel__<tool>`, or from a terminal with
`node engine/cli.mjs <tool> --json @args.json`:

`doctor`, `render_still`, `contact_sheet`, `render_video`, `filmstrip`, `qa`, `validate`,
`audio_score`, `measure_image`, `compare_images`, `craft`, `ping`. Renders are offline and
deterministic: bundled OFL fonts, seeded randomness, every frame seeked to `t = n / fps`. Pages
can be HTML/SVG/CSS, GSAP timelines (HyperFrames format), `renderAt(t)` or animate-kit canvas
pieces (`renderFrame(t)`).

## Requirements

- Node.js 20 or newer
- ffmpeg and ffprobe on PATH (Windows: `winget install --id Gyan.FFmpeg -e`)
- Playwright's Chromium headless shell and pinned npm packages: installed by
  `/easel-core:setup` into the plugin's data folder (about 120 MB, asked first)

## Install

```text
/plugin install easel-core --marketplace Sh0aib-Ja0allah/easel
```

On Claude Code older than 2.1.275, add the marketplace first:
`/plugin marketplace add Sh0aib-Ja0allah/easel`, then `/plugin install easel-core@easel`.
