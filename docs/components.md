# Components

Every screen is built from these pieces, and only these. They live in
`platform/web/core/ui.js` (markup and behaviour) and `platform/web/styles/components.css`
(look); tokens (colour, type, spacing, radius, motion) are in `platform/web/styles/tokens.css`.
Open **`#/_componentes`** to see each one in each state, in both themes. If a screen needs
something new, add it here and to the gallery first, so the three repos stay alike.

Rules that hold for all of them: hover, `:focus-visible` and active states; disabled looks
disabled and has `cursor: not-allowed`; touch targets of at least 40 px; icons from Lucide only
(`icon(name)` in `dom.js`, 24-unit outline, stroke 2, inlined); icon-only controls carry
`aria-label` and a tooltip; motion is short and stops under `prefers-reduced-motion`.

| Component | Call | States / notes |
|---|---|---|
| Button | `button({ label, kind, icon, iconEnd, href, small, block, tip, disabled, pressed })` | `kind`: `primary` (one per screen, orange), `secondary` (default), `ghost`, `icon` (label becomes `aria-label` + tooltip). Renders `<a>` with `href`, else `<button>`. `.btn-danger` for destructive actions. |
| Chip (what a lesson brings) | `chip(type, label, tip?)` | Fixed colour per type: `reading`, `figure`, `lab`, `case`, `check`, `card` (review cards), `code`, `judge`, `mission`, `challenge`, `app`, `done`. Lesson rows leave out `reading`: a lesson is a reading unless it says otherwise. |
| Progress bar | `bar(ratio, label, { ok, thin, tip })` | Orange in progress, green when done (`ok`), number always beside it. `role="progressbar"`. |
| Progress ring | `ring(ratio, { small, label })` | Course cover; green at 100 %. |
| Lesson state | `stateIcon(state)` | `done` (green tick), `half`, `none`, `lock`, `missed` (a Taller step sent to review). Same in syllabus, module contents, the Taller's step list and progress. Tooltip names the state. |
| Course card | `courseCard({ href, title, pct, ratio, next, metaL, metaR, done, soon })` | Same on Inicio and Mis cursos. Title and % on top, a "Completado" chip when done; a course not started has no % and no bar, only "Sin empezar". "Sigue:" points where Continuar does. `soon` is dashed and not a link. |
| Lesson row | `lessonRow({ href, state, number, title, chips, minutes, current, locked, optional })` | Current row tinted; locked rows are not links; chips hide on phones. |
| Key idea | `keyIdea(html)` or a ```` ```idea ```` block | One sentence, accent rule on the left. |
| Goals | `goals(list)` or ```` ```goals ```` | "Al terminar podrás", under the lesson title. |
| Recap | `recap(list)` or ```` ```recap ```` | "En resumen", after the reading; feeds the 3-minute recap. |
| Quick check | `quickCheck(host, { question, options, answer, explain, picked, onAnswer })` | Dashed green border, "opcional"; one answer: options lock, the pick turns red if wrong and the right one green, then it explains. In this repo `predict` blocks take the same look. |
| Figure | `figure({ title, hint, body })` | Title says what to look at; the control is inside. |
| Photo | `<!-- photo: id -->` (or `id left`) right before the paragraph it illustrates; several blocks end at `<!-- /photo -->`. Built by `platform/build/photos.mjs` from `content/img/photos.json` | A real photo floats in its text like a printed book (right by default, ~40 % of the column, max 22rem), caption (what, where, when) and credit under the image, click to enlarge (`web/core/photos.js`, a `<dialog>`; Esc closes). When its text is shorter than the photo, the photo narrows (never under 11rem) so no hole is left beside the text. Below a 640 px text column it goes full width under the first block of its text. Two WebP sizes, lazy-loaded; alt and caption in every language. |
| Rich-text editor (notes, written answers) | `richEditor(host, { value, onSave, label, labelIcon, placeholder, saved, compact, attachments })` → `{ flush, text, html, focus, destroy }`; `notesBox` is the same call | `core/rich.js` (ProseMirror). Bold, italic, one heading level, bulleted and numbered lists, quote, inline code, links, images. Toolbar with tooltips and shortcuts (⌘/Ctrl+B, I, E, K, Z, ⇧Z; Alt+F10 reaches it); Markdown while typing (`**`, `_`, `` ` ``, `- `, `1. `, `# `, `> `). Below 700 px the toolbar keeps the essentials and ⋯ shows the rest. Images by button, paste or drop: downscaled to 1600 px (WebP, else JPEG, 0.85), stored in the `attachment` table, × or Backspace removes, ⤢ views larger; limits (25 MB in, 60 MB in total) answer in the line under the box. Saves debounced, on blur and before the screen changes. `compact`: one line until focused. Stores schema-only HTML (no styles, scripts or outside images); `richHtml(value)` + `hydrateRich(root)` show it read-only in reading type, `richText` gives plain text. |
| Segmented control | `seg(name, options, value)` + `onSeg(root, name, fn)` | `aria-pressed` on the chosen option. Used for theme, language, period. |
| Bottom sheet | `sheet({ title, body })` → `{ close, el }` | From the bottom on phones, centred dialog from 700 px. Focus trapped, Esc closes, focus returns. |
| Toast | `toast(message, { icon, action, onAction, ms })` | Polite live region; sits above the phone tab bar. |
| Tooltip | `data-tip="…"` on any element | Shown on mouse hover and on keyboard focus, never on touch; linked with `aria-describedby`. |
| Empty state | `empty(icon, title, body)` | Only where a list can be empty; Inicio hides empty sections instead. Mi progreso shows one until there is something to count (a lesson done, an answer, a minute studied), on the web and in the app alike. |
| App-only notice | `appOnly(text)` | "Disponible en la app" + link to `#/app`, for what needs the desktop. |
| Banner | `<p class="banner">` | Sync notice ("Progreso sincronizado hace 1 min · desde el celular"). |
| KPI | `kpi({ k, v, d, ic, tip })` | Mi progreso; two per row up to 759 px, four from 760 px. |
| Week bars, calendar, module bar, mastery meter | `.week`, `.cal`, `.mbar`, `.meter` | Data marks; every cell has a tooltip with its value. |
| Stat tiles | `statRow(list)`, `stat({ k, v, sub, tone, tip })`, `setStat(el, v, sub)` (`core/chart.js`) | A lab's readout. One-line label, the value at one size (a number never breaks; its unit may drop to the next line), an optional sub-line. `splitValue()` cuts "5 (tabla + 4 índices)" or "al día: 80% en uso" into value and sub-line. Tiles in a row share a subgrid, so values line up. `tone`: `accent`, `good`, `warn`. |
| Slider row | `range({ label, min, max, step, value, fmt, sub, onInput })` (`core/chart.js`) | Label left, a short value right that never wraps, the track, then a sub-line for what the value means (`sub(v)`, or the part of `fmt(v)` after "→", "·" or "("). |

