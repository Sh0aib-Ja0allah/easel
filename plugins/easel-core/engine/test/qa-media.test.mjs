// qa media checks after the second review (EN-12, EN-16): ffmpeg runs without blocking the server, with a
// timeout, and stops on a decode error; a loudness window upside down is refused. Each test failed before its fix.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { doctorReport } from '../lib/doctor.mjs';

const media = doctorReport().checks.find((c) => c.name === 'ffmpeg')?.ok ? false : 'needs ffmpeg';
let out, m;
const ff = (args) => { const r = spawnSync('ffmpeg', ['-y', '-v', 'error', ...args], { encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); };
before(async () => { out = mkdtempSync(join(tmpdir(), 'easel-qa-media-')); m = await import('../lib/qa.mjs'); });
after(() => rmSync(out, { recursive: true, force: true }));

test('qa refuses a loudness window whose minimum is above its maximum', async () => {
  await assert.rejects(m.qa({ audio: join(out, 'missing.wav'), lufsMin: -11, lufsMax: -15 }), /lufsMin -11 is above lufsMax -15/);
  await assert.rejects(m.qa({ audio: join(out, 'missing.wav'), lufsMin: -11 }), /lufsMin -11 is above lufsMax -12/);
  await assert.rejects(m.qa({ audio: join(out, 'missing.wav'), lufsMin: -14, lufsMax: -14.5 }), /above lufsMax/);
});

test('qa media checks run ffmpeg asynchronously: the event loop keeps turning while a long video is decoded', { skip: media }, async () => {
  const v = join(out, 'long.mp4');
  ff(['-f', 'lavfi', '-i', 'testsrc2=s=1280x720:d=20:r=30', '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-preset', 'ultrafast', v]);
  let last = Date.now(), gap = 0;
  const tick = setInterval(() => { const now = Date.now(); gap = Math.max(gap, now - last); last = now; }, 20);
  const t0 = Date.now();
  try {
    const r = await m.qa({ video: v, checks: ['stillness', 'colour_cast'] });
    assert.equal(r.pass, true, JSON.stringify(r.checks));
  } finally { clearInterval(tick); gap = Math.max(gap, Date.now() - last); }
  assert.ok(gap < 1000, `the longest stall was ${gap} ms in a ${Date.now() - t0} ms check`);
});

test('qa stops on a decode error instead of measuring a damaged file, and ffmpeg runs under a timeout', { skip: media }, async () => {
  const v = join(out, 'av.mp4');
  ff(['-f', 'lavfi', '-i', 'testsrc2=s=320x180:d=6:r=30', '-f', 'lavfi', '-i', 'sine=frequency=330:duration=6', '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-preset', 'ultrafast', '-shortest', v]);
  const bytes = readFileSync(v);
  let s = 3;
  for (let k = Math.floor(bytes.length / 3); k < Math.floor(bytes.length / 3) + 40000; k += 7) { s = (s * 1103515245 + 12345) % 2147483648; bytes[k] = s & 255; }
  const bad = join(out, 'damaged.mp4');
  writeFileSync(bad, bytes);
  await assert.rejects(m.qa({ video: bad, checks: ['stillness'] }), /could not decode .*damaged\.mp4/);
  await assert.rejects(m.qa({ video: bad, checks: ['loudness'] }), /could not decode .*damaged\.mp4/);
  assert.throws(() => m.stillness(bad), /could not decode/);
  // the undamaged file still passes
  assert.equal((await m.qa({ video: v, checks: ['stillness', 'loudness'], lufsMin: -18, lufsMax: -10 })).checks.length, 2);
  await assert.rejects(m.runFfmpeg(['-f', 'lavfi', '-i', 'testsrc2=s=320x180:r=30', '-f', 'null', '-'], { timeoutMs: 500 }), /ffmpeg timed out after 0\.5 s/);
});
