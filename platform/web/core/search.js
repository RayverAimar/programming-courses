// Search across the courses: "/" or Ctrl/Cmd+K anywhere, or the search button in the bars.
// The core draws the panel and moves through the results; the adapter's search(q) finds them,
// returning [{ href, title, where, section, text }]: section is the heading the match sits under,
// text a plain snippet around the match. searchIndex() is that finder over the index the repo build
// writes (data/<lang>/search.json, rows from searchSections() in build/site.mjs).
import { esc, icon, debounce } from "./dom.js";
import { t } from "./i18n.js";
import { mdPlain } from "./inline.js";
import { adapter } from "./adapter.js";
import { button, sheet } from "./ui.js";
import { ROOT } from "./paths.js";

export const canSearch = () => !!(adapter() && adapter().search);

export const searchButton = (cls = "") =>
  canSearch() ? button({ label: t("search.open"), kind: "icon", icon: "search", cls: `search-btn${cls ? " " + cls : ""}`, tip: t("search.tip") }) : "";

// Accents and case don't matter: "inflacion" marks "inflación".
const fold = (s) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const mark = (text, q) => {
  const raw = String(text).normalize("NFC");
  const hay = fold(raw), needle = fold(q || "");
  if (!needle || hay.length !== raw.length) return esc(raw);
  let out = "", at = 0;
  for (let i = hay.indexOf(needle); i !== -1; i = hay.indexOf(needle, i + needle.length)) {
    out += esc(raw.slice(at, i)) + `<mark>${esc(raw.slice(i, i + needle.length))}</mark>`;
    at = i + needle.length;
  }
  return out + esc(raw.slice(at));
};

