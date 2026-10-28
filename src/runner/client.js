// Each run gets a fresh worker, killed after TIMEOUT: an endless loop can't freeze the page.
import { messages } from "./harness.js";

const TIMEOUT = 2000;
let url = null;

export function runInWorker(workerSource, ex, code, lang) {
  if (!url) url = URL.createObjectURL(new Blob([workerSource], { type: "text/javascript" }));
  return new Promise((resolve) => {
    const w = new Worker(url);
    const timer = setTimeout(() => {
      w.terminate();
      const t = messages(lang);
      resolve({
        pass: false, logs: [], frames: null, scenario: 0, scenarios: 1, map: null, timeout: true,
        error: { kind: "js", text: t.timeout },
        tests: (ex.tests || []).map((x) => ({ name: x.name, pass: false, msg: t.crashed })),
      });
    }, TIMEOUT);
    w.onmessage = (e) => {
      clearTimeout(timer);
      w.terminate();
      resolve(e.data);
    };
    w.onerror = (e) => {
      clearTimeout(timer);
      w.terminate();
      resolve({ pass: false, logs: [], tests: [], frames: null, error: { kind: "js", text: e.message || "Error" } });
    };
    w.postMessage({ ex, code, lang });
  });
}

// Judge runs: every case gets PER_CASE ms; going over is "time limit exceeded" on that case.
const PER_CASE = 1000;
export function judgeInWorker(workerSource, cases, code, lang, tolerance, env = null) {
  if (!url) url = URL.createObjectURL(new Blob([workerSource], { type: "text/javascript" }));
  return new Promise((resolve) => {
    const w = new Worker(url);
    const results = [];
    let timer = null;
    const finish = (tle) => {
      clearTimeout(timer);
      w.terminate();
      resolve({ results, tle });
    };
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => finish(results.length), PER_CASE);
    };
    w.onmessage = (e) => {
      if (e.data.done) return finish(null);
      results[e.data.case] = e.data.result;
      arm();
    };
    w.onerror = () => finish(null);
    arm();
    w.postMessage({ judge: true, cases, code, lang, tolerance, env });
  });
}

// Large judge problems ship their seed, not their cases: the cases are rebuilt here, the same as at build time.
export function buildCasesInWorker(workerSource, spec, lang) {
  if (!url) url = URL.createObjectURL(new Blob([workerSource], { type: "text/javascript" }));
  return new Promise((resolve, reject) => {
    const w = new Worker(url);
    const timer = setTimeout(() => { w.terminate(); reject(new Error("Building the judge's cases took too long")); }, 60000);
    w.onmessage = (e) => {
      clearTimeout(timer);
      w.terminate();
      if (e.data.error) reject(new Error(e.data.error));
      else resolve(e.data.cases);
    };
    w.onerror = (e) => { clearTimeout(timer); w.terminate(); reject(new Error(e.message || "Error")); };
    w.postMessage({ build: true, ex: spec, lang });
  });
}
