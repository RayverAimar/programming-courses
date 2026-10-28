# Session 15 — Recursion

## The job

Chachapoyas, Amazonas. Three hours of bends above the Utcubamba and then the cable car up to Cerro Barreta, where **Kuélap** stands: the fortress of the Chachapoyas people, with twenty-metre walls, four hundred round houses and diamond friezes in the stone. The archaeologist **Elvira Zuta Culqui** runs the restoration of its terraces, and she has three problems: staircases nobody has counted, boxes of finds packed inside other boxes, and a cave under the hill that nobody dares to walk through without a plan.

Maru sent Quilla over with its **headlamp**. The three problems have the same shape: a big thing made of the same things, only smaller. A staircase is one step plus a staircase; a box is pieces plus boxes; a cave is one tile plus the caves that branch off it. Today Quilla learns to solve a problem by **calling itself** with a smaller problem: **recursion**.

```scene
theme: mina
level: 3
dir: N
caption: The entrance gallery under Kuélap. Quilla climbs, collects the crystals on the way and reports that there are more tunnels ahead.
map: |
  ##########
  #...2.####
  ####..1..#
  ####.##R.#
  ##########
program: |
  robot.forward()
  robot.turn_left()
  robot.forward()
  robot.collect()
  robot.forward()
  robot.turn_right()
  robot.forward()
  robot.turn_left()
  robot.forward()
  robot.collect()
  robot.say("More tunnels ahead")
```

## The minimum

A **recursive** function calls itself. It always has two parts:

- the **base case**: a problem so small that the answer is known without thinking, and that's where it stops;
- the **recursive case**: it solves a little piece and hands **a smaller problem** to another call of itself.

```py run
def go_down(terrace):
    if terrace == 0:
        print("Plaza!")
        return
    print("Terrace", terrace)
    go_down(terrace - 1)

go_down(3)
```

Every call that hasn't finished yet waits on the **call stack**, with its own parameters. The stack grows until it reaches the base case and then it unwinds: each box gets what the box above returned, adds its own part and hands it to the box below.

```anim
title: The stack grows down to the base case and then unwinds
code: |
  def stones(terrace):
      if terrace == 0:
          return 0
      return terrace * 10 + stones(terrace - 1)

  total = stones(3)
  print(total)
notes:
  6: "stones(3) is asked for: terrace 3 takes 30 stones, plus those of the terraces below."
  4: "This call can't add yet: it waits for the one below to answer."
  3: "Base case: terrace 0 is the plaza, with no stones. Here the stack stops growing."
  7: "Each box added its part on the way back: 10, then 30, then 60."
```

If the base case never comes, the stack grows forever. Python cuts it off at about a thousand calls with a **`RecursionError`**: *maximum recursion depth exceeded*. It's almost always a missing base case, or a call that doesn't make the problem smaller (`go_down(terrace)` instead of `go_down(terrace - 1)`), or one that skips over the base (`n - 2` from an odd number never reaches 0).

Recursion shines with **nested** data, which has the same shape inside: a list that holds lists, a dictionary with dictionaries. A loop doesn't know how many levels there are; the recursive function enters each level by calling itself again.

```py run
def count(box):
    total = 0
    for thing in box:
        total += count(thing) if isinstance(thing, list) else 1
    return total

print(count(["pot", ["tupu", ["bead", "bead"]], "spindle"]))
```

Some recursions repeat work: `ways(n - 1)` and `ways(n - 2)` ask for the same values again and again, and the number of calls doubles with every `n`. **`@cache`** (from `functools`, you saw it in session 11) stores each result by its arguments: the second time it's asked, it answers from memory. That's **memoization**. Its arguments have to be hashable: numbers, strings, tuples.

```py run
from functools import cache

@cache
def ways(n):
    if n <= 1:
        return 1
    return ways(n - 1) + ways(n - 2)

print(ways(90))
```

Without `@cache`, `ways(90)` would take centuries. With it, it's 91 calls.

**Backtracking** is recursion for trying every option: **choose** something, **explore** what follows with that choice and **undo** it to try the next one. That's how you get every subset, every possible order or every path through a maze.

```py run
def choose(items, i, chosen):
    if i == len(items):
        print(chosen)
        return
    chosen.append(items[i])
    choose(items, i + 1, chosen)
    chosen.pop()
    choose(items, i + 1, chosen)

choose(["corn", "potato", "oca"], 0, [])
```

