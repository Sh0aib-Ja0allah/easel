// What the media server writes, and where it may write and read (Easel's own, MIT).
// - Files inside the project: checked through links (a link in the project that points elsewhere
//   counts as elsewhere), for the job folder and for every file handed to a provider.
// - Output names reserved atomically, so two calls running side by side never write one file.
// - Every output listed by content hash (jobs.jsonl in the job folder, and a ledger outside it), so
//   the consent gate can tell the server's own output from a real recording, renamed or copied.
import { createHash } from 'node:crypto';
import { appendFileSync, closeSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, readSync, realpathSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';

export const sha256 = (data) => createHash('sha256').update(data).digest('hex');
export const fileSha256 = (file) => sha256(readFileSync(file));
const set = (v) => typeof v === 'string' && v.trim() !== '' && !/^\$\{[^}]*\}$/.test(v.trim());

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

// The file types each role may send to a provider (what every adapter's provider accepts), and
// their first bytes, so a renamed file of another kind is not sent either.
export const IMAGE_EXT = ['.png', '.jpg', '.jpeg', '.webp'];
export const SAMPLE_EXT = ['.wav', '.mp3', '.m4a', '.ogg', '.flac'];
const IMAGE_MAGIC = (b) => (b.length >= 12 && ((b[0] === 0x89 && b.toString('latin1', 1, 4) === 'PNG') || (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) || (b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP')));

// A file the user hands in for upload (a reference image): an existing file inside the project
// folder, through any links, with an image extension and image bytes. Returns its real path.
export function projectImage(f, cwd = process.cwd()) {
  const root = realpathSync(cwd), p = resolve(cwd, String(f));
  if (!existsSync(p) || !statSync(p).isFile()) throw new Error(`file not found: ${f}`);
  const real = realpathSync(p);
  if (real !== root && !real.startsWith(root + sep)) throw new Error(`the reference ${f} is outside the project folder (${root}): only files inside it are sent to a provider`);
  if (!IMAGE_EXT.includes(extname(real).toLowerCase())) throw new Error(`the reference ${f} is not an image the providers take (${IMAGE_EXT.join(', ')})`);
  if (!IMAGE_MAGIC(head(real, 12))) throw new Error(`the reference ${f} is not a PNG, JPEG or WebP image (its contents do not match its name)`);
  return real;
}
function head(file, n) {
  const fd = openSync(file, 'r'), buf = Buffer.alloc(n);
  try { return buf.subarray(0, readSync(fd, buf, 0, n, 0)); } finally { closeSync(fd); }
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

// The outputs ledger: one line per file the server wrote, { at, sha256, kind }. In the plugin's data
// folder (EASEL_MEDIA_DATA, all projects) when it is set, else in the project's easel-out/. Both are
// read, so outputs from before the data folder was set are still known.
export function ledgerFiles(env = process.env, cwd = process.cwd()) {
  const project = join(resolve(cwd), 'easel-out', '.media-outputs.jsonl');
  return set(env.EASEL_MEDIA_DATA) ? [join(resolve(env.EASEL_MEDIA_DATA.trim()), 'outputs.jsonl'), project] : [project];
}
export function recordOutputs(entries, kind, env = process.env, cwd = process.cwd()) {
  if (!entries.length) return;
  const file = ledgerFiles(env, cwd)[0];
  mkdirSync(dirname(file), { recursive: true });
  const at = new Date().toISOString();
  appendFileSync(file, entries.map((e) => JSON.stringify({ at, sha256: e.sha256, kind })).join('\n') + '\n');
}

const lines = (file) => { try { return readFileSync(file, 'utf8').split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } }); } catch { return []; } };
// Everything the server (or another Easel tool) is recorded as having made: names in this job folder
// (provenance.json assets not supplied by the user, jobs.jsonl saved files) and content hashes
// (jobs.jsonl and the ledger).
export function knownOutputs(jobOut, env = process.env, cwd = process.cwd()) {
  const names = new Set(), hashes = new Set();
  try { for (const a of JSON.parse(readFileSync(join(jobOut, 'provenance.json'), 'utf8')).assets || []) if (a && a.file && a.method !== 'user-supplied') names.add(String(a.file).toLowerCase()); } catch { /* none yet */ }
  for (const j of lines(join(jobOut, 'jobs.jsonl'))) {
    for (const f of [].concat(j.files || [])) names.add(String(f).toLowerCase());
    for (const h of Object.values(j.sha256 || {})) hashes.add(h);
  }
  for (const f of ledgerFiles(env, cwd)) for (const j of lines(f)) if (j.sha256) hashes.add(j.sha256);
  return { names, hashes };
}
// The job-folder name of a file (forward slashes, lower case: Windows names are not case sensitive).
export const jobName = (file, root) => relative(root, file).split(sep).join('/').toLowerCase();
