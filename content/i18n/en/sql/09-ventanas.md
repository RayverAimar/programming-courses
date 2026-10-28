# Session 9 — Window functions

```session
case: sensores
```

## The job

Friday 27 March, 09:10. Carmen Ríos arrives at Loop with three robots that don't work: since Tuesday, **Tika** bumps into walls on its night rounds and **Kusi** overheats in the kitchen; since Thursday, **Pituco** leans to one side on its Barranco deliveries. All three sleep in the **sensor room**, where every night, at **03:00**, they calibrate themselves.

Since Friday 20, the room keeps a reading from each robot **every ten minutes** (gyroscope and temperature) in `readings`, and the door logs every card that opens it in a new table, `access_log`. That's thousands of rows. To find "the first odd reading of **each** robot" or "the last entry of **each** night", grouping isn't enough: you need to number rows **inside each group without losing them**. That's what window functions do.

```setting
case: sensores
title: Loop's sensor room
caption: "The robots sleep on the charging pads. The racks store the readings and the door has a card reader."
```

```dossier
title: Who has a card for the room
cards:
  - name: Carmen Ríos Llanos
    traits: { style: bun, shirt: "#3f7cc4", glasses: true }
    role: Owner of Loop, card T-0101
    rows: [["Hours", "Monday to Saturday, daytime"]]
    quote: "At three in the morning the robots calibrate themselves. Someone changed their calibration."
  - name: Yesenia Choque Ugarte
    traits: { style: long, shirt: "#c4553f", earrings: true }
    role: Intern, card T-0215
    rows: [["Hours", "Monday to Friday, 9 to 6"]]
    quote: "On Friday 20 I updated all five robots."
  - name: Wilmer Zevallos Benavides
    traits: { style: cap, capColor: "#33507a", shirt: "#33507a" }
    role: The arcade's night guard, card T-0412
    rows: [["Rounds", "midnight and 4 a.m."]]
    quote: "I go in, check the robots are charging and go out."
  - name: Kiara Montes Alvarado
    traits: { style: bun, shirt: "#3fa7a7", glasses: true }
    role: Andina Robótica technician, card T-0388
    rows: [["Hours", "Wednesday afternoons"]]
    quote: "I only calibrate Illa, which belongs to Andina."
```

## The minimum

With `GROUP BY` each group is **squashed** into one row: you know each robot's average, but you lose its readings. A **window function** computes over a set of rows, the "window", and **leaves every row where it is**, with a new column beside it. You spot it by the word `OVER`:

```sql
function(...) OVER (PARTITION BY column ORDER BY other)
```

- **`OVER ()`**, empty: the window is the whole result. `count(*) OVER ()` puts the total number of rows on every row.
- **`PARTITION BY`** splits the rows into groups, like `GROUP BY`, but without squashing them: each row sees only the rows of its own group.
- **`ORDER BY`** inside `OVER` sorts the rows **inside each partition**. It doesn't sort the result: the usual `ORDER BY` at the end still does that.

```figure
title: The same average, two ways
panes:
  - label: "GROUP BY robot: 2 rows"
    table:
      head: [robot, average]
      rows: [["Kusi", "70.7"], ["Tika", "35.9"]]
  - label: "AVG(value) OVER (PARTITION BY robot): all 4 rows are still there"
    table:
      head: [robot, moment, value, average]
      rows: [["Kusi", "12:04", "68.7", "70.7"], ["Kusi", "12:14", "72.7", "70.7"], ["Tika", "12:02", "35.6", "35.9"], ["Tika", "12:12", "36.1", "35.9"]]
caption: "`GROUP BY` returns one summary per group. The window repeats the summary on every row of its group, so you can compare each reading with its robot's average."
```

```sql run
SELECT robot_id, moment, value,
       round(avg(value) OVER (PARTITION BY robot_id), 1) AS average,
       count(*) OVER () AS total
FROM readings
WHERE sensor = 'temperature'
  AND moment BETWEEN '2026-03-24 12:00' AND '2026-03-24 12:19:59'
ORDER BY robot_id, moment;
```

### Numbering rows: ROW_NUMBER, RANK and DENSE_RANK

Three functions exist only as windows and are for handing out places. All three look at the window's `ORDER BY` and **start again at 1 in each partition**. Press ▶ and watch `ROW_NUMBER` number each robot's readings by time:

