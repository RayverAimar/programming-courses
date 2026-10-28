# Session 20 — Performance

## The job

Gamarra, La Victoria, December 20th. Five days to Christmas and the textile emporium never sleeps: the shopping arcades open at five in the morning, tricycles loaded with rolls of fabric push their way through the crowd and in every workshop the overlockers sound like rain. **Doña Felícita Mamani**, of *Confecciones El Hilo de Oro*, has an order for forty thousand T-shirts for a chain of stores and an order system someone wrote for her in Python.

The system works. The problem is that the nightly report, with every order of the season, **takes almost an hour**, and by then doña Felícita should already be cutting fabric. Maru sent her Quilla, with its siren to clear a way through Jirón Gamarra, and a single instruction: "Don't guess what's slow. **Measure it**." Today Quilla learns to count how much work a program does as the data grows, and to change the step that grows badly.

```scene
theme: barranco
level: 2
dir: E
caption: Jirón Gamarra at six in the morning. Quilla makes its way between the arcades to doña Felícita's workshop (D) with the first roll of fabric.
map: |
  ##############
  #R.......#...#
  #.######.#.#.#
  #......#...#D#
  ##############
program: |
  robot.say("Excuse me, fabric coming through!")
  robot.forward(7)
  robot.turn_right()
  robot.forward(2)
  robot.turn_left()
  robot.forward(2)
  robot.turn_left()
  robot.forward(2)
  robot.turn_right()
  robot.forward(2)
  robot.turn_right()
  robot.forward(2)
  robot.deliver("roll of fabric")
```

## The minimum

A correct program can be useless if it takes too long. What matters isn't how long it takes with ten orders, but **how its work grows** as the orders grow. That's called its **complexity**, and it's written in *big O* notation: `O(n)` grows like the data, `O(n²)` grows with the square.

```figure
title: How much work each complexity is with n = 100,000 orders
panes:
  - table:
      head: ["complexity", "example", "steps, roughly"]
      rows:
        - ["O(1)", "x in a_set, d[key]", "1"]
        - ["O(log n)", "bisect, heappush", "17"]
        - ["O(n)", "a for, x in a_list", "100,000"]
        - ["O(n log n)", "sorted(a_list)", "1,700,000"]
        - ["O(n²)", "a for inside another", "10,000,000,000"]
caption: "Ten billion steps is minutes or hours. Doubling the data doubles the work of an `O(n)`, but **quadruples** it in an `O(n²)`."
```

**Measure.** `time.perf_counter()` is a high-precision stopwatch: you read it before and after, and the difference is seconds. Measure with data of two sizes; if doubling the data multiplies the time by four, there's a quadratic step.

```py
import time

start = time.perf_counter()
report = build_report(orders)
print(f"{(time.perf_counter() - start) * 1000:.1f} ms")   # for example: 431.7 ms
```

**`in` on a list or on a set.** `x in a_list` walks the list until it finds it: `O(n)`. `x in a_set` jumps straight there, like `d[key]` in a dictionary: `O(1)`. Inside a loop, the difference is the one in the table above. This example measures it (it doesn't print the times, which change on every machine, but the comparison):

```py run
import time

def measure(function):
    start = time.perf_counter()
    function()
    return time.perf_counter() - start

codes = list(range(300_000))
seen = set(codes)
in_list = measure(lambda: [-1 in codes for _ in range(20)])
in_set = measure(lambda: [-1 in seen for _ in range(20)])
print(in_list > 50 * in_set)
```

**Queues: `pop(0)` or `popleft()`.** `a_list.pop(0)` takes out the first one, but then shifts all the others one place to the left: `O(n)` every time. A `collections.deque` (the one from session 10) takes from both ends in `O(1)`:

```py
from collections import deque

queue = deque(orders)
while queue:
    order = queue.popleft()     # not queue.pop(0) on a list
```

**`heapq`: always the smallest, without sorting everything.** A *heap* is a list that Python keeps half sorted: the smallest is always at position 0. `heappush` and `heappop` cost `O(log n)`. It's good for two things: the **k best** of a huge list and **priority queues**, where you always deal first with the most urgent or the nearest thing (that's how Dijkstra works, the BFS for paths with different costs: it always takes out the cheapest pending tile).

```py run
import heapq

prices = [18, 7, 25, 7, 12, 30, 9]
print(heapq.nsmallest(3, prices), heapq.nlargest(2, prices))
pending = []
heapq.heappush(pending, (5, "Galería Guizado"))
heapq.heappush(pending, (2, "Jirón Gamarra"))
heapq.heappush(pending, (8, "Parque Cánepa"))
print(heapq.heappop(pending))
```

With tuples, the heap compares the first element first: the priority goes in front.

**Texts: `join`, not `+=`.** Texts are immutable: `report += line` may create a new text and copy everything before it on every turn. Gather the lines in a list and join them at the end with `"\n".join(lines)`.

<!-- legacy: perf-counter -->

<!-- legacy: str-join -->

**Range sums: the prefix.** If you're asked many times "how much was sold between minute `a` and minute `b`?", adding up the range each time is `O(n)` per question. Better to build once the list of **running sums**, with a `0` in front: `prefix[i]` is what was sold before minute `i`. Each question is one subtraction.

