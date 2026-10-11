  // Easel (MIT): the aurora-glass demo, drawn with styles/aurora-glass/kit.js.
  const T = TIMELINE, cu = T.cues;
  to = 'm';
  pad(0.0, 6.05, ['D3', 'A3', 'E4', 'Fs4'], 0.04, { cut: 900, att: 1.2, rel: 0.8, send: 0.7 });
  chime(cu.title, [nz('A5'), nz('E6')], 0.05);
  to = 's';
  noiseHit(cu.toggle + 0.4, 0.02, 'bandpass', 4200, 4, 0.05);   // a soft UI tick
  sweep(2.4, 3.0, 0.008, 800, 3200);
  chime(cu.line, [nz('Fs5'), nz('Cs6'), nz('A6')], 0.06);
