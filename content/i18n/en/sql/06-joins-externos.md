# Session 6 — LEFT JOIN, self-joins and anti-joins

```session
case: pagos
```

## The job

Tuesday 24 March. Yesterday left you three named collectors, and also a count that doesn't add up: **nine fraud reports** mention a deposit and your query returned **seven rows**. The reports by **Edwin Condori** and **Iván Choque** got lost along the way. And there's more: Chasqui thinks some victims paid and **never reported it**, out of embarrassment or because it was only 300 soles.

To see what's missing you need joins that don't throw rows away: **LEFT JOIN**. To follow the money from one phone to the next, a table joined **with itself**. And to find whoever never did something, an **anti-join**.

```setting
case: pagos
title: What we have so far
caption: "Session 5's clues are already pinned. Today the lost payments show up."
```

```dossier
title: The two reports that got lost
cards:
  - name: Edwin Condori Pumacayo
    traits: { style: cap, capColor: "#c49a3f", shirt: "#c49a3f" }
    role: Electrician, Comas
    rows: [["Paid", "S/ 500 for a scooter"], ["Reported", "9 March"]]
    quote: "The number had no photo or name on Yape."
  - name: Iván Choque Medina
    traits: { style: short, shirt: "#3f7cc4" }
    role: Student, San Juan de Lurigancho
    rows: [["Paid", "S/ 320 for an iPhone 13"], ["Reported", "16 March"]]
    quote: "They told me to pick it up in Gamarra."
```

## The minimum

`JOIN` (whose full name is **INNER JOIN**) only keeps rows that find a partner. **`LEFT JOIN`** keeps **every row on the left**: those that find a partner come out with it, and those that don't come out anyway, with **`NULL`** in every column on the right. That's how you see what's missing.

```join
title: LEFT JOIN throws no one on the left away
query: |
  SELECT t.to_phone, t.amount, c.name
  FROM transfers AS t
  LEFT JOIN people AS c ON c.phone = t.to_phone;
left:
  name: t
  cols: [to_phone, amount]
  rows: [["911000001", 300], ["955000002", 450], ["911000001", 250], ["977000003", 500]]
right:
  name: c
  cols: [phone, name]
  rows: [["911000001", "Rosa Quispe"], ["955000002", "Beto Ramos"], ["933000004", "Kike Soto"]]
on: [to_phone, phone]
type: left
caption: "977000003 isn't in `people`: with `JOIN` it would vanish; with `LEFT JOIN` it comes out with `NULL` in `name`. Kike received nothing and doesn't come out: only the **left** rows are kept."
```

**`RIGHT JOIN`** is the same seen from the other table (it keeps the whole right side) and **`FULL JOIN`** keeps both. SQLite has had them since version 3.39 (2022); in older code you'll see the tables swapped round to write a `LEFT JOIN` instead.

**The filter in `ON` or in `WHERE`.** With `JOIN` it makes no difference. With `LEFT JOIN` it does: a condition in `ON` decides **who each row pairs with** (and if it finds nobody, it comes out with `NULL`); a condition in `WHERE` applies **afterwards** and strikes rows out, the `NULL`-padded ones too.

```result
title: The condition in ON
query: |
  SELECT p.name, j.role
  FROM people AS p
  LEFT JOIN jobs AS j ON j.person_id = p.id AND j.role = 'technician'
  WHERE p.id IN (118, 164, 207)
  ORDER BY p.id;
caption: "All three people come out. The ones without a technician job get `NULL`."
```

```result
title: The same condition in WHERE
query: |
  SELECT p.name, j.role
  FROM people AS p
  LEFT JOIN jobs AS j ON j.person_id = p.id
  WHERE p.id IN (118, 164, 207)
    AND j.role = 'technician'
  ORDER BY p.id;
caption: "`WHERE j.role = 'technician'` is `NULL` on the padded rows, so it strikes them out: the `LEFT JOIN` turned into a plain `JOIN` without a word."
```

