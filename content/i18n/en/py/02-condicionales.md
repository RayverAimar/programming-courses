# Session 2 — Conditionals

## The job

The Museo Larco, in Pueblo Libre, keeps thousands of huacos, a whole room of gold and silver and a bougainvillea garden that goes dark at night. Don Alipio, its lifelong night watchman, retires on Friday, and the director called Maru Chumpitaz: could Quilla do the night round?

Maru bolted a **siren** onto its head and a sensor that reads each room's door: whether it was left open and whether something is moving inside. But no two nights are alike. A robot that always does the same thing slams the door in the cleaning lady's face or lets a huaco thief through. Today Quilla learns to **decide**.

```scene
theme: museo
level: 2
dir: E
caption: Quilla's first round. The textile room was left open and empty; in the ceramics room, something is moving.
map: |
  ###########
  #R........#
  ###O####P##
  ###.####m##
  ###########
program: |
  robot.forward(2)
  reading = robot.sensor()
  if reading["door"] == "open":
      robot.close_door()
  robot.forward(5)
  reading = robot.sensor()
  if reading["motion"]:
      robot.alarm()
```

## The minimum

`if` runs a block only if its condition is true. `elif` (short for *else if*) tries another condition if the previous one failed, and `else` catches everything else. Python checks them from top to bottom and **only runs the first block that holds**. The block is whatever is **indented** (four spaces) after the colon.

```py run
humidity = 68
if humidity > 70:
    print("Turn on the dehumidifier")
elif 45 <= humidity <= 70:
    print("Good humidity for the huacos")
else:
    print("Too dry: watch out for the wood")
```

Watch which path the program takes with a reading at eleven at night: only the block that runs lights up; the others are skipped without a look.

```anim
title: The first block that holds, and no other
code: |
  hour = 23
  motion = True
  if not motion:
      alert = "calm"
  elif 9 <= hour < 18:
      alert = "visitor"
  else:
      alert = "intruder"
  siren = "on" if alert == "intruder" else "off"
  print(alert, siren)
notes:
  3: not motion is False, because there is motion. This block is skipped.
  5: "Is the hour between 9 and 18? 23 isn't: skipped too."
  8: No condition held, so the else runs.
  9: A decision in a single line, as the value of a variable.
```

What you need for today:

- **Comparing:** `==` (equal), `!=` (not equal), `<`, `>`, `<=`, `>=`. Python **chains** them like in maths: `9 <= hour < 18` is "hour between 9 and 18, not including 18".
- **Combining** is written with words: `and` (both), `or` (at least one), `not` (the opposite).
- **True and false without booleans.** An `if` accepts any value. These count as false (*falsy*): `False`, `0`, `0.0`, `""` (empty text), `[]` (empty list) and `None`; everything else is true, even the texts `"0"` and `"False"`.
- **`is None`.** `==` compares values. `is` asks whether it's **the same object**, and you'll only use it with `None`: `if reading is None:`. For everything else, `==`.
- **A decision in one line:** `a if condition else b` is `a` when it holds and `b` when it doesn't: `status = "open" if is_open else "closed"`.

```py run
visitors = 0
guide = None
note = "0"
print(bool(visitors), bool(guide), bool(note), bool(""), bool([]))
print("empty" if not visitors else "busy", guide is None)
```

> **Common trap:** in Python, indentation **is** the block. A line left without indentation no longer belongs to the `if` and always runs:
>
> ```py
> if motion:
>     robot.alarm()
> print("Told Maru")  # no indentation: printed whether or not there's motion
> ```
>
> And if, in the same block, one line has four spaces and another has three, the program doesn't even start: it's an `IndentationError`.

<!-- legacy: chained-comparison -->

<!-- legacy: is-none -->

<!-- legacy: conditional-expression -->

<!-- mdn: chained-comparison is-none conditional-expression -->

## Practice

```exercise
id: py2-predice-humedad
type: predict
title: The textile room's hygrometer
prompt: |
  The mantles in the textile room suffer from humidity. The sensor reads 82. What does it print?
code: |
  humidity = 82
  if humidity > 60:
      print("Humid")
  elif humidity > 80:
      print("Very humid: call Maru")
  else:
      print("Fine")
  print("End of reading")
options:
  - "Humid\nEnd of reading"
  - "Very humid: call Maru\nEnd of reading"
  - "Humid\nVery humid: call Maru\nEnd of reading"
  - "Humid"
answer: "Humid\nEnd of reading"
explain: |
  82 meets `humidity > 60`, so that block runs and the chain ends: the `elif` isn't even looked at. In this order, "Very humid" could **never** be printed; the strictest condition has to go first. The last line has no indentation, so it always runs.
```

