<!-- Easel: adapted from upbrew-tech/svg-creator-skill @ 1eb83d602a992b69a1771c4e0116a9f7de6ffaa2
     (github.com/upbrew-tech/svg-creator-skill, references/advanced-techniques.md), Apache License 2.0, Copyright 2025 SVG Creator Skill Contributors;
     license text in licenses/Apache-2.0.txt, see NOTICE.md. Modified by Easel (2026-10-11): split into this file (sections 1-5) and effects-and-motion.md (sections 6-13); vignette tinted navy instead of black; landscape template given working defs; object study fixed (clip path matched to the object, contact shadow moved to its base, missing gradient and grain filter defined, title added) and render-checked with the Easel engine. -->

# Advanced SVG techniques (1 of 2)

Cookbook for reference-grade SVG illustration. Indexed from [../SKILL.md](../SKILL.md);
sections 6-13 (atmosphere, icons and logos with depth, animation, data viz, patterns, power
features, characters) are in [effects-and-motion.md](effects-and-motion.md). All
filters use `color-interpolation-filters="linearRGB"` for physically accurate blending.

## Contents

1. Filter chain cookbook
2. feTurbulence parameter guide
3. feComponentTransfer colour grading
4. Material simulation
5. Illustration composition templates

---

## 1. Filter Chain Cookbook

All filters: `x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="linearRGB"`.
A filter is clipped to that region; widen it when a blur or shadow looks cut off in the render.

### Drop shadow (blue-tinted)
```xml
<filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%"
  color-interpolation-filters="linearRGB">
  <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur"/>
  <feOffset in="blur" dx="3" dy="5" result="offset"/>
  <feFlood flood-color="#1e1b4b" flood-opacity="0.30" result="color"/>
  <feComposite in="color" in2="offset" operator="in" result="shadow"/>
  <feMerge>
    <feMergeNode in="shadow"/>
    <feMergeNode in="SourceGraphic"/>
  </feMerge>
</filter>
```

### Contact shadow (tight, under objects)
Same as the drop shadow but `stdDeviation="1.5"`, `dx="0" dy="1"`, `flood-opacity="0.40"`.

### Cast shadow (projected, softening)
Same pattern: `stdDeviation="6"`, `dx="4" dy="8"`, `flood-opacity="0.20"`.

### Soft glow
```xml
<filter id="glow" x="-30%" y="-30%" width="160%" height="160%"
  color-interpolation-filters="linearRGB">
  <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur"/>
  <feMerge>
    <feMergeNode in="blur"/>
    <feMergeNode in="SourceGraphic"/>
  </feMerge>
</filter>
```
For a coloured glow, add `<feColorMatrix type="matrix">` before the merge to tint the blur.

### Inner shadow
```xml
<filter id="inner-shadow" x="-10%" y="-10%" width="120%" height="120%"
  color-interpolation-filters="linearRGB">
  <feComponentTransfer in="SourceAlpha" result="inverse">
    <feFuncA type="table" tableValues="1 0"/>
  </feComponentTransfer>
  <feGaussianBlur in="inverse" stdDeviation="3" result="blur"/>
  <feOffset in="blur" dx="2" dy="3" result="offset"/>
  <feComposite in="offset" in2="SourceAlpha" operator="in" result="inner"/>
  <feFlood flood-color="#1e1b4b" flood-opacity="0.5" result="color"/>
  <feComposite in="color" in2="inner" operator="in" result="shadow"/>
  <feMerge>
    <feMergeNode in="SourceGraphic"/>
    <feMergeNode in="shadow"/>
  </feMerge>
</filter>
```

### Salt and pepper texture (two-layer grain)
A "pepper" layer darkens via multiply, a "salt" layer brightens via overlay. Both at low
opacity for a tactile quality:
```xml
<filter id="salt-pepper" x="0" y="0" width="100%" height="100%"
  color-interpolation-filters="linearRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3"
    stitchTiles="stitch" result="noise"/>
  <feColorMatrix in="noise" type="saturate" values="0" result="mono"/>
  <!-- Pepper (shadow grain) -->
  <feBlend in="SourceGraphic" in2="mono" mode="multiply" result="pepper"/>
  <!-- Salt (highlight grain) -->
  <feBlend in="pepper" in2="mono" mode="overlay" result="salted"/>
  <!-- Intensity: lower the slope below 1 to fade the result -->
  <feComponentTransfer in="salted">
    <feFuncA type="linear" slope="1" intercept="0"/>
  </feComponentTransfer>
</filter>
```
Apply per element for selective texturing. Use `mode="soft-light"` instead of `overlay` for a
subtler salt layer.

