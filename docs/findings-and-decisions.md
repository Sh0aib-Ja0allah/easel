# Findings and decisions

> Status: living record · Last updated: 2026-10-11 (after the v1.0.0 QA review, §5) · Based on the 13 sources in [sources.md](sources.md) (round 1: #1–5, round 2: #6–13)

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

Legal pass for v1.0.0 (T5.2, 2026-10-11): every item ticked with the commit that did it and how it
is checked. "Sweep" = a search of the whole repository on 2026-10-11.

**Don't copy:**

- [x] Character and brand assets:
  - huashu character assets (`hero/`, `long_scroll/frames/`, `assets/角色/`, `rig_huashu.js`): not present (sweep; only the grammars and recipes were translated, 1411085). `plugins/easel-motion/test/build.test.mjs` scans the shipped motion sources (`kit/`, `styles/`, `templates/`, `grammars/`, `recipes/`) and fails on huashu names, on the never-ship asset paths (`rig_huashu`, `_shared/hero`, `long_scroll`, `角色`) and on `clawd`, `mario` and `nintendo` (guard extended after v1.0.0 QA; at v1.0.0 it scanned only `grammars/` and `recipes/` for creator names).
  - the Mario/Nintendo showcase and the Clawd fan work: not present (sweep). The motion guard above rejects all three names (guard extended after v1.0.0 QA); the pixel tests reject Mario and Nintendo and the illustrate tests Mario. Before that guard, no test mentioned Clawd.
  - vox's Ronaldo/CR7 examples: not present (sweep; 10e6085); `plugins/easel-ai-media/test/static.test.mjs` rejects the names and any line about getting around content filters that is not a refusal.
  - mg-styles media with unstated sources: none copied; the four mg-styles looks are Easel's own code (D17, 2a6c11e). Every image in `plugins/` is Easel-rendered (style samples, goldens, the style-match example, test fixtures).
  - the peanut and Xiaohei characters and their example images: not present; Easel's mascot is its own "card" (10e6085, 3cf1603); `plugins/easel-illustrate/test/static.test.mjs` rejects the names.
- [x] Any text from the **unlicensed** repos (b1rdmania, VicUgochukwu). Checked with an 8-word overlap test against both repos (b1rdmania/claude-brand-skills @ `b356640b`, VicUgochukwu/brand-design-skill @ `179eb1ce`, fetched as data): the only prose shared is Anthropic's Apache-2.0 canvas-design and algorithmic-art text, which b1rdmania also copies and Easel takes from anthropics/skills directly; after removing that and MIT/HTML boilerplate, 88 shared 8-word runs remain in 40 files, all code boilerplate or formulas (doctype lines, CSS declarations, the WCAG luminance constants). No prose.
- [x] Anthropic's `canvas-design` / `frontend-design` via b1rdmania. Taken from **anthropics/skills** @ `dbd4588` directly (4e686ac, 10e6085; headers in each file); `frontend-design` is not used.

**Rename:**

- [x] Styles named after trademarks or living or protected creators: Vox -> editorial collage, and the rest (1411085, 2a6c11e, 10e6085). Banned-name tests in the core craft rules, the motion sources (grammars and recipes at v1.0.0; kit, styles and templates added after the v1.0.0 QA), illustrate, ai-media and pixel suites.
- [x] Design systems that copy real brands. Ten generic systems only (4e686ac, D8); `plugins/easel-design/test/static.test.mjs` checks for brand names.

**Safety:**

- [x] Add a **consent gate** before any voice cloning (10e6085, hardened in 3cf1603 after QA F-1). Tested refusals: no statement, negated or placeholder statements, wrong names and dates, no real recording, files outside the job folder.
- [x] Remove the docs that explain how to get around model content filters (vox). Removed (10e6085); the ai-media test above.

**Attribution:**

- [x] **Apache-2.0 sources** (upbrew svg-creator, open-design, HyperFrames, Anthropic skills): the licence text ships at the root and in every plugin with Apache material; copyright and NOTICE lines are in THIRD_PARTY_NOTICES.md and the plugins' NOTICE.md; every changed file says "Modified by Easel"; HyperFrames is ideas only (no code). Checked by `plugins/easel-core/engine/test/notices.test.mjs`.
- [x] **MIT sources:** each copyright notice is in `THIRD_PARTY_NOTICES.md` with its upstream commit, and the authors are credited in the root README and each plugin's README; peanut has **two** notices (Aishwarya Ashok + Ian). The notices test checks the commit of every adapted file against both notice files.
- [x] **open-design skills:** only open-design's own Apache-2.0 craft rulebooks were taken (01562ee); `shader-dev`, `hand-drawn-diagrams` and `threejs` were traced to their origins and deferred (D21).
- [x] **Remotion:** not used at all (D7 = B, Easel's own render loop), so no company licence applies.
- [x] **Affiliation:** not affiliated with Aseprite / Igara Studio: easel-pixel's plugin.json, README, NOTICE and pixel skill, the root README and THIRD_PARTY_NOTICES.md (3cf1603; checked by the pixel tests).

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

### D7. Render engine: build our own, or build on HyperFrames? ✅ B, decided by Claude for the owner (2026-10-11); owner's confirmation pending

HyperFrames does what we planned to build. It's open source under Apache-2.0, has about 60k stars, and is actively maintained by HeyGen.

- [x] **A. Spike HyperFrames first.** ✅ Decided 2026-10-10. Run a 1–2 day test of three things:
  - Render one `animate` canvas style and one SVG animation as HyperFrames compositions, with canvas drawing driven from the GSAP timeline.
  - Check that it works on Windows.
  - Check that it can be installed as a pinned npm dependency.

  If it passes, depend on it, the same way we depend on aseprite's npm package. If not, build our own engine using its contract as the model.
- [x] **B.** Build our own engine (Node + Playwright) with a `renderAt(t)` contract, borrowing from animate and mg-styles.

  ✅ **Decided by Claude for the owner, 2026-10-11, after spike T0.4: B.** Our own Playwright capture loop, which also reads the HyperFrames composition format (`data-composition-id`, `data-start`/`data-duration`, `window.__timelines.<id>`) besides `window.renderAt(t)`. Reasons: HyperFrames turns on telemetry by default and writes to `~/.hyperframes` (conflicts with D3); its CSS-animation output differed run to run (35.7 dB) while ours was bit-identical; it adds Puppeteer and 112 MB of native dependencies beside D2's Playwright; its API is pre-1.0 and marked experimental. Our loop was also faster on the test laptop. Evidence: [spikes/hyperframes.md](spikes/hyperframes.md).

  **Deviates from** the rule recorded with option A above ("if it passes on Windows, depend on it"): HyperFrames did render on Windows, but failed the determinism and no-tracking requirements. The owner was asked to confirm on 2026-10-11; B is the default until they answer.

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

### D10. Never bundle GSAP ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** Easel does not commit or redistribute GSAP. The engine's `doctor` installs `gsap` (pinned) from npm into `${CLAUDE_PLUGIN_DATA}` on the user's machine, and the render engine serves that local copy to compositions (no CDN at render time). The engine itself does not depend on GSAP; `renderAt(t)` compositions need no library.
- **Reason:** GSAP is free to use but under Webflow's "Standard" license, not an OSI license, with use restrictions. Easel's own code stays MIT and the user obtains GSAP from npm under its own terms. `ui-motion` teaches GSAP for the user's own projects. Found by QA review B-2 #3.

### D11. Bundled serif is Newsreader ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** the bundled editorial serif is Newsreader (OFL 1.1, no Reserved Font Name), replacing Source Serif 4.
- **Reason:** Source Serif 4 reserves the name "Source"; the Latin subsets Easel ships are Modified Versions under the OFL, which may not use a Reserved Font Name. Found by QA review C-1 #18.
- **History note (2026-10-11, after the v1.0.0 QA):** the Source Serif 4 subsets are still in git history, added in `f5de4e3` and removed in `3ab529a`. They are in no release tag (every tag points at a later commit), and history is not rewritten, by rule (CLAUDE.md, Git).

### D12. Craft rulebooks are Apache-2.0 adaptations ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** the five craft rulebooks carry "Adapted from nexu-io/open-design ... Modified by Easel" headers and are listed under Apache-2.0 in `THIRD_PARTY_NOTICES.md`, with `licenses/Apache-2.0.txt` shipped.
- **Reason:** they were written in new words, but their selection and order of rules follow open-design's `craft/` files closely (QA review C-1 #19). Treating them as adaptations is the conservative reading.


### D13. The animate kit's styles mix through per-style scopes ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** easel-motion's `tools/build.mjs` keeps the piece's own style global (as upstream) and wraps every style listed in `piece.json` `"mix"` in its own function scope, exposed as `KITS.<name>` with live getters for all of that kit's top-level names. An era names its style as a 4th `ERA_LIST` item; `kit/morph.js` draws each era's paper, windows and `post()` with that era's `STYLE` hooks (shrink with the old era's style, the morph switches at its midpoint, grow with the new era's).
- **Reason:** upstream concatenated kits into one script, so two kits that both declare `PAL`, `hand`, `rect` and so on could not be in one piece (a `SyntaxError`, tested). Wrapping only the extra styles leaves every existing piece and demo unchanged, which a namespace for all styles would not.
- **Evidence:** `plugins/easel-motion/test/build.test.mjs` (all eleven kits in one piece) and `test/render.test.mjs` (a riso era inside a cut-paper piece; the cut-paper era is pixel-identical to the unmixed build).

### D14. The animate kit uses only bundled fonts ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** the kit's system font stacks are replaced with bundled OFL fonts, and easel-core bundles four more faces: Caveat (handwriting, 400/700), STIX Two Text (math serif, 400/700 and italics), Noto Sans Math (symbols and Greek fallback) and Inter 900 (heavy print type). None declares a Reserved Font Name.
- **Reason:** upstream named Ink Free, Segoe Print, Cambria Math, Arial Black and Consolas. They exist only on some systems, so the same piece rendered differently per machine, and HANDOFF §5 requires bundled OFL fonts.

### D15. Brand-adjacent and character marks in the ported demos are replaced ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** the math style's pi-shaped hero is replaced by an original round hero (`dotHero`), and the crosshatch and sketchbook heroes carry a cream shine instead of a cream asterisk. References to the Manim library's API names stay in code comments and docs as technical notes; no style is named after it.
- **Reason:** a pi-shaped creature with eyes is a well-known channel's mascot, and a terracotta dot with a cream asterisk reads as a brand mark. HANDOFF §5: originals over copies, no trademarks or protected creators.

### D16. Audio is a JavaScript synth in the engine; mgaudio is not ported ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** task T2.4's audio decision is the architecture's second option. Scores are synthesized with Web Audio (`OfflineAudioContext`) inside the engine's offline browser: animate pieces keep their own `src/score.js` (rendered with `render_video` `audio: "page"`), and the new `audio_score` engine tool turns a cue sheet (`cues.json`) into a score with the same instruments (adapted from animate's synth). Every score is mastered to -14 LUFS with a two-pass ffmpeg loudnorm. Python is not needed by any Easel feature.
- **Reason:** mg-styles-15's `mgaudio` is about 8,700 lines of Python built on NumPy; a Node port is a project of its own, and depending on it would make Python plus NumPy a required install on Windows. The browser synth is already a dependency (Chromium), runs offline, and is used by every animate piece. mgaudio's genre recipes (chill, club, retro, world) are kept as ideas: `audio_score` has warm, bright and retro palettes.
- **Determinism note:** Chromium's Web Audio rounds a few hundred samples per render differently (1 LSB of 16-bit audio); two renders of the same cue sheet match to within 8 LSB after mastering (tested), not byte for byte.
- **Deviates from:** architecture.md section 4 "Audio", which preferred a Node port of mgaudio.

### D17. The four mg-styles looks are original Canvas kits, not ports of the films ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** task T2.6's liquid, aurora-glass, synthwave and HUD styles are written by Easel as animate-kit styles (`styles/<id>/kit.js` + `STYLE.md` + a 6 s demo in 9:16 and 16:9 + a golden frame), following the signature features in mg-styles-15's prompts. No code, media or fonts from mg-styles-15 are used.
- **Reason:** the mg-styles films are one-off 10 s pieces built on three.js, simplex-noise, opentype.js, WebGL shaders and their own fonts and photos; porting them would add four runtime libraries to the engine and media whose sources would each need tracing, and the result would still be four fixed films, not reusable styles. As kits they mix with the other styles, run offline in Canvas 2D and lay out in every format.
- **Not matched (recorded in each STYLE.md):** no WebGL bloom or 3D in synthwave and HUD; liquid's field is computed at quarter resolution; the aurora lens magnifies the aurora only.

### D18. Phase 2 QA follow-ups: mux tool, beat map name, per-plugin notices ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** (a) a new engine tool `mux_audio` puts a track on an existing video, rather than widening `render_video`; (b) a supplied track's beat map is `piece/beatmap.json` (`{ bpm, offset }`), so it can't be confused with the story `beats.json` (an upstream piece's `piece/beats.json` is still read); (c) each plugin carries its own `LICENSE`, and plugins with adapted material carry a `NOTICE.md` holding the license texts, because an installed plugin is copied on its own without the repo root; (d) the terracotta accent `#d97757` in the ported crosshatch and sketchbook heroes and the blank style kit stays.
- **Reason:** (a) `render_video` renders pages; muxing a file is a different job with different inputs (copy the video stream, never re-encode); (b) QA D-1 #6 showed the two formats under one name fail validation; (c) MIT and Apache-2.0 require the notice in every copy (QA D-1 #8); (d) a single colour value is not a trademark use and D8 forbids brand-named systems, not hues; it comes from the MIT upstream palette, and changing it would re-open three reviewed goldens for no licensing gain (QA D-1 #18, the rest of that finding was fixed).
- **Evidence:** `team/qa/D-1-phase2.md` (disposition table); tests `engine/test/mux.test.mjs`, `easel-motion/test/build.test.mjs` (beatmap, tool command lines).

### D19. easel-design is code-first; designskills' image model goes behind the provider layer ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** every easel-design skill builds HTML/CSS/SVG and renders it with the easel-core engine; designskills' Gemini pipeline is not ported (its prompt advice stays as an optional "AI raster path" that hands off to `easel-ai-media:image` once Phase 4 ships). The 28 designskills skills map onto 13 Easel skills per the catalog: thumbnails and banners fold into `social-graphic`, mobile, card, dark-mode and dashboard into `ui-design`, hero into `landing-page`, palette, typography and layout into `design-system`, product mockups into the `design` entry skill; `email-design` stays v2 (not ported), `design-critique` and `motion-design` were already covered by `easel-core:critique` and `easel-motion:ui-motion`, `image-treatment` waits for `easel-ai-media`. The engine gains `render_pdf` (print and decks) and qa `fixedFrame` (content past a fixed frame fails), both needed by these skills.
- **Reason:** HANDOFF and the start prompt put image generation behind the provider layer with the user's own keys; code output is free, exact (sizes, numbers, text), checkable by qa and reproducible. An example per skill is rendered and checked in the tests.

### D20. Evals of plugins that depend on easel-core run from the repository root ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** easel-motion's and easel-design's eval cases list `plugins: ["../..", "../../../easel-core"]` and run with `claude plugin eval . --eval-dir plugins/<plugin>/evals ...`; each carries a copy of easel-core's engine mocks (a test keeps them equal and in step with `tools.mjs`).
- **Reason:** `claude plugin eval` loads only the plugins a case names, and a plugin whose dependency is missing does not load at all: the v0.2.0 easel-motion run showed no easel-motion skills in the session (every routing case failed). A case's `plugins` entries must stay inside the eval target, so the target is the repository root. A trial run with this setup loaded both plugins and passed.

### D21. easel-illustrate: vector first, p5.js at run time, three open-design skills traced and deferred ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** (a) `svg`, `svg-illustration` and `concept-illustration` draw SVG by hand and check it through the engine (renders, qa with `fixedFrame`, and `tools/svg-check.mjs`, a Node replacement for linyaosky's bash `validate.sh`); upbrew's Python render loop is replaced by the engine. (b) `generative-art` uses p5.js 1.11.13 (LGPL-2.1), installed by doctor into the data folder and served offline to pages that name a CDN URL, exactly like GSAP (D10); Easel's own viewer replaces Anthropic's branded template; pieces paint each frame from t so the engine can seek them, and loops close on themselves (tested). (c) `concept-illustration` keeps both MIT notices (Aishwarya Ashok and Ian) and uses neither character: the user's mascot or Easel's own "card". (d) open-design's `shader-dev` traces to MiniMax-AI/skills (MIT, HEAD `60aaae52bb2af8162732751a4332f62a5fef518b`), `hand-drawn-diagrams` to muthuishere/hand-drawn-diagrams (MIT, Copyright (c) 2025 Muthukumaran Navaneethakrishnan, HEAD `c8ffd6c3febbc0e745ab6691ea81c8703a9829c8`; GitHub reports NOASSERTION only because the LICENSE file appends the MIT notices of Excalidraw and excalidraw-animate), `threejs` to CloudAI-X/threejs-skills (no licence, HEAD `b1c623076c661fc9b03dac19292e825a5d106823`). All three are **DEFERRED** to v2: shader recipes need WebGL review in the headless shell, the diagram and 3D skills are v2 in the catalog, threejs-skills has no licence, and the two MIT sources would each need their own review before porting. *(Licence of hand-drawn-diagrams corrected 2026-10-11 after the v1.0.0 QA review; it was recorded as "NOASSERTION, a LICENSE file whose type GitHub cannot identify". The deferral stands.)*
- **Reason:** start prompt and CLAUDE.md: trace before using or defer; Windows-first and Node-only tooling; no assets of the source characters; GSAP precedent for runtime libraries.

### D22. easel-ai-media is its own zero-dependency MCP server with a dry-run gate ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** (a) The provider layer is a separate MCP server (`media`) inside easel-ai-media, not part of easel-core's engine: keys and paid calls stay out of the plugin every user installs. Node only, no npm dependencies (fetch, FormData). (b) Six adapters (Gemini, OpenAI, fal.ai, Replicate, Atlas Cloud, ElevenLabs); every `generate` is a dry run with an estimate unless `confirm: true`, and above the spending limit (`max_spend_usd`, default 0.5 USD) or for an unpriced model it also needs `approvedUsd`. Prices live in `server/prices.json` with their source and a checked date or `verify`. (c) Keys come from the environment or masked `userConfig` fields passed as `EASEL_CFG_<PROVIDER>`; they are masked in every output, sent only to the provider's own https hosts, and never written to disk. (d) URLs a provider returns are checked (https, no local or private addresses, redirects followed by hand, size cap, media types); every paid job is logged in `jobs.jsonl` before polling so a failure after charging leaves its id; paid files are never overwritten. (e) Job folders must be inside the project. (f) Voice cloning needs `consent.json` in the speaker's words naming them, a real past date, a recording of at least 2 s that ffprobe reads as audio, and samples, all inside the job folder (real paths, so links cannot point out); every clone is logged. (g) Tests use recorded fixtures only; no live paid call has been made (owner's list: keys and budget). *(Clarified 2026-10-11 after the v1.0.0 QA review: the fixtures are hand-written, synthetic responses shaped from each provider's documentation, not recordings of live calls; the adapters have not yet been checked against the live APIs.)* (h) Music generation is the Atlas `minimax/music-2.6` model only; the catalog's `music` skill stays v2.
- **Reason:** CLAUDE.md safety rules (no live paid calls without keys and budget, never write or print keys, consent gate), architecture §6, QA F-1 (consent bypasses, SSRF, overwrites, untested paths).

### D23. easel-pixel runs the pinned bridge through a Node launcher, from a shipped lockfile ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** (a) architecture §5 said `npx -y @pebbly/aseprite-ai-artist@<pinned> serve`; instead `.mcp.json` runs `node server/launch.mjs serve`, because npx is a `.cmd` shim on Windows (not spawnable without a shell) and installs to the npm cache rather than `${CLAUDE_PLUGIN_DATA}`. (b) `setup` (run once by the pixel skill) installs `@pebbly/aseprite-ai-artist` 0.8.0 into the data folder with `npm ci` from `server/bridge-lock.json` (98 packages, every one with its sha512 integrity; the top package's matches npm's published hash), install scripts off, one install at a time (a lock file), then its Aseprite extension. `serve` never installs, so a session start never waits on the network. (c) Lua execution stays off whatever arguments are passed; no argument reaches the package. (d) The skills and agents are adapted from the repo at `f51fe69...`; npm 0.8.0 was published from `f3143257...`, and the 10 commits between them touch only the gallery, web app, docs and README, not `src/`, `skills/`, `agents/` or `hooks/` (checked with `gh api .../compare`). (e) Drawing end to end needs a licensed Aseprite: owner's list.
- **Reason:** Windows-first and data-folder installs (CLAUDE.md), the pin required by the start prompt, QA F-1 (#7, #10, #12).
- **Corrected 2026-10-11 after QA (the v1.0.0 review):** (c) is wrong as written. `ASEPRITE_AI_ALLOW_LUA=0` (set by the launcher) only stops the MCP server from registering its `run_lua` tool. The package's own bridge listens on `127.0.0.1:9932` (control) with no authentication and no Origin check, and forwards any command it receives to the Aseprite extension, including `lua.run` (arbitrary Lua) and `export.run` (writes to any path it is given); the extension does not check either. So any local process can run Lua in Aseprite while the bridge is up, whatever Easel passes. Seen in `@pebbly/aseprite-ai-artist` 0.8.0 (`dist/bridge/bridge.js`, `extension/ai-artist.lua`); our own source note already said "the bridge has no authentication" ([sources/with-pebbly-aseprite-ai-artist.md](sources/with-pebbly-aseprite-ai-artist.md)). What Easel does about it is a QA-fix decision, recorded in §5.

### D24. Dependents require easel-core >= 0.2.0; 0.2.0 is tagged after the Phase 3 engine work ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** easel-core 0.2.0 was not tagged when its CHANGELOG section was written; it is tagged at the commit that also carries p5.js serving, `render_pdf`, the CSS-length fallback for filmstrip and render_video, and the wrapper clean-up, so every plugin built on those can require it. Every other plugin declares `{ "name": "easel-core", "version": ">=0.2.0" }` (a relative-path plugin: the constraint is checked at load).
- **Reason:** QA E-1 #5 (new plugins depended on unreleased engine features with no version).
- **Update (v1.0.0, 2026-10-11):** at v1.0.0 the five dependent plugins switched from `>=0.2.0` to `{ "name": "easel-core", "version": "^1.0.0" }` (commit `b65a6c9`). Decided by Claude for the owner, 2026-10-11; reason: a semver range, so a dependent accepts 1.x fixes but not a breaking 2.0. Correction (2026-10-11, CI run 38139487971, Claude Code 2.1.296): the range is checked against the version of easel-core on the marketplace head; the dependency is installed from the head, not from the `easel-core--v1.0.0` tag. The text above records the 0.2.0-0.4.0 releases.

### D25. score-own-track eval: gap reported, grader kept ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** the case scores 0.25 (2 runs): when the files exist the model muxes the user's track with `mux_audio`, reports loudness and asks before mastering (the LLM grader passes), but it does not load the `score` skill for a one-tool job, so the skill-fired grader fails; in the other run the eval sandbox has no `launch.mp4`, so the model asks for the file. The grader is not loosened (that would weaken a test to get green); the gap is reported for the 0.2.0 release.
- **Reason:** start prompt: "evals at threshold or the gap reported"; "don't weaken a test to get green".

### D26. Eval stubs say they are stubs; graders judge the plan; Aseprite is a stateful agent mock ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** the first v0.3.0/v0.4.0 eval run (job 114: design 11/14, illustrate 4/7, ai-media 5/7, pixel 1/5; $8.59) failed mostly on the test bench, not the skills: the engine mocks answer every render with a fixed 1200x630 `still.png` that is never written, so honest replies said "I could not view the render" and the judge failed them; the Aseprite mocks were fixed answers that contradicted each other (a sprite open in one tool, none in another) and ignored the prompt's open sprite. Changes: (a) every engine mock that names an output file says it is a stub and asks the model to say so and carry on; (b) every LLM grader carries a note for the judge that tools are stubbed and that saying a result could not be viewed is fine, as long as nothing unchecked is claimed (the PASS and FAIL criteria are unchanged); (c) the `aseprite` server is a `type: agent` mock that keeps one document state, with a per-case starting document where the prompt says one is open; (d) routing text: the voice, ai-video, pixel-animate, pixel-export, logo and illustrate skills now say to load them first, including for requests they must refuse or redirect. No `skill-fired` grader was loosened; both runs are reported.
- **Reason:** start prompt (report eval gaps honestly; never weaken a test to get green); the plugin evals docs (mock substitutions, `type: agent` mocks).

## 5. v1.0.0 QA review (2026-10-11)

After the v1.0.0 release (`b65a6c9`) an independent QA review ran five parallel reviews and re-ran
every gate: `claude plugin validate --strict` passed for 7 of 7 targets (the marketplace and the six
plugins), and the test suites ran 246 tests with 0 skipped. Its findings are being fixed on `main`
after the release. Corrections to earlier records are dated in place:
the §1.5 name-guard lines, D7's status, D11 (history note), D21 (licence of hand-drawn-diagrams),
D22(g) (fixtures), D23(c) (Lua) and D24 (the `^1.0.0` range). The docs were reconciled with the
shipped code at the same time ([tasks.md](tasks.md), [roadmap.md](roadmap.md),
[skill-catalog.md](skill-catalog.md), [architecture.md](architecture.md),
[evals-v1.md](evals-v1.md)).

Decisions from the QA fixes (commits `8f5a3fd`, `96fecbb`, `c400dcb` and the engine,
motion/design/illustrate and docs commits that follow them):

### D27. A paid call needs the quote of a dry run of the same request ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** easel-ai-media's `generate` spends only with `confirm: true` plus the `quote` its dry run returned for the identical request. The quote is a stateless hash of everything the call is priced on and makes (provider, model, kind, count, size, aspect, quality, resolution, seconds, voice, language, instructions, voice name, the resolved ref and sample files, hashes of the prompt and text) and of the estimate itself, so any change, including a price change, needs a new dry run that the user sees. It survives a server restart.
- **Reason:** QA: `confirm: true` could be the first call, and the confirmed request could differ from the estimate the user was shown; plugin.json promises every paid call is shown and confirmed first.

### D28. The voice-clone consent gate is a procedure, not proof ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** the gate refuses a recording or sample that Easel itself generated (by name in the job's `provenance.json`/`jobs.jsonl` or by sha256 in an outputs ledger, so renamed copies are caught), near-silent audio (mean below -50 dB or peak below -40 dB), a recording shorter than max(2, words / 3.5) seconds, statements that refuse, withhold or revoke consent in any normalised form (NFKC, case, invisible characters), and any check it cannot run (no ffmpeg). Consent file, recording and samples are names in the job folder. The skills and tool text say it cannot tell who is speaking: the voice owner must write and record the statement.
- **Reason:** QA reproduced a clone with the server's own text-to-speech as the "consent recording", 3 s of silence, and "I withhold consent" passing. CLAUDE.md: never clone a voice without a recorded consent statement from the voice owner.

### D29. ai-media files: project images only, keys stay with their provider, nothing paid is lost or overwritten ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** (a) `refs` must be PNG, JPEG or WebP files inside the project (checked through links and by their bytes) and job folders may not leave the project through a link; (b) a request carrying a key follows redirects only to that provider's own https hosts; (c) output names are claimed atomically before a download, so parallel calls and `assemble` never replace an earlier file or an input, and every output's sha256 is logged; (d) with `count` > 1, images made before a failure are saved and logged as `partial`; (e) Atlas makes one prediction per image and sends `size` as its aspect ratio.
- **Reason:** QA reproduced a keystore-like file uploaded as a reference, a paid image overwritten by a parallel call, `assemble` overwriting a paid clip, and key headers following a cross-origin redirect.

### D30. easel-pixel is a Preview; "Lua off" only hides the MCP tool ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** easel-pixel stays at 1.0.0 but is labelled Preview (marketplace, plugin.json, README) until the owner's end-to-end Aseprite run and an eval run of the shipped skills at threshold. Its docs say plainly that `ASEPRITE_AI_ALLOW_LUA=0` hides the `run_lua` tool only: the upstream bridge on 127.0.0.1 has no authentication and accepts Lua and exports from any local program while it runs, so close Aseprite or stop the bridge when not drawing. The upstream issue is for the owner to report.
- **Reason:** QA: evals 0/5, the pixel skills changed after the eval run, never run with a real Aseprite; the bridge accepted `lua.run` from a client with a foreign Origin.

### D31. The qa gates measure what they claim and cannot be argued away ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** contrast and clipping measure an element by its own text nodes; visually hidden text and skip links are skipped; any CSS colour (oklch, color(), lab, color-mix) is converted to sRGB in the page, and one that cannot be is reported as unmeasured, never as black. A check the caller names that cannot run fails (loudness on a video with no audio), zero checks run is a failure, and `lufsMin`/`lufsMax` are bounded to -18..-10 and `stillSeconds` to 5. Renders run in UTC with en-US and seeded `crypto`; values a page declares (duration, fps, size) obey the same bounds as arguments; inline pages are written to a unique temporary file and removed; `audio_score` is capped at 1800 s.
- **Reason:** QA reproduced false refusals (a card with a dark badge child at 1:1, `sr-only` text), false passes (oklch text, loudness on a silent video) and a parallel race that checked the wrong page.

### D32. SVG text is delivered with its bundled fonts embedded ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** a new engine tool, `embed_fonts`, writes `<stem>-embedded.svg` with the bundled OFL faces its text uses inlined as base64 WOFF2 `@font-face` rules (the OFL allows embedding in documents), and refuses a family Easel does not bundle. The logo, brand-identity, svg, svg-illustration and concept-illustration skills deliver that file; a brand's own typeface means outlining in a vector editor, or PNGs only.
- **Reason:** QA: wordmarks looked right in every Easel render (the engine injects its fonts) but fell back to a serif on the user's site.

### D33. Style goldens are captured once each style's write-ons finish ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** easel-motion's golden test has a capture time per style (cut-paper 6.5 s, hud 5.0 s, others 4.5 s). The cut-paper and hud samples and the style-match comparison frame were re-rendered (on Linux, Chromium 140) and looked at; the shared PSNR floors are unchanged. The owner may re-render them on Windows with `EASEL_UPDATE_GOLDEN=1 EASEL_GOLDEN_STYLES=cut-paper,hud` to restore the Windows-goldens convention.
- **Reason:** QA: the default style's gallery sample showed a caption strip with one letter, the HUD sample "TARGET L", the blueprint comparison "FILAMEN".

### D34. Brand and font lints are case-insensitive with an explicit allow list; colours say when they are not for text ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** easel-design's and easel-illustrate's name lints scan skills, references, systems, examples and file and folder names case-insensitively; a brand or creator named as a look ("-style", "-like", "-inspired", "look", "aesthetic") always fails; platform names appear only in a per-file allow list with a reason, which fails when it goes stale. Every design-system colour below 4.5:1 says "not for text", and every role named "... text" passes AA; systems gained text-safe variants where needed. The face lint reads every Typography line.
- **Reason:** QA: "stripe-like", "vercel-style", "Pixar warmth" and a folder named `stripe-like` passed; "Body: Arial, 16px" passed; several text-role colours were below AA with no note.

Decisions from the full check of `972821c` (report Q-01..Q-44, 2026-10-11; fixed in the commits
that follow it):

### D35. Voice-clone consent is an English statement in a fixed affirmative form ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** the consent statement must contain a sentence that starts "I, <speaker>, consent"
  (or "give my consent") to their voice being cloned, with no negator or refusal word in that
  sentence; any other sentence may say "no" only as a limit on use, a right to withdraw or "have
  not been pressured". Statements in another script or language are refused with an explicit
  "the consent check reads English only" message (a speaker of another language reads and agrees
  to an English translation). The outputs ledger also stores a hash of each Easel audio output's
  decoded sound (16 kHz mono, edge silence trimmed), so a lossless re-encode or appended bytes are
  still recognised as Easel's own; a file that cannot be decoded is refused. Lossy re-encodes and
  added noise are not caught, which is why D28's "procedure, not proof" stands.
- **Reason:** the review reproduced ten refusal phrasings that passed (including Spanish, French
  and Portuguese ones) and genuine consent in Spanish, Arabic and Chinese that was refused; a
  re-encoded Easel voice passed as a recording. Fail safe rather than guess at other languages.

### D36. The quote is keyed, covers file bytes, and every quoted field is shown ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** the D27 quote is an HMAC-SHA256 (12 hex characters) with a per-install key in
  `<EASEL_MEDIA_DATA>/quote.key` (created once, mode 0600, never printed; per process when there
  is no data folder, so no secret is written into a project). It covers the sha256 of every
  reference and sample. The dry-run preview is built from the quoted material, so it shows every
  field the quote covers (count, resolution, instructions, language, voice name, files) and the
  values sent in another form.
- **Reason:** a quote could be forged offline and paid for; swapping a reference's bytes after the
  dry run kept the quote; price-relevant fields were quoted but not shown.

### D37. Each provider sends an argument as quoted or refuses it before any spend ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** every adapter declares the arguments it sends. An argument a model does not use is
  refused in the dry run, the confirmed call and `estimate`. Arguments are mapped only where the
  provider has an exact equivalent, and the mapped value is what is priced and shown (OpenAI
  `aspect` as the nearest of 1024x1024, 1024x1536, 1536x1024; aspect-only models take `size` as a
  ratio; clip seconds as sent).
- **Reason:** `aspect` and `refs` were shown and quoted but silently dropped (an OpenAI 9:16
  keyframe made square, Atlas references ignored), so the user paid for something else.

### D38. A paid result is never lost to bookkeeping, and references are checked to their last byte ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** the "paid, not saved" line is logged before any clean-up, and clean-up retries;
  a broken `provenance.json` is left alone (this call's entries go to `provenance-unmerged.json`
  with a warning); 0 results is an error that says the call may have been charged, and fewer
  results than `count` are saved and reported as partial. Reference images are parsed to their
  end (PNG IEND, JPEG EOI, WebP RIFF size); trailing data and hard links are refused, and so is a
  WAV sample longer than its header.
- **Reason:** an EBUSY on Windows could hide the charge; a malformed provenance file turned a paid
  success into a bare JSON error; a PNG header followed by keystore bytes was uploaded in full.

### D39. Engine outputs are written through a partial file and never through a link ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** `mux_audio` compares real paths (case-folded on Windows and macOS) and device and
  inode, and refuses an output that is its input video or audio. Media and sheet outputs are
  written to a hidden `.<name>-<pid>-<hex>.partial` and renamed into place (a failed run keeps the
  earlier file and leaves nothing); on Windows an abort or timeout kills the process tree. Page
  outputs (render_still, render_pdf, contact_sheet) go through `safeOutput`, which refuses a
  symbolic link, a hard-linked file, or a folder whose real path leaves the job folder. Wrapper
  pages for SVG and image inputs are written in the job folder with a `<base href>` to the source
  folder. ffmpeg runs asynchronously with timeouts in `mux_audio`, `audio_score`, `filmstrip` and
  `qa`.
- **Reason:** a symlinked or case-variant name let `mux_audio` truncate its input and report
  success; outputs were written through links planted in a job folder; wrappers were left among
  the user's assets; a long qa blocked every other MCP call.

### D40. Mastering is a measured gain and a true-peak limiter, not loudnorm ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** `assemble` (ai-media) and the engine's `masterWav` (`mux_audio master`, `lufs`,
  `audio_score`) measure with ebur128, the filter qa uses, apply a plain gain when the peaks allow
  it, and otherwise a 4x-oversampled limiter with make-up passes, to -14 LUFS integrated and a true
  peak of -1 dBTP (assemble: `lufs` -18..-10). `assemble` masters every film, and its narration
  takes one file or a list placed at clips (`{file, clip}`) or times (`{file, start}`). In
  `mux_audio`, `lufs` implies mastering. A lone narration file is mastered by assemble (in a film)
  or `mux_audio` (onto a video); there is no tool for a bare audio file.
- **Reason:** films took the narration's loudness and qa refused them with no way to fix it;
  loudnorm's dynamic mode undershot short lines by several LU (a 2 s line at -24 LUFS came out at
  -22.9).

### D41. qa measures ink and lines, says what it could not measure, and exempts only what WCAG exempts ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** text_clipping compares where the letters are, not the font's line box, and a box
  that scrolls only cuts text with `fixedFrame`. Contrast scores each line of an element's own
  text, measures form-field values and placeholders, open shadow DOM and `filter: opacity()`, and
  lists the rest (other filters, blend modes, pseudo-element text) as unmeasured. A contrast check
  named in `checks` that measured nothing fails; run by default it is reported as not run, which
  does not count as a check that ran. Text of disabled controls (`:disabled`,
  `aria-disabled="true"`, a disabled fieldset) is exempt from contrast, and art marked
  `data-easel-bleed` from `frame_overflow`; both are listed. Text inside a bleed element is not
  exempt from text_clipping. canvas_text refuses a missing or non-finite TIMELINE value, fails
  when no frame was sampled, and passes a piece that draws no text with a note. A media file
  ffmpeg cannot decode is refused with an error.
- **Reason:** false refusals (a tight wordmark, an inline `<code>`, a float) and false passes
  (inputs, pseudo-elements, a canvas page passing contrast with nothing measured) from the review;
  WCAG 1.4.3 exempts inactive components.

### D42. SVG files are well-formed XML, seeked on their SMIL clock, and rendered dark on a dark page ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** the engine parses every `.svg` input with DOMParser and refuses any XML error with
  the parser's message and the usual fix (`&amp;`, numeric entities); `svg-check` fails the same
  errors (plus valueless attributes and undeclared prefixes) and `embed_fonts` refuses them. Every
  seek pauses SVG SMIL animation and sets its time. `theme: "dark"` paints `#141414` behind an SVG
  (the contact sheet's dark), which `transparent` still clears.
- **Reason:** "R&D" in a label passed every check and shipped a file that shows an XML error page;
  SMIL renders were wall-clock and not repeatable; the dark check showed a currentColor icon on
  white.

### D43. HTML deliverables carry their fonts ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** `embed_fonts` takes `.html`/`.htm` and writes `<stem>-embedded.html` with one
  `<style data-easel-fonts>` of base64 WOFF2 `@font-face` rules for the faces the page's text uses
  at desktop and phone widths (linked CSS, pseudo-elements, inputs and `<use>` included); it never
  replaces any file and warns about characters the bundled (Latin) faces do not cover, embedding a
  bundled fallback family that does. landing-page, ui-design, presentation, brand-identity and
  ad-creative deliver the `-embedded.html` (ad-creative weighs it against the network's cap); work
  inside the user's own project is not embedded, and the skills say which OFL faces to load there.
  Email SVGs are never embedded.
- **Reason:** D32 fixed SVG only; delivered HTML fell back to system faces in the user's browser.

### D44. Design pieces are checked at their own size, in both themes, with bundled weights only ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** every fixed-size design skill runs qa with the piece's `width`, `height` and
  `fixedFrame: true` (decks per slide at 1280x720) and fixes every contrast finding, graphic mode
  included; ui-design and design-system also run qa with `theme: "dark"`. Systems and examples name
  only bundled weights (500 became 400 and 600 became 700, which is what rendered), and a lint
  checks every named weight against `fonts.json`. `palette --from` keeps the exact brand hex at its
  nearest step, and `palette --contrast` is the hand check for non-text contrast, which qa does not
  measure. Brand and creator lints fold accents, curly quotes and dashes and include CLAUDE.md's
  own examples.
- **Reason:** an overflowing 1080x1350 post passed qa at 1200x630; 500/600 weights rendered as
  400/700; "a Vox-style explainer" and "Dalí-esque" passed the lints.

### D45. Overlapping skills name each other, and pixel's Preview is one sentence everywhere ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** each skill of an overlapping pair carries one tie-break sentence (favicon or app
  icon -> logo; a game sprite drawn in Aseprite -> pixel, an SVG sprite sheet -> svg; a chart as a
  standalone graphic -> infographic, for a page -> svg; loaders and hover effects in the user's
  components -> ui-motion, an SVG asset -> svg; "a video" of AI footage -> ai-video, designed
  animation -> animate; abstract loops -> generative-art; a product photograph -> image, a designed
  layout -> design; empty states -> svg-illustration), with routing eval cases that leave out the
  deciding word. easel-pixel's marketplace entry and plugin.json share one description (Preview,
  not tested end to end, not affiliated with Aseprite / Igara Studio, the bridge risk), checked by
  a test; its `doctor` diagnoses only, and the skill asks before `setup` installs anything.
- **Reason:** the review's overlap table found eight phrases claimed by several skills with no
  tie-break, and four easel-pixel surfaces that disagreed.

### D46. Releases are checked against their tags; CI checks the tree and Node 20 ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** `scripts/release-check.mjs` fails a plugin whose files differ from its latest tag
  while its version is unchanged (or moved backwards); it is a pre-release check, not a per-commit
  gate, and it fails between releases by design (today 0/6, because these fixes are unreleased).
  CI's validate job has a tree-hygiene step, and a Node 20 job proves the runtime claim (`node
  --check`, both MCP servers started and called); the suites themselves need Node 22 for the
  test-file glob.
- **Reason:** eight commits of fixes sat behind version 1.0.0 with nothing to flag it; the README
  claims Node >= 20 and nothing ran it.

### D47. The blue-purple motion styles say how they pass colour_cast; pixel art stays square in every format ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** synthwave, liquid and aurora-glass document a qa call with `castMaxRatio: 1` in
  their STYLE.md (the user chose a palette that is blue-purple by design), and the animate skill
  and the motion rubric say no other style gets it; qa itself is unchanged. The pixel style reads a
  `[w, h]` resolution by its short side, so its pixels stay square in 16:9 and 1:1 and a frame the
  pixel size does not divide is cropped, never stretched (the 9:16 demo is byte-identical). Motion
  is reviewed at a frame every 0.5 s, one filmstrip per 24 s stretch (a call takes at most 48
  frames). With reference images, animate's intake and story check come first and style-match
  runs as its look check.
- **Reason:** three of the eleven styles failed colour_cast on every frame, so animate's "done
  when every hard check passes" could never be met for them; the pixel style came out 3.2:1
  non-square in 16:9.

### Open for the owner (not decided)

- **GSAP's licence.** GSAP is installed by `doctor` (D10) under GreenSock's "standard no-charge" license, which is not an open-source licence; setup now names it and its URL before installing. Read https://gsap.com/standard-license and decide whether Easel may keep installing it for previews or should make it opt-in.
- **The style name `riso`.** RISO and RISOGRAPH are registered marks of Riso Kagaku; CLAUDE.md forbids naming a style after a trademark. Rename (for example `three-ink-print`) or record an exception.
- **D7 = B** awaits the owner's confirmation (above).
- **From the full check's fixes (D35-D47), for the owner to confirm or decide:**
  - Voice-clone consent statements are English only (D35); confirm that is acceptable.
  - Decorative display type that bleeds off the frame on purpose still fails text_clipping
    (D41): keep that, or exempt text inside a `data-easel-bleed` element and list it.
  - The blue-purple motion styles pass colour_cast with a documented `castMaxRatio: 1` (D47):
    keep it documented, or make qa exempt those styles itself.
  - Two generic design systems put their primary in qa's blue-purple band (clean-product
    `#2F5BEA`, playful `#5B3FD6`); moving them changes several examples.
  - A tool to master a lone audio file (D40 covers films and videos only).
  - fal Kling v3's start-image field and price (`start_image_url`?) are unverified: the provider
    docs were unreachable from the review's sandbox.
  - linyaosky/svg-skill's LICENSE at `2103b92` was not re-fetched for the three example SVGs
    now credited to it (the recorded MIT pin was used).
  - Verbatim upstream text in easel-motion `skills/ui-motion/gsap/frameworks.md` points to
    `examples/vue/` and `examples/nuxt/`, which Easel does not ship.
  - CLAUDE.md's plugin-facts line on dependencies still says ranges resolve against tags; CI
    showed they install from the marketplace head (D24's correction). Only the owner edits that
    section.
