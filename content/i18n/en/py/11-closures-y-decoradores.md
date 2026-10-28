# Session 11 — First-class functions, closures and decorators

## The job

Ayacucho, the Santa Ana neighbourhood, three weeks before Holy Week. In master **Teodora Huamaní**'s workshop they make retablos: cedar-wood boxes with two or three floors, and inside, little heads of potato paste and plaster, modelled one by one, dried on the shelf and painted by hand. Teodora pays per little head, so each artisan keeps their own count on a tablet.

The trouble came with the first fortnight: the counts don't add up, the hygrometer in the drying room sometimes gives no reading and nobody knows who checked the gallery at night. Maru sent Quilla, with its siren, to sort all that out. Today Quilla learns that a function is also a **value**: you can store it, pass it, return it, it **remembers** things between calls and it can wrap another function to keep an eye on it.

```scene
theme: museo
level: 2
dir: E
caption: The gallery of Teodora's workshop, at night. Quilla sounds the siren where something moves and closes the door that was left open.
map: |
  ###########
  #R........#
  ###P###O#P#
  ###m###.#.#
  ###########
program: |
  robot.forward(2)
  if robot.sensor()["motion"]:
      robot.alarm()
  robot.forward(4)
  if robot.sensor()["door"] == "open":
      robot.close_door()
  robot.forward(2)
```

## The minimum

In Python a function is a value like any other: a name that points to it. Without parentheses you **don't call it**, you name it; that way you can store it in a variable, in a list, or hand it to another function.

```py run
def sand(figure):
    return f"{figure} sanded"

task = sand                       # no (): the function itself
print(task("bull"))
print([step("llama") for step in [sand, str.upper]])
```

A function can **create another function and return it**. The inner one takes along the variables of the place where it was born and keeps using them even after the outer one has finished: that's a **closure**. To **reassign** one of those variables from inside, declare it with `nonlocal`.

```anim
title: Each call to the factory creates its own count
code: |
  def make_counter():
      count = 0
      def add_one():
          nonlocal count
          count += 1
          return count
      return add_one

  tally = make_counter()
  tally()
  print(tally())
  other = make_counter()
  print(other())
show: [count]
notes:
  2: "A new count is born, at 0, inside this call."
  9: "make_counter has finished, but add_one took its count along."
  5: "nonlocal: the count that changes is make_counter's, not a new one."
  12: "Another call to the factory, another count: it starts at 0."
```

And the same movie, drawing **where everything lives**:

```scope
title: Each call to the factory opens its own room
speed: 3600
steps:
  - note: "At the start only the global room exists. It holds the factory `make_counter`: the recipe, with no `count` yet."
    rooms:
      - { id: g, name: global, fns: [{ name: make_counter }] }
  - note: "`tally = make_counter()` opens a new room for this call. `count = 0` is born there."
    rooms:
      - id: g
        name: global
        fns: [{ name: make_counter }]
        rooms:
          - { id: c1, name: "make_counter(), call 1", on: true, vars: { count: 0 } }
  - note: "`add_one` is born inside. It keeps a rope tied to the room where it was born (the arrow): its `count` is there."
    rooms:
      - id: g
        name: global
        fns: [{ name: make_counter }]
        rooms:
          - { id: c1, name: "make_counter(), call 1", on: true, vars: { count: 0 }, fns: [{ name: add_one, env: c1 }] }
  - note: "The factory returns `add_one` and it is kept as `tally`. The call has finished, but `tally`'s rope keeps its room alive with its `count`. Without that rope the room would have been discarded."
    rooms:
      - id: g
        name: global
        fns: [{ name: make_counter }, { name: tally, env: c1 }]
        rooms:
          - { id: c1, name: "make_counter(), call 1", gone: true, vars: { count: 0 } }
  - note: "Each `tally()` raises the `count` of its room, even though the call to the factory has already finished. `nonlocal` is what lets `add_one` **reassign** it. After two calls it is 2."
    rooms:
      - id: g
        name: global
        fns: [{ name: make_counter }, { name: tally, env: c1 }]
        rooms:
          - { id: c1, name: "make_counter(), call 1", gone: true, on: true, vars: { count: 2 } }
  - note: "`other = make_counter()` opens **another** room, with another `count` and another function. `other()` raises its own to 1; `tally`'s stays at 2. They share nothing."
    rooms:
      - id: g
        name: global
        fns: [{ name: make_counter }, { name: tally, env: c1 }, { name: other, env: c2 }]
        rooms:
          - { id: c1, name: "make_counter(), call 1", gone: true, vars: { count: 2 } }
          - { id: c2, name: "make_counter(), call 2", gone: true, on: true, vars: { count: 1 } }
```

- **Factory**: a function that returns functions. Each call creates new variables, so each function it hands out has **its own memory**.
- **`nonlocal count`**: without that line, `count += 1` would create a local variable and Python would complain that you read it before giving it a value (`UnboundLocalError`). To **read** it, or to change a list from the inside (`.append`), you don't need it.
- **`lambda`**: a one-expression function with no name. `lambda x: x * factor` is handy for returning short functions from a factory.

```py run
def per_figure(rate):
    return lambda figures: figures * rate

paint = per_figure(2)
model = per_figure(3)
print(paint(10), model(10))
```

<!-- legacy: nonlocal -->

A **decorator** is a function that takes a function and returns another one that **wraps** it: it does something before or after and calls the original. `@logbook` on top of a `def` is the same as writing `carve = logbook(carve)` afterwards.

