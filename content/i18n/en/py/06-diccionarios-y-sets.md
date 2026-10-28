# Session 6 — Dictionaries and sets

## The job

Túcume, Lambayeque: the valley of the pyramids. Twenty-six adobe huacas slowly crumble in the sun, and at the foot of the Huaca Larga stands the site museum, where the director **Rosa Llontop** looks after thousands of pieces: bowls, copper tumis, ear spools, spondylus beads and a ceramic hairless dog every schoolkid wants to touch. The inventory lives in a notebook from 1998 and in three spreadsheets that can't agree with each other.

Maru lent her Quilla, which now has its siren, for the night rounds and to sort out the inventory. But finding "which showcase is tumi T-114 in?" by going through a list of four thousand pieces is slow and boring. Today Quilla learns to keep things **by their name**: dictionaries, to ask "where is it?" in a single jump, and sets, to ask "who is on both sides?".

```scene
theme: museo
level: 2
dir: E
caption: Quilla's round along the museum corridor. It closes the open door of the first room and sounds the siren at the second, where something is moving.
map: |
  ############
  #R.........#
  ###O###P##P#
  ###.###m##.#
  ############
program: |
  robot.forward(2)
  reading = robot.sensor()
  if reading["door"] == "open":
      robot.close_door()
  robot.forward(4)
  if robot.sensor()["motion"]:
      robot.alarm()
```

## The minimum

A **dictionary** (`dict`) keeps **key: value** pairs. Instead of searching by position, as in a list, you search by the key: `showcases["tumi"]` goes straight to the tumi's showcase, whether the museum has ten pieces or ten thousand.

```py run
showcases = {"tumi": "V3", "bowl": "V1", "ear spool": "V7"}
print(showcases["tumi"], showcases.get("idol", "no showcase"))
print("bowl" in showcases, "V1" in showcases)
showcases["idol"] = "V2"
print(list(showcases))
```

- **Read.** `d[key]` gives the value, and if the key doesn't exist it's a `KeyError`. `d.get(key)` gives `None` if it doesn't exist, and `d.get(key, other)` gives `other`.
- **Write.** `d[key] = value` adds the key, or changes its value if it was already there.
- **Ask.** `key in d` looks at **the keys**, never the values.
- **Loop.** `for key in d` gives the keys; `d.keys()`, `d.values()` and `d.items()` give the keys, the values and the `(key, value)` pairs: `for room, visits in d.items():`.
- **The order** is insertion order: keys come out in the order they went in. Changing the value of a key that was already there doesn't move it.
- **Merge.** `base | changes` creates a new dictionary with the keys of both; if one is repeated, the one on the right wins.

The star use of a dictionary is **counting**. `counts.get(room, 0)` gives what you've counted so far, or 0 the first time. Watch the dictionary fill up:

```anim
title: Counting visits with get
code: |
  visits = ["Templo", "Huaca Larga", "Templo", "Las Balsas", "Templo"]
  counts = {}
  for room in visits:
      counts[room] = counts.get(room, 0) + 1
  print(counts)
cells: { of: visits, at: room }
notes:
  2: "An empty dictionary: there are no rooms yet."
  4: "If the room is new, get gives 0 and it ends up at 1; if it was already there, it adds 1 to what it had."
  5: The rooms come out in the order they first appeared.
```

A value can be anything, including a list or another dictionary: that's a **nested dictionary**, and you read it with two square brackets in a row. To group, `setdefault(key, [])` returns that key's list and, if there wasn't one, creates it first:

```py run
pieces = [("bowl", "ceramic"), ("tumi", "copper"), ("ear spool", "copper")]
by_material = {}
for piece, material in pieces:
    by_material.setdefault(material, []).append(piece)
print(by_material, by_material["copper"][1])
```

A **set** is a bag with no repeats and no order: it's for asking "have I seen it already?" and for comparing groups. It's written with curly braces (`{"Ana", "Beto"}`), but the empty set is `set()`, because `{}` is an empty dictionary.

```py run
monday = {"Rosa", "Teófilo", "Nilda"}
tuesday = {"Teófilo", "Wilmer"}
print(sorted(monday | tuesday), sorted(monday & tuesday), sorted(monday - tuesday))
monday.add("Wilmer")
print(len(monday), "Wilmer" in monday)
```

`|` joins both, `&` keeps what's in both and `-` what's in the first and not in the second. Since a set has no order, here it's printed with `sorted()`.

**What can be a key?** Dictionary keys and set elements have to be **immutable** (*hashable*): numbers, strings, tuples. A list can't, because it could change after being stored. That's why an excavation square is stored as `finds[(3, 4)]`, with a tuple, and not as `finds[[3, 4]]`, which gives `TypeError: unhashable type: 'list'`.

