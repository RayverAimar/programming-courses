# Session 1 — Your first queries

```session
case: surquillo
```

## The job

Saturday 14 March 2026, seven in the morning. Loop's phone rings: it's **Carmen Ríos**, the technician who runs our repair stall, **number 47 at Surquillo Market No. 1**. Last night she left **Wayra**, our delivery robot, charging at the stall as always. This morning she found it switched off and **missing its gyroscope**, the part that tells it which way it's leaning. Without it, Wayra can't even stand up straight.

Surquillo's police station has few officers and many cases. The municipality has given Loop read access to its database, **Lima's case files**: the register of people, vehicles, the cards swiped at the market gates, the cameras that read plates, police reports, phone calls. Thousands of rows. **Chasqui**, Loop's first robot, will be your assistant; you ask the questions. And in a database, questions are asked in **SQL**.

```setting
case: surquillo
title: Surquillo Market No. 1, at night
caption: "Seen from above: aisles A–F with their stalls, the three gates and the street cameras. Every clue you find shows up here with its number."
```

```dossier
title: The team
cards:
  - name: Chasqui
    kind: chasqui
    role: Loop's assistant detective
    quote: "I search the database; you decide what to ask."
  - name: Carmen Ríos Llanos
    traits: { style: bun, shirt: "#3f7cc4", glasses: true }
    role: Loop technician, stall 47
    quote: "To take that gyroscope out you have to know what you're doing."
  - name: Wayra
    kind: robot
    traits: { broken: true }
    role: Delivery robot, the victim
    quote: "…"
```

## Why SQL exists

```goals
- Tell who invented SQL, when, and what problem it solved
- Compare SQL with a spreadsheet, with pandas and with a NoSQL database
- Know where SQL is used today and why this course uses SQLite
```

Before the first query, a fair question: why learn a separate language just to talk to a database? The answer starts in an IBM lab in California, in 1970.

### The problem in 1970

<!-- photo: ibm-system-360 -->

A **database** is a program that keeps huge amounts of data on disk (customers, orders, payments) and hands it to you when you ask. In the late sixties, companies used **hierarchical** or **network** databases, like IBM's IMS. There each piece of data was a **record**, a kind of index card, and the cards were linked by **pointers**: a customer's card noted where their first order was; that order noted where the next one was, and so on. To get anything out, a program (usually in COBOL) had to **navigate**, card by card:

<!-- /photo -->

```network
title: Before SQL, the program went looking for the data
nodes:
  - { id: prog, icon: program, label: COBOL program, sub: knows the path by heart }
  - { id: cli, icon: record, label: Customer 17, sub: Bodega Rosa }
  - { id: p1, icon: record, label: Order 1, sub: 3 sacks of rice }
  - { id: p2, icon: record, label: Order 2, sub: 10 kg of sugar }
  - { id: p3, icon: record, label: Order 3, sub: 2 boxes of noodles }
links:
  - { id: go, label: finds the customer }
  - { id: k1, label: pointer, busy: changed }
  - { id: k2, label: pointer, busy: changed }
  - { id: k3, label: pointer }
steps:
  - phase: "Before: navigate"
    at: prog
    note: "The question: which orders did customer 17 place? In a hierarchical database the program has to go and fetch them itself, following a path the programmer wrote step by step."
    show:
      label: The path, written into the program
      text: |
        go to customer 17
        follow the pointer to their first order
        while there is an order:
            note it down
            follow the pointer to the next one
  - move: [prog, cli]
    packet: { kind: up, label: the program's search }
    note: First, find the customer's card.
  - move: [cli, p1]
    packet: { kind: up, label: the program's search }
    tags: { p1: noted }
    note: The customer's card holds a **pointer**, the address of their first order. The program follows it and notes the order down.
  - move: [p1, p2]
    packet: { kind: up, label: the program's search }
    tags: { p1: noted, p2: noted }
    note: From order 1 another pointer leads to order 2.
  - move: [p2, p3]
    packet: { kind: up, label: the program's search }
    tags: { p1: noted, p2: noted, p3: noted }
    note: And so on to the last one. It works, but every new question is a new path someone has to program.
  - phase: The problem
    at: prog
    busy: [k1, k2]
    tags: { prog: "the path no longer works" }
    note: If someone reorganises how the cards are stored (say, to make a search faster), the paths change and the programs that knew them by heart break. They had to be rewritten.
  - phase: "With SQL: describe"
    at: cli
    dim: [prog]
    dimLinks: [go, k1, k2, k3]
    note: With Codd's idea you write **what** you want, not the path. The database engine decides how to find it, and if the data is reorganised, your question stays the same.
    show:
      - label: The question, in SQL
        text: |
          SELECT *
          FROM orders
          WHERE customer_id = 17;
      - label: The answer, a table
        table:
          head: [id, customer_id, product]
          rows: [["1", "17", "3 sacks of rice"], ["2", "17", "10 kg of sugar"], ["3", "17", "2 boxes of noodles"]]
```

