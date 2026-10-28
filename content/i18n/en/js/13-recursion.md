# Session 13 — Recursion

## The job

Tingo María, in the Huánuco jungle. At the mouth of the Cueva de las Lechuzas the air smells of guano and from inside comes a screech that makes your hair stand on end: those are the oilbirds, birds that live in the dark and that everyone calls owls even though they aren't. Biologist Maritza Rengifo has to count their nests before the rainy season, and her budget covers a single week.

The problem is the cave. Each gallery opens into other galleries, which open into others, and nobody knows how many levels there are. A loop needs to know how many times to go round; here nobody knows. But the task fits in one line: **exploring a gallery means counting its nests and exploring each of its exits**. A function that uses itself to solve a smaller piece of the problem is called **recursive**.

```scene
theme: mina
level: 4
dir: E
api: [move, map, mark, report]
items: { n: nest }
caption: The cave's first chamber. Chasqui goes through it with its lamp, tile by tile, never crossing rock, and marks what it has already checked. Each **n** is a nest.
map: |
  ##########
  #..n#..n.#
  #.R.#.n..#
  #n..######
  ##..#..n.#
  #n..#n...#
  ##########
program: |
  const caveMap = robot.map();
  const seen = new Set();
  function explore(x, y) {
    if (caveMap[y][x] === "#" || seen.has(`${x},${y}`)) return;
    seen.add(`${x},${y}`);
    robot.mark([x, y]);
    explore(x + 1, y);
    explore(x - 1, y);
    explore(x, y + 1);
    explore(x, y - 1);
  }
  explore(2, 2);
```

## The minimum

A **recursive** function calls itself with a smaller problem, until it reaches one so small that it's answered without calling anyone: the **base case**. Each call waits for the one it made to finish, on the **call stack**.

```js run
function nests(gallery) {
  let total = gallery.nests;
  for (const exit of gallery.exits) {
    total += nests(exit);
  }
  return total;
}
const entrance = { nests: 2, exits: [{ nests: 3, exits: [] }, { nests: 1, exits: [{ nests: 4, exits: [] }] }] };
console.log(nests(entrance));
```

Here the base case can't be seen, but it's there: a gallery with no exits never enters the `for` and returns its own nests. Watch the stack in a simpler version. Going down from level 3 to the bottom: on each level there are as many nests as its number.

That cave drawn as a tree, and the stack while `nests` walks it:

```figure
title: The nest cave, as a tree
panes:
  - { label: "Each gallery, with its nests in parentheses", text: "entrance (2)\n├─ A (3)\n└─ B (1)\n   └─ C (4)" }
caption: "Each gallery has its own nests and other galleries branch off it. The ones with no exits (A and C) are the base case."
```

```anim
title: The stack goes down one branch and the results come back up
code: |
  function nests(gallery) {
    let total = gallery.nests;
    for (const exit of gallery.exits) {
      total += nests(exit);
    }
    return total;
  }
steps:
  - { line: 2, vars: { total: 2 }, stack: [{ name: nests, args: 'gallery = entrance' }], note: "The gallery `entrance` comes in: 2 nests of its own and two exits, A and B." }
  - { line: 4, vars: { total: 3 }, stack: [{ name: nests, args: 'gallery = entrance' }, { name: nests, args: 'gallery = A' }], note: "First exit, A. The stack grows: `entrance` waits for A to answer." }
  - { line: 6, vars: { total: 3 }, stack: [{ name: nests, args: 'gallery = entrance' }, { name: nests, args: 'gallery = A', ret: "3" }], note: "A has no exits: it's a base case. It returns 3 and its call closes." }
  - { line: 4, vars: { total: 1 }, stack: [{ name: nests, args: 'gallery = entrance' }, { name: nests, args: 'gallery = B' }], note: "Back in `entrance`, its total is already 2 + 3 = 5. Second exit, B: another call, and A's is gone." }
  - { line: 4, vars: { total: 4 }, stack: [{ name: nests, args: 'gallery = entrance' }, { name: nests, args: 'gallery = B' }, { name: nests, args: 'gallery = C' }], note: "B has one exit, C. The stack grows again, one branch deeper." }
  - { line: 6, vars: { total: 4 }, stack: [{ name: nests, args: 'gallery = entrance' }, { name: nests, args: 'gallery = B' }, { name: nests, args: 'gallery = C', ret: "4" }], note: "C has no exits either: it returns 4." }
  - { line: 6, vars: { total: 5 }, stack: [{ name: nests, args: 'gallery = entrance' }, { name: nests, args: 'gallery = B', ret: "5" }], note: "B adds its own plus what C gave it: 1 + 4 = 5, and returns 5." }
  - { line: 6, vars: { total: 10 }, stack: [{ name: nests, args: 'gallery = entrance', ret: "10" }], note: "`entrance` adds its 2 nests plus what A (3) and B (5) returned: 2 + 3 + 5 = 10. Each gallery is visited **once**, one whole branch before the next." }
```

