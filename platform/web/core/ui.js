// The component library. Every screen builds from these; docs/components.md lists them and
// #/_componentes shows each one in each state.
import { richEditor } from "./rich.js";
import { esc, icon, canHover, reduceMotion, $ } from "./dom.js";
import { t } from "./i18n.js";
import { md, mdPlain } from "./inline.js";

const attrs = (a = {}) => Object.entries(a).filter(([, v]) => v !== undefined && v !== null && v !== false).map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${esc(v)}"`)).join("");

// ── Buttons ──
// kind: primary | secondary | ghost | icon. An icon-only button always carries a label and a tooltip.
export function button({ label, icon: ic, iconEnd, kind = "secondary", href, small, block, tip, disabled, pressed, cls = "", attrs: a = {} }) {
  const k = `btn${kind === "secondary" ? "" : ` btn-${kind}`}${small ? " btn-s" : ""}${block ? " btn-block" : ""}${cls ? " " + cls : ""}`;
  const iconOnly = kind === "icon";
  const inner = `${ic ? icon(ic) : ""}${iconOnly ? "" : `<span>${esc(label)}</span>`}${iconEnd ? icon(iconEnd) : ""}`;
  const extra = { ...a, "aria-label": iconOnly ? label : a["aria-label"], "data-tip": tip ?? (iconOnly ? label : undefined), "aria-pressed": pressed === undefined ? undefined : String(pressed) };
  if (href && !disabled) return `<a class="${k}" href="${esc(href)}"${attrs(extra)}>${inner}</a>`;
  return `<button type="button" class="${k}"${attrs({ ...extra, disabled: !!disabled })}>${inner}</button>`;
}

// ── Chips: one fixed colour per activity type ──
export const CHIP_ICON = { reading: "book-open", card: "layers", figure: "chart-spline", lab: "flask-conical", case: "search", check: "circle-check", code: "code", judge: "scale", mission: "flag", challenge: "mountain", app: "monitor-down", done: "check" };
export function chip(type, label, tip) {
  return `<span class="chip chip-${esc(type)}"${tip ? ` data-tip="${esc(tip)}" tabindex="0"` : ""}>${CHIP_ICON[type] ? icon(CHIP_ICON[type]) : ""}${esc(label)}</span>`;
}

// ── Progress ──
export function bar(ratio, label, { ok = ratio >= 1, thin = false, tip } = {}) {
  const p = Math.max(0, Math.min(1, ratio || 0));
  return `<div class="bar${ok ? " ok" : ""}${thin ? " thin" : ""}"${tip ? ` data-tip="${esc(tip)}" tabindex="0"` : ""}><span class="bar-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(p * 100)}"${label ? ` aria-label="${esc(label)}"` : ""}><span class="bar-fill" style="--p:${(p * 100).toFixed(1)}%"></span></span>${label ? `<span class="bar-n">${esc(label)}</span>` : ""}</div>`;
}
export function ring(ratio, { small = false, label } = {}) {
  const p = Math.round(Math.max(0, Math.min(1, ratio || 0)) * 100);
  return `<div class="ring${small ? " s" : ""}${p >= 100 ? " ok" : ""}" style="--p:${p}" role="img" aria-label="${esc(label || `${p}%`)}"><span>${p}%</span></div>`;
}

// ── Lesson state: done, half, none, locked. The same everywhere. ──
export function stateIcon(state, tip) {
  const label = tip || t(`state.${state}`);
  const inner = state === "done" ? icon("check") : state === "lock" ? icon("lock") : "";
  return `<span class="st st-${state}" role="img" aria-label="${esc(label)}" data-tip="${esc(label)}">${inner}</span>`;
}

// ── Course card: the same on Inicio and Mis cursos ──
// Without pct and ratio (a course not started yet) the card shows no number and no bar.
export function courseCard({ title, pct, ratio, next, nextLabel, metaL, metaR, done, soon, href }) {
  const body = `<div class="top"><h4>${md(title)}</h4>${done ? chip("done", t("course.completed")) : soon || pct == null ? "" : `<span class="pct">${esc(pct)}</span>`}</div>
    ${soon || ratio == null ? "" : bar(ratio, "", { ok: done })}
    ${next ? `<p class="next">${esc(nextLabel || t("course.next"))} <b>${md(next)}</b></p>` : ""}
    <p class="meta"><span>${esc(metaL || "")}</span><span>${esc(metaR || "")}</span></p>`;
  return href && !soon ? `<a class="course-card${done ? " done" : ""}" href="${esc(href)}">${body}</a>` : `<div class="course-card soon">${body}</div>`;
}

