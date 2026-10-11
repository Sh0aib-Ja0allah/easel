// The voice-clone consent gate (HANDOFF §5, architecture §6): a voice is cloned only with a recorded
// consent statement from the voice owner, kept in the job folder, and every clone is logged there.
import { appendFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

export const CONSENT_TEMPLATE = {
  speaker: 'Full name of the person whose voice this is',
  statement: 'I, <full name>, consent to my voice being cloned for <purpose>, by <who>, for use in <where>. I can withdraw this consent at any time.',
  purpose: 'What the cloned voice will say and where it will be used',
  date: 'YYYY-MM-DD',
  recording: 'consent.wav (the speaker reading the statement aloud), in this job folder',
  samples: ['sample-1.wav', '...'],
};

export function checkConsent(args, jobOut) {
  const fail = (reason) => ({ ok: false, reason, fix: `Ask the voice owner for consent. Save it as consent.json in ${jobOut} with: ${JSON.stringify(CONSENT_TEMPLATE)}. Easel will not clone a voice without it.` });
  if (!args.voiceName) return fail('voiceName is required to clone a voice');
  if (!args.samples || !args.samples.length) return fail('samples (recordings of the voice) are required');
  if (!args.consentFile) return fail('no consent statement: consentFile is required for voice cloning');
  const file = resolve(args.consentFile);
  if (!existsSync(file)) return fail(`the consent file ${file} does not exist`);
  if (!(file + sep).startsWith(resolve(jobOut) + sep) && !file.startsWith(resolve(jobOut) + sep)) return fail('the consent file must be inside this job folder (easel-out/<slug>/)');
  let c;
  try { c = JSON.parse(readFileSync(file, 'utf8')); } catch { return fail('the consent file is not valid JSON'); }
  const missing = ['speaker', 'statement', 'purpose', 'date', 'recording'].filter((k) => typeof c[k] !== 'string' || !c[k].trim() || c[k] === CONSENT_TEMPLATE[k]);
  if (missing.length) return fail(`the consent statement is missing ${missing.join(', ')}`);
  if (!/\bconsent\b/i.test(c.statement) || !c.statement.toLowerCase().includes(c.speaker.toLowerCase().split(/\s+/)[0])) return fail('the statement must say in the speaker\'s own words that they consent, and name them');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(c.date)) return fail('the consent date must be YYYY-MM-DD');
  const rec = resolve(jobOut, c.recording.split(' ')[0]);
  if (!rec.startsWith(resolve(jobOut) + sep)) return fail('the consent recording must be inside this job folder');
  if (!existsSync(rec) || !statSync(rec).isFile()) return fail(`the consent recording ${c.recording.split(' ')[0]} is not in the job folder`);
  return { ok: true, speaker: c.speaker, consentFile: file, recording: rec };
}

// Every clone that is actually made is logged next to the consent statement.
export function logConsent(args, jobOut, c, voiceId) {
  mkdirSync(jobOut, { recursive: true });
  appendFileSync(join(jobOut, 'consent-log.jsonl'), JSON.stringify({ at: new Date().toISOString(), action: 'voice-clone', voiceName: args.voiceName, voiceId: voiceId || null, speaker: c.speaker, consentFile: relative(jobOut, c.consentFile).split(sep).join('/'), recording: relative(jobOut, c.recording).split(sep).join('/'), samples: args.samples.map((s) => relative(jobOut, resolve(s)).split(sep).join('/')) }) + '\n');
}
