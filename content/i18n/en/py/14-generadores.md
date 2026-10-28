# Session 14 — Iterators and generators

## The job

Samegua, Moquegua, in the middle of the grape harvest. Doña **Herminia Zapata**'s winery, **El Tinajón**, has been distilling pisco ever since her grandfather brought the clay jars up from Ilo by donkey: quebranta, italia and an acholado that sells out at the Moquegua fair before noon. This year Herminia bought a second-hand **conveyor belt**: the bottles leave the filler, go through the corker and reach the labeller, one after another, all day long.

Maru sent her Quilla, with its helmet headlamp, to run the belt and go down to the jar cellar. The problem: the belt never ends. You can't make "the list of all the day's bottles" before you start, because they don't exist yet. Today Quilla learns to work **one thing at a time**: iterators, which give you the next one when you ask, and generators, functions that pause after handing over each value.

```scene
theme: mina
level: 3
dir: E
caption: El Tinajón's cellar. Quilla goes down the corridor of jars collecting the bottles (the numbers) left on the floor.
map: |
  #########
  #R.2..1.#
  #######.#
  #D..3...#
  #########
program: |
  for _ in range(6):
      robot.forward()
      robot.collect()
  robot.turn_right()
  robot.forward(2)
  robot.turn_right()
  for _ in range(6):
      robot.forward()
      robot.collect()
```

## The minimum

A `for` doesn't walk a list directly: first it asks it for an **iterator** with `iter(list)` and then it asks for the next value with `next(...)`, again and again, until the iterator says it's done by raising `StopIteration`. That's the **iteration protocol**, and you can use it by hand:

```py run
bottles = ["quebranta", "italia", "acholado"]
belt = iter(bottles)
print(next(belt))
print(next(belt), next(belt))
print(next(belt, "belt empty"))
```

Without the second argument, that last `next` would raise `StopIteration`. The `for` catches it for you and ends quietly.

Any object that follows the protocol works in a `for`: it needs `__iter__` (returns the iterator, usually itself) and `__next__` (returns the next value, or raises `StopIteration`).

```py run
class Belt:
    def __init__(self, bottles):
        self.bottles = bottles
        self.position = 0

    def __iter__(self):
        return self

    def __next__(self):
        if self.position == len(self.bottles):
            raise StopIteration
        bottle = self.bottles[self.position]
        self.position += 1
        return bottle

for bottle in Belt(["Q-401", "I-210"]):
    print("passes", bottle)
```

Writing that class every time gets tiring. A **generator** does the same thing with a function: all it needs is a **`yield`**. Calling it runs nothing; it returns a generator. Each `next` runs the body up to the next `yield`, hands over that value and **pauses there**, with its variables intact, until the next `next`.

```anim
title: A generator pauses at every yield
code: |
  def belt(bottles):
      for bottle in bottles:
          yield bottle.upper()

  out = belt(["quebranta", "italia"])
  print(next(out))
  print(next(out))
  print(next(out, "empty"))
notes:
  5: "Calling belt doesn't run a single line of its body: it only creates the generator."
  6: "The first next goes into belt and runs up to the yield."
  3: "yield hands over the value and pauses the function here, with bottle intact."
  8: "The inner for is over: the function ends and next returns the default value."
```

And the same movie looking at **the function's frame**: it runs, pauses with its variables and wakes up where it stopped.

```anim
title: "A generator's frame: runs, pauses, wakes up"
code: |
  def belt(bottles):
      for bottle in bottles:
          yield bottle.upper()

  out = belt(["quebranta", "italia"])
  print(next(out))
  print(next(out))
  print(next(out, "empty"))
steps:
  - { line: 5, vars: { out: "<generator>", state: "not started: no line of the body has run" }, stack: [], note: "Calling the function runs nothing: it only creates the generator, with its frame empty." }
  - { line: 6, vars: { bottle: "quebranta", state: "▶ running" }, stack: [{ name: belt, args: 'bottles = [...]' }], note: "The first `next` wakes it up: the function runs from the start." }
  - { line: 3, vars: { bottle: "quebranta", state: "⏸ paused at the yield" }, stack: [], out: "QUEBRANTA", note: "It reaches the `yield`: it hands `QUEBRANTA` out and **pauses**, with `bottle` intact." }
  - { line: 7, vars: { bottle: "italia", state: "▶ running" }, stack: [{ name: belt, args: 'bottles = [...]' }], out: "QUEBRANTA", note: "The second `next` wakes it right where it stopped, not from the start." }
  - { line: 3, vars: { bottle: "italia", state: "⏸ paused at the yield" }, stack: [], out: "QUEBRANTA\nITALIA", note: "Another `yield`: it hands `ITALIA` out and pauses again." }
  - { line: 8, vars: { bottle: "italia", state: "▶ running" }, stack: [{ name: belt, args: 'bottles = [...]' }], out: "QUEBRANTA\nITALIA", note: "The third `next` wakes it up: the `for` has no more bottles." }
  - { line: 8, vars: { bottle: "italia", state: "finished" }, stack: [], out: "QUEBRANTA\nITALIA\nempty", note: "The function ends: its frame disappears and `next` returns the default value." }
```


Since each value is made only when it's asked for, you can chain generators into a **lazy pipeline**: each bottle goes through every station before the next one gets on the belt. Nothing is kept in intermediate lists.

