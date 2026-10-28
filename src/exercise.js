// One live exercise on the page: editor, run button, tests, console, hints, solution, and the
// robot's map when the exercise drives it.
import { createEditor } from "./editor.js";
import { runInWorker, judgeInWorker, buildCasesInWorker } from "./runner/client.js";
import { runPython, judgePython, buildPythonCases, onPythonStatus } from "./runner/pyclient.js";
import { answerHash } from "./runner/hash.js";
import { callText as callOf, literal as lit } from "./runner/judge.js";
import { Player } from "./world/render.js";
import { mountExerciseVisual } from "./visuals.js";
import { mountSqlExercise } from "./sql/exercise.js";
import { icon } from "../platform/web/core/dom.js";
import { md } from "../platform/web/core/inline.js";
import { highlightHtml } from "../platform/web/core/highlight.js";
import { button } from "../platform/web/core/ui.js";
import { tc } from "../platform/web/core/i18n.js";

/* global __WORKER_SOURCE__ */
const WORKER = __WORKER_SOURCE__;

const ICON = {
  check: icon("check"),
  cross: icon("x"),
  play: icon("play"),
  bulb: icon("lightbulb"),
  undo: icon("rotate-ccw"),
  stop: icon("octagon-alert"),
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
// Messages may name code in `backticks`.
const rich = (s) => md(s).replace(/\n/g, "<br>");
// Python exercises run in Pyodide; the first run waits while it loads, and the button says so.
let pyState = "idle";
onPythonStatus((s) => {
  pyState = s;
  document.querySelectorAll(".ex-run.busy-py span").forEach((el) => { if (s === "loading") el.textContent = el.dataset.loading; });
});
const execute = (ex, job, code, lang) => (ex.track === "py" ? runPython(job, code, lang) : runInWorker(WORKER, job, code, lang));
const busyLabel = (btn, ex, t) => {
  const loading = ex.track === "py" && pyState !== "ready";
  btn.classList.toggle("busy-py", ex.track === "py");
  btn.querySelector("span").dataset.loading = t("py.loading");
  btn.querySelector("span").textContent = loading ? t("py.loading") : t("ex.running");
};
const resetBtn = (t) => button({ label: t("ex.reset"), kind: "icon", icon: "rotate-ccw", cls: "ex-reset" });
const modKey = () => (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? "⌘" : "Ctrl");
const attempt = (ctx, id, ok, detail) => ctx.attempt && ctx.attempt(id, ok, detail);

// In the Taller the exercise splits in two: the task on the left, the tool (code, console, robot) on the right.
function split(root, ctx, toolSel) {
  if (!ctx.panes) return;
  const tool = ctx.panes.tool;
  for (const sel of toolSel) for (const el of root.querySelectorAll(`:scope > ${sel}`)) tool.append(el);
  tool.classList.add("ex-toolpane", `ex-${root.classList[1]}-tool`);
  root.classList.add("ex-split");
}

export function mountExercise(slot, ex, ctx) {
  const { t, lang, store, isPassed, markPassed, label } = ctx;
  const root = document.createElement("section");
  root.className = `ex ex-${ex.type}${isPassed(ex.id) ? " passed" : ""}`;
  root.id = `ex-${ex.id}`;
  slot.replaceWith(root);

  const head = ex.type === "demo" ? "" : `<header class="ex-head">
      <p class="ex-k"><span>${esc(label)}</span><span class="ex-done">${ICON.check}${esc(t("ex.done"))}</span></p>
      ${ex.title ? `<h3 class="ex-t">${ex.title}</h3>` : ""}
    </header>
    ${ex.prompt ? `<div class="ex-prompt">${ex.prompt}</div>` : ""}
    ${ex.visual ? '<div class="ex-visual"></div>' : ""}`;
  const visualize = () => {
    const vh = root.querySelector(".ex-visual");
    if (vh) mountExerciseVisual(vh, ex.visual, { t: ctx.t, lang: ctx.lang, track: ex.track });
  };

  if (ex.track === "sql") {
    root.innerHTML = head;
    mountSqlExercise(root, ex, ctx, { split, showUnlock, resetBtn, modKey, attempt });
    return visualize();
  }
  if (ex.type === "predict") { mountPredict(root, ex, ctx, head); return visualize(); }
  if (ex.type === "judge") { mountJudge(root, ex, ctx, head); return visualize(); }

  const saved = store.get(`code.${lang}.${ex.id}`, null);
  const runLabel = ex.type === "demo" || ex.type === "case" ? t("ex.runDemo") : t("ex.run");
  root.innerHTML = `${head}
    ${ex.world ? '<div class="ex-world"></div>' : ""}
    <div class="ex-editor"></div>
    <div class="ex-actions">
      <button class="btn btn-primary ex-run">${ICON.play}<span>${esc(runLabel)}</span></button>
      ${ex.hints && ex.hints.length ? `<button class="btn ex-hintbtn">${ICON.bulb}<span>${esc(t("ex.hint"))}</span></button>` : ""}
      <span class="ex-kbd">${esc(t("ex.shortcut", { key: modKey() }))}</span>
      ${ex.type !== "demo" ? resetBtn(t) : ""}
    </div>
    <ol class="ex-hints" hidden></ol>
    <div class="ex-out" hidden aria-live="polite"></div>
    <div class="ex-cons" hidden aria-live="polite"></div>
    ${ex.type === "case" ? `<form class="ex-answer">
        <label for="ans-${ex.id}">${ex.answerLabel || esc(t("case.answer"))}</label>
        <div class="ex-answer-row"><input id="ans-${ex.id}" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done">
        <button class="btn btn-primary" type="submit">${esc(t("case.check"))}</button></div>
        <p class="ex-answer-msg" aria-live="polite"></p>
        ${ex.reveal ? `<div class="ex-reveal" ${isPassed(ex.id) ? "" : "hidden"}>${ex.reveal}</div>` : ""}
      </form>` : ""}
    ${ex.solutionHtml && ex.type !== "demo" ? `<details class="sol"><summary><span class="sol-t">${esc(t("ex.solution"))}</span><span class="sol-h">${esc(t("ex.solutionHint"))}</span></summary>
        ${ex.solutionHtml}<p><button class="link ex-use">${esc(t("ex.useSolution"))}</button></p></details>` : ""}
    <div class="ex-unlock" hidden></div>`;

  const player = ex.world ? new Player(root.querySelector(".ex-world"), ex.world, {
    aria: t("player.aria"), play: t("player.play"), pause: t("player.pause"), restart: t("player.restart"),
    speed: t("player.speed"), step: t("player.step"), battery: t("player.battery"), ready: t("player.ready"),
  }) : null;

  let saveTimer = null;
  const editor = createEditor(root.querySelector(".ex-editor"), {
    doc: saved ?? ex.starter,
    label: t("ex.editor"),
    env: ex.env,
    lang,
    track: ex.track,
    onRun: () => run(),
    onChange: (code) => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => store.set(`code.${lang}.${ex.id}`, code === ex.starter ? null : code), 400);
    },
  });

  const out = root.querySelector(".ex-out");
  const consBox = root.querySelector(".ex-cons");
  const runBtn = root.querySelector(".ex-run");
  let busy = false;

  async function run() {
    if (busy) return;
    busy = true;
    runBtn.disabled = true;
    busyLabel(runBtn, ex, t);
    const job = ex.type === "case" || ex.type === "demo" ? { ...ex, tests: [], scenarios: [] } : ex;
    const r = await execute(ex, job, editor.get(), lang);
    busy = false;
    runBtn.disabled = false;
    runBtn.querySelector("span").textContent = runLabel;
    show(r);
    document.dispatchEvent(new CustomEvent("taller:run", { detail: { id: ex.id, logs: r.logs || [], pass: !!r.pass } }));
    if (player) {
      if (r.frames) player.load(r.frames, r.map);
      else player.reset(r.map);
    }
    const graded = ex.type !== "case" && ex.type !== "demo";
    if (graded) attempt(ctx, ex.id, !!r.pass, r.pass ? null : (r.tests || []).filter((x) => !x.pass).map((x) => x.name).join(" · ") || (r.error && r.error.text) || null);
    if (graded && r.pass) {
      const first = !isPassed(ex.id);
      markPassed(ex.id);
      root.classList.add("passed");
      if (ex.type === "mission") showUnlock(root, ex, ctx, first);
    }
  }

  function show(r) {
    out.hidden = false;
    const graded = ex.type !== "case" && ex.type !== "demo";
    const passN = (r.tests || []).filter((x) => x.pass).length;
    const total = (r.tests || []).length;
    const verdict = graded
      ? `<p class="ex-verdict ${r.pass ? "ok" : "no"}">${r.pass ? ICON.check : ICON.cross}<span>${esc(r.pass ? t("ex.pass") : t("ex.fail", { n: passN, total }))}</span>
         ${r.scenarios > 1 && !r.pass ? `<span class="ex-scn">${esc(t("ex.scenario", { i: r.scenario + 1, n: r.scenarios }))}</span>` : ""}</p>`
      : "";
    const err = r.error
      ? `<div class="ex-error ${r.error.kind}">${ICON.stop}<div><b>${esc(r.error.kind === "robot" ? t("ex.robotStopped") : t("ex.error"))}</b><p>${rich(r.error.text)}</p></div></div>`
      : "";
    const tests = graded && total
      ? `<ul class="ex-tests">${r.tests
          .map((x) => `<li class="${x.pass ? "ok" : "no"}">${x.pass ? ICON.check : ICON.cross}<div><span>${esc(x.name)}</span>${!x.pass && x.msg ? `<p>${rich(x.msg)}</p>` : ""}</div></li>`)
          .join("")}</ul>`
      : "";
    const cons = `<div class="ex-console"><p class="ex-console-k">${esc(t("ex.console"))}</p><pre>${r.logs && r.logs.length ? esc(r.logs.join("\n")) : `<span class="empty">${esc(t("ex.consoleEmpty"))}</span>`}</pre></div>`;
    out.innerHTML = verdict + err + tests;
    out.hidden = !(verdict || err || tests);
    consBox.hidden = false;
    consBox.innerHTML = cons;
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
  if (reset) reset.addEventListener("click", () => { editor.set(ex.starter); store.set(`code.${lang}.${ex.id}`, null); out.hidden = true; consBox.hidden = true; if (player) player.reset(ex.world.map); });
  const use = root.querySelector(".ex-use");
  if (use) use.addEventListener("click", () => { editor.set(ex.solution); editor.view.focus(); });

  const form = root.querySelector(".ex-answer");
  if (form) {
    const input = form.querySelector("input");
    const msg = form.querySelector(".ex-answer-msg");
    input.addEventListener("input", () => { msg.textContent = ""; msg.className = "ex-answer-msg"; });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!input.value.trim()) return;
      const ok = answerHash(input.value) === ex.answerHash;
      msg.textContent = ok ? t("case.right") : t("case.wrong");
      msg.className = `ex-answer-msg ${ok ? "ok" : "no"}`;
      document.dispatchEvent(new CustomEvent("taller:answer", { detail: { id: ex.id, ok } }));
      attempt(ctx, ex.id, ok, ok ? null : input.value.trim());
      if (ok) {
        markPassed(ex.id);
        root.classList.add("passed");
        const rev = form.querySelector(".ex-reveal");
        if (rev) rev.hidden = false;
      }
    });
  }
  if (ex.type === "mission" && isPassed(ex.id)) showUnlock(root, ex, ctx, false);
  visualize();
  split(root, ctx, [".ex-world", ".ex-editor", ".ex-actions", ".ex-cons"]);
}

