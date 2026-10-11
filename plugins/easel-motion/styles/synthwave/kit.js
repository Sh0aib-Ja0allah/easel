// =====================================================================
//  styles/synthwave/kit.js: an 80s retro night drive. Deep purple sky, a striped sunset sun, a neon
//  perspective grid rushing at the camera, wireframe mountains, palm silhouettes, chrome type and a
//  neon script with a double glow, under a light VHS pass (scanlines, a little chroma).
//  Easel original code (MIT). The look follows the signature features in Vincentwei1021/mg-styles-15's
//  synthwave prompt @ 49052d80bfaf9fa8412cc9710530e5e95a3b8d8c (MIT, Copyright (c) 2026 Vincentwei1021).
//  Built on kit/core.js; every helper is prefixed sw... Motion on 1s (STYLE.ones).
// =====================================================================
const SW = {
  skyTop: '#12051f', skyMid: '#3a0c55', skyLow: '#8a1f7a', horizon: '#ff4f9a',
  sunTop: '#ffe066', sunMid: '#ff9a3c', sunLow: '#ff2a6d',
  grid: '#ff3df2', gridAlt: '#2de2ff', floor: '#0d0322', mountain: '#2de2ff', mountainFill: '#1a0636',
  palm: '#07020f', chrome: ['#2b2f77', '#9fd3ff', '#ffffff', '#ff7ad9', '#3a1c71'], neon: '#ff3df2', neonCore: '#ffe3fb', cyan: '#2de2ff',
};
const SW_DISPLAY = '"Inter", "Noto Sans Math", sans-serif';   // bundled OFL; set heavy and wide for chrome
const SW_SCRIPT = '"Caveat", cursive';                          // bundled OFL; the neon script

