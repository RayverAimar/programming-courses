// SQL at build time: sql.js in Node with the same world and engine the page uses. It computes what a
// visual can't compute in the page without the database: a query's result, its plan, and the row set
// after each step of the run order (FROM → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT).
import { createRequire } from "node:module";
import { makeRunner, worldMaker, execAll, buildJudgeCases, judgeOne } from "../../src/sql/engine.js";

const require = createRequire(import.meta.url);
let SQL = null, world = null, runner = null;
export async function sqlHost() {
  if (!SQL) {
    SQL = await require("sql.js")();
    world = worldMaker(SQL);
    runner = makeRunner(SQL, world);
  }
  return { SQL, world, runner, execAll: (db, code, keep) => execAll(SQL, db, code, keep), buildCases: (ex, lang) => buildJudgeCases(SQL, ex, lang), judge: (code, c, spec, lang) => judgeOne(SQL, code, c, spec, lang) };
}

const type = (vals) => (vals.every((v) => v === null || Number.isInteger(v)) ? "INTEGER" : vals.every((v) => v === null || typeof v === "number") ? "REAL" : "TEXT");
export function inlineDb(tables) {
  const db = new SQL.Database();
  for (const [name, t] of Object.entries(tables)) {
    db.exec(`CREATE TABLE ${name} (${t.cols.map((c, i) => `${c} ${type(t.rows.map((r) => r[i]))}`).join(", ")})`);
    if (!t.rows.length) continue;
    const st = db.prepare(`INSERT INTO ${name} VALUES (${t.cols.map(() => "?").join(", ")})`);
    for (const r of t.rows) st.run(r);
    st.free();
  }
  return db;
}

// The database a visual's query runs on: its inline tables, or the world; then its setup.
function dbFor(spec, lang) {
  const db = spec.tables ? inlineDb(spec.tables) : new SQL.Database(world(lang));
  if (spec.setup) db.exec(spec.setup);
  return db;
}
const last = (out) => [...out.results].reverse().find((r) => r.cols) || null;
function run(db, sql, where, keep = 200) {
  const out = execAll(SQL, db, sql, keep);
  if (out.error) throw new Error(`${where}: ${out.error.message}\n  in: ${sql}`);
  return last(out);
}

export async function resultOf(spec, lang, where) {
  await sqlHost();
  const db = dbFor(spec, lang);
  try {
    const r = run(db, spec.query, where, spec.max || 200);
    return { cols: r.cols, rows: r.rows, kinds: r.kinds, total: r.total };
  } finally { db.close(); }
}

export async function planOf(spec, lang, where) {
  await sqlHost();
  const db = dbFor(spec, lang);
  try { return run(db, `EXPLAIN QUERY PLAN ${spec.query}`, where).rows; } finally { db.close(); }
}

// Top-level clauses of a single SELECT, in the order they're written.
export function clauses(q) {
  const re = /\b(SELECT(?:\s+DISTINCT)?|FROM|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT)\b/gi;
  const marks = [];
  let depth = 0, quote = null;
  for (let i = 0; i < q.length; i++) {
    const c = q[i];
    if (quote) { if (c === quote) quote = null; continue; }
    if (c === "'" || c === '"') { quote = c; continue; }
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (!depth && /[A-Za-z]/.test(c) && (i === 0 || !/\w/.test(q[i - 1]))) {
      re.lastIndex = i;
      const m = re.exec(q);
      if (m && m.index === i) { marks.push({ at: i, kw: m[1].toUpperCase().replace(/\s+/g, " ") }); i += m[0].length - 1; }
    }
  }
  const key = (kw) => ({ SELECT: "select", "SELECT DISTINCT": "select", FROM: "from", WHERE: "where", "GROUP BY": "group", HAVING: "having", "ORDER BY": "order", LIMIT: "limit" })[kw];
  return marks.map((m, i) => ({ key: key(m.kw), kw: m.kw, text: q.slice(m.at, i + 1 < marks.length ? marks[i + 1].at : q.length).trim().replace(/;$/, ""), body: q.slice(m.at + m.kw.length, i + 1 < marks.length ? marks[i + 1].at : q.length).trim().replace(/;$/, "") }));
}

