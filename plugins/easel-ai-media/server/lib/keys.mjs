// API keys: from the environment, or from the plugin's userConfig (passed to the server as
// EASEL_CFG_<PROVIDER> by .mcp.json). Never written to disk, never printed: callers get the value
// only through keyFor(); everything else sees names and a masked form.
export const PROVIDER_KEYS = {
  gemini: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'],
  openai: ['OPENAI_API_KEY'],
  fal: ['FAL_KEY'],
  replicate: ['REPLICATE_API_TOKEN'],
  atlas: ['ATLASCLOUD_API_KEY'],
  elevenlabs: ['ELEVENLABS_API_KEY'],
};
// an unset ${VAR} in .mcp.json reaches the server as the literal text; treat it as unset
const real = (v) => typeof v === 'string' && v.trim() !== '' && !/^\$\{[^}]*\}$/.test(v.trim());

export function keyFor(provider, env = process.env) {
  const cfg = env[`EASEL_CFG_${provider.toUpperCase()}`];
  if (real(cfg)) return { value: cfg.trim(), from: 'plugin settings (userConfig)' };
  for (const name of PROVIDER_KEYS[provider] || []) if (real(env[name])) return { value: env[name].trim(), from: name };
  return null;
}
export function keyStatus(env = process.env) {
  return Object.fromEntries(Object.keys(PROVIDER_KEYS).map((p) => { const k = keyFor(p, env); return [p, k ? { set: true, from: k.from } : { set: false, env: PROVIDER_KEYS[p] }]; }));
}
// Replace any key value that appears in a string (error bodies, request previews) with a mask.
export function maskSecrets(text, env = process.env) {
  let s = String(text);
  for (const p of Object.keys(PROVIDER_KEYS)) { const k = keyFor(p, env); if (k && k.value.length >= 6) s = s.split(k.value).join(`${k.value.slice(0, 3)}***`); }
  return s;
}
