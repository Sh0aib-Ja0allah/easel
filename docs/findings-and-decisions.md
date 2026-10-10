# Findings and decisions

> Status: draft · Last updated: 2026-10-10 · Based on the 13 sources in [sources.md](sources.md) (round 1: #1–5, round 2: #6–13)

## 1. Key findings

### 1.1 Four sources already do the same core thing

`animate`, `huashu-art-motion` and `mg-styles-15` each built their own version of the same pipeline. HyperFrames, which open-design uses, is a fourth:

> code draws each frame deterministically → headless Chromium captures each frame → ffmpeg encodes → audio is synthesized in code

| | animate | huashu-art-motion | mg-styles-15 | HyperFrames (via open-design) |
| --- | --- | --- | --- | --- |
| Language | Node | Python (uv) + JS | Node + Python | Node |
| Browser driver | Playwright | Playwright | puppeteer-core | Puppeteer |
| Frame contract | STYLE hooks | `--spec` JSON / scene JS | `window.renderAt(t)` | paused GSAP timeline `window.__timelines.main` + `data-*` timing |
| Audio | synth in JS | synth in code | `mgaudio` (Python) | TTS + transcribe commands |
| QA | measured review | lint + film gate + review agent | rubric self-score | lint |
| Maturity | ~400★, 1 week old | ~3.2k★ | ~630★ | **~60k★, Apache-2.0, HeyGen-backed** |

**What this means:**

- We need **one shared render engine** with a single frame contract.
- Styles from every source then become plug-ins to that engine.
- HyperFrames is a serious candidate to *be* that engine instead of writing our own (see **D7**).

### 1.2 Two ways to make media, and many image backends

| Path | Sources | Cost | Output character |
| --- | --- | --- | --- |
| **Procedural** (code draws everything: canvas, SVG, WebGL) | animate, huashu, mg-styles, svg skills, open-design (p5.js, shaders, Three.js) | Free, local | Precise, stylized, deterministic |
| **Generative** (AI models make images and clips) | vox-director (Atlas), designskills (Gemini), peanut (Codex built-in), b1rdmania (Gemini/Replicate/OpenAI), illustrate (Recraft/HF MCP), open-design (fal, Replicate, Venice, Sora, MiniMax) | Paid API | Photographic, organic, less controllable |

Every generative source is tied to a different vendor. That makes D3 (bring-your-own-key providers) more important. It should cover **images, video and audio** through one provider layer, not only video.

### 1.3 Overlaps that need one owner

| Topic | Appears in | Proposed owner |
| --- | --- | --- |
| Story / beat planning + human check-ins | animate, vox, huashu | **One planning stage**: vox's `beats.json` format + animate's 3 check-ins |
| Brand context | designskills (`.agents/design-context.md`), open-design and b1rdmania (`DESIGN.md`), code-katz (brief), vox (theme presets) | **One brand-context file** for the whole marketplace: designskills' auto-detect + open-design's `DESIGN.md` sections |
| Render → look → fix loop | animate, huashu, upbrew (cairosvg), code-katz (Chromium), designskills (Playwright), aseprite (`look`) | **The shared engine** does all rendering; skills call it |
| Critique / review | designskills design-critique, aseprite pixel-critic, huashu review agent + film gate, mg-styles rubric, open-design design-review | **One critic agent** with per-domain rubrics |
| "Anti-generic" rules | open-design `craft/anti-ai-slop`, b1rdmania anti-average method, huashu AI-look colour ban | **One craft rulebook**, opt-in per skill (open-design's injection idea) |
| SVG authoring | linyaosky (UI/integration), upbrew (illustration craft), code-katz (marks) | One SVG skill: linyaosky rules + upbrew craft; logos split out to code-katz's method |
| Logos / icons / brand identity | code-katz, designskills (brand-identity, icon-design), b1rdmania, open-design (brandkit) | code-katz method + designskills icon/brand + b1rdmania ideas |
| Landing / dashboard / deck / poster / social | designskills, open-design templates, VicUgochukwu (LinkedIn) | **designskills** as primary; open-design templates as extra references |
| Collage / editorial explainer look | vox, huashu y2, mg-styles 06 | vox for AI video; one procedural collage style |
| Pixel / 8-bit | animate, huashu, mg-styles, aseprite | aseprite rules + palettes are the source of truth; one procedural pixel style |
| Isometric · Math/3B1B · Bauhaus/cut-paper | animate, huashu, mg-styles | Merge each into one style |
| Music / SFX synthesis | animate, huashu, mg-styles | Evaluate `mgaudio` as the shared audio engine |
| UI motion (GSAP, micro-interactions) | open-design gsap-* / frame-* / emil, designskills motion-design | open-design GSAP skills + designskills motion-design |

### 1.4 Coverage against the vision (after round 2)

| Domain | Coverage | Main sources |
| --- | --- | --- |
| Animation | Strong | animate, huashu, mg-styles, HyperFrames/GSAP, aseprite |
| Video | Strong | procedural engine + vox (generative) |
| Design | **Strong** | designskills, code-katz, open-design, brand ideas |
| Illustration | **Good** | upbrew (SVG characters), peanut method (concept illustration), open-design (p5.js, shaders, Three.js), generative images |
| Drawing | **Good** | SVG skills (vector), aseprite (pixel), hand-drawn diagrams (Excalidraw) |

Small gaps still open:

- **Lottie/Rive export.** Animations for apps and the web, beyond MP4.
- **Painterly raster illustration.** Digital painting outside pixel art and generative images.
- **3D beyond Blender demos.**

These can be v2 items.

### 1.5 Legal and trust items (must-do)

**Don't copy:**

- [ ] Character and brand assets:
  - huashu character assets (`hero/`, `long_scroll/frames/`, `assets/角色/`, `rig_huashu.js`)
  - the Mario/Nintendo showcase and the Clawd fan work
  - vox's Ronaldo/CR7 examples
  - mg-styles media with unstated sources
  - the peanut and Xiaohei characters and their example images
- [ ] Any text from the **unlicensed** repos (b1rdmania, VicUgochukwu). Use their ideas only, rewritten in our own words.
- [ ] Anthropic's `canvas-design` / `frontend-design` via b1rdmania. Take them from **anthropics/skills** directly (Apache-2.0).

**Rename:**

- [ ] Styles named after trademarks or living or protected creators: Vox, Ghibli, Shinkai, Kusama, Kirby, Haring, Dalí, "Mario-style".
- [ ] Design systems that copy real brands (open-design: Stripe, Apple, Linear, …). Ship generic styles only.

**Safety:**

- [ ] Add a **consent gate** before any voice cloning.
- [ ] Remove the docs that explain how to get around model content filters (vox).

**Attribution:**

- [ ] **Apache-2.0 sources** (upbrew svg-creator, open-design, HyperFrames, Anthropic skills):
  - ship the Apache-2.0 license text
  - keep copyright notices
  - mark every modified file
  - add a NOTICE file crediting them
- [ ] **MIT sources:** keep each copyright notice in `THIRD_PARTY_NOTICES.md` and credit the authors in the README. peanut needs **two** notices (Aishwarya Ashok + Ian).
- [ ] **open-design skills:** check each skill's **own** license before taking it. Prefer the original upstream repo.
- [ ] **Remotion:** larger companies need a paid company license, so treat it as optional and say so.
- [ ] **Affiliation:** state that the project is not affiliated with Aseprite / Igara Studio.

### 1.6 Platform

Many sources assume macOS or Linux:

- `/usr/bin/curl`, `/tmp`, `python3`
- the macOS `say` command
- Mac font and Chrome paths
- bash-only scripts
- `cairosvg` (needs Cairo DLLs on Windows)

**Windows support is a requirement.** Write all tooling in Node, with no bash-only scripts. `animate` and `aseprite` show how to do it.

## 2. Decisions

### D1. Package shape: marketplace with several plugins ✅ (2026-10-10)

One repo, one `marketplace.json`, several plugins. **Proposed split (to confirm in the skill catalog):**

| Plugin | Contents | Extra requirements |
| --- | --- | --- |
| `easel-core` | Planning stage, brand context, render engine, audio, critic, craft rules, provider layer | Node, Playwright, ffmpeg |
| `easel-motion` | Procedural animation and video, style catalog, explainer grammars, GSAP/UI motion | core |
| `easel-design` | Graphic, UI, social, posters, decks, design systems, logos/icons/brand | core |
| `easel-illustrate` | SVG illustration and characters, concept illustration with a mascot, generative art (p5.js, shaders) | core |
| `easel-ai-media` | Generative images, video and voice (bring your own key) | API key(s) |
| `easel-pixel` | Aseprite pixel art add-on | Aseprite (paid) |

### D2. Render engine runtime: Node + Playwright ✅ (2026-10-10)

### D3. Generative media: provider interface with bring-your-own key ✅ (2026-10-10)

- [x] **Extend to images and audio, not only video.** ✅ Decided 2026-10-10. Round 2 showed every image source is tied to one vendor (Gemini, Codex, Recraft, fal, …), so one provider layer should cover all generative media.

### D4. Language

- [x] **A. English-first, translate huashu content as we port it.** ✅ Decided 2026-10-10.
- [ ] B. Bilingual English and Chinese from the start (much more work).

### D5. More sources ✅ (2026-10-10)

Round 2 received (#6–13). Design, illustration and drawing are now covered.

### D6. Repo name and license

- [x] Name: **Easel** (repo `easel`, plugins `easel-*`). ✅ Decided 2026-10-11.
- [x] License: **MIT** for our own code. ✅ Decided 2026-10-11 (`LICENSE` added). Apache-2.0 material keeps its license, with LICENSE and NOTICE files included. Both licenses can sit in one repo.

### D7. Render engine: build our own, or build on HyperFrames? ✅ (2026-10-11)

HyperFrames does what we planned to build. It's open source under Apache-2.0, has about 60k stars, and is actively maintained by HeyGen.

- [x] **A. Spike HyperFrames first.** ✅ Decided 2026-10-10. Run a 1–2 day test of three things:
  - Render one `animate` canvas style and one SVG animation as HyperFrames compositions, with canvas drawing driven from the GSAP timeline.
  - Check that it works on Windows.
  - Check that it can be installed as a pinned npm dependency.

  If it passes, depend on it, the same way we depend on aseprite's npm package. If not, build our own engine using its contract as the model.
- [x] **B.** Build our own engine (Node + Playwright) with a `renderAt(t)` contract, borrowing from animate and mg-styles.

  ✅ **Decided by Claude for the owner, 2026-10-11, after spike T0.4: B.** Our own Playwright capture loop, which also reads the HyperFrames composition format (`data-composition-id`, `data-start`/`data-duration`, `window.__timelines.<id>`) besides `window.renderAt(t)`. Reasons: HyperFrames turns on telemetry by default and writes to `~/.hyperframes` (conflicts with D3); its CSS-animation output differed run to run (35.7 dB) while ours was bit-identical; it adds Puppeteer and 112 MB of native dependencies beside D2's Playwright; its API is pre-1.0 and marked experimental. Our loop was also faster on the test laptop. Evidence: [spikes/hyperframes.md](spikes/hyperframes.md).

### D8. Design systems (new)

- [x] **A. Generic styles only.** ✅ Decided 2026-10-10. Brutalism, editorial, glassmorphism, and so on, using open-design's `DESIGN.md` format. Users can create their own brand file.
- [ ] B. Also ship the brand-inspired systems, renamed. This still carries trademark risk.

## 3. Planning docs written (2026-10-11)

The five docs below are now written. Their links: [skill-catalog.md](skill-catalog.md), [architecture.md](architecture.md), [roadmap.md](roadmap.md), [tasks.md](tasks.md), [third-party-notices-draft.md](third-party-notices-draft.md). Each was planned as follows:

1. `skill-catalog.md`: the merged list of skills, grouped by plugin, each with a trigger description and its source mapping.
2. `architecture.md`, covering:
   - repo layout and plugin manifests
   - the engine contract
   - the provider layer
   - shared data formats (`beats.json`, cue sheet, brand context)
   - the craft-rule injection mechanism
   - the setup strategy, with Windows notes
3. `roadmap.md`: build phases and milestones.
4. `tasks.md`: a task list for each phase.
5. `THIRD_PARTY_NOTICES.md` draft: one entry per adapted source.

## 4. Decisions made during the build

### D9. Engine MCP server has no npm dependencies ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** `easel-core/engine/server.mjs` implements the MCP stdio transport (JSON-RPC 2.0, one message per line) itself instead of using `@modelcontextprotocol/sdk`.
- **Reason:** installed plugins are copied into a cache without `node_modules`. A server that imports the SDK cannot start until something installs it, and the `doctor` tool that would install it is served by that same server. The stdio protocol needs about 80 lines. Heavy dependencies (Playwright) are installed by `doctor` into `${CLAUDE_PLUGIN_DATA}` and imported from there.
- **Deviates from:** HANDOFF.md T0.3 step 2, which suggested the SDK.
- **Evidence:** spike T0.3, [spikes/cross-plugin-mcp.md](spikes/cross-plugin-mcp.md).

