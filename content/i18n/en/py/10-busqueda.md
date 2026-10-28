# Session 10 — Search

## The job

Iquitos, March, the river at its highest. The Itaya has risen so much that in Belén Bajo the streets are canals: people get around by canoe, the houses float on their rafts and the only dry things left are the plank bridges the neighbours nail from house to house. **Delia Tapullima**, the nurse at the health post, is waiting for a cool box of vaccines that came on the launch from Yurimaguas and can't spend long out of the cold.

Maru sent Quilla, which already has a siren to clear the way, but there's a problem: the bridges change every week (one rots, another gets nailed in new) and the battery is enough for **exactly** the shortest route. Trying planks at random won't do. Today Quilla learns to **search**: to explore the map in waves until it finds the shortest way, and to search fast in a sorted list.

```scene
theme: barranco
level: 2
dir: S
api: [move, deliver, path]
caption: The bridges of Belén Bajo. Quilla follows the shortest route, plank by plank, to the health post (D).
map: |
  ###########
  #R..#.....#
  #.#.#.###.#
  #.#...#...#
  #.#####.#.#
  #.......#D#
  ###########
program: |
  robot.follow_path(["S"] * 4 + ["E"] * 6 + ["N"] * 2 + ["E"] * 2 + ["S"] * 2)
  robot.deliver("vaccines")
```

## The minimum

**Breadth-first search** (BFS) explores like the ripples from a stone dropped in the river: first every tile 1 step away, then every one 2 away, then 3… The first time the wave touches the goal, it got there by the shortest way. It needs two pieces:

- a **queue**, `collections.deque`: you add at the end with `append` and take from the front with `popleft`. The first tile in is the first tile out;
- a **set** of seen tiles, `visited`, with `(x, y)` tuples, so the same one never goes in twice.

```py run
from collections import deque

queue = deque(["Delia", "Waldir"])
queue.append("Nilda")
print(queue.popleft(), queue)
```

The first line, `from collections import deque`, is the first time you use an `import`. Python comes with many tools already installed, the **standard library**, but it doesn't load them until you ask: `collections` is a **module** (a Python file) and `from collections import deque` brings in only the `deque` piece. With `import collections` you'd bring in the whole module and write `collections.deque`. In session 19 you'll see where Python looks and how to make your own modules.

Watch the wave on a 3 × 3 map with a house in the middle: the queue (the edge) moves forward and what's been seen gets painted.

