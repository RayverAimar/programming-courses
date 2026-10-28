# Session 3 — Loops

## The job

In Cerro de Pasco, more than four thousand metres up, the cold cuts like a knife, and the San Expedito mine has just reopened a tunnel that had been shut for years. The forewoman, **Doña Eulalia Ticse**, called Maru: she needs someone to walk the galleries, pick up the quartz crystals the rock has been shedding and say how many there are. Nobody remembers how long the tunnels are.

Maru bolted a **headlamp** onto Quilla and put it on the bus from Lima to Cerro. Darkness isn't the problem: the problem is that Quilla doesn't know how many steps to take. Today you teach it to **repeat** without counting by hand: "while there's no rock ahead, move and collect".

```scene
theme: mina
level: 3
dir: E
caption: San Expedito's first tunnel. Quilla repeats the same thing on every tile (move, collect) until the rock blocks the way, and reports the total.
map: |
  ############
  ############
  #R.3..2..4D#
  ############
  ############
program: |
  total = 0
  while not robot.wall_ahead():
      robot.forward()
      total += robot.collect()
  robot.report(total)
```

## The minimum

A **loop** repeats a block of code. Python has two:

- **`while condition:`** repeats *while* the condition is true. Use it when you don't know how many passes there will be: "while there's no wall".
- **`for variable in …:`** makes one pass for each element of something you can walk through: a list, a string, or a `range`, which is a sequence of numbers.

```py run
for metres in range(0, 200, 50):
    print("Quilla goes down to", metres, "m")
lamp = 3
while lamp > 0:
    print("Lamp:", lamp)
    lamp -= 1
```

`range(a, b, step)` counts from `a` **up to just before `b`**, `step` at a time: `range(0, 200, 50)` gives 0, 50, 100 and 150, but not 200. With a single number, `range(5)` is 0, 1, 2, 3, 4; and the step can be negative: `range(10, 0, -3)` is 10, 7, 4, 1.

Press ▶ and watch how the `while` checks its condition **before** every pass:

```anim
title: A while asks before every pass
code: |
  battery = 40
  trips = 0
  while battery >= 15:
      battery -= 15
      trips += 1
  print(trips, battery)
notes:
  3: Before every pass, Python asks again. If it's false, it jumps to the end.
  4: "battery -= 15 is the same as battery = battery - 15."
  5: A counter adds one on every pass.
  6: With 10 battery, 10 >= 15 is false and the loop is over.
```

What you need for today:

- **Accumulators and counters.** A variable that starts at `0` before the loop and grows inside it: `total += vein` adds, `empty += 1` counts. Python has no `++`.
- **`break`** leaves the loop right there; **`continue`** skips the rest of this pass and moves on to the next one.
- **`for … else`.** A loop's `else` runs only if the loop finished **without** a `break`: "I searched and didn't find it".
- **Nested loops.** A loop inside another: for every pass of the outer one, the inner one makes all of its passes.

```anim
title: continue skips a pass, break ends the loop
code: |
  samples = [6, 0, 9, 15, 4]
  silver = 0
  for sample in samples:
      if sample == 0:
          continue
      if sample > 12:
          break
      silver += sample
  print(silver)
cells: { of: samples, at: sample }
notes:
  5: An empty sample isn't added; continue goes straight to the next one.
  7: A sample over 12 is a different vein; break leaves the loop and the 4 is never looked at.
  8: "The accumulator: silver grows on every pass that gets this far."
```

> **Common trap:** the loop that never ends. If nothing inside the `while` changes its condition, it repeats forever: `while lamp > 0: print(lamp)` without the `lamp -= 1` never stops. The same happens if the line that changes the condition is left **unindented**, outside the block. The Workshop cuts it off after a few seconds (and Quilla after 3000 actions), but on your own computer the program just hangs.

<!-- legacy: for-range -->

<!-- mdn: for-range for-else -->

## Practice

