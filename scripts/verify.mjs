// Checks every exercise in every language (JavaScript in a vm context, Python on Pyodide) with the same harness the page uses:
// the solution passes, the starter fails, each "predict" answer is what Node really prints,
// each case's solution prints its answer, each runnable example runs.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import * as esbuild from "esbuild";
import { sessionFiles, sourceFor, extractExercises, loadModern } from "./lib/content.mjs";
import { wrongLanguage } from "./lib/lang-check.mjs";
import { buildCases, judgeAll, judgeEnv } from "../src/runner/judge.js";
import { PyHost } from "./lib/pyhost.mjs";
import { sqlHost, resultOf, planOf, orderStages, correlatedSteps, cteSteps, setLists, changeSteps, defsOf } from "./lib/sqlhost.mjs";
import { asText } from "../src/sql/format.js";
import { writeFileSync, mkdirSync } from "node:fs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = join(ROOT, "content");
const LANGS = ["es", "en"];
// `node scripts/verify.mjs py` checks one track; `py/03` one session (both languages).
const FILTER = process.argv[2] || "";
const TRACKS = ["js", "py", "sql"].filter((t) => !FILTER || FILTER.split("/")[0] === t);
const wanted = (track, file) => !FILTER.includes("/") || file.startsWith(FILTER.split("/")[1]);

const harness = (
  await esbuild.build({ entryPoints: [join(ROOT, "src/runner/harness.js")], bundle: true, write: false, format: "iife", globalName: "H" })
).outputFiles[0].text;

// A fresh context per run, with a time limit: a starter with an endless loop can't hang the check.
function run(ex, code, lang) {
  const ctx = vm.createContext({ __ex: JSON.parse(JSON.stringify(ex)), __code: code, __lang: lang, performance }, { microtaskMode: "afterEvaluate" });
  vm.runInContext(harness, ctx);
  try {
    vm.runInContext("Promise.resolve(H.runExercise(__ex, __code, { lang: __lang })).then((r) => { __out = JSON.stringify(r); }, (e) => { __out = JSON.stringify({ pass: false, logs: [], tests: [], error: { text: String(e && e.message) } }); })", ctx, { timeout: 3000 });
    if (ctx.__out === undefined) throw new Error("the run never finished");
    return JSON.parse(ctx.__out);
  } catch (e) {
    return { pass: false, timeout: true, logs: [], tests: [], error: { text: String(e.message) } };
  }
}

// Python runs on Pyodide (the page's runtime); "predict" answers and examples are also checked
// against the system's CPython, so what the page shows is what real Python prints.
const host = new PyHost();
async function pyRun(ex, code, lang) {
  const r = await host.call("runExercise", [JSON.parse(JSON.stringify(ex)), code, lang], 15000);
  return r.__timeout ? { pass: false, timeout: true, logs: [], tests: [], error: { text: "timed out (15 s)" } } : r;
}
const PYTHON = spawnSync("python3", ["--version"], { encoding: "utf8" }).status === 0 ? "python3" : null;
const cpython = (code) => {
  const r = spawnSync(PYTHON, ["-I", "-c", code], { encoding: "utf8", timeout: 10000 });
  return (r.stdout || "").replace(/\n$/, "");
};

const nodeOutput = (code) => {
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", code], { encoding: "utf8", timeout: 5000 });
  return (r.stdout || "").replace(/\n$/, "");
};

let failures = 0, checked = 0;
const warnings = [];
const warn = (where, msg) => warnings.push(`  ! ${where}: ${msg}`);
const judgeData = {};
const bad = (where, msg) => {
  failures++;
  console.log(`  ✗ ${where}: ${msg}`);
};

