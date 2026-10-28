// The SQL track's pictures: result tables, the ER diagram, query plans, and step-by-step diagrams of
// how SQL works inside (the run order of a query, joins pairing rows, groups as buckets, window
// frames, B-tree lookups, two transactions in time), plus the case files: scenes of each place,
// sprites, suspect dossiers and the case board that fills in as the learner solves steps.
// Content format: docs/sql.md.
import { sprite } from "./sprites.js";
import { sceneSvg } from "./scenes.js";
import { marker, markerId, rope } from "../arrows.js";
import { schemaFor } from "./schema.js";
import { cellText, realText } from "./format.js";
import { icon } from "../../platform/web/core/dom.js";
import * as P from "../../platform/web/core/progress.js";
import { md as rich } from "../../platform/web/core/inline.js";
import { highlightHtml } from "../../platform/web/core/highlight.js";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const sql = (code) => highlightHtml(code, "sql");
const reduce = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const passed = (id) => { try { return !!P.passed(id); } catch (_) { return false; } };
const ICON = { play: icon("play"), pause: icon("pause"), next: icon("chevron-right"), prev: icon("chevron-left"), restart: icon("rotate-ccw"), key: icon("key-round"), link: icon("link"), pin: icon("pin") };

export const SQL_VISUALS = ["result", "er", "order", "join", "groups", "window", "btree", "plan", "txn", "logic", "setting", "caseboard", "dossier", "correlated", "sets", "cte", "change", "port", "recursion", "joinalgo"];

export function mountSqlVisual(fig, kind, spec, ctx) {
  const t = ctx.t;
  const f = { result: resultFig, er: erFig, order: orderFig, join: joinFig, groups: groupsFig, window: windowFig, btree: btreeFig, plan: planFig, txn: txnFig, logic: logicFig, setting: settingFig, caseboard: caseboardFig, dossier: dossierFig, correlated: correlatedFig, sets: setsFig, cte: cteFig , change: changeFig, port: portFig, recursion: recursionFig, joinalgo: joinAlgoFig }[kind];
  if (f) f(fig, spec, t, ctx);
}

const head = (spec) => (spec.title ? `<p class="vis-k">${rich(spec.title)}</p>` : "");

// ── A stepper: restart, back, play, forward, "step i of n" ─────────────────────
function stepper(fig, n, paint, t, speed = 1100) {
  const bar = document.createElement("div");
  bar.className = "anim-bar";
  bar.innerHTML = `<button class="pbtn" data-a="restart" aria-label="${esc(t("player.restart"))}">${ICON.restart}</button>
    <button class="pbtn" data-a="prev" aria-label="${esc(t("vis.back"))}">${ICON.prev}</button>
    <button class="pbtn" data-a="play" aria-label="${esc(t("player.play"))}">${ICON.play}</button>
    <button class="pbtn" data-a="next" aria-label="${esc(t("vis.next"))}">${ICON.next}</button>
    <span class="pstat"></span>`;
  fig.append(bar);
  let i = 0, timer = null;
  const stat = bar.querySelector(".pstat"), playBtn = bar.querySelector('[data-a="play"]');
  const show = () => { paint(i); stat.textContent = t("vis.stepN", { i: i + 1, n }); };
  const stop = () => { clearInterval(timer); timer = null; playBtn.innerHTML = ICON.play; playBtn.setAttribute("aria-label", t("player.play")); };
  const play = () => {
    if (i >= n - 1) i = 0;
    playBtn.innerHTML = ICON.pause;
    playBtn.setAttribute("aria-label", t("player.pause"));
    timer = setInterval(() => { if (i >= n - 1 || !fig.isConnected) return stop(); i++; show(); }, speed);
  };
  bar.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const a = b.dataset.a;
    if (a === "play") return timer ? stop() : play();
    stop();
    if (a === "next") i = Math.min(n - 1, i + 1);
    if (a === "prev") i = Math.max(0, i - 1);
    if (a === "restart") i = 0;
    show();
  });
  show();
  return { go: (k) => { i = k; show(); } };
}

// ── Result table ───────────────────────────────────────────────────────────
const PAGE = 50;
export function resultTable(res, t, { page = PAGE, cls = "" } = {}) {
  const box = document.createElement("div");
  box.className = `rt ${cls}`;
  if (res.plan) { box.append(planTree(res.rows, t)); return box; }
  if (!res.cols) {
    box.innerHTML = `<p class="rt-dml">${icon("check")}<span>${esc(t("sql.changed", { n: res.changes ?? 0 }))}</span></p>`;
    return box;
  }
  let shown = Math.min(page, res.rows.length);
  const total = res.total ?? res.rows.length;
  const cell = (v, k) => (v === null || v === undefined ? '<td class="null">NULL</td>' : `<td${k === "i" || k === "r" || typeof v === "number" ? ' class="num"' : String(v).length > 40 ? ' class="long"' : ""}>${esc(cellText(v, k))}</td>`);
  const rowsHtml = (from, to) => res.rows.slice(from, to).map((r, i) => `<tr>${r.map((v, j) => cell(v, res.kinds && res.kinds[from + i] && res.kinds[from + i][j])).join("")}</tr>`).join("");
  box.innerHTML = `<div class="rt-scroll" tabindex="0"><table class="rt-t"><thead><tr>${res.cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${rowsHtml(0, shown)}</tbody></table></div>
    <p class="rt-foot"><span class="rt-n"></span><button class="link rt-more" hidden></button></p>`;
  const foot = box.querySelector(".rt-n"), more = box.querySelector(".rt-more"), body = box.querySelector("tbody");
  const paint = () => {
    foot.textContent = shown < total ? t("sql.rowsOf", { shown, n: total }) : t(total === 1 ? "sql.row1" : "sql.rows", { n: total });
    const left = res.rows.length - shown;
    more.hidden = left <= 0;
    more.textContent = t("sql.more", { n: Math.min(page, left) });
  };
  more.addEventListener("click", () => { body.insertAdjacentHTML("beforeend", rowsHtml(shown, shown + page)); shown = Math.min(res.rows.length, shown + page); paint(); });
  if (!res.rows.length) body.innerHTML = `<tr><td class="rt-empty" colspan="${res.cols.length}">${esc(t("sql.empty"))}</td></tr>`;
  paint();
  return box;
}

function resultFig(fig, spec, t) {
  fig.innerHTML = head(spec) + (spec.query ? `<pre class="code sql-q"><code>${sql(spec.query)}</code></pre>` : "");
  if (spec.result) fig.append(resultTable(spec.result, t, { page: spec.page || 12 }));
}

// ── Query plan as a tree ───────────────────────────────────────────────────
function planKind(d) {
  if (/COVERING INDEX/.test(d)) return "best";
  if (/^SEARCH\b.*\bUSING\b/.test(d)) return "good";
  if (/^SCAN\b/.test(d)) return "scan";
  if (/TEMP B-TREE/.test(d)) return "temp";
  return "info";
}
export function planTree(rows, t) {
  const box = document.createElement("div");
  box.className = "plan";
  const kids = new Map();
  for (const r of rows) { const p = r[1]; if (!kids.has(p)) kids.set(p, []); kids.get(p).push(r); }
  const node = (r) => {
    const d = String(r[3]);
    const k = planKind(d);
    const sub = kids.get(r[0]) || [];
    return `<li class="pl-${k}"><span class="pl-node"><b>${esc(d)}</b><i>${esc(t(`plan.${k}`))}</i></span>${sub.length ? `<ul>${sub.map(node).join("")}</ul>` : ""}</li>`;
  };
  box.innerHTML = `<p class="pane-k">${esc(t("plan.title"))}</p><ul class="pl-tree">${(kids.get(0) || []).map(node).join("")}</ul>`;
  return box;
}
function planFig(fig, spec, t) {
  fig.innerHTML = head(spec) + (spec.query ? `<pre class="code sql-q"><code>${sql(spec.query)}</code></pre>` : "");
  if (spec.plan) fig.append(planTree(spec.plan, t));
}

