# Session 17 — Designing tables: normalization, views and triggers

```session
case: taller
```

## The job

Wednesday 8 April. Edith has made a decision: the old app is retired and Loop **designs the new registry** from scratch. For that, Delia from IT hands you the only thing the office had before the app: **the Excel sheet** where each registrar wrote down the stalls by hand, and which someone kept filling in "just in case". It was imported as it was into the table `stall_sheet`.

A spreadsheet lets you type anything in any cell, and it shows: names typed three different ways, two trades in one cell, the same stall twice. Today you'll learn to **design tables** that don't let that happen, to save named queries (**views**) and to make the database note every change by itself (**triggers**). And in that sheet there's something nobody expected.

```setting
case: taller
title: The office, with the filing cabinet open
caption: "The sheet lived on the IT computer and in a folder in the filing cabinet. Every clue you find is marked on the map."
```

```dossier
title: The sheet
cards:
  - name: Delia Lozano Yupanqui
    traits: { style: bun, shirt: "#3fa7a7", glasses: true }
    role: IT, Municipality of Surquillo
    rows: [["User", "dlozano"], ["Computer", "SIS-01"]]
    quote: "The registrars filled in the sheet. I only imported it."
  - name: Chasqui
    kind: chasqui
    role: Loop assistant detective
    quote: "A cell with two values is a question nobody can ask properly."
```

## The minimum

**Designing** means deciding which tables exist, which columns each has, what its **key** is and how they relate. The sheet keeps everything in one tab. Look at four rows:

```result
title: Four rows of the sheet
query: |
  SELECT row_num, stall, aisle, trades, holder, national_id, phone, license
  FROM stall_sheet
  WHERE stall IN (1, 2, 5, 89)
  ORDER BY row_num;
caption: "Two trades in one cell, an upper-case name and stall 89 copied twice. If a holder has three stalls, their phone is written three times: change it in one row and the other two lie."
```

**Normalizing** means splitting the sheet into tables so that **each fact lives in one place**. The three classic normal forms read as three questions:

| normal form | the question | in the sheet | the fix |
|---|---|---|---|
| **1NF** | does each cell hold a single value? | `trades = 'meat, groceries'` | a `stall_trades` table: one row per stall and trade |
| **2NF** | does each column depend on the **whole** key? | in `stall_trades(stall, trade, aisle)`, the aisle depends only on the stall | the aisle goes in `stalls` |
| **3NF** | does any column depend on another that isn't the key? | `phone` depends on the `national_id`, not on the stall | a `holders` table with the ID, the name and the phone |

When a table isn't normalized, **anomalies** appear: on **update** (you change the phone in one row and not the others), on **insert** (you can't register a holder without inventing a stall for them) and on **delete** (you delete their only stall and lose their phone). The normalized design of the new registry:

```schema
title: The new registry, normalized
schema: |
  CREATE TABLE holders (id INTEGER PRIMARY KEY, national_id TEXT NOT NULL UNIQUE, name TEXT NOT NULL, phone TEXT, district TEXT);
  CREATE TABLE stalls_n (number INTEGER PRIMARY KEY, aisle TEXT NOT NULL);
  CREATE TABLE trades (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE);
  CREATE TABLE stall_trades (stall INTEGER REFERENCES stalls_n(number), trade_id INTEGER REFERENCES trades(id), PRIMARY KEY (stall, trade_id));
  CREATE TABLE licenses_n (code TEXT PRIMARY KEY, stall INTEGER NOT NULL REFERENCES stalls_n(number), holder_id INTEGER NOT NULL REFERENCES holders(id), expires TEXT NOT NULL);
caption: "Each box keeps one thing. `stall_trades` resolves the **many-to-many** relationship: a stall sells several trades and a trade is in many stalls. Its key is the two columns together."
```

