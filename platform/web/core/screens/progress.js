// Mi progreso: how much you studied and when, each course module by module, what you master,
// what to review, what you finished, your notes. Honest numbers, no points.
import { md, mdPlain } from "../inline.js";
import { esc, icon } from "../dom.js";
import { t, tn, ago, date, duration } from "../i18n.js";
import * as P from "../progress.js";
import { kpi, seg, onSeg, empty, button } from "../ui.js";
import { setSection } from "../shell.js";
import { moduleLabel, pctText, lessonWhere } from "./parts.js";
import { reviewList, goalCard } from "./home.js";
import { richText, richImages } from "../rich.js";

const RANGES = { week: 7, quarter: 91, all: 3650 };

function calendar(days) {
  const today = new Date();
  const end = new Date(today);
  end.setDate(today.getDate() + (6 - ((today.getDay() + 6) % 7)));
  const start = new Date(end);
  start.setDate(end.getDate() - (Math.min(days, 371) <= 7 ? 7 * 8 : Math.ceil(Math.min(days, 371) / 7) * 7) + 1);
  const data = P.studyDays(P.dayKey(start));
  const max = Math.max(1, ...data.values());
  const cells = [];
  const fmt = new Intl.DateTimeFormat(document.documentElement.lang, { weekday: "short", day: "numeric", month: "short" });
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const s = data.get(P.dayKey(d)) || 0;
    const future = d > today;
    const lvl = s ? Math.min(4, 1 + Math.floor((s / max) * 3.99)) : 0;
    cells.push(`<i data-l="${lvl}"${future ? ' class="out"' : ` data-tip="${esc(`${fmt.format(d)} · ${s ? duration(s) : t("week.none")}`)}"`}></i>`);
  }
  return `<div class="cal" role="img" aria-label="${esc(t("progress.calAria"))}">${cells.join("")}</div>
    <p class="cal-legend">${esc(t("progress.less"))}<i style="background:var(--raise-2)"></i><i style="background:color-mix(in srgb,var(--accent) 30%,var(--raise-2))"></i><i style="background:color-mix(in srgb,var(--accent) 60%,var(--raise-2))"></i><i style="background:var(--accent)"></i>${esc(t("progress.more"))}</p>`;
}

