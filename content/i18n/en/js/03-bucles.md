# Session 3 — Loops

## The job

The Santa Clotilde mine, an hour from Huancayo climbing up toward the puna, found a vein of quartz in an old tunnel. Nobody knows how long the tunnel is: the plans got soaked in 1987. Engineer Ccori wants Chasqui to walk all of it, pick up the crystals and report how many there are, without crashing into the rock at the end.

We gave it a headlamp. What we can't give it is a fixed number of steps, because nobody knows it. Chasqui has to **repeat** until the tunnel runs out.

```scene
theme: mina
level: 3
dir: E
caption: The Santa Clotilde tunnel. Chasqui repeats the same thing on every tile (move, collect) until the rock blocks the way.
map: |
  ###########
  ###########
  #R.2..3.1.#
  ###########
  ###########
program: |
  let total = 0;
  while (!robot.wallAhead()) {
    robot.forward();
    total += robot.collect();
  }
  robot.report(total);
```

## The minimum

A loop repeats a block. There are three you'll use all the time:

```js run
const veins = [3, 0, 5, 2];        // an array: a list of values

for (let i = 0; i < veins.length; i++) {
  console.log(`vein ${i}: ${veins[i]} crystals`);
}

let total = 0;
for (const vein of veins) {
  total += vein;
}
console.log("total", total);

let lamp = 3;
while (lamp > 0) {
  lamp--;
}
console.log("lamp", lamp);
```

- **The classic `for`** when you need the counter `i`: start at `0`, keep going *while* `i < veins.length`, add one each pass.
- **`for...of`** when you only need each value, one after another. It's the clearest way to walk an array.
- **`while`** when you don't know how many passes there will be: it repeats *while* the condition is true. If it never becomes false, the loop never ends (here the Workshop cuts it off after two seconds).

Watch the classic `for` step by step: the counter `i` moves from cell to cell and `total` grows on every pass.

```anim
title: A loop walks the list, one cell per pass
code: |
  const veins = [3, 0, 5, 2];
  let total = 0;
  for (let i = 0; i < veins.length; i++) {
    total += veins[i];
  }
  console.log(total);
cells: { of: veins, at: i }
notes:
  3: "One more pass: i points at the cell whose turn it is."
  4: "That cell is added to total."
  6: "i is now 4 and 4 < 4 is false: the loop is over."
```

Arrays start counting at **0**: the first element is `veins[0]` and the last is `veins[veins.length - 1]`. `total += vein` is short for `total = total + vein`, and `i++` for `i = i + 1`.

> **Common trap:** the *off-by-one*. `i <= veins.length` takes one pass too many and reads `veins[4]`, which doesn't exist: it's `undefined`, and `total + undefined` is `NaN`.

<!-- legacy: for-of -->

<!-- mdn: arrays for for-of while -->

## Practice

```exercise
id: js3-predice-suma
type: predict
title: Counting carts
prompt: |
  What does it print?
code: |
  let total = 0;
  for (let i = 1; i <= 4; i++) {
    total += i;
  }
  console.log(total);
options:
  - "10"
  - "4"
  - "6"
  - "15"
answer: "10"
explain: |
  `i` takes 1, 2, 3 and 4 (because of `<=`), and they add up: 10.
```

```exercise
id: js3-predice-lampara
type: predict
title: The carbide lamp
prompt: |
  Each trip uses 3 battery and Chasqui only sets out if it has at least 3 left. What does it print?
code: |
  let battery = 10;
  let trips = 0;
  while (battery >= 3) {
    battery -= 3;
    trips++;
  }
  console.log(trips, battery);
options:
  - "3 1"
  - "4 -2"
  - "3 0"
  - "10 3"
answer: "3 1"
explain: |
  10 → 7 → 4 → 1. At 1 the condition `1 >= 3` is false and the loop ends: 3 trips, 1 left.
```

```exercise
id: js3-completa-vetas
type: complete
title: The morning count
prompt: |
  Complete the loop to add up all the crystals in `veins`.
starter: |
  const veins = [3, 0, 5, 2, 7];
  let total = 0;
  for (let i = 0; i < ___; i++) {
    total += ___;
  }
  console.log(total);
solution: |
  const veins = [3, 0, 5, 2, 7];
  let total = 0;
  for (let i = 0; i < veins.length; i++) {
    total += veins[i];
  }
  console.log(total);
hints:
  - The loop keeps going while `i` is less than the number of elements.
  - Element number `i` is read with square brackets.
tests:
  - name: adds up to 17
    output: "17"
  - name: doesn't hard-code the 5
    source: '\.length'
    msg: Use veins.length, so the loop works for any list.
```