In a maze, Quilla **chooses** a neighbour, **explores** from there and, if it doesn't reach the exit, **takes it off** the path and tries the next one. Watch the path (highlighted) grow and shrink in the dead end:

```anim
title: Backtracking in a maze
code: |
  plan = ["######", "#R...#", "#.####", "#..D##", "######"]

  def search(x, y, seen, path):
      if plan[y][x] == "#" or (x, y) in seen:
          return False
      seen.add((x, y))
      path.append((x, y))
      if plan[y][x] == "D":
          return True
      for dx, dy in [(1, 0), (0, 1), (-1, 0), (0, -1)]:
          if search(x + dx, y + dy, seen, path):
              return True
      path.pop()
      return False

  route = []
  print(search(1, 1, set(), route), route)
grid: { map: ["######", "#R...#", "#.####", "#..D##", "######"], visited: seen, frontier: path }
show: [x, y, path]
speed: 500
notes:
  4: "Base case: rock or a tile already seen. Nothing to explore."
  8: "Base case: it reached the D. The True travels up the whole stack."
  13: "Dead end: take the tile off the path and go back."
```

> **Common trap:** writing the base case for a single value (`if n == 1:`) when the recursion can also reach 0, or a negative number. Ask yourself: which values can reach the function, and do all of them end in some base case?

<!-- mdn: recursion-limit -->

## Practice

```exercise
id: py15-predice-subir
type: predict
title: Up and down
prompt: |
  Quilla announces every terrace on the way up and on the way down. Before running it: what does it print?
code: |
  def walk(terrace):
      if terrace == 0:
          print("plaza")
          return
      print("up", terrace)
      walk(terrace - 1)
      print("down", terrace)

  walk(2)
options:
  - "up 2\nup 1\nplaza\ndown 1\ndown 2"
  - "up 2\ndown 2\nup 1\ndown 1\nplaza"
  - "up 2\nup 1\nplaza\ndown 2\ndown 1"
  - "up 2\nup 1\nplaza"
answer: "up 2\nup 1\nplaza\ndown 1\ndown 2"
explain: |
  `walk(2)` prints `up 2` and waits for `walk(1)`, which prints `up 1` and waits for `walk(0)`: `plaza`. Only then does each call finish its last line, **from the newest to the oldest**: `down 1` and then `down 2`. Whatever comes after the recursive call comes out backwards.
```

```exercise
id: py15-predice-cache
type: predict
title: How many times was it computed?
prompt: |
  `calls` counts how many times the body of `ways` really runs. What does it print?
code: |
  from functools import cache

  calls = 0

  @cache
  def ways(n):
      global calls
      calls += 1
      if n <= 1:
          return 1
      return ways(n - 1) + ways(n - 2)

  print(ways(5), calls)
  print(ways(5), calls)
options:
  - "8 6\n8 6"
  - "8 15\n8 30"
  - "8 6\n8 12"
  - "8 15\n8 15"
answer: "8 6\n8 6"
explain: |
  With `@cache`, each `n` is computed **only once**: 5, 4, 3, 2, 1 and 0, six calls. The rest are answered from memory without entering the body, and the second `ways(5)` doesn't even go in. Without `@cache` it would be 15 calls the first time and 30 at the end.
```

```exercise
id: py15-arregla-saltos
type: fix
title: The staircase two at a time
prompt: |
  Quilla climbs Kuélap's staircases two steps at a time. `jumps(steps)` should say how many jumps it makes to reach the top (if one step is left over, that's a jump too). With 8 it works, but with 7 the program crashes. Run it, read the error and fix the base case.
visual:
  figure:
    input: { label: steps, value: "7" }
    arrow: "7 → 5 → 3 → 1 → -1 → -3 → …"
    output: { label: "and the base case?", text: "steps == 0 never happens with an odd number" }
starter: |
  def jumps(steps):
      if steps == 0:
          return 0
      return 1 + jumps(steps - 2)

  print(jumps(8))
  print(jumps(7))
solution: |
  def jumps(steps):
      if steps <= 0:
          return 0
      return 1 + jumps(steps - 2)

  print(jumps(8))
  print(jumps(7))
hints:
  - "From 7 the count goes 5, 3, 1, -1, -3… and never passes through 0: the stack grows until the `RecursionError`."
  - "Make the base case catch the negatives too: `if steps <= 0:`."
tests:
  - name: jumps(8) is 4
    run: jumps(8)
    equals: 4
  - name: jumps(7) is 4
    run: jumps(7)
    equals: 4
  - name: jumps(1) is 1
    run: jumps(1)
    equals: 1
  - name: jumps(0) is 0
    run: jumps(0)
    equals: 0
  - name: prints 4 and 4
    output: "4\n4"
  - name: still recursive
    source: 'return\s+1\s*\+\s*jumps\('
```

