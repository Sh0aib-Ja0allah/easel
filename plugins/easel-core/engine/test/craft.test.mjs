// T1.7: craft rulebooks exist, carry attribution headers, and the craft tool serves them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PLUGIN_DIR } from '../lib/paths.mjs';
import { craft, frontmatter } from '../lib/craft.mjs';

const CRAFT = join(PLUGIN_DIR, 'craft');
const REQUIRED = ['anti-generic', 'typography', 'colour', 'accessibility', 'motion'];
const BANNED = /\b(vox|ghibli|shinkai|kusama|kirby|haring|dal[ií]|mario)\b/i;

test('the five rulebooks exist with matching frontmatter', () => {
  const files = readdirSync(CRAFT).filter((f) => f.endsWith('.md') && f !== 'README.md').map((f) => f.replace('.md', ''));
  for (const n of REQUIRED) assert.ok(files.includes(n), n);
  for (const n of files) {
    const fm = frontmatter(readFileSync(join(CRAFT, `${n}.md`), 'utf8'));
    assert.equal(fm.name, n);
    assert.ok(fm.title && fm.applies_to.length, n);
  }
});

test('every rulebook has an attribution header with pinned SHAs and licenses', () => {
  for (const n of REQUIRED) {
    const text = readFileSync(join(CRAFT, `${n}.md`), 'utf8');
    const header = text.match(/<!--([\s\S]*?)-->/);
    assert.ok(header, `${n}: no header`);
    assert.match(header[1], /written for Easel \(MIT\)/i, n);
    assert.match(header[1], /No text copied/, n);
    assert.match(header[1], /@ [0-9a-f]{40}/, `${n}: pinned SHA`);
    assert.match(header[1], /\((MIT|Apache-2\.0)\)/, `${n}: license`);
    assert.doesNotMatch(text.replace(header[0], ''), BANNED, `${n}: creator or brand name`);
  }
});

test('craft tool lists, gets, filters and refuses traversal', async () => {
  const list = await craft({});
  assert.deepEqual(list.available.map((e) => e.name).filter((n) => REQUIRED.includes(n)).sort(), [...REQUIRED].sort());
  assert.match(await craft({ name: 'motion' }), /# Motion rules/);
  const video = await craft({ for: 'video' });
  assert.ok(video.entries.map((e) => e.name).includes('motion'));
  assert.ok(!video.entries.map((e) => e.name).includes('nope'));
  await assert.rejects(craft({ name: '../package' }), /Invalid/);
  await assert.rejects(craft({ name: 'nope' }), /Available: /);
});
