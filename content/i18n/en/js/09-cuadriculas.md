# Session 9 — Grids

## The job

Ate, the industrial district, Monday at seven in the morning. Señora Gladys Huamán, owner of Distribuidora Útiles Huamán, had a pipe burst over the weekend. Her warehouse is full of boxes of exercise books for the back-to-school season, and paper plus water is papier-mâché. The insurance assessor arrives at six in the evening and wants a plan: where there's water, how much, and which boxes are at risk.

We gave Chasqui a floor sensor that measures the centimetres of water on every tile of the warehouse. What it returns isn't a list: it's a **grid**, rows of tiles, like a chessboard full of numbers. Today Chasqui learns to walk through it, to look at neighbouring tiles and not to fall off the edge.

```scene
theme: museo
level: 4
dir: E
items: { a: box }
caption: Señora Gladys's warehouse. Chasqui walks the aisles between the shelves; every box (a) is a school season that can't get wet.
map: |
  ##########
  #R..a....#
  #.##.##a.#
  #a..a....#
  #..a..#a.#
  ##########
program: |
  robot.forward(3);
  robot.turnRight();
  robot.forward(2);
  robot.turnLeft();
  robot.forward(4);
  robot.say("water here");
```

## The minimum

A grid is an **array of arrays**: each element is a row, and each row is an array of tiles. You read it with two indexes: first the row (`y`), then the column (`x`).

```js run
const water = [
  [0, 2, 5],
  [0, 0, 8],
];
console.log(water[1][2]);
console.log(water.length, water[0].length);
console.log(water[0].join(" "));
```

To walk the whole grid you need **two loops, one inside the other**: the outer one goes down row by row and the inner one walks every tile of that row. Watch Chasqui gather the wet tiles:

```anim
title: Two loops walk the grid, row by row
code: |
  const water = [[0, 3, 0], [2, 0, 4]];
  const wet = [];
  for (let y = 0; y < water.length; y++) {
    for (let x = 0; x < water[y].length; x++) {
      if (water[y][x] > 0) {
        wet.push(`${x},${y}`);
      }
    }
  }
  console.log(wet.length);
grid: { map: [".3.", "2.4"], visited: wet }
show: [y, x, wet]
notes:
  3: "The outer loop picks row y."
  4: "The inner one walks the columns x of that row. For every y, x goes all the way round."
  5: "water[y][x]: the row first, then the column."
  6: "A wet tile is noted with its key \"x,y\" and painted on the plan."
```

Often what matters isn't one tile on its own but its **neighbours**. The four neighbours of `(x, y)` are one step away: right, left, down and up. A list of offsets saves you writing four nearly identical `if`s:

```js
const STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
for (const [dx, dy] of STEPS) {
  const nx = x + dx;
  const ny = y + dy;
  if (ny >= 0 && ny < water.length && nx >= 0 && nx < water[ny].length) {
    // (nx, ny) is a neighbour that exists
  }
}
```

```figure
title: A tile's neighbours, in the middle and in the corner
panes:
  - { label: "(2, 1) has 4 neighbours", grid: [".....", "..o..", "....."], marks: ["2,0", "1,1", "3,1", "2,2"] }
  - { label: "(0, 0) has only 2: the others fall outside", grid: ["o....", ".....", "....."], marks: ["1,0", "0,1"] }
caption: "At the edge, some neighbours don't exist. That's why you check that `nx` and `ny` are inside before reading."
```

- **Create**: with the literal, as above, or empty with `Array.from({ length: height }, () => Array(width).fill(0))`.
- **Size**: `water.length` is the height (how many rows) and `water[0].length` the width (how many columns).
- **Strings are rows too**: a plan like `["#..", ".#."]` reads the same way, `plan[y][x]`, because a string is indexed like an array.
- **Diagonals** come in by adding `[1, 1]`, `[1, -1]`, `[-1, 1]` and `[-1, -1]` to the list of steps: eight neighbours.
- **Off the edge**: `water[0][9]` is `undefined`, but `water[-1][0]` **crashes the program**, because `water[-1]` is already `undefined` and has no position `0`. Check the bounds first, or read with `water[ny]?.[nx]`, which gives `undefined` without crashing.

> **Common trap:** writing `water[x][y]`. The row comes first: `water[y][x]`. On a square grid the mistake goes unnoticed until you read the wrong tile; on a rectangular one, you get `undefined`.

<!-- legacy: grid-copy -->

<!-- mdn: arrays for grid-copy -->

## Practice