## Charts and diagrams

One look for every chart, figure and lab (`styles/charts.css`, `core/chart.js`):

- **Type** (what the reader sees, whatever the scale): ticks and axis titles 12 px, direct labels 13 px
  semibold, notes 12 px; on a phone 11 / 12 / 11. `keepLabelsClear(svg)` sets `--ch-k` so SVG text
  keeps that size as the drawing scales. Static figures use the `d-*` classes (titles 13, accent
  12.5, notes and numbers 11 viewBox units) in a 720-wide viewBox, and a 320-wide narrow drawing on
  phones (below).
- **Strokes**: data lines 2, arrows 1.5, axes, rules and reference lines 1, dashes `4 3`; one arrowhead
  shape (`marker()`) in muted or accent. Corners: boxes 10, cells and tags 4, bars 2 (`R`).
- **Colour**: series 1 accent (indigo), 2 teal, 3 ink-2, 4 amber (`--ch-1`…`--ch-4`); text is never the series
  colour except a direct label naming its line.
- **Labels**: a direct label sits at the end of its line or beside its mark, never on a line or another
  label. `keepLabelsClear()` moves every `.ch-lab` / `.curvelab` / `.marklab` / `.barval` by the
  smallest step that clears lines, marks and text, and gives it a halo of the surface; it reruns on
  redraw and resize. `placeLabels()`, `lineEndSpots()`, `arrow()` and `arrowLabelAt()` do the same for
  hand-placed figures; `numbers(lang)` writes numbers, money, percentages and compact amounts.
