// Easel: adapted from cth9191/animate @ 7e5eb56feb2dd573f890e1b7b34748af43d58263
// (github.com/cth9191/animate, plugins/animate/skills/animate/styles/cut-paper/demo/src/bridges.js).
// MIT License, Copyright (c) 2026 cth9191; full text in NOTICE.md.
// Modified by Easel (2026-10-11): no changes beyond this header.

// =====================================================================
//  ERAS, CAMERAS, BRIDGES — read by kit/morph.js
//  ERA_BG: each era's dominant colour (the fade to blank paper during a morph).
//  pieceCam(era, t): null, push(t, a, b, { z, p, to }, pullA, pullB) or bump(t, t0, [x, y]).
//  BRIDGES: at tc the object A (end of the old era) morphs into B (start of the new one).
//    shape = { P: points, c: '#hex' } or SP(x, y, r, rays) for the spark hero itself.
//  Leave BRIDGES = [] for a beat-cut piece (every era boundary becomes a hard cut).
// =====================================================================
const ERA_BG = ['#26315f', '#a9d9c6'];
function pieceCam(era, t) { return null; }
const BRIDGES = [
  { tc: 4.0, A: () => ({ P: ellipsePts(780, 420, 40, 40, 0, 64), c: '#f6ecc8' }), B: () => ({ P: ellipsePts(780, 420, 80, 80, 0, 64), c: PAL.yellow }) },   // the moon -> the sun
];
