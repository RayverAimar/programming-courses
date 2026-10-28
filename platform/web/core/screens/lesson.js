// Lección: a reading with goals, live figures, optional quick checks, recap, notes, mark as read, next.
// Module contents on the left (wide screens), sections of this lesson on the right.
import { md, mdPlain } from "../inline.js";
import { esc, icon, $$, debounce, reduceMotion } from "../dom.js";
import { t, tc } from "../i18n.js";
import * as P from "../progress.js";
import { button, stateIcon, bar, goals, recap, notesBox, sheet } from "../ui.js";
import { setSection, cycleTheme } from "../shell.js";
import { searchButton } from "../search.js";
import { adapter } from "../adapter.js";
import { moduleLabel, lessonChips, lessonNumber, loadPayload, lockText, pctText } from "./parts.js";
import * as workshop from "./workshop.js";

export function moduleToc(l, { inSheet = false } = {}) {
  const c = l.course;
  const p = P.courseProgress(c);
  const m = l.module;
  const nextM = c.modules[m.index + 1];
  return `<div class="toc${inSheet ? " in-sheet" : ""}">
    ${inSheet ? "" : `<a class="back" href="${esc(P.courseHref(c))}">${icon("arrow-left")}<span>${md(c.title)}</span></a>${bar(p.ratio, t("course.pctOf", { pct: pctText(p.ratio) }), { ok: p.ratio >= 1, thin: true })}`}
    ${inSheet ? "" : `<p class="toc-m kick">${esc(moduleLabel(m))} · ${md(m.title)}</p>`}
    <ol class="toc-list">${m.lessons
      .map((x) => `<li><a href="${esc(P.lessonHref(x))}"${x === l ? ' aria-current="page"' : ""}>${stateIcon(P.lessonState(x))}<span>${md(x.title)}${x.kind === "workshop" && t(`kind.${x.type || "workshop"}`) !== mdPlain(x.title) ? `<small>${esc(t(`kind.${x.type || "workshop"}`))}</small>` : ""}</span></a></li>`)
      .join("")}</ol>
    ${nextM ? `<p class="toc-next"><a class="link" href="${esc(P.courseHref(c))}">${P.isOpen(nextM) ? "" : icon("lock", "ic-s")}${esc(moduleLabel(nextM))} · ${md(nextM.title)}</a></p>` : ""}
  </div>`;
}

export function lessonBar(l, { right = "" } = {}) {
  const c = l.course;
  const i = l.index + 1, n = l.module.lessons.length;
  return `<header class="lbar"><div class="lbar-in">
    <a class="back" href="${esc(P.courseHref(c))}" data-tip="${esc(t("lesson.backTo", { title: mdPlain(c.title) }))}">${icon("arrow-left")}<span>${md(c.title)}</span></a>
    <p class="lbar-crumb">${md(c.title)} · ${esc(moduleLabel(l.module))}: ${md(l.module.title)} · ${esc(tc("lesson.ofModule", c.id, { i, n }))}</p>
    <button type="button" class="toc-btn" aria-haspopup="dialog">${esc(tc("lesson.ofModule", c.id, { i, n }))}${icon("chevron-down", "ic-s")}</button>
    <span class="lbar-sp"></span>
    ${right}
    ${searchButton()}
    ${button({ label: t("theme.toggle"), kind: "icon", icon: "sun-moon", cls: "lbar-theme" })}
  </div><div class="readbar" aria-hidden="true"><i></i></div></header>`;
}

export function wireBar(root, l) {
  root.querySelector(".toc-btn").addEventListener("click", () => sheet({ title: `${moduleLabel(l.module)} · ${l.module.title}`, body: moduleToc(l, { inSheet: true }) }));
  root.querySelector(".lbar-theme").addEventListener("click", cycleTheme);
}

