// A lesson photo opens larger in a lightbox (the figure comes from build/photos.mjs).
// One listener on the document covers lessons, the Taller and reference pages.
import { esc, icon } from "./dom.js";
import { t } from "./i18n.js";

function open(btn) {
  const fig = btn.closest(".photo");
  const img = btn.querySelector("img");
  const cap = fig?.querySelector("figcaption");
  const d = document.createElement("dialog");
  d.className = "photo-box";
  d.setAttribute("aria-label", img?.alt || "");
  d.innerHTML =
    `<img src="${esc(btn.dataset.full)}" alt="${esc(img?.alt || "")}">` +
    (cap ? `<p class="photo-box-cap">${cap.innerHTML}</p>` : "") +
    `<button type="button" class="btn btn-icon photo-box-x" aria-label="${esc(t("photo.close"))}" data-tip="${esc(t("photo.close"))}">${icon("x")}</button>`;
  document.body.append(d);
  d.addEventListener("close", () => { d.remove(); btn.focus(); });
  d.addEventListener("click", (e) => { if (e.target === d || e.target.closest(".photo-box-x") || e.target.tagName === "IMG") d.close(); });
  d.showModal();
  d.querySelector(".photo-box-x").focus();
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest?.(".photo-zoom");
  if (btn) open(btn);
});

// A floated photo taller than the text beside it leaves a hole under that text: the photo takes the
// widest width (not under 11rem) that ends within HOLE px of the text; when none does, it goes under
// the text instead of beside it.
const HOLE = 24;
function fit(inn) {
  const ph = inn.querySelector(":scope > .photo");
  if (!ph) return;
  inn.classList.remove("photo-stack");
  ph.style.width = "";
  if (getComputedStyle(ph).float === "none") return;
  const beside = [...inn.children].filter((k) => k !== ph && getComputedStyle(k).clear === "none");
  if (!beside.length) return;
  const hole = () => ph.getBoundingClientRect().bottom - Math.max(...beside.map((k) => k.getBoundingClientRect().bottom));
  if (hole() <= HOLE) return;
  const min = 11 * parseFloat(getComputedStyle(document.documentElement).fontSize);
  for (let w = ph.getBoundingClientRect().width - 12; w >= min; w -= 12) {
    ph.style.width = `${w}px`;
    if (hole() <= HOLE) return;
  }
  ph.style.width = "";
  inn.classList.add("photo-stack");
}
const widths = new WeakMap();
const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver((es) => {
  for (const e of es) {
    const w = Math.round(e.contentRect.width);
    if (widths.get(e.target) === w) continue;
    widths.set(e.target, w);
    fit(e.target);
  }
});
function watch(root) {
  for (const inn of root.querySelectorAll?.(".photo-in") || []) {
    if (widths.has(inn)) continue;
    ro?.observe(inn);
    inn.querySelectorAll("img").forEach((img) => img.complete || img.addEventListener("load", () => fit(inn), { once: true }));
  }
}
if (typeof MutationObserver !== "undefined" && typeof document !== "undefined") {
  new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) watch(n.matches?.(".photo-in") ? n.parentNode : n); }).observe(document.documentElement, { childList: true, subtree: true });
  watch(document);
  document.fonts?.ready.then(() => document.querySelectorAll(".photo-in").forEach(fit));
}
