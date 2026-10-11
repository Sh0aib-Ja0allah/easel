---
name: directions
description: >-
  Break a design out of the generic default: list what the obvious version would look like (the
  anti-references), then make 3-5 structurally different directions, each built and rendered by
  the Easel engine and each naming the convention it breaks. Shows them side by side with a blur
  test for hierarchy; the user keeps or kills each one, and nothing is blended. Works for any
  visual: a hero, a poster, a logo idea, a deck cover, an app screen.
when_to_use: >-
  The user says "make it less generic", "it looks like every other site", "show me options",
  "explore some directions", "something different", or a design keeps coming out bland. Also the
  directions phase of easel-design:brand-identity and landing pages. To polish one chosen
  direction, go back to the skill for that kind of work.
argument-hint: "[what is being designed] [what feels generic about it]"
allowed-tools: mcp__plugin_easel-core_easel__render_still mcp__plugin_easel-core_easel__contact_sheet mcp__plugin_easel-core_easel__qa mcp__plugin_easel-core_easel__craft Read Write Edit Glob Grep
---

# Directions

The generic version is what you get when every decision takes the most common answer. A
direction is a different set of answers to the big decisions, chosen on purpose. Work in
`./easel-out/<slug>/directions/`.

## 1. Name the default (anti-references)

Read the `anti-generic` rulebook (`mcp__plugin_easel-core_easel__craft` `{"name": "anti-generic"}`).
Then write down, in five to eight short lines, what the obvious version of *this* job would be:
the layout, palette, type, imagery and copy tone that most people would produce for this brief
(for a SaaS hero: centred headline, blue-purple gradient, three feature cards, a laptop
screenshot). These are the anti-references: no direction may keep more than two of them. Ask the
user to add their own "please not like this" examples.

## 2. Pick the axes

Directions differ on structure, not decoration. Choose the 2-3 axes that matter most for this job
and give each direction a different position on them:

- **Composition:** centred / asymmetric / grid-breaking / full-bleed image / type as the image
- **Type:** one voice (sans, serif, mono, hand) and the scale contrast (quiet vs. huge)
- **Colour:** monochrome / one loud accent / dark ground / paper and ink / a clash on purpose
- **Imagery:** photo / illustration / pure type / data / pattern / none
- **Density:** sparse and calm / dense and editorial
- **Tone of copy:** plain / dry / bold claim / question

Recolouring one layout is not a new direction. Two directions that share their composition and
type are one direction.

## 3. Build 3-5 directions

For each: a one-line name (descriptive, never a brand, studio or living artist: "editorial
broadsheet", not a magazine's name), the convention it breaks (in one sentence: "no hero image;
the headline is the image"), and a page built at the real size with real copy. Use
`.easel/brand.md` colours and faces where they are fixed; vary only what the brand leaves open.
Render each with `mcp__plugin_easel-core_easel__render_still`.

## 4. Compare, with the blur test

- Lay them out with `mcp__plugin_easel-core_easel__contact_sheet` (one item per direction,
  labelled with its name and the convention it breaks).
- **Blur test:** make a copy of each page with `html { filter: blur(8px) }` and put the blurred
  renders on a second sheet. What still reads is the hierarchy: one clear focal point per
  direction, or the direction has no structure yet.
- Run `mcp__plugin_easel-core_easel__qa` (`checks: ["text_clipping", "contrast"]`) on each; fix hard
  failures before showing.

## 5. Keep or kill

Show both sheets. For each direction the user says **keep** or **kill** (and why, in a few
words). Do not blend directions ("the type of B with the colours of D") unless the user asks
after seeing them; a blend usually lands back on the default. If all are killed, the reasons are
the brief for the next round.

## 6. Hand over

The kept direction goes back to the skill for its kind of work (`easel-design:landing-page`,
`poster`, `logo`, `brand-identity`...) with its name, the convention it breaks and the axes it
chose, written to `./easel-out/<slug>/directions/kept.md`, so later screens stay in it.
