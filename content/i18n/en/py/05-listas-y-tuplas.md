# Session 5 — Lists and tuples

## The job

Maru sent Quilla up north, to Huanchaco, where fishermen still go out to sea on **caballitos de totora**, little reed boats, just like two thousand years ago. Don Nicanor Ucañán's cooperative has a modern problem: every morning ten, fifteen reed boats come in with their catch, and nobody knows in what order they arrived, how much each one brought or who gets the next box of ice.

Doña Felícita, the treasurer, writes everything down in a notebook with soggy pages. Quilla already knows how to keep one value in a variable; today it learns to keep **many in a row**: the list of boxes, the line of boats on the sand, the pairs of kilos and fisherman. And it learns something doña Felícita learned the hard way: two names can point to the same notebook.

```scene
theme: barranco
level: 2
dir: E
caption: Quilla walks down the Huanchaco pier to the cooperative's hut, where doña Felícita is waiting.
map: |
  ############
  #R....######
  #####.....D#
  ############
program: |
  robot.forward(4)
  robot.turn_right()
  robot.forward(1)
  robot.turn_left()
  robot.forward(5)
  robot.say("I brought a list")
  robot.deliver("New notebook")
```

## The minimum

A **list** keeps several values in order, between square brackets. Each one has a **position** (its index) that starts at **0**. **Negative** indexes count from the end: `-1` is the last one. And a **slice** (`items[a:b]`) copies the stretch from `a` up to **just before** `b`; a third number, `items[a:b:step]`, skips several at a time.

```py run
boats = ["Nico", "Tato", "Lucho", "Pepe", "Moncho"]
print(boats[0], boats[-1], len(boats))
print(boats[1:3], boats[:2], boats[3:])
print(boats[::2], boats[::-1])
```

Watch the line of boats: the highlighted box is the one being read at each step.

```anim
title: Indexes and slices
code: |
  row = ["Nico", "Tato", "Lucho", "Pepe", "Moncho"]
  read = row[0]
  read = row[2]
  read = row[-1]
  read = row[-2]
  stretch = row[1:4]
  evens = row[::2]
cells: { of: row, at: read }
notes:
  2: "Index 0 is the first in the row."
  3: "Index 2 is the third: counting starts at 0."
  4: "-1 is the last one, without knowing how many there are."
  5: "-2 is the second to last."
  6: "row[1:4] copies indexes 1, 2 and 3. 4 is left out."
  7: "With step 2 it takes every other one, starting at 0."
```

A list **changes**: things get added to it and taken out.

- `append(x)` adds at the end; `insert(i, x)` puts `x` at position `i` and shifts the rest.
- `pop()` takes out the last one and returns it; `pop(i)` takes out the one at position `i`. `remove(x)` deletes the first `x` it finds.
- `x in items` asks whether it's there: `True` or `False`.
- `len`, `sum`, `min` and `max` summarise a list of numbers.
- `items.sort()` **sorts the same list** and returns nothing; `sorted(items)` **returns a new** sorted list and leaves the original as it was.

```py run
kilos = [12, 7, 20, 7]
kilos.append(15)
first = kilos.pop(0)
print(first, kilos, 20 in kilos)
print(sorted(kilos), kilos, sum(kilos), min(kilos), max(kilos))
```

> **Common trap:** `kilos = kilos.sort()` leaves `kilos` as `None`. `sort()` sorts the list in place and returns `None`, and that line stores exactly that `None`. Write `kilos.sort()` on its own, or `in_order = sorted(kilos)` if you want to keep the original.

Now the most important thing today, and it's what you saw in session 1: a name is a label, not a box. With a list you can tell: the variable doesn't **contain** the list, it **points to** it. If you write `other = notebook`, you don't make a photocopy; you stick a second name on the same notebook. To have a separate list, copy it with `.copy()`.

