// audio_score: a cue sheet (cues.json) -> a synthesized score (music + sound effects) -> a WAV mastered
// to -14 LUFS. The synth runs in the engine's offline browser page (Web Audio OfflineAudioContext), so
// it needs no extra dependency, and it is repeatable: the same cue sheet gives the same file to within a few
// LSB (Chromium's Web Audio rounds a little differently between runs; D16).
// The instruments (pluck, pad, bass, sub, noiseHit, sweep, riser, chime, blip) are adapted for Easel
// from cth9191/animate @ 7e5eb56feb2dd573f890e1b7b34748af43d58263 (kit/score-head.js), MIT License,
// Copyright (c) 2026 cth9191. Modified by Easel (2026-10-11): driven by a cue-sheet plan instead of a
// piece's TIMELINE; three palettes; a duck before every hit; a fade at the end. Decision D16.
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { newPage, openBrowser } from './browser.mjs';
import { masterWav, writeBase64 } from './audio.mjs';
import { loudness } from './qa.mjs';
import { outputDir } from './render.mjs';
import { validateData } from './schemas.mjs';

const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export const PALETTES = ['warm', 'bright', 'retro'];
const SFX = ['whoosh', 'swish', 'pop', 'click', 'tick', 'chime', 'riser', 'impact', 'blip'];

export function parseKey(key = 'D major') {
  const m = /^([A-G])(#|b)?(?: ?(major|minor|maj|min|m))?$/.exec(String(key).trim());
  if (!m) throw new Error(`unknown key "${key}" (e.g. "D major", "A minor", "F#m")`);
  const root = 50 + SEMI[m[1]] - SEMI.D + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);   // octave 3 around D3 = 50
  const minor = m[3] === 'minor' || m[3] === 'min' || m[3] === 'm';
  return { root, minor };
}

// The plan: everything the synth plays, as plain data with times in seconds (computed here, in Node).
export function planScore(cues, { palette = 'warm' } = {}) {
  const fps = cues.fps, dur = cues.durationSec, bpm = cues.bpm || 120, beat = 60 / bpm;
  const { root, minor } = parseKey(cues.key);
  const scale = minor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
  const prog = minor ? [0, 5, 2, 6] : [0, 5, 3, 4];   // i VI III VII / I vi IV V
  const triad = (deg) => [0, 2, 4].map((k) => { const d = deg + k; return root + scale[d % 7] + 12 * Math.floor(d / 7); });
  const at = (c) => Math.min(dur, c.frame / fps);
  const sorted = [...cues.cues].sort((a, b) => a.frame - b.frame);
  const start = sorted.find((c) => c.kind === 'music-start'), stop = sorted.find((c) => c.kind === 'music-stop');
  const m0 = start ? at(start) : 0, m1 = stop ? at(stop) : dur;
  // sections: from each scene cue to the next (or the music's start and stop when there are none)
  const sceneTimes = [...new Set([m0, ...sorted.filter((c) => c.kind === 'scene').map(at).filter((t) => t >= m0 && t < m1)])].sort((a, b) => a - b);
  const sections = sceneTimes.map((t0, i) => ({ t0, t1: i + 1 < sceneTimes.length ? sceneTimes[i + 1] : m1, chord: triad(prog[i % prog.length]) }));
  const hits = sorted.filter((c) => c.kind === 'hit').map(at);
  const events = [];
  for (const s of sections) {
    events.push({ type: 'pad', t0: s.t0, t1: s.t1, notes: s.chord.map((n) => n + 12) });
    events.push({ type: 'motif', t: s.t0, notes: [s.chord[0] + 24, s.chord[2] + 24] });
    // bass on the BPM grid from the music start (not from each scene start), an accent on every bar's downbeat
    for (let k = Math.ceil((s.t0 - m0) / beat - 1e-6); m0 + k * beat < s.t1 - 1e-6; k++) events.push({ type: 'bass', t: m0 + k * beat, note: s.chord[0] - 12, accent: k % 4 === 0 });
  }
  for (const c of sorted) {
    const t = at(c);
    if (c.kind === 'beat') events.push({ type: 'kick', t });
    else if (c.kind === 'hit') { const s = sections.find((x) => t >= x.t0 - 1e-6 && t < x.t1) || sections[sections.length - 1]; events.push({ type: 'hit', t, notes: (s ? s.chord : triad(0)).map((n) => n + 24) }); }
    else if (c.kind === 'caption') events.push({ type: 'sfx', name: 'blip', t });
    else if (c.kind === 'sfx') events.push({ type: 'sfx', name: SFX.includes(c.sfx) ? c.sfx : 'click', t, ...(SFX.includes(c.sfx) || !c.sfx ? {} : { unknown: c.sfx }) });
  }
  return { palette, durationSec: dur, bpm, key: cues.key || 'D major', music: [m0, m1], hits, sections: sections.map((s) => ({ t0: +s.t0.toFixed(3), t1: +s.t1.toFixed(3) })), events };
}

