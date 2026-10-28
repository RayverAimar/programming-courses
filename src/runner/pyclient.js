// The page's side of the Python sandbox: one worker with Pyodide loaded, runs queued one at a time,
// and a watchdog. A run that goes over its time kills the worker (an endless loop can't freeze the
// page) and the next run starts a new one.
import { messages } from "./harness.js";

/* global __PYWORKER_SOURCE__ */
const SOURCE = __PYWORKER_SOURCE__;
const TIMEOUT = 4000;
// Python in the browser is slower than JavaScript: a judge case gets this much before it's cut.
const PER_CASE = 3000;

let url = null;
let worker = null;
let booting = null;
let seq = 0;
const pending = new Map();
let chain = Promise.resolve();
const listeners = new Set();

// The page shows "loading Python…" while the first worker boots.
export const onPythonStatus = (fn) => listeners.add(fn);
const status = (s) => listeners.forEach((fn) => fn(s));

// Pyodide is served next to the site (vendor/pyodide/), never from a CDN.
const pyodideUrl = () => new URL(`${document.documentElement.dataset.root || "./"}vendor/pyodide/`, location.href).href;

function spawn() {
  if (!url) url = URL.createObjectURL(new Blob([`self.__PYODIDE_URL__ = ${JSON.stringify(pyodideUrl())};\n`, SOURCE], { type: "text/javascript" }));
  worker = new Worker(url);
  status("loading");
  booting = new Promise((resolve, reject) => {
    worker.onmessage = (e) => {
      const d = e.data;
      if ("ready" in d) {
        status(d.ready ? "ready" : "failed");
        return d.ready ? resolve() : reject(new Error(d.error));
      }
      const p = pending.get(d.id);
      if (!p) return;
      pending.delete(d.id);
      clearTimeout(p.timer);
      if (d.error) p.reject(new Error(d.error));
      else p.resolve(d.result);
    };
    worker.onerror = (e) => reject(new Error(e.message || "Python worker error"));
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

// One call, after the ones before it. The clock starts once Python is loaded.
function call(op, args, timeout) {
  const job = chain.then(async () => {
    if (!worker) spawn();
    await booting;
    return new Promise((resolve, reject) => {
      const id = ++seq;
      const timer = setTimeout(() => kill(), timeout);
      pending.set(id, { resolve, reject, timer });
      worker.postMessage({ id, op, args });
    });
  });
  chain = job.catch(() => {});
  return job;
}

export async function runPython(ex, code, lang) {
  const t = messages(lang);
  const timeout = ex.type === "demo" || ex.type === "predict" ? TIMEOUT : TIMEOUT * (ex.scenarios && ex.scenarios.length ? ex.scenarios.length : 1);
  try {
    const r = await call("runExercise", [ex, code, lang], timeout);
    if (!r.__timeout) return r;
  } catch (err) {
    return { pass: false, logs: [], tests: [], frames: null, error: { kind: "py", text: String(err.message) } };
  }
  return {
    pass: false, logs: [], frames: null, scenario: 0, scenarios: 1, map: null, timeout: true,
    error: { kind: "py", text: t.timeout },
    tests: (ex.tests || []).map((x) => ({ name: x.name, pass: false, msg: t.crashed })),
  };
}

// Judge runs, case by case: going over PER_CASE (plus the problem's own limit) is "time limit exceeded".
export async function judgePython(cases, code, lang, tolerance, env) {
  const results = [];
  for (let i = 0; i < cases.length; i++) {
    let r;
    try {
      r = await call("judgeCase", [code, cases[i], lang, tolerance, env], PER_CASE + ((env && env.limit) || 0));
    } catch (err) {
      return { results, tle: null, crash: String(err.message) };
    }
    if (r.__timeout) return { results, tle: i };
    results.push(r);
    if (r.missing || r.verdict === "tle") break;
  }
  return { results, tle: null };
}

// Warm Python up in the background once a Python page is open, so the first run is quick.
export function preloadPython() {
  if (!worker) spawn().catch(() => {});
}

// Large judge problems ship their seed: Python rebuilds the cases from it, as the build did.
export async function buildPythonCases(spec, lang) {
  const r = await call("buildCases", [spec, lang], 120000);
  if (r && r.__timeout) throw new Error("Building the judge's cases took too long");
  return r;
}