```exercise
id: py15-completa-aplanar
type: complete
title: The beads in their pouches
prompt: |
  In a chullpa, necklace beads turned up stored in pouches, and some pouches inside others. Fill in the `___` so that `flatten(bag)` returns all the beads in a single list, in the order they appear.
visual:
  figure:
    input: { label: bag, text: "[\"spondylus\", [\"stone\", [\"bone\"]], \"copper\"]" }
    arrow: goes into every list it finds
    output: { label: returns, cells: ["spondylus", "stone", "bone", "copper"] }
starter: |
  def flatten(bag):
      beads = []
      for thing in bag:
          if isinstance(thing, ___):
              beads.___(flatten(___))
          else:
              beads.append(thing)
      return beads

  print(flatten(["spondylus", ["stone", ["bone"]], "copper"]))
solution: |
  def flatten(bag):
      beads = []
      for thing in bag:
          if isinstance(thing, list):
              beads.extend(flatten(thing))
          else:
              beads.append(thing)
      return beads

  print(flatten(["spondylus", ["stone", ["bone"]], "copper"]))
hints:
  - "`isinstance(thing, list)` asks whether `thing` is another pouch."
  - "`flatten(thing)` returns a list; `extend` adds its elements one by one (with `append` you'd put the whole list in)."
tests:
  - name: the example in the picture
    run: 'flatten(["spondylus", ["stone", ["bone"]], "copper"])'
    equals: ["spondylus", "stone", "bone", "copper"]
  - name: empty pouches
    run: 'flatten([[], [[]], "copper"])'
    equals: ["copper"]
  - name: deeply nested
    run: 'flatten([[[["gold"]]], "silver"])'
    equals: ["gold", "silver"]
  - name: prints the list
    output: "['spondylus', 'stone', 'bone', 'copper']"
```

```exercise
id: py15-escribe-andenes
type: write
title: The paths across the terraces
prompt: |
  Write `paths(rows, columns)`, which counts how many ways Quilla can go down from the north-west corner of a field of terraces to the south-east corner, **moving only east or south**.

  Think about the last tile: you reach it from the one above or from the one on the left, so `paths(r, c) = paths(r - 1, c) + paths(r, c - 1)`. With a single row or a single column there's only one path. Elvira has a 16 × 16 field: without `@cache`, the count never finishes.
visual:
  figure:
    title: "paths(3, 3) = 6; one of them:"
    panes:
      - { label: "terraces 3 × 3", grid: ["R..", "...", "..D"], path: ["0,0", "1,0", "1,1", "1,2", "2,2"] }
      - { label: returns, value: "6" }
starter: |
  def paths(rows, columns):
      return 0

  print(paths(3, 3))
solution: |
  from functools import cache


  @cache
  def paths(rows, columns):
      if rows == 1 or columns == 1:
          return 1
      return paths(rows - 1, columns) + paths(rows, columns - 1)

  print(paths(3, 3))
hints:
  - "The base case: `if rows == 1 or columns == 1: return 1`."
  - "Put `@cache` (with `from functools import cache`) above the `def`, and the function remembers every `(rows, columns)` pair."
tests:
  - name: paths(3, 3) is 6
    run: paths(3, 3)
    equals: 6
  - name: a single row
    run: paths(1, 7)
    equals: 1
  - name: paths(2, 5) is 5
    run: paths(2, 5)
    equals: 5
  - name: the 16 × 16 field, in time
    run: paths(16, 16)
    equals: 155117520
    msg: If it takes too long, @cache is missing.
  - name: it's recursive
    source: 'return\s+paths\('
```

