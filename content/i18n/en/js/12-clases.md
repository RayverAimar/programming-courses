# Session 12 — Classes and modules

## The job

Arequipa, an old house of white sillar stone two blocks from the Plaza de Armas. That's where Rapidito runs its delivery business, and tomorrow it rents **three** robots from Loop: Chasqui, Misti and Chachani. Valeria Zegarra, its head of technology, asked to see the code before signing. She opened it, scrolled down a little, and sent us a screenshot with no comment: `battery`, `battery2`, `batteryMistiNew`, `positionX_final_v3`.

The code was written for a single robot, and each new robot was added by copy and paste. With three, every change has to be made three times, and one wrong variable drains the wrong robot. Today we tidy up Chasqui's brain: **one mould** (a class) that turns out as many robots as needed, each with its own state, and separate **files** (modules) for each part.

```scene
theme: barranco
level: 4
dir: E
api: [move, cargo, path]
items: { a: cheese ice cream, b: stuffed rocoto, c: adobo }
caption: Rapidito's depot. Chasqui takes the parcels from the row and leaves each one at its customer's door.
map: |
  ############
  #Rabc......#
  #..........#
  #..........#
  #..........#
  ############
program: |
  robot.forward();
  robot.take();
  robot.forward();
  robot.take();
  robot.followPath(["E", "E", "E", "E", "E", "S", "S", "S"]);
  robot.drop("cheese ice cream");
  robot.followPath(["W", "W", "W", "W", "W", "W", "N"]);
  robot.drop("stuffed rocoto");
```

## The minimum

A **class** is a mould. With `new` you make objects from that mould (**instances**): they all have the same methods, but each keeps its own data.

```js run
class Robot {
  #battery = 100;
  constructor(name) {
    this.name = name;
  }
  forward(steps) {
    this.#battery -= steps * 2;
  }
  get battery() {
    return this.#battery;
  }
}

const bot = new Robot("Chasqui");
bot.forward(5);
console.log(bot.name, bot.battery);
```

```anim
title: One mould, two robots, two batteries
code: |
  class Robot {
    #battery = 100;
    constructor(name) {
      this.name = name;
    }
    forward(steps) {
      this.#battery -= steps * 2;
    }
    get battery() {
      return this.#battery;
    }
  }
  const chasqui = new Robot("Chasqui");
  const misti = new Robot("Misti");
  chasqui.forward(5);
  console.log(chasqui.battery, misti.battery);
steps:
  - { line: 1, vars: {}, note: "The class is the mould. No robot exists yet." }
  - { line: 13, vars: {}, stack: [{ name: "new Robot", args: 'name = "Chasqui"' }], note: "new creates a new object and calls its constructor." }
  - { line: 2, vars: { this: { "#battery": 100 } }, stack: [{ name: "new Robot", args: 'name = "Chasqui"' }], note: "Each new object gets its own #battery, at 100." }
  - { line: 4, vars: { this: { "#battery": 100, name: "Chasqui" } }, stack: [{ name: "new Robot", args: 'name = "Chasqui"' }], note: "this is the object being created." }
  - { line: 13, vars: { chasqui: { "#battery": 100, name: "Chasqui" } }, note: "chasqui is that object, now finished." }
  - { line: 14, vars: { chasqui: { "#battery": 100, name: "Chasqui" }, misti: { "#battery": 100, name: "Misti" } }, note: "The same mould gives another object, with another battery." }
  - { line: 15, vars: { chasqui: { "#battery": 100, name: "Chasqui" }, misti: { "#battery": 100, name: "Misti" } }, stack: [{ name: "chasqui.forward", args: "steps = 5" }] }
  - { line: 7, vars: { chasqui: { "#battery": 90, name: "Chasqui" }, misti: { "#battery": 100, name: "Misti" } }, stack: [{ name: "chasqui.forward", args: "steps = 5" }], note: "Inside the method, this is chasqui: only its battery goes down." }
  - { line: 10, vars: { chasqui: { "#battery": 90, name: "Chasqui" }, misti: { "#battery": 100, name: "Misti" } }, stack: [{ name: "get battery", args: "", ret: "90" }], note: "A getter is read like a property, no brackets." }
  - { line: 16, vars: { chasqui: { "#battery": 90, name: "Chasqui" }, misti: { "#battery": 100, name: "Misti" } }, out: "90 100" }
```

