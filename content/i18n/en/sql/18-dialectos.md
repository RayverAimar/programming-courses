# Session 18 — SQLite, PostgreSQL and MySQL: the final dossier

```session
case: taller
```

## The job

Thursday 9 April. Two pieces of news. The good one: Edith approved Loop's design, and the new registry will live on the municipality's server, which runs **PostgreSQL**. The other: the **Comptroller's Office** opened an investigation into the four transfers and sends its queries written for PostgreSQL. You work in SQLite. Same SQL, different dialects: what is one line in one is an error in another… or, worse, a different result with no warning.

And one last question remains in the dossier. Alfredo says he left at 18:30 and that someone used his account. The phone on the sheet points to Delia; the computer, to counter 1. To close the case you'll cross **all the dossiers**: the market gates and the calls from the first case, the payments from the second and the log from this one.

```setting
case: taller
title: The last day in the office
caption: "Each number is a clue from this dossier. The last one lights up when the final query proves it."
```

```dossier
title: Those who remain
cards:
  - name: Alfredo Benavides Tello
    traits: { style: short, hair: "#121212", shirt: "#2f3a4a", glasses: true, beard: false }
    role: Registrar, counter 1
    quote: "Check the gate: I left at half past six."
  - name: Delia Lozano Yupanqui
    traits: { style: bun, shirt: "#3fa7a7", glasses: true }
    role: IT
    quote: "That mobile on the sheet is mine, yes. I didn't put it there."
  - name: Yolanda Ugarte Montes
    traits: { style: curly, shirt: "#e07a5f", earrings: true }
    role: Holder of four stalls (for now)
    quote: "I paid for those stalls. To whom is nobody's business."
  - name: "Tito Vílchez Arias"
    traits: {"style": "curly", "shirt": "#c4553f"}
    role: "Trader in La Victoria; case SUR-0314"
    rows: [["Before", "bought Wayra's gyroscope"], ["Surname", "Vílchez Arias"]]
```

```figure
title: "The suspects, side by side"
table:
  head: ["person", "account and computer", "said", "still to find out"]
  rows:
    - - "Alfredo"
      - "abenavides · VENT-1"
      - "\"I left at 18:30; someone used my account.\""
      - "Was he in the market at 18:52:40?"
    - ["Delia", "dlozano · SIS-01", "\"I left at 18:20.\"", "Was she in the market at 18:52:40?"]
    - - "Susana"
      - "ssalazar · VENT-2"
      - "\"I renewed Carmen's licence.\""
      - "Cleared: session 328 overwrote her renewal"
```

## The minimum

SQL is a standard, but each engine speaks it with its own accent. The differences that bite most when moving a query from one engine to another:

| topic | SQLite (this course) | PostgreSQL | MySQL |
|---|---|---|---|
| **types** | flexible; `STRICT` optional | strict: `'12' + 'a'` is an error | half strict (warns and converts) |
| **auto-numbered key** | `INTEGER PRIMARY KEY` | `GENERATED ALWAYS AS IDENTITY` (or `SERIAL`) | `AUTO_INCREMENT` |
| **gluing text** | `a \|\| b` | `a \|\| b` | `CONCAT(a, b)` (`\|\|` is an `OR`) |
| **first rows** | `LIMIT 5` | `LIMIT 5` or `FETCH FIRST 5 ROWS ONLY` | `LIMIT 5` |
| **true/false** | `1` and `0` | `boolean`: `true`, `false` | `1` and `0` (`TINYINT(1)`) |
| **dates** | text + `date()`, `datetime(x, '-3 days')`, `julianday` | `date`/`timestamp` types: `x - INTERVAL '3 days'`, `x::date` | `DATE_SUB(x, INTERVAL 3 DAY)`, `DATE(x)` |
| **days between dates** | `julianday(a) - julianday(b)` | `a - b` (with `date`) | `DATEDIFF(a, b)` |
| **case-insensitive** | `LIKE` (ASCII only) | `ILIKE` | `LIKE` (depends on the *collation*) |
| **5 / 2** | `2` | `2` | `2.5000` |
| **upsert** | `ON CONFLICT … DO UPDATE` | same | `ON DUPLICATE KEY UPDATE` |
| **RETURNING** | yes (3.35) | yes | no (MariaDB yes) |
| **windows, CTEs, recursive** | yes (3.25, 3.8.3) | yes | yes since 8.0 |
| **FULL JOIN** | yes (3.39) | yes | no |
| **quotes** | `'text'`, `"column"` | same | `'text'`, `` `column` `` |

