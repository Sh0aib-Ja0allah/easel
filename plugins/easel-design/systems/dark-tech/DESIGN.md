---
name: Dark console
version: 1
---

<!-- Easel generic design system "dark-tech" (MIT, Easel's own). A starting point, not a brand:
copy it to .easel/brand.md and change it with easel-design:design-system. -->

# Dark console

## 1. Visual Theme & Atmosphere
A developer tool on a dark ground: near-black surfaces, one electric accent, monospace for data, precise thin lines.

## 2. Color
- Primary: #4CC2FF (links, focus, active states)
- Accent: #B8F25C (success, live indicators)
- Background: #0E1116 (page)
- Surface: #161B22 (panels, cards)
- Raised: #1F2630 (menus, popovers)
- Text: #E6EAF0 (body)
- Muted text: #9AA4B2 (secondary)
- Border: #2A313C (1px lines)
- Contrast: body text on background and on surface meets WCAG AA (4.5:1)

## 3. Typography
- Display: Inter 700, 32-56px, tight tracking
- Body: Inter 400, 15px / 1.6
- Code and numbers: JetBrains Mono 400
- Scale: 1.2

## 4. Spacing & Grid
4px base unit; dense layouts allowed (8/12/16 spacing inside panels); 12-column grid, 16px gutters.

## 5. Layout & Composition
Panels and split views; content aligned to a strict grid; data before decoration.

## 6. Components
Buttons 6px radius; surfaces separated by 1px borders, not shadows; elevation by lighter surface, not drop shadows; focus ring 2px primary.

## 7. Motion & Interaction
Fast: 120-200ms ease-out; skeleton loaders, not spinners.

## 8. Voice & Brand
Exact and terse; numbers with units; no marketing language inside the product.

## 9. Anti-patterns
- Neon glow on everything
- Pure black #000 backgrounds
- Low-contrast grey text below AA
- Purple-pink gradients
