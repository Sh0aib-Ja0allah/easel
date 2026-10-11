#!/usr/bin/env node
// Check SVG files before delivery: well-formed tags, xmlns and viewBox, UTF-8 declaration for
// non-ASCII text, no empty or placeholder paths, unique ids, an accessible name (title) or
// aria-hidden, no scripts, no external references; --email also forbids <style>, animation and
// filters (mail clients drop them).
//   node svg-check.mjs <file.svg | folder> [more ...] [--email] [--json]
// Exit code 0 when every file passes, 1 when any fails, 2 on bad usage. Uses only Node built-ins.
// Easel: the checklist follows linyaosky/svg-skill @ 2103b92cb47f588a97a6c38aa6c40571fadbd4f8
// (github.com/linyaosky/svg-skill, SKILL.md "Quality checklist"; its validate.sh is bash and was not
// ported), MIT License, Copyright (c) 2026 svg-skill contributors; see NOTICE.md. This file is Easel's.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const VOID_OK = /\/\s*$/;
export function checkSvg(text, { email = false } = {}) {
  const problems = [], warnings = [];
  const src = text.replace(/^﻿/, '');
  const body = src.replace(/<!--[\s\S]*?-->/g, '').replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');
  // well-formed: every opened tag is closed in order
  const stack = [];
  for (const m of body.matchAll(/<(\/?)([A-Za-z][\w:.-]*)([^<>]*?)(\/?)>/g)) {
    const [, close, name, attrs, selfClose] = m;
    if (close) { const top = stack.pop(); if (top !== name) { problems.push(`tag </${name}> closes <${top || 'nothing'}>`); break; } }
    else if (!selfClose && !VOID_OK.test(attrs)) stack.push(name);
  }
  if (stack.length) problems.push(`unclosed <${stack[stack.length - 1]}>`);
  const root = /<svg\b([^>]*)>/.exec(body);
  if (!root) return { pass: false, problems: ['no <svg> element'], warnings };
  if (!/\bxmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(root[1])) problems.push('the root <svg> has no xmlns="http://www.w3.org/2000/svg" (needed when the file is used on its own)');
  if (!/\bviewBox="[-\d.\s,]+"/.test(root[1])) problems.push('the root <svg> has no viewBox (it will not scale)');
  if (/[^\x00-\x7F]/.test(body.replace(/<[^>]*>/g, '')) && !/^<\?xml[^>]*encoding="UTF-8"/i.test(src.trim())) problems.push('non-ASCII text without <?xml version="1.0" encoding="UTF-8"?> first');
  for (const m of body.matchAll(/<path\b([^>]*)>/g)) { const d = /\bd="([^"]*)"/.exec(m[1]); if (!d || !d[1].trim()) problems.push('an empty <path> (no d)'); }
  if (/\b(TODO|FIXME|placeholder)\b/i.test(body)) problems.push('a TODO or placeholder left in the file');
  if (/sodipodi:|inkscape:|sketch:|data-name="Layer/.test(body)) warnings.push('editor metadata left in the file');
  const ids = [...body.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  const dup = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  if (dup.length) problems.push(`duplicate ids: ${dup.join(', ')}`);
  for (const m of body.matchAll(/\b(?:href|xlink:href)="#([^"]+)"/g)) if (!ids.includes(m[1])) problems.push(`a reference to #${m[1]}, which is not defined`);
  for (const m of body.matchAll(/url\(#([^)]+)\)/g)) if (!ids.includes(m[1])) problems.push(`url(#${m[1]}) is not defined`);
  const hidden = /\baria-hidden="true"/.test(root[1]);
  const titled = /<title\b[^>]*>[^<]+<\/title>/.test(body) || /\baria-label="[^"]+"/.test(root[1]);
  if (!hidden && !titled) problems.push('no accessible name: add <title> (with role="img") or aria-hidden="true" for decoration');
  if (/<script\b/i.test(body) || /\son\w+="/i.test(body)) problems.push('scripts or event handlers (not allowed in delivered SVG)');
  for (const m of body.matchAll(/\b(?:href|xlink:href|src)="((?:https?:)?\/\/[^"]+)"/g)) problems.push(`external reference ${m[1]} (embed it or draw it)`);
  if (/@import|url\((['"]?)(https?:)?\/\//.test(body)) problems.push('external CSS or url() reference');
  if (/<image\b/.test(body)) warnings.push('an <image> element: a bitmap inside the SVG (fine only when asked for)');
  if (email) {
    if (/<style\b/.test(body)) problems.push('email: <style> is dropped by many mail clients; use attributes');
    if (/<animate|@keyframes|animation:/.test(body)) problems.push('email: animation is not supported');
    if (/<filter\b/.test(body)) problems.push('email: filters are not supported');
  }
  return { pass: problems.length === 0, problems, warnings };
}

export function checkPaths(inputs, opts) {
  const files = inputs.flatMap((p) => (fs.statSync(p).isDirectory() ? fs.readdirSync(p, { recursive: true }).map((f) => path.join(p, f)).filter((f) => f.toLowerCase().endsWith('.svg')) : [p]));
  return files.sort().map((f) => ({ file: f, ...checkSvg(fs.readFileSync(f, 'utf8'), opts) }));
}

const isMain = (() => { try { const a = fs.realpathSync(process.argv[1]), b = fs.realpathSync(fileURLToPath(import.meta.url)); return process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b; } catch { return false; } })();
if (isMain) {
  const args = process.argv.slice(2), flags = args.filter((a) => a.startsWith('--')), inputs = args.filter((a) => !a.startsWith('--'));
  const bad = flags.filter((f) => !['--email', '--json'].includes(f));
  if (!inputs.length || bad.length) { console.error(`usage: node svg-check.mjs <file.svg | folder> [...] [--email] [--json]${bad.length ? ` (unknown: ${bad.join(' ')})` : ''}`); process.exit(2); }
  for (const p of inputs) if (!fs.existsSync(p)) { console.error(`not found: ${p}`); process.exit(2); }
  const results = checkPaths(inputs, { email: flags.includes('--email') });
  if (flags.includes('--json')) console.log(JSON.stringify(results, null, 2));
  else for (const r of results) console.log(`${r.pass ? 'ok  ' : 'FAIL'} ${r.file}${[...r.problems, ...r.warnings.map((w) => `(warn) ${w}`)].map((x) => `\n     - ${x}`).join('')}`);
  if (!results.length) { console.error('no .svg files found'); process.exit(2); }
  process.exit(results.every((r) => r.pass) ? 0 : 1);
}