```anim
title: The stack grows down to the base case and then unwinds
code: |
  function descend(level) {
    if (level === 0) {
      return 0;
    }
    const below = descend(level - 1);
    return below + level;
  }
  const total = descend(3);
  console.log(total);
notes:
  2: "Is this the bottom yet? That's the base case."
  3: "The bottom answers 0 without calling anyone: here the stack stops growing."
  5: "To answer, this level needs what's below it: it calls and waits."
  6: "The answer from below has arrived: it adds its own and answers upwards."
```

The same idea **fills** a region of a map: I paint my tile and ask my four neighbours to do the same. The base case is "it's rock or I already painted it".

```anim
title: Filling a chamber, tile by tile
code: |
  const seen = new Set();
  function fill(x, y) {
    if (caveMap[y][x] === "#" || seen.has(`${x},${y}`)) {
      return 0;
    }
    seen.add(`${x},${y}`);
    return 1 + fill(x + 1, y) + fill(x - 1, y) + fill(x, y + 1) + fill(x, y - 1);
  }
  console.log(fill(1, 1));
globals:
  caveMap: ["######", "#...##", "#.#..#", "######"]
grid: { map: ["######", "#...##", "#.#..#", "######"], visited: seen }
show: [x, y]
speed: 500
notes:
  4: "Rock or a tile already painted: return 0 and go no further."
  6: "Paint this tile and ask the four neighbours."
```

```anim
title: With no base case, the stack hits the ceiling
code: |
  function endless(n) {
    return endless(n + 1);
  }
  endless(1);
steps:
  - { line: 2, vars: {}, stack: [{ name: endless, args: 'n = 1' }], note: "Each call stacks on top of the previous one and waits for the one it made." }
  - { line: 2, vars: {}, stack: [{ name: endless, args: 'n = 1' }, { name: endless, args: 'n = 2' }], note: "None reaches a base case: nothing stops them." }
  - { line: 2, vars: {}, stack: [{ name: endless, args: 'n = 1' }, { name: endless, args: 'n = 2' }, { name: endless, args: 'n = 3' }, { name: endless, args: 'n = 4' }], note: "The stack keeps growing…" }
  - { line: 2, vars: {}, stack: [{ name: endless, args: 'n = 1' }, { name: endless, args: 'n = 2' }, { name: endless, args: 'n = 3' }, { name: endless, args: 'n = 4' }, { name: endless, args: 'n = 5' }, { name: endless, args: 'n = 6' }], note: "…but the stack has a **ceiling**." }
  - { line: 4, vars: {}, stack: [], out: "RangeError: Maximum call stack size exceeded", note: "The engine cuts everything off and throws the error: the function never returned anything." }
```

```figure
title: The order of the calls of `fill(1, 1)`
panes:
  - { label: "One neighbour completely before the next", text: "fill(1, 1)\n├─ east  (2, 1) → its four neighbours, and theirs…\n├─ west (0, 1) → rock: 0\n├─ south (1, 2) → open tile: goes on\n└─ north (1, 0) → rock: 0" }
caption: "Until everything that comes out of the east is finished, `fill` doesn't ask about the west."
```

- **Base case**: the case answered directly. Without it (or if the calls never reach it), the function calls itself forever and the stack overflows: *Maximum call stack size exceeded*.
- **Recursive step**: the call to itself with something **smaller**: one level less, a sub-gallery, a neighbouring tile not yet painted.
- **Trust the call**: when you write `nests(exit)`, don't follow the whole tree in your head; assume it returns the right thing for that exit and just combine the results.
- **Recursion or loop?** Anything recursive can be done with a loop and a stack of your own, and a simple loop can be written recursively. Use recursion when the problem is shaped like a **tree** (galleries inside galleries, regions that branch out) and a loop when it's a **line** (going through a list). For thousands of levels, the loop is safer: the stack has a limit.

