# Session 17 — Performance

## The job

Yerbateros bus terminal, 27 July, six in the morning. Half of Lima wants to leave for the provinces for the national holidays, and the Turismo Chaskiñan queue already goes round the block. Mrs Maruja, head of boarding, hired Chasqui for the platform gate: it reads each passenger's ticket, says whether it's valid and sends them to their platform.

The first passenger went through fine. The tenth, too. By passenger two hundred, Chasqui was taking two seconds to answer, and someone at the back started chanting "send the robot home!". The program wasn't wrong: it gave the right answer. It was **slow**. Today Chasqui learns to decide **in under 50 milliseconds**, even on a day with 30 000 tickets sold.

```scene
theme: barranco
level: 4
dir: E
caption: The Chaskiñan platforms. Chasqui reads the ticket at the gate (left), looks up its platform and walks the passenger down the corridor to the bay below.
map: |
  #############
  #R..........#
  ##.#.#.#.#.##
  #############
program: |
  robot.say("Ticket 240003: platform 3");
  robot.forward(5);
  robot.say("Platform 3, have a good trip!");
```

## The minimum

A correct program can be useless if it takes too long. What matters isn't how long it takes with 10 items, but **how its work grows** when the data grows. Count operations:

```js run
const queue = Array.from({ length: 1000 }, (_, i) => i);
let withTwoLoops = 0;
for (let i = 0; i < queue.length; i++) for (let j = 0; j < i; j++) withTwoLoops++;
let withSet = 0;
const seen = new Set();
for (const code of queue) { withSet++; seen.add(code); }
console.log(withTwoLoops, withSet);
```

With a thousand passengers, comparing each one with all the earlier ones is almost **half a million** steps; writing each one into a `Set`, a thousand. Watch how the double loop's steps pile up with just four tickets:

```anim
title: "A loop inside a loop: each ticket is compared with all the earlier ones"
code: |
  const queue = [7, 3, 7, 5];
  let ops = 0;
  let repeats = 0;
  for (let i = 0; i < queue.length; i++) {
    for (let j = 0; j < i; j++) {
      ops++;
      if (queue[j] === queue[i]) repeats++;
    }
  }
  console.log(ops, repeats);
cells: { of: queue, at: i }
show: [i, j, ops, repeats]
notes:
  4: "A new ticket arrives: the i-th one."
  6: "One more comparison with an earlier ticket."
  10: "4 tickets, 6 comparisons. With 30 000 it would be 450 million."
```

```figure
title: How the work grows
panes:
  - table:
      head: ["passengers", "one loop", "double loop"]
      rows:
        - ["1 000", "1 000", "500 000 · 5 ms"]
        - ["10 000", "10 000", "50 million · 0.5 s"]
        - ["30 000", "30 000", "450 million · 4.5 s"]
caption: Steps of work, and the time at about 100 million steps per second. With twice the data, one loop does twice the work; a double loop, **four times**. At 4.5 s per turn, the queue riots.
```

- **One loop over n items** grows like n. A loop inside another grows like **n × n**: doubling the data quadruples the time.
- **Hidden loops**: `includes`, `indexOf`, `find`, `filter`, `some`, `slice`, `[...list]` and `new Set(list)` walk the list. Inside a loop, they're a loop inside a loop.
- **`Set.has` and `Map.get`** find a key almost regardless of how many there are. Build the `Set` or `Map` **once**, outside the loop, and ask it as often as you like.
- **Exit early**: if you already have the answer, `return` or `break`. `some` and `find` stop by themselves at the first match.
- **Measure**: `performance.now()` gives the current milliseconds, with decimals. Subtract two readings to know how long something took:

```js
const start = performance.now();
const platform = platformOf(240003);
const took = performance.now() - start;
if (took > 50) console.log(`Too slow! ${took.toFixed(1)} ms`);
```

Measure before you optimise: often the slow part isn't where you think. And don't chase microseconds: swapping a double loop for a `Set` wins far more than any trick.

