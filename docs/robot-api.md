# Robot API

What a program can use, how a session chooses it, and how the editor's autocomplete follows.
The names, signatures and one-line docs live in data files; the engine, the sandbox and the editor
all read them, so a name exists in autocomplete exactly when it exists at run time.

| file | holds |
|---|---|
| `src/api/robot.json` | every robot member (id, ES and EN name, parameters, return type, doc), the groups, and each theme's default groups |
| `src/api/env.json` | the judge's input readers and the simulated server (`taller` / `workshop`) |
| `src/api/js.json` | JavaScript for autocomplete: keywords, globals, `Math`/`JSON`/`Object`/`Array`/`Number`/`Promise`/`console` members, array/string/Map/Set/promise methods, snippets |
| `src/api/expose.js` | turns an exercise into the list of names it gets (used by the engine and the build) |

To add a member: add it to `robot.json` (both languages), implement it in `World` and map its id in
`World.api()` (`src/world/engine.js`), and document it here.

## The robot, by group

A world exposes groups (or single member ids) with `api:`. Without `api:`, it gets its theme's
groups: `barranco` → move + deliver, `museo` → move + museum, `mina` → move + mine, `cocina` → move +
kitchen. Calling a member the exercise doesn't expose stops the program with "El robot de este
ejercicio no tiene `robot.mapa`" / "This exercise's robot has no `robot.map`".

| group | Spanish | English | does |
|---|---|---|---|
| `move` | `avanzar(n = 1)` | `forward(n = 1)` | moves n tiles; a wall, a closed door or an empty battery stops the program |
| | `girarIzquierda()`, `girarDerecha()` | `turnLeft()`, `turnRight()` | turns in place |
| | `hayPared(lado)` | `wallAhead(side)` | `"frente"`/`"izquierda"`/`"derecha"` (`"front"`/`"left"`/`"right"`) |
| | `decir(texto)` | `say(text)` | a speech bubble |
| | `bateria`, `posicion`, `direccion` | `battery`, `position`, `direction` | read-only; `posicion` is `{ x, y }`; `direccion` is `"N"`, `"E"`, `"S"`, `"O"` (EN `"W"`) |
| `deliver` | `entregar(etiqueta)` | `deliver(label)` | on the `D` tile |
| `museum` | `sensor()`, `cerrarPuerta()`, `alarma()` | `sensor()`, `closeDoor()`, `alarm()` | the door below the robot |
| `mine` | `recoger()`, `reportar(n)` | `collect()`, `report(n)` | crystals on this tile; records a number |
| `kitchen` | `preparar(plato)`, `servir()` | `cook(dish)`, `serve()` | on `K`; the table below |
| `scan` | `escanear()` | `scan()` | the visible grid around the robot (fog): `(2·vision+1)²` rows of one-character strings, the robot in the middle, `"?"` off the map |
| `map` | `mapa()` | `map()` | the whole map as rows of strings, `mapa()[y][x]`; give it only when reading the map is allowed |
| `cargo` | `tomar()` | `take()` | takes the item on this tile; returns its name, or `null` |
| | `soltar(nombre?)` | `drop(name?)` | leaves an item from the cargo here (the last one by default) |
| | `carga` | `cargo` | read-only copy of the item names carried |
| `doors` | `abrirPuerta()` | `openDoor()` | opens the door in front; a padlocked door needs the key (item `k`) in the cargo |
| `path` | `seguirRuta(ruta)` | `followPath(path)` | walks a route: neighbouring tiles (`[x, y]` or `{ x, y }`; the current tile is skipped) or directions (`"N"`, `"E"`, `"S"`, `"O"`/`"W"`); turns as needed, every step is played back |
| | `marcar(casillas)` | `mark(tiles)` | tints tiles on the map without moving (one tile or a list): show what a search explored |

Cells in `escanear()` and `mapa()`: `#` wall, `.` floor, `D` goal, `K` kitchen, `P` closed door,
`O` open door, `L` padlocked door, `a`–`z` items, `1`–`9` crystals (mine) or table numbers (kitchen).

## World config