```exercise
id: js9-predice-fila
type: predict
title: Row first
prompt: |
  What does it print?
code: |
  const water = [
    [4, 0, 7],
    [1, 9, 2],
  ];
  console.log(water[1][0]);
  console.log(water[0].length);
  console.log(water[1].join("-"));
options:
  - "1\n3\n1-9-2"
  - "0\n3\n1-9-2"
  - "1\n2\n1-9-2"
  - "4\n3\n4-0-7"
answer: "1\n3\n1-9-2"
explain: |
  `water[1]` is the second row, `[1, 9, 2]`, and its position `0` is the 1. `water[0].length` is the width of a row: 3 columns.
```

```exercise
id: js9-predice-copia
type: predict
title: The copy that wasn't a copy
prompt: |
  Chasqui copies the plan to draw on it without spoiling the original. What does it print?
code: |
  const plan = [[0, 0], [0, 0]];
  const copy = [...plan];
  copy[0][0] = 9;
  console.log(plan[0][0]);
options:
  - "0"
  - "9"
  - "undefined"
  - An error
answer: "9"
explain: |
  `[...plan]` makes a new array, but its elements are **the same rows**. Changing `copy[0][0]` changes the row they share. To really copy: `plan.map((row) => [...row])` or `structuredClone(plan)`.
```

```exercise
id: js9-completa-total
type: complete
title: How much water there is
prompt: |
  Add up the centimetres of water on every tile and count how many are wet (more than 0).
visual:
  figure:
    input:
      label: water
      grid: ["0301", "2004", "0050"]
      marks: ["1,0", "3,0", "0,1", "3,1", "2,2"]
    arrow: two loops
    output: { label: prints, text: "15\n5" }
starter: |
  const water = [
    [0, 3, 0, 1],
    [2, 0, 0, 4],
    [0, 0, 5, 0],
  ];
  let total = 0;
  let wet = 0;
  for (let y = 0; y < water.length; y++) {
    for (let x = 0; x < ___; x++) {
      total += ___;
      if (water[y][x] > 0) {
        wet++;
      }
    }
  }
  console.log(total);
  console.log(wet);
solution: |
  const water = [
    [0, 3, 0, 1],
    [2, 0, 0, 4],
    [0, 0, 5, 0],
  ];
  let total = 0;
  let wet = 0;
  for (let y = 0; y < water.length; y++) {
    for (let x = 0; x < water[y].length; x++) {
      total += water[y][x];
      if (water[y][x] > 0) {
        wet++;
      }
    }
  }
  console.log(total);
  console.log(wet);
hints:
  - The inner loop walks the columns of row `y`. How many does that row have?
  - The tile is read with the row first.
tests:
  - name: 15 cm in total and 5 wet tiles
    output: "15\n5"
```

```exercise
id: js9-arregla-columnas
type: fix
title: The missing columns
prompt: |
  The warehouse has 2 rows and 4 columns. This code should print the water in each row (`row 0: 6` and `row 1: 10`), but it prints something else. There are **two** bugs.
starter: |
  const water = [
    [1, 0, 2, 3],
    [4, 4, 0, 2],
  ];
  for (let y = 0; y < water.length; y++) {
    let sum = 0;
    for (let x = 0; x < water.length; x++) {
      sum += water[x][y];
    }
    console.log(`row ${y}: ${sum}`);
  }
solution: |
  const water = [
    [1, 0, 2, 3],
    [4, 4, 0, 2],
  ];
  for (let y = 0; y < water.length; y++) {
    let sum = 0;
    for (let x = 0; x < water[y].length; x++) {
      sum += water[y][x];
    }
    console.log(`row ${y}: ${sum}`);
  }
hints:
  - "`water.length` is how many rows there are. How many columns does a row have?"
  - Which index comes first, the row or the column?
tests:
  - name: the water in each row
    output: "row 0: 6\nrow 1: 10"
```

