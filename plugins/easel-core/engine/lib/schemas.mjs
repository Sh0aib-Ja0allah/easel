// Validators for Easel's shared data files: brief.json, beats.json, cues.json, provenance.json
// (JSON Schema plus cross-field rules) and .easel/brand.md (DESIGN.md sections).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PLUGIN_DIR } from './paths.mjs';
import { validateArgs } from './validate.mjs';

export const SCHEMA_DIR = join(PLUGIN_DIR, 'schemas');
export const KINDS = ['brief', 'beats', 'cues', 'provenance', 'brand'];
export const BRAND_SECTIONS = ['Visual Theme & Atmosphere', 'Color', 'Typography', 'Spacing & Grid', 'Layout & Composition', 'Components', 'Motion & Interaction', 'Voice & Brand', 'Anti-patterns'];

export function loadSchema(kind) {
  if (kind === 'brand') return readFileSync(join(SCHEMA_DIR, 'brand.template.md'), 'utf8');
  return JSON.parse(readFileSync(join(SCHEMA_DIR, `${kind}.schema.json`), 'utf8'));
}

function crossChecks(kind, d) {
  const p = [];
  if (kind === 'beats' && Array.isArray(d.beats)) {
    const seen = new Set();
    for (const b of d.beats) { if (seen.has(b.id)) p.push(`beat id "${b.id}" is used twice`); seen.add(b.id); }
    const sum = d.beats.reduce((s, b) => s + (Number(b.durationSec) || 0), 0);
    if (typeof d.totalSec === 'number' && Math.abs(sum - d.totalSec) > Math.max(0.05, d.totalSec * 0.01)) p.push(`beat durations add up to ${+sum.toFixed(2)} s but totalSec is ${d.totalSec}`);
  }
  if (kind === 'cues' && Array.isArray(d.cues) && typeof d.fps === 'number' && typeof d.durationSec === 'number') {
    const last = Math.round(d.fps * d.durationSec) - 1;
    for (const c of d.cues) if (Number.isInteger(c.frame) && c.frame > last) p.push(`cue "${c.name}" is at frame ${c.frame}, after the last frame ${last}`);
    for (let i = 1; i < d.cues.length; i++) if (d.cues[i].frame < d.cues[i - 1].frame) { p.push('cues must be in frame order'); break; }
  }
  if (kind === 'brief' && d.checkins) {
    const order = ['story', 'look', 'storyboard'];
    for (let i = 1; i < order.length; i++) if (d.checkins[order[i]] === 'approved' && d.checkins[order[i - 1]] !== 'approved' && d.checkins[order[i - 1]] !== 'skipped') p.push(`check-in "${order[i]}" is approved before "${order[i - 1]}"`);
  }
  if (kind === 'provenance' && Array.isArray(d.assets)) {
    for (const a of d.assets) {
      if (a.method === 'generated' && !a.model) p.push(`${a.file}: generated assets need a model record`);
      for (const i of a.inputs || []) if (i.license === 'unknown') p.push(`${a.file}: input "${i.name}" has an unknown license; trace it or remove it`);
    }
  }
  return p;
}

export function validateBrand(text) {
  const problems = [];
  const body = text.replace(/^﻿/, '');
  const fm = body.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) problems.push('missing YAML frontmatter with at least name:');
  else if (!/^name:\s*\S/m.test(fm[1])) problems.push('frontmatter needs name:');
  const headings = [...body.matchAll(/^##\s+(?:\d+\.\s*)?(.+?)\s*$/gm)].map((m) => m[1].trim().toLowerCase());
  for (const s of BRAND_SECTIONS) if (!headings.includes(s.toLowerCase())) problems.push(`missing section "## ${s}"`);
  const section = (name) => { const m = body.match(new RegExp(`^##\\s+(?:\\d+\\.\\s*)?${name.replace(/[&]/g, '\\$&')}\\s*$([\\s\\S]*?)(?=^##\\s|(?![\\s\\S]))`, 'mi')); return m ? m[1] : ''; };
  if (!/(#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|oklch\(|rgb\()/.test(section('Color'))) problems.push('Color section has no concrete colour value (hex, rgb() or oklch())');
  if (!/[A-Z][\w ]+\s(\d{3}|regular|bold)|font|serif|sans|mono/i.test(section('Typography'))) problems.push('Typography section names no typeface');
  return problems;
}

export function validateData(kind, data) {
  if (!KINDS.includes(kind)) throw new Error(`Unknown kind ${kind}; use one of ${KINDS.join(', ')}`);
  if (kind === 'brand') return validateBrand(String(data));
  const schema = loadSchema(kind);
  const problems = validateArgs(schema, data);
  return problems.length ? problems : crossChecks(kind, data);
}

export function validateFile(kind, file) {
  const text = readFileSync(file, 'utf8').replace(/^﻿/, '');
  if (kind === 'brand') return validateData('brand', text);
  let data;
  try { data = JSON.parse(text); } catch (e) { return [`not valid JSON: ${e.message}`]; }
  return validateData(kind, data);
}
