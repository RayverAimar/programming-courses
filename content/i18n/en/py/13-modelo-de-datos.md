# Session 13 — The data model

## The job

Jirón de la Unión, half a block from Plaza San Martín. Between a shoe shop and a school-uniform store there's a narrow arcade, and at the back of it, **Numismática y Filatelia Valdivieso**: three display cases of Peruvian coins, a stamp counter with a bronze magnifying glass and, behind an iron gate, the vaults of the old house where doña **Hortensia Valdivieso** keeps what she won't sell, not even to her nephew.

Hortensia has already moved her inventory to Python, with a `Coin` class and a `Stamp` class. The problem is that her objects don't behave like Python's own: `sorted` can't sort them, two identical coins aren't "equal", a `set` won't take them and `len` of an album is an error. Maru sent her Quilla, who already carries a headlamp for the vaults, with one task: teach those classes to speak Python's language, the one of `==`, `<`, `len`, `in`, `for`, `+` and `with`.

```scene
theme: barranco
level: 3
dir: E
caption: Quilla leaves the arcade on Jirón de la Unión with an 1863 sol in its box and delivers it to the display case on the corner.
map: |
  ############
  #R.....#####
  ######.###D#
  ######.....#
  ############
program: |
  robot.forward(5)
  robot.turn_right()
  robot.forward(2)
  robot.turn_left()
  robot.forward(4)
  robot.turn_left()
  robot.forward(1)
  robot.deliver("1863 sol")
```

## The minimum

When you write `a < b`, Python knows nothing about coins: it calls a method of `a` with a special name, `a.__lt__(b)`. Those methods with two underscores on each side are called **dunder methods** (*double underscore*), and they are Python's **data model**: if your class defines them, your objects work with the usual operators and functions.

| you write | Python calls |
|---|---|
| `a == b`, `a < b` | `a.__eq__(b)`, `a.__lt__(b)` |
| `hash(a)`, `a` in a `set` or as a key | `a.__hash__()` |
| `len(a)`, `a[i]` | `a.__len__()`, `a.__getitem__(i)` |
| `for x in a`, `x in a` | `a.__iter__()`, `a.__contains__(x)` |
| `a + b`, `if a:` | `a.__add__(b)`, `a.__bool__()` |

**Comparing.** Without `__eq__`, `==` is only `True` if both names point to **the same object**. With `__eq__` you decide what "equal" means. To sort, `__lt__` is enough (`sorted`, `min` and `max` only use `<`), and if you also want `<=`, `>` and `>=`, the `functools.total_ordering` decorator builds them from `__eq__` and `__lt__`.

```py run
from functools import total_ordering

@total_ordering
class Coin:
    def __init__(self, name, year):
        self.name, self.year = name, year
    def __eq__(self, other):
        return self.year == other.year
    def __lt__(self, other):
        return self.year < other.year

newer, older = Coin("sol", 1914), Coin("dinero", 1863)
print(older < newer, newer >= older, newer == Coin("peseta", 1914))
```

Watch `sorted` at work: every time it needs to compare two coins, it calls `__lt__`, and the call shows up on the stack.

```anim
title: sorted asks __lt__
code: |
  class Coin:
      def __init__(self, name, year):
          self.name = name
          self.year = year
      def __repr__(self):
          return f"{self.name} {self.year}"
      def __lt__(self, other):
          return self.year < other.year

  tray = [Coin("sol", 1914), Coin("dinero", 1863)]
  showcase = sorted(tray)
  print(showcase)
notes:
  10: "Two coins in the order they arrived: the 1914 one first."
  8: "sorted doesn't know what a coin is: it calls __lt__ and uses the True or False it returns."
  11: "The 1863 coin ended up in front. sorted returned a new list."
  6: "print uses __repr__ to show each coin."
```

**Hashing.** A `set` or a dictionary stores each object by its `hash`, and requires two equal objects to have the same hash. That's why, **if you define `__eq__`, Python removes the inherited `__hash__`** and your objects no longer fit in a `set`: you have to write `__hash__` with the same data `__eq__` uses.

```py run
class Stamp:
    def __init__(self, design, year):
        self.design, self.year = design, year
    def __eq__(self, other):
        return (self.design, self.year) == (other.design, other.year)
    def __hash__(self):
        return hash((self.design, self.year))

lot = {Stamp("llama", 1866), Stamp("llama", 1866), Stamp("coat of arms", 1858)}
print(len(lot), Stamp("llama", 1866) in lot)
```

**Being a collection.** With `__len__`, `len` works; with `__getitem__`, square brackets (with negative indexes and slices, if you pass them on to a list); with `__iter__`, `for`; with `__contains__`, `in`; with `__add__`, `+`; and with `__bool__`, `if`. Without `__bool__`, Python looks at `__len__`: an empty collection is false.

```py run
class Album:
    def __init__(self, stamps):
        self.stamps = list(stamps)
    def __len__(self):
        return len(self.stamps)
    def __getitem__(self, i):
        return self.stamps[i]
    def __iter__(self):
        return iter(self.stamps)
    def __contains__(self, stamp):
        return stamp.lower() in [s.lower() for s in self.stamps]
    def __add__(self, other):
        return Album(self.stamps + other.stamps)
    def __bool__(self):
        return len(self.stamps) > 0

album = Album(["Llama 1866", "Coat of arms 1858"]) + Album(["Paita 1857"])
print(len(album), album[-1], "llama 1866" in album, bool(Album([])))
```

**Duck typing.** Python doesn't care what class an object is, only what it can do: "if it walks like a duck and quacks like a duck, it's a duck". `def size(collection): return len(collection)` works just the same for a list, a string or an `Album`, because all three have `__len__`. Nobody had to inherit from anything.

**Opening and closing.** The `with` you use with `open` is also data model: `with something as x:` calls `something.__enter__()` on the way in (what it returns goes to `x`) and `something.__exit__(kind, error, trace)` on the way out, **even if the block ends with an error**. That way a display case is never left open. Writing it as a class is the classic way; `contextlib.contextmanager` does it with a function: what goes before the `yield` opens, what comes out of the `yield` goes to the `as`, and what goes in the `finally` closes no matter what.

```py run
from contextlib import contextmanager

@contextmanager
def showcase(number):
    print("opens showcase", number)
    try:
        yield number
    finally:
        print("closes showcase", number)

with showcase(4) as n:
    print("takes the peseta out of showcase", n)
```

**Writing the duck down.** `typing.Protocol` puts *duck typing* in writing: it describes which methods something must have, and any class that has them fits, without inheriting. Python doesn't check it when running; the editor and type checkers use it to warn you beforehand.

```py run
from typing import Protocol

class Appraisable(Protocol):
    def appraise(self) -> int: ...

class Banknote:
    def appraise(self) -> int:
        return 80

def lot_value(pieces: list[Appraisable]) -> int:
    return sum(piece.appraise() for piece in pieces)

print(lot_value([Banknote(), Banknote()]))
```

