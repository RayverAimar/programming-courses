# Session 14 — Asynchrony

## The job

Puno, four in the afternoon, three blocks from the pier. Doña Teodora Mamani runs Encomiendas Titicaca: she receives parcels from Juliaca and sends them by boat to the islands. Everything goes through a server that lives on the other side of an antenna on Cerro Azoguini, and the antenna works like her nephew's WhatsApp: it answers late, and sometimes it doesn't answer at all.

Doña Teodora hired Chasqui to carry each parcel to the pier, but first it has to **ask the server** which route to take and which label to put on. If Chasqui freezes while it waits for each answer, the five o'clock boat leaves without the parcel. Today it learns to ask for something, get on with its life while the answer travels, and react when the server fails.

```scene
theme: barranco
level: 4
dir: E
caption: The Encomiendas Titicaca office (on the left) and the pier's mailbox (D). The server knows the route and the label; Chasqui doesn't.
map: |
  ##########
  #R...#...#
  ####.#.#.#
  ####...#D#
  ##########
program: |
  robot.say("Route? Label?");
  robot.forward(3);
  robot.turnRight();
  robot.forward(2);
  robot.turnLeft();
  robot.forward(2);
  robot.turnLeft();
  robot.forward(2);
  robot.turnRight();
  robot.forward(2);
  robot.turnRight();
  robot.forward(2);
  robot.deliver("Parcel 31 · Taquile");
```

## The minimum

Until now every line finished before the next one started. Asking a server for something isn't like that: the answer takes time. JavaScript doesn't stop to wait; it gives you a **promise**, like the ticket you get at the parcel counter: it isn't your parcel yet, but it says the parcel will come (or that something went wrong).

- **`async function`** declares a function that can wait. It always returns a promise.
- **`await promise`** pauses *that* function until the promise fulfils, and gives you its value. The rest of the program keeps going.
- If the promise is **rejected** (the server failed), `await` throws the error: you catch it with **`try { … } catch (error) { … }`**, like any other error.
- **`Promise.all([p1, p2])`** waits for several promises **at once** and gives you their values in the same order. Two requests in parallel take as long as the slowest one, not the sum.
- **`setTimeout(fn, ms)`** is the old way to say "call me later": it takes a *callback*, a function the browser puts in the callback queue once the time has passed. You wrap it in a promise with `new Promise((resolve) => setTimeout(resolve, ms))`.

```exercise
id: js14-demo-encomienda
type: demo
async: true
starter: |
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function fetchParcel(code) {
    await wait(200);
    return `${code}: 4 kilos`;
  }

  console.log("Asking for the parcel…");
  const answer = await fetchParcel("P-101");
  console.log(answer);
```

(A bare `await`, outside any function, only works in the Workshop and in modules; inside any other function you need `async`.)

In today's exercises the Workshop's server is called `workshop`: `await workshop.request("route")` fetches a resource, and `workshop.now()` says how many milliseconds have gone by. Time is simulated: nothing really waits, but the delays and failures are the same every time you run.

Before the two requests, look at what happens to **your code** while something waits. It's the question almost everyone asks: who waits, where does my code go, and who wakes it up?

