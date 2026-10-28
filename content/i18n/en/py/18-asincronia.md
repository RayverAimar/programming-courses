# Session 18 — Asynchrony with asyncio

## The job

Callao, six in the morning, Muelle Sur. The *Mama Ocllo*, a container ship coming from Valparaíso, is already moored, and **Gladys Huamán**, the terminal's crane coordinator, has to decide which container comes down first. Each gantry crane's schedule is known by an old server in the control tower, which answers whenever it feels like it: sometimes in the blink of an eye, sometimes once the coffee has gone cold, and sometimes with a `503`.

Maru sent Quilla over from Chucuito with its siren on and a warning: "If you ask the tower crane by crane and stand there waiting for every answer, the ship sails with the cargo still on board". Today Quilla learns to **ask for several things at once**, not to wait forever, and to insist patiently when the server fails.

```scene
theme: barranco
level: 2
dir: E
caption: Muelle Sur. Quilla waits for the tower's schedule, crosses the pier and leaves each container at the loading point (D), in the order of its slot.
map: |
  ############
  #R.........#
  #########.##
  #########D##
  ############
program: |
  robot.say("Slots, tower?")
  robot.forward(8)
  robot.turn_right()
  robot.forward(2)
  robot.deliver("CMAU-118 07:40")
  robot.deliver("MSKU-204 08:15")
```

## The minimum

Until now every line finished before the next one started. Asking a server something isn't like that: the answer **takes time**, and meanwhile the program could be doing something else, like asking for the next thing.

- **`async def`** defines a **coroutine function**. Calling it doesn't run anything yet: it returns a **coroutine**, a recipe ready to run.
- **`await coroutine`** runs it and waits for its result. While it waits, the **event loop** (the one that hands out turns among coroutines, one at a time) looks after others. You can only write `await` inside an `async def`.
- **`asyncio.run(main())`** starts the event loop, runs the main coroutine to the end and closes it. It's the front door: you call it once, from normal code.

```py run
import asyncio

async def request_slot(crane):
    await asyncio.sleep(0.2)  # the tower takes 0.2 s to answer
    return f"{crane}: 07:40"

async def main():
    print("Asking for the slot…")
    print(await request_slot("STS-3"))

asyncio.run(main())
```

In the exercises with a server, the tower is called `workshop`: `await workshop.request("STS-1")` fetches a resource and `workshop.now()` says how many milliseconds have gone by. If it fails, it raises `ServerError`, with the code in `error.status` (`503` if it didn't answer, `404` if it doesn't exist). Time is **simulated**: nothing really waits, but the delays and failures are the same every time you run. Without a server, `asyncio.get_running_loop().time()` gives the clock in seconds.

**One after another or all at once.** Two `await`s in a row wait for the first to finish completely before asking for the second: the times add up. **`asyncio.gather(c1, c2, …)`** launches all the coroutines at once and returns their results **in the order you passed them**, not the order they arrived in.

Before the code, look at **who does what** when two requests are in the air. The **event loop** is the one that hands out turns: at any moment **one** coroutine runs, and when it says `await`, the loop gives the turn to another.

```network
title: Who runs and who waits with gather
caption: "Two requests to the tower; the event loop only hands out turns. Nobody sits idle waiting."
clockLabel: Since the request
clockMax: 0.4
speed: 4200
nodes:
  - { id: code, icon: program, label: "Your code: `main()`", sub: the main coroutine }
  - { id: loop, icon: engine, label: Event loop, sub: hands out turns, one coroutine at a time }
  - { id: tasks, icon: box, label: Tasks, sub: "one per request: STS-1 and STS-2" }
  - { id: tower, icon: server, label: The tower, sub: takes 230 ms and 310 ms to answer }
steps:
  - phase: "1. The loop starts"
    move: [code, loop]
    packet: { kind: local, label: "`main()`" }
    clock: 0
    clockText: 0 ms
    note: "`asyncio.run(main())` hands `main` to the event loop. From here on, the loop decides who runs."
    tags: { code: running }
  - move: [loop, tasks]
    packet: { kind: local, label: "two tasks" }
    clock: 0
    clockText: 0 ms
    note: "`gather` turns the two coroutines into **tasks** and gives them to the loop. `main` waits until both are done."
    tags: { code: "waiting in gather", tasks: "STS-1 and STS-2 ready" }
  - phase: "2. The requests go out"
    move: [tasks, tower]
    packet: { kind: up, label: "request for STS-1" }
    clock: 0
    clockText: 0 ms
    note: "Task 1 sends its request and says `await`: \"I wait\". The loop **doesn't stand still**: it gives the turn to task 2."
    tags: { tasks: "STS-1 waits · STS-2 runs" }
  - move: [tasks, tower]
    packet: { kind: up, label: "request for STS-2" }
    clock: 0
    clockText: 0 ms
    note: "Task 2 sends its own and waits too. Both requests travel at the same time."
    tags: { tasks: "both wait" }
  - at: tower
    busy: [tower]
    clock: 0.1
    clockText: 100 ms
    note: "Now there's nothing to run: the loop is free and the requests move along in the tower. That wait belongs to the tower, not to your program."
    tags: { loop: "nothing to run", tasks: "both wait" }
  - phase: "3. The answers arrive"
    move: [tower, tasks]
    packet: { kind: down, label: "slot for STS-2" }
    clock: 0.23
    clockText: 230 ms
    note: "At 230 ms STS-2 answers. The loop wakes its task, which finishes."
    tags: { tasks: "STS-2 done · STS-1 waits" }
  - move: [tower, tasks]
    packet: { kind: down, label: "slot for STS-1" }
    clock: 0.31
    clockText: 310 ms
    note: "At 310 ms STS-1 answers and its task finishes too."
    tags: { tasks: "both done" }
  - move: [tasks, loop]
    packet: { kind: local, label: "both finished" }
    clock: 0.31
    clockText: 310 ms
    note: "With both tasks finished, the loop can wake `main`."
  - move: [loop, code]
    packet: { kind: local, label: "[slot_1, slot_2]" }
    clock: 0.31
    clockText: 310 ms
    note: "`gather` hands over the results in the order you asked, not the order they arrived, and the program goes on. Total: 310 ms, not 540."
    tags: { code: continues }
```

