<!-- Easel: adapted from upbrew-tech/svg-creator-skill @ 1eb83d602a992b69a1771c4e0116a9f7de6ffaa2
     (github.com/upbrew-tech/svg-creator-skill, references/advanced-techniques.md), Apache License 2.0, Copyright 2025 SVG Creator Skill Contributors;
     license text in licenses/Apache-2.0.txt, see NOTICE.md. Modified by Easel (2026-10-11): split from advanced-techniques.md (this file holds sections 6-13); fog mask placed over the fog; app-icon shadow filter fixed; SMIL notes corrected and engine checks added; reduced motion extended; the React forward-kinematics artifact replaced by an HTML page with an inline script rendered by the Easel engine; third-party animation products made generic. -->

# Advanced SVG techniques (2 of 2)

Sections 6-13. Indexed from [../SKILL.md](../SKILL.md); sections 1-5 (filters, turbulence,
colour grading, materials, composition templates) are in
[advanced-techniques.md](advanced-techniques.md). Filters referenced here by id (`#soft`,
`#drop-shadow`, `#salt-pepper`) are defined there; copy the ones you use into your `<defs>`.

Contents: 6. Atmosphere - 7. Icons with depth - 8. Logos with dimension - 9. Animation (CSS +
SMIL) - 10. Data visualizations - 11. Patterns and backgrounds - 12. Power features -
13. Characters and figures.

---

## 6. Atmospheric and Environmental Effects

### Light rays (god rays)
```xml
<g opacity="0.12" style="mix-blend-mode:screen">
  <polygon points="500,80 280,500 340,500" fill="#fbbf24"/>
  <polygon points="500,80 400,500 470,500" fill="#fbbf24"/>
  <polygon points="500,80 550,500 640,500" fill="#fbbf24"/>
  <polygon points="500,80 700,500 780,500" fill="#fbbf24"/>
</g>
```

### Fog / mist
A semi-transparent white band, masked to fade at its top and bottom. Mask content is in user
coordinates, so the mask rect covers the same area as the fog (y 300-500):
```xml
<defs>
  <linearGradient id="fog-fade" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="black"/>
    <stop offset="30%" stop-color="white"/>
    <stop offset="70%" stop-color="white"/>
    <stop offset="100%" stop-color="black"/>
  </linearGradient>
  <mask id="fog-mask">
    <rect y="300" width="800" height="200" fill="url(#fog-fade)"/>
  </mask>
</defs>
<rect y="300" width="800" height="200" fill="white" opacity="0.25" mask="url(#fog-mask)"/>
```

### Stars (with twinkling)
```xml
<style>
  @keyframes twinkle {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }
  .star { animation: twinkle 3s ease-in-out infinite; transform-box: fill-box; }
  @media (prefers-reduced-motion: reduce) { .star { animation: none; opacity: 0.8; } }
</style>
<g id="stars">
  <circle class="star" cx="50" cy="30" r="1" fill="white" style="animation-delay:0s"/>
  <circle class="star" cx="200" cy="55" r="1.5" fill="white" style="animation-delay:1.2s"/>
  <circle class="star" cx="400" cy="40" r="0.8" fill="white" style="animation-delay:0.5s"/>
  <!-- Vary: size 0.5-2, delay 0-4s -->
</g>
```

### Rain
```xml
<g opacity="0.25" stroke="white" stroke-width="1" stroke-linecap="round">
  <line x1="100" y1="0" x2="88" y2="60"/> <line x1="250" y1="20" x2="238" y2="80"/>
  <!-- Many more: a slight angle, lengths 40-80 -->
</g>
```

### Clouds
```xml
<g filter="url(#soft)">
  <ellipse cx="200" cy="100" rx="80" ry="35" fill="white" opacity="0.9"/>
  <ellipse cx="155" cy="108" rx="55" ry="30" fill="white" opacity="0.85"/>
  <ellipse cx="245" cy="106" rx="60" ry="28" fill="white" opacity="0.85"/>
  <ellipse cx="200" cy="118" rx="90" ry="25" fill="white" opacity="0.8"/>
</g>
```

---

## 7. Icons with Depth

At 24x24: 2-3 stop gradients instead of flat fills. `paint-order="stroke fill"` for halo
effects. Check a tile on a `contact_sheet` at `sizes: [32, 64, 128]`.

