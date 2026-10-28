// What the build can check about the figures without a browser: text in the pixel-art scenes is
// readable on a phone, a parallel-lanes spec has what its phone layout lists, and no figure CSS
// asks for more than a phone is wide or for text under the minimum. Layout that only exists in the
// browser (wrapping, overlaps between the DOM panes) is looked at with screenshots, not here.
import { readFileSync } from "node:fs";
import { PHONE, phoneText } from "../../platform/build/figkit.mjs";
import { sceneSvg, placeNames } from "../../src/sql/scenes.js";

const CONTENT_PX = PHONE.viewport - 2 * 16;
const REM = 16;

function sceneProblems() {
  const out = [];
  for (const lang of ["es", "en"]) for (const place of placeNames) {
    const { px, text } = phoneText(sceneSvg(place, { lang, marks: [{ at: [80, 48] }] }), CONTENT_PX);
    if (px < PHONE.min) out.push(`scene ${place} (${lang}): "${text}" reads ${px} px on a phone, under ${PHONE.min}`);
  }
  return out;
}

const clock = (v) => { const m = String(v).match(/^(\d+):(\d{2})(?::(\d{2}))?$/); return m ? Number(m[1]) * 60 + Number(m[2]) + (m[3] ? Number(m[3]) / 60 : 0) : NaN; };

function lanesProblems(where, l) {
  const out = [];
  const from = clock(l.from);
  const at = (v) => { const x = clock(v); return x < from ? x + 1440 : x; };
  const to = at(l.to);
  if (Number.isNaN(from) || Number.isNaN(to) || to <= from) return [`${where}: lanes need "from" and "to" as HH:MM with from before to`];
  if (!(l.rows || []).length) out.push(`${where}: lanes without rows`);
  const inside = (v) => at(v) >= from && at(v) <= to;
  for (const r of l.rows || []) {
    if (!r.label) out.push(`${where}: a lanes row has no label`);
    for (const b of r.bars || []) {
      if (Number.isNaN(clock(b.from)) || Number.isNaN(clock(b.to)) || at(b.to) < at(b.from)) out.push(`${where}: bar "${b.label}" has bad times`);
      else if (!inside(b.from) || !inside(b.to)) out.push(`${where}: bar "${b.label}" leaves the axis ${l.from}-${l.to}`);
      if (!b.label) out.push(`${where}: a bar of "${r.label}" has no label (the phone layout lists labels)`);
    }
    for (const e of r.events || []) {
      if (Number.isNaN(clock(e.at)) || !inside(e.at)) out.push(`${where}: event "${e.label}" is outside the axis ${l.from}-${l.to}`);
      if (!e.label) out.push(`${where}: an event of "${r.label}" has no label (the phone layout lists labels)`);
    }
  }
  for (const b of l.bands || []) if (!inside(b.from) || !inside(b.to)) out.push(`${where}: band "${b.label || ""}" leaves the axis`);
  return out;
}

function walk(o, f, path = "") {
  if (!o || typeof o !== "object") return;
  if (Array.isArray(o)) return o.forEach((x, i) => walk(x, f, `${path}[${i}]`));
  if (o.lanes && typeof o.lanes === "object" && !Array.isArray(o.lanes)) f(path, o.lanes);
  for (const [k, v] of Object.entries(o)) walk(v, f, `${path}.${k}`);
}

// Rules that may be wider than a phone or smaller than the minimum, and why.
const WIDE_OK = [
  [/\.ln-in\b/, "hidden below 560 px: the lanes list their items instead"],
  [/(^|[ ,])\.?(rt-t|rt-scroll|vt|tablewrap|lg)\b/, "a data table, which scrolls inside its own frame"],
];
const SMALL_OK = [
  [/\.sc-/, "drawn in the scene's viewBox units, checked above"],
];

function cssProblems(files) {
  const out = [];
  for (const file of files) {
    const css = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    const name = file.split("/").slice(-2).join("/");
    const stack = [];
    let buf = "";
    for (const ch of css) {
      if (ch === "{") { stack.push(buf.trim()); buf = ""; }
      else if (ch === "}") {
        const body = buf; buf = "";
        const sel = stack.pop();
        if (/^@(media|container|supports|keyframes)/.test(sel)) continue;
        if (!body.includes(":")) continue;
        const wrapped = stack.some((s) => /^@(media|container)[^{]*\(min-width/.test(s));
        if (/@keyframes/.test(stack.join())) continue;
        for (const d of body.split(";")) {
          const mw = d.match(/^\s*min-width:\s*([\d.]+)(px|rem|em)\s*$/);
          if (mw && !wrapped) {
            const px = Number(mw[1]) * (mw[2] === "px" ? 1 : REM);
            if (px > CONTENT_PX && !WIDE_OK.some(([re]) => re.test(sel))) out.push(`${name}: "${sel}" asks min-width ${mw[1]}${mw[2]}, wider than a ${PHONE.viewport} px phone's content (${CONTENT_PX} px)`);
          }
          const fs = d.match(/^\s*font(?:-size)?:[^;]*?(?:^|\s)([\d.]+)px(?:\/|\s|$)/);
          if (fs && Number(fs[1]) < PHONE.min && !SMALL_OK.some(([re]) => re.test(sel))) out.push(`${name}: "${sel}" sets text at ${fs[1]} px, under ${PHONE.min}; use the --ch-fs-* tokens`);
        }
      } else buf += ch;
    }
  }
  return out;
}

// data: the built files ({ "es/sql/05-joins.json": { visuals, exercises } … }); css: the figure stylesheets.
export function figureProblems(data, css) {
  const out = [...sceneProblems(), ...cssProblems(css)];
  for (const [file, j] of Object.entries(data)) {
    if (!/\.json$/.test(file) || !j || !j.visuals) continue;
    walk(j.visuals, (p, l) => out.push(...lanesProblems(`${file}${p}`, l)));
    walk(j.exercises, (p, l) => out.push(...lanesProblems(`${file}${p}`, l)));
  }
  return out;
}