const count = (hay, needle) => {
  let n = 0;
  for (let i = hay.indexOf(needle); i !== -1 && n < 20; i = hay.indexOf(needle, i + needle.length)) n++;
  return n;
};
const startsWord = (hay, needle) => new RegExp(`(^|[^\\p{L}\\p{N}])${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "u").test(hay);

// About 150 characters around the match, cut where words end.
function snippet(text, at, len) {
  if (at < 0) return text.length > 150 ? text.slice(0, 150).replace(/\s+\S*$/, "") + " …" : text;
  let from = Math.max(0, at - 60);
  let to = Math.min(text.length, at + len + 90);
  if (from > 0) from = text.indexOf(" ", from) + 1 || from;
  if (to < text.length) to = Math.max(at + len, text.lastIndexOf(" ", to));
  return (from > 0 ? "… " : "") + text.slice(from, to).trim() + (to < text.length ? " …" : "");
}

// A title that names the word comes first (sooner in the title, higher; a reading before a Taller),
// then a section heading that does, then how often the text says it.
export function searchIndex() {
  let index = null;
  const load = () => {
    if (!index) index = fetch(`${ROOT}data/${document.documentElement.lang}/search.json`)
      .then((r) => r.json())
      .then((rows) => rows.map((r) => { const title = mdPlain(r.t); return { ...r, t: title, ft: fold(title), fs: r.s.map(([a, h, x]) => { const head = mdPlain(h); return { a, h: head, x, fh: fold(head), fx: fold(x) }; }) }; }))
      .catch((e) => {
        index = null;
        throw e;
      });
    return index;
  };
  return async (q, limit = 40) => {
    const rows = await load();
    const needle = fold(q.trim());
    const hits = [];
    for (const r of rows) {
      const inTitle = r.ft.includes(needle);
      let best = null;
      let total = 0;
      for (const s of r.fs) {
        const n = count(s.fx, needle) + (s.fh.includes(needle) ? 1 : 0);
        if (!n) continue;
        total += n;
        const sc = (s.fh.includes(needle) ? 10 : 0) + n;
        if (!best || sc > best.sc) best = { s, sc };
      }
      if (!inTitle && !best) continue;
      const score = (inTitle ? 100 + (startsWord(r.ft, needle) ? 20 : 0) + (r.ft === needle ? 50 : 0) - r.ft.indexOf(needle) / 4 - r.t.length / 20 : 0)
        + (best && best.s.fh.includes(needle) ? 15 : 0) + Math.min(total, 8) - (r.k === "w" ? 12 : 0);
      const s = best ? best.s : r.fs[0];
      hits.push({
        href: best && best.s.a ? `${r.h}?at=${encodeURIComponent(best.s.a)}` : r.h,
        title: r.t,
        where: r.w,
        section: s && s.h && s.h !== r.t ? s.h : "",
        text: s ? snippet(s.x, s.fx.indexOf(needle), needle.length) : "",
        score,
      });
    }
    return hits.sort((a, b) => b.score - a.score).slice(0, limit);
  };
}

let open = false;
export function openSearch() {
  if (!canSearch() || open) return;
  open = true;
  const body = `<div class="search">
    <label class="search-f">${icon("search")}<input type="search" autocomplete="off" spellcheck="false" enterkeyhint="go" placeholder="${esc(t("search.placeholder"))}" aria-label="${esc(t("search.title"))}" aria-controls="search-r"></label>
    <div class="search-r" id="search-r" aria-live="polite"><p class="search-note">${esc(t("search.hint"))}</p></div>
  </div>`;
  const box = sheet({ title: t("search.title"), body, onClose: () => (open = false) });
  box.el.classList.add("sheet-search");
  const input = box.el.querySelector("input");
  const out = box.el.querySelector(".search-r");
  let sel = 0;
  let seq = 0;
  const rows = () => [...out.querySelectorAll(".search-hit")];
  const select = (i) => {
    const r = rows();
    if (!r.length) return;
    sel = (i + r.length) % r.length;
    r.forEach((a, k) => a.classList.toggle("sel", k === sel));
    r[sel].scrollIntoView({ block: "nearest" });
  };
  const run = debounce(async () => {
    const q = input.value.trim();
    const mine = ++seq;
    if (q.length < 2) return void (out.innerHTML = `<p class="search-note">${esc(t("search.hint"))}</p>`);
    out.innerHTML = `<p class="search-note">${esc(t("search.loading"))}</p>`;
    let hits = [];
    try {
      hits = await adapter().search(q);
    } catch (e) {
      console.error(e);
    }
    if (mine !== seq) return;
    sel = 0;
    out.innerHTML = hits.length
      ? `<p class="search-note">${esc(t(hits.length === 1 ? "search.count.one" : "search.count.other", { n: hits.length }))}</p><ul class="search-list">${hits
          .map((h, i) => `<li><a class="search-hit${i === 0 ? " sel" : ""}" href="${esc(h.href)}"><span class="search-w">${esc(h.where || "")}</span><span class="search-t">${mark(h.title, q)}</span>${h.section ? `<span class="search-s">${mark(h.section, q)}</span>` : ""}${h.text ? `<span class="search-x">${mark(h.text, q)}</span>` : ""}</a></li>`)
          .join("")}</ul>`
      : `<p class="search-note">${esc(t("search.none", { q }))}</p>`;
  }, 140);
  input.addEventListener("input", run);
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      select(sel + (e.key === "ArrowDown" ? 1 : -1));
    } else if (e.key === "Enter") {
      const a = rows()[sel];
      if (!a) return;
      e.preventDefault();
      box.close();
      location.hash = a.getAttribute("href");
    }
  });
  requestAnimationFrame(() => requestAnimationFrame(() => input.focus()));
}

// "/" and Ctrl/Cmd+K open it, unless you are typing somewhere.
export function bindSearchKeys() {
  document.addEventListener("keydown", (e) => {
    if (!canSearch()) return;
    const a = document.activeElement;
    const typing = a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.type !== "range" || a.isContentEditable);
    if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "k") {
      if (e.defaultPrevented) return;
      e.preventDefault();
      openSearch();
    } else if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      openSearch();
    }
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest(".search-btn")) openSearch();
  });
}
