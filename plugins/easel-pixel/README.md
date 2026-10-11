# easel-pixel

> **Preview.** easel-pixel has never been tested end to end with a real Aseprite, and its evals
> scored 0/5 in the v1.0.0 run ([evals-v1.md](../../docs/evals-v1.md): the Aseprite bridge was
> played by the judge model). The preview ends when the owner has run `/easel-pixel:pixel` on
> Windows with a licensed Aseprite 1.3+ (draw a sprite and a walk cycle, live and headless, and
> export a spritesheet) and the evals in [evals/README.md](evals/README.md) pass at or above the
> threshold.

Optional pixel-art add-on: sprites, characters, tiles and animation cycles drawn live in your own
Aseprite window (or headless), shaded with palette-legal ramps, critiqued by easel-core's critic
with the pixel rubric, and exported as PNG, GIF, spritesheets with a JSON atlas, or tilesets.

**Status:** v1.0.0, preview (see [the roadmap](../../docs/roadmap.md)). The skills, launcher and
hooks are tested with a stand-in for the bridge package; drawing end to end with a real Aseprite
has not been run by the Easel project yet (it needs a licensed Aseprite).

**Requires:** `easel-core` (installed automatically), **Aseprite 1.3+** (a paid app you install
yourself) and Node 22.6+ with npm.

Easel is not affiliated with, endorsed by or sponsored by Aseprite or Igara Studio.

## Set up (once)

Ask Claude for pixel art; the `pixel` skill runs the setup step for you:

```text
node "<plugin folder>/server/launch.mjs" setup --data "<plugin data folder>"
```

It installs the pinned bridge, `@pebbly/aseprite-ai-artist` 0.8.0 (MIT, by with-pebbly), into the
plugin's data folder, then its Aseprite extension. Quit and reopen Aseprite, and run `/mcp` to
reconnect the `aseprite` server if its tools are missing. `doctor` instead of `setup` diagnoses a
broken connection and installs nothing (without the bridge it says to run `setup`). Settings
(`/plugin configure easel-pixel`): `headless` (draw with no window) and `aseprite_path` (needed
for headless mode if Aseprite is not found).

## Skills and agents

| Skill | Use it for |
|---|---|
| `/easel-pixel:pixel` | Anything pixel art: connects, briefs, then draws, animates, critiques and exports |
| `/easel-pixel:pixel-draw` | Drawing, shading or recolouring a sprite; palettes |
| `/easel-pixel:pixel-animate` | Rigging and cycles: idle, walk, run, jump, attack, effects |
| `/easel-pixel:pixel-export` | PNG, GIF, spritesheet + atlas, tilesets, into `./easel-out/<slug>/` |

Agents: `animation-director` (key poses and timing), `palette-smith` (palettes),
`rig-builder` (layer rigs).

## Lua and the local bridge: what is switched off, and what is not

The launcher always sets `ASEPRITE_AI_ALLOW_LUA=0`. That only keeps the package's `run_lua` tool
out of the `aseprite` MCP server, so Claude cannot call it. It does not lock the bridge:

- The pinned package starts a separate bridge process that listens on this computer only
  (127.0.0.1; port 9931 for the Aseprite extension, 9932 for clients). It has no password and does
  not check who connects, and the Aseprite extension carries out whatever the bridge forwards,
  including Lua scripts (`lua.run`) and exports to any path.
- So while the bridge runs and Aseprite is open with the extension, **any program on your
  computer can send Aseprite commands through it, Lua included** (Lua in Aseprite can read and
  write your files). A web page open in your browser may be able to as well, depending on the
  browser. Other computers cannot reach it.
- Run it only while you draw: close Aseprite when you are done, and the bridge has nothing to
  forward to. The bridge itself outlives Claude Code (it is detached, so an MCP restart does not
  drop Aseprite); to stop it, end the `node` process whose command line ends in `cli.js bridge`
  (Task Manager on Windows) or restart the computer. If you stop using easel-pixel, remove the
  extension in Aseprite (Edit > Preferences > Extensions).

Easel does not change the upstream package; a bridge with authentication would have to come from
it.

## Install

```text
/plugin install easel-pixel --marketplace Sh0aib-Ja0allah/easel
```

On Claude Code older than 2.1.275, add the marketplace first:
`/plugin marketplace add Sh0aib-Ja0allah/easel`, then `/plugin install easel-pixel@easel`.

Credits: the skills, agents and hooks are adapted from with-pebbly's aseprite-ai-artist, whose
npm package (`@pebbly/aseprite-ai-artist`) is the bridge to Aseprite.

Licences: MIT; adapted material is listed in [NOTICE.md](NOTICE.md).