// ── Lesson row: state, title, what it brings, how long ──
export function lessonRow({ href, state, number, title, sub, chips = "", minutes, current, locked, optional }) {
  const opt = optional ? ` data-optional="${esc(t("lesson.optional"))}"` : "";
  const inner = `${stateIcon(locked ? "lock" : state)}<span class="t"${opt}>${number ? `${esc(number)} · ` : ""}${md(title)}${sub ? `<small>${md(sub)}</small>` : ""}</span>
    <span class="r"><span class="chips">${chips}</span>${minutes ? `<span class="min">${esc(t("time.min", { n: minutes }))}</span>` : ""}</span>`;
  const cls = `lrow${current ? " cur" : ""}${locked ? " locked" : ""}${optional ? " optional" : ""}`;
  return href && !locked ? `<a class="${cls}" href="${esc(href)}"${current ? ' aria-current="step"' : ""}>${inner}</a>` : `<div class="${cls}" aria-disabled="${locked ? "true" : "false"}">${inner}</div>`;
}

// ── Reading pieces ──
export const keyIdea = (text) => `<p class="keyidea">${text}</p>`;
export const goals = (list) => `<section class="goals"><span class="kick">${esc(t("lesson.goals"))}</span><ul>${list.map((g) => `<li>${g}</li>`).join("")}</ul></section>`;
export const recap = (list) => `<section class="recap"><span class="kick">${esc(t("lesson.recap"))}</span><ol>${list.map((g) => `<li>${g}</li>`).join("")}</ol></section>`;
export const figure = ({ title, hint, body }) => `<figure class="figure"><figcaption class="figure-t">${md(title)}${hint ? `<span>${esc(hint)}</span>` : ""}</figcaption>${body}</figure>`;

// A quick check: optional, explains itself once answered. onAnswer(index, correct) records it.
export function quickCheck(host, { question, options, answer, explain = "", picked = null, onAnswer }) {
  host.classList.add("qcheck");
  host.innerHTML = `<p class="qcheck-k">${icon("circle-check", "ic-s")}${esc(t("check.kicker"))} <span class="opt">· ${esc(t("check.optional"))}</span></p>
    <p class="qcheck-q">${question}</p>
    <div class="qcheck-opts" role="group">${options.map((o, i) => `<button type="button" class="qcheck-opt" data-i="${i}" aria-pressed="false">${o}</button>`).join("")}</div>
    <div class="qcheck-why" aria-live="polite"></div>`;
  const paint = (i, fresh) => {
    const ok = i === answer;
    host.classList.add("answered");
    host.querySelectorAll(".qcheck-opt").forEach((b) => {
      const j = Number(b.dataset.i);
      b.classList.toggle("right", j === answer);
      b.classList.toggle("wrong", j === i && !ok);
      b.setAttribute("aria-pressed", String(j === i));
      b.disabled = true;
    });
    host.querySelector(".qcheck-why").innerHTML = `<b>${esc(ok ? t("check.right") : t("check.wrong"))}</b> ${explain}`;
    if (fresh && onAnswer) onAnswer(i, ok);
  };
  host.querySelector(".qcheck-opts").addEventListener("click", (e) => {
    const b = e.target.closest(".qcheck-opt");
    if (b && !host.classList.contains("answered")) paint(Number(b.dataset.i), true);
  });
  if (picked !== null && picked !== undefined) paint(picked, false);
}

// Notes for a lesson: saved as you type.
export const notesBox = richEditor;

// ── Segmented control ──
export function seg(name, options, value, { label } = {}) {
  return `<div class="seg" role="group" data-seg="${esc(name)}"${label ? ` aria-label="${esc(label)}"` : ""}>${options
    .map((o) => `<button type="button" data-v="${esc(o.value)}" aria-pressed="${o.value === value}"${o.tip ? ` data-tip="${esc(o.tip)}"` : ""}${o.iconOnly ? ` aria-label="${esc(o.label)}"` : ""}>${o.icon ? icon(o.icon) : ""}${o.iconOnly ? "" : esc(o.label)}</button>`)
    .join("")}</div>`;
}
export function onSeg(root, name, fn) {
  root.querySelector(`[data-seg="${name}"]`)?.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]");
    if (!b) return;
    b.parentElement.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    fn(b.dataset.v);
  });
}