```network
title: Who waits and who wakes your code up
caption: "JavaScript does **one thing at a time**: whatever runs is on the stack. Waiting doesn't use the stack; the browser does it."
clockLabel: Since the request
clockMax: 0.4
speed: 4200
nodes:
  - { id: code, icon: program, label: Your code, sub: "`request()` and `console.log`" }
  - { id: stack, icon: box, label: Call stack, sub: what runs right now }
  - { id: wait, icon: os, label: Waiting area, sub: the browser counts the time and waits for the network }
  - { id: queue, icon: record, label: Callback queue, sub: continuations ready to run }
  - { id: loop, icon: engine, label: Event loop, sub: "is the stack empty?" }
steps:
  - phase: "1. You ask for something slow"
    move: [code, stack]
    packet: { kind: local, label: "the call `request(\"route\")`" }
    clock: 0
    clockText: 0 ms
    note: "Your code calls `request`. The call goes onto the **call stack**, which is where whatever is running runs."
    tags: { stack: "request() running" }
  - move: [stack, wait]
    packet: { kind: up, label: "the route request" }
    clock: 0
    clockText: 0 ms
    note: "`request` **doesn't sit and wait**: it hands the request to the waiting area and the call ends. The stack is left empty."
    tags: { stack: "empty", wait: "waiting for the route" }
  - phase: "2. Meanwhile"
    move: [code, stack]
    packet: { kind: local, label: "`console.log(\"going on\")`" }
    clock: 0.05
    clockText: 50 ms
    note: "Since the stack is free, your code goes on with the next line: it prints `going on`. The request travels on its own; nobody is watching it."
    tags: { stack: "console.log running", wait: "waiting for the route" }
  - phase: "3. The response arrives"
    move: [wait, queue]
    packet: { kind: down, label: "the response, ready" }
    clock: 0.12
    clockText: 120 ms
    note: "At 120 ms the response arrives. The waiting area **runs nothing**: it leaves a notice in the queue, \"when you can, continue after the `await`\"."
    tags: { queue: "1 notice", stack: "empty" }
  - at: loop
    busy: [loop]
    clock: 0.12
    clockText: 120 ms
    note: "The **event loop** repeats a single question: \"is the stack empty?\". If it is and there's a notice in the queue, it takes the first one."
    tags: { queue: "1 notice", stack: "empty" }
  - move: [loop, stack]
    packet: { kind: local, label: "the notice: continue after the `await`" }
    dim: [wait, queue]
    clock: 0.12
    clockText: 120 ms
    note: "The notice goes onto the stack and your function **continues right after the `await`**, with the response in hand. That's how an `await` \"wakes up\". If your code were busy in a huge loop, the notice would wait: nothing interrupts what's running."
    tags: { stack: "your function continues" }
```

Watch two requests in parallel. Each one leaves as a pending promise; `await Promise.all` waits until the last one arrives.

```anim
title: Two requests at once, a single await
code: |
  const pRoute = workshop.request("route");
  const pLabel = workshop.request("label");
  const [route, label] = await Promise.all([pRoute, pLabel]);
  console.log(route.length, label);
steps:
  - { line: 1, vars: { clock: "0 ms", pRoute: "⏳ pending" }, note: "request doesn't wait: it returns a pending promise straight away." }
  - { line: 2, vars: { clock: "0 ms", pRoute: "⏳ pending", pLabel: "⏳ pending" }, note: "The second request also leaves at 0 ms: both travel at the same time." }
  - { line: 3, vars: { clock: "0 ms", pRoute: "⏳ pending", pLabel: "⏳ pending" }, note: "await: the program stays on this line until both arrive." }
  - { line: 3, vars: { clock: "120 ms", pRoute: "⏳ pending", pLabel: "✓ Parcel 31" }, note: "The label arrives first…" }
  - { line: 3, vars: { clock: "260 ms", pRoute: "✓ 13 steps", pLabel: "✓ Parcel 31", route: "[13 steps]", label: "Parcel 31" }, note: "…and with the last one, Promise.all hands over both, in the order you asked for them." }
  - { line: 4, vars: { clock: "260 ms", route: "[13 steps]", label: "Parcel 31" }, out: "13 Parcel 31", note: "Total: 260 ms, as long as the slowest. One after the other would have been 120 + 260." }
```

```figure
title: One after the other, or at once
caption: Each bar is a request travelling. With one `await` after another, the times add up; with `Promise.all`, they overlap.
panes:
  - { label: "One after the other: 260 + 120 = 380 ms", text: "          0    100  200  300  400\nroute     █████████████\nlabel                  ██████" }
  - { label: "With Promise.all: 260 ms", text: "          0    100  200  300  400\nroute     █████████████\nlabel     ██████" }
```

> **Common trap:** forgetting the `await`. `const kilos = workshop.request("P-101")` doesn't store the kilos: it stores the promise. If you then see `[object Promise]` or a total that never changes, look for the missing `await`.

<!-- legacy: promises -->

<!-- legacy: async-await -->

<!-- mdn: promises async-await await promise-all set-timeout -->

## Practice

```exercise
id: js14-predice-orden
type: predict
async: true
title: Who arrives first?
prompt: |
  `setTimeout` schedules a function and the program carries on. What does it print?
