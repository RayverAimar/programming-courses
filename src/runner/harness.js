// Runs a learner's program against an exercise: captures console output, drives the robot,
// evaluates the tests and turns JavaScript errors into plain advice. Used by the browser worker
// and by scripts/verify.mjs, so the checks a learner sees are the ones the build verified.
import { World, RobotError } from "../world/engine.js";
import { Server } from "../world/server.js";

export const MAX_LINES = 500;

// Names the program can't reach, even though a worker has them.
export const BLOCKED = ["self", "globalThis", "postMessage", "importScripts", "fetch", "XMLHttpRequest", "WebSocket", "close", "indexedDB", "caches", "Worker", "setTimeout", "setInterval"];

const T = {
  es: {
    gaps: "Todavía quedan huecos ___ por completar.",
    notDefined: (n) => `No existe \`${n}\`. ¿Lo escribiste igual, con las mismas mayúsculas, y lo declaraste con let o const?`,
    tdz: (n) => `Usaste \`${n}\` antes de la línea donde lo declaras. Muévelo debajo de su declaración.`,
    constant: "Intentaste cambiar una constante. Si su valor va a cambiar, declárala con let en vez de const.",
    notFn: (n) => `\`${n}\` no es una función, así que no se puede llamar con ().`,
    readProp: (p, of) => `Intentaste leer \`.${p}\` de algo que vale ${of}. Revisa que esa variable tenga un valor.`,
    redeclared: (n) => `\`${n}\` ya existe: o lo declaraste dos veces, o te lo da el ejercicio. Úsalo sin volver a declararlo.`,
    syntax: (m) => `Error de sintaxis: ${m}. Revisa paréntesis, llaves y comillas.`,
    generic: (m) => m,
    line: (n) => ` (línea ${n})`,
    expected: (want, got) => `Esperaba ${want}, pero salió ${got}.`,
    output: (want, got) => `La consola debería mostrar:\n${want}\nPero mostró:\n${got || "(nada)"}`,
    outputHas: (want) => `En la consola falta: ${want}`,
    source: "Tu código todavía no usa lo que pide el ejercicio.",
    sourceNot: "Tu código usa algo que este ejercicio pide evitar.",
    failed: "Todavía no se cumple.",
    gotWant: (what, got, want) => `\`${what}\` vale ${got}; se esperaba ${want}.`,
    outputGot: (got) => `La consola mostró: ${got || "(nada)"}`,
    robotAt: (x, y, dir, bat, n) => `El robot terminó en (${x}, ${y}) mirando al ${dir}${bat === null ? "" : `, con ${bat} de batería`}, tras ${n} acciones.`,
    goalAt: (x, y) => ` El objetivo está en (${x}, ${y}).`,
    dirs: { N: "norte", E: "este", S: "sur", W: "oeste" },
    none: "ninguna",
    nothing: "nada",
    room: (n) => `sala ${n}`,
    doors: (open, motion, alarms) => ` Puertas abiertas: ${open}. Movimiento en: ${motion}. Alarma en: ${alarms}.`,
    crystals: (left, total, reports) => ` Quedan ${left} de ${total} cristales; reportó ${reports}.`,
    served: (list) => ` Sirvió: ${list}.`,
    dish: (table, dish) => `mesa ${table} ${dish}`,
    crashed: "El programa se detuvo antes de llegar aquí.",
    scenario: (i, n) => `Escenario ${i} de ${n}`,
    timeout: "Tu programa tardó demasiado y lo detuve. ¿Hay un bucle que nunca termina?",
    stackOverflow: "La pila de llamadas se desbordó: una función se llamó a sí misma miles de veces sin parar. Revisa el caso base: ¿hay un caso que devuelva sin volver a llamar, y cada llamada se acerca a él?",
  },
  en: {
    gaps: "There are still ___ gaps to fill in.",
    notDefined: (n) => `\`${n}\` doesn't exist. Did you spell it the same, same capitals, and declare it with let or const?`,
    tdz: (n) => `You used \`${n}\` before the line that declares it. Move it below its declaration.`,
    constant: "You tried to change a constant. If its value will change, declare it with let instead of const.",
    notFn: (n) => `\`${n}\` is not a function, so it can't be called with ().`,
    readProp: (p, of) => `You tried to read \`.${p}\` from something that is ${of}. Check that the variable has a value.`,
    redeclared: (n) => `\`${n}\` already exists: you declared it twice, or the exercise gives it to you. Use it without declaring it again.`,
    syntax: (m) => `Syntax error: ${m}. Check brackets, braces and quotes.`,
    generic: (m) => m,
    line: (n) => ` (line ${n})`,
    expected: (want, got) => `Expected ${want}, but got ${got}.`,
    output: (want, got) => `The console should show:\n${want}\nBut it showed:\n${got || "(nothing)"}`,
    outputHas: (want) => `Missing from the console: ${want}`,
    source: "Your code doesn't use what the exercise asks for yet.",
    sourceNot: "Your code uses something this exercise asks you to avoid.",
    failed: "Not met yet.",
    gotWant: (what, got, want) => `\`${what}\` is ${got}; expected ${want}.`,
    outputGot: (got) => `The console showed: ${got || "(nothing)"}`,
    robotAt: (x, y, dir, bat, n) => `The robot ended at (${x}, ${y}) facing ${dir}${bat === null ? "" : `, with ${bat} battery left`}, after ${n} actions.`,
    goalAt: (x, y) => ` The goal is at (${x}, ${y}).`,
    dirs: { N: "north", E: "east", S: "south", W: "west" },
    none: "none",
    nothing: "nothing",
    room: (n) => `room ${n}`,
    doors: (open, motion, alarms) => ` Open doors: ${open}. Motion at: ${motion}. Alarm at: ${alarms}.`,
    crystals: (left, total, reports) => ` ${left} of ${total} crystals left; reported ${reports}.`,
    served: (list) => ` Served: ${list}.`,
    dish: (table, dish) => `table ${table} ${dish}`,
    crashed: "The program stopped before getting here.",
    scenario: (i, n) => `Scenario ${i} of ${n}`,
    timeout: "Your program took too long and I stopped it. Is there a loop that never ends?",
    stackOverflow: "The call stack overflowed: a function called itself thousands of times without stopping. Check the base case: is there a case that returns without calling again, and does every call get closer to it?",
  },
};
export const messages = (lang) => T[lang] || T.es;

