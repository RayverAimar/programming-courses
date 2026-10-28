// Hash routes, so the same build works on GitHub Pages, on localhost and inside the app.
//   #/                       Inicio
//   #/cursos  #/progreso  #/ajustes  #/app  #/_componentes
//   #/c/<course>             Temario
//   #/c/<course>/fin         course finished
//   #/c/<course>/<module>/<lesson>[/<n>][?at=<anchor>]   Lección, or Taller step n
const extra = [];
export const addRoute = (re, name) => extra.push({ re, name });

export function parse(hash = location.hash) {
  const raw = hash.replace(/^#\/?/, "");
  const [path, qs] = raw.split("?");
  const query = Object.fromEntries(new URLSearchParams(qs || ""));
  const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
  for (const r of extra) {
    const m = path.match(r.re);
    if (m) return { name: r.name, parts, match: m, query };
  }
  if (!parts.length) return { name: "home", parts, query };
  if (["cursos", "progreso", "ajustes", "app", "_componentes"].includes(parts[0]) && parts.length === 1) return { name: parts[0], parts, query };
  if (parts[0] === "c" && parts[1]) {
    if (parts.length === 2) return { name: "syllabus", course: parts[1], parts, query };
    if (parts[2] === "fin" && parts.length === 3) return { name: "finished", course: parts[1], parts, query };
    if (parts.length >= 4) return { name: "lesson", course: parts[1], module: parts[2], lesson: parts[3], step: parts[4] ? Number(parts[4]) : null, parts, query };
    return { name: "syllabus", course: parts[1], parts, query };
  }
  return { name: "unknown", parts, query };
}

export const go = (href, replace = false) => {
  if (replace) {
    history.replaceState(null, "", href);
    dispatchEvent(new HashChangeEvent("hashchange"));
  } else location.hash = href.replace(/^#/, "");
};
