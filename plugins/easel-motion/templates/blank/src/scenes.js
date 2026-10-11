// Easel starter (MIT): scenes that use only the STYLE hooks and core helpers, so they run in any style.
// Replace them with the style's own drawing functions (see the style's STYLE.md -> Kit API).
const HERO_AT = () => [LX(0.5), LY(WIDE ? 0.5 : 0.45), 120 * UNIT];
function sceneOne() {
  STYLE.backdrop(ERA_BG[0]);
  const [x, y, r] = HERO_AT();
  STYLE.hero(x, y - 60 * UNIT * Math.sin(Math.PI * ev(TIMELINE.cues.hop, 0.5)), r, { mood: 'calm', key: 'hero' });
}
function sceneTwo() {
  STYLE.backdrop(ERA_BG[1]);
  const [x, y, r] = HERO_AT();
  STYLE.hero(x, y, r * (1 + 0.15 * popS(TIMELINE.cues.arrive) * (1 - ev(TIMELINE.cues.arrive + 0.25, 0.25))), { mood: 'happy', key: 'hero' });
}
