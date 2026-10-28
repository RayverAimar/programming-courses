# Session 9 — Grids

## The job

Puno, near Ananea, almost five thousand metres up. At the **Santa Rosalía** mine, last week's thaw got in through a crack and left the main gallery with water up to the ankles in some places and up to the knees in others. Don Ciriaco Mamani, the foreman, won't send anyone down until he knows where the water is, how much there is, and which quartz crystals have to come out before it rises any further.

Maru fitted Quilla with a **headlamp** and a sensor that measures the centimetres of water on each tile. What it returns isn't a list of numbers: it's a **grid**, rows of tiles, like a sheet of squared notebook paper. Today Quilla learns to read it by row and column, to look at the neighbouring tiles without falling off the edge, and to read the whole map of the mine.

```scene
theme: mina
level: 3
dir: E
caption: The main gallery of Santa Rosalía. Quilla collects the quartz near the entrance and reaches the lift (D) before the water rises.
map: |
  ##########
  #R..2.####
  ####..1..#
  ####.##.D#
  ##########
program: |
  robot.forward(3)
  robot.collect()
  robot.turn_right()
  robot.forward(1)
  robot.turn_left()
  robot.forward(2)
  robot.collect()
  robot.forward(2)
  robot.turn_right()
  robot.forward(1)
  robot.say("Gallery checked")
```

## The minimum

A grid is a **list of lists**: each element is a row, and each row is a list of tiles. You read it with two indexes, **first the row and then the column**: `water[row][column]`. On a map, the column is `x` (it grows towards the east) and the row is `y` (it grows towards the south), so the tile `(x, y)` is read `water[y][x]`, the other way round from how you say it.

```py run
water = [
    [0, 2, 5],
    [0, 0, 8],
]
x, y = 2, 1
print(water[y][x], len(water), len(water[0]))
print(water[0])
```

To walk through all of it you need **two loops, one inside the other**: the outer one goes down the rows and the inner one goes through each tile of that row. With `enumerate` you get the index and the value at once. Watch how Quilla writes down the wet tiles:

```anim
title: Two loops walk the grid, row by row
code: |
  water = [[0, 3, 0], [2, 0, 4]]
  wet = []
  for y, row in enumerate(water):
      for x, level in enumerate(row):
          if level > 0:
              wet.append((x, y))
  print(wet)
grid: { map: [".3.", "2.4"], frontier: wet }
show: [y, x, level, wet]
notes:
  3: "The outer loop picks row y; row is the whole list for that row."
  4: "The inner one goes through the columns x of that row. For each y, x makes a full lap."
  6: "A wet tile is written down as the tuple (x, y) and painted on the map."
  7: "First all of row 0, then all of row 1."
```

> **Common trap:** `[[0] * 3] * 2` looks like a 2 × 3 grid, but it repeats **the same row** twice: changing one tile changes it in both rows. Create each row separately with a comprehension: `[[0] * 3 for _ in range(2)]`.

```py run
bad = [[0] * 3] * 2
good = [[0] * 3 for _ in range(2)]
bad[0][1] = 7
good[0][1] = 7
print(bad, good)
```

Look at it the way Python sees it: two names, and how many rows there **really** are.

```anim
title: Two arrows to the same row, or one row per arrow
code: |
  bad = [[0] * 3] * 2
  good = [[0] * 3 for _ in range(2)]
  bad[0][1] = 7
  good[0][1] = 7
refs: all
show: [bad, good]
notes:
  1: "The `* 2` copies the **arrow**, not the row: both slots of `bad` point to the same row."
  2: "The comprehension builds a new row on each pass: `good` has two different rows."
  3: "The row both slots share is changed: `bad` shows the 7 in both rows."
  4: "Here each row is its own: only the top one changes."
```

Often what matters isn't one tile on its own but its **neighbours**. The four neighbours of `(x, y)` are one step to the east, west, south and north. A list of offsets saves you from writing four nearly identical `if`s, and for all eight (with diagonals) you just add four more tuples:

```py
STEPS = [(1, 0), (-1, 0), (0, 1), (0, -1)]
for dx, dy in STEPS:
    nx, ny = x + dx, y + dy
    if 0 <= nx < width and 0 <= ny < height:
        print("neighbour:", water[ny][nx])
```

```figure
title: A tile's neighbours, in the middle and on the edge
panes:
  - { label: "(3, 1) has 4 neighbours", grid: ["......", "...o..", "......"], marks: ["3,0", "2,1", "4,1", "3,2"] }
  - { label: "(5, 2) only has 2", grid: ["......", "......", ".....o"], marks: ["5,1", "4,2"] }
  - { label: "with diagonals, (1, 1) has 8", grid: ["....", ".o..", "...."], marks: ["0,0", "1,0", "2,0", "0,1", "2,1", "0,2", "1,2", "2,2"] }
caption: "On the edge, some neighbours fall outside. That's why you check `0 <= nx < width and 0 <= ny < height` **before** reading."
```

