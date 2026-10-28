// Mis cursos: every course in the repo, with its progress and what comes next.
import { esc, icon } from "../dom.js";
import { t } from "../i18n.js";
import * as P from "../progress.js";
import { setSection } from "../shell.js";
import { desktop } from "../caps.js";
import { button } from "../ui.js";
import { courseCardFor } from "./parts.js";

export function render(view) {
  setSection("courses");
  const ready = P.courses().filter((c) => c.ready);
  const soon = P.courses().filter((c) => !c.ready);
  view.innerHTML = `<div class="wrap page enter">
    <header class="page-h" style="--i:0"><h1>${esc(t("courses.title"))}</h1><p>${esc(t("courses.lead"))}</p></header>
    <div class="courses" style="--i:1">${ready.map(courseCardFor).join("")}</div>
    ${soon.length ? `<div class="sec-h" style="--i:2"><h2>${esc(t("courses.soon"))}</h2></div><div class="courses" style="--i:2">${soon.map(courseCardFor).join("")}</div>` : ""}
    ${desktop() ? "" : `<section class="card card-pad promo" style="--i:3">${icon("monitor-down", "ic-l")}<div><h3>${esc(t("app.promoTitle"))}</h3><p class="muted">${esc(t("app.promoLead"))}</p></div>${button({ label: t("app.download"), href: "#/app", icon: "download" })}</section>`}
  </div>`;
}
