---
type: fixed
---

{
  "ok": false,
  "engine": "0.0.1",
  "platform": "win32-x64",
  "node": "v22.21.0",
  "dataDir": "C:\\Users\\user\\.claude\\plugins\\data\\easel-core",
  "checks": [
    { "name": "node", "ok": true, "required": true, "detail": "v22.21.0" },
    { "name": "data dir", "ok": true, "required": true, "detail": "C:\\Users\\user\\.claude\\plugins\\data\\easel-core" },
    { "name": "playwright-core", "ok": false, "required": true, "detail": "not installed", "fix": "Run doctor with install: true (or /easel-core:setup)." },
    { "name": "chromium", "ok": false, "required": true, "detail": "missing", "fix": "Run doctor with install: true. It downloads Chromium headless shell (about 110 MB) into the plugin data folder." },
    { "name": "ffmpeg", "ok": false, "required": true, "detail": "not found", "fix": "ffmpeg was not found. Install it with: winget install --id Gyan.FFmpeg -e   then restart Claude Code so it sees the new PATH." },
    { "name": "ffprobe", "ok": false, "required": true, "detail": "not found", "fix": "ffprobe was not found. Install it with: winget install --id Gyan.FFmpeg -e   then restart Claude Code so it sees the new PATH." },
    { "name": "provider keys (optional)", "ok": false, "required": false, "detail": "none set", "fix": "Only needed for easel-ai-media." }
  ]
}