> **Common trap:** `d[key]` with a key that doesn't exist doesn't give `None`: it stops the program with a `KeyError`. If the key might be missing, ask first with `in` or use `d.get(key, default)`.

<!-- legacy: dict-get -->

<!-- legacy: dict-has-key -->

<!-- legacy: dict-merge -->

<!-- legacy: set-literal -->

<!-- mdn: dict-get dict-has-key dict-merge set-literal -->

## Practice

```exercise
id: py6-predice-get
type: predict
title: The ear spool with no showcase
prompt: |
  Before running it: what does it print?
visual:
  figure:
    panes:
      - { label: showcases, cards: [{ title: showcases, rows: [["\"tumi\"", "\"V3\""], ["\"bowl\"", "\"V1\""]] }] }
code: |
  showcases = {"tumi": "V3", "bowl": "V1"}
  print(showcases.get("ear spool"))
  print(showcases.get("ear spool", "storage"))
  print("V3" in showcases, "tumi" in showcases)
  print(len(showcases))
options:
  - "None\nstorage\nFalse True\n2"
  - "None\nstorage\nTrue True\n2"
  - "storage\nstorage\nFalse True\n2"
  - "None\nstorage\nFalse True\n4"
answer: "None\nstorage\nFalse True\n2"
explain: |
  `get` without a default gives `None` when the key is missing; with one, it gives the default. `in` searches among the **keys**: `"V3"` is a value, so it gives `False`. And `len` counts pairs, not keys plus values: 2.
```

```exercise
id: py6-predice-horario
type: predict
title: The holiday timetable
prompt: |
  Rosa merges the usual timetable with the holiday changes and then changes Monday in the usual timetable. What does it print?
visual:
  figure:
    panes:
      - { label: hours, cards: [{ title: hours, rows: [["monday", "\"closed\""], ["tuesday", "\"9-17\""], ["sunday", "\"9-13\""]] }] }
      - { label: holiday, cards: [{ title: holiday, rows: [["tuesday", "\"closed\""], ["thursday", "\"9-13\""]] }] }
code: |
  hours = {"monday": "closed", "tuesday": "9-17", "sunday": "9-13"}
  holiday = {"tuesday": "closed", "thursday": "9-13"}
  new = hours | holiday
  hours["monday"] = "10-16"
  print(list(new))
  print(new["tuesday"], new["monday"])
options:
  - "['monday', 'tuesday', 'sunday', 'thursday']\nclosed closed"
  - "['monday', 'sunday', 'tuesday', 'thursday']\nclosed closed"
  - "['monday', 'tuesday', 'sunday', 'thursday']\n9-17 10-16"
  - "['monday', 'tuesday', 'sunday', 'thursday']\nclosed 10-16"
answer: "['monday', 'tuesday', 'sunday', 'thursday']\nclosed closed"
explain: |
  In `hours | holiday`, the repeated `tuesday` takes the value on the right (`"closed"`) but **doesn't move**: it stays where it first went in. `thursday` is new and goes at the end. And `new` is a separate dictionary: changing `hours` afterwards doesn't touch it.
```

```exercise
id: py6-completa-conteo
type: complete
title: What came out of square 7
prompt: |
  Quilla helped sift the soil from excavation square 7 and wrote down the material of each fragment. Fill in the `___` to count how many fragments there are of each material and print one line per material.
visual:
  figure:
    input: { label: finds, cells: ["ceramic", "copper", "ceramic", "shell", "ceramic", "copper"] }
    arrow: "counts[material] = counts.get(material, 0) + 1"
    output: { label: counts, cards: [{ title: counts, rows: [["ceramic", "3"], ["copper", "2"], ["shell", "1"]] }] }
starter: |
  finds = ["ceramic", "copper", "ceramic", "shell", "ceramic", "copper"]
  counts = ___
  for material in finds:
      counts[material] = counts.___(material, ___) + 1
  for material, amount in counts.___():
      print(f"{material}: {amount}")
solution: |
  finds = ["ceramic", "copper", "ceramic", "shell", "ceramic", "copper"]
  counts = {}
  for material in finds:
      counts[material] = counts.get(material, 0) + 1
  for material, amount in counts.items():
      print(f"{material}: {amount}")
hints:
  - The count starts as an empty dictionary.
  - "`get(material, 0)` gives 0 the first time a material shows up. To go through the pairs, `.items()`."
tests:
  - name: counts each material
    run: counts
    equals: { "ceramic": 3, "copper": 2, "shell": 1 }
  - name: prints in the order they appeared
    output: "ceramic: 3\ncopper: 2\nshell: 1"
  - name: counts with get
    source: '\.get\(\s*material\s*,\s*0\s*\)'
```

