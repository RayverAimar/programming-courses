# Session 10 — Search (BFS)

## The job

Central Lima, a Sunday in October. The procession is out, Jirón de la Unión is a sea of purple, half the streets are closed off with barriers and the rest are full of street vendors selling turrón. At the pharmacy on Plaza San Martín there's a cool box of insulin that has to reach the emergency ward at Hospital Dos de Mayo, and no motorbike can get through.

Dr. Rocío Paredes called Loop. Chasqui has had a siren since session 2, but his battery lasts **exactly** for the shortest route: not one block more. Trying streets at random won't do. Today Chasqui learns to **search**: explore the map in waves, from where he stands, until he finds the shortest way, and then walk it.

```scene
theme: barranco
level: 4
dir: E
caption: Central Lima with closed streets. Chasqui finds the shortest route to the hospital's emergency entrance (D) and follows it without straying.
map: |
  #############
  #R....#.....#
  #.###.#.###.#
  #.#.....#...#
  #.#.###.#.#.#
  #...#...#.#D#
  ###.#.###.#.#
  #.....#.....#
  #############
program: |
  robot.forward(4);
  robot.turnRight();
  robot.forward(2);
  robot.turnLeft();
  robot.forward(2);
  robot.turnLeft();
  robot.forward(2);
  robot.turnRight();
  robot.forward(4);
  robot.turnRight();
  robot.forward(4);
```

## The minimum

**Breadth-first search** (BFS) explores like a ripple in water: first every tile 1 step away, then every tile 2 away, then 3… The first time the ripple touches the goal, it has found it by the shortest way. It needs three pieces:

- a **queue**: the list of tiles still to explore. You add at the end (`push`) and take from the front (`shift`): the first one in is the first one out;
- a **`Set`** of tiles already seen, so the same one never goes in twice;
- a **`Map`** to remember something about each tile: how many steps away it is, or which tile it came from.

```js run
const seen = new Set(["1,1"]);
seen.add("2,1");
console.log(seen.has("2,1"), seen.has("5,5"), seen.size);
const parent = new Map([["2,1", "1,1"]]);
console.log(parent.get("2,1"), parent.has("9,9"));
```

Tiles are stored as strings, `"x,y"`, because a `Set` compares arrays by identity: `[2, 1]` and another `[2, 1]` are two different arrays. Watch the ripple: the queue (outlined) moves forward and the seen tiles get painted.

```anim
title: The BFS ripple on a 3 × 3 plan
code: |
  const plan = ["...", ".#.", "..."];
  const moves = [[1,0],[0,1],[-1,0],[0,-1]];
  const queue = [[0, 0]];
  const seen = new Set(["0,0"]);
  while (queue.length > 0) {
    const [x, y] = queue.shift();
    for (const [dx, dy] of moves) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      const ok = plan[ny]?.[nx] === ".";
      if (ok && !seen.has(key)) {
        seen.add(key);
        queue.push([nx, ny]);
      }
    }
  }
  console.log(seen.size);
grid: { map: ["...", ".#.", "..."], visited: seen, frontier: queue }
show: [x, y, key]
speed: 500
notes:
  6: "Out of the queue comes the tile that has waited longest."
  7: "Its 4 neighbours are tried."
  12: "A neighbour counts if it's street and nobody has seen it before."
  13: "It's marked as seen when it goes into the queue, not when it comes out."
  18: "The ripple covered all 8 street tiles."
```

To know **the route**, not just the distance, every tile notes in a `Map` which tile it came from (its *parent*). At the end you walk backwards from the goal, parent to parent, and turn the list round:

```js
function shortestRoute(plan, start, goal) {
  const queue = [start];
  const parent = new Map([[start, null]]);
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === goal) break;
    const [x, y] = current.split(",").map(Number);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = `${x + dx},${y + dy}`;
      if (plan[y + dy]?.[x + dx] === "." && !parent.has(next)) {
        parent.set(next, current);
        queue.push(next);
      }
    }
  }
  if (!parent.has(goal)) return null;
  const route = [];
  for (let t = goal; t !== null; t = parent.get(t)) route.push(t);
  return route.reverse();
}
```

Here the `Map` of parents doubles as "seen": if a tile already has a parent, it has already gone into the queue.

