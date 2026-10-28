// The close of a course: what you can do now, what stayed weak, what comes next.
import { md, mdPlain } from "../inline.js";
import { esc, icon } from "../dom.js";
import { t, tn, date, duration } from "../i18n.js";
import * as P from "../progress.js";
import { button, empty, confetti } from "../ui.js";
import { setSection } from "../shell.js";
import { pctText } from "./parts.js";

export function render(view, route) {
  const c = P.course(route.course);
  if (!c) return void (location.hash = "#/");
  setSection("courses");
  const doneAt = P.courseDoneAt(c);
  const p = P.courseProgress(c);
  const S = P.store();
  const acc = S.one("SELECT count(*) AS n, sum(ok) AS ok FROM attempt WHERE course_id = ? AND kind IN ('case', 'judge', 'mission', 'predict', 'check')", [c.id]);
  const weak = P.mastery().filter((m) => m.module.course === c && m.score < 0.6).sort((a, b) => a.score - b.score);
  const nextCourse = P.readyCourses().find((x) => x !== c && !P.courseDoneAt(x));
  if (!doneAt) {
    view.innerHTML = `<div class="wrap page enter"><section class="card card-pad">${empty("flag", t("finish.notYet", { title: mdPlain(c.title) }), t("finish.notYetBody", { pct: pctText(p.ratio) }))}<div class="btns center">${button({ label: t("course.backToSyllabus"), href: P.courseHref(c), kind: "primary" })}</div></section></div>`;
    return;
  }
  view.innerHTML = `<div class="wrap page finished enter">
    <section class="card fin-hero" style="--i:0">
      <span class="fin-mark">${icon("circle-check")}</span>
      <p class="kick">${esc(t("finish.kicker"))} · ${esc(date(doneAt))}</p>
      <h1>${esc(t("finish.title", { title: mdPlain(c.title) }))}</h1>
      <p class="facts">${esc(tn("count.modules", c.modules.length))} · ~${esc(c.minutes >= 180 ? t("time.h", { h: Math.round(c.minutes / 60) }) : duration(c.minutes * 60))}${acc.n ? ` · ${esc(t("finish.accuracy", { pct: pctText(acc.ok / acc.n) }))}` : ""}</p>
    </section>
    <div class="fin-grid" style="--i:1">
      <section class="card card-pad"><h3>${esc(t("finish.canDo"))}</h3><ul class="checks">${(c.outcomes || []).map((o) => `<li>${icon("check")}<span>${esc(o)}</span></li>`).join("")}</ul></section>
      <section class="card card-pad"><h3>${esc(t("finish.weak"))}</h3>
        ${weak.length ? `<ul class="items">${weak.slice(0, 4).map((m) => `<li><a class="link t" href="${esc(P.lessonHref(m.module.lessons[0]))}">${md(m.module.title)}</a><small>${esc(t("progress.masteryLine", { ok: m.ok, n: m.n }))}</small></li>`).join("")}</ul>` : `<p class="muted">${esc(t("finish.noWeak"))}</p>`}
      </section>
      <section class="card card-pad"><h3>${esc(t("finish.next"))}</h3>
        ${nextCourse ? `<p><b>${md(nextCourse.title)}</b></p><p class="muted small">${esc(nextCourse.tagline)}</p><div class="btns">${button({ label: P.courseStarted(nextCourse) ? t("progress.continue") : t("home.start"), href: P.courseHref(nextCourse), kind: "primary", iconEnd: "arrow-right" })}</div>` : `<p class="muted">${esc(t("finish.allDone"))}</p>`}
      </section>
    </div>
  </div>`;
  const seen = P.pref("finish.celebrated", []);
  if (!seen.includes(c.id)) {
    P.setPref("finish.celebrated", [...seen, c.id]);
    requestAnimationFrame(() => confetti({ from: view.querySelector(".fin-mark") }));
  }
}
