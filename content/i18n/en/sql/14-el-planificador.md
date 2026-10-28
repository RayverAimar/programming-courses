# Session 14 — The planner and joins inside

```session
case: frio
```

## The job

Tuesday 31 March, evening. Haydée is back at Loop. On the board there are two relays from the same home, **4417825**, and a safe locksmith that home called five times. The 1998 phone book says the line was registered to **Gloria Tello de Salazar**, who didn't work at the mill: to know who on the team lived in that home you have to cross the phone book with the **payroll**, which does keep each employee's phone.

"That's not enough," Haydée says. "They convicted my dad on less, but I don't want to do to anyone what they did to him." She's right: the proof has to be **a single query** that crosses everything at once: who knew the combination (session 12's tree), the relays (session 13) and the staff list. Four tables, two of them huge.

When you write a `JOIN`, you don't say **how** to put the rows together: SQLite's **planner** decides that, the part that reads your query and picks one plan among many. Today you learn how it chooses, what it does when there's no index and how other engines do it.

```setting
case: frio
title: What's left to prove
caption: "The booth, the side door and the public phone across the street. It remains to prove, in a single query, that this home made the relays."
```

```dossier
title: What the 1998 phone book says
cards:
  - name: Gloria Tello de Salazar
    traits: { style: bun, hair: "#1f1712", shirt: "#c49a3f" }
    role: Holder of phone 4417825
    rows: [["Address", "Calle Los Geranios 145, San Borja"], ["Kind", "home"]]
    quote: "(She gave no statement in 1998: nobody asked her.)"
  - name: Cerrajería El Candado
    kind: note
    role: Phone 4256641
    rows: [["Address", "Jr. Huánuco 1290, La Victoria"], ["Trade", "safes and keys"]]
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

**A JOIN in SQLite is a loop inside a loop.** For `A JOIN B ON …`, SQLite takes a row from the **outer** table and looks for its partners in the **inner** one; then the next outer row, and so on. It's the *nested loop* you saw in session 5. What decides whether it takes 1 millisecond or 10 seconds is **which table goes outside** and **how the inner one is searched**.

```joinalgo
title: "Nested loop: every outer row walks the whole inner table"
algo: nested
on: [callee, number]
left: { name: calls, cols: [id, callee], rows: [[1, "4256641"], [2, "4723310"], [3, "4402216"], [4, "4256641"], [5, "4999999"], [6, "4721093"]] }
right: { name: phones, cols: [number, holder], rows: [["4721093", "Booth"], ["4256641", "El Candado"], ["4402216", "Rosa Ugarte"], ["4723310", "Public phone"], ["4417825", "Gloria Tello"]] }
caption: "6 rows outside times 5 inside: 30 comparisons. With 60,000 calls and 5,000 phones it would be 300 million."
```

**The planner picks the order, not you.** Writing the tables the other way round doesn't change the plan: SQLite estimates the cost of every possible order and keeps the cheapest. To estimate it uses what it knows: which indexes exist, which columns the `WHERE` fixes and, if you gave it them, how many rows each table has. Here employee 318 is **one** row (looked up by `id`), so it goes outside, and inside their calls are looked up by `caller`:

```plan
title: "employees_1998 outside: 1 row; calls_1998 inside, with an index"
setup: CREATE INDEX idx_calls_caller ON calls_1998(caller);
query: |
  SELECT e.name, l.started, l.callee
  FROM calls_1998 AS l
  JOIN employees_1998 AS e ON l.caller = e.phone
  WHERE e.id = 318;
caption: "`calls_1998` was written first, but the plan starts with `e`. The plan's first line is the outer loop."
```

```figure
title: The same JOIN, two possible orders
panes:
  - label: "e outside (1 row), l inside with an index"
    value: "1 × ~4 pages"
  - label: "l outside (60,000 rows), e inside by id"
    value: "60,000 × 3 pages"
```

**No index? SQLite makes one.** If there's no useful index inside and the outer loop has many rows, SQLite may build an **automatic index**: it reads the inner table once, builds a temporary B-tree on the `ON` column and uses it for every outer row. When the query ends it throws it away. The plan says `AUTOMATIC`:

```plan
title: "An automatic index, built for this query and thrown away after"
query: |
  SELECT e.name, l.started
  FROM calls_1998 AS l
  JOIN employees_1998 AS e ON l.caller = e.phone
  WHERE l.started >= '1998-12-18 23:00';
