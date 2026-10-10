# Bundled fonts

Renders never load fonts from the network. These faces ship with `easel-core` and every rendered
page can use them by family name; the engine serves them at `https://easel.local/fonts/<file>` and
injects the `@font-face` rules from [`fonts.json`](fonts.json).

| Family | Use | Weights | Upstream | License |
|---|---|---|---|---|
| Inter | UI and body sans | 400, 700 | https://github.com/rsms/inter - Copyright 2016 The Inter Project Authors | SIL OFL 1.1 ([inter/OFL.txt](inter/OFL.txt)) |
| Source Serif 4 | editorial serif | 400, 700 | https://github.com/adobe-fonts/source-serif - Copyright 2014-2023 Adobe (http://www.adobe.com/), with Reserved Font Name 'Source' | SIL OFL 1.1 ([source-serif-4/OFL.txt](source-serif-4/OFL.txt)) |
| JetBrains Mono | code and data | 400, 700 | https://github.com/JetBrains/JetBrainsMono - Copyright 2020 The JetBrains Mono Project Authors | SIL OFL 1.1 ([jetbrains-mono/OFL.txt](jetbrains-mono/OFL.txt)) |
| Space Grotesk | display sans | 400, 700 | https://github.com/floriankarsten/space-grotesk - Copyright 2020 The Space Grotesk Project Authors | SIL OFL 1.1 ([space-grotesk/OFL.txt](space-grotesk/OFL.txt)) |

The files are the unmodified Latin subsets published by Fontsource (`@fontsource/<family>@5.3.0`
on npm). They are redistributed unchanged, so the Reserved Font Names are kept. Each family's
`OFL.txt` is the license file shipped in its Fontsource package.
