# Session 4 — Functions

## The job

Sunday, noon, on the Chorrillos seafront. **El Bote de Tito** is a six-table cevichería right next to the fishermen's pier: the fish arrives at eleven, by twelve there's a queue and by one there's no jalea left. Tito Panta cooks, his daughter Yesenia takes the money and the waiter quit on Friday to go surfing in Punta Hermosa.

Maru bolted a **serving arm with a tray** onto Quilla and sent it over in a combi. The problem: taking one dish to one table is six or seven instructions, and on a Sunday fifty dishes go out. Copying and pasting 300 lines isn't programming. Today Quilla learns to **give a routine a name**, hand it data and get a result back.

```scene
theme: cocina
level: 4
dir: E
caption: El Bote de Tito. Quilla cooks in the kitchen (K), serves table 2 in the dining room and goes down to the terrace to serve table 5.
map: |
  ##########
  #K......##
  #.#1#2#3##
  #.########
  #.......##
  ##4#5#6###
  ##########
program: |
  robot.cook("ceviche")
  robot.forward(4)
  robot.serve()
  robot.turn_right()
  robot.turn_right()
  robot.forward(4)
  robot.turn_left()
  robot.cook("jalea")
  robot.forward(3)
  robot.turn_left()
  robot.forward(3)
  robot.serve()
```

## The minimum

A **function** is a block of code with a name. You define it with `def`, it receives data through its **parameters** and hands back a result with **`return`**. Defining it doesn't run it: it runs every time you **call** it with parentheses.

```py run
def subtotal(price, quantity=1):
    """What a dish ordered several times costs."""
    return price * quantity

print(subtotal(36, 2))
print(subtotal(45))
print(subtotal(quantity=3, price=9))
```

Watch what happens when one function calls another: every call opens a box on the **call stack** with its parameters, and when it reaches `return` the box closes and hands its value to whoever called it.

```anim
title: A call is a box with inputs and one output
code: |
  def subtotal(price, quantity):
      return price * quantity

  def bill(price, quantity, tip=0.1):
      base = subtotal(price, quantity)
      return base + base * tip

  total = bill(40, 2)
  print(total)
notes:
  1: "def only stores the recipe under its name; nothing runs yet."
  8: "bill is called with 40 and 2; tip wasn't passed, so it's 0.1."
  5: "bill calls subtotal: the stack grows by one box."
  2: "subtotal returns 80 and its box closes."
  6: "base is 80; bill returns 88.0 to line 8."
  9: "total keeps what bill returned."
```

What you need for today:

- **Without `return`, a function returns `None`.** `print` shows something on the console, but doesn't hand it to the program: to use a result, return it.
- **Default values**: `quantity=1` is used when that argument isn't passed. They go at the end of the parameter list.
- **Keyword arguments**: `subtotal(quantity=3, price=9)`. With names, the order doesn't matter and the call reads by itself.
- **`*args` and `**kwargs`**: a parameter with `*` gathers the leftover loose arguments into a **tuple**; one with `**` gathers the named ones into a **dictionary**.
- **Docstring**: the text between `"""` right below the `def` explains what the function does. `help(subtotal)` shows it.
- **Local variables**: what you assign inside a function lives only there and disappears when it ends. You can **read** a variable from outside (a global), but if you assign to it inside, Python treats it as local in the whole function.

```py run
def write_down(table, *dishes, **extras):
    print(table, dishes, extras)

write_down(4, "ceviche", "chicha", no_onion=True)
write_down(6)
```

```py run
tip = 0.1  # global: visible from everywhere

def with_tax(amount):
    tax = amount * 0.18  # local: only exists in here
    return amount + tax

print(with_tax(100), tip)
```

Each call to a function opens its own **room**, and closes it when it ends. From inside you can look out into the room outside, but from outside you can't see what's inside:

```scope
title: A call opens a room and closes it when it ends
speed: 3600
steps:
  - note: "Before calling, only the global room exists, with `tip` and the function `with_tax`."
    rooms:
      - { id: g, name: global, vars: { tip: 0.1 }, fns: [{ name: with_tax }] }
  - note: "`with_tax(100)` opens a new room with `amount` and `tax`. From inside you read `tip`, which lives outside; from global, `tax` doesn't exist."
    rooms:
      - id: g
        name: global
        vars: { tip: 0.1 }
        fns: [{ name: with_tax }]
        rooms:
          - { id: c, name: "with_tax(100)", on: true, vars: { amount: 100, tax: "18.0" }, up: "If a name is missing, it looks in global." }
  - note: "With the `return` the call ends and its room is discarded: `amount` and `tax` disappear. The only thing that comes out is the returned value."
    rooms:
      - id: g
        name: global
        vars: { tip: 0.1 }
        fns: [{ name: with_tax }]
        rooms:
          - { id: c, name: "with_tax(100)", gone: true, vars: { amount: 100, tax: "18.0" } }
```

The rule that confuses most: if you **assign** a name inside a function, Python treats it as local in the **whole** room, even on the lines before the assignment.

```py
counter = 0

def add():
    counter += 1   # assigns: counter is local here

add()
```

```scope
title: Why add() gives UnboundLocalError
note: "Since `add` assigns `counter`, Python decides it's **local to its room**. To do `+ 1` it reads it first, but that local `counter` has no value yet, and it doesn't look at the one in global. If you only wanted to **read** it, it would find it outside."
rooms:
  - id: g
    name: global
    vars: { counter: 0 }
    fns: [{ name: add }]
    rooms:
      - { id: s, name: "add()", on: true, bad: "UnboundLocalError: counter is read before it has a value" }
```

> **Common trap:** the default value is created **only once**, when Python reads the `def`, not on every call. If it's a list (`def f(dishes=[])`) and the function changes it, every call shares that same list and one table's dishes show up on the next one. Use `None` as the default and create the list inside.

<!-- legacy: mutable-default -->

<!-- mdn: keyword-args mutable-default args-kwargs -->

## Practice

```exercise
id: py4-predice-none
type: predict
title: The lime that never arrived
prompt: |
  Tito asked for a function that works out how many limes a batch of ceviche takes. What does it print?
code: |
  def limes_for(dishes):
      print(dishes * 6)

  total = limes_for(4)
  print("Total:", total)
options:
  - "24\nTotal: None"
  - "Total: 24"
  - "24\nTotal: 24"
  - "Total: None"
answer: "24\nTotal: None"
explain: |
  `limes_for` **prints** 24, but it has no `return`, so it returns `None`. That's why `total` is `None`. With `return dishes * 6` instead of the `print`, the output would be just `Total: 24`.
```

```exercise
id: py4-predice-nombres
type: predict
title: The order with names
prompt: |
  Yesenia writes down the orders with a function that has default values. What does it print?
code: |
  def order(dish, quantity=1, spice="normal"):
      return f"{quantity} {dish} ({spice})"

  print(order("jalea"))
  print(order("ceviche", spice="hot"))
  print(order(quantity=2, dish="sudado"))
options:
  - "1 jalea (normal)\n1 ceviche (hot)\n2 sudado (normal)"
  - "1 jalea (normal)\nhot ceviche (normal)\n2 sudado (normal)"
  - "jalea\n1 ceviche (hot)\n2 sudado (normal)"
  - "1 jalea (normal)\n1 ceviche (hot)\nsudado 2 (normal)"
answer: "1 jalea (normal)\n1 ceviche (hot)\n2 sudado (normal)"
explain: |
  What isn't passed takes its default value. `spice="hot"` goes straight to `spice` even though it skips `quantity`, and in the last call the names rule: the order you write them in doesn't matter.
```

