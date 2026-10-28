# Session 5 — Joining tables with JOIN

```session
case: pagos
```

## The job

Monday 23 March. The gyroscope case is closed and the Surquillo police station brings another one: **Sonia Huamán**, a local teacher, saw a dirt-cheap iPhone 13 on Marketplace, paid a **S/ 300 deposit by Yape** to hold it, and never heard from the seller again. She isn't the only one: in March several reports tell the same story, from different districts. Chasqui suspects **a single ring**.

The trouble is that what you need is spread out. The report says **who reported it** (a person number), the register has **that person's phone**, and payments are stored **by phone**. No table has the answer on its own: you have to **join** them. That's what `JOIN` does.

```setting
case: pagos
title: The payments ring
caption: "On the left, the victims' phones; in the middle, where the money goes. Every clue you find is pinned here."
```

```dossier
title: The first report
cards:
  - name: Sonia Huamán Ríos
    traits: { style: bun, shirt: "#3f7cc4", glasses: true }
    role: Teacher, lives in Surquillo
    rows: [["Reported", "5 March"], ["Paid", "a S/ 300 deposit"], ["For", "an iPhone 13"]]
    quote: "I sent the Yape and he blocked me half an hour later."
```

## The minimum

**A table is a set of rows.** Each row is a fact (a person, a report, a payment) and has no order of its own. So two rows can't be confused, every table has a **primary key**: a column that is different in every row, like `people.id`. And when a row talks about another one, it stores that row's key: `reports.reporter_id` is the `id` of a person. That column is called a **foreign key**. This is how tables connect without repeating data: Sonia's name is stored once, in `people`.

```schema
title: Three tables of the case
tables: [reports, people, transfers]
caption: "The link marks the foreign key `reporter_id` → `people.id`. `transfers` has no foreign key: it joins `people` by **phone**, because a `JOIN` can use any pair of columns with equal values."
```

`JOIN … ON` **pairs rows**: for every row of the left table, it looks for the rows on the right that meet the `ON` condition, and for each pair it builds a new row with the columns of both. A row that finds no partner **doesn't come out**. Press ▶:

```join
title: Each report looks for its reporter
query: |
  SELECT r.id, r.kind, p.name
  FROM reports AS r
  JOIN people AS p ON p.id = r.reporter_id;
left:
  name: r
  cols: [id, kind, reporter_id]
  rows: [[101, fraud, 118], [102, theft, 640], [103, fraud, 164], [104, noise, 9999]]
right:
  name: p
  cols: [id, name]
  rows: [[118, "Sonia Huamán Ríos"], [164, "Walter Mendoza Quispe"], [207, "Ximena Flores Aguilar"], [640, "Rocío Ramos Silva"]]
on: [reporter_id, id]
type: inner
caption: "Report 104 points to a person who doesn't exist: it doesn't come out. Ximena (207) reported nothing: she doesn't come out either. SQLite compares every left row with the right ones: it's a **nested loop**, and in session 14 you'll see how an index saves it almost all those comparisons."
```

```sql run
SELECT r.report_date, r.district, p.name, p.phone
FROM reports AS r
JOIN people AS p ON p.id = r.reporter_id
WHERE r.kind = 'fraud'
  AND r.description LIKE '%deposit%'
ORDER BY r.report_date;
```

What you need today:

- **Aliases.** `reports AS r` gives the table a short name. When two tables have a column with the same name (both have `id` and `district`), say which one: `r.district`, `p.district`. Otherwise SQLite answers *ambiguous column name*.
- **More than two tables.** Each `JOIN` adds one more table to the result you already have: `reports` → `people` → `transfers`, each with its own `ON`.
- **`USING (col)`** is a shortcut when the column has the same name in both tables: `vehicles JOIN licenses USING (person_id)` means `ON vehicles.person_id = licenses.person_id`.
- **`CROSS JOIN`** pairs **everything with everything**, no condition: the **Cartesian product**. With 24 cameras and 120 stalls you get 2880 rows. You almost never want it; it exists to build combinations on purpose.

