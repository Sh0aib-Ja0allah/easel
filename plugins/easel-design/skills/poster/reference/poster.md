<!-- Easel: adapted from ArnavPuri/designskills @ c7873015add8571ca95043febad0d9e6c97ee5c6
     (github.com/ArnavPuri/designskills, skills/poster-design/SKILL.md), MIT License, Copyright (c) 2026 Arnav Puri;
     see NOTICE.md. Modified by Easel (2026-10-11): frontmatter/triggers dropped; code is the default output; Gemini CLI and
     ratio column replaced by an optional AI raster path; Python DPI/CMYK commands removed; render via render_still and
     render_pdf; brand file -> .easel/brand.md. -->

# Poster Design

Create striking posters and flyers for events, promotions, announcements, and product launches, for print or digital display. Default output is HTML/CSS/SVG rendered by the Easel engine -- to PNG for screens, to PDF for print. An AI raster is optional for photographic or painted artwork; copy stays in code.

Scope: standalone portrait/landscape posters and flyers. Feed posts -> `easel-design:social-graphic`; web/email banners -> the banners reference of `easel-design:social-graphic`.

---

## Step 1: Load Brand Context

1. Read `.easel/brand.md` first -- brand colors (hex), fonts, style archetype
2. If there is no brand file, run `easel-core:brand` or ask for the brand colours and faces; say when defaults were used
3. Posters often have more creative freedom than other formats -- but brand colors and fonts should still anchor the design

---

## Step 2: Determine Poster Type and Dimensions

### Standard Dimensions

| Format | Print Size | Pixels @300 DPI (trim) | Use Case |
|--------|------------|-----------------------|----------|
| A4 Portrait | 210 x 297mm | 2480 x 3508 | Standard flyer |
| A3 Portrait | 297 x 420mm | 3508 x 4961 | Large poster |
| US Letter | 8.5 x 11in | 2550 x 3300 | Standard US flyer |
| US Tabloid | 11 x 17in | 3300 x 5100 | Large US poster |
| 18 x 24in | 18 x 24in | 5400 x 7200 | Standard poster |
| 24 x 36in | 24 x 36in | 7200 x 10800 | Large poster |
| Web Poster | N/A | 800 x 1200 | Digital distribution |
| Social Poster | N/A | 1080 x 1350 | Instagram portrait |

(At 72 DPI, A4 = 595 x 842 and Letter = 612 x 792 -- screen previews only.)

### Rendering

- **Print (preferred):** `mcp__plugin_easel-core_easel__render_pdf` with `file` and `format` ("A4", "Letter") for trim size, or `width`/`height` with units for bleed size (e.g. `width: "216mm"`, `height: "303mm"`). `printBackground` is on, so full-bleed backgrounds print. Text and SVG stay vector and sharp at any size
- **Screen / PNG:** `mcp__plugin_easel-core_easel__render_still` with `file`, `width`, `height`. Output pixels = canvas size x `scale`: an A4 canvas of 1240 x 1754 with `scale: 2` gives 2480 x 3508 (300 DPI)
- Size the page in CSS to match: `@page { size: 216mm 303mm; margin: 0; }` and a canvas of the same size

### Print Specs

- **Bleed:** extend background 3mm (metric) or 0.125in (US) past the trim on every side. A4 with bleed = 216 x 303mm = 2551 x 3579px @300 DPI. Size raster artwork to the *bleed* size, not the trim size
- **Safe margin:** keep text and logos at least 3-5mm (0.125-0.25in) inside the trim
- **Resolution:** raster images need 300 DPI at final size for handheld flyers; 150-200 DPI is fine for large posters viewed from 1m+. Vector text and shapes in the PDF have no DPI limit -- build large posters (18 x 24in and up) in code rather than as one big raster
- **Color:** browsers output RGB. Ask the printer whether they accept RGB PDFs; if CMYK is required, convert with the printer's ICC profile in a layout tool and re-check saturated blues/greens, which shift most
- **DPI metadata:** pixels, not metadata, determine quality -- check the pixel size against the table above
- **Readable distance:** ~1 inch (25mm) of letter height per 10 feet (3m) of viewing distance for the headline

---

## Step 3: Choose Composition Framework

