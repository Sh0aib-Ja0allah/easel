// T2.1: every style renders through the easel-core engine (the renderFrame contract), page audio
// lands in the loudness range, a frozen golden frame per style matches, and mixed styles switch
// per era. Needs the engine's Playwright + Chromium and ffmpeg (doctor --install); skips otherwise.
// Golden frames: each style's styles/<style>/sample.png (rendered on Windows, reviewed by eye, frozen;
// cut-paper and hud re-rendered on Linux at their later times, where Linux matched the Windows
// renders at about 60 dB) is the golden on every OS, compared at a cross-OS PSNR floor (canvas pixels
// match closely across operating systems; only text antialiasing differs). An OS whose renders drift further gets its own
// test/golden/<style>-<os>.png, compared at the same-OS floor. Regenerate only on purpose:
// EASEL_UPDATE_GOLDEN=1 rewrites the golden in use; look at every new PNG before committing.
// EASEL_MOTION_FULL=1 renders every demo at full length (CI); otherwise a 1 s clip per style.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
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
const STYLES = ['aurora-glass', 'crosshatch', 'cut-paper', 'hud', 'isometric', 'liquid', 'math', 'pixel', 'riso', 'sketchbook', 'synthwave'];
// The golden frame (and so the style's sample.png) is taken after each demo's morph, in the second
// world, once its write-ons have finished: 4.5 s, or later where text is still typing at 4.5 s
// (cut-paper's caption and flowers end at 6.25 s; hud's TARGET LOCKED and its readout at 4.7 s, and
// at 5 s the cursor is off). A sample caught mid write-on shows half a word.
const GOLDEN_TIMES = { 'cut-paper': 6.5, hud: 5.0 };
const goldenT = (s) => GOLDEN_TIMES[s] ?? 4.5;
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

  test(`${s}: golden frame at t=${goldenT(s)}s matches`, { skip }, async (t) => {
    const r = await m.renderStill({ file: demos[s], outDir: join(out, `${s}-still`), name: s, width: 1080, height: 1920, scale: 0.5, t: goldenT(s) }, { browser });
    assert.equal(r.warnings, undefined, JSON.stringify(r.warnings));
    const f = r.files[0].file, { file: g, floor } = golden(s);
    // EASEL_GOLDEN_STYLES=a,b limits a rewrite to those styles (new ones), leaving the reviewed goldens alone
    if (process.env.EASEL_UPDATE_GOLDEN === '1' && (!process.env.EASEL_GOLDEN_STYLES || process.env.EASEL_GOLDEN_STYLES.split(',').includes(s))) { copyFileSync(f, g); t.diagnostic(`golden rewritten: ${g}`); return; }
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
  // the idea sheet once both labels are typed (FILAMENT ends at 2.28 s) and before the morph's shrink (2.4 s);
  // compare/ours-idea.png and compare-idea.png are this frame and this compareSheet call
  const still = await m.renderStill({ file, outDir: join(d, 'shots'), name: 'idea', aspect: '9:16', scale: 0.5, t: 2.375 }, { browser });
  assert.equal(still.warnings, undefined, JSON.stringify(still.warnings));
  const refs = await eng('refs.mjs');
  const cmp = await refs.compareSheet({ reference: join(d, 'references', 'bulb.png'), ours: still.files[0].file, outDir: join(d, 'cmp'), name: 'idea', height: 675 });
  assert.equal(cmp.reference.palette[0].hex, cmp.ours.palette[0].hex, 'the same ground colour as the reference');
  const committed = await m.compareImages(browser, still.files[0].file, join(PLUGIN, 'examples', 'style-match', 'compare', 'ours-idea.png'));
  assert.ok(committed.psnr >= SHARED_PSNR, `the committed example frame is current: ${committed.psnr}`);
});

test('the ui-motion example: a paused GSAP timeline is seeked by the engine, offline, and passes the UI checks', { skip: skip || (!(await eng('deps.mjs')).findPackage('gsap') && 'needs gsap (doctor --install)') }, async () => {
  const file = join(PLUGIN, 'examples', 'ui-motion', 'card-reveal.html');
  const f = await m.filmstrip({ file, outDir: join(out, 'ui'), name: 'card', times: [0, 0.2, 0.45, 1.6], columns: 4 });
  const [a, b, , d] = f.frames.map((x) => x.file);
  assert.ok((await m.compareImages(browser, a, d)).psnr < 30, 'the start and the end differ (the card rises in)');
  assert.ok((await m.compareImages(browser, b, d)).psnr < 40, 'mid-motion differs from the end');
  const q = await m.qa({ file, mode: 'ui', times: [1.6], width: 1280, height: 720, outDir: join(out, 'ui-qa') });
  assert.equal(q.pass, true, JSON.stringify(q.checks));
  const s = await m.renderStill({ file, outDir: join(out, 'ui'), name: 'end', width: 1280, height: 720, t: 1.6 }, { browser });
  assert.equal(s.warnings, undefined, `offline, no page errors: ${JSON.stringify(s.warnings)}`);
});