```figure
title: CROSS JOIN, everything with everything
panes:
  - label: "a (2 rows)"
    table: { head: [gate], rows: [[1], [2]] }
  - label: "b (3 rows)"
    table: { head: [shift], rows: [[morning], [afternoon], [night]] }
  - label: "a CROSS JOIN b (2 × 3 = 6 rows)"
    table: { head: [gate, shift], rows: [[1, morning], [1, afternoon], [1, night], [2, morning], [2, afternoon], [2, night]] }
```

**Duplicates by multiplication.** If a left row finds **two** partners, it comes out **twice**. Kevin had two jobs: joining him with `jobs` doubles him, and if you then add something up for Kevin, you add it twice.

```join
title: A row with two partners comes out twice
query: |
  SELECT p.name, j.role, j.until
  FROM people AS p
  JOIN jobs AS j ON j.person_id = p.id;
left:
  name: p
  cols: [id, name]
  rows: [[742, "Kevin Rojas Palomino"], [118, "Sonia Huamán Ríos"], [779, "Brenda Salazar Cusi"]]
right:
  name: j
  cols: [person_id, role, until]
  rows: [[742, courier, "2025-10-31"], [742, courier, null], [779, courier, null]]
on: [id, person_id]
type: inner
caption: "Kevin shows up twice, once per job. Sonia has no job on record here and doesn't come out."
```

> **Common trap:** the old way to join is with commas, `FROM vehicles, people WHERE …`, with the join condition mixed into the filters. Forget it and there's no error: you get the **Cartesian product**, every car with every person, hundreds of thousands of rows. Always write `JOIN … ON`: the condition sits next to the table it joins and is hard to forget. And before adding things up after a `JOIN`, ask yourself whether some row could have been multiplied.

<!-- legacy: comma-join -->

<!-- mdn: comma-join -->

## Practice

```exercise
id: sql5-predice-cruz
type: predict
title: Everything with everything
prompt: |
  The `cameras` table has 24 rows. What does it return?
code: |
  SELECT count(*)
  FROM cameras AS a
  CROSS JOIN cameras AS b;
options:
  - "24"
  - "48"
  - "576"
  - "1"
answer: "576"
explain: |
  `CROSS JOIN` pairs each of the 24 rows of `a` with each of the 24 of `b`: 24 × 24 = 576. A table can be joined with itself; the aliases `a` and `b` tell them apart.
```

```exercise
id: sql5-predice-multiplica
type: predict
title: Two jobs, two rows
prompt: |
  What does it return? (742 is Kevin Rojas, who had two courier jobs.)
code: |
  SELECT p.name, j.role
  FROM people AS p
  JOIN jobs AS j ON j.person_id = p.id
  WHERE p.id = 742
  ORDER BY j.since;
options:
  - |-
    Kevin Rojas Palomino | courier
  - |-
    Kevin Rojas Palomino | courier
    Kevin Rojas Palomino | courier
  - |-
    Kevin Rojas Palomino | NULL
  - |-
    Kevin Rojas Palomino | courier | courier
answer: |-
  Kevin Rojas Palomino | courier
  Kevin Rojas Palomino | courier
explain: |
  Kevin's row finds two partners in `jobs`, so it comes out twice. `JOIN` doesn't merge the partners into one row: it builds one row per pair.
```

```exercise
id: sql5-completa-denunciante
type: complete
title: Who reported each fraud
prompt: |
  List the `report_date` of each **fraud** report and the **name** of the person who made it, ordered by date and then by the report's `id`. Replace the `___`.
starter: |
  SELECT r.report_date, p.name
  FROM reports AS r
  JOIN people AS p ON ___ = ___
  WHERE r.kind = 'fraud'
  ORDER BY r.report_date, r.id;
solution: |
  SELECT r.report_date, p.name
  FROM reports AS r
  JOIN people AS p ON p.id = r.reporter_id
  WHERE r.kind = 'fraud'
  ORDER BY r.report_date, r.id;
hints:
  - "The report stores the person's `id` in `reporter_id`."
tests:
  - name: date and name of each fraud, in order
    same: SELECT r.report_date, p.name FROM reports AS r JOIN people AS p ON p.id = r.reporter_id WHERE r.kind = 'fraud' ORDER BY r.report_date, r.id
    ordered: true
```

