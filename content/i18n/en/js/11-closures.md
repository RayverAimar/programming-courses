# Session 11 — Closures and state

## The job

Machu Picchu, twenty to six in the morning. Mist rises from the Urubamba river and swallows the terraces; from one terrace you can't see the one below. Yeny Huillca, a ranger at the sanctuary, has a problem with an animal's name on it: the vet is coming up today to deworm the llamas, and will bring **exactly** as many doses as llamas get reported.

Last year a robot from another company did the count. It reported 47 llamas. Twelve live at Machu Picchu. The robot saw a llama, took a step, saw it again through the mist and counted it again. Today Chasqui has to **remember what it has already seen** from one turn to the next, and that memory has to be its own, not something anyone passing through the code can touch.

```scene
theme: museo
level: 4
dir: E
fog: true
vision: 1
items: { l: llama }
caption: The terraces in the mist. Chasqui only sees one tile around itself; each **l** is a llama, and it sees each one several times while walking past.
map: |
  ###########
  #R........#
  #...l.l...#
  #######...#
  #.........#
  #.l.......#
  ###########
program: |
  robot.forward(8);
  robot.turnRight();
  robot.forward(3);
  robot.turnRight();
  robot.forward(8);
```

## The minimum

A variable lives in the `{ }` block where it was declared: that's its **scope**. Code inside sees the variables outside; code outside doesn't see the ones inside. Think of rooms: each block is a room, and from one you can look out into the rooms around it, never into the ones inside it.

```scope
title: Every block is a room
rooms:
  - id: g
    name: global
    vars: { rate: 4 }
    rooms:
      - id: f
        name: "inside the function"
        vars: { km: 3 }
        up: "If a name is missing, it looks in the room outside: global."
note: "From inside you read `rate`, which lives outside. From global, `km` doesn't exist: its room belongs to the function only."
```

A function created inside another one takes with it the variables of the place where it was born, and keeps using them even after that other function has finished. That backpack of variables is called a **closure**. It gives a function **memory between calls**:

```js run
function makeCounter() {
  let count = 0;
  return () => {
    count++;
    return count;
  };
}

const countLlamas = makeCounter();
countLlamas();
console.log(countLlamas());
console.log(makeCounter()());
```

`makeCounter` is a **factory**: each time you call it, a new `count` is born, along with a function that is the only one able to touch it. Watch the animation, and below it the same movie drawing **where everything lives**.

```anim
title: Each factory hands out its own memory
code: |
  function makeCounter() {
    let count = 0;
    function add() {
      count++;
      return count;
    }
    return add;
  }
  const tally = makeCounter();
  console.log(tally());
  console.log(tally());
  const other = makeCounter();
  console.log(other());
show: [count]
notes:
  2: "A new count is born, at 0."
  9: "makeCounter has finished, but add took its count along."
  4: "add changes the count it was born with."
  12: "Another factory, another count: it starts at 0."
```

```scope
title: Each call to the factory opens its own room
speed: 3600
steps:
  - note: "At the start only the `global` room exists. It holds the factory `makeCounter`: the recipe, with no `count` yet."
    rooms:
      - { id: g, name: global, fns: [{ name: makeCounter }] }
  - note: "`const tally = makeCounter()` opens a new room for this call. `count = 0` is born there."
    rooms:
      - id: g
        name: global
        fns: [{ name: makeCounter }]
        rooms:
          - { id: c1, name: "makeCounter(), call 1", on: true, vars: { count: 0 } }
  - note: "`add` is born inside. It keeps a rope tied to the room where it was born (the arrow): its `count` is there."
    rooms:
      - id: g
        name: global
        fns: [{ name: makeCounter }]
        rooms:
          - { id: c1, name: "makeCounter(), call 1", on: true, vars: { count: 0 }, fns: [{ name: add, env: c1 }] }
  - note: "The factory returns `add` and it's kept as `tally`. The call has finished, but `tally`'s rope keeps its room alive with its `count`. Without that rope the room would have been discarded."
    rooms:
      - id: g
        name: global
        fns: [{ name: makeCounter }, { name: tally, env: c1 }]
        rooms:
          - { id: c1, name: "makeCounter(), call 1", gone: true, vars: { count: 0 } }
  - note: "Each `tally()` raises the `count` of its room, even though the call to the factory has already finished. After two calls it's 2."
    rooms:
      - id: g
        name: global
        fns: [{ name: makeCounter }, { name: tally, env: c1 }]
        rooms:
          - { id: c1, name: "makeCounter(), call 1", gone: true, on: true, vars: { count: 2 } }
  - note: "`const other = makeCounter()` opens **another** room, with another `count` and another function. `other()` raises its own to 1; `tally`'s stays at 2. They share nothing."
    rooms:
      - id: g
        name: global
        fns: [{ name: makeCounter }, { name: tally, env: c1 }, { name: other, env: c2 }]
        rooms:
          - { id: c1, name: "makeCounter(), call 1", gone: true, vars: { count: 2 } }
          - { id: c2, name: "makeCounter(), call 2", gone: true, on: true, vars: { count: 1 } }
```

