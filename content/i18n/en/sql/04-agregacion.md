# Session 4 — Aggregating: groups and totals

```session
case: surquillo
```

## The job

Tuesday 17 March. You already know **Renzo Huamaní lied**: his card logged the exit at 22:46 and the camera saw his car two minutes later, not at ten past eleven. But lying doesn't prove he took the gyroscope. The **why** is missing: a delivery robot's gyroscope is worth more than a thousand soles, and someone had to buy it.

The prosecutor's office gave Loop two more tables: **`calls`** and **`transfers`** (phone-to-phone payments): thousands of rows each. Nobody is going to read them one by one. Today you'll **summarise** them: count, add up and average by groups, so the pattern jumps out.

```setting
case: surquillo
title: Where we are
caption: "Five clues on the map: Friday night makes sense now. What happened next is in the phones."
```

```dossier
title: What we know so far
cards:
  - name: Renzo Huamaní Cárdenas
    traits: { style: short, shirt: "#5b6b7a", tool: true }
    role: Electronic spare-parts supplier
    rows: [["Phone", "in `people`"], ["Left", "22:46:12, Gate 3"], ["His car", "CAM-SUR-03, 22:48"]]
    quote: "I left at about ten past eleven and went straight home."
  - name: Chasqui
    kind: chasqui
    role: Loop's assistant
    rows: [["Calls", "thousands"], ["Payments", "thousands"]]
    quote: "I'm not reading them one by one. Let's summarise them."
```

```figure
title: "Friday the 13th, hour by hour"
timeline:
  - when: "Fri 19:30"
    title: "Wayra is left charging"
    text: "Carmen leaves her at stall 47."
    by: "sql1-caso-denuncia"
  - when: "22:41"
    title: "The gyroscope stops responding"
    text: "The last reading is at 22:41:07."
    by: "sql1-caso-denuncia"
  - when: "≈ 22:45"
    title: "Marleny sees someone leave"
    text: "A hooded person with a toolbox gets into a white car."
    by: "sql2-caso-entrevista"
  - when: "22:46"
    title: "Renzo swipes out"
    text: "Gate 3. He will later say he left at 23:10."
    by: "sql1-mision-salidas"
  - when: "22:48"
    title: "The camera reads his plate"
    text: "CAM-SUR-03: b7r415, Renzo's car. Lucía passes at 23:14 and Julio at 23:23."
    by: "sql3-mision-camara"
  - when: "22:52"
    title: "Renzo calls Tito Vílchez"
    text: "Six minutes after leaving."
    by: "sql4-caso-llamadas"
    now: true
  - when: "Sat 14 and Sun 15"
    title: "Tito pays Renzo"
    text: "Three payments adding up to S/ 1350."
    by: "sql4-mision-culpable"
    now: true
```

## The minimum

Until now every query returned **rows**: one for each row that got through the `WHERE`. An **aggregate function** does something else: it goes through many rows and returns **a single value**. `COUNT(*)` counts rows, `SUM` adds up, `AVG` averages, `MIN` and `MAX` keep the smallest and the largest.

```sql run
SELECT COUNT(*) AS total_rows,
       COUNT(phone) AS with_phone,
       COUNT(district) AS with_district,
       COUNT(DISTINCT district) AS districts
FROM people;
```

Three different counts on the same table: `COUNT(*)` counts **rows**, `COUNT(column)` counts the values **that aren't `NULL`** and `COUNT(DISTINCT column)` counts the **distinct** values, also without `NULL`. Compare the first three: the gap between `total_rows` and `with_phone` is the people with no phone on record.

### Inside: each function keeps a tally

The engine doesn't gather every row in memory and calculate afterwards. Each aggregate is an **accumulator**: it starts empty, looks at the rows one at a time and updates a couple of numbers. At the end it hands over the result.

| function | what it keeps while it goes through (and hands over) | no rows or all `NULL` |
|---|---|---|
| `COUNT(*)` | a counter, +1 per row | `0` |
| `COUNT(col)` | a counter, +1 if `col` isn't `NULL` | `0` |
| `SUM(col)` | the sum of the non-`NULL` values | `NULL` |
| `TOTAL(col)` | the same, always as REAL | `0.0` |
| `AVG(col)` | **two** numbers, the sum and how many it added; divides at the end | `NULL` |
| `MIN` / `MAX` | the smallest (or largest) seen so far | `NULL` |