// Like Node's console.log: strings bare at the top level, quoted inside arrays and objects.
export function format(v, nested = false) {
  if (typeof v === "string") return nested ? `'${v.replace(/'/g, "\\'")}'` : v;
  if (typeof v === "number") return Object.is(v, -0) ? "-0" : String(v);
  if (typeof v === "bigint") return `${v}n`;
  if (v === undefined || v === null || typeof v === "boolean") return String(v);
  if (typeof v === "function") return v.name ? `[Function: ${v.name}]` : "[Function (anonymous)]";
  if (typeof v === "symbol") return v.toString();
  if (Array.isArray(v)) return v.length ? `[ ${v.map((x) => format(x, true)).join(", ")} ]` : "[]";
  const keys = Object.keys(v);
  if (!keys.length) return "{}";
  const k = (s) => (/^[A-Za-z_$][\w$]*$/.test(s) ? s : `'${s}'`);
  return `{ ${keys.map((s) => `${k(s)}: ${format(v[s], true)}`).join(", ")} }`;
}

// Values in messages: strings in the double quotes the course writes them with.
const show = (v) => (typeof v === "string" ? JSON.stringify(v) : format(v, true));

export function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  return ka.length === kb.length && ka.every((k) => deepEqual(a[k], b[k]));
}

// "a === b" on its own can say what each side was; anything more complex just passes or fails.
function splitEq(expr) {
  const e = String(expr).trim();
  if (e.startsWith("(") || /&&|\|\||\?/.test(e) || e.split("===").length !== 2) return null;
  const [lhs, rhs] = e.split("===").map((x) => x.trim());
  return lhs && rhs ? [lhs, rhs] : null;
}

const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
const stripComments = (code) => code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:\\])\/\/[^\n]*/g, "$1");

// The line in the learner's code: the stack counts the two header lines new Function adds,
// plus the "use strict" line we put before the code.
const HEADER_LINES = 3;
function errorLine(err, extra = 0) {
  const m = String(err.stack || "").match(/(?<!evalmachine\.)<anonymous>:(\d+):\d+/) || String(err.stack || "").match(/Function:(\d+):\d+/);
  if (!m) return null;
  const n = Number(m[1]) - HEADER_LINES - extra;
  return n > 0 ? n : null;
}

