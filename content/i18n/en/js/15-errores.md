# Session 15 — Errors and testing

## The job

Arequipa, 15 August, the city's anniversary. The municipality invited Loop to the Plaza de Armas: Chasqui was to cross the square and hand a queso helado to the mayor, in front of two thousand people and the local TV. It moved four tiles, stopped dead and stayed there, motionless in the sun, while the queso helado melted. Loop's screen said: `TypeError: Reduce of empty array with no initial value`.

Nobody got hurt, but the video already has more views than Arequipa's anthem. On Sunday there's a rematch at the Mirador de Yanahuara. Before that, it's time to do what serious teams do after a crash: a **post-mortem**. Find what failed, make the program **report clear errors** instead of freezing, and write **tests** so that bug never comes back.

```scene
theme: barranco
level: 4
dir: E
caption: Arequipa's Plaza de Armas. Chasqui was supposed to reach the mayor (D) and froze halfway.
map: |
  ###########
  #R........#
  #.###.###.#
  #........D#
  ###########
program: |
  robot.forward(4);
  robot.say("TypeError!");
```

## The minimum

An error isn't a tragedy: it's a message. What's serious is a program that falls over without saying anything useful, or carries on as if nothing happened with bad data.

- **`throw new Error("message")`** stops the function on that line and throws the error to whoever called it. Some error types come built in: `TypeError` (a value of the wrong type), `RangeError` (a number out of range), `SyntaxError`…
- **`try { … } catch (error) { … }`** catches the error: if something inside the `try` throws, the program jumps to the `catch` and carries on from there. `error.name` and `error.message` say what happened.
- **`finally { … }`** always runs, error or not: the place to leave the robot in safe mode.
- **Validate the input**: check the data *before* using it and throw a clear error if it's wrong. Better "Invalid command: F0" at the office than a robot frozen in the square.
- **Your own errors**: `class CommandError extends Error { … }` creates a new type; with `error instanceof CommandError` the `catch` knows whether it's an error you expected or a real bug.
- **A test** is code that calls your function with known data and throws an error if the result isn't the expected one. Before handing in, you run them all: they tell you, in one second, what you broke.

```js run
try {
  const reading = JSON.parse("{distance: 40}");
  console.log(reading);
} catch (error) {
  console.log(`${error.name}: couldn't read the sensor`);
} finally {
  console.log("Chasqui in safe mode");
}
```

Watch an error's path: it leaves the `throw`, skips everything left in the `try` and lands in the `catch`. The `finally` runs at the end, no matter what.

```anim
title: An error jumps straight to the catch
code: |
  function stepsOf(command) {
    const steps = Number(command.slice(1));
    if (steps < 1) throw new Error(`Invalid command: "${command}"`);
    return steps;
  }
  try {
    console.log(stepsOf("F3"));
    console.log(stepsOf("F0"));
    console.log("this never prints");
  } catch (error) {
    console.log(error.message);
  } finally {
    console.log("Chasqui in safe mode");
  }
steps:
  - { line: 7, vars: {}, stack: [{ name: stepsOf, args: 'command = "F3"' }], note: "Inside the try, stepsOf is called with F3." }
  - { line: 2, vars: { steps: 3 }, stack: [{ name: stepsOf, args: 'command = "F3"' }] }
  - { line: 4, vars: { steps: 3 }, stack: [{ name: stepsOf, args: 'command = "F3"', ret: "3" }], note: "3 is a valid number of steps: return." }
  - { line: 7, vars: {}, stack: [], out: "3" }
  - { line: 8, vars: {}, stack: [{ name: stepsOf, args: 'command = "F0"' }], note: "Now with F0." }
  - { line: 2, vars: { steps: 0 }, stack: [{ name: stepsOf, args: 'command = "F0"' }], out: "3" }
  - { line: 3, vars: { steps: 0 }, stack: [{ name: stepsOf, args: 'command = "F0"', ret: "💥 Error" }], out: "3", note: "0 steps isn't valid: throw. The function stops here, without reaching the return." }
  - { line: 11, vars: { error: 'Error: Invalid command: "F0"' }, stack: [], out: "3\nInvalid command: \"F0\"", note: "The error jumps straight to the catch. Line 9 never runs." }
  - { line: 13, vars: { error: 'Error: Invalid command: "F0"' }, stack: [], out: "3\nInvalid command: \"F0\"\nChasqui in safe mode", note: "finally always runs, with or without an error." }
```

An error doesn't stay where it's born: it **leaves the call and climbs up**, call by call, until someone catches it. Watch it cross three calls up to the `try` in `main`, and what happens if there is none:

```anim
title: An error crosses several calls until it finds a catch
code: |
  function stepsOf(command) {
    if (command === "F0") throw new Error("Invalid command");
    return 3;
  }
  function serve(order) {
    return stepsOf(order) + 1;
  }
  function main() {
    try {
      serve("F0");
    } catch (error) {
      console.log(error.message);
    }
  }
  main();
