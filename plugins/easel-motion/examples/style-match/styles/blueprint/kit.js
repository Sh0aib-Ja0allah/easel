// style "blueprint", made with easel-motion style-match (Easel, MIT) from the three reference sheets in
// examples/style-match/references/, starting from templates/style/kit.js. Measured with measure_image:
// ground #1d4f91 (84%), minor grid #225596, major grid #3364a4, line #eaf3ff, dimension lines #bfe0ff,
// one warm accent #ffd166 (under 1%). Lines are 4 px at 1080 wide, constant, round caps; motion on 1s.
// Needs from the piece head: CX (caption centre x), SAFE. Names are prefixed bp... (core names are kept).
const BP = { ground: '#1d4f91', grid: '#225596', gridMajor: '#3364a4', ink: '#eaf3ff', dim: '#bfe0ff', accent: '#ffd166' };
const BP_MONO = '"JetBrains Mono", "Noto Sans Math", monospace';

// the sheet: ground, a 40 px minor grid and a 200 px major grid, scaled with UNIT
function bpSheet(c = BP.ground) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = c; ctx.fillRect(0, 0, W, H);
  const u = UNIT;
  for (const [step, col, w] of [[40 * u, BP.grid, 1], [200 * u, BP.gridMajor, 1.5]]) {
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath();
    for (let x = 0; x <= W; x += step) { ctx.moveTo(Math.round(x) + 0.5, 0); ctx.lineTo(Math.round(x) + 0.5, H); }
    for (let y = 0; y <= H; y += step) { ctx.moveTo(0, Math.round(y) + 0.5); ctx.lineTo(W, Math.round(y) + 0.5); }
    ctx.stroke();
  }
  ctx.restore();
}
// a drafted line through points P, drawn on with frac (0..1) along its length; o: closed, color, w, dash
function bpLine(P, o = {}) {
  const frac = clamp(o.frac ?? 1); if (frac <= 0) return;
  const Q = o.closed ? [...P, P[0]] : P;
  let len = 0; for (let i = 1; i < Q.length; i++) len += Math.hypot(Q[i][0] - Q[i - 1][0], Q[i][1] - Q[i - 1][1]);
  ctx.save(); ctx.strokeStyle = o.color || BP.ink; ctx.lineWidth = (o.w ?? 4) * UNIT; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(Q[0][0], Q[0][1]);
  let left = len * frac;
  for (let i = 1; i < Q.length && left > 0; i++) {
    const [ax, ay] = Q[i - 1], [bx, by] = Q[i], d = Math.hypot(bx - ax, by - ay), k = Math.min(1, left / (d || 1));
    ctx.lineTo(ax + (bx - ax) * k, ay + (by - ay) * k); left -= d;
  }
  if (o.dash) ctx.setLineDash(o.dash.map((v) => v * UNIT));
  ctx.stroke(); ctx.restore();
}
const bpCircle = (x, y, r, o = {}) => bpLine(ellipsePts(x, y, r, r, -Math.PI / 2, 72), { ...o, closed: true });
// mono label, typed on with count (characters shown)
function bpLabel(str, x, y, size, o = {}) {
  const n = o.count == null ? str.length : Math.max(0, Math.floor(o.count));
  ctx.save(); ctx.font = `${o.weight ?? 700} ${size * UNIT}px ${BP_MONO}`; ctx.fillStyle = o.color || BP.ink; ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(str.slice(0, n), x, y); ctx.restore();
}
// a dimension line from a to b with end ticks and a value, offset to one side
function bpDim(a, b, label, o = {}) {
  const frac = clamp(o.frac ?? 1); if (frac <= 0) return;
  const [ax, ay] = a, [bx, by] = b, nx = -(by - ay), ny = bx - ax, l = Math.hypot(nx, ny) || 1, t = 18 * UNIT;
  bpLine([a, [ax + (bx - ax) * frac, ay + (by - ay) * frac]], { color: BP.dim, w: 2, dash: [10, 8] });
  for (const [px, py] of [a, b]) bpLine([[px - nx / l * t, py - ny / l * t], [px + nx / l * t, py + ny / l * t]], { color: BP.dim, w: 2, frac: frac >= 1 ? 1 : 0 });
  if (frac >= 1) bpLabel(label, (ax + bx) / 2 + (o.dx ?? 0) * UNIT, (ay + by) / 2 + (o.dy ?? -16) * UNIT, 34, { align: 'center' });
}
// the hero: a drafting compass point, a circle with a crosshair and two eyes, in the warm accent
function bpHero(x, y, r, o = {}) {
  const key = o.key ?? 'hero';
  y += Math.sin(TT * TAU * 0.8 + key.length) * r * 0.05;
  SPARK_AT = toScreen(x, y);
  ctx.save(); ctx.fillStyle = BP.ground; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
  bpCircle(x, y, r, { color: BP.accent, w: 5 });
  bpLine([[x - r * 1.35, y], [x - r * 1.05, y]], { color: BP.accent, w: 3 }); bpLine([[x + r * 1.05, y], [x + r * 1.35, y]], { color: BP.accent, w: 3 });
  bpLine([[x, y - r * 1.35], [x, y - r * 1.05]], { color: BP.accent, w: 3 }); bpLine([[x, y + r * 1.05], [x, y + r * 1.35]], { color: BP.accent, w: 3 });
  const blink = (F + key.length * 7) % 53 < 3, wow = o.mood === 'wow';
  for (const s of [-1, 1]) { ctx.fillStyle = BP.accent; ctx.beginPath(); ctx.ellipse(x + s * r * 0.32, y - r * 0.1, r * 0.09, blink ? r * 0.02 : r * (wow ? 0.16 : 0.12), 0, 0, TAU); ctx.fill(); }
  if (o.mood === 'happy') bpLine(ellipsePts(x, y + r * 0.2, r * 0.3, r * 0.18, 0, 24).slice(1, 12), { color: BP.accent, w: 3 });
}
// the sheet title block (top left) and the caption (bottom), drawn after the camera (DEFER)
const bpTitle = (str, sub) => { const f = () => { bpLabel(str, 70, SAFE.top + 110, 56, { count: (TT - E0) * 40 }); if (sub) bpLabel(sub, 70, SAFE.top + 160, 30, { color: BP.dim, weight: 400, count: (TT - E0 - 0.3) * 40 }); }; if (DEFER) DEFER.push(f); else f(); };
const bpCaption = (str) => { const f = () => bpLabel(str, CX, H - SAFE.bottom - 60, 42, { align: 'center', count: (TT - E0 - 0.4) * 30 }); if (DEFER) DEFER.push(f); else f(); };

const STYLE = {
  name: 'blueprint',
  paper: BP.ground,
  backdrop(c) { bpSheet(/^#[0-9a-f]{6}$/i.test(c) ? c : BP.ground); },
  window(P, key, src) {   // the world seen through outline P, with a drafted rim
    ctx.save(); trace(P, true); ctx.clip(); ctx.drawImage(src, 0, 0); ctx.restore();
    bpLine(P, { closed: true, w: 4 });
  },
  blob(P, c, key) { bpLine(P, { closed: true, w: 4, color: BP.ink }); },   // a morph is a line drawing changing shape
  hero(x, y, r, o = {}) { bpHero(x, y, r * 0.55, o); },
  heroColor: BP.ground,
  post() {},
  ones: true,
};
