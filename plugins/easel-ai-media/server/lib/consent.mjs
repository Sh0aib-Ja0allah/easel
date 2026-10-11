// The voice-clone consent gate (HANDOFF §5, architecture §6): a voice is cloned only with a consent
// statement from the voice owner, in their words, and their recording of it, both kept in the job
// folder (./easel-out/<slug>/), and every clone is logged there. Easel's own (MIT).
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';
import { findBinary } from './binaries.mjs';

export const CONSENT_TEMPLATE = {
  speaker: 'Full name of the person whose voice this is',
  statement: 'I, <full name>, consent to my voice being cloned for <purpose>, by <who>, for use in <where>. I can withdraw this consent at any time.',
  purpose: 'What the cloned voice will say and where it will be used',
  date: 'YYYY-MM-DD',
  recording: 'consent.wav (the speaker reading the statement aloud), in this job folder',
  samples: ['sample-1.wav', '...'],
};

const AUDIO = new Set(['.wav', '.mp3', '.m4a', '.ogg', '.oga', '.flac', '.webm', '.aac', '.opus']);
const MIN_AUDIO_BYTES = 1024;
const norm = (s) => String(s).normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
// "I do not consent", "I don't consent", "never consented", "I refuse to consent" (but "nobody may
// use it without my consent" is fine)
const NEGATED = /(\bnot\b|\bnever\b|n['’]t\b|\brefus\w*|\bdeclin\w*)\W+(?:\w+\W+){0,3}consent/i;
const PLACEHOLDER = /<[^>]*>|\bYYYY-MM-DD\b|full name of|what the cloned voice/i;

function realInside(file, root) {
  let real;
  try { real = realpathSync(file); } catch { return null; }
  return real === root || real.startsWith(root + sep) ? real : null;
}

// Length of an audio file with ffprobe, or an error. Needs ffmpeg (the plugin needs it anyway).
function audioSeconds(file) {
  const ffprobe = findBinary('ffprobe');
  if (!ffprobe) return { error: 'ffprobe was not found, so the recording cannot be checked (install ffmpeg: on Windows "winget install --id Gyan.FFmpeg -e")' };
  const r = spawnSync(ffprobe.path, ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=codec_type:format=duration', '-of', 'json', file], { encoding: 'utf8', windowsHide: true, timeout: 30000 });
  try {
    const j = JSON.parse(r.stdout || '{}');
    if (!j.streams || !j.streams.length) return { error: 'has no audio in it' };
    const d = Number(j.format && j.format.duration);
    return Number.isFinite(d) ? { seconds: d } : { error: 'has no readable length' };
  } catch { return { error: 'could not be read as audio' }; }
}

function validDate(d, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const t = new Date(`${d}T00:00:00Z`);
  if (Number.isNaN(t.getTime()) || t.toISOString().slice(0, 10) !== d) return false; // 2026-02-31 etc.
  return t.getTime() <= now.getTime() + 36 * 3600 * 1000; // not in the future (a day of timezone slack)
}

export function checkConsent(args, jobOut, { now = new Date() } = {}) {
  const fail = (reason) => ({ ok: false, reason, fix: `Ask the voice owner for consent in their own words and a recording of them reading it. Save it as consent.json in ${jobOut} with: ${JSON.stringify(CONSENT_TEMPLATE)}, with the recording and the voice samples in the same folder. Easel will not clone a voice without it.` });
  if (!args.voiceName || !String(args.voiceName).trim()) return fail('voiceName is required to clone a voice');
  if (!args.samples || !args.samples.length) return fail('samples (recordings of the voice) are required');
  if (!args.consentFile) return fail('no consent statement: consentFile is required for voice cloning');
  if (!existsSync(jobOut)) return fail(`the job folder ${jobOut} does not exist yet`);
  const root = realpathSync(jobOut);
  const file = realInside(resolve(args.consentFile), root);
  if (!existsSync(resolve(args.consentFile))) return fail(`the consent file ${resolve(args.consentFile)} does not exist`);
  if (!file) return fail('the consent file must be inside this job folder (easel-out/<slug>/)');
  let c;
  try { c = JSON.parse(readFileSync(file, 'utf8')); } catch { return fail('the consent file is not valid JSON'); }
  const missing = ['speaker', 'statement', 'purpose', 'date', 'recording'].filter((k) => typeof c[k] !== 'string' || !c[k].trim() || c[k] === CONSENT_TEMPLATE[k]);
  if (missing.length) return fail(`the consent statement is missing ${missing.join(', ')}`);
  const speaker = norm(c.speaker), statement = norm(c.statement);
  if (speaker.length < 2 || PLACEHOLDER.test(c.speaker)) return fail('the speaker must be the voice owner\'s name');
  if (PLACEHOLDER.test(c.statement) || PLACEHOLDER.test(c.purpose)) return fail('the statement still has template placeholders in it: the speaker writes it in their own words');
  if (!/\bconsent/i.test(c.statement)) return fail('the statement must say that the speaker consents');
  if (NEGATED.test(c.statement)) return fail('the statement does not give consent (it says they do not consent)');
  if (!statement.includes(speaker)) return fail('the statement must name the speaker in full, exactly as in "speaker"');
  if (norm(c.purpose).length < 3) return fail('the purpose must say what the voice will be used for');
  if (!validDate(c.date, now)) return fail('the consent date must be a real date (YYYY-MM-DD), not in the future');
  const recName = c.recording.trim().split(/\s+/)[0];
  if (!AUDIO.has(extname(recName).toLowerCase())) return fail(`the consent recording must be an audio file (${[...AUDIO].join(', ')})`);
  const recPath = resolve(root, recName);
  if (!existsSync(recPath)) return fail(`the consent recording ${recName} is not in the job folder`);
  const rec = realInside(recPath, root);
  if (!rec) return fail('the consent recording must be inside this job folder');
  if (rec === file) return fail('the consent recording must be a recording, not the consent file');
  if (!statSync(rec).isFile() || statSync(rec).size < MIN_AUDIO_BYTES) return fail(`the consent recording ${recName} is empty or too short`);
  const len = audioSeconds(rec);
  if (len.error) return fail(`the consent recording ${recName} ${len.error}`);
  if (len.seconds < 2) return fail(`the consent recording ${recName} is ${len.seconds.toFixed(1)} s long: it must be the speaker reading the statement`);
  const samples = [];
  for (const s of args.samples) {
    const real = existsSync(resolve(s)) ? realInside(resolve(s), root) : null;
    if (!real) return fail(`the voice sample ${s} must be in this job folder, with the consent statement`);
    if (!AUDIO.has(extname(real).toLowerCase()) || statSync(real).size < MIN_AUDIO_BYTES) return fail(`the voice sample ${s} is not an audio recording`);
    samples.push(real);
  }
  return { ok: true, speaker: c.speaker.trim(), consentFile: file, recording: rec, samples };
}

// Every clone that is actually made is logged next to the consent statement.
export function logConsent(args, jobOut, c, voiceId) {
  mkdirSync(jobOut, { recursive: true });
  const root = realpathSync(jobOut), rel = (p) => relative(root, p).split(sep).join('/');
  appendFileSync(join(jobOut, 'consent-log.jsonl'), JSON.stringify({ at: new Date().toISOString(), action: 'voice-clone', voiceName: args.voiceName, voiceId: voiceId || null, speaker: c.speaker, consentFile: rel(c.consentFile), recording: rel(c.recording), samples: c.samples.map(rel) }) + '\n');
}
