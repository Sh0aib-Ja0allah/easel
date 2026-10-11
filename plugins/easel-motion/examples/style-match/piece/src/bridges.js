// The style-match example's bridge (Easel, MIT): the bulb's outline becomes the gear's.
const ERA_BG = [BP.ground, BP.ground];
function pieceCam(era, t) { return null; }
const BRIDGES = [
  { tc: TIMELINE.morphs[0], A: () => { const [x, y, r] = PART(); return { P: bulbPts(x, y, r), c: BP.ground }; }, B: () => { const [x, y, r] = PART(); return { P: gearPts(x, y, r * 0.95, 0), c: BP.ground }; } },
];
