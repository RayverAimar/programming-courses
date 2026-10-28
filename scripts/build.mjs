// Builds the site: the platform's shell (platform/build/site.mjs) plus this repo's courses as data,
// one JSON file per session. Content format: docs/content.md. Exercise blocks: docs/exercises.md.
// How the pieces fit: docs/platform.md.
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import * as esbuild from "esbuild";
import { sessionFiles, sourceFor, extractExercises, loadModern, answerHash, VISUALS } from "./lib/content.mjs";
import { buildCases, callText, literal, judgeEnv } from "../src/runner/judge.js";
import { environment } from "../src/api/expose.js";
import { PyHost } from "./lib/pyhost.mjs";
import { load as loadYaml } from "js-yaml";
import { buildSite, strings, searchSections } from "../platform/build/site.mjs";
import { vendorPyodide } from "./vendor.mjs";
import { sqlHost, resultOf, planOf, orderStages, correlatedSteps, cteSteps, setLists, changeSteps, defsOf } from "./lib/sqlhost.mjs";
import { tablesIn } from "../src/sql/schema.js";
import { figureProblems } from "./lib/figures.mjs";
import { mdPlain } from "../platform/web/core/inline.js";
import { highlightHtml, lexerFor, escHtml, unescHtml } from "../platform/web/core/highlight.js";
import { loadPhotos, injectPhotos, copyPhotos } from "../platform/build/photos.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = join(ROOT, "content");
const SRC = join(ROOT, "src");
const read = (p) => readFileSync(p, "utf8");

const LANGS = ["es", "en"];
const DEFAULT_LANG = "es";
const UI = JSON.parse(read(join(SRC, "ui.json")));
const PKG = JSON.parse(read(join(ROOT, "package.json")));

// A track is a language being taught. Only tracks with content are built; the rest show as coming.
// A compiled language (native) will run with the learner's own compiler, in the desktop app.
const TRACKS = [
  { id: "js", ready: true },
  { id: "py", ready: true },
  { id: "sql", ready: true },
  { id: "cpp", ready: false, native: "cpp" },
  { id: "rust", ready: false, native: "rust" },
];

marked.setOptions({ gfm: true, breaks: false });

// ── Code highlighting: platform/web/core/highlight.js, the same one the browser uses ──
const highlightJs = (code) => highlightHtml(code, "js");
const highlightPy = (code) => highlightHtml(code, "python");
const highlightSql = (code) => highlightHtml(code, "sql");
// The track being built decides how code is coloured.
let TRACK = "js";
const highlight = (code) => (TRACK === "py" ? highlightPy(code) : TRACK === "sql" ? highlightSql(code) : highlightJs(code));
const codeBlock = (code, cls = "") => `<pre class="code${cls ? " " + cls : ""}"><code>${highlight(String(code).replace(/\n+$/, ""))}</code></pre>`;

const slugify = (s) =>
  s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

// ── Build state for the language being built ────────────────────────────────
let L = DEFAULT_LANG;
const ui = (key) => {
  const v = UI[L][`${key}.${TRACK}`] ?? UI[L][key] ?? strings(UI)[L][key];
  if (v === undefined) throw new Error(`Missing UI string "${key}" for ${L}`);
  return v;
};
// Reference links: MDN for JavaScript, docs.python.org for Python (its Spanish translation on Spanish pages),
// sqlite.org for SQL (a full URL when a note points at PostgreSQL's or the standard's docs).
const mdn = (path) =>
  /^https?:/.test(path) ? path : TRACK === "sql" ? `https://www.sqlite.org/${path}` : TRACK === "py" ? `https://docs.python.org/${L === "es" ? "es/" : ""}3/${path}` : `https://developer.mozilla.org/${L === "es" ? "es" : "en-US"}/docs/${path}`;

// Fenced blocks in any Markdown text get the same colours as the editor.
const codeBlocks = (html) =>
  html.replace(/<pre><code(?: class="language-([\w-]+)")?>([\s\S]*?)<\/code><\/pre>/g, (_m, lang, body) =>
    lexerFor(lang) ? `<pre class="code"><code>${highlightHtml(unescHtml(body).replace(/\n+$/, ""), lang)}</code></pre>` : `<pre class="code"><code>${body}</code></pre>`
  );
const mdBlock = (s) => codeBlocks(marked.parse(String(s)));