- **`constructor`** runs on every `new` and sets up the object. Inside the class, **`this`** is the object you're working with.
- **Methods**: the mould's functions, like `forward(steps)`. You call them with a dot: `chasqui.forward(5)`.
- **`#private`**: a field with `#` can only be touched from inside the class. Nobody outside can write `chasqui.#battery = 500`; it's an error before anything runs. That way the rule for how the battery is spent lives in one place.
- **`get`**: a method that's read like a property (`chasqui.battery`). It lets you read private data without letting anyone change it.
- **`extends`**: a child class inherits everything from its parent and adds or changes what it needs; `super(...)` calls the parent's constructor and `super.method()` its version of a method.

```js
class Courier extends Robot {
  constructor(name, zone) {
    super(name);
    this.zone = zone;
  }
}
```

**Modules.** When the brain grows, each class goes in its own file. A file **exports** what it offers and another **imports** it. In the exercises everything lives in one file, but Rapidito's project ends up like this:

```figure
title: Chasqui's brain, in three files
panes:
  - { label: "battery.js", cards: [{ title: "exports", rows: [["export class", "Battery"]] }] }
  - { label: "courier.js", cards: [{ title: "imports and exports", rows: [["import", "{ Battery } from \"./battery.js\""], ["export class", "Courier"]] }] }
  - { label: "main.js", cards: [{ title: "uses", rows: [["import", "{ Courier } from \"./courier.js\""], ["const", "chasqui = new Courier(robot)"]] }] }
caption: "Each file says what it offers (`export`) and what it needs (`import`). If the battery rule changes, it changes in **one** file."
```

```js
// courier.js
import { Battery } from "./battery.js";
export class Courier { /* … */ }

// main.js
import { Courier } from "./courier.js";
```

This is how the browser (or Node) finds and runs them. Notice the **order**: they're requested top to bottom, but run bottom to top.

```network
title: How three files find each other, and in what order they run
caption: "`./` means \"next to this file\". Each file runs **once**, even if ten others import it."
speed: 4200
nodes:
  - { id: main, icon: file, label: main.js, sub: the file where everything starts }
  - { id: rep, icon: file, label: courier.js, sub: uses the battery }
  - { id: bat, icon: file, label: battery.js, sub: imports nothing }
steps:
  - phase: "1. Requested, top to bottom"
    at: main
    note: "The browser starts from **a single file**, the entry one: `main.js`. It finds the others through the `import` lines."
    tags: { main: start }
  - move: [main, rep]
    packet: { kind: up, label: "asks for \"./courier.js\"" }
    note: "Before running anything in `main.js`, it reads its `import`s. The first says `\"./courier.js\"`: the `./` is **\"in this file's folder\"**. Without `./`, it would look for an installed package."
    tags: { main: waiting for courier.js }
  - move: [rep, bat]
    packet: { kind: up, label: "asks for \"./battery.js\"" }
    note: "`courier.js` has an `import` too: it asks for `./battery.js`. It keeps asking until it reaches a file that imports nothing."
    tags: { main: waiting for courier.js, rep: waiting for battery.js }
  - phase: "2. Run, bottom to top"
    at: bat
    packet: { kind: local, label: "`battery.js` runs" }
    note: "`battery.js` needs nobody, so it **runs first**, top to bottom. Its `export` makes `Battery` available to whoever asks for it."
    tags: { bat: "ran · offers Battery", rep: waiting for battery.js }
  - move: [bat, rep]
    packet: { kind: down, label: "Battery" }
    note: "`courier.js` receives `Battery`, the name it asked for in braces, and **only then** runs. If it asked for something `battery.js` doesn't export, it would fail before running anything."
    tags: { bat: ran, rep: "ran · offers Courier", main: waiting for courier.js }
  - move: [rep, main]
    packet: { kind: down, label: "Courier" }
    note: "Finally `main.js` receives `Courier` and runs its own code. If `battery.js` imported `courier.js` back, it would be a **cycle**: it almost always means two files should be one, or a third is missing."
    tags: { main: ran, rep: ran, bat: ran }
```

> **Common trap:** inside a method, a bare `battery` isn't the robot's battery: it's a variable that doesn't exist. Always `this.#battery` or `this.name`. And without `new`, `Robot("Chasqui")` is an error: a class is only used with `new`.

<!-- legacy: classes -->

<!-- legacy: private-fields -->

<!-- legacy: modules -->

<!-- mdn: classes private-fields modules -->

## Practice