```figure
title: Rebuilding the route, from the goal backwards
panes:
  - { label: "the ripple reached H; every tile knows where it came from", grid: ["A..", "#.#", "..H"], marks: ["0,0", "1,0", "2,0", "1,1", "0,2", "1,2", "2,2"], path: ["0,0", "1,0", "1,1", "1,2", "2,2"] }
  - { label: parent, table: { head: ["tile", "came from"], rows: [["2,2 (H)", "1,2"], ["1,2", "1,1"], ["1,1", "1,0"], ["1,0", "0,0"], ["0,0 (A)", "null"]] } }
  - { label: "reversed", value: "0,0 → 1,0 → 1,1 → 1,2 → 2,2" }
```

> **Common trap:** marking a tile as seen when it *leaves* the queue instead of when it *enters*. The same tile goes in several times, once from each neighbour, and on a big map the queue grows out of control. Mark it when you `push`.

`shift()` is handy but slow on huge queues (it moves the whole array along one place). With thousands of tiles, walk the queue with an index: `for (let i = 0; i < queue.length; i++) { const current = queue[i]; … }`.

<!-- legacy: set-vs-object -->

<!-- legacy: map-vs-object -->

<!-- mdn: set-vs-object map-vs-object -->

## Practice

```exercise
id: js10-predice-cola
type: predict
title: The queue's order
prompt: |
  What does it print?
code: |
  const queue = ["Plaza San Martín"];
  queue.push("Jr. Ica", "Jr. Huancavelica");
  const first = queue.shift();
  queue.push("Av. Abancay");
  console.log(first);
  console.log(queue.join(" | "));
options:
  - "Plaza San Martín\nJr. Ica | Jr. Huancavelica | Av. Abancay"
  - "Av. Abancay\nPlaza San Martín | Jr. Ica | Jr. Huancavelica"
  - "Plaza San Martín\nAv. Abancay | Jr. Ica | Jr. Huancavelica"
  - "Jr. Huancavelica\nPlaza San Martín | Jr. Ica | Av. Abancay"
answer: "Plaza San Martín\nJr. Ica | Jr. Huancavelica | Av. Abancay"
explain: |
  `push` adds at the end and `shift` takes from the front: whoever arrived first leaves first, like a queue at the bank. With `pop` the last one would leave (that's a stack, not a queue).
```

```exercise
id: js10-predice-set
type: predict
title: The same tile, twice
prompt: |
  What does it print?
code: |
  const seen = new Set();
  seen.add([2, 3]);
  seen.add("2,3");
  seen.add("2,3");
  console.log(seen.size, seen.has([2, 3]), seen.has("2,3"));
options:
  - "1 true true"
  - "2 false true"
  - "3 false true"
  - "2 true true"
answer: "2 false true"
explain: |
  A `Set` doesn't repeat values: the second `"2,3"` doesn't go in. But two arrays are equal only if they're **the same** array; the `[2, 3]` in `has` is another one, freshly made. That's why tiles are stored as strings.
```

```exercise
id: js10-completa-vecinas
type: complete
title: The open streets around
prompt: |
  Complete `freeNeighbours(plan, x, y)`: it returns the neighbours (up, down, left, right) that exist and aren't `"#"`, as arrays `[x, y]`, in the order of `MOVES`.
visual:
  figure:
    input: { label: "freeNeighbours(plan, 1, 0)", grid: [".o#", ".#."], path: ["1,0"] }
    arrow: "right is #, down is #, up doesn't exist"
    output: { label: returns, value: "[[0, 0]]" }
starter: |
  const MOVES = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function freeNeighbours(plan, x, y) {
    const free = [];
    for (const [dx, dy] of ___) {
      const tile = plan[y + dy]?.[___];
      if (tile !== undefined && tile !== ___) {
        free.push([x + dx, y + dy]);
      }
    }
    return free;
  }

  console.log(freeNeighbours([".o#", ".#."], 1, 0));
solution: |
  const MOVES = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function freeNeighbours(plan, x, y) {
    const free = [];
    for (const [dx, dy] of MOVES) {
      const tile = plan[y + dy]?.[x + dx];
      if (tile !== undefined && tile !== "#") {
        free.push([x + dx, y + dy]);
      }
    }
    return free;
  }

  console.log(freeNeighbours([".o#", ".#."], 1, 0));
hints:
  - "The row is `y + dy` and the column is `x + dx`."
  - "`undefined` is off the map; walls have to be left out too."
tests:
  - name: on the top edge
    run: 'freeNeighbours([".o#", ".#."], 1, 0)'
    equals: [[0, 0]]
  - name: in the middle of an open plan
    run: 'freeNeighbours(["...", "...", "..."], 1, 1)'
    equals: [[2, 1], [0, 1], [1, 2], [1, 0]]
  - name: boxed in
    run: 'freeNeighbours(["#.#", "#.#"], 1, 1)'
    equals: [[1, 0]]
```