**A table with itself (self-join).** To ask "A paid B, and did B pay anyone afterwards?", you join `transfers` with `transfers`, with two aliases: `t1` is the first payment and `t2` the next one, and the `ON` says how they chain: what `t1` received is what `t2` pays.

```figure
title: A self-join chains rows of the same table
panes:
  - label: "t1: a payment"
    table: { head: [from_phone, to_phone, moment], rows: [[A, B, "10:40"]] }
  - label: "t2: another payment from the same table"
    table: { head: [from_phone, to_phone, moment], rows: [[B, C, "11:52"]] }
  - label: "ON t2.from_phone = t1.to_phone"
    value: "A → B → C"
steps:
  - "The same `B` receives in `t1` and pays in `t2`."
  - "One more condition narrows the time: `t2.moment BETWEEN t1.moment AND datetime(t1.moment, '+3 hours')`."
```

In self-joins you often ask for `a.id < b.id`, so a row isn't paired with itself and each pair doesn't come out twice:

```sql run
SELECT a.name, b.name, a.born
FROM people AS a
JOIN people AS b ON b.born = a.born AND a.id < b.id
WHERE a.district = 'Surquillo' AND b.district = 'Surquillo';
```

**Anti-join and semi-join.** Sometimes you don't want the pairs, just to know **whether they exist**. An **anti-join** keeps the rows that have **no** partner: `LEFT JOIN … WHERE right.id IS NULL`, or better, `NOT EXISTS (…)`. A **semi-join** keeps the ones that **do**, **just once** even if they have several: `EXISTS (…)`. What goes inside `EXISTS` is a query that looks at the outer row; in session 7 you'll see how it runs.

```join
title: NOT EXISTS, whoever has no partner at all
query: |
  SELECT v.name
  FROM victims AS v
  WHERE NOT EXISTS (
    SELECT 1 FROM reports AS r
    WHERE r.reporter_id = v.id
  );
left:
  name: v
  cols: [id, name]
  rows: [[1, Rosa], [2, Beto], [3, Nelly], [4, Kike]]
right:
  name: r
  cols: [id, reporter_id]
  rows: [[301, 1], [302, 3], [303, 3]]
on: [id, reporter_id]
type: anti
caption: "Beto and Kike never reported: they are the ones that come out."
```

```join
title: EXISTS, whoever has at least one
query: |
  SELECT v.name
  FROM victims AS v
  WHERE EXISTS (
    SELECT 1 FROM reports AS r
    WHERE r.reporter_id = v.id
  );
left:
  name: v
  cols: [id, name]
  rows: [[1, Rosa], [2, Beto], [3, Nelly], [4, Kike]]
right:
  name: r
  cols: [id, reporter_id]
  rows: [[301, 1], [302, 3], [303, 3]]
on: [id, reporter_id]
type: semi
caption: "Nelly reported twice and comes out once. With a plain `JOIN` she'd come out twice."
```

**Counting after multiplying.** If a `JOIN` duplicates rows, `COUNT(*)` counts the duplicates. `COUNT(DISTINCT p.id)` counts distinct people:

```sql run
SELECT COUNT(*) AS row_count, COUNT(DISTINCT p.id) AS person_count
FROM people AS p
JOIN jobs AS j ON j.person_id = p.id;
```

> **Common trap:** a `LEFT JOIN` followed by a `WHERE` on a column of the right table (`WHERE j.role = 'technician'`) deletes exactly the rows the `LEFT JOIN` had rescued, because that column is `NULL` in them. If the condition is about choosing a partner, it goes in the `ON`. If you really want the rows without a partner, ask for them with `IS NULL`, on a column that is never `NULL` on the right, like its key.

<!-- legacy: left-join -->

<!-- mdn: left-join -->

## Practice

