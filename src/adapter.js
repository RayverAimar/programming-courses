// What Loop adds to the platform: lessons with live code, animations and robot scenes, and a
// Taller with the editor, the judge and the robot's world. The core knows none of this.
import { mountExercise } from "./exercise.js";
import { mountVisual } from "./visuals.js";
import { forgetPlayers, repaintPlayers } from "./world/render.js";
import { preloadPython } from "./runner/pyclient.js";
import { preloadSql } from "./runner/sqlclient.js";
import { t } from "../platform/web/core/i18n.js";
import { confetti } from "../platform/web/core/ui.js";
import * as P from "../platform/web/core/progress.js";
import { addRoute } from "../platform/web/core/router.js";
import { searchIndex } from "../platform/web/core/search.js";
import * as modern from "./modern.js";
import { scrollHints, watchTables } from "./scrollhint.js";

const graded = (type) => type !== "demo";
const plain = (html) => String(html).replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

// Saved code and judge failures, as the exercise component asks for them (it predates the database).
function storeShim() {
  return {
    get(key, fallback) {
      const code = key.match(/^code\.(\w+)\.(.+)$/);
      if (code) return P.savedCode(code[2], code[1]) ?? fallback;
      const fails = key.match(/^fails\.(.+)$/);
      if (fails) return P.fails(fails[1]);
      return fallback;
    },
    set(key, value) {
      const code = key.match(/^code\.(\w+)\.(.+)$/);
      if (code) P.saveCode(code[2], code[1], value);
    },
  };
}

function exerciseContext(payload, extra = {}) {
  const lang = document.documentElement.lang;
  return {
    t,
    lang,
    store: storeShim(),
    isPassed: P.passed,
    markPassed: () => {},
    attempt: (id, ok, detail) => {
      P.recordAttempt(id, ok, { detail, lang });
      const ex = payload.exercises[id];
      if (ex && ex.type === "predict") P.saveCheckAnswer(id, P.item(id)?.lesson.id, detail, ok);
    },
    nextSession: (moduleId) => {
      const m = P.module(moduleId);
      const nx = m && m.course.modules[m.index + 1];
      return nx ? { id: nx.id, n: nx.n, title: nx.title, module: nx } : null;
    },
    lastAnswer: (ex) => {
      const r = P.checkAnswer(ex.id);
      if (!r) return P.passed(ex.id) ? ex.answer : null;
      if (r.correct) return ex.answer;
      const i = ex.options.indexOf(r.answer);
      return i >= 0 ? i : null;
    },
    sessionHref: (next) => P.lessonHref(next.module.lessons[0]),
    gate: (moduleId) => P.gateMissing(P.module(moduleId)).map((g) => g.label),
    ...extra,
  };
}

function label(ex, n) {
  const kind = t(`ex.kind.${ex.type}`);
  return ["predict", "complete", "fix", "write"].includes(ex.type) ? `${t("ex.n", { n })} · ${kind}` : kind;
}

function mountSlots(root, payload, ctx, skip = new Set()) {
  let n = 0;
  for (const slot of root.querySelectorAll(".ex-slot")) {
    const ex = payload.exercises[slot.dataset.ex];
    if (!ex || skip.has(ex.id)) continue;
    if (["predict", "complete", "fix", "write"].includes(ex.type)) n++;
    const lab = ex.type === "predict" && ctx.inLesson ? `${t("check.kicker")} · ${t("ex.kind.predict")}` : label(ex, n);
    mountExercise(slot, ex, { ...ctx, label: lab });
  }
  for (const slot of root.querySelectorAll(".vis-slot")) {
    const v = payload.visuals[slot.dataset.vis];
    if (v) mountVisual(slot, v.kind, v.spec, { t, lang: document.documentElement.lang, track: payload.id.split("/")[0] });
  }
}

// The general words about judges go under the problem's title, folded.
function aboveAsNote(task, root) {
  const head = root && root.querySelector(".ex-head");
  const before = [];
  for (let el = root && root.previousElementSibling; el; el = el.previousElementSibling) before.unshift(el);
  if (!head || !before.length) return;
  const note = document.createElement("details");
  note.className = "ex-about";
  note.innerHTML = `<summary>${t("judge.about")}</summary>`;
  note.append(...before);
  head.after(note);
}