function modernBox(modern, key, where) {
  const f = modern[key];
  if (!f) throw new Error(`${where}: unknown feature "${key}" in _modern.yml`);
  const t = f[L] || f[DEFAULT_LANG];
  if (!t.old) throw new Error(`${where}: "${key}" has no legacy form to show`);
  return `<aside class="legacy">
    <p class="legacy-k">${ui("legacy.title")}</p>
    <div class="legacy-cmp">
      <div><span class="legacy-tag old">${ui("legacy.old")}</span>${codeBlock(t.old)}</div>
      <div><span class="legacy-tag new">${ui("legacy.new")}</span>${codeBlock(t.new)}</div>
    </div>
    <div class="legacy-note">${mdBlock(t.note)}</div>
    <p class="legacy-mdn"><a href="${mdn(f.mdn)}" target="_blank" rel="noopener">${ui("docs.name")} · ${escHtml(t.name)}</a></p>
  </aside>`.replace(/\n\s*/g, "\n");
}

function mdnRow(modern, keys, where) {
  const links = keys.map((k) => {
    const f = modern[k];
    if (!f) throw new Error(`${where}: unknown feature "${k}" in _modern.yml`);
    return `<a href="${mdn(f.mdn)}" target="_blank" rel="noopener">${escHtml((f[L] || f[DEFAULT_LANG]).name)}</a>`;
  });
  return `<p class="mdn-row"><span>${ui("mdn.more")}</span> ${links.join('<span class="dot" aria-hidden="true">·</span>')}</p>`;
}

const PHOTOS = loadPhotos(CONTENT);
const usedPhotos = new Set();

function renderMarkdown(md, pageId, modern, where) {
  // Real photos, "<!-- photo: id -->" before the text they illustrate (platform/build/photos.mjs);
  // the English page sits one folder down.
  let html = marked.parse(injectPhotos(md, PHOTOS, { lang: L, root: L === DEFAULT_LANG ? "" : "../", zoom: ui("photo.zoom") }, usedPhotos));
  html = codeBlocks(html);
  html = html.replace(/<!--\s*legacy:\s*([\w-]+)\s*-->/g, (_m, k) => modernBox(modern, k, where));
  html = html.replace(/<!--\s*mdn:\s*([\w\s-]+?)\s*-->/g, (_m, ks) => mdnRow(modern, ks.split(/\s+/), where));
  // "Trampa común" / "Common trap" callouts get their own look.
  html = html.replace(/<blockquote>\s*<p><strong>(Trampa común|Common trap)(:?)<\/strong>/g, (_m, k, c) => `<blockquote class="trap"><p><strong>${k}${c}</strong>`);
  const outline = [];
  const seen = new Set();
  html = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_m, level, inner) => {
    const text = inner.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
    let id = `${pageId.replace(/\//g, "--")}--${slugify(text)}`;
    let n = 2;
    while (seen.has(id)) id = `${pageId.replace(/\//g, "--")}--${slugify(text)}-${n++}`;
    seen.add(id);
    if (level === "2") outline.push({ id, text });
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });
  html = html.replace(/<a href="(https?:[^"]+)">/g, '<a href="$1" target="_blank" rel="noopener">');
  html = html.replace(/<table>/g, '<div class="tablewrap" tabindex="0"><table>').replace(/<\/table>/g, "</table></div>");
  return { html, outline };
}

const inline = (s) => marked.parseInline(String(s));

const SEEDED_OVER = 40 * 1024;

