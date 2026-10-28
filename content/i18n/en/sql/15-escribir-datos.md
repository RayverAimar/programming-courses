# Session 15 — INSERT, UPDATE and DELETE

```session
case: taller
```

## The job

Monday 6 April 2026. With four dossiers closed, Surquillo Municipality trusts Loop. **Edith Choque**, the Markets manager, calls early: the office that manages the licences of Market No. 1 runs on an old app that writes to a database, the **stall registry**, and she wants Loop to replace it. Until today you only read the database; from today **you write to it**.

That same morning, **Carmen** gets a strange notification: according to the municipality, stall 47, Loop's stall, **is no longer in her name**. She never signed anything. Before touching a single row you're going to learn to write data without breaking anything: an `UPDATE` without `WHERE` changes all 120 stalls in one go.

```setting
case: taller
title: The Markets Office, second floor of Market No. 1
caption: "Counter 1 (Alfredo) and counter 2 (Susana) serve the public; at the back, the registry server and the IT computer. Chasqui set up Loop's laptop on the table in the middle."
```

```dossier
title: Who receives you
cards:
  - name: Edith Choque Ramos
    traits: { style: bun, hair: "#7a7a7a", shirt: "#c43f84" }
    role: Markets manager, Surquillo Municipality
    quote: "The registry is the law of the market: if it says the stall is yours, it's yours."
  - name: Carmen Ríos Llanos
    traits: { style: bun, shirt: "#3f7cc4", glasses: true }
    role: Loop technician, stall 47
    quote: "A transfer? I haven't transferred anything. I've worked that stall for five years."
  - name: Chasqui
    kind: chasqui
    role: Loop's assistant detective
    quote: "Until now we were only looking. Today, if we get it wrong, the mistake stays saved."
```

```figure
title: "Who's who in the office"
table:
  head: ["person", "user", "counter", "computer"]
  rows:
    - ["Alfredo Benavides", "abenavides", "counter 1", "VENT-1"]
    - ["Susana Salazar", "ssalazar", "counter 2", "VENT-2"]
    - ["Delia Lozano", "dlozano", "IT", "SIS-01"]
caption: "Each person writes to the registry with their own user from their own computer. This is the table you will cross with the session log."
```

## The minimum

Reading changes nothing; writing does. SQL has three statements for changing rows, and all three look like a `SELECT`:

```schema
title: The registry and its filings
tables: [stall_registry, filings, people]
caption: "`stall_registry` has one row per stall: its holder, its licence and when it expires. `filings` keeps what was requested at the counters."
```

- **`INSERT INTO table (col1, col2) VALUES (v1, v2), (v3, v4);`** adds rows. Columns you don't name stay `NULL` (or take their `DEFAULT`). You can also insert the result of a query: `INSERT INTO t (a, b) SELECT x, y FROM … WHERE …`.
- **`UPDATE table SET col = expression, other = … WHERE condition;`** changes the rows that meet the `WHERE`. The expression can use the old value: `SET fee = fee * 1.1`.
- **`DELETE FROM table WHERE condition;`** deletes the rows that meet the `WHERE`.
- **Without `WHERE`, `UPDATE` and `DELETE` touch every row.** The habit that saves careers: first write `SELECT * FROM table WHERE …`, look at which rows come out, and only then swap `SELECT *` for `UPDATE … SET …` or `DELETE`.
- **`RETURNING`** at the end of any of the three returns the rows it touched, like a `SELECT`: `DELETE FROM … WHERE … RETURNING id, stall;`.

Inside, the engine does the same as with a `SELECT`: it walks the table, evaluates the `WHERE` row by row and, for each row that passes, computes the new values and rewrites it. If **a single** row breaks a rule of the table, SQLite **undoes the whole statement**: changes are never left half done. Press ▶:

```change
title: Three statements on a tiny table
setup: |
  CREATE TABLE licenses (stall INTEGER PRIMARY KEY, holder TEXT NOT NULL, expires TEXT, fee REAL CHECK (fee >= 0));
  INSERT INTO licenses VALUES (12, 'Lucía', '2026-10-24', 120), (47, 'Carmen', '2026-03-31', 120), (58, 'Nelly', '2026-02-05', 90);
sql: |
  UPDATE licenses SET expires = '2027-03-31' WHERE stall = 47 RETURNING stall, expires;
  INSERT INTO licenses VALUES (121, 'Kike', '2027-01-15', 150), (47, 'Yolanda', '2026-03-31', 0);
  DELETE FROM licenses WHERE expires < '2026-04-06';
  UPDATE licenses SET fee = fee * 1.5;
expectError: true
notes:
  - "The `WHERE` lets only stall 47 through; its `expires` changes and `RETURNING` gives back the row as it ended up."
  - ""
  - "The `WHERE` finds a stall with an expired licence (58) and deletes it."
  - "**Without `WHERE`:** the two remaining rows pay 50% more. See how easy it is."
caption: "The second statement carries two rows: stall 121 was fine, but 47 already existed (it's the **primary key**). SQLite doesn't insert even the good one: the statement is **atomic**."
```

**A table's rules** are written when it is created, and the database enforces them on every `INSERT` and `UPDATE`:

| constraint | what it prevents |
|---|---|
| `PRIMARY KEY` | two rows with the same key (and in SQLite, `INTEGER PRIMARY KEY` is the `rowid`: it fills itself in) |
| `NOT NULL` | leaving the column empty |
| `UNIQUE` | two rows with the same value in that column |
| `CHECK (condition)` | a row that doesn't meet the condition, like `fee >= 0` |
| `REFERENCES other(id)` | pointing to a row that doesn't exist (**foreign key**) |
| `DEFAULT value` | (prevents nothing) the value used when you don't give one |

Two SQLite oddities worth knowing. Foreign keys **come switched off**: you have to turn them on in every connection with `PRAGMA foreign_keys = ON;`. And types are **flexible**: in an `INTEGER` column you can store `'twelve'` and SQLite accepts it as text. If you want strict types, as in PostgreSQL, create the table with **`STRICT`** at the end: `CREATE TABLE t (…) STRICT;`.

**UPSERT.** With a `UNIQUE` or `PRIMARY KEY` constraint, an `INSERT` that collides can turn into an `UPDATE`: `INSERT … ON CONFLICT (column) DO UPDATE SET col = excluded.col`. `excluded` is the row you were trying to insert. With `DO NOTHING`, the colliding row simply doesn't go in.

```sql run
SELECT sr.stall, p.name AS holder, sr.expires, sr.updated_at, sr.updated_by
FROM stall_registry sr
JOIN people p ON p.id = sr.holder_id
WHERE sr.stall BETWEEN 10 AND 14;
```

> **Common trap:** the `UPDATE` without `WHERE`. There's no "are you sure?": SQLite changes every row and tells you how many. An equally dangerous relative is the **stray semicolon**: `UPDATE t SET x = 1; WHERE id = 5;` is two statements, and the first, with no `WHERE`, has already run by the time the second errors. In a real database that doesn't undo itself: that's why next session you'll learn transactions.

<!-- legacy: upsert -->

<!-- legacy: foreign-keys -->

<!-- mdn: upsert foreign-keys -->

## Practice

```exercise
id: sql15-predice-sin-where
type: predict
title: The UPDATE without WHERE
db: empty
setup: |
  CREATE TABLE new_stalls (number INTEGER PRIMARY KEY, trade TEXT NOT NULL);
  INSERT INTO new_stalls VALUES (1, 'fruit'), (2, 'fish'), (3, 'fruit');
prompt: |
  The table `new_stalls` has three stalls: 1 and 3 sell fruit, 2 sells fish. What does the last `SELECT` return?
code: |
  UPDATE new_stalls SET trade = 'flowers';
  SELECT trade, COUNT(*) FROM new_stalls GROUP BY trade;
options:
  - "flowers | 3"
  - "flowers | 2\nfish | 1"
  - "flowers | 1\nfruit | 2"
  - "flowers | 0"
answer: "flowers | 3"
explain: |
  Without `WHERE`, the condition is "all rows": all three stalls start selling flowers, the fish one too. SQLite doesn't ask: it makes the change and counts 3 changed rows.
```