> **Common trap:** `list.includes(x)` inside a `for` looks like an innocent line, but it's a loop inside a loop. With 30 000 tickets that's hundreds of millions of comparisons. Turn it into `const set = new Set(list)` **before** the loop and use `set.has(x)`.

<!-- legacy: performance-now -->

<!-- mdn: set-vs-object map-vs-object performance-now -->

## Practice

```exercise
id: js17-predice-pares
type: predict
title: How many comparisons
prompt: |
  What does it print?
code: |
  let all = 0;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) all++;
  }
  let pairs = 0;
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) pairs++;
  }
  console.log(all, pairs);
options:
  - "16 6"
  - "8 4"
  - "16 16"
  - "16 8"
answer: "16 6"
explain: |
  The first does 4 × 4 = 16. The second compares each pair only once: 3 + 2 + 1 + 0 = 6, which is 4 × 3 / 2. Half, but it still grows like n × n.
```

```exercise
id: js17-predice-some
type: predict
title: The one that stops in time
prompt: |
  Chasqui looks for ticket 2 in the queue and counts how many it looked at. What does it print?
code: |
  const queue = [5, 8, 2, 9, 4, 2];
  let looked = 0;
  const found = queue.some((code) => {
    looked++;
    return code === 2;
  });
  console.log(found, looked);
options:
  - "true 3"
  - "true 6"
  - "true 2"
  - "false 6"
answer: "true 3"
explain: |
  `some` stops as soon as the function returns `true`: it looked at 5, 8 and 2, and went no further. `filter` or `forEach` would have looked at all six.
```

```exercise
id: js17-completa-set
type: complete
title: From the notebook to a Set
prompt: |
  `isValid(code)` says whether a ticket was sold. 30 000 were sold today (`soldTickets()` gives them to you), and the gate has to check 30 000 scans in **under 50 ms in total**. Build a `Set` once and ask it.
visual:
  figure:
    input: { label: "sold (30 000)", cells: [100004, 100013, 100015, "…", 309993] }
    arrow: "new Set(sold), just once"
    output: { label: "isValid(100013)", value: "true, instantly" }
starter: |
  const sold = soldTickets();
  const soldSet = new ___(sold);

  function isValid(code) {
    return soldSet.___(code);
  }

  console.log(isValid(sold[0]), isValid(42));
solution: |
  const sold = soldTickets();
  const soldSet = new Set(sold);

  function isValid(code) {
    return soldSet.has(code);
  }

  console.log(isValid(sold[0]), isValid(42));
hints:
  - "`new Set(list)` builds the set; `.has(x)` asks whether it's there."
helpers:
  - name: soldTickets
    sig: "soldTickets() → number[]"
    doc: The 30 000 ticket codes sold today.
    code: "() => { const list = []; let x = 2026; for (let i = 0; i < 30000; i++) { x = (x * 48271) % 2147483647; list.push(100000 + i * 7 + (x % 7)); } return list; }"
tests:
  - name: a sold ticket is valid
    expect: isValid(sold[123]) === true
  - name: a made-up code isn't
    expect: isValid(100001) === false
  - name: 30 000 scans in under 50 ms
    expect: '(() => { const t0 = performance.now(); for (const c of sold) isValid(c + 1); return performance.now() - t0 < 50; })()'
    msg: Checking the 30 000 scans took more than 50 ms.
```

