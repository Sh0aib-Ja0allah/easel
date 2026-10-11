// The style-match example's scenes (Easel, MIT), drawn with the blueprint kit (../styles/blueprint/kit.js).
const PART = () => [LX(0.5), LY(WIDE ? 0.42 : 0.47), (WIDE ? 170 : 250) * UNIT];
// the bulb outline, centred on (x, y) with radius r (the glass), as one closed path
function bulbPts(x, y, r) {
  const P = [];
  for (let i = 0; i <= 40; i++) { const a = Math.PI * 0.78 + i / 40 * Math.PI * 1.44; P.push([x + Math.cos(a) * r, y - r * 0.25 + Math.sin(a) * r]); }
  P.push([x + r * 0.45, y + r * 0.95], [x + r * 0.45, y + r * 1.25], [x - r * 0.45, y + r * 1.25], [x - r * 0.45, y + r * 0.95]);
  return P;
}
function gearPts(x, y, r, rot = 0, teeth = 12) {
  const P = [];
  for (let i = 0; i < teeth * 4; i++) { const a = rot + i / (teeth * 4) * TAU, k = (i % 4 === 1 || i % 4 === 2) ? 1.18 : 1; P.push([x + Math.cos(a) * r * k, y + Math.sin(a) * r * k]); }
  return P;
}
function sceneIdea() {
  STYLE.backdrop(BP.ground);
  const [x, y, r] = PART(), cu = TIMELINE.cues, u = UNIT;
  bpLine(bulbPts(x, y, r), { closed: true, frac: ev(cu.draw, 1.0) });
  for (let i = 0; i < 3; i++) bpLine([[x - r * (0.4 - i * 0.05), y + r * (1.4 + i * 0.18)], [x + r * (0.4 - i * 0.05), y + r * (1.4 + i * 0.18)]], { frac: ev(cu.draw + 0.8 + i * 0.12, 0.25) });
  bpLine([[x - r * 0.25, y + r * 0.95], [x - r * 0.12, y - r * 0.3], [x, y - r * 0.05], [x + r * 0.12, y - r * 0.3], [x + r * 0.25, y + r * 0.95]], { color: BP.accent, frac: ev(cu.draw + 0.6, 0.6) });
  // leader lines and labels, typed on
  const lx = x + r * (WIDE ? 1.15 : 0.98), ls = WIDE ? 28 : 24;   // labels stay left of the 9:16 side buttons
  bpLine([[x + r * 0.95, y - r * 0.5], [lx, y - r * 0.5]], { color: BP.dim, w: 2, frac: ev(cu.label, 0.25) });
  bpLabel('GLASS', lx + 14 * u, y - r * 0.5 + 10 * u, ls, { count: (TT - cu.label - 0.2) * 24 });
  bpLine([[x + r * 0.13, y - r * 0.2], [lx, y - r * 0.2]], { color: BP.dim, w: 2, frac: ev(cu.label + 0.25, 0.25) });
  bpLabel('FILAMENT', lx + 14 * u, y - r * 0.2 + 10 * u, ls, { color: BP.accent, count: (TT - cu.label - 0.45) * 24 });
  STYLE.hero(x - r * 1.45, y + r * 1.1, 110 * u, { mood: TT > cu.label ? 'wow' : 'calm', key: 'hero' });
  bpTitle('IDEA', 'SHEET 01 · DETAIL');
  bpCaption('first, draw the idea');
}
function sceneMechanism() {
  STYLE.backdrop(BP.ground);
  const [x, y, r] = PART(), cu = TIMELINE.cues, u = UNIT, rot = (TT - M1) * 0.6;
  bpLine(gearPts(x, y, r * 0.95, rot), { closed: true });
  bpCircle(x, y, r * 0.32);
  bpCircle(x, y, r * 1.2, { color: BP.dim, w: 2, dash: [10, 8] });
  bpLine([[x - r * 1.4, y], [x + r * 1.4, y]], { color: BP.dim, w: 2, dash: [30, 10, 4, 10] });
  bpLine([[x, y - r * 1.4], [x, y + r * 1.4]], { color: BP.dim, w: 2, dash: [30, 10, 4, 10] });
  bpDim([x - r * 1.2, y + r * 1.55], [x + r * 1.2, y + r * 1.55], 'Ø 2R', { frac: ev(cu.dim, 0.4), dy: 46 });
  STYLE.hero(x + r * 1.5, y - r * 1.05, 110 * u, { mood: 'happy', key: 'hero' });
  bpTitle('MECHANISM', 'SHEET 02 · 12 TEETH');
  bpCaption('then make it turn');
}
