// #/_componentes: every component in every state, on one page. If a screen needs something new,
// it is added here first (and to docs/components.md).
import { esc } from "../dom.js";
import { t } from "../i18n.js";
import { button, chip, bar, ring, stateIcon, courseCard, lessonRow, keyIdea, goals, recap, figure, quickCheck, notesBox, seg, onSeg, sheet, toast, empty, appOnly, kpi, textField, fieldMessage, confetti } from "../ui.js";
import { openWelcome, promptCard } from "../onboarding.js";
import { setSection } from "../shell.js";
import { adapter } from "../adapter.js";
import { richEditor, richHtml, hydrateRich, memoryAttachments } from "../rich.js";

const SAMPLE = {
  course: { tag: "Curso", title: "Curso de ejemplo", next: "Módulo 3 · Lección", metaL: "Módulo 3 de 17" },
  doneCourse: { tag: "Curso", title: "Otro curso", meta: "Terminado el 12 oct" },
  soonCourse: { tag: "Curso", title: "Curso nuevo" },
  lessons: ["Primera lección", "Segunda lección", "Tercera lección", "Lección cerrada", "Lección opcional"],
  idea: "Una idea clave se dice en una sola línea.",
  goals: ["Explicar la idea con tus palabras.", "Distinguir un caso de otro."],
  recap: ["Primer punto del resumen.", "Segundo punto del resumen.", "Tercer punto del resumen."],
  quiz: { question: "¿Qué opción es la correcta?", options: ["La primera", "La segunda"], answer: 0, explain: "Se explica por qué al responder." },
  quiz2: { question: "¿Y esta otra pregunta?", options: ["Una", "Otra"], answer: 0, explain: "Otra explicación breve." },
  figure: { title: "Una figura interactiva", hint: "Mueve el control ←→", label: "Control" },
  sheet: "Módulo 3 · Título",
};
const sample = () => ({ ...SAMPLE, ...(adapter().gallery || {}) });

const block = (name, body, note = "") => `<section class="gal-b card card-pad"><h3>${esc(name)}</h3>${note ? `<p class="sub">${esc(note)}</p>` : ""}<div class="gal-x">${body}</div></section>`;

