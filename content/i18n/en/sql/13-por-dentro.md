# Session 13 — Inside: pages, B-trees and indexes

```session
case: frio
```

## The job

Tuesday 31 March, first thing. Three names are left on the board: **Víctor Salazar**, **Rosa Ugarte** and **Nilton Palomino**. Last night Chasqui wanted to see who the public phone talked to **all of December**, not just on the night of the robbery. It copied session 12's walk, dropped the time filter, stretched it to **four** calls and, to save writing the edges, put both directions in a single condition:

```sql
WITH RECURSIVE network(number, hops) AS (
  SELECT '4723310', 0
  UNION
  SELECT CASE WHEN l.caller = r.number THEN l.callee ELSE l.caller END, r.hops + 1
  FROM network AS r
  JOIN calls_1998 AS l ON r.number IN (l.caller, l.callee)
  WHERE r.hops < 4
)
SELECT count(*) FROM network;
```

The query **doesn't finish**: it would have to read about 300 million rows, and the Taller cuts every query off at 4 seconds (on a fast computer it would still need more than half a minute). And it isn't wrong: the result would be correct. The problem is **how** SQLite runs it. To understand it you have to open up the database and look at how it stores rows. Today you learn what a page is, why a table is a tree and what an index does.

```setting
case: frio
title: What we know so far
caption: "The pins light up as you solve the steps of the case."
```

```dossier
title: The three who were close to the public phone
cards:
  - name: Víctor Salazar Montes
    traits: { style: short, shirt: "#5b6b7a", vest: "#2f3a4a" }
    role: Cash supervisor, 1 call away
    rows: [["Employee", "318"]]
    quote: "I don't know any locksmith and I've never called one."
  - name: Rosa Ugarte Bustamante
    traits: { style: bun, hair: "#7a7a7a", shirt: "#8a5cc4", glasses: true }
    role: Head of Treasury, 2 calls away
    rows: [["Employee", "214"]]
    quote: "I went to bed early that night and didn't hear the phone."
  - name: Nilton Palomino Ríos
    traits: { style: curly, shirt: "#3fa7a7" }
    role: Cashier, 2 calls away
    rows: [["Employee", "405"]]
    quote: "I was at a chicken fundraiser in Breña with my girlfriend."
```

```figure
title: "The numbers in the case"
table:
  head: ["number", "who", "where"]
  rows:
    - ["4723310", "Public phone", "Av. México, opposite the mill"]
    - ["4721093", "The mill's booth", "where Teodoro kept watch"]
    - ["2715504", "Teodoro Llanos's home", "the guard"]
    - ["4417825", "Víctor Salazar's home", "employee 318, cash supervisor"]
    - ["4402216", "Rosa Ugarte's home", "employee 214, head of Treasury"]
    - ["2741958", "Nilton Palomino's home", "employee 405, cashier"]
    - ["4256641", "Cerrajería El Candado", "Jr. Huánuco 1290, safes and keys"]
  by:
    - null
    - null
    - null
    - "sql13-caso-cerrajeria"
    - "sql13-caso-cerrajeria"
    - "sql13-caso-cerrajeria"
    - "sql13-caso-cerrajeria"
```

```figure
title: "The night of the robbery, in order"
timeline:
  - when: "Tue 15"
    title: "Rosa Ugarte changes the combination"
    text: "Only she and the 11 below her know it."
    by: "sql12-caso-combinacion"
  - when: "Tue 15 · 23:21"
    title: "A first relay"
    text: "A home calls the public phone and, five minutes later, the public phone calls the booth."
    by: "sql13-mision-relevo"
  - when: "Fri 18 · 22:58"
    title: "Home 4417825 calls the locksmith"
    text: "The fifth time in December."
    by: "sql13-caso-cerrajeria"
  - {"when": "23:36", "title": "Home 4417825 calls the public phone", "by": "sql13-mision-relevo"}
  - when: "23:41"
    title: "The public phone calls the booth"
    text: "The caller says he is a technician sent by Mrs Ugarte."
  - {"when": "No time", "title": "Teodoro opens the side door", "text": "The file does not say when."}
  - when: "No time"
    title: "The safe is opened with the combination"
    text: "S/ 412,000 is taken."
  - when: "Sat 19 · 00:52"
    title: "The booth calls Rosa and nobody answers"
    text: "Two calls, 00:52 and 00:55, of 0 seconds: Teodoro was telling the truth."
    by: "sql14-caso-caseta"
    now: true
  - when: "Closing"
    title: "Who set up the call"
    text: "Víctor Salazar: his home made both relays."
    by: "sql14-mision-culpable"
    now: true
```

