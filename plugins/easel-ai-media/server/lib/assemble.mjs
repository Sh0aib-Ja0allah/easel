// assemble: generated clips -> one film. Each clip is scaled to fill the frame, cut or slowed to its
// beat's length (slowed, never frozen), joined; caption or watermark PNGs (rendered by easel-core's
// render_still with transparent: true) are laid over at their times; narration (one file, or lines
// placed at clips or times) and music are mixed with the music ducked under the voice, and the mix is
// mastered to a loudness target (measured, then a gain and a true-peak limiter where the peaks need
// it). Everything runs in the user's local ffmpeg.
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

// Narration: one file for the whole film (from 0 s), or lines each placed at the start of a clip
// ({ file, clip }, clips numbered from 0) or at a time ({ file, start }, seconds into the film).
function narrationLines(narration, clips, total) {
  if (!narration) return [];
  if (typeof narration === 'string') return [{ file: narration, start: 0, seconds: duration(narration) }];
  return narration.map((l, i) => {
    if ((l.clip === undefined) === (l.start === undefined)) throw new Error(`narration[${i}] needs one of clip or start: clip is the clip it starts with (numbered from 0), start is seconds into the film`);
    if (l.clip !== undefined && !clips[l.clip]) throw new Error(`narration[${i}]: there is no clip ${l.clip} (the clips are numbered 0 to ${clips.length - 1})`);
    const start = l.clip !== undefined ? clips[l.clip].start : l.start;
    if (start >= total - 1e-3) throw new Error(`narration[${i}] starts at ${start} s, after the film ends (${+total.toFixed(3)} s)`);
    return { file: l.file, start, seconds: duration(l.file) };
  });
}

// The mix, from inputs numbered from `first`: the narration lines delayed to their starts and summed,
// padded and cut to the film's length, with the music ducked under them (sidechain on the voice).
function audioGraph(lines, music, musicDb, total, first) {
  const inputs = [], filters = [], T = total.toFixed(3), fmt = 'aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo';
  let k = first;
  lines.forEach((l, i) => { const ms = Math.round(l.start * 1000); inputs.push('-i', l.file); filters.push(`[${k++}:a]${fmt}${ms ? `,adelay=${ms}|${ms}` : ''}[n${i}]`); });
  if (lines.length) filters.push(`${lines.map((_, i) => `[n${i}]`).join('')}${lines.length > 1 ? `amix=inputs=${lines.length}:normalize=0:duration=longest,` : ''}apad,atrim=end=${T}[na]`);
  if (music) { inputs.push('-i', music); filters.push(`[${k}:a]${fmt},volume=${musicDb}dB,atrim=end=${T}[mu]`); }
  if (lines.length && music) filters.push('[na]asplit=2[na1][na2]', '[mu][na2]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[duck]', '[na1][duck]amix=inputs=2:normalize=0:duration=first[mix]');
  else if (lines.length) filters.push('[na]anull[mix]');
  else filters.push(`[mu]afade=t=out:st=${Math.max(0, total - 1.5).toFixed(2)}:d=1.5[mix]`);
  return { inputs, filters };
}

// Integrated loudness and true peak from ffmpeg's ebur128 summary (the filter easel-core's qa
// measures with); NaN where the audio is silent
function ebur128(ffmpeg, args, timeout) {
  const r = spawnSync(ffmpeg, ['-hide_banner', '-nostats', '-xerror', ...args, '-f', 'null', '-'], { encoding: 'utf8', windowsHide: true, maxBuffer: 1 << 26, timeout });
  const s = (r.stderr || '').slice((r.stderr || '').lastIndexOf('Summary:'));
  if (r.status !== 0 || !/Integrated loudness/.test(s)) throw new Error(`ffmpeg failed while measuring loudness: ${(r.stderr || (r.error && r.error.message) || '').trim().slice(-800)}`);
  const num = (re) => Number((re.exec(s) || [])[1]);
  return { i: num(/I:\s+(-?[\d.]+) LUFS/), tp: num(/Peak:\s+(-?[\d.]+) dBFS/) };
}

// The mix, after the filter chain `chain` (or as it is), measured as qa measures it
const measureMix = (ffmpeg, graph, chain, timeout) => ebur128(ffmpeg, [...graph.inputs, '-filter_complex', [...graph.filters, `[mix]${chain ? `${chain},` : ''}ebur128=peak=true:framelog=verbose[m]`].join(';'), '-map', '[m]'], timeout);

// Mastering to `target` LUFS with true peaks under -1 dBTP in the film, from measurements of the mix:
// a plain gain when the peaks allow it, else the gain into a 4x-oversampled (true-peak) limiter,
// measured once more to make up the loudness the limiter took. Both keep 0.5 dB more for the AAC
// encoder's overshoot. Not ffmpeg's loudnorm: its dynamic mode misses mixes of a few seconds by
// several LU. A silent mix is left as it is.
function masterChain(ffmpeg, graph, target, timeout) {
  const m = measureMix(ffmpeg, graph, '', timeout);
  if (!Number.isFinite(m.i) || m.i <= -70 || !Number.isFinite(m.tp)) return 'anull';
  const gain = target - m.i;
  if (m.tp + gain <= -1.5) return `volume=${gain.toFixed(2)}dB`;
  const limited = (g) => `volume=${g.toFixed(2)}dB,aresample=192000,alimiter=limit=${(10 ** (-2 / 20)).toFixed(4)}:attack=1:release=60:level=0,aresample=48000`;
  const took = target - measureMix(ffmpeg, graph, limited(gain), timeout).i;
  return limited(gain + Math.min(12, Math.max(0, took || 0)));
}