// SQL: every exercise on the same sql.js and world the page uses; "predict" answers and runnable
// examples are also run by the system's sqlite3, so what the page shows is what SQLite prints.
const SQLITE = spawnSync("sqlite3", ["--version"], { encoding: "utf8" }).status === 0 ? "sqlite3" : null;
const worldFiles = {};
async function sqliteCli(code, lang, ex) {
  if (!SQLITE || ex.db === "empty") return null;
  if (!worldFiles[lang]) {
    const H = await sqlHost();
    mkdirSync(join(ROOT, ".cache"), { recursive: true });
    worldFiles[lang] = join(ROOT, ".cache", `sql-world-${lang}.sqlite`);
    writeFileSync(worldFiles[lang], H.world(lang));
  }
  const r = spawnSync(SQLITE, ["-batch", "-noheader", "-separator", " | ", "-nullvalue", "NULL", ":memory:"], { encoding: "utf8", timeout: 10000, input: `.restore '${worldFiles[lang]}'\n${ex.setup || ""}\n${code}\n` });
  return (r.stdout || "").replace(/\n$/, "");
}
const sqlNames = (code) => [...String(code || "").replace(/'(?:''|[^'])*'/g, "''").replace(/--[^\n]*/g, "").matchAll(/\bAS\s+([A-Za-z_]\w*)|\bWITH\s+(?:RECURSIVE\s+)?([A-Za-z_]\w*)|,\s*([A-Za-z_]\w*)\s+AS\s*\(/gi)].map((m) => m[1] || m[2] || m[3]);
for (const lang of LANGS) {
  for (const track of TRACKS) {
    for (const file of sessionFiles(CONTENT, track)) {
      if (!wanted(track, file)) continue;
      const src = sourceFor(CONTENT, track, file, lang, "es");
      if (!src) { console.log(`  · ${lang}/${track}/${file}: no translation yet`); continue; }
      const { exercises, visuals } = extractExercises(readFileSync(src, "utf8"), src, `${track}-${file.replace(/\.md$/, "")}`);
      if (track === "py") {
        await verifyPython(exercises, visuals, lang);
        continue;
      }
      if (track === "sql") {
        await verifySql(exercises, visuals, lang);
        continue;
      }
      for (const ex of exercises) {
        const where = `${lang} ${ex.id}`;
        checked++;
        // Code on an English page is English, and on a Spanish page, Spanish.
        for (const [what, code] of [["starter", ex.starter], ["solution", ex.solution], ["code", ex.code], ...(ex.wrong || []).map((w, i) => [`wrong ${i + 1}`, w])]) {
          const words = code ? wrongLanguage(code, lang) : [];
          if (words.length) bad(where, `${what} has ${lang === "en" ? "Spanish" : "English"} names: ${words.join("; ")}`);
        }
        for (const fn of [ex.function, ...[...(ex.samples || []), ...(ex.edge || [])].map((c) => c.fn)].filter(Boolean)) {
          const words = wrongLanguage(`function ${fn}() {}`, lang);
          if (words.length) bad(where, `judge function name in the wrong language: ${words.join("; ")}`);
        }
        // Every case, judge and mission comes with a picture.
        if (["case", "judge"].includes(ex.type) && !ex.visual && !visuals.some((v) => v.section === ex.section)) warn(where, `a ${ex.type} without a visual (add visual: or a figure/board block in its section)`);
        if (ex.type === "demo") {
          const r = run(ex, ex.starter, lang);
          if (r.error) bad(where, `example throws: ${r.error.text}`);
          const real = nodeOutput(ex.starter);
          if (real !== r.logs.join("\n")) bad(where, `example prints differently in Node:\n${real}\nvs\n${r.logs.join("\n")}`);
          continue;
        }
        if (ex.type === "predict") {
          const r = run(ex, ex.code, lang);
          const got = r.logs.join("\n");
          const real = nodeOutput(ex.code);
          if (got !== String(ex.answer)) bad(where, `harness prints ${JSON.stringify(got)}, answer is ${JSON.stringify(ex.answer)}`);
          if (real !== String(ex.answer)) bad(where, `Node prints ${JSON.stringify(real)}, answer is ${JSON.stringify(ex.answer)}`);
          if (new Set(ex.options.map(String)).size !== ex.options.length) bad(where, "duplicate options");
          continue;
        }
        if (ex.type === "judge") {
          // Same seed, same cases; the reference passes them all; every wrong solution and the starter fail.
          let cases;
          try {
            cases = await buildCases(ex, lang);
          } catch (e) {
            bad(where, e.message);
            continue;
          }
          if (JSON.stringify(await buildCases(ex, lang)) !== JSON.stringify(cases)) bad(where, "the random generator is not deterministic");
          const tol = ex.tolerance || 0;
          const env = judgeEnv(ex);
          const ok = async (code) => { const r = await judgeAll(code, cases, lang, tol, undefined, env); return r.length === cases.length && r.every((x) => x.verdict === "ok"); };
          if (!(await ok(ex.solution))) bad(where, "the reference solution fails its own cases");
          if (await ok(ex.starter)) bad(where, "starter is accepted");
          if (!(ex.wrong && ex.wrong.length)) bad(where, "needs at least one plausible wrong solution");
          for (const [i, w] of (ex.wrong || []).entries()) if (await ok(w)) bad(where, `wrong solution ${i + 1} is accepted`);
          // The data is the same in every language; only the words around it change.
          const data = JSON.stringify(cases.map((c) => [c.input ?? c.args, c.output ?? c.expected]));
          if (judgeData[ex.id] && judgeData[ex.id] !== data) bad(where, "cases differ from the other language");
          judgeData[ex.id] = data;
          continue;
        }
        if (ex.type === "case") {
          const s = run(ex, ex.solution, lang);
          if (s.error) bad(where, `solution throws: ${s.error.text}`);
          if (!s.logs.join("\n").includes(String(ex.answer))) bad(where, `solution output doesn't show the answer ${ex.answer}`);
          const st = run(ex, ex.starter, lang);
          if (st.error) bad(where, `starter throws: ${st.error.text}`);
          const strip = (x) => String(x).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
          const ans = strip(ex.answer).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          if (new RegExp(`(^|[^\\p{L}\\d])${ans}([^\\p{L}\\d]|$)`, "u").test(strip(st.logs.join("\n")))) bad(where, "the starter already prints the answer: give only the data and let the learner compute it");
          if (ex.starter && ex.solution && ex.starter.trim() === String(ex.solution).trim()) bad(where, "the starter is the solution");
          continue;
        }
        const s = run(ex, ex.solution, lang);
        if (!s.pass) bad(where, `solution fails: ${s.error ? s.error.text + " | " : ""}${s.tests.filter((t) => !t.pass).map((t) => `${t.name}: ${t.msg}`).join(" | ")}`);
        const st = run(ex, ex.starter, lang);
        if (st.pass) bad(where, "starter already passes");
      }
    }
  }
}
async function verifyPython(exercises, visuals, lang) {
  for (const ex of exercises) {
    const where = `${lang} ${ex.id}`;
    checked++;
    for (const [what, code] of [["starter", ex.starter], ["solution", ex.solution], ["code", ex.code], ...(ex.wrong || []).map((w, i) => [`wrong ${i + 1}`, w])]) {
      const words = code ? wrongLanguage(code, lang, "py") : [];
      if (words.length) bad(where, `${what} has ${lang === "en" ? "Spanish" : "English"} names: ${words.join("; ")}`);
    }
    for (const fn of [ex.function, ...[...(ex.samples || []), ...(ex.edge || [])].map((c) => c.fn)].filter(Boolean)) {
      const words = wrongLanguage(`def ${fn}(): pass`, lang, "py");
      if (words.length) bad(where, `judge function name in the wrong language: ${words.join("; ")}`);
    }
    if (["case", "judge"].includes(ex.type) && !ex.visual && !visuals.some((v) => v.section === ex.section)) warn(where, `a ${ex.type} without a visual (add visual: or a figure/board block in its section)`);
    if (ex.type === "demo" || ex.type === "predict") {
      const code = ex.type === "demo" ? ex.starter : ex.code;
      const r = await host.call("runPlain", [code, lang], 15000);
      const got = (r.logs || []).join("\n");
      if (r.error) bad(where, `${ex.type === "demo" ? "example" : "snippet"} throws: ${r.error.text}`);
      const real = PYTHON ? cpython(code) : got;
      if (real !== got) bad(where, `CPython prints differently:\n${real}\nvs Pyodide:\n${got}`);
      if (ex.type === "predict") {
        if (got !== String(ex.answer)) bad(where, `prints ${JSON.stringify(got)}, answer is ${JSON.stringify(ex.answer)}`);
        if (new Set(ex.options.map(String)).size !== ex.options.length) bad(where, "duplicate options");
      }
      continue;
    }
    if (ex.type === "judge") {
      let cases;
      try {
        cases = await host.call("buildCases", [ex, lang], 120000);
        if (cases.__timeout) throw new Error("building the cases took over 2 minutes");
      } catch (e) {
        bad(where, e.message);
        continue;
      }
      const again = await host.call("buildCases", [ex, lang], 120000);
      if (JSON.stringify(again) !== JSON.stringify(cases)) bad(where, "the random generator is not deterministic");
      const env = { ...judgeEnv(ex) };
      const ok = async (code) => {
        for (const c of cases) {
          const r = await host.call("judgeCase", [code, c, lang, ex.tolerance || 0, env], 5000 + (env.limit || 0));
          if (r.__timeout || r.verdict !== "ok") return false;
        }
        return true;
      };
      if (!(await ok(ex.solution))) bad(where, "the reference solution fails its own cases (or goes over its time limit)");
      if (await ok(ex.starter)) bad(where, "starter is accepted");
      if (!(ex.wrong && ex.wrong.length)) bad(where, "needs at least one plausible wrong solution");
      for (const [i, w] of (ex.wrong || []).entries()) if (await ok(w)) bad(where, `wrong solution ${i + 1} is accepted`);
      const data = JSON.stringify(cases.map((c) => [c.input ?? c.argsJson, c.output ?? c.expectedJson]));
      if (judgeData[ex.id] && judgeData[ex.id] !== data) bad(where, "cases differ from the other language");
      judgeData[ex.id] = data;
      continue;
    }
    if (ex.type === "case") {
      const s = await pyRun({ ...ex, tests: [], scenarios: [] }, ex.solution, lang);
      if (s.error) bad(where, `solution throws: ${s.error.text}`);
      if (!s.logs.join("\n").includes(String(ex.answer))) bad(where, `solution output doesn't show the answer ${ex.answer}`);
      const st = await pyRun({ ...ex, tests: [], scenarios: [] }, ex.starter, lang);
      if (st.error) bad(where, `starter throws: ${st.error.text}`);
      const strip = (x) => String(x).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const ans = strip(ex.answer).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`(^|[^\\p{L}\\d])${ans}([^\\p{L}\\d]|$)`, "u").test(strip(st.logs.join("\n")))) bad(where, "the starter already prints the answer: give only the data and let the learner compute it");
      if (ex.starter && ex.solution && ex.starter.trim() === String(ex.solution).trim()) bad(where, "the starter is the solution");
      continue;
    }
    const s = await pyRun(ex, ex.solution, lang);
    if (!s.pass) bad(where, `solution fails: ${s.error ? s.error.text + " | " : ""}${s.tests.filter((t) => !t.pass).map((t) => `${t.name}: ${t.msg}`).join(" | ")}`);
    const st = await pyRun(ex, ex.starter, lang);
    if (st.pass) bad(where, "starter already passes");
  }
  // Visuals that run Python at build time: their programs must work.
  for (const v of visuals) {
    if (v.kind === "scene" && v.spec.program) {
      const r = await host.call("scene", [v.spec, String(v.spec.program), lang], 15000);
      if (r.error) bad(`${lang} ${v.id}`, `the scene's program fails: ${r.error}`);
    }
    if (v.kind === "anim" && !v.spec.steps) {
      const r = await host.call("trace", [String(v.spec.code || ""), v.spec.globals || {}], 15000);
      if (r.error) bad(`${lang} ${v.id}`, `the animation's code fails: ${r.error}`);
      else if (r.steps.length >= 300) warn(`${lang} ${v.id}`, "the animation hits 300 steps; shorten the snippet");
    }
  }
}

