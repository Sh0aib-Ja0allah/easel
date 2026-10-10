# Critique rubrics

Used by `easel-core:critique` and the read-only `critic` agent. Fetch one through the engine:
`mcp__plugin_easel-core_easel__craft` with `kind: "rubric"` and `name`.

Every rubric shares the scale and rules below, then adds its own dimensions.

## Shared scale (1-10 per dimension)

| Score | Meaning |
|---|---|
| 3-4 | Broken or confusing; would embarrass the user |
| 5 | Competent student work; the idea is there, the craft is not |
| 6 | Template level; correct but forgettable |
| 7 | Solid professional work; would ship |
| 8 | High-end studio work |
| 9-10 | Award level; rare, needs a specific reason |

Most first renders score 5 to 7. Do not round up.

## Shared rules

1. **Cold read first.** Before reading the brief, write one sentence on what the work shows to
   a stranger and the first three things the eye lands on. If the cold read misses the subject,
   that is a **blocking read failure**.
2. **Evidence or it did not happen.** Each finding cites a region of a render (frame time,
   sheet cell, coordinates), a measured value (`qa` output, a contrast ratio, a size) or a rule
   from a craft rulebook.
3. **Severity:** `blocking` (cannot deliver), `high`, `medium`, `low`.
4. **Caps:** any open hard gate from `qa` or any blocking finding caps the overall score at 4.
   A high finding caps it at 6.
5. **Fixes:** at most 8, ordered by impact on the final impression, each with a concrete how
   (numbers: px, ms, colours, easing, font). At least one fix must make the work more distinctive,
   not only more correct.
6. **The critic never fixes.** It reports; the skill that made the work applies fixes, re-renders,
   and asks for a re-check (blind A/B when comparing versions).
