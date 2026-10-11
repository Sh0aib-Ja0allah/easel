  // Easel (MIT): the synthwave demo, drawn with styles/synthwave/kit.js.
  const T = TIMELINE, cu = T.cues;
  to = 'm';
  pad(0.0, 3.1, ['A2', 'E3', 'A3', 'C4'], 0.04, { cut: 1400, att: 0.2, rel: 0.2 });
  for (let t = 0; t < 3; t += E16) bass(t, nz(['A2', 'A2', 'C3', 'E3'][Math.round(t / E16) % 4]), 0.13);   // the arpeggiated bass
  pad(3.0, 6.05, ['F2', 'C3', 'F3', 'A3'], 0.05, { cut: 1800, att: 0.05, rel: 0.3, send: 0.5 });
  for (let t = 3; t < 6; t += E16) bass(t, nz(['F2', 'F2', 'A2', 'C3'][Math.round(t / E16) % 4]), 0.13);
  to = 's';
  riser(cu.slam - 0.8, cu.slam, 0.05);
  sub(cu.slam, 0.7); noiseHit(cu.slam, 1.2, 'highpass', 3000, 0.7, 0.05, 0, 0.4);   // the title slam + crash
  for (const t of [1, 2, 4, 5]) noiseHit(t, 0.35, 'bandpass', 1800, 0.8, 0.06, 0, 0.6);   // gated snare
