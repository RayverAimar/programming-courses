# The course platform

One core, two products: a static website for GitHub Pages and a desktop app (Electron) for macOS,
Linux and Windows. Both run the same built site (`dist/`), both keep progress in the same SQLite
database.

This repo is the first to use it. The same core is meant to be copied into `personal-courses`
(Curso › Módulo › Lección) and `computer-science-course` (Bloque › Capítulo › Lab).

## What is core and what is per repo

```
platform/                         CORE: copy as is, never edit per repo
  web/core/                       the app: boot, router, database, progress model, shell, components
    boot.js                       createPlatform(adapter): strings, database, shell, routes
    db.js                         sql.js engine, schema, migrations, merge (import/sync)
    persist.js                    where the database bytes live: IndexedDB (web), a file (app)
    progress.js                   the course model joined with progress; the only writer of progress
    search.js                     the search panel ("/", Ctrl/⌘K) and searchIndex(), the finder over search.json
    ui.js                         the component library (docs/components.md)
    chart.js                      charts, diagrams and lab readouts: label placement, arrows, numbers, stat tiles
    inline.js                     md() / mdPlain(): inline Markdown for every text that comes from content
    highlight.js                  the one code highlighter (build and browser): token classes, lexers per language
    shell.js                      top menu / bottom tabs / desktop icon rail, theme, language
    caps.js                       capabilities: desktop(), canRunNative('cpp'), can.syncFile()…
    study.js                      study-time clock
    router.js                     hash routes
    screens/                      Inicio, Mis cursos, Temario, Lección, Taller, Mi progreso,
                                  Ajustes, Descargar la app, course finished, #/_componentes
  web/styles/                     tokens, base, components, charts, shell, prose, screens, photos (CSS)
  web/ui.json                     the core's strings, ES and EN
  web/template.html               the page shell (no content inside)
  build/site.mjs                  buildSite(): bundle, CSS, fonts, sql.js, HTML per language, data
  build/icons.mjs                 app icons for the three systems from build/icon.svg
  build/figkit.mjs                static figures: drawing kit (box, note, chain, fig, marker), text
                                  metrics, and the checks (fit, overlap, ≥ 11 px on a 393 px phone)
  electron/main.cjs, preload.cjs  the desktop app

PER REPO
  site.config.json                name, storage prefix, GitHub repo, brand icon, languages, artifact name
  build/icon.svg                  the app icon (1024 × 1024 artwork)
  src/main.js                     createPlatform(adapter)
  src/adapter.js                  how this repo's lessons and workshops render (see below)
  src/ui.json                     the repo's strings; they override the core's (module.n, lesson.ofModule…)
  src/course.css                  styles for what the adapter renders
  scripts/build.mjs               content → data JSON, then buildSite()
  electron-builder.config.cjs     installers (reads site.config.json)
  .github/workflows/              pages.yml (site), release.yml (installers on a tag)
```

Here the programming-specific parts stay in `src/`: the editor (`editor.js`, `editor/`), the
runners (`runner/`: JavaScript worker, Pyodide worker, the judge), the robot world (`world/`),
visuals and exercises. The core never imports them; the adapter does.

## How content plugs in

The repo build writes two kinds of JSON into `dist/data/<lang>/`:

**`site.json`**, loaded once: the course index.