```exercise
id: py2-predice-falsy
type: predict
title: What's there and what isn't
prompt: |
  When the museum closes, Quilla checks four facts about the day. What does it print?
code: |
  visitors = 0
  lost_items = []
  code = "0"
  guide = None
  if visitors:
      print("there are visitors")
  if not lost_items:
      print("nothing lost")
  if code:
      print("there is a code")
  if guide is None:
      print("no guide")
options:
  - "nothing lost\nthere is a code\nno guide"
  - "nothing lost\nno guide"
  - "there are visitors\nnothing lost\nthere is a code\nno guide"
  - "there is a code"
answer: "nothing lost\nthere is a code\nno guide"
explain: |
  `0` and the empty list `[]` are *falsy*: there are no visitors, and `not []` is `True`. `"0"` is a text with one character inside, so it's *truthy* even though it looks like a zero. And `guide` is `None`, which you ask about with `is`.
```

```exercise
id: py2-completa-vitrina
type: complete
title: The gold display case
prompt: |
  Fill in the gaps so that `status` is `"in order"` if the temperature is **between 18 and 24 degrees, both included**, and the glass is also `"intact"`; otherwise, `"check"`.

  `temperature` and `glass` come from the display case's sensor, and it's tested with several readings. Use a chained comparison.
visual:
  figure:
    title: When the display case is in order
    table:
      head: ["temperature", "glass", "status"]
      rows: [["21", "\"intact\"", "\"in order\""], ["18", "\"intact\"", "\"in order\""], ["25", "\"intact\"", "\"check\""], ["21", "\"cracked\"", "\"check\""]]
starter: |
  if ___ <= temperature <= ___ ___ glass == "intact":
      status = "in order"
  ___:
      status = "check"
  print(f"Gold display case: {status}")
solution: |
  if 18 <= temperature <= 24 and glass == "intact":
      status = "in order"
  else:
      status = "check"
  print(f"Gold display case: {status}")
hints:
  - The first two gaps are the edges of the range; the third joins the two conditions.
  - The last gap is the word that catches "everything else".
globals:
  temperature: 21
  glass: intact
scenarios:
  - tests:
      - name: 21 degrees and intact → in order
        output: "Gold display case: in order"
  - globals: { temperature: 25, glass: intact }
    tests:
      - name: 25 degrees → check
        output: "Gold display case: check"
  - globals: { temperature: 18, glass: intact }
    tests:
      - name: exactly 18 degrees → in order
        output: "Gold display case: in order"
  - globals: { temperature: 24, glass: intact }
    tests:
      - name: exactly 24 degrees → in order
        output: "Gold display case: in order"
  - globals: { temperature: 21, glass: cracked }
    tests:
      - name: cracked glass → check
        output: "Gold display case: check"
tests:
  - name: uses a chained comparison
    source: '\d+\s*<=\s*temperature\s*<=\s*\d+'
    msg: Write the range as 18 <= temperature <= 24.
```

```exercise
id: py2-arregla-or
type: fix
title: The siren that went off in every room
prompt: |
  Fix the condition so the siren goes off **only** if there's motion in the **gold** room or the **silver** room, the only ones with the new sensor.

  Last night the siren went off in the ceramics room, and the night before it went off with nothing moving. `room` and `motion` come from the sensor; it's tested with four readings.
starter: |
  if motion and room == "gold" or "silver":
      alert = "siren"
  else:
      alert = "silence"
  print(alert)
solution: |
  if motion and (room == "gold" or room == "silver"):
      alert = "siren"
  else:
      alert = "silence"
  print(alert)
hints:
  - "`or \"silver\"` doesn't compare anything: it asks whether the text `\"silver\"` is true, and a non-empty text always is."
  - "Each side of the `or` has to be a complete comparison, and the `or` goes in parentheses so the `and` looks at both."
globals:
  room: ceramics
  motion: true
scenarios:
  - tests:
      - name: motion in ceramics → silence
        output: silence
  - globals: { room: gold, motion: true }
    tests:
      - name: motion in gold → siren
        output: siren
  - globals: { room: silver, motion: false }
    tests:
      - name: silver without motion → silence
        output: silence
  - globals: { room: silver, motion: true }
    tests:
      - name: motion in silver → siren
        output: siren
