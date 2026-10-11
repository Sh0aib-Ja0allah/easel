// Checks for canvas pieces (window.renderFrame + window.TIMELINE, the animate kit's contract).
// canvas_text: every string the piece draws (fillText / strokeText), traced to screen space on
// sampled frames. Flags text cut off by the frame edge, text that overlaps other text (hard), and
// text under the phone UI on portrait formats (a warning). A reviewer looking at thumbnails misses
// these: a cropped label reads as fine at contact-sheet size.
// beat_grid: with TIMELINE.bpm, every hard cut (TIMELINE.cuts) and morph centre (TIMELINE.morphs)
// lands on the 8th-note grid (from TIMELINE.gridOffset), within half a frame.
// Adapted for Easel from cth9191/animate @ 7e5eb56feb2dd573f890e1b7b34748af43d58263
// (plugins/animate/skills/animate/tools/textcheck.mjs), MIT License, Copyright (c) 2026 cth9191.
// Modified by Easel (2026-10-11): runs inside the engine's offline page (newPage/waitReady), takes the
// format from window.__easel.aspect, returns a qa check object instead of printing.
import { newPage, openBrowser, waitReady, ASPECTS } from './browser.mjs';
import { compositionInfo } from './video.mjs';

const DEFAULT_SAFE = { top: 240, bottom: 420, right: 140 };   // 9:16 phone UI (caption bar, side buttons)

function scan({ every, safe }) {
  const T = window.TIMELINE, W = T.width, H = T.height, P = CanvasRenderingContext2D.prototype;
  const rec = [];
  const wrap = (name) => {
    const orig = P[name];
    P[name] = function (str, x, y, maxW) {
      const s = String(str);
      if (s.trim() && this.canvas.width === W && this.canvas.height === H && this.globalAlpha > 0.05) {
        const m = this.measureText(s), w = maxW != null ? Math.min(m.width, maxW) : m.width;
        const al = this.textAlign, x0 = al === 'center' ? x - w / 2 : al === 'right' || al === 'end' ? x - w : x;
        const asc = m.actualBoundingBoxAscent || 0, desc = m.actualBoundingBoxDescent || 0;
        const tf = this.getTransform(), pts = [[x0, y - asc], [x0 + w, y - asc], [x0 + w, y + desc], [x0, y + desc]].map(([px, py]) => [tf.a * px + tf.c * py + tf.e, tf.b * px + tf.d * py + tf.f]);
        const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
        rec.push({ s, q: pts, x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) });
      }
      return orig.apply(this, arguments);
    };
    return () => { P[name] = orig; };
  };
  const undo = [wrap('fillText'), wrap('strokeText')];
  const area = (Q) => { let s = 0; for (let i = 0; i < Q.length; i++) { const [x1, y1] = Q[i], [x2, y2] = Q[(i + 1) % Q.length]; s += x1 * y2 - x2 * y1; } return Math.abs(s) / 2; };
  const clip = (A0, Q) => {   // Sutherland-Hodgman: convex polygon A0 clipped by convex polygon Q
    const sgn = Math.sign((Q[1][0] - Q[0][0]) * (Q[2][1] - Q[0][1]) - (Q[1][1] - Q[0][1]) * (Q[2][0] - Q[0][0])) || 1;
    let out = A0;
    for (let i = 0; i < Q.length && out.length; i++) {
      const A = Q[i], B = Q[(i + 1) % Q.length], inside = (p) => sgn * ((B[0] - A[0]) * (p[1] - A[1]) - (B[1] - A[1]) * (p[0] - A[0])) >= 0;
      const inp = out; out = [];
      for (let j = 0; j < inp.length; j++) {
        const cur = inp[j], prev = inp[(j + inp.length - 1) % inp.length];
        const hit = () => { const dx = cur[0] - prev[0], dy = cur[1] - prev[1], ex = B[0] - A[0], ey = B[1] - A[1], den = dx * ey - dy * ex; const t = den ? ((A[0] - prev[0]) * ey - (A[1] - prev[1]) * ex) / den : 0; return [prev[0] + t * dx, prev[1] + t * dy]; };
        if (inside(cur)) { if (!inside(prev)) out.push(hit()); out.push(cur); } else if (inside(prev)) out.push(hit());
      }
    }
    return out;
  };
  // Morph bridges scale the world through a window on purpose: their frames are skipped.
  const bridges = typeof BRIDGES !== 'undefined' && Array.isArray(BRIDGES) ? BRIDGES : [];
  const inBridge = (t) => bridges.some((r) => Math.abs(t - r.tc) < (r.d ?? 0.6) + 1e-6);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const issues = new Map(), add = (kind, text, t) => { const k = kind + '|' + text; const v = issues.get(k); if (v) { v.t1 = t; v.frames++; } else issues.set(k, { kind, text, t0: t, t1: t, frames: 1 }); };
  const nFrames = T.frames || Math.round(T.duration * T.fps);
  // every Nth frame, plus the first and last frame of every shot (a 3-frame shot is never skipped)
  const fs = new Set(); for (let f = 0; f < nFrames; f += every) fs.add(f);
  for (const sh of T.shots || []) { const a = Math.round(sh.t0 * T.fps), b = Math.round(sh.t1 * T.fps) - 1; if (a < nFrames) fs.add(a); if (b >= a && b < nFrames) fs.add(b); }
  let frames = 0;
  try {
    for (const f of [...fs].sort((x, y) => x - y)) {
      const t = f / T.fps; if (inBridge(t)) continue;
      rec.length = 0; window.__easel.t = t; window.renderFrame(t, cv); frames++;
      const seen = new Map();
      for (const b of rec) { const k = `${b.s}|${Math.round(b.x0)}|${Math.round(b.y0)}`; if (!seen.has(k)) seen.set(k, b); }
      const boxes = [...seen.values()].filter((b) => b.x1 - b.x0 > 2 && b.y1 - b.y0 > 2);
      for (const b of boxes) {
        const label = b.s.length > 40 ? b.s.slice(0, 40) + '…' : b.s;
        // single characters (a 'z' over a sleeping cat, a '?') are decoration a close-up may crop; words are not
        if (b.s.trim().length > 1 && (b.x0 < -3 || b.y0 < -3 || b.x1 > W + 3 || b.y1 > H + 3)) add('cut off by the frame edge', label, t);
        else if (safe && (b.y1 > H - safe.bottom + 2 || (b.x1 > W - safe.right + 2 && b.y1 > safe.top && b.y0 < H - safe.bottom)) && b.y0 > safe.top) add('under the phone UI (safe zone)', label, t);
      }
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        if (a.s === b.s || a.s.includes(b.s) || b.s.includes(a.s)) continue;
        if (Math.min(a.x1, b.x1) <= Math.max(a.x0, b.x0) || Math.min(a.y1, b.y1) <= Math.max(a.y0, b.y0)) continue;
        // the real (possibly rotated or skewed) text boxes, not their screen-aligned bounds
        const small = Math.min(area(a.q), area(b.q));
        if (area(clip(a.q, b.q)) > 0.25 * small) add('overlaps other text', `"${a.s.slice(0, 24)}" × "${b.s.slice(0, 24)}"`, t);
      }
    }
  } finally { undo.forEach((u) => u()); }
  return { frames, issues: [...issues.values()].map((i) => ({ ...i, t0: +i.t0.toFixed(3), t1: +i.t1.toFixed(3) })) };
}