### Z-Pattern
The eye naturally scans in a Z shape. Best for posters with a clear reading order.

```
[Logo/Brand].............[Date]
.............................
......[MAIN VISUAL].........
.............................
[Details]...........[CTA/URL]
```

Place:
- Top-left: Brand mark / identifier
- Top-right: Key date or label
- Center: Hero visual / headline
- Bottom-left: Event details
- Bottom-right: CTA or ticket link

### Focal Point (Centered)
All elements radiate from a single center point. Best for bold, graphic posters.

```
         [Decorative Top]
     -------------------------
     |                       |
     |    [MAIN HEADLINE]    |
     |    [Visual Element]   |
     |    [Subheadline]      |
     |                       |
     -------------------------
         [Details / Footer]
```

### Layered / Overlap
Elements overlap and stack to create depth. Best for dynamic, modern posters.

```
Background layer:  Full-bleed gradient or image
Middle layer:      Large transparent text or shape
Content layer:     Headline + details on semi-transparent card
Top layer:         Decorative accents, floating elements
```

### Split Composition
Canvas divided into two distinct zones (vertical or diagonal split).

```
[Image/Visual Half] | [Text/Info Half]
```

Or diagonal:
```css
.poster { position: relative; }
.visual-half {
  clip-path: polygon(0 0, 65% 0, 45% 100%, 0 100%);
  position: absolute; inset: 0;
}
.text-half {
  clip-path: polygon(65% 0, 100% 0, 100% 100%, 45% 100%);
  position: absolute; inset: 0;
}
```

### Grid-Based
Structured layout using a visible or invisible grid. Best for information-dense posters.

```css
.poster-grid {
  display: grid;
  grid-template-rows: auto 1fr auto;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 40px;
}
.poster-grid .headline { grid-column: 1 / -1; }
.poster-grid .visual { grid-column: 1; }
.poster-grid .details { grid-column: 2; }
.poster-grid .footer { grid-column: 1 / -1; }
```

---

## Step 4: Typography Hierarchy for Posters

Posters need extreme typographic hierarchy. The headline must be readable from a distance (physical or scroll distance).

### Four-Level Hierarchy

```css
/* Fixed-size poster canvas: set `container-type: inline-size` on .poster so cqw
   scales with the poster width, not the browser window */
/* Level 1: Display / Headline -- the hook */
.poster-headline {
  font-family: var(--font-heading);
  font-size: clamp(48px, 10cqw, 160px);
  font-weight: 800;
  line-height: 0.95;
  letter-spacing: -0.03em;
  text-transform: uppercase; /* optional, depends on style */
}

/* Level 2: Subheadline -- context */
.poster-subheadline {
  font-family: var(--font-heading);
  font-size: clamp(20px, 4cqw, 48px);
  font-weight: 400;
  line-height: 1.3;
  letter-spacing: 0.02em;
}

/* Level 3: Body / Details -- the specifics */
.poster-body {
  font-family: var(--font-body);
  font-size: clamp(14px, 2.2cqw, 24px);
  font-weight: 400;
  line-height: 1.5;
}

/* Level 4: Fine print / Meta -- secondary info */
.poster-meta {
  font-family: var(--font-body);
  font-size: clamp(11px, 1.5cqw, 16px);
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
```

Fonts: `<!-- fonts: use a bundled face (Inter, Space Grotesk, Newsreader, JetBrains Mono, Caveat, STIX Two Text, Noto Sans Math) or a local font file; renders are offline -->`

### Typography Treatments for Posters