**Natural and surrogate keys.** A **natural** key already exists in the world: the national ID, the license code, the stall number. A **surrogate** key is invented by the database: `id INTEGER PRIMARY KEY`, which in SQLite is the `rowid` and numbers itself. Natural keys can change (a license is renewed under a new code) or arrive dirty; surrogate keys never change, but they say nothing. The healthy habit: a surrogate key to join tables, and the natural one **too**, with `UNIQUE`, so the database won't accept two holders with the same national ID.

**Views.** `CREATE VIEW name AS SELECT …` saves a named query. It stores no data: every time you use it, SQLite runs the `SELECT` again on the data of that moment. It saves you repeating long joins and lets you show each user only what they should see.

```sql run
CREATE VIEW current_holders AS
SELECT sr.stall, p.name AS holder, sr.expires
FROM stall_registry sr
JOIN people p ON p.id = sr.holder_id;

SELECT * FROM current_holders WHERE expires >= '2026-04-08' AND expires < '2026-05-31';
```

**Triggers.** A **trigger** is SQL the database runs by itself when something happens to a table: `BEFORE` or `AFTER` an `INSERT`, `UPDATE` or `DELETE`, once for each row (`FOR EACH ROW`). Inside, `OLD` is the row as it was and `NEW` as it ends up. The classic use is **auditing**: nobody can change the registry without leaving a trace, even if the app forgets to note it. Press ▶:

```change
title: An UPDATE that leaves a trace
setup: |
  CREATE TABLE registry (stall INTEGER PRIMARY KEY, holder TEXT, expires TEXT);
  CREATE TABLE audit_log (moment TEXT, stall INTEGER, before_value TEXT, after_value TEXT);
  INSERT INTO registry VALUES (12, 'Lucía', '2026-10-24'), (47, 'Carmen', '2026-03-31'), (58, 'Nelly', '2027-02-05');
  CREATE TRIGGER audit_holder AFTER UPDATE OF holder ON registry
  FOR EACH ROW WHEN OLD.holder IS NOT NEW.holder
  BEGIN
    INSERT INTO audit_log VALUES ('2026-04-08 09:00', OLD.stall, OLD.holder, NEW.holder);
  END;
sql: |
  UPDATE registry SET expires = '2027-03-31' WHERE stall = 47;
  UPDATE registry SET holder = 'Yolanda' WHERE stall IN (47, 58);
  UPDATE registry SET holder = 'Carmen' WHERE stall = 47;
notes:
  - "It changes `expires`, not `holder`: the trigger is `AFTER UPDATE OF holder`, so it doesn't even wake up."
  - "Two rows change holder: the trigger runs **twice**, once per row, with its own `OLD` and `NEW`."
  - "Giving the stall back is also a change, and it is noted too."
caption: "The audit is written by the database, not the app: even if someone connects through another program, the trace stays."
```

**When to denormalize.** Sometimes it pays to repeat a value on purpose: a reporting table rebuilt every night, or an order's total stored next to the order so you don't sum it every time. It's a decision, not an oversight: someone (a trigger, a nightly job) has to keep the copy up to date.

> **Common trap:** believing a view is a copy. `CREATE VIEW` doesn't photograph the data: if the registry changes tomorrow, the view shows the change. For a real snapshot, `CREATE TABLE snapshot AS SELECT …`. And another: in a trigger, `NEW` doesn't exist on a `DELETE` and `OLD` doesn't exist on an `INSERT`; on an `UPDATE` both exist.

<!-- legacy: autoincrement -->

<!-- mdn: autoincrement -->

## Practice

```exercise
id: sql17-predice-vista
type: predict
title: A view is not a snapshot
db: empty
setup: |
  CREATE TABLE licenses (stall INTEGER PRIMARY KEY, holder TEXT, expires TEXT);
  INSERT INTO licenses VALUES (12, 'Lucía', '2026-10-24'), (47, 'Carmen', '2026-03-31'), (58, 'Nelly', '2026-02-05');
  CREATE VIEW expiring AS SELECT stall FROM licenses WHERE expires < '2026-04-01';
prompt: |
  `expiring` is a view with the stalls that expire before April. What does the last `SELECT` return?
code: |
  UPDATE licenses SET expires = '2027-03-31' WHERE stall = 47;
  SELECT stall FROM expiring;
options:
  - "58"
  - "47\n58"
  - "47"
  - "12\n58"
answer: "58"
explain: |
  The view runs its `SELECT` again every time you query it, so it sees the change: stall 47 now expires in 2027 and drops off the list. Only 58 is left.
```

