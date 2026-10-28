# Session 16 — Data and history

## The job

Arequipa, the Independencia school's sports hall, two days before the final of the Southern Schools Robotics Tournament. The game is "capture the pennant": every round, the robots leave from the same corner and the first to pick up a pennant wins the point. Ms Yolanda Quispe walked into Loop with a USB stick and a stern face: "Our rival is Rocoto, the robot from the Cayma school. It beat us twice. Here are its videos from the whole year, turned into text."

It's hundreds of rounds, each one a row of moves: `"EEESSSEEN"`. Rocoto doesn't improvise: it has habits. But nobody spots them by reading hundreds of rows. Today Chasqui learns to **count, group and summarise a history** with `Map` and `Set`, to guess what Rocoto will do before it does it.

```scene
theme: museo
level: 4
dir: E
items: { a: gold pennant, b: blue pennant, c: red pennant }
api: [move, path, cargo]
caption: The pitch in the sports hall. Rocoto and Chasqui leave from the top corner; there are three pennants. This round, Chasqui repeats Rocoto's favourite route and reaches the gold one first.
map: |
  #########
  #R......#
  #.##.##.#
  #....#a.#
  #.#.....#
  #b..#.c.#
  #########
program: |
  robot.followPath(["E", "E", "E", "S", "S", "S", "E", "E", "N"]);
  robot.take();
  robot.say("Been waiting for you!");
```

## The minimum

In session 10 you used a `Set` for what you'd visited and a `Map` to remember where you came from. They are also the two tools for **summarising data**: a `Set` tells you which different values there are; a `Map` keeps a count, or a list, for each key.

```js run
const gates = [3, 1, 3, 2, 3, 1];
console.log(new Set(gates).size);
const times = new Map();
for (const g of gates) times.set(g, (times.get(g) ?? 0) + 1);
console.log(times.get(3), [...times.keys()].join(" "));
```

The middle line is the most useful pattern of the session: **counting with a Map**. The first time a key shows up, `times.get(g)` gives `undefined`, `?? 0` turns it into 0, and 1 gets stored. Watch it in slow motion:

```anim
title: Counting with a Map, one move per pass
code: |
  const history = ["E", "S", "E", "E", "N", "E"];
  const count = new Map();
  for (let i = 0; i < history.length; i++) {
    const move = history[i];
    count.set(move, (count.get(move) ?? 0) + 1);
  }
  console.log(count.get("E"));
cells: { of: history, at: i }
show: [count, i]
notes:
  2: "An empty Map: no keys yet."
  5: "If move was already there, add 1 to its count; if not, it starts at 1."
  7: "E came up 4 times."
```

With that pattern and two more you have almost everything a history asks for:

- **Distinct**: `new Set(list)` drops repeats; `.size` says how many are left and `[...set]` turns them back into an array.
- **Count**: `count.set(k, (count.get(k) ?? 0) + 1)`. At the end, loop `for (const [key, times] of count)` to find the most frequent. A `Map` remembers the order its keys arrived in, so "the first one to appear" comes for free in ties.
- **Group**: a `Map` of lists. Create the list the first time, then add: `if (!groups.has(k)) groups.set(k, []); groups.get(k).push(x);`. Today there's also `Map.groupBy(list, (x) => key)`, which does the same in one line.
- **Windows**: the last `k` moves are `history.slice(-k)`. To go through every window of `k` in a row, don't add everything up again: **add the one coming in and subtract the one going out**.
- **Compound keys**: to count "what it did on tile (2, 3)" or "what came after 3, 1", join the parts into a string: `` `${x},${y}` ``, `window.join(",")`.

> **Common trap:** an array as a key doesn't work. `seen.add([2, 3])` and then `seen.has([2, 3])` gives `false`, because they are **two different arrays** that only look alike. `Map` and `Set` compare objects by identity, not by content. Use a string key: `"2,3"`.

<!-- legacy: group-by -->

<!-- mdn: map-vs-object set-vs-object group-by -->

## Practice

```exercise
id: js16-predice-set
type: predict
title: Rocoto's gates
prompt: |
  Over six rounds, Rocoto came in through these gates. What does it print?
code: |
  const gates = [3, 1, 3, 2, 1, 3];
  const distinct = new Set(gates);
  console.log(distinct.size);
  console.log([...distinct].join(" "));
options:
  - "3\n3 1 2"
  - "6\n3 1 3 2 1 3"
  - "3\n1 2 3"
  - "4\n3 1 2"
answer: "3\n3 1 2"
explain: |
  A `Set` keeps each value only once: 3, 1 and 2 are left. And it keeps them **in the order they arrived**, not sorted: that's why it prints `3 1 2`.
```

