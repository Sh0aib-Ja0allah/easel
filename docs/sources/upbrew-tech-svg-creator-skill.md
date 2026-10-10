# upbrew-tech/svg-creator-skill

- **Link:** https://github.com/upbrew-tech/svg-creator-skill
- **License:** **Apache-2.0** ("Copyright 2025 SVG Creator Skill Contributors"). There is no NOTICE file.
- **Status (2026-10-10):** 31 stars. In practice a single commit, from March 2026.
- **Type:** a bare skill folder (`svg-creator`). It has no plugin manifest. The README's `/plugin marketplace add` command is a placeholder.

## What it does

Writes an SVG, renders it to PNG, looks at the PNG, fixes problems, and repeats until it's ready to deliver. It suggests 1–2 passes for an icon and 5–8 for a character, building the character piece by piece (torso → legs → arms → head).

The output is static SVG plus CSS and SMIL animation recipes. For animated characters it switches to React with forward kinematics, where each limb's position is calculated from the joint it hangs from.

### Files

- `SKILL.md` (~170 lines)
- `references/advanced-techniques.md` (~885 lines)
- `scripts/svg_loop.py`
- 2 examples: a cat astronaut and a fox doing yoga

## Tooling problems

- **Weak renderer.** The only renderer is `cairosvg`. It can't render most filters (blur, turbulence, lighting), blend modes, or any animation. That means the verify step can't see most of the techniques the skill teaches.
- **Sandbox-specific setup.** Paths are hardcoded to claude.ai sandbox locations (`/home/claude`, `/mnt/user-data/outputs`). It installs itself with `pip --break-system-packages`.
- **Windows.** cairosvg needs the Cairo DLLs, so it likely fails.
- **Chromium claim.** The README says Chromium is detected automatically, but the script doesn't do that.

## Keep

The craft content here is the best of any source.

- **Five-zone lighting:** specular highlight, light, half-tone, cool form shadow, and reflected light at 0.10–0.20 opacity.
- **Material and filter cookbook,** including `feTurbulence` frequency ranges.
- **Character construction:** limbs are thick round-cap strokes, with circles drawn over the joints to hide the seams.
- **Animation timing tables:** a walk cycle takes 1–1.2 s, breathing 3–4 s.
- **The `finish` gate:** it refuses to deliver work that hasn't been rendered.

## Gaps

- The renderer can't show what the skill teaches.
- Paths are hardcoded and the state file is global.
- Animation is never verified.
- Its gradient-logo advice contradicts code-katz's rule against gradients in a first-version logo.

## Apache-2.0 obligations

1. Ship a copy of the Apache-2.0 license.
2. Keep the copyright notice.
3. Mark every file we change with a prominent "modified" notice (§4b).
4. Optionally, add our own NOTICE that credits upbrew-tech.

## Proposed use

**adapt.** This becomes the **illustration and character construction** content of the SVG skill.

- Replace `svg_loop.py` with our Node + Playwright render loop. It handles filters and CSS/SMIL animation, can capture frames at chosen times, and works on Windows.
- Move the forward-kinematics character code into the animation engine.
