// Reads a track's Markdown into sessions: exercise blocks become data, everything else HTML.
// Shared by the build and by verify.mjs, so both see exactly the same exercises.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { load as loadYaml } from "js-yaml";

export const VISUALS = {
  escena: "scene", scene: "scene", tablero: "board", board: "board", anima: "anim", anim: "anim", figura: "figure", figure: "figure",
  resultado: "result", result: "result", esquema: "er", schema: "er", orden: "order", order: "order", junta: "join", join: "join",
  grupos: "groups", groups: "groups", ventana: "window", window: "window", arbol: "btree", btree: "btree", plan: "plan",
  transaccion: "txn", transaction: "txn", logica: "logic", logic: "logic", escenario: "setting", setting: "setting",
  pizarra: "caseboard", caseboard: "caseboard", expediente: "dossier", dossier: "dossier",
  vueltas: "recursion", recursion: "recursion", algoritmo: "joinalgo", joinalgo: "joinalgo",
  cambio: "change", change: "change", traduccion: "port", translation: "port",
  red: "network", network: "network", alcance: "scope", scope: "scope",
  correlada: "correlated", correlated: "correlated", conjuntos: "sets", sets: "sets", cte: "cte",
};
export const TYPES = ["predict", "complete", "fix", "write", "case", "mission", "challenge", "judge", "demo"];
const TEST_KEYS = ["expect", "run", "output", "outputIncludes", "source", "sourceNot", "state", "same", "value", "rows", "columns", "db", "fails", "plan", "planNot"];

// The session files of a track, in order: content/<track>/NN-slug.md.
export function sessionFiles(contentDir, track) {
  return readdirSync(join(contentDir, track))
    .filter((f) => /^\d\d-[\w-]+\.md$/.test(f))
    .sort();
}

export function sourceFor(contentDir, track, file, lang, defaultLang) {
  if (lang === defaultLang) return join(contentDir, track, file);
  const p = join(contentDir, "i18n", lang, track, file);
  return existsSync(p) ? p : null;
}

export function loadModern(contentDir, track) {
  const p = join(contentDir, track, "_modern.yml");
  return existsSync(p) ? loadYaml(readFileSync(p, "utf8")) : {};
}

function fail(where, msg) {
  throw new Error(`${where}: ${msg}`);
}

function normaliseTest(t, where) {
  if (!t || typeof t !== "object") fail(where, "a test must be a mapping");
  if (!t.name) fail(where, "every test needs a name");
  const kinds = TEST_KEYS.filter((k) => t[k] !== undefined);
  if (kinds.length !== 1) fail(where, `test "${t.name}" needs exactly one of ${TEST_KEYS.join(", ")}`);
  if (t.run !== undefined && !("equals" in t)) fail(where, `test "${t.name}" uses run without equals`);
  return t;
}

export function validateExercise(ex, where, sql = false) {
  if (!ex.id || !/^[a-z0-9-]+$/.test(ex.id)) fail(where, `bad or missing id "${ex.id}"`);
  if (!TYPES.includes(ex.type)) fail(where, `${ex.id}: type must be one of ${TYPES.join(", ")}`);
  const w = `${where} (${ex.id})`;
  if (ex.type === "predict") {
    if (!ex.code || !Array.isArray(ex.options) || ex.answer === undefined) fail(w, "predict needs code, options and answer");
    if (!ex.options.map(String).includes(String(ex.answer))) fail(w, "the answer must be one of the options");
  } else if (ex.type !== "demo") {
    if (ex.starter === undefined || ex.solution === undefined) fail(w, "needs starter and solution");
    if (ex.type === "case") {
      if (ex.answer === undefined) fail(w, "a case needs its answer");
    } else if (ex.type === "judge" && sql) {
      if (!ex.schema) fail(w, "a SQL judge needs its schema (CREATE TABLE …)");
      if (!(ex.samples && ex.samples.length) || ex.samples.some((c) => !c.rows)) fail(w, "a SQL judge needs samples, each with its rows");
      if ((ex.tests || []).some((t) => t.source === undefined && t.sourceNot === undefined)) fail(w, "judge tests may only be source checks");
    } else if (ex.type === "judge") {
      if (!["stdout", "function"].includes(ex.mode || "stdout")) fail(w, "judge mode must be stdout or function");
      if (ex.mode === "function" && !ex.function) fail(w, "function mode needs the function's name");
      if (!(ex.samples && ex.samples.length)) fail(w, "a judge needs samples");
      if ((ex.tests || []).some((t) => t.source === undefined && t.sourceNot === undefined)) fail(w, "judge tests may only be source checks");
    } else if (!(ex.tests && ex.tests.length) && !(ex.scenarios || []).some((s) => s.tests && s.tests.length)) {
      fail(w, "needs tests");
    }
  }
  ex.tests = (ex.tests || []).map((t) => normaliseTest(t, w));
  ex.scenarios = (ex.scenarios || []).map((s) => ({ ...s, tests: (s.tests || []).map((t) => normaliseTest(t, w)) }));
  if (ex.type === "mission" && !ex.world && !sql) fail(w, "a mission needs a world");
  return ex;
}