// ── ER diagram: tables as cards, foreign keys as lines ────────────────────────
export function erDiagram(host, names, lang, t, { compact = false, defs = null } = {}) {
  const tables = defs || schemaFor(lang, names && names.length ? names : null);
  const order = names && names.length ? names.map((n) => tables.find((x) => x.name === n)).filter(Boolean) : tables;
  const wrap = document.createElement("div");
  wrap.className = `er${compact ? " er-compact" : ""}`;
  wrap.innerHTML = `<svg class="er-lines" aria-hidden="true"></svg><div class="er-grid">${order.map((tb) => `<div class="er-t" data-t="${esc(tb.name)}">
      <p class="er-name" title="${esc(tb.desc)}">${esc(tb.name)}</p>
      <ul>${tb.cols.map((c) => `<li data-c="${esc(c.name)}"${c.fk ? ` data-fk="${esc(c.fk)}"` : ""} title="${esc(c.desc)}"><span class="er-k">${c.pk ? ICON.key : c.fk ? ICON.link : ""}</span><code>${esc(c.name)}</code><em>${esc(c.type)}</em>${c.fk && !order.some((o) => o.name === c.fk) ? `<span class="er-to">→ ${esc(c.fk)}</span>` : ""}</li>`).join("")}</ul>
    </div>`).join("")}</div>
    <p class="er-legend">${ICON.key}<span>${esc(t("er.pk"))}</span>${ICON.link}<span>${esc(t("er.fk"))}</span></p>`;
  host.append(wrap);
  const svg = wrap.querySelector(".er-lines");
  const mid = markerId();
  const draw = () => {
    if (!wrap.isConnected) return;
    const box = wrap.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    svg.style.width = `${box.width}px`;
    svg.style.height = `${box.height}px`;
    const lines = [];
    for (const li of wrap.querySelectorAll("li[data-fk]")) {
      const to = wrap.querySelector(`.er-t[data-t="${CSS.escape(li.dataset.fk)}"] .er-name`);
      if (!to) continue;
      const a = li.getBoundingClientRect(), b = to.getBoundingClientRect();
      const ay = a.top + a.height / 2 - box.top, by = b.top + b.height / 2 - box.top;
      const right = b.left > a.right - 4;
      const left = b.right < a.left + 4;
      const same = !right && !left;
      const ax = (right || same ? a.right : a.left) - box.left, bx = (right ? b.left : left ? b.right : b.right) - box.left;
      const bend = same ? 16 : Math.max(24, Math.abs(bx - ax) / 2);
      const c1 = right || same ? ax + bend : ax - bend, c2 = right ? bx - bend : left ? bx + bend : bx + bend;
      const tip = right ? bx - 2 : bx + 2;
      lines.push(rope(mid, `M${ax} ${ay} C ${c1} ${ay}, ${c2} ${by}, ${tip} ${by}`, true));
    }
    svg.innerHTML = marker(mid) + lines.join("");
  };
  const ro = new ResizeObserver(() => requestAnimationFrame(draw));
  ro.observe(wrap);
  requestAnimationFrame(draw);
  return wrap;
}
function erFig(fig, spec, t, ctx) {
  fig.innerHTML = head(spec);
  erDiagram(fig, spec.defs ? null : spec.tables || [], ctx.lang, t, { defs: spec.defs || null });
}

// ── Order of evaluation: the same query, as written and as run ───────────────
// spec.stages comes from the build: [{ key, clause, cols, rows, kinds, keep?, group? }].
const ORDER = ["from", "where", "group", "having", "select", "distinct", "order", "limit"];
function orderFig(fig, spec, t) {
  const stages = spec.stages || [];
  const written = spec.parts || [];
  fig.innerHTML = `${head(spec)}<div class="ord">
      <pre class="code ord-q"><code>${written.map((p) => `<span class="ord-c" data-k="${p.key}">${sql(p.text)}</span>`).join("\n")}</code></pre>
      <div class="ord-lanes">
        <div><p class="pane-k">${esc(t("order.written"))}</p><ol class="ord-lane">${written.map((p) => `<li data-k="${p.key}">${esc(t(`order.${p.key}`))}</li>`).join("")}</ol></div>
        <div><p class="pane-k">${esc(t("order.run"))}</p><ol class="ord-lane run">${stages.map((s) => `<li data-k="${s.key}">${esc(t(`order.${s.key}`))}</li>`).join("")}</ol></div>
      </div>
      <div class="ord-stage"><p class="ord-what" aria-live="polite"></p><div class="ord-rows"></div></div>
    </div>`;
  const what = fig.querySelector(".ord-what"), rowsEl = fig.querySelector(".ord-rows");
  stepper(fig, stages.length, (i) => {
    const s = stages[i];
    fig.querySelectorAll(".ord-c, .ord-lane li").forEach((el) => el.classList.toggle("now", el.dataset.k === s.key));
    fig.querySelectorAll(".ord-lane.run li").forEach((el, j) => el.classList.toggle("done", j < i));
    what.innerHTML = `<b>${i + 1}. ${esc(t(`order.${s.key}`))}</b> ${rich(t(`order.${s.key}.what`))} <span class="ord-count">${esc(t("sql.rows", { n: s.rows.filter((_, j) => !s.keep || s.keep[j]).length }))}</span>`;
    const groupCls = (j) => (s.group ? ` g${s.group[j] % 8}` : "");
    rowsEl.innerHTML = `<div class="rt-scroll"><table class="rt-t ord-t"><thead><tr>${s.cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${s.rows.map((r, j) => `<tr class="${s.keep && !s.keep[j] ? "out" : ""}${groupCls(j)}">${r.map((v, k) => (v === null ? '<td class="null">NULL</td>' : `<td${typeof v === "number" ? ' class="num"' : ""}>${esc(cellText(v, s.kinds && s.kinds[j] && s.kinds[j][k]))}</td>`)).join("")}</tr>`).join("")}</tbody></table></div>`;
  }, t, spec.speed || 1800);
}

// ── Joins: each row on the left looks for its partners on the right ──────────
function joinSteps(spec) {
  const L = spec.left, Rt = spec.right, type = spec.type || "inner";
  const [lk, rk] = spec.on;
  const li = L.cols.indexOf(lk), ri = Rt.cols.indexOf(rk);
  const steps = [], out = [];
  const matchedRight = new Set();
  let compared = 0;
  const nullsR = Rt.cols.map(() => null), nullsL = L.cols.map(() => null);
  L.rows.forEach((lr, i) => {
    const hits = [];
    Rt.rows.forEach((rr, j) => {
      compared++;
      if (lr[li] !== null && lr[li] === rr[ri]) hits.push(j);
    });
    hits.forEach((j) => matchedRight.add(j));
    if (type === "semi") { if (hits.length) out.push({ row: lr, from: [i, null] }); }
    else if (type === "anti") { if (!hits.length) out.push({ row: lr, from: [i, null] }); }
    else {
      for (const j of hits) out.push({ row: [...lr, ...Rt.rows[j]], from: [i, j] });
      if (!hits.length && (type === "left" || type === "full")) out.push({ row: [...lr, ...nullsR], from: [i, null], pad: true });
    }
    steps.push({ left: i, hits, out: out.length, compared });
  });
  if (type === "full" || type === "right") {
    Rt.rows.forEach((rr, j) => { if (!matchedRight.has(j)) out.push({ row: [...nullsL, ...rr], from: [null, j], pad: true }); });
    steps.push({ left: null, hits: [], out: out.length, compared, tail: true });
  }
  const cols = type === "semi" || type === "anti" ? L.cols : [...L.cols.map((c) => `${L.name}.${c}`), ...Rt.cols.map((c) => `${Rt.name}.${c}`)];
  return { steps, out, cols, li, ri };
}
function joinFig(fig, spec, t) {
  const { steps, out, cols, li, ri } = joinSteps(spec);
  const tbl = (T, side, key) => `<div class="jn-side"><p class="pane-k">${esc(T.name)}</p><div class="rt-scroll"><table class="rt-t jn-t" data-side="${side}"><thead><tr>${T.cols.map((c, k) => `<th${k === key ? ' class="key"' : ""}>${esc(c)}</th>`).join("")}</tr></thead><tbody>${T.rows.map((r) => `<tr>${r.map((v, k) => (v === null ? `<td class="null${k === key ? " key" : ""}">NULL</td>` : `<td${k === key ? ' class="key"' : ""}>${esc(cellText(v))}</td>`)).join("")}</tr>`).join("")}</tbody></table></div></div>`;
  fig.innerHTML = `${head(spec)}<div class="jn">
      <pre class="code sql-q"><code>${sql(spec.query || "")}</code></pre>
      <div class="jn-pair">${tbl(spec.left, "l", li)}${spec.type === "semi" || spec.type === "anti" ? "" : ""}${tbl(spec.right, "r", ri)}</div>
      <p class="jn-what" aria-live="polite"></p>
      <div class="jn-out"><p class="pane-k">${esc(t("join.result"))}</p><div class="rt-scroll"><table class="rt-t"><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody></tbody></table></div></div>
    </div>`;
  const lRows = fig.querySelectorAll('[data-side="l"] tbody tr'), rRows = fig.querySelectorAll('[data-side="r"] tbody tr');
  const body = fig.querySelector(".jn-out tbody"), what = fig.querySelector(".jn-what");
  stepper(fig, steps.length, (i) => {
    const s = steps[i];
    lRows.forEach((tr, k) => { tr.classList.toggle("now", k === s.left); tr.classList.toggle("seen", s.left !== null && k < s.left); });
    rRows.forEach((tr, k) => { tr.classList.toggle("hit", s.hits.includes(k)); tr.classList.toggle("miss", s.left !== null && !s.hits.includes(k)); });
    body.innerHTML = out.slice(0, s.out).map((o, k) => `<tr class="${o.pad ? "pad" : ""}${k >= (steps[i - 1] ? steps[i - 1].out : 0) ? " new" : ""}">${o.row.map((v) => (v === null ? '<td class="null">NULL</td>' : `<td>${esc(cellText(v))}</td>`)).join("")}</tr>`).join("");
    const key = s.left === null ? null : spec.left.rows[s.left][li];
    const msg = spec.type === "semi" || spec.type === "anti" ? `join.${spec.type}${s.hits.length ? "Hit" : "Miss"}` : s.hits.length ? (s.hits.length > 1 ? "join.many" : "join.one") : spec.type === "left" || spec.type === "full" ? "join.noneLeft" : "join.none";
    what.innerHTML = s.tail ? rich(t("join.tail")) : rich(t(msg, { key: key === null ? "NULL" : cellText(key), n: s.hits.length })) + ` <span class="jn-cmp">${esc(t("join.compared", { n: s.compared }))}</span>`;
  }, t, spec.speed || 1400);
}

