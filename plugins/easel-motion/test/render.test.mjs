// T2.1: every style renders through the easel-core engine (the renderFrame contract), page audio
// lands in the loudness range, a frozen golden frame per style matches, and mixed styles switch
// per era. Needs the engine's Playwright + Chromium and ffmpeg (doctor --install); skips otherwise.
// Golden frames: each style's styles/<style>/sample.png (rendered on Windows, reviewed by eye, frozen)
// is the golden on every OS, compared at a cross-OS PSNR floor (canvas pixels match closely across
// operating systems; only text antialiasing differs). An OS whose renders drift further gets its own
// test/golden/<style>-<os>.png, compared at the same-OS floor. Regenerate only on purpose:
// EASEL_UPDATE_GOLDEN=1 rewrites the golden in use; look at every new PNG before committing.
// EASEL_MOTION_FULL=1 renders every demo at full length (CI); otherwise a 1 s clip per style.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build, PLUGIN } from '../tools/build.mjs';

// The engine lives in easel-core; in the repo it is a sibling plugin (tests only, never at runtime).
const ENGINE = join(PLUGIN, '..', 'easel-core', 'engine', 'lib');
const eng = async (f) => import(pathToFileURL(join(ENGINE, f)).href);
const { doctorReport } = await eng('doctor.mjs');
const ready = ['playwright-core', 'chromium', 'ffmpeg', 'ffprobe'].every((n) => doctorReport().checks.find((c) => c.name === n)?.ok);
const skip = ready ? false : 'needs the easel-core engine installed (doctor --install) and ffmpeg';
const STYLES = ['crosshatch', 'cut-paper', 'isometric', 'math', 'pixel', 'riso', 'sketchbook'];
const GOLDEN_T = 4.5;   // after each demo's morph: the second world, with its caption written on
const GOLDEN_PSNR = Number(process.env.EASEL_GOLDEN_PSNR || 40);          // same OS
const SHARED_PSNR = Number(process.env.EASEL_GOLDEN_SHARED_PSNR || 36);   // the Windows sample on another OS
const FULL = process.env.EASEL_MOTION_FULL === '1';
const osGolden = (s) => fileURLToPath(new URL(`./golden/${s}-${process.platform}.png`, import.meta.url));
const sample = (s) => join(PLUGIN, 'styles', s, 'sample.png');
const golden = (s) => (existsSync(osGolden(s)) ? { file: osGolden(s), floor: GOLDEN_PSNR } : { file: sample(s), floor: process.platform === 'win32' ? GOLDEN_PSNR : SHARED_PSNR });

let out, m, browser;
const demos = {};
before(async () => {
  if (!ready) return;
  out = mkdtempSync(join(tmpdir(), 'easel-motion-render-'));
  m = { ...(await eng('video.mjs')), ...(await eng('render.mjs')), ...(await eng('image.mjs')), ...(await eng('browser.mjs')), ...(await eng('probe.mjs')), ...(await eng('qa.mjs')) };
  browser = await m.openBrowser();
  for (const s of STYLES) { const d = join(out, s); cpSync(join(PLUGIN, 'styles', s, 'demo'), d, { recursive: true }); demos[s] = build(d).file; }
});
after(async () => { if (browser) await browser.close(); if (out) rmSync(out, { recursive: true, force: true }); });

for (const s of STYLES) {
  test(`${s}: the demo renders to MP4 with its own score (${FULL ? 'full length' : '1 s clip'}), no page errors, loudness in range`, { skip }, async () => {
    const v = await m.renderVideo({ file: demos[s], outDir: join(out, `${s}-video`), name: s, audio: 'page', preset: 'ultrafast', ...(FULL ? {} : { duration: 1 }) });
    assert.equal(v.warnings, undefined, JSON.stringify(v.warnings));
    const p = m.probe(v.videos[0].file);
    assert.deepEqual([p.video.width, p.video.height, p.video.fps], [1080, 1920, 24]);
    // full length is the demo's own TIMELINE duration (6 s for most, 8 s for cut-paper)
    assert.equal(p.video.frames, Math.round(v.videos[0].duration * 24));
    if (!FULL) assert.equal(p.video.frames, 24);
    assert.ok(p.audio, 'the score is muxed');
    const loud = m.loudness(join(out, `${s}-video`, `${s}.wav`));
    assert.ok(loud.pass, `${s} score: ${JSON.stringify(loud)}`);
  });

  test(`${s}: golden frame at t=${GOLDEN_T}s matches`, { skip }, async (t) => {
    const r = await m.renderStill({ file: demos[s], outDir: join(out, `${s}-still`), name: s, width: 1080, height: 1920, scale: 0.5, t: GOLDEN_T }, { browser });
    assert.equal(r.warnings, undefined, JSON.stringify(r.warnings));
    const f = r.files[0].file, { file: g, floor } = golden(s);
    if (process.env.EASEL_UPDATE_GOLDEN === '1') { copyFileSync(f, g); t.diagnostic(`golden rewritten: ${g}`); return; }
    // On a miss, keep the render beside the goldens (test/golden/candidates/, git-ignored; CI uploads it).
    const keep = () => { const c = fileURLToPath(new URL('./golden/candidates/', import.meta.url)); mkdirSync(c, { recursive: true }); copyFileSync(f, join(c, `${s}-${process.platform}.png`)); };
    if (!existsSync(g)) keep();
    assert.ok(existsSync(g), `missing golden ${g} (generate with EASEL_UPDATE_GOLDEN=1 and review it)`);
    const cmp = await m.compareImages(browser, f, g);
    if (!cmp.sameSize || cmp.psnr < floor) keep();
    assert.ok(cmp.sameSize, JSON.stringify(cmp));
    assert.ok(cmp.psnr >= floor, `${s}: PSNR ${cmp.psnr.toFixed(2)} dB < ${floor} against ${g} (${cmp.diffPixels} px differ)`);
  });
}

