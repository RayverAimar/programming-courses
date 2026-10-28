# Session 12 — WITH RECURSIVE

```session
case: frio
```

## The job

Monday 30 March 2026. **Haydée Llanos**, a nurse in Surquillo, walks into Loop with a cardboard box full of papers. Her father, **Teodoro Llanos**, was the night guard at **Textil San Jacinto**, a textile mill in La Victoria. On the night of **Friday 18 December 1998** someone opened the mill's safe **with its combination** and took S/ 412,000, the Christmas bonuses. Teodoro was alone in the guard booth. He was convicted in 1999 and died in 2021 with nobody believing him.

"He always said that night someone called him to let a technician in," Haydée says. The municipality has just digitised the file: the mill's **staff list** with each employee's boss, the 1998 **phone book**, **every December call** through the La Victoria exchange (more than sixty thousand) and the **statements** taken at the time. The tables end in `_1998`.

To answer "who reports to whom?" or "who is three calls away from this phone?" you have to follow a chain **without knowing how many links it has**. A `JOIN` moves one step; today you learn to move as many as it takes.

```setting
case: frio
title: Textil San Jacinto, Av. México, December 1998
caption: "The safe was in Treasury. Teodoro kept watch from the booth at the main gate; opposite the mill there was a public phone."
```

```dossier
title: Who's asking and who was blamed
cards:
  - name: Haydée Llanos Quispe
    traits: { style: long, hair: "#3b2a1e", shirt: "#f4efe2", skin: "#a86f47" }
    role: Teodoro's daughter, nurse
    rows: [["Asks", "to clear her father's name"]]
    quote: "My dad worked at that mill for eleven years. He wasn't a thief."
  - name: Teodoro Llanos Cusi
    traits: { style: cap, capColor: "#2f3a4a", shirt: "#2f3a4a", skin: "#a86f47", beard: true }
    role: Night guard in 1998
    rows: [["Shift", "20:00 to 06:00, in the booth"], ["Sentence", "1999, as an accomplice"]]
    quote: "They called on behalf of Mrs Ugarte. All I did was open the side door."
```

```schema
title: The four tables of the 1998 file
tables: [employees_1998, phones_1998, calls_1998, statements_1998]
```

```figure
title: "The numbers in the case"
table:
  head: ["number", "who", "where"]
  rows:
    - ["4723310", "Public phone", "Av. México, opposite the mill"]
    - ["4721093", "The mill's booth", "where Teodoro kept watch"]
    - ["2715504", "Teodoro Llanos's home", "the guard"]
    - ["4417825", "Víctor Salazar's home", "employee 318, cash supervisor"]
    - ["4402216", "Rosa Ugarte's home", "employee 214, head of Treasury"]
    - ["2741958", "Nilton Palomino's home", "employee 405, cashier"]
    - ["4256641", "Cerrajería El Candado", "Jr. Huánuco 1290, safes and keys"]
  by:
    - null
    - null
    - null
    - "sql13-caso-cerrajeria"
    - "sql13-caso-cerrajeria"
    - "sql13-caso-cerrajeria"
    - "sql13-caso-cerrajeria"
```

```figure
title: "The night of the robbery, in order"
timeline:
  - when: "Tue 15"
    title: "Rosa Ugarte changes the combination"
    text: "Only she and the 11 below her know it."
    by: "sql12-caso-combinacion"
  - when: "Tue 15 · 23:21"
    title: "A first relay"
    text: "A home calls the public phone and, five minutes later, the public phone calls the booth."
    by: "sql13-mision-relevo"
  - when: "Fri 18 · 22:58"
    title: "Home 4417825 calls the locksmith"
    text: "The fifth time in December."
    by: "sql13-caso-cerrajeria"
  - {"when": "23:36", "title": "Home 4417825 calls the public phone", "by": "sql13-mision-relevo"}
  - when: "23:41"
    title: "The public phone calls the booth"
    text: "The caller says he is a technician sent by Mrs Ugarte."
  - {"when": "No time", "title": "Teodoro opens the side door", "text": "The file does not say when."}
  - when: "No time"
    title: "The safe is opened with the combination"
    text: "S/ 412,000 is taken."
  - when: "Sat 19 · 00:52"
    title: "The booth calls Rosa and nobody answers"
    text: "Two calls, 00:52 and 00:55, of 0 seconds: Teodoro was telling the truth."
    by: "sql14-caso-caseta"
    now: true
  - when: "Closing"
    title: "Who set up the call"
    text: "Víctor Salazar: his home made both relays."
    by: "sql14-mision-culpable"
    now: true
```