```exercise
id: js17-arregla-adentro
type: fix
title: The Set that was rebuilt every time
prompt: |
  Now `isValid` uses a `Set`, but it's still slow: 300 lookups take far more than 50 ms. The answers are right. Where does the time go? Fix it.
starter: |
  const sold = soldTickets();

  function isValid(code) {
    const soldSet = new Set(sold);
    return soldSet.has(code);
  }

  console.log(isValid(sold[0]), isValid(42));
solution: |
  const sold = soldTickets();
  const soldSet = new Set(sold);

  function isValid(code) {
    return soldSet.has(code);
  }

  console.log(isValid(sold[0]), isValid(42));
hints:
  - "`new Set(sold)` walks all 30 000 tickets. How many times does that line run?"
  - Move it out of the function, so it's built only once.
helpers:
  - name: soldTickets
    sig: "soldTickets() → number[]"
    doc: The 30 000 ticket codes sold today.
    code: "() => { const list = []; let x = 2026; for (let i = 0; i < 30000; i++) { x = (x * 48271) % 2147483647; list.push(100000 + i * 7 + (x % 7)); } return list; }"
tests:
  - name: still answers correctly
    expect: isValid(sold[500]) === true && isValid(100001) === false
  - name: 300 lookups in under 50 ms
    expect: '(() => { const t0 = performance.now(); for (let i = 0; i < 300; i++) isValid(sold[i] + 1); return performance.now() - t0 < 50; })()'
    msg: The 300 lookups took more than 50 ms. What gets done again on every call?
```

```exercise
id: js17-escribe-repetido
type: write
title: The first cloned ticket
prompt: |
  Write `firstClone(queue)`: the first code that shows up **for the second time** in the queue of scans, or `null` if none repeats.

  Stop as soon as you find it: no need to look at the rest of the queue. With 20 000 scans it must answer in under 50 ms.

  `firstClone([4, 8, 1, 8, 4])` → `8`: 8 repeats at position 3, before 4 does.
visual:
  figure:
    input: { label: queue, cells: [4, 8, 1, 8, 4], highlight: [3] }
    arrow: "a Set of what I've seen; I stop at the first one already in it"
    output: { label: returns, value: "8" }
starter: |
  function firstClone(queue) {
  }

  console.log(firstClone([4, 8, 1, 8, 4]));
solution: |
  function firstClone(queue) {
    const seen = new Set();
    for (const code of queue) {
      if (seen.has(code)) {
        return code;
      }
      seen.add(code);
    }
    return null;
  }

  console.log(firstClone([4, 8, 1, 8, 4]));
hints:
  - "Walk the queue keeping what already went through in a `Set`. If the code is already in the `Set`, that's the one."
  - "`return` inside the loop leaves the function right there. If the loop finishes, there were no clones: `null`."
tests:
  - name: the example gives 8
    run: firstClone([4, 8, 1, 8, 4])
    equals: 8
  - name: no repeats, null
    run: firstClone([1, 2, 3])
    equals: null
  - name: empty queue, null
    run: firstClone([])
    equals: null
  - name: two in a row
    run: firstClone([6, 6])
    equals: 6
  - name: 20 000 scans in under 50 ms
    expect: '(() => { const queue = Array.from({ length: 20000 }, (_, i) => 100000 + i); queue.push(119999); const t0 = performance.now(); const r = firstClone(queue); return r === 119999 && performance.now() - t0 < 50; })()'
    msg: With 20 000 scans it took more than 50 ms (or didn't find the clone at the end). Is there a hidden loop, like includes, inside the for?
```