test('the golden comparison is not vacuous: another moment of the same demo fails the cross-OS floor', { skip }, async () => {
  const r = await m.renderStill({ file: demos.riso, outDir: join(out, 'vacuous'), name: 'riso-3', width: 1080, height: 1920, scale: 0.5, t: 3.75 }, { browser });
  const cmp = await m.compareImages(browser, r.files[0].file, golden('riso').file);
  assert.ok(cmp.psnr < SHARED_PSNR, `t=3.75 still passes the riso golden: ${cmp.psnr}`);
  const hero = await m.renderStill({ file: demos.math, outDir: join(out, 'vacuous'), name: 'math-4.4', width: 1080, height: 1920, scale: 0.5, t: 4.4 }, { browser });
  const near = await m.compareImages(browser, hero.files[0].file, golden('math').file);
  assert.ok(near.psnr < SHARED_PSNR, `math 0.1 s earlier still passes the golden: ${near.psnr}`);
});

test('renders are deterministic: the same frame twice is byte-identical in pixels', { skip }, async () => {
  const a = await m.renderStill({ file: demos.riso, outDir: join(out, 'det'), name: 'a', width: 1080, height: 1920, scale: 0.5, t: 2.25 }, { browser });
  const b = await m.renderStill({ file: demos.riso, outDir: join(out, 'det'), name: 'b', width: 1080, height: 1920, scale: 0.5, t: 2.25 }, { browser });
  assert.equal((await m.compareImages(browser, a.files[0].file, b.files[0].file)).identical, true);
});

test('mixed styles: an era that names another style draws with that style; the other era is unchanged', { skip }, async () => {
  const plain = join(out, 'mix-plain'), mixed = join(out, 'mix-riso');
  for (const d of [plain, mixed]) cpSync(join(PLUGIN, 'templates', 'piece'), d, { recursive: true });
  const meta = JSON.parse(readFileSync(join(mixed, 'piece.json'), 'utf8'));
  writeFileSync(join(mixed, 'piece.json'), JSON.stringify({ ...meta, mix: ['riso'] }));
  const head = join(mixed, 'src', 'head.html'), h = readFileSync(head, 'utf8');
  const era = '[M1, DURATION, () => sceneMorning()]';
  assert.ok(h.includes(era), 'template ERA_LIST changed; update this test');
  writeFileSync(head, h.replace(era, "[M1, DURATION, () => sceneRisoMorning(), 'riso']"));
  // the riso era's scene takes riso's names from KITS.riso (here only its STYLE hooks, which every style has)
  const scenes = join(mixed, 'src', 'scenes.js');
  writeFileSync(scenes, readFileSync(scenes, 'utf8') + "\nfunction sceneRisoMorning() { const { STYLE: R } = KITS.riso; R.backdrop('#f2c14e'); R.hero(540, 900, 170, { mood: 'happy', key: 'mixhero' }); }\n");
  const fp = build(plain).file, fm = build(mixed).file;
  const shot = async (file, t, name) => (await m.renderStill({ file, outDir: join(out, 'mix-shots'), name, width: 1080, height: 1920, scale: 0.5, t }, { browser }));
  for (const [t, same] of [[1.0, true], [3.6, true], [4.0, false], [6.5, false]]) {
    const a = await shot(fp, t, `plain-${t}`), b = await shot(fm, t, `mixed-${t}`);
    assert.equal(a.warnings, undefined, JSON.stringify(a.warnings));
    assert.equal(b.warnings, undefined, JSON.stringify(b.warnings));
    const cmp = await m.compareImages(browser, a.files[0].file, b.files[0].file);
    if (process.env.EASEL_KEEP_MIX) { copyFileSync(a.files[0].file, join(process.env.EASEL_KEEP_MIX, `plain-${t}.png`)); copyFileSync(b.files[0].file, join(process.env.EASEL_KEEP_MIX, `mixed-${t}.png`)); }
    if (same) assert.ok(cmp.identical, `t=${t}: era 0 (and the shrink out of it) must not change: ${JSON.stringify(cmp)}`);
    else assert.ok(cmp.psnr < 30, `t=${t}: the riso era should look different: PSNR ${cmp.psnr}`);
  }
});