```

```exercise
id: py2-arregla-torniquete
type: fix
title: The turnstile that wasn't broken
prompt: |
  Fix the first condition so the "broken" warning appears **only** when the turnstile sent nothing (`None`), and not when zero people came in.

  The turnstile at the entrance counts the day's visitors and passes the number to Quilla in `visitors`. When it breaks, it sends `None`. On Tuesday it rained all day, nobody came, and Quilla woke Maru at midnight to tell her the turnstile was broken.
starter: |
  if not visitors:
      print("Turnstile broken: tell Maru")
  elif visitors > 300:
      print(f"{visitors} visitors: full day")
  else:
      print(f"{visitors} visitors")
solution: |
  if visitors is None:
      print("Turnstile broken: tell Maru")
  elif visitors > 300:
      print(f"{visitors} visitors: full day")
  else:
      print(f"{visitors} visitors")
hints:
  - "`not visitors` is `True` with `None`, but also with `0`."
  - "To ask about `None` and only `None`, you use `is None`."
globals:
  visitors: 0
scenarios:
  - tests:
      - name: zero visitors is not a fault
        output: 0 visitors
        msg: With 0 visitors the turnstile works; nobody came, that's all.
  - globals: { visitors: null }
    tests:
      - name: None → broken
        output: "Turnstile broken: tell Maru"
  - globals: { visitors: 412 }
    tests:
      - name: 412 → full day
        output: "412 visitors: full day"
  - globals: { visitors: 120 }
    tests:
      - name: 120 visitors
        output: 120 visitors
tests:
  - name: asks with is None
    source: '\bis\s+None\b'
    msg: Compare with None using is None.
```

```exercise
id: py2-escribe-ronda
type: write
title: Before going on with the round
prompt: |
  Work out two of Quilla's decisions in front of a door: `action` in **a single line** with `… if … else …`, and `notice` with `if`/`elif`/`else`.

  - `action` is `"close"` if `door` is `"open"`, and `"move on"` if not.
  - `notice` depends on the `battery`: below 15 is `"charge now"`; from 15 to 39 is `"half round"`; from 40 up, `"full round"`.

  At the end, print `print(action, notice, sep=" · ")`. `door` and `battery` change on every test.
visual:
  figure:
    title: The two decisions
    panes:
      - label: action
        table:
          head: ["door", "action"]
          rows: [["\"open\"", "\"close\""], ["\"closed\"", "\"move on\""]]
      - label: notice
        table:
          head: ["battery", "notice"]
          rows: [["0 to 14", "\"charge now\""], ["15 to 39", "\"half round\""], ["40 to 100", "\"full round\""]]
starter: |
  # door and battery already exist
  action = ""
  notice = ""
  print(action, notice, sep=" · ")
solution: |
  action = "close" if door == "open" else "move on"
  if battery < 15:
      notice = "charge now"
  elif battery < 40:
      notice = "half round"
  else:
      notice = "full round"
  print(action, notice, sep=" · ")
hints:
  - "`action = \"close\" if door == \"open\" else \"move on\"`"
  - In the `elif` you already know the battery isn't below 15, because otherwise it would have entered the first block.
globals:
  door: open
  battery: 80
scenarios:
  - tests:
      - name: open and 80 battery
        output: close · full round
  - globals: { door: closed, battery: 15 }
    tests:
      - name: closed and 15 battery
        output: move on · half round
  - globals: { door: open, battery: 14 }
    tests:
      - name: open and 14 battery
        output: close · charge now
  - globals: { door: closed, battery: 39 }
    tests:
      - name: closed and 39 battery
        output: move on · half round
  - globals: { door: closed, battery: 40 }
    tests:
      - name: closed and 40 battery
        output: move on · full round
tests:
  - name: action in a single line with if and else
    source: '^action\s*=.+\bif\b.+\belse\b'
    msg: 'Write action = "…" if … else "…" in a single line.'
```

## The case

```exercise
id: py2-caso-turno
type: case
title: The shift that doesn't add up
prompt: |
  **Apply the protocol to each guard's reading, work out the level it called for and compare it with the one they wrote down.** The one that doesn't match silenced an alarm that should have gone off.

  Before retiring, Don Alipio split the round among four trainee guards. The next morning a portrait huaco was missing from the storeroom, and in the shift log nobody had let the siren sound. The director handed Maru the log and the protocol stuck up in the guardhouse.

  Each block of the code is one guard's reading. Under each one, work out `level` with `if`/`elif`/`else` (`authorized` is `None` when nobody authorised was in the room) and print a line starting with their name, for example `print("Fermín:", level)`; the board will tell you whether it matches.