That's why `AVG` **ignores** `NULL`s: it neither adds nor counts them. If three payments are 100, 200 and `NULL`, the average is 150, not 100.

### GROUP BY: one accumulator per group

**`GROUP BY column`** splits the rows into **groups**, one for each distinct value of that column, and runs the accumulators **inside each group**. The result has one row per group. Press ▶ and watch each payment fall into its bucket:

```groups
title: Each row falls into its group's bucket
query: |
  SELECT to_phone, COUNT(*), COUNT(note), SUM(amount), AVG(amount)
  FROM transfers
  GROUP BY to_phone;
table:
  name: transfers
  cols: [id, to_phone, amount, note]
  rows:
    - [1, "945534612", 80, "speaker"]
    - [2, "984486562", 450, "spare part"]
    - [3, "938599037", 120, "used phone"]
    - [4, "984486562", 500, null]
    - [5, "984486562", 400, "the rest"]
    - [6, "938599037", 60, null]
by: to_phone
agg:
  - { fn: count }
  - { fn: count, col: note }
  - { fn: sum, col: amount }
  - { fn: avg, col: amount }
caption: "Six payments, three receiving phones. `COUNT(note)` skips the `NULL`s; `AVG` keeps the sum and how many it added, and only divides at the end."
```

You can group by an **expression**, not just a column. `date(started)` turns each moment into its day, so this gives one row per day:

```sql run
SELECT date(started) AS day,
       COUNT(*) AS calls,
       SUM(duration_s) / 60 AS minutes
FROM calls
WHERE started BETWEEN '2026-03-12' AND '2026-03-15'
GROUP BY date(started)
ORDER BY day;
```

And by **several** columns: `GROUP BY from_phone, to_phone` makes one group for each **pair** of phones.

### HAVING: filtering groups, not rows

`WHERE` decides which **rows** go into the groups; it runs before grouping, so there are no sums or counts to look at yet. To keep only some **groups** by their sum or count, use **`HAVING`**, which runs after `GROUP BY`. Watch the run order with both filters:

```order
title: WHERE strikes rows, HAVING strikes groups
query: |
  SELECT to_phone, COUNT(*) AS payments, SUM(amount) AS total
  FROM transfers
  WHERE moment >= '2026-03-14'
  GROUP BY to_phone
  HAVING SUM(amount) > 300
  ORDER BY total DESC;
tables:
  transfers:
    cols: [id, to_phone, amount, moment]
    rows:
      - [1, "945534612", 80, "2026-03-11 12:00"]
      - [2, "984486562", 450, "2026-03-14 11:05"]
      - [3, "938599037", 120, "2026-03-14 16:22"]
      - [4, "984486562", 500, "2026-03-14 18:40"]
      - [5, "945534612", 350, "2026-03-13 09:30"]
      - [6, "984486562", 400, "2026-03-15 09:12"]
      - [7, "938599037", 60, "2026-03-16 10:47"]
      - [8, "945534612", 210, "2026-03-15 20:05"]
      - [9, "945534612", 150, "2026-03-16 08:40"]
caption: "`WHERE` drops the payments before Saturday the 14th. `GROUP BY` makes three groups. `HAVING` strikes the one that doesn't reach S/ 300. Only then does `SELECT` compute the columns and `ORDER BY` sort by the alias `total`."
```

Look at payment 5: S/ 350 to 945534612. `WHERE` drops it **before** adding up, so that phone reaches `HAVING` with 360, not 710. Putting a condition in `WHERE` or in `HAVING` is not the same thing.

### group_concat: joining text

`group_concat(col, separator)` is the aggregate for text: it glues each group's values into one. It lets you **see** what's inside each group without losing the summary:

```sql run
SELECT camera_id,
       COUNT(*) AS readings,
       group_concat(plate, ', ') AS plates
FROM sightings
WHERE moment_utc BETWEEN '2026-03-14 03:40' AND '2026-03-14 04:30'
GROUP BY camera_id
ORDER BY readings DESC
LIMIT 4;
```