- **Block scope**: `let` and `const` live inside their `{ }`. Outside the block, the name doesn't exist.
- **Closure**: a function remembers the variables from where it was created, not from where you call it.
- **Factories**: a function that returns another function (or an object of functions). Each call to the factory creates **new, private state**: nobody else can change that `count`.
- **Several functions, one memory**: the factory can return an object `{ write, total }` whose two functions share the same variables.

```js
function makeLogbook() {
  const notes = [];
  return {
    write: (text) => notes.push(text),
    total: () => notes.length,
  };
}
```

The same mechanism explains the most famous loop bug. Each notice is a function that remembers **the room where it was born**; what changes is how many rooms there are:

```scope
title: One `i` for everyone, or one `i` per pass
speed: 4200
steps:
  - note: "With `var` there's **a single** `i`, in the outer room. The three notices point to that same room, and when they run the loop has already finished: `i` is 4 for all of them."
    rooms:
      - id: g
        name: "global, with var"
        vars: { i: 4 }
        fns: [{ name: notice 1, env: g }, { name: notice 2, env: g }, { name: notice 3, env: g }]
  - note: "With `let` each pass opens its own room with its own `i`. Each notice keeps its own: 1, 2 and 3."
    rooms:
      - id: g
        name: "global, with let"
        fns: [{ name: notice 1, env: v1 }, { name: notice 2, env: v2 }, { name: notice 3, env: v3 }]
        rooms:
          - { id: v1, name: pass 1, gone: true, vars: { i: 1 } }
          - { id: v2, name: pass 2, gone: true, vars: { i: 2 } }
          - { id: v3, name: pass 3, gone: true, vars: { i: 3 } }
```

<!-- legacy: var-loop-closure -->

> **Common trap:** `makeCounter()()` creates a new counter every time, so it always gives 1. The memory lives in the counter you **kept** (`const tally = makeCounter()`); call the factory once and use what it gave you as many times as you like.

<!-- legacy: closures -->

<!-- mdn: closures var-loop-closure let -->

## Practice

```exercise
id: js11-predice-dos-contadores
type: predict
title: Two rangers, two notebooks
prompt: |
  Yeny and Wilber count with separate counters. What does it print?
code: |
  function makeCounter() {
    let count = 0;
    return () => {
      count++;
      return count;
    };
  }
  const yeny = makeCounter();
  const wilber = makeCounter();
  yeny();
  yeny();
  wilber();
  console.log(yeny(), wilber());
options:
  - "3 2"
  - "5 5"
  - "3 1"
  - "2 2"
answer: "3 2"
explain: |
  Each call to `makeCounter` creates its own `count`. Yeny's adds three times (two on their own and one inside the `console.log`) and Wilber's twice. They don't mix.
```

```exercise
id: js11-predice-var
type: predict
title: The table notices
prompt: |
  This old code prepares one notice per table. Notice the `var`. What does it print?
code: |
  const notices = [];
  for (var i = 1; i <= 3; i++) {
    notices.push(() => `Table ${i} ready`);
  }
  console.log(notices[0]());
options:
  - Table 1 ready
  - Table 3 ready
  - Table 4 ready
  - Table undefined ready
answer: Table 4 ready
explain: |
  With `var` there's a single `i` for the whole loop. The functions read it when they run, and by then the loop has finished with `i` at 4. Swap `var` for `let` and each pass gets its own `i`: it would print "Table 1 ready".
```