visual:
  board:
    for: py2-caso-turno
    task: "Work out each reading's level with the protocol and compare it with the one each guard wrote down."
    cards:
      - name: Fermín
        kind: person
        role: Gold and silver room
        rows: [["Time", "21:00"], ["Motion", "yes"], ["Authorised", "Gladys (cleaning)"], ["Door", "closed"], ["Wrote down", "level 1, silenced"]]
        clue: { find: "Fermín", says: 1, saysLabel: Wrote down }
      - name: Yesenia
        kind: person
        role: Textile room
        rows: [["Time", "03:00"], ["Motion", "no"], ["Authorised", "nobody"], ["Door", "open"], ["Wrote down", "level 1, silenced"]]
        clue: { find: "Yesenia", says: 1, saysLabel: Wrote down }
      - name: Rolando
        kind: person
        role: Huaco storeroom
        culprit: true
        rows: [["Time", "22:00"], ["Motion", "yes"], ["Authorised", "Lucho (cleaning)"], ["Door", "closed"], ["Wrote down", "level 1, silenced"]]
        clue: { find: "Rolando", says: 1, saysLabel: Wrote down }
      - name: Pilar
        kind: person
        role: Ceramics room
        rows: [["Time", "04:00"], ["Motion", "yes"], ["Authorised", "nobody"], ["Door", "open"], ["Wrote down", "level 3, siren went off"]]
        clue: { find: "Pilar", says: 3, saysLabel: Wrote down }
      - name: Night protocol
        kind: note
        role: Stuck up in the guardhouse
        rows: [["No motion", "level 0 (door closed) or 1 (open)"], ["Motion, nobody authorised", "level 3"], ["Motion, authorised, 20:00 to 21:59", "level 1 (it's the cleaners)"], ["Motion, authorised, any other time", "level 2"], ["Level 2 or more", "the siren has to go off"]]
starter: |
  # Fermín, gold and silver room
  hour = 21
  motion = True
  authorized = "Gladys (cleaning)"
  door = "closed"
  # TODO: work out level with if/elif/else and print print("Fermín:", level)

  # Yesenia, textile room
  hour = 3
  motion = False
  authorized = None
  door = "open"
  # TODO: the same for Yesenia

  # Rolando, huaco storeroom
  hour = 22
  motion = True
  authorized = "Lucho (cleaning)"
  door = "closed"
  # TODO: the same for Rolando

  # Pilar, ceramics room
  hour = 4
  motion = True
  authorized = None
  door = "open"
  # TODO: the same for Pilar
solution: |
  hour = 21
  motion = True
  authorized = "Gladys (cleaning)"
  door = "closed"
  if not motion:
      level = 1 if door == "open" else 0
  elif authorized is None:
      level = 3
  elif 20 <= hour < 22:
      level = 1
  else:
      level = 2
  print("Fermín:", level)

  hour = 3
  motion = False
  authorized = None
  door = "open"
  if not motion:
      level = 1 if door == "open" else 0
  elif authorized is None:
      level = 3
  elif 20 <= hour < 22:
      level = 1
  else:
      level = 2
  print("Yesenia:", level)

  hour = 22
  motion = True
  authorized = "Lucho (cleaning)"
  door = "closed"
  if not motion:
      level = 1 if door == "open" else 0
  elif authorized is None:
      level = 3
  elif 20 <= hour < 22:
      level = 1
  else:
      level = 2
  print("Rolando:", level)

  hour = 4
  motion = True
  authorized = None
  door = "open"
  if not motion:
      level = 1 if door == "open" else 0
  elif authorized is None:
      level = 3
  elif 20 <= hour < 22:
      level = 1
  else:
      level = 2
  print("Pilar:", level)
answer: Rolando
answerLabel: Which guard silenced an alarm that should have gone off?
reveal: |
  Rolando. At 22:00 the cleaning was already over: the schedule is `20 <= hour < 22`, and 22 falls outside it. Motion with someone authorised outside that schedule is level 2, and the siren had to go off. Rolando wrote down level 1 ("it was Lucho, the cleaner") and silenced it. Fermín, Yesenia and Pilar match: 1, 1 and 3.
