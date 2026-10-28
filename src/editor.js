// The in-page editor: CodeMirror 6, bundled locally, coloured from the site's CSS variables.
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection, highlightSpecialChars } from "@codemirror/view";
import { EditorState, Prec, Compartment } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { sql as sqlLang, SQLite } from "@codemirror/lang-sql";
import { sqlCatalog, sqlCompletionSource } from "./sql/complete.js";
import { syntaxHighlighting, HighlightStyle, indentOnInput, bracketMatching, indentUnit } from "@codemirror/language";
import { closeBrackets, closeBracketsKeymap, autocompletion, startCompletion, closeCompletion, acceptCompletion, moveCompletionSelection, hasNextSnippetField, nextSnippetField, closeCompletion as close } from "@codemirror/autocomplete";
import { buildCatalog, completionSource, localSource, pyLocalSource, signatureHelp } from "./editor/complete.js";
import { tags } from "@lezer/highlight";

const style = HighlightStyle.define([
  { tag: [tags.keyword, tags.controlKeyword, tags.definitionKeyword, tags.moduleKeyword, tags.operatorKeyword], color: "var(--c-kw)" },
  { tag: [tags.string, tags.special(tags.string)], color: "var(--c-str)" },
  { tag: [tags.number, tags.bool, tags.null, tags.atom], color: "var(--c-num)" },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: "var(--muted)", fontStyle: "italic" },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: "var(--c-fn)" },
  { tag: tags.invalid, color: "var(--a-crimson)" },
]);

const theme = EditorView.theme({
  "&": { color: "var(--ink-2)", backgroundColor: "var(--raise)", borderRadius: "12px", fontSize: "var(--code-fs)" },
  "&.cm-focused": { outline: "2px solid var(--accent)", outlineOffset: "0" },
  ".cm-scroller": { fontFamily: "var(--mono)", lineHeight: "1.6", padding: "6px 0" },
  ".cm-content": { caretColor: "var(--accent)", padding: "4px 0" },
  ".cm-gutters": { backgroundColor: "transparent", color: "var(--faint)", border: "none", paddingLeft: "6px" },
  ".cm-activeLine": { backgroundColor: "color-mix(in srgb, var(--accent) 6%, transparent)" },
  ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--muted)" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection": { backgroundColor: "var(--wash) !important" },
  ".cm-cursor": { borderLeftColor: "var(--accent)", borderLeftWidth: "2px" },
  ".cm-matchingBracket": { backgroundColor: "var(--wash)", outline: "none" },
  ".cm-tooltip": { backgroundColor: "var(--paper)", color: "var(--ink-2)", border: "1px solid var(--hair)", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,.14)", fontFamily: "var(--display)" },
  ".cm-tooltip.cm-tooltip-autocomplete > ul": { fontFamily: "var(--mono)", fontSize: "13px", maxHeight: "14em", minWidth: "200px", maxWidth: "min(340px, 80vw)" },
  ".cm-tooltip.cm-tooltip-autocomplete > ul > li": { padding: "3px 10px", lineHeight: "1.5" },
  ".cm-tooltip-autocomplete ul li[aria-selected]": { backgroundColor: "var(--accent)", color: "var(--paper)" },
  ".cm-completionDetail": { fontStyle: "normal", opacity: ".7", marginLeft: "8px", fontFamily: "var(--display)", fontSize: "12px" },
  ".cm-completionMatchedText": { textDecoration: "none", fontWeight: "700" },
  ".cm-completionIcon": { opacity: ".55", width: "1em", paddingRight: "8px" },
  ".cm-completionInfo": { padding: "8px 12px", maxWidth: "min(320px, 80vw)" },
  ".cm-ac-info code, .cm-sig code": { fontFamily: "var(--mono)", fontSize: "12.5px", color: "var(--ink)", whiteSpace: "pre-wrap" },
  ".cm-ac-info p, .cm-sig p": { margin: "4px 0 0", fontSize: "13px", lineHeight: "1.45", color: "var(--muted)" },
  ".cm-sig": { padding: "6px 10px", maxWidth: "min(420px, 86vw)" },
  ".cm-sig b": { color: "var(--accent)" },
});

