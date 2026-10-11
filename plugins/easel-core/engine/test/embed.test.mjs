// embed_fonts: an SVG that names a bundled family carries the faces it uses. Needs Chromium; skips otherwise.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { doctorReport } from '../lib/doctor.mjs';
import { faceCoverage, familyList, pickWeight } from '../lib/embed.mjs';
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
  assert.deepEqual(r.warnings, undefined);
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

test('never overwrites the input; refuses files that are not SVG or HTML', { skip }, async () => {
  const f = svgFile('keep', WORDMARK);
  const before = sha(f);
  await assert.rejects(m.embedFonts({ file: f, name: 'keep' }), /would overwrite the input/);
  await assert.rejects(m.embedFonts({ file: f, name: 'keep.svg' }), /would overwrite the input/);
  assert.equal(sha(f), before);
  const png = join(out, 'keep', 'x.png');
  writeFileSync(png, 'not an svg');
  await assert.rejects(m.embedFonts({ file: png }), /takes an \.svg or \.html file/);
  await assert.rejects(m.embedFonts({ file: join(out, 'keep', 'missing.svg') }), /File not found/);
  assert.ok(!existsSync(join(out, 'keep', 'keep-embedded.svg')));
});

// Parses a file as a browser opening it on its own would (XML), and says what is wrong if anything.
const xmlError = async (file) => {
  const browser = await m.openBrowser();
  try {
    const { page, context } = await m.newPage(browser, { width: 64, height: 64, fonts: false });
    try {
      return await page.evaluate((s) => { const d = new DOMParser().parseFromString(s, 'image/svg+xml'); const e = d.querySelector('parsererror'); return e ? e.textContent : d.documentElement.localName === 'svg' && d.documentElement.firstElementChild?.localName; }, readFileSync(file, 'utf8'));
    } finally { await context.close(); }
  } finally { await browser.close(); }
};

test('the faces\' cmaps: Latin subsets cover Latin, not Latin Extended, CJK or Arabic', () => {
  const inter = faceCoverage('inter/inter-latin-400-normal.woff2');
  for (const c of 'Aaz09&©éß€—“') assert.ok(inter.has(c.codePointAt(0)), c);
  for (const c of 'Łź東京م') assert.ok(!inter.has(c.codePointAt(0)), c);
  assert.ok(faceCoverage('noto-sans-math/noto-sans-math-latin-400-normal.woff2').has(0x2248), 'Noto Sans Math has ≈');
});

