// Engine tool registry, shared by the MCP server (server.mjs) and the CLI (cli.mjs).
// Each tool: { description, inputSchema, run(args) }.
import { doctor } from './lib/doctor.mjs';
import { renderStill, outputDir } from './lib/render.mjs';
import { contactSheet } from './lib/contact.mjs';
import { renderVideo, filmstrip } from './lib/video.mjs';
import { qa } from './lib/qa.mjs';
import { KINDS, loadSchema, validateData, validateFile } from './lib/schemas.mjs';
import { craft } from './lib/craft.mjs';
import { measureImage, compareSheet } from './lib/refs.mjs';
import { audioScore, PALETTES } from './lib/score.mjs';
import { muxAudio } from './lib/audio.mjs';
import { renderPdf, PAPER } from './lib/pdf.mjs';
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
      'With install: true it installs the pinned npm packages and the Chromium headless shell (about 110 MB) into the plugin data folder; tell the user before doing that. For setup questions use the easel-core:setup skill, which runs this and gives the install command for each OS.',
    inputSchema: {
      type: 'object',
      properties: { install: { type: 'boolean', description: 'Install missing npm packages and Chromium into the plugin data folder.' } },
      additionalProperties: false,
    },
    run: (args) => doctor(args),
  },
  render_still: {
    description:
      'Render a page to PNG: inline HTML, or a file (.html, .svg, .png, .jpg). Renders offline with the bundled OFL fonts (Inter, Newsreader, JetBrains Mono, Space Grotesk, Caveat, STIX Two Text, Noto Sans Math) and a seeded Math.random. ' +
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
        aspect: { enum: ['16:9', '9:16', '1:1', '4:5'], description: 'Render a format-aware page (e.g. an animate piece) in this format; also the default size (1920x1080, 1080x1920, 1080x1080, 1080x1350).' },
        seed: { type: 'integer', description: 'Seed for Math.random (default 1).' },
        reducedMotion: { enum: ['no-preference', 'reduce'], description: 'Emulate prefers-reduced-motion (default no-preference); "reduce" renders the page\'s reduced-motion path.' },
      },
      additionalProperties: false,
    },
    run: (args) => renderStill(args),
  },
  render_pdf: {
    description:
      'Render a page (.html or .svg, or inline html) to a print PDF: posters, flyers, business cards, printable guides, slide decks (one page per CSS page or per slide with page breaks). ' +
      'Size from the page\'s own @page rule by default, or format (A4, Letter, ...) or width and height with units ("8.5in", "210mm", "1280px"); backgrounds are printed; no margins (put bleed and margins in the page). Offline, with the bundled fonts. Check the pages with render_still before sending to print.',
    inputSchema: {
      type: 'object',
      properties: {
        html: { type: 'string' }, file: { type: 'string', description: 'Path to the page (.html or .svg).' },
        name: { type: 'string' }, slug: { type: 'string' }, outDir: { type: 'string' },
        format: { enum: PAPER },
        width: { type: 'string', pattern: '^\\d+(\\.\\d+)?(px|in|cm|mm)$' }, height: { type: 'string', pattern: '^\\d+(\\.\\d+)?(px|in|cm|mm)$' },
        landscape: { type: 'boolean' }, printBackground: { type: 'boolean', description: 'Print backgrounds (default true).' },
        viewportWidth: { type: 'integer', minimum: 320, maximum: 7680, description: 'Layout viewport before printing (default 1280).' },
        viewportHeight: { type: 'integer', minimum: 240, maximum: 7680 },
        theme: { enum: ['light', 'dark'] }, seed: { type: 'integer' }, t: { type: 'number', minimum: 0 },
      },
      additionalProperties: false,
    },
    run: (args) => renderPdf(args),
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
      'Render an animated page to MP4 (H.264, yuv420p). The page animates through window.renderAt(t), window.renderFrame(t) (animate-kit canvas pieces), a paused GSAP timeline at window.__timelines[<data-composition-id>] (HyperFrames format), or CSS animations; every frame is seeked to t = n / fps, so output is deterministic. ' +
      'Duration, fps and size default to the composition root (data-duration, data-fps, data-width, data-height) or window.TIMELINE / window.__composition. aspects renders extra formats (16:9, 9:16, 1:1, 4:5) from the same page, which lays itself out responsively or reads window.__easel.aspect. audio muxes a track; audio "page" uses the page\'s own score (window.renderAudioWav), mastered to -14 LUFS and also saved as <name>.wav. Review the result with filmstrip.',
    inputSchema: {
      type: 'object',
      properties: {
        html: { type: 'string' }, file: { type: 'string', description: 'Path to the composition .html file.' },
        name: { type: 'string' }, slug: { type: 'string' }, outDir: { type: 'string' },
        duration: { type: 'number', minimum: 0.04, maximum: 600 }, fps: { type: 'number', minimum: 1, maximum: 120 },
        width: { type: 'integer', minimum: 16, maximum: 7680 }, height: { type: 'integer', minimum: 16, maximum: 7680 },
        aspects: { type: 'array', maxItems: 4, items: { enum: ['16:9', '9:16', '1:1', '4:5'] } },
        audio: { type: 'string', description: 'Path to an audio file to mux (trimmed to the video length), or "page" for the page\'s own score (window.renderAudioWav), mastered to -14 LUFS.' },
        crf: { type: 'integer', minimum: 0, maximum: 51, description: 'x264 quality, lower is better (default 18).' },
        preset: { enum: ['ultrafast', 'veryfast', 'fast', 'medium', 'slow'] },
        theme: { enum: ['light', 'dark'] }, seed: { type: 'integer' },
        reducedMotion: { enum: ['no-preference', 'reduce'], description: 'Emulate prefers-reduced-motion (default no-preference); "reduce" renders the page\'s reduced-motion path.' },
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
        aspect: { enum: ['16:9', '9:16', '1:1', '4:5'], description: 'Capture a format-aware page in this format (sets the size unless width/height are given).' },
        theme: { enum: ['light', 'dark'] }, seed: { type: 'integer' },
        reducedMotion: { enum: ['no-preference', 'reduce'], description: 'Emulate prefers-reduced-motion (default no-preference); "reduce" renders the page\'s reduced-motion path.' },
      },
      additionalProperties: false,
    },
    run: (args) => filmstrip(args),
  },
  qa: {
    description:
      'Measured quality gates. Page checks (html or file): text_clipping (text cut off by its box, a clipping ancestor or the frame) and contrast (WCAG AA per text run, sampling pixels on gradients and images); for canvas pieces (window.renderFrame + window.TIMELINE, e.g. animate pieces) canvas_text traces every string drawn on sampled frames: cut off by the frame or overlapping other text fails, under the phone UI on portrait formats warns (pass aspect to check one format), and beat_grid checks that TIMELINE.cuts and TIMELINE.morphs land on the 8th-note grid of TIMELINE.bpm (16ths inside TIMELINE.fastFrom to fastTo); named in checks on a piece without TIMELINE.bpm it fails. Pass reducedMotion "reduce" to check a page\'s reduced-motion path. ' +
      'Media checks: stillness (a still or empty video stretch longer than stillSeconds), colour_cast (more than 30% of frames dominated by blue-purple), loudness (integrated LUFS outside -16 to -12). ' +
      'Hard gates refuse delivery: fix every hardFailure, re-render and run qa again. Contrast is a hard gate when mode is "ui". fixedFrame: true adds frame_overflow (content past the frame) for fixed-size graphics.',
    inputSchema: {
      type: 'object',
      properties: {
        html: { type: 'string' }, file: { type: 'string', description: 'Page to check (.html or .svg).' },
        video: { type: 'string' }, audio: { type: 'string' }, image: { type: 'string' },
        width: { type: 'integer', minimum: 16, maximum: 7680 }, height: { type: 'integer', minimum: 16, maximum: 7680 },
        times: { type: 'array', maxItems: 24, items: { type: 'number', minimum: 0 }, description: 'For animated pages: check at these times.' },
        mode: { enum: ['ui', 'graphic', 'video'] }, theme: { enum: ['light', 'dark'] },
        checks: { type: 'array', items: { enum: ['text_clipping', 'contrast', 'canvas_text', 'beat_grid', 'stillness', 'colour_cast', 'loudness'] } },
        fixedFrame: { type: 'boolean', description: 'A fixed-size graphic (post, ad, poster, slide): content running past width x height fails (frame_overflow). Leave off for scrolling pages.' },
        aspect: { enum: ['16:9', '9:16', '1:1', '4:5'], description: 'canvas_text: the format to check a format-aware piece in.' },
        every: { type: 'integer', minimum: 1, maximum: 48, description: 'canvas_text: sample every Nth frame (default 6), plus the first and last frame of each shot.' },
        textIgnore: { type: 'array', maxItems: 32, items: { type: 'array', minItems: 2, maxItems: 3 }, description: 'canvas_text: [[t0, t1, "why"], ...] windows where crowded or cropped text is deliberate.' },
        stillSeconds: { type: 'number', minimum: 0.1 }, castMaxRatio: { type: 'number', minimum: 0, maximum: 1 },
        lufsMin: { type: 'number' }, lufsMax: { type: 'number' }, slug: { type: 'string' }, outDir: { type: 'string' },
        reducedMotion: { enum: ['no-preference', 'reduce'], description: 'Emulate prefers-reduced-motion (default no-preference); "reduce" renders the page\'s reduced-motion path.' },
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
  audio_score: {
    description:
      'Synthesize a score from a cue sheet (cues.json: fps, durationSec, bpm, key, cues of kind scene, beat, hit, caption, sfx, music-start, music-stop) and master it to -14 LUFS: a chord per scene section (pad, bass on the beat, a motif at each scene start), a dip into near-silence before every hit and the loudest moment on it, and sound effects by name (whoosh, swish, pop, click, tick, chime, riser, impact, blip). ' +
      'Offline and repeatable to within a few LSB (Web Audio in the engine browser; no Python). Writes <name>.wav to ./easel-out/<slug>/ and reports its loudness. For a page, render it with render_video audio = the WAV; for a video that already exists, use mux_audio; check it with qa.',
    inputSchema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Path to a cues.json.' },
        cues: { type: 'object', description: 'The cue sheet itself (instead of file).' },
        palette: { enum: PALETTES, description: 'warm (soft triangle pads; default), bright (saw pads, brighter plucks) or retro (square waves).' },
        lufs: { type: 'number', minimum: -24, maximum: -9, description: 'Integrated loudness target (default -14).' },
        name: { type: 'string' }, slug: { type: 'string' }, outDir: { type: 'string' },
      },
      additionalProperties: false,
    },
    run: (args) => audioScore(args),
  },
  mux_audio: {
    description:
      'Part of the easel-core:score skill (use the skill for the whole job: which audio, mux, loudness). Puts an audio track (a score from audio_score, or the user\'s own track) on a video that already exists: the video stream is copied unchanged, the audio becomes AAC, and the result is cut to the shorter of the two (shortest: false keeps the longer). master: true first masters the track to lufs (default -14). Writes <name>.mp4 (default <video name>-audio) to ./easel-out/<slug>/; never overwrites the input; reports the result\'s loudness (LUFS) against the -16 to -12 range. For a page you are still rendering, use render_video audio instead. The easel-core:score skill covers the whole job (which audio, mux, loudness check).',
    inputSchema: {
      type: 'object',
      required: ['video', 'audio'],
      properties: {
        video: { type: 'string', description: 'Path to the video (.mp4, .mov, .webm).' },
        audio: { type: 'string', description: 'Path to the audio (.wav, .mp3, .m4a, .flac, .ogg).' },
        master: { type: 'boolean', description: 'Master the track to lufs first (default false; audio_score output is already mastered).' },
        lufs: { type: 'number', minimum: -24, maximum: -9, description: 'Loudness target with master (default -14).' },
        offset: { type: 'number', minimum: 0, maximum: 600, description: 'Start the audio this many seconds into the video.' },
        shortest: { type: 'boolean', description: 'Cut to the shorter stream (default true).' },
        name: { type: 'string' }, slug: { type: 'string' }, outDir: { type: 'string' },
      },
      additionalProperties: false,
    },
    run: (args) => muxAudio(args),
  },
  measure_image: {
    description:
      'Measure reference images before matching a look: trims screenshot borders (writes <name>.trim.png into outDir), reports each picture\'s size, aspect and content box, its most common colours (exact bucket means with their share), points sampled as a 5x5 median, and with accent the bright saturated colours by hue family (core and halo). Give image files or a folder. Reference pixels stay local: use a job folder, never commit them.',
    inputSchema: {
      type: 'object',
      required: ['images'],
      properties: {
        images: { type: 'array', minItems: 1, maxItems: 32, items: { type: 'string' }, description: 'PNG, JPG or WEBP files, or folders of them.' },
        top: { type: 'integer', minimum: 1, maximum: 32, description: 'How many colours to list (default 10).' },
        points: { type: 'array', maxItems: 32, items: { type: 'array', minItems: 2, maxItems: 2, items: { type: 'integer', minimum: 0 } }, description: '[[x, y], ...] in the trimmed picture.' },
        accent: { type: 'boolean', description: 'Also list bright, saturated colours by hue family (neon, inks on black).' },
        trim: { type: 'boolean', description: 'Drop flat borders and letterboxing first (default true).' },
        slug: { type: 'string' }, outDir: { type: 'string' },
      },
      additionalProperties: false,
    },
    run: (args) => measureImage(args),
  },
  compare_images: {
    description:
      'A comparison sheet for matching a look: a reference image and our frame (render it first with render_still) side by side at the same height on a 10% proportion grid, plus both palettes as numbers. Compare proportions first, then palette, texture and type. crop picks a region of the reference (in its pixels, after autoTrim), cropOurs the matching region of our frame.',
    inputSchema: {
      type: 'object',
      required: ['reference', 'ours'],
      properties: {
        reference: { type: 'string' }, ours: { type: 'string' },
        crop: { type: 'array', minItems: 4, maxItems: 4, items: { type: 'integer', minimum: 0 } },
        cropOurs: { type: 'array', minItems: 4, maxItems: 4, items: { type: 'integer', minimum: 0 } },
        autoTrim: { type: 'boolean' }, grid: { type: 'boolean' }, height: { type: 'integer', minimum: 120, maximum: 2160 },
        top: { type: 'integer', minimum: 1, maximum: 16 }, referenceLabel: { type: 'string' }, oursLabel: { type: 'string' },
        name: { type: 'string' }, slug: { type: 'string' }, outDir: { type: 'string' },
      },
      additionalProperties: false,
    },
    run: (args) => compareSheet(args),
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
