// Easel (MIT): the hud demo, drawn with styles/hud/kit.js.
const CORE = () => [LX(0.5), LY(WIDE ? 0.46 : 0.44), (WIDE ? 250 : 320) * UNIT];
function sceneScan() {
  HD_ALERT = 0;
  const cu = TIMELINE.cues, [cx, cy, r] = CORE();
  hdGround(); hdHex(56, ev(0, 1.2));
  hdRing(cx, cy, r * 1.25, { draw: hdSnap((TT - cu.rings) / 0.8), speed: 0.03, ticks: 96 });
  hdRing(cx, cy, r * 1.12, { draw: hdSnap((TT - cu.rings - 0.15) / 0.8), speed: -0.06, span: 0.7, ticks: 0, w: 6 });
  hdRadar(cx, cy, r, { draw: hdSnap((TT - cu.rings - 0.3) / 0.8), blips: [[0.42, -0.3], [-0.5, 0.2], [0.18, 0.55]] });
  const dx = WIDE ? LX(0.06) : LX(0.08), dy = WIDE ? LY(0.18) : LY(0.16);
  hdData(['SECTOR 07', 'AZM 214.08', 'ELV 031.55', 'RNG 4812 M', 'SIG 0.83'], dx, dy, 30, { t0: cu.data });
  hdType('SCANNING', LX(0.5), cy + r * 1.25 + (WIDE ? 70 : 90) * UNIT, 40, cu.data + 0.4, 18, { align: 'center' });
  hdHero(LX(WIDE ? 0.88 : 0.82), LY(WIDE ? 0.2 : 0.16), 48 * UNIT, { key: 'hero' });
}
function sceneLock() {
  const cu = TIMELINE.cues, [cx, cy, r] = CORE();
  HD_ALERT = hdSnap((TT - cu.lock - 0.3) / 0.4);
  hdGround(); hdHex(56, 1);
  hdRing(cx, cy, r * 1.25, { speed: 0.03, ticks: 96 });
  // the target: a small diamond with a pulsing core
  ctx.save(); hdGlow(3, 16); const s = 70 * UNIT; ctx.beginPath(); ctx.moveTo(cx, cy - s); ctx.lineTo(cx + s, cy); ctx.lineTo(cx, cy + s); ctx.lineTo(cx - s, cy); ctx.closePath(); ctx.stroke();
  ctx.fillStyle = hdCol(0.4 + 0.4 * Math.abs(Math.sin(TT * 6))); ctx.beginPath(); ctx.arc(cx, cy, 14 * UNIT, 0, TAU); ctx.fill(); ctx.restore();
  hdLock(cx, cy, 260 * UNIT, 260 * UNIT, cu.lock);
  hdType('TARGET LOCKED', LX(0.5), cy + r * 1.25 + (WIDE ? 70 : 90) * UNIT, 48, cu.lock + 0.35, 22, { align: 'center' });
  if (WIDE) hdData(['N31 14.02', 'E121 29.45'], LX(0.06), LY(0.7), 30, { t0: cu.lock + 0.6 });
  else hdData(['N31 14.02', 'E121 29.45'], LX(0.5) - 140 * UNIT, cy + r * 1.25 + 160 * UNIT, 30, { t0: cu.lock + 0.6 });
  hdHero(LX(WIDE ? 0.88 : 0.82), LY(WIDE ? 0.2 : 0.16), 48 * UNIT, { mood: TT > cu.lock ? 'wow' : 'calm', key: 'hero' });
}