```exercise
id: py15-escribe-ordenes
type: write
title: The order of the visits
prompt: |
  Write `visit_orders(tombs)`, which returns **every possible order** to visit the chullpas in the list, each one as a list, without using `itertools`.

  The tour group can see the chullpas in any order, and Elvira wants to compare them all. The recursive idea: each chullpa can go first, and behind it goes **every possible order of the ones left**. An empty list has a single order: `[[]]`. For the list without chullpa `i`: `tombs[:i] + tombs[i + 1:]`.
visual:
  figure:
    input: { label: tombs, cells: ["A", "B", "C"] }
    arrow: each one first, and behind it the orders of the rest
    output: { label: returns, table: { head: ["first", "orders"], rows: [["A", "A B C · A C B"], ["B", "B A C · B C A"], ["C", "C A B · C B A"]] } }
starter: |
  def visit_orders(tombs):
      return []

  print(visit_orders(["A", "B", "C"]))
solution: |
  def visit_orders(tombs):
      if not tombs:
          return [[]]
      result = []
      for i, first in enumerate(tombs):
          rest = tombs[:i] + tombs[i + 1:]
          for order in visit_orders(rest):
              result.append([first] + order)
      return result

  print(visit_orders(["A", "B", "C"]))
hints:
  - "Base case: `if not tombs: return [[]]`, a list with one empty order inside."
  - "For each `i, first in enumerate(tombs)`, go through `visit_orders(rest)` and add `[first] + order`."
tests:
  - name: three chullpas
    run: 'visit_orders(["A", "B", "C"])'
    equals: [["A", "B", "C"], ["A", "C", "B"], ["B", "A", "C"], ["B", "C", "A"], ["C", "A", "B"], ["C", "B", "A"]]
  - name: just one
    run: 'visit_orders(["Pueblo Alto"])'
    equals: [["Pueblo Alto"]]
  - name: none
    run: visit_orders([])
    equals: [[]]
  - name: five chullpas give 120 different orders
    expect: 'len({tuple(o) for o in visit_orders([1, 2, 3, 4, 5])}) == 120'
  - name: without itertools
    sourceNot: '\bitertools\b|\bpermutations\b'
```

## The case

```exercise
id: py15-caso-cajas
type: case
title: The box inside the box
prompt: |
  **Write `total_pieces(box)`, which adds up the pieces in a box and in every box it holds inside, at any depth, and compare it with what each packer reported.**

  The pieces from the Pueblo Alto sector travelled to Chachapoyas in four big boxes. Each box is a dictionary: `"pieces"` are the ones loose in it and `"inside"` is the list of smaller boxes it holds, which in turn can hold others. Some necklace beads are missing from the storeroom, and someone reported fewer pieces than there were so nobody would notice.

  `boxes` is already loaded. Print one line per packer that starts with their name: `print("Nelly:", total_pieces(boxes[0]))`, and the board will tell you whether it matches.
visual:
  board:
    for: py15-caso-cajas
    task: "Total of a box = its loose pieces + the total of every box it holds inside."
    cards:
      - name: Nelly
        kind: person
        role: Packed box PA-1
        rows: [["Boxes inside", "2 (one holds another)"], ["Reported", "14 pieces"]]
        clue: { find: "Nelly", says: 14 }
      - name: Wilder
        kind: person
        culprit: true
        role: Packed box PA-2
        rows: [["Boxes inside", "2 (and further in, two more)"], ["Reported", "12 pieces"]]
        clue: { find: "Wilder", says: 12 }
      - name: Rosmery
        kind: person
        role: Packed box PA-3
        rows: [["Boxes inside", "3"], ["Reported", "11 pieces"]]
        clue: { find: "Rosmery", says: 11 }
      - name: Eber
        kind: person
        role: Packed box PA-4
        rows: [["Boxes inside", "none"], ["Reported", "8 pieces"]]
        clue: { find: "Eber", says: 8 }
    caption: "If a box comes out with fewer pieces, check whether your function goes into **every** box inside."
globals:
  boxes:
    - label: PA-1
      pieces: 3
      inside:
        - { label: PA-1a, pieces: 5, inside: [] }
        - { label: PA-1b, pieces: 2, inside: [{ label: PA-1b-i, pieces: 4, inside: [] }] }
    - label: PA-2
      pieces: 6
      inside:
        - label: PA-2a
          pieces: 1
          inside:
            - label: PA-2a-i
              pieces: 2
              inside: [{ label: PA-2a-i-x, pieces: 7, inside: [] }]
        - { label: PA-2b, pieces: 3, inside: [] }
    - label: PA-3
      pieces: 0
      inside:
        - { label: PA-3a, pieces: 4, inside: [] }
        - { label: PA-3b, pieces: 4, inside: [] }
        - { label: PA-3c, pieces: 2, inside: [{ label: PA-3c-i, pieces: 1, inside: [] }] }
    - { label: PA-4, pieces: 8, inside: [] }
starter: |
  # boxes: the four big boxes, in the order of Nelly, Wilder, Rosmery and Eber.
  # Each one: {"label": "PA-4", "pieces": 8, "inside": [...other boxes...]}
  print(boxes[3])

  # TODO: write total_pieces(box), recursive, and print one line per packer:
  # print("Nelly:", total_pieces(boxes[0]))
solution: |
  def total_pieces(box):
      total = box["pieces"]
      for small in box["inside"]:
          total += total_pieces(small)
      return total


  packers = ["Nelly", "Wilder", "Rosmery", "Eber"]
  for name, box in zip(packers, boxes):
      print(f"{name}: {total_pieces(box)}")
answer: Wilder
answerLabel: Who reported fewer pieces than there were?
reveal: |
  Wilder. His box PA-2 holds `6 + 1 + 2 + 7 + 3 = 19` pieces, and he reported 12: he counted three levels and "forgot" the little box PA-2a-i-x, the deepest one, with its 7 beads. A loop two or three levels deep would have got it wrong the same way; the recursive function goes into every box, however deep it is.
hints:
  - "The base case needs no `if`: a box with `\"inside\": []` doesn't enter the `for` and returns just its pieces."
  - "`total = box[\"pieces\"]`, and for each `small in box[\"inside\"]`, `total += total_pieces(small)`."
