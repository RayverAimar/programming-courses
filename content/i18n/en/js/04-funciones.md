# Session 4 — Functions

## The job

Saturday, one in the afternoon, La Chalupa cevichería in Chorrillos. The queue reaches the beach, Señora Delia slices fish like a machine and the waiter went off to watch the match. Delia called Loop: "Send me that robot of yours, but don't let it lose me any plates."

We gave Chasqui an arm with a tray. The trouble is that serving one dish takes six instructions, and a Saturday is forty dishes. Writing 240 lines isn't programming: it's copying. Today Chasqui learns to **give a routine a name** and use it as many times as needed.

```scene
theme: cocina
level: 4
dir: E
caption: La Chalupa at one in the afternoon. Chasqui cooks in the kitchen (K), carries the dish down the corridor and serves it to the table below.
map: |
  #############
  #K..........#
  ##1#2#3#4#5##
  #############
program: |
  robot.cook("ceviche");
  robot.forward(3);
  robot.serve();
  robot.turnRight();
  robot.turnRight();
  robot.forward(3);
```

## The minimum

A function is a block of code with a name. It receives data through its **parameters** and hands back a result with **`return`**.

```js run
function subtotal(price, quantity = 1) {
  return price * quantity;
}

const withTax = (amount) => amount * 1.18;

console.log(subtotal(35, 2));
console.log(subtotal(8));
console.log(withTax(100).toFixed(2));
```

Watch what happens when one function calls another: each call opens a box with its inputs, and when it reaches `return` the box closes and hands back its result.

Calls in progress pile up on the **call stack**: the one running now is on top and the ones below wait for its result. The top one finishes first.

```figure
title: The call stack at the moment `subtotal` runs
panes:
  - { label: "On top: the one running now", cards: [{ title: "subtotal(35, 2)", rows: [["price", "35"], ["quantity", "2"]] }] }
  - { label: "Below: waits for the top one to return", cards: [{ title: "bill(35, 2, 5)", rows: [["price", "35"], ["quantity", "2"], ["tip", "5"]] }] }
caption: "When `subtotal` returns 70, its card leaves the stack and `bill` carries on where it stopped."
```

```anim
title: A call is a box with inputs and an output
code: |
  function subtotal(price, quantity) {
    return price * quantity;
  }
  function bill(price, quantity, tip) {
    const base = subtotal(price, quantity);
    return base + tip;
  }
  const total = bill(35, 2, 5);
  console.log(total);
notes:
  4: "bill's box opens with its three inputs."
  1: "bill called subtotal: the call stack grows."
  5: "base receives what subtotal returned: 70."
  2: "subtotal returns 70 and its box closes."
  6: "bill returns 75 to whoever called it."
```

- **`function name(params) { … }`** declares a named function. It's the natural form for the pieces of your program.
- **Arrow functions**: `(amount) => amount * 1.18`. If the body is a single expression, it's returned on its own, no `return`. Ideal for short functions.
- **Default parameters**: `quantity = 1` is used when that argument isn't passed.
- **Destructuring**: `function serveOrder({ table, dish })` pulls those properties out of the object you're given. And `...` spreads an array (`Math.max(...prices)`) or gathers arguments (`function sum(...nums)`).
- **`return` ends the function.** What `console.log` prints shows up in the console, but it doesn't go back to the program: to use a result, return it.

As a program grows, its functions get split across files (**modules**). One exports, another imports:

```js
// kitchen.js
export function serveOrder(order) { /* … */ }

// main.js
import { serveOrder } from "./kitchen.js";
```

`export` makes a name available to other files; `import` asks for it, and the `./` means "in this file's folder". In the exercises everything lives in one file, but this is what a real project looks like. How the files find each other and in what order they run is drawn in session 12.

> **Common trap:** a function without `return` returns `undefined`. If you see `undefined` where you expected a number, look for the missing `return`.

<!-- legacy: arrow-functions -->

<!-- legacy: default-parameters -->