hints:
  - "Write the chain once, for Fermín, starting with the no-motion case: `if not motion:` and inside it `level = 1 if door == \"open\" else 0`. Then copy it under each block."
  - "The cleaning schedule is `20 <= hour < 22`: 22 no longer counts."
```

## The judge

Read the input with `input()` and convert it with `int()`, as in session 1; answer with `print`.

```exercise
id: py2-juez-tarifa
type: judge
title: The Larco's fares
prompt: |
  **Print how much a person pays for their ticket to the Museo Larco, given their age, the day and whether they have a university student card.**

  Quilla runs the ticket office while Maru has lunch. The fares, stuck on the window:

  - Under **5** years old: free (**0**).
  - From **5 to 17**: **15** soles, and **free** on Wednesdays (day 3), which are school days.
  - **65** and over: **18** soles, any day.
  - From **18 to 25** **with a** university student **card**: **20** soles, any day.
  - Everyone else pays **35** soles Monday to Friday, and **40** on Saturday and Sunday (days 6 and 7).

  **Input:** three lines: the age `E`; the day `D` (1 is Monday, 7 is Sunday); and `C`, which is `1` if they have a university student card and `0` if not.

  **Output:** one line with the price in soles.

  **Constraints:** 0 ≤ E ≤ 100 · 1 ≤ D ≤ 7 · C is 0 or 1.
starter: |
  age = int(input())
  day = int(input())
  student_card = int(input())
  print(35)
solution: |
  age = int(input())
  day = int(input())
  student_card = int(input())
  if age < 5:
      price = 0
  elif age <= 17:
      price = 0 if day == 3 else 15
  elif age >= 65:
      price = 18
  elif age <= 25 and student_card == 1:
      price = 20
  elif day >= 6:
      price = 40
  else:
      price = 35
  print(price)
hints:
  - Order the chain from most specific to most general and check the edges (5, 17, 18, 25, 65). In each `elif` you already know the conditions above failed.
  - "`input()` returns text, and the text `\"0\"` is true. Convert the card with `int()` before asking about it."
visual:
  - figure:
      title: Example 1, at the window
      input: { label: Input, text: "22\n6\n1" }
      arrow: 22 years old, Saturday, with a card
      output: { label: Output, value: "20" }
      steps:
        - "Not under 18, and not 65 or over."
        - "Between 18 and 25 with a card: pays 20, even on a Saturday."
  - figure:
      title: The fares
      table:
        head: ["Age", "Monday to Friday", "Saturday and Sunday"]
        rows: [["0 to 4", "0", "0"], ["5 to 17", "15 (Wednesday: 0)", "15"], ["18 to 25 with card", "20", "20"], ["18 to 64, everyone else", "35", "40"], ["65 or over", "18", "18"]]
samples:
  - input: "22\n6\n1"
    output: "20"
    note: With a card, the university student pays 20 on Saturday too.
  - input: "22\n6\n0"
    output: "40"
    note: Without a card it's just another adult, and it's Saturday.
  - input: "10\n3\n0"
    output: "0"
    note: Wednesdays are for schools.
edge:
  - input: "4\n1\n0"
    tag: at the 5-year edge
  - input: "5\n1\n0"
    tag: at the 5-year edge
  - input: "5\n3\n0"
    tag: with a 5-year-old on a Wednesday
  - input: "17\n7\n1"
    tag: at the 18-year edge, with a card
  - input: "18\n7\n1"
    tag: at the 18-year edge, with a card
  - input: "25\n6\n1"
    tag: at the 25-year edge, with a card
  - input: "26\n6\n1"
    tag: at the 25-year edge, with a card
  - input: "26\n2\n1"
    tag: with a card but over 25
  - input: "30\n3\n0"
    tag: with an adult on a Wednesday
  - input: "64\n5\n0"
    tag: at the 65-year edge
  - input: "65\n6\n1"
    tag: at the 65-year edge
  - input: "0\n7\n0"
    tag: with a newborn baby
  - input: "100\n7\n0"
    tag: with the maximum age
  - input: "20\n2\n0"
    tag: with a young person without a card
random:
  count: 45
  seed: 22
  tag: ""
  generate: |
    if rng.int(0, 2) == 0:
        age = rng.pick([4, 5, 17, 18, 25, 26, 64, 65])
    else:
        age = rng.int(0, 100)
    return f"{age}\n{rng.int(1, 7)}\n{rng.int(0, 1)}"
