// Easel example piece (MIT): Where rain comes from. Drawn with the cut-paper kit (styles/cut-paper).
// =====================================================================
//  SCENES: one function per era, animated with TT / ev / popS, placed with LX / LY and sized by UNIT.
// =====================================================================
// the bridge objects, shared with src/bridges.js: the rising drop (end of era 0) becomes the cloud
const DROP = () => [LX(WIDE ? 0.62 : 0.56), LY(WIDE ? 0.24 : 0.24), 46 * UNIT];
const CLOUD = () => [LX(WIDE ? 0.62 : 0.56), LY(WIDE ? 0.24 : 0.24), 150 * UNIT];
const dropPts = (x, y, r) => { const P = []; for (let i = 0; i < 48; i++) { const a = i / 48 * TAU; const k = 1 + 0.55 * Math.max(0, -Math.sin(a)) ** 3; P.push([x + Math.cos(a) * r * (1 - 0.35 * Math.max(0, -Math.sin(a))), y + Math.sin(a) * r * k]); } return P; };
const cloudPts = (x, y, r) => { const P = []; for (let i = 0; i < 64; i++) { const a = i / 64 * TAU; const k = 1 + 0.16 * Math.cos(5 * a) ** 2; P.push([x + Math.cos(a) * r * 1.5 * k, y + Math.sin(a) * r * 0.62 * k]); } return P; };
function sea(y0, key) {   // three torn bands of sea that bob on the boil
  const u = UNIT;
  [[PAL.teal, 0], [PAL.blue, 70], ['#2f4f8f', 150]].forEach(([c, dy], i) => {
    const y = y0 + dy * u + Math.sin(TT * 2 + i) * 6 * u;
    cut([[-40, y], [W * 0.3, y - 18 * u], [W * 0.62, y + 12 * u], [W + 40, y - 10 * u], [W + 40, H + 60], [-40, H + 60]], c, { key: key + i, sy: -4 });
  });
}
function sceneSea() {
  const u = UNIT, [dx, dy, dr] = DROP();
  cut(rect(-30, -30, W + 60, H + 60, 0), PAL.sky, { key: 'skyS', shadow: false, tear: 0, shade: false, pat: pat.stripes('rgba(255,255,255,0.22)', 30, 80) });
  // the sun warms up: it grows a little and its glow pulses on the beat
  const warm = ev(TIMELINE.cues.warm, 0.6), sx = LX(WIDE ? 0.3 : 0.8), sy = LY(WIDE ? 0.2 : 0.13);   // clear of the place tag
  cut(ellipsePts(sx, sy, (70 + 18 * warm) * u, (70 + 18 * warm) * u, 0, 36), PAL.yellow, { key: 'sun', crayon: '#e6b23a' });
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + TT * 0.3; ink([[sx + Math.cos(a) * 100 * u, sy + Math.sin(a) * 100 * u], [sx + Math.cos(a) * (120 + 20 * warm) * u, sy + Math.sin(a) * (120 + 20 * warm) * u]], { w: 6 * u, color: '#e6b23a', key: 'ray' + i }); }
  const seaY = LY(WIDE ? 0.62 : 0.6);
  sea(seaY, 'seaS');
  // a boat drifts on the far band (background life)
  const bx = LX(0.12) + (TT * 18 * u) % (W * 0.4), by = seaY - 10 * u;
  cut([[bx - 60 * u, by], [bx + 60 * u, by], [bx + 40 * u, by + 26 * u], [bx - 40 * u, by + 26 * u]], PAL.woodD, { key: 'boat' });
  cut([[bx, by - 90 * u], [bx, by - 4 * u], [bx + 50 * u, by - 14 * u]], PAL.cream, { key: 'sail' });
  // small drops rise from the warm sea, one after another
  for (let i = 0; i < 5; i++) {
    const t0 = TIMELINE.cues.rise + i * 0.25, k = ev(t0, 1.6); if (k <= 0) continue;
    const x = LX(0.3 + i * 0.1), y = seaY - k * (seaY - dy) * (0.55 + 0.08 * i);
    cut(dropPts(x, y, 14 * u * (1 - 0.3 * k)), '#7fb7e6', { key: 'd' + i, sb: 3, shadow: false });
  }
  // the bridge drop: rises to where the cloud will be, with the spark riding beside it
  const k = EZ.io(ev(TIMELINE.cues.rise, M1 - TIMELINE.cues.rise - 0.6)), y = lerp(seaY + 20 * u, dy, k);
  cut(dropPts(dx, y, dr), '#7fb7e6', { key: 'bigdrop', sb: 5 });
  const hop = TT < 0.5 ? Math.sin(TT / 0.5 * Math.PI) * 40 * u : 0;   // the hook: the spark hops as the piece opens
  spark(dx - 110 * u, y + 30 * u - hop, 70 * u, { rays: 7, mood: k > 0.6 ? 'wow' : 'happy', key: 'hero', s: 0.8 });
  yearTag('the sea');
  capStrip('the sun warms the sea');
}
function sceneSky() {
  const u = UNIT, [cx, cy, cr] = CLOUD();
  cut(rect(-30, -30, W + 60, H + 60, 0), PAL.mint, { key: 'skyK', shadow: false, tear: 0, shade: false, pat: pat.stripes('rgba(255,255,255,0.18)', 30, 80) });
  // hills, a river that fills after the rain, a little house
  const hy = LY(WIDE ? 0.6 : 0.58);
  cut([[-40, hy + 30 * u], [W * 0.25, hy - 70 * u], [W * 0.5, hy + 10 * u], [W * 0.78, hy - 60 * u], [W + 40, hy], [W + 40, H + 60], [-40, H + 60]], PAL.green, { key: 'hill1', sy: -4, pat: pat.stripes('rgba(255,255,255,0.12)', 4, 22, 0.3) });
  cut([[-40, hy + 160 * u], [W * 0.4, hy + 110 * u], [W + 40, hy + 170 * u], [W + 40, H + 60], [-40, H + 60]], PAL.greenD, { key: 'hill2', sy: -4 });
  // the river fills from the rain onwards (eased), between the hills and clear of the caption
  const fill = EZ.o2(ev(TIMELINE.cues.rain, 1.5)), ry = hy + 70 * u;
  if (fill > 0) cut([[-40, ry], [W * fill * 0.5, ry - 16 * u], [W * fill + 40, ry + 8 * u], [W * fill + 40, ry + 50 * u], [-40, ry + 56 * u]], PAL.blue, { key: 'river', sy: -3 });
  const hx = LX(WIDE ? 0.2 : 0.18), hh = hy - 30 * u;
  cut(rect(hx - 50 * u, hh - 70 * u, 100 * u, 80 * u, 2), PAL.cream, { key: 'house' });
  cut([[hx - 65 * u, hh - 66 * u], [hx, hh - 130 * u], [hx + 65 * u, hh - 66 * u]], PAL.orangeD, { key: 'roof' });
  // the cloud (the bridge object), then the rain
  cut(cloudPts(cx + Math.sin(TT) * 6 * u, cy, cr), '#ffffff', { key: 'cloud', sb: 6 });
  const rain = ev(TIMELINE.cues.rain, 0.4);
  if (rain > 0) for (let i = 0; i < 14; i++) {
    const R = RNG('rain', i), x = cx + (R.r(-1.3, 1.3)) * cr, ph = ((TT * 1.4 + R.f()) % 1);
    const y = cy + cr * 0.5 + ph * (ry - cy - cr * 0.5);   // the rain reaches the river
    ink([[x, y], [x - 8 * u, y + 34 * u]], { w: 5 * u, color: PAL.blue, key: 'r' + i });
  }
  // the spark squeezes the cloud just before the rain starts, then backs off happy
  const squeeze = ev(TIMELINE.cues.rain - 0.5, 0.5) * (1 - ev(TIMELINE.cues.rain, 0.5));
  spark(cx + cr * 1.5 + (60 - 50 * squeeze) * u, cy + 40 * u, 74 * u, { rays: 8, mood: rain > 0 ? 'happy' : 'wow', key: 'hero', s: 0.85 + 0.1 * squeeze });
  yearTag('the sky');
  capStrip('and the cloud gives it back');
}