```exercise
id: js11-predice-let-afuera
type: predict
title: The var bug, with let
prompt: |
  You've seen that `var` in a loop shares a single variable. This code uses `let`… but declares it **before** the loop. What does it print?
code: |
  const notices = [];
  let terrace;
  for (terrace = 1; terrace <= 3; terrace++) {
    notices.push(() => `terrace ${terrace}`);
  }
  console.log(notices.map((notice) => notice()).join(", "));
options:
  - terrace 1, terrace 2, terrace 3
  - terrace 4, terrace 4, terrace 4
  - terrace 3, terrace 3, terrace 3
  - terrace undefined, terrace undefined, terrace undefined
answer: terrace 4, terrace 4, terrace 4
explain: |
  There's a single `terrace` variable, declared outside, and the three functions remember that variable, not its value. When they run, the loop has finished and it's 4. What matters isn't the word `let` but **how many variables exist**: with `for (let terrace = 1; …)` each pass gets its own and it would print "terrace 1, terrace 2, terrace 3".
```

```exercise
id: js11-completa-torniquete
type: complete
title: The circuit 2 turnstile
prompt: |
  Only `capacity` people fit on circuit 2 at once. Complete the factory `makeTurnstile(capacity)`: it returns a function `enter()` that answers `"pass"` while there's room and `"full"` when there isn't.
visual:
  figure:
    title: A turnstile with capacity 2
    panes:
      - { table: { head: ["call", "1st", "2nd", "3rd", "4th"], rows: [["inside (before)", "0", "1", "2", "2"], ["returns", "\"pass\"", "\"pass\"", "\"full\"", "\"full\""]] } }
starter: |
  function makeTurnstile(capacity) {
    let inside = ___;
    return () => {
      if (inside ___ capacity) {
        return "full";
      }
      inside++;
      return "pass";
    };
  }

  const circuit2 = makeTurnstile(2);
  console.log(circuit2(), circuit2(), circuit2());
solution: |
  function makeTurnstile(capacity) {
    let inside = 0;
    return () => {
      if (inside >= capacity) {
        return "full";
      }
      inside++;
      return "pass";
    };
  }

  const circuit2 = makeTurnstile(2);
  console.log(circuit2(), circuit2(), circuit2());
hints:
  - When the turnstile is created, nobody has gone in yet.
  - It's full when the people inside have reached the capacity (or gone past it).
tests:
  - name: with capacity 2, two pass and the third doesn't
    output: pass pass full
  - name: two turnstiles don't share their count
    expect: '(() => { const a = makeTurnstile(1); const b = makeTurnstile(1); a(); return b(); })() === "pass"'
  - name: with capacity 0 nobody passes
    expect: makeTurnstile(0)() === "full"
```

```exercise
id: js11-arregla-memoria-compartida
type: fix
title: The shared notebook
prompt: |
  Each ranger should have their own notebook of ear tags seen. But when Wilber starts his round, his notebook already says he saw llamas he never saw. Fix `makeNotebook` so each one has its own memory.
starter: |
  const seen = [];

  function makeNotebook() {
    return (tag) => {
      if (!seen.includes(tag)) {
        seen.push(tag);
      }
      return seen.length;
    };
  }

  const yeny = makeNotebook();
  yeny("MP-04");
  yeny("MP-09");
  const wilber = makeNotebook();
  console.log("Wilber has", wilber("MP-11"));
solution: |
  function makeNotebook() {
    const seen = [];
    return (tag) => {
      if (!seen.includes(tag)) {
        seen.push(tag);
      }
      return seen.length;
    };
  }

  const yeny = makeNotebook();
  yeny("MP-04");
  yeny("MP-09");
  const wilber = makeNotebook();
  console.log("Wilber has", wilber("MP-11"));
hints:
  - "How many `seen` arrays exist in this program? And how many should there be?"
  - What each notebook must own goes **inside** the factory.
tests:
  - name: Wilber has 1
    output: Wilber has 1
  - name: a notebook doesn't count the same tag twice
    expect: '(() => { const a = makeNotebook(); a("MP-01"); return a("MP-01"); })() === 1'
  - name: two notebooks don't mix
    expect: '(() => { const a = makeNotebook(); const b = makeNotebook(); a("MP-01"); a("MP-02"); return b("MP-03"); })() === 1'
```