## The minimum

**The file is pages.** An SQLite database is a single file cut into **pages** of the same size. SQLite reads and writes whole pages, never single rows: a query's cost is measured in **how many pages it has to read**.

```sql run
PRAGMA page_size;
```

<!-- photo: hdd-open-wd -->

That's 4096 bytes. A call takes about 50, so some 90 fit on a page: `calls_1998` takes about **680 pages**.

**A table is a B-tree ordered by `id`.** The pages aren't loose: they form a **tree**. The **leaves** hold the rows, in `id` order (the `rowid`). The pages above hold only **dividing keys**: "ids below 20,000 this way; the rest, that way". Finding an `id` means walking from the root down to a leaf, comparing:

<!-- /photo -->

```btree
title: Finding call 35552 by its id
n: 27
step: 2222
fanout: 3
find: 35552
caption: "Drawn with 3 keys per page. In the real file each inner page holds hundreds of keys: with 680 leaves, the tree has 3 levels. Looking up an `id` reads **3 pages**; reading the table, **680**."
```

**Without an index, everything else is a SCAN.** The tree is ordered by `id`, not by `caller`. To find a number's calls SQLite has no choice but to read **every** leaf and look row by row. `EXPLAIN QUERY PLAN` in front of a query doesn't run it: it says **how** it would run it.

```plan
title: "No index: SCAN"
query: |
  SELECT started, callee FROM calls_1998
  WHERE caller = '4417825';
```

**An index is another B-tree.** `CREATE INDEX idx_calls_caller ON calls_1998(caller)` builds a separate tree whose leaves hold `(caller, rowid)` pairs **sorted by `caller`**. Finding a number means walking down that tree to the first entry with that `caller`, reading the ones that follow (they sit together) and, with each `rowid`, fetching the row from the table.

```btree
title: "The index on caller: entries sorted by number"
keys: ["2398664", "2715504", "2716620", "2741958", "3302871", "4237750", "4239014", "4256641", "4402216", "4417825", "4645119", "4721000", "4721093", "4723310", "4761393", "4837265"]
fanout: 3
find: "4417825"
caption: "Each leaf entry also keeps its row's `rowid`, to jump to the table."
```

```plan
title: "With an index: SEARCH"
setup: CREATE INDEX idx_calls_caller ON calls_1998(caller);
query: |
  SELECT started, callee FROM calls_1998
  WHERE caller = '4417825';
```

Read it top to bottom and outside in. **SCAN** (red) reads the whole table; **SEARCH … USING INDEX** (green) walks down an index; **USING COVERING INDEX** means the index has **every** column the query asks for and the table isn't even opened; **USE TEMP B-TREE** is a temporary tree SQLite builds to sort or group.

**Multi-column indexes and the leftmost prefix.** An index on `(callee, started)` is sorted like a phone book by surname and first name: first by `callee` and, within each `callee`, by `started`. It helps if the query fixes **the first column**; the second only helps after the first.

```figure
title: "Does the index (callee, started) help?"
panes:
  - table:
      head: ["WHERE …", "used?"]
      rows:
        - ["callee = '4721093'", "yes: SEARCH (callee=?)"]
        - ["callee = '4721093' AND started >= '1998-12-18'", "yes: SEARCH (callee=? AND started>?)"]
        - ["callee = '4721093' ORDER BY started", "yes, and it doesn't even sort: they're already in order"]
        - ["started >= '1998-12-18'", "no: SCAN (the first column is missing)"]
        - ["date(started) = '1998-12-18'", "no: SCAN (a function hides the column)"]
```

**Functions on the column.** The index stores `started`, not `date(started)`. If you write `WHERE date(started) = '1998-12-18'`, SQLite has to compute the function on every row: SCAN. The same question as a **range** on the bare column does use the index:

```plan
title: The same day, written as a range
setup: CREATE INDEX idx_calls_started ON calls_1998(started);
query: |
  SELECT count(*) FROM calls_1998
  WHERE started >= '1998-12-18' AND started < '1998-12-19';
```

**`LIKE` with a prefix.** `holder LIKE 'Cerraj%'` could walk an index down to "Cerraj" and read until names stop starting that way. But `LIKE` ignores case, and a normal index doesn't. SQLite only uses it if the index compares the way `LIKE` does: `CREATE INDEX … ON phones_1998(holder COLLATE NOCASE)`. A `LIKE '%Candado%'`, with `%` at the start, can never use an index.

**The cost of `SELECT *`.** With an index on `(callee, started, caller)`, `SELECT started, caller … WHERE callee = …` comes **entirely from the index** (COVERING). With `SELECT *`, every entry forces a jump to the table for the other columns. Ask only for what you'll read.

**And Chasqui's query.** `r.number IN (l.caller, l.callee)` is an `OR` across **two different columns**: no single-column index answers both questions at once, so SQLite SCANs the 60,000 calls **for every number in the queue**. With about 5,000 numbers in the queue, that's about 300 million rows read.

```plan
title: The plan of Chasqui's walk
query: |
  WITH RECURSIVE network(number, hops) AS (
    SELECT '4723310', 0
    UNION
    SELECT CASE WHEN l.caller = r.number THEN l.callee ELSE l.caller END, r.hops + 1
    FROM network AS r
    JOIN calls_1998 AS l ON r.number IN (l.caller, l.callee)
    WHERE r.hops < 4
  )
  SELECT count(*) FROM network;
caption: "The `SCAN l` inside the recursive step repeats for every row in the queue."
```

The way out is splitting the `OR` into two lookups, each with its own index. SQLite allows several recursive parts in one `WITH`, joined with `UNION`:

```sql run
CREATE INDEX idx_calls_caller ON calls_1998(caller);
CREATE INDEX idx_calls_callee ON calls_1998(callee);

WITH RECURSIVE network(number, hops) AS (
  SELECT '4723310', 0
  UNION
  SELECT l.callee, r.hops + 1
  FROM network AS r JOIN calls_1998 AS l ON l.caller = r.number
  WHERE r.hops < 4
  UNION
  SELECT l.caller, r.hops + 1
  FROM network AS r JOIN calls_1998 AS l ON l.callee = r.number
  WHERE r.hops < 4
)
SELECT count(DISTINCT number) AS numbers FROM network;
```

```plan
title: "With both indexes: two SEARCH lines, no SCAN"
setup: "CREATE INDEX idx_a ON calls_1998(caller); CREATE INDEX idx_b ON calls_1998(callee);"
query: |
  WITH RECURSIVE red(number, hops) AS (
    SELECT '4723310', 0
    UNION
    SELECT l.callee, r.hops + 1 FROM red AS r JOIN calls_1998 AS l ON l.caller = r.number WHERE r.hops < 4
    UNION
    SELECT l.caller, r.hops + 1 FROM red AS r JOIN calls_1998 AS l ON l.callee = r.number WHERE r.hops < 4
  )
  SELECT count(*) FROM red;
```

Now it finishes in milliseconds. Each number in the queue walks down two trees and reads only its own calls.

> **Common trap:** an index isn't free. It takes pages, and every `INSERT`, `UPDATE` or `DELETE` has to update **all** of the table's indexes. Don't index every column "just in case": index the columns you **search by** (`WHERE`, `JOIN … ON`), in the order you fix them. And read the plan: if it says SCAN where you expected SEARCH, it's nearly always a function on the column, an `OR`, a `LIKE '%…'` or an index whose first column isn't in the `WHERE`.

<!-- legacy: explain-plan -->

<!-- mdn: explain-plan -->

## Practice