```exercise
id: js17-escribe-cronometro
type: write
title: The gate's stopwatch
prompt: |
  Write `timeIt(task)`: it runs the function `task` and returns **how many milliseconds it took**, measured with `performance.now()`.

  Then write `fits(task, budget)`, which returns `true` if the task took at most `budget` milliseconds. Use it to warn when one of Chasqui's decisions goes over 50 ms.
visual:
  figure:
    input: { label: "timeIt(task)", table: { head: ["step", "value"], rows: [["start = performance.now()", "1200.0"], ["task()", "…"], ["end = performance.now()", "1230.4"]] } }
    arrow: end − start
    output: { label: returns, value: "30.4" }
starter: |
  function timeIt(task) {
  }

  function fits(task, budget) {
  }

  console.log(fits(() => {}, 50));
solution: |
  function timeIt(task) {
    const start = performance.now();
    task();
    return performance.now() - start;
  }

  function fits(task, budget) {
    return timeIt(task) <= budget;
  }

  console.log(fits(() => {}, 50));
hints:
  - "Read `performance.now()` before and after calling `task()`, and return the difference."
  - "`fits` can use `timeIt`: compare what it returns with the budget."
tests:
  - name: timeIt returns a number
    expect: typeof timeIt(() => {}) === "number"
  - name: a 30 ms task measures at least 30
    expect: 'timeIt(() => { const t = performance.now(); while (performance.now() - t < 30) {} }) >= 30'
  - name: an empty task fits in 50 ms
    expect: fits(() => {}, 50) === true
  - name: a 30 ms task doesn't fit in 5
    expect: 'fits(() => { const t = performance.now(); while (performance.now() - t < 30) {} }, 5) === false'
  - name: timeIt runs the task
    expect: '(() => { let runs = 0; timeIt(() => { runs++; }); return runs === 1; })()'
```

## The case