> **Common trap:** in a query with `GROUP BY`, every `SELECT` column must be in the `GROUP BY` or inside an aggregate. `SELECT to_phone, moment, COUNT(*) … GROUP BY to_phone` makes no sense: a group has several moments, which one should it show? PostgreSQL gives an error. **SQLite doesn't**: it returns the `moment` of **some** row in the group, without saying which. That "bare column" looks like data and is close to random. The one documented exception: with a single `MIN` or `MAX`, bare columns come from the row that holds that minimum or maximum.

<!-- legacy: group-by-bare -->

<!-- legacy: group-concat -->

<!-- mdn: group-by-bare group-concat -->

## Practice

```exercise
id: sql4-predice-conteos
type: predict
title: Three ways to count
prompt: |
  Phone 959893795 made six payments in March; two have no note and three went to the same number. What does it return?
code: |
  SELECT COUNT(*), COUNT(note), COUNT(DISTINCT to_phone)
  FROM transfers
  WHERE from_phone = '959893795';
options:
  - "6 | 4 | 4"
  - "6 | 6 | 6"
  - "6 | 4 | 6"
  - "4 | 4 | 4"
answer: "6 | 4 | 4"
explain: |
  `COUNT(*)` counts all six rows. `COUNT(note)` skips the two `NULL`s: 4. `COUNT(DISTINCT to_phone)` counts distinct numbers: three payments go to the same one, so there are 4 receivers.
```

```exercise
id: sql4-predice-vacio
type: predict
title: Aggregating nothing
prompt: |
  No payment is over S/ 5000. What does it return?
code: |
  SELECT COUNT(*), SUM(amount), TOTAL(amount), AVG(amount)
  FROM transfers
  WHERE amount > 5000;
options:
  - "0 | NULL | 0.0 | NULL"
  - "0 | 0 | 0 | 0"
  - "NULL | NULL | NULL | NULL"
  - "0 | 0 | 0.0 | NULL"
answer: "0 | NULL | 0.0 | NULL"
explain: |
  With no rows, the counter stays at 0. `SUM` and `AVG` saw no value and answer "I don't know": `NULL`. `TOTAL` is SQLite's version that returns `0.0` in that case, handy when an empty sum should be zero. Notice too that, without `GROUP BY`, an aggregate **always** returns one row, even with no data.
```

```exercise
id: sql4-predice-suelta
type: predict
title: The bare column
prompt: |
  `to_phone` isn't in any `GROUP BY` or inside an aggregate. What does SQLite do?
code: |
  SELECT to_phone, MAX(amount)
  FROM transfers
  WHERE from_phone = '959893795';
options:
  - "984486562 | 500.0"
  - "945534612 | 500.0"
  - "984486562 | 1350.0"
  - "Error: to_phone must appear in GROUP BY"
answer: "984486562 | 500.0"
explain: |
  Without `GROUP BY`, all the rows form a single group and one row comes out. SQLite accepts the bare column and, since there's a single `MAX`, takes it from the row with the maximum: the S/ 500 payment went to 984486562. With `SUM` or `AVG` instead of `MAX`, you'd get the phone from any row. PostgreSQL would reject the query.
```

```exercise
id: sql4-completa-puertas
type: complete
title: Friday's three gates
prompt: |
  Count how many card swipes there were at **each gate** on Friday the 13th. Show `gate` and the count as `swipes`, ordered by gate. Replace the `___`.
starter: |
  SELECT gate, ___ AS swipes
  FROM market_entries
  WHERE date(moment) = '2026-03-13'
  ___ gate
  ORDER BY gate;
solution: |
  SELECT gate, COUNT(*) AS swipes
  FROM market_entries
  WHERE date(moment) = '2026-03-13'
  GROUP BY gate
  ORDER BY gate;
hints:
  - Counting rows is `COUNT(*)`; one row per gate means grouping by gate.
tests:
  - name: swipes per gate on Friday, in order
    same: SELECT gate, COUNT(*) FROM market_entries WHERE moment >= '2026-03-13' AND moment < '2026-03-14' GROUP BY gate ORDER BY gate
    ordered: true
  - name: the columns are called gate and swipes
    columns: [gate, swipes]
```