export const adapter = {
  id: "programming-courses",
  gallery: {
    course: { tag: "Lenguaje", tagType: "code", title: "JavaScript", next: "Bucles · El caso", metaL: "Sesión 3 de 17" },
    doneCourse: { tag: "Lenguaje", title: "Python", meta: "Terminado el 12 oct" },
    soonCourse: { tag: "Lenguaje", title: "Rust" },
    lessons: ["El encargo", "Lo mínimo", "Práctica", "Sesión cerrada", "Reto experto"],
    idea: "Un bucle repite una acción sin copiar el código.",
    goals: ["Repetir una acción sin copiar el código.", "Elegir entre <code>for</code> y <code>while</code>."],
    recap: ["Un bucle repite mientras su condición sea verdadera.", "Cuenta desde 0.", "Cuidado con el último índice."],
    quiz: { question: "¿Qué imprime <code>for (let i = 0; i &lt; 3; i++)</code>?", options: ["0 1 2", "1 2 3"], answer: 0, explain: "Empieza en 0 y se detiene antes de 3." },
    quiz2: { question: "¿Cuántas veces corre <code>while (false)</code>?", options: ["Ninguna", "Una"], answer: 0, explain: "La condición se revisa antes de entrar." },
    figure: { title: "Un bucle paso a paso", hint: "Mueve las vueltas ←→", label: "Vueltas" },
    sheet: "Sesión 3 · Bucles",
  },
  screens: { modern },

  mountLesson(host, { lesson, data, payload }) {
    host.innerHTML = data.html;
    mountSlots(host, payload, exerciseContext(payload, { inLesson: true }));
    scrollHints(host);
    // Quick checks are predictions here: optional, and they look like the platform's check.
    for (const ex of host.querySelectorAll("section.ex-predict")) {
      ex.classList.add("qcheck");
      ex.dataset.anchor = t("check.kicker");
    }
    // What the section rail lists: figures, runnable examples, the legacy boxes and the traps.
    let k = 0;
    const mark = (el, label) => {
      if (!el.id) el.id = `${lesson.slug}-a${++k}`;
      el.dataset.anchor = label.length > 48 ? label.slice(0, 46) + "…" : label;
    };
    for (const el of host.querySelectorAll(":scope > figure.vis, :scope > section.ex-demo, :scope > aside.legacy, :scope > blockquote.trap")) {
      if (el.matches("figure")) mark(el, plain(el.querySelector(".vis-k")?.textContent || el.querySelector("figcaption")?.textContent || "") || t("lesson.figure"));
      else if (el.matches(".ex-demo")) mark(el, t("ex.kind.demo"));
      else if (el.matches(".legacy")) mark(el, t("legacy.title"));
      else mark(el, plain(el.querySelector("strong")?.textContent || "").replace(/:$/, ""));
    }
    requestAnimationFrame(repaintPlayers);
    return { cleanup: forgetPlayers };
  },

  mountWorkshop({ task, tool }, { lesson, item, index, payload, data }) {
    task.innerHTML = data.segments[index] || "";
    const ex = payload.exercises[item.id];
    const ctx = exerciseContext(payload, { panes: { task, tool } });
    const practiceN = lesson.items.filter((x) => graded(x.type)).slice(0, index + 1).filter((x) => ["predict", "complete", "fix", "write"].includes(x.type)).length;
    const slot = task.querySelector(`.ex-slot[data-ex="${item.id}"]`);
    mountExercise(slot, ex, { ...ctx, label: label(ex, practiceN) });
    if (ex.type === "judge") aboveAsNote(task, task.querySelector(`#ex-${CSS.escape(item.id)}`));
    mountSlots(task, payload, exerciseContext(payload), new Set([item.id]));
    scrollHints(task);
    if (!tool.children.length) tool.innerHTML = `<p class="muted">${t("workshop.noTool")}</p>`;
    requestAnimationFrame(repaintPlayers);
    return { cleanup: forgetPlayers };
  },

  search: searchIndex(),

  onEnterCourse(c) {
    if (c.id === "py") preloadPython();
    if (c.id === "sql") preloadSql(document.documentElement.lang);
  },
  onTheme: () => requestAnimationFrame(repaintPlayers),

  // Old links: #/js, #/js/03-bucles/4, #/js/modern.
  redirect(hash) {
    const m = hash.match(/^#\/(js|py|sql)(?:\/([\w-]+))?(?:\/\d+)?$/);
    if (!m) return null;
    if (!m[2]) return `#/c/${m[1]}`;
    if (m[2] === "modern") return `#/c/${m[1]}/modern`;
    return `#/c/${m[1]}`;
  },

  // Progress from before the database: localStorage keys "taller.*". Read once, never written again.
  importLegacy(_P, store) {
    const get = (k) => { try { return JSON.parse(localStorage.getItem(`taller.${k}`)); } catch (_) { return null; } };
    const now = Date.now();
    store.tx(() => {
      for (const id of get("passed") || []) {
        const it = P.item(id);
        store.run(`INSERT OR IGNORE INTO item_state (item_id, course_id, lesson_id, kind, passed, attempts, fails, first_ok, passed_at, updated_at) VALUES (?, ?, ?, ?, 1, 1, 0, NULL, ?, ?)`,
          [id, it && it.lesson.course.id, it && it.lesson.id, it && it.type, now, now]);
        if (it) store.run(`INSERT OR IGNORE INTO lesson_state (lesson_id, course_id, module_id, state, opened_at, updated_at) VALUES (?, ?, ?, 'started', ?, ?)`, [it.lesson.id, it.lesson.course.id, it.lesson.module.id, now, now]);
      }
      for (const sid of get("skipped") || []) store.run("INSERT OR IGNORE INTO unlock VALUES (?, ?)", [sid, now]);
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        const m = k && k.match(/^taller\.code\.(\w+)\.(.+)$/);
        if (m) {
          const code = get(k.slice(7));
          if (typeof code === "string") store.run("INSERT OR IGNORE INTO saved_code VALUES (?, ?, ?, ?)", [m[2], m[1], code, now]);
        }
      }
      // A session whose mission passed was read through: its readings count as read.
      for (const c of P.readyCourses()) for (const m of c.modules) {
        if (!P.gatePassed(m)) continue;
        for (const l of m.lessons) if (l.kind !== "workshop") store.run(`INSERT INTO lesson_state (lesson_id, course_id, module_id, state, opened_at, done_at, updated_at) VALUES (?, ?, ?, 'done', ?, ?, ?) ON CONFLICT (lesson_id) DO UPDATE SET state = 'done', done_at = excluded.done_at`, [l.id, c.id, m.id, now, now, now]);
      }
      const last = get("last");
      const lm = last && P.module(last);
      if (lm) {
        const l = lm.lessons.find((x) => !P.lessonDone(x)) || lm.lessons[0];
        store.run(`INSERT INTO lesson_state (lesson_id, course_id, module_id, state, opened_at, updated_at) VALUES (?, ?, ?, 'started', ?, ?) ON CONFLICT (lesson_id) DO UPDATE SET updated_at = excluded.updated_at`, [l.id, lm.course.id, lm.id, now, now + 1]);
      }
    });
  },
};

addRoute(/^c\/(js|py|sql)\/modern$/, "modern");

// On a phone the Taller is stacked: after a run, show what came out.
document.addEventListener("taller:run", () => {
  if (!matchMedia("(max-width: 699px)").matches) return;
  const out = document.querySelector(".ws-tool .ex-cons:not([hidden]), .ws-tool .ex-out:not([hidden]), .ws-tool .ex-world");
  if (out) out.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
});

// A solved case or mission gets a small burst, once, when it is first passed.
P.onProgress((e) => {
  if (e.type !== "passed") return;
  const it = P.item(e.id);
  if (!it || (it.type !== "mission" && it.type !== "case")) return;
  const at = document.querySelector(".ws-tool .ex-out:not([hidden]), .ws-tool .ex-answer") || document.getElementById(`ex-${e.id}`);
  confetti({ from: at, count: 60, spread: 0.7 });
});