```

## The judge

```exercise
id: py15-juez-escalera
type: judge
mode: function
function: ways_to_climb
title: The staircase to Pueblo Alto
prompt: |
  **Write `ways_to_climb(n, jumps, broken)`, which returns how many different ways Quilla can climb from step 0 to step `n`.**

  The staircase up to the Pueblo Alto sector has `n` steps. On each move, Quilla climbs as many steps as some number in the list `jumps` says (if `jumps` is `[1, 2]`, one at a time or two at a time). Some steps are loose, and their numbers come in `broken`: Quilla **can't step on them**, though it can jump over them. It has to end **exactly** on step `n`, not past it.

  Think from the top: to reach step `k` the last jump came from `k - s`, for each `s` in `jumps`. With `n` up to 50, without memoization it never finishes; since lists aren't hashable, put the recursive function with `@cache` **inside** `ways_to_climb`.

  **Constraints:** 0 ≤ `n` ≤ 50 · `jumps` has 1 to 3 different numbers, between 1 and 5 · `broken` are steps between 1 and `n - 1`, with no repeats (the floor and the last step are never loose).
starter: |
  def ways_to_climb(n, jumps, broken):
      return 0
solution: |
  from functools import cache


  def ways_to_climb(n, jumps, broken):
      loose = set(broken)

      @cache
      def ways(step):
          if step < 0 or step in loose:
              return 0
          if step == 0:
              return 1
          return sum(ways(step - jump) for jump in jumps)

      return ways(n)
hints:
  - "Two base cases: if `step < 0` or it's loose, 0 ways; if `step == 0`, 1 way (you've reached the floor)."
  - "Recursive case: `sum(ways(step - jump) for jump in jumps)`. With `@cache` above `def ways`, each step is counted only once."
visual:
  figure:
    title: Example 1, step by step
    input: { label: "ways_to_climb(4, [1, 2], [])", table: { head: ["step", "0", "1", "2", "3", "4"], rows: [["ways", "1", "1", "2", "3", "5"]] } }
    arrow: "ways(k) = ways(k − 1) + ways(k − 2)"
    output: { label: returns, value: "5" }
    steps:
      - "Step 0 is reached one way: without moving."
      - "Step 4 is reached from 3 (3 ways) or from 2 (2 ways): 5."
samples:
  - args: [4, [1, 2], []]
    returns: 5
    note: "1+1+1+1, 1+1+2, 1+2+1, 2+1+1 and 2+2."
  - args: [6, [1, 3], [2]]
    returns: 3
    note: "Without stepping on step 2: 3+3, 3+1+1+1 and 1+3+1+1. 1+1+… steps on 2."
edge:
  - args: [0, [1, 2], []]
    tag: with a staircase of zero steps
  - args: [1, [2], []]
    tag: when the only jump is longer than the staircase
  - args: [7, [2], []]
    tag: when the jumps don't add up to the total
  - args: [5, [1, 2], [2, 3]]
    tag: when two loose steps in a row block the way
  - args: [12, [1, 2], [11]]
    tag: with the second-to-last step loose
  - args: [10, [3, 4], []]
    tag: with no one-step jumps
  - args: [50, [1, 2, 3], []]
    tag: with the longest staircase
  - args: [50, [4, 5], [4, 5, 9, 10]]
    tag: with loose steps near the start
