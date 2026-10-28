// The judge: a program reads its input and prints its output, and is compared case by case.
// Cases come from the block (samples, hand-written edge cases) and from a seeded generator; the
// build computes every expected output by running the reference solution.
import { BLOCKED, makeConsole, explain, helperValues } from "./harness.js";
import { Server } from "../world/server.js";

// What a judged program receives besides console: the session's helpers and, in async
// problems, the simulated server with a virtual setTimeout.
// `limit` (ms, optional) is a per-call time budget in function mode: going over it is "time limit exceeded".
export const judgeEnv = (ex) => ({ helpers: ex.helpers || [], server: ex.server || null, async: !!(ex.async || ex.server), limit: ex.limit || 0, ...(ex.files ? { files: ex.files } : {}) });

function extras(env, lang) {
  const h = helperValues(env && env.helpers);
  const names = Object.keys(h), values = Object.values(h);
  let server = null;
  if (env && env.async) {
    server = new Server(env.server || {}, lang);
    const tm = server.timers();
    if (env.server) { names.push(server.name()); values.push(server.api()); }
    names.push("setTimeout", "clearTimeout");
    values.push(tm.setTimeout, tm.clearTimeout);
  }
  const blocked = server ? BLOCKED.filter((b) => b !== "setTimeout") : BLOCKED;
  return { names, values, blocked, server };
}

export const READERS = {
  es: { line: "leerLinea", number: "leerNumero", numbers: "leerNumeros" },
  en: { line: "readLine", number: "readNumber", numbers: "readNumbers" },
};

// Trailing spaces on each line and trailing empty lines don't count.
export const normalise = (text) => String(text).split("\n").map((l) => l.replace(/\s+$/, "")).join("\n").replace(/\n+$/, "");

export function runCase(code, input, lang = "es", env = null) {
  const lines = normalise(input) === "" ? [] : String(input).replace(/\n$/, "").split("\n");
  let at = 0;
  const line = () => (at < lines.length ? lines[at++] : "");
  const number = () => Number(line().trim());
  const numbers = () => line().trim().split(/\s+/).filter(Boolean).map(Number);
  const out = [];
  const r = READERS[lang] || READERS.es;
  try {
    const x = extras(env, lang);
    new Function("console", r.line, r.number, r.numbers, ...x.names, ...x.blocked, `"use strict";\n${code}`)(makeConsole(out), line, number, numbers, ...x.values);
    return { out: out.join("\n") };
  } catch (err) {
    return { out: out.join("\n"), error: explain(err, lang).text };
  }
}

// mulberry32: small, fast and the same everywhere, so a seed always gives the same cases.
export function rng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
  return { next, int, pick: (list) => list[int(0, list.length - 1)], list: (n, lo, hi) => Array.from({ length: n }, () => int(lo, hi)) };
}

export function randomInputs(random) {
  if (!random) return [];
  const gen = new Function("rng", `"use strict";\n${random.generate}`);
  const r = rng(random.seed ?? 1);
  return Array.from({ length: random.count ?? 30 }, () => gen(r));
}

// Function mode: the program defines functions; the judge calls one per case and compares what it returns.
export function callCase(code, fn, args, lang = "es", env = null) {
  const out = [];
  const t = MISSING[lang] || MISSING.es;
  let x;
  try {
    x = extras(env, lang);
    const get = new Function("console", ...x.names, ...x.blocked, `"use strict";\n${code}\n;return (n) => { try { return eval(n); } catch (_) { return undefined; } };`)(makeConsole(out), ...x.values);
    const f = get(fn);
    if (typeof f !== "function") return { error: t(fn), missing: true };
    const copy = JSON.parse(JSON.stringify(args));
    const t0 = performance.now();
    const value = f(...copy);
    const ms = performance.now() - t0;
    if (x.server && value && typeof value.then === "function") {
      return x.server.settle(value).then((v) => ({ value: v }), (err) => ({ error: explain(err, lang).text }));
    }
    return { value, ms };
  } catch (err) {
    return { error: explain(err, lang).text };
  }
}
const MISSING = {
  es: (fn) => `No encontré la función \`${fn}\`. Revisa que se llame así, con las mismas mayúsculas.`,
  en: (fn) => `I couldn't find the function \`${fn}\`. Check that it has exactly that name, same capitals.`,
};

