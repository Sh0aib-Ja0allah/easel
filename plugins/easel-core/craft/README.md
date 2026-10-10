# Craft rulebooks

Short, checkable rules that every Easel skill can pull in. Skills fetch them through the engine
(`mcp__plugin_easel-core_easel__craft` with a `name`), so they work from any plugin.

| Name | Covers |
|---|---|
| [anti-generic](anti-generic.md) | Tells of average machine output and how to get away from them |
| [typography](typography.md) | Faces, scale, measure, reading time, video text sizes |
| [colour](colour.md) | Palette layers, contrast gates, dark themes, accent discipline |
| [accessibility](accessibility.md) | WCAG 2.2 AA baseline for design, UI and motion |
| [motion](motion.md) | UI timing and easing; rules for video and explainers |

Each file starts with frontmatter (`name`, `applies_to`) and a header naming the sources whose
ideas it draws on. The text is Easel's own (MIT).