// the sky: a deep purple gradient with a few twinkling stars (seeded)
function swSky(horizonY) {
  const g = ctx.createLinearGradient(0, 0, 0, horizonY);
  g.addColorStop(0, SW.skyTop); g.addColorStop(0.55, SW.skyMid); g.addColorStop(0.9, SW.skyLow); g.addColorStop(1, SW.horizon);
  ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, horizonY + H);
  const R = RNG('swstars');
  for (let i = 0; i < 90; i++) {
    const x = R.r(0, W), y = R.r(0, horizonY * 0.75), tw = 0.5 + 0.5 * Math.sin(TT * (2 + R.r(0, 3)) + i);
    ctx.fillStyle = `rgba(255,236,255,${0.25 + 0.6 * tw * R.r(0.3, 1)})`; ctx.fillRect(x, y, R.r(1.5, 3) * UNIT, R.r(1.5, 3) * UNIT);
  }
}
// the sun: a sunset gradient disc cut by horizontal bands that thicken toward the bottom; rise = 0..1
function swSun(x, y, r, rise = 1) {
  const cy = y + (1 - rise) * r * 1.2;
  ctx.save(); ctx.beginPath(); ctx.rect(-W, -H, W * 3, y + H); ctx.clip();   // never below the horizon
  ctx.shadowColor = SW.sunLow; ctx.shadowBlur = 60 * UNIT;
  const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, SW.sunTop); g.addColorStop(0.5, SW.sunMid); g.addColorStop(1, SW.sunLow);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, cy, r, 0, TAU); ctx.fill();
  ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 7; i++) { const t = ((i + TT * 0.35) / 7) % 1, by = cy + r * (0.02 + t * 0.98), bh = r * (0.01 + 0.07 * t); ctx.fillRect(x - r - 2, by, r * 2 + 4, bh); }   // bands drift down slowly
  ctx.restore();
}
// the floor: one-point perspective grid scrolling toward the camera; speed in grid rows per second
function swGrid(horizonY, speed = 1.5, o = {}) {
  const vx = o.vx ?? W / 2, bottom = H + 40;
  ctx.save(); ctx.fillStyle = SW.floor; ctx.fillRect(-W, horizonY, W * 3, bottom - horizonY + H);
  ctx.lineCap = 'round';
  const glow = (col, w, blur) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.shadowColor = col; ctx.shadowBlur = blur; };
  for (const [col, w, blur] of [[SW.grid, 6 * UNIT, 30 * UNIT], [SW.neonCore, 2 * UNIT, 4 * UNIT]]) {
    glow(col, w, blur); ctx.beginPath();
    for (let i = -24; i <= 24; i++) { ctx.moveTo(vx + i * 6 * UNIT, horizonY); ctx.lineTo(vx + i * (W / 6), bottom); }
    const ph = (TT * speed) % 1;
    for (let k = 0; k < 22; k++) { const z = k + 1 - ph, y = horizonY + (bottom - horizonY) / (1 + z * 0.55); if (y > horizonY + 1 && y < bottom) { ctx.moveTo(-W, y); ctx.lineTo(W * 2, y); } }
    ctx.stroke();
  }
  // a hot line at the horizon
  glow(SW.horizon, 3 * UNIT, 24 * UNIT); ctx.beginPath(); ctx.moveTo(-W, horizonY); ctx.lineTo(W * 2, horizonY); ctx.stroke();
  ctx.restore();
}
// wireframe mountains on the horizon (seeded ridge), a cyan double-glow outline over a dark fill
function swMountains(horizonY, o = {}) {
  const R = RNG('swmtn', o.key ?? 0), P = [[-20, horizonY]];
  for (let x = -20; x <= W + 40; x += 60 * UNIT) P.push([x, horizonY - Math.max(0, R.r(-40, 200) * UNIT * (0.35 + 0.65 * Math.abs(Math.sin(x / W * 3.1 + 0.6))))]);
  P.push([W + 40, horizonY]);
  ctx.save(); ctx.fillStyle = SW.mountainFill; ctx.beginPath(); P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = SW.mountain; ctx.lineWidth = 2.5 * UNIT; ctx.shadowColor = SW.mountain; ctx.shadowBlur = 14 * UNIT; ctx.stroke();
  ctx.lineWidth = 1 * UNIT; ctx.globalAlpha = 0.5; ctx.beginPath();
  for (let i = 1; i < P.length - 1; i += 2) { ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[i][0] + 30 * UNIT, horizonY); }
  ctx.stroke(); ctx.restore();
}
// a palm silhouette (trunk curve + fronds), s = scale, sway from TT
function swPalm(x, y, s = 1, key = 'palm') {
  const sway = Math.sin(TT * 1.3 + key.length) * 0.05;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * UNIT, s * UNIT); ctx.rotate(sway); ctx.fillStyle = SW.palm; ctx.strokeStyle = SW.palm;
  ctx.lineWidth = 26; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(30, -200, -10, -420); ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.42 + sway * 2, L = 170 + (i % 2) * 40;
    ctx.beginPath(); ctx.moveTo(-10, -420);
    ctx.quadraticCurveTo(-10 + Math.cos(a) * L * 0.6, -420 + Math.sin(a) * L * 0.6 - 40, -10 + Math.cos(a) * L, -420 + Math.sin(a) * L + 50);
    ctx.quadraticCurveTo(-10 + Math.cos(a) * L * 0.5, -420 + Math.sin(a) * L * 0.5 - 10, -10, -414); ctx.fill();
  }
  ctx.restore();
}
// chrome type: a multi-stop metal gradient, a bevel highlight, a star glint at glint (0..1 across)
function swChrome(str, x, y, size, o = {}) {
  const s = size * UNIT;
  ctx.save(); ctx.font = `italic 900 ${s}px ${SW_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const pop = o.pop ?? 1, w = ctx.measureText(str).width, sc = Math.min(1, (o.maxW ?? W * 0.86) / (w * pop));   // fits even mid-slam
  ctx.translate(x, y); ctx.scale(sc * pop, sc * pop);
  ctx.shadowColor = SW.neon; ctx.shadowBlur = 30 * UNIT; ctx.fillStyle = SW.chrome[4]; ctx.fillText(str, 4 * UNIT, 6 * UNIT);
  ctx.shadowBlur = 0;
  const g = ctx.createLinearGradient(0, -s * 0.85, 0, s * 0.1);
  SW.chrome.forEach((c, i) => g.addColorStop([0, 0.45, 0.5, 0.75, 1][i], c));
  ctx.fillStyle = g; ctx.fillText(str, 0, 0);
  ctx.lineWidth = 2 * UNIT; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.strokeText(str, 0, 0);
  if (o.glint != null && o.glint > 0 && o.glint < 1) {   // a four-point star sliding along the top edge
    const gx = -w / 2 + w * o.glint, gy = -s * 0.7, k = Math.sin(o.glint * Math.PI);
    ctx.fillStyle = '#ffffff'; ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 20 * UNIT;
    for (const [dx, dy] of [[1, 0], [0, 1]]) { ctx.beginPath(); ctx.ellipse(gx, gy, (dx ? 70 : 6) * UNIT * k, (dy ? 70 : 6) * UNIT * k, 0, 0, TAU); ctx.fill(); }
  }
  ctx.restore();
}
// a neon script word that writes on (frac 0..1) with a tube flicker; double glow: tight core + wide halo
function swNeon(str, x, y, size, o = {}) {
  const frac = clamp(o.frac ?? 1); if (frac <= 0) return;
  const s = size * UNIT, R = RNG('swflick', o.key ?? str, F);
  const on = frac < 1 ? 1 : (R.f() < 0.06 ? 0.35 : 1);   // a rare flicker once lit
  ctx.save(); ctx.font = `700 ${s}px ${SW_SCRIPT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const w = ctx.measureText(str).width; ctx.translate(x, y); ctx.rotate(o.rot ?? -0.06);
  ctx.beginPath(); ctx.rect(-w / 2 - 20, -s * 1.2, (w + 40) * frac, s * 1.8); ctx.clip();
  ctx.globalAlpha = on;
  ctx.lineWidth = 7 * UNIT; ctx.strokeStyle = o.color ?? SW.neon; ctx.shadowColor = o.color ?? SW.neon; ctx.shadowBlur = 30 * UNIT; ctx.strokeText(str, 0, 0);
  ctx.lineWidth = 2.5 * UNIT; ctx.strokeStyle = SW.neonCore; ctx.shadowBlur = 4 * UNIT; ctx.strokeText(str, 0, 0);
  ctx.restore();
}
// the VHS pass: scanlines (2 px every 4 px, 10% black), a soft vignette, a rare tracking line
function swVHS() {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(0,0,0,0.10)'; for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2);
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.45)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  const R = RNG('swtrack', Math.floor(F / 6));
  if (R.f() < 0.25) { const y = R.r(0, H), h = R.r(3, 10) * UNIT; ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(0, y, W, h); ctx.fillStyle = 'rgba(45,226,255,0.10)'; ctx.fillRect(0, y + h, W, 2 * UNIT); }
  ctx.restore();
}
// the hero: a neon ring with two eyes and a cyan crosshair glint; r is its radius
function swHero(x, y, r, o = {}) {
  const key = o.key ?? 'hero';
  y += Math.sin(TT * TAU * 0.7 + key.length) * r * 0.05;
  SPARK_AT = toScreen(x, y);
  ctx.save();
  ctx.fillStyle = SW.floor; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.lineWidth = 8 * UNIT; ctx.strokeStyle = SW.cyan; ctx.shadowColor = SW.cyan; ctx.shadowBlur = 30 * UNIT; ctx.stroke();
  ctx.lineWidth = 2.5 * UNIT; ctx.strokeStyle = '#e8fdff'; ctx.shadowBlur = 4 * UNIT; ctx.stroke();
  const blink = (F + key.length * 5) % 50 < 3, wow = o.mood === 'wow';
  ctx.fillStyle = SW.neonCore; ctx.shadowColor = SW.neon; ctx.shadowBlur = 16 * UNIT;
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + s * r * 0.32, y - r * 0.08, r * 0.1, blink ? r * 0.02 : r * (wow ? 0.18 : 0.13), 0, 0, TAU); ctx.fill(); }
  if (o.mood === 'happy') { ctx.lineWidth = 4 * UNIT; ctx.strokeStyle = SW.neonCore; ctx.beginPath(); ctx.arc(x, y + r * 0.12, r * 0.28, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke(); }
  ctx.restore();
}
// captions: a small neon-cyan mono-ish line under the safe area, drawn after the camera (DEFER)
const swCaption = (str) => { const f = () => { const k = clamp((TT - E0 - 0.3) / 0.6); ctx.save(); ctx.globalAlpha = k; ctx.font = `700 ${46 * UNIT}px ${SW_DISPLAY}`; ctx.textAlign = 'center'; ctx.fillStyle = '#e8fdff'; ctx.shadowColor = SW.cyan; ctx.shadowBlur = 18 * UNIT; ctx.fillText(str.toUpperCase(), CX, H - SAFE.bottom - 60 * UNIT); ctx.restore(); }; if (DEFER) DEFER.push(f); else f(); };

