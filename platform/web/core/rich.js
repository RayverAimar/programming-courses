// The answer editor (rich text) for notes and every free-text answer. It stores HTML limited to the
// schema below; images live in the attachment table and the HTML points at them by id.
import { Schema, DOMParser as PMParser, DOMSerializer } from "prosemirror-model";
import { EditorState, Plugin, TextSelection } from "prosemirror-state";
import { EditorView, Decoration, DecorationSet } from "prosemirror-view";
import { history, undo, redo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { baseKeymap, toggleMark, setBlockType, wrapIn, lift, chainCommands, exitCode } from "prosemirror-commands";
import { inputRules, InputRule, wrappingInputRule, textblockTypeInputRule, undoInputRule } from "prosemirror-inputrules";
import { splitListItem, liftListItem, sinkListItem, wrapInList } from "prosemirror-schema-list";
import { gapCursor } from "prosemirror-gapcursor";
import { esc, icon, debounce } from "./dom.js";
import { t } from "./i18n.js";
import * as P from "./progress.js";

const MAX_SIDE = 1600;
const MAX_IN = 25 * 1024 * 1024;
const MAX_OUT = 3 * 1024 * 1024;
const MAX_TOTAL = 60 * 1024 * 1024;

export function safeHref(raw) {
  const h = String(raw || "").trim();
  if (/^(https?:\/\/|mailto:)/i.test(h)) return h;
  if (/^[\w-]+(\.[\w-]+)+(:\d+)?([/?#]|$)/.test(h) && !/\s/.test(h)) return `https://${h}`;
  return null;
}

const boldWeight = (v) => /^(bold(er)?|[6-9]\d\d)$/.test(v) && null;

export const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { group: "block", content: "inline*", parseDOM: [{ tag: "p" }, { tag: "pre", preserveWhitespace: "full" }], toDOM: () => ["p", 0] },
    heading: { group: "block", content: "inline*", defining: true, parseDOM: ["h1", "h2", "h3", "h4", "h5", "h6"].map((tag) => ({ tag })), toDOM: () => ["h3", 0] },
    blockquote: { group: "block", content: "block+", defining: true, parseDOM: [{ tag: "blockquote" }], toDOM: () => ["blockquote", 0] },
    bullet_list: { group: "block", content: "list_item+", parseDOM: [{ tag: "ul" }], toDOM: () => ["ul", 0] },
    ordered_list: {
      group: "block", content: "list_item+", attrs: { order: { default: 1 } },
      parseDOM: [{ tag: "ol", getAttrs: (d) => ({ order: Math.max(1, parseInt(d.getAttribute("start"), 10) || 1) }) }],
      toDOM: (n) => (n.attrs.order === 1 ? ["ol", 0] : ["ol", { start: n.attrs.order }, 0]),
    },
    list_item: { content: "paragraph block*", defining: true, parseDOM: [{ tag: "li" }], toDOM: () => ["li", 0] },
    image: {
      group: "block", atom: true, draggable: true,
      attrs: { id: {}, width: { default: null }, height: { default: null } },
      parseDOM: [{ tag: "img[data-att]", getAttrs: (d) => {
        const id = d.getAttribute("data-att");
        return /^[\w-]{6,64}$/.test(id) ? { id, width: parseInt(d.getAttribute("width"), 10) || null, height: parseInt(d.getAttribute("height"), 10) || null } : false;
      } }],
      toDOM: (n) => ["img", { "data-att": n.attrs.id, alt: "", ...(n.attrs.width ? { width: n.attrs.width, height: n.attrs.height } : {}) }],
    },
    text: { group: "inline" },
    hard_break: { group: "inline", inline: true, selectable: false, parseDOM: [{ tag: "br" }], toDOM: () => ["br"] },
  },
  marks: {
    link: {
      attrs: { href: {} }, inclusive: false,
      parseDOM: [{ tag: "a[href]", getAttrs: (d) => { const href = safeHref(d.getAttribute("href")); return href ? { href } : false; } }],
      toDOM: (m) => ["a", { href: m.attrs.href, target: "_blank", rel: "noopener noreferrer nofollow" }, 0],
    },
    em: { parseDOM: [{ tag: "i" }, { tag: "em" }, { style: "font-style=italic" }], toDOM: () => ["em", 0] },
    strong: { parseDOM: [{ tag: "strong" }, { tag: "b", getAttrs: (d) => d.style.fontWeight !== "normal" && null }, { style: "font-weight", getAttrs: boldWeight }], toDOM: () => ["strong", 0] },
    code: { parseDOM: [{ tag: "code" }], toDOM: () => ["code", 0] },
  },
});
const N = schema.nodes;
const M = schema.marks;
const parser = PMParser.fromSchema(schema);
const serializer = DOMSerializer.fromSchema(schema);
// Parsing happens in a document with no window: nothing in it runs or loads.
const inert = () => document.implementation.createHTMLDocument("");

export const textToRich = (text) => {
  const s = String(text ?? "").replace(/\r/g, "");
  return s.trim() ? s.split("\n").map((l) => `<p>${esc(l)}</p>`).join("") : "";
};
const isRich = (v) => /^\s*</.test(v || "");
function parseDoc(value) {
  const box = inert().createElement("div");
  box.innerHTML = isRich(value) ? value : textToRich(value);
  return parser.parse(box);
}
const isEmpty = (doc) => doc.childCount === 1 && doc.firstChild.isTextblock && doc.firstChild.content.size === 0;
function toHtml(doc) {
  if (isEmpty(doc)) return "";
  const d = inert();
  const box = d.createElement("div");
  box.append(serializer.serializeFragment(doc.content, { document: d }));
  return box.innerHTML;
}
const docText = (doc) => doc.textBetween(0, doc.content.size, "\n", "").replace(/\n{3,}/g, "\n\n").trim();

export const sanitizeRich = (value) => toHtml(parseDoc(value));
export const richText = (value) => (isRich(value) ? docText(parseDoc(value)) : String(value ?? ""));
export const richImages = (value) => (String(value || "").match(/data-att=/g) || []).length;

// ── Where images live: the progress database, or memory (the gallery) ──
export const dbAttachments = { get: (id) => P.attachment(id), add: (a) => P.addAttachment(a), used: () => P.attachmentBytes() };
export function memoryAttachments() {
  const m = new Map();
  return {
    get: (id) => m.get(id) || null,
    add: (a) => { const id = `mem-${Math.random().toString(36).slice(2, 10)}`; m.set(id, a); return id; },
    used: () => [...m.values()].reduce((s, a) => s + a.data.length, 0),
  };
}
const urls = new Map();
function srcFor(id, store) {
  if (urls.has(id)) return urls.get(id);
  const a = store.get(id);
  if (!a) return "";
  const u = URL.createObjectURL(new Blob([a.data], { type: a.mime }));
  urls.set(id, u);
  return u;
}

let webp = null;
const canWebp = () => (webp ??= document.createElement("canvas").toDataURL("image/webp").startsWith("data:image/webp"));
async function shrink(file) {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * k));
  const h = Math.max(1, Math.round(bmp.height * k));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  const type = canWebp() ? "image/webp" : "image/jpeg";
  if (type === "image/jpeg") { g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); }
  g.imageSmoothingQuality = "high";
  g.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  const blob = await new Promise((r) => c.toBlob(r, type, 0.85));
  if (!blob) throw new Error("encode");
  return { mime: blob.type, width: w, height: h, data: new Uint8Array(await blob.arrayBuffer()) };
}

