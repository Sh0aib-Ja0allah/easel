// Easel: adapted from cth9191/animate @ 7e5eb56feb2dd573f890e1b7b34748af43d58263
// (github.com/cth9191/animate, plugins/animate/skills/animate/styles/pixel/demo/src/bridges.js).
// MIT License, Copyright (c) 2026 cth9191; full text in NOTICE.md.
// Modified by Easel (2026-10-11): no changes beyond this header.
// =====================================================================
//  ERAS, RESOLUTIONS, CAMERAS, BRIDGES — pixel demo (read by kit/morph.js and the pixel STYLE hooks)
//  Era 1 is drawn at 90x160 (12 px per pixel), era 2 at 180x320 (6 px per pixel).
// =====================================================================
const ERA_BG = ['#306a2e', '#232a4e'];
const ERA_RES = [[90, 160], [180, 320]];
const ERA_POST = [{ pal: HANDHELD, lcd: 0.28, rim: [HANDHELD[3], HANDHELD[0]] }, { pal: PAL16, scan: 0.2, vignette: 0.4 }];   // per-era palette + screen FX
function pieceCam() { return null; }   // pixel art moves things, not the camera
// the moon (pixel 62,40 r 8 at 90x160) -> the coin (pixel 125,81 r 18 at 180x320); same screen spot
const BRIDGES = [
  { tc: 3.0, A: () => ({ P: ellipsePts(750, 486, 102, 102, 0, 64), c: '#c4d870' }), B: () => ({ P: ellipsePts(753, 489, 111, 111, 0, 64), c: '#f6d64a' }) },
];
