// One code highlighter for the whole platform: the build (static code blocks) and the browser (panes
// written at run time) both call it, so a keyword has the same colour everywhere. The classes
// (`t-k` keyword, `t-s` string, `t-n` number or literal, `t-f` function or name, `t-c` comment)
// are painted in styles/prose.css with the same colours as the editor's.
const words = (s) => new Set(s.split(/\s+/));

const LEX = {
  js: {
    comment: /\/\/[^\n]*|\/\*[\s\S]*?\*\//y,
    string: /`(?:\\[\s\S]|[^`\\])*`|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/y,
    kw: words("const let var function return if else for while do break continue switch case default new class extends super this import export from as of in typeof instanceof try catch finally throw async await yield delete void static get set"),
    lit: words("true false null undefined NaN Infinity"),
  },
  python: {
    comment: /#[^\n]*/y,
    string: /(?:[rRbBfFuU]{0,2})(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')/y,
    extra: [[/@[A-Za-z_][\w.]*/y, "f"]],
    kw: words("and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case"),
    lit: words("True False None"),
  },
  bash: {
    dash: true,
    comment: /(?<![^\s;|&(])#[^\n]*/y,
    string: /"(?:\\.|[^"\\])*"|'[^']*'/y,
    extra: [[/\$(?:\{[^}\n]*\}|\(|[A-Za-z_]\w*|[0-9#?@*$!])/y, "n"]],
    kw: words("if then else elif fi for while until do done case esac in function return export local exit break continue"),
    lit: words("true false"),
    commands: true,
  },
  sql: {
    comment: /--[^\n]*|\/\*[\s\S]*?\*\//y,
    string: /'(?:''|[^'])*'/y,
    extra: [[/"(?:""|[^"\n])*"/y, ""]],
    ci: true,
    kw: words(
      "select from where and or not in is null like ilike glob between as on join inner left right full outer cross natural using group by having order asc desc limit offset distinct all union intersect except case when then else end exists with recursive insert into values update set delete create table index unique primary key foreign references drop alter add column default constraint check if begin commit rollback transaction view trigger explain analyze query plan over partition rows range preceding following current row unbounded filter collate escape cast replace returning conflict do nothing autoincrement integer int bigint text real blob numeric varchar boolean timestamp timestamptz jsonb json uuid serial bigserial concurrently include materialized cascade grant revoke vacuum lock for share nowait skip locked"
    ),
    lit: words("true false"),
  },
  yaml: {
    dash: true,
    comment: /(?<![^\s])#[^\n]*/y,
    string: /"(?:\\.|[^"\\\n])*"|'(?:''|[^'\n])*'/y,
    extra: [[/(?<=^[ \t]*(?:- )?)[\w.\-/]+(?=:(?:\s|$))/my, "f"]],
    kw: new Set(),
    lit: words("true false null yes no"),
  },
  dockerfile: {
    dash: true,
    comment: /(?<=^\s*)#[^\n]*/my,
    string: /"(?:\\.|[^"\\\n])*"|'[^'\n]*'/y,
    extra: [[/(?<=^\s*)(?:FROM|RUN|CMD|COPY|ADD|WORKDIR|ENV|ARG|EXPOSE|ENTRYPOINT|USER|LABEL|VOLUME|HEALTHCHECK|SHELL|STOPSIGNAL|ONBUILD)\b/my, "k"], [/\bAS\b/y, "k"], [/\$(?:\{[^}\n]*\}|[A-Za-z_]\w*)/y, "n"]],
    kw: new Set(),
    lit: new Set(),
  },
  nginx: {
    dash: true,
    comment: /#[^\n]*/y,
    string: /"(?:\\.|[^"\\\n])*"|'[^'\n]*'/y,
    extra: [[/(?<=^\s*)[a-z_]+(?=\s)/my, "k"], [/\$[A-Za-z_]\w*/y, "n"]],
    kw: words("server location upstream http events"),
    lit: words("on off"),
  },
  http: {
    dash: true,
    comment: /#[^\n]*/y,
    string: /"(?:\\.|[^"\\\n])*"/y,
    extra: [[/(?<=^)(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/my, "k"], [/(?<=^)HTTP\/[\d.]+/my, "k"], [/(?<=^)[A-Za-z][\w-]*(?=:\s)/my, "f"]],
    kw: new Set(),
    lit: new Set(),
  },
  hcl: {
    dash: true,
    comment: /#[^\n]*|\/\/[^\n]*|\/\*[\s\S]*?\*\//y,
    string: /"(?:\\.|[^"\\\n])*"/y,
    kw: words("resource variable provider module output data locals terraform backend required_providers for in if dynamic"),
    lit: words("true false null"),
  },
};
LEX.javascript = LEX.jsx = LEX.ts = LEX.typescript = LEX.js;
LEX.sh = LEX.shell = LEX.console = LEX.bash;
LEX.py = LEX.python;
LEX.yml = LEX.yaml;
LEX.ini = LEX.nginx;
LEX.terraform = LEX.hcl;

export const lexerFor = (lang) => LEX[String(lang || "").toLowerCase()] || null;

export const escHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const unescHtml = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");

// [text, class] pairs; class is "" for plain text.
export function tokenize(code, lx) {
  const toks = [];
  const NUM = /\b(?:0x[\da-fA-F]+|\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?)\b/y;
  const FN = /[A-Za-z_][\w]*(?=\()/y;
  const WORD = /[A-Za-z_][\w-]*/y;
  const inWord = lx.dash ? /[\w$-]/ : /[\w$]/;
  const inNum = lx.dash ? /[\w.-]/ : /[\w.]/;
  let i = 0, plain = "", cmd = true;
  const push = (t, c) => { if (plain) { toks.push([plain, ""]); plain = ""; } toks.push([t, c]); };
  const at = (re) => { re.lastIndex = i; const m = re.exec(code); return m && m.index === i ? m[0] : null; };
  while (i < code.length) {
    let m;
    if ((m = at(lx.comment))) { push(m, "c"); i += m.length; continue; }
    if ((m = at(lx.string))) { push(m, "s"); i += m.length; cmd = false; continue; }
    let hit = false;
    for (const [re, c] of lx.extra || []) {
      if ((m = at(re))) { push(m, c); i += m.length; hit = true; break; }
    }
    if (hit) { cmd = false; continue; }
    if (/[A-Za-z_]/.test(code[i]) && !inWord.test(code[i - 1] || "")) {
      const fn = at(FN), w = at(lx.commands ? WORD : /[A-Za-z_]\w*/y);
      const k = lx.ci ? w.toLowerCase() : w;
      const member = code[i - 1] === ".";
      if (!member && lx.kw.has(k) && !(lx.ci && fn === w)) push(w, "k");
      else if (!member && lx.lit.has(k)) push(w, "n");
      else if (lx.commands && cmd) push(w, "f");
      else if (fn && fn === w) push(w, "f");
      else plain += w;
      cmd = lx.commands && lx.kw.has(k) && k !== "in";
      i += w.length;
      continue;
    }
    if (/\d/.test(code[i]) && !inNum.test(code[i - 1] || "") && (m = at(NUM))) { push(m, "n"); i += m.length; continue; }
    const ch = code[i];
    if (lx.commands) {
      if (ch === "\n") cmd = !/\\\s*$/.test(code.slice(code.lastIndexOf("\n", i - 1) + 1, i));
      else if ("|;&(`".includes(ch)) cmd = true;
      else if (!/\s/.test(ch)) cmd = false;
    }
    plain += ch;
    i++;
  }
  if (plain) toks.push([plain, ""]);
  return toks;
}

export const span = (t, c) => (c ? `<span class="t-${c}">${escHtml(t)}</span>` : escHtml(t));

// Code as HTML with token spans; a language with no lexer comes back escaped and plain.
export function highlightHtml(code, lang) {
  const lx = lexerFor(lang);
  const text = String(code ?? "");
  return lx ? tokenize(text, lx).map(([t, c]) => span(t, c)).join("") : escHtml(text);
}

// The same, one HTML string per line (tokens that span lines are cut at the line break).
export function highlightLines(code, lang) {
  const lx = lexerFor(lang);
  const text = String(code ?? "").replace(/\n+$/, "");
  const lines = [[]];
  for (const [t, c] of lx ? tokenize(text, lx) : [[text, ""]]) {
    t.split("\n").forEach((part, k) => {
      if (k > 0) lines.push([]);
      if (part) lines[lines.length - 1].push(span(part, c));
    });
  }
  return lines.map((l) => l.join(""));
}
