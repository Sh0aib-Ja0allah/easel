  // Easel starter (MIT): the score body, inside buildScore() (kit/score-head.js).
  const T = TIMELINE, cu = T.cues;
  to = 'm';
  pad(0.0, 3.1, ['D3', 'A3', 'E4'], 0.035, { type: 'triangle', cut: 800, att: 0.05, rel: 0.2 });
  pad(3.0, 6.05, ['D3', 'A3', 'D4', 'Fs4'], 0.05, { cut: 1200, att: 0.3, rel: 0.3, send: 0.4 });
  pluck(cu.hop, nz('A4'), 0.18, 0, 0.6, 2600, 0.35);
  pluck(cu.arrive, nz('D5'), 0.2, 0.1, 0.8, 2600, 0.35);
  to = 's';
  sweep(2.7, 3.05, 0.011, 500, 2600, 0);
