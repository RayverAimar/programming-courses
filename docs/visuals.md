# Visuals

**Rule: everything is understood at a glance.** Every case, judge problem and mission has a
picture that makes it clear what goes in and what must come out: a scene, a board, a figure or an
animation. A practice exercise whose setup takes more than one line gets one too. A beginner
should know what to do within 10 seconds without reading the code. `verify.mjs` warns about a
case or judge without a visual (a mission has its map).

Each statement says what to produce in one plain sentence first ("Calcula el vuelto correcto de
cada pedido y compáralo con lo que reportó cada robot."), then the story.

There are six components. Use them as a fenced block in the prose, or attach one to an exercise
with its `visual:` key (shown between the statement and the editor). YAML text is in the page's
language; numbers stay the same in both languages.

| fence (ES / EN) | `visual:` key | what it is |
|---|---|---|
| ```` ```escena ```` / ```` ```scene ```` | `scene` | a pixel-art scene drawn with the world's sprites, optionally animated |
| ```` ```tablero ```` / ```` ```board ```` | `board` | a detective board: portraits and evidence cards that react to the learner's output |
| ```` ```anima ```` / ```` ```anim ```` | `anim` | a concept animation that steps through real code |
| ```` ```figura ```` / ```` ```figure ```` | `figure` | input → output, receipts, cells, grids, tables, small cards |
| ```` ```red ```` / ```` ```network ```` | `network` | a chain of nodes (computers, programs, records) and what travels between them, step by step |
| ```` ```alcance ```` / ```` ```scope ```` | `scope` | rooms inside rooms (scopes and calls) and the functions that remember the room they were born in |

Every component takes an optional `title` and `caption` (inline Markdown: `` `code` ``, `**bold**`, `*italic*`, links).
Code shown in a pane (`query:`, `code:`, `sql:`) is coloured by the same highlighter as the editor
(`platform/web/core/highlight.js`), in light and dark, and sits on a darker well with a rule on the left: it
reads as a listing, not as a box to type in.

## Scene

The opening picture of a session (its encargo) and any map worth showing. It takes a world
config (see [exercises.md](exercises.md#worlds)) and, optionally, a `program` that the robot runs
when the scene scrolls into view (in the page's language; the play button replays it).

```escena
theme: barranco
level: 1
dir: E
caption: La panadería de doña Rosa, en Barranco, y su buzón al final de la calle.
map: |
  ########
  #R....D#
  ########
program: |
  robot.avanzar(5);
  robot.entregar("Pedido 1");
```

## Board

For a case: who did what, laid out as pinned cards. `kind` is `robot` or `person`; portraits are
drawn from the name, so the same name always gets the same face; `kind: note` is a pinned sheet (a price list, a log) with no face. `with` shows the pairing
explicitly (robot → customer). `for` names the case exercise: when the learner runs code, every
card with a `clue` looks for the first output line containing `clue.find`, takes the last number
on it and compares it with `clue.says` (what that suspect claimed; `clue.saysLabel` names it,
"Reportó" / "Reported" by default): **Cuadra / Matches** in green
or **No cuadra / Doesn't match** in red. When the case is solved, the card marked `culprit` gets
a stamp.

```yaml
visual:
  board:
    for: js1-caso-vuelto
    task: Calcula el vuelto correcto de cada pedido y compáralo con lo que reportó cada robot.
    cards:
      - name: Chasqui
        kind: robot
        with: { name: Rosa, kind: person }
        rows: [["Pedido", "2 cajas de alfajores"], ["Pagó", "S/ 50"], ["Reportó de vuelto", "S/ 13"]]
        clue: { find: "Chasqui", says: 13 }
      - name: Pituco
        kind: robot
        culprit: true
        …
```

Ask the learner to print one line per suspect that starts with the suspect's name
(`console.log("Chasqui:", vuelto)`), so the clues can find it.

## Figure

An input → output picture, or a set of panes. A pane is one of:

| pane | shows |
|---|---|
| `receipt: { title, rows: [[…]], total, totalLabel }` | a till receipt; the last column is right-aligned |
| `cells: [...]`, `highlight: [i]`, `index: false` | a list as numbered cells |
| `grid: ["#..", "..#"]`, `marks: ["x,y"]`, `path: ["x,y"]` | a map |
| `table: { head: [...], rows: [[...]], by: [...] }` | a table; `by` lists, per row, an exercise id (or `null`): until it is passed that row shows "?" in every cell |
| `cards: [{ title, rows: [[k, v]] }]` | small cards (objects) |
| `text: "…"` | raw text, such as a judge's input |
| `value: "…"` | one big result |
| `form: { title, fields: [[label, value]], message, button }` | a web form; an empty value is an empty box, outlined as an error when there is a `message` |
| `timeline: [{ when, title, text, now, by }]` | milestones; a row when 6 or fewer, vertical otherwise; `now` fills the dot; with `by: <exercise id>` the milestone shows as a locked "?" until that exercise is passed (a case timeline that fills in as the learner advances) |
| `lanes: { from, to, tick, rows, bands }` | parallel lanes: see below |

Each pane may have a `label`. An input → output figure:

```yaml
visual:
  figure:
    title: El ejemplo 1, dibujado
    input: { label: Entrada, text: "3\n2 18.5\n1 12" }
    arrow: suma cantidad × precio
    output: { label: Salida, receipt: { title: PANADERÍA ROSA, rows: [["2 × alfajores", "37.00"], ["1 × picarones", "12.00"]], total: "49.00" } }
    steps:
      - La primera línea dice cuántos productos vienen.
      - Cada línea siguiente es cantidad y precio.
```

### Parallel lanes

When events overlap in time (two people at once, a device silent while a door is open), a timeline
hides the overlap. `lanes` draws one row per person or device and the time on the x axis:

```yaml
visual:
  figure:
    title: Quién estaba dónde
    lanes:
      from: "22:30"          # axis start; "HH:MM" or "HH:MM:SS"; a time before it counts as the next day
      to: "23:30"
      tick: 15               # minutes between labels; by default about six labels
      bands:                 # shaded window across every row
        - { from: "22:41", to: "23:30", label: "la denuncia" }
      rows:
        - label: Renzo
          sub: dice
          bars:
            - { from: "22:46", to: "23:10", label: "dice que se fue", kind: said }
          events:
            - { at: "22:52", label: llama a Tito, kind: bad }
```

| key | does |
|---|---|
| `rows: [{ label, sub, bars, events }]` | one lane each; `sub` is a small second line under the label |
| `bars: [{ from, to, label, kind, by }]` | a stretch of time. `kind`: `fact` (default), `said` (dashed: what someone claims), `gap` (hatched red: silence or missing data), `ok` (green), `soft` (grey) |
| `events: [{ at, label, kind, by }]` | a moment (a diamond); `kind`: `fact`, `bad`, `ok`, `said`; `side: left` puts the label on the left (by default it flips by itself on the right third) |
| `bands: [{ from, to, label, by }]` | a shaded window over all the rows |

Labels stay short. From 560 px of figure width the lanes are drawn with time on the x axis (29 rem
minimum, the row labels at the left). Under 560 px, a phone, each row becomes its own block: the
person's name, a compact track with its own ticks (the same bars, diamonds and shaded bands, drawn
without text) and, under the track, the row's items in time order, each with the swatch of its kind
(`fact`, `said`, `gap`, `ok`, `soft`, `bad`) and its time range. A band's label is listed once above
the rows. Nothing scrolls sideways, and every item still needs a `label`, because the phone layout
shows nothing else of it (the build fails otherwise).
Bars, events and bands with `by: <exercise id>` appear once that exercise is passed. Lessons using it:
SQL 9 and 10 (the sensor room), SQL 15 to 18 (Friday 20).

Judge problems illustrate their first sample this way: the input as the learner reads it, and
what it means (a receipt, a list of cells, a map), next to the output.

Without `input`/`output`, give `panes: [ … ]` to show several side by side.

## Network

How something gets from one place to another: a request crossing the 1995 internet, a program
following pointers through records, a system call reaching the disk. The nodes are a vertical chain
with a link between each pair; with steps, a packet travels along it while the text and the panes
beside the chain change. Next to the chain on a wide screen, under it on a phone.

```red
title: Un formulario en 1995
clockLabel: Desde el clic
clockMax: 12
nodes:
  - { id: pc, icon: computer, label: Tu computadora, sub: el navegador }
  - { id: server, icon: server, label: Servidor web }
links:
  - { id: phone, kind: phone, label: línea telefónica, busy: ocupada }
steps:
  - phase: "1995: sin JavaScript"
    move: [pc, server]
    packet: { kind: up, label: "pedido HTTP, ~0.5 KB" }
    busy: [phone]
    clock: 0.6
    note: El pedido viaja al servidor.
    show: { label: El pedido, text: "POST /cgi-bin/pedido.cgi" }
```

| key | does |
|---|---|
| `nodes: [{ id, icon, label, sub }]` | the chain, top to bottom. `icon`: `computer`, `modem`, `isp`, `internet`, `server`, `program`, `file`, `record`, `os`, `disk`, `engine`, `table`, `person`, `box` |
| `links: [{ id, label, kind, busy }]` | one per pair of neighbours, in order; `kind: phone` draws a phone line; `busy` is the badge a busy link shows |
| `clockLabel`, `clockMax` | a stopwatch in the corner when any step has a `clock`; its hand makes a full turn at `clockMax` seconds |
| `speed: 3200` | ms per step while playing |
| `note`, `show` | without `steps`: a static diagram with this text and these panes |

Each step:

| key | does |
|---|---|
| `note` | the step's caption, in plain words (required) |
| `phase` | a chip such as "1995: sin JavaScript" / "Con JavaScript"; it stays until another step changes it |
| `at: id` or `move: [from, to]` | the node in focus, or a packet travelling from one node to another (animated going forward, `dur` ms) |
| `packet: { kind, label }` | what travels: `up` (a request, accent), `down` (an answer, blue), `local` (green); the label reads "Viaja …". No packet: "Nada viaja" |
| `clock` | seconds on the stopwatch (kept until changed); `clockText` overrides the text |
| `busy: [ids]` | busy nodes (their lights blink) and links (a moving red dash and the `busy` badge) |
| `dim: [ids]`, `dimLinks: [ids]` | fade out what doesn't take part |
| `tags: { id: text }` | a short label under a node, such as "correo vacío → error" |
| `show` | a pane or a list of panes (any figure pane, `form` included) next to the note |

It is a vertical chain on purpose: the reading column is about 680 px wide even on a big screen, and
a chain of five nodes with labels doesn't fit across it legibly. Keep labels to a few words and put
the explanation in `note`. Lessons using it: JavaScript 1 (a form in 1995 and a Java applet),
Python 1 (a system call), SQL 1 (navigating records before SQL).

## Scope

Where a name lives. Each room is a scope (the global one, a block, one call of a function); rooms
nest, a room may hold names and functions, and a function with `env: <room id>` draws a rope to the
room where it was born. A room marked `gone` (its call returned) is dashed: "finished, still alive"
if some function still points to it, "finished: discarded" if none does. That is the whole closure
mechanism. With `steps` it plays like the others; without, it is a static picture.

```alcance
title: Cada llamada a la fábrica abre su propio cuarto
steps:
  - note: "`contar = crearContador()` abre un cuarto nuevo; ahí nace `cuenta = 0`."
    rooms:
      - id: g
        name: global
        rooms:
          - { id: c1, name: "crearContador(), llamada 1", on: true, vars: { cuenta: 0 } }
  - note: "La llamada terminó, pero la cuerda de `contar` mantiene vivo su cuarto."
    rooms:
      - id: g
        name: global
        fns: [{ name: contar, env: c1 }]
        rooms:
          - { id: c1, name: "crearContador(), llamada 1", gone: true, vars: { cuenta: 0 } }
```

| room key | does |
|---|---|
| `id`, `name` | the room and its title (Markdown inline) |
| `vars: { k: v }` | the names inside; strings are shown as written, so write `"'Q'"` to show quotes |
| `fns: [{ name, env }]` | functions stored here; `env` draws the rope to that room |
| `rooms: [...]` | nested rooms |
| `on` | highlights the room; `gone` marks a finished call; `bad: "text"` a red error line; `up: "text"` a note such as "if a name is missing it looks in global" |

`speed` is the ms per step, `note` the caption of a static picture.

## Animation

Steps through code line by line with play, step back, step forward and restart. By default it
**traces the snippet for real**: it runs it and records, after each statement, the line and the
value of every declared variable; entering an `if`/`else` block or a loop body is a step, so the
path taken lights up and the untaken branch never does; `function` declarations push and pop a
call stack with their arguments and return values; `console.log` output appears as it happens.

```anima
title: Una variable es una caja con nombre
code: |
  let precio = 18.5;
  const cajas = 2;
  precio = precio * cajas;
  console.log(precio);
```

Options:

| key | does |
|---|---|
| `show: [a, b]` | only these variables get boxes |
| `cells: { of: lista, at: i }` | draws the array `lista` as cells, highlighting index `i` (or the cell equal to `i` when `i` is a value, as in `for…of`) |
| `grid: { map: ["#..", …], visited: vistos, frontier: cola }` | draws a map; cells in the Set/array `vistos` (`"x,y"` keys) are tinted, those in `cola` (`[x, y]`, `{x, y}` or `"x,y"`) are the frontier: a BFS spreading |
| `notes: { 3: "…" }` | a note under the panel when that line is current |
| `globals: { … }` | values the snippet receives |
| `speed: 900` | ms per step while playing |
| `steps: [...]` | skip tracing and play these steps instead: `{ line, vars: {…}, out: "console text", stack: [{ name, args, ret }], note }` |

### Names and objects (`refs`)

By default each variable is drawn as a box with its value. With `refs: true` the pane draws what
the language really does: a name is a tag with an arrow to the object it points at, so two names
for one array are one box with two arrows, and a copy is a second box. Primitives stay inside
their tag (`refs: true`, the JavaScript way); `refs: all` draws every value as an object, so
`bateria = bateria - 15` moves the tag from the `100` to a new `85` and leaves the `100` fading
("nobody points to it"). The tracer gives each object a stable id across steps (JavaScript in the
page, Python in the build).

| key | does |
|---|---|
| `refs: true` / `refs: all` | the names-and-objects pane instead of the variable boxes; `show: [names]` still filters |
| `locked: [names]` | a padlock on those tags (`const`: the arrow is locked, the object is not) |

Hand-written `steps` can carry the picture themselves: `refs: { name: { r: id } | { p: "text" } }`
and `heap: { id: { k: val | list | tuple | set | dict | obj, cls, p, items } }`, where `items` are
`[label | null, { r: id } | { p: "text" }]` and a `val` has just `p`. Use it for objects the tracer
can't see, such as a function and its wrapper.

A frame in a hand-written `stack` may carry `err: "text"` to draw it in red: an error crossing calls.

Tracing understands one statement per line ending in `;` or `{`, `if`/`else`, loops and
`function` declarations; arrow functions run but don't appear on the stack. Keep snippets short
(at most ~12 lines, 300 steps). Write `steps` by hand for anything the tracer can't follow.

Motion respects `prefers-reduced-motion`: scenes show their last frame, boxes don't pop, and
everything still steps by hand. Colours come from the theme, so all of it works in light and
dark.

## Phones and the figure check

Every figure has to read on a 393 px phone (361 px of content): text at least 11 px as rendered, no
sideways scroll except a genuinely wide data table (`.rt-scroll`, `.tablewrap`). The panes use the
shared figure tokens of `platform/web/styles/charts.css` (`--ch-fs-tick|note|label`,
`--ch-sw-line|arrow|grid`, `--ch-1`, `--ch-flow`, `--ch-axis`, `--ch-grid`) and the UI sizes
(`--ui`, `--ui-s`), not pixel sizes of their own. The arrows of the names-and-objects pane and the
scope ropes are SVG paths ending in the same arrowhead marker as the static figures (`markers()` in
`visuals.js`). Inline `code` in a figure never drops under the note size (`.vis code`). A code
line in an animation wraps on a phone instead of scrolling.

Pixel-art scenes (`src/sql/scenes.js`) draw every text at `LABEL` viewBox units (5 of 160, which is
11 px on a phone) with a dark halo, so a pin or a sprite behind it doesn't hide it.

`scripts/lib/figures.mjs` runs at the end of every build and fails it when:

- a scene's text, in either language, would read under 11 px on a phone;
- a `lanes` spec has a bar or event without a label, a row without a label, or times outside its
  `from`-`to` axis (what the phone layout lists);
- `course.css` or `sql.css` set a `font-size` under 11 px (the scene's own units excepted) or a
  `min-width` wider than 361 px outside a `min-width` query (data tables and the desktop-only lanes
  grid are listed with their reason).

It can't see wrapping or overlaps inside the DOM panes (network, scope, refs, timeline, lanes):
those are looked at in screenshots at 393, 760 and 2000 px, light and dark, in both languages.