```exercise
id: sql13-predice-objetos
type: predict
title: An index is one more object
prompt: |
  What does it return?
code: |
  CREATE INDEX idx_calls_caller ON calls_1998(caller);
  SELECT type, name FROM sqlite_master
  WHERE tbl_name = 'calls_1998'
  ORDER BY name;
options:
  - "table | calls_1998\nindex | idx_calls_caller"
  - "table | calls_1998"
  - "table | calls_1998\ncolumn | caller"
  - "index | calls_1998\ntable | idx_calls_caller"
answer: "table | calls_1998\nindex | idx_calls_caller"
explain: |
  `sqlite_master` is the catalogue: it keeps every table, index, view and trigger. The index is an object of its own, with its own tree of pages, that belongs to the table (`tbl_name`).
```

```exercise
id: sql13-predice-rango
type: predict
title: A badly closed range
prompt: |
  Someone wanted to replace `date(started) = '1998-12-18'` with a range that can use an index. What does it return?
code: |
  SELECT
    (SELECT count(*) FROM calls_1998 WHERE date(started) = '1998-12-18'),
    (SELECT count(*) FROM calls_1998 WHERE started BETWEEN '1998-12-18' AND '1998-12-18');
options:
  - "1968 | 1968"
  - "1968 | 0"
  - "0 | 1968"
  - "1968 | 1"
answer: "1968 | 0"
explain: |
  `started` is text like `'1998-12-18 22:05:11'`, which is **greater** than `'1998-12-18'` (it's longer and starts the same). `BETWEEN '1998-12-18' AND '1998-12-18'` only accepts the exact text `'1998-12-18'`: no rows. The right range is `started >= '1998-12-18' AND started < '1998-12-19'`.
```

```exercise
id: sql13-completa-indice
type: complete
title: Search, don't scan
prompt: |
  Create an index on `caller` and list `started`, `callee` and `duration_s` of every call home `'4417825'` made in December, in `started` order. The plan must say **SEARCH … USING INDEX**. Replace the `___`.
visual:
  plan:
    title: Today, with no index
    query: SELECT started, callee, duration_s FROM calls_1998 WHERE caller = '4417825' ORDER BY started;
starter: |
  CREATE ___ idx_calls_caller ___ calls_1998(___);

  SELECT started, callee, duration_s
  FROM calls_1998
  WHERE caller = '4417825'
  ORDER BY started;
solution: |
  CREATE INDEX idx_calls_caller ON calls_1998(caller);

  SELECT started, callee, duration_s
  FROM calls_1998
  WHERE caller = '4417825'
  ORDER BY started;
hints:
  - "`CREATE INDEX name ON table(column)`."
tests:
  - name: 4417825's calls, in order
    same: SELECT started, callee, duration_s FROM calls_1998 WHERE caller = '4417825' ORDER BY started
    ordered: true
  - name: the plan searches with the index
    plan: 'SEARCH calls_1998 USING INDEX'
```

```exercise
id: sql13-arregla-funcion
type: fix
title: The function that hides the column
prompt: |
  There's already an index on `started`. This query lists the calls from 23:00 on Friday 18th until midnight, but its plan says SCAN: `date` and `time` hide the column. Rewrite the `WHERE` as a range on `started` so the plan searches with `idx_calls_started`. The result must not change.
setup: CREATE INDEX idx_calls_started ON calls_1998(started);
visual:
  plan:
    title: Today's plan
    setup: CREATE INDEX idx_calls_started ON calls_1998(started);
    query: SELECT id, caller, callee, started FROM calls_1998 WHERE date(started) = '1998-12-18' AND time(started) >= '23:00' ORDER BY started, id;
starter: |
  SELECT id, caller, callee, started
  FROM calls_1998
  WHERE date(started) = '1998-12-18' AND time(started) >= '23:00'
  ORDER BY started, id;
solution: |
  SELECT id, caller, callee, started
  FROM calls_1998
  WHERE started >= '1998-12-18 23:00' AND started < '1998-12-19'
  ORDER BY started, id;
hints:
  - "From `'1998-12-18 23:00'` (included) up to `'1998-12-19'` (not included)."
tests:
  - name: the same calls, in order
    same: SELECT id, caller, callee, started FROM calls_1998 WHERE date(started) = '1998-12-18' AND time(started) >= '23:00' ORDER BY started, id
    ordered: true
  - name: the plan searches with idx_calls_started
    plan: 'SEARCH calls_1998 USING (COVERING )?INDEX idx_calls_started'
```