// ── Groups: rows fall into buckets, each bucket keeps a running total ─────────
function groupsFig(fig, spec, t) {
  const T = spec.table;
  const by = T.cols.indexOf(spec.by);
  const aggs = (spec.agg || [{ fn: "count" }]).map((a) => ({ ...a, i: a.col ? T.cols.indexOf(a.col) : -1 }));
  const keys = [];
  for (const r of T.rows) if (!keys.some((k) => k === r[by])) keys.push(r[by]);
  const label = (a) => a.as || `${a.fn.toUpperCase()}(${a.col || "*"})`;
  const state = () => keys.map(() => aggs.map(() => ({ n: 0, sum: 0, min: null, max: null, nn: 0 })));
  const steps = [];
  const acc = state();
  T.rows.forEach((r, i) => {
    const g = keys.indexOf(r[by]);
    aggs.forEach((a, j) => {
      const s = acc[g][j];
      const v = a.i >= 0 ? r[a.i] : 1;
      s.n++;
      if (v !== null) { s.nn++; if (typeof v === "number") s.sum += v; s.min = s.min === null || v < s.min ? v : s.min; s.max = s.max === null || v > s.max ? v : s.max; }
    });
    steps.push({ row: i, g, acc: JSON.parse(JSON.stringify(acc)) });
  });
  const value = (a, s) => {
    if (a.fn === "count") return a.col ? s.nn : s.n;
    if (a.fn === "sum") return s.nn ? s.sum : null;
    if (a.fn === "avg") return s.nn ? s.sum / s.nn : null;
    if (a.fn === "min") return s.min;
    return s.max;
  };
  const inside = (a, s) => (a.fn === "avg" ? t("groups.avgState", { sum: realText(s.sum).replace(/\.0$/, ""), n: s.nn }) : a.fn === "count" && a.col ? t("groups.countCol", { n: s.nn, skipped: s.n - s.nn }) : "");
  const having = spec.having ? new Function("g", `"use strict"; return (${spec.having});`) : null;
  steps.push({ row: null, done: true, acc: steps.length ? steps[steps.length - 1].acc : state() });
  fig.innerHTML = `${head(spec)}<div class="gb">
      <pre class="code sql-q"><code>${sql(spec.query || "")}</code></pre>
      <div class="gb-in"><p class="pane-k">${esc(T.name || "")}</p><div class="rt-scroll"><table class="rt-t"><thead><tr>${T.cols.map((c, k) => `<th${k === by ? ' class="key"' : ""}>${esc(c)}</th>`).join("")}</tr></thead><tbody>${T.rows.map((r) => `<tr>${r.map((v, k) => (v === null ? '<td class="null">NULL</td>' : `<td${k === by ? ' class="key"' : ""}>${esc(cellText(v))}</td>`)).join("")}</tr>`).join("")}</tbody></table></div></div>
      <div class="gb-buckets">${keys.map((k, g) => `<div class="gb-b g${g % 8}" data-g="${g}"><p class="gb-k">${esc(spec.by)} = ${k === null ? "NULL" : esc(cellText(k))}</p><div class="gb-rows"></div><dl class="gb-acc"></dl></div>`).join("")}</div>
      <p class="gb-what" aria-live="polite"></p>
    </div>`;
  const inRows = fig.querySelectorAll(".gb-in tbody tr"), buckets = fig.querySelectorAll(".gb-b"), what = fig.querySelector(".gb-what");
  stepper(fig, steps.length, (i) => {
    const s = steps[i];
    inRows.forEach((tr, k) => { tr.classList.toggle("now", k === s.row); tr.classList.toggle("seen", s.row === null || k < s.row); tr.className = tr.className.replace(/\bg\d\b/g, "").trim(); if (s.row === null || k <= s.row) tr.classList.add(`g${keys.indexOf(T.rows[k][by]) % 8}`); });
    buckets.forEach((b, g) => {
      const members = T.rows.map((r, k) => [r, k]).filter(([r, k]) => keys.indexOf(r[by]) === g && (s.row === null || k <= s.row));
      b.querySelector(".gb-rows").innerHTML = members.map(([r, k]) => `<span class="gb-chip${k === s.row ? " new" : ""}">${esc(r.filter((_, c) => c !== by).map((v) => cellText(v)).join(" · "))}</span>`).join("");
      b.querySelector(".gb-acc").innerHTML = aggs.map((a, j) => `<dt>${esc(label(a))}</dt><dd>${esc(cellText(value(a, s.acc[g][j]), a.fn === "avg" ? "r" : undefined))}${inside(a, s.acc[g][j]) ? `<small>${esc(inside(a, s.acc[g][j]))}</small>` : ""}</dd>`).join("");
      const keepIt = !having || !s.done || having(Object.fromEntries(aggs.map((a, j) => [label(a), value(a, s.acc[g][j])])));
      b.classList.toggle("out", !keepIt);
      b.classList.toggle("now", g === s.g);
    });
    what.innerHTML = s.done ? rich(t(spec.having ? "groups.having" : "groups.done", { n: keys.length })) : rich(t("groups.step", { key: T.rows[s.row][by] === null ? "NULL" : cellText(T.rows[s.row][by]) }));
  }, t, spec.speed || 1100);
}

