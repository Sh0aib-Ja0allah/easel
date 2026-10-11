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

Legal pass for v1.0.0 (T5.2, 2026-10-11): every item ticked with the commit that did it and how it
is checked. "Sweep" = a search of the whole repository on 2026-10-11.

**Don't copy:**

- [x] Character and brand assets:
  - huashu character assets (`hero/`, `long_scroll/frames/`, `assets/角色/`, `rig_huashu.js`): not present (sweep; only the grammars and recipes were translated, 1411085). `plugins/easel-motion/test/build.test.mjs` fails on huashu names in any built piece.
  - the Mario/Nintendo showcase and the Clawd fan work: not present (sweep); the motion, pixel and illustrate tests reject the names.
  - vox's Ronaldo/CR7 examples: not present (sweep; 10e6085); `plugins/easel-ai-media/test/static.test.mjs` rejects the names and any line about getting around content filters that is not a refusal.
  - mg-styles media with unstated sources: none copied; the four mg-styles looks are Easel's own code (D17, 2a6c11e). Every image in `plugins/` is Easel-rendered (style samples, goldens, the style-match example, test fixtures).
  - the peanut and Xiaohei characters and their example images: not present; Easel's mascot is its own "card" (10e6085, 3cf1603); `plugins/easel-illustrate/test/static.test.mjs` rejects the names.
- [x] Any text from the **unlicensed** repos (b1rdmania, VicUgochukwu). Checked with an 8-word overlap test against both repos (b1rdmania/claude-brand-skills @ `b356640b`, VicUgochukwu/brand-design-skill @ `179eb1ce`, fetched as data): the only prose shared is Anthropic's Apache-2.0 canvas-design and algorithmic-art text, which b1rdmania also copies and Easel takes from anthropics/skills directly; after removing that and MIT/HTML boilerplate, 88 shared 8-word runs remain in 40 files, all code boilerplate or formulas (doctype lines, CSS declarations, the WCAG luminance constants). No prose.
- [x] Anthropic's `canvas-design` / `frontend-design` via b1rdmania. Taken from **anthropics/skills** @ `dbd4588` directly (4e686ac, 10e6085; headers in each file); `frontend-design` is not used.

**Rename:**

- [x] Styles named after trademarks or living or protected creators: Vox -> editorial collage, and the rest (1411085, 2a6c11e, 10e6085). Banned-name tests in the core craft rules, motion builds, illustrate, ai-media and pixel suites.
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

### D7. Render engine: build our own, or build on HyperFrames? ✅ (2026-10-11)

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