```anim
title: The wrapper calls the original
code: |
  def logbook(func):
      def wrapper(*args):
          print("Starting", func.__name__)
          result = func(*args)
          print("Done", func.__name__)
          return result
      return wrapper

  @logbook
  def carve(figures):
      return figures * 4

  minutes = carve(5)
  print(minutes)
notes:
  13: "carve isn't the original anymore: it's the wrapper that logbook returned."
  4: "The wrapper calls the original carve, which it kept in func."
  6: "If the wrapper didn't return result, minutes would end up as None."
```

The trick is in the labels: before decorating, `carve` points to the original function; afterwards, it points to the wrapper, which keeps the original in `func`.

```anim
title: "@logbook moves the label of carve"
code: |
  def carve(figures):
      return figures * 4

  carve = logbook(carve)
refs: all
steps:
  - line: 1
    vars: {}
    refs: { carve: { r: f1 } }
    heap: { f1: { k: val, p: "function carve (the original)" } }
    note: "`def carve` sticks the label `carve` onto a function."
  - line: 4
    vars: {}
    refs: { carve: { r: f2 } }
    heap:
      f1: { k: val, p: "function carve (the original)" }
      f2: { k: obj, cls: wrapper, items: [[func, { r: f1 }]] }
    note: "`logbook(carve)` returns a **wrapper** that keeps the original in `func`. The label `carve` moves to the wrapper. `@logbook` above the `def` is exactly this line."
  - line: 4
    vars: {}
    refs: { carve: { r: f2 } }
    heap:
      f1: { k: val, p: "function carve (the original)" }
      f2: { k: obj, cls: wrapper, items: [[func, { r: f1 }]] }
    out: "Starting carve\nDone carve"
    note: "When you call `carve(5)` you enter the wrapper without knowing it: it prints \"Starting\", calls the original through `func` and prints \"Done\"."
```

- **`*args, **kwargs`** in the wrapper gather any arguments, and `func(*args, **kwargs)` passes them on as they are: that way the decorator works for any function.
- **`@functools.wraps(func)`** on top of the wrapper copies the original's name and docstring onto it. Without it, all your decorated functions are called `wrapper`.
- **Decorator with arguments**: `@repeat(3)` first calls `repeat(3)`, which **returns** the decorator. That's three functions, one inside the other:

```py
def repeat(times):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            return [func(*args, **kwargs) for _ in range(times)]
        return wrapper
    return decorator
```

Look at the three layers of `@repeat(3)` in the order Python runs them:

```anim
title: "@repeat(3) is three layers, in order"
code: |
  @repeat(3)
  def carve(figures):
      return figures * 4
refs: all
steps:
  - line: 1
    vars: {}
    refs: { "repeat(3)": { r: d1 } }
    heap: { d1: { k: obj, cls: decorator, items: [[times, { p: "3" }]] } }
    note: "First Python calls `repeat(3)`. That call **returns** the decorator, which remembers `times = 3`."
  - line: 1
    vars: {}
    refs: { "repeat(3)": { r: d1 }, "decorator(carve)": { r: w1 } }
    heap:
      d1: { k: obj, cls: decorator, items: [[times, { p: "3" }]] }
      f1: { k: val, p: "function carve (the original)" }
      w1: { k: obj, cls: wrapper, items: [[func, { r: f1 }], [times, { p: "3" }]] }
    note: "Then it calls that decorator with the function below: `decorator(carve)`. It returns the **wrapper**, which keeps the original and the 3."
  - line: 2
    vars: {}
    refs: { carve: { r: w1 } }
    heap:
      f1: { k: val, p: "function carve (the original)" }
      w1: { k: obj, cls: wrapper, items: [[func, { r: f1 }], [times, { p: "3" }]] }
    note: "Finally the label `carve` is stuck on the wrapper. Each layer has a single job: `repeat` remembers the 3, `decorator` receives the function, `wrapper` calls it three times."
```

<!-- legacy: functools-wraps -->

`functools` brings two ready-made tools. **`partial`** fixes some of a function's arguments and gives you a shorter one; **`@cache`** keeps each result by its arguments and doesn't compute it again.

```py run
import functools

@functools.cache
def drying(figures):
    print("calculating", figures)
    return figures * 2 + 6

dry_ten = functools.partial(drying, 10)
print(dry_ten(), dry_ten(), drying(3))
```

> **Common trap:** a `lambda` created in a loop doesn't keep the variable's value at that moment, but **the variable**. When you finally call it, the loop is over and they all see the last value. If you need each round's value, pass it as a default value: `lambda t=thickness: t * 10`, or use a factory.

<!-- legacy: functools-cache -->

<!-- mdn: nonlocal functools-wraps functools-cache -->

## Practice

```exercise
id: py11-predice-pinceles
type: predict
title: The three brushes
prompt: |
  Quilla gets three brushes ready, each with its own thickness. What does it print?
code: |
  brushes = []
  for thickness in [1, 2, 3]:
      brushes.append(lambda: thickness * 10)

  print([brush() for brush in brushes])
options:
  - "[10, 20, 30]"
  - "[30, 30, 30]"
  - "[10, 10, 10]"
  - "A NameError: thickness no longer exists"
answer: "[30, 30, 30]"
explain: |
  Each `lambda` remembers the **variable** `thickness`, not the number it had when it was created. When they're finally called, the loop is over and `thickness` is 3 for all three. With `lambda t=thickness: t * 10` each one keeps its own value, because the default value is computed when the function is created.
```