```

It's a good emergency exit, but you pay for it **on every run**: reading the whole table and sorting it. That's why session 12's walk with `edges` didn't hang over all of December (SQLite indexed `edges` by itself) and the `OR` version did: an `OR` across two columns can't even use an automatic index.

**Other engines have more algorithms.** SQLite only does nested loops (with an index, with an automatic index or with nothing). PostgreSQL, MySQL 8 and SQL Server also have:

- **Hash join**: reads the small table once and spreads it into **buckets** by a hash of the key; then each row of the big one computes its bucket and compares **only** with what's there. Ideal for joining big tables on equality with no index.
- **Merge join**: if both tables are **sorted** by the key (through an index, or after sorting them), it moves one finger along each, like merging two sorted lists. Each row is looked at almost once.

```joinalgo
title: "Hash join (PostgreSQL): build the buckets, then probe"
algo: hash
buckets: 3
on: [callee, number]
left: { name: calls, cols: [id, callee], rows: [[1, "4256641"], [2, "4723310"], [3, "4402216"], [4, "4256641"], [5, "4999999"], [6, "4721093"]] }
right: { name: phones, cols: [number, holder], rows: [["4721093", "Booth"], ["4256641", "El Candado"], ["4402216", "Rosa Ugarte"], ["4723310", "Public phone"], ["4417825", "Gloria Tello"]] }
```

```joinalgo
title: "Merge join (PostgreSQL): two sorted lists, one finger on each"
algo: merge
on: [callee, number]
left: { name: calls, cols: [id, callee], rows: [[1, "4256641"], [2, "4723310"], [3, "4402216"], [4, "4256641"], [5, "4999999"], [6, "4721093"]] }
right: { name: phones, cols: [number, holder], rows: [["4721093", "Booth"], ["4256641", "El Candado"], ["4402216", "Rosa Ugarte"], ["4723310", "Public phone"], ["4417825", "Gloria Tello"]] }
```

In PostgreSQL, `EXPLAIN` shows `Hash Join`, `Merge Join` or `Nested Loop`, and the planner picks among the three from its statistics.

**Sorting and grouping cost too.** If the `ORDER BY` or `GROUP BY` doesn't match an index's order, SQLite builds a **temporary B-tree** to sort: in the plan, `USE TEMP B-TREE`. With an index that already brings rows in that order, it skips it:

```plan
title: "Grouping with no index: two temporary trees"
query: |
  SELECT caller, count(*) AS times
  FROM calls_1998
  WHERE callee = '4721093'
  GROUP BY caller
  ORDER BY caller;
```

```plan
title: "With the index (callee, caller): already grouped and in order"
setup: CREATE INDEX idx_calls_callee_caller ON calls_1998(callee, caller);
query: |
  SELECT caller, count(*) AS times
  FROM calls_1998
  WHERE callee = '4721093'
  GROUP BY caller
  ORDER BY caller;
```

**ANALYZE: giving the planner numbers.** Without statistics, SQLite assumes any equality index leaves few rows. With two candidate indexes, it can pick the wrong one. `ANALYZE` reads the tables and stores in `sqlite_stat1` how many rows there are and how many, on average, each value of each index brings:

```plan
title: "Before ANALYZE: it picks the index on kind"
setup: |
  CREATE INDEX idx_phones_district ON phones_1998(district);
  CREATE INDEX idx_phones_kind ON phones_1998(kind);
query: |
  SELECT number FROM phones_1998
  WHERE kind = 'home' AND district = 'Breña';
```

```plan
title: "After ANALYZE: it knows kind = 'home' brings thousands of rows"
setup: |
  CREATE INDEX idx_phones_district ON phones_1998(district);
  CREATE INDEX idx_phones_kind ON phones_1998(kind);
  ANALYZE;
query: |
  SELECT number FROM phones_1998
  WHERE kind = 'home' AND district = 'Breña';
