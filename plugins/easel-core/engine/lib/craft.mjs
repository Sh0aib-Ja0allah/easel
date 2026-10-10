// craft: serves the shared rulebooks (craft/) and critique rubrics (rubrics/) by name, so skills in
// any plugin can read them through the engine instead of by file path.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PLUGIN_DIR } from './paths.mjs';

const DIRS = { craft: join(PLUGIN_DIR, 'craft'), rubric: join(PLUGIN_DIR, 'rubrics') };

export function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (!kv) continue;
    const v = kv[2].trim();
    out[kv[1]] = v.startsWith('[') ? v.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean) : v.replace(/^["']|["']$/g, '');
  }
  return out;
}

export function listEntries(kind) {
  const dir = DIRS[kind];
  if (!dir || !existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'README.md').sort().map((f) => {
    const fm = frontmatter(readFileSync(join(dir, f), 'utf8'));
    return { name: f.replace(/\.md$/, ''), title: fm.title || f, appliesTo: fm.applies_to || [] };
  });
}

export function getEntry(kind, name) {
  if (!/^[a-z0-9-]+$/.test(name || '')) throw new Error(`Invalid ${kind} name: ${name}`);
  const file = join(DIRS[kind], `${name}.md`);
  if (!existsSync(file)) throw new Error(`No ${kind} named "${name}". Available: ${listEntries(kind).map((e) => e.name).join(', ') || 'none'}`);
  return readFileSync(file, 'utf8');
}

export async function craft(args = {}) {
  const kind = args.kind || 'craft';
  if (!args.name && !args.for) return { kind, available: listEntries(kind) };
  if (args.for) {
    const names = listEntries(kind).filter((e) => e.appliesTo.includes(args.for)).map((e) => e.name);
    return { kind, for: args.for, entries: names.map((n) => ({ name: n, text: getEntry(kind, n) })) };
  }
  return getEntry(kind, args.name);
}