> **Common trap:** a base case the calls can skip past. `if (metres === 0)` never holds if you go down 2 at a time from 7: 7, 5, 3, 1, −1… Use `<=` so the base case catches everything that's already done.

<!-- legacy: recursion -->

<!-- mdn: recursion functions -->

## Practice

```exercise
id: js13-predice-baja-sube
type: predict
title: Down and up
prompt: |
  Chasqui announces each level on the way down and on the way back up. What does it print?
code: |
  function descend(level) {
    if (level === 0) {
      return;
    }
    console.log("down", level);
    descend(level - 1);
    console.log("up", level);
  }
  descend(2);
options:
  - "down 2\ndown 1\nup 1\nup 2"
  - "down 2\nup 2\ndown 1\nup 1"
  - "down 2\ndown 1\nup 2\nup 1"
  - "down 2\ndown 1"
answer: "down 2\ndown 1\nup 1\nup 2"
explain: |
  `descend(2)` prints "down 2" and calls `descend(1)`, which prints "down 1" and calls `descend(0)`, which returns at once. Then `descend(1)` carries on where it stopped ("up 1") and finishes, and only then does `descend(2)` print "up 2". The last one in is the first one out: that's a stack.
```

```exercise
id: js13-predice-fondos
type: predict
title: How many dead ends?
prompt: |
  A dead end is a gallery with no exits. What does it print?
code: |
  function deadEnds(gallery) {
    if (gallery.exits.length === 0) {
      return 1;
    }
    let total = 0;
    for (const exit of gallery.exits) {
      total += deadEnds(exit);
    }
    return total;
  }
  const a1 = { exits: [] };
  const a2 = { exits: [] };
  const a = { exits: [a1, a2] };
  const b = { exits: [] };
  console.log(deadEnds({ exits: [a, b] }));
options:
  - "2"
  - "3"
  - "4"
  - "5"
answer: "3"
explain: |
  The entrance has two exits, `a` and `b`. `b` has no exits: it's a dead end (1). `a` has two, `a1` and `a2`, and each is a dead end (1 + 1). Total: 3. Galleries with exits don't count; they only add up what their exits give.
```

```exercise
id: js13-completa-buscar
type: complete
title: Where's the echo shaft?
prompt: |
  Complete `find(gallery, name)`: it returns `true` if that gallery, or any one further in, has that name.
visual:
  figure:
    title: The test gallery
    panes:
      - { label: "tree", table: { head: ["level 1", "level 2", "level 3"], rows: [["North", "", ""], ["", "North 1", ""], ["", "North 2", ""], ["", "", "Echo shaft"]] } }
      - { label: "find(north, \"Echo shaft\")", value: "true" }
starter: |
  function find(gallery, name) {
    if (gallery.name === name) {
      return ___;
    }
    for (const exit of gallery.exits) {
      if (find(___, name)) {
        return true;
      }
    }
    return ___;
  }

  const north = {
    name: "North",
    exits: [
      { name: "North 1", exits: [] },
      { name: "North 2", exits: [{ name: "Echo shaft", exits: [] }] },
    ],
  };
  console.log(find(north, "Echo shaft"), find(north, "South"));
solution: |
  function find(gallery, name) {
    if (gallery.name === name) {
      return true;
    }
    for (const exit of gallery.exits) {
      if (find(exit, name)) {
        return true;
      }
    }
    return false;
  }

  const north = {
    name: "North",
    exits: [
      { name: "North 1", exits: [] },
      { name: "North 2", exits: [{ name: "Echo shaft", exits: [] }] },
    ],
  };
  console.log(find(north, "Echo shaft"), find(north, "South"));
hints:
  - "The recursive call searches inside each exit, one by one."
  - If no exit has it, it isn't there.
tests:
  - name: finds the shaft and doesn't find the South
    output: true false
  - name: the gallery itself counts
    expect: 'find({ name: "South", exits: [] }, "South") === true'
```

