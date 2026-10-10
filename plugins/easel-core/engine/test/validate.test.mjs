import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateArgs } from '../lib/validate.mjs';

const schema = {
  type: 'object', required: ['name', 'size'], additionalProperties: false,
  properties: {
    name: { type: 'string', minLength: 1, pattern: '^[a-z-]+$' },
    size: { type: 'integer', minimum: 1, maximum: 4096 },
    theme: { enum: ['light', 'dark', 'both'] },
    tags: { type: 'array', items: { type: 'string' }, maxItems: 2 },
    when: { $ref: '#/$defs/time' },
    any: { anyOf: [{ type: 'string' }, { type: 'number' }] },
  },
  $defs: { time: { type: 'number', minimum: 0 } },
};

test('valid input passes', () => {
  assert.deepEqual(validateArgs(schema, { name: 'logo', size: 512, theme: 'dark', tags: ['a'], when: 1.5, any: 3 }), []);
});

test('each rule reports a problem', () => {
  const cases = [
    [{ size: 1 }, /name is required/],
    [{ name: 'A', size: 1 }, /does not match/],
    [{ name: 'a', size: 1.5 }, /must be integer/],
    [{ name: 'a', size: 0 }, />= 1/],
    [{ name: 'a', size: 5000 }, /<= 4096/],
    [{ name: 'a', size: 1, theme: 'blue' }, /one of/],
    [{ name: 'a', size: 1, tags: ['a', 'b', 'c'] }, /at most 2/],
    [{ name: 'a', size: 1, tags: [1] }, /tags\[0\] must be string/],
    [{ name: 'a', size: 1, extra: 1 }, /not an allowed property/],
    [{ name: 'a', size: 1, when: -1 }, />= 0/],
    [{ name: 'a', size: 1, any: true }, /matches none/],
    ['x', /must be object/],
  ];
  for (const [value, re] of cases) assert.match(validateArgs(schema, value).join('; '), re, JSON.stringify(value));
});
