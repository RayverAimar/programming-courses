/**
 * Fetches a photo for the lessons: downloads the original, makes the two WebP sizes the lessons use
 * (long side ~1600 and ~800, with cwebp) and adds its entry to content/img/photos.json with the
 * credit filled in and placeholders for alt and caption, to be written by hand (the build refuses a
 * lesson that uses a photo whose alt or caption still says TODO). See docs/components.md, "Photo".
 *
 *   node platform/build/photo.ts search <words>                  files on Wikimedia Commons, with size and license
 *   node platform/build/photo.ts search-web <words>              Google Images: each result's page and size
 *   node platform/build/photo.ts add <id> <Commons file page URL or "File:Name.jpg">
 *   node platform/build/photo.ts add <id> --image <image URL or local file> --page <page URL> --author "…" --license "…"
 *                                 [--source "…"]       any other source; the credit is what the page says
 *   node platform/build/photo.ts set <id> <file.json>            merges {alt, caption, credit…} into the entry
 *
 * Several people (or agents) may add photos at once: every write to photos.json takes a lock, so
 * write alt and caption with `set` rather than by editing the file by hand.
 *
 * Options for add: --file <path under content/img, no extension> (default: <course>/<id>, the course folder taken from the id's first word), --force
 * (replace an existing entry; its alt and caption are kept), --cache <dir> (default .cache/photos).
 * Needs cwebp (libwebp) on the PATH, or CWEBP=/path/to/cwebp. A GIF becomes an animated WebP (long
 * side ~720 and ~400), which also needs ffmpeg and gif2webp (FFMPEG=…, GIF2WEBP=…).
 */

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, join, resolve } from "node:path";

const repo = resolve(import.meta.dirname, "..", "..");
const imgDir = join(repo, "content", "img");
const manifest = join(imgDir, "photos.json");
const UA = "CoursePhotos/0.1 (https://github.com/RayverAimar; photo fetch script)";
const BIG = 1600;
const SMALL = 800;
/** An animation (a GIF) is kept smaller: every frame counts. */
const ANIM_BIG = 720;
const ANIM_SMALL = 400;