```exercise
id: sql13-escribe-cubre
type: write
title: An index that's enough
prompt: |
  Create **one** index and write the query listing `started` and `caller` of **every** call the guard booth `'4721093'` received in December, in `started` order. The plan must come **entirely from the index** (COVERING INDEX) and **without** `TEMP B-TREE`: no opening the table, no separate sort.
visual:
  figure:
    title: What the index has to hold
    panes:
      - label: "WHERE"
        value: "callee = …"
      - label: "ORDER BY"
        value: "started"
      - label: "SELECT"
        value: "started, caller"
starter: |
  SELECT started, caller
  FROM calls_1998
  WHERE callee = '4721093'
  ORDER BY started;
solution: |
  CREATE INDEX idx_calls_callee_started_caller ON calls_1998(callee, started, caller);

  SELECT started, caller
  FROM calls_1998
  WHERE callee = '4721093'
  ORDER BY started;
hints:
  - "First the column you fix in the `WHERE`, then the `ORDER BY` one (so rows already come out sorted) and last the one you only read."
tests:
  - name: the calls to the booth, in order
    same: SELECT started, caller FROM calls_1998 WHERE callee = '4721093' ORDER BY started
    ordered: true
  - name: the index covers the query
    plan: 'COVERING INDEX'
  - name: no separate sort
    planNot: 'TEMP B-TREE'
```

```exercise
id: sql13-escribe-like
type: write
title: The locksmiths in the phone book
prompt: |
  List `number` and `holder` of the phones whose holder **starts** with "cerraj" (Spanish for locksmith), whatever the case (the book has "Cerrajería", "CERRAJERIA" and "cerrajería"), ordered by `holder`. Create the index that lets the plan **search** `phones_1998` instead of reading it all.
starter: |
  SELECT number, holder
  FROM phones_1998
  WHERE holder LIKE 'cerraj%'
  ORDER BY holder;
solution: |
  CREATE INDEX idx_phones_holder ON phones_1998(holder COLLATE NOCASE);

  SELECT number, holder
  FROM phones_1998
  WHERE holder LIKE 'cerraj%'
  ORDER BY holder;
hints:
  - "`LIKE` ignores case; the index has to compare the same way: `holder COLLATE NOCASE`."
tests:
  - name: the locksmiths, in order
    same: SELECT number, holder FROM phones_1998 WHERE holder LIKE 'cerraj%' ORDER BY holder
    ordered: true
  - name: the plan searches phones_1998
    plan: 'SEARCH phones_1998 USING'
```

## The case

```exercise
id: sql13-caso-cerrajeria
type: case
title: The technician nobody sent
prompt: |
  **Which locksmith did the three suspects' homes call most in December?** Type the name as it appears in the phone book.

  Teodoro let in "a safe technician". Víctor swore he doesn't know any locksmith. Find the home phones of Víctor (318), Rosa (214) and Nilton (405) and, in `calls_1998`, which phone-book numbers whose holder starts with "Cerraj" (locksmith, in Spanish) they called. If the query is slow, you know which index to create.
visual:
  - setting:
      case: frio
  - schema:
      tables: [employees_1998, calls_1998, phones_1998]
starter: |
  -- Step 1: the three home phones
  SELECT id, name, phone
  FROM employees_1998
  WHERE id IN (214, 318, 405);
solution: |
  SELECT t.holder, l.caller, count(*) AS calls
  FROM calls_1998 AS l
  JOIN phones_1998 AS t ON t.number = l.callee
  WHERE l.caller IN ('4417825', '4402216', '2741958')
    AND t.holder LIKE 'Cerraj%'
  GROUP BY t.holder, l.caller
  ORDER BY calls DESC;
answer: Cerrajería El Candado
answerLabel: Which locksmith did they call most?
reveal: |
  **Cerrajería El Candado**, Jr. Huánuco 1290, "safes and keys". It got **five** calls from home **4417825** between 12 and 18 December, the last at 22:58 on the night of the robbery. The only other call to a locksmith went from Rosa's home to Cerrajería Lima on 2 December, in the morning. That home is Víctor's (you saw it in step 1), the man who swore he knew no locksmith. It remains to prove the call to the booth came from there.
hints:
  - "The three phones: `4417825`, `4402216` and `2741958`. Join `calls_1998` to `phones_1998` on `t.number = l.callee`."
  - "Filter `t.holder LIKE 'Cerraj%'`, group by holder and caller and order by the count."
```

