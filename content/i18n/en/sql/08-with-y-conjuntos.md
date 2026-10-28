# Session 8 — WITH and set operations

```session
case: pagos
```

## The job

Thursday 26 March. The money of the 14 victims goes through four collectors, reaches **Milagros Tello**'s till and almost all of it goes out again. Three names on the board got big payments from her: her landlord (already cleared), her brother **Percy** and a merchant from San Borja, **Gustavo Alvarado**, who said today: "Milagros buys stock from me." Two victims said the seller mentioned **a phone shop in Gamarra**.

Today you cross everything you know in a single query that can be read: each step with its name (**`WITH`**) and lists that are combined, crossed or subtracted (**`UNION`**, **`INTERSECT`**, **`EXCEPT`**). If today's query proves it, the police know who to go after.

```setting
case: pagos
title: What we have so far
caption: "The last stretch is missing: from Milagros's till upwards."
```

```dossier
title: The two who are left
cards:
  - name: Gustavo Alvarado Zevallos
    traits: { style: short, hair: "#3b2a1e", shirt: "#2f3a4a", glasses: true }
    role: Merchant, San Borja
    rows: [["Got from Milagros", "S/ 4300 in three payments"]]
    quote: "Milagros buys stock from me. That is all I have with her."
  - name: Percy Tello Benavides
    traits: { style: cap, capColor: "#4f9a6a", shirt: "#4f9a6a" }
    role: Motorcycle-taxi driver, Milagros's brother
    rows: [["Got from Milagros", "S/ 1200, “motorcycle-taxi loan”"]]
    quote: "I don't know anything about phones."
```

## The minimum

Session 7's subqueries work, but when they nest they read **from the inside out**. **`WITH`** names them and lays them out **top to bottom**, like the steps of a recipe. Each step is a **CTE** (*common table expression*): a named query that, inside this query, is used like a table. A step can read the earlier ones, and the final query can read any of them.

```sql
WITH step_one AS (
  SELECT …
),
step_two AS (
  SELECT … FROM step_one …
)
SELECT … FROM step_two …;
```

```cte
title: Three named steps
steps:
  - name: deposits
    sql: |
      SELECT to_phone, amount
      FROM transfers
      WHERE note LIKE 'deposit%'
  - name: by_number
    sql: |
      SELECT to_phone, COUNT(*) AS how_many, SUM(amount) AS total
      FROM deposits
      GROUP BY to_phone
final: |
  SELECT COALESCE(p.name, n.to_phone) AS collector, n.how_many, n.total
  FROM by_number AS n
  LEFT JOIN people AS p ON p.phone = n.to_phone
  ORDER BY n.total DESC;
caption: "Each box is a table that exists only while the query runs. The chip has no name: `COALESCE` shows its number."
```

A CTE stores nothing: it's a way of **writing** the query. SQLite decides whether to compute it once or fold it into the rest, as it would with a subquery. Its advantage is that you can **read it, test each step on its own** (`SELECT * FROM deposits`) and **use the same step twice** without copying it.

### Combining, crossing and subtracting lists

Two queries that return **the same columns** (same number, in the same order) can be combined as sets:

- **`UNION`**: what is in one **or** the other, without duplicates.
- **`UNION ALL`**: one under the other, **with** duplicates. Faster, since it doesn't have to look for duplicates.
- **`INTERSECT`**: what is in **both**.
- **`EXCEPT`**: what is in the first **and not** in the second.

```sets
title: Who paid and who reported
a:
  label: paid a deposit
  query: |
    SELECT v.name FROM transfers AS t
    JOIN people AS v ON v.phone = t.from_phone
    WHERE t.note LIKE 'deposit%'
b:
  label: reported the fraud
  query: |
    SELECT p.name FROM reports AS r
    JOIN people AS p ON p.id = r.reporter_id
    WHERE r.kind = 'fraud' AND r.description LIKE '%deposit%'
caption: "The 9 who reported also paid. `EXCEPT` gives the 5 who paid and kept quiet: the same result as session 6's anti-join, written as a subtraction."
```

The rules: column names come from the **first** query; an `ORDER BY` goes **once, at the end**, and sorts the combined result; and for these operations two `NULL`s **are** equal (unlike `=`), so `NULL INTERSECT NULL` gives one row.

