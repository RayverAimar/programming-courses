// The app icon in every size the three systems ask for, drawn from one SVG (build/icon.svg):
//   build/icons/<n>x<n>.png   Linux, and the source of the rest
//   build/icon.icns           macOS (iconutil, only on a Mac)
//   build/icon.ico            Windows (PNG-in-ICO, 16 to 256)
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { Resvg } from "@resvg/resvg-js";

const ROOT = process.cwd();
const SVG = readFileSync(join(ROOT, "build", "icon.svg"));
const SIZES = [16, 24, 32, 48, 64, 128, 256, 512, 1024];
const png = (n) => new Resvg(SVG, { fitTo: { mode: "width", value: n } }).render().asPng();

mkdirSync(join(ROOT, "build", "icons"), { recursive: true });
const out = {};
for (const n of SIZES) {
  out[n] = png(n);
  writeFileSync(join(ROOT, "build", "icons", `${n}x${n}.png`), out[n]);
}

// ICO: a directory of PNG images (Windows Vista and later read PNG entries).
const ico = [16, 24, 32, 48, 64, 128, 256];
const header = Buffer.alloc(6 + 16 * ico.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(ico.length, 4);
let offset = header.length;
ico.forEach((n, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(n >= 256 ? 0 : n, e);
  header.writeUInt8(n >= 256 ? 0 : n, e + 1);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(out[n].length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += out[n].length;
});
writeFileSync(join(ROOT, "build", "icon.ico"), Buffer.concat([header, ...ico.map((n) => out[n])]));

if (process.platform === "darwin") {
  const set = join(tmpdir(), `icon-${process.pid}.iconset`);
  rmSync(set, { recursive: true, force: true });
  mkdirSync(set);
  for (const n of [16, 32, 128, 256, 512]) {
    writeFileSync(join(set, `icon_${n}x${n}.png`), out[n]);
    writeFileSync(join(set, `icon_${n}x${n}@2x.png`), out[n * 2]);
  }
  const r = spawnSync("iconutil", ["-c", "icns", set, "-o", join(ROOT, "build", "icon.icns")], { encoding: "utf8" });
  rmSync(set, { recursive: true, force: true });
  if (r.status !== 0) throw new Error(`iconutil failed: ${r.stderr}`);
}
console.log(`Icons: ${SIZES.length} PNG sizes, icon.ico${existsSync(join(ROOT, "build", "icon.icns")) ? ", icon.icns" : ""}`);