```py run
def fill(codes):
    for code in codes:
        print("fill", code)
        yield code

def cork(bottles):
    for bottle in bottles:
        print("  cork", bottle)
        yield bottle + "*"

for finished in cork(fill(["Q-401", "Q-402"])):
    print("    out", finished)
```

That mix of printed lines is exactly what happens when each function pauses and wakes up. Look at who asks whom for what:

```network
title: Who asks whom for what, and in what order
caption: "Each `next()` goes down asking for a value and each `yield` comes back up handing it over. Each function pauses where it is and resumes from there."
speed: 4200
nodes:
  - { id: for, icon: program, label: "The `for`", sub: "asks for the next bottle" }
  - { id: cork, icon: engine, label: "cork", sub: "asks for a bottle and corks it" }
  - { id: fill, icon: box, label: "fill", sub: "asks for a code and fills it" }
steps:
  - phase: "Ask for one, and each station wakes up"
    move: [for, cork]
    packet: { kind: up, label: next() }
    note: "It all starts at the `for`: it asks `cork` for the first bottle. Not **a single line** of `fill` or `cork` has run yet: calling them only created the generators."
  - move: [cork, fill]
    packet: { kind: up, label: next() }
    note: "`cork` wakes up, enters its `for` and needs a bottle: it asks `fill` for one."
  - at: fill
    note: "`fill` runs up to its first `yield`: it prints `fill Q-401` and **pauses there**, with `code = \"Q-401\"` kept."
    tags: { fill: "paused at the yield" }
    show: { label: "What it prints", text: "fill Q-401" }
  - move: [fill, cork]
    packet: { kind: down, label: "Q-401" }
    note: "The `yield` hands `Q-401` up to `cork`."
    tags: { fill: "paused" }
    show: { label: "What it prints", text: "fill Q-401" }
  - at: cork
    note: "`cork` prints `cork Q-401` and reaches its `yield`: it hands over `Q-401*` and pauses too."
    tags: { fill: "paused", cork: "paused at the yield" }
    show: { label: "What it prints", text: "fill Q-401\n  cork Q-401" }
  - move: [cork, for]
    packet: { kind: down, label: "Q-401*" }
    note: "`Q-401*` reaches the `for`."
    tags: { fill: "paused", cork: "paused" }
    show: { label: "What it prints", text: "fill Q-401\n  cork Q-401" }
  - at: for
    note: "The body of the `for` prints `out Q-401`. **Only now** is the second bottle asked for: the first one has already left the belt, finished."
    tags: { fill: "paused", cork: "paused" }
    show: { label: "What it prints", text: "fill Q-401\n  cork Q-401\n    out Q-401" }
  - move: [for, cork]
    packet: { kind: up, label: next() }
    note: "The `for` asks for the next one. `cork` wakes **right where it paused**, goes back to its `for` and asks `fill` for another bottle, which wakes up too."
    show: { label: "What it prints", text: "fill Q-401\n  cork Q-401\n    out Q-401" }
  - at: fill
    note: "`fill` resumes from its `yield`, goes back to its `for` and prints `fill Q-402`."
    tags: { fill: "paused at the yield" }
    show: { label: "What it prints", text: "fill Q-401\n  cork Q-401\n    out Q-401\nfill Q-402" }
  - at: cork
    note: "The bottle goes up to `cork`, which prints `cork Q-402` and hands over `Q-402*`."
    tags: { cork: "paused at the yield" }
    show: { label: "What it prints", text: "fill Q-401\n  cork Q-401\n    out Q-401\nfill Q-402\n  cork Q-402" }
  - at: for
    note: "The `for` prints `out Q-402`. That's why the printed order mixes the three functions: **each bottle crosses every station before the next one gets in**."
    show: { label: "What it prints", text: "fill Q-401\n  cork Q-401\n    out Q-401\nfill Q-402\n  cork Q-402\n    out Q-402" }
  - move: [for, cork]
    packet: { kind: up, label: next() }
    note: "The `for` asks for one more. `fill` runs out of codes and ends: it signals `StopIteration` upwards, `cork` ends too and the `for` finishes **quietly**."
    tags: { fill: "finished", cork: "finished" }
    show: { label: "What it prints", text: "fill Q-401\n  cork Q-401\n    out Q-401\nfill Q-402\n  cork Q-402\n    out Q-402" }
```

A generator can be **infinite**: a `while True` with a `yield` inside doesn't hang, because it only moves forward when someone asks. `itertools.count(101)` counts 101, 102, 103… forever, and `islice(iterable, n)` takes only the first `n`.

```py run
from itertools import count, islice

def seals():
    for number in count(101):
        yield f"P-{number}"

print(list(islice(seals(), 3)))
```

`yield from other` hands over, one by one, all the values of another iterable or generator. It's the `for` with a `yield` inside, in one line:

```py run
def whole_belt(boxes):
    for box in boxes:
        yield from box

