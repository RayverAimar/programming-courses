// The first-run welcome: language and theme, a name and an email, a daily goal. Short, skippable,
// and kept on this device (the profile table of the progress database). No accounts, no server.
import { esc, icon } from "./dom.js";
import { t } from "./i18n.js";
import * as P from "./progress.js";
import { button, seg, onSeg, sheet, textField, fieldMessage, toast } from "./ui.js";
import { theme, setTheme, langHref } from "./shell.js";

export const GOALS = [10, 15, 30, 60];
const STEPS = ["look", "you", "goal"];
const draftKey = () => `${P.site().prefix}.welcome`;
const readDraft = () => { try { return JSON.parse(sessionStorage.getItem(draftKey())); } catch (_) { return null; } };
const writeDraft = (d) => { try { d ? sessionStorage.setItem(draftKey(), JSON.stringify(d)) : sessionStorage.removeItem(draftKey()); } catch (_) {} };

export const goalOptions = () => [...GOALS.map((m) => ({ value: String(m), label: t("time.min", { n: m }) })), { value: "0", label: t("welcome.noGoal") }];

// At start: a new learner gets the welcome; one who already has progress gets a light prompt on Inicio instead.
export function maybeWelcome(route, onDone) {
  const draft = readDraft();
  if (draft) return void openWelcome({ start: draft.step, draft, onDone });
  if (P.profile().welcome || route.name === "_componentes" || P.hasAnyProgress()) return;
  openWelcome({ onDone });
}