At 64x64 and up (app icons):
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1" color-interpolation="linearRGB">
      <stop offset="0%" stop-color="#818cf8"/>
      <stop offset="50%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#4338ca"/>
    </linearGradient>
    <filter id="ico-shadow" x="-20%" y="-20%" width="140%" height="140%"
      color-interpolation-filters="linearRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur"/>
      <feOffset in="blur" dy="2" result="offset"/>
      <feFlood flood-color="#1e1b4b" flood-opacity="0.25" result="color"/>
      <feComposite in="color" in2="offset" operator="in" result="shadow"/>
      <feMerge><feMergeNode in="shadow"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <!-- Inset 4 so the shadow stays inside the viewBox -->
  <rect x="4" y="3" width="56" height="56" rx="13" fill="url(#bg)" filter="url(#ico-shadow)"/>
  <!-- Top shine -->
  <rect x="7" y="6" width="50" height="24" rx="10" fill="white" opacity="0.12"/>
  <!-- Glyph, drawn around the centre -->
  <g transform="translate(32,31)" fill="none" stroke="white" stroke-width="2.5"
    stroke-linecap="round" stroke-linejoin="round">
    <path d="M-10 0 L-3 7 L11 -8"/>
  </g>
</svg>
```

---

## 8. Logos with Dimension

The technique for a mark with depth; a logo project as a whole is easel-design:logo.
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img" aria-labelledby="lg-t">
  <title id="lg-t">Mark</title>
  <defs>
    <linearGradient id="logo-fill" x1="0" y1="0" x2="0.5" y2="1"
      color-interpolation="linearRGB">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="50%" stop-color="#4f46e5"/>
      <stop offset="100%" stop-color="#3730a3"/>
    </linearGradient>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>
  </defs>
  <!-- Cast shadow -->
  <circle cx="103" cy="106" r="72" fill="#1e1b4b" opacity="0.15" filter="url(#soft)"/>
  <!-- Main shape -->
  <circle cx="100" cy="100" r="70" fill="url(#logo-fill)"/>
  <!-- Top highlight arc -->
  <path d="M45,75 Q100,40 155,75" fill="none" stroke="white" stroke-width="2"
    opacity="0.15" stroke-linecap="round"/>
  <!-- Emblem: a white path centred on (100, 100) goes here -->
</svg>
```

---

## 9. Animation (CSS + SMIL)

### CSS animation essentials
Always pair with:
```css
transform-box: fill-box;
transform-origin: center;
```

### Spinner
```xml
<style>
  .spin {
    fill: none; stroke: #3b82f6; stroke-width: 4;
    stroke-linecap: round; stroke-dasharray: 80 120;
    animation: rotate 1s linear infinite;
    transform-box: fill-box; transform-origin: center;
  }
  @keyframes rotate { to { transform: rotate(360deg); } }
</style>
```

### Line drawing reveal (using pathLength)
```xml
<style>
  .draw {
    stroke-dasharray: 1; stroke-dashoffset: 1;
    animation: reveal 2s ease forwards;
    transform-box: fill-box;
  }
  @keyframes reveal { to { stroke-dashoffset: 0; } }
</style>
<path pathLength="1" class="draw" d="..." fill="none" stroke="#333" stroke-width="2"/>
```

### Staggered entrance
```css
.item {
  opacity: 0; transform: translateY(10px);
  animation: fadeUp 0.5s ease forwards;
  transform-box: fill-box; transform-origin: center;
}
.item:nth-child(1) { animation-delay: 0s; }
.item:nth-child(2) { animation-delay: 0.15s; }
.item:nth-child(3) { animation-delay: 0.3s; }
@keyframes fadeUp {
  to { opacity: 1; transform: translateY(0); }
}
```

### SMIL animation
SMIL lives in the markup itself, so an animated SVG stays self-contained, including when it is
used as `<img src>` or a CSS background (scripts never run there; CSS animation written inside
the file runs too). Use SMIL for simple self-contained loops and for sequencing with `begin`.

**Attribute animation:**
```xml
<circle cx="50" cy="50" r="20" fill="#3b82f6">
  <animate attributeName="r" values="20;25;20" dur="2s" repeatCount="indefinite"/>
</circle>
```

