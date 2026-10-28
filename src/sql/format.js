// Values as SQLite shows them: REAL keeps its ".0", NULL is NULL, a row is "a | b".
export function realText(x) {
  if (!Number.isFinite(x)) return x > 0 ? "Inf" : x < 0 ? "-Inf" : "NULL";
  let s = String(Number(x.toPrecision(15)));
  if (/e/.test(s)) s = s.replace(/^(-?\d+)(e)/, "$1.0$2");
  else if (!s.includes(".")) s += ".0";
  return s;
}
export function cellText(v, kind) {
  if (v === null || v === undefined) return "NULL";
  if (kind === "b" || v instanceof Uint8Array) return `x'${[...v].map((b) => b.toString(16).padStart(2, "0")).join("")}'`;
  if (typeof v === "number") return kind === "r" ? realText(v) : String(v);
  return String(v);
}
export const rowText = (row, kinds) => row.map((v, j) => cellText(v, kinds && kinds[j])).join(" | ");
export const asText = (res) => (res && res.cols ? res.rows.map((r, i) => rowText(r, res.kinds && res.kinds[i])).join("\n") : "");

