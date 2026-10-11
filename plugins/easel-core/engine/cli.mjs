#!/usr/bin/env node
// Easel engine CLI: the same tools as the MCP server, for long jobs and scripting.
// Usage: node cli.mjs <tool> [--json '{"key":"value"}'] [--key value ...]
//        node cli.mjs <tool> --json @args.json     (read arguments from a file; easiest on Windows)
//        node cli.mjs list
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { tools } from './tools.mjs';
import { validateArgs } from './lib/validate.mjs';

// A flag's value is a string. With the tool's schema it becomes what the schema asks for: a number
// only for number/integer keys (so --slug 007 stays "007"), a boolean for boolean keys, parsed JSON
// for object/array keys. Without a schema (an unknown key or tool) it is guessed as before.
function coerce(v, type) {
  if (v === undefined) return true;
  const types = type === undefined ? null : [].concat(type);
  const can = (t) => !types || types.includes(t);
  if (can('boolean') && (v === 'true' || v === 'false')) return v === 'true';
  if ((can('number') || can('integer')) && /^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if ((can('object') || can('array')) && /^[[{]/.test(v)) { try { return JSON.parse(v); } catch { /* keep as string */ } }
  return v;
}

// Keys that would reach Object.prototype instead of the arguments (and so skip validation).
const FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype']);

function parseJson(value) {
  const text = typeof value === 'string' && value.startsWith('@') ? readFileSync(value.slice(1), 'utf8').replace(/^\uFEFF/, '') : value;
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`--json is not valid JSON (${err.message}). Windows PowerShell 5.1 drops the double quotes inside arguments; put the JSON in a file and pass --json @file.json`);
  }
}

// Flags arrive as strings and are guessed into numbers or booleans; turn them back into strings
// where the tool's schema wants a string (e.g. --slug 2026).
export function coerceToSchema(schema, args) {
  const props = (schema && schema.properties) || {};
  for (const [k, v] of Object.entries(args)) {
    const t = props[k] && props[k].type;
    const wantsString = t === 'string' || (Array.isArray(t) && t.includes('string') && !t.includes(typeof v));
    if (wantsString && (typeof v === 'number' || typeof v === 'boolean')) args[k] = String(v);
  }
  return args;
}

export function parseArgs(argv) {
  const [name, ...rest] = argv;
  const props = (Object.hasOwn(tools, name || '') && tools[name].inputSchema.properties) || null;
  const args = {};
  const set = (k, v) => { if (FORBIDDEN.has(k)) throw new Error(`Argument name not allowed: ${k}`); args[k] = v; };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (!a.startsWith('--')) throw new Error(`Unexpected argument: ${a}`);
    const key = a.slice(2);
    const next = rest[i + 1];
    const value = next !== undefined && !next.startsWith('--') ? (i++, next) : undefined;
    if (key === 'json') {
      const j = parseJson(value);
      if (!j || typeof j !== 'object' || Array.isArray(j)) throw new Error('--json must be a JSON object');
      for (const [k, v] of Object.entries(j)) set(k, v);
    } else {
      const k = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      set(k, coerce(value, props && Object.hasOwn(props, k) ? props[k].type : undefined));
    }
  }
  return { name, args };
}

export async function main(argv = process.argv.slice(2)) {
  let name, args;
  try {
    ({ name, args } = parseArgs(argv));
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    return 2;
  }
  if (!name || name === 'list' || name === '--help') {
    process.stdout.write(Object.entries(tools).map(([n, t]) => `${n.padEnd(16)} ${t.description.split('. ')[0]}`).join('\n') + '\n');
    return 0;
  }
  if (!Object.hasOwn(tools, name)) { process.stderr.write(`Unknown tool: ${name}. Run: node cli.mjs list\n`); return 2; }
  coerceToSchema(tools[name].inputSchema, args);
  const problems = validateArgs(tools[name].inputSchema, args);
  if (problems.length) { process.stderr.write(`Invalid arguments: ${problems.join('; ')}\n`); return 2; }
  try {
    const out = await tools[name].run(args);
    process.stdout.write(JSON.stringify(out, null, 2) + '\n');
    return 0;
  } catch (err) {
    process.stderr.write(`Error: ${err.message}\n`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then((code) => process.exit(code));
}
