# Design systems

Generic starting styles in the DESIGN.md section format that `.easel/brand.md` uses (decision
D8: no copies of real companies' systems, no brand names). Start from the closest one, then adapt
it to the user's brand with `easel-design:design-system` and save it with `easel-core:brand`.
Every system is checked by the plugin's tests: the nine sections are present; body text, muted text
and every other "... text" colour pass WCAG AA (4.5:1) on the background and surface; any other
colour below that says "not for text" in its note (where text needs that hue, a "<role> text" line
gives a darker step that passes); every face in Typography is bundled, in a weight that is
bundled too (400 and 700, Inter also 900; a 500 or 600 would render as 400 or 700); and no brand
or creator names appear.

| System | Feel |
|---|---|
| [clean-product](clean-product/DESIGN.md) | A calm, trustworthy software product: lots of white, one blue accent, crisp type, nothing decorative. |
| [editorial](editorial/DESIGN.md) | A long-read publication: serif headlines with real contrast in scale, narrow columns, ink on warm paper, one red accent used sparingly. |
| [brutalist](brutalist/DESIGN.md) | Raw and direct: visible structure, monospace, hard black borders, default-looking links on purpose, one acid accent. |
| [warm-minimal](warm-minimal/DESIGN.md) | Quiet and warm: off-white paper, deep ink blue, a single terracotta accent, lots of air, small type used with care. |
| [playful](playful/DESIGN.md) | Friendly and bright: rounded shapes, a cheerful primary with two supporting colours, chunky type, hand-written notes. |
| [dark-tech](dark-tech/DESIGN.md) | A developer tool on a dark ground: near-black surfaces, one electric accent, monospace for data, precise thin lines. |
| [luxury](luxury/DESIGN.md) | Quiet and expensive: high-contrast serif display, lots of space, a deep ground, one metallic-feeling accent used only as a line. |
| [swiss-grid](swiss-grid/DESIGN.md) | Objective and structured: a strict modular grid, a grotesque sans in a few weights, flush-left ragged-right text, primary red as the only colour. |
| [retro-print](retro-print/DESIGN.md) | Printed by hand: risograph-style overlapping inks (pink, teal, yellow) on cream paper, grain, slightly misregistered shapes, chunky type. |
| [calm-care](calm-care/DESIGN.md) | Reassuring and accessible: soft green-blue tones, large readable type, high contrast, nothing that rushes the reader. |