## The minimum

With what you already know, to see who reports to the head of Treasury (employee **214**) you join `employees_1998` to itself: `e.boss_id = 214`. That gives the first level. For the second, another `JOIN`; for the third, one more. But you don't know how many levels there are, and each one is a different query.

A **recursive CTE** names itself. It has two parts joined by `UNION ALL`:

```sql
WITH RECURSIVE name(columns) AS (
  SELECT …            -- the anchor: the starting rows
  UNION ALL
  SELECT …            -- the recursive part: reads from name
  FROM name …
  WHERE …             -- the condition that makes it stop
)
SELECT … FROM name;
```

SQLite runs it **in rounds**. In round 0 it runs the anchor and keeps its rows. In every later round it runs the recursive part, but `name` is **not** everything collected so far: it's **only the new rows of the previous round**. When a round produces no new row, it stops, and the result is all rounds put together. Watch it with the simplest series, 1 to 5:

```recursion
title: From 1 to 5, round by round
by: x
query: |
  WITH RECURSIVE n(x) AS (
    SELECT 1
    UNION ALL
    SELECT x + 1 FROM n
    WHERE x < 5
  )
  SELECT x FROM n;
```

Look at the last round: with `x = 5`, `WHERE x < 5` lets nothing through. **Without that condition, it never ends.**

**Date series.** The same trick with `date(d, '+1 day')` builds a calendar. It does what `GROUP BY` can't: show **the days with no rows too**. The calls the mill's guard booth (`'4721093'`) received in the week of the robbery:

```sql run
WITH RECURSIVE days(day) AS (
  SELECT '1998-12-14'
  UNION ALL
  SELECT date(day, '+1 day') FROM days
  WHERE day < '1998-12-20'
)
SELECT day,
       (SELECT count(*) FROM calls_1998
        WHERE callee = '4721093'
          AND started >= day AND started < date(day, '+1 day')) AS calls
FROM days;
```

**Hierarchies.** The anchor is the person at the top; the recursive part looks for whoever has someone from the previous round as their boss, and keeps count of the level:

```sql run
WITH RECURSIVE team(id, name, role, level) AS (
  SELECT id, name, role, 0
  FROM employees_1998
  WHERE id = 214
  UNION ALL
  SELECT e.id, e.name, e.role, q.level + 1
  FROM employees_1998 AS e
  JOIN team AS q ON e.boss_id = q.id
)
SELECT * FROM team;
```

```recursion
title: The head of Treasury's team, round by round
by: level
query: |
  WITH RECURSIVE team(id, name, level) AS (
    SELECT id, name, 0
    FROM employees_1998
    WHERE id = 214
    UNION ALL
    SELECT e.id, e.name, q.level + 1
    FROM employees_1998 AS e
    JOIN team AS q ON e.boss_id = q.id
  )
  SELECT id, name, level FROM team;
caption: "No stopping `WHERE` is needed here: in round 4 nobody has the trainee as their boss, and the `JOIN` returns nothing."
```

To **climb** the chain (from an employee up to the general manager) you flip the `JOIN`: `e.id = q.boss_id`, "the boss of someone from the previous round".

**Graphs.** Calls aren't a tree: A calls B, B calls C and C calls A back. Walking a graph like that has two dangers: going round in circles forever and exploding into paths. Two things keep it in check:

- a **depth limit** (`WHERE r.hops < 3`), and
- a **path as text** (`r.path || '>' || number`) so you never step on a number already in the path: `instr(r.path, number) = 0`.