```exercise
id: js12-predice-mochilas
type: predict
title: Two backpacks
prompt: |
  What does it print?
code: |
  class Backpack {
    #parcels = [];
    put(parcel) {
      this.#parcels.push(parcel);
    }
    get count() {
      return this.#parcels.length;
    }
  }
  const chasquiPack = new Backpack();
  const mistiPack = new Backpack();
  chasquiPack.put("cheese ice cream");
  chasquiPack.put("stuffed rocoto");
  mistiPack.put("adobo");
  console.log(chasquiPack.count, mistiPack.count);
options:
  - "3 3"
  - "2 1"
  - "2 2"
  - "undefined undefined"
answer: "2 1"
explain: |
  Each `new Backpack()` creates its own `#parcels` array. And `count` is a getter: it's read without brackets and returns a number.
```

```exercise
id: js12-predice-super
type: predict
title: The courier says hello
prompt: |
  `Courier` inherits from `Robot` and changes the greeting. What does it print?
code: |
  class Robot {
    constructor(name) {
      this.name = name;
    }
    greet() {
      return `I am ${this.name}`;
    }
  }
  class Courier extends Robot {
    greet() {
      return `${super.greet()} and I bring your order`;
    }
  }
  const courier = new Courier("Chasqui");
  console.log(courier.greet());
options:
  - I am Chasqui
  - I am Chasqui and I bring your order
  - I am undefined and I bring your order
  - and I bring your order
answer: I am Chasqui and I bring your order
explain: |
  `Courier` has no constructor, so it uses `Robot`'s and `name` gets stored. Its `greet` replaces the parent's, but `super.greet()` can still call the original version.
```

```exercise
id: js12-completa-paquete
type: complete
title: The parcel mould
prompt: |
  A Rapidito parcel has a `destination` and a `weight` (in kilos). It costs 5 soles plus 2 per kilo. Complete the class and create the cheese ice cream parcel.
visual:
  figure:
    input: { label: 'new Parcel("Yanahuara", 3)', cards: [{ title: parcel, rows: [["destination", "\"Yanahuara\""], ["weight", "3"]] }] }
    arrow: 5 + 2 × 3
    output: { label: "parcel.cost()", value: "11" }
starter: |
  class Parcel {
    ___(destination, weight) {
      this.destination = destination;
      ___.weight = weight;
    }
    cost() {
      return 5 + 2 * this.weight;
    }
  }

  const iceCream = ___ Parcel("Yanahuara", 3);
  console.log(iceCream.destination, iceCream.cost());
solution: |
  class Parcel {
    constructor(destination, weight) {
      this.destination = destination;
      this.weight = weight;
    }
    cost() {
      return 5 + 2 * this.weight;
    }
  }

  const iceCream = new Parcel("Yanahuara", 3);
  console.log(iceCream.destination, iceCream.cost());
hints:
  - The method that sets up each new object has a fixed name.
  - Inside the class, the object being created is called `this`.
tests:
  - name: prints destination and cost
    output: Yanahuara 11
  - name: a 10-kilo parcel costs 25
    expect: new Parcel("Cayma", 10).cost() === 25
```

```exercise
id: js12-arregla-this
type: fix
title: The battery that doesn't exist
prompt: |
  Misti moves and the program crashes with "`charge` doesn't exist". The class does have the charge. Fix it without taking it out of the class.
starter: |
  class Battery {
    #charge = 100;
    spend(amount) {
      charge -= amount;
    }
    get charge() {
      return this.#charge;
    }
  }

  const mistiBattery = new Battery();
  mistiBattery.spend(30);
  console.log("Misti has", mistiBattery.charge);
solution: |
  class Battery {
    #charge = 100;
    spend(amount) {
      this.#charge -= amount;
    }
    get charge() {
      return this.#charge;
    }
  }

  const mistiBattery = new Battery();
  mistiBattery.spend(30);
  console.log("Misti has", mistiBattery.charge);
hints:
  - Inside a method, the object's data is reached through `this`.
tests:
  - name: Misti has 70
    output: Misti has 70
  - name: the charge stays private
    source: 'this\.#charge\s*-='
    msg: Subtract from the private field, this.#charge.
```

```exercise
id: js12-arregla-tope
type: fix
title: The battery at 130 %
prompt: |
  After recharging, Chachani claims 130 % battery. Rapidito's rule: **never more than 100**. Since the charge is private, it's enough to fix it in one place: the `recharge` method.
visual:
  figure:
    panes:
      - { table: { head: ["step", "start", "spend(20)", "recharge(50)", "recharge(50)"], rows: [["charge", "100", "80", "100 (not 130)", "100"]] } }
starter: |
  class Battery {
    #charge = 100;
    spend(amount) {
      this.#charge -= amount;
    }
    recharge(amount) {
      this.#charge += amount;
    }
    get charge() {
      return this.#charge;
    }
  }

  const chachaniBattery = new Battery();
  chachaniBattery.spend(20);
  chachaniBattery.recharge(50);
  console.log("Chachani has", chachaniBattery.charge);
