<!-- Easel: adapted from linyaosky/svg-skill @ 2103b92cb47f588a97a6c38aa6c40571fadbd4f8
     (github.com/linyaosky/svg-skill, examples.md), MIT License, Copyright (c) 2026 svg-skill contributors;
     see NOTICE.md. Modified by Easel (2026-10-11): bar chart rewritten (bars on the baseline, heights to scale); clip + shadow order fixed so the shadow shows; flowchart arrows end at the box edge and labels use accented text; bundled Inter for text; reduced-motion rules on the animated examples; checked with svg-check.mjs and rendered with the Easel engine. -->

# SVG examples

Indexed from [../SKILL.md](../SKILL.md). Every example passes `svg-check.mjs`; render your own
version with `render_still` and look at it before delivering.

## 1. Outline icon: search

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
     stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <circle cx="11" cy="11" r="7"/>
  <path d="M20 20l-3-3"/>
</svg>
```

## 2. Multi-colour icon

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
  <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#6366f1"/>
  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round"/>
</svg>
```

## 3. Favicon

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="B">
  <rect width="32" height="32" rx="6" fill="#2563eb"/>
  <path d="M10 22V10h3.5c2 0 3.2 1 3.2 2.6 0 1-.5 1.7-1.4 2.1 1.1.4 1.8 1.2 1.8 2.5 0 1.8-1.3 3-3.8 3H10zm2.6-7.8h.9c.9 0 1.3-.4 1.3-1s-.4-1-1.3-1h-.9v2zm0 5.6h1c1.1 0 1.6-.4 1.6-1.2 0-.8-.5-1.2-1.6-1.2h-1v2.4z" fill="#fff"/>
</svg>
```

## 4. Bar chart

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img"
     aria-labelledby="chart-title chart-desc">
  <title id="chart-title">Quarterly sales: Q1 40, Q2 65, Q3 50, Q4 80</title>
  <desc id="chart-desc">Bar chart. Sales rise from 40 in Q1 to 65 in Q2, dip to 50 in Q3 and peak at 80 in Q4.</desc>
  <!-- Plot area x 50..370 (320 wide), y 40..240 (200 high); baseline y = 240.
       Max 80 -> scale 200 / 80 = 2.5 px per unit. Step 320 / 4 = 80; bar width 48 (0.6 x step).
       Centres 90, 170, 250, 330 -> bar x = centre - 24.
       Q1 40 -> h 100,   y 140   | Q2 65 -> h 162.5, y 77.5
       Q3 50 -> h 125,   y 115   | Q4 80 -> h 200,   y 40      (y + h = 240 for every bar)
       Value labels 8 above each bar; category labels at y 260. -->
  <g fill="#4f46e5">
    <rect x="66"  y="140"  width="48" height="100"/>
    <rect x="146" y="77.5" width="48" height="162.5"/>
    <rect x="226" y="115"  width="48" height="125"/>
    <rect x="306" y="40"   width="48" height="200"/>
  </g>
  <line x1="50" y1="240" x2="370" y2="240" stroke="#64748b" stroke-width="1"/>
  <g font-family="Inter, sans-serif" font-size="12" text-anchor="middle">
    <g fill="#1e293b" font-weight="600">
      <text x="90"  y="132">40</text>
      <text x="170" y="69.5">65</text>
      <text x="250" y="107">50</text>
      <text x="330" y="32">80</text>
    </g>
    <g fill="#475569">
      <text x="90"  y="260">Q1</text>
      <text x="170" y="260">Q2</text>
      <text x="250" y="260">Q3</text>
      <text x="330" y="260">Q4</text>
    </g>
  </g>
</svg>
```

Easel fixed the upstream example: its bars floated above the baseline (they ended at y 200,
the axis is at y 240) and their heights were not proportional to the data. Labels here are
#475569 (7.6:1 on white) and #1e293b (14.6:1); the axis is #64748b (4.8:1).

## 5. Progress ring (75%)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
  <!-- r 9 -> C = 2 x pi x 9 = 56.55; 75% -> offset 56.55 x 0.25 = 14.14.
       The track is currentColor at low opacity, so it shows on light and dark pages. -->
  <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-opacity="0.18" stroke-width="3"/>
  <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="3"
          stroke-dasharray="56.55" stroke-dashoffset="14.14" stroke-linecap="round"
          transform="rotate(-90 12 12)"/>
</svg>
```

With a round cap the arc reads a little past 75%; use `stroke-linecap="butt"` when the value
must read exactly.

## 6. Avatar fallback

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" aria-hidden="true">
  <circle cx="20" cy="20" r="20" fill="currentColor" opacity="0.15"/>
  <circle cx="20" cy="16" r="6" fill="currentColor"/>
  <path d="M8 34c0-6.6 5.4-10 12-10s12 3.4 12 10" fill="currentColor"/>
</svg>
```

