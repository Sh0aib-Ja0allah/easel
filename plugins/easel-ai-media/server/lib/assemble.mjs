// assemble: generated clips -> one film. Each clip is scaled to fill the frame, cut or slowed to its
// beat's length (slowed, never frozen), joined; caption or watermark PNGs (rendered by easel-core's
// render_still with transparent: true) are laid over at their times; narration and music are mixed
// with the music ducked under the voice. Everything runs in the user's local ffmpeg.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { requireBinary } from './binaries.mjs';
import { jobDir } from './media.mjs';

const need = (name) => requireBinary(name);

export function duration(file) {
  const r = spawnSync(need('ffprobe'), ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file], { encoding: 'utf8', windowsHide: true });
  const d = Number((r.stdout || '').trim());
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
    filters.push(`[${n}:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,format=rgba[o${k}]`, `[${last}][o${k}]overlay=(W-w)/2:(H-h)/2:enable='between(t,${start},${end})'[vo${k}]`);
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
  mkdirSync(out, { recursive: true });
  const file = join(out, `${String(args.name || 'film').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'film'}.mp4`);
  const r = spawnSync(need('ffmpeg'), ['-y', '-hide_banner', '-loglevel', 'error', ...inputs, '-filter_complex', filters.join(';'), '-map', `[${last}]`, ...audioMap, '-c:v', 'libx264', '-preset', args.preset || 'medium', '-crf', String(args.crf ?? 18), '-pix_fmt', 'yuv420p', '-r', String(fps), '-t', total.toFixed(3), '-movflags', '+faststart', file], { encoding: 'utf8', windowsHide: true, maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`ffmpeg failed: ${(r.stderr || '').trim().slice(-800)}`);
  return { file, seconds: +total.toFixed(3), size: `${W}x${H}`, fps, beats: clips.map((c, i) => ({ i, file: c.file, start: +c.start.toFixed(3), seconds: c.seconds })), ms: Date.now() - t0 };
}