```anim
title: The BFS wave
code: |
  from collections import deque
  plan = ["...", ".#.", "..."]
  queue = deque([(0, 0)])
  visited = {(0, 0)}
  while queue:
      x, y = queue.popleft()
      for nx, ny in [(x + 1, y), (x, y + 1), (x - 1, y), (x, y - 1)]:
          inside = 0 <= nx < 3 and 0 <= ny < 3
          if inside and plan[ny][nx] == "." and (nx, ny) not in visited:
              visited.add((nx, ny))
              queue.append((nx, ny))
  print(len(visited))
grid: { map: ["...", ".#.", "..."], visited: visited, frontier: queue }
show: [x, y, queue, visited]
speed: 700
steps:
  - {"line": 4, "vars": {"queue": ["0,0"], "visited": ["0,0"]}, "reprs": {"queue": "deque([(0, 0)])", "visited": "{(0, 0)}"}, "note": "The wave starts at (0, 0): it is in the queue and already counts as visited."}
  - {"line": 6, "vars": {"queue": [], "visited": ["0,0"], "x": 0, "y": 0}, "reprs": {"queue": "deque([])", "visited": "{(0, 0)}", "x": "0", "y": "0"}, "note": "Out of the queue comes the tile that has been waiting longest."}
  - {"line": 11, "vars": {"queue": ["1,0"], "visited": ["0,0", "1,0"], "x": 0, "y": 0}, "reprs": {"queue": "deque([(1, 0)])", "visited": "{(0, 0), (1, 0)}", "x": "0", "y": "0"}, "note": "A free, new neighbour: it is marked as visited when it enters the queue, not when it leaves."}
  - {"line": 11, "vars": {"queue": ["1,0", "0,1"], "visited": ["0,0", "1,0", "0,1"], "x": 0, "y": 0}, "reprs": {"queue": "deque([(1, 0), (0, 1)])", "visited": "{(0, 0), (1, 0), (0, 1)}", "x": "0", "y": "0"}, "note": "A free, new neighbour: it is marked as visited when it enters the queue, not when it leaves."}
  - {"line": 6, "vars": {"queue": ["0,1"], "visited": ["0,0", "1,0", "0,1"], "x": 1, "y": 0}, "reprs": {"queue": "deque([(0, 1)])", "visited": "{(0, 0), (1, 0), (0, 1)}", "x": "1", "y": "0"}}
  - {"line": 11, "vars": {"queue": ["0,1", "2,0"], "visited": ["0,0", "1,0", "2,0", "0,1"], "x": 1, "y": 0}, "reprs": {"queue": "deque([(0, 1), (2, 0)])", "visited": "{(0, 0), (1, 0), (2, 0), (0, 1)}", "x": "1", "y": "0"}}
  - {"line": 6, "vars": {"queue": ["2,0"], "visited": ["0,0", "1,0", "2,0", "0,1"], "x": 0, "y": 1}, "reprs": {"queue": "deque([(2, 0)])", "visited": "{(0, 0), (1, 0), (2, 0), (0, 1)}", "x": "0", "y": "1"}}
  - {"line": 11, "vars": {"queue": ["2,0", "0,2"], "visited": ["0,0", "1,0", "2,0", "0,1", "0,2"], "x": 0, "y": 1}, "reprs": {"queue": "deque([(2, 0), (0, 2)])", "visited": "{(0, 0), (1, 0), (2, 0), (0, 1), (0, 2)}", "x": "0", "y": "1"}}
  - {"line": 6, "vars": {"queue": ["0,2"], "visited": ["0,0", "1,0", "2,0", "0,1", "0,2"], "x": 2, "y": 0}, "reprs": {"queue": "deque([(0, 2)])", "visited": "{(0, 0), (1, 0), (2, 0), (0, 1), (0, 2)}", "x": "2", "y": "0"}}
  - {"line": 11, "vars": {"queue": ["0,2", "2,1"], "visited": ["0,0", "1,0", "2,0", "0,1", "2,1", "0,2"], "x": 2, "y": 0}, "reprs": {"queue": "deque([(0, 2), (2, 1)])", "visited": "{(0, 0), (1, 0), (2, 0), (0, 1), (2, 1), (0, 2)}", "x": "2", "y": "0"}}
  - {"line": 6, "vars": {"queue": ["2,1"], "visited": ["0,0", "1,0", "2,0", "0,1", "2,1", "0,2"], "x": 0, "y": 2}, "reprs": {"queue": "deque([(2, 1)])", "visited": "{(0, 0), (1, 0), (2, 0), (0, 1), (2, 1), (0, 2)}", "x": "0", "y": "2"}}
  - {"line": 11, "vars": {"queue": ["2,1", "1,2"], "visited": ["0,0", "1,0", "2,0", "0,1", "2,1", "0,2", "1,2"], "x": 0, "y": 2}, "reprs": {"queue": "deque([(2, 1), (1, 2)])", "visited": "{(0, 0), (1, 0), (2, 0), (0, 1), (2, 1), (0, 2), (1, 2)}", "x": "0", "y": "2"}}
  - {"line": 6, "vars": {"queue": ["1,2"], "visited": ["0,0", "1,0", "2,0", "0,1", "2,1", "0,2", "1,2"], "x": 2, "y": 1}, "reprs": {"queue": "deque([(1, 2)])", "visited": "{(0, 0), (1, 0), (2, 0), (0, 1), (2, 1), (0, 2), (1, 2)}", "x": "2", "y": "1"}}
  - {"line": 11, "vars": {"queue": ["1,2", "2,2"], "visited": ["0,0", "1,0", "2,0", "0,1", "2,1", "0,2", "1,2", "2,2"], "x": 2, "y": 1}, "reprs": {"queue": "deque([(1, 2), (2, 2)])", "visited": "{(0, 0), (1, 0), (2, 0), (0, 1), (2, 1), (0, 2), (1, 2), (2, 2)}", "x": "2", "y": "1"}}
  - {"line": 6, "vars": {"queue": ["2,2"], "visited": ["0,0", "1,0", "2,0", "0,1", "2,1", "0,2", "1,2", "2,2"], "x": 1, "y": 2}, "reprs": {"queue": "deque([(2, 2)])", "visited": "{(0, 0), (1, 0), (2, 0), (0, 1), (2, 1), (0, 2), (1, 2), (2, 2)}", "x": "1", "y": "2"}}
  - {"line": 6, "vars": {"queue": [], "visited": ["0,0", "1,0", "2,0", "0,1", "2,1", "0,2", "1,2", "2,2"], "x": 2, "y": 2}, "reprs": {"queue": "deque([])", "visited": "{(0, 0), (1, 0), (2, 0), (0, 1), (2, 1), (0, 2), (1, 2), (2, 2)}", "x": "2", "y": "2"}}
  - {"line": 12, "vars": {"queue": [], "visited": ["0,0", "1,0", "2,0", "0,1", "2,1", "0,2", "1,2", "2,2"], "x": 2, "y": 2}, "reprs": {"queue": "deque([])", "visited": "{(0, 0), (1, 0), (2, 0), (0, 1), (2, 1), (0, 2), (1, 2), (2, 2)}", "x": "2", "y": "2"}, "note": "The wave covered all 8 free tiles.", "out": "8"}
```

To know **the route**, and not just how far the wave reaches, each tile writes down in a dictionary which tile it came from: its **parent**. The start has parent `None`. That dictionary also works as "visited": if a tile already has a parent, it has already gone into the queue. At the end you walk back from the goal, from parent to parent, and turn the list around:

```anim
title: Rebuilding the route, backwards from the goal
code: |
  parent = {(0, 0): None, (1, 0): (0, 0), (1, 1): (1, 0), (1, 2): (1, 1), (2, 2): (1, 2)}
  route = []
  tile = (2, 2)
  while tile is not None:
      route.append(tile)
      tile = parent[tile]
  route.reverse()
  print(route)
cells: { of: route }
show: [tile]
speed: 700
notes:
  3: "It starts at the goal, (2, 2)."
  6: "It jumps to the parent: where this tile came from."
  7: "The start had parent None: the loop stops there. The list came out backwards and gets flipped."
```

