// Easel example piece (MIT): eras, cameras and the one bridge, read by kit/morph.js.
const ERA_BG = ['#cfe2ee', '#a9d9c6'];
function pieceCam(era, t) { return null; }
const BRIDGES = [
  // the rising drop becomes the cloud (shapes from src/scenes.js)
  { tc: TIMELINE.morphs[0], A: () => { const [x, y, r] = DROP(); return { P: dropPts(x, y, r), c: '#7fb7e6' }; }, B: () => { const [x, y, r] = CLOUD(); return { P: cloudPts(x, y, r), c: '#ffffff' }; } },
];
