<!-- Easel: adapted from anthropics/skills @ dbd4588f9e1033efb41dad4bef2f7947c8993d44
     (github.com/anthropics/skills, skills/theme-factory/SKILL.md and themes/*.md), Apache License 2.0,
     Copyright 2026 Anthropic, PBC; license text in licenses/Apache-2.0.txt, see NOTICE.md.
     Modified by Easel (2026-10-11): one reference file instead of a skill plus ten theme files; the
     showcase PDF is replaced by a rendered swatch sheet; system fonts mapped to Easel's bundled faces. The theme upstream named after a film title is renamed Dusk Avenue. -->

# Theme factory

Ten ready-made colour and type themes that can be applied to any artifact (a deck, a document, a
report, a landing page), plus how to make a new one. Use a theme when the user has no brand and
wants a consistent, professional look quickly; with a brand file (`.easel/brand.md`), the brand
wins.

## Using a theme

1. **Show the themes:** build one HTML page with a swatch card per theme (its colours as blocks,
   a heading and a line of body text in its faces) and render it with
   `mcp__plugin_easel-core_easel__render_still` (`fullPage: true`), or render each card and lay them out with
   `mcp__plugin_easel-core_easel__contact_sheet`. Show the sheet.
2. **Ask which one** to apply, and wait for an explicit choice.
3. **Apply it:** the theme's colours and faces, consistently, everywhere in the artifact: CSS
   custom properties (`--bg`, `--surface`, `--text`, `--accent`, `--accent-2`) set once and used
   everywhere.
4. **Check readability:** run `mcp__plugin_easel-core_easel__qa` (`checks: ["contrast"]`). Some
   theme colours are accents, not text colours: on light grounds use the darkest colour for
   text; never set body text in the light accents.

## Making a new theme

When none fits, make one from the user's description: a name that describes the mood (two words,
never a brand or a person), four colours with roles (a dark, a light, a primary accent, a
secondary accent), a header face and a body face (bundled faces render offline: Inter, Space
Grotesk, Newsreader, JetBrains Mono, Caveat, STIX Two Text). Show it as a swatch card for review
before applying it.

## The themes

### Arctic Frost

A cool and crisp winter-inspired theme that conveys clarity, precision, and professionalism.

- **Ice Blue** `#d4e4f7`: Light backgrounds and highlights
- **Steel Blue** `#4a6fa5`: Primary accent color
- **Silver** `#c0c0c0`: Metallic accent elements
- **Crisp White** `#fafafa`: Clean backgrounds and text
- Type: headers Inter 700, body Inter 400
- Best for: Healthcare presentations, technology solutions, winter sports, clean tech, pharmaceutical content.

### Botanical Garden

A fresh and organic theme featuring vibrant garden-inspired colors for lively presentations.

- **Fern Green** `#4a7c59`: Rich natural green
- **Marigold** `#f9a620`: Bright floral accent
- **Terracotta** `#b7472a`: Earthy warm tone
- **Cream** `#f5f3ed`: Soft neutral backgrounds
- Type: headers Newsreader 700, body Inter 400
- Best for: Garden centers, food presentations, farm-to-table content, botanical brands, natural products.

### Desert Rose

A soft and sophisticated theme with dusty, muted tones perfect for elegant presentations.

- **Dusty Rose** `#d4a5a5`: Soft primary color
- **Clay** `#b87d6d`: Earthy accent
- **Sand** `#e8d5c4`: Warm neutral backgrounds
- **Deep Burgundy** `#5d2e46`: Rich dark contrast
- Type: headers Inter 700, body Inter 400
- Best for: Fashion presentations, beauty brands, wedding planning, interior design, boutique businesses.

### Forest Canopy

A natural and grounded theme featuring earth tones inspired by dense forest environments.

- **Forest Green** `#2d4a2b`: Primary dark green
- **Sage** `#7d8471`: Muted green accent
- **Olive** `#a4ac86`: Light accent color
- **Ivory** `#faf9f6`: Backgrounds and text
- Type: headers Newsreader 700, body Inter 400
- Best for: Environmental presentations, sustainability reports, outdoor brands, wellness content, organic products.

### Golden Hour

A rich and warm autumnal palette that creates an inviting and sophisticated atmosphere.

- **Mustard Yellow** `#f4a900`: Bold primary accent
- **Terracotta** `#c1666b`: Warm secondary color
- **Warm Beige** `#d4b896`: Neutral backgrounds
- **Chocolate Brown** `#4a403a`: Dark text and anchors
- Type: headers Inter 700, body Inter 400
- Best for: Restaurant presentations, hospitality brands, fall campaigns, cozy lifestyle content, artisan products.

### Midnight Galaxy

A dramatic and cosmic theme with deep purples and mystical tones for impactful presentations.

- **Deep Purple** `#2b1e3e`: Rich dark base
- **Cosmic Blue** `#4a4e8f`: Mystical mid-tone
- **Lavender** `#a490c2`: Soft accent color
- **Silver** `#e6e6fa`: Light highlights and text
- Type: headers Inter 700, body Inter 400
- Best for: Entertainment industry, gaming presentations, nightlife venues, luxury brands, creative agencies.

### Modern Minimalist

A clean and contemporary theme with a sophisticated grayscale palette for maximum versatility.

- **Charcoal** `#36454f`: Primary dark color
- **Slate Gray** `#708090`: Medium gray for accents
- **Light Gray** `#d3d3d3`: Backgrounds and dividers
- **White** `#ffffff`: Text and clean backgrounds
- Type: headers Inter 700, body Inter 400
- Best for: Tech presentations, architecture portfolios, design showcases, modern business proposals, data visualization.

### Ocean Depths

A professional and calming maritime theme that evokes the serenity of deep ocean waters.

- **Deep Navy** `#1a2332`: Primary background color
- **Teal** `#2d8b8b`: Accent color for highlights and emphasis
- **Seafoam** `#a8dadc`: Secondary accent for lighter elements
- **Cream** `#f1faee`: Text and light backgrounds
- Type: headers Inter 700, body Inter 400
- Best for: Corporate presentations, financial reports, professional consulting decks, trust-building content.

### Dusk Avenue

A warm and vibrant theme inspired by golden hour sunsets, perfect for energetic and creative presentations.

- **Burnt Orange** `#e76f51`: Primary accent color
- **Coral** `#f4a261`: Secondary warm accent
- **Warm Sand** `#e9c46a`: Highlighting and backgrounds
- **Deep Purple** `#264653`: Dark contrast and text
- Type: headers Newsreader 700, body Inter 400
- Best for: Creative pitches, marketing presentations, lifestyle brands, event promotions, inspirational content.

### Tech Innovation

A bold and modern theme with high-contrast colors perfect for cutting-edge technology presentations.

- **Electric Blue** `#0066ff`: Vibrant primary accent
- **Neon Cyan** `#00ffff`: Bright highlight color
- **Dark Gray** `#1e1e1e`: Deep backgrounds
- **White** `#ffffff`: Clean text and contrast
- Type: headers Inter 700, body Inter 400
- Best for: Tech startups, software launches, innovation showcases, AI/ML presentations, digital transformation content.