```exercise
id: sql6-predice-left
type: predict
title: No job, and two
prompt: |
  207 is Ximena Flores, who has no job on record; 742 is Kevin Rojas, who had two. What does it return?
code: |
  SELECT p.name, j.role
  FROM people AS p
  LEFT JOIN jobs AS j ON j.person_id = p.id
  WHERE p.id IN (207, 742)
  ORDER BY p.id, j.since;
options:
  - |-
    Ximena Flores Aguilar | NULL
    Kevin Rojas Palomino | courier
    Kevin Rojas Palomino | courier
  - |-
    Kevin Rojas Palomino | courier
    Kevin Rojas Palomino | courier
  - |-
    Ximena Flores Aguilar | NULL
    Kevin Rojas Palomino | courier
  - |-
    Ximena Flores Aguilar |
    Kevin Rojas Palomino | courier
answer: |-
  Ximena Flores Aguilar | NULL
  Kevin Rojas Palomino | courier
  Kevin Rojas Palomino | courier
explain: |
  Ximena finds no partner and, since it's a `LEFT JOIN`, comes out anyway with `NULL`. Kevin finds two and comes out twice: `LEFT JOIN` multiplies too.
```

```exercise
id: sql6-predice-on-where
type: predict
title: ON or WHERE
prompt: |
  There are 24 cameras and only camera 3 read the plate `b7r415`. What do the two queries return?
code: |
  SELECT count(*)
  FROM cameras AS c
  LEFT JOIN sightings AS s ON s.camera_id = c.id AND s.plate = 'b7r415';

  SELECT count(*)
  FROM cameras AS c
  LEFT JOIN sightings AS s ON s.camera_id = c.id
  WHERE s.plate = 'b7r415';
options:
  - |-
    24
    1
  - |-
    1
    1
  - |-
    24
    24
  - |-
    1
    24
answer: |-
  24
  1
explain: |
  In the first one, the plate chooses the partner: camera 3 finds it and the other 23 come out with `NULL`. In the second, the `LEFT JOIN` pairs each camera with all its sightings and then `WHERE` strikes out everything that isn't `b7r415`, including the 23 without a partner.
```

```exercise
id: sql6-completa-sin-lecturas
type: complete
title: Silent robots
prompt: |
  List the **name** of the robots that have **no reading at all** in `readings`, alphabetically. Use a `LEFT JOIN` and keep the rows without a partner. Replace the `___`.
starter: |
  SELECT b.name
  FROM robots AS b
  ___ readings AS r ON r.robot_id = b.id
  WHERE r.id ___
  ORDER BY b.name;
solution: |
  SELECT b.name
  FROM robots AS b
  LEFT JOIN readings AS r ON r.robot_id = b.id
  WHERE r.id IS NULL
  ORDER BY b.name;
hints:
  - "A robot with no readings comes out of the `LEFT JOIN` with `NULL` in every column of `r`, including `r.id`, which is never `NULL` in a real reading."
tests:
  - name: the robots with no readings, in order
    same: SELECT b.name FROM robots AS b WHERE NOT EXISTS (SELECT 1 FROM readings AS r WHERE r.robot_id = b.id) ORDER BY b.name
    ordered: true
```

```exercise
id: sql6-arregla-camaras
type: fix
title: The cameras that didn't see it
prompt: |
  We want **each of the 24 cameras** (`code`) with its sightings of Renzo's plate, **B7R-415** written any way (`plate`), and the cameras that never read it with `NULL`. Order by camera `id` and then by moment. The query returns only 3 rows: fix it.
starter: |
  SELECT c.code, s.plate
  FROM cameras AS c
  LEFT JOIN sightings AS s ON s.camera_id = c.id
  WHERE upper(replace(replace(s.plate, ' ', ''), '-', '')) = 'B7R415'
  ORDER BY c.id, s.moment_utc;
solution: |
  SELECT c.code, s.plate
  FROM cameras AS c
  LEFT JOIN sightings AS s
    ON s.camera_id = c.id
   AND upper(replace(replace(s.plate, ' ', ''), '-', '')) = 'B7R415'
  ORDER BY c.id, s.moment_utc;
hints:
  - The `WHERE` strikes out the rows where `s.plate` is `NULL`, which are exactly the cameras without a partner.
  - "The condition on the plate chooses the partner: move it into the `ON` with `AND`."
tests:
  - name: all 24 cameras, with the plate or NULL
    same: SELECT c.code, s.plate FROM cameras AS c LEFT JOIN sightings AS s ON s.camera_id = c.id AND upper(replace(replace(s.plate, ' ', ''), '-', '')) = 'B7R415' ORDER BY c.id, s.moment_utc
    ordered: true
```