// ── Viewing an image larger ──
function lightbox(src) {
  if (!src) return;
  const d = document.createElement("dialog");
  d.className = "rx-lightbox";
  d.setAttribute("aria-label", t("rich.imageView"));
  d.innerHTML = `<img src="${esc(src)}" alt=""><button type="button" class="btn btn-icon rx-lb-x" aria-label="${esc(t("rich.close"))}">${icon("x")}</button>`;
  document.body.append(d);
  const close = () => d.close();
  d.addEventListener("close", () => d.remove());
  d.addEventListener("click", (e) => { if (e.target === d || e.target.closest(".rx-lb-x")) close(); });
  d.showModal();
  d.querySelector(".rx-lb-x").focus();
}

// Read-only: saved answers next to the solution, notes elsewhere. Call hydrateRich(root) after inserting.
export const richHtml = (value) => `<div class="prose rx-view">${sanitizeRich(value)}</div>`;
export function hydrateRich(root, store = dbAttachments) {
  root.querySelectorAll(".rx-view img[data-att]").forEach((img) => {
    const src = srcFor(img.dataset.att, store);
    if (!src) return void img.replaceWith(Object.assign(document.createElement("p"), { className: "rx-missing", textContent: t("rich.missing") }));
    img.src = src;
    img.alt = t("rich.imageAlt");
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", t("rich.imageView"));
    const open = () => lightbox(src);
    img.addEventListener("click", open);
    img.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
  });
}