async function verifySql(exercises, visuals, lang) {
  const H = await sqlHost();
  const all = (r) => (r.results || []).filter((x) => x.cols).map((x) => asText(x)).join("\n");
  for (const ex of exercises) {
    const where = `${lang} ${ex.id}`;
    checked++;
    for (const [what, code] of [["starter", ex.starter], ["solution", ex.solution], ["code", ex.code], ...(ex.wrong || []).map((w, i) => [`wrong ${i + 1}`, w])]) {
      const words = code ? wrongLanguage(sqlNames(code).map((n) => `const ${n} = 0;`).join("\n"), lang) : [];
      if (words.length) bad(where, `${what} has ${lang === "en" ? "Spanish" : "English"} names: ${words.join("; ")}`);
    }
    if (ex.type === "case" && !ex.visual && !visuals.some((v) => v.section === ex.section)) warn(where, "a case without a visual (add visual: or a figure block in its section)");
    const plain = { ...ex, tests: [], scenarios: [] };
    if (ex.type === "demo" || ex.type === "predict") {
      const code = ex.type === "demo" ? ex.starter : ex.code;
      const r = H.runner.runExercise(plain, code, lang);
      if (r.error) bad(where, `${ex.type === "demo" ? "example" : "snippet"} fails: ${r.error.text}`);
      const got = all(r);
      const real = await sqliteCli(code, lang, ex);
      if (real !== null && real !== got) bad(where, `sqlite3 prints differently:\n${real}\nvs sql.js:\n${got}`);
      if (ex.type === "predict") {
        if (got !== String(ex.answer)) bad(where, `returns ${JSON.stringify(got)}, answer is ${JSON.stringify(ex.answer)}`);
        if (new Set(ex.options.map(String)).size !== ex.options.length) bad(where, "duplicate options");
      }
      continue;
    }
    if (ex.type === "judge") {
      let cases;
      try { cases = H.buildCases(ex, lang); } catch (e) { bad(where, e.message); continue; }
      if (JSON.stringify(H.buildCases(ex, lang)) !== JSON.stringify(cases)) bad(where, "the random generator is not deterministic");
      const spec = { schema: ex.schema, check: ex.check, ordered: !!ex.ordered, names: !!ex.names };
      const ok = (code) => cases.every((c) => H.judge(code, c, spec, lang).verdict === "ok");
      if (!ok(ex.solution)) bad(where, "the reference solution fails its own cases");
      if (ok(ex.starter)) bad(where, "starter is accepted");
      if (!(ex.wrong && ex.wrong.length)) bad(where, "needs at least one plausible wrong solution");
      for (const [i, w] of (ex.wrong || []).entries()) if (ok(w)) bad(where, `wrong solution ${i + 1} is accepted`);
      const data = JSON.stringify(cases.map((c) => [Object.values(c.rows || {}), c.expected.rows]));
      if (judgeData[ex.id] && judgeData[ex.id] !== data) bad(where, "cases differ from the other language");
      judgeData[ex.id] = data;
      continue;
    }
    const strip = (x) => String(x).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const has = (text, ans) => new RegExp(`(^|[^\\p{L}\\d])${strip(ans).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}\\d]|$)`, "u").test(strip(text));
    if (ex.type === "case") {
      const s = H.runner.runExercise(plain, ex.solution, lang);
      if (s.error) bad(where, `solution fails: ${s.error.text}`);
      else if (!has(all(s), ex.answer)) bad(where, `solution's result doesn't show the answer ${ex.answer}`);
      const st = H.runner.runExercise(plain, ex.starter, lang);
      if (!st.error && has(all(st), ex.answer)) bad(where, "the starter already shows the answer: give only the data and let the learner query it");
      if (ex.starter.trim() === String(ex.solution).trim()) bad(where, "the starter is the solution");
      continue;
    }
    const s = H.runner.runExercise(ex, ex.solution, lang);
    if (!s.pass) bad(where, `solution fails: ${s.error ? s.error.text + " | " : ""}${s.tests.filter((t) => !t.pass).map((t) => `${t.name}: ${t.msg}`).join(" | ")}`);
    if (ex.type === "mission" && ex.answer !== undefined) {
      const m = H.runner.runExercise(plain, ex.solution, lang);
      const lastRes = (m.results || []).filter((x) => x.cols).pop();
      if (!has(all(m), ex.answer) && String(lastRes && lastRes.total) !== String(ex.answer)) bad(where, `the mission's query doesn't show its answer ${ex.answer} (as a value or as its row count)`);
    }
    const st = H.runner.runExercise(ex, ex.starter, lang);
    if (st.pass) bad(where, "starter already passes");
    const tries = [st, ...(ex.wrong || []).map((w) => H.runner.runExercise(ex, w, lang))];
    for (const [i, r] of tries.entries()) if (i && r.pass) bad(where, `wrong solution ${i} passes`);
    if (ex.type === "mission" && ex.answer !== undefined && !/^\d+$/.test(String(ex.answer))) {
      const said = [...ex.tests, ...ex.scenarios.flatMap((x) => x.tests)].flatMap((x) => [x.name, x.msg || ""]);
      for (const r of tries) said.push(...r.tests.map((x) => x.msg));
      for (const text of said) if (has(text, ex.answer)) bad(where, `a test's name or failure message gives away the answer ${ex.answer}: ${text}`);
    }
  }
  for (const v of visuals) {
    try {
      if (v.kind === "order") await orderStages(v.spec, lang, v.id);
      if (v.kind === "change") await changeSteps(v.spec, lang, v.id);
      if (v.kind === "er" && v.spec.schema) await defsOf(v.spec.schema, v.id);
      if (v.kind === "result" && v.spec.query) await resultOf(v.spec, lang, v.id);
      if (v.kind === "plan" && v.spec.query) await planOf(v.spec, lang, v.id);
      if (v.kind === "recursion" && v.spec.query) await resultOf(v.spec, lang, v.id);
      if (v.kind === "correlated") await correlatedSteps(v.spec, lang, v.id);
      if (v.kind === "cte") await cteSteps(v.spec, lang, v.id);
      if (v.kind === "sets") await setLists(v.spec, lang, v.id);
    } catch (e) { bad(`${lang} ${v.id}`, e.message); }
  }
}

for (const lang of LANGS) {
  for (const track of TRACKS) {
    for (const [key, f] of Object.entries(loadModern(CONTENT, track))) {
      const tx = f[lang];
      if (!tx) continue;
      for (const part of ["old", "new"]) {
        const words = tx[part] ? wrongLanguage(tx[part], lang, track) : [];
        if (words.length) bad(`${lang} _modern ${key}.${part}`, `${lang === "en" ? "Spanish" : "English"} names: ${words.join("; ")}`);
      }
    }
  }
}
host.close();
if (warnings.length) console.log(`\nWarnings:\n${warnings.join("\n")}`);
console.log(failures ? `\n✗ ${failures} problem(s) in ${checked} exercises` : `✓ ${checked} exercises verified (ES + EN): solutions pass, starters fail, predictions match Node, judges sound`);
process.exit(failures ? 1 : 0);