```anim
title: Two requests at once with gather
code: |
  async def main():
      request_1 = workshop.request("STS-1")
      request_2 = workshop.request("STS-2")
      slot_1, slot_2 = await asyncio.gather(request_1, request_2)
      print(slot_1, slot_2, workshop.now())

  asyncio.run(main())
steps:
  - { line: 7, vars: { clock: "0 ms" }, note: "asyncio.run starts the event loop and runs main()." }
  - { line: 2, vars: { clock: "0 ms", request_1: "<coroutine>" }, stack: [{ name: main, args: "" }], note: "Calling workshop.request doesn't ask for anything yet: it only builds the coroutine." }
  - { line: 3, vars: { clock: "0 ms", request_1: "<coroutine>", request_2: "<coroutine>" }, stack: [{ name: main, args: "" }], note: "The second recipe. The tower still knows nothing about us." }
  - { line: 4, vars: { clock: "0 ms", request_1: "⏳ sent", request_2: "⏳ sent" }, stack: [{ name: main, args: "" }], note: "gather turns each coroutine into a task: both go out at 0 ms and main waits." }
  - { line: 4, vars: { clock: "230 ms", request_1: "⏳ sent", request_2: "✓ \"06:45\"" }, stack: [{ name: main, args: "" }], note: "STS-2 answers first…" }
  - { line: 4, vars: { clock: "310 ms", slot_1: "\"06:10\"", slot_2: "\"06:45\"" }, stack: [{ name: main, args: "" }], note: "…and with STS-1 both arrive, in the order you asked for them." }
  - { line: 5, vars: { clock: "310 ms", slot_1: "\"06:10\"", slot_2: "\"06:45\"" }, stack: [{ name: main, args: "" }], out: "06:10 06:45 310", note: "Total: 310 ms, the slowest one's time. One after the other it would have been 310 + 230 = 540." }
```

```figure
title: One after another or all at once
caption: Each bar is a request travelling. With two `await`s in a row, the times add up; with `gather`, they overlap.
panes:
  - { label: "two awaits: 310 + 230 = 540 ms", text: "        0   100  200  300  400  500\nSTS-1   ████████████████\nSTS-2                   ███████████" }
  - { label: "with gather: 310 ms", text: "        0   100  200  300  400  500\nSTS-1   ████████████████\nSTS-2   ███████████" }
```

**Tasks.** `asyncio.create_task(coroutine)` sets it running **right away**, in the background, and gives you a task; later, `await task` collects its result. To launch several and wait for all of them, **`async with asyncio.TaskGroup() as group:`** is the modern way: you create the tasks with `group.create_task(…)` and, when you leave the block, they've all finished. If one fails, the group cancels the rest and hands you the error.

```py run
import asyncio

async def unload(container, seconds):
    await asyncio.sleep(seconds)
    print("unloaded", container)
    return container

async def main():
    async with asyncio.TaskGroup() as group:
        tasks = [group.create_task(unload(c, s)) for c, s in [("MSKU", 0.3), ("CMAU", 0.1)]]
    print([task.result() for task in tasks])

asyncio.run(main())
```

**Deadlines.** `async with asyncio.timeout(seconds):` puts a limit on everything you wait for inside the block. If it runs out, it cancels whatever was waiting and raises `TimeoutError`, which you catch with `try`/`except` like any other error.

```py run
import asyncio

async def main():
    try:
        async with asyncio.timeout(0.2):
            await asyncio.sleep(0.5)  # a tower that takes half a second
            print("the slot arrived")
    except TimeoutError:
        print("no slot: the deadline ran out")

asyncio.run(main())
```

> **Common trap:** forgetting the `await`. `slot = workshop.request("STS-1")` doesn't store the slot: it stores a coroutine that never ran, and Python warns *coroutine was never awaited*. If you see `<coroutine object …>` where you expected data, look for the missing `await`.

<!-- legacy: async-await -->

<!-- legacy: asyncio-run -->

<!-- legacy: taskgroup -->

<!-- legacy: asyncio-timeout -->

<!-- mdn: async-await asyncio-run taskgroup asyncio-timeout -->

## Practice

```exercise
id: py18-predice-tarea
type: predict
title: The crane that waited for nobody
prompt: |
  `create_task` sets the coroutine running in the background and the program carries on. What does it print?
code: |
  import asyncio

  async def crane(name, seconds):
      await asyncio.sleep(seconds)
      print(name, "ready")

  async def main():
      task = asyncio.create_task(crane("STS-2", 0.2))
      print("Gladys orders a coffee")
      await crane("STS-1", 0.3)
      print("End of shift")
      await task

  asyncio.run(main())
options:
  - "Gladys orders a coffee\nSTS-2 ready\nSTS-1 ready\nEnd of shift"
  - "STS-2 ready\nGladys orders a coffee\nSTS-1 ready\nEnd of shift"
  - "Gladys orders a coffee\nSTS-1 ready\nEnd of shift\nSTS-2 ready"
  - "Gladys orders a coffee\nSTS-1 ready\nSTS-2 ready\nEnd of shift"
answer: "Gladys orders a coffee\nSTS-2 ready\nSTS-1 ready\nEnd of shift"
explain: |
  STS-2's task is scheduled, but it doesn't run until `main` lets go of control: the coffee comes first. At `await crane("STS-1", 0.3)`, `main` waits, and meanwhile STS-2 moves on and finishes at 0.2 s. STS-1 finishes at 0.3 s and only then does `main` continue. The `await task` at the end finds the task already finished.
```