**Transform animation:**
```xml
<rect x="-10" y="-10" width="20" height="20" fill="#ef4444">
  <animateTransform attributeName="transform" type="rotate"
    values="0 50 50;360 50 50" dur="3s" repeatCount="indefinite"/>
</rect>
```

**Motion along a path:**
```xml
<circle r="5" fill="#3b82f6">
  <animateMotion dur="4s" repeatCount="indefinite" rotate="auto">
    <mpath href="#motion-path"/>
  </animateMotion>
</circle>
<path id="motion-path" d="M50,200 Q200,50 350,200" fill="none"/>
```

**Sequential timing:**
```xml
<circle cx="50" cy="50" r="0" fill="#3b82f6">
  <animate id="grow" attributeName="r" from="0" to="20" dur="0.5s" fill="freeze"/>
</circle>
<circle cx="100" cy="50" r="0" fill="#ef4444">
  <animate attributeName="r" from="0" to="20" dur="0.5s" fill="freeze"
    begin="grow.end+0.2s"/>
</circle>
```

### Reduced motion
Always include in animated SVGs:
```xml
<style>
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
</style>
```
This jumps CSS animations to their end state, so make sure the end state is a good still
(an entrance ends visible; a loop ends on a neutral pose). SMIL ignores this media query: keep
SMIL motion small and slow, or build the motion in CSS when it must stop for reduced motion.

### Checking animation with the Easel engine
- `mcp__plugin_easel-core_easel__filmstrip` with `file` and `count: 6` (or `times`; the length comes
  from the CSS animation, or pass `duration`): one sheet
  of frames with timestamps. Look for jumps, parts that drift apart, loops that do not close.
- `mcp__plugin_easel-core_easel__render_still` with `t` for a single moment, and with
  `reducedMotion: "reduce"` for the reduced-motion still.
- The engine seeks CSS animations itself. SMIL keeps its own clock, so for SMIL frames write a
  small HTML page that inlines the SVG and defines
  `window.renderAt = (t) => { svg.pauseAnimations(); svg.setCurrentTime(t); }`, and render
  that page.
- For video output, use easel-motion:animate.

---

## 10. Data Visualizations

Compute the plot area, baseline and scale first; every bar's `y + height` equals the
baseline. Plain charts: easel-illustrate:svg; infographics: easel-design:infographic.

### Bar chart (gradient + shadows)
```xml
<defs>
  <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1" color-interpolation="linearRGB">
    <stop offset="0%" stop-color="#93c5fd"/>
    <stop offset="50%" stop-color="#3b82f6"/>
    <stop offset="100%" stop-color="#1d4ed8"/>
  </linearGradient>
</defs>
<!-- baseline y 250: y 80 + height 170 = 250 -->
<rect x="40" y="80" width="50" height="170" rx="4" fill="url(#bar)"
  filter="url(#drop-shadow)"/>
```

### Donut chart
```xml
<!-- r 80 -> circumference 502.65; a 40% segment = 201 -->
<!-- Shadow -->
<circle cx="200" cy="205" r="80" fill="none" stroke="#1e1b4b" stroke-width="30"
  opacity="0.1" filter="url(#soft)"/>
<!-- Segment: stroke-dasharray = (share x circumference), circumference -->
<circle cx="200" cy="200" r="80" fill="none" stroke="#3b82f6" stroke-width="30"
  stroke-dasharray="201 503" transform="rotate(-90 200 200)" stroke-linecap="round"/>
```

### Axis lines
Grid: `#f1f5f9`, stroke-width 0.5. Axes: `#94a3b8`, stroke-width 1. Labels:
`font-size="11"`, `font-family="Inter, sans-serif"`, `fill="#475569"` (4.5:1 or better on
white). Round caps everywhere.

---

## 11. Patterns and Backgrounds

### Mesh gradient workaround
Layer 3-5 overlapping radial gradients with different positions, offset focal points and
`spreadMethod="pad"`:
```xml
<defs>
  <radialGradient id="blob1" cx="30%" cy="25%" r="50%" fx="25%" fy="20%"
    color-interpolation="linearRGB">
    <stop offset="0%" stop-color="#818cf8" stop-opacity="0.6"/>
    <stop offset="100%" stop-color="#818cf8" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="blob2" cx="70%" cy="60%" r="45%"
    color-interpolation="linearRGB">
    <stop offset="0%" stop-color="#f472b6" stop-opacity="0.5"/>
    <stop offset="100%" stop-color="#f472b6" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect width="800" height="600" fill="#0f172a"/>
<rect width="800" height="600" fill="url(#blob1)"/>
<rect width="800" height="600" fill="url(#blob2)"/>
<!-- Noise overlay for an organic feel -->
<rect width="800" height="600" filter="url(#salt-pepper)" opacity="0.06"/>
```