```exercise
id: sql6-escribe-sin-denuncia
type: write
title: Paid and never reported
prompt: |
  List the **name** and **amount** of the victims who paid a **deposit** (the payment's note starts with `deposit`) and **never filed a fraud report**, alphabetically. Use `NOT EXISTS` or a `LEFT JOIN … IS NULL`.
visual:
  join:
    left:
      name: victims
      cols: [id, name]
      rows: [[118, Sonia], [512, "?"], [164, Walter]]
    right:
      name: reports
      cols: [id, reporter_id]
      rows: [[11, 118], [12, 164]]
    on: [id, reporter_id]
    type: anti
starter: |
  SELECT v.name, t.amount
  FROM transfers AS t
  JOIN people AS v ON v.phone = t.from_phone
  WHERE t.note LIKE 'deposit%'
  ORDER BY v.name;
solution: |
  SELECT v.name, t.amount
  FROM transfers AS t
  JOIN people AS v ON v.phone = t.from_phone
  WHERE t.note LIKE 'deposit%'
    AND NOT EXISTS (
      SELECT 1 FROM reports AS r
      WHERE r.reporter_id = v.id AND r.kind = 'fraud'
    )
  ORDER BY v.name;
hints:
  - "`NOT EXISTS (SELECT 1 FROM reports AS r WHERE r.reporter_id = v.id AND r.kind = 'fraud')`: there's no fraud report by this person."
  - "With `LEFT JOIN`: `LEFT JOIN reports AS r ON r.reporter_id = v.id AND r.kind = 'fraud'` and `WHERE r.id IS NULL`. The kind goes in the `ON`."
tests:
  - name: the victims who didn't report, with their amount
    same: SELECT v.name, t.amount FROM transfers AS t JOIN people AS v ON v.phone = t.from_phone LEFT JOIN reports AS r ON r.reporter_id = v.id AND r.kind = 'fraud' WHERE t.note LIKE 'deposit%' AND r.id IS NULL ORDER BY v.name
    ordered: true
```

```exercise
id: sql6-escribe-exists
type: write
title: La Victoria residents who collected
prompt: |
  List the **name** of the people who live in **La Victoria** and received **at least one deposit**, each **just once**, alphabetically. Use `EXISTS`.
starter: |
  SELECT p.name
  FROM people AS p
  JOIN transfers AS t ON t.to_phone = p.phone
  WHERE p.district = 'La Victoria'
    AND t.note LIKE 'deposit%'
  ORDER BY p.name;
solution: |
  SELECT p.name
  FROM people AS p
  WHERE p.district = 'La Victoria'
    AND EXISTS (
      SELECT 1 FROM transfers AS t
      WHERE t.to_phone = p.phone AND t.note LIKE 'deposit%'
    )
  ORDER BY p.name;
hints:
  - Run the query above: each name comes out once per deposit. `EXISTS` only asks whether there is any.
tests:
  - name: each person once, in order
    same: SELECT DISTINCT p.name FROM people AS p JOIN transfers AS t ON t.to_phone = p.phone WHERE p.district = 'La Victoria' AND t.note LIKE 'deposit%' ORDER BY p.name
    ordered: true
  - name: uses EXISTS
    source: '\bEXISTS\s*\('
```

## The case