// ── Window functions: the frame slides, the row keeps its place ──────────────
function frameOf(k, n, frame) {
  const [a, b] = frame || ["unbounded", 0];
  const lo = a === "unbounded" ? 0 : Math.max(0, k + Number(a));
  const hi = b === "unbounded" ? n - 1 : Math.min(n - 1, k + Number(b));
  return [lo, hi];
}
function windowFig(fig, spec, t) {
  const T = spec.table;
  const pi = spec.partition ? T.cols.indexOf(spec.partition) : -1;
  const oi = spec.order ? T.cols.indexOf(spec.order) : -1;
  const ci = spec.col ? T.cols.indexOf(spec.col) : -1;
  const fn = spec.fn || "sum";
  const dir = spec.desc ? -1 : 1;
  const rows = T.rows.map((r, i) => ({ r, i })).sort((x, y) => (pi >= 0 && x.r[pi] !== y.r[pi] ? (x.r[pi] < y.r[pi] ? -1 : 1) : oi >= 0 && x.r[oi] !== y.r[oi] ? (x.r[oi] < y.r[oi] ? -dir : dir) : x.i - y.i));
  const parts = [];
  for (const x of rows) { const key = pi >= 0 ? x.r[pi] : 0; let p = parts.find((q) => q.key === key); if (!p) parts.push(p = { key, list: [] }); p.list.push(x); }
  const values = new Map(), steps = [];
  parts.forEach((p, pn) => {
    let rank = 0, dense = 0, prev;
    p.list.forEach((x, k) => {
      const [lo, hi] = frameOf(k, p.list.length, spec.frame);
      const inFrame = p.list.slice(lo, hi + 1).map((y) => y.r[ci]);
      const ov = oi >= 0 ? x.r[oi] : null;
      if (k === 0 || ov !== prev) { rank = k + 1; dense++; }
      prev = ov;
      const num = inFrame.filter((v) => typeof v === "number");
      const v = fn === "row_number" ? k + 1 : fn === "rank" ? rank : fn === "dense_rank" ? dense
        : fn === "lag" ? (k - (spec.offset || 1) >= 0 ? p.list[k - (spec.offset || 1)].r[ci] : null)
        : fn === "lead" ? (k + (spec.offset || 1) < p.list.length ? p.list[k + (spec.offset || 1)].r[ci] : null)
        : fn === "first_value" ? (inFrame.length ? inFrame[0] : null) : fn === "last_value" ? (inFrame.length ? inFrame[inFrame.length - 1] : null)
        : fn === "count" ? inFrame.filter((y) => y !== null).length
        : fn === "avg" ? (num.length ? num.reduce((a, y) => a + y, 0) / num.length : null)
        : fn === "min" ? (num.length ? Math.min(...num) : null) : fn === "max" ? (num.length ? Math.max(...num) : null)
        : num.reduce((a, y) => a + y, 0);
      values.set(x, v);
      const usesFrame = !["row_number", "rank", "dense_rank", "lag", "lead"].includes(fn);
      const look = fn === "lag" ? [k - (spec.offset || 1)] : fn === "lead" ? [k + (spec.offset || 1)] : [];
      steps.push({ part: pn, k, lo: usesFrame ? lo : null, hi: usesFrame ? hi : null, look, x });
    });
  });
  const kind = fn === "avg" ? "r" : undefined;
  const out = spec.as || `${fn.toUpperCase()}(${spec.col || ""})`;
  fig.innerHTML = `${head(spec)}<div class="wf">
      <pre class="code sql-q"><code>${sql(spec.query || "")}</code></pre>
      <div class="rt-scroll"><table class="rt-t wf-t"><thead><tr>${T.cols.map((c) => `<th>${esc(c)}</th>`).join("")}<th class="wf-new">${esc(out)}</th></tr></thead>
      <tbody>${parts.map((p, pn) => p.list.map((x, k) => `<tr class="g${pn % 8}${k === 0 && pn ? " wf-start" : ""}" data-p="${pn}" data-k="${k}">${x.r.map((v) => (v === null ? '<td class="null">NULL</td>' : `<td>${esc(cellText(v))}</td>`)).join("")}<td class="wf-v"></td></tr>`).join("")).join("")}</tbody></table></div>
      <p class="wf-what" aria-live="polite"></p>
    </div>`;
  const trs = [...fig.querySelectorAll(".wf-t tbody tr")], what = fig.querySelector(".wf-what");
  stepper(fig, steps.length, (i) => {
    const s = steps[i];
    trs.forEach((tr, n) => {
      const p = Number(tr.dataset.p), k = Number(tr.dataset.k);
      const same = p === s.part;
      tr.classList.toggle("now", same && k === s.k);
      tr.classList.toggle("frame", same && s.lo !== null && k >= s.lo && k <= s.hi);
      tr.classList.toggle("look", same && s.look.includes(k));
      tr.classList.toggle("other", !same);
      const done = steps.findIndex((x) => x.part === p && x.k === k) <= i;
      tr.querySelector(".wf-v").textContent = done ? cellText(values.get(parts[p].list[k]), kind) : "";
      void n;
    });
    const fr = s.lo === null ? "" : t("window.frame", { a: s.lo + 1, b: s.hi + 1 });
    what.innerHTML = rich(t("window.step", { part: pi >= 0 ? `${spec.partition} = ${cellText(parts[s.part].key)}` : t("window.all"), k: s.k + 1, v: cellText(values.get(s.x), kind) })) + (fr ? ` ${rich(fr)}` : "");
  }, t, spec.speed || 1100);
}

// ── B-tree: pages in levels, and the path a lookup takes ──────────────────────
function btreeFig(fig, spec, t) {
  const keys = (spec.keys || Array.from({ length: spec.n || 24 }, (_, i) => (i + 1) * (spec.step || 5))).slice().sort((a, b) => (a < b ? -1 : 1));
  const fan = spec.fanout || 4;
  let level = [];
  for (let i = 0; i < keys.length; i += fan) level.push({ keys: keys.slice(i, i + fan), kids: null });
  const levels = [level];
  while (level.length > 1) {
    const up = [];
    for (let i = 0; i < level.length; i += fan) {
      const kids = level.slice(i, i + fan);
      up.push({ keys: kids.slice(1).map((k) => (k.min ?? k.keys[0])), kids, min: kids[0].min ?? kids[0].keys[0] });
    }
    levels.unshift(up);
    level = up;
  }
  const find = spec.find ?? keys[Math.floor(keys.length * 0.62)];
  const path = [];
  let node = levels[0][0];
  while (node) {
    path.push(node);
    if (!node.kids) break;
    let k = 0;
    while (k < node.keys.length && find >= node.keys[k]) k++;
    node = node.kids[k];
  }
  const id = new Map();
  levels.forEach((lv, d) => lv.forEach((n, j) => id.set(n, `${d}-${j}`)));
  fig.innerHTML = `${head(spec)}<div class="bt">
      <div class="bt-levels">${levels.map((lv, d) => `<div class="bt-level"><span class="bt-lab">${esc(t(d === 0 ? "btree.root" : d === levels.length - 1 ? "btree.leaf" : "btree.inner"))}</span><div class="bt-row">${lv.map((n) => `<div class="bt-page" data-id="${id.get(n)}">${n.keys.map((k) => `<span class="bt-key${!n.kids && k === find ? " target" : ""}">${esc(cellText(k))}</span>`).join("")}</div>`).join("")}</div></div>`).join("")}</div>
      <p class="bt-what" aria-live="polite"></p>
      <div class="bt-cmp"><span>${esc(t("btree.index"))} <b class="bt-n">0</b></span><span>${esc(t("btree.scan", { n: keys.length }))}</span></div>
    </div>`;
  const what = fig.querySelector(".bt-what"), nEl = fig.querySelector(".bt-n");
  stepper(fig, path.length + 1, (i) => {
    fig.querySelectorAll(".bt-page").forEach((el) => { el.classList.remove("now", "seen"); });
    path.slice(0, i + 1).forEach((n, k) => { const el = fig.querySelector(`[data-id="${id.get(n)}"]`); if (el) el.classList.add(k === Math.min(i, path.length - 1) ? "now" : "seen"); });
    nEl.textContent = String(Math.min(i + 1, path.length));
    if (i >= path.length) { what.innerHTML = rich(t("btree.found", { k: cellText(find), n: path.length })); return; }
    const n = path[i];
    what.innerHTML = n.kids ? rich(t("btree.go", { k: cellText(find), keys: n.keys.map((x) => cellText(x)).join(", ") })) : rich(t("btree.leafHere", { k: cellText(find) }));
  }, t, spec.speed || 1300);
}

// ── Two sessions in time: what each one sees, and what the database keeps ──────
function txnFig(fig, spec, t) {
  const lanes = spec.lanes || [t("txn.a"), t("txn.b")];
  const steps = spec.steps || [];
  fig.innerHTML = `${head(spec)}<div class="tx">
      <div class="tx-grid" style="--lanes:${lanes.length}">${lanes.map((l) => `<p class="tx-lane">${esc(l)}</p>`).join("")}
        ${steps.map((s, i) => lanes.map((_, j) => `<div class="tx-cell${s.lane === j ? " has" : ""}" data-i="${i}">${s.lane === j ? `<code>${sql(s.sql)}</code>${s.sees ? `<span class="tx-sees">${rich(s.sees)}</span>` : ""}` : ""}</div>`).join("")).join("")}
      </div>
      <div class="tx-db"><p class="pane-k">${esc(t("txn.db"))}</p><p class="tx-state"></p></div>
      <p class="tx-what" aria-live="polite"></p>
    </div>`;
  const cells = fig.querySelectorAll(".tx-cell"), state = fig.querySelector(".tx-state"), what = fig.querySelector(".tx-what");
  stepper(fig, steps.length, (i) => {
    cells.forEach((c) => { const k = Number(c.dataset.i); c.classList.toggle("now", k === i && c.classList.contains("has")); c.classList.toggle("future", k > i); });
    let db = "";
    for (let k = 0; k <= i; k++) if (steps[k].db) db = steps[k].db;
    state.innerHTML = rich(db);
    what.innerHTML = rich(steps[i].note || "");
  }, t, spec.speed || 1700);
}

// ── Three-valued logic: TRUE, FALSE and NULL ───────────────────────────────
function logicFig(fig, spec, t) {
  const V = ["TRUE", "FALSE", "NULL"];
  const and = (a, b) => (a === "FALSE" || b === "FALSE" ? "FALSE" : a === "NULL" || b === "NULL" ? "NULL" : "TRUE");
  const or = (a, b) => (a === "TRUE" || b === "TRUE" ? "TRUE" : a === "NULL" || b === "NULL" ? "NULL" : "FALSE");
  const not = (a) => (a === "NULL" ? "NULL" : a === "TRUE" ? "FALSE" : "TRUE");
  const c = (v) => `<td class="lg-${v.toLowerCase()}">${v}</td>`;
  const grid = (name, f) => `<table class="lg"><thead><tr><th>${name}</th>${V.map((v) => `<th>${v}</th>`).join("")}</tr></thead><tbody>${V.map((a) => `<tr><th>${a}</th>${V.map((b) => c(f(a, b))).join("")}</tr>`).join("")}</tbody></table>`;
  const ops = spec.ops || ["and", "or", "not"];
  fig.innerHTML = `${head(spec)}<div class="lgs">${ops.map((o) => o === "not" ? `<table class="lg"><thead><tr><th>x</th><th>NOT x</th></tr></thead><tbody>${V.map((a) => `<tr><th>${a}</th>${c(not(a))}</tr>`).join("")}</tbody></table>` : grid(o.toUpperCase(), o === "and" ? and : or)).join("")}</div>`;
}