> **Common trap:** you added `__eq__` to a class you were already using in a `set` or as a dictionary key, and suddenly you get `TypeError: unhashable type`. You didn't break anything else: defining `__eq__` leaves the class without `__hash__`. Write `__hash__` with **the same fields** `__eq__` compares (or use `@dataclass(frozen=True)`, which does both).

<!-- legacy: total-ordering -->

<!-- legacy: contextmanager -->

<!-- legacy: protocol -->

<!-- mdn: total-ordering contextmanager protocol -->

## Practice

```exercise
id: py13-predice-album
type: predict
title: The album without __iter__
prompt: |
  This `Album` only has `__len__` and `__getitem__`: no `__bool__`, no `__contains__`, no `__iter__`. What does it print?
code: |
  class Album:
      def __init__(self, stamps):
          self.stamps = stamps

      def __len__(self):
          return len(self.stamps)

      def __getitem__(self, i):
          return self.stamps[i]

  empty = Album([])
  full = Album(["Llama 1866", "Paita 1857", "Coat of arms 1858"])
  print(len(full), bool(empty), full[-1])
  print("Paita 1857" in full)
  for stamp in full[:2]:
      print(stamp)
options:
  - "3 False Coat of arms 1858\nTrue\nLlama 1866\nPaita 1857"
  - "3 True Coat of arms 1858\nTrue\nLlama 1866\nPaita 1857"
  - "3 False Coat of arms 1858\nTypeError: argument of type 'Album' is not iterable"
  - "3 False Llama 1866\nTrue\nLlama 1866\nPaita 1857"
answer: "3 False Coat of arms 1858\nTrue\nLlama 1866\nPaita 1857"
explain: |
  Without `__bool__`, `bool` uses `__len__`: the empty album is `False`. `full[-1]` and `full[:2]` hand the `-1` and the slice to `__getitem__`, which hands them to the list. And without `__iter__` or `__contains__`, Python can still walk through it: it asks for `full[0]`, `full[1]`… until `__getitem__` raises `IndexError`. That's *duck typing*: with very little, it already behaves like a sequence.
```

```exercise
id: py13-completa-orden
type: complete
title: The showcase by age
prompt: |
  Hortensia sorts her coins by year: the oldest first, and two coins from the same year are worth the same in the showcase. Fill in the `___` so that `sorted`, `max` and also `>=` work, writing **only** `__eq__` and `__lt__`.
visual:
  figure:
    input: { label: coins, cells: ["sol (1914)", "dinero (1863)", "peseta (1880)"] }
    arrow: "sorted calls __lt__"
    output: { label: sorted(coins), cells: ["dinero (1863)", "peseta (1880)", "sol (1914)"] }
starter: |
  import functools


  @functools.___
  class Coin:
      def __init__(self, name, year):
          self.name = name
          self.year = year

      def __repr__(self):
          return f"{self.name} ({self.year})"

      def ___(self, other):
          return self.year == other.year

      def ___(self, other):
          return self.year ___ other.year


  coins = [Coin("sol", 1914), Coin("dinero", 1863), Coin("peseta", 1880)]
  print(sorted(coins))
  print(Coin("sol", 1866) >= Coin("medio sol", 1864))
solution: |
  import functools


  @functools.total_ordering
  class Coin:
      def __init__(self, name, year):
          self.name = name
          self.year = year

      def __repr__(self):
          return f"{self.name} ({self.year})"

      def __eq__(self, other):
          return self.year == other.year

      def __lt__(self, other):
          return self.year < other.year


  coins = [Coin("sol", 1914), Coin("dinero", 1863), Coin("peseta", 1880)]
  print(sorted(coins))
  print(Coin("sol", 1866) >= Coin("medio sol", 1864))
hints:
  - "The decorator that fills in the comparisons is `total_ordering`. The two methods are `__eq__` (equal) and `__lt__` (*less than*)."
tests:
  - name: sorts from oldest to newest
    output: "[dinero (1863), peseta (1880), sol (1914)]\nTrue"
  - name: max gives the newest
    expect: max(coins).year == 1914
  - name: ">= works"
    expect: Coin("sol", 1866) >= Coin("medio sol", 1864)
  - name: "<= with the same year"
    expect: Coin("sol", 1900) <= Coin("peseta", 1900)
  - name: "> works"
    expect: not (Coin("sol", 1864) > Coin("peseta", 1880))
  - name: uses total_ordering
    source: '@functools\.total_ordering'
```

```exercise
id: py13-arregla-hash
type: fix
title: The lot that wouldn't go into the set
prompt: |
  Hortensia bought a lot of stamps at an auction and wants to know how many **distinct** ones there are. Her nephew added `__eq__` to the class so that two equal stamps count as one, and since then the program crashes. Run it, read the error and fix it by adding one method, without touching `__eq__`.
visual:
  figure:
    input: { label: lot, cells: ["Peru 1866 llama", "Peru 1858 coat of arms", "Peru 1866 llama", "Chile 1853 Columbus"], highlight: [0, 2] }
    arrow: set(lot)
    output: { label: distinct, value: "3" }
starter: |
  class Stamp:
      def __init__(self, country, year, design):
          self.country = country
          self.year = year
          self.design = design

      def __eq__(self, other):
          return (self.country, self.year, self.design) == (other.country, other.year, other.design)


  lot = [
      Stamp("Peru", 1866, "llama"),
      Stamp("Peru", 1858, "coat of arms"),
      Stamp("Peru", 1866, "llama"),
      Stamp("Chile", 1853, "Columbus"),
  ]
  distinct = set(lot)
  print(len(distinct), "distinct stamps")
solution: |
  class Stamp:
      def __init__(self, country, year, design):
          self.country = country
          self.year = year
          self.design = design

      def __eq__(self, other):
          return (self.country, self.year, self.design) == (other.country, other.year, other.design)

      def __hash__(self):
          return hash((self.country, self.year, self.design))


  lot = [
      Stamp("Peru", 1866, "llama"),
      Stamp("Peru", 1858, "coat of arms"),
      Stamp("Peru", 1866, "llama"),
      Stamp("Chile", 1853, "Columbus"),
  ]
  distinct = set(lot)
  print(len(distinct), "distinct stamps")
hints:
  - "`unhashable type: 'Stamp'`: by defining `__eq__`, the class was left without `__hash__`, and a `set` needs it."
  - "Write `__hash__` with the same three fields `__eq__` compares: `return hash((self.country, self.year, self.design))`."
tests:
  - name: counts 3 distinct
    output: 3 distinct stamps
  - name: two equal stamps have the same hash
    expect: hash(Stamp("Peru", 1866, "llama")) == hash(Stamp("Peru", 1866, "llama"))
  - name: different stamps have different hashes
    expect: len({hash(s) for s in lot}) == 3
    msg: Use the same fields in the hash as in __eq__, not a fixed number.
  - name: an equal stamp is in the set
    expect: Stamp("Chile", 1853, "Columbus") in distinct
  - name: defines __hash__
    source: 'def\s+__hash__\s*\(\s*self\s*\)'
```

