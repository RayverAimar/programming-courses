// The places of the case files, drawn top-down as pixel art (SVG, 160×96 units). Each place names
// its spots (gate3, cam3, stall47…) so a case can pin clues on them; a clue shows up once the
// exercise that finds it is solved. Content format: docs/sql.md.
import { sprite } from "./sprites.js";

// Text in the art is at least this many viewBox units: 5 of 160 is 11 px on a 361 px phone.
export const LABEL = 5;
const R = (x, y, w, h, c, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"${extra}/>`;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const hash = (s) => [...String(s)].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
const seeded = (seed) => { let a = seed; return () => ((a = Math.imul(a ^ (a >>> 15), 2246822519) + 0x9e3779b9 >>> 0) / 4294967296); };

function stars(n, seed, h = 30) {
  const r = seeded(seed);
  return Array.from({ length: n }, () => R(Math.floor(r() * 160), Math.floor(r() * h), 1, 1, r() > 0.7 ? "#fff6c8" : "#9fb0d8")).join("");
}
const lamp = (x, y) => `<circle cx="${x}" cy="${y}" r="9" fill="#ffd97a" opacity=".13"/><circle cx="${x}" cy="${y}" r="4" fill="#ffd97a" opacity=".18"/>${R(x - 1, y - 1, 2, 2, "#ffe9a8")}`;
const car = (x, y, color, vertical = false) => vertical
  ? `${R(x, y, 6, 10, color)}${R(x + 1, y + 2, 4, 2, "#2c3e57")}${R(x + 1, y + 7, 4, 1, "#2c3e57")}${R(x, y, 6, 1, "rgba(255,255,255,.25)")}`
  : `${R(x, y, 10, 6, color)}${R(x + 2, y + 1, 2, 4, "#2c3e57")}${R(x + 7, y + 1, 1, 4, "#2c3e57")}${R(x, y, 10, 1, "rgba(255,255,255,.25)")}`;
const cam = (x, y, dir) => {
  const cone = { E: `${x + 2},${y + 1} ${x + 22},${y - 7} ${x + 22},${y + 9}`, W: `${x},${y + 1} ${x - 20},${y - 7} ${x - 20},${y + 9}`, N: `${x + 1},${y} ${x - 8},${y - 20} ${x + 10},${y - 20}`, S: `${x + 1},${y + 2} ${x - 8},${y + 20} ${x + 10},${y + 20}` }[dir];
  return `<polygon points="${cone}" fill="#7fe3ff" opacity=".16"/>${R(x - 1, y - 1, 4, 4, "#22262f")}${R(x, y, 2, 2, "#ff5d5d")}`;
};

const PLACES = {
  mercado: {
    spots: { gate1: [22, 44], gate2: [80, 76], gate3: [138, 30], cam1: [11, 86], cam2: [80, 84], cam3: [149, 22], stall47: [70, 34], car3: [150, 44], street: [8, 50] },
    draw() {
      const r = seeded(47);
      const TR = ["#c4553f", "#4f9a6a", "#c49a3f", "#3f7cc4", "#8a5cc4", "#3fa7a7", "#c43f84", "#9a8a5c"];
      let s = R(0, 0, 160, 96, "#252a36") + stars(24, 7, 8);
      s += R(0, 0, 16, 96, "#1c1f27") + R(144, 0, 16, 96, "#1c1f27") + R(0, 80, 160, 16, "#1c1f27");
      for (let y = 2; y < 80; y += 8) s += R(7, y, 2, 4, "#c9b76b") + R(151, y, 2, 4, "#c9b76b");
      for (let x = 2; x < 160; x += 8) s += R(x, 87, 4, 2, "#c9b76b");
      s += R(20, 6, 120, 72, "#5d4636") + R(22, 8, 116, 68, "#3b352e");
      s += R(22, 8, 116, 3, "#47403a");
      for (let row = 0; row < 6; row++) {
        const y = 13 + row * 10;
        for (let k = 0; k < 15; k++) {
          const n = row * 20 + k + 1;
          const x = 27 + k * 7;
          const lit = n === 47;
          s += R(x, y, 6, 6, lit ? "#e8c46a" : TR[Math.floor(r() * TR.length)], lit ? "" : ' opacity=".75"') + R(x, y, 6, 1, "rgba(255,255,255,.2)");
        }
        s += `<text x="24.3" y="${y + 4.6}" class="sc-t" font-size="${LABEL}">${"ABCDEF"[row]}</text>`;
      }
      s += `<circle cx="70" cy="35" r="9" fill="#ffd97a" opacity=".16"/>`;
      s += R(20, 41, 2, 7, "#252a36") + R(77, 76, 7, 2, "#252a36") + R(138, 27, 2, 7, "#252a36");
      s += lamp(14, 30) + lamp(146, 60) + lamp(110, 84) + lamp(40, 84);
      s += car(147, 40, "#f2efe6", true) + car(2, 60, "#7b8794", true) + car(118, 82, "#b23a2e") + car(50, 89, "#3f7cc4");
      for (const [x, y, n] of [[17, 42, 1], [76, 78, 2], [140, 25, 3]]) s += R(x, y, 6, 6, "#e9c46a") + `<text x="${x + 3}" y="${y + 4.6}" class="sc-t sc-dark" font-size="${LABEL}" text-anchor="middle">${n}</text>`;
      s += cam(11, 86, "N") + cam(80, 82, "N") + cam(149, 21, "S");
      s += `<g transform="translate(66.5 30.5) scale(.45)">${sprite("robot", "Wayra", { size: 16, traits: { broken: true } }).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g>`;
      return s;
    },
  },
  distritos: {
    spots: { surquillo: [86, 46], miraflores: [62, 58], barranco: [52, 78], sanborja: [112, 40], surco: [118, 70], sanisidro: [70, 32], lavictoria: [100, 14], lince: [70, 12], chorrillos: [40, 90], gamarra: [104, 12] },
    draw(lang) {
      const D = [
        ["Lince", "#c7b98f", "56,2 86,2 86,22 56,22"], ["La Victoria", "#c9a27e", "86,0 124,0 124,26 86,26"], ["San Isidro", "#a9c28f", "50,22 92,22 92,42 46,42"],
        ["Surquillo", "#e8c46a", "76,36 100,30 104,58 76,58"], ["San Borja", "#9ec3c2", "100,26 140,26 140,54 104,54"], ["Miraflores", "#b9d18f", "38,42 76,42 76,70 34,70"],
        ["Surco", "#b8b0d6", "104,54 154,54 154,92 96,92 92,62"], ["Barranco", "#d7a9a0", "30,70 70,70 66,84 28,84"], ["Chorrillos", "#cdb7a0", "22,84 66,84 92,62 96,96 18,96"],
      ];
      let s = R(0, 0, 160, 96, "#2f6f8f") + `<path d="M0 0 H22 Q30 20 26 40 Q22 62 14 96 H0 Z" fill="#2a5f7c"/>`;
      for (let i = 0; i < 6; i++) s += R(4 + i * 2, 20 + i * 12, 6, 1, "#7fb7d0");
      for (const [name, color, pts] of D) s += `<polygon points="${pts}" fill="${color}" stroke="#3d3a35" stroke-width=".6"/>`;
      s += `<polyline points="0,64 60,58 160,52" fill="none" stroke="#5a5650" stroke-width="1.6" opacity=".55"/><polyline points="70,0 74,40 66,96" fill="none" stroke="#5a5650" stroke-width="1.6" opacity=".55"/>`;
      for (const [name, , pts] of D) {
        const p = pts.split(" ").map((xy) => xy.split(",").map(Number));
        const cx = p.reduce((a, q) => a + q[0], 0) / p.length, cy = p.reduce((a, q) => a + q[1], 0) / p.length;
        s += `<text x="${cx}" y="${cy + 1.5}" class="sc-t sc-dark" font-size="${LABEL}" text-anchor="middle">${esc(name)}</text>`;
      }
      s += `<text x="9" y="50" class="sc-t" font-size="${LABEL}" text-anchor="middle" transform="rotate(-80 9 50)">${lang === "en" ? "Pacific Ocean" : "Océano Pacífico"}</text>`;
      return s;
    },
  },
  fabrica: {
    spots: { caja: [36, 26], oficina: [30, 18], caseta: [92, 70], lateral: [14, 52], publico: [120, 88], nave: [116, 32], calle: [60, 88], patio: [72, 50] },
    draw(lang) {
      let s = R(0, 0, 160, 96, "#1f2330") + stars(18, 98, 6);
      s += R(0, 78, 160, 18, "#2a2d34");
      for (let x = 4; x < 160; x += 10) s += R(x, 86, 5, 1, "#c9b76b");
      s += R(0, 78, 160, 2, "#4a4e57") + R(0, 94, 160, 2, "#4a4e57");
      s += R(4, 4, 152, 72, "#6b5a4a") + R(6, 6, 148, 68, "#3a3633");
      s += R(8, 8, 46, 26, "#8a7a68") + R(10, 10, 42, 22, "#4b4440");
      for (let x = 12; x < 50; x += 7) s += R(x, 12, 4, 3, "#ffd97a") ;
      s += R(28, 21, 18, 9, "#5b524c") + R(31, 22, 10, 7, "#22262f") + R(32, 23, 8, 5, "#3a4352") + R(35, 25, 2, 1, "#c9b76b") + `<circle cx="36" cy="25.6" r="1.2" fill="#9aa3b0"/>`;
      s += `<text x="31" y="19.5" class="sc-t" font-size="${LABEL}" text-anchor="middle">${lang === "en" ? "TREASURY" : "TESORERÍA"}</text>`;
      s += R(70, 10, 80, 40, "#7b6a58");
      for (let x = 70; x < 150; x += 10) s += `<polygon points="${x},10 ${x + 10},10 ${x + 10},5" fill="#9a8a74"/>` + R(x + 9, 5, 1, 5, "#c9e3ff");
      s += R(72, 14, 76, 34, "#4b4440");
      for (let y = 18; y < 46; y += 7) for (let x = 76; x < 146; x += 9) s += R(x, y, 6, 3, "#5f6b78") + R(x + 1, y + 1, 4, 1, "#8fa3b8");
      s += `<text x="110" y="45" class="sc-t" font-size="${LABEL}" text-anchor="middle">${lang === "en" ? "LOOMS" : "TELARES"}</text>`;
      s += R(4, 48, 3, 8, "#c4553f") + R(4, 48, 3, 1, "#e07a5f");
      s += R(84, 64, 16, 12, "#8a7a68") + R(86, 66, 12, 7, "#2c3e57") + R(87, 67, 4, 3, "#ffd97a");
      s += R(102, 74, 22, 4, "#3a3633") + R(104, 75, 18, 2, "#9a9a9a");
      s += `<text x="92" y="63" class="sc-t" font-size="${LABEL}" text-anchor="middle">${lang === "en" ? "BOOTH" : "CASETA"}</text>`;
      s += R(116, 82, 8, 11, "#2f6f8f") + R(117, 83, 6, 4, "#7fe3ff") + R(119, 88, 2, 3, "#22262f");
      s += R(30, 82, 14, 7, "#d9c24a") + R(33, 83, 3, 5, "#2c3e57") + R(39, 83, 2, 5, "#2c3e57") + R(30, 82, 14, 1, "rgba(255,255,255,.3)");
      s += lamp(20, 80) + lamp(80, 80) + lamp(140, 80) + lamp(58, 40);
      s += `<g transform="translate(86.5 64.5) scale(.42)">${sprite("person", "Teodoro Llanos Cusi", { size: 16, traits: { style: "cap", capColor: "#2f3a4a", shirt: "#2f3a4a", skin: "#a86f47", beard: true } }).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g>`;
      s += `<text x="90" y="93.4" class="sc-t" font-size="${LABEL}" text-anchor="middle">Av. México · 1998</text>`;
      return s;
    },
  },
  taller: {
    spots: { board: [104, 22], desk: [60, 60], chasqui: [44, 52], window: [20, 20], door: [146, 70] },
    draw() {
      let s = R(0, 0, 160, 96, "#3a3029") + R(0, 0, 160, 40, "#4a3d33");
      s += R(8, 6, 30, 22, "#1b2440") + stars(10, 3, 20).replace(/x="(\d+)"/g, (_m, x) => `x="${8 + (Number(x) % 30)}"`) + R(8, 16, 30, 1, "#5d4636") + R(22, 6, 1, 22, "#5d4636");
      s += R(70, 6, 70, 32, "#b78a55") + R(72, 8, 66, 28, "#c99a62");
      const pins = [[80, 12], [96, 20], [118, 12], [128, 26], [86, 28], [108, 30]];
      for (const [x, y] of pins) s += R(x, y, 8, 6, "#f4efe2") + R(x + 3, y - 1, 2, 2, "#c4553f");
      s += `<polyline points="84,15 100,23 122,15 132,29" fill="none" stroke="#c4553f" stroke-width=".6"/><polyline points="100,23 90,31 112,33" fill="none" stroke="#c4553f" stroke-width=".6"/>`;
      s += R(0, 40, 160, 56, "#6b5442");
      for (let x = 0; x < 160; x += 16) s += R(x, 40, 1, 56, "#5d4636");
      s += R(40, 58, 52, 14, "#8a6a45") + R(40, 58, 52, 2, "#a8845a") + R(44, 72, 3, 12, "#5d4636") + R(85, 72, 3, 12, "#5d4636");
      s += R(56, 50, 16, 9, "#22262f") + R(57, 51, 14, 7, "#2f6f8f") + R(59, 53, 6, 1, "#b6ff7f") + R(59, 55, 9, 1, "#7fe3ff");
      s += R(76, 54, 8, 5, "#f4efe2") + R(78, 55, 4, 1, "#8a7f6a");
      s += `<g transform="translate(34 42) scale(1)">${sprite("chasqui", "Chasqui", { size: 16 }).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g>`;
      s += R(140, 50, 16, 34, "#5d4636") + R(142, 52, 12, 30, "#7a5a3e") + R(151, 66, 2, 2, "#e9c46a");
      s += lamp(64, 44);
      return s;
    },
  },
  pagos: {
    spots: { victims: [14, 44], kevin: [56, 16], brenda: [56, 36], jhonatan: [56, 56], chip: [56, 76], cajera: [100, 46], empresa: [140, 24], lider: [141, 40], percy: [128, 80], casero: [100, 82], comisaria: [16, 86], center: [100, 46] },
    draw(lang) {
      const phone = (x, y, screen, big = false) => {
        const w = big ? 10 : 7, h = big ? 16 : 12;
        return R(x - w / 2, y - h / 2, w, h, "#1d1714") + R(x - w / 2 + 1, y - h / 2 + 1, w - 2, h - 3, screen) + R(x - 1, y + h / 2 - 2, 2, 1, "#9a9a9a") + R(x - w / 2 + 2, y - h / 2 + 3, w - 4, 1, "rgba(255,255,255,.55)") + R(x - w / 2 + 2, y - h / 2 + 5, w - 5, 1, "rgba(255,255,255,.35)");
      };
      const coin = (x, y) => R(x - 1, y - 1, 3, 3, "#e9c46a") + R(x, y - 1, 1, 1, "#fff2b8");
      const flow = (x1, y1, x2, y2, n = 2) => {
        let f = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#b48ead" stroke-width=".7" stroke-dasharray="2 1.5" opacity=".8"/>`;
        for (let k = 1; k <= n; k++) f += coin(Math.round(x1 + ((x2 - x1) * k) / (n + 1)), Math.round(y1 + ((y2 - y1) * k) / (n + 1)));
        return f;
      };
      let s = R(0, 0, 160, 96, "#231b36") + stars(22, 11, 96);
      for (let x = 0; x < 160; x += 20) s += R(x, 0, 1, 96, "rgba(255,255,255,.025)");
      for (let y = 0; y < 96; y += 20) s += R(0, y, 160, 1, "rgba(255,255,255,.025)");
      const vy = [10, 24, 38, 52, 66];
      const VC = ["#3f7cc4", "#4f9a6a", "#c49a3f", "#c4553f", "#3fa7a7"];
      s += R(4, 3, 20, 72, "rgba(255,255,255,.04)");
      const mules = [[56, 16], [56, 36], [56, 56], [56, 76]];
      vy.forEach((y, i) => { s += flow(18, y, 51, mules[i % 4][1], 1); });
      vy.forEach((y, i) => { s += phone(14, y, VC[i]); });
      mules.forEach(([x, y]) => { s += flow(x + 5, y, 94, 46, 2); });
      mules.forEach(([x, y], i) => { s += phone(x, y, i === 3 ? "#5b5f66" : "#6d4fc2"); });
      s += `<text x="56" y="78.4" class="sc-t" font-size="${LABEL}" text-anchor="middle">?</text>`;
      s += `<circle cx="100" cy="46" r="13" fill="#b48ead" opacity=".14"/>` + phone(100, 46, "#b48ead", true);
      s += R(104, 52, 5, 2, "#e9c46a") + R(104, 50, 5, 2, "#d9a441") + R(104, 48, 5, 2, "#e9c46a");
      s += flow(106, 40, 134, 30, 3) + flow(104, 54, 124, 77, 1) + flow(100, 55, 100, 75, 1);
      s += R(126, 4, 30, 30, "#4a3d33") + R(126, 4, 30, 3, "#6b5442") + R(128, 8, 26, 6, "#e9c46a") + R(129, 9, 24, 4, "#c49a3f");
      s += `<text x="141" y="12.2" class="sc-t sc-dark" font-size="${LABEL}" text-anchor="middle">CCORI</text>`;
      s += R(129, 17, 7, 8, "#7fe3ff") + R(146, 17, 7, 8, "#7fe3ff") + R(138, 22, 6, 12, "#2c2420") + R(129, 17, 7, 1, "rgba(255,255,255,.4)") + R(146, 17, 7, 1, "rgba(255,255,255,.4)");
      s += R(92, 76, 16, 12, "#6b5442") + R(92, 76, 16, 2, "#8a6a45") + R(96, 80, 3, 3, "#ffd97a") + R(102, 80, 3, 3, "#ffd97a") + R(99, 84, 3, 4, "#2c2420");
      s += `<g transform="translate(122 72) scale(.75)">${sprite("person", "Percy Tello Benavides", { size: 16, traits: { style: "cap", capColor: "#4f9a6a", shirt: "#4f9a6a" } }).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g>`;
      s += R(4, 80, 24, 14, "#e8e2d0") + R(4, 80, 24, 3, "#3f7cc4") + R(8, 85, 4, 4, "#7fe3ff") + R(20, 85, 4, 4, "#7fe3ff") + R(14, 86, 4, 8, "#2f3a4a") + R(15, 78, 2, 2, "#ff5d5d");
      s += `<text x="16" y="77.4" class="sc-t" font-size="${LABEL}" text-anchor="middle">${lang === "en" ? "POLICE" : "COMISARÍA"}</text>`;
      return s;
    },
  },
  sensores: {
    spots: { rack1: [24, 40], rack2: [48, 40], monitor: [110, 22], pad1: [90, 70], pad2: [116, 70], pad3: [142, 70], door: [8, 80] },
    draw() {
      let s = R(0, 0, 160, 96, "#1d2228") + R(0, 0, 160, 46, "#242b33");
      for (const x of [14, 38]) {
        s += R(x, 10, 20, 50, "#2f3740") + R(x + 1, 11, 18, 48, "#151a20");
        for (let y = 14; y < 58; y += 5) s += R(x + 3, y, 14, 3, "#2a323b") + R(x + 4, y + 1, 1, 1, (y / 5) % 3 === 0 ? "#b6ff7f" : "#7fe3ff");
      }
      s += R(80, 8, 64, 30, "#11161b") + R(82, 10, 60, 26, "#0d2a33");
      const pts = Array.from({ length: 30 }, (_, i) => `${84 + i * 2},${24 + Math.round(Math.sin(i / 2.5) * 6) + (i === 21 ? -8 : 0)}`).join(" ");
      s += `<polyline points="${pts}" fill="none" stroke="#7fe3ff" stroke-width=".8"/>` + R(124, 13, 3, 3, "#ff5d5d");
      for (const [i, x] of [86, 112, 138].entries()) {
        s += `<ellipse cx="${x + 4}" cy="78" rx="11" ry="4" fill="#3fa7a7" opacity=".35"/>`;
        s += `<g transform="translate(${x - 4} 60)">${sprite("robot", ["Tika", "Kusi", "Pituco"][i], { size: 16 }).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g>`;
      }
      s += R(0, 64, 12, 26, "#2f3740") + R(9, 76, 2, 2, "#e9c46a");
      return s;
    },
  },
  oficina: {
    spots: { v1: [40, 30], v2: [84, 30], server: [146, 18], archivo: [12, 58], sis: [128, 62], laptop: [64, 70], door: [92, 90] },
    draw(lang) {
      const who = (kind, name, traits, x, y, k = 0.62) => `<g transform="translate(${x} ${y}) scale(${k})">${sprite(kind, name, { size: 16, traits }).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g>`;
      let s = R(0, 0, 160, 96, "#2b2e36") + R(0, 0, 160, 8, "#3a3e48");
      for (let x = 0; x < 160; x += 12) for (let y = 8; y < 96; y += 12) s += R(x, y, 12, 12, (x / 12 + y / 12) % 2 ? "#5a5e66" : "#535760");
      s += R(28, 4, 16, 4, "#1b2440") + R(72, 4, 16, 4, "#1b2440") + R(116, 4, 16, 4, "#1b2440");
      s += who("person", "Gustavo Benavides Tello", { style: "short", hair: "#121212", shirt: "#2f3a4a", glasses: true, beard: false }, 35, 16);
      s += who("person", "Rocío Salazar Pumacayo", { style: "long", shirt: "#8a5cc4", glasses: false }, 79, 16);
      s += R(30, 22, 7, 4, "#22262f") + R(31, 23, 5, 2, "#2f6f8f") + R(74, 22, 7, 4, "#22262f") + R(75, 23, 5, 2, "#2f6f8f");
      s += R(20, 26, 92, 8, "#8a6a45") + R(20, 26, 92, 2, "#a8845a") + R(20, 34, 92, 2, "#5d4636");
      for (const [x, n] of [[36, 1], [80, 2]]) s += R(x, 28, 8, 5, "#e9c46a") + `<text x="${x + 4}" y="${x === 36 ? 32 : 32}" class="sc-t sc-dark" font-size="${LABEL}" text-anchor="middle">${n}</text>`;
      s += R(132, 8, 22, 22, "#22262f") + R(134, 10, 18, 18, "#151a20");
      for (let y = 11; y < 27; y += 4) s += R(136, y, 14, 2, "#2a323b") + R(137, y, 1, 1, y % 8 === 3 ? "#b6ff7f" : "#7fe3ff");
      s += R(2, 44, 18, 36, "#5d6470") + R(3, 45, 16, 34, "#6f7782");
      for (let y = 47; y < 78; y += 8) s += R(4, y, 14, 6, "#7d8590") + R(9, y + 2, 4, 1, "#c9b76b");
      s += R(10, 40, 9, 4, "#f4efe2") + R(11, 41, 7, 1, "#3f7cc4") + R(11, 43, 5, 1, "#8a7f6a");
      s += R(116, 56, 34, 14, "#8a6a45") + R(116, 56, 34, 2, "#a8845a") + R(122, 50, 12, 7, "#22262f") + R(123, 51, 10, 5, "#2f6f8f") + R(125, 53, 5, 1, "#b6ff7f");
      s += `<text x="133" y="76" class="sc-t" font-size="${LABEL}" text-anchor="middle">SIS-01</text>`;
      s += R(48, 64, 34, 12, "#7a5a3e") + R(48, 64, 34, 2, "#946f4c") + R(58, 60, 12, 6, "#22262f") + R(59, 61, 10, 4, "#2f6f8f") + R(60, 62, 4, 1, "#b6ff7f") + R(60, 64, 7, 1, "#7fe3ff");
      s += who("chasqui", "Chasqui", {}, 36, 60, 0.7);
      s += R(84, 88, 20, 8, "#3a3029") + R(86, 89, 16, 7, "#5d4636") + R(99, 92, 2, 2, "#e9c46a");
      s += R(24, 44, 40, 4, "#4a4038") + R(70, 44, 40, 4, "#4a4038");
      s += lamp(40, 40) + lamp(84, 40) + lamp(132, 46);
      s += `<text x="4" y="7.6" class="sc-t" font-size="${LABEL}">${lang === "en" ? "Markets Office · Market No. 1, 2nd floor" : "Oficina de Mercados · Mercado N.º 1, 2.º piso"}</text>`;
      return s;
    },
  },
};

export const placeNames = Object.keys(PLACES);

// marks: [{ at: spot name or [x, y], label, by: exercise id }]; `passed(id)` says what's solved.
export function sceneSvg(place, { marks = [], passed = () => true, lang = "es", alt = "" } = {}) {
  const P = PLACES[place];
  if (!P) return "";
  const pins = marks.map((m, i) => {
    const [x, y] = Array.isArray(m.at) ? m.at : P.spots[m.at] || [80, 48];
    const on = !m.by || passed(m.by);
    return `<g class="sc-pin${on ? " on" : ""}" data-i="${i}"><circle cx="${x}" cy="${y}" r="5.4" class="sc-pin-ring"/><circle cx="${x}" cy="${y}" r="4.2" class="sc-pin-dot"/><text x="${x}" y="${y + 1.8}" font-size="${LABEL}" text-anchor="middle" class="sc-pin-n">${on ? i + 1 : "?"}</text></g>`;
  }).join("");
  return `<svg class="sc-svg" viewBox="0 0 160 96" shape-rendering="crispEdges" role="img" aria-label="${esc(alt)}">${P.draw(lang)}<g shape-rendering="geometricPrecision">${pins}</g></svg>`;
}

export const spotOf = (place, at) => (Array.isArray(at) ? at : (PLACES[place] && PLACES[place].spots[at]) || null);
export { hash };
