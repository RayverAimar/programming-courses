// Local server: serves dist/, rebuilds on save and reloads the browser.
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync, watch } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const PORT = Number(process.env.PORT || 4400);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".wasm": "application/wasm",
  ".mjs": "text/javascript; charset=utf-8",
  ".zip": "application/zip",
  ".txt": "text/plain; charset=utf-8",
};

// Live reload from the development server (a file, so the page's Content Security Policy allows it).
const LIVE = `\n<script src="/__live.js"></script>`;
const LIVE_JS = `(function () {
  const es = new EventSource("/__reload");
  es.addEventListener("reload", () => location.reload());
  es.addEventListener("error", () => {});
})();`;

let building = false;
let version = 0;
const clients = new Set();

function build(reason) {
  if (building) return;
  building = true;
  const started = Date.now();
  const out = spawnSync(process.execPath, [join(ROOT, "scripts", "build.mjs")], { encoding: "utf8" });
  building = false;
  if (out.status !== 0) {
    console.error(`\n✗ build failed (${reason})\n${out.stderr || out.stdout}`);
    return;
  }
  version++;
  const summary = (out.stdout || "").trim().split("\n")[0];
  console.log(`✓ ${summary}  ·  ${Date.now() - started} ms  ·  ${reason}`);
  for (const res of clients) res.write("event: reload\ndata: 1\n\n");
}

const WATCHED = ["src", "content", "scripts", "platform/web", "platform/build", "build"];
const pending = new Map();
for (const dir of WATCHED) {
  const full = join(ROOT, dir);
  if (!existsSync(full)) continue;
  watch(full, { recursive: true }, (_type, file) => {
    if (!file || /(^|\/)\./.test(file)) return;
    if (file.endsWith("serve.mjs")) return;
    clearTimeout(pending.get(dir));
    pending.set(dir, setTimeout(() => build(`${dir}/${file}`), 120));
  });
}

const server = createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (url.pathname === "/__live.js") {
    res.writeHead(200, { "content-type": MIME[".js"], "cache-control": "no-store" });
    return res.end(LIVE_JS);
  }
  if (url.pathname === "/__reload") {
    res.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    });
    res.write(`retry: 500\n\n`);
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }

  // A path ending in "/" (the root, "/en/") serves that folder's index.html.
  const rel = url.pathname.endsWith("/") ? url.pathname + "index.html" : url.pathname;
  const file = join(DIST, rel.replace(/^\/+/, ""));
  if (!file.startsWith(DIST) || !existsSync(file)) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    return res.end("Not here.");
  }

  if (statSync(file).isDirectory()) {
    res.writeHead(301, { location: url.pathname + "/" + url.search });
    return res.end();
  }
  const ext = extname(file);
  let body = readFileSync(file);
  if (ext === ".html") body = Buffer.concat([body, Buffer.from(LIVE)]);
  res.writeHead(200, {
    "content-type": MIME[ext] || "application/octet-stream",
    "cache-control": "no-store",
    "x-build": String(version),
  });
  res.end(body);
});

build("startup");
server.listen(PORT, () => {
  console.log(`\n  Loop at http://localhost:${PORT}`);
  console.log(`  Watching ${WATCHED.join(", ")} — every save rebuilds and reloads.\n`);
});