<!-- legacy: destructuring -->

<!-- legacy: modules -->

<!-- mdn: functions arrow-functions default-parameters destructuring spread modules -->

## Practice

```exercise
id: js4-predice-propina
type: predict
title: The missing tip
prompt: |
  What does it print?
code: |
  function charge(total, tip) {
    return total + tip;
  }
  console.log(charge(40, 5));
  console.log(charge(40));
options:
  - "45\n40"
  - "45\nNaN"
  - "45\nundefined"
  - "45\nError"
answer: "45\nNaN"
explain: |
  An argument that isn't passed arrives as `undefined`, and `40 + undefined` is `NaN`. With `tip = 0` in the signature, the second line would print 40.
```

```exercise
id: js4-completa-limones
type: complete
title: Limes and subtotals
prompt: |
  Each ceviche takes 6 limes. Complete the arrow function `limesFor` and the declaration of `subtotal`.
starter: |
  const limesFor = (dishes) => ___;

  function ___(price, quantity) {
    ___ price * quantity;
  }

  console.log(limesFor(4));
  console.log(subtotal(32, 3));
solution: |
  const limesFor = (dishes) => dishes * 6;

  function subtotal(price, quantity) {
    return price * quantity;
  }

  console.log(limesFor(4));
  console.log(subtotal(32, 3));
hints:
  - In a single-expression arrow, the expression is what gets returned.
  - The function's name is the one used below in the console.log.
tests:
  - name: limesFor(4) is 24
    run: limesFor(4)
    equals: 24
  - name: limesFor(0) is 0
    run: limesFor(0)
    equals: 0
  - name: subtotal(32, 3) is 96
    run: subtotal(32, 3)
    equals: 96
```

```exercise
id: js4-arregla-cuenta
type: fix
title: The undefined bill
prompt: |
  Table 2 asked for the bill and the receipt says `The bill is S/ undefined`. The sum is right. What's missing?
starter: |
  function orderTotal(dishes) {
    let total = 0;
    for (const { price } of dishes) {
      total += price;
    }
    console.log(total);
  }

  const bill = orderTotal([
    { name: "ceviche", price: 35 },
    { name: "chicha", price: 8 },
  ]);
  console.log(`The bill is S/ ${bill}`);
solution: |
  function orderTotal(dishes) {
    let total = 0;
    for (const { price } of dishes) {
      total += price;
    }
    return total;
  }

  const bill = orderTotal([
    { name: "ceviche", price: 35 },
    { name: "chicha", price: 8 },
  ]);
  console.log(`The bill is S/ ${bill}`);
hints:
  - console.log shows the total, but does the function hand it back to whoever called it?
tests:
  - name: orderTotal returns the sum
    run: 'orderTotal([{ name: "causa", price: 22 }, { name: "chicha", price: 8 }])'
    equals: 30
  - name: the receipt comes out right
    output: The bill is S/ 43
```

```exercise
id: js4-escribe-ticket
type: write
title: The receipt line
prompt: |
  Write the function `receiptLine(item, quantity)`, which returns the receipt line as a string. `item` is an object like `{ dish: "ceviche", price: 35 }`; `quantity` is **1 if it isn't passed**. Return a string like this:

  `receiptLine({ dish: "ceviche", price: 35 }, 2)` → `"2 x ceviche: S/ 70"`

  Destructure `item` in the parameters.
visual:
  figure:
    input: { label: "receiptLine(item, 2)", cards: [{ title: item, rows: [["dish", "\"ceviche\""], ["price", "35"]] }] }
    arrow: 2 × 35 = 70
    output: { label: returns, value: "\"2 x ceviche: S/ 70\"" }
starter: |
  function receiptLine(item, quantity) {
  }

  console.log(receiptLine({ dish: "ceviche", price: 35 }, 2));
solution: |
  function receiptLine({ dish, price }, quantity = 1) {
    return `${quantity} x ${dish}: S/ ${price * quantity}`;
  }

  console.log(receiptLine({ dish: "ceviche", price: 35 }, 2));
hints:
  - "The signature can be `function receiptLine({ dish, price }, quantity = 1)`."
tests:
  - name: two ceviches
    run: 'receiptLine({ dish: "ceviche", price: 35 }, 2)'
    equals: "2 x ceviche: S/ 70"
  - name: one chicha, without passing the quantity
    run: 'receiptLine({ dish: "chicha", price: 8 })'
    equals: "1 x chicha: S/ 8"
  - name: destructures in the parameters
    source: 'function\s+receiptLine\s*\(\s*\{'
    msg: Write { dish, price } directly in the parameters.
```

