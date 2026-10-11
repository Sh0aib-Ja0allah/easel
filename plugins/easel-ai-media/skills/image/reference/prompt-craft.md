<!-- Easel: adapted from ArnavPuri/designskills @ c7873015add8571ca95043febad0d9e6c97ee5c6
     (github.com/ArnavPuri/designskills, skills/image-generation/SKILL.md), MIT License, Copyright (c) 2026 Arnav Puri;
     see NOTICE.md. Modified by Easel (2026-10-11): the provider-neutral prompt structure, principles, style patterns and output checks only; the Gemini CLI, pip installs and ratio flags removed (the easel-ai-media generate tool sends the request). -->

# Prompt craft for image models

### Prompt Structure

Every prompt should follow this hierarchy:

```
[FORMAT] + [SUBJECT] + [STYLE] + [COMPOSITION] + [COLOR] + [TYPOGRAPHY] + [MOOD] + [NEGATIVE]
```

**Example - product social post:**
> Create a square social media graphic for a premium headphone launch.
> The headphones are centered on a deep navy (#0d1b2a) to electric blue (#00b4d8) diagonal gradient background.
> Bold white sans-serif text "HEAR EVERYTHING" spans the top third.
> Small coral (#ff6b6b) subtext "Available March 20" below.
> Subtle geometric triangles in the background at 10% opacity.
> Clean, modern, premium feel. No borders, no clip art.

### Key Principles

1. **Describe scenes, not keywords** - "A sneaker floating above a reflective surface with dramatic side lighting" beats "sneaker, cool, modern"
2. **Be specific about colors** - Always include hex codes from `.easel/brand.md`
3. **Describe spatial layout** - "headline in upper third, product centered, CTA in lower right"
4. **Name the style** - "flat vector", "3D render", "watercolor", "photorealistic", "minimalist Swiss design" (a medium or a movement, never a living artist, a studio or a brand)
5. **Include typography instructions** - font style, size relationship, color, position
6. **State what to exclude** - "no stock photo watermarks, no beveled effects, no clipart"

### Style-Specific Prompt Patterns

| Style | Prompt Additions |
|-------|-----------------|
| **Minimalist** | "generous whitespace, single accent color, clean sans-serif, no decorative elements" |
| **Bold/Vibrant** | "saturated colors, large impactful typography, geometric shapes, high contrast" |
| **Luxurious** | "dark background, gold or champagne accents, serif typography, subtle texture, elegant" |
| **Playful** | "bright palette, rounded shapes, hand-drawn feel, casual handwriting font" |
| **Corporate** | "structured grid, professional, blue tones, clean hierarchy, balanced composition" |
| **Retro** | "halftone dots, muted vintage palette, serif headlines, film grain texture" |
| **Brutalist** | "raw, high contrast black and white, unconventional layout, oversized type" |

## Check the output

Never deliver an image you have not looked at. Read every generated file at full size and at the size it will be seen (a thumbnail, a feed card).

### Getting text right

Text is the most common failure. To reduce errors:
- Put exact copy in double quotes in the prompt: `headline "HEAR EVERYTHING"`
- Keep rendered text short - a headline, a subline, a CTA. Move long copy (paragraphs, legal, prices that change) into an HTML/CSS overlay instead of the image.
- Spell out unusual words or brand names and say "spelled exactly as written".
- If a word comes back misspelled, fix it in a follow-up turn quoting only that word: `Change "EVERYTHNG" to "EVERYTHING". Change nothing else.`
- After two failed text fixes, generate the image without text and add the text as a code overlay (an HTML page over the image, rendered with easel-core's `render_still`; easel-design's skills show how).

Before delivering any generated image:

- [ ] Text is legible and spelled correctly (models can render text; verify it)
- [ ] Colours match the brand (hex codes from `.easel/brand.md` in the prompt)
- [ ] Composition has clear visual hierarchy (one focal point)
- [ ] Sufficient contrast between text and background
- [ ] No unwanted artifacts or distortions
- [ ] Aspect ratio matches intended platform
- [ ] Product image (if used) is cleanly integrated, not distorted
- [ ] Overall aesthetic matches the requested style

If any check fails, fix one thing per new generation (or edit, with the previous image as a reference), and say what must stay the same. Report to the user which checks you verified and any compromises (e.g. "text added as overlay because the model kept misspelling it").

Tell the user when a provider marks its output as AI-generated (Gemini adds an invisible SynthID watermark; others add metadata), and record the model in `provenance.json` (the generate tool does).
