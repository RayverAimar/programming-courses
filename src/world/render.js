// Draws a world on a canvas with 16×16 pixel-art sprites, scaled without smoothing, and plays a
// run back frame by frame. Colours come from CSS variables, so every scene works in both themes.
import { parseMap } from "./engine.js";
import { icon } from "../../platform/web/core/dom.js";

const SPR = 16;
const OUT = "#15120e";
let cache = new Map();
let cacheKey = "";

const css = (el, name) => getComputedStyle(el).getPropertyValue(name).trim();

function shade(col, f) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(col).trim());
  if (!m) return col;
  const n = parseInt(m[1], 16);
  const adj = (v) => Math.max(0, Math.min(255, Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1))));
  return `#${[n >> 16, (n >> 8) & 255, n & 255].map((v) => adj(v).toString(16).padStart(2, "0")).join("")}`;
}
const hash = (x, y, k = 0) => {
  let h = (x * 374761393 + y * 668265263 + k * 982451653) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

function sprite(id, paint) {
  let c = cache.get(id);
  if (!c) {
    c = document.createElement("canvas");
    c.width = c.height = SPR;
    const g = c.getContext("2d");
    paint((x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); });
    cache.set(id, c);
  }
  return c;
}
function blit(g, spr, x, y, s) {
  g.imageSmoothingEnabled = false;
  g.drawImage(spr, x, y, s, s);
}

// ── Tiles ────────────────────────────────────────────────────────────────
function floor(g, P, theme, x, y, s) {
  const v = Math.floor(hash(x, y) * 4);
  blit(g, sprite(`f${theme}${v}${theme === "cocina" ? (x + y) % 2 : ""}`, (p) => {
    const f = P.floor, dk = shade(f, 0.9), lt = shade(f, 1.06);
    if (theme === "barranco") {
      p(0, 0, 16, 16, f);
      const joint = shade(f, 0.92);
      for (const b of [0, 8]) p(0, b, 16, 1, joint);
      p(5 + (v % 2) * 2, 1, 1, 7, joint); p(12 - v, 9, 1, 7, joint);
      p(2 + v, 3, 2, 1, lt); p(9, 12 - (v % 2), 2, 1, lt);
    } else if (theme === "museo") {
      p(0, 0, 16, 16, f);
      for (let i = 0; i < 4; i++) p(0, i * 4 + 3, 16, 1, dk);
      for (let i = 0; i < 4; i++) p(((i * 5 + v * 3) % 14) + 1, i * 4, 1, 3, dk);
      p(3 + v, 1, 3, 1, lt);
    } else if (theme === "cocina") {
      const odd = (x + y) % 2;
      p(0, 0, 16, 16, odd ? shade(f, 0.93) : f);
      p(0, 15, 16, 1, shade(f, 0.82)); p(15, 0, 1, 16, shade(f, 0.82));
      if (!odd) p(3, 3, 2, 1, lt);
    } else {
      p(0, 0, 16, 16, f);
      for (let i = 0; i < 7; i++) p(Math.floor(hash(v, i, 1) * 15), Math.floor(hash(v, i, 2) * 15), 1 + (i % 2), 1, i % 2 ? dk : lt);
    }
  }), x * s, y * s, s);
}

function wall(g, P, theme, x, y, s, tiles) {
  const solid = (a, b) => b < 0 || a < 0 || b >= tiles.length || a >= tiles[0].length || tiles[b][a] === "#";
  const n = solid(x, y - 1), so = solid(x, y + 1), e = solid(x + 1, y), w = solid(x - 1, y);
  const v = Math.floor(hash(x, y, 3) * 3);
  if (theme === "barranco") return house(g, P, x, y, s, { n, so, e, w, v });
  blit(g, sprite(`w${theme}${+n}${+so}${+e}${+w}${v}`, (p) => {
    const face = P.wall, top = P.wallTop, k = shade(face, 0.5), lt = shade(top, 1.14), dk = shade(top, 0.88), mortar = shade(face, 0.78);
    p(0, 0, 16, 16, top);
    if (theme === "mina") for (const [a, b] of [[3 + v, 3], [10 - v, 6], [5, 8 - v]]) p(a, b, 3, 2, dk);
    else for (const [a, b] of [[3 + v, 3], [10 - v, 6]]) p(a, b, 2, 1, dk);
    p(9 + v, 2, 1, 1, lt);
    if (!so) {
      p(0, 9, 16, 7, face);
      p(0, 9, 16, 1, shade(top, 1.05));
      if (theme === "cocina") { p(0, 12, 16, 1, mortar); p(4, 10, 1, 2, mortar); p(11, 13, 1, 2, mortar); }
      else { p(0, 12, 16, 1, mortar); for (const a of [3 + v, 11 + v]) p(a % 16, 10, 1, 2, mortar); p(7, 13, 1, 2, mortar); }
      p(0, 15, 16, 1, k);
    }
    if (!n) { p(0, 0, 16, 1, k); p(0, 1, 16, 1, lt); }
    if (!w) p(0, 0, 1, 16, k);
    if (!e) p(15, 0, 1, 16, k);
  }), x * s, y * s, s);
}