**Translating a query from one dialect to another**, piece by piece. This is a Comptroller's query on licenses, in PostgreSQL. Press ▶:

```translation
title: From PostgreSQL to SQLite
from: PostgreSQL
to: SQLite
steps:
  - a: "SELECT stall,"
    b: "SELECT stall,"
    note: "What is standard carries over unchanged: `SELECT`, `FROM`, `WHERE`, joins, `GROUP BY`, `CASE`, `COALESCE`."
  - a: "       expires - DATE '2026-03-23' AS days,"
    b: "       julianday(expires) - julianday('2026-03-23') AS days,"
    note: "In PostgreSQL, subtracting two `date` values gives days. SQLite has no date type: `expires - '2026-03-23'` subtracts **numbers** (2026 − 2026 = 0) without an error. `julianday` turns each date into a number of days."
  - a: "       (expires < DATE '2026-04-23') AS urgent"
    b: "       expires < '2026-04-23' AS urgent"
    note: "PostgreSQL returns `true`/`false`; SQLite, `1`/`0`. `'YYYY-MM-DD'` dates compare correctly as text."
  - a: "FROM stall_registry"
    b: "FROM stall_registry"
    note: ""
  - a: "WHERE status ILIKE 'ACTIVE'"
    b: "WHERE lower(status) = 'active'"
    note: "`ILIKE` doesn't exist in SQLite. `LIKE` already ignores case on letters without accents, but `lower(…)` says it clearly and works in all three."
  - a: "ORDER BY days, stall"
    b: "ORDER BY days, stall"
    note: ""
  - a: "FETCH FIRST 10 ROWS ONLY;"
    b: "LIMIT 10;"
    note: "`FETCH FIRST` is the standard; SQLite and MySQL use `LIMIT`. PostgreSQL understands both."
caption: "The most dangerous trap isn't the one that errors, but the one that runs: `expires - '2026-03-23'` returns 0 in SQLite on every row."
```

Why so many differences: SQLite was born to store data **inside** a program, with no server, and prefers to accept whatever it's given (dynamic typing, dates as text). PostgreSQL was born at a university to enforce the relational model to the letter (strict types, `boolean`, `interval`, MVCC). MySQL was born to make nineties websites fast, and it carries decisions from that era (`||` as `OR`, decimal division, *collations* that ignore case). Writing **portable SQL** means choosing what all three understand the same way:

```figure
title: The same question, three dialects
panes:
  - label: SQLite
    text: |
      SELECT stall, holder_id
      FROM stall_registry
      WHERE expires < date('2026-03-23', '+30 days')
      ORDER BY expires
      LIMIT 3;
  - label: PostgreSQL
    text: |
      SELECT stall, holder_id
      FROM stall_registry
      WHERE expires < DATE '2026-03-23' + 30
      ORDER BY expires
      FETCH FIRST 3 ROWS ONLY;
  - label: MySQL
    text: |
      SELECT stall, holder_id
      FROM stall_registry
      WHERE expires < DATE_ADD('2026-03-23', INTERVAL 30 DAY)
      ORDER BY expires
      LIMIT 3;
```

```sql run
SELECT 7 / 2 AS division,
       7 / 2.0 AS with_decimals,
       'Stall ' || 47 AS label,
       '2026-03-31' < '2026-04-01' AS compare_dates,
       julianday('2026-03-31') - julianday('2026-03-23') AS days;
```

> **Common trap:** the query that "works" in both engines but says something else. `7 / 2` gives 3 in SQLite and PostgreSQL, and 3.5 in MySQL. `'2026-03-20' - 7` is an error in PostgreSQL, and in SQLite it returns **2019**, a number, which always loses when compared with text: `moment >= '2026-03-20' - 7` lets **every** row through. When porting, test with data whose result you already know.

<!-- legacy: ilike -->

<!-- legacy: booleans -->

<!-- mdn: ilike booleans -->

## Practice