```exercise
id: py4-predice-comanda
type: predict
title: The ticket that repeats
prompt: |
  This function puts together each table's kitchen ticket. Table 1 orders ceviche and table 2 orders jalea. What does it print?
code: |
  def new_ticket(dish, ticket=[]):
      ticket.append(dish)
      return ticket

  table_1 = new_ticket("ceviche")
  table_2 = new_ticket("jalea")
  print(table_1)
  print(table_2)
options:
  - "['ceviche', 'jalea']\n['ceviche', 'jalea']"
  - "['ceviche']\n['jalea']"
  - "['ceviche']\n['ceviche', 'jalea']"
  - "['jalea']\n['jalea']"
answer: "['ceviche', 'jalea']\n['ceviche', 'jalea']"
explain: |
  The default value's `[]` list was created **only once**, when the `def` was read. Both calls append to the same list and return that same list: `table_1` and `table_2` are two names for it. With `ticket=None` and `if ticket is None: ticket = []` inside, each table would get its own.
```

```exercise
id: py4-completa-anotar
type: complete
title: Yesenia's notebook
prompt: |
  `write_order` takes the table, **any number of dishes** and **any number of named special requests** (`no_onion=True`, `to_go=True`…). Fill in the `___` so that `dishes` gathers the dishes into a tuple and `extras` gathers the special requests into a dictionary.
starter: |
  def write_order(table, ___dishes, ___extras):
      """Returns the notebook line for a table."""
      return f"Table {table}, dishes: {len(dishes)}, extras: {extras}"

  print(write_order(7, "ceviche", "jalea", "chicha", no_onion=True))
  print(write_order(2))
solution: |
  def write_order(table, *dishes, **extras):
      """Returns the notebook line for a table."""
      return f"Table {table}, dishes: {len(dishes)}, extras: {extras}"

  print(write_order(7, "ceviche", "jalea", "chicha", no_onion=True))
  print(write_order(2))
hints:
  - One asterisk gathers the loose arguments; two asterisks gather the named ones.
tests:
  - name: three dishes and one extra
    run: write_order(7, "ceviche", "jalea", "chicha", no_onion=True)
    equals: "Table 7, dishes: 3, extras: {'no_onion': True}"
  - name: a table with nothing
    run: write_order(2)
    equals: "Table 2, dishes: 0, extras: {}"
  - name: two named extras
    run: write_order(5, "sudado", to_go=True, cutlery=2)
    equals: "Table 5, dishes: 1, extras: {'to_go': True, 'cutlery': 2}"
  - name: the console shows both lines
    output: "Table 7, dishes: 3, extras: {'no_onion': True}\nTable 2, dishes: 0, extras: {}"
```

```exercise
id: py4-arregla-limones
type: fix
title: The limes nobody took off
prompt: |
  There are 60 limes left in the kitchen and each ceviche takes 4. This function should take off the limes for 5 ceviches, but the program crashes. Run it and read the error.

  Fix it without `global`: make `squeeze(limes, dishes)` **receive** the limes there are and **return** how many are left, and store the result outside, in `limes`.
starter: |
  limes = 60  # the ones left in the kitchen

  def squeeze(dishes):
      limes = limes - dishes * 4
      return limes

  squeeze(5)
  print(limes, "limes left")
solution: |
  limes = 60  # the ones left in the kitchen

  def squeeze(limes, dishes):
      return limes - dishes * 4

  limes = squeeze(limes, 5)
  print(limes, "limes left")
hints:
  - "Since `squeeze` assigns to `limes`, Python treats it as a local variable in the whole function, and it reads it before it has a value: `UnboundLocalError`."
  - "Pass the limes as a parameter and keep what it returns: `limes = squeeze(limes, 5)`."
tests:
  - name: squeeze(60, 5) returns 40
    run: squeeze(60, 5)
    equals: 40
  - name: squeeze(10, 0) returns 10
    run: squeeze(10, 0)
    equals: 10
  - name: limes ends at 40
    expect: limes == 40
  - name: the console says so
    output: 40 limes left
  - name: without global
    sourceNot: '\bglobal\b'
    msg: Don't use global. Pass the limes as a parameter and return the result.
```