export async function orderStages(spec, lang, where) {
  await sqlHost();
  const q = String(spec.query).trim().replace(/;\s*$/, "");
  const parts = clauses(q);
  const get = (k) => parts.find((p) => p.key === k);
  const sel = get("select"), from = get("from"), wh = get("where"), gb = get("group"), hv = get("having"), ob = get("order"), lim = get("limit");
  if (!sel || !from) throw new Error(`${where}: an order animation needs a SELECT … FROM query`);
  const distinct = /^SELECT\s+DISTINCT/i.test(sel.text);
  const W = wh ? ` WHERE ${wh.body}` : "";
  const G = gb ? ` GROUP BY ${gb.body}` : "";
  const H = hv ? ` HAVING ${hv.body}` : "";
  const db = dbFor(spec, lang);
  const stages = [];
  const strip = (r, n) => ({ cols: r.cols.slice(0, n), rows: r.rows.map((x) => x.slice(0, n)), kinds: r.kinds && r.kinds.map((k) => k && k.slice(0, n)) });
  try {
    const all = run(db, `SELECT * FROM ${from.body}`, where);
    const n = all.cols.length;
    stages.push({ key: "from", ...strip(all, n) });
    let base = all;
    if (wh) {
      const r = run(db, `SELECT *, CASE WHEN (${wh.body}) THEN 1 ELSE 0 END FROM ${from.body}`, where);
      stages.push({ key: "where", ...strip(r, n), keep: r.rows.map((x) => x[n] === 1) });
      base = run(db, `SELECT * FROM ${from.body}${W}`, where);
    }
    if (gb) {
      const r = run(db, `SELECT *, json_array(${gb.body}) FROM ${from.body}${W} ORDER BY ${gb.body}`, where);
      const keys = [];
      const group = r.rows.map((x) => { const k = x[n]; if (!keys.includes(k)) keys.push(k); return keys.indexOf(k); });
      stages.push({ key: "group", ...strip(r, n), group });
    }
    if (hv) {
      const aggs = [...new Set((hv.body.match(/\b(?:COUNT|SUM|AVG|MIN|MAX|TOTAL|GROUP_CONCAT)\s*\([^()]*\)/gi) || []))];
      const r = run(db, `SELECT ${gb.body}${aggs.length ? `, ${aggs.join(", ")}` : ""}, CASE WHEN (${hv.body}) THEN 1 ELSE 0 END FROM ${from.body}${W}${G} ORDER BY ${gb.body}`, where);
      const m = r.cols.length - 1;
      stages.push({ key: "having", ...strip(r, m), keep: r.rows.map((x) => x[m] === 1), group: r.rows.map((_, i) => i) });
    }
    const plainSel = sel.body.replace(/^DISTINCT\s+/i, "");
    const s = run(db, `SELECT ${plainSel} FROM ${from.body}${W}${G}${H}`, where);
    stages.push({ key: "select", cols: s.cols, rows: s.rows, kinds: s.kinds });
    if (distinct) {
      const seen = new Set();
      stages.push({ key: "distinct", cols: s.cols, rows: s.rows, kinds: s.kinds, keep: s.rows.map((x) => { const k = JSON.stringify(x); if (seen.has(k)) return false; seen.add(k); return true; }) });
    }
    if (ob) {
      const o = run(db, `SELECT ${sel.body} FROM ${from.body}${W}${G}${H} ORDER BY ${ob.body}`, where);
      stages.push({ key: "order", cols: o.cols, rows: o.rows, kinds: o.kinds });
    }
    if (lim) {
      const pre = run(db, `SELECT ${sel.body} FROM ${from.body}${W}${G}${H}${ob ? ` ORDER BY ${ob.body}` : ""}`, where);
      const m = /^(\d+)(?:\s*(?:OFFSET\s+(\d+)|,\s*(\d+)))?$/i.exec(lim.body.trim());
      const [count, off] = m ? (m[3] ? [Number(m[3]), Number(m[1])] : [Number(m[1]), Number(m[2] || 0)]) : [pre.rows.length, 0];
      stages.push({ key: "limit", cols: pre.cols, rows: pre.rows, kinds: pre.kinds, keep: pre.rows.map((_, i) => i >= off && i < off + count) });
    }
    const final = run(db, q, where);
    const shown = stages[stages.length - 1];
    const kept = shown.keep ? shown.rows.filter((_, i) => shown.keep[i]) : shown.rows;
    if (JSON.stringify(kept) !== JSON.stringify(final.rows)) throw new Error(`${where}: the order animation's last stage doesn't match the query's result`);
  } finally { db.close(); }
  const order = ["select", "from", "where", "group", "having", "order", "limit"];
  return { parts: parts.map((p) => ({ key: p.key, text: p.text })).sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key)), stages };
}

