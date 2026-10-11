// =====================================================================
//  styles/hud/kit.js: a fictional heads-up display. Cyan linework on deep teal-black that draws on in
//  staggered layers, a hex grid, rotating rings with ticks, a radar sweep with blips, rolling monospace
//  data, typewriter status lines, lock-on brackets that snap from 1.4 to 1.0, and an orange alert state,
//  under glow, a little chromatic offset and scanlines.
//  Easel original code (MIT). The look follows the signature features in Vincentwei1021/mg-styles-15's
//  HUD prompt @ 49052d80bfaf9fa8412cc9710530e5e95a3b8d8c (MIT, Copyright (c) 2026 Vincentwei1021).
//  Built on kit/core.js; helpers are prefixed hd... Motion on 1s (STYLE.ones).
// =====================================================================
const HD = { ground: '#031417', groundHi: '#06262b', cyan: '#00e5ff', cyanDim: 'rgba(0,229,255,0.35)', alert: '#ff6a00', ink: '#d9fbff' };
const HD_MONO = '"JetBrains Mono", "Noto Sans Math", monospace';   // bundled OFL
const hdSnap = (u) => 1 - Math.pow(1 - clamp(u), 4);   // fast out, slow in
let HD_ALERT = 0;   // 0..1: cyan -> alert orange for everything drawn after it is set
const hdCol = (a = 1) => { const c0 = [0, 229, 255], c1 = [255, 106, 0], k = HD_ALERT; return `rgba(${c0.map((v, i) => Math.round(v + (c1[i] - v) * k)).join(',')},${a})`; };
const hdGlow = (w = 3, blur = 14) => { ctx.lineWidth = w * UNIT; ctx.strokeStyle = hdCol(1); ctx.shadowColor = hdCol(0.9); ctx.shadowBlur = blur * UNIT; ctx.lineCap = 'round'; };

