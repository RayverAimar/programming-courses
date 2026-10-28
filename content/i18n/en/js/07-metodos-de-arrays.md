# Session 7 — Array methods

## The job

Ica, in the middle of the grape harvest. At the Santa Uchuya winery they bottle pisco at night, when the line doesn't have to fight the heat, and five robots run it: Kusi, Tupa, Nina, Puma and Chato. In the small hours the line jammed three times and dawn found 200 bottles with no cap. The engineer, Fiorella Uchuya, is sure it wasn't the machine: "Someone in the fleet is lying to me."

Every robot leaves its trail in the **log**: an array of hundreds of events. Walking it with a `for` for every question is possible, but slow and easy to get wrong. Today Chasqui learns the methods that ask an array questions in one line: **filter, transform, find, add up, sort**. Like a detective with a magnifying glass for each clue.

```scene
theme: cocina
level: 4
dir: E
api: [move, deliver, path]
caption: The Santa Uchuya bottling line. Chasqui marks the stations that failed, checks them one by one and takes the report to the office (the mailbox at the end).
map: |
  ##############
  #R..........D#
  ##############
program: |
  robot.mark([[4, 1], [7, 1], [10, 1]]);
  robot.forward(6);
  robot.say("Repairing 7");
  robot.forward(5);
  robot.deliver("1 repaired");
```

## The minimum

Arrays come with methods that take **a function** (almost always an arrow) and apply it to each element. None of these modifies the original array: they return something new.

```js run
const bottles = [40, 0, 35, 50];
console.log(bottles.map((b) => b * 2));
console.log(bottles.filter((b) => b > 30));
console.log(bottles.find((b) => b > 36), bottles.some((b) => b === 0), bottles.every((b) => b >= 0));
console.log(bottles.reduce((sum, b) => sum + b, 0));
console.log(bottles.toSorted((a, b) => b - a), bottles);
```

Since each one returns a new array, they can be **chained**: one's result goes into the next.

```anim
title: A chain of methods, link by link
code: |
  const shifts = [40, 0, 35, 50];
  const full = shifts.filter((b) => b > 0);
  const boxes = full.map((b) => b / 5);
  const total = boxes.reduce((sum, c) => sum + c, 0);
  console.log(total);
show: [shifts, full, boxes, total]
notes:
  2: "filter keeps the ones that pass: the shift at 0 goes."
  3: "map transforms each one: bottles → boxes of 5."
  4: "reduce combines everything into one value: 8 + 7 + 10."
  5: "shifts is unchanged: no method touched it."
```

`reduce` is the hardest one. Inside, it's a loop with an **accumulator** that starts at the initial value (the `0` at the end) and is passed from pass to pass:

```anim
title: reduce, pass by pass
code: |
  const total = [40, 0, 35, 50].reduce(
    (sum, b) => sum + b,
    0
  );
  console.log(total);
steps:
  - { line: 3, vars: { sum: 0 }, note: "Before starting: sum holds the initial value, 0." }
  - { line: 2, vars: { sum: 0, b: 40 }, note: "1st pass: returns 0 + 40 = 40, which becomes the next sum." }
  - { line: 2, vars: { sum: 40, b: 0 }, note: "2nd pass: 40 + 0 = 40." }
  - { line: 2, vars: { sum: 40, b: 35 }, note: "3rd pass: 40 + 35 = 75." }
  - { line: 2, vars: { sum: 75, b: 50 }, note: "4th pass: 75 + 50 = 125. No more elements." }
  - { line: 1, vars: { total: 125 }, note: "What the last pass returned is the result." }
  - { line: 5, vars: { total: 125 }, out: "125" }
```

- **`map(f)`**: an array of the same length, with `f` applied to each element.
- **`filter(f)`**: the elements for which `f` gives `true`.
- **`find(f)`**: the **first** one that passes, or `undefined`. **`some(f)`**: does any pass? **`every(f)`**: do all pass?
- **`reduce(f, initial)`**: combines everything into one value: a sum, a maximum, an object. Always give the initial value.
- **Sorting**: `toSorted((a, b) => a - b)` returns a copy sorted from smallest to largest; `b - a`, largest to smallest. For strings, `a.localeCompare(b)`. The old **`sort` sorts the array itself** (it modifies it) and also returns it.
- **`join(", ")`** joins the elements into a string, with whatever you pass between each one.

