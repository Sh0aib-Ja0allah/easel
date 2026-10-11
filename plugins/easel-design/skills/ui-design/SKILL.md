---
name: ui-design
description: >-
  UI screens and components in HTML/CSS: buttons, forms, navigation, cards, modals, tables, mobile
  screens (iOS and Android conventions, touch targets, safe areas), dark mode and dashboards, with
  every state designed (hover, focus, active, disabled, loading, empty, error). Rendered at
  desktop and phone sizes by the Easel engine, checked for contrast and clipped text in UI mode, and
  critiqued.
when_to_use: >-
  The user asks to design or improve a screen, component, form, card, mobile UI, dark mode or a
  dashboard. For a whole landing page use easel-design:landing-page; for tokens and palettes use
  easel-design:design-system; for motion use easel-motion:ui-motion.
argument-hint: "[screen or component] [platform]"
allowed-tools: mcp__plugin_easel-core_easel__render_still mcp__plugin_easel-core_easel__contact_sheet mcp__plugin_easel-core_easel__qa mcp__plugin_easel-core_easel__craft Read Write Edit Glob Grep
---

# UI design

Every state, every size, measured. Work in the user's project when they have one (their stack and
tokens), otherwise in `./easel-out/<slug>/` as plain HTML/CSS. Easel renders offline: compile
Tailwind locally or write the tokens as CSS custom properties.

References (read the ones that fit):

- [reference/ui-design.md](reference/ui-design.md): components, states, spacing, forms, tables,
  accessibility.
- [reference/mobile.md](reference/mobile.md): touch targets, safe areas, navigation patterns,
  platform conventions.
- [reference/cards.md](reference/cards.md): card anatomy and layouts.
- [reference/dark-mode.md](reference/dark-mode.md): dark palettes, elevation, contrast.
- [reference/dashboards.md](reference/dashboards.md): KPI, analytics and admin layouts.

## Steps

1. **Brand:** read `.easel/brand.md`; if there is none, run `easel-core:brand` or ask for the
   colours and faces, and say when defaults were used. Use the project's existing tokens and components before inventing new ones.
2. **Scope:** the screen or component, its content (real copy, realistic data), its states, the
   platforms and breakpoints.
3. **Rules:** the `accessibility`, `typography` and `anti-generic` rulebooks (`mcp__plugin_easel-core_easel__craft`) and the
   references above.
4. **Build** the screen with every state visible on one review page (a states grid). Use the brand faces if the project has their font files, otherwise a bundled face (Inter, Space
   Grotesk, Newsreader, JetBrains Mono, Caveat, STIX Two Text, Noto Sans Math). No CDNs: renders
   are offline.
5. **Render** at 1440 x 900 and 390 x 844 with `mcp__plugin_easel-core_easel__render_still` (`theme: "both"` when there is a
   dark mode); lay the states out with `mcp__plugin_easel-core_easel__contact_sheet` when there are many.
6. **Check** with `mcp__plugin_easel-core_easel__qa` (`mode: "ui"`, `checks: ["text_clipping", "contrast"]`); contrast is a
   hard gate in UI work. Check touch targets (44 x 44 px or more) and the focus states by eye.
7. **Critique:** `easel-core:critique` with the **design** rubric; fix what scores below 7.
8. **Deliver** the code (in the project, or the HTML), the renders, the qa numbers.
