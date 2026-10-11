// Regression tests for QA review C-1 (Phase 1). Each one failed, or would have, before its fix.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { doctorReport } from '../lib/doctor.mjs';
import { coerceToSchema } from '../cli.mjs';
import { tools } from '../tools.mjs';
import { stillness, loudness } from '../lib/qa.mjs';

const ok = (n) => doctorReport().checks.find((c) => c.name === n)?.ok;
const page = ['playwright-core', 'chromium'].every(ok) ? false : 'needs Chromium (doctor --install)';
const media = ok('ffmpeg') ? false : 'needs ffmpeg';
const pageAndMedia = page || media;
const fx = (f) => fileURLToPath(new URL(`./fixtures/${f}`, import.meta.url));
let out, m;
const ff = (args) => { const r = spawnSync('ffmpeg', ['-y', '-v', 'error', ...args], { encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); };
before(async () => {
  out = mkdtempSync(join(tmpdir(), 'easel-reg-'));
  m = { ...(await import('../lib/qa.mjs')), ...(await import('../lib/render.mjs')), ...(await import('../lib/contact.mjs')), ...(await import('../lib/image.mjs')), ...(await import('../lib/browser.mjs')), ...(await import('../lib/video.mjs')), ...(await import('../lib/probe.mjs')) };
});
after(() => rmSync(out, { recursive: true, force: true }));

test('#1 #2 #3 contrast uses the real pixels behind text, percentile-based; gradient text is unmeasured', { skip: page }, async () => {
  const r = await m.qa({ file: fx('contrast-layers.html'), width: 360, height: 420, outDir: out, checks: ['contrast'], mode: 'ui' });
  const c = r.checks[0];
  const failed = c.findings.map((f) => f.element).join(' | ');
  assert.doesNotMatch(failed, /Readable on a dark photo/, 'white on a dark image passes');
  assert.match(failed, /Unreadable dark text/, 'dark on a dark image fails');
  assert.match(failed, /half lost on white/, 'text partly over a same-colour area fails');
  assert.doesNotMatch(failed, /Gradient headline/);
  assert.match(JSON.stringify(c.unmeasured || []), /Gradient headline/);
});

test('#11 a scrolling page is not "outside the frame" below the fold', { skip: page }, async () => {
  const r = await m.qa({ file: fx('long-page.html'), width: 640, height: 360, outDir: out, checks: ['text_clipping'] });
  assert.equal(r.checks[0].pass, true, JSON.stringify(r.checks[0].findings));
});

test('#8 qa sees text inside an SVG file, and leaves no wrapper behind', { skip: page }, async () => {
  const r = await m.qa({ file: fx('grey-text.svg'), width: 400, height: 120, outDir: out, checks: ['contrast'], mode: 'ui' });
  assert.equal(r.checks[0].pass, false);
  assert.match(r.checks[0].findings[0].element, /Faint SVG label/);
  assert.deepEqual(readdirSync(fileURLToPath(new URL('./fixtures/', import.meta.url))).filter((f) => f.startsWith('.easel-wrap-grey-text')), []);
});

test('#6 a still is the state at t=0, not wall-clock time', { skip: page }, async () => {
  const a = await m.renderStill({ file: fx('css-anim-still.html'), outDir: out, name: 'anim-a', width: 120, height: 120 });
  await new Promise((res) => setTimeout(res, 700));
  const b = await m.renderStill({ file: fx('css-anim-still.html'), outDir: out, name: 'anim-b', width: 120, height: 120 });
  const browser = await m.openBrowser();
  try {
    assert.equal((await m.compareImages(browser, a.files[0].file, b.files[0].file)).identical, true);
    const px = await m.withPixels(browser, [a.files[0].file], (imgs) => { const i = (60 * imgs[0].width + 60) * 4; return [...imgs[0].data.slice(i, i + 3)]; });
    assert.deepEqual(px, [255, 255, 255], 'box is fully transparent at t=0');
    const c = await m.renderStill({ file: fx('css-anim-still.html'), outDir: out, name: 'anim-c', width: 120, height: 120, t: 2 });
    const px2 = await m.withPixels(browser, [c.files[0].file], (imgs) => { const i = (60 * imgs[0].width + 60) * 4; return [...imgs[0].data.slice(i, i + 3)]; });
    assert.deepEqual(px2, [255, 0, 0], 'box is opaque at t=2');
  } finally { await browser.close(); }
});

test('#14 Date() without new works and both forms follow render time', { skip: page }, async () => {
  const browser = await m.openBrowser();
  try {
    const { page: p, context } = await m.newPage(browser, { width: 50, height: 50 });
    await p.setContent('<p>x</p>');
    const r = await p.evaluate(() => { window.__easelSeek(1.5); return { s: typeof Date(), n: new Date().getTime(), now: Date.now(), inst: new Date() instanceof Date, explicit: new Date(0).getTime() }; });
    assert.equal(r.s, 'string');
    assert.equal(r.n, Date.UTC(2026, 0, 1) + 1500);
    assert.equal(r.now, r.n);
    assert.equal(r.inst, true);
    assert.equal(r.explicit, 0);
    await context.close();
  } finally { await browser.close(); }
});

test('#7 WebSockets are blocked and reported', { skip: page }, async () => {
  const html = '<p id="s">open</p><script>const w = new WebSocket("ws://example.com/socket"); w.onerror = w.onclose = () => { document.getElementById("s").textContent = "closed"; };</script>';
  const browser = await m.openBrowser();
  try {
    const { page: p, context, blocked } = await m.newPage(browser, { width: 50, height: 50 });
    await p.setContent(html);
    await p.waitForFunction(() => document.getElementById('s').textContent === 'closed', null, { timeout: 10000 });
    assert.ok(blocked.some((u) => u.startsWith('ws://example.com')), JSON.stringify(blocked));
    await context.close();
  } finally { await browser.close(); }
});

test('#4 contact_sheet name cannot escape the job folder', { skip: page }, async () => {
  const dir = join(out, 'cs');
  const r = await m.contactSheet({ items: [{ file: fx('mark.svg') }], sizes: [32], outDir: dir, name: '../../../evil' });
  assert.ok(r.sheet.startsWith(dir + sep), r.sheet);
});

test('#5 contact_sheet accepts JPG images without sizes', { skip: pageAndMedia }, async () => {
  const jpg = join(out, 'photo.jpg');
  ff(['-f', 'lavfi', '-i', 'testsrc2=s=320x200:d=1', '-frames:v', '1', jpg]);
  const r = await m.contactSheet({ items: [{ file: jpg, label: 'photo' }], outDir: join(out, 'jpg') });
  assert.equal(r.cells.length, 1);
  assert.ok(existsSync(r.sheet));
});

test('#16 odd sizes are padded to even and reported truthfully', { skip: pageAndMedia }, async () => {
  const v = await m.renderVideo({ file: fx('anim-renderat.html'), outDir: join(out, 'odd'), duration: 0.2, width: 321, height: 181, preset: 'ultrafast' });
  const p = m.probe(v.videos[0].file);
  assert.deepEqual([p.video.width, p.video.height], [322, 182]);
  assert.deepEqual([v.videos[0].width, v.videos[0].height], [322, 182]);
});

test('#7 render_video refuses audio URLs', { skip: media }, async () => {
  await assert.rejects(tools.render_video.run({ file: fx('anim-renderat.html'), audio: 'https://example.com/a.mp3' }), /local file/);
});

test('#10 a grainy still is caught; slow small motion is not', { skip: media }, () => {
  const grain = join(out, 'grain.mp4'), slow = join(out, 'slow.mp4');
  ff(['-f', 'lavfi', '-i', 'color=c=0x336699:s=640x360:d=5:r=30,noise=alls=8:allf=t', '-pix_fmt', 'yuv420p', grain]);
  ff(['-f', 'lavfi', '-i', 'color=c=0xf4efe6:s=640x360:d=5:r=30', '-f', 'lavfi', '-i', 'color=c=0x1d3557:s=30x30:d=5:r=30', '-filter_complex', "[0][1]overlay=x='20+t*15':y=150", '-pix_fmt', 'yuv420p', slow]);
  assert.equal(stillness(grain).pass, false);
  assert.equal(stillness(slow).pass, true, JSON.stringify(stillness(slow).findings));
});

test('#17 a silent track is reported as silent, not as a gain fix', { skip: media }, () => {
  const wav = join(out, 'silence.wav');
  ff(['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-t', '3', wav]);
  const r = loudness(wav);
  assert.equal(r.pass, false);
  assert.match(r.findings[0].fix, /silent/);
});

test('#15 CLI flags are coerced back to strings where the schema wants a string', () => {
  assert.deepEqual(coerceToSchema(tools.render_still.inputSchema, { slug: 2026, width: 640 }), { slug: '2026', width: 640 });
});
