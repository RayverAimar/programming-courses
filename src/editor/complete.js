// Autocomplete and signature help, driven by src/api/*.json and the exercise's environment:
// it suggests exactly what the program will receive, plus JavaScript and the learner's own names.
import { snippetCompletion } from "@codemirror/autocomplete";
import { localCompletionSource } from "@codemirror/lang-javascript";
import { localCompletionSource as pyLocalCompletionSource } from "@codemirror/lang-python";
import { syntaxTree } from "@codemirror/language";
import { StateField, StateEffect } from "@codemirror/state";
import { showTooltip, EditorView } from "@codemirror/view";

const focusFx = StateEffect.define();
import JS from "../api/js.json" with { type: "json" };
import PY from "../api/py.json" with { type: "json" };

const WORDS = {
  es: { keyword: "palabra clave", snippet: "plantilla", given: "te lo da el ejercicio", value: "valor", robot: "el robot", list: "lista", text: "texto", obj: "objeto" },
  en: { keyword: "keyword", snippet: "template", given: "given by the exercise", value: "value", robot: "the robot", list: "list", text: "string", obj: "object" },
};
const SKIP = new Set(["String", "TemplateString", "LineComment", "BlockComment", "RegExp", "Comment", "FormatString"]);

// The catalog of the language being taught: js.json or py.json, same shape.
const enSig = (sig, D) => sig.replace(/[\p{L}]+/gu, (w) => D.sigWordsEn[w] || w);
const row = (r, lang, D = JS) => ({ name: r[0], sig: lang === "en" ? enSig(r[1], D) : r[1], doc: lang === "en" ? r[3] : r[2] });
const params = (sig) => {
  const m = /\(([^]*)\)\s*$/.exec(sig);
  if (!m || !m[1].trim()) return [];
  const out = [];
  let depth = 0, cur = "";
  for (const ch of m[1]) {
    if ("([{".includes(ch)) depth++;
    if (")]}".includes(ch)) depth--;
    if (ch === "," && !depth) { out.push(cur.trim()); cur = ""; } else cur += ch;
  }
  out.push(cur.trim());
  return out;
};

function infoNode(sig, doc) {
  return () => {
    const d = document.createElement("div");
    d.className = "cm-ac-info";
    const c = document.createElement("code");
    c.textContent = sig;
    d.append(c);
    if (doc) {
      const p = document.createElement("p");
      p.textContent = doc;
      d.append(p);
    }
    return d;
  };
}

const memberSig = (base, m) => (m.kind === "property" ? `${base}.${m.name}${m.returns ? `: ${m.returns}` : ""}` : `${base}.${m.name}(${(m.params || []).join(", ")})${m.returns ? ` → ${m.returns}` : ""}`);
const option = (label, type, sig, doc, extra = {}) => ({ label, type, detail: extra.detail, info: infoNode(sig, doc), apply: extra.apply, boost: extra.boost });

