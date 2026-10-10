# Spike T0.4: HyperFrames as the render engine

> Run: 2026-10-11 on the owner's Windows 11 laptop (i5-1135G7, 8 cores, 16 GB, Intel Iris Xe),
> Node v22.21.0, ffmpeg 9.0.2. HyperFrames `hyperframes@0.8.145` (npm, Apache-2.0; repo
> https://github.com/heygen-com/hyperframes at `6c96ea5344341c1648ec5df565eff2c1ba070519`, 60,328 stars).
> Files: [`spikes/hyperframes/`](../../spikes/hyperframes/). Runner jobs `012`-`017`.

## Recommendation: **B, our own Playwright capture loop**, reading the HyperFrames composition format

D7 is decided (see [findings-and-decisions.md](../findings-and-decisions.md)). HyperFrames renders
correctly on Windows and is feature-rich, but five findings make it a poor *dependency* for a
public, privacy-respecting, Windows-first plugin. Our own loop was deterministic on every test,
faster on this machine, and stays on the Playwright stack chosen in D2. We keep HyperFrames'
composition contract (`data-composition-id`, `data-start`/`data-duration`, a paused GSAP timeline
at `window.__timelines.<id>`) as one of our two input contracts, so compositions written for
HyperFrames render in Easel and vice versa.

## What was rendered

Both compositions are original and 1280x720, 5 s at 30 fps; GSAP 3.14.2 loaded from a local file
(no CDN):

- **`comp-canvas`**: a cut-paper style scene on `<canvas>`: five torn-edge paper layers with drop
  shadows and parallax, a rising sun, a bobbing paper boat, seeded paper grain. Drawing is driven
  from a paused GSAP timeline's `onUpdate`; `window.renderAt(t)` is also exposed.
- **`comp-svg`**: an SVG piece animated by a paused GSAP timeline (path draw-on, attribute tweens,
  yoyo) **plus one CSS `@keyframes` animation** (a rotating dashed ring).

Each was rendered by **A** (`hyperframes render`, MP4 and `--format png-sequence`, `--workers 1`)
and by **B** ([`own-loop.mjs`](../../spikes/hyperframes/own-loop.mjs): Playwright opens the page,
seeks `renderAt(t)` or every `__timelines` entry, sets every Web Animation's `currentTime`, takes
a PNG screenshot per frame, then ffmpeg encodes), twice each.

## Results

| | A: HyperFrames 0.8.145 | B: own loop (playwright-core 1.64.0) |
|---|---|---|
| Install | `npm install --ignore-scripts`: 74 packages, **112 MB**, 17 s; native `sharp`, `esbuild` (postinstall), `puppeteer-core` | `playwright-core` only (T0.5), a few MB + Chromium |
| Browser | Puppeteer; found system Chrome and failed (`--version` timed out); worked with `HYPERFRAMES_BROWSER_PATH` = Playwright's `chrome-headless-shell` 1248 | Playwright Chromium headless shell 1248 |
| Canvas, 5 s MP4 | 17.2-21.0 s (workers 1); 19.5 s (workers auto) | 15.1-17.3 s |
| SVG+CSS, 5 s MP4 | 15.3-15.6 s (workers 1); 14.1 s (auto) | 9.1-9.8 s |
| Canvas determinism | **150/150 frames identical**; MP4 SHA identical | **150/150 identical**; MP4 SHA identical |
| SVG+CSS determinism | **0/150 frames identical** (PSNR 35.7 dB run-to-run; the difference is only on the CSS-animated ring, so its CSS seek jitters); MP4 differs | **150/150 identical**; MP4 SHA identical |
| A vs B, same composition | canvas: PSNR 55.0 dB (visually identical; checked by eye on frames 0/75/149) | - |
| Lint | `hyperframes lint`: 0 errors, 0 warnings on both | n/a (we build our own `qa`) |
| Output | `h264 1280x720 30/1 150 frames 5.000 s yuv420p` | same |

## Findings that decided D7

1. **Telemetry is on by default.** The first command created `C:\Users\<user>\.hyperframes\config.json`
   and `install-state.json` with telemetry `enabled` (PostHog), and `doctor` printed "Hyperframes
   collects anonymous usage data". D3 promises no tracking. It can be disabled with
   `HYPERFRAMES_NO_TELEMETRY=1` or `DO_NOT_TRACK=1`, but a dependency that phones home unless every
   call site remembers an env var is a liability. (During this spike, the first `telemetry status`,
   `doctor` and `init` calls ran before the variable was set.)
2. **Writes outside the project:** `~/.hyperframes/`, `<tmpdir>/hyperframes-extract-cache-*`,
   self-verify image pairs in `<tmpdir>`. Our rule is `${CLAUDE_PLUGIN_DATA}` and `./easel-out/`.
3. **CSS animations are not deterministic run to run** (35.7 dB), while D7's whole point was a
   deterministic engine. GSAP- and canvas-driven content was stable.
4. **Second browser stack and heavy native deps.** Puppeteer + `@puppeteer/browsers` beside D2's
   Playwright; `sharp` and `esbuild` native binaries; 112 MB in `${CLAUDE_PLUGIN_DATA}`; the default
   scaffold loads GSAP from jsDelivr.
5. **Moving target, license packaging.** 0.8.x, released daily, and its frame-adapter API is marked
   "experimental v0 API and may change before v1". The npm package ships no LICENSE or NOTICE
   file (the repo has LICENSE, no NOTICE at this SHA), so we would add the Apache-2.0 text ourselves.

## What we take from HyperFrames (ideas and contract, no code copied)

- The composition contract above, so compositions are portable.
- Seek, don't play: frame `n` is rendered at `t = n / fps` with no wall clock.
- `lint` before render, and a capture-readiness check (`__ready`, fonts, media).
- Self-verification of fast capture paths against a screenshot ground truth (PSNR threshold).

Users who want HyperFrames' extra features (cloud render, HLS, captions) can still install it
themselves; Easel compositions follow its format. We do not depend on it.

## Windows notes

- System Chrome detection hung (`chrome.exe --version` killed after the timeout); pointing
  `HYPERFRAMES_BROWSER_PATH` at Playwright's headless shell fixed it.
- `drawElement` fast capture failed its self-check on the canvas piece (23.5 dB < 32 dB) and fell
  back to screenshots automatically; output was still correct.

## License / NOTICE requirements (if we ever ship HyperFrames code)

Apache-2.0: include the license text (`licenses/Apache-2.0.txt`), keep copyright lines, mark
modified files. No NOTICE file exists upstream at the pinned SHA. Nothing from HyperFrames is
copied into Easel by this decision; `THIRD_PARTY_NOTICES.md` credits it for the composition-format
idea only.