```exercise
id: sql18-predice-tipos
type: predict
title: What SQLite lets through
prompt: |
  What does this return in SQLite?
code: |
  SELECT 7 / 2, '3' + 4, 'a' || 1;
options:
  - "3 | 7 | a1"
  - "3.5 | 7 | a1"
  - "3 | 34 | a1"
  - "3 | 7 | 1"
answer: "3 | 7 | a1"
explain: |
  Integer division, as in PostgreSQL (MySQL would give 3.5000). `'3' + 4`: SQLite converts the text to a number and adds, 7 (PostgreSQL does too, because `'3'` has no type yet; with a text column it would be an error). `||` glues text: `'a1'`. In MySQL, `'a' || 1` would be a logical `OR` and give 1.
```

```exercise
id: sql18-predice-booleanos
type: predict
title: True plus true
prompt: |
  What does this return in SQLite?
code: |
  SELECT TRUE + TRUE, 5 > 3, typeof(5 > 3);
options:
  - "2 | 1 | integer"
  - "1 | 1 | boolean"
  - "2 | TRUE | boolean"
  - "1 | TRUE | integer"
answer: "2 | 1 | integer"
explain: |
  In SQLite, `TRUE` is just another way of writing 1, and a comparison returns the integer 1 or 0. In PostgreSQL, `TRUE + TRUE` is an error (you can't add booleans) and `5 > 3` is `true`.
```

```exercise
id: sql18-completa-traduce
type: complete
title: Days remaining
prompt: |
  The Comptroller's Office sends this PostgreSQL query: the 5 active stalls whose license expires soonest (from Monday 23 March, the cut-off date of its review), with the days remaining.

  ```sql
  SELECT stall, expires - DATE '2026-03-23' AS days
  FROM stall_registry
  WHERE status = 'active' AND expires >= DATE '2026-03-23'
  ORDER BY days, stall
  FETCH FIRST 5 ROWS ONLY;
  ```

  Complete the SQLite version. The days must come out as integers.
starter: |
  SELECT stall,
         CAST(___(expires) - julianday('2026-03-23') AS ___) AS days
  FROM stall_registry
  WHERE status = 'active' AND expires >= '2026-03-23'
  ORDER BY days, stall
  ___ 5;
solution: |
  SELECT stall,
         CAST(julianday(expires) - julianday('2026-03-23') AS INTEGER) AS days
  FROM stall_registry
  WHERE status = 'active' AND expires >= '2026-03-23'
  ORDER BY days, stall
  LIMIT 5;
hints:
  - "`julianday` turns a date into days; the subtraction gives a number with decimals (`8.0`), which `CAST(… AS INTEGER)` leaves as 8."
  - "`FETCH FIRST 5 ROWS ONLY` in SQLite is `LIMIT 5`."
tests:
  - name: the five stalls with their days, in order
    same: SELECT stall, CAST(julianday(expires) - julianday('2026-03-23') AS INTEGER) FROM stall_registry WHERE status = 'active' AND expires >= '2026-03-23' ORDER BY 2, stall LIMIT 5
    ordered: true
```

```exercise
id: sql18-arregla-fecha
type: fix
title: A subtraction that doesn't warn
prompt: |
  Someone ported this query from another engine: **the payments Yolanda received in the 7 days before Friday 20** (from Friday 13). In SQLite it doesn't error… but it brings payments from the whole month. Run it, look at the dates and fix it.
visual:
  figure:
    title: What SQLite computes
    input: { label: "The expression", value: "'2026-03-20' - 7" }
    arrow: "text → number"
    output: { label: "The result", value: "2019" }
    steps:
      - "SQLite turns `'2026-03-20'` into a number: it reads as far as it can, **2026**, and subtracts 7."
      - "In SQLite, text is always greater than a number: `moment >= 2019` is true on **every** row."
starter: |
  SELECT t.moment, p.name, t.amount, t.note
  FROM transfers t
  JOIN people p ON p.phone = t.from_phone
  WHERE t.to_phone = (SELECT phone FROM people WHERE name = 'Yolanda Ugarte Montes')
    AND t.moment >= '2026-03-20' - 7
    AND t.moment < '2026-03-20'
  ORDER BY t.moment;
solution: |
  SELECT t.moment, p.name, t.amount, t.note
  FROM transfers t
  JOIN people p ON p.phone = t.from_phone
  WHERE t.to_phone = (SELECT phone FROM people WHERE name = 'Yolanda Ugarte Montes')
    AND t.moment >= datetime('2026-03-20', '-7 days')
    AND t.moment < '2026-03-20'
  ORDER BY t.moment;
hints:
  - "In SQLite, dates are moved with modifiers: `datetime('2026-03-20', '-7 days')`."
tests:
  - name: only the payments from the 13th to the 19th, in order
    same: SELECT t.moment, p.name, t.amount, t.note FROM transfers t JOIN people p ON p.phone = t.from_phone WHERE t.to_phone = (SELECT phone FROM people WHERE name = 'Yolanda Ugarte Montes') AND t.moment >= '2026-03-13' AND t.moment < '2026-03-20' ORDER BY t.moment
    ordered: true
```