// What the page needs to show and run an exercise.
async function shapeExercise(ex, sessionId) {
  const shaped = {
    id: ex.id,
    type: ex.type,
    section: ex.section,
    title: ex.title ? inline(ex.title) : "",
    prompt: ex.prompt ? mdBlock(ex.prompt) : "",
    starter: ex.starter !== undefined ? String(ex.starter).replace(/\n+$/, "") : "",
    hints: (ex.hints || []).map((h) => inline(h)),
    tests: ex.tests,
    scenarios: ex.scenarios,
    globals: ex.globals || null,
    world: ex.world || null,
    helpers: ex.helpers || null,
    visual: ex.visual || null,
    server: ex.server || null,
    async: !!ex.async,
    env: environment(ex, L, TRACK),
    session: sessionId,
    track: TRACK,
  };
  if (ex.solution !== undefined) {
    shaped.solution = String(ex.solution).replace(/\n+$/, "");
    shaped.solutionHtml = codeBlock(ex.solution);
  }
  if (ex.type === "predict") {
    shaped.code = String(ex.code).replace(/\n+$/, "") + "\n";
    shaped.codeHtml = codeBlock(ex.code);
    shaped.options = ex.options.map(String);
    shaped.answer = shaped.options.indexOf(String(ex.answer));
    shaped.explain = ex.explain ? mdBlock(ex.explain) : "";
  }
  if (TRACK === "sql") {
    shaped.env = null;
    shaped.setup = ex.setup || null;
    shaped.db = ex.db || null;
    shaped.tables = ex.tables || (ex.type === "judge" ? [] : tablesIn(`${ex.solution || ""} ${ex.code || ""} ${ex.starter || ""}`, L));
    if (ex.case && ["case", "mission"].includes(ex.type)) shaped.caseboard = caseSpec(ex.case, ex.id);
    if (ex.setup && /CREATE\s+TABLE/i.test(ex.setup)) shaped.ownTables = await defsOf(ex.db === "empty" ? ex.setup : ex.setup.replace(/^\s*(INSERT|UPDATE|DELETE)\b[^;]*;/gim, ""), ex.id).catch(() => null);
  }
  if (ex.type === "judge" && TRACK === "sql") {
    const H = await sqlHost();
    shaped.mode = "rows";
    shaped.sqlSpec = { schema: ex.schema, check: ex.check || null, ordered: !!ex.ordered, names: !!ex.names };
    shaped.judgeTables = createdTables(ex.schema);
    shaped.cases = H.buildCases(ex, L);
    if (JSON.stringify(shaped.cases).length > SEEDED_OVER) {
      shaped.casesCount = shaped.cases.length;
      shaped.cases = null;
      shaped.spec = Object.fromEntries(["id", "schema", "check", "ordered", "names", "samples", "edge", "random", "solution"].filter((k) => ex[k] !== undefined).map((k) => [k, ex[k]]));
      shaped.spec.samples = ex.samples;
    }
    shaped.sampleCases = (shaped.cases || H.buildCases({ ...ex, edge: [], random: null }, L)).filter((c) => c.sample);
  } else if (ex.type === "judge") {
    shaped.mode = ex.mode || "stdout";
    shaped.function = ex.function || null;
    shaped.tolerance = ex.tolerance || 0;
    shaped.judgeEnv = judgeEnv(ex);
    if (TRACK === "py") {
      shaped.cases = await pyCall("buildCases", [ex, L], 120000, ex.id);
      shaped.samplesView = shaped.cases
        .filter((c) => c.sample)
        .map((c, i) => ({
          input: c.fn ? highlightPy(c.callText) : escHtml(c.input),
          output: c.fn ? highlightPy(c.expectedText) : escHtml(c.output),
          note: ex.samples[i].note ? inline(ex.samples[i].note) : "",
        }));
    } else {
      shaped.cases = await buildCases(ex, L);
      shaped.samplesView = shaped.cases
        .filter((c) => c.sample)
        .map((c, i) => ({
          input: c.fn ? highlightJs(callText(c.fn, c.args)) : escHtml(c.input),
          output: c.fn ? highlightJs(literal(c.expected)) : escHtml(c.output),
          note: ex.samples[i].note ? inline(ex.samples[i].note) : "",
        }));
    }
    // Big generated cases don't travel in the page: it ships the seed and rebuilds them when you submit.
    if (JSON.stringify(shaped.cases).length > SEEDED_OVER) {
      shaped.casesCount = shaped.cases.length;
      shaped.cases = null;
      shaped.spec = Object.fromEntries(["id", "mode", "function", "samples", "edge", "random", "solution", "tolerance", "helpers", "server", "async", "limit", "files"].filter((k) => ex[k] !== undefined).map((k) => [k, ex[k]]));
    }
  }
  if (TRACK === "py" && ex.visual) shaped.visual = await Promise.all([].concat(ex.visual).map((v) => pyVisual(v, ex.id)));
  if (TRACK === "sql" && ex.visual) shaped.visual = await Promise.all([].concat(ex.visual).map((v) => sqlVisual(v, ex.id)));
  if (TRACK === "sql" && ex.type === "mission" && ex.answer !== undefined) {
    shaped.answerHash = answerHash(ex.answer);
    shaped.answerLabel = ex.answerLabel ? inline(ex.answerLabel) : "";
    shaped.reveal = ex.reveal ? mdBlock(ex.reveal) : "";
  }
  if (ex.type === "case") {
    shaped.answerHash = answerHash(ex.answer);
    shaped.answerLabel = ex.answerLabel ? inline(ex.answerLabel) : "";
    shaped.reveal = ex.reveal ? mdBlock(ex.reveal) : "";
  }
  return shaped;
}

