// Easel: adapted from cth9191/animate @ 7e5eb56feb2dd573f890e1b7b34748af43d58263
// (github.com/cth9191/animate, plugins/animate/skills/animate/kit/board.js).
// MIT License, Copyright (c) 2026 cth9191; full text in THIRD_PARTY_NOTICES.md.
// Modified by Easel (2026-10-11): system font stacks replaced with bundled OFL fonts; board.html (written
// by tools/build.mjs) shows the storyboard as the page, for easel-core's render_still.

// =====================================================================
//  kit/board.js — the storyboard: every beat in TIMELINE.board drawn as a 9:16 key frame with its notes.
//  The panels ARE the piece: each one is renderFrame(t) at the beat's key time, so an approved board
//  carries straight into the video.  TIMELINE.board = [{ t, title, sound, next }]
//  Render (Easel): build the piece, then easel-core render_still on <piece>/board.html with selector '#easel-board'
// =====================================================================
function drawPanel(k) { renderFrame(TIMELINE.board[k].t, ctx.canvas); }
function renderBoard() {
  const BD = TIMELINE.board || [], COLS = 5, PW = 360, PH = Math.round(PW * H / W), GAP = 30, NOTE = 130, HEAD = 150;
  const rows = Math.ceil(BD.length / COLS), bc = document.createElement('canvas');
  bc.width = GAP + COLS * (PW + GAP); bc.height = HEAD + rows * (PH + NOTE + GAP);
  const g = bc.getContext('2d'), SANS = '"Inter", "Noto Sans Math", sans-serif';   // bundled OFL font (easel-core/fonts): the same on every OS
  g.fillStyle = '#2a211b'; g.fillRect(0, 0, bc.width, bc.height);
  g.fillStyle = '#efe5cf'; g.font = `400 60px ${HAND}`; g.fillText(`${document.title}: storyboard`, GAP, 80);
  g.font = `600 22px ${SANS}`; g.fillStyle = '#d9c9a8';
  g.fillText(`${TIMELINE.duration}s · ${W}×${H} · ${TIMELINE.bpm} BPM · ${BD.length} beats. Thumbs up or down by panel number.`, GAP, 122);
  const wrap = (str, x, y, maxW, lh) => { let line = ''; for (const w of str.split(' ')) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { g.fillText(line, x, y); y += lh; line = w; } else line = t; } if (line) g.fillText(line, x, y); return y + lh; };
  const pc = document.createElement('canvas'); pc.width = W; pc.height = H;
  BD.forEach((b, k) => {
    renderFrame(b.t, pc);
    const x = GAP + (k % COLS) * (PW + GAP), y = HEAD + Math.floor(k / COLS) * (PH + NOTE + GAP);
    g.drawImage(pc, x, y, PW, PH);
    g.fillStyle = '#f0b27c'; g.font = `700 26px ${SANS}`; g.fillText(`${k + 1}`, x, y + PH + 32);
    g.fillStyle = '#efe5cf'; g.font = `600 20px ${SANS}`;
    let ttl = `${b.t.toFixed(1)}s · ${b.title || ''}`; while (ttl.length > 4 && g.measureText(ttl).width > PW - 44) ttl = ttl.slice(0, -2) + '…';   // fits the panel
    g.fillText(ttl, x + 40, y + PH + 30);
    g.font = `400 18px ${SANS}`; g.fillStyle = '#cdbd9c';
    const yy = b.sound ? wrap('sound: ' + b.sound, x, y + PH + 58, PW, 22) : y + PH + 58;
    if (b.next) { g.fillStyle = '#a8977a'; wrap('→ ' + b.next, x, yy + 2, PW, 22); }
  });
  return bc;
}
window.renderBoard = renderBoard; window.drawPanel = drawPanel;
// Easel: in board.html (tools/build.mjs sets EASEL_BOARD) the page is the storyboard. The engine seeks
// t = 0 through window.renderAt, which wins over renderFrame, after the bundled fonts have loaded.
if (typeof EASEL_BOARD !== 'undefined' && EASEL_BOARD) {
  const host = document.createElement('canvas'), first = renderBoard();
  host.id = 'easel-board'; host.width = first.width; host.height = first.height;
  host.style.cssText = `display:block;max-width:none;max-height:none;width:${host.width}px;height:${host.height}px;aspect-ratio:auto`;
  document.documentElement.style.cssText = 'height:auto;overflow:visible;background:#2a211b';
  document.body.style.cssText = 'margin:0;height:auto;display:block;overflow:visible;background:#2a211b';
  document.body.replaceChildren(host);
  window.renderAt = () => { const g = host.getContext('2d'); g.clearRect(0, 0, host.width, host.height); g.drawImage(renderBoard(), 0, 0); };
  window.EASEL_BOARD_SIZE = { width: host.width, height: host.height };
}