## 7. Wave divider

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
  <path d="M0,64 C200,120 400,0 600,64 C800,128 1000,0 1200,64 L1200,120 L0,120 Z" fill="currentColor"/>
</svg>
```

## 8. Map pin

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor"/>
  <circle cx="12" cy="9" r="2.5" fill="#fff"/>
</svg>
```

## 9. Sprite sheet

```svg
<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">
  <symbol id="i-home" viewBox="0 0 24 24">
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z" fill="currentColor"/>
  </symbol>
  <symbol id="i-mail" viewBox="0 0 24 24">
    <path d="M4 6h16v12H4V6zm0 2 8 5 8-5" fill="none" stroke="currentColor" stroke-width="2"/>
  </symbol>
</svg>
<!-- Usage: <svg width="24" height="24"><use href="#i-home"/></svg> -->
```

## 10. Flowchart with accented labels (UTF-8)

```svg
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 120" role="img" aria-labelledby="flow-title">
  <title id="flow-title">Request processing flow: Entrée, Traitement, Sortie</title>
  <defs>
    <!-- userSpaceOnUse + refX at the tip: the arrow point lands exactly on the line end -->
    <marker id="arrow" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8"
            refX="8" refY="4" orient="auto">
      <path d="M0,0 L8,4 L0,8 Z" fill="#64748b"/>
    </marker>
  </defs>
  <g font-family="Inter, sans-serif" font-size="12" text-anchor="middle">
    <rect x="10" y="40" width="80" height="40" rx="6" fill="#e0f2fe" stroke="#0284c7"/>
    <text x="50" y="64" fill="#0c4a6e">Entrée</text>
    <line x1="90.5" y1="60" x2="129.5" y2="60" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>
    <rect x="130" y="40" width="80" height="40" rx="6" fill="#fef3c7" stroke="#d97706"/>
    <text x="170" y="64" fill="#78350f">Traitement</text>
    <line x1="210.5" y1="60" x2="249.5" y2="60" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>
    <rect x="250" y="40" width="60" height="40" rx="6" fill="#dcfce7" stroke="#16a34a"/>
    <text x="280" y="64" fill="#14532d">Sortie</text>
  </g>
</svg>
```

## 11. Clip + drop shadow

The filter goes on an outer group and the clip on an inner one: an element's filter runs
before its own clip, so both on one group would clip the shadow away.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" aria-hidden="true">
  <defs>
    <clipPath id="round"><circle cx="40" cy="38" r="30"/></clipPath>
    <filter id="shadow" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#1e1b4b" flood-opacity="0.3"/>
    </filter>
  </defs>
  <g filter="url(#shadow)">
    <g clip-path="url(#round)">
      <rect width="80" height="80" fill="#6366f1"/>
      <circle cx="40" cy="32" r="12" fill="#c7d2fe"/>
      <rect x="22" y="50" width="36" height="30" rx="18" fill="#c7d2fe"/>
    </g>
  </g>
</svg>
```

## 12. Pattern fill

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true">
  <defs>
    <pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.5" fill="#94a3b8"/>
    </pattern>
  </defs>
  <rect width="100" height="100" fill="url(#dots)"/>
</svg>
```

## 13. Hover interaction

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
  <style>
    .heart { fill: #94a3b8; transition: fill .2s, transform .2s;
             transform-box: fill-box; transform-origin: center; }
    svg:hover .heart { fill: #ef4444; transform: scale(1.1); }
    @media (prefers-reduced-motion: reduce) { .heart { transition: none; } }
  </style>
  <path class="heart" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
</svg>
```

## 14. CSS mask usage

```css
.icon-pin {
  width: 24px;
  height: 24px;
  background: var(--accent, #2563eb);
  -webkit-mask: url('/assets/pin.svg') center / contain no-repeat;
  mask: url('/assets/pin.svg') center / contain no-repeat;
}
```

## 15. React component

```tsx
type IconProps = React.SVGProps<SVGSVGElement>;

export function ChevronRightIcon({ className, ...props }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
         className={className} aria-hidden {...props}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
```

## 16. Loading spinner

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
  <style>
    .spinner { transform-origin: 12px 12px; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .spinner { animation-duration: 2.4s; } }
  </style>
  <g class="spinner">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"
            stroke-dasharray="40 20" stroke-linecap="round"/>
  </g>
</svg>
```

A loader still has to show activity under reduced motion, so it slows down instead of
stopping. Check it with `filmstrip` (`file`, `count: 6`) and with `render_still`
`reducedMotion: "reduce"`.