const STYLE = {
  name: 'synthwave',
  paper: '#12051f',
  backdrop(c) { const hz = H * 0.58; swSky(hz); swGrid(hz, 1.2); },
  window(P, key, src) {   // the old world through a neon-rimmed window
    ctx.save(); trace(P, true); ctx.clip(); ctx.drawImage(src, 0, 0); ctx.restore();
    ctx.save(); trace(P, true); ctx.lineWidth = 6 * UNIT; ctx.strokeStyle = SW.neon; ctx.shadowColor = SW.neon; ctx.shadowBlur = 30 * UNIT; ctx.stroke();
    ctx.lineWidth = 2 * UNIT; ctx.strokeStyle = SW.neonCore; ctx.shadowBlur = 4 * UNIT; ctx.stroke(); ctx.restore();
  },
  blob(P, c) {   // the morphing shape: a translucent fill with a cyan neon outline
    ctx.save(); trace(P, true); ctx.fillStyle = c; ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1;
    ctx.lineWidth = 6 * UNIT; ctx.strokeStyle = SW.cyan; ctx.shadowColor = SW.cyan; ctx.shadowBlur = 30 * UNIT; ctx.stroke(); ctx.restore();
  },
  hero(x, y, r, o = {}) { swHero(x, y, r * 0.55, o); },
  heroColor: '#2de2ff',
  post() { swVHS(); },
  ones: true,
};