```anim
title: Two names, one list
code: |
  notebook = [31, 17, 44]
  other = notebook
  duplicate = notebook.copy()
  other.append(52)
  print(notebook, duplicate)
  print(other is notebook, duplicate is notebook)
show: [notebook, other, duplicate]
refs: all
caption: "`is` asks whether two names reach the same box: whether their arrows end at the same object."
notes:
  1: "notebook points to a list with three numbers."
  2: "other is not a new list: it's a second arrow to the same notebook."
  3: "duplicate really is a new list, with the same values and its own arrow."
  4: "Something is added through other… and notebook changes too, because it's the same list."
  6: "is asks whether two names point to the same object: True for other, False for duplicate."
```

A **tuple** is like a list that doesn't change: it goes between parentheses (or just with commas) and is for data that travels together, like `(kilos, fisherman)`. Tuples and lists can be **unpacked**: each value goes to its name, and a name with `*` takes whatever is left over. That's also how you swap two variables, without a helper.

```py run
weighing = (18, "Tato")
kilos, fisherman = weighing
first, *rest = [9, 4, 12, 6]
a, b = "Nico", "Lucho"
a, b = b, a
print(fisherman, kilos, first, rest, a, b)
```

<!-- legacy: list-copy -->

<!-- legacy: unpacking-star -->

<!-- legacy: sorted -->

<!-- mdn: list-copy unpacking-star sorted -->

## Practice

```exercise
id: py5-predice-tajadas
type: predict
title: The line on the sand
prompt: |
  The reed boats rest on the sand in the order they arrived. What does it print?
visual:
  figure:
    panes:
      - { label: row, cells: ["Nico", "Tato", "Lucho", "Pepe", "Moncho", "Chalo"] }
code: |
  row = ["Nico", "Tato", "Lucho", "Pepe", "Moncho", "Chalo"]
  print(row[-2], row[2])
  print(row[1:4])
  print(row[::3])
options:
  - "Moncho Lucho\n['Tato', 'Lucho', 'Pepe']\n['Nico', 'Pepe']"
  - "Moncho Tato\n['Tato', 'Lucho', 'Pepe']\n['Nico', 'Pepe']"
  - "Moncho Lucho\n['Tato', 'Lucho', 'Pepe', 'Moncho']\n['Nico', 'Pepe']"
  - "Pepe Lucho\n['Tato', 'Lucho', 'Pepe']\n['Lucho', 'Chalo']"
answer: "Moncho Lucho\n['Tato', 'Lucho', 'Pepe']\n['Nico', 'Pepe']"
explain: |
  `-2` is the second to last (Moncho) and `2` is the third (Lucho), because counting starts at 0. `[1:4]` takes indexes 1, 2 and 3: 4 is left out. `[::3]` starts at 0 and jumps three at a time: indexes 0 and 3.
```

```exercise
id: py5-predice-copia
type: predict
title: Doña Felícita's notebook
prompt: |
  Doña Felícita hands her list of boxes to Quilla so it can "work on a copy". What does it print?
code: |
  boxes = [31, 17, 44]
  quillas = boxes
  backup = boxes.copy()
  quillas.remove(17)
  backup.append(60)
  print(boxes)
  print(len(quillas), len(backup))
options:
  - "[31, 44]\n2 4"
  - "[31, 17, 44]\n2 4"
  - "[31, 44, 60]\n2 4"
  - "[31, 44]\n2 3"
answer: "[31, 44]\n2 4"
explain: |
  `quillas = boxes` copies nothing: they're two names for the same list, so removing 17 through `quillas` removes it from doña Felícita's notebook. `backup` really is another list: the 60 only reaches it, and it ends up with 4 boxes.
```