solution: |
  class Battery {
    #charge = 100;
    spend(amount) {
      this.#charge -= amount;
    }
    recharge(amount) {
      this.#charge = Math.min(100, this.#charge + amount);
    }
    get charge() {
      return this.#charge;
    }
  }

  const chachaniBattery = new Battery();
  chachaniBattery.spend(20);
  chachaniBattery.recharge(50);
  console.log("Chachani has", chachaniBattery.charge);
hints:
  - "`Math.min(100, something)` never goes over 100."
tests:
  - name: Chachani has 100
    output: Chachani has 100
  - name: recharging below the cap adds normally
    expect: '(() => { const b = new Battery(); b.spend(60); b.recharge(30); return b.charge; })() === 70'
```

```exercise
id: js12-escribe-bitacora
type: write
title: The robot's logbook
prompt: |
  Write the class `Logbook`: it keeps the texts it's given in a **private** field and offers:

  - `write(text)`: adds the text at the end.
  - `get total`: how many entries there are.
  - `last()`: the last entry, or `null` if it's empty.

  Valeria wants one logbook per robot, and nobody able to wipe it from outside.
visual:
  figure:
    title: A logbook after two entries
    panes:
      - { label: "entries (private)", cells: ["\"left the depot\"", "\"delivered in Cayma\""] }
      - { label: "read like this", table: { head: ["expression", "gives"], rows: [["logbook.total", "2"], ["logbook.last()", "\"delivered in Cayma\""]] } }
starter: |
  class Logbook {
  }

  const chasquiLog = new Logbook();
  chasquiLog.write("left the depot");
  console.log(chasquiLog.total);
solution: |
  class Logbook {
    #entries = [];
    write(text) {
      this.#entries.push(text);
    }
    get total() {
      return this.#entries.length;
    }
    last() {
      return this.#entries.at(-1) ?? null;
    }
  }

  const chasquiLog = new Logbook();
  chasquiLog.write("left the depot");
  console.log(chasquiLog.total);
hints:
  - "Start with `#entries = [];` inside the class."
  - "`list.at(-1)` is the last element (or `undefined` if it's empty); `?? null` turns that `undefined` into `null`."
tests:
  - name: total counts the entries
    expect: '(() => { const b = new Logbook(); b.write("a"); b.write("b"); return b.total; })() === 2'
  - name: last gives the last one
    expect: '(() => { const b = new Logbook(); b.write("left"); b.write("delivered in Cayma"); return b.last(); })() === "delivered in Cayma"'
  - name: empty, last gives null
    expect: new Logbook().last() === null
  - name: two logbooks don't mix
    expect: '(() => { const a = new Logbook(); const b = new Logbook(); a.write("x"); return b.total; })() === 0'
  - name: the entries are private
    source: '#\w+'
    msg: "Keep the entries in a private field, with #."
```

## The case

```exercise
id: js12-caso-baterias
type: case
title: The broken counter
prompt: |
  Write the class `Robot` with its private battery, make one robot per name, replay the day's log and compare each one's final battery with what its screen showed.

  Yesterday Rapidito tested four robots. Each one starts with 100 battery and spends it like this:

  - `forward` n tiles: 2 per tile.
  - `turn`: 1.
  - `load` a parcel: 5.
  - `recharge`: adds 30, but **never goes over 100**.

  At the end of the day, each robot showed its battery on screen. One's counter is broken. Which? Print one line per robot with its final battery: `Misti: 69`.
visual:
  board:
    for: js12-caso-baterias
    title: What each screen showed
    task: Replay the log with one Robot object per name and compare the final battery with its screen.
    cards:
      - { name: "Misti", kind: robot, role: "Screen: 69", clue: { find: "Misti", says: 69, saysLabel: "Showed" } }
      - { name: "Chachani", kind: robot, role: "Screen: 91", clue: { find: "Chachani", says: 91, saysLabel: "Showed" } }
      - { name: "Chasqui", kind: robot, role: "Screen: 80", clue: { find: "Chasqui", says: 80, saysLabel: "Showed" } }
      - { name: "Pichu", kind: robot, role: "Screen: 88", culprit: true, clue: { find: "Pichu", says: 88, saysLabel: "Showed" } }
    caption: "If **two** screens don't match, check your `recharge`: the battery never goes over 100."