code: |
  console.log("Chasqui asks for the route");
  setTimeout(() => console.log("The route arrived"), 300);
  setTimeout(() => console.log("The label arrived"), 100);
  console.log("Chasqui tidies the office");
options:
  - "Chasqui asks for the route\nThe route arrived\nThe label arrived\nChasqui tidies the office"
  - "Chasqui asks for the route\nChasqui tidies the office\nThe route arrived\nThe label arrived"
  - "Chasqui asks for the route\nChasqui tidies the office\nThe label arrived\nThe route arrived"
  - "Chasqui asks for the route\nThe label arrived\nThe route arrived\nChasqui tidies the office"
answer: "Chasqui asks for the route\nChasqui tidies the office\nThe label arrived\nThe route arrived"
explain: |
  Both functions get scheduled and the program carries on: the two plain lines come out first. Then each callback runs when its time comes: the label at 100 ms, the route at 300 ms. The order in the code doesn't matter; the clock does.
```

```exercise
id: js14-predice-sin-await
type: predict
title: The kilos that weren't kilos
prompt: |
  An `async` function always returns a promise. Something is missing here. What does it print?
code: |
  async function weigh(code) {
    return 5;
  }
  const kilos = weigh("P-101");
  console.log(kilos + 1);
options:
  - "6"
  - "[object Promise]1"
  - "NaN"
  - "undefined1"
answer: "[object Promise]1"
explain: |
  `weigh` returns a promise of 5, not a 5. Adding 1 turns the promise into text, `"[object Promise]"`, and sticks the 1 on. With `const kilos = await weigh("P-101");` it would print 6.
```

```exercise
id: js14-completa-zarpar
type: complete
async: true
title: From callback to promise
prompt: |
  The pier's siren calls back the old way, with a callback. Wrap `setTimeout` in a promise so you can use `await`, and complete `setSail` so it waits 500 ms between the two messages.
visual:
  figure:
    input: { label: "callback", text: "setTimeout(fn, 500)" }
    arrow: "new Promise((resolve) => …)"
    output: { label: "promise", text: "await wait(500)" }
starter: |
  const wait = (ms) => new Promise((resolve) => ___(resolve, ms));

  ___ function setSail() {
    console.log("Loading parcels");
    ___ wait(500);
    console.log("Casting off!");
  }

  await setSail();
solution: |
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function setSail() {
    console.log("Loading parcels");
    await wait(500);
    console.log("Casting off!");
  }

  await setSail();
hints:
  - The first gap is the usual function that calls another one after some milliseconds.
  - A function that uses `await` inside must be declared `async`.
tests:
  - name: prints both messages in order
    output: "Loading parcels\nCasting off!"
  - name: waits 500 ms
    state: s.clock === 500
    msg: 500 ms of the simulated clock must pass between the two messages.
```

```exercise
id: js14-arregla-foreach
type: fix
server: { seed: 3, latency: [100, 300], data: { "P-301": 4, "P-302": 9, "P-303": 5 } }
title: The total that is always zero
prompt: |
  Doña Teodora wants the total weight of three parcels, but the program prints `Total: 0 kilos`. Every request arrives fine. Why doesn't the total find out?
visual:
  figure:
    panes:
      - { label: "what the server says", cards: [{ title: "P-301", rows: [["kilos", "4"]] }, { title: "P-302", rows: [["kilos", "9"]] }, { title: "P-303", rows: [["kilos", "5"]] }] }
      - { label: "expected total", value: "18 kilos" }
starter: |
  const codes = ["P-301", "P-302", "P-303"];
  let total = 0;

  codes.forEach(async (code) => {
    total += await workshop.request(code);
  });

  console.log(`Total: ${total} kilos`);
solution: |
  const codes = ["P-301", "P-302", "P-303"];
  let total = 0;

  for (const code of codes) {
    total += await workshop.request(code);
  }

  console.log(`Total: ${total} kilos`);
hints:
  - "`forEach` calls the async function and **doesn't wait** for its promise: the `console.log` runs before anything has arrived."
  - "A `for...of` with `await` inside does wait on every pass. (With `Promise.all` and `map` they'd go in parallel.)"