// QA D-1 #3 and #23: every demo's and template's storyboard page draws (board.html calls renderBoard()
// at load; a page error there means no #easel-board and a 30 s timeout in render_still)
test('storyboards: every demo and template draws its board page with no page errors', { skip }, async () => {
  const pieces = [...STYLES.map((s) => [`styles/${s}/demo`, s]), ['styles/isometric', 'isometric-dark', 'demo-dark'], ['templates/piece', 'tpl-piece'], ['templates/beat-cut', 'tpl-beat-cut'], ['templates/blank', 'tpl-blank']];
  for (const [rel, name, sub] of pieces) {
    const d = join(out, `board-${name}`);
    cpSync(join(PLUGIN, rel), d, { recursive: true });
    const { board } = build(sub ? join(d, sub) : d);
    const b = await m.renderStill({ file: board, outDir: join(out, 'boards'), name, width: 1200, height: 800, scale: 0.25, selector: '#easel-board' }, { browser });
    assert.equal(b.warnings, undefined, `${name}: ${JSON.stringify(b.warnings)}`);
    assert.ok(b.files[0].width > 100 && b.files[0].height > 100, `${name}: ${JSON.stringify(b.files[0])}`);
  }
});

// QA D-1 #2 and #23: the starter templates pass the page gates the animate skill runs, in every format they list
test('templates: piece, beat-cut and blank pass canvas_text and beat_grid in each of their formats', { skip }, async () => {
  for (const tpl of ['piece', 'beat-cut', 'blank']) {
    const d = join(out, `qa-${tpl}`);
    cpSync(join(PLUGIN, 'templates', tpl), d, { recursive: true });
    const { file } = build(d);
    const meta = JSON.parse(readFileSync(join(d, 'piece.json'), 'utf8'));
    // a format-aware template head (const FORMATS) is checked in 16:9 too
    const formats = meta.formats || (readFileSync(join(d, 'src', 'head.html'), 'utf8').includes('const FORMATS =') ? ['9:16', '16:9'] : ['9:16']);
    for (const aspect of formats) {
      const q = await m.qa({ file, aspect, checks: ['canvas_text', 'beat_grid'], every: 3, textIgnore: (meta.review && meta.review.textIgnore) || [], outDir: join(d, 'qa') });
      assert.equal(q.pass, true, `${tpl} ${aspect}: ${JSON.stringify(q.checks.map((c) => [c.name, c.pass, c.findings]))}`);
    }
  }
});

// Q-06 (contract C4): synthwave, liquid and aurora-glass are blue-purple by design, so plain qa refuses
// every frame on colour_cast; each STYLE.md gives the argument that passes (the user chose the palette).
// Through the engine CLI, as a user's terminal would run it. Every other style passes plain qa.
test('colour_cast: the blue-purple styles fail plain qa and pass with their STYLE.md argument; the others pass plain qa', { skip }, () => {
  const CLI = join(PLUGIN, '..', 'easel-core', 'engine', 'cli.mjs'), dir = join(out, 'cast');
  mkdirSync(dir, { recursive: true });
  const qa = (name, args) => {
    const f = join(dir, `${name}.json`);
    writeFileSync(f, JSON.stringify(args));
    const r = spawnSync(process.execPath, [CLI, 'qa', '--json', `@${f}`], { encoding: 'utf8', cwd: dir, windowsHide: true, timeout: 120000 });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout);
  };
  for (const s of STYLES) {
    const plain = qa(s, { image: sample(s), checks: ['colour_cast'] });
    const documented = /"castMaxRatio": ([\d.]+)/.exec(readFileSync(join(PLUGIN, 'styles', s, 'STYLE.md'), 'utf8'));
    if (!['synthwave', 'liquid', 'aurora-glass'].includes(s)) { assert.equal(plain.pass, true, `${s}: ${JSON.stringify(plain.checks)}`); continue; }
    assert.deepEqual(plain.hardFailures, ['colour_cast'], `${s}: plain qa refuses the sample on colour_cast`);
    assert.ok(documented, `${s}/STYLE.md documents the qa argument ("castMaxRatio": n)`);
    const with_ = qa(`${s}-cast`, { image: sample(s), checks: ['colour_cast'], castMaxRatio: Number(documented[1]) });
    assert.equal(with_.pass, true, `${s} with castMaxRatio ${documented[1]}: ${JSON.stringify(with_.checks)}`);
  }
});

