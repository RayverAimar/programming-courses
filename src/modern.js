// "Moderno y antiguo": what we write today beside what older code looks like, with links to the docs.
import { esc, icon } from "../platform/web/core/dom.js";
import { t, tc } from "../platform/web/core/i18n.js";
import * as P from "../platform/web/core/progress.js";
import { setSection } from "../platform/web/core/shell.js";
import { ROOT } from "../platform/web/core/paths.js";

export async function render(view, route) {
  const c = P.course(route.match[1]);
  setSection("courses");
  const features = await fetch(`${ROOT}data/${document.documentElement.lang}/${c.id}/_modern.json`).then((r) => r.json());
  const from = (f) => (f.session ? ` <span class="feature-s">${esc(t("modern.from", { n: f.session }))}</span>` : "");
  view.innerHTML = `<div class="wrap page modern enter">
    <a class="back" href="${esc(P.courseHref(c))}">${icon("arrow-left")}<span>${esc(c.title)}</span></a>
    <header class="page-h" style="--i:0"><h1>${esc(t("modern.title"))}</h1><p class="lead">${esc(tc("modern.lead", c.id))}</p></header>
    <article class="prose" style="--i:1">
      ${features.filter((f) => f.oldHtml).map((f) => `<section class="feature">
        <h2>${esc(f.name)}${from(f)}</h2>
        <div class="legacy-cmp"><div><span class="legacy-tag old">${esc(t("legacy.old"))}</span>${f.oldHtml}</div><div><span class="legacy-tag new">${esc(t("legacy.new"))}</span>${f.newHtml}</div></div>${f.note}
        <p class="legacy-mdn"><a href="${esc(f.mdn)}" target="_blank" rel="noopener">${esc(tc("modern.mdn", c.id))} · ${esc(f.name)}</a></p>
      </section>`).join("")}
      <section class="modern-more"><h2>${esc(tc("modern.more", c.id))}</h2><ul>${features.filter((f) => !f.oldHtml).map((f) => `<li><a href="${esc(f.mdn)}" target="_blank" rel="noopener">${esc(f.name)}</a>${from(f)}</li>`).join("")}</ul></section>
    </article>
  </div>`;
}