tests:
  - name: the total is 18
    output: "Total: 18 kilos"
  - name: doesn't use forEach with async
    sourceNot: 'forEach\s*\(\s*async'
    msg: forEach doesn't wait for promises; use for...of with await, or Promise.all.
```

```exercise
id: js14-escribe-reintento
type: write
server: { seed: 5, latency: [100, 300], failOn: [1, 2], data: { weather: light wind } }
title: Ask again
prompt: |
  Write `requestWithRetry(resource, attempts = 4)`: it requests the resource and, if the server fails, **waits 100 ms and asks again**, up to `attempts` times in total. If they all fail, it throws the last error.

  The end of the program is already written: it prints the lake's weather, or `No signal` with the error's status.
visual:
  figure:
    title: A run that works on the third attempt
    panes:
      - { cards: [{ title: "attempt 1", rows: [["answers", "503 ✗"], ["then", "wait 100 ms"]] }, { title: "attempt 2", rows: [["answers", "503 ✗"], ["then", "wait 100 ms"]] }, { title: "attempt 3", rows: [["answers", "\"light wind\" ✓"], ["then", "return it"]] }] }
starter: |
  async function requestWithRetry(resource, attempts = 4) {
    // TODO: a loop of attempts; inside, try { return await … } catch { … }
  }

  try {
    const weather = await requestWithRetry("weather");
    console.log(`Weather: ${weather}`);
  } catch (error) {
    console.log(`No signal: ${error.status}`);
  }
solution: |
  async function requestWithRetry(resource, attempts = 4) {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await workshop.request(resource);
      } catch (error) {
        if (attempt === attempts) throw error;
        await workshop.wait(100);
      }
    }
  }

  try {
    const weather = await requestWithRetry("weather");
    console.log(`Weather: ${weather}`);
  } catch (error) {
    console.log(`No signal: ${error.status}`);
  }
hints:
  - "A `for` from 1 to `attempts`. Inside, `return await workshop.request(resource)` leaves the function as soon as it works."
  - "In the `catch`: if it was the last attempt, `throw error`; if not, `await workshop.wait(100)` and the loop goes on."
tests:
  - name: requestWithRetry is async
    source: 'async\s+function\s+requestWithRetry'
scenarios:
  - tests:
      - name: fails twice and gets the weather on the third try
        output: "Weather: light wind"
      - name: asks exactly 3 times
        state: s.requests.length === 3
      - name: waits 100 ms before retrying
        state: s.requests[1].start - s.requests[0].end === 100
        msg: After a failure, wait 100 ms with workshop.wait(100) before asking again.
  - server: { failOn: [1, 2, 3, 4, 5, 6] }
    tests:
      - name: if the server is down, it gives up with the error
        output: "No signal: 503"
      - name: it tries 4 times, not one more
        state: s.requests.length === 4
  - server: { failOn: [] }
    tests:
      - name: if it answers the first time, it asks only once
        state: s.requests.length === 1
```

```exercise
id: js14-arregla-paralelo
type: fix
server: { seed: 8, latency: [100, 300], data: { weather: clear, route: [E, E, S], label: Parcel 12 } }
title: The boat won't wait
prompt: |
  The boat casts off at **400 ms** and Chasqui needs three things from the server. This program asks for them one after the other and is late. Make it ask for all three **at once**.
visual:
  figure:
    panes:
      - { label: "one after the other: 131 + 160 + 217 = 508 ms", text: "          0    100  200  300  400  500\nweather   ███████\nroute            ████████\nlabel                    ██████████" }
      - { label: "the boat", value: "leaves at 400 ms" }
starter: |
  const start = workshop.now();
  const weather = await workshop.request("weather");
  const route = await workshop.request("route");
  const label = await workshop.request("label");

  console.log(`${label}: ${route.length} steps, ${weather}`);
  console.log(`Ready at ${workshop.now() - start} ms`);
solution: |
  const start = workshop.now();
  const [weather, route, label] = await Promise.all([
    workshop.request("weather"),
    workshop.request("route"),
    workshop.request("label"),
  ]);

  console.log(`${label}: ${route.length} steps, ${weather}`);
  console.log(`Ready at ${workshop.now() - start} ms`);
