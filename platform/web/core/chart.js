// Charts, diagrams and lab readouts: one look everywhere. Sizes, strokes and colours are tokens in
// styles/charts.css; this file holds what has to be computed: where a label can sit without touching
// a line or another label, how an arrow bends and where its label goes, how a number is written in
// each language, and the stat tiles and slider rows of a lab. No DOM at import time, so the build
// (figures checked in Node) and the browser share it.

export const FONT = { tick: 11, axis: 11, label: 12, note: 11, title: 13 };
export const PHONE_FONT = { tick: 13, axis: 13, label: 14, note: 13, title: 15 };
export const STROKE = { line: 2, axis: 1, grid: 1, arrow: 1.5, ref: 1 };
export const GAP = 4;
export const HALO = "ch-halo";

// ── Numbers ──
const NF = new Map();
const nf = (lang, d) => {
  const k = lang + d;
  if (!NF.has(k)) NF.set(k, new Intl.NumberFormat(lang, { minimumFractionDigits: d, maximumFractionDigits: d }));
  return NF.get(k);
};
export function numbers(lang = "es") {
  const num = (v, d = 0) => (v < 0 ? "−" : "") + nf(lang, d).format(Math.abs(v));
  const big = lang === "es" ? [[1e12, " B"], [1e9, " mil M"], [1e6, " M"], [1e3, " k"]] : [[1e12, " T"], [1e9, " B"], [1e6, " M"], [1e3, " k"]];
  const sup = (n) => String(n).replace(/[-\d]/g, (c) => "⁻⁰¹²³⁴⁵⁶⁷⁸⁹"["-0123456789".indexOf(c)]);
  const sci = (v, cur = "") => { const e = Math.floor(Math.log10(Math.abs(v))); return (v < 0 ? "−" : "") + cur + nf(lang, 1).format(Math.abs(v) / 10 ** e) + " × 10" + sup(e); };
  const compact = (v, cur = "") => {
    const a = Math.abs(v);
    if (a >= 1e15) return sci(v, cur);
    const [div, suf] = big.find(([d]) => a >= d) || [1, ""];
    return (v < 0 ? "−" : "") + cur + nf(lang, div > 1 && a / div < 100 ? 1 : 0).format(a / div).replace(/[.,]0$/, "") + suf;
  };
  return {
    num,
    pct: (v, d = 1) => num(v, d) + "%",
    money: (v, d = 0, cur = "$") => (v < 0 ? "−" : "") + cur + nf(lang, d).format(Math.abs(v)),
    signed: (v, d = 0) => (v > 0 ? "+" : "") + num(v, d),
    compact,
    sci,
  };
}

// ── Geometry ──
export const overlaps = (a, b, pad = 0) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;
const inside = (b, o) => b.x >= o.x && b.y >= o.y && b.x + b.w <= o.x + o.w && b.y + b.h <= o.y + o.h;

export function segmentHitsBox(x1, y1, x2, y2, b, pad = 0) {
  const xmin = b.x - pad, xmax = b.x + b.w + pad, ymin = b.y - pad, ymax = b.y + b.h + pad;
  let t0 = 0, t1 = 1;
  const dx = x2 - x1, dy = y2 - y1;
  for (const [p, q] of [[-dx, x1 - xmin], [dx, xmax - x1], [-dy, y1 - ymin], [dy, ymax - y1]]) {
    if (p === 0) { if (q < 0) return false; continue; }
    const r = q / p;
    if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
  }
  return true;
}

export function polylineHitsBox(pts, b, pad = 0) {
  for (let i = 1; i < pts.length; i++) if (segmentHitsBox(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], b, pad)) return true;
  return pts.length === 1 && overlaps({ x: pts[0][0], y: pts[0][1], w: 0, h: 0 }, b, pad);
}

