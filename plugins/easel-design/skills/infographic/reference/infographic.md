<!-- Easel: adapted from ArnavPuri/designskills @ c7873015add8571ca95043febad0d9e6c97ee5c6
     (github.com/ArnavPuri/designskills, skills/infographic/SKILL.md), MIT License, Copyright (c) 2026 Arnav Puri;
     see NOTICE.md. Modified by Easel (2026-10-11): frontmatter dropped; code is the default, Gemini CLI steps reduced to an optional AI raster path; brand file, render and QA tools swapped in. -->

# Infographic Design

Create compelling data visualizations and infographics. Transform numbers, processes, and comparisons into visually engaging graphics.

**Choosing the path:** code (HTML/CSS/SVG) is the default. AI-generated chart geometry and numbers are illustrative, not accurate -- bar heights won't match data and digits get garbled. Build in code whenever the graphic plots real data or has more than ~8 short text labels. An AI raster only suits illustrated, low-text pieces (icons, scenes, a few big stats), or illustrations with the data laid out in code around them.

---

## Step 1: Load Design Context

1. Read `.easel/brand.md` first -- brand colors (hex), fonts, style archetype
2. If there is no brand file, run `easel-core:brand` or ask for the brand colours and faces; say when defaults were used
3. Infographics rely heavily on a consistent color system for data categories

---

## AI raster path (optional)

