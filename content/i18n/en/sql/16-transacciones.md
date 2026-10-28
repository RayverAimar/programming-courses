# Session 16 — Transactions and ACID

```session
case: taller
```

## The job

Tuesday 7 April. Carmen arrives at the office with her receipt in hand: on **Friday 20, at 18:47**, she paid **S/ 120** at counter 2 to renew her licence until March 2027. But the registry says it expired on **31 March 2026**. The renewal got lost.

Two clerks work at the Markets Office at the same time, each at their own counter, on the same database. When two people write at once they can step on each other. Databases have a tool so that doesn't happen, the **transaction**, and the old app used it… halfway. Its **session log** keeps every statement it sent, with the session, the user and the exact second: the answer is in there.

```setting
case: taller
title: Two counters, one database
caption: "Both counters write to the same server. The log records everything each session asked of it."
```

```dossier
title: What they say
cards:
  - name: Susana Salazar Pumacayo
    traits: { style: long, shirt: "#8a5cc4", glasses: false }
    role: Clerk, counter 2
    rows: [["User", "ssalazar"], ["Computer", "VENT-2"]]
    quote: "I renewed Mrs. Carmen's licence. The app told me «saved»."
  - name: Alfredo Benavides Tello
    traits: { style: short, hair: "#121212", shirt: "#2f3a4a", glasses: true, beard: false }
    role: Clerk, counter 1
    rows: [["User", "abenavides"], ["Computer", "VENT-1"]]
    quote: "By half past six I had already left. Delia knows all the passwords."
  - name: Carmen Ríos Llanos
    traits: { style: bun, shirt: "#3f7cc4", glasses: true }
    role: Loop technician, stall 47
    rows: [["Paid", "S/ 120, Friday 20, 18:47"]]
    quote: "Here's the receipt. I renewed until 2027."
```

## The minimum

A **transaction** is a group of statements the database treats as **one**: either all of them happen, or none. It opens with **`BEGIN`** and closes with **`COMMIT`** (save everything) or **`ROLLBACK`** (undo everything). Without `BEGIN`, each statement is its own transaction: that's called *autocommit*.

Transactions promise four things, remembered as **ACID**:

| letter | promise | in the registry |
|---|---|---|
| **A**tomicity | all or nothing | a filing and its change to the registry are saved together, or neither is |
| **C**onsistency | the rules hold at the end | no `CHECK`, `UNIQUE` or foreign key is left broken |
| **I**solation | transactions don't see each other half done | counter 1 doesn't see what counter 2 hasn't confirmed yet |
| **D**urability | what is confirmed survives a blackout | after the `COMMIT`, it's on disk |

**Atomicity, step by step.** Susana renews a licence: she inserts the filing and changes the registry. Halfway through, the power goes out. Press ▶:

```transaction
title: A blackout halfway
lanes: ["Counter 2", "What SQLite does"]
steps:
  - lane: 0
    sql: BEGIN;
    db: "registry: stall 12 expires **2026-10-24** · filings: 247"
    note: "Opens the transaction. Nothing is written to the database file yet."
  - lane: 0
    sql: "INSERT INTO filings …;"
    sees: "sees her new filing (248)"
    note: "SQLite copies the pages it's about to touch into the **journal** (a separate file) and changes its in-memory copy."
  - lane: 1
    sql: "⚡ the power goes out"
    note: "The `COMMIT` never arrived."
  - lane: 1
    sql: "on restart: reads the journal"
    db: "registry: stall 12 expires **2026-10-24** · filings: 247"
    note: "On opening the database, SQLite finds the journal of an unconfirmed transaction and **restores the original pages**. The half-done filing disappears: atomicity."
  - lane: 0
    sql: "BEGIN; INSERT …; UPDATE …; COMMIT;"
    db: "registry: stall 12 expires **2027-10-24** · filings: 248"
    note: "It's repeated in full. With the `COMMIT`, SQLite writes to disk, waits for the disk to confirm and deletes the journal: durability."
caption: "In **WAL** mode the idea is the same, reversed: changes are appended to the end of a `-wal` file and a `COMMIT` is a mark; whatever has no mark is ignored."
```

**Savepoints.** Inside a transaction you can mark a point with `SAVEPOINT name` and go back to it with `ROLLBACK TO name`, without losing what came before. `RELEASE name` removes the mark.

