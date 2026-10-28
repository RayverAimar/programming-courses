// Autocomplete for SQL in the page's language: after FROM/JOIN the tables, after `alias.` that table's
// columns, elsewhere the columns of the tables in the query first, then functions and keywords.
// Tables and columns come from the case files' schema (or the judge's own tables).
import { schemaFor } from "./schema.js";
import API from "../api/sql.json" with { type: "json" };

const W = {
  es: { table: "tabla", column: "columna", fn: "función", kw: "palabra clave", rows: "columnas" },
  en: { table: "table", column: "column", fn: "function", kw: "keyword", rows: "columns" },
};

function info(title, body) {
  return () => {
    const d = document.createElement("div");
    d.className = "cm-ac-info";
    const c = document.createElement("code");
    c.textContent = title;
    d.append(c);
    if (body) { const p = document.createElement("p"); p.textContent = body; d.append(p); }
    return d;
  };
}

// `extra`: the exercise's own tables. They replace the case files' schema when `withSchema` is false
// (a judge, an empty database) and sit beside it when the exercise creates tables on top of it.
export function sqlCatalog(lang, extra = null, withSchema = !extra || !extra.length) {
  const w = W[lang] || W.es;
  const own = (extra || []).map((t) => ({ name: t.name, desc: "", cols: t.cols.map((c) => ({ ...c, desc: "" })) }));
  const tables = withSchema || !own.length ? [...schemaFor(lang).filter((t) => !own.some((o) => o.name.toLowerCase() === t.name.toLowerCase())), ...own] : own;
  const byName = new Map(tables.map((t) => [t.name.toLowerCase(), t]));
  const tableOpts = tables.map((t) => ({ label: t.name, type: "class", detail: w.table, info: info(`${t.name} (${t.cols.map((c) => c.name).join(", ")})`, t.desc), boost: 2 }));
  const colOpt = (t, c, boost = 1) => ({ label: c.name, type: "property", detail: `${t.name} · ${c.type}`, info: info(`${t.name}.${c.name} ${c.type}${c.pk ? " · PK" : ""}${c.fk ? ` → ${c.fk}` : ""}`, c.desc), boost });
  const fnOpts = API.functions.map(([name, sig, es, en]) => ({ label: name, type: "function", detail: w.fn, info: info(sig, lang === "en" ? en : es), apply: name === "cast" ? "CAST(" : `${name}(`, boost: -1 }));
  const kwOpts = API.keywords.map((k) => ({ label: k, type: "keyword", detail: w.kw, boost: -2 }));
  return { tables, byName, tableOpts, colOpt, fnOpts, kwOpts };
}

// Aliases and tables named in the query: FROM personas p, JOIN vehiculos AS v.
function inQuery(text, cat) {
  const out = new Map();
  for (const m of text.matchAll(/\b(?:FROM|JOIN|UPDATE|INTO)\s+([A-Za-z_]\w*)(?:\s+(?:AS\s+)?([A-Za-z_]\w*))?/gi)) {
    const t = cat.byName.get(m[1].toLowerCase());
    if (!t) continue;
    out.set(t.name.toLowerCase(), t);
    if (m[2] && !/^(WHERE|JOIN|ON|LEFT|RIGHT|INNER|FULL|CROSS|GROUP|ORDER|LIMIT|SET|VALUES|USING|NATURAL|HAVING|UNION|EXCEPT|INTERSECT)$/i.test(m[2])) out.set(m[2].toLowerCase(), t);
  }
  for (const m of text.matchAll(/\bWITH\s+(?:RECURSIVE\s+)?([A-Za-z_]\w*)/gi)) out.delete(m[1].toLowerCase());
  return out;
}

export function sqlCompletionSource(cat) {
  return (ctx) => {
    const before = ctx.state.sliceDoc(Math.max(0, ctx.pos - 3000), ctx.pos);
    const clean = before.replace(/--[^\n]*/g, "").replace(/'(?:''|[^'])*'/g, "''");
    if (/'[^']*$/.test(clean.replace(/''/g, ""))) return null;
    const whole = ctx.state.doc.toString();
    const known = inQuery(whole, cat);
    const dot = ctx.matchBefore(/[A-Za-z_]\w*\.\w*$/);
    if (dot) {
      const [head] = dot.text.split(".");
      const t = known.get(head.toLowerCase()) || cat.byName.get(head.toLowerCase());
      if (!t) return null;
      return { from: dot.from + head.length + 1, options: t.cols.map((c) => cat.colOpt(t, c, 3)), validFor: /^\w*$/ };
    }
    const word = ctx.matchBefore(/[A-Za-z_]\w*$/);
    if (!word && !ctx.explicit) return null;
    const upto = clean.slice(0, word ? clean.length - word.text.length : clean.length);
    const lastKw = (upto.match(/\b(FROM|JOIN|INTO|UPDATE|TABLE|SELECT|WHERE|BY|ON|AND|OR|SET|HAVING|VALUES)\s*(?:[A-Za-z_]\w*\s*,\s*)*$/i) || [])[1];
    const from = word ? word.from : ctx.pos;
    if (lastKw && /^(FROM|JOIN|INTO|UPDATE|TABLE)$/i.test(lastKw)) return { from, options: cat.tableOpts, validFor: /^\w*$/ };
    const cols = [];
    const seen = new Set();
    for (const t of new Set(known.values())) for (const c of t.cols) {
      const key = `${t.name}.${c.name}`;
      if (!seen.has(key)) { seen.add(key); cols.push(cat.colOpt(t, c, 2)); }
    }
    return { from, options: [...cols, ...cat.fnOpts, ...cat.kwOpts, ...cat.tableOpts.map((o) => ({ ...o, boost: 0 }))], validFor: /^\w*$/ };
  };
}
