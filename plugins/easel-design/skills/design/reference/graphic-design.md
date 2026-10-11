<!-- Easel: adapted from ArnavPuri/designskills @ c7873015add8571ca95043febad0d9e6c97ee5c6
     (github.com/ArnavPuri/designskills, skills/graphic-design/SKILL.md), MIT License, Copyright (c) 2026 Arnav Puri;
     see NOTICE.md. Modified by Easel (2026-10-11): frontmatter/triggers dropped; code is the default output; Gemini CLI
     replaced by an optional AI raster path; render.mjs -> render_still, contrast/clipping -> qa; brand file -> .easel/brand.md;
     Google Fonts links -> bundled faces; style-framework fonts swapped to bundled faces. -->

# Graphic Design

Core knowledge for one-off visuals and custom-size graphics. Two output modes:

1. **Code** (default) -- self-contained HTML/CSS/SVG rendered to an exact-size PNG (or PDF) by the Easel engine. Text stays sharp, spelled exactly as briefed, and editable.
2. **AI raster** (optional) -- only for photographic or painted imagery; see "AI raster path (optional)" below. Copy is still set in code on top.

For platform formats prefer the specific references: social posts, thumbnails and banners -> `easel-design:social-graphic`; posters and flyers -> `easel-design:poster`; paid ads -> `easel-design:ad-creative`; infographics -> `easel-design:infographic`; product and device mockups -> the product-mockup reference of `easel-design:design`.

---

## Step 1: Load Brand Context

Before any design work:

1. Read `.easel/brand.md` first. Extract primary, secondary, and accent colors (hex), heading and body fonts, and style archetype
2. If there is no brand file, run `easel-core:brand` or ask for the brand colours and faces; say when defaults were used

---

## Step 2: Analyze the Brief

Determine the graphic's purpose:

| Intent | Approach | Key Elements |
|--------|----------|--------------|
| **Promotional** | Bold, attention-grabbing | Large headline, CTA, product image |
| **Informational** | Clear hierarchy, readable | Structured content, icons, data |
| **Emotional** | Mood-driven, atmospheric | Photography, color mood, minimal text |
| **Celebratory** | Energetic, festive | Dynamic shapes, bright colors, confetti/particles |
| **Announcement** | Clean, authoritative | Date/details prominent, professional |
| **Brand Awareness** | On-brand, memorable | Logo prominent, brand colors dominant |

Identify required elements:
- Headline text
- Subheadline or supporting text
- Product image or visual focal point
- CTA or action text
- Brand elements (logo, colors)
- Dimensions / aspect ratio

---

## Step 2b: Analyze Product Image (If Provided)

1. **Identify dominant colors** -- extract 3-5 key colors from the image
2. **Assess composition** -- where is the subject, where is negative space
3. **Determine mood** -- warm/cool, energetic/calm, luxurious/casual
4. **Choose complement strategy:** harmonious (reuse image colors), contrasting (complementary colors make it pop), or monochromatic (desaturate + brand-color overlay)

---

## Step 3: Render and Verify

Fold in the composition, color, and typography decisions from Steps 4-6, build the page (Step 7), then render it:

- One size: `mcp__plugin_easel-core_easel__render_still` with `file`, `width`, `height` (add `scale: 2` for retina)
- Several sizes from one page: `sizes: [{width, height, name}]` -- build the layout with relative units / container queries so it adapts, and keep key subjects in the central area that survives every ratio
- Print: `mcp__plugin_easel-core_easel__render_pdf` with `file` and `format` ("A4", "Letter") or `width`/`height` with units

Never deliver an image you haven't looked at:

1. **Read the rendered PNG.** Check: every word spelled exactly as briefed, text legible at the size it will be seen, brand colors correct, one clear focal point, nothing important in cropped or UI-overlaid zones, product/logo not distorted
2. **Run `mcp__plugin_easel-core_easel__qa`** with the piece's `width` and `height`, `fixedFrame: true` and `checks: ["contrast", "text_clipping"]` -- catches low-contrast text, clipped copy and content that runs past the canvas; fix every contrast finding, not only the hard failures
3. **Fix one issue at a time**, re-render, and Read the result again
4. For a fuller review, use `easel-core:critique`