// A correlated subquery, row by row: the outer rows, the inner query run once per row with that row's
// values (`:col` placeholders) and whether the row stays (`keep`, an SQL expression over `:col` and
// `:sub`). The rows kept must be the result of `query`, unless it's a `sketch` (a query with gaps).
export async function correlatedSteps(spec, lang, where) {
  await sqlHost();
  const db = dbFor(spec, lang);
  try {
    const outer = run(db, spec.outer, where);
    const bind = (row) => Object.fromEntries(outer.cols.map((c, i) => [`:${c}`, row[i]]));
    const one = (sql, params) => {
      const st = db.prepare(sql);
      try { st.bind(params); return st.step() ? st.get()[0] : null; } catch (e) { throw new Error(`${where}: ${e.message}\n  in: ${sql}`); } finally { st.free(); }
    };
    const subs = outer.rows.map((r) => one(spec.inner, bind(r)));
    const keep = outer.rows.map((r, i) => !!one(`SELECT ${spec.keep}`, { ...bind(r), ":sub": subs[i] }));
    if (spec.query && !spec.sketch) {
      const final = run(db, spec.query, where);
      const kept = outer.rows.filter((_, i) => keep[i]);
      const key = (rows) => JSON.stringify(rows.map((r) => r.slice(0, final.cols.length)));
      if (key(kept) !== key(final.rows)) throw new Error(`${where}: the correlated diagram keeps other rows than the query returns`);
    }
    return { cols: outer.cols, rows: outer.rows, kinds: outer.kinds, subs, kept: keep };
  } finally { db.close(); }
}

// A chain of named steps (WITH): what each CTE holds, then the final result.
export async function cteSteps(spec, lang, where) {
  await sqlHost();
  const db = dbFor(spec, lang);
  try {
    const defs = spec.steps.map((s) => `${s.name} AS (\n${s.sql.trim().replace(/^/gm, "  ")}\n)`);
    const query = `WITH ${defs.join(",\n")}\n${spec.final.trim()}`;
    const shown = spec.show || 6;
    const pick = (r) => ({ cols: r.cols, rows: r.rows.slice(0, shown), kinds: r.kinds && r.kinds.slice(0, shown), total: r.total ?? r.rows.length });
    const steps = spec.steps.map((s, i) => ({ name: s.name, sql: s.sql.trim(), ...pick(run(db, `WITH ${defs.slice(0, i + 1).join(",\n")}\nSELECT * FROM ${s.name}`, where)) }));
    steps.push({ name: null, sql: spec.final.trim(), ...pick(run(db, query, where)) });
    return { query, steps };
  } finally { db.close(); }
}

// Two lists for the set operations: the first column of each query (or inline values).
export async function setLists(spec, lang, where) {
  await sqlHost();
  const db = dbFor(spec, lang);
  try {
    const side = (s) => (s.rows ? s : { ...s, rows: run(db, s.query, where).rows.map((r) => r[0]) });
    return { a: side(spec.a), b: side(spec.b) };
  } finally { db.close(); }
}

