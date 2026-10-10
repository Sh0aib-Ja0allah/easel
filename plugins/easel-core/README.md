# easel-core

The shared foundation every other Easel plugin depends on: planning check-ins (`brief`), the
shared brand file (`brand`), the render engine (an MCP server plus a CLI), audio (`score`), the
`critique` skill with its read-only `critic` agent, and the craft rulebooks.

**Status:** skeleton (v0.0.1). Nothing to use yet; see [the roadmap](../../docs/roadmap.md).

**Requires:** Node 22+, Playwright Chromium (installed on first run) and ffmpeg.

## Install

```text
/plugin install easel-core --marketplace Sh0aib-Ja0allah/easel
```

On Claude Code older than 2.1.275, add the marketplace first:
`/plugin marketplace add Sh0aib-Ja0allah/easel`, then `/plugin install easel-core@easel`.