With the route in hand, **`robot.follow_path(route)`** walks it: it takes a list of neighbouring tiles `(x, y)` and turns only when it needs to (if the first one is the tile it's standing on, it skips it). `robot.mark(tiles)` paints tiles on the map without moving, so you can see what your search explored.

Today's other search is in a **sorted list**. To find a value you don't need to look at all of it: you look at the middle one and throw away the half where it can't be, again and again. That's **binary search**: in a thousand elements, about ten looks.

```anim
title: Binary search on the river marks
code: |
  levels = [112, 115, 119, 124, 126, 131, 138, 142]
  target = 131
  left, right = 0, len(levels) - 1
  position = -1
  while left <= right:
      mid = (left + right) // 2
      if levels[mid] == target:
          position = mid
          break
      elif levels[mid] < target:
          left = mid + 1
      else:
          right = mid - 1
  print(position)
cells: { of: levels, at: mid }
show: [left, right, mid, position]
speed: 900
notes:
  6: "It looks at the middle one of the stretch that's left."
  11: "124 is less than 131: so is everything to its left. That half is thrown away."
  8: "It found it at position 5 looking at only 2 cells out of 8."
```

Python already ships binary search in the **`bisect`** module. `bisect_left(items, value)` returns the first position where `value` could go without unsorting the list (before the equal ones); `bisect_right`, the one after the equal ones. If the position is `len(items)`, the value is greater than all of them.

```py run
from bisect import bisect_left, bisect_right

levels = [110, 115, 115, 115, 122, 130]
print(bisect_left(levels, 115), bisect_right(levels, 115))
print(bisect_left(levels, 120), bisect_left(levels, 200))
```

> **Common trap:** if you take out with `queue.pop()` instead of `queue.popleft()`, you take the **last** tile that went in. That's no longer a queue but a stack: the search goes down one corridor to the very end before trying another (depth-first search), and the first route it finds is hardly ever the shortest.

<!-- legacy: deque -->

<!-- mdn: deque bisect -->

## Practice

```exercise
id: py10-predice-deque
type: predict
title: The queue at the pier
prompt: |
  At the Belén pier the canoes wait their turn in a `deque`. What does it print?
code: |
  from collections import deque

  canoes = deque([1, 2])
  canoes.append(3)
  canoes.appendleft(0)
  first = canoes.popleft()
  last = canoes.pop()
  print(first, last, list(canoes))
options:
  - "0 3 [1, 2]"
  - "1 3 [0, 2]"
  - "0 2 [1, 3]"
  - "3 0 [1, 2]"
answer: "0 3 [1, 2]"
explain: |
  `appendleft(0)` puts the 0 at the front: `[0, 1, 2, 3]`. `popleft()` takes the front one (0) and `pop()` the back one (3). `[1, 2]` is left. BFS uses `append` and `popleft`: in at the back, out at the front.
```

```exercise
id: py10-predice-bisect
type: predict
title: The three marks
prompt: |
  Delia wrote down in a sorted list how high the river got each day. What does it print?
code: |
  from bisect import bisect_left, bisect_right

  heights = [2, 4, 4, 4, 7]
  print(bisect_left(heights, 4), bisect_right(heights, 4), bisect_left(heights, 5))
options:
  - "1 4 4"
  - "1 3 4"
  - "2 4 5"
  - "1 4 5"
answer: "1 4 4"
explain: |
  `bisect_left` gives the position **before** the 4s (position 1) and `bisect_right` the position **after** the last 4 (position 4). The 5 isn't there: it would go where the 7 is, at position 4.
```

```exercise
id: py10-arregla-padre
type: fix
title: The route that crashed at the end
prompt: |
  `shortest_path` searches fine, but it crashes right when rebuilding the route. Run it and read the error: which tile has no parent?

  Fix it so it returns the whole route, from start to goal, both included.
visual:
  figure:
    input: { label: "map, from (0, 0) to (2, 2)", grid: ["..#", "#..", "..."], path: ["0,0"] }
    arrow: BFS and parents
    output: { label: "[(0, 0), (1, 0), (1, 1), (2, 1), (2, 2)]", grid: ["..#", "#..", "..."], path: ["0,0", "1,0", "1,1", "2,1", "2,2"] }
starter: |
  from collections import deque


  def shortest_path(plan, start, goal):
      parent = {}
      visited = {start}
      queue = deque([start])
      while queue:
          x, y = queue.popleft()
          for neighbor in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]:
              nx, ny = neighbor
              inside = 0 <= ny < len(plan) and 0 <= nx < len(plan[0])
              if inside and plan[ny][nx] == "." and neighbor not in visited:
                  visited.add(neighbor)
                  parent[neighbor] = (x, y)
                  queue.append(neighbor)
      route = []
      tile = goal
      while tile is not None:
          route.append(tile)
          tile = parent[tile]
      route.reverse()
      return route


  print(shortest_path(["..#", "#..", "..."], (0, 0), (2, 2)))
solution: |
  from collections import deque


  def shortest_path(plan, start, goal):
      parent = {start: None}
      queue = deque([start])
      while queue:
          x, y = queue.popleft()
          for neighbor in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]:
              nx, ny = neighbor
              inside = 0 <= ny < len(plan) and 0 <= nx < len(plan[0])
              if inside and plan[ny][nx] == "." and neighbor not in parent:
                  parent[neighbor] = (x, y)
                  queue.append(neighbor)
      route = []
      tile = goal
      while tile is not None:
          route.append(tile)
          tile = parent[tile]
      route.reverse()
      return route


  print(shortest_path(["..#", "#..", "..."], (0, 0), (2, 2)))
hints:
  - "The backwards loop stops when it reaches a tile whose parent is `None`. Who should have that parent?"
  - "Start with `parent = {start: None}`. That way, `parent` also works as visited."
tests:
  - name: the route in the picture
    run: 'shortest_path(["..#", "#..", "..."], (0, 0), (2, 2))'
    equals: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]]
  - name: starts at the start and ends at the goal
    run: 'shortest_path(["....", ".##.", "...."], (0, 2), (3, 0))[::5]'
    equals: [[0, 2], [3, 0]]
  - name: the shortest has 6 tiles
    run: 'len(shortest_path(["....", ".##.", "...."], (0, 2), (3, 0)))'
    equals: 6
  - name: if start and goal are the same, one tile
    run: 'shortest_path(["..."], (1, 0), (1, 0))'
    equals: [[1, 0]]
```

```exercise
id: py10-escribe-binaria
type: write
title: Is there a launch at that time?
prompt: |
  Write `find_departure(departures, time)`, which returns **at what position** of `departures` the `time` is, or `-1` if no launch leaves at that time.

  `departures` are the departure times of the launches from the port of Belén, in minutes since midnight, **sorted and without repeats** (`375` is 6:15). Do it with binary search by hand, as in *The minimum*: without walking through the list, without `in`, without `.index` and without `bisect`.
visual:
  figure:
    input: { label: "find_departure(departures, 600)", cells: [375, 420, 480, 600, 690, 780, 900] }
    arrow: "middle 3: 600 · that's the one!"
    output: { label: returns, value: "3" }
starter: |
  def find_departure(departures, time):
      return -1


  print(find_departure([375, 420, 480, 600, 690, 780, 900], 600))
solution: |
  def find_departure(departures, time):
      """Position of time within departures (sorted), or -1."""
      left, right = 0, len(departures) - 1
      while left <= right:
          mid = (left + right) // 2
          if departures[mid] == time:
              return mid
          if departures[mid] < time:
              left = mid + 1
          else:
              right = mid - 1
      return -1


  print(find_departure([375, 420, 480, 600, 690, 780, 900], 600))
hints:
  - "Keep two edges, `left` and `right`, and look at `mid = (left + right) // 2` while `left <= right`."
  - "If the middle one is less than `time`, the time can only be to the right: `left = mid + 1`."
tests:
  - name: the middle one
    run: find_departure([375, 420, 480, 600, 690, 780, 900], 600)
    equals: 3
  - name: the first one
    run: find_departure([375, 420, 480, 600, 690, 780, 900], 375)
    equals: 0
  - name: the last one
    run: find_departure([375, 420, 480, 600, 690, 780, 900], 900)
    equals: 6
  - name: a time with no launch
    run: find_departure([375, 420, 480, 600, 690, 780, 900], 610)
    equals: -1
  - name: before the first and after the last
    run: '[find_departure([375, 420], 100), find_departure([375, 420], 999)]'
    equals: [-1, -1]
  - name: no launches
    run: find_departure([], 600)
    equals: -1
  - name: in a long list
    run: find_departure(list(range(0, 3000, 3)), 2097)
    equals: 699
  - name: binary search by hand
    sourceNot: '\bin\b|\.index\s*\(|\bbisect\b'
    msg: No in, no .index and no bisect. Split the stretch in half with a while.
```

```exercise
id: py10-escribe-alcance
type: write
title: How far the battery reaches
prompt: |
  Mark on the map every tile Quilla can reach taking **at most `reach` steps**, without moving: `robot.mark(tiles)` with a list of `(x, y)`.

  `robot.map()` gives the map (`"#"` is water), `robot.position` is `(x, y)` and `reach` already exists. Its own tile counts (it's 0 steps away). Store in a dictionary how many steps away each tile is, and don't put into the queue the ones further than `reach`. It's tested on two maps.
visual:
  figure:
    input: { label: "the first map, reach = 3", grid: ["#########", "#..#....#", "#.R..##.#", "#.#.#...#", "#...#.#.#", "#########"] }
    arrow: BFS with distances
    output: { label: "11 tiles 3 steps away or less", grid: ["#########", "#..#....#", "#.R..##.#", "#.#.#...#", "#...#.#.#", "#########"], marks: ["1,1", "1,2", "1,3", "1,4", "2,1", "2,2", "3,2", "3,3", "3,4", "4,1", "4,2"] }
starter: |
  plan = robot.map()
  x, y = robot.position
  print("Quilla is at", x, y, "and reaches", reach, "steps")
solution: |
  from collections import deque

  plan = robot.map()
  start = (robot.position.x, robot.position.y)
  distance = {start: 0}
  queue = deque([start])
  while queue:
      x, y = queue.popleft()
      if distance[(x, y)] == reach:
          continue
      for neighbor in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]:
          nx, ny = neighbor
          if plan[ny][nx] != "#" and neighbor not in distance:
              distance[neighbor] = distance[(x, y)] + 1
              queue.append(neighbor)
  robot.mark(list(distance))
hints:
  - "It's the wave from *The minimum* with `distance = {start: 0}` instead of `visited`: each new neighbour is one step further than the tile it came from."
  - "If a tile is already `reach` steps away, don't carry on from it (`continue`). At the end, `robot.mark(list(distance))`."
world:
  theme: barranco
  level: 2
  dir: E
  api: [move, map, path]
  map: |
    #########
    #..#....#
    #.R..##.#
    #.#.#...#
    #...#.#.#
    #########
globals:
  reach: 3
scenarios:
  - tests:
      - name: marks the 11 tiles 3 steps away or less
        state: 'sorted(w.marks) == ["1,1", "1,2", "1,3", "1,4", "2,1", "2,2", "3,2", "3,3", "3,4", "4,1", "4,2"]'
        msg: The 11 tiles 3 steps away or less must end up marked (Quilla's included), and none further.
  - map: |
      #######
      #R..#.#
      #.#...#
      #...#.#
      #######
    globals: { reach: 4 }
    tests:
      - name: marks the 9 tiles 4 steps away or less
        state: 'sorted(w.marks) == ["1,1", "1,2", "1,3", "2,1", "2,3", "3,1", "3,2", "3,3", "4,2"]'
        msg: The 9 tiles 4 steps away or less must end up marked. The one at (5, 1) is 6 steps away.
tests:
  - name: uses a deque
    source: '\bdeque\b'
```

## The case

```exercise
id: py10-caso-atajo
type: case
title: The shortcut that didn't exist
prompt: |
  **Walk the route each boatman reported, step by step, and find the one that's impossible.**

  Before Quilla arrived, four boatmen brought cool boxes from the port to the health post (`P`, in the top-left corner). One of the four arrived warm and those vaccines were lost. Delia asked each of them in writing for the route they took: one letter per step (`N`, `S`, `E`, `W`). Three told the truth; one invented a shortcut that goes over a house (`#`), and that can't be done by canoe or on foot.

  Write `first_impossible_step(start, route)`, which returns the number of the first step (counting from 1) that lands on a house or off the map, or `0` if the whole route is possible. Print one line per boatman: `print(f"{name}:", first_impossible_step(start, route))`.
visual:
  - figure:
      title: Belén Bajo in flood (P, the post; marked, where each boatman set off)
      panes:
        - grid: ["P....#.....", ".##.##.###.", ".#.......#.", "...##.##...", ".#.#...#.#.", ".#...#...#.", "...#...#..."]
          marks: ["10,0", "4,6", "6,4", "8,5"]
  - board:
      for: py10-caso-atajo
      title: What each boatman declared
      task: Walk each route and say at which step it becomes impossible (0 if never).
      cards:
        - { name: Waldir, kind: person, rows: [["Set off from", "(10, 0)"], ["Route", "WWWWSSWWWNNWWW"]], clue: { find: "Waldir", says: 0, saysLabel: "Impossible steps" } }
        - { name: Nilda, kind: person, rows: [["Set off from", "(4, 6)"], ["Route", "NWWNNWWNNN"]], clue: { find: "Nilda", says: 0, saysLabel: "Impossible steps" } }
        - { name: Shirley, kind: person, rows: [["Set off from", "(6, 4)"], ["Route", "WNNWWNNWWW"]], clue: { find: "Shirley", says: 0, saysLabel: "Impossible steps" } }
        - { name: Elmer, kind: person, culprit: true, rows: [["Set off from", "(8, 5)"], ["Route", "WWNNNNNWWWWWW"]], clue: { find: "Elmer", says: 0, saysLabel: "Impossible steps" } }
      caption: "**Matches**: the route can be done. If it doesn't match, someone crossed where there's no bridge."
starter: |
  plan = [
      "P....#.....",
      ".##.##.###.",
      ".#.......#.",
      "...##.##...",
      ".#.#...#.#.",
      ".#...#...#.",
      "...#...#...",
  ]

  MOVES = {"N": (0, -1), "S": (0, 1), "E": (1, 0), "W": (-1, 0)}

  boatmen = [
      ("Waldir", (10, 0), "WWWWSSWWWNNWWW"),
      ("Nilda", (4, 6), "NWWNNWWNNN"),
      ("Shirley", (6, 4), "WNNWWNNWWW"),
      ("Elmer", (8, 5), "WWNNNNNWWWWWW"),
  ]

  print("Tile (5, 0) is:", plan[0][5])

  # TODO: write first_impossible_step(start, route)
  # TODO: print one line per boatman
solution: |
  plan = [
      "P....#.....",
      ".##.##.###.",
      ".#.......#.",
      "...##.##...",
      ".#.#...#.#.",
      ".#...#...#.",
      "...#...#...",
  ]

  MOVES = {"N": (0, -1), "S": (0, 1), "E": (1, 0), "W": (-1, 0)}

  boatmen = [
      ("Waldir", (10, 0), "WWWWSSWWWNNWWW"),
      ("Nilda", (4, 6), "NWWNNWWNNN"),
      ("Shirley", (6, 4), "WNNWWNNWWW"),
      ("Elmer", (8, 5), "WWNNNNNWWWWWW"),
  ]


  def first_impossible_step(start, route):
      x, y = start
      for number, letter in enumerate(route, start=1):
          dx, dy = MOVES[letter]
          x, y = x + dx, y + dy
          inside = 0 <= y < len(plan) and 0 <= x < len(plan[0])
          if not inside or plan[y][x] == "#":
              return number
      return 0


  for name, start, route in boatmen:
      print(f"{name}:", first_impossible_step(start, route))
answer: Elmer
answerLabel: Who invented the shortcut?
reveal: |
  Elmer. He sets off from (8, 5), goes two west to (6, 5), up to (6, 4) and at **step 4** goes through (6, 3), which is a house. The other three routes can be done, and they're also the shortest possible: a BFS from the post gives 14 steps for Waldir and 10 for Nilda and Shirley. From (8, 5), the shortest you can do is 13 steps going round by (8, 2), the same number Elmer said, but on the other side.
hints:
  - "Keep `x, y` from the start and add each letter's `(dx, dy)` to them. Check the new tile after every step."
  - "`enumerate(route, start=1)` gives you the step number along with the letter."
```

## The judge

Both of today's problems are judged in function mode, as since session 4: the judge calls your function and compares what it **returns**.

```exercise
id: py10-juez-pasos
type: judge
mode: function
function: min_steps
title: The steps to the post
prompt: |
  **Write `min_steps(plan, start, goal)`, which returns how many steps the shortest route from `start` to `goal` has, or `-1` if there's none.**

  Delia wants to know how long each vaccine takes to arrive from any house in Belén. `plan` is a list of strings of the same length: `"."` is bridge, `"#"` is water or a house. `start` and `goal` are `[x, y]` lists: `x` is the column and `y` the row, so the tile is `plan[y][x]`. A step is moving to the tile above, below, left or right, without leaving the map.

  **Constraints:** 1 to 20 rows · 1 to 20 columns · `start` and `goal` are `"."` tiles (they may be the same).
visual:
  figure:
    title: Example 1
    input: { label: "plan, from [0, 0] to [4, 3]", grid: ["..#..", ".#..#", "...#.", "#...."], path: ["0,0"] }
    arrow: BFS from the start
    output: { label: "returns 7", grid: ["..#..", ".#..#", "...#.", "#...."], path: ["0,0", "0,1", "0,2", "1,2", "2,2", "2,3", "3,3", "4,3"] }
    steps:
      - "The wave sets off from (0, 0); along the top, the house at (2, 0) blocks the way."
      - "It goes down column 0, crosses row 2 and finishes along row 3: 7 steps."
starter: |
  def min_steps(plan, start, goal):
      return -1
solution: |
  from collections import deque


  def min_steps(plan, start, goal):
      """Steps of the shortest route from start to goal, or -1 if there's none."""
      height, width = len(plan), len(plan[0])
      start, goal = tuple(start), tuple(goal)
      distance = {start: 0}
      queue = deque([start])
      while queue:
          x, y = queue.popleft()
          if (x, y) == goal:
              return distance[(x, y)]
          for nx, ny in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]:
              if 0 <= nx < width and 0 <= ny < height and plan[ny][nx] != "#" and (nx, ny) not in distance:
                  distance[(nx, ny)] = distance[(x, y)] + 1
                  queue.append((nx, ny))
      return -1
hints:
  - "Store in a `distance` dictionary how many steps away each tile is: the new neighbour is one more than the tile it came from."
  - "Watch the edges: in Python `plan[0][-1]` doesn't raise an error, it gives the last column. Check `0 <= nx < width` before looking at the tile."
samples:
  - args: [["..#..", ".#..#", "...#.", "#...."], [0, 0], [4, 3]]
    returns: 7
    note: The path in the picture.
  - args: [[".#.", ".#.", ".#."], [0, 0], [2, 2]]
    returns: -1
    note: The column of water splits the map in two.
edge:
  - args: [["."], [0, 0], [0, 0]]
    tag: with a single tile
  - args: [["...", "...", "..."], [1, 1], [1, 1]]
    tag: with start and goal on the same tile
  - args: [[".#.", "#..", "..."], [0, 0], [0, 2]]
    tag: with the start shut in next to the edge
  - args: [["..#..", "...#."], [0, 1], [4, 1]]
    tag: with the goal on the other side of a wall
  - args: [[".", ".", ".", ".", "."], [0, 4], [0, 0]]
    tag: with a single column
  - args: [["....................", "###################.", "....................", ".###################", "....................", "###################.", "....................", ".###################", "...................."], [0, 0], [19, 8]]
    tag: with a long zigzag path
  - args: [["....#...", ".##.#.#.", ".#..#.#.", ".#.##.#.", "...#..#.", ".#...##.", ".#.#....", "...#.#.."], [0, 0], [7, 0]]
    tag: with a maze with several paths
random:
  count: 40
  seed: 1010
  generate: |
    height = rng.int(1, 20)
    width = rng.int(1, 20)
    density = rng.pick([10, 25, 35, 45])
    rows = ["".join("#" if rng.int(1, 100) <= density else "." for _ in range(width)) for _ in range(height)]
    free = [[x, y] for y in range(height) for x in range(width) if rows[y][x] == "."]
    if not free:
        rows[0] = "." + rows[0][1:]
        free = [[0, 0]]
    return [rows, rng.pick(free), rng.pick(free)]
wrong:
  - |
    def min_steps(plan, start, goal):
        stack = [(tuple(start), 0)]
        visited = {tuple(start)}
        while stack:
            (x, y), steps = stack.pop()
            if (x, y) == tuple(goal):
                return steps
            for nx, ny in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]:
                if 0 <= nx < len(plan[0]) and 0 <= ny < len(plan) and plan[ny][nx] != "#" and (nx, ny) not in visited:
                    visited.add((nx, ny))
                    stack.append(((nx, ny), steps + 1))
        return -1
  - |
    from collections import deque


    def min_steps(plan, start, goal):
        distance = {tuple(start): 0}
        queue = deque([tuple(start)])
        while queue:
            x, y = queue.popleft()
            if (x, y) == tuple(goal):
                return distance[(x, y)]
            for nx, ny in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]:
                try:
                    free = plan[ny][nx] != "#"
                except IndexError:
                    free = False
                if free and (nx, ny) not in distance:
                    distance[(nx, ny)] = distance[(x, y)] + 1
                    queue.append((nx, ny))
        return -1
  - |
    from collections import deque


    def min_steps(plan, start, goal):
        distance = {tuple(start): 0}
        queue = deque([tuple(start)])
        while queue:
            x, y = queue.popleft()
            if (x, y) == tuple(goal):
                return distance[(x, y)]
            for nx, ny in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]:
                if 0 <= nx < len(plan[0]) and 0 <= ny < len(plan) and plan[nx][ny] != "#" and (nx, ny) not in distance:
                    distance[(nx, ny)] = distance[(x, y)] + 1
                    queue.append((nx, ny))
        return -1
