// embed_fonts on an HTML page (contract C1): the copy carries the bundled faces its text uses, so it
// looks the same in a plain browser as in Easel's renders. Needs Chromium; skips otherwise.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { doctorReport } from '../lib/doctor.mjs';

const ready = ['playwright-core', 'chromium'].every((n) => doctorReport().checks.find((c) => c.name === n)?.ok);
const skip = ready ? false : 'needs Chromium (doctor --install)';
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');
const BLOCK = /<style data-easel-fonts>\n[\s\S]*?\n<\/style>\n/;

// A page whose type comes from a linked stylesheet (one rule in a cascade layer), a mobile-only
// weight, generated ::after content, an unused rule, and "</head>" in a comment and a script.
const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Ledgerly</title>
<!-- a note on </head> before the real one -->
<script>window.__tag = '</head>';</script>
<link rel="stylesheet" href="style.css">
</head>
<body>
<h1>Ledgerly</h1>
<p>Books that balance themselves. <span class="badge">beta</span></p>
<button>Start free</button>
</body>
</html>
`;
const CSS = `@layer base { html { font-family: Inter, system-ui, sans-serif; } }
body { margin: 0; padding: 24px; background: #fff; color: #111; font-size: 20px; }
h1 { font: 700 56px/1.1 "Space Grotesk", sans-serif; margin: 0 0 12px; }
@media (max-width: 500px) { h1 { font-weight: 400; } }
.badge::after { content: " NEW"; font-family: "JetBrains Mono", monospace; font-weight: 700; }
.unused { font-family: Caveat; }
button { font: inherit; }
`;

let out, m;
before(async () => {
  out = mkdtempSync(join(tmpdir(), 'easel-embed-html-'));
  m = { ...(await import('../lib/embed.mjs')), ...(await import('../lib/render.mjs')), ...(await import('../lib/image.mjs')), ...(await import('../lib/browser.mjs')) };
});
after(() => rmSync(out, { recursive: true, force: true }));
const site = (name, files) => { const d = join(out, name); mkdirSync(d, { recursive: true }); for (const [f, text] of Object.entries(files)) writeFileSync(join(d, f), text); return d; };

test('embeds the faces the page\'s text uses (linked CSS, a mobile-only weight, ::after content) in <stem>-embedded.html beside it', { skip }, async () => {
  const d = site('ledgerly', { 'index.html': PAGE, 'style.css': CSS });
  const before = sha(join(d, 'index.html'));
  const r = await m.embedFonts({ file: join(d, 'index.html') });
  assert.equal(r.file, join(d, 'index-embedded.html'));
  assert.deepEqual(r.families, ['Inter', 'JetBrains Mono', 'Space Grotesk']);
  assert.deepEqual(r.faces.map((x) => `${x.family} ${x.weight} ${x.style}`), ['Inter 400 normal', 'JetBrains Mono 700 normal', 'Space Grotesk 400 normal', 'Space Grotesk 700 normal']);
  assert.equal(r.warnings, undefined);
  assert.equal(r.ignoredFallbacks, undefined, 'generic and system-ui fallbacks are not listed');
  const text = readFileSync(r.file, 'utf8');
  assert.equal(r.bytes, Buffer.byteLength(text));
  assert.equal((text.match(/<style data-easel-fonts>/g) || []).length, 1, 'one block');
  assert.equal((text.match(/@font-face/g) || []).length, 4, 'only the faces the text uses');
  assert.ok(text.indexOf('<style data-easel-fonts>') > text.indexOf('<link rel="stylesheet"') && text.indexOf('<style data-easel-fonts>') < text.indexOf('</head>\n<body>'), 'before the real </head>');
  assert.equal(text.replace(BLOCK, ''), PAGE, 'nothing else changes');
  assert.equal(sha(join(d, 'index.html')), before, 'the input is not changed');
});

test('in plain Chromium, without the engine\'s fonts, the embedded page renders like the engine render and loads its faces', { skip }, async () => {
  const d = site('look', { 'index.html': PAGE, 'style.css': CSS });
  const r = await m.embedFonts({ file: join(d, 'index.html') });
  const engine = await m.renderStill({ file: join(d, 'index.html'), outDir: join(out, 'look-out'), name: 'engine', width: 640, height: 300 });
  const browser = await m.openBrowser();
  try {
    const bare = async (file) => {
      const { page, context } = await m.newPage(browser, { width: 640, height: 300, fonts: false });
      try {
        await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
        await page.evaluate(() => document.fonts.ready);
        const p = join(out, 'look-out', `bare-${Math.random().toString(36).slice(2)}.png`);
        await page.screenshot({ path: p });
        const fonts = await page.evaluate(async () => {
          const used = [...document.fonts].map((f) => `${f.family.replace(/"/g, '')} ${f.weight} ${f.style} ${f.status}`).sort();
          await Promise.all([...document.fonts].map((f) => f.load()));
          return { used, all: [...document.fonts].map((f) => f.status) };
        });
        return { p, fonts };
      } finally { await context.close(); }
    };
    const copy = await bare(r.file);
    assert.equal((await m.compareImages(browser, engine.files[0].file, copy.p)).identical, true, 'the copy carries its fonts');
    // At 640 px the mobile-only weight is not drawn, so it is the one face still unloaded.
    assert.deepEqual(copy.fonts.used, ['Inter 400 normal loaded', 'JetBrains Mono 700 normal loaded', 'Space Grotesk 400 normal unloaded', 'Space Grotesk 700 normal loaded']);
    assert.deepEqual(copy.fonts.all, ['loaded', 'loaded', 'loaded', 'loaded'], 'every embedded face decodes');
    const original = await bare(join(d, 'index.html'));
    assert.deepEqual(original.fonts.used, [], 'the original declares no faces');
    assert.equal((await m.compareImages(browser, engine.files[0].file, original.p)).identical, false, 'the original needs the engine\'s fonts');
  } finally { await browser.close(); }
});