## The judge

```exercise
id: sql13-juez-un-dia
type: judge
title: One day's calls, no functions
prompt: |
  **Return `id`, `callee` and `started` of the calls the requested number made on the requested day, ordered by `started` and then `id`. Write the condition so the index `(caller, started)` can be used: no functions on `started`.**

  The exchange wants a fast report over millions of calls, so the table already has the index `idx_calls_caller_started ON calls(caller, started)`. `started` is text `'YYYY-MM-DD HH:MM:SS'`. A call that starts at `00:00:00` on the next day is **not** from that day.

  **Tables:** `calls(id, caller, callee, started)` (with the index) and `request(number, day)`, with a single row; `day` is `'YYYY-MM-DD'`.

  **Result:** `id`, `callee` and `started`, ordered by `started` and then `id`.
schema: |
  CREATE TABLE calls (id INTEGER, caller TEXT, callee TEXT, started TEXT);
  CREATE INDEX idx_calls_caller_started ON calls(caller, started);
  CREATE TABLE request (number TEXT, day TEXT);
ordered: true
starter: |
  SELECT id, callee, started
  FROM calls
  WHERE caller = (SELECT number FROM request)
  ORDER BY started, id;
solution: |
  SELECT id, callee, started
  FROM calls
  WHERE caller = (SELECT number FROM request)
    AND started >= (SELECT day FROM request)
    AND started < (SELECT date(day, '+1 day') FROM request)
  ORDER BY started, id;
hints:
  - "Functions are fine on the **other** side: `started < date(day, '+1 day')` leaves `started` bare."
  - "The day starts at `day` (included) and ends before `date(day, '+1 day')` (not included)."
tests:
  - name: doesn't wrap started in a function
    sourceNot: '\b(date|datetime|strftime|substr|time|julianday)\s*\(\s*(\w+\.)?started\b'
    msg: A function on started stops the index from being used; compare started with a range.
samples:
  - rows:
      calls: [[1, "4417825", "4256641", "1998-12-18 22:58:26"], [2, "4417825", "4723310", "1998-12-18 23:36:15"], [3, "4417825", "4256641", "1998-12-17 21:05:18"], [4, "4402216", "4721093", "1998-12-18 10:00:00"]]
      request: [["4417825", "1998-12-18"]]
    note: "Calls 1 and 2 are from the 18th and from that number. Call 3 is from the 17th and call 4 is from another number."
  - rows:
      calls: [[7, "100", "200", "1998-12-19 00:00:00"], [6, "100", "300", "1998-12-18 23:59:59"], [5, "100", "400", "1998-12-18 00:00:00"]]
      request: [["100", "1998-12-18"]]
    note: "00:00:00 on the 18th counts; 00:00:00 on the 19th doesn't."
edge:
  - rows: { calls: [], request: [["100", "1998-12-18"]] }
    tag: with no calls
  - rows: { calls: [[2, "100", "201", "1998-12-18 23:59:30"], [1, "100", "200", "1998-12-18 23:59:30"], [3, "100", "202", "1998-12-19 00:00:00"]], request: [["100", "1998-12-18"]] }
    tag: around midnight, with ties
  - rows: { calls: [[1, "100", "200", "1998-12-31 23:10:00"], [2, "100", "200", "1999-01-01 00:00:00"]], request: [["100", "1998-12-31"]] }
    tag: on New Year's Eve
random:
  count: 40
  seed: 1313
  generate: |
    const nums = ["100", "200", "300", "400"];
    const two = (x) => String(x).padStart(2, "0");
    const n = rng.int(0, 14);
    const rows = [];
    for (let i = 0; i < n; i++) {
      const d = rng.int(17, 19);
      const edge = rng.chance(0.25);
      const t = edge ? rng.pick(["00:00:00", "23:59:59", "23:59:30"]) : `${two(rng.int(0, 23))}:${two(rng.int(0, 59))}:${two(rng.int(0, 59))}`;
      rows.push([i + 1, rng.pick(nums), rng.pick(nums), `1998-12-${d} ${t}`]);
    }
    return { calls: rows, request: [[rng.pick(nums), "1998-12-18"]] };
wrong:
  - |
    SELECT id, callee, started FROM calls WHERE caller = (SELECT number FROM request) AND started BETWEEN (SELECT day FROM request) AND (SELECT date(day, '+1 day') || ' 00:00:00' FROM request) ORDER BY started, id;
  - |
    SELECT id, callee, started FROM calls WHERE caller = (SELECT number FROM request) AND started >= (SELECT day FROM request) AND started <= (SELECT day || ' 23:59' FROM request) ORDER BY started, id;
  - |
    SELECT id, callee, started FROM calls WHERE caller = (SELECT number FROM request) AND started >= (SELECT day FROM request) AND started < (SELECT date(day, '+1 day') FROM request) ORDER BY started;
```

