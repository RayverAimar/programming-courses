# The SQL track

`content/sql/` is the third track. It has the same session shape as the others
([content.md](content.md), [exercises.md](exercises.md), [visuals.md](visuals.md)): the job, the minimum,
practice, the case, judges, a final mission and an expert challenge. What changes is that the learner
investigates **Lima's case files**, one persistent database that grows with the course, and that every
idea about how SQL works inside is drawn and animated. The idea comes from Knight Lab's *SQL Murder
Mystery* (investigate by querying a living database); none of its data, story or text is used.

## How SQL runs

- **Engine.** SQLite through sql.js (WebAssembly), in a worker (`src/runner/sqlworker.js`, page side
  `src/runner/sqlclient.js`). The world is built once per language per worker and every run starts
  from a fresh copy. A run over 4 s (1.5 s per judge case) kills the worker; the next run starts a new one.
- **Shared engine.** `src/sql/engine.js` runs statements one by one (keeping column types, so REAL
  shows like SQLite shows it: `3.0`), evaluates tests, builds and judges cases and explains SQLite's
  errors in plain words (`src/sql/messages.js`). The worker, the build (`scripts/lib/sqlhost.mjs`) and
  `verify.mjs` all use it, so what the build checks is what the page runs.
- **The world.** `src/sql/schema.js` lists every table with Spanish and English names, types, keys and
  column descriptions. `src/sql/world.js` generates the background rows from a seed; each case plants
  its trail in `src/sql/plots/<case>.js` (listed in `plots/index.js`). Values that are words (`'salida'`
  / `'out'`, `'blanco'` / `'white'`, free text) are written `w(es, en)`; everything else is identical.
  The world is fixed in March 2026; never use `'now'` in content.
- **Dirty on purpose.** About 5 % of names are badly typed (case, accents, spaces), 16 % of camera
  plates are written as read (`b7r415`, `D9K 731`), camera times are UTC while everything else is
  Lima time, some phones, colours, districts and occupations are `NULL`, and 2 % of card swipes are
  doubled a few seconds apart.

## Writing SQL content

Everything in exercises.md holds, with these differences.

**Code is SQLite SQL, written the standard way.** Keywords in capitals, text in single quotes, one
clause per line, `JOIN … ON` (never comma joins), `IS NULL`, `COALESCE`, `CASE`. Say where SQLite
differs from PostgreSQL/MySQL (integer division, `LIKE` and case, aliases in `WHERE`, double-quoted
strings, no date type, `RIGHT`/`FULL JOIN` since 3.39) when the session meets it.

**Code in the page's language.** Spanish pages query `personas`, `ingresos_mercado`, `'salida'`;
English pages query `people`, `market_entries`, `'out'`. Aliases follow the page (`AS antiguedad` /
`AS age`); `verify.mjs` checks aliases and CTE names with the word lists, and running the solution
against that language's world catches a table or column in the wrong language.

**Blocks.** ```` ```sql run ```` is a runnable example on the world (the learner can edit it); verify
checks it runs and prints the same in the system's `sqlite3`. Other ```` ```sql ```` blocks are
highlighted.

**Where an exercise's data comes from.** By default the world. `setup:` (SQL) runs first, on the
exercise and on each scenario; `db: empty` starts from an empty database (for DDL and DML lessons).
`tables: [personas, vehiculos]` sets the tables the Schema tab draws (by default, those the solution
names). A `predict` shows its result as text: rows on lines, cells joined by ` | `, `NULL` as `NULL`.

**Tests** (each test has a `name`, exactly one check and an optional `msg`):