// Barranco from above: each 2×2 lot is one house with its own muted roof; a seam where two
// houses meet, and a façade with a window or a door wherever the street is below.
const lotOf = (x, y) => Math.floor(hash(Math.floor(x / 2), Math.floor(y / 2), 9) * 4);
function house(g, P, x, y, s, { n, so, e, w, v }) {
  const lot = lotOf(x, y);
  const seamN = n && lotOf(x, y - 1) !== lot, seamW = w && lotOf(x - 1, y) !== lot;
  const doorHere = hash(x, y, 11) < 0.35;
  blit(g, sprite(`h${lot}${+n}${+so}${+e}${+w}${+seamN}${+seamW}${+doorHere}${v}`, (p) => {
    const roof = P.roofs[lot], ridge = shade(roof, 0.9), hi = shade(roof, 1.1), edge = shade(roof, 0.62);
    p(0, 0, 16, 16, roof);
    for (const r of [3, 7, 11]) p(0, r, 16, 1, ridge);
    p(2 + v * 4, 1, 3, 1, hi);
    if (!so) {
      const face = P.facade, fdk = shade(face, 0.8);
      p(0, 11, 16, 5, face);
      p(0, 11, 16, 1, edge);
      if (doorHere) { p(6, 12, 4, 4, P.door); p(9, 14, 1, 1, "#e5c15a"); }
      else { p(3, 12, 3, 2, P.window); p(10, 12, 3, 2, P.window); p(3, 14, 3, 1, fdk); p(10, 14, 3, 1, fdk); }
    }
    if (!n) p(0, 0, 16, 1, edge);
    if (!w) p(0, 0, 1, 16, edge);
    if (!e) p(15, 0, 1, 16, edge);
    if (seamN) p(0, 0, 16, 1, edge);
    if (seamW) p(0, 0, 1, 16, edge);
  }), x * s, y * s, s);
}

function goal(g, P, x, y, s, done) {
  blit(g, sprite(`goal${done}`, (p) => {
    p(2, 2, 12, 12, P.mat); p(3, 3, 10, 10, shade(P.mat, 1.2)); p(2, 13, 12, 1, shade(P.mat, 0.6));
    p(11, 1, 1, 9, OUT); p(9, 2, 4, 3, P.accent); p(9, 2, 4, 1, shade(P.accent, 1.4));
    if (done) { p(5, 6, 5, 4, "#c99a5b"); p(5, 6, 5, 1, "#e2bd86"); p(7, 6, 1, 4, "#8a6233"); }
  }), x * s, y * s, s);
}

function door(g, P, x, y, s, open, alarm, t) {
  blit(g, sprite(`door${open}`, (p) => {
    p(0, 0, 16, 16, shade(P.wall, 0.6));
    if (open) { p(2, 0, 12, 16, "#0d0b09"); p(2, 0, 2, 16, P.doorWood); }
    else { p(2, 0, 12, 16, P.doorWood); p(2, 0, 12, 1, shade(P.doorWood, 1.3)); p(7, 0, 1, 16, shade(P.doorWood, 0.7)); p(11, 8, 1, 2, "#e5c15a"); }
  }), x * s, y * s, s);
  if (alarm && Math.floor(t / 300) % 2 === 0) {
    g.fillStyle = "rgba(230, 50, 40, .38)";
    g.fillRect(x * s, y * s, s, s);
  }
}

