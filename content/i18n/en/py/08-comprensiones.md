# Session 8 — Comprehensions and collection functions

## The job

San Pedro Market, Cusco, seven in the morning. At the back, past the juice stalls and the pan chuta stands, is **doña Paulina Quispe**'s eatery: a wood-fired kitchen, four long tables and a blackboard with the menu of the day. By eight there are already porters ordering caldo de gallina, and by one there isn't a single fried trout left.

Doña Paulina asked Maru for a helper who wouldn't get tired going up and down from the kitchen, and Maru sent Quilla on the Cruz del Sur bus with its **serving arm** well tightened. But in San Pedro the hard part isn't carrying plates: it's **sorting out the day**. The cancelled orders have to come off the list of tickets, the sales have to be added up per dish, someone has to see which one is the spiciest, the report has to be numbered. Quilla can already do all of that with a `for` and an `append`… in six lines. Today it learns to say it in **one**.

```scene
theme: cocina
level: 4
dir: E
caption: Doña Paulina's eatery. Quilla cooks in the kitchen (K) and serves table 1, three steps away.
map: |
  ###########
  #K........#
  ##2#1##3###
  ###########
program: |
  robot.cook("caldo de gallina")
  robot.forward(3)
  robot.serve()
  robot.turn_right()
  robot.turn_right()
  robot.forward(3)
  robot.turn_right()
  robot.turn_right()
  robot.say("Caldo for table 1!")
```

## The minimum

A **comprehension** builds a new list in one line: *what* you want from each element, *where* it comes from and, if needed, *which ones* get in. It reads almost like a sentence: "the price with IGV (the sales tax), for each price on the menu, if the price is over 10".

```py run
prices = [14, 25, 8, 18]
pricey = [price for price in prices if price > 10]
with_tax = [round(price * 1.18, 2) for price in pricey]
print(pricey)
print(with_tax)
```

A comprehension does the same as the usual `for` with `append`. Look at both, step by step: the loop fills `pricey` one at a time; the comprehension on the last line reaches the same list.

```anim
title: The usual loop and the comprehension, side by side
code: |
  prices = [14, 25, 8, 18]
  pricey = []
  for price in prices:
      if price > 10:
          pricey.append(price)
  same = [price for price in prices if price > 10]
  print(pricey == same)
cells: { of: prices, at: price }
notes:
  2: "The loop starts with an empty list."
  4: "The if decides whether this price gets in."
  5: "Only the ones that pass the filter are added."
  6: "The comprehension says the same in one line: what, from where and which ones."
  7: "Both lists are equal: [14, 25, 18]."
```

With curly braces you build **dictionaries** (`{key: value for …}`) and **sets** (`{value for …}`). And with parentheses, or straight inside a function like `sum`, you get a **generator expression**: it doesn't build any list, it hands the values one at a time to whoever asks for them. For adding up or counting, it's just right.

```py run
menu = {"caldo": 14, "adobo": 18, "trucha": 22}
discounted = {dish: price - 2 for dish, price in menu.items() if price > 15}
letters = {dish[0] for dish in menu}
print(discounted, sorted(letters))
print(sum(price for price in menu.values()))
```

To walk through several things at once there are two helpers:

- **`enumerate(list, start=1)`** gives you the number and the value together, without `range(len(…))`.
- **`zip(a, b)`** walks through two (or more) lists in parallel, pair by pair. It stops at the shortest; with `strict=True` it raises an error if they aren't the same length.

```anim
title: enumerate and zip, table by table
code: |
  dishes = ["caldo", "adobo", "trucha"]
  prices = [14, 18, 22]
  for n, (dish, price) in enumerate(zip(dishes, prices), start=1):
      line = f"{n}. {dish}: {price}"
      print(line)
cells: { of: dishes, at: dish }
notes:
  3: "zip pairs up (dish, price); enumerate puts the number in front, from 1."
  4: "Each pass brings the three values already unpacked."
```

To **sort, or find the largest or the smallest** by something that isn't the value itself, `sorted`, `min` and `max` take **`key=`**: a function that says *what* to compare by. The shortest one is a **`lambda`**, a nameless function of a single expression. `reverse=True` flips the order. And **`any`** and **`all`** answer whether *some* or *all* of them meet a condition.

```py run
dishes = [("adobo", 3), ("caldo", 1), ("rocoto relleno", 5), ("chiriuchu", 2)]
print(max(dishes, key=lambda dish: dish[1]))
print(sorted(dishes, key=lambda dish: dish[1], reverse=True)[:2])
print(any(heat > 4 for _, heat in dishes), all(heat > 0 for _, heat in dishes))
```

In other people's code you'll also see **`map(function, list)`** and **`filter(function, list)`**. They do the same as a comprehension, but with one `lambda` inside another, and they return an iterator, not a list. The comprehension almost always reads better:

```py run
prices = [14, 25, 8, 18]
print(list(map(lambda p: p * 2, filter(lambda p: p > 10, prices))))
print([p * 2 for p in prices if p > 10])
```