```exercise
id: py4-escribe-porciones
type: write
title: How many ceviches can we make?
prompt: |
  Write two functions, **each with its docstring**:

  - `portions(fish_g, per_dish=180)`: how many whole dishes you get from `fish_g` grams of fish, if each dish takes `per_dish` grams (180 if you're not told).
  - `possible_dishes(fish_g, limes)`: how many ceviches can really be served. Each ceviche needs its portion of fish **and 5 limes**, so whatever runs out first decides. Use `portions` inside.

  `min(a, b)` gives you the smaller of two numbers.
visual:
  figure:
    title: possible_dishes(2000, 30)
    input: { label: In the kitchen, cards: [{ title: pantry, rows: [["fish", "2000 g"], ["limes", "30"]] }] }
    arrow: "portions(2000) = 11 · 30 // 5 = 6 · the smaller"
    output: { label: returns, value: "6" }
    steps:
      - "There's fish for 11 ceviches, but limes for only 6: 6 go out."
starter: |
  def portions(fish_g, per_dish=180):
      pass


  def possible_dishes(fish_g, limes):
      pass


  print(possible_dishes(2000, 30))
solution: |
  def portions(fish_g, per_dish=180):
      """How many whole dishes that much fish makes, in grams."""
      return fish_g // per_dish


  def possible_dishes(fish_g, limes):
      """How many ceviches can be served: whatever runs out first decides."""
      return min(portions(fish_g), limes // 5)


  print(possible_dishes(2000, 30))
hints:
  - "`//` counts how many times one number fits in another, without decimals."
  - "`possible_dishes` can return `min(portions(fish_g), limes // 5)`."
