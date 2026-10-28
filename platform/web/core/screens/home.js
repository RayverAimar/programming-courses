// Inicio: where you left off and what's next. Back in one click, to the exact section.
import { esc, icon } from "../dom.js";
import { md, mdPlain } from "../inline.js";
import { t, tn, tc, ago, duration, deviceName } from "../i18n.js";
import { ROOT } from "../paths.js";
import * as P from "../progress.js";
import { button, bar, sheet } from "../ui.js";
import { setSection } from "../shell.js";
import { syncInfo } from "../boot.js";
import { profilePrompt, wirePrompt } from "../onboarding.js";
import { courseCardFor, moduleLabel, loadPayload } from "./parts.js";

const WEEK_MS = 7 * 86400 * 1000;

export function weekBars() {
  const days = [];
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  const data = P.studyDays(P.dayKey(monday));
  const max = Math.max(1, ...data.values());
  const total = [...data.values()].reduce((a, b) => a + b, 0);
  const fmt = new Intl.DateTimeFormat(document.documentElement.lang, { weekday: "narrow" });
  const long = new Intl.DateTimeFormat(document.documentElement.lang, { weekday: "long", day: "numeric", month: "short" });
  const html = `<div class="week" role="img" aria-label="${esc(t("week.aria", { total: duration(total) }))}">${days
    .map((d) => {
      const s = data.get(P.dayKey(d)) || 0;
      const h = s ? Math.max(8, Math.round((s / max) * 72)) : 4;
      return `<div data-tip="${esc(`${long.format(d)} · ${s ? duration(s) : t("week.none")}`)}"><i class="${s ? "" : "z"}" style="height:${h}px"></i><span>${esc(fmt.format(d))}</span></div>`;
    })
    .join("")}</div>`;
  return { html, total };
}

export function reviewList(items, limit = 5, { dismiss = false } = {}) {
  return `<ul class="items">${items
    .slice(0, limit)
    .map((r) => `<li><a class="link t" href="${esc(r.href)}">${md(r.title)}</a><small>${md(r.item.lesson.course.title)} · ${esc(moduleLabel(r.item.lesson.module))} · ${esc(t(`review.reason.${r.reason}`))} · ${esc(ago(r.created_at))}</small>${dismiss ? `<span class="acts"><a class="link go" href="${esc(r.href)}">${esc(t("review.go"))} ${icon("arrow-right", "ic-s")}</a><button type="button" class="link" data-dismiss="${esc(r.item_id)}">${esc(t("review.dismiss"))}</button></span>` : ""}</li>`)
    .join("")}</ul>`;
}

// The optional three-minute recap offered after a week away: key ideas of what you read last, and what you missed.
export async function openRecap(l) {
  const before = [];
  for (let x = P.prevInCourse(l); x && before.length < 3; x = P.prevInCourse(x)) if (x.kind !== "workshop" && P.lessonState(x) !== "none") before.unshift(x);
  const parts = [];
  for (const x of before) {
    const payload = await loadPayload(x.module);
    const p = payload.lessons[x.slug] || {};
    const ideas = p.recap || (p.keyIdea ? [p.keyIdea] : p.summary ? [p.summary] : []);
    parts.push(`<li><a class="link t" href="${esc(P.lessonHref(x))}">${esc(moduleLabel(x.module))} · ${md(x.title)}</a>${ideas.length ? `<ul class="recap-ideas">${ideas.map((i) => `<li>${i}</li>`).join("")}</ul>` : ""}</li>`);
  }
  const missed = P.reviewItems().filter((r) => r.course_id === l.course.id).slice(0, 2);
  sheet({
    title: t("recap.title"),
    body: `<p class="muted">${esc(t("recap.lead"))}</p>
      ${parts.length ? `<h3 class="sheet-sub">${esc(t("recap.read"))}</h3><ul class="items recap-list">${parts.join("")}</ul>` : ""}
      ${missed.length ? `<h3 class="sheet-sub">${esc(t("recap.missed"))}</h3>${reviewList(missed)}` : ""}
      <div class="btns sheet-end">${button({ label: t("home.keepReading"), href: P.lessonHref(l), kind: "primary", iconEnd: "arrow-right" })}</div>`,
  });
}

function resumeCard(r) {
  const l = r.lesson;
  const c = l.course;
  const away = Date.now() - r.at > WEEK_MS;
  const mp = P.moduleProgress(l.module);
  const pos = r.position;
  const steps = l.kind === "workshop" ? P.workshopItems(l).length : 0;
  const where = r.fresh ? t("home.startsHere")
    : l.kind === "workshop" ? (pos && steps > 1 ? t("home.whereHeading", { heading: `${mdPlain(l.title)} · ${P.resumeStep(l)}` }) : t("home.whereStart"))
    : pos && pos.heading ? t("home.whereHeading", { heading: pos.heading }) : t("home.whereStart");
  return `<section class="card resume">
    <div class="resume-t">
      <p class="kick">${esc(t("home.continue"))} · ${md(c.title)}${away ? ` · ${esc(ago(r.at))}` : ""}</p>
      <h2>${md(l.title)}</h2>
      <p class="where">${esc(moduleLabel(l.module))} · ${md(l.module.title)} — ${esc(where)}</p>
      ${bar(mp.ratio, tc("home.moduleProgress", c.id, { done: mp.done, total: mp.total }), { ok: mp.ratio >= 1 })}
      <div class="btns">
        ${button({ label: l.kind === "workshop" ? t("home.keepWorking") : t("home.keepReading"), href: P.lessonHref(l), kind: "primary", iconEnd: "arrow-right" })}
        ${away ? button({ label: t("home.recapFirst"), icon: "history", cls: "recap-btn" }) : ""}
      </div>
    </div>
    <div class="resume-art" aria-hidden="true">${icon(l.kind === "workshop" ? "code-xml" : "book-open-text")}</div>
  </section>`;
}

