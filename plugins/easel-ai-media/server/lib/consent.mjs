// The voice-clone consent gate (HANDOFF §5, architecture §6): a voice is cloned only with a consent
// statement from the voice owner, in their words, and their recording of it, both kept in the job
// folder (./easel-out/<slug>/), and every clone is logged there. Easel's own (MIT).
//
// These checks catch mistakes and the obvious fakes (no recording, silence, a clip too short to hold
// the statement, speech Easel itself generated, a statement that refuses consent). They are not
// proof of consent: a tone, someone else reading the words, or speech from another generator can
// pass them. The procedure is the user's to honour: the voice owner gives the statement and records
// it themselves.
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';
import { findBinary } from './binaries.mjs';
import { SAMPLE_EXT, fileSha256, jobName, knownOutputs } from './outputs.mjs';

export const CONSENT_TEMPLATE = {
  speaker: 'Full name of the person whose voice this is',
  statement: 'I, <full name>, consent to my voice being cloned for <purpose>, by <who>, for use in <where>. I can withdraw this consent at any time.',
  purpose: 'What the cloned voice will say and where it will be used',
  date: 'YYYY-MM-DD',
  recording: 'consent.wav (the voice owner themselves reading the statement aloud: a real recording, never generated speech), in this job folder',
  samples: ['sample-1.wav', '...'],
};

const AUDIO = new Set(['.wav', '.mp3', '.m4a', '.ogg', '.oga', '.flac', '.webm', '.aac', '.opus']);
const MIN_AUDIO_BYTES = 1024;
// Reading speed for the shortest believable recording of the statement: 3.5 words a second (210 a
// minute) is the fast end of reading aloud (narration is usually 150-160 a minute), so a real
// reading is longer than this and a shorter clip cannot hold the statement. Han and kana characters
// count as half a word each (about 7 a second read aloud).
export const WORDS_PER_SECOND = 3.5;
export const MIN_RECORDING_SECONDS = 2;
// Near silence: mean below -50 dBFS or peak below -40 dBFS (ffmpeg volumedetect).
export const SILENT_MEAN_DB = -50, SILENT_PEAK_DB = -40;

// Text for the checks: NFKC (full-width and other compatibility forms become plain letters),
// invisible format characters removed, curly apostrophes made straight, case folded.
export const plain = (s) => String(s).normalize('NFKC').replace(/\p{Cf}/gu, '').replace(/[‘’ʼ′]/g, "'").toLowerCase().replace(/\s+/g, ' ').trim();
const PLACEHOLDER = /<[^>]*>|\bYYYY-MM-DD\b|full name of|what the cloned voice/i;
export const statementWords = (s) => { const t = plain(s); return t.split(' ').filter((w) => /[\p{L}\p{N}]/u.test(w) && !/^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]+$/u.test(w)).length + (t.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu) || []).length / 2; };
export const minRecordingSeconds = (statement) => Math.max(MIN_RECORDING_SECONDS, statementWords(statement) / WORDS_PER_SECOND);

