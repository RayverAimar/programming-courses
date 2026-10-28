// Runs SQL for the course: the learner's statements one by one with their results (types kept, so
// REAL prints like SQLite prints it), the tests of an exercise, the judge's cases, and SQLite's errors
// explained in plain words. Shared by the page's worker, the build and verify.mjs. See docs/sql.md.
import { TABLES, tableName, colName, tablesIn } from "./schema.js";
import { fillWorld, rng } from "./world.js";
import { sqlMessages } from "./messages.js";
import { cellText, rowText, asText } from "./format.js";

export { sqlMessages, cellText, rowText, asText };

export const KEEP_ROWS = 2000;


// ── Column types: sql.js hides them, SQLite knows them ─────────────────────
const KIND = { 1: "i", 2: "r", 3: "t", 4: "b", 5: "n" };
function typeReader(SQL) {
  if (SQL.__kinds !== undefined) return SQL.__kinds;
  SQL.__kinds = null;
  if (typeof SQL._sqlite3_column_type !== "function") return null;
  const db = new SQL.Database();
  try {
    const st = db.prepare("SELECT 1.5, 2, 'x'");
    st.step();
    for (const k of Object.keys(st)) {
      const p = st[k];
      if (typeof p !== "number" || p <= 0) continue;
      try {
        if (SQL._sqlite3_column_type(p, 0) === 2 && SQL._sqlite3_column_type(p, 1) === 1 && SQL._sqlite3_column_type(p, 2) === 3) {
          SQL.__kinds = (stmt, n) => { const out = new Array(n); for (let i = 0; i < n; i++) out[i] = KIND[SQL._sqlite3_column_type(stmt[k], i)] || "t"; return out.join(""); };
          break;
        }
      } catch (_) { /* not the statement pointer */ }
    }
    st.free();
  } finally {
    db.close();
  }
  return SQL.__kinds;
}