function welcomeCard() {
  const c = P.readyCourses()[0];
  const l = c && P.lessonsOf(c)[0];
  if (!l) return "";
  return `<section class="card resume welcome">
    <div class="resume-t">
      <p class="kick">${esc(t("home.recommended"))}</p>
      <h2>${md(c.title)} · ${md(l.module.title)}</h2>
      <p class="where">${esc(moduleLabel(l.module))} · ${esc(t("time.min", { n: l.module.minutes }))} · ${esc(c.tagline)}</p>
      <div class="btns">${button({ label: t("home.start"), href: P.lessonHref(l), kind: "primary", iconEnd: "arrow-right" })}${button({ label: t("home.seeSyllabus"), href: P.courseHref(c), kind: "ghost" })}</div>
    </div>
    <div class="resume-art" aria-hidden="true"><img src="${ROOT}assets/icon.svg" alt="" width="112" height="112"></div>
  </section>`;
}

// The daily goal from the profile: today's minutes against it, and how many of the last 7 days met it.
export function goalCard(goal) {
  if (!goal) return "";
  const today = P.studyToday();
  const min = Math.floor(today / 60);
  return `<section class="card card-pad goal"><h3>${esc(t("goal.title"))}</h3>${bar(today / (goal * 60), t("goal.today", { n: Math.min(min, 999), goal }), { ok: today >= goal * 60 })}
    <p class="muted small">${esc(today >= goal * 60 ? t("goal.met") : t("goal.left", { n: Math.max(1, goal - min) }))} · ${esc(t("goal.week", { n: P.goalDays(goal) }))}</p></section>`;
}

export function hello(first) {
  const name = P.profile().name;
  return name ? t("home.helloName", { name }) : first ? t("home.welcome") : t("home.hello");
}

export function render(view) {
  setSection("home");
  const goal = P.profile().goal;
  const r = P.resume();
  const first = !r;
  const week = weekBars();
  const review = P.reviewItems();
  const sync = syncInfo();
  const recent = sync && Date.now() - sync.mergedAt < 36 * 3600 * 1000;
  const next = r && r.lesson ? r.lesson : null;
  view.innerHTML = `<div class="wrap home enter">
    <header class="hello" style="--i:0">
      <h1>${esc(hello(first))}</h1>
      <p>${esc(first ? t("home.welcomeLead") : week.total ? t("home.weekLead", { total: duration(week.total) }) + (next ? " " + t("home.nextLead", { n: next.minutes || 10 }) : "") : t("home.backLead"))}</p>
    </header>
    ${recent ? `<p class="banner" style="--i:1">${icon("refresh-cw")}${esc(t("sync.banner", { when: ago(sync.at), from: deviceName(sync.label) }))}</p>` : ""}
    <div class="home-grid${(first || (!week.total && !review.length)) && !goal ? " solo" : ""}" style="--i:1">
      <div class="home-main">
        ${profilePrompt()}
        ${first ? welcomeCard() : r.finished ? `<section class="card resume"><div class="resume-t"><p class="kick">${esc(r.course.title)}</p><h2>${esc(t("home.allDone"))}</h2><div class="btns">${button({ label: t("course.doneSee"), href: `#/c/${r.course.id}/fin`, kind: "primary" })}</div></div></section>` : resumeCard(r)}
        <div class="sec-h"><h2>${esc(first ? t("home.pick") : t("home.yourCourses"))}</h2>${first ? "" : `<a class="link" href="#/progreso">${esc(t("home.fullProgress"))}</a>`}</div>
        <div class="courses">${P.courses().map(courseCardFor).join("")}</div>
      </div>
      ${first && !goal ? "" : `<aside class="home-side">
        ${goalCard(goal)}
        ${!first && week.total ? `<section class="card card-pad"><h3>${esc(t("home.week"))}</h3>${week.html}<p class="sum"><span>${esc(duration(week.total))}</span><span>${esc(tn("home.lessonsWeek", P.lessonsDoneSince(Date.now() - WEEK_MS)))}</span></p></section>` : ""}
        ${!first && review.length ? `<section class="card card-pad"><h3>${esc(t("home.review"))}</h3>${reviewList(review, 4)}</section>` : ""}
      </aside>`}
    </div>
  </div>`;
  wirePrompt(view, () => render(view));
  const rb = view.querySelector(".recap-btn");
  if (rb) rb.addEventListener("click", () => openRecap(r.lesson));
}