tests:
  - name: portions(1000) is 5
    run: portions(1000)
    equals: 5
  - name: portions(1000, per_dish=250) is 4
    run: portions(1000, per_dish=250)
    equals: 4
  - name: not enough limes
    run: possible_dishes(2000, 30)
    equals: 6
  - name: not enough fish
    run: possible_dishes(900, 100)
    equals: 5
  - name: no fish, no ceviche
    run: possible_dishes(100, 50)
    equals: 0
  - name: both have a docstring
    expect: portions.__doc__ is not None and possible_dishes.__doc__ is not None
    msg: Put some text between """ right below each def.
  - name: possible_dishes uses portions
    source: 'def\s+possible_dishes[\s\S]*\bportions\s*\('
    msg: Don't repeat the fish calculation; call portions inside possible_dishes.
```

## The case

```exercise
id: py4-caso-propina
type: case
title: The split tip
prompt: |
  **Write `share(dishes, tip=0.1)`, which returns what one person owes: the sum of their dishes plus the tip, and compare it with what each one paid.**

  Five old classmates from a Chorrillos school celebrated at El Bote de Tito. They agreed that each one pays **their own share plus a 10 % tip**, except **Renzo, whose birthday it is and who pays no tip** (call it with `tip=0`). When she closed the till, Yesenia counted and money was missing: someone underpaid.

  Print one line per person that starts with their name, with the share rounded to two decimals at the end: `print("Kiara:", round(share(kiara_dishes), 2))`. The board compares it with what they paid.
visual:
  board:
    for: py4-caso-propina
    task: "Share = the sum of their dishes + a 10 % tip (Renzo, no tip). Compare it with what they paid."
    cards:
      - name: Kiara
        kind: person
        rows: [["Ordered", "ceviche, chicha"], ["Paid", "S/ 49.50"]]
        clue: { find: "Kiara", says: 49.5, saysLabel: Paid }
      - name: Renzo
        kind: person
        role: The birthday boy
        rows: [["Ordered", "jalea, chilcano"], ["Paid", "S/ 59"]]
        clue: { find: "Renzo", says: 59, saysLabel: Paid }
      - name: Milagros
        kind: person
        rows: [["Ordered", "tiradito, sudado"], ["Paid", "S/ 79.20"]]
        clue: { find: "Milagros", says: 79.2, saysLabel: Paid }
      - name: Jhon
        kind: person
        culprit: true
        rows: [["Ordered", "ceviche, jalea, chicha"], ["Paid", "S/ 95"]]
        clue: { find: "Jhon", says: 95, saysLabel: Paid }
      - name: Fiorella
        kind: person
        rows: [["Ordered", "sudado, chilcano, chicha"], ["Paid", "S/ 69.30"]]
        clue: { find: "Fiorella", says: 69.3, saysLabel: Paid }
      - name: The menu
        kind: note
        role: El Bote de Tito's blackboard
        rows: [["Ceviche", "S/ 36"], ["Jalea", "S/ 45"], ["Tiradito", "S/ 32"], ["Sudado", "S/ 40"], ["Chilcano", "S/ 14"], ["Chicha", "S/ 9"]]
    caption: "If Renzo doesn't match, check whether you charged the birthday boy a tip."
starter: |
  # What each one ordered, with the menu prices
  kiara_dishes = [36, 9]          # ceviche, chicha
  renzo_dishes = [45, 14]         # jalea, chilcano (birthday: no tip)
  milagros_dishes = [32, 40]      # tiradito, sudado
  jhon_dishes = [36, 45, 9]       # ceviche, jalea, chicha
  fiorella_dishes = [40, 14, 9]   # sudado, chilcano, chicha

  # sum(list) adds up all the numbers in a list:
  print("Kiara spent", sum(kiara_dishes))

  # TODO: write share(dishes, tip=0.1) with def and return

  # TODO: print one line per person, for example:
  # print("Kiara:", round(share(kiara_dishes), 2))
solution: |
  kiara_dishes = [36, 9]
  renzo_dishes = [45, 14]
  milagros_dishes = [32, 40]
  jhon_dishes = [36, 45, 9]
  fiorella_dishes = [40, 14, 9]


  def share(dishes, tip=0.1):
      """What one person pays: their dishes plus the tip."""
      spent = sum(dishes)
      return spent + spent * tip


  print("Kiara:", round(share(kiara_dishes), 2))
  print("Renzo:", round(share(renzo_dishes, tip=0), 2))
  print("Milagros:", round(share(milagros_dishes), 2))
  print("Jhon:", round(share(jhon_dishes), 2))
  print("Fiorella:", round(share(fiorella_dishes), 2))
answer: Jhon
answerLabel: Who underpaid?
reveal: |
  Jhon. He spent `36 + 45 + 9 = 90`, with the 10 % that's 99.0, and he paid 95: four soles short. Renzo paid exactly 59 because, as the birthday boy, `share(renzo_dishes, tip=0)` adds no tip.
hints:
  - "Inside `share`: `spent = sum(dishes)` and then `return spent + spent * tip`."
  - "For Renzo, name the argument in the call: `share(renzo_dishes, tip=0)`."
```

## The judge

From this session on the judge changes shape: it no longer reads input with `input()` or looks at what you print. **It calls your functions** with some arguments and compares what they **return**, as on LeetCode. That's why it can judge each function separately, and why they have to be named exactly as the statement says. Whatever you print with `print` doesn't count: what counts is the `return`.

```exercise
id: py4-juez-cuenta
type: judge
mode: function
function: table_bill
tolerance: 0.000001
title: The table's bill
prompt: |
  **Write `table_bill(dishes, tip=0.1, people=1)`, which returns how much each person at a table pays, and its two helpers `subtotal` and `with_tip`.**

  Yesenia wants Quilla to take the money. Each table comes as a list of `[price, quantity]` pairs: `[[36, 2], [9, 3]]` is two dishes at 36 soles and three at 9. Write three functions; the judge tests all three:

  - `subtotal(dishes)`: the sum of `price × quantity` over all the pairs. `for price, quantity in dishes:` takes the two numbers out of each pair.
  - `with_tip(amount, tip=0.1)`: the amount plus the tip, which is a **fraction** of the amount (`0.1` is 10 %). If it isn't passed, it's 0.1.
  - `table_bill(dishes, tip=0.1, people=1)`: the subtotal with tip, **divided by the people** who pay. Use the two above.

  The judge accepts tiny decimal differences (up to 0.000001), so don't round.

  **Constraints:** 0 to 6 pairs per table · prices from 5 to 60 · quantities from 0 to 5 · tip from 0 to 0.2 · 1 to 8 people.
visual:
  figure:
    title: Example 1, as a bill
    input: { label: "table_bill([[36, 2], [9, 3]], 0.1, 3)", receipt: { title: EL BOTE DE TITO, rows: [["2 × 36", "72"], ["3 × 9", "27"]], totalLabel: "subtotal", total: "99" } }
    arrow: "with_tip(99, 0.1) = 108.9 · split between 3 people"
    output: { label: returns, value: "36.3" }
    steps:
      - "`subtotal` adds 72 + 27 = 99."
      - "`with_tip` adds the 10 %: 99 + 9.9 = 108.9."
      - "`table_bill` divides it by 3: each one pays 36.3."
starter: |
  def subtotal(dishes):
      pass


  def with_tip(amount, tip):
      pass


  def table_bill(dishes, tip, people):
      pass
solution: |
  def subtotal(dishes):
      """Adds up price × quantity for each [price, quantity] pair."""
      total = 0
      for price, quantity in dishes:
          total += price * quantity
      return total


  def with_tip(amount, tip=0.1):
      """The amount plus the tip, which is a fraction of the amount."""
      return amount + amount * tip


  def table_bill(dishes, tip=0.1, people=1):
      """What each person at the table pays."""
      return with_tip(subtotal(dishes), tip) / people
hints:
  - "Default values go in the signature: `def with_tip(amount, tip=0.1):`."
  - "`table_bill` doesn't need to add anything up: `return with_tip(subtotal(dishes), tip) / people`."
samples:
  - args: [[[36, 2], [9, 3]], 0.1, 3]
    returns: 36.3
    note: "99 spent, plus 10 % makes 108.9, split between 3 people."
  - args: [[[45, 1], [14, 2]]]
    returns: 80.3
    note: No tip or people given; the default values put in 0.1 and 1.
  - fn: with_tip
    args: [50]
    returns: 55.0
    note: The helpers are judged on their own too.
  - fn: subtotal
    args: [[[32, 2], [40, 1]]]
    returns: 104
edge:
  - args: [[]]
    tag: with a table that ordered nothing
  - args: [[], 0.1, 4]
    tag: with a table that ordered nothing and several people
  - args: [[[40, 1]], 0]
    tag: with no tip
  - args: [[[40, 1], [9, 2]], 0, 2]
    tag: with no tip, split between two
  - args: [[[60, 5], [60, 5], [60, 5], [60, 5], [60, 5], [60, 5]], 0.2, 8]
    tag: with the most expensive table and the highest tip
  - args: [[[12, 0], [30, 1]], 0.15]
    tag: with a dish of quantity zero
  - fn: subtotal
    args: [[]]
    tag: in subtotal, with no pairs
  - fn: subtotal
    args: [[[9, 0]]]
    tag: in subtotal, with quantity zero
  - fn: with_tip
    args: [80, 0.2]
    tag: in with_tip, with another tip
  - fn: with_tip
    args: [0]
    tag: in with_tip, with amount zero
random:
  count: 40
  seed: 404
  generate: |
    dishes = [[rng.int(5, 60), rng.int(0, 5)] for _ in range(rng.int(0, 6))]
    tip = rng.pick([0, 0.05, 0.1, 0.15, 0.2])
    return [dishes, tip, rng.int(1, 8)]
wrong:
  - |
    def subtotal(dishes):
        total = 0
        for price, quantity in dishes:
            total += price * quantity
        return total


    def with_tip(amount, tip):
        return amount + amount * tip


    def table_bill(dishes, tip, people):
        return with_tip(subtotal(dishes), tip) / people
  - |
    def subtotal(dishes):
        total = 0
        for price, quantity in dishes:
            total += price * quantity
        return total


    def with_tip(amount, tip=0.1):
        return amount + tip


    def table_bill(dishes, tip=0.1, people=1):
        return with_tip(subtotal(dishes), tip) / people
  - |
    def subtotal(dishes):
        total = 0
        for price, quantity in dishes:
            total += price
        return total


    def with_tip(amount, tip=0.1):
        return amount + amount * tip


    def table_bill(dishes, tip=0.1, people=1):
        return with_tip(subtotal(dishes), tip) / people
  - |
    def subtotal(dishes):
        total = 0
        for price, quantity in dishes:
            total += price * quantity
        return total


    def with_tip(amount, tip=0.1):
        return amount + amount * tip


    def table_bill(dishes, tip=0.1, people=1):
        spent = subtotal(dishes)
        return spent + spent * tip / people
```

## Final mission

```exercise
id: py4-mision-bote
type: mission
title: Sunday at El Bote de Tito
prompt: |
  **Write `serve_table(table, dish)`, which takes a dish to its table and comes back to the kitchen, and use it to serve all the `orders` in order.**

  Quilla starts in the kitchen (K) facing east. El Bote de Tito has two floors:

  - **The dining room** (tables 1, 2 and 3) is below the upper corridor: table `n` is `2 × n` steps east of the kitchen.
  - **The terrace** (tables 4, 5 and 6) is below the lower corridor. To get there, Quilla goes 3 tiles south and turns east; from there, table `n` is `2 × (n − 4) + 1` steps away.

  `robot.cook(dish)` puts the dish on the tray (only in the kitchen, and one fits) and `robot.serve()` leaves it on the table below.

  1. Complete `steps_to(table)`, which returns the steps in the table.
  2. Complete `serve_table(table, dish)`: cook, carry, serve and **come back to the kitchen facing east**. `there_and_back` is already written: use it.
  3. Serve every order with a loop. `orders` is a list of `[table, dish]` pairs that changes on every test; `for table, dish in orders:` takes the two values out of each pair.

  When it passes, together with the judge, session 5 unlocks.
visual:
  figure:
    title: How many steps to each table
    panes:
      - label: Dining room (upper corridor)
        table: { head: ["table", "steps east"], rows: [["1", "2"], ["2", "4"], ["3", "6"]] }
      - label: Terrace (3 down to the south)
        table: { head: ["table", "steps east"], rows: [["4", "1"], ["5", "3"], ["6", "5"]] }
starter: |
  # orders comes from the till, for example: [[3, "ceviche"], [5, "jalea"]]

  def turn_around():
      robot.turn_right()
      robot.turn_right()


  def there_and_back(steps):
      """Moves, serves and returns to the starting point, facing the way it faced."""
      robot.forward(steps)
      robot.serve()
      turn_around()
      robot.forward(steps)
      turn_around()


  def steps_to(table):
      """Steps east from the start of that table's corridor."""
      pass


  def serve_table(table, dish):
      # cook, carry, serve, come back to the kitchen facing east
      pass