```exercise
id: py13-escribe-album
type: write
title: The album that behaves like a list
prompt: |
  Write the `Album` class, which keeps a list of stamps (strings) and behaves like a Python collection:

  - `len(album)` gives how many stamps it has, and an empty album is false in an `if`;
  - `for stamp in album` walks through the stamps in order (`__iter__`);
  - `"llama 1866" in album` searches **ignoring case** (`__contains__`): it finds `"Llama 1866"`;
  - `album_a + album_b` returns a **new album** with the stamps of `album_a` and then those of `album_b` that weren't there already, without changing either of them.
visual:
  figure:
    input: { label: "Album([\"A\", \"B\"]) + Album([\"B\", \"C\"])", cells: ["A", "B", "B", "C"], highlight: [2] }
    arrow: "__add__ skips the repeated stamp"
    output: { label: a new album, cells: ["A", "B", "C"] }
starter: |
  class Album:
      def __init__(self, stamps):
          self.stamps = list(stamps)


  album = Album(["Llama 1866", "Coat of arms 1858"]) + Album(["Paita 1857", "Llama 1866"])
  print(len(album), "llama 1866" in album, list(album))
solution: |
  class Album:
      def __init__(self, stamps):
          self.stamps = list(stamps)

      def __len__(self):
          return len(self.stamps)

      def __iter__(self):
          return iter(self.stamps)

      def __contains__(self, stamp):
          return stamp.lower() in [s.lower() for s in self.stamps]

      def __add__(self, other):
          new_ones = [s for s in other.stamps if s not in self.stamps]
          return Album(self.stamps + new_ones)


  album = Album(["Llama 1866", "Coat of arms 1858"]) + Album(["Paita 1857", "Llama 1866"])
  print(len(album), "llama 1866" in album, list(album))
hints:
  - "`__iter__` can return `iter(self.stamps)`. To ignore case, compare everything in `.lower()`."
  - "`__add__` builds the new list and returns `Album(...)`: never touch `self.stamps` or `other.stamps`."
tests:
  - name: len counts the stamps
    expect: len(Album(["Llama 1866", "Coat of arms 1858"])) == 2
  - name: an empty album is false
    expect: not Album([])
  - name: for walks the stamps in order
    expect: 'list(Album(["X", "Y", "Z"])) == ["X", "Y", "Z"]'
  - name: in ignores case
    expect: '"llama 1866" in Album(["Llama 1866"]) and "PAITA" not in Album(["Llama 1866"])'
  - name: + joins without repeating
    expect: 'list(Album(["A", "B"]) + Album(["B", "C"])) == ["A", "B", "C"]'
  - name: + returns an album
    expect: type(Album(["A"]) + Album(["B"])) == Album
  - name: + doesn't change the original albums
    expect: '(lambda a, b: (a + b, a.stamps, b.stamps)[1:])(Album(["A"]), Album(["B"])) == (["A"], ["B"])'
    msg: __add__ must create a new album, without adding anything to self or to other.
  - name: the example below
    output: "3 True ['Llama 1866', 'Coat of arms 1858', 'Paita 1857']"
```

```exercise
id: py13-predice-with
type: predict
title: The magnifying glass that fell
prompt: |
  Quilla takes a coin out of showcase 3 and, halfway through, drops the magnifying glass. What does it print?
code: |
  class Showcase:
      def __init__(self, number):
          self.number = number

      def __enter__(self):
          print("opens", self.number)
          return self

      def __exit__(self, kind, error, trace):
          print("closes", self.number)


  try:
      with Showcase(3) as s:
          print("takes the coin from", s.number)
          raise ValueError("the magnifying glass fell")
          print("puts it back")
  except ValueError as e:
      print("problem:", e)
options:
  - "opens 3\ntakes the coin from 3\ncloses 3\nproblem: the magnifying glass fell"
  - "opens 3\ntakes the coin from 3\nproblem: the magnifying glass fell"
  - "opens 3\ntakes the coin from 3\nproblem: the magnifying glass fell\ncloses 3"
  - "opens 3\ntakes the coin from 3\nputs it back\ncloses 3"
answer: "opens 3\ntakes the coin from 3\ncloses 3\nproblem: the magnifying glass fell"
explain: |
  The error cuts the block short (`puts it back` is never printed), but **before the error leaves the `with`**, Python calls `__exit__`: the showcase closes. Only then does the error reach the `except`. Since `__exit__` doesn't return `True`, the error isn't swallowed: it goes on its way.
```

```exercise
id: py13-escribe-prestamo
type: write
title: On loan to the magnifying glass
prompt: |
  Write, with `@contextmanager`, `loan(log, piece)`: when a piece leaves the showcase to be looked at under the magnifying glass, it appends the text `"out <piece>"` to the list `log` on the way in, hands the piece to the `as`, and appends `"back <piece>"` on the way out, **even if there was an error**.

  `try_out(loan, with_error)` is already given: it uses your `loan` in a `with`, with or without a `ValueError` inside, and returns what was logged.
visual:
  figure:
    panes:
      - { label: "try_out(loan, False)", cells: ["out 1863 sol", "looks at 1863 sol", "all good", "back 1863 sol"] }
      - { label: "try_out(loan, True)", cells: ["out 1863 sol", "looks at 1863 sol", "back 1863 sol", "error"], highlight: [2] }
starter: |
  from contextlib import contextmanager


  @contextmanager
  def loan(log, piece):
      yield piece


  print(try_out(loan, False))
  print(try_out(loan, True))
solution: |
  from contextlib import contextmanager


  @contextmanager
  def loan(log, piece):
      log.append(f"out {piece}")
      try:
          yield piece
      finally:
          log.append(f"back {piece}")


  print(try_out(loan, False))
  print(try_out(loan, True))
hints:
  - What goes before the `yield` runs on the way into the `with`; what goes after it, on the way out.
  - "If the block fails, the error shows up at the `yield`. Wrap it in `try:` … `finally:` so the way-out part always runs."
helpers:
  - name: try_out
    sig: "try_out(manager, with_error) → list"
    doc: Uses manager(log, "1863 sol") in a with, with or without a ValueError inside, and returns the log.
    code: |
      def try_out(manager, with_error):
          log = []
          try:
              with manager(log, "1863 sol") as piece:
                  log.append(f"looks at {piece}")
                  if with_error:
                      raise ValueError("it fell")
                  log.append("all good")
          except ValueError:
              log.append("error")
          return log
tests:
  - name: without an error, logs going out and coming back
    run: try_out(loan, False)
    equals: ["out 1863 sol", "looks at 1863 sol", "all good", "back 1863 sol"]
  - name: with an error, the piece comes back anyway
    run: try_out(loan, True)
    equals: ["out 1863 sol", "looks at 1863 sol", "back 1863 sol", "error"]
  - name: uses try and finally
    source: '\btry\s*:[\s\S]*\byield\b[\s\S]*\bfinally\s*:'
```