```exercise
id: js10-arregla-pila
type: fix
title: The route that came out far too long
prompt: |
  This function should give the steps of the shortest route, but on an open 3 × 3 plan, from `"0,0"` to `"2,0"`, it says 6 instead of 2. **One** word is wrong.
visual:
  figure:
    panes:
      - { label: "what it does now: 6 steps", grid: ["A.H", "...", "..."], path: ["0,0", "0,1", "0,2", "1,2", "2,2", "2,1", "2,0"] }
      - { label: "what it should do: 2 steps", grid: ["A.H", "...", "..."], path: ["0,0", "1,0", "2,0"] }
starter: |
  const MOVES = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function distance(plan, start, goal) {
    const queue = [start];
    const steps = new Map([[start, 0]]);
    while (queue.length > 0) {
      const current = queue.pop();
      if (current === goal) {
        return steps.get(current);
      }
      const [x, y] = current.split(",").map(Number);
      for (const [dx, dy] of MOVES) {
        const next = `${x + dx},${y + dy}`;
        if (plan[y + dy]?.[x + dx] === "." && !steps.has(next)) {
          steps.set(next, steps.get(current) + 1);
          queue.push(next);
        }
      }
    }
    return -1;
  }

  console.log(distance(["...", "...", "..."], "0,0", "2,0"));
solution: |
  const MOVES = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function distance(plan, start, goal) {
    const queue = [start];
    const steps = new Map([[start, 0]]);
    while (queue.length > 0) {
      const current = queue.shift();
      if (current === goal) {
        return steps.get(current);
      }
      const [x, y] = current.split(",").map(Number);
      for (const [dx, dy] of MOVES) {
        const next = `${x + dx},${y + dy}`;
        if (plan[y + dy]?.[x + dx] === "." && !steps.has(next)) {
          steps.set(next, steps.get(current) + 1);
          queue.push(next);
        }
      }
    }
    return -1;
  }

  console.log(distance(["...", "...", "..."], "0,0", "2,0"));
hints:
  - "Which end of the list does the next tile come out of? A queue serves whoever arrived first."
tests:
  - name: open plan, 2 steps
    run: 'distance(["...", "...", "..."], "0,0", "2,0")'
    equals: 2
  - name: with a wall in the middle
    run: 'distance(["....", ".##.", "...."], "0,0", "3,2")'
    equals: 5
  - name: no way through
    run: 'distance([".#.", "##."], "0,0", "2,1")'
    equals: -1
```

```exercise
id: js10-escribe-reconstruir
type: write
title: From the goal backwards
prompt: |
  Write `rebuild(parent, goal)`, which returns the route from the start to `goal` as an array of `"x,y"` keys.

  `parent` is the `Map` a search left behind: it gives each tile the tile it came from, and gives the start `null`. Begin at `goal`, follow parent after parent until you reach `null`, and turn the list round.
visual:
  figure:
    input: { label: parent, table: { head: ["tile", "came from"], rows: [["\"0,0\"", "null"], ["\"1,0\"", "\"0,0\""], ["\"1,1\"", "\"1,0\""], ["\"1,2\"", "\"1,1\""]] } }
    arrow: "from \"1,2\" backwards, then reversed"
    output: { label: "rebuild(parent, \"1,2\")", cells: ["\"0,0\"", "\"1,0\"", "\"1,1\"", "\"1,2\""] }
starter: |
  function rebuild(parent, goal) {
  }

  const parent = new Map([["0,0", null], ["1,0", "0,0"], ["1,1", "1,0"], ["1,2", "1,1"]]);
  console.log(rebuild(parent, "1,2"));
solution: |
  function rebuild(parent, goal) {
    const route = [];
    let tile = goal;
    while (tile !== null) {
      route.push(tile);
      tile = parent.get(tile);
    }
    return route.reverse();
  }

  const parent = new Map([["0,0", null], ["1,0", "0,0"], ["1,1", "1,0"], ["1,2", "1,1"]]);
  console.log(rebuild(parent, "1,2"));
hints:
  - "A `while (tile !== null)` that adds the tile and moves on to `parent.get(tile)`."
  - "The list comes out from goal to start: `reverse()` turns it round."
tests:
  - name: a 4-tile route
    run: 'rebuild(new Map([["0,0", null], ["1,0", "0,0"], ["1,1", "1,0"], ["1,2", "1,1"]]), "1,2")'
    equals: ["0,0", "1,0", "1,1", "1,2"]
  - name: the goal is the start
    run: 'rebuild(new Map([["4,4", null]]), "4,4")'
    equals: ["4,4"]
  - name: it follows only the goal's path, not other branches
    run: 'rebuild(new Map([["0,0", null], ["1,0", "0,0"], ["0,1", "0,0"], ["0,2", "0,1"]]), "0,2")'
    equals: ["0,0", "0,1", "0,2"]
```

