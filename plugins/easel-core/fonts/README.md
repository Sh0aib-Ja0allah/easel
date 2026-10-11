# Bundled fonts

Renders never load fonts from the network. These faces ship with `easel-core` and every rendered
page can use them by family name; the engine serves them at `https://easel.local/fonts/<file>` and
injects the `@font-face` rules from [`fonts.json`](fonts.json).

| Family | Use | Weights | Upstream | License |
|---|---|---|---|---|
| Inter | UI and body sans | 400, 700 | https://github.com/rsms/inter - Copyright 2016 The Inter Project Authors | SIL OFL 1.1 ([inter/OFL.txt](inter/OFL.txt)) |
| Newsreader | editorial serif | 400, 700 | https://github.com/productiontype/Newsreader - Copyright 2020 The Newsreader Project Authors | SIL OFL 1.1 ([newsreader/OFL.txt](newsreader/OFL.txt)) |
| JetBrains Mono | code and data | 400, 700 | https://github.com/JetBrains/JetBrainsMono - Copyright 2020 The JetBrains Mono Project Authors | SIL OFL 1.1 ([jetbrains-mono/OFL.txt](jetbrains-mono/OFL.txt)) |
| Space Grotesk | display sans | 400, 700 | https://github.com/floriankarsten/space-grotesk - Copyright 2020 The Space Grotesk Project Authors | SIL OFL 1.1 ([space-grotesk/OFL.txt](space-grotesk/OFL.txt)) |

The files are the Latin subsets (weights 400 and 700) published by Fontsource
(`@fontsource/<family>@5.3.0` on npm), redistributed as Fontsource ships them. Subsetting makes
them "Modified Versions" under the OFL, which is allowed; it only forbids using a Reserved Font
Name for a modified version. None of these four families declares a Reserved Font Name. (Source
Serif 4 was bundled first and replaced on 2026-10-11 because it reserves the name "Source".)
Each family's `OFL.txt` is the license file shipped in its Fontsource package.
