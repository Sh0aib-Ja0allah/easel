// Every plugin's eval cases load: claude plugin eval parses prompt.md frontmatter as YAML, and an
// unquoted value with ": " in it fails the whole case (it happened in the v0.2.0 run). Pure Node.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PLUGINS = fileURLToPath(new URL('../../../', import.meta.url));

test('eval case frontmatter is plain YAML: quoted when a value holds ": ", required keys, graders present', () => {
  let cases = 0;
  for (const p of readdirSync(PLUGINS).filter((d) => existsSync(join(PLUGINS, d, 'evals')))) {
    for (const c of readdirSync(join(PLUGINS, p, 'evals'), { withFileTypes: true }).filter((e) => e.isDirectory() && !['mocks', 'results'].includes(e.name))) {
      const f = join(PLUGINS, p, 'evals', c.name, 'prompt.md');
      assert.ok(existsSync(f), `${p}/${c.name}: prompt.md`);
      const m = /^---\n([\s\S]*?)\n---\n\s*\S/.exec(readFileSync(f, 'utf8'));
      assert.ok(m, `${p}/${c.name}: frontmatter and a prompt`);
      const keys = {};
      for (const line of m[1].split('\n')) {
        const k = /^([a-z_]+): (.*)$/.exec(line);
        assert.ok(k, `${p}/${c.name}: "${line}"`);
        keys[k[1]] = k[2];
        if (!/^["'[{]/.test(k[2])) assert.doesNotMatch(k[2], /: |#/, `${p}/${c.name}: quote the ${k[1]} value`);
      }
      for (const k of ['description', 'runs', 'max_turns', 'allowed_tools']) assert.ok(k in keys, `${p}/${c.name}: ${k}`);
      const graders = readdirSync(join(PLUGINS, p, 'evals', c.name, 'graders')).filter((g) => g.endsWith('.md'));
      assert.ok(graders.length, `${p}/${c.name}: graders`);
      for (const g of graders) {
        const gm = /^---\n([\s\S]*?)\n---\n/.exec(readFileSync(join(PLUGINS, p, 'evals', c.name, 'graders', g), 'utf8'));
        assert.ok(gm, `${p}/${c.name}/${g}: frontmatter`);
        for (const line of gm[1].split('\n')) {
          const k = /^([a-z_]+): (.*)$/.exec(line);
          assert.ok(k, `${p}/${c.name}/${g}: "${line}"`);
          const v = k[2];
          if (v.startsWith("'")) assert.ok(v.endsWith("'") && !/'/.test(v.slice(1, -1).replace(/''/g, '')), `${p}/${c.name}/${g}: a single-quoted YAML value escapes ' as '' (not \\'): ${v}`);
          else if (!/^["[{]/.test(v)) assert.doesNotMatch(v, /: |#/, `${p}/${c.name}/${g}: quote the ${k[1]} value`);
        }
      }
      cases++;
    }
  }
  assert.ok(cases >= 30, `${cases} cases`);
});

test('plugins that depend on easel-core load it in every eval case and carry the same engine mocks', () => {
  const core = join(PLUGINS, 'easel-core', 'evals', 'mocks', 'easel');
  for (const p of readdirSync(PLUGINS).filter((d) => d !== 'easel-core' && existsSync(join(PLUGINS, d, 'evals')))) {
    const dir = join(PLUGINS, p, 'evals');
    for (const c of readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory() && !['mocks', 'results'].includes(e.name))) {
      assert.match(readFileSync(join(dir, c.name, 'prompt.md'), 'utf8'), /^plugins: \["\.\.\/\.\.", "\.\.\/\.\.\/\.\.\/easel-core"\]$/m, `${p}/${c.name}`);
    }
    for (const f of readdirSync(core)) assert.equal(readFileSync(join(dir, 'mocks', 'easel', f), 'utf8'), readFileSync(join(core, f), 'utf8'), `${p}: mocks/easel/${f} differs from easel-core's`);
  }
});

test('the eval mocks describe the engine as it is: _tools.json matches tools.mjs, and every tool has a mock', async () => {
  const { tools } = await import('../tools.mjs');
  const mocks = join(PLUGINS, 'easel-core', 'evals', 'mocks', 'easel');
  const listed = JSON.parse(readFileSync(join(mocks, '_tools.json'), 'utf8')).tools;
  assert.deepEqual(listed, Object.entries(tools).map(([name, t]) => ({ name, description: t.description, inputSchema: t.inputSchema })), 'regenerate evals/mocks/easel/_tools.json from tools.mjs');
  for (const name of Object.keys(tools)) assert.ok(existsSync(join(mocks, `${name}.md`)), `mocks/easel/${name}.md`);
});