```exercise
id: js11-arregla-fabrica-en-bucle
type: fix
title: The counter that always says 1
prompt: |
  Chasqui walks five terraces and should count how many have llamas. It always reports 1. The counter is written fine; the problem is **where** it's created.
visual:
  figure:
    panes:
      - { label: "llamasPerTerrace", cells: [2, 0, 1, 3, 0], highlight: [0, 2, 3] }
      - { label: "should print", value: "Terraces with llamas: 3" }
starter: |
  function makeCounter() {
    let count = 0;
    return () => {
      count++;
      return count;
    };
  }

  const llamasPerTerrace = [2, 0, 1, 3, 0];
  let withLlamas = 0;
  for (const llamas of llamasPerTerrace) {
    const tally = makeCounter();
    if (llamas > 0) {
      withLlamas = tally();
    }
  }
  console.log("Terraces with llamas:", withLlamas);
solution: |
  function makeCounter() {
    let count = 0;
    return () => {
      count++;
      return count;
    };
  }

  const llamasPerTerrace = [2, 0, 1, 3, 0];
  let withLlamas = 0;
  const tally = makeCounter();
  for (const llamas of llamasPerTerrace) {
    if (llamas > 0) {
      withLlamas = tally();
    }
  }
  console.log("Terraces with llamas:", withLlamas);
hints:
  - "How many counters does the loop create? Each one starts at 0."
tests:
  - name: counts 3 terraces
    output: "Terraces with llamas: 3"
  - name: the factory is called once, outside the loop
    source: 'const\s+tally\s*=\s*makeCounter\(\)[\s\S]*\bfor\s*\('
    msg: Create the counter once, before the for, and use it inside.
```

```exercise
id: js11-escribe-avisador
type: write
title: Only speak up when it changes
prompt: |
  Write `makeNotifier()`, which returns a function `notify(reading)`: it answers `true` if the reading is **different from the previous one** and `false` if it's the same. The first reading is always a change.

  The mist sensor sends one reading per turn (`"fog"`, `"clear"`…) and Yeny doesn't want the radio repeating the same thing every minute.
visual:
  figure:
    title: A notifier, turn by turn
    panes:
      - { table: { head: ["turn", "1", "2", "3", "4", "5"], rows: [["reading", "fog", "fog", "clear", "fog", "fog"], ["returns", "true", "false", "true", "true", "false"]] } }
starter: |
  function makeNotifier() {
  }

  const notify = makeNotifier();
  console.log(notify("fog"), notify("fog"), notify("clear"));
solution: |
  function makeNotifier() {
    let previous = null;
    return (reading) => {
      const changed = reading !== previous;
      previous = reading;
      return changed;
    };
  }

  const notify = makeNotifier();
  console.log(notify("fog"), notify("fog"), notify("clear"));
hints:
  - Keep the previous reading in a variable of the factory. It starts as `null`, which isn't equal to any reading.
  - "Compare first and update after: if you update first, they'll always be equal."
tests:
  - name: the sequence in the picture
    run: '(() => { const n = makeNotifier(); return ["fog", "fog", "clear", "fog", "fog"].map(n); })()'
    equals: [true, false, true, true, false]
  - name: the first reading speaks up
    expect: makeNotifier()("clear") === true
  - name: two notifiers don't share the previous reading
    expect: '(() => { const a = makeNotifier(); const b = makeNotifier(); a("fog"); return b("fog"); })() === true'
```

## The case

