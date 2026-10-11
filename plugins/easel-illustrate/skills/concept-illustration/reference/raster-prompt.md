<!-- Easel: adapted from aishwaryaashok14/peanut-illustrations @ 1e5c645892a2d70242062f23ee2277b18240e05c
     (github.com/aishwaryaashok14/peanut-illustrations, peanut-illustrations/references/prompt-template.md), MIT License,
     Copyright (c) 2026 Aishwarya Ashok, with portions adapted from ian-xiaohei-illustrations, Copyright (c)
     2026 Ian; see NOTICE.md. Modified by Easel (2026-10-11): an optional path through easel-ai-media; the peanut description replaced by the mascot slot; watermark lines removed. -->

# AI raster path (optional)

Only when the user wants a painted or photographic raster and `easel-ai-media` is installed: use
`easel-ai-media:image` (the user's own key; it shows the cost before spending). The default is
the vector path in SKILL.md, which needs no key. Fill the template below and send it as the
prompt; then run the same QA.


Generate each image on its own. Replace the variables from the user's prompt. Do not combine several ideas into one image.

```text
Generate one standalone 16:9 horizontal concept illustration.

Visual DNA:
Pure white background. Minimalist black hand-drawn line art. Slightly wobbly pen lines. Lots of empty white space. A single warm-orange accent color used sparingly for one point of emphasis (no other colors). Clean, deadpan, slightly absurd product-sketch feeling. No gradients, no shadows, no paper texture, no complex background, no commercial vector style, no PPT infographic look, no cute mascot poster, no children's illustration, no realistic UI.

Recurring character required:
{the mascot's description from mascot.md, or the user's own mascot, in one or two sentences}. The mascot must perform the core conceptual action, not decorate the scene. Keep it deadpan, calm and only slightly absurd, never cute.

Theme:
{the idea to illustrate}

Structure type:
{Workflow / System slice / Before-after / Character state / Concept metaphor / Layered method / Map-route / Mini comic}

Core idea:
{the single thing this image must express}

Composition:
{the concrete scene: where the mascot is, what it is doing, the main object, how things flow}

Suggested elements:
{element 1} / {element 2} / {element 3}

Handwritten English labels:
{label 1} / {label 2} / {label 3} / {optional 4} / {optional 5}  (a few; at most 5-8)

Color use:
Black for all line art and the mascot. One warm orange as the single accent, used only for the one most important thing (the main flow, the key arrow, the result, or the critical word). Use no other colors.


Constraints:
```

## Image edit prompts

Remove a top-left title:

```text
Edit the provided image. Remove only the handwritten title "{text to remove}" and its underline from the top-left corner. Fill that area with the same clean white background, matching the surrounding blank paper. Preserve everything else exactly: the mascot, labels, paths, line style, the single orange accent, composition, aspect ratio, and image quality. Do not add any new text or objects.
```

Make the mascot more central:

```text
Regenerate this illustration with the same core meaning and simple layout, but make the mascot more central to the conceptual action. The mascot should be doing the strange work that explains the idea, not standing beside the diagram. Keep it clean, sparse, hand-drawn, single warm-orange accent, and not cute.
```

Swap the accent color:

```text
Regenerate this illustration unchanged except for the accent color: replace the warm orange with {new color}, used in exactly the same restrained way for the single point of emphasis. Keep everything else identical — black line art, the mascot, composition, labels, and whitespace.
```
