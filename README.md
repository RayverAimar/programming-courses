# Loop · programming courses

Programming courses set in Loop, a robot workshop in Barranco, Lima. Every session a customer brings a
job, and the learner's robot, Chasqui, can only do it if the learner writes its program. Little
theory, many small exercises that run in the page, a case to crack with code, a judge problem in
competitive-programming style, and a final mission on a pixel-art map. The judge and the mission
together unlock the next session.

Two tracks, each in Spanish and English:

- **JavaScript**: 17 sessions. The robot is Chasqui, in Barranco.
- **Python**: 20 sessions, from values to asyncio, the data model and performance. The robot is
  Quilla, at Loop's branch in Chucuito, Callao. Python runs in the page with
  [Pyodide](https://pyodide.org) (CPython compiled to WebAssembly), served from the site itself,
  so both tracks work offline in the app.

SQL, C++ and Rust are listed as coming.

## Run it

```bash
pnpm install
node scripts/serve.mjs     # http://localhost:4400 — rebuilds and reloads on every save
node scripts/build.mjs     # dist/: the website (GitHub Pages) and what the desktop app loads
node scripts/verify.mjs    # runs every exercise in both languages
pnpm app                   # the desktop app from this folder
pnpm smoke                 # drives the app: lesson, exercise, quit, relaunch, progress kept
pnpm dist:mac              # installers in release/ (also dist:win, dist:linux)
```

The site and the app share one platform (`platform/`, see [docs/platform.md](docs/platform.md)):
five screens (Inicio, Temario, Lección, Taller, Mi progreso), progress in a SQLite database
(IndexedDB on the web, a file in the app, export/import between them), and everything served
locally: fonts, icons, the editor and Pyodide (vendored at build time, checked against the
lockfile's hash). `dist/` loads a small shell and then one JSON file per session on demand.

`verify.mjs` checks, with the same harness the page uses, that every solution passes its tests,
every starter fails them, every "predict" answer is what Node really prints, every case solution
prints its answer, every runnable example runs, and every judge is sound (deterministic cases,
reference accepted, starter and plausible wrong solutions rejected, same data in both languages),
no case starter already prints its answer, and code uses the page's language; it warns about a
case or judge without a visual. Run it after editing content. For Python it runs the same runner
the page uses (Pyodide from npm, in a worker thread) and compares "predict" answers and runnable
examples against the local CPython (`python3`). Pass a filter to check less: `node
scripts/verify.mjs py` or `node scripts/verify.mjs py/07`.

## Layout

```
content/js/NN-slug.md          a session, in Spanish (the original)
content/js/_modern.yml         modern-vs-legacy notes and MDN links, one entry per feature
content/i18n/en/js/NN-slug.md  its English translation, same file name and exercise ids
content/py/, content/i18n/en/py/  the same for the Python track
src/runner/py/taller.py        the Python runner: robot, judge, virtual-time asyncio, tracing
src/runner/pybridge.js         boots Pyodide and the runner, shared by the page and the scripts
src/runner/pyworker.js         the Python sandbox in the page (a Web Worker with Pyodide)
src/runner/pyclient.js         queue and watchdog for the Python worker (4 s, 3 s per judge case)
src/world/engine.js            the grid, the robot and its commands (no DOM)
src/world/render.js            pixel-art sprites, canvas drawing and step-by-step playback
src/runner/harness.js          runs a program against an exercise's tests
src/runner/judge.js            the judge: stdout and function modes, seeded cases, verdicts
src/runner/worker.js           the sandbox: a Web Worker, killed after 2 s (1 s per judge case)
src/editor.js                  CodeMirror 6, bundled by esbuild
src/editor/complete.js         autocomplete and signature help, from src/api/*.json
src/api/                       the API data: robot members, readers, server, JavaScript docs
src/world/server.js            the simulated server on a virtual clock (async sessions)
src/visuals.js                 scenes, case boards, figures and traced concept animations
src/exercise.js                the exercise component (inline in a lesson, split in the Taller)
src/adapter.js                 how sessions render on the platform: lessons, workshop, legacy import
src/course.css                 styles for exercises, the judge, the robot and the visuals
platform/                      the shared core: screens, components, database, build, desktop app
site.config.json               the site's name, storage prefix, GitHub repo, installer names
build/icon.svg                 the app icon (all sizes are generated from it)
scripts/                       build, dev server, verification, Pyodide vendoring, app smoke test
```

## Docs

- [docs/platform.md](docs/platform.md): the platform: what is core, how content plugs in, the database, build and release.
- [docs/components.md](docs/components.md): the component library (live at `#/_componentes`).
- [docs/content.md](docs/content.md): how a session is written, the modern-JS boxes, translations.
- [docs/python.md](docs/python.md): the Python track: runner, judge, story and the 20-session plan.
- [docs/exercises.md](docs/exercises.md): the exercise blocks, tests, worlds and scenarios.
- [docs/robot-api.md](docs/robot-api.md): the robot, the simulated server, helpers, session config and autocomplete.
- [docs/visuals.md](docs/visuals.md): scenes, case boards, figures and concept animations; the "understood at a glance" rule.

## Progress

Progress lives in a SQLite database (schema in [docs/platform.md](docs/platform.md)): steps read,
exercises passed and every attempt, code in progress per language, notes, study time, the review
queue and finished courses. Progress kept in `localStorage` by earlier versions is imported once.
A session opens when the previous session's final mission and its judges pass; a locked session
can still be looked at, and offers a "skip the lock (test mode)" button.
