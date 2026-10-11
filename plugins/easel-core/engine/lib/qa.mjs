// qa: measured quality checks. Hard gates refuse delivery until they pass (architecture §8).
//   text_clipping  (page)  text cut off by its own box, an ancestor that clips, or the frame
//   contrast       (page)  WCAG 2.x contrast of each line of text against what is really behind it
//   canvas_text    (canvas piece) text a renderFrame(t) piece draws: cut off by the frame, overlapping, under the phone UI
//   beat_grid      (canvas piece) cuts and morph centres on the 8th-note grid of TIMELINE.bpm
//   stillness      (video) a still or empty stretch longer than N seconds
//   colour_cast    (video/image) share of frames dominated by blue-purple hues
//   loudness       (audio/video) integrated loudness in LUFS (ffmpeg ebur128)
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { ASPECTS, newPage, openBrowser, waitReady } from './browser.mjs';
import { requireBinary } from './binaries.mjs';
import { killTree } from './probe.mjs';
import { releaseSource, resolveSource } from './source.mjs';
import { outputDir } from './render.mjs';
import { canvasChecks } from './canvastext.mjs';

const VIDEO = new Set(['.mp4', '.mov', '.webm', '.mkv', '.gif']);

// ---------- page checks ----------
// Runs inside the page: finds every visible text run (an element's own text nodes, open shadow roots
// included, and the values and placeholders of form fields), its line boxes, its colour, and clipping
// problems. fixedFrame: the page is a still graphic, so a box that scrolls cuts its text off too.
function pageScan({ fixedFrame }) {
  const W = innerWidth, H = innerHeight;
  const scrolls = document.documentElement.scrollHeight > H + 1 && !document.querySelector('[data-composition-id]');
  // Any colour the browser can paint (rgb(), and the CSS Color 4 forms Chromium computes modern colours
  // to: oklch(), lab(), color(srgb ...), color-mix() ...) as sRGB [r, g, b, alpha]. Painted over black
  // and over white on a 2x1 canvas, which gives both the colour and its alpha. null when the browser
  // cannot resolve it: never assumed to be black.
  const cv = document.createElement('canvas'); cv.width = 2; cv.height = 1;
  const g = cv.getContext('2d', { willReadFrequently: true });
  const takes = (s) => { g.fillStyle = '#000'; g.fillStyle = s; if (g.fillStyle !== '#000000') return true; g.fillStyle = '#fff'; g.fillStyle = s; return g.fillStyle !== '#ffffff'; };
  const memo = new Map();
  const parse = (s) => {
    s = String(s || '').trim();
    if (!memo.has(s)) {
      let c = null;
      const m = s.match(/^rgba?\(([^)]+)\)$/);
      const p = m ? m[1].split(/[\s,/]+/).filter(Boolean).map(Number) : [];
      if (p.length >= 3 && p.every(Number.isFinite)) c = [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
      else if (s && s !== 'none' && !s.startsWith('url(') && takes(s)) {
        g.fillStyle = '#000'; g.fillRect(0, 0, 1, 1); g.fillStyle = '#fff'; g.fillRect(1, 0, 1, 1);
        g.fillStyle = s; g.fillRect(0, 0, 2, 1);
        const d = g.getImageData(0, 0, 2, 1).data;
        const a = Math.min(1, Math.max(0, 1 - (d[4] - d[0] + d[5] - d[1] + d[6] - d[2]) / 765));
        c = a < 0.004 ? [0, 0, 0, 0] : [0, 1, 2].map((k) => Math.min(255, Math.round(d[k] / a))).concat(a);
      }
      memo.set(s, c);
    }
    const c = memo.get(s);
    return c ? [...c] : null;
  };
  const label = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += `#${el.id}`; else if (el.classList.length) s += `.${[...el.classList].slice(0, 2).join('.')}`; return s; };
  // The rendering parent: out of a shadow root to its host, and from a slotted element to its slot.
  const up = (e) => e.assignedSlot || e.parentElement || (e.parentNode && e.parentNode.host) || null;
  // visibility is inherited and a child can turn it back on below a hidden parent, so the element's own value decides
  const visible = (el) => { if (getComputedStyle(el).visibility !== 'visible') return false; for (let e = el; e; e = up(e)) if (getComputedStyle(e).display === 'none') return false; return true; };
  // How much of the text colour shows: opacity on the way up (a display: contents box has none to apply)
  // times filter: opacity(). Other filters and blend modes change the colour itself: such text is unmeasured.
  const paintOf = (el) => {
    let o = 1, changed = null;
    for (let e = el; e; e = up(e)) {
      const cs = getComputedStyle(e);
      if (cs.display === 'contents') continue;
      o *= Number(cs.opacity);
      for (const [, fn, arg] of String(cs.filter === 'none' ? '' : cs.filter).matchAll(/([a-z-]+)\(([^)]*)\)/g)) {
        if (fn === 'opacity') o *= Math.min(1, parseFloat(arg) / (arg.trim().endsWith('%') ? 100 : 1)) || 0;
        else if (fn !== 'drop-shadow') changed = changed || `filter ${fn}() on ${label(e)}`;
      }
      if (cs.mixBlendMode && cs.mixBlendMode !== 'normal') changed = changed || `mix-blend-mode ${cs.mixBlendMode} on ${label(e)}`;
    }
    return { o, changed };
  };
  // clip-path: inset(...) as the rectangle it leaves, in viewport pixels (its reference box is the border box)
  const insetOf = (cp, r) => {
    const m = /^inset\(([^()]*)\)$/.exec(cp || '');
    if (!m) return null;
    const v = m[1].split(/\s+round\s+/)[0].trim().split(/\s+/);
    const len = (x, size) => (x.endsWith('%') ? (parseFloat(x) * size) / 100 : parseFloat(x));
    const [t, rt, b, l] = [v[0], v[1] ?? v[0], v[2] ?? v[0], v[3] ?? v[1] ?? v[0]];
    const box = [r.left + len(l, r.width), r.top + len(t, r.height), r.right - len(rt, r.width), r.bottom - len(b, r.height)];
    return box.every(Number.isFinite) ? box : null;
  };
  // Visually hidden on purpose (the sr-only pattern, text for screen readers): clipped to nothing by
  // clip or clip-path, or inside a box of 1px or less that hides its overflow. Neither check applies.
  // A clip-path inset that leaves part of the box (inset(50% 0 0 0)) is not this: it cuts text off.
  const srOnly = (el) => {
    for (let e = el; e && e.nodeType === 1 && e !== document.body; e = up(e)) {
      const cs = getComputedStyle(e), r = e.getBoundingClientRect();
      if (/^rect\(/.test(cs.clip) && /^(absolute|fixed)$/.test(cs.position)) {
        const [t, rt, b, l] = cs.clip.slice(5, -1).split(/\s*,\s*|\s+/).map((v, i) => (v === 'auto' ? [0, r.width, r.height, 0][i] : parseFloat(v)));
        if (b - t <= 1 || rt - l <= 1) return true;
      }
      const cp = cs.clipPath || 'none';
      const inset = insetOf(cp, r);
      const pts = cp.startsWith('polygon(') ? cp.slice(8, -1).split(',').map((p) => p.trim()) : [];
      if ((inset && (inset[2] - inset[0] <= 1 || inset[3] - inset[1] <= 1)) || /^(circle|ellipse)\(\s*0(px|%)?[\s)]/.test(cp) || (pts.length && new Set(pts).size === 1)) return true;
      if (/(hidden|clip)/.test(cs.overflow + cs.overflowX + cs.overflowY) && (r.width <= 1 || r.height <= 1)) return true;
    }
    return false;
  };
  // A focus target parked off-screen (a skip link at left:-9999px) that comes into view when focused:
  // focus it, look, and put focus back. Transitions started by the focus change are finished at once,
  // so the page is captured as it was.
  const FOCUSABLE = 'a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"])';
  const showsOnFocus = (el) => {
    const f = el.closest(FOCUSABLE);
    if (!f || typeof f.focus !== 'function') return false;
    const prev = document.activeElement, before = new Set(document.getAnimations());
    const settle = () => { for (const a of document.getAnimations()) if (!before.has(a)) a.finish(); };
    f.focus({ preventScroll: true }); settle();
    const r = el.getBoundingClientRect();
    const shown = document.activeElement === f && r.right > 0 && r.left < W && r.bottom > 0 && (scrolls || r.top < H);
    f.blur();
    if (prev && prev !== document.body && typeof prev.focus === 'function') prev.focus({ preventScroll: true });
    settle();
    return shown;
  };
  // Inactive controls: WCAG 1.4.3 exempts their text from the contrast minimum.
  const inactive = (el) => {
    for (let e = el; e; e = up(e)) {
      if (e.getAttribute('aria-disabled') === 'true') return 'inactive control (aria-disabled="true"): WCAG 1.4.3 exempts it';
      if (e.matches(':disabled')) return e.tagName === 'FIELDSET' ? 'inside a disabled fieldset: WCAG 1.4.3 exempts inactive controls' : 'inactive control (:disabled): WCAG 1.4.3 exempts it';
    }
    return null;
  };
  // Which axes a box cuts its content off on (scrollToo: or scrolls it). overflow does nothing on an inline
  // box; a box that scrolls (auto, scroll) can be scrolled to, except in a fixed-size graphic, a still picture.
  const REPLACED = /^(IMG|VIDEO|CANVAS|IFRAME|EMBED|OBJECT|INPUT|SELECT|TEXTAREA|BUTTON)$/;
  const axes = (e, cs, scrollToo) => {
    if (cs.display === 'contents' || (cs.display === 'inline' && e instanceof HTMLElement && !REPLACED.test(e.tagName))) return null;
    const k = (v) => v !== 'visible' && (scrollToo || /hidden|clip/.test(v) || (fixedFrame && /auto|scroll/.test(v)));
    const a = { x: k(cs.overflowX), y: k(cs.overflowY) };
    return a.x || a.y ? a : null;
  };
  // The padding box, where overflow is clipped, in viewport pixels (scaled with the element)
  const padBox = (e) => {
    const r = e.getBoundingClientRect();
    if (!e.offsetWidth || !e.offsetHeight) return [r.left, r.top, r.right, r.bottom];
    const sx = r.width / e.offsetWidth, sy = r.height / e.offsetHeight;
    return [r.left + e.clientLeft * sx, r.top + e.clientTop * sy, r.left + (e.clientLeft + e.clientWidth) * sx, r.top + (e.clientTop + e.clientHeight) * sy];
  };
  // Ink: where the glyphs really are. Each character's box comes from a range and the glyph's own extent
  // from canvas metrics (same font, fallback included), placed on its baseline, so a font box taller than
  // the letters (line-height under 1, a tight SVG viewBox) crossing an edge is not taken for cut-off text.
  // null where that does not hold (rotated or vertical text, very long runs): the font box is used then.
  const mg = document.createElement('canvas').getContext('2d');
  const fontOf = (cs) => `${cs.fontStyle} ${cs.fontVariantCaps === 'small-caps' ? 'small-caps ' : ''}${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const inkOf = (el, own, cs) => {
    if (cs.writingMode !== 'horizontal-tb') return null;
    for (let e = el; e; e = up(e)) {
      const s = getComputedStyle(e), m = /^matrix(3d)?\(([^)]*)\)/.exec(s.transform);
      if (s.rotate && s.rotate !== 'none') return null;
      if (m) { const v = m[2].split(',').map(Number); if (m[1] ? v[1] || v[4] || v[3] || v[7] : v[1] || v[2]) return null; }
    }
    if (el instanceof SVGElement) {
      const ctm = el.getScreenCTM && el.getScreenCTM();
      if (el.hasAttribute('rotate') || (ctm && (Math.abs(ctm.b) > 1e-6 || Math.abs(ctm.c) > 1e-6))) return null;
    }
    mg.font = fontOf(cs);
    const fm = mg.measureText('x'), fh = fm.fontBoundingBoxAscent + fm.fontBoundingBoxDescent;
    if (!(fh > 0)) return null;
    const stroke = (el instanceof SVGElement ? (cs.stroke !== 'none' && parseFloat(cs.strokeWidth)) || 0 : parseFloat(cs.webkitTextStrokeWidth) || 0) / 2;
    const tt = cs.textTransform, forms = (c) => (tt === 'uppercase' ? [c.toUpperCase()] : tt === 'lowercase' ? [c.toLowerCase()] : tt === 'capitalize' ? [c, c.toUpperCase()] : [c]);
    const range = document.createRange(), b = [Infinity, Infinity, -Infinity, -Infinity];
    let n = 0;
    for (const node of own) {
      const s = node.textContent;
      for (let i = 0; i < s.length;) {
        const ch = s.slice(i, i + (s.codePointAt(i) > 0xffff ? 2 : 1));
        range.setStart(node, i); range.setEnd(node, (i += ch.length));
        if (!ch.trim()) continue;
        if (++n > 5000) return null;
        const r = range.getBoundingClientRect();
        if (!r.width && !r.height) continue;
        const k = r.height / fh, base = r.top + fm.fontBoundingBoxAscent * k;
        if (k < 0.05 || k > 50) return null;
        for (const f of forms(ch)) {
          const m = mg.measureText(f);
          b[0] = Math.min(b[0], r.left - (m.actualBoundingBoxLeft + stroke) * k); b[1] = Math.min(b[1], base - (m.actualBoundingBoxAscent + stroke) * k);
          b[2] = Math.max(b[2], r.left + (m.actualBoundingBoxRight + stroke) * k); b[3] = Math.max(b[3], base + (m.actualBoundingBoxDescent + stroke) * k);
        }
      }
    }
    return b[0] < Infinity ? b : null;
  };

  const clip = [], texts = [];
  let runs = 0;
  const push = (el, what, cs, paint, p, boxes) => {
    // The paint the glyphs really get: SVG text paints with fill (and fill-opacity); HTML text with
    // -webkit-text-fill-color, which is the CSS color unless a page sets it (transparent for gradient text).
    const server = paint === 'none' || paint.startsWith('url(');
    const fg = server ? null : parse(paint);
    if (fg && el instanceof SVGElement) fg[3] *= Number(cs.fillOpacity || 1);
    const alpha = fg ? fg[3] * p.o : 0;
    const size = parseFloat(cs.fontSize), bold = Number(cs.fontWeight) >= 700;
    texts.push({
      element: what, fg: fg ? fg.slice(0, 3) : [0, 0, 0], fgAlpha: alpha,
      // Gradient or image text, outlined SVG text, colours the browser cannot resolve and paint changed by a filter are not measured this way.
      unmeasured: paint === 'none' ? 'no fill (outlined text); check by eye'
        : server ? 'gradient or pattern fill; check by eye'
          : !fg ? `colour "${paint}" could not be resolved to sRGB; check by eye`
            : p.changed ? `${p.changed} changes how the text is painted; check by eye`
              : alpha === 0 ? 'transparent text fill (gradient or image text); check by eye' : null,
      exempt: inactive(el),
      required: size >= 24 || (bold && size >= 18.66) ? 3 : 4.5,
      // each line box on its own: a dark inline child or a float between them is not the text's background
      boxes: boxes.slice(0, 200).map((b) => b.map((v) => Math.round(v))),
    });
  };
  // Form fields draw their text in the browser's own shadow tree: the value (or the placeholder) is measured
  // over the content box, as wide as the text.
  const TYPED = /^(text|search|email|url|tel|password|number|date|time|datetime-local|month|week)$/;
  const field = (el) => {
    const type = el.tagName === 'INPUT' ? el.type : el.tagName.toLowerCase();
    let text = '', pseudo = null, align = null;
    if (type === 'textarea' || TYPED.test(type)) { text = type === 'password' ? '•'.repeat(el.value.length) : el.value; if (!text && el.placeholder) { text = el.placeholder; pseudo = '::placeholder'; } }
    else if (/^(button|submit|reset)$/.test(type)) { text = el.value || { submit: 'Submit', reset: 'Reset' }[type] || ''; align = 'center'; }
    else if (type === 'select' && !el.multiple && el.size <= 1) text = el.selectedOptions[0] ? el.selectedOptions[0].text : '';
    if (!text.trim() || !visible(el) || srOnly(el)) return;
    const cs = getComputedStyle(el), ps = pseudo ? getComputedStyle(el, pseudo) : cs, p = paintOf(el);
    if (pseudo && Number.isFinite(Number(ps.opacity))) p.o *= Number(ps.opacity);
    if (p.o < 0.004) return;
    runs++;
    const pb = padBox(el), px = (k) => parseFloat(cs[k]) || 0;
    const cb = [pb[0] + px('paddingLeft'), pb[1] + px('paddingTop'), pb[2] - px('paddingRight'), pb[3] - px('paddingBottom')];
    mg.font = fontOf(cs);
    const w = Math.min(cb[2] - cb[0], Math.max(...text.split('\n').map((l) => mg.measureText(l).width)));
    const a = align || cs.textAlign, x0 = /center/.test(a) ? (cb[0] + cb[2] - w) / 2 : /right|end/.test(a) ? cb[2] - w : cb[0];
    push(el, `${label(el)} "${text.trim().replace(/\s+/g, ' ').slice(0, 40)}"${pseudo ? ' (placeholder)' : ''}`, cs, String(ps.webkitTextFillColor || ps.color || ''), p, [[x0, cb[1], x0 + w, cb[3]]]);
  };

  const all = [];
  const collect = (root) => { for (const el of root.querySelectorAll('*')) { all.push(el); if (el.shadowRoot) collect(el.shadowRoot); } };
  collect(document.body);
  // body's overflow belongs to the viewport while html leaves its own visible: the frame test covers it
  const rcs = getComputedStyle(document.documentElement);
  const bodyIsViewport = rcs.overflowX === 'visible' && rcs.overflowY === 'visible';
  const BOTH = { x: true, y: true };
  const range = document.createRange();
  for (const el of all) {
    // Generated text (::before / ::after content) has no box to sample: it is listed for a look by eye.
    for (const pe of ['::before', '::after']) {
      const ps = getComputedStyle(el, pe), c = ps.content;
      if (!c || c === 'none' || c === 'normal' || ps.display === 'none') continue;
      const words = [...c.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((q) => q[1].replace(/\\(.)/g, '$1')).join('').replace(/[\uE000-\uF8FF]/g, '').trim();
      if ((words || /counters?\(|attr\(/.test(c)) && visible(el) && !srOnly(el)) texts.push({ element: `${label(el)}${pe} "${(words || c).slice(0, 40)}"`, unmeasured: 'generated text (::before/::after content); check its contrast by eye' });
    }
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) { field(el); continue; }
    // The element's own text only: a child (a badge, a link) is measured on its own, against its own background.
    const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own.length || !visible(el) || srOnly(el)) continue;
    const p = paintOf(el);
    if (p.o < 0.004) continue;   // fully transparent: not shown
    const lines = own.flatMap((n) => { range.selectNodeContents(n); return [...range.getClientRects()]; }).filter((r) => r.width > 0 && r.height > 0).map((r) => [r.left, r.top, r.right, r.bottom]);
    if (!lines.length) continue;
    runs++;
    const box = lines.reduce((a, r) => [Math.min(a[0], r[0]), Math.min(a[1], r[1]), Math.max(a[2], r[2]), Math.max(a[3], r[3])]);
    const cs = getComputedStyle(el), em = parseFloat(cs.fontSize) || 16;
    const text = own.map((n) => n.textContent).join(' ').trim().replace(/\s+/g, ' ');
    const what = `${label(el)} "${text.slice(0, 40)}"`;
    let ink;
    const inkBox = () => (ink === undefined ? (ink = inkOf(el, own, cs) || box) : ink);
    // Cut off by box c on axes a: the font box comes within half an em of an edge, and the ink crosses it by over 1 px.
    const beyond = (b, c, a, m) => (a.x && (b[0] < c[0] + m || b[2] > c[2] - m)) || (a.y && (b[1] < c[1] + m || b[3] > c[3] - m));
    const cuts = (c, a) => beyond(box, c, a, em / 2) && beyond(inkBox(), c, a, -1);
    const shown = [];   // [box, axes] of everything that clips the text's paint, for the frame test
    let reason = null, hidden = false;
    for (let a = el; a && a !== document.documentElement; a = up(a)) {
      const acs = a === el ? cs : getComputedStyle(a);
      const any = a === document.body && bodyIsViewport ? null : axes(a, acs, true);
      if (any) {
        const c = padBox(a), cut = axes(a, acs, false);
        if (a === el && cut) {
          // all of it outside its own clipping box: hidden on purpose (text-indent image replacement, a collapsed panel)
          if ((cut.x && (box[2] <= c[0] || box[0] >= c[2])) || (cut.y && (box[3] <= c[1] || box[1] >= c[3]))) { hidden = true; break; }
          if (cut.x && cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1) reason = 'truncated with an ellipsis';
          else if (cuts(c, cut)) reason = 'overflows its box and is clipped';
        } else if (!reason && cut && cuts(c, cut)) reason = `cut off by ${label(a)}`;
        shown.push([c, any]);
      }
      const ins = acs.clipPath !== 'none' && acs.display !== 'contents' && insetOf(acs.clipPath, a.getBoundingClientRect());
      if (ins) { if (!reason && cuts(ins, BOTH)) reason = `cut off by clip-path on ${label(a)}`; shown.push([ins, BOTH]); }
    }
    if (hidden) continue;
    // Sideways overflow is always wrong; below the fold is only wrong for fixed-size frames. Only what is painted
    // counts: the text clipped by the boxes above it (a scroll box keeps its overflow inside).
    const vis = (b) => shown.reduce((v, [c, a]) => [a.x ? Math.max(v[0], c[0]) : v[0], a.y ? Math.max(v[1], c[1]) : v[1], a.x ? Math.min(v[2], c[2]) : v[2], a.y ? Math.min(v[3], c[3]) : v[3]], b);
    const off = (b, m) => b[2] > b[0] && b[3] > b[1] && (b[0] < m || b[2] > W - m || (!scrolls && (b[1] < m || b[3] > H - m)));
    const offFrame = off(vis(box), em / 2) && off(vis(inkBox()), -1);
    if (offFrame && showsOnFocus(el)) continue;
    if (reason) clip.push({ element: what, reason });
    if (offFrame) clip.push({ element: what, reason: `outside the ${W}x${H} frame` });
    push(el, what, cs, String((el instanceof SVGElement ? cs.fill : cs.webkitTextFillColor || cs.color) || ''), p, lines);
  }
  return { clip, texts, runs, width: W, height: H };
}

// Runs inside the page: how far the content reaches, leaving out art marked data-easel-bleed (and everything
// in it), which may run past a fixed frame on purpose. Each marked element is shrunk to nothing for the
// measurement (a transform, or a relative offset for an inline box: neither moves anything else) and put
// back; a transition that putting it back starts is finished at once, so the page is captured as it was.
function frameFit() {
  const de = document.documentElement, vw = innerWidth, vh = innerHeight;
  const label = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += `#${el.id}`; else if (el.classList.length) s += `.${[...el.classList].slice(0, 2).join('.')}`; return s; };
  const bleed = [...document.querySelectorAll('[data-easel-bleed]')].filter((e) => !(e.parentElement && e.parentElement.closest('[data-easel-bleed]')));
  let s = { w: de.scrollWidth, h: de.scrollHeight };
  if (bleed.length && (s.w > vw + 1 || s.h > vh + 1)) {
    const saved = bleed.map((e) => [e, e.getAttribute('style')]), before = new Set(document.getAnimations());
    for (const e of bleed) {
      const set = (k, v) => e.style.setProperty(k, v, 'important');
      set('transition', 'none');
      if (getComputedStyle(e).display === 'inline' && e instanceof HTMLElement && !/^(IMG|VIDEO|CANVAS|IFRAME|EMBED|OBJECT|INPUT|SELECT|TEXTAREA|BUTTON)$/.test(e.tagName)) { set('position', 'relative'); set('left', '-100000px'); set('top', '-100000px'); }
      else { set('transform', 'scale(0)'); set('transform-origin', '0 0'); }
    }
    s = { w: de.scrollWidth, h: de.scrollHeight };
    for (const [e, st] of saved) if (st === null) e.removeAttribute('style'); else e.setAttribute('style', st);
    void de.scrollWidth;
    for (const a of document.getAnimations()) if (!before.has(a)) a.finish();
  }
  return { ...s, vw, vh, exempt: bleed.map(label) };
}