### Subtle paper texture
```xml
<filter id="paper" color-interpolation-filters="linearRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise"/>
  <feColorMatrix in="noise" type="saturate" values="0" result="gray"/>
  <feComponentTransfer in="gray" result="subtle">
    <feFuncR type="linear" slope="0.12" intercept="0.44"/>
    <feFuncG type="linear" slope="0.12" intercept="0.44"/>
    <feFuncB type="linear" slope="0.12" intercept="0.44"/>
  </feComponentTransfer>
  <feBlend in="SourceGraphic" in2="subtle" mode="multiply"/>
</filter>
```

### Specular lighting (shiny surface)
```xml
<filter id="specular" x="-10%" y="-10%" width="120%" height="120%"
  color-interpolation-filters="linearRGB">
  <feSpecularLighting in="SourceAlpha" surfaceScale="5" specularConstant="0.75"
    specularExponent="25" lighting-color="#ffffff" result="specular">
    <fePointLight x="250" y="100" z="300"/>
  </feSpecularLighting>
  <feComposite in="specular" in2="SourceAlpha" operator="in" result="lit"/>
  <feMerge>
    <feMergeNode in="SourceGraphic"/>
    <feMergeNode in="lit"/>
  </feMerge>
</filter>
```
`specularExponent`: 20-40 = glossy, 5-10 = matte. Light position: x, y in SVG user
coordinates, z = height above the surface.

### Diffuse lighting (matte surface)
```xml
<filter id="diffuse" color-interpolation-filters="linearRGB">
  <feDiffuseLighting in="SourceAlpha" surfaceScale="4" diffuseConstant="1"
    lighting-color="#ffe4c4" result="diffuse">
    <feDistantLight azimuth="225" elevation="45"/>
  </feDiffuseLighting>
  <feComposite in="diffuse" in2="SourceGraphic" operator="in" result="lit"/>
  <feBlend in="SourceGraphic" in2="lit" mode="multiply"/>
</filter>
```

### Emboss / bevel
```xml
<filter id="emboss" color-interpolation-filters="linearRGB">
  <feConvolveMatrix order="3" kernelMatrix="-2 -1 0  -1 1 1  0 1 2"/>
</filter>
```
Sharpen: `kernelMatrix="0 -1 0  -1 5 -1  0 -1 0"`.

### Glassmorphism (frosted glass)
```xml
<filter id="frosted-glass" x="-20%" y="-20%" width="140%" height="140%"
  color-interpolation-filters="linearRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise"/>
  <feColorMatrix in="noise" type="matrix" result="soft"
    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.5 0"/>
  <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blurred"/>
  <feDisplacementMap in="blurred" in2="soft" scale="12"
    xChannelSelector="R" yChannelSelector="G" result="distorted"/>
  <feSpecularLighting in="soft" surfaceScale="2" specularConstant="0.6"
    specularExponent="30" lighting-color="#ffffff" result="shine">
    <fePointLight x="200" y="50" z="200"/>
  </feSpecularLighting>
  <feComposite in="shine" in2="SourceAlpha" operator="in" result="glass-shine"/>
  <feMerge>
    <feMergeNode in="distorted"/>
    <feMergeNode in="glass-shine"/>
  </feMerge>
</filter>
```

### Vignette
A deep navy rather than black, like every shadow:
```xml
<radialGradient id="vignette-grad" cx="50%" cy="50%" r="60%">
  <stop offset="0%" stop-color="#0f172a" stop-opacity="0"/>
  <stop offset="100%" stop-color="#0f172a" stop-opacity="0.45"/>
</radialGradient>
<rect width="800" height="600" fill="url(#vignette-grad)" style="mix-blend-mode:multiply"/>
```

---

## 2. feTurbulence Parameter Guide

`baseFrequency` controls the texture scale:
- **0.01-0.05**: large cloud-like patterns, terrain
- **0.05-0.2**: medium organic textures (water, marble, smoke)
- **0.2-0.5**: coarse grain (stone, sand)
- **0.5-0.8**: fine grain (paper, film noise), the most useful for texture overlays
- **0.8-2.0**: very fine static

Two values stretch it directionally:
- `"0.02 0.2"`: horizontal grain (wood)
- `"0.01 0.5"`: strong horizontal stretch (glitch)

`numOctaves`: 1 = rough, **3 = sweet spot**, 5+ = diminishing returns (and slower renders).