```exercise
id: js3-arregla-nan
type: fix
title: The total that came out NaN
prompt: |
  The engineer's assistant wrote this and the mine's whiteboard says `NaN`. There are **two** mistakes on the same line.
starter: |
  const veins = [4, 1, 6, 3];
  let total = 0;
  for (let i = 1; i <= veins.length; i++) {
    total += veins[i];
  }
  console.log(total);
solution: |
  const veins = [4, 1, 6, 3];
  let total = 0;
  for (let i = 0; i < veins.length; i++) {
    total += veins[i];
  }
  console.log(total);
hints:
  - What number do array indexes start at?
  - "`veins[4]` doesn't exist. Which condition stops you from reaching 4?"
tests:
  - name: adds up to 14
    output: "14"
```

```exercise
id: js3-escribe-pared
type: write
title: All the way down
prompt: |
  Make Chasqui move forward until it's facing the wall at the end, without crashing.

  The tunnel's length is unknown. `robot.wallAhead()` returns `true` if the tile in front is rock. It's tested in three tunnels.
starter: |
  robot.forward();
solution: |
  while (!robot.wallAhead()) {
    robot.forward();
  }
hints:
  - "Repeat while there is NO wall: `while (!robot.wallAhead())`."
world:
  theme: mina
  level: 3
  dir: E
  map: |
    ########
    #R.....#
    ########
scenarios:
  - {}
  - map: |
      #############
      #R..........#
      #############
  - map: |
      ####
      #R.#
      ####
tests:
  - name: ends facing the wall
    state: w.wallAhead
    msg: Chasqui stopped before the end.
  - name: without crashing
    state: '!w.crashed'
  - name: uses while
    source: '\bwhile\s*\('
```

```exercise
id: js3-escribe-vacias
type: write
title: Empty veins
prompt: |
  Count how many veins have 0 crystals and store that number in `empty`. Walk `veins` with `for...of`; the list changes on every test.
visual:
  figure:
    input: { label: "veins (example)", cells: [3, 0, 5, 0, 0, 2], highlight: [1, 3, 4] }
    arrow: count the zeros
    output: { label: empty, value: "3" }
starter: |
  let empty = 0;

  console.log(empty);
solution: |
  let empty = 0;
  for (const vein of veins) {
    if (vein === 0) {
      empty++;
    }
  }
  console.log(empty);
hints:
  - Inside the loop, an if that adds one only when the vein is 0.
globals:
  veins: [3, 0, 5, 0, 0, 2]
scenarios:
  - tests:
      - name: "[3, 0, 5, 0, 0, 2] → 3"
        expect: empty === 3
  - globals: { veins: [1, 2, 3] }
    tests:
      - name: "[1, 2, 3] → 0"
        expect: empty === 0
  - globals: { veins: [0] }
    tests:
      - name: "[0] → 1"
        expect: empty === 1
tests:
  - name: uses for...of
    source: '\bfor\s*\(\s*(const|let)\s+\w+\s+of\b'
    msg: Walk veins with for (const vein of veins).
```

## The case

