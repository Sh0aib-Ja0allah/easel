<!-- Easel: adapted from Alisa0808/vox-director @ 6a85a7c341610442a6a5b1885e6e0217ab82a11f
     (github.com/Alisa0808/vox-director, references/prompt-guide.md), MIT License, Copyright (c) 2026 Alisa Qian;
     see NOTICE.md. Modified by Easel (2026-10-11): style renamed to editorial collage; real-people and filter-workaround section replaced by the Easel policy; celebrity worked example replaced; script and engine references replaced by Easel tools and video-plan.json fields; typeface, studio and person names removed from the vocabulary; source URLs dropped; ASCII punctuation. -->

# Prompt guide: the editorial collage look

Two prompts decide whether the film reads as a real editorial paper collage or a moving
poster: the **image prompt** (makes the collage look) and the **video prompt** (makes it move
like collage). Get these right and the rest is plumbing.

This file is the whole **look layer**: the prompt structures, the vocabulary that fills them,
and the theme presets. The **story layer** (narrative arcs, pacing, shot patterns) is its
counterpart, [beat-layer.md](beat-layer.md). Models, prices and assembly gotchas are in
[models-and-gotchas.md](models-and-gotchas.md).

Everything below sits on top of the **common editorial collage constraints** (never drop these):

> torn or scissor-cut paper edges, tape, halftone dots, newspaper clippings, paper-stencil
> shapes, real paper drop shadows, bold flat colour, PRINTED or illustrated cut-outs,
> **NOT 3D, NOT CGI, NOT photoreal**, keep print grain, headline text baked in "quotes".