```exercise
id: py18-arregla-grupo
type: fix
title: The crane's window
server: { seed: 9, latency: [200, 450], data: { "STS-1": "07:10", "STS-2": "07:35", "STS-3": "08:00" } }
prompt: |
  **Make the three requests go out at once, with a `TaskGroup`, so Quilla has the slots before 500 ms.**

  The *Mama Ocllo*'s crane closes its scheduling window at 500 ms. This program asks the tower about the three cranes one after another and gets there late. Run it and see how long it takes.
visual:
  figure:
    panes:
      - { label: "one after another: 250 + 235 + 381 = 866 ms", text: "        0    250  500  750  1000\nSTS-1   █████\nSTS-2        █████\nSTS-3             ████████" }
      - { label: "the window", value: "closes at 500 ms" }
starter: |
  import asyncio

  async def main():
      start = workshop.now()
      slots = []
      for crane in ["STS-1", "STS-2", "STS-3"]:
          slots.append(await workshop.request(crane))
      print(slots)
      print(f"Done in {workshop.now() - start} ms")

  asyncio.run(main())
solution: |
  import asyncio

  async def main():
      start = workshop.now()
      async with asyncio.TaskGroup() as group:
          tasks = [group.create_task(workshop.request(crane)) for crane in ["STS-1", "STS-2", "STS-3"]]
      slots = [task.result() for task in tasks]
      print(slots)
      print(f"Done in {workshop.now() - start} ms")

  asyncio.run(main())
hints:
  - "Inside `async with asyncio.TaskGroup() as group:`, create one task per crane with `group.create_task(workshop.request(crane))` and keep them in a list."
  - "When you leave the block they've all finished: `[task.result() for task in tasks]` gives the slots in order."
tests:
  - name: prints the three slots in order
    outputIncludes: "['07:10', '07:35', '08:00']"
  - name: the three requests go out at 0 ms
    state: len(s.requests) == 3 and all(r.start == 0 for r in s.requests)
    msg: The three requests should go out together, without waiting for each other.
  - name: done before the window closes
    state: max(r.end for r in s.requests) <= 500
  - name: uses TaskGroup
    source: 'TaskGroup\(\)'
```

```exercise
id: py18-escribe-reintento
type: write
title: Patience with the Harbour Master
server: { seed: 6, latency: [80, 200], failOn: [1, 2], data: { swell: moderate } }
prompt: |
  **Write `request_with_retry(resource, attempts=4)`: if the server fails with `503`, wait and ask again, each time twice as long (100 ms, 200 ms, 400 ms…), up to `attempts` requests in total.**

  The swell is reported by the Harbour Master's office (the Capitanía de Puerto), and its server goes down right when there are the most queries. Retrying on the spot makes it worse: every robot in the port lands on it at once. That's why you wait, and longer each time: that's **exponential backoff**.

  - A `503` is retried. If the last attempt fails too, raise that error (`raise`).
  - A `404` says the resource doesn't exist: retrying is pointless, raise it straight away.

  The end of the program is already written.
visual:
  figure:
    title: It fails twice, the third time it answers
    panes:
      - { cards: [{ title: "attempt 1", rows: [["answers", "503 ✗"], ["then", "waits 100 ms"]] }, { title: "attempt 2", rows: [["answers", "503 ✗"], ["then", "waits 200 ms"]] }, { title: "attempt 3", rows: [["answers", "\"moderate\" ✓"], ["then", "returns it"]] }] }
starter: |
  import asyncio

  async def request_with_retry(resource, attempts=4):
      return await workshop.request(resource)

  async def main():
      try:
          swell = await request_with_retry("swell")
          print(f"Swell: {swell}")
      except ServerError as error:
          print(f"No data: {error.status}")

  asyncio.run(main())
solution: |
  import asyncio

  async def request_with_retry(resource, attempts=4):
      wait = 0.1
      for attempt in range(1, attempts + 1):
          try:
              return await workshop.request(resource)
          except ServerError as error:
              if error.status == 404 or attempt == attempts:
                  raise
              await asyncio.sleep(wait)
              wait *= 2

  async def main():
      try:
          swell = await request_with_retry("swell")
          print(f"Swell: {swell}")
      except ServerError as error:
          print(f"No data: {error.status}")

  asyncio.run(main())
hints:
  - "A `for attempt in range(1, attempts + 1):` with `try: return await workshop.request(resource)` inside: it leaves as soon as it works."
  - "In the `except ServerError as error:`, `raise` if it's a `404` or the last attempt; otherwise, `await asyncio.sleep(wait)` and double `wait`."
tests:
  - name: waits twice as long each time
    state: all(s.requests[i].start - s.requests[i - 1].end == 100 * 2 ** (i - 1) for i in range(1, len(s.requests)))
    msg: After the first failure wait 100 ms; after the second, 200; then 400.
scenarios:
  - tests:
      - name: fails twice and the third time gets the swell
        output: "Swell: moderate"
      - name: asks exactly 3 times
        state: len(s.requests) == 3
  - server: { failOn: [1, 2, 3, 4, 5, 6, 7] }
    tests:
      - name: with the Harbour Master down, it gives up with the error
        output: "No data: 503"
      - name: tries 4 times, not one more
        state: len(s.requests) == 4
  - server: { failOn: [], data: { tide: low } }
    tests:
      - name: a resource that doesn't exist isn't retried
        output: "No data: 404"
      - name: asks only once
        state: len(s.requests) == 1
```

