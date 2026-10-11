#!/usr/bin/env node
// Check SVG files before delivery: well-formed tags (single- or double-quoted attributes), xmlns and
// viewBox, no empty paths, no TODO or placeholder note in the text or comments, unique ids, an
// accessible name (title) or aria-hidden, no scripts, no external references; it warns on non-ASCII
// text without a UTF-8 declaration. --email also forbids <style>, animation, filters, <defs>,
// gradients and other #id references (mail clients drop them).
//   node svg-check.mjs <file.svg | folder> [more ...] [--email] [--json]
// Exit code 0 when every file passes, 1 when any fails, 2 on bad usage. Uses only Node built-ins.
// Easel: the checklist follows linyaosky/svg-skill @ 2103b92cb47f588a97a6c38aa6c40571fadbd4f8
// (github.com/linyaosky/svg-skill, SKILL.md "Quality checklist"; its validate.sh is bash and was not
// ported), MIT License, Copyright (c) 2026 svg-skill contributors; see NOTICE.md. This file is Easel's.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// One tag: <name attrs>, </name> or <name attrs/>. Attribute values are quoted with " or ' and may
// hold ">" (XML allows it; only "<" must be escaped), so a tag ends at the first ">" outside quotes.
const TAG = /<(\/?)([A-Za-z][\w:.-]*)((?:\s+[^\s"'=<>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'))?)*)\s*(\/?)\s*>/g;
const ATTR = /([^\s"'=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g;
const attrsOf = (s) => Object.fromEntries([...s.matchAll(ATTR)].map((m) => [m[1], m[2] ?? m[3] ?? '']));
const NUM = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/;
// a viewBox is four numbers (exponents allowed) with a positive width and height
const viewBoxOk = (v) => { const n = String(v ?? '').trim().split(/[\s,]+/); return n.length === 4 && n.every((x) => NUM.test(x)) && Number(n[2]) > 0 && Number(n[3]) > 0; };
const LEFTOVER = /\b(TODO|FIXME|placeholder)\b/i;
// definitions and the #id references that use them: several desktop mail clients drop them
const EMAIL_DEFS = new Set(['defs', 'linearGradient', 'radialGradient', 'pattern', 'clipPath', 'mask', 'marker', 'symbol', 'use']);

export function checkSvg(text, { email = false } = {}) {
  const problems = [], warnings = [];
  const src = text.replace(/^﻿/, '');
  const comments = [...src.matchAll(/<!--([\s\S]*?)-->/g)].map((m) => m[1]);
  const body = src.replace(/<!--[\s\S]*?-->/g, '').replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');
  const tags = [...body.matchAll(TAG)].map((m) => ({ raw: m[0], close: !!m[1], name: m[2], attrs: attrsOf(m[3]), self: !!m[4] }));
  // well-formed: every opened tag is closed in order, and no "<" is left outside a tag
  const stack = [];
  for (const tg of tags) {
    if (tg.close) { const top = stack.pop(); if (top !== tg.name) { problems.push(`tag </${tg.name}> closes <${top || 'nothing'}>`); break; } }
    else if (!tg.self) stack.push(tg.name);
  }
  if (stack.length) problems.push(`unclosed <${stack[stack.length - 1]}>`);
  const textOnly = body.replace(TAG, ' ').replace(/<\?[\s\S]*?\?>/g, ' ').replace(/<!DOCTYPE[^>]*>/gi, ' ');
  if (textOnly.includes('<')) problems.push('a "<" that is not a well-formed tag (a broken tag, or text that needs &lt;)');
  const root = tags.find((tg) => !tg.close && tg.name === 'svg');
  if (!root) return { pass: false, problems: ['no <svg> element'], warnings };
  if (root.attrs.xmlns !== 'http://www.w3.org/2000/svg') problems.push('the root <svg> has no xmlns="http://www.w3.org/2000/svg" (needed when the file is used on its own)');
  // A sprite sheet (only <symbol>s at the top level) is never drawn itself: its symbols need the
  // viewBox instead of the root.
  const inner = body.slice(body.indexOf(root.raw) + root.raw.length).replace(/<\/svg>\s*$/, '');
  const sheet = /<symbol\b/.test(inner) && !/<\w/.test(inner.replace(/<(symbol|defs|title|desc|style)\b[\s\S]*?<\/\1>/g, ''));
  if (sheet) { for (const s of tags.filter((tg) => !tg.close && tg.name === 'symbol')) if (!viewBoxOk(s.attrs.viewBox)) problems.push(`a <symbol>${s.attrs.id ? ` (#${s.attrs.id})` : ''} has no viewBox`); }
  else if (root.attrs.viewBox === undefined) problems.push('the root <svg> has no viewBox (it will not scale)');
  else if (!viewBoxOk(root.attrs.viewBox)) problems.push(`the root <svg> viewBox "${root.attrs.viewBox}" is not four numbers with a positive width and height`);
  // with no declaration XML is read as UTF-8, so non-ASCII text only needs the file saved as UTF-8
  if (/[^\x00-\x7F]/.test(src) && !/^<\?xml[^>]*encoding=["']UTF-8["']/i.test(src.trim())) warnings.push('non-ASCII text and no <?xml version="1.0" encoding="UTF-8"?>: save the file as UTF-8 (XML reads it as UTF-8 by default); add the declaration if a tool needs it');
  for (const tg of tags.filter((x) => !x.close && x.name === 'path')) if (!(tg.attrs.d || '').trim()) problems.push('an empty <path> (no d)');
  // a leftover note where people read it (text, comments, accessible labels), as a whole word; ids and classes are names, not notes
  if ([textOnly, ...comments, ...tags.map((tg) => tg.attrs['aria-label'] || '')].some((s) => LEFTOVER.test(s))) problems.push('a TODO or placeholder left in the file');
  if (/sodipodi:|inkscape:|sketch:|data-name="Layer/.test(body)) warnings.push('editor metadata left in the file');
  const ids = tags.filter((tg) => tg.attrs.id !== undefined).map((tg) => tg.attrs.id);
  const dup = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  if (dup.length) problems.push(`duplicate ids: ${dup.join(', ')}`);
  const refs = tags.flatMap((tg) => ['href', 'xlink:href'].map((k) => tg.attrs[k]).filter((v) => v !== undefined));
  for (const r of refs) if (r.startsWith('#') && !ids.includes(r.slice(1))) problems.push(`a reference to ${r}, which is not defined`);
  const urls = [...body.matchAll(/url\(\s*['"]?#([^)'"\s]+)['"]?\s*\)/g)].map((m) => m[1]);
  for (const u of urls) if (!ids.includes(u)) problems.push(`url(#${u}) is not defined`);
  const hidden = root.attrs['aria-hidden'] === 'true';
  const titled = /<title\b[^>]*>[^<]+<\/title>/.test(body) || !!(root.attrs['aria-label'] || '').trim();
  if (!hidden && !titled && !sheet) problems.push('no accessible name: add <title> (with role="img") or aria-hidden="true" for decoration');
  if (/<script\b/i.test(body) || tags.some((tg) => Object.keys(tg.attrs).some((k) => /^on\w+$/i.test(k)))) problems.push('scripts or event handlers (not allowed in delivered SVG)');
  for (const tg of tags) for (const k of ['href', 'xlink:href', 'src']) if (/^(?:https?:)?\/\//i.test(tg.attrs[k] || '')) problems.push(`external reference ${tg.attrs[k]} (embed it or draw it)`);
  if (/@import|url\((['"]?)(https?:)?\/\//.test(body)) problems.push('external CSS or url() reference');
  if (tags.some((tg) => tg.name === 'image')) warnings.push('an <image> element: a bitmap inside the SVG (fine only when asked for)');
  if (email) {
    if (/<style\b/.test(body)) problems.push('email: <style> is dropped by many mail clients; use attributes');
    if (/<animate|@keyframes|animation:/.test(body)) problems.push('email: animation is not supported');
    if (/<filter\b/.test(body)) problems.push('email: filters are not supported');
    const defs = [...new Set(tags.filter((tg) => !tg.close && EMAIL_DEFS.has(tg.name)).map((tg) => `<${tg.name}>`))];
    if (defs.length || urls.length || refs.some((r) => r.startsWith('#'))) problems.push(`email: ${defs.length ? defs.join(', ') : 'url(#...)'}: definitions and #id references are dropped by several desktop mail clients; draw plain shapes with flat fill and stroke attributes`);
    if (root.attrs.width === undefined || root.attrs.height === undefined) warnings.push('email: set width and height on the root <svg> (mail clients size it from them)');
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