steps:
  - { line: 15, vars: {}, stack: [{ name: main, args: '' }], note: "`main` starts. It has a `try` inside: an error thrown further down can be caught here." }
  - { line: 10, vars: {}, stack: [{ name: main, args: '' }, { name: serve, args: 'order = "F0"' }], note: "`main` calls `serve`: two calls stacked up." }
  - { line: 6, vars: {}, stack: [{ name: main, args: '' }, { name: serve, args: 'order = "F0"' }, { name: stepsOf, args: 'command = "F0"' }], note: "`serve` calls `stepsOf`: now there are three. The top one is the one running." }
  - { line: 2, vars: {}, stack: [{ name: main, args: '' }, { name: serve, args: 'order = "F0"' }, { name: stepsOf, args: 'command = "F0"', err: 'throw' }], note: "`stepsOf` does `throw`: its call stops here, never reaching the `return`. It looks for a `catch` in the same function: there is none." }
  - { line: 6, vars: {}, stack: [{ name: main, args: '' }, { name: serve, args: 'order = "F0"', err: 'keeps rising' }], note: "With no `catch`, the error **leaves the call** and goes up to whoever made it: `serve`. There's no `catch` there either: its `+ 1` never runs and it stops too." }
  - { line: 11, vars: { error: 'Error: Invalid command' }, stack: [{ name: main, args: '' }], note: "Climbing up to `main`, the error finds the `try`: it jumps straight to the `catch`. `serve` and `stepsOf` no longer exist." }
  - { line: 12, vars: { error: 'Error: Invalid command' }, stack: [{ name: main, args: '' }], out: "Invalid command", note: "The `catch` handles the error and the program carries on normally." }
```

```anim
title: With no catch, the error reaches the top and the program stops
code: |
  function stepsOf(command) {
    if (command === "F0") throw new Error("Invalid command");
    return 3;
  }
  function serve(order) {
    return stepsOf(order) + 1;
  }
  serve("F0");
  console.log("this never prints");
steps:
  - { line: 8, vars: {}, stack: [{ name: serve, args: 'order = "F0"' }, { name: stepsOf, args: 'command = "F0"' }], note: "The same calls, but this time nobody wraps them in a `try`." }
  - { line: 2, vars: {}, stack: [{ name: serve, args: 'order = "F0"' }, { name: stepsOf, args: 'command = "F0"', err: 'throw' }], note: "`stepsOf` throws the error." }
  - { line: 6, vars: {}, stack: [{ name: serve, args: 'order = "F0"', err: 'keeps rising' }], note: "It climbs to `serve`, which doesn't catch it either." }
  - { line: 8, vars: {}, stack: [], out: "Uncaught Error: Invalid command\n    at stepsOf\n    at serve", note: "The stack emptied without finding a `catch`: the program **stops**, and the error message lists the calls the error went through. Line 9 never runs." }
```

And this is what a hand-made test looks like. You don't need a library to start: a function that compares and throws.

```js
function assertEqual(actual, expected) {
  if (actual !== expected) {
    throw new Error(`got ${actual}, expected ${expected}`);
  }
}

assertEqual(stepsOf("F3"), 3); // passes silently
assertEqual(stepsOf("F9"), 9); // if it fails, it tells you what came out
```

> **Common trap:** the empty `catch`. `try { … } catch {}` makes the error disappear, and the clue with it: the program carries on with bad data and fails further along, where nobody can tell why any more. Catch only what you know how to handle; let the rest go up (or throw it again with `throw error`).

<!-- legacy: throw-error -->

<!-- legacy: try-catch -->

<!-- legacy: custom-errors -->

<!-- mdn: throw-error try-catch custom-errors -->

## Practice

```exercise
id: js15-predice-finally
type: predict
title: The tray that always closes
prompt: |
  `finally` runs even when the `try` does `return`. What does it print?
code: |
  function serveDish() {
    try {
      console.log("I open the tray");
      return "queso helado";
    } finally {
      console.log("I close the tray");
    }
  }
  console.log(serveDish());
options:
  - "I open the tray\nqueso helado"
  - "I open the tray\nqueso helado\nI close the tray"
  - "I open the tray\nI close the tray\nqueso helado"
  - "I close the tray\nI open the tray\nqueso helado"
answer: "I open the tray\nI close the tray\nqueso helado"
explain: |
  The `return` gets the value ready, but before leaving the function the `finally` runs. Only then does `console.log` receive "queso helado" and print it.
```

```exercise
id: js15-predice-sigue
type: predict
title: One bad command doesn't stop the parade
prompt: |
  The `try` is **inside** the loop. What does it print?
code: |
  const commands = ["F2", "X", "F1"];
  for (const command of commands) {
    try {
      if (command[0] !== "F") throw new Error(`I don't understand ${command}`);
      console.log(`moving ${command.slice(1)}`);
    } catch (error) {
      console.log(error.message);
    }
  }