```exercise
id: js9-escribe-vecinos
type: write
title: The wet neighbours
prompt: |
  Write `wetNeighbours(water, x, y)`, which returns how many of the **4 neighbours** of tile `(x, y)` have water (more than 0). The tile itself doesn't count, and at the edge, don't step outside the grid.
visual:
  figure:
    input:
      label: "wetNeighbours(water, 1, 1)"
      grid: ["050", "270", "301"]
      path: ["1,1"]
      marks: ["1,0", "0,1", "2,1", "1,2"]
    arrow: up 5, left 2, right 0, down 0
    output: { label: returns, value: "2" }
starter: |
  function wetNeighbours(water, x, y) {
  }

  const water = [
    [0, 5, 0],
    [2, 7, 0],
    [3, 0, 1],
  ];
  console.log(wetNeighbours(water, 1, 1));
solution: |
  const STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function wetNeighbours(water, x, y) {
    let count = 0;
    for (const [dx, dy] of STEPS) {
      if ((water[y + dy]?.[x + dx] ?? 0) > 0) {
        count++;
      }
    }
    return count;
  }

  const water = [
    [0, 5, 0],
    [2, 7, 0],
    [3, 0, 1],
  ];
  console.log(wetNeighbours(water, 1, 1));
hints:
  - "A `STEPS` list with the four offsets and a `for...of` that walks it."
  - "`water[ny]?.[nx]` gives `undefined` off the edge, and `undefined > 0` is `false`."
tests:
  - name: in the middle
    run: 'wetNeighbours([[0, 5, 0], [2, 7, 0], [3, 0, 1]], 1, 1)'
    equals: 2
  - name: in the top-left corner
    run: 'wetNeighbours([[0, 5, 0], [2, 7, 0], [3, 0, 1]], 0, 0)'
    equals: 2
  - name: in the bottom-right corner
    run: 'wetNeighbours([[0, 5, 0], [2, 7, 0], [3, 0, 1]], 2, 2)'
    equals: 0
  - name: in a single row
    run: 'wetNeighbours([[4, 0, 6]], 1, 0)'
    equals: 2
  - name: the tile itself doesn't count
    run: 'wetNeighbours([[0, 0], [0, 9]], 1, 1)'
    equals: 0
```

```exercise
id: js9-escribe-mapa
type: write
title: How many boxes there are
prompt: |
  Count the warehouse's boxes by reading the map, and have Chasqui say the number with `robot.say(n)`.

  `robot.map()` returns the warehouse as a grid of tiles: `"#"` is a shelf or wall, `"."` is free floor and `"a"` is a box. You read it as always, `map[y][x]`. It's tested in two warehouses.
starter: |
  const plan = robot.map();
  console.log(plan.length, "rows");
solution: |
  const plan = robot.map();
  let boxes = 0;
  for (const row of plan) {
    for (const tile of row) {
      if (tile === "a") {
        boxes++;
      }
    }
  }
  robot.say(boxes);
hints:
  - "You don't need the indexes here: `for (const row of plan)` and, inside, `for (const tile of row)`."
world:
  theme: museo
  level: 4
  dir: E
  api: [move, map]
  items: { a: box }
  map: |
    ##########
    #R..a....#
    #.##.##a.#
    #a..a....#
    #..a..#a.#
    ##########
scenarios:
  - tests:
      - name: says 6
        state: 'w.said.at(-1) === "6"'
        msg: There are 6 boxes in this warehouse.
  - map: |
      #######
      #Ra.a.#
      #.#.#a#
      #######
    tests:
      - name: says 3
        state: 'w.said.at(-1) === "3"'
        msg: There are 3 boxes in this warehouse.
tests:
  - name: uses two loops, one inside the other
    source: '\bfor\b[^{]*\{[\s\S]*\bfor\b'
    msg: Walk the rows and, inside, the tiles of each row.
```

## The case

