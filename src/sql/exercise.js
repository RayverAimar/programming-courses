// A live SQL exercise: the editor with schema-aware autocomplete, results as tables, the tests, and in
// the Taller a tool pane with three tabs: the query, the schema (ER diagram) and the case board.
// Cases and missions end by naming what the data shows; judges run the query on hidden databases.
import { createEditor } from "../editor.js";
import { runSql, judgeSql, buildSqlCases } from "../runner/sqlclient.js";
import { answerHash } from "../runner/hash.js";
import { resultTable, erDiagram, caseboard } from "./visuals.js";
import { cellText } from "./format.js";
import { icon } from "../../platform/web/core/dom.js";
import { md } from "../../platform/web/core/inline.js";

const ICON = { check: icon("check"), cross: icon("x"), play: icon("play"), bulb: icon("lightbulb"), stop: icon("octagon-alert"), send: icon("send") };
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const rich = (s) => md(s).replace(/\n/g, "<br>");
const progress = () => document.dispatchEvent(new CustomEvent("sql:progress"));

// The tool pane's tabs: Consulta, Esquema and (for a case step) Pizarra.
function tabs(tool, ex, t, lang) {
  const names = [["query", t("sql.tab.query")], ["schema", t("sql.tab.schema")], ...(ex.caseboard ? [["board", t("sql.tab.board")]] : [])];
  const bar = document.createElement("div");
  bar.className = "sq-tabs";
  bar.setAttribute("role", "tablist");
  bar.innerHTML = names.map(([k, label], i) => `<button role="tab" data-k="${k}" aria-selected="${i === 0}" id="sqt-${ex.id}-${k}">${esc(label)}</button>`).join("");
  const panels = Object.fromEntries(names.map(([k]) => {
    const p = document.createElement("div");
    p.className = `sq-panel sq-${k}`;
    p.setAttribute("role", "tabpanel");
    p.setAttribute("aria-labelledby", `sqt-${ex.id}-${k}`);
    p.hidden = k !== "query";
    return [k, p];
  }));
  tool.append(bar, ...Object.values(panels));
  let drawn = { query: true };
  const show = (k) => {
    bar.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.k === k)));
    for (const [n, p] of Object.entries(panels)) p.hidden = n !== k;
    if (!drawn[k]) {
      drawn[k] = true;
      if (k === "schema") schemaPanel(panels.schema, ex, t, lang);
      if (k === "board") caseboard(panels.board, ex.caseboard, t, { lang });
    }
  };
  bar.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) show(b.dataset.k); });
  return { panels, show };
}

function schemaPanel(host, ex, t, lang) {
  const judge = ex.type === "judge" && ex.judgeTables && ex.judgeTables.length;
  host.insertAdjacentHTML("beforeend", `<p class="sq-note">${esc(judge ? t("sql.schemaJudge") : t("sql.schemaNote"))}</p>`);
  if (judge) {
    host.insertAdjacentHTML("beforeend", `<div class="er"><div class="er-grid">${ex.judgeTables.map((tb) => `<div class="er-t"><p class="er-name">${esc(tb.name)}</p><ul>${tb.cols.map((c) => `<li><span class="er-k"></span><code>${esc(c.name)}</code><em>${esc(c.type)}</em></li>`).join("")}</ul></div>`).join("")}</div></div>`);
    return;
  }
  if (ex.ownTables && ex.ownTables.length) {
    erDiagram(host, null, lang, t, { compact: true, defs: ex.ownTables });
    if (ex.db === "empty") return;
  }
  erDiagram(host, ex.tables && ex.tables.length ? ex.tables : null, lang, t, { compact: true });
}

function results(host, r, t) {
  host.innerHTML = "";
  const list = (r.results || []).filter((x) => x.cols || x.changes !== undefined);
  if (!list.length) { host.innerHTML = `<p class="sq-empty">${esc(t("sql.noResults"))}</p>`; return; }
  const shown = list.length > 3 ? list.slice(-3) : list;
  shown.forEach((res, i) => {
    const box = document.createElement("div");
    box.className = "sq-res";
    if (list.length > 1) box.insertAdjacentHTML("beforeend", `<p class="sq-res-k">${esc(t("sql.statement", { n: list.indexOf(res) + 1, line: res.line }))}</p>`);
    box.append(resultTable(res, t, { cls: i === shown.length - 1 ? "last" : "" }));
    host.append(box);
  });
}