options:
  - "moving 2\nI don't understand X"
  - "moving 2\nI don't understand X\nmoving 1"
  - "moving 2\nmoving X\nmoving 1"
  - "I don't understand X"
answer: "moving 2\nI don't understand X\nmoving 1"
explain: |
  Each pass has its own `try`. The error from "X" is caught in its own pass and the loop carries on with "F1". If the `try` wrapped the whole loop, the error would cut it short and "moving 1" wouldn't come out.
```

```exercise
id: js15-completa-velocidad
type: complete
title: A speed that makes sense
prompt: |
  Chasqui's speed goes from 0 to 3. Complete `validateSpeed`: it throws a `TypeError` if it isn't a number and a `RangeError` if it's outside 0–3; if it's fine, it returns it.
visual:
  figure:
    panes:
      - { cards: [{ title: "validateSpeed(2)", rows: [["→", "returns 2"]] }, { title: "validateSpeed(5)", rows: [["→", "throws RangeError"]] }, { title: "validateSpeed(\"fast\")", rows: [["→", "throws TypeError"]] }] }
starter: |
  function validateSpeed(v) {
    if (typeof v ___ "number" || Number.isNaN(v)) {
      ___ new TypeError(`Speed must be a number: ${v}`);
    }
    if (v < 0 || v > 3) {
      throw new ___(`Speed out of range: ${v}`);
    }
    return v;
  }

  console.log(validateSpeed(2));
solution: |
  function validateSpeed(v) {
    if (typeof v !== "number" || Number.isNaN(v)) {
      throw new TypeError(`Speed must be a number: ${v}`);
    }
    if (v < 0 || v > 3) {
      throw new RangeError(`Speed out of range: ${v}`);
    }
    return v;
  }

  console.log(validateSpeed(2));
hints:
  - The first gap is "not equal to", in its strict version.
  - A number outside the allowed limits has its own ready-made error type.
tests:
  - name: 2 is valid and returned
    run: validateSpeed(2)
    equals: 2
  - name: 5 throws a RangeError
    run: '(() => { try { validateSpeed(5); return "threw nothing"; } catch (error) { return error.name; } })()'
    equals: RangeError
  - name: '"fast" throws a TypeError'
    run: '(() => { try { validateSpeed("fast"); return "threw nothing"; } catch (error) { return error.name; } })()'
    equals: TypeError
  - name: 3 still counts
    run: validateSpeed(3)
    equals: 3
```

```exercise
id: js15-arregla-texto
type: fix
title: "Failure: undefined"
prompt: |
  In the parade day's log, every battery failure shows up as `Failure: undefined`. That way nobody knows what happened. Make it say `Failure: low battery`.
starter: |
  function checkBattery(battery) {
    if (battery < 10) {
      throw "low battery";
    }
    return "ok";
  }

  try {
    checkBattery(4);
  } catch (error) {
    console.log(`Failure: ${error.message}`);
  }
solution: |
  function checkBattery(battery) {
    if (battery < 10) {
      throw new Error("low battery");
    }
    return "ok";
  }

  try {
    checkBattery(4);
  } catch (error) {
    console.log(`Failure: ${error.message}`);
  }
hints:
  - A bare string was thrown. Does a string have a `message` property?
tests:
  - name: the log says what happened
    output: "Failure: low battery"
  - name: throws a real Error
    source: 'throw\s+new\s+Error\s*\('
    msg: Throw new Error("low battery"), not a string.
```

```exercise
id: js15-escribe-clase
type: write
title: An error with a surname
prompt: |
  Write `class BatteryError extends Error`: its constructor takes `missing` (how much battery is missing), sets the message `"Missing N battery"`, the `name` `"BatteryError"` and keeps `missing` on the error.

  Then write `requireBattery(battery, steps)`: if there's enough, it returns the battery left; if not, it throws a `BatteryError` with what's missing.
visual:
  figure:
    panes:
      - { label: "requireBattery(10, 4)", value: "returns 6" }
      - { label: "requireBattery(2, 5)", cards: [{ title: "throws BatteryError", rows: [["name", "\"BatteryError\""], ["message", "\"Missing 3 battery\""], ["missing", "3"]] }] }
starter: |
  class BatteryError extends Error {
  }

  function requireBattery(battery, steps) {
  }
solution: |
  class BatteryError extends Error {
    constructor(missing) {
      super(`Missing ${missing} battery`);
      this.name = "BatteryError";
      this.missing = missing;
    }
  }

  function requireBattery(battery, steps) {
    if (steps > battery) throw new BatteryError(steps - battery);
    return battery - steps;
  }
hints:
  - "In the constructor, the first thing is `super(message)`: that way `Error` builds the `message` and the stack."
  - "After `super`, you can use `this.name = …` and `this.missing = …`."
