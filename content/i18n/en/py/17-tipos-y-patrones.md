# Session 17 — Types, enums and match

## The job

Nazca, seven in the morning. At the María Reiche airfield, the light planes warm up their engines to fly tourists over the Hummingbird, the Monkey and the Whale, three-hundred-metre figures that only make sense from the air. The control tower is a two-storey hut with a radio, a fan and **Eusebio Ccahuana**, the controller, who has spent thirty years saying "OB-1622, maintain three hundred" without losing his patience.

Now all kinds of messages reach the tower: positions with altitudes, radio calls, runway requests, tourists' drones that shouldn't be there. Maru lent Quilla, siren and all, to sort them out and, at night, to do the rounds of the museum in María Reiche's house. Today Quilla learns to **say what shape its data has** (types), to name fixed states (`Enum`) and to **recognise the shape of a message** with `match`.

```scene
theme: museo
level: 2
dir: E
caption: The night round at the María Reiche museum. Quilla gets its orders as text and `match` decides what to do with each one.
map: |
  ###########
  #R........#
  ####P##O###
  ####m##.###
  ###########
program: |
  for order in ["forward 3", "check", "forward 3", "check"]:
      match order.split():
          case ["forward", steps]:
              robot.forward(int(steps))
          case ["check"]:
              reading = robot.sensor()
              if reading["door"] == "open":
                  robot.close_door()
              if reading["motion"]:
                  robot.alarm()
```

## The minimum

A **type annotation** says what a function expects and what it returns: `altitudes: list[int]` is "a list of integers" and `-> float` is "returns a decimal number". The everyday types accept square brackets: `list[int]`, `dict[str, float]`, `tuple[int, int]`, `set[str]`.

```py run
def average(altitudes: list[int]) -> float:
    return sum(altitudes) / len(altitudes)

minimums: dict[str, float] = {"Hummingbird": 300.0, "Monkey": 350.0}
print(average([300, 450, 600]), minimums["Monkey"])
```

- **`X | None`** is "an `X` or nothing": `def find(registration: str) -> int | None:` may return `None`. `int | str` is "one or the other".
- **`Callable[[int], int]`** (from `collections.abc`) is "a function that takes an `int` and returns an `int`".
- **Python doesn't check annotations when it runs.** They're documentation read by people, the editor and tools like `mypy`; `average((1, 2))` works even though it says `list[int]`.

```py run
from collections.abc import Callable

def correct(altitudes: list[int], rule: Callable[[int], int]) -> list[int]:
    return [rule(altitude) for altitude in altitudes]

print(correct([250, 400], lambda altitude: max(altitude, 300)), correct("ab", str.upper))
```

