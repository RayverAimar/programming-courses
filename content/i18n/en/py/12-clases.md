# Session 12 — Classes

## The job

Tacna, Sunday at seven in the morning, two blocks from the Arco Parabólico. **Panadería El Arco** already has a queue: Tacna families coming for their pan de yema, and tourists from Arica who crossed the border to have pastel de choclo for breakfast and ask for "marraqueta", to which doña **Eulalia Copaja** replies, very seriously, that it's called pan francés.

Her granddaughter **Ximena** keeps the books: the ovens, the trays, the WhatsApp orders and the credit notebook. Until yesterday all of that was loose dictionaries and functions all over the place, and somebody ended up writing down a debt of −40 soles. Maru sent Quilla with its waiter's arm and an idea: that every thing in the bakery be an **object** that keeps its data **and** knows what can be done with it, and that refuses to end up in an impossible state. Today Quilla learns to write **classes**.

```scene
theme: cocina
level: 4
dir: E
caption: Panadería El Arco. Quilla takes pan de yema to table 1, goes back to the kitchen (K) and down to the patio with a pastel de choclo for table 4.
map: |
  ############
  #K.........#
  #.##1###2#.#
  #.##.......#
  #.####3###.#
  #..........#
  ###4####5###
  ############
program: |
  robot.cook("pan de yema")
  robot.forward(3)
  robot.serve()
  robot.turn_right()
  robot.turn_right()
  robot.forward(3)
  robot.cook("pastel de choclo")
  robot.turn_left()
  robot.forward(4)
  robot.turn_left()
  robot.forward(2)
  robot.serve()
```

## The minimum

A **class** is a mould; each **object** (an *instance*) that comes out of it has its own data. You define it with `class` (capitalised, `Oven`) and create an object by calling it like a function: `Oven("wood-fired", 220)`. The functions inside are **methods**; the first one, `__init__`, sets up the newly created object.

```py run
class Oven:
    def __init__(self, name, temperature):
        self.name = name
        self.temperature = temperature

    def describe(self):
        return f"Oven {self.name} at {self.temperature} °C"

wood_fired = Oven("wood-fired", 220)
print(wood_fired.describe(), wood_fired.temperature)
```

**`self` is the object itself.** `wood_fired.describe()` is the same as `Oven.describe(wood_fired)`: Python passes the object as the first argument. That's why every method receives `self`, and `self.name = …` sticks an **attribute** onto that particular object. Watch the object fill up step by step:

```anim
title: self is the object doing the work
code: |
  class Oven:
      def __init__(self, name):
          self.name = name
          self.loaves = 0

      def bake(self, amount):
          self.loaves += amount
          return self.loaves

      def __repr__(self):
          return f"Oven {vars(self)}"

  wood = Oven("wood")
  wood.bake(40)
  total = wood.bake(25)
  print(wood, total)
notes:
  1: "class only stores the mould with its methods; there's no oven yet."
  13: "Oven(\"wood\") creates an empty object and calls __init__ with self = that object."
  3: "Each self.something = … adds an attribute to the object. vars(self) shows them all."
  14: "wood.bake(40) is Oven.bake(wood, 40): self is wood."
  7: "The method changes the object: the change stays in wood after it returns."
  16: "print uses __repr__ to show the object (we'll see it below)."
```

**Class attributes and instance attributes.** What you assign in the body of the class (outside the methods) belongs **to the class**: a single value, shared by all the objects. What you assign with `self.` belongs **to each object**. When reading `a.capacity`, Python looks in the object first and, if it isn't there, in the class.

```py run
class Tray:
    capacity = 24               # the class's: one for all
    def __init__(self, bread):
        self.bread = bread      # each tray's own

a, b = Tray("yema"), Tray("tacneño")
Tray.capacity = 30
print(a.capacity, b.capacity, a.bread, b.bread)
```

This is that search, object first and class after:

```figure
title: The class holds what's shared; each object holds its own
panes:
  - { label: "The class (the mould)", cards: [{ title: Tray, rows: [["capacity", "30"], ["methods", "__init__"]] }] }
  - { label: "a", cards: [{ title: "object a", rows: [["bread", "'yema'"]] }] }
  - { label: "b", cards: [{ title: "object b", rows: [["bread", "'tacneño'"]] }] }
steps:
  - "`a.bread`: is it in `a`? Yes → `'yema'`. The search is over."
  - "`a.capacity`: is it in `a`? No → is it in `Tray`? Yes → `30`. That's why `a` and `b` see the same value."
  - "`Tray.capacity = 30` changes the class, and every object sees it. `a.capacity = 5` would only give `a` its own attribute."
```


**How an object is shown.** `__str__` gives the text for people (`print` and `str` use it); `__repr__` gives the text for programmers (lists, the console and `repr` use it) and, if there's no `__str__`, `print` too. In an f-string, `!r` asks for a value's `repr`: `{self.name!r}` comes out with quotes.

```py run
class Bread:
    def __init__(self, name, price):
        self.name, self.price = name, price
    def __str__(self):
        return f"{self.name} at S/ {self.price:.2f}"
    def __repr__(self):
        return f"Bread({self.name!r}, {self.price})"

yolk_bread = Bread("yema", 0.6)
print(yolk_bread, [yolk_bread])
```

**`@property`: a watched attribute.** With `@property` a method is read like an attribute (`bag.loaves`, no parentheses), and with `@loaves.setter` you decide what happens when someone assigns to it. The real data lives in `self._loaves` (the underscore says "don't touch it from outside"). If the value is no good, the setter rejects it with **`raise ValueError(…)`**, which stops the operation; whoever wants to carry on catches it with **`try` / `except ValueError`** (errors have their own session; this is enough for today).

