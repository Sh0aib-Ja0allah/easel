  // The style-match example's score body (Easel, MIT), inside buildScore() (kit/score-head.js).
  const T = TIMELINE, cu = T.cues;
  to = 'm';
  pad(0.0, 3.1, ['D3', 'A3', 'E4'], 0.035, { type: 'triangle', cut: 800, att: 0.05, rel: 0.2 });
  pad(3.0, 6.05, ['D3', 'A3', 'D4', 'Fs4'], 0.05, { cut: 1200, att: 0.3, rel: 0.3, send: 0.4 });
  to = 's';
  for (let i = 0; i < 4; i++) blip(cu.draw + i * 0.25, 1800, 2200, 0.03, 0.03);        // pen ticks
  for (let i = 0; i < 2; i++) blip(cu.label + i * 0.25, 2600, 3000, 0.04, 0.04);
  sweep(2.7, 3.05, 0.011, 500, 2600, 0);
  for (let i = 0; i < 8; i++) noiseHit(cu.turn + 0.5 + i * 0.25, 0.03, 'bandpass', 2400, 4, 0.02, 0);   // a click per tooth
  to = 'm';
  [['D5', 0], ['A4', E8], ['Fs5', 2 * E8]].forEach(([n, dt], i) => pluck(cu.dim + dt, nz(n), 0.16, -0.2 + i * 0.2, 0.6, 2600, 0.35));