// ── A correlated subquery: the inner query runs again for every outer row ─────
// spec comes from the build: outer cols/rows, subs (the inner value per row), kept (row stays).
const literal = (v) => (v === null || v === undefined ? "NULL" : typeof v === "number" ? cellText(v) : `'${String(v).replace(/'/g, "''")}'`);
function correlatedFig(fig, spec, t) {
  const cols = spec.cols || [], rows = spec.rows || [], subs = spec.subs || [], kept = spec.kept || [];
  const subName = spec.subLabel || t("cq.sub");
  const innerFor = (r) => String(spec.inner || "").replace(/:([A-Za-z_]\w*)/g, (m, c) => (cols.includes(c) ? literal(r[cols.indexOf(c)]) : m));
  fig.innerHTML = `${head(spec)}<div class="cq">
      <pre class="code sql-q"><code>${sql(spec.query || "")}</code></pre>
      <div class="cq-grid">
        <div class="cq-outer"><p class="pane-k">${esc(t("cq.outer"))}</p><div class="rt-scroll"><table class="rt-t cq-t"><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join("")}<th class="cq-subh">${esc(subName)}</th></tr></thead>
          <tbody>${rows.map((r) => `<tr>${r.map((v) => (v === null ? '<td class="null">NULL</td>' : `<td${typeof v === "number" ? ' class="num"' : ""}>${esc(cellText(v))}</td>`)).join("")}<td class="cq-v num"></td></tr>`).join("")}</tbody></table></div></div>
        <div class="cq-inner"><p class="pane-k">${esc(t("cq.inner"))}</p><pre class="code cq-code"><code></code></pre><p class="cq-val"></p></div>
      </div>
      <p class="cq-what" aria-live="polite"></p>
    </div>`;
  const trs = [...fig.querySelectorAll(".cq-t tbody tr")], code = fig.querySelector(".cq-code code"), val = fig.querySelector(".cq-val"), what = fig.querySelector(".cq-what");
  const n = rows.length;
  stepper(fig, n + 1, (i) => {
    trs.forEach((tr, k) => {
      const done = i >= n || k <= i;
      tr.classList.toggle("now", k === i);
      tr.classList.toggle("hit", done && k !== i && kept[k]);
      tr.classList.toggle("out", done && k !== i && !kept[k]);
      tr.querySelector(".cq-v").textContent = done ? cellText(subs[k], typeof subs[k] === "number" && !Number.isInteger(subs[k]) ? "r" : undefined) : "";
    });
    if (i >= n) {
      code.innerHTML = sql(spec.inner || "");
      val.innerHTML = "";
      what.innerHTML = rich(t("cq.done", { n, k: kept.filter(Boolean).length }));
      return;
    }
    code.innerHTML = sql(innerFor(rows[i]));
    const sv = subs[i];
    val.innerHTML = `<span>${esc(t("cq.gives"))}</span> <b>${esc(cellText(sv, typeof sv === "number" && !Number.isInteger(sv) ? "r" : undefined))}</b>`;
    what.innerHTML = rich(t(kept[i] ? "cq.keep" : "cq.drop", { i: i + 1 })) + ` <span class="jn-cmp">${esc(t("cq.ran", { n: i + 1 }))}</span>`;
  }, t, spec.speed || 1500);
}

// ── Set operations: two lists, a Venn diagram, and what each operator keeps ───
let setsN = 0;
function setsFig(fig, spec, t) {
  const cid = `vn-ca-${++setsN}`;
  const A = spec.a.rows || [], B = spec.b.rows || [];
  const key = (v) => (v === null ? "\u0000" : typeof v + ":" + v);
  const uniq = (list) => { const seen = new Map(); for (const v of list) if (!seen.has(key(v))) seen.set(key(v), v); return [...seen.values()]; };
  const inB = new Set(B.map(key)), inA = new Set(A.map(key));
  const cmp = (x, y) => (x === null ? -1 : y === null ? 1 : x < y ? -1 : x > y ? 1 : 0);
  const count = (list, v) => list.filter((x) => key(x) === key(v)).length;
  const onlyA = uniq(A).filter((v) => !inB.has(key(v))).sort(cmp), both = uniq(A).filter((v) => inB.has(key(v))).sort(cmp), onlyB = uniq(B).filter((v) => !inA.has(key(v))).sort(cmp);
  const OPS = {
    union: { sql: "UNION", rows: [...onlyA, ...both, ...onlyB].sort(cmp), lit: ["a", "ab", "b"] },
    union_all: { sql: "UNION ALL", rows: [...A, ...B], lit: ["a", "ab", "b"] },
    intersect: { sql: "INTERSECT", rows: both, lit: ["ab"] },
    except: { sql: "EXCEPT", rows: onlyA, lit: ["a"] },
  };
  const ops = (spec.ops || ["union", "union_all", "intersect", "except"]).filter((o) => OPS[o]);
  const chips = (list, from) => list.map((v) => { const n = from.map((l) => count(l, v)).reduce((a, b) => a + b, 0); return `<span class="vn-chip">${v === null ? '<i class="vn-null">NULL</i>' : esc(cellText(v))}${n > 1 ? `<small>×${n}</small>` : ""}</span>`; }).join("");
  const la = spec.a.label || "A", lb = spec.b.label || "B";
  fig.innerHTML = `${head(spec)}<div class="vn">
      <pre class="code sql-q vn-q"><code></code></pre>
      <div class="vn-venn">
        <svg viewBox="0 0 240 120" class="vn-svg" aria-hidden="true">
          <defs><clipPath id="${cid}"><circle cx="90" cy="60" r="52"/></clipPath></defs>
          <circle class="vn-a" cx="90" cy="60" r="52"/><circle class="vn-b" cx="150" cy="60" r="52"/>
          <circle class="vn-ab" cx="150" cy="60" r="52" clip-path="url(#${cid})"/>
          <circle class="vn-ring" cx="90" cy="60" r="52"/><circle class="vn-ring" cx="150" cy="60" r="52"/>
          <text x="62" y="65" class="vn-lab" text-anchor="middle">A</text><text x="178" y="65" class="vn-lab" text-anchor="middle">B</text>
        </svg>
        <div class="vn-cols">
          <div class="vn-col" data-r="a"><p class="pane-k">${esc(t("sets.onlyA", { a: `A · ${la}` }))}</p><div>${chips(onlyA, [A])}</div></div>
          <div class="vn-col" data-r="ab"><p class="pane-k">${esc(t("sets.both"))}</p><div>${chips(both, [A, B])}</div></div>
          <div class="vn-col" data-r="b"><p class="pane-k">${esc(t("sets.onlyB", { b: `B · ${lb}` }))}</p><div>${chips(onlyB, [B])}</div></div>
        </div>
      </div>
      <p class="vn-what" aria-live="polite"></p>
      <div class="vn-out"><p class="pane-k vn-n"></p><div class="vn-res"></div></div>
    </div>`;
  const q = fig.querySelector(".vn-q code"), what = fig.querySelector(".vn-what"), res = fig.querySelector(".vn-res"), nEl = fig.querySelector(".vn-n"), box = fig.querySelector(".vn");
  stepper(fig, ops.length, (i) => {
    const o = OPS[ops[i]];
    box.dataset.op = ops[i];
    q.innerHTML = sql(spec.a.query && spec.b.query ? `${spec.a.query.trim()}
${o.sql}
${spec.b.query.trim()}` : `A ${o.sql} B`);
    fig.querySelectorAll(".vn-col").forEach((c) => c.classList.toggle("lit", o.lit.includes(c.dataset.r)));
    what.innerHTML = rich(t(`sets.${ops[i]}`));
    nEl.textContent = t("sql.rows", { n: o.rows.length });
    res.innerHTML = o.rows.map((v) => `<span class="vn-chip">${v === null ? '<i class="vn-null">NULL</i>' : esc(cellText(v))}</span>`).join("") || `<span class="sq-empty">${esc(t("sets.none"))}</span>`;
  }, t, spec.speed || 2200);
}