```js
{
  lang, ui,                                  // all strings for this language (core + repo)
  site: { id, name, prefix, repo, mark, langs, defaultLang, version, downloads: [{ os, kind, file }],
          envCheck },                        // envCheck: false hides "Revisar mi entorno" in Ajustes
  courses: [{
    id, title, tagline, kicker, tagType, ready, gated, native,   // native: "cpp" → desktop-only course
    outcomes: ["…", "…", "…"],               // "Al terminar podrás", also ticked on the finish page
    facts: [{ key: "count.modules", n: 17 }], // header numbers; keys are plural strings in ui.json
    minutes, extras: [{ href, title, blurb, icon }],
    modules: [{
      id, slug, n, title, subtitle, minutes,     // subtitle: optional line under the title in the Temario
      file: "data/es/js/03-bucles.json",     // loaded when a lesson of the module opens
      gate: { items: [ids], labels: ["…"] }, // optional: passing these opens the next module
      counts: [{ key, n }],
      lessons: [{
        id, slug, n, title, minutes, optional,
        kind: "lesson" | "workshop",          // Lección screen or Taller screen
        type,                                 // free label for the workshop kind (practice, case, judge…)
        activities: [{ type, n }],            // chips: reading, figure, lab, case, check, code, judge, mission, challenge
        items: [{ id, type, graded, title, plainTitle }]   // what can be passed: exercises, checks, cases
      }]
    }]
  }]
}
```

**`search.json`** (optional), loaded on the first search: one row per page,
`{ h: link, t: title, w: where, k: "w" for a Taller, s: searchSections(html) }` (`build/site.mjs`
cuts the text at each heading, so a hit names its section and links to it).

**`<course>/<module>.json`**, loaded on demand, whatever the adapter needs. The core only reads
`lessons[slug]` and passes it to the adapter, plus three optional reading fields it renders itself:
`goals` (list), `recap` (list), `summary` (one sentence, used by the three-minute recap).

Ids are the progress keys. They must be identical in every language and must not change once
shipped (here: module = file name, lesson = slug of the Spanish `##` heading, item = exercise id).

### Titles are inline Markdown

Every title in `site.json` (course, module, lesson, item, `subtitle`) and in `search.json` is a
Markdown string, written as the author wrote it. The platform shows it with `md()` and strips it with
`mdPlain()` (`core/inline.js`, see docs/components.md): never `esc(title)` for a title. Item titles
also come with `plainTitle`. A repo that builds titles from headings keeps the Markdown (Atlas turns
`<code>` back into backticks in `headingMd()`).

### The adapter

```js
createPlatform({
  mountLesson(host, { lesson, data, payload }) → { cleanup }      // fill the reading
  mountWorkshop({ task, tool }, { lesson, item, index, items, data, payload })
    → { cleanup, source, compact }   // source: the lesson the step came from ("¿Quieres repasar?" links
                                     // there; default the reading before); compact: the tool is small
                                     // (a text box), so the task gets the wider pane
  search: searchIndex()        // turns on search (button in the bars, "/", Ctrl/⌘K)
  onEnterCourse(course)        // e.g. warm up Python
  onTheme()                    // repaint canvases
  redirect(hash) → hash|null   // old links
  importLegacy(P, store)       // one-time import of pre-database progress
  screens: { name: { render(view, route) } }   // extra routes, registered with addRoute()
});
```

Where to continue is one rule (`courseResume` in `progress.js`): the lesson of the course touched
last, or, once done, the first one after it still to do; a Taller opens at the step you left or, if
that one is settled, the first one that isn't. Inicio, the course cards, the Temario and Mi progreso
all use it. A route that matches nothing shows "No encontramos esta página" with a way back.

Reading text follows Ajustes › Tamaño de la letra (`--fs-k` in `tokens.css`, applied before the
first paint): the prose, goals, recap, quick checks, and anything inside a reading that uses
`--ui` / `--ui-s`.

The adapter reports results through `progress.js`: `recordAttempt(id, ok, { detail })` for every
graded try (it updates the item, the attempt log and the review queue), `saveCode`, `markRead`,
`saveCheckAnswer`. Lesson and module states, gating, course completion, KPIs and mastery all
follow from those.

Elements the adapter marks with `id` and `data-anchor="Label"` become entries of the section rail
("En esta lección") on wide screens. A quick check for a course without code is
`ui.quickCheck(host, { question, options, answer, explain, onAnswer })`.

### In this repo: sessions, steps, and adding a theory lesson

