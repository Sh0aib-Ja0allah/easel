#!/usr/bin/env node
// Release check: run before tagging a release (not a per-commit gate). Claude Code updates an
// installed plugin only when its version changes, so a plugin whose files changed since its latest
// <plugin>--v<version> tag must carry a higher version, or the users of the tagged release never get
// the change and one version number names two different contents. For each plugin this compares
// plugins/<plugin>/ at HEAD with that tag and fails when:
//   - files differ but plugin.json still has the tag's version (bump it),
//   - the version is lower than the latest tag (it went backwards),
//   - the version is not plain semver (x.y.z).
// A plugin with no tag yet passes (its first release creates one). Between releases the check fails
// by design for every plugin with unreleased changes.
//
//   node scripts/release-check.mjs [--repo <folder>]
//     --repo  the Easel repository to check (default: the one holding this script)
//
// Exit 0 when every plugin passes, 1 when one fails, 2 when the check cannot run (no git, no tags:
// `git fetch --tags`, or a shallow clone without the tagged commits). Only HEAD is compared, not
// uncommitted changes. Node only, no dependencies; git through spawnSync with no shell, so it runs
// the same on Windows, macOS and Linux. Easel's own (MIT).
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
const REPO = resolve(arg('--repo') || fileURLToPath(new URL('..', import.meta.url)));
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;
const cmp = (a, b) => { const x = a.match(SEMVER).slice(1).map(Number), y = b.match(SEMVER).slice(1).map(Number); return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]; };

class CannotRun extends Error {}
const git = (...args) => {
  const r = spawnSync('git', args, { cwd: REPO, encoding: 'utf8', windowsHide: true, maxBuffer: 1 << 26 });
  if (r.error) throw new CannotRun(`git could not run (${r.error.code || r.error.message}); install git and try again`);
  if (r.status !== 0) throw new CannotRun(`git ${args.join(' ')} failed: ${(r.stderr || '').trim().split('\n').pop()}`);
  return r.stdout;
};

function check() {
  if (!existsSync(REPO)) throw new CannotRun(`${REPO} does not exist`);
  const plugins = git('ls-tree', '-d', '--name-only', 'HEAD', 'plugins/').split('\n').filter(Boolean).map((p) => p.slice('plugins/'.length));
  const rows = [];
  let anyTag = false;
  for (const name of plugins) {
    let manifest, version;
    try { manifest = git('show', `HEAD:plugins/${name}/.claude-plugin/plugin.json`); } catch { continue; } // not a plugin folder
    try { version = JSON.parse(manifest).version; } catch { version = '(unreadable plugin.json)'; }
    const tags = git('tag', '--list', `${name}--v*`).split('\n').filter(Boolean).map((t) => ({ t, v: t.slice(name.length + 3) })).filter((x) => SEMVER.test(x.v));
    anyTag ||= tags.length > 0;
    const latest = tags.sort((a, b) => cmp(b.v, a.v))[0];
    const row = { plugin: name, version: String(version ?? '(none)'), tag: latest ? latest.t : '-', changed: '-', ok: true, note: '' };
    rows.push(row);
    if (!SEMVER.test(row.version)) { Object.assign(row, { ok: false, note: `version ${row.version} is not plain semver (x.y.z)` }); continue; }
    if (!latest) { row.note = `no tag yet: tag ${name}--v${row.version} when it is released`; continue; }
    let changed;
    try { changed = git('diff', '--name-only', latest.t, 'HEAD', '--', `plugins/${name}`).split('\n').filter(Boolean).length; } catch (e) { throw new CannotRun(`${e.message} (a shallow clone? run git fetch --unshallow --tags)`); }
    row.changed = String(changed);
    const order = cmp(row.version, latest.v);
    if (order < 0) Object.assign(row, { ok: false, note: `version went backwards: ${row.version} is below the latest tag ${latest.v}` });
    else if (order === 0 && changed) Object.assign(row, { ok: false, note: `${changed} file(s) changed since ${latest.t} but the version is still ${row.version}: bump it` });
    else if (order === 0) row.note = `matches ${latest.t}`;
    else row.note = `release pending: tag ${name}--v${row.version} (claude plugin tag --push) when it is released`;
  }
  if (!rows.length) throw new CannotRun(`no plugins/<name>/.claude-plugin/plugin.json at HEAD in ${REPO}`);
  if (!anyTag) throw new CannotRun('no <plugin>--v<version> tags found: fetch them (git fetch --tags) and run again');
  return rows;
}

let rows;
try { rows = check(); } catch (e) {
  if (!(e instanceof CannotRun)) throw e;
  console.error(`release-check: ${e.message}`);
  process.exit(2);
}
const head = { plugin: 'plugin', version: 'version', tag: 'latest tag', changed: 'changed', result: 'result' };
const table = [head, ...rows.map((r) => ({ ...r, result: `${r.ok ? 'ok  ' : 'FAIL'}  ${r.note}` }))];
const width = (k) => Math.max(...table.map((r) => r[k].length));
for (const r of table) console.log([r.plugin.padEnd(width('plugin')), r.version.padEnd(width('version')), r.tag.padEnd(width('tag')), r.changed.padStart(width('changed')), r.result].join('  '));
if (git('status', '--porcelain', '--', 'plugins').trim()) console.log('\nnote: uncommitted changes under plugins/ are not part of this check (it compares HEAD)');
const failed = rows.filter((r) => !r.ok).length;
console.log(`\n${rows.length - failed}/${rows.length} plugins pass the release check`);
process.exit(failed ? 1 : 0);