```anim
title: Running sums, and a range with one subtraction
code: |
  sales = [4, 1, 3, 5, 2]
  prefix = [0]
  for sale in sales:
      prefix.append(prefix[-1] + sale)
  first, last = 1, 3
  print(prefix[last + 1] - prefix[first])
cells: { of: sales, at: sale }
notes:
  2: "The 0 in front: before minute 0 nothing was sold."
  4: "Each new cell is the previous one plus this minute's sale."
  6: "From minute 1 to 3: what was sold before 4 minus what was sold before 1. 13 − 4 = 9."
```

**Two pointers.** In a **sorted** list, to look for a pair that adds up to exactly an amount you don't need two loops: one index starts on the left and another on the right. If the sum is too big, the right one moves back; if it falls short, the left one moves forward. Each step discards one element: `O(n)`.

```anim
title: Two pointers look for a pair that adds up to 25
code: |
  prices = [3, 5, 8, 11, 14, 20]
  left, right = 0, len(prices) - 1
  while prices[left] + prices[right] != 25:
      if prices[left] + prices[right] < 25:
          left += 1
      else:
          right -= 1
  print(prices[left], prices[right])
cells: { of: prices, at: left }
notes:
  3: "Do the cheapest and the most expensive left add up to 25?"
  5: "Too little: the cheapest doesn't reach 25 even with the most expensive. It's discarded and the left one moves forward."
  7: "Too much: the most expensive goes over even with the cheapest. It's discarded and the right one moves back."
  8: "5 + 20 = 25, in two turns and without comparing everything with everything."
```

> **Common trap:** an `in` on a list inside a `for` is **a loop inside another**, even if you only see one `for`. The same goes for `a_list.pop(0)`, `a_list.index(x)`, `a_list.count(x)` and `a_list.remove(x)`: each one walks the list. With little data you don't notice; with a hundred thousand, it's the step that takes an hour.

<!-- mdn: perf-counter heapq str-join -->

## Practice

```exercise
id: py20-predice-pasos
type: predict
title: Counting the steps
prompt: |
  Before measuring with a clock, count. What does it print?
visual:
  figure:
    panes:
      - { label: "pairs (i, j) with i < j among 4 rolls", table: { head: ["i", "j goes over"], rows: [["0", "1, 2, 3"], ["1", "2, 3"], ["2", "3"], ["3", "—"]] } }
code: |
  steps = 0
  for i in range(4):
      for j in range(i + 1, 4):
          steps += 1
  seen = set()
  for code in [5, 3, 5, 8]:
      seen.add(code)
  print(steps, len(seen))
options:
  - "6 3"
  - "16 4"
  - "6 4"
  - "12 3"
answer: "6 3"
explain: |
  Comparing each one with the ones after it is `3 + 2 + 1 = 6` steps: with `n` items, `n × (n − 1) / 2`, which grows like `n²`. The set keeps each code only once: the repeated 5 doesn't count, 3 are left.
```

```exercise
id: py20-completa-cronometro
type: complete
title: Quilla's stopwatch
prompt: |
  Complete `time_it(function, *args)`: it calls `function(*args)` and returns a tuple with what it returned and **how many milliseconds** it took, measured with `time.perf_counter()`.
starter: |
  import time


  def time_it(function, *args):
      """Returns (result, milliseconds) of calling function(*args)."""
      start = time.___()
      result = function(*args)
      end = time.___()
      return result, (end - start) * ___


  result, ms = time_it(sorted, [30, 12, 25])
  print(result, ms >= 0)
solution: |
  import time


  def time_it(function, *args):
      """Returns (result, milliseconds) of calling function(*args)."""
      start = time.perf_counter()
      result = function(*args)
      end = time.perf_counter()
      return result, (end - start) * 1000


  result, ms = time_it(sorted, [30, 12, 25])
  print(result, ms >= 0)
hints:
  - "Both clock readings are `time.perf_counter()`; the difference is in seconds."
  - "One second is 1000 milliseconds."
tests:
  - name: returns the function's result
    run: time_it(sorted, [30, 12, 25])[0]
    equals: [12, 25, 30]
  - name: passes the arguments
    run: time_it(max, 4, 9, 2)[0]
    equals: 9
  - name: the time is a number that isn't negative
    expect: 'time_it(sum, [1, 2])[1] >= 0'
  - name: the time is in milliseconds
    expect: 'time_it(sum, range(3_000_000))[1] > 1'
    msg: Adding up three million numbers takes several milliseconds. Did you multiply the seconds by 1000?
  - name: uses perf_counter
    source: 'perf_counter\(\)[\s\S]*perf_counter\(\)'
```