```window
title: ROW_NUMBER() OVER (PARTITION BY robot ORDER BY moment)
query: |
  SELECT robot, moment, value,
         ROW_NUMBER() OVER (PARTITION BY robot ORDER BY moment) AS nth
  FROM readings;
table:
  cols: [robot, moment, value]
  rows:
    - ["Tika", "03:02", 1.81]
    - ["Kusi", "03:04", -1.58]
    - ["Tika", "02:52", 0.03]
    - ["Kusi", "02:44", 0.02]
    - ["Tika", "03:12", 1.78]
    - ["Kusi", "03:14", -1.61]
partition: robot
order: moment
fn: row_number
as: nth
caption: "First the engine deals the rows into partitions (one colour band per robot) and sorts them by `moment`. Then it walks each partition counting: 1, 2, 3… and back to 1 in the next."
```

What if two rows tie in the `ORDER BY`? That's where they differ:

- **`ROW_NUMBER()`** never repeats: 1, 2, 3, 4. Between two tied rows it picks **either one**, so add a tie-break (`ORDER BY peak DESC, robot`).
- **`RANK()`** gives tied rows the same place and **skips**: 1, 2, 3, 3, 5, like in a race.
- **`DENSE_RANK()`** gives the same place and **doesn't skip**: 1, 2, 3, 3, 4.

```window
title: RANK() OVER (ORDER BY peak DESC)
query: |
  SELECT robot, peak,
         RANK() OVER (ORDER BY peak DESC) AS place
  FROM worst_of_the_day;
table:
  cols: [robot, peak]
  rows:
    - ["Chasqui", 0.07]
    - ["Tika", 1.86]
    - ["Kusi", 1.61]
    - ["Quilla", 0.07]
    - ["Pituco", 0.05]
order: peak
desc: true
fn: rank
as: place
caption: "Without `PARTITION BY`, the window is the whole table. Chasqui and Quilla tie on 0.07: both are 3rd and Pituco ends up 5th, because the tie ate 4th place. With `DENSE_RANK`, Pituco would be 4th."
```

### Where windows run

Windows are computed **along with the `SELECT`**: after `FROM`, `WHERE`, `GROUP BY` and `HAVING`, and before `DISTINCT`, `ORDER BY` and `LIMIT`. That's why a window only sees the rows that survived `WHERE`, and why it can sit on top of a `GROUP BY` (`RANK() OVER (ORDER BY max(value) DESC)`). Watch when the `place` column appears:

```order
title: The window is born in the SELECT step
query: |
  SELECT robot, moment, value,
         ROW_NUMBER() OVER (PARTITION BY robot ORDER BY value DESC) AS place
  FROM readings
  WHERE sensor = 'temperature'
  ORDER BY robot, place;
tables:
  readings:
    cols: [id, robot, sensor, moment, value]
    rows:
      - [1, "Kusi", "temperature", "12:04", 68.7]
      - [2, "Kusi", "gyroscope", "12:04", -1.6]
      - [3, "Tika", "temperature", "12:02", 35.6]
      - [4, "Kusi", "temperature", "12:14", 72.4]
      - [5, "Tika", "gyroscope", "12:02", 1.79]
      - [6, "Tika", "temperature", "12:12", 36.1]
      - [7, "Kusi", "temperature", "12:24", 71.9]
caption: "`WHERE` strikes out the gyroscopes; only in the `SELECT` step does the engine split what's left by robot, sort it by `value` and number it. The final `ORDER BY` just arranges the result."
```

To keep **the first few of each group** (the *top-N per group*), compute the window in a `WITH` and filter outside, once the column exists:

```sql run
WITH places AS (
  SELECT robot_id, moment, value,
         ROW_NUMBER() OVER (PARTITION BY robot_id ORDER BY value DESC, moment) AS place
  FROM readings
  WHERE sensor = 'temperature' AND moment >= '2026-03-20'
)
SELECT robot_id, moment, value
FROM places
WHERE place = 1
ORDER BY robot_id;
```

> **Common trap:** writing `WHERE place = 1` in the same query that computes `place`. When `WHERE` is evaluated, the window doesn't exist yet, and SQLite answers *misuse of window function*. Compute it in a `WITH` (or a subquery in `FROM`) and filter outside. Some engines, like DuckDB or Snowflake, have `QUALIFY` to filter windows in the same query; SQLite, PostgreSQL and MySQL don't.