```exercise
id: py18-arregla-semaforo
type: fix
title: The antenna that ran out of slots
server: { seed: 12, latency: [100, 300], data: { "STS-1": "06:10", "STS-2": "06:45", "STS-3": "07:20", "STS-4": "07:55", "STS-5": "08:30" } }
globals:
  cranes: ["STS-1", "STS-2", "STS-3", "STS-4", "STS-5"]
prompt: |
  **Fix `query` so the program finishes, with never more than 2 queries at a time.**

  The tower's antenna can only handle two simultaneous queries. That's what **`asyncio.Semaphore(2)`** is for: a counter of free places. `await quota.acquire()` takes a place (or waits for one to free up) and `quota.release()` gives it back. This program gets the first two answers and then hangs forever. Run it and read the message.
visual:
  figure:
    panes:
      - { label: "antenna places", cells: ["STS-1", "STS-2"], index: false }
      - { label: "waiting for a place", cells: ["STS-3", "STS-4", "STS-5"], index: false }
    caption: If nobody gives their place back, the three on the right wait forever.
starter: |
  import asyncio

  async def query(crane, quota):
      await quota.acquire()
      slot = await workshop.request(crane)
      return slot

  async def main():
      quota = asyncio.Semaphore(2)
      slots = await asyncio.gather(*(query(crane, quota) for crane in cranes))
      print(slots)

  asyncio.run(main())
solution: |
  import asyncio

  async def query(crane, quota):
      async with quota:
          return await workshop.request(crane)

  async def main():
      quota = asyncio.Semaphore(2)
      slots = await asyncio.gather(*(query(crane, quota) for crane in cranes))
      print(slots)

  asyncio.run(main())
hints:
  - Every `acquire()` needs its `release()`, or the place never comes back.
  - "`async with quota:` takes the place on the way in and gives it back on the way out, even if there's an error or a `return`."
tests:
  - name: prints the five slots
    output: "['06:10', '06:45', '07:20', '07:55', '08:30']"
  - name: never more than 2 queries at a time
    state: max(sum(1 for o in s.requests if o.start <= r.start < o.end) for r in s.requests) == 2
    msg: The antenna handles two simultaneous queries, not one more.
```

```exercise
id: py18-completa-cola
type: complete
title: The truck and the two cranes
prompt: |
  **Fill in the `___` so a truck leaves containers in a queue and two cranes unload them, each at its own pace.**

  An **`asyncio.Queue`** connects whoever produces with whoever consumes: `await queue.put(x)` leaves something, `await queue.get()` takes it out (or waits until there is something), `queue.task_done()` says that one is finished and `await queue.join()` waits until **everything** that went in is finished. A container arrives every 100 ms, and each crane takes 250 ms to unload one.
visual:
  figure:
    input: { label: "the truck brings", cells: ["MSKU-1", "CMAU-2", "HLXU-3", "TGHU-4", "MRKU-5"] }
    arrow: "queue → whichever crane is free"
    output: { label: unloaded, table: { head: ["ms", "crane", "container"], rows: [["350", "STS-1", "MSKU-1"], ["450", "STS-2", "CMAU-2"], ["600", "STS-1", "HLXU-3"], ["…", "…", "…"]] } }
starter: |
  import asyncio

  async def truck(queue, containers):
      for code in containers:
          await asyncio.sleep(0.1)
          await queue.___(code)

  async def crane(name, queue, unloaded):
      while True:
          code = await queue.___()
          await asyncio.sleep(0.25)
          unloaded.append(f"{name} {code}")
          queue.___()

  async def main():
      queue = asyncio.Queue()
      unloaded = []
      cranes = [asyncio.create_task(crane(name, queue, unloaded)) for name in ["STS-1", "STS-2"]]
      await truck(queue, ["MSKU-1", "CMAU-2", "HLXU-3", "TGHU-4", "MRKU-5"])
      await queue.___()
      for task in cranes:
          task.cancel()
      return unloaded

  unloaded = asyncio.run(main())
  print(unloaded)
solution: |
  import asyncio

  async def truck(queue, containers):
      for code in containers:
          await asyncio.sleep(0.1)
          await queue.put(code)

  async def crane(name, queue, unloaded):
      while True:
          code = await queue.get()
          await asyncio.sleep(0.25)
          unloaded.append(f"{name} {code}")
          queue.task_done()

  async def main():
      queue = asyncio.Queue()
      unloaded = []
      cranes = [asyncio.create_task(crane(name, queue, unloaded)) for name in ["STS-1", "STS-2"]]
      await truck(queue, ["MSKU-1", "CMAU-2", "HLXU-3", "TGHU-4", "MRKU-5"])
      await queue.join()
      for task in cranes:
          task.cancel()
      return unloaded

  unloaded = asyncio.run(main())
  print(unloaded)
hints:
  - "The truck **puts** (`put`) and the crane **gets** (`get`)."
  - "Without `task_done()`, `join()` never learns the container is already down, and the program keeps waiting."
tests:
  - name: the two cranes share the five containers
    run: unloaded
    equals: ["STS-1 MSKU-1", "STS-2 CMAU-2", "STS-1 HLXU-3", "STS-2 TGHU-4", "STS-1 MRKU-5"]
  - name: waits for the queue with join
    source: 'await\s+queue\.join\(\)'
```

## The case