## Final mission

```exercise
id: sql13-mision-relevo
type: mission
title: The relays to the guard booth
prompt: |
  **Find December's "relays": someone calls a public phone and, within the next 10 minutes, that same public phone calls the guard booth `'4721093'`.** Show `caller` (who called the public phone), `public_phone`, `rings_at` (when the public phone rang) and `to_booth` (when the public phone called the booth), ordered by `rings_at`. Create whatever index it needs: the plan must **search with your index**, not an automatic one. Then say how many relays there were.

  It's a self-join of `calls_1998` (`a` comes into the public phone, `b` goes from the public phone to the booth) plus `phones_1998` to know the number in the middle is a public phone (`kind = 'public'`).

  Once your query proves it and you answer, together with the judge, session 14 opens.
visual:
  - setting:
      case: frio
  - network:
      title: "A relay: two calls in a chain"
      clockLabel: "Since the first call"
      clockMax: 600
      nodes:
        - {"id": "h", "icon": "person", "label": "Home 4417825", "sub": "who calls first"}
        - {"id": "p", "icon": "box", "label": "Public phone 4723310", "sub": "Av. México, opposite the mill"}
        - {"id": "c", "icon": "person", "label": "Booth 4721093", "sub": "Teodoro, on watch"}
      links:
        - {"id": "a", "kind": "phone", "label": "call a", "busy": "ringing"}
        - {"id": "b", "kind": "phone", "label": "call b", "busy": "ringing"}
      steps:
        - phase: "Call a"
          move: ["h", "p"]
          packet: {"kind": "up", "label": "call at 23:36:15"}
          busy: ["a"]
          clock: 0
          clockText: "0 s"
          note: "Friday 18, 23:36:15: the home calls the public phone. In `calls_1998` this is row `a`."
        - phase: "Call b"
          move: ["p", "c"]
          packet: {"kind": "up", "label": "call at 23:41:02"}
          busy: ["b"]
          clock: 287
          clockText: "4 min 47 s"
          note: "The same public phone calls the booth: row `b`. Its `caller` is the `callee` of `a`."
        - phase: "It is a relay"
          at: "p"
          tags: {"p": "under 10 min = relay"}
          clock: 287
          clockText: "4 min 47 s"
          note: "Less than 10 minutes passed between `a` and `b`: `b.started BETWEEN a.started AND a.started + 10 minutes`. That is what your query counts for the whole of December."
starter: |
  SELECT a.caller, a.callee AS public_phone, a.started AS rings_at, b.started AS to_booth
  FROM calls_1998 AS a
  JOIN calls_1998 AS b
    ON b.caller = a.callee
   AND b.started BETWEEN a.started AND datetime(a.started, '+10 minutes')
  JOIN phones_1998 AS t ON t.number = a.callee
  WHERE b.callee = '4721093'
    AND t.kind = 'public'
  ORDER BY rings_at;
solution: |
  CREATE INDEX idx_calls_callee_started ON calls_1998(callee, started);

  SELECT a.caller, a.callee AS public_phone, a.started AS rings_at, b.started AS to_booth
  FROM calls_1998 AS a
  JOIN calls_1998 AS b
    ON b.caller = a.callee
   AND b.started BETWEEN a.started AND datetime(a.started, '+10 minutes')
  JOIN phones_1998 AS t ON t.number = a.callee
  WHERE b.callee = '4721093'
    AND t.kind = 'public'
  ORDER BY rings_at;
answer: "2"
answerLabel: How many relays were there in December?
reveal: |
  **Two**, both from the same home, **4417825**: on **Tuesday 15th** (23:21 → 23:26), the night Teodoro says he was "warned" about the technician, and on **Friday 18th** (23:36 → 23:41), the call that fooled him. Neither Rosa's home nor Nilton's shows up: Nilton is ruled out. Look at the plan: SQLite starts from the calls **to the booth** (few, thanks to your index) and, for each, searches the same index for the ones that came into the public phone just before.
hints:
  - "The query is already right: what's missing is the index. Which columns do the `WHERE` and the `ON` fix? `b.callee = '4721093'` and, for `a`, `a.callee = b.caller` with `a.started` in a range."
  - "`CREATE INDEX idx_calls_callee_started ON calls_1998(callee, started);` works for both sides of the self-join."
tests:
  - name: the relays to the booth, in order
    same: SELECT a.caller, a.callee, a.started, b.started FROM calls_1998 a JOIN calls_1998 b ON b.caller = a.callee AND b.started BETWEEN a.started AND datetime(a.started, '+10 minutes') JOIN phones_1998 t ON t.number = a.callee WHERE b.callee = '4721093' AND t.kind = 'public' ORDER BY a.started
    ordered: true
  - name: columns caller, public_phone, rings_at and to_booth
    columns: [caller, public_phone, rings_at, to_booth]
  - name: the plan searches with your index (not an automatic one)
    plan: 'USING (COVERING )?INDEX'
    msg: Create an index with CREATE INDEX before the query.
```