```exercise
id: sql4-arregla-having
type: fix
title: The phones that receive the most
prompt: |
  This query wants the phones that received **15 or more payments** in March, from most to fewest (and by number on ties). But SQLite answers with an error. Read it, think about when each part runs, and fix it.
visual:
  figure:
    title: When each filter runs
    panes:
      - label: WHERE
        value: "row by row, before grouping: there's no COUNT yet"
      - label: HAVING
        value: "group by group, after GROUP BY: now there's a COUNT"
starter: |
  SELECT to_phone, COUNT(*) AS received
  FROM transfers
  WHERE COUNT(*) >= 15
  GROUP BY to_phone
  ORDER BY received DESC, to_phone;
solution: |
  SELECT to_phone, COUNT(*) AS received
  FROM transfers
  GROUP BY to_phone
  HAVING COUNT(*) >= 15
  ORDER BY received DESC, to_phone;
hints:
  - "`WHERE` looks at single rows, and a row has no `COUNT`. A condition on the group goes in `HAVING`, after `GROUP BY`."
tests:
  - name: the phones with 15 or more payments, in order
    same: SELECT to_phone, COUNT(*) FROM transfers GROUP BY to_phone HAVING COUNT(*) >= 15 ORDER BY 2 DESC, 1
    ordered: true
  - name: uses HAVING
    source: '\bHAVING\b'
```

```exercise
id: sql4-escribe-dias
type: write
title: Three days of calls
prompt: |
  For **Thursday 12, Friday 13 and Saturday 14 March**, show one row per day with the day as `day`, how many calls there were as `calls` and how many of them **weren't answered** (duration 0) as `missed`. Order by day.
starter: |
  SELECT started, duration_s
  FROM calls
  WHERE started BETWEEN '2026-03-12' AND '2026-03-15'
  ORDER BY started;
solution: |
  SELECT date(started) AS day,
         COUNT(*) AS calls,
         SUM(CASE WHEN duration_s = 0 THEN 1 ELSE 0 END) AS missed
  FROM calls
  WHERE date(started) BETWEEN '2026-03-12' AND '2026-03-14'
  GROUP BY date(started)
  ORDER BY day;
hints:
  - "Group by `date(started)`: that way every call on the same day falls into the same group."
  - "To count only some of a group's rows, add a 1 for each one that matches: `SUM(CASE WHEN duration_s = 0 THEN 1 ELSE 0 END)`."
tests:
  - name: one row per day, with calls and missed
    same: SELECT date(started), COUNT(*), SUM(duration_s = 0) FROM calls WHERE started >= '2026-03-12' AND started < '2026-03-15' GROUP BY 1 ORDER BY 1
    ordered: true
  - name: the columns are called day, calls and missed
    columns: [day, calls, missed]
  - name: groups with GROUP BY
    source: '\bGROUP\s+BY\b'
```

```exercise
id: sql4-escribe-recorrido
type: write
title: Each person's route
prompt: |
  For each of the five people who left through Gate 3 on Friday (731, 905, 1046, 412 and 377), show their `person_id`, how many times they swiped that day as `swipes` and **all their times in a single column**, joined with `' → '`, as `route` (for example `21:58:03 → 22:46:12`). Order by `person_id`.
starter: |
  SELECT person_id, moment
  FROM market_entries
  WHERE person_id IN (731, 905, 1046, 412, 377)
  ORDER BY person_id, moment;
solution: |
  SELECT person_id,
         COUNT(*) AS swipes,
         group_concat(time(moment), ' → ') AS route
  FROM market_entries
  WHERE person_id IN (731, 905, 1046, 412, 377)
    AND date(moment) = '2026-03-13'
  GROUP BY person_id
  ORDER BY person_id;
hints:
  - "`time(moment)` gives just the time; `group_concat(…, ' → ')` joins them inside each group."
  - Don't forget to keep only Friday the 13th before grouping.
tests:
  - name: swipes and route for the five
    same: SELECT person_id, COUNT(*), group_concat(time(moment), ' → ') FROM market_entries WHERE person_id IN (731, 905, 1046, 412, 377) AND date(moment) = '2026-03-13' GROUP BY person_id ORDER BY person_id
    ordered: true
  - name: the columns are called person_id, swipes and route
    columns: [person_id, swipes, route]
```

## The case