```exercise
id: py18-caso-grua
type: case
title: The crane that waited too long
prompt: |
  **Work out how long each terminal robot should have waited for its slots, asking for them all at once within what its antenna can handle, and print one line per robot to compare it with what it reported.**

  The *Mama Ocllo* sailed half an hour late, and the shipping line wants to know why. Four terminal robots asked the tower for their cranes' slots, and all four swear they asked for everything **at once**, with as many simultaneous queries as their antenna can handle (`capacity`). The tower wrote down how long it took to answer for each crane. One of them actually asked crane by crane, and its report gives it away.

  `query(crane)` is already written: it waits as long as the tower took with that crane. Simulate each robot with a `Semaphore(capacity)` and `gather`, measure the time with the loop's clock and print, for example, `print(f"Ancla: {ms} ms")`.
visual:
  board:
    for: py18-caso-grua
    title: What each terminal robot reported
    task: Simulate each robot's requests all at once, with its antenna's capacity, and compare the time with its report.
    cards:
      - { name: Ancla, kind: robot, role: "Terminal 1", rows: [["Cranes", "STS-1, STS-2, STS-3"], ["Antenna", "3 at a time"], ["Reported", "410 ms"]], clue: { find: "Ancla", says: 410 } }
      - { name: Boya, kind: robot, role: "Terminal 2", rows: [["Cranes", "STS-4, STS-5, STS-6, STS-7"], ["Antenna", "1 at a time"], ["Reported", "1010 ms"]], clue: { find: "Boya", says: 1010 } }
      - { name: Faro, kind: robot, role: "Terminal 3", rows: [["Cranes", "STS-2, STS-5, STS-8, STS-9, STS-3"], ["Antenna", "2 at a time"], ["Reported", "730 ms"]], clue: { find: "Faro", says: 730 } }
      - { name: Gaviota, kind: robot, role: "Terminal 4", culprit: true, rows: [["Cranes", "STS-6, STS-1, STS-9, STS-4"], ["Antenna", "4 at a time"], ["Reported", "1160 ms"]], clue: { find: "Gaviota", says: 1160 } }
      - { name: The tower, kind: note, role: "How long it took with each crane", rows: [["STS-1", "320 ms"], ["STS-2", "180 ms"], ["STS-3", "410 ms"], ["STS-4", "150 ms"], ["STS-5", "260 ms"], ["STS-6", "390 ms"], ["STS-7", "210 ms"], ["STS-8", "140 ms"], ["STS-9", "300 ms"]] }
    caption: "**It adds up**: the report is what asking all at once takes. If it doesn't add up, that robot waited too long."
globals:
  delays: { "STS-1": 320, "STS-2": 180, "STS-3": 410, "STS-4": 150, "STS-5": 260, "STS-6": 390, "STS-7": 210, "STS-8": 140, "STS-9": 300 }
  robots:
    Ancla: { cranes: ["STS-1", "STS-2", "STS-3"], capacity: 3 }
    Boya: { cranes: ["STS-4", "STS-5", "STS-6", "STS-7"], capacity: 1 }
    Faro: { cranes: ["STS-2", "STS-5", "STS-8", "STS-9", "STS-3"], capacity: 2 }
    Gaviota: { cranes: ["STS-6", "STS-1", "STS-9", "STS-4"], capacity: 4 }
starter: |
  import asyncio

  # delays: {"STS-1": 320, ...}  ms the tower took with each crane
  # robots: {"Ancla": {"cranes": ["STS-1", ...], "capacity": 3}, ...}
  async def query(crane):
      await asyncio.sleep(delays[crane] / 1000)

  # TODO: a coroutine that, for one robot, asks for all its cranes at once
  # (gather) without going over its capacity (Semaphore) and returns how many ms it took:
  # loop = asyncio.get_running_loop(); start = loop.time() ...
  # Then, for each robot: print(f"{name}: {ms} ms")
solution: |
  import asyncio

  async def query(crane):
      await asyncio.sleep(delays[crane] / 1000)

  async def with_place(crane, places):
      async with places:
          await query(crane)

  async def time_for(cranes, capacity):
      loop = asyncio.get_running_loop()
      start = loop.time()
      semaphore = asyncio.Semaphore(capacity)
      await asyncio.gather(*(with_place(crane, semaphore) for crane in cranes))
      return round((loop.time() - start) * 1000)

  for name, data in robots.items():
      ms = asyncio.run(time_for(data["cranes"], data["capacity"]))
      print(f"{name}: {ms} ms")
answer: Gaviota
answerLabel: Which robot waited too long?
reveal: |
  Gaviota. With its 4-place antenna, asking for its four cranes at once takes as long as the slowest one, STS-6: **390 ms**. It reported 1160, which is 390 + 320 + 300 + 150: the sum, crane by crane. Boya also took the sum, but its antenna handles one query at a time: it couldn't do anything else. And Faro, with 2 places, takes neither the sum (1290) nor the slowest one (410): 730, what the simulation gives.
hints:
  - "A coroutine `with_place(crane, semaphore)` with `async with semaphore: await query(crane)`, and `await asyncio.gather(*(with_place(c, semaphore) for c in cranes))` launches them all."
  - "Measure with `loop.time()` before and after, and `round((end - start) * 1000)` turns it into milliseconds. Call `asyncio.run(...)` once per robot."
```

## The judge

These judges call `async` functions: the judge runs the coroutine and compares what it returns. Each case has its own tower, with the clock at 0 and the same delays and failures: **request number n of each case always takes the same time**, whoever asks. That's why you also return `workshop.now()`: if you ask too much or wait too long, it shows.