```exercise
id: sql18-escribe-portable
type: write
title: One query for all three engines
prompt: |
  The Comptroller's Office will run this query on PostgreSQL and MySQL. **For each app user, their `login`, the `name` of their owner (or `'shared'` if the account has no person) and how many filings they handled in March 2026 as `filings`**, from most to fewest filings and, on ties, by `login`.

  Write it **portably**: no functions that exist only in SQLite (`ifnull`, `iif`, `strftime`, `datetime`, `julianday`, `group_concat`) and no double quotes for text.
starter: |
  SELECT login
  FROM users;
solution: |
  SELECT u.login,
         COALESCE(p.name, 'shared') AS name,
         COUNT(f.id) AS filings
  FROM users u
  LEFT JOIN people p ON p.id = u.person_id
  LEFT JOIN filings f
    ON f.clerk = u.login
   AND f.filed_at >= '2026-03-01'
   AND f.filed_at < '2026-04-01'
  GROUP BY u.login, p.name
  ORDER BY filings DESC, u.login;
hints:
  - "Users with no filings also appear (with 0): `LEFT JOIN`, and the date filter goes in the `ON`, not the `WHERE`."
  - "`COUNT(f.id)` counts only the filings that exist; `COALESCE` is standard."
tests:
  - name: the five users with their March filings, in order
    same: SELECT u.login, COALESCE(p.name, 'shared'), COUNT(f.id) AS n FROM users u LEFT JOIN people p ON p.id = u.person_id LEFT JOIN filings f ON f.clerk = u.login AND f.filed_at >= '2026-03-01' AND f.filed_at < '2026-04-01' GROUP BY u.login, p.name ORDER BY n DESC, u.login
    ordered: true
  - name: no SQLite-only functions
    sourceNot: '\b(ifnull|iif|strftime|datetime|julianday|group_concat)\s*\(|"'
    msg: That function or those quotes don't exist the same way in PostgreSQL or MySQL.
  - name: columns login, name and filings
    columns: [login, name, filings]
```

## The case

```exercise
id: sql18-caso-contraloria
type: case
title: The Comptroller's query
prompt: |
  **The Comptroller's Office wants to know who paid Yolanda for stall 47 in the three days before and after Friday 20. Port it to SQLite, run it and write the name of whoever paid.**

  This is how it arrived, in PostgreSQL (in the editor as is: it will error). Change `::date`, `ILIKE`, `INTERVAL` and `FETCH FIRST` to what SQLite understands.
visual:
  - setting:
      case: taller
  - translation:
      title: What needs to change
      from: PostgreSQL
      to: SQLite
      steps:
        - a: "t.moment::date"
          b: "date(t.moment)"
          note: "Converting to a date: in SQLite, the `date` function."
        - a: "name ILIKE 'yolanda ugarte%'"
          b: "lower(name) LIKE 'yolanda ugarte%'"
          note: "No `ILIKE`: `lower` + `LIKE`."
        - a: "TIMESTAMP '2026-03-20' - INTERVAL '3 days'"
          b: "datetime('2026-03-20', '-3 days')"
          note: "Moving a date: a modifier."
        - a: "FETCH FIRST 5 ROWS ONLY"
          b: "LIMIT 5"
          note: "The first rows."
starter: |
  SELECT p.name, t.amount, t.moment::date AS day, t.note
  FROM transfers t
  JOIN people p ON p.phone = t.from_phone
  WHERE t.to_phone = (SELECT phone FROM people WHERE name ILIKE 'yolanda ugarte%')
    AND t.note ILIKE '%STALL 47%'
    AND t.moment BETWEEN TIMESTAMP '2026-03-20' - INTERVAL '3 days'
                     AND TIMESTAMP '2026-03-20' + INTERVAL '3 days'
  ORDER BY t.moment
  FETCH FIRST 5 ROWS ONLY;
solution: |
  SELECT p.name, t.amount, date(t.moment) AS day, t.note
  FROM transfers t
  JOIN people p ON p.phone = t.from_phone
  WHERE t.to_phone = (SELECT phone FROM people WHERE lower(name) LIKE 'yolanda ugarte%')
    AND lower(t.note) LIKE '%stall 47%'
    AND t.moment BETWEEN datetime('2026-03-20', '-3 days')
                     AND datetime('2026-03-20', '+3 days')
  ORDER BY t.moment
  LIMIT 5;
answer: Abel Vílchez Arias
answerLabel: Who paid for stall 47?
reveal: |
  **Abel Vílchez Arias**: S/ 3000 on Thursday 19 at night, a day **before** the transfer, and S/ 2000 on Saturday 21. Vílchez Arias, like **Tito Vílchez Arias**, the La Victoria trader who bought Wayra's gyroscope from Renzo in the first dossier: they're brothers. Loop's stall was sold to the family Loop exposed. But Yolanda only collected. Who made the transfer?
hints:
  - "SQLite doesn't understand `::`: that's the first error. Start with `date(t.moment)`."
  - "`TIMESTAMP '2026-03-20' - INTERVAL '3 days'` is `datetime('2026-03-20', '-3 days')`."
```