// ── WITH: named steps, each one a table the next one reads ─────────────────────
function cteFig(fig, spec, t) {
  const steps = spec.steps || [];
  const table = (s) => `<div class="rt-scroll"><table class="rt-t"><thead><tr>${s.cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${s.rows.map((r, j) => `<tr>${r.map((v, k) => (v === null ? '<td class="null">NULL</td>' : `<td${typeof v === "number" ? ' class="num"' : ""}>${esc(cellText(v, s.kinds && s.kinds[j] && s.kinds[j][k]))}</td>`)).join("")}</tr>`).join("") || `<tr><td class="rt-empty" colspan="${s.cols.length}">${esc(t("sets.none"))}</td></tr>`}</tbody></table></div>`;
  fig.innerHTML = `${head(spec)}<div class="ct">
      <ol class="ct-chain">${steps.map((s, i) => `<li class="ct-box${s.name ? "" : " ct-final"}" data-i="${i}">
        <p class="ct-name">${s.name ? `<code>${esc(s.name)}</code>` : esc(t("cte.final"))}<span>${esc(t("sql.rows", { n: s.total }))}</span></p>
        <pre class="code ct-sql"><code>${sql(s.sql)}</code></pre>
        ${table(s)}${s.total > s.rows.length ? `<p class="ct-more">${esc(t("cte.more", { n: s.total - s.rows.length }))}</p>` : ""}
      </li>`).join("")}</ol>
      <p class="ct-what" aria-live="polite"></p>
    </div>`;
  const boxes = fig.querySelectorAll(".ct-box"), what = fig.querySelector(".ct-what");
  stepper(fig, steps.length, (i) => {
    boxes.forEach((b, k) => { b.classList.toggle("now", k === i); b.classList.toggle("later", k > i); });
    const s = steps[i];
    what.innerHTML = rich(s.name ? t(i ? "cte.next" : "cte.first", { name: s.name, n: s.total, prev: i ? steps[i - 1].name : "" }) : t("cte.end", { n: s.total }));
  }, t, spec.speed || 2200);
}

// ── The case files ────────────────────────────────────────────────────────
function settingFig(fig, spec, t, ctx) {
  const marks = spec.marks || [];
  const paint = () => {
    fig.querySelector(".sc-art").innerHTML = sceneSvg(spec.place, { marks, passed, lang: ctx.lang, alt: spec.alt || spec.caption || "" });
    fig.querySelector(".sc-legend").innerHTML = marks.map((m, i) => {
      const on = !m.by || passed(m.by);
      return `<li class="${on ? "on" : ""}"><b>${on ? i + 1 : "?"}</b><span>${on ? rich(m.label) : esc(t("case.pending"))}</span></li>`;
    }).join("");
  };
  fig.innerHTML = `${head(spec)}<div class="sc"><div class="sc-art"></div>${marks.length ? '<ol class="sc-legend"></ol>' : '<ol class="sc-legend" hidden></ol>'}</div>`;
  paint();
  const again = () => fig.isConnected && paint();
  document.addEventListener("sql:progress", again);
}

function card(s, t, extra = "") {
  const hidden = s.appears_by && !passed(s.appears_by);
  const cleared = s.cleared_by && passed(s.cleared_by);
  const caught = s.culprit && s.reveal_by && passed(s.reveal_by);
  return `<article class="dos${cleared ? " cleared" : ""}${caught ? " caught" : ""}${hidden ? " hidden" : ""}" data-name="${esc(s.name)}" style="--tilt:${(([...s.name].reduce((a, c) => a + c.charCodeAt(0), 0) % 5) - 2) * 0.7}deg">
      <span class="pin" aria-hidden="true"></span>
      <div class="dos-face">${hidden ? sprite("unknown", s.name, { size: 56 }) : sprite(s.kind || "person", s.name, { size: 56, traits: s.traits || {}, label: s.name })}</div>
      <div class="dos-body"><h4>${esc(hidden ? (s.alias || "?") : s.name)}</h4>${s.role && !hidden ? `<p class="dos-role">${rich(s.role)}</p>` : ""}
        ${s.rows && !hidden ? `<dl>${s.rows.map(([k, v]) => `<dt>${rich(k)}</dt><dd>${rich(v)}</dd>`).join("")}</dl>` : ""}
        ${s.alibi && !hidden ? `<p class="dos-alibi"><span>${esc(t("case.alibi"))}</span> ${rich(s.alibi)}</p>` : ""}${extra}</div>
      ${cleared ? `<span class="stamp clear">${esc(t("case.cleared"))}</span>` : ""}${caught ? `<span class="stamp guilty">${esc(t("case.culprit"))}</span>` : ""}
    </article>`;
}

function dossierFig(fig, spec, t) {
  fig.innerHTML = `${head(spec)}<div class="dossiers">${(spec.cards || []).map((s) => card(s, t, s.quote ? `<blockquote class="dos-quote">${rich(s.quote)}</blockquote>` : "")).join("")}</div>`;
}

// spec: { title, place, marks, suspects: [...], clues: [{ text, by, links: [names] }] }
export function caseboard(host, spec, t, ctx) {
  const wrap = document.createElement("div");
  wrap.className = "cb";
  host.append(wrap);
  const paint = () => {
    const clues = spec.clues || [];
    const found = clues.filter((c) => !c.by || passed(c.by)).length;
    wrap.innerHTML = `<div class="cb-head"><p class="cb-t">${rich(spec.title || "")}</p><p class="cb-n">${esc(t("case.found", { n: found, total: clues.length }))}</p></div>
      ${spec.place ? `<div class="cb-scene">${sceneSvg(spec.place, { marks: spec.marks || [], passed, lang: ctx.lang, alt: spec.title || "" })}</div>` : ""}
      <div class="cb-cork"><svg class="cb-strings" aria-hidden="true"></svg>
        ${spec.witnesses ? `<p class="cb-k">${esc(t("case.witnesses"))}</p><div class="cb-suspects cb-witnesses">${spec.witnesses.map((s) => card(s, t)).join("")}</div>` : ""}
        <p class="cb-k">${esc(t("case.suspects"))}</p>
        <div class="cb-suspects">${(spec.suspects || []).map((s) => card(s, t)).join("")}</div>
        <ol class="cb-clues">${clues.map((c, i) => { const on = !c.by || passed(c.by); return `<li class="cb-clue${on ? " on" : ""}" data-i="${i}" style="--tilt:${((i * 7) % 5 - 2) * 0.8}deg">${on ? `<b>${i + 1}</b><span>${rich(c.text)}</span>` : `<b>?</b><span>${esc(t("case.pending"))}${c.where ? ` · ${rich(c.where)}` : ""}</span>`}</li>`; }).join("")}</ol>
      </div>`;
    requestAnimationFrame(strings);
  };
  const strings = () => {
    const cork = wrap.querySelector(".cb-cork");
    if (!cork || !cork.isConnected) return;
    const box = cork.getBoundingClientRect();
    const svg = wrap.querySelector(".cb-strings");
    svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    svg.style.width = `${box.width}px`;
    svg.style.height = `${box.height}px`;
    const out = [];
    (spec.clues || []).forEach((c, i) => {
      if (c.by && !passed(c.by)) return;
      const from = wrap.querySelector(`.cb-clue[data-i="${i}"]`);
      for (const name of c.links || []) {
        const to = wrap.querySelector(`.dos[data-name="${CSS.escape(name)}"] .pin`);
        if (!from || !to) continue;
        const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
        const ax = a.left + 10 - box.left, ay = a.top + 6 - box.top, bx = b.left + b.width / 2 - box.left, by = b.top + b.height / 2 - box.top;
        out.push(`<path d="M${ax} ${ay} Q ${(ax + bx) / 2} ${Math.max(ay, by) + 18}, ${bx} ${by}"/>`);
      }
    });
    svg.innerHTML = out.join("");
  };
  paint();
  const ro = new ResizeObserver(() => requestAnimationFrame(strings));
  ro.observe(wrap);
  document.addEventListener("sql:progress", () => wrap.isConnected && paint());
  return wrap;
}
function caseboardFig(fig, spec, t, ctx) {
  fig.innerHTML = head(spec);
  caseboard(fig, spec, t, ctx);
}