Since a call works both ways, first build `edges` with every call twice, `caller → callee` and `callee → caller`. This is everything within two calls of the guard booth on the night of the robbery:

```sql run
WITH RECURSIVE
  edges(a, b) AS (
    SELECT caller, callee FROM calls_1998
    WHERE started BETWEEN '1998-12-18 20:00' AND '1998-12-19 02:00'
    UNION ALL
    SELECT callee, caller FROM calls_1998
    WHERE started BETWEEN '1998-12-18 20:00' AND '1998-12-19 02:00'
  ),
  network(number, hops, path) AS (
    SELECT '4721093', 0, '4721093'
    UNION ALL
    SELECT x.b, r.hops + 1, r.path || '>' || x.b
    FROM network AS r
    JOIN edges AS x ON x.a = r.number
    WHERE r.hops < 2 AND instr(r.path, x.b) = 0
  )
SELECT number, hops, path FROM network;
```

Number `4402216` shows up **twice**: there were two calls, and each is a different path. To keep each number once, group and take `MIN(hops)`: the shortest distance.

> **Common trap:** a recursion with no way out doesn't raise an error: it runs until it's cut off (here, after 4 seconds). Before you run it, ask yourself what makes a round produce **zero** rows: a `WHERE level < …`, a tree that runs out, or the path check. Another way out is writing `UNION` instead of `UNION ALL`: SQLite then drops rows it already has and a cycle stops by itself, but only if the repeated row is identical (with a growing `hops` column, it never is).

SQLite takes rows one at a time from a queue, in arrival order, so it walks **breadth-first**: all of level 1 first, then level 2. PostgreSQL and MySQL 8 write it the same way; SQL Server leaves out the word `RECURSIVE`, and in SQLite it's optional too.

<!-- legacy: recursive-cte -->

<!-- mdn: recursive-cte -->

## Practice

```exercise
id: sql12-predice-serie
type: predict
title: Doubling past the limit
prompt: |
  What does it return?
code: |
  WITH RECURSIVE n(x) AS (
    SELECT 1
    UNION ALL
    SELECT x * 2 FROM n WHERE x < 20
  )
  SELECT group_concat(x, ' ') FROM n;
options:
  - "1 2 4 8 16"
  - "1 2 4 8 16 32"
  - "2 4 8 16 32"
  - "1 2 4 8 16 32 64"
answer: "1 2 4 8 16 32"
explain: |
  The `WHERE` looks at the row **from the previous round**, not the new one. With `x = 16`, `16 < 20` holds and produces 32. With `x = 32` nothing gets through and the recursion ends. 32 comes out even though it's above 20.
```

```exercise
id: sql12-predice-ciclo
type: predict
title: A cycle with UNION
prompt: |
  `x % 3 + 1` goes 1 → 2 → 3 → 1 → … and there's no `WHERE`. What does it return?
code: |
  WITH RECURSIVE n(x) AS (
    SELECT 1
    UNION
    SELECT x % 3 + 1 FROM n
  )
  SELECT count(*) FROM n;
options:
  - "3"
  - "4"
  - "1"
  - "Nothing: it hangs until it's cut off"
answer: "3"
explain: |
  With `UNION` (no `ALL`), SQLite drops a row that's already in the result. In the fourth round 1 comes out again, and it was already there: no new rows, so it stops. With `UNION ALL` it would go round forever.
```