## The judge

```exercise
id: sql18-juez-traducir
type: judge
title: Translate to SQLite
prompt: |
  **Write in SQLite the same query as this PostgreSQL one, with the same result on any table.**

  ```sql
  SELECT stall,
         expires - DATE '2026-03-23' AS days,
         (expires < DATE '2026-04-23') AS urgent
  FROM licenses
  WHERE holder ILIKE '%quispe%'
  ORDER BY days, stall
  FETCH FIRST 10 ROWS ONLY;
  ```

  In SQLite, `urgent` comes out as `1` or `0`, and `days` as a number of days (it can be negative if it already expired).

  **Table:** `licenses(stall, holder, expires)`, with `expires` as `'YYYY-MM-DD'`. Names have no accents.

  **Result:** `stall`, `days` and `urgent`, in the requested order.
schema: |
  CREATE TABLE licenses (stall INTEGER, holder TEXT, expires TEXT);
ordered: true
starter: |
  SELECT stall, expires - '2026-03-23' AS days, expires < '2026-04-23' AS urgent
  FROM licenses
  WHERE holder LIKE '%quispe%';
solution: |
  SELECT stall,
         julianday(expires) - julianday('2026-03-23') AS days,
         expires < '2026-04-23' AS urgent
  FROM licenses
  WHERE lower(holder) LIKE '%quispe%'
  ORDER BY days, stall
  LIMIT 10;
hints:
  - "The days between two dates: `julianday(expires) - julianday('2026-03-23')`."
  - "Don't forget the `ORDER BY` with a tie-breaker or the `LIMIT 10`."
samples:
  - rows:
      licenses: [[12, "Rosa Quispe Apaza", "2026-03-31"], [47, "Carmen Rios", "2026-04-30"], [8, "QUISPE MAMANI JUAN", "2026-03-20"], [30, "Elena Huaman Quispe", "2026-03-31"]]
    note: "The three Quispes, from the one that expires first to the one that expires last; 8 expired 3 days ago. 12 and 30 tie: 12 first."
edge:
  - rows: { licenses: [] }
    tag: with an empty table
  - rows: { licenses: [[1, "Ana Quispe", "2026-04-23"], [2, "Ana Quispe", "2026-04-22"]] }
    tag: right at the urgent boundary
  - rows: { licenses: [[1, "q quispe", "2027-03-23"], [2, "Q QUISPE", "2025-03-23"], [3, "Quispe", "2026-03-23"], [4, "QuIsPe", "2026-03-24"], [5, "quispe", "2026-03-25"], [6, "quispe", "2026-03-26"], [7, "quispe", "2026-03-27"], [8, "quispe", "2026-03-28"], [9, "quispe", "2026-03-29"], [10, "quispe", "2026-03-30"], [11, "quispe", "2026-03-31"], [12, "quispe", "2026-04-01"]] }
    tag: with more than ten results
random:
  count: 40
  seed: 1818
  generate: |
    const names = ["Rosa Quispe", "QUISPE JUAN", "Carmen Rios", "Elena Huaman", "Luis quispe", "Kike Mamani", "Quispe Apaza Nelly"];
    const n = rng.int(0, 16);
    const rows = [];
    for (let i = 0; i < n; i++) rows.push([rng.int(1, 120), rng.pick(names), `2026-0${rng.int(2, 6)}-${String(rng.int(1, 28)).padStart(2, "0")}`]);
    return { licenses: rows };
wrong:
  - |
    SELECT stall, expires - '2026-03-23' AS days, expires < '2026-04-23' AS urgent
    FROM licenses WHERE lower(holder) LIKE '%quispe%' ORDER BY days, stall LIMIT 10;
  - |
    SELECT stall, julianday(expires) - julianday('2026-03-23') AS days, expires < '2026-04-23' AS urgent
    FROM licenses WHERE lower(holder) LIKE '%quispe%' ORDER BY days LIMIT 10;
  - |
    SELECT stall, julianday(expires) - julianday('2026-03-23') AS days, expires <= '2026-04-23' AS urgent
    FROM licenses WHERE lower(holder) LIKE '%quispe%' ORDER BY days, stall LIMIT 10;
  - |
    SELECT stall, julianday(expires) - julianday('2026-03-23') AS days, expires < '2026-04-23' AS urgent
    FROM licenses WHERE lower(holder) LIKE '%quispe%' ORDER BY days, stall;
```