// ── Statements that change data: each table before and after, row by row ─────────
// spec.start and spec.steps come from the build: [{ sql, after: { table: { cols, ids, rows } }, ret, error }].
function changeFig(fig, spec, t) {
  const steps = spec.steps || [];
  const names = Object.keys(spec.start || {});
  fig.innerHTML = `${head(spec)}<div class="chg">
      <pre class="code chg-q"><code>${steps.map((s, i) => `<span class="chg-s" data-i="${i}">${sql(s.sql)}</span>`).join("\n")}</code></pre>
      <p class="chg-what" aria-live="polite"></p>
      <div class="chg-tables"></div>
    </div>`;
  const what = fig.querySelector(".chg-what"), box = fig.querySelector(".chg-tables");
  const cell = (v, k) => (v === null || v === undefined ? '<span class="null">NULL</span>' : esc(cellText(v, k)));
  const table = (name, prev, now) => {
    if (!now) return `<div class="chg-t"><p class="pane-k">${esc(name)}</p><p class="chg-none">${esc(t("change.noTable"))}</p></div>`;
    const ids = [...new Set([...(prev ? prev.ids : []), ...now.ids])].sort((a, b) => a - b);
    const at = (tb, id) => (tb ? tb.ids.indexOf(id) : -1);
    let n = { ins: 0, del: 0, upd: 0 };
    const rows = ids.map((id) => {
      const a = at(prev, id), b = at(now, id);
      if (b < 0) { n.del++; return `<tr class="del">${prev.rows[a].map((v, j) => `<td>${cell(v, prev.kinds && prev.kinds[a] && prev.kinds[a][j])}</td>`).join("")}</tr>`; }
      if (a < 0 && prev) { n.ins++; return `<tr class="ins">${now.rows[b].map((v, j) => `<td>${cell(v, now.kinds && now.kinds[b] && now.kinds[b][j])}</td>`).join("")}</tr>`; }
      let changed = false;
      const tds = now.rows[b].map((v, j) => {
        const old = prev ? prev.rows[a][j] : v;
        if (old === v) return `<td>${cell(v, now.kinds && now.kinds[b] && now.kinds[b][j])}</td>`;
        changed = true;
        return `<td class="upd"><s>${cell(old, prev.kinds && prev.kinds[a] && prev.kinds[a][j])}</s> ${cell(v, now.kinds && now.kinds[b] && now.kinds[b][j])}</td>`;
      }).join("");
      if (changed) n.upd++;
      return `<tr class="${changed ? "upd" : ""}">${tds}</tr>`;
    }).join("");
    const tag = [n.ins && t("change.ins", { n: n.ins }), n.upd && t("change.upd", { n: n.upd }), n.del && t("change.del", { n: n.del })].filter(Boolean).join(" · ");
    return `<div class="chg-t"><p class="pane-k">${esc(name)}${tag ? ` <span class="chg-tag">${esc(tag)}</span>` : ""}</p>
      <div class="rt-scroll"><table class="rt-t chg-rows"><thead><tr>${now.cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${rows || `<tr><td class="rt-empty" colspan="${now.cols.length || 1}">${esc(t("change.empty"))}</td></tr>`}</tbody></table></div></div>`;
  };
  stepper(fig, steps.length + 1, (i) => {
    fig.querySelectorAll(".chg-s").forEach((el) => { const k = Number(el.dataset.i); el.classList.toggle("now", k === i - 1); el.classList.toggle("done", k < i - 1); });
    const prev = i <= 1 ? spec.start : steps[i - 2].after;
    const now = i === 0 ? spec.start : steps[i - 1].after;
    const s = i ? steps[i - 1] : null;
    what.innerHTML = !s ? rich(t("change.start")) : s.error ? `<span class="chg-err">${rich(t("change.error", { msg: s.error }))}</span>` : rich((spec.notes && spec.notes[i - 1]) || t("change.done"));
    what.classList.toggle("bad", !!(s && s.error));
    box.innerHTML = names.map((nm) => table(nm, i === 0 ? null : prev[nm], now[nm])).join("") +
      (s && s.ret ? `<div class="chg-t chg-ret"><p class="pane-k">${esc(/^\s*(SELECT|WITH)\b/i.test(s.sql) ? t("change.result") : t("change.returning"))}</p><div class="rt-scroll"><table class="rt-t"><thead><tr>${s.ret.cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${s.ret.rows.map((r) => `<tr>${r.map((v) => `<td>${cell(v)}</td>`).join("")}</tr>`).join("") || `<tr><td class="rt-empty" colspan="${s.ret.cols.length}">${esc(t("change.empty"))}</td></tr>`}</tbody></table></div></div>` : "");
  }, t, spec.speed || 2200);
}

// ── Porting a query: one dialect on the left, the other on the right, piece by piece ──
function portFig(fig, spec, t) {
  const steps = spec.steps || [];
  fig.innerHTML = `${head(spec)}<div class="prt">
      <div class="prt-cols">
        <div><p class="pane-k">${esc(spec.from || "PostgreSQL")}</p><pre class="code"><code>${steps.map((s, i) => `<span class="prt-l" data-i="${i}">${sql(s.a)}</span>`).join("\n")}</code></pre></div>
        <div><p class="pane-k">${esc(spec.to || "SQLite")}</p><pre class="code"><code>${steps.map((s, i) => `<span class="prt-l" data-i="${i}">${sql(s.b)}</span>`).join("\n")}</code></pre></div>
      </div>
      <p class="prt-what" aria-live="polite"></p>
    </div>`;
  const what = fig.querySelector(".prt-what");
  stepper(fig, steps.length, (i) => {
    fig.querySelectorAll(".prt-l").forEach((el) => { const k = Number(el.dataset.i); el.classList.toggle("now", k === i); el.classList.toggle("future", k > i); });
    what.innerHTML = rich(steps[i].note || "");
  }, t, spec.speed || 2200);
}

// ── WITH RECURSIVE: the anchor runs once, then the recursive part feeds on the last round ─────
// spec.result comes from the build; spec.by names the column that counts the rounds (0 = anchor).
function recursionFig(fig, spec, t) {
  const res = spec.result || { cols: [], rows: [] };
  const by = res.cols.indexOf(spec.by);
  const cte = spec.cte || (/WITH\s+RECURSIVE\s+(\w+)/i.exec(spec.query || "") || [])[1] || "";
  const lines = String(spec.query || "").replace(/\n+$/, "").split("\n");
  const u = lines.findIndex((l) => /^\s*UNION(\s+ALL)?\s*$/i.test(l));
  let a0 = u;
  while (a0 > 0 && !/\bAS\s*\(\s*$/i.test(lines[a0 - 1])) a0--;
  let r1 = u + 1;
  while (r1 < lines.length && !/^\s*\)/.test(lines[r1])) r1++;
  const part = (k) => (u < 0 ? "" : k >= a0 && k < u ? "anchor" : k > u && k < r1 ? "rec" : "");
  const base = res.rows.length ? Math.min(...res.rows.map((r) => Number(r[by]) || 0)) : 0;
  const roundOf = (r) => (Number(r[by]) || 0) - base;
  const rounds = [];
  res.rows.forEach((r, i) => { (rounds[roundOf(r)] ||= []).push(i); });
  for (let k = 0; k < rounds.length; k++) rounds[k] ||= [];
  const n = rounds.length;
  const cell = (v, kind) => (v === null ? '<td class="null">NULL</td>' : `<td${typeof v === "number" ? ' class="num"' : ""}>${esc(cellText(v, kind))}</td>`);
  fig.innerHTML = `${head(spec)}<div class="rc">
      <pre class="code rc-q"><code>${lines.map((l, k) => `<span class="rc-l" data-p="${part(k)}">${sql(l)}</span>`).join("\n")}</code></pre>
      <ol class="rc-rounds">${rounds.map((ids, k) => `<li data-k="${k}"><b>${esc(t(k ? "rec.round" : "rec.anchor", { k }))}</b><span>${esc(t(ids.length === 1 ? "sql.row1" : "sql.rows", { n: ids.length }))}</span></li>`).join("")}<li data-k="${n}" class="rc-stop"><b>${esc(t("rec.round", { k: n }))}</b><span>${esc(t("sql.rows", { n: 0 }))}</span></li></ol>
      <p class="rc-what" aria-live="polite"></p>
      <div class="rt-scroll rc-out"><table class="rt-t"><thead><tr>${res.cols.map((c, k) => `<th${k === by ? ' class="key"' : ""}>${esc(c)}</th>`).join("")}</tr></thead>
        <tbody>${res.rows.map((r, i) => `<tr data-k="${roundOf(r)}" class="g${roundOf(r) % 8}">${r.map((v, k) => cell(v, res.kinds && res.kinds[i] && res.kinds[i][k])).join("")}</tr>`).join("")}</tbody></table></div>
    </div>`;
  const ls = fig.querySelectorAll(".rc-l"), chips = fig.querySelectorAll(".rc-rounds li"), trs = fig.querySelectorAll(".rc-out tbody tr"), what = fig.querySelector(".rc-what");
  stepper(fig, n + 1, (i) => {
    ls.forEach((l) => l.classList.toggle("now", l.dataset.p === (i === 0 ? "anchor" : "rec")));
    chips.forEach((c) => { const k = Number(c.dataset.k); c.classList.toggle("now", k === i && c.classList.contains("has")); c.classList.toggle("done", k < i); c.classList.toggle("later", k > i); });
    trs.forEach((tr) => { const k = Number(tr.dataset.k); tr.hidden = k > i; tr.classList.toggle("fresh", k === i); });
    const total = rounds.slice(0, i + 1).reduce((s, x) => s + x.length, 0);
    what.innerHTML = rich(i === 0 ? t("rec.first", { n: rounds[0].length, cte }) : i < n ? t("rec.step", { k: i, prev: rounds[i - 1].length, n: rounds[i].length, cte }) : t("rec.end", { k: i, prev: rounds[i - 1].length, total: res.rows.length, cte })) + (i < n ? ` <span class="jn-cmp">${esc(t("rec.sofar", { n: total }))}</span>` : "");
  }, t, spec.speed || 1600);
}