```exercise
id: sql4-caso-llamadas
type: case
title: Who Renzo was talking to
prompt: |
  **Who did Renzo talk to most often between Thursday 12 and Saturday 14 March?** Type the full name.

  In `calls`, Renzo can be the `caller` (he called) or the `callee` (he was called). You need three steps: Renzo's phone (id 731) in `people`; his calls on those three days grouped by **the other number**, counted and sorted from most to fewest; and the name of whoever owns the winning number.

  Careful: over the whole of March, Renzo talks a lot with someone else. The question is only about those three days.
visual:
  - setting:
      case: surquillo
  - schema:
      tables: [people, calls]
starter: |
  -- Step 1: Renzo's phone
  SELECT name, phone
  FROM people
  WHERE id = 731;

  -- Step 2: his calls from the 12th to the 14th, grouped by the other number
  -- Step 3: who owns the number that comes up most
solution: |
  SELECT phone FROM people WHERE id = 731;

  SELECT CASE WHEN caller = '984486562' THEN callee ELSE caller END AS other,
         COUNT(*) AS calls,
         SUM(duration_s) AS seconds
  FROM calls
  WHERE (caller = '984486562' OR callee = '984486562')
    AND date(started) BETWEEN '2026-03-12' AND '2026-03-14'
  GROUP BY other
  ORDER BY calls DESC;

  SELECT name FROM people WHERE phone = '959893795';
answer: Tito Vílchez Arias
answerLabel: Who did he talk to most? (full name)
reveal: |
  **Tito Vílchez Arias**, a trader from La Victoria: **four calls** in three days. Nobody else gets past one. And one of them is at **22:52 on Friday**, six minutes after Renzo went out through Gate 3. Over the whole month, the person who talks most with Renzo is Teresa Lozano, an electrician from Surquillo: without the date filter, the wrong group wins.
hints:
  - "The other number is `callee` when Renzo called and `caller` when he was called: `CASE WHEN caller = '984486562' THEN callee ELSE caller END`. Group by that expression (or by its alias)."
  - "Mind the brackets: `(caller = '…' OR callee = '…') AND date(started) BETWEEN '2026-03-12' AND '2026-03-14'`. Without them, `AND` goes first and calls from other days slip in."
```

## The judge