A session (`content/<track>/NN-slug.md`) is a module. Each `##` section is a step (lesson):

- a section with an exercise to write (`complete`, `fix`, `write`, `case`, `judge`, `mission`,
  `challenge`) opens in the **Taller**, one step per exercise;
- every other section is a reading and opens in the **Lección** (its `predict` blocks show as
  optional quick checks, `js run` / `py run` blocks as runnable examples, visual blocks as figures).

So a session can have any number of theory lessons before its practice: **to add one, add a `##`
section where it belongs** (e.g. between `## El encargo` and `## Lo mínimo`) in the Spanish file
and the same section, translated, at the same position in the English file. Its id is the slug of
the Spanish heading (`## Por qué existe JavaScript` → `por-que-existe-javascript`), so existing
progress is untouched. Figures (```` ```figura ````, ```` ```anima ````, ```` ```escena ````,
```` ```tablero ````) and optional checks (`predict` exercise blocks) work inside it as anywhere
else. Three optional reading blocks render as platform components:

````md
```goals
- Explicar por qué se creó JavaScript
- Comparar JavaScript con Python y C
```

```idea
JavaScript nació para que una página reaccione sin ir al servidor.
```

```recap
- Lo creó Brendan Eich en 1995, en diez días.
- Hoy corre en el navegador, en servidores y en apps.
```
````

`goals` shows under the title, `idea` as a key-idea line in place, `recap` after the text (and in
the three-minute recap after a week away). The English file must have the same number of `##`
sections; the build stops if it doesn't. Run `node scripts/verify.mjs` after any content change.

## The database

SQLite through sql.js (WebAssembly), the same code on the web and in the app; no native modules.
The database lives in memory; after each change a debounced save (400 ms, flushed when the page
hides or the app quits) writes its bytes: to IndexedDB on the web (`<prefix>-progress`), to
`<userData>/<prefix>-progress.sqlite` in the app (atomic: temp file + rename), or to a shared
file the learner picks (Ajustes › Usar un archivo compartido), which the app polls every 2 s and
merges when another device changed it.

Schema version 3 (`PRAGMA user_version`; `MIGRATIONS` in `db.js`; never edit a shipped
migration, append the next one):