```

```sql run
CREATE INDEX idx_phones_district ON phones_1998(district);
CREATE INDEX idx_phones_kind ON phones_1998(kind);
ANALYZE;
SELECT idx, stat FROM sqlite_stat1
WHERE tbl = 'phones_1998';
```

`'5135 1712'` reads: 5135 rows in the table; each value of `kind` brings, on average, 1712. Each `district`, about 257. The planner prefers the more selective one.

**Measuring.** The plan says **what** it will do; to know **how long** it takes you measure on real data. In SQLite's shell, `.timer on` before the query. In PostgreSQL, `EXPLAIN ANALYZE` runs the query and notes the real rows and milliseconds at each step. The rule: measure, change **one** thing (an index, `ANALYZE`, a rewritten condition), measure again.

> **Common trap:** reordering the tables in the `FROM` "to make it faster" does nothing: the planner reorders them anyway. What changes the plan is giving it **options** (an index that serves the condition) and **information** (`ANALYZE` after loading or changing lots of data). If you truly want to force the order, SQLite keeps the written order with `CROSS JOIN`; it's almost never needed, and when the data changes, the forced plan goes stale.

<!-- legacy: join-hints -->

<!-- mdn: join-hints -->

## Practice

```exercise
id: sql14-predice-orden
type: predict
title: The written order changes nothing
prompt: |
  What does it return?
code: |
  SELECT
    (SELECT count(*) FROM employees_1998 AS e
     JOIN calls_1998 AS l ON l.caller = e.phone
     WHERE e.id = 318),
    (SELECT count(*) FROM calls_1998 AS l
     JOIN employees_1998 AS e ON l.caller = e.phone
     WHERE e.id = 318);
options:
  - "12 | 12"
  - "12 | 60090"
  - "1 | 12"
  - "12 | 0"
answer: "12 | 12"
explain: |
  An `INNER JOIN` is symmetric: the order you write the tables in changes neither the result nor the plan, because the planner picks the order itself. Víctor's home made 12 calls in December.
```

```exercise
id: sql14-predice-estadistica
type: predict
title: What ANALYZE keeps
prompt: |
  `phones_1998` has 5135 rows and `kind` takes three values: `'home'`, `'business'` and `'public'`. What does it return?
code: |
  CREATE INDEX idx_phones_kind ON phones_1998(kind);
  ANALYZE;
  SELECT stat FROM sqlite_stat1
  WHERE idx = 'idx_phones_kind';
options:
  - "5135 1712"
  - "5135 3"
  - "3 1712"
  - "5135"
answer: "5135 1712"
explain: |
  The first number is how many rows the table has; the second, how many rows one index value brings on average: 5135 / 3, rounded up. With that the planner knows `kind = 'home'` barely filters anything.
```

```exercise
id: sql14-completa-orden
type: complete
title: No separate sort
prompt: |
  List the last 5 calls the guard booth `'4721093'` received in December (`started` and `caller`), newest first. Create the index that makes the plan **not** need a `TEMP B-TREE` to sort. Replace the `___`.
visual:
  plan:
    title: Today
    query: SELECT started, caller FROM calls_1998 WHERE callee = '4721093' ORDER BY started DESC LIMIT 5;
starter: |
  CREATE INDEX idx_calls_callee_started ON calls_1998(___, ___);

  SELECT started, caller
  FROM calls_1998
  WHERE callee = '4721093'
  ORDER BY started DESC
  LIMIT 5;
solution: |
  CREATE INDEX idx_calls_callee_started ON calls_1998(callee, started);

  SELECT started, caller
  FROM calls_1998
  WHERE callee = '4721093'
  ORDER BY started DESC
  LIMIT 5;
hints:
  - "First the column the `WHERE` fixes; then the `ORDER BY` one. An index can be read backwards, so `DESC` needs no other."
tests:
  - name: the last five, in order
    same: SELECT started, caller FROM calls_1998 WHERE callee = '4721093' ORDER BY started DESC LIMIT 5
    ordered: true
  - name: no separate sort
    planNot: 'TEMP B-TREE'
  - name: searches with the index
    plan: 'SEARCH calls_1998 USING INDEX'
```

```exercise
id: sql14-arregla-cross
type: fix
title: The forced order
prompt: |
  There's already an index on `caller`. Someone wrote `CROSS JOIN` "to make it faster", and that forces SQLite to put `calls_1998` outside: it reads all 60,000 calls. Fix it so the planner chooses: the plan must start by looking up employee 318 by `id` and then search their calls with the index. The result doesn't change.