```exercise
id: js11-caso-libretas
type: case
title: The notebook that doesn't add up
prompt: |
  Write `makeNotebook()`, give each ranger a notebook, feed them their sightings in order and count the **different** llamas each one saw.

  Before Chasqui arrived, four rangers counted llamas over the radio all morning. Each sighting is `[ranger, tag]`, in the order it came over the radio. In the mist, everyone saw the same llama several times; that's not a mistake. At the end, each one reported how many **different** llamas they saw. One of those notebooks doesn't add up. Whose?

  Print one line per ranger, with the count at the end: `Yeny: 4`. The board compares your number with what each one reported.
visual:
  board:
    for: js11-caso-libretas
    title: What each ranger reported
    task: Count each ranger's different llamas with their own notebook and compare them with their report.
    cards:
      - { name: "Yeny", kind: person, role: "Reported 4 llamas", clue: { find: "Yeny", says: 4 } }
      - { name: "Wilber", kind: person, role: "Reported 3 llamas", clue: { find: "Wilber", says: 3 } }
      - { name: "Rosaura", kind: person, role: "Reported 5 llamas", culprit: true, clue: { find: "Rosaura", says: 5 } }
      - { name: "Fidel", kind: person, role: "Reported 3 llamas", clue: { find: "Fidel", says: 3 } }
    caption: "Seeing the same llama several times is normal in the mist: count only **different** tags."
starter: |
  const sightings = [
    ["Yeny", "MP-04"], ["Wilber", "MP-11"], ["Rosaura", "MP-02"], ["Fidel", "MP-07"],
    ["Yeny", "MP-09"], ["Rosaura", "MP-02"], ["Wilber", "MP-11"], ["Yeny", "MP-04"],
    ["Fidel", "MP-12"], ["Rosaura", "MP-05"], ["Wilber", "MP-03"], ["Yeny", "MP-01"],
    ["Rosaura", "MP-08"], ["Fidel", "MP-07"], ["Wilber", "MP-06"], ["Rosaura", "MP-05"],
    ["Yeny", "MP-09"], ["Wilber", "MP-03"], ["Rosaura", "MP-10"], ["Fidel", "MP-12"],
    ["Yeny", "MP-06"], ["Rosaura", "MP-02"], ["Wilber", "MP-11"], ["Fidel", "MP-04"],
    ["Rosaura", "MP-08"], ["Yeny", "MP-01"],
  ];

  const rangers = ["Yeny", "Wilber", "Rosaura", "Fidel"];

  // This is how you read a sighting:
  const [who, tag] = sightings[0];
  console.log(who, "saw llama", tag);

  // TODO: write makeNotebook(): it returns a function write(tag) that
  // remembers the tags already seen and returns how many different ones so far.

  // TODO: make one notebook per ranger, go through the sightings
  // and write each one in the notebook of whoever saw it.

  // TODO: print one line per ranger, like this: Yeny: 4
solution: |
  const sightings = [
    ["Yeny", "MP-04"], ["Wilber", "MP-11"], ["Rosaura", "MP-02"], ["Fidel", "MP-07"],
    ["Yeny", "MP-09"], ["Rosaura", "MP-02"], ["Wilber", "MP-11"], ["Yeny", "MP-04"],
    ["Fidel", "MP-12"], ["Rosaura", "MP-05"], ["Wilber", "MP-03"], ["Yeny", "MP-01"],
    ["Rosaura", "MP-08"], ["Fidel", "MP-07"], ["Wilber", "MP-06"], ["Rosaura", "MP-05"],
    ["Yeny", "MP-09"], ["Wilber", "MP-03"], ["Rosaura", "MP-10"], ["Fidel", "MP-12"],
    ["Yeny", "MP-06"], ["Rosaura", "MP-02"], ["Wilber", "MP-11"], ["Fidel", "MP-04"],
    ["Rosaura", "MP-08"], ["Yeny", "MP-01"],
  ];

  const rangers = ["Yeny", "Wilber", "Rosaura", "Fidel"];

  function makeNotebook() {
    const seen = [];
    return (tag) => {
      if (!seen.includes(tag)) {
        seen.push(tag);
      }
      return seen.length;
    };
  }

  const notebooks = {};
  const tallies = {};
  for (const ranger of rangers) {
    notebooks[ranger] = makeNotebook();
    tallies[ranger] = 0;
  }
  for (const [who, tag] of sightings) {
    tallies[who] = notebooks[who](tag);
  }
  for (const ranger of rangers) {
    console.log(`${ranger}: ${tallies[ranger]}`);
  }
answer: Rosaura
answerLabel: Whose notebook doesn't add up?
reveal: |
  Rosaura saw 4 different llamas (MP-02, MP-05, MP-08 and MP-10) and reported 5. She had 8 sightings: she saw MP-02 three times. If you counted sightings instead of different tags, nobody added up.
hints:
  - "Keep the notebooks in an object: `notebooks[ranger] = makeNotebook()`. Then `notebooks[who](tag)` writes in the notebook of whoever saw the llama."
  - The notebook returns how many different ones so far; keep the last value for each ranger.
```

