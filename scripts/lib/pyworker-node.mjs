// The worker thread behind PyHost: Pyodide from npm, the same runner and bridge as the page.
import { parentPort } from "node:worker_threads";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadPyodide } from "pyodide";
import { bootPython } from "../../src/runner/pybridge.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

let runner;
try {
  const pyodide = await loadPyodide({ stdout: () => {}, stderr: () => {} });
  runner = await bootPython(pyodide, readFileSync(join(ROOT, "src/runner/py/taller.py"), "utf8"));
  parentPort.postMessage({ ready: true });
} catch (err) {
  parentPort.postMessage({ ready: false, error: String((err && err.stack) || err) });
}

parentPort.on("message", ({ id, op, args }) => {
  try {
    parentPort.postMessage({ id, result: JSON.parse(JSON.stringify(runner[op](...args))) });
  } catch (err) {
    parentPort.postMessage({ id, error: String((err && err.message) || err) });
  }
});