> **Common trap:** `[10, 9, 100].sort()` gives `[10, 100, 9]`. Without a compare function, `sort` sorts **as strings** ("1" comes before "9"), and on top of that it changes the original array. For numbers: `toSorted((a, b) => a - b)`.

<!-- legacy: array-callbacks -->

<!-- legacy: to-sorted -->

<!-- mdn: array-map array-filter array-find array-some array-reduce to-sorted array-sort -->

## Practice

```exercise
id: js7-predice-cadena
type: predict
title: The shifts that count
prompt: |
  What does it print?
code: |
  const shifts = [3, 8, 0, 12];
  const result = shifts.filter((n) => n > 2).map((n) => n * 10);
  console.log(...result, shifts.length);
options:
  - "30 80 120 4"
  - "30 80 0 120 4"
  - "30 80 120 3"
  - "80 120 4"
answer: "30 80 120 4"
explain: |
  `filter` keeps 3, 8 and 12 (0 isn't greater than 2), and `map` multiplies each by 10. `shifts` didn't change: it still has 4 elements. The `...` spreads the array into `console.log` so it prints number by number.
```

```exercise
id: js7-predice-sort
type: predict
title: The ranking that sorted wrong
prompt: |
  Fiorella sorts each robot's boxes with `sort` and stores the result in another variable. What does it print?
code: |
  const boxes = [10, 9, 100];
  const order = boxes.sort();
  console.log(order[0], boxes[0], order === boxes);
options:
  - "10 10 true"
  - "9 10 false"
  - "9 9 true"
  - "10 10 false"
answer: "10 10 true"
explain: |
  Without a compare function, `sort` sorts as strings: `"10"`, `"100"`, `"9"`. And it doesn't make a copy: it sorts `boxes` itself and returns that same array, which is why `order === boxes`. With `boxes.toSorted((a, b) => a - b)` you'd get `9`, and `boxes` wouldn't change.
```

```exercise
id: js7-completa-buscar
type: complete
title: Who's low on battery?
prompt: |
  Fill each gap with the method that answers the question: the **first** robot under 20 battery, whether **all** have more than 10, and whether **any** is at 100.
visual:
  figure:
    panes:
      - { label: robots, table: { head: ["", "Kusi", "Tupa", "Nina"], rows: [["battery", "80", "15", "55"]] } }
      - { label: "expected", value: "Tupa true false" }
starter: |
  const robots = [
    { name: "Kusi", battery: 80 },
    { name: "Tupa", battery: 15 },
    { name: "Nina", battery: 55 },
  ];
  const firstLow = robots.___((r) => r.battery < 20);
  const allAboveTen = robots.___((r) => r.battery > 10);
  const anyFull = robots.___((r) => r.battery === 100);
  console.log(firstLow.name, allAboveTen, anyFull);
solution: |
  const robots = [
    { name: "Kusi", battery: 80 },
    { name: "Tupa", battery: 15 },
    { name: "Nina", battery: 55 },
  ];
  const firstLow = robots.find((r) => r.battery < 20);
  const allAboveTen = robots.every((r) => r.battery > 10);
  const anyFull = robots.some((r) => r.battery === 100);
  console.log(firstLow.name, allAboveTen, anyFull);
hints:
  - "One returns an element (the first that passes); the other two, `true` or `false`."
  - "\"All?\" is `every`; \"any?\" is `some`."
tests:
  - name: prints Tupa true false
    output: Tupa true false
  - name: uses find, every and some
    source: '\.find\(([\s\S]*)\.every\(([\s\S]*)\.some\('
```