const argv = process.argv.slice(2);
const opt = (name: string) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const positional = argv.filter((a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--"));

/** Text of an HTML fragment: tags dropped, entities decoded, spaces collapsed. */
export function stripHtml(html: string): string {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    ndash: "–",
    mdash: "—",
    copy: "©",
  };
  return html
    .replace(/<(\w+)[^>]*display:\s*none[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(Number.parseInt(n, 16)))
    .replace(/&(\w+);/g, (m, n) => named[n] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

/** "File:Name.jpg" from a Commons file page URL, a file name, or "File:…". */
export function commonsTitle(input: string): string {
  let name = input.trim();
  const m = /\/wiki\/(?:File|Archivo|Datei|Fichier):(.+)$/i.exec(name);
  if (m?.[1]) name = decodeURIComponent(m[1].split(/[?#]/)[0] ?? "");
  name = name.replace(/^(?:File|Archivo|Datei|Fichier):/i, "").replace(/_/g, " ");
  return `File:${name}`;
}

/** Width and height of a WebP file, from its header. */
export function webpSize(buf: Buffer): { w: number; h: number } {
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP")
    throw new Error("not a WebP file");
  const chunk = buf.toString("ascii", 12, 16);
  if (chunk === "VP8X") return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
  if (chunk === "VP8L") {
    const b = buf.readUInt32LE(21);
    return { w: 1 + (b & 0x3fff), h: 1 + ((b >> 14) & 0x3fff) };
  }
  if (chunk === "VP8 ")
    return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
  throw new Error(`unknown WebP chunk ${chunk}`);
}

/**
 * A GET that retries a few times when the server says "too many requests", waiting at most 30 s
 * each time (Commons can ask for 10 minutes: better to fall back than to hang), and gives up on a
 * request that takes more than 2 minutes.
 */
async function get(url: string): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(url, {
      headers: { "user-agent": UA },
      redirect: "follow",
      signal: AbortSignal.timeout(120_000),
    });
    if (r.ok) return r;
    if (r.status !== 429 || attempt === 2) throw new Error(`${url}: HTTP ${r.status}`);
    const wait = Math.min(Number(r.headers.get("retry-after")) || 5 * 2 ** attempt, 30);
    await new Promise((ok) => setTimeout(ok, wait * 1000));
  }
}

/** Commons renders thumbnails only at these widths without being asked twice. */
const THUMB_WIDTHS = [1920, 1280, 960, 500];

interface Credit {
  author: string;
  license: string;
  source: string;
  url: string;
}

interface Found {
  image: string;
  /** Commons' own rendering of the same file, used when the original cannot be downloaded. */
  fallback?: string;
  width?: number;
  height?: number;
  credit: Credit;
}

const api = (params: Record<string, string>) =>
  `https://commons.wikimedia.org/w/api.php?${new URLSearchParams({ format: "json", formatversion: "2", ...params })}`;

type ImageInfo = {
  url: string;
  width: number;
  height: number;
  descriptionurl: string;
  extmetadata?: Record<string, { value: string }>;
};

/** A Commons file: its original and the credit its page states. */
async function fromCommons(input: string): Promise<Found> {
  const title = commonsTitle(input);
  const data = (await (
    await get(
      api({
        action: "query",
        titles: title,
        prop: "imageinfo",
        iiprop: "url|size|extmetadata",
      }),
    )
  ).json()) as { query: { pages: { missing?: boolean; imageinfo?: ImageInfo[] }[] } };
  const info = data.query.pages[0]?.imageinfo?.[0];
  if (!info) throw new Error(`${title}: not found on Wikimedia Commons`);
  // A huge original (a 20 000 px scan) is fetched as Commons' own 3200 px rendering of it: the
  // same image, and plenty for the 1600 px the lessons use.
  let image = info.url;
  if (Math.max(info.width, info.height) > 4000) {
    const width = Math.round((3200 * info.width) / Math.max(info.width, info.height));
    const thumb = (await (
      await get(
        api({
          action: "query",
          titles: title,
          prop: "imageinfo",
          iiprop: "url",
          iiurlwidth: String(width),
        }),
      )
    ).json()) as { query: { pages: { imageinfo?: { thumburl?: string }[] }[] } };
    image = thumb.query.pages[0]?.imageinfo?.[0]?.thumburl ?? image;
  }
  // Commons often refuses originals to scripts (HTTP 429) while it still serves its standard
  // thumbnails: keep the largest one as a fallback.
  let fallback: string | undefined;
  const fw = THUMB_WIDTHS.find((w) => w <= info.width);
  if (image === info.url && fw && fw < info.width) {
    const thumb = (await (
      await get(
        api({
          action: "query",
          titles: title,
          prop: "imageinfo",
          iiprop: "url",
          iiurlwidth: String(fw),
        }),
      )
    ).json()) as { query: { pages: { imageinfo?: { thumburl?: string }[] }[] } };
    fallback = thumb.query.pages[0]?.imageinfo?.[0]?.thumburl;
  }
  const meta = (k: string) => stripHtml(info.extmetadata?.[k]?.value ?? "");
  const license = meta("LicenseShortName") || meta("UsageTerms") || meta("License");
  if (!license) throw new Error(`${title}: the page states no license; give it with --license`);
  return {
    image,
    ...(fallback ? { fallback } : {}),
    ...(image === info.url ? { width: info.width, height: info.height } : {}),
    credit: {
      author: meta("Artist") || meta("Credit") || "Unknown",
      license,
      source: "Wikimedia Commons",
      url: info.descriptionurl,
    },
  };
}

function cwebp(): string {
  if (process.env.CWEBP) return process.env.CWEBP;
  for (const p of ["/opt/homebrew/bin/cwebp", "/usr/local/bin/cwebp", "/usr/bin/cwebp"])
    if (existsSync(p)) return p;
  return "cwebp";
}

/** A WebP whose long side is at most `long` (never enlarged); returns its size. */
function toWebp(src: string, out: string, long: number, w: number, h: number) {
  const scale = Math.min(1, long / Math.max(w, h));
  const [rw, rh] = w >= h ? [Math.round(w * scale), 0] : [0, Math.round(h * scale)];
  mkdirSync(dirname(out), { recursive: true });
  execFileSync(
    cwebp(),
    ["-quiet", "-q", "82", "-sharp_yuv", "-mt", "-metadata", "none"]
      .concat(scale < 1 ? ["-resize", String(rw), String(rh)] : [])
      .concat([src, "-o", out]),
    { stdio: ["ignore", "inherit", "inherit"] },
  );
  return webpSize(readFileSync(out));
}

/**
 * An animated WebP from a GIF, its long side at most `long`, 10 frames a second: ffmpeg resizes the
 * GIF (with a palette made for it) and gif2webp encodes it.
 */
function animToWebp(src: string, out: string, long: number, w: number, h: number) {
  const scale = Math.min(1, long / Math.max(w, h));
  const size = w >= h ? `${Math.round(w * scale)}:-2` : `-2:${Math.round(h * scale)}`;
  const tmp = `${out}.tmp.gif`;
  mkdirSync(dirname(out), { recursive: true });
  execFileSync(
    process.env.FFMPEG ?? "ffmpeg",
    [
      "-v",
      "error",
      "-y",
      "-i",
      src,
      "-vf",
      `fps=10,scale=${size}:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse`,
      tmp,
    ],
    { stdio: ["ignore", "inherit", "inherit"] },
  );
  execFileSync(
    process.env.GIF2WEBP ?? "gif2webp",
    ["-quiet", "-lossy", "-q", "50", "-m", "6", "-mt", tmp, "-o", out],
    { stdio: ["ignore", "inherit", "inherit"] },
  );
  rmSync(tmp);
  return webpSize(readFileSync(out));
}

/** cwebp reads PNG, JPEG, TIFF and WebP; anything else goes through PNG first (macOS sips). */
function readable(file: string): string {
  const ext = extname(file).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".tif", ".tiff", ".webp"].includes(ext)) return file;
  const png = `${file}.png`;
  execFileSync("sips", ["-s", "format", "png", file, "--out", png], { stdio: "ignore" });
  return png;
}

/** Size of an image file, from its header (PNG, WebP, JPEG; anything else through sips). */
function imageSize(file: string): { w: number; h: number } {
  const buf = readFileSync(file);
  if (buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG")
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  if (buf.toString("ascii", 0, 4) === "RIFF") return webpSize(buf);
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    // JPEG: the first start-of-frame marker holds the size.
    for (let i = 2; i < buf.length; ) {
      if (buf[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = buf[i + 1] ?? 0;
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker))
        return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
      i += 2 + len;
    }
  }
  const out = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", file], {
    encoding: "utf8",
  });
  const w = Number(/pixelWidth: (\d+)/.exec(out)?.[1]);
  const h = Number(/pixelHeight: (\d+)/.exec(out)?.[1]);
  if (!w || !h) throw new Error(`${file}: cannot read its size`);
  return { w, h };
}

type Manifest = Record<string, Record<string, unknown>>;

async function add() {
  const [, id, input] = positional;
  if (!id || !/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error("add <id>: a-z, 0-9 and -");
  const image = opt("--image");
  let found: Found;
  if (image) {
    const page = opt("--page");
    const author = opt("--author");
    const license = opt("--license");
    if (!page || !author || !license)
      throw new Error(
        'an image from outside Commons needs --page, --author and --license as the page states them ("© Owner" when it states no license)',
      );
    found = {
      image,
      credit: { author, license, source: opt("--source") ?? new URL(page).hostname, url: page },
    };
  } else {
    if (!input) throw new Error("add <id> <Commons file> (or --image … --page …)");
    found = await fromCommons(input);
  }
  const cache = resolve(opt("--cache") ?? join(repo, ".cache", "photos"));
  mkdirSync(cache, { recursive: true });
  // --image may also be a file on this machine (a GIF cut from a video, say).
  const local = existsSync(found.image) ? resolve(found.image) : null;
  const ext = (extname(local ?? new URL(found.image).pathname) || ".img").toLowerCase();
  const orig = join(cache, `${id}${ext}`);
  console.log(`↓ ${found.image}`);
  let original = true;
  try {
    if (local) writeFileSync(orig, readFileSync(local));
    else writeFileSync(orig, Buffer.from(await (await get(found.image)).arrayBuffer()));
  } catch (e) {
    if (!found.fallback) throw e;
    console.log(`  ${(e as Error).message}; using Commons' rendering instead\n↓ ${found.fallback}`);
    writeFileSync(orig, Buffer.from(await (await get(found.fallback)).arrayBuffer()));
    original = false;
  }
  const src = readable(orig);
  const size =
    original && found.width && found.height ? { w: found.width, h: found.height } : imageSize(src);
  // Files live in their course's folder: "crypto-ftx-arena" goes to content/img/crypto/.
  const block = id.split("-")[0] ?? "";
  // A photo fetched again (--force) keeps the path it had.
  const before = existsSync(manifest)
    ? (JSON.parse(readFileSync(manifest, "utf8")) as Manifest)[id]?.file
    : undefined;
  const file =
    opt("--file") ??
    (typeof before === "string" ? before : existsSync(join(imgDir, block)) ? `${block}/${id}` : id);
  const anim = ext === ".gif";
  const big = anim
    ? animToWebp(orig, join(imgDir, `${file}.webp`), ANIM_BIG, size.w, size.h)
    : toWebp(src, join(imgDir, `${file}.webp`), BIG, size.w, size.h);
  const small = anim
    ? animToWebp(orig, join(imgDir, `${file}-sm.webp`), ANIM_SMALL, size.w, size.h)
    : toWebp(src, join(imgDir, `${file}-sm.webp`), SMALL, size.w, size.h);
  await updateManifest((photos) => {
    const old = photos[id];
    if (old && !argv.includes("--force"))
      throw new Error(`photo ${id} is already in content/img/photos.json (--force replaces it)`);
    photos[id] = {
      file,
      w: big.w,
      h: big.h,
      sw: small.w,
      ...(anim ? { anim: true } : {}),
      alt: old?.alt ?? { es: "TODO", en: "TODO" },
      caption: old?.caption ?? { es: "TODO", en: "TODO" },
      credit: found.credit,
    };
  });
  console.log(
    `✓ ${id}: original ${size.w}×${size.h} → content/img/${file}.webp ${big.w}×${big.h}, -sm ${small.w}×${small.h}`,
  );
  console.log(`  credit: ${found.credit.author} · ${found.credit.license} · ${found.credit.url}`);
  if (!anim && Math.max(size.w, size.h) < 1200)
    console.log("  ! the original is under 1200 px on its long side");
  console.log("  now write its alt and caption (es, en) in content/img/photos.json");
}

async function search() {
  const words = positional.slice(1).join(" ");
  if (!words) throw new Error("search <words>");
  const data = (await (
    await get(
      api({
        action: "query",
        generator: "search",
        gsrsearch: `filetype:bitmap ${words}`,
        gsrnamespace: "6",
        gsrlimit: "20",
        prop: "imageinfo",
        iiprop: "size|extmetadata|url",
      }),
    )
  ).json()) as { query?: { pages: { title: string; index: number; imageinfo?: ImageInfo[] }[] } };
  const pages = (data.query?.pages ?? []).sort((a, b) => a.index - b.index);
  for (const p of pages) {
    const i = p.imageinfo?.[0];
    if (!i) continue;
    const lic = stripHtml(i.extmetadata?.LicenseShortName?.value ?? "?");
    console.log(`${i.width}×${i.height}  ${lic.padEnd(16)}  ${p.title}\n    ${i.descriptionurl}`);
  }
}

/**
 * Image search on the web: Google Images, or Bing Images when Google answers with its "unusual
 * traffic" page (it does for headless browsers on many networks). Prints each result's original
 * (never the search engine's thumbnail), its size and the page it is on, to pass to `add`.
 */
async function searchWeb() {
  const words = positional.slice(1).join(" ");
  if (!words) throw new Error("search-web <words>");
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const results: { image: string; page: string; size: string; title: string }[] = [];
  try {
    const page = await browser.newPage({ locale: "en-US" });
    await page.goto(`https://www.google.com/search?tbm=isch&hl=en&q=${encodeURIComponent(words)}`);
    await page.waitForTimeout(1500);
    if (!page.url().includes("/sorry/")) {
      // The results page carries each original as ["https://…", height, width], followed by the
      // page it is on.
      const html = await page.content();
      for (const m of html.matchAll(/\["(https?:\/\/[^"]+?)",(\d+),(\d+)\]/g)) {
        const [all, url = "", h, w] = m;
        if (/gstatic\.com|googleusercontent|google\.com/.test(url)) continue;
        const after = html.slice((m.index ?? 0) + all.length, (m.index ?? 0) + 4000);
        const pageUrl = /"(https?:\/\/(?![^"]*(?:gstatic|google)\.)[^"]+?)"/.exec(after)?.[1] ?? "";
        const unjson = (u: string) => JSON.parse(`"${u}"`) as string;
        results.push({
          image: unjson(url),
          page: unjson(pageUrl),
          size: `${w}×${h}`,
          title: "",
        });
      }
    }
    if (!results.length) {
      console.log("(Google gave no results to read here; searching Bing Images)");
      await page.goto(
        `https://www.bing.com/images/search?q=${encodeURIComponent(words)}&qft=+filterui:imagesize-large`,
      );
      await page.waitForTimeout(2000);
      const tiles = await page.$$eval("a.iusc", (as) =>
        as.map((a) => ({
          m: a.getAttribute("m") ?? "{}",
          size: a.closest("li")?.querySelector(".img_info .nowrap")?.textContent ?? "?",
        })),
      );
      for (const t of tiles) {
        const m = JSON.parse(t.m) as { murl?: string; purl?: string; t?: string };
        if (m.murl)
          results.push({ image: m.murl, page: m.purl ?? "", size: t.size, title: m.t ?? "" });
      }
    }
  } finally {
    await browser.close();
  }
  const seen = new Set<string>();
  for (const r of results) {
    if (seen.has(r.image) || seen.size >= 25) continue;
    seen.add(r.image);
    console.log(`${r.size}  ${r.title}\n    image: ${r.image}\n    page:  ${r.page || "?"}`);
  }
}

/**
 * Reads photos.json, changes it and writes it back sorted, holding a lock (a directory next to it)
 * so two writers never lose each other's changes. A lock older than a minute is a crashed writer's.
 */
async function updateManifest(change: (photos: Manifest) => void) {
  const lock = `${manifest}.lock`;
  for (let i = 0; ; i++) {
    try {
      mkdirSync(lock);
      break;
    } catch {
      if (existsSync(lock) && Date.now() - statSync(lock).mtimeMs > 60_000) rmdirSync(lock);
      else if (i > 600) throw new Error(`${lock} is held: is another photo.ts stuck?`);
      else await new Promise((ok) => setTimeout(ok, 100));
    }
  }
  try {
    const photos: Manifest = existsSync(manifest)
      ? (JSON.parse(readFileSync(manifest, "utf8")) as Manifest)
      : {};
    change(photos);
    const sorted = Object.fromEntries(
      Object.entries(photos).sort(([a], [b]) => a.localeCompare(b)),
    );
    const tmp = `${manifest}.${process.pid}.tmp`;
    writeFileSync(tmp, `${JSON.stringify(sorted, null, 2)}\n`);
    renameSync(tmp, manifest);
  } finally {
    rmdirSync(lock);
  }
}

/** `set <id> <file.json>`: merges the file's fields (alt, caption, credit…) into the entry. */
async function set() {
  const [, id, file] = positional;
  if (!id || !file) throw new Error("set <id> <file.json>");
  const patch = JSON.parse(readFileSync(resolve(file), "utf8")) as Record<string, unknown>;
  await updateManifest((photos) => {
    const old = photos[id];
    if (!old) throw new Error(`photo ${id} is not in content/img/photos.json`);
    const merged = { ...old } as Record<string, unknown>;
    for (const [k, v] of Object.entries(patch))
      merged[k] =
        v && typeof v === "object" && !Array.isArray(v) && typeof merged[k] === "object"
          ? { ...(merged[k] as object), ...(v as object) }
          : v;
    photos[id] = merged as Manifest[string];
  });
  console.log(`✓ ${id}: ${Object.keys(patch).join(", ")} updated`);
}

const commands: Record<string, () => Promise<void>> = {
  add,
  set,
  search,
  "search-web": searchWeb,
};
const run = commands[positional[0] ?? ""];
if (!run) {
  console.error(
    "usage: node platform/build/photo.ts search|search-web|add|set … (see the top of the file)",
  );
  process.exit(2);
}
run().catch((e: Error) => {
  console.error(`✗ ${e.message}`);
  process.exit(1);
});
