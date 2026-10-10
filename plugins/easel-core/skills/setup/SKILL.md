---
name: setup
description: >-
  Check and install what Easel needs to render: Node, the Playwright Chromium headless shell and
  pinned npm packages (installed into the plugin data folder), ffmpeg and ffprobe, plus optional
  Python, Aseprite and provider API keys. Use when the user installs Easel, says "set up easel",
  "easel doctor", "is everything installed", or when any Easel render fails with a missing
  dependency. For brand colours and fonts use easel-core:brand instead.
when_to_use: First run of Easel, render errors that mention Playwright, Chromium, ffmpeg or a missing package, or the user asking whether Easel works on their machine.
allowed-tools: mcp__plugin_easel-core_easel__doctor mcp__plugin_easel-core_easel__render_still mcp__plugin_easel-core_easel__ping
---

# Set up Easel

Easel's engine runs as an MCP server in `easel-core`. Its tools are deferred; load them by their
full names when you need them.

## 1. Check

Call `mcp__plugin_easel-core_easel__doctor` with no arguments. Read every check. Required checks:
`node`, `data dir`, `playwright-core`, `chromium`, `ffmpeg`, `ffprobe`. Optional: `gsap`,
`python (optional)`, `aseprite (optional)`, `provider keys (optional)`.

Report to the user in a short table: what is ready, what is missing, and for each missing item
the `fix` text from the report. Never print API key values; the report only names which keys are
set, and you do the same.

## 2. Install what Easel can install itself

If `playwright-core`, `gsap` or `chromium` are missing:

1. Tell the user what will happen: the pinned npm packages (a few MB) and the Chromium headless
   shell (about 110 MB) will be downloaded into the plugin's data folder (shown as `dataDir` in
   the report). Nothing is installed system-wide.
2. Ask for a yes. Then call `mcp__plugin_easel-core_easel__doctor` with `{"install": true}`.
   It can take a minute or two.

## 3. Guide what the user must install

- **ffmpeg / ffprobe:** give the `fix` command for their OS (Windows:
  `winget install --id Gyan.FFmpeg -e`; macOS: `brew install ffmpeg`; Linux: their package
  manager). On Windows they must restart Claude Code afterwards so it sees the new PATH. If the
  report says ffmpeg was "found ... not on PATH", Easel will still use it; suggest the restart.
- **Aseprite** is only for `easel-pixel` and is a paid app; Easel is not affiliated with it.
- **Provider keys** are only for `easel-ai-media`. Point the user to `easel-ai-media:providers`
  rather than asking them to paste keys into the chat.

## 4. Prove it works

Run `mcp__plugin_easel-core_easel__doctor` again and confirm every required check is `ok`. Then
render a one-line test page with `mcp__plugin_easel-core_easel__render_still`:

```json
{ "html": "<html><body style=\"margin:0;display:grid;place-items:center;height:100vh;background:#f4efe6;font:700 48px 'Space Grotesk'\">Easel is ready</body></html>", "width": 800, "height": 400, "slug": "easel-setup-check" }
```

Open the PNG it returns with Read and confirm the text shows in Space Grotesk. Tell the user
where it was saved (`./easel-out/easel-setup-check/`).

## Troubleshooting

- `chromium` still missing after install: run install again; corporate proxies may block the
  download; set `HTTPS_PROXY` before starting Claude Code.
- Fonts look like a fallback: the bundled fonts load from `https://easel.local/fonts/`; check the
  render's `warnings` for blocked requests.
- A render reports "Blocked network requests": renders are offline on purpose. Put assets next
  to the page or use the bundled fonts and libraries.
