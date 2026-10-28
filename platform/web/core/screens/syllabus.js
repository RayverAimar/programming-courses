// Temario: the course cover, read like the contents of a good book.
import { md, mdPlain } from "../inline.js";
import { esc, icon } from "../dom.js";
import { t, tn, tc, ago, duration } from "../i18n.js";
import * as P from "../progress.js";
import { button, ring, bar, lessonRow } from "../ui.js";
import { setSection } from "../shell.js";
import { adapter } from "../adapter.js";
import { devMode } from "../caps.js";
import { moduleLabel, lessonChips, lessonNumber, lockText, pctText } from "./parts.js";

function moduleBlock(m, current) {
  const c = m.course;
  const open = P.isOpen(m);
  const st = P.moduleState(m);
  const mp = P.moduleProgress(m);
  const missing = c.gated && open && st !== "done" && P.moduleTried(m) ? P.gateMissing(m) : [];
  const status = !open ? t("module.locked") : st === "done" ? t("module.done") : st === "none" ? t("module.notStarted") : t("module.count", { done: mp.done, total: mp.total });
  const counts = (m.counts || []).map((x) => tn(x.key, x.n)).join(" · ");
  const prev = P.prevModule(m);
  const missingPrev = prev ? P.gateMissing(prev) : [];
  const lockBox = open ? "" : `<div class="mod-lock">${icon("lock")}<div><p>${esc(lockText(m))}</p>
      <div class="btns">${button({ label: tc("lock.go", c.id), href: missingPrev[0] ? P.itemHref(missingPrev[0].id) : P.courseHref(c), kind: "primary", small: true, iconEnd: "arrow-right" })}
      ${button({ label: t("lock.peek"), small: true, kind: "ghost", cls: "peek", icon: "eye" })}
      ${devMode() ? button({ label: tc("lock.skip", c.id), small: true, kind: "ghost", cls: "skip-lock", attrs: { "data-module": m.id }, tip: t("lock.skipTip") }) : ""}</div></div></div>`;
  const rows = m.lessons
    .map((l) => lessonRow({
      href: P.lessonHref(l),
      state: P.lessonState(l),
      number: lessonNumber(l),
      title: l.title,
      chips: lessonChips(l),
      minutes: l.minutes,
      current: current === l,
      locked: !open,
      optional: l.optional,
    }))
    .join("");
  return `<details class="card mod mod-${!open ? "locked" : st}" ${current && current.module === m ? "open" : ""} data-module="${esc(m.id)}">
    <summary>
      <span class="mod-n" aria-hidden="true">${!open ? icon("lock") : st === "done" ? icon("check") : m.n}</span>
      <span class="mod-t"><h3>${esc(moduleLabel(m))} · ${md(m.title)}</h3>${m.subtitle ? `<span class="mod-s">${md(m.subtitle)}</span>` : ""}<span class="sub">${esc(counts)}${missing.length ? ` · <b class="need">${esc(t("module.missing", { list: missing.map((x) => x.label).join(t("ui.and")) }))}</b>` : ""}</span></span>
      <span class="mod-p">${open ? bar(mp.ratio, status, { ok: st === "done", thin: true }) : `<span class="muted small">${esc(status)}</span>`}</span>
      <span class="mod-c" aria-hidden="true">${icon("chevron-down")}</span>
    </summary>
    ${lockBox}
    <div class="lrows${open ? "" : " peekable"}" ${open ? "" : "hidden"}>${rows}</div>
  </details>`;
}

export function render(view, route) {
  const c = P.course(route.course);
  if (!c || !c.ready) return void (location.hash = "#/cursos");
  setSection("courses");
  if (adapter().onEnterCourse) adapter().onEnterCourse(c);
  const p = P.courseProgress(c);
  const next = P.courseNext(c);
  const last = P.courseLastAt(c);
  const doneAt = P.courseDoneAt(c);
  const started = P.courseStarted(c);
  view.innerHTML = `<div class="wrap syllabus enter">
    <header class="syl-head" style="--i:0">
      <div>
        <p class="kick">${esc(c.kicker)}</p>
        <h1>${md(c.title)}</h1>
        <p class="lead">${esc(c.tagline)}</p>
        <p class="facts">${(c.facts || []).map((f) => `<span>${tn(f.key, f.n).replace(/^(\S+)/, "<b>$1</b>")}</span>`).join("")}<span><b>~${esc(c.minutes >= 180 ? t("time.h", { h: Math.round(c.minutes / 60) }) : duration(c.minutes * 60))}</b></span></p>
      </div>
      <aside class="card mine">
        ${ring(p.ratio, { label: t("course.ringLabel", { pct: pctText(p.ratio) }) })}
        <p class="l">${esc(t("course.lessonsDone", { done: p.done, total: p.total }))}${last ? ` · ${esc(t("course.lastTime", { when: ago(last) }))}` : ""}</p>
        ${doneAt ? button({ label: t("course.doneSee"), href: `#/c/${c.id}/fin`, kind: "primary", block: true })
          : next ? button({ label: started ? t("course.continueAt", { n: lessonNumber(next), title: mdPlain(next.title) }) : t("course.start"), href: P.lessonHref(next), kind: "primary", block: true, iconEnd: "arrow-right" }) : ""}
      </aside>
    </header>
    ${c.outcomes && c.outcomes.length ? `<section class="outcomes" style="--i:1" aria-label="${esc(t("course.outcomes"))}">${c.outcomes.map((o) => `<div>${icon("arrow-right")}<span>${esc(o)}</span></div>`).join("")}</section>` : ""}
    <div class="sec-h" style="--i:2"><h2>${esc(t("course.syllabus"))}</h2><span>${esc(c.gated ? tc("course.gatedHint", c.id) : t("course.freeHint"))}</span></div>
    <div class="modules" style="--i:2">${c.modules.map((m) => moduleBlock(m, next)).join("")}</div>
    ${(c.extras || []).length ? `<div class="sec-h"><h2>${esc(t("course.extras"))}</h2></div><div class="lrows card extras">${c.extras.map((x) => `<a class="lrow" href="${esc(x.href)}"><span class="st">${icon(x.icon || "book-open")}</span><span class="t">${esc(x.title)}<small>${esc(x.blurb)}</small></span><span class="r">${icon("arrow-right")}</span></a>`).join("")}</div>` : ""}
  </div>`;
  view.querySelectorAll(".peek").forEach((b) => b.addEventListener("click", () => {
    const rows = b.closest(".mod").querySelector(".lrows");
    rows.hidden = !rows.hidden;
    b.setAttribute("aria-expanded", String(!rows.hidden));
  }));
  view.querySelectorAll(".skip-lock").forEach((b) => b.addEventListener("click", () => {
    P.unlockForTesting(P.module(b.dataset.module));
    render(view, route);
  }));
}
