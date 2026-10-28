// Real photos in a lesson (docs/components.md, "Photo"). A photo is attached to the text it
// illustrates, in the Markdown:
//
//   <!-- photo: id -->            right before the paragraph it illustrates; its text runs to the
//   …paragraphs…                  next heading, rule, photo, revealed answer or <details>, or to
//   <!-- /photo -->               an explicit "<!-- /photo -->"
//   <!-- photo: id left -->       the same, the photo on the left
//
// Like a printed book: the photo floats (right, or left) at the top of its text, which wraps around
// it and runs full width below it; where the text column is narrower than ~640 px the photo goes
// full width under the first block of its text. Pick text that runs well past the photo's height.
// The caption (what, where, when) and a credit line sit under the image, inside the float.
// content/img/photos.json holds each photo: { file, w, h, sw, alt: {es, en}, caption: {es, en},
// credit: { author, license, source, url } } (author and license may be { es, en }), with
// <file>.webp (long side ~1600) and <file>-sm.webp (~800) next to it. A portrait photo floats
// narrower. The lightbox is web/core/photos.js.
import { readFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";

// Where a photo's text ends (outside code fences): a heading, a rule, the next photo or its close, a
// revealed answer, a disclosure.
const CLOSE = /^\s*<!--\s*\/photo\s*-->\s*$/;
const STOP = /^\s*(?:<!--\s*\/?photo\b|#{1,6}\s|(?:-{3,}|\*{3,}|_{3,})\s*$|\*(?:Answer|Respuesta):\*|<details\b)/;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function loadPhotos(contentDir) {
  const file = join(contentDir, "img", "photos.json");
  const photos = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
  for (const [id, p] of Object.entries(photos)) {
    for (const f of [`${p.file}.webp`, `${p.file}-sm.webp`]) if (!existsSync(join(contentDir, "img", f))) throw new Error(`photo ${id}: missing content/img/${f}`);
    for (const k of ["alt", "caption"]) if (!p[k] || !p[k].es || !p[k].en) throw new Error(`photo ${id}: ${k} needs es and en`);
    if (!p.w || !p.h || !p.credit || !p.credit.url) throw new Error(`photo ${id}: needs w, h and credit.url`);
  }
  return photos;
}

// One line of HTML, so Markdown keeps it whole. root: the path from the page to dist/ ("" for the
// default language, "../" for the others); zoom: the button's label ("Ampliar foto").
export function photoFigure(p, { lang, root, zoom }) {
  const big = `${root}img/${p.file}.webp`, small = `${root}img/${p.file}-sm.webp`;
  const c = p.credit;
  const loc = (v) => (v && typeof v === "object" ? v[lang] : v);
  const credit = [loc(c.author), loc(c.license)].filter(Boolean).map(esc).join(" · ");
  return (
    `<figure class="photo${p.h > p.w * 1.1 ? " photo-tall" : ""}"><button type="button" class="photo-zoom" data-full="${big}" aria-label="${esc(zoom)}: ${esc(p.alt[lang])}">` +
    `<img src="${small}" srcset="${small} ${p.sw || 800}w, ${big} ${p.w}w" sizes="(min-width: 1100px) 352px, (min-width: 700px) 720px, 100vw" width="${p.w}" height="${p.h}" alt="${esc(p.alt[lang])}" loading="lazy" decoding="async"></button>` +
    `<figcaption><span class="photo-cap">${p.caption[lang]}</span> <span class="photo-credit">${credit}${credit ? " · " : ""}<a href="${esc(c.url)}">${esc(c.source || "Wikimedia Commons")}</a></span></figcaption></figure>`
  );
}

// Text and photo as one unit; the unit holds the float, so nothing after it gets squeezed.
export const photoUnit = (textMd, figure, left = false) =>
  `<div class="photo-unit${left ? " photo-left" : ""}"><div class="photo-in">\n${figure}\n\n${textMd.trim()}\n\n</div></div>`;

// Replaces every marker in a Markdown string, pairing it with its text; an unknown id, or a marker
// with no text after it, fails the build.
export function injectPhotos(md, photos, opts, used) {
  const lines = md.split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*<!--\s*photo:\s*([\w-]+)(\s+left)?\s*-->\s*$/);
    if (!m) { out.push(lines[i]); continue; }
    const p = photos[m[1]];
    if (!p) throw new Error(`Unknown photo "${m[1]}" (add it to content/img/photos.json)`);
    used?.add(m[1]);
    let j = i + 1;
    while (j < lines.length && !lines[j].trim()) j++;
    let stop = -1;
    for (let k = j, fence = false; k < lines.length && stop === -1; k++) {
      if (/^\s*(```|~~~)/.test(lines[k])) fence = !fence;
      else if (!fence && STOP.test(lines[k])) stop = k;
    }
    const end = stop === -1 ? lines.length : stop;
    const skip = stop !== -1 && CLOSE.test(lines[stop]) ? 1 : 0;
    const text = lines.slice(j, end).join("\n");
    if (!text.trim() || /^\s*#/.test(text)) throw new Error(`photo ${m[1]}: put it right before the paragraph it illustrates`);
    out.push("", photoUnit(text, photoFigure(p, opts), !!m[2]), "");
    i = end + skip - 1;
  }
  return out.join("\n");
}

// Copies the photos the pages use into dist/img/, so the site and the offline app carry them.
export function copyPhotos(contentDir, dist, photos, used) {
  let bytes = 0;
  for (const id of used) {
    for (const f of [`${photos[id].file}.webp`, `${photos[id].file}-sm.webp`]) {
      const to = join(dist, "img", f);
      mkdirSync(dirname(to), { recursive: true });
      copyFileSync(join(contentDir, "img", f), to);
      bytes += readFileSync(to).length;
    }
  }
  return bytes;
}
