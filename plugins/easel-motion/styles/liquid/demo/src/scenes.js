// Easel (MIT): the liquid demo, drawn with styles/liquid/kit.js.
const POOL = () => [LX(0.5), LY(WIDE ? 0.55 : 0.5), (WIDE ? 150 : 170) * UNIT];
function sceneFall() {
  const cu = TIMELINE.cues, [px, py, pr] = POOL(), floor = LY(WIDE ? 0.7 : 0.62);
  lqGround();
  // three drops fall and squash; then they fuse into one pool that swells toward the bridge
  const balls = [];
  [[-0.22, 0], [0.18, 0.25], [0.0, 0.5]].forEach(([dx, dt], i) => balls.push(...lqDrop(px + dx * W, -80 * UNIT, floor - 40 * UNIT, 60 * UNIT, cu.drop + dt, 0.55)));
  const fuse = lqEase((TT - cu.fuse) / 0.9);
  if (fuse > 0) {
    for (const b of balls) { b.x += (px - b.x) * fuse; b.y += (py - b.y) * fuse * 0.9; }
    balls.push({ x: px, y: py + (floor - py) * (1 - fuse), r: pr * 0.8 * fuse });
  }
  lqField(balls);
  lqHero(LX(WIDE ? 0.2 : 0.22), LY(WIDE ? 0.3 : 0.32), 56 * UNIT, { mood: TT > cu.fuse ? 'wow' : 'calm', key: 'hero' });
  lqCaption('a drop, then another');
}
function sceneWord() {
  const cu = TIMELINE.cues, [px, py] = POOL();
  lqGround();
  const wave = { y: H + 200 * UNIT - lqEase((TT - E0) / 1.2) * (H * (WIDE ? 0.2 : 0.3)), amp: 70 * UNIT, phase: TT * 2.2 };
  const k = lqEase((TT - cu.word) / 1.1);
  const mask = k > 0 ? lqWordMask('FLUX', px, py, WIDE ? 300 : 260, k) : null;
  const balls = [{ x: px, y: py, r: (WIDE ? 150 : 170) * UNIT * (1 - k * 0.8) }];
  const drip = (TT - cu.drip) / 0.8; if (drip > 0 && drip < 1.4) balls.push({ x: px + 60 * UNIT, y: py + 110 * UNIT + drip * drip * 260 * UNIT, r: 26 * UNIT, sx: 0.85, sy: 1.25 });
  lqField(balls, { wave, mask, hue: 0.05 });
  lqHero(LX(WIDE ? 0.8 : 0.78), LY(WIDE ? 0.3 : 0.32), 56 * UNIT, { mood: 'happy', key: 'hero' });
  lqCaption('and the word is fluid');
}