```exercise
id: py5-predice-ordenar
type: predict
title: Sorting without losing the list
prompt: |
  Quilla wants to see the kilos from smallest to largest. What does it print?
code: |
  kilos = [14, 9, 22]
  in_order = sorted(kilos)
  print(kilos, in_order)
  result = kilos.sort()
  print(kilos, result)
options:
  - "[14, 9, 22] [9, 14, 22]\n[9, 14, 22] None"
  - "[9, 14, 22] [9, 14, 22]\n[9, 14, 22] [9, 14, 22]"
  - "[14, 9, 22] [9, 14, 22]\n[14, 9, 22] [9, 14, 22]"
  - "[14, 9, 22] [9, 14, 22]\n[9, 14, 22] [9, 14, 22]"
answer: "[14, 9, 22] [9, 14, 22]\n[9, 14, 22] None"
explain: |
  `sorted()` returns a new list and doesn't touch `kilos`. `kilos.sort()` does sort it in place, but returns `None`: that's why `result` ends up with no value.
```

```exercise
id: py5-completa-hielo
type: complete
title: The ice queue
prompt: |
  At the hut there's a queue for the boxes of ice. Fill in the `___` so that this happens, in order:

  1. **Chalo** arrives and goes to the end;
  2. **Moncho**, who brings fish for the school, is put in front of everyone (position 0);
  3. the **first** in the queue is served, and is kept in `served`;
  4. **Pepe** gets tired and leaves the queue.
visual:
  figure:
    input: { label: "queue at the start", cells: ["Tato", "Pepe", "Lucho"] }
    arrow: "append, insert, pop(0), remove"
    output: { label: "queue at the end", cells: ["Tato", "Lucho", "Chalo"] }
starter: |
  queue = ["Tato", "Pepe", "Lucho"]
  queue.___("Chalo")
  queue.insert(___, "Moncho")
  served = queue.___
  queue.___("Pepe")
  print(served, queue)
solution: |
  queue = ["Tato", "Pepe", "Lucho"]
  queue.append("Chalo")
  queue.insert(0, "Moncho")
  served = queue.pop(0)
  queue.remove("Pepe")
  print(served, queue)
hints:
  - "`pop()` with nothing takes out the **last** one; to take out the first, give it the position: `pop(0)`."
  - "`remove` searches by **value** (\"Pepe\"), not by position."
tests:
  - name: Moncho was served
    expect: 'served == "Moncho"'
  - name: the queue ends as Tato, Lucho, Chalo
    expect: 'queue == ["Tato", "Lucho", "Chalo"]'
  - name: prints who was served and the queue
    output: "Moncho ['Tato', 'Lucho', 'Chalo']"
```

```exercise
id: py5-arregla-ultimo
type: fix
title: The last box
prompt: |
  Quilla wants to announce how many kilos **the last** boat to arrive brought, and the program crashes with an `IndexError`. Run it, read the error and fix it so it works with any number of boats (don't write `kilos[3]`).
starter: |
  kilos = [12, 7, 20, 15]
  last = kilos[len(kilos)]
  print(f"The last one brought {last} kilos")
solution: |
  kilos = [12, 7, 20, 15]
  last = kilos[-1]
  print(f"The last one brought {last} kilos")
hints:
  - "With 4 elements, the indexes go from 0 to 3. `len(kilos)` is 4: a position that doesn't exist."
  - "Index `-1` is always the last one."
tests:
  - name: last is 15
    expect: last == 15
  - name: announces the kilos
    output: The last one brought 15 kilos
  - name: doesn't use a fixed index
    sourceNot: 'kilos\[\s*3\s*\]'
    msg: Use an index that works for any length, like -1.
```

```exercise
id: py5-predice-desempaca
type: predict
title: The day's weighing
prompt: |
  Each weighing arrives as a tuple. What does it print?
code: |
  weighing = ("Lucho", 9, 14, 6, 11)
  fisherman, first, *rest = weighing
  largest, smallest = max(rest), min(rest)
  largest, smallest = smallest, largest
  print(fisherman, first, rest, largest)
options:
  - "Lucho 9 [14, 6, 11] 6"
  - "Lucho 9 [14, 6, 11] 14"
  - "Lucho 9 (14, 6, 11) 6"
  - "Lucho 9 14 6"
answer: "Lucho 9 [14, 6, 11] 6"
explain: |
  `fisherman` takes the first, `first` the second, and `*rest` takes everything else **as a list**, even though it comes from a tuple. Then `largest, smallest = smallest, largest` swaps them: `largest` ends up being 6.
```