setup: CREATE INDEX idx_calls_caller ON calls_1998(caller);
visual:
  plan:
    title: The forced plan
    setup: CREATE INDEX idx_calls_caller ON calls_1998(caller);
    query: SELECT e.name, l.started, l.callee FROM calls_1998 AS l CROSS JOIN employees_1998 AS e WHERE l.caller = e.phone AND e.id = 318 ORDER BY l.started;
starter: |
  SELECT e.name, l.started, l.callee
  FROM calls_1998 AS l
  CROSS JOIN employees_1998 AS e
  WHERE l.caller = e.phone AND e.id = 318
  ORDER BY l.started;
solution: |
  SELECT e.name, l.started, l.callee
  FROM calls_1998 AS l
  JOIN employees_1998 AS e ON l.caller = e.phone
  WHERE e.id = 318
  ORDER BY l.started;
hints:
  - "A plain `JOIN … ON` lets the planner choose the order."
tests:
  - name: the same rows, in order
    same: SELECT e.name, l.started, l.callee FROM calls_1998 l JOIN employees_1998 e ON l.caller = e.phone WHERE e.id = 318 ORDER BY l.started
    ordered: true
  - name: starts with the employee and searches their calls with the index
    plan: '^SEARCH e USING INTEGER PRIMARY KEY.* · SEARCH l USING INDEX'
```

```exercise
id: sql14-escribe-agrupa
type: write
title: Who called the booth, no temporary trees
prompt: |
  Count how many times each number called the guard booth `'4721093'` in December: columns `caller` and `times`, ordered by `caller`. Create **one** index so the plan uses no `TEMP B-TREE` at all (neither to group nor to sort).
starter: |
  SELECT caller, count(*) AS times
  FROM calls_1998
  WHERE callee = '4721093'
  GROUP BY caller
  ORDER BY caller;
solution: |
  CREATE INDEX idx_calls_callee_caller ON calls_1998(callee, caller);

  SELECT caller, count(*) AS times
  FROM calls_1998
  WHERE callee = '4721093'
  GROUP BY caller
  ORDER BY caller;
hints:
  - "Within one `callee`, the index `(callee, caller)` brings rows sorted by `caller`: grouping them is counting as they pass."
tests:
  - name: how many times each number called
    same: SELECT caller, count(*) FROM calls_1998 WHERE callee = '4721093' GROUP BY caller ORDER BY caller
    ordered: true
  - name: columns caller and times
    columns: [caller, times]
  - name: no temporary trees
    planNot: 'TEMP B-TREE'
```

```exercise
id: sql14-escribe-analyze
type: write
title: Give it statistics
prompt: |
  Create two indexes on `phones_1998`, one on `district` and one on `kind`, and make the query for home phones in Breña (`number`, in order) use the index **on district**, the one that filters more. Don't change the query: give the planner what it's missing.
starter: |
  CREATE INDEX idx_phones_district ON phones_1998(district);
  CREATE INDEX idx_phones_kind ON phones_1998(kind);

  SELECT number FROM phones_1998
  WHERE kind = 'home' AND district = 'Breña'
  ORDER BY number;
solution: |
  CREATE INDEX idx_phones_district ON phones_1998(district);
  CREATE INDEX idx_phones_kind ON phones_1998(kind);
  ANALYZE;

  SELECT number FROM phones_1998
  WHERE kind = 'home' AND district = 'Breña'
  ORDER BY number;
hints:
  - "Without statistics, SQLite thinks both indexes filter the same. One single word, between the indexes and the query."
tests:
  - name: the home phones in Breña
    same: SELECT number FROM phones_1998 WHERE kind = 'home' AND district = 'Breña' ORDER BY number
    ordered: true
  - name: uses the index on district
    plan: 'INDEX idx_phones_district'
```

## The case

```exercise
id: sql14-caso-caseta
type: case
title: The call nobody answered
prompt: |
  **Who did the guard booth call after the technician left (between 00:40 and 06:00 on Saturday 19th)?** Type the person's full name.

  In 1998 nobody checked this part of Teodoro's statement. List the calls that **went out** from the booth `'4721093'` in that window, with the number's holder in `phones_1998` and, if it belongs to someone on the staff list, their name in `employees_1998`. Before running it, look at the plan with `EXPLAIN QUERY PLAN`: which table goes outside?