## The case

```exercise
id: js4-caso-mesa
type: case
title: The table that didn't pay in full
prompt: |
  Write `tableTotal(table)`, which adds up what a table ate, and print one line per table to compare it with what it paid.

  At closing time La Chalupa's till doesn't add up: money is missing. Delia has the menu, the list of what each table ordered (in the order it left the kitchen) and what each one paid. One table left a tip, so paying *more* isn't suspicious. Which table paid **less** than it ate?

  Print each table like this, with what it ate at the end: `Table 1: ate 51`. The board compares your number with what that table paid.
visual:
  board:
    for: js4-caso-mesa
    title: What each table paid
    task: Work out what each table ate with your function and compare it with its payment.
    cards:
      - { name: "Table 1", kind: person, role: "Paid S/ 51", clue: { find: "Table 1:", says: 51, saysLabel: "Paid" } }
      - { name: "Table 2", kind: person, role: "Paid S/ 60", clue: { find: "Table 2:", says: 60, saysLabel: "Paid" } }
      - { name: "Table 3", kind: person, role: "Paid S/ 100", clue: { find: "Table 3:", says: 100, saysLabel: "Paid" } }
      - { name: "Table 4", kind: person, role: "Paid S/ 40", clue: { find: "Table 4:", says: 40, saysLabel: "Paid" } }
      - { name: "Table 5", kind: person, role: "Paid S/ 86", culprit: true, clue: { find: "Table 5:", says: 86, saysLabel: "Paid" } }
      - { name: "Table 6", kind: person, role: "Paid S/ 67", clue: { find: "Table 6:", says: 67, saysLabel: "Paid" } }
    caption: "**Matches**: it paid exactly what it ate. If it doesn't, look at which way: paying more is a tip."
starter: |
  const menu = {
    "ceviche": 35,
    "chicharrón": 32,
    "leche de tigre": 18,
    "chicha": 8,
    "arroz con mariscos": 38,
    "causa": 22,
  };

  const orders = [
    { table: 3, dish: "ceviche" }, { table: 1, dish: "ceviche" }, { table: 5, dish: "causa" },
    { table: 2, dish: "arroz con mariscos" }, { table: 3, dish: "ceviche" }, { table: 6, dish: "ceviche" },
    { table: 1, dish: "chicha" }, { table: 5, dish: "leche de tigre" }, { table: 4, dish: "chicharrón" },
    { table: 3, dish: "causa" }, { table: 5, dish: "arroz con mariscos" }, { table: 2, dish: "leche de tigre" },
    { table: 6, dish: "chicharrón" }, { table: 1, dish: "chicha" }, { table: 5, dish: "chicha" },
    { table: 4, dish: "chicha" }, { table: 3, dish: "chicha" }, { table: 5, dish: "chicha" },
  ];

  const payments = { 1: 51, 2: 60, 3: 100, 4: 40, 5: 86, 6: 67 };

  // This is how you read an order and its price:
  const first = orders[0];
  console.log("First order: table", first.table, "ordered", first.dish, "which costs", menu[first.dish]);

  // TODO: write tableTotal(table): walk orders and add up the price
  // of the ones for that table. Return the sum.

  // TODO: print one line per table (1 to 6), like this: Table 1: ate 51
solution: |
  const menu = {
    "ceviche": 35,
    "chicharrón": 32,
    "leche de tigre": 18,
    "chicha": 8,
    "arroz con mariscos": 38,
    "causa": 22,
  };

  const orders = [
    { table: 3, dish: "ceviche" }, { table: 1, dish: "ceviche" }, { table: 5, dish: "causa" },
    { table: 2, dish: "arroz con mariscos" }, { table: 3, dish: "ceviche" }, { table: 6, dish: "ceviche" },
    { table: 1, dish: "chicha" }, { table: 5, dish: "leche de tigre" }, { table: 4, dish: "chicharrón" },
    { table: 3, dish: "causa" }, { table: 5, dish: "arroz con mariscos" }, { table: 2, dish: "leche de tigre" },
    { table: 6, dish: "chicharrón" }, { table: 1, dish: "chicha" }, { table: 5, dish: "chicha" },
    { table: 4, dish: "chicha" }, { table: 3, dish: "chicha" }, { table: 5, dish: "chicha" },
  ];

  const payments = { 1: 51, 2: 60, 3: 100, 4: 40, 5: 86, 6: 67 };

  function tableTotal(table) {
    let total = 0;
    for (const order of orders) {
      if (order.table === table) {
        total += menu[order.dish];
      }
    }
    return total;
  }

  for (let table = 1; table <= 6; table++) {
    const difference = payments[table] - tableTotal(table);
    console.log(`Table ${table}: paid ${payments[table]}, difference ${difference}, ate ${tableTotal(table)}`);
  }
answer: "5"
answerLabel: Which table underpaid? (just the number)
reveal: |
  Table 5: it ate 94 (causa, leche de tigre, arroz con mariscos and two chichas) and paid 86. Table 2 paid 4 soles extra: that was the tip.
hints:
  - "To read a dish's price: `menu[order.dish]`. Square brackets work with names that have spaces."
  - Inside the function, a `for...of` over `orders` with an `if` that adds only the ones for the table you were given.
```