```exercise
id: js10-escribe-onda
type: write
title: How far the ripple reaches
prompt: |
  Mark on the map every tile Chasqui can reach from where he stands, without moving: `robot.mark(list)` with a list of `[x, y]`.

  `robot.map()` gives the plan (`"#"` is a house or a barrier) and `robot.position` is `{ x, y }`. Some streets got boxed in by the procession: those aren't marked. It's tested on two plans.
visual:
  figure:
    input: { label: "the first plan", grid: ["#########", "#R..#...#", "#.#.#.#.#", "#...#...#", "#########"] }
    arrow: BFS from R
    output: { label: "8 tiles marked; the right side is closed off", grid: ["#########", "#R..#...#", "#.#.#.#.#", "#...#...#", "#########"], marks: ["1,1", "2,1", "3,1", "1,2", "3,2", "1,3", "2,3", "3,3"] }
starter: |
  const plan = robot.map();
  const { x, y } = robot.position;
  console.log("Chasqui is at", x, y);
solution: |
  const plan = robot.map();
  const { x, y } = robot.position;
  const MOVES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const queue = [[x, y]];
  const seen = new Set([`${x},${y}`]);
  while (queue.length > 0) {
    const [cx, cy] = queue.shift();
    for (const [dx, dy] of MOVES) {
      const nx = cx + dx;
      const ny = cy + dy;
      const key = `${nx},${ny}`;
      if (plan[ny]?.[nx] !== undefined && plan[ny][nx] !== "#" && !seen.has(key)) {
        seen.add(key);
        queue.push([nx, ny]);
      }
    }
  }
  robot.mark([...seen].map((k) => k.split(",").map(Number)));
hints:
  - "It's the ripple from *The minimum*, starting at `robot.position`, with `\"#\"` as the only thing you can't step on."
  - "At the end, turn each `\"x,y\"` key back into `[x, y]` and mark them all at once."
world:
  theme: barranco
  level: 4
  dir: E
  api: [move, map, path]
  map: |
    #########
    #R..#...#
    #.#.#.#.#
    #...#...#
    #########