```exercise
id: sql6-caso-chip
type: case
title: The two lost payments
prompt: |
  **Which number did Edwin Condori's and Iván Choque's deposits go to?** Type the phone number.

  Below is the query from yesterday's mission. Swap the `JOIN` that loses rows for one that doesn't, and also show the phone that received each payment (`t.to_phone`).
visual:
  - setting:
      case: pagos
  - figure:
      title: Nine reports, seven rows
      panes:
        - label: "reports with a deposit"
          value: "9"
        - label: "rows with JOIN"
          value: "7"
        - label: "where are the other 2?"
          value: "?"
starter: |
  SELECT r.report_date, v.name AS victim, t.amount, c.name AS collector
  FROM reports AS r
  JOIN people AS v ON v.id = r.reporter_id
  JOIN transfers AS t ON t.from_phone = v.phone
  JOIN people AS c ON c.phone = t.to_phone
  WHERE r.kind = 'fraud'
    AND t.note LIKE 'deposit%'
  ORDER BY r.report_date;
solution: |
  SELECT r.report_date, v.name AS victim, t.amount, t.to_phone, c.name AS collector
  FROM reports AS r
  JOIN people AS v ON v.id = r.reporter_id
  JOIN transfers AS t ON t.from_phone = v.phone
  LEFT JOIN people AS c ON c.phone = t.to_phone
  WHERE r.kind = 'fraud'
    AND t.note LIKE 'deposit%'
  ORDER BY r.report_date;
answer: "951207384"
answerLabel: Which number did they go to? (9 digits)
reveal: |
  **To 951207384**, which belongs to nobody in the register: it's a **chip** bought unregistered. That's why the last `JOIN` dropped it. Edwin paid it S/ 500 on 6 March and Iván S/ 320 on the 10th. That makes **four** numbers collecting: Kevin, Brenda, Jhonatan and an anonymous chip.
hints:
  - "The row gets lost in the last `JOIN`, the one that looks for the owner of the receiving phone. If nobody owns that number, there's no partner."
  - "`LEFT JOIN people AS c ON c.phone = t.to_phone` and add `t.to_phone` to the `SELECT`."
```

## The judge

As before, your query runs on the example and on hidden databases. Careful: some hidden databases have orders with no customer (`customer_id` is `NULL`) and orders with no amount.

```exercise
id: sql6-juez-sin-pedidos
type: judge
title: Customers who never ordered
prompt: |
  **Return the `id` and `name` of the customers who have no order at all, ordered by `id`.**

  The juice bar wants to send a coupon to registered customers who never ordered anything. The data comes from an old till: there are orders with no customer (`customer_id` is `NULL`, a walk-in sale) and orders with the amount missing. An order counts even if it has no amount.

  **Tables:** `customers(id, name)` and `orders(id, customer_id, amount)`.

  **Result:** `id` and `name`, ordered by `id`.
schema: |
  CREATE TABLE customers (id INTEGER, name TEXT);
  CREATE TABLE orders (id INTEGER, customer_id INTEGER, amount REAL);
ordered: true
starter: |
  SELECT c.id, c.name
  FROM customers AS c
  JOIN orders AS o ON o.customer_id = c.id
  ORDER BY c.id;
solution: |
  SELECT c.id, c.name
  FROM customers AS c
  WHERE NOT EXISTS (
    SELECT 1 FROM orders AS o
    WHERE o.customer_id = c.id
  )
  ORDER BY c.id;
hints:
  - "It's an anti-join: `NOT EXISTS (SELECT 1 FROM orders AS o WHERE o.customer_id = c.id)`."
  - "If you use `LEFT JOIN … IS NULL`, ask about `o.id`, not `o.amount`: a real order can have an empty amount. And beware of `NOT IN` if `customer_id` can be `NULL`."
samples:
  - rows:
      customers: [[1, "Rosa"], [2, "Beto"], [3, "Nelly"], [4, "Kike"]]
      orders: [[10, 1, 12.5], [11, 3, null], [12, 1, 8.0]]
    note: "Rosa ordered twice and Nelly once (no amount, but she ordered). Beto and Kike never did."
  - rows:
      customers: [[5, "Tito"], [6, "Juana"]]
      orders: [[20, null, 4.5], [21, 6, 9.0]]
    note: "Order 20 has no customer: it isn't Tito's. Tito comes out."
edge:
  - rows: { customers: [[1, "A"], [2, "B"]], orders: [] }
    tag: with no orders at all
  - rows: { customers: [], orders: [[1, 1, 5.0]] }
    tag: with no customers
  - rows: { customers: [[3, "C"], [1, "A"], [2, "B"]], orders: [[1, null, 2.0], [2, 2, null]] }
    tag: with an order without a customer and another without an amount
random:
  count: 40
  seed: 606
  generate: |
    const names = ["Rosa", "Beto", "Nelly", "Kike", "Juana", "Tito", "Pancho", "Mechita", "Lucho", "Carmen"];
    const nc = rng.int(0, 10), no = rng.int(0, 14);
    const ids = [];
    while (ids.length < nc) { const k = rng.int(1, 40); if (!ids.includes(k)) ids.push(k); }
    const customers = ids.map((id) => [id, rng.pick(names)]);
    const orders = Array.from({ length: no }, (_, i) => [i + 1, rng.chance(0.2) ? null : rng.int(1, 45), rng.chance(0.25) ? null : rng.int(2, 40) / 2]);
    return { customers, orders };
wrong:
  - |
    SELECT id, name FROM customers WHERE id NOT IN (SELECT customer_id FROM orders) ORDER BY id;
  - |
    SELECT c.id, c.name FROM customers AS c LEFT JOIN orders AS o ON o.customer_id = c.id WHERE o.amount IS NULL ORDER BY c.id;
  - |
    SELECT c.id, c.name FROM customers AS c JOIN orders AS o ON o.customer_id <> c.id ORDER BY c.id;
```

