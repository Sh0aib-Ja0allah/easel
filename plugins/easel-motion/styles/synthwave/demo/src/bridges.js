// Easel (MIT): the synthwave demo, drawn with styles/synthwave/kit.js.
const ERA_BG = ['#3a0c55', '#3a0c55'];
function pieceCam(era, t) { return null; }
const BRIDGES = [
  // the rising sun becomes the neon ring
  { tc: TIMELINE.morphs[0], A: () => { const [x, y, r] = SUN(); return { P: ellipsePts(x, y - r * 0.4, r, r * 0.6, 0, 64), c: '#ff9a3c' }; }, B: () => { const [x, y, r] = RING(); return { P: ellipsePts(x, y, r, r, 0, 64), c: '#2de2ff' }; } },
];
