# Session 5 — Arrays

## The job

Gamarra, in La Victoria, a week before the Christmas rush. At stall 214 of the Los Telares arcade, Señora Nélida Paucar sells t-shirts by the bale to wholesalers who come down from Huancayo and Huánuco. Her stock lives in her head and in a notebook with coffee stains. Yesterday she sold the same bale of jackets twice and had to refund the money with a very forced smile.

Nélida doesn't need a robot to carry things: she has her nephew Brayan. She needs one that **keeps count**. And the stock isn't one number or two: it's a row of bales that grows when goods arrive and shrinks with every sale. One variable per bale won't do. Today Chasqui learns to keep **a whole list** in a single variable.

```scene
theme: barranco
level: 4
dir: E
items: { a: t-shirt, b: jeans, c: jacket, d: sweater }
api: [move, deliver, cargo]
caption: The corridor of the Los Telares arcade. Each lettered box is a bale; Chasqui takes the ones in the order and carries them to the wholesaler's van (the mailbox at the end).
map: |
  ##############
  #R.a.b.d.a.cD#
  ##############
program: |
  robot.forward(2);
  robot.take();
  robot.forward(8);
  robot.take();
  robot.forward();
  robot.deliver("2 items");
```

## The minimum

An **array** is an ordered list of values in a single variable. Each value has a position, its **index**, which starts at **0**.

```js run
const bales = ["t-shirt", "jeans", "jacket"];
console.log(bales[0], bales.length);
bales.push("sweater");
console.log(bales.includes("jeans"), bales.indexOf("cap"));
const [first, ...rest] = bales;
console.log(first, rest);
```

At the stall, bales get stacked: the last one to arrive ends up on top and is the first one sold. That's exactly what `push` and `pop` do with the end of the array. (In the picture below the array is a row; imagine its end as the top of the pile.)

```anim
title: push adds at the end, pop takes from the end
code: |
  const pile = ["jeans", "t-shirt"];
  pile.push("jacket");
  pile.push("sweater");
  const sold = pile.pop();
  const left = pile.length;
  console.log(sold, left);
cells: { of: pile }
notes:
  2: "push adds at the end: the pile grows to 3."
  3: "One more on top: now there are 4."
  4: "pop takes the last one (the sweater) and returns it."
  5: "length counts how many are left: 3."
```

- **Create and read**: `const list = [a, b, c]`, `list[0]` is the first, `list[list.length - 1]` the last. An index that doesn't exist gives `undefined`, not an error.
- **`push(x)`** adds at the end; **`pop()`** removes the last one and returns it (on an empty array it returns `undefined`).
- **Search**: `list.includes(x)` says `true` or `false`; `list.indexOf(x)` gives the position, or **`-1`** if it isn't there.
- **Walk through**: `for (const bale of bales)` visits each value, in order (you saw it in session 3).
- **Destructure**: `const [a, b] = list` takes the first positions; `const [first, ...rest] = list` splits the first from the rest.
- **Copy**: `const copy = [...list]` makes a new array with the same values.

That last point matters more than it seems. An array isn't copied with `=`: `=` gives **the same array another name**.

```anim
title: Two names, one array
code: |
  const display = ["t-shirt", "jeans"];
  const otherName = display;
  const copy = [...display];
  otherName.push("cap");
  console.log(display.length, copy.length);
refs: true
caption: "A name with an arrow doesn't contain the array: it points to it. Two arrows to the same box are one array."
notes:
  1: "display points to an array with two items."
  2: "otherName isn't a copy: it's a second arrow to the same array. No new array was born."
  3: "copy really is a new array, with the same values; it has its own arrow."
  4: "We add through otherName... and since it's the same array, display sees it too."
  5: "display has 3, the copy still has 2."
```

`const` doesn't stop you changing the contents: it stops the name from pointing to another array. That's why `const bales = []` and then `bales.push(…)` is fine. In the picture, the padlock is on the arrow, not on the box:

```anim
title: const locks the arrow, not the contents
code: |
  const bales = ["polo"];
  bales.push("jeans");
  bales = ["cap"];
refs: true
locked: [bales]
notes:
  1: "bales points to an array."
  2: "The contents do change: the arrow stays the same."
  3: "Making the name point somewhere else is what `const` forbids: it's an error."
```

