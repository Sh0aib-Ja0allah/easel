// Finds external programs (ffmpeg, ffprobe) without assuming any fixed install path.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { platform } from 'node:os';

function probe(cmd, env) {
  const r = spawnSync(cmd, ['-version'], { encoding: 'utf8', windowsHide: true, timeout: 15000, env });
  if (r.error || r.status !== 0) return null;
  return (r.stdout || '').split(/\r?\n/)[0].trim();
}

// On Windows a user-scope winget install only updates the user PATH, so a process started
// earlier (Claude Code) does not see it yet. Look in the winget package folder as a fallback.
function wingetCandidates(name, env) {
  const base = join(env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages');
  if (!env.LOCALAPPDATA || !existsSync(base)) return [];
  const out = [];
  for (const pkg of readdirSync(base).filter((d) => /^Gyan\.FFmpeg/i.test(d))) {
    const root = join(base, pkg);
    for (const sub of readdirSync(root)) {
      const exe = join(root, sub, 'bin', `${name}.exe`);
      if (existsSync(exe)) out.push(exe);
    }
  }
  return out;
}

const cache = new Map();
export function findBinary(name, env = process.env, os = platform()) {
  const key = `${name}|${env.PATH}|${os}`;
  if (cache.has(key)) return cache.get(key);
  let found = null;
  const override = env[`EASEL_${name.toUpperCase()}`];
  if (override && existsSync(override)) {
    const version = probe(override, env);
    if (version) found = { path: override, version, onPath: false };
  }
  if (!found) {
    const version = probe(name, env);
    if (version) found = { path: name, version, onPath: true };
  }
  if (!found && os === 'win32') {
    for (const exe of wingetCandidates(name, env)) {
      const version = probe(exe, env);
      if (version) { found = { path: exe, version, onPath: false }; break; }
    }
  }
  cache.set(key, found);
  return found;
}

export function installHint(name, os = platform()) {
  if (os === 'win32') return `${name} was not found. Install it with: winget install --id Gyan.FFmpeg -e   then restart Claude Code so it sees the new PATH.`;
  if (os === 'darwin') return `${name} was not found. Install it with: brew install ffmpeg`;
  return `${name} was not found. Install it with your package manager, e.g.: sudo apt install ffmpeg`;
}

export function requireBinary(name, env = process.env) {
  const b = findBinary(name, env);
  if (!b) throw new Error(installHint(name));
  return b.path;
}