```sql run
BEGIN;
UPDATE stall_registry SET expires = '2027-10-24' WHERE stall = 12;
SAVEPOINT before_delete;
DELETE FROM filings WHERE stall = 12;
ROLLBACK TO before_delete;
COMMIT;
SELECT stall, expires, (SELECT COUNT(*) FROM filings WHERE stall = 12) AS filings
FROM stall_registry
WHERE stall = 12;
```

**Isolation: what each of two sessions sees.** If two transactions run at once, what does each see of the other? The more isolated, the safer… and the more they wait. The standard describes four **anomalies**:

```transaction
title: Dirty read
lanes: ["Counter 1", "Counter 2"]
steps:
  - lane: 0
    sql: "BEGIN; UPDATE … SET expires = '2030-01-01' WHERE stall = 8;"
    db: "stall 8 expires **2026-05-11**"
    note: "Counter 1 changes a date, without confirming."
  - lane: 1
    sql: "SELECT expires … WHERE stall = 8;"
    sees: "reads 2030-01-01"
    note: "If the isolation level allows it (`READ UNCOMMITTED`), counter 2 reads a value that **doesn't exist yet**."
  - lane: 0
    sql: ROLLBACK;
    db: "stall 8 expires **2026-05-11**"
    note: "Counter 1 changes its mind. Counter 2 has already told the trader that the licence lasts until 2030: it read **garbage**."
caption: "SQLite and PostgreSQL never allow dirty reads."
```

```transaction
title: Non-repeatable read
lanes: ["Counter 1", "Counter 2"]
steps:
  - lane: 0
    sql: "BEGIN; SELECT expires … WHERE stall = 8;"
    sees: "reads 2026-05-11"
    db: "stall 8 expires **2026-05-11**"
    note: "Counter 1 starts reviewing stall 8."
  - lane: 1
    sql: "UPDATE … SET expires = '2027-05-11' WHERE stall = 8; (autocommit)"
    db: "stall 8 expires **2027-05-11**"
    note: "Counter 2 renews it and confirms."
  - lane: 0
    sql: "SELECT expires … WHERE stall = 8;"
    sees: "with READ COMMITTED: 2027-05-11 · with REPEATABLE READ: 2026-05-11"
    note: "The **same** query, inside the **same** transaction, gives a different result: non-repeatable read. If instead of one row what changes is how many rows meet a `WHERE`, it's called a **phantom row**."
```

| level (standard), and who uses it by default | dirty read | non-repeatable | phantom |
|---|---|---|---|
| `READ UNCOMMITTED`<br><small>almost nobody</small> | can | can | can |
| `READ COMMITTED`<br><small>PostgreSQL, Oracle, SQL Server</small> | — | can | can |
| `REPEATABLE READ`<br><small>MySQL (InnoDB)</small> | — | — | can (the standard) |
| `SERIALIZABLE`<br><small>SQLite (always)</small> | — | — | — |

The fourth anomaly isn't in the table because no level prevents it if the app reads **outside** the transaction: the **lost update**. Two sessions read the same row, each computes its change and writes it; the second overwrites the first without knowing:

```transaction
title: Lost update
lanes: ["Session A", "Session B"]
steps:
  - lane: 0
    sql: "SELECT * … WHERE stall = 30;"
    sees: "expires 2026-04-02, trade: fruit"
    db: "stall 30: expires **2026-04-02**"
    note: "A opens the record of stall 30 (outside any transaction) to change the trade."
  - lane: 1
    sql: "SELECT * … WHERE stall = 30;"
    sees: "expires 2026-04-02"
    note: "B opens the same record to renew."
  - lane: 1
    sql: "BEGIN; UPDATE … SET expires = '2027-04-02' …; COMMIT;"
    db: "stall 30: expires **2027-04-02**"
    note: "B renews and confirms. All good… for now."
  - lane: 0
    sql: "BEGIN; UPDATE … SET expires = '2026-04-02', trade = 'vegetables' …; COMMIT;"
    db: "stall 30: expires **2026-04-02**"
    note: "A saves **the whole record** as it read it, with its change. The old date comes back: B's renewal **was lost**, and both transactions were perfect."
caption: "The fix isn't \"more transaction\": it's writing only what you change (`SET trade = …`), or writing only if the row is still as you read it (`WHERE … AND updated_at = 'what I read'`)."
```