random:
  count: 40
  seed: 1515
  generate: |
    n = rng.int(0, 50)
    jumps = sorted(rng.shuffle([1, 2, 3, 4, 5])[:rng.int(1, 3)])
    broken = sorted({rng.int(1, n - 1) for _ in range(rng.int(0, 5))}) if n > 1 else []
    return [n, jumps, broken]
wrong:
  - |
    from functools import cache
    def ways_to_climb(n, jumps, broken):
        loose = set(broken)
        @cache
        def ways(step):
            if step <= 0 or step in loose:
                return 0
            if step == 1:
                return 1
            return sum(ways(step - jump) for jump in jumps)
        return ways(n)
  - |
    from functools import cache
    def ways_to_climb(n, jumps, broken):
        loose = set(broken)
        @cache
        def from_step(step):
            if step in loose:
                return 0
            if step >= n:
                return 1
            return sum(from_step(step + jump) for jump in jumps)
        return from_step(0)
```

```exercise
id: py15-juez-cargas
type: judge
mode: function
function: exact_loads
title: The stones for the wall
prompt: |
  **Write `exact_loads(weights, target)`, which returns every way of choosing stones whose weight adds up to exactly `target`, each one as the list of positions of the chosen stones.**

  To fill a crack in the wall, Elvira needs to bring up **exactly** `target` kilos of stone, not one more. The numbered stones wait in a row; `weights[i]` is the weight of stone `i`. Each stone can be chosen **only once**.

  - Each way is the list of chosen positions, from smallest to largest: `[0, 4]`.
  - The list of ways is sorted from smallest to largest, the way `sorted` sorts it (if you go through the stones from left to right and try choosing first, they already come out in that order).
  - If `target` is 0, the only way is to choose none: `[[]]`. If there's no way at all, return `[]`.

  It's backtracking: for each stone from position `i` on, **choose it**, keep searching from the next one and **undo** the choice.

  **Constraints:** 0 ≤ `len(weights)` ≤ 14 · each weight between 1 and 30 · 0 ≤ `target` ≤ 200.
starter: |
  def exact_loads(weights, target):
      return []
solution: |
  def exact_loads(weights, target):
      ways = []

      def build(start, chosen, total):
          if total == target:
              ways.append(list(chosen))
              return
          for i in range(start, len(weights)):
              if total + weights[i] <= target:
                  chosen.append(i)
                  build(i + 1, chosen, total + weights[i])
                  chosen.pop()

      build(0, [], 0)
      return ways
hints:
  - "An inner function `build(start, chosen, total)`: if `total == target`, store a **copy** (`list(chosen)`) and return."
  - "Otherwise, for each `i` from `start`: `chosen.append(i)`, `build(i + 1, …)`, `chosen.pop()`. With `i + 1` each stone is used once."
visual:
  figure:
    title: Example 1
    input: { label: "weights (target: 10)", cells: [5, 3, 2, 8, 5] }
    arrow: choose, go on, undo
    output: { label: returns, table: { head: ["positions", "weights"], rows: [["[0, 1, 2]", "5 + 3 + 2"], ["[0, 4]", "5 + 5"], ["[1, 2, 4]", "3 + 2 + 5"], ["[2, 3]", "2 + 8"]] } }
    caption: "Stones 0 and 4 weigh the same, but they're different stones: `[0, 1, 2]` and `[1, 2, 4]` are different ways."
samples:
  - args: [[5, 3, 2, 8, 5], 10]
    returns: [[0, 1, 2], [0, 4], [1, 2, 4], [2, 3]]
    note: The picture above.
  - args: [[4, 6], 5]
    returns: []
    note: No combination weighs 5.
edge:
  - args: [[], 0]
    tag: with no stones and a target of zero
  - args: [[7, 2], 0]
    tag: with a target of zero
  - args: [[], 5]
    tag: with no stones
  - args: [[6], 6]
    tag: with a single stone that fits exactly
  - args: [[3], 6]
    tag: when a stone would have to be used twice
  - args: [[2, 2, 2, 2], 4]
    tag: with all the stones the same
  - args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], 105]
    tag: when every stone has to be chosen
  - args: [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 7]
    tag: with a huge number of ways
