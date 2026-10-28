# Session 7 — Subqueries

```session
case: pagos
```

## The job

Wednesday 25 March. All the deposit money ends up on the phone of **Milagros Tello**, a cashier from Surquillo. She gave her statement this morning: she says Kevin and Brenda were **paying back money she lent them**. Chasqui doesn't believe her, but a hunch isn't proof. You need to know **what Milagros does with the money** and **how much** she got in total.

Today's questions have a question inside them: "Milagros's payments **bigger than her own average**", "what she got **from the numbers that collected deposits**". To write them as a single query, you put one query inside another: a **subquery**.

```setting
case: pagos
title: What we have so far
caption: "We already know where the money jumps to. Today we follow it one step further."
```

```dossier
title: Milagros's statement
cards:
  - name: Milagros Tello Benavides
    traits: { style: bun, shirt: "#8a5cc4", earrings: true }
    role: Cashier, lives in Surquillo
    rows: [["Received", "14 payments from the collectors"], ["Statement", "25 March"]]
    quote: "They were paying back money I lent them, that's all."
```

## The minimum

A **subquery** is a `SELECT` in brackets, inside another query. Depending on what it returns, it goes in different places:

- **A single value** (one row, one column): a **scalar subquery**. It goes wherever a number would: `WHERE amount > (SELECT avg(amount) FROM transfers)`.
- **A list** (one column, many rows): it goes after **`IN`**. `WHERE phone IN (SELECT to_phone FROM transfers WHERE note LIKE 'deposit%')`.
- **A whole table**: it goes in **`FROM`**, with an alias, and is used like any table. It's called a **derived table**.

```sql run
SELECT name, phone
FROM people
WHERE phone IN (
  SELECT to_phone
  FROM transfers
  WHERE note LIKE 'deposit%'
)
ORDER BY name;
```

Those subqueries **don't depend on the outer row**: SQLite computes them **once** and uses the result for every row. A **correlated** subquery, on the other hand, mentions a column of the outer query (`p.payer`), so its result changes with every row and the engine **runs it again for each row**. Press ▶ and count the times:

```correlated
title: Each payer's average, row by row
query: |
  SELECT id, payer, amount
  FROM payments AS p
  WHERE amount > (SELECT avg(amount) FROM payments AS q WHERE q.payer = p.payer)
  ORDER BY id;
tables:
  payments:
    cols: [id, payer, amount]
    rows: [[1, A, 20], [2, B, 300], [3, A, 50], [4, A, 80], [5, B, 100], [6, C, 40]]
outer: SELECT id, payer, amount FROM payments ORDER BY id
inner: SELECT avg(amount) FROM payments AS q WHERE q.payer = :payer
keep: ":amount > :sub"
subLabel: its payer's average
caption: "Each row compares its amount with **its own payer's** average: A averages 50, B 200 and C 40. The subquery runs six times, once per row. With six rows it doesn't matter; with six thousand, in session 14 you'll see how the planner turns it into a join."
```

**A derived table** is useful when you first want to group and then filter or join the result:

```sql run
SELECT r.to_phone, r.total
FROM (
  SELECT to_phone, SUM(amount) AS total
  FROM transfers
  GROUP BY to_phone
) AS r
WHERE r.total > 4000
ORDER BY r.total DESC;
```

**`NOT IN` and `NULL`, again.** In session 2 you saw that `3 NOT IN (1, 2, NULL)` is `NULL`. With a subquery it's worse, because you can't see the list. Some phones in `people` are `NULL`, so this returns **zero rows**, even though some numbers belong to nobody:

```sql run
SELECT DISTINCT to_phone
FROM transfers
WHERE to_phone NOT IN (SELECT phone FROM people);
```

