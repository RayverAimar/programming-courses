// Finds what a reader would see as a wall of text: runs of prose with nothing to break them (a
// sub-heading, code, a figure, a callout, a table, a list) and "the example above" with nothing
// above it in the same step. Reads the Markdown only.
//
//   node scripts/dense.mjs [path-prefix]     one line per finding: file:line  kind  detail
//   node scripts/dense.mjs --count           the totals only
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export const PROSE_LIMIT = 130;
const ABOVE = /\b(?:(?:ejemplo|figura|programa|código|tabla|diagrama|gráfico|cuadro)s? (?:de arriba|anterior)|(?:example|figure|program|code|table|diagram|chart)s? above|como vimos arriba|as we saw above)\b/i;

const words = (s) => s.match(/[\p{L}\p{N}_]+/gu)?.length ?? 0;
const isBreak = (line) => /^(#{1,6} |>|\||<|[-*+] |\d+[.)] |!\[|---\s*$)/.test(line.trim());

export function findings(file, text) {
  const out = [];
  const lines = text.split("\n");
  let fence = false, start = 0, run = 0, seen = false, para = false;
  const flush = () => {
    if (run > PROSE_LIMIT) out.push({ file, line: start + 1, kind: "dense", detail: `${run} words in a row` });
    run = 0;
  };
  lines.forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) { fence = !fence; flush(); seen = true; return; }
    if (fence) return;
    if (/^## /.test(line)) { flush(); seen = false; return; }
    if (!line.trim()) { para = false; return; }
    if (/^\$\$/.test(line.trim()) || /^<!--/.test(line.trim()) || isBreak(line)) { flush(); seen = true; return; }
    if (!seen && ABOVE.test(line)) out.push({ file, line: i + 1, kind: "above", detail: line.match(ABOVE)[0] });
    if (!run) start = i;
    run += words(line);
    para = true;
  });
  flush();
  return out;
}

function walk(dir, acc = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (n.endsWith(".md")) acc.push(p);
  }
  return acc;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = join(fileURLToPath(import.meta.url), "..", "..");
  const args = process.argv.slice(2);
  const prefix = args.find((a) => !a.startsWith("--")) || "content";
  const all = walk(join(root, "content"))
    .map((f) => relative(root, f))
    .filter((f) => f.startsWith(prefix))
    .sort()
    .flatMap((f) => findings(f, readFileSync(join(root, f), "utf8")));
  if (args.includes("--count")) {
    const by = (k) => all.filter((x) => x.kind === k).length;
    console.log(`dense: ${by("dense")}  above: ${by("above")}`);
  } else for (const x of all) console.log(`${x.file}:${x.line}  ${x.kind}  ${x.detail}`);
}