```exercise
id: sql12-completa-dias
type: complete
title: A calendar with gaps
prompt: |
  List **every day from 14 to 20 December 1998** and how many calls **went out from the public phone** `'4723310'` that day, including the days with zero. Name the columns `day` and `calls`, in order. Replace the `___`.
visual:
  figure:
    title: What GROUP BY doesn't show
    panes:
      - label: "GROUP BY date(started)"
        table: { head: [day, calls], rows: [["1998-12-15", "…"], ["1998-12-18", "…"]] }
      - label: "Day series + count"
        table: { head: [day, calls], rows: [["1998-12-14", "…"], ["1998-12-15", "…"], ["1998-12-16", "0"], ["…", "…"]] }
starter: |
  WITH RECURSIVE days(day) AS (
    SELECT '1998-12-14'
    UNION ALL
    SELECT ___(day, '+1 day') FROM days
    WHERE day < ___
  )
  SELECT day,
         (SELECT count(*) FROM calls_1998
          WHERE caller = '4723310'
            AND started >= day AND started < date(day, '+1 day')) AS calls
  FROM days;
solution: |
  WITH RECURSIVE days(day) AS (
    SELECT '1998-12-14'
    UNION ALL
    SELECT date(day, '+1 day') FROM days
    WHERE day < '1998-12-20'
  )
  SELECT day,
         (SELECT count(*) FROM calls_1998
          WHERE caller = '4723310'
            AND started >= day AND started < date(day, '+1 day')) AS calls
  FROM days;
hints:
  - "`date(day, '+1 day')` gives the next day."
  - "The condition looks at the previous round's day: for the last one to be the 20th, keep going while `day < '1998-12-20'`."
tests:
  - name: the seven days with their count
    same: WITH RECURSIVE d(x) AS (SELECT '1998-12-14' UNION ALL SELECT date(x, '+1 day') FROM d WHERE x < '1998-12-20') SELECT x, (SELECT count(*) FROM calls_1998 WHERE caller = '4723310' AND started >= x AND started < date(x, '+1 day')) FROM d
    ordered: true
  - name: columns day and calls
    columns: [day, calls]
```

```exercise
id: sql12-arregla-cadena
type: fix
title: The chain upside down
prompt: |
  This query wants **Teodoro's chain of command** (employee 590): him, his boss, his boss's boss… up to the general manager, with the `level` (0 for Teodoro) and in level order. But it only returns Teodoro. Fix it.
visual:
  figure:
    title: Which way the JOIN looks
    panes:
      - label: "e.boss_id = c.id (down)"
        value: "who has Teodoro as boss? nobody"
      - label: "e.id = c.boss_id (up)"
        value: "who is Teodoro's boss?"
starter: |
  WITH RECURSIVE chain(id, name, role, boss_id, level) AS (
    SELECT id, name, role, boss_id, 0
    FROM employees_1998
    WHERE id = 590
    UNION ALL
    SELECT e.id, e.name, e.role, e.boss_id, c.level + 1
    FROM employees_1998 AS e
    JOIN chain AS c ON e.boss_id = c.id
  )
  SELECT level, id, name, role FROM chain
  ORDER BY level;
solution: |
  WITH RECURSIVE chain(id, name, role, boss_id, level) AS (
    SELECT id, name, role, boss_id, 0
    FROM employees_1998
    WHERE id = 590
    UNION ALL
    SELECT e.id, e.name, e.role, e.boss_id, c.level + 1
    FROM employees_1998 AS e
    JOIN chain AS c ON e.id = c.boss_id
  )
  SELECT level, id, name, role FROM chain
  ORDER BY level;
hints:
  - "The previous round's row is `c`. Its boss is the employee whose `id` is `c.boss_id`."
tests:
  - name: from Teodoro to the general manager, in order
    same: WITH RECURSIVE k(id, j, n) AS (SELECT id, boss_id, 0 FROM employees_1998 WHERE id = 590 UNION ALL SELECT e.id, e.boss_id, k.n + 1 FROM employees_1998 e JOIN k ON e.id = k.j) SELECT k.n, e.id, e.name, e.role FROM k JOIN employees_1998 e ON e.id = k.id ORDER BY k.n
    ordered: true
```