> **Common trap:** `if (list.indexOf(x))` to ask whether `x` is there. If `x` is at position `0`, `indexOf` gives `0`, which is *falsy*, and if it isn't there it gives `-1`, which is *truthy*: the `if` works exactly backwards in those two cases. To ask "is it there?", use `includes`.

<!-- legacy: array-includes -->

<!-- legacy: array-copy -->

<!-- mdn: arrays array-push array-pop array-includes array-indexof destructuring spread -->

## Practice

```exercise
id: js5-predice-tallas
type: predict
title: The box of sizes
prompt: |
  What does it print?
visual:
  figure:
    panes:
      - { label: sizes, cells: ["S", "M", "L", "XL"] }
code: |
  const sizes = ["S", "M", "L", "XL"];
  console.log(sizes[1], sizes.length, sizes[sizes.length - 1], sizes[4]);
options:
  - "M 4 XL undefined"
  - "S 4 XL undefined"
  - "M 3 L XL"
  - "M 4 XL Error"
answer: "M 4 XL undefined"
explain: |
  Indexes start at 0, so `sizes[1]` is the second one: `"M"`. There are 4 sizes, the last one is at position `4 - 1 = 3`, and `sizes[4]` doesn't exist: it's `undefined`, no error.
```

```exercise
id: js5-predice-copia
type: predict
title: Brayan's display
prompt: |
  Brayan wants to try how the display would look with a cap, "without touching the real one". What does it print?
code: |
  const display = ["t-shirt", "jeans"];
  const trial = display;
  trial.push("cap");
  console.log(display.length);
options:
  - "2"
  - "3"
  - "undefined"
  - "Error"
answer: "3"
explain: |
  `trial = display` doesn't copy: it gives the same array another name, so the cap went into the real display. To try without touching it: `const trial = [...display];`.
```

```exercise
id: js5-completa-pila
type: complete
title: The stall's pile
prompt: |
  A bale of sweaters arrives and goes on top; then a wholesaler buys the one on top. Fill in the gaps so the pile and the sale come out right.
visual:
  figure:
    input: { label: "pile at opening", cells: ["jeans", "t-shirt", "jacket"] }
    arrow: "sweater arrives, the top one is sold"
    output: { label: "pile at closing", cells: ["jeans", "t-shirt", "jacket"] }
    steps:
      - "The sweater goes on top (at the end) and leaves with the sale: the pile ends up the same."
starter: |
  const pile = ["jeans", "t-shirt", "jacket"];
  pile.___("sweater");
  const sold = pile.___();
  console.log(`Sold: ${sold}`);
  console.log(`${pile.___} bales left; on top is the ${pile[pile.length - ___]}`);
solution: |
  const pile = ["jeans", "t-shirt", "jacket"];
  pile.push("sweater");
  const sold = pile.pop();
  console.log(`Sold: ${sold}`);
  console.log(`${pile.length} bales left; on top is the ${pile[pile.length - 1]}`);
hints:
  - Adding at the end is `push`; taking the last one is `pop`.
  - The last element is at position `length - 1`.
tests:
  - name: the sweater is sold
    outputIncludes: "Sold: sweater"
  - name: 3 left, the jacket on top
    outputIncludes: "3 bales left; on top is the jacket"
```

```exercise
id: js5-arregla-indexof
type: fix
title: The t-shirt that "wasn't there"
prompt: |
  A wholesaler asked for t-shirts and the stall's program said there were none, with a bale of t-shirts right there. He asked for sweaters, which there aren't, and it said yes. Fix the condition.
visual:
  figure:
    input: { label: stock, cells: ["t-shirt", "jeans", "jacket"] }
    arrow: "stock.indexOf(...)"
    output: { label: "what it returns", table: { head: ["question", "indexOf", "the if reads it as"], rows: [["t-shirt", "0", "false (but it's there!)"], ["sweater", "-1", "true (but it isn't!)"]] } }
starter: |
  const stock = ["t-shirt", "jeans", "jacket"];

  function inStock(item) {
    if (stock.indexOf(item)) {
      return "in stock";
    }
    return "out of stock";
  }

  console.log("t-shirt:", inStock("t-shirt"));
  console.log("sweater:", inStock("sweater"));
solution: |
  const stock = ["t-shirt", "jeans", "jacket"];

  function inStock(item) {
    if (stock.includes(item)) {
      return "in stock";
    }
    return "out of stock";
  }

  console.log("t-shirt:", inStock("t-shirt"));
  console.log("sweater:", inStock("sweater"));
hints:
  - "`indexOf` returns a position, not a yes or no. Which method answers exactly \"is it there?\"?"
tests:
  - name: t-shirts in stock
    run: inStock("t-shirt")
    equals: in stock
  - name: no sweaters
    run: inStock("sweater")
    equals: out of stock
  - name: jackets in stock
    run: inStock("jacket")
    equals: in stock
```

