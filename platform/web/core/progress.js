// The course model (from site.json) joined with the learner's progress (the database).
// Screens ask questions here; nothing else writes progress.
import { mdPlain } from "./inline.js";

let SITE = null;
let S = null;
let DEVICE = null;
const COURSES = new Map();
const MODULES = new Map();
const LESSONS = new Map();
const ITEMS = new Map();
const listeners = new Set();

const now = () => Date.now();
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${now().toString(36)}-${Math.random().toString(36).slice(2)}`);
export const onProgress = (fn) => listeners.add(fn);
const changed = (what) => listeners.forEach((fn) => fn(what));

export function initModel(site, store, device) {
  SITE = site;
  S = store;
  DEVICE = device;
  for (const c of site.courses) {
    COURSES.set(c.id, c);
    (c.modules || []).forEach((m, mi) => {
      m.course = c;
      m.index = mi;
      MODULES.set(m.id, m);
      m.lessons.forEach((l, li) => {
        l.module = m;
        l.course = c;
        l.index = li;
        LESSONS.set(l.id, l);
        (l.items || []).forEach((it, ii) => ITEMS.set(it.id, { ...it, index: ii, lesson: l }));
      });
    });
  }
}

export const site = () => SITE.site;
export const store = () => S;
export const courses = () => SITE.courses;
export const readyCourses = () => SITE.courses.filter((c) => c.ready);
export const course = (id) => COURSES.get(id);
export const module = (id) => MODULES.get(id);
export const lesson = (id) => LESSONS.get(id);
export const item = (id) => ITEMS.get(id);
export const lessonsOf = (c) => c.modules.flatMap((m) => m.lessons);

// ── Links ──
export const courseHref = (c) => `#/c/${c.id}`;
export function lessonHref(l, at) {
  const base = `#/c/${l.course.id}/${l.module.slug}/${l.slug}`;
  if (at === undefined || at === null) return base;
  return l.kind === "workshop" ? `${base}/${at}` : `${base}?at=${encodeURIComponent(at)}`;
}
export function itemHref(id) {
  const it = ITEMS.get(id);
  if (!it) return "#/";
  return it.lesson.kind === "workshop" ? lessonHref(it.lesson, workshopIndex(it) + 1) : lessonHref(it.lesson, `ex-${id}`);
}
// Workshop steps are the lesson's graded items, in order.
export const workshopItems = (l) => (l.items || []).filter((x) => x.graded);
const workshopIndex = (it) => workshopItems(it.lesson).findIndex((x) => x.id === it.id);

// ── Items ──
const itemRow = (id) => S.one("SELECT * FROM item_state WHERE item_id = ?", [id]);
export const passed = (id) => !!S.value("SELECT passed FROM item_state WHERE item_id = ?", [id]);
export const fails = (id) => S.value("SELECT fails FROM item_state WHERE item_id = ?", [id]) || 0;
// A check or a prediction is answered once: a wrong first answer is missed, not retried.
const ONE_SHOT = new Set(["predict", "check"]);
export const oneShot = (it) => !!it && ONE_SHOT.has(it.type);
export const missed = (id) => oneShot(ITEMS.get(id)) && !passed(id) && !!S.value("SELECT attempts FROM item_state WHERE item_id = ?", [id]);
export const settled = (id) => passed(id) || missed(id);