The program knew the path by heart, and when the path changed, the programs broke.

<!-- photo: codd-1970-paper -->

**Edgar F. Codd**, a British mathematician at IBM's San José lab, published *A Relational Model of Data for Large Shared Data Banks* in June 1970. His idea: store data as **relations** (tables of rows and columns, no visible pointers) and ask for it by **describing what you want**, not how to find it. The system picks the path. That's what being **declarative** means.

Codd wrote mathematics, not a language. In 1974 **Donald Chamberlin** and **Raymond Boyce**, also at IBM, designed one that read almost like English for the **System R** prototype: they called it **SEQUEL** (*Structured English Query Language*). Since "SEQUEL" was already a trademark of a British aircraft company, they dropped the vowels: **SQL**. That's why some people say "ess-cue-ell" and others say "sequel"; both are fine.

<!-- /photo -->

```figure
title: SQL through time
panes:
  - timeline:
      - when: "1970"
        title: "Codd, IBM"
        text: "The relational model: tables and declarative questions"
      - when: "1974"
        title: "SEQUEL"
        text: "Chamberlin and Boyce, for System R"
      - when: "1979"
        title: "Oracle V2"
        text: "The first SQL database ever sold"
      - when: "1986"
        title: "ANSI standard"
        text: "SQL-86; ISO adopts it in 1987"
      - when: "1996"
        title: "PostgreSQL"
        text: "Grows out of POSTGRES, at UC Berkeley"
      - when: "2000"
        title: "SQLite"
        text: "D. Richard Hipp: a database with no server"
      - when: "2003"
        title: "SQL:2003"
        text: "Window functions in the standard"
      - when: "2023"
        title: "SQL:2023"
        text: "JSON as a type and graph queries"
```

The first company to sell a SQL database wasn't IBM but a small one called Relational Software, which read the System R papers and shipped **Oracle V2** in 1979. In 1986 SQL became a **standard** (ANSI, and ISO a year later). The standard keeps growing: recursive queries in 1999, window functions in 2003, JSON in 2016. You'll see all of them in this course.

```idea
SQL was born so you ask for data by saying what you want, not how to go and get it: the engine picks the path.
```

### SQLite, this course's database

In spring 2000, **D. Richard Hipp** was writing software for US Navy destroyers as a contractor for General Dynamics. The program depended on a separate database server, and whenever that server was unavailable, the program couldn't do anything. Hipp wondered why a database needed a server and wrote one that didn't: **SQLite**, a library that keeps the whole database in **a single file** and runs inside the program that uses it. Version 1.0 came out in August 2000, and its code is in the **public domain**.

Today SQLite is inside every phone, every browser and thousands of apps. The project itself estimates there are **over a trillion** SQLite databases in use. This course uses it because it runs in your browser with nothing to install (compiled to WebAssembly) and because it's real SQL: what you learn here works in PostgreSQL or MySQL, and every session points out where they differ.

### Strengths and weaknesses

The same question in four tools: **the exits through Gate 3 from 22:41 on, earliest first.**