For dictionaries with fixed keys there's **`TypedDict`**, and to say "anything that has this method" there's **`Protocol`** (session 13's *duck typing*, with a name). Both are only types: at run time a `TypedDict` is a plain `dict`.

```py run
from typing import TypedDict

class Flight(TypedDict):
    registration: str
    minutes: int

flight: Flight = {"registration": "OB-1714", "minutes": 35}
print(flight["minutes"], type(flight).__name__)
```

```py
class WithReport(Protocol):
    def report(self) -> str: ...

def notify(thing: WithReport) -> str:   # any object with report() will do
    return "Tower: " + thing.report()
```

A **generic** function declares its type parameter in square brackets, `def f[T](…)`: `T` is "the same type, whatever it is". `first` returns a `str` if you give it texts and an `int` if you give it numbers.

```py run
def first[T](items: list[T], if_empty: T) -> T:
    return items[0] if items else if_empty

print(first(["Hummingbird", "Monkey"], "none"), first([], 0))
```

An **`Enum`** gathers a fixed set of named values. You can't misspell `Runway.CLOSED` without Python complaining, which a text like `"closd"` happily allows.

```py run
from enum import Enum

class Runway(Enum):
    CLEAR = "clear"
    CLOSED = "closed"

state = Runway("closed")
print(state.name, state.value, state is Runway.CLOSED, [r.name for r in Runway])
```

And now the star: **`match`** compares a value with several **patterns**, top to bottom, and runs the **first** `case` that fits. A pattern doesn't just compare: it also **pulls the parts out** into variables. Watch how the tower reads three messages:

```anim
title: The first case that fits wins
code: |
  def handle(message):
      match message.split():
          case ["runway"]:
              return "runway clear"
          case ["climb", meters] if meters.isdigit():
              return f"climb {meters} m"
          case ["land" | "descend", *rest]:
              return f"cleared {len(rest)}"
          case _:
              return "say again"

  for message in ["climb 200", "descend now", "climb lots"]:
      print(handle(message))
notes:
  2: "message.split() gives a list of words; match tries the cases in order."
  5: "It fits if it's a list of two and the first one is \"climb\". meters captures the second, and the if (the guard) requires it to be a number."
  7: "\"land\" | \"descend\" accepts either of the two; *rest captures the leftover words."
  9: "_ fits anything: it's the default case."
```

The patterns you'll use:

| pattern | fits |
|---|---|
| `"runway"`, `300`, `None` | that exact value (a literal) |
| `Runway.CLOSED` | that constant: a name **with a dot** is compared |
| `["climb", meters]`, `[first, *rest]` | a list or tuple of that shape; bare names capture |
| `{"type": "radio", "text": text}` | a dictionary with those keys (it may have more) |
| `Plane(registration=r, altitude=a)`, `int(n)`, `str()` | an object of that class; pulls out its attributes |
| `pattern if condition` | the pattern, plus the guard |
| `"v" \| "V"`, `(">" \| "<") as side` | any of several; `as` keeps which one it was |
| `_` | anything, without keeping it |

```py run
from dataclasses import dataclass

@dataclass
class Plane:
    registration: str
    altitude: int

def check(data):
    match data:
        case {"type": "radio", "text": str(text)}:
            return f"radio: {text}"
        case Plane(registration=registration, altitude=altitude) if altitude < 300:
            return f"{registration} flying low"
        case Plane(registration=registration):
            return f"{registration} ok"
        case _:
            return "?"

print(check({"type": "radio", "text": "all quiet", "hour": 9}))
print(check(Plane("OB-1501", 250)), check(Plane("OB-1622", 500)))
```

Notice the order: the `case` with a guard (`altitude < 300`) goes **before** the general one. The other way round, the general one would capture every plane and the specific one would never run.

> **Common trap:** a bare name in a pattern **doesn't compare, it captures**. `case ["land", CLOSED]:` doesn't ask whether the second element is `CLOSED`: it creates a variable `CLOSED` with whatever comes, and it always fits. (A lone `case CLOSED:` before other cases is already a `SyntaxError`: *name capture makes remaining patterns unreachable*.) To compare with a constant, write it with a dot (`Runway.CLOSED`) or write the literal.

<!-- legacy: builtin-generics -->

<!-- legacy: union-pipe -->

<!-- legacy: type-params -->

<!-- legacy: match -->

<!-- mdn: builtin-generics union-pipe type-params enum match -->

## Practice

```exercise
id: py17-predice-anotaciones
type: predict
title: The annotation nobody checks
prompt: |
  Eusebio annotated the types of `climb` carefully. Later someone called it with other things. What does it print?
code: |
  def climb(altitude: int, meters: int) -> int:
      return altitude + meters

  print(climb(300, 150))
  print(climb("300", "150"))
  print(climb([3], [1]))
options:
  - "450\n300150\n[3, 1]"
  - "450\n450\n[4]"
  - "450\nTypeError: expected int"
  - "450\n300150\n[4]"
answer: "450\n300150\n[3, 1]"
explain: |
  Annotations aren't checked at run time: Python just does `altitude + meters` with whatever arrives. Two texts get glued together and two lists get joined. An editor or `mypy` would have flagged those two calls before running.
```

```exercise
id: py17-predice-orden
type: predict
title: Five calls to the tower
prompt: |
  What does the tower answer to each message? Remember: the **first** `case` that fits wins.
code: |
  def read(message):
      match message.split():
          case ["tower"]:
              return "listening"
          case ["tower", *rest] if len(rest) > 2:
              return "keep it short"
          case ["tower", word] | [word, "tower"]:
              return f"copy {word}"
          case [_, *_]:
              return "who's calling?"
          case _:
              return "silence"

  for message in ["tower", "landing tower", "tower runway two clear", "hello", ""]:
      print(read(message))
options:
  - "listening\ncopy landing\nkeep it short\nwho's calling?\nsilence"
  - "listening\ncopy landing\ncopy runway\nwho's calling?\nsilence"
  - "listening\nwho's calling?\nkeep it short\nwho's calling?\nwho's calling?"
  - "listening\ncopy tower\nkeep it short\nwho's calling?\nsilence"
answer: "listening\ncopy landing\nkeep it short\nwho's calling?\nsilence"
explain: |
  `"landing tower"` fits the second half of the `|`, and `word` captures `"landing"`. `"tower runway two clear"` has three words after `tower`, so the guard `len(rest) > 2` holds. `[_, *_]` requires **at least one** element: the empty list from `""` doesn't fit and falls through to `_`.
```

```exercise
id: py17-completa-pista
type: complete
title: The state of the runway
prompt: |
  Over the radio, the runway arrives as text (`"occupied"`). Fill in the `___` to turn it into a `Runway`, answer with `match` according to the state and list the possible values.
visual:
  figure:
    input: { label: report, value: "\"occupied\"" }
    arrow: "Runway(report) and match"
    output: { label: prints, text: "OCCUPIED hold in the circuit\n['clear', 'occupied', 'closed']" }
starter: |
  from enum import Enum

  class Runway(___):
      CLEAR = "clear"
      OCCUPIED = "occupied"
      CLOSED = "closed"

  def clearance(state: Runway) -> str:
      match state:
          case Runway.CLEAR:
              return "cleared to land"
          case Runway.___:
              return "hold in the circuit"
          case Runway.CLOSED:
              return "divert to Ica"
      return "say again"

  report = "occupied"
  state = ___(report)
  print(state.name, clearance(state))
  print([r.___ for r in Runway])
solution: |
  from enum import Enum

  class Runway(Enum):
      CLEAR = "clear"
      OCCUPIED = "occupied"
      CLOSED = "closed"

  def clearance(state: Runway) -> str:
      match state:
          case Runway.CLEAR:
              return "cleared to land"
          case Runway.OCCUPIED:
              return "hold in the circuit"
          case Runway.CLOSED:
              return "divert to Ica"
      return "say again"

  report = "occupied"
  state = Runway(report)
  print(state.name, clearance(state))
  print([r.value for r in Runway])
hints:
  - "An enumeration inherits from `Enum`. Calling the class with a value, `Runway(\"occupied\")`, returns the member that has that value."
  - "Every member has `.name` (`\"OCCUPIED\"`) and `.value` (`\"occupied\"`)."
tests:
  - name: prints the state and the list
    output: "OCCUPIED hold in the circuit\n['clear', 'occupied', 'closed']"
  - name: state is a member of Runway
    expect: state is Runway.OCCUPIED
  - name: a closed runway diverts to Ica
    expect: 'clearance(Runway.CLOSED) == "divert to Ica"'
```

```exercise
id: py17-arregla-captura
type: fix
title: The runway that was always closed
prompt: |
  The tower diverts **every** plane to Ica, even when the runway is clear. The problem is in one `case`. Fix it so it prints `cleared` and then `divert to Ica`.
visual:
  figure:
    panes:
      - { label: "request", cards: [{ title: "[\"land\", Runway.CLEAR]", rows: [["expected", "\"cleared\""], ["got", "\"divert to Ica\""]] }] }
starter: |
  from enum import Enum

  class Runway(Enum):
      CLEAR = "clear"
      CLOSED = "closed"

  CLOSED = Runway.CLOSED

  def respond(request):
      match request:
          case ["land", CLOSED]:
              return "divert to Ica"
          case ["land", Runway.CLEAR]:
              return "cleared"
          case _:
              return "say again"

  print(respond(["land", Runway.CLEAR]))
  print(respond(["land", Runway.CLOSED]))
solution: |
  from enum import Enum

  class Runway(Enum):
      CLEAR = "clear"
      CLOSED = "closed"

  CLOSED = Runway.CLOSED

  def respond(request):
      match request:
          case ["land", Runway.CLOSED]:
              return "divert to Ica"
          case ["land", Runway.CLEAR]:
              return "cleared"
          case _:
              return "say again"

  print(respond(["land", Runway.CLEAR]))
  print(respond(["land", Runway.CLOSED]))
hints:
  - "In `case [\"land\", CLOSED]`, `CLOSED` is a bare name: it doesn't compare, it captures whatever comes in the second position."
  - "A name with a dot is compared: `Runway.CLOSED`."
tests:
  - name: clears with a clear runway and diverts with a closed one
    output: "cleared\ndivert to Ica"
  - name: a text isn't a runway state
    expect: 'respond(["land", "clear"]) == "say again"'
    msg: The text "clear" isn't Runway.CLEAR; it should fall into "say again".
  - name: compares with the dotted constant
    source: 'case\s*\[\s*"land"\s*,\s*Runway\.CLOSED\s*\]'
```

```exercise
id: py17-escribe-agrupar
type: write
title: Group by any criterion
prompt: |
  Write the generic function `group_by[T, K](items: list[T], key: Callable[[T], K]) -> dict[K, list[T]]`, which gathers the items according to what `key` returns for each one, in the order they appear.

  Eusebio wants it for everything: flights by plane, altitudes into "low" and "high", figures by their initial. `key` is a function: `group_by(figures, len)` groups by length.
visual:
  figure:
    input: { label: "group_by([250, 450, 280, 600], lambda altitude: altitude >= 300)", cells: [250, 450, 280, 600] }
    arrow: "key(item) decides the group"
    output: { label: returns, cards: [{ title: dict, rows: [["False", "[250, 280]"], ["True", "[450, 600]"]] }] }
starter: |
  from collections.abc import Callable

  def group_by(items, key):
      return {}

  print(group_by([250, 450, 280, 600], lambda altitude: altitude >= 300))
solution: |
  from collections.abc import Callable

  def group_by[T, K](items: list[T], key: Callable[[T], K]) -> dict[K, list[T]]:
      groups: dict[K, list[T]] = {}
      for item in items:
          groups.setdefault(key(item), []).append(item)
      return groups

  print(group_by([250, 450, 280, 600], lambda altitude: altitude >= 300))
hints:
  - "The full signature: `def group_by[T, K](items: list[T], key: Callable[[T], K]) -> dict[K, list[T]]:`."
  - "Inside, what you saw in session 6: `groups.setdefault(key(item), []).append(item)`."
tests:
  - name: the example in the picture
    expect: 'group_by([250, 450, 280, 600], lambda altitude: altitude >= 300) == {False: [250, 280], True: [450, 600]}'
  - name: figures by their initial
    expect: 'group_by(["Monkey", "Hummingbird", "Hands", "Condor"], lambda figure: figure[0]) == {"M": ["Monkey"], "H": ["Hummingbird", "Hands"], "C": ["Condor"]}'
  - name: with len as the key
    expect: 'group_by(["Monkey", "Whale", "Parrot"], len) == {6: ["Monkey", "Parrot"], 5: ["Whale"]}'
  - name: with no items
    expect: group_by([], len) == {}
  - name: declares the type parameters
    source: 'def\s+group_by\s*\[\s*T\s*,\s*K\s*\]'
  - name: annotates the key with Callable
    source: 'key\s*:\s*Callable\['
```

```exercise
id: py17-escribe-aeronaves
type: write
title: What's up in the sky
prompt: |
  Write `instruction(aircraft) -> str`, which uses `match` with **class patterns** to tell each aircraft what to do.

  | aircraft | instruction |
  |---|---|
  | `Plane` below 300 m | `"OB-1501: climb now"` (its registration) |
  | any other `Plane` | `"OB-1501: continue"` |
  | `Drone` above 120 m | `"Yolanda's drone: descend to 120"` (its operator) |
  | any other `Drone` | `"Yolanda's drone: ok"` |
  | anything else | `"unidentified"` |
visual:
  figure:
    input: { label: aircraft, cards: [{ title: "Plane", rows: [["registration", "\"OB-1501\""], ["altitude", "250"]] }, { title: "Drone", rows: [["operator", "\"Yolanda\""], ["altitude", "150"]] }] }
    arrow: "match with Plane(…) if … and Drone(…)"
    output: { label: returns, text: "OB-1501: climb now\nYolanda's drone: descend to 120" }
starter: |
  from dataclasses import dataclass

  @dataclass
  class Plane:
      registration: str
      altitude: int

  @dataclass
  class Drone:
      operator: str
      altitude: int

  def instruction(aircraft: Plane | Drone) -> str:
      return "unidentified"

  print(instruction(Plane("OB-1501", 250)))
  print(instruction(Drone("Yolanda", 150)))
solution: |
  from dataclasses import dataclass

  @dataclass
  class Plane:
      registration: str
      altitude: int

  @dataclass
  class Drone:
      operator: str
      altitude: int

  def instruction(aircraft: Plane | Drone) -> str:
      match aircraft:
          case Plane(registration=registration, altitude=altitude) if altitude < 300:
              return f"{registration}: climb now"
          case Plane(registration=registration):
              return f"{registration}: continue"
          case Drone(operator=operator, altitude=altitude) if altitude > 120:
              return f"{operator}'s drone: descend to 120"
          case Drone(operator=operator):
              return f"{operator}'s drone: ok"
          case _:
              return "unidentified"

  print(instruction(Plane("OB-1501", 250)))
  print(instruction(Drone("Yolanda", 150)))
hints:
  - "`case Plane(registration=registration, altitude=altitude) if altitude < 300:` fits a low plane and pulls out its two attributes."
  - "The cases with a guard go before the general ones of the same class."
tests:
  - name: a low plane
    run: 'instruction(Plane("OB-1501", 250))'
    equals: "OB-1501: climb now"
  - name: a plane right at 300
    run: 'instruction(Plane("OB-1622", 300))'
    equals: "OB-1622: continue"
  - name: a high drone
    run: 'instruction(Drone("Yolanda", 150))'
    equals: "Yolanda's drone: descend to 120"
  - name: a drone right at 120
    run: 'instruction(Drone("Fermín", 120))'
    equals: "Fermín's drone: ok"
  - name: something else
    run: 'instruction("condor")'
    equals: unidentified
  - name: uses class patterns
    source: 'case\s+Plane\('
```

## The case

```exercise
id: py17-caso-mensaje
type: case
title: The misclassified message
prompt: |
  **Put the `case`s of `classify` in the right order and count how many `"alert"`s each pilot had. Compare it with what they wrote in their logbook and find the plane that flew low and hid it.**

  A Ministry of Culture warden saw a plane go by almost skimming the Astronaut, and that's forbidden: over the figures you fly at **300 m or more**, except photography flights with a permit. The tower's report says "0 alerts" for everyone. Eusebio suspects the classifier the intern wrote: its cases are in the wrong order.

  Print one line per pilot that starts with their name, for example `print("Tito:", alerts)`, and the board will tell you whether it adds up.
visual:
  board:
    for: py17-caso-mensaje
    task: "A position below 300 m without a permit is an alert. Count each plane's alerts."
    cards:
      - name: Rocío
        kind: person
        role: Pilot of OB-1501
        rows: [["Said", "\"I went low once over the Whale, I already reported it\""], ["Logbook", "1 alert"]]
        clue: { find: "Rocío", says: 1, saysLabel: Logged }
      - name: Tito
        kind: person
        role: Pilot of OB-1622
        culprit: true
        rows: [["Said", "\"always above 300, as the tower says\""], ["Logbook", "0 alerts"]]
        clue: { find: "Tito", says: 0, saysLabel: Logged }
      - name: Gladys
        kind: person
        role: Pilot of OB-1740
        rows: [["Said", "\"I went low over the Spider, but with a photo permit\""], ["Logbook", "0 alerts"]]
        clue: { find: "Gladys", says: 0, saysLabel: Logged }
      - name: The tower's report
        kind: note
        role: What the classifier gave
        rows: [["Alerts", "0"], ["Emergencies", "1"], ["Messages", "12"]]
starter: |
  from typing import TypedDict

  class Message(TypedDict, total=False):
      type: str
      plane: str
      figure: str
      altitude: int
      permit: bool
      text: str

  MIN_ALTITUDE = 300
  # messages: the morning's 12 messages (already there); each one has the shape of Message
  # pilots: {"OB-1501": "Rocío", ...}

  # The intern's classifier: the cases are in the wrong order
  def classify(message: Message) -> str:
      match message:
          case {"type": "emergency"}:
              return "emergency"
          case {"type": "position"}:
              return "routine"
          case {"type": "position", "permit": True}:
              return "routine"
          case {"type": "position", "altitude": altitude} if altitude < MIN_ALTITUDE:
              return "alert"
          case _:
              return "routine"

  # TODO: put the cases in order and count each plane's alerts.
  # print("Tito:", alerts)
solution: |
  from typing import TypedDict

  class Message(TypedDict, total=False):
      type: str
      plane: str
      figure: str
      altitude: int
      permit: bool
      text: str

  MIN_ALTITUDE = 300

  def classify(message: Message) -> str:
      match message:
          case {"type": "emergency"}:
              return "emergency"
          case {"type": "position", "permit": True}:
              return "routine"
          case {"type": "position", "altitude": altitude} if altitude < MIN_ALTITUDE:
              return "alert"
          case {"type": "position"}:
              return "routine"
          case _:
              return "routine"

  alerts = {plane: 0 for plane in pilots}
  for message in messages:
      if classify(message) == "alert":
          alerts[message["plane"]] += 1

  for plane, pilot in pilots.items():
      print(f"{pilot}: {plane} {alerts[plane]}")
globals:
  pilots: { "OB-1501": Rocío, "OB-1622": Tito, "OB-1740": Gladys }
  messages:
    - {"type": "position", "plane": "OB-1501", "figure": "Hummingbird", "altitude": 450}
    - {"type": "position", "plane": "OB-1622", "figure": "Monkey", "altitude": 280}
    - {"type": "radio", "plane": "OB-1740", "text": "airsick passenger, all fine"}
    - {"type": "position", "plane": "OB-1740", "figure": "Spider", "altitude": 240, "permit": true}
    - {"type": "position", "plane": "OB-1501", "figure": "Whale", "altitude": 290}
    - {"type": "emergency", "plane": "OB-1622", "text": "bird near the propeller"}
    - {"type": "position", "plane": "OB-1622", "figure": "Hummingbird", "altitude": 310}
    - {"type": "position", "plane": "OB-1622", "figure": "Astronaut", "altitude": 260}
    - {"type": "position", "plane": "OB-1740", "figure": "Dog", "altitude": 520}
    - {"type": "position", "plane": "OB-1622", "figure": "Tree", "altitude": 300}
    - {"type": "radio", "plane": "OB-1501", "text": "returning to base"}
    - {"type": "position", "plane": "OB-1740", "figure": "Hands", "altitude": 330, "permit": false}
answer: OB-1622
answerLabel: Which plane flew low and hid it? (registration)
reveal: |
  Tito's OB-1622: it went down to 280 m over the Monkey and to 260 m over the Astronaut, and logged zero. The intern's classifier had `case {"type": "position"}` in second place: a dictionary pattern fits even if the message has **more** keys, so it captured every position and the two `case`s below it never ran. The right order goes from specific to general: first the permit (Gladys went down to 240 m with a photo permit), then the low altitude, and last any position. If you put the alert before the permit, Gladys shows up with an alert that isn't one.
hints:
  - "A dictionary pattern fits even when there are extra keys: `{\"type\": \"position\"}` fits **every** position. Put it after the more specific ones."
  - "Start with `alerts = {plane: 0 for plane in pilots}` and add 1 to `alerts[message[\"plane\"]]` when `classify(message) == \"alert\"`."
```

## The judge

Both judges are in function mode: the judge calls your function with each case and compares what it returns.

```exercise
id: py17-juez-piloto
type: judge
mode: function
function: pilot
title: The tower's autopilot
prompt: |
  **Write `pilot(commands: list[str]) -> list[str]`, which runs a training plane's commands, one by one, and returns what each one answered.**

  The tower's simulator sends short commands, like on a control panel. The plane starts **on the ground** (altitude 0) with **heading 0**. Split each command with `split()` and use `match`:

  | command | does | only if |
  |---|---|---|
  | `"^"` | takes off: altitude 300 | it's on the ground |
  | `"v"` | lands: altitude 0 | it's in the air at 300 m or lower |
  | `"+ m"` | climbs `m` metres | it's in the air, `m` is digits and it doesn't go over 3000 |
  | `"- m"` | descends `m` metres | `m` is digits and it doesn't go below 100 |
  | `">"` / `"<"` | turns 90° right / left (the heading goes from 0 to 270) | always |

  If the command can be done, the answer is the new state, `f"{altitude} {heading}"`. If not (the condition doesn't hold, or it's anything else: `"x"`, `"+"`, `"+ alto"`, `"> 90"`, `""`), the answer is `"error"` and the state doesn't change.

  **Constraints:** up to 25 commands.
visual:
  figure:
    title: Example 1, command by command
    panes:
      - { table: { head: ["command", "altitude", "heading", "answers"], rows: [["\"^\"", "300", "0", "\"300 0\""], ["\"+ 400\"", "700", "0", "\"700 0\""], ["\">\"", "700", "90", "\"700 90\""], ["\"- 650\"", "700 (would drop to 50)", "90", "\"error\""], ["\"- 400\"", "300", "90", "\"300 90\""], ["\"v\"", "0", "90", "\"0 90\""], ["\"v\"", "0 (already on the ground)", "90", "\"error\""]] } }
    caption: "A command that can't be done changes nothing: the altitude stays where it was."
starter: |
  def pilot(commands: list[str]) -> list[str]:
      altitude, heading = 0, 0
      results: list[str] = []
      return results
solution: |
  CEILING, FLOOR = 3000, 100

  def pilot(commands: list[str]) -> list[str]:
      altitude, heading = 0, 0
      results: list[str] = []
      for command in commands:
          match command.split():
              case ["^"] if altitude == 0:
                  altitude = 300
              case ["v"] if 0 < altitude <= 300:
                  altitude = 0
              case ["+", meters] if altitude > 0 and meters.isdigit() and altitude + int(meters) <= CEILING:
                  altitude += int(meters)
              case ["-", meters] if meters.isdigit() and altitude - int(meters) >= FLOOR:
                  altitude -= int(meters)
              case [(">" | "<") as side]:
                  heading = (heading + (90 if side == ">" else 270)) % 360
              case _:
                  results.append("error")
                  continue
          results.append(f"{altitude} {heading}")
      return results
hints:
  - "`match command.split():` and one `case` per command, with the condition as a guard: `case [\"+\", meters] if altitude > 0 and meters.isdigit() and …:`. If the guard fails, `match` keeps trying, and at the end `case _:` answers `\"error\"`."
  - "To turn, `(heading + 90) % 360` to the right and `(heading + 270) % 360` to the left. `case [(\">\" | \"<\") as side]:` captures both."
samples:
  - args: [["^", "+ 400", ">", "- 650", "- 400", "v", "v"]]
    returns: ["300 0", "700 0", "700 90", "error", "300 90", "0 90", "error"]
    note: The picture above.
  - args: [["v", "+ 200", "<", "^", "^", "+ 2800", "+ 2700", "> 90", "+ alto", "x"]]
    returns: ["error", "error", "0 270", "300 270", "error", "error", "3000 270", "error", "error", "error"]
    note: "On the ground you can't land or climb; 300 + 2800 would go over the 3000 ceiling."
edge:
  - args: [[]]
    tag: with no commands
  - args: [["", "+", "- 1 2", "^ 300"]]
    tag: with empty commands or extra words
  - args: [["^", "- 200", "- 201", "v"]]
    tag: descending exactly to 100
  - args: [["^", "+ 0", "- 0", "v"]]
    tag: with zero metres
  - args: [[">", ">", ">", ">", "<", "<"]]
    tag: turning all the way round on the ground
  - args: [["^", "+ 100", "v", "- 100", "v"]]
    tag: landing from above 300
  - args: [["^", "* 100", "= 200", "subir 100"]]
    tag: with orders that don't exist
random:
  count: 40
  seed: 1717
  generate: |
    def command():
        r = rng.int(0, 19)
        if r < 3:
            return "^"
        if r < 6:
            return "v"
        if r < 9:
            return rng.pick([">", "<"])
        if r < 13:
            return f"+ {rng.int(0, 30) * 50}"
        if r < 17:
            return f"- {rng.int(0, 12) * 50}"
        return rng.pick(["", "x", "+", "- 1 2", "+ alto", "> 90", "* 100", "^ 300", "v ya", "= 200", "- -50"])
    return [[command() for _ in range(rng.int(0, 25))]]
wrong:
  - |
    CLIMB, DESCEND = "+", "-"

    def pilot(commands):
        altitude, heading = 0, 0
        results = []
        for command in commands:
            match command.split():
                case ["^"] if altitude == 0:
                    altitude = 300
                case ["v"] if 0 < altitude <= 300:
                    altitude = 0
                case [CLIMB, meters] if altitude > 0 and meters.isdigit() and altitude + int(meters) <= 3000:
                    altitude += int(meters)
                case [DESCEND, meters] if meters.isdigit() and altitude - int(meters) >= 100:
                    altitude -= int(meters)
                case [(">" | "<") as side]:
                    heading = (heading + (90 if side == ">" else 270)) % 360
                case _:
                    results.append("error")
                    continue
            results.append(f"{altitude} {heading}")
        return results
  - |
    def pilot(commands):
        altitude, heading = 0, 0
        results = []
        for command in commands:
            match command.split():
                case ["^"] if altitude == 0:
                    altitude = 300
                case ["v"] if altitude > 0:
                    altitude = 0
                case ["+", meters] if altitude > 0 and meters.isdigit() and altitude + int(meters) <= 3000:
                    altitude += int(meters)
                case ["-", meters] if altitude > 0 and meters.isdigit() and altitude - int(meters) >= 100:
                    altitude -= int(meters)
                case [(">" | "<") as side]:
                    heading = (heading + (90 if side == ">" else 270)) % 360
                case _:
                    results.append("error")
                    continue
            results.append(f"{altitude} {heading}")
        return results
```

```exercise
id: py17-juez-forma
type: judge
mode: function
function: validate
title: The flight plan with the right shape
prompt: |
  **Write `validate(value, schema) -> list[str]`, which compares a piece of data with a schema and returns the path of every part that doesn't have the required shape.**

  Flight plans arrive as JSON and some come badly put together: a number written as text, a missing list. Eusebio describes the expected shape with a **schema**:

  - `"int"`, `"str"`, `"bool"`: a value of that type. Careful: `True` does **not** count as `"int"`, even though in Python `bool` is a kind of `int`.
  - `[sub]`: a list whose elements match `sub` (it may be empty).
  - `{"key": sub, …}`: a dictionary with those keys, each with its shape. Extra keys don't matter. A key ending in `?` (`"foto?"`) is **optional**: it may be missing, but if it's there, it's validated under its name without the `?`.

  Paths start at `"$"`: `"$.tramos[1].alt"` is the key `alt` of element 1 of the list `tramos`. A part with the wrong type or a missing required key gives its path and isn't looked into. Return the paths in order: keys in the schema's order and a list's elements in theirs. If everything is fine, `[]`.

  **Constraints:** schemas up to 3 levels deep · lists of up to 3 elements.
visual:
  figure:
    title: Example 2, checked against the schema
    panes:
      - { label: schema, text: "{\"id\": \"str\", \"pax\": \"int\",\n \"tramos\": [{\"fig\": \"str\", \"alt\": \"int\", \"foto?\": \"bool\"}]}" }
      - { label: value, text: "{\"id\": 1714, \"pax\": true,\n \"tramos\": [{\"fig\": \"Colibrí\"},\n            {\"fig\": \"Mono\", \"alt\": \"380\", \"foto\": \"sí\"}]}" }
      - { label: returns, cells: ["$.id", "$.pax", "$.tramos[0].alt", "$.tramos[1].alt", "$.tramos[1].foto"], index: false }
    caption: "`$.tramos[0].alt` is missing; `$.tramos[1].alt` is text; `foto` is optional, but it came and isn't a `bool`."
starter: |
  def validate(value, schema) -> list[str]:
      return []
solution: |
  def validate(value, schema, path: str = "$") -> list[str]:
      match schema, value:
          case "int", bool():
              return [path]
          case ("int", int()) | ("str", str()) | ("bool", bool()):
              return []
          case [sub], list():
              errors = []
              for i, element in enumerate(value):
                  errors += validate(element, sub, f"{path}[{i}]")
              return errors
          case dict(), dict():
              errors = []
              for key, sub in schema.items():
                  name = key.removesuffix("?")
                  if name in value:
                      errors += validate(value[name], sub, f"{path}.{name}")
                  elif not key.endswith("?"):
                      errors.append(f"{path}.{name}")
              return errors
          case _:
              return [path]
hints:
  - "Do `match schema, value:` (a tuple) and use class patterns for the type: `case \"str\", str():`. Put `case \"int\", bool():` **before** `case \"int\", int():`. Whatever fits nothing, `case _:`, is an error at `path`."
  - "Add a parameter `path=\"$\"` and call `validate` again for each element (`f\"{path}[{i}]\"`) and each key (`f\"{path}.{name}\"`), adding up the error lists."
samples:
  - args: [{ "id": "OB-1714", "pax": 4, "tramos": [{ "fig": "Colibrí", "alt": 450 }, { "fig": "Mono", "alt": 380, "foto": true }] }, { "id": "str", "pax": "int", "tramos": [{ "fig": "str", "alt": "int", "foto?": "bool" }] }]
    returns: []
    note: All in order; the first leg has no foto and that's fine, because it's optional.
  - args: [{ "id": 1714, "pax": true, "tramos": [{ "fig": "Colibrí" }, { "fig": "Mono", "alt": "380", "foto": "sí" }] }, { "id": "str", "pax": "int", "tramos": [{ "fig": "str", "alt": "int", "foto?": "bool" }] }]
    returns: ["$.id", "$.pax", "$.tramos[0].alt", "$.tramos[1].alt", "$.tramos[1].foto"]
    note: The picture above.
edge:
  - args: [[], { "id": "str" }]
    tag: when the whole plan isn't a dictionary
  - args: [true, "int"]
    tag: with a boolean where an integer goes
  - args: [false, "bool"]
    tag: with a boolean where a boolean goes
  - args: [7, "bool"]
    tag: with an integer where a boolean goes
  - args: [[], ["int"]]
    tag: with an empty list
  - args: ["123", ["str"]]
    tag: with a text where a list goes
  - args: [{}, { "a?": "int", "b?": ["str"] }]
    tag: with every optional key missing
  - args: [{ "a": [[1, "2"], [], [3, true]] }, { "a": [["int"]] }]
    tag: with lists inside lists
  - args: [{ "id": "OB-1", "extra": 5 }, { "id": "str" }]
    tag: with an extra key
random:
  count: 45
  seed: 1718
  generate: |
    def random_schema(level):
        r = rng.int(0, 9)
        if level >= 2 or r < 4:
            return rng.pick(["int", "str", "bool"])
        if r < 6:
            return [random_schema(level + 1)]
        keys = rng.shuffle(["id", "alt", "pax", "fig", "lat", "ok"])[:rng.int(1, 4)]
        return {key + ("?" if rng.int(0, 2) == 0 else ""): random_schema(level + 1) for key in keys}

    def value_for(schema):
        if rng.int(0, 6) == 0:
            return rng.pick([0, 7, -3, "OB-1714", "", True, False, [], {}, [1, 2], {"id": 1}])
        if schema == "int":
            return rng.int(-5, 3000)
        if schema == "str":
            return rng.pick(["Colibrí", "Mono", "OB-1622", "", "300"])
        if schema == "bool":
            return rng.pick([True, False])
        if isinstance(schema, list):
            return [value_for(schema[0]) for _ in range(rng.int(0, 3))]
        value = {}
        for key, sub in schema.items():
            if rng.int(0, 4) > 0:
                value[key.removesuffix("?")] = value_for(sub)
        if rng.int(0, 3) == 0:
            value["nota"] = "extra"
        return value

    schema = random_schema(0)
    return [value_for(schema), schema]
wrong:
  - |
    def validate(value, schema, path="$"):
        match schema, value:
            case ("int", int()) | ("str", str()) | ("bool", bool()):
                return []
            case [sub], list():
                errors = []
                for i, element in enumerate(value):
                    errors += validate(element, sub, f"{path}[{i}]")
                return errors
            case dict(), dict():
                errors = []
                for key, sub in schema.items():
                    name = key.removesuffix("?")
                    if name in value:
                        errors += validate(value[name], sub, f"{path}.{name}")
                    elif not key.endswith("?"):
                        errors.append(f"{path}.{name}")
                return errors
            case _:
                return [path]
  - |
    def validate(value, schema, path="$"):
        match schema, value:
            case "int", bool():
                return [path]
            case ("int", int()) | ("str", str()) | ("bool", bool()):
                return []
            case [sub], list():
                errors = []
                for i, element in enumerate(value):
                    errors += validate(element, sub, f"{path}[{i}]")
                return errors
            case dict(), dict():
                errors = []
                for key, sub in schema.items():
                    if key.endswith("?"):
                        continue
                    if key in value:
                        errors += validate(value[key], sub, f"{path}.{key}")
                    else:
                        errors.append(f"{path}.{key}")
                return errors
            case _:
                return [path]
tests:
  - name: uses match
    source: '\bmatch\b'
```

## Final mission

```exercise
id: py17-mision-ronda
type: mission
title: The round dictated over the radio
prompt: |
  **Go through the list `orders` and carry out each one with `match`. The ones you don't understand, don't carry out: keep them, exactly as they came, in the list `ignored`.**

  At night, Eusebio dictates the museum round over the radio and Quilla receives it as text. Split each order with `split()`:

  | order | Quilla does |
  |---|---|
  | `"forward 3"` | `robot.forward(3)`, only if the number is digits |
  | `"turn left"` or `"turn l"` | `robot.turn_left()` |
  | `"turn right"` or `"turn r"` | `robot.turn_right()` |
  | `"check"` | reads `robot.sensor()` for the door below: if it's `"open"`, `robot.close_door()`; if there's `"motion"`, `robot.alarm()` |
  | `"say round finished"` | `robot.say("round finished")`: all the words after `say`, at least one |

  All sorts of things slip in over the radio (`"turn"`, `"forward -2"`, `"coffee with milk"`): those go to `ignored`. The orders and the museum change in every test.
visual:
  figure:
    title: The first night's orders
    panes:
      - { label: orders, cells: ["forward 2", "check", "forward 5", "check", "turn", "forward 2", "turn right", "forward 3", "forward -2", "turn r", "…"] }
      - { label: ignored, cells: ["turn", "forward -2"] }
starter: |
  # orders: ["forward 2", "check", ...]   what Eusebio dictated
  ignored: list[str] = []

  for order in orders:
      # TODO: match order.split():
      pass
solution: |
  ignored: list[str] = []

  for order in orders:
      match order.split():
          case ["forward", steps] if steps.isdigit():
              robot.forward(int(steps))
          case ["turn", "left" | "l"]:
              robot.turn_left()
          case ["turn", "right" | "r"]:
              robot.turn_right()
          case ["check"]:
              reading = robot.sensor()
              if reading["door"] == "open":
                  robot.close_door()
              if reading["motion"]:
                  robot.alarm()
          case ["say", *words] if words:
              robot.say(" ".join(words))
          case _:
              ignored.append(order)
hints:
  - "`case [\"forward\", steps] if steps.isdigit():` and `case [\"turn\", \"left\" | \"l\"]:`. Whatever fits none of them falls into `case _:`, which adds it to `ignored`."
  - "For `say`, `case [\"say\", *words] if words:` captures all the words that follow; `\" \".join(words)` puts them back together."
globals:
  orders: ["forward 2", "check", "forward 5", "check", "turn", "forward 2", "turn right", "forward 3", "forward -2", "turn r", "forward 2", "check", "forward 2", "check", "say round finished"]
world:
  theme: museo
  level: 2
  dir: E
  map: |
    ############
    #R.........#
    ###P####O#.#
    ###m####.#.#
    ######.....#
    ######O#P###
    ######.#m###
    ############
scenarios:
  - tests:
      - name: ignores what it doesn't understand
        expect: 'ignored == ["turn", "forward -2"]'
      - name: says it's finished
        state: 'w.said == ["round finished"]'
  - globals:
      orders: ["forward 1", "check", "turn back", "forward 3", "check", "forward three", "forward 3", "check", "say all in order"]
    world: { dir: W }
    map: |
      ###########
      #........R#
      ##P##O##P##
      ##m##.##.##
      ###########
    tests:
      - name: ignores what it doesn't understand
        expect: 'ignored == ["turn back", "forward three"]'
      - name: says it's finished
        state: 'w.said == ["all in order"]'
  - globals:
      orders: ["forward 2", "turn l", "forward 2", "check", "coffee with milk", "forward 2", "check", "forward 2", "check", "say", "say end of the round"]
    world: { dir: S }
    map: |
      #########
      #R#######
      #.#######
      #.......#
      ###P#O#P#
      ###m#.#m#
      #########
    tests:
      - name: ignores what it doesn't understand
        expect: 'ignored == ["coffee with milk", "say"]'
      - name: says it's finished
        state: 'w.said == ["end of the round"]'
tests:
  - name: every door ends up closed
    state: w.open_doors == 0
    msg: A door was left open. Does "check" close the door when it's open?
  - name: the alarm goes off where there's motion
    state: w.alarms == w.motion_doors
  - name: reads the orders with match
    source: 'match\s+order\.split\(\)'
  - name: uses | for both ways of turning
    source: '"left"\s*\|\s*"l"|"l"\s*\|\s*"left"'
  - name: without crashing
    state: not w.crashed
```

## Expert challenge

```exercise
id: py17-reto-combustible
type: challenge
title: The fuel formula
visual:
  figure:
    title: An expression is a tree of tuples
    input: { label: "expr", text: "(\"+\", (\"*\", \"minutes\", 2), 15)" }
    arrow: "with env = {\"minutes\": 40}"
    output: { label: returns, value: "95" }
prompt: |
  **Write `evaluate(expr: Expr, env: dict[str, int]) -> int`, which computes a formula written as nested tuples.** For people who already code.

  Eusebio stores the fuel formulas as trees, so he can change them without touching the program. Declare the type with a recursive alias, `type Expr = int | str | tuple[...]` (the `type` statement, a cousin of `def f[T]`), and solve it with a single `match`:

  - an `int` is worth itself; a `str` is a variable and is worth `env[name]`;
  - `("+", a, b)`, `("-", a, b)`, `("*", a, b)`: the operation with both sides evaluated;
  - `("-", a)`: minus `a`;
  - `("max", a, b, …)` and `("min", a, b, …)`: the largest or smallest of one or more arguments;
  - any other shape raises `ValueError`.
starter: |
  def evaluate(expr, env):
      return 0

  print(evaluate(("+", ("*", "minutes", 2), 15), {"minutes": 40}))
solution: |
  type Expr = int | str | tuple[str, *tuple[Expr, ...]]

  def evaluate(expr: Expr, env: dict[str, int]) -> int:
      match expr:
          case bool():
              raise ValueError(f"not an expression: {expr!r}")
          case int(number):
              return number
          case str(name):
              return env[name]
          case ("-", a):
              return -evaluate(a, env)
          case (("+" | "-" | "*") as operator, a, b):
              left, right = evaluate(a, env), evaluate(b, env)
              match operator:
                  case "+":
                      return left + right
                  case "-":
                      return left - right
                  case _:
                      return left * right
          case (("max" | "min") as operator, first, *rest):
              values = [evaluate(part, env) for part in (first, *rest)]
              return max(values) if operator == "max" else min(values)
          case _:
              raise ValueError(f"not an expression: {expr!r}")

  print(evaluate(("+", ("*", "minutes", 2), 15), {"minutes": 40}))
hints:
  - "Order matters: `(\"-\", a)` and `(\"-\", a, b)` are different patterns because of their length, and `case ((\"max\" | \"min\") as operator, first, *rest):` requires at least one argument."
  - "Each part of a tuple is another `Expr`: call `evaluate` on it (recursion, session 15)."
tests:
  - name: the formula in the picture
    run: 'evaluate(("+", ("*", "minutes", 2), 15), {"minutes": 40})'
    equals: 95
  - name: a variable on its own
    run: 'evaluate("reserve", {"reserve": 20})'
    equals: 20
  - name: subtraction and minus
    run: 'evaluate(("-", ("-", 10), ("-", 3, 8)), {})'
    equals: -5
  - name: max with several arguments
    run: 'evaluate(("max", 30, ("*", "pax", 6), "minimum"), {"pax": 4, "minimum": 25})'
    equals: 30
  - name: min with just one
    run: 'evaluate(("min", 7), {})'
    equals: 7
  - name: declares the alias with type
    source: '^type\s+Expr\s*='
```