Only when the user wants a photographic or painted raster and easel-ai-media is installed: use `easel-ai-media:image` (the user's own key; it shows the cost before spending). Everything else is built in HTML/SVG.

1. Tall formats make text tiny -- generate at a high resolution
2. Quote every number and label exactly; keep to ~8 short labels. Split long infographics into sections generated separately and stacked in code
3. View the output PNG and check every number, label, and unit against the source data. Any mismatch is a defect: fix it in a follow-up turn or move that text to a code overlay

### Example Prompts

- **Statistics Infographic:** "Create an infographic showing [topic] statistics. [number] key metrics displayed as large numbers with icons. [color palette] color scheme. Clean grid layout with section headers. Professional, data-driven design."
- **Process Flow:** "Create a process flow infographic for [process name]. [number] steps connected by arrows. Each step has an icon, title, and one-line description. [color] gradient progression from start to finish. Vertical layout, modern style."
- **Timeline:** "Create a timeline infographic for [subject]. [number] milestones from [start year] to [end year]. Alternating left-right layout along a vertical line. [color palette]. Key dates and brief descriptions at each point."

---

## Step 2: Identify Infographic Type

| Type | Best For | Layout |
|------|----------|--------|
| **Process Flow** | Step-by-step procedures | Horizontal or vertical chain |
| **Comparison** | Two or more options | Columns or split layout |
| **Statistics** | Key numbers and metrics | Grid of stat cards |
| **Timeline** | Chronological events | Vertical or horizontal line |
| **List / Ranking** | Top N items | Numbered vertical list |
| **Data Chart** | Quantitative data | Bar, pie, line via SVG |
| **Icon Grid** | Category overview | Grid of icon + label pairs |

---

## Step 3: Color Coding System

Assign colors systematically. Never use random colors for data categories.

### Palette Types

```css
/* Sequential (ordered data) */
:root { --data-1: #EFF6FF; --data-2: #BFDBFE; --data-3: #60A5FA; --data-4: #2563EB; --data-5: #1E40AF; }

/* Categorical (distinct categories) */
:root { --cat-a: #6366F1; --cat-b: #EC4899; --cat-c: #F59E0B; --cat-d: #10B981; --cat-e: #8B5CF6; --cat-f: #EF4444; }

/* Diverging (positive/negative) */
:root { --neg-strong: #EF4444; --neg-light: #FCA5A5; --neutral: #E5E7EB; --pos-light: #86EFAC; --pos-strong: #22C55E; }
```

### Color Rules
- Use brand primary for the most important data point
- Use neutrals (gray scale) for context/baseline data
- Chart marks (bars, lines, slices) need 3:1 contrast against the background and adjacent marks (WCAG 1.4.11). Light palette steps (e.g. `--data-1`, `--cat-c` amber) fail on white -- add a darker outline or use them only on dark backgrounds
- Text needs 4.5:1 (3:1 if >=24px or >=18.66px bold)
- Never rely on color alone: label series directly or add patterns/icons (WCAG 1.4.1)
- Maximum 6 distinct colors in a single chart

---

## Step 4: Process Flow Diagrams

### Horizontal Process Flow

```css
.process-flow { display: flex; align-items: flex-start; gap: 0; padding: 40px; }
.step { flex: 1; text-align: center; position: relative; padding: 0 20px; }
.step-icon {
  width: 48px; height: 48px; border-radius: 50%; background: var(--primary);
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 700; margin: 0 auto 16px; position: relative; z-index: 2;
}
.step-connector {
  position: absolute; top: 24px; left: calc(50% + 24px); right: calc(-50% + 24px);
  height: 2px; background: var(--primary); opacity: 0.3; z-index: 1;
}
.step:last-child .step-connector { display: none; }
```

### Vertical Process Flow
Use `flex-direction: column` with a `::before` pseudo-element as the connecting line (absolute positioned left of items).

---

## Step 5: Comparison Charts

### Side-by-Side Feature Comparison

```css
.comparison-table { width: 100%; border-collapse: separate; border-spacing: 0; }
.comparison-table thead th { padding: 20px; font-size: 18px; font-weight: 700; text-align: center; border-bottom: 2px solid #E5E7EB; }
.comparison-table thead th.highlighted { background: var(--primary); color: #fff; border-radius: 12px 12px 0 0; }
.comparison-table td { padding: 14px 20px; text-align: center; border-bottom: 1px solid #F3F4F6; font-size: 14px; }
.check { color: #15803D; } .cross { color: #6B7280; } /* >=3:1 on white; pair with ✓/✗ glyphs, not color alone */
```

### Versus Comparison
Use a three-column grid: `grid-template-columns: 1fr auto 1fr` with a large "VS" element centered between two option cards.

---

## Step 6: Statistics and Number Highlights

### Big Number Card

```css
.stat-card { text-align: center; padding: 32px; border-radius: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); }
.stat-number {
  font-size: 56px; font-weight: 800;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  line-height: 1; margin-bottom: 8px;
}
.stat-label { font-size: 14px; font-weight: 500; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em; }
```

### Progress Indicators

```css
/* Percentage bar */
.percent-bar { height: 8px; background: #E5E7EB; border-radius: 4px; overflow: hidden; }
.percent-bar .fill { height: 100%; background: linear-gradient(90deg, var(--primary), var(--accent)); border-radius: 4px; animation: fillBar 1.5s ease-out; }
@keyframes fillBar { from { width: 0; } }

/* Circular progress - conic-gradient; set a unitless --progress, e.g. style="--progress: 72" */
.circle-progress {
  width: 120px; height: 120px; border-radius: 50%;
  background: conic-gradient(var(--primary) 0deg, var(--primary) calc(var(--progress) * 3.6deg), #E5E7EB calc(var(--progress) * 3.6deg));
  display: flex; align-items: center; justify-content: center;
}
```

---

## Step 7: Timeline Infographics

### Vertical Timeline

```css
.timeline { position: relative; padding: 20px 0; max-width: 600px; margin: 0 auto; }
.timeline::before {
  content: ''; position: absolute; left: 50%; top: 0; bottom: 0; width: 2px;
  background: linear-gradient(180deg, transparent, var(--primary), var(--primary), transparent);
  transform: translateX(-50%);
}
.timeline-item { display: flex; align-items: flex-start; margin-bottom: 40px; position: relative; }
.timeline-item:nth-child(odd) { padding-right: calc(50% + 30px); text-align: right; }
.timeline-item:nth-child(even) { flex-direction: row-reverse; padding-left: calc(50% + 30px); text-align: left; }
.timeline-dot {
  position: absolute; left: 50%; transform: translateX(-50%);
  width: 16px; height: 16px; border-radius: 50%; background: var(--primary);
  border: 3px solid var(--bg-color); z-index: 2;
}
.timeline-content { padding: 16px 20px; background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
```

### Horizontal Timeline
Use `display: flex` with a `::before` horizontal line. Each item has a dot and content below.

---

## Step 8: SVG-Based Charts

### Bar Chart
Use `<rect>` elements positioned on a y-axis baseline. Add `<animate>` for entrance animation on height/y attributes. Include `<text>` for axis labels and `<line>` for gridlines.

### Donut Chart
Use `<circle>` elements with `stroke-dasharray` and `stroke-dashoffset` to create segments. Transform with `rotate(-90)` to start from top. Add center `<text>` for the key metric.

### Line Chart
Use `<polyline>` for the data line, `<path>` with `fill` for the area beneath, and `<circle>` elements for data points. Add a `<linearGradient>` for the area fill.

Key pattern for all SVG charts:
```html
<svg viewBox="0 0 400 250" width="400" height="250" xmlns="http://www.w3.org/2000/svg">
  <!-- Grid lines, axes, labels -->
  <!-- Data elements with optional <animate> -->
  <!-- Gradient definitions in <defs> -->
</svg>
```

---

## Step 9: Icon-Driven Data Points

### Icon + Stat Layout

```css
.icon-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 32px; padding: 40px; }
.icon-stat { display: flex; align-items: flex-start; gap: 16px; }
.icon-stat .icon-circle {
  width: 48px; height: 48px; border-radius: 12px;
  background: rgba(var(--primary-rgb), 0.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.icon-stat .value { font-size: 28px; font-weight: 800; line-height: 1; margin-bottom: 4px; }
.icon-stat .label { font-size: 13px; color: #6B7280; }
```

---

## Step 10: Infographic Layout Templates

### Formats
2:3 or 9:16 for vertical (Pinterest-style), 1:4 for long-form scroll, 4:5 or 1:1 for feeds, 16:9 for slides.

### Long-Form Vertical
Width: 800px (web) or 1000px (print). Structure: Header > Section 1 > Divider > Section 2 > Divider > Section 3 > Takeaway > Footer. Use 60px spacing between sections.

### Dashboard-Style Grid

```css
.info-dashboard { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 40px; }
.info-dashboard .header { grid-column: 1 / -1; }
.info-dashboard .chart-main { grid-column: 1 / 3; }
.info-dashboard .chart-side { grid-column: 3; }
.info-dashboard .footer { grid-column: 1 / -1; }
```

---

## Render and Check

1. Render with `mcp__plugin_easel-core_easel__render_still` (`file`, `width`, `height`, `scale: 2`); use `sizes: [{width, height, name}]` for several formats from one page. For print, use `mcp__plugin_easel-core_easel__render_pdf` (`format: "A4"` or `"Letter"`, or `width`/`height` with units).
2. A still render captures one moment: make the final state of any entrance animation (bar fills, `<animate>`) the default, or drop the animation for stills.
3. Run `mcp__plugin_easel-core_easel__qa` with `checks: ["contrast", "text_clipping"]`, then view the PNG.

---

## Quality Checklist

- Data is accurately represented (numbers match visuals; bar/slice sizes computed from data, not eyeballed)
- Output PNG (rendered code or the AI raster) was viewed and every number, label, and unit checked against the source
- Color coding is consistent and meaningful (max 6 colors)
- Clear labels on all data points
- Visual hierarchy guides the reader through the information
- Source attribution included where appropriate
- Brand colors from `.easel/brand.md` applied
- SVG charts have a proper viewBox and scale (CSS `width: 100%; height: auto` when responsive)
- Text and chart marks meet contrast rules; color is not the only encoding
- Animations are subtle and enhance understanding
- Sufficient whitespace between sections