// The points along an SVG path's data (M L H V C S Q T Z, absolute or relative; an arc is its chord).
export function pathPoints(d, steps = 12) {
  const out = [], runs = [];
  const tok = String(d).match(/[a-zA-Z]|-?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?/g) || [];
  let i = 0, cmd = "", x = 0, y = 0, sx = 0, sy = 0, cx = 0, cy = 0, run = null;
  const n = () => Number(tok[i++]);
  const push = (px, py) => { run.push([px, py]); x = px; y = py; };
  const bez = (pts) => { for (let k = 1; k <= steps; k++) { const t = k / steps, u = 1 - t; if (pts.length === 3) push(u * u * pts[0][0] + 2 * u * t * pts[1][0] + t * t * pts[2][0], u * u * pts[0][1] + 2 * u * t * pts[1][1] + t * t * pts[2][1]); else push(u ** 3 * pts[0][0] + 3 * u * u * t * pts[1][0] + 3 * u * t * t * pts[2][0] + t ** 3 * pts[3][0], u ** 3 * pts[0][1] + 3 * u * u * t * pts[1][1] + 3 * u * t * t * pts[2][1] + t ** 3 * pts[3][1]); } };
  while (i < tok.length) {
    if (/[a-zA-Z]/.test(tok[i])) cmd = tok[i++];
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase(), ox = rel ? x : 0, oy = rel ? y : 0;
    if (C === "M") { run = []; runs.push(run); const px = n() + ox, py = n() + oy; push(px, py); sx = px; sy = py; cmd = rel ? "l" : "L"; }
    else if (C === "L") { const px = n() + ox, py = n() + oy; push(px, py); }
    else if (C === "H") push(n() + ox, y);
    else if (C === "V") push(x, n() + oy);
    else if (C === "C") { const a = [n() + ox, n() + oy], b = [n() + ox, n() + oy], e = [n() + ox, n() + oy]; bez([[x, y], a, b, e]); cx = b[0]; cy = b[1]; }
    else if (C === "S") { const a = [2 * x - cx, 2 * y - cy], b = [n() + ox, n() + oy], e = [n() + ox, n() + oy]; bez([[x, y], a, b, e]); cx = b[0]; cy = b[1]; }
    else if (C === "Q") { const a = [n() + ox, n() + oy], e = [n() + ox, n() + oy]; bez([[x, y], a, e]); cx = a[0]; cy = a[1]; }
    else if (C === "T") { const a = [2 * x - cx, 2 * y - cy], e = [n() + ox, n() + oy]; bez([[x, y], a, e]); cx = a[0]; cy = a[1]; }
    else if (C === "A") { i += 5; push(n() + ox, n() + oy); }
    else if (C === "Z") { push(sx, sy); }
    else i++;
    if (!"CSQT".includes(C)) { cx = x; cy = y; }
  }
  for (const r of runs) out.push(r);
  return out;
}

// ── Label placement ──
// Spots around a preferred box, nearest first: straight up and down before sideways, so a label
// slides off its own line instead of drifting away from what it names.
export function around(box, step, rings = 8) {
  const c = [{ x: box.x, y: box.y }];
  for (let r = 1; r <= rings; r++) {
    const d = r * step;
    c.push({ x: box.x, y: box.y - d }, { x: box.x, y: box.y + d });
    if (r <= rings / 2) c.push({ x: box.x - d * 1.5, y: box.y }, { x: box.x + d * 1.5, y: box.y }, { x: box.x - d, y: box.y - d }, { x: box.x + d, y: box.y - d }, { x: box.x - d, y: box.y + d }, { x: box.x + d, y: box.y + d });
  }
  for (const f of [0.25, 0.5, 0.75, 1, 1.25]) for (const dy of [0, -2, 2, -4, 4]) for (const sx of [1, -1]) c.push({ x: box.x + sx * f * box.w, y: box.y + dy * step });
  return c;
}

// For each label ({ w, h, cands: [{x, y}] }, cands as box top-left), the first spot inside the
// bounds and clear of every line, mark and label placed before it. When none is clear it takes the
// least crowded one and says so (clear: false), so the caller can give it a halo.
export function placeLabels(labels, { lines = [], boxes = [], bounds = null, pad = GAP } = {}) {
  const placed = [];
  return labels.map((l) => {
    let best = null, bestScore = Infinity;
    l.cands.forEach((c, i) => {
      if (bestScore < 1) return;
      const b = { x: c.x, y: c.y, w: l.w, h: l.h };
      let score = i * 0.001;
      if (bounds && !inside(b, bounds)) score += 1000;
      for (const p of lines) if (polylineHitsBox(p, b, pad)) score += 10;
      for (const o of boxes) if (overlaps(o, b, pad * 0.75)) score += 10;
      for (const o of placed) if (overlaps(o, b, pad / 2)) score += 20;
      if (score < bestScore) { best = b; bestScore = score; }
    });
    placed.push(best);
    return { ...best, clear: bestScore < 1 };
  });
}