```exercise
id: py5-escribe-resumen
type: write
title: The boat's summary
prompt: |
  Write `summary(kilos)`, which receives the kilos of each box from one boat and **returns a tuple** `(boxes, total, heaviest)`: how many boxes it brought, how many kilos they add up to and how much the heaviest one weighed. If it brought nothing, return `(0, 0, 0)`.

  Then unpack the result of `summary([12, 7, 20])` into three variables and print `3 boxes, 39 kg, the heaviest 20`.
visual:
  figure:
    input: { label: kilos, cells: [12, 7, 20] }
    arrow: "len, sum, max"
    output: { label: returns, value: "(3, 39, 20)" }
starter: |
  def summary(kilos):
      return 0

solution: |
  def summary(kilos):
      if not kilos:
          return 0, 0, 0
      return len(kilos), sum(kilos), max(kilos)


  boxes, total, heaviest = summary([12, 7, 20])
  print(f"{boxes} boxes, {total} kg, the heaviest {heaviest}")
hints:
  - "`return len(kilos), sum(kilos), max(kilos)` already returns a tuple: the commas build it."
  - "`max([])` raises an error: check first whether the list is empty (`if not kilos:`)."
tests:
  - name: three boxes
    run: summary([12, 7, 20])
    equals: [3, 39, 20]
  - name: a single box
    run: summary([8])
    equals: [1, 8, 8]
  - name: no catch
    run: summary([])
    equals: [0, 0, 0]
  - name: returns a tuple
    expect: type(summary([5, 1])) == tuple
    msg: Return the three values separated by commas, without square brackets.
  - name: prints the summary
    output: 3 boxes, 39 kg, the heaviest 20
  - name: unpacks into three variables
    source: '^\w+\s*,\s*\w+\s*,\s*\w+\s*=\s*summary\('
```

## The case

```exercise
id: py5-caso-caja
type: case
title: The box that moved
prompt: |
  **After each robot's work, print which box ended up first in `log` and compare it with what that robot says it saw.** One of them moved the boxes in the original log.

  In the cooperative's `log`, the day's boxes go in the order they arrived, and the first one, **31**, is don Nicanor's: the one that gets sold first at the market. At closing time box 31 was no longer first and don Nicanor lost his turn. Four helper robots used the log that morning, one after another, and they all swear they worked on **their own copy**.

  Each robot's code is in the editor, just as they wrote it. After each block print a line that starts with its name, like `print("Cojinova:", log[0])`, and the board will tell you who doesn't add up. If after a robot you still don't see why, print the whole `log`.
visual:
  board:
    for: py5-caso-caja
    task: "After each block, print log[0]. What each robot says is what it saw in the log when it finished."
    cards:
      - name: Cojinova
        kind: robot
        role: Sorts the boxes for the scale
        rows: [["Did", "its list sorted by number"], ["Says log[0] ended up as", "31"]]
        clue: { find: "Cojinova", says: 31, saysLabel: Says }
      - name: Lorna
        kind: robot
        culprit: true
        role: Builds the market line
        rows: [["Did", "moved the last box to the front"], ["Says log[0] ended up as", "31"]]
        clue: { find: "Lorna", says: 31, saysLabel: Says }
      - name: Pejerrey
        kind: robot
        role: Checks from the end to the start
        rows: [["Did", "its list reversed"], ["Says log[0] ended up as", "28"], ["Said", "\"When I got there, 28 was already first\""]]
        clue: { find: "Pejerrey", says: 28, saysLabel: Says }
      - name: Chita
        kind: robot
        role: Writes down the boxes that arrive late
        rows: [["Did", "added box 60 to its list"], ["Says log[0] ended up as", "28"]]
        clue: { find: "Chita", says: 28, saysLabel: Says }
      - name: Morning log
        kind: note
        role: How doña Felícita left it
        rows: [["Order of arrival", "31, 17, 44, 52, 28"], ["First box", "31 (don Nicanor)"]]
starter: |
  log = [31, 17, 44, 52, 28]

  # Cojinova
  cojinova_list = log.copy()
  cojinova_list.sort()
  # TODO: print "Cojinova:" and log[0]

  # Lorna
  lorna_list = log
  last = lorna_list.pop()
  lorna_list.insert(0, last)
  # TODO: print "Lorna:" and log[0]

  # Pejerrey
  pejerrey_list = log[:]
  pejerrey_list.reverse()
  # TODO: print "Pejerrey:" and log[0]

  # Chita
  chita_list = list(log)
  chita_list.append(60)
  # TODO: print "Chita:" and log[0]
solution: |
  log = [31, 17, 44, 52, 28]

  cojinova_list = log.copy()
  cojinova_list.sort()
  print("Cojinova:", log[0])

  lorna_list = log
  last = lorna_list.pop()
  lorna_list.insert(0, last)
  print("Lorna:", log[0])

  pejerrey_list = log[:]
  pejerrey_list.reverse()
  print("Pejerrey:", log[0])

  chita_list = list(log)
  chita_list.append(60)
  print("Chita:", log[0])
answer: Lorna
answerLabel: Which robot moved the boxes in the log?
reveal: |
  Lorna. `lorna_list = log` copied nothing: it gave the same log another name. By taking box 28 off the end and putting it at position 0, it moved it in doña Felícita's notebook. Cojinova (`.copy()`), Pejerrey (`[:]`) and Chita (`list(...)`) did work on copies; Pejerrey and Chita only reported what they found.
hints:
  - "Look for each robot's line that creates its list: `.copy()`, `[:]` and `list(...)` make a new list; a plain `=` doesn't."
  - "If you print the whole `log` after Lorna you'll see `[28, 31, 17, 44, 52]`."
```