Window functions reached SQLite in version 3.25 (2018), MySQL in 8.0 (2018) and PostgreSQL much earlier, in 8.4 (2009). In an old database you'll see other tricks for numbering:

<!-- legacy: window-functions -->

<!-- mdn: window-functions -->

## Practice

```exercise
id: sql9-predice-rangos
type: predict
title: Ties on the podium
prompt: |
  What does it return?
code: |
  WITH t(robot, peak) AS (
    VALUES ('Tika', 1.86), ('Kusi', 1.61), ('Chasqui', 0.07),
           ('Quilla', 0.07), ('Pituco', 0.05)
  )
  SELECT robot,
         RANK() OVER (ORDER BY peak DESC) AS rk,
         DENSE_RANK() OVER (ORDER BY peak DESC) AS dr
  FROM t
  ORDER BY peak DESC, robot;
options:
  - "Tika | 1 | 1\nKusi | 2 | 2\nChasqui | 3 | 3\nQuilla | 3 | 3\nPituco | 5 | 4"
  - "Tika | 1 | 1\nKusi | 2 | 2\nChasqui | 3 | 3\nQuilla | 4 | 4\nPituco | 5 | 5"
  - "Tika | 1 | 1\nKusi | 2 | 2\nChasqui | 3 | 3\nQuilla | 3 | 3\nPituco | 4 | 5"
  - "Tika | 1 | 1\nKusi | 2 | 2\nChasqui | 3 | 3\nQuilla | 3 | 3\nPituco | 4 | 4"
answer: "Tika | 1 | 1\nKusi | 2 | 2\nChasqui | 3 | 3\nQuilla | 3 | 3\nPituco | 5 | 4"
explain: |
  Chasqui and Quilla tie on 0.07 and share 3rd place in both. After that, `RANK` jumps to 5 (four robots came before Pituco) and `DENSE_RANK` carries on with 4 (there were three different values before).
```

```exercise
id: sql9-predice-where
type: predict
title: Only Pituco
prompt: |
  Same table, but now `WHERE` keeps Pituco. What does it return?
code: |
  WITH t(robot, peak) AS (
    VALUES ('Tika', 1.86), ('Kusi', 1.61), ('Chasqui', 0.07),
           ('Quilla', 0.07), ('Pituco', 0.05)
  )
  SELECT robot, RANK() OVER (ORDER BY peak DESC) AS rk
  FROM t
  WHERE robot = 'Pituco';
options:
  - "Pituco | 1"
  - "Pituco | 5"
  - "Pituco | 4"
  - "Error: misuse of window function"
answer: "Pituco | 1"
explain: |
  `WHERE` runs **before** the window: when `RANK` is computed only one row is left, and the only runner in a race comes first. If you want Pituco's place among all of them, compute the ranking in a `WITH` and filter outside.
```

```exercise
id: sql9-completa-numera
type: complete
title: The first, the second, the third
prompt: |
  List the passes through the room's door on **Tuesday 24** with their `card`, their `moment` and a number `nth` that counts the passes **of each card** in time order (each card's first is 1). Sort by card and moment. Replace the `___`.
starter: |
  SELECT card, moment,
         ___() OVER (___ BY card ORDER BY ___) AS nth
  FROM access_log
  WHERE date(moment) = '2026-03-24'
  ORDER BY card, moment;
solution: |
  SELECT card, moment,
         ROW_NUMBER() OVER (PARTITION BY card ORDER BY moment) AS nth
  FROM access_log
  WHERE date(moment) = '2026-03-24'
  ORDER BY card, moment;
hints:
  - "The function that numbers without repeating is `ROW_NUMBER`; the one that splits into groups inside `OVER` is `PARTITION BY`."
tests:
  - name: each pass on the 24th with its number within its card
    same: SELECT card, moment, ROW_NUMBER() OVER (PARTITION BY card ORDER BY moment) FROM access_log WHERE date(moment) = '2026-03-24' ORDER BY card, moment
    ordered: true
```