hints:
  - "`Promise.all([...])` takes the three promises and returns a single one that brings the three values."
  - "Destructure the result in the same order: `const [weather, route, label] = await Promise.all([…]);`"
tests:
  - name: prints the three things
    outputIncludes: "Parcel 12: 3 steps, clear"
  - name: the three requests leave at 0 ms
    state: s.requests.length === 3 && s.requests.every((r) => r.start === 0)
    msg: The three requests must leave together, without waiting for each other.
  - name: ready before the boat leaves
    state: s.clock <= 400
    msg: With all three at once, the total time is the slowest one's.
```

## The case

```exercise
id: js14-caso-lancha
type: case
server: { seed: 14, latency: [80, 260], failOn: [4, 9, 14], data: { manifest: [{ code: P-301, island: Taquile }, { code: P-302, island: Amantaní }, { code: P-303, island: Uros }, { code: P-304, island: Anapia }, { code: P-305, island: Taquile }, { code: P-306, island: Amantaní }, { code: P-307, island: Uros }, { code: P-308, island: Anapia }, { code: P-309, island: Taquile }, { code: P-310, island: Amantaní }, { code: P-311, island: Uros }, { code: P-312, island: Anapia }], "P-301": 4, "P-302": 5, "P-303": 7, "P-304": 6, "P-305": 6, "P-306": 8, "P-307": 12, "P-308": 4, "P-309": 3, "P-310": 2, "P-311": 5, "P-312": 9 } }
title: The boat that weighed too much
prompt: |
  Ask the server for the weight of each parcel, add up the kilos each island carries and print one line per island to compare it with what its boatman declared.

  At the pier there's a toll per kilo. Each boatman declared how many kilos he or she carried, and one declared less to pay less. The manifest (which parcel goes to which island) and each parcel's weight are on the server: `workshop.request("manifest")` and `workshop.request("P-301")` → kilos. The server fails now and then, so **retry** when it fails.

  Print each island with its kilos at the end, for example `Taquile: 13`. The board compares your number with what that island's boatman declared.
visual:
  board:
    for: js14-caso-lancha
    title: What each boatman declared at the pier
    task: Add up each island's real kilos from what you get from the server and compare them with what was declared.
    cards:
      - { name: Hilario, kind: person, role: "Boat to Taquile", rows: [["Declared", "13 kg"]], clue: { find: "Taquile", says: 13, saysLabel: "Declared" } }
      - { name: Marcelina, kind: person, role: "Boat to Amantaní", rows: [["Declared", "15 kg"]], clue: { find: "Amantaní", says: 15, saysLabel: "Declared" } }
      - { name: Wilber, kind: person, role: "Boat to Uros", culprit: true, rows: [["Declared", "17 kg"]], clue: { find: "Uros", says: 17, saysLabel: "Declared" } }
      - { name: Nayda, kind: person, role: "Boat to Anapia", rows: [["Declared", "19 kg"]], clue: { find: "Anapia", says: 19, saysLabel: "Declared" } }
    caption: "**Matches**: declared exactly what the boat carries. If it doesn't match, someone paid less toll."
starter: |
  // The manifest is on the server. This is how you ask for something (this time it answered first go):
  const manifest = await workshop.request("manifest");
  console.log(`The manifest has ${manifest.length} parcels, and each one has: ${Object.keys(manifest[0]).join(", ")}`);

  // TODO: write requestWithRetry(resource): if the server fails, wait 100 ms and ask again.

  // TODO: ask for the weight of every parcel at once (Promise.all with map).
  // Each code is a resource: workshop.request("P-301") → 4

  // TODO: add up the kilos per island and print one line per island: Taquile: 13
solution: |
  async function requestWithRetry(resource, attempts = 4) {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await workshop.request(resource);
      } catch (error) {
        if (attempt === attempts) throw error;
        await workshop.wait(100);
      }
    }
  }

  const manifest = await requestWithRetry("manifest");
  const weights = await Promise.all(manifest.map(({ code }) => requestWithRetry(code)));

  const kilosByIsland = {};
  manifest.forEach(({ island }, i) => {
    kilosByIsland[island] = (kilosByIsland[island] ?? 0) + weights[i];
  });

  for (const [island, kilos] of Object.entries(kilosByIsland)) {
    console.log(`${island}: ${kilos}`);
  }