**How each engine does it.** SQLite lets many read but **only one write at a time**: whoever writes takes a lock on the whole database, and whoever arrives later waits or gets `SQLITE_BUSY`. With WAL, readers wait for nobody: they read the snapshot of the database from when they started. PostgreSQL uses **MVCC** (multiversion concurrency control): an `UPDATE` doesn't overwrite the row, it creates **a new version** and marks the old one as replaced; each transaction sees the versions that belong to it. That's why many can write at once there, on different rows.

```figure
title: Two ways of sharing
panes:
  - label: SQLite (WAL)
    table:
      head: ["", "reads", "writes"]
      rows:
        - ["Counter 1", "its snapshot", "**database lock**"]
        - ["Counter 2", "its snapshot", "waits its turn"]
  - label: PostgreSQL (MVCC)
    table:
      head: ["stall 30", "created by", "replaced by"]
      rows:
        - ["expires 2026-04-02", "trans. 812", "trans. 815"]
        - ["expires 2027-04-02", "trans. 815", "—"]
```

> **Common trap:** an error does **not** close the transaction. If inside a `BEGIN` a statement fails (because of a `UNIQUE`, say), SQLite undoes **that statement** and the transaction stays open: you decide whether to `ROLLBACK` or fix it and `COMMIT`. PostgreSQL is stricter: after an error, it rejects everything until you `ROLLBACK`. And if you forget the `COMMIT`, everything is undone when the connection closes.

<!-- legacy: transactions -->

<!-- legacy: journal-wal -->

<!-- mdn: transactions journal-wal -->

## Practice

```exercise
id: sql16-predice-rollback
type: predict
title: I changed my mind
db: empty
setup: |
  CREATE TABLE accounts (id INTEGER PRIMARY KEY, holder TEXT, balance INTEGER);
  INSERT INTO accounts VALUES (1, 'Carmen', 500), (2, 'Loop', 80);
prompt: |
  What does the `SELECT` return?
code: |
  BEGIN;
  UPDATE accounts SET balance = balance - 120 WHERE id = 1;
  UPDATE accounts SET balance = balance + 120 WHERE id = 2;
  ROLLBACK;
  SELECT balance FROM accounts ORDER BY id;
options:
  - "500\n80"
  - "380\n200"
  - "380\n80"
  - "500\n200"
answer: "500\n80"
explain: |
  `ROLLBACK` undoes **everything** since the `BEGIN`: both updates. The accounts are left as they were.
```

```exercise
id: sql16-predice-savepoint
type: predict
title: Back to the mark
db: empty
setup: |
  CREATE TABLE accounts (id INTEGER PRIMARY KEY, holder TEXT, balance INTEGER);
  INSERT INTO accounts VALUES (1, 'Carmen', 500), (2, 'Loop', 80);
prompt: |
  What does the `SELECT` return?
code: |
  BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
  SAVEPOINT mark;
  UPDATE accounts SET balance = 0 WHERE id = 1;
  ROLLBACK TO mark;
  UPDATE accounts SET balance = balance + 100 WHERE id = 2;
  COMMIT;
  SELECT balance FROM accounts ORDER BY id;
options:
  - "400\n180"
  - "0\n180"
  - "500\n80"
  - "400\n80"
answer: "400\n180"
explain: |
  `ROLLBACK TO mark` undoes only what came after the mark (the balance set to 0). The first `UPDATE` still stands, so does the last, and the `COMMIT` saves both.
```

```exercise
id: sql16-completa-transferencia
type: complete
title: A complete transfer
db: empty
setup: |
  CREATE TABLE accounts (id INTEGER PRIMARY KEY, holder TEXT, balance REAL CHECK (balance >= 0));
  INSERT INTO accounts VALUES (1, 'Carmen', 500), (2, 'Loop', 80), (3, 'Municipality', 0);
prompt: |
  Carmen (account 1) pays **S/ 120** to the Municipality (account 3). Both updates must go in **one transaction**. Replace the `___`.
starter: |
  ___;
  UPDATE accounts SET balance = balance - 120 WHERE id = ___;
  UPDATE accounts SET balance = balance + 120 WHERE id = ___;
  ___;
  SELECT id, balance FROM accounts ORDER BY id;
solution: |
  BEGIN;
  UPDATE accounts SET balance = balance - 120 WHERE id = 1;
  UPDATE accounts SET balance = balance + 120 WHERE id = 3;
  COMMIT;
  SELECT id, balance FROM accounts ORDER BY id;
hints:
  - "The transaction opens with `BEGIN` and is saved with `COMMIT`."
tests:
  - name: Carmen has 380 and the Municipality 120
    db: SELECT (SELECT balance FROM accounts WHERE id = 1) = 380 AND (SELECT balance FROM accounts WHERE id = 3) = 120
  - name: the transaction was closed
    db: BEGIN; SELECT 1;
    msg: The transaction still needs closing with COMMIT.
  - name: it uses BEGIN and COMMIT
    source: '\bBEGIN\b[\s\S]*\bCOMMIT\b'
```

