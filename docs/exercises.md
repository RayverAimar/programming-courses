# Exercise blocks

An exercise is a fenced block with YAML inside. The build turns it into a live component; nothing
in the engine changes when you add one.

````md
```exercise
id: js2-completa-puerta          # unique, lowercase, the same in every language
type: complete                   # see below
title: ¿Cierro o sigo?
prompt: |                        # Markdown
  Si la puerta está abierta, `accion` debe ser `"cerrar"`; si no, `"seguir"`.
starter: |                       # what the editor starts with (use ___ for gaps)
  let accion;
  if (lectura.puerta ___ "abierta") { … }
solution: |                      # shown collapsed; must pass every test
  …
hints:                           # 1–2, revealed one at a time
  - El primer hueco es el operador de igualdad estricta.
tests:
  - name: usa ===
    source: '==='
```
````

## Types

| type | what the learner does | needs |
|---|---|---|
| `predict` | reads code, picks what it prints, then sees it run | `code`, `options`, `answer` (one of the options), optional `explain` |
| `complete` | fills `___` gaps | `starter`, `solution`, `tests` |
| `fix` | finds a real bug | `starter`, `solution`, `tests` |
| `write` | writes from scratch | `starter`, `solution`, `tests` |
| `case` | runs code over invented data and types the answer | `starter`, `solution`, `answer`, optional `answerLabel`, `reveal` |
| `mission` | drives the robot on the map; passing opens the next session | `world`, `starter`, `solution`, `tests` |
| `challenge` | like `write`, for the expert section | `starter`, `solution`, `tests` |
| `judge` | a competitive-programming problem, judged on samples and hidden cases; required to open the next session | see [Judge](#judge) |

Practice exercises (`predict`, `complete`, `fix`, `write`) are numbered on the page. A case's
answer ships as a hash and is compared ignoring case, accents and extra spaces.

## Tests

Each test has a `name` (shown with a green or red mark), exactly one check, and an optional `msg`
shown when it fails. Write `msg` as advice, in the session's language.

| check | passes when |
|---|---|
| `expect: <expr>` | the expression is truthy, evaluated after the program in the program's own scope (it can read its `const`s and call its functions) |
| `run: <expr>` + `equals: <value>` | the expression deep-equals the value; the failure shows both |
| `output: <text>` | the console output is exactly this (lines joined by newlines, trailing spaces ignored) |
| `outputIncludes: <text>` | the console output contains it |
| `source: <regex>` | the code (comments removed) matches; use it to require a construct |
| `sourceNot: <regex>` | the code doesn't match, e.g. `'\bvar\b'` |
| `state: <expr>` | the expression is truthy over `w` (the world after the run), `out` (console lines), `g` (the exercise's globals) and `s` (the simulated server's log, see [robot-api.md](robot-api.md#the-simulated-server)) |

`w` has (more in [robot-api.md](robot-api.md#world-config)): `x`, `y`, `dir`, `battery`, `carry`, `crashed`, `atGoal`, `atKitchen`, `wallAhead`,
`delivered` (labels), `said`, `crystalsLeft`, `crystalsTotal`, `collected`, `reports`,
`openDoors`, `alarms` and `motionDoors` (door keys, sorted), `served` (`{ table, dish }` in
order), `actions`.

Failures say what happened. An `expect` of the form `a === b` shows both sides
(`` `etiqueta` vale ""; se esperaba "Pedido 27…" ``); `run` and `output` show expected and actual;
the first failing `state` test adds where the robot ended, its battery and actions, the goal, and
what applies to the map (open doors, motion and alarms by room, crystals left and reported,
dishes served). Write `expect` as a single `===` comparison whenever you can, so the learner gets
that detail.

If the program throws, the error is explained in plain words with its line ("`y` no existe…",
"Intentaste cambiar una constante…"), and in-scope tests report that the program stopped.
Leftover `___` gaps are reported before running.

## Judge

A judge problem checks that the topic really landed. A session is complete, and the next one
opens, when its mission **and** its judges pass.

````md
```exercise
id: js3-juez-vagonetas
type: judge
mode: stdout                 # stdout (default) or function
title: El parte de las vagonetas
prompt: |                    # the story, Entrada/Input, Salida/Output, Restricciones/Constraints
  …
starter: |
solution: |                  # the reference: it produces every expected output
hints: […]
samples:                     # shown in the statement; run first
  - input: "5\n3 0 7 0 2"
    output: "12\n2\n7"     # optional; the build checks it against the reference
    note: …                  # optional explanation under the example
edge:                        # hand-written hidden cases
  - input: "0\n"
    tag: sin ninguna vagoneta    # shown on failure: "Falla en un caso oculto sin ninguna vagoneta."
random:                      # generated hidden cases
  count: 30
  seed: 33
  generate: |                # function body; `rng` has int(lo, hi), pick(list), list(n, lo, hi), next()
    const n = rng.int(1, 1000);
    return `${n}\n${rng.list(n, 0, 100).join(" ")}`;
wrong:                       # plausible wrong solutions; verify.mjs makes sure each one fails
  - |
    …
tests:                       # optional, source checks only (e.g. require a function)
```
````

**stdout mode** (sessions 1–3): the program reads its input and prints with `console.log`.
Output is compared after trimming trailing whitespace on every line and trailing empty lines.
The readers are named per language, like the robot's commands:

| Spanish | English | returns |
|---|---|---|
| `leerLinea()` | `readLine()` | the next line, as text (`""` past the end) |
| `leerNumero()` | `readNumber()` | the next line as a number |
| `leerNumeros()` | `readNumbers()` | the next line as a list of numbers (split on spaces) |

**function mode** (session 4 on): LeetCode style. `function:` names the function; each case
gives `args` (a list) and may name another function with `fn:` to judge a helper on its own. The
judge calls it and compares the return value by deep equality; `tolerance: 1e-9` allows for
floating point. Function names are translated per language (`cuentaMesa` / `tableBill`), and a
missing one gets "No encontré la función `cuentaMesa`". In samples, `returns:` is optional and
checked against the reference. A random generator returns the argument list.

```yaml
mode: function
function: cuentaMesa
samples:
  - args: [[["ceviche", 2], ["chicha", 3]], 10]
    returns: 103
  - fn: precioDe
    args: ["chicharron"]
edge:
  - fn: subtotal
    args: [["chicha", 0]]
    tag: en subtotal, con cantidad cero
```

Input data and expected outputs must be identical in every language (only the words around
them change); keep data language-neutral, such as dish names or arrays instead of objects
with translated keys. `verify.mjs` enforces it.

**Judging.** The build runs the reference on every case and ships the cases with the page.
Every case has its own 1-second limit in the worker. The verdict is the first failing case's:
*Aceptado / Accepted*, *Respuesta incorrecta / Wrong answer*, *Tiempo límite excedido / Time
limit exceeded* or *Error de ejecución / Runtime error*, with the count (`47/50 casos`). A failing
sample shows its input (or call), the expected output and the learner's. A failing hidden case
shows only its tag, never its data; after 3 failed submissions the learner can reveal the
smallest failing hidden case.

**Verification.** For every judge, in both languages, `verify.mjs` checks that the generator is
deterministic, that the reference passes every case, that the starter and each `wrong`
solution fail, that the reference never returns `undefined` or `NaN`, and that the cases match
across languages.

## Globals and scenarios

`globals` are values the program receives as ready-made variables (`lectura`, `pedidos`…). A
program that declares one again gets a friendly "it already exists" message.

`scenarios` run the same program several times with different data, so a solution can't
hard-code one case. Each scenario may override `globals` and the world `map`, and add its own
`tests`. All scenarios must pass; the page shows the first failing one (its map plays back).

```yaml
globals:
  lectura: { movimiento: true, hora: 23 }
scenarios:
  - tests:
      - name: 23:00 con movimiento → intruso
        expect: 'alerta === "intruso"'
  - globals: { lectura: { movimiento: false, hora: 3 } }
    tests:
      - name: 03:00 sin movimiento → calma
        expect: 'alerta === "calma"'
```

## Visuals

Every case, judge and mission needs a picture; attach one with `visual:` (see
[visuals.md](visuals.md)). A case's starter gives only the data and a TODO, never the computation;
`verify.mjs` fails a case whose starter already prints the answer.

## Worlds

The robot's full API (fog sensor, map, cargo, doors, route playback, the simulated server),
`api:` to choose what an exercise exposes, and the ```` ```session ```` defaults block are in
[robot-api.md](robot-api.md).

```yaml
world:
  theme: mina        # barranco | museo | mina | cocina
  level: 3           # robot parts: 1 cargo box, 2 siren, 3 headlamp, 4 serving arm
  dir: E             # N, E, S, W
  battery: 11        # optional: one unit per step; without it, unlimited
  map: |
    #######
    #R.3.1#
    #######
```

| char | meaning |
|---|---|
| `#` | wall / rock / building |
| `.` | floor |
| `R` | robot start |
| `D` | goal: the customer's mailbox, the mine's lift |
| `P` / `O` | a closed / open door (museum) |
| `m` | movement in the room (an intruder) |
| `1`–`9` | crystals on that tile (mine) or table number (kitchen) |
| `K` | kitchen station; also the robot's start in a kitchen |

The robot's original commands, in Spanish and English pages (all of them in [robot-api.md](robot-api.md)):

| Spanish | English | does |
|---|---|---|
| `avanzar(n = 1)` | `forward(n = 1)` | moves n tiles; a wall or an empty battery stops the program |
| `girarIzquierda()`, `girarDerecha()` | `turnLeft()`, `turnRight()` | turns in place |
| `hayPared(lado)` | `wallAhead(side)` | `"frente"`/`"izquierda"`/`"derecha"` (`"front"`/`"left"`/`"right"`), front by default |
| `entregar(etiqueta)` | `deliver(label)` | delivers on the `D` tile |
| `sensor()` | `sensor()` | reads the door below: `{ puerta, movimiento }` / `{ door, motion }` |
| `cerrarPuerta()`, `alarma()` | `closeDoor()`, `alarm()` | acts on the door below |
| `recoger()` | `collect()` | picks up this tile's crystals, returns how many |
| `reportar(n)` | `report(n)` | records a number |
| `preparar(plato)`, `servir()` | `cook(dish)`, `serve()` | on `K`; then serve to the table below |
| `decir(texto)` | `say(text)` | a speech bubble |
| `bateria`, `posicion` | `battery`, `position` | read-only |

Every action is recorded as a frame; the page plays them back (play, pause, replay, 1×/2×/4×).
More than 3000 actions stops the program as a probable endless loop.

## The sandbox

Programs run in a fresh Web Worker per run, terminated after 2 seconds, so an endless loop can't
freeze the page. The program can't reach `fetch`, `importScripts`, `postMessage`, `self`,
`globalThis` or timers. This keeps learners' mistakes contained; it is not a security boundary
for hostile code, and doesn't need to be: the code is the learner's own, in their own browser.

## Adding another language track

The engine, the world and the page are language-agnostic, but `harness.js` runs JavaScript. A
Python or SQL track needs a runner for that language (Pyodide, sql.js) behind the same
`runExercise(ex, code, { lang })` contract, returning `{ pass, tests, logs, error, frames }`. Python is described in [python.md](python.md) and SQL (sql.js, its own tests, judges on small databases and the case files) in [sql.md](sql.md).