```exercise
id: sql5-arregla-on
type: fix
title: Names that don't fit
prompt: |
  This query should give the `report_date`, the `place` and the **name of the person who reported** each **theft in Miraflores**, by date and then by `id`. It runs and names come out, but they aren't the reporters. Fix the `ON` condition.
visual:
  figure:
    title: The column that connects
    panes:
      - label: "reports"
        table: { head: [id, kind, reporter_id], rows: [[57, theft, 812]] }
      - label: "people"
        table: { head: [id, name], rows: [[57, "(someone unrelated)"], [812, "(the reporter)"]] }
starter: |
  SELECT r.report_date, r.place, p.name
  FROM reports AS r
  JOIN people AS p ON p.id = r.id
  WHERE r.kind = 'theft' AND r.district = 'Miraflores'
  ORDER BY r.report_date, r.id;
solution: |
  SELECT r.report_date, r.place, p.name
  FROM reports AS r
  JOIN people AS p ON p.id = r.reporter_id
  WHERE r.kind = 'theft' AND r.district = 'Miraflores'
  ORDER BY r.report_date, r.id;
hints:
  - "`r.id` is the report's number, not a person's. Which column of `reports` points to `people`?"
tests:
  - name: each Miraflores theft with its reporter
    same: SELECT r.report_date, r.place, p.name FROM reports AS r JOIN people AS p ON p.id = r.reporter_id WHERE r.kind = 'theft' AND r.district = 'Miraflores' ORDER BY r.report_date, r.id
    ordered: true
```

```exercise
id: sql5-arregla-coma
type: fix
title: Thousands of yellow cars
prompt: |
  The council asked for the **plate** and the **owner's name** of the **yellow** cars whose owners live in **Barranco**, by plate. The query uses the old comma form and returns a mountain of rows. Rewrite it with `JOIN … ON`.
starter: |
  SELECT v.plate, p.name
  FROM vehicles AS v, people AS p
  WHERE v.color = 'yellow' AND p.district = 'Barranco'
  ORDER BY v.plate;
solution: |
  SELECT v.plate, p.name
  FROM vehicles AS v
  JOIN people AS p ON p.id = v.person_id
  WHERE v.color = 'yellow' AND p.district = 'Barranco'
  ORDER BY v.plate;
hints:
  - It's missing the condition that says whose car each one is. Without it, every yellow car comes out with every person in Barranco.
  - "`JOIN people AS p ON p.id = v.person_id`."
tests:
  - name: yellow plates of Barranco owners
    same: SELECT v.plate, p.name FROM vehicles AS v JOIN people AS p ON p.id = v.person_id WHERE v.color = 'yellow' AND p.district = 'Barranco' ORDER BY v.plate
    ordered: true
  - name: uses JOIN … ON
    source: '\bJOIN\b[\s\S]*\bON\b'
```

```exercise
id: sql5-escribe-tres
type: write
title: White cars, loaded licences
prompt: |
  List the **plate**, the owner's **name** and the **points** on their licence for the **white** cars whose owners have **more than 50** penalty points. Order from most points to fewest and then by plate. You need three tables: `vehicles`, `people` and `licenses`.
visual:
  schema:
    tables: [vehicles, people, licenses]
starter: |
  SELECT v.plate
  FROM vehicles AS v
  WHERE v.color = 'white';
solution: |
  SELECT v.plate, p.name, l.points
  FROM vehicles AS v
  JOIN people AS p ON p.id = v.person_id
  JOIN licenses AS l ON l.person_id = p.id
  WHERE v.color = 'white' AND l.points > 50
  ORDER BY l.points DESC, v.plate;
hints:
  - "One `JOIN` per table, each with its `ON`: the car with its owner, the owner with their licence."
  - "`licenses` can also join the car directly: `l.person_id = v.person_id`. Same result."
tests:
  - name: plate, name and points, in order
    same: SELECT v.plate, p.name, l.points FROM vehicles AS v JOIN people AS p ON p.id = v.person_id JOIN licenses AS l ON l.person_id = p.id WHERE v.color = 'white' AND l.points > 50 ORDER BY l.points DESC, v.plate
    ordered: true
```

## The case