```exercise
id: js7-arregla-reduce
type: fix
title: The total that came out as text
prompt: |
  The night's bottle total came out as `[object Object]3550`. The `reduce` is missing something.
visual:
  figure:
    input: { label: shifts, cards: [{ title: "{ robot: \"Kusi\", bottles: 40 }", rows: [] }, { title: "{ robot: \"Tupa\", bottles: 35 }", rows: [] }, { title: "{ robot: \"Nina\", bottles: 50 }", rows: [] }] }
    arrow: "reduce(..., initial value?)"
    output: { label: "expected", value: "125" }
starter: |
  const shifts = [
    { robot: "Kusi", bottles: 40 },
    { robot: "Tupa", bottles: 35 },
    { robot: "Nina", bottles: 50 },
  ];
  const total = shifts.reduce((sum, shift) => sum + shift.bottles);
  console.log(total);
solution: |
  const shifts = [
    { robot: "Kusi", bottles: 40 },
    { robot: "Tupa", bottles: 35 },
    { robot: "Nina", bottles: 50 },
  ];
  const total = shifts.reduce((sum, shift) => sum + shift.bottles, 0);
  console.log(total);
hints:
  - "Without an initial value, `sum` starts as the **first element**: a whole object, not a number."
  - "Add the initial value as the second argument of `reduce`."
tests:
  - name: adds up to 125
    output: "125"
```

```exercise
id: js7-arregla-ranking
type: fix
title: The line that got shuffled
prompt: |
  The ranking comes out right, but afterwards the `line` list, which should stay in the line's physical order (Kusi, Tupa, Nina), comes out sorted too. Make the ranking leave `line` alone.
visual:
  figure:
    title: What it should print
    panes:
      - { table: { head: ["", "1st", "2nd", "3rd"], rows: [["Ranking", "Nina", "Kusi", "Tupa"], ["Line order", "Kusi", "Tupa", "Nina"]] } }
starter: |
  const line = [
    { name: "Kusi", bottles: 120 },
    { name: "Tupa", bottles: 95 },
    { name: "Nina", bottles: 140 },
  ];
  const ranking = line.sort((a, b) => b.bottles - a.bottles);
  console.log("Ranking:", ranking.map((r) => r.name).join(", "));
  console.log("Line order:", line.map((r) => r.name).join(", "));
solution: |
  const line = [
    { name: "Kusi", bottles: 120 },
    { name: "Tupa", bottles: 95 },
    { name: "Nina", bottles: 140 },
  ];
  const ranking = line.toSorted((a, b) => b.bottles - a.bottles);
  console.log("Ranking:", ranking.map((r) => r.name).join(", "));
  console.log("Line order:", line.map((r) => r.name).join(", "));
hints:
  - "`sort` sorts the array itself. Which method does the same on a copy?"
tests:
  - name: the ranking
    outputIncludes: "Ranking: Nina, Kusi, Tupa"
  - name: the line keeps its order
    outputIncludes: "Line order: Kusi, Tupa, Nina"
```

```exercise
id: js7-escribe-calientes
type: write
title: The hot motors
prompt: |
  Write `hot(readings)`, which returns the **names** of the robots with a temperature **above 70**, in alphabetical order, without modifying `readings`.

  Each reading is `{ robot, temp }`. Do it with a chain: `filter`, `map` and `toSorted`.
visual:
  figure:
    input: { label: readings, table: { head: ["robot", "Puma", "Kusi", "Chato", "Nina"], rows: [["temp", "82", "64", "75", "71"]] } }
    arrow: "filter → map → toSorted"
    output: { label: returns, cells: ["Chato", "Nina", "Puma"] }
starter: |
  function hot(readings) {
  }

  console.log(hot([
    { robot: "Puma", temp: 82 },
    { robot: "Kusi", temp: 64 },
    { robot: "Chato", temp: 75 },
    { robot: "Nina", temp: 71 },
  ]));
solution: |
  function hot(readings) {
    return readings
      .filter((r) => r.temp > 70)
      .map((r) => r.robot)
      .toSorted((a, b) => a.localeCompare(b));
  }

  console.log(hot([
    { robot: "Puma", temp: 82 },
    { robot: "Kusi", temp: 64 },
    { robot: "Chato", temp: 75 },
    { robot: "Nina", temp: 71 },
  ]));
hints:
  - "First `filter` the hot readings, then `map` each reading to its `robot`."
  - "To sort strings: `toSorted((a, b) => a.localeCompare(b))`."
tests:
  - name: the example
    run: 'hot([{ robot: "Puma", temp: 82 }, { robot: "Kusi", temp: 64 }, { robot: "Chato", temp: 75 }, { robot: "Nina", temp: 71 }])'
    equals: ["Chato", "Nina", "Puma"]
  - name: exactly 70 isn't hot
    run: 'hot([{ robot: "Tupa", temp: 70 }])'
    equals: []
  - name: doesn't modify the readings
    expect: '(() => { const l = [{ robot: "Puma", temp: 90 }, { robot: "Illa", temp: 80 }]; hot(l); return l[0].robot === "Puma" && typeof l[0] === "object"; })()'
  - name: uses filter and map
    source: '\.filter\s*\([\s\S]*\.map\s*\('
```