## The judge

As in session 4, the judge **calls your function** with different arguments and compares what it returns. The lists your function receives arrive as Python lists; if the judge expects a tuple, a list with the same values also counts.

```exercise
id: py5-juez-rotar
type: judge
mode: function
function: shift_row
title: The tide shifts the row
prompt: |
  **Write `shift_row(row, k)`, which returns how the row of reed boats looks after `k` tides.**

  On Huanchaco beach the reed boats lean in a row against the wall. Every time the tide comes in, the fishermen shift the row **one spot to the right**: everyone moves along one, and the one at the right end wraps around and ends up first on the left. `row` goes from left to right.

  Return a new list; don't change the one you receive. `k` can be larger than the number of boats, and the beach can be empty.

  **Constraints:** 0 to 30 boats · 0 ≤ k ≤ 1000.
visual:
  figure:
    title: Example 1, tide by tide
    panes:
      - { label: "row at dawn", cells: ["Nico", "Tato", "Lucho", "Pepe"] }
      - { label: "after 1 tide", cells: ["Pepe", "Nico", "Tato", "Lucho"] }
      - { label: "after 2 tides: shift_row returns", cells: ["Lucho", "Pepe", "Nico", "Tato"] }
    caption: "With 4 boats, 4 tides leave the row unchanged: shifting 6 is the same as shifting `6 % 4 = 2`."
starter: |
  def shift_row(row, k):
      return row
solution: |
  def shift_row(row, k):
      if not row:
          return []
      k = k % len(row)
      if k == 0:
          return row.copy()
      return row[-k:] + row[:-k]
hints:
  - "Shifting `len(row)` times leaves everything the same, so `k % len(row)` is enough. Careful: with an empty row, `% 0` is an error."
  - "The last `k` move to the front: `row[-k:]` are those, and `row[:-k]` all the others. Watch out for `k == 0`: `row[-0:]` is the whole row."
samples:
  - args: [["Nico", "Tato", "Lucho", "Pepe"], 2]
    returns: ["Lucho", "Pepe", "Nico", "Tato"]
    note: The drawing above.
  - args: [["Nico", "Tato", "Lucho", "Pepe"], 6]
    returns: ["Lucho", "Pepe", "Nico", "Tato"]
    note: Six tides with four boats are like two.
  - args: [["Moncho", "Chalo", "Pepe"], 1]
    returns: ["Pepe", "Moncho", "Chalo"]
edge:
  - args: [[], 5]
    tag: with an empty beach
  - args: [["Nico", "Tato", "Lucho"], 0]
    tag: when the tide doesn't come in
  - args: [["Nico", "Tato", "Lucho"], 3]
    tag: when k equals the length of the row
  - args: [["Tato"], 999]
    tag: with a single boat
  - args: [["Nico", "Tato", "Lucho", "Pepe", "Moncho"], 7]
    tag: when k is larger than the row
random:
  count: 40
  seed: 51
  generate: |
    names = ["Nico", "Tato", "Lucho", "Pepe", "Moncho", "Chalo", "Beto", "Juancho", "Lalo", "Cucho"]
    n = rng.int(0, 30)
    row = [rng.pick(names) + str(i) for i in range(n)]
    k = rng.int(0, 3 * n + 2) if rng.int(0, 1) == 0 else rng.int(0, 1000)
    return [row, k]
wrong:
  - |
    def shift_row(row, k):
        if not row:
            return []
        k = k % len(row)
        return row[k:] + row[:k]
  - |
    def shift_row(row, k):
        if not row or k == 0:
            return list(row)
        return row[-k:] + row[:-k]
  - |
    def shift_row(row, k):
        k = k % len(row)
        return row[-k:] + row[:-k]
```