print(list(whole_belt([["Q-401", "Q-402"], [], ["I-210"]])))
```

A **generator expression** is a comprehension in parentheses: `(ml for ml in measures)`. It doesn't build a list; it produces the values as `sum`, `max` or a `for` ask for them. Inside a call, the call's own parentheses are enough:

```py run
liters = [0.5, 0.75, 0.5, 1.0]
print(sum(int(liter * 1000) for liter in liters))
print(max(len(variety) for variety in ["italia", "quebranta"]))
```

And `itertools` brings lazy pieces ready to build walks with:

```py run
from itertools import accumulate, batched, chain, groupby, pairwise
per_hour = [120, 95, 130, 80]
print(list(accumulate(per_hour)), list(pairwise(per_hour))[:2])
print(list(batched(["Q-1", "Q-2", "Q-3", "Q-4", "Q-5"], 2)))
print(list(chain(["Q-1"], ["I-1", "I-2"])))
print([(variety, len(list(batch))) for variety, batch in groupby("QQIIIQ")])
```

- `accumulate`: the running totals. `pairwise`: each value with the next one, `(a, b)`, `(b, c)`…
- `batched(xs, n)`: tuples of `n` at a time; the last one may come out shorter.
- `chain(a, b)`: one after the other. `groupby`: groups **consecutive** equal values; if you want one group per value, sort them first.

> **Common trap:** a generator (and any iterator) can be walked **only once**. The second pass isn't an error: it simply hands over nothing, so a `for` doesn't loop even once and `sum` gives 0. The iterator is like a bookmark that has already reached the end: it doesn't go back to the start on its own. If you need to walk the data twice, keep it in a list (`list(gen)`) or call the generator function again.

<!-- mdn: yield-from itertools -->

## Practice

```exercise
id: py14-predice-pausa
type: predict
title: The belt that starts late
prompt: |
  Herminia turns on the belt and asks Quilla for the first two bottles. Before running it: what does it print?
code: |
  def belt():
      print("starts")
      yield "Q-401"
      print("goes on")
      yield "Q-402"

  out = belt()
  print("ready")
  print(next(out))
  print(next(out))
options:
  - "ready\nstarts\nQ-401\ngoes on\nQ-402"
  - "starts\nready\nQ-401\ngoes on\nQ-402"
  - "starts\ngoes on\nready\nQ-401\nQ-402"
  - "ready\nQ-401\nQ-402"
answer: "ready\nstarts\nQ-401\ngoes on\nQ-402"
explain: |
  `belt()` doesn't run the body: it only creates the generator, so `ready` comes out first. The first `next` runs from the beginning to the first `yield` (prints `starts` and hands over `Q-401`); the second one carries on **from where it paused** to the next `yield`.
```

```exercise
id: py14-completa-lote
type: complete
title: The batch codes
prompt: |
  Fill in the `___` so that `Batch` is an iterator: `Batch("Q", 7, 10)` hands over `"Q-7"`, `"Q-8"`, `"Q-9"` and `"Q-10"`, and then it's done.
visual:
  figure:
    input: { label: "Batch(\"Q\", 7, 10)", cards: [{ title: Batch, rows: [["prefix", "\"Q\""], ["current", "7"], ["last", "10"]] }] }
    arrow: "each next() returns a code and adds 1"
    output: { label: "list(...)", cells: ["Q-7", "Q-8", "Q-9", "Q-10"] }
starter: |
  class Batch:
      def __init__(self, prefix, first, last):
          self.prefix = prefix
          self.current = first
          self.last = last

      def ___(self):
          return ___

      def __next__(self):
          if self.current > self.last:
              raise ___
          code = f"{self.prefix}-{self.current}"
          self.current += ___
          return code


  print(list(Batch("Q", 7, 10)))
solution: |
  class Batch:
      def __init__(self, prefix, first, last):
          self.prefix = prefix
          self.current = first
          self.last = last

      def __iter__(self):
          return self

      def __next__(self):
          if self.current > self.last:
              raise StopIteration
          code = f"{self.prefix}-{self.current}"
          self.current += 1
          return code


  print(list(Batch("Q", 7, 10)))
hints:
  - "The method that `for` (and `iter()`) asks for is called `__iter__`, and an iterator returns itself: `self`."
  - "To say it's done, you raise `StopIteration`."
tests:
  - name: hands over the whole batch
    run: list(Batch("Q", 7, 10))
    equals: ["Q-7", "Q-8", "Q-9", "Q-10"]
  - name: prints the list
    output: "['Q-7', 'Q-8', 'Q-9', 'Q-10']"
  - name: a one-bottle batch
    run: list(Batch("A", 3, 3))
    equals: ["A-3"]
  - name: an empty batch hands over nothing
    run: list(Batch("I", 5, 4))
    equals: []
  - name: next works by hand
    expect: 'next(Batch("I", 20, 25)) == "I-20"'
```

```exercise
id: py14-arregla-etiquetas
type: fix
title: The labels letter by letter
prompt: |
  The labeller should print one label for every bottle of 38 degrees or more, but it prints **one letter per line** and only for the first bottle. Run it, look at the output and fix it so it prints:

  ```
  Q-401 · 42°
  Q-403 · 41°
  ```
visual:
  figure:
    input: { label: batch, table: { head: ["code", "degrees"], rows: [["Q-401", "42"], ["Q-402", "37"], ["Q-403", "41"]] } }
    arrow: "only the ones at 38° or more"
    output: { label: prints, cells: ["Q-401 · 42°", "Q-403 · 41°"] }
starter: |
  def labels(bottles, min_degrees):
      for code, degrees in bottles:
          if degrees >= min_degrees:
              return f"{code} · {degrees}°"


  batch = [("Q-401", 42), ("Q-402", 37), ("Q-403", 41)]
  for label in labels(batch, 38):
      print(label)