```exercise
id: sql17-predice-trigger
type: predict
title: How many times does it run?
db: empty
setup: |
  CREATE TABLE registry (stall INTEGER PRIMARY KEY, holder TEXT, expires TEXT);
  CREATE TABLE audit_log (stall INTEGER, before_value TEXT, after_value TEXT);
  INSERT INTO registry VALUES (12, 'Lucía', '2026-10-24'), (47, 'Carmen', '2026-03-31'), (58, 'Nelly', '2027-02-05');
  CREATE TRIGGER audit AFTER UPDATE ON registry
  FOR EACH ROW
  BEGIN
    INSERT INTO audit_log VALUES (OLD.stall, OLD.expires, NEW.expires);
  END;
prompt: |
  The trigger notes every `UPDATE` of `registry`. What does the `SELECT` return?
code: |
  UPDATE registry SET expires = '2027-12-31' WHERE expires < '2027-01-01';
  UPDATE registry SET expires = expires WHERE stall = 58;
  SELECT COUNT(*) FROM audit_log;
options:
  - "3"
  - "2"
  - "1"
  - "0"
answer: "3"
explain: |
  The first `UPDATE` changes two rows (12 and 47): the trigger runs twice. The second "changes" 58 to the same value, but it's still an `UPDATE` of one row, and this trigger has no `WHEN`: it runs once more. In total, 3.
```

```exercise
id: sql17-completa-rubros
type: complete
title: One trade per row
setup: |
  CREATE TABLE stall_trades (stall INTEGER, trade TEXT, PRIMARY KEY (stall, trade));
prompt: |
  Bring the sheet to first normal form: fill `stall_trades` with **one row per stall and trade**. The cell `'meat, groceries'` becomes two rows.

  The trick: turn the text into a JSON array (`'["meat"," groceries"]'`) and open it with `json_each`, which gives one row per element in its `value` column. Replace the `___`.
visual:
  figure:
    title: From one cell to two rows
    input: { label: stall_sheet, table: { head: [stall, trades], rows: [["1", "meat, groceries"]] } }
    arrow: "json_each + trim"
    output: { label: stall_trades, table: { head: [stall, trade], rows: [["1", "meat"], ["1", "groceries"]] } }
starter: |
  INSERT INTO stall_trades (stall, trade)
  SELECT DISTINCT ss.stall, ___(j.value)
  FROM stall_sheet ss
  JOIN json_each('["' || replace(ss.trades, ___, '","') || '"]') AS j;

  SELECT * FROM stall_trades WHERE stall <= 3 ORDER BY stall, trade;
solution: |
  INSERT INTO stall_trades (stall, trade)
  SELECT DISTINCT ss.stall, trim(j.value)
  FROM stall_sheet ss
  JOIN json_each('["' || replace(ss.trades, ',', '","') || '"]') AS j;

  SELECT * FROM stall_trades WHERE stall <= 3 ORDER BY stall, trade;
hints:
  - "Each comma is replaced by `\",\"`: it closes one string and opens the next."
  - "After the comma comes a space: `trim` removes it."
  - "`DISTINCT` avoids repeating a trade of stall 89, which is in the sheet twice."
tests:
  - name: 143 pairs of stall and trade
    db: SELECT COUNT(*) FROM stall_trades
    equals: 143
  - name: no trade has commas or leftover spaces
    db: SELECT COUNT(*) = 0 FROM stall_trades WHERE trade LIKE '%,%' OR trade <> trim(trade)