## The judge

This judge doesn't read or print: it **calls your functions** and compares what they return, LeetCode-style. That's how it can judge each function on its own.

```exercise
id: js4-juez-cuenta
type: judge
mode: function
function: tableBill
title: Each table's bill
prompt: |
  Write `tableBill(orders, tip)`, which returns how much a table pays, and its two helpers `priceOf` and `subtotal`.

  Delia wants Chasqui to take payments. The menu: ceviche 35, chicharron 32, causa 22, chicha 8. An order is a pair `[dish, quantity]`, for example `["ceviche", 2]`.

  Write three functions, and the judge will test all three:

  - `priceOf(dish)`: a dish's price; **0** if it's not on the menu.
  - `subtotal(order)`: the dish's price times the quantity.
  - `tableBill(orders, tip)`: the sum of the subtotals plus the tip, which is a **percentage** of that sum rounded with `Math.round`. If no tip is passed, it's 0.

  **Constraints:** up to 6 orders per table · quantities from 0 to 10 · tip from 0 to 20.
visual:
  figure:
    title: Sample 1, as a bill
    input: { label: 'tableBill([["ceviche", 2], ["chicha", 3]], 10)', receipt: { title: LA CHALUPA, rows: [["2 × ceviche", "35 × 2", "70"], ["3 × chicha", "8 × 3", "24"]], totalLabel: "Sum of subtotals", total: "94" } }
    arrow: "+ 10 % tip: 9.4 → Math.round → 9"
    output: { label: returns, value: "103" }
    steps:
      - "`subtotal([\"ceviche\", 2])` uses `priceOf(\"ceviche\")` = 35 and returns 70."
      - "`tableBill` adds up the subtotals and adds the rounded tip."
starter: |
  function priceOf(dish) {
  }

  function subtotal(order) {
  }

  function tableBill(orders, tip) {
  }
solution: |
  const MENU = { ceviche: 35, chicharron: 32, causa: 22, chicha: 8 };

  function priceOf(dish) {
    return MENU[dish] ?? 0;
  }

  function subtotal([dish, quantity]) {
    return priceOf(dish) * quantity;
  }

  function tableBill(orders, tip = 0) {
    let sum = 0;
    for (const order of orders) {
      sum += subtotal(order);
    }
    return sum + Math.round((sum * tip) / 100);
  }
hints:
  - "Destructure the order in the parameters: `function subtotal([dish, quantity])`."
  - "`tableBill` doesn't need to know prices: let it use `subtotal`, and `subtotal` use `priceOf`."
samples:
  - args: [[["ceviche", 2], ["chicha", 3]], 10]
    returns: 103
    note: "94 of food plus 10 % (9.4, rounded to 9)."
  - args: [[["causa", 1]]]
    returns: 22
    note: No tip; a default parameter handles it.
  - fn: priceOf
    args: ["chicharron"]
    returns: 32
    note: The helper functions are judged on their own too.
edge:
  - args: [[]]
    tag: with a table that ordered nothing
  - args: [[["pulpo", 2], ["ceviche", 1]], 0]
    tag: with a dish that's not on the menu
  - fn: priceOf
    args: ["pulpo"]
    tag: in priceOf, with a dish that's not on the menu
  - fn: subtotal
    args: [["chicha", 0]]
    tag: in subtotal, with quantity zero
  - fn: subtotal
    args: [["causa", 4]]
    tag: in subtotal, used on its own
  - args: [[["ceviche", 10], ["chicharron", 10], ["causa", 10], ["chicha", 10]], 20]
    tag: with the maximum tip
random:
  count: 40
  seed: 44
  generate: |
    const dishes = ["ceviche", "chicharron", "causa", "chicha"];
    const orders = Array.from({ length: rng.int(0, 6) }, () => [rng.pick(dishes), rng.int(1, 10)]);
    return [orders, rng.int(0, 20)];
wrong:
  - |
    const MENU = { ceviche: 35, chicharron: 32, causa: 22, chicha: 8 };
    const priceOf = (dish) => MENU[dish] ?? 0;
    const subtotal = ([dish, quantity]) => priceOf(dish) * quantity;
    function tableBill(orders, tip) {
      let sum = 0;
      for (const o of orders) sum += subtotal(o);
      return sum + Math.round((sum * tip) / 100);
    }
  - |
    const MENU = { ceviche: 35, chicharron: 32, causa: 22, chicha: 8 };
    const priceOf = (dish) => MENU[dish];
    const subtotal = ([dish, quantity]) => priceOf(dish) * quantity;
    function tableBill(orders, tip = 0) {
      let sum = 0;
      for (const o of orders) sum += subtotal(o);
      return sum + Math.round((sum * tip) / 100);
    }
  - |
    function tableBill(orders, tip = 0) {
      const menu = { ceviche: 35, chicharron: 32, causa: 22, chicha: 8 };
      let sum = 0;
      for (const [dish, quantity] of orders) sum += (menu[dish] ?? 0) * quantity;
      return sum + Math.round((sum * tip) / 100);
    }
```

## Final mission

```exercise
id: js4-mision-chalupa
type: mission
title: Rush hour at La Chalupa
prompt: |
  Write `serveOrder(order)`, which takes one dish to its table and comes back, and use it to serve all the `orders` in order.

  Chasqui is in the kitchen (K) facing east. The tables are below the corridor: table `n` sits below the tile `2 × n − 1` steps from the kitchen.

  - `robot.cook(dish)` in the kitchen puts the dish on the tray (only one fits)
  - `robot.serve()` leaves the dish on the table below

  `serveOrder` cooks the dish, carries it, serves it and **comes back to the kitchen facing east**. The `orders` list changes on every test.
visual:
  figure:
    title: How many steps to each table
    panes:
      - { table: { head: ["table", "steps from the kitchen (2 × table − 1)"], rows: [["1", "1"], ["2", "3"], ["3", "5"], ["4", "7"], ["5", "9"]] } }
      - { label: "One order", cards: [{ title: "{ table: 3, dish: \"ceviche\" }", rows: [["cook", "\"ceviche\""], ["forward", "5"], ["serve", "table 3"], ["come back", "5 steps, then face east"]] }] }
starter: |
  // orders comes from the till, for example:
  // [{ table: 3, dish: "ceviche" }, { table: 1, dish: "chicharrón" }]

  const turnAround = () => {
    robot.turnRight();
    robot.turnRight();
  };

  function serveOrder(order) {
    // cook, go, serve, come back
  }
solution: |
  const turnAround = () => {
    robot.turnRight();
    robot.turnRight();
  };

  function serveOrder({ table, dish }) {
    const steps = 2 * table - 1;
    robot.cook(dish);
    robot.forward(steps);
    robot.serve();
    turnAround();
    robot.forward(steps);
    turnAround();
  }

  for (const order of orders) {
    serveOrder(order);
  }
hints:
  - "Inside `serveOrder`, work out the steps once: `const steps = 2 * table - 1;`"
  - "Outside the function, a `for...of` over `orders` that calls `serveOrder`."
world:
  theme: cocina
  level: 4
  dir: E
  map: |
    #############
    #K..........#
    ##1#2#3#4#5##
    #############
globals:
  orders:
    - { table: 3, dish: ceviche }
    - { table: 1, dish: chicharrón }
    - { table: 5, dish: causa }
scenarios:
  - {}
  - globals:
      orders:
        - { table: 2, dish: leche de tigre }
        - { table: 2, dish: chicha }
        - { table: 4, dish: arroz con mariscos }
        - { table: 1, dish: ceviche }
        - { table: 5, dish: ceviche }
  - globals:
      orders:
        - { table: 4, dish: chicha }
tests:
  - name: serveOrder is a function
    expect: typeof serveOrder === "function"
  - name: every order reaches its table, in order
    state: 'w.served.length === g.orders.length && w.served.every((s, i) => s.table === g.orders[i].table && s.dish === g.orders[i].dish)'
    msg: The served dishes don't match the orders (table, dish or order).
  - name: ends in the kitchen facing east
    state: 'w.atKitchen && w.dir === "E"'
  - name: without crashing
    state: '!w.crashed'
  - name: calls serveOrder inside a loop
    source: '\b(for|while)\b[\s\S]*\bserveOrder\s*\('
    msg: Call serveOrder from a loop that walks orders.
```

## Expert challenge

```exercise
id: js4-reto-agrupar
type: challenge
title: The summary for the kitchen
prompt: |
  Delia wants to know how many dishes of each kind went out. Write `countDishes(orders)` that returns an object `{ dish: count }`, without modifying the array it receives. Bonus points if you do it with `reduce`.
starter: |
  function countDishes(orders) {
    return {};
  }

  console.log(countDishes([{ table: 1, dish: "ceviche" }, { table: 2, dish: "ceviche" }]));
solution: |
  const countDishes = (orders) =>
    orders.reduce((count, { dish }) => ({ ...count, [dish]: (count[dish] ?? 0) + 1 }), {});

  console.log(countDishes([{ table: 1, dish: "ceviche" }, { table: 2, dish: "ceviche" }]));
hints:
  - "`count[dish] ?? 0` gives 0 the first time a dish shows up."
tests:
  - name: two ceviches and one chicha
    run: 'countDishes([{ table: 1, dish: "ceviche" }, { table: 2, dish: "chicha" }, { table: 3, dish: "ceviche" }])'
    equals: { ceviche: 2, chicha: 1 }
  - name: no orders, empty object
    run: countDishes([])
    equals: {}
  - name: doesn't modify the list
    expect: '(() => { const p = [{ table: 1, dish: "causa" }]; countDishes(p); return p.length === 1 && Object.keys(p[0]).length === 2; })()'
```
