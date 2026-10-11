#!/usr/bin/env node
// Check SVG files before delivery: well-formed XML (tags closed in order, entities XML knows, each
// attribute once with a quoted value and no "<" in it, no "--" in comments, the XML declaration
// first, namespace prefixes declared), xmlns and viewBox, no empty paths, no leftover TODO or
// placeholder note, unique ids, an accessible name (title) or aria-hidden, no scripts or
// javascript: links, no external references (also in CDATA styles and <?xml-stylesheet?>); it warns
// on non-ASCII text without a UTF-8 declaration. --email also forbids <style>, animation (<set>
// too), filters, <foreignObject>, <defs>, gradients and other #id references (mail clients drop them).
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
// A leftover note: any TODO, FIXME or placeholder in a comment; in the text people read only a
// note-shaped one ("TODO: copy", FIXME, "[placeholder]", lorem ipsum, a label that is only the
// word), so an honest name such as "Todo list" or "Image placeholder" passes.
const NOTE_WORD = /\b(TODO|FIXME|placeholder)\b/i;
const NOTE_TEXT = /\bTODO\s*[:(]|\bFIXME\b|\[[^\]]*\b(?:placeholder|todo)\b[^\]]*\]|\blorem ipsum\b|^\s*(?:TODO|placeholder)\W*$/i;
// definitions and the #id references that use them: several desktop mail clients drop them
const EMAIL_DEFS = new Set(['defs', 'linearGradient', 'radialGradient', 'pattern', 'clipPath', 'mask', 'marker', 'symbol', 'use']);