random:
  count: 40
  seed: 1516
  generate: |
    n = rng.int(0, 14)
    weights = [rng.int(1, rng.pick([5, 12, 30])) for _ in range(n)]
    if rng.int(0, 5) == 0:
        return [weights, rng.int(0, 60)]
    chosen = [w for w in weights if rng.int(0, 2) == 0]
    return [weights, sum(chosen)]
wrong:
  - |
    def exact_loads(weights, target):
        ways = []
        def build(start, chosen, total):
            if total == target:
                ways.append(list(chosen))
                return
            for i in range(start, len(weights)):
                if total + weights[i] <= target:
                    chosen.append(i)
                    build(i, chosen, total + weights[i])
                    chosen.pop()
        build(0, [], 0)
        return ways
  - |
    def exact_loads(weights, target):
        ways = []
        def build(start, chosen, total):
            for i in range(start, len(weights)):
                chosen.append(i)
                if total + weights[i] == target:
                    ways.append(list(chosen))
                elif total + weights[i] < target:
                    build(i + 1, chosen, total + weights[i])
                chosen.pop()
        build(0, [], 0)
        return ways
```

## Final mission

```exercise
id: py15-mision-quiocta
type: mission
title: The Quiocta cavern
prompt: |
  **Write `explore()`, recursive: Quilla walks through the whole cave, collects every crystal, returns to the starting point and returns how many crystals it gathered. At the end, `robot.report(...)` with that total.**

  Under Lamud, near Kuélap, the Quiocta cavern branches into tunnels that cross each other. There's no plan: with the headlamp, Quilla only sees the walls next to it. And the battery is enough for **exactly** going into each new tunnel once and coming back through it once. No wandering about.

  The recipe for `explore()`, standing on a tile:

  1. note the tile in `visited` and collect whatever is there (`robot.collect()` returns how many crystals);
  2. for each heading in `HEADINGS`: if the neighbour isn't in `visited`, `face(heading)`; if there's no wall ahead, **move forward, explore from there** adding up what it returns, and **come back**: face the opposite heading and move forward one.
  3. return what it gathered on this tile and in everything it explored from it.

  `robot.position` gives `(x, y)`; `robot.wall_ahead("front")` looks at the tile in front. The cave changes in every test, and Quilla doesn't always face the same way at the start. When it passes, together with the judges, session 16 unlocks.
visual:
  figure:
    title: The first cave (battery 62)
    panes:
      - { label: "cavern (Quilla can't see all of it)", grid: ["###########", "#R..2#...3#", "#.##.#.#..#", "#..1...#.##", "##.###.1..#", "#2...#..#4#", "###########"] }
      - { label: "explore(), for each new neighbour", text: "choose: move forward\nexplore from there\nundo: come back" }
      - { label: at the end, table: { head: ["", ""], rows: [["where", "on the R"], ["reports", "13"]] } }
starter: |
  HEADINGS = {"N": (0, -1), "E": (1, 0), "S": (0, 1), "W": (-1, 0)}
  OPPOSITE = {"N": "S", "S": "N", "E": "W", "W": "E"}


  def face(heading):
      """Turns right until it faces heading."""
      while robot.direction != heading:
          robot.turn_right()


  visited = set()


  def explore():
      """Walks everything not yet seen from here, comes back here and returns the crystals."""
      return 0


  robot.report(explore())
solution: |
  HEADINGS = {"N": (0, -1), "E": (1, 0), "S": (0, 1), "W": (-1, 0)}
  OPPOSITE = {"N": "S", "S": "N", "E": "W", "W": "E"}


  def face(heading):
      """Turns right until it faces heading."""
      while robot.direction != heading:
          robot.turn_right()


  visited = set()


  def explore():
      """Walks everything not yet seen from here, comes back here and returns the crystals."""
      x, y = robot.position
      visited.add((x, y))
      crystals = robot.collect()
      for heading, (dx, dy) in HEADINGS.items():
          if (x + dx, y + dy) in visited:
              continue
          face(heading)
          if robot.wall_ahead("front"):
              continue
          robot.forward()
          crystals += explore()
          face(OPPOSITE[heading])
          robot.forward()
      return crystals


  robot.report(explore())
hints:
  - "Read the position when `explore()` **starts** and keep it in `x, y`: after coming back from a neighbour, Quilla is there again."
  - "Check `visited` right before each neighbour, not before the loop: a deeper call may have visited it in the meantime. If you don't, Quilla goes in twice and the battery runs out."