```exercise
id: sql16-arregla-savepoint
type: fix
title: Undoing too much
prompt: |
  Susana registers a **change of trade** for stall 12 and, in the same transaction, was going to change the holder… but she picked the wrong person. She wants to **undo only the holder change** and save the filing. As it stands, the code undoes everything and the `COMMIT` fails. Fix it.
visual:
  figure:
    title: What Susana wanted
    panes:
      - label: Save
        value: "the filing"
      - label: Undo
        value: "the UPDATE"
starter: |
  BEGIN;
  INSERT INTO filings (stall, kind, applicant_id, counter, clerk, filed_at, status, fee)
  VALUES (12, 'change of trade', 412, 2, 'ssalazar', '2026-04-07 09:15:00', 'approved', 60);
  SAVEPOINT before_registry;
  UPDATE stall_registry SET holder_id = 413 WHERE stall = 12;
  ROLLBACK;
  COMMIT;
solution: |
  BEGIN;
  INSERT INTO filings (stall, kind, applicant_id, counter, clerk, filed_at, status, fee)
  VALUES (12, 'change of trade', 412, 2, 'ssalazar', '2026-04-07 09:15:00', 'approved', 60);
  SAVEPOINT before_registry;
  UPDATE stall_registry SET holder_id = 413 WHERE stall = 12;
  ROLLBACK TO before_registry;
  COMMIT;
hints:
  - "A bare `ROLLBACK` undoes the whole transaction, and then there's nothing left to confirm."
  - "To go back to the mark: `ROLLBACK TO before_registry;`."
tests:
  - name: the filing was saved
    db: SELECT COUNT(*) FROM filings WHERE stall = 12 AND filed_at = '2026-04-07 09:15:00'
    equals: 1
  - name: the holder of stall 12 is still person 412
    db: SELECT holder_id FROM stall_registry WHERE stall = 12
    equals: 412
```

```exercise
id: sql16-escribe-renovacion
type: write
title: Renew without stepping on anyone
prompt: |
  Register Carmen's renewal again, done right: in **one transaction**, insert the filing (`stall` 47, `kind` `'renewal'`, `applicant_id` 58, `counter` 2, `clerk` `'loop'`, `filed_at` `'2026-04-07 10:00:00'`, `status` `'approved'`, `fee` 120) and change **only** the `expires` column of stall 47 to `'2027-03-31'`. Don't touch the other columns: if someone changed them, their changes stay.
starter: |
  UPDATE stall_registry
  SET holder_id = 58, license = 'LF-2021-0047', expires = '2027-03-31', status = 'active'
  WHERE stall = 47;
solution: |
  BEGIN;
  INSERT INTO filings (stall, kind, applicant_id, counter, clerk, filed_at, status, fee)
  VALUES (47, 'renewal', 58, 2, 'loop', '2026-04-07 10:00:00', 'approved', 120);
  UPDATE stall_registry
  SET expires = '2027-03-31'
  WHERE stall = 47;
  COMMIT;
hints:
  - "The `UPDATE` at the start is like the old app's: it writes the whole record. Leave only `expires` in the `SET`."
tests:
  - name: stall 47 expires on 31 March 2027
    db: SELECT expires FROM stall_registry WHERE stall = 47
    equals: "2027-03-31"
  - name: the filing is registered
    db: SELECT COUNT(*) FROM filings WHERE stall = 47 AND clerk = 'loop' AND kind = 'renewal'
    equals: 1
  - name: you didn't touch the holder or the licence
    db: SELECT license FROM stall_registry WHERE stall = 47
    equals: LF-2026-0047
    msg: Change only expires; the holder is discussed elsewhere.
  - name: everything is in one closed transaction
    source: '\bBEGIN\b[\s\S]*\bCOMMIT\b'
```