```css
/* Stacked headline -- each word on its own line */
.stacked-headline {
  display: flex;
  flex-direction: column;
  line-height: 0.9;
}
.stacked-headline span {
  display: block;
}
.stacked-headline span:nth-child(odd) {
  font-style: italic;
  font-weight: 300;
}

/* Mixed weight headline */
.mixed-weight span.light { font-weight: 300; }
.mixed-weight span.bold { font-weight: 800; }

/* Oversized first letter */
.drop-cap::first-letter {
  font-size: 3em;
  float: left;
  line-height: 0.8;
  margin-right: 8px;
  font-weight: 800;
}

/* Knockout text (text reveals background) */
.knockout-text {
  background: url('texture.jpg') center/cover;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## Step 5: Background Techniques

### Gradient Mesh
```css
.gradient-mesh {
  background:
    radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.4) 0%, transparent 50%),
    radial-gradient(at 100% 0%, rgba(236, 72, 153, 0.4) 0%, transparent 50%),
    radial-gradient(at 100% 100%, rgba(34, 197, 94, 0.3) 0%, transparent 50%),
    radial-gradient(at 0% 100%, rgba(245, 158, 11, 0.3) 0%, transparent 50%),
    linear-gradient(180deg, #0F172A, #1E293B);
}
```

### Photo Overlay with Gradient
```css
.photo-bg {
  background:
    linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.8) 100%),
    url('event-photo.jpg') center/cover;
}
```

### Geometric Pattern
```css
.geo-pattern {
  background-color: var(--primary);
  background-image:
    linear-gradient(30deg, rgba(255,255,255,0.05) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.05) 87.5%),
    linear-gradient(150deg, rgba(255,255,255,0.05) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.05) 87.5%),
    linear-gradient(30deg, rgba(255,255,255,0.05) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.05) 87.5%),
    linear-gradient(150deg, rgba(255,255,255,0.05) 12%, transparent 12.5%, transparent 87%, rgba(255,255,255,0.05) 87.5%);
  background-size: 80px 140px;
  background-position: 0 0, 0 0, 40px 70px, 40px 70px;
}
```

### Noise Texture Overlay
```html
<svg style="position:absolute;inset:0;width:100%;height:100%;opacity:0.06;pointer-events:none;">
  <filter id="noiseFilter">
    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
  </filter>
  <rect width="100%" height="100%" filter="url(#noiseFilter)"/>
</svg>
```

### Halftone Effect (Retro)
```html
<svg style="position:absolute;inset:0;width:100%;height:100%;mix-blend-mode:multiply;opacity:0.15;">
  <pattern id="halftone" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
    <circle cx="3" cy="3" r="1.5" fill="currentColor"/>
  </pattern>
  <rect width="100%" height="100%" fill="url(#halftone)"/>
</svg>
```

---

## Step 6: Event Information Layout

### Essential Event Info Block
```html
<div class="event-details">
  <div class="detail-row">
    <span class="detail-icon">&#x1F4C5;</span>
    <div>
      <strong>Saturday, March 28, 2026</strong>
      <span>Doors open 7:00 PM</span>
    </div>
  </div>
  <div class="detail-row">
    <span class="detail-icon">&#x1F4CD;</span>
    <div>
      <strong>The Grand Hall</strong>
      <span>123 Main Street, San Francisco, CA</span>
    </div>
  </div>
  <div class="detail-row">
    <span class="detail-icon">&#x1F3AB;</span>
    <div>
      <strong>$25 Early Bird / $35 Door</strong>
      <span>tickets.example.com</span>
    </div>
  </div>
</div>
```

Emoji glyphs depend on the fonts available to the renderer; for print, inline SVG icons are more reliable.

```css
.event-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: rgba(255,255,255,0.05);
  border-left: 3px solid var(--accent);
  border-radius: 0 8px 8px 0;
}
.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.detail-icon {
  font-size: 20px;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}