```exercise
id: py20-arregla-remalladoras
type: fix
title: The overlocker queue
prompt: |
  In the workshop, each order goes through the overlocker **10 dozen per turn**: if it needs more, it goes back to the end of the queue with what it still needs. `finish_order(orders)` returns the names in the order they finish.

  It gives the right answer, but with the season's two thousand orders it crawls: every `pop(0)` shifts the whole list. Change it to a `deque` with `popleft()`, without changing what it returns.
visual:
  figure:
    title: 'finish_order([["Rosa", 25], ["Jhon", 8], ["Milka", 12]])'
    input: { label: queue, cells: ["Rosa 25", "Jhon 8", "Milka 12"] }
    arrow: "turns of 10: Rosa 25→15 · Jhon finishes · Milka 12→2 · Rosa 15→5 · Milka finishes · Rosa finishes"
    output: { label: returns, value: "['Jhon', 'Milka', 'Rosa']" }
starter: |
  def finish_order(orders):
      """Names in the order they finish, at 10 dozen per turn."""
      queue = [(name, dozens) for name, dozens in orders]
      finished = []
      while queue:
          name, dozens = queue.pop(0)
          if dozens > 10:
              queue.append((name, dozens - 10))
          else:
              finished.append(name)
      return finished


  print(finish_order([["Rosa", 25], ["Jhon", 8], ["Milka", 12]]))
solution: |
  from collections import deque


  def finish_order(orders):
      """Names in the order they finish, at 10 dozen per turn."""
      queue = deque((name, dozens) for name, dozens in orders)
      finished = []
      while queue:
          name, dozens = queue.popleft()
          if dozens > 10:
              queue.append((name, dozens - 10))
          else:
              finished.append(name)
      return finished


  print(finish_order([["Rosa", 25], ["Jhon", 8], ["Milka", 12]]))
hints:
  - "`from collections import deque` and `queue = deque(...)` with the same thing the list had."
  - "`append` stays the same; only `pop(0)` changes to `popleft()`."
tests:
  - name: the example
    run: 'finish_order([["Rosa", 25], ["Jhon", 8], ["Milka", 12]])'
    equals: [Jhon, Milka, Rosa]
  - name: with no orders
    run: finish_order([])
    equals: []
  - name: exactly 10 dozen finish in one turn
    run: 'finish_order([["Ana", 20], ["Luz", 10]])'
    equals: [Luz, Ana]
  - name: uses a deque with popleft
    source: '\bdeque\b[\s\S]*\.popleft\(\)'
  - name: no more pop(0)
    sourceNot: '\.pop\(\s*0\s*\)'
    msg: Every pop(0) shifts the whole list one place. With a deque, popleft() is instant.
```

```exercise
id: py20-predice-heap
type: predict
title: The nearest first
prompt: |
  Quilla keeps its pending errands in a heap with their distance in blocks. What does it print?
code: |
  import heapq

  pending = []
  heapq.heappush(pending, (3, "sweatshirts"))
  heapq.heappush(pending, (1, "t-shirts"))
  heapq.heappush(pending, (2, "jackets"))
  print(heapq.heappop(pending)[1])
  print(pending[0])
  print(heapq.nsmallest(2, [9, 4, 7, 4]))
options:
  - "t-shirts\n(2, 'jackets')\n[4, 4]"
  - "sweatshirts\n(1, 't-shirts')\n[4, 7]"
  - "t-shirts\n(3, 'sweatshirts')\n[4, 4]"
  - "t-shirts\n(2, 'jackets')\n[4, 7]"
answer: "t-shirts\n(2, 'jackets')\n[4, 4]"
explain: |
  `heappop` takes out the smallest no matter what order they went in: the tuple `(1, "t-shirts")`. After that, the smallest one left is at position 0: `(2, "jackets")`. `nsmallest` respects repeats: the two smallest of `[9, 4, 7, 4]` are 4 and 4.
```

```exercise
id: py20-completa-guia
type: complete
title: The delivery note
prompt: |
  `delivery_note(orders)` builds the text of the delivery note: a first line `DELIVERY NOTE: n orders` and then one line `customer: dozens doz.` per order, separated by line breaks, **with no break at the end**. The old version used `+=` in a loop; complete the new one, which gathers the lines in a list and joins them with `join`.
starter: |
  def delivery_note(orders):
      """The text of the delivery note, line by line."""
      lines = [f"DELIVERY NOTE: {len(orders)} orders"]
      lines.extend(f"{customer}: {dozens} doz." for customer, dozens in ___)
      return ___.join(___)


  print(delivery_note([["Tiendas Sol", 40], ["Bazar Lucy", 12]]))
solution: |
  def delivery_note(orders):
      """The text of the delivery note, line by line."""
      lines = [f"DELIVERY NOTE: {len(orders)} orders"]
      lines.extend(f"{customer}: {dozens} doz." for customer, dozens in orders)
      return "\n".join(lines)


  print(delivery_note([["Tiendas Sol", 40], ["Bazar Lucy", 12]]))
hints:
  - "The separator goes before the dot: `\"\\n\".join(lines)`."
tests:
  - name: two orders
    run: 'delivery_note([["Tiendas Sol", 40], ["Bazar Lucy", 12]])'
    equals: "DELIVERY NOTE: 2 orders\nTiendas Sol: 40 doz.\nBazar Lucy: 12 doz."
  - name: with no orders, just the title
    run: delivery_note([])
    equals: "DELIVERY NOTE: 0 orders"
  - name: ten thousand orders at once
    expect: 'delivery_note([["C", 1]] * 10_000).count("\n") == 10_000'
  - name: no += on the text
    sourceNot: '\+='
  - name: uses join
    source: '\.join\('
```

```exercise
id: py20-escribe-punteros
type: write
title: Two garments for the budget
prompt: |
  A customer wants to take **two different garments** without going over budget. Write `affordable_pairs(prices, budget)`, which counts how many pairs `i < j` satisfy `prices[i] + prices[j] <= budget`. `prices` is already **sorted from lowest to highest**.

  Do it with two pointers: if the cheapest (`left`) and the most expensive (`right`) fit the budget, the cheapest also fits with **any** of the ones between them (`right - left` pairs), and `left` moves forward; if they don't fit, `right` moves back. One of the tests has thirty thousand prices: two nested loops won't finish in time.