All keys of [exercises.md → Worlds](exercises.md#worlds), plus:

| key | default | does |
|---|---|---|
| `api` | the theme's groups | which groups or member ids the robot exposes |
| `vision` | 1 | the radius `escanear()` sees and the fog reveals |
| `fog` | false | the map is dark except what the robot has been near |
| `items` | `{}` | names for item letters on the map, `{ a: caja, k: llave }` (in the page's language); unnamed items are called by their letter |
| `capacity` | unlimited | how many items the cargo holds |

Map characters added: `a`–`z` (except `m`, motion) are items; `k` is the key; `L` is a padlocked door.

Tests read, besides what exercises.md lists: `w.inventory` (names), `w.items` (`{ "x,y": name }`
still on the map), `w.itemsLeft`, `w.dropped` (`{ item, x, y }`), `w.marks` (`"x,y"` keys).

## The simulated server

An exercise with `server:` runs **async**: the program may use `await` at the top level, and gets
`taller` (EN `workshop`) and a virtual `setTimeout`/`clearTimeout`. Time is simulated: nothing really
waits, a run takes no time, and the same seed gives the same latencies and failures every time.

| Spanish | English | does |
|---|---|---|
| `await taller.pedir(recurso)` | `await workshop.request(resource)` | a copy of `data[recurso]`; rejects with an `Error` whose `status` is 503 (a failure) or 404 (no such resource) |
| `await taller.enviar(recurso, datos)` | `await workshop.send(resource, data)` | `{ ok: true }`, or a 503 failure; what was sent is logged |
| `await taller.esperar(ms)` | `await workshop.wait(ms)` | waits on the simulated clock |
| `taller.ahora()` | `workshop.now()` | the simulated clock, in ms |

```yaml
server:
  seed: 7
  latency: [80, 300]     # ms, each request draws one in this range
  failRate: 0.2          # chance a request fails with 503
  failOn: [1, 4]         # or: exactly these requests fail (1-based), overriding failRate
  data:
    pedidos: [{ id: 1, plato: ceviche }, { id: 2, plato: causa }]
```

`async: true` without `server:` runs async with only the virtual timers. Parallel requests
(`Promise.all`) finish at the slowest latency, sequential ones add up, so a lesson can measure the
difference with `taller.ahora()`. A program left waiting on a promise that never settles gets
"El programa se quedó esperando una promesa…" instead of hanging.

State tests get a fourth value, `s`: `{ clock, requests: [{ n, resource, start, end, ok, status }], sent: [{ resource, data, at }] }`.

Judges: `server:` (or `async: true`) works in function mode too. The judged function may be
`async`; each case gets a fresh server with the same seed.

## Helpers and session config

`helpers:` gives the program ready-made functions or documents a given value; each one appears in
autocomplete with its signature and doc. With `code`, the program receives it; without, it only
documents a name the exercise provides (for example a global).

```yaml
helpers:
  - name: distancia                 # EN page: distance
    sig: "distancia(a, b) → number"
    doc: Pasos entre dos casillas, sin contar paredes.
    code: "(a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)"
```

A ```` ```session ```` block anywhere in a session sets defaults for all its exercises: `world`
(merged under each exercise's own `world`), `helpers` (added to every exercise) and `server`
(used by exercises that say `server: true`, or merged under their own `server`). A scenario may
override `world` keys under its own `world: { … }` (a `battery:` written directly on the scenario is
ignored), as well as `map` and `server`.

````md
```session
world: { theme: mina, level: 3, api: [move, scan, cargo], vision: 1, fog: true, items: { a: caja } }
helpers: [...]
server: { seed: 5, latency: [100, 400], failRate: 0.25, data: { … } }
```
````

## Autocomplete

Every editor completes from what its exercise really gets:

- `robot.` lists the exposed members, each with its signature and a one-line doc in the page's
  language; nothing robot-related appears in an exercise without a world.
- Judges in stdout mode offer the readers (`leerLinea`… / `readLine`…); exercises with a server
  offer `taller`/`workshop` and its members; helpers and globals appear with their docs (a global
  object completes its keys: `lectura.` → `puerta`, `movimiento`).
- JavaScript keywords, globals and their members (`Math.`, `console.`, `JSON.`, `Object.`…),
  array/string/Map/Set methods after a name declared as one (`const lista = [`…), or both lists
  as a fallback after any other name.
- The learner's own variables and functions.
- Snippets: `for…of`, `for (i)`, `if`, `if / else`, `while`, `function`, arrow function,
  `try / catch`, `async function`.

Typing opens it; `Ctrl-Space` (or `Alt-Space`) opens it on demand; `Tab` or `Enter` accepts; `Esc`
closes. On touch screens `Enter` keeps inserting a new line (tap a suggestion to accept it). Inside
a call's parentheses a tooltip shows the signature with the current argument in bold.
