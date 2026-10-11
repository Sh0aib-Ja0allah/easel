// T5.1: the repository's notices match its files. Every adapted file names its source and commit,
// and that source and commit are listed in THIRD_PARTY_NOTICES.md and in the plugin's own
// NOTICE.md; every Apache-2.0 file says what Easel changed and its plugin ships the licence text;
// every plugin carries LICENSE and NOTICE.md. Pure Node; runs from the repository (not an installed copy).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = fileURLToPath(new URL('../../../../', import.meta.url));
const PLUGINS = join(REPO, 'plugins');
const inRepo = existsSync(join(REPO, 'THIRD_PARTY_NOTICES.md'));
const skip = inRepo ? false : 'not in the repository (an installed copy has no THIRD_PARTY_NOTICES.md)';
const SKIP_DIRS = new Set(['node_modules', 'results', 'golden', 'fixtures']);
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (SKIP_DIRS.has(e.name) ? [] : walk(join(d, e.name))) : [join(d, e.name)]));
const TEXT = /\.(md|mjs|js|html|json|svg|css)$/;
// a source named with its pinned commit, however the header phrases it ("adapted from", "Source:", "follows")
const HEADER = /([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)\s*@\s*`?([0-9a-f]{40})/g;
const APACHE = ['nexu-io/open-design', 'anthropics/skills', 'upbrew-tech/svg-creator-skill', 'heygen-com/hyperframes'];

test('every adapted file\'s source and commit are in THIRD_PARTY_NOTICES.md and its plugin\'s NOTICE.md', { skip }, () => {
  const third = readFileSync(join(REPO, 'THIRD_PARTY_NOTICES.md'), 'utf8');
  const seen = new Map();
  for (const f of walk(PLUGINS).filter((x) => TEXT.test(x))) {
    const head = readFileSync(f, 'utf8').slice(0, 4000);
    for (const [, repo, sha] of head.matchAll(HEADER)) {
      const plugin = relative(PLUGINS, f).split(sep)[0];
      seen.set(`${repo}@${sha}`, (seen.get(`${repo}@${sha}`) || 0) + 1);
      assert.ok(third.includes(repo) && third.includes(sha), `${relative(REPO, f)}: ${repo} @ ${sha} is not in THIRD_PARTY_NOTICES.md`);
      const notice = readFileSync(join(PLUGINS, plugin, 'NOTICE.md'), 'utf8');
      assert.ok(notice.includes(repo) && notice.includes(sha), `${relative(REPO, f)}: ${repo} @ ${sha} is not in plugins/${plugin}/NOTICE.md`);
    }
  }
  assert.ok(seen.size >= 12, `${seen.size} sources`);
});

test('Apache-2.0 material: every file says Modified by Easel, and its plugin ships the licence text and a NOTICE', { skip }, () => {
  let n = 0;
  for (const f of walk(PLUGINS).filter((x) => TEXT.test(x) && !/[\\/](licenses[\\/]|NOTICE\.md$)/.test(x))) {
    const head = readFileSync(f, 'utf8').slice(0, 4000).replace(/\n\s*(\/\/|<!--|-->|\*)?\s*/g, ' ');
    if (![...head.matchAll(HEADER)].some(([, repo]) => APACHE.includes(repo))) continue;
    n++;
    const plugin = relative(PLUGINS, f).split(sep)[0];
    assert.match(head, /Modified by Easel/, relative(REPO, f));
    assert.ok(existsSync(join(PLUGINS, plugin, 'licenses', 'Apache-2.0.txt')), `plugins/${plugin}/licenses/Apache-2.0.txt`);
    assert.match(readFileSync(join(PLUGINS, plugin, 'NOTICE.md'), 'utf8'), /Apache/, `plugins/${plugin}/NOTICE.md`);
  }
  assert.ok(n >= 12, `${n} Apache-derived files`);
  assert.ok(existsSync(join(REPO, 'licenses', 'Apache-2.0.txt')));
});

// Apache-2.0 4(a) asks for "a copy of this License": the exact text from
// https://www.apache.org/licenses/LICENSE-2.0.txt (sha256 below, line endings normalised), not an
// edited copy. v1.0.0 shipped one with altered sections 6 and 9.
const APACHE_SHA256 = 'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30';
test('every shipped Apache-2.0.txt is the official licence text', { skip }, () => {
  const copies = [join(REPO, 'licenses', 'Apache-2.0.txt'), ...readdirSync(PLUGINS).map((p) => join(PLUGINS, p, 'licenses', 'Apache-2.0.txt')).filter((f) => existsSync(f))];
  assert.ok(copies.length >= 4, `${copies.length} copies`);
  for (const f of copies) {
    const text = readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
    assert.equal(createHash('sha256').update(text).digest('hex'), APACHE_SHA256, relative(REPO, f));
  }
});

test('every plugin carries LICENSE (MIT) and NOTICE.md; the MIT text and the trademark notes are in THIRD_PARTY_NOTICES.md', { skip }, () => {
  for (const p of readdirSync(PLUGINS)) {
    assert.match(readFileSync(join(PLUGINS, p, 'LICENSE'), 'utf8'), /MIT License/, p);
    assert.ok(existsSync(join(PLUGINS, p, 'NOTICE.md')), `${p}/NOTICE.md`);
  }
  const third = readFileSync(join(REPO, 'THIRD_PARTY_NOTICES.md'), 'utf8');
  assert.match(third, /Permission is hereby granted, free of charge/);
  assert.match(third, /Aishwarya Ashok[\s\S]{0,200}Ian/, 'peanut-illustrations needs both notices');
  assert.match(third, /not affiliated with[\s\S]{0,60}Igara Studio/i);
  assert.doesNotMatch(third, /\bTBD\b/);
});
