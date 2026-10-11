  // Easel (MIT): the hud demo, drawn with styles/hud/kit.js.
  const T = TIMELINE, cu = T.cues;
  to = 'm';
  for (let t = 0; t < 6; t += BEAT) { bass(t, nz('D2'), 0.16); }   // a darksynth pulse
  pad(0.0, 6.05, ['D3', 'A3', 'F4'], 0.03, { cut: 1100, att: 0.4, rel: 0.3 });
  to = 's';
  for (let i = 0; i < 5; i++) blip(cu.data + i * 0.08, 2400, 2600, 0.03, 0.05);   // data beeps
  for (let t = 0.6; t < 3; t += 2.4 / 2) sweep(t, t + 0.5, 0.01, 600, 3000);       // scan sweeps
  for (let i = 0; i < 4; i++) blip(cu.lock - 0.6 + i * 0.12, 600 + i * 300, 900 + i * 300, 0.08, 0.08);   // the rising lock-on tone
  sub(cu.lock + 0.3, 0.6); for (let i = 0; i < 3; i++) blip(cu.lock + 0.4 + i * 0.3, 880, 660, 0.18, 0.1);   // the alarm
