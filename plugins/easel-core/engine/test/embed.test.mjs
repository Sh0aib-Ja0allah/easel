// embed_fonts: an SVG that names a bundled family carries the faces it uses. Needs Chromium; skips otherwise.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { doctorReport } from '../lib/doctor.mjs';
import { familyList, pickWeight } from '../lib/embed.mjs';
import { tools } from '../tools.mjs';

const ready = ['playwright-core', 'chromium'].every((n) => doctorReport().checks.find((c) => c.name === n)?.ok);
const skip = ready ? false : 'needs Chromium (doctor --install)';
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
const WORDMARK = '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="420" height="120" viewBox="0 0 420 120"><rect width="420" height="120" fill="#f4efe6"/><text x="24" y="78" font-family="Space Grotesk, sans-serif" font-size="56" font-weight="700" fill="#1d3557">Wordmark</text></svg>\n';
let out, m;
before(async () => {
  out = mkdtempSync(join(tmpdir(), 'easel-embed-'));
  m = { ...(await import('../lib/embed.mjs')), ...(await import('../lib/render.mjs')), ...(await import('../lib/image.mjs')), ...(await import('../lib/browser.mjs')), ...(await import('../lib/source.mjs')) };
});
after(() => rmSync(out, { recursive: true, force: true }));
const svgFile = (name, text) => { const d = join(out, name); mkdirSync(d, { recursive: true }); const f = join(d, `${name}.svg`); writeFileSync(f, text); return f; };

test('family lists and CSS weight matching', () => {
  assert.deepEqual(familyList('"Space Grotesk", Inter, \'JetBrains Mono\', sans-serif'), ['Space Grotesk', 'Inter', 'JetBrains Mono', 'sans-serif']);
  assert.equal(pickWeight([400, 700, 900], 700), 700);
  assert.equal(pickWeight([400, 700, 900], 600), 700);
  assert.equal(pickWeight([400, 700, 900], 500), 400);
  assert.equal(pickWeight([400, 700, 900], 300), 400);
  assert.equal(pickWeight([400, 700], 950), 700);
  assert.equal(pickWeight([400], 700), 400);
});

test('embed_fonts is an engine tool: file required, outDir and name optional', () => {
  const t = tools.embed_fonts;
  assert.deepEqual(t.inputSchema.required, ['file']);
  assert.deepEqual(Object.keys(t.inputSchema.properties).sort(), ['file', 'name', 'outDir']);
  assert.equal(t.inputSchema.additionalProperties, false);
});

test('embeds the Space Grotesk face a <text font-family="Space Grotesk"> uses, beside the SVG, as <stem>-embedded.svg', { skip }, async () => {
  const f = svgFile('wordmark', WORDMARK);
  const before = sha(f);
  const r = await m.embedFonts({ file: f });
  assert.equal(r.file, join(out, 'wordmark', 'wordmark-embedded.svg'));
  assert.deepEqual(r.families, ['Space Grotesk']);
  assert.deepEqual(r.faces, [{ family: 'Space Grotesk', weight: 700, style: 'normal', file: 'space-grotesk/space-grotesk-latin-700-normal.woff2' }]);
  const text = readFileSync(r.file, 'utf8');
  assert.equal(r.bytes, Buffer.byteLength(text));
  assert.match(text, /@font-face\{font-family:'Space Grotesk';src:url\(data:font\/woff2;base64,[A-Za-z0-9+/=]{1000,}\) format\('woff2'\);font-weight:700;font-style:normal;\}/);
  assert.equal((text.match(/@font-face/g) || []).length, 1, 'only the face the text uses');
  assert.ok(text.startsWith('<?xml'), 'the rest of the file is kept');
  assert.equal(sha(f), before, 'the input is not changed');
  assert.deepEqual(r.ignoredFallbacks, undefined);
});

