// T1.4: each qa check has a failing and a passing fixture.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { doctorReport } from '../lib/doctor.mjs';

const ok = (n) => doctorReport().checks.find((c) => c.name === n)?.ok;
const pageSkip = ['playwright-core', 'chromium'].every(ok) ? false : 'needs Chromium (doctor --install)';
const mediaSkip = ok('ffmpeg') ? false : 'needs ffmpeg';
const fx = (f) => fileURLToPath(new URL(`./fixtures/${f}`, import.meta.url));
let out, qa, m;
const lavfi = (name, spec, extra = []) => {
  const f = join(out, name);
  const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', spec, ...extra, f], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return f;
};
before(async () => { out = mkdtempSync(join(tmpdir(), 'easel-qa-')); m = await import('../lib/qa.mjs'); qa = m.qa; });
after(() => rmSync(out, { recursive: true, force: true }));
const check = (r, n) => r.checks.find((c) => c.name === n);

test('text_clipping fails on ellipsis, clipped card and off-frame text', { skip: pageSkip }, async () => {
  const r = await qa({ file: fx('clip-fail.html'), width: 640, height: 360, outDir: out, checks: ['text_clipping'] });
  const c = check(r, 'text_clipping');
  assert.equal(c.pass, false);
  const reasons = c.findings.map((f) => f.reason).join(' | ');
  assert.match(reasons, /ellipsis/);
  assert.match(reasons, /overflows its box|cut off by/);
  assert.match(reasons, /outside the 640x360 frame/);
  assert.equal(r.pass, false);
  assert.deepEqual(r.hardFailures, ['text_clipping']);
});

test('text_clipping passes when everything fits', { skip: pageSkip }, async () => {
  const r = await qa({ file: fx('clip-pass.html'), width: 640, height: 360, outDir: out, checks: ['text_clipping'] });
  assert.equal(check(r, 'text_clipping').pass, true, JSON.stringify(check(r, 'text_clipping').findings));
});

test('contrast fails on grey-on-white and on a pale gradient (sampled)', { skip: pageSkip }, async () => {
  const r = await qa({ file: fx('contrast-fail.html'), width: 640, height: 360, outDir: out, checks: ['contrast'], mode: 'ui' });
  const c = check(r, 'contrast');
  assert.equal(c.pass, false);
  assert.equal(c.hard, true);
  const els = c.findings.map((f) => f.element).join(' | ');
  assert.match(els, /faint/);
  assert.match(els, /hero/);
  assert.doesNotMatch(els, /\.ok/);
  const faint = c.findings.find((f) => /faint/.test(f.element));
  assert.ok(Math.abs(faint.ratio - 2.32) < 0.05, `#aaa on #fff is 2.32:1, got ${faint.ratio}`);
  // Measured against the real pixels behind it: the background is the pale gradient, not white.
  const hero = c.findings.find((f) => /hero/.test(f.element));
  assert.ok(hero.bg[2] > hero.bg[1], `gradient background sampled: ${hero.bg}`);
});

test('contrast passes (incl. large text at 3:1 and light-on-dark gradient)', { skip: pageSkip }, async () => {
  const r = await qa({ file: fx('contrast-pass.html'), width: 640, height: 360, outDir: out, checks: ['contrast'], mode: 'ui' });
  assert.equal(check(r, 'contrast').pass, true, JSON.stringify(check(r, 'contrast').findings));
});

test('contrast is advisory outside ui mode', { skip: pageSkip }, async () => {
  const r = await qa({ file: fx('contrast-fail.html'), width: 640, height: 360, outDir: out, checks: ['contrast'] });
  assert.equal(check(r, 'contrast').hard, false);
  assert.equal(r.pass, true);
});