answer: Uros
answerLabel: Which island's boat declared too little?
reveal: |
  Wilber: his boat to Uros carries 24 kilos (7 + 12 + 5) and he declared 17. The 7 missing kilos are, he says, "cheese from Juliaca for my aunt, that doesn't count". It does count.
hints:
  - "With `manifest.map(({ code }) => requestWithRetry(code))` you have a list of promises; `await Promise.all(…)` gives you the list of weights in the same order."
  - "Walk the manifest with its index: the weight of `manifest[i]` is `weights[i]`. Accumulate in an object `{ island: kilos }`."
```

## The judge

This judge calls an `async` function: it waits for its promise and compares what it delivers. Every case has its own server with the same failures: **requests number 1, 2, 4 and 7 of every case always fail**, whoever makes them.

```exercise
id: js14-juez-peso
type: judge
mode: function
function: totalWeight
server: { seed: 41, latency: [50, 250], failOn: [1, 2, 4, 7], data: { "P-101": 4, "P-102": 7, "P-103": 2, "P-104": 9, "P-105": 5, "P-106": 3, "P-107": 8, "P-108": 6, "P-109": 1, "P-110": 10, "P-111": 4, "P-112": 7 } }
title: The weight of the load
prompt: |
  Write `totalWeight(codes)`, which asks the server for each parcel's weight and returns `[kilos, missing]`: the sum of the kilos and the list of codes the server **doesn't have**.

  Doña Teodora weighs the load before it goes on the boat. Each code is a server resource: `await workshop.request("P-104")` → `9`. The server answers badly in two ways, and each one is handled differently (the error carries its number in `error.status`):

  - **503**, it didn't answer: ask again. 4 attempts per code are enough.
  - **404**, there's no such code: don't retry; that code goes in the `missing` list, in the order of `codes`.

  Also write `requestWithRetry(code)`: it returns the kilos, or `null` if the code doesn't exist. The judge tests it on its own.

  **Constraints:** 0 to 8 codes, no repeats · kilos are whole numbers from 1 to 10.
visual:
  figure:
    title: Example 1, code by code
    input: { label: 'totalWeight(["P-101", "P-150", "P-104"])', cards: [{ title: "P-101", rows: [["1st request", "503 ✗"], ["2nd request", "4 ✓"], ["adds", "4 kg"]] }, { title: "P-150", rows: [["1st request", "503 ✗"], ["2nd request", "503 ✗"], ["3rd request", "404: doesn't exist"], ["adds", "goes to missing"]] }, { title: "P-104", rows: [["1st request", "9 ✓"], ["adds", "9 kg"]] }] }
    arrow: add 4 + 9, and P-150 is missing
    output: { label: returns, value: '[13, ["P-150"]]' }
    steps:
      - "A 503 says nothing about the code: only that the server didn't answer. That's why you retry."
      - "A 404 does say something: that code doesn't exist. Retrying it is useless."
starter: |
  async function requestWithRetry(code) {
  }

  async function totalWeight(codes) {
  }
solution: |
  async function requestWithRetry(code, attempts = 4) {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await workshop.request(code);
      } catch (error) {
        if (error.status === 404) return null;
        if (attempt === attempts) throw error;
      }
    }
  }

  async function totalWeight(codes) {
    const weights = await Promise.all(codes.map((code) => requestWithRetry(code)));
    let kilos = 0;
    const missing = [];
    weights.forEach((weight, i) => {
      if (weight === null) missing.push(codes[i]);
      else kilos += weight;
    });
    return [kilos, missing];
  }
hints:
  - "In the `catch`, look at `error.status`: if it's 404, `return null`; if it's 503, let the loop try again."
  - "`await Promise.all(codes.map((code) => requestWithRetry(code)))` gives you the weights in the order of `codes`; the `null`s are the missing ones."
samples:
  - args: [["P-101", "P-150", "P-104"]]
    returns: [13, ["P-150"]]
    note: "P-101 and P-150 fail with 503 and are retried; when the server finally answers, it says P-150 doesn't exist (404)."
  - args: [["P-110", "P-107"]]
    returns: [18, []]
  - fn: requestWithRetry
    args: ["P-104"]
    returns: 9
    note: "It fails twice (requests 1 and 2) and on the third try brings the 9 kilos."