## The judge

As in session 4, the judge **calls your function** and compares what it returns. This time it's a **design** problem, like the ones on LeetCode: you write the factory and the judge uses it through `patrol`, which comes already written.

```exercise
id: js11-juez-neblina
type: judge
mode: function
function: patrol
title: The mist streak
prompt: |
  Write `makeLookout()`, which returns a function `lookout(visibility)`: each turn it gets the visibility and returns **how many turns in a row** that robot has been in the mist, counting this one.

  There's mist when visibility is **less than 30**. At 30 or more, the streak goes back to 0 (and it returns 0).

  Several robots patrol at once and their turns arrive mixed together. `patrol(turns)` is already written: it gets a list of `[robot, visibility]`, creates **one lookout per robot** the first time it sees it, and returns the list of answers. Don't change it: each lookout must remember **its own** streak.

  **Constraints:** up to 200 turns · up to 5 robots · visibility from 0 to 100.
visual:
  figure:
    title: Example 1, turn by turn
    panes:
      - { table: { head: ["turn", "1", "2", "3", "4", "5", "6", "7"], rows: [["robot", "A", "A", "A", "B", "A", "A", "B"], ["visibility", "80", "20", "10", "5", "25", "60", "12"], ["mist? (< 30)", "no", "yes", "yes", "yes", "yes", "no", "yes"], ["returns", "0", "1", "2", "1", "3", "0", "2"]] } }
    caption: "B's streak doesn't mix with A's: on turn 4, B is on 1 even though A was on 2."
starter: |
  function makeLookout() {
    // TODO: return a function lookout(visibility)
  }

  // The judge calls this function. Don't change it.
  function patrol(turns) {
    const lookouts = {};
    return turns.map(([robot, visibility]) => {
      if (lookouts[robot] === undefined) {
        lookouts[robot] = makeLookout();
      }
      return lookouts[robot](visibility);
    });
  }
solution: |
  function makeLookout() {
    let streak = 0;
    return (visibility) => {
      if (visibility < 30) {
        streak++;
      } else {
        streak = 0;
      }
      return streak;
    };
  }

  // The judge calls this function. Don't change it.
  function patrol(turns) {
    const lookouts = {};
    return turns.map(([robot, visibility]) => {
      if (lookouts[robot] === undefined) {
        lookouts[robot] = makeLookout();
      }
      return lookouts[robot](visibility);
    });
  }
hints:
  - "The streak lives inside `makeLookout`, in a `let` that starts at 0."
  - If the streak were outside the factory, all the robots would share one. Try example 1 by hand.
samples:
  - args: [[["A", 80], ["A", 20], ["A", 10], ["B", 5], ["A", 25], ["A", 60], ["B", 12]]]
    returns: [0, 1, 2, 1, 3, 0, 2]
    note: Each robot's streak is its own.
  - args: [[["C", 29], ["C", 30], ["C", 29]]]
    returns: [1, 0, 1]
    note: 30 isn't mist any more.
edge:
  - args: [[]]
    tag: with no turns
  - args: [[["A", 0], ["A", 0], ["A", 0], ["A", 0], ["A", 0]]]
    tag: with mist on every turn
  - args: [[["A", 10], ["B", 10], ["A", 10], ["B", 90], ["A", 10], ["B", 10]]]
    tag: with two robots taking turns
  - args: [[["A", 100], ["B", 100], ["C", 100]]]
    tag: with a clear sky
random:
  count: 40
  seed: 111
  generate: |
    const robots = ["A", "B", "C", "D", "E"].slice(0, rng.int(1, 5));
    const n = rng.int(1, 200);
    return [Array.from({ length: n }, () => [rng.pick(robots), rng.next() < 0.6 ? rng.int(0, 29) : rng.int(30, 100)])];
wrong:
  - |
    let streak = 0;
    function makeLookout() {
      return (visibility) => {
        streak = visibility < 30 ? streak + 1 : 0;
        return streak;
      };
    }
    function patrol(turns) {
      const lookouts = {};
      return turns.map(([robot, visibility]) => {
        if (lookouts[robot] === undefined) lookouts[robot] = makeLookout();
        return lookouts[robot](visibility);
      });
    }
  - |
    function makeLookout() {
      let streak = 0;
      return (visibility) => {
        streak = visibility <= 30 ? streak + 1 : 0;
        return streak;
      };
    }
    function patrol(turns) {
      const lookouts = {};
      return turns.map(([robot, visibility]) => {
        if (lookouts[robot] === undefined) lookouts[robot] = makeLookout();
        return lookouts[robot](visibility);
      });
    }
  - |
    function makeLookout() {
      let mistyTurns = 0;
      return (visibility) => {
        if (visibility < 30) mistyTurns++;
        return visibility < 30 ? mistyTurns : 0;
      };
    }
    function patrol(turns) {
      const lookouts = {};
      return turns.map(([robot, visibility]) => {
        if (lookouts[robot] === undefined) lookouts[robot] = makeLookout();
        return lookouts[robot](visibility);
      });
    }
```