```exercise
id: sql16-escribe-optimista
type: write
title: Write only if nobody changed the row
setup: |
  UPDATE stall_registry SET updated_at = '2026-02-11 10:22:05', expires = '2026-10-24' WHERE stall = 12;
prompt: |
  Susana opened the record of stall 12 at 9:00 and saw `updated_at = '2026-02-11 10:22:05'`. Now she wants to renew it: `expires` to `'2027-10-24'`, `updated_at` to `'2026-04-07 09:05:00'` and `updated_by` to `'ssalazar'`. But **only if nobody changed the row since she read it**: add that condition to the `WHERE` and return what changed with `RETURNING stall, expires`. If someone got there first, the `UPDATE` must touch nothing (and `RETURNING` returns no rows: the app will know it has to read again).

  Your code is tested twice: with the row as Susana read it and with the row changed by the other counter.
starter: |
  UPDATE stall_registry
  SET expires = '2027-10-24', updated_at = '2026-04-07 09:05:00', updated_by = 'ssalazar'
  WHERE stall = 12;
solution: |
  UPDATE stall_registry
  SET expires = '2027-10-24', updated_at = '2026-04-07 09:05:00', updated_by = 'ssalazar'
  WHERE stall = 12
    AND updated_at = '2026-02-11 10:22:05'
  RETURNING stall, expires;
hints:
  - "The condition is that `updated_at` is still what you read: `AND updated_at = '2026-02-11 10:22:05'`."
scenarios:
  - tests:
      - name: if nobody touched it, it renews
        db: SELECT expires FROM stall_registry WHERE stall = 12
        equals: "2027-10-24"
      - name: RETURNING gives back the renewed stall
        rows: 1
  - setup: |
      UPDATE stall_registry SET expires = '2026-12-31', updated_at = '2026-04-07 09:02:41', updated_by = 'abenavides' WHERE stall = 12;
    tests:
      - name: if counter 1 got there first, it doesn't overwrite its change
        db: SELECT expires FROM stall_registry WHERE stall = 12
        equals: "2026-12-31"
      - name: RETURNING gives no rows
        rows: 0
```

## The case

```exercise
id: sql16-caso-renovacion
type: case
title: Carmen's receipt
prompt: |
  **Find in `filings` the renewal of stall 47 from Friday 20 and find out who handled it.** Write their full name.

  `clerk` keeps the app user; `users` says whose each user is (`person_id`), and the name is in `people`.
visual:
  - setting:
      case: taller
  - schema:
      tables: [filings, users, people]
starter: |
  SELECT *
  FROM filings
  WHERE stall = 47;
solution: |
  SELECT t.filed_at, t.kind, t.status, t.fee, t.counter, p.name
  FROM filings t
  JOIN users u ON u.login = t.clerk
  JOIN people p ON p.id = u.person_id
  WHERE t.stall = 47
    AND t.filed_at LIKE '2026-03-20%'
  ORDER BY t.filed_at;
answer: Susana Salazar Pumacayo
answerLabel: Who handled the renewal?
reveal: |
  **Susana Salazar Pumacayo**, at counter 2, at **18:47:31**: renewal approved and S/ 120 paid. Carmen is telling the truth. But five minutes later, at **18:52:39**, there is another filing for the same stall at counter 1: the transfer to Yolanda. If the renewal was approved, why does the registry still say 2026-03-31?
hints:
  - "Join `filings` with `users` on `u.login = t.clerk`, and `users` with `people` on `p.id = u.person_id`."
  - "`filed_at LIKE '2026-03-20%'` keeps only Friday's."
```

## The judge