starter: |
  const log = [
    ["Misti", "forward", 6], ["Chachani", "load"], ["Chasqui", "forward", 4], ["Pichu", "turn"],
    ["Misti", "turn"], ["Chasqui", "load"], ["Chachani", "forward", 9], ["Pichu", "forward", 12],
    ["Misti", "recharge"], ["Chasqui", "forward", 7], ["Chachani", "turn"], ["Pichu", "load"],
    ["Misti", "forward", 10], ["Chachani", "forward", 5], ["Chasqui", "turn"], ["Pichu", "forward", 8],
    ["Chachani", "recharge"], ["Misti", "load"], ["Chasqui", "forward", 11], ["Pichu", "recharge"],
    ["Chachani", "load"], ["Misti", "forward", 3], ["Chasqui", "recharge"], ["Pichu", "turn"],
  ];

  // This is how you read a log line (load, turn and recharge carry no number):
  const [name, action, tiles] = log[0];
  console.log(name, "did", action, tiles);

  // TODO: write class Robot with #battery = 100 and one method per action:
  // forward(tiles), turn(), load(), recharge(), and get battery.

  // TODO: make one Robot per name (Misti, Chachani, Chasqui, Pichu),
  // replay the log and print like this: Misti: 69
solution: |
  const log = [
    ["Misti", "forward", 6], ["Chachani", "load"], ["Chasqui", "forward", 4], ["Pichu", "turn"],
    ["Misti", "turn"], ["Chasqui", "load"], ["Chachani", "forward", 9], ["Pichu", "forward", 12],
    ["Misti", "recharge"], ["Chasqui", "forward", 7], ["Chachani", "turn"], ["Pichu", "load"],
    ["Misti", "forward", 10], ["Chachani", "forward", 5], ["Chasqui", "turn"], ["Pichu", "forward", 8],
    ["Chachani", "recharge"], ["Misti", "load"], ["Chasqui", "forward", 11], ["Pichu", "recharge"],
    ["Chachani", "load"], ["Misti", "forward", 3], ["Chasqui", "recharge"], ["Pichu", "turn"],
  ];

  class Robot {
    #battery = 100;
    forward(tiles) {
      this.#battery -= 2 * tiles;
    }
    turn() {
      this.#battery -= 1;
    }
    load() {
      this.#battery -= 5;
    }
    recharge() {
      this.#battery = Math.min(100, this.#battery + 30);
    }
    get battery() {
      return this.#battery;
    }
  }

  const robots = {};
  for (const name of ["Misti", "Chachani", "Chasqui", "Pichu"]) {
    robots[name] = new Robot();
  }
  for (const [name, action, tiles] of log) {
    robots[name][action](tiles);
  }
  for (const [name, robot] of Object.entries(robots)) {
    console.log(`${name}: ${robot.battery}`);
  }
answer: Pichu
answerLabel: Which robot has the broken counter?
reveal: |
  Pichu ended on 83 and its screen showed 88: its counter doesn't take off the 5 for loading a parcel. Misti is the trap: it recharged at 87 and ended up at 100, not 117. If your `recharge` had no cap, Misti didn't match either.
hints:
  - "If the methods are named like the actions, `robots[name][action](tiles)` calls the right method (the ones that don't use `tiles` ignore it)."
  - "The cap goes in `recharge`: `Math.min(100, this.#battery + 30)`."
```

## The judge

Another **design** problem: you write the class and the judge uses it through `runCounter`, which comes already written. Operations arrive as symbols so the cases are the same in any language: `["+", parcel]` stores, `["-", number]` collects and `["?"]` asks how many lockers are free.

```exercise
id: js12-juez-consigna
type: judge
mode: function
function: runCounter
title: The parcel lockers
prompt: |
  Write the class `Lockers`: it keeps parcels in numbered lockers and answers each operation at the counter.

  Rapidito has a bank of `n` lockers at the entrance, numbered 1 to `n`. Write `class Lockers` with:

  - `constructor(n)`: all lockers start empty.
  - `store(parcel)`: puts it in the free locker **with the lowest number** and returns that number; if none is free, returns **-1**.
  - `collect(number)`: takes the parcel out of that locker, frees it and **returns the parcel**; if it's empty or doesn't exist, returns **null**.
  - `get free`: how many lockers are empty.

  `runCounter(n, operations)` creates the lockers, applies the operations in order and returns the list of answers. Don't change it.

  **Constraints:** 1 ≤ n ≤ 10 · up to 60 operations · a number to collect may be outside 1…n.