visual:
  figure:
    title: affordable_pairs([2, 3, 5, 8, 13], 10)
    input: { label: prices, cells: [2, 3, 5, 8, 13] }
    arrow: "2+13 no · 2+8 yes: 3 pairs · 3+8 no · 3+5 yes: 1 pair"
    output: { label: returns, value: "4" }
starter: |
  def affordable_pairs(prices, budget):
      return 0


  print(affordable_pairs([2, 3, 5, 8, 13], 10))
solution: |
  def affordable_pairs(prices, budget):
      """Pairs i < j that add up to at most the budget, in a sorted list."""
      left, right = 0, len(prices) - 1
      pairs = 0
      while left < right:
          if prices[left] + prices[right] <= budget:
              pairs += right - left
              left += 1
          else:
              right -= 1
      return pairs


  print(affordable_pairs([2, 3, 5, 8, 13], 10))
hints:
  - "Start with `left, right = 0, len(prices) - 1` and repeat while `left < right`."
  - "When they fit, add `right - left` at once: that's the cheapest with each of the ones between the two."
tests:
  - name: the example
    run: affordable_pairs([2, 3, 5, 8, 13], 10)
    equals: 4
  - name: equal prices
    run: affordable_pairs([4, 4, 4], 8)
    equals: 3
  - name: none fits
    run: affordable_pairs([6, 7, 9], 12)
    equals: 0
  - name: with no prices
    run: affordable_pairs([], 5)
    equals: 0
  - name: a single price makes no pair
    run: affordable_pairs([9], 20)
    equals: 0
  - name: thirty thousand prices, in time
    run: affordable_pairs(list(range(30_000)), 30_000)
    equals: 225014999
    msg: With two nested loops that's 450 million additions. Use the two pointers.
  - name: uses a while
    source: '\bwhile\b'
```

## The case

```exercise
id: py20-caso-reporte
type: case
title: The report that took an hour
prompt: |
  **Measure each step of the report with 2000 and with 4000 orders and find the quadratic one: when the orders double, its time is multiplied by four.**

  Doña Felícita's report has four steps, and each one was written by a different nephew or niece. With one day's orders it takes a second; with the season's million orders, almost an hour. All four swear their step "is super fast". Edwin, on top of that, is sure the culprit is the `+=` in `write_up`.

  Write `measure(step, orders)`, which returns the milliseconds `step(orders)` takes, and print one line per step that starts with its name: `print(f"{step.__name__}: {ms_2000:.1f} ms → {ms_4000:.1f} ms")`. The times change on every machine; the way they grow doesn't.
visual:
  board:
    for: py20-caso-reporte
    task: "Measure each step with 2000 and 4000 orders. The one that multiplies by four is quadratic."
    cards:
      - name: Yovana
        kind: person
        rows: [["Step", "clean"], ["Says", "\"One pass and done.\""]]
        clue: { find: "clean" }
      - name: Kevin
        kind: person
        culprit: true
        rows: [["Step", "unique_customers"], ["Says", "\"I just check whether I already wrote it down.\""]]
        clue: { find: "unique_customers" }
      - name: Lucía
        kind: person
        rows: [["Step", "sort_by_dozens"], ["Says", "\"I use sorted, which comes with Python.\""]]
        clue: { find: "sort_by_dozens" }
      - name: Edwin
        kind: person
        rows: [["Step", "write_up"], ["Says", "\"The slow one is my +=, for sure.\""]]
        clue: { find: "write_up" }
    caption: "If you're torn between two, look at how much each one grows when the orders double, not which one looks uglier."
starter: |
  import time


  def orders_of_the_day(n):
      """n made-up orders, always the same: (customer, garment, dozens)."""
      garments = ["T-shirt", "Sweatshirt", "Shorts", "Jacket", "Sweater"]
      customers = n * 3 // 4 + 1
      return [(f" C{(i * 7919) % customers} ", garments[i % 5], 1 + i % 12) for i in range(n)]


  # The report's four steps, just as the nephews and nieces wrote them
  def clean(orders):
      return [(customer.strip(), garment.lower(), dozens) for customer, garment, dozens in orders]


  def unique_customers(orders):
      unique = []
      for customer, _, _ in orders:
          if customer not in unique:
              unique.append(customer)
      return unique


  def sort_by_dozens(orders):
      return sorted(orders, key=lambda order: order[2], reverse=True)


  def write_up(orders):
      report = ""
      for customer, garment, dozens in orders:
          report += f"{customer}: {dozens} doz. of {garment}\n"
      return report


  steps = [clean, unique_customers, sort_by_dozens, write_up]
  small = orders_of_the_day(2000)
  large = orders_of_the_day(4000)
  print(len(small), "and", len(large), "orders ready to measure")

  # TODO: write measure(step, orders), which returns milliseconds with time.perf_counter()
  # TODO: for each step, measure it with small and with large and print a line that starts with its name