export function render(view) {
  setSection(null);
  const g = sample();
  const cal = Array.from({ length: 7 * 12 }, (_, i) => `<i data-l="${[0, 1, 0, 2, 3, 0, 4, 1, 2][i % 9]}" data-tip="Día ${i + 1}"></i>`).join("");
  view.innerHTML = `<div class="wrap page gallery">
    <header class="page-h"><p class="kick">${esc(t("gallery.kicker"))}</p><h1>${esc(t("gallery.title"))}</h1><p class="lead">${esc(t("gallery.lead"))}</p></header>
    <div class="gal">
    ${block("Botones", `<div class="btns">${button({ label: "Seguir leyendo", kind: "primary", iconEnd: "arrow-right" })}${button({ label: "Marcar como leída", icon: "check" })}${button({ label: "Ver temario", kind: "ghost" })}${button({ label: "Ajustes", kind: "icon", icon: "settings" })}</div>
      <div class="btns">${button({ label: "Pequeño", small: true, kind: "primary" })}${button({ label: "Pequeño", small: true })}${button({ label: "Desactivado", kind: "primary", disabled: true })}${button({ label: "Desactivado", disabled: true })}${button({ label: "Presionado", kind: "icon", icon: "sun", pressed: true })}${button({ label: "Borrar", icon: "trash-2", cls: "btn-danger", small: true })}</div>`, "Uno principal por pantalla. Hover, foco visible y activo en todos.")}
    ${block("Estado de una lección", `<div class="btns">${stateIcon("done")} <span>Terminada</span> ${stateIcon("half")} <span>A medias</span> ${stateIcon("none")} <span>Sin empezar</span> ${stateIcon("lock")} <span>Cerrada</span> ${stateIcon("missed")} <span>Fallada</span></div>`)}
    ${block("Qué trae la lección", `<div class="chips">${chip("reading", "Lectura")}${chip("figure", "Figura")}${chip("lab", "Lab")}${chip("case", "Caso")}${chip("check", "2 chequeos")}${chip("card", "52 tarjetas")}${chip("code", "6 ejercicios")}${chip("judge", "Juez")}${chip("mission", "Misión")}${chip("challenge", "Reto")}${chip("app", "Solo en la app")}${chip("done", "Completado")}</div>`)}
    ${block("Barra y anillo de avance", `${bar(0, "0% · 0 de 31")}${bar(0.62, "62% · 19 de 31")}${bar(1, "100%")}${bar(0.3, "", { thin: true })}<div class="btns">${ring(0.62)}${ring(1)}${ring(0.3, { small: true })}</div>`)}
    ${block("Tarjeta de curso", `<div class="courses">${courseCard({ href: "#/_componentes", tag: g.course.tag, tagType: g.course.tagType, title: g.course.title, pct: "18%", ratio: 0.18, next: g.course.next, metaL: g.course.metaL, metaR: "ayer" })}${courseCard({ href: "#/_componentes", tag: g.doneCourse.tag, title: g.doneCourse.title, pct: "100%", ratio: 1, done: true, metaL: g.doneCourse.meta, metaR: "" })}${courseCard({ title: g.soonCourse.title, tag: g.soonCourse.tag, soon: true, metaL: "Próximamente" })}</div>`)}
    ${block("Fila de lección", `<div class="card lrows">${lessonRow({ href: "#/_componentes", state: "done", number: "3.1", title: g.lessons[0], chips: chip("figure", "Figura"), minutes: 4 })}${lessonRow({ href: "#/_componentes", state: "half", number: "3.2", title: g.lessons[1], chips: chip("check", "1 chequeo"), minutes: 9, current: true })}${lessonRow({ href: "#/_componentes", state: "none", number: "3.3", title: g.lessons[2], chips: chip("code", "6 ejercicios"), minutes: 21 })}${lessonRow({ state: "none", number: "4.1", title: g.lessons[3], minutes: 5, locked: true })}${lessonRow({ href: "#/_componentes", state: "none", number: "3.7", title: g.lessons[4], chips: chip("challenge", "Reto"), minutes: 12, optional: true })}</div>`)}
    ${block("Idea clave, objetivos y resumen", `${keyIdea(g.idea)}${goals(g.goals)}${recap(g.recap)}`)}
    ${block("Chequeo rápido", `<div class="qc1"></div><div class="qc2"></div>`, "Opcional. Explica la respuesta al responder.")}
    ${block("Figura", figure({ title: g.figure.title, hint: g.figure.hint, body: `<input type="range" min="0" max="10" value="4" aria-label="${esc(g.figure.label)}" style="width:100%">` }))}
    ${block("Editor de respuestas y notas", `<div class="rx-demo"><div class="nb"></div><div class="nb2"></div><div><p class="rx-label">Guardada, junto a la solución</p><div class="nb3"></div></div></div>`, "Negrita, cursiva, título, listas, cita, código, enlaces e imágenes (botón, pegar o arrastrar). En celular la barra se reduce a lo esencial; ⋯ muestra el resto. Aquí nada se guarda.")}
    ${block("Control segmentado", seg("demo", [{ value: "week", label: "Semana" }, { value: "q", label: "Últimos 3 meses" }, { value: "all", label: "Todo" }], "q"))}
    ${block("Panel desde abajo, aviso y tooltip", `<div class="btns">${button({ label: "Abrir panel", icon: "list", cls: "g-sheet" })}${button({ label: "Mostrar aviso", icon: "bell", cls: "g-toast" })}<span class="chip" data-tip="Un tooltip explica lo que no es obvio" tabindex="0">Pasa el mouse o enfoca</span></div>`)}
    ${block("Estado vacío", empty("inbox", "Nada para repasar", "Lo que falles aparece aquí, con su enlace."))}
    ${block("Solo en la app", appOnly("Compilar C++ necesita la app. Tu código se guarda y lo encuentras al abrirla."))}
    ${block("Aviso de sincronización", `<p class="banner">Progreso sincronizado hace 1 min · desde el celular</p>`)}
    ${block("Campo de texto", `${textField({ name: "g-name", label: "Tu nombre", placeholder: "Cómo quieres que te llamemos", value: "Ana" })}${textField({ name: "g-mail", label: "Correo", type: "email", value: "ana@correo", optional: true, help: "No enviamos nada: solo lo guardamos aquí." })}`, "Etiqueta arriba, ayuda debajo; si algo no cuadra, la ayuda cambia por un aviso amable.")}
    ${block("Bienvenida y perfil", `<div class="btns">${button({ label: "Abrir la bienvenida", icon: "sparkles", cls: "g-welcome" })}</div>${promptCard()}
      <section class="card card-pad goal"><h3>Meta de hoy</h3>${bar(0.6, "12 de 20 min")}<p class="muted small">Te faltan 8 min · 3 de los últimos 7 días</p></section>`, "Primer inicio: tres pasos que se pueden saltar. Quien ya tenía progreso ve solo el aviso, una vez. La meta aparece en Inicio y Mi progreso. Aquí nada se guarda.")}
    ${block("Confeti", `<div class="btns">${button({ label: "Curso terminado", icon: "party-popper", cls: "g-confetti" })}${button({ label: "Misión resuelta", icon: "flag", small: true, cls: "g-confetti-s" })}</div>`, "Breve, sobre un canvas; no aparece con movimiento reducido.")}
    ${block("Números", `<div class="kpis">${kpi({ k: "Lecciones", v: "47", d: "+9 este mes", ic: "book-open-check", tip: "Pasos terminados" })}${kpi({ k: "Estudio", v: "23 h", d: "~1 h 45 por semana", ic: "clock" })}${kpi({ k: "Acierto", v: "84%", d: "en chequeos y casos", ic: "target" })}${kpi({ k: "Terminados", v: "1 <small>de 2</small>", ic: "flag" })}</div>`)}
    ${block("Semana, calendario, módulos y dominio", `<div class="week">${[40, 72, 4, 30, 60, 4, 12].map((h, i) => `<div><i class="${h < 5 ? "z" : ""}" style="height:${h}px"></i><span>${"LMMJVSD"[i]}</span></div>`).join("")}</div>
      <div class="cal" style="margin-top:16px">${cal}</div>
      <div class="mbar" style="margin-top:16px"><i class="done"></i><i class="done"></i><i class="half" style="--p:40%"></i><i></i><i></i></div>
      <div class="meter" style="margin-top:16px"><i class="on"></i><i class="on"></i><i class="on"></i><i></i></div>`)}
    </div>
  </div>`;
  quickCheck(view.querySelector(".qc1"), g.quiz);
  quickCheck(view.querySelector(".qc2"), { ...g.quiz2, picked: 1 });
  const mem = memoryAttachments();
  const pic = samplePicture(mem);
  const filled = `<h3>Mi respuesta</h3><p>La inflación sube cuando hay <strong>más dinero</strong> persiguiendo los <em>mismos bienes</em>. Ver <a href="https://example.com">la fuente</a> y <code>IPC</code>.</p><ul><li><p>Primer paso</p></li><li><p>Segundo paso</p></li></ul><blockquote><p>Una cita breve.</p></blockquote><img data-att="${pic}" width="640" height="360">`;
  notesBox(view.querySelector(".nb"), { value: "", onSave: () => {}, attachments: mem });
  richEditor(view.querySelector(".nb2"), { value: filled, onSave: () => {}, label: "Tu respuesta", labelIcon: "pencil-line", attachments: mem });
  view.querySelector(".nb3").innerHTML = richHtml(filled);
  hydrateRich(view.querySelector(".nb3"), mem);
  onSeg(view, "demo", () => {});
  fieldMessage(view, "g-mail", "Revisa el correo: debería verse como nombre@dominio.com.");
  view.querySelector(".g-welcome").addEventListener("click", () => openWelcome({ demo: true }));
  view.querySelector(".pprompt .pp-go").addEventListener("click", () => openWelcome({ demo: true, start: 1 }));
  view.querySelector(".g-confetti").addEventListener("click", () => confetti());
  view.querySelector(".g-confetti-s").addEventListener("click", (e) => confetti({ from: e.currentTarget, count: 50, spread: 0.6 }));
  view.querySelector(".g-sheet").addEventListener("click", () => sheet({ title: g.sheet, body: `<p class="muted">Un panel desde abajo en celular; un diálogo centrado desde 700 px. Esc lo cierra.</p>` }));
  view.querySelector(".g-toast").addEventListener("click", () => toast("Progreso guardado", { action: "Deshacer", onAction: () => {} }));
}

function samplePicture(mem) {
  const c = document.createElement("canvas");
  c.width = 640;
  c.height = 360;
  const g = c.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 640, 360);
  grad.addColorStop(0, "#818cf8");
  grad.addColorStop(1, "#2563eb");
  g.fillStyle = grad;
  g.fillRect(0, 0, 640, 360);
  g.fillStyle = "rgb(255 255 255 / .85)";
  g.font = "600 40px sans-serif";
  g.fillText("Imagen de ejemplo", 40, 190);
  const bin = atob(c.toDataURL("image/png").split(",")[1]);
  return mem.add({ mime: "image/png", width: 640, height: 360, data: Uint8Array.from(bin, (ch) => ch.charCodeAt(0)) });
}
