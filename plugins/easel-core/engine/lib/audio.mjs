// Audio helpers: master a WAV to a loudness target (two-pass ffmpeg loudnorm), write a base64 WAV
// that a page rendered (the animate kit's window.renderAudioWav) to disk, and mux a track onto an
// existing video (mux_audio: the video stream is copied, never re-encoded).
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { requireBinary } from './binaries.mjs';
import { outputDir } from './render.mjs';

function ffmpeg(args) {
  const r = spawnSync(requireBinary('ffmpeg'), ['-hide_banner', '-nostdin', ...args], { encoding: 'utf8', windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
  if (r.error) throw r.error;
  return r;
}

// Integrated loudness, true peak and loudness range as ffmpeg's loudnorm measures them.
export function measureLoudness(file) {
  const r = ffmpeg(['-i', file, '-map', '0:a:0', '-af', 'loudnorm=print_format=json', '-f', 'null', '-']);
  const m = (r.stderr || '').match(/\{[^{}]*"input_i"[^{}]*\}/);
  if (r.status !== 0 || !m) throw new Error(`could not measure loudness of ${file}: ${(r.stderr || '').trim().slice(-400)}`);
  const j = JSON.parse(m[0]);
  return { i: Number(j.input_i), tp: Number(j.input_tp), lra: Number(j.input_lra), thresh: Number(j.input_thresh), offset: Number(j.target_offset) };
}

// Two-pass loudnorm to `target` LUFS integrated with a true-peak ceiling; 48 kHz 16-bit stereo WAV.
// A silent input is copied through unchanged (there is nothing to normalise).
export function masterWav(input, output, { target = -14, truePeak = -1.5, lra = 11 } = {}) {
  const m = measureLoudness(input);
  if (!Number.isFinite(m.i) || m.i <= -70) {
    const r = ffmpeg(['-y', '-loglevel', 'error', '-i', input, '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', output]);
    if (r.status !== 0) throw new Error(`ffmpeg failed: ${(r.stderr || '').trim().slice(-400)}`);
    return { file: output, measured: m, silent: true };
  }
  const af = `loudnorm=I=${target}:TP=${truePeak}:LRA=${lra}:measured_I=${m.i}:measured_TP=${m.tp}:measured_LRA=${m.lra}:measured_thresh=${m.thresh}:offset=${m.offset}:linear=true`;
  const r = ffmpeg(['-y', '-loglevel', 'error', '-i', input, '-af', af, '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', output]);
  if (r.status !== 0) throw new Error(`ffmpeg loudnorm failed: ${(r.stderr || '').trim().slice(-400)}`);
  return { file: output, measured: m, silent: false };
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
// becomes AAC 192k. Optional master: true first masters the track to `lufs` (default -14). Output is
// <name>.mp4 (default "<video name>-audio") in the job folder; the input video is never overwritten.
export function muxAudio(args) {
  const t0 = Date.now();
  if (!args.video || !args.audio) throw new Error('Give video (an .mp4, .mov or .webm file) and audio (a .wav, .mp3, .m4a, .flac or .ogg file).');
  const video = resolve(args.video), audio = resolve(args.audio);
  for (const f of [video, audio]) if (!existsSync(f) || !statSync(f).isFile()) throw new Error(`not found: ${f}`);
  const out = outputDir(args);
  mkdirSync(out, { recursive: true });
  const name = slugOf(args.name || `${basename(video, extname(video))}-audio`);
  const file = join(out, `${name}.mp4`);
  if (resolve(file) === video) throw new Error('the output would overwrite the input video; give another name');
  let track = audio, mastered = null;
  if (args.master) {
    track = join(out, `${name}.master.wav`);
    mastered = masterWav(audio, track, { target: args.lufs ?? -14 });
  }
  const shortest = args.shortest !== false;
  const r = ffmpeg(['-y', '-loglevel', 'error', '-i', video, ...(args.offset ? ['-itsoffset', String(args.offset)] : []), '-i', track,
    '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', ...(shortest ? ['-shortest'] : []), '-movflags', '+faststart', file]);
  if (args.master) rmSync(track, { force: true });
  if (r.status !== 0) throw new Error(`ffmpeg mux failed: ${(r.stderr || '').trim().slice(-600)}`);
  return { file, video, audio, ...(mastered ? { mastered: { target: args.lufs ?? -14, measuredBefore: mastered.measured.i } } : {}), shortest, ms: Date.now() - t0 };
}
