# Notices for easel-pixel

easel-pixel is MIT licensed (see [LICENSE](LICENSE)). Easel is not affiliated with, endorsed by or
sponsored by Aseprite or Igara Studio; Aseprite is a trademark of Igara Studio S.A. and a paid app
the user buys and installs. Easel is also not affiliated with with-pebbly.

## with-pebbly/aseprite-ai-artist (MIT)

- **Used at run time, not redistributed:** the npm package `@pebbly/aseprite-ai-artist`, pinned to
  version `0.8.0`, is the Aseprite bridge and MCP server. `server/launch.mjs` installs that exact
  version into the plugin data folder on first use (install scripts off) and runs it with its
  `run_lua` MCP tool switched off. The package's local bridge itself has no authentication and
  still accepts Lua from other programs on the same computer while it runs (see README).
- **Adapted (headers in each file):** the four skills (`skills/pixel` from its studio skill;
  `pixel-draw` from draw, shade, new and palette; `pixel-animate` from rig and animate;
  `pixel-export` from export and tileset), the three agents (`animation-director`,
  `palette-smith`, `rig-builder`) and the hook scripts in `hooks/` (with matchers rewritten for
  Easel's tool names), from [with-pebbly/aseprite-ai-artist](https://github.com/with-pebbly/aseprite-ai-artist)
  at commit `f51fe6908223ef9ac476de1568234c699594722d` (package version 0.8.0).
  Copyright (c) 2026 with-pebbly. MIT License (text below). Easel's changes: tool names, setup through the launcher
  (no npx), palettes and looks described by their colours instead of trademarked names, critique
  through easel-core's critic, output to `./easel-out/<slug>/`.
- `test/pebbly-tools.json` and `evals/mocks/aseprite/_tools.json` list the package's tool names and
  descriptions as read from its source at that commit (JSON holds no header, so they are named
  here); the eval mocks use them.

## Easel's own

`server/launch.mjs`, the tests and the stand-in package in `test/fixtures/` are Easel's own work
under the MIT License.

## The MIT License (text, for each MIT source above)

```
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute,
sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or
substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
