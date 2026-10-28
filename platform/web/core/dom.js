import ICONS from "virtual:icons";

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const plain = (html) => String(html ?? "").replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const byId = (id) => document.getElementById(id);
export const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
export const canHover = () => matchMedia("(hover: hover) and (pointer: fine)").matches;

export function icon(name, cls = "") {
  const body = ICONS[name];
  if (!body) throw new Error(`Unknown icon "${name}"`);
  return `<svg class="ic${cls ? " " + cls : ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}

export function html(strings, ...values) {
  return strings.reduce((out, s, i) => out + s + (i < values.length ? [].concat(values[i] ?? "").join("") : ""), "");
}

export function debounce(fn, ms) {
  let t = null;
  const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  d.flush = (...a) => { clearTimeout(t); return fn(...a); };
  return d;
}