// XML well-formedness. The engine draws an SVG inside an HTML page, which forgives these errors, but
// the delivered file opened on its own or in an <img> shows an XML error page instead of the picture.
const ENTITY = /&(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/y;
// HTML-only entities people reach for, with the numeric reference XML accepts
const HTML_ENTITIES = { nbsp: 160, copy: 169, reg: 174, deg: 176, middot: 183, times: 215, ndash: 8211, mdash: 8212, lsquo: 8216, rsquo: 8217, ldquo: 8220, rdquo: 8221, bull: 8226, hellip: 8230, euro: 8364, trade: 8482, larr: 8592, rarr: 8594 };
function xmlProblems(src) {
  const problems = [], at = (i) => `not well-formed XML (line ${src.slice(0, i).split('\n').length})`;
  const blank = (x) => x.replace(/[^\n]/g, ' ');
  for (const m of src.matchAll(/<!--([\s\S]*?)-->/g)) if (/--|-$/.test(m[1])) problems.push(`${at(m.index)}: a comment holds "--" (or ends in "--->"), which XML forbids in comments: use one dash`);
  // comments and CDATA may hold anything: blank them (line breaks kept, so lines still count)
  let s = src.replace(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>/g, blank);
  for (const m of s.matchAll(/<\?xml(?=[\s?])/gi)) if (m.index > 0) problems.push(`${at(m.index)}: the XML declaration <?xml ...?> is not at the very start of the file: make it the first character, before any comment, blank line or space`);
  const declared = new Set();
  s = s.replace(/<!DOCTYPE(?:[^[>]|\[[\s\S]*?\])*>/gi, (d) => { for (const [, n] of d.matchAll(/<!ENTITY\s+([\w.:-]+)/g)) declared.add(n); return blank(d); }).replace(/<\?[\s\S]*?\?>/g, blank);
  for (let i = s.indexOf('&'); i !== -1; i = s.indexOf('&', i + 1)) {
    ENTITY.lastIndex = i;
    if (ENTITY.test(s)) continue;
    const name = /^&([A-Za-z][\w.:-]*);/.exec(s.slice(i, i + 40))?.[1];
    if (name && declared.has(name)) continue;
    const code = HTML_ENTITIES[name];
    problems.push(name ? `${at(i)}: &${name}; is an HTML entity XML does not know: write the character itself or a numeric reference (${code ? `&#${code};` : 'its Unicode number, e.g. &#160; for a no-break space'})` : `${at(i)}: a bare "&" (as in "R&D"): write &amp; ("R&amp;D")`);
  }
  // each attribute once, with a quoted value and no "<" in it; every prefix declared by an xmlns:
  // on the element or an ancestor (xlink:href needs xmlns:xlink)
  const scopes = [];
  for (const m of s.matchAll(TAG)) {
    if (m[1]) { scopes.pop(); continue; }
    const name = m[2], attrs = [...m[3].matchAll(ATTR)], scope = new Set(scopes.at(-1) || ['xml', 'xmlns']), seen = new Set();
    for (const [, k] of attrs) if (k.startsWith('xmlns:')) scope.add(k.slice(6));
    for (const [, k, dq, sq] of attrs) {
      const v = dq ?? sq;
      if (seen.has(k)) problems.push(`${at(m.index)}: <${name}> has the attribute "${k}" twice: keep one`);
      seen.add(k);
      if (v === undefined) problems.push(`${at(m.index)}: the attribute "${k}" on <${name}> has no value: write ${k}="..."`);
      else if (v.includes('<')) problems.push(`${at(m.index)}: a "<" inside the value of ${k} on <${name}>: write &lt;`);
    }
    for (const q of [name, ...attrs.map((a) => a[1])]) {
      const p = q.includes(':') ? q.split(':')[0] : null;
      if (p && !scope.has(p)) problems.push(`${at(m.index)}: the prefix "${p}:" in ${q} is not declared: ${p === 'xlink' ? 'add xmlns:xlink="http://www.w3.org/1999/xlink" to the root, or write plain href' : `add xmlns:${p}="..." to the root, or remove it`}`);
    }
    if (!m[4]) scopes.push(scope);
  }
  return [...new Set(problems)];
}

export function checkSvg(text, { email = false } = {}) {
  const problems = [], warnings = [];
  const src = text.replace(/^﻿/, '');
  problems.push(...xmlProblems(src));
  const comments = [...src.matchAll(/<!--([\s\S]*?)-->/g)].map((m) => m[1]);
  const body = src.replace(/<!--[\s\S]*?-->/g, '').replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');
  // CSS in CDATA can still load or reference things: the url() and @import checks read it too
  const css = [body, ...[...src.matchAll(/<!\[CDATA\[([\s\S]*?)\]\]>/g)].map((m) => m[1])].join('\n');
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
  // a leftover note: in a comment, or note-shaped in a text node or an accessible label; ids and classes are names, not notes
  const texts = body.replace(TAG, '\0').replace(/<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>/gi, '\0').split('\0');
  if (comments.some((c) => NOTE_WORD.test(c)) || [...texts, ...tags.map((tg) => tg.attrs['aria-label'] || '')].some((x) => NOTE_TEXT.test(x))) problems.push('a TODO or placeholder left in the file');
  if (/sodipodi:|inkscape:|sketch:|data-name="Layer/.test(body)) warnings.push('editor metadata left in the file');
  const ids = tags.filter((tg) => tg.attrs.id !== undefined).map((tg) => tg.attrs.id);
  const dup = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  if (dup.length) problems.push(`duplicate ids: ${dup.join(', ')}`);
  const refs = tags.flatMap((tg) => ['href', 'xlink:href'].map((k) => tg.attrs[k]).filter((v) => v !== undefined));
  for (const r of refs) if (r.startsWith('#') && !ids.includes(r.slice(1))) problems.push(`a reference to ${r}, which is not defined`);
  const urls = [...css.matchAll(/url\(\s*['"]?#([^)'"\s]+)['"]?\s*\)/g)].map((m) => m[1]);
  for (const u of urls) if (!ids.includes(u)) problems.push(`url(#${u}) is not defined`);
  const hidden = root.attrs['aria-hidden'] === 'true';
  const titled = /<title\b[^>]*>[^<]+<\/title>/.test(body) || !!(root.attrs['aria-label'] || '').trim();
  if (!hidden && !titled && !sheet) problems.push('no accessible name: add <title> (with role="img") or aria-hidden="true" for decoration');
  if (/<script\b/i.test(body) || tags.some((tg) => Object.keys(tg.attrs).some((k) => /^on\w+$/i.test(k)))) problems.push('scripts or event handlers (not allowed in delivered SVG)');
  if (tags.some((tg) => Object.values(tg.attrs).some((v) => /^\s*javascript:/i.test(v)))) problems.push('a javascript: link (a script; not allowed in delivered SVG)');
  for (const tg of tags) for (const k of ['href', 'xlink:href', 'src']) if (/^(?:https?:)?\/\//i.test(tg.attrs[k] || '')) problems.push(`external reference ${tg.attrs[k]} (embed it or draw it)`);
  if (/@import|url\(\s*['"]?\s*(?:https?:)?\/\//i.test(css)) problems.push('external CSS or url() reference (put the CSS in the file, or draw it)');
  if (/<\?xml-stylesheet\b/i.test(body)) problems.push('an external stylesheet (<?xml-stylesheet?>): put the CSS in a <style> or in attributes');
  if (tags.some((tg) => tg.name === 'image')) warnings.push('an <image> element: a bitmap inside the SVG (fine only when asked for)');
  if (email) {
    if (/<style\b/.test(body)) problems.push('email: <style> is dropped by many mail clients; use attributes');
    if (/<animate|<set\b|@keyframes|animation:/.test(css)) problems.push('email: animation is not supported');
    if (tags.some((tg) => tg.name === 'foreignObject')) problems.push('email: <foreignObject> (HTML inside the SVG) is not shown by mail clients; draw it with shapes and <text>');
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