tests:
  - name: it's an Error
    expect: new BatteryError(3) instanceof Error
  - name: its message
    run: new BatteryError(3).message
    equals: Missing 3 battery
  - name: its name
    run: new BatteryError(3).name
    equals: BatteryError
  - name: keeps what's missing
    run: new BatteryError(3).missing
    equals: 3
  - name: if there's enough, returns what's left
    run: requireBattery(10, 4)
    equals: 6
  - name: if there isn't, throws BatteryError with what's missing
    run: '(() => { try { requireBattery(2, 5); return "threw nothing"; } catch (error) { return [error instanceof BatteryError, error.missing]; } })()'
    equals: [true, 3]
```

```exercise
id: js15-escribe-pruebas
type: write
title: Home-made tests
prompt: |
  Write two functions to test code: `assertEqual(actual, expected)` throws an `Error` with the message `"got X, expected Y"` if they differ, and `runTest(name, test)` runs the test and prints `✓ name` if it passes or `✗ name: message` if it throws.

  The three tests below are already written, and the `stepsOf` function has a bug. Your tests will find it.
visual:
  figure:
    title: What the three tests must print
    panes:
      - { cards: [{ title: "F3 is 3 steps", rows: [["stepsOf gives", "3"], ["expected", "3"], ["prints", "✓ F3 is 3 steps"]] }, { title: "F10 is 10 steps", rows: [["stepsOf gives", "1"], ["expected", "10"], ["prints", "✗ F10 is 10 steps: got 1, expected 10"]] }, { title: "L doesn't move", rows: [["stepsOf gives", "0"], ["expected", "0"], ["prints", "✓ L doesn't move"]] }] }
starter: |
  // The function we're going to test (it has a bug):
  const stepsOf = (command) => (command === "L" || command === "R" ? 0 : Number(command[1]));

  function assertEqual(actual, expected) {
    // TODO: if they differ, throw an Error: "got X, expected Y"
  }

  function runTest(name, test) {
    // TODO: run test() inside a try/catch and print ✓ or ✗
  }

  runTest("F3 is 3 steps", () => assertEqual(stepsOf("F3"), 3));
  runTest("F10 is 10 steps", () => assertEqual(stepsOf("F10"), 10));
  runTest("L doesn't move", () => assertEqual(stepsOf("L"), 0));
solution: |
  const stepsOf = (command) => (command === "L" || command === "R" ? 0 : Number(command[1]));

  function assertEqual(actual, expected) {
    if (actual !== expected) {
      throw new Error(`got ${actual}, expected ${expected}`);
    }
  }

  function runTest(name, test) {
    try {
      test();
      console.log(`✓ ${name}`);
    } catch (error) {
      console.log(`✗ ${name}: ${error.message}`);
    }
  }

  runTest("F3 is 3 steps", () => assertEqual(stepsOf("F3"), 3));
  runTest("F10 is 10 steps", () => assertEqual(stepsOf("F10"), 10));
  runTest("L doesn't move", () => assertEqual(stepsOf("L"), 0));
hints:
  - "`runTest` receives the test as a function: inside the `try`, call it with `test()`. If it didn't throw, print the ✓."
  - "In the `catch`, `error.message` carries what `assertEqual` built."
tests:
  - name: prints the result of the three tests
    output: "✓ F3 is 3 steps\n✗ F10 is 10 steps: got 1, expected 10\n✓ L doesn't move"
  - name: assertEqual throws with the requested message
    run: '(() => { try { assertEqual(1, 2); return "threw nothing"; } catch (error) { return error.message; } })()'
    equals: got 1, expected 2
  - name: assertEqual stays quiet when they're equal
    run: '(() => { assertEqual(2, 2); return "quiet"; })()'
    equals: quiet
```

## The case

```exercise
id: js15-caso-version
type: case
title: The version that reached the square
prompt: |
  Write `countFailures(version)`, which runs every one of the `tests` on a version and counts how many it fails (giving another result **or** throwing an error counts as a failure), and print one line per technician.

  During the week, four of Loop's technicians each wrote their version of `safeSpeed(readings)`, the function that decides how fast Chasqui goes from what its sensor sees. One of those versions was the one that reached the square. All four swear theirs "passes every test". In the square, the crowd surrounded the robot and covered the sensor: an **empty** list of readings came in.

  Print each technician with their failures at the end, for example `Yolanda: 0 failures`. The board compares your number with what each one said.
visual:
  board:
    for: js15-caso-version
    title: What each technician swore
    task: Run the six tests on each version, catching errors, and count the failures.
    cards:
      - { name: Yolanda, kind: person, role: "Sensor technician", rows: [["Said", "\"passes them all\""]], clue: { find: "Yolanda", says: 0, saysLabel: "Failures claimed" } }
      - { name: Percy, kind: person, role: "Motor technician", rows: [["Said", "\"passes them all\""]], clue: { find: "Percy", says: 0, saysLabel: "Failures claimed" } }
      - { name: Brayan, kind: person, role: "Intern", culprit: true, rows: [["Said", "\"passes them all\""]], clue: { find: "Brayan", says: 0, saysLabel: "Failures claimed" } }
      - { name: Rocío, kind: person, role: "Head of the workshop", rows: [["Said", "\"passes them all\""]], clue: { find: "Rocío", says: 0, saysLabel: "Failures claimed" } }
      - { name: The tests, kind: note, rows: [["[300, 200]", "2"], ["[300, 120]", "1"], ["[40, 500]", "0"], ["[150]", "2"], ["[50]", "1"], ["[ ] (sensor covered)", "0"]] }
    caption: "**Matches**: their version passes the six tests. A version that throws an error in a test also fails that test."
