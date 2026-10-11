---
name: critique
description: >-
  Review rendered work with measured checks and the independent critic agent: designs, UI
  screens, posters, logos, illustrations, animations, videos, social graphics, pixel art. Returns
  a scored critique with evidence and ranked fixes, then re-renders and re-checks after fixes.
  Use when the user asks "review this", "what's wrong with", "is this any good", "critique",
  "give feedback", including for HTML, CSS or SVG pasted into the chat, and after any Easel render
  before calling it finished. Use it instead of judging from the code alone: it renders the work
  and measures it first. To check that Easel itself works, use easel-core:setup instead.
when_to_use: After producing visual output, or when the user shares a design, image, page or video and asks for an opinion.
allowed-tools: Read Glob Write Agent mcp__plugin_easel-core_easel__render_still mcp__plugin_easel-core_easel__contact_sheet mcp__plugin_easel-core_easel__filmstrip mcp__plugin_easel-core_easel__qa mcp__plugin_easel-core_easel__craft
---

# Critique

The loop every Easel skill ends with: **render, look, measure, critique, fix, re-render.**

## 1. Get views of the work

- HTML, CSS or SVG pasted into the chat: save it as a file in `./easel-out/critique/` first.
- A page, SVG or HTML snippet: render it with `mcp__plugin_easel-core_easel__render_still` at the
  sizes it will be seen (for UI also 390 x 844; for logos a size ladder with
  `mcp__plugin_easel-core_easel__contact_sheet`, `"sizes": [16, 32, 64, 128, 512]`,
  `"themes": ["light", "dark"]`).
- An animation or video page: `mcp__plugin_easel-core_easel__filmstrip` with one frame every
  0.5 s.
- An image the user gave you: open it with Read; put several on a `contact_sheet`.

Open every view with Read before judging. If a render or a measurement fails, or its files are
missing (for example Chromium is not installed yet), say so plainly, suggest `easel-core:setup`,
and still run the critic in step 3 on the source you have, telling it that no views exist.

## 2. Measure

Run `mcp__plugin_easel-core_easel__qa` on the page (`"mode": "ui"` for interfaces) and on any
video or audio file. Hard failures (text clipping, contrast in UI, still stretches, colour
cast, loudness) are blocking.

## 3. Independent critique

Pick the rubric: `design`, `motion`, `illustration`, `pixel` or `social`. Then start the critic
with the subagent tool (the **Agent** tool) and
`subagent_type: "easel-core:critic"`. In its prompt give: the paths of every view, the
`qa` result, the domain, and the brief as a separate section at the end. Always use the critic,
even for small pieces: an independent read is the point of this skill. The critic is read-only
and returns a cold read, scores, findings with evidence, and ranked fixes.

Show the user the critic's score table and findings. Do not soften them.

## 4. Fix and verify

If you made the work (or the user asks you to fix it):

1. Apply the fixes in order of impact; blocking and high first.
2. Re-render the same views and re-run `qa` until every hard gate passes.
3. For a fair check, send the critic the old and new views labelled A and B in random order
   (blind). Report whether each fix landed, with the new scores.

Deliver with numbers: the final scores, the `qa` results, and what changed.
