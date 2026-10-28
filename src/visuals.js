// Visual blocks a session can embed: a pixel-art scene, a detective board for a case, a stepped
// concept animation that traces real code, and a figure (input → output, receipts, cells, grids).
// Content format: docs/visuals.md.
import { Player, robot as robotSprite, palette } from "./world/render.js";
import { World } from "./world/engine.js";
import { format } from "./runner/harness.js";
import { icon } from "../platform/web/core/dom.js";
import { md as rich } from "../platform/web/core/inline.js";
import { highlightLines } from "../platform/web/core/highlight.js";
import * as P from "../platform/web/core/progress.js";
import { SQL_VISUALS, mountSqlVisual } from "./sql/visuals.js";
import { marker, markerId, rope } from "./arrows.js";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const done = (id) => { try { return !!P.passed(id); } catch (_) { return false; } };
const ICON = {
  play: icon("play"),
  pause: icon("pause"),
  next: icon("chevron-right"),
  prev: icon("chevron-left"),
  restart: icon("rotate-ccw"),
};

export function mountVisual(host, kind, spec, ctx) {
  const fig = document.createElement("figure");
  fig.className = `vis vis-${kind}`;
  host.replaceWith(fig);
  if (kind === "scene") scene(fig, spec, ctx);
  else if (kind === "board") board(fig, spec, ctx);
  else if (kind === "anim") anim(fig, spec, ctx);
  else if (kind === "figure") figure(fig, spec, ctx);
  else if (kind === "network") network(fig, spec, ctx);
  else if (kind === "scope") scope(fig, spec, ctx);
  else if (SQL_VISUALS.includes(kind)) mountSqlVisual(fig, kind, spec, ctx);
  if (spec.caption) fig.insertAdjacentHTML("beforeend", `<figcaption>${rich(spec.caption)}</figcaption>`);
  return fig;
}

// An exercise's `visual:` key: { board | figure | scene | anim: spec }, or a list of them.
export function mountExerciseVisual(host, visual, ctx) {
  for (const v of [].concat(visual)) {
    const kind = Object.keys(v).find((k) => ["board", "figure", "scene", "anim", "network", "scope", ...SQL_VISUALS].includes(k));
    if (!kind) continue;
    const slot = document.createElement("div");
    host.append(slot);
    mountVisual(slot, kind, { ...v[kind], caption: v.caption ?? v[kind].caption }, ctx);
  }
}

// ── Scene ───────────────────────────────────────────────────────────────
function scene(fig, spec, ctx) {
  const box = document.createElement("div");
  fig.append(box);
  const t = ctx.t;
  const player = new Player(box, spec, {
    aria: spec.alt || t("player.aria"), play: t("player.play"), pause: t("player.pause"), restart: t("player.restart"),
    speed: t("player.speed"), step: t("player.step"), battery: t("player.battery"), ready: t("player.ready"), cargo: t("player.cargo"),
  });
  if (spec.program) {
    // A Python scene was played at build time (spec.frames); a JavaScript one plays here.
    let frames = spec.frames;
    if (!frames) {
      const w = new World(spec, ctx.lang);
      try {
        new Function("robot", `"use strict";\n${spec.program}`)(w.api());
      } catch (_) {}
      frames = w.frames;
    }
    const w = { frames };
    const go = () => (reduce() ? (player.frames = w.frames, player.i = w.frames.length - 1, player.paint(1)) : player.load(w.frames));
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); go(); } }, { threshold: 0.4 });
    io.observe(box);
    player.host.querySelector('[data-a="play"]').disabled = false;
    player.host.querySelector('[data-a="restart"]').disabled = false;
    player.frames = w.frames;
  }
}

// ── Portraits ───────────────────────────────────────────────────────────
const hashStr = (s) => [...String(s)].reduce((h, c) => (Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0), 2166136261);
const SKIN = ["#f1c9a5", "#d9a77c", "#b97d52", "#8d5a3b", "#e8b98f"];
const HAIR = ["#2a1d17", "#4a3122", "#151515", "#6b4a2b", "#8a8a8a", "#a1622c"];
const SHIRT = ["#c4553f", "#3f7cc4", "#4f9a6a", "#c49a3f", "#8a5cc4", "#c43f84", "#3fa7a7"];
const BOTS = ["#d9a441", "#6fa8dc", "#e07a5f", "#81b29a", "#b48ead", "#f2cc8f"];

export function portrait(kind, name, color, size = 56) {
  const c = document.createElement("canvas");
  const dpr = window.devicePixelRatio || 1;
  c.width = c.height = 16;
  c.style.width = c.style.height = size + "px";
  c.className = "portrait";
  c.setAttribute("aria-hidden", "true");
  const g = c.getContext("2d");
  const h = hashStr(name);
  if (kind === "note") {
    const p = (x, y, w, hh, col) => { g.fillStyle = col; g.fillRect(x, y, w, hh); };
    p(3, 1, 10, 14, "#f4efe2"); p(10, 1, 3, 3, "#d9d0bb"); p(3, 15, 10, 1, "#c9bfa8");
    for (const y of [5, 7, 9, 11]) p(5, y, y === 11 ? 4 : 6, 1, color || "#8a7f6a");
  } else if (kind === "robot") {
    const P = { ...palette(document.body), robot: color || BOTS[h % BOTS.length] };
    g.drawImage(robotSprite(P, "S", 1 + (h % 4), false, 0, true), 0, 0);
  } else {
    const p = (x, y, w, hh, col) => { g.fillStyle = col; g.fillRect(x, y, w, hh); };
    const skin = SKIN[h % SKIN.length], hair = HAIR[(h >> 3) % HAIR.length], shirt = color || SHIRT[(h >> 6) % SHIRT.length];
    const long = (h >> 9) % 2;
    p(4, 1, 8, 3, hair); p(3, 2, 1, long ? 9 : 4, hair); p(12, 2, 1, long ? 9 : 4, hair);
    p(4, 4, 8, 7, skin); p(4, 4, 8, 1, hair);
    p(6, 6, 1, 1, "#1d1714"); p(9, 6, 1, 1, "#1d1714"); p(7, 9, 2, 1, "#9c4a3a");
    p(6, 11, 4, 1, skin);
    p(2, 12, 12, 4, shirt); p(2, 12, 12, 1, "rgba(255,255,255,.25)");
    if ((h >> 12) % 3 === 0) { p(5, 6, 3, 1, "rgba(0,0,0,.55)"); p(8, 6, 3, 1, "rgba(0,0,0,.55)"); }
  }
  c.dataset.dpr = dpr;
  return c;
}