// Runs inside the page on a screenshot taken with all text hidden: for each text run, contrast of the text
// colour against every background pixel under each of its line boxes; the 10th percentile of a line is its
// score, and the run's score is its worst line.
function measureContrast(imgs, items) {
  const [img] = imgs;
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const L = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  return items.map(({ boxes, fg, fgAlpha }) => {
    let worst = null;
    for (const box of boxes) {
      const [x0, y0, x1, y1] = [Math.max(0, box[0]), Math.max(0, box[1]), Math.min(img.width, box[2]), Math.min(img.height, box[3])];
      if (x1 <= x0 || y1 <= y0) continue;
      const step = Math.max(1, Math.floor(Math.sqrt(((x1 - x0) * (y1 - y0)) / 6000)));
      const ratios = [];
      let sum = [0, 0, 0];
      for (let y = y0; y < y1; y += step) for (let x = x0; x < x1; x += step) {
        const i = (y * img.width + x) * 4;
        const bg = [img.data[i], img.data[i + 1], img.data[i + 2]];
        const f = fg.map((c, k) => c * fgAlpha + bg[k] * (1 - fgAlpha));
        const a = L(f), b = L(bg);
        ratios.push((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05));
        sum = sum.map((v, k) => v + bg[k]);
      }
      ratios.sort((a, b) => a - b);
      const ratio = ratios[Math.floor(ratios.length * 0.1)];
      if (!worst || ratio < worst.ratio) worst = { ratio, bg: sum.map((v) => Math.round(v / ratios.length)) };
    }
    return worst;
  });
}