```exercise
id: sql9-arregla-where
type: fix
title: The filter that arrives too late
prompt: |
  This query wants **each robot's highest temperature reading** since Friday 20 (if two tie, the earlier one), but SQLite refuses it. Fix it so it returns `robot_id`, `moment` and `value` of those readings, sorted by `robot_id`.
visual:
  figure:
    title: What happens inside
    panes:
      - label: Run order
        value: "FROM → WHERE → … → SELECT (place is born here)"
      - label: What the query asks
        value: "WHERE place = 1"
starter: |
  SELECT robot_id, moment, value,
         ROW_NUMBER() OVER (PARTITION BY robot_id ORDER BY value DESC, moment) AS place
  FROM readings
  WHERE sensor = 'temperature'
    AND moment >= '2026-03-20'
    AND place = 1
  ORDER BY robot_id;
solution: |
  WITH ranked AS (
    SELECT robot_id, moment, value,
           ROW_NUMBER() OVER (PARTITION BY robot_id ORDER BY value DESC, moment) AS place
    FROM readings
    WHERE sensor = 'temperature'
      AND moment >= '2026-03-20'
  )
  SELECT robot_id, moment, value
  FROM ranked
  WHERE place = 1
  ORDER BY robot_id;
hints:
  - "`place` is computed in the `SELECT` step, after `WHERE`. Move the computation into a `WITH ranked AS (…)` and filter `WHERE place = 1` in the outer query."
tests:
  - name: each robot's highest reading, by robot
    same: WITH x AS (SELECT robot_id, moment, value, ROW_NUMBER() OVER (PARTITION BY robot_id ORDER BY value DESC, moment) AS p FROM readings WHERE sensor = 'temperature' AND moment >= '2026-03-20') SELECT robot_id, moment, value FROM x WHERE p = 1 ORDER BY robot_id
    ordered: true
```

```exercise
id: sql9-escribe-top3
type: write
title: The three most unstable
prompt: |
  For each robot, list its **three gyroscope readings furthest from zero** (largest absolute value) since Friday 20: `robot_id`, `moment`, `value` and its `place` (1, 2, 3). If two tie, the earlier one goes first. Sort by `robot_id` and `place`.
visual:
  figure:
    title: Top 3 per robot
    panes:
      - label: "Partition robot_id = 3 (Tika), by |value| from largest to smallest"
        cells: ["1.87", "1.87", "1.87", "1.86", "1.86", "…"]
        highlight: [0, 1, 2]
    caption: "The first three tie on 1.87: the time breaks the tie, and the fourth is left out even though it's worth almost the same."
starter: |
  SELECT robot_id, moment, value
  FROM readings
  WHERE sensor = 'gyroscope'
    AND moment >= '2026-03-20';
solution: |
  WITH ranked AS (
    SELECT robot_id, moment, value,
           ROW_NUMBER() OVER (PARTITION BY robot_id ORDER BY abs(value) DESC, moment) AS place
    FROM readings
    WHERE sensor = 'gyroscope'
      AND moment >= '2026-03-20'
  )
  SELECT robot_id, moment, value, place
  FROM ranked
  WHERE place <= 3
  ORDER BY robot_id, place;
hints:
  - "Sort the window by `abs(value) DESC, moment`: `abs` drops the sign."
  - "Number them in a `WITH` and keep `place <= 3` outside."
tests:
  - name: three readings per robot, in order
    same: WITH x AS (SELECT robot_id, moment, value, ROW_NUMBER() OVER (PARTITION BY robot_id ORDER BY abs(value) DESC, moment) AS p FROM readings WHERE sensor = 'gyroscope' AND moment >= '2026-03-20') SELECT robot_id, moment, value, p FROM x WHERE p <= 3 ORDER BY robot_id, p
    ordered: true
  - name: uses a window function
    source: '\bOVER\s*\('
```