## The case

```exercise
id: js7-caso-saboteo
type: case
title: The robot that padded its report
prompt: |
  Using the log, add up the bottles each robot **capped** and compare it with what it reported. The one that doesn't match lied.

  At the end of the shift, each robot reported how many bottles it capped. The log has everything they did: `cap`, but also `label`, `wash` and `pause`. **Only `cap` events count**. Print one line per robot starting with its name: `Kusi: 190`.
visual:
  board:
    for: js7-caso-saboteo
    task: "For each robot: filter (that robot and action cap) → reduce (sum of bottles). Compare it with its report."
    cards:
      - { name: Kusi, kind: robot, role: Capper 1, rows: [["Reported", "190 bottles"]], clue: { find: "Kusi", says: 190 } }
      - { name: Tupa, kind: robot, role: Capping and labels, rows: [["Reported", "90 bottles"]], clue: { find: "Tupa", says: 90 } }
      - { name: Nina, kind: robot, role: Capping and labels, rows: [["Reported", "180 bottles"]], clue: { find: "Nina", says: 180 } }
      - { name: Puma, kind: robot, role: Washing and caps, rows: [["Reported", "75 bottles"]], clue: { find: "Puma", says: 75 } }
      - { name: Chato, kind: robot, role: Capper 2, culprit: true, rows: [["Reported", "210 bottles"]], clue: { find: "Chato", says: 210 } }
      - { name: Log, kind: note, role: "28 events, from 22:05 to 04:05", rows: [["{ time, robot, action, bottles }", ""], ["actions", "cap, label, wash, pause"]] }
    caption: "If several come out as **doesn't match**, check: are you counting only `cap`?"
starter: |
  const log = [
    { time: "22:05", robot: "Kusi", action: "cap", bottles: 40 },
    { time: "22:10", robot: "Tupa", action: "label", bottles: 35 },
    { time: "22:20", robot: "Nina", action: "cap", bottles: 45 },
    { time: "22:30", robot: "Puma", action: "wash", bottles: 60 },
    { time: "22:40", robot: "Chato", action: "cap", bottles: 30 },
    { time: "22:55", robot: "Kusi", action: "cap", bottles: 40 },
    { time: "23:05", robot: "Tupa", action: "cap", bottles: 25 },
    { time: "23:15", robot: "Nina", action: "label", bottles: 50 },
    { time: "23:30", robot: "Chato", action: "cap", bottles: 35 },
    { time: "23:45", robot: "Puma", action: "cap", bottles: 20 },
    { time: "00:00", robot: "Kusi", action: "pause", bottles: 0 },
    { time: "00:10", robot: "Nina", action: "cap", bottles: 45 },
    { time: "00:25", robot: "Tupa", action: "cap", bottles: 30 },
    { time: "00:40", robot: "Chato", action: "pause", bottles: 0 },
    { time: "00:50", robot: "Puma", action: "cap", bottles: 25 },
    { time: "01:05", robot: "Kusi", action: "cap", bottles: 35 },
    { time: "01:20", robot: "Nina", action: "cap", bottles: 40 },
    { time: "01:35", robot: "Chato", action: "cap", bottles: 30 },
    { time: "01:50", robot: "Tupa", action: "label", bottles: 40 },
    { time: "02:05", robot: "Puma", action: "wash", bottles: 55 },
    { time: "02:20", robot: "Kusi", action: "cap", bottles: 45 },
    { time: "02:35", robot: "Chato", action: "cap", bottles: 25 },
    { time: "02:50", robot: "Nina", action: "pause", bottles: 0 },
    { time: "03:05", robot: "Tupa", action: "cap", bottles: 35 },
    { time: "03:20", robot: "Puma", action: "cap", bottles: 30 },
    { time: "03:35", robot: "Chato", action: "cap", bottles: 40 },
    { time: "03:50", robot: "Kusi", action: "cap", bottles: 30 },
    { time: "04:05", robot: "Nina", action: "cap", bottles: 50 },
  ];
  const robots = ["Kusi", "Tupa", "Nina", "Puma", "Chato"];

  console.log("Events in the log:", log.length);

  // TODO: for each robot, filter its "cap" events and add them up with reduce.
  // Print one line per robot: Kusi: 190
solution: |
  const log = [
    { time: "22:05", robot: "Kusi", action: "cap", bottles: 40 },
    { time: "22:10", robot: "Tupa", action: "label", bottles: 35 },
    { time: "22:20", robot: "Nina", action: "cap", bottles: 45 },
    { time: "22:30", robot: "Puma", action: "wash", bottles: 60 },
    { time: "22:40", robot: "Chato", action: "cap", bottles: 30 },
    { time: "22:55", robot: "Kusi", action: "cap", bottles: 40 },
    { time: "23:05", robot: "Tupa", action: "cap", bottles: 25 },
    { time: "23:15", robot: "Nina", action: "label", bottles: 50 },
    { time: "23:30", robot: "Chato", action: "cap", bottles: 35 },
    { time: "23:45", robot: "Puma", action: "cap", bottles: 20 },
    { time: "00:00", robot: "Kusi", action: "pause", bottles: 0 },
    { time: "00:10", robot: "Nina", action: "cap", bottles: 45 },
    { time: "00:25", robot: "Tupa", action: "cap", bottles: 30 },
    { time: "00:40", robot: "Chato", action: "pause", bottles: 0 },
    { time: "00:50", robot: "Puma", action: "cap", bottles: 25 },
    { time: "01:05", robot: "Kusi", action: "cap", bottles: 35 },
    { time: "01:20", robot: "Nina", action: "cap", bottles: 40 },
    { time: "01:35", robot: "Chato", action: "cap", bottles: 30 },
    { time: "01:50", robot: "Tupa", action: "label", bottles: 40 },
    { time: "02:05", robot: "Puma", action: "wash", bottles: 55 },
    { time: "02:20", robot: "Kusi", action: "cap", bottles: 45 },
    { time: "02:35", robot: "Chato", action: "cap", bottles: 25 },
    { time: "02:50", robot: "Nina", action: "pause", bottles: 0 },
    { time: "03:05", robot: "Tupa", action: "cap", bottles: 35 },
    { time: "03:20", robot: "Puma", action: "cap", bottles: 30 },
    { time: "03:35", robot: "Chato", action: "cap", bottles: 40 },
    { time: "03:50", robot: "Kusi", action: "cap", bottles: 30 },
    { time: "04:05", robot: "Nina", action: "cap", bottles: 50 },
  ];
  const robots = ["Kusi", "Tupa", "Nina", "Puma", "Chato"];

  for (const name of robots) {
    const capped = log
      .filter((e) => e.robot === name && e.action === "cap")
      .reduce((sum, e) => sum + e.bottles, 0);
    console.log(`${name}: ${capped}`);
  }
answer: Chato
answerLabel: Which robot lied in its report?
reveal: |
  Chato: it reported 210, but the log gives it 160. Those 50 bottles of difference come from its "pause" at 00:40, which lasted until 01:35: right when the line jammed. Fiorella checked its arm and found the capper's screw loosened by hand. Chato said it just wanted a rest. They moved it to washing, where there's nothing to jam.
hints:
  - "For one robot: `log.filter((e) => e.robot === name && e.action === \"cap\")` and, chained, `.reduce((sum, e) => sum + e.bottles, 0)`."
  - "Put that in a `for (const name of robots)` and print one line per robot."
```

## The judge

```exercise
id: js7-juez-ranking
type: judge
mode: function
function: ranking
title: The honour board
prompt: |
  Write `ranking(records)`, which returns the robots' names sorted by total bottles, largest to smallest, and `totalOf(records, name)`, which returns one robot's total.

  Fiorella wants an honour board on the winery wall, with no cheating. Each record is a pair `[robot, bottles]`, and a robot appears many times.

  - `totalOf(records, name)`: the sum of that robot's bottles (0 if it doesn't appear).
  - `ranking(records)`: each robot **only once**, sorted by its total from largest to smallest. If two tie, the one that comes first alphabetically goes first.

  **Constraints:** 0 to 40 records · bottles from 0 to 60 · names without accents.
