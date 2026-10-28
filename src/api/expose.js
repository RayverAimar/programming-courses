import ROBOT from "./robot.json" with { type: "json" };
import ENV from "./env.json" with { type: "json" };

const LEGACY = ["move", "deliver", "museum", "mine", "kitchen"];

export function expand(list) {
  const out = [];
  for (const k of list) {
    const ids = ROBOT.groups[k] || (ROBOT.members[k] ? [k] : null);
    if (!ids) throw new Error(`Unknown robot API "${k}": use a group (${Object.keys(ROBOT.groups).join(", ")}) or a member id`);
    for (const id of ids) if (!out.includes(id)) out.push(id);
  }
  return out;
}

// Which robot members a world exposes: `api` when given, otherwise what its theme needs.
export function robotIds(world) {
  if (!world) return [];
  if (world.api) return expand(world.api);
  return expand(ROBOT.themes[world.theme || "barranco"] || LEGACY);
}

export const robotDoc = (id, lang) => {
  const m = ROBOT.members[id];
  return { id, kind: m.kind || "method", ...(m[lang] || m.es) };
};
export const readerDoc = (k, lang) => ENV.readers[k][lang] || ENV.readers[k].es;
export const serverObject = (lang) => ENV.server.object[lang] || ENV.server.object.es;
export const serverDocs = (lang) => Object.entries(ENV.server.members).map(([id, m]) => ({ id, kind: "method", ...(m[lang] || m.es) }));

// Python names robot members in snake_case: girarIzquierda → girar_izquierda.
export const snake = (name) => name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
const pyDoc = (d) => ({ ...d, name: snake(d.name), doc: d.doc.replace(/\bnull\b/g, "None").replace(/\btrue\b/g, "True").replace(/\bfalse\b/g, "False"), returns: d.returns && d.returns.replace(/\bnull\b/g, "None").replace(/\bboolean\b/g, "bool").replace(/\bnumber\b/g, "int") });
// The Python server: pedir/enviar/ahora (asyncio.sleep stands in for esperar).
const PY_SERVER = ["request", "send", "now"];

// What the editor can suggest for an exercise: exactly what the program will receive.
export function environment(ex, lang, track = "js") {
  const env = { robot: null, readers: null, server: null, helpers: [], globals: {} };
  const py = track === "py";
  if (ex.world) env.robot = robotIds(ex.world).map((id) => (py ? pyDoc(robotDoc(id, lang)) : robotDoc(id, lang)));
  if (!py && ex.type === "judge" && (ex.mode || "stdout") === "stdout") env.readers = ["line", "number", "numbers"].map((k) => readerDoc(k, lang));
  if (ex.server) env.server = { ...serverObject(lang), members: py ? serverDocs(lang).filter((m) => PY_SERVER.includes(m.id)).map(pyDoc) : serverDocs(lang) };
  env.helpers = (ex.helpers || []).map((h) => ({ name: h.name, sig: h.sig || h.name, doc: h.doc || "", kind: h.code === undefined ? "value" : "method" }));
  for (const [k, v] of Object.entries(ex.globals || {})) env.globals[k] = shape(v);
  for (const s of ex.scenarios || []) for (const [k, v] of Object.entries(s.globals || {})) if (!env.globals[k]) env.globals[k] = shape(v);
  return env;
}

function shape(v, depth = 0) {
  if (Array.isArray(v)) return { t: "array", item: v.length && depth < 2 ? shape(v[0], depth + 1) : null };
  if (v && typeof v === "object") {
    const keys = {};
    if (depth < 2) for (const [k, x] of Object.entries(v)) keys[k] = shape(x, depth + 1);
    return { t: "object", keys };
  }
  return { t: typeof v };
}

export { ROBOT, ENV };