```exercise
id: py5-juez-juntar
type: judge
mode: function
function: merge_weighings
title: The two scales
prompt: |
  **Write `merge_weighings(morning, afternoon)`, which merges the weighings from both scales into a single list sorted by kilos, from smallest to largest.**

  The cooperative has two scales, and each one hands over its list of weighings **already sorted by kilos**. Each weighing is a pair `[kilos, fisherman]`. Doña Felícita wants a single list for the market, and she has a rule for ties: if two weighings have the same kilos, **the one from the morning scale goes first**, and within one scale the order they came in is kept (even if the fishermen's names aren't in alphabetical order).

  Return a list of pairs (lists or tuples, either is fine).

  **Constraints:** each scale has 0 to 20 weighings · 1 ≤ kilos ≤ 30.
visual:
  figure:
    title: Example 1, pair by pair
    panes:
      - { label: morning, cells: ["(5, Tato)", "(9, Nico)", "(9, Beto)"] }
      - { label: afternoon, cells: ["(4, Pepe)", "(9, Ana)", "(12, Lucho)"] }
      - { label: "merge_weighings returns", cells: ["(4, Pepe)", "(5, Tato)", "(9, Nico)", "(9, Beto)", "(9, Ana)", "(12, Lucho)"], highlight: [2, 3, 4] }
    caption: "Three 9-kilo weighings: first the two from the morning, in their order (Nico before Beto), then the one from the afternoon. Ana doesn't go first even though her name does."
starter: |
  def merge_weighings(morning, afternoon):
      return morning
solution: |
  def merge_weighings(morning, afternoon):
      merged = []
      i = j = 0
      while i < len(morning) and j < len(afternoon):
          if morning[i][0] <= afternoon[j][0]:
              merged.append(morning[i])
              i += 1
          else:
              merged.append(afternoon[j])
              j += 1
      merged.extend(morning[i:])
      merged.extend(afternoon[j:])
      return merged
hints:
  - "Keep a finger on each list (`i` and `j`). Compare the kilos of the two weighings they point to, add the smaller one and move that finger along."
  - "In a tie the morning wins: use `<=`. When one list runs out, what's left of the other goes in as is: `morning[i:]`."
  - "A valid shortcut: `sorted(morning + afternoon, key=lambda pair: pair[0])` keeps the order of ties. Without `key`, it would also sort by name."
samples:
  - args: [[[5, "Tato"], [9, "Nico"], [9, "Beto"]], [[4, "Pepe"], [9, "Ana"], [12, "Lucho"]]]
    returns: [[4, "Pepe"], [5, "Tato"], [9, "Nico"], [9, "Beto"], [9, "Ana"], [12, "Lucho"]]
    note: The drawing above.
  - args: [[[3, "Chalo"], [20, "Moncho"]], [[7, "Lalo"]]]
    returns: [[3, "Chalo"], [7, "Lalo"], [20, "Moncho"]]
edge:
  - args: [[], []]
    tag: with no weighings on either scale
  - args: [[], [[2, "Pepe"], [8, "Ana"]]]
    tag: when the morning scale weighed nothing
  - args: [[[6, "Tato"], [6, "Nico"]], []]
    tag: when the afternoon scale weighed nothing
  - args: [[[10, "Zoila"]], [[10, "Ana"]]]
    tag: with a tie where the afternoon name comes first alphabetically
  - args: [[[1, "Beto"], [2, "Cucho"]], [[25, "Ana"], [30, "Lalo"]]]
    tag: when all the morning ones weigh less
random:
  count: 45
  seed: 52
  generate: |
    names = ["Ana", "Beto", "Chalo", "Cucho", "Lalo", "Lucho", "Moncho", "Nico", "Pepe", "Tato", "Zoila"]
    top = rng.pick([5, 10, 30])
    morning = [[k, rng.pick(names)] for k in sorted(rng.list(rng.int(0, 20), 1, top))]
    afternoon = [[k, rng.pick(names)] for k in sorted(rng.list(rng.int(0, 20), 1, top))]
    return [morning, afternoon]
wrong:
  - |
    def merge_weighings(morning, afternoon):
        return sorted(morning + afternoon)
  - |
    def merge_weighings(morning, afternoon):
        merged = []
        i = j = 0
        while i < len(morning) and j < len(afternoon):
            if morning[i][0] < afternoon[j][0]:
                merged.append(morning[i])
                i += 1
            else:
                merged.append(afternoon[j])
                j += 1
        merged.extend(morning[i:])
        merged.extend(afternoon[j:])
        return merged
  - |
    def merge_weighings(morning, afternoon):
        merged = []
        i = j = 0
        while i < len(morning) and j < len(afternoon):
            if morning[i][0] <= afternoon[j][0]:
                merged.append(morning[i])
                i += 1
            else:
                merged.append(afternoon[j])
                j += 1
        return merged
```