```exercise
id: js13-arregla-cuerda
type: fix
title: The rope that never ends
prompt: |
  To go down a shaft, Chasqui needs lengths of rope 2 metres long. `ropeLengths(metres)` should say how many. With 8 metres it works; with 7, the program crashes with the stack overflowing. Fix the base case.
visual:
  figure:
    panes:
      - { table: { head: ["call", "ropeLengths(7)", "ropeLengths(5)", "ropeLengths(3)", "ropeLengths(1)", "ropeLengths(-1)", "…"], rows: [["metres === 0?", "no", "no", "no", "no", "no", "never"]] } }
starter: |
  function ropeLengths(metres) {
    if (metres === 0) {
      return 0;
    }
    return 1 + ropeLengths(metres - 2);
  }

  console.log(ropeLengths(8));
  console.log(ropeLengths(7));
solution: |
  function ropeLengths(metres) {
    if (metres <= 0) {
      return 0;
    }
    return 1 + ropeLengths(metres - 2);
  }

  console.log(ropeLengths(8));
  console.log(ropeLengths(7));
hints:
  - From an odd number, taking away 2 at a time never lands exactly on 0.
tests:
  - name: 8 metres, 4 lengths; 7 metres, also 4
    output: "4\n4"
  - name: 0 metres, no rope
    expect: ropeLengths(0) === 0
  - name: 1 metre needs one length
    expect: ropeLengths(1) === 1
```

```exercise
id: js13-escribe-profundidad
type: write
title: How deep is it?
prompt: |
  Write `depth(gallery)`: how many levels it has, counting the gallery itself. A gallery with no exits has depth 1; otherwise it's 1 plus the depth of its **deepest** exit.
visual:
  figure:
    title: An example with depth 3
    panes:
      - { label: "tree", table: { head: ["level 1", "level 2", "level 3"], rows: [["South", "", ""], ["", "South 1", ""], ["", "", "South 1a"], ["", "South 2", ""]] } }
      - { label: "depth(south)", value: "3" }
starter: |
  function depth(gallery) {
  }

  const south = {
    exits: [
      { exits: [{ exits: [] }] },
      { exits: [] },
    ],
  };
  console.log(depth(south));
solution: |
  function depth(gallery) {
    let deepest = 0;
    for (const exit of gallery.exits) {
      deepest = Math.max(deepest, depth(exit));
    }
    return 1 + deepest;
  }

  const south = {
    exits: [
      { exits: [{ exits: [] }] },
      { exits: [] },
    ],
  };
  console.log(depth(south));
hints:
  - Start with `deepest = 0`; for each exit, keep the larger of what you had and `depth(exit)`.
  - With no exits, `deepest` stays 0 and you return 1. That's the base case.
tests:
  - name: the example has depth 3
    run: depth(south)
    equals: 3
  - name: a lone gallery has depth 1
    run: 'depth({ exits: [] })'
    equals: 1
  - name: a corridor 5 levels deep
    run: 'depth({ exits: [{ exits: [{ exits: [{ exits: [{ exits: [] }] }] }] }] })'
    equals: 5
  - name: depth calls itself
    source: 'function\s+depth\s*\([^)]*\)\s*\{(?:(?!\n\})[\s\S])*\bdepth\s*\('
    msg: Use depth inside depth, once per exit.
```

```exercise
id: js13-escribe-lista-nidos
type: write
title: The list for the biologist
prompt: |
  Write `withNests(gallery)`: it returns the list of **names** of the galleries with at least one nest, in this order: first the gallery itself, then whatever is inside each exit, from the first to the last.
visual:
  figure:
    title: The order of the list
    panes:
      - { label: "tree (nests)", table: { head: ["level 1", "level 2", "level 3"], rows: [["East (8)", "", ""], ["", "East 1 (0)", ""], ["", "East 2 (6)", ""], ["", "", "East 2a (3)"]] } }
      - { label: "withNests(east)", value: "[\"East\", \"East 2\", \"East 2a\"]" }
starter: |
  function withNests(gallery) {
    return [];
  }

  const east = {
    name: "East", nests: 8, exits: [
      { name: "East 1", nests: 0, exits: [] },
      { name: "East 2", nests: 6, exits: [{ name: "East 2a", nests: 3, exits: [] }] },
    ],
  };
  console.log(withNests(east));
solution: |
  function withNests(gallery) {
    const names = gallery.nests > 0 ? [gallery.name] : [];
    for (const exit of gallery.exits) {
      names.push(...withNests(exit));
    }
    return names;
  }

  const east = {
    name: "East", nests: 8, exits: [
      { name: "East 1", nests: 0, exits: [] },
      { name: "East 2", nests: 6, exits: [{ name: "East 2a", nests: 3, exits: [] }] },
    ],
  };
  console.log(withNests(east));
hints:
  - "Start the list with this gallery's name (if it has nests) and add what `withNests` returns for each exit."
  - "`names.push(...other)` adds every element of `other`, not the whole list as one element."
tests:
  - name: the example
    run: withNests(east)
    equals: ["East", "East 2", "East 2a"]
  - name: an empty gallery gives an empty list
    run: 'withNests({ name: "Dry", nests: 0, exits: [] })'
    equals: []
  - name: keeps the order of the exits
    run: 'withNests({ name: "A", nests: 0, exits: [{ name: "B", nests: 1, exits: [{ name: "C", nests: 2, exits: [] }] }, { name: "D", nests: 5, exits: [] }] })'
    equals: ["B", "C", "D"]
```