function item(g, P, x, y, s, c) {
  blit(g, sprite(`item${c}`, (p) => {
    if (c === "k") {
      p(3, 5, 5, 5, "#c9a227"); p(4, 6, 3, 3, shade(P.floor, 0.9)); p(8, 7, 6, 2, "#c9a227"); p(11, 9, 1, 2, "#c9a227"); p(13, 9, 1, 2, "#c9a227"); p(3, 5, 5, 1, "#ecd27a");
      return;
    }
    const col = ["#c99a5b", "#6f9bd1", "#d4675a", "#7fb069", "#b98bd1"][(c.charCodeAt(0) - 97) % 5];
    p(3, 4, 10, 10, shade(col, 0.6)); p(3, 4, 10, 9, col); p(3, 4, 10, 2, shade(col, 1.25)); p(7, 4, 2, 9, shade(col, 0.75));
  }), x * s, y * s, s);
  if (c !== "k") label(g, P, c, x * s + s - 2, y * s + s - 2, s);
}

function padlock(g, x, y, s) {
  blit(g, sprite("lock", (p) => {
    p(5, 3, 6, 1, "#9aa1a8"); p(4, 4, 1, 4, "#9aa1a8"); p(11, 4, 1, 4, "#9aa1a8");
    p(3, 8, 10, 6, "#c9a227"); p(3, 8, 10, 1, "#ecd27a"); p(7, 10, 2, 2, "#3a2a10");
  }), x * s, y * s, s);
}

function intruder(g, x, y, s, t) {
  const bob = Math.floor(t / 400) % 2;
  blit(g, sprite(`intr${bob}`, (p) => {
    p(5, 4 + bob, 6, 5, "#26222b"); p(4, 8 + bob, 8, 6, "#26222b"); p(6, 6 + bob, 1, 1, "#f2f0ea"); p(9, 6 + bob, 1, 1, "#f2f0ea");
    p(3, 9 + bob, 1, 3, "#26222b"); p(12, 9 + bob, 1, 3, "#26222b");
  }), x * s, y * s, s);
}

function crystal(g, P, x, y, s, v, t) {
  const n = Math.min(3, v), f = (Math.floor(t / 280) + Math.floor(hash(x, y, 7) * 6)) % 6 === 0 ? 1 : 0;
  blit(g, sprite(`cr${n}${f}`, (p) => {
    const c = P.crystal, hi = P.crystalHi, dk = shade(c, 0.6), k = shade(c, 0.32);
    const shard = (ox, oy, h) => {
      p(ox + 1, oy, 2, 1, k);
      for (let i = 1; i < h - 1; i++) {
        const top = i < h / 2;
        p(ox, oy + i, 1, 1, k); p(ox + 3, oy + i, 1, 1, k);
        p(ox + 1, oy + i, 1, 1, top ? hi : c); p(ox + 2, oy + i, 1, 1, top ? c : dk);
      }
      p(ox + 1, oy + h - 1, 2, 1, k);
    };
    if (n === 1) shard(6, 3, 11);
    if (n === 2) { shard(3, 6, 8); shard(8, 2, 12); }
    if (n === 3) { shard(1, 7, 7); shard(6, 2, 12); shard(11, 6, 8); }
    if (f) { p(13, 1, 1, 3, hi); p(12, 2, 3, 1, hi); }
  }), x * s, y * s, s);
  if (v > 3) label(g, P, String(v), x * s + s - 2, y * s + s - 3, s);
}

function label(g, P, text, x, y, s) {
  g.font = `700 ${Math.max(10, Math.round(s * 0.34))}px "Bricolage Grotesque", sans-serif`;
  g.textAlign = "right";
  g.textBaseline = "alphabetic";
  g.lineWidth = 3;
  g.strokeStyle = P.floor;
  g.strokeText(text, x, y);
  g.fillStyle = P.ink;
  g.fillText(text, x, y);
}