- [1. Image prompt](#1-image-prompt)
- [2. Video prompt](#2-video-prompt)
- [3. Layering](#3-layering)
- [4. Real people, brands and content rules](#4-real-people-brands-and-content-rules)
- [5. Photo-anchored beats](#5-photo-anchored-beats)
- [6. Theme presets](#6-theme-presets)

---

## 1. Image prompt

The collage look is born here. When a video model animates the whole poster, this single
image carries the entire aesthetic, so invest in it. Generate it with
`mcp__plugin_easel-ai-media_media__generate` kind `image` (a dry run first, which returns the
cost estimate and a `quote`; call again with the same arguments, `confirm: true` and that `quote`
once the user agrees). Structure every image
prompt in 5 parts:

```
[1 STYLE BLOCK - identical on every beat]
  Mixed-media hand-cut PAPER COLLAGE, editorial zine style. Torn and scissor-cut paper edges,
  tape corners, halftone print dots, newspaper clippings, paper-stencil shapes, real paper
  drop shadows. Figures are PRINTED-texture cut-outs (photo, woodblock or mural print),
  NOT CGI, NOT a 3D render; keep print grain and paper imperfections. High contrast.

[2 SCENE - describe as SEPARATE cut-out pieces]
  SCENE as layered paper cut-outs: {main subject}, {a prop}, {a text strip}, {a decorative
  scrap}; elements have clear edges, distinct layers, each with its own drop shadow.

[3 BACKGROUND - one bold flat colour]
  on a bold flat {background colour} paper background.

[4 HEADLINE - baked in, short and bold]
  A torn-paper banner with a big bold headline "{HEADLINE}" (plus a small subtitle) and a red seal.

[5 TECH]
  aspect ratio {16:9 | 9:16 | 3:4}, 2k resolution.
```

The `{...}` slots come from the beat's fields in the job's `video-plan.json` (`scene`,
`background`, `headline`); see [beat-layer.md](beat-layer.md).

### Techniques

- **Reuse the style block verbatim on every beat.** Only the scene, background colour and
  headline change. This is what makes six different beats feel like one film.
- **Describe distinct pieces with visible edges and shadows.** Two reasons: it looks assembled
  (collage, not a smooth painting), and it gives the video model separable layers to parallax
  (see section 3). A blended scene can only be panned as one flat plane.
- **Bake the headline text into the image.** Image models render crisp text; video models
  smear it. Keep it short and bold, 2 or 3 words.
- **One bold flat background colour per beat.** Busy backgrounds muddy the cut-out silhouettes
  and kill the punch. Let the palette travel across beats to carry mood (see the colour row
  below): for example aged sepia, then bold pop colours, then a gold finish.
- **Say "NOT 3D, NOT CGI, printed texture, keep grain"** (or the positive form, see the note on
  negatives below), or the model drifts toward smooth CGI and loses the paper feel.
- **2k** so cut-outs stay crisp when scaled or animated.
- Keep a **consistent paper-texture language** across beats (edge roughness, halftone
  density). Colour can change; texture should not.
- **Re-roll here, not later.** A keyframe costs cents; animating a weak keyframe costs far
  more. Check every poster looks like a real layered collage before any video step.

### Worked example (a history-of-money beat, clay tan)

> Mixed-media hand-cut PAPER COLLAGE, editorial zine style; torn edges, tape, halftone dots,
> newspaper clippings, paper-stencil texture, real drop shadows; PRINTED-texture cut-outs, NOT
> 3D or CGI, keep print grain. SCENE as layered paper cut-outs: two traders in woodblock-print
> robes facing each other, a goat, a basket of cowrie shells, a torn "BARTER" newspaper strip,
> scattered geometric scraps; clear edges and drop shadows. Bold flat earthy clay-tan paper
> background. Torn-paper banner headline "BEFORE MONEY" with a small subtitle and a red seal.
> 9:16, 2k.

### The image dimensions (pick one term per row to fill the structure)

The style block above is the default. To differentiate a topic, or to compose a custom theme,
choose a term from each row. (Rows marked [key] are the strongest theme levers.)

| Dimension | Controls | Vocabulary (mix and match) |
|---|---|---|
| **Medium / technique** | the strongest style lever | paper collage, torn-paper collage, photomontage, screenprint, risograph, letterpress, linocut or woodcut, lithograph, halftone print, gouache, flat vector, photocopy or xerox, rubber stamp |
| **Art movement / era** [key] | the single best theme knob: shifts palette, type and layout at once | Swiss or International Typographic, Bauhaus, mid-century modern, Russian Constructivism, Dada photomontage, Pop Art, psychedelic 1960s, punk zine, 1980s postmodern (squiggles and terrazzo), Art Deco, 1930s public-works or vintage travel poster, Soviet poster, atomic age, retro-futurism |
| **Composition / layout** [key] | poster hierarchy and negative space | modular grid, asymmetric, strong negative space, diagonal dynamic, foreground-midground-background depth, hero headline plus subhead, full-bleed, radial, stacked bands, off-centre focal point |
| **Colour palette** [key] | the cleanest theme distinguisher (stops muddy gradients) | limited 2-3 colours, duotone, monochrome plus one accent, riso fluorescent pink plus federal blue, primary red/yellow/blue, 1970s mustard/rust/avocado, 1960s pop hot pink/orange, teal and orange, CMYK process, cream or kraft base, neon on black, named hex (e.g. `#0047AB`) |
| **Typography treatment** [key] | the headline look (the prompt only carries the words) | **put the exact words in "quotes"** and name a type style: bold condensed grotesque, geometric sans, slab serif, 1970s display serif, wood type, hand-lettered, **ransom-note cut-out letters**, stencil, all caps, knockout or reversed, huge headline plus small caption |
| **Print finish / texture** | "made by hand, not AI-slick" | halftone dots, coarse comic-print dots, riso ink misregistration or overprint, letterpress deboss, newsprint, kraft or cardstock, aged or foxed paper, fold creases, coffee stains, deckled versus scissor-cut edges |
| **Lighting / capture** | keeps it scanned, not rendered (anti-3D) | flat even studio light, shadowless scanned-document light, straight-on, flat-lay top-down, subtle paper drop shadows |
| **Mood** | tone anchor | playful, bold, urgent, editorial or serious, nostalgic, optimistic, ominous, satirical, activist or protest |

**One-line image structure** (the common ground of the published image-model prompting guides):

`[MEDIUM] + [ART MOVEMENT / ERA] of [SUBJECT + SCENE], [COMPOSITION / hierarchy / negative
space], [straight-on, scanned-flat framing] + [flat even light, paper drop shadows], [named
limited COLOUR PALETTE], [PRINT FINISH / texture], headline "EXACT WORDS" in [NAMED TYPE STYLE]
[placement], [MOOD], [aspect]`

Negatives depend on the model: Gemini image models (nano-banana family), Flux and OpenAI image
models take **no negative prompts**, so phrase everything positively ("flat printed paper,
scanned texture" rather than "not 3D"); SDXL-family models take a separate negative field.

---

## 2. Video prompt

The video prompt turns "pan a poster" into "a living collage". Animate each approved keyframe
with `mcp__plugin_easel-ai-media_media__generate` kind `video`, passing the keyframe in `refs`
and the shot length in `seconds` (dry run first, then `confirm: true` with its `quote`). Use the **5-axis**
structure; all five axes matter, especially **feel** and **colour**, which set mood and
palette movement:

```
[GOAL] Animate this still into a mixed-media collage MOTION GRAPHIC. Keep it flat 2D paper.

[AXIS 1 - CAMERA]    one smooth continuous move for this shot: {slow push-in | lateral
                     parallax pan | slow rise}.
[AXIS 2 - MOVEMENT]  layered paper cut-outs drift with visible drop-shadow parallax; elements
                     and geometric scraps bob and settle gently on the beat; halftone dots
                     pulse; torn edges and tape flutter; a breathing quality.
[AXIS 3 - AESTHETIC] preserve the torn-paper, tape, halftone, newspaper and paper-stencil
                     textures exactly; keep the bold flat background.
[AXIS 4 - FEEL]      {emotional tone of this beat}, e.g. tender, triumphant, cinematic
                     editorial, "a page from a scrapbook".
[AXIS 5 - COLOUR]    {this beat's palette}, high contrast; if part of a palette arc, name where
                     it sits (aged sepia, then bold pop, then gold).

[CONSTRAINTS] the layout, the seal and all on-screen text stay perfectly stable and legible;
              one smooth continuous move from the first frame to the last; the same objects
              throughout, rigid paper pieces only.
```

The `{...}` slots come from the shot's `cameraMove` and `elementMotion` and the beat's `feel`
and `background` in `video-plan.json`.

### Techniques

- **The MOVEMENT axis is the lever** that makes the model move *layers* (parallax) instead of
  sliding the whole frame. Name the layered paper motion explicitly.
- **FEEL and COLOUR are not decoration.** They steer the model's pacing and grade. A "tender,
  sepia" beat animates slower and warmer than a "triumphant, gold" beat. Do not drop them.
- **The CONSTRAINTS axis prevents the common breaks**: text wobble, 3D drift, and the big one,
  internal jump-cuts.
- **Never write "snap", "punch-in", "slam" or "quick zoom".** Gemini Omni Flash over-reacts and
  generates a jump inside the shot that reads as a one-frame flash. Ask for one smooth
  continuous move.
- **Do not rely on the video model for text.** The text is already baked into the keyframe;
  just tell the model to keep it stable. For critical text, add it as a caption overlay in
  assembly (see [models-and-gotchas.md](models-and-gotchas.md)).
- **One move per shot.** For richer editing, cut between several short shots (wide plus
  detail) rather than asking one clip to perform a complex timeline.

### The full axis vocabulary (the 5 axes, plus the stability axes)

The core 5 axes set mood and motion; the extra axes below (marked [stability]) are what
actually control stability: they fix the loop, text-wobble and morph failures.

| Axis | Controls | Vocabulary / phrasing |
|---|---|---|
| **Motion amplitude** [stability] | THE anti-morph, anti-text-warp lever | `very subtle`, `minimal`, `moderate`, "about 5% movement"; avoid `intense`, `large`, `explosive` near text |
| **Camera move** | how the camera travels | **safe for flat paper:** static or locked-off, slow push-in or pull-out, slow pan or tilt, subtle parallax truck. **Bold (bends 2D toward fake 3D; use with `constraints: "loose"` and re-roll):** orbit, crane, dolly-zoom, roll, 3D arc |
| **Shot size / angle** | framing | full poster in frame (default), slow push to a detail, eye-level straight-on (default), overhead (reads as paper on a table) |
| **Element motion** | what moves inside the frame | **safe paper-native verbs:** drift, sway, ripple, flutter, slide, pivot (rigid), bob, pulse, shimmer, settle, parallax between layers. **Bold (loose plus re-roll):** warp, transform, morph, vortex, explode |
| **Speed / easing** | tempo | slow, gentle, continuous, ease-in-ease-out (risky: quick, snap, whip) |
| **Lighting over time** | the best "safe motion" for flat art | a soft light sweep across the surface, gentle shadow drift, subtle flicker or glow pulse |
| **Dimensional lock** [key] | keeps it flat | "flat 2D, camera parallel to the poster, no 3D rotation, no perspective change; paper layers parallax only, elements slide and pivot as rigid flat paper, never bending or morphing" |
| **Stability anchors** [stability] | protects text and layout | "the printed headline and layout stay sharp, legible and perfectly stable; the lettering is never redrawn, distorted or moved" |
| **Shot structure** | cuts and loops | "single continuous shot, no cuts, no scene changes"; for a one-way move add a **motion endpoint** ("...then settles into place"); for a seamless loop say "looping video" where the model supports it |

### Best-practice rules (from the published video-model prompting guides)

1. **Describe motion, not the picture.** The still already has subject, scene, text and style;
   restating them (especially the text) makes the model re-synthesise and warp them.
2. **One camera move and one action per shot.** Several simultaneous moves cause instability
   and morphing.
3. **Keep amplitude small and motion physically plausible.** Slow, gentle, coherent movement;
   avoid high-burst, large dynamic actions.
4. **Know whether your model takes negatives.** Gemini Omni Flash, Veo and Runway work best with
   positive phrasing only ("no" and "don't" can backfire). Kling and Seedance do support negative
   prompts. Rewrite the CONSTRAINTS block positively for models that take no negatives.
5. **Text:** do not ask the video model to render text; anchor it as stable; keep motion away
   from the text region; for critical text, overlay it in assembly.
6. **Anti-loop:** give a one-way move a settle endpoint, or say "single continuous shot"; do not
   over-script per-second beats in a short clip.
7. **Flat collage:** name the style ("flat 2D paper cut-out animation, rigid paper layers") and
   lock dimensionality; this steers the model away from 3D morphing.

**One-line video structure** (image-to-video): `[SHOT SIZE + ANGLE] + [CAMERA MOVE + AMPLITUDE]
+ [ELEMENT MOTION + SPEED / EASING] + [LIGHTING OVER TIME] + [AESTHETIC / TEXTURE + DIMENSIONAL
LOCK] + [FEEL] + [COLOUR] + [STABILITY ANCHORS] + [SHOT STRUCTURE / LOOP]`.

Sources: the published prompting guides for Runway, Kling image-to-video, Seedance, Veo and
Sora, and standard film camera-movement glossaries.

---

## 3. Layering

A common question: "can I feed a background plus separate component images to the video model
to get dramatic per-element motion?" In practice, no. Reference-to-video models are
**generative**, not layer compositors: they reinterpret the references and invent their own
motion, so you get *less* control, not more. For controlled per-element choreography, use a
procedural animation path (Easel's motion skills) instead of an AI video model.

But there is a real lever within the image-to-video path: **the more clearly layered your
keyframe is, the more layered motion the video model can produce.** Distinct cut-outs with
edges and shadows let the model drift them at different depths (parallax), which reads as a
living collage. A flat, blended image only allows a whole-frame pan. So push the *layering* in
the image prompt (section 1) if you want livelier motion.

---

## 4. Real people, brands and content rules

Easel does not depict real people or use brand logos without the rights holder's permission,
and never uses a model choice or prompt trick to get around a provider's content rules. When a
provider refuses a request, the answer is to change the content, not the route. Real people
appear only as the user's own footage or photos, with the consent of the person shown.

---

## 5. Photo-anchored beats

A photo-anchored beat takes one still the user supplies (their own portrait, used with the
consent of the person shown, or their own product shot) and builds the paper world around it.
The trick is one photographic sticker that is never redrawn while the collage is generated
around it. Pass the photo in `refs` to generate kind `image`. Three lock templates, each earned
by a failed generation:

**FACE LOCK (portrait).** "Her/his face and hair from the attached photo are cut out as a
PHOTOGRAPHIC sticker with a torn white paper border; keep the facial identity, features and the
exact expression from the photo pixel-faithful; the face is never redrawn, repainted or
stylised; the face and hair stay clean photographic texture with no halftone or ink treatment.
All poses and gestures are expressed by the body only. From the neck down the body is a
hand-drawn paper-doll illustration jointed like a vintage paper puppet, FULLY CLOTHED in
{outfit}."

- *Poses go to the body only*: asking for a wink or a smile redraws the face.
- *Scope halftone to the background*, or the print dots bleed onto skin.
- *Lock the clothing*, or the paper-doll body drifts (one run produced a bare mannequin).
- *Keep the face photographic.* Repainting it in print texture changes the identity; the
  photographic-sticker treatment is the reliable look.

**PRODUCT LOCK.** "{The product} from the attached photo is cut out as a PHOTOGRAPHIC sticker
with a clean scissor-cut edge and a soft real paper drop shadow; keep its exact shape,
materials, surface reflections and every word of its label typography pixel-faithful. The
subject and its label are never redrawn, restyled or repainted. Re-style ONLY the world around
it as printed paper collage." Use this only for the user's own product, or one they have the
rights holder's permission to show.

**ANCHOR FREEZE (the video step).** Image editing keeps label typography intact, but the
image-to-video step can quietly re-letter it (observed: "PARFUM" became "PAREUM") or re-time a
face. Every photo-anchored video prompt therefore carries a freeze line: "the photographic
sticker (and every letter of its label) is a frozen layer, pixel-identical to the still for the
entire duration". Store it once as the plan's `anchorFreeze` field in `video-plan.json` and add
it to every video prompt. Then grab a frame per clip with
`mcp__plugin_easel-core_easel__filmstrip` and re-check the letters anyway.

Photo-anchored posters carry no baked headline; their text belongs to caption overlays.

---

## 6. Theme presets

A **theme preset** is one pick from each image dimension (section 1) plus a motion preset
(section 2), on top of the common editorial collage constraints. This is how to offer different
looks without hand-writing each prompt.

| Preset | Era / movement | Palette | Type style | Print finish | Motion preset | Fits topics |
|---|---|---|---|---|---|---|
| `american-retro` | 1950s US advertising and pulp | bold retro primaries | wood type, bold slab | halftone, aged | punchy | ads, sports, business, money |
| `swiss-modern` | Swiss / International Typographic | 2 colours plus a red accent | neo-grotesque sans | clean flat, subtle grain | calm | tech, finance, explainers |
| `punk-zine` | 1990s punk / DIY | black and white plus 1 spot colour | ransom-note cut letters | photocopy, misregistration | punchy or max | rebellion, music, counterculture |
| `soviet-constructivist` | Russian Constructivism | red, black, cream | bold condensed, on the diagonal | letterpress, newsprint | punchy | politics, revolution, industry |
| `wpa-propaganda` | 1930s public-works poster | muted 3 colours | stencil, gothic | screenprint grain | calm | history, labour, public health |
| `70s-groovy` | 1970s | mustard, rust, avocado | bulbous display serif | riso grain | punchy | culture, food, nostalgia |
| `chinese-ink` | Chinese woodblock and ink | ink plus vermilion | Chinese brush lettering plus a red seal | rice paper, seal | calm or punchy | Chinese history and culture |
| `atomic-age` | 1950s futurism | teal, orange, cream | atomic script | halftone | punchy | science, space, the future |
| `newsprint-editorial` | mid-century front-page feature | cream, deep red, mustard, charcoal | bold condensed newsprint headline | aged paper, heavy halftone | punchy | news, AI and tech explainers, editorial features |
| `gilded-deco` | 1920s Art Deco luxury advertising | aged cream, champagne gold, charcoal | elegant high-contrast serif, wide tracking | gold foil, fine halftone | calm | luxury goods, perfume, watches, heritage products |

Motion presets set the amplitude (`motionStyle` in `video-plan.json`): `calm` (very subtle),
`punchy` (moderate, rich element motion), `max` (bold; pair with `constraints: "loose"` and
plan for re-rolls).

**How to use (the look check-in):**

1. Read the topic and suggest 3 or 4 fitting presets, or compose a new one by mixing the
   vocabulary in sections 1 and 2. Match the topic, **not** the language: an English film on
   Chinese history should look Chinese.
2. Render one key beat in each candidate with generate kind `image` (show the dry-run estimate
   first; the bake-off is a few images, so a few cents to a few tens of cents).
3. Put the candidates side by side with `mcp__plugin_easel-core_easel__contact_sheet` and let
   the user pick by eye. Never blend two directions.
4. Write the pick as `theme` in `video-plan.json`. Its palette, type and finish fill the image
   prompt; its motion preset sets `motionStyle`. The common constraints and the stability
   anchors are always on.
