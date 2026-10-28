// Assembles the static site every repo ships, on GitHub Pages and inside the desktop app:
//   dist/index.html, dist/<lang>/index.html   the shell (no content inside)
//   dist/assets/app.js, app.css, fonts/       one bundle and one stylesheet for every page
//   dist/data/<lang>/site.json                the course index; module files are loaded on demand
//   dist/vendor/                              sql.js's WebAssembly (and whatever the repo vendors)
// The repo's build produces the data and calls buildSite(); see docs/platform.md.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import * as esbuild from "esbuild";

const PLATFORM = join(dirname(fileURLToPath(import.meta.url)), "..");
const WEB = join(PLATFORM, "web");
const read = (p) => readFileSync(p, "utf8");

export const CORE_CSS = ["tokens.css", "base.css", "components.css", "charts.css", "shell.css", "prose.css", "screens.css", "photos.css"].map((f) => join(WEB, "styles", f));

// UI strings: the platform's, then the repo's on top (a repo may reword anything).
export function strings(repoUi) {
  const core = JSON.parse(read(join(WEB, "ui.json")));
  const out = {};
  for (const lang of Object.keys(core)) out[lang] = { ...core[lang], ...(repoUi[lang] || {}) };
  return out;
}

// The search index (data/<lang>/search.json) is one row per page: { h: link, t: title, w: where,
// k: "w" for a Taller, s: sections(html) }. core/search.js reads it.
const plainText = (html) => String(html).replace(/<\/?(?:p|h\d|li|td|th|div|section|span|br|figcaption|pre)\b[^>]*>/g, " ").replace(/<[^>]+>/g, "")
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
// A page's text cut at each heading, as [anchor, heading, text]. A small heading points at the section
// above it; with anchors: false (a Taller) no section is linked.
export function searchSections(html, { anchors = true } = {}) {
  const out = [["", "", ""]];
  let h2 = "";
  let at = 0;
  for (const m of String(html).matchAll(/<h([23])\b[^>]*?(?:id="([^"]+)")?[^>]*>([\s\S]*?)<\/h\1>/g)) {
    out[out.length - 1][2] += " " + html.slice(at, m.index);
    if (m[1] === "2") h2 = m[2] || h2;
    out.push([anchors ? (m[1] === "2" ? m[2] || "" : h2) : "", plainText(m[3]), ""]);
    at = m.index + m[0].length;
  }
  out[out.length - 1][2] += " " + html.slice(at);
  return out.map(([a, h, x]) => [a, h, plainText(x)]).filter(([, h, x]) => h || x);
}

