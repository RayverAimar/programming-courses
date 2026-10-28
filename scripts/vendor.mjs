// Pyodide for the Python track, served from the site itself (no CDN at run time).
// The version is the `pyodide` dev dependency; the tarball is downloaded once from the npm registry,
// checked against the integrity hash in pnpm-lock.yaml, cached in .cache/ and never committed.
import { readFileSync, mkdirSync, copyFileSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { fetchPinned } from "../platform/build/site.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FILES = ["pyodide.js", "pyodide.asm.mjs", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"];

export async function vendorPyodide(dest) {
  const version = JSON.parse(readFileSync(join(ROOT, "node_modules", "pyodide", "package.json"), "utf8")).version;
  const lock = readFileSync(join(ROOT, "pnpm-lock.yaml"), "utf8");
  const m = lock.match(new RegExp(`\\n  pyodide@${version.replace(/\./g, "\\.")}:\\n    resolution: \\{integrity: (sha512-[^}\\s]+)\\}`));
  if (!m) throw new Error(`pyodide@${version} has no integrity hash in pnpm-lock.yaml`);
  const tgz = await fetchPinned(ROOT, `https://registry.npmjs.org/pyodide/-/pyodide-${version}.tgz`, m[1]);
  const out = join(ROOT, ".cache", `pyodide-${version}`);
  if (!FILES.every((f) => existsSync(join(out, "package", f)))) {
    rmSync(out, { recursive: true, force: true });
    mkdirSync(out, { recursive: true });
    const r = spawnSync("tar", ["-xzf", tgz, "-C", out, ...FILES.map((f) => `package/${f}`)], { encoding: "utf8" });
    if (r.status !== 0) throw new Error(`Extracting Pyodide failed: ${r.stderr}`);
  }
  mkdirSync(dest, { recursive: true });
  for (const f of FILES) copyFileSync(join(out, "package", f), join(dest, f));
  return version;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const v = await vendorPyodide(join(ROOT, "dist", "vendor", "pyodide"));
  console.log(`Pyodide ${v} → dist/vendor/pyodide`);
}