## Final mission

```exercise
id: sql18-mision-final
type: mission
title: The final dossier
prompt: |
  **For each person with an account in the registry app, show their `name`; whether they were inside the market at 18:52:40 on Friday 20 (`in_market`: 1 if their last card swipe that day up to that second was an entry, 0 if not); how many soles Yolanda transferred to them (`from_yolanda`, 0 if none) and how many calls there were between the two (`calls`, in either direction).** Order by name. Then name whoever made the transfers.

  The query crosses three dossiers: `session_log` and `users` (this case), `market_entries` and `calls` (the tables from Wayra's gyroscope case) and `transfers` (the payment network). And the Comptroller's Office will run it on PostgreSQL: write it **portably** (`CASE` instead of booleans, `COALESCE`, no SQLite-only functions or double quotes).
visual:
  - setting:
      case: taller
  - figure:
      title: Three questions per person
      panes:
        - cards:
            - title: Were they there?
              rows: [["Table", "market_entries"], ["Last swipe", "up to 18:52:40"]]
            - title: Did they get paid?
              rows: [["Table", "transfers"], ["From", "Yolanda's mobile"]]
            - title: Did they talk?
              rows: [["Table", "calls"], ["With", "Yolanda's mobile"]]
  - schema:
      tables: [users, people, market_entries, transfers, calls]
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
  SELECT u.login, p.name, p.phone
  FROM users u
  JOIN people p ON p.id = u.person_id;
solution: |
  WITH yolanda AS (
    SELECT phone FROM people WHERE name = 'Yolanda Ugarte Montes'
  ),
  team AS (
    SELECT p.id, p.name, p.phone
    FROM users u
    JOIN people p ON p.id = u.person_id
  )
  SELECT t.name,
         CASE WHEN (SELECT m.direction
                    FROM market_entries m
                    WHERE m.person_id = t.id
                      AND m.moment BETWEEN '2026-03-20 00:00:00' AND '2026-03-20 18:52:40'
                    ORDER BY m.moment DESC
                    LIMIT 1) = 'in' THEN 1 ELSE 0 END AS in_market,
         COALESCE((SELECT SUM(x.amount)
                   FROM transfers x
                   WHERE x.from_phone = (SELECT phone FROM yolanda)
                     AND x.to_phone = t.phone), 0) AS from_yolanda,
         (SELECT COUNT(*)
          FROM calls c
          WHERE (c.caller = t.phone AND c.callee = (SELECT phone FROM yolanda))
             OR (c.callee = t.phone AND c.caller = (SELECT phone FROM yolanda))) AS calls
  FROM team t
  ORDER BY t.name;
answer: Alfredo Benavides Tello
answerLabel: Who made the transfers?
reveal: |
  **Alfredo Benavides Tello.** He left through Gate 1 at **18:28**, as he said… and **came back in through Gate 2 at 18:41**. Four minutes later, his session opened the record of stall 47; at 18:52:40 it wrote it with Yolanda as holder, and at **18:53** he called her. Delia had left at 18:20 and didn't come back: her mobile on the sheet was put there by Alfredo to throw people off. Yolanda collected **S/ 11 500** for the four stalls (S/ 5000 from Abel Vílchez for 47) and passed **S/ 7500** to Alfredo, disguised as a "savings-club share" and a "loan".

  Edith suspends Alfredo, the Comptroller's Office takes the case to the prosecutor's office and stall 47 goes back to Carmen's name, with her renewal through 2027. The new registry, in PostgreSQL, has foreign keys, `CHECK`, an audit with triggers and writes that don't trample anyone.

  **The five Lima dossiers are closed.** You started with a `SELECT *` on a table of complaints; you finish by reading plans, writing transactions, designing tables and porting queries between engines. Chasqui shuts down the laptop: «You don't need me to look for you anymore».
hints:
  - "Build two CTEs: `yolanda` (her phone) and `team` (the people in `users`). Then one correlated subquery per question."
  - "The last swipe: `SELECT m.direction FROM market_entries m WHERE m.person_id = t.id AND m.moment BETWEEN '2026-03-20 00:00:00' AND '2026-03-20 18:52:40' ORDER BY m.moment DESC LIMIT 1`, compared with `'in'` inside a `CASE`."
tests:
  - name: the four people with their three answers, by name
    same: |
      SELECT p.name,
             CASE WHEN (SELECT m.direction FROM market_entries m WHERE m.person_id = p.id AND m.moment BETWEEN '2026-03-20 00:00:00' AND '2026-03-20 18:52:40' ORDER BY m.moment DESC LIMIT 1) = 'in' THEN 1 ELSE 0 END,
             COALESCE((SELECT SUM(x.amount) FROM transfers x WHERE x.from_phone = (SELECT phone FROM people WHERE name = 'Yolanda Ugarte Montes') AND x.to_phone = p.phone), 0),
             (SELECT COUNT(*) FROM calls c, people y WHERE y.name = 'Yolanda Ugarte Montes' AND ((c.caller = p.phone AND c.callee = y.phone) OR (c.callee = p.phone AND c.caller = y.phone)))
      FROM users u JOIN people p ON p.id = u.person_id
      ORDER BY p.name
    ordered: true
  - name: columns name, in_market, from_yolanda and calls
    columns: [name, in_market, from_yolanda, calls]
  - name: portable to PostgreSQL
    sourceNot: '\b(ifnull|iif|strftime|datetime|julianday|group_concat)\s*\(|"'
    msg: The Comptroller's Office runs PostgreSQL. Use CASE, COALESCE and text comparisons.
```

