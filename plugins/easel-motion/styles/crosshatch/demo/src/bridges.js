// Easel: adapted from cth9191/animate @ 7e5eb56feb2dd573f890e1b7b34748af43d58263
// (github.com/cth9191/animate, plugins/animate/skills/animate/styles/crosshatch/demo/src/bridges.js).
// MIT License, Copyright (c) 2026 cth9191; full text in NOTICE.md.
// Modified by Easel (2026-10-11): no changes beyond this header.
// =====================================================================
//  ERAS, CAMERAS, BRIDGES — crosshatch demo (read by kit/morph.js)
// =====================================================================
const ERA_BG = ['#d6a466', '#0c0d1c'];
function pieceCam(era, t) { return era === 0 ? push(t, 0.3, 2.2, { z: 1.12, p: [560, 1100], to: [540, 1100] }, 2.2, 2.4) : null; }
const BRIDGES = [
  { tc: 3.0, A: () => ({ P: ellipsePts(800, 520, 94, 94, 0, 64), c: '#6e4128' }), B: () => ({ P: ellipsePts(800, 520, 150, 150, 0, 64), c: '#c8d0f0' }) },   // the coffee -> the moon
];