// ── Running code statement by statement ────────────────────────────────────
const lineAt = (code, idx) => code.slice(0, Math.max(0, idx)).split("\n").length;
export const stripComments = (code) => String(code).replace(/\/\*[\s\S]*?\*\//g, " ").replace(/--[^\n]*/g, "");

export function execAll(SQL, db, code, keep = KEEP_ROWS) {
  const kinds = typeReader(SQL);
  const results = [];
  let at = 0;
  let n = 0;
  let start = -1;
  try {
    for (const st of db.iterateStatements(code)) {
      n++;
      const sql = st.getSQL();
      const found = code.indexOf(sql.trim().slice(0, 40), at);
      start = found >= 0 ? found : at;
      const line = lineAt(code, start);
      const cols = st.getColumnNames();
      if (!cols.length) {
        while (st.step()) { /* a statement with no columns */ }
        results.push({ sql, line, changes: db.getRowsModified() });
      } else {
        const rows = [], ks = [];
        let total = 0;
        while (st.step()) {
          total++;
          if (rows.length < keep) { rows.push(st.get()); ks.push(kinds ? kinds(st, cols.length) : null); }
        }
        results.push({ sql, line, cols, rows, kinds: kinds ? ks : null, total, plan: /^\s*EXPLAIN\s+QUERY\s+PLAN\b/i.test(sql) });
      }
      at = start + sql.trim().length;
      start = -1;
    }
    return { results };
  } catch (e) {
    let offset = start;
    if (offset < 0) { n++; const rest = code.slice(at); offset = at + (rest.length - rest.replace(/^(\s|;|--[^\n]*\n)*/, "").length); }
    return { results, error: { message: String(e.message || e), statement: n || 1, line: lineAt(code, offset) } };
  }
}

const lastTable = (results) => [...results].reverse().find((r) => r.cols && !r.plan) || null;

// ── Errors in plain words ──────────────────────────────────────────────────
function closest(word, options) {
  const d = (a, b) => {
    a = a.toLowerCase(); b = b.toLowerCase();
    const m = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) m[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return m[a.length][b.length];
  };
  let best = null, score = Infinity;
  for (const o of options) { const s = d(word, o); if (s < score) { score = s; best = o; } }
  return best && score <= Math.max(2, Math.floor(word.length / 3)) ? best : null;
}
const OTHER_DIALECTS = { len: "length()", isnull: "ifnull()", nvl: "coalesce()", now: "datetime('now')", getdate: "datetime('now')", curdate: "date('now')", datediff: "julianday(a) - julianday(b)", date_format: "strftime()", to_char: "strftime()", substring_index: "substr() + instr()", charindex: "instr()", locate: "instr()", rand: "random()", ceiling: "ceil()", year: "strftime('%Y', …)", month: "strftime('%m', …)", day: "strftime('%d', …)" };

export function explain(error, code, lang, worldLang = lang) {
  const t = sqlMessages(lang);
  const m = error.message;
  const where = t.statement(error.statement, error.line);
  const names = TABLES.map((x) => tableName(x, worldLang));
  let text = null, g;
  if (/interrupted|timeout/i.test(m)) return t.timeout;
  if ((g = /no such table: (?:main\.)?(\S+)/.exec(m))) {
    const near = closest(g[1], names);
    text = t.noTable(g[1]) + (near ? t.didYouMean(near) : t.seeSchema);
  } else if ((g = /no such column: (\S+)/.exec(m))) {
    const col = g[1].split(".").pop();
    const used = tablesIn(code, worldLang).map((n) => TABLES.find((x) => tableName(x, worldLang) === n));
    const near = closest(col, (used.length ? used : TABLES).flatMap((x) => x.cols.map((c) => colName(c, worldLang))));
    text = t.noColumn(g[1]) + (near && near !== col ? t.didYouMean(near) : t.seeSchema);
  } else if (/incomplete input/.test(m)) text = t.incomplete;
  else if ((g = /near "([^"]*)": syntax error/.exec(m))) text = g[1] === "___" || /___/.test(code) ? t.gaps : t.syntax(g[1]);
  else if ((g = /ambiguous column name: (\S+)/.exec(m))) text = t.ambiguous(g[1]);
  else if ((g = /misuse of aggregate(?: function)?:? (\w+)/.exec(m))) text = t.aggregate(`${g[1]}()`);
  else if ((g = /misuse of (?:aliased )?window function:? ([\w()]+)/.exec(m))) text = t.window(g[1]);
  else if (/GROUP BY clause is required before HAVING/.test(m)) text = t.having;
  else if ((g = /no such function: (\w+)/.exec(m))) text = t.noFunction(g[1], OTHER_DIALECTS[g[1].toLowerCase()]);
  else if ((g = /wrong number of arguments to function (\w+)/.exec(m))) text = t.args(g[1]);
  else if ((g = /UNIQUE constraint failed: (\S+)/.exec(m))) text = t.unique(g[1]);
  else if ((g = /NOT NULL constraint failed: (\S+)/.exec(m))) text = t.notNull(g[1]);
  else if (/FOREIGN KEY constraint failed/.test(m)) text = t.foreign;
  else if ((g = /CHECK constraint failed: (.+)/.exec(m))) text = t.check(g[1]);
  else if ((g = /table (\S+) already exists/.exec(m))) text = t.exists(g[1]);
  else if ((g = /ORDER BY term out of range - should be between 1 and (\d+)/.exec(m))) text = t.orderRange(g[1]);
  else if ((g = /sub-select returns (\d+) columns/.exec(m))) text = t.subselect(g[1]);
  else if (/not authorized/.test(m)) text = t.readonly;
  return where + (text ? text + t.sqlite(m) : m);
}

// ── Comparing results ──────────────────────────────────────────────────────
const norm = (v) => (v instanceof Uint8Array ? `x${[...v].join(",")}` : typeof v === "number" ? Math.round(v * 1e9) / 1e9 : v);
const rowKey = (r) => JSON.stringify(r.map(norm));

export function compareRows(got, want, { ordered = false, names = false, hide = false } = {}, lang = "es") {
  const t = sqlMessages(lang);
  if (!got) return t.noResult;
  if (got.cols.length !== want.cols.length) return t.cols(got.cols.length, want.cols.length);
  if (names && got.cols.map((c) => c.toLowerCase()).join("\u0000") !== want.cols.map((c) => c.toLowerCase()).join("\u0000")) return t.names(got.cols.join(", "), want.cols.join(", "));
  const g = got.rows.map(rowKey), w = want.rows.map(rowKey);
  const show = (res, i) => `\`${rowText(res.rows[i], res.kinds && res.kinds[i])}\``;
  const count = (list) => list.reduce((m, k) => m.set(k, (m.get(k) || 0) + 1), new Map());
  const cg = count(g), cw = count(w);
  const miss = w.findIndex((k) => (cg.get(k) || 0) < cw.get(k));
  const extra = g.findIndex((k) => (cw.get(k) || 0) < cg.get(k));
  const n = got.total ?? g.length;
  if (hide) {
    const wrong = extra >= 0 ? " " + t.hiddenExtra(show(got, extra), offColumns(got, extra, want, cw, cg)) : "";
    if (n !== want.rows.length) return t.hiddenCount(n, n > want.rows.length) + wrong;
    if (miss >= 0) return (wrong || " " + t.hiddenMissing).trim();
    if (ordered && g.join("\n") !== w.join("\n")) return t.order;
    return null;
  }
  if (n !== want.rows.length) return t.rowsCount(n, want.rows.length) + (miss >= 0 ? " " + t.missing(show(want, miss)) : extra >= 0 ? " " + t.extra(show(got, extra)) : "");
  if (miss >= 0) return t.missing(show(want, miss)) + (extra >= 0 ? " " + t.extra(show(got, extra)) : "");
  if (ordered && g.join("\n") !== w.join("\n")) return t.order;
  return null;
}

// For a learner's row that isn't expected: the columns where it differs from the closest expected
// row still missing, named by the learner's own headers, so nothing expected is shown.
function offColumns(got, i, want, cw, cg) {
  const row = got.rows[i].map(norm);
  let best = null, score = 0;
  for (const r of want.rows) {
    const k = rowKey(r);
    if ((cg.get(k) || 0) >= cw.get(k)) continue;
    const same = r.reduce((s, v, j) => s + (norm(v) === row[j] ? 1 : 0), 0);
    if (same > score) { score = same; best = r; }
  }
  return best && score > 0 ? best.map((v, j) => (norm(v) === row[j] ? null : got.cols[j])).filter((c) => c !== null) : [];
}

const sameValue = (a, b) => (typeof a === "number" && typeof b === "number" ? Math.abs(a - b) < 1e-9 : a === b || (a === null && b === undefined));

// ── An exercise run ────────────────────────────────────────────────────────
// `base(ex, scenario)` gives the database the code starts from: the world, or an empty one; then
// the exercise's and the scenario's `setup` run on it.
export function makeRunner(SQL, worldBytes) {
  const fresh = (ex, scn, lang) => {
    const db = (scn && scn.db) === "empty" || ex.db === "empty" ? new SQL.Database() : new SQL.Database(worldBytes(lang));
    for (const s of [ex.setup, scn && scn.setup]) if (s) db.exec(s);
    return db;
  };

  const RESULT_CHECKS = ["same", "value", "rows", "columns", "output", "outputIncludes"];
  const isResultCheck = (test) => RESULT_CHECKS.some((k) => test[k] !== undefined);

  function runTest(test, ctx, lang) {
    const t = sqlMessages(lang);
    const { out, db, ex, scn, code, last, hide, wants } = ctx;
    const src = stripComments(code);
    try {
      if (test.source !== undefined) return new RegExp(test.source, "i").test(src) ? null : test.msg || t.source;
      if (test.sourceNot !== undefined) return new RegExp(test.sourceNot, "i").test(src) ? test.msg || t.sourceNot : null;
      if (out.error) return t.crashed;
      if (test.same !== undefined) {
        if (!wants.has(test)) {
          const ref = fresh(ex, scn, lang);
          try { wants.set(test, lastTable(execAll(SQL, ref, test.same, Infinity).results)); } finally { ref.close(); }
        }
        return compareRows(last, wants.get(test), { ordered: !!test.ordered, names: !!test.names, hide }, lang);
      }
      if (test.value !== undefined) {
        if (!last) return t.noResult;
        if (last.cols.length !== 1 || last.total !== 1) return t.oneCell(last.total, last.cols.length);
        const v = last.rows[0][0];
        const got = cellText(v, last.kinds && last.kinds[0][0]);
        return sameValue(v, test.value) ? null : hide ? t.hiddenValue(got) : t.value(got, cellText(test.value));
      }
      if (test.rows !== undefined) return last && last.total === test.rows ? null : !last ? t.noResult : hide ? t.hiddenCount(last.total, last.total > test.rows) : t.rowsCount(last.total, test.rows);
      if (test.columns !== undefined) {
        if (!last) return t.noResult;
        return last.cols.map((c) => c.toLowerCase()).join(",") === test.columns.map((c) => String(c).toLowerCase()).join(",") ? null : t.names(last.cols.join(", "), test.columns.join(", "));
      }
      if (test.db !== undefined) {
        const r = lastTable(execAll(SQL, db, test.db, 50).results);
        const v = r && r.rows.length ? r.rows[0][0] : null;
        if ("equals" in test) {
          const got = cellText(v, r && r.kinds && r.kinds[0] && r.kinds[0][0]);
          return sameValue(v, test.equals) ? null : test.msg || (hide ? t.hiddenDb(got) : t.dbGot(got, cellText(test.equals)));
        }
        return v ? null : test.msg || t.dbFalse;
      }
      if (test.fails !== undefined) {
        const r = execAll(SQL, db, test.fails, 50);
        if (!r.error) return test.msg || t.dbAccepted(String(test.fails).trim());
        return test.error && !new RegExp(test.error, "i").test(r.error.message) ? test.msg || t.dbOtherError(r.error.message) : null;
      }
      if (test.plan !== undefined || test.planNot !== undefined) {
        const isSelect = (r) => r && r.cols && /^\s*(WITH|SELECT)\b/i.test(r.sql);
        const sel = isSelect(last) ? last : [...out.results].reverse().find(isSelect);
        if (!sel) return t.noSelect;
        const p = execAll(SQL, db, `EXPLAIN QUERY PLAN ${sel.sql}`, 100).results[0];
        const text = p ? p.rows.map((r) => r[3]).join(" · ") : "";
        const ok = test.plan !== undefined ? new RegExp(test.plan, "i").test(text) : !new RegExp(test.planNot, "i").test(text);
        return ok ? null : (test.msg ? test.msg + " " : "") + t.plan(text);
      }
      if (test.output !== undefined) {
        const got = asText(last);
        return got.trimEnd() === String(test.output).trimEnd() ? null : hide ? t.hiddenOutput(got) : t.output(test.output, got);
      }
      if (test.outputIncludes !== undefined) return asText(last).includes(String(test.outputIncludes)) ? null : hide ? t.hiddenOutput(asText(last)) : t.output(test.outputIncludes, asText(last));
    } catch (e) {
      return String(e.message || e);
    }
    return null;
  }

  // Result checks look at the latest result that passes them all, so a lookup after the query that
  // proves it doesn't hide the proof; when none passes, they report on the last result.
  function proof(list, ctx, lang) {
    const tables = ctx.out.results.filter((r) => r.cols && !r.plan);
    const checks = list.filter(isResultCheck);
    if (checks.length && !ctx.out.error) {
      for (let i = tables.length - 1; i >= 0; i--) {
        if (checks.every((x) => !runTest(x, { ...ctx, last: tables[i] }, lang))) return tables[i];
      }
    }
    return tables[tables.length - 1] || null;
  }

  function runExercise(ex, code, lang) {
    const t = sqlMessages(lang);
    const scenarios = ex.scenarios && ex.scenarios.length ? ex.scenarios : [{}];
    const hide = ex.type === "mission";
    let shown = null;
    for (let i = 0; i < scenarios.length; i++) {
      const scn = scenarios[i];
      const db = fresh(ex, scn, lang);
      try {
        const gaps = /___/.test(stripComments(code));
        const out = gaps ? { results: [], error: { message: "gaps", statement: 1, line: 1 } } : execAll(SQL, db, code);
        const error = out.error ? { kind: "sql", text: gaps ? t.gaps : explain(out.error, code, lang) } : null;
        const list = [...(ex.tests || []), ...(scn.tests || [])];
        const ctx = { out, db, ex, scn, code, hide, wants: new Map() };
        ctx.last = proof(list, ctx, lang);
        const tests = list.map((x) => {
          const msg = runTest(x, ctx, lang);
          return { name: x.name, pass: !msg, msg: msg ? (x.msg && !msg.startsWith(x.msg) ? `${x.msg} ${msg}` : msg) : "" };
        });
        const pass = !error && tests.every((x) => x.pass);
        const last = lastTable(out.results);
        const r = { pass, tests, error, results: out.results.slice(-6), logs: last ? asText({ ...last, rows: last.rows.slice(0, 200) }).split("\n").filter(Boolean) : [], scenario: i, scenarios: scenarios.length };
        if (!pass || i === scenarios.length - 1) { shown = r; if (!pass) break; }
      } finally {
        db.close();
      }
    }
    return shown;
  }

  return { runExercise, fresh };
}

// ── The judge: the learner's query against small databases ───────────────────
// A case is { rows: { table: [[…], …] } } over the problem's `schema`. Expected results come from
// the reference solution; `check` (optional) is a query run after the code, for problems that
// change the data.
export function caseDb(SQL, schema, rows) {
  const db = new SQL.Database();
  db.exec(schema);
  for (const [table, list] of Object.entries(rows || {})) {
    if (!list.length) continue;
    const st = db.prepare(`INSERT INTO ${table} VALUES (${list[0].map(() => "?").join(", ")})`);
    for (const r of list) st.run(r.map((v) => (v === undefined ? null : v)));
    st.free();
  }
  return db;
}

export function randomCases(random) {
  if (!random) return [];
  const gen = new Function("rng", `"use strict";\n${random.generate}`);
  const r = rng(random.seed ?? 1);
  return Array.from({ length: random.count ?? 30 }, () => gen(r));
}

export function judgeOne(SQL, code, c, spec, lang = "es") {
  const db = caseDb(SQL, spec.schema, c.rows);
  try {
    const out = execAll(SQL, db, code, Infinity);
    if (out.error) return { verdict: "re", error: explain(out.error, code, lang) };
    const res = spec.check ? lastTable(execAll(SQL, db, spec.check, Infinity).results) : lastTable(out.results);
    if (!res) return { verdict: "wa", got: null, why: sqlMessages(lang).noResult };
    const why = compareRows(res, c.expected, { ordered: !!spec.ordered, names: !!spec.names, hide: !c.sample }, lang);
    return why ? { verdict: "wa", got: { cols: res.cols, rows: res.rows.slice(0, 50), kinds: res.kinds && res.kinds.slice(0, 50), total: res.total }, why } : { verdict: "ok" };
  } finally {
    db.close();
  }
}

export function buildJudgeCases(SQL, ex, lang = "es") {
  const raw = [
    ...(ex.samples || []).map((c) => ({ rows: c.rows, sample: true, note: c.note || "" })),
    ...(ex.edge || []).map((c) => ({ rows: c.rows, tag: c.tag || "" })),
    ...randomCases(ex.random).map((rows) => ({ rows, tag: (ex.random && ex.random.tag) || "", random: true })),
  ];
  return raw.map((c, i) => {
    const db = caseDb(SQL, ex.schema, c.rows);
    try {
      const out = execAll(SQL, db, ex.solution, Infinity);
      if (out.error) throw new Error(`${ex.id}: the reference fails on case ${i + 1}: ${out.error.message}`);
      const res = ex.check ? lastTable(execAll(SQL, db, ex.check, Infinity).results) : lastTable(out.results);
      if (!res) throw new Error(`${ex.id}: the reference returns no table on case ${i + 1}`);
      return { ...c, expected: { cols: res.cols, rows: res.rows, kinds: res.kinds } };
    } finally {
      db.close();
    }
  });
}

// The world, as bytes, per language: built once, cloned for every run.
export function worldMaker(SQL) {
  const cache = {};
  return (lang) => (cache[lang] ||= fillWorld(new SQL.Database(), lang).export());
}
