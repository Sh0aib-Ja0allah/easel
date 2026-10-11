// A small JSON Schema validator: the subset Easel's tool and data schemas use.
// Supports: type (string|number|integer|boolean|object|array|null, or a list), enum, const,
// required, properties, additionalProperties (bool or schema), items, minItems, maxItems,
// minimum, maximum, minLength, maxLength, pattern, oneOf/anyOf (first match), $ref to #/$defs/x.
const typeOf = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);

function matchesType(t, v) {
  if (t === 'integer') return Number.isInteger(v);
  if (t === 'number') return typeof v === 'number' && Number.isFinite(v);
  return typeOf(v) === t;
}

export function validateArgs(schema, value, path = '', root = schema, out = []) {
  if (!schema || schema === true) return out;
  if (schema === false) { out.push(`${path || 'value'} is not allowed`); return out; }
  if (schema.$ref) {
    const name = schema.$ref.replace(/^#\/\$defs\//, '');
    return validateArgs(root.$defs && root.$defs[name], value, path, root, out);
  }
  const at = path || 'value';
  if (schema.anyOf || schema.oneOf) {
    const opts = schema.anyOf || schema.oneOf;
    if (!opts.some((s) => validateArgs(s, value, path, root, []).length === 0)) out.push(`${at} matches none of the allowed shapes`);
    return out;
  }
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => matchesType(t, value))) { out.push(`${at} must be ${types.join(' or ')}`); return out; }
  }
  if (schema.const !== undefined && value !== schema.const) out.push(`${at} must be ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.includes(value)) out.push(`${at} must be one of ${schema.enum.join(', ')}`);
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) out.push(`${at} is too short`);
    if (schema.maxLength !== undefined && value.length > schema.maxLength) out.push(`${at} is too long`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) out.push(`${at} does not match ${schema.pattern}`);
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) out.push(`${at} must be >= ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) out.push(`${at} must be <= ${schema.maximum}`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) out.push(`${at} needs at least ${schema.minItems} items`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) out.push(`${at} allows at most ${schema.maxItems} items`);
    if (schema.items) value.forEach((v, i) => validateArgs(schema.items, v, `${at}[${i}]`, root, out));
  }
  if (typeOf(value) === 'object') {
    for (const k of schema.required || []) if (!Object.hasOwn(value, k)) out.push(`${path ? path + '.' : ''}${k} is required`);
    const props = schema.properties || {};
    for (const [k, v] of Object.entries(value)) {
      const sub = `${path ? path + '.' : ''}${k}`;
      if (Object.hasOwn(props, k)) validateArgs(props[k], v, sub, root, out);
      else if (schema.additionalProperties === false) out.push(`${sub} is not an allowed property`);
      else if (typeof schema.additionalProperties === 'object') validateArgs(schema.additionalProperties, v, sub, root, out);
    }
  }
  return out;
}