export function sameValue(a, b, tol = 0) {
  if (typeof a === "number" && typeof b === "number") return tol ? Math.abs(a - b) <= tol : Object.is(a, b) || a === b;
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) return a === b;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  return ka.length === kb.length && ka.every((k) => sameValue(a[k], b[k], tol));
}

// How a value is written in the course: strings in double quotes.
export function literal(v) {
  if (typeof v === "string") return JSON.stringify(v);
  if (v === undefined) return "undefined";
  if (typeof v === "number" || typeof v === "boolean" || v === null) return String(v);
  if (typeof v === "function") return "function";
  if (Array.isArray(v)) return `[${v.map(literal).join(", ")}]`;
  const keys = Object.keys(v);
  return keys.length ? `{ ${keys.map((k) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${literal(v[k])}`).join(", ")} }` : "{}";
}
export const callText = (fn, args) => `${fn}(${args.map(literal).join(", ")})`;

// Every case with its expected output: samples, then edge cases, then random ones.
export async function buildCases(ex, lang) {
  const env = judgeEnv(ex);
  const fnMode = ex.mode === "function";
  const shape = (c) => (fnMode ? { fn: c.fn || ex.function, args: c.args } : { input: String(c.input).replace(/\n+$/, "") });
  const raw = [
    ...(ex.samples || []).map((c) => ({ ...shape(c), sample: true, note: c.note || "" })),
    ...(ex.edge || []).map((c) => ({ ...shape(c), tag: c.tag || "" })),
    ...randomInputs(ex.random).map((r) => ({ ...shape(fnMode ? { args: r } : { input: String(r) }), tag: ex.random.tag || "", random: true })),
  ];
  const done = [];
  for (const [i, c] of raw.entries()) done.push(await shapeCase(ex, c, i, lang, env, fnMode));
  return done;
}

async function shapeCase(ex, c, i, lang, env, fnMode) {
  {
    if (fnMode) {
      const r = await callCase(ex.solution, c.fn, c.args, lang, env);
      if (r.error) throw new Error(`${ex.id}: the reference fails on case ${i + 1}: ${r.error}`);
      if (!Array.isArray(c.args)) throw new Error(`${ex.id}: case ${i + 1} needs its arguments as a list`);
      if (r.value === undefined || Number.isNaN(r.value)) throw new Error(`${ex.id}: the reference returns ${r.value} on case ${i + 1}`);
      const sample = c.sample && ex.samples[i];
      if (sample && "returns" in sample && !sameValue(sample.returns, r.value, ex.tolerance || 0)) {
        throw new Error(`${ex.id}: sample ${i + 1} says ${literal(sample.returns)} but the reference returns ${literal(r.value)}`);
      }
      return { ...c, expected: r.value };
    }
    const r = runCase(ex.solution, c.input, lang, env);
    if (r.error) throw new Error(`${ex.id}: the reference fails on case ${i + 1}: ${r.error}`);
    const expected = normalise(r.out);
    if (c.sample && ex.samples[i].output !== undefined && normalise(ex.samples[i].output) !== expected) {
      throw new Error(`${ex.id}: sample ${i + 1} says ${JSON.stringify(ex.samples[i].output)} but the reference prints ${JSON.stringify(expected)}`);
    }
    return { ...c, output: expected };
  }
}

export async function judgeCase(code, c, lang, tol = 0, env = null) {
  if (c.fn) {
    const r = await callCase(code, c.fn, c.args, lang, env);
    if (r.error) return { verdict: "re", error: r.error, missing: !!r.missing };
    if (env && env.limit && r.ms > env.limit) return { verdict: "tle" };
    return sameValue(r.value, c.expected, tol) ? { verdict: "ok" } : { verdict: "wa", got: literal(r.value) };
  }
  const r = runCase(code, c.input, lang, env);
  if (r.error) return { verdict: "re", got: r.out, error: r.error };
  const got = normalise(r.out);
  return got === c.output ? { verdict: "ok" } : { verdict: "wa", got };
}

// Runs the cases in order; stops at a runtime error that means the function doesn't exist.
export async function judgeAll(code, cases, lang, tol = 0, onCase = () => {}, env = null) {
  const results = [];
  for (let i = 0; i < cases.length; i++) {
    const r = await judgeCase(code, cases[i], lang, tol, env);
    results.push(r);
    onCase(i, r);
    if (r.missing || r.verdict === "tle") break;
  }
  return results;
}