```exercise
id: sql9-escribe-promedio
type: write
title: Each reading against its robot
prompt: |
  For the **temperature** readings on Tuesday 24 between **12:00 and 12:59:59**, show `robot_id`, `moment`, `value` and `average`: the average of **its** robot in that hour, rounded to one decimal. Sort by `robot_id` and `moment`. All 30 readings must come out, not a summary.
starter: |
  SELECT robot_id, round(avg(value), 1) AS average
  FROM readings
  WHERE sensor = 'temperature'
    AND moment BETWEEN '2026-03-24 12:00' AND '2026-03-24 12:59:59'
  GROUP BY robot_id;
solution: |
  SELECT robot_id, moment, value,
         round(avg(value) OVER (PARTITION BY robot_id), 1) AS average
  FROM readings
  WHERE sensor = 'temperature'
    AND moment BETWEEN '2026-03-24 12:00' AND '2026-03-24 12:59:59'
  ORDER BY robot_id, moment;
hints:
  - "`GROUP BY` squashes the readings. Drop it and turn the average into a window: `avg(value) OVER (PARTITION BY robot_id)`."
tests:
  - name: the 30 readings with their robot's average
    same: SELECT robot_id, moment, value, round(avg(value) OVER (PARTITION BY robot_id), 1) FROM readings WHERE sensor = 'temperature' AND moment BETWEEN '2026-03-24 12:00' AND '2026-03-24 12:59:59' ORDER BY robot_id, moment
    ordered: true
  - name: columns robot_id, moment, value and average
    columns: [robot_id, moment, value, average]
```

## The case

```exercise
id: sql9-caso-primera
type: case
title: The first odd reading
prompt: |
  **For each robot, find its first out-of-range gyroscope reading (absolute value above 1) since Friday 20. Which robot went out of calibration on a different night from the others?** Type its name.

  A healthy gyroscope reads almost zero (±0.1). Number each robot's out-of-range readings by time and keep the first; then put the robot's name on it with `robots`.
visual:
  - setting:
      case: sensores
  - schema:
      tables: [readings, robots]
starter: |
  -- The out-of-range readings, in time order
  SELECT robot_id, moment, value
  FROM readings
  WHERE sensor = 'gyroscope'
    AND moment >= '2026-03-20'
    AND abs(value) > 1
  ORDER BY moment
  LIMIT 5;
solution: |
  WITH off_range AS (
    SELECT robot_id, moment, value,
           ROW_NUMBER() OVER (PARTITION BY robot_id ORDER BY moment) AS nth
    FROM readings
    WHERE sensor = 'gyroscope'
      AND moment >= '2026-03-20'
      AND abs(value) > 1
  )
  SELECT r.name, o.moment, o.value
  FROM off_range AS o
  JOIN robots AS r ON r.id = o.robot_id
  WHERE o.nth = 1;
answer: Pituco
answerLabel: Which robot went off on another night?
reveal: |
  **Pituco.** Tika (1.81) and Kusi (−1.58) go out of calibration at **03:02 and 03:04 on Tuesday 24**, right after the 03:00 calibration; Pituco (2.10), at **03:08 on Thursday 26**. Chasqui and Quilla never leave the range. It was two nights, and both times the damage shows up with the calibration. Someone was in the room before 03:00.
hints:
  - "`ROW_NUMBER() OVER (PARTITION BY robot_id ORDER BY moment)` numbers each robot's odd readings; the first one is 1."
  - "The first `LIMIT 5` only shows Tika and Kusi, because they have hundreds of odd readings before Pituco's. That's why you need one per robot, not the first five."
```

## The judge