## Final mission

```exercise
id: py5-mision-malecon
type: mission
title: The boardwalk deliveries
prompt: |
  **Deliver each order to its mailbox, walking the boardwalk only once from west to east.**

  The cevicherías on the Huanchaco boardwalk bought fish from the cooperative. Doña Felícita gave Quilla the list `orders`, but she wrote it in the order she was **paid**, not in the order of the street. Each order is a pair `[cell, label]`: `cell` is the mailbox's column (the `x` on the map) and `label` is what has to be delivered.

  Quilla starts at cell `x = 1` facing east, and the **battery is just enough** to reach the last mailbox without coming back. So:

  1. sort the orders by cell (since the cell comes first in each pair, sorting the pairs already sorts them by cell);
  2. go through them unpacking each pair: `for cell, label in …`;
  3. for each one, move forward what's left to that cell (`robot.position.x` tells you where you are) and `robot.deliver(label)`.

  The list and the boardwalk change in every test.
starter: |
  # orders already exists, for example:
  # [[10, "Mullet for La Tablita"], [4, "Silverside for Don Rafo"], ...]
  print(orders)
  robot.forward(3)
solution: |
  for cell, label in sorted(orders):
      robot.forward(cell - robot.position.x)
      robot.deliver(label)
hints:
  - "`sorted(orders)` compares the pairs by their first value, the cell. It doesn't change `orders`: it returns a new list."
  - "If you're at `x = 4` and the mailbox is at cell 8, you have to move forward `8 - 4` cells."
world:
  theme: barranco
  level: 2
  dir: E
  battery: 13
  map: |
    ################
    #R..D...D.D...D#
    ################
globals:
  orders: [[10, "Mullet for La Tablita"], [4, "Silverside for Don Rafo"], [14, "Sole for El Muelle"], [8, "Weakfish for Doña Chabuca"]]
scenarios:
  - {}
  - map: |
      ############
      #R.D.....DD#
      ############
    world: { battery: 9 }
    globals: { orders: [[9, "Mackerel for Mi Choza"], [10, "Bonito for El Caracol"], [3, "Grunt for La Ola"]] }
  - map: |
      ##########
      #R......D#
      ##########
    world: { battery: 7 }
    globals: { orders: [[8, "Cojinova for Big Ben"]] }
tests:
  - name: delivers every order, in street order
    state: 'w.delivered == [label for _, label in sorted(g["orders"])]'
    msg: The deliveries didn't go out in cell order. Sort the orders before going through them.
  - name: ends at the last mailbox
    state: w.at_goal
  - name: without crashing or running out of battery
    state: not w.crashed
  - name: sorts with sorted() or sort()
    source: '\bsorted\s*\(|\.sort\s*\('
  - name: unpacks each pair in the for
    source: '\bfor\s+\w+\s*,\s*\w+\s+in\b'
    msg: Go through them with for cell, label in …, unpacking each pair.
```

