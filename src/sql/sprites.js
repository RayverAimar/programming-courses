// Character sprites for the case files: 16×16 pixel portraits drawn as SVG, so they stay crisp at any
// size and in both themes. The same name always gets the same face; `traits` can fix any detail.
// Kinds: person, robot, chasqui (the detective's assistant), unknown (a silhouette), note.
const hash = (s) => [...String(s)].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);

const SKIN = ["#f1c9a5", "#e2b48a", "#c98e62", "#a86f47", "#86553a"];
const HAIR = ["#1f1712", "#3b2a1e", "#121212", "#5e3f25", "#7a7a7a", "#8f5426"];
const SHIRT = ["#c4553f", "#3f7cc4", "#4f9a6a", "#c49a3f", "#8a5cc4", "#c43f84", "#3fa7a7", "#5b6b7a"];
const BOT = ["#d9a441", "#6fa8dc", "#e07a5f", "#81b29a", "#b48ead", "#f2cc8f"];
const OUT = "#1d1714";

function painter() {
  const px = [];
  const p = (x, y, w, h, c) => px.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`);
  return { p, svg: () => px.join("") };
}

function person(name, tr) {
  const h = hash(name);
  const { p, svg } = painter();
  const skin = tr.skin || SKIN[h % SKIN.length];
  const hair = tr.hair || HAIR[(h >> 3) % HAIR.length];
  const shirt = tr.shirt || SHIRT[(h >> 6) % SHIRT.length];
  const style = tr.style || ["short", "long", "bun", "cap", "short", "curly"][(h >> 9) % 6];
  const glasses = tr.glasses ?? (h >> 12) % 4 === 0;
  const beard = tr.beard ?? ((style === "short" || style === "cap") && (h >> 14) % 3 === 0);
  const earrings = tr.earrings ?? ((style === "long" || style === "bun") && (h >> 16) % 2 === 0);
  p(2, 12, 12, 4, shirt); p(2, 12, 12, 1, "rgba(255,255,255,.22)"); p(6, 12, 4, 1, skin);
  if (tr.vest) { p(3, 13, 3, 3, tr.vest); p(10, 13, 3, 3, tr.vest); p(3, 14, 3, 1, "#e8e2d0"); p(10, 14, 3, 1, "#e8e2d0"); }
  if (tr.hood) { p(2, 1, 12, 11, tr.hood); p(1, 4, 1, 9, tr.hood); p(14, 4, 1, 9, tr.hood); }
  p(6, 11, 4, 1, skin);
  p(4, 4, 8, 7, skin); p(3, 6, 1, 2, skin); p(12, 6, 1, 2, skin);
  if (!tr.hood) {
    if (style === "long") { p(4, 2, 8, 3, hair); p(3, 3, 1, 9, hair); p(12, 3, 1, 9, hair); p(4, 4, 1, 2, hair); }
    else if (style === "bun") { p(6, 0, 4, 2, hair); p(4, 2, 8, 3, hair); p(3, 3, 1, 3, hair); p(12, 3, 1, 3, hair); }
    else if (style === "cap") { p(3, 2, 10, 2, tr.capColor || SHIRT[(h >> 18) % SHIRT.length]); p(3, 4, 11, 1, tr.capColor || SHIRT[(h >> 18) % SHIRT.length]); p(4, 5, 1, 1, hair); p(11, 5, 1, 1, hair); }
    else if (style === "curly") { p(3, 2, 10, 3, hair); p(3, 1, 2, 1, hair); p(7, 1, 2, 1, hair); p(11, 1, 2, 1, hair); p(3, 5, 1, 2, hair); p(12, 5, 1, 2, hair); }
    else { p(4, 2, 8, 2, hair); p(3, 3, 1, 3, hair); p(12, 3, 1, 3, hair); p(4, 4, 2, 1, hair); }
  }
  p(6, 7, 1, 1, OUT); p(9, 7, 1, 1, OUT);
  if (glasses) { p(5, 6, 3, 3, "rgba(255,255,255,.18)"); p(8, 6, 3, 3, "rgba(255,255,255,.18)"); p(5, 6, 3, 1, OUT); p(8, 6, 3, 1, OUT); p(5, 8, 3, 1, OUT); p(8, 8, 3, 1, OUT); p(5, 6, 1, 3, OUT); p(10, 6, 1, 3, OUT); }
  if (beard) { p(5, 9, 6, 2, hair); p(7, 9, 2, 1, "#9c4a3a"); } else p(7, 9, 2, 1, "#9c4a3a");
  if (earrings) { p(3, 8, 1, 1, "#e9c46a"); p(12, 8, 1, 1, "#e9c46a"); }
  if (tr.tool) { p(11, 13, 4, 3, "#b23a2e"); p(12, 12, 2, 1, "#6d6d6d"); }
  return svg();
}

function robot(name, tr, chasqui = false) {
  const h = hash(name);
  const { p, svg } = painter();
  const body = tr.color || (chasqui ? "#d9822b" : BOT[h % BOT.length]);
  const eye = tr.eye || (chasqui ? "#7fe3ff" : ["#7fe3ff", "#b6ff7f", "#ffd27f", "#ff9f7f"][(h >> 4) % 4]);
  p(7, 0, 2, 2, OUT); p(7, 0, 2, 1, chasqui ? "#ffcf5c" : eye);
  p(7, 2, 2, 1, "#5a5149");
  p(3, 3, 10, 8, body); p(3, 3, 10, 1, "rgba(255,255,255,.3)"); p(3, 10, 10, 1, "rgba(0,0,0,.18)");
  p(4, 5, 8, 3, OUT); p(5, 6, 2, 1, eye); p(9, 6, 2, 1, eye);
  p(6, 9, 4, 1, "rgba(0,0,0,.35)");
  p(2, 6, 1, 3, "#5a5149"); p(13, 6, 1, 3, "#5a5149");
  p(4, 12, 8, 4, body); p(4, 12, 8, 1, "rgba(0,0,0,.18)"); p(6, 13, 4, 2, "#f4efe2");
  if (chasqui) {
    p(2, 2, 12, 2, "#6b4a2b"); p(4, 1, 8, 1, "#6b4a2b"); p(1, 3, 2, 1, "#6b4a2b"); p(13, 3, 2, 1, "#6b4a2b"); p(4, 2, 8, 1, "#8a6a45");
    p(12, 12, 3, 3, "rgba(127,227,255,.35)"); p(12, 12, 3, 1, OUT); p(12, 14, 3, 1, OUT); p(12, 12, 1, 3, OUT); p(14, 12, 1, 3, OUT); p(11, 15, 1, 1, "#6b4a2b");
  }
  if (tr.broken) { p(9, 12, 3, 3, OUT); p(10, 13, 1, 1, "#e07a5f"); }
  return svg();
}

function unknown() {
  const { p, svg } = painter();
  p(4, 2, 8, 9, "#5b5f66"); p(3, 4, 1, 6, "#5b5f66"); p(12, 4, 1, 6, "#5b5f66"); p(2, 12, 12, 4, "#5b5f66");
  p(7, 4, 2, 1, "#e8e2d0"); p(9, 5, 1, 2, "#e8e2d0"); p(8, 7, 1, 1, "#e8e2d0"); p(8, 9, 1, 1, "#e8e2d0");
  return svg();
}

function note(color) {
  const { p, svg } = painter();
  p(3, 1, 10, 14, "#f4efe2"); p(10, 1, 3, 3, "#d9d0bb"); p(3, 15, 10, 1, "#c9bfa8");
  for (const y of [5, 7, 9, 11]) p(5, y, y === 11 ? 4 : 6, 1, color || "#8a7f6a");
  return svg();
}

// An SVG string. `size` is in CSS pixels; `label` makes it an image for screen readers.
export function sprite(kind, name, { size = 48, traits = {}, label = "" } = {}) {
  const k = kind || "person";
  const body = k === "robot" ? robot(name, traits) : k === "chasqui" ? robot("Chasqui", traits, true) : k === "unknown" ? unknown() : k === "note" ? note(traits.color) : person(name, traits);
  const a11y = label ? `role="img" aria-label="${String(label).replace(/"/g, "&quot;")}"` : 'aria-hidden="true"';
  return `<svg class="sprite sprite-${k}" viewBox="0 0 16 16" width="${size}" height="${size}" shape-rendering="crispEdges" ${a11y}>${body}</svg>`;
}