```exercise
id: sql4-juez-ventas
type: judge
title: Each day's sales
prompt: |
  **For each stall and each day, return the stall, the day, how many sales there were and what they added up to; only the days on which the stall reached S/ 100 or more; ordered by day and then by stall.**

  The traders' association wants to know which stalls have good days. Each sale has its moment; sometimes the till didn't record the amount (`NULL`): that sale **counts** as a sale, but adds nothing.

  **Table:** `sales(stall, moment, amount)`, with `moment` as `'YYYY-MM-DD HH:MM:SS'`.

  **Result:** `stall`, the day (`'YYYY-MM-DD'`), the number of sales and the sum of the amounts, in that order.
schema: |
  CREATE TABLE sales (stall INTEGER, moment TEXT, amount REAL);
ordered: true
starter: |
  SELECT stall, moment, amount
  FROM sales
  ORDER BY moment;
solution: |
  SELECT stall,
         date(moment) AS day,
         COUNT(*) AS sales_count,
         SUM(amount) AS total
  FROM sales
  GROUP BY stall, date(moment)
  HAVING SUM(amount) >= 100
  ORDER BY day, stall;
hints:
  - "One group per stall and per day: `GROUP BY stall, date(moment)`."
  - "The condition is on the group's sum, so it goes in `HAVING`. And `COUNT(*)` also counts sales without an amount; `COUNT(amount)` doesn't."
samples:
  - rows:
      sales: [[47, "2026-03-13 08:15:00", 60], [12, "2026-03-13 09:02:00", 35], [47, "2026-03-13 17:40:00", 45], [12, "2026-03-13 18:30:00", 20]]
    note: "Stall 47 adds up to 105 on Friday and gets in; stall 12 adds up to 55 and stays out."
  - rows:
      sales: [[12, "2026-03-14 07:30:00", 80], [12, "2026-03-14 11:00:00", null], [12, "2026-03-14 19:10:00", 20], [3, "2026-03-13 10:00:00", 150]]
    note: "The sale without an amount counts (3 sales) but adds nothing (100). Exactly 100 gets in too."
edge:
  - rows: { sales: [] }
    tag: with no sales
  - rows: { sales: [[58, "2026-03-15 09:00:00", null], [58, "2026-03-15 10:00:00", null]] }
    tag: a day when the till recorded no amounts
  - rows: { sales: [[47, "2026-03-13 23:59:59", 70], [47, "2026-03-14 00:00:00", 70], [47, "2026-03-14 00:30:00", 40]] }
    tag: sales around midnight
random:
  count: 40
  seed: 404
  generate: |
    const two = (x) => String(x).padStart(2, "0");
    const n = rng.int(0, 24);
    const rows = [];
    for (let i = 0; i < n; i++) {
      const amount = rng.chance(0.12) ? null : rng.pick([rng.int(5, 60), rng.int(5, 60) + 0.5, 100, 50]);
      rows.push([rng.pick([3, 12, 47, 58]), `2026-03-${two(rng.int(12, 14))} ${two(rng.int(6, 23))}:${two(rng.int(0, 59))}:00`, amount]);
    }
    return { sales: rows };
wrong:
  - |
    SELECT stall, date(moment) AS day, COUNT(*), SUM(amount) FROM sales WHERE amount >= 100 GROUP BY stall, date(moment) ORDER BY day, stall;
  - |
    SELECT stall, date(moment) AS day, COUNT(amount), SUM(amount) FROM sales GROUP BY stall, date(moment) HAVING SUM(amount) >= 100 ORDER BY day, stall;
  - |
    SELECT stall, date(moment) AS day, COUNT(*), SUM(amount) FROM sales GROUP BY stall, date(moment) HAVING SUM(amount) > 100 ORDER BY day, stall;
  - |
    SELECT stall, date(moment) AS day, COUNT(*), SUM(amount) FROM sales GROUP BY stall, moment HAVING SUM(amount) >= 100 ORDER BY day, stall;
  - |
    SELECT stall, date(moment) AS day, COUNT(*), SUM(amount) FROM sales GROUP BY stall HAVING SUM(amount) >= 100 ORDER BY day, stall;
```

## Final mission

