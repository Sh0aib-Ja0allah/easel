  // Easel (MIT): the liquid demo, drawn with styles/liquid/kit.js.
  const T = TIMELINE, cu = T.cues;
  to = 'm';
  pad(0.0, 6.05, ['D3', 'A3', 'E4'], 0.035, { type: 'triangle', cut: 900, att: 0.2, rel: 0.3, send: 0.5 });
  drone(2.5, 6.05, nz('D2'), 0.05, { att: 1.0 });
  to = 's';
  [0, 0.25, 0.5].forEach((dt) => { blip(cu.drop + dt + 0.5, 300, 900, 0.08, 0.16); noiseHit(cu.drop + dt + 0.55, 0.12, 'lowpass', 900, 1, 0.08); });   // gloops and splats
  sweep(cu.fuse - 0.1, cu.fuse + 0.6, 0.02, 200, 900);
  sweep(2.7, 3.05, 0.014, 300, 2600);
  sub(cu.word, 0.5);
  blip(cu.drip + 0.8, 1200, 400, 0.12, 0.12);   // the last drip