```figure
title: Why NOT IN comes back empty
input: { label: "to_phone NOT IN (…, '969785259', NULL, …)", value: "'951207384' <> every phone … AND '951207384' <> NULL" }
arrow: "TRUE AND … AND NULL"
output: { label: "Result", value: "NULL → the row goes" }
steps:
  - "`NOT IN` is a chain of `<>` joined with `AND`. A single one of them against `NULL` gives `NULL`, and `WHERE` drops the row."
  - "`NOT EXISTS (SELECT 1 FROM people AS p WHERE p.phone = t.to_phone)` asks something else: is there any matching row? That's always true or false."
```

> **Common trap:** use `NOT EXISTS` instead of `NOT IN` when the list comes from a column that can be `NULL`. And beware of scalar subqueries: if yours returns **more than one row**, SQLite takes the first without a word (PostgreSQL raises an error: *more than one row returned by a subquery*). If you expect a single value, make sure of it with a `WHERE` on a key, an aggregate or `LIMIT 1`.

<!-- legacy: not-exists -->

<!-- mdn: not-exists -->

## Practice

```exercise
id: sql7-predice-escalar
type: predict
title: Two questions in one row
prompt: |
  There are 24 cameras; the Surquillo ones have `id`s 1 to 4. What does it return?
code: |
  SELECT (SELECT count(*) FROM cameras),
         (SELECT max(id) FROM cameras WHERE district = 'Surquillo');
options:
  - "24 | 4"
  - "24 | 24"
  - "4 | 24"
  - "24 | 1"
answer: "24 | 4"
explain: |
  Each scalar subquery returns one value and fills one column. A `SELECT` without `FROM` is also valid in SQLite: it computes a single row.
```

```exercise
id: sql7-predice-null
type: predict
title: The NULL in the subquery
prompt: |
  `SELECT 1 UNION ALL SELECT NULL` is a list with two values: 1 and `NULL`. What does it return?
code: |
  SELECT 5 NOT IN (SELECT 1 UNION ALL SELECT NULL),
         1 IN (SELECT 1 UNION ALL SELECT NULL),
         NOT EXISTS (SELECT 1 WHERE 5 = NULL);
options:
  - "NULL | 1 | 1"
  - "1 | 1 | 1"
  - "0 | 1 | 0"
  - "NULL | NULL | 1"
answer: "NULL | 1 | 1"
explain: |
  `5 NOT IN (1, NULL)` can't be decided: `NULL`. `1 IN (1, NULL)` finds the 1: true. In the `EXISTS`, `5 = NULL` isn't true, so the subquery returns no rows and `NOT EXISTS` is true: it never gives `NULL`.
```

```exercise
id: sql7-completa-in
type: complete
title: Who collected
prompt: |
  List the **name** of the people whose phone **received at least one deposit**, alphabetically. Use `IN` with a subquery. Replace the `___`.
starter: |
  SELECT name
  FROM people
  WHERE phone ___ (
    SELECT ___
    FROM transfers
    WHERE note LIKE 'deposit%'
  )
  ORDER BY name;
solution: |
  SELECT name
  FROM people
  WHERE phone IN (
    SELECT to_phone
    FROM transfers
    WHERE note LIKE 'deposit%'
  )
  ORDER BY name;
hints:
  - "The subquery returns the list of phones that **received**: the `to_phone` column."
tests:
  - name: the named collectors, in order
    same: SELECT DISTINCT p.name FROM people AS p JOIN transfers AS t ON t.to_phone = p.phone WHERE t.note LIKE 'deposit%' ORDER BY p.name
    ordered: true
  - name: uses IN with a subquery
    source: '\bIN\s*\(\s*SELECT\b'
```