wrong:
  - |
    age = int(input())
    day = int(input())
    student_card = int(input())
    if age <= 5:
        price = 0
    elif age <= 17:
        price = 0 if day == 3 else 15
    elif age >= 65:
        price = 18
    elif age <= 25 and student_card == 1:
        price = 20
    elif day >= 6:
        price = 40
    else:
        price = 35
    print(price)
  - |
    age = int(input())
    day = int(input())
    student_card = int(input())
    if age < 5:
        price = 0
    elif age <= 17:
        price = 0 if day == 3 else 15
    elif age >= 65:
        price = 18
    elif day >= 6:
        price = 40
    elif age <= 25 and student_card == 1:
        price = 20
    else:
        price = 35
    print(price)
  - |
    age = int(input())
    day = int(input())
    student_card = input()
    if age < 5:
        price = 0
    elif age <= 17:
        price = 0 if day == 3 else 15
    elif age >= 65:
        price = 18
    elif age <= 25 and student_card:
        price = 20
    elif day >= 6:
        price = 40
    else:
        price = 35
    print(price)
```

## Final mission

```exercise
id: py2-mision-ronda
type: mission
title: The Larco round
prompt: |
  **In each of the three rooms, close the door if it's open and sound the siren if there's motion; at the end, deliver the report at the guardhouse (D).**

  The round is U-shaped: Quilla walks the upper corridor east, goes down through the garden and comes back along the lower corridor to the watchman's guardhouse. The **battery is just enough: 24 squares**, not one more. Standing in the corridor, with a room's door right below:

  - `robot.sensor()` returns a **dictionary**, for example `{"door": "open", "motion": True}`. Store it in a variable and read each fact with square brackets: `reading["door"]`, `reading["motion"]`.
  - `robot.close_door()` closes it and `robot.alarm()` sounds the siren in that room.

  Count the alarms in `alarms` (`alarms = alarms + 1`) and build `report` in **one line** with `… if … else …`: `"All quiet"` if none went off, or `"Alarms: N"` if N went off. Deliver it with `robot.deliver(report)`. It's tested on four different nights.

  Once it passes, together with the judge, session 3 unlocks.
visual:
  figure:
    title: What to do at each door
    table:
      head: ["The sensor says", "Quilla does"]
      rows: [["\"door\": \"open\"", "`robot.close_door()`"], ["\"motion\": True", "`robot.alarm()` and adds 1 to `alarms`"], ["both", "both"], ["closed and no motion", "nothing, moves on"]]
starter: |
  alarms = 0

  # Room 1: textiles
  robot.forward(2)
  reading = robot.sensor()
  print("Room 1:", reading)

  # Room 2: ceramics

  # Room 3: storeroom, in the lower corridor

  # The report, at the guardhouse
solution: |
  alarms = 0

  robot.forward(2)
  reading = robot.sensor()
  if reading["door"] == "open":
      robot.close_door()
  if reading["motion"]:
      robot.alarm()
      alarms = alarms + 1

  robot.forward(5)
  reading = robot.sensor()
  if reading["door"] == "open":
      robot.close_door()
  if reading["motion"]:
      robot.alarm()
      alarms = alarms + 1

  robot.forward(3)
  robot.turn_right()
  robot.forward(4)
  robot.turn_right()
  robot.forward(6)
  reading = robot.sensor()
  if reading["door"] == "open":
      robot.close_door()
  if reading["motion"]:
      robot.alarm()
      alarms = alarms + 1

  robot.forward(4)
  report = "All quiet" if alarms == 0 else f"Alarms: {alarms}"
  robot.deliver(report)
hints:
  - Closing and sounding the siren are two independent decisions, so they're two separate `if`s, not an `if`/`else`. You'll have to repeat the block three times; in session 3 that goes away.
  - "The path: 2 east, 5 east, 3 east; turn right and go down 4; turn right again and go 6 to the third door, and 4 more to the guardhouse."
world:
  theme: museo
  level: 2
  dir: E
  battery: 24
  api: [move, museum, deliver]
  map: |
    #############
    #R..........#
    ###P####O##.#
    ###.####m##.#
    ###########.#
    #D..........#
    #####P#######
    #####.#######
    #############