```exercise
id: sql15-predice-upsert
type: predict
title: Insert or update
db: empty
setup: |
  CREATE TABLE new_stalls (number INTEGER PRIMARY KEY, trade TEXT NOT NULL);
  INSERT INTO new_stalls VALUES (1, 'fruit'), (2, 'fish'), (3, 'fruit');
prompt: |
  Same table. What does it return?
code: |
  INSERT INTO new_stalls (number, trade)
  VALUES (2, 'chicken'), (4, 'bread')
  ON CONFLICT (number) DO UPDATE SET trade = excluded.trade;
  SELECT number, trade FROM new_stalls ORDER BY number;
options:
  - "1 | fruit\n2 | chicken\n3 | fruit\n4 | bread"
  - "1 | fruit\n2 | fish\n3 | fruit\n4 | bread"
  - "1 | fruit\n2 | fish\n2 | chicken\n3 | fruit\n4 | bread"
  - "1 | fruit\n2 | chicken\n3 | fruit"
answer: "1 | fruit\n2 | chicken\n3 | fruit\n4 | bread"
explain: |
  Stall 2 already existed: it collides with the primary key and, instead of failing, turns into an `UPDATE` with the trade of the row you were trying to insert (`excluded.trade`). Stall 4 doesn't collide and goes in normally.
```

```exercise
id: sql15-completa-alta
type: complete
title: A new stall
prompt: |
  The market opens **stall 121**, groceries, in the name of **Carmen Ríos** (person `58`). Its licence is `'LF-2026-0121'` and it expires on **31 March 2027**. Add it to the registry with status `'active'`, `updated_at` equal to `'2026-04-06 09:30:00'` and `updated_by` equal to `'loop'`, and finish with a `SELECT` that shows it. Replace each `___`.
starter: |
  INSERT INTO stall_registry (stall, holder_id, license, expires, status, updated_at, updated_by)
  VALUES (___, ___, 'LF-2026-0121', ___, 'active', '2026-04-06 09:30:00', 'loop');

  SELECT * FROM stall_registry WHERE stall = ___;
solution: |
  INSERT INTO stall_registry (stall, holder_id, license, expires, status, updated_at, updated_by)
  VALUES (121, 58, 'LF-2026-0121', '2027-03-31', 'active', '2026-04-06 09:30:00', 'loop');

  SELECT * FROM stall_registry WHERE stall = 121;
hints:
  - "Dates go as `'YYYY-MM-DD'` text; numbers go without quotes."
  - "You don't give the `id`: it's `INTEGER PRIMARY KEY`, so SQLite assigns the next one (121)."
tests:
  - name: stall 121 is in the registry, in the name of person 58
    db: SELECT COUNT(*) = 1 FROM stall_registry WHERE stall = 121 AND holder_id = 58 AND expires = '2027-03-31' AND license = 'LF-2026-0121'
  - name: you added just one row
    db: SELECT COUNT(*) FROM stall_registry
    equals: 121
  - name: the final SELECT shows the new stall
    rows: 1
```

```exercise
id: sql15-arregla-punto-coma
type: fix
title: The extra semicolon
prompt: |
  The app never updated the status of the licences. Edith asks to mark as `'expired'` the **active** licences that expired **before Monday 6 April**. This code tries, but it errors… and also leaves the registry worse than before. Run it, see how many rows the first statement changed, and fix it.
visual:
  figure:
    title: What the engine sees
    panes:
      - label: Statement 1
        text: "UPDATE stall_registry\nSET status = 'expired';"
      - label: Statement 2 (error)
        text: "WHERE expires < '2026-04-06'\n  AND status = 'active';"
starter: |
  UPDATE stall_registry
  SET status = 'expired';
  WHERE expires < '2026-04-06'
    AND status = 'active';
solution: |
  UPDATE stall_registry
  SET status = 'expired'
  WHERE expires < '2026-04-06'
    AND status = 'active';
hints:
  - "The `;` ends the statement. Everything after it is another statement, and a bare `WHERE …` means nothing."
tests:
  - name: nine licences become expired
    db: SELECT COUNT(*) FROM stall_registry WHERE status = 'expired'
    equals: 9
  - name: no licence that was still valid got marked expired
    db: SELECT COUNT(*) = 0 FROM stall_registry WHERE status = 'expired' AND expires >= '2026-04-06'
  - name: the suspended ones stay suspended
    db: SELECT COUNT(*) FROM stall_registry WHERE status = 'suspended'
    equals: 24
```