```figure
title: The same question, four ways
panes:
  - label: SQL
    text: |
      SELECT person_id, moment
      FROM market_entries
      WHERE gate = 3
        AND direction = 'out'
        AND moment >= '2026-03-13 22:41'
      ORDER BY moment;
  - label: Spreadsheet
    text: |
      1. Open the file (if it fits: a
         million rows is the limit).
      2. Filter "gate": 3.
      3. Filter "direction": out.
      4. Filter "moment": from…
      5. Sort by "moment".
      (Mouse steps: nobody can
       repeat them exactly.)
  - label: Python with pandas
    text: |
      df = pd.read_csv("entries.csv")
      exits = df[(df.gate == 3)
          & (df.direction == "out")
          & (df.moment >= "2026-03-13 22:41")]
      exits.sort_values("moment")
  - label: MongoDB (NoSQL)
    text: |
      db.entries.find({
        gate: 3, direction: "out",
        moment: { $gte: "2026-03-13 22:41" }
      }).sort({ moment: 1 })
```

```figure
title: SQL next to the others
panes:
  - table:
      head: ["", "SQL", "Spreadsheet", "pandas", "NoSQL (documents)"]
      rows:
        - ["Lots of data", "**Millions of rows, with indexes**", "Slows down early", "Whatever fits in memory", "**Scales across servers**"]
        - ["Repeating the question", "**It's text: save it, rerun it**", "Clicks, hard to repeat", "It's code", "It's code"]
        - ["Many people at once", "**Transactions (ACID)**", "Changes clash", "One program", "Depends on the engine"]
        - ["Data that changes shape", "Tables must be designed", "**Anything goes**", "**Flexible**", "**Each document its own way**"]
        - ["Charts and exploring", "Export first", "**Right away**", "**With matplotlib**", "Export first"]
```

**Strengths.**

- **Declarative.** You say *which* rows you want; the engine decides *how* to find them, with indexes and a planner fifty years in the making. The same query keeps working when the table grows from a thousand rows to a billion.
- **A standard.** SQLite, PostgreSQL, MySQL, SQL Server and Oracle speak nearly the same language. What you learn here, you use everywhere.
- **Data that doesn't contradict itself.** Keys, constraints and transactions protect the data even when a thousand people write at once.
- **A query is text.** You save it, review it, rerun it tomorrow on new data. That's why the police (and Chasqui) can rerun your query and get the same answer.

**Weaknesses.**

- **Design comes first.** Tables have fixed columns; if your data keeps changing shape, a document database or a JSON file fits better.
- **Not everything fits in a question.** To draw a chart or train a model, you pull the data out with SQL and carry on in Python.
- **Every engine has its habits.** Dates, text and some function names change between engines. You'll see them in the **"In older code you'll see…"** boxes.
- **It's read in one order and run in another.** You write `SELECT` first, but the engine does it near the end. You'll watch that step by step today.

```exercise
id: sql1-origen-declarativo
type: predict
title: What and how
prompt: |
  This query asks a table for rows. What does it return? And one more question: where does it say **how** to look for them?
code: |
  SELECT code FROM cameras WHERE district = 'Surquillo' ORDER BY code DESC LIMIT 2;
options:
  - "CAM-SUR-04\nCAM-SUR-03"
  - "CAM-SUR-01\nCAM-SUR-02"
  - "CAM-SUR-03\nCAM-SUR-04"
  - "CAM-SUR-04"
answer: "CAM-SUR-04\nCAM-SUR-03"
explain: |
  Nowhere: it only says **what** (Surquillo's cameras, highest code first, the first two). How to walk the table is SQLite's call. `DESC` sorts from highest to lowest, and `LIMIT 2` cuts after sorting.
```

### Where it's used today

```figure
title: Where SQL lives
panes:
  - table:
      head: ["Where", "Which database", "Why it fits"]
      rows:
        - ["**Phones and apps**", "SQLite", "One file inside the app, no server: contacts, messages, history"]
        - ["**Browsers**", "SQLite", "History, bookmarks and cookies in Chrome, Firefox and Safari"]
        - ["**Web systems and banks**", "PostgreSQL, MySQL, Oracle", "Many users writing at once without losing a cent"]
        - ["**Data analysis**", "BigQuery, Snowflake, DuckDB", "Billions of rows with the same SQL"]
        - ["**Loop**", "SQLite", "Your progress in this course lives in a SQLite database too"]
```