## Final mission

```exercise
id: sql6-mision-salto
type: mission
title: Where the money jumps to
prompt: |
  **For each deposit, find the payments made by the phone that received it in the next three hours. Show the deposit's amount as `deposit`, the amount that went out as `outgoing`, the minutes between the two as `minutes` and the name of whoever got the outgoing payment as `receiver`, ordered by the deposit's moment.** Then say who the money reaches.

  It's a self-join: `t1` is the deposit and `t2` the next payment, from the same table. Use `LEFT JOIN` for the receiver's name, in case it's another chip.

  When the query proves it and you answer, together with the judge, session 7 opens.
visual:
  - setting:
      case: pagos
  - network:
      title: "One deposit and what happens next"
      nodes:
        - {"id": "s", "icon": "person", "label": "Sonia", "sub": "the victim"}
        - {"id": "b", "icon": "person", "label": "Brenda", "sub": "who collected (t1)"}
        - {"id": "x", "icon": "box", "label": "Who?", "sub": "the next payment (t2)"}
      links: [{"id": "a", "label": "deposit"}, {"id": "b2", "label": "up to 3 hours later"}]
      clockLabel: "Since the deposit"
      clockMax: 120
      steps:
        - {"at": "s", "clock": 0, "clockText": "0 min", "note": "3 March, 19:12: Sonia sends S/ 300 as a deposit."}
        - move: ["s", "b"]
          packet: {"kind": "up", "label": "S/ 300, deposit"}
          clock: 0
          clockText: "0 min"
          note: "Payment `t1` reaches Brenda's phone."
        - move: ["b", "x"]
          packet: {"kind": "up", "label": "S/ 270"}
          clock: 65
          clockText: "65 min"
          tags: {"x": "whose is it?"}
          note: "Sixty-five minutes later, that same phone pays S/ 270 to another number: payment `t2`. Your query does it for all 14 victims at once, with `LEFT JOIN` for the name."
starter: |
  SELECT t1.to_phone, t1.amount, t1.moment
  FROM transfers AS t1
  WHERE t1.note LIKE 'deposit%'
  ORDER BY t1.moment;
solution: |
  SELECT t1.amount AS deposit,
         t2.amount AS outgoing,
         CAST(round((julianday(t2.moment) - julianday(t1.moment)) * 24 * 60) AS INTEGER) AS minutes,
         p.name AS receiver
  FROM transfers AS t1
  JOIN transfers AS t2
    ON t2.from_phone = t1.to_phone
   AND t2.moment BETWEEN t1.moment AND datetime(t1.moment, '+3 hours')
  LEFT JOIN people AS p ON p.phone = t2.to_phone
  WHERE t1.note LIKE 'deposit%'
  ORDER BY t1.moment;
answer: Milagros Tello Benavides
answerLabel: Who does the money reach? (full name)
reveal: |
  **Milagros Tello Benavides.** All 14 deposits, from the four collectors (the chip too), jump to her phone between 48 and 140 minutes later, and it's always **90%**: out of 300 go 270, out of 500 go 450. The collectors keep a cut and pass the rest on. Milagros lives in Surquillo and works as a cashier. Is she the one in charge, or just somebody else's till?
hints:
  - "The self-join's `ON`: `t2.from_phone = t1.to_phone AND t2.moment BETWEEN t1.moment AND datetime(t1.moment, '+3 hours')`."
  - "The minutes: `(julianday(t2.moment) - julianday(t1.moment)) * 24 * 60`, rounded and cast to an integer as in session 3."
tests:
  - name: each deposit with the next payment, by moment
    same: SELECT t1.amount, t2.amount, CAST(round((julianday(t2.moment) - julianday(t1.moment)) * 1440) AS INTEGER), p.name FROM transfers AS t1 JOIN transfers AS t2 ON t2.from_phone = t1.to_phone AND t2.moment BETWEEN t1.moment AND datetime(t1.moment, '+3 hours') LEFT JOIN people AS p ON p.phone = t2.to_phone WHERE t1.note LIKE 'deposit%' ORDER BY t1.moment
    ordered: true
  - name: the columns are deposit, outgoing, minutes and receiver
    columns: [deposit, outgoing, minutes, receiver]
```

