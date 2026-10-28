# The Python track

`content/py/` is a second track with the same shape as JavaScript ([content.md](content.md),
[exercises.md](exercises.md), [visuals.md](visuals.md)): every session has its encargo, the
minimum, practice, a case, judges, a mission and an expert challenge. Its stories, cases, judge
problems and missions are its own; nothing is copied from the JavaScript track.

This page is the contract for writing it: what changes when the code is Python, then the plan of
the twenty sessions.

## How Python runs

The page runs Python in [Pyodide](https://pyodide.org) (CPython 3.14 compiled to WebAssembly),
loaded from jsDelivr the first time a Python exercise runs and kept in one worker
(`src/runner/pyclient.js`). A run that goes over its time (4 s, or 3 s per judge case) kills the
worker and the next run starts a new one. The build and `verify.mjs` run the same Pyodide from
the `pyodide` dev dependency (`scripts/lib/pyhost.mjs`), so what the build checks is what the
page runs; "predict" answers and runnable examples are also compared with the system's
`python3`.

The runner is `src/runner/py/taller.py`. JavaScript and Python talk through JSON strings
(`src/runner/pybridge.js`); the robot's world is still the JavaScript engine.

## Writing Python content

Everything in [exercises.md](exercises.md) holds, with these differences.

**Code is Python 3.14, idiomatic.** f-strings, `snake_case`, 4-space indents, `for x in xs` over
indices, comprehensions where they read better, `match`, `X | None`, `list[int]`, dataclasses,
`pathlib`. No Python 2 forms, no `%` formatting in solutions (they belong in `_modern.yml`).

**Blocks.** ```` ```py run ```` is a runnable example (about five lines; verify checks it prints
the same in CPython). Other ```` ```py ```` blocks are highlighted at build time.

**Tests are Python expressions**, evaluated in the program's namespace:

| check | Python |
|---|---|
| `expect: precio == 11` | a `==` comparison on its own shows both sides when it fails; write it that way whenever you can |
| `run: vuelto(50, 37)` + `equals: 13` | the value is compared with the YAML value; tuples count as lists, sets as sorted lists |
| `state: w.at_goal` | `w` is the world's summary with snake_case keys: `w.x`, `w.y`, `w.dir`, `w.battery`, `w.at_goal`, `w.delivered`, `w.said`, `w.crystals_left`, `w.collected`, `w.reports`, `w.open_doors`, `w.alarms`, `w.motion_doors`, `w.served` (items have `.table`, `.dish`), `w.inventory`, `w.items`, `w.items_left`, `w.dropped`, `w.marks`, `w.actions`, `w.crashed`; `out` is the console lines, `g` the given globals, `s` the server log (`s.requests`, `s.sent`) |
| `source: '\bfor\s+\w+\s+in\b'` | regex over the code without comments; Python regex syntax |
| `output`, `outputIncludes`, `sourceNot` | as in JavaScript |

YAML gotcha: quote any test containing `: ` or starting with a quote or bracket
(`expect: 'etiqueta == "Pedido 9"'`).

**Errors are explained in plain words** (`src/runner/py/taller.py`, `explain`): `NameError`,
`TypeError` from `"3" + 2`, `IndentationError`, `IndexError`, `KeyError`, `None` mistakes,
`.push` instead of `.append`, `UnboundLocalError`, `RecursionError`… with the line. Write
`fix` exercises around errors a learner really meets; the message they'll see is already good.

**The robot** has the same members in snake_case: `robot.avanzar(n)`, `robot.girar_izquierda()`,
`robot.girar_derecha()`, `robot.hay_pared("frente")`, `robot.decir(texto)`, `robot.entregar(etiqueta)`,
`robot.sensor()` (a dict: `{"puerta": "abierta", "movimiento": True}`), `robot.cerrar_puerta()`,
`robot.alarma()`, `robot.recoger()`, `robot.reportar(n)`, `robot.preparar(plato)`, `robot.servir()`,
`robot.escanear()`, `robot.mapa()`, `robot.tomar()`, `robot.soltar(nombre)`, `robot.abrir_puerta()`,
`robot.seguir_ruta(ruta)` (a list of `(x, y)` tuples or directions), `robot.marcar(casillas)`;
properties `robot.bateria`, `robot.posicion` (a named tuple `Posicion(x, y)`), `robot.direccion`,
`robot.carga`. English pages: `forward`, `turn_left`, `turn_right`, `wall_ahead`, `say`,
`deliver`, `sensor` (`{"door": "open", "motion": True}`), `close_door`, `alarm`, `collect`,
`report`, `cook`, `serve`, `scan`, `map`, `take`, `drop`, `open_door`, `follow_path`, `mark`,
`battery`, `position` (`Position(x, y)`), `direction`, `cargo`. A robot error (a wall, no
battery) is not an `Exception`: `except Exception` can't hide it.

**The judge** reads with the real `input()` (one line per call; `input().split()`,
`int(input())`, `sys.stdin.read()` all work) and prints with `print()`. Session 1's judge section
explains this once. Function mode is the same as JavaScript: `function:` names it, cases give
`args`, the return value is compared (tuples as lists). The random generator is a **Python
function body** that gets `rng` (`rng.int(lo, hi)`, `rng.pick(items)`, `rng.list(n, lo, hi)`,
`rng.shuffle(items)`, `rng.next()`) and returns the input text (stdout mode) or the argument list
(function mode):

```yaml
random:
  count: 40
  seed: 7
  generate: |
    n = rng.int(1, 50)
    return f"{n}\n{' '.join(map(str, rng.list(n, 1, 100)))}"
```

`wrong` solutions are Python too, and each must fail. `limit: 300` (ms per case, both modes)
makes a slow solution "time limit exceeded": the reference must run well under it and the slow
`wrong` solution well over it, in Pyodide. Use it in the performance session.

**Async.** `server:` works as in [robot-api.md](robot-api.md#the-simulated-server), the Python
way: `taller.pedir(recurso)` / `taller.enviar(recurso, datos)` are coroutines,
`taller.ahora()` is the simulated clock in ms, failures raise `ErrorServidor` (EN
`ServerError`, with `.status`), and time is virtual: `asyncio.run(main())`,
`await asyncio.sleep(…)`, `gather`, `TaskGroup`, `asyncio.timeout` all run instantly and
deterministically. Top-level `await` also works in these exercises. There is no
`taller.esperar`: use `asyncio.sleep` (seconds).

**Files.** `files: { "ventas.csv": "…" }` on an exercise (or a scenario) writes those files into
the working directory before each run; `open("ventas.csv")`, `pathlib.Path`, `csv` and `json`
work on them. Tests may read files the program wrote (`expect: 'open("informe.txt").read() == "…"'`).

**Visuals.** Same four components. An animation (` ```anima `) is traced at build time with
`sys.settrace`: after each line it records the variables (shown with `repr`), the call stack
with arguments and return values, and the output. `cells:` and `grid:` work on lists. A scene's
`program:` is Python, played at build time. A board's `clue.find` reads `print("Quilla:", x)`
lines like the JavaScript ones.

**Modern and legacy.** `content/py/_modern.yml` has the same shape as JavaScript's; `mdn:` is a
path under `docs.python.org/3/` (Spanish pages link to `docs.python.org/es/3/`), for example
`tutorial/inputoutput.html#formatted-string-literals`. "En código viejo verás…" shows Python 2
and pre-3.10 forms: `%` and `.format`, `typing.List`/`Optional`, `dict.has_key`, `if/elif`
chains where `match` fits, `range(len(…))`, `os.path` instead of `pathlib`,
`@asyncio.coroutine`/`yield from` coroutines, `loop.run_until_complete`.

**One language per page** applies: Spanish names on Spanish pages (`precio_total`,
`def calcular_vuelto(pago, costo)`), English on English pages. `verify.mjs` reads Python
assignments, `def`/`class`, parameters, `for` targets, `lambda`, `as` and `self.` attributes.

**Checking.** `node scripts/verify.mjs py` checks the whole track; `node scripts/verify.mjs py/03`
one session in both languages. `node scripts/build.mjs` also fails if a judge's reference, an
animation or a scene program breaks.

## The story

Loop opens a branch in **Chucuito, in the Callao**, by the port, and gives the learner
**Quilla**: a new robot, fresh from the box, that only knows Python. The branch's boss is the
engineer **Maru Chumpitaz**; customers come from all over Peru as the course travels (Callao,
Rímac, Chorrillos, Pachacámac, Huanchaco, Chiclayo, Catacaos, Cajamarca, Huaraz, Ica, Nazca,
Ayacucho, Cusco, Puno, Iquitos, Tacna, Moquegua, Chachapoyas). Names and dishes are Peruvian,
the stakes small, the humour light. Keep the robot's name **Quilla** in every session.

## The sessions

Each row: the file, the title, what it must teach (all of it, in order), its theme and robot
level, and seeds for the case, the judges (stdout until session 3, function mode from session 4
on, at least one per session), the mission and the challenge. Every judge has samples, edge
cases, 30–50 random cases and at least two plausible `wrong` solutions. A function-mode reference never
returns `None` (the build rejects it): return `()`, `[]`, `""` or `-1` for "nothing found".

| # | file | title | must teach | world |
|---|---|---|---|---|
| 1 | `01-valores.md` | Valores, variables y print | `int`, `float`, `str`, `bool`, `None`; assignment and reassignment; `print` with several values, `sep`, `end`; f-strings; `type()`; `int()`/`float()`/`str()`; `/` vs `//` vs `%`; `"3" + 2` is a `TypeError` (not glue as in JS); naming in snake_case | barranco, 1 |
| 2 | `02-condicionales.md` | Condicionales | `if`/`elif`/`else`; comparisons and chained `0 <= x < 10`; `and`/`or`/`not`; truthiness of `0`, `""`, `[]`, `None`; `==` vs `is` (only `is None`); conditional expression `a if c else b`; indentation is the block | museo, 2 |
| 3 | `03-bucles.md` | Bucles | `while`; `for` with `range(a, b, step)`; accumulators and counters; `break`, `continue`; `for … else`; nested loops; the endless-loop trap | mina, 3 |
| 4 | `04-funciones.md` | Funciones | `def`, `return`, implicit `None`; parameters, defaults, keyword arguments; `*args`, `**kwargs`; docstrings; local vs global scope; the mutable-default trap (`def f(x=[])`); functions calling functions; judges switch to function mode | cocina, 4 |
| 5 | `05-listas-y-tuplas.md` | Listas y tuplas | indexing, negative indexes, slicing `[a:b:c]`; `append`/`insert`/`pop`/`remove`; `in`; `sort()` vs `sorted()`; `len`, `sum`, `min`, `max`; aliasing vs copy; tuples, unpacking, swapping `a, b = b, a`, `*rest` | barranco, 2 |
| 6 | `06-diccionarios-y-sets.md` | Diccionarios y sets | dict literals, `[]` vs `.get`, `in`, `.items()`/`.keys()`/`.values()`, counting with `get`/`setdefault`, nested dicts, insertion order; sets and `|`, `&`, `-`; hashability (tuples as keys, lists can't be) | museo, 2 |
| 7 | `07-textos.md` | Textos | str methods (`strip`, `split`, `join`, `replace`, `lower`, `startswith`, `find`, `count`), slicing strings, immutability, f-string format specs (`:>8`, `:.2f`, `:,`, `:05d`), `ord`/`chr`, iterating characters, `in` | barranco, 1 |
| 8 | `08-comprensiones.md` | Comprensiones y funciones de colección | list/dict/set comprehensions with `if`; generator expressions; `enumerate`, `zip`; `sorted(key=…, reverse=…)`; `lambda`; `any`/`all`; `min`/`max` with `key`; `map`/`filter` and why comprehensions usually read better | cocina, 4 |
| 9 | `09-cuadriculas.md` | Cuadrículas | lists of lists, `grid[fila][col]` vs `(x, y)`; the `[[0] * m] * n` aliasing trap; neighbours with a list of directions; bounds checks; tuples as dict keys; `robot.mapa()` and `robot.escanear()` | mina, 3 |
| 10 | `10-busqueda.md` | Búsqueda | BFS with `collections.deque`, a `visited` set, the parent dict and rebuilding the path; `robot.seguir_ruta`; binary search by hand and with `bisect` | barranco, 2 |
| 11 | `11-closures-y-decoradores.md` | Funciones de primera clase, closures y decoradores | functions as values, functions that return functions, closures, `nonlocal`, `lambda`; decorators by hand, `@` syntax, `functools.wraps`, decorators with arguments; `functools.partial`, `functools.cache` | museo, 2 |
| 12 | `12-clases.md` | Clases | `class`, `__init__`, `self`, methods; instance vs class attributes; `__repr__`/`__str__`; `@property` with a setter that validates; `@classmethod` constructors, `@staticmethod`; `@dataclass` (with `field(default_factory=list)`, `frozen`, `order`); inheritance and `super()` | cocina, 4 |
| 13 | `13-modelo-de-datos.md` | El modelo de datos | dunder methods: `__eq__`, `__lt__` + `functools.total_ordering`, `__hash__`, `__len__`, `__getitem__`, `__iter__`, `__contains__`, `__add__`, `__bool__`; duck typing; context managers (`__enter__`/`__exit__`, `contextlib.contextmanager`); `typing.Protocol` | barranco, 3 |
| 14 | `14-generadores.md` | Iteradores y generadores | the iterator protocol (`iter`/`next`/`StopIteration`), `yield`, lazy pipelines, infinite generators, `yield from`, generator expressions, `itertools` (`islice`, `count`, `chain`, `groupby`, `accumulate`, `pairwise`, `batched`) | mina, 3 |
| 15 | `15-recursion.md` | Recursión | base case and recursive case, the call stack, `RecursionError`, recursion on nested lists/dicts, memoization with `functools.cache`, backtracking (subsets, permutations, a maze) | mina, 3 |
| 16 | `16-errores.md` | Errores y excepciones | `try`/`except`/`else`/`finally`, catching specific exceptions, `raise`, custom exception hierarchies, `raise … from`, EAFP vs LBYL, `assert`, `ExceptionGroup` and `except*` | barranco, 2 |
| 17 | `17-tipos-y-patrones.md` | Tipos, enums y match | type hints (`list[int]`, `dict[str, float]`, `X \| None`, `Callable`), `TypedDict`, `Protocol`, generics with `def f[T](…)`, `enum.Enum`; structural pattern matching: literals, sequences, mappings, class patterns, guards, `\|` | museo, 2 |
| 18 | `18-asincronia.md` | Asincronía con asyncio | coroutines, `async def`/`await`, `asyncio.run`, sequential vs `gather`, `create_task`, `TaskGroup`, `asyncio.timeout`, retries with backoff on `ErrorServidor`, `Semaphore` to cap concurrency, `asyncio.Queue` producers/consumers | barranco, 2 |
| 19 | `19-archivos-y-datos.md` | Archivos, módulos y datos | `open` with `with`, reading and writing text, `pathlib.Path`, `csv` (`DictReader`), `json`, `collections.Counter`/`defaultdict`, multi-key sorts, modules and `import`, `if __name__ == "__main__":` | cocina, 4 |
| 20 | `20-rendimiento.md` | Rendimiento | Big-O by measuring (`time.perf_counter`), `in` on a list vs a set, `list.pop(0)` vs `deque.popleft()`, `heapq` for the k best and for Dijkstra-style priority, `"".join` vs `+=`, prefix sums, two pointers; judges with `limit:` that reject the slow way | barranco, 2 |

### Seeds

Each session invents its own data; these seeds only fix the problem so no two sessions (and no
session and the JavaScript track) share one.

1. **Valores.** Encargo: Quilla's first delivery, a box of *alfajores de penca* from Don Teodoro's
   shop in the Rímac to a house by the Alameda de los Descalzos. Case: *La balanza del mercado*:
   four stall robots weighed and charged by kilo; which one overcharged (compute `kilos *
   precio_kilo` and compare). Judge (stdout): *El vuelto en monedas*: an amount in céntimos;
   print how many 5-sol coins, then 1-sol coins, then céntimos left (`//` and `%`). Mission:
   label with an f-string, deliver with exact battery. Challenge: a two-column price line with
   format specs.
2. **Condicionales.** Encargo: the Museo Larco's night guard, doors and motion. Case: *El turno
   que no cuadra*: guards' logs and which alarm was wrongly silenced. Judge (stdout): *La tarifa
   del Larco*: age and day → ticket price with brackets. Mission: a museum corridor reading
   `robot.sensor()`.
3. **Bucles.** Encargo: a mine in Cerro de Pasco. Case: *La vagoneta corta*: tallies per shift.
   Judge (stdout): *La racha más larga*: the longest run of days above a threshold. Mission:
   walk a tunnel collecting crystals with a loop.
4. **Funciones.** Encargo: a cevichería in Chorrillos. Case: *La propina repartida*: who paid
   wrong with `def`s that compute bills. Judges (function mode): `cuenta_mesa(platos, propina=0.1)`
   and a helper judged on its own. Mission: cook and serve tables with functions.
5. **Listas y tuplas.** Encargo: a fishermen's cooperative in Huanchaco's caballitos de totora.
   Case: *La caja que se movió*: an aliased list that changed. Judges: rotate a list by k, merge
   two sorted catches. Mission: deliveries in list order.
6. **Diccionarios y sets.** Encargo: the Túcume museum's inventory in Lambayeque. Case: *La
   pieza duplicada*: two inventories with set differences. Judges: anagram groups by sorted key,
   first repeated visitor. Mission: museum doors driven by a dict of rooms.
7. **Textos.** Encargo: a radio station in Catacaos dictating messages. Case: *El mensaje cifrado*:
   a Caesar-shifted note (`ord`/`chr`). Judges: normalise names (strip, title, collapse spaces),
   run-length encoding. Mission: deliver labels built from parsed text.
8. **Comprensiones.** Encargo: the San Pedro market kitchen in Cusco. Case: *El menú que alguien
   infló*: totals per waiter with comprehensions. Judges: top-k dishes by sales with ties by name,
   `zip` two lists into a report. Mission: serve tables from a comprehension.
9. **Cuadrículas.** Encargo: a flooded gallery in a Puno mine. Case: *La celda que se inundó
   primero*: count neighbours. Judges: count islands-free cells around marks (8-neighbour
   counts), rotate a grid 90°. Mission: read `robot.mapa()` and collect crystals.
10. **Búsqueda.** Encargo: medicine to a clinic in Iquitos' Belén streets. Case: *El atajo que no
    existía*: which reported route is impossible. Judges: shortest path length in a grid, first
    day a sorted log passes a value (`bisect`). Mission: BFS then `seguir_ruta`.
11. **Closures y decoradores.** Encargo: the Ayacucho retablo workshop's counters. Case: *El
    contador compartido*: a closure bug. Judges: build `contador()`, a `@reintentar(n)`
    decorator judged through calls. Mission: robot actions logged by a decorator.
12. **Clases.** Encargo: a bakery in Tacna. Case: *La cuenta
    con propiedad rota*: a property that didn't validate. Judges: a `Cuenta` class judged via a
    function that runs operations. Mission: a `Mozo` class that serves tables.
13. **Modelo de datos.** Encargo: a coin and stamp collector in Lima's Jirón de la Unión. Case:
    *La colección que se ordenó mal*: wrong `__lt__`. Judges: `Fraccion` with `+`, `==`, `<`;
    a `Mazo` with `len`/indexing. Mission: a context manager that opens and closes a door.
14. **Generadores.** Encargo: a conveyor belt in a Moquegua winery (pisco). Case: *La botella
    que nunca salió*: an exhausted generator. Judges: `ventanas(xs, k)` sliding sums,
    `intercalar` two generators. Mission: a generator of moves the robot consumes.
15. **Recursión.** Encargo: Kuélap's terraces in Chachapoyas. Case: *La caja dentro de la caja*:
    a nested inventory sum. Judges: count ways to climb terraces with memo, all subsets that sum
    to a target. Mission: recursive cave exploration.
16. **Errores.** Encargo: a customs warehouse in the port of Paita. Case: *El
    error que alguien escondió*: a bare `except` swallowing a failure. Judges: a parser that
    returns errors per line, validating records with custom exceptions. Mission: retries that
    catch the right exception.
17. **Tipos y match.** Encargo: the Nazca lines' flight control tower. Case: *El mensaje mal
    clasificado*: a `match` with a wrong order of cases. Judges: an interpreter of robot commands
    with `match`, a JSON-ish shape validator. Mission: commands parsed with `match`.
18. **Asincronía.** Encargo: the Callao port's crane schedule from a slow server. Case: *La grúa
    que esperó de más*: sequential vs concurrent time. Judges (function mode, async): fetch all
    with `gather` within a deadline, retry with backoff. Mission: request orders, then deliver.
19. **Archivos y datos.** Encargo: the Chiclayo market's sales records. Case: *La boleta que no
    está en el archivo*: CSV reconciliation. Judges: summarise a CSV given as text, merge JSON
    records. Mission: read a file of orders and serve them.
20. **Rendimiento.** Encargo: the Gamarra textile rush (or Huacachina buggy rentals). Case: *El
    reporte que tardaba una hora*: find the quadratic step. Judges with `limit:`: pair counts with
    a set/dict instead of two loops, k smallest with `heapq`, range sums with prefix sums.
    Mission: a big map that only a BFS finishes in battery.