```exercise
id: py3-predice-lampara
type: predict
title: The carbide lamp
prompt: |
  Each pass through the gallery uses 12 battery. What does it print?
code: |
  battery = 50
  passes = 0
  while battery > 0:
      battery -= 12
      passes += 1
  print(passes, battery)
options:
  - "5 -10"
  - "4 2"
  - "5 2"
  - "4 -10"
answer: "5 -10"
explain: |
  The condition is checked **before** every pass, not halfway through. 50 → 38 → 26 → 14 → 2: at 2, `2 > 0` is still true, so there's a fifth pass and the battery ends at -10. Only then is `-10 > 0` false.
```

```exercise
id: py3-predice-rango
type: predict
title: The shaft's levels
prompt: |
  Quilla notes the depth of each level it visits. What does it print?
code: |
  total = 0
  for level in range(100, 400, 100):
      total += level
  print(total, level)
options:
  - "600 300"
  - "1000 400"
  - "600 400"
  - "1000 300"
answer: "600 300"
explain: |
  `range(100, 400, 100)` gives 100, 200 and 300: 400 doesn't get in, because the end of a `range` is never included. `total` adds up 100 + 200 + 300 = 600, and after the loop `level` keeps the last value it took: 300.
```

```exercise
id: py3-completa-escalera
type: complete
title: The lift's stops
prompt: |
  The mine's lift stops **every 40 metres**, from 40 m down to **200 m** (included). Complete the loop so it prints each stop and counts how many there are.
starter: |
  stops = 0
  for metres in range(___, ___, ___):
      print(f"Stop at {metres} m")
      stops ___ 1
  print("Stops:", stops)
solution: |
  stops = 0
  for metres in range(40, 201, 40):
      print(f"Stop at {metres} m")
      stops += 1
  print("Stops:", stops)
hints:
  - "`range(start, end, step)`: the end is never included. If you want 200 in, the end has to be something bigger than 200."
  - The counter grows one at a time with `+=`.
tests:
  - name: prints the five stops and the count
    output: "Stop at 40 m\nStop at 80 m\nStop at 120 m\nStop at 160 m\nStop at 200 m\nStops: 5"
  - name: stops is 5
    expect: stops == 5
  - name: uses range with a step
    source: 'range\(\s*40\s*,\s*\d+\s*,\s*40\s*\)'
    msg: Use range(40, …, 40) so the loop counts 40 at a time.
```

```exercise
id: py3-predice-muestras
type: predict
title: The sample from the rich vein
prompt: |
  Quilla checks the rock samples in order. Before running it: what does it print?
code: |
  samples = [3, 0, 7, 0, 12, 5]
  for sample in samples:
      if sample == 0:
          continue
      if sample > 10:
          print("Rich vein!", sample)
          break
      print("sample", sample)
  else:
      print("no rich vein")
options:
  - "sample 3\nsample 7\nRich vein! 12"
  - "sample 3\nsample 7\nRich vein! 12\nno rich vein"
  - "sample 3\nsample 0\nsample 7\nsample 0\nRich vein! 12"
  - "sample 3\nsample 7\nRich vein! 12\nsample 5"
answer: "sample 3\nsample 7\nRich vein! 12"
explain: |
  The zeros hit `continue`: they skip the rest of the pass and aren't printed. At 12, `break` ends the loop, so the 5 is never looked at. And since the loop finished **with** a `break`, the `else` doesn't run.
```