---

## AI raster path (optional)

Only when the user wants a photographic or painted raster and easel-ai-media is installed: use `easel-ai-media:image` (the user's own key; it shows the cost before spending). Everything else is built in HTML/SVG.

**Describe the scene narratively -- don't just list keywords.** Put exact copy in double quotes, use hex codes, describe spatial layout, name the style, and state exclusions.

```
Create a [style] [format] for [purpose].
Scene: [foreground, background, how elements are arranged]
Colors: ["navy blue #1a2b4a background with coral #ff6b6b accents"]
Mood: [energetic, calm, professional, playful]
Exclude: [no borders, no clip art, no text]
```

- **With a product image**, pass it as a reference and say: "Keep the product, its label and logo exactly as in the photo."
- Image models only output a few aspect ratios and ignore pixel sizes in the prompt. Generate at the nearest ratio and ask to "keep key subjects within the central 80%", then place the raster in the HTML canvas with `object-fit: cover` and render at the exact size
- Prefer "no text, leave the upper third clear" and set the copy in code. Raster text misspells and blurs when scaled
- Read the output and fix one issue per follow-up turn ('Change X. Change nothing else.')

Text over a raster:

```html
<style>body{margin:0}</style>
<div class="canvas" style="width:1200px;height:628px;position:relative;background:url('visual.png') center/cover;">
  <h1 class="headline" style="position:absolute;left:64px;top:56px;max-width:60%;color:#fff;">NEW ARRIVAL</h1>
</div>
```

Render it with `render_still` (`width: 1200`, `height: 628`), Read the PNG, and run `qa` at the same `width` and `height` with `fixedFrame: true` -- contrast over a busy photo often needs a scrim.

---

## Step 4: Apply Composition Principles

### Rule of Thirds
Divide the canvas into a 3x3 grid. Center key elements on the four line intersections (33%/67%), not in the middle cell.

```css
/* Focal point centered on the upper-left power point */
.focal-point {
  position: absolute;
  left: 33.33%;
  top: 33.33%;
  transform: translate(-50%, -50%);
}
```

### Golden Ratio (1:1.618)
Use for sizing relationships between elements:
- If headline is 48px, subheadline should be ~30px (48 / 1.618)
- If main content area is 600px, sidebar/accent area should be ~370px

### Focal Point Hierarchy
Every graphic needs ONE clear focal point. Layer importance:

1. **Primary focal point** -- the thing the eye hits first (largest, most contrasted)
2. **Secondary elements** -- supporting info (medium size, moderate contrast)
3. **Tertiary details** -- fine print, logos, decorative (smallest, lowest contrast)

### Z-Pattern (for text-heavy graphics)
Eye moves: top-left -> top-right -> diagonal to bottom-left -> bottom-right

### F-Pattern (for information-dense layouts)
Eye scans horizontally across top, then drops down and scans shorter horizontal lines.

---

## Step 5: Color Scheme Selection

Start from the brand colors, then apply these strategies. For tints and shades of a brand color: the palette tool (`palette.mjs --from "#2563eb" --css`; the command with its full path is in the design and design-system skills).

### Complementary Enhancement
```
Primary + its complement for maximum contrast
Use 60-30-10 rule: 60% dominant, 30% secondary, 10% accent
```

### Gradient Techniques

```css
/* Smooth multi-stop gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Mesh-style gradient (multiple radials) */
background:
  radial-gradient(at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
  radial-gradient(at 80% 20%, rgba(255, 119, 115, 0.3) 0%, transparent 50%),
  radial-gradient(at 50% 50%, rgba(76, 29, 149, 1) 0%, rgba(15, 23, 42, 1) 100%);

/* Conic gradient for unique effects */
background: conic-gradient(from 45deg, #12c2e9, #c471ed, #f64f59, #12c2e9);

/* Animated gradient */
background: linear-gradient(270deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
background-size: 400% 400%;
animation: gradientShift 8s ease infinite;

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

### Color Overlay on Images
```css
.image-with-overlay {
  position: relative;
}
.image-with-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.7), rgba(124, 58, 237, 0.7));
  mix-blend-mode: multiply;
}
```

---

## Step 6: Typography Treatment

### Headline Hierarchy

```css
/* Display headline -- the main event */
.headline {
  font-family: var(--font-heading);
  font-size: clamp(2.5rem, 8cqw, 5rem); /* cqw = % of .canvas width, not the browser window */
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.02em;
  text-wrap: balance;
}

