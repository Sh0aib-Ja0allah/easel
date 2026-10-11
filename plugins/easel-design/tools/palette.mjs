#!/usr/bin/env node
// An 11-step OKLCH colour scale (50-950) as sRGB hex, with WCAG contrast for each step on white and black.
//   node palette.mjs 250 0.15                          hue, chroma -> table
//   node palette.mjs --from "#2563eb"                  hue and chroma from a brand colour
//   node palette.mjs --from "#2563eb" --name brand --css    CSS custom properties
//   node palette.mjs 250 0.02 --name gray --json            JSON for tokens
//   node palette.mjs --contrast "#9aa4b2" "#ffffff"         WCAG contrast of one pair (an icon or a button on its ground)
// Steps keep the hue and taper chroma at the light and dark ends; an out-of-gamut colour loses chroma
// (never lightness or hue) until it fits sRGB. With --from, the brand colour itself is the step closest
// to its lightness, so the scale never moves it. Uses only Node built-ins.
// Easel: ported to Node from ArnavPuri/designskills @ c7873015add8571ca95043febad0d9e6c97ee5c6
// (github.com/ArnavPuri/designskills, skills/color-palette/scripts/palette.py), MIT License,
// Copyright (c) 2026 Arnav Puri; see NOTICE.md. Modified by Easel (2026-10-11): Node instead of Python.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// step: [OKLCH lightness, chroma factor]
export const STOPS = { 50: [0.97, 0.30], 100: [0.93, 0.40], 200: [0.87, 0.50], 300: [0.78, 0.70], 400: [0.68, 0.85], 500: [0.55, 1.00], 600: [0.48, 1.00], 700: [0.40, 1.00], 800: [0.32, 0.90], 900: [0.24, 0.80], 950: [0.16, 0.70] };

function linearRgb(L, C, H) {
  const a = C * Math.cos((H * Math.PI) / 180), b = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
}

export function oklchToHex(L, C, H) {
  while (C > 0 && !linearRgb(L, C, H).every((x) => x >= -1e-4 && x <= 1 + 1e-4)) C -= 0.002;   // out of gamut: less chroma, same L and H
  const enc = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
  return '#' + linearRgb(L, Math.max(C, 0), H).map((x) => Math.round(Math.min(1, Math.max(0, enc(x))) * 255).toString(16).padStart(2, '0')).join('');
}

// "#2563EB", "2563eb" or "#26e" -> "#2563eb"
export function normHex(hex) {
  const m = /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.exec(String(hex).trim());
  if (!m) throw new Error(`expected a hex colour like #2563eb, got ${JSON.stringify(hex)}`);
  return `#${(m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1]).toLowerCase()}`;
}

export function hexToOklch(hex) {
  const h = normHex(hex).slice(1);
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = [0, 2, 4].map((i) => lin(parseInt(h.slice(i, i + 2), 16) / 255));
  const cbrt = (x) => Math.sign(x) * Math.abs(x) ** (1 / 3);
  const l = cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), mm = cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.7936177850 * mm - 0.0040720468 * s, A = 1.9779984951 * l - 2.4285922050 * mm + 0.4505937099 * s, B = 0.0259040371 * l + 0.7827717662 * mm - 0.8086757660 * s;
  return [L, Math.hypot(A, B), (((Math.atan2(B, A) * 180) / Math.PI) % 360 + 360) % 360];
}

export function luminance(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function contrast(a, b) { const [hi, lo] = [luminance(normHex(a)), luminance(normHex(b))].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); }
const r2 = (x) => Math.round(x * 100) / 100;

export function buildScale(hue, chroma) {
  return Object.entries(STOPS).map(([step, [L, f]]) => {
    const hex = oklchToHex(L, chroma * f, hue);
    return { step: Number(step), hex, oklch: `oklch(${L.toFixed(2)} ${(chroma * f).toFixed(3)} ${hue.toFixed(1)})`, on_white: r2(contrast(hex, '#ffffff')), on_black: r2(contrast(hex, '#000000')) };
  });
}
export const grade = (r) => (r >= 4.5 ? 'AA' : r >= 3 ? 'large/UI' : '-');

export function main(argv) {
  const pos = [], opt = { name: 'brand' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--from' || a === '--name') { if (argv[i + 1] === undefined) throw new Error(`${a} needs a value`); opt[a.slice(2)] = argv[++i]; }
    else if (a === '--css' || a === '--json' || a === '--contrast') opt[a.slice(2)] = true;
    else if (a.startsWith('--')) throw new Error(`unknown option ${a} (use --from, --name, --css, --json, --contrast)`);
    else pos.push(a);
  }
  if (opt.contrast) {
    if (pos.length !== 2) throw new Error('--contrast takes two colours: FOREGROUND BACKGROUND (e.g. "#9aa4b2" "#ffffff")');
    const [fg, bg] = pos.map(normHex), r = r2(contrast(fg, bg));
    return { out: opt.json ? JSON.stringify({ fg, bg, contrast: r, grade: grade(r) }) : `${r.toFixed(2)}:1 ${grade(r)} (text needs 4.5, large text and non-text shapes 3)`, note: '' };
  }
  let hue, chroma, note = '', brand = null;
  if (opt.from) {
    const [L, C, H] = hexToOklch(opt.from); hue = H; chroma = C;
    const closest = Object.keys(STOPS).reduce((best, s) => (Math.abs(STOPS[s][0] - L) < Math.abs(STOPS[best][0] - L) ? s : best));
    brand = { step: Number(closest), hex: normHex(opt.from), oklch: `oklch(${L.toFixed(2)} ${C.toFixed(3)} ${H.toFixed(1)})` };
    note = `# ${opt.from} = ${brand.oklch}; kept exactly as step ${closest}`;
  } else if (pos.length === 2 && pos.every((x) => Number.isFinite(Number(x)))) { hue = Number(pos[0]); chroma = Number(pos[1]); }
  else throw new Error('give HUE CHROMA (e.g. 250 0.15), --from HEX, or --contrast FG BG');
  // the brand colour replaces the step nearest its lightness, so tokens built on the scale keep the exact brand hex
  const scale = buildScale(hue, chroma).map((s) => (brand && s.step === brand.step ? { ...brand, on_white: r2(contrast(brand.hex, '#ffffff')), on_black: r2(contrast(brand.hex, '#000000')) } : s));
  if (opt.json) return { out: JSON.stringify({ [opt.name]: scale }, null, 2), note };
  if (opt.css) return { out: [':root {', ...scale.map((s) => `  --${opt.name}-${s.step}: ${s.hex};  /* ${s.oklch} */`), '}'].join('\n'), note };
  const rows = scale.map((s) => `${String(s.step).padStart(4)}  ${s.hex.padEnd(8)} ${s.on_white.toFixed(2).padStart(6)} ${grade(s.on_white).padStart(7)} ${s.on_black.toFixed(2).padStart(6)} ${grade(s.on_black).padStart(7)}`);
  return { out: [`${'step'.padStart(4)}  ${'hex'.padEnd(8)} ${'on white'.padStart(14)} ${'on black'.padStart(14)}`, ...rows].join('\n'), note };
}

const isMain = (() => { try { const a = fs.realpathSync(process.argv[1]), b = fs.realpathSync(fileURLToPath(import.meta.url)); return process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b; } catch { return false; } })();
if (isMain) {
  try { const { out, note } = main(process.argv.slice(2)); if (note) console.error(note); console.log(out); } catch (e) { console.error(e.message); process.exit(2); }
}