// Statements that change data, one by one: each shown table before and after (rows keyed by rowid),
// what RETURNING gave back, or the error that undid the statement. Runs on its own `setup` (or the
// world with `world: true`, then `show` names the tables).
export async function changeSteps(spec, lang, where) {
  await sqlHost();
  const db = spec.world ? new SQL.Database(world(lang)) : new SQL.Database();
  try {
    if (spec.setup) db.exec(spec.setup);
    const names = spec.show || run(db, "SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid", where).rows.map((r) => r[0]);
    const snap = () => Object.fromEntries(names.filter((n) => run(db, `SELECT count(*) FROM sqlite_schema WHERE type = 'table' AND name = '${n}'`, where).rows[0][0]).map((n) => {
      const r = run(db, `SELECT rowid AS __r, * FROM ${n} ORDER BY rowid`, where, spec.max || 40);
      return [n, { cols: r.cols.slice(1), ids: r.rows.map((x) => x[0]), rows: r.rows.map((x) => x.slice(1)), kinds: r.kinds && r.kinds.map((k) => k && k.slice(1)) }];
    }));
    const steps = [];
    let before = snap();
    for (const st of db.iterateStatements(String(spec.sql))) {
      const sql = st.getSQL().trim();
      let ret = null, error = null;
      try {
        const cols = st.getColumnNames(), rows = [];
        while (st.step()) rows.push(st.get());
        if (cols.length) ret = { cols, rows };
      } catch (e) { error = String(e.message || e); }
      const after = snap();
      steps.push({ sql, after, ret, error });
      before = after;
    }
    if (!steps.length) throw new Error(`${where}: a change diagram needs at least one statement in sql`);
    if (steps.some((s) => s.error) && !spec.expectError) throw new Error(`${where}: a statement fails (${steps.find((s) => s.error).error}); add expectError: true if that's the point`);
    return { start: snapStart(spec, lang), steps };
  } finally { db.close(); }
}
function snapStart(spec, lang) {
  const db = spec.world ? new SQL.Database(world(lang)) : new SQL.Database();
  try {
    if (spec.setup) db.exec(spec.setup);
    const names = spec.show || [...db.exec("SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid")[0]?.values || []].map((r) => r[0]);
    return Object.fromEntries(names.map((n) => {
      const r = execAll(SQL, db, `SELECT rowid AS __r, * FROM ${n} ORDER BY rowid`, spec.max || 40).results[0];
      return [n, r ? { cols: r.cols.slice(1), ids: r.rows.map((x) => x[0]), rows: r.rows.map((x) => x.slice(1)), kinds: r.kinds && r.kinds.map((k) => k && k.slice(1)) } : { cols: [], ids: [], rows: [] }];
    }));
  } finally { db.close(); }
}

// Tables as SQLite understands a CREATE script: columns, types, primary and foreign keys. For ER
// diagrams of tables that aren't in the world, and an exercise's own tables in the Schema tab.
export async function defsOf(schema, where = "schema") {
  await sqlHost();
  const db = new SQL.Database();
  try {
    try { db.exec(String(schema)); } catch (e) { throw new Error(`${where}: ${e.message}`); }
    const names = (db.exec("SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid")[0]?.values || []).map((r) => r[0]);
    return names.map((name) => {
      const info = db.exec(`SELECT name, type, pk FROM pragma_table_info('${name}')`)[0]?.values || [];
      const fks = new Map((db.exec(`SELECT "from", "table" FROM pragma_foreign_key_list('${name}')`)[0]?.values || []).map(([c, tb]) => [c, tb]));
      return { name, desc: "", cols: info.map(([c, type, pk]) => ({ name: c, type: type || "", desc: "", pk: pk > 0, fk: fks.get(c) || null })) };
    });
  } finally { db.close(); }
}