`type="fractalNoise"` vs `type="turbulence"`:
- `fractalNoise`: smoother, better for grain and texture overlays
- `turbulence`: more chaotic, better for clouds, smoke, water

`seed`: a different integer gives a different pattern. Change it for variety.

`stitchTiles="stitch"`: seamless tiling at the boundaries. Always use it for pattern fills.

---

## 3. feComponentTransfer Color Grading

Per-channel colour manipulation for grading, duotone effects and tonal control.

### Increase contrast
```xml
<filter id="contrast" color-interpolation-filters="linearRGB">
  <feComponentTransfer>
    <feFuncR type="linear" slope="1.5" intercept="-0.15"/>
    <feFuncG type="linear" slope="1.5" intercept="-0.15"/>
    <feFuncB type="linear" slope="1.5" intercept="-0.15"/>
  </feComponentTransfer>
</filter>
```

### Warm colour shift (sunset feel)
```xml
<feComponentTransfer>
  <feFuncR type="linear" slope="1.1" intercept="0.05"/>
  <feFuncG type="linear" slope="0.95" intercept="0"/>
  <feFuncB type="linear" slope="0.85" intercept="-0.05"/>
</feComponentTransfer>
```

### Cool colour shift (moonlit feel)
```xml
<feComponentTransfer>
  <feFuncR type="linear" slope="0.85" intercept="-0.05"/>
  <feFuncG type="linear" slope="0.9" intercept="0"/>
  <feFuncB type="linear" slope="1.15" intercept="0.05"/>
</feComponentTransfer>
```

### Posterize (reduce colour steps)
```xml
<feComponentTransfer>
  <feFuncR type="discrete" tableValues="0 0.25 0.5 0.75 1"/>
  <feFuncG type="discrete" tableValues="0 0.25 0.5 0.75 1"/>
  <feFuncB type="discrete" tableValues="0 0.25 0.5 0.75 1"/>
</feComponentTransfer>
```

### Duotone (two-colour map)
```xml
<filter id="duotone" color-interpolation-filters="linearRGB">
  <feColorMatrix type="saturate" values="0" result="gray"/>
  <feComponentTransfer in="gray">
    <feFuncR type="table" tableValues="0.1 0.9"/>   <!-- dark red to light red -->
    <feFuncG type="table" tableValues="0.0 0.6"/>   <!-- dark green to light green -->
    <feFuncB type="table" tableValues="0.3 0.95"/>  <!-- dark blue to light blue -->
  </feComponentTransfer>
</filter>
```

### Gamma curve (lighten midtones)
```xml
<feComponentTransfer>
  <feFuncR type="gamma" amplitude="1" exponent="0.7" offset="0"/>
  <feFuncG type="gamma" amplitude="1" exponent="0.7" offset="0"/>
  <feFuncB type="gamma" amplitude="1" exponent="0.7" offset="0"/>
</feComponentTransfer>
```

---

## 4. Material Simulation

### Metal (steel/chrome)
High-contrast multi-stop gradient with sharp transitions. `spreadMethod="reflect"` gives a
brushed-metal repeat:
```xml
<linearGradient id="steel" x1="0" y1="0" x2="0" y2="1" color-interpolation="linearRGB">
  <stop offset="0%" stop-color="#e8e8e8"/>
  <stop offset="20%" stop-color="#6b6b6b"/>
  <stop offset="35%" stop-color="#d4d4d4"/>
  <stop offset="50%" stop-color="#888"/>
  <stop offset="65%" stop-color="#e0e0e0"/>
  <stop offset="80%" stop-color="#555"/>
  <stop offset="100%" stop-color="#b0b0b0"/>
</linearGradient>
```
Add thin near-white specular lines along the edges, apply the specular filter, and include
reflected environment colours at 15-30% opacity.

### Gold
Same structure, warm tones:
- Highlights: #fff7d1, #ffd700, #ffec99
- Base: #daa520, #b8860b
- Shadows: #8b6914, #6b4c0a, #4a3508

### Glass / transparent
```xml
<!-- Base shape at low opacity -->
<rect rx="12" width="200" height="300" fill="#88ccff" opacity="0.12"/>
<!-- Highlight streak (angled linear gradient) -->
<rect rx="8" x="15" y="8" width="50" height="240"
  fill="url(#glass-highlight)" opacity="0.5"/>
<!-- Edge darkening (inner shadow filter or a dark border) -->
<rect rx="12" width="200" height="300" fill="none" stroke="#1e3a5f" stroke-width="1"
  opacity="0.3"/>
<!-- Reflected light on the bottom edge -->
<ellipse cx="100" cy="285" rx="70" ry="10" fill="white" opacity="0.1"/>
```
`#glass-highlight`: a linear gradient from white at `stop-opacity="0.6"` (0%) to white at
`stop-opacity="0"` (100%), with `gradientTransform="rotate(-15)"`.