export function explain(err, lang, withLine = true, extra = 0) {
  const t = messages(lang);
  if (err instanceof RobotError || (err && err.name === "RobotError")) return { kind: "robot", text: err.message };
  const msg = String((err && err.message) || err);
  let text;
  let m;
  if (err && err.name === "SyntaxError") {
    if ((m = msg.match(/Identifier '(.+)' has already been declared/))) text = t.redeclared(m[1]);
    else text = t.syntax(msg);
  } else if ((m = msg.match(/^(.+) is not defined$/))) text = m[1] === "___" ? t.gaps : t.notDefined(m[1]);
  else if ((m = msg.match(/Cannot access '(.+)' before initialization/))) text = t.tdz(m[1]);
  else if (/Assignment to constant variable/.test(msg)) text = t.constant;
  else if ((m = msg.match(/^(.+) is not a function/))) text = t.notFn(m[1]);
  else if ((m = msg.match(/Cannot read propert(?:y|ies) of (undefined|null) \(reading '(.+)'\)/))) text = t.readProp(m[2], m[1]);
  else if (/Maximum call stack size exceeded|too much recursion/.test(msg)) text = t.stackOverflow;
  else text = t.generic(`${err && err.name ? err.name + ": " : ""}${msg}`);
  const line = withLine && err && err.name !== "SyntaxError" ? errorLine(err, extra) : null;
  return { kind: "js", text: text + (line ? t.line(line) : "") };
}

export function makeConsole(lines) {
  const push = (...args) => {
    if (lines.length < MAX_LINES) lines.push(args.map((a) => format(a)).join(" "));
  };
  return Object.freeze({ log: push, info: push, warn: push, error: push, debug: push });
}

// Values a session hands the program as ready-made functions: `helpers` with `code`.
export function helperValues(helpers) {
  const out = {};
  for (const h of helpers || []) if (h.code !== undefined) out[h.name] = new Function(`"use strict"; return (${h.code});`)();
  return out;
}

export const isAsync = (ex) => !!(ex.server || ex.async);

// One pass of the program against one scenario. Async exercises return a promise.
function runOnce(ex, code, scenario, lang) {
  const t = messages(lang);
  const logs = [];
  const worldCfg = ex.world ? { ...ex.world, ...(scenario.world || {}), ...(scenario.map ? { map: scenario.map } : {}) } : null;
  const world = worldCfg ? new World(worldCfg, lang) : null;
  const asyncMode = isAsync(ex);
  const server = asyncMode ? new Server({ ...(ex.server || {}), ...(scenario.server || {}) }, lang) : null;
  const globals = { ...(ex.globals || {}), ...(scenario.globals || {}) };
  const helpers = helperValues(ex.helpers);
  const timers = server ? server.timers() : null;
  const names = ["console", ...(world ? ["robot"] : []), ...(ex.server ? [server.name()] : []), ...(timers ? ["setTimeout", "clearTimeout"] : []), ...Object.keys(helpers), ...Object.keys(globals)];
  const values = [makeConsole(logs), ...(world ? [world.api()] : []), ...(ex.server ? [server.api()] : []), ...(timers ? [timers.setTimeout, timers.clearTimeout] : []), ...Object.values(helpers), ...Object.values(globals).map(clone)];
  const blocked = timers ? BLOCKED.filter((b) => b !== "setTimeout") : BLOCKED;
  const tests = [...(ex.tests || []), ...(scenario.tests || [])];
  const inScope = tests.filter((x) => x.expect !== undefined || x.run !== undefined);
  const probesSrc = `[${inScope
      .map((x) => {
        const eq = x.expect !== undefined && splitEq(x.expect);
        return eq ? `() => [(${eq[0]}), (${eq[1]})]` : `() => (${x.expect !== undefined ? x.expect : x.run})`;
      })
      .join(",")}]`;
  const body = asyncMode
    ? `"use strict";\nreturn (async () => {\n${code}\n;return ${probesSrc};\n})();`
    : `"use strict";\n${code}\n;return ${probesSrc};`;
  const extra = asyncMode ? 1 : 0;

  let error = null;
  let probes = null;
  const ctx = { ex, code, t, lang, logs, world, server, globals, tests, inScope };
  if (/(^|[^\w$])___([^\w$]|$)/.test(code)) {
    error = { kind: "js", text: t.gaps };
    return finish(ctx, null, error);
  }
  let started;
  try {
    started = new Function(...names, ...blocked, body)(...values);
  } catch (err) {
    return asyncMode ? Promise.resolve(finish(ctx, null, explain(err, lang, true, extra))) : finish(ctx, null, explain(err, lang));
  }
  if (!asyncMode) return finish(ctx, started, null);
  return server.settle(started).then(
    (p) => finish(ctx, p, null),
    (err) => finish(ctx, null, explain(err, lang, true, extra)),
  );
}

