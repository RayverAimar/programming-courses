// Starts a course site: strings, the progress database, the shell and the router.
// A repo calls createPlatform(adapter) once; the adapter supplies what's specific to its courses.
import { setStrings, t, ago, deviceName } from "./i18n.js";
import { loadEngine, openBytes, Store, merge, isSqlite } from "./db.js";
import { webPersistence, desktopPersistence } from "./persist.js";
import { initModel, onProgress, site } from "./progress.js";
import * as P from "./progress.js";
import { buildShell, setSection, theme, setTheme, onTheme } from "./shell.js";
import { initTooltips, toast, closeSheet, hideTip, confetti } from "./ui.js";
import { maybeWelcome } from "./onboarding.js";
import { flushEditors } from "./rich.js";
import "./photos.js";
import { parse } from "./router.js";
import { desktop, getBridge } from "./caps.js";
import { startStudyClock } from "./study.js";
import { byId, debounce, esc } from "./dom.js";
import { mdPlain } from "./inline.js";
import { setAdapter } from "./adapter.js";
import { SCREENS } from "./screens/index.js";

import { ROOT } from "./paths.js";
export { ROOT };
let persistence = null;
let store = null;
let current = null;
let lastSync = null;

export const syncInfo = () => lastSync;
export const getPersistence = () => persistence;
export const getStore = () => store;

const save = debounce(async () => {
  try {
    store.db.run("INSERT INTO meta (key, value) VALUES ('last_write', ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value", [JSON.stringify({ device: store.meta("device"), label: store.meta("device_label"), at: Date.now() })]);
    await persistence.save(store.export());
  } catch (e) {
    console.error("Saving progress failed", e);
  }
}, 400);
export const flush = () => save.flush();

function deviceKey() {
  if (desktop()) return `app.${getBridge().platform}`;
  return /Mobi|Android|iPhone/.test(navigator.userAgent) ? "phone" : "web";
}

// Bring in progress from another copy (import or the shared file). Returns what came in.
export async function mergeBytes(bytes, { silent = false } = {}) {
  if (!isSqlite(bytes)) throw new Error(t("sync.notProgress"));
  const r = merge(store, bytes);
  P.checkAllCompletions();
  const from = r.lastWrite && r.lastWrite.device !== store.meta("device") ? r.lastWrite : null;
  if (from) {
    lastSync = { label: from.label, at: from.at, mergedAt: Date.now() };
    store.meta("last_sync", JSON.stringify(lastSync));
  }
  rerender();
  if (!silent && from) toast(t("sync.toast", { from: deviceName(from.label), when: ago(from.at) }), { icon: "refresh-cw" });
  return r;
}
export async function replaceWith(bytes) {
  const keep = ["device", "device_label", "legacy_imported"].map((k) => [k, store.meta(k)]);
  const profile = store.all("SELECT * FROM profile");
  store.replace(openBytes(bytes));
  for (const [k, v] of keep) if (v) store.meta(k, v);
  if (!store.value("SELECT count(*) FROM profile")) for (const r of profile) store.run("INSERT INTO profile VALUES (?, ?, ?)", [r.key, r.value, r.updated_at]);
  initModel(siteRef, store, store.meta("device"));
  rerender();
}

export function rerender() {
  closeSheet();
  render(true);
}

let adapterRef = null;
let siteRef = null;
async function render(keep = false) {
  flushEditors();
  hideTip();
  const route = parse();
  const view = byId("view");
  if (adapterRef.redirect) {
    const to = adapterRef.redirect(location.hash);
    if (to) return void history.replaceState(null, "", to), render();
  }
  if (current && current.cleanup) current.cleanup();
  const screen = SCREENS[route.name] || adapterRef.screens?.[route.name] || SCREENS.home;
  const scrollY = keep ? window.scrollY : 0;
  current = { route };
  try {
    const r = await screen.render(view, route, { keep });
    if (current.route === route) current.cleanup = r && r.cleanup;
  } catch (e) {
    console.error(e);
    view.innerHTML = `<div class="wrap"><div class="empty"><b>${esc(t("error.title"))}</b><span>${esc(String(e.message || e))}</span></div></div>`;
    setSection(null);
  }
  if (keep) return void window.scrollTo(0, scrollY);
  if (route.name === "lesson") return;
  const at = route.query.at && document.getElementById(route.query.at);
  if (at) at.scrollIntoView({ block: "start" });
  else window.scrollTo(0, 0);
}

export async function createPlatform(adapter) {
  setAdapter(adapter);
  adapterRef = adapter;
  const lang = document.documentElement.lang || "es";
  const siteData = await fetch(`${ROOT}data/${lang}/site.json`).then((r) => r.json());
  setStrings(lang, siteData.ui);

  await loadEngine(`${ROOT}vendor/sql-wasm.wasm`);
  persistence = desktop() ? desktopPersistence(getBridge()) : webPersistence(siteData.site.prefix);
  let bytes = null;
  try { bytes = await persistence.load(); } catch (e) { console.error(e); }
  store = new Store(openBytes(bytes), () => save());
  if (!store.meta("device")) store.meta("device", crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));
  store.meta("device_label", deviceKey());
  const ls = store.meta("last_sync");
  lastSync = ls ? JSON.parse(ls) : null;

  siteRef = siteData;
  initModel(siteData, store, store.meta("device"));
  if (!store.meta("legacy_imported")) {
    try { if (adapter.importLegacy) adapter.importLegacy(P, store); } catch (e) { console.error("Legacy progress import failed", e); }
    store.meta("legacy_imported", String(Date.now()));
  }
  P.checkAllCompletions();
  P.pruneAttachments();
  persistence.onExternalChange((b) => mergeBytes(b).catch((e) => console.error(e)));

  setTheme(theme());
  buildShell();
  initTooltips();
  startStudyClock(() => current && current.route && current.route.name === "lesson");
  if (adapter.onTheme) onTheme(adapter.onTheme);
  onProgress((e) => { if (e.type === "course-done") confetti(), toast(t("course.doneToast", { title: mdPlain(P.course(e.id).title) }), { icon: "party-popper", action: t("course.doneSee"), onAction: () => (location.hash = `#/c/${e.id}/fin`) }); });
  addEventListener("hashchange", () => render());
  addEventListener("pagehide", () => { flushEditors(); flush(); });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") { flushEditors(); flush(); } });
  if (desktop()) {
    getBridge().onBeforeQuit(() => { flushEditors(); return flush(); });
    getBridge().setLang(lang);
  }
  await render();
  document.documentElement.classList.add("ready");
  maybeWelcome(parse(), () => rerender());
  return { site: site(), store };
}