```exercise
id: py11-completa-caja-chica
type: complete
title: Each artisan's petty cash
prompt: |
  Teodora gives each artisan some petty cash for paint. `open_petty_cash(funds)` returns a function `spend(amount)`: if there's enough, it takes the amount off; if not, it does nothing. Either way it returns the balance. And `paint_cost` is a short function that says how many soles of paint a number of figures takes (2 per figure).

  Fill in the `___`.
starter: |
  def open_petty_cash(funds):
      """A petty cash box with its own balance."""
      balance = funds
      def spend(amount):
          ___ balance
          if amount <= balance:
              balance -= amount
          return balance
      return spend


  paint_cost = ___ figures: figures * 2

  teodora_cash = open_petty_cash(50)
  wilber_cash = open_petty_cash(20)
  print(teodora_cash(paint_cost(8)), wilber_cash(paint_cost(15)), teodora_cash(10))
solution: |
  def open_petty_cash(funds):
      """A petty cash box with its own balance."""
      balance = funds
      def spend(amount):
          nonlocal balance
          if amount <= balance:
              balance -= amount
          return balance
      return spend


  paint_cost = lambda figures: figures * 2

  teodora_cash = open_petty_cash(50)
  wilber_cash = open_petty_cash(20)
  print(teodora_cash(paint_cost(8)), wilber_cash(paint_cost(15)), teodora_cash(10))
hints:
  - "`spend` assigns to `balance`, which was born in `open_petty_cash`: you have to tell Python so with one word."
  - "A one-expression function with no name starts with `lambda`."
tests:
  - name: paint_cost(4) is 8 soles
    run: paint_cost(4)
    equals: 8
  - name: a cash box remembers what was spent and never overdraws
    run: '(lambda c: [c(5), c(30), c(10)])(open_petty_cash(20))'
    equals: [15, 15, 5]
  - name: each cash box has its own balance
    run: '(lambda a, b: [a(3), b(4), a(3)])(open_petty_cash(10), open_petty_cash(10))'
    equals: [7, 6, 4]
  - name: the console
    output: "34 20 24"
  - name: uses nonlocal
    source: '\bnonlocal\s+balance\b'
```

```exercise
id: py11-arregla-decorador-mudo
type: fix
title: The decorator that swallowed the price
prompt: |
  Wilber wrote `@announce` so that Quilla says out loud what it's calculating. Since then the quote for two retablos crashes. Run it, read the error and fix it.

  While you're at it, make `retablo_price.__name__` still say `"retablo_price"` (today it says `"wrapper"`) with `@functools.wraps`.
starter: |
  import functools


  def announce(func):
      def wrapper(*args, **kwargs):
          print("Quilla calculates:", func.__name__)
          func(*args, **kwargs)
      return wrapper


  @announce
  def retablo_price(floors, figures):
      """Soles: 120 per floor and 8 per figure."""
      return floors * 120 + figures * 8


  total = retablo_price(2, 15) + retablo_price(1, 6)
  print("Total:", total)
solution: |
  import functools


  def announce(func):
      @functools.wraps(func)
      def wrapper(*args, **kwargs):
          print("Quilla calculates:", func.__name__)
          return func(*args, **kwargs)
      return wrapper


  @announce
  def retablo_price(floors, figures):
      """Soles: 120 per floor and 8 per figure."""
      return floors * 120 + figures * 8


  total = retablo_price(2, 15) + retablo_price(1, 6)
  print("Total:", total)
hints:
  - "The wrapper calls the original, but what does it do with what the original returns? A function without `return` returns `None`."
  - "Put `@functools.wraps(func)` right on top of `def wrapper`."
tests:
  - name: retablo_price(2, 15) returns 360
    run: retablo_price(2, 15)
    equals: 360
  - name: the total is 528
    expect: total == 528
  - name: the console
    output: "Quilla calculates: retablo_price\nQuilla calculates: retablo_price\nTotal: 528"
  - name: keeps the name
    expect: retablo_price.__name__ == "retablo_price"
    msg: Use @functools.wraps(func) on the wrapper.
  - name: keeps the docstring
    expect: 'retablo_price.__doc__ == "Soles: 120 per floor and 8 per figure."'
```

```exercise
id: py11-escribe-contar-llamadas
type: write
title: How many times was it sanded?
prompt: |
  Write the decorator `count_calls(func)`: the decorated function does the same as before (takes the same arguments and returns the same thing), but keeps count of how many times it was called in the attribute `calls`.

  Functions are objects, so you can give them attributes: write `wrapper.calls = 0` before returning it and add 1 on every call. Use `@functools.wraps` so it keeps its name.
visual:
  figure:
    title: What you see from outside
    input: { label: calls, text: "sand(\"bull\")\nsand(\"llama\", minutes=8)" }
    arrow: "@count_calls"
    output: { label: afterwards, cards: [{ title: sand, rows: [["__name__", "\"sand\""], ["calls", "2"]] }] }
starter: |
  import functools


  def count_calls(func):
      pass


  @count_calls
  def sand(figure, minutes=5):
      return f"{figure} sanded in {minutes} min"


  print(sand("bull"))
  print(sand("llama", minutes=8))
  print(sand.calls)
solution: |
  import functools


  def count_calls(func):
      @functools.wraps(func)
      def wrapper(*args, **kwargs):
          wrapper.calls += 1
          return func(*args, **kwargs)
      wrapper.calls = 0
      return wrapper


  @count_calls
  def sand(figure, minutes=5):
      return f"{figure} sanded in {minutes} min"


  print(sand("bull"))
  print(sand("llama", minutes=8))
  print(sand.calls)
hints:
  - "Inside `count_calls`, define `wrapper(*args, **kwargs)`, give it `wrapper.calls = 0` and return it."
  - "On every call: `wrapper.calls += 1` and `return func(*args, **kwargs)`."
tests:
  - name: sand still returns the same
    run: 'sand("retablo", minutes=12)'
    equals: retablo sanded in 12 min
  - name: counts the calls
    run: '(lambda f: [f(2), f(3), f.calls])(count_calls(lambda x: x * x))'
    equals: [4, 9, 2]
  - name: each decorated function counts its own
    run: '(lambda a, b: [a(), a(), b(), a.calls, b.calls])(count_calls(lambda: 1), count_calls(lambda: 2))'
    equals: [1, 1, 2, 2, 1]
  - name: keeps the name
    expect: sand.__name__ == "sand"
  - name: the console
    output: "bull sanded in 5 min\nllama sanded in 8 min\n2"
```