```

```exercise
id: sql17-arregla-trigger
type: fix
title: Before and after, swapped
db: empty
setup: |
  CREATE TABLE registry (stall INTEGER PRIMARY KEY, holder TEXT, expires TEXT);
  CREATE TABLE audit_log (stall INTEGER, before_value TEXT, after_value TEXT);
  INSERT INTO registry VALUES (12, 'Lucía', '2026-10-24'), (47, 'Carmen', '2026-03-31');
prompt: |
  This trigger should note, on every holder change, who the holder was **before** and who they are **after**. But the audit comes out backwards. Fix it.

  The judge changes the holder of stall 47 from Carmen to Yolanda and checks the audit.
starter: |
  CREATE TRIGGER audit_holder AFTER UPDATE OF holder ON registry
  FOR EACH ROW
  BEGIN
    INSERT INTO audit_log (stall, before_value, after_value)
    VALUES (NEW.stall, NEW.holder, OLD.holder);
  END;
solution: |
  CREATE TRIGGER audit_holder AFTER UPDATE OF holder ON registry
  FOR EACH ROW
  BEGIN
    INSERT INTO audit_log (stall, before_value, after_value)
    VALUES (NEW.stall, OLD.holder, NEW.holder);
  END;
hints:
  - "`OLD` is the row as it was before the `UPDATE`; `NEW`, as it ends up."
tests:
  - name: notes Carmen before and Yolanda after
    db: UPDATE registry SET holder = 'Yolanda' WHERE stall = 47; SELECT before_value = 'Carmen' AND after_value = 'Yolanda' FROM audit_log WHERE stall = 47;
```

```exercise
id: sql17-escribe-vista
type: write
title: The management view
prompt: |
  Edith wants to open, every morning, a list of the licenses **that expire in the next 60 days** (from Monday 6 April, included, up to before 5 June). Create the view `due_for_renewal` with the `stall`, the holder's `name` and the `expires` date, and finish with `SELECT * FROM due_for_renewal ORDER BY expires, stall;`.
starter: |
  SELECT stall, holder_id, expires
  FROM stall_registry;
solution: |
  CREATE VIEW due_for_renewal AS
  SELECT sr.stall, p.name, sr.expires
  FROM stall_registry sr
  JOIN people p ON p.id = sr.holder_id
  WHERE sr.expires >= '2026-04-06'
    AND sr.expires < '2026-06-05';

  SELECT * FROM due_for_renewal ORDER BY expires, stall;
hints:
  - "`CREATE VIEW due_for_renewal AS SELECT …` and then query it as if it were a table."
tests:
  - name: the view exists
    db: SELECT COUNT(*) FROM sqlite_schema WHERE type = 'view' AND name = 'due_for_renewal'
    equals: 1
  - name: the licenses due for renewal, in order
    same: SELECT sr.stall, p.name, sr.expires FROM stall_registry sr JOIN people p ON p.id = sr.holder_id WHERE sr.expires >= '2026-04-06' AND sr.expires < '2026-06-05' ORDER BY sr.expires, sr.stall
    ordered: true
```

```exercise
id: sql17-escribe-auditoria
type: write
title: Nobody changes a holder without leaving a trace
setup: |
  CREATE TABLE audit_log (moment TEXT, stall INTEGER, before_value INTEGER, after_value INTEGER);