```exercise
id: js3-caso-tramo
type: case
title: The plundered section
prompt: |
  Work out how many crystals are missing in each section (yesterday − today) and find the section where the most are missing.

  The tunnel is split into 20 sections. Yesterday afternoon Chasqui counted the crystals in each; this morning it counted again. Someone got in overnight. The sections that have *more* today than yesterday are no mystery: the rock crumbles and new crystals show up.

  Mind the numbering: section 1 is position `0` in each list.
visual:
  figure:
    title: Both counts, section by section
    table: { head: ["section", "position", "yesterday", "today", "missing"], rows: [["1", "0", "18", "17", "**1** (18 − 17)"], ["2", "1", "25", "25", "?"], ["3", "2", "31", "24", "?"], ["4", "3", "12", "13", "?"], ["5", "4", "40", "36", "?"], ["6", "5", "22", "22", "?"], ["7", "6", "27", "20", "?"], ["8", "7", "35", "35", "?"], ["9", "8", "19", "19", "?"], ["10", "9", "44", "31", "?"], ["11", "10", "16", "16", "?"], ["12", "11", "29", "28", "?"], ["13", "12", "38", "26", "?"], ["14", "13", "21", "21", "?"], ["15", "14", "33", "33", "?"], ["16", "15", "26", "15", "?"], ["17", "16", "14", "14", "?"], ["18", "17", "41", "39", "?"], ["19", "18", "30", "30", "?"], ["20", "19", "24", "24", "?"]] }
starter: |
  const yesterday = [18, 25, 31, 12, 40, 22, 27, 35, 19, 44, 16, 29, 38, 21, 33, 26, 14, 41, 30, 24];
  const today     = [17, 25, 24, 13, 36, 22, 20, 35, 19, 31, 16, 28, 26, 21, 33, 15, 14, 39, 30, 24];

  // This is how one section works out: section 1 is at position 0.
  console.log("Section 1: missing", yesterday[0] - today[0]);

  // TODO: walk the 20 sections, work out yesterday[i] - today[i] for each
  // and keep the section where the most are missing. Print it like: Section 7: missing 5
solution: |
  const yesterday = [18, 25, 31, 12, 40, 22, 27, 35, 19, 44, 16, 29, 38, 21, 33, 26, 14, 41, 30, 24];
  const today     = [17, 25, 24, 13, 36, 22, 20, 35, 19, 31, 16, 28, 26, 21, 33, 15, 14, 39, 30, 24];

  let worstSection = 0;
  let biggestLoss = 0;
  for (let i = 0; i < yesterday.length; i++) {
    const loss = yesterday[i] - today[i];
    if (loss > biggestLoss) {
      biggestLoss = loss;
      worstSection = i + 1;
    }
  }
  console.log(`Section ${worstSection}: ${biggestLoss} missing`);
answer: "10"
answerLabel: Which section lost the most? (just the number)
reveal: |
  Section 10: from 44 to 31, 13 are missing. Close behind are section 13 (12 missing) and 16 (11 missing), which is why it's easy to get wrong by eye. And mind the index: section 10 is `yesterday[9]`.
hints:
  - You need the index to read the same section in both arrays, so this is a job for the classic `for`.
  - Keep two variables, the biggest loss seen so far and its section; change them only when a bigger one shows up. The section is `i + 1`.
```

## The judge

Read with `readNumber()` and `readNumbers()` as in session 1.

```exercise
id: js3-juez-vagonetas
type: judge
title: The ore cart report
prompt: |
  Print three numbers: the total crystals, how many carts came out empty and the biggest load.

  At the end of the shift the ore carts leave the mine in a row, and Engineer Ccori wants the day's report.

  **Input:** one line with `N`, the number of carts; another with the `N` loads separated by spaces (empty if `N` is 0).

  **Output:** three lines: the total, the number of empty carts (load 0) and the biggest load (0 if there were no carts).

  **Constraints:** 0 ≤ N ≤ 1000 · each load between 0 and 100.
visual:
  figure:
    title: Sample 1, drawn
    input: { label: "Input: 5 / 3 0 7 0 2", cells: [3, 0, 7, 0, 2], highlight: [1, 3] }
    arrow: a single loop
    output: { label: "Output", table: { head: ["line", "what it is", "value"], rows: [["1", "total: 3 + 0 + 7 + 0 + 2", "12"], ["2", "empty carts (the zeros)", "2"], ["3", "biggest load", "7"]] } }
    steps:
      - "The first line says how many carts there are: 5."
      - "The second brings the loads, one per cart."
starter: |
  const n = readNumber();
  const loads = readNumbers();
  console.log(loads[0]);
solution: |
  const n = readNumber();
  const loads = readNumbers();
  let total = 0;
  let empty = 0;
  let biggest = 0;
  for (const load of loads) {
    total += load;
    if (load === 0) {
      empty++;
    }
    if (load > biggest) {
      biggest = load;
    }
  }
  console.log(total);
  console.log(empty);
  console.log(biggest);
hints:
  - Three accumulators starting at 0 and a single loop that updates them.
  - "What if there are no carts at all? Try the input `0` and an empty line."
samples:
  - input: "5\n3 0 7 0 2"
    output: "12\n2\n7"
  - input: "1\n0"
    output: "0\n1\n0"
    note: A single cart, empty.
edge:
  - input: "0\n"
    tag: with no carts at all
  - input: "3\n0 0 0"
    tag: with every cart empty
  - input: "4\n100 100 100 100"
    tag: with every cart full
  - input: "2\n5 9"
    tag: when the biggest load is the last one
random:
  count: 30
  seed: 33
  generate: |
    const n = rng.int(1, 1000);
    return `${n}\n${rng.list(n, 0, 100).map((v) => (v < 15 ? 0 : v)).join(" ")}`;
wrong:
  - |
    const n = readNumber();
    const loads = readNumbers();
    let total = 0, empty = 0, biggest = 0;
    for (let i = 1; i < n; i++) {
      total += loads[i];
      if (loads[i] === 0) empty++;
      if (loads[i] > biggest) biggest = loads[i];
    }
    console.log(total);
    console.log(empty);
    console.log(biggest);
  - |
    const n = readNumber();
    const loads = readNumbers();
    let total = 0, empty = 0, biggest = loads[0];
    for (const c of loads) {
      total += c;
      if (c === 0) empty++;
      if (c > biggest) biggest = c;
    }
    console.log(total);
    console.log(empty);
    console.log(biggest);
```