function stove(g, P, x, y, s) {
  blit(g, sprite("stove", (p) => {
    p(1, 1, 14, 14, "#3b3f44"); p(2, 2, 12, 12, "#565c63");
    p(3, 3, 4, 4, "#1d1f22"); p(9, 3, 4, 4, "#1d1f22"); p(3, 9, 4, 4, "#1d1f22"); p(9, 9, 4, 4, "#1d1f22");
    p(4, 4, 2, 2, "#e0603c"); p(10, 10, 2, 2, "#e0603c");
    p(8, 8, 6, 5, "#b9bec4"); p(8, 8, 6, 1, "#e3e6ea"); p(7, 9, 1, 1, "#b9bec4"); p(14, 9, 1, 1, "#b9bec4");
  }), x * s, y * s, s);
}

function table(g, P, x, y, s, n, dish) {
  blit(g, sprite(`tbl${dish ? 1 : 0}`, (p) => {
    p(1, 2, 14, 12, shade(P.tableWood, 0.6)); p(2, 2, 12, 10, P.tableWood); p(2, 2, 12, 1, shade(P.tableWood, 1.25));
    if (dish) { p(5, 5, 6, 4, "#f4f1ea"); p(6, 6, 4, 2, "#f0c24b"); p(7, 6, 1, 1, "#d6e9a8"); }
  }), x * s, y * s, s);
  label(g, P, String(n), x * s + s - 2, y * s + s - 2, s);
}

// The robot grows with the track: a cargo box, then a siren, a headlamp, a serving arm.
export function robot(P, dir, level, carry, step, eyesOn) {
  return sprite(`bot${P.robot}${dir}${level}${carry ? 1 : 0}${step}${eyesOn}`, (p) => {
    const C = P.robot, Cd = shade(C, 0.68), Cl = shade(C, 1.3), g1 = "#a29d93", g2 = "#5b5750";
    p(8, 1, 1, 1, OUT);
    p(7, 0, 2, 1, level >= 2 ? "#e2413a" : Cl);
    if (level >= 2) { p(6, 0, 1, 1, "#e2413a"); p(9, 0, 1, 1, "#e2413a"); }
    p(4, 2, 8, 1, OUT); p(3, 3, 1, 4, OUT); p(12, 3, 1, 4, OUT); p(4, 7, 8, 1, OUT);
    p(4, 3, 8, 4, Cl); p(5, 4, 6, 2, OUT);
    const [ox, oy] = { N: [0, 0], S: [0, 1], E: [1, 0], W: [-1, 0] }[dir] || [0, 1];
    if (eyesOn) { p(6 + ox, 4 + oy, 1, 1, "#f6f3ec"); p(9 + ox, 4 + oy, 1, 1, "#f6f3ec"); }
    else { p(6, 5, 2, 1, "#8d887f"); p(9, 5, 2, 1, "#8d887f"); }
    if (level >= 3) { p(3, 3, 1, 2, "#f5d76e"); p(12, 3, 1, 2, "#f5d76e"); }
    p(2, 8, 12, 1, OUT); p(2, 8, 1, 5, OUT); p(13, 8, 1, 5, OUT);
    p(3, 9, 10, 4, C); p(3, 9, 10, 1, Cl); p(3, 12, 10, 1, Cd);
    if (level === 1 || carry) { p(5, 9, 6, 3, carry ? "#f4f1ea" : "#c99a5b"); p(5, 9, 6, 1, carry ? "#ffffff" : "#e2bd86"); if (!carry) p(7, 9, 2, 3, "#8a6233"); else p(7, 10, 2, 1, "#f0c24b"); }
    else { p(5, 10, 1, 2, Cd); p(7, 10, 1, 2, Cd); p(9, 10, 1, 2, Cd); }
    if (level >= 4) { p(0, 9, 2, 1, g2); p(0, 8, 1, 1, g1); p(14, 9, 2, 1, g2); p(15, 8, 1, 1, g1); }
    else { p(1, 9, 1, 3, g2); p(14, 9, 1, 3, g2); }
    p(2, 13, 12, 3, OUT); p(3, 14, 10, 1, g2);
    for (let i = 0; i < 5; i++) p(3 + 2 * i + step, 14, 1, 1, g1);
  });
}

