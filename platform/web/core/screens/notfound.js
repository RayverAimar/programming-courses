// A link that leads nowhere: say so, and offer the way back.
import { esc, icon } from "../dom.js";
import { t } from "../i18n.js";
import { button } from "../ui.js";
import { setSection } from "../shell.js";

export function render(view) {
  setSection(null);
  view.innerHTML = `<div class="wrap page enter"><section class="card locked notfound" style="--i:0">
    ${icon("map-pin-off", "ic-l")}
    <h1>${esc(t("notFound.title"))}</h1>
    <p class="muted">${esc(t("notFound.body"))}</p>
    <div class="btns">${button({ label: t("notFound.home"), href: "#/", kind: "primary", icon: "house" })}${button({ label: t("notFound.courses"), href: "#/cursos", kind: "ghost", icon: "library" })}</div>
  </section></div>`;
}