```exercise
id: js5-predice-desestructura
type: predict
title: The first one to the display
prompt: |
  Bales come in order of arrival. The first goes to the display and the rest to the back room. What does it print?
code: |
  const arrivals = ["jacket", "t-shirt", "jeans", "sweater"];
  const [display, ...backRoom] = arrivals;
  console.log(display, backRoom.length, arrivals.length);
options:
  - "jacket 3 4"
  - "jacket 3 1"
  - "[jacket] 3 4"
  - "sweater 3 4"
answer: "jacket 3 4"
explain: |
  `[display, ...backRoom]` takes the first position and gathers the others into a **new** array. `arrivals` doesn't change: it still has 4.
```

```exercise
id: js5-escribe-sin-repetir
type: write
title: The list without repeats
prompt: |
  Write `withoutRepeats(orders)`, which returns a **new** array with each item only once, in the order it first appeared.

  Wholesalers send their order over WhatsApp, in bits, and repeat things. Brayan needs the clean list to find the bales. Don't modify the array you receive.
visual:
  figure:
    input: { label: orders, cells: ["t-shirt", "jeans", "t-shirt", "jacket", "jeans"], highlight: [2, 4] }
    arrow: "the highlighted ones had already appeared"
    output: { label: returns, cells: ["t-shirt", "jeans", "jacket"] }
starter: |
  function withoutRepeats(orders) {
  }

  console.log(withoutRepeats(["t-shirt", "jeans", "t-shirt", "jacket", "jeans"]));
solution: |
  function withoutRepeats(orders) {
    const clean = [];
    for (const item of orders) {
      if (!clean.includes(item)) {
        clean.push(item);
      }
    }
    return clean;
  }

  console.log(withoutRepeats(["t-shirt", "jeans", "t-shirt", "jacket", "jeans"]));
hints:
  - Start with an empty array and walk through `orders` with `for...of`.
  - "Add an item only if your new list doesn't include it yet: `!clean.includes(item)`."
tests:
  - name: the example
    run: 'withoutRepeats(["t-shirt", "jeans", "t-shirt", "jacket", "jeans"])'
    equals: ["t-shirt", "jeans", "jacket"]
  - name: all the same
    run: 'withoutRepeats(["cap", "cap", "cap"])'
    equals: ["cap"]
  - name: empty list
    run: withoutRepeats([])
    equals: []
  - name: doesn't modify the original
    expect: '(() => { const o = ["cap", "cap"]; withoutRepeats(o); return o.length === 2; })()'
    msg: Build a new array with push; don't remove anything from the one you receive.
```

## The case

