// Audio helpers: master a WAV to a loudness target (measured gain and a true-peak limiter), write a base64 WAV
// that a page rendered (the animate kit's window.renderAudioWav) to disk, and mux a track onto an
// existing video (mux_audio: the video stream is copied, never re-encoded). ffmpeg runs without
// blocking the engine and with a timeout; outputs are written to a partial file renamed into place.
import { existsSync, mkdirSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { requireBinary } from './binaries.mjs';
import { commit, partialPath, removeQuietly, run } from './probe.mjs';
import { outputDir } from './render.mjs';

// Per ffmpeg run. Measuring and limiting work at 192 kHz (true peak) and are slow on long tracks: 30
// minutes covers hours of audio on a slow machine; past it ffmpeg is stopped, never left hanging.
const TIMEOUT = 30 * 60 * 1000;
const ffmpeg = (args) => run(requireBinary('ffmpeg'), ['-hide_banner', '-nostdin', ...args], { timeout: TIMEOUT });

// The real path of p (links resolved); for a name that does not exist yet, its folder's real path and the name.
function realPath(p) {
  try { return realpathSync.native(p); } catch { /* not there yet */ }
  try { return join(realpathSync.native(dirname(p)), basename(p)); } catch { return resolve(p); }
}

// True when two paths reach one file: the same real path (compared case-folded on Windows and macOS,
// whose file systems usually ignore case, as embed_fonts does), or, when both exist, the same device
// and inode (a hard link, a short 8.3 name).
export function sameFile(a, b, os = process.platform) {
  const fold = (p) => (os === 'win32' || os === 'darwin' ? p.toLowerCase() : p);
  if (fold(realPath(a)) === fold(realPath(b))) return true;
  try {
    const x = statSync(a, { bigint: true }), y = statSync(b, { bigint: true });
    return x.ino !== 0n && x.dev === y.dev && x.ino === y.ino;
  } catch { return false; }
}

// Integrated loudness and true peak as qa measures them (ffmpeg's ebur128), of the audio after the filter
// chain `chain`; NaN where the audio is silent. -xerror: stop at an error rather than measure past it,
// where the ffmpeg version counts a decoding error as one.
export async function measureLoudness(file, chain = '') {
  const r = await ffmpeg(['-nostats', '-xerror', '-i', file, '-map', '0:a:0', '-af', `${chain ? `${chain},` : ''}ebur128=peak=true:framelog=verbose`, '-f', 'null', '-']);
  const s = (r.stderr || '').slice((r.stderr || '').lastIndexOf('Summary:'));
  if (r.status !== 0 || !/Integrated loudness/.test(s)) throw new Error(`could not measure loudness of ${file}: ${(r.stderr || '').trim().slice(-400)}`);
  const num = (re) => Number((re.exec(s) || [])[1]);
  return { i: num(/I:\s+(-?[\d.]+) LUFS/), tp: num(/Peak:\s+(-?[\d.]+) dBFS/) };
}

// Masters to `target` LUFS integrated with true peaks under `truePeak` dBTP; 48 kHz 16-bit stereo WAV.
// Measured (as stereo, as written), then a plain gain when the peaks allow it, else the gain into a
// 4x-oversampled (true-peak) limiter, measured again to make up the loudness the limiter took. Both
// keep 0.5 dB more headroom (an AAC encode overshoots a little). Not ffmpeg's loudnorm: its dynamic
// mode, which it falls back to whenever a plain gain would clip, misses lines of a few seconds by
// several LU. A silent input is copied through unchanged (there is nothing to master).
export async function masterWav(input, output, { target = -14, truePeak = -1 } = {}) {
  const stereo = 'aformat=channel_layouts=stereo';
  const m = await measureLoudness(input, stereo);
  const silent = !Number.isFinite(m.i) || m.i <= -70 || !Number.isFinite(m.tp);
  let chain = stereo;
  if (!silent) {
    const gain = target - m.i;
    const limited = (g) => `${stereo},volume=${g.toFixed(2)}dB,aresample=192000,alimiter=limit=${(10 ** ((truePeak - 1) / 20)).toFixed(4)}:attack=1:release=60:level=0,aresample=48000`;
    if (m.tp + gain <= truePeak - 0.5) chain = `${stereo},volume=${gain.toFixed(2)}dB`;
    else {
      // Into the limiter loudness grows by less than the gain: step the gain toward the target from the
      // last two measurements (secant), at most three more times and never past 12 dB of make-up.
      const max = gain + 12;
      let prev = { g: gain, i: (await measureLoudness(input, limited(gain))).i };
      let g = Math.min(max, gain + Math.max(0, target - prev.i || 0));
      for (let k = 0; k < 3 && g !== prev.g; k++) {
        const i = (await measureLoudness(input, limited(g))).i;
        if (!Number.isFinite(i) || Math.abs(target - i) <= 0.3 || (g >= max && i < target)) break;
        const slope = Math.max(0.1, (i - prev.i) / (g - prev.g));
        prev = { g, i };
        g = Math.min(max, Math.max(gain, g + (target - i) / slope));
      }
      chain = limited(g);
    }
  }
  const partial = partialPath(output);
  try {
    const r = await ffmpeg(['-y', '-loglevel', 'error', '-i', input, '-map', '0:a:0', '-af', chain, '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', '-f', 'wav', partial]);
    if (r.status !== 0) throw new Error(`ffmpeg mastering failed: ${(r.stderr || '').trim().slice(-400)}`);
  } catch (err) {
    removeQuietly(partial);
    throw err;
  }
  commit(partial, output);
  return { file: output, measured: m, silent };
}

export function writeBase64(file, b64) {
  if (typeof b64 !== 'string' || !b64.length) throw new Error('the page returned no audio');
  const buf = Buffer.from(b64, 'base64');
  if (buf.toString('latin1', 0, 4) !== 'RIFF' || buf.toString('latin1', 8, 12) !== 'WAVE') throw new Error('the page audio is not a WAV file');
  writeFileSync(file, buf);
  return file;
}

const slugOf = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'muxed';

// mux_audio: put an audio file on an existing video. The video stream is copied as it is; the audio
// becomes AAC 192k. master: true, or a lufs target, first masters the track to lufs (default -14).
// Output is <name>.mp4 (default "<video name>-audio") in the job folder; the input video is never overwritten.
export async function muxAudio(args) {
  const t0 = Date.now();
  if (!args.video || !args.audio) throw new Error('Give video (an .mp4, .mov or .webm file) and audio (a .wav, .mp3, .m4a, .flac or .ogg file).');
  if (args.lufs !== undefined && args.master === false) throw new Error('lufs is the target the track is mastered to, and master is false: drop master (lufs alone masters the track) or drop lufs');
  const master = !!args.master || args.lufs !== undefined;
  const target = args.lufs ?? -14;
  const video = resolve(args.video), audio = resolve(args.audio);
  for (const f of [video, audio]) if (!existsSync(f) || !statSync(f).isFile()) throw new Error(`not found: ${f}`);
  const out = outputDir(args);
  mkdirSync(out, { recursive: true });
  const name = slugOf(args.name || `${basename(video, extname(video))}-audio`);
  const file = join(out, `${name}.mp4`);
  // by real path, not by spelling: a link, or another case of the name on Windows and macOS, is the same file
  for (const [f, what] of [[video, 'video'], [audio, 'audio']]) if (sameFile(file, f)) throw new Error(`the output would overwrite the input ${what}; give another name`);
  const partial = partialPath(file);
  let track = audio, mastered = null;
  try {
    if (master) {
      track = partialPath(join(out, `${name}.master.wav`));
      mastered = await masterWav(audio, track, { target });
    }
    const shortest = args.shortest !== false;
    const r = await ffmpeg(['-y', '-loglevel', 'error', '-i', video, ...(args.offset ? ['-itsoffset', String(args.offset)] : []), '-i', track,
      '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', ...(shortest ? ['-shortest'] : []), '-movflags', '+faststart', '-f', 'mp4', partial]);
    if (r.status !== 0) throw new Error(`ffmpeg mux failed: ${(r.stderr || '').trim().slice(-600)}`);
  } catch (err) {
    removeQuietly(partial);
    throw err;
  } finally {
    if (track !== audio) removeQuietly(track);
  }
  commit(partial, file);
  // measure the result, so the caller can tell the user whether the track sits in the delivery range
  let loudness = null;
  try {
    const m = await measureLoudness(file), inRange = m.i >= -16 && m.i <= -12;
    loudness = { lufs: m.i, truePeak: m.tp, inRange, ...(inRange ? {} : { fix: master ? 'outside -16 to -12 LUFS even mastered: the track is mostly short peaks, which the limiter keeps under -1 dBTP; use a fuller track' : 'outside -16 to -12 LUFS: run again with master: true' }) };
  } catch { loudness = null; }
  return { file, video, audio, ...(mastered ? { mastered: { target, measuredBefore: mastered.measured.i } } : {}), shortest: args.shortest !== false, loudness, ms: Date.now() - t0 };
}