```exercise
id: py6-escribe-rutas
type: write
title: Two schools, one morning
prompt: |
  Write `compare(route_a, route_b)`, which returns three sets: the huacas that **both** schools visited, the ones **only the first** visited and the ones **only the second** visited, in that order.

  Two schools from Chiclayo came on the same day, and each guide wrote down the huacas their group visited (sometimes the same one twice, because they went back for somebody's cap). Rosa wants to know where they crossed paths. Turn each list into a set and use `&` and `-`.
visual:
  figure:
    panes:
      - { label: route_a, cells: ["Huaca Larga", "Templo", "Huaca 1", "Templo"] }
      - { label: route_b, cells: ["Las Balsas", "Templo", "Huaca Larga"] }
      - { label: returns, table: { head: ["in both", "only a", "only b"], rows: [["Huaca Larga, Templo", "Huaca 1", "Las Balsas"]] } }
starter: |
  def compare(route_a, route_b):
      return set(), set(), set()

  print(compare(["Huaca Larga", "Templo", "Huaca 1", "Templo"], ["Las Balsas", "Templo", "Huaca Larga"]))
solution: |
  def compare(route_a, route_b):
      visits_a = set(route_a)
      visits_b = set(route_b)
      return visits_a & visits_b, visits_a - visits_b, visits_b - visits_a

  print(compare(["Huaca Larga", "Templo", "Huaca 1", "Templo"], ["Las Balsas", "Templo", "Huaca Larga"]))
hints:
  - "`set(route_a)` removes the repeats from the list."
  - "What's in both is `a & b`; what's only in `a` is `a - b`."
tests:
  - name: the example in the drawing
    run: 'compare(["Huaca Larga", "Templo", "Huaca 1", "Templo"], ["Las Balsas", "Templo", "Huaca Larga"])'
    equals: [["Huaca Larga", "Templo"], ["Huaca 1"], ["Las Balsas"]]
  - name: no huacas in common
    run: 'compare(["Huaca 1"], ["Las Balsas", "Las Balsas"])'
    equals: [[], ["Huaca 1"], ["Las Balsas"]]
  - name: a school that never left the museum
    run: 'compare([], ["Templo"])'
    equals: [[], [], ["Templo"]]
  - name: returns sets
    expect: 'type(compare(["Templo"], ["Templo"])[0]) == set'
    msg: Return sets (with & and -), not lists.
  - name: uses & and -
    source: '&[\s\S]*-|-[\s\S]*&'
```

```exercise
id: py6-arregla-cuadricula
type: fix
title: The excavation plan
prompt: |
  Quilla records what it found in each excavation square using the coordinates as the key. The program crashes on the second line. Run it, read the error and fix it so it prints `At (2, 5) there is a bowl`.
visual:
  figure:
    panes:
      - { label: squares, grid: ["......", "......", "......", "......", "......", "......"], marks: ["2,5", "4,1"] }
      - { label: finds, cards: [{ title: finds, rows: [["(2, 5)", "\"bowl\""], ["(4, 1)", "\"tumi\""]] }] }
starter: |
  finds = {}
  finds[[2, 5]] = "bowl"
  finds[[4, 1]] = "tumi"
  square = [2, 5]
  print("At", square, "there is a", finds[square])
solution: |
  finds = {}
  finds[(2, 5)] = "bowl"
  finds[(4, 1)] = "tumi"
  square = (2, 5)
  print("At", square, "there is a", finds[square])
hints:
  - "`unhashable type: 'list'` means a list can't be a key: it could change after being stored."
  - A tuple, with parentheses, never changes. Change the three lists into tuples.
tests:
  - name: prints the find in the square
    output: At (2, 5) there is a bowl
  - name: the tumi was stored too
    expect: 'finds[(4, 1)] == "tumi"'
  - name: the keys are tuples
    expect: all(type(key) == tuple for key in finds)
```