- **Static figures** (`platform/build/figkit.mjs`; in Atlas every `src/diagrams-*.mjs` and
  `src/figures.mjs`): `box(x, y, w, h, title, sub, cls)`, `note(x, y, text, max, cls, anchor)`,
  `chain(id, cards, { per, W })` (snake rows of boxes and arrows; `per: 1` is a column), `fig(id,
  label, H, inner, W)`, `marker(id)`, `wrapText()`. Styles in `styles/charts.css` (`.d-*`). A figure
  is `{ caption, svg, narrow }`; `narrow` (viewBox 320) replaces `svg` when the figure has under
  560 px, so text reads at ≥ 11 px on a 393 px phone and nothing scrolls sideways.
- **Checks**: Atlas's build fails when figure text leaves the picture, overflows its box, overlaps other
  text or touches a line or arrow, in either drawing, or reads under 11 px on a 393 px phone
  (`checkSvg()`, `phoneText()`). Loop's build runs `phoneText()` on its SQL scenes
  (`scripts/lib/figures.mjs`, docs/visuals.md).

| Inline Markdown (titles, captions, labels) | `md(text)` → HTML, `mdPlain(text)` → text (`core/inline.js`) | Text from content is inline Markdown: `` `code` ``, `**bold**`, `*italic*`, `[link](url)`. Every title (course, module, lesson, step, exercise, pane, caption, label) is stored as Markdown and shown with `md`; plain places (`aria-label`, tooltips, button labels and other strings with a title put in, the search index, toasts, the review queue) use `mdPlain`. Never `esc(title)` for a title. |
| Code colours | `highlightHtml(code, lang)`, `highlightLines(code, lang)` (`core/highlight.js`) | The one highlighter: the build colours fenced blocks with it and the browser colours panes written at run time. Classes `t-k` keyword, `t-s` string, `t-n` number or literal, `t-f` function, `t-c` comment (`styles/prose.css`), the same colours as the editor. A code pane the learner cannot type in sits on a darker well with a rule on the left (`.vis pre.code` in Loop), so it does not look like an input. |
| Lists | `.items` | Review queue, notes, missing gate items. |
| Text field | `textField({ name, label, value, type, placeholder, help, autocomplete, optional })` + `fieldMessage(root, name, message)` | Label above, help below; `fieldMessage` swaps the help for a gentle warning (accent border, `aria-invalid`) and back. Inputs at least 16 px so phones don't zoom. |
| Confetti | `confetti({ x, y, from, count, spread })` | A ~1.7 s burst on a fixed canvas in the theme's colours; `from` aims it at an element. Nothing under `prefers-reduced-motion`. A finished course (the "Terminaste" moment and the first view of its page) gets the full burst; a repo may fire a small one (Loop: a solved case or mission). |
| Welcome (first run) | `openWelcome({ start, demo, onDone })`, `maybeWelcome(route)` in `core/onboarding.js` | Three skippable steps in a sheet: language and theme, name and email (checked on blur), daily goal. Kept in the `profile` table, never sent anywhere. Shown once at start to a new learner; one with progress gets the profile prompt instead. A language change mid-way reloads and resumes the step. |
| Profile prompt, daily goal | `promptCard()` / `profilePrompt()`, `goalCard(goal)` (`screens/home.js`) | The prompt shows once on Inicio ("Completar perfil" / "Ahora no"). The goal card (today's minutes against the goal, days met of the last 7) sits on Inicio and Mi progreso; Ajustes › Tu perfil edits all three fields. |

Layout pieces in `shell.css` and `screens.css`: the top menu (web, from 700 px), the bottom tab
bar (phones), the icon rail (desktop app), the lesson bar with the reading-progress line, the
module contents (`.toc`, refreshed when a lesson is marked read), the section rail (`.lrail`), and
the two-pane workshop (`.ws`): its bar has one way to move, the step picker (a sheet with the steps
and their state, then the module) and the previous/next arrows; "Resuelto · Siguiente" sits under
the tool, below what you graded. A solution, reference answer or self-check answer shows only when
the learner asks for it (one button, which also hides it again), never on its own after typing, grading, a failed attempt, a reload or going back. Explanations after answering a quick check are feedback, not solutions. Search (`core/search.js`) is a sheet with the results by title,
section heading and a snippet cut at word boundaries.
Breakpoints: below 700 px (phone), 700–1099 px (medium window; app minimum 720 × 560),
1100 px and up (desktop; content max 1240 px; reading at about 70 characters).