solution: |
  import time


  def orders_of_the_day(n):
      """n made-up orders, always the same: (customer, garment, dozens)."""
      garments = ["T-shirt", "Sweatshirt", "Shorts", "Jacket", "Sweater"]
      customers = n * 3 // 4 + 1
      return [(f" C{(i * 7919) % customers} ", garments[i % 5], 1 + i % 12) for i in range(n)]


  def clean(orders):
      return [(customer.strip(), garment.lower(), dozens) for customer, garment, dozens in orders]


  def unique_customers(orders):
      unique = []
      for customer, _, _ in orders:
          if customer not in unique:
              unique.append(customer)
      return unique


  def sort_by_dozens(orders):
      return sorted(orders, key=lambda order: order[2], reverse=True)


  def write_up(orders):
      report = ""
      for customer, garment, dozens in orders:
          report += f"{customer}: {dozens} doz. of {garment}\n"
      return report


  steps = [clean, unique_customers, sort_by_dozens, write_up]
  small = orders_of_the_day(2000)
  large = orders_of_the_day(4000)


  def measure(step, orders):
      """Milliseconds that step(orders) takes."""
      start = time.perf_counter()
      step(orders)
      return (time.perf_counter() - start) * 1000


  for step in steps:
      ms_2000 = measure(step, small)
      ms_4000 = measure(step, large)
      print(f"{step.__name__}: {ms_2000:.1f} ms → {ms_4000:.1f} ms")
answer: unique_customers
answerLabel: Which step is quadratic?
reveal: |
  `unique_customers`. Its `if customer not in unique` walks the `unique` list for every order: it's a loop inside another, and with 4000 orders it takes about four times as long as with 2000 (and dozens of times more than the other steps). With a set, `seen = set()` and `if customer not in seen`, it drops to one step per order; if the order matters too, `list(dict.fromkeys(customers))` keeps it.

  Edwin blamed the wrong step: his `+=` is the old style, but CPython usually stretches the text in place and here you barely notice it. That's why you measure before changing anything. `sorted` is `O(n log n)`: it grows a little more than double, never four times.
hints:
  - "`measure` reads `time.perf_counter()` before and after calling `step(orders)`, and multiplies the difference by 1000."
  - "`for step in steps:` goes through the functions; `step.__name__` is their name as text."
```

## The judge

These judges measure time: each call gets **200 ms**. If you go over, the verdict is *Time limit exceeded* even if the answer is right. The last hidden cases are rush hour, with thousands of items: that's where two nested loops don't make it.

```exercise
id: py20-juez-parejas
type: judge
mode: function
function: count_pairs
limit: 200
title: Two remnants, one order
prompt: |
  **Write `count_pairs(remnants, meters)`, which returns how many pairs of different remnants (`i < j`) add up to exactly `meters`.**

  In the arcade, doña Felícita has a box of fabric remnants, each with its length in meters. A small order is put together by joining **two** remnants that add up to exactly what the customer asks for. She wants to know how many ways she has. Two remnants of the same length are different remnants: with `[3, 3, 3]` and 6 meters there are 3 pairs.

  Go through the remnants once and keep in a dictionary **how many of each length you've already seen**: each remnant pairs with all the ones you've already seen of length `meters - length`.

  **Constraints:** up to 10,000 remnants · lengths from 1 to 200 · `meters` from 2 to 400 · **200 ms per call**.
visual:
  figure:
    title: Example 1, remnant by remnant
    input: { label: "remnants, meters = 7", table: { head: ["length", "looks for", "already seen of that length", "pairs"], rows: [["3", "4", "0", "0"], ["4", "3", "1", "1"], ["2", "5", "0", "1"], ["4", "3", "1", "2"], ["5", "2", "1", "3"]] } }
    arrow: add what you've already seen of the missing length
    output: { label: returns, value: "3" }
    steps:
      - "The first 4 pairs with the 3; the second 4, with that 3 as well."
      - "The 5 pairs with the 2. Total: 3."
starter: |
  def count_pairs(remnants, meters):
      return 0
solution: |
  def count_pairs(remnants, meters):
      """Pairs i < j of remnants that add up to exactly meters."""
      seen = {}
      pairs = 0
      for length in remnants:
          pairs += seen.get(meters - length, 0)
          seen[length] = seen.get(length, 0) + 1
      return pairs
hints:
  - "First ask how many you've seen of `meters - length` and **then** record the current remnant: that way you never pair it with itself."
  - "`seen.get(key, 0)` gives 0 the first time."
samples:
  - args: [[3, 4, 2, 4, 5], 7]
    returns: 3
    note: "3+4, 3+4 (the other 4) and 2+5."
  - args: [[3, 3, 3], 6]
    returns: 3
    note: Three equal remnants make three pairs, none with itself.
edge:
  - args: [[], 10]
    tag: with no remnants
  - args: [[5], 10]
    tag: with a single remnant that would be its own pair
  - args: [[1, 2, 3], 100]
    tag: with no pair at all
  - args: [[4, 4, 4, 4, 4, 4, 4, 4, 4, 4], 8]
    tag: with all remnants equal
  - args: [[200, 200, 1, 199], 400]
    tag: with the largest lengths
random:
  count: 40
  seed: 2020
  generate: |
    # The last five cases are rush hour: 10,000 remnants.
    rng.calls = getattr(rng, "calls", 0) + 1
    big = rng.calls > 35
    cap = rng.pick([10, 60, 200])
    n = 10_000 if big else rng.int(0, 80)
    return [rng.list(n, 1, cap), rng.int(2, 2 * cap)]
wrong:
  - |
    def count_pairs(remnants, meters):
        pairs = 0
        for i in range(len(remnants)):
            for j in range(i + 1, len(remnants)):
                if remnants[i] + remnants[j] == meters:
                    pairs += 1
        return pairs
  - |
    def count_pairs(remnants, meters):
        seen = set()
        pairs = 0
        for length in remnants:
            if meters - length in seen:
                pairs += 1
            seen.add(length)
        return pairs
  - |
    def count_pairs(remnants, meters):
        how_many = {}
        for length in remnants:
            how_many[length] = how_many.get(length, 0) + 1
        total = 0
        for length in remnants:
            total += how_many.get(meters - length, 0)
        return total // 2