```exercise
id: py6-escribe-inventario
type: write
title: The inventory by room and showcase
prompt: |
  Write `build_inventory(pieces)`, which receives a list of tuples `(code, room, showcase)` and returns a nested dictionary: `inventory[room][showcase]` is the list of codes in that showcase, in the order they arrived.

  It's the 1998 notebook written out clean. Use `setdefault` twice: once for the room (which starts as `{}`) and once for the showcase (which starts as `[]`).
visual:
  figure:
    input: { label: pieces, table: { head: ["code", "room", "showcase"], rows: [["T-114", "Huaca Larga", "V3"], ["C-020", "Templo", "V1"], ["T-115", "Huaca Larga", "V3"], ["O-007", "Huaca Larga", "V5"]] } }
    arrow: "setdefault(room, {}).setdefault(showcase, [])"
    output: { label: returns, cards: [{ title: "Huaca Larga", rows: [["V3", "[\"T-114\", \"T-115\"]"], ["V5", "[\"O-007\"]"]] }, { title: "Templo", rows: [["V1", "[\"C-020\"]"]] }] }
starter: |
  def build_inventory(pieces):
      inventory = {}
      return inventory

  print(build_inventory([("T-114", "Huaca Larga", "V3"), ("C-020", "Templo", "V1")]))
solution: |
  def build_inventory(pieces):
      inventory = {}
      for code, room, showcase in pieces:
          inventory.setdefault(room, {}).setdefault(showcase, []).append(code)
      return inventory

  print(build_inventory([("T-114", "Huaca Larga", "V3"), ("C-020", "Templo", "V1")]))
hints:
  - "`for code, room, showcase in pieces:` unpacks each tuple."
  - "`inventory.setdefault(room, {})` returns that room's dictionary; on it, `.setdefault(showcase, [])` returns the showcase's list, ready for `.append(code)`."
tests:
  - name: the example in the drawing
    run: 'build_inventory([("T-114", "Huaca Larga", "V3"), ("C-020", "Templo", "V1"), ("T-115", "Huaca Larga", "V3"), ("O-007", "Huaca Larga", "V5")])'
    equals: { "Huaca Larga": { V3: ["T-114", "T-115"], V5: ["O-007"] }, Templo: { V1: ["C-020"] } }
  - name: a single piece
    run: 'build_inventory([("P-001", "Las Balsas", "V2")])'
    equals: { "Las Balsas": { V2: ["P-001"] } }
  - name: no pieces
    run: build_inventory([])
    equals: {}
  - name: rooms come out in the order they appear
    expect: 'list(build_inventory([("A", "Templo", "V1"), ("B", "Huaca 1", "V1")])) == ["Templo", "Huaca 1"]'
```

## The case