scenarios:
  - tests:
      - name: marks the 8 reachable tiles
        state: 'w.marks.length === 8 && w.marks.includes("1,1") && !w.marks.includes("5,1")'
        msg: The 8 tiles on the left (Chasqui's included) should be marked, and none on the right.
  - map: |
      #######
      #R.#..#
      ##.#.##
      #..#..#
      #######
    tests:
      - name: marks the 5 reachable tiles
        state: 'w.marks.length === 5 && w.marks.includes("1,3") && !w.marks.includes("4,1")'
        msg: The 5 tiles on the left should be marked, and none on the right.
tests:
  - name: uses a Set
    source: 'new\s+Set\b'
```

## The case

```exercise
id: js10-caso-ambulancias
type: case
title: The ambulance that lied
prompt: |
  Work out how many blocks each ambulance really needs to reach the patient and compare it with what it said over the radio.

  A man fainted in the middle of the procession (`+` on the plan). Dispatch asked the six robot ambulances over the radio how many blocks away they were, and sent the one that said it was closest. It arrived terribly late. Closed streets (`#`) can't be crossed, and an ambulance moves one tile per block, no diagonals. All of them told the truth except one, which worked it out "as the crow flies", as if the barriers didn't exist. Which one?

  Print one line per ambulance with its name and the real blocks at the end: `Gaspar: 25`. A hint: a single search **from the patient** gives you the distance to all of them.
visual:
  - figure:
      title: The plan of the centre (+ the patient; letters, the ambulances)
      panes:
        - grid: ["G.............T", ".#.#.###.#.#.#.", "...#R..........", ".#.#.#.#.###.#.", "##.#######.####", ".#...#.....#..W", ".#.#.#.+.#.#.#.", "F#.#.#####.#.#.", ".#.............", ".#.###.#.#.#.#.", "............C.."]
          path: ["7,6"]
  - board:
      for: js10-caso-ambulancias
      title: What each ambulance said
      task: Work out each one's real blocks and compare them with what it said.
      cards:
        - { name: Gaspar, kind: robot, role: "Said 25 blocks", clue: { find: "Gaspar", says: 25, saysLabel: "Said" } }
        - { name: Tomasa, kind: robot, role: "Said 35 blocks", clue: { find: "Tomasa", says: 35, saysLabel: "Said" } }
        - { name: Ruperto, kind: robot, role: "Said 27 blocks", clue: { find: "Ruperto", says: 27, saysLabel: "Said" } }
        - { name: Clotilde, kind: robot, role: "Said 11 blocks", clue: { find: "Clotilde", says: 11, saysLabel: "Said" } }
        - { name: Fermín, kind: robot, role: "Said 22 blocks", clue: { find: "Fermín", says: 22, saysLabel: "Said" } }
        - { name: Wilmer, kind: robot, role: "Said 8 blocks", culprit: true, clue: { find: "Wilmer", says: 8, saysLabel: "Said" } }
      caption: "**Matches**: it told the truth. If it doesn't, dispatch sent the wrong one."
starter: |
  const plan = [
    "...............",
    ".#.#.###.#.#.#.",
    "...#...........",
    ".#.#.#.#.###.#.",
    "##.#######.####",
    ".#...#.....#...",
    ".#.#.#.+.#.#.#.",
    ".#.#.#####.#.#.",
    ".#.............",
    ".#.###.#.#.#.#.",
    "...............",
  ];

  const ambulances = [
    { name: "Gaspar", x: 0, y: 0, said: 25 },
    { name: "Tomasa", x: 14, y: 0, said: 35 },
    { name: "Ruperto", x: 4, y: 2, said: 27 },
    { name: "Clotilde", x: 12, y: 10, said: 11 },
    { name: "Fermín", x: 0, y: 7, said: 22 },
    { name: "Wilmer", x: 14, y: 5, said: 8 },
  ];

  // The patient is on the "+" tile:
  const row = plan.findIndex((r) => r.includes("+"));
  console.log("Patient at", plan[row].indexOf("+"), row);

  // TODO: run a search (BFS) from the patient that stores in a Map
  // the steps to every tile. Print one line per ambulance: Gaspar: 25
solution: |
  const plan = [
    "...............",
    ".#.#.###.#.#.#.",
    "...#...........",
    ".#.#.#.#.###.#.",
    "##.#######.####",
    ".#...#.....#...",
    ".#.#.#.+.#.#.#.",
    ".#.#.#####.#.#.",
    ".#.............",
    ".#.###.#.#.#.#.",
    "...............",
  ];

  const ambulances = [
    { name: "Gaspar", x: 0, y: 0, said: 25 },
    { name: "Tomasa", x: 14, y: 0, said: 35 },
    { name: "Ruperto", x: 4, y: 2, said: 27 },
    { name: "Clotilde", x: 12, y: 10, said: 11 },
    { name: "Fermín", x: 0, y: 7, said: 22 },
    { name: "Wilmer", x: 14, y: 5, said: 8 },
  ];

  const row = plan.findIndex((r) => r.includes("+"));
  const start = [plan[row].indexOf("+"), row];

  const steps = new Map([[start.join(","), 0]]);
  const queue = [start];
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const key = `${x + dx},${y + dy}`;
      const tile = plan[y + dy]?.[x + dx];
      if (tile !== undefined && tile !== "#" && !steps.has(key)) {
        steps.set(key, steps.get(`${x},${y}`) + 1);
        queue.push([x + dx, y + dy]);
      }
    }
  }

  for (const { name, x, y, said } of ambulances) {
    const real = steps.get(`${x},${y}`);
    console.log(`${name}: said ${said}, ${real === said ? "truth" : "LIED"}, real ${real}`);
  }
answer: Wilmer
answerLabel: Which ambulance lied?
reveal: |
  Wilmer said 8 blocks: that's the as-the-crow-flies distance from the right-hand corner, but with the procession's barriers it needs 14. That's why dispatch sent it and not Clotilde, who really was 11 away.
hints:
  - "Start the search at the `+` and store the steps in a `Map`: a neighbour has one more than the tile it came from."
  - "When the queue runs dry, `steps.get(\"14,5\")` is already Wilmer's real distance, and so on for all of them."