export function openWelcome({ start = 0, draft = null, demo = false, onDone } = {}) {
  const p = P.profile();
  const st = { step: Math.max(0, Math.min(STEPS.length - 1, start)), name: draft?.name ?? p.name, email: draft?.email ?? p.email, goal: draft?.goal ?? (p.goal || 15) };
  let settled = false;
  const s = P.site();
  const body = document.createElement("div");
  body.className = "welcome-b";
  const box = sheet({
    title: t("welcome.title", { site: s.name }),
    body,
    onClose: () => {
      if (settled || demo) return;
      writeDraft(null);
      keep({ welcome: P.profile().welcome === "done" ? "done" : "skipped" });
      if (onDone) onDone("skipped");
    },
  });
  box.el.classList.add("sheet-welcome");

  const keep = (extra = {}) => {
    if (demo) return;
    const email = st.email.trim();
    P.setProfile({ name: st.name.trim(), ...(email === "" || P.validEmail(email) ? { email } : {}), goal: st.goal, ...extra });
  };
  const finish = (how) => {
    settled = true;
    writeDraft(null);
    keep({ welcome: how });
    box.close();
    if (onDone) onDone(how);
    if (how === "done" && !demo) toast(st.name.trim() ? t("welcome.doneName", { name: st.name.trim() }) : t("welcome.done"), { icon: "sparkles" });
  };
  const collect = () => {
    const n = body.querySelector("[name=name]"), e = body.querySelector("[name=email]");
    if (n) st.name = n.value;
    if (e) st.email = e.value;
  };
  const emailOk = () => {
    const v = st.email.trim();
    const ok = v === "" || P.validEmail(v);
    fieldMessage(body, "email", ok ? "" : t("welcome.emailCheck"));
    return ok;
  };

  const paint = () => {
    const k = STEPS[st.step];
    const last = st.step === STEPS.length - 1;
    const langs = s.langs || [];
    const main = k === "look"
      ? `<h3 class="welcome-h">${esc(t("welcome.lookTitle"))}</h3><p class="muted">${esc(t("welcome.lookLead", { site: s.name }))}</p>
        ${langs.length > 1 ? `<div class="field"><span class="lbl">${esc(t("settings.lang"))}</span>${seg("w-lang", langs.map((l) => ({ value: l, label: t(`lang.${l}`) })), document.documentElement.lang, { label: t("settings.lang") })}</div>` : ""}
        <div class="field"><span class="lbl">${esc(t("settings.theme"))}</span>${seg("w-theme", ["auto", "light", "dark"].map((v) => ({ value: v, label: t(`theme.${v}`), icon: { auto: "sun-moon", light: "sun", dark: "moon" }[v] })), theme(), { label: t("settings.theme") })}</div>`
      : k === "you"
        ? `<h3 class="welcome-h">${esc(t("welcome.youTitle"))}</h3><p class="muted">${esc(t("welcome.youLead"))}</p>
          ${textField({ name: "name", label: t("profile.name"), value: st.name, placeholder: t("profile.namePh"), autocomplete: "given-name" })}
          ${textField({ name: "email", label: t("profile.email"), type: "email", value: st.email, placeholder: t("profile.emailPh"), autocomplete: "email", optional: true, help: t("profile.emailHelp") })}`
        : `<h3 class="welcome-h">${esc(t("welcome.goalTitle"))}</h3><p class="muted">${esc(t("welcome.goalLead"))}</p>
          <div class="field">${seg("w-goal", goalOptions(), String(st.goal), { label: t("profile.goal") })}</div>`;
    body.innerHTML = `<div class="welcome-steps" aria-label="${esc(t("welcome.step", { i: st.step + 1, n: STEPS.length }))}" role="img">${STEPS.map((_, i) => `<i class="${i < st.step ? "done" : i === st.step ? "on" : ""}"></i>`).join("")}<span>${esc(t("welcome.step", { i: st.step + 1, n: STEPS.length }))}</span></div>
      <form class="welcome-f" novalidate>${main}
        <p class="welcome-privacy">${icon("lock", "ic-s")}<span>${esc(t("welcome.privacy"))}</span></p>
        <div class="btns welcome-acts">
          ${button({ label: t("welcome.skip"), kind: "ghost", cls: "w-skip" })}
          <span class="lbar-sp"></span>
          ${st.step ? button({ label: t("welcome.back"), cls: "w-back", icon: "arrow-left" }) : ""}
          <button type="submit" class="btn btn-primary w-next"><span>${esc(last ? t("welcome.start") : t("welcome.next"))}</span>${icon(last ? "check" : "arrow-right")}</button>
        </div></form>`;
    onSeg(body, "w-theme", (v) => setTheme(v));
    onSeg(body, "w-goal", (v) => (st.goal = Number(v)));
    onSeg(body, "w-lang", (l) => {
      if (l === document.documentElement.lang || demo) return;
      writeDraft({ step: st.step, name: st.name, email: st.email, goal: st.goal });
      settled = true;
      location.href = langHref(l);
    });
    body.querySelector(".w-skip").addEventListener("click", () => { collect(); finish("skipped"); });
    body.querySelector(".w-back")?.addEventListener("click", () => { collect(); st.step--; paint(); focusFirst(); });
    const em = body.querySelector("[name=email]");
    if (em) {
      em.addEventListener("blur", () => { collect(); emailOk(); });
      em.addEventListener("input", () => { if (em.closest(".warn")) { collect(); if (P.validEmail(st.email) || !st.email.trim()) fieldMessage(body, "email", ""); } });
    }
    body.querySelector(".welcome-f").addEventListener("submit", (e) => {
      e.preventDefault();
      collect();
      if (k === "you" && !emailOk()) return void em.focus();
      if (last) return finish("done");
      st.step++;
      paint();
      focusFirst();
    });
  };
  const focusFirst = () => requestAnimationFrame(() => (body.querySelector("input") || body.querySelector(".w-next")).focus({ preventScroll: true }));
  paint();
  requestAnimationFrame(focusFirst);
  return box;
}

// For a learner who already had progress when the welcome arrived: a card on Inicio, offered once.
let promptShown = false;
export function profilePrompt() {
  const p = P.profile();
  if (!promptShown && (p.welcome || !P.hasAnyProgress())) return "";
  if (promptShown && p.welcome !== "prompted") return "";
  if (!promptShown) { promptShown = true; P.setProfile({ welcome: "prompted" }); }
  return promptCard();
}
export function promptCard() {
  return `<section class="card card-pad pprompt">${icon("user-round", "ic-l")}<div><b>${esc(t("welcome.promptTitle"))}</b><p class="muted small">${esc(t("welcome.promptBody"))}</p></div>
    <div class="btns">${button({ label: t("welcome.promptGo"), small: true, kind: "primary", cls: "pp-go" })}${button({ label: t("welcome.promptLater"), small: true, kind: "ghost", cls: "pp-no" })}</div></section>`;
}
export function wirePrompt(root, rerender) {
  root.querySelector(".pp-go")?.addEventListener("click", () => openWelcome({ start: 1, onDone: rerender }));
  root.querySelector(".pp-no")?.addEventListener("click", () => { P.setProfile({ welcome: "skipped" }); root.querySelector(".pprompt")?.remove(); });
}