// Spots for a label naming a line, from its last point: past the end if there is room, then just
// above and below the end (the text ending at the point), then further back along the line.
export function lineEndSpots(pts, w, h, gap = GAP + 2) {
  const [ex, ey] = pts[pts.length - 1];
  const spots = [{ x: ex + gap, y: ey - h / 2 }, { x: ex - w, y: ey - h - gap }, { x: ex - w, y: ey + gap }];
  for (const f of [0.85, 0.7, 0.55, 0.4]) {
    const [px, py] = pts[Math.max(0, Math.round((pts.length - 1) * f))];
    spots.push({ x: px - w / 2, y: py - h - gap }, { x: px - w / 2, y: py + gap });
  }
  return spots;
}

// ── Arrows ──
// The one arrowhead: markers id (muted) and id + "a" (accent), for static and browser-drawn figures.
export const marker = (id) =>
  `<defs><marker id="${id}" viewBox="0 0 9 9" refX="7" refY="4.5" markerWidth="6" markerHeight="6" orient="auto">
     <path class="d-arrowhead" d="M0 0l9 4.5L0 9z"/></marker>
   <marker id="${id}a" viewBox="0 0 9 9" refX="7" refY="4.5" markerWidth="6" markerHeight="6" orient="auto">
     <path class="d-arrowhead-acc" d="M0 0l9 4.5L0 9z"/></marker></defs>`;

// A straight or bent arrow from a to b, trimmed by `trim` at both ends (to stop at a box edge), with
// the point and outward normal where its label goes: the label sits on the convex side, `gap` away.
export function arrow([x1, y1], [x2, y2], { bend = 0, trim = 0 } = {}) {
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
  const ax = x1 + ux * trim, ay = y1 + uy * trim, bx = x2 - ux * trim, by = y2 - uy * trim;
  const nx = uy, ny = -ux;
  const mx = (ax + bx) / 2 + nx * bend, my = (ay + by) / 2 + ny * bend;
  const r = (v) => Math.round(v * 10) / 10;
  const d = bend ? `M${r(ax)} ${r(ay)}Q${r(2 * mx - (ax + bx) / 2)} ${r(2 * my - (ay + by) / 2)} ${r(bx)} ${r(by)}` : `M${r(ax)} ${r(ay)}L${r(bx)} ${r(by)}`;
  const side = bend < 0 ? -1 : 1;
  return { d, mid: [mx, my], normal: [nx * side, ny * side] };
}

// Where to put a label of size w×h next to an arrow's midpoint, on its outer side.
export function arrowLabelAt(a, w, h, gap = 8) {
  const [mx, my] = a.mid, [nx, ny] = a.normal;
  const cx = mx + nx * (gap + Math.abs(nx) * w / 2 + Math.abs(ny) * h / 2);
  const cy = my + ny * (gap + Math.abs(nx) * w / 2 + Math.abs(ny) * h / 2);
  return { x: cx, y: cy + h * 0.35, box: { x: cx - w / 2, y: cy - h / 2, w, h } };
}