```exercise
id: py18-juez-plazo
type: judge
mode: function
function: crane_slots
server: { seed: 18, latency: [120, 480], data: { "STS-1": "06:10", "STS-2": "06:45", "STS-3": "07:20", "STS-4": "07:55", "STS-5": "08:30", "STS-6": "09:05", "STS-7": "09:40", "STS-8": "10:15" } }
title: The slots before the deadline
prompt: |
  **Write `async def crane_slots(cranes, deadline, capacity)`, which asks the tower for each crane's slot, all at once and without going over `capacity` simultaneous queries, and returns `[slots, ms]`.**

  - `slots` has, in the order of `cranes`, each one's slot (`await workshop.request("STS-3")` → `"07:20"`), or `"tarde"` ("late", the tower's log is in Spanish) if the tower didn't answer within `deadline` milliseconds.
  - The deadline runs **from when the query goes out**, not while it waits for a place on the antenna.
  - `ms` is `workshop.now()` once you have all the slots.

  Gladys needs the schedule fast: one slow query can't keep the others waiting.

  **Constraints:** 0 to 8 cranes, no repeats · 150 ≤ `deadline` ≤ 500 · 1 ≤ `capacity` ≤ 4 · the tower takes between 120 and 480 ms per query.
visual:
  figure:
    title: Example 1, query by query
    input: { label: 'crane_slots(["STS-1", "STS-2", "STS-3"], 400, 2)', text: "           0    100  200  300  400  500  600\nSTS-1      █████████████▌               263 ms ✓\nSTS-2      ███████████████▌             309 ms ✓\nSTS-3                   ████████████████████|  goes out at 263, cut off at 663" }
    arrow: the third waits for a place and then misses the deadline
    output: { label: returns, value: '[["06:10", "06:45", "tarde"], 663]' }
    steps:
      - "With capacity 2, STS-1 and STS-2 go out. STS-3 goes out when STS-1 gives its place back, at 263 ms."
      - "The tower would take 409 ms with STS-3: it misses the 400 deadline, which cuts it off at 263 + 400 = 663."
starter: |
  import asyncio

  async def crane_slots(cranes, deadline, capacity):
      return [[], 0]
solution: |
  import asyncio

  async def slot_in_time(crane, deadline, semaphore):
      async with semaphore:
          try:
              async with asyncio.timeout(deadline / 1000):
                  return await workshop.request(crane)
          except TimeoutError:
              return "tarde"

  async def crane_slots(cranes, deadline, capacity):
      semaphore = asyncio.Semaphore(capacity)
      slots = await asyncio.gather(*(slot_in_time(crane, deadline, semaphore) for crane in cranes))
      return [slots, workshop.now()]
hints:
  - "One coroutine per crane: `async with semaphore:` on the outside and, inside, `async with asyncio.timeout(deadline / 1000):` around the `await workshop.request(crane)`."
  - "Catch the `TimeoutError` inside that coroutine and return `\"tarde\"`: that way one slow request doesn't bring down the others. Then, `await asyncio.gather(*(…))`."
samples:
  - args: [["STS-1", "STS-2", "STS-3"], 400, 2]
    note: "The picture above."
  - args: [["STS-5", "STS-2", "STS-8", "STS-1"], 300, 4]
    note: "All four go out at 0 ms. The tower takes 263, 309, 409 and 377 ms: only the first arrives within 300."
edge:
  - args: [[], 300, 2]
    tag: with no cranes
  - args: [["STS-4"], 500, 1]
    tag: with a single crane
  - args: [["STS-1", "STS-2", "STS-3", "STS-4", "STS-5", "STS-6", "STS-7", "STS-8"], 150, 4]
    tag: when none arrives in time
  - args: [["STS-8", "STS-7", "STS-6", "STS-5", "STS-4", "STS-3", "STS-2", "STS-1"], 500, 1]
    tag: with capacity 1, one by one
  - args: [["STS-2", "STS-6", "STS-3"], 450, 4]
    tag: with more places than cranes
random:
  count: 40
  seed: 81
  generate: |
    cranes = rng.shuffle(["STS-1", "STS-2", "STS-3", "STS-4", "STS-5", "STS-6", "STS-7", "STS-8"])[:rng.int(1, 8)]
    return [cranes, rng.pick([150, 200, 250, 300, 350, 400, 450, 500]), rng.int(1, 4)]
wrong:
  - |
    import asyncio
    async def crane_slots(cranes, deadline, capacity):
        slots = []
        for crane in cranes:
            try:
                async with asyncio.timeout(deadline / 1000):
                    slots.append(await workshop.request(crane))
            except TimeoutError:
                slots.append("tarde")
        return [slots, workshop.now()]
  - |
    import asyncio
    async def slot_in_time(crane, deadline, semaphore):
        await semaphore.acquire()
        try:
            async with asyncio.timeout(deadline / 1000):
                return await workshop.request(crane)
        except TimeoutError:
            return "tarde"
    async def crane_slots(cranes, deadline, capacity):
        semaphore = asyncio.Semaphore(capacity)
        slots = await asyncio.gather(*(slot_in_time(crane, deadline, semaphore) for crane in cranes))
        return [slots, workshop.now()]
