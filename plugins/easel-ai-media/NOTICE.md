# Notices for easel-ai-media

easel-ai-media is MIT licensed (see [LICENSE](LICENSE)). It includes material adapted from the
projects below. The notices are kept here so they travel with the installed plugin; the
repository-wide list is `THIRD_PARTY_NOTICES.md` at the root of the Easel repository. Every adapted
file starts with a header naming its source file, the commit and what Easel changed.

## Alisa0808/vox-director (MIT)

The ai-video pipeline (`skills/ai-video/SKILL.md`: beat map, style bake-off, one keyframe per shot,
image-to-video, narration, music, assembly, two approval gates, cost before spending) and the
references `skills/ai-video/reference/prompt-guide.md`, `beat-layer.md`, `models-and-gotchas.md`
and `skills/voice/reference/voices.md` are adapted from
[Alisa0808/vox-director](https://github.com/Alisa0808/vox-director) at commit
`6a85a7c341610442a6a5b1885e6e0217ab82a11f`. Copyright (c) 2026 Alisa Qian. MIT License (text
below). Easel's changes: the look is called "editorial collage"; the Python scripts are replaced by
this plugin's Node server and easel-core's engine (Windows-first: no curl, no fixed binary or font
paths); the examples with real people and every note on getting around model content filters are
removed; any of six providers instead of one; voice cloning only behind a recorded consent
statement. Some estimate prices for Atlas Cloud models in `server/prices.json` come from its
models-and-gotchas notes and are marked "verify".

## ArnavPuri/designskills (MIT)

`skills/image/reference/prompt-craft.md` is adapted from the image-generation skill of
[ArnavPuri/designskills](https://github.com/ArnavPuri/designskills) at commit
`c7873015add8571ca95043febad0d9e6c97ee5c6`. Copyright (c) 2026 Arnav Puri. MIT License (text
below). Easel's changes: the provider-neutral prompt structure only; the CLI and install steps are
replaced by this plugin's generate tool.

## easel-core (MIT, Easel's own)

`server/lib/rpc.mjs`, `server/lib/validate.mjs` and `server/lib/binaries.mjs` are copies of
easel-core's engine files (installed plugins cannot import each other's files).

## Providers

Easel is not affiliated with Google, OpenAI, fal.ai, Replicate, Atlas Cloud or ElevenLabs. Their
names are used only to say which service a request goes to, on the user's own account and key.
Prices in `server/prices.json` are estimates read from each provider's pricing page on the date
shown (or marked "verify"); the provider's bill is what counts.

## Easel's own

The provider server (`server/`), the providers, image and voice skills, the consent gate and the
tests are Easel's own work under the MIT License.

## The MIT License (text, for each MIT source above)

```
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute,
sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or
substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
