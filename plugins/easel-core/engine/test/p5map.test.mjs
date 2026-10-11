// p5.js URLs the engine serves offline: any p5 1.x from cdnjs, jsdelivr or unpkg (query strings and
// bare package URLs too) maps to the installed 1.11.13; 2.x, "latest" and the p5.sound add-on are
// refused with a message instead of being silently swapped. Pure Node.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { p5Request } from '../lib/browser.mjs';

test('p5 1.x URLs map to the local copy; 2.x, latest and add-ons are refused with the reason', () => {
  const ok = {
    'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.13/p5.min.js': 'p5.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.js?v=3': 'p5.js',
    'https://cdn.jsdelivr.net/npm/p5@1.4.2/lib/p5.js': 'p5.js',
    'https://unpkg.com/p5@1.11.13/lib/p5.min.js#x': 'p5.min.js',
    'https://cdn.jsdelivr.net/npm/p5@1': 'p5.min.js',
    'https://unpkg.com/p5@1.11.1/': 'p5.min.js',
  };
  for (const [u, lib] of Object.entries(ok)) assert.deepEqual(p5Request(u), { lib }, u);
  for (const u of ['https://cdn.jsdelivr.net/npm/p5@2.0.0/lib/p5.min.js', 'https://unpkg.com/p5@latest/lib/p5.min.js', 'https://cdn.jsdelivr.net/npm/p5', 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/2.0.3/p5.min.js']) assert.match(p5Request(u).error, /serves p5\.js 1\.x/, u);
  assert.match(p5Request('https://cdn.jsdelivr.net/npm/p5@1.11.13/lib/addons/p5.sound.min.js').error, /p5\.sound/);
  assert.equal(p5Request('https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js'), null);
  assert.equal(p5Request('https://example.com/p5.min.js'), null);
});