```exercise
id: js17-caso-rutinas
type: case
title: The routine that can't handle the queue
prompt: |
  Count how many operations each routine does with 1000 and with 2000 passengers, and work out the factor: how many times more work it did with twice the people.

  Four vendors offered Mrs Maruja a routine to catch cloned tickets. All four swear the same thing: "with twice the passengers, my routine does twice the work". With 30 000 passengers, whoever is lying will freeze the queue. Loop already fitted all four with an `ops` counter. Which vendor lied?

  Print one line per routine with the rounded factor at the end: `Saeta: factor 2`. The board compares it with what they promised.
visual:
  board:
    for: js17-caso-rutinas
    title: What each vendor promised
    task: "They all promise factor 2: twice the passengers, twice the work. Measure ops with 1000 and with 2000; the factor is ops(2000) / ops(1000)."
    cards:
      - { name: Saeta, kind: robot, rows: [["Promises", "factor 2"]], clue: { find: "Saeta", says: 2, saysLabel: "Promised" } }
      - { name: Relámpago, kind: robot, rows: [["Promises", "factor 2"]], clue: { find: "Relámpago", says: 2, saysLabel: "Promised" } }
      - { name: Zumbido, kind: robot, culprit: true, rows: [["Promises", "factor 2"]], clue: { find: "Zumbido", says: 2, saysLabel: "Promised" } }
      - { name: Pique, kind: robot, rows: [["Promises", "factor 2"]], clue: { find: "Pique", says: 2, saysLabel: "Promised" } }
    caption: "Factor 2: the work grows like the queue. Factor 4: it grows like n × n, and with 30 000 passengers that's a disaster."
starter: |
  let ops = 0;

  // n passengers with different codes
  const queueOf = (n) => Array.from({ length: n }, (_, i) => 500000 + ((i * 7919) % 1000003));

  function alreadyPassed(queue, i) {
    for (let j = 0; j < i; j++) {
      ops++;
      if (queue[j] === queue[i]) return true;
    }
    return false;
  }

  // Each routine returns how many cloned tickets there are in the queue.
  const routines = {
    "Saeta": (queue) => {
      const seen = new Set();
      let clones = 0;
      for (const code of queue) {
        ops++;
        if (seen.has(code)) clones++;
        else seen.add(code);
      }
      return clones;
    },
    "Relámpago": (queue) => {
      const times = new Map();
      for (const code of queue) {
        ops++;
        times.set(code, (times.get(code) ?? 0) + 1);
      }
      let clones = 0;
      for (const t of times.values()) {
        ops++;
        clones += t - 1;
      }
      return clones;
    },
    "Zumbido": (queue) => {
      let clones = 0;
      for (let i = 0; i < queue.length; i++) {
        if (alreadyPassed(queue, i)) clones++;
      }
      return clones;
    },
    "Pique": (queue) => {
      const seen = {};
      let clones = 0;
      for (const code of queue) {
        ops += 2;
        if (seen[code]) clones++;
        seen[code] = true;
      }
      return clones;
    },
  };

  // This is how you measure a routine: set ops to 0, run it and read ops.
  ops = 0;
  routines["Saeta"](queueOf(5));
  console.log("Saeta with 5 passengers:", ops, "operations");

  // TODO: for each routine, measure ops with queueOf(1000) and with queueOf(2000)
  // and print: Saeta: factor 2   (ops with 2000 / ops with 1000, rounded)
solution: |
  let ops = 0;

  const queueOf = (n) => Array.from({ length: n }, (_, i) => 500000 + ((i * 7919) % 1000003));

  function alreadyPassed(queue, i) {
    for (let j = 0; j < i; j++) {
      ops++;
      if (queue[j] === queue[i]) return true;
    }
    return false;
  }

  const routines = {
    "Saeta": (queue) => {
      const seen = new Set();
      let clones = 0;
      for (const code of queue) {
        ops++;
        if (seen.has(code)) clones++;
        else seen.add(code);
      }
      return clones;
    },
    "Relámpago": (queue) => {
      const times = new Map();
      for (const code of queue) {
        ops++;
        times.set(code, (times.get(code) ?? 0) + 1);
      }
      let clones = 0;
      for (const t of times.values()) {
        ops++;
        clones += t - 1;
      }
      return clones;
    },
    "Zumbido": (queue) => {
      let clones = 0;
      for (let i = 0; i < queue.length; i++) {
        if (alreadyPassed(queue, i)) clones++;
      }
      return clones;
    },
    "Pique": (queue) => {
      const seen = {};
      let clones = 0;
      for (const code of queue) {
        ops += 2;
        if (seen[code]) clones++;
        seen[code] = true;
      }
      return clones;
    },
  };

  function measure(routine, n) {
    ops = 0;
    routine(queueOf(n));
    return ops;
  }

  for (const [name, routine] of Object.entries(routines)) {
    const small = measure(routine, 1000);
    const big = measure(routine, 2000);
    console.log(`${name}: ${small} → ${big} ops, factor ${Math.round(big / small)}`);
  }
answer: Zumbido
answerLabel: Which vendor lied? (their name)
reveal: |
  Zumbido. With 1000 passengers it does 499 500 operations and with 2000, 1 999 000: factor 4. It has a single `for` in sight, but it calls `alreadyPassed`, which walks all the earlier ones: a loop inside a loop, hidden in a function. Pique does twice as many operations as Saeta and still keeps its promise: what matters is how it grows, not the exact number.
hints:
  - "Write `measure(routine, n)`: it sets `ops = 0`, calls `routine(queueOf(n))` and returns `ops`."
  - "Go through the routines with `for (const [name, routine] of Object.entries(routines))` and divide the 2000 figure by the 1000 one."
```

## The judge

This judge times you: each call gets **50 ms**. Go over it and the verdict is *Time limit exceeded*, even if the answer is right.