| table | key | what |
|---|---|---|
| `meta` | key | device id and label, last write, last sync, legacy import done |
| `lesson_state` | lesson_id | started/done, reading position (block, ratio, heading or workshop step), opened/done/updated |
| `item_state` | item_id | passed, attempts, fails, right first time, passed_at |
| `attempt` | uid | every graded try: item, course, lesson, kind, lang, ok, detail, time, device |
| `saved_code` | item_id, lang | code in progress, per language; `text` is a written answer (rich-text HTML) |
| `check_answer` | check_id | the answer picked in a quick check |
| `note` | lesson_id | the learner's notes (rich-text HTML, `core/rich.js`) |
| `attachment` | id | images in notes and written answers: mime, size, bytes; the HTML points at them by id |
| `study_day` | day, device | seconds studied per day and device |
| `review_item` | item_id | "Para repasar": what was missed, why, deep link, resolved_at |
| `course_done` | course_id | when a course was finished |
| `unlock` | module_id | modules opened without passing the gate (test mode) |
| `pref` | key | small preferences (e.g. Mi progreso's period) |
| `profile` | key | the learner's `name`, `email`, daily `goal` (minutes) and `welcome` (`done`, `skipped`, `prompted`): from the first-run welcome and Ajustes › Tu perfil |

Import and the sync file **merge** (`merge()` in `db.js`): done stays done, attempts are a union,
counters take the maximum, text (notes, code, positions, profile fields) keeps the newest, images are a union.
Migration 2 turned plain-text notes and `text` answers into paragraphs; images nothing mentions any
more are dropped a day later, at start (`pruneAttachments`). Export is the database
file itself (`.sqlite`), so the same file opens on the web and in the app. Migration 3 added `profile`; resetting progress keeps it. Progress from before
the database (`localStorage`) is imported once by the adapter's `importLegacy`.

## Build, run, release

```bash
pnpm install
node scripts/serve.mjs        # http://localhost:4400, rebuilds and reloads on save (DEBUG_BUILD=1 for an unminified bundle)
node scripts/build.mjs        # dist/: the website (Pages) and what the app loads
node scripts/verify.mjs       # every exercise, both languages
pnpm app                      # build and open the desktop app from this folder
pnpm smoke                    # Playwright drives the app: lesson, exercise, quit, relaunch, progress kept
node scripts/smoke-app.mjs "release/mac-arm64/Loop.app"   # same, on a packaged app
pnpm dist:mac | dist:win | dist:linux   # installers into release/
```

`build.mjs` vendors Pyodide (the version of the `pyodide` dev dependency) from the npm registry,
checked against the integrity hash in `pnpm-lock.yaml` and cached in `.cache/`; fonts (Bricolage
Grotesque, Newsreader: SIL OFL, licences copied next to them), Lucide icons (ISC, only the ones the
code names), CodeMirror, ProseMirror (the notes and answers editor) and sql.js are bundled from `node_modules`. Nothing loads from a CDN.

**Website:** `.github/workflows/pages.yml` builds and deploys `dist/` on every push to `master`.

**App:** push a tag `vX.Y.Z` (after bumping `version` in `package.json`) and
`.github/workflows/release.yml` builds on macOS, Linux and Windows and attaches to the release:
`<artifact>-mac-arm64.dmg`, `-mac-x64.dmg` (+ `.zip`), `-win-x64-setup.exe`,
`-win-x64-portable.exe`, `-linux-x86_64.AppImage`, `-linux-amd64.deb`. The site's `#/app` page
links to `releases/latest/download/<file>`, so names must not change (`artifact` in
`site.config.json`). The app is not signed: on macOS, right-click › Open the first time (or
`xattr -dr com.apple.quarantine "/Applications/Loop.app"`); on Windows, SmartScreen › More info ›
Run anyway.

Desktop security: `contextIsolation`, `sandbox`, no `nodeIntegration`, a preload that exposes only
named calls (database read/write/location/sync file, export/import dialogs, environment check,
app version, open external links, theme, language), the site served from `dist/` under `app://site/`
(never `file://`), the same Content Security Policy as the web, single instance, window size
remembered, standard menu with Cmd/Ctrl+1–3 and Cmd+, shortcuts.

## Porting to another repo (checklist)

1. Copy `platform/` as is, plus `electron-builder.config.cjs`, `.github/workflows/`,
   `scripts/serve.mjs` and `scripts/smoke-app.mjs`; add the dev dependencies from this
   `package.json` (`sql.js`, `electron`, `electron-builder`, `lucide-static`, the two
   `@fontsource-variable` fonts, `playwright`, `@resvg/resvg-js`, `esbuild`, the `prosemirror-*` packages) and the
   `main`/`scripts` entries; allow `electron`'s install script in `pnpm-workspace.yaml`.
2. Write `site.config.json` and `build/icon.svg`.
3. Write the build: read your content, emit `site.json` and one file per module in the shape
   above, call `buildSite({ root, config, ui: strings(repoUi), entry, css, data, scan })`.
4. Write the adapter (`mountLesson`, `mountWorkshop`); reading courses render HTML and use
   `ui.quickCheck` and `ui.figure`; labs and cases go in the Taller (task left, board right).
5. Override the names in your `ui.json`: `module.n` ("Módulo {n}"), `lesson.ofModule`,
   `count.*`, `course.kicker`, `lock.*` only if you gate.
6. Set `gated: false` on courses without exams; the lock screens then never appear.
7. Open `#/_componentes` and the five screens at 393, 760, 1024 and 2000 px, light and dark, ES and EN.