## Final mission

```exercise
id: js11-mision-censo
type: mission
title: The llama census in the mist
prompt: |
  Write `makeCensus()` and use it so that Chasqui walks the terraces and reports **once, at the end**, how many different llamas it saw.

  The mist lets it see no more than one tile around. On each step, Chasqui looks with `robot.scan()`; the helper `tilesWith(grid, robot.position, "l")` turns what it saw into the map tiles where there's a llama, such as `["4,2", "6,2"]`. The same llama shows up on several steps in a row, so adding them all up overcounts.

  `makeCensus()` returns a function `record(tiles)` that **remembers** the tiles already seen and returns how many different llamas so far. `route` is a string with one step per letter (`"E"`, `"S"`, `"W"`, `"N"`) and it changes in each test.
visual:
  figure:
    title: The same llama, seen from three steps
    panes:
      - { label: "step 2: Chasqui at (3, 1)", grid: ["...", ".R.", "..l"], path: ["0,0", "1,0", "2,0", "0,1", "1,1", "2,1", "0,2", "1,2"], marks: ["2,2"] }
      - { label: "step 3: at (4, 1)", grid: ["...", ".R.", ".l."], path: ["0,0", "1,0", "2,0", "0,1", "1,1", "2,1", "0,2", "2,2"], marks: ["1,2"] }
      - { label: "step 4: at (5, 1)", grid: ["...", ".R.", "l.."], path: ["0,0", "1,0", "2,0", "0,1", "1,1", "2,1", "1,2", "2,2"], marks: ["0,2"] }
      - { label: "what each way gives", table: { head: ["step", "2", "3", "4"], rows: [["tilesWith(…)", "[\"4,2\"]", "[\"4,2\"]", "[\"4,2\"]"], ["adding everything", "1", "2", "3"], ["record (with memory)", "1", "1", "1"]] } }
starter: |
  // route: each letter is a step ("E", "S", "W", "N").
  let total = 0;
  for (const step of route) {
    robot.followPath([step]);
    const llamas = tilesWith(robot.scan(), robot.position, "l");
    total += llamas.length; // counts the same llama several times
  }
  robot.report(total);

  // TODO: write makeCensus(): it returns a function record(tiles)
  // that remembers the tiles already seen and returns how many different ones so far.
solution: |
  function makeCensus() {
    const seen = [];
    return (tiles) => {
      for (const tile of tiles) {
        if (!seen.includes(tile)) {
          seen.push(tile);
        }
      }
      return seen.length;
    };
  }

  const record = makeCensus();
  let total = 0;
  for (const step of route) {
    robot.followPath([step]);
    total = record(tilesWith(robot.scan(), robot.position, "l"));
  }
  robot.report(total);
hints:
  - "Inside the factory, a `seen` array; `record` adds only the tiles that aren't there yet (`includes`) and returns `seen.length`."
  - Create the census once, before the loop. In the loop, `total` is what `record` returns, not a sum.
helpers:
  - name: tilesWith
    sig: "tilesWith(grid, position, letter) → string[]"
    doc: The map tiles ("x,y") where the scan() grid shows that letter.
    code: "(grid, position, letter) => { const r = (grid.length - 1) / 2; return grid.flatMap((row, j) => row.flatMap((c, i) => (c === letter ? [`${position.x + i - r},${position.y + j - r}`] : []))); }"
world:
  theme: museo
  level: 4
  dir: E
  fog: true
  vision: 1
  api: [move, scan, path, report]
  items: { l: llama }
  map: |
    ###############
    #R............#
    #..l.....l....#
    ###########...#
    #.............#
    #..l...l....l.#
    #...###########
    #.............#
    #....l....l...#
    ###############
globals:
  route: EEEEEEEEEEEESSSWWWWWWWWWWWWSSSEEEEEEEEEEEE
scenarios:
  - {}
  - map: |
      ###########
      #R........#
      #...l.l...#
      #######...#
      #.........#
      #.l.......#
      ###########
    globals:
      route: EEEEEEEESSSWWWWWWWW
  - map: |
      #################
      #R..............#
      #...l.....l...l.#
      #############...#
      #...............#
      #..l.......l....#
      #...#############
      #...............#
      #.l...l.....l...#
      #############...#
      #...............#
      #......l........#
      #################
    globals:
      route: EEEEEEEEEEEEEESSSWWWWWWWWWWWWWWSSSEEEEEEEEEEEEEESSSWWWWWWWWWWWWWW
tests:
  - name: makeCensus is a function
    expect: typeof makeCensus === "function"
  - name: record doesn't count the same tile twice
    expect: '(() => { const record = makeCensus(); record(["4,2"]); return record(["4,2", "6,2"]); })() === 2'
  - name: each census has its own memory
    expect: '(() => { const a = makeCensus(); const b = makeCensus(); a(["1,1", "2,2"]); return b(["1,1"]); })() === 1'
  - name: reports the number of llamas once
    state: w.reports.length === 1 && w.reports[0] === w.itemsLeft
    msg: The reported number isn't the number of different llamas (or it was reported more than once).
  - name: no crashing
    state: '!w.crashed'
```

