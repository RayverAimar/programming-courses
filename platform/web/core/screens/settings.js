// Ajustes: theme, language, where progress lives (and a shared sync file in the app),
// export/import, and "Revisar mi entorno" for what only the app can do.
import { esc, icon } from "../dom.js";
import { t, ago, deviceName } from "../i18n.js";
import { seg, onSeg, button, appOnly, sheet, toast, textField, fieldMessage } from "../ui.js";
import { setSection, theme, setTheme, langHref, textSize, setTextSize, TEXT_SIZES } from "../shell.js";
import { desktop, getBridge, checkEnv } from "../caps.js";
import { site, profile, setProfile, validEmail } from "../progress.js";
import { openWelcome, goalOptions } from "../onboarding.js";
import { SCHEMA_VERSION, openBytes } from "../db.js";
import { syncInfo, getPersistence, replaceWith, mergeBytes, flush } from "../boot.js";
import { transferButtons, wireTransfer } from "./transfer.js";

async function envBlock() {
  if (!desktop()) return `<p class="muted small">${esc(t("settings.envWeb"))}</p>`;
  const env = await checkEnv(true);
  return `<ul class="envlist">${env.tools
    .map((x) => `<li>${x.found ? `<span class="ok">${icon("circle-check", "ic-s")}</span>` : `<span class="no">${icon("circle-x", "ic-s")}</span>`}<span>${esc(x.name)}</span>${x.version ? `<small>${esc(x.version)}</small>` : ""}${!x.found && x.help ? `<a class="link" href="${esc(x.help)}" data-external>${esc(t("settings.howInstall"))}</a>` : ""}</li>`)
    .join("")}</ul>`;
}

function profileCard() {
  const p = profile();
  return `<section class="card card-pad profile" id="perfil" style="--i:1"><h3>${esc(t("profile.title"))}</h3><p class="sub">${esc(t("profile.lead"))}</p>
    <div class="profile-f">${textField({ name: "name", label: t("profile.name"), value: p.name, placeholder: t("profile.namePh"), autocomplete: "given-name" })}
    ${textField({ name: "email", label: t("profile.email"), type: "email", value: p.email, placeholder: t("profile.emailPh"), autocomplete: "email", optional: true, help: t("profile.emailHelp") })}</div>
    <div class="field"><span class="lbl">${esc(t("profile.goal"))}</span>${seg("goal", goalOptions(), String(p.goal || 0), { label: t("profile.goal") })}</div>
    ${p.welcome === "done" ? "" : `<div class="btns">${button({ label: t("profile.complete"), icon: "user-round", small: true, cls: "pf-welcome" })}</div>`}
  </section>`;
}
function wireProfile(view) {
  const box = view.querySelector(".profile");
  const name = box.querySelector("[name=name]"), email = box.querySelector("[name=email]");
  const saved = () => toast(t("profile.saved"), { ms: 1600 });
  name.addEventListener("change", () => { setProfile({ name: name.value.trim() }); saved(); });
  email.addEventListener("change", () => {
    const v = email.value.trim();
    const ok = v === "" || validEmail(v);
    fieldMessage(box, "email", ok ? "" : t("welcome.emailCheck"));
    if (ok) { setProfile({ email: v }); saved(); }
  });
  onSeg(box, "goal", (v) => { setProfile({ goal: Number(v) }); saved(); });
  box.querySelector(".pf-welcome")?.addEventListener("click", () => openWelcome({ start: 1, onDone: () => render(view) }));
}