```py run
class Bag:
    def __init__(self, loaves):
        self.loaves = loaves        # goes through the setter too

    @property
    def loaves(self):
        return self._loaves

    @loaves.setter
    def loaves(self, amount):
        if amount < 0:
            raise ValueError("a bag can't hold negative loaves")
        self._loaves = amount

bag = Bag(10)
bag.loaves -= 4
try:
    bag.loaves = -1
except ValueError as error:
    print("Rejected:", error)
print(bag.loaves)
```

**Other constructors and helpers.** A `@classmethod` receives the class (`cls`) instead of the object: it's for making objects another way, like "from a piece of text". A `@staticmethod` receives neither the class nor the object: it's a function that lives inside the class because it has to do with it.

```py run
class Price:
    def __init__(self, bread, amount):
        self.bread, self.amount = bread, amount

    @classmethod
    def from_board(cls, line):              # "yema=0.60"
        bread, amount = line.split("=")
        return cls(bread, float(amount))

    @staticmethod
    def dozens(units):
        return units // 12

yolk_price = Price.from_board("yema=0.60")
print(yolk_price.bread, yolk_price.amount, Price.dozens(40))
```

**`@dataclass` writes the boring parts for you.** You declare the fields with their type and Python generates `__init__`, `__repr__` and `__eq__`. A default list is asked for with `field(default_factory=list)` (a new list for each object). `order=True` adds `<`, `>`, `sorted` and `min`, comparing field by field in order; `frozen=True` makes the object immutable (assigning to it is an error) and that's why it can go in a set or be a dictionary key.

```py run
from dataclasses import dataclass, field

@dataclass(order=True)
class Batch:
    time: str
    bread: str
    trays: list[int] = field(default_factory=list)

a, b = Batch("06:30", "yema"), Batch("05:45", "tacneño", [24, 24])
print(a)
print(min(a, b).bread, a == Batch("06:30", "yema"))
```

**Inheritance.** `class Pastry(Product):` makes a class that **is** a `Product` and inherits all its methods; you only write what changes. Inside, `super()` calls the parent's version: `super().__init__(…)` so the parent sets up its part, `super().label()` to reuse what it already did.

```py run
class Product:
    def __init__(self, name, price):
        self.name, self.price = name, price
    def label(self):
        return f"{self.name}: S/ {self.price:.2f}"

class Pastry(Product):
    def __init__(self, name, price, filling):
        super().__init__(name, price)
        self.filling = filling
    def label(self):
        return super().label() + f" ({self.filling} filling)"

print(Pastry("empanada", 4.5, "cheese").label(), isinstance(Pastry("e", 1, "x"), Product))
```

> **Common trap:** a list written in the body of the class (`loaves = []`) is **a single list for all the objects**. `self.loaves.append(…)` doesn't create a new list: it looks for `loaves`, doesn't find it in the object, finds it in the class and appends there, so whatever you put on one tray shows up on all of them. Each object's lists are created in `__init__` (`self.loaves = []`) or, in a dataclass, with `field(default_factory=list)`.

<!-- legacy: property -->

<!-- legacy: dataclass -->

<!-- legacy: super-noargs -->

<!-- mdn: property dataclass super-noargs -->

## Practice

```exercise
id: py12-predice-temperatura
type: predict
title: The oven that had its own temperature
prompt: |
  Ximena changes the temperature of one oven and then everyone's. What does it print?
code: |
  class Oven:
      temperature = 180

      def __init__(self, name):
          self.name = name

  wood = Oven("wood")
  electric = Oven("electric")
  electric.temperature = 220
  Oven.temperature = 200
  print(wood.temperature, electric.temperature, Oven.temperature)
options:
  - "200 220 200"
  - "180 220 200"
  - "200 200 200"
  - "180 220 180"
answer: "200 220 200"
explain: |
  `electric.temperature = 220` doesn't change the class: it gives the electric oven **its own** attribute, which hides the class's. `wood` doesn't have its own, so it keeps reading the class's, which later went to 200. The electric one doesn't notice: it has its 220.
```

```exercise
id: py12-completa-horno
type: complete
title: The oven that won't let itself burn
prompt: |
  A bakery oven works between **120 and 260 °C**, both included. Fill in the `___` so that `temperature` is a property: it reads normally, and assigning it a value outside that range raises `ValueError` without changing anything. The lines at the bottom try four values and note down what happened.
starter: |
  class Oven:
      def __init__(self, name, temperature):
          self.name = name
          self.temperature = temperature  # goes through the setter

      ___
      def temperature(self):
          return self._temperature

      @temperature.___
      def temperature(self, degrees):
          if not 120 <= degrees <= 260:
              ___ ValueError(f"{degrees} °C isn't an oven temperature")
          self.___ = degrees


  trials = []
  for degrees in [180, 300, 120, 90]:
      try:
          Oven("test", degrees)
          trials.append("ok")
      except ValueError:
          trials.append("rejected")
  print(trials)
solution: |
  class Oven:
      def __init__(self, name, temperature):
          self.name = name
          self.temperature = temperature  # goes through the setter

      @property
      def temperature(self):
          return self._temperature

      @temperature.setter
      def temperature(self, degrees):
          if not 120 <= degrees <= 260:
              raise ValueError(f"{degrees} °C isn't an oven temperature")
          self._temperature = degrees


  trials = []
  for degrees in [180, 300, 120, 90]:
      try:
          Oven("test", degrees)
          trials.append("ok")
      except ValueError:
          trials.append("rejected")
  print(trials)
hints:
  - "Above the first method goes `@property`; above the second, `@temperature.setter`."
  - "The value is stored in `self._temperature`, with an underscore. If you store it in `self.temperature`, the setter calls itself forever."
tests:
  - name: it reads like an attribute
    expect: Oven("wood", 200).temperature == 200
  - name: rejects what's outside 120…260
    expect: 'trials == ["ok", "rejected", "ok", "rejected"]'
  - name: the data lives in _temperature
    expect: 'vars(Oven("wood", 150)) == {"name": "wood", "_temperature": 150}'
```

