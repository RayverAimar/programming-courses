# Session 2 — Filters, NULL and DISTINCT

```session
case: surquillo
```

## The job

Sunday 15 March. On Loop's case board there are five person numbers: **731, 905, 1046, 412 and 377**, the five exits through Gate 3 after Wayra's gyroscope stopped responding. Five suspects are too many for the police. Chasqui found that the guard, **Marleny Quispe**, gave a statement on Saturday: it's in the `interviews` table, word for word.

Today you'll filter more precisely: several conditions at once, lists of values, text that looks alike, and SQL's most treacherous value, the one that means **"we don't know"**: `NULL`.

```setting
case: surquillo
title: What we have so far
caption: "Session 1's clues are already on the map. Today's appear when you solve the case and the mission."
```

```dossier
title: What we know about the five
cards:
  - name: "731"
    kind: unknown
    rows: [["Went out", "22:46:12"]]
  - name: "905"
    kind: unknown
    rows: [["Went out", "22:58:40"]]
  - name: "1046"
    kind: unknown
    rows: [["Went out", "23:04:05"]]
  - name: "412"
    kind: unknown
    rows: [["Went out", "23:12:51"]]
  - name: "377"
    kind: unknown
    rows: [["Went out", "23:21:30"]]
```

## The minimum

`WHERE` takes any condition that comes out true or false. Today you get five more tools:

- **`AND`, `OR`, `NOT`**, with brackets. `AND` is evaluated **before** `OR`, like multiplication before addition.
- **`IN (…)`**: `person_id IN (731, 905, 1046)` is the same as three `=` joined with `OR`, but reads better.
- **`BETWEEN a AND b`**: between `a` and `b`, **both ends included**.
- **`LIKE`** matches a pattern: `%` is "any number of characters" and `_` is "exactly one". `name LIKE 'Marleny%'` finds every Marleny. In SQLite, `LIKE` ignores case, but only for letters without accents: `'ó'` and `'Ó'` are different.
- **`DISTINCT`** removes repeated rows from the result.

```figure
title: "What each pattern finds"
table:
  head: ["pattern", "matches", "doesn't match"]
  rows:
    - ["`'Marleny%'`", "Marleny, Marleny Quispe", "Ana Marleny (something comes before)"]
    - ["`'M_rleny'`", "Marleny, Merleny", "Mrleny (a character is missing), Marleny Quispe"]
    - ["`'%47%'`", "Stall 47, 47, Unit 4700", "Stall 4 7"]
```

```sql run
SELECT name, district, phone
FROM people
WHERE name LIKE 'marleny%'
  AND district IN ('Surquillo', 'Miraflores', 'Barranco')
ORDER BY name;
```

### NULL: "we don't know"

In the `vehicles` table, some colours are empty: nobody recorded them. That's `NULL`. It isn't zero, or empty text: it's **an unknown value**. And with an unknown, comparisons are unknown too: `color = 'white'` is neither true nor false when `color` is `NULL`, it's **`NULL`**. SQL has **three-valued logic**:

```logic
title: True, false and unknown
caption: "`WHERE` only lets through the rows where the condition is **TRUE**. Those that come out FALSE **or NULL** go."
```

That's why, to ask about missing data, you use **`IS NULL`** (or `IS NOT NULL`), never `= NULL`. See how many cars each condition finds:

```sql run
SELECT 'white' AS label, count(*) FROM vehicles
WHERE color = 'white'
UNION ALL
SELECT 'not white', count(*) FROM vehicles
WHERE color <> 'white'
UNION ALL
SELECT 'IS NULL', count(*) FROM vehicles
WHERE color IS NULL
UNION ALL
SELECT 'all', count(*) FROM vehicles;
```