export async function render(view) {
  setSection("settings");
  const s = site();
  const loc = desktop() ? await getPersistence().location() : null;
  const sync = syncInfo();
  const version = desktop() ? await getBridge().version() : s.version;
  view.innerHTML = `<div class="wrap page settings enter">
    <header class="page-h" style="--i:0"><h1>${esc(t("settings.title"))}</h1></header>
    ${profileCard()}
    <section class="card card-pad" style="--i:1"><h3>${esc(t("settings.look"))}</h3>
      <div class="field"><span class="lbl">${esc(t("settings.theme"))}</span>
        ${seg("theme", ["auto", "light", "dark"].map((v) => ({ value: v, label: t(`theme.${v}`), icon: { auto: "sun-moon", light: "sun", dark: "moon" }[v] })), theme(), { label: t("settings.theme") })}</div>
      <div class="field"><span class="lbl">${esc(t("settings.textSize"))}</span>
        ${seg("text-size", Object.keys(TEXT_SIZES).map((v) => ({ value: v, label: t(`textSize.${v}`) })), textSize(), { label: t("settings.textSize") })}</div>
      <div class="field"><span class="lbl">${esc(t("settings.lang"))}</span>
        <div class="seg" role="group" aria-label="${esc(t("settings.lang"))}">${s.langs.map((l) => `<button type="button" data-lang="${l}" aria-pressed="${l === document.documentElement.lang}">${esc(t(`lang.${l}`))}</button>`).join("")}</div></div>
    </section>
    <section class="card card-pad" style="--i:2"><h3>${esc(t("settings.progress"))}</h3>
      <div class="field"><span class="lbl">${esc(t("settings.where"))}</span>
        ${desktop()
          ? `<span class="help">${esc(loc.shared ? t("settings.whereShared") : t("settings.whereApp"))}</span><code>${esc(loc.path)}</code>
             <div class="btns">${button({ label: t("settings.show"), icon: "folder-open", small: true, cls: "loc-show" })}${button({ label: t("settings.pickSync"), icon: "refresh-cw", small: true, cls: "loc-pick", tip: t("settings.pickSyncTip") })}${loc.shared ? button({ label: t("settings.unsync"), small: true, kind: "ghost", cls: "loc-reset" }) : ""}</div>`
          : `<span class="help">${esc(t("settings.whereWeb"))}</span>${appOnly(t("settings.syncWeb"))}`}
        ${sync ? `<p class="help">${icon("refresh-cw", "ic-s")} ${esc(t("sync.banner", { when: ago(sync.at), from: deviceName(sync.label) }))}</p>` : ""}
      </div>
      <div class="field" id="transfer"><span class="lbl">${esc(t("transfer.title"))}</span><span class="help">${esc(t("transfer.lead"))}</span>${transferButtons()}</div>
      <div class="field"><span class="lbl">${esc(t("settings.reset"))}</span><span class="help">${esc(t("settings.resetHelp"))}</span><div class="btns">${button({ label: t("settings.resetBtn"), icon: "trash-2", small: true, cls: "reset btn-danger" })}</div></div>
    </section>
    ${s.envCheck === false ? "" : `<section class="card card-pad" style="--i:3"><h3>${esc(t("settings.env"))}</h3><p class="sub">${esc(t("settings.envLead"))}</p><div class="envbox"><p class="muted small">${esc(t("settings.envChecking"))}</p></div></section>`}
    <section class="card card-pad" style="--i:4"><h3>${esc(t("settings.about"))}</h3>
      <p class="muted small">${esc(s.name)} · ${esc(t("settings.version", { v: version }))} · ${esc(t("settings.schema", { v: SCHEMA_VERSION }))}${desktop() ? ` · ${esc(t("settings.offline"))}` : ""}</p>
    </section>
  </div>`;
  wireProfile(view);
  onSeg(view, "theme", setTheme);
  onSeg(view, "text-size", setTextSize);
  view.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => { if (b.dataset.lang !== document.documentElement.lang) location.href = langHref(b.dataset.lang); }));
  wireTransfer(view);
  if (s.envCheck !== false) envBlock().then((h) => {
    const box = view.querySelector(".envbox");
    if (!box) return;
    box.innerHTML = h;
    box.querySelectorAll("[data-external]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); getBridge().openExternal(a.href); }));
  });
  if (desktop()) {
    const b = getBridge();
    view.querySelector(".loc-show").addEventListener("click", () => b.db.reveal());
    view.querySelector(".loc-pick").addEventListener("click", async () => {
      await flush();
      const r = await b.db.chooseSyncFile();
      if (!r) return;
      if (r.existing) await mergeBytes(new Uint8Array(r.existing));
      await flush();
      toast(t("settings.syncOn"), { icon: "refresh-cw" });
      render(view);
    });
    view.querySelector(".loc-reset")?.addEventListener("click", async () => {
      await b.db.useDefault();
      await flush();
      render(view);
    });
  }
  view.querySelector(".reset").addEventListener("click", () => {
    const box = sheet({
      title: t("settings.resetTitle"),
      body: `<p>${esc(t("settings.resetConfirm"))}</p><div class="btns sheet-end">${button({ label: t("settings.resetYes"), cls: "yes btn-danger", icon: "trash-2" })}${button({ label: t("ui.cancel"), kind: "ghost", cls: "no" })}</div>`,
    });
    box.el.querySelector(".no").addEventListener("click", box.close);
    box.el.querySelector(".yes").addEventListener("click", async () => {
      box.close();
      await replaceWith(openBytes(null).export());
      toast(t("settings.resetDone"));
    });
  });
}