```exercise
id: sql9-juez-top3
type: judge
title: The three fastest deliveries
prompt: |
  **Return the three fastest deliveries of each district: `district`, `robot` and `minutes`, sorted by district, then by minutes and then by robot.**

  The municipality rewards the fastest delivery robots in each district. If two deliveries in a district took the same time, the one whose robot comes first in the alphabet goes first, and only three get in per district even if there's a tie for third. A district with fewer than three deliveries comes out with the ones it has.

  **Table:** `deliveries(id, robot, district, minutes)`.

  **Result:** `district`, `robot`, `minutes`.
schema: |
  CREATE TABLE deliveries (id INTEGER, robot TEXT, district TEXT, minutes INTEGER);
ordered: true
starter: |
  SELECT district, robot, minutes
  FROM deliveries
  ORDER BY minutes
  LIMIT 3;
solution: |
  WITH ranked AS (
    SELECT district, robot, minutes,
           ROW_NUMBER() OVER (PARTITION BY district ORDER BY minutes, robot) AS place
    FROM deliveries
  )
  SELECT district, robot, minutes
  FROM ranked
  WHERE place <= 3
  ORDER BY district, minutes, robot;
hints:
  - "`LIMIT 3` cuts the whole result, not each district. Number within each district with `ROW_NUMBER() OVER (PARTITION BY district ORDER BY minutes, robot)`."
  - "`RANK` would let four through if there's a tie for third; here three get in."
samples:
  - rows:
      deliveries: [[1, "Tika", "Surquillo", 18], [2, "Pituco", "Barranco", 25], [3, "Kusi", "Surquillo", 12], [4, "Quilla", "Surquillo", 30], [5, "Wayra", "Surquillo", 15], [6, "Chasqui", "Barranco", 22]]
    note: "Surquillo has four deliveries and the 30-minute one is left out. Barranco only has two."
  - rows:
      deliveries: [[1, "Tika", "Lince", 20], [2, "Kusi", "Lince", 20], [3, "Pituco", "Lince", 20], [4, "Chasqui", "Lince", 20]]
    note: "Four tied: Chasqui, Kusi and Pituco get in, in alphabetical order."
edge:
  - rows: { deliveries: [] }
    tag: with no deliveries
  - rows: { deliveries: [[1, "Tika", "Rímac", 9]] }
    tag: with one district and a single delivery
  - rows: { deliveries: [[1, "Tika", "Ate", 40], [2, "Tika", "Ate", 10], [3, "Tika", "Ate", 25], [4, "Tika", "Ate", 10]] }
    tag: with one robot making several deliveries in the same district
random:
  count: 40
  seed: 909
  generate: |
    const bots = ["Chasqui", "Wayra", "Tika", "Kusi", "Quilla", "Pituco", "Illa", "Sumaq"];
    const ds = ["Surquillo", "Barranco", "Miraflores", "Lince", "Rímac"];
    const n = rng.int(0, 25);
    const rows = [];
    for (let i = 0; i < n; i++) rows.push([i + 1, rng.pick(bots), rng.pick(ds), rng.int(5, 30)]);
    return { deliveries: rows };
wrong:
  - |
    SELECT district, robot, minutes FROM deliveries ORDER BY district, minutes, robot LIMIT 3;
  - |
    WITH r AS (SELECT district, robot, minutes, RANK() OVER (PARTITION BY district ORDER BY minutes) AS p FROM deliveries) SELECT district, robot, minutes FROM r WHERE p <= 3 ORDER BY district, minutes, robot;
  - |
    WITH r AS (SELECT district, robot, minutes, ROW_NUMBER() OVER (PARTITION BY district ORDER BY minutes DESC, robot) AS p FROM deliveries) SELECT district, robot, minutes FROM r WHERE p <= 3 ORDER BY district, minutes, robot;
  - |
    WITH r AS (SELECT district, robot, minutes, ROW_NUMBER() OVER (ORDER BY minutes, robot) AS p FROM deliveries) SELECT district, robot, minutes FROM r WHERE p <= 3 ORDER BY district, minutes, robot;
```

## Final mission