| check | passes when |
|---|---|
| `same: <SQL>` | the result equals the reference query's result on a fresh copy of the same data; `ordered: true` compares the order, `names: true` the column names; otherwise rows are a multiset and only column count/order matter |
| `value: <v>` | the result is one cell equal to `v` |
| `rows: <n>` | the result has `n` rows |
| `columns: [a, b]` | the result's column names (case-insensitive) |
| `db: <SQL>` (+ `equals`) | after the code ran, that query's first cell is truthy (or equals); for INSERT/UPDATE/DELETE/DDL |
| `fails: <SQL>` (+ `error: <regex>`) | after the code ran, that statement is refused (a constraint, a trigger's `RAISE`); `error` matches SQLite's message |
| `plan: <regex>` / `planNot:` | `EXPLAIN QUERY PLAN` of the result's SELECT (or the last SELECT), on the learner's database (after their `CREATE INDEX`), matches; e.g. `'USING (COVERING )?INDEX'` |
| `source:` / `sourceNot:` | the code without comments matches (case-insensitive) |
| `output:` / `outputIncludes:` | the result as text |

**The result** is the latest statement's table that passes every result check (`same`, `value`, `rows`,
`columns`, `output`); if none does, the last one. So a learner can look something up after the query that
proves it (S4: who owns the receiving phone) without breaking the checks, and the solution can be written in
the order a learner would write it.

A failing `same` explains itself: row count, a missing or extra row, or "right rows, wrong order". In a
**mission**, and on a judge's **hidden** cases, no message shows an expected value: not the expected rows,
count, cell, database value or text. They say the result has more or fewer rows than it should, which of the
learner's own rows doesn't belong (and which of its columns differ from the closest expected row), or that the
order is wrong. Test names and `msg`s in a mission must not give the answer away either; verify checks the
starter's and every `wrong`'s messages and the names against a word answer.
Prefer `same` + `ordered` to anything else; add a `source` test when the session's concept must be
used (`IS NULL`, `CASE`, `JOIN`), because a learner can reach the same rows another way.

**Cases** have an `answer` (hashed, compared ignoring case, accents and spaces): something the learner
reads in the results, often a name in free text. The starter queries the right table but never shows
the answer (verify checks it). **Missions** are cases with tests: the query that proves it must pass,
then the learner names the finding (`answer`, `answerLabel`, `reveal`); the answer may be a value in
the result or its row count. The last mission of a case names the culprit.

**Judges** run the learner's query on small databases of their own:

```yaml
type: judge
schema: |
  CREATE TABLE puestos (numero INTEGER, nombre TEXT, abre TEXT);   # in the page's language
ordered: true            # row order counts (the statement must say how to sort)
names: false             # column names count
check: SELECT …          # optional: compared after the code instead of its result (DML judges)
samples:
  - rows: { puestos: [[47, "Loop", "05:45"], …] }
    note: …
edge:
  - rows: { puestos: [] }
    tag: con la tabla vacía
random:
  count: 40
  seed: 101
  generate: |              # JavaScript; returns { table: [[row], …] }; rng: int, pick, list, next, chance
    return { puestos: … };
wrong: [ … ]               # each must fail; at least two, plausible
```

Row values must be identical in both languages (only table and column names change), so keep judge
data neutral: numbers, names, plates, times. Verify checks the generator is deterministic, the
reference passes, the starter and every `wrong` fail and the data matches across languages. Session
1's judge section explains SQL judges once. The sample tables and expected results are drawn as
tables, so a judge needs no extra figure.
Tables that sit side by side (the judge's tables and expected result, a failed case's three tables, the left
and right of a join) line their header rows up on one line: the tables column names each table and the others
reserve that line. Below 34 rem (examples) or 48 rem (a failed case) they stack, which is what a phone gets. A table
wider than its box scrolls inside it and says so with a line under it (`scrollhint.js`).

## Visuals

Everything from visuals.md, plus these (fence ES / EN, and the `visual:` key, which is always the
English one: `er`, `result`, `order`…):