### Wood
Two-value baseFrequency creates directional grain:
```xml
<filter id="wood-grain" color-interpolation-filters="linearRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.02 0.2" numOctaves="5" result="grain"/>
  <feColorMatrix in="grain" type="matrix" result="brown"
    values="0.4 0.3 0.1 0 0.3  0.3 0.2 0.1 0 0.15  0.1 0.1 0.05 0 0.05  0 0 0 1 0"/>
</filter>
```

### Water
- Several semi-transparent blue layers at opacity 0.2-0.5
- Thin concentric elliptical ripple lines (white, opacity 0.3)
- Vertically flipped, desaturated reflections at 30-50% opacity
- `feTurbulence` + `feDisplacementMap` for wavy distortion
- Gradient: dark blue deep -> mid cyan -> light blue surface, 5+ stops

### Stone / rock
- Base grey-brown gradient
- Heavy noise: `baseFrequency="0.35"`, multiply blend, opacity 0.6
- Irregular polygon shapes
- Thin dark crack lines with slight organic curves

### Fabric / cloth
- Alternating light-dark-light gradient bands simulate folds
- Very fine noise: `baseFrequency="0.8"`, soft-light blend
- Curved shadow shapes following the drape

---

## 5. Illustration Composition Templates

### Landscape scene (layered)
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"
  role="img" aria-labelledby="t d">
  <title id="t">Hills at sunset</title>
  <desc id="d">Three ranges of hills under a warm evening sky, two trees in front.</desc>
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1" color-interpolation="linearRGB">
      <!-- warm stops end above the hills (y 280-350 = 56-70%), so the sunset glow shows -->
      <stop offset="0%" stop-color="#1e3a5f"/><stop offset="30%" stop-color="#3b82f6"/>
      <stop offset="48%" stop-color="#93c5fd"/><stop offset="60%" stop-color="#fde68a"/>
      <stop offset="72%" stop-color="#fb923c"/><stop offset="100%" stop-color="#f97316"/>
    </linearGradient>
    <radialGradient id="sun-glow">
      <stop offset="0%" stop-color="#fde68a"/><stop offset="100%" stop-color="#fde68a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="hill-gradient" x1="0" y1="0" x2="0" y2="1" color-interpolation="linearRGB">
      <stop offset="0%" stop-color="#4d7c0f"/><stop offset="100%" stop-color="#1a2e05"/>
    </linearGradient>
    <radialGradient id="vignette-grad" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="0"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.45"/>
    </radialGradient>
    <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="linearRGB">
      <feDropShadow dx="3" dy="5" stdDeviation="4" flood-color="#1e1b4b" flood-opacity="0.3"/>
    </filter>
    <symbol id="tree" viewBox="0 0 60 90">
      <rect x="26" y="55" width="8" height="35" fill="#3f2a14"/>
      <path d="M30 0 L58 62 H2 Z" fill="#166534"/>
    </symbol>
  </defs>
  <!-- L1: sky, multi-stop gradient -->
  <rect width="800" height="500" fill="url(#sky)"/>
  <!-- L2: sun with soft glow -->
  <circle cx="600" cy="120" r="90" fill="url(#sun-glow)" opacity="0.6"/>
  <circle cx="600" cy="120" r="40" fill="#fbbf24"/>
  <!-- L3: far hills (low saturation, light, blue-shifted) -->
  <path d="M0,350 Q200,220 400,310 Q550,260 800,320 L800,500 L0,500Z" fill="#94a3b8" opacity="0.4"/>
  <!-- L4: mid hills (medium saturation) -->
  <path d="M0,380 Q150,290 300,350 Q450,310 600,340 L800,370 L800,500 L0,500Z" fill="#64748b" opacity="0.6"/>
  <!-- L5: atmospheric haze between the mid and near layers -->
  <rect y="280" width="800" height="220" fill="#bfdbfe" opacity="0.12"/>
  <!-- L6: near hills (full saturation, detail) -->
  <path d="M0,420 Q200,360 400,400 Q600,375 800,410 L800,500 L0,500Z" fill="url(#hill-gradient)"/>
  <!-- L7: foreground details with shadows; trees stand on the near hill line -->
  <g filter="url(#drop-shadow)">
    <use href="#tree" x="120" y="300" width="60" height="90"/>
    <use href="#tree" x="350" y="330" width="45" height="70" opacity="0.85"/>
  </g>
  <!-- L8: vignette last -->
  <rect width="800" height="500" fill="url(#vignette-grad)"/>
