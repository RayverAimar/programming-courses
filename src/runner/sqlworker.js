// The SQL sandbox: sql.js (SQLite in WebAssembly) with the case files' database built once per
// language; every run starts from a fresh copy. The page's side is sqlclient.js.
import initSqlJs from "sql.js/dist/sql-wasm-browser.js";
import { makeRunner, worldMaker, buildJudgeCases, judgeOne } from "../sql/engine.js";

let api = null;
const boot = initSqlJs({ locateFile: () => self.__SQL_WASM__ })
  .then((SQL) => {
    const world = worldMaker(SQL);
    api = { SQL, world, runner: makeRunner(SQL, world) };
    self.postMessage({ ready: true });
  })
  .catch((e) => self.postMessage({ ready: false, error: String(e && e.message) }));

const OPS = {
  warm: (lang) => (api.world(lang), true),
  runExercise: (ex, code, lang) => api.runner.runExercise(ex, code, lang),
  buildCases: (spec, lang) => buildJudgeCases(api.SQL, spec, lang),
  judgeCase: (code, c, spec, lang) => judgeOne(api.SQL, code, c, spec, lang),
};

self.onmessage = async (e) => {
  const { id, op, args } = e.data;
  await boot;
  try {
    self.postMessage({ id, result: OPS[op](...args) });
  } catch (err) {
    self.postMessage({ id, error: String((err && err.message) || err) });
  }
};
