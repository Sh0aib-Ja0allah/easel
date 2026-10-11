// assemble: generated clips -> one film. Each clip is scaled to fill the frame, cut or slowed to its
// beat's length (slowed, never frozen), joined; caption or watermark PNGs (rendered by easel-core's
// render_still with transparent: true) are laid over at their times; narration and music are mixed
// with the music ducked under the voice. Everything runs in the user's local ffmpeg.
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, rmSync, statSync } from 'node:fs';
import { basename, join, relative, resolve, sep } from 'node:path';
import { requireBinary } from './binaries.mjs';
import { appendAsset, jobDir, readProvenanceFiles } from './media.mjs';
import { recordOutputs, reservePath, sha256 } from './outputs.mjs';

const need = (name) => requireBinary(name);

// Length of a clip's picture (its video stream), not of the container: a clip whose audio runs
// longer must still be slowed to fill its beat, never padded with a frozen last frame.
export function duration(file) {
  const r = spawnSync(need('ffprobe'), ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=duration:format=duration', '-of', 'json', file], { encoding: 'utf8', windowsHide: true });
  let d = NaN;
  try { const j = JSON.parse(r.stdout || '{}'); d = Number((j.streams && j.streams[0] && j.streams[0].duration) || (j.format && j.format.duration)); } catch { /* below */ }
  if (r.status !== 0 || !Number.isFinite(d)) throw new Error(`cannot read the length of ${file}`);
  return d;
}

export function assemble(args) {
  const t0 = Date.now();
  const clips = args.clips || [];
  if (!clips.length) throw new Error('give clips: [{ file, seconds }]');
  const [W, H] = String(args.size || '1080x1920').split('x').map(Number);
  if (!(W > 0 && H > 0) || W % 2 || H % 2) throw new Error('size must be WIDTHxHEIGHT with even numbers, e.g. 1080x1920');
  const fps = args.fps || 30;
  for (const f of [...clips.map((c) => c.file), args.narration, args.music, ...(args.overlays || []).map((o) => o.file)].filter(Boolean)) if (!existsSync(f) || !statSync(f).isFile()) throw new Error(`file not found: ${f}`);
  const inputs = [], filters = [];
  let total = 0;
  clips.forEach((c, i) => {
    const d = duration(c.file), target = c.seconds || d;
    const slow = target > d + 1e-3 ? target / d : 1;   // longer beat than clip: slow it down, don't freeze
    inputs.push('-i', c.file);
    filters.push(`[${i}:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,fps=${fps},setpts=${slow.toFixed(4)}*(PTS-STARTPTS),trim=duration=${target.toFixed(3)},setpts=PTS-STARTPTS,format=yuv420p[v${i}]`);
    c.start = total; total += target;
  });
  filters.push(`${clips.map((_, i) => `[v${i}]`).join('')}concat=n=${clips.length}:v=1:a=0[vc]`);
  let last = 'vc', n = clips.length;
  for (const [k, o] of (args.overlays || []).entries()) {
    inputs.push('-loop', '1', '-t', total.toFixed(3), '-i', o.file);
    const start = o.start || 0, end = o.end === undefined ? total : o.end;
    filters.push(`[${n}:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,format=rgba[o${k}]`, `[${last}][o${k}]overlay=(W-w)/2:(H-h)/2:shortest=1:enable='between(t,${start},${end})'[vo${k}]`);
    last = `vo${k}`; n++;
  }
  let audioMap = [];
  if (args.narration || args.music) {
    const na = args.narration ? n++ : null, mu = args.music ? n++ : null;
    if (args.narration) inputs.push('-i', args.narration);
    if (args.music) inputs.push('-i', args.music);
    const musicDb = args.musicDb ?? -16;
    if (na !== null && mu !== null) filters.push(`[${na}:a]aresample=48000,apad[na]`, '[na]asplit=2[na1][na2]', `[${mu}:a]aresample=48000,volume=${musicDb}dB[mu]`, '[mu][na2]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[duck]', '[na1][duck]amix=inputs=2:normalize=0:duration=first[aout]');
    else if (na !== null) filters.push(`[${na}:a]aresample=48000,apad[aout]`);
    else filters.push(`[${mu}:a]aresample=48000,volume=${musicDb}dB,afade=t=out:st=${Math.max(0, total - 1.5).toFixed(2)}:d=1.5[aout]`);
    audioMap = ['-map', '[aout]', '-c:a', 'aac', '-b:a', '192k'];
  }
  const out = jobDir(args);
  // a name not taken yet (film, film-2, ...), claimed before ffmpeg runs: never an earlier paid file,
  // never one of this film's own inputs (ffmpeg -y only ever replaces the empty file claimed here)
  const ffmpeg = need('ffmpeg');
  const file = reservePath(out, String(args.name || 'film').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'film', '.mp4');
  // -xerror: stop at the first decode error. Without it ffmpeg loops forever on a bad looped overlay,
  // printing an error per frame; on Windows the output buffer then fills, Node kills the package
  // manager's ffmpeg shim, and the real ffmpeg keeps the claimed file open. The timeout is a backstop.
  const r = spawnSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-xerror', ...inputs, '-filter_complex', filters.join(';'), '-map', `[${last}]`, ...audioMap, '-c:v', 'libx264', '-preset', args.preset || 'medium', '-crf', String(args.crf ?? 18), '-pix_fmt', 'yuv420p', '-r', String(fps), '-t', total.toFixed(3), '-movflags', '+faststart', file], { encoding: 'utf8', windowsHide: true, maxBuffer: 1 << 26, timeout: Math.max(300000, Math.ceil(total) * 30000) });
  if (r.status !== 0) {
    const why = `ffmpeg failed: ${(r.stderr || (r.error && r.error.message) || '').trim().slice(-800)}`;
    // Windows may hold the file for a moment after ffmpeg exits: retry, and never let a clean-up
    // error hide the real one
    try { rmSync(file, { force: true, maxRetries: 10, retryDelay: 200 }); } catch (e) { throw new Error(`${why} (the empty ${file} could not be removed: ${e.code || e.message})`); }
    throw new Error(why);
  }
  // the film is the server's own output: recorded by content hash (the consent gate never takes it
  // as a recording) in jobs.jsonl and the outputs ledger
  const hash = sha256(readFileSync(file)), name = relative(out, file).split(sep).join('/');
  recordOutputs([{ sha256: hash }], 'assemble');
  appendFileSync(join(out, 'jobs.jsonl'), JSON.stringify({ at: new Date().toISOString(), provider: 'local', model: 'ffmpeg', kind: 'assemble', status: 'saved', files: [name], sha256: { [name]: hash } }) + '\n');
  // provenance: the film is composited from the clips, captions, narration and music
  const known = new Set(readProvenanceFiles(out));
  const input = (f, generatedKind = 'generated') => { const rel = relative(out, resolve(f)).split(sep).join('/'); return known.has(rel) ? { kind: generatedKind, name: rel, license: 'provider-terms' } : { kind: 'user', name: rel.startsWith('..') ? basename(f) : rel, license: 'user-owned' }; };
  appendAsset(out, { file: name, tool: 'easel-ai-media:ai-video', method: 'composited', inputs: [...clips.map((c) => input(c.file)), ...(args.overlays || []).map((o) => input(o.file)), ...(args.narration ? [input(args.narration)] : []), ...(args.music ? [input(args.music)] : [])], notes: `assembled with the local ffmpeg: ${clips.length} clips, ${(args.overlays || []).length} overlays${args.narration ? ', narration' : ''}${args.music ? ', music' : ''}` });
  return { file, seconds: +total.toFixed(3), size: `${W}x${H}`, fps, beats: clips.map((c, i) => ({ i, file: c.file, start: +c.start.toFixed(3), seconds: c.seconds })), ms: Date.now() - t0 };
}
