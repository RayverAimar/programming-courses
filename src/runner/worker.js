import { runExercise } from "./harness.js";
import { judgeAll, buildCases } from "./judge.js";

self.onmessage = async (e) => {
  const d = e.data;
  try {
    if (d.build) {
      self.postMessage({ cases: await buildCases(d.ex, d.lang) });
      return;
    }
    if (d.judge) {
      await judgeAll(d.code, d.cases, d.lang, d.tolerance || 0, (i, r) => self.postMessage({ case: i, result: r }), d.env || null);
      self.postMessage({ done: true });
      return;
    }
    self.postMessage(JSON.parse(JSON.stringify(await runExercise(d.ex, d.code, { lang: d.lang }))));
  } catch (err) {
    if (d.build) return self.postMessage({ error: String((err && err.message) || err) });
    self.postMessage(d.judge ? { done: true, crash: String(err && err.message) } : { pass: false, logs: [], tests: [], frames: null, error: { kind: "js", text: String((err && err.message) || err) } });
  }
};
