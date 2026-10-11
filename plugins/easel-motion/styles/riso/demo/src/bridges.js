// Easel: adapted from cth9191/animate @ 7e5eb56feb2dd573f890e1b7b34748af43d58263
// (github.com/cth9191/animate, plugins/animate/skills/animate/styles/riso/demo/src/bridges.js).
// MIT License, Copyright (c) 2026 cth9191; full text in THIRD_PARTY_NOTICES.md.
// Modified by Easel (2026-10-11): no changes beyond this header.
// =====================================================================
//  ERAS, CAMERAS, BRIDGES — riso demo (read by kit/morph.js)
//  Colours for the renderer are the printed colours of plate tones (inkRGB), so the morph fades stay in the inks.
// =====================================================================
const ERA_BG = [rgbHex(inkRGB({ teal: 0.1, pink: 0.25, yellow: 0.5 })), rgbHex(inkRGB({ yellow: 0.5, pink: 0.2, teal: 0.04 }))];
function pieceCam(era, t) {
  if (era === 0) return push(t, 0.3, 2.0, { z: 1.08, p: [520, 1100], to: [540, 1110] }, 2.0, 2.3);
  return push(t, 4.4, 5.6, { z: 1.1, p: [330, 1100], to: [420, 1110] });
}
const BRIDGES = [
  { tc: 3.0,   // the sun -> the best orange in the crate
    A: () => ({ P: sunPts(SUN.x, sunY(), SUN.r, sunRot()), c: rgbHex(inkRGB({ yellow: 1, pink: 0.3 })) }),
    B: () => ({ P: ellipsePts(ORANGE.x, ORANGE.y, ORANGE.r, ORANGE.r * 0.96, 0, 64), c: rgbHex(inkRGB(ORANGE.c)) }) },
];