## The case

```exercise
id: js13-caso-ramales
type: case
title: The branch nobody finished exploring
prompt: |
  Write `nests(gallery)`, which adds up the nests of a gallery and of everything inside it, and use it to count the nests of each branch.

  Before Chasqui arrived, Maritza sent three assistants, one per branch of the cave. Each one reported how many nests there were in the whole of their branch. One didn't reach the bottom: got scared, or the torch battery ran out. Who?

  Print one line per branch, with who explored it and the total at the end: `North (Kevin): 20`. The board compares your number with what each assistant reported.
visual:
  board:
    for: js13-caso-ramales
    title: What each assistant reported
    task: Add up each branch's nests with recursion, down to the last gallery, and compare them with the reports.
    cards:
      - { name: "Kevin", kind: person, role: "North branch · reported 20", clue: { find: "North", says: 20 } }
      - { name: "Lucía", kind: person, role: "South branch · reported 21", culprit: true, clue: { find: "South", says: 21 } }
      - { name: "Abel", kind: person, role: "East branch · reported 18", clue: { find: "East", says: 18 } }
    caption: "If you only add one level of galleries, nobody matches: a branch goes on as far as it goes."
starter: |
  const cave = { name: "Entrance", nests: 0, exits: [
    { name: "North", nests: 4, exits: [
      { name: "North 1", nests: 6, exits: [] },
      { name: "North 2", nests: 2, exits: [
        { name: "North 2a", nests: 5, exits: [] },
        { name: "North 2b", nests: 0, exits: [
          { name: "Echo shaft", nests: 3, exits: [] },
        ] },
      ] },
    ] },
    { name: "South", nests: 3, exits: [
      { name: "South 1", nests: 7, exits: [
        { name: "South 1a", nests: 2, exits: [
          { name: "South 1a i", nests: 4, exits: [
            { name: "Oilbird chamber", nests: 9, exits: [] },
          ] },
        ] },
      ] },
      { name: "South 2", nests: 5, exits: [] },
    ] },
    { name: "East", nests: 8, exits: [
      { name: "East 1", nests: 1, exits: [] },
      { name: "East 2", nests: 6, exits: [
        { name: "East 2a", nests: 3, exits: [] },
      ] },
      { name: "East 3", nests: 0, exits: [] },
    ] },
  ] };

  const assistants = { North: "Kevin", South: "Lucía", East: "Abel" };

  // The branches are the entrance's exits:
  for (const branch of cave.exits) {
    console.log(branch.name, "has", branch.exits.length, "exits");
  }

  // TODO: write nests(gallery): this gallery's nests plus those of
  // each of its exits, all the way down.

  // TODO: print one line per branch, like this: North (Kevin): 20
solution: |
  const cave = { name: "Entrance", nests: 0, exits: [
    { name: "North", nests: 4, exits: [
      { name: "North 1", nests: 6, exits: [] },
      { name: "North 2", nests: 2, exits: [
        { name: "North 2a", nests: 5, exits: [] },
        { name: "North 2b", nests: 0, exits: [
          { name: "Echo shaft", nests: 3, exits: [] },
        ] },
      ] },
    ] },
    { name: "South", nests: 3, exits: [
      { name: "South 1", nests: 7, exits: [
        { name: "South 1a", nests: 2, exits: [
          { name: "South 1a i", nests: 4, exits: [
            { name: "Oilbird chamber", nests: 9, exits: [] },
          ] },
        ] },
      ] },
      { name: "South 2", nests: 5, exits: [] },
    ] },
    { name: "East", nests: 8, exits: [
      { name: "East 1", nests: 1, exits: [] },
      { name: "East 2", nests: 6, exits: [
        { name: "East 2a", nests: 3, exits: [] },
      ] },
      { name: "East 3", nests: 0, exits: [] },
    ] },
  ] };

  const assistants = { North: "Kevin", South: "Lucía", East: "Abel" };

  function nests(gallery) {
    let total = gallery.nests;
    for (const exit of gallery.exits) {
      total += nests(exit);
    }
    return total;
  }

  for (const branch of cave.exits) {
    console.log(`${branch.name} (${assistants[branch.name]}): ${nests(branch)}`);
  }
answer: Lucía
answerLabel: Who didn't reach the bottom of their branch?
reveal: |
  Lucía: the South branch has 30 nests and she reported 21. She missed exactly the 9 in the Oilbird chamber, the deepest gallery in the cave (five levels from the entrance). That's why a loop one or two levels deep isn't enough.
hints:
  - It's the function from "The minimum". The base case is hidden in the `for`: a gallery with no exits returns just its own nests.
  - "Don't add the entrance: call `nests(branch)` for each exit of `cave`."
```