const HIDE_TEXT = '*,*::before,*::after{color:transparent!important;-webkit-text-fill-color:transparent!important;-webkit-text-stroke-color:transparent!important;text-shadow:none!important;text-decoration-color:transparent!important;caret-color:transparent!important}text,tspan,textPath{fill:transparent!important;stroke:transparent!important}' +
  '*::placeholder,*::first-letter,*::first-line,*::marker{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important}';

// Runs inside the page: hides every text run for the background capture, open shadow roots included (css),
// or shows them again (null).
function hideText(css) {
  const roots = [document];
  for (let i = 0; i < roots.length; i++) for (const el of roots[i].querySelectorAll('*')) if (el.shadowRoot) roots.push(el.shadowRoot);
  for (const r of roots) {
    if (!css) { for (const s of r.querySelectorAll('style[data-easel-hide]')) s.remove(); continue; }
    const s = document.createElement('style'); s.setAttribute('data-easel-hide', ''); s.textContent = css;
    (r === document ? document.head || document.documentElement : r).appendChild(s);
  }
}

async function pageChecks(args, out) {
  const src = resolveSource(args, out, 'qa-page');
  let browser = null, runs = 0;
  const clip = [], contrast = [], unmeasured = [], overflow = [], bleed = [];
  // aspect: the format a format-aware page lays itself out in (window.__easel.aspect) and its size, as for render_still
  const [aw, ah] = args.aspect ? ASPECTS[args.aspect] : [];
  try {
    browser = await openBrowser();
    const { page, context } = await newPage(browser, { width: args.width || aw || 1200, height: args.height || ah || 630, colorScheme: args.theme || 'light', aspect: args.aspect || null, reducedMotion: args.reducedMotion });
    try {
      await page.goto(src.url, { waitUntil: 'load', timeout: 60000 });
      await waitReady(page);
      for (const t of args.times && args.times.length ? args.times : [0]) {
        await page.evaluate((tt) => window.__easelSeek(tt), t);
        const scan = await page.evaluate(pageScan, { fixedFrame: !!args.fixedFrame });
        runs = Math.max(runs, scan.runs);
        const at = args.times && args.times.length ? { t } : {};
        // a fixed-size graphic (a post, a poster, a slide) must not grow past its frame: below the fold is not allowed
        if (args.fixedFrame) {
          const o = await page.evaluate(frameFit);
          if (o.exempt.length > bleed.length) bleed.splice(0, bleed.length, ...o.exempt.map((e) => ({ element: e, reason: 'data-easel-bleed: bleeds off the frame on purpose, so it is not counted' })));
          if (o.w > o.vw + 1 || o.h > o.vh + 1) overflow.push({ element: 'page', content: `${o.w}x${o.h}`, frame: `${o.vw}x${o.vh}`, fix: 'the content runs past the fixed frame: tighten the layout or fix the root size (art that bleeds off on purpose carries data-easel-bleed)', ...at });
        }
        clip.push(...scan.clip.map((c) => ({ ...c, ...at })));
        const measurable = scan.texts.filter((c) => !c.unmeasured);
        unmeasured.push(...scan.texts.filter((c) => c.unmeasured).map((c) => ({ element: c.element, reason: c.unmeasured, ...at })));
        if (!measurable.length || !args.wantContrast) continue;
        await page.evaluate(hideText, HIDE_TEXT);
        let shot;
        try {
          shot = await page.screenshot({ type: 'png', fullPage: true, animations: 'allow' });
        } catch {
          // Chromium occasionally refuses a full-page capture right after a style change; retry once.
          await page.waitForTimeout(250);
          shot = await page.screenshot({ type: 'png', fullPage: true, animations: 'allow' });
        }
        await page.evaluate(hideText, null);
        const res = await page.evaluate(async ({ url, items, fn }) => {
          const img = new Image(); img.src = url; await img.decode();
          const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
          const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
          // eslint-disable-next-line no-new-func
          return new Function('imgs', 'items', `return (${fn})(imgs, items);`)([{ data: g.getImageData(0, 0, c.width, c.height).data, width: c.width, height: c.height }], items);
        }, { url: `data:image/png;base64,${shot.toString('base64')}`, items: measurable, fn: measureContrast.toString() });
        measurable.forEach((c, i) => { if (res[i]) contrast.push({ ...c, ratio: res[i].ratio, bg: res[i].bg, ...at }); });
      }
    } finally {
      await context.close();
    }
  } finally {
    if (browser) await browser.close();
    releaseSource(src);
  }
  const scored = contrast.filter((c) => !c.exempt);
  const fails = scored.filter((c) => c.ratio < c.required);
  const tAt = (c) => (c.t !== undefined ? { t: c.t } : {});
  const exempt = contrast.filter((c) => c.exempt).map((c) => ({ element: c.element, reason: c.exempt, ratio: +c.ratio.toFixed(2), ...tAt(c) }));
  const details = { ...(unmeasured.length ? { unmeasured: unmeasured.slice(0, 20) } : {}), ...(exempt.length ? { exempt: exempt.slice(0, 20) } : {}) };
  const threshold = 'WCAG AA (4.5, large text 3), 10th percentile of the pixels behind each line of text';
  // Nothing measured is not a pass: named in checks, contrast fails; run by default, it is reported as not run.
  const none = 'no HTML or SVG text could be measured (only text in a canvas or an image, or text listed as unmeasured or exempt): check such text by eye';
  const contrastCheck = scored.length
    ? { name: 'contrast', pass: fails.length === 0, hard: args.mode === 'ui', value: +Math.min(...scored.map((c) => c.ratio)).toFixed(2), threshold, findings: fails.slice(0, 20).map((c) => ({ element: c.element, ratio: +c.ratio.toFixed(2), required: c.required, fg: c.fg, bg: c.bg, ...tAt(c) })), ...details }
    : args.checks && args.checks.includes('contrast')
      ? { name: 'contrast', pass: false, hard: true, value: null, threshold, findings: [{ fix: `${none}, or leave contrast out of checks` }], ...details }
      : { name: 'contrast', pass: null, hard: false, value: null, threshold, notRun: none, findings: [], ...details };
  return [
    ...(args.fixedFrame ? [{ name: 'frame_overflow', pass: overflow.length === 0, hard: true, value: overflow.length, threshold: 'content fits the frame (fixedFrame)', findings: overflow, ...(bleed.length ? { exempt: bleed.slice(0, 20) } : {}) }] : []),
    { name: 'text_clipping', pass: clip.length === 0, hard: true, value: clip.length, threshold: 0, textRuns: runs, findings: clip.slice(0, 20) },
    contrastCheck,
  ];
}

