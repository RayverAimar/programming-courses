// Taller: the task on one side, your tool on the other, everything visible without scrolling.
// The tool comes from the adapter: an editor with console and robot, a lab, or a case board.
import { md, mdPlain } from "../inline.js";
import { esc, icon } from "../dom.js";
import { t, tc } from "../i18n.js";
import * as P from "../progress.js";
import { button, sheet, stateIcon } from "../ui.js";
import { setSection, cycleTheme } from "../shell.js";
import { searchButton } from "../search.js";
import { adapter } from "../adapter.js";
import { moduleLabel, loadPayload } from "./parts.js";
import { moduleToc } from "./lesson.js";

const listeners = new Set();
P.onProgress((e) => listeners.forEach((fn) => fn(e)));

function lastReading(l) {
  for (let i = l.index - 1; i >= 0; i--) if (l.module.lessons[i].kind !== "workshop") return l.module.lessons[i];
  return null;
}

export async function render(view, route, l, { keep } = {}) {
  setSection("courses", { focus: true });
  const c = l.course;
  const items = P.workshopItems(l);
  const n = Math.max(1, Math.min(items.length, route.step || P.resumeStep(l)));
  if (route.step !== n) return void history.replaceState(null, "", P.lessonHref(l, n)), render(view, { ...route, step: n }, l, { keep });
  const it = items[n - 1];
  const payload = await loadPayload(l.module);
  P.openLesson(l, { item: n, heading: `${mdPlain(l.title)} ${n}/${items.length}` });
  const reading = lastReading(l);
  const next = P.nextInCourse(l);
  const counter = items.length > 1 ? tc("workshop.of", c.id, { kind: mdPlain(l.title), i: n, n: items.length }) : mdPlain(l.title);

  view.innerHTML = `<div class="ws">
    <header class="wbar"><div class="wbar-in">
      <a class="back" href="${esc(P.courseHref(c))}" data-tip="${esc(t("lesson.backTo", { title: mdPlain(c.title) }))}">${icon("arrow-left")}<span>${md(c.title)} · ${esc(moduleLabel(l.module))}: ${md(l.module.title)}</span></a>
      <button type="button" class="toc-btn ws-title" aria-haspopup="dialog"><span>${esc(counter)}</span>${icon("chevron-down", "ic-s")}</button>
      <span class="lbar-sp"></span>
      ${button({ label: t("workshop.prev"), kind: "icon", icon: "chevron-left", href: n > 1 ? P.lessonHref(l, n - 1) : undefined, disabled: n <= 1, cls: "ws-nav" })}
      ${button({ label: t("workshop.next"), kind: "icon", icon: "chevron-right", href: n < items.length ? P.lessonHref(l, n + 1) : next ? P.lessonHref(next) : undefined, disabled: n >= items.length && !next, cls: "ws-nav" })}
      ${searchButton()}
      ${button({ label: t("theme.toggle"), kind: "icon", icon: "sun-moon", cls: "lbar-theme" })}
    </div></header>
    <div class="ws-grid">
      <section class="ws-task" aria-label="${esc(t("workshop.task"))}">
        <div class="ws-task-in prose"></div>
        <p class="ws-help"></p>
      </section>
      <section class="ws-tool prose" aria-label="${esc(t("workshop.tool"))}"><div class="ws-tool-in"></div><div class="ws-after" hidden></div></section>
    </div>
  </div>`;
  view.querySelector(".lbar-theme").addEventListener("click", cycleTheme);
  // The step picker: this Taller's steps with their state, then the rest of the module.
  view.querySelector(".ws-title").addEventListener("click", () => sheet({
    title: `${moduleLabel(l.module)} · ${l.module.title}`,
    body: `${items.length > 1 ? `<p class="kick faint toc-h">${esc(t("workshop.steps"))}</p><ol class="toc-list ws-steps">${items
      .map((x, i) => `<li><a href="${esc(P.lessonHref(l, i + 1))}"${i === n - 1 ? ' aria-current="page"' : ""}>${stateIcon(P.passed(x.id) ? "done" : P.missed(x.id) ? "missed" : "none")}<span>${esc(`${i + 1}. ${(x.plainTitle || mdPlain(x.title || "")).replace(/^\d+[.)]\s+/, "")}`)}</span></a></li>`)
      .join("")}</ol><p class="kick faint toc-h">${esc(moduleLabel(l.module))}</p>` : ""}${moduleToc(l, { inSheet: true })}`,
  }));

  const after = view.querySelector(".ws-after");
  const showAfter = () => {
    const ok = P.passed(it.id);
    after.classList.toggle("missed", !ok);
    const nx = n < items.length ? { href: P.lessonHref(l, n + 1), label: tc("workshop.nextItem", c.id, { kind: mdPlain(l.title), i: n + 1 }) } : next ? { href: P.lessonHref(next), label: t("lesson.next", { title: mdPlain(next.title) }) } : null;
    after.hidden = false;
    after.innerHTML = `<p>${icon(ok ? "circle-check" : "history")}<b>${esc(t(ok ? "workshop.solved" : "workshop.missed"))}</b></p>${nx ? button({ label: nx.label, href: nx.href, kind: "primary", iconEnd: "arrow-right" }) : ""}`;
  };
  const onEvent = (e) => {
    if (e.type !== "passed" && e.type !== "attempt") return;
    if (e.id === it.id && P.settled(e.id)) showAfter();
  };
  listeners.add(onEvent);
  if (P.settled(it.id)) showAfter();

  const mounted = adapter().mountWorkshop(
    { task: view.querySelector(".ws-task-in"), tool: view.querySelector(".ws-tool-in") },
    { lesson: l, item: it, index: n - 1, items, payload, data: payload.lessons[l.slug] }
  ) || {};
  // The lesson to go back to: the one this step came from, if the adapter says, else the reading before.
  const source = mounted.source || lastReading(l);
  if (source) view.querySelector(".ws-help").innerHTML = `<a class="link" href="${esc(P.lessonHref(source))}">${icon("book-open", "ic-s")}${esc(t("workshop.backToLesson", { title: mdPlain(source.title) }))}</a>`;
  // A small tool (a text box) gives the task the wider pane.
  if (mounted.compact) view.querySelector(".ws-grid").classList.add("tool-s");
  if (!keep) window.scrollTo(0, 0);
  return {
    cleanup() {
      listeners.delete(onEvent);
      if (mounted.cleanup) mounted.cleanup();
    },
  };
}
