// =====================================================================
//  styles/liquid/kit.js: glossy candy liquid on a deep plum ground. Drops fall and squash, blobs fuse
//  as metaballs with stretched necks, a wave floods the frame, a wordmark coalesces out of liquid.
//  Easel original code (MIT). The look follows the signature features in Vincentwei1021/mg-styles-15's
//  liquid prompt @ 49052d80bfaf9fa8412cc9710530e5e95a3b8d8c (MIT, Copyright (c) 2026 Vincentwei1021).
//  Metaballs are a scalar field (sum of r^2 / d^2) on a quarter-resolution grid, thresholded, shaded
//  from the field's gradient (a specular highlight and a fresnel rim) and scaled up smoothly.
//  Built on kit/core.js; helpers are prefixed lq... Motion on 1s (STYLE.ones).
// =====================================================================
const LQ = { ground: '#2a0a2e', groundHi: '#4a1450', orange: '#ff7a1a', pink: '#ff3d8b', violet: '#8a3dff', spec: '#fff4fa', ink: '#ffe9f3' };
const LQ_TYPE = '"Space Grotesk", "Inter", sans-serif';   // bundled OFL
const lqEase = (u) => 1 - Math.pow(1 - clamp(u), 3.2);   // flung, never uniform: fast out, slow in
const LQ_RES = 4;   // field grid: one cell per 4 px
let LQ_BUF = null;
const lqHex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const LQ_RAMP = [lqHex(LQ.orange), lqHex(LQ.pink), lqHex(LQ.violet)];