```exercise
id: js16-predice-clave
type: predict
title: The tile that isn't there
prompt: |
  Chasqui writes down the tiles where it saw Rocoto. What does it print?
code: |
  const seen = new Set();
  seen.add([2, 3]);
  seen.add("2,3");
  console.log(seen.has([2, 3]), seen.has("2,3"), seen.size);
options:
  - "true true 1"
  - "true true 2"
  - "false true 2"
  - "false false 2"
answer: "false true 2"
explain: |
  Every `[2, 3]` you write is a **new** array. The `Set` holds the first one, and `has` asks about a different one that only looks like it: `false`. Strings, on the other hand, are compared by their content: `"2,3"` is there. That's why coordinates are stored as strings.
```

```exercise
id: js16-completa-favorita
type: complete
title: The favourite gate
prompt: |
  Count how many times Rocoto used each gate and find the one it used most.
visual:
  figure:
    input: { label: gates, cells: [4, 2, 4, 7, 2, 4, 9, 4], highlight: [0, 2, 5, 7] }
    arrow: count with a Map
    output: { label: count, table: { head: ["gate", "times"], rows: [["4", "4"], ["2", "2"], ["7", "1"], ["9", "1"]] } }
starter: |
  const gates = [4, 2, 4, 7, 2, 4, 9, 4];
  const count = new Map();
  for (const gate of gates) {
    count.set(gate, (count.___(gate) ___ 0) + 1);
  }

  let favourite = null;
  for (const [gate, times] of count) {
    if (favourite === null || times > count.get(favourite)) {
      favourite = ___;
    }
  }
  console.log(favourite, count.get(favourite));
solution: |
  const gates = [4, 2, 4, 7, 2, 4, 9, 4];
  const count = new Map();
  for (const gate of gates) {
    count.set(gate, (count.get(gate) ?? 0) + 1);
  }

  let favourite = null;
  for (const [gate, times] of count) {
    if (favourite === null || times > count.get(favourite)) {
      favourite = gate;
    }
  }
  console.log(favourite, count.get(favourite));
hints:
  - "To read a key's current count you use `get`; if it isn't there, you get `undefined`."
  - "`?? 0` turns `undefined` into 0. And the favourite is that pass's `gate`."
tests:
  - name: gate 2 was counted twice
    expect: count.get(2) === 2
  - name: there are four distinct gates
    expect: count.size === 4
  - name: the favourite is 4, with 4 times
    output: 4 4
```

```exercise
id: js16-arregla-agrupar
type: fix
title: The rounds that kept getting erased
prompt: |
  This code groups the moves by round, but every round ends up with **a single** move. It should print `ESE SW`. Fix it.
visual:
  figure:
    input: { label: plays, table: { head: ["round", "move"], rows: [["1", "E"], ["1", "S"], ["2", "S"], ["1", "E"], ["2", "W"]] } }
    arrow: group by round
    output: { label: byRound, cards: [{ title: "round 1", rows: [["moves", "E, S, E"]] }, { title: "round 2", rows: [["moves", "S, W"]] }] }
starter: |
  const plays = [
    { round: 1, move: "E" }, { round: 1, move: "S" }, { round: 2, move: "S" },
    { round: 1, move: "E" }, { round: 2, move: "W" },
  ];

  const byRound = new Map();
  for (const { round, move } of plays) {
    byRound.set(round, [move]);
  }
  console.log(byRound.get(1).join(""), byRound.get(2).join(""));
solution: |
  const plays = [
    { round: 1, move: "E" }, { round: 1, move: "S" }, { round: 2, move: "S" },
    { round: 1, move: "E" }, { round: 2, move: "W" },
  ];

  const byRound = new Map();
  for (const { round, move } of plays) {
    if (!byRound.has(round)) {
      byRound.set(round, []);
    }
    byRound.get(round).push(move);
  }
  console.log(byRound.get(1).join(""), byRound.get(2).join(""));
hints:
  - "`set(round, [move])` creates a new list on every pass and overwrites the previous one."
  - "Create the list only if the round isn't there yet (`has`), and then add with `push`."
tests:
  - name: prints both rounds complete
    output: ESE SW
  - name: round 1 has three moves
    expect: byRound.get(1).length === 3
```