```exercise
id: sql15-escribe-tarifas
type: write
title: This year's fees
db: empty
setup: |
  CREATE TABLE fees (trade TEXT PRIMARY KEY, amount REAL NOT NULL CHECK (amount > 0));
  INSERT INTO fees VALUES ('fruit', 80), ('fish', 90), ('meat', 90), ('repairs', 70);
prompt: |
  Edith sends the new licence fees: **fish** goes to **95** and a new trade appears, **robotics**, at **150**. Write **a single** `INSERT` with `ON CONFLICT` that does both things (update the one that exists, insert the new one) and finish with `SELECT trade, amount FROM fees ORDER BY trade;`.
starter: |
  INSERT INTO fees (trade, amount)
  VALUES ('fish', 95), ('robotics', 150);

  SELECT trade, amount FROM fees ORDER BY trade;
solution: |
  INSERT INTO fees (trade, amount)
  VALUES ('fish', 95), ('robotics', 150)
  ON CONFLICT (trade) DO UPDATE SET amount = excluded.amount;

  SELECT trade, amount FROM fees ORDER BY trade;
hints:
  - "As it stands, the `INSERT` collides with `fish`, which already exists, and SQLite inserts neither row."
  - "`ON CONFLICT (trade) DO UPDATE SET amount = excluded.amount`: `excluded` is the row you were trying to put in."
tests:
  - name: fish costs 95 and robotics 150
    db: SELECT (SELECT amount FROM fees WHERE trade = 'fish') = 95 AND (SELECT amount FROM fees WHERE trade = 'robotics') = 150
  - name: the other trades don't change
    db: SELECT COUNT(*) FROM fees WHERE (trade, amount) IN (VALUES ('fruit', 80), ('meat', 90), ('repairs', 70))
    equals: 3
  - name: it uses ON CONFLICT
    source: '\bON\s+CONFLICT\b'
```

```exercise
id: sql15-escribe-pendientes
type: write
title: Clearing what nobody handled
prompt: |
  In `filings` there are filings with status `'pending'` since January. Edith decides to **delete the pending ones filed before 1 February 2026** and wants to see what was deleted: use `RETURNING` to return the `id`, the `stall`, the `kind` and the `filed_at` date of each one.

  Before deleting, write the `SELECT` with the same `WHERE` and look at what comes out.
starter: |
  SELECT id, stall, kind, filed_at
  FROM filings
  WHERE status = 'pending';
solution: |
  DELETE FROM filings
  WHERE status = 'pending'
    AND filed_at < '2026-02-01'
  RETURNING id, stall, kind, filed_at;
hints:
  - "`'2026-02-01'` is less than any moment in February and greater than all those in January."
  - "Swap `SELECT id, stall, kind, filed_at FROM` for `DELETE FROM` and put `RETURNING id, stall, kind, filed_at` at the end."
tests:
  - name: it returns the five deleted filings
    same: DELETE FROM filings WHERE status = 'pending' AND filed_at < '2026-02-01' RETURNING id, stall, kind, filed_at
  - name: no January pending filings are left
    db: SELECT COUNT(*) FROM filings WHERE status = 'pending' AND filed_at < '2026-02-01'
    equals: 0
  - name: the February pending ones are still there
    db: SELECT COUNT(*) FROM filings WHERE status = 'pending'
    equals: 9
```

## The case

