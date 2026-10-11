// Easel (MIT): the synthwave demo, drawn with styles/synthwave/kit.js.
const HORIZON = () => LY(WIDE ? 0.6 : 0.58);
const SUN = () => [LX(0.5), HORIZON(), (WIDE ? 300 : 280) * UNIT];
const RING = () => [LX(0.5), LY(WIDE ? 0.42 : 0.4), (WIDE ? 230 : 260) * UNIT];
function sceneDrive() {
  const hz = HORIZON(), [sx, sy, sr] = SUN(), cu = TIMELINE.cues;
  swSky(hz);
  swSun(sx, sy, sr, 0.35 + 0.65 * EZ.o2(ev(cu.rise, 1.6)));
  swMountains(hz);
  swGrid(hz, 1.0 + 1.5 * ev(cu.rise, 1.2));
  // palms rush past on alternate sides, scaled by depth
  for (let i = 0; i < 4; i++) {
    const t0 = cu.rise + i * 0.5, k = clamp((TT - t0) / 0.9); if (k <= 0 || k >= 1) continue;
    const side = i % 2 ? 1 : -1, z = 1 / (1 - k * 0.92), x = W / 2 + side * (W * 0.08) * z, y = hz + (H - hz) * (1 - 1 / z) * 0.0 + (H - hz) * k * k;
    swPalm(x, y, 0.35 * z, 'palm' + i);
  }
  swHero(LX(0.5), LY(0.68), 70 * UNIT, { mood: TT > cu.rise ? 'happy' : 'calm', key: 'hero' });
  swCaption('the night drive');
}
function sceneTitle() {
  const hz = HORIZON(), [rx, ry, rr] = RING(), cu = TIMELINE.cues;
  swSky(hz); swMountains(hz, { key: 1 }); swGrid(hz, 2.2);
  // the ring the sun became, breathing
  ctx.save(); ctx.lineWidth = 10 * UNIT; ctx.strokeStyle = SW.cyan; ctx.shadowColor = SW.cyan; ctx.shadowBlur = 40 * UNIT;
  ctx.beginPath(); ctx.arc(rx, ry, rr * (1 + 0.02 * Math.sin(TT * 4)), 0, TAU); ctx.stroke(); ctx.restore();
  const slam = popS(cu.slam);
  if (slam > 0) swChrome('NIGHT RUN', rx, ry + 60 * UNIT, WIDE ? 190 : 170, { pop: 1.6 - 0.6 * Math.min(1, slam), glint: (TT - cu.slam - 0.3) / 0.8 });
  swNeon('midnight', rx + 40 * UNIT, ry + 230 * UNIT, WIDE ? 120 : 130, { frac: ev(cu.script, 0.9) });
  swHero(rx + rr * 1.05, ry - rr * 0.95, 60 * UNIT, { mood: 'wow', key: 'hero' });
}