// ---------- media checks (ffmpeg) ----------
// Inside qa ffmpeg runs asynchronously, so a long decode never stalls the MCP server's other calls; the
// exported checks run it synchronously (scripts and tests). Both are bounded by a timeout. -xerror stops at
// the first decode error and any error ffmpeg logs fails the run: a damaged file is never measured on
// whatever part of it decoded.
const FF_TIMEOUT = 10 * 60 * 1000, FF_MAX = 1 << 28;
export function runFfmpeg(args, { timeoutMs = FF_TIMEOUT } = {}) {
  const bin = requireBinary('ffmpeg');
  return new Promise((resolvePromise, reject) => {
    const p = spawn(bin, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    const out = [], err = [];
    let size = 0, why = null;
    // stop the whole tree and answer now: on Windows the real ffmpeg behind a Chocolatey shim outlives a
    // plain kill and holds the pipes open, so 'close' would never come (CI hung here)
    const stop = (msg) => { if (why) return; why = msg; clearTimeout(timer); killTree(p); p.stdout.destroy(); p.stderr.destroy(); p.unref(); reject(new Error(msg)); };
    const timer = setTimeout(() => stop(`ffmpeg timed out after ${timeoutMs / 1000} s`), timeoutMs);
    p.stdout.on('data', (d) => { size += d.length; if (size > FF_MAX) stop('ffmpeg wrote more than 256 MB'); else out.push(d); });
    p.stderr.on('data', (d) => err.push(d));
    p.on('error', (e) => { clearTimeout(timer); if (!why) reject(e); });
    p.on('close', (status) => { clearTimeout(timer); if (!why) resolvePromise({ status, stdout: Buffer.concat(out), stderr: Buffer.concat(err).toString('utf8') }); });
  });
}
function runFfmpegSync(args, { timeoutMs = FF_TIMEOUT } = {}) {
  const r = spawnSync(requireBinary('ffmpeg'), args, { windowsHide: true, maxBuffer: FF_MAX, timeout: timeoutMs });
  if (r.error) throw r.error.code === 'ETIMEDOUT' ? new Error(`ffmpeg timed out after ${timeoutMs / 1000} s`) : r.error;
  return { status: r.status, stdout: r.stdout, stderr: String(r.stderr || '') };
}
// ffmpeg with level-tagged log lines, so an [error] line can be told apart from the info a check reads
const ffArgs = (level, file, rest) => ['-hide_banner', '-nostats', '-loglevel', `level+${level}`, '-xerror', '-i', file, ...rest];
function decoded(r, file) {
  const bad = r.stderr.split(/\r?\n/).filter((l) => /\[(error|fatal|panic)\]/.test(l));
  if (r.status !== 0 || bad.length) throw new Error(`ffmpeg could not decode ${file}${r.status ? ` (exit ${r.status})` : ''}: ${(bad.slice(-3).join(' | ') || r.stderr.trim()).slice(-600)}. Re-encode it (for example ffmpeg -i in -c:v libx264 -pix_fmt yuv420p -c:a aac out.mp4) and run qa again.`);
  return r;
}
// A media check: ffmpeg arguments for a file, and a reading of what ffmpeg returned. check(file, opts) runs it
// synchronously; check.async(file, opts) does not block.
const mediaCheck = (argsOf, read) => {
  const check = (file, o = {}) => read(decoded(runFfmpegSync(argsOf(file, o)), file), file, o);
  check.async = async (file, o = {}) => read(decoded(await runFfmpeg(argsOf(file, o)), file), file, o);
  return check;
};

// A sample is "still" when almost no pixels change between consecutive samples. Frames are decoded
// small (160x90 grey at 10 fps) and lightly blurred, so grain and noise do not count as motion while
// a small object moving slowly across a flat background still does. (ffmpeg freezedetect averages
// the whole frame and calls such shots frozen.)
const SW = 160, SH = 90, SFPS = 10;
export const stillness = mediaCheck((file) => ffArgs('error', file, ['-map', '0:v:0', '-vf', `fps=${SFPS},scale=${SW}:${SH}:flags=area,format=gray,gblur=sigma=0.8`, '-f', 'rawvideo', '-pix_fmt', 'gray', '-']), (r, file, { seconds = 2, diff = 10, minPixels = 4 }) => {
  const buf = r.stdout, frames = Math.floor(buf.length / (SW * SH));
  const runs = [];
  let start = null;
  for (let f = 1; f < frames; f++) {
    let changed = 0;
    const a = (f - 1) * SW * SH, b = f * SW * SH;
    for (let i = 0; i < SW * SH && changed < minPixels; i++) if (Math.abs(buf[a + i] - buf[b + i]) > diff) changed++;
    const still = changed < minPixels;
    const last = f === frames - 1;
    if (still && start === null) start = f - 1;
    if (start !== null && (!still || last)) {
      const end = still ? f : f - 1;
      const duration = +((end - start) / SFPS).toFixed(2);
      if (duration >= seconds) runs.push({ start: +(start / SFPS).toFixed(2), duration });
      start = null;
    }
  }
  return { name: 'stillness', pass: runs.length === 0, hard: true, value: runs.length ? Math.max(...runs.map((x) => x.duration)) : 0, threshold: `no still or empty stretch longer than ${seconds} s`, findings: runs };
});

export const colourCast = mediaCheck((file, { fps = 2 }) => ffArgs('error', file, ['-vf', `${VIDEO.has(extname(file).toLowerCase()) ? `fps=${fps},` : ''}scale=48:27:flags=area`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']), (r, file, { maxRatio = 0.3, fps = 2 }) => {
  const isVideo = VIDEO.has(extname(file).toLowerCase());
  const buf = r.stdout, per = 48 * 27 * 3, frames = Math.floor(buf.length / per);
  let cast = 0;
  const casts = [];
  for (let f = 0; f < frames; f++) {
    let bp = 0;
    for (let i = f * per; i < (f + 1) * per; i += 3) {
      const R = buf[i] / 255, G = buf[i + 1] / 255, B = buf[i + 2] / 255;
      const max = Math.max(R, G, B), min = Math.min(R, G, B), d = max - min;
      if (max < 0.15 || d / (max || 1) < 0.25) continue; // too dark or too grey to carry a hue
      let h = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
      h = (h * 60 + 360) % 360;
      if (h >= 220 && h <= 300) bp++;
    }
    if (bp / (48 * 27) > 0.5) { cast++; if (casts.length < 10) casts.push(isVideo ? +(f / fps).toFixed(2) : 0); }
  }
  const ratio = frames ? cast / frames : 0;
  return { name: 'colour_cast', pass: ratio <= maxRatio, hard: true, value: +ratio.toFixed(3), threshold: `at most ${Math.round(maxRatio * 100)}% of frames dominated by blue-purple`, findings: casts.length ? [{ castFrames: cast, of: frames, firstAt: casts }] : [] };
});

export const loudness = mediaCheck((file) => ffArgs('info', file, ['-map', '0:a:0', '-af', 'ebur128=peak=true', '-f', 'null', '-']), (r, file, { min = -16, max = -12 }) => {
  const summary = r.stderr.slice(r.stderr.lastIndexOf('Summary:'));
  const I = Number((summary.match(/I:\s+(-?[\d.]+|-inf) LUFS/) || [])[1]);
  const peak = Number((summary.match(/Peak:\s+(-?[\d.]+|-inf) dBFS/) || [])[1]);
  const silent = !Number.isFinite(I) || I <= -70;
  const ok = !silent && I >= min && I <= max;
  return { name: 'loudness', pass: ok, hard: true, value: Number.isFinite(I) ? I : null, threshold: `${min} to ${max} LUFS integrated`, findings: ok ? [] : [{ integratedLufs: Number.isFinite(I) ? I : '-inf', truePeakDbfs: Number.isFinite(peak) ? peak : null, fix: silent ? 'the track is silent (below -70 LUFS): check that the audio was mixed in' : `apply ${(-14 - I).toFixed(1)} dB of gain, or loudnorm=I=-14:TP=-1` }] };
});

async function hasAudio(file) {
  const r = await runFfmpeg(['-hide_banner', '-i', file], { timeoutMs: 60000 });
  return /Stream #\d+:\d+.*: Audio:/.test(r.stderr);
}

// ffmpeg would read a URL (or a protocol such as concat:) as happily as a file: qa checks local files
// only, by absolute path (the same rule as render_video's audio).
function localFile(p, what) {
  const abs = resolve(String(p));
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(String(p)) || !existsSync(abs) || !statSync(abs).isFile()) throw new Error(`${what} must be a local file that exists: ${p}`);
  return abs;
}

// Callers may tighten the media gates, never loosen them past these: loudness stays inside -18 to -10
// LUFS (Easel masters to -14 and delivers -16 to -12), and a still stretch is at most 5 s.
export const GATE_LIMITS = { lufsMin: -18, lufsMax: -10, stillSeconds: 5 };
// What each check needs; a check the caller names that cannot run fails instead of being left out.
const NEEDS = {
  text_clipping: 'a page (html or file)', contrast: 'a page (html or file)',
  canvas_text: 'a canvas piece (html or file with window.renderFrame and window.TIMELINE)', beat_grid: 'a canvas piece with TIMELINE.bpm',
  stillness: 'a video', colour_cast: 'a video or an image', loudness: 'an audio file, or a video with an audio track',
};
const cannotRun = (name, why) => ({ name, pass: false, hard: true, value: null, threshold: `needs ${NEEDS[name] || 'a known check name'}`, findings: [{ fix: why }] });

export async function qa(args) {
  const t0 = Date.now();
  if (!args.html && !args.file && !args.video && !args.audio && !args.image) throw new Error('Give a page (html or file) and/or a video, audio or image file to check.');
  // an upside-down window would fail every file, whatever its loudness
  const [lo, hi] = [args.lufsMin ?? -16, args.lufsMax ?? -12];
  if (lo > hi) throw new Error(`lufsMin ${lo} is above lufsMax ${hi}: no loudness could pass. Give lufsMin at or below lufsMax (the defaults are -16 and -12 LUFS).`);
  const video = args.video ? localFile(args.video, 'video') : null;
  const audio = args.audio ? localFile(args.audio, 'audio') : null;
  const image = args.image ? localFile(args.image, 'image') : null;
  const want = (n) => !args.checks || !args.checks.length || args.checks.includes(n);
  const checks = [];
  const explicit = (n) => !!(args.checks && args.checks.includes(n));
  const lufs = { min: Math.max(GATE_LIMITS.lufsMin, lo), max: Math.min(GATE_LIMITS.lufsMax, hi) };
  if ((args.html || args.file) && (want('text_clipping') || want('contrast'))) {
    const out = outputDir(args);
    checks.push(...(await pageChecks({ ...args, wantContrast: want('contrast') }, out)).filter((c) => want(c.name) || c.name === 'frame_overflow'));
  }
  // Canvas pieces (window.renderFrame + window.TIMELINE): asked for by name, or found when no checks are named.
  if ((args.html || args.file) && (want('canvas_text') || want('beat_grid'))) {
    const out = outputDir(args);
    const src = resolveSource(args, out, 'qa-canvas');
    try {
      const cs = await canvasChecks(args, src, want);
      if (cs) checks.push(...cs);
      else for (const n of ['canvas_text', 'beat_grid'].filter(explicit)) checks.push({ name: n, pass: false, hard: true, value: null, threshold: 'a canvas piece', findings: [{ fix: `${n} needs a page with window.renderFrame(t) and window.TIMELINE (an animate piece)` }] });
    } finally { releaseSource(src); }
  }
  if (video) {
    if (want('stillness')) checks.push(await stillness.async(video, { seconds: Math.min(GATE_LIMITS.stillSeconds, args.stillSeconds ?? 2) }));
    if (want('colour_cast')) checks.push(await colourCast.async(video, { maxRatio: args.castMaxRatio ?? 0.3 }));
    if (want('loudness')) {
      if (await hasAudio(video)) checks.push(await loudness.async(video, { min: lufs.min, max: lufs.max }));
      else if (explicit('loudness') && !audio) checks.push(cannotRun('loudness', 'the video has no audio track: add one (render_video audio, or mux_audio) or leave loudness out'));
    }
  }
  if (image && want('colour_cast')) checks.push(await colourCast.async(image, { maxRatio: args.castMaxRatio ?? 0.3 }));
  if (audio && want('loudness')) checks.push(await loudness.async(audio, { min: lufs.min, max: lufs.max }));
  for (const n of args.checks || []) if (!checks.some((c) => c.name === n)) checks.push(cannotRun(n, `${n} was asked for but could not run: it needs ${NEEDS[n] || 'a known check name'}`));
  // Nothing measured is not a pass: a check reported as not run (pass null) is not one that ran.
  if (!checks.some((c) => c.pass !== null)) return { pass: false, deliver: 'refused: no check ran; give a page, video, audio or image the checks apply to', hardFailures: [], checks, ms: Date.now() - t0 };
  const hardFailures = checks.filter((c) => c.hard && !c.pass).map((c) => c.name);
  return { pass: hardFailures.length === 0, deliver: hardFailures.length === 0 ? 'ok' : `refused: fix ${hardFailures.join(', ')} first`, hardFailures, checks, ms: Date.now() - t0 };
}
