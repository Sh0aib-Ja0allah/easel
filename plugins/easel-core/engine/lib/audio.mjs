// Audio helpers: master a WAV to a loudness target (two-pass ffmpeg loudnorm), and write a
// base64 WAV that a page rendered (the animate kit's window.renderAudioWav) to disk.
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { requireBinary } from './binaries.mjs';

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