// ── Board ───────────────────────────────────────────────────────────────
function board(fig, spec, ctx) {
  const t = ctx.t;
  const cards = spec.cards || [];
  fig.innerHTML = `${spec.title ? `<p class="vis-k">${rich(spec.title)}</p>` : ""}
    ${spec.task ? `<p class="board-task">${rich(spec.task)}</p>` : ""}
    <div class="board">${cards.map((c, i) => `<article class="bcard" data-i="${i}" style="--tilt:${((hashStr(c.name) % 5) - 2) * 0.6}deg">
        <span class="pin" aria-hidden="true"></span>
        <header><span class="ph" data-p="${i}"></span><div><h4>${esc(c.name)}</h4>${c.role ? `<p>${rich(c.role)}</p>` : ""}</div>
          ${c.with ? `<span class="bwith" aria-label="${esc(c.with.label || "")}"><span class="arrow" aria-hidden="true">→</span><span class="ph" data-w="${i}"></span><span>${esc(c.with.name)}</span></span>` : ""}
        </header>
        ${c.rows ? `<dl>${c.rows.map(([k, v]) => `<dt>${rich(k)}</dt><dd>${rich(v)}</dd>`).join("")}</dl>` : ""}
        ${c.clue ? `<p class="bclue" aria-live="polite"><span>${esc(t("vis.clueWait"))}</span></p>` : ""}
      </article>`).join("")}</div>`;
  cards.forEach((c, i) => {
    fig.querySelector(`[data-p="${i}"]`).append(portrait(c.kind || "person", c.name, c.color));
    if (c.with) fig.querySelector(`[data-w="${i}"]`).append(portrait(c.with.kind || "person", c.with.name, c.with.color, 32));
  });
  if (!spec.for) return;
  const num = (s) => { const m = String(s).match(/-?\d+(?:[.,]\d+)?/g); return m ? Number(m[m.length - 1].replace(",", ".")) : null; };
  document.addEventListener("taller:run", (e) => {
    if (e.detail.id !== spec.for || !fig.isConnected) return;
    cards.forEach((c, i) => {
      if (!c.clue) return;
      const el = fig.querySelector(`[data-i="${i}"]`);
      const line = e.detail.logs.find((l) => l.includes(c.clue.find));
      const p = el.querySelector(".bclue");
      el.classList.remove("hit", "miss");
      if (!line) { p.innerHTML = `<span>${esc(t("vis.clueNone", { name: c.clue.find }))}</span>`; return; }
      const got = num(line.slice(line.indexOf(c.clue.find) + c.clue.find.length));
      const says = c.clue.says === undefined ? null : Number(c.clue.says);
      if (says === null || got === null) { p.innerHTML = `<span>${esc(line)}</span>`; return; }
      const ok = Math.abs(got - says) < 1e-9;
      el.classList.add(ok ? "hit" : "miss");
      p.innerHTML = `<span>${esc(t("vis.clueGot", { got: format(got), says: format(says), label: c.clue.saysLabel || t("vis.reported") }))}</span><b>${esc(ok ? t("vis.match") : t("vis.contradict"))}</b>`;
    });
  });
  document.addEventListener("taller:answer", (e) => {
    if (e.detail.id !== spec.for || !e.detail.ok || !fig.isConnected) return;
    cards.forEach((c, i) => { if (c.culprit) fig.querySelector(`[data-i="${i}"]`).classList.add("culprit"); });
  });
}

