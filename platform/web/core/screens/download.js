// Descargar la app: the latest GitHub Release, one installer per system.
import { esc, icon } from "../dom.js";
import { t } from "../i18n.js";
import { button } from "../ui.js";
import { setSection } from "../shell.js";
import { os, desktop } from "../caps.js";
import { site } from "../progress.js";

const OS = [
  { id: "darwin", icon: "laptop", key: "mac" },
  { id: "win32", icon: "monitor", key: "win" },
  { id: "linux", icon: "terminal", key: "linux" },
];

export function render(view) {
  setSection(null);
  const s = site();
  const base = `https://github.com/${s.repo}/releases/latest/download/`;
  const mine = os();
  const order = [...OS].sort((a, b) => (b.id === mine) - (a.id === mine));
  view.innerHTML = `<div class="wrap page download enter">
    <header class="page-h" style="--i:0"><p class="kick">${esc(t("app.kicker"))}</p><h1>${esc(t("app.title", { name: s.name }))}</h1><p class="lead">${esc(t("app.lead"))}</p></header>
    ${desktop() ? `<p class="banner">${icon("circle-check")}${esc(t("app.already"))}</p>` : ""}
    <ul class="app-perks" style="--i:1">${["offline", "files", "native"].map((k) => `<li>${icon({ offline: "wifi-off", files: "folder-sync", native: "cpu" }[k])}<span><b>${esc(t(`app.perk.${k}`))}</b><small>${esc(t(`app.perk.${k}.d`))}</small></span></li>`).join("")}</ul>
    <div class="os-grid" style="--i:2">${order
      .map((o) => {
        const files = s.downloads.filter((d) => d.os === o.id);
        return `<section class="card card-pad os${o.id === mine ? " mine" : ""}">
          <h3>${icon(o.icon)}${esc(t(`app.os.${o.key}`))}${o.id === mine ? `<span class="chip chip-done">${esc(t("app.yours"))}</span>` : ""}</h3>
          <div class="btns">${files.map((f, i) => button({ label: t(`app.file.${f.kind}`), href: base + f.file, kind: i === 0 && o.id === mine ? "primary" : "secondary", icon: "download", small: true, attrs: { download: "" } })).join("")}</div>
          <p class="muted small">${esc(t(`app.how.${o.key}`, { name: s.name }))}</p>
        </section>`;
      })
      .join("")}</div>
    <p class="muted small" style="--i:3">${esc(t("app.releases"))} <a class="link" href="https://github.com/${esc(s.repo)}/releases" target="_blank" rel="noopener">github.com/${esc(s.repo)}/releases</a></p>
  </div>`;
}