```

### CTA Button for Posters
```css
.poster-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 32px;
  background: var(--accent);
  color: #000;
  font-family: var(--font-heading);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-decoration: none;
  border-radius: 4px;
}
/* Print: a CTA is a label, not a button -- pair it with a short URL or QR code (min ~2cm) */
```

---

## Step 7: Style Variations

### Concert / Music Poster
- Dark background (black, deep purple, navy)
- High-contrast neon or vibrant accent colors
- Large artist name as the dominant element
- Distressed or grungy textures
- Decorative elements: sound waves, speakers, vinyl records
- Typography: bold condensed sans-serif or display fonts

### Tech Event / Conference
- Clean, modern gradient backgrounds
- Geometric shapes and abstract patterns
- Speaker headshots in circular frames
- Technology-themed decorative elements (circuit patterns, code snippets)
- Typography: clean sans-serif, monospace for details
- Color: blues, purples, teals

### Sale / Promotion
- Bright, attention-grabbing colors (red, yellow, orange)
- Discount percentage as the largest element
- "SALE" text with bold treatment
- Urgency indicators ("Limited Time", countdown)
- Clean product images
- Typography: impact/condensed bold for numbers, clean sans for details

### Product Launch
- Product image as hero (large, well-lit)
- Minimal text -- let the product speak
- Premium gradient background
- Launch date prominent
- Subtle glow effects around product
- Typography: elegant, spaced, modern

### Minimalist Event
- Single dominant color + white/black
- Lots of whitespace
- Typography-driven -- the text IS the design
- Thin lines and geometric accents
- Essential info only, no decoration
- Sophisticated, gallery-like aesthetic

### Vintage / Retro Event
- Warm color palette (#C84B31, #F4E8C1, #2D1B00)
- Halftone dot patterns
- Serif or slab-serif typography
- Aged paper texture backgrounds
- Border frames and ornamental dividers
- Distressed/rough edge effects

---

## Step 8: Decorative Elements

```css
/* Gradient rule */
.divider { height: 2px; background: linear-gradient(90deg, transparent, var(--accent), transparent); margin: 24px 0; }
/* Ornamental divider: lines either side of a centered label */
.ornament-divider { display: flex; align-items: center; gap: 16px; }
.ornament-divider::before, .ornament-divider::after { content: ''; flex: 1; height: 1px; background: currentColor; opacity: 0.3; }
/* Blurred floating shapes behind content */
.floating-shape { position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.2; pointer-events: none; }
/* Inset border frame (keep it inside the safe margin for print) */
.poster-frame { position: absolute; inset: 16px; border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; pointer-events: none; }
```

---

## Step 9: Verify

1. Render (Step 2) and Read the PNG; for a PDF, also render the same HTML with `render_still` as a preview and Read that
2. Check event name, date, time, venue, price, and URL character by character -- a wrong date ruins a poster
3. Run `mcp__plugin_easel-core_easel__qa` with the page's `width` and `height` in CSS px (bleed included), `fixedFrame: true` and `checks: ["contrast", "text_clipping"]`; fix every contrast finding, not only the hard failures
4. For a fuller review, use `easel-core:critique`

---

## AI raster path (optional)

Only when the user wants a photographic or painted raster and easel-ai-media is installed: use `easel-ai-media:image` (the user's own key; it shows the cost before spending). Everything else is built in HTML/SVG.

1. Generate the artwork without text at the nearest supported ratio (2:3 or 3:4 for most portrait posters) and place it in the canvas with `object-fit: cover`, sized to the bleed
2. Ask for margins: "keep the subject at least 5% inside every edge" -- protects the trim and bleed
3. AI output typically tops out around 4K px on the long side -- enough for A4/Letter at ~300 DPI, ~200 DPI at A3/Tabloid. For 18 x 24in and up, use the raster as a soft background and keep all type in vector
4. Set every word in code; if the user wants raster lettering, keep dates, venues, and fine print in code anyway. Read the output and fix one issue per follow-up turn

### Example Prompts

- **Event Poster:** "Create portrait poster artwork for [event theme]. [style] design with [color palette]. Open space in the top third for a large title and in the bottom fifth for details. No text."
- **Concert Poster:** "Create portrait concert poster artwork. Dark background with [neon/vibrant] accent colors. Distressed texture overlay. Open space for a bold title at top and ticket info at bottom. No text."
- **Sale Flyer:** "Create a bright, high-energy retail background in [color] with [product] images arranged in the lower half. Leave the upper half clear for a large discount figure. No text."

---

## Quality Checklist

- [ ] Headline readable from a distance (large, bold, high contrast)
- [ ] Clear visual hierarchy: Headline > Subheadline > Details > Meta
- [ ] Essential info present: What, When, Where, How (for events)
- [ ] Background sets the right mood and tone
- [ ] Brand colors and fonts from `.easel/brand.md` are applied
- [ ] Composition follows a clear framework (Z, focal, split, or grid)
- [ ] Whitespace is sufficient -- nothing feels cramped
- [ ] Decorative elements enhance without competing with content
- [ ] Dimensions match the intended output format; print files include bleed and meet the DPI target
- [ ] Rendered output was Read: every date, time, venue, price, and URL is exactly right
- [ ] `qa` contrast and text-clipping checks pass
- [ ] Code output is self-contained HTML/CSS (no external URLs; bundled or local fonts)