// Beside the list when there is room; below it on a phone, so it never covers a suggestion.
function placeInfo(_view, list, _option, info, space) {
  const roomRight = space.right - list.right, roomLeft = list.left - space.left;
  const w = Math.min(320, info.right - info.left || 320);
  if (roomRight >= w + 8) return { style: `left: 100%; top: 0`, class: "cm-completionInfo-right" };
  if (roomLeft >= w + 8) return { style: `right: 100%; top: 0`, class: "cm-completionInfo-left" };
  const left = Math.max(space.left + 8, Math.min(list.left, space.right - Math.min(320, space.right - space.left - 16) - 8)) - list.left;
  return { style: `top: ${list.bottom - list.top + 4}px; left: ${left}px; max-width: ${Math.min(320, space.right - space.left - 16)}px`, class: "cm-completionInfo-below" };
}

// On a phone long lines wrap, so nothing hides past the right edge.
const narrow = typeof matchMedia === "function" ? matchMedia("(max-width: 699px)") : null;
const wrapping = () => (narrow && narrow.matches ? EditorView.lineWrapping : []);

const coarse = () => typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;

export function createEditor(parent, { doc, onRun, onChange, label, readOnly = false, env = null, lang = "es", track = "js", tables = null, withSchema = undefined }) {
  const run = () => (onRun ? (onRun(), true) : false);
  const py = track === "py";
  const isSql = track === "sql";
  const cat = isSql ? null : buildCatalog(env, lang, track);
  const sources = isSql ? [sqlCompletionSource(sqlCatalog(lang, tables, withSchema))] : [completionSource(cat), py ? pyLocalSource : localSource];
  const acKeys = [
    { key: "Ctrl-Space", run: startCompletion },
    { key: "Alt-Space", run: startCompletion },
    { key: "Escape", run: closeCompletion },
    { key: "ArrowDown", run: moveCompletionSelection(true) },
    { key: "ArrowUp", run: moveCompletionSelection(false) },
    { key: "PageDown", run: moveCompletionSelection(true, "page") },
    { key: "PageUp", run: moveCompletionSelection(false, "page") },
    { key: "Tab", run: (v) => (hasNextSnippetField(v.state) ? (close(v), nextSnippetField(v)) : acceptCompletion(v)) },
    ...(coarse() ? [] : [{ key: "Enter", run: acceptCompletion }]),
  ];
  const wrap = new Compartment();
  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc,
      extensions: [
        lineNumbers(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        ...(readOnly ? [] : [
          autocompletion({ override: sources, defaultKeymap: false, icons: true, maxRenderedOptions: 60, activateOnTypingDelay: coarse() ? 250 : 80, closeOnBlur: true, positionInfo: placeInfo }),
          Prec.highest(keymap.of(acKeys)),
          ...(isSql ? [] : [signatureHelp(cat)]),
        ]),
        highlightActiveLine(),
        isSql ? sqlLang({ dialect: SQLite, upperCaseKeywords: true }) : py ? python() : javascript(),
        syntaxHighlighting(style),
        theme,
        wrap.of(wrapping()),
        // Python's blocks are its indentation: 4 spaces, as PEP 8 says.
        EditorState.tabSize.of(py ? 4 : 2),
        indentUnit.of(py ? "    " : "  "),
        EditorState.readOnly.of(readOnly),
        EditorView.contentAttributes.of({ "aria-label": label, autocapitalize: "off", autocorrect: "off", spellcheck: "false" }),
        keymap.of([{ key: "Mod-Enter", run }, { key: "Shift-Enter", run }, ...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.updateListener.of((u) => { if (u.docChanged && onChange) onChange(u.state.doc.toString()); }),
      ],
    }),
  });
  const onNarrow = () => (view.dom.isConnected ? view.dispatch({ effects: wrap.reconfigure(wrapping()) }) : narrow.removeEventListener("change", onNarrow));
  if (narrow) narrow.addEventListener("change", onNarrow);
  return {
    view,
    get: () => view.state.doc.toString(),
    set: (text) => view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } }),
  };
}