```exercise
id: py13-predice-protocolo
type: predict
title: Who is appraisable?
prompt: |
  `Appraisable` describes something that has an `appraise` method. No class inherits from it. `@runtime_checkable` lets `isinstance` check that shape. What does it print?
code: |
  from typing import Protocol, runtime_checkable


  @runtime_checkable
  class Appraisable(Protocol):
      def appraise(self) -> int: ...


  class Coin:
      def appraise(self):
          return 120


  class Postcard:
      def describe(self):
          return "Plaza San Martín, 1925"


  def total(pieces: list[Appraisable]) -> int:
      return sum(p.appraise() for p in pieces)


  print(isinstance(Coin(), Appraisable), isinstance(Postcard(), Appraisable))
  print(total([Coin(), Coin()]))
options:
  - "True False\n240"
  - "False False\n240"
  - "True True\n240"
  - "False False\nTypeError"
answer: "True False\n240"
explain: |
  A `Protocol` looks at the **shape**, not at inheritance: `Coin` has `appraise`, so it fits; `Postcard` doesn't. And the `list[Appraisable]` annotation stops nothing at run time: `total` works because every coin knows how to `appraise()`, pure *duck typing*.
```

## The case

```exercise
id: py13-caso-vitrinas
type: case
title: The collection that was sorted wrong
prompt: |
  **Write `__eq__` and `__lt__` for `Coin` with Hortensia's rule, sort each tray with `sorted` and find which place the 1864 medio sol ends up in. Compare it with what each assistant reported.**

  Hortensia's rule for her showcases: **the oldest first; if two are from the same year, the one with the lower value first** (the value is in céntimos). Two coins with the same year and the same value count as equal.

  Each of her three assistants arranged one showcase with their own `Coin` class and told Hortensia which place (counting from 1) the **1864 medio sol** ended up in; every showcase has one. One of the three wrote their `__lt__` wrong and their showcase came out out of order.

  Print one line per assistant that starts with their name: `print("Brenda:", showcase.index(marked) + 1)`. `index` searches with `==`, so it needs your `__eq__`.
visual:
  board:
    for: py13-caso-vitrinas
    task: "Sort each tray: year, and on a tie, value. Which place does the 1864 medio sol end up in?"
    cards:
      - name: Brenda
        kind: person
        role: Showcase 1
        rows: [["Coins", "6"], ["Her __lt__", "\"year, then value\""], ["1864 medio sol", "place 2"]]
        clue: { find: "Brenda", says: 2 }
      - name: Ulises
        kind: person
        role: Showcase 2
        rows: [["Coins", "6, two from 1864"], ["His __lt__", "\"year, then value\""], ["1864 medio sol", "place 2"]]
        clue: { find: "Ulises", says: 2 }
      - name: Toribio
        kind: person
        role: Showcase 3
        culprit: true
        rows: [["Coins", "6"], ["His __lt__", "\"year or value, whatever\""], ["1864 medio sol", "place 4"]]
        clue: { find: "Toribio", says: 4 }
      - name: The values
        kind: note
        role: In céntimos of a sol
        rows: [["medio dinero", "5"], ["dinero", "10"], ["peseta", "20"], ["medio sol", "50"], ["sol", "100"]]
    caption: "If you get place 3 in Ulises's showcase, check the tie-break: in 1864 there's a sol and a medio sol."
starter: |
  from functools import total_ordering

  # trays is already given: assistant → list of [name, year, value in céntimos]
  print(trays["Brenda"][0])


  # TODO: put @total_ordering on the class (once it has __lt__)
  class Coin:
      def __init__(self, name, year, value):
          self.name = name
          self.year = year
          self.value = value

      def __repr__(self):
          return f"{self.name} {self.year}"

      # TODO: __eq__ and __lt__ with Hortensia's rule


  marked = Coin("medio sol", 1864, 50)
  # TODO: for each assistant, build their coins, sort them with sorted and print
  # print("Brenda:", showcase.index(marked) + 1)
solution: |
  from functools import total_ordering


  @total_ordering
  class Coin:
      def __init__(self, name, year, value):
          self.name = name
          self.year = year
          self.value = value

      def __repr__(self):
          return f"{self.name} {self.year}"

      def __eq__(self, other):
          return (self.year, self.value) == (other.year, other.value)

      def __lt__(self, other):
          return (self.year, self.value) < (other.year, other.value)


  marked = Coin("medio sol", 1864, 50)
  for assistant, tray in trays.items():
      showcase = sorted(Coin(*data) for data in tray)
      print(f"{assistant}: {showcase} {showcase.index(marked) + 1}")
globals:
  trays:
    Brenda: [[sol, 1914, 100], [medio sol, 1864, 50], [dinero, 1863, 10], [peseta, 1880, 20], [sol, 1866, 100], [medio dinero, 1914, 5]]
    Ulises: [[peseta, 1917, 20], [dinero, 1875, 10], [sol, 1864, 100], [medio sol, 1864, 50], [medio dinero, 1863, 5], [sol, 1923, 100]]
    Toribio: [[medio sol, 1864, 50], [sol, 1870, 100], [dinero, 1918, 10], [peseta, 1866, 20], [sol, 1916, 100], [medio dinero, 1879, 5]]
answer: Toribio
answerLabel: Who wrote their __lt__ wrong?
reveal: |
  Toribio. In his showcase the 1864 medio sol is the oldest coin and goes **first**, but he reported place 4. His `__lt__` was `self.year < other.year or self.value < other.value`: with that `or`, the 1879 medio dinero turns out "less than" the 1864 medio sol just for being worth less, and the order gets scrambled. Comparing tuples, `(self.year, self.value) < (other.year, other.value)`, looks at the value **only** when the years tie.
hints:
  - "Tuples are compared field by field: `(self.year, self.value) < (other.year, other.value)` is already the whole rule. The same with `==` for `__eq__`."
  - "`Coin(*data)` builds a coin from a `[name, year, value]` list. Sort with `sorted(...)` and search with `showcase.index(marked)`."
```

## The judge

As since session 4, the judge calls a function and compares what it returns. Here that function is already written in the editor: it builds objects of **your** class, adds them up, compares them, puts them in a `set`… What it really judges is your dunder methods.