```exercise
id: sql9-mision-ultimo
type: mission
title: The last one before three
prompt: |
  **For each night from 16 to 28 March, find the last entry into the room before 03:00, the calibration time: `day`, `time_in`, `card` and the `name` of the person the card belongs to, sorted by day.** Then say whose name is on the card that went in during the early hours of Tuesday 24, the last one before 03:00.

  Entries are the rows of `access_log` with `direction = 'in'`; "before 03:00" is `time(moment) < '03:00'`. A night is counted by the date of its early morning: the 01:38 entry on Tuesday 24 belongs to day 24. Careful with the name: it's the person the card was issued to, not necessarily whoever used it.

  When the query proves it and you answer, together with the judge, session 10 opens.
visual:
  - setting:
      case: sensores
  - window:
      title: One partition per night, from latest to earliest
      table:
        cols: [day, time_in, card]
        rows:
          - ["23", "00:02", "T-0412"]
          - ["23", "04:01", "T-0412"]
          - ["24", "00:03", "T-0533"]
          - ["24", "01:38", "T-0412"]
          - ["24", "04:03", "T-0533"]
      partition: day
      order: time_in
      desc: true
      fn: row_number
      as: place
      caption: "The 04:00 ones get numbered too, but your query's `WHERE` removes them first."
starter: |
  SELECT card, person_id, moment
  FROM access_log
  WHERE direction = 'in'
  ORDER BY moment DESC
  LIMIT 1;
solution: |
  WITH night AS (
    SELECT card, person_id, moment,
           ROW_NUMBER() OVER (PARTITION BY date(moment) ORDER BY moment DESC) AS place
    FROM access_log
    WHERE direction = 'in'
      AND time(moment) < '03:00'
  )
  SELECT date(n.moment) AS day, time(n.moment) AS time_in, n.card, p.name
  FROM night AS n
  JOIN people AS p ON p.id = n.person_id
  WHERE n.place = 1
  ORDER BY day;
answer: Wilmer Zevallos Benavides
answerLabel: Whose name is on the card that went in on the 24th?
reveal: |
  **Wilmer Zevallos Benavides**, the guard. Nearly every night the last entry before 03:00 is his midnight round (00:02 to 00:06). But on the **24th at 01:38** and the **26th at 01:52** his card **T-0412** goes in, and those are exactly the early mornings of the sabotage. Something's odd: from the 24th he does his rounds with another card, **T-0533**. Kiara and Yesenia never go in at night. Why does Wilmer have two cards? In session 10, how long each visit lasted.
hints:
  - "The partition is the night: `PARTITION BY date(moment)`. And the last one is the first if you sort `ORDER BY moment DESC` inside the window."
  - "Filter `direction = 'in'` and the time in the inner `WHERE` (it runs before the window) and `place = 1` in the outer query; do the `JOIN` with `people` there."
tests:
  - name: one row per night, with day, time, card and name, in order
    same: WITH x AS (SELECT card, person_id, moment, ROW_NUMBER() OVER (PARTITION BY date(moment) ORDER BY moment DESC) AS p FROM access_log WHERE direction = 'in' AND time(moment) < '03:00') SELECT date(x.moment), time(x.moment), x.card, pe.name FROM x JOIN people AS pe ON pe.id = x.person_id WHERE x.p = 1 ORDER BY 1
    ordered: true
  - name: columns day, time_in, card and name
    columns: [day, time_in, card, name]
  - name: uses a window function
    source: '\bOVER\s*\('
```

## Expert challenge

```exercise
id: sql9-reto-inestable
type: challenge
title: The most unstable of each day
prompt: |
  **For each day from 20 to 28 March, list the robot (or robots, if they tie) with the gyroscope reading furthest from zero that day: `day`, `robot` (its name) and `peak` (the day's largest absolute value).** Sort by day and robot.

  For people who already code: a window can sit on top of a `GROUP BY`, because it runs afterwards. `RANK() OVER (PARTITION BY … ORDER BY max(abs(value)) DESC)` ranks the groups already computed; with `RANK`, tied rows share 1st.
starter: |
  SELECT date(moment) AS day, robot_id, max(abs(value)) AS peak
  FROM readings
  WHERE sensor = 'gyroscope' AND moment >= '2026-03-20'
  GROUP BY day, robot_id;
solution: |
  WITH daily AS (
    SELECT date(l.moment) AS day, r.name AS robot, max(abs(l.value)) AS peak,
           RANK() OVER (PARTITION BY date(l.moment) ORDER BY max(abs(l.value)) DESC) AS place
    FROM readings AS l
    JOIN robots AS r ON r.id = l.robot_id
    WHERE l.sensor = 'gyroscope' AND l.moment >= '2026-03-20'
    GROUP BY day, r.name
  )
  SELECT day, robot, peak
  FROM daily
  WHERE place = 1
  ORDER BY day, robot;
hints:
  - "From the 20th to the 23rd, ties at 0.07 or 0.08 are normal: they're noise. From the 24th, one robot rules each day."
tests:
  - name: the most unstable of each day, with ties
    same: WITH d AS (SELECT date(l.moment) AS day, r.name AS robot, max(abs(l.value)) AS m, RANK() OVER (PARTITION BY date(l.moment) ORDER BY max(abs(l.value)) DESC) AS p FROM readings AS l JOIN robots AS r ON r.id = l.robot_id WHERE l.sensor = 'gyroscope' AND l.moment >= '2026-03-20' GROUP BY day, r.name) SELECT day, robot, m FROM d WHERE p = 1 ORDER BY day, robot
    ordered: true
  - name: columns day, robot and peak
    columns: [day, robot, peak]
```
