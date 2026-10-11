// easel-ai-media tool registry (MCP server "media"): providers, estimate, generate, assemble, consent_template.
import { assemble } from './lib/assemble.mjs';
import { CONSENT_TEMPLATE } from './lib/consent.mjs';
import { KINDS, estimate, generate, listProviders } from './lib/media.mjs';
import { PROVIDERS } from './providers/index.mjs';

const PROVIDER_IDS = Object.keys(PROVIDERS);
const common = {
  kind: { enum: KINDS }, provider: { enum: PROVIDER_IDS }, model: { type: 'string' },
  prompt: { type: 'string', maxLength: 8000 }, text: { type: 'string', maxLength: 20000, description: 'tts: the words to speak.' },
  refs: { type: 'array', maxItems: 8, items: { type: 'string' }, description: 'Reference or start images: the user\'s own PNG, JPEG or WebP files inside the project folder (paths from the project folder). Nothing outside it is ever sent.' },
  size: { type: 'string', pattern: '^\\d+x\\d+$' }, aspect: { type: 'string', pattern: '^\\d+:\\d+$' }, quality: { enum: ['low', 'medium', 'high'] },
  resolution: { enum: ['1k', '2k'] }, seconds: { type: 'number', minimum: 1, maximum: 60 }, count: { type: 'integer', minimum: 1, maximum: 8 },
  voice: { type: 'string', description: 'tts: the provider voice id or name.' }, language: { type: 'string' }, instructions: { type: 'string' },
};

export const tools = {
  providers: {
    description: 'List the media providers (Gemini, OpenAI, fal.ai, Replicate, Atlas Cloud, ElevenLabs), which have a key set (names only, never values), the kinds and models each one does, the price used for estimates (with its source and whether it was checked) and the spending limit above which an approved amount is needed.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    run: () => listProviders(),
  },
  estimate: {
    description: 'Estimate the cost of a generation before spending: provider, model, USD, how it was worked out, and the price source. Spends nothing.',
    inputSchema: { type: 'object', required: ['kind'], properties: { ...common }, additionalProperties: false },
    run: (args) => estimate(args),
  },
  generate: {
    description: 'Generate media with the user\'s own provider key: image (text or references), video (image-to-video), tts (speech, with word timings where the provider gives them), music, or voice-clone (only with a consent statement in the job folder). ' +
      'Without confirm it is a dry run: it returns the cost estimate, the request and a quote, and spends nothing. Show the estimate and the request to the user; only when they agree, call again with the same arguments plus confirm: true and that quote (and approvedUsd when the estimate is above the limit). A paid call without the quote of a dry run of the same request is refused. Files go to ./easel-out/<slug>/ (a used name gets -2) with a provenance.json entry. An argument the chosen model does not use (refs for a text-to-image model, aspect for an image-to-video clip, language for OpenAI or ElevenLabs speech) is refused before any spend; values sent in another form are listed in the dry run\'s request under sent, with notes (e.g. an aspect sent to OpenAI as the nearest of its three sizes, which is what is priced).',
    inputSchema: { type: 'object', required: ['kind'], properties: { ...common, confirm: { type: 'boolean' }, quote: { type: 'string', pattern: '^[0-9a-f]{12}$', description: 'With confirm: the quote a dry run of this same request returned.' }, approvedUsd: { type: 'number', minimum: 0 }, name: { type: 'string' }, slug: { type: 'string' }, outDir: { type: 'string' },
      voiceName: { type: 'string', description: 'voice-clone: the name for the new voice.' }, samples: { type: 'array', maxItems: 25, items: { type: 'string' }, description: 'voice-clone: recordings of the voice (the owner\'s own, never generated speech): wav, mp3, m4a, ogg or flac file names in the job folder.' },
      consentFile: { type: 'string', description: 'voice-clone: consent.json, by its name in the job folder (see consent_template).' } }, additionalProperties: false },
    run: (args) => generate(args),
  },
  assemble: {
    description: 'Join generated clips into one film with the local ffmpeg: each clip scaled to fill the frame and cut or slowed (never frozen) to its beat length, caption or watermark PNGs overlaid at their times (render them with easel-core render_still, transparent: true), narration (one file, or one line per beat placed at its clip or time) and music mixed with the music ducked under the voice, and the mix mastered to -14 LUFS integrated with a true peak of -1 dBTP (lufs sets another target), so the film passes easel-core qa loudness whatever the narration\'s own level. Reports the film\'s measured loudness, and warns when narration lines overlap or run past the end.',
    inputSchema: { type: 'object', required: ['clips'], properties: {
      clips: { type: 'array', minItems: 1, maxItems: 60, items: { type: 'object', required: ['file'], properties: { file: { type: 'string' }, seconds: { type: 'number', minimum: 0.2, maximum: 120 } }, additionalProperties: false } },
      size: { type: 'string', pattern: '^\\d+x\\d+$' }, fps: { type: 'integer', minimum: 12, maximum: 60 },
      narration: { anyOf: [{ type: 'string' }, { type: 'array', minItems: 1, maxItems: 60, items: { type: 'object', required: ['file'], properties: { file: { type: 'string' }, clip: { type: 'integer', minimum: 0 }, start: { type: 'number', minimum: 0 } }, additionalProperties: false } }],
        description: 'One audio file for the whole film (it starts at 0 s), or a list of lines, one per beat: [{ file, clip }] starts the line with that clip (numbered from 0, as in clips), [{ file, start }] at that many seconds into the film; give clip or start, not both.' },
      music: { type: 'string' }, musicDb: { type: 'number', minimum: -40, maximum: 0, description: 'Music level under the voice before mastering (default -16).' },
      lufs: { type: 'number', minimum: -18, maximum: -10, description: 'Integrated loudness the mix is mastered to (default -14; true peak -1 dBTP).' },
      overlays: { type: 'array', maxItems: 200, items: { type: 'object', required: ['file'], properties: { file: { type: 'string' }, start: { type: 'number', minimum: 0 }, end: { type: 'number', minimum: 0 } }, additionalProperties: false } },
      crf: { type: 'integer', minimum: 0, maximum: 51 }, preset: { enum: ['ultrafast', 'veryfast', 'fast', 'medium', 'slow'] }, name: { type: 'string' }, slug: { type: 'string' }, outDir: { type: 'string' } }, additionalProperties: false },
    run: (args) => assemble(args),
  },
  consent_template: {
    description: 'The consent statement a voice owner must give before their voice is cloned (save it as consent.json in the job folder with their recording of it). Voice cloning is refused without it. The checks are a procedure, not proof: the recording must be the voice owner themselves.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    run: () => ({ template: CONSENT_TEMPLATE, rules: ['The voice owner gives the statement themselves, in their words, naming the purpose.', 'Their recording of the statement is saved in the job folder: the owner themselves reading all of it aloud (at least one second for every 3.5 words), never generated speech, never silence.', 'consentFile, the recording and the samples are names in the job folder.', 'The server\'s checks are a procedure the user must honour, not proof of consent: they cannot tell who is speaking.', 'Never clone a public figure, or anyone who has not consented.', 'Every clone is logged to consent-log.jsonl in the job folder.', 'Write the statement in English, with the consent in a sentence of its own that starts "I, <full name>, consent to my voice being cloned" and has no "not", "no", "never", "without" or other refusal word in it; put any limit in a sentence of its own ("It must not be used for anything else."). The check reads English only: a speaker of another language reads and agrees to an English translation, and records that.'] }),
  },
};
