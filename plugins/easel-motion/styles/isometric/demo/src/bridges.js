// Easel: adapted from cth9191/animate @ 7e5eb56feb2dd573f890e1b7b34748af43d58263
// (github.com/cth9191/animate, plugins/animate/skills/animate/styles/isometric/demo/src/bridges.js).
// MIT License, Copyright (c) 2026 cth9191; full text in THIRD_PARTY_NOTICES.md.
// Modified by Easel (2026-10-11): no changes beyond this header.
// =====================================================================
//  ERAS, CAMERAS, BRIDGES — isometric demo (read by kit/morph.js)
// =====================================================================
const ERA_BG = [PAL.paper, PAL.paper];
function pieceCam(era, t) { return era === 1 ? push(t, 4.3, 5.8, { z: 1.04, p: [470, 760], to: [470, 760] }) : null; }
const BRIDGES = [
  // the dark cursor block on the laptop screen -> the front of the server blade
  { tc: 3.0,
    A: () => { setIso(ISO1); return { P: facePts(lidFace(lidGeom(TT)), rrectPts(CUR.u, CUR.v, CUR.w, CUR.h, 2, 3)), c: PAL.accent }; },
    B: () => { setIso(ISO2); return { P: facePts(bladeFace(RACK.n - 1, 0), rrectPts(0, 0, RACK.bw, RACK.bh, 6, 3)), c: PAL.edge }; } },
];