function bubble(g, P, text, cx, top, s, W) {
  if (!text) return;
  const fs = Math.max(11, Math.round(s * 0.36));
  g.font = `600 ${fs}px "Bricolage Grotesque", sans-serif`;
  const shown = text.length > 34 ? text.slice(0, 33) + "…" : text;
  const w = g.measureText(shown).width + fs;
  const h = fs * 1.7;
  const x = Math.max(2, Math.min(W - w - 2, cx - w / 2));
  const y = Math.max(2, top - h - 4);
  g.fillStyle = P.bubble;
  g.beginPath();
  g.roundRect(x, y, w, h, h / 2);
  g.fill();
  g.fillStyle = P.bubbleInk;
  g.textAlign = "left";
  g.textBaseline = "middle";
  g.fillText(shown, x + fs / 2, y + h / 2 + 1);
}

export function palette(el) {
  const v = (n) => css(el, n);
  return {
    floor: v("--w-floor"), wall: v("--w-wall"), roofs: [1, 2, 3, 4].map((i) => v(`--w-roof-${i}`) || "#9a8f80"),
    facade: v("--w-facade") || "#e6dccb", door: v("--w-door") || "#7a4b2a",
    wallTop: v("--w-wall-top"), window: v("--w-window") || "#9fc4d8", mat: v("--w-mat") || "#a5553a", accent: v("--accent"),
    doorWood: v("--w-door") || "#7a4b2a", crystal: v("--w-crystal"), crystalHi: v("--w-crystal-hi"), robot: v("--w-robot"),
    tableWood: v("--w-table") || "#a8794e", ink: v("--ink"), bubble: v("--ink"), bubbleInk: v("--paper"),
  };
}

// Draws one moment: frame b, with the robot part of the way (0..1) from frame a.
export function drawWorld(canvas, map, a, b, progress, t = performance.now(), trail = [], opts = {}) {
  const host = canvas.parentElement;
  const P = palette(host);
  const key = Object.values(P).join("|");
  if (key !== cacheKey) { cache = new Map(); cacheKey = key; }
  const cs = getComputedStyle(host);
  const avail = Math.max(160, host.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
  const s = Math.max(14, Math.min(44, Math.floor(avail / map.w)));
  const dpr = window.devicePixelRatio || 1;
  const W = map.w * s, H = map.h * s;
  if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
  }
  const g = canvas.getContext("2d");
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);
  const theme = map.theme;
  const servedAt = {};
  const tableAt = {};
  for (const [k, n] of Object.entries(map.tables)) tableAt[n] = k;
  for (const sv of b.served) servedAt[tableAt[sv.table]] = sv.dish;
  for (let y = 0; y < map.h; y++) {
    for (let x = 0; x < map.w; x++) {
      const tile = map.tiles[y][x];
      const k = `${x},${y}`;
      if (tile === "#") { wall(g, P, theme, x, y, s, map.tiles); continue; }
      floor(g, P, theme, x, y, s);
      if (tile === "D") goal(g, P, x, y, s, b.delivered > 0 ? 1 : 0);
      if (b.marks && b.marks.includes(k)) {
        g.fillStyle = P.accent;
        g.globalAlpha = 0.28;
        g.fillRect(x * s + 1, y * s + 1, s - 2, s - 2);
        g.globalAlpha = 1;
      }
      if (tile === "P") {
        door(g, P, x, y, s, b.doors[k] === "open", b.alarms.includes(k), t);
        if (b.doors[k] === "locked") padlock(g, x, y, s);
      }
      if (b.items && b.items[k]) item(g, P, x, y, s, b.items[k]);
      if (tile === "K") stove(g, P, x, y, s);
      if (tile === "T") table(g, P, x, y, s, map.tables[k], servedAt[k]);
      if (map.motion.includes(k)) intruder(g, x, y, s, t);
      if (b.crystals[k]) crystal(g, P, x, y, s, b.crystals[k], t);
      // Walls cast a short shadow on the floor below and to the right of them.
      g.fillStyle = "rgba(0, 0, 0, .16)";
      if (y > 0 && map.tiles[y - 1][x] === "#") g.fillRect(x * s, y * s, s, Math.max(2, s * 0.14));
      if (x > 0 && map.tiles[y][x - 1] === "#") g.fillRect(x * s, y * s, Math.max(2, s * 0.1), s);
    }
  }
  if (opts.fog) {
    const r = opts.vision ?? 1;
    const seen = new Set();
    for (const [px, py] of trail) {
      const cx = Math.round(px), cy = Math.round(py);
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) seen.add(`${cx + dx},${cy + dy}`);
    }
    g.fillStyle = "rgba(12, 10, 8, .82)";
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) if (!seen.has(`${x},${y}`)) g.fillRect(x * s, y * s, s, s);
  }
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [sx, sy] = map.start;
  g.strokeStyle = P.ink;
  g.globalAlpha = 0.4;
  g.lineWidth = Math.max(1.5, s * 0.05);
  g.setLineDash([s * 0.12, s * 0.1]);
  g.strokeRect(sx * s + s * 0.1, sy * s + s * 0.1, s * 0.8, s * 0.8);
  g.setLineDash([]);
  g.globalAlpha = 1;
  if (map.goal) {
    const [gx, gy] = map.goal;
    const pulse = reduce ? 0.5 : (Math.sin(t / 380) + 1) / 2;
    g.strokeStyle = P.accent;
    g.lineWidth = Math.max(2, s * 0.07);
    g.globalAlpha = 0.45 + pulse * 0.4;
    g.beginPath();
    g.arc(gx * s + s / 2, gy * s + s / 2, s * (0.56 + pulse * 0.1), 0, Math.PI * 2);
    g.stroke();
    g.globalAlpha = 1;
  }
  if (trail.length > 1) {
    g.strokeStyle = P.accent;
    g.globalAlpha = 0.55;
    g.lineWidth = Math.max(2, s * 0.08);
    g.lineJoin = "round";
    g.lineCap = "round";
    g.setLineDash([s * 0.04, s * 0.16]);
    g.beginPath();
    trail.forEach(([px, py], i) => (i ? g.lineTo : g.moveTo).call(g, px * s + s / 2, py * s + s / 2));
    g.stroke();
    g.setLineDash([]);
    g.globalAlpha = 1;
  }
  const e = progress < 1 ? 1 - Math.pow(1 - progress, 3) : 1;
  const rx = a.robot.x + (b.robot.x - a.robot.x) * e;
  const ry = a.robot.y + (b.robot.y - a.robot.y) * e;
  const moving = progress < 1 && (a.robot.x !== b.robot.x || a.robot.y !== b.robot.y);
  const step = moving ? Math.floor(progress * 4) % 2 : Math.floor(t / 500) % 2 && 0;
  let ox = 0, oy = 0;
  if (b.crashed && progress >= 0.5) { ox = Math.sin(t / 30) * s * 0.04; }
  blit(g, robot(P, b.robot.dir, b.robot.level, b.robot.carry, step, !b.crashed), rx * s + ox, ry * s + oy, s);
  bubble(g, P, b.say, rx * s + s / 2, ry * s, s, W);
}