/* Subheadline -- supporting context */
.subheadline {
  font-family: var(--font-body);
  font-size: clamp(1rem, 2vw, 1.5rem);
  font-weight: 400;
  line-height: 1.4;
  opacity: 0.85;
}

/* Detail text -- dates, fine print */
.detail {
  font-family: var(--font-body);
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
```

### Text Effects

- **Gradient text**: `background: linear-gradient(...)` + `background-clip: text` + `-webkit-text-fill-color: transparent`
- **Outlined text**: `-webkit-text-stroke: 2px currentColor` + `-webkit-text-fill-color: transparent`
- **Glowing text**: Multi-layer `text-shadow` at increasing blur/spread with decreasing opacity
- **Embossed**: Transparent color + light text-shadow + dark bg-clip text
- **Depth/3D text**: Stacked 1px-offset text-shadows in progressively darker shades

---

## Step 7: Code Output

### Output Structure

Generate a self-contained HTML file with embedded CSS. Render it at exact size with `render_still` (Step 3) and Read the PNG before delivering:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- fonts: use a bundled face (Inter, Space Grotesk, Newsreader, JetBrains Mono, Caveat, STIX Two Text,
       Noto Sans Math) or a local font file; renders are offline -->
  <style>
    /* Reset and canvas setup */
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    .canvas {
      width: [WIDTH]px;
      height: [HEIGHT]px;
      position: relative;
      overflow: hidden;
      container-type: inline-size; /* enables cqw units inside */
      /* Background, gradients, etc. */
    }

    /* Layer structure */
    .background-layer { /* gradients, patterns, images */ }
    .content-layer { /* text, CTAs, key elements */ }
    .decoration-layer { /* shapes, accents, overlays */ }
  </style>
</head>
<body>
  <div class="canvas">
    <div class="background-layer">...</div>
    <div class="content-layer">...</div>
    <div class="decoration-layer">...</div>
  </div>
</body>
</html>
```

### Advanced CSS Techniques

#### Creative Shapes with clip-path
```css
/* Diagonal section */
.diagonal { clip-path: polygon(0 0, 100% 0, 100% 85%, 0 100%); }

/* Blob shape */
.blob { clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%); }

/* Circle reveal */
.circle-reveal { clip-path: circle(40% at 50% 50%); }

/* Custom wave */
.wave-bottom {
  clip-path: path('M0,200 C150,250 350,150 500,200 L500,0 L0,0 Z');
}
```

#### Glassmorphism
```css
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
}
```

#### Blend Modes for Image Integration
```css
.image-overlay {
  background-image: url('product.jpg');
  background-size: cover;
  background-blend-mode: overlay; /* or multiply, screen, soft-light */
  background-color: rgba(37, 99, 235, 0.5);
}
```

#### SVG Filters
Use inline `<svg>` with `<filter>` for noise (`feTurbulence` + `feColorMatrix` + `feBlend multiply`) and glow (`feGaussianBlur` + `feMerge`).

#### Decorative Elements
- **Floating circles**: Absolute-positioned, radial gradient, `filter: blur(40px)`
- **Grid/dot patterns**: `background-image` with `linear-gradient` or `radial-gradient` at low opacity, small `background-size`

#### Subtle Animations
- **Float**: `translateY(0 -> -10px -> 0)` over 4s ease-in-out infinite
- **Pulse glow**: `box-shadow` alternating intensity over 2-3s
- **Shimmer**: Linear gradient at 200% background-size, animate `background-position` from -200% to 200%

A still render captures one frame -- make sure the first frame is complete and readable.

---

## Step 8: Style-Specific Frameworks

Starting points for the code path; for the AI raster path, translate the same cues into the prompt. Fonts below are bundled faces; swap in the brand's faces when it has them.

```css
/* Minimalist: single accent, generous whitespace, thin rules, max 2 colors + neutrals */
.minimalist-canvas { background: #FAFAFA; padding: 60px; }
.minimalist-canvas .headline { font-size: 3rem; font-weight: 300; color: #171717; letter-spacing: -0.03em; }

/* Bold / Vibrant: saturated gradients, oversized type, geometric overlays */
.bold-canvas { background: linear-gradient(135deg, #FF6B6B, #FFE66D); }
.bold-canvas .headline { font-size: 5rem; font-weight: 900; text-transform: uppercase; letter-spacing: -0.04em; }

/* Luxurious: dark ground, gold accents, serif, refined spacing */
.luxury-canvas { background: #0A0A0A; color: #F5F0E8; }
.luxury-canvas .headline { font-family: 'Newsreader', serif; font-size: 3.5rem; font-weight: 400; letter-spacing: 0.05em; }
.luxury-canvas .accent { color: #D4AF37; border: 1px solid rgba(212, 175, 55, 0.3); }

/* Playful: bright colors, rounded everything, organic shapes */
.playful-canvas { background: #FFF8F0; border-radius: 24px; }
.playful-canvas .headline { font-family: 'Caveat', cursive; font-size: 3.5rem; color: #E03E3E; transform: rotate(-2deg); }

/* Corporate: blue/gray palette, structured 12-column grid, clean data */
.corporate-canvas { background: #FFFFFF; font-family: 'Inter', sans-serif; }
.corporate-canvas .headline { font-size: 2.5rem; font-weight: 700; color: #1E3A5F; }

/* Retro: warm palette #C84B31 #2D1B00 #F4E8C1 #ECDBBA, halftone (SVG), distressed texture */
.retro-canvas { background: #F4E8C1; color: #2D1B00; }
.retro-canvas .headline { font-family: 'Newsreader', serif; font-size: 4rem; font-weight: 800; }

/* Brutalist: B&W, raw borders, monospace, visible grid, overlapping elements */
.brutalist-canvas { background: #FFFFFF; border: 4px solid #000000; }
.brutalist-canvas .headline {
  font-family: 'JetBrains Mono', monospace; font-size: 4rem; font-weight: 700; text-transform: uppercase;
  color: #FFFFFF; mix-blend-mode: difference; /* white + difference = black on white, inverts over black blocks */
}
```

---

## Step 9: Quality Checklist

Before delivering any graphic, verify:

- [ ] Colors match the brand palette (`.easel/brand.md`), or the user was told defaults were used
- [ ] Typography uses the brand fonts (bundled or local font files -- renders are offline)
- [ ] Clear visual hierarchy -- eye knows where to look first
- [ ] Text contrast meets WCAG 2.x: 4.5:1 for normal text, 3:1 for large text (>=24px, or >=18.66px bold) -- verified with `qa` (`checks: ["contrast", "text_clipping"]`), which measures text only
- [ ] UI shapes like CTA buttons reach 3:1 against what surrounds them -- checked by hand: the shape's fill and its ground as hex, through the palette tool's `--contrast` (the design skill gives the command)
- [ ] Proper spacing -- nothing feels cramped
- [ ] Dimensions match the requested size
- [ ] Rendered PNG was Read and every word checked
- [ ] Code output is self-contained (no external URLs)
- [ ] AI raster (if used): product/logo unchanged, copy set in code, not in the raster
- [ ] Decorative elements enhance, not distract
- [ ] The design matches the intended style archetype
- [ ] All text content is accurate and spelled correctly

---

## Pro Tips

1. **Start with the background** -- get the mood right before adding content
2. **Use opacity** -- 0.05 to 0.15 opacity shapes create depth without distraction
3. **Layer gradients** -- multiple semi-transparent gradients create rich, unique backgrounds
4. **Constrain your palette** -- 3 colors maximum for most graphics, plus neutrals
5. **Size contrast** -- make the headline at least 3x larger than body text
6. **Whitespace is design** -- empty space is not wasted space, it is breathing room
7. **Test at actual size** -- Read the render at 1x (not only the retina render) to verify readability
8. **Use CSS custom properties** -- define colors once, reference everywhere for consistency