**Views.** If a step is useful in many queries, you can save it in the database with `CREATE VIEW`. A view is a named query that lives in the database (it stores no rows: it's recomputed every time). In session 17 you'll design your own.

```sql run
CREATE VIEW deposits AS
SELECT from_phone, to_phone, amount, moment
FROM transfers
WHERE note LIKE 'deposit%';

SELECT to_phone, COUNT(*) AS how_many
FROM deposits
GROUP BY to_phone
ORDER BY how_many DESC;
```

> **Common trap:** `UNION` deletes duplicates, and sometimes the duplicates are data. If you put together the amounts that came into and went out of an account to add them up, two S/ 20 payments become one with `UNION`. Use **`UNION ALL`** whenever you want to count or add, and `UNION` only when you really want a list without duplicates.

<!-- legacy: with-cte -->

<!-- mdn: with-cte -->

## Practice

```exercise
id: sql8-predice-union
type: predict
title: With or without duplicates
prompt: |
  What do the two queries return?
code: |
  SELECT 1 UNION SELECT 1 UNION SELECT 2;

  SELECT count(*) FROM (SELECT 1 UNION ALL SELECT 1 UNION ALL SELECT 2);
options:
  - |-
    1
    2
    3
  - |-
    1
    1
    2
    3
  - |-
    1
    2
    2
  - |-
    1
    2
    1
answer: |-
  1
  2
  3
explain: |
  `UNION` keeps the 1 only once: two rows, 1 and 2. `UNION ALL` removes nothing: three rows, and `count(*)` gives 3.
```

```exercise
id: sql8-predice-null
type: predict
title: Two equal unknowns
prompt: |
  In session 2 you saw that `NULL = NULL` is `NULL`. What does it return?
code: |
  SELECT count(*) FROM (SELECT NULL INTERSECT SELECT NULL);
options:
  - "1"
  - "0"
  - "NULL"
  - "2"
answer: "1"
explain: |
  For set operations (and for `DISTINCT` and `GROUP BY`), two `NULL`s count as the same row. So the intersection has one row: `NULL`. A `JOIN … ON a = b`, on the other hand, never pairs two `NULL`s.
```

```exercise
id: sql8-completa-with
type: complete
title: How many numbers collect
prompt: |
  With a CTE called `collectors` holding **each number that received a deposit, once**, count how many there are. Replace the `___`.
starter: |
  ___ collectors ___ (
    SELECT DISTINCT to_phone
    FROM transfers
    WHERE note LIKE 'deposit%'
  )
  SELECT count(*) FROM ___;
solution: |
  WITH collectors AS (
    SELECT DISTINCT to_phone
    FROM transfers
    WHERE note LIKE 'deposit%'
  )
  SELECT count(*) FROM collectors;
hints:
  - "`WITH name AS ( query )` and then the final query, which uses `name` like a table."
tests:
  - name: counts the numbers that collected
    value: 4
  - name: uses WITH
    source: '\bWITH\s+collectors\s+AS\b'
```

```exercise
id: sql8-arregla-union
type: fix
title: The money that moved
prompt: |
  We want **the sum of all the amounts that came into or went out of the three named collectors** (Kevin, Brenda and Jhonatan) in March: each payment counts once for each side it appears on. The query puts the two lists together with `UNION` and the sum comes out lower than it is. Fix it.
starter: |
  WITH ring AS (
    SELECT phone FROM people
    WHERE name IN ('Kevin Rojas Palomino', 'Brenda Salazar Cusi', 'Jhonatan Ugarte Llanos')
  ),
  movements AS (
    SELECT amount FROM transfers WHERE to_phone IN (SELECT phone FROM ring)
    UNION
    SELECT amount FROM transfers WHERE from_phone IN (SELECT phone FROM ring)
  )
  SELECT SUM(amount) AS moved FROM movements;
solution: |
  WITH ring AS (
    SELECT phone FROM people
    WHERE name IN ('Kevin Rojas Palomino', 'Brenda Salazar Cusi', 'Jhonatan Ugarte Llanos')
  ),
  movements AS (
    SELECT amount FROM transfers WHERE to_phone IN (SELECT phone FROM ring)
    UNION ALL
    SELECT amount FROM transfers WHERE from_phone IN (SELECT phone FROM ring)
  )
  SELECT SUM(amount) AS moved FROM movements;
hints:
  - "All three pay for lunches and bus fares of the same amounts (S/ 20, S/ 12…). With `UNION`, two equal amounts become one."
tests:
  - name: adds up every movement
    same: SELECT SUM(amount) FROM transfers AS t JOIN people AS p ON p.phone = t.to_phone OR p.phone = t.from_phone WHERE p.name IN ('Kevin Rojas Palomino', 'Brenda Salazar Cusi', 'Jhonatan Ugarte Llanos')
  - name: uses UNION ALL
    source: '\bUNION\s+ALL\b'
```

```exercise
id: sql8-escribe-intersect
type: write
title: Collected and paid the till
prompt: |
  List **the numbers that received some deposit and also paid something to Milagros Tello Benavides**, in order. Use `INTERSECT` between two one-column queries.
visual:
  figure:
    title: Two lists of numbers
    panes:
      - label: "A: received a deposit"
        value: "SELECT to_phone … 'deposit%'"
      - label: "B: paid Milagros"
        value: "SELECT from_phone … to_phone = (Milagros)"
      - label: "A INTERSECT B"
        value: "?"
starter: |
  SELECT to_phone
  FROM transfers
  WHERE note LIKE 'deposit%';
solution: |
  SELECT to_phone
  FROM transfers
  WHERE note LIKE 'deposit%'
  INTERSECT
  SELECT from_phone
  FROM transfers
  WHERE to_phone = (SELECT phone FROM people WHERE name = 'Milagros Tello Benavides')
  ORDER BY 1;
hints:
  - "The second list: `SELECT from_phone FROM transfers WHERE to_phone = (SELECT phone FROM people WHERE name = 'Milagros Tello Benavides')`."
  - "The `ORDER BY` goes once, at the very end."
tests:
  - name: the numbers in both lists, in order
    same: SELECT DISTINCT t.to_phone FROM transfers AS t WHERE t.note LIKE 'deposit%' AND EXISTS (SELECT 1 FROM transfers AS u JOIN people AS m ON m.phone = u.to_phone WHERE m.name = 'Milagros Tello Benavides' AND u.from_phone = t.to_phone) ORDER BY 1
    ordered: true
  - name: uses INTERSECT
    source: '\bINTERSECT\b'
```

```exercise
id: sql8-escribe-except
type: write
title: The anti-join as a subtraction
prompt: |
  List the **name** of the people who **paid a deposit** but **never filed a fraud report**, alphabetically. This time use `EXCEPT`.
starter: |
  SELECT v.name
  FROM transfers AS t
  JOIN people AS v ON v.phone = t.from_phone
  WHERE t.note LIKE 'deposit%';
solution: |
  SELECT v.name
  FROM transfers AS t
  JOIN people AS v ON v.phone = t.from_phone
  WHERE t.note LIKE 'deposit%'
  EXCEPT
  SELECT p.name
  FROM reports AS r
  JOIN people AS p ON p.id = r.reporter_id
  WHERE r.kind = 'fraud'
  ORDER BY 1;
hints:
  - "The second list is the names of whoever reported a fraud: `reports` joined to `people`."
tests:
  - name: those who paid and didn't report, in order
    same: SELECT v.name FROM transfers AS t JOIN people AS v ON v.phone = t.from_phone WHERE t.note LIKE 'deposit%' AND NOT EXISTS (SELECT 1 FROM reports AS r WHERE r.reporter_id = v.id AND r.kind = 'fraud') ORDER BY 1
    ordered: true
  - name: uses EXCEPT
    source: '\bEXCEPT\b'
```

## The case

```exercise
id: sql8-caso-empresa
type: case
title: Where the ring works
prompt: |
  **Which company do most members of the ring work at today?** Type its registered name exactly as it appears in `companies`.

  Build the ring with `WITH`: a step with the collectors' phones (already below), another that adds Milagros's with `UNION`, and the final query that joins those phones with `people`, their **current** jobs (`until IS NULL`) and `companies`, and counts how many members each one has.
visual:
  - setting:
      case: pagos
  - schema:
      tables: [transfers, people, jobs, companies]
starter: |
  WITH collectors AS (
    SELECT DISTINCT to_phone AS phone
    FROM transfers
    WHERE note LIKE 'deposit%'
  )
  SELECT * FROM collectors;
solution: |
  WITH collectors AS (
    SELECT DISTINCT to_phone AS phone
    FROM transfers
    WHERE note LIKE 'deposit%'
  ),
  ring AS (
    SELECT phone FROM collectors
    UNION
    SELECT phone FROM people WHERE name = 'Milagros Tello Benavides'
  )
  SELECT c.name, c.district, COUNT(*) AS members, group_concat(p.name, ', ') AS who
  FROM ring
  JOIN people AS p ON p.phone = ring.phone
  JOIN jobs AS j ON j.person_id = p.id AND j.until IS NULL
  JOIN companies AS c ON c.id = j.company_id
  GROUP BY c.id
  ORDER BY members DESC;
answer: Importaciones Ccori S.A.C.
answerLabel: Which company? (full registered name)
reveal: |
  **Importaciones Ccori S.A.C.**, a phone seller in **La Victoria**, a few steps from Gamarra: **Kevin and Brenda** work there today as couriers and **Milagros** as cashier. Jhonatan works at another company and the chip has no owner. The "phone shop in Gamarra" the victims mentioned exists. Who runs it?
hints:
  - "The second step: `ring AS (SELECT phone FROM collectors UNION SELECT phone FROM people WHERE name = 'Milagros Tello Benavides')`."
  - "The final one: `FROM ring JOIN people AS p … JOIN jobs AS j ON j.person_id = p.id AND j.until IS NULL JOIN companies AS c …`, grouped by company."
```

## The judge

As before: the example and the hidden databases. Here both lists have duplicates and blanks.

```exercise
id: sql8-juez-ambas-listas
type: judge
title: In both lists
prompt: |
  **Return, once each and sorted, the phones that appear in both lists.**

  Two police stations sent each other their lists of suspicious numbers. They're dirty: there are repeated numbers and rows with an empty phone (`NULL`), which isn't a number and must not come out.

  **Tables:** `list_a(phone)` and `list_b(phone)`.

  **Result:** one column with each phone that is in both lists, without duplicates, sorted.
schema: |
  CREATE TABLE list_a (phone TEXT);
  CREATE TABLE list_b (phone TEXT);
ordered: true
starter: |
  SELECT phone FROM list_a
  UNION
  SELECT phone FROM list_b
  ORDER BY phone;
solution: |
  SELECT phone FROM list_a WHERE phone IS NOT NULL
  INTERSECT
  SELECT phone FROM list_b
  ORDER BY phone;
hints:
  - "`INTERSECT` already removes duplicates."
  - "But for `INTERSECT` two `NULL`s are equal: if both lists have a blank, a `NULL` row would come out. Remove them with `WHERE phone IS NOT NULL`."
samples:
  - rows:
      list_a: [["951207384"], ["913488521"], ["951207384"], [null]]
      list_b: [["951207384"], ["946280187"], [null]]
    note: "951207384 is in both (twice in A): it comes out once. NULL is in both, but it isn't a number."
  - rows:
      list_a: [["900000003"], ["900000001"]]
      list_b: [["900000001"], ["900000003"], ["900000002"]]
    note: "Sorted: 900000001 and 900000003."
edge:
  - rows: { list_a: [], list_b: [["911111111"]] }
    tag: with the first list empty
  - rows: { list_a: [[null], [null]], list_b: [[null]] }
    tag: with lists that only have blanks
  - rows: { list_a: [["922222222"], ["922222222"]], list_b: [["922222222"], ["922222222"]] }
    tag: with the same number repeated in both
random:
  count: 40
  seed: 808
  generate: |
    const nums = ["951207384", "913488521", "946280187", "928298796", "969785259", "981764539", "938684587", "900000001"];
    const one = () => (rng.chance(0.18) ? null : rng.pick(nums));
    return { list_a: Array.from({ length: rng.int(0, 9) }, () => [one()]), list_b: Array.from({ length: rng.int(0, 9) }, () => [one()]) };
wrong:
  - |
    SELECT phone FROM list_a INTERSECT SELECT phone FROM list_b ORDER BY phone;
  - |
    SELECT a.phone FROM list_a AS a JOIN list_b AS b ON b.phone = a.phone ORDER BY a.phone;
  - |
    SELECT phone FROM list_a WHERE phone IS NOT NULL UNION SELECT phone FROM list_b WHERE phone IS NOT NULL ORDER BY phone;
```

## Final mission

```exercise
id: sql8-mision-lider
type: mission
title: Who is at the top
prompt: |
  **With `WITH`, build two lists of phones: those who got payments from Milagros above her own average, and those who work today at Importaciones Ccori S.A.C. Return the `name` of the people whose phone is in both (with `INTERSECT`).** Then say who it is.

  The first list is session 7's case; the second, today's. Whoever is in both **gets the money** and **works with the ring**.

  When the query proves it and you answer, together with the judge, the case file closes and session 9 opens.
visual:
  - setting:
      case: pagos
  - figure:
      title: Two lists and where they cross
      panes:
        - label: "A: Milagros's big payments"
          value: "Teodoro · Percy · ?"
        - label: "B: work at Importaciones Ccori today"
          value: "Kevin · Brenda · Milagros · ?"
        - label: "A INTERSECT B"
          value: "?"
  - network:
      title: "The money trail, from the victims up"
      nodes:
        - {"id": "v", "icon": "person", "label": "14 victims", "sub": "S/ 5340 in deposits"}
        - {"id": "c", "icon": "box", "label": "4 collectors", "sub": "Kevin, Brenda, Jhonatan and a chip"}
        - {"id": "m", "icon": "person", "label": "Milagros Tello", "sub": "the cashier"}
        - {"id": "g", "icon": "person", "label": "Gustavo Alvarado", "sub": "merchant from San Borja"}
      links:
        - {"id": "l1", "label": "deposits"}
        - {"id": "l2", "label": "within 3 hours"}
        - {"id": "l3", "label": "large payments"}
      steps:
        - at: "v"
          note: "Fourteen victims pay a deposit for a phone or a scooter that never arrives. They add up to S/ 5340."
        - move: ["v", "c"]
          packet: {"kind": "up", "label": "S/ 5340"}
          note: "Every deposit lands with one of four collectors: three with a name and a chip nobody owns."
        - at: "c"
          tags: {"c": "keep 10%"}
          note: "Each collector keeps 10% and forwards the rest, always to the same number."
        - move: ["c", "m"]
          packet: {"kind": "up", "label": "S/ 4806"}
          tags: {"c": "keep 10%"}
          note: "The other 90% reaches Milagros's account: S/ 4806."
        - move: ["m", "g"]
          packet: {"kind": "up", "label": "S/ 4300"}
          tags: {"g": "what is his part in the ring?"}
          note: "Almost all of it goes out again: three large payments to Gustavo, S/ 4300. Today you find out whether he works with the ring."
starter: |
  WITH milagros AS (
    SELECT phone FROM people WHERE name = 'Milagros Tello Benavides'
  )
  SELECT to_phone, amount
  FROM transfers
  WHERE from_phone = (SELECT phone FROM milagros);
solution: |
  WITH milagros AS (
    SELECT phone FROM people WHERE name = 'Milagros Tello Benavides'
  ),
  big_payments AS (
    SELECT to_phone AS phone
    FROM transfers
    WHERE from_phone = (SELECT phone FROM milagros)
      AND amount > (SELECT avg(amount) FROM transfers WHERE from_phone = (SELECT phone FROM milagros))
  ),
  ccori AS (
    SELECT p.phone
    FROM jobs AS j
    JOIN companies AS c ON c.id = j.company_id
    JOIN people AS p ON p.id = j.person_id
    WHERE c.name = 'Importaciones Ccori S.A.C.'
      AND j.until IS NULL
  )
  SELECT name
  FROM people
  WHERE phone IN (
    SELECT phone FROM big_payments
    INTERSECT
    SELECT phone FROM ccori
  );
answer: Gustavo Alvarado Zevallos
answerLabel: Who runs the ring? (full name)
reveal: |
  **Gustavo Alvarado Zevallos, manager of Importaciones Ccori S.A.C.** He is the only person in both lists: he got S/ 4300 from the till (S/ 1800, S/ 1900 and S/ 600, always after a batch of deposits and followed by a call with Milagros) and he runs the shop where the cashier and two of the collectors work. Percy doesn't work there and Rocío Medina, the assistant, received nothing.

  The ring: **14 victims** paid **S/ 5340**; four numbers collected and kept 10%; Milagros gathered **S/ 4806** and passed **S/ 4300** to her boss. **Case file EST-0323 closed.** The police now have the query that proves it.
hints:
  - "`big_payments` is session 7's case query, returning only `to_phone AS phone`."
  - "`ccori`: `jobs` joined to `companies` and `people`, with `c.name = 'Importaciones Ccori S.A.C.' AND j.until IS NULL`. The final query: `WHERE phone IN (SELECT phone FROM big_payments INTERSECT SELECT phone FROM ccori)`."
tests:
  - name: the name of whoever is in both lists
    same: SELECT p.name FROM people AS p JOIN jobs AS j ON j.person_id = p.id AND j.until IS NULL JOIN companies AS c ON c.id = j.company_id WHERE c.name = 'Importaciones Ccori S.A.C.' AND p.phone IN (SELECT to_phone FROM transfers WHERE from_phone = (SELECT phone FROM people WHERE name = 'Milagros Tello Benavides') AND amount > (SELECT avg(amount) FROM transfers WHERE from_phone = (SELECT phone FROM people WHERE name = 'Milagros Tello Benavides')))
  - name: uses WITH
    source: '\bWITH\b'
  - name: crosses the lists with INTERSECT
    source: '\bINTERSECT\b'
```

## Expert challenge

```exercise
id: sql8-reto-embudo
type: challenge
title: The money funnel
prompt: |
  **Build the ring's funnel in three rows: step 1, the victims who paid deposits; step 2, the numbers that passed money to Milagros; step 3, the Importaciones Ccori employees who got money from Milagros. For each step, show its number as `step`, how many distinct people or numbers pay or receive in it as `how_many` and the amount that moved as `amount`.** Order by step.

  For people who already code: one CTE per step and three one-row `SELECT`s, stacked with `UNION ALL`. Step 1 counts who pays (`from_phone`), step 2 who pays Milagros and step 3 who receives from her.
starter: |
  WITH deposits AS (
    SELECT from_phone, to_phone, amount
    FROM transfers
    WHERE note LIKE 'deposit%'
  )
  SELECT 1 AS step, COUNT(DISTINCT from_phone) AS how_many, SUM(amount) AS amount
  FROM deposits;
solution: |
  WITH deposits AS (
    SELECT from_phone, to_phone, amount
    FROM transfers
    WHERE note LIKE 'deposit%'
  ),
  milagros AS (
    SELECT phone FROM people WHERE name = 'Milagros Tello Benavides'
  ),
  to_till AS (
    SELECT from_phone, amount
    FROM transfers
    WHERE to_phone = (SELECT phone FROM milagros)
      AND from_phone IN (SELECT to_phone FROM deposits)
  ),
  to_boss AS (
    SELECT t.to_phone, t.amount
    FROM transfers AS t
    JOIN people AS p ON p.phone = t.to_phone
    JOIN jobs AS j ON j.person_id = p.id AND j.until IS NULL
    JOIN companies AS c ON c.id = j.company_id
    WHERE t.from_phone = (SELECT phone FROM milagros)
      AND c.name = 'Importaciones Ccori S.A.C.'
  )
  SELECT 1 AS step, COUNT(DISTINCT from_phone) AS how_many, SUM(amount) AS amount FROM deposits
  UNION ALL
  SELECT 2, COUNT(DISTINCT from_phone), SUM(amount) FROM to_till
  UNION ALL
  SELECT 3, COUNT(DISTINCT to_phone), SUM(amount) FROM to_boss
  ORDER BY step;
hints:
  - "Each step is a one-row `SELECT` with `COUNT(DISTINCT …)` and `SUM(amount)`; `UNION ALL` stacks them."
  - "The first `SELECT` sets the column names; the others only need the same three columns in the same order."
tests:
  - name: the funnel's three steps
    output: |-
      1 | 14 | 5340.0
      2 | 4 | 4806.0
      3 | 1 | 4300.0
  - name: columns step, how_many and amount
    columns: [step, how_many, amount]
  - name: stacks the steps with UNION ALL
    source: '\bUNION\s+ALL\b'
```