```

```exercise
id: py10-juez-creciente
type: judge
mode: function
function: alert_days
title: The day the river came into the house
prompt: |
  **Write `alert_days(levels, floors)`, which returns, for each floor, the first day the river goes above it, or `0` if it never does.**

  During the flood the Itaya only rises: every morning Delia writes down its level in centimetres, so `levels` is **sorted from lowest to highest** (it can repeat if one day it didn't rise). `levels[0]` is day 1. Each family gave her the height of their house's floor, in the list `floors`. On the day the river's level is **greater** than the floor, the water has come in and the family climbs up to its barbacoa, the raised platform. Return a list with one day number for each floor, in the same order.

  `bisect` saves you the work. Think carefully about which of the two: if the river reaches exactly the height of the floor, it hasn't come in yet.

  **Constraints:** 1 to 300 days · 1 to 30 floors · levels and floors from 90 to 1800.
visual:
  figure:
    title: Example 1, for the floor at 121
    input: { label: "levels (day 1 at position 0)", cells: [118, 121, 121, 126, 130, 130, 134], highlight: [3] }
    arrow: "bisect_right(levels, 121) = 3 · day 3 + 1"
    output: { label: "floor 121 → day", value: "4" }
    steps:
      - "On days 2 and 3 the river reached 121: level with the floor, without coming in."
      - "Day 4 marked 126: that day the water came in."
starter: |
  def alert_days(levels, floors):
      return []
solution: |
  from bisect import bisect_right


  def alert_days(levels, floors):
      """For each floor, the first day (from 1) the river goes above it, or 0."""
      answer = []
      for floor in floors:
          position = bisect_right(levels, floor)
          answer.append(position + 1 if position < len(levels) else 0)
      return answer
hints:
  - "`bisect_right(levels, floor)` is the position of the first level **greater** than the floor. Position 0 is day 1."
  - "If the position is `len(levels)`, no day went above it: that's a 0."
samples:
  - args: [[118, 121, 121, 126, 130, 130, 134], [120, 121, 130, 140, 100]]
    returns: [2, 4, 7, 0, 1]
    note: "The floor at 121 gets wet on day 4; the one at 140 never; the one at 100 was already under water on day 1."
  - args: [[95, 95, 95], [95, 94]]
    returns: [0, 1]
edge:
  - args: [[500], [499, 500, 501]]
    tag: with a single day
  - args: [[200, 200, 200, 200], [200]]
    tag: with the river level with the floor every day
  - args: [[100, 150, 200], [99, 100, 149, 150, 199, 200]]
    tag: with floors just below and exactly at each level
  - args: [[90, 1800], [90, 1799, 1800]]
    tag: with the levels at the extremes
  - args: [[300, 310, 320, 330], [330, 300, 315]]
    tag: with the floors out of order
random:
  count: 40
  seed: 1011
  generate: |
    level = rng.int(90, 300)
    levels = []
    for _ in range(rng.int(1, 300)):
        level += rng.pick([0, 0, 1, 2, 5])
        levels.append(level)
    floors = [rng.pick(levels) if rng.int(0, 1) else rng.int(90, levels[-1] + 10) for _ in range(rng.int(1, 30))]
    return [levels, floors]
wrong:
  - |
    from bisect import bisect_left


    def alert_days(levels, floors):
        answer = []
        for floor in floors:
            position = bisect_left(levels, floor)
            answer.append(position + 1 if position < len(levels) else 0)
        return answer
  - |
    from bisect import bisect_right


    def alert_days(levels, floors):
        answer = []
        for floor in floors:
            position = bisect_right(levels, floor)
            answer.append(position if position < len(levels) else 0)
        return answer
  - |
    from bisect import bisect_right


    def alert_days(levels, floors):
        return [bisect_right(levels, floor) + 1 for floor in floors]
```

## Final mission

```exercise
id: py10-mision-vacunas
type: mission
title: The vaccines arrive cold
prompt: |
  **Find the shortest route to the health post (D) with BFS, make Quilla walk it with `robot.follow_path(route)` and deliver `"vaccines"` when it arrives.**

  The battery is enough for **exactly** the shortest route: one step too many and Quilla is stranded on the planks. You have:

  - `robot.map()`: the map as a list of strings; `"#"` is water or a house, `"D"` is the post. The edge is all `"#"`, so you won't go off the map;
  - `robot.position`: where Quilla is, `(x, y)`;
  - `robot.follow_path(route)`: walks a list of neighbouring tiles `(x, y)`, turning by itself (the first one may be the current tile);
  - `robot.mark(tiles)`, if you want to see what your search explored.

  The bridges change on every test. When it passes, together with the judges, session 11 unlocks.
visual:
  figure:
    title: The first test
    input: { label: "map (battery: 18)", grid: ["#############", "#R..#.......#", "#.#.#.#####.#", "#.#...#...#.#", "#.###.#.#.#.#", "#...#...#..D#", "###.#####.#.#", "#.......#...#", "#############"] }
    arrow: BFS, parents, route backwards
    output: { label: "an 18-step route", grid: ["#############", "#R..#.......#", "#.#.#.#####.#", "#.#...#...#.#", "#.###.#.#.#.#", "#...#...#..D#", "###.#####.#.#", "#.......#...#", "#############"], path: ["1,1", "2,1", "3,1", "3,2", "3,3", "4,3", "5,3", "5,4", "5,5", "6,5", "7,5", "7,4", "7,3", "8,3", "9,3", "9,4", "9,5", "10,5", "11,5"] }
starter: |
  plan = robot.map()
  x, y = robot.position
  print("Leaving from", x, y, "with battery", robot.battery)
  # TODO: BFS from (x, y) to the "D" tile, storing each tile's parent.
  # Then rebuild the route, follow it and deliver the vaccines.
solution: |
  from collections import deque

  plan = robot.map()
  start = (robot.position.x, robot.position.y)
  parent = {start: None}
  queue = deque([start])
  goal = None
  while queue:
      x, y = queue.popleft()
      if plan[y][x] == "D":
          goal = (x, y)
          break
      for neighbor in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]:
          nx, ny = neighbor
          if plan[ny][nx] != "#" and neighbor not in parent:
              parent[neighbor] = (x, y)
              queue.append(neighbor)
  robot.mark(list(parent))

  route = []
  tile = goal
  while tile is not None:
      route.append(tile)
      tile = parent[tile]
  route.reverse()
  robot.follow_path(route)
  robot.deliver("vaccines")