```exercise
id: sql5-caso-adelanto
type: case
title: Sonia's deposit
prompt: |
  **Who did Sonia Huamán Ríos pay the deposit to?** Type the full name of the person who owns the phone that got the money.

  Follow the chain: her report, her phone in `people`, her payment in `transfers` (the payment's note says "deposit") and, with the phone that received it, `people` again. You can do it in steps or in a single query: to use `people` twice, give it two aliases, one for the victim and one for whoever collected.
visual:
  - setting:
      case: pagos
  - network:
      title: "Sonia's chain, row by row"
      nodes:
        - {"id": "d", "icon": "table", "label": "reports", "sub": "Sonia's report"}
        - {"id": "v", "icon": "record", "label": "people", "sub": "alias v: the victim"}
        - {"id": "t", "icon": "table", "label": "transfers", "sub": "her payment"}
        - {"id": "c", "icon": "record", "label": "people", "sub": "alias c: who collected"}
      links:
        - {"id": "l1", "label": "reporter_id = id"}
        - {"id": "l2", "label": "phone = from_phone"}
        - {"id": "l3", "label": "to_phone = phone"}
      steps:
        - phase: "1. The report"
          at: "d"
          note: "You start at `reports`: report 46 is Sonia's and stores a number, `reporter_id = 118`."
          show:
            label: "reports"
            table: {"head": ["id", "kind", "reporter_id"], "rows": [["46", "fraud", "118"]]}
        - phase: "2. The victim"
          move: ["d", "v"]
          packet: {"kind": "local", "label": "118"}
          note: "That 118 is the `id` of a row in `people`. You give that copy of the table the alias `v`: it is Sonia, with her phone."
          show:
            label: "people (v)"
            table: {"head": ["id", "name", "phone"], "rows": [["118", "Sonia Huamán Ríos", "979065539"]]}
        - phase: "3. The payment"
          move: ["v", "t"]
          packet: {"kind": "local", "label": "979065539"}
          note: "Her phone is the `from_phone` of a payment: 300 soles with the note \"deposit iPhone 13\". The payment also carries the phone that received it."
          show:
            label: "transfers"
            table: {"head": ["from_phone", "to_phone", "amount"], "rows": [["979065539", "913488521", "300"]]}
        - phase: "4. Who collected"
          move: ["t", "c"]
          packet: {"kind": "local", "label": "913488521"}
          note: "That `to_phone` is the phone of another row in `people`, the second copy, with alias `c`. Whose is it? That is what you are after."
          tags: {"c": "alias c: who?"}
          show:
            label: "people (c)"
            table: {"head": ["id", "name", "phone"], "rows": [["?", "?", "913488521"]]}
starter: |
  -- Sonia's report is in here. Who is its reporter?
  SELECT id, report_date, reporter_id, description
  FROM reports
  WHERE kind = 'fraud' AND district = 'Surquillo'
  ORDER BY report_date;
solution: |
  SELECT v.name AS victim, t.amount, t.note, c.name AS collector
  FROM reports AS r
  JOIN people AS v ON v.id = r.reporter_id
  JOIN transfers AS t ON t.from_phone = v.phone
  JOIN people AS c ON c.phone = t.to_phone
  WHERE v.name = 'Sonia Huamán Ríos'
    AND t.note LIKE 'deposit%';
answer: Brenda Salazar Cusi
answerLabel: Who got the deposit? (full name)
reveal: |
  **Brenda Salazar Cusi**, a 20-year-old courier from La Victoria. On 3 March at 19:12, Sonia's phone sent her S/ 300 with the note "deposit iPhone 13". In the report, Yape showed "Brenda S.": it fits. But Sonia wasn't the only one. Who did the others pay?
hints:
  - "First `v` (the victim) with `ON v.id = r.reporter_id`; then her payments with `ON t.from_phone = v.phone`."
  - "For the name of whoever received it: `JOIN people AS c ON c.phone = t.to_phone`."
```

## The judge

As in the earlier sessions: your query runs on the example tables and on hidden databases. Here there are two tables, and the hidden cases have stalls whose owners don't exist and owners with several stalls.