test('refuses an SVG that is not well-formed XML, naming the parser\'s message and the usual fix, and writes nothing', { skip }, async () => {
  const cases = {
    amp: ['<text x="10" y="40" font-family="Inter">R&D</text>', /EntityRef: expecting ';'/],
    nbsp: ['<text x="10" y="40" font-family="Inter">Acme&nbsp;Co &copy;</text>', /Entity 'nbsp' not defined/],
    dup: ['<text x="10" x="12" y="40" font-family="Inter">Dup</text>', /Attribute x redefined/],
    comment: ['<!-- a -- b --><text x="10" y="40" font-family="Inter">C</text>', /Double hyphen within comment/],
  };
  for (const [name, [body, message]] of Object.entries(cases)) {
    const f = svgFile(`bad-${name}`, `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60">${body}</svg>`);
    await assert.rejects(m.embedFonts({ file: f }), (e) => {
      assert.match(e.message, /not well-formed XML/, name);
      assert.match(e.message, message, name);
      assert.match(e.message, /line 1/, name);
      assert.match(e.message, /&amp;/, name);
      assert.match(e.message, /&#160;/, name);
      return true;
    });
    assert.deepEqual(readdirSync(join(out, `bad-${name}`)), [`bad-${name}.svg`], name);
  }
  const late = svgFile('bad-late', `\n<?xml version="1.0" encoding="UTF-8"?>\n${WORDMARK.replace(/^<\?xml[^>]*>\n/, '')}`);
  await assert.rejects(m.embedFonts({ file: late }), /not well-formed XML[\s\S]*XML declaration allowed only at the start/);
  const html = svgFile('bad-root', '<html><body><p style="font-family:Inter">Hi</p></body></html>');
  await assert.rejects(m.embedFonts({ file: html }), /root element is <html>, not <svg>/);
  const nons = svgFile('bad-ns', '<svg width="200" height="60"><text y="40" font-family="Inter">Hi</text></svg>');
  await assert.rejects(m.embedFonts({ file: nons }), /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
});

test('text in <defs> placed by a <use font-family="Caveat"> embeds Caveat, and is not reported as naming no family', { skip }, async () => {
  const f = svgFile('use', '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="600" height="120" viewBox="0 0 600 120">\n<defs><text id="w" font-size="64">Wordmark</text><symbol id="s"><text y="20" font-weight="700">Sym</text></symbol></defs>\n<rect width="600" height="120" fill="#fff"/>\n<use xlink:href="#w" x="20" y="80" font-family="Caveat"/><g font-family="Space Grotesk"><use href="#s"/></g>\n</svg>\n');
  const r = await m.embedFonts({ file: f });
  assert.deepEqual(r.faces.map((x) => `${x.family} ${x.weight} ${x.style}`), ['Caveat 400 normal', 'Space Grotesk 700 normal']);
  assert.deepEqual(r.warnings, undefined);
});

test('a comment before the root that mentions <svg>: the faces go inside the root element and the copy is well-formed', { skip }, async () => {
  const f = svgFile('comment', '<?xml version="1.0"?>\n<!-- Exported from a tool. Root element: <svg> -->\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<svg xmlns="http://www.w3.org/2000/svg" width="600" height="120" viewBox="0 0 600 120">\n<rect width="600" height="120" fill="#fff"/>\n<text x="20" y="80" font-family="Caveat" font-size="64">Wordmark</text>\n</svg>\n');
  const r = await m.embedFonts({ file: f });
  assert.deepEqual(r.families, ['Caveat']);
  const text = readFileSync(r.file, 'utf8');
  assert.ok(text.indexOf('<style data-easel-fonts="">') > text.indexOf('viewBox="0 0 600 120">'), 'inside the root element');
  assert.ok(text.startsWith('<?xml version="1.0"?>\n<!-- Exported from a tool. Root element: <svg> -->\n'), 'the prolog is kept');
  assert.equal(await xmlError(r.file), 'style', 'well-formed, the style is the root\'s first child');
});

test('never replaces an existing file: an unrelated file with the name asked for, or the copy from an earlier run', { skip }, async () => {
  const f = svgFile('noclobber', WORDMARK);
  const other = join(out, 'noclobber', 'other.svg');
  writeFileSync(other, '<svg xmlns="http://www.w3.org/2000/svg"><!-- someone else\'s --></svg>');
  const before = sha(other);
  await assert.rejects(m.embedFonts({ file: f, name: 'other' }), /already exists[\s\S]*never replaces/);
  assert.equal(sha(other), before);
  const first = await m.embedFonts({ file: f });
  const kept = sha(first.file);
  await assert.rejects(m.embedFonts({ file: f }), /noclobber-embedded\.svg already exists/);
  assert.equal(sha(first.file), kept);
});

test('warns about characters the embedded Latin faces do not cover; a bundled fallback that covers them is embedded too', { skip }, async () => {
  const f = svgFile('scripts', '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="120"><text y="40" font-family="Inter, sans-serif">Łódź 東京 مرحبا 🎉</text><text y="80" font-family="Space Grotesk">Café — “ok” ©</text><text y="110" font-family="\'STIX Two Text\', \'Noto Sans Math\', serif">x ≈ y</text></svg>');
  const r = await m.embedFonts({ file: f });
  assert.deepEqual(r.faces.map((x) => `${x.family} ${x.weight}`), ['Inter 400', 'Noto Sans Math 400', 'Space Grotesk 400', 'STIX Two Text 400']);
  assert.equal(r.warnings.length, 1, JSON.stringify(r.warnings));
  assert.match(r.warnings[0], /^Inter: 9 character\(s\) the embedded faces do not cover \(Ł ź 東 京 م ر ح ب ا\)/);
  assert.match(r.warnings[0], /Latin/);
  assert.deepEqual(r.ignoredFallbacks, undefined, 'Noto Sans Math is embedded, not ignored');
});