visual:
  - setting:
      case: frio
  - schema:
      tables: [calls_1998, phones_1998, employees_1998]
starter: |
  -- What Teodoro said
  SELECT text
  FROM statements_1998
  WHERE employee_id = 590;
solution: |
  SELECT l.started, l.callee, l.duration_s, t.holder, e.name, e.role
  FROM calls_1998 AS l
  LEFT JOIN phones_1998 AS t ON t.number = l.callee
  LEFT JOIN employees_1998 AS e ON e.phone = l.callee
  WHERE l.caller = '4721093'
    AND l.started >= '1998-12-19 00:40'
    AND l.started < '1998-12-19 06:00'
  ORDER BY l.started;
answer: Rosa Ugarte Bustamante
answerLabel: Who did the booth call? (full name)
reveal: |
  **Rosa Ugarte Bustamante**, head of Treasury, at **00:52** and at **00:55**: two calls of **0 seconds**. Nobody answered, just as Teodoro ("nobody answered") and Rosa ("I didn't hear the phone") said. Teodoro was telling the truth, and he called exactly the person the impostor had named. Rosa is ruled out: her home made no call that night. In the plan, `l` goes outside (filtered by `caller` and time) and `t` and `e` are looked up inside, with automatic indexes.
hints:
  - "`WHERE l.caller = '4721093' AND l.started >= '1998-12-19 00:40' AND l.started < '1998-12-19 06:00'`."
  - "`LEFT JOIN phones_1998 AS t ON t.number = l.callee` and another `LEFT JOIN` to `employees_1998` on `phone`."
```

## The judge

Hidden databases, as always. Here there are numbers with several calls at the exact same time: read carefully how ties are broken.

```exercise
id: sql14-juez-ultima
type: judge
title: Each number's last call
prompt: |
  **Return, for every number that made calls, its last call: `caller`, `started` and `callee`. Order by `caller`.** If a number has several calls at the same time, and that time is the latest, the last one is the one with the **highest `id`**.

  The naive way is a correlated subquery that, for every row, looks up its number's maximum again: one search per row. Write it with **`JOIN`** and **`GROUP BY`** (grouping once), the way the planner likes it. The `id`s are not in time order.

  **Table:** `calls(id, caller, callee, started)`, with a unique `id`.

  **Result:** `caller`, `started`, `callee`, ordered by `caller`.
schema: |
  CREATE TABLE calls (id INTEGER, caller TEXT, callee TEXT, started TEXT);
ordered: true
starter: |
  SELECT caller, MAX(started)
  FROM calls
  GROUP BY caller
  ORDER BY caller;
solution: |
  WITH latest AS (
    SELECT caller, MAX(started) AS started
    FROM calls
    GROUP BY caller
  ),
  chosen AS (
    SELECT l.caller, MAX(l.id) AS id
    FROM calls AS l
    JOIN latest AS u ON u.caller = l.caller AND u.started = l.started
    GROUP BY l.caller
  )
  SELECT l.caller, l.started, l.callee
  FROM calls AS l
  JOIN chosen AS c ON c.id = l.id
  ORDER BY l.caller;
hints:
  - "First, with `GROUP BY caller`, each number's `MAX(started)`. Then a `JOIN` with the table to keep the rows that have that maximum."
  - "If there's a tie, group again and take `MAX(id)`; at the end, a `JOIN` on `id` brings the `callee`."
tests:
  - name: uses JOIN
    source: '\bJOIN\b'
    msg: Join each number's maximum to the table with JOIN.
  - name: uses GROUP BY
    source: '\bGROUP\s+BY\b'
samples:
  - rows:
      calls: [[1, "100", "200", "1998-12-18 22:58:26"], [2, "100", "300", "1998-12-18 23:36:15"], [3, "200", "100", "1998-12-17 10:00:00"], [4, "300", "100", "1998-12-19 00:52:08"], [5, "300", "200", "1998-12-19 00:55:40"]]
    note: "100's last is the 23:36 one; 200 has only one; 300's is the 00:55 one."
  - rows:
      calls: [[8, "100", "400", "1998-12-18 23:41:02"], [9, "100", "500", "1998-12-18 23:41:02"], [3, "100", "600", "1998-12-18 20:00:00"]]
    note: "Two calls at 23:41:02: the higher id wins, 9."