export function assemble(args) {
  const t0 = Date.now();
  const clips = args.clips || [];
  if (!clips.length) throw new Error('give clips: [{ file, seconds }]');
  const [W, H] = String(args.size || '1080x1920').split('x').map(Number);
  if (!(W > 0 && H > 0) || W % 2 || H % 2) throw new Error('size must be WIDTHxHEIGHT with even numbers, e.g. 1080x1920');
  const fps = args.fps || 30;
  const narrationFiles = typeof args.narration === 'string' ? [args.narration] : (args.narration || []).map((l) => l.file);
  for (const f of [...clips.map((c) => c.file), ...narrationFiles, args.music, ...(args.overlays || []).map((o) => o.file)].filter(Boolean)) if (!existsSync(f) || !statSync(f).isFile()) throw new Error(`file not found: ${f}`);
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
  const lines = narrationLines(args.narration, clips, total), warnings = [];
  // lines that run into the next one (two voices at once) or past the film's end (cut there)
  [...lines].sort((x, y) => x.start - y.start).forEach((l, i, all) => {
    const end = l.start + l.seconds, next = all[i + 1];
    if (next && end > next.start + 0.05) warnings.push(`narration ${basename(l.file)} (${l.seconds.toFixed(2)} s from ${+l.start.toFixed(3)} s) overlaps the next line by ${(end - next.start).toFixed(2)} s, so both play at once: start the next line later or lengthen the clips`);
    else if (!next && end > total + 0.05) warnings.push(`narration ${basename(l.file)} runs ${(end - total).toFixed(2)} s past the end of the film and is cut there`);
  });
  const out = jobDir(args);
  const ffmpeg = need('ffmpeg'), timeout = Math.max(300000, Math.ceil(total) * 30000);
  const target = args.lufs ?? -14;
  let audioMap = [], mastered = false;
  if (lines.length || args.music) {
    // master the mix, so the film lands at the target whatever the narration's own level (the
    // measuring passes read the audio alone, so their inputs are numbered from 0)
    const graph = (first) => audioGraph(lines, args.music, args.musicDb ?? -16, total, first);
    const master = masterChain(ffmpeg, graph(0), target, timeout), g = graph(n);
    inputs.push(...g.inputs);
    filters.push(...g.filters, `[mix]${master}[aout]`);
    audioMap = ['-map', '[aout]', '-c:a', 'aac', '-b:a', '192k'];
    mastered = true;
  }
  // a name not taken yet (film, film-2, ...), claimed before ffmpeg runs: never an earlier paid file,
  // never one of this film's own inputs (ffmpeg -y only ever replaces the empty file claimed here)
  const file = reservePath(out, String(args.name || 'film').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'film', '.mp4');
  // -xerror: stop at the first decode error. Without it ffmpeg loops forever on a bad looped overlay,
  // printing an error per frame; on Windows the output buffer then fills, Node kills the package
  // manager's ffmpeg shim, and the real ffmpeg keeps the claimed file open. The timeout is a backstop.
  const r = spawnSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-xerror', ...inputs, '-filter_complex', filters.join(';'), '-map', `[${last}]`, ...audioMap, '-c:v', 'libx264', '-preset', args.preset || 'medium', '-crf', String(args.crf ?? 18), '-pix_fmt', 'yuv420p', '-r', String(fps), '-t', total.toFixed(3), '-movflags', '+faststart', file], { encoding: 'utf8', windowsHide: true, maxBuffer: 1 << 26, timeout });
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
  let loudness;
  if (mastered) { try { const f = ebur128(ffmpeg, ['-i', file, '-map', '0:a:0', '-af', 'ebur128=peak=true:framelog=verbose'], timeout); loudness = { target, lufs: Number.isFinite(f.i) ? f.i : null, truePeak: Number.isFinite(f.tp) ? f.tp : null }; } catch { loudness = { target, lufs: null, truePeak: null }; } }
  recordOutputs([{ sha256: hash, file }], 'assemble');
  appendFileSync(join(out, 'jobs.jsonl'), JSON.stringify({ at: new Date().toISOString(), provider: 'local', model: 'ffmpeg', kind: 'assemble', status: 'saved', files: [name], sha256: { [name]: hash } }) + '\n');
  // provenance: the film is composited from the clips, captions, narration and music
  const known = new Set(readProvenanceFiles(out));
  const input = (f, generatedKind = 'generated') => { const rel = relative(out, resolve(f)).split(sep).join('/'); return known.has(rel) ? { kind: generatedKind, name: rel, license: 'provider-terms' } : { kind: 'user', name: rel.startsWith('..') ? basename(f) : rel, license: 'user-owned' }; };
  appendAsset(out, { file: name, tool: 'easel-ai-media:ai-video', method: 'composited', inputs: [...clips.map((c) => input(c.file)), ...(args.overlays || []).map((o) => input(o.file)), ...lines.map((l) => input(l.file)), ...(args.music ? [input(args.music)] : [])], notes: `assembled with the local ffmpeg: ${clips.length} clips, ${(args.overlays || []).length} overlays${lines.length ? `, narration (${lines.length} ${lines.length > 1 ? 'lines' : 'file'})` : ''}${args.music ? ', music' : ''}${mastered ? `, mastered to ${target} LUFS` : ''}` });
  return { file, seconds: +total.toFixed(3), size: `${W}x${H}`, fps, beats: clips.map((c, i) => ({ i, file: c.file, start: +c.start.toFixed(3), seconds: c.seconds })),
    ...(lines.length ? { narration: lines.map((l) => ({ file: l.file, start: +l.start.toFixed(3), seconds: +l.seconds.toFixed(3) })) } : {}),
    ...(loudness ? { loudness } : {}), ...(warnings.length ? { warnings } : {}), ms: Date.now() - t0 };
}
