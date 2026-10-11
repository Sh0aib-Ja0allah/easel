---
name: Clean product
version: 1
---

<!-- Easel generic design system "clean-product" (MIT, Easel's own). A starting point, not a brand:
copy it to .easel/brand.md and change it with easel-design:design-system. -->

# Clean product

## 1. Visual Theme & Atmosphere
A calm, trustworthy software product: lots of white, one blue accent, crisp type, nothing decorative.

## 2. Color
- Primary: #2F5BEA (links, primary buttons, focus rings)
- Background: #FFFFFF (page)
- Surface: #F5F7FA (cards, sidebars)
- Text: #14171F (body and headings)
- Muted text: #5B6472 (secondary text, captions)
- Border: #DFE3EA (dividers, inputs)
- Success: #1F8A5B (icons, badges and fills; not for text)
- Success text: #1A7550 (success messages)
- Error: #C8372D
- Contrast: body text on background and on surface meets WCAG AA (4.5:1)

## 3. Typography
- Display: Inter 700, tight tracking (-0.02em) above 32px
- Body: Inter 400, 16px / 1.6
- Data and code: JetBrains Mono 400
- Scale: 1.25 (12, 14, 16, 20, 25, 31, 39, 49)

## 4. Spacing & Grid
4px base unit, spacing steps 4/8/12/16/24/32/48/64; 12-column grid, 24px gutters, max content width 1200px.

## 5. Layout & Composition
Left-aligned text, centred content column; one primary action per view; generous whitespace between sections (96px on desktop).

## 6. Components
Buttons 8px radius, 40px tall, solid primary or a quiet outline; cards 12px radius with a 1px border, no shadow at rest; inputs 1px border, 2px primary focus ring.

## 7. Motion & Interaction
150-250ms ease-out for state changes; no bounce; respect reduced motion.

## 8. Voice & Brand
Plain, helpful, specific. Verbs on buttons ("Create project"), no hype words.

## 9. Anti-patterns
- Gradients behind text
- More than one accent colour
- Drop shadows on everything
- Illustrations of floating 3D shapes