```exercise
id: py3-escribe-veta-rica
type: write
title: The first rich vein
prompt: |
  Search `samples` for the **first** one with 100 grams of silver or more and print `Rich vein in sample N` (counting from 1), or `No rich vein` if none gets there.

  Doña Eulalia only wants to know where to start digging: as soon as you find one, stop searching with `break`. Use the `for`'s `else` for the case where there wasn't any. The list changes on every test.
visual:
  figure:
    input: { label: "samples (example)", cells: [40, 85, 120, 300], highlight: [2] }
    arrow: the first with 100 or more
    output: { label: Output, text: "Rich vein in sample 3" }
starter: |
  # samples already exists
  number = 0
  print(samples)
solution: |
  number = 0
  for sample in samples:
      number += 1
      if sample >= 100:
          print(f"Rich vein in sample {number}")
          break
  else:
      print("No rich vein")
hints:
  - A counter `number` that goes up on every pass tells you which sample you're on.
  - "The `else` lines up with the `for`, not with the `if`: it runs only if the loop reached the end without a `break`."
globals:
  samples: [40, 85, 120, 300]
scenarios:
  - tests:
      - name: "[40, 85, 120, 300] → number 3"
        output: Rich vein in sample 3
  - globals: { samples: [10, 20, 30] }
    tests:
      - name: "[10, 20, 30] → none"
        output: No rich vein
  - globals: { samples: [150] }
    tests:
      - name: "[150] → number 1"
        output: Rich vein in sample 1
  - globals: { samples: [99, 100, 500] }
    tests:
      - name: "[99, 100, 500] → number 2 (100 already counts)"
        output: Rich vein in sample 2
tests:
  - name: stops searching with break
    source: '\bbreak\b'
    msg: As soon as you find it, leave the loop with break.
```

```exercise
id: py3-escribe-pilares
type: write
title: The pillars on every level
prompt: |
  Print one line per level with the code of every chamber on that level: `L1-C1 L1-C2 L1-C3`, and so on.

  Before going in, Quilla checks the pillars of every chamber. The mine has `levels` levels and each level has `chambers` chambers, counting from 1; both numbers change on every test. Use a loop inside another: the outer one walks the levels, the inner one the chambers. To keep the chambers on the same line, print them with `end=" "` and finish each level with an empty `print()`.
visual:
  figure:
    input: { label: "levels = 2, chambers = 3", text: "levels = 2\nchambers = 3" }
    arrow: a for inside another
    output: { label: Output, text: "L1-C1 L1-C2 L1-C3\nL2-C1 L2-C2 L2-C3" }
starter: |
  # levels and chambers already exist
  print("L1-C1")
solution: |
  for level in range(1, levels + 1):
      for chamber in range(1, chambers + 1):
          print(f"L{level}-C{chamber}", end=" ")
      print()
hints:
  - "`range(1, levels + 1)` counts 1, 2, …, levels."
  - "The empty `print()` goes inside the levels' `for` but outside the chambers' one: with the same indentation as the inner `for`."
globals:
  levels: 2
  chambers: 3
scenarios:
  - tests:
      - name: 2 levels × 3 chambers
        output: "L1-C1 L1-C2 L1-C3\nL2-C1 L2-C2 L2-C3"
  - globals: { levels: 3, chambers: 2 }
    tests:
      - name: 3 levels × 2 chambers
        output: "L1-C1 L1-C2\nL2-C1 L2-C2\nL3-C1 L3-C2"
  - globals: { levels: 1, chambers: 4 }
    tests:
      - name: 1 level × 4 chambers
        output: L1-C1 L1-C2 L1-C3 L1-C4
tests:
  - name: a for inside another
    source: '\bfor\b[^\n]*\n\s+for\b'
    msg: Put the chambers' for inside the levels' for.
```

```exercise
id: py3-arregla-tunel
type: fix
title: The tunnel that never ended
prompt: |
  A helper wrote this program so Quilla walks the tunnel collecting on every tile it reaches and, at the end, reports the total. Run it: Quilla keeps collecting on the same spot until the Workshop stops it. Fix it so it moves, collects on **every** tile (the last one too) and reports just once. It's tested on two tunnels.
starter: |
  total = 0
  while not robot.wall_ahead():
      total += robot.collect()
  robot.forward()
  robot.report(total)
solution: |
  total = 0
  while not robot.wall_ahead():
      robot.forward()
      total += robot.collect()
  robot.report(total)
hints:
  - "Which line changes what the `while` asks? If it's outside the block, the condition never changes."
  - Move first and collect afterwards, so the last tile counts too.
world:
  theme: mina
  level: 3
  dir: E
  map: |
    ##########
    ##########
    #R.2.1..3#
    ##########
    ##########
scenarios:
  - {}
  - map: |
      #######
      #######
      #R4..2#
      #######
      #######
tests:
  - name: no crystals left
    state: w.crystals_left == 0
    msg: There are crystals left in the tunnel. Do you also collect on the last tile?
  - name: reports the total, once
    state: w.reports == [w.crystals_total]
    msg: Report once, after the loop, the total you collected.
  - name: without crashing
    state: not w.crashed
```