## Final mission

```exercise
id: js3-mision-tunel
type: mission
title: The Santa Clotilde tunnel
prompt: |
  Collect every crystal in the tunnel and, once at the end, report the total with `robot.report(total)`.

  Walk the tunnel to the end, **collect on every tile** and **report just once**, at the end. `robot.collect()` picks up the crystals on Chasqui's tile and returns how many it picked up (0 if there were none). It's tested in three tunnels of different lengths.
starter: |
  let total = 0;

  robot.forward();
  total += robot.collect();

  robot.report(total);
solution: |
  let total = 0;
  while (!robot.wallAhead()) {
    robot.forward();
    total += robot.collect();
  }
  robot.report(total);
hints:
  - It's the "All the way down" loop with one more line inside.
  - Collect after moving, on every tile.
world:
  theme: mina
  level: 3
  dir: E
  map: |
    ##############
    ##############
    #R.3..1.2..4.#
    ##############
    ##############
scenarios:
  - {}
  - map: |
      ########
      ########
      #R1.5.2#
      ########
      ########
  - map: |
      ##################
      ##################
      #R..2...6..1...3.#
      ##################
      ##################
tests:
  - name: no crystals left in the tunnel
    state: w.crystalsLeft === 0
    msg: Some crystals were left behind.
  - name: reports the exact total, once
    state: w.reports.length === 1 && w.reports[0] === w.crystalsTotal
    msg: The reported number isn't the tunnel's total (or it was reported more than once).
  - name: Chasqui doesn't crash
    state: '!w.crashed'
  - name: uses a loop
    source: '\b(while|for)\s*\('
```

## Expert challenge

```exercise
id: js3-reto-curvas
type: challenge
title: The winding tunnel
prompt: |
  The service tunnel bends without warning to one side or the other, with no forks. Take Chasqui to the lift at the end (where it can't go any further). `robot.wallAhead("left")` and `robot.wallAhead("right")` look to the sides. It's tested in two tunnels.
starter: |
  while (!robot.wallAhead()) {
    robot.forward();
  }
solution: |
  const boxedIn = () =>
    robot.wallAhead() && robot.wallAhead("left") && robot.wallAhead("right");

  while (!boxedIn()) {
    if (!robot.wallAhead()) {
      robot.forward();
    } else if (!robot.wallAhead("left")) {
      robot.turnLeft();
    } else {
      robot.turnRight();
    }
  }
hints:
  - The tunnel ends when there's a wall ahead and on both sides.
  - "Inside the loop: move forward if you can; if not, turn toward the free side."
world:
  theme: mina
  level: 3
  dir: E
  map: |
    #######
    #R..###
    ###.###
    ###..D#
    #######
scenarios:
  - {}
  - map: |
      #########
      #R..#####
      ###.#..D#
      ###...###
      #########
tests:
  - name: reaches the lift
    state: w.atGoal
    msg: Chasqui didn't end up at the lift.
  - name: without crashing
    state: '!w.crashed'
```