## The judge

As in the earlier sessions, the judge calls your function and compares what it returns.

```exercise
id: js13-juez-camaras
type: judge
mode: function
function: chambers
title: The cave's chambers
prompt: |
  Write `chambers(map)`, which returns `[count, largest]`: how many chambers the map has and how many tiles the largest one has.

  The map is a list of text rows: `"#"` is rock and `"."` is floor. A **chamber** is a group of floor tiles joined on their **four sides** (up, down, left, right); you can't pass diagonally. Outside the map, everything is rock. If there's no floor, return `[0, 0]`.

  **Constraints:** the map has 1 to 30 rows, all the same length, of 1 to 30 tiles.
visual:
  figure:
    title: Example 1, with its two chambers
    input: { label: "map", grid: ["..#..", "..#.#", "###..", "#...#"], path: ["0,0", "1,0", "0,1", "1,1"], marks: ["3,0", "4,0", "3,1", "3,2", "4,2", "1,3", "2,3", "3,3"] }
    arrow: fill each chamber and count its tiles
    output: { label: returns, table: { head: ["chamber", "tiles"], rows: [["the green one", "4"], ["the marked one", "8"], ["**returns**", "[2, 8]"]] } }
    steps:
      - "Go through every tile; when you find floor you haven't painted yet, it's a new chamber: fill it."
      - "Tile (4, 2) touches (4, 1), which is rock, but it reaches (3, 2) from the left."
starter: |
  function chambers(map) {
    return [0, 0];
  }
solution: |
  function chambers(map) {
    const seen = new Set();
    function fill(x, y) {
      if (y < 0 || y >= map.length || x < 0 || x >= map[y].length) {
        return 0;
      }
      if (map[y][x] === "#" || seen.has(`${x},${y}`)) {
        return 0;
      }
      seen.add(`${x},${y}`);
      return 1 + fill(x + 1, y) + fill(x - 1, y) + fill(x, y + 1) + fill(x, y - 1);
    }
    let count = 0;
    let largest = 0;
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        const size = fill(x, y);
        if (size > 0) {
          count++;
          largest = Math.max(largest, size);
        }
      }
    }
    return [count, largest];
  }
hints:
  - "A function `fill(x, y)` inside `chambers` that returns how many tiles it painted: 0 if it's off the map, rock or already painted; otherwise 1 plus what its four neighbours paint."
  - "Call `fill` from every tile of the map: if it returns more than 0, you found a new chamber."
samples:
  - args: [["..#..", "..#.#", "###..", "#...#"]]
    returns: [2, 8]
  - args: [[".#.", "#.#", ".#."]]
    returns: [5, 1]
    note: You can't pass diagonally, so each tile is its own chamber.
edge:
  - args: [["###", "###"]]
    tag: with no floor
  - args: [["."]]
    tag: with a single tile
  - args: [["....", "....", "...."]]
    tag: with the whole map floor
  - args: [["......", "#####.", "......", ".#####", "......"]]
    tag: with a zigzag corridor
  - args: [["..........", "##########", ".........."]]
    tag: with two chambers the same size
random:
  count: 40
  seed: 131
  generate: |
    const h = rng.int(1, 30);
    const w = rng.int(1, 30);
    const rock = rng.next() * 0.6 + 0.2;
    return [Array.from({ length: h }, () => Array.from({ length: w }, () => (rng.next() < rock ? "#" : ".")).join(""))];
wrong:
  - |
    function chambers(map) {
      const seen = new Set();
      function fill(x, y) {
        if (y < 0 || y >= map.length || x < 0 || x >= map[y].length) return 0;
        if (map[y][x] === "#" || seen.has(`${x},${y}`)) return 0;
        seen.add(`${x},${y}`);
        let n = 1;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) n += fill(x + dx, y + dy);
        return n;
      }
      let count = 0, largest = 0;
      for (let y = 0; y < map.length; y++) for (let x = 0; x < map[y].length; x++) {
        const t = fill(x, y);
        if (t > 0) { count++; largest = Math.max(largest, t); }
      }
      return [count, largest];
    }
  - |
    function chambers(map) {
      const seen = new Set();
      function fill(x, y) {
        if (map[y][x] === "#" || seen.has(`${x},${y}`)) return 0;
        seen.add(`${x},${y}`);
        return 1 + fill(x + 1, y) + fill(x - 1, y) + fill(x, y + 1) + fill(x, y - 1);
      }
      let count = 0, largest = 0;
      for (let y = 0; y < map.length; y++) for (let x = 0; x < map[y].length; x++) {
        const t = fill(x, y);
        if (t > 0) { count++; largest = Math.max(largest, t); }
      }
      return [count, largest];
    }
  - |
    function chambers(map) {
      const seen = new Set();
      function fill(x, y) {
        if (y < 0 || y >= map.length || x < 0 || x >= map[y].length) return 0;
        if (map[y][x] === "#" || seen.has(`${x},${y}`)) return 0;
        seen.add(`${x},${y}`);
        return 1 + fill(x + 1, y) + fill(x - 1, y) + fill(x, y + 1) + fill(x, y - 1);
      }
      let count = 0, latest = 0;
      for (let y = 0; y < map.length; y++) for (let x = 0; x < map[y].length; x++) {
        const t = fill(x, y);
        if (t > 0) { count++; latest = t; }
      }
      return [count, latest];
    }
```

