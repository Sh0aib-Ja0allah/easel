---
name: Retro print
version: 1
---

<!-- Easel generic design system "retro-print" (MIT, Easel's own). A starting point, not a brand:
copy it to .easel/brand.md and change it with easel-design:design-system. -->

# Retro print

## 1. Visual Theme & Atmosphere
Printed by hand: risograph-style overlapping inks (pink, teal, yellow) on cream paper, grain, slightly misregistered shapes, chunky type.

## 2. Color
- Ink 1: #E8457C (fluorescent pink)
- Ink 2: #1E8C93 (teal)
- Ink 3: #F6C543 (yellow)
- Background: #F3ECDD (cream paper)
- Text: #1E2A3A (body (dark ink))
- Muted text: #4F5868 (captions)
- Contrast: body text on background and on surface meets WCAG AA (4.5:1)

## 3. Typography
- Display: Space Grotesk 700, very large, uppercase, tight
- Body: Inter 400, 16px / 1.55
- Hand notes: Caveat 400
- Scale: 1.333

## 4. Spacing & Grid
8px base; a loose 12-column grid; shapes may bleed off the edge.

## 5. Layout & Composition
Overlapping flat shapes with multiply blending; one big headline; collage-like but with a clear focal point.

## 6. Components
Shapes with `mix-blend-mode: multiply`, a 1-2px offset second colour for misregistration, a fine grain texture (an SVG noise filter) at 6-10% opacity; buttons as stamped labels.

## 7. Motion & Interaction
Stepped, on twos (12fps feel) for illustrations; UI transitions 200ms.

## 8. Voice & Brand
Upbeat and direct, a bit handmade.

## 9. Anti-patterns
- Smooth gradients
- Glossy 3D
- Thin hairline type
- Pure white backgrounds