hints:
  - "It's the BFS with `parent` from *The minimum*: instead of a fixed goal, stop when the tile coming out of the queue is `\"D\"`."
  - "Rebuild backwards from the goal with `parent`, flip the list with `route.reverse()` and pass it to `robot.follow_path`."
world:
  theme: barranco
  level: 2
  dir: E
  api: [move, deliver, map, path]
  battery: 18
  map: |
    #############
    #R..#.......#
    #.#.#.#####.#
    #.#...#...#.#
    #.###.#.#.#.#
    #...#...#..D#
    ###.#####.#.#
    #.......#...#
    #############
scenarios:
  - {}
  - map: |
      ###########
      #.....#..D#
      #.###.#.#.#
      #.#R..#.#.#
      #.#####.#.#
      #.......#.#
      #.#####...#
      #.........#
      ###########
    world: { dir: S, battery: 24 }
  - map: |
      ##########
      #D.#.....#
      #..#.###.#
      #.##.#R#.#
      #.#..#.#.#
      #.#.##.#.#
      #......#.#
      ##########
    world: { dir: N, battery: 13 }
tests:
  - name: reaches the health post
    state: w.at_goal
    msg: Quilla didn't reach the D. If it ran out of battery, the route wasn't the shortest.
  - name: delivers the vaccines
    state: 'w.delivered == ["vaccines"]'
  - name: without crashing
    state: not w.crashed
  - name: searches with a deque
    source: '\bdeque\b'
    msg: Use a deque as the queue, with append and popleft.
  - name: walks the route with follow_path
    source: 'robot\.follow_path\s*\('
