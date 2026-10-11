  // Easel example piece (MIT): the score body, inside buildScore() (kit/score-head.js).
  const T = TIMELINE, cu = T.cues;
  to = 'm';
  pad(0.0, 4.1, ['D3', 'A3', 'E4'], 0.035, { type: 'triangle', cut: 700, att: 0.1, rel: 0.2 });
  for (let i = 0; i < 5; i++) blip(cu.rise + i * 0.25, nz(['A4', 'B4', 'D5', 'E5', 'Fs5'][i]), nz(['A5', 'B5', 'D6', 'E6', 'Fs6'][i]), 0.12, 0.05);   // drops rising
  pad(4.0, 8.05, ['D3', 'A3', 'D4', 'Fs4'], 0.05, { cut: 1200, att: 0.3, rel: 0.3, send: 0.4 });
  [['D5', 0], ['A4', E8], ['Fs5', 2 * E8]].forEach(([n, dt], i) => pluck(cu.rain + dt, nz(n), 0.16, -0.2 + i * 0.2, 0.6, 2600, 0.35));
  to = 's';
  sweep(3.7, 4.05, 0.011, 500, 2600, 0);                  // a paper swish into the morph
  noiseHit(cu.rain, 2.5, 'bandpass', 3200, 0.7, 0.012, 0); // the rain