```

```exercise
id: py20-juez-baratos
type: judge
mode: function
function: cheapest
limit: 200
title: The end-of-season clearance
prompt: |
  **Write `cheapest(prices, k)`, which returns the `k` lowest prices in the list, from lowest to highest, with their repeats.**

  On December 26th, everything in Gamarra goes on clearance. A buyer from Huancayo wants to take the `k` cheapest T-shirts from a huge lot, and Quilla has to tell him which ones before somebody else beats him to them. If two T-shirts cost the same, they're two T-shirts: both appear.

  `heapq.nsmallest(k, prices)` does exactly this without sorting the whole lot. Careful: finding the minimum and taking it out, `k` times, walks the lot `k` times.

  **Constraints:** up to 30,000 prices · prices from 1 to 500 · `0 ≤ k ≤ len(prices)` · **200 ms per call**.
visual:
  figure:
    title: Example 1
    input: { label: "prices, k = 3", cells: [15, 8, 22, 8, 30, 12] }
    arrow: the 3 smallest, in order
    output: { label: returns, cells: [8, 8, 12] }
    steps:
      - "The two 8-sol T-shirts count separately."
starter: |
  def cheapest(prices, k):
      return []
solution: |
  import heapq


  def cheapest(prices, k):
      """The k lowest prices, from lowest to highest."""
      return heapq.nsmallest(k, prices)
hints:
  - "`import heapq` and a single line: `heapq.nsmallest(k, prices)`."
  - "If you want to do it by hand: a heap with the `k` best so far, stored as negatives so that `heappop` takes out the most expensive of them."
samples:
  - args: [[15, 8, 22, 8, 30, 12], 3]
    returns: [8, 8, 12]
    note: Both 8s appear.
  - args: [[40, 10, 20], 0]
    returns: []
    note: With k = 0 he takes nothing.
edge:
  - args: [[], 0]
    tag: with an empty lot
  - args: [[7, 7, 7, 7], 2]
    tag: with all prices equal
  - args: [[9, 3, 6], 3]
    tag: with k equal to the size of the lot
  - args: [[500, 1], 1]
    tag: with the cheapest at the end
random:
  count: 40
  seed: 1226
  generate: |
    # The last five cases are the full lot: 30,000 T-shirts.
    rng.calls = getattr(rng, "calls", 0) + 1
    big = rng.calls > 35
    n = 30_000 if big else rng.int(0, 100)
    prices = rng.list(n, 1, rng.pick([20, 500]))
    k = rng.int(800, 1500) if big else rng.int(0, n)
    return [prices, k]
wrong:
  - |
    def cheapest(prices, k):
        lot = list(prices)
        chosen = []
        for _ in range(k):
            smallest = min(lot)
            lot.remove(smallest)
            chosen.append(smallest)
        return chosen
  - |
    import heapq


    def cheapest(prices, k):
        heapq.heapify(prices)
        return prices[:k]
  - |
    def cheapest(prices, k):
        return sorted(set(prices))[:k]
```

```exercise
id: py20-juez-tramos
type: judge
mode: function
function: sales_by_range
limit: 200
title: Sales by time range
prompt: |
  **Write `sales_by_range(sales, ranges)`, which returns a list with what was sold in each range, in the same order.**

  `sales[i]` is the T-shirts doña Felícita's stall sold in minute `i` of the day. Her accountant asks her lots of questions: each range is a pair `[first, last]` and asks how much was sold from minute `first` to minute `last`, **both included**.

  Build the list of running sums once, with a `0` in front; each range is one subtraction.

  **Constraints:** up to 15,000 minutes and 15,000 ranges · sales from 0 to 50 · `0 ≤ first ≤ last < len(sales)` · **200 ms per call**.
visual:
  figure:
    title: Example 1, with its running sums
    input: { label: "sales and their prefix", table: { head: ["i", "0", "1", "2", "3", "4", "5"], rows: [["sales[i]", "4", "1", "3", "5", "2", ""], ["prefix[i]", "0", "4", "5", "8", "13", "15"]] } }
    arrow: "[1, 3] → prefix[4] − prefix[1] = 13 − 4 · [0, 4] → 15 − 0 · [2, 2] → 8 − 5"
    output: { label: returns, value: "[9, 15, 3]" }
    steps:
      - "The prefix starts at 0: `prefix[i]` is what was sold **before** minute `i`."
      - "From minute `first` to `last`: `prefix[last + 1] - prefix[first]`."
starter: |
  def sales_by_range(sales, ranges):
      return []
solution: |
  def sales_by_range(sales, ranges):
      """What was sold in each range [first, last], both included."""
      prefix = [0]
      for sale in sales:
          prefix.append(prefix[-1] + sale)
      return [prefix[last + 1] - prefix[first] for first, last in ranges]
hints:
  - "`prefix` has one more element than `sales`: `prefix[i]` is the sum of `sales[0]` to `sales[i - 1]`."
  - "From minute `first` to `last`, both included: `prefix[last + 1] - prefix[first]`."