```exercise
id: sql15-caso-titular
type: case
title: Whose is stall 47?
prompt: |
  **Look up stall 47 in the registry and find out whose name it is in today.** Write the full name.

  `stall_registry` keeps the `holder_id`; the name is in `people`. Also look at `updated_at` and `updated_by`: they say when the row last changed and who changed it.
visual:
  - setting:
      case: taller
  - schema:
      tables: [stall_registry, people]
starter: |
  SELECT *
  FROM stall_registry
  LIMIT 5;
solution: |
  SELECT sr.stall, p.name, sr.license, sr.expires, sr.updated_at, sr.updated_by
  FROM stall_registry sr
  JOIN people p ON p.id = sr.holder_id
  WHERE sr.stall = 47;
answer: Yolanda Ugarte Montes
answerLabel: Whose name is stall 47 in?
reveal: |
  **Yolanda Ugarte Montes.** The change was made on **Friday 20 at 18:52:40** with the user **abenavides**, the one from counter 1, and the licence is now `LF-2026-0047`. Carmen doesn't know Yolanda. And there's something else: Carmen's licence ran until 31 March… and for the registry it still does: it has already expired.
hints:
  - "Join the two tables: `JOIN people p ON p.id = sr.holder_id`."
  - "Filter with `WHERE sr.stall = 47`."
```

## The judge

```exercise
id: sql15-juez-precios
type: judge
title: The newest price wins
prompt: |
  **Merge the new prices into the price table: for each product, the price with the most recent date must remain, wherever it comes from.**

  Every morning the traders' association sends a list of reference prices. Sometimes the list has a price **older** than the one you already have (someone resent yesterday's message), and sometimes it has the same product **twice**. A product that wasn't there is added.

  **Tables:** `prices(product, price, price_date)` with `product` as the primary key, and `incoming(product, price, price_date)`, which may repeat products. Dates are `'YYYY-MM-DD'` and never repeat for the same product.

  **What is checked:** the contents of `prices` after your code.
schema: |
  CREATE TABLE prices (product TEXT PRIMARY KEY, price REAL, price_date TEXT);
  CREATE TABLE incoming (product TEXT, price REAL, price_date TEXT);
check: SELECT product, price, price_date FROM prices
starter: |
  INSERT INTO prices
  SELECT product, price, price_date FROM incoming;
solution: |
  INSERT INTO prices (product, price, price_date)
  SELECT product, price, price_date FROM incoming WHERE true
  ON CONFLICT (product) DO UPDATE
    SET price = excluded.price, price_date = excluded.price_date
    WHERE excluded.price_date > prices.price_date;
hints:
  - "`ON CONFLICT (product) DO UPDATE SET … WHERE excluded.price_date > prices.price_date` only updates if what arrives is newer."
  - "With `INSERT … SELECT … ON CONFLICT`, SQLite needs the `SELECT` to have a `WHERE` (even `WHERE true`), so it doesn't confuse the conflict's `ON` with a join's."
samples:
  - rows:
      prices: [["limón", 4.5, "2026-03-20"], ["papa", 2.2, "2026-03-20"]]
      incoming: [["limón", 5.0, "2026-03-23"], ["papa", 1.9, "2026-03-18"], ["ají", 6.0, "2026-03-23"]]
    note: "The lemon is updated; the potato price that arrives is from the 18th, older: the one from the 20th stays. The chili is new."
  - rows:
      prices: [["camote", 3.0, "2026-03-01"]]
      incoming: [["camote", 3.4, "2026-03-22"], ["camote", 3.2, "2026-03-21"]]
    note: "Two sweet potato prices arrive: the one from the 22nd wins, even though it comes first."
edge:
  - rows: { prices: [], incoming: [] }
    tag: with both tables empty
  - rows: { prices: [["choclo", 2.0, "2026-03-10"]], incoming: [] }
    tag: with no new prices
  - rows: { prices: [], incoming: [["olluco", 3.0, "2026-03-02"], ["olluco", 3.5, "2026-03-05"], ["olluco", 2.5, "2026-03-01"]] }
    tag: with a new product that arrives three times
random:
  count: 40
  seed: 1515
  generate: |
    const items = ["limón", "papa", "camote", "ají", "choclo", "olluco", "yuca", "palta", "tomate", "cebolla"];
    const prices = [], incoming = [];
    for (const it of items) {
      const days = [];
      while (days.length < 4) { const d = rng.int(1, 28); if (!days.includes(d)) days.push(d); }
      const dateOf = (d) => `2026-03-${String(d).padStart(2, "0")}`;
      const price = () => rng.int(10, 90) / 10;
      let k = 0;
      if (rng.chance(0.6)) prices.push([it, price(), dateOf(days[k++])]);
      const n = rng.int(0, 3);
      for (let i = 0; i < n; i++) incoming.push([it, price(), dateOf(days[k++])]);
    }
    for (let i = incoming.length - 1; i > 0; i--) { const j = rng.int(0, i); [incoming[i], incoming[j]] = [incoming[j], incoming[i]]; }
    return { prices, incoming };
wrong:
  - |
    INSERT INTO prices (product, price, price_date)
    SELECT product, price, price_date FROM incoming WHERE true
    ON CONFLICT (product) DO UPDATE SET price = excluded.price, price_date = excluded.price_date;
  - |
    INSERT OR REPLACE INTO prices (product, price, price_date)
    SELECT product, price, price_date FROM incoming;
  - |
    INSERT OR IGNORE INTO prices (product, price, price_date)
    SELECT product, price, price_date FROM incoming;
```