// ── Join algorithms: nested loop, hash join and merge join on the same two tables ──────────────
// spec: { left, right: { name, cols, rows }, on: [lcol, rcol], algo: nested | hash | merge, buckets }
function joinAlgoFig(fig, spec, t) {
  const L = spec.left, Rt = spec.right, algo = spec.algo || "hash";
  const li = L.cols.indexOf(spec.on[0]), ri = Rt.cols.indexOf(spec.on[1]);
  const B = spec.buckets || 4;
  const bucketOf = (v) => (typeof v === "number" ? Math.abs(v) % B : [...String(v)].reduce((s, c) => s + c.charCodeAt(0), 0) % B);
  const cmpKey = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  const lOrder = L.rows.map((_, i) => i), rOrder = Rt.rows.map((_, j) => j);
  if (algo === "merge") { lOrder.sort((a, b) => cmpKey(L.rows[a][li], L.rows[b][li]) || a - b); rOrder.sort((a, b) => cmpKey(Rt.rows[a][ri], Rt.rows[b][ri]) || a - b); }
  const steps = [], out = [];
  let cmp = 0;
  const emit = (i, j) => out.push([...L.rows[i], ...Rt.rows[j]]);
  if (algo === "nested") {
    L.rows.forEach((lr, i) => {
      const hits = [];
      Rt.rows.forEach((rr, j) => { cmp++; if (lr[li] !== null && lr[li] === rr[ri]) { hits.push(j); emit(i, j); } });
      steps.push({ phase: "probe", l: i, hits, look: Rt.rows.map((_, j) => j), cmp, out: out.length, key: lr[li], msg: hits.length ? "algo.nestedHit" : "algo.nestedMiss" });
    });
  } else if (algo === "hash") {
    const buckets = Array.from({ length: B }, () => []);
    Rt.rows.forEach((rr, j) => { if (rr[ri] === null) return; const b = bucketOf(rr[ri]); buckets[b].push(j); steps.push({ phase: "build", r: j, b, buckets: buckets.map((x) => [...x]), cmp, out: 0, key: rr[ri], msg: "algo.build" }); });
    const full = buckets.map((x) => [...x]);
    L.rows.forEach((lr, i) => {
      if (lr[li] === null) { steps.push({ phase: "probe", l: i, b: null, buckets: full, hits: [], look: [], cmp, out: out.length, key: null, msg: "algo.probeNull" }); return; }
      const b = bucketOf(lr[li]);
      const hits = [];
      for (const j of full[b]) { cmp++; if (Rt.rows[j][ri] === lr[li]) { hits.push(j); emit(i, j); } }
      steps.push({ phase: "probe", l: i, b, buckets: full, hits, look: full[b], cmp, out: out.length, key: lr[li], msg: hits.length ? "algo.probeHit" : "algo.probeMiss" });
    });
  } else {
    steps.push({ phase: "sort", cmp, out: 0, msg: "algo.sorted" });
    let a = 0, b = 0;
    while (a < lOrder.length && b < rOrder.length) {
      const i = lOrder[a], j = rOrder[b], x = L.rows[i][li], y = Rt.rows[j][ri];
      cmp++;
      if (x === null) { a++; continue; }
      if (y === null || x > y) { steps.push({ phase: "merge", l: i, r: j, cmp, out: out.length, key: x, other: y, msg: "algo.mergeRight" }); b++; continue; }
      if (x < y) { steps.push({ phase: "merge", l: i, r: j, cmp, out: out.length, key: x, other: y, msg: "algo.mergeLeft" }); a++; continue; }
      const hits = [];
      for (let k = b; k < rOrder.length && Rt.rows[rOrder[k]][ri] === x; k++) { if (k > b) cmp++; hits.push(rOrder[k]); emit(i, rOrder[k]); }
      steps.push({ phase: "merge", l: i, r: j, hits, cmp, out: out.length, key: x, msg: "algo.mergeHit" });
      a++;
    }
  }
  steps.push({ phase: "done", cmp, out: out.length, msg: "algo.done" });
  const tbl = (T, side, key, order) => `<div class="jn-side"><p class="pane-k">${esc(T.name)}</p><div class="rt-scroll"><table class="rt-t jn-t" data-side="${side}"><thead><tr>${T.cols.map((c, k) => `<th${k === key ? ' class="key"' : ""}>${esc(c)}</th>`).join("")}</tr></thead><tbody>${order.map((x) => `<tr data-i="${x}">${T.rows[x].map((v, k) => (v === null ? `<td class="null${k === key ? " key" : ""}">NULL</td>` : `<td${k === key ? ' class="key"' : ""}>${esc(cellText(v))}</td>`)).join("")}</tr>`).join("")}</tbody></table></div></div>`;
  const cols = [...L.cols.map((c) => `${L.name}.${c}`), ...Rt.cols.map((c) => `${Rt.name}.${c}`)];
  fig.innerHTML = `${head(spec)}<div class="jn ja">
      ${spec.query ? `<pre class="code sql-q"><code>${sql(spec.query)}</code></pre>` : ""}
      <div class="jn-pair">${tbl(L, "l", li, lOrder)}${tbl(Rt, "r", ri, rOrder)}</div>
      ${algo === "hash" ? `<div class="gb-buckets ja-buckets">${Array.from({ length: B }, (_, b) => `<div class="gb-b g${b % 8}" data-b="${b}"><p class="gb-k">${esc(t("algo.bucket", { b }))}</p><div class="gb-rows"></div></div>`).join("")}</div>` : ""}
      <p class="jn-what" aria-live="polite"></p>
      <p class="ja-count"><span>${esc(t("algo.compared"))} <b class="ja-n">0</b></span><span>${esc(t("algo.nestedWould", { n: L.rows.length * Rt.rows.length }))}</span></p>
      <div class="jn-out"><p class="pane-k">${esc(t("join.result"))}</p><div class="rt-scroll"><table class="rt-t"><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody></tbody></table></div></div>
    </div>`;
  const lRows = fig.querySelectorAll('[data-side="l"] tbody tr'), rRows = fig.querySelectorAll('[data-side="r"] tbody tr');
  const body = fig.querySelector(".jn-out tbody"), what = fig.querySelector(".jn-what"), nEl = fig.querySelector(".ja-n"), bks = fig.querySelectorAll(".ja-buckets .gb-b");
  stepper(fig, steps.length, (s) => {
    const st = steps[s];
    lRows.forEach((tr) => { const i = Number(tr.dataset.i); tr.classList.toggle("now", i === st.l); });
    rRows.forEach((tr) => { const j = Number(tr.dataset.i); tr.classList.toggle("now", j === st.r); tr.classList.toggle("hit", !!(st.hits && st.hits.includes(j))); tr.classList.toggle("miss", !!(st.look && st.look.includes(j) && !st.hits.includes(j))); });
    bks.forEach((el, b) => {
      const ids = st.buckets ? st.buckets[b] : [];
      el.querySelector(".gb-rows").innerHTML = ids.map((j) => `<span class="gb-chip${st.phase === "build" && j === st.r ? " new" : ""}">${esc(cellText(Rt.rows[j][ri]))}</span>`).join("");
      el.classList.toggle("now", st.b === b);
      el.classList.toggle("out", st.phase === "probe" && st.b !== null && st.b !== b);
    });
    nEl.textContent = String(st.cmp);
    const prev = s ? steps[s - 1].out : 0;
    body.innerHTML = out.slice(0, st.out).map((row, k) => `<tr class="${k >= prev ? "new" : ""}">${row.map((v) => (v === null ? '<td class="null">NULL</td>' : `<td>${esc(cellText(v))}</td>`)).join("")}</tr>`).join("");
    const key = (v) => (v === null || v === undefined ? "NULL" : cellText(v));
    what.innerHTML = rich(t(st.msg, { key: key(st.key), other: key(st.other), b: st.b ?? "", n: st.hits ? st.hits.length : 0, look: st.look ? st.look.length : 0, cmp: st.cmp, rows: st.out, all: L.rows.length * Rt.rows.length }));
  }, t, spec.speed || 1300);
}

export { sprite, sceneSvg };