visual:
  figure:
    title: Example 1, operation by operation (2 lockers)
    panes:
      - { table: { head: ["operation", "[\"+\", \"queso\"]", "[\"+\", \"rocoto\"]", "[\"+\", \"adobo\"]", "[\"-\", 1]", "[\"?\"]", "[\"+\", \"adobo\"]"], rows: [["locker 1", "queso", "queso", "queso", "—", "—", "adobo"], ["locker 2", "—", "rocoto", "rocoto", "rocoto", "rocoto", "rocoto"], ["returns", "1", "2", "-1", "\"queso\"", "1", "1"]] } }
    caption: "The adobo doesn't fit when both are full (**-1**). Collecting the queso frees locker 1, and it's the first to be used again."
starter: |
  class Lockers {
    // TODO: constructor(n), store(parcel), collect(number), get free
  }

  // The judge calls this function. Don't change it.
  function runCounter(n, operations) {
    const lockers = new Lockers(n);
    return operations.map(([op, item]) => {
      if (op === "+") return lockers.store(item);
      if (op === "-") return lockers.collect(item);
      return lockers.free;
    });
  }
solution: |
  class Lockers {
    #slots;
    constructor(n) {
      this.#slots = Array(n).fill(null);
    }
    store(parcel) {
      const free = this.#slots.indexOf(null);
      if (free === -1) {
        return -1;
      }
      this.#slots[free] = parcel;
      return free + 1;
    }
    collect(number) {
      const parcel = this.#slots[number - 1] ?? null;
      if (parcel !== null) {
        this.#slots[number - 1] = null;
      }
      return parcel;
    }
    get free() {
      return this.#slots.filter((s) => s === null).length;
    }
  }

  // The judge calls this function. Don't change it.
  function runCounter(n, operations) {
    const lockers = new Lockers(n);
    return operations.map(([op, item]) => {
      if (op === "+") return lockers.store(item);
      if (op === "-") return lockers.collect(item);
      return lockers.free;
    });
  }
hints:
  - "A private array of `n` positions, with `null` in the empty ones: `Array(n).fill(null)`. Locker `k` is position `k - 1`."
  - "`indexOf(null)` finds the first free locker. For a number out of range, `this.#slots[number - 1]` is `undefined`: turn it into `null`."
samples:
  - args: [2, [["+", "queso"], ["+", "rocoto"], ["+", "adobo"], ["-", 1], ["?"], ["+", "adobo"]]]
    returns: [1, 2, -1, "queso", 1, 1]
    note: Locker 1 is freed and used again.
  - args: [3, [["-", 2], ["?"], ["-", 7]]]
    returns: [null, 3, null]
    note: Collecting from an empty locker, or one that doesn't exist, gives null.
edge:
  - args: [1, [["+", "queso"], ["+", "rocoto"], ["-", 1], ["-", 1], ["+", "rocoto"]]]
    tag: with a single locker
  - args: [4, [["+", "a"], ["+", "b"], ["+", "c"], ["-", 2], ["-", 1], ["+", "d"], ["+", "e"], ["?"]]]
    tag: when lockers in the middle are freed
  - args: [5, [["-", 0], ["-", 6], ["?"]]]
    tag: with numbers out of range
  - args: [3, []]
    tag: with no operations
  - args: [2, [["+", "x"], ["+", "y"], ["?"], ["-", 2], ["?"], ["-", 2], ["?"]]]
    tag: collecting the same locker twice
random:
  count: 40
  seed: 121
  generate: |
    const n = rng.int(1, 10);
    const parcels = ["queso", "rocoto", "adobo", "chupe", "solterito", "pastel", "colación"];
    const ops = Array.from({ length: rng.int(1, 60) }, () => {
      const r = rng.next();
      if (r < 0.5) return ["+", rng.pick(parcels)];
      if (r < 0.85) return ["-", rng.int(0, n + 1)];
      return ["?"];
    });
    return [n, ops];