solution: |
  def turn_around():
      robot.turn_right()
      robot.turn_right()


  def there_and_back(steps):
      """Moves, serves and returns to the starting point, facing the way it faced."""
      robot.forward(steps)
      robot.serve()
      turn_around()
      robot.forward(steps)
      turn_around()


  def steps_to(table):
      """Steps east from the start of that table's corridor."""
      if table <= 3:
          return 2 * table
      return 2 * (table - 4) + 1


  def serve_table(table, dish):
      robot.cook(dish)
      if table <= 3:
          there_and_back(steps_to(table))
      else:
          robot.turn_right()
          robot.forward(3)
          robot.turn_left()
          there_and_back(steps_to(table))
          robot.turn_left()
          robot.forward(3)
          robot.turn_right()


  for table, dish in orders:
      serve_table(table, dish)
hints:
  - "For the terrace: facing east, `turn_right` leaves you facing south; after going down, `turn_left` leaves you facing east again. To come back, the same in reverse."
  - "`there_and_back` brings you back to the same spot, facing the same way, so you only have to undo the trip down."
world:
  theme: cocina
  level: 4
  dir: E
  map: |
    ##########
    #K......##
    #.#1#2#3##
    #.########
    #.......##
    ##4#5#6###
    ##########
globals:
  orders:
    - [3, ceviche]
    - [5, jalea]
    - [1, chicha morada]