> **Common trap:** a generator, `map` or `filter` **gets used up**. They hand over their values only once: if you go through the same `map` twice, the second time comes out empty. If you're going to use the result more than once, store it in a list (with a comprehension or with `list(…)`).

<!-- legacy: comprehensions -->

<!-- legacy: enumerate -->

<!-- legacy: zip -->

<!-- mdn: comprehensions enumerate zip lambda -->

## Practice

```exercise
id: py8-predice-gastado
type: predict
title: The list that emptied itself
prompt: |
  Wilber, the waiter, wants to see the promotion's doubled prices twice. What does it print?
code: |
  prices = [12, 8, 15]
  doubled = map(lambda price: price * 2, prices)
  print(list(doubled))
  print(list(doubled))
options:
  - "[24, 16, 30]\n[]"
  - "[24, 16, 30]\n[24, 16, 30]"
  - "[24, 16, 30]\n[48, 32, 60]"
  - "<map object>\n[24, 16, 30]"
answer: "[24, 16, 30]\n[]"
explain: |
  `map` doesn't build a list: it hands over the values one at a time, **only once**. The first `list(doubled)` takes them all; the second finds the `map` already used up and builds an empty list. With `doubled = [price * 2 for price in prices]` both lines would print the same.
```

```exercise
id: py8-predice-cremallera
type: predict
title: The dish left without a table
prompt: |
  Yaneth pairs the tables with their dishes using `zip`, but she wrote down one dish too many. What does it print?
code: |
  tables = [3, 1, 4]
  dishes = ["adobo", "caldo", "trucha", "chiriuchu"]
  order = dict(zip(tables, dishes))
  print(order)
  print(len(order), order[1])
options:
  - "{3: 'adobo', 1: 'caldo', 4: 'trucha'}\n3 caldo"
  - "{3: 'adobo', 1: 'caldo', 4: 'trucha', None: 'chiriuchu'}\n4 caldo"
  - "{3: 'adobo', 1: 'caldo', 4: 'trucha'}\n3 adobo"
  - "ValueError: the lists aren't the same length"
answer: "{3: 'adobo', 1: 'caldo', 4: 'trucha'}\n3 caldo"
explain: |
  `zip` stops at the shortest list, without warning: the chiriuchu is left out. `dict(...)` turns the pairs into a dictionary, and `order[1]` looks up the **key** 1 (the table), not the position: it's the caldo. With `zip(tables, dishes, strict=True)` a `ValueError` would indeed be raised.
```

```exercise
id: py8-predice-todos
type: predict
title: Are all the pots ready yet?
prompt: |
  Doña Paulina asks whether the pots are ready. What does it print?
code: |
  pots = [("caldo", True), ("adobo", False), ("chiriuchu", True)]
  print(all(ready for _, ready in pots))
  print(any(ready for _, ready in pots))
  print(all(ready for _, ready in []))
options:
  - "False\nTrue\nTrue"
  - "False\nTrue\nFalse"
  - "True\nTrue\nTrue"
  - "False\nFalse\nFalse"
answer: "False\nTrue\nTrue"
explain: |
  `all` asks that **every one** meets it: the adobo isn't ready, so `False`. `any` asks that **some** one meets it: the caldo is enough, `True`. And `all` of nothing is `True`: there's no pot to contradict it. If that's not what you want, check first whether the list is empty.
```

```exercise
id: py8-completa-carta
type: complete
title: The menu blackboard
prompt: |
  Doña Paulina dictates her menu in two lists. Fill in the `___` to build:

  - `menu`: a **dictionary** `dish → price` with `zip`.
  - `cheap`: a **list** with the dishes under 15 soles, in menu order.
  - `initials`: a **set** with the first letter of each dish.
  - `by_price`: the dishes sorted **from most expensive to cheapest**.
starter: |
  dishes = ["caldo de gallina", "adobo", "trucha frita", "sopa de quinua", "chicha de jora"]
  prices = [14, 18, 22, 8, 5]

  menu = {dish: price for dish, price in ___(dishes, prices)}
  cheap = [dish for dish, price in menu.items() ___ price < 15]
  initials = ___dish[0] for dish in dishes___
  by_price = sorted(dishes, key=lambda dish: menu[dish], ___=True)

  print(menu)
  print(cheap, sorted(initials))
  print(by_price)
solution: |
  dishes = ["caldo de gallina", "adobo", "trucha frita", "sopa de quinua", "chicha de jora"]
  prices = [14, 18, 22, 8, 5]

  menu = {dish: price for dish, price in zip(dishes, prices)}
  cheap = [dish for dish, price in menu.items() if price < 15]
  initials = {dish[0] for dish in dishes}
  by_price = sorted(dishes, key=lambda dish: menu[dish], reverse=True)

  print(menu)
  print(cheap, sorted(initials))
  print(by_price)
hints:
  - "Curly braces without `:` build a set: `{dish[0] for dish in dishes}`."
  - "A comprehension's filter goes at the end, with `if`. To flip `sorted`, `reverse=True`."
tests:
  - name: menu pairs each dish with its price
    expect: 'menu == {"caldo de gallina": 14, "adobo": 18, "trucha frita": 22, "sopa de quinua": 8, "chicha de jora": 5}'
  - name: cheap has the ones under 15
    expect: 'cheap == ["caldo de gallina", "sopa de quinua", "chicha de jora"]'
  - name: initials is a set
    expect: 'initials == {"c", "a", "t", "s"}'
    msg: Use curly braces without a colon so it comes out as a set.
  - name: by_price goes from most expensive to cheapest
    expect: 'by_price == ["trucha frita", "adobo", "caldo de gallina", "sopa de quinua", "chicha de jora"]'
```