test('.htm without <head> or <body> tags: the faces go after <meta charset>, the page stays in standards mode and byte-for-byte the same', { skip }, async () => {
  // windows-1252 bytes (0xE9 is é): the copy keeps the page's own encoding.
  const page = Buffer.concat([Buffer.from('<!doctype html><meta charset="windows-1252"><title>T</title><p style="font-family:Newsreader">Caf'), Buffer.from([0xe9]), Buffer.from('</p>\n')]);
  const d = site('bare-htm', {});
  writeFileSync(join(d, 'note.htm'), page);
  const dest = join(out, 'bare-htm-dest');
  const r = await m.embedFonts({ file: join(d, 'note.htm'), outDir: dest, name: 'Final Note' });
  assert.equal(r.file, join(dest, 'Final Note.html'));
  assert.deepEqual(r.faces.map((x) => `${x.family} ${x.weight}`), ['Newsreader 400']);
  assert.match(r.warnings.join('\n'), /relative/, 'the copy is in another folder: relative links now resolve from there');
  const bytes = readFileSync(r.file);
  const block = BLOCK.exec(bytes.toString('latin1'));
  assert.equal(block.index, '<!doctype html><meta charset="windows-1252">'.length);
  assert.ok(Buffer.concat([bytes.subarray(0, block.index), bytes.subarray(block.index + block[0].length)]).equals(page));
  const browser = await m.openBrowser();
  try {
    const { page: p, context } = await m.newPage(browser, { width: 320, height: 120, fonts: false });
    try {
      await p.goto(pathToFileURL(r.file).href, { waitUntil: 'load' });
      assert.deepEqual(await p.evaluate(() => [document.compatMode, document.head.querySelectorAll('style[data-easel-fonts]').length, document.querySelector('p').textContent]), ['CSS1Compat', 1, 'Café']);
    } finally { await context.close(); }
  } finally { await browser.close(); }
});

test('never replaces a file; unstyled text and form controls are named in a warning; a family that is not bundled is refused', { skip }, async () => {
  const d = site('edges', {
    'page.html': '<!doctype html><html><head><meta charset="utf-8"><style>h1{font-family:Inter}</style></head><body><h1>Hi</h1><p>Plain</p><input value="Search"></body></html>',
    'page-embedded.html': 'not ours',
    'other.html': '<!doctype html><p style="font-family:Helvetica, Inter">Brand</p>',
  });
  await assert.rejects(m.embedFonts({ file: join(d, 'page.html') }), /page-embedded\.html already exists[\s\S]*never replaces/);
  assert.equal(readFileSync(join(d, 'page-embedded.html'), 'utf8'), 'not ours');
  const r = await m.embedFonts({ file: join(d, 'page.html'), name: 'page-2' });
  assert.deepEqual(r.families, ['Inter']);
  assert.match(r.warnings.join('\n'), /2 text element\(s\) name no font-family \(input, p\)/);
  await assert.rejects(m.embedFonts({ file: join(d, 'other.html') }), /not a bundled font family: Helvetica/);
  assert.deepEqual(readdirSync(d).sort(), ['other.html', 'page-2.html', 'page-embedded.html', 'page.html']);
});