samples:
  - args: [[4, 1, 3, 5, 2], [[1, 3], [0, 4], [2, 2]]]
    returns: [9, 15, 3]
    note: "1 + 3 + 5 = 9; the whole day, 15; just minute 2, 3."
edge:
  - args: [[7], [[0, 0]]]
    tag: with a single minute
  - args: [[3, 0, 2], []]
    tag: with no questions at all
  - args: [[5, 6, 7, 8], [[0, 0], [0, 3], [3, 3]]]
    tag: with ranges touching both edges
  - args: [[0, 0, 0], [[0, 2], [1, 1]]]
    tag: with a day without sales
random:
  count: 40
  seed: 1220
  generate: |
    # The last five cases are the whole day: 15,000 minutes and 15,000 questions.
    rng.calls = getattr(rng, "calls", 0) + 1
    big = rng.calls > 35
    n = 15_000 if big else rng.int(1, 60)
    sales = rng.list(n, 0, 50)
    ranges = []
    for _ in range(15_000 if big else rng.int(0, 30)):
        a, b = rng.int(0, n - 1), rng.int(0, n - 1)
        ranges.append([min(a, b), max(a, b)])
    return [sales, ranges]
wrong:
  - |
    def sales_by_range(sales, ranges):
        return [sum(sales[first:last + 1]) for first, last in ranges]
  - |
    def sales_by_range(sales, ranges):
        prefix = [0]
        for sale in sales:
            prefix.append(prefix[-1] + sale)
        return [prefix[last] - prefix[first] for first, last in ranges]
  - |
    def sales_by_range(sales, ranges):
        running = []
        total = 0
        for sale in sales:
            total += sale
            running.append(total)
        return [running[last] - running[first - 1] for first, last in ranges]
```

## Final mission

```exercise
id: py20-mision-gamarra
type: mission
title: The season's last errand
prompt: |
  **Use BFS to find the shortest path to the fabric (`a`), then to the buttons (`b`) and then to doña Felícita's workshop (`D`); pick them up with `robot.take()` and deliver `"fabric and buttons"`.**

  It's the night of December 23rd and the Gamarra arcades are a maze of corridors, stairs and closed stalls. The battery is enough for **exactly** the three shortest legs, not one step more: a path found by feeling your way along the wall gets stranded halfway down a corridor. You have:

  - `robot.map()`: the floor plan as a list of texts, `grid[y][x]`; `"#"` is wall, and the border is all wall;
  - `robot.position`: where Quilla is, `(x, y)`;
  - `robot.follow_path(path)`: walks a list of neighbouring tiles `(x, y)` (the first one may be the current tile);
  - `robot.take()`: picks up what's on the tile and returns its name;
  - `robot.mark(tiles)`, if you want to see what your search explored.

  Write the search **once**, as a function that receives where it starts from and which letter it looks for, and use it three times. The floor plan changes in every test.

  It's the last mission of the course.
visual:
  figure:
    title: The first test
    input: { label: "floor plan (battery: 100)", grid: ["#########################", "#R....#................a#", "###.#.#.###.#####.#####.#", "#...#.#.#.......#...#.#.#", "#.#...#.#.###.#.###.#...#", "#.#...#.#.....#...#.#...#", "#.#######.###.###.....###", "#.......#.#...#...#.#.#.#", "#.##..#.###.###.###.#...#", "#.....#.....#.#.#...#.#.#", "########.##.#.#.###...#.#", "#b.....................D#", "#########################"] }
    arrow: "three BFS: R → a (46) · a → b (32) · b → D (22)"
    output: { label: "battery to spare: none", value: "46 + 32 + 22 = 100" }
starter: |
  grid = robot.map()
  x, y = robot.position
  print("Starting at", x, y, "with battery", robot.battery)
  # TODO: def shortest_path(grid, start, letter): BFS from start to the tile with that letter,
  #       with a deque and a parent dictionary; returns the path as a list of (x, y).
  # TODO: off for the fabric ("a"), take(); off for the buttons ("b"), take(); to the workshop ("D"), deliver.
solution: |
  from collections import deque


  def shortest_path(grid, start, letter):
      """The shortest path from start to the tile with that letter, as a list of (x, y)."""
      parent = {start: None}
      queue = deque([start])
      while queue:
          x, y = queue.popleft()
          if grid[y][x] == letter:
              path = []
              tile = (x, y)
              while tile is not None:
                  path.append(tile)
                  tile = parent[tile]
              return path[::-1]
          for neighbor in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]:
              nx, ny = neighbor
              if grid[ny][nx] != "#" and neighbor not in parent:
                  parent[neighbor] = (x, y)
                  queue.append(neighbor)
      return []


  grid = robot.map()
  for letter in ["a", "b", "D"]:
      path = shortest_path(grid, tuple(robot.position), letter)
      robot.mark(path)
      robot.follow_path(path)
      if letter != "D":
          robot.take()
  robot.deliver("fabric and buttons")
hints:
  - "It's the BFS with `parent` from session 10, inside a `def`: instead of a fixed goal, it stops when the tile that comes out of the queue holds the `letter` it's looking for."
  - "After each leg, Quilla is where the path ended: the next search starts from `tuple(robot.position)`."