edge:
  - args: [[]]
    tag: with no parcels at all
  - args: [["P-999", "P-000"]]
    tag: with every code unknown
  - fn: requestWithRetry
    args: ["P-404"]
    tag: in requestWithRetry, with a code that doesn't exist
  - args: [["P-101", "P-102", "P-103", "P-104", "P-105", "P-106", "P-107", "P-108"]]
    tag: with the largest load
  - args: [["P-109"]]
    tag: with a single parcel
random:
  count: 40
  seed: 14
  generate: |
    const pool = ["P-101", "P-102", "P-103", "P-104", "P-105", "P-106", "P-107", "P-108", "P-109", "P-110", "P-111", "P-112", "P-150", "P-199", "P-000", "P-777"];
    const n = rng.int(0, 8);
    const out = [];
    while (out.length < n) {
      const c = rng.pick(pool);
      if (!out.includes(c)) out.push(c);
    }
    return [out];
wrong:
  - |
    async function requestWithRetry(code) {
      try {
        return await workshop.request(code);
      } catch (error) {
        return null;
      }
    }
    async function totalWeight(codes) {
      const weights = await Promise.all(codes.map((code) => requestWithRetry(code)));
      let kilos = 0;
      const missing = [];
      weights.forEach((weight, i) => {
        if (weight === null) missing.push(codes[i]);
        else kilos += weight;
      });
      return [kilos, missing];
    }
  - |
    async function requestWithRetry(code) {
      return await workshop.request(code);
    }
    async function totalWeight(codes) {
      let kilos = 0;
      for (const code of codes) kilos += await requestWithRetry(code);
      return [kilos, []];
    }
  - |
    async function requestWithRetry(code, attempts = 4) {
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          return await workshop.request(code);
        } catch (error) {
          if (error.status === 404) return null;
          if (attempt === attempts) throw error;
        }
      }
    }
    async function totalWeight(codes) {
      let kilos = 0;
      const missing = [];
      codes.forEach(async (code) => {
        const weight = await requestWithRetry(code);
        if (weight === null) missing.push(code);
        else kilos += weight;
      });
      return [kilos, missing];
    }
  - |
    async function requestWithRetry(code, attempts = 4) {
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          return await workshop.request(code);
        } catch (error) {
          if (error.status === 404) return 0;
          if (attempt === attempts) throw error;
        }
      }
    }
    async function totalWeight(codes) {
      const weights = await Promise.all(codes.map((code) => requestWithRetry(code)));
      return [weights.reduce((a, b) => a + b, 0), []];
    }
```

## Final mission

```exercise
id: js14-mision-muelle
type: mission
title: The five o'clock boat
prompt: |
  Ask the server for the `route` and the `label` **at once**, retrying when it fails, and take the parcel to the pier.

  - `await workshop.request("route")` → a list of directions, like `["E", "E", "S"]`
  - `await workshop.request("label")` → the text that goes on the parcel
  - `robot.followPath(route)` walks the route; `robot.deliver(label)` leaves the parcel in the mailbox (D)

  If a request fails, wait 100 ms and retry, up to 4 attempts. If it still doesn't answer, **don't set out blind**: Chasqui says `"No signal"` and stays in the office. The route, the label and the failures change in every test.
visual:
  figure:
    title: What happens in the first test
    panes:
      - { label: "requests", table: { head: ["", "route", "label"], rows: [["leaves at", "0 ms", "0 ms"], ["1st attempt", "503 ✗", "✓"], ["2nd attempt", "✓", ""]] } }
      - { label: "then", cards: [{ title: "Chasqui", rows: [["followPath", "route"], ["deliver", "label"]] }] }
starter: |
  async function requestWithRetry(resource) {
    // TODO: request; if it fails, wait 100 ms and ask again (up to 4 attempts)
  }

  // TODO: ask for the route and the label at once (Promise.all),
  // then follow the route and deliver. If there's no signal: robot.say("No signal")