// CM-03: pixel art keeps square pixels in every format. A 9:16 era resolution (90x160) stretched over a
// 16:9 frame made pixels 21.3 x 6.75 px. Runs of one colour along rows and along columns then differ:
// the run lengths that are common (1% of runs or more) must be the same across and down.
test('pixel: a new piece in 16:9 keeps square pixels (equal pixel runs on x and y)', { skip }, async () => {
  const { newPiece } = await import('../tools/new-piece.mjs');
  const d = join(out, 'pixel-169');
  newPiece(d, { style: 'pixel', formats: ['16:9', '9:16'] });
  const r = await m.renderStill({ file: build(d).file, outDir: join(d, 'shots'), name: 'wide', aspect: '16:9', t: 1.5 }, { browser });
  assert.equal(r.warnings, undefined, JSON.stringify(r.warnings));
  const runs = await m.withPixels(browser, [r.files[0].file], (imgs) => {
    const { data, width: w, height: h } = imgs[0], px = (x, y) => { const i = (y * w + x) * 4; return (data[i] << 16) | (data[i + 1] << 8) | data[i + 2]; };
    // every third line along one axis: the lengths of runs of one colour (runs touching the edge left out)
    const common = (along, n, lines) => {
      const hist = {};
      let total = 0;
      for (let a = 0; a < lines; a += 3) {
        let start = 0;
        for (let b = 1; b <= n; b++) if (b === n || along(a, b) !== along(a, b - 1)) { if (start > 0 && b < n) { hist[b - start] = (hist[b - start] || 0) + 1; total++; } start = b; }
      }
      return Object.keys(hist).filter((k) => hist[k] >= total / 100).map(Number).sort((p, q) => p - q);
    };
    return { x: common((y, x) => px(x, y), w, h), y: common((x, y) => px(x, y), h, w), size: [w, h] };
  });
  assert.deepEqual(runs.size, [1920, 1080]);
  assert.deepEqual(runs.x, runs.y, `common pixel runs: ${runs.x} px across, ${runs.y} px down`);
});

// CM-13: the aurora-glass hero is a lens whose inner rim had radius r - 3; morphs ramp the hero from r = 0
test('aurora-glass: the hero draws at every small radius (morphs grow it from 0)', { skip }, async () => {
  const { newPage } = await eng('browser.mjs');
  const { page, context } = await newPage(browser, { width: 1080, height: 1920 });
  try {
    await page.goto(pathToFileURL(demos['aurora-glass']).href, { waitUntil: 'load' });
    const errors = await page.evaluate(() => {
      const bad = [];
      window.renderFrame(4.5);
      for (let r = 0; r <= 12; r += 0.5) { try { STYLE.hero(540, 900, r, { key: 'small' }); } catch (e) { bad.push(`r ${r}: ${e.message}`); } }
      return bad;
    });
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

// CM-14: new-piece made demos with CX = 500 (math, sketchbook, isometric) format-aware with CX = (W - SAFE.right) / 2,
// which is 470 on 9:16: the 9:16 copy no longer matched the style's sample
test('new-piece: a format-aware copy of a demo still matches the style\'s sample in 9:16', { skip }, async () => {
  const { newPiece } = await import('../tools/new-piece.mjs');
  for (const s of ['math', 'sketchbook', 'isometric']) {
    const d = join(out, `np-${s}`);
    newPiece(d, { style: s, formats: ['16:9', '9:16'] });
    const r = await m.renderStill({ file: build(d).file, outDir: join(d, 'shots'), name: s, aspect: '9:16', scale: 0.5, t: goldenT(s) }, { browser });
    const cmp = await m.compareImages(browser, r.files[0].file, golden(s).file);
    assert.ok(cmp.psnr >= SHARED_PSNR, `${s}: PSNR ${cmp.psnr.toFixed(2)} dB against its sample`);
  }
});