prompt: |
  Write the trigger `audit_holder` for the real registry: **after** every `UPDATE` that changes `holder_id` in `stall_registry`, insert into `audit_log` the `moment` (use the new row's `updated_at`), the `stall`, the holder from before and the one from after. If the `UPDATE` touches other columns but not the holder, it must note nothing.

  The judge will test your trigger by renewing one stall and transferring another.
starter: |
  CREATE TRIGGER audit_holder AFTER UPDATE ON stall_registry
  BEGIN
  END;
solution: |
  CREATE TRIGGER audit_holder AFTER UPDATE OF holder_id ON stall_registry
  FOR EACH ROW WHEN OLD.holder_id IS NOT NEW.holder_id
  BEGIN
    INSERT INTO audit_log (moment, stall, before_value, after_value)
    VALUES (NEW.updated_at, NEW.stall, OLD.holder_id, NEW.holder_id);
  END;
hints:
  - "`AFTER UPDATE OF holder_id` wakes the trigger only when the `UPDATE` names that column; `WHEN OLD.holder_id IS NOT NEW.holder_id` discards the ones that leave it unchanged."
  - "Inside goes an `INSERT INTO audit_log … VALUES (NEW.updated_at, NEW.stall, OLD.holder_id, NEW.holder_id);`."
tests:
  - name: a renewal leaves no trace
    db: UPDATE stall_registry SET expires = '2027-10-24', updated_at = '2026-04-08 09:00:00' WHERE stall = 12; SELECT COUNT(*) FROM audit_log;
    equals: 0
  - name: a transfer leaves its row with before and after
    db: UPDATE stall_registry SET holder_id = 58, updated_at = '2026-04-08 09:10:00' WHERE stall = 3; SELECT moment = '2026-04-08 09:10:00' AND stall = 3 AND before_value = 51 AND after_value = 58 FROM audit_log;
  - name: two transfers in one UPDATE leave two rows
    db: UPDATE stall_registry SET holder_id = 412 WHERE stall IN (5, 6); SELECT COUNT(*) FROM audit_log;
    equals: 3
```

## The case

```exercise
id: sql17-caso-planilla
type: case
title: A phone that doesn't match
prompt: |
  **To move the sheet's holders into the `holders` table, each national ID must have a single phone. Find the sheet rows whose phone doesn't match that person's in `people` (joined by national ID). Among them there are four of Yolanda's stalls: whose phone is listed on those four?** Write the full name.

  Most of the differences are old numbers nobody updated. One isn't.
visual:
  - setting:
      case: taller
  - schema:
      tables: [stall_sheet, people]
starter: |
  SELECT row_num, stall, holder, national_id, phone, edited
  FROM stall_sheet
  ORDER BY row_num
  LIMIT 10;
solution: |
  SELECT ss.stall, ss.holder, ss.phone AS in_sheet, p.phone AS in_people, ss.edited
  FROM stall_sheet ss
  JOIN people p ON p.national_id = ss.national_id
  WHERE ss.phone <> p.phone;

  SELECT name, phone
  FROM people
  WHERE phone = (SELECT phone FROM stall_sheet WHERE stall = 47);
answer: Delia Lozano Yupanqui
answerLabel: Whose phone is on Yolanda's stalls?
reveal: |
  **Delia Lozano Yupanqui**, from IT. Yolanda's four rows were edited on **20 March** and all carry Delia's mobile as the contact. The other differing numbers belong to nobody: they're old phones, the classic **update anomaly** of an unnormalized sheet. Did Delia prepare the transfers… or does someone want it to look that way? Alfredo said she "knows all the passwords".
hints:
  - "Join by national ID: `JOIN people p ON p.national_id = ss.national_id`, and keep `WHERE ss.phone <> p.phone`."
  - "Find out whose number that is: `SELECT name FROM people WHERE phone = '…'`."
```

## The judge

```exercise
id: sql17-juez-normalizar
type: judge
title: From the sheet to two tables
prompt: |
  **Fill `holders` and `assignments` from the sheet: one holder per national ID and one holder per stall, always taking the most recently edited row (if two rows have the same date, the one with the higher `row_num`).**

  The sheet has one row per stall, but sometimes the same stall appears twice (someone copied it again when editing it), and the same holder appears in several stalls, sometimes with the phone or the name changed. The most recent wins.

  **Tables:** `sheet(row_num, stall, national_id, name, phone, edited)`; `holders(national_id, name, phone)` and `assignments(stall, national_id)` start empty.

  **What is checked:** the contents of the two tables after your code (`holders` with a `t` in front, `assignments` with an `a`).
schema: |
  CREATE TABLE sheet (row_num INTEGER, stall INTEGER, national_id TEXT, name TEXT, phone TEXT, edited TEXT);
  CREATE TABLE holders (national_id TEXT PRIMARY KEY, name TEXT, phone TEXT);
  CREATE TABLE assignments (stall INTEGER PRIMARY KEY, national_id TEXT);
check: SELECT 't', national_id, name, phone FROM holders UNION ALL SELECT 'a', stall, national_id, NULL FROM assignments
starter: |
  INSERT INTO holders (national_id, name, phone)
  SELECT national_id, name, phone FROM sheet;
solution: |
  INSERT INTO holders (national_id, name, phone)
  SELECT national_id, name, phone
  FROM (SELECT national_id, name, phone,
               ROW_NUMBER() OVER (PARTITION BY national_id ORDER BY edited DESC, row_num DESC) AS n
        FROM sheet)
  WHERE n = 1;

  INSERT INTO assignments (stall, national_id)
  SELECT stall, national_id
  FROM (SELECT stall, national_id,
               ROW_NUMBER() OVER (PARTITION BY stall ORDER BY edited DESC, row_num DESC) AS n
        FROM sheet)
  WHERE n = 1;
hints:
  - "`ROW_NUMBER() OVER (PARTITION BY national_id ORDER BY edited DESC, row_num DESC)` numbers each national ID's rows from newest to oldest: keep number 1."
  - "Do the same per stall for `assignments`. They are two `INSERT … SELECT`."
samples:
  - rows:
      sheet: [[1, 12, "40112233", "Lucía Paredes", "987111222", "2025-06-01"], [2, 30, "40112233", "Lucía Paredes Soto", "987333444", "2025-11-20"], [3, 47, "10203040", "Carmen Ríos", "955000111", "2025-03-02"]]
    note: "Lucía has two stalls and two phones: row 2 counts, the most recent."
  - rows:
      sheet: [[1, 8, "22334455", "Nelly", "911000000", "2026-01-10"], [2, 8, "66778899", "Kike", "922000000", "2026-02-15"], [3, 9, "66778899", "KIKE", "933000000", "2026-02-15"]]
    note: "Stall 8 went to Kike in February. Kike has two rows from the same day: row 3 wins."
edge:
  - rows: { sheet: [] }
    tag: with an empty sheet
  - rows: { sheet: [[5, 1, "11111111", "A", "900", "2026-01-01"], [4, 1, "11111111", "B", "901", "2026-01-01"]] }
    tag: with a stall copied on the same day
random:
  count: 40
  seed: 1717
  generate: |
    const ids = ["40112233", "10203040", "22334455", "66778899", "31415926", "27182818"];
    const names = ["Lucía", "Carmen", "Nelly", "Kike", "Beto", "Rosa"];
    const n = rng.int(0, 14);
    const sheet = [];
    for (let i = 1; i <= n; i++) {
      const k = rng.int(0, ids.length - 1);
      const name = rng.chance(0.3) ? names[k].toUpperCase() : names[k];
      sheet.push([i, rng.int(1, 8), ids[k], name, `9${rng.int(10, 99)}000${rng.int(100, 999)}`, `2026-0${rng.int(1, 3)}-${String(rng.int(1, 4)).padStart(2, "0")}`]);
    }
    for (let i = sheet.length - 1; i > 0; i--) { const j = rng.int(0, i); [sheet[i], sheet[j]] = [sheet[j], sheet[i]]; }
    return { sheet };
wrong:
  - |
    INSERT OR IGNORE INTO holders (national_id, name, phone) SELECT national_id, name, phone FROM sheet ORDER BY row_num;
    INSERT OR IGNORE INTO assignments (stall, national_id) SELECT stall, national_id FROM sheet ORDER BY row_num;
  - |
    INSERT INTO holders (national_id, name, phone)
    SELECT national_id, name, phone FROM (SELECT national_id, name, phone, ROW_NUMBER() OVER (PARTITION BY national_id ORDER BY edited DESC) AS n FROM sheet) WHERE n = 1;
    INSERT INTO assignments (stall, national_id)
    SELECT stall, national_id FROM (SELECT stall, national_id, ROW_NUMBER() OVER (PARTITION BY stall ORDER BY edited DESC) AS n FROM sheet) WHERE n = 1;
  - |
    INSERT INTO holders (national_id, name, phone)
    SELECT national_id, name, phone FROM (SELECT national_id, name, phone, ROW_NUMBER() OVER (PARTITION BY national_id ORDER BY edited DESC, row_num DESC) AS n FROM sheet) WHERE n = 1;
    INSERT INTO assignments (stall, national_id)
    SELECT stall, national_id FROM (SELECT stall, national_id, ROW_NUMBER() OVER (PARTITION BY stall ORDER BY edited, row_num) AS n FROM sheet) WHERE n = 1;
```

## Final mission

```exercise
id: sql17-mision-terminal
type: mission
title: From which computer?
prompt: |
  **Create the view `registry_writes` with every `UPDATE` the session log recorded on the registry: `moment`, `stall`, `username`, the `terminal` it was sent from and the one `assigned` to that user in `users`. Then query it for stalls 19, 47, 64 and 102 on Friday 20, in order.**

  If Delia used Alfredo's account, she did it from somewhere. Each session's terminal is in the log; each user's, in `users`.
visual:
  - setting:
      case: taller
  - schema:
      tables: [session_log, users]
  - figure:
      title: "Friday 20 March, minute by minute"
      lanes:
        from: "18:10"
        to: "19:10"
        tick: 10
        bands: [{"from": "18:45", "to": "18:52:40", "label": "stale data", "by": "sql16-mision-bitacora"}]
        rows:
          - label: "Delia"
            sub: "SIS-01"
            bars:
              - from: "18:20"
                to: "19:10"
                label: "did not return"
                kind: "ok"
                by: "sql18-mision-final"
            events:
              - at: "18:20"
                label: "says: I left"
                kind: "said"
                side: "left"
                by: "sql15-mision-devolver"
          - label: "Alfredo"
            sub: "what he says"
            bars:
              - from: "18:30"
                to: "19:10"
                label: "says: I had gone"
                kind: "said"
                by: "sql15-mision-devolver"
          - label: "Alfredo"
            sub: "the data"
            bars: [{"from": "18:28", "to": "18:41", "label": "out", "kind": "soft", "by": "sql18-mision-final"}]
            events:
              - {"at": "18:41", "label": "back in", "kind": "bad", "side": "right", "by": "sql18-mision-final"}
              - {"at": "18:53", "label": "calls", "kind": "bad", "side": "right", "by": "sql18-mision-final"}
          - label: "Susana"
            sub: "VENT-2"
            events:
              - {"at": "18:44", "label": "reads", "side": "left", "by": "sql16-mision-bitacora"}
              - {"at": "18:47", "label": "renews", "kind": "ok", "side": "right", "by": "sql16-caso-renovacion"}
          - label: "Session 328"
            sub: "VENT-1"
            events:
              - {"at": "18:45", "label": "reads", "side": "left", "by": "sql16-mision-bitacora"}
              - at: "18:52:40"
                label: "overwrites"
                kind: "bad"
                side: "left"
                by: "sql16-mision-bitacora"
              - {"at": "18:58", "label": "4 transfers", "side": "right", "by": "sql15-mision-devolver"}
starter: |
  SELECT moment, stall, username, terminal, statement
  FROM session_log
  WHERE stall = 47;
solution: |
  CREATE VIEW registry_writes AS
  SELECT s.moment, s.stall, s.username, s.terminal, u.terminal AS assigned
  FROM session_log s
  LEFT JOIN users u ON u.login = s.username
  WHERE s.statement LIKE 'UPDATE stall_registry%';

  SELECT *
  FROM registry_writes
  WHERE stall IN (19, 47, 64, 102)
    AND moment LIKE '2026-03-20%'
  ORDER BY moment;
answer: VENT-1
answerLabel: Which computer did the four transfers come from?
reveal: |
  **VENT-1**, the computer at **counter 1**, Alfredo's. That Friday, SIS-01 (Delia's) never touched the registry: her only uses in March are reports. To use Alfredo's account, Delia would have had to sit in his chair, at the counter, at 18:52. The phone on the sheet starts to look like a trap. One thing is left: **who was physically in the office?** That crosses all the dossiers, in session 18.
