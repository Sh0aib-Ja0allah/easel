// The adapters. Each knows its endpoints, how to send a request for a kind of media, and how to
// read the result back into files. Every network call goes through lib/http.mjs (fixtures in tests).
import { readFileSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { request, requestJson, sleep } from '../lib/http.mjs';

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.mp4': 'video/mp4' };
const dataUri = (file) => `data:${MIME[extname(file).toLowerCase()] || 'application/octet-stream'};base64,${readFileSync(file).toString('base64')}`;
const blobOf = (file) => ({ blob: new Blob([readFileSync(file)], { type: MIME[extname(file).toLowerCase()] || 'application/octet-stream' }), name: basename(file) });
const extFor = (ct, fallback) => ({ 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'audio/mpeg': '.mp3', 'audio/wav': '.wav', 'video/mp4': '.mp4' }[String(ct).split(';')[0]] || fallback);
// fal's Kling takes 5 or 10 s clips (the estimate uses the same rounding)
export const falSeconds = (s) => ((s || 5) > 5 ? 10 : 5);
// Atlas video: whole seconds, at least the model minimum (the estimate uses the same value)
export const atlasSeconds = (s, min = 3) => Math.max(min, Math.round(s || 5));
const sizeToAspect = (size) => { if (!size) return undefined; const [w, h] = size.split('x').map(Number); const g = (a, b) => (b ? g(b, a % b) : a); const d = g(w, h); return `${w / d}:${h / d}`; };

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
    async run(kind, model, a, key) {
      if (kind !== 'image') throw new Error(`gemini does not do ${kind}`);
      const parts = [{ text: a.prompt }, ...(a.refs || []).map((f) => ({ inlineData: { mimeType: MIME[extname(f).toLowerCase()] || 'image/png', data: readFileSync(f).toString('base64') } }))];
      const aspect = a.aspect || sizeToAspect(a.size);
      // one image per call: count calls (the estimate charges count images)
      const out = [];
      for (let i = 0; i < (a.count || 1); i++) {
        const r = await requestJson('gemini', { method: 'POST', url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, headers: { 'x-goog-api-key': key }, body: { contents: [{ parts }], generationConfig: { responseModalities: ['IMAGE'], ...(aspect ? { imageConfig: { aspectRatio: aspect } } : {}) } } });
        const got = (r.candidates || []).flatMap((c) => (c.content && c.content.parts) || []).filter((p) => p.inlineData).slice(0, 1).map((p) => ({ bytes: Buffer.from(p.inlineData.data, 'base64'), ext: extFor(p.inlineData.mimeType, '.png') }));
        if (!got.length) throw new Error(`gemini returned no image (${JSON.stringify(r.promptFeedback || r.candidates?.[0]?.finishReason || 'no reason').slice(0, 200)})`);
        out.push(...got);
      }
      return out;
    },
  },
  fal: {
    label: 'fal.ai', kinds: { image: ['fal-ai/nano-banana', 'fal-ai/nano-banana-2', 'fal-ai/z-image/turbo'], video: ['fal-ai/kling-video/v2.5-turbo/pro/image-to-video', 'fal-ai/kling-video/v3/pro/image-to-video'] },
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
    async run(kind, model, a, key) {
      const base = 'https://api.atlascloud.ai/api/v1', auth = { Authorization: `Bearer ${key}` };
      const upload = async (file) => { const r = await requestJson('atlas', { method: 'POST', url: `${base}/model/uploadMedia`, headers: auth, form: { file: blobOf(file) } }); return r.data.download_url || r.data.url; };
      let path = '/model/generateVideo', body;
      if (kind === 'image') { path = '/model/generateImage'; body = { model, prompt: a.prompt, ...(a.aspect ? { aspect_ratio: a.aspect } : {}), ...(a.resolution ? { resolution: a.resolution } : {}) }; }
      else if (kind === 'video') body = { model, prompt: a.prompt, ...(a.refs && a.refs[0] ? { image: await upload(a.refs[0]) } : {}), duration: atlasSeconds(a.seconds), ...(a.aspect ? { aspect_ratio: a.aspect } : {}) };
      else if (kind === 'tts') body = { model, text: a.text, ...(a.voice ? { voice_id: a.voice } : {}), ...(a.language ? { language: a.language } : {}) };
      else if (kind === 'music') body = { model, prompt: a.prompt, is_instrumental: true };
      else throw new Error(`atlas adapter does not do ${kind}`);
      const sub = await requestJson('atlas', { method: 'POST', url: base + path, headers: auth, body });
      const id = sub.data.id;
      a.onSubmit && a.onSubmit({ id });
      const done = await pollUntil(() => requestJson('atlas', { url: `${base}/model/prediction/${id}`, headers: auth }).then((r) => r.data || {}), { done: (d) => d.status === 'completed' || d.status === 'succeeded', failed: (d) => d.status === 'failed' });
      const urls = [].concat(done.outputs || done.output || []);
      const ext = { image: '.png', video: '.mp4', tts: '.mp3', music: '.mp3' }[kind];
      return urls.map((url) => ({ url, ext }));
    },
  },
  elevenlabs: {
    label: 'ElevenLabs', kinds: { tts: ['eleven_multilingual_v2', 'eleven_flash_v2_5'], 'voice-clone': ['voice-clone'] },
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