```exercise
id: sql12-escribe-niveles
type: write
title: How many people on each level
prompt: |
  Walk the **whole** staff list from the general manager (the only one whose `boss_id` is `NULL`, level 0) and return how many employees there are on each level. Columns `level` and `employees`, ordered by level.
visual:
  figure:
    title: "The org chart, floor by floor"
    caption: "Each level is worked out from the one above: that is the recursive part."
    table:
      head: ["level", "who", "reports to"]
      rows:
        - ["0", "the general manager", "nobody (`boss_id` is `NULL`)"]
        - ["1", "the managers", "the general manager"]
        - ["2, 3, …", "heads, supervisors, operators…", "their direct boss, one level up"]
starter: |
  SELECT id, name, boss_id
  FROM employees_1998
  WHERE boss_id IS NULL;
solution: |
  WITH RECURSIVE org(id, level) AS (
    SELECT id, 0 FROM employees_1998 WHERE boss_id IS NULL
    UNION ALL
    SELECT e.id, o.level + 1
    FROM employees_1998 AS e
    JOIN org AS o ON e.boss_id = o.id
  )
  SELECT level, count(*) AS employees
  FROM org
  GROUP BY level
  ORDER BY level;
hints:
  - "The anchor is `WHERE boss_id IS NULL`; the recursive part goes down with `e.boss_id = o.id`."
  - "Outside the `WITH`, it's an ordinary `GROUP BY level`."
tests:
  - name: employees per level
    same: WITH RECURSIVE o(id, n) AS (SELECT id, 0 FROM employees_1998 WHERE boss_id IS NULL UNION ALL SELECT e.id, o.n + 1 FROM employees_1998 e JOIN o ON e.boss_id = o.id) SELECT n, count(*) FROM o GROUP BY n ORDER BY n
    ordered: true
  - name: columns level and employees
    columns: [level, employees]
  - name: uses WITH RECURSIVE
    source: '\bWITH\s+RECURSIVE\b'
```

```exercise
id: sql12-escribe-camino
type: write
title: Treasury's org chart, as text
prompt: |
  For each person on the head of Treasury's team (214, herself included) build their **path** from Rosa: `'Rosa Ugarte Bustamante > Víctor Salazar Montes > Edwin Torres Mendoza'`, with `' > '` between names. Return only the `path` column, ordered by `path`: that way each boss sits right above their people.
starter: |
  WITH RECURSIVE team(id, name) AS (
    SELECT id, name FROM employees_1998 WHERE id = 214
    UNION ALL
    SELECT e.id, e.name
    FROM employees_1998 AS e
    JOIN team AS q ON e.boss_id = q.id
  )
  SELECT name FROM team;
solution: |
  WITH RECURSIVE team(id, path) AS (
    SELECT id, name FROM employees_1998 WHERE id = 214
    UNION ALL
    SELECT e.id, q.path || ' > ' || e.name
    FROM employees_1998 AS e
    JOIN team AS q ON e.boss_id = q.id
  )
  SELECT path FROM team
  ORDER BY path;
hints:
  - "The column that travels from round to round is the path: in the anchor it's Rosa's name; in the recursive part, `q.path || ' > ' || e.name`."
tests:
  - name: the twelve paths, in order
    same: WITH RECURSIVE q(id, c) AS (SELECT id, name FROM employees_1998 WHERE id = 214 UNION ALL SELECT e.id, q.c || ' > ' || e.name FROM employees_1998 e JOIN q ON e.boss_id = q.id) SELECT c FROM q ORDER BY c
    ordered: true
  - name: column path
    columns: [path]
```

## The case

```exercise
id: sql12-caso-combinacion
type: case
title: How many knew the combination?
prompt: |
  **How many people knew the safe's combination on the night of the robbery?** Type the number.

  The safe was opened without force. Look in `statements_1998` for what was said about the **combination**: one of the statements says exactly who knew it. Then count those people in `employees_1998`.

  Careful: the `department` column was filled in by hand and isn't reliable (there's "Treasury " with a trailing space, a lowercase "treasury", blanks, and people from other departments written down as Treasury). What doesn't lie is who reports to whom.
visual:
  - setting:
      case: frio
  - schema:
      tables: [statements_1998, employees_1998]
starter: |
  -- Step 1: what was said about the combination
  SELECT employee_id, text
  FROM statements_1998
  WHERE text LIKE '%combination%';
solution: |
  WITH RECURSIVE team(id) AS (
    SELECT id FROM employees_1998 WHERE id = 214
    UNION ALL
    SELECT e.id
    FROM employees_1998 AS e
    JOIN team AS q ON e.boss_id = q.id
  )
  SELECT count(*) AS knew_it FROM team;
answer: "12"
answerLabel: How many people knew the combination?
reveal: |
  **Twelve.** Rosa Ugarte (214), head of Treasury, changed the combination on Tuesday the 15th and said only she and "everyone who reports to me, directly or indirectly" knew it: two supervisors, an assistant, seven cashiers and a trainee who reports to a cashier. With `WHERE department = 'Treasury'` you'd have counted 9, with Hugo the messenger in and three of the team out. Teodoro, the guard, was **not** among the twelve.
hints:
  - "Employee 214's statement says it: she and everyone who reports to her. It's the tree that starts at 214."
  - "Walk the tree with `WITH RECURSIVE` and, outside, `SELECT count(*)`."
```