```exercise
id: js5-caso-fardo
type: case
title: The bale that vanished
prompt: |
  Find the code of the bale that was there in the morning, wasn't sold, and was gone by night.

  Nélida went out for lunch and left Brayan in charge. In the morning she wrote down the stall's 24 bales; Brayan wrote down what he sold, and at night they counted again. One is missing. Careful: a new bale arrived at noon, so at night there's one that wasn't there in the morning; that one is no mystery.

  For each morning bale, ask two things: was it sold? is it there at night? The one that answers "no" and "no" is the one you're after.
visual:
  figure:
    title: The method, on a small example (one column per morning bale)
    panes:
      - { label: "morning: A, B, C, D · sold: B · night: A, D", table: { head: ["morning bale", "A", "B", "C", "D"], rows: [["sold?", "no", "yes", "no", "no"], ["there at night?", "yes", "—", "no", "yes"], ["missing?", "", "", "**yes**", ""]] } }
      - { label: "in the small example, missing", value: "C" }
starter: |
  const morning = ["P-101", "P-102", "J-210", "C-305", "P-103", "CH-401", "J-211", "P-104",
    "C-306", "CH-402", "J-212", "P-105", "C-307", "P-106", "CH-403", "J-213", "C-308", "P-107",
    "J-214", "CH-404", "P-108", "C-309", "J-215", "P-109"];
  const sold = ["P-102", "J-211", "C-306", "P-105", "CH-403", "J-214", "P-108", "C-309", "P-101"];
  const night = ["J-210", "C-305", "P-103", "CH-401", "P-104", "CH-402", "J-212", "C-307", "P-106",
    "J-213", "C-308", "P-107", "CH-404", "J-216", "P-109"];

  console.log(`Morning: ${morning.length} · sold: ${sold.length} · night: ${night.length}`);

  // TODO: walk through morning and, for each bale, check whether sold includes it
  // and whether night includes it. Print the one that's in neither.
solution: |
  const morning = ["P-101", "P-102", "J-210", "C-305", "P-103", "CH-401", "J-211", "P-104",
    "C-306", "CH-402", "J-212", "P-105", "C-307", "P-106", "CH-403", "J-213", "C-308", "P-107",
    "J-214", "CH-404", "P-108", "C-309", "J-215", "P-109"];
  const sold = ["P-102", "J-211", "C-306", "P-105", "CH-403", "J-214", "P-108", "C-309", "P-101"];
  const night = ["J-210", "C-305", "P-103", "CH-401", "P-104", "CH-402", "J-212", "C-307", "P-106",
    "J-213", "C-308", "P-107", "CH-404", "J-216", "P-109"];

  for (const bale of morning) {
    if (!sold.includes(bale) && !night.includes(bale)) {
      console.log("Missing:", bale);
    }
  }
answer: J-215
answerLabel: Which bale is missing? (its code)
reveal: |
  J-215, a bale of jeans. The counts add up: 24 in the morning − 9 sold = 15, and there are 15 at night... but one of those 15 is J-216, which arrived at noon. Counting wasn't enough: you had to compare the lists. (Brayan swore he knew nothing. A week later he showed up in new jeans.)
hints:
  - "A `for...of` over `morning`, and inside it an `if` with two questions joined by `&&`."
  - "\"Not in sold\" is written `!sold.includes(bale)`."
```

## The judge

As in session 4, the judge **calls your functions** and compares what they return.

