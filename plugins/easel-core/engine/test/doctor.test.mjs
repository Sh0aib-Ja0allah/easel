import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { after } from 'node:test';
import { doctorReport } from '../lib/doctor.mjs';
import { installHint } from '../lib/binaries.mjs';

const made = [];
const scratch = () => { const d = mkdtempSync(join(tmpdir(), 'easel-doctor-')); made.push(d); return d; };
after(() => { for (const d of made) rmSync(d, { recursive: true, force: true }); });

test('report shape: required checks present', () => {
  const r = doctorReport({ ...process.env, EASEL_DATA: scratch() });
  const names = r.checks.map((c) => c.name);
  for (const n of ['node', 'data dir', 'playwright-core', 'chromium', 'ffmpeg', 'ffprobe']) assert.ok(names.includes(n), n);
  assert.equal(typeof r.ok, 'boolean');
  for (const c of r.checks) if (!c.ok) assert.ok(c.fix, `${c.name} has a fix`);
});

test('missing ffmpeg gives a per-OS install hint and fails ok', () => {
  const r = doctorReport({ EASEL_DATA: scratch(), PATH: '', LOCALAPPDATA: '' });
  const ff = r.checks.find((c) => c.name === 'ffmpeg');
  assert.equal(ff.ok, false);
  assert.equal(r.ok, false);
  assert.match(ff.fix, /winget|brew|apt/);
});

test('install hints name the right tool per OS', () => {
  assert.match(installHint('ffmpeg', 'win32'), /winget install --id Gyan\.FFmpeg -e/);
  assert.match(installHint('ffmpeg', 'darwin'), /brew install ffmpeg/);
  assert.match(installHint('ffmpeg', 'linux'), /apt install ffmpeg/);
});

test('provider keys are reported by name, never by value', () => {
  const secret = 'sk-test-SECRET-VALUE-123';
  const r = doctorReport({ ...process.env, EASEL_DATA: scratch(), OPENAI_API_KEY: secret });
  const text = JSON.stringify(r);
  assert.ok(!text.includes(secret));
  assert.match(text, /OPENAI_API_KEY/);
});

test('optional checks do not affect ok', () => {
  const r = doctorReport({ ...process.env, EASEL_DATA: scratch() });
  const required = r.checks.filter((c) => c.required);
  assert.equal(r.ok, required.every((c) => c.ok));
});