// ── Python at build time: judge cases, traced animations and scene playback ──────────────
let host = null;
async function pyCall(op, args, timeout, where) {
  if (!host) host = new PyHost();
  const r = await host.call(op, args, timeout);
  if (r && r.__timeout) throw new Error(`${where}: Python took longer than ${timeout / 1000} s`);
  return r;
}

// A Python track's visuals carry what the page can't compute without Python: an animation's
// steps (a real trace of the snippet) and a scene's frames (its program played on the world).
async function pyVisualSpec(kind, spec, where) {
  if (kind === "anim" && !spec.steps) {
    const r = await pyCall("trace", [String(spec.code || ""), spec.globals || {}, !!spec.refs], 30000, where);
    return { ...spec, steps: r.steps, logs: r.logs, py: true };
  }
  if (kind === "scene" && spec.program) {
    const r = await pyCall("scene", [spec, String(spec.program), L], 30000, where);
    if (r.error) throw new Error(`${where}: the scene's program fails: ${r.error}`);
    return { ...spec, frames: r.frames };
  }
  return spec;
}
async function pyVisual(v, where) {
  const kind = Object.keys(v).find((k) => ["board", "figure", "scene", "anim", "network"].includes(k));
  return kind ? { ...v, [kind]: await pyVisualSpec(kind, v[kind], where) } : v;
}

// ── SQL at build time: query results, plans, the run-order stages, and the case files ─────────────
const VISUAL_KINDS = ["board", "figure", "scene", "anim", "network", "scope", "result", "er", "order", "join", "groups", "window", "btree", "plan", "txn", "logic", "setting", "caseboard", "dossier", "correlated", "sets", "cte", "change", "port", "recursion", "joinalgo"];
let CASES = {};
// A value written for both languages ({ es, en }) becomes this page's.
const localize = (v) => (Array.isArray(v) ? v.map(localize) : v && typeof v === "object" ? (Object.keys(v).length && Object.keys(v).every((k) => LANGS.includes(k)) ? localize(v[L] ?? v[DEFAULT_LANG]) : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, localize(x)]))) : v);
function caseSpec(id, where) {
  if (!CASES[id]) throw new Error(`${where}: unknown case "${id}" (see content/sql/_cases.yml)`);
  return localize(CASES[id]);
}
const createdTables = (schema) => [...String(schema || "").matchAll(/CREATE\s+TABLE\s+(\w+)\s*\(([^;]*)\)\s*;?/gi)].map((m) => ({ name: m[1], cols: m[2].split(",").map((c) => c.trim().split(/\s+/)).filter((c) => c[0] && !/^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT)$/i.test(c[0])).map((c) => ({ name: c[0], type: (c[1] || "").toUpperCase() })) }));
async function sqlVisualSpec(kind, spec, where) {
  spec = localize(spec);
  if (kind === "result" && !spec.result && spec.query) return { ...spec, result: await resultOf(spec, L, where) };
  if (kind === "plan" && !spec.plan && spec.query) return { ...spec, plan: await planOf(spec, L, where) };
  if (kind === "recursion" && !spec.result && spec.query) return { ...spec, result: await resultOf(spec, L, where) };
  if (kind === "order" && !spec.stages) return { ...spec, ...(await orderStages(spec, L, where)) };
  if (kind === "er" && spec.schema && !spec.defs) return { ...spec, defs: await defsOf(spec.schema, where) };
  if (kind === "change" && !spec.steps) return { ...spec, ...(await changeSteps(spec, L, where)) };
  if (kind === "er" && !spec.tables && spec.query) return { ...spec, tables: tablesIn(spec.query, L) };
  if (kind === "correlated" && !spec.subs) return { ...spec, ...(await correlatedSteps(spec, L, where)) };
  if (kind === "cte" && !spec.query) return { ...spec, ...(await cteSteps(spec, L, where)) };
  if (kind === "sets") return { ...spec, ...(await setLists(spec, L, where)) };
  if ((kind === "caseboard" || kind === "setting") && spec.case) {
    const c = caseSpec(spec.case, where);
    return kind === "setting" ? { place: c.place, marks: c.marks, ...spec } : { ...c, ...spec };
  }
  return spec;
}
async function sqlVisual(v, where) {
  v = Object.fromEntries(Object.entries(v).map(([k, x]) => [VISUALS[k] || k, x]));
  const kind = Object.keys(v).find((k) => VISUAL_KINDS.includes(k));
  return kind ? { ...v, [kind]: await sqlVisualSpec(kind, v[kind], where) } : v;
}