// ── Editing ──
function markRule(re, type) {
  return new InputRule(re, (state, m, start, end) => {
    const from = start + m[1].length;
    return state.tr.replaceWith(from, end, schema.text(m[2], [type.create()])).removeStoredMark(type);
  });
}
const rules = inputRules({ rules: [
  markRule(/(^|[^*])\*\*([^*\s](?:[^*]*[^*\s])?)\*\*$/, M.strong),
  markRule(/(^|[^*\w])\*([^*\s](?:[^*]*[^*\s])?)\*$/, M.em),
  markRule(/(^|[^_\w])_([^_\s](?:[^_]*[^_\s])?)_$/, M.em),
  markRule(/(^|[^`])`([^`]+)`$/, M.code),
  wrappingInputRule(/^\s*([-+*])\s$/, N.bullet_list),
  wrappingInputRule(/^(\d+)\.\s$/, N.ordered_list, (m) => ({ order: +m[1] }), (m, n) => n.childCount + n.attrs.order === +m[1]),
  wrappingInputRule(/^\s*>\s$/, N.blockquote),
  textblockTypeInputRule(/^#{1,6}\s$/, N.heading),
] });

const placeholder = (text) => new Plugin({
  props: {
    decorations: (state) => (isEmpty(state.doc) ? DecorationSet.create(state.doc, [Decoration.node(0, state.doc.firstChild.nodeSize, { class: "rx-ph", "data-ph": text })]) : null),
  },
});
// There is always somewhere to type after an image.
const trailing = new Plugin({
  appendTransaction: (_trs, _old, state) => (state.doc.lastChild.type === N.image ? state.tr.insert(state.doc.content.size, N.paragraph.create()) : null),
});

const inside = (state, type) => {
  const { $from } = state.selection;
  for (let d = $from.depth; d > 0; d--) if ($from.node(d).type === type) return d;
  return 0;
};
const markOn = (state, type) => {
  const { from, $from, to, empty } = state.selection;
  return empty ? !!type.isInSet(state.storedMarks || $from.marks()) : state.doc.rangeHasMark(from, to, type);
};
function listIn(state) {
  const { $from } = state.selection;
  for (let d = $from.depth; d > 0; d--) { const n = $from.node(d); if (n.type === N.bullet_list || n.type === N.ordered_list) return { node: n, depth: d }; }
  return null;
}
const toggleList = (type) => (state, dispatch) => {
  const l = listIn(state);
  if (!l) return wrapInList(type)(state, dispatch);
  if (l.node.type === type) return liftListItem(N.list_item)(state, dispatch);
  if (dispatch) dispatch(state.tr.setNodeMarkup(state.selection.$from.before(l.depth), type));
  return true;
};
const toggleHeading = (state, dispatch) => (state.selection.$from.parent.type === N.heading ? setBlockType(N.paragraph) : setBlockType(N.heading))(state, dispatch);
const toggleQuote = (state, dispatch) => (inside(state, N.blockquote) ? lift : wrapIn(N.blockquote))(state, dispatch);

const MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const keyLabel = (k) => (MAC ? `⌘${k.replace("Shift-", "⇧")}` : `Ctrl+${k}`);
const ariaKey = (k) => `${MAC ? "Meta" : "Control"}+${k.replace("Shift-", "Shift+")}`;

const TOOLS = [
  { k: "bold", ic: "bold", key: "B", main: true, run: toggleMark(M.strong), on: (s) => markOn(s, M.strong) },
  { k: "italic", ic: "italic", key: "I", main: true, run: toggleMark(M.em), on: (s) => markOn(s, M.em) },
  { k: "heading", ic: "heading", run: toggleHeading, on: (s) => s.selection.$from.parent.type === N.heading },
  { k: "bullets", ic: "list", main: true, run: toggleList(N.bullet_list), on: (s) => listIn(s)?.node.type === N.bullet_list },
  { k: "numbers", ic: "list-ordered", run: toggleList(N.ordered_list), on: (s) => listIn(s)?.node.type === N.ordered_list },
  { k: "quote", ic: "text-quote", run: toggleQuote, on: (s) => !!inside(s, N.blockquote) },
  { k: "code", ic: "code", key: "E", run: toggleMark(M.code), on: (s) => markOn(s, M.code) },
  { k: "link", ic: "link", key: "K", main: true, on: (s) => markOn(s, M.link) },
  { k: "image", ic: "image-plus", main: true },
  { sep: true },
  { k: "undo", ic: "undo-2", key: "Z", run: undo, can: true },
  { k: "redo", ic: "redo-2", key: "Shift-Z", run: redo, can: true },
];

const live = new Set();
// Pending edits are written before the screen changes and when the page hides (boot.js).
export function flushEditors() {
  for (const e of live) {
    e.flush();
    if (!e.connected()) live.delete(e);
  }
}

class ImageView {
  constructor(node, view, getPos, store) {
    this.node = node;
    const dom = (this.dom = document.createElement("div"));
    dom.className = "rx-img";
    const src = srcFor(node.attrs.id, store);
    dom.innerHTML = src
      ? `<img src="${esc(src)}" alt="${esc(t("rich.imageAlt"))}"${node.attrs.width ? ` width="${node.attrs.width}" height="${node.attrs.height}"` : ""} draggable="false">`
      : `<p class="rx-missing">${icon("image-off", "ic-s")}${esc(t("rich.missing"))}</p>`;
    const acts = document.createElement("span");
    acts.className = "rx-img-acts";
    acts.contentEditable = "false";
    acts.innerHTML = `${src ? `<button type="button" class="rx-zoom" aria-label="${esc(t("rich.imageView"))}" data-tip="${esc(t("rich.imageView"))}">${icon("maximize-2")}</button>` : ""}<button type="button" class="rx-del" aria-label="${esc(t("rich.imageRemove"))}" data-tip="${esc(t("rich.imageRemove"))}">${icon("x")}</button>`;
    dom.append(acts);
    acts.addEventListener("mousedown", (e) => e.preventDefault());
    acts.querySelector(".rx-zoom")?.addEventListener("click", () => lightbox(src));
    acts.querySelector(".rx-del").addEventListener("click", () => {
      const pos = getPos();
      if (typeof pos !== "number") return;
      view.dispatch(view.state.tr.delete(pos, pos + this.node.nodeSize));
      view.focus();
    });
  }
  update(node) {
    if (node.type !== this.node.type || node.attrs.id !== this.node.attrs.id) return false;
    this.node = node;
    return true;
  }
  selectNode() { this.dom.classList.add("is-sel"); }
  deselectNode() { this.dom.classList.remove("is-sel"); }
  stopEvent(e) { return !!e.target.closest?.(".rx-img-acts"); }
  ignoreMutation() { return true; }
}

let seq = 0;
export function richEditor(host, { value = "", onSave = () => {}, label = t("notes.title"), labelIcon = "notebook-pen", placeholder: ph = t("notes.placeholder"), saved = t("notes.saved"), attachments = dbAttachments, compact = false } = {}) {
  const id = `rx${++seq}`;
  host.classList.add("notes", "rx");
  host.classList.toggle("rx-compact", compact);
  host.innerHTML = `<p class="rx-label" id="${id}-l">${icon(labelIcon, "ic-s")}${esc(label)}</p>
    <div class="rx-box">
      <div class="rx-bar" role="toolbar" aria-label="${esc(t("rich.toolbar"))}" aria-controls="${id}-ed">${TOOLS.map((b) => b.sep
        ? `<span class="rx-sep" aria-hidden="true"></span>`
        : `<button type="button" class="rx-b${b.main ? " rx-main" : ""}" data-k="${b.k}" tabindex="-1" aria-label="${esc(t(`rich.${b.k}`))}" data-tip="${esc(t(`rich.${b.k}`))}${b.key ? ` · ${keyLabel(b.key)}` : ""}"${b.key ? ` aria-keyshortcuts="${ariaKey(b.key)}"` : ""}${b.on ? ` aria-pressed="false"` : ""}>${icon(b.ic)}</button>`).join("")}
        <button type="button" class="rx-b rx-more" tabindex="-1" aria-expanded="false" aria-label="${esc(t("rich.more"))}" data-tip="${esc(t("rich.more"))}">${icon("ellipsis")}</button>
      </div>
      <div class="rx-link" hidden>
        <input type="url" inputmode="url" placeholder="https://…" aria-label="${esc(t("rich.linkUrl"))}">
        <button type="button" class="btn btn-s rx-link-ok">${icon("check")}<span>${esc(t("rich.linkApply"))}</span></button>
        <button type="button" class="btn btn-icon rx-link-rm" aria-label="${esc(t("rich.unlink"))}" data-tip="${esc(t("rich.unlink"))}">${icon("unlink")}</button>
        <button type="button" class="btn btn-icon rx-link-x" aria-label="${esc(t("rich.close"))}" data-tip="${esc(t("rich.close"))}">${icon("x")}</button>
      </div>
      <div class="rx-ed" id="${id}-ed"></div>
    </div>
    <input type="file" accept="image/*" multiple hidden tabindex="-1" aria-hidden="true">
    <p class="rx-foot"><span class="saved" aria-live="polite"></span><span class="rx-msg" role="status"></span></p>`;
  const bar = host.querySelector(".rx-bar");
  const linkRow = host.querySelector(".rx-link");
  const linkIn = linkRow.querySelector("input");
  const file = host.querySelector("input[type=file]");
  const savedEl = host.querySelector(".saved");
  const msgEl = host.querySelector(".rx-msg");
  const say = (m) => { msgEl.textContent = m || ""; };

  let lastHtml = sanitizeRich(value);
  const save = debounce(() => {
    const html = toHtml(view.state.doc);
    if (html === lastHtml) return;
    lastHtml = html;
    onSave(html);
    savedEl.textContent = saved;
  }, 500);

  async function addImages(files, pos = null) {
    const list = [...files].filter((f) => /^image\//.test(f.type));
    if (!list.length) return;
    for (const f of list) {
      if (f.size > MAX_IN) { say(t("rich.tooBig", { mb: MAX_IN >> 20 })); continue; }
      say(t("rich.processing"));
      let a;
      try { a = await shrink(f); } catch (_) { say(t("rich.unreadable")); continue; }
      if (a.data.length > MAX_OUT) { say(t("rich.tooBig", { mb: MAX_IN >> 20 })); continue; }
      if (attachments.used() + a.data.length > MAX_TOTAL) { say(t("rich.full", { mb: MAX_TOTAL >> 20 })); return; }
      const att = attachments.add({ ...a });
      const node = N.image.create({ id: att, width: a.width, height: a.height });
      const tr = view.state.tr;
      if (pos !== null) tr.setSelection(TextSelection.near(tr.doc.resolve(Math.min(pos, tr.doc.content.size))));
      tr.replaceSelectionWith(node);
      let end = tr.selection.to;
      tr.doc.descendants((n, p) => { if (n.type === N.image && n.attrs.id === att) end = p + n.nodeSize; });
      if (!tr.doc.resolve(end).nodeAfter?.isTextblock) tr.insert(end, N.paragraph.create());
      tr.setSelection(TextSelection.create(tr.doc, end + 1));
      pos = end + 1;
      view.dispatch(tr.scrollIntoView());
      say("");
    }
    view.focus();
  }

  const openLink = () => {
    const { state } = view;
    const { from, to, $from } = state.selection;
    let href = "";
    state.doc.nodesBetween(from, Math.max(to, from + 1), (n) => { const m = M.link.isInSet(n.marks); if (m) href = m.attrs.href; });
    if (!href) { const m = M.link.isInSet($from.marks()); if (m) href = m.attrs.href; }
    linkRow.hidden = false;
    linkIn.value = href;
    linkRow.querySelector(".rx-link-rm").hidden = !href;
    linkIn.focus();
    linkIn.select();
    return true;
  };
  const closeLink = () => { linkRow.hidden = true; say(""); view.focus(); };
  const linkRange = (state) => {
    let { from, to } = state.selection;
    if (from === to) {
      const $p = state.doc.resolve(from);
      const m = M.link.isInSet($p.marks()) || ($p.nodeAfter && M.link.isInSet($p.nodeAfter.marks));
      if (m) {
        const start = $p.start();
        $p.parent.forEach((n, off) => { if (m.isInSet(n.marks) && start + off <= from && start + off + n.nodeSize >= from) { from = Math.min(from, start + off); to = Math.max(to, start + off + n.nodeSize); } });
      }
    }
    return { from, to };
  };
  const applyLink = () => {
    const href = safeHref(linkIn.value);
    if (!href) return void say(t("rich.linkBad"));
    const { state } = view;
    const { from, to } = linkRange(state);
    const tr = state.tr;
    if (from === to) tr.insert(from, schema.text(linkIn.value.trim(), [M.link.create({ href })]));
    else tr.removeMark(from, to, M.link).addMark(from, to, M.link.create({ href }));
    view.dispatch(tr);
    closeLink();
  };
  const removeLink = () => {
    const { from, to } = linkRange(view.state);
    view.dispatch(view.state.tr.removeMark(from, to, M.link));
    closeLink();
  };

  const run = (k) => {
    if (k === "link") return openLink();
    if (k === "image") return void file.click();
    const b = TOOLS.find((x) => x.k === k);
    b.run(view.state, view.dispatch, view);
    view.focus();
  };

  const listKeys = { Enter: splitListItem(N.list_item), Tab: sinkListItem(N.list_item), "Shift-Tab": liftListItem(N.list_item) };
  const view = new EditorView(host.querySelector(".rx-ed"), {
    state: EditorState.create({
      doc: parseDoc(lastHtml),
      plugins: [
        rules,
        keymap({
          "Mod-z": undo, "Mod-y": redo, "Shift-Mod-z": redo,
          "Mod-b": toggleMark(M.strong), "Mod-i": toggleMark(M.em), "Mod-e": toggleMark(M.code), "Mod-k": openLink,
          Backspace: undoInputRule,
          "Shift-Enter": chainCommands(exitCode, (state, dispatch) => { if (dispatch) dispatch(state.tr.replaceSelectionWith(N.hard_break.create()).scrollIntoView()); return true; }),
          ...listKeys,
        }),
        keymap(baseKeymap),
        history(),
        gapCursor(),
        placeholder(ph),
        trailing,
      ],
    }),
    attributes: { class: "prose", role: "textbox", "aria-multiline": "true", "aria-labelledby": `${id}-l`, spellcheck: "true" },
    nodeViews: { image: (node, v, getPos) => new ImageView(node, v, getPos, attachments) },
    handlePaste: (_v, e) => {
      const files = [...(e.clipboardData?.files || [])].filter((f) => /^image\//.test(f.type));
      if (!files.length) return false;
      addImages(files);
      return true;
    },
    handleDrop: (v, e, _slice, moved) => {
      if (moved) return false;
      const files = [...(e.dataTransfer?.files || [])].filter((f) => /^image\//.test(f.type));
      if (!files.length) return false;
      e.preventDefault();
      const at = v.posAtCoords({ left: e.clientX, top: e.clientY });
      addImages(files, at ? at.pos : null);
      return true;
    },
    handleKeyDown: (_v, e) => {
      if (e.key === "F10" && e.altKey) { e.preventDefault(); bar.querySelector(".rx-b:not([hidden])")?.focus(); return true; }
      return false;
    },
    dispatchTransaction(tr) {
      view.updateState(view.state.apply(tr));
      paint();
      if (tr.docChanged) { savedEl.textContent = ""; save(); }
    },
  });

  const buttons = [...bar.querySelectorAll(".rx-b")];
  function paint() {
    const s = view.state;
    for (const b of buttons) {
      const tool = TOOLS.find((x) => x.k === b.dataset.k);
      if (!tool) continue;
      if (tool.on) b.setAttribute("aria-pressed", String(!!tool.on(s)));
      if (tool.can) b.disabled = !tool.run(s);
    }
  }
  paint();
  const enabled = () => buttons.filter((b) => !b.disabled && b.offsetParent !== null);
  let current = buttons[0];
  current.tabIndex = 0;
  const rove = (b) => { current.tabIndex = -1; current = b; b.tabIndex = 0; b.focus(); };
  bar.addEventListener("mousedown", (e) => { if (e.target.closest(".rx-b")) e.preventDefault(); });
  bar.addEventListener("click", (e) => {
    const b = e.target.closest(".rx-b");
    if (!b || b.disabled) return;
    if (b.classList.contains("rx-more")) {
      const open = bar.classList.toggle("open");
      b.setAttribute("aria-expanded", String(open));
      return;
    }
    run(b.dataset.k);
  });
  bar.addEventListener("keydown", (e) => {
    const list = enabled();
    const i = list.indexOf(document.activeElement);
    if (i < 0) return;
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: list.length - 1 }[e.key];
    if (to === undefined) { if (e.key === "Escape") view.focus(); return; }
    e.preventDefault();
    rove(list[(to + list.length) % list.length]);
  });
  bar.addEventListener("focusin", (e) => { const b = e.target.closest(".rx-b"); if (b && b !== current) { current.tabIndex = -1; current = b; b.tabIndex = 0; } });

  linkRow.querySelector(".rx-link-ok").addEventListener("click", applyLink);
  linkRow.querySelector(".rx-link-rm").addEventListener("click", removeLink);
  linkRow.querySelector(".rx-link-x").addEventListener("click", closeLink);
  linkIn.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); applyLink(); }
    if (e.key === "Escape") { e.preventDefault(); closeLink(); }
  });
  file.addEventListener("change", () => { addImages(file.files); file.value = ""; });
  host.querySelector(".rx-label").addEventListener("click", () => view.focus());
  view.dom.addEventListener("blur", () => save.flush());
  // Compact: one line until you focus it, and back to one line when you leave it empty.
  const fold = () => host.classList.toggle("rx-folded", compact && isEmpty(view.state.doc) && !host.contains(document.activeElement) && linkRow.hidden);
  if (compact) {
    host.addEventListener("focusin", () => host.classList.remove("rx-folded"));
    host.addEventListener("focusout", () => setTimeout(fold, 0));
    fold();
  }

  const api = {
    flush: () => save.flush(),
    connected: () => view.dom.isConnected,
    html: () => toHtml(view.state.doc),
    text: () => docText(view.state.doc),
    focus: () => view.focus(),
    view,
    destroy: () => { save.flush(); live.delete(api); view.destroy(); },
    addImages,
  };
  live.add(api);
  return api;
}