// Runs in the page: renders the plan with Web Audio and returns a base64 16-bit stereo WAV.
function synthInPage(plan) {
  return (async () => {
    const SR = 48000, len = Math.ceil(plan.durationSec * SR);
    const ac = new OfflineAudioContext(2, len, SR);
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const MIDI = (m) => 440 * 2 ** ((m - 69) / 12);
    let seed = 1;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const master = ac.createGain(); master.gain.value = 0.8;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.2;
    const fade = ac.createGain(); fade.gain.setValueAtTime(1, Math.max(0, plan.durationSec - 0.35)); fade.gain.linearRampToValueAtTime(0.0001, plan.durationSec);
    master.connect(comp); comp.connect(fade); fade.connect(ac.destination);
    const music = ac.createGain(), sfx = ac.createGain(); music.connect(master); sfx.connect(master);
    // silence before the payoff: the music dips in the half second before every hit
    music.gain.setValueAtTime(1, 0);
    for (const t of plan.hits) { if (t < 0.6) continue; music.gain.setValueAtTime(1, t - 0.6); music.gain.linearRampToValueAtTime(0.18, t - 0.45); music.gain.setValueAtTime(0.18, t - 0.02); music.gain.linearRampToValueAtTime(1, t); }
    const impulse = (sec, decay) => { const n = Math.floor(sec * SR), b = ac.createBuffer(2, n, SR); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / n, decay); } return b; };
    const verb = (dest, level) => { const v = ac.createConvolver(); v.buffer = impulse(1.8, 2.6); const g = ac.createGain(); g.gain.value = level; v.connect(g); g.connect(dest); return v; };
    const verbs = { m: verb(music, 0.3), s: verb(sfx, 0.25) };
    const noise = (() => { const b = ac.createBuffer(1, 3 * SR, SR), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = rnd() * 2 - 1; return b; })();
    let to = 'm';
    const env = (g, t, a, peak, d) => { g.gain.value = 0.0001; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
    const out = (node, pan = 0, send = 0) => { const p = ac.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); node.connect(p); p.connect(to === 'm' ? music : sfx); if (send) { const s = ac.createGain(); s.gain.value = send; node.connect(s); s.connect(verbs[to]); } };
    const osc = (type, f, t, stop) => { const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(stop); return o; };
    const P = { warm: { pad: 'triangle', cut: 900, lead: 'triangle', bright: 2600, bass: 'triangle' }, bright: { pad: 'sawtooth', cut: 1800, lead: 'triangle', bright: 4200, bass: 'triangle' }, retro: { pad: 'square', cut: 1400, lead: 'square', bright: 3000, bass: 'square' } }[plan.palette];
    function pluck(t, f, vel, pan = 0, dur = 0.32, bright = P.bright, send = 0.25) {
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2.5; lp.frequency.setValueAtTime(bright, t); lp.frequency.exponentialRampToValueAtTime(380, t + dur);
      const g = ac.createGain(); env(g, t, 0.003, vel, dur); const g2 = ac.createGain(); g2.gain.value = 0.3;
      osc(P.lead, f, t, t + dur + 0.05).connect(lp); osc('sine', f * 2.004, t, t + dur + 0.05).connect(g2); g2.connect(lp); lp.connect(g); out(g, pan, send);
    }
    function noiseHit(t, dur, type, freq, q, vel, pan = 0, send = 0, sweepTo = 0) {
      const src = ac.createBufferSource(); src.buffer = noise; const f = ac.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(freq, t);
      if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
      const g = ac.createGain(); env(g, t, Math.min(0.004, dur * 0.3), vel, dur); src.connect(f); f.connect(g); out(g, pan, send); src.start(t, (t * 7.31) % 2.0); src.stop(t + dur + 0.05);
    }
    function sub(t, vel) { const o = osc('sine', 120, t, t + 0.8); o.frequency.exponentialRampToValueAtTime(36, t + 0.3); const g = ac.createGain(); env(g, t, 0.004, vel, 0.6); o.connect(g); out(g); noiseHit(t, 0.07, 'lowpass', 1100, 0.7, vel * 0.45); }
    function sweep(t0, t1, vel, f0, f1, pan = 0) {
      const src = ac.createBufferSource(); src.buffer = noise; src.loop = true; const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.1;
      f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(f1, t1);
      const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vel, Math.max(t0 + 0.005, t1 - 0.03)); g.gain.linearRampToValueAtTime(0.0001, t1 + 0.005);   // never before t0 (a cue on frame 0)
      src.connect(f); f.connect(g); out(g, pan, 0.2); src.start(t0, (t0 * 3.1) % 1.0); src.stop(t1 + 0.05);
    }
    function riser(t0, t1, vel) {
      t1 = Math.max(t1, t0 + 0.05);   // a riser on frame 0 still has a length
      const o = osc('sawtooth', 110, t0, t1 + 0.02); o.frequency.exponentialRampToValueAtTime(1320, t1);
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 6; lp.frequency.setValueAtTime(300, t0); lp.frequency.exponentialRampToValueAtTime(5000, t1);
      const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vel, Math.max(t0 + 0.005, t1 - 0.01)); g.gain.linearRampToValueAtTime(0.0001, t1 + 0.01);
      o.connect(lp); lp.connect(g); out(g, 0, 0.3); sweep(t0, t1, vel * 0.9, 400, 7000);
    }
    function chime(t, freqs, vel, pan = 0) { freqs.forEach((f, i) => { const g = ac.createGain(), ti = t + i * 0.012; env(g, ti, 0.002, vel / (1 + i * 0.4), 1.3); osc('sine', f, ti, ti + 1.5).connect(g); out(g, pan + (i - 1) * 0.25, 0.6); }); }
    function bass(t, f, vel) { const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320; const g = ac.createGain(); env(g, t, 0.006, vel, 0.28); osc(P.bass, f, t, t + 0.35).connect(lp); lp.connect(g); out(g); }
    function blip(t, f0, f1, dur, vel, pan = 0) { const o = osc('sine', f0, t, t + dur + 0.05); o.frequency.exponentialRampToValueAtTime(f1, t + dur); const g = ac.createGain(); env(g, t, 0.002, vel, dur); o.connect(g); out(g, pan, 0.2); }
    function pad(t0, t1, notes, peak) {
      if (t1 - t0 < 0.1) return;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = P.cut; lp.Q.value = 0.7;
      const g = ac.createGain(), att = Math.min(0.4, (t1 - t0) / 3), rel = Math.min(0.3, (t1 - t0) / 3);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + att); g.gain.setValueAtTime(peak, t1 - rel); g.gain.exponentialRampToValueAtTime(0.0001, t1);
      notes.forEach((n, i) => { for (const det of [-7, 7]) { const oo = osc(P.pad, MIDI(n), t0, t1 + 0.05); oo.detune.value = det + i; oo.connect(lp); } });
      lp.connect(g); out(g, 0, 0.4);
    }
    const SFXN = {
      whoosh: (t) => sweep(Math.max(0, t - 0.35), t + 0.02, 0.05, 300, 3200),
      swish: (t) => sweep(Math.max(0, t - 0.2), t + 0.02, 0.03, 600, 4200),
      pop: (t) => blip(t, 420, 1260, 0.09, 0.22),
      click: (t) => noiseHit(t, 0.025, 'bandpass', 2600, 3, 0.25),
      tick: (t) => noiseHit(t, 0.012, 'highpass', 5200, 1, 0.18),
      chime: (t) => chime(t, [MIDI(81), MIDI(88), MIDI(93)], 0.12),
      riser: (t) => riser(Math.max(0, t - 1.0), t, 0.06),
      impact: (t) => { sub(t, 0.5); noiseHit(t, 0.4, 'lowpass', 900, 0.8, 0.2, 0, 0.3); },
      blip: (t) => blip(t, 880, 1320, 0.06, 0.12),
    };
    for (const e of plan.events) {
      to = e.type === 'sfx' || e.type === 'kick' ? 's' : 'm';
      if (e.type === 'pad') pad(e.t0, e.t1, e.notes, 0.04);
      else if (e.type === 'motif') e.notes.forEach((n, i) => pluck(e.t + i * 0.25, MIDI(n), 0.14, -0.15 + i * 0.3, 0.5));
      else if (e.type === 'bass') bass(e.t, MIDI(e.note), e.accent ? 0.22 : 0.15);
      else if (e.type === 'kick') sub(e.t, 0.35);
      else if (e.type === 'hit') { to = 'm'; chime(e.t, e.notes.map(MIDI), 0.2); to = 's'; sub(e.t, 0.7); }
      else if (e.type === 'sfx') SFXN[e.name](e.t);
    }
    const buf = await ac.startRendering();
    const L = buf.getChannelData(0), R = buf.getChannelData(1), n = L.length, ab = new ArrayBuffer(44 + n * 4), v = new DataView(ab);
    const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    ws(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); ws(8, 'WAVE'); ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
    v.setUint32(24, SR, true); v.setUint32(28, SR * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); ws(36, 'data'); v.setUint32(40, n * 4, true);
    for (let i = 0, o = 44; i < n; i++, o += 4) { v.setInt16(o, Math.round(clamp(L[i], -1, 1) * 32767), true); v.setInt16(o + 2, Math.round(clamp(R[i], -1, 1) * 32767), true); }
    const bytes = new Uint8Array(ab); let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  })();
}