export function mountSqlExercise(root, ex, ctx, H) {
  const { t, lang, store, isPassed, markPassed } = ctx;
  if (ex.type === "predict") return mountPredict(root, ex, ctx, H);
  if (ex.type === "judge") return mountJudge(root, ex, ctx, H);
  const demo = ex.type === "demo";
  const answerable = ex.type === "case" || (ex.type === "mission" && ex.answerHash);
  const graded = !demo && ex.type !== "case";
  const saved = store.get(`code.${lang}.${ex.id}`, null);
  const runLabel = demo || ex.type === "case" ? t("ex.runDemo") : t("ex.run");
  root.insertAdjacentHTML("beforeend", `
    ${!ctx.panes && !demo ? `<details class="sq-schema-d"><summary>${esc(t("sql.tab.schema"))}</summary><div class="sq-schema-in"></div></details>` : ""}
    <div class="ex-editor"></div>
    <div class="ex-actions">
      <button class="btn btn-primary ex-run">${ICON.play}<span>${esc(runLabel)}</span></button>
      ${ex.hints && ex.hints.length ? `<button class="btn ex-hintbtn">${ICON.bulb}<span>${esc(t("ex.hint"))}</span></button>` : ""}
      <span class="ex-kbd">${esc(t("ex.shortcut", { key: H.modKey() }))}</span>
      ${demo ? "" : H.resetBtn(t)}
    </div>
    <ol class="ex-hints" hidden></ol>
    <div class="ex-out" hidden aria-live="polite"></div>
    <div class="sq-results" hidden aria-live="polite"></div>
    ${answerable ? `<form class="ex-answer sq-answer"${ex.type === "mission" && !isPassed(ex.id) ? " hidden" : ""}>
        <label for="ans-${ex.id}">${ex.answerLabel || esc(t("case.answer"))}</label>
        <div class="ex-answer-row"><input id="ans-${ex.id}" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done">
        <button class="btn btn-primary" type="submit">${esc(t("case.check"))}</button></div>
        <p class="ex-answer-msg" aria-live="polite"></p>
        ${ex.reveal ? `<div class="ex-reveal" ${isPassed(ex.id) ? "" : "hidden"}>${ex.reveal}</div>` : ""}
      </form>` : ""}
    ${ex.solutionHtml && !demo ? `<details class="sol"><summary><span class="sol-t">${esc(t("ex.solution"))}</span><span class="sol-h">${esc(t("ex.solutionHint"))}</span></summary>
        ${ex.solutionHtml}<p><button class="link ex-use">${esc(t("ex.useSolution"))}</button></p></details>` : ""}
    <div class="ex-unlock" hidden></div>`);

  let saveTimer = null;
  const editor = createEditor(root.querySelector(".ex-editor"), {
    doc: saved ?? ex.starter, label: t("ex.editor"), lang, track: "sql", tables: ex.ownTables || undefined, withSchema: ex.db !== "empty", onRun: () => run(),
    onChange: (code) => { clearTimeout(saveTimer); saveTimer = setTimeout(() => store.set(`code.${lang}.${ex.id}`, code === ex.starter ? null : code), 400); },
  });
  const out = root.querySelector(".ex-out"), res = root.querySelector(".sq-results"), runBtn = root.querySelector(".ex-run");
  const form = root.querySelector(".ex-answer");
  let busy = false;
  let queryOk = isPassed(ex.id);

  async function run() {
    if (busy) return;
    busy = true;
    runBtn.disabled = true;
    runBtn.querySelector("span").textContent = t("ex.running");
    const job = graded ? ex : { ...ex, tests: [], scenarios: [] };
    const r = await runSql(job, editor.get(), lang);
    busy = false;
    runBtn.disabled = false;
    runBtn.querySelector("span").textContent = runLabel;
    show(r);
    document.dispatchEvent(new CustomEvent("taller:run", { detail: { id: ex.id, logs: r.logs || [], pass: !!r.pass } }));
    if (!graded) return;
    if (ex.type === "mission" && ex.answerHash) {
      queryOk = !!r.pass;
      if (form) form.hidden = !r.pass && !isPassed(ex.id);
      if (r.pass && form) { form.querySelector(".ex-answer-msg").textContent = t("mission.nameIt"); form.querySelector("input").focus({ preventScroll: true }); }
      if (!r.pass) H.attempt(ctx, ex.id, false, (r.tests || []).filter((x) => !x.pass).map((x) => x.name).join(" · ") || (r.error && r.error.text) || null);
      return;
    }
    H.attempt(ctx, ex.id, !!r.pass, r.pass ? null : (r.tests || []).filter((x) => !x.pass).map((x) => x.name).join(" · ") || (r.error && r.error.text) || null);
    if (r.pass) {
      const first = !isPassed(ex.id);
      markPassed(ex.id);
      root.classList.add("passed");
      progress();
      if (ex.type === "mission") H.showUnlock(root, ex, ctx, first);
    }
  }

  function show(r) {
    const passN = (r.tests || []).filter((x) => x.pass).length, total = (r.tests || []).length;
    const verdict = graded ? `<p class="ex-verdict ${r.pass ? "ok" : "no"}">${r.pass ? ICON.check : ICON.cross}<span>${esc(r.pass ? (ex.type === "mission" && ex.answerHash ? t("mission.queryOk") : t("ex.pass")) : t("ex.fail", { n: passN, total }))}</span>
        ${r.scenarios > 1 && !r.pass ? `<span class="ex-scn">${esc(t("ex.scenario", { i: r.scenario + 1, n: r.scenarios }))}</span>` : ""}</p>` : "";
    const err = r.error ? `<div class="ex-error sql">${ICON.stop}<div><b>${esc(t("sql.error"))}</b><p>${rich(r.error.text)}</p></div></div>` : "";
    const tests = graded && total ? `<ul class="ex-tests">${r.tests.map((x) => `<li class="${x.pass ? "ok" : "no"}">${x.pass ? ICON.check : ICON.cross}<div><span>${esc(x.name)}</span>${!x.pass && x.msg ? `<p>${rich(x.msg)}</p>` : ""}</div></li>`).join("")}</ul>` : "";
    out.innerHTML = verdict + err + tests;
    out.hidden = !(verdict || err || tests);
    res.hidden = false;
    results(res, r, t);
  }

  const hintBtn = root.querySelector(".ex-hintbtn");
  if (hintBtn) {
    let shown = 0;
    const list = root.querySelector(".ex-hints");
    hintBtn.addEventListener("click", () => {
      if (shown >= ex.hints.length) return;
      list.hidden = false;
      list.insertAdjacentHTML("beforeend", `<li>${ex.hints[shown]}</li>`);
      shown++;
      hintBtn.querySelector("span").textContent = shown < ex.hints.length ? t("ex.hintN", { n: shown + 1, total: ex.hints.length }) : t("ex.hint");
      hintBtn.disabled = shown >= ex.hints.length;
    });
  }
  runBtn.addEventListener("click", run);
  const reset = root.querySelector(".ex-reset");
  if (reset) reset.addEventListener("click", () => { editor.set(ex.starter); store.set(`code.${lang}.${ex.id}`, null); out.hidden = true; res.hidden = true; });
  const use = root.querySelector(".ex-use");
  if (use) use.addEventListener("click", () => { editor.set(ex.solution); editor.view.focus(); });
  const sd = root.querySelector(".sq-schema-d");
  if (sd) sd.addEventListener("toggle", () => { const inn = sd.querySelector(".sq-schema-in"); if (sd.open && !inn.children.length) schemaPanel(inn, ex, t, lang); });

  if (form) {
    const input = form.querySelector("input"), msg = form.querySelector(".ex-answer-msg");
    input.addEventListener("input", () => { msg.textContent = ""; msg.className = "ex-answer-msg"; });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!input.value.trim()) return;
      const ok = answerHash(input.value) === ex.answerHash && (ex.type !== "mission" || queryOk);
      msg.textContent = ok ? t(ex.type === "mission" ? "mission.named" : "case.right") : t("case.wrong");
      msg.className = `ex-answer-msg ${ok ? "ok" : "no"}`;
      document.dispatchEvent(new CustomEvent("taller:answer", { detail: { id: ex.id, ok } }));
      H.attempt(ctx, ex.id, ok, ok ? null : input.value.trim());
      if (!ok) return;
      const first = !isPassed(ex.id);
      markPassed(ex.id);
      root.classList.add("passed");
      const rev = form.querySelector(".ex-reveal");
      if (rev) rev.hidden = false;
      progress();
      if (ex.type === "mission") H.showUnlock(root, ex, ctx, first);
      if (ctx.sqlTabs && ex.caseboard) setTimeout(() => ctx.sqlTabs.show("board"), 700);
    });
  }
  if (ex.type === "mission" && isPassed(ex.id)) H.showUnlock(root, ex, ctx, false);
  placeTool(root, ex, ctx, [".ex-editor", ".ex-actions", ".ex-hints", ".ex-out", ".sq-results"]);
}