```exercise
id: sql5-juez-puestos
type: judge
title: Each stall with its owner's phone
prompt: |
  **Return each stall's number, its name, its owner's name and the owner's phone; ordered by stall number.**

  The market association wants to call every owner. A stall whose `owner_id` isn't in the owners table doesn't come out (those are checked separately). An owner can have several stalls. If an owner has no phone, they still come out, with `NULL`.

  **Tables:** `stalls(number, name, owner_id)` and `owners(id, name, phone)`. Stall numbers don't repeat.

  **Result:** number, stall name, owner name and phone, in that order.
schema: |
  CREATE TABLE stalls (number INTEGER, name TEXT, owner_id INTEGER);
  CREATE TABLE owners (id INTEGER, name TEXT, phone TEXT);
ordered: true
starter: |
  SELECT number, name
  FROM stalls
  ORDER BY number;
solution: |
  SELECT s.number, s.name, o.name, o.phone
  FROM stalls AS s
  JOIN owners AS o ON o.id = s.owner_id
  ORDER BY s.number;
hints:
  - "Both tables have a `name` column: with aliases (`s.name`, `o.name`) there's no confusion."
  - "A stall's owner is the row of `owners` whose `id` is the stall's `owner_id`."
samples:
  - rows:
      stalls: [[12, "Juguería Lucía", 3], [47, "Loop", 1], [5, "Frutas Don Julio", 3]]
      owners: [[1, "Carmen", "987111222"], [2, "Rosa", "955000111"], [3, "Lucía", null]]
    note: "Lucía has two stalls and comes out twice. Rosa has no stall and doesn't come out. Lucía has no phone: she comes out with NULL."
  - rows:
      stalls: [[8, "Pescados Beto", 9], [3, "Abarrotes Nelly", 2]]
      owners: [[2, "Nelly", "912345678"]]
    note: "Owner 9 doesn't exist: stall 8 doesn't come out."
edge:
  - rows: { stalls: [], owners: [[1, "Carmen", "987111222"]] }
    tag: with no stalls
  - rows: { stalls: [[1, "A", 5], [2, "B", 6]], owners: [[1, "X", "9"]] }
    tag: with no owner found
  - rows: { stalls: [[30, "C", 1], [10, "A", 1], [20, "B", 1]], owners: [[1, "Solo", "900000001"]] }
    tag: with one owner of every stall, out of order
random:
  count: 40
  seed: 505
  generate: |
    const names = ["Carmen", "Rosa", "Lucía", "Beto", "Nelly", "Tito", "Juana", "Kike", "Pancho", "Mechita"];
    const kinds = ["Frutas", "Pescados", "Abarrotes", "Flores", "Menú", "Quesos", "Jugos", "Pollos"];
    const nd = rng.int(0, 8), np = rng.int(0, 14);
    const owners = Array.from({ length: nd }, (_, i) => [i + 1, rng.pick(names), rng.chance(0.2) ? null : `9${rng.int(10000000, 99999999)}`]);
    const nums = [];
    while (nums.length < np) { const k = rng.int(1, 120); if (!nums.includes(k)) nums.push(k); }
    const stalls = nums.map((n) => [n, `${rng.pick(kinds)} ${n}`, rng.int(1, nd + 2)]);
    return { stalls, owners };
wrong:
  - |
    SELECT s.number, s.name, o.name, o.phone FROM stalls AS s, owners AS o ORDER BY s.number;
  - |
    SELECT s.number, s.name, o.name, o.phone FROM stalls AS s JOIN owners AS o ON o.id = s.number ORDER BY s.number;
  - |
    SELECT s.number, s.name, o.name, o.phone FROM stalls AS s LEFT JOIN owners AS o ON o.id = s.owner_id ORDER BY s.number;
  - |
    SELECT s.number, s.name, o.name, o.phone FROM stalls AS s JOIN owners AS o ON o.id = s.owner_id ORDER BY o.name;
```

## Final mission