scenarios:
  - {}
  - globals:
      orders:
        - [4, sudado]
        - [2, tiradito]
        - [6, ceviche]
        - [2, chilcano]
        - [5, arroz con mariscos]
  - globals:
      orders:
        - [6, jalea]
tests:
  - name: serve_table is a function
    expect: callable(serve_table)
  - name: steps_to gives the steps in the table
    expect: '[steps_to(t) for t in range(1, 7)] == [2, 4, 6, 1, 3, 5]'
    msg: "Dining room: 2 × table. Terrace: 2 × (table − 4) + 1."
  - name: every order reaches its table, in order
    state: 'len(w.served) == len(g["orders"]) and all(s.table == t and s.dish == d for s, (t, d) in zip(w.served, g["orders"]))'
    msg: The served dishes don't match the orders (table, dish or order).
  - name: ends in the kitchen facing east
    state: 'w.at_kitchen and w.dir == "E"'
  - name: without crashing
    state: not w.crashed
  - name: uses serve_table inside a loop
    source: '\b(for|while)\b[\s\S]*\bserve_table\s*\('
    msg: Call serve_table from a loop that walks orders.
```

## Expert challenge

```exercise
id: py4-reto-comanda
type: challenge
title: The ticket for the kitchen
visual:
  figure:
    title: What it receives and what it returns
    input: { label: call, text: "ticket(4, \"ceviche\", \"jalea\", no_onion=\"ceviche\")" }
    arrow: "*dishes and **notes"
    output: { label: returns, text: "Table 4 (2 dishes)\n- ceviche\n- jalea\n  no onion: ceviche" }