SQL is over fifty years old and still among the most used. In the **Stack Overflow 2025** developer survey, 58.6 % of respondents said they use SQL, and in **2026**, 58.4 %. In the **2026** list of databases, **PostgreSQL** comes first (57.9 %) and **SQLite** second (42.1 %). These are snapshots of a year: check the latest edition.

```recap
- Codd proposed the relational model at IBM in 1970: tables, and questions that say what you want, not how to find it.
- Chamberlin and Boyce designed SEQUEL (1974) for System R; a trademark turned it into SQL. It's an ANSI/ISO standard since 1986–87.
- "SQLite (2000, D. Richard Hipp) is a database in a single file, with no server, in the public domain: the most installed in the world."
- "Strengths: declarative, standard, protected data, repeatable queries. Weaknesses: design comes first, every engine has its habits, it's written in one order and run in another."
```

**Sources**

- E. F. Codd, [A Relational Model of Data for Large Shared Data Banks](https://dl.acm.org/doi/10.1145/362384.362685), *Communications of the ACM* 13(6), 1970.
- D. D. Chamberlin, [Early History of SQL](https://ieeexplore.ieee.org/document/6359709), *IEEE Annals of the History of Computing*, 2012.
- SQLite, [Most Widely Deployed and Used Database Engine](https://www.sqlite.org/mostdeployed.html) and [About SQLite](https://www.sqlite.org/about.html); [SQLite on Wikipedia](https://en.wikipedia.org/wiki/SQLite) (Navy origin, 2000).
- PostgreSQL, [A Brief History of PostgreSQL](https://www.postgresql.org/docs/current/history.html).
- [Stack Overflow Developer Survey 2025](https://survey.stackoverflow.co/2025/technology) and [2026](https://survey.stackoverflow.co/2026/technology).

## The minimum

A database keeps **tables**: each row is one thing (a person, a report, a card swipe) and each column, one fact about it. To ask, you use **`SELECT`**: which columns, **`FROM`** which table, **`WHERE`** which rows, **`ORDER BY`** in what order and **`LIMIT`** how many.

```schema
title: Today's two tables
tables: [reports, market_entries]
caption: "Each box is a table with its columns. The key marks the **primary key** (`id`, different in every row) and the link, a column that points at another table."
```

```sql run
SELECT report_date, report_time, district, kind
FROM reports
WHERE district = 'Miraflores'
ORDER BY report_date, report_time
LIMIT 5;
```

Change `'Miraflores'` to another district, or `LIMIT 5` to `LIMIT 10`, and run it again. What you need today:

- **`SELECT *`** brings every column. It's for looking at a table; in a real query, name only the columns you need.
- **Text in single quotes:** `'Surquillo'`. Numbers go without quotes: `gate = 3`.
- **Comparing:** `=`, `<>` (not equal; `!=` works too), `<`, `<=`, `>`, `>=`. Join conditions with **`AND`**.
- **Dates as text:** here they're stored as `'2026-03-13 22:46:12'`. Since they go from big to small (year, month, day, hour), comparing them as text works: `moment >= '2026-03-13 22:41'`.
- **`ORDER BY`** sorts from lowest to highest; **`DESC`** the other way. You can sort by several columns: `ORDER BY report_date DESC, report_time DESC`.
- **`LIMIT n`** keeps the first `n` rows; **`OFFSET k`** skips the first `k`.
- **Computing and renaming:** `SELECT plate, 2026 - year AS age` creates a new column with its own name.
- SQL's words ignore case (`select` = `SELECT`), but text doesn't: `'surquillo'` isn't `'Surquillo'`. A comment starts with `--`.

The odd thing about SQL: **it's written in one order and run in another**. You write `SELECT` first, but the engine starts with `FROM` (which table), goes on with `WHERE` (which rows stay), and only then computes the `SELECT` columns, sorts them and cuts. Press ▶ and watch which rows remain at each step:

```order
title: Written in one order, run in another
query: |
  SELECT person_id, moment
  FROM market_entries
  WHERE gate = 3 AND direction = 'out'
  ORDER BY moment DESC
  LIMIT 3;
tables:
  market_entries:
    cols: [id, person_id, gate, moment, direction]
    rows:
      - [1, 58, 1, "2026-03-13 06:02", "in"]
      - [2, 905, 3, "2026-03-13 20:12", "in"]
      - [3, 731, 3, "2026-03-13 21:58", "in"]
      - [4, 58, 2, "2026-03-13 19:31", "out"]
      - [5, 731, 3, "2026-03-13 22:46", "out"]
      - [6, 905, 3, "2026-03-13 22:58", "out"]
      - [7, 412, 3, "2026-03-13 23:12", "out"]
      - [8, 233, 1, "2026-03-13 19:55", "in"]
      - [9, 377, 3, "2026-03-13 23:21", "out"]
caption: "A tiny version of `market_entries`. `WHERE` strikes rows out, `SELECT` keeps two columns, `ORDER BY` sorts them and `LIMIT` cuts."
```

> **Common trap:** since `SELECT` is computed after `WHERE`, in standard SQL (and in PostgreSQL) **you can't use in `WHERE` an alias you made up in `SELECT`**: `SELECT 2026 - year AS age … WHERE age > 20` is an error, because when `WHERE` runs that column doesn't exist yet. SQLite lets it through as an extension, but don't get used to it: write the whole expression, `WHERE 2026 - year > 20`. In `ORDER BY` you can use the alias, because it runs after `SELECT`.

<!-- legacy: limit -->

<!-- legacy: string-quotes -->

<!-- mdn: limit string-quotes -->

## Practice

```exercise
id: sql1-predice-division
type: predict
title: Dividing in SQLite
prompt: |
  Chasqui wants to share 7 batteries between 2 robots. What does this query return? (A `SELECT` without `FROM` computes a single row.)
code: |
  SELECT 7 / 2, 7 / 2.0, 7 % 2;
options:
  - "3 | 3.5 | 1"
  - "3.5 | 3.5 | 1"
  - "3 | 3 | 1"
  - "3.5 | 3.5 | 0"
answer: "3 | 3.5 | 1"
explain: |
  Between two integers, `/` in SQLite (and PostgreSQL) is **integer division**: it drops the decimals, `7 / 2` is 3. If either side has decimals (`2.0`), so does the result: 3.5. `%` is the remainder: 1. In MySQL, by contrast, `7 / 2` is 3.5000.
```

```exercise
id: sql1-predice-orden
type: predict
title: Sort, then cut
prompt: |
  What does it return? Mind the order SQLite does things in.
code: |
  SELECT code
  FROM cameras
  WHERE district = 'Surquillo'
  ORDER BY code
  LIMIT 2 OFFSET 1;
options:
  - "CAM-SUR-02\nCAM-SUR-03"
  - "CAM-SUR-01\nCAM-SUR-02"
  - "CAM-SUR-03\nCAM-SUR-04"
  - "CAM-SUR-02"
answer: "CAM-SUR-02\nCAM-SUR-03"
explain: |
  First `WHERE` keeps Surquillo's four cameras, `ORDER BY` sorts them (01, 02, 03, 04), `OFFSET 1` skips the first and `LIMIT 2` keeps the next two.
```

```exercise
id: sql1-completa-camaras
type: complete
title: The district's cameras
prompt: |
  List the **code** and **location** of **Surquillo**'s cameras. Replace each `___`.
starter: |
  SELECT code, ___
  FROM ___
  WHERE district = ___;
solution: |
  SELECT code, location
  FROM cameras
  WHERE district = 'Surquillo';
hints:
  - The columns and the table are in the Schema panel (or start typing and let the editor suggest).
  - The district is text, so it goes in single quotes.
tests:
  - name: Surquillo's four cameras, with code and location
    same: SELECT code, location FROM cameras WHERE district = 'Surquillo'
```

```exercise
id: sql1-arregla-coma
type: fix
title: The column that vanished
prompt: |
  This query should show the **number, name and trade** of the stalls in **aisle C**, sorted by number. But only two columns come out, and one has an odd name. Run it, read the headers and fix it.
starter: |
  SELECT number, name trade
  FROM stalls
  WHERE aisle = 'C'
  ORDER BY number;
solution: |
  SELECT number, name, trade
  FROM stalls
  WHERE aisle = 'C'
  ORDER BY number;
hints:
  - "Look at the second column's header: it says `trade`, but it holds stall names."
  - Without a comma between two names, the second becomes an alias of the first (`name trade` is `name AS trade`).
tests:
  - name: number, name and trade of aisle C, by number
    same: SELECT number, name, trade FROM stalls WHERE aisle = 'C' ORDER BY number
    ordered: true
    names: true
```

```exercise
id: sql1-escribe-recientes
type: write
title: The latest reports
prompt: |
  Write a query with the **date, time and kind** of the **5 most recent reports in Surquillo**, newest first.

  Careful: many reports share a date. To break ties, sort by time too.
visual:
  schema:
    tables: [reports]
starter: |
  SELECT *
  FROM reports
  LIMIT 5;
solution: |
  SELECT report_date, report_time, kind
  FROM reports
  WHERE district = 'Surquillo'
  ORDER BY report_date DESC, report_time DESC
  LIMIT 5;
hints:
  - "`ORDER BY report_date DESC, report_time DESC`: first by date and, on a tie, by time."
  - "`LIMIT` goes at the very end."
tests:
  - name: the 5 most recent, in order
    same: SELECT report_date, report_time, kind FROM reports WHERE district = 'Surquillo' ORDER BY report_date DESC, report_time DESC LIMIT 5
    ordered: true
  - name: only the three columns asked for
    columns: [report_date, report_time, kind]
```

```exercise
id: sql1-escribe-antiguedad
type: write
title: The oldest Toyotas
prompt: |
  List the **plate**, **model** and **age** (2026 minus the year) of the **Toyota vehicles built before 2007**. Call the computed column `age` and sort from oldest to newest; on a tie, by plate.
starter: |
  SELECT plate, model, year
  FROM vehicles
  WHERE make = 'Toyota';
solution: |
  SELECT plate, model, 2026 - year AS age
  FROM vehicles
  WHERE make = 'Toyota' AND year < 2007
  ORDER BY age DESC, plate;
hints:
  - "`2026 - year AS age` computes the value and names the column."
  - In `ORDER BY` you can use the alias, because it runs after `SELECT`.
tests:
  - name: plate, model and age of Toyotas before 2007, in order
    same: SELECT plate, model, 2026 - year AS age FROM vehicles WHERE make = 'Toyota' AND year < 2007 ORDER BY age DESC, plate
    ordered: true
  - name: the computed column is called age
    columns: [plate, model, age]
```

## The case

```exercise
id: sql1-caso-denuncia
type: case
title: The stall 47 report
prompt: |
  **Find Carmen's report and read it: what's the name of the guard who saw someone leave?**

  Carmen went to the police station on Saturday the 14th, in the morning. The `reports` table has three hundred, from all over Lima: filter by **date** (`'2026-03-14'`) and **district**, check what kind of report it is and read the whole `description` column. If it's too long, ask for that column alone.
visual:
  dossier:
    cards:
      - name: Carmen Ríos Llanos
        traits: { style: bun, shirt: "#3f7cc4", glasses: true }
        role: Loop technician, stall 47
        rows: [["Went to", "Surquillo police station"], ["When", "Saturday 14th, morning"]]
        quote: "I left it charging at half past seven in the evening. By a quarter past six in the morning the gyroscope was gone."
starter: |
  -- This is how the reports start. Filter Saturday the 14th in Surquillo.
  SELECT *
  FROM reports
  LIMIT 3;
solution: |
  SELECT report_time, kind, place, description
  FROM reports
  WHERE report_date = '2026-03-14'
    AND district = 'Surquillo'
    AND kind = 'theft'
    AND place LIKE '%47%';
answer: Marleny Quispe
answerLabel: What's the guard's name?
reveal: |
  **Marleny Quispe.** The report also says the gyroscope stopped responding at **22:41** on Friday and that someone hurried out through **Gate 3**. That time and that gate are your first clues: find them on the case board.
hints:
  - "`WHERE report_date = '2026-03-14' AND district = 'Surquillo'` leaves seven reports. Look at the `kind` and `place` columns."
  - "Once you know the right one's `id`, `SELECT description FROM reports WHERE id = …` lets you read it whole."
```

## The judge

A SQL judge works like the ones in programming contests: your query runs on the **example tables** and then on dozens of **hidden databases** with the same tables and other data. In every one, your result must match the expected one: the same rows and the same columns. So getting the example right isn't enough; the query has to be right for any data.

- **Row order** counts only when the statement asks for it (and then you need `ORDER BY`).
- **Column names** don't count unless the statement asks for them; their order does.
- Each judge has its own small tables, in the **Schema** tab.

```exercise
id: sql1-juez-madrugadores
type: judge
title: The early-bird stalls
prompt: |
  **Return the number and name of the stalls that open before 06:00, earliest opener first; if two open at the same time, the lower number first.**

  The traders' association wants to know who is already inside while it's still dark, to coordinate with the guards.

  **Table:** `stalls(number, name, opens)`. `opens` is `'HH:MM'` text (with a leading zero: `'05:30'`).

  **Result:** two columns, `number` and `name`, in the order asked.
schema: |
  CREATE TABLE stalls (number INTEGER, name TEXT, opens TEXT);
ordered: true
starter: |
  SELECT number, name
  FROM stalls;
solution: |
  SELECT number, name
  FROM stalls
  WHERE opens < '06:00'
  ORDER BY opens, number;
hints:
  - "`'HH:MM'` text with a leading zero compares correctly as text, so `opens < '06:00'` works."
  - Sort by `opens` first and, to break ties, by `number`.
samples:
  - rows:
      stalls: [[12, "Juguería Lucía", "06:30"], [47, "Loop", "05:45"], [3, "Pescados Don Beto", "04:30"], [21, "Flores Nelly", "05:45"], [8, "Abarrotes Kike", "07:00"]]
    note: Stalls 47 and 21 open at the same time; 21 comes first.
  - rows:
      stalls: [[5, "Pollería Kusi", "06:00"], [9, "Verduras Rosa", "08:15"]]
    note: "Opening at 06:00 sharp isn't opening before 06:00: nobody comes out."
edge:
  - rows: { stalls: [] }
    tag: with an empty table
  - rows: { stalls: [[1, "Uno", "05:59"], [2, "Dos", "00:00"]] }
    tag: with midnight
  - rows: { stalls: [[30, "C", "05:00"], [10, "A", "05:00"], [20, "B", "05:00"]] }
    tag: with everyone at the same time
random:
  count: 40
  seed: 101
  generate: |
    const names = ["Don Lucho", "Mamá Rosa", "Kike", "Nelly", "Beto", "Juana", "Pancho", "Mechita", "Tito", "Carmen"];
    const times = ["04:30", "05:00", "05:15", "05:45", "05:59", "06:00", "06:30", "07:00", "08:15"];
    const n = rng.int(0, 14);
    const used = new Set();
    const rows = [];
    for (let i = 0; i < n; i++) {
      let k = rng.int(1, 120);
      while (used.has(k)) k = rng.int(1, 120);
      used.add(k);
      rows.push([k, `${rng.pick(names)} ${k}`, rng.pick(times)]);
    }
    return { stalls: rows };
wrong:
  - |
    SELECT number, name FROM stalls WHERE opens < '06:00' ORDER BY opens;
  - |
    SELECT number, name FROM stalls WHERE opens <= '06:00' ORDER BY opens, number;
  - |
    SELECT number, name FROM stalls WHERE opens < '06:00' ORDER BY number;
```

## Final mission

```exercise
id: sql1-mision-salidas
type: mission
title: The exits through Gate 3
prompt: |
  **List who went out through Gate 3 between 22:41 and 23:30 on Friday the 13th (including the seconds of 23:30), from the earliest exit to the latest.** Show `person_id` and `moment`. Then count the exits.

  Wayra lost its gyroscope at 22:41 and Marleny saw someone leave through Gate 3. We only look at the hour after the blackout, until 23:30. The `market_entries` table keeps every card swipe at a gate: `gate`, `moment` (Lima time) and `direction` (`'in'` or `'out'`).

  Once the query proves it, type the number and, together with the judge, session 2 opens.
visual:
  - setting:
      case: surquillo
      caption: "Gate 3 opens onto Jr. Narciso de la Colina, on the right of the market."
  - schema:
      tables: [market_entries]
starter: |
  SELECT *
  FROM market_entries
  WHERE gate = 3
  LIMIT 20;
solution: |
  SELECT person_id, moment
  FROM market_entries
  WHERE gate = 3
    AND direction = 'out'
    AND moment >= '2026-03-13 22:41'
    AND moment < '2026-03-13 23:31'
  ORDER BY moment;
answer: "5"
answerLabel: How many exits were there in that window?
reveal: |
  **Five.** People 731, 905, 1046, 412 and 377 went out through Gate 3 between 22:46 and 23:21. They're on the case board as suspects now; next session you'll find out who they are and who got into a white car.
hints:
  - "Three conditions on the gate, the direction and the moment, joined with `AND`. For the moment, two comparisons: from `'2026-03-13 22:41'` and before `'2026-03-13 23:31'`."
  - "`'2026-03-13 23:30:59'` is less than `'2026-03-13 23:31'`, so `moment < '2026-03-13 23:31'` includes the seconds of 23:30."
tests:
  - name: the exits through Gate 3 in that window, in order
    same: SELECT person_id, moment FROM market_entries WHERE gate = 3 AND direction = 'out' AND moment >= '2026-03-13 22:41' AND moment < '2026-03-13 23:31' ORDER BY moment
    ordered: true
  - name: the query sorts with ORDER BY
    source: '\bORDER\s+BY\b'
    msg: Without ORDER BY there's no guaranteed order.
```

## Expert challenge

```exercise
id: sql1-reto-pagina
type: challenge
title: The second page
prompt: |
  **Return the second page (rows 11 to 20) of every card swipe at Gate 3 from 20:00 on Friday the 13th until before midnight, sorted by moment and, on a tie, by `id`.** Show `id`, `person_id`, `moment` and `direction`.

  For those who already code: this is how any system that shows results ten at a time paginates. Think about why the tie-break on `id` is needed.
visual:
  figure:
    title: Pages of ten
    panes:
      - label: All rows, sorted
        cells: ["1–10", "11–20", "21–30", "31–38"]
        highlight: [1]
        index: false
      - label: Page 2
        value: "LIMIT 10 OFFSET 10"
starter: |
  SELECT id, person_id, moment, direction
  FROM market_entries
  WHERE gate = 3;
solution: |
  SELECT id, person_id, moment, direction
  FROM market_entries
  WHERE gate = 3
    AND moment >= '2026-03-13 20:00'
    AND moment < '2026-03-14'
  ORDER BY moment, id
  LIMIT 10 OFFSET 10;
hints:
  - "`'2026-03-14'` is less than any moment on the 14th and greater than every one on the 13th."
  - If two rows share a moment, without a tie-break the engine may return them in any order, and a row could land on two pages or on none.
tests:
  - name: rows 11 to 20, in order
    same: SELECT id, person_id, moment, direction FROM market_entries WHERE gate = 3 AND moment >= '2026-03-13 20:00' AND moment < '2026-03-14' ORDER BY moment, id LIMIT 10 OFFSET 10
    ordered: true
  - name: breaks ties by id
    source: 'ORDER\s+BY\s+moment\s*,\s*id\b'
    msg: Add id to the ORDER BY so the order doesn't depend on the engine.
```