// A map with its playback controls. `frames` replaces the run; without frames it shows the start.
export class Player {
  constructor(host, worldConfig, labels) {
    this.host = host;
    this.labels = labels;
    this.config = worldConfig;
    this.setMap(worldConfig.map);
    host.innerHTML = `<div class="scene" data-scene="${this.map.theme}">
        <div class="scene-c"><canvas role="img" aria-label="${labels.aria}"></canvas></div>
        <div class="scene-bar">
          <button class="pbtn" data-a="play" aria-label="${labels.play}" data-tip="${labels.play}" disabled>${ICON.play}</button>
          <button class="pbtn" data-a="restart" aria-label="${labels.restart}" data-tip="${labels.restart}" disabled>${ICON.restart}</button>
          <span class="pstat" aria-live="polite"></span>
          <span class="pspeed" role="group" aria-label="${labels.speed}">
            ${[1, 2, 4].map((n) => `<button data-s="${n}" aria-pressed="${n === 1}" data-tip="${labels.speed} ${n}×">${n}×</button>`).join("")}
          </span>
        </div>
      </div>`;
    this.canvas = host.querySelector("canvas");
    this.stat = host.querySelector(".pstat");
    this.speed = 1;
    this.reset();
    host.querySelector(".scene-bar").addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.s) {
        this.speed = Number(b.dataset.s);
        for (const x of host.querySelectorAll(".pspeed button")) x.setAttribute("aria-pressed", String(x === b));
      } else if (b.dataset.a === "play") this.playing ? this.pause() : this.play();
      else if (b.dataset.a === "restart") { this.i = 0; this.play(); }
    });
    PLAYERS.add(this);
  }

  setMap(mapText) {
    this.map = parseMap({ ...this.config, map: mapText });
  }

  // The scene before anything runs.
  reset(mapText) {
    if (mapText) this.setMap(mapText);
    const m = this.map;
    const start = {
      robot: { x: m.start[0], y: m.start[1], dir: this.config.dir === "O" ? "W" : this.config.dir || "E", battery: this.config.battery ?? null, carry: null, level: this.config.level || 1 },
      crystals: { ...m.crystals }, doors: { ...m.doors }, alarms: [], served: [], delivered: 0, collected: 0, say: "", event: "", crashed: false,
      items: { ...m.items }, inventory: [], marks: [],
    };
    this.frames = [start];
    this.i = 0;
    this.pause();
    this.host.querySelector('[data-a="play"]').disabled = true;
    this.host.querySelector('[data-a="restart"]').disabled = true;
    this.paint(1);
  }

  load(frames, mapText) {
    if (mapText) this.setMap(mapText);
    this.frames = frames && frames.length ? frames : this.frames;
    this.i = 0;
    this.host.querySelector('[data-a="play"]').disabled = false;
    this.host.querySelector('[data-a="restart"]').disabled = false;
    this.play();
  }

  play() {
    if (this.i >= this.frames.length - 1) this.i = 0;
    this.playing = true;
    this.host.querySelector('[data-a="play"]').innerHTML = ICON.pause;
    this.host.querySelector('[data-a="play"]').setAttribute("aria-label", this.labels.pause);
    this.host.querySelector('[data-a="play"]').setAttribute("data-tip", this.labels.pause);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let from = performance.now();
    const loop = (now) => {
      if (!this.playing) return;
      const dur = (this.frames[this.i + 1] && this.frames[this.i + 1].event === "move" ? 240 : 320) / this.speed;
      let p = reduce ? 1 : (now - from) / dur;
      if (this.i === 0) p = 1;
      if (p >= 1) {
        this.paint(1);
        if (this.i >= this.frames.length - 1) return this.pause(true);
        this.i++;
        from = now;
        p = 0;
      }
      this.paint(Math.min(1, p));
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  pause(ended) {
    this.playing = false;
    cancelAnimationFrame(this.raf);
    const b = this.host.querySelector('[data-a="play"]');
    if (b) {
      b.innerHTML = ICON.play;
      b.setAttribute("aria-label", ended ? this.labels.restart : this.labels.play);
      b.setAttribute("data-tip", ended ? this.labels.restart : this.labels.play);
    }
  }

  paint(progress) {
    const b = this.frames[this.i];
    const a = this.frames[Math.max(0, this.i - 1)];
    const e = progress < 1 ? 1 - Math.pow(1 - progress, 3) : 1;
    const trail = this.frames.slice(0, this.i).map((f) => [f.robot.x, f.robot.y]);
    trail.push([a.robot.x + (b.robot.x - a.robot.x) * e, a.robot.y + (b.robot.y - a.robot.y) * e]);
    drawWorld(this.canvas, this.map, a, b, progress, performance.now(), trail, { fog: this.config.fog, vision: this.config.vision });
    const bat = (b.robot.battery === null ? "" : ` · ${this.labels.battery} ${b.robot.battery}`) + (b.inventory && b.inventory.length ? ` · ${this.labels.cargo || "▣"} ${b.inventory.length}` : "");
    this.stat.textContent = this.frames.length > 1 ? `${this.labels.step} ${this.i} / ${this.frames.length - 1}${bat}` : this.labels.ready + bat;
  }
}

const ICON = {
  play: icon("play"),
  pause: icon("pause"),
  restart: icon("rotate-ccw"),
};

// Idle scenes keep their crystals glinting, and every scene repaints when the theme or width changes.
const PLAYERS = new Set();
export function forgetPlayers() {
  for (const p of PLAYERS) p.pause();
  PLAYERS.clear();
}
export function repaintPlayers() {
  for (const p of PLAYERS) if (!p.playing && p.canvas.isConnected) p.paint(1);
}
setInterval(() => {
  for (const p of PLAYERS) if (!p.playing && p.canvas.isConnected && (p.map.theme === "mina" || p.map.motion.length || p.map.goal)) p.paint(1);
}, 200);