function courseRows() {
  return P.readyCourses()
    .map((c) => {
      const p = P.courseProgress(c);
      const doneAt = P.courseDoneAt(c);
      const next = P.courseNext(c);
      const last = P.courseLastAt(c);
      const segs = c.modules.map((m) => {
        const mp = P.moduleProgress(m);
        const st = P.moduleState(m);
        return `<i class="${st === "done" ? "done" : mp.done ? "half" : ""}" style="--p:${Math.round(mp.ratio * 100)}%" data-tip="${esc(`${moduleLabel(m)} · ${m.title} · ${st === "done" ? t("module.done") : t("module.count", { done: mp.done, total: mp.total })}`)}"></i>`;
      });
      return `<div class="crow">
        <div class="crow-t"><b>${md(c.title)}</b><small>${esc(doneAt ? t("course.finishedOn", { date: date(doneAt) }) : next ? `${t("course.next")} ${moduleLabel(next.module)} · ${mdPlain(lessonWhere(next))}` : "")}</small></div>
        <div class="mbar" role="img" aria-label="${esc(t("progress.modulesAria", { done: c.modules.filter((m) => P.moduleState(m) === "done").length, total: c.modules.length }))}">${segs.join("")}</div>
        <span class="crow-p${doneAt ? " ok" : ""}">${esc(pctText(p.ratio))}</span>
        <span class="crow-l faint">${esc(last ? ago(last) : t("course.notStarted"))}</span>
        <a class="link" href="${esc(doneAt ? `#/c/${c.id}/fin` : next ? P.lessonHref(next) : P.courseHref(c))}">${esc(doneAt ? t("progress.review") : last ? t("progress.continue") : t("course.start"))}</a>
      </div>`;
    })
    .join("");
}

function masteryList() {
  const list = P.mastery().sort((a, b) => b.n - a.n).slice(0, 8);
  if (!list.length) return empty("target", t("progress.masteryEmpty"), t("progress.masteryEmptyBody"));
  return `<ul class="items">${list
    .map((m) => {
      const on = Math.round(m.score * 4);
      return `<li class="mastery"><span><span class="t">${md(m.module.title)}</span><small>${md(m.module.course.title)} · ${esc(t("progress.masteryLine", { ok: m.ok, n: m.n }))}${on <= 2 ? ` · ${esc(t("progress.worthReview"))}` : ""}</small></span>
        <span class="meter${on <= 2 ? " low" : ""}" role="img" aria-label="${esc(t("progress.masteryAria", { n: on }))}" data-tip="${esc(t("progress.masteryTip", { pct: pctText(m.score) }))}">${[0, 1, 2, 3].map((i) => `<i class="${i < on ? "on" : ""}"></i>`).join("")}</span></li>`;
    })
    .join("")}</ul>`;
}

export function render(view) {
  setSection("progress");
  let range = P.pref("progress.range", "quarter");
  const paint = () => {
    const days = RANGES[range] || 91;
    const from = Date.now() - days * 86400 * 1000;
    const since = new Date(from);
    const lessons = P.lessonsDoneSince(range === "all" ? 0 : from);
    const secs = P.studyTotal(range === "all" ? "0000" : P.dayKey(since));
    const acc = P.accuracy(range === "all" ? 0 : from);
    const finished = P.readyCourses().filter((c) => P.courseDoneAt(c));
    const review = P.reviewItems();
    const notes = P.notes();
    const any = P.hasAnyProgress();
    const month = P.lessonsDoneSince(Date.now() - 30 * 86400 * 1000);
    const transfer = `<a class="link" href="#/ajustes?at=transfer">${esc(t("progress.transferLink"))}</a>`;
    if (!any) {
      view.innerHTML = `<div class="wrap page progress enter">
        <header class="page-h" style="--i:0"><h1>${esc(t("progress.title"))}</h1></header>
        <div class="card card-pad" style="--i:1">${empty("sprout", t("progress.emptyTitle"), t("progress.emptyBody"))}<div class="btns center">${button({ label: t("home.start"), href: "#/", kind: "primary" })}</div><p class="center small prog-transfer">${transfer}</p></div>
        ${goalCard(P.profile().goal).replace('class="card card-pad goal"', 'class="card card-pad goal prog-goalcard" style="--i:2"')}
      </div>`;
      return;
    }
    view.innerHTML = `<div class="wrap page progress enter">
      <header class="page-h row" style="--i:0"><h1>${esc(t("progress.title"))}</h1>
        ${seg("range", [{ value: "week", label: t("progress.week") }, { value: "quarter", label: t("progress.quarter") }, { value: "all", label: t("progress.all") }], range, { label: t("progress.range") })}</header>
      <section class="kpis" style="--i:1">
        ${kpi({ k: t("progress.kLessons"), v: String(lessons), d: month ? tn("progress.kLessonsD", month) : "", ic: "book-open-check", tip: t("progress.kLessonsTip") })}
        ${kpi({ k: t("progress.kTime"), v: esc(secs >= 3600 ? `${Math.round(secs / 360) / 10} h` : `${Math.round(secs / 60)} min`), d: secs ? esc(t("progress.kTimeD", { avg: duration(secs / Math.max(1, days / 7)) })) : "", ic: "clock", tip: t("progress.kTimeTip") })}
        ${kpi({ k: t("progress.kAcc"), v: acc === null ? "—" : esc(pctText(acc)), d: esc(acc === null ? t("progress.kAccNone") : t("progress.kAccD")), ic: "target", tip: t("progress.kAccTip") })}
        ${kpi({ k: t("progress.kDone"), v: `${finished.length} <small>${esc(t("progress.of", { n: P.readyCourses().length }))}</small>`, d: esc(finished.map((c) => c.title).join(", ")), ic: "flag", tip: t("progress.kDoneTip") })}
      </section>
      <div class="prog-grid" style="--i:2">
        <div class="prog-main">
          <section class="card card-pad"><h3>${esc(t("progress.when"))}</h3><p class="sub">${esc(t("progress.whenSub"))}</p>${calendar(days)}</section>
          <section class="card card-pad"><h3>${esc(t("progress.byModule"))}</h3><p class="sub">${esc(t("progress.byModuleSub"))}</p><div class="crows">${courseRows()}</div></section>
        </div>
        <aside class="prog-side">
          ${goalCard(P.profile().goal) || `<p class="small prog-goal">${icon("target", "ic-s")}<a class="link" href="#/ajustes?at=perfil">${esc(t("goal.set"))}</a></p>`}
          <section class="card card-pad"><h3>${esc(t("progress.mastery"))}</h3><p class="sub">${esc(t("progress.masterySub"))}</p>${masteryList()}</section>
          <section class="card card-pad"><h3>${esc(t("home.review"))}</h3><p class="sub">${esc(t("progress.reviewSub"))}</p>${review.length ? reviewList(review, 8, { dismiss: true }) : empty("circle-check", t("progress.reviewEmpty"))}</section>
          <section class="card card-pad"><h3>${esc(t("progress.finished"))}</h3>${finished.length ? finished.map((c) => `<a class="done-course" href="#/c/${esc(c.id)}/fin">${icon("circle-check", "ic-l")}<span><b>${md(c.title)}</b><small>${esc(date(P.courseDoneAt(c)))} · ${esc(tn("count.modules", c.modules.length))}</small></span></a>`).join("") : `<p class="muted small">${esc(t("progress.finishedNone"))}</p>`}</section>
          <section class="card card-pad" id="notas"><h3>${esc(t("progress.notes"))}</h3>${notes.length ? `<ul class="items">${notes.slice(0, 20).map((n) => `<li><a class="link t" href="${esc(P.lessonHref(n.lesson))}">${md(n.lesson.course.title)} · ${md(n.lesson.title)}</a><small class="note-body">${esc(richText(n.body).slice(0, 220))}${richImages(n.body) ? `<span class="note-img">${icon("image", "ic-s")}${esc(tn("rich.images", richImages(n.body)))}</span>` : ""}</small></li>`).join("")}</ul>` : `<p class="muted small">${esc(t("progress.notesNone"))}</p>`}</section>
          <p class="small prog-transfer">${transfer}</p>
        </aside>
      </div>
    </div>`;
    onSeg(view, "range", (v) => { range = v; P.setPref("progress.range", v); paint(); });
    view.querySelectorAll("[data-dismiss]").forEach((b) => b.addEventListener("click", () => { P.dismissReview(b.dataset.dismiss); paint(); }));
  };
  paint();
}