function lockedScreen(view, l) {
  const m = l.module;
  const prev = P.prevModule(m);
  const missing = P.gateMissing(prev);
  setSection("courses");
  window.scrollTo(0, 0);
  view.innerHTML = `<div class="wrap page enter"><section class="card locked" style="--i:0">
    ${icon("lock", "ic-l")}
    <p class="kick">${esc(moduleLabel(m))} · ${md(m.title)}</p>
    <h1>${esc(tc("lock.title", m.course.id))}</h1>
    <p>${esc(lockText(m))}</p>
    ${missing.length ? `<ul class="items">${missing.map((g) => `<li><a class="link go" href="${esc(P.itemHref(g.id))}">${esc(g.label)} ${icon("arrow-right", "ic-s")}</a></li>`).join("")}</ul>` : ""}
    <div class="btns">${missing.length ? "" : button({ label: tc("lock.go", m.course.id), href: P.courseHref(m.course), kind: "primary", iconEnd: "arrow-right" })}
    ${button({ label: t("lock.peek"), href: P.courseHref(m.course), kind: "ghost", icon: "eye" })}</div>
  </section></div>`;
}

export async function render(view, route, { keep } = {}) {
  const c = P.course(route.course);
  const m = c && c.modules.find((x) => x.slug === route.module);
  const l = m && m.lessons.find((x) => x.slug === route.lesson);
  if (!l) return void (location.hash = c ? P.courseHref(c) : "#/");
  if (!P.isOpen(m)) return lockedScreen(view, l);
  if (adapter().onEnterCourse) adapter().onEnterCourse(c);
  if (l.kind === "workshop") return workshop.render(view, route, l, { keep });
  setSection("courses", { focus: true });

  const payload = await loadPayload(m);
  const data = payload.lessons[l.slug];
  const saved = P.position(l);
  P.openLesson(l);
  const next = P.nextInCourse(l);
  const prev = P.prevInCourse(l);
  const read = P.lessonState(l) === "done";
  const nextLocked = next && !P.isOpen(next.module);

  view.innerHTML = `<div class="lesson">
    ${lessonBar(l)}
    <div class="lgrid">
      <nav class="ltoc" aria-label="${esc(t("lesson.toc"))}">${moduleToc(l)}</nav>
      <article class="lmain">
        <h1>${md(l.title)}</h1>
        <p class="lmeta"><span>${icon("clock", "ic-s")}${esc(t("time.min", { n: l.minutes }))}</span><span class="chips">${lessonChips(l)}</span></p>
        ${data.goals ? goals(data.goals) : ""}
        <div class="prose" id="prose"></div>
        ${data.recap ? recap(data.recap) : ""}
        <div class="lnotes"></div>
        <footer class="lfoot">
          ${button({ label: read ? t("lesson.read") : t("lesson.markRead"), icon: read ? "circle-check" : "check", cls: `mark${read ? " is-read" : ""}`, pressed: read })}
          ${next ? button({ label: t("lesson.next", { title: mdPlain(next.title) }), href: P.lessonHref(next), kind: "primary", iconEnd: nextLocked ? "lock" : "arrow-right", cls: "next-btn" }) : button({ label: t("lesson.backCourse"), href: P.courseHref(c), kind: "primary" })}
        </footer>
        ${prev ? `<p class="lprev"><a class="link" href="${esc(P.lessonHref(prev))}">${icon("arrow-left", "ic-s")}${esc(t("lesson.prev", { title: mdPlain(prev.title) }))}</a></p>` : ""}
      </article>
      <aside class="lrail" aria-label="${esc(t("lesson.sections"))}"></aside>
    </div>
    <nav class="lphone">${button({ label: tc("lesson.ofModule", c.id, { i: l.index + 1, n: m.lessons.length }), icon: "list", kind: "ghost", cls: "toc-btn2" })}${next ? button({ label: t("lesson.nextShort"), href: P.lessonHref(next), kind: "primary", iconEnd: "arrow-right", cls: "next-btn" }) : ""}</nav>
  </div>`;
  wireBar(view, l);
  view.querySelector(".toc-btn2").addEventListener("click", () => view.querySelector(".toc-btn").click());

  const prose = view.querySelector("#prose");
  const mounted = adapter().mountLesson(prose, { lesson: l, data, payload }) || {};
  notesBox(view.querySelector(".lnotes"), { value: P.note(l), onSave: (v) => P.saveNote(l, v) });

  const markBtn = view.querySelector(".mark");
  const paintMark = (on) => {
    markBtn.classList.toggle("is-read", on);
    markBtn.setAttribute("aria-pressed", String(on));
    markBtn.innerHTML = `${icon(on ? "circle-check" : "check")}<span>${esc(on ? t("lesson.read") : t("lesson.markRead"))}</span>`;
  };
  // The module contents and the course bar follow the moment a lesson is marked.
  const refreshToc = () => { view.querySelector(".ltoc").innerHTML = moduleToc(l); };
  markBtn.addEventListener("click", () => {
    const on = markBtn.getAttribute("aria-pressed") !== "true";
    P.markRead(l, on);
    paintMark(on);
    refreshToc();
  });

  // Sections of this lesson, for the rail: headings, figures and checks, lit as you pass them.
  const notesEl = view.querySelector(".lnotes");
  notesEl.id = "notas";
  notesEl.dataset.anchor = t("notes.title");
  const anchors = [...$$("h3[id], h2[id], [data-anchor]", prose).filter((a) => a.id), notesEl];
  const rail = view.querySelector(".lrail");
  if (anchors.length >= 2) {
    rail.innerHTML = `<p class="kick faint">${esc(t("lesson.sections"))}</p><ol>${anchors.map((a) => `<li><a href="#" data-to="${esc(a.id)}"><i></i><span>${esc(a.dataset.anchor || a.textContent.trim())}</span></a></li>`).join("")}</ol>`;
    rail.addEventListener("click", (e) => {
      const a = e.target.closest("a[data-to]");
      if (!a) return;
      e.preventDefault();
      document.getElementById(a.dataset.to).scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
    });
  } else rail.classList.add("empty-rail");

  // Reading position: saved the moment you scroll, restored to the same paragraph.
  const blocks = () => [...prose.children];
  const readbar = view.querySelector(".readbar i");
  let reachedEnd = read;
  const track = debounce(() => {
    const top = 90;
    const list = blocks();
    let idx = 0;
    for (let i = 0; i < list.length; i++) if (list[i].getBoundingClientRect().top <= top) idx = i;
    const heading = [...anchors].reverse().find((a) => a.getBoundingClientRect().top <= top);
    const ratio = Math.min(1, scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight));
    P.savePosition(l, { block: idx, ratio, heading: heading ? heading.dataset.anchor || heading.textContent.trim() : null });
  }, 250);
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    const r = h > 0 ? Math.min(1, scrollY / h) : 1;
    readbar.style.transform = `scaleX(${r})`;
    if (r > 0.9) reachedEnd = true;
    const rem = Math.max(0, h - scrollY);
    const top = rem < innerHeight ? 100 + (innerHeight - 160) * (1 - rem / innerHeight) : 100;
    let cur = null;
    for (const a of anchors) if (a.getBoundingClientRect().top <= top) cur = a;
    $$("a[data-to]", rail).forEach((a) => {
      const el = document.getElementById(a.dataset.to);
      a.classList.toggle("seen", el.getBoundingClientRect().top <= top);
      a.classList.toggle("now", el === cur);
    });
    track();
  };
  addEventListener("scroll", onScroll, { passive: true });
  view.querySelectorAll(".next-btn").forEach((b) => b.addEventListener("click", () => { if (reachedEnd && P.lessonState(l) !== "done") P.markRead(l, true); }));

  const key = (e) => {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.activeElement.closest(".cm-editor") || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "ArrowRight" && next) location.hash = P.lessonHref(next);
    if (e.key === "ArrowLeft" && prev) location.hash = P.lessonHref(prev);
  };
  document.addEventListener("keydown", key);

  requestAnimationFrame(() => {
    const at = route.query.at && document.getElementById(route.query.at);
    if (at) at.scrollIntoView({ block: "start" });
    else if (keep) { /* keep where we are */ }
    else if (saved && saved.block > 0 && blocks()[saved.block]) blocks()[saved.block].scrollIntoView({ block: "start" });
    else window.scrollTo(0, 0);
    onScroll();
  });

  return {
    cleanup() {
      track.flush();
      removeEventListener("scroll", onScroll);
      document.removeEventListener("keydown", key);
      if (mounted.cleanup) mounted.cleanup();
    },
  };
}
