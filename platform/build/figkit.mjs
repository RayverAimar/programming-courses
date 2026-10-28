// Static figures: text metrics, the drawing kit every figure module uses, and the checks the build
// runs on each figure (text that does not fit, touches a line, or is too small on a phone).
import { pathPoints, polylineHitsBox, marker } from "../web/core/chart.js";

export { marker };

// Widths are the advance widths of Bricolage Grotesque (the figures' font) per character, in em,
// measured at the size and weight of each figure class (the font changes shape with size).
const W = {
  "d-t": "0id1992gi3go4gy5gt6i47dx8i39hz 6m!7r\"9e#h8$ho%qq&kz'4o(8q)8g*bk+ej,51-9m.60/9y:69;5p<ej=ej>ej?bl@qyAj0BirCisDjbEgyFg9GjtHjwI7vJa5KitLe5MpnNl5Ok0PhqQk2RilShzTflUk3VihWr0XirYhaZfq[8w\\9p]8m^fj_fr`7vag1bhgcfkdhgefzfatggjhh8i7gj7mkg1l7emptnh8ogvphgqhgrbqsf0tatugzvfjwnhxfcyglze8{9r|7d}9d~ejág1éfzí7fógvúgzÁj0ÉgyÍ7vÓk0Úk3ñh8Ñl5ügzÜk3¿bg¡7r«ca»ca—lu–ep…kg·60“ad”ad‘5b’5b€km£jy°9w×ej→rs←rs≈go≥go≤go²bp³bj½ph¼pcçfk",
  "d-s": "0i518k2fz3gf4g65gj6hu7di8hu9ho 73!73\"89#gu$he%px&l2'45(8a)7q*af+e7,46-99.4y/9q:5a;4s<e7=e7>e7?bd@q0AibBibCijDj4EgdFfvGjgHjjI7fJ9qKi9Le4MovNkdOjuPhbQjyRi3ShpTf4UjvVi2Wq8XhjYg5Zff[8n\\9a]83^ev_ge`7wafjbgxcfadgwefpfabgg7hgli6zj78kf8l6ymoxnglogqpgxqgwrb4sertadugdvevwmixedygbzdl{9w|73}93~e7áfjéfpí6yógqúgdÁibÉgdÍ7fÓjuÚjvñglÑkdügdÜjv¿b2¡73«b3»b3—ku–e9…iu·4y“8w”8w‘4i’4i€kg£jy°9m×e7→rs←rs≈gp≥gp≤gp²b5³b9½ob¼nyçfa",
  "d-n": "0gr1gr2gr3gr4gr5gr6gr7gr8gr9gr 73!73\"89#gu$he%px&l2'45(8a)7q*af+e7,46-99.4y/9q:5a;4s<e7=e7>e7?bd@q0AibBibCijDj4EgdFfvGjgHjjI7fJ9qKi9Le4MovNkdOjuPhbQjyRi3ShpTf4UjvVi2Wq8XhjYg5Zff[8n\\9a]83^ev_ge`7wafjbgxcfadgwefpfabgg7hgli6zj78kf8l6ymoxnglogqpgxqgwrb4sertadugdvevwmixedygbzdl{9w|73}93~e7áfjéfpí6yógqúgdÁibÉgdÍ7fÓjuÚjvñglÑkdügdÜjv¿b2¡73«b3»b3—ku–e9…iu·4y“8w”8w‘4i’4i€kg£jy°9m×e7→rs←rs≈gp≥gp≤gp²b5³b9½ob¼nyçfa",
  "d-a": "0ii19n2gs3gu4hc5gy6i97e58i89i5 6f!83\"a0#he$hu%r6&ky'4x(8x)8t*c4+eo,5g-9t.6i/a2:6s;65<eo=eo>eo?bq@rgAjfBj0CixDjhEhaFgiGk2Hk3I86JaeKj4Le5Mq4NlkOk3PhyQk4RiwSi5TfvUk9ViqWrfXjeYhuZfv[91\\9x]8w^fx_ff`7vagabhqcfqdhseg5fb4ggqhhki7qj7tkggl7nmqanhkogxphqqhsrc3sf5tb2uhbvfxwo0xftygrzel{9p|7j}9j~eoágaég5í7pógxúhbÁjfÉhaÍ86Ók3Úk9ñhkÑlkühbÜk9¿bn¡83«cv»cv—mc–ex…la·6i“b4”b4‘5p’5p€kr£jz°a0×eo→rs←rs≈go≥go≤go²c0³bp½q5¼q3çfq",
};
const TABLE = Object.fromEntries(Object.entries(W).map(([cls, s]) => {
  const a = Array.from(s);
  const m = new Map();
  for (let i = 0; i < a.length; i += 3) m.set(a[i], parseInt(a[i + 1] + a[i + 2], 36) / 1000);
  return [cls, m];
}));

