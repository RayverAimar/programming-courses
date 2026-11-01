// A walk-through written in Markdown: one step on screen at a time, with Anterior / Siguiente
// (wired by web/core/decorate.js). In a lesson:
//
//   ```steps
//   # Cómo se cruza una orden               optional title, shown above the steps
//   ## Ana pone una orden de compra         each "## " starts a step: its title
//   Texto del paso en Markdown: listas, tablas, `código`, **negritas**…
//   ## El libro de órdenes la empareja
//   …
//   ```
//
// Two to eight steps. Without JavaScript every step shows, one under the other. Photo markers do
// not go inside a step; a step is a short paragraph, a list, a table or a code block.
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Titles are inline Markdown: `code`, **bold**, *italic*.
const inline = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");

export function injectSteps(md, { labels }) {
  return md.replace(/^```steps[^\n]*\n([\s\S]*?)^```[ \t]*$/gm, (_m, body) => {
    let title = "";
    const steps = [];
    for (const line of body.replace(/\s+$/, "").split("\n")) {
      const h1 = line.match(/^# (.+)$/);
      const h2 = line.match(/^## (.+)$/);
      if (h1 && !steps.length) title = h1[1].trim();
      else if (h2) steps.push({ title: h2[1].trim(), lines: [] });
      else if (steps.length) steps[steps.length - 1].lines.push(line);
      else if (line.trim()) throw new Error(`steps: text before the first "## " step: ${line.slice(0, 60)}`);
    }
    if (steps.length < 2 || steps.length > 8) throw new Error(`steps "${title}": needs 2 to 8 steps, has ${steps.length}`);
    if (steps.some((s) => /<!--\s*photo/.test(s.lines.join("\n")))) throw new Error(`steps "${title}": a photo marker can't go inside a step`);
    const n = steps.length;
    const out = steps
      .map(
        (s, i) =>
          `<div class="step" data-i="${i}">\n<p class="step-k"><span class="step-n">${esc(labels.step.replace("{i}", i + 1).replace("{n}", n))}</span> ${inline(s.title)}</p>\n\n${s.lines.join("\n").trim()}\n\n</div>`
      )
      .join("\n\n");
    return `\n<div class="stepper" data-n="${n}">\n${title ? `<p class="stepper-t">${inline(title)}</p>\n` : ""}\n${out}\n\n<div class="stepper-nav" hidden><button type="button" class="btn btn-ghost btn-s stepper-prev">${esc(labels.prev)}</button><span class="stepper-dots">${steps.map(() => "<i></i>").join("")}</span><button type="button" class="btn btn-primary btn-s stepper-next">${esc(labels.next)}</button></div>\n</div>\n`;
  });
}