test('the embedded copy renders like the original in render_still, and carries its font without the engine\'s', { skip }, async () => {
  const f = svgFile('look', WORDMARK);
  const r = await m.embedFonts({ file: f });
  const a = await m.renderStill({ file: f, outDir: join(out, 'look-out'), name: 'original', width: 420, height: 120 });
  const b = await m.renderStill({ file: r.file, outDir: join(out, 'look-out'), name: 'embedded', width: 420, height: 120 });
  const browser = await m.openBrowser();
  try {
    assert.equal((await m.compareImages(browser, a.files[0].file, b.files[0].file)).identical, true);
    // Without the fonts the engine injects (as in any other viewer): the copy still matches, the original falls back.
    const shot = async (file) => {
      const { page, context } = await m.newPage(browser, { width: 420, height: 120, fonts: false });
      try {
        await page.setContent(m.svgWrapper(readFileSync(file, 'utf8')), { waitUntil: 'load' });
        await page.evaluate(() => document.fonts.ready);
        const p = join(out, 'look-out', `bare-${Math.random().toString(36).slice(2)}.png`);
        await page.screenshot({ path: p });
        return p;
      } finally { await context.close(); }
    };
    assert.equal((await m.compareImages(browser, a.files[0].file, await shot(r.file))).identical, true, 'the copy carries Space Grotesk');
    assert.equal((await m.compareImages(browser, a.files[0].file, await shot(f))).identical, false, 'the original needs the engine\'s fonts');
  } finally { await browser.close(); }
});

test('weights, styles and CSS classes pick the matching bundled faces; outDir and name are honoured', { skip }, async () => {
  const f = svgFile('styles', '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><style>.cap{font:italic 700 14px "STIX Two Text", serif}</style><g font-family="Inter"><text y="20">Regular</text><text y="40" font-weight="600">Semi</text><text y="60" style="font-weight:900">Black</text></g><text y="80" class="cap">Caption</text><text y="100" font-family="Caveat, Comic Sans MS, cursive">Hand</text></svg>');
  const dest = join(out, 'styles-dest');
  mkdirSync(dest, { recursive: true });
  const r = await m.embedFonts({ file: f, outDir: dest, name: 'Styles Final' });
  assert.equal(r.file, join(dest, 'Styles Final.svg'));
  assert.deepEqual(r.faces.map((x) => `${x.family} ${x.weight} ${x.style}`), ['Caveat 400 normal', 'Inter 400 normal', 'Inter 700 normal', 'Inter 900 normal', 'STIX Two Text 700 italic']);
  assert.deepEqual(r.ignoredFallbacks, ['Comic Sans MS']);
});

test('refuses a family that is not bundled, listing the bundled ones, and writes nothing', { skip }, async () => {
  const f = svgFile('unbundled', '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><text y="40" font-family="Comic Sans MS, sans-serif">Hello</text></svg>');
  await assert.rejects(m.embedFonts({ file: f }), /not a bundled font family: Comic Sans MS\. Easel can embed only its bundled families \(Inter, Newsreader, JetBrains Mono, Space Grotesk/);
  assert.deepEqual(readdirSync(join(out, 'unbundled')), ['unbundled.svg']);
});

test('never overwrites the input; refuses files that are not SVG', { skip }, async () => {
  const f = svgFile('keep', WORDMARK);
  const before = sha(f);
  await assert.rejects(m.embedFonts({ file: f, name: 'keep' }), /would overwrite the input/);
  await assert.rejects(m.embedFonts({ file: f, name: 'keep.svg' }), /would overwrite the input/);
  assert.equal(sha(f), before);
  const png = join(out, 'keep', 'x.png');
  writeFileSync(png, 'not an svg');
  await assert.rejects(m.embedFonts({ file: png }), /takes an \.svg file/);
  await assert.rejects(m.embedFonts({ file: join(out, 'keep', 'missing.svg') }), /File not found/);
  assert.ok(!existsSync(join(out, 'keep', 'keep-embedded.svg')));
});
