# Sources

Every GitHub repository this plugin draws from. One row per repo, with a detailed note per repo in [sources/](sources/).

**Why the license column matters:** we can only copy or adapt content whose license allows it, and the license of this repo must be compatible with all of them. Repos with no license are "all rights reserved" by default and can be used for ideas only, not copied.

## Legend

- **Use:** `copy` (take as-is with credit) · `adapt` (rewrite/merge) · `depend` (reference the published package, don't vendor) · `reference` (ideas only) · `skip`
- **Domain:** animation · illustration · drawing · video · design · other

## Repositories

Reviewed 2026-10-10.

| # | Repo | License | Domain | What it provides | Use | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | [cth9191/animate](https://github.com/cth9191/animate) · [notes](sources/cth9191-animate.md) | MIT | animation, video | Claude Code plugin, 1 skill. Procedural canvas video: intake → story/look/storyboard check-ins → render → QA. 7 styles + match-a-reference. | adapt | Best base for the procedural core. Node + Playwright + ffmpeg. |
| 2 | [Alisa0808/vox-director](https://github.com/Alisa0808/vox-director) · [notes](sources/alisa0808-vox-director.md) | MIT* | video | Standalone skill. Topic → AI-generated collage explainer video (images, video, TTS, music via Atlas Cloud) → ffmpeg. 14 story arcs, 9 theme presets. | adapt | Paid API ($1–2 per film). macOS-only code paths. *Drop the celebrity examples; "Vox" is a trademark. |
| 3 | [alchaincyf/huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion) · [notes](sources/alchaincyf-huashu-art-motion.md) | MIT* | animation, illustration, video | Standalone skill (Chinese). 35 art styles painted in code, 9 explainer grammars, 17 JS libs, strong quality gates. | adapt | Heavy translation (~520 KB docs + code). *Character, Mario and Clawd assets are excluded from MIT; rename the styles tied to living artists. |
| 4 | [Vincentwei1021/mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15) · [notes](sources/vincentwei1021-mg-styles-15.md) | MIT* | animation, design, video | Showcase, not a plugin. 15 motion-design prompts + full source, frame renderer, audio synth engine, rubric. | adapt (selectively) | Unique: Blender 3D, WebGL shaders, HUD, vertical captions, audio engine. *Some textures, photos and SFX have unstated sources. |
| 5 | [with-pebbly/aseprite-ai-artist](https://github.com/with-pebbly/aseprite-ai-artist) · [notes](sources/with-pebbly-aseprite-ai-artist.md) | MIT | drawing (pixel art), animation | Claude Code plugin: 14 skills, 4 agents, 2 hooks, MCP server on npm (18 tools) driving a live Aseprite window. | depend | Needs paid Aseprite + a Lua extension. Ship it as an optional add-on. |
| 6 | [ArnavPuri/designskills](https://github.com/ArnavPuri/designskills) · [notes](sources/arnavpuri-designskills.md) | MIT | design | Claude Code marketplace, 28 skills: graphic (poster, social, ads, thumbnails…), UI (landing, dashboard, mobile…), design systems (palette, type, icons, brand), critique. Gemini image script, shared brand-context file, 3-layer eval harness. | adapt | Backbone for the design plugin. Locked to one Gemini preview model; move it behind our provider layer. |
| 7 | [upbrew-tech/svg-creator-skill](https://github.com/upbrew-tech/svg-creator-skill) · [notes](sources/upbrew-tech-svg-creator-skill.md) | Apache-2.0 | illustration, drawing | Bare skill. SVG illustrations and characters with a render-verify-fix loop; the best lighting, material and character-construction craft. | adapt | Its cairosvg renderer can't show filters or animation; replace it with our Playwright loop. Apache: keep the license and mark changed files. |
| 8 | [linyaosky/svg-skill](https://github.com/linyaosky/svg-skill) · [notes](sources/linyaosky-svg-skill.md) | MIT | drawing, design | Bare skill. Production SVG rules: 17-scenario index, React/Vue/email/sprite/mask output, accessibility. | adapt | Base for the SVG authoring rules. No visual check; one wrong example. |
| 9 | [code-katz/claude-illustrate-skill](https://github.com/code-katz/claude-illustrate-skill) · [notes](sources/code-katz-claude-illustrate-skill.md) | MIT | design (logos, icons) | Bare skill. Logos, icons, wordmarks: brief → 3–5 distinct concepts → 16–512 px contact sheet → provenance. Notes on Recraft, Hugging Face, Canva and Figma backends. | adapt | Core of logo/icon design. Unix-only scripts. |
| 10 | [b1rdmania/claude-brand-skills](https://github.com/b1rdmania/claude-brand-skills) · [notes](sources/b1rdmania-claude-brand-skills.md) | **None** | design (brand) | 8-phase brand process, anti-"average" layout method, brand kit. Contains copies of Anthropic's canvas-design and frontend-design. | reference | **No license: ideas only, no text.** Take Anthropic's skills from anthropics/skills instead. |
| 11 | [VicUgochukwu/brand-design-skill](https://github.com/VicUgochukwu/brand-design-skill) · [notes](sources/vicugochukwu-brand-design-skill.md) | **None** | design (social) | One slash command: on-brand LinkedIn carousels, banners, article images as HTML → PNG/PDF. | reference | **No license: ideas only.** Useful LinkedIn specs and mobile-readability rules. |
| 12 | [aishwaryaashok14/peanut-illustrations](https://github.com/aishwaryaashok14/peanut-illustrations) · [notes](sources/aishwaryaashok14-peanut-illustrations.md) | MIT (×2 notices) | illustration | One skill: an idea → one hand-drawn concept illustration with a mascot. Strong metaphor method. Needs a built-in image tool (Codex). | adapt (method) | Generalize to a user-supplied mascot; don't ship the peanut. Keep both copyright notices (adapted from helloianneo/ian-xiaohei-illustrations). |
| 13 | [nexu-io/open-design](https://github.com/nexu-io/open-design) (linked as Vidyard fork) · [notes](sources/nexu-io-open-design.md) | Apache-2.0 + per-skill | design, video, illustration, slides | App + 163 skills + 153 design systems + 13 craft rulebooks. HyperFrames video, GSAP, p5.js, shaders, Three.js. | adapt (selectively) | The Vidyard fork is outdated; use upstream. Check each skill's license. ~70 design systems copy real brands. |

## Review checklist (per repo)

- [ ] License identified and recorded
- [ ] Plugin structure noted (`.claude-plugin/plugin.json`, `skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`)
- [ ] External dependencies noted (CLIs, APIs, API keys, MCP servers)
- [ ] Overlap with other sources noted
- [ ] Quality / maintenance status noted (last commit, stars, open issues)
- [ ] Decision recorded in the **Use** column