### Pattern tiles
```xml
<!-- Dots -->
<pattern id="dots" patternUnits="userSpaceOnUse" width="20" height="20">
  <circle cx="10" cy="10" r="1.5" fill="#cbd5e1"/>
</pattern>
<!-- Diagonal lines (patternTransform) -->
<pattern id="diag" patternUnits="userSpaceOnUse" width="10" height="10"
  patternTransform="rotate(45)">
  <line x1="0" y1="0" x2="0" y2="10" stroke="#e2e8f0" stroke-width="1"/>
</pattern>
<!-- Waves -->
<pattern id="wave" patternUnits="userSpaceOnUse" width="100" height="20">
  <path d="M0,10 Q25,0 50,10 Q75,20 100,10" fill="none" stroke="#e2e8f0"/>
</pattern>
```

---

## 12. Power Features Reference

### `paint-order`
Controls render order. Default: fill -> stroke -> markers. `paint-order="stroke fill"` draws
the stroke behind the fill: outlined text and halo effects without duplicate elements.

### `vector-effect="non-scaling-stroke"`
Keeps the stroke width constant whatever the transforms or zoom. Essential for technical
illustration and icons used at several scales.

### `pathLength="1"`
Normalizes the path length for dash calculations. `stroke-dasharray="0.5 0.5"` = 50% dashed
whatever the real length. Simplifies line-drawing animations a lot.

### `gradientTransform`
Transforms the gradient's coordinate system: `<linearGradient id="angled"
gradientTransform="rotate(30)">`. No need to recompute x1/y1/x2/y2; just rotate.

### `spreadMethod`
On gradients, what happens past the ends:
- `pad` (default): extends the last colour
- `reflect`: mirror (good for metallic surfaces)
- `repeat`: tiles the gradient

### Nested `<svg>` elements
Independent coordinate systems inside a parent SVG. Each nested SVG has its own viewBox,
useful for components with different aspect ratios or scales.

### `<symbol>` + `<use>` + CSS custom properties
```xml
<symbol id="icon" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="10" fill="var(--icon-bg, #3b82f6)"/>
  <path d="M7 12l3 3 7-7" fill="none" stroke="var(--icon-stroke, white)" stroke-width="2"/>
</symbol>
<use href="#icon" x="10" y="10" width="48" height="48"
  style="--icon-bg: #ef4444; --icon-stroke: #fff"/>