solution: |
  def labels(bottles, min_degrees):
      for code, degrees in bottles:
          if degrees >= min_degrees:
              yield f"{code} · {degrees}°"


  batch = [("Q-401", 42), ("Q-402", 37), ("Q-403", 41)]
  for label in labels(batch, 38):
      print(label)
hints:
  - "`return` ends the function at the first bottle and returns a string. A `for` over a string walks its letters."
  - "To hand over one label per bottle and carry on with the next one, change `return` to `yield`."
tests:
  - name: prints both labels
    output: "Q-401 · 42°\nQ-403 · 41°"
  - name: labels is a generator
    source: '\byield\b'
  - name: works with another batch
    run: 'list(labels([("A-150", 40), ("A-151", 39), ("I-210", 36)], 39))'
    equals: ["A-150 · 40°", "A-151 · 39°"]
```

```exercise
id: py14-escribe-precintos
type: write
title: Seals forever
prompt: |
  Write the infinite generator `seals(prefix, start=1)`, which hands over `"MOQ-0001"`, `"MOQ-0002"`… without stopping: the prefix, a hyphen and the number with 4 digits (`f"{number:04d}"`).

  Every bottle that leaves El Tinajón carries a Denomination of Origin seal with a sequential number. Nobody knows how many bottles will go out during the harvest, so the machine must have no end: whoever uses it will take as many as they need with `islice`.
visual:
  figure:
    input: { label: "seals(\"MOQ\", 998)", text: "an endless generator" }
    arrow: "islice(..., 4)"
    output: { label: "list(...)", cells: ["MOQ-0998", "MOQ-0999", "MOQ-1000", "MOQ-1001"] }
starter: |
  from itertools import count, islice


  def seals(prefix, start=1):
      pass


  print(list(islice(seals("MOQ"), 3)))
solution: |
  from itertools import count, islice


  def seals(prefix, start=1):
      for number in count(start):
          yield f"{prefix}-{number:04d}"


  print(list(islice(seals("MOQ"), 3)))
hints:
  - "`for number in count(start):` is a loop that never ends, and that's fine: the `yield` pauses it on every pass."
  - "With 4 digits: `f\"{prefix}-{number:04d}\"`."
tests:
  - name: the first three
    run: list(islice(seals("MOQ"), 3))
    equals: ["MOQ-0001", "MOQ-0002", "MOQ-0003"]
  - name: from another start, going past 999
    run: list(islice(seals("MOQ", 998), 4))
    equals: ["MOQ-0998", "MOQ-0999", "MOQ-1000", "MOQ-1001"]
  - name: never runs out
    expect: 'list(islice(seals("ILO"), 5000))[-1] == "ILO-5000"'
  - name: is a generator
    expect: 'next(seals("Q", 7)) == "Q-0007"'
  - name: uses yield
    source: '\byield\b'