## The case

```exercise
id: py3-caso-vagoneta
type: case
title: The short cart
prompt: |
  **Add up the kilos of each shift, without counting the carts under maintenance, and compare it with what each robot reported.** One of them reported a cart that never went out.

  San Expedito runs four shifts, and each one has a robot that writes down in its notebook the kilos of every cart that goes out. At the end of the week, the plant's scale weighed less ore than the reports added up to: almost a whole cart is missing. In the notebooks, a `0` is a cart that went out empty and a `-1` is one that was under **maintenance** and didn't go out: that one isn't added (`continue`).

  Print one line per robot that starts with its name, for example `print("Tunki:", tunki_total)`, and the board will tell you whether it matches.
visual:
  board:
    for: py3-caso-vagoneta
    task: "Shift total = the sum of its carts, without the -1s. Compare it with what each robot reported."
    cards:
      - name: Tunki
        kind: robot
        role: Morning shift
        with: { name: Don Fortunato, kind: person, label: shift boss }
        rows: [["Carts in the notebook", "10"], ["Reported", "568 kg"]]
        clue: { find: "Tunki", says: 568, saysLabel: Reported }
      - name: Chaska
        kind: robot
        role: Afternoon shift
        with: { name: Señora Yolanda, kind: person, label: shift boss }
        rows: [["Carts in the notebook", "10"], ["Reported", "712 kg"]]
        clue: { find: "Chaska", says: 712, saysLabel: Reported }
      - name: Wayra
        kind: robot
        role: Night shift
        culprit: true
        with: { name: Don Saturnino, kind: person, label: shift boss }
        rows: [["Carts in the notebook", "10"], ["Reported", "557 kg"]]
        clue: { find: "Wayra", says: 557, saysLabel: Reported }
      - name: Pallqa
        kind: robot
        role: Small-hours shift
        with: { name: Edith, kind: person, label: shift boss }
        rows: [["Carts in the notebook", "10"], ["Reported", "573 kg"]]
        clue: { find: "Pallqa", says: 573, saysLabel: Reported }
      - name: How to read the notebook
        kind: note
        role: Doña Eulalia's instructions
        rows: [["A number", "kilos in that cart"], ["0", "went out empty"], ["-1", "under maintenance: didn't go out, not added"]]
starter: |
  # Each shift's notebook: the kilos in every cart, in the order they went out.
  # 0 = went out empty · -1 = was under maintenance and didn't go out (not added)
  tunki_shift = [82, 75, 0, 91, -1, 68, 77, 85, 0, 90]
  chaska_shift = [88, 64, 79, 93, 71, 0, 86, 62, 95, 74]
  wayra_shift = [70, -1, 83, 0, 92, 66, -1, 81, 78, 0]
  pallqa_shift = [-1, 94, 87, 0, 73, 69, 90, -1, 84, 76]

  # TODO: add up the kilos of each shift, skipping the -1s,
  # and print one line per robot, for example:
  # print("Tunki:", tunki_total)
solution: |
  tunki_shift = [82, 75, 0, 91, -1, 68, 77, 85, 0, 90]
  chaska_shift = [88, 64, 79, 93, 71, 0, 86, 62, 95, 74]
  wayra_shift = [70, -1, 83, 0, 92, 66, -1, 81, 78, 0]
  pallqa_shift = [-1, 94, 87, 0, 73, 69, 90, -1, 84, 76]

  tunki_total = 0
  for kilos in tunki_shift:
      if kilos == -1:
          continue
      tunki_total += kilos

  chaska_total = 0
  for kilos in chaska_shift:
      if kilos == -1:
          continue
      chaska_total += kilos

  wayra_total = 0
  for kilos in wayra_shift:
      if kilos == -1:
          continue
      wayra_total += kilos

  pallqa_total = 0
  for kilos in pallqa_shift:
      if kilos == -1:
          continue
      pallqa_total += kilos

  print("Tunki:", tunki_total)
  print("Chaska:", chaska_total)
  print("Wayra:", wayra_total)
  print("Pallqa:", pallqa_total)
answer: Wayra
answerLabel: Which robot reported one cart too many?
reveal: |
  Wayra. Its notebook adds up to `70 + 83 + 0 + 92 + 66 + 81 + 78 + 0 = 470` kilos, without the two `-1`s, and it reported 557: 87 kilos too many, a cart that never went out. The other three match: 568, 712 and 573. If you add the `-1`s, Tunki, Wayra and Pallqa seem off by one or two kilos: that's why you have to skip them.
hints:
  - "One accumulator per shift that starts at 0, and a `for kilos in tunki_shift:` that adds every cart to it."
  - "Inside the loop, `if kilos == -1: continue` skips the cart under maintenance before adding it."
```