```exercise
id: js9-caso-tuberia
type: case
title: The pipe that burst
prompt: |
  For each pipe, add up the water on its tile and its 8 neighbours, and find the pipe with the highest sum.

  Five pipes, `A` to `E`, run under the warehouse. Water comes out of the one that burst and spreads around it, so that pipe has more water in its zone (its tile and the 8 around it) than any other. Don't trust a single number: where the floor sags, a puddle collects even if there's no leak there.

  Mind the edges: a pipe on the border has fewer neighbours. Print one line per pipe, like `Pipe A: 17`.
visual:
  figure:
    title: The sensor's plan, in cm of water; the pipes are highlighted
    panes:
      - { label: "water[y][x]: 8 rows (y) × 12 columns (x)", grid: ["930200454000", "231000585001", "023220443002", "036301212177", "022300000077", "110454000087", "001565020120", "220453000100"], path: ["0,0", "4,6", "11,4", "7,1", "2,3"], labels: { "0,0": A, "4,6": B, "11,4": C, "7,1": D, "2,3": E } }
      - { label: pipes, table: { head: ["pipe", "x", "y"], rows: [["A", "0", "0"], ["B", "4", "6"], ["C", "11", "4"], ["D", "7", "1"], ["E", "2", "3"]] } }
    caption: "Example: **A**'s zone, in the top-left corner, has only 4 tiles: 9 + 3 + 2 + 3 = **17**."
starter: |
  const water = [
    [9, 3, 0, 2, 0, 0, 4, 5, 4, 0, 0, 0],
    [2, 3, 1, 0, 0, 0, 5, 8, 5, 0, 0, 1],
    [0, 2, 3, 2, 2, 0, 4, 4, 3, 0, 0, 2],
    [0, 3, 6, 3, 0, 1, 2, 1, 2, 1, 7, 7],
    [0, 2, 2, 3, 0, 0, 0, 0, 0, 0, 7, 7],
    [1, 1, 0, 4, 5, 4, 0, 0, 0, 0, 8, 7],
    [0, 0, 1, 5, 6, 5, 0, 2, 0, 1, 2, 0],
    [2, 2, 0, 4, 5, 3, 0, 0, 0, 1, 0, 0],
  ];

  const pipes = [
    { name: "A", x: 0, y: 0 },
    { name: "B", x: 4, y: 6 },
    { name: "C", x: 11, y: 4 },
    { name: "D", x: 7, y: 1 },
    { name: "E", x: 2, y: 3 },
  ];

  // This is how you read a pipe's tile (row first):
  const { name, x, y } = pipes[0];
  console.log(`Pipe ${name}, on its own tile: ${water[y][x]}`);

  // TODO: for each pipe, add its tile and its 8 neighbours (the ones that exist)
  // and print: Pipe A: 17
solution: |
  const water = [
    [9, 3, 0, 2, 0, 0, 4, 5, 4, 0, 0, 0],
    [2, 3, 1, 0, 0, 0, 5, 8, 5, 0, 0, 1],
    [0, 2, 3, 2, 2, 0, 4, 4, 3, 0, 0, 2],
    [0, 3, 6, 3, 0, 1, 2, 1, 2, 1, 7, 7],
    [0, 2, 2, 3, 0, 0, 0, 0, 0, 0, 7, 7],
    [1, 1, 0, 4, 5, 4, 0, 0, 0, 0, 8, 7],
    [0, 0, 1, 5, 6, 5, 0, 2, 0, 1, 2, 0],
    [2, 2, 0, 4, 5, 3, 0, 0, 0, 1, 0, 0],
  ];

  const pipes = [
    { name: "A", x: 0, y: 0 },
    { name: "B", x: 4, y: 6 },
    { name: "C", x: 11, y: 4 },
    { name: "D", x: 7, y: 1 },
    { name: "E", x: 2, y: 3 },
  ];

  function waterInZone(x, y) {
    let sum = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        sum += water[y + dy]?.[x + dx] ?? 0;
      }
    }
    return sum;
  }

  let worst = pipes[0];
  for (const pipe of pipes) {
    const zone = waterInZone(pipe.x, pipe.y);
    console.log(`Pipe ${pipe.name}: ${zone}`);
    if (zone > waterInZone(worst.x, worst.y)) {
      worst = pipe;
    }
  }
  console.log(`Burst: ${worst.name}`);
answer: C
answerLabel: Which pipe burst? (just the letter)
reveal: |
  C, on the right edge: 43 cm in its zone, even though its own tile only has 7. D (42) and B (41) are very close. A has the highest tile on the whole plan (9), but it's a puddle in a sagging corner: its zone adds up to 17.
hints:
  - "Two loops from -1 to 1 (`dy` and `dx`) walk the tile and its 8 neighbours."
  - "`water[y + dy]?.[x + dx] ?? 0` is 0 off the edge, so the corner doesn't crash."
```

## The judge