edge:
  - rows: { calls: [] }
    tag: with no calls
  - rows: { calls: [[1, "100", "200", "1998-12-18 10:00:00"], [7, "100", "300", "1998-12-18 10:00:00"], [4, "100", "400", "1998-12-18 10:00:00"]] }
    tag: with three calls at the same time
  - rows: { calls: [[10, "100", "200", "1998-12-18 09:00:00"], [2, "100", "300", "1998-12-18 11:00:00"]] }
    tag: with the higher id on the older call
random:
  count: 40
  seed: 1414
  generate: |
    const nums = ["100", "200", "300", "400", "500"];
    const times = ["1998-12-18 09:00:00", "1998-12-18 12:30:00", "1998-12-18 23:41:02", "1998-12-19 00:52:08"];
    const n = rng.int(0, 14);
    const ids = [];
    while (ids.length < n) { const k = rng.int(1, 60); if (!ids.includes(k)) ids.push(k); }
    ids.sort((a, b) => a - b);
    return { calls: ids.map((id) => [id, rng.pick(nums), rng.pick(nums), rng.pick(times)]) };
wrong:
  - |
    SELECT caller, MAX(started), callee FROM calls GROUP BY caller ORDER BY caller;
  - |
    SELECT l.caller, l.started, l.callee FROM calls l JOIN (SELECT caller, MAX(started) AS m FROM calls GROUP BY caller) u ON u.caller = l.caller AND u.m = l.started ORDER BY l.caller;
  - |
    SELECT l.caller, l.started, l.callee FROM calls l JOIN (SELECT caller, MAX(id) AS id FROM calls GROUP BY caller) u ON u.id = l.id ORDER BY l.caller;