```

## The judge

```exercise
id: js10-juez-pasos
type: judge
mode: function
function: fewestSteps
title: The shortest route to the hospital
prompt: |
  Write `fewestSteps(plan)`, which returns how many steps the shortest route from `A` to `H` takes, or `-1` if there isn't one.

  The emergency dispatch gets plans of the centre with the ambulance (`A`), the hospital (`H`), open streets (`.`) and closed streets (`#`). A step is moving to a neighbouring tile: up, down, left or right.

  **Input:** `plan`, an array of strings of the same length, with exactly one `A` and one `H`.

  **Output:** the minimum number of steps, or `-1`.

  **Constraints:** 1 to 60 rows · 1 to 60 columns.
visual:
  figure:
    title: Sample 1
    input: { label: plan, grid: ["A.#.", ".##.", "...H"] }
    arrow: BFS from A
    output: { label: "returns 5", grid: ["A.#.", ".##.", "...H"], path: ["0,0", "0,1", "0,2", "1,2", "2,2", "3,2"] }
    steps:
      - "The wall forces the route down the left side: 2 steps down and 3 to the right."
starter: |
  function fewestSteps(plan) {
    return 0;
  }
solution: |
  function fewestSteps(plan) {
    let start;
    for (let y = 0; y < plan.length; y++) {
      const x = plan[y].indexOf("A");
      if (x !== -1) {
        start = [x, y];
      }
    }
    const steps = new Map([[start.join(","), 0]]);
    const queue = [start];
    for (let i = 0; i < queue.length; i++) {
      const [x, y] = queue[i];
      if (plan[y][x] === "H") {
        return steps.get(`${x},${y}`);
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const key = `${x + dx},${y + dy}`;
        const tile = plan[y + dy]?.[x + dx];
        if (tile !== undefined && tile !== "#" && !steps.has(key)) {
          steps.set(key, steps.get(`${x},${y}`) + 1);
          queue.push([x + dx, y + dy]);
        }
      }
    }
    return -1;
  }
hints:
  - "First find the `A` by walking the rows with `indexOf`."
  - "Keep the steps in a `Map`; when the `H` comes out of the queue, you have the answer. If the queue runs dry without seeing it, it's `-1`."
samples:
  - args: [["A.#.", ".##.", "...H"]]
    returns: 5
  - args: [["A#H"]]
    returns: -1
    note: The only street is closed.
  - args: [["AH"]]
    returns: 1
edge:
  - args: [["H..", "...", "..A"]]
    tag: when the A is at the bottom right
  - args: [["A.#..", "..#..", "###..", "....H"]]
    tag: when the A is boxed in
  - args: [["A", ".", ".", "#", "H"]]
    tag: with a single column that's cut off
  - args: [["A....", "####.", "H....", ".####", "....."]]
    tag: with a zigzag path
  - args: [["A...#....", ".##...##.", ".#..#..#.", "...##.#H.", ".#....#.."]]
    tag: when the shortest route isn't direct
random:
  count: 40
  seed: 1010
  generate: |
    const height = rng.int(1, 60), width = rng.int(2, 60);
    let rows;
    if (rng.next() < 0.3 && height >= 3) {
      rows = Array.from({ length: height }, (_, y) => {
        if (y % 2 === 0) return ".".repeat(width);
        const gap = (y % 4 === 1) ? width - 1 : 0;
        return Array.from({ length: width }, (_, x) => (x === gap ? "." : "#")).join("");
      });
    } else {
      const p = rng.int(0, 40) / 100;
      rows = Array.from({ length: height }, () => Array.from({ length: width }, () => (rng.next() < p ? "#" : ".")).join(""));
    }
    const cells = rows.map((r) => [...r]);
    const free = () => {
      for (;;) {
        const x = rng.int(0, width - 1), y = rng.int(0, height - 1);
        if (cells[y][x] === ".") return [x, y];
        cells[y][x] = ".";
      }
    };
    const [ax, ay] = free();
    cells[ay][ax] = "A";
    const [hx, hy] = free();
    cells[hy][hx] = "H";
    return [cells.map((r) => r.join(""))];