## The judge

Read the input with `input()` as in session 1. When a line has several numbers, `input().split()` gives you the list of their texts and you can walk it with a `for`; convert each text with `int(...)` before comparing.

```exercise
id: py3-juez-racha
type: judge
title: The longest streak
prompt: |
  **Print how many days the longest streak of consecutive days with production above the threshold lasts, and on which day it starts.**

  Doña Eulalia writes down every day how many tonnes the mine produced. At the end of the month she wants to reward the team for its best streak: the **consecutive** days on which production was **above** (not equal to) the target. If several streaks are equally long, the **first** one wins.

  **Input:** one line with two integers, `N` (the days) and `U` (the threshold); another with the `N` productions, separated by spaces. Days are numbered from 1.

  **Output:** one line with two integers separated by a space: the length of the longest streak and the day it starts. If no day is above the threshold, print `0 0`.

  **Constraints:** 1 ≤ N ≤ 1000 · 0 ≤ U ≤ 200 · each production between 0 and 300.
visual:
  figure:
    title: Example 1, day by day
    panes:
      - label: Input
        text: "10 50\n48 55 61 50 70 72 75 20 51 52"
      - label: "Production on days 1 to 10 (the longest streak, highlighted)"
        cells: [48, 55, 61, 50, 70, 72, 75, 20, 51, 52]
        highlight: [4, 5, 6]
        index: false
      - label: Output
        text: "3 5"
    caption: "There are three streaks above 50: days 2–3, days 5–7 and days 9–10. Day 4 produced **exactly** 50, so it breaks the first streak."
starter: |
  parts = input().split()
  threshold = int(parts[1])
  production = input().split()
  # walk the days and measure each streak above the threshold

  print(0, 0)
solution: |
  parts = input().split()
  threshold = int(parts[1])
  production = input().split()
  best = 0
  best_start = 0
  streak = 0
  day = 0
  for text in production:
      day += 1
      if int(text) > threshold:
          streak += 1
          if streak > best:
              best = streak
              best_start = day - streak + 1
      else:
          streak = 0
  print(best, best_start)
hints:
  - "A `streak` counter goes up on every day above the threshold and drops back to 0 as soon as a day falls short. Alongside it, keep the best streak seen and where it started."
  - "Compare with the best **on every day** of the streak, not only when it breaks: the longest streak may end on the very last day. And use a strict `>` so that, in a tie, the first one stays."
samples:
  - input: "10 50\n48 55 61 50 70 72 75 20 51 52"
    output: "3 5"
    note: "The streak on days 5, 6 and 7 (70, 72, 75) is the longest. Day 4 (50) isn't above the threshold."
  - input: "5 100\n100 90 80 100 95"
    output: "0 0"
    note: No day is above 100; reaching exactly 100 doesn't count.
edge:
  - input: "1 0\n1"
    tag: with a single day above the threshold
  - input: "1 9\n3"
    tag: with a single day that falls short
  - input: "4 10\n11 12 13 14"
    tag: when every day is above the threshold
  - input: "6 5\n9 1 7 8 9 10"
    tag: when the longest streak ends on the last day
  - input: "7 5\n6 7 1 8 9 2 3"
    tag: with two equally long streaks
  - input: "3 5\n5 5 5"
    tag: when every day is exactly at the threshold
  - input: "8 0\n0 1 0 1 1 0 0 2"
    tag: with threshold 0
random:
  count: 40
  seed: 33
  tag: ""
  generate: |
    n = rng.pick([rng.int(1, 15), rng.int(20, 200), rng.int(500, 1000)])
    threshold = rng.int(10, 200)
    days = []
    for _ in range(n):
        if rng.int(0, 4) == 0:
            days.append(threshold)
        else:
            days.append(min(300, max(0, threshold + rng.int(-20, 25))))
    return f"{n} {threshold}\n{' '.join(map(str, days))}"
wrong:
  - |
    parts = input().split()
    threshold = int(parts[1])
    production = input().split()
    best = 0
    best_start = 0
    streak = 0
    day = 0
    for text in production:
        day += 1
        if int(text) >= threshold:
            streak += 1
            if streak > best:
                best = streak
                best_start = day - streak + 1
        else:
            streak = 0
    print(best, best_start)
  - |
    parts = input().split()
    threshold = int(parts[1])
    production = input().split()
    best = 0
    best_start = 0
    streak = 0
    day = 0
    for text in production:
        day += 1
        if int(text) > threshold:
            streak += 1
        else:
            if streak > best:
                best = streak
                best_start = day - streak
            streak = 0
    print(best, best_start)
  - |
    parts = input().split()
    threshold = int(parts[1])
    production = input().split()
    best = 0
    best_start = 0
    streak = 0
    day = 0
    for text in production:
        day += 1
        if int(text) > threshold:
            streak += 1
            if streak >= best:
                best = streak
                best_start = day - streak + 1
        else:
            streak = 0
    print(best, best_start)
```

