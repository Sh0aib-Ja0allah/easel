// The adapters. Each knows its endpoints, how to send a request for a kind of media, and how to
// read the result back into files. Every network call goes through lib/http.mjs (fixtures in tests).
import { readFileSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { request, requestJson, sleep } from '../lib/http.mjs';

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.flac': 'audio/flac', '.mp4': 'video/mp4' };
const dataUri = (file) => `data:${MIME[extname(file).toLowerCase()] || 'application/octet-stream'};base64,${readFileSync(file).toString('base64')}`;
const blobOf = (file) => ({ blob: new Blob([readFileSync(file)], { type: MIME[extname(file).toLowerCase()] || 'application/octet-stream' }), name: basename(file) });
const extFor = (ct, fallback) => ({ 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'audio/mpeg': '.mp3', 'audio/wav': '.wav', 'video/mp4': '.mp4' }[String(ct).split(';')[0]] || fallback);
// fal's Kling takes 5 or 10 s clips (the estimate uses the same rounding)
export const falSeconds = (s) => ((s || 5) > 5 ? 10 : 5);
// Atlas video: whole seconds, at least the model minimum (the estimate uses the same value)
export const atlasSeconds = (s, min = 3) => Math.max(min, Math.round(s || 5));
const sizeToAspect = (size) => { if (!size) return undefined; const [w, h] = size.split('x').map(Number); const g = (a, b) => (b ? g(b, a % b) : a); const d = g(w, h); return `${w / d}:${h / d}`; };
const ratio = (s) => { const [w, h] = String(s).split(/[x:]/).map(Number); return w / h; };

// What each adapter sends (takes: the request arguments it puts in the provider's request, per kind
// and model; anything else given is refused before any spend, so nothing quoted is dropped), and the
// values it sends in another form (shape: { sent, notes }), which are priced and shown as sent.
export const REQUEST_ARGS = ['prompt', 'text', 'refs', 'count', 'size', 'aspect', 'quality', 'resolution', 'seconds', 'voice', 'language', 'instructions', 'voiceName', 'samples'];
// gpt-image-1 makes three sizes: an aspect goes as the nearest one
export const OPENAI_SIZES = ['1024x1024', '1024x1536', '1536x1024'];
const nearestSize = (aspect, sizes) => sizes.reduce((best, s) => (Math.abs(Math.log(ratio(s) / ratio(aspect))) < Math.abs(Math.log(ratio(best) / ratio(aspect))) ? s : best));
// models that take an aspect ratio, not pixels: a size goes as its ratio, and the provider picks the pixels
const asRatio = (who) => (a) => {
  if (!a.size) return {};
  const aspect = sizeToAspect(a.size);
  if (a.aspect && Math.abs(ratio(a.aspect) / ratio(a.size) - 1) > 0.01) throw new Error(`give size or aspect, not both: ${who} takes an aspect ratio, and size ${a.size} is ${aspect}, not ${a.aspect}`);
  return { sent: { aspect: a.aspect || aspect }, notes: [`size ${a.size} is sent as aspect ratio ${a.aspect || aspect}: ${who} picks the pixel size`] };
};

// count > 1 as one call per image (the estimate charges count images). When call k fails, the k-1
// results already made (and paid for) go back with the error, to be saved before it is reported.
async function eachCall(n, one) {
  const out = [];
  for (let i = 0; i < n; i++) {
    try { out.push(...(await one(i))); } catch (e) { e.requested = n; if (out.length) e.partial = out; throw e; }
  }
  return out;
}

async function pollUntil(get, { done, failed, interval = 3000, timeoutMs = 900000 }) {
  const t0 = Date.now();
  for (;;) {
    const s = await get();
    if (done(s)) return s;
    if (failed(s)) throw new Error(`generation failed: ${JSON.stringify(s).slice(0, 300)}`);
    if (Date.now() - t0 > timeoutMs) throw new Error('generation timed out while polling');
    await sleep(interval);
  }
}

export const PROVIDERS = {
  openai: {
    label: 'OpenAI', kinds: { image: ['gpt-image-1'], tts: ['gpt-4o-mini-tts'] },
    takes: (kind) => (kind === 'image' ? ['prompt', 'refs', 'count', 'size', 'aspect', 'quality'] : ['text', 'voice', 'instructions']),
    shape(kind, model, a) {
      if (kind !== 'image' || !a.aspect) return {};
      const size = nearestSize(a.aspect, OPENAI_SIZES);
      if (a.size && a.size !== size) throw new Error(`give size or aspect, not both: ${model} makes ${OPENAI_SIZES.join(', ')}, and aspect ${a.aspect} is sent as ${size}`);
      return { sent: { size }, notes: [`aspect ${a.aspect} is sent as size ${size}${Math.abs(ratio(size) / ratio(a.aspect) - 1) > 0.01 ? ` (${sizeToAspect(size)}), the nearest size ${model} makes` : ''}`] };
    },
    async run(kind, model, a, key) {
      const auth = { Authorization: `Bearer ${key}` };
      if (kind === 'image') {
        if (a.refs && a.refs.length) {
          const r = await requestJson('openai', { method: 'POST', url: 'https://api.openai.com/v1/images/edits', headers: auth, form: { model, prompt: a.prompt, size: a.size || '1024x1024', quality: a.quality || 'medium', n: String(a.count || 1), 'image[]': a.refs.map(blobOf) } });
          return r.data.map((d) => ({ bytes: Buffer.from(d.b64_json, 'base64'), ext: '.png' }));
        }
        const r = await requestJson('openai', { method: 'POST', url: 'https://api.openai.com/v1/images/generations', headers: auth, body: { model, prompt: a.prompt, size: a.size || '1024x1024', quality: a.quality || 'medium', n: a.count || 1 } });
        return r.data.map((d) => ({ bytes: Buffer.from(d.b64_json, 'base64'), ext: '.png' }));
      }
      if (kind === 'tts') {
        const res = await request('openai', { method: 'POST', url: 'https://api.openai.com/v1/audio/speech', headers: { ...auth, 'Content-Type': 'application/json' }, body: { model, input: a.text, voice: a.voice || 'alloy', response_format: 'mp3', ...(a.instructions ? { instructions: a.instructions } : {}) } });
        if (!res.ok) throw new Error(`openai: speech -> HTTP ${res.status}: ${res.buffer.toString('utf8').slice(0, 300)}`);
        return [{ bytes: res.buffer, ext: '.mp3' }];
      }
      throw new Error(`openai does not do ${kind}`);
    },
  },
  gemini: {
    label: 'Google Gemini', kinds: { image: ['gemini-2.5-flash-image'] },
    takes: () => ['prompt', 'refs', 'count', 'size', 'aspect'],
    shape: (kind, model, a) => asRatio(model)(a),
    async run(kind, model, a, key) {
      if (kind !== 'image') throw new Error(`gemini does not do ${kind}`);
      const parts = [{ text: a.prompt }, ...(a.refs || []).map((f) => ({ inlineData: { mimeType: MIME[extname(f).toLowerCase()] || 'image/png', data: readFileSync(f).toString('base64') } }))];
      const aspect = a.aspect || sizeToAspect(a.size);
      // one image per call: count calls (the estimate charges count images)
      return eachCall(a.count || 1, async () => {
        const r = await requestJson('gemini', { method: 'POST', url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, headers: { 'x-goog-api-key': key }, body: { contents: [{ parts }], generationConfig: { responseModalities: ['IMAGE'], ...(aspect ? { imageConfig: { aspectRatio: aspect } } : {}) } } });
        const got = (r.candidates || []).flatMap((c) => (c.content && c.content.parts) || []).filter((p) => p.inlineData).slice(0, 1).map((p) => ({ bytes: Buffer.from(p.inlineData.data, 'base64'), ext: extFor(p.inlineData.mimeType, '.png') }));
        if (!got.length) throw new Error(`gemini returned no image (${JSON.stringify(r.promptFeedback || r.candidates?.[0]?.finishReason || 'no reason').slice(0, 200)})`);
        return got;
      });
    },
  },
  fal: {
    label: 'fal.ai', kinds: { image: ['fal-ai/nano-banana', 'fal-ai/nano-banana-2', 'fal-ai/z-image/turbo'], video: ['fal-ai/kling-video/v2.5-turbo/pro/image-to-video', 'fal-ai/kling-video/v3/pro/image-to-video'] },
    // Kling image-to-video takes the shape of its start image (no aspect); z-image takes pixels
    takes: (kind, model) => (kind === 'video' ? ['prompt', 'refs', 'seconds'] : /nano-banana/.test(model) ? ['prompt', 'refs', 'count', 'size', 'aspect'] : ['prompt', 'count', 'size']),
    shape(kind, model, a) {
      if (kind === 'video') { const s = falSeconds(a.seconds); return { sent: { seconds: s }, notes: a.seconds && a.seconds !== s ? [`seconds ${a.seconds} is sent as ${s}: ${model} makes 5 or 10 s clips`] : [] }; }
      return /nano-banana/.test(model) ? asRatio(model)(a) : {};
    },
    async run(kind, model, a, key) {
      const auth = { Authorization: `Key ${key}` };
      let endpoint = model, input;
      if (kind === 'video') {
        if (!(a.refs && a.refs[0])) throw new Error(`${model} is image-to-video: give the keyframe in refs`);
        input = { prompt: a.prompt, image_url: dataUri(a.refs[0]), duration: String(falSeconds(a.seconds)), ...(a.aspect ? { aspect_ratio: a.aspect } : {}) };
      } else if (/nano-banana/.test(model)) {
        // nano-banana: aspect_ratio, not a pixel size; references go to its /edit endpoint
        const aspect = a.aspect || sizeToAspect(a.size);
        input = { prompt: a.prompt, num_images: a.count || 1, ...(aspect ? { aspect_ratio: aspect } : {}) };
        if (a.refs && a.refs.length) { endpoint = `${model}/edit`; input.image_urls = a.refs.map(dataUri); }
      } else {
        input = { prompt: a.prompt, num_images: a.count || 1, ...(a.size ? { image_size: { width: Number(a.size.split('x')[0]), height: Number(a.size.split('x')[1]) } } : {}) };
      }
      const sub = await requestJson('fal', { method: 'POST', url: `https://queue.fal.run/${endpoint}`, headers: auth, body: input });
      a.onSubmit && a.onSubmit({ id: sub.request_id, statusUrl: sub.status_url });
      await pollUntil(() => requestJson('fal', { url: sub.status_url, headers: auth }), { done: (s) => s.status === 'COMPLETED', failed: (s) => s.status === 'FAILED' || s.status === 'ERROR' });
      const res = await requestJson('fal', { url: sub.response_url, headers: auth });
      const urls = kind === 'video' ? [res.video && res.video.url] : (res.images || []).map((i) => i.url);
      return urls.filter(Boolean).map((url) => ({ url, ext: kind === 'video' ? '.mp4' : '.png' }));
    },
  },
  replicate: {
    label: 'Replicate', kinds: { image: ['black-forest-labs/flux-schnell'] },
    takes: () => ['prompt', 'count', 'size', 'aspect'],
    shape: (kind, model, a) => asRatio(model)(a),
    async run(kind, model, a, key) {
      if (kind !== 'image') throw new Error(`replicate adapter does images only in v1 (asked for ${kind})`);
      const auth = { Authorization: `Bearer ${key}` };
      let p = await requestJson('replicate', { method: 'POST', url: `https://api.replicate.com/v1/models/${model}/predictions`, headers: { ...auth, Prefer: 'wait' }, body: { input: { prompt: a.prompt, num_outputs: a.count || 1, ...(a.aspect || a.size ? { aspect_ratio: a.aspect || sizeToAspect(a.size) } : {}) } } });
      a.onSubmit && a.onSubmit({ id: p.id });
      if (p.status !== 'succeeded') p = await pollUntil(() => requestJson('replicate', { url: p.urls.get, headers: auth }), { done: (s) => s.status === 'succeeded', failed: (s) => s.status === 'failed' || s.status === 'canceled' });
      return [].concat(p.output || []).map((url) => ({ url, ext: '.webp' }));
    },
  },
  atlas: {
    label: 'Atlas Cloud', kinds: { image: ['google/nano-banana-2/text-to-image'], video: ['google/gemini-omni-flash/image-to-video'], tts: ['xai/tts-v1'], music: ['minimax/music-2.6'] },
    // the image model is text-to-image (no references); music is instrumental, at the model's length
    takes: (kind) => ({ image: ['prompt', 'count', 'size', 'aspect', 'resolution'], video: ['prompt', 'refs', 'seconds', 'aspect'], tts: ['text', 'voice', 'language'], music: ['prompt'] }[kind] || []),
    shape(kind, model, a) {
      if (kind === 'video') { const s = atlasSeconds(a.seconds); return { sent: { seconds: s }, notes: a.seconds && a.seconds !== s ? [`seconds ${a.seconds} is sent as ${s}: ${model} takes whole seconds, at least 3`] : [] }; }
      return kind === 'image' ? asRatio(model)(a) : {};
    },
    async run(kind, model, a, key) {
      const base = 'https://api.atlascloud.ai/api/v1', auth = { Authorization: `Bearer ${key}` };
      const upload = async (file) => { const r = await requestJson('atlas', { method: 'POST', url: `${base}/model/uploadMedia`, headers: auth, form: { file: blobOf(file) } }); return r.data.download_url || r.data.url; };
      let path = '/model/generateVideo', body;
      // images: the size as an aspect ratio (the model takes a ratio and a resolution tier, not
      // pixels), and count as one prediction per image (the estimate charges count images)
      if (kind === 'image') { const aspect = a.aspect || sizeToAspect(a.size); path = '/model/generateImage'; body = { model, prompt: a.prompt, ...(aspect ? { aspect_ratio: aspect } : {}), ...(a.resolution ? { resolution: a.resolution } : {}) }; }
      else if (kind === 'video') body = { model, prompt: a.prompt, ...(a.refs && a.refs[0] ? { image: await upload(a.refs[0]) } : {}), duration: atlasSeconds(a.seconds), ...(a.aspect ? { aspect_ratio: a.aspect } : {}) };
      else if (kind === 'tts') body = { model, text: a.text, ...(a.voice ? { voice_id: a.voice } : {}), ...(a.language ? { language: a.language } : {}) };
      else if (kind === 'music') body = { model, prompt: a.prompt, is_instrumental: true };
      else throw new Error(`atlas adapter does not do ${kind}`);
      const ext = { image: '.png', video: '.mp4', tts: '.mp3', music: '.mp3' }[kind];
      return eachCall(kind === 'image' ? a.count || 1 : 1, async () => {
        const sub = await requestJson('atlas', { method: 'POST', url: base + path, headers: auth, body });
        const id = sub.data.id;
        a.onSubmit && a.onSubmit({ id });
        const done = await pollUntil(() => requestJson('atlas', { url: `${base}/model/prediction/${id}`, headers: auth }).then((r) => r.data || {}), { done: (d) => d.status === 'completed' || d.status === 'succeeded', failed: (d) => d.status === 'failed' });
        return [].concat(done.outputs || done.output || []).map((url) => ({ url, ext }));
      });
    },
  },
  elevenlabs: {
    label: 'ElevenLabs', kinds: { tts: ['eleven_multilingual_v2', 'eleven_flash_v2_5'], 'voice-clone': ['voice-clone'] },
    // the language comes from the text; a clone takes a name and the samples
    takes: (kind) => (kind === 'tts' ? ['text', 'voice'] : ['voiceName', 'samples']),
    async run(kind, model, a, key) {
      const auth = { 'xi-api-key': key };
      if (kind === 'tts') {
        // with-timestamps gives character timings, turned into word timings for captions and beats
        const r = await requestJson('elevenlabs', { method: 'POST', url: `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(a.voice || 'JBFqnCBsd6RMkjVDRZzb')}/with-timestamps?output_format=mp3_44100_128`, headers: auth, body: { text: a.text, model_id: model } });
        return [{ bytes: Buffer.from(r.audio_base64, 'base64'), ext: '.mp3', words: wordsFromAlignment(r.alignment || r.normalized_alignment) }];
      }
      if (kind === 'voice-clone') {
        const r = await requestJson('elevenlabs', { method: 'POST', url: 'https://api.elevenlabs.io/v1/voices/add', headers: auth, form: { name: a.voiceName, description: 'Cloned with recorded consent (Easel)', files: a.samples.map(blobOf) } });
        return [{ json: { voice_id: r.voice_id, name: a.voiceName }, ext: '.json' }];
      }
      throw new Error(`elevenlabs does not do ${kind}`);
    },
  },
};

// Character timings -> word timings: [{ text, start, end }]
export function wordsFromAlignment(al) {
  if (!al || !al.characters) return [];
  const words = []; let cur = null;
  al.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) { if (cur) { words.push(cur); cur = null; } return; }
    const s = al.character_start_times_seconds[i], e = al.character_end_times_seconds[i];
    if (!cur) cur = { text: ch, start: s, end: e }; else { cur.text += ch; cur.end = e; }
  });
  if (cur) words.push(cur);
  return words.map((w) => ({ text: w.text, start: +w.start.toFixed(3), end: +w.end.toFixed(3) }));
}