// ── Sessions become modules, their ## sections become steps ─────────────────────────────
// A section with an exercise to write (anything but a "predict" or a runnable example) opens in the
// Taller; every other section is a reading (Lección). So a session may have any number of readings
// before its practice: add a ## section and it becomes one more step.
const WORKSHOP_TYPES = new Set(["complete", "fix", "write", "case", "judge", "mission", "challenge"]);
const PRACTICE = new Set(["predict", "complete", "fix", "write"]);

// The "## " lines of a Markdown file, skipping fenced blocks.
function splitSections(md) {
  const out = [];
  let cur = { heading: "", lines: [] };
  let fence = false;
  for (const line of md.split("\n")) {
    if (/^```/.test(line)) fence = !fence;
    const h = !fence && line.match(/^##\s+(.*)$/);
    if (h) {
      if (cur.heading || cur.lines.some((l) => l.trim())) out.push(cur);
      cur = { heading: h[1].trim(), lines: [line] };
    } else cur.lines.push(line);
  }
  out.push(cur);
  if (out.length > 1 && !out[0].heading) {
    out[1].lines = [...out[1].lines.slice(0, 1), ...out[0].lines, ...out[1].lines.slice(1)];
    out.shift();
  }
  return out.map((s) => ({ heading: s.heading, md: s.lines.join("\n") }));
}

// Optional reading pieces a section may carry: ```goals and ```recap (YAML lists), ```idea (one sentence).
function readingBlocks(md, where) {
  const found = {};
  const rest = md.replace(/^```(goals|recap|idea)\s*\n([\s\S]*?)^```\s*$/gm, (_m, kind, body) => {
    if (kind === "idea") return `\n<p class="keyidea">${inline(body.trim())}</p>\n`;
    const list = loadYaml(body);
    if (!Array.isArray(list)) throw new Error(`${where}: a \`\`\`${kind} block must be a YAML list`);
    found[kind] = list.map((x) => inline(String(x)));
    return "";
  });
  return { md: rest, ...found };
}

const firstParagraph = (html) => {
  const m = html.match(/<p>([\s\S]*?)<\/p>/);
  if (!m) return "";
  const text = unescHtml(m[1].replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
  return text.length > 220 ? text.slice(0, 217).replace(/\s+\S*$/, "") + "…" : text;
};

function stepKind(exs) {
  for (const t of ["mission", "judge", "case", "challenge"]) if (exs.some((e) => e.type === t)) return t;
  return "practice";
}

async function buildTrack(track) {
  const modern = loadModern(CONTENT, track.id);
  const casesFile = join(CONTENT, track.id, "_cases.yml");
  CASES = existsSync(casesFile) ? loadYaml(read(casesFile)) || {} : {};
  const meta = loadCourse(track.id);
  const modules = [];
  const files = {};
  const missing = [];
  const search = [];
  for (const file of sessionFiles(CONTENT, track.id)) {
    let src = sourceFor(CONTENT, track.id, file, L, DEFAULT_LANG);
    if (!src) {
      missing.push(file);
      src = sourceFor(CONTENT, track.id, file, DEFAULT_LANG, DEFAULT_LANG);
    }
    const slug = file.replace(/\.md$/, "");
    const id = `${track.id}/${slug}`;
    const raw = read(src);
    const h1 = (raw.match(/^#\s+(.+)$/m) || [])[1];
    if (!h1) throw new Error(`${src}: needs a "# " title on its first line`);
    const { md, exercises, visuals } = extractExercises(raw.replace(/^#\s+.+\n/, ""), src, id.replace("/", "-"));
    const missions = exercises.filter((e) => e.type === "mission");
    if (missions.length !== 1) throw new Error(`${src}: a session needs exactly one mission (has ${missions.length})`);
    const m = h1.match(/^(?:Sesión|Session)\s+(\d+)\s*[—–:-]\s*(.+)$/);
    const n = m ? Number(m[1]) : modules.length + 1;

    // Step ids come from the Spanish headings, so progress is the same in every language.
    const sections = splitSections(md);
    const esHeadings = splitSections(extractExercises(read(join(CONTENT, track.id, file)).replace(/^#\s+.+\n/, ""), src, id.replace("/", "-")).md).map((s) => s.heading);
    if (esHeadings.length !== sections.length) throw new Error(`${src}: has ${sections.length} ## sections, the Spanish original has ${esHeadings.length}`);
    const seen = new Set();
    const shaped = await Promise.all(exercises.map((e) => shapeExercise(e, id)));
    const byId = new Map(shaped.map((e) => [e.id, e]));
    const lessons = [];
    const payload = { id, lessons: {}, exercises: {}, visuals: {} };
    for (const e of shaped) payload.exercises[e.id] = e;
    for (const v of visuals) payload.visuals[v.id] = { kind: v.kind, spec: TRACK === "py" ? await pyVisualSpec(v.kind, v.spec, v.id) : TRACK === "sql" ? await sqlVisualSpec(v.kind, v.spec, v.id) : v.spec };

    sections.forEach((sec, si) => {
      let lslug = slugify(esHeadings[si]) || `paso-${si + 1}`;
      while (seen.has(lslug)) lslug += "-2";
      seen.add(lslug);
      const exs = exercises.filter((e) => e.section === sec.heading);
      const vis = visuals.filter((v) => v.section === sec.heading);
      const blocks = readingBlocks(sec.md, src);
      const { html: full, outline } = renderMarkdown(blocks.md, `${id}/${lslug}`, modern, src);
      const html = full.replace(/^\s*<h2[^>]*>[\s\S]*?<\/h2>\s*/, "");
      const workshop = exs.some((e) => WORKSHOP_TYPES.has(e.type));
      const gradedExs = exs.filter((e) => e.type !== "demo");
      const items = exs.map((e) => ({ id: e.id, type: e.type, graded: e.type !== "demo", title: e.title || "", plainTitle: mdPlain(e.title || "") }));
      const words = blocks.md.replace(/```[\s\S]*?```/g, "").split(/\s+/).length;
      const lesson = { id: `${id}/${lslug}`, slug: lslug, n: si + 1, title: sec.heading, kind: workshop ? "workshop" : "lesson", items };
      if (workshop) {
        const type = stepKind(gradedExs);
        const practice = gradedExs.filter((e) => PRACTICE.has(e.type)).length;
        lesson.type = type;
        lesson.optional = type === "challenge";
        lesson.minutes = Math.round(practice * 3.5 + gradedExs.filter((e) => e.type === "case").length * 8 + gradedExs.filter((e) => e.type === "judge").length * 12 + gradedExs.filter((e) => e.type === "mission").length * 10 + gradedExs.filter((e) => e.type === "challenge").length * 12) || 5;
        lesson.activities = [
          practice && { type: "code", n: practice },
          gradedExs.some((e) => e.type === "case") && { type: "case", n: gradedExs.filter((e) => e.type === "case").length },
          gradedExs.some((e) => e.type === "judge") && { type: "judge", n: gradedExs.filter((e) => e.type === "judge").length },
          gradedExs.some((e) => e.type === "mission") && { type: "mission", n: 1 },
          gradedExs.some((e) => e.type === "challenge") && { type: "challenge", n: 1 },
        ].filter(Boolean);
        // One Taller step per graded exercise: the text before it (and the section's intro, on the first) goes with it.
        const segments = [];
        let rest = html;
        gradedExs.forEach((e, k) => {
          const tag = `<div class="ex-slot" data-ex="${e.id}"></div>`;
          const at = rest.indexOf(tag);
          if (at < 0) throw new Error(`${src}: ${e.id} is not in its section`);
          segments.push(rest.slice(0, at + tag.length));
          rest = rest.slice(at + tag.length);
          if (k === gradedExs.length - 1) segments[k] += rest;
        });
        payload.lessons[lslug] = { segments, outline };
      } else {
        const checks = exs.filter((e) => e.type === "predict").length;
        lesson.minutes = Math.max(2, Math.round(words / 200 + vis.length * 1.5 + checks * 1.5));
        lesson.activities = [{ type: "reading", n: 1 }, vis.length && { type: "figure", n: vis.length }, checks && { type: "check", n: checks }].filter(Boolean);
        payload.lessons[lslug] = { html, outline, summary: firstParagraph(html), goals: blocks.goals, recap: blocks.recap };
      }
      lessons.push(lesson);
      // What search reads: the text by heading, and each exercise's title and prompt.
      search.push({
        h: `#/c/${track.id}/${slug}/${lslug}`, t: `${m ? m[2] : h1} · ${sec.heading}`, w: `${ui(`track.${track.id}.name`)} · ${ui("module.n").replace("{n}", n)}`, ...(workshop ? { k: "w" } : {}),
        s: [...searchSections(html, { anchors: !workshop }), ...exs.filter((e) => e.type !== "demo").map((e) => ["", unescHtml(byId.get(e.id).title.replace(/<[^>]+>/g, "")), searchSections(byId.get(e.id).prompt || "").map((x) => x[2]).join(" ")])],
      });
    });

    const judges = exercises.filter((e) => e.type === "judge");
    modules.push({
      id, slug, n, title: m ? m[2] : h1,
      minutes: lessons.reduce((a, l) => a + (l.optional ? 0 : l.minutes), 0),
      file: `data/${L}/${track.id}/${slug}.json`,
      gate: { items: [missions[0].id, ...judges.map((j) => j.id)], labels: [ui("gate.mission"), ...judges.map((j) => ui("gate.judge").replace("{title}", mdPlain(j.title || "")))] },
      counts: [
        { key: "count.exercises", n: exercises.filter((e) => PRACTICE.has(e.type)).length },
        { key: "count.cases", n: exercises.filter((e) => e.type === "case").length },
        { key: "count.judges", n: judges.length },
      ].filter((x) => x.n),
      lessons,
    });
    files[`${L}/${track.id}/${slug}.json`] = payload;
  }
  const features = Object.entries(modern).map(([key, f]) => {
    const t = f[L] || f[DEFAULT_LANG];
    return {
      key,
      name: t.name,
      mdn: mdn(f.mdn),
      session: f.session || null,
      oldHtml: t.old ? codeBlock(t.old) : "",
      newHtml: t.new ? codeBlock(t.new) : "",
      note: t.note ? mdBlock(t.note) : "",
    };
  });
  files[`${L}/${track.id}/_modern.json`] = features;
  const all = modules.flatMap((x) => x.lessons);
  const exCount = (type) => modules.reduce((a, x) => a + x.lessons.reduce((b, l) => b + l.items.filter((i) => (type instanceof Set ? type.has(i.type) : i.type === type)).length, 0), 0);
  const course = {
    id: track.id,
    title: ui(`track.${track.id}.name`),
    tagline: ui(`track.${track.id}.tagline`),
    kicker: ui("course.kicker"),
    tagType: "code",
    ready: true,
    gated: true,
    outcomes: (meta[L] || meta[DEFAULT_LANG] || {}).outcomes || [],
    facts: [
      { key: "count.modules", n: modules.length },
      { key: "count.lessons", n: all.filter((l) => !l.optional).length },
      { key: "count.exercises", n: exCount(PRACTICE) },
      { key: "count.judges", n: exCount("judge") },
    ],
    minutes: modules.reduce((a, x) => a + x.minutes, 0),
    extras: [{ href: `#/c/${track.id}/modern`, title: ui("track.modern"), blurb: ui("course.extraModern"), icon: "git-compare" }],
    modules,
  };
  return { course, files, missing, search };
}

function loadCourse(track) {
  const p = join(CONTENT, track, "_course.yml");
  return existsSync(p) ? loadYaml(read(p)) : {};
}

// ── Scripts: the workers are bundled first and travel inside the page bundle as strings ─────
async function workers() {
  const worker = await esbuild.build({
    entryPoints: [join(SRC, "runner", "worker.js")],
    bundle: true, write: false, format: "iife", minify: true, target: "es2020",
  });
  const pyworker = await esbuild.build({
    entryPoints: [join(SRC, "runner", "pyworker.js")],
    bundle: true, write: false, format: "iife", minify: true, target: "es2020",
    define: { __TALLER_PY__: JSON.stringify(read(join(SRC, "runner", "py", "taller.py"))) },
  });
  const sqlworker = await esbuild.build({
    entryPoints: [join(SRC, "runner", "sqlworker.js")],
    bundle: true, write: false, format: "iife", minify: true, target: "es2020", platform: "browser",
  });
  return { __WORKER_SOURCE__: JSON.stringify(worker.outputFiles[0].text), __PYWORKER_SOURCE__: JSON.stringify(pyworker.outputFiles[0].text), __SQLWORKER_SOURCE__: JSON.stringify(sqlworker.outputFiles[0].text) };
}

const CONFIG = JSON.parse(read(join(ROOT, "site.config.json")));
const UI_ALL = strings(UI);
const data = {};
const ids = {};
const started = Date.now();
for (const lang of LANGS) {
  L = lang;
  const courses = [];
  const missing = [];
  const search = [];
  for (const t of TRACKS) {
    TRACK = t.id;
    if (!t.ready || !existsSync(join(CONTENT, t.id))) {
      courses.push({ id: t.id, title: ui(`track.${t.id}.name`), tagline: ui(`track.${t.id}.tagline`), kicker: ui("course.kicker"), ready: false, native: t.native || null, modules: [] });
      continue;
    }
    const r = await buildTrack(t);
    courses.push(r.course);
    Object.assign(data, r.files);
    search.push(...r.search);
    missing.push(...r.missing.map((f) => `${t.id}/${f}`));
  }
  data[`${lang}/search.json`] = search;
  const a = CONFIG.artifact;
  data[`${lang}/site.json`] = {
    lang,
    site: {
      id: CONFIG.id, name: CONFIG.name, prefix: CONFIG.prefix, repo: CONFIG.repo, mark: CONFIG.mark, langs: CONFIG.langs, defaultLang: CONFIG.defaultLang, version: PKG.version,
      downloads: [
        { os: "darwin", kind: "dmg-arm64", file: `${a}-mac-arm64.dmg` },
        { os: "darwin", kind: "dmg-x64", file: `${a}-mac-x64.dmg` },
        { os: "win32", kind: "setup", file: `${a}-win-x64-setup.exe` },
        { os: "win32", kind: "portable", file: `${a}-win-x64-portable.exe` },
        { os: "linux", kind: "appimage", file: `${a}-linux-x86_64.AppImage` },
        { os: "linux", kind: "deb", file: `${a}-linux-amd64.deb` },
      ],
    },
    ui: UI_ALL[lang],
    courses,
  };
  ids[lang] = courses.flatMap((c) => c.modules.flatMap((m) => [m.id, ...m.lessons.flatMap((l) => [l.id, ...l.items.map((i) => i.id)])])).join("\n");
  const nEx = courses.reduce((a2, c) => a2 + c.modules.reduce((b, m) => b + m.lessons.reduce((x, l) => x + l.items.filter((i) => i.graded).length, 0), 0), 0);
  console.log(`${lang}: ${courses.filter((c) => c.ready).map((c) => `${c.id} ${c.modules.length} sessions`).join(", ")}, ${nEx} exercises`);
  if (missing.length) console.log(`⚠ ${lang.toUpperCase()}: not translated yet, showing Spanish: ${missing.join(", ")}`);
}

// Progress is stored by module, step and exercise id, so the ids must match in every language.
for (const lang of LANGS.slice(1)) {
  if (ids[lang] !== ids[DEFAULT_LANG]) {
    const a = new Set(ids[DEFAULT_LANG].split("\n")), b = new Set(ids[lang].split("\n"));
    console.error(`✗ Ids differ between ${DEFAULT_LANG} and ${lang}. Only in ${DEFAULT_LANG}: ${[...a].filter((x) => !b.has(x)).join(", ") || "-"}. Only in ${lang}: ${[...b].filter((x) => !a.has(x)).join(", ") || "-"}`);
    process.exit(1);
  }
}
if (host) host.close();

const figProblems = figureProblems(data, [join(SRC, "course.css"), join(SRC, "sql", "sql.css")]);
if (figProblems.length) {
  console.error(`✗ Figures that do not hold on a phone:\n  ${figProblems.join("\n  ")}`);
  process.exit(1);
}

const site = await buildSite({
  root: ROOT,
  config: { ...CONFIG, iconSvg: join(ROOT, "build", "icon.svg") },
  ui: UI_ALL,
  entry: join(SRC, "main.js"),
  css: [join(SRC, "course.css"), join(SRC, "sql", "sql.css")],
  define: await workers(),
  data,
  scan: [SRC, join(ROOT, "scripts")],
});
await vendorPyodide(join(site.dist, "vendor", "pyodide"));
const photoBytes = copyPhotos(CONTENT, site.dist, PHOTOS, usedPhotos);
if (usedPhotos.size) console.log(`photos: ${usedPhotos.size} (${(photoBytes / 1048576).toFixed(1)} MB, both sizes)`);
const size = (p) => (statSync(p).size / 1024).toFixed(0);
const biggest = Object.entries(data).filter(([k]) => !k.endsWith("search.json")).map(([k, v]) => [k, JSON.stringify(v).length]).sort((a, b) => b[1] - a[1])[0];
console.log(`dist/ — shell ${size(join(site.dist, "index.html"))} KB, app.js ${size(join(site.dist, "assets", "app.js"))} KB, app.css ${size(join(site.dist, "assets", "app.css"))} KB, site.json ${size(join(site.dist, "data", "es", "site.json"))} KB, largest module ${biggest[0]} ${(biggest[1] / 1024).toFixed(0)} KB · ${Date.now() - started} ms`);