visual:
  figure:
    title: Sample 1
    input: { label: records, table: { head: ["record", "1", "2", "3", "4", "5"], rows: [["robot", "Kusi", "Nina", "Kusi", "Tupa", "Nina"], ["bottles", "40", "30", "20", "50", "30"]] } }
    arrow: "totals: Kusi 60 · Nina 60 · Tupa 50"
    output: { label: "ranking returns", cells: ["Kusi", "Nina", "Tupa"] }
    steps:
      - "Kusi and Nina tie at 60: Kusi goes first alphabetically."
starter: |
  function totalOf(records, name) {
  }

  function ranking(records) {
  }
solution: |
  function totalOf(records, name) {
    return records
      .filter(([robot]) => robot === name)
      .reduce((sum, [, bottles]) => sum + bottles, 0);
  }

  function ranking(records) {
    const names = [];
    for (const [robot] of records) {
      if (!names.includes(robot)) {
        names.push(robot);
      }
    }
    return names.toSorted((a, b) => totalOf(records, b) - totalOf(records, a) || a.localeCompare(b));
  }
hints:
  - "In the comparator, first the difference of totals; if it's 0, break the tie with `a.localeCompare(b)`. `x || y` uses `y` when `x` is 0."
  - "To have each name once, walk through the records and add the name only if it isn't there yet (`includes`), as in session 5."