## Final mission

```exercise
id: js13-mision-camara
type: mission
title: The nests in the chamber
prompt: |
  Mark every tile of the chamber Chasqui is in and report how many nests it holds, with a recursive function.

  Chasqui doesn't move: it lights up the chamber with its lamp and checks it on the map. `robot.map()` gives the whole map (`caveMap[y][x]`: `"#"` rock, `"n"` a nest, `"."` floor) and `robot.position` says where it is. Write `explore(x, y)`, which:

  - if the tile is rock or already checked, returns 0 (the base case);
  - otherwise marks it with `robot.mark([x, y])`, and returns 1 if it has a nest (0 if not) **plus** whatever its four neighbours return.

  At the end, `robot.report(...)` with the total. Nests in **other** chambers, on the far side of the rock, don't count. The map is always surrounded by rock, and it changes in each test.
visual:
  figure:
    title: What counts and what doesn't
    panes:
      - { label: "test 2: Chasqui's chamber, marked", grid: ["##########", "#..n#..n.#", "#.R.#.n..#", "#n..######", "##..#..n.#", "#n..#n...#", "##########"], marks: ["1,1", "2,1", "3,1", "1,2", "2,2", "3,2", "1,3", "2,3", "3,3", "2,4", "3,4", "1,5", "2,5", "3,5"], path: ["5,1", "6,1", "7,1", "8,1", "5,2", "6,2", "7,2", "8,2", "5,4", "6,4", "7,4", "8,4", "5,5", "6,5", "7,5", "8,5"] }
      - { label: "reports", table: { head: ["", "nests"], rows: [["in Chasqui's chamber (marked)", "3"], ["on the far side of the rock (in green)", "4 (don't count)"]] } }
starter: |
  const caveMap = robot.map();
  const { x, y } = robot.position;
  console.log("Chasqui is at", x, y, "on", caveMap[y][x]);

  // TODO: write a recursive explore(x, y): base case (rock or already checked),
  // mark the tile, count its nest and add up what its four neighbours give.

  // TODO: robot.report(...) with the chamber's nests.
solution: |
  const caveMap = robot.map();
  const seen = new Set();

  function explore(x, y) {
    const tileKey = `${x},${y}`;
    if (caveMap[y][x] === "#" || seen.has(tileKey)) {
      return 0;
    }
    seen.add(tileKey);
    robot.mark([x, y]);
    const here = caveMap[y][x] === "n" ? 1 : 0;
    return here + explore(x + 1, y) + explore(x - 1, y) + explore(x, y + 1) + explore(x, y - 1);
  }

  const { x, y } = robot.position;
  robot.report(explore(x, y));
hints:
  - "Keep the checked tiles in a `Set` of `\"x,y\"` keys, outside the function: if it were inside, each call would start with an empty one."
  - "Without the `Set`, two neighbours ask each other forever and the stack overflows."