```

## Expert challenge

```exercise
id: py10-reto-nivel
type: challenge
title: How high can the river rise?
prompt: |
  **Write `max_level(heights)`, which returns the highest river level at which there's still a dry path from the top-left corner to the bottom-right one.** For people who already code.

  `heights` is a list of strings of digits: each tile says how high that plank's floor is, from `0` to `9`. With the river at level `r`, every tile with a height **less than or equal to** `r` floods. A dry path goes from neighbour to neighbour (up, down, left, right) only through tiles that didn't flood, including the starting and the finishing tile.

  Return the largest `r` between `0` and `9` with a dry path, or `-1` if with the river at `0` there's already no path. If there's a path at `r`, there's also one at any lower level: find `r` with binary search and check each level with a BFS.
visual:
  figure:
    input: { label: "heights", text: "4736\n1592\n8264" }
    arrow: "the best path: 4 → 7 → 5 → 9 → 6 → 4"
    output: { label: "its lowest tile is 4 · returns", value: "3" }
starter: |
  def max_level(heights):
      return -1


  print(max_level(["4736", "1592", "8264"]))
solution: |
  from collections import deque


  def has_path(heights, level):
      """Is there a dry path with the river at this level?"""
      height, width = len(heights), len(heights[0])
      if int(heights[0][0]) <= level:
          return False
      visited = {(0, 0)}
      queue = deque([(0, 0)])
      while queue:
          x, y = queue.popleft()
          if (x, y) == (width - 1, height - 1):
              return True
          for nx, ny in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]:
              inside = 0 <= nx < width and 0 <= ny < height
              if inside and (nx, ny) not in visited and int(heights[ny][nx]) > level:
                  visited.add((nx, ny))
                  queue.append((nx, ny))
      return False


  def max_level(heights):
      """The highest river level that leaves a dry path."""
      dry, wet = -1, 9
      while wet - dry > 1:
          mid = (dry + wet) // 2
          if has_path(heights, mid):
              dry = mid
          else:
              wet = mid
      return dry


  print(max_level(["4736", "1592", "8264"]))
hints:
  - "With `r = -1` there's always a path and with `r = 9` never. Keep those two edges and bring them together by splitting in half."
  - "`has_path(heights, level)` is a BFS that only steps on tiles with `int(heights[y][x]) > level`."
tests:
  - name: the example
    run: 'max_level(["4736", "1592", "8264"])'
    equals: 3
  - name: a single tile
    run: 'max_level(["5"])'
    equals: 4
  - name: a single tile on the ground
    run: 'max_level(["0"])'
    equals: -1
  - name: going round the pit
    run: 'max_level(["555", "515", "555"])'
    equals: 4
  - name: two paths, the higher one wins
    run: 'max_level(["38", "27"])'
    equals: 2
  - name: the exit is on the ground
    run: 'max_level(["91", "09"])'
    equals: 0
  - name: the long detour
    run: 'max_level(["2223", "9993", "3333"])'
    equals: 1
  - name: uses a deque
    source: '\bdeque\b'
```