samples:
  - args: [[["Kusi", 40], ["Nina", 30], ["Kusi", 20], ["Tupa", 50], ["Nina", 30]]]
    returns: ["Kusi", "Nina", "Tupa"]
    note: Kusi and Nina tie at 60.
  - fn: totalOf
    args: [[["Kusi", 40], ["Nina", 30], ["Kusi", 20]], "Kusi"]
    returns: 60
  - args: [[["Puma", 10], ["Chato", 25]]]
    returns: ["Chato", "Puma"]
edge:
  - args: [[]]
    tag: with no records
  - fn: totalOf
    args: [[["Kusi", 40]], "Puma"]
    tag: in totalOf, with a robot that doesn't appear
  - args: [[["Tupa", 0], ["Kusi", 0], ["Nina", 0]]]
    tag: when all tie at 0
  - args: [[["Nina", 5], ["Nina", 5], ["Nina", 5]]]
    tag: with a single repeated robot
  - args: [[["Puma", 4], ["Illa", 10], ["Puma", 5]]]
    tag: when the one that appears most isn't the one with the most
random:
  count: 40
  seed: 77
  generate: |
    const names = ["Kusi", "Tupa", "Nina", "Puma", "Chato", "Illa"];
    return [Array.from({ length: rng.int(0, 40) }, () => [rng.pick(names), rng.int(0, 6) * 10])];