```exercise
id: sql7-arregla-not-in
type: fix
title: Numbers with no owner
prompt: |
  We're looking for **every number that received money and belongs to nobody** in the register, once each and sorted. The query returns nothing, even though you already know chip 951207384 is one of them. Fix it.
starter: |
  SELECT DISTINCT to_phone
  FROM transfers
  WHERE to_phone NOT IN (SELECT phone FROM people)
  ORDER BY to_phone;
solution: |
  SELECT DISTINCT t.to_phone
  FROM transfers AS t
  WHERE NOT EXISTS (
    SELECT 1 FROM people AS p
    WHERE p.phone = t.to_phone
  )
  ORDER BY t.to_phone;
hints:
  - "Some people's phone is `NULL`, and a single `NULL` in the list turns the whole `NOT IN` into `NULL`."
  - "`NOT EXISTS (SELECT 1 FROM people AS p WHERE p.phone = t.to_phone)`. Another way out: `NOT IN (SELECT phone FROM people WHERE phone IS NOT NULL)`."
tests:
  - name: the ownerless numbers, once and in order
    same: SELECT DISTINCT t.to_phone FROM transfers AS t LEFT JOIN people AS p ON p.phone = t.to_phone WHERE p.id IS NULL ORDER BY 1
    ordered: true
```

```exercise
id: sql7-escribe-ultimo
type: write
title: Each collector's last deposit
prompt: |
  For each number that collected deposits, show its **last** deposit: `to_phone`, `amount` and `moment`, ordered by `moment`. Use a correlated subquery that looks for the latest moment **of that same number**.
visual:
  correlated:
    sketch: true
    query: |
      SELECT to_phone, amount, moment
      FROM transfers AS t
      WHERE moment = (SELECT max(moment) FROM transfers AS u
                      WHERE u.to_phone = t.to_phone AND …)
    tables:
      t:
        cols: [to_phone, amount, moment]
        rows: [["911", 300, "03-03"], ["955", 450, "03-04"], ["911", 250, "03-09"], ["955", 380, "03-05"]]
    outer: SELECT to_phone, amount, moment FROM t
    inner: SELECT max(moment) FROM t AS u WHERE u.to_phone = :to_phone
    keep: ":moment = :sub"
    subLabel: max(moment) for its number
starter: |
  SELECT to_phone, amount, moment
  FROM transfers
  WHERE note LIKE 'deposit%'
  ORDER BY to_phone, moment;
solution: |
  SELECT t.to_phone, t.amount, t.moment
  FROM transfers AS t
  WHERE t.note LIKE 'deposit%'
    AND t.moment = (
      SELECT max(u.moment)
      FROM transfers AS u
      WHERE u.to_phone = t.to_phone
        AND u.note LIKE 'deposit%'
    )
  ORDER BY t.moment;
hints:
  - "The subquery looks at the outer row: `WHERE u.to_phone = t.to_phone`. That way it computes each number's maximum, not everyone's."
  - Don't forget `LIKE 'deposit%'` inside too, or a number's last payment could be something else.
tests:
  - name: each number's last deposit, by moment
    same: SELECT t.to_phone, t.amount, t.moment FROM transfers AS t JOIN (SELECT to_phone, max(moment) AS m FROM transfers WHERE note LIKE 'deposit%' GROUP BY to_phone) AS u ON u.to_phone = t.to_phone AND u.m = t.moment ORDER BY t.moment
    ordered: true
```

```exercise
id: sql7-escribe-inquilinos
type: write
title: Teodoro's tenants
prompt: |
  Milagros pays **Teodoro Huanca Cruz** a "March rent". List the **name** of everyone who paid Teodoro with a note starting with `March rent`, alphabetically. Do it **only with subqueries**: one for Teodoro's phone and another for the list of people who paid him.
starter: |
  SELECT phone
  FROM people
  WHERE name = 'Teodoro Huanca Cruz';
solution: |
  SELECT name
  FROM people
  WHERE phone IN (
    SELECT from_phone
    FROM transfers
    WHERE note LIKE 'March rent%'
      AND to_phone = (SELECT phone FROM people WHERE name = 'Teodoro Huanca Cruz')
  )
  ORDER BY name;
hints:
  - "From the inside out: `(SELECT phone FROM people WHERE name = 'Teodoro Huanca Cruz')` is a value; use it in `to_phone = (…)`."
  - "That query returns the `from_phone`s that paid him; outside, `WHERE phone IN (…)`."
tests:
  - name: who paid Teodoro rent, in order
    same: SELECT DISTINCT p.name FROM people AS p JOIN transfers AS t ON t.from_phone = p.phone JOIN people AS q ON q.phone = t.to_phone WHERE q.name = 'Teodoro Huanca Cruz' AND t.note LIKE 'March rent%' ORDER BY p.name
    ordered: true
  - name: no JOIN, with subqueries
    sourceNot: '\bJOIN\b'
```