## Final mission

```exercise
id: sql15-mision-devolver
type: mission
title: Return the stalls
prompt: |
  **Give each stall back to its owner when its last transfer was requested by the beneficiary herself.** A transfer is requested by the seller, never by the one who receives: in `filings`, a legitimate transfer has `applicant_id` different from `new_holder_id`.

  Edith signed the order. For each stall with such a transfer:
  - `holder_id` goes back to the owner listed in `stalls` (the traders' association list, `stalls.person_id`, joined by `stalls.number = stall_registry.stall`);
  - `updated_at` becomes `'2026-04-06 10:00:00'` and `updated_by` becomes `'loop'`.

  Do it with **a single `UPDATE`** and finish with `RETURNING stall, holder_id`. Then write how many stalls you returned.
visual:
  - setting:
      case: taller
  - schema:
      tables: [stall_registry, filings, stalls]
starter: |
  -- First look at the suspicious transfers:
  SELECT stall, applicant_id, new_holder_id, clerk, filed_at, fee
  FROM filings
  WHERE kind = 'transfer';
solution: |
  UPDATE stall_registry
  SET holder_id = (SELECT p.person_id FROM stalls p WHERE p.number = stall_registry.stall),
      updated_at = '2026-04-06 10:00:00',
      updated_by = 'loop'
  WHERE stall IN (
    SELECT stall FROM filings
    WHERE kind = 'transfer'
      AND applicant_id = new_holder_id)
  RETURNING stall, holder_id;
answer: "4"
answerLabel: How many stalls did you return?
reveal: |
  **Four: 19, 47, 64 and 102.** All four transfers were requested by Yolanda Ugarte for herself, all at **counter 1** with the user **abenavides**, on Friday 20 between 18:52 and 18:58, and **without paying a sol** (a transfer costs S/ 350). Three people can write to the registry: Alfredo (counter 1), Susana (counter 2) and Delia (IT). Alfredo swears he had already left by then. And Carmen's licence still says it expired on 31 March, even though she insists she renewed.
hints:
  - "The list of stalls to change is a subquery: `WHERE stall IN (SELECT stall FROM filings WHERE kind = 'transfer' AND applicant_id = new_holder_id)`."
  - "Each stall's owner is a correlated subquery inside the `SET`: `(SELECT p.person_id FROM stalls p WHERE p.number = stall_registry.stall)`."
tests:
  - name: stall 47 goes back to Carmen (person 58)
    db: SELECT holder_id FROM stall_registry WHERE stall = 47
    equals: 58
  - name: Yolanda no longer holds any stall
    db: SELECT COUNT(*) FROM stall_registry WHERE holder_id = (SELECT id FROM people WHERE name = 'Yolanda Ugarte Montes')
    equals: 0
  - name: only the stalls of those transfers changed, marked by Loop
    db: SELECT COUNT(*) FROM stall_registry WHERE updated_by = 'loop' AND updated_at = '2026-04-06 10:00:00'
    equals: 4
  - name: the legitimate transfers stay as they were
    db: SELECT holder_id FROM stall_registry WHERE stall = 23
    equals: 90
  - name: it returns the stalls with RETURNING
    same: SELECT stall, (SELECT person_id FROM stalls WHERE number = stall_registry.stall) FROM stall_registry WHERE stall IN (19, 47, 64, 102)
```