```exercise
id: py8-arregla-picante
type: fix
title: The rocoto that wouldn't be compared
prompt: |
  Rocío wants to put the **spiciest** dish and the **cheapest** one up on the blackboard. The program crashes: run it and read the error.

  Fix it without writing loops: `max` and `min` need to know **what** to compare each dish by.
visual:
  figure:
    title: What has to be found
    panes:
      - label: dishes
        table: { head: ["name", "heat", "price"], rows: [["adobo", "3", "18"], ["rocoto relleno", "5", "16"], ["caldo de gallina", "1", "14"], ["chiriuchu", "2", "25"]] }
      - label: on the blackboard
        cards: [{ title: spiciest, rows: [["dish", "rocoto relleno"]] }, { title: cheapest, rows: [["dish", "caldo de gallina"]] }]
starter: |
  dishes = [
      {"name": "adobo", "heat": 3, "price": 18},
      {"name": "rocoto relleno", "heat": 5, "price": 16},
      {"name": "caldo de gallina", "heat": 1, "price": 14},
      {"name": "chiriuchu", "heat": 2, "price": 25},
  ]

  spiciest = max(dishes)
  cheapest = min(dishes)
  print("Spiciest:", spiciest["name"])
  print("Cheapest:", cheapest["name"])
solution: |
  dishes = [
      {"name": "adobo", "heat": 3, "price": 18},
      {"name": "rocoto relleno", "heat": 5, "price": 16},
      {"name": "caldo de gallina", "heat": 1, "price": 14},
      {"name": "chiriuchu", "heat": 2, "price": 25},
  ]

  spiciest = max(dishes, key=lambda dish: dish["heat"])
  cheapest = min(dishes, key=lambda dish: dish["price"])
  print("Spiciest:", spiciest["name"])
  print("Cheapest:", cheapest["name"])
hints:
  - "Python doesn't know whether one dictionary is \"greater\" than another: that's why the `TypeError` with `>`."
  - "`max(dishes, key=lambda dish: dish[\"heat\"])` compares only each one's heat, and returns the whole dish."
tests:
  - name: the spiciest is the rocoto relleno
    expect: 'spiciest["name"] == "rocoto relleno"'
  - name: the cheapest is the caldo de gallina
    expect: 'cheapest["name"] == "caldo de gallina"'
  - name: max and min use key
    source: 'max\([^)]*key\s*=[\s\S]*min\([^)]*key\s*=|min\([^)]*key\s*=[\s\S]*max\([^)]*key\s*='
    msg: Give max and min a key= that says what to compare.
  - name: no loops
    sourceNot: '\bfor\b|\bwhile\b'
  - name: the console says it
    output: "Spiciest: rocoto relleno\nCheapest: caldo de gallina"
```

```exercise
id: py8-escribe-despensa
type: write
title: The Monday pantry
prompt: |
  On Mondays Quilla checks the pantry before the potatoes from Anta arrive. Each supply is a dictionary with its `name`, the `kilos` there are and the `minimum` there should be. Write three functions, **each one a single `return` line**:

  - `total_kilos(supplies)`: how many kilos there are in total. Use a **generator expression** inside `sum`.
  - `to_buy(supplies)`: the list of names of the supplies that have **fewer** kilos than their minimum, in the same order.
  - `anything_missing(supplies)`: `True` if **any** supply is below its minimum.
visual:
  figure:
    title: The example pantry
    input:
      label: supplies
      table: { head: ["name", "kilos", "minimum"], rows: [["potato", "12", "10"], ["corn", "3", "5"], ["quinoa", "4", "4"], ["onion", "1", "6"]] }
    arrow: three questions
    output:
      label: they return
      cards: [{ title: answers, rows: [["total_kilos", "20"], ["to_buy", "['corn', 'onion']"], ["anything_missing", "True"]] }]
starter: |
  def total_kilos(supplies):
      pass


  def to_buy(supplies):
      pass


  def anything_missing(supplies):
      pass


  # pantry already exists: the one in the picture
  print(total_kilos(pantry), to_buy(pantry), anything_missing(pantry))
solution: |
  def total_kilos(supplies):
      """The kilos in the whole pantry."""
      return sum(item["kilos"] for item in supplies)


  def to_buy(supplies):
      """The names of what is below its minimum."""
      return [item["name"] for item in supplies if item["kilos"] < item["minimum"]]


  def anything_missing(supplies):
      """True if any supply is below its minimum."""
      return any(item["kilos"] < item["minimum"] for item in supplies)


  print(total_kilos(pantry), to_buy(pantry), anything_missing(pantry))
globals:
  pantry:
    - { name: potato, kilos: 12, minimum: 10 }
    - { name: corn, kilos: 3, minimum: 5 }
    - { name: quinoa, kilos: 4, minimum: 4 }
    - { name: onion, kilos: 1, minimum: 6 }
hints:
  - "`sum(item[\"kilos\"] for item in supplies)`: without square brackets, no list gets built."
  - "`anything_missing` is the same question as `to_buy`'s filter, inside `any(...)`."
tests:
  - name: total_kilos of the pantry
    run: total_kilos(pantry)
    equals: 20
  - name: total_kilos of an empty pantry
    run: total_kilos([])
    equals: 0
  - name: to_buy, in order
    run: to_buy(pantry)
    equals: ["corn", "onion"]
  - name: exactly at the minimum isn't bought
    run: 'to_buy([{"name": "quinoa", "kilos": 4, "minimum": 4}])'
    equals: []
  - name: anything_missing with the example pantry
    run: anything_missing(pantry)
    equals: true
  - name: anything_missing when everything is enough
    run: 'anything_missing([{"name": "potato", "kilos": 12, "minimum": 10}])'
    equals: false
  - name: uses any
    source: '\bany\s*\('
  - name: sum gets a generator expression
    source: '\bsum\s*\(\s*\w[^\n]*\bfor\b'
    msg: "Write sum(... for item in supplies), without building a list or a separate loop."
  - name: no append
    sourceNot: '\.append\s*\('
    msg: With a comprehension you don't need append.
```

## The case

```exercise
id: py8-caso-menu
type: case
title: The menu someone padded
prompt: |
  **Work out how much each waiter really charged, without counting the cancelled tickets, and compare it with what they reported.**

  At Saturday's closing, doña Paulina's till doesn't add up: the waiters reported more money than came in. Each ticket is a list `[waiter, dish, quantity, cancelled]`; the cancelled ones went back to the kitchen and **aren't charged**. The prices are in `menu`.

  Print one line per waiter that starts with their name and ends with their total: `print("Wilber:", total)`. The board compares it with what they reported. A dictionary comprehension with a generator sum inside does it all at once.
visual:
  board:
    for: py8-caso-menu
    task: "Each waiter's total = the sum of price × quantity over their tickets that weren't cancelled. Compare it with what they reported."
    cards:
      - name: Wilber
        kind: person
        rows: [["Tickets", "4 (1 cancelled)"], ["Reported", "S/ 66"]]
        clue: { find: "Wilber", says: 66 }
      - name: Yaneth
        kind: person
        rows: [["Tickets", "3"], ["Reported", "S/ 85"]]
        clue: { find: "Yaneth", says: 85 }
      - name: Edwin
        kind: person
        culprit: true
        rows: [["Tickets", "4 (1 cancelled)"], ["Reported", "S/ 89"]]
        clue: { find: "Edwin", says: 89 }
      - name: Rocío
        kind: person
        rows: [["Tickets", "3 (1 cancelled)"], ["Reported", "S/ 68"]]
        clue: { find: "Rocío", says: 68 }
      - name: The blackboard
        kind: note
        role: Doña Paulina's menu
        rows: [["Caldo de gallina", "S/ 14"], ["Chiriuchu", "S/ 25"], ["Adobo", "S/ 18"], ["Rocoto relleno", "S/ 16"], ["Trucha frita", "S/ 22"], ["Sopa de quinua", "S/ 8"], ["Chicha de jora", "S/ 5"]]
    caption: "If three waiters don't match, check whether you're charging the cancelled tickets."
globals:
  menu: { caldo de gallina: 14, chiriuchu: 25, adobo: 18, rocoto relleno: 16, trucha frita: 22, sopa de quinua: 8, chicha de jora: 5 }
  tickets:
    - [Wilber, caldo de gallina, 2, false]
    - [Yaneth, adobo, 3, false]
    - [Edwin, chiriuchu, 1, false]
    - [Rocío, trucha frita, 2, false]
    - [Wilber, chicha de jora, 4, false]
    - [Edwin, rocoto relleno, 2, true]
    - [Yaneth, sopa de quinua, 2, false]
    - [Rocío, chiriuchu, 1, true]
    - [Edwin, trucha frita, 1, false]
    - [Wilber, adobo, 1, false]
    - [Yaneth, chicha de jora, 3, false]
    - [Edwin, chicha de jora, 2, false]
    - [Rocío, sopa de quinua, 3, false]
    - [Wilber, rocoto relleno, 1, true]
starter: |
  # menu (dish → price) and tickets already exist. Each ticket is
  # [waiter, dish, quantity, cancelled]:
  print(tickets[0])
  print(menu["caldo de gallina"])

  waiters = ["Wilber", "Yaneth", "Edwin", "Rocío"]

  # TODO: each waiter's total, without the cancelled tickets
  # TODO: print one line per waiter, for example: print("Wilber:", total)
solution: |
  waiters = ["Wilber", "Yaneth", "Edwin", "Rocío"]

  totals = {
      waiter: sum(menu[dish] * quantity for who, dish, quantity, cancelled in tickets if who == waiter and not cancelled)
      for waiter in waiters
  }
  for waiter, total in totals.items():
      print(f"{waiter}:", total)
answer: Edwin
answerLabel: Which waiter padded his total?
reveal: |
  Edwin. He really charged `25 + 22 + 2 × 5 = 57`, but reported 89: he added the two rocotos rellenos (32 soles) that went back to the kitchen. Wilber and Rocío have cancelled tickets too, but they didn't count them.
hints:
  - "For one waiter: `sum(menu[dish] * quantity for who, dish, quantity, cancelled in tickets if who == waiter and not cancelled)`."
  - "Wrap it in `{waiter: … for waiter in waiters}` and go through the dictionary with `.items()` to print."
```

## The judge

As since session 4, the judge **calls your functions** and compares what they return. Today's two can be written with comprehensions, `sorted` with `key` and `zip`; the judge doesn't require it, but you'll write a lot less.

```exercise
id: py8-juez-vendidos
type: judge
mode: function
function: best_sellers
title: San Pedro's most ordered
prompt: |
  **Write `best_sellers(sales, k)`, which returns the names of the `k` dishes that sold the most portions.**

  Doña Paulina wants to put the day's "top" up on the blackboard. `sales` is the list of what came out of the kitchen, in the order it came out: `[dish, portions]` pairs. **The same dish appears many times** (each table orders it separately), so first you have to add up its portions.

  - Sort from the one that sold the most portions to the one that sold the fewest.
  - If two dishes tie, the one that comes first **in alphabetical order** goes first.
  - If there are fewer than `k` different dishes, return them all.

  **Constraints:** 0 to 25 sales · portions from 1 to 6 · 1 ≤ k ≤ 5.
visual:
  figure:
    title: Example 1, added up and sorted
    input:
      label: sales
      table: { head: ["dish", "portions"], rows: [["caldo", "2"], ["adobo", "3"], ["trucha", "1"], ["caldo", "1"], ["trucha", "2"], ["chiriuchu", "1"]] }
    arrow: "add up → caldo 3, adobo 3, trucha 3, chiriuchu 1 → sort"
    output: { label: "best_sellers(sales, 2)", cells: ["adobo", "caldo"] }
    steps:
      - "Caldo, adobo and trucha add up to 3 portions each: they tie."
      - "In a tie the alphabet decides: adobo, caldo, trucha."
      - "With k = 2 the first two stay."
starter: |
  def best_sellers(sales, k):
      pass
solution: |
  def best_sellers(sales, k):
      """The k dishes with the most portions; ties, by name."""
      portions = {}
      for dish, quantity in sales:
          portions[dish] = portions.get(dish, 0) + quantity
      ranked = sorted(portions, key=lambda dish: (-portions[dish], dish))
      return ranked[:k]
hints:
  - "First add up: a dictionary `dish → portions` with `portions.get(dish, 0) + quantity`."
  - "`key=lambda dish: (-portions[dish], dish)` sorts by portions from most to fewest (because of the minus sign) and, if they tie, by name."
samples:
  - args: [[["caldo", 2], ["adobo", 3], ["trucha", 1], ["caldo", 1], ["trucha", 2], ["chiriuchu", 1]], 2]
    returns: ["adobo", "caldo"]
    note: The picture above.
  - args: [[["chiriuchu", 4], ["adobo", 1], ["chiriuchu", 2]], 3]
    returns: ["chiriuchu", "adobo"]
    note: There are only two different dishes, so both are returned.
  - args: [[["sopa de quinua", 5], ["lechón", 6]], 1]
    returns: ["lechón"]
edge:
  - args: [[], 3]
    tag: with no sales
  - args: [[["emoliente", 2]], 5]
    tag: with a single dish
  - args: [[["trucha", 2], ["caldo", 2], ["adobo", 2], ["lechón", 2]], 3]
    tag: with everything tied
  - args: [[["adobo", 1], ["adobo", 1], ["adobo", 1], ["caldo", 2]], 1]
    tag: when a dish wins by adding up small portions
  - args: [[["trucha", 5], ["adobo", 6], ["adobo", 1], ["caldo", 3], ["caldo", 4]], 2]
    tag: with ties that only show up after adding
random:
  count: 40
  seed: 808
  generate: |
    names = ["adobo", "caldo de gallina", "chiriuchu", "trucha frita", "rocoto relleno",
             "sopa de quinua", "chicha de jora", "lechón", "emoliente", "cuy chactado"]
    assortment = rng.shuffle(names)[:rng.int(1, 10)]
    sales = [[rng.pick(assortment), rng.int(1, 6)] for _ in range(rng.int(0, 25))]
    return [sales, rng.int(1, 5)]
wrong:
  - |
    def best_sellers(sales, k):
        portions = {}
        for dish, quantity in sales:
            portions[dish] = portions.get(dish, 0) + quantity
        return sorted(portions, key=lambda dish: portions[dish], reverse=True)[:k]
  - |
    def best_sellers(sales, k):
        portions = {}
        for dish, quantity in sales:
            portions[dish] = portions.get(dish, 0) + quantity
        return sorted(portions, key=lambda dish: (portions[dish], dish), reverse=True)[:k]
  - |
    def best_sellers(sales, k):
        portions = {dish: quantity for dish, quantity in sales}
        return sorted(portions, key=lambda dish: (-portions[dish], dish))[:k]
```

```exercise
id: py8-juez-reporte
type: judge
mode: function
function: daily_report
title: The numbered report
prompt: |
  **Write `daily_report(dishes, prices, sold)`, which returns the lines of the evening report, and `daily_total(dishes, prices, sold)`, which returns how much was sold in soles.**

  Doña Paulina keeps three lists of the same length: at position `i` are a dish's name, its price and how many portions were sold. For the report she wants **one line per dish that sold something** (the ones with 0 portions are left out), numbered from 1 **without skipping numbers**, in this exact format:

  `1. chiriuchu: 3 x 25 = 75`

  That is: number, full stop, space, dish, colon, portions, ` x `, price, ` = ` and the subtotal. The lines go in the order of the lists. The judge also tests `daily_total` on its own.

  **Constraints:** 0 to 8 dishes · prices from 3 to 30 · portions from 0 to 5.
visual:
  figure:
    title: Example 1, on paper
    input:
      label: three lists
      table: { head: ["dishes", "prices", "sold"], rows: [["chiriuchu", "25", "3"], ["adobo", "18", "0"], ["trucha frita", "22", "2"]] }
    arrow: "zip pairs them up · the adobo didn't sell · enumerate numbers from 1"
    output: { label: returns, text: "1. chiriuchu: 3 x 25 = 75\n2. trucha frita: 2 x 22 = 44" }
    steps:
      - "The adobo sold nothing: it has no line."
      - "The trucha is number **2**, not 3: only the lines that remain are numbered."
      - "`daily_total` of these lists is 75 + 44 = 119."
starter: |
  def daily_report(dishes, prices, sold):
      pass


  def daily_total(dishes, prices, sold):
      pass
solution: |
  def daily_report(dishes, prices, sold):
      """One numbered line for each dish that sold something."""
      with_sales = [(dish, price, quantity) for dish, price, quantity in zip(dishes, prices, sold) if quantity > 0]
      return [
          f"{n}. {dish}: {quantity} x {price} = {quantity * price}"
          for n, (dish, price, quantity) in enumerate(with_sales, start=1)
      ]


  def daily_total(dishes, prices, sold):
      """What was sold, in soles."""
      return sum(price * quantity for price, quantity in zip(prices, sold))
hints:
  - "First filter with a comprehension over `zip(dishes, prices, sold)`; then number with `enumerate(…, start=1)`. The other way round, numbers get skipped."
  - "`daily_total` is a generator sum over `zip(prices, sold)`."
samples:
  - args: [["chiriuchu", "adobo", "trucha frita"], [25, 18, 22], [3, 0, 2]]
    returns: ["1. chiriuchu: 3 x 25 = 75", "2. trucha frita: 2 x 22 = 44"]
    note: The picture above.
  - args: [["caldo de gallina", "emoliente"], [14, 3], [1, 4]]
    returns: ["1. caldo de gallina: 1 x 14 = 14", "2. emoliente: 4 x 3 = 12"]
  - fn: daily_total
    args: [["chiriuchu", "adobo", "trucha frita"], [25, 18, 22], [3, 0, 2]]
    returns: 119
edge:
  - args: [[], [], []]
    tag: with no dishes
  - args: [["adobo", "lechón"], [18, 20], [0, 0]]
    tag: when nothing was sold
  - args: [["adobo", "lechón", "caldo de gallina", "emoliente"], [18, 20, 14, 3], [0, 0, 0, 5]]
    tag: when only the last one sells
  - args: [["cuy chactado"], [30], [5]]
    tag: with a single dish
  - fn: daily_total
    args: [[], [], []]
    tag: in daily_total, with no dishes
  - fn: daily_total
    args: [["adobo", "lechón"], [18, 20], [0, 0]]
    tag: in daily_total, with no sales
random:
  count: 40
  seed: 88
  generate: |
    names = ["adobo", "caldo de gallina", "chiriuchu", "trucha frita", "rocoto relleno",
             "sopa de quinua", "chicha de jora", "lechón", "emoliente", "cuy chactado"]
    n = rng.int(0, 8)
    return [rng.shuffle(names)[:n], rng.list(n, 3, 30), rng.list(n, 0, 5)]
wrong:
  - |
    def daily_report(dishes, prices, sold):
        return [
            f"{n}. {dish}: {quantity} x {price} = {quantity * price}"
            for n, (dish, price, quantity) in enumerate(zip(dishes, prices, sold), start=1)
            if quantity > 0
        ]


    def daily_total(dishes, prices, sold):
        return sum(price * quantity for price, quantity in zip(prices, sold))
  - |
    def daily_report(dishes, prices, sold):
        with_sales = [(d, pr, q) for d, pr, q in zip(dishes, prices, sold) if q > 0]
        return [f"{n}. {d}: {q} x {pr} = {q * pr}" for n, (d, pr, q) in enumerate(with_sales)]


    def daily_total(dishes, prices, sold):
        return sum(pr * q for pr, q in zip(prices, sold))
```

## Final mission

```exercise
id: py8-mision-comedor
type: mission
title: Doña Paulina's lunch
prompt: |
  **Serve every ticket that wasn't cancelled, in table-number order, and go back to the kitchen.**

  Quilla starts in the kitchen (K) facing east, in the aisle. The tables are in the bottom row, **out of order** and in a different place in each test, so you have to read them from the map: `robot.map()` returns the eatery's rows as texts, and in row `2` each table is a digit in its column.

  1. Build `column_of`, a **dictionary comprehension** `table number → column`, going through `robot.map()[2]` with `enumerate`. `cell.isdigit()` tells you whether a cell is a table.
  2. Build `to_serve`: the `(table, dish)` pairs of the **non-cancelled** `orders`, with a comprehension, sorted by table number with `sorted(…, key=lambda …)`. If a table has two tickets, they go in the order they arrived (`sorted` keeps that order in ties).
  3. For each pair: `robot.cook(dish)` in the kitchen, move forward to the table's column (the kitchen is in column 1), `robot.serve()` and go back to the kitchen facing east. `about_turn` is already written.

  Once it passes, together with the judges, session 9 unlocks.
visual:
  figure:
    title: The first test's eatery, read
    panes:
      - { label: "robot.map()", grid: ["############", "#K.........#", "##3#1##4#2##", "############"], marks: ["2,2", "4,2", "7,2", "9,2"] }
      - { label: column_of, table: { head: ["table", "column"], rows: [["3", "2"], ["1", "4"], ["4", "7"], ["2", "9"]] } }
starter: |
  # orders comes from the till, for example:
  # [{"table": 4, "dish": "adobo", "cancelled": False}, ...]

  def about_turn():
      robot.turn_right()
      robot.turn_right()


  table_row = robot.map()[2]
  print(table_row)
  # TODO: column_of = {… for … in enumerate(table_row) if …}
  # TODO: to_serve = sorted([… for o in orders if …], key=lambda …)
  # TODO: serve each pair and go back to the kitchen
solution: |
  def about_turn():
      robot.turn_right()
      robot.turn_right()


  table_row = robot.map()[2]
  column_of = {int(cell): x for x, cell in enumerate(table_row) if cell.isdigit()}
  pending = [(o["table"], o["dish"]) for o in orders if not o["cancelled"]]
  to_serve = sorted(pending, key=lambda pair: pair[0])

  for table, dish in to_serve:
      steps = column_of[table] - 1
      robot.cook(dish)
      robot.forward(steps)
      robot.serve()
      about_turn()
      robot.forward(steps)
      about_turn()
hints:
  - "`{int(cell): x for x, cell in enumerate(table_row) if cell.isdigit()}`: `enumerate` gives each cell's column `x`."
  - "Sorting the tuples without `key` also compares the dish when the table ties, and changes the order of arrival. With `key=lambda pair: pair[0]` only the table counts."
world:
  theme: cocina
  level: 4
  dir: E
  api: [move, kitchen, map]
  map: |
    ############
    #K.........#
    ##3#1##4#2##
    ############
globals:
  orders:
    - { table: 4, dish: adobo, cancelled: false }
    - { table: 1, dish: chiriuchu, cancelled: false }
    - { table: 4, dish: chicha de jora, cancelled: false }
    - { table: 2, dish: trucha frita, cancelled: true }
    - { table: 3, dish: caldo de gallina, cancelled: false }
scenarios:
  - {}
  - map: |
      ##########
      #K.......#
      ###2#4#1##
      ##########
    globals:
      orders:
        - { table: 4, dish: trucha frita, cancelled: false }
        - { table: 2, dish: sopa de quinua, cancelled: false }
        - { table: 1, dish: adobo, cancelled: true }
        - { table: 2, dish: chicha de jora, cancelled: false }
        - { table: 4, dish: emoliente, cancelled: false }
        - { table: 1, dish: caldo de gallina, cancelled: false }
  - map: |
      #######
      #K....#
      ####5##
      #######
    globals:
      orders:
        - { table: 5, dish: rocoto relleno, cancelled: false }
        - { table: 5, dish: lechón, cancelled: true }
tests:
  - name: serves the non-cancelled ones, by table number
    state: '[(s.table, s.dish) for s in w.served] == [(o["table"], o["dish"]) for o in sorted(g["orders"], key=lambda o: o["table"]) if not o["cancelled"]]'
    msg: The dishes served don't match (table, dish or order). Did you drop the cancelled ones and sort by table only?
  - name: ends in the kitchen facing east
    state: 'w.at_kitchen and w.dir == "E"'
  - name: without crashing
    state: not w.crashed
  - name: reads the tables with a dictionary comprehension
    source: '\{[^{}\n]*:[^{}\n]*\bfor\b[^{}\n]*\benumerate\s*\('
    msg: "Build column_of with {… : … for x, cell in enumerate(…) if …}."
  - name: filters the tickets with a comprehension
    source: '\[[^\n]*\bfor\b[^\n]*\bif\b'
  - name: sorts with key
    source: '\bsorted\s*\([\s\S]*key\s*='
```

## Expert challenge

```exercise
id: py8-reto-menu
type: challenge
title: The menu that's within reach
visual:
  figure:
    title: An example
    input:
      label: recipes and pantry
      cards:
        - { title: adobo, rows: [["pork", "300"], ["chicha de jora", "200"]] }
        - { title: caldo de gallina, rows: [["hen", "250"], ["potato", "200"]] }
        - { title: pantry, rows: [["pork", "1000"], ["chicha de jora", "500"], ["hen", "1000"], ["potato", "300"]] }
    arrow: "portions = the ingredient that runs out first"
    output: { label: returns, text: "[('adobo', 2), ('caldo de gallina', 1)]" }
prompt: |
  **Write `possible_menu(recipes, pantry)`, which returns which dishes can be cooked today and how many portions of each.** For people who already code.

  `recipes` is a dictionary `dish → {ingredient: grams per portion}` and `pantry` a dictionary `ingredient → grams available`. Each dish is worked out **separately**, as if it were the only one (the ingredients aren't shared out between dishes).

  - A dish's portions are the ones the ingredient that runs out first allows. An ingredient that isn't in the pantry counts as 0 grams.
  - Return a list of `(dish, portions)` tuples, only for the dishes with at least one portion.
  - Sort it from most portions to fewest; in a tie, by name.

  Try writing it with a comprehension, a generator expression inside `min` and a `sorted` with `key`.
starter: |
  def possible_menu(recipes, pantry):
      return []


  # recipes and pantry already exist: the ones in the picture
  print(possible_menu(recipes, pantry))
solution: |
  def possible_menu(recipes, pantry):
      """Possible dishes with their portions, from most to fewest."""
      portions = {
          dish: min(pantry.get(ingredient, 0) // grams for ingredient, grams in recipe.items())
          for dish, recipe in recipes.items()
      }
      possible = [(dish, count) for dish, count in portions.items() if count > 0]
      return sorted(possible, key=lambda pair: (-pair[1], pair[0]))


  # recipes and pantry already exist: the ones in the picture
  print(possible_menu(recipes, pantry))
globals:
  recipes:
    adobo: { pork: 300, chicha de jora: 200 }
    caldo de gallina: { hen: 250, potato: 200 }
  pantry: { pork: 1000, chicha de jora: 500, hen: 1000, potato: 300 }
hints:
  - "For one dish: `min(pantry.get(ingredient, 0) // grams for ingredient, grams in recipe.items())`."
  - "`key=lambda pair: (-pair[1], pair[0])` sorts by portions from most to fewest and then by name."
tests:
  - name: the example
    run: possible_menu(recipes, pantry)
    equals: [["adobo", 2], ["caldo de gallina", 1]]
  - name: a missing ingredient leaves the dish out
    run: 'possible_menu({"cuy chactado": {"cuy": 1, "potato": 150}, "sopa de quinua": {"quinoa": 80}}, {"potato": 900, "quinoa": 400})'
    equals: [["sopa de quinua", 5]]
  - name: ties go by name
    run: 'possible_menu({"trucha frita": {"trout": 200}, "chiriuchu": {"cuy": 1, "hen": 200}, "lechón": {"pork": 500}}, {"trout": 600, "cuy": 3, "hen": 600, "pork": 1000})'
    equals: [["chiriuchu", 3], ["trucha frita", 3], ["lechón", 2]]
  - name: with an empty pantry nothing comes out
    run: 'possible_menu({"adobo": {"pork": 300}}, {})'
    equals: []
  - name: with no recipes
    run: 'possible_menu({}, {"potato": 500})'
    equals: []
  - name: each dish is worked out separately
    run: 'possible_menu({"adobo": {"pork": 300}, "lechón": {"pork": 500}}, {"pork": 1000})'
    equals: [["adobo", 3], ["lechón", 2]]
```