## The case

```exercise
id: sql7-caso-grandes
type: case
title: Milagros's big payments
prompt: |
  **Who received the most payments from Milagros above the average of her own payments?** Type their full name.

  Milagros makes small payments (lunch, bus fares) and a few big ones. Compare each of her payments with **her** average, computed in a subquery, and join the result with `people` to see who receives. Read the notes too.
visual:
  - setting:
      case: pagos
  - figure:
      title: A yardstick
      input: { label: "Milagros's payments", value: "15 · 3.5 · 900 · 1800 · …" }
      arrow: "amount > (SELECT avg(amount) …)"
      output: { label: "the ones above the yardstick", value: "?" }
starter: |
  -- The payments Milagros made in March
  SELECT moment, to_phone, amount, note
  FROM transfers
  WHERE from_phone = (SELECT phone FROM people WHERE name = 'Milagros Tello Benavides')
  ORDER BY moment;
solution: |
  SELECT t.moment, r.name, t.amount, t.note
  FROM transfers AS t
  JOIN people AS r ON r.phone = t.to_phone
  WHERE t.from_phone = (SELECT phone FROM people WHERE name = 'Milagros Tello Benavides')
    AND t.amount > (
      SELECT avg(amount) FROM transfers
      WHERE from_phone = (SELECT phone FROM people WHERE name = 'Milagros Tello Benavides')
    )
  ORDER BY t.moment;
answer: Gustavo Alvarado Zevallos
answerLabel: Who got the most big payments? (full name)
reveal: |
  **Gustavo Alvarado Zevallos**, a merchant from San Borja: S/ 1800 on 9 March ("stock"), S/ 1900 on the 16th (no note) and S/ 600 on the 19th ("this week's"). Her average is S/ 471.79, so **Teodoro Huanca** (S/ 900, "March rent") and **Percy Tello**, her brother (S/ 1200, "motorcycle-taxi loan"), clear the bar too. Three new names on the board.
hints:
  - "Her average: `(SELECT avg(amount) FROM transfers WHERE from_phone = …)`, with Milagros's phone inside."
  - "To see the receiver's name: `JOIN people AS r ON r.phone = t.to_phone`."
```

## The judge

As before: the example and the hidden databases. Today each payment is compared with something that depends on its own row.