wrong:
  - |
    function totalOf(records, name) {
      return records.filter(([r]) => r === name).reduce((s, [, b]) => s + b, 0);
    }
    function ranking(records) {
      const names = [];
      for (const [r] of records) if (!names.includes(r)) names.push(r);
      return names.toSorted((a, b) => totalOf(records, b) - totalOf(records, a));
    }
  - |
    function totalOf(records, name) {
      return records.filter(([r]) => r === name).length;
    }
    function ranking(records) {
      const names = [];
      for (const [r] of records) if (!names.includes(r)) names.push(r);
      return names.toSorted((a, b) => totalOf(records, b) - totalOf(records, a) || a.localeCompare(b));
    }
  - |
    function totalOf(records, name) {
      return records.filter(([r]) => r === name).reduce((s, [, b]) => s + b, 0);
    }
    function ranking(records) {
      return records
        .toSorted((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))
        .map(([r]) => r)
        .filter((r, i, all) => all.indexOf(r) === i);
    }
  - |
    function totalOf(records, name) {
      return records.filter(([r]) => r === name).reduce((s, [, b]) => s + b, 0);
    }
    function ranking(records) {
      const names = [];
      for (const [r] of records) if (!names.includes(r)) names.push(r);
      return names.toSorted((a, b) => totalOf(records, a) - totalOf(records, b) || a.localeCompare(b));
    }
```

## Final mission

```exercise
id: js7-mision-linea
type: mission
title: The line, before dawn
prompt: |
  Mark the stations that failed on the map, repair them **from the one that lost the most bottles to the one that lost the fewest**, and take the report to the office (D) with the label `` `${n} repaired` ``.

  The `log` holds events like `{ station: 4, kind: "failure", lost: 30 }` or `{ station: 2, kind: "ok", lost: 0 }`. Station `n` is the tile `[n, 1]`, in Chasqui's row. Each station fails at most once.

  1. `robot.mark(tiles)` tints the tiles of a list like `[[4, 1], [7, 1]]`.
  2. You already have `goTo(x)`, which takes Chasqui to column `x`. At each station, `` robot.say(`Repairing ${station}`) ``.
  3. Finally, `goTo` the office and `robot.deliver(...)`.

  The log changes in each test.
visual:
  figure:
    title: The first log, sorted by losses (one column per failure)
    input: { label: "log (failures only)", table: { head: ["failure", "1", "2", "3"], rows: [["station", "4", "10", "7"], ["lost", "30", "80", "45"]] } }
    arrow: "filter → toSorted (most lost first) → map"
    output: { label: "Chasqui says, in order", cells: ["Repairing 10", "Repairing 7", "Repairing 4"] }
    steps:
      - "Before moving, mark all three: `[[4, 1], [10, 1], [7, 1]]` (the order of the marks doesn't matter)."
      - "At the end: `deliver(\"3 repaired\")` on D."
starter: |
  // log: [{ station: 4, kind: "failure", lost: 30 }, { station: 2, kind: "ok", lost: 0 }, ...]

  // Takes Chasqui to column x of its row.
  function goTo(x) {
    if (x === robot.position.x) {
      return;
    }
    const heading = x > robot.position.x ? "E" : "W";
    while (robot.direction !== heading) {
      robot.turnRight();
    }
    robot.forward(Math.abs(x - robot.position.x));
  }

  const office = 12;

  // TODO: filter the failures, mark them, sort them by losses and repair them.
solution: |
  function goTo(x) {
    if (x === robot.position.x) {
      return;
    }
    const heading = x > robot.position.x ? "E" : "W";
    while (robot.direction !== heading) {
      robot.turnRight();
    }
    robot.forward(Math.abs(x - robot.position.x));
  }

  const office = 12;

  const failures = log.filter((e) => e.kind === "failure");
  robot.mark(failures.map((e) => [e.station, 1]));

  const order = failures.toSorted((a, b) => b.lost - a.lost);
  for (const { station } of order) {
    goTo(station);
    robot.say(`Repairing ${station}`);
  }

  goTo(office);
  robot.deliver(`${failures.length} repaired`);
hints:
  - "`const failures = log.filter((e) => e.kind === \"failure\");` and the tiles are `failures.map((e) => [e.station, 1])`."
  - "For the order: `failures.toSorted((a, b) => b.lost - a.lost)`, and a `for...of` that goes to each one."
world:
  theme: cocina
  level: 4
  dir: E
  api: [move, deliver, path]
  map: |
    ##############
    #R..........D#
    ##############