export async function audioScore(args) {
  const t0 = Date.now();
  let cues = args.cues;
  if (args.file) { const p = resolve(args.file); if (!existsSync(p)) throw new Error(`File not found: ${p}`); cues = JSON.parse(readFileSync(p, 'utf8').replace(/^﻿/, '')); }
  if (!cues) throw new Error('Give a cue sheet: file (a cues.json path) or cues (the object).');
  const problems = validateData('cues', cues);
  if (problems.length) throw new Error(`The cue sheet is not valid: ${problems.slice(0, 5).join('; ')}`);
  const palette = args.palette || 'warm';
  if (!PALETTES.includes(palette)) throw new Error(`palette must be one of ${PALETTES.join(', ')}`);
  const plan = planScore(cues, { palette });
  const out = outputDir(args);
  mkdirSync(out, { recursive: true });
  const name = String(args.name || 'score').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^[.-]+|[.-]+$/g, '') || 'score';
  const browser = await openBrowser();
  let b64;
  try {
    const { page, context } = await newPage(browser, { width: 16, height: 16, fonts: false });
    try { b64 = await page.evaluate(synthInPage, plan); } finally { await context.close(); }
  } finally { await browser.close(); }
  const raw = writeBase64(join(out, `${name}-raw.wav`), b64);
  const file = join(out, `${name}.wav`);
  const target = args.lufs ?? -14;
  masterWav(raw, file, { target });
  rmSync(raw, { force: true });
  const loud = loudness(file, { min: target - 2, max: target + 2 });
  const unknown = plan.events.filter((e) => e.unknown).map((e) => e.unknown);
  return {
    file, durationSec: plan.durationSec, lufs: loud.value, pass: loud.pass, palette, key: plan.key, bpm: plan.bpm,
    sections: plan.sections, events: plan.events.length, hits: plan.hits.length,
    ...(unknown.length ? { warnings: [`unknown sfx names played as a click: ${[...new Set(unknown)].join(', ')} (known: ${SFX.join(', ')})`] } : {}),
    ms: Date.now() - t0,
  };
}
