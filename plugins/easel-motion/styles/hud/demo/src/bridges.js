// Easel (MIT): the hud demo, drawn with styles/hud/kit.js.
const ERA_BG = ['#031417', '#031417'];
function pieceCam(era, t) { return null; }
const BRIDGES = [
  // the radar closes in on the target box
  { tc: TIMELINE.morphs[0], d: 0.5, A: () => { const [x, y, r] = CORE(); return { P: ellipsePts(x, y, r, r, 0, 64), c: '#06262b' }; }, B: () => { const [x, y] = CORE(); return { P: rrectPts(x - 130 * UNIT, y - 130 * UNIT, 260 * UNIT, 260 * UNIT, 8 * UNIT), c: '#06262b' }; } },
];