```exercise
id: sql16-juez-transferencia
type: judge
title: All or nothing
prompt: |
  **Execute the payment order: move `amount` from account `from_id` to account `to_id`, but only if both accounts exist, are different and the `from_id` account has enough balance. If anything isn't met, nothing changes.**

  The traders' association cashier processes one order at a time. A half-done transfer is the worst that can happen: money that leaves one account and reaches none, or reaches one without having left. A single statement is atomic; two loose statements are not.

  **Tables:** `accounts(id, balance)` and `transfer_order(from_id, to_id, amount)`, with exactly one row and `amount > 0`.

  **What is checked:** the contents of `accounts` after your code.
schema: |
  CREATE TABLE accounts (id INTEGER PRIMARY KEY, balance REAL);
  CREATE TABLE transfer_order (from_id INTEGER, to_id INTEGER, amount REAL);
check: SELECT id, balance FROM accounts
starter: |
  UPDATE accounts SET balance = balance - (SELECT amount FROM transfer_order) WHERE id = (SELECT from_id FROM transfer_order);
  UPDATE accounts SET balance = balance + (SELECT amount FROM transfer_order) WHERE id = (SELECT to_id FROM transfer_order);
solution: |
  UPDATE accounts
  SET balance = balance + CASE WHEN accounts.id = o.from_id THEN -o.amount ELSE o.amount END
  FROM transfer_order AS o
  WHERE accounts.id IN (o.from_id, o.to_id)
    AND o.from_id <> o.to_id
    AND (SELECT COUNT(*) FROM accounts c WHERE c.id IN (o.from_id, o.to_id)) = 2
    AND (SELECT c.balance FROM accounts c WHERE c.id = o.from_id) >= o.amount;
hints:
  - "`UPDATE accounts SET … FROM transfer_order AS o WHERE …` (SQLite 3.33, same as PostgreSQL) lets you use the order's columns in the `SET` and the `WHERE`."
  - "In a single statement, the conditions (both exist, enough balance) are evaluated before anything changes: either both rows change, or neither."
samples:
  - rows:
      accounts: [[1, 500], [2, 80], [3, 0]]
      transfer_order: [[1, 3, 120]]
    note: "Account 1 has enough balance: 120 moves to account 3."
  - rows:
      accounts: [[1, 100], [2, 80]]
      transfer_order: [[2, 1, 90]]
    note: "Account 2 has 80 and wants to pay 90: nothing changes."
  - rows:
      accounts: [[1, 500], [2, 80]]
      transfer_order: [[1, 7, 50]]
    note: "Account 7 doesn't exist: the money can't leave account 1."
edge:
  - rows: { accounts: [[1, 100]], transfer_order: [[1, 1, 30]] }
    tag: when an account pays itself
  - rows: { accounts: [[1, 100], [2, 0]], transfer_order: [[1, 2, 100]] }
    tag: with the exact balance
  - rows: { accounts: [[1, 100], [2, 0]], transfer_order: [[9, 2, 10]] }
    tag: when the paying account doesn't exist
random:
  count: 40
  seed: 1616
  generate: |
    const n = rng.int(1, 6);
    const accounts = [];
    for (let i = 1; i <= n; i++) accounts.push([i, rng.int(0, 50) * 10]);
    const from = rng.int(1, n + 1), to = rng.int(1, n + 1);
    return { accounts, transfer_order: [[from, to, rng.int(1, 30) * 10]] };
wrong:
  - |
    UPDATE accounts
    SET balance = balance + CASE WHEN accounts.id = o.from_id THEN -o.amount ELSE o.amount END
    FROM transfer_order AS o
    WHERE accounts.id IN (o.from_id, o.to_id) AND o.from_id <> o.to_id
      AND (SELECT c.balance FROM accounts c WHERE c.id = o.from_id) >= o.amount;
  - |
    UPDATE accounts SET balance = balance - (SELECT amount FROM transfer_order)
    WHERE id = (SELECT from_id FROM transfer_order) AND balance >= (SELECT amount FROM transfer_order);
    UPDATE accounts SET balance = balance + (SELECT amount FROM transfer_order)
    WHERE id = (SELECT to_id FROM transfer_order);
  - |
    UPDATE accounts
    SET balance = balance + CASE WHEN accounts.id = o.from_id THEN -o.amount ELSE o.amount END
    FROM transfer_order AS o
    WHERE accounts.id IN (o.from_id, o.to_id) AND o.from_id <> o.to_id
      AND (SELECT COUNT(*) FROM accounts c WHERE c.id IN (o.from_id, o.to_id)) = 2
      AND (SELECT c.balance FROM accounts c WHERE c.id = o.from_id) > o.amount;
```

## Final mission

