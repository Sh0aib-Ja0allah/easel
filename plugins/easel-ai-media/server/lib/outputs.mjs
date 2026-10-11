// What the media server writes, and where it may write and read (Easel's own, MIT).
// - Files inside the project: checked through links (a link in the project that points elsewhere
//   counts as elsewhere), for the job folder and for every file handed to a provider.
// - Output names reserved atomically, so two calls running side by side never write one file.
// - Every output listed by content hash (jobs.jsonl in the job folder, and a ledger outside it), and
//   audio also by the hash of its decoded sound, so the consent gate can tell the server's own output
//   from a real recording, renamed, copied, re-encoded without loss or with bytes added.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, closeSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { findBinary } from './binaries.mjs';

export const sha256 = (data) => createHash('sha256').update(data).digest('hex');
export const fileSha256 = (file) => sha256(readFileSync(file));
const set = (v) => typeof v === 'string' && v.trim() !== '' && !/^\$\{[^}]*\}$/.test(v.trim());
// The plugin's data folder (EASEL_MEDIA_DATA, from ${CLAUDE_PLUGIN_DATA}), or null when it is unset.
export const dataDir = (env = process.env) => (set(env.EASEL_MEDIA_DATA) ? resolve(env.EASEL_MEDIA_DATA.trim()) : null);

// Is p inside root once links are followed? Checks the nearest part of p that exists (p itself
// may not exist yet); a dangling link counts as outside.
export function realInsideRoot(p, root) {
  let realRoot;
  try { realRoot = realpathSync(root); } catch { return false; }
  let q = resolve(p);
  for (;;) {
    let here = true;
    try { lstatSync(q); } catch { here = false; }
    if (here) break;
    const up = dirname(q);
    if (up === q) return false;
    q = up;
  }
  let real;
  try { real = realpathSync(q); } catch { return false; }
  return real === realRoot || real.startsWith(realRoot + sep);
}

// The file types each role may send to a provider (what every adapter's provider accepts).
export const IMAGE_EXT = ['.png', '.jpg', '.jpeg', '.webp'];
export const SAMPLE_EXT = ['.wav', '.mp3', '.m4a', '.ogg', '.flac'];

// Where a PNG, JPEG or WebP image ends, read from its structure (PNG chunks to IEND, JPEG segments
// and scans to EOI, the WebP RIFF chunks), or why it is not one. Whatever follows that end is not
// part of the image and is never sent (a picture with other bytes after it would carry them along).
export function imageEnd(b) {
  if (b.length >= 8 && b.readUInt32BE(0) === 0x89504e47 && b.readUInt32BE(4) === 0x0d0a1a0a) {
    for (let i = 8; i + 12 <= b.length;) {
      const len = b.readUInt32BE(i), type = b.toString('latin1', i + 4, i + 8), next = i + 12 + len;
      if (next > b.length) return { error: `the ${type} chunk is cut off` };
      if (type === 'IEND') return { end: next };
      i = next;
    }
    return { error: 'it has no end (IEND)' };
  }
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    for (let i = 2; i + 2 <= b.length;) {
      if (b[i] !== 0xff) return { error: 'a segment is broken' };
      const marker = b[i + 1];
      if (marker === 0xd9) return { end: i + 2 };
      if (marker === 0xff) { i++; continue; } // fill byte
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
      if (i + 4 > b.length) break;
      const next = i + 2 + b.readUInt16BE(i + 2);
      if (next > b.length) return { error: 'a segment is cut off' };
      i = next;
      // after a scan header, the coded data runs to the next marker that is not a stuffed 0xff00 or a restart
      if (marker === 0xda) while (i + 1 < b.length && !(b[i] === 0xff && b[i + 1] !== 0x00 && !(b[i + 1] >= 0xd0 && b[i + 1] <= 0xd7))) i++;
    }
    return { error: 'it has no end (EOI)' };
  }
  if (b.length >= 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') {
    const end = 8 + b.readUInt32LE(4);
    if (end > b.length) return { error: 'it is shorter than its header says' };
    for (let i = 12; i < end;) {
      if (i + 8 > end) return { error: 'a chunk is cut off' };
      i += 8 + b.readUInt32LE(i + 4) + (b.readUInt32LE(i + 4) & 1);
      if (i > end) return { error: 'a chunk runs past the end' };
    }
    return { end };
  }
  return { error: 'its contents do not match its name' };
}

// A file the user hands in for upload (a reference image): an existing file inside the project
// folder, through any links, not a hard link (which may be a file outside it under a second name),
// with an image extension, and a whole PNG, JPEG or WebP image with nothing after it. Returns its
// real path.
export function projectImage(f, cwd = process.cwd()) {
  const root = realpathSync(cwd), p = resolve(cwd, String(f));
  if (!existsSync(p) || !statSync(p).isFile()) throw new Error(`file not found: ${f}`);
  const real = realpathSync(p);
  if (real !== root && !real.startsWith(root + sep)) throw new Error(`the reference ${f} is outside the project folder (${root}): only files inside it are sent to a provider`);
  if (!IMAGE_EXT.includes(extname(real).toLowerCase())) throw new Error(`the reference ${f} is not an image the providers take (${IMAGE_EXT.join(', ')})`);
  const links = statSync(real).nlink;
  if (links > 1) throw new Error(`the reference ${f} is a hard link (the same file has ${links} names, and another may be outside the project folder): copy the image into the project instead`);
  const bytes = readFileSync(real), r = imageEnd(bytes);
  if (r.error) throw new Error(`the reference ${f} is not a complete PNG, JPEG or WebP image (${r.error})`);
  if (r.end < bytes.length) throw new Error(`the reference ${f} has data after the end of its image (${bytes.length - r.end} bytes): only an image is sent, so save it again as a plain PNG, JPEG or WebP`);
  return real;
}