```exercise
id: py13-juez-fraccion
type: judge
mode: function
function: summary
title: The auction shares
prompt: |
  **Write the `Fraction` class with `__eq__`, `__lt__`, `__hash__`, `__add__` and `__bool__`, so that `summary(parts)` (already written) works.**

  Hortensia buys lots at auctions with her partners and writes down each one's share as a fraction: `[1, 4]` is a quarter. She writes them however they come out: unsimplified (`[2, 4]`), with the sign at the bottom (`[1, -2]`, a refund) or as zero (`[0, 3]`, a partner who put in nothing).

  `Fraction(num, den)` must always end up **simplified** and with a **positive** denominator, in its `num` and `den` attributes: `Fraction(2, -4)` stores `num = -1`, `den = 2`, and `Fraction(0, 3)` stores `0` and `1`. `math.gcd(a, b)` gives the greatest common divisor (always positive).

  - `a + b` returns a new `Fraction`: `a/b + c/d = (a·d + c·b) / (b·d)`.
  - `a == b` and `a < b` compare the **value**: `Fraction(1, 2) == Fraction(2, 4)`, and `Fraction(2, 5) < Fraction(1, 2)`.
  - Two equal fractions have the same `hash`, and a fraction is false only if it's worth 0.

  `summary` returns `[total, how many distinct, all of them sorted from smallest to largest, how many aren't zero]`, with each fraction as `[num, den]`.

  **Constraints:** 0 to 12 parts · numerators from −36 to 36 · denominators from −36 to 36, never 0.
visual:
  figure:
    title: Example 1
    input: { label: parts, cells: ["1/2", "1/4", "2/4", "0/3"] }
    arrow: "Fraction simplifies: 2/4 → 1/2, 0/3 → 0/1"
    output: { label: returns, table: { head: ["total", "distinct", "sorted", "non-zero"], rows: [["5/4", "3", "0/1, 1/4, 1/2, 1/2", "3"]] } }
    steps:
      - "The total is 1/2 + 1/4 + 1/2 + 0 = 5/4."
      - "Distinct: {1/2, 1/4, 0}, because 2/4 equals 1/2 and has the same hash."
starter: |
  from functools import total_ordering
  from math import gcd


  @total_ordering
  class Fraction:
      def __init__(self, num, den):
          self.num = num
          self.den = den

      def __repr__(self):
          return f"{self.num}/{self.den}"


  def summary(parts):
      fractions = [Fraction(num, den) for num, den in parts]
      total = sum(fractions, Fraction(0, 1))
      ordered = [[f.num, f.den] for f in sorted(fractions)]
      return [[total.num, total.den], len(set(fractions)), ordered, len([f for f in fractions if f])]
solution: |
  from functools import total_ordering
  from math import gcd


  @total_ordering
  class Fraction:
      def __init__(self, num, den):
          if den < 0:
              num, den = -num, -den
          divisor = gcd(num, den)
          self.num = num // divisor
          self.den = den // divisor

      def __repr__(self):
          return f"{self.num}/{self.den}"

      def __eq__(self, other):
          return (self.num, self.den) == (other.num, other.den)

      def __hash__(self):
          return hash((self.num, self.den))

      def __lt__(self, other):
          return self.num * other.den < other.num * self.den

      def __add__(self, other):
          return Fraction(self.num * other.den + other.num * self.den, self.den * other.den)

      def __bool__(self):
          return self.num != 0


  def summary(parts):
      fractions = [Fraction(num, den) for num, den in parts]
      total = sum(fractions, Fraction(0, 1))
      ordered = [[f.num, f.den] for f in sorted(fractions)]
      return [[total.num, total.den], len(set(fractions)), ordered, len([f for f in fractions if f])]
hints:
  - "Simplify in `__init__`: if `den < 0`, flip the sign of both; then divide both by `gcd(num, den)`. Once simplified, two fractions are equal if they have the same `(num, den)`."
  - "For `<` don't divide: with positive denominators, `a/b < c/d` is the same as `a·d < c·b`."
samples:
  - args: [[[1, 2], [1, 4], [2, 4], [0, 3]]]
    returns: [[5, 4], 3, [[0, 1], [1, 4], [1, 2], [1, 2]], 3]
    note: The drawing above.
  - args: [[[3, -6], [1, 3], [-1, 2]]]
    returns: [[-2, 3], 2, [[-1, 2], [-1, 2], [1, 3]], 3]
    note: "`[3, -6]` is −1/2, the same as `[-1, 2]`."
edge:
  - args: [[]]
    tag: with no parts
  - args: [[[0, 5]]]
    tag: with a single part that is zero
  - args: [[[6, 3]]]
    tag: with a fraction that is a whole number
  - args: [[[-2, -4]]]
    tag: with both signs negative
  - args: [[[1, 2], [2, 5]]]
    tag: when the smaller numerator isn't the smaller fraction
  - args: [[[1, 3], [2, 6], [3, 9], [4, 12]]]
    tag: with four ways of writing the same thing
  - args: [[[5, 1], [-5, 1]]]
    tag: when the total is zero
  - args: [[[1, -2], [1, 2], [0, -7]]]
    tag: with the sign in the denominator
  - args: [[[7, 12], [7, 12], [1, 12], [11, 12], [5, 6]]]
    tag: with twelfths
random:
  count: 40
  seed: 1303
  generate: |
    parts, simple = [], []
    for _ in range(rng.int(0, 12)):
        if simple and rng.int(0, 2) == 0:
            num, den = rng.pick(simple)
            k = rng.pick([2, 3, -1, -2])
            parts.append([num * k, den * k])
        else:
            simple.append([rng.int(-12, 12), rng.pick([1, 2, 3, 4, 5, 6, 8, 12, -2, -3, -4])])
            parts.append(simple[-1])
    return [parts]
wrong:
  - |
    from functools import total_ordering
    from math import gcd


    @total_ordering
    class Fraction:
        def __init__(self, num, den):
            sign = -1 if den < 0 else 1
            self.num, self.den = num * sign, den * sign
        def __eq__(self, other): return (self.num, self.den) == (other.num, other.den)
        def __hash__(self): return hash((self.num, self.den))
        def __lt__(self, other): return self.num * other.den < other.num * self.den
        def __add__(self, other): return Fraction(self.num * other.den + other.num * self.den, self.den * other.den)
        def __bool__(self): return self.num != 0


    def summary(parts):
        fractions = [Fraction(num, den) for num, den in parts]
        total = sum(fractions, Fraction(0, 1))
        ordered = [[f.num, f.den] for f in sorted(fractions)]
        return [[total.num, total.den], len(set(fractions)), ordered, len([f for f in fractions if f])]
  - |
    from functools import total_ordering
    from math import gcd


    @total_ordering
    class Fraction:
        def __init__(self, num, den):
            sign = -1 if den < 0 else 1
            divisor = gcd(num, den) * sign
            self.num, self.den = num // divisor, den // divisor
        def __eq__(self, other): return (self.num, self.den) == (other.num, other.den)
        def __hash__(self): return hash((self.num, self.den))
        def __lt__(self, other): return (self.num, self.den) < (other.num, other.den)
        def __add__(self, other): return Fraction(self.num * other.den + other.num * self.den, self.den * other.den)
        def __bool__(self): return self.num != 0


    def summary(parts):
        fractions = [Fraction(num, den) for num, den in parts]
        total = sum(fractions, Fraction(0, 1))
        ordered = [[f.num, f.den] for f in sorted(fractions)]
        return [[total.num, total.den], len(set(fractions)), ordered, len([f for f in fractions if f])]
  - |
    from functools import total_ordering
    from math import gcd


    @total_ordering
    class Fraction:
        def __init__(self, num, den):
            sign = -1 if den < 0 else 1
            divisor = gcd(num, den) * sign
            self.num, self.den = num // divisor, den // divisor
        def __eq__(self, other): return (self.num, self.den) == (other.num, other.den)
        def __hash__(self): return hash((self.num, self.den))
        def __lt__(self, other): return self.num * other.den < other.num * self.den
        def __add__(self, other): return Fraction(self.num + other.num, self.den + other.den)
        def __bool__(self): return self.num != 0


    def summary(parts):
        fractions = [Fraction(num, den) for num, den in parts]
        total = sum(fractions, Fraction(0, 1))
        ordered = [[f.num, f.den] for f in sorted(fractions)]
        return [[total.num, total.den], len(set(fractions)), ordered, len([f for f in fractions if f])]
  - |
    from functools import total_ordering
    from math import gcd


    @total_ordering
    class Fraction:
        def __init__(self, num, den):
            sign = -1 if den < 0 else 1
            divisor = gcd(num, den) * sign
            self.num, self.den = num // divisor, den // divisor
        def __eq__(self, other): return (self.num, self.den) == (other.num, other.den)
        def __hash__(self): return hash((self.num, self.den))
        def __lt__(self, other): return self.num * other.den < other.num * self.den
        def __add__(self, other): return Fraction(self.num * other.den + other.num * self.den, self.den * other.den)


    def summary(parts):
        fractions = [Fraction(num, den) for num, den in parts]
        total = sum(fractions, Fraction(0, 1))
        ordered = [[f.num, f.den] for f in sorted(fractions)]
        return [[total.num, total.den], len(set(fractions)), ordered, len([f for f in fractions if f])]
tests:
  - name: Fraction defines __lt__
    source: 'def\s+__lt__'
  - name: Fraction defines __add__
    source: 'def\s+__add__'
```

```exercise
id: py13-juez-mazo
type: judge
mode: function
function: run_deck
title: The deck of postcards
prompt: |
  **Write the `Deck` class with `__len__`, `__getitem__`, `__iter__`, `__contains__` and `__add__`, so that `run_deck(postcards, orders)` (already written) works.**

  Hortensia sells old postcards of Lima in decks. A collector never wants two of the same, so **a deck doesn't repeat postcards**: `Deck(postcards)` keeps the first appearance of each one, in order.

  - `len(deck)` gives how many postcards it has, and `postcard in deck` says whether it's there.
  - `deck[i]` gives the postcard at position `i` (0 is the top one; `-1`, the bottom one).
  - `deck[a:b]` gives a **new `Deck`** with that stretch, not a list.
  - `deck + other` gives a **new `Deck`**: the postcards of `deck` and then those of `other` that weren't there, and `for postcard in deck` walks them in order.

  `run_deck` gets the orders as lists, with their names in Spanish, as the shop writes them: `["largo"]` (length) records `len(deck)`, `["ver", i]` (look) records `deck[i]`, `["tiene", postcard]` (has) records whether it's there, `["cortar", k]` (cut) moves the top `k` to the bottom (`deck[k:] + deck[:k]`) and `["juntar", postcards]` (join) adds a new deck to it. At the end it records `list(deck)`.

  **Constraints:** 0 to 8 postcards at the start · 1 to 12 orders · `ver` always asks for a position that exists · in `cortar`, 0 ≤ `k` ≤ `len(deck)`.
visual:
  figure:
    title: Example 1, order by order
    panes:
      - { label: "Deck([\"Rímac\", \"Callao\", \"Rímac\", \"Colón\"])", cells: ["Rímac", "Callao", "Colón"] }
      - { label: "[\"cortar\", 1]", cells: ["Callao", "Colón", "Rímac"] }
      - { label: "[\"juntar\", [\"Colón\", \"La Punta\"]]", cells: ["Callao", "Colón", "Rímac", "La Punta"], highlight: [3] }
      - { label: returns, value: "[3, 'Rímac', 'La Punta', True, [...]]" }
    caption: "The repeated `Rímac` doesn't get into the deck, and from the `juntar` only `La Punta` gets in."
starter: |
  class Deck:
      def __init__(self, postcards=()):
          self.postcards = list(postcards)


  def run_deck(postcards, orders):
      deck = Deck(postcards)
      results = []
      for order, *arg in orders:
          if order == "largo":
              results.append(len(deck))
          elif order == "ver":
              results.append(deck[arg[0]])
          elif order == "tiene":
              results.append(arg[0] in deck)
          elif order == "cortar":
              deck = deck[arg[0]:] + deck[:arg[0]]
          else:
              deck = deck + Deck(arg[0])
      return results + [list(deck)]
solution: |
  class Deck:
      def __init__(self, postcards=()):
          self.postcards = []
          for postcard in postcards:
              if postcard not in self.postcards:
                  self.postcards.append(postcard)

      def __len__(self):
          return len(self.postcards)

      def __getitem__(self, i):
          if isinstance(i, slice):
              return Deck(self.postcards[i])
          return self.postcards[i]

      def __iter__(self):
          return iter(self.postcards)

      def __contains__(self, postcard):
          return postcard in self.postcards

      def __add__(self, other):
          return Deck(self.postcards + other.postcards)


  def run_deck(postcards, orders):
      deck = Deck(postcards)
      results = []
      for order, *arg in orders:
          if order == "largo":
              results.append(len(deck))
          elif order == "ver":
              results.append(deck[arg[0]])
          elif order == "tiene":
              results.append(arg[0] in deck)
          elif order == "cortar":
              deck = deck[arg[0]:] + deck[:arg[0]]
          else:
              deck = deck + Deck(arg[0])
      return results + [list(deck)]
hints:
  - "Remove the repeats in `__init__`: that way `__add__` can be just `Deck(self.postcards + other.postcards)` and the constructor does the rest."
  - "`__getitem__` receives a number or a `slice` object. `isinstance(i, slice)` tells them apart: with a `slice`, return `Deck(self.postcards[i])`."
samples:
  - args: [["Rímac", "Callao", "Rímac", "Colón"], [["largo"], ["ver", 0], ["cortar", 1], ["juntar", ["Colón", "La Punta"]], ["ver", -1], ["tiene", "Rímac"]]]
    returns: [3, "Rímac", "La Punta", true, ["Callao", "Colón", "Rímac", "La Punta"]]
    note: The drawing above.
  - args: [["Catedral", "Barranco"], [["cortar", 2], ["tiene", "Callao"], ["ver", 1]]]
    returns: [false, "Barranco", ["Catedral", "Barranco"]]
    note: Cutting all the postcards leaves the deck as it was.
edge:
  - args: [[], [["largo"]]]
    tag: with an empty deck
  - args: [[], [["juntar", ["Callao", "Callao"]], ["largo"]]]
    tag: when joining repeated postcards to an empty deck
  - args: [["Colón", "Colón", "Colón"], [["largo"], ["ver", -1]]]
    tag: with the same postcard three times
  - args: [["Rímac", "Callao", "Colón"], [["cortar", 0], ["cortar", 3], ["ver", 0]]]
    tag: cutting zero and all of them
  - args: [["Rímac", "Callao", "Colón"], [["cortar", 2], ["juntar", ["Rímac", "Barranco"]], ["ver", -2]]]
    tag: when cutting and then joining
  - args: [["Rímac"], [["juntar", ["Rímac"]], ["largo"], ["tiene", "Rímac"]]]
    tag: when joining a postcard that was already there
  - args: [["La Punta", "Barranco", "Chorrillos"], [["ver", -3], ["ver", 2], ["tiene", "Callao"]]]
    tag: with negative indexes
random:
  count: 40
  seed: 1313
  generate: |
    names = ["Catedral", "Desamparados", "San Martín", "Colón", "Rímac", "Callao",
             "Barranco", "Chorrillos", "La Punta", "Teatro Segura"]
    postcards = [rng.pick(names) for _ in range(rng.int(0, 8))]
    deck = list(dict.fromkeys(postcards))
    orders = []
    for _ in range(rng.int(1, 12)):
        kind = rng.pick(["largo", "ver", "ver", "tiene", "cortar", "cortar", "juntar"])
        if kind == "ver" and deck:
            orders.append(["ver", rng.int(-len(deck), len(deck) - 1)])
        elif kind == "tiene":
            orders.append(["tiene", rng.pick(names)])
        elif kind == "cortar":
            k = rng.int(0, len(deck))
            orders.append(["cortar", k])
            deck = deck[k:] + deck[:k]
        elif kind == "juntar":
            others = [rng.pick(names) for _ in range(rng.int(0, 4))]
            orders.append(["juntar", others])
            deck = list(dict.fromkeys(deck + others))
        else:
            orders.append(["largo"])
    return [postcards, orders]
wrong:
  - |
    class Deck:
        def __init__(self, postcards=()): self.postcards = list(postcards)
        def __len__(self): return len(self.postcards)
        def __getitem__(self, i): return Deck(self.postcards[i]) if isinstance(i, slice) else self.postcards[i]
        def __iter__(self): return iter(self.postcards)
        def __contains__(self, postcard): return postcard in self.postcards
        def __add__(self, other): return Deck(self.postcards + other.postcards)


    def run_deck(postcards, orders):
        deck = Deck(postcards)
        results = []
        for order, *arg in orders:
            if order == "largo":
                results.append(len(deck))
            elif order == "ver":
                results.append(deck[arg[0]])
            elif order == "tiene":
                results.append(arg[0] in deck)
            elif order == "cortar":
                deck = deck[arg[0]:] + deck[:arg[0]]
            else:
                deck = deck + Deck(arg[0])
        return results + [list(deck)]
  - |
    class Deck:
        def __init__(self, postcards=()): self.postcards = list(dict.fromkeys(postcards))
        def __len__(self): return len(self.postcards)
        def __getitem__(self, i): return self.postcards[i]
        def __iter__(self): return iter(self.postcards)
        def __contains__(self, postcard): return postcard in self.postcards
        def __add__(self, other): return Deck(self.postcards + other.postcards)


    def run_deck(postcards, orders):
        deck = Deck(postcards)
        results = []
        for order, *arg in orders:
            if order == "largo":
                results.append(len(deck))
            elif order == "ver":
                results.append(deck[arg[0]])
            elif order == "tiene":
                results.append(arg[0] in deck)
            elif order == "cortar":
                deck = deck[arg[0]:] + deck[:arg[0]]
            else:
                deck = deck + Deck(arg[0])
        return results + [list(deck)]
  - |
    class Deck:
        def __init__(self, postcards=()): self.postcards = list(postcards)
        def __len__(self): return len(self.postcards)
        def __getitem__(self, i): return Deck(self.postcards[i]) if isinstance(i, slice) else self.postcards[i]
        def __iter__(self): return iter(self.postcards)
        def __contains__(self, postcard): return postcard in self.postcards
        def __add__(self, other): return Deck(self.postcards + [p for p in other.postcards if p not in self.postcards])


    def run_deck(postcards, orders):
        deck = Deck(postcards)
        results = []
        for order, *arg in orders:
            if order == "largo":
                results.append(len(deck))
            elif order == "ver":
                results.append(deck[arg[0]])
            elif order == "tiene":
                results.append(arg[0] in deck)
            elif order == "cortar":
                deck = deck[arg[0]:] + deck[:arg[0]]
            else:
                deck = deck + Deck(arg[0])
        return results + [list(deck)]
```

## Final mission

```exercise
id: py13-mision-bovedas
type: mission
title: The vaults of the old house
prompt: |
  **Write the context manager `open_vault()`, which opens a vault's door on the way in and closes it on the way out no matter what, and use it to take the piece out of each vault in the `vaults` list.**

  Behind the arcade there's a corridor, and below it, the vaults of the old house, each one with its door closed. `vaults` is the list of the doors' **columns** to visit, from west to east; `go_to(column)` is already written and leaves Quilla in the corridor, right above that door, facing east.

  `open_vault()`, with `@contextmanager` or with a class with `__enter__` and `__exit__`:

  - **on the way in**: turns towards the door (south), opens it with `robot.open_door()` (it opens the one in front) and moves forward 2 tiles, to the back of the vault;
  - **on the way out, even if there was an error**: turns around, moves forward 2 to the corridor, closes with `robot.close_door()` (it closes the one below) and ends up facing east.

  Inside the `with`, `robot.take()` picks up the piece and returns its name, or `None` if the vault is empty. If it's empty, raise `EmptyVault(column)`; catch it **outside** the `with` and write the column down in `missing`. An empty vault can't leave its door open: Hortensia has an alarm.
visual:
  figure:
    title: One vault, step by step
    panes:
      - { label: the corridor and the vaults, grid: ["############", "#R.........#", "###P###P#P##", "###a###.#b##", "############"], marks: ["3,2", "7,2", "9,2"] }
      - { label: with open_vault(), table: { head: ["moment", "Quilla"], rows: [["on the way in", "turns south, opens, moves 2"], ["inside", "take(); if it's None, raise EmptyVault"], ["on the way out (always)", "turns around, moves 2, closes, faces east"]] } }
starter: |
  from contextlib import contextmanager


  class EmptyVault(Exception):
      """A vault that should have held a piece was empty."""


  def go_to(column):
      """Walks along the corridor until it's right above that door, facing east."""
      robot.forward(column - robot.position.x)


  missing = []

  # TODO: write open_vault()

  # TODO: for each column in vaults: go_to, and inside a try, the with
solution: |
  from contextlib import contextmanager


  class EmptyVault(Exception):
      """A vault that should have held a piece was empty."""


  def go_to(column):
      """Walks along the corridor until it's right above that door, facing east."""
      robot.forward(column - robot.position.x)


  @contextmanager
  def open_vault():
      robot.turn_right()
      robot.open_door()
      robot.forward(2)
      try:
          yield
      finally:
          robot.turn_right()
          robot.turn_right()
          robot.forward(2)
          robot.close_door()
          robot.turn_right()


  missing = []
  for column in vaults:
      go_to(column)
      try:
          with open_vault():
              if robot.take() is None:
                  raise EmptyVault(column)
      except EmptyVault:
          missing.append(column)
hints:
  - "Facing east, `turn_right()` leaves you facing south, towards the door. Back in the corridor you're facing north: another `turn_right()` leaves you facing east."
  - "Put the way-out part in the `finally` of a `try:` wrapped around the `yield`. Otherwise the `raise EmptyVault` jumps right over it and Quilla is left locked in with the door open."
world:
  theme: barranco
  level: 3
  dir: E
  api: [move, cargo, openDoor, closeDoor]
  items: { a: 1863 sol, b: 1866 llama stamp, c: 1864 medio sol, d: 1880 peseta }
  map: |
    ############
    #R.........#
    ###P###P#P##
    ###a###.#b##
    ############
globals:
  vaults: [3, 7, 9]
scenarios:
  - tests:
      - name: takes out the sol and the llama
        state: 'w.inventory == ["1863 sol", "1866 llama stamp"]'
      - name: writes down the empty vault
        expect: missing == [7]
  - map: |
      #############
      #R..........#
      ##P#P###P#P##
      ##c#.###a#b##
      #############
    globals:
      vaults: [2, 4, 8, 10]
    tests:
      - name: takes out the three pieces in order
        state: 'w.inventory == ["1864 medio sol", "1863 sol", "1866 llama stamp"]'
      - name: writes down the empty vault
        expect: missing == [4]
  - map: |
      ############
      #R.........#
      ####P#P#P###
      ####.#.#d###
      ############
    globals:
      vaults: [4, 6, 8]
    tests:
      - name: takes out the peseta
        state: 'w.inventory == ["1880 peseta"]'
      - name: writes down the two empty vaults in a row
        expect: missing == [4, 6]
tests:
  - name: all the doors end up closed
    state: w.open_doors == 0
    msg: Some vault was left open. Is the closing in a finally, so it runs even if there's an EmptyVault?
  - name: ends in the corridor facing east
    state: 'w.y == 1 and w.dir == "E"'
  - name: without crashing
    state: not w.crashed
  - name: uses a context manager
    source: '@contextmanager|def\s+__enter__'
  - name: goes in with with open_vault()
    source: '\bwith\s+open_vault\s*\('
  - name: closing doesn't depend on everything going well
    source: '\bfinally\s*:|def\s+__exit__'
```

## Expert challenge

```exercise
id: py13-reto-serie
type: challenge
title: The series of years
visual:
  figure:
    title: Series(1860, 1931, 10), like a handmade range
    input: { label: Series(1860, 1931, 10), cells: ["1860", "1870", "1880", "1890", "1900", "1910", "1920", "1930"] }
    arrow: "len, [i], [a:b:c], in, ==, hash"
    output: { label: "series[2:6:2]", cells: ["1880", "1900"] }
prompt: |
  **Write the `Series(start, stop, step)` class, which behaves like `range` (with a positive `step`) without using `range` or storing the numbers in a list.** For people who already code.

  Hortensia catalogues her coins by series of years: from 1860 to 1930, in steps of 10. A `Series` must:

  - give its length with `len` and be false if it's empty (`Series(5, 1, 2)` is);
  - answer `series[i]` with negative indexes, and raise `IndexError` out of range;
  - answer `series[a:b:c]` (with a positive `c` or no `c`) with **another `Series`**;
  - be walked with `for` and answer `x in series` **without walking it** (`10**12 in Series(0, 10**13, 2)` has to be instant);
  - be equal to another one if it has the same numbers (`Series(1, 2, 5) == Series(1, 3, 7)`, both are just `1`), with the same `hash` in that case.

  `slice.indices(n)` turns a slice into `(start, stop, step)` for a sequence of length `n`.
starter: |
  class Series:
      def __init__(self, start, stop, step=1):
          self.start = start
          self.stop = stop
          self.step = step


  series = Series(1860, 1931, 10)
  print(len(series), series[-1], 1900 in series, list(series[2:6:2]))
solution: |
  class Series:
      def __init__(self, start, stop, step=1):
          self.start = start
          self.stop = stop
          self.step = step

      def __len__(self):
          return max(0, (self.stop - self.start + self.step - 1) // self.step)

      def __getitem__(self, i):
          if isinstance(i, slice):
              begin, end, stride = i.indices(len(self))
              how_many = max(0, (end - begin + stride - 1) // stride)
              first = self.start + begin * self.step
              return Series(first, first + how_many * stride * self.step, stride * self.step)
          if i < 0:
              i += len(self)
          if not 0 <= i < len(self):
              raise IndexError("out of the series")
          return self.start + i * self.step

      def __iter__(self):
          current = self.start
          while current < self.stop:
              yield current
              current += self.step

      def __contains__(self, x):
          return self.start <= x < self.stop and (x - self.start) % self.step == 0

      def _key(self):
          length = len(self)
          if length == 0:
              return (0,)
          if length == 1:
              return (1, self.start)
          return (length, self.start, self.step)

      def __eq__(self, other):
          return self._key() == other._key()

      def __hash__(self):
          return hash(self._key())


  series = Series(1860, 1931, 10)
  print(len(series), series[-1], 1900 in series, list(series[2:6:2]))
hints:
  - "The length is how many steps fit: `max(0, (stop - start + step - 1) // step)`. With that, `series[i]` is `start + i * step`."
  - "Two series are equal if they have the same length and, when they aren't empty, the same first number and (if they have more than one) the same step. Use that same tuple for `__hash__`."
tests:
  - name: walks like range
    expect: list(Series(1860, 1931, 10)) == list(range(1860, 1931, 10))
  - name: len
    expect: len(Series(1860, 1931, 10)) == 8 and len(Series(0, 10, 3)) == 4
  - name: empty is false
    expect: not Series(5, 1, 2) and not Series(5, 5) and Series(5, 6)
  - name: indexes, negative ones too
    expect: Series(1860, 1931, 10)[0] == 1860 and Series(1860, 1931, 10)[-1] == 1930 and Series(1860, 1931, 10)[-8] == 1860
  - name: out of range is IndexError
    expect: 'len(list(__import__("itertools").islice(type("View", (), {"__getitem__": lambda self, i: Series(0, 8)[i]})(), 20))) == 8'
    msg: "With an index out of range, raise IndexError: that's how for, list and in know where a sequence ends."
  - name: in without walking
    expect: 1900 in Series(1860, 1931, 10) and 1905 not in Series(1860, 1931, 10) and 1940 not in Series(1860, 1931, 10) and 10**12 in Series(0, 10**13, 2)
  - name: a slice is another Series
    expect: type(Series(0, 10)[1:3]) == Series
  - name: slices like range's
    expect: 'all(list(Series(3, 50, 4)[a:b:c]) == list(range(3, 50, 4)[a:b:c]) for a in [None, 0, 2, -3, 20] for b in [None, 5, -1, 40] for c in [None, 1, 2, 5])'
  - name: equality by the numbers
    expect: Series(1, 2, 5) == Series(1, 3, 7) and Series(0, 0) == Series(5, 5, 2) and Series(0, 10, 2) != Series(0, 10, 3)
  - name: equal ones have the same hash
    expect: hash(Series(1, 2, 5)) == hash(Series(1, 3, 7)) and hash(Series(0, 9, 3)) == hash(Series(0, 7, 3)) and len({Series(0, 0), Series(4, 2)}) == 1
  - name: without range
    sourceNot: '\brange\s*\('
```
