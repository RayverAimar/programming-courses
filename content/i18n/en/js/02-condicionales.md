# Session 2 — Conditionals

## The job

The Sarmiento House Museum, in Pueblo Libre, keeps Paracas mantles and a night watchman who falls asleep at eleven. The director hired Loop so Chasqui can do the night round. We put a siren on its head and a sensor that reads each room: whether the door was left open and whether something is moving inside.

The problem: every night is different. A robot that always does the same thing closes doors that were already shut and sounds the alarm on the watchman's cat. Chasqui has to **decide**.

```scene
theme: museo
level: 2
dir: E
caption: The night round. In the first room the door was left open and nobody's there; in the second, something is moving.
map: |
  ########
  #R.....#
  ###O##P#
  ###.##m#
  ########
program: |
  robot.forward(2);
  robot.closeDoor();
  robot.forward(3);
  robot.alarm();
```

## The minimum

`if` runs a block only when a condition is true. `else if` tries another one if the first failed, and `else` catches everything else. They're checked top to bottom and **only the first block that matches runs**.

```js run
const battery = 18;
const motion = true;
if (motion && battery > 10) {
  console.log("Going to check");
} else if (motion) {
  console.log("Calling for backup");
} else {
  console.log("Carrying on with the round");
}
```

Watch which path the program takes with a reading at eleven at night: only the block that runs lights up, and the other two are skipped.

```anim
title: The first block that matches, and no other
code: |
  const hour = 23;
  const motion = true;
  if (motion && hour < 18) {
    console.log("A visitor");
  } else if (motion) {
    console.log("Intruder!");
  } else {
    console.log("Calm");
  }
notes:
  1: It's eleven at night.
  5: Line 3 didn't match (there's motion, but it isn't daytime), so its block was skipped. This one matches.
  6: This block runs and the chain ends; the else isn't even looked at.
```

To compare: `===` (equal), `!==` (different), `<`, `>`, `<=`, `>=`. To combine: `&&` (and), `||` (or), `!` (not).

What's particular to JavaScript:

- **Always use `===`**. The old `==` converts types before comparing, so `"0" == 0` is `true`.
- **Truthy and falsy.** An `if` accepts any value, not just booleans. The *falsy* ones are `false`, `0`, `""`, `null`, `undefined` and `NaN`; everything else is *truthy*, even the string `"0"`.
- **`null` and `undefined`.** `undefined` means "never had a value" (a property that doesn't exist, a variable never assigned). `null` means "empty on purpose": someone put it there.
- **`??` and `?.`** for incomplete data. `a ?? 18` gives `18` only if `a` is `null` or `undefined`. `camera?.motion` doesn't crash if `camera` doesn't exist.

> **Common trap:** `if (x = 5)` doesn't compare, it *assigns* 5 to `x`, and since 5 is truthy the block always runs. Comparing is `===`.

<!-- legacy: strict-equality -->

<!-- legacy: nullish -->

<!-- legacy: optional-chaining -->

<!-- mdn: if-else strict-equality truthy null-undefined nullish optional-chaining -->

## Practice

```exercise
id: js2-predice-temperatura
type: predict
title: The thermometer in the mantle room
prompt: |
  The room reads 31 degrees. What does it print?
code: |
  const temperature = 31;
  if (temperature > 40) {
    console.log("Fire!");
  } else if (temperature > 30) {
    console.log("Check the air conditioning");
  } else if (temperature > 25) {
    console.log("A bit warm");
  } else {
    console.log("All normal");
  }
options:
  - Check the air conditioning
  - "Check the air conditioning\nA bit warm"
  - A bit warm
  - All normal
answer: Check the air conditioning
explain: |
  31 is also greater than 25, but the chain stops at the first block that matches.
```

```exercise
id: js2-predice-falsy
type: predict
title: The code "0"
prompt: |
  The vault keypad sends whatever was typed as text. Someone typed a zero. What does it print?
code: |
  const code = "0";
  if (code) {
    console.log("there is a code");
  }
  if (code === 0) {
    console.log("it's the number zero");
  }
  console.log(code == 0);
options:
  - "there is a code\ntrue"
  - "it's the number zero\ntrue"
  - "there is a code\nit's the number zero\ntrue"
  - "false"
answer: "there is a code\ntrue"
explain: |
  `"0"` is a one-character string, so it's truthy. It isn't `=== 0` because it's a string, not a number. But `==` converts it to a number before comparing and says `true`: that's why we don't use it.
```

```exercise
id: js2-completa-puerta
type: complete
title: Close it or move on?
prompt: |
  Fill the gaps so `action` is `"close"` when the door is open, and `"move on"` otherwise.

  `reading` comes from the sensor, for example `{ door: "open", motion: false }`. It's tested with two different readings.
visual:
  figure:
    title: What the sensor reads and what to decide
    table:
      head: ["reading.door", "action"]
      rows: [["\"open\"", "\"close\""], ["\"closed\"", "\"move on\""]]
starter: |
  let action;
  if (reading.door ___ "open") {
    action = "close";
  } ___ {
    action = "move on";
  }
  console.log(action);
solution: |
  let action;
  if (reading.door === "open") {
    action = "close";
  } else {
    action = "move on";
  }
  console.log(action);
hints:
  - The first gap is the strict equality operator.
  - The second is the word that catches "everything else".
globals:
  reading: { door: open, motion: false }
scenarios:
  - tests:
      - name: with the door open, close
        expect: 'action === "close"'
  - globals: { reading: { door: closed, motion: true } }
    tests:
      - name: with the door closed, move on
        expect: 'action === "move on"'
tests:
  - name: uses ===
    source: '==='
```

```exercise
id: js2-arregla-asignacion
type: fix
title: The alarm that always went off
prompt: |
  The watchman complains: the alarm goes off every night, motion or not. Find the bug.
starter: |
  let alert = "none";
  if (reading.motion = true) {
    alert = "intruder";
  }
  console.log(alert);
solution: |
  let alert = "none";
  if (reading.motion === true) {
    alert = "intruder";
  }
  console.log(alert);
hints:
  - Read the condition out loud. Does it compare or assign?
globals:
  reading: { door: closed, motion: false }
scenarios:
  - tests:
      - name: no motion, "none"
        output: none
  - globals: { reading: { door: closed, motion: true } }
    tests:
      - name: with motion, "intruder"
        output: intruder
```

```exercise
id: js2-escribe-nivel
type: write
title: Intruder or visitor?
prompt: |
  Store in `alert` whether the motion is a visitor, an intruder, or there's nothing at all.

  The museum is open from **8 to 18**: during the day motion means visitors, at night (from 18 on and before 8) it's an intruder. `reading` has `motion` (a boolean) and `hour` (0 to 23). Store in `alert`:
  - `"calm"` if there's no motion,
  - `"visitor"` if there's motion and the museum is open,
  - `"intruder"` if there's motion and it's closed.
visual:
  figure:
    title: A day at the museum
    table:
      head: ["", "0 to 7", "8 to 17", "18 to 23"]
      rows: [["with motion", "intruder", "visitor", "intruder"], ["no motion", "calm", "calm", "calm"]]
starter: |
  let alert;

  console.log(alert);
solution: |
  const closed = reading.hour >= 18 || reading.hour < 8;
  let alert;
  if (!reading.motion) {
    alert = "calm";
  } else if (closed) {
    alert = "intruder";
  } else {
    alert = "visitor";
  }
  console.log(alert);
hints:
  - "First store whether the museum is closed: `const closed = reading.hour >= 18 || reading.hour < 8;`"
  - Start with the no-motion case; then the other two already know there is motion.
globals:
  reading: { motion: true, hour: 23 }
scenarios:
  - tests:
      - name: 23:00 with motion → intruder
        expect: 'alert === "intruder"'
  - globals: { reading: { motion: true, hour: 10 } }
    tests:
      - name: 10:00 with motion → visitor
        expect: 'alert === "visitor"'
  - globals: { reading: { motion: false, hour: 3 } }
    tests:
      - name: 03:00 without motion → calm
        expect: 'alert === "calm"'
  - globals: { reading: { motion: true, hour: 18 } }
    tests:
      - name: 18:00 sharp with motion → intruder
        expect: 'alert === "intruder"'
  - globals: { reading: { motion: true, hour: 8 } }
    tests:
      - name: 08:00 sharp with motion → visitor
        expect: 'alert === "visitor"'
```

```exercise
id: js2-escribe-incompleta
type: write
title: The half reading
prompt: |
  Fix both lines so they work even with missing data: `temp` uses 18 only if the temperature didn't arrive, and `hasMotion` is `false` when there's no camera.

  The old sensor in room 3 sometimes doesn't send the temperature, and the camera is sometimes off (`camera: null`). But when the room is at **0 degrees**, that's real data, not missing data.

  - `temp`: the temperature, or **18** if it didn't arrive.
  - `hasMotion`: `camera.motion`, or `false` if there's no camera.
visual:
  figure:
    title: One example, worked out
    input: { label: reading, cards: [{ title: "Room 3", rows: [["temperature", "0"], ["camera", "null"]] }] }
    arrow: "?? and ?."
    output: { label: Should give, text: "temp = 0\nhasMotion = false" }
starter: |
  const temp = reading.temperature || 18;
  const hasMotion = reading.camera.motion;
  console.log(temp, hasMotion);
solution: |
  const temp = reading.temperature ?? 18;
  const hasMotion = reading.camera?.motion ?? false;
  console.log(temp, hasMotion);
hints:
  - "`||` replaces 0 too. Which operator only replaces null and undefined?"
  - "`reading.camera?.motion` gives undefined instead of crashing when there's no camera."
globals:
  reading: { temperature: 0, camera: { motion: true } }
scenarios:
  - tests:
      - name: at 0 degrees, temp is 0
        expect: temp === 0
        msg: 0 is a real temperature. || swapped it for 18.
      - name: the camera sees motion
        expect: hasMotion === true
  - globals: { reading: { camera: null } }
    tests:
      - name: no temperature, temp is 18
        expect: temp === 18
      - name: no camera, hasMotion is false
        expect: hasMotion === false
  - globals: { reading: { temperature: 24, camera: { motion: false } } }
    tests:
      - name: at 24 degrees, temp is 24
        expect: temp === 24
      - name: the camera sees nothing
        expect: hasMotion === false
```

## The case

```exercise
id: js2-caso-vitrina
type: case
title: The display case code
prompt: |
  **Find which of the eight codes passes the watchman's three clues.**

  At six in the morning the case holding the big mantle was locked with a new code nobody remembers setting. The watchman left three clues on a scrap of paper, and the director wrote down the codes they usually use:

  **318, 427, 294, 568, 746, 836, 952, 583**

  Clues: the code is **even**; the **sum of its three digits is greater than 15**; and the **hundreds digit is smaller than the units digit**.

  Write the condition with the three clues and try each candidate by changing `candidate`. (In session 3 you'll do this without changing the number by hand.)
visual:
  - board:
      cards:
        - name: Don Eusebio
          kind: person
          role: The watchman, and his scrap of paper
          rows: [["Clue 1", "it's even"], ["Clue 2", "its 3 digits add up to more than 15"], ["Clue 3", "hundreds < units"]]
        - name: The director
          kind: person
          role: The usual codes
          rows: [["Candidates", "318 · 427 · 294 · 568"], ["", "746 · 836 · 952 · 583"]]
  - figure:
      title: One candidate checked by hand
      input: { label: "318, digit by digit", cells: [3, 1, 8], index: false }
      arrow: the three clues
      output: { label: Result, text: "even: yes\n3 + 1 + 8 = 12 > 15: no\n3 < 8: yes\n→ doesn't open" }
starter: |
  const candidate = 318;

  const hundreds = Math.floor(candidate / 100);
  const tens = Math.floor(candidate / 10) % 10;
  const units = candidate % 10;
  console.log(hundreds, tens, units);

  // TODO: store each clue in a constant (true or false),
  // join them in an if and show whether the candidate opens the case:
  // if (...) { console.log(candidate, "opens the case"); }
solution: |
  const candidate = 568;

  const hundreds = Math.floor(candidate / 100);
  const tens = Math.floor(candidate / 10) % 10;
  const units = candidate % 10;

  const isEven = candidate % 2 === 0;
  const highSum = hundreds + tens + units > 15;
  const rising = hundreds < units;
  if (isEven && highSum && rising) {
    console.log(candidate, "opens the case");
  } else {
    console.log(candidate, "no");
  }
answer: "568"
answerLabel: What's the code?
reveal: |
  568: it's even, 5 + 6 + 8 = 19, and 5 < 8. 746 and 836 pass the first two clues but not the third; 294 adds up to exactly 15, which isn't *greater* than 15.
hints:
  - "`candidate % 2 === 0` tells you whether it's even."
  - Store each clue in a named constant (`isEven`, `highSum`…) and join them with &&.
```

## The judge

Read with `readNumber()` as in session 1 and answer with `console.log`.

```exercise
id: js2-juez-entrada
type: judge
title: The museum ticket office
prompt: |
  **Print how much a person pays for a ticket, given their age and the day.**

  The house-museum prices tickets by age: under-3s go in free, ages 3 to 11 pay 10 soles, 65 and over pay 8, and everyone else pays 20. On **Sundays** (day 7) that everyone else pays half, 10 soles. Chasqui runs the ticket office.

  **Input:** two lines: the age `A` and the day of the week `D` (1 is Monday, 7 is Sunday).

  **Output:** one line with the price in soles.

  **Constraints:** 0 ≤ A ≤ 120 · 1 ≤ D ≤ 7.
starter: |
  const age = readNumber();
  const day = readNumber();
  console.log(20);
solution: |
  const age = readNumber();
  const day = readNumber();
  let price;
  if (age < 3) {
    price = 0;
  } else if (age <= 11) {
    price = 10;
  } else if (age >= 65) {
    price = 8;
  } else if (day === 7) {
    price = 10;
  } else {
    price = 20;
  }
  console.log(price);
hints:
  - Order the conditions from the most specific to the most general, and look hard at the edges (3, 11, 65).
  - The Sunday discount is only for people who would pay 20.
visual:
  - figure:
      title: Sample 1, at the ticket office
      input: { label: Input, text: "30\n2" }
      arrow: aged 30, on a Tuesday
      output: { label: Output, value: "20" }
  - figure:
      title: The prices
      table:
        head: ["Age", "Monday to Saturday", "Sunday (7)"]
        rows: [["0 to 2", "0", "0"], ["3 to 11", "10", "10"], ["12 to 64", "20", "**10**"], ["65 and over", "8", "8"]]
samples:
  - input: "30\n2"
    output: "20"
  - input: "30\n7"
    output: "10"
    note: It's Sunday and an adult, so half price.
  - input: "70\n7"
    output: "8"
    note: From 65 on the price is 8 every day, Sundays included.
edge:
  - input: "2\n1"
    tag: at the edge of age 3
  - input: "3\n4"
    tag: at the edge of age 3
  - input: "11\n7"
    tag: at the edge of age 12
  - input: "12\n7"
    tag: at the edge of age 12
  - input: "64\n3"
    tag: at the edge of age 65
  - input: "65\n1"
    tag: at the edge of age 65
  - input: "0\n7"
    tag: with a newborn baby
  - input: "120\n5"
    tag: with the maximum age
random:
  count: 50
  seed: 22
  generate: |
    return `${rng.int(0, 120)}\n${rng.int(1, 7)}`;
wrong:
  - |
    const age = readNumber();
    const day = readNumber();
    let price = 20;
    if (age <= 3) price = 0;
    else if (age <= 11) price = 10;
    else if (age >= 65) price = 8;
    else if (day === 7) price = 10;
    console.log(price);
  - |
    const age = readNumber();
    const day = readNumber();
    let price = 20;
    if (day === 7) price = 10;
    else if (age < 3) price = 0;
    else if (age <= 11) price = 10;
    else if (age >= 65) price = 8;
    console.log(price);
```

## Final mission

```exercise
id: js2-mision-ronda
type: mission
title: The night round
prompt: |
  **At each of the three doors, close it if it's open and sound the alarm if there's motion.**

  Chasqui walks the corridor of the House Museum, which has **three rooms**. It reaches the door of room 1 by moving forward 2 tiles, and each door is 3 tiles past the previous one. Standing on top of a door:

  - `robot.sensor()` returns `{ door: "open" | "closed", motion: true | false }`
  - `robot.closeDoor()` closes it
  - `robot.alarm()` sounds the siren in that room

  At the end **every door must be closed** and the alarm must have sounded **only** in rooms where there was motion. It's tested on four different nights.
visual:
  figure:
    title: What to do at each door
    table:
      head: ["The sensor says", "Chasqui does"]
      rows: [["door: \"open\"", "`robot.closeDoor()`"], ["motion: true", "`robot.alarm()`"], ["both", "both actions"], ["door closed, no motion", "nothing, moves on"]]
starter: |
  // Room 1
  robot.forward(2);
  const room1 = robot.sensor();
  console.log("Room 1:", room1);

  // Room 2

  // Room 3
solution: |
  robot.forward(2);
  const room1 = robot.sensor();
  if (room1.door === "open") {
    robot.closeDoor();
  }
  if (room1.motion) {
    robot.alarm();
  }

  robot.forward(3);
  const room2 = robot.sensor();
  if (room2.door === "open") {
    robot.closeDoor();
  }
  if (room2.motion) {
    robot.alarm();
  }

  robot.forward(3);
  const room3 = robot.sensor();
  if (room3.door === "open") {
    robot.closeDoor();
  }
  if (room3.motion) {
    robot.alarm();
  }
hints:
  - There are two independent decisions per room, so that's two separate ifs, not an if/else.
  - You'll end up copying the block three times. Notice what changes and what doesn't: in session 3 that goes away.
world:
  theme: museo
  level: 2
  dir: E
  map: |
    ###########
    #R........#
    ###P##O##P#
    ###.##m##.#
    ###########
scenarios:
  - {}
  - map: |
      ###########
      #R........#
      ###O##P##O#
      ###m##.##.#
      ###########
  - map: |
      ###########
      #R........#
      ###P##P##P#
      ###.##.##.#
      ###########
  - map: |
      ###########
      #R........#
      ###O##O##P#
      ###.##.##m#
      ###########
tests:
  - name: every door ends up closed
    state: w.openDoors === 0
    msg: At least one door was left open.
  - name: the alarm sounds only where there was motion
    state: JSON.stringify(w.alarms) === JSON.stringify(w.motionDoors)
    msg: The alarms don't match the rooms where there was motion.
  - name: Chasqui doesn't crash
    state: '!w.crashed'
  - name: decides with if
    source: '\bif\s*\('
    msg: This mission is solved by deciding with if.
```

## Expert challenge

```exercise
id: js2-reto-bisiesto
type: challenge
title: The museum calendar
visual:
  figure:
    title: The rule, with examples
    table:
      head: ["Year", "÷ 4", "÷ 100", "÷ 400", "Leap?"]
      rows: [["2024", "yes", "no", "no", "yes"], ["1900", "yes", "yes", "no", "no"], ["2000", "yes", "yes", "yes", "yes"]]
prompt: |
  **Store in `isLeap` whether the year is a leap year, in a single expression.** The shift system gets confused by February. Store in `isLeap` whether `year` is a leap year: divisible by 4, except those divisible by 100, which only are if they're also divisible by 400. **A single expression, no if.**
starter: |
  const isLeap = false;
  console.log(year, isLeap);
solution: |
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  console.log(year, isLeap);
hints:
  - Combine with && and ||, and use parentheses so it reads clearly.
globals:
  year: 2024
scenarios:
  - tests:
      - name: "2024: yes"
        expect: isLeap === true
  - globals: { year: 1900 }
    tests:
      - name: "1900: no"
        expect: isLeap === false
  - globals: { year: 2000 }
    tests:
      - name: "2000: yes"
        expect: isLeap === true
  - globals: { year: 2027 }
    tests:
      - name: "2027: no"
        expect: isLeap === false
tests:
  - name: no if
    sourceNot: '\bif\b'
    msg: Solve it with a boolean expression, no if.
```