```exercise
id: py6-caso-pieza
type: case
title: The duplicated piece
prompt: |
  **For each room, count how many scanned pieces don't belong to that room according to the catalogue, and compare it with what its robot reported. Then find the piece that shows up in two rooms at once.**

  Last night, the museum's three security robots scanned their rooms. The total came out with one piece too many, and that can't be: one of the two is a replica someone left behind to walk off with the original. Each robot reported how many **foreign** pieces (from another room) its room had. Careful: a scanner sometimes reads the same piece twice, and that's no duplicated piece at all.

  Print one line per robot that starts with its name, for example `print("Ñusta:", len(foreign))`, and the board will tell you whether it adds up.
visual:
  board:
    for: py6-caso-pieza
    task: "Foreign pieces = what the robot scanned minus the pieces the catalogue puts in its room."
    cards:
      - name: Ñusta
        kind: robot
        role: Guards the Huaca Larga room
        culprit: true
        rows: [["Scanned", "7 readings"], ["Said", "\"just TP-03, which came in for restoration\""], ["Reported foreign", "1"]]
        clue: { find: "Ñusta", says: 1, saysLabel: Reported }
      - name: Pacha
        kind: robot
        role: Guards the Templo de la Piedra room
        rows: [["Scanned", "4 readings"], ["Said", "\"HL-04, for the temporary showcase\""], ["Reported foreign", "1"]]
        clue: { find: "Pacha", says: 1, saysLabel: Reported }
      - name: Yunga
        kind: robot
        role: Guards the Las Balsas room
        rows: [["Scanned", "5 readings"], ["Said", "\"everything in its place\""], ["Reported foreign", "0"]]
        clue: { find: "Yunga", says: 0, saysLabel: Reported }
      - name: The catalogue
        kind: note
        role: Rosa's notebook
        rows: [["HL-01 to HL-05", "Huaca Larga"], ["TP-01 to TP-04", "Templo de la Piedra"], ["HB-01 to HB-04", "Las Balsas"]]
starter: |
  # Where each piece belongs, according to the catalogue
  catalogue = {
      "HL-01": "Huaca Larga", "HL-02": "Huaca Larga", "HL-03": "Huaca Larga",
      "HL-04": "Huaca Larga", "HL-05": "Huaca Larga",
      "TP-01": "Templo de la Piedra", "TP-02": "Templo de la Piedra",
      "TP-03": "Templo de la Piedra", "TP-04": "Templo de la Piedra",
      "HB-01": "Las Balsas", "HB-02": "Las Balsas", "HB-03": "Las Balsas", "HB-04": "Las Balsas",
  }

  # What each room's robot scanned last night, reading by reading
  scans = {
      "Huaca Larga": ["HL-01", "HL-02", "HL-03", "HL-05", "HL-02", "TP-03", "HB-02"],
      "Templo de la Piedra": ["TP-01", "TP-02", "TP-04", "HL-04"],
      "Las Balsas": ["HB-03", "HB-01", "HB-02", "HB-04", "HB-03"],
  }
  guards = {"Huaca Larga": "Ñusta", "Templo de la Piedra": "Pacha", "Las Balsas": "Yunga"}

  # TODO: for each room, build the set of its pieces according to the catalogue,
  # subtract it from the set of what was scanned and print one line per robot:
  # print("Ñusta:", len(foreign))
  # Then look for the piece that shows up in two rooms.
solution: |
  catalogue = {
      "HL-01": "Huaca Larga", "HL-02": "Huaca Larga", "HL-03": "Huaca Larga",
      "HL-04": "Huaca Larga", "HL-05": "Huaca Larga",
      "TP-01": "Templo de la Piedra", "TP-02": "Templo de la Piedra",
      "TP-03": "Templo de la Piedra", "TP-04": "Templo de la Piedra",
      "HB-01": "Las Balsas", "HB-02": "Las Balsas", "HB-03": "Las Balsas", "HB-04": "Las Balsas",
  }
  scans = {
      "Huaca Larga": ["HL-01", "HL-02", "HL-03", "HL-05", "HL-02", "TP-03", "HB-02"],
      "Templo de la Piedra": ["TP-01", "TP-02", "TP-04", "HL-04"],
      "Las Balsas": ["HB-03", "HB-01", "HB-02", "HB-04", "HB-03"],
  }
  guards = {"Huaca Larga": "Ñusta", "Templo de la Piedra": "Pacha", "Las Balsas": "Yunga"}

  for room, readings in scans.items():
      own = set()
      for code, home in catalogue.items():
          if home == room:
              own.add(code)
      foreign = set(readings) - own
      print(f"{guards[room]}: {sorted(foreign)} {len(foreign)}")

  seen = set()
  for room, readings in scans.items():
      in_two_rooms = seen & set(readings)
      if in_two_rooms:
          print("In two rooms at once:", sorted(in_two_rooms))
      seen |= set(readings)
answer: HB-02
answerLabel: Which piece shows up in two rooms at once?
reveal: |
  HB-02, a bowl from Las Balsas that also shows up in the Huaca Larga: `set(scans["Huaca Larga"]) & set(scans["Las Balsas"])` is `{"HB-02"}`. Ñusta had **two** foreign pieces and reported one; the one it kept quiet about was the replica. HL-02 also appears twice, but in the same list: the scanner read it twice, and the set gets rid of that. TP-03 and HL-04 are just in the wrong room, each in a single place.
hints:
  - "A room's pieces: go through `catalogue.items()` and add to a `set()` the codes whose room matches. The foreign ones are `set(readings) - own`."
  - "For the duplicate, gather what the previous rooms had in a set `seen`; `seen & set(readings)` tells you what repeats in the current room."
```

## The judge

Since session 4, judges test **functions**: you write the function the statement asks for, and the judge calls it with each case and compares what it returns. A tuple counts as a list.

```exercise
id: py6-juez-repetido
type: judge
mode: function
function: first_repeat
title: The ticket that got in twice
prompt: |
  **Write `first_repeat(entries)`, which returns the first name to go through the turnstile a second time, as `(name, first, second)`, or an empty tuple `()` if nobody repeated.**

  Rosa suspects someone is reusing their ticket. The turnstile records each visitor's name in the order they go in. Go through it and stop at the first entry of someone who had already gone through: return their name, the position of their first entry and that of this second one, counting **from 1**.

  "First" means the second entry that happens earliest: in `Rosa, Teófilo, Nilda, Teófilo, Rosa`, Rosa arrived before anyone, but Teófilo repeats first.

  **Constraints:** 0 ≤ `len(entries)` ≤ 40.
starter: |
  def first_repeat(entries):
      return ()
solution: |
  def first_repeat(entries):
      first_seen = {}
      position = 0
      for name in entries:
          position += 1
          if name in first_seen:
              return (name, first_seen[name], position)
          first_seen[name] = position
      return ()
hints:
  - "Keep in a dictionary the position where you saw each name for the first time: `first_seen[name] = position`."
  - "Before storing, ask `name in first_seen`: if it was already there, that's the answer and you can `return` right there."
visual:
  figure:
    title: Example 1, entry by entry
    panes:
      - { label: entries, cells: ["Rosa", "Teófilo", "Nilda", "Teófilo", "Rosa"], highlight: [1, 3] }
      - { label: "first_seen on reaching the 4th entry", cards: [{ title: first_seen, rows: [["Rosa", "1"], ["Teófilo", "2"], ["Nilda", "3"]] }] }
      - { label: returns, value: "(\"Teófilo\", 2, 4)" }
    caption: "At the 4th entry, `\"Teófilo\" in first_seen` is already `True`: it ends there, even though Rosa will repeat too."
