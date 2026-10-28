import { esc, icon } from "../platform/web/core/dom.js";
import { t } from "../platform/web/core/i18n.js";

// A wide table scrolls inside its box; the side with more to see fades out, so it doesn't look cut off.
const ro = typeof ResizeObserver === "function" ? new ResizeObserver((list) => list.forEach((e) => mark(e.target.closest(".tablewrap")))) : null;

function mark(el) {
  if (!el) return;
  const max = el.scrollWidth - el.clientWidth;
  const more = max > 1 ? [el.scrollLeft > 1 && "l", el.scrollLeft < max - 1 && "r"].filter(Boolean).join(" ") : "";
  if (more) el.dataset.more = more;
  else delete el.dataset.more;
}

export function scrollHints(root) {
  for (const el of root.querySelectorAll(".tablewrap")) {
    el.addEventListener("scroll", () => mark(el), { passive: true });
    if (ro) { ro.observe(el); if (el.firstElementChild) ro.observe(el.firstElementChild); }
    else mark(el);
  }
}

// A table that is wider than its box says so in words, not only with the fade: a line under it,
// there while it overflows. It covers the tables the page builds later (results, judge tables).
const BOXES = ".rt-scroll, .tablewrap";
const seen = new WeakSet();

function hint(el) {
  const over = el.scrollWidth > el.clientWidth + 2;
  const next = el.nextElementSibling;
  const has = !!next && next.classList.contains("scroll-hint");
  if (over && !has) el.insertAdjacentHTML("afterend", `<p class="scroll-hint">${icon("move-horizontal", "ic-s")}${esc(t("table.scroll"))}</p>`);
  else if (!over && has) next.remove();
}

function watch(el) {
  if (seen.has(el)) return;
  seen.add(el);
  if (ro2) { ro2.observe(el); if (el.firstElementChild) ro2.observe(el.firstElementChild); }
  hint(el);
}
const ro2 = typeof ResizeObserver === "function" ? new ResizeObserver((list) => list.forEach((e) => hint(e.target.matches(BOXES) ? e.target : e.target.closest(BOXES)))) : null;

export function watchTables(root = document.body) {
  root.querySelectorAll(BOXES).forEach(watch);
  new MutationObserver((list) => {
    for (const m of list) for (const n of m.addedNodes) {
      if (n.nodeType !== 1) continue;
      if (n.matches(BOXES)) watch(n);
      n.querySelectorAll(BOXES).forEach(watch);
    }
  }).observe(root, { childList: true, subtree: true });
}