```exercise
id: sql5-mision-cobradores
type: mission
title: The ones who collect
prompt: |
  **For each fraud report whose reporter paid a deposit, show the report's date as `report_date`, the victim's name as `victim`, the amount paid as `amount` and the name of whoever received it as `collector`, ordered by date.** Then say who collected the most deposits.

  It's the chain from the case, but for every victim who reported. Count the rows you get and compare them with the fraud reports that mention a deposit.

  When the query proves it and you answer, together with the judge, session 6 opens.
visual:
  - setting:
      case: pagos
  - schema:
      tables: [reports, people, transfers]
starter: |
  SELECT r.report_date, v.name AS victim
  FROM reports AS r
  JOIN people AS v ON v.id = r.reporter_id
  WHERE r.kind = 'fraud'
  ORDER BY r.report_date;
solution: |
  SELECT r.report_date, v.name AS victim, t.amount, c.name AS collector
  FROM reports AS r
  JOIN people AS v ON v.id = r.reporter_id
  JOIN transfers AS t ON t.from_phone = v.phone
  JOIN people AS c ON c.phone = t.to_phone
  WHERE r.kind = 'fraud'
    AND t.note LIKE 'deposit%'
  ORDER BY r.report_date;
answer: Kevin Rojas Palomino
answerLabel: Who collected the most deposits? (full name)
reveal: |
  **Kevin Rojas Palomino** collected three: Walter's, Ximena's and Raúl's. Brenda Salazar collected two and **Jhonatan Ugarte**, a driver from San Juan de Lurigancho, another two. Three collectors, three young people lending out their Yape.

  But look at the count: **nine** fraud reports mention a deposit and the query gives **seven** rows. Edwin Condori's and Iván Choque's reports vanished in some `JOIN`. In session 6 you'll see where they got lost.
hints:
  - "It's the four tables from the case, without the filter on Sonia: `WHERE r.kind = 'fraud' AND t.note LIKE 'deposit%'`."
  - To see who collected the most, count how many times each name appears in the `collector` column.
tests:
  - name: each report with its victim, amount and collector, by date
    same: SELECT r.report_date, v.name, t.amount, c.name FROM reports AS r JOIN people AS v ON v.id = r.reporter_id JOIN transfers AS t ON t.from_phone = v.phone JOIN people AS c ON c.phone = t.to_phone WHERE r.kind = 'fraud' AND t.note LIKE 'deposit%' ORDER BY r.report_date
    ordered: true
  - name: the columns are report_date, victim, amount and collector
    columns: [report_date, victim, amount, collector]
  - name: joins the tables with JOIN
    source: '\bJOIN\b'
```

## Expert challenge

```exercise
id: sql5-reto-multiplica
type: challenge
title: Without counting twice
prompt: |
  **For each collector with a name, show their name as `collector`, the role of their current job as `role`, how many deposits they got in March as `deposits` and how much they add up to as `total`, from highest to lowest total.** Count every deposit, not only the reported ones.

  For people who already code: it's the multiplication trap. Kevin has two rows in `jobs` (one ended in 2025); join carelessly and each of his deposits is counted twice. The current job is the one whose `until` is `NULL`.
starter: |
  SELECT c.name AS collector, j.role, t.amount
  FROM transfers AS t
  JOIN people AS c ON c.phone = t.to_phone
  JOIN jobs AS j ON j.person_id = c.id
  WHERE t.note LIKE 'deposit%';
solution: |
  SELECT c.name AS collector, j.role,
         COUNT(*) AS deposits,
         SUM(t.amount) AS total
  FROM transfers AS t
  JOIN people AS c ON c.phone = t.to_phone
  JOIN jobs AS j ON j.person_id = c.id AND j.until IS NULL
  WHERE t.note LIKE 'deposit%'
  GROUP BY c.id, c.name, j.role
  ORDER BY total DESC;
hints:
  - "Run the query above with `WHERE c.name LIKE 'Kevin%'` and count: each deposit comes out twice."
  - "The condition `j.until IS NULL` can go in the `ON` or in the `WHERE`; with a plain `JOIN` it makes no difference (in session 6 you'll see when it does)."
tests:
  - name: one row per collector, without duplicates
    same: SELECT c.name, j.role, COUNT(*), SUM(t.amount) FROM transfers AS t JOIN people AS c ON c.phone = t.to_phone JOIN jobs AS j ON j.person_id = c.id WHERE j.until IS NULL AND t.note LIKE 'deposit%' GROUP BY c.id ORDER BY 4 DESC
    ordered: true
  - name: columns collector, role, deposits and total
    columns: [collector, role, deposits, total]
```