wrong:
  - |
    function fewestSteps(plan) {
      let start;
      plan.forEach((r, y) => { if (r.includes("A")) start = [r.indexOf("A"), y]; });
      const steps = new Map([[start.join(","), 0]]);
      const stack = [start];
      while (stack.length) {
        const [x, y] = stack.pop();
        if (plan[y][x] === "H") return steps.get(`${x},${y}`);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const k = `${x + dx},${y + dy}`, c = plan[y + dy]?.[x + dx];
          if (c !== undefined && c !== "#" && !steps.has(k)) { steps.set(k, steps.get(`${x},${y}`) + 1); stack.push([x + dx, y + dy]); }
        }
      }
      return -1;
    }
  - |
    function fewestSteps(plan) {
      let start;
      plan.forEach((r, y) => { if (r.includes("A")) start = [r.indexOf("A"), y]; });
      const steps = new Map([[start.join(","), 1]]);
      const queue = [start];
      for (let i = 0; i < queue.length; i++) {
        const [x, y] = queue[i];
        if (plan[y][x] === "H") return steps.get(`${x},${y}`);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const k = `${x + dx},${y + dy}`, c = plan[y + dy]?.[x + dx];
          if (c !== undefined && c !== "#" && !steps.has(k)) { steps.set(k, steps.get(`${x},${y}`) + 1); queue.push([x + dx, y + dy]); }
        }
      }
      return -1;
    }
  - |
    function fewestSteps(plan) {
      let start;
      plan.forEach((r, y) => { if (r.includes("A")) start = [r.indexOf("A"), y]; });
      const steps = new Map([[start.join(","), 0]]);
      const queue = [start];
      for (let i = 0; i < queue.length; i++) {
        const [x, y] = queue[i];
        if (plan[y][x] === "H") return steps.get(`${x},${y}`);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const k = `${x + dx},${y + dy}`, c = plan[y + dy]?.[x + dx];
          if (c !== undefined && c !== "#" && !steps.has(k)) { steps.set(k, steps.get(`${x},${y}`) + 1); queue.push([x + dx, y + dy]); }
        }
      }
      return -1;
    }
  - |
    function fewestSteps(plan) {
      let start;
      plan.forEach((r, y) => { if (r.includes("A")) start = [r.indexOf("A"), y]; });
      const steps = new Map([[start.join(","), 0]]);
      const queue = [start];
      for (let i = 0; i < queue.length; i++) {
        const [x, y] = queue[i];
        if (plan[y][x] === "H") return steps.get(`${x},${y}`);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const k = `${x + dx},${y + dy}`, c = plan[y + dy]?.[x + dx];
          if (c !== undefined && c !== "#" && !steps.has(k)) { steps.set(k, steps.get(`${x},${y}`) + 1); queue.push([x + dx, y + dy]); }
        }
      }
      return 0;
    }
```

## Final mission

```exercise
id: js10-mision-insulina
type: mission
title: The insulin arrives in time
prompt: |
  Find the shortest route to the emergency entrance (D), have Chasqui walk it with `robot.followPath(route)` and deliver `"insulin"` on arrival.

  The battery lasts **exactly** for the shortest route: one step too many and Chasqui is stranded in the street. You have:

  - `robot.map()`: the plan; `"#"` is a house or a closed street, `"D"` is the emergency entrance;
  - `robot.position`: where Chasqui is, `{ x, y }`;
  - `robot.followPath(route)`: walks a list of neighbouring tiles `[x, y]`, turning on its own (the first may be the current tile);
  - `robot.mark(tiles)`, if you want to see on the map what your search explored.

  The plan changes in every test.
visual:
  figure:
    title: The first test
    input: { label: "plan (battery: 18)", grid: ["#############", "#R....#.....#", "#.###.#.###.#", "#.#.....#...#", "#.#.###.#.#.#", "#...#...#.#D#", "###.#.###.#.#", "#.....#.....#", "#############"] }
    arrow: BFS, parents, route reversed
    output: { label: "an 18-step route", grid: ["#############", "#R....#.....#", "#.###.#.###.#", "#.#.....#...#", "#.#.###.#.#.#", "#...#...#.#D#", "###.#.###.#.#", "#.....#.....#", "#############"], path: ["1,1", "2,1", "3,1", "4,1", "5,1", "5,2", "5,3", "6,3", "7,3", "7,2", "7,1", "8,1", "9,1", "10,1", "11,1", "11,2", "11,3", "11,4", "11,5"] }
starter: |
  const plan = robot.map();
  const { x, y } = robot.position;
  console.log("Leaving from", x, y, "with battery", robot.battery);
  // TODO: BFS from (x, y) to the "D" tile, storing where each tile came from.
  // Then rebuild the route, follow it and deliver the insulin.