// In the Taller the tool pane gets the tabs; the query tab takes the editor and what it shows.
function placeTool(root, ex, ctx, sels) {
  if (!ctx.panes) return;
  const tool = ctx.panes.tool;
  const tb = tabs(tool, ex, ctx.t, ctx.lang);
  ctx.sqlTabs = tb;
  for (const sel of sels) for (const el of root.querySelectorAll(`:scope > ${sel}`)) tb.panels.query.append(el);
  tool.classList.add("ex-toolpane", `ex-${root.classList[1]}-tool`, "sq-tool");
  root.classList.add("ex-split");
}

function mountPredict(root, ex, ctx, H) {
  const { t, lang, isPassed, markPassed } = ctx;
  root.insertAdjacentHTML("beforeend", `<div class="ex-code">${ex.codeHtml}</div>
    <div class="ex-options" role="group">${ex.options.map((o, i) => `<button class="ex-opt" data-i="${i}"><pre>${esc(o)}</pre></button>`).join("")}</div>
    <div class="ex-out" hidden aria-live="polite"></div>`);
  const out = root.querySelector(".ex-out");
  const opts = [...root.querySelectorAll(".ex-opt")];
  let answered = false;
  const paint = async (picked, fresh) => {
    if (answered) return;
    answered = true;
    const ok = picked === ex.answer;
    root.classList.add("answered");
    for (const b of opts) {
      const i = Number(b.dataset.i);
      b.classList.toggle("right", i === ex.answer);
      b.classList.toggle("wrong", i === picked && !ok);
      b.setAttribute("aria-pressed", String(i === picked));
      b.disabled = true;
    }
    if (fresh) H.attempt(ctx, ex.id, ok, ok ? null : ex.options[picked]);
    if (ok) { markPassed(ex.id); root.classList.add("passed"); }
    const r = await runSql({ ...ex, tests: [], scenarios: [] }, ex.code, lang);
    out.hidden = false;
    out.innerHTML = `${ctx.panes ? "" : `<p class="ex-verdict ${ok ? "ok" : "no"}">${ok ? ICON.check : ICON.cross}<span>${esc(ok ? t("predict.right") : t("predict.wrong"))}</span></p>`}<p class="ex-console-k">${esc(t("sql.realResult"))}</p><div class="sq-results"></div>${ex.explain ? `<div class="ex-explain">${ex.explain}</div>` : ""}`;
    results(out.querySelector(".sq-results"), r, t);
  };
  root.querySelector(".ex-options").addEventListener("click", (e) => { const b = e.target.closest(".ex-opt"); if (b) paint(Number(b.dataset.i), true); });
  const last = ctx.lastAnswer ? ctx.lastAnswer(ex) : null;
  if (last !== null && last !== undefined && ex.options[last] !== undefined) paint(last, false);
  else if (isPassed(ex.id)) paint(ex.answer, false);
  H.split(root, ctx, [".ex-code", ".ex-options", ".ex-out"]);
}

