// T1.5: shared data formats. Every example validates; each rule rejects a broken copy.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SCHEMA_DIR, validateData, validateFile, KINDS } from '../lib/schemas.mjs';
import { tools } from '../tools.mjs';

const ex = (k) => join(SCHEMA_DIR, 'examples', k === 'brand' ? 'brand.md' : `${k}.json`);
const load = (k) => JSON.parse(readFileSync(ex(k), 'utf8'));
const expectProblem = (kind, data, re) => assert.match(validateData(kind, data).join(' | '), re);

test('every example file validates', () => {
  for (const k of KINDS) assert.deepEqual(validateFile(k, ex(k)), [], k);
});

test('the brand template itself validates', () => {
  assert.deepEqual(validateFile('brand', join(SCHEMA_DIR, 'brand.template.md')), []);
});

test('brief rules', () => {
  const b = load('brief');
  expectProblem('brief', { ...b, formats: [] }, /at least 1/);
  expectProblem('brief', { ...b, slug: 'Bad Slug' }, /slug does not match/);
  expectProblem('brief', { ...b, formats: [{ kind: 'hologram' }] }, /one of/);
  expectProblem('brief', { ...b, look: { palette: ['blue'] } }, /palette\[0\]/);
  expectProblem('brief', { ...b, checkins: { story: 'pending', look: 'approved', storyboard: 'pending' } }, /"look" is approved before "story"/);
  expectProblem('brief', { ...b, extra: 1 }, /not an allowed property/);
});

test('beats rules', () => {
  const b = load('beats');
  expectProblem('beats', { ...b, beats: [...b.beats, { ...b.beats[0] }], totalSec: 16 }, /used twice/);
  expectProblem('beats', { ...b, totalSec: 20 }, /add up to 12 s but totalSec is 20/);
  expectProblem('beats', { ...b, beats: [{ ...b.beats[0], approval: 'maybe' }] }, /one of/);
  expectProblem('beats', { ...b, beats: [{ id: 'x', durationSec: 1, approval: 'pending' }] }, /visual is required/);
});

test('cues rules', () => {
  const c = load('cues');
  expectProblem('cues', { ...c, cues: [...c.cues, { name: 'late', frame: 400, kind: 'hit' }] }, /after the last frame 359/);
  expectProblem('cues', { ...c, cues: [c.cues[1], c.cues[0]] }, /frame order/);
  expectProblem('cues', { ...c, key: 'H minor' }, /key does not match/);
  expectProblem('cues', { ...c, cues: [{ name: 'x', frame: 1.5, kind: 'hit' }] }, /must be integer/);
});

test('provenance rules', () => {
  const p = load('provenance');
  const a = p.assets[0];
  expectProblem('provenance', { ...p, assets: [{ ...a, method: 'generated' }] }, /need a model record/);
  expectProblem('provenance', { ...p, assets: [{ ...a, inputs: [{ kind: 'stock', name: 'photo', license: 'unknown' }] }] }, /unknown license/);
  expectProblem('provenance', { ...p, assets: [{ ...a, created: 'yesterday' }] }, /created does not match/);
});

test('brand.md rules', () => {
  const text = readFileSync(ex('brand'), 'utf8');
  assert.match(validateData('brand', text.replace(/^---[\s\S]*?---\n/, '')).join(' '), /frontmatter/);
  assert.match(validateData('brand', text.replace('## 9. Anti-patterns', '## 9. Things')).join(' '), /missing section "## Anti-patterns"/);
  assert.match(validateData('brand', text.replace(/#[0-9A-F]{6}/g, 'blue')).join(' '), /no concrete colour/);
});

test('validate tool: file, data, schema, and a clear error', async () => {
  const v = tools.validate;
  assert.equal((await v.run({ kind: 'beats', file: ex('beats') })).valid, true);
  const bad = await v.run({ kind: 'cues', data: { version: 1 } });
  assert.equal(bad.valid, false);
  assert.match(bad.problems.join(' '), /fps is required/);
  assert.equal((await v.run({ kind: 'brief', schema: true })).schema.title, 'Easel brief');
  assert.match((await v.run({ kind: 'brand', schema: true })).schema, /## 9\. Anti-patterns/);
  await assert.rejects(v.run({ kind: 'beats' }), /Give file or data/);
});
