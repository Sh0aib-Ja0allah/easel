// Easel: adapted from cth9191/animate @ 7e5eb56feb2dd573f890e1b7b34748af43d58263
// (github.com/cth9191/animate, plugins/animate/skills/animate/styles/math/demo/src/bridges.js).
// MIT License, Copyright (c) 2026 cth9191; full text in NOTICE.md.
// Modified by Easel (2026-10-11): no changes beyond this header.
// =====================================================================
//  ERAS, BRIDGES — math demo (read by kit/morph.js). No camera moves: a manim stage holds still.
// =====================================================================
const ERA_BG = [MC.bg, MC.bg];
const BRIDGES = [
  { tc: 3.0, A: () => ({ P: SQ_C, c: MC.yellow }), B: () => ({ P: ellipsePts(UC_O[0], UC_O[1], UC_R, UC_R, 0, 96), c: MC.yellow }) },   // the square on c -> the unit circle
];