// ── Judge: the query against small databases, shown as tables ────────────────
// The tables column names each table; the other columns hold a blank line of the same height, so the
// three header rows sit on one line whenever they sit side by side.
const GHOST = '<p class="jt-name jt-ghost" aria-hidden="true">&nbsp;</p>';
const miniTables = (rows, tables) => Object.entries(rows || {}).map(([name, list]) => {
  const cols = (tables.find((x) => x.name === name) || { cols: [] }).cols.map((c) => c.name);
  return `<div class="jt"><p class="jt-name">${esc(name)}</p><div class="rt-scroll"><table class="rt-t"><thead><tr>${cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${list.map((r) => `<tr>${r.map((v) => (v === null ? '<td class="null">NULL</td>' : `<td${typeof v === "number" ? ' class="num"' : ""}>${esc(cellText(v))}</td>`)).join("")}</tr>`).join("") || `<tr><td class="rt-empty" colspan="${cols.length || 1}">∅</td></tr>`}</tbody></table></div></div>`;
}).join("");

function mountJudge(root, ex, ctx, H) {
  const { t, lang, store, isPassed, markPassed } = ctx;
  const samples = ex.sampleCases || [];
  root.insertAdjacentHTML("beforeend", `<div class="jx-list">${samples.map((c, i) => `<div class="jx sq-jx">
      <p class="jx-k">${esc(t("judge.example", { n: i + 1 }))}</p>
      <div class="jx-cols"><div class="jx-io"><div><span>${esc(t("sql.judge.tables"))}</span><div class="jt-list">${miniTables(c.rows, ex.judgeTables)}</div></div>
      <div><span>${esc(t(ex.sqlSpec.check ? "sql.judge.after" : "sql.judge.expected"))}</span>${GHOST}<div class="jx-exp" data-i="${i}"></div></div></div></div>
      ${c.note ? `<p class="jx-note">${rich(c.note)}</p>` : ""}</div>`).join("")}</div>
    <p class="jx-help">${rich(t(ex.sqlSpec.ordered ? "sql.judge.ordered" : "sql.judge.anyOrder"))}</p>
    <div class="ex-editor"></div>
    <div class="ex-actions">
      <button class="btn btn-primary ex-run">${ICON.play}<span>${esc(t("judge.submit"))}</span></button>
      ${ex.hints && ex.hints.length ? `<button class="btn ex-hintbtn">${ICON.bulb}<span>${esc(t("ex.hint"))}</span></button>` : ""}
      <span class="ex-kbd">${esc(t("ex.shortcut", { key: H.modKey() }))}</span>
      ${H.resetBtn(t)}
    </div>
    <ol class="ex-hints" hidden></ol>
    <div class="ex-out" hidden aria-live="polite"></div>
    <details class="sol"><summary><span class="sol-t">${esc(t("ex.solution"))}</span><span class="sol-h">${esc(t("ex.solutionHint"))}</span></summary>${ex.solutionHtml}<p><button class="link ex-use">${esc(t("ex.useSolution"))}</button></p></details>
    <div class="ex-unlock" hidden></div>`);
  samples.forEach((c, i) => root.querySelector(`.jx-exp[data-i="${i}"]`).append(resultTable(c.expected, t, { page: 20 })));
  let saveTimer = null;
  const editor = createEditor(root.querySelector(".ex-editor"), {
    doc: store.get(`code.${lang}.${ex.id}`, null) ?? ex.starter, label: t("ex.editor"), lang, track: "sql", tables: ex.judgeTables, onRun: () => submit(),
    onChange: (code) => { clearTimeout(saveTimer); saveTimer = setTimeout(() => store.set(`code.${lang}.${ex.id}`, code === ex.starter ? null : code), 400); },
  });
  const out = root.querySelector(".ex-out"), btn = root.querySelector(".ex-run");
  let busy = false;
  const detail = (c, r) => `<div class="jx-cols"><div class="jx-detail sq-detail"><div><span>${esc(t("sql.judge.tables"))}</span><div class="jt-list">${miniTables(c.rows, ex.judgeTables)}</div></div><div class="jx-exp-box"><span>${esc(t("judge.expected"))}</span>${GHOST}</div><div class="jx-got-box"><span>${esc(t("judge.got"))}</span>${GHOST}</div></div></div>`;
  const fillDetail = (box, c, r) => {
    box.querySelector(".jx-exp-box").append(resultTable(c.expected, t, { page: 20 }));
    const g = box.querySelector(".jx-got-box");
    if (r.got) g.append(resultTable(r.got, t, { page: 20 }));
    else g.insertAdjacentHTML("beforeend", `<p class="sq-empty">${esc(t("ex.consoleEmpty"))}</p>`);
  };

  async function submit() {
    if (busy) return;
    busy = true;
    btn.disabled = true;
    btn.querySelector("span").textContent = t("ex.running");
    try { await judgeOnce(); } finally { busy = false; btn.disabled = false; btn.querySelector("span").textContent = t("judge.submit"); }
  }
  async function judgeOnce() {
    const code = editor.get();
    const src = code.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/--[^\n]*/g, "");
    const req = (ex.tests || []).filter((x) => (x.source !== undefined ? !new RegExp(x.source, "i").test(src) : new RegExp(x.sourceNot, "i").test(src)));
    let html, ok = false, verdict = "requires", fail = null;
    if (req.length) {
      html = `<p class="ex-verdict no">${ICON.cross}<span>${esc(t("judge.requires"))}</span></p><ul class="ex-tests">${req.map((x) => `<li class="no">${ICON.cross}<div><span>${esc(x.name)}</span>${x.msg ? `<p>${esc(x.msg)}</p>` : ""}</div></li>`).join("")}</ul>`;
    } else {
      if (!ex.cases) { btn.querySelector("span").textContent = t("judge.preparing"); ex.cases = await buildSqlCases(ex.spec, lang); }
      const { results, tle } = await judgeSql(ex.cases, code, ex.sqlSpec, lang);
      const total = ex.cases.length;
      const okN = results.filter((r) => r && r.verdict === "ok").length;
      const bad = tle !== null ? tle : results.findIndex((r) => r && r.verdict !== "ok");
      ok = tle === null && bad === -1 && results.length === total;
      verdict = ok ? "ac" : tle !== null ? "tle" : (results[bad] && results[bad].verdict) || "wa";
      const count = `<span class="jx-count">${esc(t("judge.count", { ok: okN, total }))}</span>`;
      if (ok) html = `<p class="ex-verdict ok jx-verdict">${ICON.check}<span>${esc(t("judge.ac"))}</span>${count}</p>`;
      else {
        const c = ex.cases[bad], r = tle !== null ? { verdict: "tle" } : results[bad];
        let body = r.error ? `<div class="ex-error sql">${ICON.stop}<div><p>${rich(r.error)}</p></div></div>` : r.why ? `<p class="jx-why">${rich(r.why)}</p>` : "";
        if (c.sample) { body += `<p class="jx-where">${esc(t("judge.isSample", { n: ex.cases.filter((x) => x.sample).indexOf(c) + 1 }))}</p>`; if (r.verdict === "wa") { body += detail(c, r); fail = { c, r }; } }
        else body += `<p class="jx-where">${esc(c.tag ? t("judge.hiddenTag", { tag: c.tag }) : c.random ? t("judge.hiddenRandom") : t("judge.hidden"))}</p>`;
        html = `<p class="ex-verdict no jx-verdict">${ICON.cross}<span>${esc(t(`judge.${r.verdict}`, { n: bad + 1 }))}</span>${count}</p>${body}`;
        const fails = store.get(`fails.${ex.id}`, 0);
        const hidden = results.map((x, i) => ({ x, i })).filter(({ x, i }) => x && x.verdict === "wa" && !ex.cases[i].sample);
        if (fails >= 3 && hidden.length) {
          const pick = hidden.sort((a, b) => JSON.stringify(ex.cases[a.i].rows).length - JSON.stringify(ex.cases[b.i].rows).length)[0];
          html += `<p class="jx-offer">${esc(t("judge.offer"))} <button class="link jx-reveal">${esc(t("judge.reveal"))}</button></p><div class="jx-revealed" hidden>${detail(ex.cases[pick.i], pick.x)}</div>`;
          fail = fail || null;
          out.dataset.reveal = String(pick.i);
          out._reveal = pick;
        }
      }
    }
    H.attempt(ctx, ex.id, ok, verdict);
    out.hidden = false;
    out.innerHTML = html;
    if (fail) fillDetail(out.querySelector(".sq-detail"), fail.c, fail.r);
    const rv = out.querySelector(".jx-reveal");
    if (rv) rv.addEventListener("click", () => { const box = out.querySelector(".jx-revealed"); box.hidden = false; fillDetail(box.querySelector(".sq-detail"), ex.cases[out._reveal.i], out._reveal.x); rv.disabled = true; });
    if (ok) { const first = !isPassed(ex.id); markPassed(ex.id); root.classList.add("passed"); progress(); H.showUnlock(root, ex, ctx, first); }
    else root.querySelector(".ex-unlock").hidden = true;
  }
  btn.addEventListener("click", submit);
  root.querySelector(".ex-reset").addEventListener("click", () => { editor.set(ex.starter); store.set(`code.${lang}.${ex.id}`, null); out.hidden = true; });
  root.querySelector(".ex-use").addEventListener("click", () => { editor.set(ex.solution); editor.view.focus(); });
  const hintBtn = root.querySelector(".ex-hintbtn");
  if (hintBtn) {
    let shown = 0;
    const list = root.querySelector(".ex-hints");
    hintBtn.addEventListener("click", () => { if (shown >= ex.hints.length) return; list.hidden = false; list.insertAdjacentHTML("beforeend", `<li>${ex.hints[shown]}</li>`); shown++; hintBtn.disabled = shown >= ex.hints.length; });
  }
  if (isPassed(ex.id)) H.showUnlock(root, ex, ctx, false);
  placeTool(root, ex, ctx, [".ex-editor", ".ex-actions", ".ex-hints", ".ex-out"]);
}