export function recordAttempt(id, ok, { detail = null, lang = null } = {}) {
  const it = ITEMS.get(id);
  const l = it ? it.lesson : null;
  const t = now();
  const before = itemRow(id);
  const wasPassed = before && before.passed;
  S.tx(() => {
    S.run(`INSERT INTO attempt VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [uid(), id, l && l.course.id, l && l.id, it && it.type, lang, ok ? 1 : 0, detail, t, DEVICE]);
    S.run(
      `INSERT INTO item_state (item_id, course_id, lesson_id, kind, passed, attempts, fails, first_ok, passed_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
       ON CONFLICT (item_id) DO UPDATE SET
         attempts = attempts + 1,
         fails = fails + (CASE WHEN excluded.passed THEN 0 ELSE 1 END),
         passed = max(passed, excluded.passed),
         first_ok = coalesce(first_ok, CASE WHEN excluded.passed THEN (CASE WHEN fails = 0 THEN 1 ELSE 0 END) END),
         passed_at = coalesce(passed_at, excluded.passed_at),
         updated_at = excluded.updated_at`,
      [id, l && l.course.id, l && l.id, it && it.type, ok ? 1 : 0, ok ? 0 : 1, ok ? 1 : null, ok ? t : null, t]
    );
    if (l) touchLesson(l, t);
    reviewRules(it, id, ok, t);
  });
  if (ok && !wasPassed) {
    if (l) checkCompletion(l.course);
    changed({ type: "passed", id });
  } else changed({ type: "attempt", id });
}

// What goes to "Para repasar": a missed check or case answer, a judge failed twice, an exercise failed three times.
function reviewRules(it, id, ok, t) {
  if (!it) return;
  const open = S.one("SELECT * FROM review_item WHERE item_id = ?", [id]);
  if (ok) {
    if (open && !open.resolved_at && t - open.created_at > 10 * 60 * 1000) S.run("UPDATE review_item SET resolved_at = ? WHERE item_id = ?", [t, id]);
    return;
  }
  const f = S.value("SELECT fails FROM item_state WHERE item_id = ?", [id]) || 0;
  const needs = { check: 1, predict: 1, case: 1, judge: 2 }[it.type] ?? 3;
  if (f < needs) return;
  if (open && !open.resolved_at) return;
  const reason = it.type === "predict" || it.type === "check" ? "check" : it.type;
  S.run(
    `INSERT INTO review_item VALUES (?, ?, ?, ?, ?, ?, ?, NULL) ON CONFLICT (item_id) DO UPDATE SET resolved_at = NULL, created_at = excluded.created_at, reason = excluded.reason`,
    [id, it.lesson.course.id, it.lesson.id, mdPlain(it.title || it.lesson.title), itemHref(id), reason, t]
  );
}

export const savedCode = (id, lang) => S.value("SELECT code FROM saved_code WHERE item_id = ? AND lang = ?", [id, lang]);
export function saveCode(id, lang, code) {
  if (code === null) S.run("DELETE FROM saved_code WHERE item_id = ? AND lang = ?", [id, lang]);
  else S.run("INSERT INTO saved_code VALUES (?, ?, ?, ?) ON CONFLICT (item_id, lang) DO UPDATE SET code = excluded.code, updated_at = excluded.updated_at", [id, lang, code, now()]);
}
export const checkAnswer = (id) => S.one("SELECT * FROM check_answer WHERE check_id = ?", [id]);
export function saveCheckAnswer(id, lessonId, answer, correct) {
  S.run("INSERT INTO check_answer VALUES (?, ?, ?, ?, ?) ON CONFLICT (check_id) DO UPDATE SET answer = excluded.answer, correct = excluded.correct, at = excluded.at", [id, lessonId, String(answer), correct ? 1 : 0, now()]);
}

// ── Lessons ──
function touchLesson(l, t = now(), position) {
  S.run(
    `INSERT INTO lesson_state (lesson_id, course_id, module_id, state, position, opened_at, updated_at) VALUES (?, ?, ?, 'started', ?, ?, ?)
     ON CONFLICT (lesson_id) DO UPDATE SET updated_at = excluded.updated_at, position = coalesce(excluded.position, lesson_state.position)`,
    [l.id, l.course.id, l.module.id, position ? JSON.stringify(position) : null, t, t]
  );
}
export function openLesson(l, position) {
  touchLesson(l, now(), position);
  S.meta("last_lesson", l.id);
}
export function savePosition(l, position) {
  S.run("UPDATE lesson_state SET position = ?, updated_at = ? WHERE lesson_id = ?", [JSON.stringify(position), now(), l.id]);
}
export function position(l) {
  const p = S.value("SELECT position FROM lesson_state WHERE lesson_id = ?", [l.id]);
  return p ? JSON.parse(p) : null;
}
export function markRead(l, read = true) {
  const t = now();
  touchLesson(l, t);
  S.run("UPDATE lesson_state SET state = ?, done_at = ? WHERE lesson_id = ?", [read ? "done" : "started", read ? t : null, l.id]);
  if (read) checkCompletion(l.course);
  changed({ type: "read", id: l.id });
}
const lessonRow = (l) => S.one("SELECT * FROM lesson_state WHERE lesson_id = ?", [l.id]);

export function lessonState(l) {
  const row = lessonRow(l);
  if (l.kind === "workshop") {
    const its = workshopItems(l);
    const n = its.filter((x) => settled(x.id)).length;
    if (its.length && n === its.length) return "done";
    return n || row ? "half" : "none";
  }
  if (row && row.state === "done") return "done";
  return row ? "half" : "none";
}
export const lessonDone = (l) => lessonState(l) === "done";
export function lessonDoneAt(l) {
  if (l.kind === "workshop") {
    const its = workshopItems(l);
    if (!its.length) return null;
    if (!its.every((x) => settled(x.id))) return null;
    return S.value(`SELECT max(coalesce(passed_at, updated_at)) FROM item_state WHERE item_id IN (${its.map(() => "?").join(",")})`, its.map((x) => x.id));
  }
  const row = lessonRow(l);
  return row && row.state === "done" ? row.done_at : null;
}
export function workshopCount(l) {
  const its = workshopItems(l);
  return { done: its.filter((x) => settled(x.id)).length, total: its.length };
}

// ── Modules, gating and courses ──
const required = (m) => m.lessons.filter((l) => !l.optional);
export function moduleProgress(m) {
  const req = required(m);
  const done = req.filter(lessonDone).length;
  return { done, total: req.length, ratio: req.length ? done / req.length : 0 };
}
export const moduleComplete = (m) => {
  const p = moduleProgress(m);
  return p.total > 0 && p.done === p.total && gatePassed(m);
};
export function moduleState(m) {
  if (moduleComplete(m)) return "done";
  const p = moduleProgress(m);
  return p.done || m.lessons.some((l) => lessonState(l) !== "none") ? "half" : "none";
}
export const gatePassed = (m) => !m.gate || m.gate.items.every(passed);
export const gateMissing = (m) => (m.gate ? m.gate.items.map((id, i) => ({ id, label: m.gate.labels[i] })).filter((g) => !passed(g.id)) : []);
export function isOpen(m) {
  const c = m.course;
  if (!c.gated || m.index === 0) return true;
  const prev = c.modules[m.index - 1];
  return gatePassed(prev) || !!S.value("SELECT 1 FROM unlock WHERE module_id = ?", [m.id]);
}
export const prevModule = (m) => m.course.modules[m.index - 1] || null;
export const moduleTried = (m) => moduleProgress(m).done > 0 || !!S.value(`SELECT 1 FROM item_state WHERE attempts > 0 AND lesson_id IN (${m.lessons.map(() => "?").join(",")}) LIMIT 1`, m.lessons.map((l) => l.id));
export const unlockForTesting = (m) => S.run("INSERT OR IGNORE INTO unlock VALUES (?, ?)", [m.id, now()]);

export function courseProgress(c) {
  const ls = lessonsOf(c).filter((l) => !l.optional);
  const done = ls.filter(lessonDone).length;
  return { done, total: ls.length, ratio: ls.length ? done / ls.length : 0 };
}
export const courseDoneAt = (c) => S.value("SELECT done_at FROM course_done WHERE course_id = ?", [c.id]);
function checkCompletion(c) {
  if (courseDoneAt(c)) return;
  if (c.modules.length && c.modules.every(moduleComplete)) {
    S.run("INSERT OR IGNORE INTO course_done VALUES (?, ?)", [c.id, now()]);
    changed({ type: "course-done", id: c.id });
  }
}
export function checkAllCompletions() {
  for (const c of readyCourses()) checkCompletion(c);
}
export const courseStarted = (c) => !!S.value("SELECT 1 FROM lesson_state WHERE course_id = ? LIMIT 1", [c.id]);
export function courseLastAt(c) {
  return S.value("SELECT max(updated_at) FROM lesson_state WHERE course_id = ?", [c.id]);
}

// The next lesson: the first required one not done, in an open module.
export const nextLesson = (c) => lessonsOf(c).find((x) => !x.optional && !lessonDone(x) && isOpen(x.module)) || null;
export const nextInCourse = (l) => {
  const all = lessonsOf(l.course);
  return all[all.indexOf(l) + 1] || null;
};
export const prevInCourse = (l) => {
  const all = lessonsOf(l.course);
  return all[all.indexOf(l) - 1] || null;
};

// A Taller opens at the step you left, or at the first one not settled if that one is.
export function resumeStep(l) {
  const its = workshopItems(l);
  const at = (position(l) || {}).item;
  if (at && its[at - 1] && !settled(its[at - 1].id)) return at;
  const i = its.findIndex((x) => !settled(x.id));
  return i < 0 ? Math.min(at || 1, Math.max(1, its.length)) : i + 1;
}

// Where to continue a course: the lesson you touched last, or, once it is done, the first one after it
// still to do. Inicio, the course cards, the Temario and Mi progreso all point here.
export function courseResume(c) {
  const row = S.one("SELECT * FROM lesson_state WHERE course_id = ? ORDER BY updated_at DESC LIMIT 1", [c.id]);
  const l = row && LESSONS.get(row.lesson_id);
  if (!l) return null;
  const all = lessonsOf(c);
  const todo = (x) => !x.optional && !lessonDone(x) && isOpen(x.module);
  const target = lessonDone(l) ? all.slice(all.indexOf(l) + 1).find(todo) || all.find(todo) || null : l;
  if (!target) return { lesson: l, finished: true, at: row.updated_at, course: c };
  return { lesson: target, at: row.updated_at, course: c, position: target === l && row.position ? JSON.parse(row.position) : null, fresh: target !== l };
}
export const courseNext = (c) => {
  const r = courseResume(c);
  return r ? (r.finished ? null : r.lesson) : nextLesson(c);
};

// Where to continue: the course you touched last.
export function resume() {
  const row = S.one("SELECT lesson_id FROM lesson_state ORDER BY updated_at DESC LIMIT 1");
  const l = row && LESSONS.get(row.lesson_id);
  return l ? courseResume(l.course) : null;
}

// ── Notes ──
export const note = (l) => S.value("SELECT body FROM note WHERE lesson_id = ?", [l.id]) || "";
export function saveNote(l, body) {
  if (!body.trim()) S.run("DELETE FROM note WHERE lesson_id = ?", [l.id]);
  else S.run("INSERT INTO note VALUES (?, ?, ?, ?) ON CONFLICT (lesson_id) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at", [l.id, l.course.id, body, now()]);
}
export const notes = () => S.all("SELECT * FROM note ORDER BY updated_at DESC").filter((n) => LESSONS.has(n.lesson_id)).map((n) => ({ ...n, lesson: LESSONS.get(n.lesson_id) }));

// ── Images in notes and answers (referenced from the HTML by id) ──
export const attachment = (id) => S.one("SELECT mime, data FROM attachment WHERE id = ?", [id]);
export const attachmentBytes = () => S.value("SELECT coalesce(sum(size), 0) FROM attachment") || 0;
export function addAttachment({ mime, width, height, data }) {
  const id = uid();
  S.run("INSERT INTO attachment VALUES (?, ?, ?, ?, ?, ?, ?)", [id, mime, width, height, data.length, data, now()]);
  return id;
}
// Images no note or answer mentions any more, after a day (undo can still bring one back meanwhile).
export function pruneAttachments() {
  const orphan = "created_at < ? AND NOT EXISTS (SELECT 1 FROM note WHERE instr(body, attachment.id)) AND NOT EXISTS (SELECT 1 FROM saved_code WHERE instr(code, attachment.id))";
  const before = now() - 86400 * 1000;
  if (S.value(`SELECT count(*) FROM attachment WHERE ${orphan}`, [before])) S.run(`DELETE FROM attachment WHERE ${orphan}`, [before]);
}

// ── Study time ──
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export function addStudy(seconds) {
  S.run("INSERT INTO study_day VALUES (?, ?, ?, ?) ON CONFLICT (day, device) DO UPDATE SET seconds = seconds + excluded.seconds, updated_at = excluded.updated_at", [dayKey(), DEVICE, seconds, now()]);
}
export function studyDays(from) {
  const out = new Map();
  for (const r of S.all("SELECT day, sum(seconds) AS s FROM study_day WHERE day >= ? GROUP BY day", [from])) out.set(r.day, r.s);
  return out;
}
export const studyTotal = (from = "0000") => S.value("SELECT coalesce(sum(seconds), 0) FROM study_day WHERE day >= ?", [from]);

// ── Review queue ──
export const reviewItems = () => S.all("SELECT * FROM review_item WHERE resolved_at IS NULL ORDER BY created_at DESC").filter((r) => ITEMS.has(r.item_id)).map((r) => ({ ...r, href: itemHref(r.item_id), item: ITEMS.get(r.item_id) }));
export const dismissReview = (id) => S.run("UPDATE review_item SET resolved_at = ? WHERE item_id = ?", [now(), id]);

// ── Numbers for Mi progreso ──
export function accuracy(from = 0) {
  const r = S.one("SELECT count(*) AS n, sum(ok) AS ok FROM attempt WHERE at >= ? AND kind IN ('predict', 'check', 'case', 'judge', 'mission')", [from]);
  return r.n ? r.ok / r.n : null;
}
export function lessonsDoneSince(from = 0) {
  let n = 0;
  for (const c of readyCourses()) for (const l of lessonsOf(c)) {
    const at = lessonDoneAt(l);
    if (at && at >= from) n++;
  }
  return n;
}
// Mastery by topic (module): of the items tried, how many were right the first time, and what's still open.
export function mastery() {
  const rows = S.all("SELECT lesson_id, count(*) AS n, sum(passed) AS ok, sum(coalesce(first_ok, 0)) AS first, sum(fails) AS fails FROM item_state GROUP BY lesson_id");
  const byModule = new Map();
  for (const r of rows) {
    const l = LESSONS.get(r.lesson_id);
    if (!l) continue;
    const m = byModule.get(l.module.id) || { module: l.module, n: 0, ok: 0, first: 0, fails: 0 };
    m.n += r.n; m.ok += r.ok; m.first += r.first; m.fails += r.fails;
    byModule.set(l.module.id, m);
  }
  return [...byModule.values()].map((m) => ({ ...m, score: m.n ? (m.first + 0.5 * (m.ok - m.first)) / m.n : 0 }));
}

// Something Mi progreso can count: a lesson done, an answer given, or a minute studied. Opening a lesson is not enough.
export function hasAnyProgress() {
  return !!S.value("SELECT 1 FROM lesson_state WHERE state = 'done' LIMIT 1") || !!S.value("SELECT 1 FROM item_state WHERE attempts > 0 LIMIT 1") || studyTotal() >= 60;
}

export const pref = (key, fallback = null) => {
  const v = S.value("SELECT value FROM pref WHERE key = ?", [key]);
  return v === null ? fallback : JSON.parse(v);
};
export const setPref = (key, value) => S.run("INSERT INTO pref VALUES (?, ?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at", [key, JSON.stringify(value), now()]);

// The learner's profile (name, email, daily goal in minutes) and whether the welcome was done,
// skipped or offered. It stays in the progress database: on this device, in exports and the sync file.
const PROFILE_KEYS = ["name", "email", "goal", "welcome"];
export function profile() {
  const out = { name: "", email: "", goal: 0, welcome: null };
  for (const r of S.all("SELECT key, value FROM profile")) {
    if (!PROFILE_KEYS.includes(r.key) || r.value === null) continue;
    out[r.key] = r.key === "goal" ? Number(r.value) || 0 : r.value;
  }
  return out;
}
export function setProfile(patch) {
  const t = now();
  S.tx(() => {
    for (const [k, v] of Object.entries(patch)) {
      if (!PROFILE_KEYS.includes(k)) continue;
      const value = v === null || v === undefined || v === "" ? null : String(v);
      S.run("INSERT INTO profile VALUES (?, ?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at", [k, value, t]);
    }
  });
  changed({ type: "profile" });
}
export const validEmail = (s) => /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(String(s).trim());
// Minutes studied today and on each of the last n days, for the daily goal.
export const studyToday = () => studyDays(dayKey()).get(dayKey()) || 0;
export function goalDays(goalMin, n = 7) {
  const from = new Date();
  from.setDate(from.getDate() - (n - 1));
  const days = studyDays(dayKey(from));
  let met = 0;
  for (const s of days.values()) if (s >= goalMin * 60) met++;
  return met;
}