globals:
  log:
    - { station: 2, kind: ok, lost: 0 }
    - { station: 4, kind: failure, lost: 30 }
    - { station: 5, kind: ok, lost: 0 }
    - { station: 10, kind: failure, lost: 80 }
    - { station: 3, kind: ok, lost: 0 }
    - { station: 7, kind: failure, lost: 45 }
    - { station: 9, kind: ok, lost: 0 }
scenarios:
  - {}
  - globals:
      log:
        - { station: 11, kind: failure, lost: 12 }
        - { station: 6, kind: ok, lost: 0 }
        - { station: 2, kind: failure, lost: 60 }
        - { station: 8, kind: ok, lost: 0 }
        - { station: 5, kind: failure, lost: 25 }
        - { station: 9, kind: failure, lost: 90 }
  - globals:
      log:
        - { station: 3, kind: ok, lost: 0 }
        - { station: 6, kind: failure, lost: 15 }
tests:
  - name: marks exactly the stations that failed
    state: 'JSON.stringify([...w.marks].sort()) === JSON.stringify(g.log.filter((e) => e.kind === "failure").map((e) => `${e.station},1`).sort())'
    msg: The marked tiles aren't the failures' tiles.
  - name: repairs from most lost to least
    state: 'JSON.stringify(w.said) === JSON.stringify(g.log.filter((e) => e.kind === "failure").toSorted((a, b) => b.lost - a.lost).map((e) => `Repairing ${e.station}`))'
    msg: 'Chasqui must say "Repairing n" at each failure, from the one that lost most to the one that lost least.'
  - name: delivers the report at the office
    state: 'w.atGoal && w.delivered.length === 1 && w.delivered[0] === `${g.log.filter((e) => e.kind === "failure").length} repaired`'
    msg: At the end, on D, deliver once with a label like "3 repaired".
  - name: no crash
    state: '!w.crashed'
  - name: uses filter and a sort with a comparator
    source: '\.filter\s*\([\s\S]*\.(toSorted|sort)\s*\(\s*\('
```

## Expert challenge

```exercise
id: js7-reto-ordenar
type: challenge
title: Sorting by several criteria
prompt: |
  Write `sortBy(list, ...criteria)`, which returns a copy of `list` (an array of objects) sorted by several criteria in order of priority. Each criterion is a property name; with a `-` in front, largest to smallest. Values are numbers or strings. Don't modify `list`.

  `sortBy(robots, "-bottles", "name")`: most bottles first, and with equal bottles, by name.
starter: |
  function sortBy(list, ...criteria) {
    return list;
  }
solution: |
  function compare(x, y) {
    if (typeof x === "number") {
      return x - y;
    }
    return String(x).localeCompare(String(y));
  }

  function sortBy(list, ...criteria) {
    return list.toSorted((a, b) => {
      for (const criterion of criteria) {
        const desc = criterion.startsWith("-");
        const key = desc ? criterion.slice(1) : criterion;
        const r = compare(a[key], b[key]);
        if (r !== 0) {
          return desc ? -r : r;
        }
      }
      return 0;
    });
  }
hints:
  - "The comparator walks the criteria and returns the first result that isn't 0."
  - "`criterion.startsWith(\"-\")` and `criterion.slice(1)` separate the sign from the name."
tests:
  - name: bottles largest first, then name
    run: 'sortBy([{ name: "Tupa", bottles: 50 }, { name: "Kusi", bottles: 60 }, { name: "Illa", bottles: 50 }], "-bottles", "name").map((r) => r.name)'
    equals: ["Kusi", "Illa", "Tupa"]
  - name: a single string criterion
    run: 'sortBy([{ name: "Puma" }, { name: "Chato" }], "name").map((r) => r.name)'
    equals: ["Chato", "Puma"]
  - name: doesn't modify the list
    expect: '(() => { const l = [{ n: 2 }, { n: 1 }]; sortBy(l, "n"); return l[0].n === 2; })()'
  - name: with no criteria, the same order
    run: 'sortBy([{ n: 2 }, { n: 1 }]).map((r) => r.n)'
    equals: [2, 1]
```