```exercise
id: js16-escribe-racha
type: write
title: The best streak
prompt: |
  Write `bestStreak(points, k)`: the highest sum of `k` rounds **in a row**.

  `points` are Rocoto's points round by round; `k` goes from 1 to the length of the list. Use a sliding window: when you move it one cell, **add the round coming in and subtract the one going out**, instead of adding up all `k` again.
visual:
  figure:
    title: "bestStreak([3, 1, 4, 1, 5, 9, 2, 6], 3)"
    panes:
      - { label: "window 1: 3 + 1 + 4 = 8", cells: [3, 1, 4, 1, 5, 9, 2, 6], highlight: [0, 1, 2] }
      - { label: "window 2: 8 + 1 − 3 = 6", cells: [3, 1, 4, 1, 5, 9, 2, 6], highlight: [1, 2, 3] }
      - { label: "the best: 9 + 2 + 6 = 17", cells: [3, 1, 4, 1, 5, 9, 2, 6], highlight: [5, 6, 7] }
starter: |
  function bestStreak(points, k) {
  }

  console.log(bestStreak([3, 1, 4, 1, 5, 9, 2, 6], 3));
solution: |
  function bestStreak(points, k) {
    let window = 0;
    for (let i = 0; i < k; i++) {
      window += points[i];
    }
    let best = window;
    for (let i = k; i < points.length; i++) {
      window += points[i] - points[i - k];
      best = Math.max(best, window);
    }
    return best;
  }

  console.log(bestStreak([3, 1, 4, 1, 5, 9, 2, 6], 3));
hints:
  - Add up the first `k` to get the first window; for now it's also the best.
  - "Then, from `i = k`: the one coming in is `points[i]` and the one going out is `points[i - k]`."
tests:
  - name: the example gives 17
    run: bestStreak([3, 1, 4, 1, 5, 9, 2, 6], 3)
    equals: 17
  - name: with k = 1, the highest round
    run: bestStreak([2, 5, 1], 1)
    equals: 5
  - name: with k equal to the length, everything
    run: bestStreak([2, 5, 1], 3)
    equals: 8
  - name: the best streak is at the start
    run: bestStreak([7, 7, 0, 0, 1], 2)
    equals: 14
```

```exercise
id: js16-escribe-despues
type: write
title: What does it do next?
prompt: |
  Write `nextAfter(moves, m)`: the move Rocoto makes **most often right after** `m`.

  `moves` is a string like `"EESESEN"`. In a tie, the one that appeared first wins; if `m` is never followed by anything, return `null`.

  `nextAfter("EESESEN", "E")` → `"S"`: after each E came E, S, S and N.
visual:
  figure:
    input: { label: "moves", cells: ["E", "E", "S", "E", "S", "E", "N"], highlight: [1, 2, 4, 6] }
    arrow: "what comes right after each E"
    output: { label: "count → returns \"S\"", table: { head: ["after E", "times"], rows: [["E", "1"], ["S", "2"], ["N", "1"]] } }
starter: |
  function nextAfter(moves, m) {
  }

  console.log(nextAfter("EESESEN", "E"));
solution: |
  function nextAfter(moves, m) {
    const count = new Map();
    for (let i = 0; i + 1 < moves.length; i++) {
      if (moves[i] === m) {
        const following = moves[i + 1];
        count.set(following, (count.get(following) ?? 0) + 1);
      }
    }
    let best = null;
    for (const [move, times] of count) {
      if (best === null || times > count.get(best)) {
        best = move;
      }
    }
    return best;
  }

  console.log(nextAfter("EESESEN", "E"));
hints:
  - "Loop with an index up to the second to last: the one after `moves[i]` is `moves[i + 1]`."
  - "Count in a `Map` and keep the highest using a strict `>`: that way, in a tie, the first one in stays."
tests:
  - name: after E comes S
    run: nextAfter("EESESEN", "E")
    equals: S
  - name: a tie, the first wins
    run: nextAfter("ENES", "E")
    equals: N
  - name: an E at the end doesn't count
    run: nextAfter("SSE", "E")
    equals: null
  - name: a move that never shows up
    run: nextAfter("SSS", "N")
    equals: null
  - name: uses a Map
    source: 'new Map'
```