starter: |
  // The rule: the closest reading (in cm) decides.
  // Under 50 → 0 (brake). Under 150 → 1. Otherwise → 2. No readings → 0.
  const tests = [
    { readings: [300, 200], expected: 2 },
    { readings: [300, 120], expected: 1 },
    { readings: [40, 500], expected: 0 },
    { readings: [150], expected: 2 },
    { readings: [50], expected: 1 },
    { readings: [], expected: 0 },
  ];

  const versions = {
    Yolanda: (readings) => {
      if (readings.length === 0) return 0;
      const closest = Math.min(...readings);
      if (closest < 50) return 0;
      if (closest < 150) return 1;
      return 2;
    },
    Percy: (readings) => {
      const closest = readings.reduce((low, d) => Math.min(low, d), Infinity);
      if (closest === Infinity || closest < 50) return 0;
      return closest < 150 ? 1 : 2;
    },
    Brayan: (readings) => {
      const closest = readings.reduce((low, d) => Math.min(low, d));
      if (closest <= 50) return 0;
      return closest < 150 ? 1 : 2;
    },
    Rocío: (readings) => {
      let closest = Infinity;
      for (const d of readings) {
        if (d < closest) closest = d;
      }
      if (readings.length === 0) return 0;
      return closest < 50 ? 0 : closest < 150 ? 1 : 2;
    },
  };

  // This is how you run a version on one test:
  const example = versions.Yolanda([300, 200]);
  console.log("A version with [300, 200] gives", example);

  // TODO: write countFailures(version): go through the tests and count
  // the ones that give another result or throw an error (try/catch).

  // TODO: print one line per technician: Yolanda: 0 failures
solution: |
  const tests = [
    { readings: [300, 200], expected: 2 },
    { readings: [300, 120], expected: 1 },
    { readings: [40, 500], expected: 0 },
    { readings: [150], expected: 2 },
    { readings: [50], expected: 1 },
    { readings: [], expected: 0 },
  ];

  const versions = {
    Yolanda: (readings) => {
      if (readings.length === 0) return 0;
      const closest = Math.min(...readings);
      if (closest < 50) return 0;
      if (closest < 150) return 1;
      return 2;
    },
    Percy: (readings) => {
      const closest = readings.reduce((low, d) => Math.min(low, d), Infinity);
      if (closest === Infinity || closest < 50) return 0;
      return closest < 150 ? 1 : 2;
    },
    Brayan: (readings) => {
      const closest = readings.reduce((low, d) => Math.min(low, d));
      if (closest <= 50) return 0;
      return closest < 150 ? 1 : 2;
    },
    Rocío: (readings) => {
      let closest = Infinity;
      for (const d of readings) {
        if (d < closest) closest = d;
      }
      if (readings.length === 0) return 0;
      return closest < 50 ? 0 : closest < 150 ? 1 : 2;
    },
  };

  function countFailures(version) {
    let failures = 0;
    for (const { readings, expected } of tests) {
      try {
        if (version(readings) !== expected) failures++;
      } catch (error) {
        console.log(`  (threw ${error.name} with [${readings}])`);
        failures++;
      }
    }
    return failures;
  }

  for (const [technician, version] of Object.entries(versions)) {
    console.log(`${technician}: ${countFailures(version)} failures`);
  }
answer: Brayan
answerLabel: Whose version reached the square?
reveal: |
  Brayan's: it fails 2 of 6. With the empty list, his `reduce` with no initial value throws exactly the `TypeError` from the square, and it also brakes at 50 cm when the rule says "under 50". Brayan swears he tested it; he did, but only with normal readings. The tests at the edges (the empty list, exactly 50) are the ones that count.
hints:
  - "Inside `countFailures`, a `for...of` over `tests`. Wrap the call `version(readings)` in a `try`: if it throws, the `catch` adds a failure."
  - "To walk the versions with their names: `for (const [technician, version] of Object.entries(versions))`."