world:
  theme: barranco
  level: 2
  dir: E
  api: [move, deliver, map, path, cargo]
  items: { a: fabric, b: buttons }
  battery: 100
  map: |
    #########################
    #R....#................a#
    ###.#.#.###.#####.#####.#
    #...#.#.#.......#...#.#.#
    #.#...#.#.###.#.###.#...#
    #.#...#.#.....#...#.#...#
    #.#######.###.###.....###
    #.......#.#...#...#.#.#.#
    #.##..#.###.###.###.#...#
    #.....#.....#.#.#...#.#.#
    ########.##.#.#.###...#.#
    #b.....................D#
    #########################
scenarios:
  - {}
  - map: |
      #########################
      #...#...............#..b#
      ###.#.##.######.#...###.#
      #.............#...#.....#
      #.####.####.#.###.#.###.#
      #..........R#...#...#...#
      ########.######.#.#.###.#
      #...#.......#D..#.#.....#
      #.###.#...###.#######.#.#
      #.#...#.......#.......#.#
      #.#.#.#.###.#####.#####.#
      #a................#.....#
      #########################
    world: { dir: W, battery: 76 }
  - map: |
      #########################
      #D..#...#....a......#...#
      ###.#...##.#..#####.#.#.#
      #.#.#...#.........#...#.#
      #.#.#.#.#.#####.#######.#
      #.........#.....#.......#
      #.#.#.#######.#.#.#######
      #...#.......#.#.#.......#
      #.#.#.#####...#.######..#
      #b#.#.....#.#.#...#.....#
      #.#.#######......##.#####
      #...........#.#........R#
      #########################
    world: { dir: N, battery: 52 }
tests:
  - name: picks up the fabric and then the buttons
    state: 'w.inventory == ["fabric", "buttons"]'
    msg: Quilla has to take the fabric (a) first and the buttons (b) after.
  - name: reaches the workshop and delivers
    state: 'w.at_goal and w.delivered == ["fabric and buttons"]'
    msg: If it ran out of battery, some leg wasn't the shortest.
  - name: without crashing
    state: not w.crashed
  - name: searches with a deque
    source: '\bdeque\b'
  - name: the search is a function
    source: '\bdef\s+\w+\s*\('
    msg: Write the search only once, in a def, and call it for each leg.
```

## Expert challenge

```exercise
id: py20-reto-dijkstra
type: challenge
title: The least crowded path
prompt: |
  **Write `cheapest_path(arcade)`, which returns the lowest total cost to go from the top-left corner to the bottom-right one.** For people who already code.

  `arcade` is a list of texts of digits from `1` to `9`: how many people there are on each tile, which is what it **costs to step onto** it. The starting tile isn't charged. You walk to the neighbours above, below, left and right.

  A BFS finds the path with the fewest steps, not the cheapest one. Use Dijkstra: a heap of `(cost, x, y)` from which you always take out the cheapest pending tile. One of the tests is an 80 × 80 arcade.
visual:
  figure:
    input: { label: arcade, text: "131\n191\n111" }
    arrow: "down, down, right, right: 1 + 1 + 1 + 1"
    output: { label: returns, value: "4" }
starter: |
  def cheapest_path(arcade):
      return 0


  print(cheapest_path(["131", "191", "111"]))
solution: |
  import heapq


  def cheapest_path(arcade):
      """The lowest cost from the top-left corner to the bottom-right one."""
      height, width = len(arcade), len(arcade[0])
      best = {(0, 0): 0}
      pending = [(0, 0, 0)]
      while pending:
          cost, x, y = heapq.heappop(pending)
          if (x, y) == (width - 1, height - 1):
              return cost
          if cost > best[(x, y)]:
              continue
          for nx, ny in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]:
              if 0 <= nx < width and 0 <= ny < height:
                  new_cost = cost + int(arcade[ny][nx])
                  if new_cost < best.get((nx, ny), new_cost + 1):
                      best[(nx, ny)] = new_cost
                      heapq.heappush(pending, (new_cost, nx, ny))
      return -1


  print(cheapest_path(["131", "191", "111"]))
hints:
  - "Keep in `best` the lowest known cost of each tile; when you take an entry out of the heap that's more expensive than `best`, it's stale: skip it."
  - "The first time the final corner comes out of the heap, its cost is already the lowest."
tests:
  - name: the example
    run: 'cheapest_path(["131", "191", "111"])'
    equals: 4
  - name: a single tile costs nothing
    run: 'cheapest_path(["7"])'
    equals: 0
  - name: the short path isn't the cheap one
    run: 'cheapest_path(["19", "11"])'
    equals: 2
  - name: a long detour
    run: 'cheapest_path(["1999", "1919", "1119", "9911"])'
    equals: 6
  - name: two similar paths
    run: 'cheapest_path(["12", "34"])'
    equals: 6
  - name: the big arcade
    run: 'cheapest_path(["".join(str((x * 7 + y * 3) % 9 + 1) for x in range(80)) for y in range(80)])'
    equals: 505
  - name: uses heapq
    source: '\bheapq\b'
```

That same night, doña Felícita's report finished in four seconds. She didn't understand what a set was, but she understood that at five in the morning she was already cutting fabric, and she gave Quilla a T-shirt embroidered with its name.

Back in Chucuito, Maru found Quilla looking at the sea from Loop's door. Twenty sessions ago it was a robot fresh out of the box that could only move forward and deliver alfajores; now it reads files, waits for servers, catches errors and measures what it does. "You don't need me to tell you what to write anymore," Maru told it. "Now it's up to you to decide which programs are worth writing." Quilla switched on its siren, just once, softly. **The end of the Python course.**
