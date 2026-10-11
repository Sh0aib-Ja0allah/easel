// Easel: adapted from cth9191/animate @ 7e5eb56feb2dd573f890e1b7b34748af43d58263
// (github.com/cth9191/animate, plugins/animate/skills/animate/templates/piece/src/score.js and
// plugins/animate/skills/animate/templates/beat-cut/src/score.js).
// MIT License, Copyright (c) 2026 cth9191; full text in NOTICE.md.
// Modified by Easel (2026-10-11): the blank starter's score, cut down from those two to its own
// timeline (a pad per era, a pluck on each cue, one sweep into the morph).
  // the score body, inside buildScore() (kit/score-head.js)
  const T = TIMELINE, cu = T.cues;
  to = 'm';
  pad(0.0, 3.1, ['D3', 'A3', 'E4'], 0.035, { type: 'triangle', cut: 800, att: 0.05, rel: 0.2 });
  pad(3.0, 6.05, ['D3', 'A3', 'D4', 'Fs4'], 0.05, { cut: 1200, att: 0.3, rel: 0.3, send: 0.4 });
  pluck(cu.hop, nz('A4'), 0.18, 0, 0.6, 2600, 0.35);
  pluck(cu.arrive, nz('D5'), 0.2, 0.1, 0.8, 2600, 0.35);
  to = 's';
  sweep(2.7, 3.05, 0.011, 500, 2600, 0);