function lqGround() {
  const g = ctx.createRadialGradient(W * 0.5, H * 0.35, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.8);
  g.addColorStop(0, LQ.groundHi); g.addColorStop(1, LQ.ground); ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3);
}
// balls: [{ x, y, r, sx?, sy? }] in screen pixels (sx, sy squash); o.wave: { y, amp, phase } adds a liquid floor
// rising from the bottom with 3-5 phase-offset bulges; o.mask: a canvas whose alpha joins the field (a wordmark)
function lqField(balls, o = {}) {
  const gw = Math.ceil(W / LQ_RES), gh = Math.ceil(H / LQ_RES);
  if (!LQ_BUF || LQ_BUF.width !== gw || LQ_BUF.height !== gh) { LQ_BUF = document.createElement('canvas'); LQ_BUF.width = gw; LQ_BUF.height = gh; }
  const g = LQ_BUF.getContext('2d', { willReadFrequently: true }), img = g.createImageData(gw, gh), d = img.data;
  let md = null;
  if (o.mask) { const mg = o.mask.getContext('2d', { willReadFrequently: true }); md = mg.getImageData(0, 0, gw, gh).data; }
  const field = new Float32Array(gw * gh);
  for (let j = 0; j < gh; j++) {
    const y = j * LQ_RES;
    for (let i = 0; i < gw; i++) {
      const x = i * LQ_RES; let f = 0;
      for (const b of balls) { const dx = (x - b.x) / (b.sx ?? 1), dy = (y - b.y) / (b.sy ?? 1); f += (b.r * b.r) / (dx * dx + dy * dy + 1); }
      if (o.wave) { const wy = o.wave.y - o.wave.amp * (Math.sin(x / W * TAU * 1.5 + o.wave.phase) * 0.6 + Math.sin(x / W * TAU * 3.7 + o.wave.phase * 1.7) * 0.4); f += Math.max(0, Math.min(4, (y - wy) / (18 * UNIT) + 1)); }
      if (md) f += md[(j * gw + i) * 4 + 3] / 255 * 1.6;
      field[j * gw + i] = 2.4 * Math.tanh(f / 2.4);   // soft-topped: smooth normals, no singular centres
    }
  }
  const L = [-0.45, -0.65, 0.62];   // light from the upper left, toward the viewer
  const LQ_H = (() => { const h = [L[0], L[1], L[2] + 1], n = Math.hypot(...h); return h.map((v) => v / n); })();
  for (let j = 1; j < gh - 1; j++) for (let i = 1; i < gw - 1; i++) {
    const k = j * gw + i, f = field[k]; if (f < 1) continue;
    const nx = (field[k - 1] - field[k + 1]) * 5, ny = (field[k - gw] - field[k + gw]) * 5, nz = 1;
    const nl = Math.hypot(nx, ny, nz), Nx = nx / nl, Ny = ny / nl, Nz = nz / nl;
    const diff = Math.max(0, Nx * L[0] + Ny * L[1] + Nz * L[2]);
    const spec = Math.pow(Math.max(0, Nx * LQ_H[0] + Ny * LQ_H[1] + Nz * LQ_H[2]), 60), rim = Math.pow(1 - Nz, 2.2);   // Blinn-Phong highlight, fresnel rim
    const u = clamp((j / gh) * 0.8 + (i / gw) * 0.2 + (o.hue ?? 0)), a = u < 0.5 ? 0 : 1, t = u < 0.5 ? u * 2 : u * 2 - 1, c0 = LQ_RAMP[a], c1 = LQ_RAMP[a + 1];
    const edge = clamp((f - 1) * 6);   // anti-aliased rim
    for (let c = 0; c < 3; c++) {
      let v = (c0[c] + (c1[c] - c0[c]) * t) * (0.55 + 0.6 * diff) + 255 * spec * 0.9 + 255 * rim * 0.35;
      d[k * 4 + c] = Math.min(255, v);
    }
    d[k * 4 + 3] = 255 * edge;
  }
  g.putImageData(img, 0, 0);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.shadowColor = 'rgba(10,0,16,0.55)'; ctx.shadowBlur = 30 * UNIT; ctx.shadowOffsetY = 16 * UNIT;
  ctx.drawImage(LQ_BUF, 0, 0, gw * LQ_RES, gh * LQ_RES); ctx.restore();
}
// a falling drop: from (x, y0) to (x, y1) over [t0, t0 + dur], squashing flat on landing, then a splash pair
function lqDrop(x, y0, y1, r, t0, dur = 0.6) {
  const u = (TT - t0) / dur; if (u < 0) return [];
  if (u < 1) { const y = y0 + (y1 - y0) * u * u; return [{ x, y, r, sx: 1 - 0.15 * u, sy: 1 + 0.35 * u }]; }
  const k = clamp((u - 1) * dur / 0.25), sq = 1 - 0.6 * Math.sin(Math.min(1, k) * Math.PI) * 0.7;
  const out = [{ x, y: y1 + r * (1 - sq) * 0.5, r, sx: 1 / Math.sqrt(sq), sy: sq }];
  if (k < 1) for (const s of [-1, 1]) out.push({ x: x + s * r * (1 + 2.2 * k), y: y1 - r * 1.6 * Math.sin(k * Math.PI), r: r * 0.28 * (1 - k * 0.5) });
  return out;
}
// a wordmark as a mask the field can fuse with (drawn at screen size; coalesce 0..1 grows it in)
function lqWordMask(str, x, y, size, coalesce = 1) {
  const gw = Math.ceil(W / LQ_RES), gh = Math.ceil(H / LQ_RES), m = document.createElement('canvas'); m.width = gw; m.height = gh;
  const g = m.getContext('2d'); g.font = `700 ${size * UNIT / LQ_RES}px ${LQ_TYPE}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.filter = `blur(${(1 - coalesce) * 6 + 1.2}px)`; g.globalAlpha = clamp(coalesce * 1.4); g.fillStyle = '#fff'; g.fillText(str, x / LQ_RES, y / LQ_RES);
  return m;
}
// the hero: a glossy drop with two eyes, drawn as its own small field so it shines like the rest
function lqHero(x, y, r, o = {}) {
  const key = o.key ?? 'hero', bob = Math.sin(TT * TAU * 0.8 + key.length) * r * 0.06;
  SPARK_AT = toScreen(x, y + bob);
  const [sx, sy] = toScreen(x, y + bob), z = ctx.getTransform().a;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const R = r * z, g = ctx.createRadialGradient(sx - R * 0.35, sy - R * 0.45, R * 0.1, sx, sy, R * 1.1);
  g.addColorStop(0, LQ.spec); g.addColorStop(0.18, LQ.pink); g.addColorStop(0.7, LQ.violet); g.addColorStop(1, '#3a0f5a');
  ctx.fillStyle = g; ctx.shadowColor = 'rgba(10,0,16,0.55)'; ctx.shadowBlur = 24 * UNIT; ctx.shadowOffsetY = 12 * UNIT;
  ctx.beginPath(); ctx.moveTo(sx, sy - R * 1.5); ctx.bezierCurveTo(sx + R * 0.5, sy - R * 0.9, sx + R, sy - R * 0.35, sx + R, sy + R * 0.15);
  ctx.arc(sx, sy + R * 0.15, R, 0, Math.PI); ctx.bezierCurveTo(sx - R, sy - R * 0.35, sx - R * 0.5, sy - R * 0.9, sx, sy - R * 1.5); ctx.fill();
  ctx.shadowColor = 'transparent';
  const blink = (F + key.length * 7) % 47 < 3, wow = o.mood === 'wow';
  for (const s of [-1, 1]) { ctx.fillStyle = '#1a0420'; ctx.beginPath(); ctx.ellipse(sx + s * R * 0.32, sy + R * 0.1, R * 0.11, blink ? R * 0.02 : R * (wow ? 0.2 : 0.15), 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sx + s * R * 0.32 + R * 0.03, sy + R * 0.04, R * 0.035, 0, TAU); ctx.fill(); }
  if (o.mood === 'happy') { ctx.strokeStyle = '#1a0420'; ctx.lineWidth = R * 0.07; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(sx, sy + R * 0.35, R * 0.22, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
  ctx.restore();
}
const lqCaption = (str) => { const f = () => { const k = lqEase((TT - E0 - 0.3) / 0.6); ctx.save(); ctx.globalAlpha = k; ctx.font = `700 ${50 * UNIT}px ${LQ_TYPE}`; ctx.textAlign = 'center'; ctx.fillStyle = LQ.ink; ctx.fillText(str, CX, H - SAFE.bottom - 60 * UNIT + (1 - k) * 20 * UNIT); ctx.restore(); }; if (DEFER) DEFER.push(f); else f(); };

const STYLE = {
  name: 'liquid',
  paper: '#2a0a2e',
  backdrop() { lqGround(); },
  window(P, key, src) {   // the old world seen through a glossy liquid-edged window
    ctx.save(); trace(P, true); ctx.clip(); ctx.drawImage(src, 0, 0); ctx.restore();
    ctx.save(); trace(P, true); ctx.lineWidth = 14 * UNIT; ctx.strokeStyle = LQ.pink; ctx.shadowColor = 'rgba(10,0,16,0.6)'; ctx.shadowBlur = 20 * UNIT; ctx.stroke();
    ctx.lineWidth = 4 * UNIT; ctx.strokeStyle = LQ.spec; ctx.shadowBlur = 0; ctx.stroke(); ctx.restore();
  },
  blob(P, c) {   // the morphing shape: a glossy candy fill with a highlight
    const bb = bbox(P), g = ctx.createLinearGradient(0, bb.y0, 0, bb.y1);
    g.addColorStop(0, LQ.orange); g.addColorStop(0.5, LQ.pink); g.addColorStop(1, LQ.violet);
    ctx.save(); trace(P, true); ctx.fillStyle = g; ctx.shadowColor = 'rgba(10,0,16,0.55)'; ctx.shadowBlur = 30 * UNIT; ctx.fill();
    ctx.clip(); ctx.shadowColor = 'transparent'; ctx.fillStyle = 'rgba(255,244,250,0.35)'; ctx.beginPath(); ctx.ellipse(bb.x0 + (bb.x1 - bb.x0) * 0.35, bb.y0 + (bb.y1 - bb.y0) * 0.28, (bb.x1 - bb.x0) * 0.18, (bb.y1 - bb.y0) * 0.08, -0.4, 0, TAU); ctx.fill(); ctx.restore();
  },
  hero(x, y, r, o = {}) { lqHero(x, y, r * 0.5, o); },
  heroColor: '#ff3d8b',
  post() {},
  ones: true,
};