```exercise
id: js17-juez-embarque
type: judge
mode: function
function: validateBoarding
limit: 50
title: The rush-hour turnstile
prompt: |
  Return `[accepted, repeated, fake]`: how many scans were let through, how many were a ticket that had already gone through, and how many were a ticket that was never sold.

  `validateBoarding(sold, scans)` gets the sold codes (all different) and the gate's scans, in order. Each scan is one of three:

  - **fake**: its code isn't in `sold`;
  - **repeated**: it was sold, but that ticket was already accepted earlier;
  - **accepted**: it was sold and it's the first time it goes through.

  **Constraints:** up to 60 000 sold and 60 000 scans · **50 ms per call**. The last hidden case is rush hour, with 60 000 and 60 000.
visual:
  figure:
    title: Example 1, scan by scan
    input: { label: "sold: 11, 25, 30, 47", table: { head: ["scan", "sold / already in", "verdict"], rows: [["11", "yes / no", "accepted"], ["99", "no", "fake"], ["25", "yes / no", "accepted"], ["11", "yes / yes", "repeated"], ["47", "yes / no", "accepted"], ["99", "no", "fake"]] } }
    arrow: count each verdict
    output: { label: returns, value: "[3, 1, 2]" }
    steps:
      - "99 was never sold: it's fake both times (a fake is never \"repeated\")."
      - "The second 11 had already gone through: repeated."
starter: |
  function validateBoarding(sold, scans) {
    return [0, 0, 0];
  }
solution: |
  function validateBoarding(sold, scans) {
    const soldSet = new Set(sold);
    const passed = new Set();
    let accepted = 0;
    let repeated = 0;
    let fake = 0;
    for (const code of scans) {
      if (!soldSet.has(code)) {
        fake++;
      } else if (passed.has(code)) {
        repeated++;
      } else {
        passed.add(code);
        accepted++;
      }
    }
    return [accepted, repeated, fake];
  }
hints:
  - "Two `Set`s: one with the sold tickets, built once, and another with the ones that already went through."
  - "Ask first whether it's fake; only a sold ticket can be repeated."
samples:
  - args: [[11, 25, 30, 47], [11, 99, 25, 11, 47, 99]]
    returns: [3, 1, 2]
    note: 99 is fake both times; the second 11 is repeated.
  - args: [[5], []]
    returns: [0, 0, 0]
    note: Nobody has gone through yet.
edge:
  - args: [[], [1, 2, 1]]
    tag: with no tickets sold
  - args: [[7, 8], [7, 7, 7, 8, 8]]
    tag: with the same ticket scanned many times
  - args: [[10, 20, 30], [30, 20, 10]]
    tag: with every ticket going through once
random:
  count: 20
  seed: 17
  generate: |
    // The last case is rush hour: 60 000 sold and 60 000 scans.
    rng.calls = (rng.calls ?? 0) + 1;
    const big = rng.calls === 20;
    const n = big ? 60000 : rng.int(1, 300);
    const m = big ? 60000 : rng.int(0, 300);
    const sold = [];
    let code = rng.int(10000, 10100);
    for (let i = 0; i < n; i++) {
      code += rng.int(1, 3);
      sold.push(code);
    }
    for (let i = n - 1; i > 0; i--) {
      const j = rng.int(0, i);
      [sold[i], sold[j]] = [sold[j], sold[i]];
    }
    const scans = [];
    for (let i = 0; i < m; i++) {
      const r = rng.next();
      if (r < 0.1) scans.push(rng.int(10000, code + 10));
      else if (r < 0.2 && scans.length) scans.push(rng.pick(scans));
      else scans.push(sold[i % n]);
    }
    return [sold, scans];
wrong:
  - |
    function validateBoarding(sold, scans) {
      const passed = [];
      let accepted = 0, repeated = 0, fake = 0;
      for (const code of scans) {
        if (!sold.includes(code)) fake++;
        else if (passed.includes(code)) repeated++;
        else { passed.push(code); accepted++; }
      }
      return [accepted, repeated, fake];
    }
  - |
    function validateBoarding(sold, scans) {
      const soldSet = new Set(sold);
      const passed = [];
      let accepted = 0, repeated = 0, fake = 0;
      for (const code of scans) {
        if (!soldSet.has(code)) fake++;
        else if (passed.includes(code)) repeated++;
        else { passed.push(code); accepted++; }
      }
      return [accepted, repeated, fake];
    }
  - |
    function validateBoarding(sold, scans) {
      const soldSet = new Set(sold);
      const seen = new Set();
      let accepted = 0, repeated = 0, fake = 0;
      for (const code of scans) {
        if (seen.has(code)) repeated++;
        else if (!soldSet.has(code)) fake++;
        else accepted++;
        seen.add(code);
      }
      return [accepted, repeated, fake];
    }
```