samples:
  - args: [["Rosa", "Teófilo", "Nilda", "Teófilo", "Rosa"]]
    returns: ["Teófilo", 2, 4]
    note: The drawing above.
  - args: [["Doris", "Wilmer", "Flor"]]
    returns: []
    note: Nobody repeated.
edge:
  - args: [[]]
    tag: with an empty turnstile
  - args: [["Abel"]]
    tag: with a single entry
  - args: [["Zoila", "Zoila"]]
    tag: with two entries in a row from the same person
  - args: [["Rosa", "Nilda", "Elmer", "Flor", "Rosa"]]
    tag: when the repeat is the last entry
  - args: [["Elmer", "Flor", "Flor", "Elmer", "Elmer"]]
    tag: when one person repeats many times
random:
  count: 40
  seed: 61
  generate: |
    names = ["Eulogio", "Rosa", "Nilda", "Teófilo", "Yesenia", "Wilmer", "Doris", "Segundo",
             "Maritza", "Hipólito", "Flor", "Cayetano", "Zoila", "Abel", "Elmer"]
    if rng.int(0, 4) == 0:
        return [rng.shuffle(names)[:rng.int(0, 15)]]
    k = rng.int(2, 15)
    n = rng.int(1, 40)
    return [[rng.pick(names[:k]) for _ in range(n)]]
wrong:
  - |
    def first_repeat(entries):
        first_seen = {}
        for i in range(len(entries)):
            name = entries[i]
            if name in first_seen:
                return (name, first_seen[name], i)
            first_seen[name] = i
        return ()
  - |
    def first_repeat(entries):
        for i in range(len(entries)):
            for j in range(i + 1, len(entries)):
                if entries[i] == entries[j]:
                    return (entries[i], i + 1, j + 1)
        return ()
  - |
    def first_repeat(entries):
        first_seen = {}
        answer = ()
        position = 0
        for name in entries:
            position += 1
            if name in first_seen:
                answer = (name, first_seen[name], position)
            else:
                first_seen[name] = position
        return answer