```

## The judge

```exercise
id: js15-juez-comandos
type: judge
mode: function
function: firstError
title: Check before setting out
prompt: |
  Write `firstError(program, battery)`, which checks a program of commands **before** the robot moves and returns `[position, code]` of the first command with a problem, or `[-1, 0]` if everything is fine.

  The program arrives from the municipality's tablet as a list of strings. The valid commands are:

  - `"L"` and `"R"`: turn. They use no battery.
  - `"F"` followed **only by digits**, with a number from 1 to 9: move that many steps. Each step uses 1 battery.

  The error codes:

  | code | when | examples |
  |---|---|---|
  | 1 | the command doesn't have the format | `"X"`, `"F"`, `"F3x"`, `"f2"`, `"F-1"`, `""` |
  | 2 | it's `F` with digits, but the number isn't between 1 and 9 | `"F0"`, `"F10"`, `"F12"` |
  | 3 | it's valid, but with it the accumulated steps go over the `battery` | |

  Also write `checkCommand(command)`, which returns a command's steps (0 for `L` and `R`) or **throws** your own error (`class … extends Error`) with its code. `firstError` uses it inside a `try/catch`. The judge tests `checkCommand` on its own with valid commands.

  **Constraints:** 0 to 12 commands · battery from 0 to 45.
visual:
  figure:
    title: Example 3, command by command
    input: { label: 'firstError(["F4", "R", "F2", "L", "F3"], 8)', cells: ["F4 → 4", "R → 4", "F2 → 6", "L → 6", "F3 → 9"], highlight: [4] }
    arrow: "each cell: command → accumulated steps. At position 4 it is 9 > 8: code 3"
    output: { label: returns, value: "[4, 3]" }
starter: |
  function checkCommand(command) {
  }

  function firstError(program, battery) {
  }
solution: |
  class CommandError extends Error {
    constructor(message, code) {
      super(message);
      this.name = "CommandError";
      this.code = code;
    }
  }

  function checkCommand(command) {
    if (command === "L" || command === "R") return 0;
    if (!/^F\d+$/.test(command)) throw new CommandError(`I don't understand "${command}"`, 1);
    const steps = Number(command.slice(1));
    if (steps < 1 || steps > 9) throw new CommandError(`Out of range: "${command}"`, 2);
    return steps;
  }

  function firstError(program, battery) {
    let used = 0;
    for (const [i, command] of program.entries()) {
      try {
        used += checkCommand(command);
        if (used > battery) throw new CommandError(`Out of battery at "${command}"`, 3);
      } catch (error) {
        if (error instanceof CommandError) return [i, error.code];
        throw error;
      }
    }
    return [-1, 0];
  }
hints:
  - "The regular expression `/^F\\d+$/` says \"an F and then only digits, nothing else\". `Number(command.slice(1))` gives the number."
  - "In `firstError`'s `catch`, ask `error instanceof CommandError`: if it's yours, return `[i, error.code]`; if not, it's a bug, and it's thrown again."
samples:
  - args: [["F3", "R", "F2", "L", "F4"], 20]
    returns: [-1, 0]
    note: All valid and the battery is enough (9 steps out of 20).
  - args: [["F3", "R", "F0", "L", "F4"], 20]
    returns: [2, 2]
    note: "F0 has the format, but 0 steps is out of range."
  - args: [["F4", "R", "F2", "L", "F3"], 8]
    returns: [4, 3]
  - fn: checkCommand
    args: ["F7"]
    returns: 7
edge:
  - args: [[], 0]
    tag: with an empty program
  - args: [["X"], 10]
    tag: with an unknown command
  - args: [["F9"], 9]
    tag: with exactly enough battery
  - args: [["F1"], 0]
    tag: with zero battery
  - args: [["L", "R", "L"], 0]
    tag: with only turns and no battery
  - args: [["F3x"], 10]
    tag: with letters after the number
  - args: [["f2"], 10]
    tag: with a lowercase f
  - args: [["F10", "F2"], 20]
    tag: with a 10
  - args: [["F-1"], 10]
    tag: with a negative number
  - args: [["F2", ""], 10]
    tag: with an empty command
  - args: [["F2", "F"], 10]
    tag: with a lone F
  - fn: checkCommand
    args: ["L"]
    tag: in checkCommand, with a turn