// ── Empty state and app-only notice ──
export const empty = (ic, title, body = "") => `<div class="empty">${icon(ic)}<b>${esc(title)}</b>${body ? `<span>${esc(body)}</span>` : ""}</div>`;
export const appOnly = (text) => `<div class="appnote">${icon("monitor-down")}<span>${esc(text || t("app.only"))}</span>${button({ label: t("app.download"), href: "#/app", small: true, icon: "download" })}</div>`;
export const kpi = ({ k, v, d, ic, tip }) => `<div class="card kpi"><p class="k"${tip ? ` data-tip="${esc(tip)}" tabindex="0"` : ""}>${ic ? icon(ic) : ""}${esc(k)}${tip ? icon("info", "ic-s") : ""}</p><p class="v">${v}</p><p class="d">${d || "&nbsp;"}</p></div>`;

// ── Text field: label, input, a help line that turns into a gentle message when something is off ──
export function textField({ name, label, value = "", type = "text", placeholder = "", help = "", autocomplete = "off", optional = false }) {
  const id = `f-${name}`;
  return `<div class="tfield" data-field="${esc(name)}"><label for="${id}">${esc(label)}${optional ? ` <span class="opt">· ${esc(t("check.optional"))}</span>` : ""}</label>
    <input id="${id}" name="${esc(name)}" type="${esc(type)}" value="${esc(value)}" placeholder="${esc(placeholder)}" autocomplete="${esc(autocomplete)}" spellcheck="false"${help ? ` aria-describedby="${id}-h"` : ""}>
    <p class="tfield-h" id="${id}-h" aria-live="polite" data-help="${esc(help)}">${esc(help)}</p></div>`;
}
export function fieldMessage(root, name, message) {
  const f = root.querySelector(`[data-field="${name}"]`);
  if (!f) return;
  const h = f.querySelector(".tfield-h");
  f.classList.toggle("warn", !!message);
  f.querySelector("input").setAttribute("aria-invalid", String(!!message));
  h.textContent = message || h.dataset.help;
}