```exercise
id: sql16-mision-bitacora
type: mission
title: What happened between 18:40 and 18:53
prompt: |
  **List, in order, everything the log recorded between 18:40 and 18:53 on Friday 20: `moment`, `session`, `username`, `terminal` and `statement`.** Then read the statements as two lanes, one per session, and answer: which session overwrote Susana's renewal?

  Notice what each session read and **when**: the one that writes with stale data is the one that overwrites.
visual:
  - setting:
      case: taller
  - transaction:
      title: "The two lanes you're going to reconstruct"
      lanes: ["Counter 2 (ssalazar)", "Counter 1 (?)"]
      steps:
        - lane: 0
          sql: "SELECT … stall = 47"
          note: "18:44 — Susana opens Carmen's record."
        - lane: 1
          sql: "?"
          note: "What does the other session do, and when? Run your query."
  - schema:
      tables: [session_log]
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
  SELECT moment, session, username, statement
  FROM session_log
  WHERE stall = 47;
solution: |
  SELECT moment, session, username, terminal, statement
  FROM session_log
  WHERE moment BETWEEN '2026-03-20 18:40' AND '2026-03-20 18:53'
  ORDER BY moment;
answer: "328"
answerLabel: Which session overwrote the renewal? (its number)
reveal: |
  **Session 328**, user **abenavides**, from **VENT-1**. It read the record of stall 47 at **18:45:05**, when it still expired on 31 March 2026. Susana renewed and confirmed at 18:47:33. At **18:52:40**, session 328 wrote the **whole** record as it had read it: Yolanda as holder and the old date. A textbook **lost update**, and Susana is cleared. But Alfredo insists: «I left at 18:30. Someone used my user».
hints:
  - "`WHERE moment BETWEEN '2026-03-20 18:40' AND '2026-03-20 18:53'`, ordered by `moment`."
  - "The `BEGIN` and `COMMIT` rows have `stall` as `NULL`: if you filter by `stall = 47`, they disappear."
tests:
  - name: the ten statements in the window, in order
    same: SELECT moment, session, username, terminal, statement FROM session_log WHERE moment BETWEEN '2026-03-20 18:40' AND '2026-03-20 18:53' ORDER BY moment
    ordered: true
```

## Expert challenge

```exercise
id: sql16-reto-perdidas
type: challenge
title: Every lost update in March
prompt: |
  **Find in the log every overwritten write: an `UPDATE` by a session A on a stall, followed by an `UPDATE` by another session B on the same stall, when the last read (`SELECT`) B made of that stall before writing was earlier than A's write.** Return `stall`, `overwritten` (session A), `overwriting` (session B) and `moment` (B's write), ordered by `moment`.

  For those who already program: it's a self-join of the log with itself plus a correlated subquery. 328 isn't the only one: the old app loses data by design.
starter: |
  SELECT stall, session, moment, statement
  FROM session_log
  WHERE statement LIKE 'UPDATE%'
  ORDER BY stall, moment;
solution: |
  SELECT w1.stall, w1.session AS overwritten, w2.session AS overwriting, w2.moment
  FROM session_log w1
  JOIN session_log w2
    ON w2.stall = w1.stall
   AND w2.session <> w1.session
   AND w2.moment > w1.moment
  WHERE w1.statement LIKE 'UPDATE%'
    AND w2.statement LIKE 'UPDATE%'
    AND (SELECT max(r.moment)
         FROM session_log r
         WHERE r.session = w2.session
           AND r.stall = w2.stall
           AND r.statement LIKE 'SELECT%'
           AND r.moment < w2.moment) < w1.moment
  ORDER BY w2.moment;
hints:
  - "Join the log with itself: `w1` is the write that gets lost and `w2` the one that overwrites it (same stall, another session, later)."
  - "B's last read before writing: `(SELECT max(r.moment) FROM session_log r WHERE r.session = w2.session AND r.stall = w2.stall AND r.statement LIKE 'SELECT%' AND r.moment < w2.moment)`. If it's less than `w1.moment`, B wrote with stale data."
tests:
  - name: the overwritten writes of March, in order
    same: SELECT w1.stall, w1.session, w2.session, w2.moment FROM session_log w1 JOIN session_log w2 ON w2.stall = w1.stall AND w2.session <> w1.session AND w2.moment > w1.moment WHERE w1.statement LIKE 'UPDATE%' AND w2.statement LIKE 'UPDATE%' AND (SELECT max(r.moment) FROM session_log r WHERE r.session = w2.session AND r.stall = w2.stall AND r.statement LIKE 'SELECT%' AND r.moment < w2.moment) < w1.moment ORDER BY w2.moment
    ordered: true
  - name: columns stall, overwritten, overwriting and moment
    columns: [stall, overwritten, overwriting, moment]
```