// Every Lucide icon named in a quoted string in the given sources is bundled, and nothing else.
function iconsPlugin(root, scanDirs, extra = []) {
  const lucide = join(root, "node_modules", "lucide-static", "icons");
  return {
    name: "icons",
    setup(build) {
      build.onResolve({ filter: /^virtual:icons$/ }, () => ({ path: "icons", namespace: "icons" }));
      build.onLoad({ filter: /.*/, namespace: "icons" }, () => {
        const names = new Set(extra);
        const walk = (p) => {
          for (const f of readdirSync(p)) {
            const full = join(p, f);
            if (statSync(full).isDirectory()) walk(full);
            else if (/\.(js|mjs)$/.test(f)) for (const m of read(full).matchAll(/["'`]([a-z][a-z0-9]*(?:-[a-z0-9]+)*)["'`]/g)) names.add(m[1]);
          }
        };
        scanDirs.forEach(walk);
        const icons = {};
        for (const n of [...names].sort()) {
          const f = join(lucide, `${n}.svg`);
          if (!existsSync(f)) continue;
          icons[n] = read(f).replace(/<!--[\s\S]*?-->/g, "").replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/\s*\n\s*/g, "");
        }
        return { contents: `export default ${JSON.stringify(icons)};`, loader: "js" };
      });
    },
  };
}

// Kept in step with TEXT_SIZES in web/core/shell.js.
const TEXT_SIZES = { s: 0.92, m: 1, l: 1.08, xl: 1.16 };
const THEME_SCRIPT = (prefix) =>
  `(function(){var d=document.documentElement;try{var t=JSON.parse(localStorage.getItem(${JSON.stringify(prefix + ".theme")}));if(t==="light"||t==="dark")d.setAttribute("data-theme",t)}catch(e){}try{var k=${JSON.stringify(TEXT_SIZES)}[JSON.parse(localStorage.getItem(${JSON.stringify(prefix + ".textSize")}))];if(k)d.style.setProperty("--fs-k",k)}catch(e){}})();`;

export function csp(themeScript) {
  const hash = createHash("sha256").update(themeScript).digest("base64");
  return [
    "default-src 'self'",
    `script-src 'self' 'sha256-${hash}' 'unsafe-eval' 'wasm-unsafe-eval' blob:`,
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join("; ");
}

export async function buildSite({ root, config, ui, entry, css = [], define = {}, data, scan = [] }) {
  const dist = join(root, "dist");
  rmSync(dist, { recursive: true, force: true });
  const assets = join(dist, "assets");
  mkdirSync(join(assets, "fonts"), { recursive: true });
  mkdirSync(join(dist, "vendor"), { recursive: true });

  const nm = join(root, "node_modules");
  const fonts = {
    "bricolage-latin.woff2": "@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-opsz-normal.woff2",
    "bricolage-latin-ext.woff2": "@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-ext-opsz-normal.woff2",
    "newsreader-latin.woff2": "@fontsource-variable/newsreader/files/newsreader-latin-opsz-normal.woff2",
    "newsreader-latin-ext.woff2": "@fontsource-variable/newsreader/files/newsreader-latin-ext-opsz-normal.woff2",
    "newsreader-latin-italic.woff2": "@fontsource-variable/newsreader/files/newsreader-latin-opsz-italic.woff2",
  };
  for (const [to, from] of Object.entries(fonts)) copyFileSync(join(nm, from), join(assets, "fonts", to));
  copyFileSync(join(nm, "@fontsource-variable/bricolage-grotesque/LICENSE"), join(assets, "fonts", "OFL-BricolageGrotesque.txt"));
  copyFileSync(join(nm, "@fontsource-variable/newsreader/LICENSE"), join(assets, "fonts", "OFL-Newsreader.txt"));
  copyFileSync(join(nm, "sql.js/dist/sql-wasm-browser.wasm"), join(dist, "vendor", "sql-wasm.wasm"));
  copyFileSync(config.iconSvg, join(assets, "icon.svg"));

  const js = await esbuild.build({
    entryPoints: [entry],
    bundle: true, write: false, format: "iife", minify: !process.env.DEBUG_BUILD, target: "es2020", platform: "browser",
    define: { ...define },
    plugins: [iconsPlugin(root, [join(WEB, "core"), ...scan], [config.mark].filter(Boolean))],
    logLevel: "warning",
  });
  writeFileSync(join(assets, "app.js"), js.outputFiles[0].text);
  const cssText = [...CORE_CSS, ...css].map(read).join("\n");
  const cssOut = await esbuild.transform(cssText, { loader: "css", minify: true });
  writeFileSync(join(assets, "app.css"), cssOut.code);

  const version = createHash("sha1").update(js.outputFiles[0].text + cssOut.code).digest("hex").slice(0, 10);
  const themeScript = THEME_SCRIPT(config.prefix);
  const policy = csp(themeScript);
  for (const lang of config.langs) {
    const dir = lang === config.defaultLang ? dist : join(dist, lang);
    mkdirSync(dir, { recursive: true });
    const r = relative(dir, dist);
    const page = read(join(WEB, "template.html")).replace(/\{\{(\w+)\}\}/g, (_m, k) => ({
      lang, root: r ? `${r}/` : "./", csp: policy, version, themeScript,
      title: ui[lang]["doc.title"], description: ui[lang]["doc.description"], noscript: ui[lang]["doc.noscript"],
    }[k] ?? ""));
    writeFileSync(join(dir, "index.html"), page);
  }
  for (const [rel, value] of Object.entries(data)) {
    const p = join(dist, "data", rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, typeof value === "string" ? value : JSON.stringify(value));
  }
  writeFileSync(join(dist, ".nojekyll"), "");
  return { dist, version, csp: policy };
}

// Downloads a pinned file once, checks it against its published hash, and caches it in .cache/.
export async function fetchPinned(root, url, integrity) {
  const cache = join(root, ".cache");
  mkdirSync(cache, { recursive: true });
  const file = join(cache, url.split("/").pop());
  const [algo, expected] = integrity.split("-");
  const check = (buf) => createHash(algo).update(buf).digest("base64") === expected;
  if (existsSync(file) && check(readFileSync(file))) return file;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (!check(buf)) throw new Error(`${url}: checksum mismatch (expected ${integrity})`);
  writeFileSync(file, buf);
  return file;
}