// Pulls ```exercise blocks (YAML) and ```js run / ```py run blocks out of the Markdown. Each one leaves a
// placeholder the page fills with the live component. A ```session block sets defaults for every
// exercise (world, helpers, server); visual blocks (```escena, ```tablero, ```anima, ```figura)
// become pictures and animations.
export function extractExercises(md, where, sessionId) {
  const exercises = [];
  const visuals = [];
  let session = null;
  let section = "";
  let demo = 0;
  const lines = md.split("\n");
  const out = [];
  const yaml = (body, what) => {
    try {
      return loadYaml(body.join("\n"));
    } catch (e) {
      fail(where, `YAML in a ${what} block: ${e.message}`);
    }
  };
  for (let i = 0; i < lines.length; i++) {
    const h2 = lines[i].match(/^##\s+(.*)$/);
    if (h2) section = h2[1].trim();
    const fence = lines[i].match(new RegExp(`^\`\`\`(exercise|session|js run|javascript run|py run|python run|sql run|${Object.keys(VISUALS).join("|")})\\s*$`));
    if (!fence) { out.push(lines[i]); continue; }
    const body = [];
    i++;
    while (i < lines.length && !/^```\s*$/.test(lines[i])) body.push(lines[i++]);
    if (i >= lines.length) fail(where, "an unclosed ``` block");
    if (fence[1] === "session") {
      session = yaml(body, "session") || {};
      continue;
    }
    if (VISUALS[fence[1]]) {
      const v = { id: `${sessionId}-v${visuals.length + 1}`, kind: VISUALS[fence[1]], section, spec: yaml(body, fence[1]) || {} };
      visuals.push(v);
      out.push("", `<div class="vis-slot" data-vis="${v.id}"></div>`, "");
      continue;
    }
    let ex;
    if (fence[1] === "exercise") ex = yaml(body, "exercise");
    else ex = { id: `${sessionId}-demo-${++demo}`, type: "demo", starter: body.join("\n") };
    ex.section = section;
    validateExercise(ex, where, /^sql-/.test(sessionId));
    if (exercises.some((x) => x.id === ex.id)) fail(where, `duplicate exercise id ${ex.id}`);
    exercises.push(ex);
    out.push("", `<div class="ex-slot" data-ex="${ex.id}"></div>`, "");
  }
  if (session) for (const ex of exercises) applySession(ex, session);
  return { md: out.join("\n"), exercises, visuals, session };
}

function applySession(ex, cfg) {
  if (cfg.case && !ex.case) ex.case = cfg.case;
  if (ex.type === "predict" || ex.type === "demo") return;
  if (ex.world && cfg.world) ex.world = { ...cfg.world, ...ex.world };
  if (cfg.helpers) ex.helpers = [...cfg.helpers, ...(ex.helpers || []).filter((h) => !cfg.helpers.some((c) => c.name === h.name))];
  if (ex.server === true) ex.server = { ...(cfg.server || {}) };
  else if (ex.server && cfg.server) ex.server = { ...cfg.server, ...ex.server };
}

export { answerHash } from "../../src/runner/hash.js";