## Expert challenge

```exercise
id: sql18-reto-distinct-on
type: challenge
title: DISTINCT ON, without DISTINCT ON
prompt: |
  **The Comptroller's Office asks for the latest filing of each stall: `stall`, `kind`, `clerk` and `filed_at`, ordered by stall.** In PostgreSQL they wrote it with an extension that only exists there:

  ```sql
  SELECT DISTINCT ON (stall) stall, kind, clerk, filed_at
  FROM filings
  ORDER BY stall, filed_at DESC;
  ```

  For those who already program: `DISTINCT ON` keeps the first row of each group according to the `ORDER BY`. Write it in standard SQL, which runs on SQLite, PostgreSQL and MySQL 8.
starter: |
  SELECT stall, kind, clerk, MAX(filed_at)
  FROM filings
  GROUP BY stall;
solution: |
  SELECT stall, kind, clerk, filed_at
  FROM (
    SELECT stall, kind, clerk, filed_at,
           ROW_NUMBER() OVER (PARTITION BY stall ORDER BY filed_at DESC) AS n
    FROM filings
  ) AS latest
  WHERE n = 1
  ORDER BY stall;
hints:
  - "`ROW_NUMBER() OVER (PARTITION BY stall ORDER BY filed_at DESC)` numbers each stall's filings from newest to oldest."
  - "The `GROUP BY` with `MAX` at the start works in SQLite thanks to a quirk (bare columns), but PostgreSQL rejects it: `kind` isn't in the `GROUP BY`."
tests:
  - name: the latest filing of each stall, by stall
    same: SELECT stall, kind, clerk, filed_at FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY stall ORDER BY filed_at DESC) AS n FROM filings) WHERE n = 1 ORDER BY stall
    ordered: true
  - name: without the bare-columns quirk
    sourceNot: '\bMAX\s*\(\s*filed_at'
    msg: That GROUP BY only works in SQLite.
```