scenarios:
  - tests:
      - name: 'report "Alarms: 1"'
        state: 'w.delivered == ["Alarms: 1"]'
        msg: 'One alarm went off tonight: the report must be "Alarms: 1".'
  - map: |
      #############
      #R..........#
      ###O####P##.#
      ###m####.##.#
      ###########.#
      #D..........#
      #####O#######
      #####m#######
      #############
    tests:
      - name: 'report "Alarms: 2"'
        state: 'w.delivered == ["Alarms: 2"]'
        msg: 'Two alarms went off tonight: the report must be "Alarms: 2".'
  - map: |
      #############
      #R..........#
      ###P####P##.#
      ###.####.##.#
      ###########.#
      #D..........#
      #####P#######
      #####.#######
      #############
    tests:
      - name: report "All quiet"
        state: 'w.delivered == ["All quiet"]'
        msg: No alarm went off tonight; the report must be "All quiet".
  - map: |
      #############
      #R..........#
      ###P####O##.#
      ###m####m##.#
      ###########.#
      #D..........#
      #####O#######
      #####m#######
      #############
    tests:
      - name: 'report "Alarms: 3"'
        state: 'w.delivered == ["Alarms: 3"]'
        msg: 'Three alarms went off tonight: the report must be "Alarms: 3".'
tests:
  - name: every door ends up closed
    state: w.open_doors == 0
    msg: At least one door was left open.
  - name: the siren sounds only where there was motion
    state: w.alarms == w.motion_doors
    msg: The siren doesn't match the rooms where there was motion.
  - name: Quilla doesn't crash
    state: not w.crashed
  - name: Quilla ends at the guardhouse
    state: w.at_goal
    msg: Quilla didn't reach the watchman's guardhouse (D).
  - name: decides with if
    source: '\bif\b'
    msg: This mission is solved by deciding with if.
  - name: the report is built in one line with if and else
    source: '^report\s*=.+\bif\b.+\belse\b'
    msg: 'Write report = "All quiet" if … else f"Alarms: {alarms}" in a single line.'
```

## Expert challenge

```exercise
id: py2-reto-mediana
type: challenge
title: The lying thermometer
visual:
  figure:
    title: Three thermometers, one broken
    input: { label: "a, b, c", cells: [21, 35, 22], index: false }
    arrow: the middle one
    output: { label: Output, text: "Room temperature: 22" }
    steps:
      - "Sorted they'd be 21, 22, 35: the middle one is 22."
      - "The 35 one went haywire, and the median ignores it."
prompt: |
  **Print the median of three readings, `Room temperature: N`, without sorting.** For people who already code. The gold room has three thermometers, `a`, `b` and `c`, and sometimes one breaks and shows anything at all. Maru decided to always trust **the middle one**: the one that's neither the largest nor the smallest (if there are ties, any of the repeated ones will do).

  Solve it with comparisons only: **no `sorted`, `sort`, `min` or `max`**. Chained comparisons save you half the work.
starter: |
  # a, b and c already exist
  print(a, b, c)
solution: |
  if a <= b <= c or c <= b <= a:
      median = b
  elif b <= a <= c or c <= a <= b:
      median = a
  else:
      median = c
  print(f"Room temperature: {median}")
hints:
  - "`b` is the median if it's between the other two, in either direction: `a <= b <= c or c <= b <= a`."
  - If it isn't `b`, try the same with `a`; if not that either, only `c` is left.
globals:
  a: 21
  b: 35
  c: 22
scenarios:
  - tests:
      - name: 21, 35, 22
        output: "Room temperature: 22"
  - globals: { a: 23, b: 20, c: 18 }
    tests:
      - name: 23, 20, 18 (largest to smallest)
        output: "Room temperature: 20"
  - globals: { a: 18, b: 25, c: 21 }
    tests:
      - name: 18, 25, 21
        output: "Room temperature: 21"
  - globals: { a: 19, b: 19, c: 40 }
    tests:
      - name: 19, 19, 40 (a tie)
        output: "Room temperature: 19"
  - globals: { a: 30, b: 21, c: 24 }
    tests:
      - name: 30, 21, 24
        output: "Room temperature: 24"
  - globals: { a: 22, b: 22, c: 22 }
    tests:
      - name: all three equal
        output: "Room temperature: 22"
  - globals: { a: -5, b: 20, c: 21 }
    tests:
      - name: -5, 20, 21 (one frozen)
        output: "Room temperature: 20"
tests:
  - name: without sorting
    sourceNot: '\b(sorted|sort|min|max)\b'
    msg: Solve it with comparisons, without sorted, sort, min or max.
```