```

```exercise
id: py18-juez-paciencia
type: judge
mode: function
function: patient_slots
server: { seed: 23, latency: [80, 260], failRate: 0.4, data: { "STS-1": "06:10", "STS-2": "06:45", "STS-3": "07:20", "STS-4": "07:55", "STS-5": "08:30", "STS-6": "09:05", "STS-7": "09:40", "STS-8": "10:15" } }
title: One by one, with patience
prompt: |
  **Write `async def patient_slots(cranes, attempts)`, which asks for each crane's slot, one by one, retrying with exponential backoff, and returns `[slots, ms]`.**

  Today the tower is in a bad mood: it fails often, and the antenna only allows one query at a time. For each crane, in the order of `cranes`:

  - **503**: wait and ask for it again. The first wait is 100 ms and each one doubles the previous (100, 200, 400…), and it starts again at 100 with the next crane. At most `attempts` requests per crane; if they all fail, its slot is `"sin señal"` ("no signal", in the tower's Spanish).
  - **404**: that crane doesn't exist, don't retry. Its slot is `"no existe"` ("doesn't exist").

  `ms` is `workshop.now()` at the end. The next crane is requested as soon as the previous one is done.

  **Constraints:** 0 to 6 cranes · 1 ≤ `attempts` ≤ 5.
visual:
  figure:
    title: Example 1, request by request
    input: { label: 'patient_slots(["STS-2", "STS-9"], 4)', table: { head: ["request", "crane", "takes", "answers", "then"], rows: [["1", "STS-2", "97", "503", "waits 100"], ["2", "STS-2", "194", "503", "waits 200"], ["3", "STS-2", "138", "503", "waits 400"], ["4", "STS-2", "172", "\"06:45\"", "next"], ["5", "STS-9", "229", "503", "waits 100"], ["6", "STS-9", "208", "503", "waits 200"], ["7", "STS-9", "96", "404", "doesn't exist"]] } }
    arrow: adds up times and waits
    output: { label: returns, value: '[["06:45", "no existe"], 2134]' }
starter: |
  import asyncio

  async def patient_slots(cranes, attempts):
      return [[], 0]
solution: |
  import asyncio

  async def slot_for(crane, attempts):
      wait = 0.1
      for attempt in range(1, attempts + 1):
          try:
              return await workshop.request(crane)
          except ServerError as error:
              if error.status == 404:
                  return "no existe"
              if attempt < attempts:
                  await asyncio.sleep(wait)
                  wait *= 2
      return "sin señal"

  async def patient_slots(cranes, attempts):
      slots = []
      for crane in cranes:
          slots.append(await slot_for(crane, attempts))
      return [slots, workshop.now()]
hints:
  - "Write `slot_for(crane, attempts)` with a `for` over the attempts and `try: return await workshop.request(crane)`; in the `except ServerError as error:`, look at `error.status`."
  - "After the last failed attempt there's no waiting: return `\"sin señal\"` straight away. And the wait starts at `0.1` inside `slot_for`, so each crane starts afresh."
samples:
  - args: [["STS-2", "STS-9"], 4]
    note: "STS-9 doesn't exist, but the first two requests fail with 503 before the tower says so."
  - args: [["STS-5", "STS-1", "STS-3"], 2]
    note: "STS-5 fails twice: with 2 attempts, it ends up with no signal."
edge:
  - args: [[], 3]
    tag: with no cranes
  - args: [["STS-4"], 1]
    tag: with a single attempt
  - args: [["STS-12", "STS-9"], 5]
    tag: with cranes that don't exist
  - args: [["STS-1", "STS-2", "STS-3", "STS-4", "STS-5", "STS-6"], 5]
    tag: with many cranes and patience
  - args: [["STS-7", "STS-7", "STS-8"], 3]
    tag: with a repeated crane
random:
  count: 40
  seed: 88
  generate: |
    pool = ["STS-1", "STS-2", "STS-3", "STS-4", "STS-5", "STS-6", "STS-7", "STS-8", "STS-9", "STS-12"]
    return [rng.shuffle(pool)[:rng.int(1, 6)], rng.int(1, 5)]
wrong:
  - |
    import asyncio
    async def slot_for(crane, attempts):
        for attempt in range(1, attempts + 1):
            try:
                return await workshop.request(crane)
            except ServerError as error:
                if error.status == 404:
                    return "no existe"
                await asyncio.sleep(0.1 if attempt < attempts else 0)
        return "sin señal"
    async def patient_slots(cranes, attempts):
        return [[await slot_for(crane, attempts) for crane in cranes], workshop.now()]
  - |
    import asyncio
    async def slot_for(crane):
        wait = 0.1
        while True:
            try:
                return await workshop.request(crane)
            except ServerError as error:
                if error.status == 404:
                    return "no existe"
                await asyncio.sleep(wait)
                wait *= 2
    async def patient_slots(cranes, attempts):
        return [[await slot_for(crane) for crane in cranes], workshop.now()]
  - |
    import asyncio
    async def slot_for(crane, attempts):
        wait = 0.1
        for attempt in range(1, attempts + 1):
            try:
                return await workshop.request(crane)
            except ServerError:
                if attempt < attempts:
                    await asyncio.sleep(wait)
                    wait *= 2
        return "sin señal"
    async def patient_slots(cranes, attempts):
        return [[await slot_for(crane, attempts) for crane in cranes], workshop.now()]
```

## Final mission

```exercise
id: py18-mision-muelle
type: mission
title: The loading order
prompt: |
  **Ask the tower for the list of containers and, all at once, for each one's slot; then take Quilla to the loading point (D) and deliver the containers in the order of their slots.**

  - `await workshop.request("orders")` → the list of codes, like `["MSKU-204", "CMAU-118"]`.
  - `await workshop.request("MSKU-204")` → its slot, like `"08:15"`. `"HH:MM"` slots sort correctly as text.
  - A `404` means that container is **held at customs**: it isn't delivered, and Quilla warns with `robot.say(f"Held: {code}")`.
  - The tower fails often: on a `503`, retry with exponential backoff (100 ms, 200 ms, 400 ms…), up to 5 attempts.
  - To reach D: move forward to the wall, turn right and move forward to the wall. Each delivery's label is `f"{code} {slot}"`.

  The containers, the slots, the failures and the pier change in every test.
visual:
  figure:
    title: The first test
    panes:
      - { label: "orders", cells: ["MSKU-204", "CMAU-118", "HLXU-771"] }
      - { label: "slots (requested all at once)", cards: [{ title: slots, rows: [["MSKU-204", "\"08:15\""], ["CMAU-118", "\"07:40\""], ["HLXU-771", "\"09:05\""]] }] }
      - { label: "deliveries, by slot", cells: ["CMAU-118 07:40", "MSKU-204 08:15", "HLXU-771 09:05"] }
starter: |
  import asyncio

  async def request_with_retry(resource, attempts=5):
      # TODO: retry 503s waiting 100, 200, 400… ms; a 404 is raised straight away
      return await workshop.request(resource)

  async def main():
      codes = await request_with_retry("orders")
      # TODO: ask for every code's slot at once (TaskGroup or gather)
      # TODO: walk to D and deliver in slot order; warn about the held ones

  asyncio.run(main())
solution: |
  import asyncio

  async def request_with_retry(resource, attempts=5):
      wait = 0.1
      for attempt in range(1, attempts + 1):
          try:
              return await workshop.request(resource)
          except ServerError as error:
              if error.status == 404 or attempt == attempts:
                  raise
              await asyncio.sleep(wait)
              wait *= 2

  async def slot_or_held(code):
      try:
          return await request_with_retry(code)
      except ServerError as error:
          if error.status == 404:
              return None
          raise

  def walk_to_the_wall():
      while not robot.wall_ahead("front"):
          robot.forward()

  async def main():
      codes = await request_with_retry("orders")
      slots = await asyncio.gather(*(slot_or_held(code) for code in codes))
      cargo = []
      for code, slot in zip(codes, slots):
          if slot is None:
              robot.say(f"Held: {code}")
          else:
              cargo.append((slot, code))
      walk_to_the_wall()
      robot.turn_right()
      walk_to_the_wall()
      for slot, code in sorted(cargo):
          robot.deliver(f"{code} {slot}")

  asyncio.run(main())
hints:
  - "A coroutine `slot_or_held(code)` that calls `request_with_retry` and, if it catches a `ServerError` with `status == 404`, returns `None`. Launch them all with `asyncio.gather(*(…))`."
  - "Gather `(slot, code)` for the ones that aren't `None` and go through them with `sorted(...)`: it sorts by slot."
world:
  theme: barranco
  level: 2
  dir: E
  map: |
    ############
    #R........##
    #########.##
    #########D##
    ############
server:
  seed: 31
  latency: [100, 300]
  failOn: [1, 3]
  data:
    orders: ["MSKU-204", "CMAU-118", "HLXU-771"]
    "MSKU-204": "08:15"
    "CMAU-118": "07:40"
    "HLXU-771": "09:05"
scenarios:
  - tests:
      - name: delivers the three containers in slot order
        state: 'w.delivered == ["CMAU-118 07:40", "MSKU-204 08:15", "HLXU-771 09:05"]'
        msg: Deliver each container with its slot, from the earliest to the latest.
  - map: |
      #########
      #R....###
      #####.###
      #####.###
      #####D###
      #########
    server:
      failOn: [2, 3, 6]
      data:
        orders: ["TGHU-330", "MRKU-512", "SEGU-907", "CAIU-246"]
        "TGHU-330": "06:50"
        "SEGU-907": "06:20"
        "CAIU-246": "10:30"
    tests:
      - name: delivers three and leaves the held one
        state: 'w.delivered == ["SEGU-907 06:20", "TGHU-330 06:50", "CAIU-246 10:30"]'
      - name: warns about the held container
        state: '"Held: MRKU-512" in w.said'
tests:
  - name: asks for the slots all at once
    state: 'len({min(r.start for r in s.requests if r.resource == c) for c in {r.resource for r in s.requests} - {"orders"}}) == 1'
    msg: Each slot's first request should go out at the same instant, as soon as the list arrives.
  - name: retries with exponential backoff
    state: 'all(q[i].start - q[i - 1].end == 100 * 2 ** (i - 1) for c in {r.resource for r in s.requests} for q in [[r for r in s.requests if r.resource == c]] for i in range(1, len(q)))'
    msg: After each 503, wait 100 ms, then 200, then 400, before asking for the same thing again.
  - name: without crashing
    state: not w.crashed
  - name: uses gather or TaskGroup
    source: 'gather\(|TaskGroup\(\)'
```

## Expert challenge

```exercise
id: py18-reto-gruas
type: challenge
title: How many cranes does it take?
prompt: |
  **Write `async def total_time(durations, k)`, which simulates `k` cranes taking containers from the same `asyncio.Queue` and returns how many ms they take to finish, and `cranes_needed(durations, limit)`, which returns the smallest number of cranes that finish in `limit` ms or less, or `-1` if not even one crane per container is enough.** For people who already code.

  All the containers are in the queue from ms 0, in the order of `durations`; `durations[i]` is how long container `i` takes to unload. Each crane takes the next one as soon as it's free. `cranes_needed` isn't `async`: it calls `asyncio.run` for each `k` it tries.
starter: |
  import asyncio

  async def total_time(durations, k):
      return 0

  def cranes_needed(durations, limit):
      return -1

  print(cranes_needed([300, 200, 400, 100], 600))
solution: |
  import asyncio

  async def crane(queue):
      while True:
          ms = await queue.get()
          await asyncio.sleep(ms / 1000)
          queue.task_done()

  async def total_time(durations, k):
      loop = asyncio.get_running_loop()
      start = loop.time()
      queue = asyncio.Queue()
      for ms in durations:
          queue.put_nowait(ms)
      cranes = [asyncio.create_task(crane(queue)) for _ in range(k)]
      await queue.join()
      for task in cranes:
          task.cancel()
      return round((loop.time() - start) * 1000)

  def cranes_needed(durations, limit):
      for k in range(1, len(durations) + 1):
          if asyncio.run(total_time(durations, k)) <= limit:
              return k
      return -1

  print(cranes_needed([300, 200, 400, 100], 600))
hints:
  - "`total_time`: fill the queue with `put_nowait`, create `k` tasks that `get`, `sleep` and `task_done` in a loop, and wait with `await queue.join()`. Don't forget to cancel the tasks at the end."
tests:
  - name: two cranes for the example
    run: cranes_needed([300, 200, 400, 100], 600)
    equals: 2
  - name: the time with two cranes
    run: asyncio.run(total_time([300, 200, 400, 100], 2))
    equals: 600
  - name: the queue's order matters
    run: asyncio.run(total_time([100, 100, 500, 500], 2))
    equals: 600
  - name: impossible if a single container already goes over
    run: cranes_needed([200, 700], 600)
    equals: -1
  - name: with no containers there's no need to wait
    run: asyncio.run(total_time([], 3))
    equals: 0
  - name: uses an asyncio.Queue
    source: 'asyncio\.Queue\('
```