// ── Figure ──────────────────────────────────────────────────────────────
function pane(p, t) {
  if (!p) return "";
  const head = p.label ? `<p class="pane-k">${rich(p.label)}</p>` : "";
  if (p.receipt) {
    const r = p.receipt;
    return `${head}<div class="receipt">${r.title ? `<p class="rc-t">${rich(r.title)}</p>` : ""}
      <table>${(r.rows || []).map((row) => `<tr>${row.map((c, j) => `<td class="${j === row.length - 1 ? "num" : ""}">${rich(c)}</td>`).join("")}</tr>`).join("")}</table>
      ${r.total !== undefined ? `<p class="rc-total"><span>${rich(r.totalLabel || "Total")}</span><b>${rich(r.total)}</b></p>` : ""}</div>`;
  }
  if (p.cells) {
    const hi = new Set([].concat(p.highlight ?? []));
    return `${head}<div class="cells">${p.cells.map((c, i) => `<span class="cell${hi.has(i) ? " on" : ""}"><b>${rich(format(c))}</b>${p.index === false ? "" : `<i>${i}</i>`}</span>`).join("")}</div>`;
  }
  if (p.grid) {
    const marks = new Set(p.marks || []);
    const path = new Set(p.path || []);
    const labels = p.labels || {};
    return `${head}<div class="grid" style="--cols:${p.grid[0].length}">${p.grid.map((row, y) => [...row].map((ch, x) => {
      const k = `${x},${y}`;
      return `<span class="g${ch === "#" ? " wall" : ""}${marks.has(k) ? " mark" : ""}${path.has(k) ? " path" : ""}">${ch === "#" || ch === "." ? "" : esc(ch)}${labels[k] ? `<sup>${esc(labels[k])}</sup>` : ""}</span>`;
    }).join("")).join("")}</div>`;
  }
  if (p.table) {
    return `${head}<div class="tablewrap"><table class="vt">${p.table.head ? `<thead><tr>${p.table.head.map((h) => `<th>${rich(h)}</th>`).join("")}</tr></thead>` : ""}
      <tbody>${p.table.rows.map((r, i) => { const lock = p.table.by && p.table.by[i] && !done(p.table.by[i]); return `<tr${lock ? ' class="pending"' : ""}>${r.map((c) => `<td>${lock ? "?" : rich(c)}</td>`).join("")}</tr>`; }).join("")}</tbody></table></div>`;
  }
  if (p.timeline) {
    const lock = (e) => e.by && !done(e.by);
    return `${head}<div class="tlwrap"><ol class="tl${p.timeline.length <= 6 ? " row" : ""}">${p.timeline.map((e) => lock(e)
      ? `<li class="pending"><time>?</time><b>${esc(t ? t("case.pending") : "?")}</b></li>`
      : `<li${e.now ? ' class="now"' : ""}><time>${rich(e.when)}</time><b>${rich(e.title)}</b>${e.text ? `<span>${rich(e.text)}</span>` : ""}</li>`).join("")}</ol></div>`;
  }
  if (p.lanes) return `${head}${lanes(p.lanes, t)}`;
  if (p.cards) return `${head}<div class="minicards">${p.cards.map((c) => `<div class="mc"><b>${rich(c.title)}</b>${(c.rows || []).map(([k, v]) => `<span><i>${rich(k)}</i> ${rich(v)}</span>`).join("")}</div>`).join("")}</div>`;
  if (p.form) {
    const f = p.form;
    return `${head}<div class="vform${f.message ? " err" : ""}">${f.title ? `<p class="vform-t">${rich(f.title)}</p>` : ""}${(f.fields || []).map(([k, v]) => `<label><span>${rich(k)}</span><i class="${v ? "" : "empty"}">${rich(v || "")}</i></label>`).join("")}
      ${f.message ? `<p class="vform-msg">${rich(f.message)}</p>` : ""}${f.button ? `<b class="vform-b">${rich(f.button)}</b>` : ""}</div>`;
  }
  if (p.text !== undefined) return `${head}<pre class="pane-text">${esc(p.text)}</pre>`;
  if (p.value !== undefined) return `${head}<p class="pane-value">${rich(p.value)}</p>`;
  return head;
}

// Parallel lanes: rows are people or devices, the horizontal axis is time. Times are "HH:MM" or "HH:MM:SS";
// one before the axis start counts as the next day (a night that crosses midnight).
const clock = (v) => { const m = String(v).match(/^(\d+):(\d{2})(?::(\d{2}))?$/); return m ? Number(m[1]) * 60 + Number(m[2]) + (m[3] ? Number(m[3]) / 60 : 0) : Number(v); };
const hhmm = (x) => { const m = Math.round(x) % 1440; return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };
function lanes(l, t) {
  const from = clock(l.from);
  const at = (v) => { const x = clock(v); return x < from ? x + 1440 : x; };
  const span = at(l.to) - from || 1;
  const pct = (v) => Math.max(0, Math.min(100, ((at(v) - from) / span) * 100));
  const shown = (e) => !e.by || done(e.by);
  const step = l.tick || [5, 10, 15, 20, 30, 60, 120, 180].find((n) => span / n <= 7) || 240;
  const ticks = [];
  for (let x = Math.ceil(from / step) * step; x <= from + span + 1e-6; x += step) ticks.push(x);
  const rows = l.rows || [];
  const off = (l.bands || []).some((b) => b.label) ? 1 : 0;
  const over = `<div class="ln-over" style="grid-row:1 / span ${rows.length + off}" aria-hidden="true">${(l.bands || []).filter(shown).map((b) => `<span class="ln-band" style="left:${pct(b.from)}%;width:${pct(b.to) - pct(b.from)}%"><i>${rich(b.label || "")}</i></span>`).join("")}${ticks.map((x) => `<span class="ln-grid" style="left:${((x - from) / span) * 100}%"></span>`).join("")}</div>`;
  const body = rows.map((r, i) => {
    const bars = (r.bars || []).filter(shown).map((b) => `<span class="ln-bar ${b.kind || "fact"}" style="left:${pct(b.from)}%;width:${Math.max(pct(b.to) - pct(b.from), 0.6)}%" title="${esc(`${b.from}-${b.to}`)}"><i>${rich(b.label || "")}</i></span>`).join("");
    const evs = (r.events || []).filter(shown).map((e) => `<span class="ln-ev ${e.kind || "fact"}${(e.side ? e.side === "left" : pct(e.at) > 62) ? " flip" : ""}" style="left:${pct(e.at)}%" title="${esc(e.at)}"><b></b><i>${rich(e.label || "")}</i></span>`).join("");
    return `<span class="ln-lab" style="grid-row:${i + 1 + off}">${rich(r.label)}${r.sub ? `<small>${rich(r.sub)}</small>` : ""}</span><div class="ln-track${bars || evs ? "" : " wait"}" style="grid-row:${i + 1 + off}">${bars}${evs}${bars || evs ? "" : `<i class="ln-wait">${esc(t ? t("case.pending") : "?")}</i>`}</div>`;
  }).join("");
  const mobile = rows.map((r) => {
    const bars = (r.bars || []).filter(shown).map((b) => ({ x: at(b.from), kind: b.kind || "fact", when: `${b.from}–${b.to}`, label: b.label, bar: `<span class="ln-bar ${b.kind || "fact"}" style="left:${pct(b.from)}%;width:${Math.max(pct(b.to) - pct(b.from), 0.6)}%"></span>` }));
    const evs = (r.events || []).filter(shown).map((e) => ({ x: at(e.at), kind: e.kind || "fact", when: e.at, label: e.label, bar: `<span class="ln-ev ${e.kind || "fact"}" style="left:${pct(e.at)}%"><b></b></span>`, ev: true }));
    const list = [...bars, ...evs].sort((p, q) => p.x - q.x);
    if (!list.length) return `<section class="ln-m-row wait"><p class="ln-m-h">${rich(r.label)}${r.sub ? `<small>${rich(r.sub)}</small>` : ""}</p><p class="ln-wait">${esc(t ? t("case.pending") : "?")}</p></section>`;
    return `<section class="ln-m-row"><p class="ln-m-h">${rich(r.label)}${r.sub ? `<small>${rich(r.sub)}</small>` : ""}</p>
      <div class="ln-m-ticks" aria-hidden="true">${ticks.map((x) => `<span style="left:${((x - from) / span) * 100}%">${hhmm(x)}</span>`).join("")}</div>
      <div class="ln-m-track" aria-hidden="true">${(l.bands || []).filter(shown).map((bd) => `<span class="ln-band" style="left:${pct(bd.from)}%;width:${pct(bd.to) - pct(bd.from)}%"></span>`).join("")}${ticks.map((x) => `<span class="ln-grid" style="left:${((x - from) / span) * 100}%"></span>`).join("")}${list.map((i) => i.bar).join("")}</div>
      ${list.length ? `<ol class="ln-m-list">${list.map((i) => `<li><span class="ln-sw ${i.ev ? "ev" : "bar"} ${i.kind}"></span><time>${esc(i.when)}</time> ${rich(i.label || "")}</li>`).join("")}</ol>` : ""}</section>`;
  }).join("");
  const bandNote = (l.bands || []).filter(shown).filter((b) => b.label).map((b) => `<p class="ln-m-band"><span class="ln-sw band"></span><b>${rich(b.label)}</b> <time>${esc(b.from)}–${esc(b.to)}</time></p>`).join("");
  return `<div class="lanes"><div class="ln-in"><div class="ln-axis"><span></span><div class="ln-ticks">${ticks.map((x) => `<span style="left:${((x - from) / span) * 100}%">${hhmm(x)}</span>`).join("")}</div></div><div class="ln-rows">${over}${off ? '<span class="ln-spacer"></span>' : ""}${body}</div></div><div class="ln-m">${bandNote}${mobile}</div></div>`;
}

function figure(fig, spec, ctx) {
  const t = ctx && ctx.t;
  const paint = () => paintFigure(fig, spec, t);
  paint();
  if (JSON.stringify(spec).includes('"by"')) document.addEventListener("sql:progress", () => fig.isConnected && paint());
}

function paintFigure(fig, spec, t) {
  if (spec.input || spec.output) {
    fig.innerHTML = `${spec.title ? `<p class="vis-k">${rich(spec.title)}</p>` : ""}<div class="io">
      <div class="io-in">${pane(spec.input, t)}</div>
      <div class="io-arrow" aria-hidden="true"><span>${rich(spec.arrow || "")}</span><svg viewBox="0 0 40 20"><path d="M2 10h34M28 3l8 7-8 7"/></svg></div>
      <div class="io-out">${pane(spec.output, t)}</div></div>
      ${spec.steps ? `<ol class="io-steps">${spec.steps.map((s) => `<li>${rich(s)}</li>`).join("")}</ol>` : ""}`;
    return;
  }
  fig.innerHTML = `${spec.title ? `<p class="vis-k">${rich(spec.title)}</p>` : ""}<div class="panes">${(spec.panes || [spec]).map((p) => `<div>${pane(p, t)}</div>`).join("")}</div>`;
}

// ── Animation: traces a snippet line by line, or plays the steps it is given ────────
const DECL = /(?:\b(?:let|const|var)\s+(?:\{([^}]*)\}|\[([^\]]*)\]|([A-Za-z_$][\w$]*)))|(?:function\s+[\w$]+\s*\(([^)]*)\))|(?:for\s*\(\s*(?:const|let)\s+([A-Za-z_$][\w$]*)\s+of)/g;
function declared(code) {
  const names = new Set();
  for (const m of code.matchAll(DECL)) for (const part of [m[1], m[2], m[3], m[4], m[5]]) {
    if (!part) continue;
    for (const n of part.split(",")) { const id = n.trim().split(/[=:\s]/)[0].replace(/^\.\.\./, ""); if (/^[A-Za-z_$][\w$]*$/.test(id)) names.add(id); }
  }
  return [...names];
}

// Names and the objects they point at. An object keeps its id across steps, so two names for one
// array stay one box with two arrows.
function heapper() {
  const ids = new Map();
  return (vals) => {
    const heap = {}, refs = {};
    const idOf = (o) => { if (!ids.has(o)) ids.set(o, `o${ids.size + 1}`); return ids.get(o); };
    const cell = (v, d) => (v && typeof v === "object" && d < 5 ? { r: reg(v, d) } : { p: format(v, true) });
    const reg = (o, d) => {
      const id = idOf(o);
      if (heap[id]) return id;
      heap[id] = { k: "list", items: [] };
      if (Array.isArray(o)) heap[id] = { k: "list", items: o.map((x) => [null, cell(x, d + 1)]) };
      else if (o instanceof Set) heap[id] = { k: "set", items: [...o].map((x) => [null, cell(x, d + 1)]) };
      else if (o instanceof Map) heap[id] = { k: "dict", items: [...o].map(([a, b]) => [format(a, true), cell(b, d + 1)]) };
      else heap[id] = { k: "obj", ...(o.constructor && o.constructor.name !== "Object" ? { cls: o.constructor.name } : {}), items: Object.keys(o).map((key) => [key, cell(o[key], d + 1)]) };
      return id;
    };
    for (const [k, v] of Object.entries(vals)) refs[k] = cell(v, 0);
    return { refs, heap };
  };
}

export function trace(code, { maxSteps = 300, globals = {}, refs = false } = {}) {
  const lines = code.replace(/\n+$/, "").split("\n");
  const names = declared(code);
  const fnRe = /^\s*function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*\{\s*$/;
  const out = [];
  let depth = 0;
  const closers = new Map();
  const open = [];
  lines.forEach((l, i) => {
    const f = fnRe.exec(l);
    const opens = (l.replace(/(["'`])(?:\\.|(?!\1).)*\1/g, "").match(/\{/g) || []).length;
    const closes = (l.replace(/(["'`])(?:\\.|(?!\1).)*\1/g, "").match(/\}/g) || []).length;
    if (f) open.push({ depth, i });
    depth += opens - closes;
    if (open.length && depth === open[open.length - 1].depth && i !== open[open.length - 1].i) closers.set(i, open.pop());
  });
  const src = lines.map((l, i) => {
    const n = i + 1;
    const tr = l.trim();
    const f = fnRe.exec(l);
    if (f) return `${l} __enter(${JSON.stringify(f[1])}, [${f[2].split(",").map((p) => p.trim().split("=")[0]).filter(Boolean).map((p) => JSON.stringify(p)).join(",")}], [${f[2].split(",").map((p) => p.trim().split("=")[0]).filter(Boolean).join(",")}]); __s(${n}, (k) => eval(k));`;
    if (closers.has(i)) return `__leave(undefined); ${l}`;
    const ret = /^(\s*)return\b\s*(.*?);?\s*$/.exec(l);
    if (ret) return `${ret[1]}__s(${n}, (k) => eval(k)); return __leave(${ret[2] || "undefined"}, ${n});`;
    if (/[=(,:\[]\s*\{\s*$/.test(tr)) return l;
    if (/^(if|for|while)\s*\(/.test(tr) && /\{\s*$/.test(tr)) return `__s(${n}, (k) => eval(k)); ${l} __s(${n}, (k) => eval(k));`;
    if (/[;{]\s*$/.test(tr) && !/^\}/.test(tr) || /^\}\s*else\b.*\{\s*$/.test(tr)) return `${l} __s(${n}, (k) => eval(k));`;
    return l;
  }).join("\n");
  const steps = [];
  const logs = [];
  const stack = [];
  const heapOf = refs ? heapper() : null;
  const snap = (line, ev) => {
    if (steps.length >= maxSteps) throw new Error("__max");
    const vars = {}, raw = {};
    for (const k of names) { try { const v = ev(k); raw[k] = v; vars[k] = JSON.parse(JSON.stringify(v instanceof Set ? [...v] : v instanceof Map ? [...v] : v ?? null)); if (v === undefined) vars[k] = undefined; } catch (_) {} }
    steps.push({ line, vars, ...(heapOf ? heapOf(raw) : {}), out: logs.length, stack: stack.map((f) => ({ ...f })) });
  };
  const con = { log: (...a) => logs.push(a.map((x) => format(x)).join(" ")) };
  try {
    new Function("console", "__s", "__enter", "__leave", ...Object.keys(globals), `"use strict";\n${src}`)(
      con, snap,
      (name, params, args) => stack.push({ name, args: params.map((p, i) => `${p} = ${format(args[i], true)}`).join(", ") }),
      (v, line) => { const f = stack.pop(); if (f && steps.length) steps.push({ ...steps[steps.length - 1], ...(line ? { line } : {}), stack: [...stack.map((x) => ({ ...x })), { ...f, ret: format(v, true) }], out: logs.length }); return v; },
      ...Object.values(globals),
    );
  } catch (e) {
    if (e.message !== "__max") steps.push({ ...(steps[steps.length - 1] || { line: 0, vars: {}, stack: [] }), error: e.message, out: logs.length });
  }
  return { steps, logs, lines };
}

function anim(fig, spec, ctx) {
  const t = ctx.t;
  const traced = spec.steps ? null : trace(spec.code || "", { globals: spec.globals || {}, refs: !!spec.refs });
  const lines = String(spec.code || "").replace(/\n+$/, "").split("\n");
  const steps = spec.steps || traced.steps;
  // Python animations come traced from the build: steps plus the lines the snippet printed.
  const logs = traced ? traced.logs : spec.logs || [];
  const show = spec.show ? new Set(spec.show) : null;
  fig.innerHTML = `${spec.title ? `<p class="vis-k">${rich(spec.title)}</p>` : ""}
    <div class="anim${spec.refs ? " with-refs" : ""}">
      <ol class="anim-code">${highlightLines(lines.join("\n"), spec.py || ctx.track === "py" ? "python" : "js").map((l) => `<li><code>${l || " "}</code></li>`).join("")}</ol>
      <div class="anim-side">
        <div class="anim-vars" aria-label="${esc(t("vis.vars"))}"></div>
        <div class="anim-cells"></div>
        <div class="anim-grid"></div>
        <div class="anim-stack"></div>
        <div class="anim-out"><p class="pane-k">${esc(t("ex.console"))}</p><pre></pre></div>
        <p class="anim-note" aria-live="polite"></p>
      </div>
    </div>
    <div class="anim-bar">
      <button class="pbtn" data-a="restart" aria-label="${esc(t("player.restart"))}">${ICON.restart}</button>
      <button class="pbtn" data-a="prev" aria-label="${esc(t("vis.back"))}">${ICON.prev}</button>
      <button class="pbtn" data-a="play" aria-label="${esc(t("player.play"))}">${ICON.play}</button>
      <button class="pbtn" data-a="next" aria-label="${esc(t("vis.next"))}">${ICON.next}</button>
      <span class="pstat"></span>
    </div>`;
  const code = fig.querySelectorAll(".anim-code li");
  const varsEl = fig.querySelector(".anim-vars"), cellsEl = fig.querySelector(".anim-cells"), gridEl = fig.querySelector(".anim-grid");
  const stackEl = fig.querySelector(".anim-stack"), outEl = fig.querySelector(".anim-out pre"), note = fig.querySelector(".anim-note"), stat = fig.querySelector(".pstat");
  const visited = new Set();
  let i = 0, timer = null, prevVars = {};
  const paint = () => {
    const s = steps[i] || { vars: {}, stack: [] };
    visited.clear();
    for (let j = 0; j <= i; j++) if (steps[j] && steps[j].line) visited.add(steps[j].line);
    code.forEach((li, j) => { li.classList.toggle("now", s.line === j + 1); li.classList.toggle("seen", visited.has(j + 1) && s.line !== j + 1); });
    const vars = Object.entries(s.vars || {}).filter(([k]) => !show || show.has(k));
    if (spec.refs) drawRefs(varsEl, s, steps[i - 1], spec, t);
    else varsEl.innerHTML = vars.length ? vars.map(([k, v]) => `<span class="vbox${JSON.stringify(prevVars[k]) !== JSON.stringify(v) ? " changed" : ""}"><i>${esc(k)}</i><b>${esc(s.reprs && k in s.reprs ? s.reprs[k] : format(v, true))}</b></span>`).join("") : "";
    prevVars = s.vars || {};
    if (spec.cells) {
      const arr = s.vars && s.vars[spec.cells.of];
      const at = spec.cells.at ? s.vars && s.vars[spec.cells.at] : undefined;
      const atIdx = typeof at === "number" ? at : Array.isArray(arr) ? arr.indexOf(at) : -1;
      cellsEl.innerHTML = Array.isArray(arr) ? `<p class="pane-k">${esc(spec.cells.of)}</p><div class="cells">${arr.map((c, j) => `<span class="cell${j === atIdx ? " on" : ""}"><b>${esc(format(c, true))}</b><i>${j}</i></span>`).join("")}</div>` : "";
    }
    if (spec.grid) {
      const rows = spec.grid.map;
      // Cells come as "x,y" (JS), [x, y] (a Python tuple), {x, y}, or as the keys of a dict ("(x, y)" from Python).
      const cell = (p) => (Array.isArray(p) ? p.join(",") : p && typeof p === "object" ? `${p.x},${p.y}` : String(p).replace(/[()\s]/g, ""));
      const cellKeys = (v) => new Set((Array.isArray(v) ? v : v && typeof v === "object" ? Object.keys(v) : []).map(cell));
      const seen = cellKeys(s.vars && s.vars[spec.grid.visited]);
      const front = cellKeys(s.vars && s.vars[spec.grid.frontier]);
      gridEl.innerHTML = `<div class="grid" style="--cols:${rows[0].length}">${rows.map((row, y) => [...row].map((ch, x) => {
        const k = `${x},${y}`;
        return `<span class="g${ch === "#" ? " wall" : ""}${seen.has(k) ? " mark" : ""}${front.has(k) ? " front" : ""}">${ch === "#" || ch === "." ? "" : esc(ch)}</span>`;
      }).join("")).join("")}</div>`;
    }
    const st = s.stack || [];
    stackEl.innerHTML = st.length ? `<p class="pane-k">${esc(t("vis.stack"))}</p>${st.slice().reverse().map((f) => `<div class="frame${f.ret !== undefined ? " ret" : ""}${f.err ? " err" : ""}"><code>${esc(f.name)}(${esc(f.args || "")})</code>${f.ret !== undefined ? `<b>→ ${esc(f.ret)}</b>` : ""}${f.err ? `<b>${esc(f.err)}</b>` : ""}</div>`).join("")}` : "";
    const shown = spec.steps && !spec.py ? (s.out ?? "") : logs.slice(0, s.out).join("\n");
    outEl.textContent = shown || "";
    fig.querySelector(".anim-out").hidden = !shown;
    note.innerHTML = rich(s.note || s.error || (spec.notes && spec.notes[s.line]) || "");
    stat.textContent = t("vis.stepN", { i: i + 1, n: steps.length });
  };
  const playBtn = fig.querySelector('[data-a="play"]');
  const stop = () => { clearInterval(timer); timer = null; playBtn.innerHTML = ICON.play; playBtn.setAttribute("aria-label", t("player.play")); };
  const play = () => {
    if (i >= steps.length - 1) i = 0;
    playBtn.innerHTML = ICON.pause;
    playBtn.setAttribute("aria-label", t("player.pause"));
    timer = setInterval(() => { if (i >= steps.length - 1 || !fig.isConnected) return stop(); i++; paint(); }, spec.speed || 900);
  };
  fig.querySelector(".anim-bar").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const a = b.dataset.a;
    if (a === "play") return timer ? stop() : play();
    stop();
    if (a === "next") i = Math.min(steps.length - 1, i + 1);
    if (a === "prev") i = Math.max(0, i - 1);
    if (a === "restart") i = 0;
    paint();
  });
  paint();
}


// ── Names and objects: tags with arrows to the one object they point at ────────────────────
const LOCK = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"/></svg>';

function drawRefs(el, step, prev, spec, t) {
  const heap = step.heap || {}, refs = step.refs || {};
  const all = spec.refs === "all";
  const only = spec.show ? new Set(spec.show) : null;
  const locked = new Set(spec.locked || []);
  const names = Object.keys(refs).filter((k) => !only || only.has(k));
  const inline = (st, c) => c.p !== undefined || (!all && st.heap[c.r] && st.heap[c.r].k === "val");
  const text = (st, c) => (c.p !== undefined ? c.p : st.heap[c.r].p);
  const reach = (st) => {
    const out = [], go = (id) => { if (out.includes(id) || !st.heap[id]) return; out.push(id); for (const [, c] of st.heap[id].items || []) if (c.r) go(c.r); };
    for (const k of Object.keys(st.refs || {})) if ((!only || only.has(k)) && st.refs[k].r) go(st.refs[k].r);
    return out;
  };
  const now = reach(step);
  const old = prev && prev.heap ? prev.heap : {};
  const ghosts = prev && prev.heap ? reach(prev).filter((id) => !now.includes(id) && (all || prev.heap[id].k !== "val")) : [];
  const moved = (k) => prev && prev.refs && JSON.stringify(prev.refs[k]) !== JSON.stringify(refs[k]);
  const obj = (st, id, ghost) => {
    const o = st.heap[id];
    const born = !ghost && prev && prev.heap && !old[id] ? " born" : "";
    const edited = !ghost && old[id] && JSON.stringify(old[id]) !== JSON.stringify(o) ? " edited" : "";
    const cellEl = (c, label) => (c.r && !(inline(st, c)) ? `<span class="rfc ref" data-to="${c.r}"><b>●</b>${label}</span>` : `<span class="rfc"><b>${esc(text(st, c))}</b>${label}</span>`);
    let body;
    if (o.k === "val") body = `<span class="rfc val"><b>${esc(o.p)}</b></span>`;
    else if (o.k === "dict" || o.k === "obj") body = `${o.cls ? `<p class="rfcap">${esc(o.cls)}</p>` : ""}${o.items.map(([k, c]) => `<div class="rfrow"><i>${esc(k)}</i>${cellEl(c, "")}</div>`).join("") || `<span class="rfc empty"><b>{ }</b></span>`}`;
    else body = `${o.k === "tuple" || o.k === "set" ? `<p class="rfcap">${esc(t(`vis.k.${o.k}`))}</p>` : ""}<div class="rfcells">${o.items.map(([, c], j) => cellEl(c, `<i>${j}</i>`)).join("") || `<span class="rfc empty"><b>${o.k === "tuple" ? "( )" : o.k === "set" ? "{ }" : "[ ]"}</b></span>`}</div>`;
    return `<div class="rfobj k-${o.k}${ghost ? " ghost" : ""}${born}${edited}" data-o="${id}">${body}${ghost ? `<p class="rfghost">${esc(t("vis.ghost"))}</p>` : ""}</div>`;
  };
  const order = [], seen = new Set();
  const place = (id) => { if (seen.has(id) || !heap[id]) return; seen.add(id); order.push(id); for (const [, c] of heap[id].items || []) if (c.r) place(c.r); };
  for (const k of names) if (!inline(step, refs[k])) place(refs[k].r);
  const tags = names.map((k) => {
    const c = refs[k];
    const hot = moved(k) ? " changed" : "";
    return inline(step, c)
      ? `<span class="vbox rfname${hot}"><i>${esc(k)}</i><b>${esc(text(step, c))}</b></span>`
      : `<span class="rftag${hot}${locked.has(k) ? " locked" : ""}" data-to="${c.r}"><i>${esc(k)}</i>${locked.has(k) ? `<u title="${esc(t("vis.locked"))}">${LOCK}</u>` : ""}</span>`;
  });
  el.innerHTML = names.length ? `<div class="refs"><div class="refs-names">${tags.join("")}</div><div class="refs-objs">${order.map((id) => obj(step, id, false)).join("")}${ghosts.map((id) => obj(prev, id, true)).join("")}</div><svg class="refs-svg" aria-hidden="true"></svg></div>` : "";
  const host = el.querySelector(".refs");
  if (!host) return;
  const mid = markerId();
  const link = () => {
    const base = host.getBoundingClientRect();
    const svg = host.querySelector(".refs-svg");
    svg.setAttribute("width", base.width);
    svg.setAttribute("height", base.height);
    let out = marker(mid);
    host.querySelectorAll("[data-to]").forEach((src) => {
      const dst = host.querySelector(`.rfobj[data-o="${src.dataset.to}"]:not(.ghost)`);
      if (!dst) return;
      const a = src.getBoundingClientRect(), b = dst.getBoundingClientRect();
      const hot = src.classList.contains("changed") ? " hot" : "";
      const L = (r) => r - base.left, T = (r) => r - base.top;
      if (src.classList.contains("rftag")) {
        const x1 = L(a.right), y1 = T(a.top + a.height / 2), x2 = L(b.left), y2 = T(b.top + Math.min(b.height / 2, 22));
        const dx = Math.max(24, (x2 - x1) / 2);
        out += rope(mid, `M${x1} ${y1}C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2 - 2} ${y2}`, hot);
      } else if (b.top >= a.bottom - 2) {
        const side = !!src.closest(".rfrow");
        const x1 = L(side ? a.right : a.left + a.width / 2), y1 = T(side ? a.top + a.height / 2 : a.bottom), x2 = L(b.left + b.width / 2), y2 = T(b.top);
        const dy = Math.max(14, (y2 - y1) / 2);
        out += side
          ? rope(mid, `M${x1} ${y1}C${x1 + 36} ${y1} ${x2} ${y2 - dy} ${x2} ${y2 - 2}`, hot)
          : rope(mid, `M${x1} ${y1}C${x1} ${y1 + dy} ${x2} ${y2 - dy} ${x2} ${y2 - 2}`, hot);
      } else {
        const x1 = L(a.right), y1 = T(a.top + a.height / 2), x2 = L(b.right), y2 = T(b.top + b.height / 2), bx = Math.max(x1, x2) + 18;
        out += rope(mid, `M${x1} ${y1}C${bx} ${y1} ${bx} ${y2} ${x2 + 2} ${y2}`, hot);
      }
    });
    svg.innerHTML = out;
  };
  link();
  el._relink = link;
  if (!el._ro) { el._ro = new ResizeObserver(() => el._relink && el._relink()); el._ro.observe(el); }
}

// ── Scope: rooms inside rooms, and the functions that remember the room they were born in ───
function scope(fig, spec, ctx) {
  const t = ctx.t;
  const steps = spec.steps || [{ note: spec.note, rooms: spec.rooms }];
  const walk = (rooms, f) => { for (const r of rooms || []) { f(r); walk(r.rooms, f); } };
  const roomsOf = (s) => { const m = new Map(); walk(s && s.rooms, (r) => m.set(r.id, r)); return m; };
  fig.innerHTML = `${spec.title ? `<p class="vis-k">${rich(spec.title)}</p>` : ""}
    <div class="scope"><div class="scope-in"><div class="scope-map"></div>${steps.length > 1 ? `<div class="anim-bar">
      <button class="pbtn" data-a="restart" aria-label="${esc(t("player.restart"))}">${ICON.restart}</button>
      <button class="pbtn" data-a="prev" aria-label="${esc(t("vis.back"))}">${ICON.prev}</button>
      <button class="pbtn" data-a="play" aria-label="${esc(t("player.play"))}">${ICON.play}</button>
      <button class="pbtn" data-a="next" aria-label="${esc(t("vis.next"))}">${ICON.next}</button>
      <span class="pstat"></span></div>` : ""}<p class="scope-note" aria-live="polite"></p></div></div>`;
  const map = fig.querySelector(".scope-map"), note = fig.querySelector(".scope-note");
  let i = 0, timer = null;
  const paint = () => {
    const s = steps[i], before = roomsOf(steps[i - 1]);
    const pointed = new Set();
    walk(s.rooms, (r) => (r.fns || []).forEach((f) => pointed.add(f.env)));
    const room = (r) => {
      const was = before.get(r.id);
      const vars = Object.entries(r.vars || {}).map(([k, v]) => `<span class="vbox${!i || (was && JSON.stringify((was.vars || {})[k]) === JSON.stringify(v)) ? "" : " changed"}"><i>${esc(k)}</i><b>${esc(typeof v === "string" ? v : format(v, true))}</b></span>`).join("");
      const fns = (r.fns || []).map((f) => `<span class="sfn" data-env="${esc(f.env)}"><i>ƒ</i>${esc(f.name)}</span>`).join("");
      const fate = r.gone ? `<em>${esc(t(pointed.has(r.id) ? "vis.kept" : "vis.lost"))}</em>` : "";
      return `<div class="sroom${r.on ? " on" : ""}${r.gone ? ` gone ${pointed.has(r.id) ? "kept" : "lost"}` : ""}${was || !i ? "" : " born"}" data-r="${esc(r.id)}">
        <p class="sroom-h"><b>${rich(r.name)}</b>${fate}</p>
        ${vars ? `<div class="sroom-v">${vars}</div>` : ""}${fns ? `<div class="sroom-f">${fns}</div>` : ""}
        ${r.bad ? `<p class="sroom-bad">${rich(r.bad)}</p>` : ""}
        ${(r.rooms || []).map(room).join("")}
        ${r.up ? `<p class="sroom-up">${rich(r.up)}</p>` : ""}</div>`;
    };
    map.innerHTML = `${(s.rooms || []).map(room).join("")}<svg class="refs-svg" aria-hidden="true"></svg>`;
    note.innerHTML = rich(s.note || "");
    const st = fig.querySelector(".pstat");
    if (st) st.textContent = t("vis.stepN", { i: i + 1, n: steps.length });
    link();
  };
  const mid = markerId();
  const link = () => {
    const base = map.getBoundingClientRect();
    const svg = map.querySelector(".refs-svg");
    if (!svg) return;
    svg.setAttribute("width", base.width + 60);
    svg.setAttribute("height", base.height);
    let out = marker(mid);
    map.querySelectorAll(".sfn").forEach((f) => {
      const dst = map.querySelector(`.sroom[data-r="${CSS.escape(f.dataset.env)}"]`);
      if (!dst) return;
      const a = f.getBoundingClientRect(), b = dst.getBoundingClientRect();
      const x1 = a.right - base.left, y1 = a.top + a.height / 2 - base.top;
      const x2 = b.right - base.left, y2 = b.top + 16 - base.top;
      const bx = Math.max(x1, x2) + 34;
      out += rope(mid, `M${x1} ${y1}C${bx} ${y1} ${bx} ${y2} ${x2 + 2} ${y2}`, true);
    });
    svg.innerHTML = out;
  };
  new ResizeObserver(link).observe(map);
  const bar = fig.querySelector(".anim-bar");
  if (bar) {
    const playBtn = bar.querySelector('[data-a="play"]');
    const stop = () => { clearInterval(timer); timer = null; playBtn.innerHTML = ICON.play; playBtn.setAttribute("aria-label", t("player.play")); };
    bar.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      const a = b.dataset.a;
      if (a === "play") {
        if (timer) return stop();
        if (i >= steps.length - 1) { i = 0; paint(); }
        playBtn.innerHTML = ICON.pause;
        playBtn.setAttribute("aria-label", t("player.pause"));
        timer = setInterval(() => { if (i >= steps.length - 1 || !fig.isConnected) return stop(); i++; paint(); }, spec.speed || 3000);
        return;
      }
      stop();
      if (a === "next") i = Math.min(steps.length - 1, i + 1);
      if (a === "prev") i = Math.max(0, i - 1);
      if (a === "restart") i = 0;
      paint();
    });
  }
  paint();
}

// ── Network: nodes in a chain, the links between them, and what travels step by step ────────
const NET_ICONS = {
  computer: '<rect class="nf" x="5" y="5" width="38" height="27" rx="3"/><rect class="na" x="9" y="9" width="30" height="19" rx="1"/><path d="M9 13h30"/><rect class="nf" x="13" y="17" width="16" height="3" rx="1"/><rect class="nf" x="13" y="22" width="9" height="3" rx="1"/><path class="nf" d="M19 32h10l2 6H17z"/><rect class="nf" x="9" y="40" width="30" height="4" rx="1.5"/>',
  modem: '<path d="M14 18l-3-7M34 18l3-7"/><rect class="nf" x="5" y="18" width="38" height="15" rx="4"/><circle class="nl" cx="12" cy="25.5" r="2"/><circle class="nl" cx="19" cy="25.5" r="2"/><circle class="nl" cx="26" cy="25.5" r="2"/><path d="M32 25.5h6M10 37h28"/>',
  isp: '<rect class="nf" x="11" y="9" width="26" height="34" rx="2"/><path d="M24 9V4M20 4h8"/><path d="M16 15h4M28 15h4M16 21h4M28 21h4M16 27h4M28 27h4"/><rect class="na" x="20" y="34" width="8" height="9"/>',
  internet: '<circle class="nf" cx="24" cy="24" r="17"/><ellipse cx="24" cy="24" rx="7.5" ry="17"/><path d="M8 18h32M8 30h32M24 7v34"/>',
  server: '<rect class="nf" x="12" y="4" width="24" height="40" rx="3"/><rect class="na" x="16" y="9" width="16" height="6" rx="1"/><rect class="na" x="16" y="19" width="16" height="6" rx="1"/><circle class="nl" cx="19" cy="34" r="2"/><circle class="nl" cx="25" cy="34" r="2"/><path d="M16 40h16"/>',
  program: '<path class="nf" d="M10 5h20l8 8v30H10z"/><path d="M30 5v8h8"/><path d="M15 19h10M15 24h16M15 29h8"/><circle class="na" cx="31" cy="34" r="6"/><circle cx="31" cy="34" r="2"/>',
  file: '<path class="nf" d="M11 5h18l8 8v30H11z"/><path d="M29 5v8h8"/><path d="M19 22l-4 4 4 4M29 22l4 4-4 4M25 20l-3 12"/>',
  record: '<rect class="nf" x="6" y="10" width="36" height="28" rx="3"/><path class="na" d="M6 13a3 3 0 0 1 3-3h30a3 3 0 0 1 3 3v5H6z"/><path d="M6 18h36M11 25h18M11 31h12"/>',
  os: '<rect class="nf" x="6" y="31" width="36" height="9" rx="2"/><rect class="na" x="9" y="20" width="30" height="9" rx="2"/><rect class="nf" x="12" y="9" width="24" height="9" rx="2"/>',
  disk: '<path class="nf" d="M9 12v24c0 3 7 6 15 6s15-3 15-6V12"/><ellipse class="na" cx="24" cy="12" rx="15" ry="6"/><path d="M9 24c0 3 7 6 15 6s15-3 15-6"/>',
  engine: '<path class="nf" d="M21 4h6l1 5 4 2 4-3 4 4-3 4 2 4 5 1v6l-5 1-2 4 3 4-4 4-4-3-4 2-1 5h-6l-1-5-4-2-4 3-4-4 3-4-2-4-5-1v-6l5-1 2-4-3-4 4-4 4 3 4-2z"/><circle class="na" cx="24" cy="24" r="7"/>',
  table: '<rect class="nf" x="6" y="9" width="36" height="30" rx="3"/><path class="na" d="M6 12a3 3 0 0 1 3-3h30a3 3 0 0 1 3 3v5H6z"/><path d="M6 17h36M6 24.5h36M6 32h36M18 9v30M30 9v30"/>',
  person: '<circle class="na" cx="24" cy="15" r="8"/><path class="nf" d="M9 42c0-9 7-15 15-15s15 6 15 15z"/>',
  box: '<rect class="nf" x="6" y="8" width="36" height="32" rx="3"/><path d="M6 15h36"/><circle cx="10" cy="11.5" r="1"/><circle cx="14" cy="11.5" r="1"/><rect class="na" x="11" y="20" width="26" height="14" rx="1"/>',
};
const netIcon = (name) => `<svg viewBox="0 0 48 48" aria-hidden="true">${NET_ICONS[name] || NET_ICONS.box}</svg>`;

function network(fig, spec, ctx) {
  const t = ctx.t;
  const nodes = spec.nodes || [];
  const links = spec.links || [];
  const steps = spec.steps || [];
  const panes = (v) => (v ? `<div class="panes">${[].concat(v).map((p) => `<div>${pane(p, t)}</div>`).join("")}</div>` : "");
  fig.innerHTML = `${spec.title ? `<p class="vis-k">${rich(spec.title)}</p>` : ""}
    <div class="net"><div class="net-in">
      ${steps.length ? `<div class="net-top"><span class="net-phase"></span><span class="net-what"></span>${steps.some((s) => s.clock !== undefined) ? `<span class="net-clock" role="timer"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path class="net-hand" d="M12 12V5"/></svg><span><i>${rich(spec.clockLabel || "")}</i><b></b></span></span>` : ""}</div>` : ""}
      <div class="net-track">
        ${nodes.map((n, i) => `${i ? `<div class="net-link${links[i - 1]?.kind ? ` k-${esc(links[i - 1].kind)}` : ""}" data-l="${esc(links[i - 1]?.id || `l${i}`)}"><span class="net-wire"></span>${links[i - 1]?.label ? `<span class="net-ll">${rich(links[i - 1].label)}</span>` : ""}<span class="net-busy">${rich(links[i - 1]?.busy || "")}</span></div>` : ""}
          <div class="net-node" data-n="${esc(n.id)}"><span class="net-ic">${netIcon(n.icon)}</span><span class="net-tx"><b>${rich(n.label)}</b>${n.sub ? `<small>${rich(n.sub)}</small>` : ""}<span class="net-tag"></span></span></div>`).join("")}
        <span class="net-pkt" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg></span>
      </div>
      <div class="net-side"><p class="net-note" aria-live="polite">${steps.length ? "" : rich(spec.note || "")}</p>
      <div class="net-show">${steps.length ? "" : panes(spec.show)}</div></div>
    </div></div>`;
  if (!steps.length) return;
  const track = fig.querySelector(".net-track"), pkt = fig.querySelector(".net-pkt");
  const tagged = new Set(steps.flatMap((s) => Object.keys(s.tags || {})));
  track.querySelectorAll(".net-node").forEach((el) => el.classList.toggle("tagged", tagged.has(el.dataset.n)));
  const nodeEl = (id) => track.querySelector(`[data-n="${CSS.escape(String(id))}"] .net-ic`);
  const place = (id) => {
    const el = nodeEl(id);
    if (!el) return;
    const a = el.getBoundingClientRect(), b = track.getBoundingClientRect();
    pkt.style.translate = `${a.right - b.left - 22}px ${a.top - b.top - 12}px`;
  };
  let i = 0, timer = null, shown = -1;
  const sticky = (k) => { for (let j = i; j >= 0; j--) if (steps[j][k] !== undefined) return steps[j][k]; };
  const paint = (animate) => {
    const s = steps[i];
    const dim = new Set(s.dim || []), busy = new Set(s.busy || []), tags = s.tags || {};
    const at = s.move ? s.move[1] : s.at;
    track.querySelectorAll(".net-node").forEach((el) => {
      const id = el.dataset.n;
      el.classList.toggle("on", id === at);
      el.classList.toggle("dim", dim.has(id));
      el.classList.toggle("busy", busy.has(id));
      const tag = el.querySelector(".net-tag");
      tag.innerHTML = tags[id] ? rich(tags[id]) : "";
      tag.hidden = !tags[id];
    });
    track.querySelectorAll(".net-link").forEach((el) => { el.classList.toggle("busy", busy.has(el.dataset.l)); el.classList.toggle("dim", (s.dimLinks || []).includes(el.dataset.l)); });
    const p = s.packet;
    pkt.hidden = !p;
    pkt.className = `net-pkt${p && p.kind ? ` k-${p.kind}` : ""}`;
    if (p) {
      const moving = animate && s.move && !reduce();
      pkt.style.transition = "none";
      if (moving) { place(s.move[0]); pkt.getBoundingClientRect(); pkt.style.transition = ""; pkt.style.setProperty("--dur", `${s.dur || 900}ms`); }
      place(at);
    }
    const phase = sticky("phase");
    const ph = fig.querySelector(".net-phase");
    ph.innerHTML = phase ? rich(phase) : "";
    ph.hidden = !phase;
    fig.querySelector(".net-what").innerHTML = p ? `<i>${esc(t("vis.travels"))}</i> ${rich(p.label || "")}` : `<i>${esc(t("vis.nothing"))}</i>`;
    const clock = fig.querySelector(".net-clock");
    if (clock) {
      const c = sticky("clock") ?? 0;
      clock.querySelector("b").textContent = s.clockText || `${format(c)} s`;
      clock.querySelector(".net-hand").style.rotate = `${(c / (spec.clockMax || 60)) * 360}deg`;
      clock.classList.toggle("zero", c === 0);
    }
    fig.querySelector(".net-note").innerHTML = rich(s.note || "");
    fig.querySelector(".net-show").innerHTML = panes(s.show);
    fig.querySelector(".pstat").textContent = t("vis.stepN", { i: i + 1, n: steps.length });
    shown = i;
  };
  track.insertAdjacentHTML("afterend", `<div class="anim-bar">
      <button class="pbtn" data-a="restart" aria-label="${esc(t("player.restart"))}">${ICON.restart}</button>
      <button class="pbtn" data-a="prev" aria-label="${esc(t("vis.back"))}">${ICON.prev}</button>
      <button class="pbtn" data-a="play" aria-label="${esc(t("player.play"))}">${ICON.play}</button>
      <button class="pbtn" data-a="next" aria-label="${esc(t("vis.next"))}">${ICON.next}</button>
      <span class="pstat"></span>
    </div>`);
  const playBtn = fig.querySelector('[data-a="play"]');
  const stop = () => { clearInterval(timer); timer = null; playBtn.innerHTML = ICON.play; playBtn.setAttribute("aria-label", t("player.play")); };
  const play = () => {
    if (i >= steps.length - 1) { i = 0; paint(false); }
    playBtn.innerHTML = ICON.pause;
    playBtn.setAttribute("aria-label", t("player.pause"));
    timer = setInterval(() => { if (i >= steps.length - 1 || !fig.isConnected) return stop(); i++; paint(true); }, spec.speed || 3200);
  };
  fig.querySelector(".anim-bar").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const a = b.dataset.a;
    if (a === "play") return timer ? stop() : play();
    stop();
    const was = i;
    if (a === "next") i = Math.min(steps.length - 1, i + 1);
    if (a === "prev") i = Math.max(0, i - 1);
    if (a === "restart") i = 0;
    paint(a === "next" && i === was + 1);
  });
  new ResizeObserver(() => { if (shown < 0) return; const s = steps[shown]; if (s.packet) { pkt.style.transition = "none"; place(s.move ? s.move[1] : s.at); } }).observe(track);
  paint(false);
}
