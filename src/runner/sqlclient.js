// The page's side of the SQL sandbox: one worker, calls queued one at a time, and a watchdog. A query
// that runs too long (a JOIN without a condition, an endless WITH RECURSIVE) kills the worker and the
// next call starts a new one.
import { sqlMessages } from "../sql/messages.js";

/* global __SQLWORKER_SOURCE__ */
const SOURCE = __SQLWORKER_SOURCE__;
const TIMEOUT = 4000;
const PER_CASE = 1500;

let url = null;
let worker = null;
let booting = null;
let seq = 0;
const pending = new Map();
let chain = Promise.resolve();
const warmed = new Set();

const wasmUrl = () => new URL(`${document.documentElement.dataset.root || "./"}vendor/sql-wasm.wasm`, location.href).href;

function spawn() {
  if (!url) url = URL.createObjectURL(new Blob([`self.__SQL_WASM__ = ${JSON.stringify(wasmUrl())};\n`, SOURCE], { type: "text/javascript" }));
  worker = new Worker(url);
  warmed.clear();
  booting = new Promise((resolve, reject) => {
    worker.onmessage = (e) => {
      const d = e.data;
      if ("ready" in d) return d.ready ? resolve() : reject(new Error(d.error));
      const p = pending.get(d.id);
      if (!p) return;
      pending.delete(d.id);
      clearTimeout(p.timer);
      if (d.error) p.reject(new Error(d.error));
      else p.resolve(d.result);
    };
    worker.onerror = (e) => reject(new Error(e.message || "SQL worker error"));
  });
  return booting;
}

function kill() {
  if (worker) worker.terminate();
  worker = null;
  booting = null;
  for (const p of pending.values()) { clearTimeout(p.timer); p.resolve({ __timeout: true }); }
  pending.clear();
}

function send(op, args, timeout) {
  return new Promise((resolve, reject) => {
    const id = ++seq;
    const timer = timeout ? setTimeout(() => kill(), timeout) : null;
    pending.set(id, { resolve, reject, timer });
    worker.postMessage({ id, op, args });
  });
}

// The database for a language is built the first time it's needed; the clock starts after that.
function call(op, args, timeout, lang) {
  const job = chain.then(async () => {
    if (!worker) spawn();
    await booting;
    if (lang && !warmed.has(lang)) { await send("warm", [lang], 0); warmed.add(lang); }
    return send(op, args, timeout);
  });
  chain = job.catch(() => {});
  return job;
}

export async function runSql(ex, code, lang) {
  const t = sqlMessages(lang);
  const n = ex.scenarios && ex.scenarios.length ? ex.scenarios.length : 1;
  try {
    const r = await call("runExercise", [ex, code, lang], TIMEOUT * n, lang);
    if (!r.__timeout) return r;
  } catch (err) {
    return { pass: false, logs: [], tests: [], results: [], error: { kind: "sql", text: String(err.message) } };
  }
  return { pass: false, logs: [], results: [], timeout: true, error: { kind: "sql", text: t.timeout }, tests: (ex.tests || []).map((x) => ({ name: x.name, pass: false, msg: t.crashed })) };
}

export async function judgeSql(cases, code, spec, lang) {
  const results = [];
  for (let i = 0; i < cases.length; i++) {
    let r;
    try {
      r = await call("judgeCase", [code, cases[i], spec, lang], PER_CASE);
    } catch (err) {
      return { results, tle: null, crash: String(err.message) };
    }
    if (r.__timeout) return { results, tle: i };
    results.push(r);
  }
  return { results, tle: null };
}

export async function buildSqlCases(spec, lang) {
  const r = await call("buildCases", [spec, lang], 60000);
  if (r && r.__timeout) throw new Error("Building the judge's cases took too long");
  return r;
}

export function preloadSql(lang) {
  call("warm", [lang], 0, lang).catch(() => {});
}