```exercise
id: sql4-mision-culpable
type: mission
title: Follow the money
prompt: |
  **Find the pairs of phones (who pays and who receives) that moved more than S/ 1000 between Friday 13 and Sunday 15 March.** Show `from_phone`, `to_phone`, how many payments there were as `payments` and the sum as `total`. Then say who received that money.

  The query below looks for payments over S/ 1000 on those days and finds none: nobody sent that much at once. But several small payments between the same two people can add up to a lot.

  When the query proves it and you answer, together with the judge, session 5 opens.
visual:
  - setting:
      case: surquillo
  - figure:
      title: One by one, or added up
      panes:
        - label: "WHERE amount > 1000"
          value: "looks at each payment alone: none gets through"
        - label: "GROUP BY pair + HAVING SUM(amount) > 1000"
          value: "adds up each pair's payments, then compares"
  - figure:
      title: "Friday the 13th, hour by hour"
      timeline:
        - when: "Fri 19:30"
          title: "Wayra is left charging"
          text: "Carmen leaves her at stall 47."
          by: "sql1-caso-denuncia"
        - when: "22:41"
          title: "The gyroscope stops responding"
          text: "The last reading is at 22:41:07."
          by: "sql1-caso-denuncia"
        - when: "≈ 22:45"
          title: "Marleny sees someone leave"
          text: "A hooded person with a toolbox gets into a white car."
          by: "sql2-caso-entrevista"
        - when: "22:46"
          title: "Renzo swipes out"
          text: "Gate 3. He will later say he left at 23:10."
          by: "sql1-mision-salidas"
        - when: "22:48"
          title: "The camera reads his plate"
          text: "CAM-SUR-03: b7r415, Renzo's car. Lucía passes at 23:14 and Julio at 23:23."
          by: "sql3-mision-camara"
        - when: "22:52"
          title: "Renzo calls Tito Vílchez"
          text: "Six minutes after leaving."
          by: "sql4-caso-llamadas"
          now: true
        - when: "Sat 14 and Sun 15"
          title: "Tito pays Renzo"
          text: "Three payments adding up to S/ 1350."
          by: "sql4-mision-culpable"
          now: true
starter: |
  SELECT from_phone, to_phone, amount, moment
  FROM transfers
  WHERE moment BETWEEN '2026-03-13' AND '2026-03-15 23:59:59'
    AND amount > 1000;
solution: |
  SELECT from_phone, to_phone,
         COUNT(*) AS payments,
         SUM(amount) AS total
  FROM transfers
  WHERE moment BETWEEN '2026-03-13' AND '2026-03-15 23:59:59'
  GROUP BY from_phone, to_phone
  HAVING SUM(amount) > 1000;

  -- Whose number receives it?
  SELECT name FROM people WHERE phone = '984486562';
answer: Renzo Huamaní Cárdenas
answerLabel: Who received the money? (full name)
reveal: |
  **Renzo Huamaní Cárdenas.** Between Friday and Sunday, a single pair goes over a thousand soles: **Tito Vílchez paid Renzo S/ 1350 in three parts**, on Saturday the 14th at 11:05 ("spare part"), that same day at 18:40 and on Sunday the 15th ("the rest"). Tito's other payments don't reach S/ 200.

  It all fits: Renzo knew how to open a robot, went out through Gate 3 at 22:46 with a toolbox, lied about the time and called Tito at 22:52. The next day he collected the price of a gyroscope. **Case SUR-0314 closed.** Wayra got its gyroscope back from a stall in La Victoria.
hints:
  - "First the days, with `WHERE`; then one group per pair: `GROUP BY from_phone, to_phone`. The condition on the sum goes in `HAVING SUM(amount) > 1000`."
  - "Whose is the receiving number? You looked it up in the case, or ask `people`."
tests:
  - name: the pairs that add up to more than S/ 1000
    same: SELECT from_phone, to_phone, COUNT(*), SUM(amount) FROM transfers WHERE moment >= '2026-03-13' AND moment < '2026-03-16' GROUP BY from_phone, to_phone HAVING SUM(amount) > 1000
  - name: the columns are called from_phone, to_phone, payments and total
    columns: [from_phone, to_phone, payments, total]
  - name: filters the groups with HAVING
    source: '\bHAVING\b'
```

## Expert challenge

```exercise
id: sql4-reto-horas
type: challenge
title: Gate 3, hour by hour
prompt: |
  **For each hour of Friday the 13th at Gate 3, show the hour (`'05'`, `'06'`…) as `hour`, how many card swipes there were as `swipes`, how many distinct people as `people_count`, how many were entries as `entries` and how many were exits as `exits`.** Order by hour.

  For people who already code: it's a pivot table in a single pass. Count "only some rows" by adding up a `CASE` worth 1 or 0. And compare `swipes` with `people_count`: where they differ, the reader counted a card twice (or someone went in and out in the same hour).
starter: |
  SELECT moment, person_id, direction
  FROM market_entries
  WHERE gate = 3
  ORDER BY moment;
solution: |
  SELECT strftime('%H', moment) AS hour,
         COUNT(*) AS swipes,
         COUNT(DISTINCT person_id) AS people_count,
         SUM(CASE WHEN direction = 'in' THEN 1 ELSE 0 END) AS entries,
         SUM(CASE WHEN direction = 'out' THEN 1 ELSE 0 END) AS exits
  FROM market_entries
  WHERE gate = 3 AND date(moment) = '2026-03-13'
  GROUP BY hour
  ORDER BY hour;
hints:
  - "`strftime('%H', moment)` gives the hour with two digits; group by that."
  - "`COUNT(DISTINCT person_id)` doesn't count the same person twice; `SUM(CASE WHEN direction = 'in' THEN 1 ELSE 0 END)` counts only the entries."
tests:
  - name: one row per hour with the five counts
    same: SELECT strftime('%H', moment), COUNT(*), COUNT(DISTINCT person_id), SUM(direction = 'in'), SUM(direction = 'out') FROM market_entries WHERE gate = 3 AND moment >= '2026-03-13' AND moment < '2026-03-14' GROUP BY 1 ORDER BY 1
    ordered: true
  - name: columns hour, swipes, people_count, entries and exits
    columns: [hour, swipes, people_count, entries, exits]
```