function mountPredict(root, ex, ctx, head) {
  const { t, lang, isPassed, markPassed } = ctx;
  root.innerHTML = `${head}
    <div class="ex-code">${ex.codeHtml}</div>
    <div class="ex-options" role="group">${ex.options
      .map((o, i) => `<button class="ex-opt" data-i="${i}"><pre>${esc(o)}</pre></button>`)
      .join("")}</div>
    <div class="ex-out" hidden aria-live="polite"></div>`;
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
    if (fresh) attempt(ctx, ex.id, ok, ok ? null : ex.options[picked]);
    if (ok) { markPassed(ex.id); root.classList.add("passed"); }
    const r = await execute(ex, { ...ex, tests: [], scenarios: [] }, ex.code, lang);
    out.hidden = false;
    out.innerHTML = `${ctx.panes ? "" : `<p class="ex-verdict ${ok ? "ok" : "no"}">${ok ? ICON.check : ICON.cross}<span>${esc(ok ? t("predict.right") : t("predict.wrong"))}</span></p>`}
      <div class="ex-console"><p class="ex-console-k">${esc(t("predict.output"))}</p><pre>${esc(r.logs.join("\n"))}</pre></div>
      ${ex.explain ? `<div class="ex-explain">${ex.explain}</div>` : ""}`;
  };
  root.querySelector(".ex-options").addEventListener("click", (e) => {
    const b = e.target.closest(".ex-opt");
    if (b) paint(Number(b.dataset.i), true);
  });
  const last = ctx.lastAnswer ? ctx.lastAnswer(ex) : null;
  if (last !== null && last !== undefined && ex.options[last] !== undefined) paint(last, false);
  else if (isPassed(ex.id)) paint(ex.answer, false);
  split(root, ctx, [".ex-code", ".ex-options", ".ex-out"]);
}