| fence | key | what it is | data |
|---|---|---|---|
| `escenario` / `setting` | `setting` | the case's place, drawn top-down (pixel-art SVG), clues pinned and revealed with progress | `case: surquillo`, or `place:` + `marks:` |
| `pizarra` / `caseboard` | `caseboard` | the case board: scene, witnesses, suspects (sprite dossiers), clue notes with red strings, stamps | `case:` |
| `expediente` / `dossier` | `dossier` | dossier cards with sprite, role, rows and a quote | `cards: [{ name, kind, traits, role, rows, quote }]` |
| `esquema` / `schema` | `er` | ER diagram of world tables, FK lines drawn | `tables: [...]` (or `query:`) |
| `resultado` / `result` | `result` | a query's result table (computed at build) | `query`, optional `tables`/`setup` |
| `orden` / `order` | `order` | run order: written vs executed lanes, the row set after FROM, WHERE (struck rows), GROUP BY (coloured groups), HAVING, SELECT, DISTINCT, ORDER BY, LIMIT; computed at build and checked against the real result | `query` (one SELECT), `tables:` inline (`name: { cols, rows }`) or the world |
| `junta` / `join` | `join` | nested-loop pairing: each left row looks for partners; matches, fan-out, NULL padding, comparison count | `left`, `right` (`{ name, cols, rows }`), `on: [lcol, rcol]`, `type: inner\|left\|full\|semi\|anti`, `query` |
| `grupos` / `groups` | `groups` | rows falling into buckets, each with its accumulator (AVG keeps sum and count, COUNT(col) skips NULL), HAVING greys out | `table`, `by`, `agg: [{ fn, col, as }]`, `having: 'g["COUNT(*)"] >= 2'`, `query` |
| `ventana` / `window` | `window` | a window function row by row: partition bands, the frame, the new column | `table`, `partition`, `order` (`desc: true` to sort downwards), `fn` (sum, avg, count, min, max, row_number, rank, dense_rank, lag, lead, first_value, last_value), `col`, `frame: [-2, 0]` (or `unbounded`), `offset`, `as`, `query` |
| `arbol` / `btree` | `btree` | B-tree pages by level and the path of a lookup; pages read vs full scan | `keys` or `n` + `step`, `fanout`, `find` |
| `plan` / `plan` | `plan` | `EXPLAIN QUERY PLAN` as a tree: SCAN (red), SEARCH USING INDEX (green), COVERING INDEX, TEMP B-TREE | `query`, `setup` (e.g. `CREATE INDEX …`) |
| `transaccion` / `transaction` | `txn` | two sessions in time and the committed state | `lanes`, `steps: [{ lane, sql, sees, db, note }]` |
| `logica` / `logic` | `logic` | TRUE / FALSE / NULL truth tables | `ops: [and, or, not]` |
| `vueltas` / `recursion` | `recursion` | a recursive CTE round by round: anchor, then each round's new rows, until a round adds none (computed at build) | `query` (a `WITH RECURSIVE`), `by` (the column counting rounds), optional `tables`/`setup` |
| `algoritmo` / `joinalgo` | `joinalgo` | the same join as nested loop, hash join (buckets) or merge join (two sorted lists), with the comparison count | `left`, `right` (`{ name, cols, rows }`), `on: [lcol, rcol]`, `algo: nested\|hash\|merge`, `buckets` |
| `correlada` / `correlated` | `correlated` | a correlated subquery row by row: the outer rows, the inner query with that row's values, its result and whether the row stays; counts the runs | `outer` (SQL), `inner` (SQL with `:col` for the outer row's columns), `keep` (SQL over `:col` and `:sub`), `query` (checked: its rows must be the kept ones; `sketch: true` skips the check for a query with gaps), `tables:` inline or the world, `subLabel` |
| `conjuntos` / `sets` | `sets` | two lists in a Venn diagram, stepping through UNION, UNION ALL, INTERSECT, EXCEPT with each result | `a`, `b`: `{ label, query }` (first column) or `{ label, rows }`; `ops` |
| `cte` / `cte` | `cte` | WITH as a chain of named boxes, each with its SQL and its rows, then the final query | `steps: [{ name, sql }]`, `final`, `show` (rows per box) |
| `cambio` / `change` | `change` | statements that change data, one step each: every table before and after (new rows green, deleted struck, changed cells "old → new"), what RETURNING gave back, or the error that undid the whole statement; computed at build | `setup` (its own tables; or `world: true` + `show`), `sql`, `notes: [per statement]`, `expectError: true` when a statement is meant to fail |
| `traduccion` / `translation` | `port` | a query moved between dialects piece by piece, the current pair lit | `from`, `to`, `steps: [{ a, b, note }]` |