## The judge

As in earlier sessions: your query runs on the sample tables and on hidden databases. Here the hidden databases have cycles, numbers that call each other back and numbers on their own.

```exercise
id: sql12-juez-tres-llamadas
type: judge
title: Three calls away
prompt: |
  **Return every number that is 3 calls or fewer from the starting number, with its shortest distance. Order by distance, then by number.**

  A call links two numbers **both ways**: if A called B, B is 1 away from A and A is 1 away from B. A number's distance is the fewest calls you have to chain to reach it. The starting number isn't in the result, even if you can get back to it.

  **Tables:** `calls(caller, callee)` and `start_number(number)`, which has a single row.

  **Result:** `number` and its distance (1, 2 or 3), ordered by distance and then by `number`.
schema: |
  CREATE TABLE calls (caller TEXT, callee TEXT);
  CREATE TABLE start_number (number TEXT);
ordered: true
starter: |
  SELECT callee, 1
  FROM calls
  WHERE caller = (SELECT number FROM start_number);
solution: |
  WITH RECURSIVE
    edges(a, b) AS (
      SELECT caller, callee FROM calls
      UNION ALL
      SELECT callee, caller FROM calls
    ),
    network(number, hops) AS (
      SELECT number, 0 FROM start_number
      UNION
      SELECT x.b, r.hops + 1
      FROM network AS r
      JOIN edges AS x ON x.a = r.number
      WHERE r.hops < 3
    )
  SELECT number, MIN(hops) AS distance
  FROM network
  WHERE number <> (SELECT number FROM start_number)
  GROUP BY number
  ORDER BY distance, number;
hints:
  - "First build the edges both ways (`caller, callee` and `callee, caller` with `UNION ALL`) and walk them with a `hops < 3` limit."
  - "A number can be reached by several paths: `GROUP BY number` with `MIN(hops)`. And take the start out with a `WHERE`."
samples:
  - rows:
      calls: [["111", "222"], ["222", "333"], ["444", "333"], ["333", "555"], ["555", "666"]]
      start_number: [["111"]]
    note: "222 is 1 away; 333 is 2; 444 and 555 are 3 (444 called 333, it counts all the same). 666 is 4 away: it's not in."
  - rows:
      calls: [["700", "800"], ["800", "900"], ["900", "700"]]
      start_number: [["800"]]
    note: "A triangle: 700 and 900 are 1 away. Getting back to 800 doesn't count."
edge:
  - rows: { calls: [], start_number: [["123"]] }
    tag: with no calls at all
  - rows: { calls: [["100", "200"], ["300", "400"]], start_number: [["999"]] }
    tag: with a starting number nobody called
  - rows: { calls: [["100", "200"], ["200", "100"], ["100", "200"], ["200", "300"], ["300", "100"]], start_number: [["100"]] }
    tag: with repeated calls and calls back
random:
  count: 40
  seed: 1212
  generate: |
    const pool = Array.from({ length: rng.int(4, 14) }, (_, i) => String(100 + i * 7));
    const m = rng.int(0, 22);
    const calls = [];
    for (let i = 0; i < m; i++) {
      const a = rng.pick(pool);
      let b = rng.pick(pool);
      if (b === a) b = pool[(pool.indexOf(a) + 1) % pool.length];
      calls.push([a, b]);
    }
    return { calls, start_number: [[rng.pick(pool)]] };
wrong:
  - |
    WITH RECURSIVE network(number, hops) AS (SELECT number, 0 FROM start_number UNION SELECT l.callee, r.hops + 1 FROM network r JOIN calls l ON l.caller = r.number WHERE r.hops < 3) SELECT number, MIN(hops) AS d FROM network WHERE number <> (SELECT number FROM start_number) GROUP BY number ORDER BY d, number;
  - |
    WITH RECURSIVE x(a, b) AS (SELECT caller, callee FROM calls UNION ALL SELECT callee, caller FROM calls), network(number, hops) AS (SELECT number, 0 FROM start_number UNION SELECT x.b, r.hops + 1 FROM network r JOIN x ON x.a = r.number WHERE r.hops < 2) SELECT number, MIN(hops) AS d FROM network WHERE number <> (SELECT number FROM start_number) GROUP BY number ORDER BY d, number;
  - |
    WITH RECURSIVE x(a, b) AS (SELECT caller, callee FROM calls UNION ALL SELECT callee, caller FROM calls), network(number, hops) AS (SELECT number, 0 FROM start_number UNION SELECT x.b, r.hops + 1 FROM network r JOIN x ON x.a = r.number WHERE r.hops < 3) SELECT number, MAX(hops) AS d FROM network WHERE number <> (SELECT number FROM start_number) GROUP BY number ORDER BY d, number;
  - |
    WITH RECURSIVE x(a, b) AS (SELECT caller, callee FROM calls UNION ALL SELECT callee, caller FROM calls), network(number, hops) AS (SELECT number, 0 FROM start_number UNION SELECT x.b, r.hops + 1 FROM network r JOIN x ON x.a = r.number WHERE r.hops < 3) SELECT number, MIN(hops) AS d FROM network GROUP BY number ORDER BY d, number;
```