```exercise
id: js9-juez-alerta
type: judge
mode: function
function: floodAlert
title: The alert board
prompt: |
  Write `floodAlert(plan)`, which returns the plan with a number on every dry tile: how many of its 8 neighbours have water.

  The assessor wants a board that warns how close to the water each dry tile is. In the plan, `"~"` is a tile with water and `"."` a dry one. In the result, tiles with water stay `"~"` and every dry tile becomes the number of neighbours with water (diagonals included), from `"0"` to `"8"`.

  **Input:** `plan`, an array of strings of the same length; each string is a row.

  **Output:** an array of strings of the same size.

  **Constraints:** 1 to 40 rows · 1 to 40 columns.
visual:
  figure:
    title: Sample 1
    input: { label: plan, grid: ["~..", "...", "..~"], marks: ["0,0", "2,2"] }
    arrow: count the 8 neighbours with water
    output: { label: returns, grid: ["~10", "121", "01~"], marks: ["0,0", "2,2"], path: ["1,1"] }
    steps:
      - "The middle tile, `(1, 1)`, has water on two diagonals: it's 2."
      - "Tile `(2, 0)` touches no `~`: it's 0."
starter: |
  function floodAlert(plan) {
    return plan;
  }
solution: |
  function floodAlert(plan) {
    const result = [];
    for (let y = 0; y < plan.length; y++) {
      let row = "";
      for (let x = 0; x < plan[y].length; x++) {
        if (plan[y][x] === "~") {
          row += "~";
          continue;
        }
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (plan[y + dy]?.[x + dx] === "~") {
              count++;
            }
          }
        }
        row += count;
      }
      result.push(row);
    }
    return result;
  }
hints:
  - "Build each row of the result as a string you keep extending, and `push` it at the end of the row."
  - "The 8 neighbours are the `dx` and `dy` from -1 to 1; the tile itself is dry, so it adds nothing."
samples:
  - args: [["~..", "...", "..~"]]
    returns: ["~10", "121", "01~"]
  - args: [["~~.~", ".~..", "...."]]
    returns: ["~~3~", "3~31", "1110"]
    note: Rows of 4 columns and 3 rows; it isn't square.
edge:
  - args: [["~"]]
    tag: with a single tile with water
  - args: [["."]]
    tag: with a single dry tile
  - args: [[".~..~."]]
    tag: with a single row
  - args: [["~", ".", ".", "~"]]
    tag: with a single column
  - args: [["~~~", "~.~", "~~~"]]
    tag: with a tile surrounded by water
  - args: [["....", "....", "...."]]
    tag: with no water at all
random:
  count: 30
  seed: 99
  generate: |
    const height = rng.int(1, 40), width = rng.int(1, 40);
    const p = rng.int(5, 50) / 100;
    return [Array.from({ length: height }, () => Array.from({ length: width }, () => (rng.next() < p ? "~" : ".")).join(""))];
wrong:
  - |
    function floodAlert(plan) {
      return plan.map((row, y) => [...row].map((c, x) => {
        if (c === "~") return "~";
        let n = 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (plan[y + dy]?.[x + dx] === "~") n++;
        return n;
      }).join(""));
    }
  - |
    function floodAlert(plan) {
      return plan.map((row, y) => [...row].map((c, x) => {
        if (c === "~") return "~";
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (plan[y + dy][x + dx] === "~") n++;
        return n;
      }).join(""));
    }
  - |
    function floodAlert(plan) {
      return plan.map((row, y) => [...row].map((c, x) => {
        if (c === "~") return "~";
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (plan[x + dx]?.[y + dy] === "~") n++;
        return n;
      }).join(""));
    }
```

## Final mission