solution: |
  async function requestWithRetry(resource, attempts = 4) {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await workshop.request(resource);
      } catch (error) {
        if (attempt === attempts) throw error;
        await workshop.wait(100);
      }
    }
  }

  try {
    const [route, label] = await Promise.all([
      requestWithRetry("route"),
      requestWithRetry("label"),
    ]);
    robot.followPath(route);
    robot.deliver(label);
  } catch (error) {
    robot.say("No signal");
  }
hints:
  - "Build `requestWithRetry` like in the practice: a `for` of attempts with `try { return await … } catch { … }`."
  - "Wrap the `await Promise.all([...])` and the trip in a `try`; in its `catch`, `robot.say(\"No signal\")`."
world:
  theme: barranco
  level: 4
  dir: E
  api: [move, deliver, path]
  map: |
    ##########
    #R...#...#
    ####.#.#.#
    ####...#D#
    ##########
server:
  seed: 31
  latency: [100, 300]
  failOn: [1]
  data:
    route: [E, E, E, S, S, E, E, N, N, E, E, S, S]
    label: "Parcel 31 · Taquile"
scenarios:
  - tests:
      - name: delivers parcel 31
        state: 'w.delivered.length === 1 && w.delivered[0] === "Parcel 31 · Taquile"'
        msg: The mailbox must receive the parcel with the label the server gave.
  - map: |
      #########
      #R......#
      #######.#
      #D......#
      #########
    server:
      failOn: [2, 3]
      data:
        route: [E, E, E, E, E, E, S, S, W, W, W, W, W, W]
        label: "Parcel 47 · Amantaní"
    tests:
      - name: the label fails twice and parcel 47 is still delivered
        state: 'w.delivered.length === 1 && w.delivered[0] === "Parcel 47 · Amantaní"'
  - server:
      failOn: [1, 2, 3, 4, 5, 6, 7, 8]
    tests:
      - name: with no signal, it doesn't leave the office
        state: 'w.x === 1 && w.y === 1 && w.delivered.length === 0'
        msg: If the server never answers, Chasqui mustn't move.
      - name: says "No signal"
        state: 'w.said.includes("No signal")'
tests:
  - name: asks for the route and the label at once
    state: 's.requests.length >= 2 && s.requests[0].start === 0 && s.requests[1].start === 0'
    msg: The first two requests must leave at 0 ms, together (Promise.all).
  - name: waits 100 ms before retrying
    state: '["route", "label"].every((k) => { const q = s.requests.filter((r) => r.resource === k); return q.length <= 4 && q.every((r, i) => i === 0 || r.start === q[i - 1].end + 100); })'
    msg: After each failure, wait 100 ms and ask for the same resource again, up to 4 attempts.
  - name: no crashes
    state: '!w.crashed'
  - name: uses Promise.all
    source: 'Promise\.all\s*\('
```

## Expert challenge

```exercise
id: js14-reto-limite
type: challenge
async: true
title: Don't wait forever
prompt: |
  Write `withTimeout(promise, ms)`: it returns a promise that fulfils with `promise`'s value if it arrives within `ms` milliseconds, and otherwise rejects with an `Error` whose message is `"Timed out"`. A hint in a name: `Promise.race`. Extra points if you clear the timer with `clearTimeout` when the promise wins.
starter: |
  const wait = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));

  function withTimeout(promise, ms) {
  }

  console.log(await withTimeout(wait(100, "route ready"), 300));
  try {
    await withTimeout(wait(900, "late route"), 300);
  } catch (error) {
    console.log(error.message);
  }
solution: |
  const wait = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));

  function withTimeout(promise, ms) {
    let id;
    const timer = new Promise((_, reject) => {
      id = setTimeout(() => reject(new Error("Timed out")), ms);
    });
    return Promise.race([promise, timer]).finally(() => clearTimeout(id));
  }

  console.log(await withTimeout(wait(100, "route ready"), 300));
  try {
    await withTimeout(wait(900, "late route"), 300);
  } catch (error) {
    console.log(error.message);
  }
hints:
  - "Make a second promise that rejects with `setTimeout` after `ms`, and race it against the original in `Promise.race`."
tests:
  - name: the one on time wins, the late one is cut off
    output: "route ready\nTimed out"
  - name: uses Promise.race
    source: 'Promise\.race\s*\('
```