```exercise
id: sql7-juez-sobre-promedio
type: judge
title: More than usual
prompt: |
  **Return the `id`, the payer and the `amount` of the payments above the average of that same payer's payments, ordered by `id`.**

  A bank wants to flag odd payments: not the big ones in general, but the big ones **for whoever makes them**. S/ 300 is little for a company and a lot for a student. Some payments have an empty amount (`NULL`): they don't count towards the average and aren't flagged.

  **Table:** `payments(id, payer, amount)`.

  **Result:** `id`, `payer` and `amount`, ordered by `id`.
schema: |
  CREATE TABLE payments (id INTEGER, payer TEXT, amount REAL);
ordered: true
starter: |
  SELECT id, payer, amount
  FROM payments
  WHERE amount > (SELECT avg(amount) FROM payments)
  ORDER BY id;
solution: |
  SELECT p.id, p.payer, p.amount
  FROM payments AS p
  WHERE p.amount > (
    SELECT avg(q.amount) FROM payments AS q
    WHERE q.payer = p.payer
  )
  ORDER BY p.id;
hints:
  - "The average has to be **the same payer's**: the subquery needs `WHERE q.payer = p.payer`, with a different alias for the inner table."
  - "`avg` already ignores `NULL`s, and `NULL > anything` is never true: nothing else is needed for empty amounts."
samples:
  - rows:
      payments: [[1, "A", 20], [2, "B", 300], [3, "A", 50], [4, "A", 80], [5, "B", 100], [6, "C", 40]]
    note: "A averages 50, B 200 and C 40. Payment 4 (80 > 50) and payment 2 (300 > 200) pass. C has a single payment, equal to its average: it doesn't pass."
  - rows:
      payments: [[1, "A", 10], [2, "A", null], [3, "A", 30]]
    note: "A's average is 20 (the NULL doesn't count). Only 3 passes."
edge:
  - rows: { payments: [] }
    tag: with no payments
  - rows: { payments: [[1, "A", 5], [2, "A", 5], [3, "B", 7]] }
    tag: with every payment equal to its average
  - rows: { payments: [[1, "A", null], [2, "B", 10], [3, "B", 30], [4, "A", null]] }
    tag: with a payer that only has empty amounts
random:
  count: 40
  seed: 707
  generate: |
    const n = rng.int(0, 16);
    return { payments: Array.from({ length: n }, (_, i) => [i + 1, rng.pick(["A", "B", "C", "D"]), rng.chance(0.12) ? null : rng.int(1, 60) * 5]) };
wrong:
  - |
    SELECT id, payer, amount FROM payments WHERE amount > (SELECT avg(amount) FROM payments) ORDER BY id;
  - |
    SELECT p.id, p.payer, p.amount FROM payments AS p WHERE p.amount >= (SELECT avg(q.amount) FROM payments AS q WHERE q.payer = p.payer) ORDER BY p.id;
  - |
    SELECT p.id, p.payer, p.amount FROM payments AS p WHERE p.amount > (SELECT sum(q.amount) / count(*) FROM payments AS q WHERE q.payer = p.payer) ORDER BY p.id;
```

## Final mission

```exercise
id: sql7-mision-dinero
type: mission
title: How much reached the till
prompt: |
  **In a single row, show how much Milagros received from the numbers that collected deposits as `received`, the total of all deposits as `deposits` and what percentage the first is of the second, rounded to one decimal, as `percentage`.** Then say how much she received.

  The numbers that collected deposits come from a subquery with `IN`; the deposit total, from a scalar subquery. That way the proof doesn't depend on numbers copied by hand.

  When the query proves it and you answer, together with the judge, session 8 opens.
visual:
  - setting:
      case: pagos
  - figure:
      title: Where each number comes from
      panes:
        - label: "received"
          value: "SUM of what reached Milagros from (SELECT to_phone … 'deposit%')"
        - label: "deposits"
          value: "(SELECT SUM(amount) … 'deposit%')"
        - label: "percentage"
          value: "100.0 × received / deposits"
starter: |
  SELECT SUM(amount) AS received
  FROM transfers
  WHERE to_phone = (SELECT phone FROM people WHERE name = 'Milagros Tello Benavides');
solution: |
  SELECT SUM(amount) AS received,
         (SELECT SUM(amount) FROM transfers WHERE note LIKE 'deposit%') AS deposits,
         round(100.0 * SUM(amount) / (SELECT SUM(amount) FROM transfers WHERE note LIKE 'deposit%'), 1) AS percentage
  FROM transfers
  WHERE to_phone = (SELECT phone FROM people WHERE name = 'Milagros Tello Benavides')
    AND from_phone IN (SELECT to_phone FROM transfers WHERE note LIKE 'deposit%');
answer: "4806"
answerLabel: How much did Milagros get from the collectors? (in soles)
reveal: |
  **S/ 4806**, **90%** of the S/ 5340 the 14 victims paid. What they were "paying back" can't be loans: it's exactly the share of the deposits the collectors didn't keep. And almost all of it goes out again. **Milagros is the till.** We still need to know who she works for.
hints:
  - "The query above adds up **everything** Milagros received. Add `AND from_phone IN (SELECT to_phone FROM transfers WHERE note LIKE 'deposit%')`."
  - "The deposit total goes as a column: `(SELECT SUM(amount) FROM transfers WHERE note LIKE 'deposit%') AS deposits`. Multiply by `100.0`, not `100`, to avoid integer division."
tests:
  - name: received, deposits and percentage in one row
    same: SELECT SUM(amount), (SELECT SUM(amount) FROM transfers WHERE note LIKE 'deposit%'), round(100.0 * SUM(amount) / (SELECT SUM(amount) FROM transfers WHERE note LIKE 'deposit%'), 1) FROM transfers WHERE to_phone = (SELECT phone FROM people WHERE name = 'Milagros Tello Benavides') AND from_phone IN (SELECT to_phone FROM transfers WHERE note LIKE 'deposit%')
  - name: the columns are received, deposits and percentage
    columns: [received, deposits, percentage]
  - name: uses IN with a subquery
    source: '\bIN\s*\(\s*SELECT\b'
```