## Expert challenge

```exercise
id: sql6-reto-devueltas
type: challenge
title: Returned calls
prompt: |
  **Find the calls that were returned within an hour: someone calls and, within the next 60 minutes, the person who received it calls back. Show the name of whoever called first as `caller_name`, the name of whoever called back as `returned_by` (or `NULL` if the number belongs to nobody), the time of the first call as `first_call` and the minutes until the call back as `minutes`. Order by `first_call`.**

  For people who already code: it's a self-join on `calls` with a "crossed" condition (`caller` with `callee` and vice versa) plus a time window, and two `LEFT JOIN`s to `people`. Look closely at the names that come out.
starter: |
  SELECT caller, callee, started
  FROM calls
  ORDER BY started
  LIMIT 20;
solution: |
  SELECT p1.name AS caller_name,
         p2.name AS returned_by,
         a.started AS first_call,
         CAST(round((julianday(b.started) - julianday(a.started)) * 24 * 60) AS INTEGER) AS minutes
  FROM calls AS a
  JOIN calls AS b
    ON b.caller = a.callee
   AND b.callee = a.caller
   AND b.started > a.started
   AND b.started <= datetime(a.started, '+1 hour')
  LEFT JOIN people AS p1 ON p1.phone = a.caller
  LEFT JOIN people AS p2 ON p2.phone = a.callee
  ORDER BY a.started;
hints:
  - "`b` returns call `a` when `b.caller = a.callee AND b.callee = a.caller`, and starts after `a` but before `datetime(a.started, '+1 hour')`."
  - "Whoever calls back is the first call's callee: `p2.phone = a.callee`."
tests:
  - name: the calls returned within an hour
    same: SELECT p1.name, p2.name, a.started, CAST(round((julianday(b.started) - julianday(a.started)) * 1440) AS INTEGER) FROM calls AS a JOIN calls AS b ON b.caller = a.callee AND b.callee = a.caller AND b.started > a.started AND b.started <= datetime(a.started, '+1 hour') LEFT JOIN people AS p1 ON p1.phone = a.caller LEFT JOIN people AS p2 ON p2.phone = a.callee ORDER BY a.started
    ordered: true
  - name: columns caller_name, returned_by, first_call and minutes
    columns: [caller_name, returned_by, first_call, minutes]
```