- **Decision:** (a) `svg`, `svg-illustration` and `concept-illustration` draw SVG by hand and check it through the engine (renders, qa with `fixedFrame`, and `tools/svg-check.mjs`, a Node replacement for linyaosky's bash `validate.sh`); upbrew's Python render loop is replaced by the engine. (b) `generative-art` uses p5.js 1.11.13 (LGPL-2.1), installed by doctor into the data folder and served offline to pages that name a CDN URL, exactly like GSAP (D10); Easel's own viewer replaces Anthropic's branded template; pieces paint each frame from t so the engine can seek them, and loops close on themselves (tested). (c) `concept-illustration` keeps both MIT notices (Aishwarya Ashok and Ian) and uses neither character: the user's mascot or Easel's own "card". (d) open-design's `shader-dev` traces to MiniMax-AI/skills (MIT, HEAD `60aaae52bb2af8162732751a4332f62a5fef518b`), `hand-drawn-diagrams` to muthuishere/hand-drawn-diagrams (licence NOASSERTION: a LICENSE file whose type GitHub cannot identify, HEAD `c8ffd6c3febbc0e745ab6691ea81c8703a9829c8`), `threejs` to CloudAI-X/threejs-skills (no licence, HEAD `b1c623076c661fc9b03dac19292e825a5d106823`). All three are **DEFERRED** to v2: shader recipes need WebGL review in the headless shell, the diagram and 3D skills are v2 in the catalog, and two of the three are not clearly licensed (the third would need its own review before porting).
- **Reason:** start prompt and CLAUDE.md: trace before using or defer; Windows-first and Node-only tooling; no assets of the source characters; GSAP precedent for runtime libraries.

### D22. easel-ai-media is its own zero-dependency MCP server with a dry-run gate ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** (a) The provider layer is a separate MCP server (`media`) inside easel-ai-media, not part of easel-core's engine: keys and paid calls stay out of the plugin every user installs. Node only, no npm dependencies (fetch, FormData). (b) Six adapters (Gemini, OpenAI, fal.ai, Replicate, Atlas Cloud, ElevenLabs); every `generate` is a dry run with an estimate unless `confirm: true`, and above the spending limit (`max_spend_usd`, default 0.5 USD) or for an unpriced model it also needs `approvedUsd`. Prices live in `server/prices.json` with their source and a checked date or `verify`. (c) Keys come from the environment or masked `userConfig` fields passed as `EASEL_CFG_<PROVIDER>`; they are masked in every output, sent only to the provider's own https hosts, and never written to disk. (d) URLs a provider returns are checked (https, no local or private addresses, redirects followed by hand, size cap, media types); every paid job is logged in `jobs.jsonl` before polling so a failure after charging leaves its id; paid files are never overwritten. (e) Job folders must be inside the project. (f) Voice cloning needs `consent.json` in the speaker's words naming them, a real past date, a recording of at least 2 s that ffprobe reads as audio, and samples, all inside the job folder (real paths, so links cannot point out); every clone is logged. (g) Tests use recorded fixtures only; no live paid call has been made (owner's list: keys and budget). (h) Music generation is the Atlas `minimax/music-2.6` model only; the catalog's `music` skill stays v2.
- **Reason:** CLAUDE.md safety rules (no live paid calls without keys and budget, never write or print keys, consent gate), architecture §6, QA F-1 (consent bypasses, SSRF, overwrites, untested paths).

### D23. easel-pixel runs the pinned bridge through a Node launcher, from a shipped lockfile ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** (a) architecture §5 said `npx -y @pebbly/aseprite-ai-artist@<pinned> serve`; instead `.mcp.json` runs `node server/launch.mjs serve`, because npx is a `.cmd` shim on Windows (not spawnable without a shell) and installs to the npm cache rather than `${CLAUDE_PLUGIN_DATA}`. (b) `setup` (run once by the pixel skill) installs `@pebbly/aseprite-ai-artist` 0.8.0 into the data folder with `npm ci` from `server/bridge-lock.json` (98 packages, every one with its sha512 integrity; the top package's matches npm's published hash), install scripts off, one install at a time (a lock file), then its Aseprite extension. `serve` never installs, so a session start never waits on the network. (c) Lua execution stays off whatever arguments are passed; no argument reaches the package. (d) The skills and agents are adapted from the repo at `f51fe69...`; npm 0.8.0 was published from `f3143257...`, and the 10 commits between them touch only the gallery, web app, docs and README, not `src/`, `skills/`, `agents/` or `hooks/` (checked with `gh api .../compare`). (e) Drawing end to end needs a licensed Aseprite: owner's list.
- **Reason:** Windows-first and data-folder installs (CLAUDE.md), the pin required by the start prompt, QA F-1 (#7, #10, #12).

### D24. Dependents require easel-core >= 0.2.0; 0.2.0 is tagged after the Phase 3 engine work ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** easel-core 0.2.0 was not tagged when its CHANGELOG section was written; it is tagged at the commit that also carries p5.js serving, `render_pdf`, the CSS-length fallback for filmstrip and render_video, and the wrapper clean-up, so every plugin built on those can require it. Every other plugin declares `{ "name": "easel-core", "version": ">=0.2.0" }` (a relative-path plugin: the constraint is checked at load).
- **Reason:** QA E-1 #5 (new plugins depended on unreleased engine features with no version).

### D25. score-own-track eval: gap reported, grader kept ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** the case scores 0.25 (2 runs): when the files exist the model muxes the user's track with `mux_audio`, reports loudness and asks before mastering (the LLM grader passes), but it does not load the `score` skill for a one-tool job, so the skill-fired grader fails; in the other run the eval sandbox has no `launch.mp4`, so the model asks for the file. The grader is not loosened (that would weaken a test to get green); the gap is reported for the 0.2.0 release.
- **Reason:** start prompt: "evals at threshold or the gap reported"; "don't weaken a test to get green".

### D26. Eval stubs say they are stubs; graders judge the plan; Aseprite is a stateful agent mock ✅ (decided by Claude for the owner, 2026-10-11)

- **Decision:** the first v0.3.0/v0.4.0 eval run (job 114: design 11/14, illustrate 4/7, ai-media 5/7, pixel 1/5; $8.59) failed mostly on the test bench, not the skills: the engine mocks answer every render with a fixed 1200x630 `still.png` that is never written, so honest replies said "I could not view the render" and the judge failed them; the Aseprite mocks were fixed answers that contradicted each other (a sprite open in one tool, none in another) and ignored the prompt's open sprite. Changes: (a) every engine mock that names an output file says it is a stub and asks the model to say so and carry on; (b) every LLM grader carries a note for the judge that tools are stubbed and that saying a result could not be viewed is fine, as long as nothing unchecked is claimed (the PASS and FAIL criteria are unchanged); (c) the `aseprite` server is a `type: agent` mock that keeps one document state, with a per-case starting document where the prompt says one is open; (d) routing text: the voice, ai-video, pixel-animate, pixel-export, logo and illustrate skills now say to load them first, including for requests they must refuse or redirect. No `skill-fired` grader was loosened; both runs are reported.
- **Reason:** start prompt (report eval gaps honestly; never weaken a test to get green); the plugin evals docs (mock substitutions, `type: agent` mocks).