</svg>
```
Render it and check that the trees' bases sit on the near hill line; move the `y` of each
`<use>` until they do.

### Object study (full five-zone lighting)
Light from the upper left. Every overlay shares the object's centre (200, 210) and radius 85,
the contact shadow sits at the object's base (y 295) and the cast shadow falls away from the
light.
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img" aria-labelledby="os-t">
  <title id="os-t">Orange sphere lit from the upper left</title>
  <defs>
    <linearGradient id="bg-grad" x1="0" y1="0" x2="0" y2="1" color-interpolation="linearRGB">
      <stop offset="0%" stop-color="#f1f5f9"/>
      <stop offset="70%" stop-color="#e2e8f0"/>
      <stop offset="100%" stop-color="#cbd5e1"/>
    </linearGradient>
    <radialGradient id="obj" fx="0.35" fy="0.3" cx="0.45" cy="0.45" r="0.55"
      color-interpolation="linearRGB">
      <stop offset="0%" stop-color="#fff7ed" stop-opacity="0.8"/>  <!-- specular area -->
      <stop offset="15%" stop-color="#fb923c"/>                     <!-- light area -->
      <stop offset="50%" stop-color="#ea580c"/>                     <!-- half-tone -->
      <stop offset="85%" stop-color="#7c2d12"/>                     <!-- form shadow -->
      <stop offset="100%" stop-color="#431407"/>                    <!-- deep shadow -->
    </radialGradient>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"
      color-interpolation-filters="linearRGB"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="soft-lg" x="-40%" y="-40%" width="180%" height="180%"
      color-interpolation-filters="linearRGB"><feGaussianBlur stdDeviation="14"/></filter>
    <filter id="grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="linearRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>
    <clipPath id="obj-clip"><circle cx="200" cy="210" r="85"/></clipPath>
  </defs>
  <!-- Background -->
  <rect width="400" height="400" fill="url(#bg-grad)"/>
  <!-- Cast shadow: soft, offset away from the light (right) -->
  <ellipse cx="235" cy="296" rx="80" ry="12" fill="#1e1b4b" opacity="0.2" filter="url(#soft)"/>
  <!-- Contact shadow: tight, right under the base -->
  <ellipse cx="205" cy="294" rx="45" ry="5" fill="#1e1b4b" opacity="0.4"/>
  <!-- Main object -->
  <circle cx="200" cy="210" r="85" fill="url(#obj)"/>
  <!-- Form shadow overlay (cool-shifted): blurred, then clipped to the object (an element's
       filter runs before its clip), so it has no hard edge inside the sphere -->
  <ellipse cx="240" cy="250" rx="70" ry="75" fill="#3b1764" opacity="0.35"
    style="mix-blend-mode:multiply" filter="url(#soft-lg)" clip-path="url(#obj-clip)"/>
  <!-- Highlight -->
  <ellipse cx="172" cy="178" rx="35" ry="25" fill="#fff7ed" opacity="0.35" filter="url(#soft)"/>
  <!-- Specular dot -->
  <circle cx="165" cy="170" r="7" fill="white" opacity="0.85"/>
  <!-- Reflected (bounced) light on the shadow edge; the clip sits on a group because a clip
       on the rotated ellipse itself would rotate with it -->
  <g clip-path="url(#obj-clip)">
    <ellipse cx="262" cy="262" rx="18" ry="30" fill="#fef3c7" opacity="0.12"
      transform="rotate(-40 262 262)" filter="url(#soft)"/>
  </g>
  <!-- Texture: grain clipped to the object at low opacity -->
  <circle cx="200" cy="210" r="85" fill="#000" filter="url(#grain)" opacity="0.08"/>
</svg>
```

### Stylized character
- Head: circle or oval with a radial gradient (skin tone, focus offset toward the light)
- Body: rounded rect with a fold-simulating linear gradient
- Eyes: small dark circles with white specular dots (2px)
- Hair: overlapping ellipses/paths with gradient fills
- Clothing: shapes with alternating light-dark gradient bands for folds
- Shadow under the feet: a contact shadow ellipse

For every body part: base gradient -> form shadow overlay -> highlight overlay -> specular dot
= a dimensional form. Construction and animation: section 13 in
[effects-and-motion.md](effects-and-motion.md#13-characters-and-figures).