```exercise
id: py11-completa-cotizador
type: complete
title: The slow-answering sawmill
prompt: |
  To make a quote, Quilla asks the sawmill on Mariscal Cáceres avenue for the price of the wood, and it takes a while to answer. `queries` counts how many times it asked.

  Fill in the `___`: make `wood_price` **never ask the same thing twice**, and make `quote_cedar` be `quote` with the wood already fixed to `"cedar"`. With the five orders, Quilla should ask only **twice**.
starter: |
  import functools

  queries = 0


  @functools.___
  def wood_price(wood):
      """Soles per floor, according to the sawmill."""
      global queries
      queries += 1
      return {"cedar": 30, "alder": 18, "pine": 12}[wood]


  def quote(wood, floors, figures):
      return floors * wood_price(wood) + figures * 5


  quote_cedar = functools.___(quote, "cedar")

  for floors, figures in [(2, 10), (3, 4), (1, 20), (2, 6)]:
      print(quote_cedar(floors, figures))
  print(quote("pine", 1, 3))
  print("Queries:", queries)
solution: |
  import functools

  queries = 0


  @functools.cache
  def wood_price(wood):
      """Soles per floor, according to the sawmill."""
      global queries
      queries += 1
      return {"cedar": 30, "alder": 18, "pine": 12}[wood]


  def quote(wood, floors, figures):
      return floors * wood_price(wood) + figures * 5


  quote_cedar = functools.partial(quote, "cedar")

  for floors, figures in [(2, 10), (3, 4), (1, 20), (2, 6)]:
      print(quote_cedar(floors, figures))
  print(quote("pine", 1, 3))
  print("Queries:", queries)
hints:
  - "The decorator that remembers results by argument is `functools.cache`."
  - "`functools.partial(quote, \"cedar\")` fixes the first argument."
tests:
  - name: only two queries to the sawmill
    expect: queries == 2
    msg: With @functools.cache, cedar is asked once and pine once.
  - name: quote_cedar(4, 0) is 120
    run: quote_cedar(4, 0)
    equals: 120
  - name: the console
    output: "110\n110\n130\n90\n27\nQueries: 2"
```

## The case

```exercise
id: py11-caso-contador
type: case
title: The shared counter
prompt: |
  **Write `make_counter()`, which returns a function `count(amount)` with its own memory, create one counter per artisan, feed it the shelf's log and compare each total with what each one charged.**

  The drying shelf has a camera that writes down who leaves each batch of little heads and how many there are. Teodora pays 1 sol per little head, and this fortnight four artisans handed in their counts. One charged too much; he says his tablet counted it by itself.

  `count(amount)` adds `amount` to **that counter's** count and returns the total so far. Print one line per artisan that starts with their name: `print("Teodora:", total)`. The board compares it with what they charged.
visual:
  board:
    for: py11-caso-contador
    task: "One counter per artisan: each batch on the shelf only adds to the counter of whoever left it. Compare with what they charged."
    cards:
      - name: Teodora
        kind: person
        role: The master
        rows: [["Counts in", "her notebook"], ["Charged", "15 little heads"]]
        clue: { find: "Teodora", says: 15, saysLabel: Charged }
      - name: Yolanda
        kind: person
        rows: [["Counts in", "her tablet"], ["Charged", "12 little heads"]]
        clue: { find: "Yolanda", says: 12, saysLabel: Charged }
      - name: Wilber
        kind: person
        role: The apprentice
        culprit: true
        rows: [["Counts in", "an app he made himself"], ["Charged", "38 little heads"]]
        clue: { find: "Wilber", says: 38, saysLabel: Charged }
      - name: Efraín
        kind: person
        rows: [["Counts in", "his tablet"], ["Charged", "12 little heads"]]
        clue: { find: "Efraín", says: 12, saysLabel: Charged }
      - name: The shelf
        kind: note
        role: Camera log
        rows: [["Batches", "20"], ["Little heads", "45 in total"]]
    caption: "If the four totals add up to 45, no counter got mixed up with another."
starter: |
  # Each batch that went onto the shelf: [artisan, little heads]
  shelf = [
      ["Teodora", 3], ["Yolanda", 2], ["Wilber", 1], ["Efraín", 4], ["Teodora", 2],
      ["Teodora", 3], ["Yolanda", 1], ["Efraín", 2], ["Wilber", 2], ["Teodora", 4],
      ["Yolanda", 3], ["Efraín", 1], ["Wilber", 1], ["Teodora", 2], ["Yolanda", 2],
      ["Efraín", 3], ["Wilber", 2], ["Teodora", 1], ["Yolanda", 4], ["Efraín", 2],
  ]
  artisans = ["Teodora", "Yolanda", "Wilber", "Efraín"]

  # TODO: write make_counter(): it returns count(amount), with its own count

  # TODO: one counter per artisan, for example in a dictionary
  # TODO: go through the shelf and keep each one's latest total
  # TODO: print("Teodora:", total) for each artisan
solution: |
  shelf = [
      ["Teodora", 3], ["Yolanda", 2], ["Wilber", 1], ["Efraín", 4], ["Teodora", 2],
      ["Teodora", 3], ["Yolanda", 1], ["Efraín", 2], ["Wilber", 2], ["Teodora", 4],
      ["Yolanda", 3], ["Efraín", 1], ["Wilber", 1], ["Teodora", 2], ["Yolanda", 2],
      ["Efraín", 3], ["Wilber", 2], ["Teodora", 1], ["Yolanda", 4], ["Efraín", 2],
  ]
  artisans = ["Teodora", "Yolanda", "Wilber", "Efraín"]


  def make_counter():
      total = 0
      def count(amount):
          nonlocal total
          total += amount
          return total
      return count


  counters = {name: make_counter() for name in artisans}
  totals = {name: 0 for name in artisans}
  for name, amount in shelf:
      totals[name] = counters[name](amount)

  for name in artisans:
      print(f"{name}:", totals[name])
answer: Wilber
answerLabel: Who charged too much?
reveal: |
  Wilber. He left four batches (1 + 2 + 1 + 2 = 6 little heads) and charged for 38. And 38 is exactly what **the whole shelf** had when he left his last batch: in his app, the count lived outside the factory, so all the counters shared a single one and added up everybody's. It wasn't bad faith, it was a closure that wasn't one.
hints:
  - "Inside `make_counter`: `total = 0`, and in `count`, `nonlocal total` before adding to it."
  - "`counters = {name: make_counter() for name in artisans}` creates one per artisan; then `counters[name](amount)` adds to the right one."
```

## The judge

As since session 4, the judge **calls your function** and compares what it returns. A function can't be compared, so these problems come with a function `try_out` already written: it uses what you build and returns numbers and text that the judge can compare. Don't change it.

```exercise
id: py11-juez-contador
type: judge
mode: function
function: try_out
title: The little-head moulds
prompt: |
  **Write `make_counter(start=0, step=1)`, which returns a function `count(times=1)` with its own count.**

  Each table in the workshop has a mould that turns out `step` little heads in one press, and it starts the day with `start` little heads left over from yesterday. `count(times)` presses the mould `times` times (adds `step × times`) and returns how many little heads that table has. With `times = 0` it adds nothing and just tells the total.

  `try_out(ops)` is already written. It takes a list of commands (they come in Spanish, as the judge's data):

  - `["nuevo", table, start, step]` or `["nuevo", table]` ("new") creates a counter for that table (if it already had one, it replaces it with a new one);
  - `["contar", table, times]` or `["contar", table]` ("count") uses it and notes down what it returns.

  It returns the list of what was noted down. Each table has to remember **only its own**.

  **Constraints:** up to 60 commands · up to 4 tables · `start` from 0 to 50 · `step` from 1 to 6 · `times` from 0 to 4. There's never a count on a table without a counter.
visual:
  figure:
    title: Example 1, command by command
    panes:
      - { table: { head: ["command", "Luz", "Abel", "noted"], rows: [["nuevo Luz 10 3", "10", "—", ""], ["contar Luz 2", "16", "—", "16"], ["nuevo Abel", "16", "0", ""], ["contar Abel", "16", "1", "1"], ["contar Luz 1", "19", "1", "19"], ["contar Abel 4", "19", "5", "5"]] } }
    caption: "Abel's count doesn't get mixed up with Luz's: each counter has its own."
starter: |
  def make_counter(start=0, step=1):
      pass


  def try_out(ops):
      """The judge calls this function. Don't change it."""
      counters = {}
      noted = []
      for command, table, *data in ops:
          if command == "nuevo":
              counters[table] = make_counter(*data)
          else:
              noted.append(counters[table](*data))
      return noted
solution: |
  def make_counter(start=0, step=1):
      """A little-head counter with its own count."""
      total = start

      def count(times=1):
          nonlocal total
          total += step * times
          return total

      return count


  def try_out(ops):
      """The judge calls this function. Don't change it."""
      counters = {}
      noted = []
      for command, table, *data in ops:
          if command == "nuevo":
              counters[table] = make_counter(*data)
          else:
              noted.append(counters[table](*data))
      return noted
hints:
  - "The count lives inside `make_counter`, starting at `start`; `count` changes it with `nonlocal`."
  - "If the count lived outside the factory, all the tables would share one. Try example 1 by hand."
samples:
  - args: [[["nuevo", "Luz", 10, 3], ["contar", "Luz", 2], ["nuevo", "Abel"], ["contar", "Abel"], ["contar", "Luz", 1], ["contar", "Abel", 4]]]
    returns: [16, 1, 19, 5]
    note: Luz starts at 10 and goes up 3 at a time; Abel uses the default values.
  - args: [[["nuevo", "Nilda", 0, 2], ["contar", "Nilda", 3], ["nuevo", "Nilda", 5, 1], ["contar", "Nilda", 0]]]
    returns: [6, 5]
    note: A new counter for the same table starts from scratch, and `times = 0` only reads.
edge:
  - args: [[]]
    tag: with no commands
  - args: [[["nuevo", "Luz", 7, 2]]]
    tag: with a counter that's never used
  - args: [[["nuevo", "Luz"], ["contar", "Luz", 0], ["contar", "Luz", 0]]]
    tag: counting zero times
  - args: [[["nuevo", "Luz", 0, 1], ["nuevo", "Abel", 0, 1], ["contar", "Luz", 1], ["contar", "Abel", 1], ["contar", "Luz", 1], ["contar", "Abel", 1]]]
    tag: with two identical tables taking turns
  - args: [[["nuevo", "Elmer", 50, 6], ["contar", "Elmer", 4], ["contar", "Elmer", 4], ["contar", "Elmer"]]]
    tag: with the highest start and step
  - args: [[["nuevo", "Nilda", 3, 2], ["contar", "Nilda", 2], ["nuevo", "Abel", 0, 5], ["nuevo", "Nilda", 3, 2], ["contar", "Nilda"], ["contar", "Abel", 1]]]
    tag: replacing a counter
random:
  count: 40
  seed: 1111
  generate: |
    tables = ["Luz", "Elmer", "Nilda", "Abel"][:rng.int(1, 4)]
    ops = []
    created = []
    for _ in range(rng.int(1, 60)):
        if not created or rng.next() < 0.15:
            table = rng.pick(tables)
            if rng.next() < 0.25:
                ops.append(["nuevo", table])
            else:
                ops.append(["nuevo", table, rng.int(0, 50), rng.int(1, 6)])
            if table not in created:
                created.append(table)
        else:
            table = rng.pick(created)
            if rng.next() < 0.25:
                ops.append(["contar", table])
            else:
                ops.append(["contar", table, rng.int(0, 4)])
    return [ops]
wrong:
  - |
    total = 0
    def make_counter(start=0, step=1):
        global total
        total = start
        def count(times=1):
            global total
            total += step * times
            return total
        return count
    def try_out(ops):
        counters, noted = {}, []
        for command, table, *data in ops:
            if command == "nuevo":
                counters[table] = make_counter(*data)
            else:
                noted.append(counters[table](*data))
        return noted
  - |
    def make_counter(start=0, step=1):
        total = start
        def count(times=1):
            nonlocal total
            total += step
            return total
        return count
    def try_out(ops):
        counters, noted = {}, []
        for command, table, *data in ops:
            if command == "nuevo":
                counters[table] = make_counter(*data)
            else:
                noted.append(counters[table](*data))
        return noted
```

```exercise
id: py11-juez-reintentar
type: judge
mode: function
function: try_out
title: The hygrometer that sometimes doesn't answer
prompt: |
  **Write the decorator with an argument `retry(times)`: the decorated function is called up to `times` times in a row, until it returns something that isn't `None`.**

  Freshly modelled little heads can't dry with too much humidity, and the drying room's hygrometer sometimes returns `None` instead of a reading. With `@retry(3)`, every time someone asks for a reading:

  - the original function is called; if it returns something other than `None` (**`0` too**, which is a valid reading), that is returned and it stops trying;
  - if it returns `None`, it tries again, up to `times` attempts **in that call**;
  - if every attempt gave `None`, it returns `None`.

  Use `@functools.wraps`: the decorated function has to keep the original's name.

  `try_out(readings, times, requests)` is already written: it decorates a fake hygrometer that hands out the `readings` in order (and `None` once they run out), asks it for `requests` readings and returns `[what each request returned, total attempts, the function's name]`. The fake hygrometer's name is `leer_humedad` ("read humidity"), as the judge's data has it.

  **Constraints:** up to 25 readings, each one `None` or a number from 0 to 100 · `times` from 1 to 5 · `requests` from 1 to 8.
visual:
  figure:
    title: Example 1, with @retry(3)
    panes:
      - { label: readings, cells: ["None", "None", "41", "0", "None", "37"] }
      - { table: { head: ["request", "attempts", "sees", "returns"], rows: [["1", "3", "None, None, 41", "41"], ["2", "1", "0", "0"], ["3", "2", "None, 37", "37"]] } }
      - { label: try_out returns, text: "[[41, 0, 37], 6, \"leer_humedad\"]" }
    caption: "0 is a real reading: it isn't retried."
starter: |
  import functools


  def retry(times):
      pass


  def try_out(readings, times, requests):
      """The judge calls this function. Don't change it."""
      pending = list(readings)
      attempts = []

      def read_humidity():
          """One hygrometer reading: a number, or None if it failed."""
          attempts.append(1)
          return pending.pop(0) if pending else None

      read_humidity.__name__ = "leer_humedad"  # its name in the judge's data
      read_humidity = retry(times)(read_humidity)

      results = [read_humidity() for _ in range(requests)]
      return [results, len(attempts), read_humidity.__name__]
solution: |
  import functools


  def retry(times):
      """Retries the function up to `times` times while it returns None."""
      def decorator(func):
          @functools.wraps(func)
          def wrapper(*args, **kwargs):
              for _ in range(times):
                  result = func(*args, **kwargs)
                  if result is not None:
                      return result
              return None
          return wrapper
      return decorator


  def try_out(readings, times, requests):
      """The judge calls this function. Don't change it."""
      pending = list(readings)
      attempts = []

      def read_humidity():
          """One hygrometer reading: a number, or None if it failed."""
          attempts.append(1)
          return pending.pop(0) if pending else None

      read_humidity.__name__ = "leer_humedad"  # its name in the judge's data
      read_humidity = retry(times)(read_humidity)

      results = [read_humidity() for _ in range(requests)]
      return [results, len(attempts), read_humidity.__name__]
hints:
  - "That's three functions: `retry(times)` returns `decorator(func)`, which returns `wrapper(*args, **kwargs)`."
  - "In the wrapper, a `for _ in range(times):` that returns as soon as `result is not None`. Careful: `if result:` would treat 0 as a failure."
samples:
  - args: [[null, null, 41, 0, null, 37], 3, 3]
    returns: [[41, 0, 37], 6, leer_humedad]
    note: The 0 is returned on the first attempt.
  - args: [[null, null, null, null, 55], 2, 3]
    returns: [[null, null, 55], 5, leer_humedad]
    note: With 2 attempts per request, the first two give up; attempts don't pile up between requests.
edge:
  - args: [[], 3, 2]
    tag: with no readings at all
  - args: [[0, 0, 0], 1, 3]
    tag: with readings of zero
  - args: [[12, 13, 14], 5, 3]
    tag: with no failures
  - args: [[null, 70], 1, 2]
    tag: with a single attempt per request
  - args: [[null, null, null, null, 9], 5, 1]
    tag: getting it on the last attempt
  - args: [[null, null, null, null, null, 9], 5, 2]
    tag: when the attempts run out just before
random:
  count: 40
  seed: 1112
  generate: |
    readings = []
    for _ in range(rng.int(0, 25)):
        if rng.next() < 0.45:
            readings.append(None)
        elif rng.next() < 0.25:
            readings.append(0)
        else:
            readings.append(rng.int(1, 100))
    return [readings, rng.int(1, 5), rng.int(1, 8)]
wrong:
  - |
    import functools
    def retry(times):
        def decorator(func):
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                for _ in range(times):
                    result = func(*args, **kwargs)
                    if result:
                        return result
                return None
            return wrapper
        return decorator
    def try_out(readings, times, requests):
        pending, attempts = list(readings), []
        def read_humidity():
            attempts.append(1)
            return pending.pop(0) if pending else None
        read_humidity.__name__ = "leer_humedad"
        read_humidity = retry(times)(read_humidity)
        results = [read_humidity() for _ in range(requests)]
        return [results, len(attempts), read_humidity.__name__]
  - |
    def retry(times):
        def decorator(func):
            def wrapper(*args, **kwargs):
                for _ in range(times):
                    result = func(*args, **kwargs)
                    if result is not None:
                        return result
                return None
            return wrapper
        return decorator
    def try_out(readings, times, requests):
        pending, attempts = list(readings), []
        def read_humidity():
            attempts.append(1)
            return pending.pop(0) if pending else None
        read_humidity.__name__ = "leer_humedad"
        read_humidity = retry(times)(read_humidity)
        results = [read_humidity() for _ in range(requests)]
        return [results, len(attempts), read_humidity.__name__]
  - |
    import functools
    def retry(times):
        def decorator(func):
            attempts_made = 0
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                nonlocal attempts_made
                while attempts_made < times:
                    attempts_made += 1
                    result = func(*args, **kwargs)
                    if result is not None:
                        return result
                return None
            return wrapper
        return decorator
    def try_out(readings, times, requests):
        pending, attempts = list(readings), []
        def read_humidity():
            attempts.append(1)
            return pending.pop(0) if pending else None
        read_humidity.__name__ = "leer_humedad"
        read_humidity = retry(times)(read_humidity)
        results = [read_humidity() for _ in range(requests)]
        return [results, len(attempts), read_humidity.__name__]
```

## Final mission

```exercise
id: py11-mision-bitacora
type: mission
title: The round with a logbook
prompt: |
  **Write the decorator `logbook`, put it on `go_to` and `inspect`, and put together the night's report reading only what was written down.**

  Teodora wants to know what Quilla did in the gallery each night, step by step. The round is already written: `go_to(column)` takes Quilla to a door and `inspect()` reads the sensor, closes the door if it's open, sounds the siren if there's motion and **returns** `"intruder"` or `"all quiet"`.

  1. Write `logbook(func)`: the decorated function does the same as the original (and **returns the same**), and also adds to the list `log` a tuple `(name, args, result)`: the function's name, the tuple of arguments it was called with and what it returned. Use `@functools.wraps`.
  2. Put `@logbook` on `go_to` and on `inspect`.
  3. At the end, build `report`: the list of what each `inspect` returned, **taken from `log`**, and make Quilla say `Intruders: 2` (with that night's number) with `robot.say`.

  `doors` (the doors' columns, from west to east) and the gallery change in every test.
visual:
  figure:
    title: The log of the first night
    panes:
      - { label: doors, cells: ["3", "6", "8", "11"] }
      - { table: { head: ["name", "args", "result"], rows: [["\"go_to\"", "(3,)", "None"], ["\"inspect\"", "()", "\"intruder\""], ["\"go_to\"", "(6,)", "None"], ["\"inspect\"", "()", "\"all quiet\""], ["…", "…", "…"]] } }
      - { label: report, cells: ["intruder", "all quiet", "all quiet", "intruder"] }
starter: |
  import functools

  log = []


  # TODO: write the decorator logbook(func)


  def go_to(column):
      """Moves along the corridor to the door in that column."""
      robot.forward(column - robot.position.x)


  def inspect():
      """Checks the door below and says how the room was."""
      reading = robot.sensor()
      if reading["door"] == "open":
          robot.close_door()
      if reading["motion"]:
          robot.alarm()
          return "intruder"
      return "all quiet"


  for column in doors:
      go_to(column)
      inspect()

  # TODO: report, taken from log, and robot.say(...)
solution: |
  import functools

  log = []


  def logbook(func):
      @functools.wraps(func)
      def wrapper(*args, **kwargs):
          result = func(*args, **kwargs)
          log.append((func.__name__, args, result))
          return result
      return wrapper


  @logbook
  def go_to(column):
      """Moves along the corridor to the door in that column."""
      robot.forward(column - robot.position.x)


  @logbook
  def inspect():
      """Checks the door below and says how the room was."""
      reading = robot.sensor()
      if reading["door"] == "open":
          robot.close_door()
      if reading["motion"]:
          robot.alarm()
          return "intruder"
      return "all quiet"


  for column in doors:
      go_to(column)
      inspect()

  report = [result for name, args, result in log if name == "inspect"]
  robot.say(f"Intruders: {report.count('intruder')}")
hints:
  - "The wrapper calls the original, keeps `result`, does `log.append((func.__name__, args, result))` and returns `result`."
  - "`report = [result for name, args, result in log if name == \"inspect\"]`; then `report.count(\"intruder\")`."
world:
  theme: museo
  level: 2
  dir: E
  map: |
    #############
    #R..........#
    ###O##P#O##P#
    ###m##.#.##m#
    #############
globals:
  doors: [3, 6, 8, 11]
scenarios:
  - tests:
      - name: the first night's report
        expect: 'report == ["intruder", "all quiet", "all quiet", "intruder"]'
  - map: |
      ##########
      #R.......#
      ##O##P#P##
      ##m##m#.##
      ##########
    globals:
      doors: [2, 5, 7]
    tests:
      - name: the second night's report
        expect: 'report == ["intruder", "intruder", "all quiet"]'
  - map: |
      ########
      #R.....#
      #####O##
      #####.##
      ########
    globals:
      doors: [5]
    tests:
      - name: the report of a quiet night
        expect: 'report == ["all quiet"]'
tests:
  - name: two logbook entries per door
    expect: len(log) == 2 * len(doors)
    msg: Each go_to and each inspect leaves one entry; did you put @logbook on both?
  - name: each trip is written down with its column
    expect: '[e for e in log if e[0] == "go_to"] == [("go_to", (c,), None) for c in doors]'
    msg: "Each entry is the tuple (func.__name__, args, result)."
  - name: the decorated functions keep their names
    expect: '[go_to.__name__, inspect.__name__] == ["go_to", "inspect"]'
    msg: Use @functools.wraps(func) on the wrapper.
  - name: every door ends up closed
    state: w.open_doors == 0
  - name: the siren sounds only where there's motion
    state: w.alarms == w.motion_doors
  - name: Quilla says how many intruders there were
    state: 'f"Intruders: {len(w.motion_doors)}" in w.said'
    msg: "At the end, robot.say(f\"Intruders: {report.count('intruder')}\")."
  - name: uses @logbook
    source: '@logbook\s+def\s+go_to[\s\S]*@logbook\s+def\s+inspect|@logbook\s+def\s+inspect[\s\S]*@logbook\s+def\s+go_to'
  - name: without crashing
    state: not w.crashed
```

## Expert challenge

```exercise
id: py11-reto-memoria-corta
type: challenge
title: A memory that forgets
visual:
  figure:
    title: with_memory(2), call by call
    panes:
      - { table: { head: ["call", "f(1)", "f(2)", "f(1)", "f(3)", "f(2)"], rows: [["computes?", "yes", "yes", "no", "yes", "yes"], ["remembers", "1", "1, 2", "2, 1", "1, 3", "3, 2"]] } }
    caption: "When it's full, it forgets the argument that has gone **longest without being used**: that's why f(3) pushes out 2, not 1."
prompt: |
  **Write the decorator with an argument `with_memory(capacity)`: like `@functools.cache`, but it remembers at most `capacity` results.** For people who already code.

  - The key is the tuple of positional arguments (only those are used).
  - If the key is in the memory, it returns the stored result without calling the function, and that key becomes **the most recent**.
  - If it isn't, it calls the function, stores the result and, if the memory goes over `capacity`, forgets the key **used longest ago**. With `capacity = 0` it never stores anything.
  - The decorated function has an attribute `computations`: how many times the original was really called. Keep its name with `@functools.wraps`, and each decorated function has its own memory.

  A dictionary remembers the order its keys were inserted in: taking a key out with `pop` and putting it back sends it to the end.
starter: |
  import functools


  def with_memory(capacity):
      pass


  @with_memory(2)
  def drying(figures):
      return figures * 2 + 6


  print([drying(n) for n in [1, 2, 1, 3, 2]], drying.computations)
solution: |
  import functools


  def with_memory(capacity):
      """Like functools.cache, but remembers at most `capacity` results."""
      def decorator(func):
          memory = {}

          @functools.wraps(func)
          def wrapper(*args):
              if args in memory:
                  memory[args] = memory.pop(args)
                  return memory[args]
              wrapper.computations += 1
              result = func(*args)
              memory[args] = result
              if len(memory) > capacity:
                  del memory[next(iter(memory))]
              return result

          wrapper.computations = 0
          return wrapper
      return decorator


  @with_memory(2)
  def drying(figures):
      return figures * 2 + 6


  print([drying(n) for n in [1, 2, 1, 3, 2]], drying.computations)
hints:
  - "Three nested functions, and the memory (a dictionary) lives in `decorator`, so that each decorated function gets its own."
  - "To refresh a key: `memory[args] = memory.pop(args)`. The oldest one is `next(iter(memory))`."
tests:
  - name: forgets the least recently used, not the first one in
    run: '(lambda f: [[f(1), f(2), f(1), f(3), f(2)], f.computations])(with_memory(2)(lambda x: x * 10))'
    equals: [[10, 20, 10, 30, 20], 4]
  - name: with room to spare it computes each argument once
    run: '(lambda f: [[f(4), f(5), f(4), f(5)], f.computations])(with_memory(5)(lambda x: x + 1))'
    equals: [[5, 6, 5, 6], 2]
  - name: with capacity 0 it always computes
    run: '(lambda f: [[f(2), f(2), f(2)], f.computations])(with_memory(0)(lambda x: x * x))'
    equals: [[4, 4, 4], 3]
  - name: several arguments make up the key
    run: '(lambda f: [[f(2, 3), f(3, 2), f(2, 3)], f.computations])(with_memory(3)(pow))'
    equals: [[8, 9, 8], 2]
  - name: each decorated function has its own memory
    run: '(lambda a, b: [a(1), b(1), a.computations, b.computations])(with_memory(2)(lambda x: x), with_memory(2)(lambda x: -x))'
    equals: [1, -1, 1, 1]
  - name: keeps the name
    expect: drying.__name__ == "drying"
  - name: the console
    output: "[8, 10, 8, 12, 10] 4"
```
