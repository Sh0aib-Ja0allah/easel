// ffprobe wrapper: streams and format of a media file as JSON. run() runs ffmpeg or ffprobe without
// blocking the engine (the MCP server keeps answering other calls) and stops it after a timeout. And
// the partial-file helpers every media and sheet output is written through.
import { spawn, spawnSync } from 'node:child_process';
import { renameSync, rmSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { requireBinary } from './binaries.mjs';

// Windows can hold a file a moment after the process that wrote it exits: retry, and never let the
// cleanup hide the error that caused it.
export function removeQuietly(file) {
  try { rmSync(file, { force: true, maxRetries: 10, retryDelay: 200 }); } catch { /* the real error matters more */ }
}

// A unique hidden name beside `file` that no one takes for finished output (no media extension, so
// ffmpeg is given the format with -f).
export const partialPath = (file) => join(dirname(file), `.${basename(file)}-${process.pid}-${randomBytes(4).toString('hex')}.partial`);

// Moves a finished partial into place. A rename never leaves a half-written file under the final
// name, and it replaces a link already at that name instead of writing through it.
export function commit(partial, file) {
  try { renameSync(partial, file); } catch (err) {
    removeQuietly(partial);
    throw new Error(`could not write ${file} (${err.code || err.message}); is it open in another program?`);
  }
  return file;
}

export function probe(file) {
  const ffprobe = requireBinary('ffprobe');
  const r = spawnSync(ffprobe, ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', file], { encoding: 'utf8', windowsHide: true, maxBuffer: 1 << 26, timeout: 300000 });
  if (r.status !== 0) throw new Error(`ffprobe failed on ${file}: ${r.error ? r.error.message : r.stderr}`);
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
  const r = spawnSync(ffmpeg, ['-y', '-v', 'error', '-i', file, '-vf', `select=eq(n\\,${index})`, '-frames:v', '1', out], { encoding: 'utf8', windowsHide: true, timeout: 120000 });
  if (r.status !== 0) throw new Error(`frame extract failed: ${r.error ? r.error.message : r.stderr}`);
  return out;
}

// Stops a child process and, on Windows, its whole tree: a package-manager shim (Chocolatey, Scoop)
// runs the real ffmpeg as its own child, which would keep running, and keep writing, after the shim died.
export function killTree(proc) {
  if (process.platform === 'win32' && proc.pid) spawnSync('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore', timeout: 10000 });
  try { proc.kill('SIGKILL'); } catch { /* already gone */ }
}

// Runs cmd asynchronously: resolves { status, stdout, stderr } (stdout a Buffer with binary: true), and
// rejects when it cannot start or runs past timeout ms (it is then stopped; a hung ffmpeg never holds a call).
export function run(cmd, args, { timeout = 600000, binary = false } = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    const out = [], err = [];
    let over = false;
    proc.stdout.on('data', (d) => out.push(d));
    proc.stderr.on('data', (d) => err.push(d));
    const timer = setTimeout(() => {
      over = true;
      killTree(proc);
      reject(new Error(`${basename(cmd)} did not finish within ${timeout / 1000} s and was stopped: ${Buffer.concat(err).toString('utf8').trim().slice(-300)}`));
    }, timeout);
    proc.on('error', (e) => { clearTimeout(timer); if (!over) reject(e); });
    proc.on('close', (status) => {
      clearTimeout(timer);
      if (over) return;
      const stdout = Buffer.concat(out);
      resolve({ status, stdout: binary ? stdout : stdout.toString('utf8'), stderr: Buffer.concat(err).toString('utf8') });
    });
  });
}

// Duration of a media file and whether it has a picture, quickly (no frame count). Cover art in an
// audio file is not a picture to look at.
export async function mediaInfo(file) {
  const r = await run(requireBinary('ffprobe'), ['-v', 'error', '-show_entries', 'stream=codec_type:stream_disposition=attached_pic:format=duration', '-of', 'json', file], { timeout: 60000 });
  if (r.status !== 0) throw new Error(`ffprobe could not read ${file}: ${r.stderr.trim().slice(-400)}`);
  const j = JSON.parse(r.stdout);
  return { duration: Number(j.format && j.format.duration), video: (j.streams || []).some((s) => s.codec_type === 'video' && !(s.disposition && s.disposition.attached_pic)) };
}