## The case

```exercise
id: js16-caso-espias
type: case
title: The spy who miscounted
prompt: |
  Work out how many **different** gates Rocoto used in each tournament and compare it with what that tournament's spy reported.

  Ms Yolanda sent five students to spy on Rocoto, one per tournament. Each came back with a single number: how many different gates Rocoto used there. One of them miscounted, and the team's strategy depends on those numbers. Who was it?

  Print one line per tournament, with the number at the end: `Tacna: 4`. The board compares it with what its spy reported.
visual:
  board:
    for: js16-caso-espias
    title: What each spy reported
    task: Group the plays by tournament, count each one's distinct gates and compare.
    cards:
      - { name: Fiorella, kind: person, role: "Spied in Tacna", rows: [["Reported", "4 different gates"]], clue: { find: "Tacna", says: 4 } }
      - { name: Brayan, kind: person, role: "Spied in Moquegua", rows: [["Reported", "3 different gates"]], clue: { find: "Moquegua", says: 3 } }
      - { name: Ximena, kind: person, role: "Spied in Puno", rows: [["Reported", "5 different gates"]], clue: { find: "Puno", says: 5 } }
      - { name: Edwin, kind: person, role: "Spied in Cusco", culprit: true, rows: [["Reported", "4 different gates"]], clue: { find: "Cusco", says: 4 } }
      - { name: Milagros, kind: person, role: "Spied in Ica", rows: [["Reported", "2 different gates"]], clue: { find: "Ica", says: 2 } }
    caption: "Careful: counting **plays** isn't counting **different gates**. If every card says **Doesn't match**, check what you're counting."
starter: |
  const plays = [
    { tournament: "Tacna", gate: 3 }, { tournament: "Puno", gate: 1 }, { tournament: "Cusco", gate: 7 },
    { tournament: "Ica", gate: 2 }, { tournament: "Tacna", gate: 5 }, { tournament: "Moquegua", gate: 4 },
    { tournament: "Cusco", gate: 2 }, { tournament: "Puno", gate: 6 }, { tournament: "Tacna", gate: 3 },
    { tournament: "Ica", gate: 2 }, { tournament: "Cusco", gate: 7 }, { tournament: "Moquegua", gate: 4 },
    { tournament: "Puno", gate: 1 }, { tournament: "Tacna", gate: 8 }, { tournament: "Cusco", gate: 9 },
    { tournament: "Ica", gate: 6 }, { tournament: "Moquegua", gate: 1 }, { tournament: "Puno", gate: 9 },
    { tournament: "Cusco", gate: 4 }, { tournament: "Tacna", gate: 5 }, { tournament: "Puno", gate: 3 },
    { tournament: "Moquegua", gate: 4 }, { tournament: "Cusco", gate: 2 }, { tournament: "Ica", gate: 2 },
    { tournament: "Tacna", gate: 1 }, { tournament: "Puno", gate: 6 }, { tournament: "Cusco", gate: 5 },
    { tournament: "Moquegua", gate: 8 }, { tournament: "Puno", gate: 4 }, { tournament: "Ica", gate: 6 },
    { tournament: "Cusco", gate: 9 }, { tournament: "Tacna", gate: 3 }, { tournament: "Moquegua", gate: 1 },
    { tournament: "Puno", gate: 1 }, { tournament: "Cusco", gate: 7 }, { tournament: "Ica", gate: 2 },
  ];

  // This is how you read a play:
  const { tournament, gate } = plays[0];
  console.log("First play:", tournament, "gate", gate);

  // TODO: group the gates by tournament in a Map (tournament → Set of gates)
  // TODO: print one line per tournament, like this: Tacna: 4
solution: |
  const plays = [
    { tournament: "Tacna", gate: 3 }, { tournament: "Puno", gate: 1 }, { tournament: "Cusco", gate: 7 },
    { tournament: "Ica", gate: 2 }, { tournament: "Tacna", gate: 5 }, { tournament: "Moquegua", gate: 4 },
    { tournament: "Cusco", gate: 2 }, { tournament: "Puno", gate: 6 }, { tournament: "Tacna", gate: 3 },
    { tournament: "Ica", gate: 2 }, { tournament: "Cusco", gate: 7 }, { tournament: "Moquegua", gate: 4 },
    { tournament: "Puno", gate: 1 }, { tournament: "Tacna", gate: 8 }, { tournament: "Cusco", gate: 9 },
    { tournament: "Ica", gate: 6 }, { tournament: "Moquegua", gate: 1 }, { tournament: "Puno", gate: 9 },
    { tournament: "Cusco", gate: 4 }, { tournament: "Tacna", gate: 5 }, { tournament: "Puno", gate: 3 },
    { tournament: "Moquegua", gate: 4 }, { tournament: "Cusco", gate: 2 }, { tournament: "Ica", gate: 2 },
    { tournament: "Tacna", gate: 1 }, { tournament: "Puno", gate: 6 }, { tournament: "Cusco", gate: 5 },
    { tournament: "Moquegua", gate: 8 }, { tournament: "Puno", gate: 4 }, { tournament: "Ica", gate: 6 },
    { tournament: "Cusco", gate: 9 }, { tournament: "Tacna", gate: 3 }, { tournament: "Moquegua", gate: 1 },
    { tournament: "Puno", gate: 1 }, { tournament: "Cusco", gate: 7 }, { tournament: "Ica", gate: 2 },
  ];

  const byTournament = new Map();
  for (const { tournament, gate } of plays) {
    if (!byTournament.has(tournament)) {
      byTournament.set(tournament, new Set());
    }
    byTournament.get(tournament).add(gate);
  }

  const spies = { Tacna: ["Fiorella", 4], Moquegua: ["Brayan", 3], Puno: ["Ximena", 5], Cusco: ["Edwin", 4], Ica: ["Milagros", 2] };
  for (const [tournament, gates] of byTournament) {
    const [spy, reported] = spies[tournament];
    const note = reported === gates.size ? "right" : `wrong: ${spy} reported ${reported}`;
    console.log(`${tournament} (${note}): ${gates.size}`);
  }
answer: Edwin
answerLabel: Which spy miscounted? (their name)
reveal: |
  Edwin. In Cusco, Rocoto played 9 rounds through gates 7, 2, 9, 4 and 5: **five** different ones, not four. He probably counted 7 and 2 and missed that 5 showed up only once, near the end. The others counted right: Tacna 3, 5, 8, 1; Moquegua 4, 1, 8; Puno 1, 6, 9, 3, 4; Ica 2, 6.
hints:
  - "A `Map` of `Set`s: the first time a tournament shows up, `set(tournament, new Set())`; after that, `get(tournament).add(gate)`."
  - "At the end, `for (const [tournament, gates] of byTournament)` and `gates.size`."
```