```exercise
id: js5-juez-pila
type: judge
mode: function
function: finalPile
title: The pile at closing time
prompt: |
  Write `finalPile(pile, ops)`, which returns how the pile of bales ends up after all the operations, and `sales(pile, ops)`, which returns what was sold, in order.

  At the stall, bales are stacked by size (`"S"`, `"M"`, `"L"`, `"XL"`). `pile` is the pile at opening, bottom to top (the last one is on top). `ops` is the list of what happened during the day, in order:

  - `["+", size]`: a bale of that size arrives and goes **on top**.
  - `["-"]`: a wholesaler buys the bale **on top**. If the pile is empty, nothing happens (and nothing is sold).

  Don't modify the `pile` array you receive: work on a copy.

  **Constraints:** the pile starts with 0 to 10 bales · 0 to 40 operations.
visual:
  figure:
    title: Sample 1, operation by operation
    panes:
      - { table: { head: ["operation", "pile after (bottom to top)", "sold"], rows: [["at opening", "M", ""], ["[\"+\", \"L\"]", "M, L", ""], ["[\"+\", \"S\"]", "M, L, S", ""], ["[\"-\"]", "M, L", "S"], ["[\"+\", \"XL\"]", "M, L, XL", ""], ["[\"-\"]", "M, L", "XL"], ["[\"-\"]", "M", "L"]] } }
      - { label: "finalPile returns", cells: ["M"] }
      - { label: "sales returns", cells: ["S", "XL", "L"] }
starter: |
  function finalPile(pile, ops) {
  }

  function sales(pile, ops) {
  }
solution: |
  function finalPile(pile, ops) {
    const copy = [...pile];
    for (const [kind, size] of ops) {
      if (kind === "+") {
        copy.push(size);
      } else {
        copy.pop();
      }
    }
    return copy;
  }

  function sales(pile, ops) {
    const copy = [...pile];
    const sold = [];
    for (const [kind, size] of ops) {
      if (kind === "+") {
        copy.push(size);
      } else if (copy.length > 0) {
        sold.push(copy.pop());
      }
    }
    return sold;
  }
hints:
  - "Destructure each operation in the `for...of`: `for (const [kind, size] of ops)`. In `[\"-\"]`, `size` is `undefined`, and that's fine."
  - "In `sales`, before `pop`, check that the pile has something: `pop` on an empty pile returns `undefined`, and that isn't a sale."
samples:
  - args: [["M"], [["+", "L"], ["+", "S"], ["-"], ["+", "XL"], ["-"], ["-"]]]
    returns: ["M"]
    note: The table above, step by step.
  - fn: sales
    args: [["M"], [["+", "L"], ["+", "S"], ["-"], ["+", "XL"], ["-"], ["-"]]]
    returns: ["S", "XL", "L"]
    note: The same day, now what was sold. The judge tests both functions.
  - args: [["S", "S"], []]
    returns: ["S", "S"]
    note: A day with no movement.
edge:
  - args: [[], [["-"], ["-"]]]
    tag: when asked to sell with an empty pile
  - fn: sales
    args: [[], [["-"], ["+", "M"], ["-"], ["-"]]]
    tag: in sales, when the pile is empty now and then
  - fn: sales
    args: [["L", "XL"], [["-"], ["-"], ["-"]]]
    tag: in sales, selling the whole pile and one more
  - args: [["XL", "S", "M"], [["+", "L"], ["+", "L"]]]
    tag: when bales only arrive
  - fn: sales
    args: [["XL", "S", "M"], [["+", "L"]]]
    tag: in sales, a day with no sales
random:
  count: 40
  seed: 55
  generate: |
    const sizes = ["S", "M", "L", "XL"];
    const pile = Array.from({ length: rng.int(0, 10) }, () => rng.pick(sizes));
    const ops = Array.from({ length: rng.int(0, 40) }, () => (rng.int(0, 1) === 0 ? ["-"] : ["+", rng.pick(sizes)]));
    return [pile, ops];
wrong:
  - |
    function finalPile(pile, ops) {
      const copy = [...pile];
      for (const [kind, size] of ops) {
        if (kind === "+") copy.push(size);
        else copy.shift();
      }
      return copy;
    }
    function sales(pile, ops) {
      const copy = [...pile];
      const sold = [];
      for (const [kind, size] of ops) {
        if (kind === "+") copy.push(size);
        else if (copy.length > 0) sold.push(copy.shift());
      }
      return sold;
    }
  - |
    function finalPile(pile, ops) {
      const copy = [...pile];
      for (const [kind, size] of ops) {
        if (kind === "+") copy.push(size);
        else copy.pop();
      }
      return copy;
    }
    function sales(pile, ops) {
      const copy = [...pile];
      const sold = [];
      for (const [kind, size] of ops) {
        if (kind === "+") copy.push(size);
        else sold.push(copy.pop());
      }
      return sold;
    }
  - |
    function finalPile(pile, ops) {
      const copy = [];
      for (const [kind, size] of ops) {
        if (kind === "+") copy.push(size);
        else copy.pop();
      }
      return copy;
    }
    function sales(pile, ops) {
      const copy = [];
      const sold = [];
      for (const [kind, size] of ops) {
        if (kind === "+") copy.push(size);
        else if (copy.length > 0) sold.push(copy.pop());
      }
      return sold;
    }
```

## Final mission

```exercise
id: js5-mision-gamarra
type: mission
title: The Huancayo order
prompt: |
  Walk the corridor, keep **one** item of each kind in the `order`, and deliver them to the van at the end (D) with the label `` `${count} items` ``.

  Chasqui starts facing east. There are bales in the corridor (the lettered boxes). On each tile:

  - `robot.take()` picks up the bale on that tile and returns its name (`"t-shirt"`, `"jeans"`…), or `null` if there was nothing.
  - If that item **isn't in the order**, or **you already carry one like it**, put it back with `robot.drop(item)`.

  Keep your own array of what you kept. At the end, `robot.deliver(...)` with the count: `"2 items"`. The corridor and the order change in each test.
visual:
  figure:
    title: "The first corridor, with the order [\"t-shirt\", \"jacket\"] (one column per tile)"
    panes:
      - { table: { head: ["tile", "a", "b", "d", "a", "c"], rows: [["item", "t-shirt", "jeans", "sweater", "t-shirt", "jacket"], ["in the order?", "yes", "no", "no", "yes", "yes"], ["already carry one?", "no", "", "", "**yes**", "no"], ["Chasqui", "keeps it", "drops it", "drops it", "drops it", "keeps it"]] } }
      - { label: "on reaching D", value: "deliver(\"2 items\")" }
starter: |
  // order arrives over WhatsApp, for example: ["t-shirt", "jacket"]
  const kept = [];

  robot.forward();
  const item = robot.take();
  console.log(item);
solution: |
  const kept = [];

  while (!robot.wallAhead()) {
    robot.forward();
    const item = robot.take();
    if (item !== null) {
      if (order.includes(item) && !kept.includes(item)) {
        kept.push(item);
      } else {
        robot.drop(item);
      }
    }
  }
  robot.deliver(`${kept.length} items`);
hints:
  - "The walk is the one from session 3: `while (!robot.wallAhead())`, move forward, then look at the tile."
  - "Keep it if `order.includes(item) && !kept.includes(item)`; otherwise `robot.drop(item)`."
world:
  theme: barranco
  level: 4
  dir: E
  api: [move, deliver, cargo]
  items: { a: t-shirt, b: jeans, c: jacket, d: sweater }
  map: |
    ##############
    #R.a.b.d.a.cD#
    ##############
globals:
  order: ["t-shirt", "jacket"]
scenarios:
  - {}
  - map: |
      ###################
      #R.d.c.c.b.ab.d.aD#
      ###################
    globals: { order: ["jeans", "sweater", "t-shirt"] }
  - map: |
      ########
      #R.bb.D#
      ########
    globals: { order: ["jeans"] }
tests:
  - name: carries one item of each kind in the order
    state: 'JSON.stringify([...w.inventory].sort()) === JSON.stringify([...g.order].sort())'
    msg: What Chasqui carries isn't the order (something extra, missing or repeated). Look at the table above.
  - name: reaches the van and delivers once, with the count
    state: 'w.atGoal && w.delivered.length === 1 && w.delivered[0] === `${g.order.length} items`'
    msg: Deliver once, on D, with a label like "2 items".
  - name: no crash
    state: '!w.crashed'
  - name: uses includes
    source: '\.includes\s*\('
```

## Expert challenge

```exercise
id: js5-reto-rotar
type: challenge
title: The rotating display
prompt: |
  Nélida rotates the mannequins in the display: every day, the first one moves to the end. Write `rotate(display, days)`, which returns the display after `days` days, **without modifying** the one it receives. `days` can be larger than the number of mannequins (and the display can be empty).
starter: |
  function rotate(display, days) {
    return display;
  }

  console.log(rotate(["t-shirt", "jeans", "jacket"], 1));
solution: |
  function rotate(display, days) {
    if (display.length === 0) {
      return [];
    }
    const k = days % display.length;
    return [...display.slice(k), ...display.slice(0, k)];
  }

  console.log(rotate(["t-shirt", "jeans", "jacket"], 1));
hints:
  - "Rotating `display.length` days leaves everything the same: `days % display.length` is enough."
  - "`list.slice(from, to)` copies a stretch; join two stretches with `[...a, ...b]`."
tests:
  - name: one day
    run: 'rotate(["t-shirt", "jeans", "jacket"], 1)'
    equals: ["jeans", "jacket", "t-shirt"]
  - name: seven days with three mannequins
    run: 'rotate(["t-shirt", "jeans", "jacket"], 7)'
    equals: ["jeans", "jacket", "t-shirt"]
  - name: zero days
    run: 'rotate(["t-shirt", "jeans"], 0)'
    equals: ["t-shirt", "jeans"]
  - name: empty display
    run: rotate([], 3)
    equals: []
  - name: doesn't modify the original display
    expect: '(() => { const d = ["a", "b", "c"]; rotate(d, 1); return d[0] === "a" && d.length === 3; })()'
```
