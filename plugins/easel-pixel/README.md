# easel-pixel

Optional pixel-art add-on: sprites, characters, tiles and animation cycles drawn live in your own
Aseprite window (or headless), shaded with palette-legal ramps, critiqued by easel-core's critic
with the pixel rubric, and exported as PNG, GIF, spritesheets with a JSON atlas, or tilesets.

**Status:** v1.0.0 (see [the roadmap](../../docs/roadmap.md)). The
skills, launcher and hooks are tested; drawing end to end with a real Aseprite has not been run by
the Easel project yet (it needs a licensed Aseprite).

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
broken connection. Settings (`/plugin configure easel-pixel`): `headless` (draw with no window)
and `aseprite_path` (needed for headless mode if Aseprite is not found).

## Skills and agents

| Skill | Use it for |
|---|---|
| `/easel-pixel:pixel` | Anything pixel art: connects, briefs, then draws, animates, critiques and exports |
| `/easel-pixel:pixel-draw` | Drawing, shading or recolouring a sprite; palettes |
| `/easel-pixel:pixel-animate` | Rigging and cycles: idle, walk, run, jump, attack, effects |
| `/easel-pixel:pixel-export` | PNG, GIF, spritesheet + atlas, tilesets, into `./easel-out/<slug>/` |

Agents: `animation-director` (key poses and timing), `palette-smith` (palettes),
`rig-builder` (layer rigs). Lua execution in Aseprite stays off.

## Install

```text
/plugin install easel-pixel --marketplace Sh0aib-Ja0allah/easel
```

On Claude Code older than 2.1.275, add the marketplace first:
`/plugin marketplace add Sh0aib-Ja0allah/easel`, then `/plugin install easel-pixel@easel`.

Credits: the skills, agents and hooks are adapted from with-pebbly's aseprite-ai-artist, whose
npm package (`@pebbly/aseprite-ai-artist`) is the bridge to Aseprite.

Licences: MIT; adapted material is listed in [NOTICE.md](NOTICE.md).