## Expert challenge

```exercise
id: js11-reto-memorizar
type: challenge
title: Don't work out the same thing twice
prompt: |
  Working out the route between two terraces is slow. Write `memoize(fn)`, which returns a new function that does the same as `fn` but **remembers** each result by its argument: if it's asked for the same one again, it answers without calling `fn`. Each memoized function has its own memory.
starter: |
  function memoize(fn) {
    return fn;
  }

  let calls = 0;
  const slow = (n) => {
    calls++;
    return n * 2;
  };
  const fast = memoize(slow);
  console.log(fast(4), fast(4), calls);
solution: |
  function memoize(fn) {
    const memory = new Map();
    return (argument) => {
      if (!memory.has(argument)) {
        memory.set(argument, fn(argument));
      }
      return memory.get(argument);
    };
  }

  let calls = 0;
  const slow = (n) => {
    calls++;
    return n * 2;
  };
  const fast = memoize(slow);
  console.log(fast(4), fast(4), calls);
hints:
  - "A `Map` inside `memoize` stores argument → result."
  - "Use `has`, not `get(...) === undefined`: a function may really return `undefined`."
tests:
  - name: the second request doesn't call fn
    output: 8 8 1
  - name: different arguments do call it
    expect: '(() => { let n = 0; const f = memoize((x) => { n++; return x + 1; }); f(1); f(2); f(1); return n; })() === 2'
  - name: it remembers an undefined too
    expect: '(() => { let n = 0; const f = memoize(() => { n++; return undefined; }); f(1); f(1); return n; })() === 1'
  - name: each memoized function has its own memory
    expect: '(() => { const a = memoize((x) => x * 2); const b = memoize((x) => x * 3); a(5); return b(5); })() === 15'
```