## Final mission

```exercise
id: sql12-mision-red
type: mission
title: Three calls from the public phone
prompt: |
  **List the employees who knew the combination (employee 214's team) whose home phone was 3 calls or fewer from the public phone `'4723310'` on the night of the robbery, from Friday 18th at 20:00 to Saturday 19th at 02:00.** Show `id`, `name`, `role` and `hops` (the shortest distance), ordered by `hops` and then `id`. Then say how many there are.

  Teodoro said the call that fooled him reached the booth at 23:41. The phone book says it came from the **public phone** on Av. México, opposite the mill. Whoever set it up had to talk to that phone, directly or through someone.

  Once your query proves it and you answer, together with the judge, session 13 opens.
visual:
  - setting:
      case: frio
  - schema:
      tables: [employees_1998, calls_1998]
starter: |
  WITH RECURSIVE
    edges(a, b) AS (
      SELECT caller, callee FROM calls_1998
      WHERE started BETWEEN '1998-12-18 20:00' AND '1998-12-19 02:00'
      UNION ALL
      SELECT callee, caller FROM calls_1998
      WHERE started BETWEEN '1998-12-18 20:00' AND '1998-12-19 02:00'
    )
  SELECT a, b FROM edges
  WHERE a = '4723310';
solution: |
  WITH RECURSIVE
    team(id) AS (
      SELECT id FROM employees_1998 WHERE id = 214
      UNION ALL
      SELECT e.id FROM employees_1998 AS e JOIN team AS q ON e.boss_id = q.id
    ),
    edges(a, b) AS (
      SELECT caller, callee FROM calls_1998
      WHERE started BETWEEN '1998-12-18 20:00' AND '1998-12-19 02:00'
      UNION ALL
      SELECT callee, caller FROM calls_1998
      WHERE started BETWEEN '1998-12-18 20:00' AND '1998-12-19 02:00'
    ),
    network(number, hops, path) AS (
      SELECT '4723310', 0, '4723310'
      UNION ALL
      SELECT x.b, r.hops + 1, r.path || '>' || x.b
      FROM network AS r
      JOIN edges AS x ON x.a = r.number
      WHERE r.hops < 3 AND instr(r.path, x.b) = 0
    )
  SELECT e.id, e.name, e.role, MIN(r.hops) AS hops
  FROM network AS r
  JOIN employees_1998 AS e ON e.phone = r.number
  JOIN team AS q ON q.id = e.id
  GROUP BY e.id, e.name, e.role
  ORDER BY hops, e.id;
answer: "3"
answerLabel: How many of the twelve were three calls away or fewer?
reveal: |
  **Three.** **Víctor Salazar Montes**, cash supervisor, **1** call away: his home called the public phone. **Rosa Ugarte Bustamante**, the head, and **Nilton Palomino Ríos**, a cashier, **2** away. See them on the case board. Being close in the graph proves nothing: you need to see **who called whom, when and for how long**. That means looking at all of December, and there the query gets slow. That's session 13.
hints:
  - "You need three CTEs in the same `WITH RECURSIVE`: `team` (214's tree), `edges` (already there) and `network`, walking from `'4723310'` with `hops < 3` and the path check with `instr`."
  - "At the end, join `network` to `employees_1998` on `phone = number` and to `team` on `id`, and group to keep `MIN(hops)`."
tests:
  - name: the team members 3 calls away or fewer, with their distance
    same: WITH RECURSIVE q(id) AS (SELECT id FROM employees_1998 WHERE id = 214 UNION ALL SELECT e.id FROM employees_1998 e JOIN q ON e.boss_id = q.id), x(a, b) AS (SELECT caller, callee FROM calls_1998 WHERE started BETWEEN '1998-12-18 20:00' AND '1998-12-19 02:00' UNION ALL SELECT callee, caller FROM calls_1998 WHERE started BETWEEN '1998-12-18 20:00' AND '1998-12-19 02:00'), r(n, s) AS (SELECT '4723310', 0 UNION SELECT x.b, r.s + 1 FROM r JOIN x ON x.a = r.n WHERE r.s < 3) SELECT e.id, e.name, e.role, MIN(r.s) FROM r JOIN employees_1998 e ON e.phone = r.n JOIN q ON q.id = e.id GROUP BY e.id ORDER BY 4, 1
    ordered: true
  - name: columns id, name, role and hops
    columns: [id, name, role, hops]
  - name: walks the tree and the graph with WITH RECURSIVE
    source: '\bWITH\s+RECURSIVE\b'
```

