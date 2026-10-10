// Engine tool registry, shared by the MCP server (server.mjs) and the CLI (cli.mjs).
// Each tool: { description, inputSchema, run(args) }.
import { doctor } from './lib/doctor.mjs';
import { renderStill, outputDir } from './lib/render.mjs';
import { contactSheet } from './lib/contact.mjs';
import { renderVideo, filmstrip } from './lib/video.mjs';
import { qa } from './lib/qa.mjs';
import { KINDS, loadSchema, validateData, validateFile } from './lib/schemas.mjs';
import { craft } from './lib/craft.mjs';
import { ENGINE_VERSION } from './lib/version.mjs';

export const tools = {
  ping: {
    description: 'Health check for the Easel engine. Returns pong with the engine version, Node version and platform.',
    inputSchema: {
      type: 'object',
      properties: { message: { type: 'string', description: 'Optional text echoed back.' } },
      additionalProperties: false,
    },
    async run(args) {
      return { pong: true, echo: args.message ?? null, engine: ENGINE_VERSION, node: process.version, platform: process.platform };
    },
  },
  doctor: {
    description:
      'Check what the Easel engine needs: Node, Playwright and Chromium (in the plugin data folder), ffmpeg and ffprobe, plus optional Python, Aseprite and provider API keys (names only). ' +
      'With install: true it installs the pinned npm packages and the Chromium headless shell (about 110 MB) into the plugin data folder; tell the user before doing that.',
    inputSchema: {
      type: 'object',
      properties: { install: { type: 'boolean', description: 'Install missing npm packages and Chromium into the plugin data folder.' } },
      additionalProperties: false,
    },
    run: (args) => doctor(args),
  },
  render_still: {
    description:
      'Render a page to PNG: inline HTML, or a file (.html, .svg, .png, .jpg). Renders offline with the bundled OFL fonts (Inter, Source Serif 4, JetBrains Mono, Space Grotesk) and a seeded Math.random. ' +
      'Use sizes for several outputs (e.g. social formats), theme "both" for light and dark (prefers-color-scheme), t to seek an animated page. Output goes to ./easel-out/<slug>/ unless outDir is given. Look at the PNG after rendering.',
    inputSchema: {
      type: 'object',
      properties: {
        html: { type: 'string', description: 'Full HTML document to render.' },
        file: { type: 'string', description: 'Path to an .html, .svg, .png or .jpg file.' },
        name: { type: 'string', description: 'Base file name (default "still").' },
        slug: { type: 'string', description: 'Job folder name under ./easel-out/.' },
        outDir: { type: 'string', description: 'Explicit output folder (overrides slug).' },
        width: { type: 'integer', minimum: 1, maximum: 8192 },
        height: { type: 'integer', minimum: 1, maximum: 8192 },
        sizes: { type: 'array', maxItems: 32, items: { type: 'object', required: ['width', 'height'], properties: { width: { type: 'integer', minimum: 1, maximum: 8192 }, height: { type: 'integer', minimum: 1, maximum: 8192 }, name: { type: 'string' } }, additionalProperties: false } },
        scale: { type: 'number', minimum: 0.25, maximum: 4, description: 'Device pixel ratio (2 for retina output).' },
        theme: { enum: ['light', 'dark', 'both'] },
        transparent: { type: 'boolean', description: 'Transparent background (PNG alpha).' },
        fullPage: { type: 'boolean' },
        selector: { type: 'string', description: 'CSS selector: screenshot only this element.' },
        t: { type: 'number', minimum: 0, description: 'Seek animated pages to this time in seconds before capture.' },
        seed: { type: 'integer', description: 'Seed for Math.random (default 1).' },
      },
      additionalProperties: false,
    },
    run: (args) => renderStill(args),
  },
  contact_sheet: {
    description:
      'Lay many renders out on one sheet so you can compare them at a glance: a logo or icon at a size ladder (e.g. 16 to 512 px) on light and dark, several directions side by side, or existing PNGs (storyboard panels). ' +
      'Each item is a file (.html, .svg, .png, .jpg) or inline html. Returns the sheet PNG and every cell file.',
    inputSchema: {
      type: 'object',
      required: ['items'],
      properties: {
        items: { type: 'array', minItems: 1, maxItems: 64, items: { type: 'object', properties: { file: { type: 'string' }, html: { type: 'string' }, label: { type: 'string' } }, additionalProperties: false } },
        sizes: { type: 'array', maxItems: 16, items: { anyOf: [{ type: 'integer', minimum: 8, maximum: 4096 }, { type: 'object', required: ['width', 'height'], properties: { width: { type: 'integer', minimum: 8, maximum: 4096 }, height: { type: 'integer', minimum: 8, maximum: 4096 }, name: { type: 'string' } }, additionalProperties: false }] } },
        themes: { type: 'array', items: { enum: ['light', 'dark'] }, maxItems: 2 },
        columns: { type: 'integer', minimum: 1, maximum: 12 },
        title: { type: 'string' },
        name: { type: 'string' },
        slug: { type: 'string' },
        outDir: { type: 'string' },
      },
      additionalProperties: false,
    },
    run: (args) => contactSheet(args),
  },
  render_video: {
    description:
      'Render an animated page to MP4 (H.264, yuv420p). The page animates through window.renderAt(t), a paused GSAP timeline at window.__timelines[<data-composition-id>] (HyperFrames format), or CSS animations; every frame is seeked to t = n / fps, so output is deterministic. ' +
      'Duration, fps and size default to the composition root (data-duration, data-fps, data-width, data-height). aspects renders extra formats (16:9, 9:16, 1:1, 4:5) from the same page, which must lay itself out responsively. audio muxes a track. Review the result with filmstrip.',
    inputSchema: {
      type: 'object',
      properties: {
        html: { type: 'string' }, file: { type: 'string', description: 'Path to the composition .html file.' },
        name: { type: 'string' }, slug: { type: 'string' }, outDir: { type: 'string' },
        duration: { type: 'number', minimum: 0.04, maximum: 600 }, fps: { type: 'number', minimum: 1, maximum: 120 },
        width: { type: 'integer', minimum: 16, maximum: 7680 }, height: { type: 'integer', minimum: 16, maximum: 7680 },
        aspects: { type: 'array', maxItems: 4, items: { enum: ['16:9', '9:16', '1:1', '4:5'] } },
        audio: { type: 'string', description: 'Path to an audio file to mux (trimmed to the video length).' },
        crf: { type: 'integer', minimum: 0, maximum: 51, description: 'x264 quality, lower is better (default 18).' },
        preset: { enum: ['ultrafast', 'veryfast', 'fast', 'medium', 'slow'] },
        theme: { enum: ['light', 'dark'] }, seed: { type: 'integer' },
      },
      additionalProperties: false,
    },
    run: (args) => renderVideo(args),
  },
  filmstrip: {
    description:
      'Capture an animated page at several times and lay the frames out on one sheet with timestamps, so you can look at the motion before or after rendering video. Give times (seconds) or count (evenly spaced over the duration).',
    inputSchema: {
      type: 'object',
      properties: {
        html: { type: 'string' }, file: { type: 'string' }, name: { type: 'string' }, slug: { type: 'string' }, outDir: { type: 'string' },
        times: { type: 'array', maxItems: 48, items: { type: 'number', minimum: 0 } }, count: { type: 'integer', minimum: 1, maximum: 48 },
        duration: { type: 'number', minimum: 0.04 }, width: { type: 'integer', minimum: 16, maximum: 7680 }, height: { type: 'integer', minimum: 16, maximum: 7680 },
        columns: { type: 'integer', minimum: 1, maximum: 12 }, cellWidth: { type: 'integer', minimum: 64, maximum: 1920 }, title: { type: 'string' },
        theme: { enum: ['light', 'dark'] }, seed: { type: 'integer' },
      },
      additionalProperties: false,
    },
    run: (args) => filmstrip(args),
  },
  qa: {
    description:
      'Measured quality gates. Page checks (html or file): text_clipping (text cut off by its box, a clipping ancestor or the frame) and contrast (WCAG AA per text run, sampling pixels on gradients and images). ' +
      'Media checks: stillness (a still or empty video stretch longer than stillSeconds), colour_cast (more than 30% of frames dominated by blue-purple), loudness (integrated LUFS outside -16 to -12). ' +
      'Hard gates refuse delivery: fix every hardFailure, re-render and run qa again. Contrast is a hard gate when mode is "ui".',
    inputSchema: {
      type: 'object',
      properties: {
        html: { type: 'string' }, file: { type: 'string', description: 'Page to check (.html or .svg).' },
        video: { type: 'string' }, audio: { type: 'string' }, image: { type: 'string' },
        width: { type: 'integer', minimum: 16, maximum: 7680 }, height: { type: 'integer', minimum: 16, maximum: 7680 },
        times: { type: 'array', maxItems: 24, items: { type: 'number', minimum: 0 }, description: 'For animated pages: check at these times.' },
        mode: { enum: ['ui', 'graphic', 'video'] }, theme: { enum: ['light', 'dark'] },
        checks: { type: 'array', items: { enum: ['text_clipping', 'contrast', 'stillness', 'colour_cast', 'loudness'] } },
        stillSeconds: { type: 'number', minimum: 0.1 }, castMaxRatio: { type: 'number', minimum: 0, maximum: 1 },
        lufsMin: { type: 'number' }, lufsMax: { type: 'number' }, slug: { type: 'string' }, outDir: { type: 'string' },
      },
      additionalProperties: false,
    },
    run: (args) => qa(args),
  },
  validate: {
    description:
      'Validate an Easel data file: brief (brief.json), beats (beats.json), cues (cues.json), provenance (provenance.json) or brand (.easel/brand.md in DESIGN.md sections). ' +
      'Pass file (a path) or data (the JSON object, or the markdown text for brand). Set schema: true to get the schema or brand template back instead.',
    inputSchema: {
      type: 'object',
      required: ['kind'],
      properties: {
        kind: { enum: KINDS },
        file: { type: 'string' },
        data: { type: ['object', 'string'] },
        schema: { type: 'boolean' },
      },
      additionalProperties: false,
    },
    async run(args) {
      if (args.schema) return { kind: args.kind, schema: loadSchema(args.kind) };
      if (!args.file && args.data === undefined) throw new Error('Give file or data (or schema: true).');
      const problems = args.file ? validateFile(args.kind, args.file) : validateData(args.kind, args.data);
      return { kind: args.kind, valid: problems.length === 0, problems };
    },
  },
  craft: {
    description:
      'Read Easel\'s shared rulebooks and critique rubrics. With no name it lists them. name returns one (craft: anti-generic, typography, colour, accessibility, motion; rubric: design, motion, illustration, pixel, social). ' +
      'for returns every entry that applies to a domain (e.g. "video", "ui", "illustration"). Read the relevant ones before designing and before critiquing.',
    inputSchema: {
      type: 'object',
      properties: {
        kind: { enum: ['craft', 'rubric'] },
        name: { type: 'string', pattern: '^[a-z0-9-]+$' },
        for: { type: 'string', pattern: '^[a-z0-9-]+$' },
      },
      additionalProperties: false,
    },
    run: (args) => craft(args),
  },
};
