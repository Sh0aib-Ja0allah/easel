# Bundled fonts

Renders never load fonts from the network. These faces ship with `easel-core` and every rendered
page can use them by family name; the engine serves them at `https://easel.local/fonts/<file>` and
injects the `@font-face` rules from [`fonts.json`](fonts.json).

| Family | Use | Weights | Upstream | License |
|---|---|---|---|---|
| Inter | UI and body sans; heavy print type (900) | 400, 700, 900 | https://github.com/rsms/inter - Copyright 2016 The Inter Project Authors | SIL OFL 1.1 ([inter/OFL.txt](inter/OFL.txt)) |
| Newsreader | editorial serif | 400, 700 | https://github.com/productiontype/Newsreader - Copyright 2020 The Newsreader Project Authors | SIL OFL 1.1 ([newsreader/OFL.txt](newsreader/OFL.txt)) |
| JetBrains Mono | code and data | 400, 700 | https://github.com/JetBrains/JetBrainsMono - Copyright 2020 The JetBrains Mono Project Authors | SIL OFL 1.1 ([jetbrains-mono/OFL.txt](jetbrains-mono/OFL.txt)) |
| Space Grotesk | display sans | 400, 700 | https://github.com/floriankarsten/space-grotesk - Copyright 2020 The Space Grotesk Project Authors | SIL OFL 1.1 ([space-grotesk/OFL.txt](space-grotesk/OFL.txt)) |
| Caveat | handwriting (animate captions, sketch styles) | 400, 700 | https://github.com/googlefonts/caveat - Copyright 2014 The Caveat Project Authors | SIL OFL 1.1 ([caveat/OFL.txt](caveat/OFL.txt)) |
| STIX Two Text | math and textbook serif (roman and italic) | 400, 700 + italics | https://github.com/stipub/stixfonts - Copyright 2001-2021 The STIX Fonts Project Authors | SIL OFL 1.1 ([stix-two-text/OFL.txt](stix-two-text/OFL.txt)) |
| Noto Sans Math | fallback for math symbols and Greek (θ, ≈, ≤, ∝, arrows) | 400 | https://github.com/notofonts/math - Copyright 2022 Google LLC | SIL OFL 1.1 ([noto-sans-math/OFL.txt](noto-sans-math/OFL.txt)) |

The files are the Latin subsets published by Fontsource (`@fontsource/<family>@5.3.0` on npm),
redistributed as Fontsource ships them. (Noto Sans Math's "latin" file is its full symbol set.) Subsetting makes
them "Modified Versions" under the OFL, which is allowed; it only forbids using a Reserved Font
Name for a modified version. None of these seven families declares a Reserved Font Name. (Source
Serif 4 was bundled first and replaced on 2026-10-11 because it reserves the name "Source".)
Each family's `OFL.txt` is the license file shipped in its Fontsource package.

Caveat, STIX Two Text, Noto Sans Math and Inter 900 were added on 2026-10-11 for the animate kit
(easel-motion, T2.1), whose upstream asked for system fonts (Ink Free, Segoe Print, Cambria Math,
Arial Black, Consolas). System fonts differ per machine, so renders were not reproducible; the kit
now names only these bundled families. For text in a canvas, list a bundled fallback after the
main family (for example `"STIX Two Text", "Noto Sans Math", serif`) so a missing glyph never
falls through to a system font.
