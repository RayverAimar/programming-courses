// Pieces several screens share: course cards, lesson chips, module labels, the locked notice.
import { mdPlain } from "../inline.js";
import { esc, icon } from "../dom.js";
import { t, tn, tc, ago, date } from "../i18n.js";
import * as P from "../progress.js";
import { courseCard, chip, button } from "../ui.js";
import { ROOT } from "../paths.js";

export const moduleLabel = (m) => tc("module.n", m.course.id, { n: m.n });
export const lessonNumber = (l) => `${l.module.n}.${l.n}`;
export const pctText = (r) => `${Math.round(r * 100)}%`;

// A lesson is a reading unless it says otherwise, so the reading chip is left out.
export function lessonChips(l) {
  return (l.activities || []).filter((a) => a.type !== "reading").map((a) => chip(a.type, tn(`act.${a.type}`, a.n || 1))).join("");
}

// "Module · lesson", or just the longer of the two when one already contains the other.
export function lessonWhere(l) {
  const m = mdPlain(l.module.title), x = mdPlain(l.title);
  return m.includes(x) ? m : x.includes(m) ? x : `${m} · ${x}`;
}

export function courseCardFor(c) {
  if (!c.ready) return courseCard({ title: c.title, tag: c.kicker, soon: true, metaL: c.native ? t("course.soonApp") : t("course.soon"), metaR: "" });
  const p = P.courseProgress(c);
  const doneAt = P.courseDoneAt(c);
  const next = P.courseNext(c);
  const last = P.courseLastAt(c);
  const m = next ? next.module : null;
  return courseCard({
    href: P.courseHref(c),
    tag: c.kicker,
    tagType: c.tagType || "code",
    title: c.title,
    pct: last ? pctText(p.ratio) : null,
    ratio: last ? p.ratio : null,
    done: !!doneAt,
    next: doneAt ? null : next ? lessonWhere(next) : null,
    metaL: doneAt ? t("course.finishedOn", { date: date(doneAt) }) : m ? t("course.moduleOf", { label: moduleLabel(m), total: c.modules.length }) : tn("count.modules", c.modules.length),
    metaR: last ? ago(last) : t("course.notStarted"),
  });
}

// Where a course's module stands for the learner, in words.
export function lockText(m) {
  const prev = P.prevModule(m);
  return tc("lock.opensWhen", m.course.id, { what: P.gateMissing(prev).map((g) => g.label).join(t("ui.and")) || prev.gate.labels.join(t("ui.and")), n: prev.n, title: mdPlain(prev.title) });
}

export async function loadPayload(m) {
  if (!m.payload) m.payload = fetch(ROOT + m.file).then((r) => {
    if (!r.ok) throw new Error(`${m.file}: ${r.status}`);
    return r.json();
  }).catch((e) => {
    m.payload = null;
    throw e;
  });
  return m.payload;
}

export const backLink = (href, label) => `<a class="back" href="${esc(href)}">${icon("arrow-left")}<span>${esc(label)}</span></a>`;

export const lockedNotice = (m) => {
  const prev = P.prevModule(m);
  const missing = P.gateMissing(prev);
  const target = missing[0] ? P.itemHref(missing[0].id) : P.courseHref(m.course);
  return `<div class="locknote">${icon("lock")}<div><p><b>${esc(lockText(m))}</b></p>
    <div class="btns">${button({ label: tc("lock.go", m.course.id), href: target, kind: "primary", small: true, iconEnd: "arrow-right" })}</div></div></div>`;
};
