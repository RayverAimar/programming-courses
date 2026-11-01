// Touches a rendered lesson needs on both repos: callouts styled by their label, and interactive
// figures that say so until the first touch, so they don't read as a picture.
import { esc } from "./dom.js";
import { t } from "./i18n.js";
import { adapter } from "./adapter.js";

const CALLOUTS = {
  trap: ["trampa común", "common trap", "error común", "common mistake"],
  where: ["dónde vive esto", "where this lives", "en la vida real", "in real life"],
  history: ["historia", "history"],
  try: ["pruébalo", "pruébalo tú", "try it", "try it yourself"],
  note: ["nota", "note"],
  example: ["ejemplo", "example"],
  recall: ["la vez pasada", "last time", "recuerda", "remember"],
  takeaway: ["para llevar", "takeaway", "en una línea", "in one line"],
};
const KIND = new Map(Object.entries(CALLOUTS).flatMap(([k, labels]) => labels.map((l) => [l, k])));

const labelOf = (bq) => {
  const first = bq.firstElementChild;
  const strong = first && first.firstElementChild;
  if (!strong || strong.tagName !== "STRONG" || first.firstChild !== strong) return "";
  return strong.textContent.trim().replace(/\s*\(.*\)$/, "").replace(/[:.]$/, "").toLowerCase();
};

const DEFAULT_INTERACTIVE = '.lab, .stepper, figure.vis:has(button, input, select, [role="slider"])';

// A ```steps walk-through (build/steps.mjs): one step at a time, Back / Next, dots to jump.
function wireStepper(box) {
  box.dataset.wired = "1";
  const steps = [...box.querySelectorAll(":scope > .step")];
  const nav = box.querySelector(":scope > .stepper-nav");
  if (!nav || steps.length < 2) return;
  nav.hidden = false;
  box.classList.add("is-stepping");
  const prev = nav.querySelector(".stepper-prev"), next = nav.querySelector(".stepper-next");
  const dots = [...nav.querySelectorAll(".stepper-dots i")];
  const nextLabel = next.textContent;
  let at = 0;
  const show = (i, move) => {
    at = i;
    steps.forEach((s, k) => { s.hidden = k !== i; s.classList.toggle("step-in", k === i && move); });
    dots.forEach((d, k) => { d.classList.toggle("on", k === i); d.classList.toggle("seen", k < i); });
    prev.disabled = i === 0;
    next.textContent = i === steps.length - 1 ? t("steps.again") : nextLabel;
  };
  prev.addEventListener("click", () => at > 0 && show(at - 1, true));
  next.addEventListener("click", () => show(at === steps.length - 1 ? 0 : at + 1, true));
  dots.forEach((d, k) => d.addEventListener("click", () => show(k, true)));
  box.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea, .cm-editor")) return;
    if (e.key === "ArrowRight") { e.stopPropagation(); e.preventDefault(); next.click(); }
    if (e.key === "ArrowLeft") { e.stopPropagation(); e.preventDefault(); prev.click(); }
  });
  show(0, false);
}

export function decorate(root) {
  if (!root) return;
  for (const box of root.querySelectorAll(".stepper:not([data-wired])")) wireStepper(box);
  for (const bq of root.querySelectorAll("blockquote:not([data-co])")) {
    const kind = KIND.get(labelOf(bq));
    bq.dataset.co = kind || "plain";
    if (kind) bq.classList.add("co", `co-${kind}`);
  }
  const sel = (adapter() && adapter().interactive) || DEFAULT_INTERACTIVE;
  for (const el of root.querySelectorAll(sel)) {
    if (el.dataset.live) continue;
    el.dataset.live = "1";
    el.classList.add("is-live", "live-new");
    el.insertAdjacentHTML("afterbegin", `<span class="live-tag" aria-hidden="true">${esc(t("fig.interactive"))}</span>`);
    const touched = () => el.classList.remove("live-new");
    el.addEventListener("pointerdown", touched, { once: true });
    el.addEventListener("keydown", touched, { once: true });
  }
}

// Labs and figures can mount after the text (lazily, on scroll): decorate them as they arrive.
export function watchDecorate(root) {
  if (!root) return () => {};
  decorate(root);
  let queued = false;
  const mo = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; decorate(root); });
  });
  mo.observe(root, { childList: true, subtree: true });
  return () => mo.disconnect();
}