`count(*)` counts rows (you'll meet it properly in session 4) and `UNION ALL` stacks several results. Add them up: the white ones plus the not-white ones **don't** make the total. The missing ones are exactly those with a `NULL` colour: they're neither white nor not white, they're unknown.

```result
title: The cars of the five who went out
query: |
  SELECT person_id, plate, color
  FROM vehicles
  WHERE person_id IN (731, 905, 1046, 412, 377);
caption: "Four cars for five people. Person 377's has no colour: `WHERE color = 'white'` would drop it, but we don't know whether it's white."
```

```figure
title: "Why `3 NOT IN (1, 2, NULL)` returns nothing"
table:
  head: ["step", "becomes"]
  rows:
    - ["`3 <> 1`", "TRUE"]
    - ["`3 <> 2`", "TRUE"]
    - ["`3 <> NULL`", "NULL (unknown)"]
    - ["The three joined with `AND`", "**NULL**: the row fails the `WHERE`"]
```

> **Common trap:** `NOT IN` with a `NULL` in the list returns **nothing**. `3 NOT IN (1, 2, NULL)` means `3 <> 1 AND 3 <> 2 AND 3 <> NULL`, and the last one is `NULL`, so the whole thing is `NULL`. If the list comes from a column that may have gaps, remove them first (`WHERE … IS NOT NULL`) or use `NOT EXISTS`, which you'll see in session 7.

<!-- legacy: is-null -->

<!-- mdn: is-null -->

## Practice

```exercise
id: sql2-predice-precedencia
type: predict
title: AND before OR
prompt: |
  In SQLite, `1` is true and `0` is false. What does it return?
code: |
  SELECT 1 OR 0 AND 0, (1 OR 0) AND 0;
options:
  - "1 | 0"
  - "0 | 0"
  - "1 | 1"
  - "0 | 1"
answer: "1 | 0"
explain: |
  `AND` goes first: `1 OR (0 AND 0)` is `1 OR 0`, true. Brackets change the order: `(1 OR 0) AND 0` is `1 AND 0`, false. Whenever you mix `AND` and `OR`, always use brackets.
```

```exercise
id: sql2-predice-null
type: predict
title: Comparing with the unknown
prompt: |
  What does each column return?
code: |
  SELECT NULL = NULL, NULL IS NULL, 5 <> NULL, NULL OR 1, NULL AND 0;
options:
  - "NULL | 1 | NULL | 1 | 0"
  - "1 | 1 | 1 | 1 | 0"
  - "0 | 1 | 1 | 1 | 0"
  - "NULL | 1 | NULL | NULL | NULL"
answer: "NULL | 1 | NULL | 1 | 0"
explain: |
  Two unknowns can't be compared: `NULL = NULL` is `NULL`, and so is `5 <> NULL`. `IS NULL` does answer: 1. But `NULL OR 1` is true (whatever it is, one true is enough) and `NULL AND 0` is false (one false is enough). It's the table above.
```

```exercise
id: sql2-predice-notin
type: predict
title: The NULL that sneaks into the list
prompt: |
  What does it return?
code: |
  SELECT 3 NOT IN (1, 2), 3 NOT IN (1, 2, NULL), 1 IN (1, NULL);
options:
  - "1 | NULL | 1"
  - "1 | 1 | 1"
  - "1 | 0 | NULL"
  - "1 | NULL | NULL"
answer: "1 | NULL | 1"
explain: |
  `3 NOT IN (1, 2, NULL)` asks whether 3 differs from 1, from 2 **and** from an unknown: we can't tell, `NULL`. In a `WHERE`, that row would go. But `1 IN (1, NULL)` finds the 1 and is already true.
```

```exercise
id: sql2-completa-in
type: complete
title: Two districts' cameras
prompt: |
  List the **code** of the cameras in **Surquillo and Barranco**, sorted by code, using `IN`. Replace the `___`.
starter: |
  SELECT code
  FROM cameras
  WHERE district ___ (___, ___)
  ORDER BY code;
solution: |
  SELECT code
  FROM cameras
  WHERE district IN ('Surquillo', 'Barranco')
  ORDER BY code;
hints:
  - "`IN` is followed by a list in brackets, separated by commas."
tests:
  - name: Surquillo's and Barranco's cameras, sorted
    same: SELECT code FROM cameras WHERE district IN ('Surquillo', 'Barranco') ORDER BY code
    ordered: true
  - name: uses IN
    source: '\bIN\s*\('
```

```exercise
id: sql2-arregla-null
type: fix
title: The colourless cars
prompt: |
  The police asked for the **plates of the cars with no colour on record**, sorted. This query returns no rows, though there are quite a few. Fix it.
starter: |
  SELECT plate
  FROM vehicles
  WHERE color = NULL
  ORDER BY plate;
solution: |
  SELECT plate
  FROM vehicles
  WHERE color IS NULL
  ORDER BY plate;
hints:
  - "`color = NULL` is always `NULL`, never true."
tests:
  - name: the colourless plates, sorted
    same: SELECT plate FROM vehicles WHERE color IS NULL ORDER BY plate
    ordered: true
```

```exercise
id: sql2-arregla-parentesis
type: fix
title: Surquillo's thefts and frauds
prompt: |
  This query should bring the `id`, `kind` and `district` of the reports of **theft or fraud in Surquillo**. But thefts from all over Lima show up. Run it, look at the `district` column and fix it.
starter: |
  SELECT id, kind, district
  FROM reports
  WHERE kind = 'theft' OR kind = 'fraud' AND district = 'Surquillo'
  ORDER BY id;
solution: |
  SELECT id, kind, district
  FROM reports
  WHERE (kind = 'theft' OR kind = 'fraud') AND district = 'Surquillo'
  ORDER BY id;
hints:
  - "`AND` runs before `OR`: the query says «theft anywhere, or fraud in Surquillo»."
  - "Brackets around the `OR`, or `kind IN ('theft', 'fraud')`."
tests:
  - name: only Surquillo's thefts and frauds
    same: SELECT id, kind, district FROM reports WHERE kind IN ('theft', 'fraud') AND district = 'Surquillo' ORDER BY id
    ordered: true
```

```exercise
id: sql2-escribe-like
type: write
title: Surquillo's guards
prompt: |
  List the **name** and **phone** of the people in **Surquillo** who work as a **security guard** and whose name **starts with M or D**, sorted by name. Use `LIKE`.
starter: |
  SELECT name, phone
  FROM people
  WHERE district = 'Surquillo';
solution: |
  SELECT name, phone
  FROM people
  WHERE district = 'Surquillo'
    AND occupation = 'security guard'
    AND (name LIKE 'M%' OR name LIKE 'D%')
  ORDER BY name;
hints:
  - "`name LIKE 'M%'`: starts with M, then anything."
  - The two name options go with `OR`, in brackets, because the rest goes with `AND`.
tests:
  - name: the guards with M or D, sorted
    same: SELECT name, phone FROM people WHERE district = 'Surquillo' AND occupation = 'security guard' AND (name LIKE 'M%' OR name LIKE 'D%') ORDER BY name
    ordered: true
  - name: uses LIKE
    source: '\bLIKE\b'
```

```exercise
id: sql2-escribe-distinct
type: write
title: What happened in Surquillo on Friday
prompt: |
  Which **kinds** of report were filed in **Surquillo on Friday 13 March**? Return each kind **only once**, in alphabetical order.
starter: |
  SELECT kind
  FROM reports
  WHERE district = 'Surquillo';
solution: |
  SELECT DISTINCT kind
  FROM reports
  WHERE district = 'Surquillo' AND report_date = '2026-03-13'
  ORDER BY kind;
hints:
  - "`SELECT DISTINCT kind` removes the repeats."
tests:
  - name: each kind once, in order
    same: SELECT DISTINCT kind FROM reports WHERE district = 'Surquillo' AND report_date = '2026-03-13' ORDER BY kind
    ordered: true
```

## The case

```exercise
id: sql2-caso-entrevista
type: case
title: What Marleny saw
prompt: |
  **Find Marleny Quispe's statement in `interviews` and read it: what colour was the car the person got into?**

  The `interviews` table has `person_id`, `interview_date`, `case_code` and `transcript`. It doesn't have the name: first find Marleny's `id` in `people` (with `LIKE`, since you don't know her full name), then her interview. Another way: search the transcripts for those that mention **Gate 3**.
visual:
  dossier:
    cards:
      - name: Marleny Quispe Apaza
        traits: { style: cap, capColor: "#2f3a4a", shirt: "#2f3a4a" }
        role: The market's night guard
        rows: [["Shift", "19:55 to 06:05"], ["Round", "every half hour"]]
        quote: "I saw it all from aisle F."
starter: |
  -- Step 1: Marleny's id.
  SELECT id, name
  FROM people
  WHERE name = 'Marleny';
solution: |
  SELECT person_id, interview_date, transcript
  FROM interviews
  WHERE transcript LIKE '%Gate 3%';
answer: white
answerLabel: What colour was the car?
reveal: |
  **White.** Marleny saw someone with a hood and a toolbox leave at about 22:45 and get into a white car. She didn't see the plate. Now let's see which cars the five own.
hints:
  - "`WHERE name = 'Marleny'` looks for someone called exactly that. Try `name LIKE 'Marleny%'`."
  - "With her `id`: `SELECT transcript FROM interviews WHERE person_id = …`. Or straight away: `WHERE transcript LIKE '%Gate 3%'`."
```

## The judge

As in session 1: your query runs on the example tables and on hidden databases. This judge is about `NULL`, so the hidden cases are full of gaps.

```exercise
id: sql2-juez-solo-correo
type: judge
title: Email only
prompt: |
  **Return the `id` and `name` of the customers who can only be reached by email: they have no phone but do have an email. Sort by `id`.**

  Loop is going to tell its customers that Wayra is being repaired. The data comes from an old form: a missing value may be stored as `NULL` **or as empty text** `''`. Both count as "none".

  **Table:** `customers(id, name, phone, email)`.

  **Result:** `id` and `name`, sorted by `id`.
schema: |
  CREATE TABLE customers (id INTEGER, name TEXT, phone TEXT, email TEXT);
ordered: true
starter: |
  SELECT id, name
  FROM customers
  WHERE phone = NULL
  ORDER BY id;
solution: |
  SELECT id, name
  FROM customers
  WHERE (phone IS NULL OR phone = '')
    AND email IS NOT NULL AND email <> ''
  ORDER BY id;
hints:
  - "«No phone» is two cases: `phone IS NULL` or `phone = ''`."
  - "`email <> ''` is already `NULL` when the email is `NULL`, so that alone would do; writing `IS NOT NULL` too makes it clear."
samples:
  - rows:
      customers: [[1, "Rosa", "987654321", "rosa@correo.pe"], [2, "Beto", null, "beto@correo.pe"], [3, "Nelly", "", "nelly@correo.pe"], [4, "Kike", null, null], [5, "Juana", null, ""]]
    note: Beto and Nelly have no phone (one NULL, one empty) and do have an email. Kike and Juana have neither.
  - rows:
      customers: [[7, "Tito", "912345678", null]]
    note: "Tito has a phone: he doesn't come out."
edge:
  - rows: { customers: [] }
    tag: with an empty table
  - rows: { customers: [[1, "A", "", ""], [2, "B", null, null]] }
    tag: with no contact details at all
  - rows: { customers: [[3, "C", "", "c@x.pe"], [1, "A", null, "a@x.pe"], [2, "B", "999", "b@x.pe"]] }
    tag: with the ids out of order
random:
  count: 40
  seed: 202
  generate: |
    const names = ["Rosa", "Beto", "Nelly", "Kike", "Juana", "Tito", "Pancho", "Mechita", "Lucho", "Carmen"];
    const n = rng.int(0, 12);
    const ids = [];
    while (ids.length < n) { const k = rng.int(1, 60); if (!ids.includes(k)) ids.push(k); }
    const blank = () => rng.pick([null, "", null]);
    return { customers: ids.map((id) => [id, rng.pick(names), rng.int(0, 2) ? blank() : `9${rng.int(10000000, 99999999)}`, rng.int(0, 3) ? `${id}@correo.pe` : blank()]) };
wrong:
  - |
    SELECT id, name FROM customers WHERE phone IS NULL AND email IS NOT NULL ORDER BY id;
  - |
    SELECT id, name FROM customers WHERE (phone IS NULL OR phone = '') AND email IS NOT NULL ORDER BY id;
  - |
    SELECT id, name FROM customers WHERE phone IS NULL OR phone = '' AND email <> '' ORDER BY id;
```

## Final mission

```exercise
id: sql2-mision-autos
type: mission
title: Who could have got into a white car?
prompt: |
  **List the cars of the five who went out (731, 905, 1046, 412 and 377) that could be the white car Marleny saw: the white ones and the ones with no colour on record.** Show `person_id`, `plate` and `color`. Then say how many suspects are still standing.

  A car with no colour on record **can't be ruled out**: we don't know its colour. Someone with no car, or with a car of another colour, is ruled out.

  Once the query proves it and you answer, together with the judge, session 3 opens.
visual:
  - setting:
      case: surquillo
  - schema:
      tables: [vehicles]
starter: |
  SELECT person_id, plate, color
  FROM vehicles
  WHERE person_id IN (731, 905, 1046, 412, 377)
    AND color = 'white';
solution: |
  SELECT person_id, plate, color
  FROM vehicles
  WHERE person_id IN (731, 905, 1046, 412, 377)
    AND (color = 'white' OR color IS NULL);
answer: "3"
answerLabel: How many suspects are still standing?
reveal: |
  **Three:** Renzo Huamaní (731) and Lucía Paredes (412) have white cars, and Julio Ccahuana's (377) has no colour on record. Óscar (905) has no car and Fiorella's (1046) is red: ruled out. Look at the case board: they have names and faces now.
hints:
  - "The two possibilities go with `OR`, in brackets: `(color = 'white' OR color IS NULL)`."
tests:
  - name: the five's white or colourless cars
    same: SELECT person_id, plate, color FROM vehicles WHERE person_id IN (731, 905, 1046, 412, 377) AND (color = 'white' OR color IS NULL)
  - name: asks for the unknown colour with IS NULL
    source: '\bIS\s+NULL\b'
    msg: A missing colour is asked for with IS NULL.
```

## Expert challenge

```exercise
id: sql2-reto-descartados
type: challenge
title: Neither white nor red
prompt: |
  **Return the plates of every car that is certainly neither white nor red, and separately (in another query) those of the ones we can't know about.** Each query sorted by plate.

  For those who already code: it's the trap's `NOT IN` with `NULL`, the other way round. With `color NOT IN ('white', 'red')`, where do the `NULL`s go? Write both queries, one under the other; the judge looks for the unknowns and checks that the other one uses `NOT IN`.
starter: |
  -- Certainly neither white nor red:

  -- Can't know:
solution: |
  SELECT plate FROM vehicles
  WHERE color NOT IN ('white', 'red')
  ORDER BY plate;

  SELECT plate FROM vehicles
  WHERE color IS NULL
  ORDER BY plate;
hints:
  - "`color NOT IN ('white', 'red')` is `NULL` when the colour is `NULL`, so those rows already stay out: the first query is right as it is."
tests:
  - name: a query brings the unknown colours
    same: SELECT plate FROM vehicles WHERE color IS NULL ORDER BY plate
    ordered: true
  - name: the other one uses NOT IN
    source: '\bNOT\s+IN\s*\('
```
