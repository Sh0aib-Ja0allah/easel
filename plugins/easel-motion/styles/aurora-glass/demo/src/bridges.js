// Easel (MIT): the aurora-glass demo, drawn with styles/aurora-glass/kit.js.
const ERA_BG = ['#0b0a1f', '#0b0a1f'];
function pieceCam(era, t) { return null; }
const BRIDGES = [
  // the card closes into the glass lens
  { tc: TIMELINE.morphs[0], d: 0.8, A: () => { const [x, y, w, h] = CARD(); return { P: rrectPts(x, y, w, h, 44 * UNIT), c: '#3d6bff' }; }, B: () => { const [x, y, r] = LENS(); return { P: ellipsePts(x, y - 10 * UNIT, r, r, 0, 64), c: '#7b5cff' }; } },
];