```exercise
id: py12-arregla-bandejas
type: fix
title: The trays that passed loaves to each other
prompt: |
  Each oven has its tray. Ximena put two pan de yema on the wood oven's tray and one pan francés on the electric one's, but both trays claim to have all three loaves. Find out why and fix it: each tray has to have **its own** list.
visual:
  figure:
    panes:
      - { label: expected, cards: [{ title: wood, rows: [["loaves", "['yema', 'yema']"]] }, { title: electric, rows: [["loaves", "['francés']"]] }] }
      - { label: got, cards: [{ title: wood, rows: [["loaves", "['yema', 'yema', 'francés']"]] }, { title: electric, rows: [["loaves", "['yema', 'yema', 'francés']"]] }] }
starter: |
  class Tray:
      loaves = []

      def __init__(self, oven):
          self.oven = oven

      def put(self, bread):
          self.loaves.append(bread)
          return len(self.loaves)


  wood = Tray("wood")
  electric = Tray("electric")
  wood.put("yema")
  wood.put("yema")
  electric.put("francés")
  print(wood.loaves, electric.loaves)
solution: |
  class Tray:
      def __init__(self, oven):
          self.oven = oven
          self.loaves = []

      def put(self, bread):
          self.loaves.append(bread)
          return len(self.loaves)


  wood = Tray("wood")
  electric = Tray("electric")
  wood.put("yema")
  wood.put("yema")
  electric.put("francés")
  print(wood.loaves, electric.loaves)
hints:
  - "`loaves = []` in the body of the class is a **class** attribute: a single list for all the trays."
  - "Create it in `__init__` with `self.loaves = []`."
tests:
  - name: the wood oven's tray has its two loaves
    expect: 'wood.loaves == ["yema", "yema"]'
  - name: the electric one has only its own
    expect: 'electric.loaves == ["francés"]'
  - name: a new tray starts empty
    expect: Tray("new").loaves == []
  - name: the list is created in __init__
    source: 'self\.loaves\s*=\s*\[\]'
```

```exercise
id: py12-arregla-precio
type: fix
title: The price that called itself
prompt: |
  Ximena wants a bread's price never to be zero or negative, and she wrote a property. But when the first bread is created the program crashes with a very long error. Run it, read the error and fix it without removing the validation.
starter: |
  class Bread:
      def __init__(self, name, price):
          self.name = name
          self.price = price

      @property
      def price(self):
          return self.price

      @price.setter
      def price(self, value):
          if value <= 0:
              raise ValueError("the price has to be positive")
          self.price = value


  yolk_bread = Bread("pan de yema", 0.6)
  yolk_bread.price = 0.7
  print(yolk_bread.name, yolk_bread.price)
solution: |
  class Bread:
      def __init__(self, name, price):
          self.name = name
          self.price = price

      @property
      def price(self):
          return self._price

      @price.setter
      def price(self, value):
          if value <= 0:
              raise ValueError("the price has to be positive")
          self._price = value


  yolk_bread = Bread("pan de yema", 0.6)
  yolk_bread.price = 0.7
  print(yolk_bread.name, yolk_bread.price)
hints:
  - "Inside the setter, `self.price = value` calls the setter again, which assigns again, which calls again… until the `RecursionError`. The same happens to the getter."
  - "The data has to live under another name: `self._price`, in the getter and in the setter."
tests:
  - name: the price can be changed
    expect: yolk_bread.price == 0.7
  - name: the console says so
    output: pan de yema 0.7
  - name: the data lives in _price
    expect: '"_price" in vars(yolk_bread)'
  - name: the validation is still there
    source: 'raise\s+ValueError'
```