function gridScan() {
  const T = window.TIMELINE;
  if (!T.bpm || !T.fps) return null;
  const E8 = 60 / T.bpm / 2, g0 = T.gridOffset || 0, tol = 0.5 / T.fps + 1e-6;
  const events = [...(T.cuts || []).map((t) => ['cut', t]), ...(T.morphs || []).map((t) => ['morph', t])];
  const off = events.map(([kind, t]) => { const k = Math.round((t - g0) / E8), on = g0 + k * E8; return { kind, t, nearest: +on.toFixed(4), offBy: +(t - on).toFixed(4) }; }).filter((e) => Math.abs(e.offBy) > tol);
  return { bpm: T.bpm, e8: +E8.toFixed(4), gridOffset: g0, events: events.length, off };
}

// args: html | file, aspect, every (sample every Nth frame, default 6), textIgnore [[t0, t1, why], ...]
// want(name) picks which of canvas_text and beat_grid to return. Returns null for a page that is not a canvas piece.
export async function canvasChecks(args, src, want = () => true, { browser: shared } = {}) {
  const [aw, ah] = args.aspect ? ASPECTS[args.aspect] : [];
  const browser = shared || (await openBrowser());
  try {
    const { page, context, errors } = await newPage(browser, { width: args.width || aw || 1080, height: args.height || ah || 1920, aspect: args.aspect || null, seed: args.seed ?? 1 });
    try {
      await page.goto(src.url, { waitUntil: 'load', timeout: 60000 });
      await waitReady(page);
      const piece = await page.evaluate(() => typeof window.renderFrame === 'function' && !!window.TIMELINE);
      if (!piece) return null;
      const checks = [];
      if (want('beat_grid')) {
        const g = await page.evaluate(gridScan);
        if (g) checks.push({ name: 'beat_grid', pass: g.off.length === 0, hard: true, value: g.off.length, threshold: `cuts and morph centres on the 8th grid (${g.e8} s at ${g.bpm} BPM, offset ${g.gridOffset} s), within half a frame`, eventsChecked: g.events, findings: g.off.map((e) => ({ ...e, fix: `move the ${e.kind} to ${e.nearest} s (use onBeat(t))` })) });
      }
      if (!want('canvas_text')) return checks;
      const info = await compositionInfo(page);
      const safe = info.height > info.width ? (await page.evaluate(() => window.TIMELINE.safe || null)) || DEFAULT_SAFE : null;
      const r = await page.evaluate(scan, { every: args.every || 6, safe });
      const ignore = args.textIgnore || [];
      const allowed = (i) => ignore.some(([a, b]) => i.t0 >= a - 1e-6 && i.t1 <= b + 1e-6);
      const hard = r.issues.filter((i) => !allowed(i) && i.kind !== 'under the phone UI (safe zone)');
      const warn = r.issues.filter((i) => !allowed(i) && i.kind === 'under the phone UI (safe zone)');
      checks.push({
        name: 'canvas_text', pass: hard.length === 0, hard: true, value: hard.length,
        threshold: 'no canvas text cut off by the frame edge or overlapping other text (morph bridges skipped)',
        framesSampled: r.frames, ...(args.aspect ? { aspect: args.aspect } : {}),
        findings: [...hard.map((i) => ({ ...i, severity: 'fail' })), ...warn.map((i) => ({ ...i, severity: 'warn', fix: 'move it above the bottom safe band / left of the right-hand buttons' }))],
        ...(r.issues.some(allowed) ? { allowed: r.issues.filter(allowed).length } : {}),
        ...(errors.length ? { pageErrors: [...new Set(errors)].slice(0, 5) } : {}),
      });
      return checks;
    } finally {
      await context.close();
    }
  } finally {
    if (!shared) await browser.close();
  }
}
