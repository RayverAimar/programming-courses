# Writing a session

A track is a language: `content/<track>/` holds its sessions as `NN-slug.md`, read in file-name
order. The Spanish file is the original; the English one lives at
`content/i18n/en/<track>/NN-slug.md` with the same name. A missing translation falls back to
Spanish and the build says so. Tracks are listed in `TRACKS` in `scripts/build.mjs`; a track with
`ready: false` shows as "coming".

## Shape of a session

```md
# Sesión 2 — Condicionales            (English: # Session 2 — Conditionals)

## El encargo        3–5 lines: who the customer is, what's at stake, why this concept is needed
## Lo mínimo         one concept, a ```js run example, one "Trampa común", the modern-JS boxes
## Práctica          5–7 exercise blocks: predict, complete, fix, write, mixed and escalating
## El caso           one case block: an open problem with invented data and a single answer
## El juez          1–2 judge blocks: a problem that needs the session's concept (see exercises.md)
## Misión final      exactly one mission block: the robot does the job; with the judges, opens the next session
## Reto experto      one challenge block, optional, for people who already code
```

English headings: The job, The minimum, Practice, The case, The judge, Final mission, Expert
challenge. Session 1's judge section explains the input readers once; later sessions only refer
back to them.
Every `##` heading becomes an entry in the session outline. The build requires the `# Sesión N — `
title and exactly one mission.

### Session 1: why the language exists

Session 1 of every track, current and new (SQL, C++, Rust…), has one more theory lesson between
"El encargo" and "Lo mínimo": `## Por qué existe <lenguaje>` / `## Why <language> exists`, about
10–12 minutes, with `goals`, `idea` and `recap`. It covers:

1. **Origin**: who created the language, when, where, and the problem they had at that moment.
2. **Why a new language**: what existed before and why it wasn't enough.
3. **Strengths and weaknesses** next to 2–3 other languages, honest and concrete: a comparison
   table and the same tiny task written in each (a `figure` with `text` panes). Connect the
   language's quirks to the "En código viejo verás…" boxes, and say why Loop's robot uses it.
4. **Where it's used today and why** it fits there.

Visual and checkable: a timeline (`timeline` pane: `when`, `title`, `text` per milestone; a row when ≤ 6, vertical otherwise), the comparison table, a
"where it lives" figure and one or two optional `predict` checks. Facts come from primary or
reputable sources (the creators' own accounts, official docs and standards, MDN, python.org); every
popularity claim names its survey and year (Stack Overflow, GitHub Octoverse), never a timeless
"the most popular". No invented quotes. The lesson ends with a short **Fuentes** / **Sources**
list. When a new survey comes out, update the figures in both languages.

Each session has its own scenario and map theme (`barranco`, `museo`, `mina`, `cocina`), and the
robot gains a part each session (`level` 1–4 in the world config: cargo box, siren, headlamp,
serving arm).

Each session opens with a pixel-art scene of its encargo, and each "Lo mínimo" has at least one
concept animation; see [visuals.md](visuals.md).

### Steps

A session is a module of the platform and every `##` section is one step of it (see
[platform.md](platform.md)). A section with an exercise to write (complete, fix, write, case,
judge, mission, challenge) opens in the Taller, one step per exercise, with the task on the left
and the editor, console and robot on the right; every other section is a reading in the Lección,
where `predict` blocks are optional quick checks. Step ids come from the Spanish headings, so the
English file keeps the same sections in the same order. To add a theory lesson, add a `##`
section where it belongs (for example between "El encargo" and "Lo mínimo"); it may carry
```` ```goals ````, ```` ```idea ```` and ```` ```recap ```` blocks. Keep text between exercises
short and put what an exercise needs inside its statement: in the Taller each exercise shows
with only the text right before it.

### Small pieces

- ```` ```js run ```` makes a small live editor with a Run button and its console. Keep it to about
  five lines. `verify.mjs` checks it runs and prints the same as Node.
- A blockquote that starts with `**Trampa común:**` / `**Common trap:**` gets the trap style.
- Other ```` ```js ```` blocks are highlighted at build time.

## Modern JavaScript, and what older code looks like

Each track teaches its language's current idioms. For JavaScript that means `const`/`let`, `===`,
template literals, `??` and `?.`, `for...of`, arrow functions, default parameters, destructuring,
spread and ES modules. Every example and solution uses them, and nothing deprecated.

Learners will still read older code, so `content/js/_modern.yml` keeps one entry per feature:
its MDN path, the session that teaches it, and per language a name, the legacy form (`old`), what
we write today (`new`) and a short note. It is the one place to update when the language moves;
it names no version numbers, MDN carries the details.

In a session:

```md
<!-- legacy: nullish -->                      the box "En código viejo verás…" for that feature
<!-- mdn: if-else strict-equality truthy -->  a row of MDN links
```

The same entries make the track's "Moderno y antiguo" page (`#/js/modern`). MDN links go to
`/es/docs/…` on the Spanish page and `/en-US/docs/…` on the English one.

## Writing the stories

Peruvian places and names, small stakes, light humour, no clichés. Keep the theory short: if
something can be learned by predicting or fixing code, make it an exercise instead of a paragraph.

## One language per page

Code on an English page is English: identifiers, strings, comments, console output, helper and
judge function names. A Spanish page is Spanish throughout. People's and dishes' names are data:
fine in strings and as object keys, but an English identifier is English (`alfajorPrice`, not
`alfajores`). Judge inputs and outputs are identical in both languages, so keep them
language-neutral (numbers, names). `verify.mjs` flags identifiers in the wrong language, from a
word list split on camelCase (`scripts/lib/lang-check.mjs`; extend its lists when it misses one).

## Translating

Keep the same exercise ids, the same number of options, hints, tests and scenarios, the same maps
and the same markers. Translate identifiers to natural English and use the English robot commands
(see [exercises.md](exercises.md)); recompute "predict" answers, because translated strings print
differently. Ids must match across languages or the build fails, since progress is stored by id.

Interface strings are in `src/ui.json` (`es` and `en`).