// A file name that is not taken yet, reserved at once (created empty, exclusively): paid results
// and inputs are never overwritten, even by two calls running side by side. base, base-2, base-3...
export function reservePath(dir, base, ext) {
  mkdirSync(dir, { recursive: true });
  for (let i = 1; ; i++) {
    const p = join(dir, `${base}${i > 1 ? `-${i}` : ''}${ext}`);
    try { closeSync(openSync(p, 'wx')); return p; } catch (e) { if (e.code !== 'EEXIST') throw e; }
  }
}

// The decoded sound of an audio or video file, hashed: ffmpeg decodes the first audio stream to
// 16-bit samples, then 16 kHz mono (both in the filter chain, so a file and its lossless re-encode
// give the same samples), and the near-silence at each end is left out, so a copy re-encoded to WAV,
// remuxed, with bytes appended or digital silence added at the ends gives the same hash. A lossy
// re-encode, a resample or any change to the sound gives another. Null when there is no audio,
// nothing audible, no ffmpeg, or it cannot be decoded within a minute. Bounded: the first 30 min.
const PCM_MAX_SECONDS = 1800, PCM_SILENCE = 32; // |sample| <= 32 of 32767 is below -60 dBFS
const AV_EXT = new Set(['.wav', '.mp3', '.m4a', '.ogg', '.oga', '.flac', '.webm', '.aac', '.opus', '.mp4', '.mov', '.mkv', '.m4v']);
export function pcmSha256(file) {
  const ffmpeg = findBinary('ffmpeg');
  if (!ffmpeg) return null;
  const r = spawnSync(ffmpeg.path, ['-hide_banner', '-nostdin', '-v', 'error', '-xerror', '-i', file, '-map', '0:a:0', '-vn', '-af', 'aformat=sample_fmts=s16,aresample=16000,aformat=sample_fmts=s16:channel_layouts=mono', '-t', String(PCM_MAX_SECONDS), '-f', 's16le', '-'],
    { windowsHide: true, timeout: 60000, maxBuffer: PCM_MAX_SECONDS * 32000 + 65536 });
  if (r.error || r.status !== 0 || !r.stdout) return null;
  const b = r.stdout, n = b.length >> 1;
  let start = 0, end = n;
  while (start < n && Math.abs(b.readInt16LE(start * 2)) <= PCM_SILENCE) start++;
  while (end > start && Math.abs(b.readInt16LE((end - 1) * 2)) <= PCM_SILENCE) end--;
  return end - start >= 1600 ? sha256(b.subarray(start * 2, end * 2)) : null; // less than 0.1 s of sound: none
}

// The outputs ledger: one line per file the server wrote, { at, sha256, kind } and, for sound,
// { pcm } (pcmSha256). In the plugin's data folder (EASEL_MEDIA_DATA, all projects) when it is set,
// else in the project's easel-out/. Both are read, so outputs from before the data folder was set are
// still known. Entries that name their file get the sound hash.
export function ledgerFiles(env = process.env, cwd = process.cwd()) {
  const project = join(resolve(cwd), 'easel-out', '.media-outputs.jsonl');
  return dataDir(env) ? [join(dataDir(env), 'outputs.jsonl'), project] : [project];
}
export function recordOutputs(entries, kind, env = process.env, cwd = process.cwd()) {
  if (!entries.length) return;
  const file = ledgerFiles(env, cwd)[0];
  mkdirSync(dirname(file), { recursive: true });
  const at = new Date().toISOString();
  const pcm = (e) => (e.file && AV_EXT.has(extname(e.file).toLowerCase()) ? pcmSha256(e.file) : null);
  appendFileSync(file, entries.map((e) => { const p = pcm(e); return JSON.stringify({ at, sha256: e.sha256, kind, ...(p ? { pcm: p } : {}) }); }).join('\n') + '\n');
}

const lines = (file) => { try { return readFileSync(file, 'utf8').split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } }); } catch { return []; } };
// Everything the server (or another Easel tool) is recorded as having made: names in this job folder
// (provenance.json assets not supplied by the user, jobs.jsonl saved files) and content hashes
// (jobs.jsonl and the ledger), and sound hashes (the ledger).
export function knownOutputs(jobOut, env = process.env, cwd = process.cwd()) {
  const names = new Set(), hashes = new Set(), pcm = new Set();
  try { for (const a of JSON.parse(readFileSync(join(jobOut, 'provenance.json'), 'utf8')).assets || []) if (a && a.file && a.method !== 'user-supplied') names.add(String(a.file).toLowerCase()); } catch { /* none yet */ }
  for (const j of lines(join(jobOut, 'jobs.jsonl'))) {
    for (const f of [].concat(j.files || [])) names.add(String(f).toLowerCase());
    for (const h of Object.values(j.sha256 || {})) hashes.add(h);
  }
  for (const f of ledgerFiles(env, cwd)) for (const j of lines(f)) { if (j.sha256) hashes.add(j.sha256); if (j.pcm) pcm.add(j.pcm); }
  return { names, hashes, pcm };
}
// The job-folder name of a file (forward slashes, lower case: Windows names are not case sensitive).
export const jobName = (file, root) => relative(root, file).split(sep).join('/').toLowerCase();