// ── Stat tiles ──
const UNIT = /^(%|×|x|k|M|B|T|mil M|ms|s|min|h|d|KB|MB|GB|TB|años|years?|u|pts?|bps|pb|USD|S\/)$/;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// "500.000 filas" → value 500.000, unit filas; "5 (tabla + 4 índices)" → 5 and a sub-line;
// "20 niveles del árbol" → 20 and "niveles del árbol" under it. Words without a number stay whole.
export function splitValue(text) {
  const s = String(text ?? "").trim();
  const par = s.match(/^([^()]{1,20}?)\s+\((.+)\)$/);
  if (par) return { ...splitValue(par[1]), sub: par[2].replace(/\)\s*\(/g, " · ") };
  const colon = s.match(/^([^:()·]{1,24}?)(?::\s+|\s+·\s+)(.+)$/);
  if (colon) return { ...splitValue(colon[1]), sub: colon[2] };
  const m = s.match(/^([≈~<>≥≤+−-]?\s?(?:[$€£]|S\/\s?)?[−-]?\d[\d.,  ]*(?:\s?×\s?10[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+)?(?:\s?(?:%|×|x|k|M|B|T|ms|s|h|d|KB|MB|GB|TB|mil M))?)(?:\s+(.*))?$/);
  if (!m || !m[2]) return { v: s, unit: "", sub: "" };
  const rest = m[2].trim();
  if (!/^\p{L}/u.test(rest)) return { v: s, unit: "", sub: "" };
  if (UNIT.test(rest) || (rest.length <= 9 && !/\s/.test(rest))) return { v: m[1].trim(), unit: rest, sub: "" };
  return { v: m[1].trim(), unit: "", sub: rest };
}

const statInner = (value, sub) => {
  const p = typeof value === "object" && value ? value : splitValue(value);
  const extra = sub ?? p.sub ?? "";
  const isNum = /^[≈~<>≥≤+−-]?\s?(?:[$€£]|S\/\s?)?[−-]?\d/.test(p.v);
  return `<span class="stat-v${isNum ? "" : " stat-word"}"><span class="stat-n">${esc(p.v)}</span>${p.unit ? ` <small>${esc(p.unit)}</small>` : ""}</span><span class="stat-sub">${esc(extra)}</span>`;
};

export const stat = ({ k, v, sub, tone, tip }) =>
  `<div class="stat${tone ? " " + tone : ""}"><span class="stat-k" title="${esc(tip || k)}">${esc(k)}</span>${statInner(v, sub)}</div>`;
export const statRow = (list) => `<div class="stat-row">${list.map(stat).join("")}</div>`;

// Updates one tile in place (value, and the sub-line when given).
export function setStat(el, value, sub) {
  const k = el.querySelector(".stat-k");
  el.innerHTML = "";
  el.appendChild(k);
  el.insertAdjacentHTML("beforeend", statInner(value, sub));
}

// ── Browser: labels that keep clear of lines ──
// Every text matching `sel` inside the svg is moved, by the smallest step, off any line, mark or
// other text it touches, and wears a halo; runs again whenever the chart is redrawn or resized.
const MOVABLE = ".ch-lab, .curvelab, .marklab, .barval";
const LINES = "path, line, polyline";
const MARKS = "circle, rect.bar, rect.ch-mark";

function shown(el) {
  for (let n = el; n && n.nodeType === 1; n = n.parentNode) {
    const cs = getComputedStyle(n);
    if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) < 0.05) return false;
    if (n.tagName === "svg") break;
  }
  return true;
}

export function layoutSvg(svg, sel = MOVABLE) {
  if (!svg.isConnected || !svg.getScreenCTM() || !svg.getBoundingClientRect().width) return false;
  const inv = svg.getScreenCTM().inverse();
  const local = (el) => inv.multiply(el.getScreenCTM());
  const boxOf = (el) => {
    const b = el.getBBox(), m = movable.includes(el) ? local(el.parentNode) : local(el);
    const p = [new DOMPoint(b.x, b.y), new DOMPoint(b.x + b.width, b.y + b.height)].map((q) => q.matrixTransform(m));
    return { x: Math.min(p[0].x, p[1].x), y: Math.min(p[0].y, p[1].y), w: Math.abs(p[1].x - p[0].x), h: Math.abs(p[1].y - p[0].y) };
  };
  const vb = svg.viewBox.baseVal;
  const bounds = { x: vb.x - 2, y: vb.y - 2, w: vb.width + 4, h: vb.height + 4 };
  const movable = [...svg.querySelectorAll(sel)].filter((t) => t.tagName === "text" && t.textContent.trim() && (!t.hasAttribute("transform") || t.dataset.chMoved));
  for (const t of movable) t.classList.add(HALO);
  const live = movable.filter(shown);
  const lines = [];
  for (const p of svg.querySelectorAll(LINES)) {
    if (p.closest("defs, marker") || p.closest(sel) || /\b(grid|ch-grid)\b/.test(p.getAttribute("class") || "") || !shown(p)) continue;
    const cs = getComputedStyle(p);
    if (cs.stroke === "none" || !(parseFloat(cs.strokeWidth) > 0) || Number(cs.strokeOpacity) < 0.1) continue;
    let len = 0;
    try { len = p.getTotalLength(); } catch { continue; }
    if (!len) continue;
    const m = local(p), n = Math.min(200, Math.max(8, Math.ceil(len / 3))), run = [];
    for (let k = 0; k <= n; k++) { const q = p.getPointAtLength((len * k) / n); const r = new DOMPoint(q.x, q.y).matrixTransform(m); run.push([r.x, r.y]); }
    lines.push(run);
  }
  const fixed = [...svg.querySelectorAll("text")].filter((t) => !movable.includes(t) && t.textContent.trim() && shown(t)).map(boxOf);
  const marks = [...svg.querySelectorAll(MARKS)].filter(shown).map(boxOf).filter((b) => b.w * b.h < (vb.width * vb.height) / 6);
  const boxes = live.map(boxOf);
  const res = placeLabels(boxes.map((b) => ({ w: b.w, h: b.h, cands: around(b, Math.max(3, b.h * 0.4), 16) })), { lines, boxes: [...fixed, ...marks], bounds });
  res.forEach((r, i) => {
    const dx = r.x - boxes[i].x, dy = r.y - boxes[i].y;
    const tr = `translate(${dx.toFixed(1)} ${dy.toFixed(1)})`;
    if (Math.abs(dx) + Math.abs(dy) < 0.05) { live[i].removeAttribute("transform"); delete live[i].dataset.chMoved; }
    else if (live[i].getAttribute("transform") !== tr) { live[i].setAttribute("transform", tr); live[i].dataset.chMoved = "1"; }
  });
  return true;
}