export function buildCatalog(env, lang, track = "js") {
  const w = WORDS[lang] || WORDS.es;
  const D = track === "py" ? PY : JS;
  const members = {};
  const top = [];
  const calls = {};
  const add = (name, sig, doc) => { calls[name] = { sig, doc, params: params(sig) }; };

  for (const k of D.keywords) top.push({ label: k, type: "keyword", detail: w.keyword, boost: -2 });
  for (const g of D.globals) {
    const r = row(g, lang, D);
    top.push(option(r.name, r.name[0] === r.name[0].toUpperCase() && !/\(/.test(r.sig) ? "namespace" : "function", r.sig, r.doc, { boost: -1 }));
    if (/\(/.test(r.sig)) add(r.name, r.sig, r.doc);
  }
  for (const [obj, list] of Object.entries(D.statics)) {
    if (track === "py") top.push(option(obj, "namespace", `import ${obj}`, "", { boost: -1 }));
    members[obj] = list.map((x) => {
      const r = row(x, lang, D);
      if (/\(/.test(r.sig)) add(`${obj}.${r.name}`, r.sig, r.doc);
      return option(r.name, /\(/.test(r.sig) ? "method" : "property", r.sig, r.doc);
    });
  }
  const types = {};
  for (const [t, list] of Object.entries(D.types)) {
    types[t] = list.map((x) => {
      const r = row(x, lang, D);
      if (/\(/.test(r.sig) && !calls[`.${r.name}`]) add(`.${r.name}`, r.sig, r.doc);
      return option(r.name, /\(/.test(r.sig) ? "method" : "property", r.sig, r.doc, { detail: w[{ array: "list", string: "text", list: "list", str: "text" }[t]] || t });
    });
  }
  const snippets = D.snippets.map(([label, es, en, des, den]) => {
    const tpl = lang === "en" ? en : es;
    return snippetCompletion(tpl, { label, type: "text", detail: w.snippet, info: infoNode(tpl.replace(/\$\{(\w*)\}/g, "$1").replace(/\t/g, "  "), lang === "en" ? den : des), boost: 1 });
  });

  if (env && env.robot) {
    top.push(option("robot", "variable", "robot", w.robot, { boost: 3 }));
    members.robot = env.robot.map((m) => {
      const sig = memberSig("robot", m);
      if (m.kind !== "property") add(`robot.${m.name}`, sig, m.doc);
      return option(m.name, m.kind === "property" ? "property" : "method", sig, m.doc, { boost: 2 });
    });
  }
  if (env && env.readers) {
    for (const r of env.readers) {
      const sig = `${r.name}() → ${r.returns}`;
      add(r.name, sig, r.doc);
      top.push(option(r.name, "function", sig, r.doc, { boost: 3 }));
    }
  }
  if (env && env.server) {
    top.push(option(env.server.name, "variable", env.server.name, env.server.doc, { boost: 3 }));
    members[env.server.name] = env.server.members.map((m) => {
      const sig = memberSig(env.server.name, m);
      add(`${env.server.name}.${m.name}`, sig, m.doc);
      return option(m.name, "method", sig, m.doc, { boost: 2 });
    });
  }
  for (const h of (env && env.helpers) || []) {
    if (h.kind === "method") add(h.name, h.sig, h.doc);
    top.push(option(h.name, h.kind === "method" ? "function" : "variable", h.sig, h.doc || w.given, { boost: 3 }));
  }
  const globals = (env && env.globals) || {};
  for (const [name, shape] of Object.entries(globals)) top.push(option(name, "variable", name, `${w.given} (${describe(shape, w)})`, { boost: 3 }));

  const fallback = track === "py" ? [types.list, types.str, types.dict] : [types.array, types.string];
  return { top, members, types, globals, calls, snippets, w, track, fallback };
}

function describe(shape, w) {
  if (!shape) return w.value;
  if (shape.t === "array") return w.list;
  if (shape.t === "string") return w.text;
  if (shape.t === "object") return `${w.obj} { ${Object.keys(shape.keys).join(", ")} }`;
  return shape.t;
}

function inCode(ctx) {
  let n = syntaxTree(ctx.state).resolveInner(ctx.pos, -1);
  for (; n; n = n.parent) if (SKIP.has(n.name)) return false;
  return true;
}

// The same for Python: `x = [`, `x = "…"`, `x = {…}`, `x = set(`.
function pyLocalShape(doc, name) {
  const m = new RegExp(`^\\s*${name}\\s*(?::[^=\\n]*)?=\\s*([^\\n]*)`, "m").exec(doc);
  if (!m) return null;
  const v = m[1].trim();
  if (/^\[|^list\(|\.split\(|^sorted\(|\.splitlines\(/.test(v)) return { t: "list" };
  if (/^[rbfu]?["']|\.join\(|\.strip\(|\.upper\(|\.lower\(|^str\(|^input\(/.test(v)) return { t: "str" };
  if (/^set\(|^\{[^:}]*\}$/.test(v) && !/^\{\}$/.test(v)) return { t: "set" };
  if (/^\{|^dict\(|defaultdict\(|Counter\(/.test(v)) return { t: "dict" };
  return null;
}

// What a local name holds, when its declaration makes it obvious.
function localShape(doc, name) {
  const esc = name.replace(/\$/g, "\\$");
  const m = new RegExp(`(?:const|let|var)\\s+${esc}\\s*=\\s*([^\\n;]*)`).exec(doc);
  if (!m) return null;
  const v = m[1].trim();
  if (/^\[|\.split\(|\.map\(|\.filter\(|Array\.from|Object\.(keys|values|entries)\(|\.toSorted\(/.test(v)) return { t: "array" };
  if (/^["'`]|\.join\(|\.trim\(|\.toUpperCase\(|\.toLowerCase\(|\.slice\(.*["'`]/.test(v)) return { t: "string" };
  if (/^new Map\b/.test(v)) return { t: "map" };
  if (/^new Set\b/.test(v)) return { t: "set" };
  if (/^new Promise\b|\.then\(/.test(v)) return { t: "promise" };
  if (/^\{/.test(v)) {
    const keys = {};
    const body = doc.slice(m.index + m[0].indexOf("{"));
    let depth = 0, end = 0;
    for (; end < body.length; end++) {
      if (body[end] === "{") depth++;
      if (body[end] === "}" && --depth === 0) break;
    }
    for (const k of body.slice(1, end).matchAll(/(?:^|[,{\s])([A-Za-z_$][\w$]*)\s*(?=[:,}\n])/g)) keys[k[1]] = null;
    return { t: "object", keys };
  }
  return null;
}

function walk(shape, path) {
  for (const p of path) {
    if (!shape) return null;
    if (shape.t === "object") shape = shape.keys[p] ?? null;
    else if (shape.t === "array" && /^\d+$/.test(p)) shape = shape.item;
    else return null;
  }
  return shape;
}

export function completionSource(cat) {
  const dedupe = (lists) => {
    const seen = new Set();
    return lists.flat().filter((o) => (seen.has(o.label) ? false : seen.add(o.label)));
  };
  const objectKeys = (shape) => Object.keys(shape.keys).map((k) => ({ label: k, type: "property", boost: 2 }));
  return (ctx) => {
    if (!inCode(ctx)) return null;
    const member = ctx.matchBefore(/[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\[\d+\])*\.[\w$]*$/);
    if (member) {
      const dot = member.text.lastIndexOf(".");
      const chain = member.text.slice(0, dot).replace(/\[(\d+)\]/g, ".$1").split(".");
      const from = member.from + dot + 1;
      const [head, ...rest] = chain;
      let options = null;
      if (!rest.length && cat.members[head]) options = cat.members[head];
      else if (head in cat.globals) {
        const s = walk(cat.globals[head], rest);
        options = s && s.t === "object" ? objectKeys(s) : s && cat.types[s.t] ? cat.types[s.t] : null;
      } else if (!rest.length) {
        const s = (cat.track === "py" ? pyLocalShape : localShape)(ctx.state.doc.toString(), head);
        if (s && s.t === "object") options = objectKeys(s);
        else if (s && cat.types[s.t]) options = cat.types[s.t];
      }
      if (!options && head !== "robot" && !cat.members[head]) options = dedupe(cat.fallback);
      return options && options.length ? { from, options, validFor: /^[\w$]*$/ } : null;
    }
    const word = ctx.matchBefore(/[A-Za-z_$][\w$]*$/);
    if (!word && !ctx.explicit) return null;
    const before = ctx.state.sliceDoc(Math.max(0, (word ? word.from : ctx.pos) - 1), word ? word.from : ctx.pos);
    if (before === ".") return null;
    return { from: word ? word.from : ctx.pos, options: [...cat.top, ...cat.snippets], validFor: /^[\w$]*$/ };
  };
}

export function localSource(ctx) {
  return inCode(ctx) ? localCompletionSource(ctx) : null;
}

export function pyLocalSource(ctx) {
  return inCode(ctx) ? pyLocalCompletionSource(ctx) : null;
}

// Signature help: inside a call's parentheses, the signature with the current argument in bold.
function callAt(state, pos, cat) {
  const text = state.sliceDoc(Math.max(0, pos - 400), pos);
  let depth = 0, commas = 0, quote = null;
  for (let i = text.length - 1; i >= 0; i--) {
    const c = text[i];
    if (quote) { if (c === quote && text[i - 1] !== "\\") quote = null; continue; }
    if (c === '"' || c === "'" || c === "`") { quote = c; continue; }
    if (c === ")" || c === "]" || c === "}") depth++;
    else if (c === "[" || c === "{") { if (!depth) return null; depth--; }
    else if (c === "(") {
      if (depth) { depth--; continue; }
      const name = /([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*$/.exec(text.slice(0, i));
      if (!name) return null;
      const full = name[1];
      const hit = cat.calls[full] || (full.includes(".") ? cat.calls[full.slice(full.lastIndexOf("."))] : null);
      if (!hit) return null;
      return { at: pos - (text.length - i), hit, arg: commas };
    } else if (c === "," && !depth) commas++;
    else if (c === ";" && !depth) return null;
  }
  return null;
}

export function signatureHelp(cat) {
  const make = (state) => {
    const sel = state.selection.main;
    if (!sel.empty) return null;
    const line = state.doc.lineAt(sel.head);
    const c = callAt(state, sel.head, cat);
    if (!c || c.at < line.from - 200) return null;
    return {
      pos: c.at,
      above: true,
      strictSide: true,
      arrow: false,
      create: () => {
        const dom = document.createElement("div");
        dom.className = "cm-sig";
        const code = document.createElement("code");
        const ps = c.hit.params;
        const sig = c.hit.sig;
        if (!ps.length) code.textContent = sig;
        else {
          const open = sig.indexOf("(");
          code.append(sig.slice(0, open + 1));
          ps.forEach((p, i) => {
            if (i) code.append(", ");
            const s = document.createElement(i === Math.min(c.arg, ps.length - 1) ? "b" : "span");
            s.textContent = p;
            code.append(s);
          });
          code.append(sig.slice(sig.lastIndexOf(")")));
        }
        dom.append(code);
        if (c.hit.doc) {
          const p = document.createElement("p");
          p.textContent = c.hit.doc;
          dom.append(p);
        }
        return { dom };
      },
    };
  };
  const field = StateField.define({
    create: () => ({ focused: false, tip: null }),
    update: (v, tr) => {
      let focused = v.focused;
      for (const e of tr.effects) if (e.is(focusFx)) focused = e.value;
      if (!focused) return { focused, tip: null };
      return { focused, tip: tr.docChanged || tr.selection || focused !== v.focused ? make(tr.state) : v.tip };
    },
    provide: (f) => showTooltip.from(f, (v) => v.tip),
  });
  return [field, EditorView.focusChangeEffect.of((_s, focusing) => focusFx.of(focusing))];
}