// Does the statement refuse, withhold or take back consent anywhere? Checked sentence by sentence.
// "Nobody may use it without my consent" limits the consent and is fine; "cloned without consent"
// is not. "I can withdraw this consent at any time" states a right and is fine; "I revoke my
// consent" is not.
const WITHOUT = /\bwithout\s+(?:[\w-]+\s+){0,2}consent/g;
const LIMIT = /\b(?:nobody|no one|no-one|not|never|none|nothing|nor|only)\b|n't\b/;
const RIGHT = /\b(?:can|may|could|might|able to|right to|free to|entitled to)\s+(?:\w+\s+){0,2}$/;
export function refusesConsent(statement) {
  for (const sentence of plain(statement).split(/[.!?;:]+/)) {
    for (const m of sentence.matchAll(WITHOUT)) if (!LIMIT.test(sentence.slice(0, m.index))) return true;
    const s = sentence.replace(WITHOUT, ' ');
    if (/\bno\s+(?:\w+\s+)?consent/.test(s)) return true;                                   // "give no consent"
    if (/(?:\bnot\b|\bnever\b|\bno longer\b|n't\b)\s+(?:\w+\s+){0,3}consent/.test(s)) return true; // "do not (give my) consent", "don't consent", "never consented"
    for (const m of s.matchAll(/\b(?:withh[eo]ld\w*|revok\w*|rescind\w*|retract\w*|withdr[ae]w\w*|refus\w*|declin\w*|den(?:y|ies|ied|ying))\s+(?:\w+\s+){0,3}consent/g)) if (!RIGHT.test(s.slice(0, m.index))) return true;
    for (const m of s.matchAll(/\bconsent\s+(?:\w+\s+){0,3}(?:withheld|revoked|rescinded|retracted|withdrawn|refused|declined|denied)\b/g)) if (!/\b(?:can|may|could|might)\b/.test(m[0])) return true;
  }
  return false;
}

function realInside(file, root) {
  let real;
  try { real = realpathSync(file); } catch { return null; }
  return real === root || real.startsWith(root + sep) ? real : null;
}

// Length of an audio file with ffprobe, or an error. Needs ffmpeg (the plugin needs it anyway).
function audioSeconds(file) {
  const ffprobe = findBinary('ffprobe');
  if (!ffprobe) return { error: 'cannot be checked: ffprobe was not found (install ffmpeg: on Windows "winget install --id Gyan.FFmpeg -e")' };
  const r = spawnSync(ffprobe.path, ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=codec_type:format=duration', '-of', 'json', file], { encoding: 'utf8', windowsHide: true, timeout: 30000 });
  try {
    const j = JSON.parse(r.stdout || '{}');
    if (!j.streams || !j.streams.length) return { error: 'has no audio in it' };
    const d = Number(j.format && j.format.duration);
    return Number.isFinite(d) ? { seconds: d } : { error: 'has no readable length' };
  } catch { return { error: 'could not be read as audio' }; }
}
// Loudness with ffmpeg volumedetect (mean and peak, dBFS), or an error: no ffmpeg means no clone.
function audioLevels(file) {
  const ffmpeg = findBinary('ffmpeg');
  if (!ffmpeg) return { error: 'cannot be checked for sound: ffmpeg was not found (install it: on Windows "winget install --id Gyan.FFmpeg -e")' };
  const r = spawnSync(ffmpeg.path, ['-hide_banner', '-nostats', '-i', file, '-map', '0:a:0', '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8', windowsHide: true, timeout: 60000 });
  const db = (name) => { const m = new RegExp(`${name}:\\s*(-?[\\d.]+|-inf)\\s*dB`).exec(r.stderr || ''); return m ? (m[1] === '-inf' ? -Infinity : Number(m[1])) : NaN; };
  const mean = db('mean_volume'), peak = db('max_volume');
  return r.status === 0 && !Number.isNaN(mean) && !Number.isNaN(peak) ? { mean, peak } : { error: 'could not be measured for loudness' };
}
// An audio file that is a real, audible recording: audio in it, a length, not near-silent.
function soundCheck(file, name, minSeconds) {
  const len = audioSeconds(file);
  if (len.error) return `${name} ${len.error}`;
  if (minSeconds && len.seconds < minSeconds) return `${name} is ${len.seconds.toFixed(1)} s long`;
  const lv = audioLevels(file);
  if (lv.error) return `${name} ${lv.error}`;
  if (lv.mean < SILENT_MEAN_DB || lv.peak < SILENT_PEAK_DB) return `${name} is near-silent (mean ${lv.mean.toFixed(1)} dB, peak ${lv.peak.toFixed(1)} dB): it must be the speaker's voice`;
  return null;
}

function validDate(d, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const t = new Date(`${d}T00:00:00Z`);
  if (Number.isNaN(t.getTime()) || t.toISOString().slice(0, 10) !== d) return false; // 2026-02-31 etc.
  return t.getTime() <= now.getTime() + 36 * 3600 * 1000; // not in the future (a day of timezone slack)
}

// consentFile, the recording named in it and the samples are all names in the job folder (as in
// consent_template): relative names are read from the job folder, absolute ones must point into it.
export function checkConsent(args, jobOut, { now = new Date(), env = process.env, cwd = process.cwd() } = {}) {
  const fail = (reason) => ({ ok: false, reason, fix: `Ask the voice owner for consent in their own words and a recording of them reading it. Save it as consent.json in ${jobOut} with: ${JSON.stringify(CONSENT_TEMPLATE)}, with the recording and the voice samples in the same folder (names relative to it). Easel will not clone a voice without it. These checks are a procedure the user must honour, not proof: the recording must be the voice owner themselves.` });
  if (!args.voiceName || !String(args.voiceName).trim()) return fail('voiceName is required to clone a voice');
  if (!args.samples || !args.samples.length) return fail('samples (recordings of the voice) are required');
  if (!args.consentFile) return fail('no consent statement: consentFile is required for voice cloning');
  if (!existsSync(jobOut)) return fail(`the job folder ${jobOut} does not exist yet`);
  const root = realpathSync(jobOut), inJob = (p) => resolve(jobOut, String(p).trim());
  const cfPath = inJob(args.consentFile);
  if (!existsSync(cfPath)) return fail(`the consent file ${args.consentFile} is not in the job folder (${jobOut}); give its name relative to the job folder, e.g. consent.json`);
  const file = realInside(cfPath, root);
  if (!file) return fail('the consent file must be inside this job folder (easel-out/<slug>/)');
  let c;
  try { c = JSON.parse(readFileSync(file, 'utf8')); } catch { return fail('the consent file is not valid JSON'); }
  const missing = ['speaker', 'statement', 'purpose', 'date', 'recording'].filter((k) => typeof c[k] !== 'string' || !c[k].trim() || c[k] === CONSENT_TEMPLATE[k]);
  if (missing.length) return fail(`the consent statement is missing ${missing.join(', ')}`);
  const speaker = plain(c.speaker), statement = plain(c.statement);
  if (speaker.length < 2 || PLACEHOLDER.test(c.speaker)) return fail('the speaker must be the voice owner\'s name');
  if (PLACEHOLDER.test(c.statement) || PLACEHOLDER.test(c.purpose)) return fail('the statement still has template placeholders in it: the speaker writes it in their own words');
  if (!/\bconsent/.test(statement)) return fail('the statement must say that the speaker consents');
  if (refusesConsent(c.statement)) return fail('the statement does not give consent (it refuses, withholds or takes back consent)');
  const esc = speaker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!new RegExp(`(?:^|[^\\p{L}\\p{N}])${esc}(?:$|[^\\p{L}\\p{N}])`, 'u').test(statement)) return fail('the statement must name the speaker in full, exactly as in "speaker"');
  if (plain(c.purpose).length < 3) return fail('the purpose must say what the voice will be used for');
  if (!validDate(c.date, now)) return fail('the consent date must be a real date (YYYY-MM-DD), not in the future');
  // the server's own output (generated speech, an assembled film) is never evidence: by name in this
  // job folder's records, and by content hash wherever it was copied or renamed
  const known = knownOutputs(jobOut, env, cwd);
  const madeByEasel = (real) => known.names.has(jobName(real, root)) || known.hashes.has(fileSha256(real));
  const recName = c.recording.trim();
  if (!AUDIO.has(extname(recName).toLowerCase())) return fail(`the consent recording must be an audio file (${[...AUDIO].join(', ')})`);
  const recPath = inJob(recName);
  if (!existsSync(recPath)) return fail(`the consent recording ${recName} is not in the job folder`);
  const rec = realInside(recPath, root);
  if (!rec) return fail('the consent recording must be inside this job folder');
  if (rec === file) return fail('the consent recording must be a recording, not the consent file');
  if (!statSync(rec).isFile()) return fail(`the consent recording ${recName} is not a file`);
  if (madeByEasel(rec)) return fail(`the consent recording ${recName} was made by Easel (generated speech or an assembled film): it must be the voice owner recorded reading the statement`);
  if (statSync(rec).size < MIN_AUDIO_BYTES) return fail(`the consent recording ${recName} is empty or too short`);
  const minSeconds = minRecordingSeconds(c.statement);
  const bad = soundCheck(rec, `the consent recording ${recName}`, minSeconds);
  if (bad) return fail(/ s long$/.test(bad) ? `${bad}: reading the statement (${Math.round(statementWords(c.statement))} words) aloud takes at least ${minSeconds.toFixed(1)} s, so it must be the speaker reading all of it` : bad);
  const samples = [];
  for (const s of args.samples) {
    const p = inJob(s), real = existsSync(p) ? realInside(p, root) : null;
    if (!real) return fail(`the voice sample ${s} must be in this job folder, with the consent statement (names relative to the job folder)`);
    if (!statSync(real).isFile()) return fail(`the voice sample ${s} is not a file`);
    if (madeByEasel(real)) return fail(`the voice sample ${s} was made by Easel (generated speech or an assembled film): samples must be recordings of the voice owner`);
    if (!SAMPLE_EXT.includes(extname(real).toLowerCase()) || statSync(real).size < MIN_AUDIO_BYTES) return fail(`the voice sample ${s} is not an audio recording (${SAMPLE_EXT.join(', ')})`);
    const badSample = soundCheck(real, `the voice sample ${s}`);
    if (badSample) return fail(badSample);
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