test('mixed styles: a page error names the missing style when an era asks for one not in "mix"', { skip }, async () => {
  const d = join(out, 'mix-missing');
  cpSync(join(PLUGIN, 'templates', 'piece'), d, { recursive: true });
  const head = join(d, 'src', 'head.html');
  writeFileSync(head, readFileSync(head, 'utf8').replace('[M1, DURATION, () => sceneMorning()]', "[M1, DURATION, () => sceneMorning(), 'riso']"));
  const r = await m.renderStill({ file: build(d).file, outDir: join(out, 'mix-missing-shot'), name: 'x', width: 1080, height: 1920, scale: 0.5, t: 6.5 }, { browser }).catch((e) => ({ error: String(e) }));
  const text = JSON.stringify(r);
  assert.match(text, /style \\?"riso\\?", which is not in this piece: add it to piece.json \\?"mix\\?"/);
});

test('the water-cycle example: one piece renders in 16:9 and 9:16 with its score, and passes the page checks in both', { skip }, async () => {
  const d = join(out, 'water-cycle');
  cpSync(join(PLUGIN, 'examples', 'water-cycle'), d, { recursive: true });
  const { file, board } = build(d);
  const v = await m.renderVideo({ file, outDir: join(d, 'renders'), name: 'water-cycle', aspects: ['16:9', '9:16'], audio: 'page', preset: 'ultrafast', ...(FULL ? {} : { duration: 1 }) });
  assert.equal(v.warnings, undefined, JSON.stringify(v.warnings));
  assert.deepEqual(v.videos.map((x) => { const p = m.probe(x.file); return [p.video.width, p.video.height, !!p.audio]; }), [[1920, 1080, true], [1080, 1920, true]]);
  for (const aspect of ['16:9', '9:16']) {
    const q = await m.qa({ file, aspect, checks: ['canvas_text', 'beat_grid'], every: 3, outDir: join(d, 'qa') });
    assert.equal(q.pass, true, `${aspect}: ${JSON.stringify(q.checks)}`);
    assert.deepEqual(q.checks.map((c) => c.name).sort(), ['beat_grid', 'canvas_text']);
  }
  assert.ok(m.loudness(join(d, 'renders', 'water-cycle.wav')).pass);
  // the storyboard page: one panel per TIMELINE.board beat, at its real size
  const b = await m.renderStill({ file: board, outDir: join(d, 'board'), name: 'board', width: 1200, height: 800, selector: '#easel-board' }, { browser });
  assert.equal(b.warnings, undefined, JSON.stringify(b.warnings));
  assert.ok(b.files[0].width > 1200 && b.files[0].height > 400, JSON.stringify(b.files[0]));   // 16:9 panels: 1980 x 513
  assert.deepEqual(m.pngSize(b.files[0].file), { width: b.files[0].width, height: b.files[0].height });
});

test('the style-match example: the blueprint style is found beside the piece, renders in 9:16 and 16:9, and matches its compare sheets', { skip }, async () => {
  const d = join(out, 'style-match');
  cpSync(join(PLUGIN, 'examples', 'style-match'), d, { recursive: true });
  const { file } = build(join(d, 'piece'));
  assert.match(readFileSync(file, 'utf8'), /name: 'blueprint'/);
  for (const aspect of ['9:16', '16:9']) {
    const q = await m.qa({ file, aspect, checks: ['canvas_text', 'beat_grid'], every: 3, outDir: join(d, 'qa') });
    assert.equal(q.pass, true, `${aspect}: ${JSON.stringify(q.checks)}`);
  }
  const still = await m.renderStill({ file, outDir: join(d, 'shots'), name: 'idea', aspect: '9:16', scale: 0.5, t: 2.25 }, { browser });
  assert.equal(still.warnings, undefined, JSON.stringify(still.warnings));
  const refs = await eng('refs.mjs');
  const cmp = await refs.compareSheet({ reference: join(d, 'references', 'bulb.png'), ours: still.files[0].file, outDir: join(d, 'cmp'), name: 'idea', height: 675 });
  assert.equal(cmp.reference.palette[0].hex, cmp.ours.palette[0].hex, 'the same ground colour as the reference');
  const committed = await m.compareImages(browser, still.files[0].file, join(PLUGIN, 'examples', 'style-match', 'compare', 'ours-idea.png'));
  assert.ok(committed.psnr >= SHARED_PSNR, `the committed example frame is current: ${committed.psnr}`);
});