// After the mission or a judge passes: either the next session is open, or what is still missing.
function showUnlock(root, ex, ctx, fresh) {
  const { t, nextSession, gate } = ctx;
  const box = root.querySelector(".ex-unlock");
  const next = nextSession(ex.session);
  const missing = gate(ex.session);
  box.hidden = false;
  box.innerHTML = `<p class="ex-unlock-t">${esc(ex.type === "mission" ? t("mission.done") : t("judge.ac"))}</p>
    ${missing.length
      ? `<p>${esc(t("mission.pending", { list: missing.join(" · ") }))}</p>`
      : next
        ? `<p>${esc(t("mission.unlocked", { n: next.n, title: next.title }))}</p><a class="btn btn-primary" href="${ctx.sessionHref ? ctx.sessionHref(next) : `#/${next.id}`}">${esc(t("mission.go", { n: next.n }))}</a>`
        : `<p>${esc(tc("mission.last", ex.track))}</p>`}`;
  if (fresh) box.classList.add("fresh");
}

// ── Judge ─────────────────────────────────────────────────────────────────
function mountJudge(root, ex, ctx, head) {
  const { t, lang, store, isPassed, markPassed } = ctx;
  const fnMode = ex.mode === "function";
  const readers = lang === "en" ? ["readLine", "readNumber", "readNumbers"] : ["leerLinea", "leerNumero", "leerNumeros"];
  const samples = ex.samplesView
    .map((c, i) => `<div class="jx">
        <p class="jx-k">${esc(t("judge.example", { n: i + 1 }))}</p>
        <div class="jx-io">
          <div><span>${esc(fnMode ? t("judge.call") : t("judge.input"))}</span><pre>${c.input}</pre></div>
          <div><span>${esc(fnMode ? t("judge.returns") : t("judge.output"))}</span><pre>${c.output}</pre></div>
        </div>
        ${c.note ? `<p class="jx-note">${c.note}</p>` : ""}
      </div>`)
    .join("");
  root.innerHTML = `${head}
    <div class="jx-list">${samples}</div>
    ${fnMode ? "" : `<p class="jx-help">${(ex.track === "py" ? t("judge.helpers.py") : t("judge.helpers", { a: readers[0], b: readers[1], c: readers[2] })).replace(/`([^`]+)`/g, "<code>$1</code>")}</p>`}
    <div class="ex-editor"></div>
    <div class="ex-actions">
      <button class="btn btn-primary ex-run">${ICON.play}<span>${esc(t("judge.submit"))}</span></button>
      ${ex.hints && ex.hints.length ? `<button class="btn ex-hintbtn">${ICON.bulb}<span>${esc(t("ex.hint"))}</span></button>` : ""}
      <span class="ex-kbd">${esc(t("ex.shortcut", { key: modKey() }))}</span>
      ${resetBtn(t)}
    </div>
    <ol class="ex-hints" hidden></ol>
    <div class="ex-out" hidden aria-live="polite"></div>
    <details class="sol"><summary><span class="sol-t">${esc(t("ex.solution"))}</span><span class="sol-h">${esc(t("ex.solutionHint"))}</span></summary>
      ${ex.solutionHtml}<p><button class="link ex-use">${esc(t("ex.useSolution"))}</button></p></details>
    <div class="ex-unlock" hidden></div>`;

  let saveTimer = null;
  const editor = createEditor(root.querySelector(".ex-editor"), {
    doc: store.get(`code.${lang}.${ex.id}`, null) ?? ex.starter,
    label: t("ex.editor"),
    env: ex.env,
    lang,
    track: ex.track,
    onRun: () => submit(),
    onChange: (code) => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => store.set(`code.${lang}.${ex.id}`, code === ex.starter ? null : code), 400);
    },
  });
  const out = root.querySelector(".ex-out");
  const btn = root.querySelector(".ex-run");
  let busy = false;
  let lastFailures = [];

  const code = (text) => highlightHtml(String(text), ex.track === "py" ? "python" : "js");
  const detail = (c, r) => {
    const rows = fnMode
      ? [[t("judge.call"), code(c.callText ?? callOf(c.fn, c.args))], [t("judge.expected"), code(c.expectedText ?? lit(c.expected))], [t("judge.got"), r.got === undefined || r.got === null ? "—" : code(r.got)]]
      : [[t("judge.input"), esc(c.input)], [t("judge.expected"), esc(c.output)], [t("judge.got"), r.got ? esc(r.got) : `<span class="empty">${esc(t("ex.consoleEmpty"))}</span>`]];
    return `<dl class="jx-detail">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd><pre>${v}</pre></dd>`).join("")}</dl>`;
  };

  // Whatever happens in the page, the button comes back.
  async function submit() {
    if (busy) return;
    try {
      await judgeOnce();
    } finally {
      busy = false;
      btn.disabled = false;
      btn.querySelector("span").textContent = t("judge.submit");
    }
  }

  async function judgeOnce() {
    busy = true;
    btn.disabled = true;
    busyLabel(btn, ex, t);
    const code = editor.get();
    // What the statement requires of the code itself is checked first.
    const req = (ex.tests || []).filter((x) => {
      const src = ex.track === "py" ? code.replace(/#[^\n]*/g, "") : code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:\\])\/\/[^\n]*/g, "$1");
      return x.source !== undefined ? !new RegExp(x.source).test(src) : new RegExp(x.sourceNot).test(src);
    });
    let html;
    let ok = false;
    let verdict = "requires";
    if (req.length) {
      html = `<p class="ex-verdict no">${ICON.cross}<span>${esc(t("judge.requires"))}</span></p>
        <ul class="ex-tests">${req.map((x) => `<li class="no">${ICON.cross}<div><span>${esc(x.name)}</span>${x.msg ? `<p>${esc(x.msg)}</p>` : ""}</div></li>`).join("")}</ul>`;
    } else {
      if (!ex.cases) {
        btn.querySelector("span").textContent = t("judge.preparing");
        ex.cases = ex.track === "py" ? await buildPythonCases(ex.spec, lang) : await buildCasesInWorker(WORKER, ex.spec, lang);
        busyLabel(btn, ex, t);
      }
      let judged;
      try {
        judged = ex.track === "py"
          ? await judgePython(ex.cases, code, lang, ex.tolerance, ex.judgeEnv)
          : await judgeInWorker(WORKER, ex.cases, code, lang, ex.tolerance, ex.judgeEnv);
      } catch (_) {
        judged = { results: [], tle: 0 };
      }
      const { results, tle } = judged;
      const total = ex.cases.length;
      const passedN = results.filter((r) => r && r.verdict === "ok").length;
      const firstBad = tle !== null ? tle : results.findIndex((r) => r && r.verdict !== "ok");
      ok = tle === null && firstBad === -1 && results.length === total;
      verdict = ok ? "ac" : tle !== null ? "tle" : (results[firstBad] && results[firstBad].verdict) || "wa";
      const count = `<span class="jx-count">${esc(t("judge.count", { ok: passedN, total }))}</span>`;
      if (ok) {
        html = `<p class="ex-verdict ok jx-verdict">${ICON.check}<span>${esc(t("judge.ac"))}</span>${count}</p>`;
      } else {
        const n = firstBad + 1;
        const c = ex.cases[firstBad];
        const r = tle !== null ? { verdict: "tle" } : results[firstBad];
        const name = t(`judge.${r.verdict}`, { n });
        let body = "";
        if (r.error) body += `<div class="ex-error js">${ICON.stop}<div><p>${rich(r.error)}</p></div></div>`;
        if (r.missing) {
          /* the error already says which function is missing */
        } else if (c.sample) {
          body += `<p class="jx-where">${esc(t("judge.isSample", { n: ex.cases.filter((x) => x.sample).indexOf(c) + 1 }))}</p>`;
          if (r.verdict !== "tle") body += detail(c, r);
        } else {
          body += `<p class="jx-where">${esc(c.tag ? t("judge.hiddenTag", { tag: c.tag }) : c.random ? t("judge.hiddenRandom") : t("judge.hidden"))}</p>`;
        }
        html = `<p class="ex-verdict no jx-verdict">${ICON.cross}<span>${esc(name)}</span>${count}</p>${body}`;
        lastFailures = results.map((x, i) => ({ x, i })).filter(({ x, i }) => x && x.verdict !== "ok" && x.verdict !== "tle" && !ex.cases[i].sample && !x.missing);
      }
    }
    busy = false;
    btn.disabled = false;
    btn.querySelector("span").textContent = t("judge.submit");
    attempt(ctx, ex.id, ok, verdict);
    if (ok) {
      const first = !isPassed(ex.id);
      markPassed(ex.id);
      root.classList.add("passed");
      showUnlock(root, ex, ctx, first);
    } else {
      root.querySelector(".ex-unlock").hidden = true;
    }
    const fails = store.get(`fails.${ex.id}`, 0);
    const offer = !ok && fails >= 3 && lastFailures.length;
    out.hidden = false;
    out.innerHTML = html + (offer ? `<p class="jx-offer">${esc(t("judge.offer"))} <button class="link jx-reveal">${esc(t("judge.reveal"))}</button></p><div class="jx-revealed" hidden></div>` : "");
    if (offer) {
      out.querySelector(".jx-reveal").addEventListener("click", (e) => {
        // The smallest failing hidden case: the easiest to reason about.
        const size = ({ i }) => ex.cases[i].size ?? JSON.stringify(ex.cases[i].args ?? ex.cases[i].input).length;
        const pick = lastFailures.slice().sort((a, b) => size(a) - size(b))[0];
        const box = out.querySelector(".jx-revealed");
        box.hidden = false;
        box.innerHTML = detail(ex.cases[pick.i], pick.x);
        e.target.disabled = true;
      });
    }
  }

  btn.addEventListener("click", submit);
  root.querySelector(".ex-reset").addEventListener("click", () => { editor.set(ex.starter); store.set(`code.${lang}.${ex.id}`, null); out.hidden = true; });
  root.querySelector(".ex-use").addEventListener("click", () => { editor.set(ex.solution); editor.view.focus(); });
  const hintBtn = root.querySelector(".ex-hintbtn");
  if (hintBtn) {
    let shown = 0;
    const list = root.querySelector(".ex-hints");
    hintBtn.addEventListener("click", () => {
      if (shown >= ex.hints.length) return;
      list.hidden = false;
      list.insertAdjacentHTML("beforeend", `<li>${ex.hints[shown]}</li>`);
      shown++;
      hintBtn.disabled = shown >= ex.hints.length;
    });
  }
  if (isPassed(ex.id)) showUnlock(root, ex, ctx, false);
  split(root, ctx, [".ex-editor", ".ex-actions", ".ex-out"]);
}