prompt: |
  **Write `ticket(table, *dishes, **notes)`, which returns the slip Tito hangs up in the kitchen, as a single string with line breaks.** For people who already code.

  - First line: `Table 4 (2 dishes)`; with a single dish, `Table 4 (1 dish)`.
  - One `- dish` line for each dish, in the order they arrived.
  - One line per note, in the order they arrived, with two spaces in front and the underscores in the name changed to spaces: `no_onion="ceviche"` is `  no onion: ceviche`.

  Careful: the function can't keep anything from one call to the next.
starter: |
  def ticket(table, *dishes, **notes):
      return ""


  print(ticket(4, "ceviche", "jalea", no_onion="ceviche"))
solution: |
  def ticket(table, *dishes, **notes):
      """The kitchen slip for a table."""
      count = len(dishes)
      lines = [f"Table {table} ({count} dish{'' if count == 1 else 'es'})"]
      for dish in dishes:
          lines.append(f"- {dish}")
      for key, value in notes.items():
          lines.append(f"  {key.replace('_', ' ')}: {value}")
      return "\n".join(lines)


  print(ticket(4, "ceviche", "jalea", no_onion="ceviche"))
hints:
  - "Gather the lines in a list and join them at the end with `\"\\n\".join(lines)`."
  - "`notes.items()` gives you each `(key, value)` pair, and `key.replace(\"_\", \" \")` changes the underscores."
tests:
  - name: two dishes and one note
    run: 'ticket(4, "ceviche", "jalea", no_onion="ceviche")'
    equals: "Table 4 (2 dishes)\n- ceviche\n- jalea\n  no onion: ceviche"
  - name: a single dish, in the singular
    run: 'ticket(1, "sudado")'
    equals: "Table 1 (1 dish)\n- sudado"
  - name: no dishes or notes
    run: ticket(6)
    equals: "Table 6 (0 dishes)"
  - name: several notes, in order
    run: 'ticket(2, "jalea", to_go=True, chili_on_side="yes")'
    equals: "Table 2 (1 dish)\n- jalea\n  to go: True\n  chili on side: yes"
  - name: keeps nothing between calls
    run: '[ticket(3, "causa"), ticket(3, "causa")]'
    equals: ["Table 3 (1 dish)\n- causa", "Table 3 (1 dish)\n- causa"]
  - name: uses *dishes and **notes
    source: 'def\s+ticket\s*\(\s*table\s*,\s*\*dishes\s*,\s*\*\*notes\s*\)'
```