## Final mission

```exercise
id: py3-mision-galerias
type: mission
title: The galleries of San Expedito
prompt: |
  **Walk every gallery in the tunnel collecting the crystals on every tile, finish at the lift (D) and report the total just once.**

  The tunnel goes down in a zigzag: one gallery heading east, a passage **2 tiles** down, another gallery heading west, another passage, and so on. The passages have no crystals. Doña Eulalia tells you how many galleries there are in `galleries`; nobody knows how long each one is. The lift is at the end of the last gallery.

  - To walk a whole gallery, use the `while` from the job's scene.
  - To repeat it for every gallery, put it inside a `for` with `range`.
  - After an odd gallery (the 1st, the 3rd…) you go down turning **right**; after an even one, turning **left**. After the last one you don't go down: `break`.

  Quilla carries **just enough battery** and is tested on three different tunnels. When it passes, together with the judge, session 4 unlocks.
starter: |
  total = 0
  # galleries already exists: how many galleries this tunnel has

  while not robot.wall_ahead():
      robot.forward()
      total += robot.collect()

  robot.report(total)
solution: |
  total = 0
  for gallery in range(1, galleries + 1):
      while not robot.wall_ahead():
          robot.forward()
          total += robot.collect()
      if gallery == galleries:
          break
      if gallery % 2 == 1:
          robot.turn_right()
          robot.forward(2)
          robot.turn_right()
      else:
          robot.turn_left()
          robot.forward(2)
          robot.turn_left()
  robot.report(total)
hints:
  - "The `while` that walks a gallery goes **inside** the `for gallery in range(1, galleries + 1):`."
  - "`gallery % 2 == 1` is true on odd galleries. Facing east, two right turns (with the passage in between) leave you facing west; facing west, two left turns leave you facing east."
globals:
  galleries: 3
world:
  theme: mina
  level: 3
  dir: E
  battery: 28
  map: |
    ###########
    #R.2...1..#
    #########.#
    #.3..2....#
    #.#########
    #...4.1..D#
    ###########
scenarios:
  - {}
  - globals: { galleries: 2 }
    world: { battery: 12 }
    map: |
      ########
      #R1..3.#
      ######.#
      #D.4...#
      ########
  - globals: { galleries: 4 }
    world: { battery: 42 }
    map: |
      ############
      #R..5.....2#
      ##########.#
      #.1.....3..#
      #.##########
      #..2..6....#
      ##########.#
      #D....4..1.#
      ############
tests:
  - name: no crystals left in the tunnel
    state: w.crystals_left == 0
    msg: Some crystals weren't collected. Do you collect on every tile of every gallery?
  - name: ends at the lift
    state: w.at_goal
    msg: Quilla didn't end at the lift (D), at the end of the last gallery.
  - name: reports the exact total, once
    state: w.reports == [w.crystals_total]
    msg: The reported number isn't the tunnel's total (or it was reported more than once).
  - name: Quilla doesn't crash
    state: not w.crashed
  - name: a while inside a for with range
    source: '\bfor\s+\w+\s+in\s+range\([^\n]*\n(?:[^\n]*\n)*?\s+while\b'
    msg: Repeat each gallery's while inside a for with range.
```