test('stillness fails on a still video and passes on a moving one', { skip: mediaSkip }, () => {
  const still = lavfi('still.mp4', 'color=c=0x336699:s=320x180:d=4:r=30', ['-pix_fmt', 'yuv420p']);
  const moving = lavfi('moving.mp4', 'testsrc2=s=320x180:d=4:r=30', ['-pix_fmt', 'yuv420p']);
  const a = m.stillness(still, { seconds: 2 });
  assert.equal(a.pass, false);
  assert.ok(a.findings.length >= 1);
  assert.equal(m.stillness(moving, { seconds: 2 }).pass, true);
});

test('colour_cast fails on a purple video and passes on a warm or mixed one', { skip: mediaSkip }, () => {
  const purple = lavfi('purple.mp4', 'color=c=0x5b3fd6:s=320x180:d=3:r=30,noise=alls=12:allf=t', ['-pix_fmt', 'yuv420p']);
  const warm = lavfi('warm.mp4', 'color=c=0xd9822b:s=320x180:d=3:r=30,noise=alls=12:allf=t', ['-pix_fmt', 'yuv420p']);
  const mixed = lavfi('mixed.mp4', 'testsrc2=s=320x180:d=3:r=30', ['-pix_fmt', 'yuv420p']);
  const p = m.colourCast(purple);
  assert.equal(p.pass, false);
  assert.ok(p.value > 0.9, `purple ratio ${p.value}`);
  assert.equal(m.colourCast(warm).pass, true);
  assert.equal(m.colourCast(mixed).pass, true);
});

test('loudness fails when too quiet and passes at -14 LUFS', { skip: mediaSkip }, () => {
  const quiet = lavfi('quiet.wav', 'sine=frequency=440:duration=6', ['-af', 'volume=-35dB']);
  const normal = lavfi('normal.wav', 'sine=frequency=440:duration=6', ['-af', 'loudnorm=I=-14:TP=-1.5:LRA=7', '-ar', '48000']);
  const q = m.loudness(quiet);
  assert.equal(q.pass, false);
  assert.ok(q.value < -30, `quiet ${q.value}`);
  assert.match(q.findings[0].fix, /dB of gain/);
  const n = m.loudness(normal);
  assert.equal(n.pass, true, `normal ${n.value}`);
});

test('qa on a video runs stillness, colour_cast and loudness together', { skip: mediaSkip }, async () => {
  const v = lavfi('av.mp4', 'testsrc2=s=320x180:d=3:r=30', ['-f', 'lavfi', '-i', 'sine=frequency=330:duration=3', '-af', 'loudnorm=I=-14:TP=-1.5', '-pix_fmt', 'yuv420p', '-shortest']);
  const r = await qa({ video: v });
  assert.deepEqual(r.checks.map((c) => c.name).sort(), ['colour_cast', 'loudness', 'stillness']);
  assert.equal(r.pass, true, JSON.stringify(r.checks));
});

test('fixedFrame: a graphic that grows past its frame fails frame_overflow; a fitting one passes; scrolling pages are unaffected', { skip: pageSkip }, async () => {
  const tall = '<!doctype html><style>html,body{margin:0}div{width:400px;height:900px;background:#fff;font:20px Inter;color:#111}</style><div>Event poster</div>';
  const fit = '<!doctype html><style>html,body{margin:0}div{width:400px;height:600px;background:#fff;font:20px Inter;color:#111}</style><div>Event poster</div>';
  const a = await qa({ html: tall, width: 400, height: 600, fixedFrame: true, checks: ['text_clipping'], outDir: join(out, 'ff1') });
  assert.equal(a.pass, false);
  assert.deepEqual(a.hardFailures, ['frame_overflow']);
  assert.equal(check(a, 'frame_overflow').findings[0].content, '400x900');
  const b = await qa({ html: fit, width: 400, height: 600, fixedFrame: true, checks: ['text_clipping'], outDir: join(out, 'ff2') });
  assert.equal(b.pass, true, JSON.stringify(b.checks));
  const c = await qa({ html: tall, width: 400, height: 600, checks: ['text_clipping'], outDir: join(out, 'ff3') });
  assert.equal(c.pass, true);
  assert.equal(check(c, 'frame_overflow'), undefined);
});