```exercise
id: py12-escribe-pedido
type: write
title: The WhatsApp orders
prompt: |
  Orders come in by WhatsApp like this: `"Herminia: yema, Tacneño ,yema"`. Write a dataclass `Order` with:

  - the fields `customer` (text) and `breads` (a list of text, **empty by default** and new for each order);
  - a `@staticmethod` `clean(bread)`, which strips the spaces at the edges and makes it lowercase;
  - a `@classmethod` `from_text(text)`, which splits the customer from the breads at the colon and the breads at the commas, cleans each one and skips the empty ones;
  - a method `how_many(bread)`, which says how many times that bread is in the order (cleaning it first).
visual:
  figure:
    input: { label: comes in, text: "\"Herminia: yema, Tacneño ,yema\"" }
    arrow: Order.from_text(…)
    output: { label: returns, text: "Order(customer='Herminia', breads=['yema', 'tacneño', 'yema'])" }
starter: |
  from dataclasses import dataclass, field


  # TODO: the Order dataclass


  print(Order.from_text("Herminia: yema, Tacneño ,yema"))
solution: |
  from dataclasses import dataclass, field


  @dataclass
  class Order:
      customer: str
      breads: list[str] = field(default_factory=list)

      @staticmethod
      def clean(bread):
          return bread.strip().lower()

      @classmethod
      def from_text(cls, text):
          customer, rest = text.split(":")
          breads = [cls.clean(bread) for bread in rest.split(",") if bread.strip()]
          return cls(customer.strip(), breads)

      def how_many(self, bread):
          return self.breads.count(self.clean(bread))


  print(Order.from_text("Herminia: yema, Tacneño ,yema"))
hints:
  - "`text.split(\":\")` gives you the customer and the rest; `rest.split(\",\")` gives you the messy breads."
  - "Inside `from_text`, finish with `return cls(customer, breads)`: that way it works for a child class too."
tests:
  - name: clean
    run: Order.clean("  Yema ")
    equals: yema
  - name: from_text builds the order
    expect: 'Order.from_text("Herminia: yema, Tacneño ,yema") == Order("Herminia", ["yema", "tacneño", "yema"])'
  - name: an order with no breads
    expect: 'Order.from_text("Wálter:") == Order("Wálter")'
  - name: how_many
    run: 'Order.from_text("Yanet: yema, francés, YEMA").how_many(" yema")'
    equals: 2
  - name: each order has its own list
    expect: Order("a").breads is not Order("b").breads
    msg: "Use field(default_factory=list) so that each order gets a new list."
  - name: uses @dataclass, @classmethod and @staticmethod
    source: '@dataclass[\s\S]*@staticmethod[\s\S]*@classmethod|@dataclass[\s\S]*@classmethod[\s\S]*@staticmethod'
```

```exercise
id: py12-escribe-lena
type: write
title: The wood-fired oven
prompt: |
  The bakery's `Oven` is already written. Write `WoodOven`, which **inherits** from `Oven`:

  - `__init__(self, name, wood_kg)`: lets the parent set up its part with `super().__init__(name)` and stores the kilos of wood.
  - `bake(bread)`: each batch burns **3 kg**. If there isn't enough, it returns `"<name>: out of wood"` without counting the batch; if there is, it takes off the wood and returns the same as the parent's `bake`.
  - `load(kg)`: adds wood.
visual:
  figure:
    title: WoodOven("Copaja", 7)
    panes:
      - { table: { head: ["call", "returns", "wood", "batches"], rows: [["bake(\"yema\")", "\"Copaja: yema ready\"", "4", "1"], ["bake(\"tacneño\")", "\"Copaja: tacneño ready\"", "1", "2"], ["bake(\"francés\")", "\"Copaja: out of wood\"", "1", "2"], ["load(5)", "—", "6", "2"]] } }
starter: |
  class Oven:
      def __init__(self, name):
          self.name = name
          self.batches = 0

      def bake(self, bread):
          self.batches += 1
          return f"{self.name}: {bread} ready"


  # TODO: class WoodOven(Oven)
solution: |
  class Oven:
      def __init__(self, name):
          self.name = name
          self.batches = 0

      def bake(self, bread):
          self.batches += 1
          return f"{self.name}: {bread} ready"


  class WoodOven(Oven):
      def __init__(self, name, wood_kg):
          super().__init__(name)
          self.wood_kg = wood_kg

      def bake(self, bread):
          if self.wood_kg < 3:
              return f"{self.name}: out of wood"
          self.wood_kg -= 3
          return super().bake(bread)

      def load(self, kg):
          self.wood_kg += kg
hints:
  - "The first line of your `__init__` is `super().__init__(name)`: that way the wood oven also has `name` and `batches`."
  - "In `bake`, after taking off the wood, `return super().bake(bread)` counts the batch and builds the text."
tests:
  - name: three batches with 7 kg
    run: '(o := WoodOven("Copaja", 7), o.bake("yema"), o.bake("tacneño"), o.bake("francés"), o.batches, o.wood_kg)[1:]'
    equals: ["Copaja: yema ready", "Copaja: tacneño ready", "Copaja: out of wood", 2, 1]
  - name: without wood it doesn't bake; after loading, it does
    run: '(o := WoodOven("Eulalia", 2), o.bake("yema"), o.load(4), o.bake("yema"), o.wood_kg)[1:]'
    equals: ["Eulalia: out of wood", null, "Eulalia: yema ready", 3]
  - name: a wood oven is an oven
    expect: isinstance(WoodOven("a", 0), Oven)
  - name: uses super() in __init__ and in bake
    source: 'super\(\)\.__init__\([\s\S]*super\(\)\.bake\('
```

## The case

```exercise
id: py12-caso-fiado
type: case
title: The account with a broken property
prompt: |
  **Write the class `TabAccount`, whose `debt` is a property that never goes below 0 or above the customer's limit; replay the week's notebook and compare each customer's final debt with the one the old program showed.**

  Doña Eulalia's nephew made a program for the credit tab. Each neighbour has a **limit**: the most that can be sold to them on credit. `charge(amount)` adds to the debt and `pay(amount)` takes off from it. An operation that would leave the debt **below 0 or above the limit** is rejected entirely: the debt stays as it was. Reaching the limit exactly is allowed.

  The nephew's program had a broken property: it rejected overpayments, but when someone went over their limit it only showed a warning… and wrote it down anyway. Print one line per customer with their final debt, `Herminia: 60`. Who was given too much credit?
visual:
  board:
    for: py12-caso-fiado
    task: "Replay the notebook with one TabAccount per customer (0 ≤ debt ≤ limit) and compare the final debt with the old program's."
    cards:
      - name: Herminia
        kind: person
        rows: [["Limit", "S/ 60"], ["Old program", "S/ 60"]]
        clue: { find: "Herminia", says: 60, saysLabel: Old program }
      - name: Wálter
        kind: person
        rows: [["Limit", "S/ 40"], ["Old program", "S/ 12"]]
        clue: { find: "Wálter", says: 12, saysLabel: Old program }
      - name: Yanet
        kind: person
        culprit: true
        rows: [["Limit", "S/ 50"], ["Old program", "S/ 55"]]
        clue: { find: "Yanet", says: 55, saysLabel: Old program }
      - name: Abdón
        kind: person
        rows: [["Limit", "S/ 30"], ["Old program", "S/ 30"]]
        clue: { find: "Abdón", says: 30, saysLabel: Old program }
    caption: "If Herminia or Abdón don't match, check your comparison: reaching the limit **exactly** is allowed."
starter: |
  limits = {"Herminia": 60, "Wálter": 40, "Yanet": 50, "Abdón": 30}

  notebook = [
      ("Herminia", "charge", 25), ("Yanet", "charge", 20), ("Wálter", "charge", 30),
      ("Abdón", "charge", 12), ("Herminia", "charge", 20), ("Yanet", "charge", 18),
      ("Wálter", "pay", 35), ("Abdón", "charge", 9), ("Herminia", "pay", 30),
      ("Yanet", "charge", 15), ("Wálter", "pay", 30), ("Abdón", "pay", 21),
      ("Herminia", "charge", 40), ("Yanet", "pay", 8), ("Wálter", "charge", 12),
      ("Abdón", "charge", 30), ("Herminia", "charge", 5), ("Yanet", "charge", 10),
  ]

  # This is how a line of the notebook is read:
  customer, action, amount = notebook[0]
  print(customer, action, amount)

  # TODO: class TabAccount with customer, limit and the debt property
  #       (the setter raises ValueError if it ends up outside 0…limit),
  #       and the methods charge(amount) and pay(amount).

  # TODO: one account per customer; replay the notebook catching the ValueError
  #       and print the final debt like this: Herminia: 60
solution: |
  limits = {"Herminia": 60, "Wálter": 40, "Yanet": 50, "Abdón": 30}

  notebook = [
      ("Herminia", "charge", 25), ("Yanet", "charge", 20), ("Wálter", "charge", 30),
      ("Abdón", "charge", 12), ("Herminia", "charge", 20), ("Yanet", "charge", 18),
      ("Wálter", "pay", 35), ("Abdón", "charge", 9), ("Herminia", "pay", 30),
      ("Yanet", "charge", 15), ("Wálter", "pay", 30), ("Abdón", "pay", 21),
      ("Herminia", "charge", 40), ("Yanet", "pay", 8), ("Wálter", "charge", 12),
      ("Abdón", "charge", 30), ("Herminia", "charge", 5), ("Yanet", "charge", 10),
  ]


  class TabAccount:
      def __init__(self, customer, limit):
          self.customer = customer
          self.limit = limit
          self.debt = 0

      @property
      def debt(self):
          return self._debt

      @debt.setter
      def debt(self, value):
          if not 0 <= value <= self.limit:
              raise ValueError(f"debt out of range: {value}")
          self._debt = value

      def charge(self, amount):
          self.debt += amount

      def pay(self, amount):
          self.debt -= amount


  accounts = {customer: TabAccount(customer, limit) for customer, limit in limits.items()}
  rejected = 0
  for customer, action, amount in notebook:
      account = accounts[customer]
      try:
          if action == "charge":
              account.charge(amount)
          else:
              account.pay(amount)
      except ValueError:
          rejected += 1

  for account in accounts.values():
      print(f"{account.customer}: {account.debt}")
  print("Rejected operations:", rejected)
answer: Yanet
answerLabel: Who was given too much credit?
reveal: |
  Yanet. With a debt of 38 she was given 15 more on credit: 53, above her limit of 50. That operation should have been rejected, and her final debt is 40, not 55. Wálter is the other rejected operation (he tried to pay 35 while owing 30), but the old program did reject that one. Herminia and Abdón end **exactly** at their limit: with `<` instead of `<=` you'd have got them wrong too.
hints:
  - "With the validation in the setter, `charge` and `pay` are one line each: `self.debt += amount`. If the setter raises the error, `_debt` doesn't change."
  - "Replay the notebook with `try:` around the operation and `except ValueError:` to count the rejected one and carry on."
```

## The judge

Another **design** problem: you write the class and the judge uses it through `try_out`, which comes already written. Since the judge compares what a function **returns**, `try_out` creates an account, applies a list of operations to it and returns what each one answered; if one raises `ValueError`, it notes down `"error"` and carries on. The operations come as symbols so that the cases are the same in any language.

```exercise
id: py12-juez-monedero
type: judge
mode: function
function: try_out
title: El Arco's wallet
prompt: |
  **Write the class `Account`, the bakery's prepaid wallet, with a `balance` that is never negative.**

  The regular customers leave money in advance and buy with it. Write `class Account` with:

  - `Account(holder, balance=0)`: stores the holder and the balance. The starting balance **is validated too**.
  - `balance`: a property. Its setter raises `ValueError` if the value is negative (0 is fine).
  - `top_up(amount)`: if `amount` isn't positive, `ValueError`. Otherwise, it adds the amount, and if it's **50 or more** it also adds a **bonus of 5** (keep the 5 and the 50 as class attributes). It returns the new balance.
  - `buy(price)`: if `price` isn't positive, `ValueError`. Otherwise, it takes off the price; if there isn't enough, the setter rejects it and the balance stays the same. It returns the new balance.
  - `__str__`: `"Ximena: S/ 68"` (the holder, a colon and the balance).

  `try_out(start_balance, operations)` applies the operations to an account of Ximena's: `["+", amount]` tops up, `["-", price]` buys, `["=", value]` assigns `account.balance = value`, `["s"]` asks for `str(account)`. If the starting balance isn't valid, it returns `["error"]`. Don't change it.

  **Constraints:** starting balance from −5 to 60 · up to 25 operations · amounts from −10 to 90.
visual:
  figure:
    title: Example 1, operation by operation (starts with 20)
    panes:
      - { table: { head: ["operation", "balance", "returns"], rows: [["[\"-\", 7]", "13", "13"], ["[\"-\", 15]", "13 (not enough)", "\"error\""], ["[\"+\", 50]", "13 + 50 + 5 = 68", "68"], ["[\"s\"]", "68", "\"Ximena: S/ 68\""], ["[\"=\", -3]", "68 (negative)", "\"error\""], ["[\"+\", 0]", "68 (not positive)", "\"error\""]] } }
    caption: "A rejected operation changes nothing: the balance stays where it was."
starter: |
  class Account:
      # TODO: class attributes (the bonus and from how much it's given),
      #       __init__, the balance property with its setter,
      #       top_up, buy and __str__
      pass


  def try_out(start_balance, operations):
      """The judge calls this function. Don't change it."""
      try:
          account = Account("Ximena", start_balance)
      except ValueError:
          return ["error"]
      results = []
      for op, *data in operations:
          try:
              if op == "+":
                  results.append(account.top_up(data[0]))
              elif op == "-":
                  results.append(account.buy(data[0]))
              elif op == "=":
                  account.balance = data[0]
                  results.append(account.balance)
              else:
                  results.append(str(account))
          except ValueError:
              results.append("error")
      return results
solution: |
  class Account:
      BONUS = 5
      BONUS_FROM = 50

      def __init__(self, holder, balance=0):
          self.holder = holder
          self.balance = balance

      @property
      def balance(self):
          return self._balance

      @balance.setter
      def balance(self, value):
          if value < 0:
              raise ValueError("the balance can't be negative")
          self._balance = value

      def top_up(self, amount):
          if amount <= 0:
              raise ValueError("the top-up has to be positive")
          bonus = self.BONUS if amount >= self.BONUS_FROM else 0
          self.balance += amount + bonus
          return self.balance

      def buy(self, price):
          if price <= 0:
              raise ValueError("the price has to be positive")
          self.balance -= price
          return self.balance

      def __str__(self):
          return f"{self.holder}: S/ {self.balance}"


  def try_out(start_balance, operations):
      """The judge calls this function. Don't change it."""
      try:
          account = Account("Ximena", start_balance)
      except ValueError:
          return ["error"]
      results = []
      for op, *data in operations:
          try:
              if op == "+":
                  results.append(account.top_up(data[0]))
              elif op == "-":
                  results.append(account.buy(data[0]))
              elif op == "=":
                  account.balance = data[0]
                  results.append(account.balance)
              else:
                  results.append(str(account))
          except ValueError:
              results.append("error")
      return results
hints:
  - "In `__init__` write `self.balance = balance` (no underscore): that way the starting balance goes through the setter and gets validated."
  - "In `buy`, `self.balance -= price` is enough: if the result is negative, the setter raises the error **before** storing it, and the balance stays the same."
samples:
  - args: [20, [["-", 7], ["-", 15], ["+", 50], ["s"], ["=", -3], ["+", 0]]]
    returns: [13, "error", 68, "Ximena: S/ 68", "error", "error"]
    note: "The second purchase isn't covered; the top-up of 50 brings a bonus; assigning −3 and topping up 0 are rejected."
  - args: [-5, [["s"]]]
    returns: ["error"]
    note: A negative starting balance is rejected too.
  - args: [0, [["+", 49], ["-", 49], ["s"]]]
    returns: [49, 0, "Ximena: S/ 0"]
    note: "With 49 there's no bonus, and spending exactly everything there is is allowed."
edge:
  - args: [12, []]
    tag: with no operations
  - args: [0, [["s"]]]
    tag: with a starting balance of zero
  - args: [10, [["-", 10], ["-", 1]]]
    tag: buying exactly what there is
  - args: [8, [["-", 9], ["s"]]]
    tag: with a purchase that isn't covered
  - args: [0, [["+", 50], ["+", 49], ["+", 51]]]
    tag: with top-ups at the edge of the bonus
  - args: [5, [["+", 0], ["+", -20], ["-", 0], ["-", -4], ["s"]]]
    tag: with zero and negative amounts
  - args: [30, [["=", -1], ["s"], ["=", 0], ["s"], ["+", 90]]]
    tag: assigning the balance directly
  - args: [-1, [["+", 50]]]
    tag: with a negative starting balance
random:
  count: 40
  seed: 1212
  generate: |
    operations = []
    for _ in range(rng.int(1, 25)):
        op = rng.pick(["+", "+", "-", "-", "-", "=", "s"])
        if op == "s":
            operations.append(["s"])
        elif op == "=":
            operations.append(["=", rng.int(-10, 80)])
        elif op == "+":
            operations.append(["+", rng.pick([0, 50, rng.int(-5, 49), rng.int(51, 90)])])
        else:
            operations.append(["-", rng.pick([0, rng.int(1, 30), rng.int(-3, 60)])])
    return [rng.pick([0, 0, rng.int(1, 60), rng.int(-5, -1)]), operations]
wrong:
  - |
    class Account:
        BONUS = 5
        BONUS_FROM = 50
        def __init__(self, holder, balance=0):
            self.holder = holder
            self._balance = balance
        @property
        def balance(self):
            return self._balance
        @balance.setter
        def balance(self, value):
            if value < 0:
                raise ValueError("negative")
        def top_up(self, amount):
            if amount <= 0:
                raise ValueError("amount")
            self.balance += amount + (self.BONUS if amount >= self.BONUS_FROM else 0)
            return self.balance
        def buy(self, price):
            if price <= 0:
                raise ValueError("price")
            self.balance -= price
            return self.balance
        def __str__(self):
            return f"{self.holder}: S/ {self.balance}"
    def try_out(start_balance, operations):
        try:
            account = Account("Ximena", start_balance)
        except ValueError:
            return ["error"]
        results = []
        for op, *data in operations:
            try:
                if op == "+":
                    results.append(account.top_up(data[0]))
                elif op == "-":
                    results.append(account.buy(data[0]))
                elif op == "=":
                    account.balance = data[0]
                    results.append(account.balance)
                else:
                    results.append(str(account))
            except ValueError:
                results.append("error")
        return results
  - |
    class Account:
        BONUS = 5
        BONUS_FROM = 50
        def __init__(self, holder, balance=0):
            self.holder = holder
            self._balance = balance
        @property
        def balance(self):
            return self._balance
        @balance.setter
        def balance(self, value):
            if value < 0:
                raise ValueError("negative")
            self._balance = value
        def top_up(self, amount):
            if amount <= 0:
                raise ValueError("amount")
            self.balance += amount + (self.BONUS if amount >= self.BONUS_FROM else 0)
            return self.balance
        def buy(self, price):
            if price <= 0:
                raise ValueError("price")
            self.balance -= price
            return self.balance
        def __str__(self):
            return f"{self.holder}: S/ {self.balance}"
    def try_out(start_balance, operations):
        try:
            account = Account("Ximena", start_balance)
        except ValueError:
            return ["error"]
        results = []
        for op, *data in operations:
            try:
                if op == "+":
                    results.append(account.top_up(data[0]))
                elif op == "-":
                    results.append(account.buy(data[0]))
                elif op == "=":
                    account.balance = data[0]
                    results.append(account.balance)
                else:
                    results.append(str(account))
            except ValueError:
                results.append("error")
        return results
  - |
    class Account:
        BONUS = 5
        BONUS_FROM = 50
        def __init__(self, holder, balance=0):
            self.holder = holder
            self.balance = balance
        @property
        def balance(self):
            return self._balance
        @balance.setter
        def balance(self, value):
            if value < 0:
                raise ValueError("negative")
            self._balance = value
        def top_up(self, amount):
            if amount <= 0:
                raise ValueError("amount")
            self.balance += amount + (self.BONUS if amount > self.BONUS_FROM else 0)
            return self.balance
        def buy(self, price):
            if price <= 0:
                raise ValueError("price")
            if price >= self.balance:
                raise ValueError("not enough")
            self.balance -= price
            return self.balance
        def __str__(self):
            return f"{self.holder}: S/ {self.balance}"
    def try_out(start_balance, operations):
        try:
            account = Account("Ximena", start_balance)
        except ValueError:
            return ["error"]
        results = []
        for op, *data in operations:
            try:
                if op == "+":
                    results.append(account.top_up(data[0]))
                elif op == "-":
                    results.append(account.buy(data[0]))
                elif op == "=":
                    account.balance = data[0]
                    results.append(account.balance)
                else:
                    results.append(str(account))
            except ValueError:
                results.append("error")
        return results
tests:
  - name: balance is a property with a setter
    source: '@property[\s\S]*@balance\.setter'
```

## Final mission

```exercise
id: py12-mision-mozo
type: mission
title: Quilla, El Arco's waiter
prompt: |
  **Complete the class `Waiter`, which wraps the robot and knows how to serve a table, and use it to serve all the `orders` in order; at the end, Quilla says how many dishes it served.**

  Quilla starts in the kitchen (K). The class already comes with, as a **class attribute**, the route from the kitchen to the tile above each table (`"W"` is west). `robot.follow_path(steps)` walks a list of directions, like `["E", "E", "S"]`; `list("EES")` builds it from a piece of text. Your part:

  - `__init__(self, robot)`: stores the robot and creates the list `served`, **each waiter's own**.
  - `reverse(route)`, a `@staticmethod`: the way back, as text. It's walked backwards and each direction swaps for its opposite: `reverse("EES")` is `"NWW"`.
  - `serve_table(table, dish)`: cooks the dish, goes to the table, serves, **goes back to the kitchen** and writes down the pair `(table, dish)` in `served`.
  - `__str__`: `"3 dishes served"`, with the right number.

  Create a waiter with `Waiter(robot)`, serve each order (`orders` is a list of `[table, dish]` pairs that changes in every test) and finish with `robot.say(str(waiter))`. When it passes, together with the judge, session 13 unlocks.
visual:
  figure:
    title: The routes in Waiter.ROUTES
    panes:
      - { label: "to table 3 and back", grid: ["############", "#K.........#", "#.##1###2#.#", "#.##.......#", "#.####3###.#", "#..........#", "###4####5###", "############"], path: ["1,1", "2,1", "3,1", "4,1", "5,1", "6,1", "7,1", "8,1", "9,1", "10,1", "10,2", "10,3", "9,3", "8,3", "7,3", "6,3"] }
      - { label: there and back, table: { head: ["table", "there", "back"], rows: [["1", "EEE", "WWW"], ["3", "EEEEEEEEE SS WWWW", "EEEE NN WWWWWWWWW"], ["4", "SSSS EE", "WW NNNN"]] } }
starter: |
  # orders comes from the till, for example: [[3, "pan de yema"], [4, "pastel de choclo"]]


  class Waiter:
      # From the kitchen to the tile above each table ("W" is west)
      ROUTES = {
          1: "EEE",
          2: "E" * 7,
          3: "E" * 9 + "SS" + "W" * 4,
          4: "SSSS" + "EE",
          5: "SSSS" + "E" * 7,
      }

      def __init__(self, robot):
          # TODO: store the robot and create the served list
          pass

      @staticmethod
      def reverse(route):
          # TODO: the route backwards, with each direction swapped for its opposite
          pass

      def serve_table(self, table, dish):
          # TODO: cook, go to the table, serve, come back and write down (table, dish)
          pass

      def __str__(self):
          # TODO: "3 dishes served"
          pass


  # TODO: create the waiter, serve each order and make Quilla say str(waiter)
solution: |
  class Waiter:
      # From the kitchen to the tile above each table ("W" is west)
      ROUTES = {
          1: "EEE",
          2: "E" * 7,
          3: "E" * 9 + "SS" + "W" * 4,
          4: "SSSS" + "EE",
          5: "SSSS" + "E" * 7,
      }

      def __init__(self, robot):
          self.robot = robot
          self.served = []

      @staticmethod
      def reverse(route):
          opposite = {"N": "S", "S": "N", "E": "W", "W": "E"}
          return "".join(opposite[step] for step in reversed(route))

      def serve_table(self, table, dish):
          route = self.ROUTES[table]
          self.robot.cook(dish)
          self.robot.follow_path(list(route))
          self.robot.serve()
          self.robot.follow_path(list(self.reverse(route)))
          self.served.append((table, dish))

      def __str__(self):
          return f"{len(self.served)} dishes served"


  waiter = Waiter(robot)
  for table, dish in orders:
      waiter.serve_table(table, dish)
  robot.say(str(waiter))
hints:
  - "To reverse: `reversed(route)` walks the text backwards, a dictionary `{\"N\": \"S\", …}` gives the opposite of each step, and `\"\".join(…)` puts them back together."
  - "Inside `serve_table`, the way there is `self.ROUTES[table]` and the way back `self.reverse(route)`; both are walked with `self.robot.follow_path(list(…))`."
world:
  theme: cocina
  level: 4
  dir: E
  api: [move, kitchen, path]
  map: |
    ############
    #K.........#
    #.##1###2#.#
    #.##.......#
    #.####3###.#
    #..........#
    ###4####5###
    ############
globals:
  orders:
    - [1, pan de yema]
    - [4, pastel de choclo]
    - [3, chicha morada]
scenarios:
  - tests:
      - name: says "3 dishes served"
        state: 'w.said[-1:] == ["3 dishes served"]'
  - globals:
      orders:
        - [5, cheese empanada]
        - [2, rosquitas]
        - [3, pan de yema]
        - [5, drip coffee]
        - [1, pastel de choclo]
    tests:
      - name: says "5 dishes served"
        state: 'w.said[-1:] == ["5 dishes served"]'
  - globals:
      orders:
        - [3, pan francés]
        - [4, pan francés]
    tests:
      - name: says "2 dishes served"
        state: 'w.said[-1:] == ["2 dishes served"]'
tests:
  - name: reverse gives the way back
    run: Waiter.reverse("EES")
    equals: NWW
  - name: reverse a route of the class
    run: Waiter.reverse(Waiter.ROUTES[3])
    equals: EEEENNWWWWWWWWW
  - name: each order reaches its table, in order
    state: 'len(w.served) == len(g.orders) and all(s.table == t and s.dish == d for s, (t, d) in zip(w.served, g.orders))'
    msg: The dishes served don't match the orders (table, dish or order).
  - name: the waiter writes down what it served
    expect: 'waiter.served == [tuple(o) for o in orders]'
  - name: each waiter has its own list
    expect: Waiter(robot).served == []
    msg: "Create the list in __init__ with self.served = []; a list in the body of the class is shared by all the waiters."
  - name: ends in the kitchen
    state: w.at_kitchen
  - name: without crashing
    state: not w.crashed
```

## Expert challenge

```exercise
id: py12-reto-vitrina
type: challenge
title: The showcase by batches
visual:
  figure:
    title: Showcase.from_text(…).in_order()
    input: { label: text, text: "06:30 40 pan de yema\n05:45 60 tacneño\n06:30 25 francés\n05:45 12 tacneño" }
    arrow: "sorts by time and bread; the repeated batch counts once"
    output: { label: returns, text: "['05:45 tacneño', '06:30 francés', '06:30 pan de yema']" }
prompt: |
  **Write two dataclasses, `Batch` and `Showcase`, for the bakery's batch log.** For people who already code.

  - `Batch(time, bread, units)`: **immutable** (`frozen`) and **orderable** (`order`) by time and then by bread. The units **don't count** for comparing or for the hash: `field(compare=False)`. That way, two records with the same time and the same bread are the same batch.
  - `Batch.from_line("06:30 40 pan de yema")`: a `@classmethod`. The time, the units, and the rest is the bread (which can have spaces).
  - `Showcase(batches)`: a list of batches, empty by default and each showcase's own.
  - `Showcase.from_text(text)`: one batch per non-empty line; if a batch is repeated, **the first one** stays.
  - `in_order()`: the list of `"time bread"` for the batches, sorted. `by_bread()`: a dictionary bread → units added up.
starter: |
  from dataclasses import dataclass, field


  # TODO: Batch and Showcase
solution: |
  from dataclasses import dataclass, field


  @dataclass(frozen=True, order=True)
  class Batch:
      time: str
      bread: str
      units: int = field(compare=False)

      @classmethod
      def from_line(cls, line):
          time, units, bread = line.split(maxsplit=2)
          return cls(time, bread, int(units))


  @dataclass
  class Showcase:
      batches: list[Batch] = field(default_factory=list)

      @classmethod
      def from_text(cls, text):
          showcase = cls()
          for line in text.splitlines():
              if line.strip():
                  batch = Batch.from_line(line)
                  if batch not in showcase.batches:
                      showcase.batches.append(batch)
          return showcase

      def in_order(self):
          return [f"{b.time} {b.bread}" for b in sorted(self.batches)]

      def by_bread(self):
          counts = {}
          for b in self.batches:
              counts[b.bread] = counts.get(b.bread, 0) + b.units
          return counts
hints:
  - "`line.split(maxsplit=2)` cuts only at the first two spaces: what's left is the whole bread."
  - "With `compare=False`, `batch in list` already ignores the units: you can use it to drop the repeated ones."
tests:
  - name: from_line
    expect: 'Batch.from_line("06:30 40 pan de yema") == Batch("06:30", "pan de yema", 40)'
  - name: the units don't count for comparing
    expect: 'Batch("06:30", "yema", 40) == Batch("06:30", "yema", 10)'
  - name: it's immutable and can be kept in a set
    expect: 'len({Batch("06:30", "yema", 40), Batch("06:30", "yema", 10)}) == 1'
    msg: "A dataclass with frozen=True can be hashed; without frozen, it can't."
  - name: sorted by time and then by bread
    run: 'Showcase.from_text("06:30 40 pan de yema\n05:45 60 tacneño\n06:30 25 francés\n05:45 12 tacneño").in_order()'
    equals: ["05:45 tacneño", "06:30 francés", "06:30 pan de yema"]
  - name: the repeated one counts once, with the first one's units
    run: 'Showcase.from_text("05:45 60 tacneño\n\n07:00 30 tacneño\n05:45 12 tacneño\n07:00 24 pan de yema").by_bread()'
    equals: { "tacneño": 90, "pan de yema": 24 }
  - name: a new showcase is empty and all its own
    expect: Showcase().batches == [] and Showcase().batches is not Showcase().batches
  - name: uses frozen and order
    source: '@dataclass\(\s*(frozen=True\s*,\s*order=True|order=True\s*,\s*frozen=True)\s*\)'
```