world:
  theme: mina
  level: 3
  dir: E
  api: [move, mine]
  fog: true
  battery: 62
  map: |
    ###########
    #R..2#...3#
    #.##.#.#..#
    #..1...#.##
    ##.###.1..#
    #2...#..#4#
    ###########
scenarios:
  - tests:
      - name: returns to the starting point
        state: '(w.x, w.y) == (1, 1)'
        msg: Quilla didn't end where it started. Does it come back after each neighbour?
  - world: { battery: 50, dir: N }
    map: |
      #########
      #3..#..2#
      #.#.#.#.#
      #...R...#
      #.###.#1#
      #4..#...#
      #########
    tests:
      - name: returns to the starting point
        state: '(w.x, w.y) == (4, 3)'
        msg: Quilla didn't end where it started. Does it come back after each neighbour?
  - world: { battery: 90, dir: W }
    map: |
      ############
      #5.....#..2#
      #.####.#.#.#
      #..#1..#.#.#
      ##.#.###...#
      #..#..R..#3#
      #.##.#####.#
      #1.........#
      ############
    tests:
      - name: returns to the starting point
        state: '(w.x, w.y) == (6, 5)'
        msg: Quilla didn't end where it started. Does it come back after each neighbour?
tests:
  - name: no crystals left in the cave
    state: w.crystals_left == 0
    msg: Some crystals were left. Does it explore every neighbour of every tile?
  - name: reports the exact total, once
    state: w.reports == [w.crystals_total]
    msg: The number reported isn't the cave's total (or it was reported more than once). Does explore() add up what its calls return?
  - name: explore calls itself
    source: 'def\s+explore\s*\([^)]*\):\n(?:[ \t]+.*\n|[ \t]*\n)*?[ \t]+.*\bexplore\s*\('
    msg: Write explore as a recursive function that is called from each new neighbour.
  - name: without crashing or running out of battery
    state: not w.crashed
```

## Expert challenge

```exercise
id: py15-reto-ruta-larga
type: challenge
title: The longest walk
visual:
  figure:
    title: "longest_route(plan) for the second plan in the tests"
    input: { label: plan, grid: ["######", "#R...#", "#.##.#", "#...D#", "######"] }
    arrow: tries every path without repeating tiles
    output: { label: returns, value: "5" }
    caption: "The short path has 5 steps and the long one, around the other side, also 5: return the maximum."
prompt: |
  **Write `longest_route(plan)`, which returns how many steps the longest path from the `R` to the `D` has without stepping on the same tile twice, or `-1` if the `D` can't be reached.** For people who already code.

  Kuélap's guides want a walk that shows as much as possible without retracing their steps. `plan` is a list of strings (`"#"` wall, `"."` floor), surrounded by wall. Steps go between neighbouring tiles (north, south, east, west), and the path ends when it reaches the `D`. A BFS gives the shortest path; the longest one requires trying them all: backtracking.
starter: |
  def longest_route(plan):
      return -1

  print(longest_route(["#####", "#R.D#", "#####"]))
solution: |
  def longest_route(plan):
      start = next((x, y) for y, row in enumerate(plan) for x, c in enumerate(row) if c == "R")
      seen = set()

      def longest(x, y):
          if plan[y][x] == "#" or (x, y) in seen:
              return -1
          if plan[y][x] == "D":
              return 0
          seen.add((x, y))
          best = -1
          for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
              rest = longest(x + dx, y + dy)
              if rest >= 0:
                  best = max(best, rest + 1)
          seen.remove((x, y))
          return best

      return longest(*start)

  print(longest_route(["#####", "#R.D#", "#####"]))
hints:
  - "An inner function `longest(x, y)` that returns the steps of the longest path from there to the `D`, or `-1`."
  - "Mark the tile before exploring its neighbours and **unmark** it when you're done: another path may want to go through it."
tests:
  - name: a straight corridor
    run: 'longest_route(["#####", "#R.D#", "#####"])'
    equals: 2
  - name: a ring
    run: 'longest_route(["######", "#R...#", "#.##.#", "#...D#", "######"])'
    equals: 5
  - name: a square with columns
    run: 'longest_route(["#######", "#R....#", "#.#.#.#", "#.....#", "#.#.#D#", "#######"])'
    equals: 11
  - name: with a detour that leads nowhere
    run: 'longest_route(["#######", "#R..#.#", "#.#...#", "#...#D#", "#######"])'
    equals: 8
  - name: no way through
    run: 'longest_route(["#####", "#R#D#", "#####"])'
    equals: -1
```