function hdGround() {
  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
  g.addColorStop(0, HD.groundHi); g.addColorStop(1, HD.ground); ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3);
}
// a hex grid that fades in from the centre (reveal 0..1)
function hdHex(size = 60, reveal = 1) {
  const s = size * UNIT, hgt = Math.sqrt(3) * s, cx = W / 2, cy = H / 2, maxD = Math.hypot(W, H) / 2;
  ctx.save(); ctx.lineWidth = 1 * UNIT;
  for (let row = -2; row * hgt < H + hgt * 2; row++) for (let col = -2; col * s * 1.5 < W + s * 3; col++) {
    const x = col * s * 1.5, y = row * hgt + (col % 2 ? hgt / 2 : 0), d = Math.hypot(x - cx, y - cy) / maxD;
    const a = clamp(reveal * 1.6 - d) * 0.16; if (a <= 0) continue;
    ctx.strokeStyle = hdCol(a); ctx.beginPath();
    for (let k = 0; k <= 6; k++) { const ang = k / 6 * TAU; const px = x + Math.cos(ang) * s * 0.92, py = y + Math.sin(ang) * s * 0.92; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.stroke();
  }
  ctx.restore();
}
// a ring that draws on (draw 0..1), with n ticks, rotating at speed (turns per second)
function hdRing(x, y, r, o = {}) {
  const draw = clamp(o.draw ?? 1); if (draw <= 0) return;
  const rot = TT * TAU * (o.speed ?? 0.05) + (o.phase ?? 0);
  ctx.save(); hdGlow(o.w ?? 3, 14);
  ctx.beginPath(); ctx.arc(x, y, r, rot, rot + TAU * draw * (o.span ?? 1)); ctx.stroke();
  const n = o.ticks ?? 48; ctx.lineWidth = 1.5 * UNIT; ctx.shadowBlur = 6 * UNIT;
  ctx.beginPath();
  for (let i = 0; i < n * draw; i++) { const a = rot + i / n * TAU, L = (i % 4 ? 8 : 18) * UNIT; ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.lineTo(x + Math.cos(a) * (r - L), y + Math.sin(a) * (r - L)); }
  ctx.stroke(); ctx.restore();
}
// a radar: a conic sweep wedge turning once every period seconds, with blips that flash as it passes
function hdRadar(x, y, r, o = {}) {
  const per = o.period ?? 2.4, a = (TT / per) * TAU;
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
  const g = ctx.createConicGradient(a - 0.9, x, y); g.addColorStop(0, hdCol(0)); g.addColorStop(0.14, hdCol(0.35)); g.addColorStop(0.145, hdCol(0)); g.addColorStop(1, hdCol(0));
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  for (const [bx, by] of o.blips ?? []) {
    const ba = Math.atan2(by, bx), since = ((a - ba) % TAU + TAU) % TAU / TAU * per, k = Math.exp(-since * 2.2);
    ctx.fillStyle = hdCol(0.25 + 0.75 * k); ctx.shadowColor = hdCol(1); ctx.shadowBlur = 12 * UNIT * k; ctx.beginPath(); ctx.arc(x + bx * r, y + by * r, (5 + 5 * k) * UNIT, 0, TAU); ctx.fill();
  }
  ctx.restore();
  hdRing(x, y, r, { ticks: 72, speed: 0, w: 2, draw: o.draw ?? 1 });
  ctx.save(); hdGlow(1, 4); ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.stroke(); ctx.restore();
}
// monospace data: numbers that roll for `roll` seconds after t0 then settle on their values
function hdData(lines, x, y, size, o = {}) {
  ctx.save(); ctx.font = `500 ${size * UNIT}px ${HD_MONO}`; ctx.textBaseline = 'alphabetic'; ctx.shadowColor = hdCol(0.8); ctx.shadowBlur = 8 * UNIT;
  lines.forEach((line, i) => {
    const t0 = (o.t0 ?? 0) + i * (o.stagger ?? 0.08); if (TT < t0) return;
    const rolling = TT < t0 + (o.roll ?? 0.18), R = RNG('hdroll', i, F);
    const txt = rolling ? line.replace(/\d/g, () => String(Math.floor(R.f() * 10))) : line;
    ctx.fillStyle = i === 0 ? hdCol(1) : hdCol(0.75); ctx.fillText(txt, x, y + i * size * 1.45 * UNIT);
  });
  ctx.restore();
}
// a typewriter status line with a blinking block cursor
function hdType(str, x, y, size, t0, cps = 24, o = {}) {
  const n = Math.max(0, Math.floor((TT - t0) * cps)); if (TT < t0) return;
  ctx.save(); ctx.font = `700 ${size * UNIT}px ${HD_MONO}`; ctx.textAlign = o.align ?? 'left'; ctx.fillStyle = o.color ?? hdCol(1); ctx.shadowColor = hdCol(0.9); ctx.shadowBlur = 12 * UNIT;
  const shown = str.slice(0, n); ctx.fillText(shown, x, y);
  if (Math.floor(TT * 3) % 2 === 0 || n < str.length) { const w = ctx.measureText(shown).width, cx0 = (o.align === 'center' ? x + w / 2 : x + w) + 4 * UNIT; ctx.fillRect(cx0, y - size * 0.8 * UNIT, size * 0.55 * UNIT, size * 0.9 * UNIT); }
  ctx.restore();
}
// lock-on brackets around a box: snap from 1.4x to 1.0x over 0.35 s after t0 (fast out, slow in)
function hdLock(x, y, w, h, t0) {
  if (TT < t0) return;
  const k = hdSnap((TT - t0) / 0.35), s = 1.4 - 0.4 * k, hw = w * s / 2, hh = h * s / 2, L = Math.min(w, h) * 0.25;
  ctx.save(); hdGlow(5, 18); ctx.globalAlpha = Math.min(1, (TT - t0) / 0.1);
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { ctx.beginPath(); ctx.moveTo(x + sx * hw, y + sy * hh + -sy * L); ctx.lineTo(x + sx * hw, y + sy * hh); ctx.lineTo(x + sx * hw + -sx * L, y + sy * hh); ctx.stroke(); }
  ctx.restore();
}
// the post pass: scanlines, a faint chromatic edge, a vignette
function hdPost() {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.06; ctx.drawImage(ctx.canvas, 2 * UNIT, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
// the hero: a small reticle drone with two eyes
function hdHero(x, y, r, o = {}) {
  const key = o.key ?? 'hero'; y += Math.sin(TT * TAU * 0.9 + key.length) * r * 0.05;
  SPARK_AT = toScreen(x, y);
  ctx.save(); ctx.fillStyle = HD.ground; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); hdGlow(4, 16); ctx.stroke();
  ctx.lineWidth = 2 * UNIT; ctx.beginPath(); ctx.arc(x, y, r * 1.35, -0.6, 0.6); ctx.moveTo(x + Math.cos(Math.PI - 0.6) * r * 1.35, y + Math.sin(Math.PI - 0.6) * r * 1.35); ctx.arc(x, y, r * 1.35, Math.PI - 0.6, Math.PI + 0.6); ctx.stroke();
  const blink = (F + key.length * 7) % 53 < 3; ctx.fillStyle = hdCol(1);
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + s * r * 0.32, y - r * 0.05, r * 0.1, blink ? r * 0.02 : r * (o.mood === 'wow' ? 0.18 : 0.13), 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}
const hdCaption = (str) => { const f = () => hdType(str.toUpperCase(), CX, H - SAFE.bottom - 60 * UNIT, 34, E0 + 0.3, 30, { align: 'center' }); if (DEFER) DEFER.push(f); else f(); };

const STYLE = {
  name: 'hud',
  paper: '#031417',
  backdrop() { hdGround(); hdHex(60, 1); },
  window(P, key, src) {   // the old view through a glowing frame
    ctx.save(); trace(P, true); ctx.clip(); ctx.drawImage(src, 0, 0); ctx.restore();
    ctx.save(); trace(P, true); hdGlow(4, 20); ctx.stroke(); ctx.restore();
  },
  blob(P) { ctx.save(); trace(P, true); ctx.fillStyle = hdCol(0.08); ctx.fill(); hdGlow(3, 16); ctx.stroke(); ctx.restore(); },
  hero(x, y, r, o = {}) { hdHero(x, y, r * 0.5, o); },
  heroColor: '#00e5ff',
  post() { hdPost(); },
  ones: true,
};