```

```exercise
id: py6-juez-etiquetas
type: judge
mode: function
function: group_labels
title: The scrambled label printer
prompt: |
  **Write `group_labels(labels)`, which gathers the labels made of exactly the same letters and returns the list of groups.**

  The old printer in the storeroom prints the letters of each label in any order: `TUMI` can come out as `MITU` or `IMUT`. To know which boxes belong to the same piece, Rosa needs to gather the labels that use **the same letters, the same number of times** (`ANA` and `NAA` go together; `NNA` doesn't).

  - Each group is a list with its labels in the order they appear, repeats included.
  - The groups go in the order their first label appears.

  A hint for the dictionary key: two labels go together if `sorted(label)` gives the same thing. But `sorted` returns a list, and a list can't be a key.

  **Constraints:** 0 ≤ `len(labels)` ≤ 25 · each label has 1 to 6 uppercase letters.
starter: |
  def group_labels(labels):
      return []
solution: |
  def group_labels(labels):
      groups = {}
      for label in labels:
          key = tuple(sorted(label))
          groups.setdefault(key, []).append(label)
      return list(groups.values())
hints:
  - "`tuple(sorted(label))` is the same for `\"TUMI\"` and `\"MITU\"`: `('I', 'M', 'T', 'U')`. Use it as a dictionary key."
  - "`groups.setdefault(key, []).append(label)` groups them, and `list(groups.values())` already comes out in order of first appearance."
visual:
  figure:
    title: Example 1, grouped
    input: { label: labels, cells: ["TUMI", "MITU", "VASO", "IMUT", "SOVA"] }
    arrow: "key = tuple(sorted(label))"
    output: { label: groups, table: { head: ["key", "group"], rows: [["I M T U", "TUMI, MITU, IMUT"], ["A O S V", "VASO, SOVA"]] } }
    steps:
      - The five labels give only two different keys.
      - TUMI's group goes first because TUMI appeared before VASO.
samples:
  - args: [["TUMI", "MITU", "VASO", "IMUT", "SOVA"]]
    returns: [["TUMI", "MITU", "IMUT"], ["VASO", "SOVA"]]
    note: The drawing above.
  - args: [["ANA", "NAA", "NNA"]]
    returns: [["ANA", "NAA"], ["NNA"]]
    note: NNA has the same distinct letters, but not the same amount of each.
edge:
  - args: [[]]
    tag: with no labels
  - args: [["OLLA"]]
    tag: with a single label
  - args: [["OLLA", "OLLA"]]
    tag: with the same label twice
  - args: [["AB", "BA", "AAB", "ABB", "BAB"]]
    tag: with letters repeated a different number of times
  - args: [["Z", "Y", "Z", "X"]]
    tag: with one-letter labels
  - args: [["VASO", "COBRE", "TUMI"]]
    tag: when no pair goes together
random:
  count: 40
  seed: 62
  generate: |
    bases = ["TUMI", "VASO", "OLLA", "CUENCO", "COBRE", "PLATO", "CONCHA", "ARETE", "MANTO", "AMA", "LORO"]
    k = rng.int(1, len(bases))
    labels = []
    for _ in range(rng.int(0, 25)):
        letters = rng.shuffle(rng.pick(bases[:k]))
        if rng.int(0, 3) == 0:
            letters[rng.int(0, len(letters) - 1)] = rng.pick(letters)
        labels.append("".join(letters))
    return [labels]
wrong:
  - |
    def group_labels(labels):
        groups = {}
        for label in labels:
            key = frozenset(label)
            groups.setdefault(key, []).append(label)
        return list(groups.values())
  - |
    def group_labels(labels):
        groups = {}
        for label in labels:
            key = "".join(sorted(label))
            groups.setdefault(key, []).append(label)
        return sorted(groups.values())
  - |
    def group_labels(labels):
        groups = {}
        for label in labels:
            key = sorted(label)
            groups.setdefault(key, []).append(label)
        return list(groups.values())
```

## Final mission

```exercise
id: py6-mision-ronda
type: mission
title: The round of the rooms
prompt: |
  **Go through the rooms in the order of the `rooms` dictionary: at each door close it if it's open, sound the alarm if there's motion, and write down in `report` how each room was.**

  Rosa left Quilla the corridor plan as a dictionary: `rooms["Huaca Larga Room"]` is the **column** where that room's door is, and the rooms are in the dictionary in the same order as in the corridor. Quilla starts at column 1 facing east, and `robot.position.x` tells it which column it's in, so to reach a door it moves forward `column - robot.position.x`.

  In the rooms on the `maintenance` list there are restorers working at night: the motion is theirs. There Quilla **doesn't use the sensor or the alarm**; it just writes the room down as `"maintenance"`. In the others, standing on the door:

  - `robot.sensor()` returns a dictionary like `{"door": "open", "motion": True}`;
  - `robot.close_door()` closes it and `robot.alarm()` sounds the siren;
  - in `report[name]` write `"intruder"` if there was motion and `"calm"` if not.

  The plan, the rooms and the maintenance change in every test.
visual:
  figure:
    title: The plan for the first night
    panes:
      - { label: rooms, cards: [{ title: rooms, rows: [["\"Huaca Larga Room\"", "3"], ["\"Templo de la Piedra Room\"", "6"], ["\"Las Balsas Room\"", "8"], ["\"Huaca 1 Room\"", "12"]] }] }
      - { label: maintenance, cells: ["Las Balsas Room"] }
      - { label: "report at the end", cards: [{ title: report, rows: [["Huaca Larga Room", "\"intruder\""], ["Templo de la Piedra Room", "\"calm\""], ["Las Balsas Room", "\"maintenance\""], ["Huaca 1 Room", "\"calm\""]] }] }
starter: |
  # rooms: {"Huaca Larga Room": 3, ...}   room name → column of its door
  # maintenance: ["Las Balsas Room"]      rooms not to be touched tonight
  under_maintenance = set(maintenance)
  report = {}

  # TODO: go through rooms.items() in order
solution: |
  under_maintenance = set(maintenance)
  report = {}

  for name, column in rooms.items():
      robot.forward(column - robot.position.x)
      if name in under_maintenance:
          report[name] = "maintenance"
          continue
      reading = robot.sensor()
      if reading["door"] == "open":
          robot.close_door()
      if reading["motion"]:
          robot.alarm()
          report[name] = "intruder"
      else:
          report[name] = "calm"
hints:
  - "`for name, column in rooms.items():` gives you each room in corridor order; the first thing on each pass is `robot.forward(column - robot.position.x)`."
  - "If `name in under_maintenance`, write it down and move on to the next with `continue`. If not, read the sensor once and keep it: `reading[\"door\"]` and `reading[\"motion\"]`."
world:
  theme: museo
  level: 2
  dir: E
  map: |
    ##############
    #R...........#
    ###P##O#P###O#
    ###m##.#m###.#
    ##############
globals:
  rooms: { "Huaca Larga Room": 3, "Templo de la Piedra Room": 6, "Las Balsas Room": 8, "Huaca 1 Room": 12 }
  maintenance: ["Las Balsas Room"]
scenarios:
  - tests:
      - name: the report for the first night
        expect: 'report == {"Huaca Larga Room": "intruder", "Templo de la Piedra Room": "calm", "Las Balsas Room": "maintenance", "Huaca 1 Room": "calm"}'
  - map: |
      ##############
      #R...........#
      ##O###P#O##P##
      ##.###m#m##.##
      ##############
    globals:
      rooms: { "Huaca 1 Room": 2, "Tumi Room": 6, "Las Balsas Room": 8, "Huaca Larga Room": 11 }
      maintenance: ["Tumi Room"]
    tests:
      - name: the report for the second night
        expect: 'report == {"Huaca 1 Room": "calm", "Tumi Room": "maintenance", "Las Balsas Room": "intruder", "Huaca Larga Room": "calm"}'
  - map: |
      ###########
      #R........#
      ####O##P#O#
      ####m##m#.#
      ###########
    globals:
      rooms: { "Huaca Larga Room": 4, "Las Balsas Room": 7, "Huaca 1 Room": 9 }
      maintenance: []
    tests:
      - name: the report for a night with no maintenance
        expect: 'report == {"Huaca Larga Room": "intruder", "Las Balsas Room": "intruder", "Huaca 1 Room": "calm"}'
tests:
  - name: every door ends up closed
    state: w.open_doors == 0
    msg: At least one door was left open.
  - name: the alarm sounds only where there are intruders
    state: 'w.alarms == sorted(k for k in w.motion_doors if k not in [str(g["rooms"][n]) + ",2" for n in g["maintenance"]])'
    msg: The alarm goes where there's motion, except in the rooms under maintenance.
  - name: the report has the rooms in corridor order
    expect: list(report) == list(rooms)
    msg: Write every room in report, including the ones under maintenance, in the order of rooms.
  - name: goes through the dictionary with items()
    source: '\brooms\.items\(\)'
  - name: without crashing
    state: not w.crashed
```

## Expert challenge

```exercise
id: py6-reto-renombres
type: challenge
title: The codes that changed names
visual:
  figure:
    title: Following each code to the end
    input: { label: renames, cards: [{ title: renames, rows: [["T-1", "T-7"], ["T-7", "TC-3"], ["X-1", "X-2"], ["X-2", "X-1"]] }] }
    arrow: follow the chain; if it loops back, None
    output: { label: returns, cards: [{ title: finals, rows: [["T-1", "TC-3"], ["T-7", "TC-3"], ["X-1", "None"], ["X-2", "None"]] }] }
prompt: |
  **Write `resolve(renames)`, which returns a dictionary with the final code of each old code.** For those who already code.

  Every time the museum reorganised the storeroom, it renumbered pieces: `renames["T-1"] == "T-7"` means T-1 was renamed T-7, and maybe T-7 later became TC-3. The final code is the first one in the chain that wasn't renamed again. If a chain loops back to a code already seen (some intern's mistake), the final is `None`. Return one key for each key of `renames`.