world:
  theme: mina
  level: 4
  dir: E
  api: [move, map, mark, report]
  items: { n: nest }
  map: |
    ##############
    #R..n#...n...#
    #.##.#.###.#.#
    #n...#.#n..#n#
    ######.#####.#
    #..n.#...n...#
    #.n..#########
    ##############
scenarios:
  - tests:
      - name: marks the chamber's 10 tiles
        state: w.marks.length === 10
        msg: The marked tiles aren't exactly the tiles of Chasqui's chamber.
      - name: reports 2 nests
        state: w.reports.length === 1 && w.reports[0] === 2
        msg: The reported number isn't this chamber's nests (or it was reported more than once).
  - map: |
      ##########
      #..n#..n.#
      #.R.#.n..#
      #n..######
      ##..#..n.#
      #n..#n...#
      ##########
    tests:
      - name: marks the chamber's 14 tiles
        state: w.marks.length === 14
        msg: The marked tiles aren't exactly the tiles of Chasqui's chamber.
      - name: reports 3 nests
        state: w.reports.length === 1 && w.reports[0] === 3
        msg: The reported number isn't this chamber's nests (or it was reported more than once).
  - map: |
      ################
      #n..#....n#...n#
      #.#.#.##..#.#..#
      #.#...#n..#.#n.#
      #.#####.###.#.##
      #..n...R..#..n.#
      #########n#.####
      #n.....#.....#.#
      ################
    tests:
      - name: marks the chamber's 54 tiles
        state: w.marks.length === 54
        msg: The marked tiles aren't exactly the tiles of Chasqui's chamber.
      - name: reports 8 nests
        state: w.reports.length === 1 && w.reports[0] === 8
        msg: The reported number isn't this chamber's nests (or it was reported more than once).
tests:
  - name: explore calls itself
    source: 'function\s+explore\s*\([^)]*\)\s*\{(?:(?!\n\})[\s\S])*\bexplore\s*\('
    msg: Write explore as a recursive function that calls itself for the four neighbours.
  - name: no crashing
    state: '!w.crashed'
```

## Expert challenge

```exercise
id: js13-reto-ruta
type: challenge
title: The way to the chamber
prompt: |
  Write `routeTo(gallery, name)`: it returns the list of names from this gallery to the one called `name`, both included, or `null` if it isn't there. Maritza wants to print the way for the next team.

  `routeTo(cave, "Echo shaft")` → `["Entrance", "North", "North 2", "Echo shaft"]`
starter: |
  function routeTo(gallery, name) {
    return null;
  }

  const cave = { name: "Entrance", exits: [
    { name: "North", exits: [{ name: "North 2", exits: [{ name: "Echo shaft", exits: [] }] }] },
    { name: "South", exits: [] },
  ] };
  console.log(routeTo(cave, "Echo shaft"));
solution: |
  function routeTo(gallery, name) {
    if (gallery.name === name) {
      return [gallery.name];
    }
    for (const exit of gallery.exits) {
      const rest = routeTo(exit, name);
      if (rest !== null) {
        return [gallery.name, ...rest];
      }
    }
    return null;
  }

  const cave = { name: "Entrance", exits: [
    { name: "North", exits: [{ name: "North 2", exits: [{ name: "Echo shaft", exits: [] }] }] },
    { name: "South", exits: [] },
  ] };
  console.log(routeTo(cave, "Echo shaft"));
hints:
  - If some exit has a way to the name, yours is your own name followed by that way.
tests:
  - name: the way to the shaft
    run: 'routeTo(cave, "Echo shaft")'
    equals: ["Entrance", "North", "North 2", "Echo shaft"]
  - name: the gallery itself
    run: 'routeTo(cave, "Entrance")'
    equals: ["Entrance"]
  - name: a name that isn't there
    run: 'routeTo(cave, "Secret chamber")'
    equals: null
  - name: searches the second exit if the first doesn't have it
    run: 'routeTo(cave, "South")'
    equals: ["Entrance", "South"]
```