random:
  count: 50
  seed: 15
  generate: |
    const good = ["L", "R", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9"];
    const bad = ["F0", "F10", "F12", "X", "F", "F3x", "f2", "F-1", "", "F 3", "FF2"];
    const n = rng.int(0, 12);
    const program = Array.from({ length: n }, () => (rng.next() < 0.12 ? rng.pick(bad) : rng.pick(good)));
    return [program, rng.int(0, 45)];
wrong:
  - |
    class CommandError extends Error {
      constructor(message, code) {
        super(message);
        this.code = code;
      }
    }
    function checkCommand(command) {
      if (command === "L" || command === "R") return 0;
      if (!/^F\d+$/.test(command)) throw new CommandError("format", 1);
      const steps = Number(command.slice(1));
      if (steps < 1 || steps > 10) throw new CommandError("range", 2);
      return steps;
    }
    function firstError(program, battery) {
      let used = 0;
      for (const [i, command] of program.entries()) {
        try {
          used += checkCommand(command);
          if (used > battery) throw new CommandError("battery", 3);
        } catch (error) {
          return [i, error.code];
        }
      }
      return [-1, 0];
    }
  - |
    class CommandError extends Error {
      constructor(message, code) {
        super(message);
        this.code = code;
      }
    }
    function checkCommand(command) {
      if (command === "L" || command === "R") return 0;
      const steps = parseInt(command.slice(1));
      if (command[0] !== "F" || Number.isNaN(steps)) throw new CommandError("format", 1);
      if (steps < 1 || steps > 9) throw new CommandError("range", 2);
      return steps;
    }
    function firstError(program, battery) {
      let used = 0;
      for (const [i, command] of program.entries()) {
        try {
          used += checkCommand(command);
          if (used > battery) throw new CommandError("battery", 3);
        } catch (error) {
          return [i, error.code];
        }
      }
      return [-1, 0];
    }
  - |
    class CommandError extends Error {
      constructor(message, code) {
        super(message);
        this.code = code;
      }
    }
    function checkCommand(command) {
      if (command === "L" || command === "R") return 0;
      if (!/^F\d+$/.test(command)) throw new CommandError("format", 1);
      const steps = Number(command.slice(1));
      if (steps < 1 || steps > 9) throw new CommandError("range", 2);
      return steps;
    }
    function firstError(program, battery) {
      let used = 0;
      for (const [i, command] of program.entries()) {
        try {
          used += checkCommand(command);
          if (used >= battery) throw new CommandError("battery", 3);
        } catch (error) {
          return [i, error.code];
        }
      }
      return [-1, 0];
    }
  - |
    function checkCommand(command) {
      if (command === "L" || command === "R") return 0;
      if (!/^F\d+$/.test(command)) throw new Error("format");
      const steps = Number(command.slice(1));
      if (steps < 1 || steps > 9) throw new Error("range");
      return steps;
    }
    function firstError(program, battery) {
      let used = 0;
      for (const command of program) used += checkCommand(command);
      return used > battery ? [program.length - 1, 3] : [-1, 0];
    }
tests:
  - name: creates its own error with extends Error
    source: 'class\s+\w+\s+extends\s+Error'
    msg: Create your own error, for example class CommandError extends Error.
  - name: uses try/catch
    source: '\bcatch\b'
```

## Final mission

```exercise
id: js15-mision-yanahuara
type: mission
title: Rematch at Yanahuara
prompt: |
  Check the whole `program` **before** moving Chasqui; if it's fine, run it and deliver the queso helado, and if not, Chasqui says the error without moving. Whatever happens, at the end it says `"Thank you, Arequipa!"`.

  Chasqui is at the entrance of the viewpoint facing east. `program` comes from the tablet, with the judge's commands: `"L"`, `"R"` and `"F1"`…`"F9"`.

  - Use the same rules as the judge, with the robot's battery: `robot.battery`.
  - If something is wrong: `robot.say(error.message)`, and the message must **name the command** that failed (for example `Out of range: "F0"`).
  - If everything is fine: `L` → `robot.turnLeft()`, `R` → `robot.turnRight()`, `Fn` → `robot.forward(n)`, and at the end `robot.deliver("Queso helado")`.
  - The last bubble, always: `robot.say("Thank you, Arequipa!")`. That's what `finally` is for.

  The program, the map and the battery change in every test.
visual:
  figure:
    title: Check first, move afterwards
    panes:
      - { label: "a program with an error (F0 is out of range)", cells: ["F4", "R", "F2", "F0", "L", "F3"], highlight: [3] }
      - { label: "so Chasqui", cards: [{ title: "doesn't move", rows: [["says", "Out of range: \"F0\""], ["and at the end", "Thank you, Arequipa!"]] }] }
starter: |
  // program comes from the tablet, for example: ["F4", "R", "F2", "L", "F3"]

  class CommandError extends Error {
    constructor(message, code) {
      super(message);
      this.name = "CommandError";
      this.code = code;
    }
  }

  // TODO: checkCommand(command): returns the steps (0 for L and R) or throws a CommandError

  // TODO: try: check the whole program (and the battery) before turning a wheel;
  //       then run it and deliver "Queso helado".
  //       catch: robot.say(error.message)
  //       finally: robot.say("Thank you, Arequipa!")
solution: |
  class CommandError extends Error {
    constructor(message, code) {
      super(message);
      this.name = "CommandError";
      this.code = code;
    }
  }

  function checkCommand(command) {
    if (command === "L" || command === "R") return 0;
    if (!/^F\d+$/.test(command)) throw new CommandError(`I don't understand "${command}"`, 1);
    const steps = Number(command.slice(1));
    if (steps < 1 || steps > 9) throw new CommandError(`Out of range: "${command}"`, 2);
    return steps;
  }

  function checkProgram(program, battery) {
    let used = 0;
    for (const command of program) {
      used += checkCommand(command);
      if (used > battery) throw new CommandError(`Out of battery at "${command}"`, 3);
    }
  }

  try {
    checkProgram(program, robot.battery);
    for (const command of program) {
      if (command === "L") robot.turnLeft();
      else if (command === "R") robot.turnRight();
      else robot.forward(checkCommand(command));
    }
    robot.deliver("Queso helado");
  } catch (error) {
    if (!(error instanceof CommandError)) throw error;
    robot.say(error.message);
  } finally {
    robot.say("Thank you, Arequipa!");
  }
hints:
  - "Split it into two passes: the first only checks (and throws if something's wrong); the second moves. That way an error never leaves the robot halfway."
  - "Put both passes and the delivery inside a `try`; the `catch` says `error.message` and the `finally` says thank you."
world:
  theme: barranco
  level: 4
  dir: E
  battery: 20
  map: |
    ##########
    #R....#..#
    #####.#..#
    #####...D#
    ##########
globals:
  program: ["F4", "R", "F2", "L", "F3"]
scenarios:
  - tests:
      - name: delivers the queso helado
        state: 'w.atGoal && w.delivered.includes("Queso helado")'
  - globals: { program: ["F4", "R", "F2", "F0", "L", "F3"] }
    tests:
      - name: with F0, it doesn't move
        state: 'w.x === 1 && w.y === 1 && w.delivered.length === 0'
        msg: If the program has an error, Chasqui mustn't take a single step.
      - name: says which command failed
        state: 'w.said.some((t) => t.includes("F0"))'
        msg: 'The error message must name the command, for example: Out of range "F0".'
  - world: { battery: 8 }
    tests:
      - name: without enough battery, it doesn't set out
        state: 'w.x === 1 && w.y === 1 && w.delivered.length === 0'
        msg: With 8 battery there isn't enough for 9 steps; you have to notice before setting out.
      - name: says at which command the battery runs out
        state: 'w.said.some((t) => t.includes("F3"))'
  - map: |
      #########
      #R..#...#
      ###.#.#.#
      ###...#D#
      #########
    globals: { program: ["F2", "R", "F2", "L", "F2", "L", "F2", "R", "F2", "R", "F2"] }
    tests:
      - name: on another map, it delivers too
        state: 'w.atGoal && w.delivered.includes("Queso helado")'
  - globals: { program: ["F4", "R", "F2", "L", "F3x"] }
    tests:
      - name: with F3x, it doesn't move
        state: 'w.x === 1 && w.y === 1 && w.delivered.length === 0'
      - name: says which command failed
        state: 'w.said.some((t) => t.includes("F3x"))'
tests:
  - name: the last bubble is the thank-you
    state: 'w.said.at(-1) === "Thank you, Arequipa!"'
    msg: Whatever happens, the last thing Chasqui says is "Thank you, Arequipa!". Use finally.
  - name: no crashes
    state: '!w.crashed'
  - name: uses try, catch and finally
    source: '\btry\b[\s\S]*\bcatch\b[\s\S]*\bfinally\b'
  - name: throws its own errors
    source: 'throw\s+new\s+CommandError'
```

## Expert challenge

```exercise
id: js15-reto-lanza
type: challenge
title: Testing that something fails
prompt: |
  A good test suite also checks that code **fails properly**. Write `assertThrows(fn, ErrorClass)`: it calls `fn`; if it throws an error of that class, it returns it. If it throws nothing, it throws an `Error` with the message `"Threw nothing"`. If it throws another type of error, it throws an `Error` with the message `"Threw X, expected Y"` (each one's `name`).
starter: |
  function assertThrows(fn, ErrorClass) {
  }

  const error = assertThrows(() => { throw new RangeError("F0"); }, RangeError);
  console.log(error.message);
solution: |
  function assertThrows(fn, ErrorClass) {
    try {
      fn();
    } catch (error) {
      if (error instanceof ErrorClass) return error;
      throw new Error(`Threw ${error.name}, expected ${ErrorClass.name}`);
    }
    throw new Error("Threw nothing");
  }

  const error = assertThrows(() => { throw new RangeError("F0"); }, RangeError);
  console.log(error.message);
hints:
  - "The \"Threw nothing\" `throw` goes **after** the `try/catch`: if it were inside the `try`, your own `catch` would catch it."
tests:
  - name: returns the expected error
    run: 'assertThrows(() => { throw new RangeError("F0"); }, RangeError).message'
    equals: F0
  - name: accepts subclasses (a TypeError is an Error)
    run: 'assertThrows(() => null.x, Error).name'
    equals: TypeError
  - name: if it throws nothing, it says so
    run: '(() => { try { assertThrows(() => 1, Error); return "quiet"; } catch (e) { return e.message; } })()'
    equals: Threw nothing
  - name: if it throws another type, it says so
    run: '(() => { try { assertThrows(() => { throw new TypeError("x"); }, RangeError); return "quiet"; } catch (e) { return e.message; } })()'
    equals: Threw TypeError, expected RangeError
```