- **Python's edge doesn't warn you from below.** `water[5][0]` in a 2-row grid gives an `IndexError`, but `water[-1][0]` **doesn't fail**: it reads the last row, because negative indexes count from the end. A neighbour "above" row 0 silently turns into a tile at the other end. The `0 <= ny` check is what stops it.
- **Tuples as keys.** A tuple `(x, y)` can be a dictionary key (a list can't): `depth = {(3, 2): 12}` stores only the tiles that matter, and `depth.get((x, y), 0)` reads any tile without going out of anything.
- **Strings are rows too.** A map like `["#..", ".#."]` is read the same way, `plan[y][x]`, because a string can be indexed like a list.
- **`robot.map()`** returns the whole map as a list of rows, and each row is a list of one-letter characters: `robot.map()[y][x]`. `"#"` is rock, `"."` floor, `"1"`–`"9"` crystals and `"D"` the lift. With `robot.position.x` and `robot.position.y` you know where Quilla is on that map.
- **`robot.scan()`** returns only what the headlamp lights up: a 3 × 3 grid with Quilla in the centre, `view[1][1]`. The tile to its north is `view[0][1]`; the one to its east, `view[1][2]`.

<!-- mdn: nested-lists -->

## Practice

```exercise
id: py9-predice-fila
type: predict
title: Row first
prompt: |
  Before running it: what does it print?
code: |
  water = [
      [0, 4, 7],
      [2, 0, 9],
  ]
  x, y = 2, 0
  print(water[y][x], water[1][0])
  print(len(water), len(water[0]))
options:
  - "7 2\n2 3"
  - "9 4\n2 3"
  - "7 2\n3 2"
  - "2 7\n2 3"
answer: "7 2\n2 3"
explain: |
  `water[y]` is row 0, `[0, 4, 7]`, and its column 2 is the 7. `water[1][0]` is row 1, column 0: the 2. `len(water)` counts rows (2, the height) and `len(water[0])` counts the columns of one row (3, the width).
```

```exercise
id: py9-predice-alias
type: predict
title: The map that copied itself
prompt: |
  Don Ciriaco sets up two empty maps of 2 rows by 3 columns and marks one tile on each. What does it print?
code: |
  plan_a = [[0] * 3] * 2
  plan_b = [[0] * 3 for _ in range(2)]
  plan_a[0][1] = 5
  plan_b[0][1] = 5
  print(plan_a)
  print(plan_b)
options:
  - "[[0, 5, 0], [0, 5, 0]]\n[[0, 5, 0], [0, 0, 0]]"
  - "[[0, 5, 0], [0, 0, 0]]\n[[0, 5, 0], [0, 0, 0]]"
  - "[[0, 5, 0], [0, 5, 0]]\n[[0, 5, 0], [0, 5, 0]]"
  - "[[0, 0, 0], [0, 5, 0]]\n[[0, 5, 0], [0, 0, 0]]"
answer: "[[0, 5, 0], [0, 5, 0]]\n[[0, 5, 0], [0, 0, 0]]"
explain: |
  `* 2` on a list that holds a list doesn't copy the row: it repeats **the same** row twice. `plan_a[0]` and `plan_a[1]` are two names for one single list, so the 5 shows up in both. The comprehension runs `[0] * 3` on every lap and creates separate rows.
```

```exercise
id: py9-completa-vecinas
type: complete
title: The wet neighbours
prompt: |
  Complete `wet_neighbors(water, x, y)`, which counts how many of the **4 neighbours** of the tile `(x, y)` have water (a level greater than 0). Neighbours that fall outside the gallery don't count.
visual:
  figure:
    title: wet_neighbors(water, 1, 0)
    input: { label: water, table: { head: ["", "x=0", "x=1", "x=2"], rows: [["y=0", "3", "0", "1"], ["y=1", "0", "6", "0"]] } }
    arrow: "east 1 · west 3 · south 6 · north falls outside"
    output: { label: returns, value: "3" }
starter: |
  STEPS = [(1, 0), (-1, 0), (0, 1), (0, -1)]


  def wet_neighbors(water, x, y):
      """How many of the 4 neighbours of (x, y) have water."""
      height = len(water)
      width = len(water[0])
      count = 0
      for dx, dy in ___:
          nx, ny = x + dx, y + dy
          if 0 <= nx < ___ and 0 <= ny < ___ and water[___][___] > 0:
              count += 1
      return count


  water = [[3, 0, 1], [0, 6, 0]]
  print(wet_neighbors(water, 1, 0))
solution: |
  STEPS = [(1, 0), (-1, 0), (0, 1), (0, -1)]


  def wet_neighbors(water, x, y):
      """How many of the 4 neighbours of (x, y) have water."""
      height = len(water)
      width = len(water[0])
      count = 0
      for dx, dy in STEPS:
          nx, ny = x + dx, y + dy
          if 0 <= nx < width and 0 <= ny < height and water[ny][nx] > 0:
              count += 1
      return count


  water = [[3, 0, 1], [0, 6, 0]]
  print(wet_neighbors(water, 1, 0))
hints:
  - "`x` is compared with the width and `y` with the height."
  - "To read the neighbour, the row goes first: `water[ny][nx]`."
tests:
  - name: on the top edge
    run: wet_neighbors([[3, 0, 1], [0, 6, 0]], 1, 0)
    equals: 3
  - name: in a corner
    run: wet_neighbors([[3, 0, 1], [0, 6, 0]], 0, 1)
    equals: 2
  - name: in a gallery taller than it is wide
    run: wet_neighbors([[1], [0], [4], [2]], 0, 1)
    equals: 2
  - name: surrounded by dry floor
    run: wet_neighbors([[0, 0, 0], [0, 9, 0], [0, 0, 0]], 1, 1)
    equals: 0
  - name: the console shows 3
    output: "3"
```

```exercise
id: py9-arregla-borde
type: fix
title: The water that came from the other side
prompt: |
  `sum_around(water, x, y)` should add up the centimetres of water of the 4 neighbours of `(x, y)`. For the corner `(0, 0)` the neighbours are `(1, 0)` with 1 cm and `(0, 1)` with 3 cm: the total is **4**. The program doesn't crash, but it prints 15.

  The bug is in `level_at`: the `try` catches the tiles that go past the right or the bottom, but not the ones to the left or above. Fix it by checking the bounds before reading, without `try`.
visual:
  figure:
    title: What it really reads
    panes:
      - label: "water (the corner is (0, 0))"
        table: { head: ["", "x=0", "x=1", "x=2"], rows: [["y=0", "0", "1", "5"], ["y=1", "3", "0", "0"], ["y=2", "6", "0", "8"]] }
      - label: what level_at reads
        table: { head: ["neighbour", "should be", "reads"], rows: [["(1, 0)", "1", "1"], ["(0, 1)", "3", "3"], ["(-1, 0)", "outside: 0", "water[0][-1] = 5"], ["(0, -1)", "outside: 0", "water[-1][0] = 6"]] }
starter: |
  def level_at(water, x, y):
      """The water level at (x, y), or 0 if it falls outside the gallery."""
      try:
          return water[y][x]
      except IndexError:
          return 0


  def sum_around(water, x, y):
      """Adds up the water of the 4 neighbours of (x, y)."""
      total = 0
      for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
          total += level_at(water, x + dx, y + dy)
      return total


  water = [[0, 1, 5], [3, 0, 0], [6, 0, 8]]
  print(sum_around(water, 0, 0))
solution: |
  def level_at(water, x, y):
      """The water level at (x, y), or 0 if it falls outside the gallery."""
      if 0 <= y < len(water) and 0 <= x < len(water[0]):
          return water[y][x]
      return 0


  def sum_around(water, x, y):
      """Adds up the water of the 4 neighbours of (x, y)."""
      total = 0
      for dx, dy in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
          total += level_at(water, x + dx, y + dy)
      return total


  water = [[0, 1, 5], [3, 0, 0], [6, 0, 8]]
  print(sum_around(water, 0, 0))
hints:
  - "`water[-1]` isn't an error in Python: it's the last row. That's why the `except IndexError` never finds out."
  - "Ask before reading: `if 0 <= y < len(water) and 0 <= x < len(water[0]):`."
tests:
  - name: left of the edge is 0
    run: level_at([[0, 1, 5], [3, 0, 0], [6, 0, 8]], -1, 0)
    equals: 0
  - name: above the edge is 0
    run: level_at([[0, 1, 5], [3, 0, 0], [6, 0, 8]], 0, -1)
    equals: 0
  - name: past the right and the bottom it's still 0
    run: '[level_at([[0, 1], [3, 0]], 2, 0), level_at([[0, 1], [3, 0]], 0, 2)]'
    equals: [0, 0]
  - name: inside it reads the tile
    run: level_at([[0, 1, 5], [3, 0, 0], [6, 0, 8]], 2, 2)
    equals: 8
  - name: the corner adds up to 4
    output: "4"
  - name: without try
    sourceNot: '\btry\b'
    msg: Check the bounds with 0 <= x < width and 0 <= y < height instead of catching the error.
```

```exercise
id: py9-escribe-charcos
type: write
title: The puddle notebook
prompt: |
  Write two functions:

  - `puddles(water)`: returns a **dictionary** whose keys are the tuples `(x, y)` of the tiles with water (a level greater than 0) and whose values are their levels. Dry tiles are left out.
  - `level(gallery_puddles, x, y)`: takes that dictionary and returns the level of `(x, y)`, or **0** if it isn't there (dry, or outside the gallery).

  A dictionary comprehension with two `for`s builds `puddles` in one line, but two loops are fine too.
visual:
  figure:
    title: puddles([[0, 4], [2, 0]])
    input: { label: water, table: { head: ["", "x=0", "x=1"], rows: [["y=0", "0", "4"], ["y=1", "2", "0"]] } }
    arrow: only the wet tiles, with their (x, y)
    output: { label: returns, text: "{(1, 0): 4, (0, 1): 2}" }
starter: |
  def puddles(water):
      pass


  def level(gallery_puddles, x, y):
      pass


  print(puddles([[0, 4], [2, 0]]))
solution: |
  def puddles(water):
      """The tiles with water, as {(x, y): level}."""
      return {
          (x, y): cm
          for y, row in enumerate(water)
          for x, cm in enumerate(row)
          if cm > 0
      }


  def level(gallery_puddles, x, y):
      """The level of (x, y), or 0 if there's no water there."""
      return gallery_puddles.get((x, y), 0)


  print(puddles([[0, 4], [2, 0]]))
hints:
  - "`{(x, y): cm for y, row in enumerate(water) for x, cm in enumerate(row) if cm > 0}`: the `for` over the rows goes first, just like in two nested loops."
  - "`.get((x, y), 0)`: the double parentheses are the call and the tuple."
tests:
  - name: the example
    expect: 'puddles([[0, 4], [2, 0]]) == {(1, 0): 4, (0, 1): 2}'
  - name: a dry gallery has no puddles
    expect: 'puddles([[0, 0, 0]]) == {}'
  - name: a one-column gallery
    expect: 'puddles([[5], [0], [1]]) == {(0, 0): 5, (0, 2): 1}'
  - name: level of a wet tile
    run: 'level({(1, 0): 4, (0, 1): 2}, 1, 0)'
    equals: 4
  - name: level of a dry or outside tile
    run: '[level({(1, 0): 4}, 0, 0), level({(1, 0): 4}, -3, 9)]'
    equals: [0, 0]
  - name: level doesn't mix up the order
    run: 'level({(1, 0): 4, (0, 1): 2}, 0, 1)'
    equals: 2
```

```exercise
id: py9-escribe-faro
type: write
title: The headlamp at the crossing
prompt: |
  Quilla is at a dark crossing. Read with `robot.scan()` the tiles the headlamp lights up and make it say, with `robot.say`, **the open headings** (the ones that aren't rock `"#"`) in the order `N E S W`, separated by a space: for example `"E S"`.

  `scan()` returns a 3 × 3 grid with Quilla in the centre, `view[1][1]`. Use the `STEPS` dictionary, which already says how much `x` and `y` move towards each heading; Quilla doesn't need to move. The program is tested at three different crossings.
visual:
  figure:
    title: What the headlamp sees at the first crossing
    panes:
      - { label: "view (Quilla in the centre)", grid: ["###", "#..", "#.#"], marks: ["1,1"] }
      - { label: "heading → tile", table: { head: ["heading", "(dx, dy)", "view[1 + dy][1 + dx]"], rows: [["N", "(0, -1)", "#"], ["E", "(1, 0)", "."], ["S", "(0, 1)", "."], ["W", "(-1, 0)", "#"]] } }
      - { label: says, value: "E S" }
starter: |
  STEPS = {"N": (0, -1), "E": (1, 0), "S": (0, 1), "W": (-1, 0)}

  view = robot.scan()
  print(view)
solution: |
  STEPS = {"N": (0, -1), "E": (1, 0), "S": (0, 1), "W": (-1, 0)}

  view = robot.scan()
  open_headings = [heading for heading, (dx, dy) in STEPS.items() if view[1 + dy][1 + dx] != "#"]
  robot.say(" ".join(open_headings))
hints:
  - "Go through `STEPS.items()`: each heading brings its `(dx, dy)`, and the tile on that side is `view[1 + dy][1 + dx]`."
  - "`\" \".join(open_headings)` joins the list with spaces."
world:
  theme: mina
  level: 3
  dir: E
  api: [move, scan]
  fog: true
  vision: 1
  map: |
    #####
    #R..#
    #.###
    #####
scenarios:
  - tests:
      - name: says "E S"
        state: 'w.said == ["E S"]'
  - map: |
      #####
      ##.##
      #.R.#
      #####
    tests:
      - name: says "N E W"
        state: 'w.said == ["N E W"]'
  - map: |
      #####
      #..##
      #.R##
      ##.##
      #####
    tests:
      - name: says "N S W"
        state: 'w.said == ["N S W"]'
tests:
  - name: reads the headlamp
    source: 'robot\.scan\(\)'
```

## The case

```exercise
id: py9-caso-bombas
type: case
title: The cell that flooded first
prompt: |
  **Count how many of the 4 neighbours of each pump have water and compare it with what its operator wrote down.** The one that doesn't match didn't check their pump, and that's where the flood started.

  In the Santa Rosalía gallery there are four water pumps, each on one tile, each with an operator. At the end of every shift, the operator writes in the notebook how many of the **4 neighbouring tiles** of their pump (north, south, east and west) have water. That night someone didn't go down to look, wrote any old number, and their pump got stuck. Now Quilla's sensor has produced the water map (in centimetres) and Don Ciriaco wants to know who it was.

  Careful: two pumps are on the edge. A neighbour outside the gallery doesn't exist, and in Python `water[-1]` doesn't warn you: it reads the last row.

  Print one line per operator that starts with their name, for example `print("Yolanda:", count)`, and the board will tell you whether it matches.
visual:
  board:
    for: py9-caso-bombas
    task: "Wet neighbours = how many of the 4 tiles around the pump have more than 0 cm. Compare it with what was written down."
    cards:
      - name: Yolanda
        kind: person
        culprit: true
        role: The centre pump
        rows: [["Pump at", "(3, 2)"], ["Wrote down", "1 wet neighbour"]]
        clue: { find: "Yolanda", says: 1, saysLabel: Wrote down }
      - name: Wilber
        kind: person
        role: The corner pump
        rows: [["Pump at", "(0, 4)"], ["Wrote down", "2 wet neighbours"]]
        clue: { find: "Wilber", says: 2, saysLabel: Wrote down }
      - name: Rosa
        kind: person
        role: The east branch pump
        rows: [["Pump at", "(5, 1)"], ["Wrote down", "2 wet neighbours"]]
        clue: { find: "Rosa", says: 2, saysLabel: Wrote down }
      - name: Fredy
        kind: person
        role: The entrance pump
        rows: [["Pump at", "(1, 0)"], ["Wrote down", "2 wet neighbours"]]
        clue: { find: "Fredy", says: 2, saysLabel: Wrote down }
      - name: The water map
        kind: note
        role: Centimetres per tile (row y, columns x = 0…6)
        rows: [["y = 0", "0 0 3 5 0 0 0"], ["y = 1", "0 2 8 9 4 0 0"], ["y = 2", "0 0 6 12 7 1 0"], ["y = 3", "1 0 0 5 3 0 0"], ["y = 4", "4 2 0 0 0 0 2"]]
    caption: "If Wilber or Fredy don't match for you, check whether you're reading neighbours past the edge."
starter: |
  # Centimetres of water on each tile: water[y][x]
  water = [
      [0, 0, 3, 5, 0, 0, 0],
      [0, 2, 8, 9, 4, 0, 0],
      [0, 0, 6, 12, 7, 1, 0],
      [1, 0, 0, 5, 3, 0, 0],
      [4, 2, 0, 0, 0, 0, 2],
  ]

  # Where each operator's pump is, as (x, y)
  pumps = {
      "Yolanda": (3, 2),
      "Wilber": (0, 4),
      "Rosa": (5, 1),
      "Fredy": (1, 0),
  }

  STEPS = [(1, 0), (-1, 0), (0, 1), (0, -1)]

  # TODO: count the wet neighbours of each pump
  # and print one line per operator, for example:
  # print("Yolanda:", count)
solution: |
  water = [
      [0, 0, 3, 5, 0, 0, 0],
      [0, 2, 8, 9, 4, 0, 0],
      [0, 0, 6, 12, 7, 1, 0],
      [1, 0, 0, 5, 3, 0, 0],
      [4, 2, 0, 0, 0, 0, 2],
  ]

  pumps = {
      "Yolanda": (3, 2),
      "Wilber": (0, 4),
      "Rosa": (5, 1),
      "Fredy": (1, 0),
  }

  STEPS = [(1, 0), (-1, 0), (0, 1), (0, -1)]


  def wet_neighbors(x, y):
      """How many of the 4 neighbours of (x, y) have water."""
      count = 0
      for dx, dy in STEPS:
          nx, ny = x + dx, y + dy
          if 0 <= nx < len(water[0]) and 0 <= ny < len(water) and water[ny][nx] > 0:
              count += 1
      return count


  for operator, (x, y) in pumps.items():
      print(f"{operator}:", wet_neighbors(x, y))
answer: Yolanda
answerLabel: Who didn't check their pump?
reveal: |
  Yolanda. Her pump is at `(3, 2)`, the deepest tile (12 cm), and all four of its neighbours have water: 9 to the north, 5 to the south, 6 to the west and 7 to the east. She wrote down 1. Wilber's `(0, 4)` and Fredy's `(1, 0)` pumps are on the edge: if you count the "neighbours" from `water[-1]` or from column `-1`, you get one too many and it looks as if they lied.
hints:
  - "`for operator, (x, y) in pumps.items():` takes out each pump's name and tuple in one go."
  - "For each `(dx, dy)` in `STEPS`, check `0 <= nx < len(water[0]) and 0 <= ny < len(water)` before reading `water[ny][nx]`."
```

## The judge

As since session 4, the judge **calls your functions** and compares what they return. Today the arguments are grids: a list of strings (a map) or a list of lists of numbers.

```exercise
id: py9-juez-filtraciones
type: judge
mode: function
function: check_gallery
title: Where to rest
prompt: |
  **Write `check_gallery(plan)`, which returns `[safe, worst]`: how many floor tiles have no leak around them, and how many leaks the worst floor tile has around it. And its helper `leaks_near(plan, x, y)`.**

  Don Ciriaco wants to know where the miners can rest. The map is a list of strings, all the same length: `"."` is floor, `"#"` is rock and `"~"` is a **leak** (that's where the water gets in). Around a tile, its **8 neighbours** count, diagonals included, as long as they're inside the map.

  - `leaks_near(plan, x, y)`: how many of the 8 neighbours of `(x, y)` are `"~"`. The tile itself doesn't count.
  - `check_gallery(plan)`: looking **only at floor tiles** `"."`, `safe` is how many have 0 leaks near them and `worst` is the largest number of leaks near one of them. If there are no floor tiles at all, return `[0, 0]`.

  **Constraints:** 1 to 12 rows · 1 to 12 columns · only `.`, `#` and `~`.
visual:
  figure:
    title: Example 1, tile by tile
    input: { label: plan, grid: ["~..#", "....", "#.~."], marks: ["0,0", "2,2"] }
    arrow: leaks near each floor tile
    output: { label: "returns [1, 2]", table: { head: ["", "x=0", "x=1", "x=2", "x=3"], rows: [["y=0", "~", "1", "0", "#"], ["y=1", "1", "2", "1", "1"], ["y=2", "#", "1", "~", "1"]] } }
    steps:
      - "The only floor tile with 0 is `(2, 0)`: safe = 1."
      - "The worst is `(1, 1)`, which touches both leaks diagonally: worst = 2."
starter: |
  def leaks_near(plan, x, y):
      pass


  def check_gallery(plan):
      pass
solution: |
  NEIGHBORS = [(-1, -1), (0, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (0, 1), (1, 1)]


  def leaks_near(plan, x, y):
      """How many of the 8 neighbours of (x, y) are leaks."""
      height, width = len(plan), len(plan[0])
      total = 0
      for dx, dy in NEIGHBORS:
          nx, ny = x + dx, y + dy
          if 0 <= nx < width and 0 <= ny < height and plan[ny][nx] == "~":
              total += 1
      return total


  def check_gallery(plan):
      """[floor tiles with no leaks near, leaks of the worst floor tile]."""
      counts = [
          leaks_near(plan, x, y)
          for y, row in enumerate(plan)
          for x, tile in enumerate(row)
          if tile == "."
      ]
      return [counts.count(0), max(counts, default=0)]
hints:
  - "The 8 neighbours are every combination of `dx` and `dy` between -1 and 1, except `(0, 0)`. Write them in a list of tuples."
  - "Gather the counts of the `\".\"` tiles in a list; then `counts.count(0)` and `max(counts, default=0)`."
samples:
  - args: [["~..#", "....", "#.~."]]
    returns: [1, 2]
    note: Only one floor tile has no leaks near it; the worst touches two.
  - args: [["...", ".~.", "..."]]
    returns: [0, 1]
    note: The leak in the centre touches all 8 floor tiles.
  - fn: leaks_near
    args: [["~~~", "~.~", "~~~"], 1, 1]
    returns: 8
    note: The helper is also judged on its own.
edge:
  - args: [["."]]
    tag: with a single floor tile
  - args: [["~"]]
    tag: with a single leak and no floor
  - args: [["#~#", "~#~"]]
    tag: with no floor tiles
  - args: [["~.........~"]]
    tag: with a single row
  - args: [["~", ".", ".", ".", "~"]]
    tag: with a single column
  - args: [["~~~~", "~..~", "~~~~"]]
    tag: with the floor surrounded by leaks
  - args: [["....~", ".....", ".....", "~...."]]
    tag: with leaks in opposite corners
  - fn: leaks_near
    args: [["..~", "...", "~.."], 0, 0]
    tag: in leaks_near, in a corner with leaks on the other side
  - fn: leaks_near
    args: [["~.", ".~"], 0, 0]
    tag: in leaks_near, without counting the tile itself
random:
  count: 40
  seed: 909
  generate: |
    height = rng.int(1, 12)
    width = rng.int(1, 12)
    density = rng.pick([5, 12, 25, 45])
    plan = []
    for _ in range(height):
        row = ""
        for _ in range(width):
            r = rng.int(1, 100)
            row += "~" if r <= density else "#" if r <= density + 15 else "."
        plan.append(row)
    return [plan]
wrong:
  - |
    NEIGHBORS = [(1, 0), (-1, 0), (0, 1), (0, -1)]


    def leaks_near(plan, x, y):
        height, width = len(plan), len(plan[0])
        total = 0
        for dx, dy in NEIGHBORS:
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height and plan[ny][nx] == "~":
                total += 1
        return total


    def check_gallery(plan):
        counts = [leaks_near(plan, x, y) for y, row in enumerate(plan) for x, c in enumerate(row) if c == "."]
        return [counts.count(0), max(counts, default=0)]
  - |
    NEIGHBORS = [(-1, -1), (0, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (0, 1), (1, 1)]


    def leaks_near(plan, x, y):
        total = 0
        for dx, dy in NEIGHBORS:
            try:
                if plan[y + dy][x + dx] == "~":
                    total += 1
            except IndexError:
                pass
        return total


    def check_gallery(plan):
        counts = [leaks_near(plan, x, y) for y, row in enumerate(plan) for x, c in enumerate(row) if c == "."]
        return [counts.count(0), max(counts, default=0)]
  - |
    NEIGHBORS = [(-1, -1), (0, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (0, 1), (1, 1)]


    def leaks_near(plan, x, y):
        height, width = len(plan), len(plan[0])
        total = 0
        for dx, dy in NEIGHBORS:
            nx, ny = x + dx, y + dy
            if 0 <= nx < height and 0 <= ny < width and plan[nx][ny] == "~":
                total += 1
        return total


    def check_gallery(plan):
        counts = [leaks_near(plan, x, y) for y, row in enumerate(plan) for x, c in enumerate(row) if c == "."]
        return [counts.count(0), max(counts, default=0)]
```

```exercise
id: py9-juez-camara
type: judge
mode: function
function: rotate_photo
title: The sideways camera
prompt: |
  **Write `rotate_photo(photo)`, which returns the photo rotated 90° clockwise.**

  The thermal camera Maru put on Quilla got screwed on sideways: every photo comes out lying down. A photo is a list of rows of numbers (the temperature of each point), all the same length. Rotating it to the right makes **the first column, read from bottom to top, the first row**. A photo with `height` rows and `width` columns ends up with `width` rows and `height` columns.

  Return a new list of lists; you don't need to change `photo`.

  **Constraints:** 1 to 8 rows · 1 to 8 columns · numbers from 0 to 99.
visual:
  figure:
    title: Example 1, rotated
    input: { label: "photo (2 rows × 3 columns)", table: { head: ["", "x=0", "x=1", "x=2"], rows: [["y=0", "1", "2", "3"], ["y=1", "4", "5", "6"]] } }
    arrow: 90° to the right
    output: { label: "returns (3 rows × 2 columns)", table: { head: ["", "x=0", "x=1"], rows: [["y=0", "4", "1"], ["y=1", "5", "2"], ["y=2", "6", "3"]] } }
    steps:
      - "Column 0 from bottom to top is `4, 1`: that's the new row 0."
      - "In general, the new row `x` is column `x` read from the last row up to the first."
starter: |
  def rotate_photo(photo):
      pass
solution: |
  def rotate_photo(photo):
      """The photo rotated 90° clockwise."""
      height, width = len(photo), len(photo[0])
      return [[photo[height - 1 - y][x] for y in range(height)] for x in range(width)]
hints:
  - "The new grid has one row for each column `x` of the photo, and that row goes through the column from the last row (`height - 1`) up to row 0."
  - "`[[photo[height - 1 - y][x] for y in range(height)] for x in range(width)]`. Another way: `zip(*photo[::-1])` gathers the columns of the upside-down photo."
samples:
  - args: [[[1, 2, 3], [4, 5, 6]]]
    returns: [[4, 1], [5, 2], [6, 3]]
    note: Two rows of three become three rows of two.
  - args: [[[7, 8], [9, 10]]]
    returns: [[9, 7], [10, 8]]
edge:
  - args: [[[42]]]
    tag: with a single point
  - args: [[[1, 2, 3, 4]]]
    tag: with a single row
  - args: [[[1], [2], [3], [4]]]
    tag: with a single column
  - args: [[[0, 0, 0], [0, 0, 0], [0, 0, 1]]]
    tag: with a hot spot in the corner
  - args: [[[5, 6], [7, 8], [9, 10], [11, 12], [13, 14]]]
    tag: with a photo taller than it is wide
random:
  count: 40
  seed: 90
  generate: |
    height = rng.int(1, 8)
    width = rng.int(1, 8)
    return [[rng.list(width, 0, 99) for _ in range(height)]]
wrong:
  - |
    def rotate_photo(photo):
        return [list(column) for column in zip(*photo)]
  - |
    def rotate_photo(photo):
        return [list(column) for column in zip(*photo)][::-1]
  - |
    def rotate_photo(photo):
        n = len(photo)
        return [[photo[n - 1 - y][x] for y in range(n)] for x in range(n)]
  - |
    def rotate_photo(photo):
        return [list(column)[::-1] for column in zip(*photo[::-1])]
```

## Final mission

```exercise
id: py9-mision-cuarzo
type: mission
title: The quartz before the water
prompt: |
  **Read the map with `robot.map()`, write down where every crystal is in a `crystals` dictionary from `(x, y)` to amount, go and collect them all and report the total just once.**

  The chamber at the bottom of Santa Rosalía is filling up and there's no time to sweep it tile by tile: Quilla carries **just enough battery to go from crystal to crystal**. The chamber has no rock inside, so you can get from one tile to another walking first along the row and then along the column.

  1. `plan = robot.map()` and build `crystals` with a comprehension: the tiles whose character is a digit (`c.isdigit()`), with `int(c)` as the value.
  2. Complete `go_to(x, y)`. `face(heading)` is already written: it turns until it faces `"N"`, `"E"`, `"S"` or `"W"`. `robot.position.x` and `robot.position.y` say where Quilla is.
  3. Go through `sorted(crystals)`, go to each one, `robot.collect()`, add it up, and at the end `robot.report(total)`.

  It's tested in three different chambers, and Quilla doesn't always start in the same place or facing the same way. When it passes, together with the judges, session 10 unlocks.
starter: |
  def face(heading):
      """Turns right until it faces heading: "N", "E", "S" or "W"."""
      while robot.direction != heading:
          robot.turn_right()


  def go_to(x, y):
      """Walks to (x, y): first along the row, then along the column."""
      pass


  plan = robot.map()
  crystals = {}
  total = 0

  robot.report(total)
solution: |
  def face(heading):
      """Turns right until it faces heading: "N", "E", "S" or "W"."""
      while robot.direction != heading:
          robot.turn_right()


  def go_to(x, y):
      """Walks to (x, y): first along the row, then along the column."""
      dx = x - robot.position.x
      if dx != 0:
          face("E" if dx > 0 else "W")
          robot.forward(abs(dx))
      dy = y - robot.position.y
      if dy != 0:
          face("S" if dy > 0 else "N")
          robot.forward(abs(dy))


  plan = robot.map()
  crystals = {
      (x, y): int(c)
      for y, row in enumerate(plan)
      for x, c in enumerate(row)
      if c.isdigit()
  }
  total = 0
  for x, y in sorted(crystals):
      go_to(x, y)
      total += robot.collect()

  robot.report(total)
hints:
  - "In `go_to`, `dx = x - robot.position.x` says how far and which way: positive is east, negative is west. `abs(dx)` is the number of steps. The same with `dy`: positive is south."
  - "Don't call `robot.forward(0)` or turn if you're already in that column or row: ask `if dx != 0:` first."
world:
  theme: mina
  level: 3
  dir: E
  battery: 28
  api: [move, mine, map]
  map: |
    ###########
    #R...3....#
    #..2....1.#
    #.....4...#
    #.1.......#
    #......2..#
    ###########
scenarios:
  - {}
  - world: { battery: 18, dir: N }
    map: |
      #########
      #.....5.#
      #.2.....#
      #....R..#
      #3....1.#
      #########
  - world: { battery: 53, dir: W }
    map: |
      #############
      #.4.......2.#
      #.....9.....#
      #...........#
      #1.......3..#
      #.....R.....#
      #..7......1.#
      #############
tests:
  - name: reads the map with robot.map()
    source: 'robot\.map\(\)'
  - name: crystals has (x, y) tuples as keys
    expect: 'len(crystals) > 0 and all(isinstance(k, tuple) and len(k) == 2 for k in crystals)'
    msg: "crystals must be a dictionary {(x, y): amount} with one entry per tile with crystals."
  - name: no crystals left in the chamber
    state: w.crystals_left == 0
    msg: Some crystals were left. Does go_to reach the exact tile? Remember the row is y and the column is x.
  - name: reports the exact total, once
    state: w.reports == [w.crystals_total]
    msg: The reported number isn't the chamber's total (or it was reported more than once).
  - name: Quilla doesn't crash or run out of battery
    state: not w.crashed
```

## Expert challenge

```exercise
id: py9-reto-espiral
type: challenge
title: The spiral round
visual:
  figure:
    title: spiral of a 3 × 4 chamber
    input: { label: grid, table: { head: ["", "x=0", "x=1", "x=2", "x=3"], rows: [["y=0", "1", "2", "3", "4"], ["y=1", "10", "11", "12", "5"], ["y=2", "9", "8", "7", "6"]] } }
    arrow: from the outer edge inwards, clockwise
    output: { label: returns, cells: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], index: false }
prompt: |
  **Write `spiral(grid)`, which returns in a list the values of the grid walked in a spiral: the top row eastwards, the right column southwards, the bottom row westwards, the left column northwards, and another lap further in until it has passed through all of them.** For people who already code.

  It's the round Quilla makes to check a chamber without stepping on the same tile twice. The grid may be rectangular, a single row or column, or empty (`[]`). Don't modify `grid`.
starter: |
  def spiral(grid):
      return []


  print(spiral([[1, 2, 3, 4], [10, 11, 12, 5], [9, 8, 7, 6]]))
solution: |
  def spiral(grid):
      """The grid's values in a spiral, from the edge inwards."""
      if not grid:
          return []
      top, bottom = 0, len(grid) - 1
      left, right = 0, len(grid[0]) - 1
      walk = []
      while top <= bottom and left <= right:
          walk += [grid[top][x] for x in range(left, right + 1)]
          walk += [grid[y][right] for y in range(top + 1, bottom + 1)]
          if top < bottom:
              walk += [grid[bottom][x] for x in range(right - 1, left - 1, -1)]
          if left < right:
              walk += [grid[y][left] for y in range(bottom - 1, top, -1)]
          top, bottom = top + 1, bottom - 1
          left, right = left + 1, right - 1
      return walk


  print(spiral([[1, 2, 3, 4], [10, 11, 12, 5], [9, 8, 7, 6]]))
hints:
  - "Keep four bounds: `top`, `bottom`, `left`, `right`. Each lap walks the four sides and closes them in one step."
  - "Watch the last lap when only one row or one column is left: don't walk it twice."
tests:
  - name: the chamber in the picture
    run: spiral([[1, 2, 3, 4], [10, 11, 12, 5], [9, 8, 7, 6]])
    equals: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  - name: a 3 × 3 square
    run: spiral([[1, 2, 3], [8, 9, 4], [7, 6, 5]])
    equals: [1, 2, 3, 4, 5, 6, 7, 8, 9]
  - name: one taller than it is wide
    run: spiral([[1, 2], [8, 3], [7, 4], [6, 5]])
    equals: [1, 2, 3, 4, 5, 6, 7, 8]
  - name: a single row
    run: spiral([[4, 5, 6]])
    equals: [4, 5, 6]
  - name: a single column
    run: spiral([[4], [5], [6]])
    equals: [4, 5, 6]
  - name: a single value and an empty one
    run: '[spiral([[7]]), spiral([])]'
    equals: [[7], []]
  - name: doesn't modify the grid
    expect: '(lambda g: (spiral(g), g)[1])([[1, 2], [4, 3]]) == [[1, 2], [4, 3]]'
```