## Final mission

```exercise
id: js17-mision-andenes
type: mission
title: Rush hour at Yerbateros
prompt: |
  Write `platformOf(code)`, which tells a ticket's platform in an instant, and take each passenger in `passengers` to their platform.

  `ticketsOfTheDay()` returns the day's 30 000 tickets, each `{ code, platform }`, and `passengers` is the line of codes waiting at the gate. For each passenger, in order:

  1. look up their platform with `platformOf(code)`;
  2. walk down the corridor to the platform's bay: platform `n` is below column `x = 2 × n`;
  3. `robot.mark({ x: 2 * platform, y: 2 })` and `robot.say(`Platform ${platform}`)`.

  On top of that, every turn a wave of **3000 passengers** arrives: `platformOf` has to serve them all in **under 50 ms**. The `find` in the starter is right, but takes half a second. It's tested with three different lines.
visual:
  figure:
    title: From ticket to platform
    panes:
      - { label: "ticketsOfTheDay() (30 000)", cards: [{ title: "{ code, platform }", rows: [["240003", "3"], ["249148", "1"], ["…", "…"]] }] }
      - { label: "platform n → column 2 × n", grid: ["#############", "#R..........#", "##.#.#.#.#.##", "#############"], marks: ["6,2"] }
      - { label: "budget", table: { head: ["wave", "limit"], rows: [["3000 passengers", "50 ms in total"]] } }
starter: |
  const tickets = ticketsOfTheDay();

  // Works, but walks all 30 000 tickets on every lookup.
  function platformOf(code) {
    return tickets.find((t) => t.code === code).platform;
  }

  function walkTo(x) {
    const steps = x - robot.position.x;
    robot.followPath(Array(Math.abs(steps)).fill(steps > 0 ? "E" : "W"));
  }

  // TODO: make platformOf instant
  // TODO: take each passenger to their platform, mark it and announce it
solution: |
  const tickets = ticketsOfTheDay();
  const platforms = new Map();
  for (const { code, platform } of tickets) {
    platforms.set(code, platform);
  }

  function platformOf(code) {
    return platforms.get(code);
  }

  function walkTo(x) {
    const steps = x - robot.position.x;
    robot.followPath(Array(Math.abs(steps)).fill(steps > 0 ? "E" : "W"));
  }

  for (const code of passengers) {
    const platform = platformOf(code);
    walkTo(2 * platform);
    robot.mark({ x: 2 * platform, y: 2 });
    robot.say(`Platform ${platform}`);
  }
hints:
  - "Build a `Map` of code → platform **once**, outside the function; `platformOf` just does `get`."
  - "For the passengers: `for (const code of passengers)`, and inside it `walkTo(2 * platform)`, `mark` and `say`."
world:
  theme: barranco
  level: 4
  dir: E
  api: [move, path]
  map: |
    #############
    #R..........#
    ##.#.#.#.#.##
    #############
helpers:
  - name: ticketsOfTheDay
    sig: "ticketsOfTheDay() → { code, platform }[]"
    doc: The day's 30 000 tickets, each with its code and its platform (1 to 5).
    code: "() => { const list = []; let x = 2026; for (let i = 0; i < 30000; i++) { x = (x * 48271) % 2147483647; list.push({ code: 100000 + i * 7 + (x % 7), platform: 1 + (x % 5) }); } return list; }"
  - name: rushWave
    sig: "rushWave() → number[]"
    doc: The 3000 codes of a rush-hour wave, to time platformOf.
    code: "() => { const codes = []; let x = 2026; for (let i = 0; i < 30000; i++) { x = (x * 48271) % 2147483647; codes.push(100000 + i * 7 + (x % 7)); } const wave = []; let y = 7; for (let i = 0; i < 3000; i++) { y = (y * 48271) % 2147483647; wave.push(codes[y % 30000]); } return wave; }"
  - name: passengers
    sig: "passengers: number[]"
    doc: The codes of the passengers waiting at the gate, in order.
globals:
  passengers: [240003, 249148, 258252, 267399]
scenarios:
  - tests:
      - name: announces platforms 3, 1, 5 and 2, in order
        state: 'w.said.join(" | ") === "Platform 3 | Platform 1 | Platform 5 | Platform 2"'
      - name: marks those four bays
        state: 'w.marks.length === 4 && ["6,2", "2,2", "10,2", "4,2"].every((k) => w.marks.includes(k))'
      - name: serves a wave of 3000 in under 50 ms
        expect: '(() => { const wave = rushWave(); const t0 = performance.now(); for (const c of wave) platformOf(c); return performance.now() - t0 < 50; })()'
        msg: The wave of 3000 passengers took more than 50 ms. Does platformOf walk the list on every lookup?
  - globals:
      passengers: [177020, 186131]
    tests:
      - name: announces platforms 4 and 2
        state: 'w.said.join(" | ") === "Platform 4 | Platform 2"'
      - name: marks those two bays
        state: 'w.marks.length === 2 && ["8,2", "4,2"].every((k) => w.marks.includes(k))'
  - globals:
      passengers: [121018, 130126, 139244, 148396, 157502]
    tests:
      - name: announces platforms 2, 5, 1, 4 and 3
        state: 'w.said.join(" | ") === "Platform 2 | Platform 5 | Platform 1 | Platform 4 | Platform 3"'
      - name: marks those five bays
        state: 'w.marks.length === 5 && ["4,2", "10,2", "2,2", "8,2", "6,2"].every((k) => w.marks.includes(k))'
tests:
  - name: platformOf gives a ticket's platform
    expect: platformOf(240003) === 3
  - name: uses a Map or a Set
    source: 'new (Map|Set)\b'
  - name: no crash
    state: '!w.crashed'
```