## Expert challenge

```exercise
id: sql7-reto-dependencia
type: challenge
title: How much each one depends on Milagros
prompt: |
  **For each person who got money from Milagros in March, show their name as `name`, how much they got from her as `from_milagros`, how much they got from everyone in March as `march_total` and what percentage of the second the first is, rounded to a whole number, as `percentage`.** Order by `from_milagros`, highest first.

  For people who already code: a derived table with what Milagros paid, grouped by receiver, joined to `people`, and a correlated subquery for each one's total. See who lives almost entirely on Milagros's money.
starter: |
  SELECT to_phone, amount
  FROM transfers
  WHERE from_phone = (SELECT phone FROM people WHERE name = 'Milagros Tello Benavides');
solution: |
  SELECT p.name,
         m.from_milagros,
         (SELECT SUM(x.amount) FROM transfers AS x WHERE x.to_phone = p.phone) AS march_total,
         CAST(round(100.0 * m.from_milagros / (SELECT SUM(x.amount) FROM transfers AS x WHERE x.to_phone = p.phone)) AS INTEGER) AS percentage
  FROM (
    SELECT to_phone, SUM(amount) AS from_milagros
    FROM transfers
    WHERE from_phone = (SELECT phone FROM people WHERE name = 'Milagros Tello Benavides')
    GROUP BY to_phone
  ) AS m
  JOIN people AS p ON p.phone = m.to_phone
  ORDER BY m.from_milagros DESC;
hints:
  - "The derived table: `(SELECT to_phone, SUM(amount) AS from_milagros FROM transfers WHERE from_phone = … GROUP BY to_phone) AS m`."
  - "Each one's total depends on its row: `(SELECT SUM(x.amount) FROM transfers AS x WHERE x.to_phone = p.phone)`."
tests:
  - name: what each one got from Milagros and from everyone
    same: SELECT p.name, m.d, t.s, CAST(round(100.0 * m.d / t.s) AS INTEGER) FROM (SELECT to_phone, SUM(amount) AS d FROM transfers WHERE from_phone = (SELECT phone FROM people WHERE name = 'Milagros Tello Benavides') GROUP BY to_phone) AS m JOIN people AS p ON p.phone = m.to_phone JOIN (SELECT to_phone, SUM(amount) AS s FROM transfers GROUP BY to_phone) AS t ON t.to_phone = m.to_phone ORDER BY m.d DESC
    ordered: true
  - name: columns name, from_milagros, march_total and percentage
    columns: [name, from_milagros, march_total, percentage]
```