## The judge

```exercise
id: js16-juez-puerta
type: judge
mode: function
function: predictGate
title: Rocoto's next gate
prompt: |
  Return the gate (1 to 9) Rocoto will come in through next round, according to its history.

  In the final, every round Rocoto enters the pitch through one of nine gates, and Chasqui can only guard one. Ms Yolanda has a rule to predict it, and wants Chasqui to apply it on the fly with `predictGate(history, k)`:

  1. Take the **window**: the last `k` gates in the history.
  2. Find every time that same sequence of `k` gates appeared **earlier** and was followed by another gate. Count which gate came right after.
  3. Return the most counted. Tie: the **lowest number**.
  4. If the window never appeared earlier (or `k` is so big it doesn't fit), return the **most used** gate in the whole history. Tie: the lowest.

  **Constraints:** 1 ≤ history length ≤ 3000 · 1 ≤ k ≤ 6 · gates 1 to 9.
visual:
  figure:
    title: Example 1, drawn
    input: { label: "history, k = 2: the window is 3, 1", cells: [3, 1, 4, 3, 1, 5, 3, 1, 4, 2, 3, 1], highlight: [0, 1, 3, 4, 6, 7, 10, 11] }
    arrow: "what came after each earlier 3, 1?"
    output: { label: "returns 4", table: { head: ["3, 1 at position", "came after"], rows: [["0", "4"], ["3", "5"], ["6", "4"], ["10 (the window itself)", "nothing yet"]] } }
    steps:
      - "The window `3, 1` appeared three times before. After it came 4, 5 and 4."
      - "4 wins with 2 votes. The last occurrence is the window itself: it has no \"after\"."
starter: |
  function predictGate(history, k) {
    return history[history.length - 1];
  }
solution: |
  function mostCounted(count) {
    let best = null;
    for (const [gate, times] of count) {
      if (best === null || times > count.get(best) || (times === count.get(best) && gate < best)) {
        best = gate;
      }
    }
    return best;
  }

  function predictGate(history, k) {
    const n = history.length;
    const window = history.slice(-k).join(",");
    const following = new Map();
    for (let i = 0; i + k < n; i++) {
      if (history.slice(i, i + k).join(",") === window) {
        const next = history[i + k];
        following.set(next, (following.get(next) ?? 0) + 1);
      }
    }
    if (k < n && following.size > 0) {
      return mostCounted(following);
    }
    const total = new Map();
    for (const g of history) {
      total.set(g, (total.get(g) ?? 0) + 1);
    }
    return mostCounted(total);
  }
hints:
  - "Turn each window into a string with `join(\",\")`: then two equal windows compare with `===` and work as a key."
  - "The windows you compare start at `i` and end before `n`: the condition `i + k < n` leaves out the final window, which has no \"after\"."
samples:
  - args: [[3, 1, 4, 3, 1, 5, 3, 1, 4, 2, 3, 1], 2]
    returns: 4
    note: "After 3, 1 came 4, 5 and 4."
  - args: [[2, 7, 2, 7], 3]
    returns: 2
    note: "The window 7, 2, 7 never appeared before. Most used: 2 and 7 tie with 2 each; the lowest wins."
  - args: [[5], 1]
    returns: 5
    note: A single round.
edge:
  - args: [[1, 1, 1, 1], 2]
    tag: with overlapping windows
  - args: [[4, 9, 4, 6, 4], 1]
    tag: with a tie in what came after
  - args: [[8, 3, 8, 3], 6]
    tag: with k bigger than the history
  - args: [[6, 2, 9, 1], 1]
    tag: when the window never appeared
  - args: [[9, 9, 2, 9, 9, 2, 9, 9], 2]
    tag: when the most used isn't what gets predicted
random:
  count: 40
  seed: 16
  generate: |
    const pattern = rng.list(rng.int(2, 5), 1, 9);
    const n = rng.int(1, 3000);
    const history = [];
    for (let i = 0; i < n; i++) {
      history.push(rng.next() < 0.8 ? pattern[i % pattern.length] : rng.int(1, 9));
    }
    return [history, rng.int(1, 6)];
wrong:
  - |
    function predictGate(history, k) {
      const window = history.slice(-k).join(",");
      const following = new Map();
      for (let i = 0; i + k < history.length; i++) {
        if (history.slice(i, i + k).join(",") === window) {
          following.set(history[i + k], (following.get(history[i + k]) ?? 0) + 1);
        }
      }
      if (following.size === 0) return history[history.length - 1];
      let best = null;
      for (const [g, t] of following) if (best === null || t > following.get(best) || (t === following.get(best) && g < best)) best = g;
      return best;
    }
  - |
    function predictGate(history, k) {
      const window = history.slice(-k).join(",");
      const count = new Map();
      for (let i = 0; i + k < history.length; i++) {
        if (history.slice(i, i + k).join(",") === window) count.set(history[i + k], (count.get(history[i + k]) ?? 0) + 1);
      }
      if (count.size === 0) for (const g of history) count.set(g, (count.get(g) ?? 0) + 1);
      let best = null;
      for (const [g, t] of count) if (best === null || t > count.get(best)) best = g;
      return best;
    }
  - |
    function predictGate(history, k) {
      const window = history.slice(-k).join(",");
      const count = new Map();
      for (let i = 0; i + k <= history.length; i++) {
        if (history.slice(i, i + k).join(",") === window) count.set(history[i + k], (count.get(history[i + k]) ?? 0) + 1);
      }
      let best = null;
      for (const [g, t] of count) if (best === null || t > count.get(best) || (t === count.get(best) && g < best)) best = g;
      return best;
    }
  - |
    function predictGate(history, k) {
      const last = history[history.length - 1];
      const count = new Map();
      for (let i = 0; i + 1 < history.length; i++) {
        if (history[i] === last) count.set(history[i + 1], (count.get(history[i + 1]) ?? 0) + 1);
      }
      if (count.size === 0) for (const g of history) count.set(g, (count.get(g) ?? 0) + 1);
      let best = null;
      for (const [g, t] of count) if (best === null || t > count.get(best) || (t === count.get(best) && g < best)) best = g;
      return best;
    }
```

## Final mission

```exercise
id: js16-mision-rocoto
type: mission
title: Getting there before Rocoto
prompt: |
  Predict Rocoto's route from its history, mark it on the pitch, walk it and take the pennant where it ends.

  `rounds` holds Rocoto's past rounds, each a string of moves (`"N"`, `"E"`, `"S"`, `"W"`) from the corner where Chasqui stands. Rocoto is a creature of habit: **on each tile it makes the move it made most often on that tile**. Its predicted route ends on the tile where it never carried on.

  1. Walk each round from the start and count, **per tile**, how many times it made each move: a `Map` from tile (`"x,y"`) to another `Map` from move to times.
  2. From the start, follow each tile's most counted move until you reach a tile with no moves.
  3. `robot.mark(tiles)` paints the route, `robot.followPath(moves)` walks it and `robot.take()` picks up the pennant. It only has room for one.

  `step(pos, move)` gives you the neighbouring tile. There are no ties in the data. It's tested with three different histories.
visual:
  figure:
    title: What gets counted on one tile
    panes:
      - { label: "rounds", text: "\"SSSS\"\n\"EEESSSEEN\"\n\"EEESSSEES\"\n\"SSSS\"\n…" }
      - { label: "at the start (1,1)", table: { head: ["move", "times"], rows: [["S", "4"], ["E", "5"]] } }
      - { label: "predicted route", grid: ["#########", "#R......#", "#.##.##.#", "#....#a.#", "#.#.....#", "#b..#.c.#", "#########"], path: ["2,1", "3,1", "4,1", "4,2", "4,3", "4,4", "5,4", "6,4", "6,3"] }
starter: |
  const start = robot.position;
  const key = ({ x, y }) => `${x},${y}`;

  // This is how you walk the first round, tile by tile:
  let pos = start;
  for (const move of rounds[0]) {
    console.log(key(pos), "→", move);
    pos = step(pos, move);
  }

  // TODO: count the moves of every round, per tile
  // TODO: predict the route, mark it, walk it and take the pennant
solution: |
  const start = robot.position;
  const key = ({ x, y }) => `${x},${y}`;

  const movesByTile = new Map();
  for (const round of rounds) {
    let pos = start;
    for (const move of round) {
      const k = key(pos);
      if (!movesByTile.has(k)) {
        movesByTile.set(k, new Map());
      }
      const count = movesByTile.get(k);
      count.set(move, (count.get(move) ?? 0) + 1);
      pos = step(pos, move);
    }
  }

  const moves = [];
  const tiles = [];
  let pos = start;
  while (movesByTile.has(key(pos))) {
    let best = null;
    for (const [move, times] of movesByTile.get(key(pos))) {
      if (best === null || times > movesByTile.get(key(pos)).get(best)) {
        best = move;
      }
    }
    moves.push(best);
    pos = step(pos, best);
    tiles.push(pos);
  }

  robot.mark(tiles);
  robot.followPath(moves);
  robot.take();
hints:
  - "It's the grouping pattern with one Map inside another: create the tile's Map the first time (`has` / `set`) and count inside it with `get(move) ?? 0`."
  - "To predict: `while (movesByTile.has(key(pos)))`, pick the move with the most times, store it, move `pos` with `step` and store the tile."
world:
  theme: museo
  level: 4
  dir: E
  api: [move, path, cargo]
  capacity: 1
  items: { a: gold pennant, b: blue pennant, c: red pennant }
  map: |
    #########
    #R......#
    #.##.##.#
    #....#a.#
    #.#.....#
    #b..#.c.#
    #########
helpers:
  - name: step
    sig: "step(pos, move) → { x, y }"
    doc: "The tile next to pos in direction move (\"N\", \"E\", \"S\", \"W\")."
    code: "(pos, move) => ({ x: pos.x + ({ E: 1, W: -1 }[move] ?? 0), y: pos.y + ({ S: 1, N: -1 }[move] ?? 0) })"
  - name: rounds
    sig: "rounds: string[]"
    doc: Rocoto's past rounds, each a string of moves from the start.
globals:
  rounds: ["SSSS", "EEESSSEEN", "EEESSSEES", "SSSS", "EEESSSEEN", "SSSS", "EEESSSEEN", "EEESSSEES", "SSSS"]
scenarios:
  - tests:
      - name: marks the route to the gold pennant
        state: '["2,1", "3,1", "4,1", "4,2", "4,3", "4,4", "5,4", "6,4", "6,3"].every((k) => w.marks.includes(k)) && w.marks.every((k) => ["1,1", "2,1", "3,1", "4,1", "4,2", "4,3", "4,4", "5,4", "6,4", "6,3"].includes(k))'
        msg: The marked tiles aren't the predicted route. Careful, the most visited pennant (the blue one) isn't the one on the route.
      - name: takes the gold pennant
        state: 'w.inventory.length === 1 && w.inventory[0] === "gold pennant"'
  - globals:
      rounds: ["EEESSSEES", "EEESSSEEN", "SSSS", "EEESSSEES", "EEEEEESSW", "EEESSSEES", "SSSS", "EEESSSEEN"]
    tests:
      - name: marks the route to the red pennant
        state: '["2,1", "3,1", "4,1", "4,2", "4,3", "4,4", "5,4", "6,4", "6,5"].every((k) => w.marks.includes(k)) && w.marks.every((k) => ["1,1", "2,1", "3,1", "4,1", "4,2", "4,3", "4,4", "5,4", "6,4", "6,5"].includes(k))'
        msg: The marked tiles aren't the predicted route.
      - name: takes the red pennant
        state: 'w.inventory.length === 1 && w.inventory[0] === "red pennant"'
  - globals:
      rounds: ["EEESSSEEN", "SSSS", "EEESSSEES", "SSSS", "EEEEEESSW", "SSSS", "EEESSSEEN", "SSSS", "SSSS"]
    tests:
      - name: marks the route to the blue pennant
        state: '["1,2", "1,3", "1,4", "1,5"].every((k) => w.marks.includes(k)) && w.marks.every((k) => ["1,1", "1,2", "1,3", "1,4", "1,5"].includes(k))'
        msg: The marked tiles aren't the predicted route.
      - name: takes the blue pennant
        state: 'w.inventory.length === 1 && w.inventory[0] === "blue pennant"'
tests:
  - name: counts with a Map
    source: 'new Map'
  - name: no crash
    state: '!w.crashed'
```

## Expert challenge

```exercise
id: js16-reto-sinrepetir
type: challenge
title: The no-repeat streak
prompt: |
  Write `noRepeatStreak(gates)`: the length of the longest stretch **in a row** in which Rocoto didn't repeat a gate. With `[1, 2, 1, 3, 4, 2, 2]` it's 4 (`2, 1, 3, 4` or `1, 3, 4, 2`). Do it in a single pass: a window that grows on the right and, when a repeated gate comes in, jumps on the left. A `Map` of gate → last position where you saw it tells you where to jump.
starter: |
  function noRepeatStreak(gates) {
    return 0;
  }

  console.log(noRepeatStreak([1, 2, 1, 3, 4, 2, 2]));
solution: |
  function noRepeatStreak(gates) {
    const last = new Map();
    let start = 0;
    let best = 0;
    gates.forEach((g, i) => {
      if (last.has(g) && last.get(g) >= start) {
        start = last.get(g) + 1;
      }
      last.set(g, i);
      best = Math.max(best, i - start + 1);
    });
    return best;
  }

  console.log(noRepeatStreak([1, 2, 1, 3, 4, 2, 2]));
hints:
  - "If the gate is already **inside** the window (its last position is ≥ `start`), the window starts right after that position."
tests:
  - name: the example gives 4
    run: noRepeatStreak([1, 2, 1, 3, 4, 2, 2])
    equals: 4
  - name: no rounds, 0
    run: noRepeatStreak([])
    equals: 0
  - name: all the same, 1
    run: noRepeatStreak([5, 5, 5])
    equals: 1
  - name: all different
    run: noRepeatStreak([1, 2, 3, 4, 5, 6, 7, 8, 9])
    equals: 9
  - name: an old repeat doesn't cut the window
    run: noRepeatStreak([1, 2, 3, 1, 4, 5])
    equals: 5
  - name: it's fast with 100 000 rounds
    expect: '(() => { const l = Array.from({ length: 100000 }, (_, i) => (i * 7) % 9 + 1); return noRepeatStreak(l) === 9; })()'
```