```

```exercise
id: py14-escribe-turnos
type: write
title: The three shifts' report
prompt: |
  Complete the pipeline that adds up the liters of the jars across the three shifts:

  - `lines_of(shifts)`: a generator that hands over all the lines of all the shifts, in order, with `yield from`.
  - `readings(shifts)`: a generator that walks `lines_of(shifts)`, splits each line into jar and liters, **skips** the ones that say `---` (the sensor didn't read) and hands over `(jar, liters)` with the liters as an `int`.
  - `total_liters(shifts)`: the sum of the liters, with `sum` and a generator expression over `readings(shifts)`.

  Each cellar shift writes its readings down in a separate list, like `"T-12 340"`.
visual:
  figure:
    input: { label: shifts, table: { head: ["morning", "afternoon", "night"], rows: [["T-12 340", "T-07 ---", "T-12 280"], ["T-07 150", "T-03 410", ""]] } }
    arrow: "lines_of → readings → sum"
    output: { label: "total_liters(shifts)", value: "1180" }
starter: |
  def lines_of(shifts):
      pass


  def readings(shifts):
      pass


  def total_liters(shifts):
      return 0


  shifts = [["T-12 340", "T-07 150"], ["T-07 ---", "T-03 410"], ["T-12 280"]]
  print(total_liters(shifts))
solution: |
  def lines_of(shifts):
      for shift in shifts:
          yield from shift


  def readings(shifts):
      for line in lines_of(shifts):
          jar, liters = line.split()
          if liters != "---":
              yield jar, int(liters)


  def total_liters(shifts):
      return sum(liters for _, liters in readings(shifts))


  shifts = [["T-12 340", "T-07 150"], ["T-07 ---", "T-03 410"], ["T-12 280"]]
  print(total_liters(shifts))
hints:
  - "`lines_of` is a `for shift in shifts:` with `yield from shift` inside. `readings` walks `lines_of(shifts)` and uses `line.split()`."
  - "`sum(liters for _, liters in readings(shifts))` unpacks each tuple and adds up only the liters."
tests:
  - name: the example in the drawing
    run: total_liters([["T-12 340", "T-07 150"], ["T-07 ---", "T-03 410"], ["T-12 280"]])
    equals: 1180
  - name: lines_of joins the shifts in order
    run: 'list(lines_of([["a"], [], ["b", "c"]]))'
    equals: ["a", "b", "c"]
  - name: readings skips the ones the sensor didn't read
    run: 'list(readings([["T-01 ---", "T-02 90"], ["T-03 ---"]]))'
    equals: [["T-02", 90]]
  - name: no shifts
    run: total_liters([])
    equals: 0
  - name: uses yield from
    source: '\byield\s+from\b'
  - name: adds up with a generator expression
    source: 'sum\(\s*\w+\s+for\b'
    msg: "Add up with sum(... for ... in readings(shifts)), without building a list."
```

```exercise
id: py14-predice-itertools
type: predict
title: The belt's batches
prompt: |
  Quilla sums up a short belt with `itertools`. What does it print?
visual:
  figure:
    panes:
      - { label: belt, cells: ["Q", "Q", "I", "Q"] }
code: |
  from itertools import accumulate, groupby, pairwise
  belt = ["Q", "Q", "I", "Q"]
  print([variety for variety, _ in groupby(belt)])
  print(list(accumulate([3, 1, 2])))
  print(len(list(pairwise(belt))))
options:
  - "['Q', 'I', 'Q']\n[3, 4, 6]\n3"
  - "['Q', 'I']\n[3, 4, 6]\n3"
  - "['Q', 'I', 'Q']\n[3, 1, 2]\n2"
  - "['Q', 'I', 'Q']\n[3, 4, 6]\n2"
answer: "['Q', 'I', 'Q']\n[3, 4, 6]\n3"
explain: |
  `groupby` only groups equal values **in a row**: the `Q` at the end is another batch, so it comes out twice. `accumulate` gives the running totals: 3, 3+1, 3+1+2. And `pairwise` over 4 values gives 3 pairs: `(Q, Q)`, `(Q, I)`, `(I, Q)`.
```

## The case

```exercise
id: py14-caso-botella
type: case
title: The bottle that never came out
prompt: |
  **Count, for each variety, how many filled bottles really came out at the end of the belt, compare it with what its robot reported and find the bottle that went in and never came out.**

  At the end of the shift, the filler's reader logged 25 bottles and the exit's reader, one fewer. Each variety has its robot in charge, and each one swore all of theirs came out. The night shift's script didn't help: it said that **none had come out** of italia or acholado. This was it:

  ```py
  exits = read_log(exit_log)
  for variety in keepers:
      came_out = [code for code, v in exits if v == variety]
  ```

  The first pass used up the `exits` generator, and the other two found it empty. Watch out too: the exit reader sometimes reads the same bottle twice.

  Print one line per robot that starts with its name, for example `print("Chala:", came_out)`, and the board will tell you whether it adds up.
visual:
  board:
    for: py14-caso-botella
    task: "Bottles that came out = the filled ones whose code shows up in the exit log (without counting a repeated reading twice)."
    cards:
      - name: Chala
        kind: robot
        role: In charge of the quebranta
        rows: [["Filled", "10 bottles"], ["Said", "\"they all came out\""], ["Reported", "10"]]
        clue: { find: "Chala", says: 10 }
      - name: Uvina
        kind: robot
        role: In charge of the italia
        rows: [["Filled", "7 bottles"], ["Said", "\"not one stayed behind\""], ["Reported", "7"]]
        clue: { find: "Uvina", says: 7 }
      - name: Mosto
        kind: robot
        role: In charge of the acholado
        culprit: true
        rows: [["Filled", "8 bottles"], ["Said", "\"I saw them all go out\""], ["Reported", "8"]]
        clue: { find: "Mosto", says: 8 }
      - name: The night shift
        kind: note
        role: The script that reused the generator
        rows: [["quebranta", "10"], ["italia", "0"], ["acholado", "0"]]
globals:
  filling_log: ["Q-401 quebranta", "Q-402 quebranta", "I-210 italia", "Q-403 quebranta", "A-150 acholado", "A-151 acholado", "I-211 italia", "Q-404 quebranta", "Q-405 quebranta", "A-152 acholado", "I-212 italia", "I-213 italia", "Q-406 quebranta", "A-153 acholado", "A-154 acholado", "Q-407 quebranta", "I-214 italia", "A-155 acholado", "Q-408 quebranta", "I-215 italia", "A-156 acholado", "Q-409 quebranta", "A-157 acholado", "I-216 italia", "Q-410 quebranta"]
  exit_log: ["Q-401 quebranta", "Q-402 quebranta", "I-210 italia", "Q-403 quebranta", "A-150 acholado", "A-151 acholado", "I-211 italia", "Q-404 quebranta", "Q-405 quebranta", "Q-405 quebranta", "A-152 acholado", "I-212 italia", "I-213 italia", "Q-406 quebranta", "A-153 acholado", "Q-407 quebranta", "I-214 italia", "A-155 acholado", "Q-408 quebranta", "I-215 italia", "A-156 acholado", "Q-409 quebranta", "A-157 acholado", "I-216 italia", "Q-410 quebranta"]
  keepers: { quebranta: Chala, italia: Uvina, acholado: Mosto }
starter: |
  # filling_log and exit_log already exist: lists of lines like "Q-401 quebranta"
  # keepers: {"quebranta": "Chala", "italia": "Uvina", "acholado": "Mosto"}

  def read_log(log):
      for line in log:
          code, variety = line.split()
          yield code, variety


  filled = read_log(filling_log)
  exits = read_log(exit_log)

  # TODO: walk exits ONCE and keep their codes in a set.
  # Then walk filled: count per variety the ones that came out
  # and write down the ones that didn't. Print one line per robot:
  # print("Chala:", came_out)
solution: |
  def read_log(log):
      for line in log:
          code, variety = line.split()
          yield code, variety


  filled = read_log(filling_log)
  exits = read_log(exit_log)

  out_codes = {code for code, _ in exits}
  per_variety = {}
  never_out = []
  for code, variety in filled:
      if code in out_codes:
          per_variety[variety] = per_variety.get(variety, 0) + 1
      else:
          never_out.append(code)

  for variety, keeper in keepers.items():
      print(f"{keeper}: {per_variety.get(variety, 0)}")
  print("Never came out:", never_out)
answer: A-154
answerLabel: Which bottle got on the belt and never came out?
reveal: |
  A-154, an acholado. 10 quebranta and 7 italia came out, as Chala and Uvina said, but only 7 of 8 acholado: Mosto reported 8 without looking. If you count the exit's **lines** instead of the codes, Q-405 (read twice) gives you 11 quebranta: the set gets rid of it. And the night shift saw 0 for italia and acholado because it walked the same generator three times: after the first pass it had nothing left to hand over.
hints:
  - "Use up `exits` just once: `out_codes = {code for code, _ in exits}`. A set already ignores the repeated Q-405."
  - "Then, in `for code, variety in filled:`, ask `code in out_codes` and count with a dictionary per variety; whatever isn't there, write it down separately."
```

## The judge

As since session 4, the judge calls a function and compares what it **returns**. A generator isn't a value that can be compared, so in these problems the judged function **consumes** your generator and returns a list: that part is already written in the starting code.

```exercise
id: py14-juez-ventanas
type: judge
mode: function
function: moving_sums
title: The labeller's jams
prompt: |
  **Write the generator `windows(readings, k)`, which hands over the sum of every stretch of `k` minutes in a row, from the first to the last.**

  The labeller's counter writes down how many bottles went through in each minute. Herminia wants to see the stretches of `k` minutes: if a stretch adds up to little, there was a jam there. The first stretch is minutes 1 to `k`, the second minutes 2 to `k + 1`, and so on until the stretch reaches the last minute. If there are fewer than `k` minutes, there's no stretch at all.

  `moving_sums(readings, k)` is already written: it returns `list(windows(readings, k))`, and it's the one the judge calls.

  **Constraints:** 0 ≤ `len(readings)` ≤ 60 · 1 ≤ `k` ≤ 12 · each reading between 0 and 40.
starter: |
  def windows(readings, k):
      yield 0


  def moving_sums(readings, k):
      return list(windows(readings, k))
solution: |
  def windows(readings, k):
      total = 0
      for i, bottles in enumerate(readings):
          total += bottles
          if i >= k:
              total -= readings[i - k]
          if i >= k - 1:
              yield total


  def moving_sums(readings, k):
      return list(windows(readings, k))
hints:
  - "The most direct way: `for start in range(len(readings) - k + 1): yield sum(readings[start:start + k])`. Count how many stretches there are with 5 minutes and `k = 3`: it's 3, not 2."
  - "Without adding everything up again: keep a `total` that adds the minute coming in and subtracts the one going out (`readings[i - k]`), and hand it over once `i >= k - 1`."
visual:
  figure:
    title: Example 1, stretch by stretch
    panes:
      - { label: "readings, k = 3", cells: [12, 15, 3, 0, 14, 16], highlight: [2, 3] }
      - { label: stretches, table: { head: ["minutes", "sum"], rows: [["1–3", "12 + 15 + 3 = 30"], ["2–4", "15 + 3 + 0 = 18"], ["3–5", "3 + 0 + 14 = 17"], ["4–6", "0 + 14 + 16 = 30"]] } }
      - { label: returns, value: "[30, 18, 17, 30]" }
    caption: "Six minutes give **four** stretches of 3: `len(readings) - k + 1`. Minutes 3 and 4 were the jam."
samples:
  - args: [[12, 15, 3, 0, 14, 16], 3]
    returns: [30, 18, 17, 30]
    note: The drawing above.
  - args: [[8, 9], 3]
    returns: []
    note: Two minutes aren't enough for a stretch of three.
edge:
  - args: [[], 1]
    tag: with no readings
  - args: [[7], 1]
    tag: with a single minute and stretches of one
  - args: [[5, 6, 7], 3]
    tag: when the stretch is the whole shift
  - args: [[4, 0, 9, 2], 1]
    tag: with one-minute stretches
  - args: [[0, 0, 0, 0, 0], 2]
    tag: with the belt stopped the whole time
  - args: [[3, 1, 4, 1], 5]
    tag: when k is bigger than the shift
random:
  count: 40
  seed: 1414
  generate: |
    n = rng.int(0, 60)
    k = rng.int(1, 12)
    return [rng.list(n, 0, 40), k]
wrong:
  - |
    def windows(readings, k):
        for start in range(len(readings) - k):
            yield sum(readings[start:start + k])


    def moving_sums(readings, k):
        return list(windows(readings, k))
  - |
    def windows(readings, k):
        total = 0
        for i, bottles in enumerate(readings):
            total += bottles
            if i >= k:
                total -= readings[i - k]
            yield total


    def moving_sums(readings, k):
        return list(windows(readings, k))
  - |
    def windows(readings, k):
        total = 0
        for i, bottles in enumerate(readings):
            total += bottles
            if i > k:
                total -= readings[i - k]
            if i >= k - 1:
                yield total


    def moving_sums(readings, k):
        return list(windows(readings, k))
```

```exercise
id: py14-juez-intercalar
type: judge
mode: function
function: merge_lines
title: Two fillers, one belt
prompt: |
  **Write the generator `interleave(line_a, line_b)`, which receives two generators and hands over their bottles alternately: one from A, one from B, one from A… When one runs out, it carries on with everything the other has left.**

  During the harvest, El Tinajón turns on both its fillers and both empty onto the same belt, which takes from them in turns. No bottle can be left in a filler: if A is already done, the belt keeps taking from B until it's empty.

  Watch out: `line_a` and `line_b` are **generators**, not lists. They have no `len` and no positions; you can only ask them for the next one with `next(line, None)`, which gives `None` when there's nothing left (no bottle is `None`).

  `merge_lines(a, b)` is already written: it turns the two lists into generators, calls your `interleave` and returns the list of what it handed over.

  **Constraints:** each line brings 0 to 15 bottles.
starter: |
  def interleave(line_a, line_b):
      yield from line_a


  def merge_lines(a, b):
      return list(interleave((bottle for bottle in a), (bottle for bottle in b)))
solution: |
  def interleave(line_a, line_b):
      while True:
          bottle_a = next(line_a, None)
          bottle_b = next(line_b, None)
          if bottle_a is None and bottle_b is None:
              return
          if bottle_a is not None:
              yield bottle_a
          if bottle_b is not None:
              yield bottle_b


  def merge_lines(a, b):
      return list(interleave((bottle for bottle in a), (bottle for bottle in b)))
hints:
  - "In a `while True`, ask each line for a bottle with `next(line_a, None)` and `next(line_b, None)`. Hand over whichever isn't `None`."
  - "When both give `None`, there's nothing left: `return` ends the generator. Don't use `zip`: it stops at the shorter line and leaves bottles in the other."
visual:
  figure:
    title: Example 1, in turns
    panes:
      - { label: line_a, cells: ["A-1", "A-2", "A-3", "A-4"] }
      - { label: line_b, cells: ["B-1", "B-2"] }
      - { label: belt, cells: ["A-1", "B-1", "A-2", "B-2", "A-3", "A-4"], highlight: [4, 5] }
    caption: "B ran out after `B-2`; `A-3` and `A-4` still get on the belt, one after the other."
samples:
  - args: [["A-1", "A-2", "A-3", "A-4"], ["B-1", "B-2"]]
    returns: ["A-1", "B-1", "A-2", "B-2", "A-3", "A-4"]
    note: The drawing above.
  - args: [["A-1"], ["B-1", "B-2", "B-3"]]
    returns: ["A-1", "B-1", "B-2", "B-3"]
    note: Now the one with bottles left over is B.
edge:
  - args: [[], []]
    tag: with both fillers empty
  - args: [[], ["B-1", "B-2"]]
    tag: when A filled nothing
  - args: [["A-1", "A-2"], []]
    tag: when B filled nothing
  - args: [["A-1", "A-2", "A-3"], ["B-1", "B-2", "B-3"]]
    tag: with both the same length
  - args: [["A-1"], ["B-1"]]
    tag: with one bottle in each
random:
  count: 40
  seed: 1415
  generate: |
    a = [f"A-{i}" for i in range(1, rng.int(0, 15) + 1)]
    b = [f"B-{i}" for i in range(1, rng.int(0, 15) + 1)]
    return [a, b]
wrong:
  - |
    def interleave(line_a, line_b):
        for bottle_a, bottle_b in zip(line_a, line_b):
            yield bottle_a
            yield bottle_b


    def merge_lines(a, b):
        return list(interleave((bottle for bottle in a), (bottle for bottle in b)))
  - |
    def interleave(line_a, line_b):
        for bottle_a in line_a:
            yield bottle_a
            bottle_b = next(line_b, None)
            if bottle_b is not None:
                yield bottle_b


    def merge_lines(a, b):
        return list(interleave((bottle for bottle in a), (bottle for bottle in b)))
  - |
    def interleave(line_a, line_b):
        while True:
            bottle_a = next(line_a, None)
            bottle_b = next(line_b, None)
            if bottle_a is None or bottle_b is None:
                return
            yield bottle_a
            yield bottle_b


    def merge_lines(a, b):
        return list(interleave((bottle for bottle in a), (bottle for bottle in b)))
  - |
    def interleave(line_a, line_b):
        yield from line_a
        yield from line_b


    def merge_lines(a, b):
        return list(interleave((bottle for bottle in a), (bottle for bottle in b)))
```

## Final mission

```exercise
id: py14-mision-cava
type: mission
title: The cellar route
prompt: |
  **Write the generator `steps(route)`, which turns Herminia's route into single steps, and make Quilla consume them one by one: face that heading, move forward one tile and collect. At the end, in the dispatch room (D), report the total just once.**

  After the harvest there are bottles lying around the cellar. Herminia dictates the route to Quilla in legs, like `"E3 S2 E3 S2"`: three tiles east, two south, and so on (`N`, `E`, `S`, `W`). `steps("E3 S2")` must hand over `"E"`, `"E"`, `"E"`, `"S"`, `"S"`, one for each tile.

  - For each leg of `route.split()`, the heading is `leg[0]` and the tiles are `int(leg[1:])`.
  - `face(heading)` is already written: it turns until it faces that heading.
  - Walk `for heading in steps(route):` and on each step `face`, `robot.forward()` and add up `robot.collect()`.

  Quilla carries **just enough battery**, and it's tested in three cellars with different routes. When it passes, together with the judges, session 15 unlocks.
starter: |
  def face(heading):
      """Turns right until it faces heading: "N", "E", "S" or "W"."""
      while robot.direction != heading:
          robot.turn_right()


  def steps(route):
      """Hands over one heading per tile of the route: "E2 S1" → "E", "E", "S"."""
      pass


  # route already exists, for example "E3 S2 E3 S2"
  total = 0

  robot.report(total)
solution: |
  def face(heading):
      """Turns right until it faces heading: "N", "E", "S" or "W"."""
      while robot.direction != heading:
          robot.turn_right()


  def steps(route):
      """Hands over one heading per tile of the route: "E2 S1" → "E", "E", "S"."""
      for leg in route.split():
          heading = leg[0]
          for _ in range(int(leg[1:])):
              yield heading


  total = 0
  for heading in steps(route):
      face(heading)
      robot.forward()
      total += robot.collect()

  robot.report(total)
hints:
  - "In `steps`, a `for leg in route.split():` and, inside it, another `for` that repeats `yield heading` as many times as `int(leg[1:])` says."
  - "Outside, `for heading in steps(route):` asks for one step at a time. `robot.collect()` returns 0 on an empty tile, so you can collect on every one."
globals:
  route: "E3 S2 E3 S2"
world:
  theme: mina
  level: 3
  dir: E
  battery: 10
  map: |
    ##########
    #R.2.#####
    ####1#####
    ####.3..##
    #######2##
    #######D##
    ##########
scenarios:
  - {}
  - globals: { route: "W5 S2 E5 S2" }
    world: { battery: 14, dir: N }
    map: |
      #########
      #.....R.#
      #.#######
      #.4..1..#
      ######3.#
      ######D.#
      #########
  - globals: { route: "W4 N2 E5 N2 W5" }
    world: { battery: 18, dir: W }
    map: |
      ########
      #D.....#
      ######.#
      #.5..2.#
      #.######
      #.1..R.#
      ########
tests:
  - name: steps hands over one heading per tile
    expect: 'list(steps("E2 S1 W3")) == ["E", "E", "S", "W", "W", "W"]'
    msg: 'steps("E2 S1 W3") must hand over E, E, S, W, W, W.'
  - name: steps is a generator
    source: '\byield\b'
  - name: Quilla consumes the steps one at a time
    source: 'for\s+\w+\s+in\s+steps\('
  - name: no bottles left in the cellar
    state: w.crystals_left == 0
    msg: Some bottles were left. Do you collect on every tile along the way?
  - name: ends at dispatch
    state: w.at_goal
    msg: Quilla didn't end on the D. Does steps hand over every tile of each leg?
  - name: reports the exact total, once
    state: w.reports == [w.crystals_total]
  - name: Quilla doesn't crash or run out of battery
    state: not w.crashed
```

## Expert challenge

```exercise
id: py14-reto-tandas
type: challenge
title: Your own batched
visual:
  figure:
    title: Three at a time, without looking at the end
    input: { label: "in_batches(count(1), 3)", text: "1, 2, 3, 4, 5, 6, 7, …" }
    arrow: "islice(..., 2)"
    output: { label: returns, cells: ["(1, 2, 3)", "(4, 5, 6)"] }
prompt: |
  **Write the generator `in_batches(iterable, n)`, which hands over tuples of `n` elements in order; the last one may be shorter and an empty tuple never comes out.** For people who already code.

  It's what `itertools.batched` does, but here you can't use it. El Tinajón's boxes hold `n` bottles, and the belt never ends: your generator must work with an **infinite** iterable and not ask for a single element more than it needs for the batch it's handing over. It takes any iterable (a list, a string, another generator), not just lists.
starter: |
  from itertools import count, islice


  def in_batches(iterable, n):
      pass


  print(list(in_batches("QQIAQ", 2)))
solution: |
  from itertools import count, islice


  def in_batches(iterable, n):
      iterator = iter(iterable)
      while batch := tuple(islice(iterator, n)):
          yield batch


  print(list(in_batches("QQIAQ", 2)))
hints:
  - "Get a single iterator with `iter(iterable)` and ask it for `islice(iterator, n)` on every pass: since it's the same iterator, each `islice` carries on where the previous one stopped."
  - "When the tuple comes out empty, it's over: `while batch := tuple(islice(iterator, n)):`."
tests:
  - name: a string two at a time
    run: list(in_batches("QQIAQ", 2))
    equals: [["Q", "Q"], ["I", "A"], ["Q"]]
  - name: exact, with no empty tuple at the end
    run: list(in_batches([1, 2, 3, 4], 2))
    equals: [[1, 2], [3, 4]]
  - name: hands over tuples
    expect: 'next(in_batches([1, 2, 3], 2)) == (1, 2)'
  - name: nothing to pack
    run: list(in_batches([], 3))
    equals: []
  - name: works with an infinite belt
    run: list(islice(in_batches(count(1), 3), 2))
    equals: [[1, 2, 3], [4, 5, 6]]
  - name: doesn't ask for more than it needs
    run: 'next(in_batches((bottle if bottle else 1 / 0 for bottle in [7, 8, 9, 0]), 3))'
    equals: [7, 8, 9]
    msg: For the first batch you should only ask for 3 elements; the fourth one breaks the belt.
  - name: without itertools.batched
    sourceNot: '\bbatched\b'
```