## Expert challenge

```exercise
id: js17-reto-parejas
type: challenge
title: Double seats
prompt: |
  The sleeper bus has double seats, and Mrs Maruja pairs up passengers whose suitcases weigh **exactly** `hold` kilos between them. Write `pairs(weights, hold)`: how many pairs `i < j` satisfy `weights[i] + weights[j] === hold`. With 50 000 passengers it has to answer in under 50 ms: no double loop. Hint: when each suitcase arrives, how many of the earlier ones complete it?
starter: |
  function pairs(weights, hold) {
    let total = 0;
    for (let i = 0; i < weights.length; i++) {
      for (let j = i + 1; j < weights.length; j++) {
        if (weights[i] + weights[j] === hold) total++;
      }
    }
    return total;
  }

  console.log(pairs([10, 20, 10, 20, 15, 15], 30));
solution: |
  function pairs(weights, hold) {
    const seen = new Map();
    let total = 0;
    for (const weight of weights) {
      total += seen.get(hold - weight) ?? 0;
      seen.set(weight, (seen.get(weight) ?? 0) + 1);
    }
    return total;
  }

  console.log(pairs([10, 20, 10, 20, 15, 15], 30));
hints:
  - "Keep a `Map` of weight → how many suitcases of that weight already went by. The new suitcase pairs with all the ones that weigh `hold - weight`."
tests:
  - name: the example gives 5
    run: pairs([10, 20, 10, 20, 15, 15], 30)
    equals: 5
  - name: no passengers, 0
    run: pairs([], 30)
    equals: 0
  - name: a lone suitcase doesn't pair with itself
    run: pairs([15], 30)
    equals: 0
  - name: 50 000 passengers in under 50 ms
    expect: '(() => { const p = Array.from({ length: 50000 }, (_, i) => (i * 37) % 41); const t0 = performance.now(); const r = pairs(p, 40); return r > 0 && performance.now() - t0 < 50; })()'
    msg: With 50 000 passengers it took more than 50 ms. Is there still a loop inside a loop?
```
