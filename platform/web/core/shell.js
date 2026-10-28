// The frame: top menu on the web (bottom tabs on a phone), an icon rail in the desktop app.
import { esc, icon, byId, $$ } from "./dom.js";
import { t, lang, has } from "./i18n.js";
import { button, hideTip } from "./ui.js";
import { desktop, os } from "./caps.js";
import { site } from "./progress.js";
import { searchButton, bindSearchKeys } from "./search.js";

const NAV = [
  { id: "home", href: "#/", icon: "house", key: "nav.home" },
  { id: "courses", href: "#/cursos", icon: "library", key: "nav.courses" },
  { id: "progress", href: "#/progreso", icon: "chart-column", key: "nav.progress" },
];

const THEMES = ["auto", "light", "dark"];
const themeKey = () => `${site().prefix}.theme`;
export function theme() {
  try {
    const v = JSON.parse(localStorage.getItem(themeKey()));
    return THEMES.includes(v) ? v : "auto";
  } catch (_) {
    return "auto";
  }
}
const themeListeners = new Set();
export const onTheme = (fn) => themeListeners.add(fn);
export function setTheme(next) {
  try { localStorage.setItem(themeKey(), JSON.stringify(next)); } catch (_) {}
  const root = document.documentElement;
  root.classList.add("no-trans");
  if (next === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", next);
  $$(".theme-btn").forEach((b) => {
    b.innerHTML = icon(THEME_ICON[next]);
    b.setAttribute("aria-label", t("theme.cycle", { now: t(`theme.${next}`) }));
    b.setAttribute("data-tip", t("theme.cycle", { now: t(`theme.${next}`) }));
  });
  if (window.desktop) window.desktop.setTheme(next);
  void root.offsetHeight;
  requestAnimationFrame(() => {
    root.classList.remove("no-trans");
    themeListeners.forEach((fn) => fn(next));
  });
}
const THEME_ICON = { auto: "sun-moon", light: "sun", dark: "moon" };
export const cycleTheme = () => setTheme(THEMES[(THEMES.indexOf(theme()) + 1) % THEMES.length]);

// Reading size, a step on the text of lessons. The page script in build/site.mjs applies it before the first paint.
export const TEXT_SIZES = { s: 0.92, m: 1, l: 1.08, xl: 1.16 };
const sizeKey = () => `${site().prefix}.textSize`;
export function textSize() {
  try {
    const v = JSON.parse(localStorage.getItem(sizeKey()));
    return TEXT_SIZES[v] ? v : "m";
  } catch (_) {
    return "m";
  }
}
export function setTextSize(next) {
  try { localStorage.setItem(sizeKey(), JSON.stringify(next)); } catch (_) {}
  document.documentElement.style.setProperty("--fs-k", String(TEXT_SIZES[next] || 1));
}

// Spanish lives at the root, English under en/. The switch keeps the route.
export function langHref(target) {
  if (target === lang()) return location.hash || "#/";
  const base = lang() === site().defaultLang ? "" : "../";
  const dir = target === site().defaultLang ? "" : `${target}/`;
  const file = desktop() ? "index.html" : "";
  return `${base}${dir}${file}${location.hash}`;
}

export function buildShell() {
  const s = site();
  const name = has("brand.name") ? t("brand.name") : s.name;
  const brand = `<a class="brand" href="#/" aria-label="${esc(name)} · ${esc(t("nav.home"))}"><span class="brand-mark">${icon(s.mark || "book-open")}</span><span>${esc(name)}</span></a>`;
  const langs = `<div class="lang-sw" role="group" aria-label="${esc(t("lang.group"))}">${s.langs.map((l) => `<a href="#" data-lang="${l}" lang="${l}" hreflang="${l}" data-tip="${esc(t(`lang.${l}`))}">${l.toUpperCase()}</a>`).join("")}</div>`;
  document.body.insertAdjacentHTML("afterbegin", `<a class="skip" href="#view">${esc(t("ui.skip"))}</a>`);
  byId("shell").innerHTML = `
    <nav class="rail" aria-label="${esc(t("nav.aria"))}">
      ${NAV.map((n) => `<a href="${n.href}" data-nav="${n.id}" data-tip="${esc(t(n.key))}">${icon(n.icon)}<span>${esc(t(n.key + ".short"))}</span></a>`).join("")}
      <span class="sp"></span>
      <a href="#/ajustes" data-nav="settings" data-tip="${esc(t("nav.settings"))}">${icon("settings")}<span>${esc(t("nav.settings"))}</span></a>
    </nav>
    <header class="topbar" id="topbar"><div class="wrap">
      ${brand}
      <nav class="mainnav" aria-label="${esc(t("nav.aria"))}">${NAV.map((n) => `<a href="${n.href}" data-nav="${n.id}">${icon(n.icon)}${esc(t(n.key))}</a>`).join("")}</nav>
      <div class="bar-actions">
        ${searchButton()}
        ${langs}
        ${button({ label: t("theme.cycle", { now: t(`theme.${theme()}`) }), kind: "icon", icon: THEME_ICON[theme()], cls: "theme-btn" })}
        ${button({ label: t("nav.settings"), kind: "icon", icon: "settings", href: "#/ajustes", cls: "settings-btn", attrs: { "data-nav": "settings" } })}
      </div>
    </div></header>
    <main id="view" tabindex="-1"></main>
    <nav class="tabs" aria-label="${esc(t("nav.aria"))}">${NAV.map((n) => `<a href="${n.href}" data-nav="${n.id}">${icon(n.icon)}<span>${esc(t(n.key + ".short"))}</span></a>`).join("")}</nav>`;
  if (desktop()) document.body.classList.add("app", os() === "darwin" ? "mac" : os());
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".theme-btn");
    if (b) cycleTheme();
    const a = e.target.closest(".lang-sw a[data-lang]");
    if (a) {
      e.preventDefault();
      if (a.dataset.lang !== lang()) location.href = langHref(a.dataset.lang);
    }
  });
  bindSearchKeys();
  const sync = () => $$(".lang-sw a").forEach((a) => a.setAttribute("aria-current", String(a.dataset.lang === lang())));
  sync();
  addEventListener("scroll", () => byId("topbar").classList.toggle("scrolled", scrollY > 4), { passive: true });
}

// Which section is lit, and whether the screen runs in focus mode (Lección, Taller).
export function setSection(id, { focus = false, tabs = true } = {}) {
  hideTip();
  $$("[data-nav]").forEach((a) => (a.dataset.nav === id ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
  document.body.classList.toggle("focus", focus);
  document.body.classList.toggle("has-tabs", !focus && tabs && !desktop());
}