## Expert challenge

```exercise
id: py5-reto-viajes
type: challenge
title: The boat's trips
visual:
  figure:
    title: "boxes = [4, 3, 5, 2, 6], capacity = 8"
    input: { label: boxes, cells: [4, 3, 5, 2, 6] }
    arrow: "loads in order until the next one doesn't fit"
    output: { label: returns, value: "[(2, 7), (2, 7), (1, 6)]" }
    steps:
      - "Trip 1: 4 + 3 = 7; the box of 5 no longer fits (that would be 12)."
      - "Trip 2: 5 + 2 = 7; the one of 6 doesn't fit."
      - "Trip 3: just the one of 6."
prompt: |
  **Write `trips(boxes, capacity)`, which returns a list of tuples `(count, kilos)`, one per trip.** For those who already code.

  A reed boat carries at most `capacity` kilos. The boxes are loaded **in the order of the list**: they go on while they fit; when the next one doesn't fit, the boat leaves with what it has and that box starts the following trip. No box weighs more than `capacity`. No boxes, no trips. Don't modify the list you receive.
starter: |
  def trips(boxes, capacity):
      return []


  print(trips([4, 3, 5, 2, 6], 8))
solution: |
  def trips(boxes, capacity):
      departures = []
      count, kilos = 0, 0
      for box in boxes:
          if kilos + box > capacity:
              departures.append((count, kilos))
              count, kilos = 0, 0
          count, kilos = count + 1, kilos + box
      if count:
          departures.append((count, kilos))
      return departures


  print(trips([4, 3, 5, 2, 6], 8))
hints:
  - "Keep the current trip as two values, `count, kilos`, and close it (append the tuple) when the incoming box doesn't fit."
  - "When the `for` ends, the last trip is still open: add it if it was carrying anything."
tests:
  - name: the example in the drawing
    run: trips([4, 3, 5, 2, 6], 8)
    equals: [[2, 7], [2, 7], [1, 6]]
  - name: everything fits in one trip
    run: trips([1, 2, 3], 10)
    equals: [[3, 6]]
  - name: boxes that fill it exactly
    run: trips([5, 5, 10, 3], 10)
    equals: [[2, 10], [1, 10], [1, 3]]
  - name: no boxes
    run: trips([], 8)
    equals: []
  - name: one box per trip
    run: trips([7, 7, 7], 7)
    equals: [[1, 7], [1, 7], [1, 7]]
  - name: returns tuples
    expect: 'all(type(t) == tuple for t in trips([2, 9, 4], 10))'
    msg: Each trip is a tuple (count, kilos), not a list.
  - name: doesn't modify the list it receives
    expect: '(lambda b: (trips(b, 5), b)[1] == [3, 3, 1])([3, 3, 1])'
```