hints:
  - "The view: `CREATE VIEW registry_writes AS SELECT s.moment, s.stall, s.username, s.terminal, u.terminal AS assigned FROM session_log s LEFT JOIN users u ON u.login = s.username WHERE s.statement LIKE 'UPDATE stall_registry%';`"
  - "`LEFT JOIN` in case a session used a user who isn't in `users`."
tests:
  - name: the view registry_writes exists
    db: SELECT COUNT(*) FROM sqlite_schema WHERE type = 'view' AND name = 'registry_writes'
    equals: 1
  - name: the view has one row for each registry UPDATE
    db: SELECT (SELECT COUNT(*) FROM registry_writes) = (SELECT COUNT(*) FROM session_log WHERE statement LIKE 'UPDATE%')
  - name: Friday's writes on those stalls, in order
    same: SELECT s.moment, s.stall, s.username, s.terminal, u.terminal FROM session_log s LEFT JOIN users u ON u.login = s.username WHERE s.statement LIKE 'UPDATE%' AND s.stall IN (19, 47, 64, 102) AND s.moment LIKE '2026-03-20%' ORDER BY s.moment
    ordered: true
```

## Expert challenge

```exercise
id: sql17-reto-rechazo
type: challenge
title: Let the database say no
prompt: |
  **Write a `BEFORE INSERT` trigger on `filings` that rejects, with `RAISE(ABORT, 'message')`, the impossible transfers: those requested by the beneficiary herself (`applicant_id = new_holder_id`) and those with no payment.** All other filings must go in normally.

  For those who already program: this is validation in the database, not in the app. That way no counter, script or shared user can skip it. The judge will try to insert a transfer from Yolanda to Yolanda, one with a fee of 0 and a legitimate one.