solution: |
  const plan = robot.map();
  const { x, y } = robot.position;
  const MOVES = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  const start = `${x},${y}`;
  const parent = new Map([[start, null]]);
  const queue = [start];
  let goal = null;
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];
    const [cx, cy] = current.split(",").map(Number);
    if (plan[cy][cx] === "D") {
      goal = current;
      break;
    }
    for (const [dx, dy] of MOVES) {
      const next = `${cx + dx},${cy + dy}`;
      const tile = plan[cy + dy]?.[cx + dx];
      if (tile !== undefined && tile !== "#" && !parent.has(next)) {
        parent.set(next, current);
        queue.push(next);
      }
    }
  }
  robot.mark([...parent.keys()].map((k) => k.split(",").map(Number)));

  const route = [];
  for (let t = goal; t !== null; t = parent.get(t)) {
    route.push(t.split(",").map(Number));
  }
  robot.followPath(route.reverse());
  robot.deliver("insulin");
hints:
  - "It's `shortestRoute` from *The minimum*, looking for the `\"D\"` tile instead of a fixed goal."
  - "`followPath` wants `[x, y]` arrays: convert each key with `key.split(\",\").map(Number)`."
world:
  theme: barranco
  level: 4
  dir: E
  api: [move, deliver, map, path]
  battery: 18
  map: |
    #############
    #R....#.....#
    #.###.#.###.#
    #.#.....#...#
    #.#.###.#.#.#
    #...#...#.#D#
    ###.#.###.#.#
    #.....#.....#
    #############
scenarios:
  - {}
  - map: |
      ###########
      #R........#
      #.#######.#
      #.#.....#.#
      #.#.###.#.#
      #...#D..#.#
      #####.###.#
      #.........#
      ###########
    world: { battery: 16 }
  - map: |
      #########
      #...#..D#
      #.#.#.#.#
      #R#...#.#
      #.#####.#
      #.......#
      #########
    world: { dir: N, battery: 12 }
tests:
  - name: reaches the emergency entrance
    state: w.atGoal
    msg: Chasqui didn't reach the D. If the battery ran out, the route wasn't the shortest.
  - name: delivers the insulin
    state: 'w.delivered.length === 1 && w.delivered[0] === "insulin"'
  - name: no crashes
    state: '!w.crashed'
  - name: searches with a Map or a Set
    source: 'new\s+(Map|Set)\b'
    msg: Keep what you've explored in a Map (or a Set) so no tile is repeated.
```

## Expert challenge

```exercise
id: js10-reto-farmacia
type: challenge
title: Via the pharmacy
prompt: |
  This time the ambulance has to pick up the medicine at the pharmacy (`F`) before going to the hospital (`H`). Write `viaPharmacy(plan)`, which returns the steps of the shortest route `A → F → H`, or `-1` if either leg is impossible. It may pass through any tile more than once.
starter: |
  function viaPharmacy(plan) {
    return -1;
  }

  console.log(viaPharmacy(["A.F", "...", "H.."]));
solution: |
  function locate(plan, letter) {
    for (let y = 0; y < plan.length; y++) {
      const x = plan[y].indexOf(letter);
      if (x !== -1) return [x, y];
    }
  }

  function distance(plan, from, to) {
    const steps = new Map([[from.join(","), 0]]);
    const queue = [from];
    for (let i = 0; i < queue.length; i++) {
      const [x, y] = queue[i];
      if (x === to[0] && y === to[1]) return steps.get(`${x},${y}`);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const key = `${x + dx},${y + dy}`;
        const tile = plan[y + dy]?.[x + dx];
        if (tile !== undefined && tile !== "#" && !steps.has(key)) {
          steps.set(key, steps.get(`${x},${y}`) + 1);
          queue.push([x + dx, y + dy]);
        }
      }
    }
    return -1;
  }

  function viaPharmacy(plan) {
    const [a, f, h] = ["A", "F", "H"].map((letter) => locate(plan, letter));
    const there = distance(plan, a, f);
    const onward = distance(plan, f, h);
    return there === -1 || onward === -1 ? -1 : there + onward;
  }

  console.log(viaPharmacy(["A.F", "...", "H.."]));
hints:
  - Those are two independent searches. Write `distance(plan, from, to)` once and use it twice.
tests:
  - name: there and on in an open plan
    run: 'viaPharmacy(["A.F", "...", "H.."])'
    equals: 6
  - name: the pharmacy is on the way
    run: 'viaPharmacy(["A.F.H"])'
    equals: 4
  - name: pharmacy boxed in
    run: 'viaPharmacy(["A.#F", "..##", "H..."])'
    equals: -1
  - name: with a detour
    run: 'viaPharmacy(["A#F", ".#.", "..H"])'
    equals: 8
```
