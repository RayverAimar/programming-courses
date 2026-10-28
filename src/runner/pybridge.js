// Boots the Python runner (src/runner/py/taller.py) inside a Pyodide instance and exposes it with
// the same operations everywhere: the browser worker (pyworker.js) and the Node build and verify
// scripts (scripts/lib/pyhost.mjs). JavaScript and Python only exchange JSON strings; the robot's
// world stays the JavaScript engine, which Python reaches through the `taller_js` module.
import { World } from "../world/engine.js";
import { robotDoc, ROBOT } from "../api/expose.js";

export async function bootPython(pyodide, source) {
  let worlds = [];
  const apis = new Map();
  const api = (i) => {
    if (!apis.has(i)) apis.set(i, worlds[i].api());
    return apis.get(i);
  };
  pyodide.registerJsModule("taller_js", {
    newWorld: (cfg, lang) => {
      worlds.push(new World(JSON.parse(cfg), lang));
      return worlds.length - 1;
    },
    worldIds: (i) => JSON.stringify(worlds[i].ids),
    worldSummary: (i) => JSON.stringify(worlds[i].summary()),
    noApi: (i, name) => JSON.stringify(worlds[i].m.noApi(name)),
    worldCall: (i, id, args) => {
      try {
        const v = api(i)[robotDoc(id, worlds[i].lang).name];
        const r = typeof v === "function" ? v(...JSON.parse(args)) : v;
        return JSON.stringify({ ok: r === undefined ? null : r });
      } catch (e) {
        return JSON.stringify({ error: String((e && e.message) || e), robot: !!e && e.name === "RobotError" });
      }
    },
  });
  pyodide.FS.writeFile("/home/pyodide/taller.py", source);
  pyodide.runPython("import sys\nif '/home/pyodide' not in sys.path: sys.path.insert(0, '/home/pyodide')");
  const py = pyodide.pyimport("taller");
  py.boot(JSON.stringify(ROBOT));

  // Each operation starts with no worlds: a world lives for one run.
  const fresh = () => {
    worlds = [];
    apis.clear();
  };
  const framesOf = (r) => {
    r.frames = r.worldIndex === null || r.worldIndex === undefined ? null : worlds[r.worldIndex].frames;
    delete r.worldIndex;
    return r;
  };
  return {
    runExercise(ex, code, lang) {
      fresh();
      return framesOf(JSON.parse(py.run_exercise(JSON.stringify(ex), code, lang)));
    },
    runPlain(code, lang) {
      fresh();
      return JSON.parse(py.run_plain(code, lang));
    },
    judgeCase(code, c, lang, tol, env) {
      fresh();
      const { fn, argsJson, expectedJson, input, output } = c;
      return JSON.parse(py.judge_case(code, JSON.stringify({ fn, argsJson, expectedJson, input, output }), lang, tol || 0, JSON.stringify(env || {})));
    },
    buildCases(ex, lang) {
      fresh();
      return JSON.parse(py.build_cases(JSON.stringify(ex), lang));
    },
    trace(code, globals, refs) {
      fresh();
      return JSON.parse(py.trace(code, JSON.stringify(globals || {}), !!refs));
    },
    scene(spec, program, lang) {
      fresh();
      const r = framesOf(JSON.parse(py.scene(JSON.stringify(spec), program, lang)));
      return { frames: r.frames, error: r.error };
    },
  };
}