starter: |
  def resolve(renames):
      return {}

  print(resolve({"T-1": "T-7", "T-7": "TC-3"}))
solution: |
  def resolve(renames):
      finals = {}
      for code in renames:
          seen = {code}
          current = renames[code]
          while current in renames and current not in seen:
              seen.add(current)
              current = renames[current]
          finals[code] = None if current in renames else current
      return finals

  print(resolve({"T-1": "T-7", "T-7": "TC-3"}))
hints:
  - Follow the chain with a `while current in renames`, and keep a set of the codes already seen so you don't go round forever.
  - If the loop stopped because `current` was already in `seen`, the chain is a circle.
tests:
  - name: a two-step chain
    run: 'resolve({"T-1": "T-7", "T-7": "TC-3"})'
    equals: { "T-1": TC-3, "T-7": TC-3 }
  - name: a circle
    run: 'resolve({"X-1": "X-2", "X-2": "X-1", "B-2": "B-9"})'
    equals: { "X-1": null, "X-2": null, "B-2": B-9 }
  - name: a chain that falls into a circle
    run: 'resolve({"Y": "X-1", "X-1": "X-2", "X-2": "X-1"})'
    equals: { "Y": null, "X-1": null, "X-2": null }
  - name: a code renamed to itself
    run: 'resolve({"Z": "Z"})'
    equals: { "Z": null }
  - name: no renames
    run: resolve({})
    equals: {}
```