## Expert challenge

```exercise
id: py3-reto-vigas
type: challenge
title: The beams that can't be split
visual:
  figure:
    title: Which beams work as posts
    input: { label: "start = 10, end = 30", cells: [11, 13, 17, 19, 23, 29], index: false }
    arrow: no divisors between 2 and the length − 1
    output: { label: Output, text: "11\n13\n17\n19\n23\n29\nTotal: 6" }
    steps:
      - "A 12 m beam can be cut into equal pieces of 2, 3, 4 or 6 m: it's no good as a post."
      - "A 13 m one can't be split into equal whole pieces: it works."
prompt: |
  **Print, one per line, the lengths between `start` and `end` (included) that can't be cut into equal whole pieces, and at the end `Total: N`.** For people who already code.

  The mine's store has beams of every whole length, in metres. A beam of length L can be split if some piece length between 2 and L − 1 divides it exactly; the ones that can't be split (with L at least 2) are used whole as posts. Solve it with a loop inside another and the inner `for`'s `else`, without flag variables. `start` and `end` change on every test.
starter: |
  # start and end already exist
  total = 0
  print(f"Total: {total}")
solution: |
  total = 0
  for length in range(max(start, 2), end + 1):
      divisor = 2
      while divisor * divisor <= length:
          if length % divisor == 0:
              break
          divisor += 1
      else:
          print(length)
          total += 1
  print(f"Total: {total}")
hints:
  - "For each length, try divisors in a loop; if one divides exactly (`length % divisor == 0`), `break`. That loop's `else` runs only if no divisor worked."
  - "It's enough to try divisors while `divisor * divisor <= length`: if L had a bigger divisor, it would also have a smaller one. And 1 isn't a valid length."
globals:
  start: 10
  end: 30
scenarios:
  - tests:
      - name: from 10 to 30
        output: "11\n13\n17\n19\n23\n29\nTotal: 6"
  - globals: { start: 1, end: 10 }
    tests:
      - name: from 1 to 10 (1 doesn't count)
        output: "2\n3\n5\n7\nTotal: 4"
  - globals: { start: 24, end: 28 }
    tests:
      - name: from 24 to 28, none
        output: "Total: 0"
  - globals: { start: 2, end: 2 }
    tests:
      - name: only the 2 m one
        output: "2\nTotal: 1"
  - globals: { start: 90, end: 110 }
    tests:
      - name: from 90 to 110
        output: "97\n101\n103\n107\n109\nTotal: 5"
tests:
  - name: cuts the search short with break
    source: '\bbreak\b'
    msg: As soon as you find a divisor, leave the loop with break and let the else do the rest.
```