wrong:
  - |
    class Lockers {
      #slots;
      #next = 0;
      constructor(n) { this.#slots = Array(n).fill(null); }
      store(parcel) {
        if (this.#next >= this.#slots.length) return -1;
        this.#slots[this.#next] = parcel;
        this.#next++;
        return this.#next;
      }
      collect(number) {
        const parcel = this.#slots[number - 1] ?? null;
        if (parcel !== null) this.#slots[number - 1] = null;
        return parcel;
      }
      get free() { return this.#slots.filter((s) => s === null).length; }
    }
    function runCounter(n, operations) {
      const lockers = new Lockers(n);
      return operations.map(([op, item]) => (op === "+" ? lockers.store(item) : op === "-" ? lockers.collect(item) : lockers.free));
    }
  - |
    class Lockers {
      #slots;
      constructor(n) { this.#slots = Array(n).fill(null); }
      store(parcel) {
        const free = this.#slots.indexOf(null);
        if (free === -1) return -1;
        this.#slots[free] = parcel;
        return free + 1;
      }
      collect(number) {
        return this.#slots[number - 1] ?? null;
      }
      get free() { return this.#slots.filter((s) => s === null).length; }
    }
    function runCounter(n, operations) {
      const lockers = new Lockers(n);
      return operations.map(([op, item]) => (op === "+" ? lockers.store(item) : op === "-" ? lockers.collect(item) : lockers.free));
    }
  - |
    class Lockers {
      #slots;
      constructor(n) { this.#slots = Array(n).fill(null); }
      store(parcel) {
        const free = this.#slots.indexOf(null);
        if (free === -1) return -1;
        this.#slots[free] = parcel;
        return free + 1;
      }
      collect(number) {
        const parcel = this.#slots[number - 1];
        this.#slots[number - 1] = null;
        return parcel;
      }
      get free() { return this.#slots.filter((s) => s === null).length; }
    }
    function runCounter(n, operations) {
      const lockers = new Lockers(n);
      return operations.map(([op, item]) => (op === "+" ? lockers.store(item) : op === "-" ? lockers.collect(item) : lockers.free));
    }
tests:
  - name: uses a Lockers class
    source: 'class\s+Lockers\b'
  - name: keeps the lockers in a private field
    source: '#\w+'
    msg: "The lockers go in a private field, with #, so nobody changes them from outside."
  - name: free is a getter
    source: 'get\s+free\s*\('
```

## Final mission

```exercise
id: js12-mision-rapidito
type: mission
title: Rapidito's first day
prompt: |
  Write the class `Courier` and use it to leave each parcel in `jobs` at its destination, in order; at the end, Chasqui says how many deliveries it made.

  Chasqui already takes the parcels from the depot (those lines come written). The square has no obstacles, so to reach a tile it's enough to go horizontally first and then vertically. Your class:

  - keeps the robot in a **private** field `#robot` (you pass it in when creating it: `new Courier(robot)`) and counts its deliveries in another, `#deliveries`;
  - `goTo(destination)`: takes the robot to `{ x, y }` with `robot.followPath(steps)`, where `steps` is a list like `["E", "E", "S"]` (`"W"` is west);
  - `deliver(parcel, destination)`: goes to the destination and drops that parcel with `robot.drop(parcel)`;
  - `get deliveries`: how many so far.

  When done: `robot.say(`${courier.deliveries} deliveries`)`. The jobs change in each test.
visual:
  figure:
    title: How to reach a destination
    panes:
      - { label: "from (4, 1) to (9, 4)", grid: ["############", "#...R......#", "#..........#", "#..........#", "#..........#", "############"], path: ["4,1", "5,1", "6,1", "7,1", "8,1", "9,1", "9,2", "9,3", "9,4"] }
      - { label: "steps", table: { head: ["axis", "difference", "steps"], rows: [["x", "9 − 4 = 5", "\"E\" × 5"], ["y", "4 − 1 = 3", "\"S\" × 3"]] } }
starter: |
  // jobs: [{ parcel: "cheese ice cream", destination: { x: 9, y: 4 } }, …]
  // The parcels wait in a row to Chasqui's right: take them.
  for (let i = 0; i < jobs.length; i++) {
    robot.forward();
    robot.take();
  }

  class Courier {
    // TODO: private #robot and #deliveries, constructor(robot),
    // goTo(destination), deliver(parcel, destination) and get deliveries
  }

  // TODO: create a Courier, deliver each job in order
  // and have Chasqui say how many deliveries it made.
solution: |
  for (let i = 0; i < jobs.length; i++) {
    robot.forward();
    robot.take();
  }

  class Courier {
    #robot;
    #deliveries = 0;
    constructor(robot) {
      this.#robot = robot;
    }
    goTo({ x, y }) {
      const { position } = this.#robot;
      const dx = x - position.x;
      const dy = y - position.y;
      const steps = [];
      for (let i = 0; i < Math.abs(dx); i++) {
        steps.push(dx > 0 ? "E" : "W");
      }
      for (let i = 0; i < Math.abs(dy); i++) {
        steps.push(dy > 0 ? "S" : "N");
      }
      this.#robot.followPath(steps);
    }
    deliver(parcel, destination) {
      this.goTo(destination);
      this.#robot.drop(parcel);
      this.#deliveries++;
    }
    get deliveries() {
      return this.#deliveries;
    }
  }

  const courier = new Courier(robot);
  for (const { parcel, destination } of jobs) {
    courier.deliver(parcel, destination);
  }
  robot.say(`${courier.deliveries} deliveries`);
hints:
  - "In `goTo`, read `this.#robot.position`, work out `dx` and `dy`, and build the list: `dx` steps `\"E\"` (or `\"W\"` if it's negative) and then `dy` steps `\"S\"` (or `\"N\"`)."
  - "`deliver` uses `this.goTo(destination)`; a method can call another one of the same object with `this`."
world:
  theme: barranco
  level: 4
  dir: E
  api: [move, cargo, path]
  items: { a: cheese ice cream, b: stuffed rocoto, c: adobo, d: chupe }
  map: |
    ############
    #Rabc......#
    #..........#
    #..........#
    #..........#
    ############
globals:
  jobs:
    - { parcel: cheese ice cream, destination: { x: 9, y: 4 } }
    - { parcel: stuffed rocoto, destination: { x: 2, y: 3 } }
    - { parcel: adobo, destination: { x: 6, y: 2 } }
scenarios:
  - {}
  - map: |
      ##########
      #Rab.....#
      #........#
      #........#
      ##########
    globals:
      jobs:
        - { parcel: stuffed rocoto, destination: { x: 8, y: 1 } }
        - { parcel: cheese ice cream, destination: { x: 1, y: 3 } }
  - map: |
      #############
      #Rabcd......#
      #...........#
      #...........#
      #...........#
      #...........#
      #############
    globals:
      jobs:
        - { parcel: chupe, destination: { x: 11, y: 5 } }
        - { parcel: adobo, destination: { x: 3, y: 5 } }
        - { parcel: cheese ice cream, destination: { x: 7, y: 3 } }
        - { parcel: stuffed rocoto, destination: { x: 1, y: 2 } }
tests:
  - name: there's a Courier class
    source: 'class\s+Courier\b'
  - name: a new Courier has 0 deliveries
    expect: new Courier(robot).deliveries === 0
  - name: the robot and the deliveries are private
    source: '#robot\b[\s\S]*#deliveries\b|#deliveries\b[\s\S]*#robot\b'
    msg: "Keep the robot in #robot and the count in #deliveries."
  - name: deliveries is a getter
    source: 'get\s+deliveries\s*\('
  - name: each parcel ends up at its destination, in order
    state: 'w.dropped.length === g.jobs.length && w.dropped.every((d, i) => d.item === g.jobs[i].parcel && d.x === g.jobs[i].destination.x && d.y === g.jobs[i].destination.y)'
    msg: Some parcel didn't end up at its destination (or not in the order of jobs).
  - name: Chasqui says how many deliveries it made
    state: 'w.said.includes(`${g.jobs.length} deliveries`)'
  - name: no crashing
    state: '!w.crashed'
```

## Expert challenge

```exercise
id: js12-reto-ruta
type: challenge
title: A route you can walk with for...of
prompt: |
  Write the class `Route`, which keeps legs like `{ steps: 3, dir: "E" }`, with:

  - `static fromText(text)`: creates a route from text like `"3E 2S 1W"`.
  - `get length`: the total number of steps.
  - that it can be walked **step by step** with `for...of` (`[...route]` gives `["E", "E", "E", "S", "S", "W"]`).

  Expert hint: a method `*[Symbol.iterator]()` with `yield`.
starter: |
  class Route {
  }

  const route = Route.fromText("3E 2S 1W");
  console.log(route.length, [...route].join(""));
solution: |
  class Route {
    #legs;
    constructor(legs) {
      this.#legs = legs;
    }
    static fromText(text) {
      const legs = text.split(" ").map((t) => ({ steps: Number(t.slice(0, -1)), dir: t.at(-1) }));
      return new Route(legs);
    }
    get length() {
      return this.#legs.reduce((sum, leg) => sum + leg.steps, 0);
    }
    *[Symbol.iterator]() {
      for (const { steps, dir } of this.#legs) {
        for (let i = 0; i < steps; i++) {
          yield dir;
        }
      }
    }
  }

  const route = Route.fromText("3E 2S 1W");
  console.log(route.length, [...route].join(""));
hints:
  - "`static` makes the method be called on the class (`Route.fromText`), not on a route."
  - Each leg is a number with a letter at the end; `slice(0, -1)` and `at(-1)` split them.
tests:
  - name: the example
    output: 6 EEESSW
  - name: two-digit legs
    run: '[...Route.fromText("12N 1E")].length'
    equals: 13
  - name: walks with for...of
    run: '(() => { const steps = []; for (const s of Route.fromText("2S 1E")) steps.push(s); return steps; })()'
    equals: ["S", "S", "E"]
```