```exercise
id: js9-mision-cajas
type: mission
title: The boxes at risk
prompt: |
  Mark every box at risk on the map with `robot.mark([x, y])` and have Chasqui say how many there are: `robot.say(n)`.

  A box is **at risk** if its tile has water or any of its **4 neighbours** does (diagonals don't count: water doesn't get between two shelves). You have two grids of the same size:

  - `robot.map()`: where the boxes (`"a"`), the shelves (`"#"`) and the floor (`"."`) are;
  - `water`: the centimetres the sensor measured on each tile, `water[y][x]`.

  The warehouse and the water change in every test; in one of them, no box is at risk.
visual:
  figure:
    title: The first test, drawn
    input: { label: "map (a = box) and water (painted tiles)", grid: ["##########", "#R..a....#", "#.##.##a.#", "#a..a....#", "#..a..#a.#", "##########"], marks: ["6,1", "7,1", "8,1", "8,2", "8,3", "7,3", "6,3", "8,4", "5,4"] }
    arrow: the box or one of its 4 neighbours has water
    output: { label: "at risk: 2 boxes", grid: ["##########", "#...a....#", "#.##.##a.#", "#a..a....#", "#..a..#a.#", "##########"], path: ["7,2", "7,4"] }
    steps:
      - "Box `(7, 2)` is dry, but there's water above and below it: at risk."
      - "Box `(4, 3)` only touches water diagonally, at `(5, 4)`: not at risk."
starter: |
  const plan = robot.map();
  console.log("water at (8, 4):", water[4][8]);
  // TODO: walk the map; for each box, look at its tile and its 4 neighbours in water
solution: |
  const plan = robot.map();
  const STEPS = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
  let atRisk = 0;
  for (let y = 0; y < plan.length; y++) {
    for (let x = 0; x < plan[y].length; x++) {
      if (plan[y][x] !== "a") {
        continue;
      }
      const wet = STEPS.some(([dx, dy]) => (water[y + dy]?.[x + dx] ?? 0) > 0);
      if (wet) {
        robot.mark([x, y]);
        atRisk++;
      }
    }
  }
  robot.say(atRisk);
hints:
  - "Add `[0, 0]` to the list of steps and the box itself gets checked along with its neighbours."
  - "`STEPS.some(...)` answers whether at least one step lands on a tile with water."
world:
  theme: museo
  level: 4
  dir: E
  api: [move, map, path]
  items: { a: box }
  map: |
    ##########
    #R..a....#
    #.##.##a.#
    #a..a....#
    #..a..#a.#
    ##########
globals:
  water:
    - [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    - [0, 0, 0, 0, 0, 0, 8, 12, 15, 0]
    - [0, 0, 0, 0, 0, 0, 0, 0, 18, 0]
    - [0, 0, 0, 0, 0, 0, 9, 14, 20, 0]
    - [0, 0, 0, 0, 0, 2, 0, 0, 22, 0]
    - [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
scenarios:
  - {}
  - map: |
      ########
      #R.a.a.#
      #.#..#.#
      #a..a..#
      ########
    globals:
      water:
        - [0, 0, 0, 0, 0, 0, 0, 0]
        - [0, 0, 0, 0, 0, 0, 1, 0]
        - [0, 0, 0, 0, 5, 0, 0, 0]
        - [0, 6, 3, 0, 0, 0, 0, 0]
        - [0, 0, 0, 0, 0, 0, 0, 0]
  - map: |
      #######
      #Ra...#
      #..a..#
      #....a#
      #######
    globals:
      water:
        - [0, 0, 0, 0, 0, 0, 0]
        - [0, 0, 0, 0, 0, 0, 0]
        - [0, 0, 0, 0, 0, 0, 0]
        - [0, 4, 0, 0, 0, 0, 0]
        - [0, 0, 0, 0, 0, 0, 0]
tests:
  - name: marks exactly the boxes at risk
    state: 'JSON.stringify([...w.marks].sort()) === JSON.stringify(Object.keys(w.items).filter((k) => { const [x, y] = k.split(",").map(Number); return [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => (g.water[y + dy]?.[x + dx] ?? 0) > 0); }).sort())'
    msg: The marked tiles aren't exactly the boxes at risk. Check the neighbours and the edges.
  - name: says how many
    state: 'w.said.at(-1) === String(w.marks.length)'
    msg: Chasqui must say the number of boxes at risk, at the end.
  - name: walks the grid with two loops
    source: '\bfor\b[^{]*\{[\s\S]*\bfor\b'
```

## Expert challenge

```exercise
id: js9-reto-rotar
type: challenge
title: The drone's photo, sideways
prompt: |
  The insurance drone took the warehouse photo rotated. Write `rotate(plan)`, which returns a **new** grid turned 90° clockwise, without modifying the original. It works on rectangular grids: one with 2 rows and 3 columns becomes one with 3 rows and 2 columns.

  `rotate([[1, 2, 3], [4, 5, 6]])` → `[[4, 1], [5, 2], [6, 3]]`
starter: |
  function rotate(plan) {
    return plan;
  }

  console.log(rotate([[1, 2, 3], [4, 5, 6]]));
solution: |
  const rotate = (plan) =>
    plan[0].map((_, x) => plan.map((row) => row[x]).reverse());

  console.log(rotate([[1, 2, 3], [4, 5, 6]]));
hints:
  - New row number `x` is made of column `x` of the original, read from bottom to top.
tests:
  - name: 2 × 3 becomes 3 × 2
    run: 'rotate([[1, 2, 3], [4, 5, 6]])'
    equals: [[4, 1], [5, 2], [6, 3]]
  - name: a single tile
    run: 'rotate([[7]])'
    equals: [[7]]
  - name: four turns come back to the start
    run: 'rotate(rotate(rotate(rotate([[1, 2], [3, 4], [5, 6]]))))'
    equals: [[1, 2], [3, 4], [5, 6]]
  - name: doesn't modify the original
    expect: '(() => { const p = [[1, 2], [3, 4]]; rotate(p); return JSON.stringify(p) === "[[1,2],[3,4]]"; })()'
```