```

## Final mission

```exercise
id: sql14-mision-culpable
type: mission
title: One query, all the evidence
prompt: |
  **Write the query that proves who set up the call to the booth: the employee who knew the combination (employee 214's team) and whose home phone made December's relays (someone calls a public phone and, within 10 minutes, that public phone calls the booth `'4721093'`).** Show `id`, `name`, `role` and `relays` (how many they made). Create whatever indexes it needs: the plan must **search with an index of yours**. Then type their name.

  It's everything you already know, together: a `WITH RECURSIVE` for the team, a self-join for the relays and two `JOIN`s to the staff list. The planner will decide the order; you give it the index.
visual:
  - setting:
      case: frio
  - schema:
      tables: [employees_1998, calls_1998, phones_1998]
  - figure:
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
starter: |
  WITH relays AS (
    SELECT a.caller, a.started
    FROM calls_1998 AS a
    JOIN calls_1998 AS b
      ON b.caller = a.callee
     AND b.started BETWEEN a.started AND datetime(a.started, '+10 minutes')
    JOIN phones_1998 AS t ON t.number = a.callee
    WHERE b.callee = '4721093' AND t.kind = 'public'
  )
  SELECT caller, count(*) AS relays
  FROM relays
  GROUP BY caller;
solution: |
  CREATE INDEX idx_calls_callee_started ON calls_1998(callee, started);

  WITH RECURSIVE
    team(id) AS (
      SELECT id FROM employees_1998 WHERE id = 214
      UNION ALL
      SELECT e.id FROM employees_1998 AS e JOIN team AS q ON e.boss_id = q.id
    ),
    relays AS (
      SELECT a.caller, a.started
      FROM calls_1998 AS a
      JOIN calls_1998 AS b
        ON b.caller = a.callee
       AND b.started BETWEEN a.started AND datetime(a.started, '+10 minutes')
      JOIN phones_1998 AS t ON t.number = a.callee
      WHERE b.callee = '4721093' AND t.kind = 'public'
    )
  SELECT e.id, e.name, e.role, count(*) AS relays
  FROM relays AS r
  JOIN employees_1998 AS e ON e.phone = r.caller
  JOIN team AS q ON q.id = e.id
  GROUP BY e.id, e.name, e.role;
answer: Víctor Salazar Montes
answerLabel: Who set up the call to the booth? (full name)
reveal: |
  **Víctor Salazar Montes**, cash supervisor, employee 318. He knew the new combination because he reported to Rosa Ugarte. From his home (registered to his wife, Gloria Tello) he called **Cerrajería El Candado**, a safe specialist, five times, though he swore he knew no locksmith. And on both relay nights, Tuesday 15th and Friday 18th, his home called the public phone on Av. México and, minutes later, that phone called the booth to announce "the technician, on behalf of Mrs Ugarte".

  Teodoro Llanos was telling the truth. Haydée takes a copy of this query, the plan and the case board to the prosecutor's office: the robbery lapsed years ago, but her father's name didn't. **Case closed.**
hints:
  - "Copy the starter's `relays` into a `WITH RECURSIVE` that also has `team` (214's tree, session 12)."
  - "Join `relays` to `employees_1998` on `phone = caller` and to `team` on `id`; group and count. And before everything, `CREATE INDEX … ON calls_1998(callee, started)`."
tests:
  - name: the team member who made the relays
    same: WITH RECURSIVE q(id) AS (SELECT id FROM employees_1998 WHERE id = 214 UNION ALL SELECT e.id FROM employees_1998 e JOIN q ON e.boss_id = q.id) SELECT e.id, e.name, e.role, count(*) FROM calls_1998 a JOIN calls_1998 b ON b.caller = a.callee AND b.started BETWEEN a.started AND datetime(a.started, '+10 minutes') JOIN phones_1998 t ON t.number = a.callee JOIN employees_1998 e ON e.phone = a.caller JOIN q ON q.id = e.id WHERE b.callee = '4721093' AND t.kind = 'public' GROUP BY e.id
  - name: columns id, name, role and relays
    columns: [id, name, role, relays]
  - name: crosses the team with WITH RECURSIVE
    source: '\bWITH\s+RECURSIVE\b'
  - name: the plan searches with your index (not an automatic one)
    plan: 'USING (COVERING )?INDEX'
    msg: Create an index with CREATE INDEX before the query.
```

## Expert challenge

```exercise
id: sql14-reto-ultima
type: challenge
title: The last call of each of the twelve
prompt: |
  **For each of the 12 people who knew the combination, return `name`, `phone` and `last_call` (the `started` of the last call their home made in December, or `NULL` if they have no phone or didn't call), ordered by `name`.** The plan must search the calls with an index on `caller`, not read them all.

  For those who already code: `LEFT JOIN` so you don't lose whoever has no phone, a grouped `MAX` and an index that turns each of the twelve into a lookup, not a SCAN of 60,000 rows.
starter: |
  WITH RECURSIVE team(id) AS (
    SELECT id FROM employees_1998 WHERE id = 214
    UNION ALL
    SELECT e.id FROM employees_1998 AS e JOIN team AS q ON e.boss_id = q.id
  )
  SELECT e.name, e.phone
  FROM team AS q
  JOIN employees_1998 AS e ON e.id = q.id
  ORDER BY e.name;
solution: |
  CREATE INDEX idx_calls_caller_started ON calls_1998(caller, started);

  WITH RECURSIVE team(id) AS (
    SELECT id FROM employees_1998 WHERE id = 214
    UNION ALL
    SELECT e.id FROM employees_1998 AS e JOIN team AS q ON e.boss_id = q.id
  )
  SELECT e.name, e.phone, MAX(l.started) AS last_call
  FROM team AS q
  JOIN employees_1998 AS e ON e.id = q.id
  LEFT JOIN calls_1998 AS l ON l.caller = e.phone
  GROUP BY e.id, e.name, e.phone
  ORDER BY e.name;
hints:
  - "With an index on `(caller, started)`, each phone's `MAX(started)` sits at the end of its stretch of the index."
tests:
  - name: each one's last call
    same: WITH RECURSIVE q(id) AS (SELECT id FROM employees_1998 WHERE id = 214 UNION ALL SELECT e.id FROM employees_1998 e JOIN q ON e.boss_id = q.id) SELECT e.name, e.phone, (SELECT MAX(started) FROM calls_1998 WHERE caller = e.phone) FROM q JOIN employees_1998 e ON e.id = q.id ORDER BY e.name
    ordered: true
  - name: columns name, phone and last_call
    columns: [name, phone, last_call]
  - name: searches the calls with an index on caller
    plan: 'USING (COVERING )?INDEX \w+ \(caller=\?'
```