## Expert challenge

```exercise
id: sql12-reto-ruta
type: challenge
title: The shortest route, written out
prompt: |
  **Return the shortest path on the night of the robbery (18th at 20:00 → 19th at 02:00) between the public phone `'4723310'` and Teodoro's home `'2715504'`, as text: the numbers separated by `' > '`.** One row and one column, `route`. If several paths were equally short, the first in alphabetical order.

  For those who already code: it's a BFS with a path. Walk from the public phone, keep the path as text, filter the ones ending at `'2715504'` and keep the one with the fewest hops.
starter: |
  SELECT caller, callee, started
  FROM calls_1998
  WHERE callee = '2715504'
    AND started BETWEEN '1998-12-18 20:00' AND '1998-12-19 02:00';
solution: |
  WITH RECURSIVE
    edges(a, b) AS (
      SELECT caller, callee FROM calls_1998
      WHERE started BETWEEN '1998-12-18 20:00' AND '1998-12-19 02:00'
      UNION ALL
      SELECT callee, caller FROM calls_1998
      WHERE started BETWEEN '1998-12-18 20:00' AND '1998-12-19 02:00'
    ),
    network(number, hops, route) AS (
      SELECT '4723310', 0, '4723310'
      UNION ALL
      SELECT x.b, r.hops + 1, r.route || ' > ' || x.b
      FROM network AS r
      JOIN edges AS x ON x.a = r.number
      WHERE r.hops < 4 AND instr(r.route, x.b) = 0
    )
  SELECT route FROM network
  WHERE number = '2715504'
  ORDER BY hops, route
  LIMIT 1;
hints:
  - "Give it a generous hop limit (4) so it ends, and order at the end by `hops, route`."
tests:
  - name: the shortest route
    same: SELECT '4723310 > 4721093 > 2715504'
  - name: column route
    columns: [route]
```