starter: |
  CREATE TRIGGER validate_transfer BEFORE INSERT ON filings
  BEGIN
    SELECT 1;
  END;
solution: |
  CREATE TRIGGER validate_transfer BEFORE INSERT ON filings
  FOR EACH ROW
  WHEN NEW.kind = 'transfer'
   AND (NEW.applicant_id = NEW.new_holder_id OR COALESCE(NEW.fee, 0) <= 0)
  BEGIN
    SELECT RAISE(ABORT, 'invalid transfer: the seller requests it and it is paid');
  END;
hints:
  - "The condition goes in `WHEN NEW.kind = 'transfer' AND (…)`; inside, `SELECT RAISE(ABORT, '…');` cancels the `INSERT`."
  - "A `NULL` fee isn't a payment either: `COALESCE(NEW.fee, 0) <= 0`."
tests:
  - name: rejects a transfer requested by the beneficiary
    fails: INSERT INTO filings (stall, kind, applicant_id, new_holder_id, counter, clerk, filed_at, status, fee) VALUES (30, 'transfer', 1144, 1144, 1, 'abenavides', '2026-04-08 10:00:00', 'approved', 350)
    error: transfer
  - name: rejects a transfer with no payment
    fails: INSERT INTO filings (stall, kind, applicant_id, new_holder_id, counter, clerk, filed_at, status, fee) VALUES (30, 'transfer', 58, 1144, 1, 'abenavides', '2026-04-08 10:00:00', 'approved', NULL)
    error: transfer
  - name: lets a legitimate transfer and a renewal through
    db: INSERT INTO filings (stall, kind, applicant_id, new_holder_id, counter, clerk, filed_at, status, fee) VALUES (30, 'transfer', 58, 1144, 1, 'abenavides', '2026-04-08 10:00:00', 'approved', 350); INSERT INTO filings (stall, kind, applicant_id, counter, clerk, filed_at, status, fee) VALUES (31, 'renewal', 412, 2, 'ssalazar', '2026-04-08 10:05:00', 'approved', 0); SELECT COUNT(*) FROM filings WHERE filed_at >= '2026-03-25';
    equals: 2
```
