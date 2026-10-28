// The Python sandbox in the page: a Web Worker that loads Pyodide once and keeps it, since loading
// takes seconds. pyclient.js kills it when a run takes too long and starts a new one.
import { bootPython } from "./pybridge.js";

/* global __TALLER_PY__, loadPyodide */
const ready = (async () => {
  importScripts(`${self.__PYODIDE_URL__}pyodide.js`);
  const pyodide = await loadPyodide({ indexURL: self.__PYODIDE_URL__, stdout: () => {}, stderr: () => {} });
  return bootPython(pyodide, __TALLER_PY__);
})();

ready.then(
  () => self.postMessage({ ready: true }),
  (err) => self.postMessage({ ready: false, error: String((err && err.message) || err) }),
);

self.onmessage = async (e) => {
  const { id, op, args } = e.data;
  try {
    const runner = await ready;
    self.postMessage({ id, result: JSON.parse(JSON.stringify(runner[op](...args))) });
  } catch (err) {
    self.postMessage({ id, error: String((err && err.message) || err) });
  }
};
