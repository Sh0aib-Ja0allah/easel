// Easel (MIT): the aurora-glass demo, drawn with styles/aurora-glass/kit.js.
const CARD = () => WIDE ? [LX(0.5) - 330 * UNIT, LY(0.5) - 170 * UNIT, 660 * UNIT, 340 * UNIT] : [LX(0.5) - 380 * UNIT, LY(0.44) - 220 * UNIT, 760 * UNIT, 440 * UNIT];
const LENS = () => { const [x, y, w, h] = CARD(); return [x + w / 2, y + h / 2, (WIDE ? 150 : 170) * UNIT]; };
function voiceCard(rise) {
  const [x, y, w, h] = CARD(), cu = TIMELINE.cues;
  agCard(x, y, w, h, { rise, tilt: -0.02, draw: (cw, ch) => {
    agText('Listening', 48 * UNIT, 86 * UNIT, 40, { weight: 400, rise: (TT - cu.card - 0.4) / 1.0 });
    agWave(48 * UNIT, ch * 0.42, cw - 96 * UNIT, ch * 0.3, { level: agSine((TT - cu.card - 0.6) / 1.2) });
    agToggle(cw - 48 * UNIT - 96 * UNIT * 0.9, 50 * UNIT, 0.9, (TT - cu.toggle) / 0.8);
  } });
}
function sceneCards() {
  const cu = TIMELINE.cues;
  agAurora();
  agText('Aurora', LX(0.5), LY(WIDE ? 0.2 : 0.2), WIDE ? 110 : 120, { align: 'center', weight: 200, rise: (TT - cu.title) / 1.4, track: 0.08 });
  voiceCard((TT - cu.card) / 1.4);
  agHero(LX(WIDE ? 0.86 : 0.8), LY(WIDE ? 0.78 : 0.66), 50 * UNIT, { key: 'hero' });
  agCaption('slow light, soft glass');
}
function sceneLens() {
  const cu = TIMELINE.cues, [lx, ly, lr] = LENS();
  agAurora();
  agText('think in light', LX(0.5), LY(WIDE ? 0.2 : 0.2), WIDE ? 84 : 92, { align: 'center', weight: 200, rise: (TT - cu.line) / 1.4, track: 0.06 });
  voiceCard(1);
  const u = agSine((TT - E0) / (DURATION - E0)), gx = lx + (u - 0.5) * (WIDE ? 700 : 520) * UNIT;
  agLens(gx, ly - 10 * UNIT, lr, 1.4);
  agHero(LX(WIDE ? 0.86 : 0.8), LY(WIDE ? 0.78 : 0.66), 50 * UNIT, { mood: 'wow', key: 'hero' });
  agCaption('a lens glides over it');
}
