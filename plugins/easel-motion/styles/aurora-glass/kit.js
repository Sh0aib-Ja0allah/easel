// =====================================================================
//  styles/aurora-glass/kit.js: slow, translucent, expensive. Large blurred aurora blobs in adjacent hues
//  drift over a deep indigo ground; frosted glass cards (backdrop blur, a 5-10% white fill, a 1 px 30%
//  white highlight, large radius) float above with micro-UI inside; a glass lens magnifies what is under
//  it with a dispersed rim. Everything eases on a sine; nothing is fast.
//  Easel original code (MIT). The look follows the signature features in Vincentwei1021/mg-styles-15's
//  aurora-glass prompt @ 49052d80bfaf9fa8412cc9710530e5e95a3b8d8c (MIT, Copyright (c) 2026 Vincentwei1021).
//  Built on kit/core.js; helpers are prefixed ag... Motion on 1s (STYLE.ones).
// =====================================================================
const AG = { ground: '#0b0a1f', blobs: ['#7b5cff', '#3d6bff', '#3ee0ff', '#c45cff', '#5c8cff'], ink: '#f4f2ff', inkDim: 'rgba(244,242,255,0.62)' };
const AG_TYPE = '"Inter", "Noto Sans Math", sans-serif';   // bundled OFL; set light and wide
const agSine = (u) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(u));
let AG_LAYER = null, AG_NOISE = null;
// the aurora: 5 big blobs on slow closed paths (periods 20-40 s), blurred 100-150 px, drawn into a layer
// the glass cards and the lens sample from; grain on top (4%) so the gradients never band
function agAurora(o = {}) {
  if (!AG_LAYER || AG_LAYER.width !== W || AG_LAYER.height !== H) { AG_LAYER = document.createElement('canvas'); AG_LAYER.width = W; AG_LAYER.height = H; }
  const g = AG_LAYER.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'none'; g.fillStyle = AG.ground; g.fillRect(0, 0, W, H);
  g.filter = `blur(${Math.round(120 * UNIT)}px)`; g.globalCompositeOperation = 'lighter';
  AG.blobs.forEach((c, i) => {
    const R = RNG('agblob', i), per = R.r(20, 40), a = TAU * (TT / per) + R.r(0, TAU), cx = W * (0.5 + 0.32 * Math.cos(a) * R.r(0.6, 1)), cy = H * (0.45 + 0.3 * Math.sin(a * 1.3 + i) * R.r(0.6, 1));
    g.globalAlpha = (o.intensity ?? 1) * 0.55; g.fillStyle = c; g.beginPath(); g.arc(cx, cy, Math.min(W, H) * R.r(0.28, 0.42), 0, TAU); g.fill();
  });
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none';
  if (!AG_NOISE) {   // a seeded 256 px grain tile
    AG_NOISE = document.createElement('canvas'); AG_NOISE.width = AG_NOISE.height = 256;
    const n = AG_NOISE.getContext('2d'), im = n.createImageData(256, 256), R = RNG('agnoise');
    for (let i = 0; i < im.data.length; i += 4) { const v = R.f() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 10; }
    n.putImageData(im, 0, 0);
  }
  g.fillStyle = g.createPattern(AG_NOISE, 'repeat'); g.fillRect(0, 0, W, H);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(AG_LAYER, 0, 0); ctx.restore();
}
// a frosted glass card (screen coords): blurred aurora behind, a white 7% fill, a 1 px 30% highlight;
// rise 0..1 floats it in (opacity and an 8 px lift, scaled), tilt a slight 3D skew
function agCard(x, y, w, h, o = {}) {
  const k = agSine(o.rise ?? 1); if (k <= 0) return;
  const r = (o.radius ?? 44) * UNIT, dy = (1 - k) * 8 * UNIT * 3;
  ctx.save(); ctx.globalAlpha = k; ctx.translate(x + w / 2, y + h / 2 + dy); ctx.transform(1, o.tilt ?? 0, 0, 1, 0, 0); ctx.translate(-w / 2, -h / 2);
  ctx.shadowColor = 'rgba(4,2,20,0.45)'; ctx.shadowBlur = 50 * UNIT; ctx.shadowOffsetY = 24 * UNIT;
  ctx.beginPath(); ctx.roundRect(0, 0, w, h, r); ctx.fillStyle = 'rgba(20,16,50,0.25)'; ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.save(); ctx.clip();
  const m = ctx.getTransform(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = `blur(${Math.round(30 * UNIT)}px)`;
  ctx.beginPath(); ctx.roundRect(m.e, m.f, w * m.a, h * m.d, r); ctx.clip(); ctx.drawImage(AG_LAYER, 0, 0); ctx.filter = 'none'; ctx.setTransform(m);
  ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(0, 0, w, h);
  ctx.restore();
  ctx.lineWidth = 1.5 * UNIT; ctx.strokeStyle = 'rgba(255,255,255,0.30)'; ctx.beginPath(); ctx.roundRect(0.75, 0.75, w - 1.5, h - 1.5, r); ctx.stroke();
  if (o.draw) o.draw(w, h);   // micro-UI inside, in card coords
  ctx.restore();
}
// light text that rises 8 px as it fades in (rise 0..1)
function agText(str, x, y, size, o = {}) {
  const k = agSine(o.rise ?? 1); if (k <= 0) return;
  ctx.save(); ctx.globalAlpha = k * (o.alpha ?? 1); ctx.font = `${o.weight ?? 300} ${size * UNIT}px ${AG_TYPE}`; ctx.textAlign = o.align ?? 'left'; ctx.fillStyle = o.color ?? AG.ink;
  if (ctx.letterSpacing !== undefined) ctx.letterSpacing = `${(o.track ?? 0.02) * size * UNIT}px`;
  ctx.fillText(str, x, y + (1 - k) * 8 * UNIT * 2); ctx.restore();
}
// a voice waveform: bars that breathe, centred in a box (card coords)
function agWave(x, y, w, h, o = {}) {
  const n = o.bars ?? 28, bw = w / n * 0.55;
  ctx.save(); ctx.fillStyle = o.color ?? AG.ink;
  for (let i = 0; i < n; i++) { const a = 0.25 + 0.75 * Math.abs(Math.sin(TT * 2.4 + i * 0.55) * Math.sin(TT * 0.9 + i * 0.21)); const bh = h * a * (o.level ?? 1); ctx.globalAlpha = 0.75; ctx.beginPath(); ctx.roundRect(x + i * (w / n), y + (h - bh) / 2, bw, bh, bw / 2); ctx.fill(); }
  ctx.restore();
}
// a toggle switch (card coords), on 0..1
function agToggle(x, y, s, on) {
  const w = 96 * s * UNIT, h = 54 * s * UNIT, u = agSine(on);
  ctx.save(); ctx.fillStyle = `rgba(${Math.round(255 * (1 - u) + 62 * u)},${Math.round(255 * (1 - u) + 224 * u)},255,${0.18 + 0.5 * u})`; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 8 * UNIT; ctx.beginPath(); ctx.arc(x + h / 2 + (w - h) * u, y + h / 2, h * 0.4, 0, TAU); ctx.fill(); ctx.restore();
}
// the glass lens: magnifies the aurora layer under (x, y) by zoom, with a dispersed rim and a specular edge
function agLens(x, y, r, zoom = 1.35) {
  const [sx, sy] = toScreen(x, y), ri = Math.max(0, r - 3 * UNIT);   // the inner rims; a morph grows the hero from r = 0
  r = Math.max(0, r);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.shadowColor = 'rgba(4,2,20,0.5)'; ctx.shadowBlur = 40 * UNIT; ctx.beginPath(); ctx.arc(sx, sy, r, 0, TAU); ctx.fillStyle = 'rgba(0,0,0,0.01)'; ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.save(); ctx.clip(); ctx.translate(sx, sy); ctx.scale(zoom, zoom); ctx.translate(-sx, -sy); ctx.drawImage(AG_LAYER, 0, 0); ctx.restore();
  for (const [col, d] of [['rgba(255,80,160,0.5)', -3], ['rgba(80,220,255,0.5)', 3]]) { ctx.lineWidth = 4 * UNIT; ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(sx + d * UNIT, sy, ri, 0, TAU); ctx.stroke(); }
  const g = ctx.createLinearGradient(sx - r, sy - r, sx + r, sy + r); g.addColorStop(0, 'rgba(255,255,255,0.85)'); g.addColorStop(0.35, 'rgba(255,255,255,0.05)'); g.addColorStop(0.7, 'rgba(255,255,255,0.0)'); g.addColorStop(1, 'rgba(255,255,255,0.4)');
  ctx.lineWidth = 3 * UNIT; ctx.strokeStyle = g; ctx.beginPath(); ctx.arc(sx, sy, r, 0, TAU); ctx.stroke();
  ctx.restore();
}
// the hero: a small glass orb with two soft eyes
function agHero(x, y, r, o = {}) {
  const key = o.key ?? 'hero', b = Math.sin(TT * TAU * 0.35 + key.length) * r * 0.08;
  SPARK_AT = toScreen(x, y + b);
  agLens(x, y + b, r * ctx.getTransform().a, 1.15);
  const [sx, sy] = toScreen(x, y + b), R = r * ctx.getTransform().a, blink = (F + key.length * 7) % 59 < 3;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.shadowColor = 'rgba(160,140,255,0.8)'; ctx.shadowBlur = 14 * UNIT;
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx + s * R * 0.3, sy - R * 0.05, R * 0.09, blink ? R * 0.02 : R * (o.mood === 'wow' ? 0.17 : 0.13), 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}
const agCaption = (str) => { const f = () => agText(str, CX, H - SAFE.bottom - 60 * UNIT, 44, { align: 'center', rise: (TT - E0 - 0.3) / 1.2, color: AG.inkDim }); if (DEFER) DEFER.push(f); else f(); };

const STYLE = {
  name: 'aurora-glass',
  paper: '#0b0a1f',
  backdrop() { agAurora(); },
  window(P, key, src) {   // the old world through a frosted rim
    ctx.save(); trace(P, true); ctx.clip(); ctx.drawImage(src, 0, 0); ctx.restore();
    ctx.save(); trace(P, true); ctx.lineWidth = 2 * UNIT; ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.shadowColor = 'rgba(180,160,255,0.7)'; ctx.shadowBlur = 24 * UNIT; ctx.stroke(); ctx.restore();
  },
  blob(P, c) {   // the morphing shape: glass (blurred aurora inside, a light fill, a highlight edge)
    ctx.save(); trace(P, true); ctx.clip(); ctx.filter = `blur(${Math.round(24 * UNIT)}px)`; ctx.drawImage(AG_LAYER || ctx.canvas, 0, 0); ctx.filter = 'none';
    ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(-W, -H, W * 3, H * 3); ctx.restore();
    ctx.save(); trace(P, true); ctx.lineWidth = 1.5 * UNIT; ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.stroke(); ctx.restore();
  },
  hero(x, y, r, o = {}) { agHero(x, y, r * 0.5, o); },
  heroColor: '#7b5cff',
  post() {},
  ones: true,
};