// ── Confetti: a short burst on a canvas over the page; nothing under reduced motion ──
export function confetti({ x = 0.5, y = 0.35, count = 140, spread = 1, from } = {}) {
  if (reduceMotion()) return;
  if (from) {
    const r = from.getBoundingClientRect();
    x = (r.left + r.width / 2) / innerWidth;
    y = (r.top + r.height / 3) / innerHeight;
  }
  x = Math.min(0.9, Math.max(0.1, x));
  y = Math.min(0.85, Math.max(0.15, y));
  const c = document.createElement("canvas");
  c.className = "confetti";
  c.setAttribute("aria-hidden", "true");
  const dpr = Math.min(2, devicePixelRatio || 1);
  c.width = innerWidth * dpr;
  c.height = innerHeight * dpr;
  document.body.append(c);
  const g = c.getContext("2d");
  g.scale(dpr, dpr);
  const css = getComputedStyle(document.documentElement);
  const colors = ["--accent", "--ok", "--blue", "--violet", "--a-magenta", "--a-teal"].map((v) => css.getPropertyValue(v).trim()).filter(Boolean);
  const ox = x * innerWidth, oy = y * innerHeight;
  const bits = Array.from({ length: count }, () => {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9 * spread;
    const v = (6 + Math.random() * 8) * Math.min(1.2, Math.max(0.7, innerWidth / 1100));
    return { x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3, w: 5 + Math.random() * 5, h: 8 + Math.random() * 6, c: colors[Math.floor(Math.random() * colors.length)], round: Math.random() < 0.3 };
  });
  const start = performance.now();
  const life = 1700;
  const frame = (now) => {
    const k = (now - start) / life;
    g.clearRect(0, 0, innerWidth, innerHeight);
    if (k >= 1) return void c.remove();
    g.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
    for (const b of bits) {
      b.vy += 0.28;
      b.vx *= 0.985;
      b.vy *= 0.985;
      b.x += b.vx;
      b.y += b.vy;
      b.r += b.vr;
      g.save();
      g.translate(b.x, b.y);
      g.rotate(b.r);
      g.fillStyle = b.c;
      if (b.round) { g.beginPath(); g.arc(0, 0, b.w / 2, 0, Math.PI * 2); g.fill(); }
      else g.fillRect(-b.w / 2, -b.h / 2, b.w, b.h * Math.abs(Math.cos(b.r * 2)) + 2);
      g.restore();
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// ── Bottom sheet (a dialog from the middle on wider screens) ──
let openSheet = null;
export function sheet({ title, body, onClose }) {
  closeSheet();
  const prev = document.activeElement;
  const scrim = document.createElement("div");
  scrim.className = "scrim";
  const box = document.createElement("div");
  box.className = "sheet";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", mdPlain(title));
  box.innerHTML = `<div class="sheet-h"><h2>${md(title)}</h2>${button({ label: t("ui.close"), kind: "icon", icon: "x", cls: "sheet-x" })}</div><div class="sheet-b"></div>`;
  const b = box.querySelector(".sheet-b");
  if (typeof body === "string") b.innerHTML = body;
  else b.append(body);
  document.body.append(scrim, box);
  const close = () => {
    scrim.remove();
    box.remove();
    document.removeEventListener("keydown", key, true);
    openSheet = null;
    hideTip();
    if (onClose) onClose();
    if (prev && prev.focus) prev.focus({ preventScroll: true });
  };
  const key = (e) => {
    if (e.key === "Escape") { e.stopPropagation(); close(); }
    if (e.key === "Tab") {
      const f = [...box.querySelectorAll("a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex='-1'])")];
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  };
  document.addEventListener("keydown", key, true);
  scrim.addEventListener("click", close);
  box.querySelector(".sheet-x").addEventListener("click", close);
  box.addEventListener("click", (e) => { if (e.target.closest("a[href^='#']")) close(); });
  openSheet = close;
  requestAnimationFrame(() => (box.querySelector("[aria-current]") || box.querySelector(".sheet-x")).focus({ preventScroll: true }));
  return { close, el: box };
}
export const closeSheet = () => openSheet && openSheet();

// ── Toast ──
export function toast(message, { icon: ic = "check", action, onAction, ms = 4200 } = {}) {
  let host = $(".toasts");
  if (!host) {
    host = document.createElement("div");
    host.className = "toasts";
    host.setAttribute("role", "status");
    host.setAttribute("aria-live", "polite");
    document.body.append(host);
  }
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `${icon(ic)}<span>${esc(message)}</span>${action ? `<button type="button">${esc(action)}</button>` : ""}`;
  if (action) el.querySelector("button").addEventListener("click", () => { el.remove(); onAction && onAction(); });
  host.append(el);
  setTimeout(() => el.remove(), ms);
}

// ── Tooltips: on hover with a mouse and on keyboard focus; never on touch ──
let tipEl = null;
let tipFor = null;
function showTip(target) {
  const text = target.getAttribute("data-tip");
  if (!text) return;
  if (!tipEl) {
    tipEl = document.createElement("div");
    tipEl.className = "tip";
    tipEl.id = "tip";
    tipEl.setAttribute("role", "tooltip");
  }
  tipEl.textContent = text;
  document.body.append(tipEl);
  tipFor = target;
  if (!target.getAttribute("aria-label") || target.getAttribute("aria-label") !== text) target.setAttribute("aria-describedby", "tip");
  const r = target.getBoundingClientRect();
  const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
  let x = r.left + r.width / 2 - w / 2;
  x = Math.max(8, Math.min(x, innerWidth - w - 8));
  let y = r.top - h - 8;
  if (y < 8) y = r.bottom + 8;
  tipEl.style.left = `${x}px`;
  tipEl.style.top = `${y}px`;
}
export function hideTip() {
  if (tipFor) tipFor.removeAttribute("aria-describedby");
  tipFor = null;
  if (tipEl) tipEl.remove();
}
export function initTooltips() {
  let keyboard = false;
  document.addEventListener("keydown", () => (keyboard = true), true);
  document.addEventListener("pointerdown", () => { keyboard = false; hideTip(); }, true);
  document.addEventListener("mouseover", (e) => {
    if (!canHover()) return;
    const el = e.target.closest("[data-tip]");
    if (el && el !== tipFor) showTip(el);
    else if (!el && tipFor) hideTip();
  });
  document.addEventListener("focusin", (e) => {
    const el = e.target.closest && e.target.closest("[data-tip]");
    if (el && keyboard) showTip(el);
  });
  document.addEventListener("focusout", hideTip);
  addEventListener("scroll", hideTip, { passive: true, capture: true });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") hideTip(); });
}
