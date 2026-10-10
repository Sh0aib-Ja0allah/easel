// ffprobe wrapper: streams and format of a media file as JSON.
import { spawnSync } from 'node:child_process';
import { requireBinary } from './binaries.mjs';

export function probe(file) {
  const ffprobe = requireBinary('ffprobe');
  const r = spawnSync(ffprobe, ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', file], { encoding: 'utf8', windowsHide: true, maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`ffprobe failed on ${file}: ${r.stderr}`);
  const j = JSON.parse(r.stdout);
  const v = j.streams.find((s) => s.codec_type === 'video');
  const a = j.streams.find((s) => s.codec_type === 'audio');
  const rate = (s) => { if (!s) return undefined; const [n, d] = s.split('/').map(Number); return d ? n / d : n; };
  return {
    duration: Number(j.format.duration),
    video: v && { codec: v.codec_name, width: v.width, height: v.height, pixFmt: v.pix_fmt, fps: rate(v.r_frame_rate), frames: Number(v.nb_read_frames || v.nb_frames) },
    audio: a && { codec: a.codec_name, sampleRate: Number(a.sample_rate), channels: a.channels },
  };
}

// Extract one frame (0-based index) as PNG.
export function extractFrame(file, index, out) {
  const ffmpeg = requireBinary('ffmpeg');
  const r = spawnSync(ffmpeg, ['-y', '-v', 'error', '-i', file, '-vf', `select=eq(n\\,${index})`, '-frames:v', '1', out], { encoding: 'utf8', windowsHide: true });
  if (r.status !== 0) throw new Error(`frame extract failed: ${r.stderr}`);
  return out;
}