// Keeps a chart's labels placed: after every redraw (children or geometry change) and resize.
export function keepLabelsClear(svg, sel = MOVABLE) {
  if (typeof MutationObserver === "undefined") return;
  let queued = false, tries = 0, settle = 0;
  const scale = () => {
    const w = svg.getBoundingClientRect().width, vb = svg.viewBox.baseVal;
    if (w > 0 && vb && vb.width) svg.style.setProperty("--ch-k", (vb.width / w).toFixed(3));
  };
  const run = () => {
    scale();
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const done = layoutSvg(svg, sel);
      mo.takeRecords();
      if (!done && tries++ < 40) setTimeout(run, 150);
      else if (done) {
        tries = 0;
        clearTimeout(settle);
        settle = setTimeout(() => { layoutSvg(svg, sel); mo.takeRecords(); }, 600);
      }
    });
  };
  const mo = new MutationObserver(run);
  mo.observe(svg, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["d", "x", "y", "cx", "cy", "x1", "x2", "y1", "y2", "points", "width", "height", "viewBox"] });
  if (typeof ResizeObserver !== "undefined") new ResizeObserver(run).observe(svg);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(run);
}

// A slider's value kept short: "4 índices → 5 escrituras por INSERT" shows "4 índices" and moves
// the rest to the line under the track.
export function splitControl(text) {
  const s = String(text ?? "");
  const m = s.match(/^(.+?)\s+(?:→|·|—|\()\s*(.+?)\)?$/);
  return m && m[1].length <= 22 ? { v: m[1], sub: m[2] } : { v: s, sub: "" };
}

// A slider row ({ label, min, max, step, value, fmt, sub, onInput }) → { el, input, get, set }.
export function range(o) {
  const el = document.createElement("label");
  el.className = "rng";
  el.innerHTML = `<span class="rng-k"></span><output class="rng-v"></output><input type="range"><span class="rng-sub"></span>`;
  const [k, out, input, sub] = el.children;
  k.textContent = o.label;
  Object.assign(input, { min: o.min, max: o.max, step: o.step || 1, value: o.value });
  input.setAttribute("aria-label", o.label);
  const show = (v) => {
    const p = splitControl(o.fmt ? o.fmt(v) : v);
    out.textContent = p.v;
    sub.textContent = o.sub ? o.sub(v) : p.sub;
    input.setAttribute("aria-valuetext", p.sub ? `${p.v} (${p.sub})` : p.v);
  };
  input.addEventListener("input", () => { show(Number(input.value)); o.onInput && o.onInput(Number(input.value)); });
  show(o.value);
  return { el, input, get: () => Number(input.value), set: (v) => { input.value = v; show(v); } };
}