**Drawing the cases in time.** Each case has a picture of its key night or period that fills in as
the learner advances: a `figure` with a `timeline` (the robbery of 1998, the night of the gyroscope)
or `lanes` where events overlap (the sensor room, Friday 20 at the registry). Every entry carries
`by: <exercise id>` and shows as a locked "?" until that exercise is passed, so the same block is
pasted in each session's encargo or mission without giving anything away; the whole case reads at
the end. Keys for things that look alike live in `figure` tables (`table.by` locks rows): the
7-digit phone numbers of 1998 (S12 to S14), the room's cards (S10) and who is who at the registry
(S15). Chains between rows use the `network` pane: the row-by-row join of S5, the payment ring
(S6, S8) and the S13 relay as two phone calls. Parallel lanes are documented in
[visuals.md](visuals.md#parallel-lanes).

Results the learner gets are result tables too (row count, NULL in violet, long text wrapped, "Ver
50 más"), and an `EXPLAIN QUERY PLAN` the learner runs is drawn as a plan tree. A result table wider than its
box scrolls inside it with a shade on the side that has more; a Markdown table does the same with a fade
(`src/scrollhint.js`), and code in a table cell breaks only between words.

**Sprites** (`src/sql/sprites.js`): `person`, `robot`, `chasqui`, `unknown`, `note`; the same name
always gets the same face. `traits` fixes details: `style` (short, long, bun, cap, curly), `hair`,
`skin`, `shirt`, `capColor`, `glasses`, `beard`, `earrings`, `hood`, `vest`, `tool`, `broken` (robot).

**Places** (`src/sql/scenes.js`): `mercado` (spots `gate1–3`, `cam1–3`, `stall47`, `car3`, `street`),
`distritos` (one spot per district, `gamarra`), `taller` (`board`, `desk`, `chasqui`), `pagos` (`center`,
`a`–`f`), `sensores` (`rack1`, `rack2`, `monitor`, `pad1–3`), `fabrica` (the 1998 textile mill: `caja`, `oficina`, `caseta`, `lateral`, `publico`, `nave`, `calle`, `patio`), `oficina` (the Markets Office: `v1`, `v2`,
`server`, `archivo`, `sis`, `laptop`, `door`). A new place is one more entry with its
`draw()` and `spots`.

**In the Taller** a SQL exercise's tool pane has tabs: **Consulta** (editor and results), **Esquema**
(ER diagram of its tables, or the judge's tables) and, for a case or mission, **Pizarra** (the case
board, which opens by itself when the learner names a finding).

## The case files: `content/sql/_cases.yml`

One entry per case: `title`, `place`, `marks` (`at`, `by`, `label`), `witnesses`, `suspects`
(`name`, `kind`, `traits`, `role`, `alibi`, `appears_by`, `cleared_by`, `culprit`, `reveal_by`) and
`clues` (`by`, `where`, `text`, `links: [names]`). Text is `{ es, en }`; the rest is shared. `by` is an
exercise id: the clue shows up once that exercise passes. A session joins its case with
```` ```session ```` `case: surquillo`; its cases and missions then carry the board.

## Adding a session

1. Read the reference sessions (`01-consultas.md`, `02-filtros.md`, `03-funciones.md`, in both
   languages) and the row of the plan below.
2. If the session's case needs new rows, add them to its plot (`src/sql/plots/<case>.js`); a new case
   adds a plot file and lists it in `plots/index.js`; a new table goes at the end of `TABLES` in
   `schema.js` with both names and descriptions. Plant after the background so ids stay stable;
   filter the background where it would create a false trail (see `surquillo.js`). Check facts with a
   quick query before writing.
3. Add the case's clues, marks and suspects to `_cases.yml`, with the exercise ids you'll use.
4. Write `content/sql/NN-slug.md` and `content/i18n/en/sql/NN-slug.md`: same sections, same ids, the
   same number of options, hints and tests; recompute every `predict` answer in English (text values
   change). Exercise ids are `sqlN-kind-name`.
5. Add the session's legacy boxes to `_modern.yml` (old or other-engine form vs ours).
6. `node scripts/verify.mjs sql/NN` (both languages), then look at it at 393 and 2000 px, light and
   dark, ES and EN.

## The plan

Eighteen sessions, five cases. Each session teaches its row in order; its case, mission and judge
use the session's concept on the case's data. Every session has a scene of its case, at least one
step-by-step diagram in "Lo mínimo" and the board in its case and mission.

| # | file | title | must teach | case |
|---|---|---|---|---|
| 1 | `01-consultas.md` | Tus primeras consultas | **Por qué existe SQL**; SELECT, columns, `*`, expressions, `AS`; FROM; WHERE with comparisons and AND; text in single quotes; dates as ISO text; ORDER BY (DESC, several keys); LIMIT/OFFSET; written order vs run order (animation); integer division | 1 |
| 2 | `02-filtros.md` | Filtros, NULL y DISTINCT | AND/OR precedence and brackets, NOT, IN, BETWEEN, LIKE (`%`, `_`, case only for ASCII), NULL and three-valued logic (truth tables), IS NULL, `NOT IN` with NULL, DISTINCT | 1 |
| 3 | `03-funciones.md` | Funciones: textos, fechas y CASE | text functions, `\|\|`, nesting; date/time functions and modifiers, UTC → Lima, strftime, julianday; CASE (both forms); COALESCE/IFNULL/NULLIF; CAST, type affinity, `'10' < '9'`; functions in WHERE cost a scan | 1 |
| 4 | `04-agregacion.md` | Agregar: grupos y totales | COUNT(*) vs COUNT(col) vs COUNT(DISTINCT), SUM/TOTAL/AVG/MIN/MAX as accumulators (groups diagram), GROUP BY (also by expressions like `date(momento)`), HAVING vs WHERE (order animation with groups), aggregates and NULL, group_concat, SQLite's bare columns trap | 1 — **names the culprit** |
| 5 | `05-joins.md` | Unir tablas con JOIN | the relational model: tables as sets/bags, primary and foreign keys, the ER diagram; INNER JOIN as row pairing (join animation), aliases, three or more tables, USING, the comma join (legacy), CROSS JOIN and the Cartesian product, fan-out duplicates | 2 |
| 6 | `06-joins-externos.md` | LEFT JOIN, autojoins y antijoins | LEFT/RIGHT/FULL (SQLite ≥ 3.39), NULL padding, a filter in ON vs WHERE on an outer join, self-joins (A paid B who paid C; calls back), anti-joins (LEFT JOIN … IS NULL, NOT EXISTS), semi-joins (EXISTS), counting after a fan-out | 2 |
| 7 | `07-subconsultas.md` | Subconsultas | scalar subqueries, IN (subquery), NOT IN with NULL again vs NOT EXISTS, correlated subqueries (run once per row, drawn step by step), derived tables in FROM, comparing with an aggregate (above the average) | 2 |
| 8 | `08-with-y-conjuntos.md` | WITH y operaciones de conjuntos | CTEs to name steps, several CTEs, UNION / UNION ALL / INTERSECT / EXCEPT, set thinking (Venn), views as saved queries (preview) | 2 — **names the culprit** |
| 9 | `09-ventanas.md` | Funciones de ventana | OVER(), PARTITION BY, ORDER BY in a window, ROW_NUMBER/RANK/DENSE_RANK (window diagram), top-N per group, window vs GROUP BY (rows kept), where windows run in the order of evaluation | 3 |
| 10 | `10-marcos.md` | Marcos, acumulados, LAG y LEAD | frames ROWS/RANGE BETWEEN, running totals, moving averages, LAG/LEAD deltas, gaps and islands, first_value/last_value and the default frame trap | 3 |
| 11 | `11-json-y-series.md` | JSON y series de tiempo | json_extract, `->` and `->>`, json_each, json_group_array, bucketing time with strftime, comparing with the previous period, finding missing readings | 3 — **names the culprit** |
| 12 | `12-recursion.md` | WITH RECURSIVE | recursive CTEs as iterations (iteration diagram), number and date series, hierarchies (who reports to whom), graph walks over the call graph with depth limits and cycle checks, path strings | 4 |
| 13 | `13-por-dentro.md` | Por dentro: páginas, B-trees e índices | the file as pages, tables as B-trees by rowid (btree diagram), CREATE INDEX, EXPLAIN QUERY PLAN as a tree (plan diagram), SCAN vs SEARCH, covering indexes, composite indexes and the leftmost prefix, functions on indexed columns, LIKE prefixes, the cost of SELECT *; `plan:` tests | 4 |
| 14 | `14-el-planificador.md` | El planificador y los joins por dentro | how the planner picks a join order, nested loops and automatic indexes in SQLite, hash and merge joins in PostgreSQL (drawn), sorting with a temp B-tree, ANALYZE and statistics, measuring; the mission needs a plan that uses an index | 4 — **names the culprit** |
| 15 | `15-escribir-datos.md` | INSERT, UPDATE y DELETE | INSERT (VALUES, SELECT), UPDATE and DELETE with WHERE (and the one without), RETURNING, UPSERT (ON CONFLICT), constraints NOT NULL/UNIQUE/CHECK/FOREIGN KEY (`PRAGMA foreign_keys`), STRICT tables; `db:` tests and DML judges with `check:` | 5 |
| 16 | `16-transacciones.md` | Transacciones y ACID | BEGIN/COMMIT/ROLLBACK, atomicity (transaction diagram), savepoints, isolation anomalies (dirty read, non-repeatable read, phantom, lost update) drawn as two sessions, SQLite's locking and WAL vs PostgreSQL's MVCC | 5 |
| 17 | `17-diseno.md` | Diseñar tablas: normalización, vistas y triggers | modelling a new case's data (ER), keys natural vs surrogate, 1NF/2NF/3NF on the dirty reports, CREATE VIEW, triggers for an audit log, when to denormalise | 5 |
| 18 | `18-dialectos.md` | SQLite, PostgreSQL y MySQL: el expediente final | dialect differences that matter (types, text concat, LIMIT vs FETCH, booleans, dates and intervals, ILIKE, upsert and RETURNING syntax, window and CTE support), porting a query; the final mission crosses every case | 5 — **closes the files** |

### The cases

1. **El giroscopio de Wayra** (sessions 1–4, `surquillo`, place `mercado`). Friday 13 March 2026, 22:41:
   the gyroscope of Wayra, a Loop robot charging at stall 47 of Surquillo Market No. 1, stops
   responding. Trail, already planted: report (S1 case, the guard is Marleny Quispe) → five exits
   through gate 3, 22:41–23:30 (S1 mission: 731 Renzo, 905 Óscar, 1046 Fiorella, 412 Lucía, 377 Julio)
   → Marleny's interview: a white car (S2 case) → white or NULL-colour cars leave Renzo, Lucía, Julio
   (S2 mission) → CAM-SUR-03 in UTC with dirty plates: `b7r415` at 22:48 Lima (S3 case) → Lucía 23:14,
   Julio 23:23, Renzo lied about 23:10 (S3 mission). **For session 4:** Renzo and **Tito Vílchez Arias**
   (id 1129, a trader in La Victoria) call each other four times on 12–14 March (`llamadas`, one at
   22:52 on the 13th, right after the exit) — case `sql4-caso-llamadas`; Tito pays Renzo S/ 450 + 500 +
   400 = **S/ 1350** on 14–15 March, while his other payments are under S/ 200
   (`transferencias` grouped by receiver, HAVING SUM > 1000) — mission `sql4-mision-culpable`, answer
   **Renzo Huamaní Cárdenas**. Renzo's car is also seen at CAM-LVI-01 (Gamarra) at 23:09 and the next
   morning. Wayra's gyroscope readings stop at 22:41:07 (`lecturas`, value NULL, JSON error).
2. **La red de los pagos** (sessions 5–8, `pagos`, place `pagos`). March 2026: a ring sells phones and
   scooters on Marketplace and asks for a Yape advance (`transferencias.mensaje` starts with `'adelanto'` /
   `'deposit'`; nothing else in the world uses that word, so keep it that way). Trail, already planted:
   14 victims pay S/ 5340 to four collectors: Kevin Rojas (742), Brenda Salazar (779), Jhonatan Ugarte (815)
   and the unregistered chip `951207384`; 9 of them file `estafa` reports. Sonia (118) paid Brenda (S5 case)
   → the 9 reports join to 7 named rows, Kevin has 3 (S5 mission) → LEFT JOIN finds the chip (S6 case),
   NOT EXISTS the 5 who never reported → a self-join shows every advance hopping to Milagros Tello (846)
   within 3 h, always 90 % (S6 mission) → her payments above her own average go to Gustavo (934),
   Percy (873) and her landlord Teodoro (961, cleared by his six tenants) (S7 case); she got S/ 4806 from
   the collectors (S7 mission) → Kevin, Brenda and Milagros work at Importaciones Ccori S.A.C. (S8 case)
   → `pagos grandes INTERSECT empleados de Ccori` = **Gustavo Alvarado Zevallos**, its manager (S8 mission).
   Interviews use case code `EST-0323`. Plot: `src/sql/plots/pagos.js`.
3. **El sabotaje de la sala de sensores** (sessions 9–11, `sensores`, place `sensores`). Loop's
   robots sleep in the sensor room and calibrate at 03:00. Planted in `plots/sensores.js` (own seeded
   RNG, so it doesn't shift other plots): readings every 10 minutes for Chasqui, Tika, Kusi, Quilla and
   Pituco from 20 to 28 March (gyroscope and temperature, JSON `{"firmware","ok"}`), `'sistema'` rows
   for each firmware update, the new tables `accesos` (door card log, 16–28 March) and `firmwares`
   (released versions 2.3.0–2.5.9, `notas` JSON with the author's user), in `schema/sensores.js`.
   Trail: Tika and Kusi go out of calibration at 03:02/03:04 on the 24th, Pituco at 03:08 on the 26th
   (S9 case, top-1 per robot) → the last entry before 03:00 each night is Wilmer's card T-0412 at 01:38
   on the 24th and 01:52 on the 26th (S9 mission, top-1 per night) → those visits last 38 and 39
   minutes vs 3–5 for his rounds, and he reported T-0412 lost on the 23rd (S10 case, LEAD) → the three
   robots go silent 40 minutes while T-0412 is inside (S10 mission, LAG gaps) → firmware 2.6.0 is not in
   `firmwares` (S11 case, `->>` + EXCEPT) → the 2.6.0 updates were made by user `gpumacayo`, the user of
   **Gonzalo Pumacayo Tello** (id 1152) in `firmwares.notas` (S11 mission). Queries are scoped to
   `momento >= '2026-03-20'`; background readings (10–16 March) are uniform noise.
4. **El caso frío de 1998** (sessions 12–14, place `distritos`). A robbery nobody solved, reopened: an
   old call graph and an org chart (new tables, e.g. `llamadas_1998`, `empleados_1998` with `jefe_id`)
   that only WITH RECURSIVE can walk, big enough (tens of thousands of rows) that indexes and the plan
   decide whether the query finishes. Session 13 opens with a four-hop walk whose `OR` join scans the 60 000 calls
   for each of ~5 000 queued numbers (~300 M rows; 38 s in sql.js on a fast laptop, 3 s at three hops), so
   the 4 s watchdog cuts it on any machine; keep that margin if the data or the query changes.
5. **La base de Loop** (sessions 15–18, `taller`, place `oficina`). Investigated Monday 6 – Thursday 9
   April 2026, after case 4 (the data stays in March). The municipality hands Loop
   the registry of the market's stalls (`padron_puestos`, `tramites`, the app's `bitacora`, `usuarios`,
   and the old spreadsheet `planilla_puestos`). On Friday 20 March 2026 stall 47 (Carmen's) and 19, 64,
   102 pass to **Yolanda Ugarte Montes** (1144) through counter 1. Trail: S15 case, the registry says 47
   is Yolanda's (18:52:40, `abenavides`) → S15 mission, four transfers requested by the beneficiary,
   fee 0, restored with one UPDATE stamped `'2026-04-06 10:00:00'` (answer 4) → S16 case, Susana (`ssalazar`, 1176) renewed Carmen's
   licence at 18:47 → S16 mission, session 328 read at 18:45 and overwrote the renewal at 18:52 (a lost
   update; answer 328; an honest one on stall 23, 9 March, for the challenge) → S17 case, the
   spreadsheet lists Delia Lozano's (IT, 1117) mobile for Yolanda's stalls → S17 mission, all writes came
   from VENT-1 → S18 case, Abel Vílchez Arias (1166, Tito's brother) paid S/ 3000 + 2000 for 47 → S18
   mission crosses market gates, transfers and calls: only **Alfredo Benavides Tello** (1163,
   `abenavides`) was inside at 18:52 (out 18:28, back in 18:41), got S/ 7500 from Yolanda and spoke to
   her three times. Edith Choque Ramos (1034) is the head of Markets.

### Seeds for judges and challenges

1. Early-bird stalls (filter + two-key sort); page 2 of a log (LIMIT/OFFSET with a tie-break).
2. Email-only customers (NULL vs `''`); certainly-not vs unknown with NOT IN.
3. Formatted plates in Lima time (text + date functions); weekdays and minutes with CASE and julianday.
4. Busiest hour of a gate; totals per stall per day with HAVING; COUNT(*) vs COUNT(col) on dirty data.
5. Who owns which car (join); stalls with their owners' phones; pairs of people who share an address.
6. Customers with no orders (anti-join); calls returned within an hour (self-join).
7. Payments above the payer's own average (correlated); the latest record per person.
8. People in both lists (INTERSECT); a funnel of steps with CTEs.
9. Top 3 per district (ROW_NUMBER); rank with ties.
10. Running balance; longest streak of days (gaps and islands).
11. Firmware versions from JSON; hours with no readings.
12. Chain of command to the top; everyone within 3 calls of a number.
13. Make this query SEARCH, not SCAN (`plan:` test); the right composite index.
14. Rewrite a correlated subquery as a join that the planner likes.
15. An UPSERT that keeps the newest value (`check:` judge); a DELETE that must not touch others.
16. Transfer between two accounts atomically; find the lost update.
17. Normalise a flat sheet into three tables (judge on the resulting data via `check:`).
18. Translate a PostgreSQL query to SQLite.