// What each figure class draws with (styles/charts.css): size in viewBox units, weight.
export const TEXT_CLASSES = { "d-t": [14.5, 600], "d-s": [13, 400], "d-n": [13, 400], "d-a": [14, 700] };

const decode = (s) => s.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");

export function textWidth(text, cls = "d-s") {
  const m = TABLE[cls] || TABLE["d-s"];
  const [size] = TEXT_CLASSES[cls] || TEXT_CLASSES["d-s"];
  let em = 0;
  for (const ch of decode(text)) em += m.get(ch) ?? 0.6;
  return em * size;
}

// The words of a label in lines no wider than max, for a figure class.
export function wrapText(text, max, cls = "d-s") {
  const lines = [];
  for (const word of String(text).split(/\s+/)) {
    const last = lines[lines.length - 1];
    if (last !== undefined && textWidth(`${last} ${word}`, cls) <= max) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines;
}

const num = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}="(-?[\\d.]+)"`));
  return m ? Number(m[1]) : null;
};

// The boxes (rects) and text lines of one SVG, in its own units.
function parse(svg) {
  const vb = (svg.match(/viewBox="([^"]+)"/) || [])[1];
  const [, , W, H] = vb ? vb.split(/[\s,]+/).map(Number) : [0, 0, 0, 0];
  const rects = [...svg.matchAll(/<rect\b[^>]*>/g)].map((m) => ({ x: num(m[0], "x") || 0, y: num(m[0], "y") || 0, w: num(m[0], "width") || 0, h: num(m[0], "height") || 0 }));
  const texts = [];
  for (const m of svg.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)) {
    const attrs = m[1];
    const own = ((attrs.match(/class="([^"]+)"/) || [])[1] || "").split(/\s+/).find((c) => TEXT_CLASSES[c]);
    const cls = own || "d-s";
    const [size] = TEXT_CLASSES[cls];
    const fs = own ? size : num(attrs, "font-size") ?? size;
    const anchor = (attrs.match(/text-anchor="(\w+)"/) || [])[1] || "start";
    const x = num(attrs, "x") || 0, y = num(attrs, "y") || 0;
    // A label turned a quarter: it runs up the page, centred on y.
    if (/rotate\(\s*-?90\b/.test(attrs)) {
      const w = textWidth(m[2], cls);
      const y0 = anchor === "middle" ? y - w / 2 : anchor === "end" ? y : y - w;
      texts.push({ text: decode(m[2]).trim(), x0: x - size * 0.78, x1: x + size * 0.24, top: y0, bottom: y0 + w, size, fs, turned: true });
      continue;
    }
    const lines = [...m[2].matchAll(/<tspan\b([^>]*)>([\s\S]*?)<\/tspan>/g)];
    let cy = y;
    const rows = lines.length ? lines.map((l) => {
      cy = num(l[1], "y") ?? cy + (num(l[1], "dy") || 0);
      return { text: l[2], x: num(l[1], "x") ?? x, y: cy };
    }) : [{ text: m[2], x, y }];
    for (const r of rows) {
      const w = textWidth(r.text, cls);
      const x0 = anchor === "middle" ? r.x - w / 2 : anchor === "end" ? r.x - w : r.x;
      texts.push({ text: decode(r.text).trim(), x0, x1: x0 + w, top: r.y - size * 0.78, bottom: r.y + size * 0.24, size, fs });
    }
  }
  const strokes = [];
  for (const m of svg.matchAll(/<(path|line|polyline)\b([^>]*?)\/?>/g)) {
    const a = m[2];
    const cls = (a.match(/class="([^"]+)"/) || [])[1] || "";
    if (!/\bd-(flow|flow-acc|line|dash)\b/.test(cls) && m[1] !== "line") continue;
    if (m[1] === "line") strokes.push([[num(a, "x1"), num(a, "y1")], [num(a, "x2"), num(a, "y2")]]);
    else if (m[1] === "polyline") strokes.push(((a.match(/points="([^"]+)"/) || [])[1] || "").trim().split(/[\s,]+/).map(Number).reduce((o, v, i, arr) => (i % 2 ? o : o.concat([[v, arr[i + 1]]])), []));
    else strokes.push(...pathPoints((a.match(/\sd="([^"]+)"/) || [])[1] || ""));
  }
  return { W, H, rects, texts, strokes };
}

// Problems in one SVG, as sentences; [] when it is fine.
export function checkSvg(svg) {
  const { W, H, rects, texts, strokes } = parse(svg);
  const out = [];
  const pad = 2;
  for (const t of texts) {
    if (!t.text) continue;
    if (t.turned) {
      if (t.x0 < -pad || t.x1 > W + pad || t.top < -pad || t.bottom > H + pad) out.push(`"${t.text}" runs outside the picture (${W}×${H})`);
      continue;
    }
    if (t.x0 < -pad || t.x1 > W + pad || t.top < -pad || t.bottom > H + pad) out.push(`"${t.text}" runs outside the picture (${W}×${H})`);
    const cy = (t.top + t.bottom) / 2;
    const cx = (t.x0 + t.x1) / 2;
    const box = rects.filter((r) => r.h >= t.size * 1.4 && cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h).sort((a, b) => a.w * a.h - b.w * b.h)[0];
    if (box && (t.x0 < box.x + 4 || t.x1 > box.x + box.w - 4)) out.push(`"${t.text}" is wider than its box (${Math.round(t.x1 - t.x0)} for ${box.w})`);
    else if (box && (t.top < box.y + 2 || t.bottom > box.y + box.h - 2)) out.push(`"${t.text}" does not fit the height of its box`);
  }
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
    const a = texts[i], b = texts[j];
    if (!a.text || !b.text || a.turned || b.turned) continue;
    if (a.x0 < b.x1 - 1 && b.x0 < a.x1 - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) out.push(`"${a.text}" and "${b.text}" overlap`);
  }
  for (const t of texts) {
    if (!t.text || t.turned) continue;
    const b = { x: t.x0, y: t.top, w: t.x1 - t.x0, h: t.bottom - t.top };
    if (strokes.some((p) => polylineHitsBox(p, b, 1))) out.push(`"${t.text}" touches a line or arrow`);
  }
  return out;
}

// ── Drawing kit ──
// A static figure is an SVG string built in Node: a wide drawing (viewBox WIDE wide) and, when its
// text would be under PHONE.min px on a phone, a narrow one (viewBox NARROW) shown there instead.
export const WIDE = 720;
export const NARROW = 320;
export const R = { box: 10, cell: 4, bar: 2 };
export const LH = { t: 18, s: 16 };


export const tspans = (lines, x, lh) => lines.map((l, i) => `<tspan x="${x}"${i ? ` dy="${lh}"` : ""}>${l}</tspan>`).join("");

// A box with a title and optional lines under it (a string or a list), wrapped to the box and
// centred in it. cls: "d-box" (grey), "d-acc" (accent wash) or "d-box-line" (outline).
export function box(x, y, w, h, title, sub, cls = "d-box") {
  cls = cls || "d-box";
  const tc = cls === "d-acc" ? "d-a" : "d-t";
  const tl = title ? wrapText(title, w - 24, tc) : [];
  const sl = [].concat(sub || []).filter(Boolean).flatMap((l) => wrapText(l, w - 24, "d-s"));
  const tot = tl.length * LH.t + (sl.length ? (tl.length ? 4 : 0) + sl.length * LH.s : 0) - 4;
  const top = y + (h - tot) / 2;
  const cx = x + w / 2;
  return `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${R.box}"/>
   ${tl.length ? `<text class="${tc}" x="${cx}" y="${top + 13}" text-anchor="middle">${tspans(tl, cx, LH.t)}</text>` : ""}
   ${sl.length ? `<text class="d-s" x="${cx}" y="${top + (tl.length ? tl.length * LH.t + 4 : 0) + 12}" text-anchor="middle">${tspans(sl, cx, LH.s)}</text>` : ""}`;
}

// Wrapped text at (x, y) no wider than max; cls d-t, d-s, d-n or d-a; anchor start|middle|end.
export function note(x, y, text, max, cls = "d-s", anchor = "start", lh = LH.s) {
  return `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${tspans(wrapText(text, max, cls), x, lh)}</text>`;
}

// The figure's svg: its arrow markers (id, and id + "a" for the accent one) and what is drawn in it.
export const fig = (id, label, H, inner, W = WIDE) =>
  `<svg viewBox="0 0 ${W} ${Math.ceil(H)}" role="img" aria-label="${label}">${marker(id)}${inner}</svg>`;

// Boxes in rows of `per` that run left to right, then right to left, joined by arrows; `closing`
// adds the arrow that closes a loop. per: 1 makes a column, the usual narrow layout.
export function chain(id, cards, { per, ch = 84, closing = false, y0 = 14, W = WIDE, gap = 40, m = 20 } = {}) {
  const cw = (W - 2 * m - (per - 1) * gap) / per;
  const rows = Math.ceil(cards.length / per);
  const pos = cards.map((_, i) => {
    const r = Math.floor(i / per), c = i % per, col = r % 2 ? per - 1 - c : c;
    return { x: m + col * (cw + gap), y: y0 + r * (ch + gap), r, col };
  });
  let out = cards.map((c, i) => box(pos[i].x, pos[i].y, cw, ch, c[0], c[1], c[2])).join("");
  for (let i = 0; i < cards.length - 1; i++) {
    const a = pos[i], b = pos[i + 1], acc = cards[i + 1][2] === "d-acc";
    const cl = acc ? "d-flow-acc" : "d-flow", mk = `url(#${id}${acc ? "a" : ""})`;
    if (a.r === b.r) {
      const y = a.y + ch / 2;
      out += a.col < b.col ? `<path class="${cl}" marker-end="${mk}" d="M${a.x + cw} ${y}H${b.x}"/>` : `<path class="${cl}" marker-end="${mk}" d="M${a.x} ${y}H${b.x + cw}"/>`;
    } else out += `<path class="${cl}" marker-end="${mk}" d="M${a.x + cw / 2} ${a.y + ch}V${b.y}"/>`;
  }
  const last = pos[cards.length - 1], first = pos[0];
  if (closing)
    out += per === 1
      ? `<path class="d-flow-acc" marker-end="url(#${id}a)" d="M${last.x + cw} ${last.y + ch / 2}h${m - 6}V${first.y + ch / 2}H${first.x + cw + 2}"/>`
      : `<path class="d-flow-acc" marker-end="url(#${id}a)" d="M${last.x + cw / 2} ${last.y}V${first.y + ch}"/>`;
  return { svg: out, h: y0 + rows * ch + (rows - 1) * gap + 14, cw, pos };
}

// ── Phones ──
// How big a figure's text reads on a phone: its smallest text size (its d-* class, else its font-size
// attribute) × the width the svg is drawn at (`shown`, px) ÷ its viewBox width. Under PHONE.min the
// figure needs a narrow layout.
export const PHONE = { viewport: 393, min: 11 };
export function phoneText(svg, shown) {
  const { W, texts } = parse(svg);
  let min = null;
  for (const t of texts) if (t.text && (!min || t.fs < min.fs)) min = t;
  if (!min || !W) return { px: Infinity, text: "" };
  return { px: Math.round(((min.fs * shown) / W) * 10) / 10, text: min.text };
}