## Expert challenge

```exercise
id: sql15-reto-estricta
type: challenge
title: A registry that won't let you
prompt: |
  **Create `new_registry`, a `STRICT` table with rules that prevent the old registry's mistakes, turn on foreign keys and copy the whole current registry into it with `INSERT … SELECT`.**

  Columns and rules:
  - `stall INTEGER PRIMARY KEY`, between 1 and 200 (`CHECK`);
  - `holder_id INTEGER NOT NULL`, pointing to `people(id)`;
  - `license TEXT NOT NULL UNIQUE`;
  - `expires TEXT NOT NULL`, shaped like a `YYYY-MM-DD` date (compare it with `date(expires)`);
  - `status TEXT NOT NULL`, only `'active'`, `'expired'` or `'suspended'`.

  For those who already program: rules are tested by trying to break them. After your code, the judge will try to insert a holder that doesn't exist, a repeated licence and a date `'31/03/2027'`, and all three must fail.
starter: |
  CREATE TABLE new_registry (
    stall INTEGER PRIMARY KEY,
    holder_id INTEGER,
    license TEXT,
    expires TEXT,
    status TEXT
  );
solution: |
  PRAGMA foreign_keys = ON;

  CREATE TABLE new_registry (
    stall INTEGER PRIMARY KEY CHECK (stall BETWEEN 1 AND 200),
    holder_id INTEGER NOT NULL REFERENCES people(id),
    license TEXT NOT NULL UNIQUE,
    expires TEXT NOT NULL CHECK (expires IS date(expires)),
    status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'suspended'))
  ) STRICT;

  INSERT INTO new_registry (stall, holder_id, license, expires, status)
  SELECT stall, holder_id, license, expires, status
  FROM stall_registry;
hints:
  - "`PRAGMA foreign_keys = ON;` goes before the `INSERT`s: without it, SQLite doesn't check foreign keys."
  - "`STRICT` goes after the closing parenthesis. Careful: `date('31/03/2027')` is `NULL`, and a `CHECK` that gives `NULL` **lets the row through** (it only rejects `FALSE`). Compare with `IS`, which never gives `NULL`: `CHECK (expires IS date(expires))`."
tests:
  - name: the table is STRICT
    db: SELECT strict FROM pragma_table_list WHERE name = 'new_registry'
    equals: 1
  - name: you copied the 120 stalls
    db: SELECT COUNT(*) FROM new_registry
    equals: 120
  - name: it rejects a holder that doesn't exist
    fails: INSERT INTO new_registry VALUES (150, 99999, 'LF-2026-0150', '2027-01-01', 'active')
    error: FOREIGN KEY
  - name: it rejects a repeated licence
    fails: INSERT INTO new_registry VALUES (151, 58, 'LF-2020-0012', '2027-01-01', 'active')
    error: UNIQUE|FOREIGN
  - name: it rejects a badly written date
    fails: INSERT INTO new_registry VALUES (152, 58, 'LF-2026-0152', '31/03/2027', 'active')
    error: CHECK
  - name: it rejects an invented status
    fails: INSERT INTO new_registry VALUES (153, 58, 'LF-2026-0153', '2027-01-01', 'enabled')
    error: CHECK
```