## Expert challenge

```exercise
id: sql13-reto-or
type: challenge
title: Chasqui's walk, fast
prompt: |
  **Return how many distinct numbers are 3 calls or fewer from the public phone `'4723310'` over all of December (the starting number included), with a query whose plan searches with your own indexes in both directions.** One row and one column, `numbers`.

  For those who already code: it's the query from the job, with 3 calls instead of 4. Split the `OR` into two recursive parts, one walking an index on `caller` and the other one on `callee`. With `UNION` (not `UNION ALL`) a repeated `(number, hops)` pair isn't expanded again; outside, count distinct numbers.
starter: |
  WITH RECURSIVE network(number, hops) AS (
    SELECT '4723310', 0
    UNION
    SELECT CASE WHEN l.caller = r.number THEN l.callee ELSE l.caller END, r.hops + 1
    FROM network AS r
    JOIN calls_1998 AS l ON r.number IN (l.caller, l.callee)
    WHERE r.hops < 1
  )
  SELECT count(DISTINCT number) AS numbers FROM network;
solution: |
  CREATE INDEX idx_calls_caller ON calls_1998(caller);
  CREATE INDEX idx_calls_callee ON calls_1998(callee);

  WITH RECURSIVE network(number, hops) AS (
    SELECT '4723310', 0
    UNION
    SELECT l.callee, r.hops + 1
    FROM network AS r JOIN calls_1998 AS l ON l.caller = r.number
    WHERE r.hops < 3
    UNION
    SELECT l.caller, r.hops + 1
    FROM network AS r JOIN calls_1998 AS l ON l.callee = r.number
    WHERE r.hops < 3
  )
  SELECT count(DISTINCT number) AS numbers FROM network;
hints:
  - "The starter is fast only because it stops at 1 hop. With 3, the `OR` does a SCAN for every number in the queue."
tests:
  - name: how many numbers are 3 calls away or fewer
    same: WITH RECURSIVE x(a, b) AS (SELECT caller, callee FROM calls_1998 UNION ALL SELECT callee, caller FROM calls_1998), r(n, s) AS (SELECT '4723310', 0 UNION SELECT x.b, r.s + 1 FROM r JOIN x ON x.a = r.n WHERE r.s < 3) SELECT count(DISTINCT n) FROM r
  - name: searches with an index on caller
    plan: 'USING (COVERING )?INDEX \w+ \(caller=\?\)'
  - name: and with one on callee
    plan: 'USING (COVERING )?INDEX \w+ \(callee=\?\)'
```