function finish(ctx, probes, error) {
  const { ex, code, t, lang, logs, world, server, globals, tests, inScope } = ctx;
  const out = logs.join("\n");
  const summary = world ? world.summary() : null;
  const rooms = (list) => (list.length ? list.map((k) => t.room(summary.doorKeys.indexOf(k) + 1)).join(", ") : t.none);
  const join = (...parts) => parts.filter(Boolean).join(" ");
  const where = summary
    ? t.robotAt(summary.x, summary.y, t.dirs[summary.dir], summary.battery, summary.actions) +
      (summary.goal && !summary.atGoal ? t.goalAt(summary.goal[0], summary.goal[1]) : "") +
      (summary.hasDoors ? t.doors(rooms(summary.openDoorKeys), rooms(summary.motionDoors), rooms(summary.alarms)) : "") +
      (summary.crystalsTotal ? t.crystals(summary.crystalsLeft, summary.crystalsTotal, summary.reports.length ? summary.reports.join(", ") : t.none) : "") +
      (ex.world.theme === "cocina" ? t.served(summary.served.length ? summary.served.map((d) => t.dish(d.table, d.dish)).join(", ") : t.nothing) : "")
    : "";
  let told = false;
  const results = tests.map((x) => {
    const name = x.name;
    const fail = (msg) => ({ name, pass: false, msg });
    try {
      if (x.source !== undefined) {
        return new RegExp(x.source).test(stripComments(code)) ? { name, pass: true } : fail(x.msg || t.source);
      }
      if (x.sourceNot !== undefined) {
        return !new RegExp(x.sourceNot).test(stripComments(code)) ? { name, pass: true } : fail(x.msg || t.sourceNot);
      }
      if (x.output !== undefined) {
        const want = String(x.output).replace(/\s+$/, "");
        const got = logs.map((l) => l.replace(/\s+$/, "")).join("\n");
        return got === want ? { name, pass: true } : fail(x.msg ? `${x.msg}\n${t.outputGot(got)}` : t.output(want, got));
      }
      if (x.outputIncludes !== undefined) {
        return out.includes(String(x.outputIncludes)) ? { name, pass: true } : fail(join(x.msg || t.outputHas(x.outputIncludes), `\n${t.outputGot(out)}`));
      }
      if (x.state !== undefined) {
        if (!summary && !server) return fail(t.failed);
        const ok = new Function("w", "out", "g", "s", `"use strict"; return (${x.state});`)(summary, logs, globals, server ? server.summary() : null);
        if (ok) return { name, pass: true };
        // The robot's whereabouts once, on the first robot test that fails.
        const note = error || told ? "" : where;
        told = true;
        return fail(join(x.msg || t.failed, note));
      }
      if (!probes) return fail(error ? t.crashed : t.failed);
      const got = probes[inScope.indexOf(x)]();
      if (x.run !== undefined) {
        if (got && typeof got.then === "function") return fail(t.failed);
        return deepEqual(got, x.equals) ? { name, pass: true } : fail(x.msg ? `${x.msg} ${t.expected(show(x.equals), show(got))}` : t.expected(show(x.equals), show(got)));
      }
      const eq = splitEq(x.expect);
      if (eq) {
        return got[0] === got[1] ? { name, pass: true } : fail(join(x.msg, t.gotWant(eq[0], show(got[0]), show(got[1]))));
      }
      return got ? { name, pass: true } : fail(x.msg || t.failed);
    } catch (err) {
      return fail(explain(err, lang, false).text);
    }
  });

  return {
    logs,
    error,
    tests: results,
    frames: world ? world.frames : null,
    pass: !error && results.every((r) => r.pass),
  };
}

// Every scenario must pass. The result shows the first failing scenario, or the first one.
export function runExercise(ex, code, { lang = "es" } = {}) {
  const scenarios = ex.scenarios && ex.scenarios.length ? ex.scenarios : [{}];
  if (isAsync(ex)) {
    return (async () => {
      const runs = [];
      for (const s of scenarios) runs.push(await runOnce(ex, code, s, lang));
      return pick(ex, scenarios, runs, lang);
    })();
  }
  return pick(ex, scenarios, scenarios.map((s) => runOnce(ex, code, s, lang)), lang);
}

function pick(ex, scenarios, runs, lang) {
  const t = messages(lang);
  const shown = Math.max(0, runs.findIndex((r) => !r.pass));
  const r = runs[shown];
  const tests = r.tests.map((x) => (!x.pass && scenarios.length > 1 ? { ...x, scenario: t.scenario(shown + 1, scenarios.length) } : x));
  return {
    pass: runs.every((x) => x.pass),
    logs: r.logs,
    error: r.error,
    tests,
    frames: r.frames,
    scenario: shown,
    scenarios: scenarios.length,
    map: ex.world ? (scenarios[shown].map || ex.world.map) : null,
    world: ex.world ? { ...ex.world, ...(scenarios[shown].world || {}) } : null,
  };
}
