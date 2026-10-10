# Spike T0.5: Windows toolchain

> Run: 2026-10-11 on the owner's Windows 11 machine (Node v22.21.0, npm 10.9.4, ffmpeg 9.0.2 from
> `winget install --id Gyan.FFmpeg -e`). Script: [`spikes/windows/spike.mjs`](../../spikes/windows/spike.mjs).
> Runner jobs `009-t05-spike` and `010-t05-rerun` (the rerun tightened two probes; both green).

## Answer

**The toolchain works on Windows**, including a data folder with spaces and output paths over 260
characters, with `LongPathsEnabled = 0`. **Recommendation:** build `doctor` exactly as simulated
here: npm-install `playwright-core` (pinned) into `${CLAUDE_PLUGIN_DATA}`, install Chromium into
`${CLAUDE_PLUGIN_DATA}/ms-playwright` via `PLAYWRIGHT_BROWSERS_PATH`, import Playwright from that
folder with a `file://` URL, and detect ffmpeg on PATH with a per-OS install message.

## Results

| Check | Result | Time |
|---|---|---|
| `npm install --prefix "<...\plugin data with spaces\easel-core>" playwright-core@1.64.0 @fontsource/inter@5.2.8` | OK | 3.5 s |
| `node <data>/node_modules/playwright-core/cli.js install chromium` with `PLAYWRIGHT_BROWSERS_PATH=%LOCALAPPDATA%\easel\ms-playwright` | OK: `chromium-1248`, `chromium_headless_shell-1248`, `ffmpeg-1013`, `winldd-1007` | 58 s (first run) |
| ffmpeg on PATH | `ffmpeg version 9.0.2-full_build-www.gyan.dev` | 0.2 s |
| ffmpeg missing (PATH emptied) | message: `ffmpeg was not found on PATH. Install it with: winget install --id Gyan.FFmpeg -e  (then open a new terminal)` | - |
| `import()` of `<data>/node_modules/playwright-core/index.mjs` via `pathToFileURL` | OK | 0.7 s |
| Bundled OFL font (Inter Bold woff2 next to the page, `@font-face`, page path with spaces) | `document.fonts.check` true, face `loaded`; inline width 453.7 px vs 457.4 px fallback; screenshot shows Inter vs monospace (checked by eye) | 0.8 s |
| 30 canvas frames via `window.renderAt(t)` into a 333-char folder with spaces, then `ffmpeg -framerate 30 ... -c:v libx264` there | OK: MP4 written, full path 354 chars | 2.7 s |
| `/tmp` | `C:\tmp` listing identical before and after; `os.tmpdir()` resolves to `%TEMP%` | - |

## Windows issues found and their fixes

1. **Spawning `npm`/`npx` needs `shell: true` on Windows.** Since Node 20.12 (CVE-2024-27980),
   `spawn` refuses `.cmd`/`.bat` files without a shell. Paths passed through the shell must be
   quoted. The engine should prefer `process.execPath` + a `.js` entry (as done for the Playwright
   CLI) and only shell out for npm.
2. **A user-scope winget install changes the *user* PATH only.** A process started earlier (a
   Claude Code session, our runner) keeps the old PATH until restarted. `doctor` should say "open a
   new terminal / restart Claude Code" after installing ffmpeg, and may also look in
   `%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg_*\*\bin` as a fallback.
3. **Windows PowerShell 5.1 `>` writes UTF-16 LE.** Irrelevant to the plugin (Node writes files),
   but any doc or script that tells users to redirect output must not rely on it.
4. **Long paths:** Node's fs, Playwright's screenshot writer and ffmpeg 9 all handled a 354-char
   path with `LongPathsEnabled = 0`. Chromium itself was not asked to *load* from a >260 path; pages
   are loaded from the job folder `./easel-out/<slug>/`, which stays short. Keep it that way.
5. **Download size:** the `chromium` install fetches both full Chromium and the headless shell
   (~280 MB on disk). `doctor` should tell the user before downloading. A later optimisation is
   `install --only-shell` once its flag is confirmed for the pinned version.

## Not covered here

- macOS and Linux: the CI matrix (T1.6) runs the engine smoke test on all three.
- A fresh `CLAUDE_PLUGIN_DATA` from a real install: T1.1 `doctor` uses the real variable.