```

### `color-interpolation: linearRGB`
On gradient elements for smoother, more physically accurate transitions. Prevents dark
banding in the middle of a gradient; default sRGB can make mid-range blends look darker than
expected.

---

## 13. Characters and Figures

### The challenge, and the render-and-look loop

Coordinate math cannot be checked by reading it. Assembling a character from separate shapes
(overlapping shapes, joint covers or single-path silhouettes alike) produces gaps,
misalignment and disconnection unless every step is rendered and looked at. So: write ->
`render_still` -> Read the PNG -> fix -> repeat; build in steps (torso, then legs, then arms,
rendering after each); expect 5-8 passes. The full loop is in [../SKILL.md](../SKILL.md).

### Static characters: thick rounded lines

The simplest approach that gives connected bodies: `<line>` with `stroke-linecap="round"` and
a large `stroke-width`. Round end caps make natural tapered limbs. Add a `<circle>` at every
joint, drawn after the lines.

```xml
<!-- Torso -->
<line x1="200" y1="180" x2="200" y2="300" stroke="#1e40af" stroke-width="30" stroke-linecap="round"/>
<!-- Upper arm -->
<line x1="200" y1="195" x2="160" y2="260" stroke="#dea87a" stroke-width="16" stroke-linecap="round"/>
<!-- Shoulder joint cover (on top) -->
<circle cx="200" cy="195" r="14" fill="#dea87a"/>
```

Render and check each piece after adding it.

### Animated characters: forward kinematics in an inline script

Write an HTML page with the SVG inline and a small script that computes every joint from its
parent. Connected joints are guaranteed because each position comes from its parent's
position, an angle and a fixed bone length. The page defines `window.renderAt(t)`, which the
Easel engine calls to seek to any time, so `filmstrip`, `render_still` with `t` and video
renders all see the exact pose:

```html
<!doctype html>
<html><head><meta charset="utf-8">
<style>html,body{margin:0;background:#f8fafc}svg{display:block;width:100vw;height:100vh}</style>
</head><body>
<svg id="fig" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img" aria-label="Figure waving">
  <line x1="200" y1="150" x2="200" y2="280" stroke="#1e40af" stroke-width="30" stroke-linecap="round"/>
  <circle cx="200" cy="105" r="30" fill="#dea87a"/>
  <line id="upper" stroke="#dea87a" stroke-width="16" stroke-linecap="round"/>
  <line id="fore" stroke="#dea87a" stroke-width="14" stroke-linecap="round"/>
  <circle id="shoulderJ" r="9" fill="#dea87a"/>
  <circle id="elbowJ" r="8" fill="#dea87a"/>
</svg>
<script>
  // parent position + angle + bone length -> child position
  const fk = (p, angle, len) => ({ x: p.x + Math.cos(angle) * len, y: p.y + Math.sin(angle) * len });
  const BONES = { upperArm: 50, forearm: 45 };
  const shoulder = { x: 212, y: 160 };
  const set = (id, attrs) => { const el = document.getElementById(id); for (const k in attrs) el.setAttribute(k, attrs[k]); };
  window.renderAt = (t) => {
    const phase = (t / 1.2) * 2 * Math.PI;                 // a 1.2 s wave cycle
    const shoulderAngle = -0.5 + 0.15 * Math.sin(phase);   // radians; animate ANGLES, not positions
    const elbowAngle = -0.7 + 0.45 * Math.sin(phase + 0.8); // ranges keep the hand clear of the head
    const elbow = fk(shoulder, shoulderAngle, BONES.upperArm);       // always 50 from the shoulder
    const wrist = fk(elbow, shoulderAngle + elbowAngle, BONES.forearm); // always 45 from the elbow
    set('upper', { x1: shoulder.x, y1: shoulder.y, x2: elbow.x, y2: elbow.y });
    set('fore', { x1: elbow.x, y1: elbow.y, x2: wrist.x, y2: wrist.y });
    set('shoulderJ', { cx: shoulder.x, cy: shoulder.y });
    set('elbowJ', { cx: elbow.x, cy: elbow.y });
  };
  window.renderAt(0);
  window.__composition = { width: 400, height: 400, duration: 1.2, fps: 30 }; // one wave cycle: filmstrip count and render_video read it
  // live playback in a browser; reduced motion keeps the first pose. Read performance.now(),
  // not the rAF timestamp: the engine pins performance.now() to the seeked time, so the loop
  // cannot overwrite the pose it is capturing.
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const loop = () => { window.renderAt(performance.now() / 1000); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
</script>
</body></html>
```

Key principles: **bone lengths** are constants and **joint angles** are the animated values;
compute EVERY joint from its parent with `fk()`; interpolate ANGLES, never positions; draw with
`<line>` + round caps + `<circle>` joint covers. Check it with `filmstrip` (`file` = the HTML page, `count: 8`, `width`/`height` at the viewBox
aspect); `count` spreads the frames over `window.__composition.duration`. The SVG in the page is the static deliverable at any pose; for a video, hand the rig
to easel-motion:animate.

### Proportions (8-head system)

Standing adult: total height = 8 x head height. Shoulders about 2.5 head-widths, hips about
1.5. Elbow at the waist, wrist at the crotch, knee 2 heads above the ground. Stylized mascots
use 2-4 heads for a friendlier read.

### Animation timing

Walk: 1-1.2s. Run: 0.5-0.7s. Push-up: 2-3s. Jump: 1.5s. Breathing: 3-4s. Use `ease-in-out`
(or a sine on the angle) for organic motion.

### When a dedicated tool fits better

For production character animation with state machines, mesh deformation or game runtimes, a
dedicated 2D skeletal-animation tool is the better home. Offer the static SVG character, built
in separate named groups per body part, as a starting point to import there.
