# Session 10 — Frames, running totals, LAG and LEAD

```session
case: sensores
```

## The job

Saturday 28 March. The card that went in before dawn on both sabotage mornings, **T-0412**, is in the name of **Wilmer Zevallos**, the guard. But Wilmer has a story: on Monday 23 he reported that card **lost**, and since that night he does his rounds with a new one, **T-0533**.

To know whether he's lying you have to measure **between rows**: how long each visit lasted (from an `in` to the same card's next `out`) and whether the robots stopped reporting while someone was inside (how much time passed between a reading and **the previous one**). A row on its own knows nothing about its neighbour; a window with a **frame** does.

```setting
case: sensores
title: The room, two nights later
caption: "The door logs every card swipe and the racks every reading. Between one row and the next is what's missing."
```

```dossier
title: What Wilmer says
cards:
  - name: Wilmer Zevallos Benavides
    traits: { style: cap, capColor: "#33507a", shirt: "#33507a" }
    role: The arcade's night guard
    rows: [["Old card", "T-0412, reported lost on Monday 23 at 19:20"], ["New card", "T-0533, since Tuesday 24"]]
    quote: "I do two rounds: at midnight and at four. At two in the morning I'm in the booth at the entrance."
```

```figure
title: "The room's cards"
table:
  head: ["card", "issued to", "status"]
  rows:
    - ["T-0101", "Carmen Ríos", "in use"]
    - ["T-0215", "Yesenia Choque", "in use"]
    - ["T-0388", "Kiara Montes", "in use"]
    - ["T-0412", "Wilmer Zevallos", "reported lost on Monday 23"]
    - ["T-0533", "Wilmer Zevallos", "new, since Tuesday 24"]
```

## The minimum

In session 9 the window was the whole partition. But a window function can also look at only **some** rows around the current one: its **frame**. The frame moves with each row, like a magnifying glass sliding down the table.

```sql
sum(value) OVER (
  PARTITION BY robot_id
  ORDER BY moment
  ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
)
```

- **`ROWS BETWEEN a AND b`** counts rows: `2 PRECEDING` (two back), `CURRENT ROW`, `1 FOLLOWING` (one ahead), `UNBOUNDED PRECEDING` (from the start of the partition) and `UNBOUNDED FOLLOWING` (to the end).
- **Running total**: `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`. The frame grows: each row adds up everything before it.
- **Moving average**: `avg(...)` with `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW`. The frame holds three rows and slides along: it smooths the noise without hiding a real change.

Press ▶ and watch the frame of a moving average slide over Kusi's temperature on Tuesday 24 in the morning:

```window
title: avg(value) OVER (ORDER BY moment ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)
query: |
  SELECT moment, value,
         avg(value) OVER (ORDER BY moment
                          ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS moving_avg
  FROM readings
  WHERE robot_id = 4 AND sensor = 'temperature';
table:
  cols: [moment, value]
  rows:
    - ["10:34", 48.6]
    - ["10:44", 47.6]
    - ["10:54", 49.6]
    - ["11:04", 69.8]
    - ["11:14", 70.3]
    - ["11:24", 68.2]
    - ["11:34", 65.6]
order: moment
fn: avg
col: value
frame: [-2, 0]
as: moving_avg
caption: "The highlighted rows are the frame: the current one and the two behind. At first the frame has fewer rows, because there's nowhere to take more from. At 11:04 Kusi jumps from 49.6 to 69.8 and the average follows it in two steps."
```

```window
title: "sum(value) OVER (ORDER BY moment): the running total"
query: |
  SELECT moment, value,
         sum(value) OVER (ORDER BY moment) AS running_total
  FROM off_range;
table:
  cols: [moment, value]
  rows:
    - ["02:58", 0]
    - ["03:08", 1]
    - ["03:18", 1]
    - ["03:28", 1]
    - ["03:38", 1]
order: moment
fn: sum
col: value
as: running_total
caption: "Without `ROWS BETWEEN`, a window with `ORDER BY` runs from the start up to the current row: the frame grows and the total adds up. Here `value` is 1 when Pituco's reading is out of range."
```

### The default frame

If you don't write the frame, SQL picks one, and **it depends on whether there's an `ORDER BY`**:

| the window has | the default frame is | result |
|---|---|---|
| `OVER (PARTITION BY r)` | the whole partition | the group's total on every row |
| `OVER (PARTITION BY r ORDER BY m)` | `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` | a running total |

**`RANGE`** doesn't count rows: it counts **values** of the `ORDER BY`. With `RANGE`, rows that tie in the `ORDER BY` (the *peers*) enter the frame together, and `RANGE BETWEEN 3600 PRECEDING AND CURRENT ROW` over a number of seconds means "the last hour", however many rows that is. With **`ROWS`**, each row is one row.

### LAG and LEAD: the row behind and the row ahead

**`LAG(col)`** brings the value of `col` from the **previous** row in the window's order; **`LEAD(col)`**, from the **next** one. On the first (or last) row there's no neighbour and they return `NULL`. They take how many rows to skip and a default value: `LAG(value, 1, 0)`. Subtracting `value - LAG(value)` gives the **jump** between two readings: that's how you see the exact moment something changed.

```window
title: LAG(value) OVER (ORDER BY moment)
query: |
  SELECT moment, value,
         LAG(value) OVER (ORDER BY moment) AS previous
  FROM readings
  WHERE robot_id = 3 AND sensor = 'gyroscope';
table:
  cols: [moment, value]
  rows:
    - ["02:32", -0.01]
    - ["02:42", -0.05]
    - ["02:52", -0.02]
    - ["03:02", 1.81]
    - ["03:12", 1.78]
order: moment
fn: lag
col: value
as: previous
caption: "Each row looks one back. At 03:02 Tika's gyroscope reads 1.81 and the previous one −0.02: a jump of 1.83 right after the 03:00 calibration."
```

```sql run
SELECT moment, value,
       round(value - LAG(value) OVER (ORDER BY moment), 2) AS jump
FROM readings
WHERE robot_id = 3
  AND sensor = 'gyroscope'
  AND moment BETWEEN '2026-03-24 02:30' AND '2026-03-24 03:30'
ORDER BY moment;
```

### Gaps and islands

`LAG` also shows **gaps**: if readings arrive every 10 minutes, `julianday(moment) - julianday(LAG(moment))` times 1440 should be about 10. A 40 says three readings are missing.

The problem the other way round, finding **islands** (streaks of consecutive days, consecutive out-of-range readings), has a classic trick: number the rows with `ROW_NUMBER` and subtract that number from the date. While the days are consecutive, the date goes up one by one just like the number, and the difference **doesn't change**: that difference is the island's name. Then `GROUP BY` that difference.

```figure
title: Consecutive days have the same difference
panes:
  - table:
      head: [day, "ROW_NUMBER()", "day − n", island]
      rows:
        - ["20", "1", "19", "A"]
        - ["21", "2", "19", "A"]
        - ["22", "3", "19", "A"]
        - ["25", "4", "21", "B"]
        - ["26", "5", "21", "B"]
        - ["28", "6", "22", "C"]
caption: "The 23rd, 24th and 27th are missing, and each gap changes the difference. Three islands: the 20th to the 22nd (3 days), the 25th to the 26th (2) and the 28th (1). In SQLite a date becomes a number with `julianday(day)`."
```

> **Common trap:** `LAST_VALUE(value) OVER (ORDER BY moment)` does **not** give the partition's last value: it gives the current row's. With `ORDER BY` and no frame, the frame ends at the current row (`… AND CURRENT ROW`), so the last thing it sees is itself. For the real last one, write the whole frame: `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`. `FIRST_VALUE` doesn't have that problem, because the frame always starts at the beginning.

<!-- legacy: lag-lead -->

<!-- mdn: lag-lead -->

## Practice

```exercise
id: sql10-predice-acumulado
type: predict
title: A running total with ties
prompt: |
  Two rows have `k = 2`. With the default frame (`RANGE`), what does it return?
code: |
  WITH t(k, v) AS (VALUES (1, 10), (2, 20), (2, 5), (3, 1))
  SELECT k, sum(v) OVER (ORDER BY k) AS running_total
  FROM t
  ORDER BY k;
options:
  - "1 | 10\n2 | 35\n2 | 35\n3 | 36"
  - "1 | 10\n2 | 30\n2 | 35\n3 | 36"
  - "1 | 10\n2 | 20\n2 | 5\n3 | 1"
  - "1 | 36\n2 | 36\n2 | 36\n3 | 36"
answer: "1 | 10\n2 | 35\n2 | 35\n3 | 36"
explain: |
  `RANGE` puts rows that tie in the `ORDER BY` together: for both rows with `k = 2`, the frame reaches the last row with `k = 2`, and both see 10 + 20 + 5 = 35. With `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`, one would see 30 and the other 35 (in an order you don't control).
```

```exercise
id: sql10-predice-ultimo
type: predict
title: The last that isn't the last
prompt: |
  What does it return?
code: |
  WITH t(k, v) AS (VALUES (1, 'a'), (2, 'b'), (3, 'c'))
  SELECT k, LAST_VALUE(v) OVER (ORDER BY k) AS last_one
  FROM t
  ORDER BY k;
options:
  - "1 | a\n2 | b\n3 | c"
  - "1 | c\n2 | c\n3 | c"
  - "1 | a\n2 | a\n3 | a"
  - "1 | NULL\n2 | a\n3 | b"
answer: "1 | a\n2 | b\n3 | c"
explain: |
  With `ORDER BY` and no frame, the frame runs from the start **to the current row**. The last row in the frame is the current one, so each row sees itself. With `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING` you'd get `c` on all three.
```

```exercise
id: sql10-completa-salto
type: complete
title: Tika's jump
prompt: |
  Show each of Tika's (`robot_id = 3`) gyroscope readings on Tuesday 24 between **02:30 and 03:30**, with its `moment`, its `value` and the `jump` from the previous reading (`value` minus the previous one, rounded to 2 decimals). Replace the `___`.
starter: |
  SELECT moment, value,
         round(value - ___(value) OVER (___ BY moment), 2) AS jump
  FROM readings
  WHERE robot_id = 3
    AND sensor = 'gyroscope'
    AND moment BETWEEN '2026-03-24 02:30' AND '2026-03-24 03:30'
  ORDER BY moment;
solution: |
  SELECT moment, value,
         round(value - LAG(value) OVER (ORDER BY moment), 2) AS jump
  FROM readings
  WHERE robot_id = 3
    AND sensor = 'gyroscope'
    AND moment BETWEEN '2026-03-24 02:30' AND '2026-03-24 03:30'
  ORDER BY moment;
hints:
  - "The function that looks at the previous row is `LAG`, and the window is sorted with `ORDER BY`."
tests:
  - name: each reading with its jump, in order
    same: SELECT moment, value, round(value - LAG(value) OVER (ORDER BY moment), 2) FROM readings WHERE robot_id = 3 AND sensor = 'gyroscope' AND moment BETWEEN '2026-03-24 02:30' AND '2026-03-24 03:30' ORDER BY moment
    ordered: true
```

```exercise
id: sql10-arregla-particion
type: fix
title: Two robots in the same average
prompt: |
  This query wants the **three-reading moving average** of temperature for **each robot** (Tika and Kusi) on Tuesday 24 between 10:00 and 12:00, rounded to one decimal. But Tika's numbers come out inflated: the frame mixes in Kusi's readings. Fix it.
visual:
  figure:
    title: What the frame sees
    panes:
      - label: Without PARTITION BY (wrong)
        cells: ["Tika 34.6", "Kusi 48.7", "Tika 34.1"]
        highlight: [0, 1, 2]
      - label: With PARTITION BY robot_id (right)
        cells: ["Tika 34.6", "Tika 34.1", "Tika 35.8"]
        highlight: [0, 1, 2]
starter: |
  SELECT robot_id, moment, value,
         round(avg(value) OVER (ORDER BY moment
                                ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 1) AS moving_avg
  FROM readings
  WHERE robot_id IN (3, 4)
    AND sensor = 'temperature'
    AND moment BETWEEN '2026-03-24 10:00' AND '2026-03-24 12:00'
  ORDER BY robot_id, moment;
solution: |
  SELECT robot_id, moment, value,
         round(avg(value) OVER (PARTITION BY robot_id ORDER BY moment
                                ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 1) AS moving_avg
  FROM readings
  WHERE robot_id IN (3, 4)
    AND sensor = 'temperature'
    AND moment BETWEEN '2026-03-24 10:00' AND '2026-03-24 12:00'
  ORDER BY robot_id, moment;
hints:
  - "The final `ORDER BY` doesn't separate the robots inside the window. Add `PARTITION BY robot_id` before the window's `ORDER BY`."
tests:
  - name: each robot's moving average on its own
    same: SELECT robot_id, moment, value, round(avg(value) OVER (PARTITION BY robot_id ORDER BY moment ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 1) FROM readings WHERE robot_id IN (3, 4) AND sensor = 'temperature' AND moment BETWEEN '2026-03-24 10:00' AND '2026-03-24 12:00' ORDER BY robot_id, moment
    ordered: true
```

```exercise
id: sql10-escribe-acumulado
type: write
title: How many out of range so far
prompt: |
  For **Pituco**'s (`robot_id = 11`) gyroscope readings on Thursday 26 between **02:30 and 04:00**, show `moment`, `value` and `off_range`: how many out-of-range readings (absolute value above 1) it has **accumulated** up to that row, inclusive. Sort by `moment`.
visual:
  figure:
    title: A counter that only goes up
    panes:
      - label: "abs(value) > 1"
        cells: ["no", "no", "no", "yes", "yes", "yes"]
        highlight: [3, 4, 5]
      - label: off_range
        cells: ["0", "0", "0", "1", "2", "3"]
starter: |
  SELECT moment, value
  FROM readings
  WHERE robot_id = 11
    AND sensor = 'gyroscope'
    AND moment BETWEEN '2026-03-26 02:30' AND '2026-03-26 04:00'
  ORDER BY moment;
solution: |
  SELECT moment, value,
         sum(CASE WHEN abs(value) > 1 THEN 1 ELSE 0 END)
           OVER (ORDER BY moment ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS off_range
  FROM readings
  WHERE robot_id = 11
    AND sensor = 'gyroscope'
    AND moment BETWEEN '2026-03-26 02:30' AND '2026-03-26 04:00'
  ORDER BY moment;
hints:
  - "`CASE WHEN abs(value) > 1 THEN 1 ELSE 0 END` is 1 on out-of-range readings. Add it up with a window sorted by `moment`."
tests:
  - name: the running counter, in order
    same: SELECT moment, value, sum(CASE WHEN abs(value) > 1 THEN 1 ELSE 0 END) OVER (ORDER BY moment) FROM readings WHERE robot_id = 11 AND sensor = 'gyroscope' AND moment BETWEEN '2026-03-26 02:30' AND '2026-03-26 04:00' ORDER BY moment
    ordered: true
  - name: columns moment, value and off_range
    columns: [moment, value, off_range]
```

```exercise
id: sql10-escribe-primera
type: write
title: Against the first of the stretch
prompt: |
  For **Kusi**'s (`robot_id = 4`) temperature readings on Tuesday 24 between **10:00 and 13:00**, show `moment`, `value` and `rise`: how much it went up since the **first reading of that stretch**, rounded to one decimal. Sort by `moment`.
starter: |
  SELECT moment, value
  FROM readings
  WHERE robot_id = 4
    AND sensor = 'temperature'
    AND moment BETWEEN '2026-03-24 10:00' AND '2026-03-24 13:00'
  ORDER BY moment;
solution: |
  SELECT moment, value,
         round(value - FIRST_VALUE(value) OVER (ORDER BY moment), 1) AS rise
  FROM readings
  WHERE robot_id = 4
    AND sensor = 'temperature'
    AND moment BETWEEN '2026-03-24 10:00' AND '2026-03-24 13:00'
  ORDER BY moment;
hints:
  - "`FIRST_VALUE(value) OVER (ORDER BY moment)` brings the value of the frame's first row, which with the default frame is always the first of the stretch."
tests:
  - name: each reading's rise, in order
    same: SELECT moment, value, round(value - FIRST_VALUE(value) OVER (ORDER BY moment), 1) FROM readings WHERE robot_id = 4 AND sensor = 'temperature' AND moment BETWEEN '2026-03-24 10:00' AND '2026-03-24 13:00' ORDER BY moment
    ordered: true
  - name: columns moment, value and rise
    columns: [moment, value, rise]
```

## The case

```exercise
id: sql10-caso-visitas
type: case
title: How long each visit lasted
prompt: |
  **Work out how many minutes each visit to the room that started before dawn (entry before 06:00) lasted, and list the ones longer than 10 minutes, longest first. How many minutes did the longest one last?**

  A visit runs from an `in` to the **next** swipe of the same card, which is its `out`. With `LEAD` over `access_log`, partitioned by card and sorted by time, each entry can see its exit. For the minutes: `(julianday(left_at) - julianday(entered)) * 1440`.
visual:
  - setting:
      case: sensores
  - window:
      title: LEAD(moment) OVER (PARTITION BY card ORDER BY moment)
      table:
        cols: [card, moment, direction]
        rows:
          - ["T-0533", "00:03", "in"]
          - ["T-0533", "00:08", "out"]
          - ["T-0533", "04:03", "in"]
          - ["T-0533", "04:07", "out"]
      partition: card
      order: moment
      fn: lead
      col: moment
      as: left_at
      caption: "Two rounds by T-0533, Wilmer's new card. Each row looks at the next one of its card: the entry sees its exit; the last has no next and stays NULL."
starter: |
  -- One card's swipes, in order
  SELECT card, moment, direction
  FROM access_log
  WHERE card = 'T-0533'
  ORDER BY moment
  LIMIT 4;
solution: |
  WITH visits AS (
    SELECT card, moment, direction,
           LEAD(moment) OVER (PARTITION BY card ORDER BY moment) AS left_at
    FROM access_log
  )
  SELECT card, moment AS entered, left_at,
         round((julianday(left_at) - julianday(moment)) * 1440) AS minutes
  FROM visits
  WHERE direction = 'in'
    AND time(moment) < '06:00'
    AND (julianday(left_at) - julianday(moment)) * 1440 > 10
  ORDER BY minutes DESC;
answer: "39"
answerLabel: How many minutes did the longest last?
reveal: |
  **39 minutes**, and both long visits belong to **T-0412**. Its two visits before dawn last **38 minutes** (24 March, 01:38 to 02:16) and **39 minutes** (26 March, 01:52 to 02:31). Wilmer's rounds, with either of his cards, last 3 to 5 minutes. And he had reported T-0412 lost on Monday 23, before the first visit.
hints:
  - "Compute `LEAD` over **all** the swipes: if you filter `direction = 'in'` in the same query, `WHERE` runs first and `LEAD` would pair each entry with the next entry. Filter outside, in the query that reads the `WITH`."
  - "In SQLite you can write the whole minutes condition in the outer `WHERE`: `(julianday(left_at) - julianday(moment)) * 1440 > 10`."
```

## The judge

```exercise
id: sql10-juez-racha
type: judge
title: The longest streak
prompt: |
  **Return, for each robot, its longest streak of consecutive days with a shift: `robot` and `days`, sorted by robot.**

  Loop rewards steadiness. The table has one shift per row, but the system sometimes logs the same shift twice (same robot, same day). Two days are consecutive if the second is the day after the first.

  **Table:** `shifts(id, robot, day)`, with `day` as `'YYYY-MM-DD'`.

  **Result:** `robot` and the length of its longest streak, in days.
schema: |
  CREATE TABLE shifts (id INTEGER, robot TEXT, day TEXT);
ordered: true
starter: |
  SELECT robot, count(*) AS days
  FROM shifts
  GROUP BY robot
  ORDER BY robot;
solution: |
  WITH worked AS (
    SELECT DISTINCT robot, day FROM shifts
  ),
  islands AS (
    SELECT robot, day,
           julianday(day) - ROW_NUMBER() OVER (PARTITION BY robot ORDER BY day) AS island
    FROM worked
  ),
  streaks AS (
    SELECT robot, count(*) AS length
    FROM islands
    GROUP BY robot, island
  )
  SELECT robot, max(length) AS days
  FROM streaks
  GROUP BY robot
  ORDER BY robot;
hints:
  - "First drop the repeats with `SELECT DISTINCT robot, day`. Then `julianday(day) - ROW_NUMBER() OVER (PARTITION BY robot ORDER BY day)` is the same on every day of one streak."
  - "Count each island's days with `GROUP BY robot, island` and keep each robot's maximum."
samples:
  - rows:
      shifts: [[1, "Tika", "2026-03-20"], [2, "Tika", "2026-03-21"], [3, "Tika", "2026-03-22"], [4, "Tika", "2026-03-25"], [5, "Tika", "2026-03-26"], [6, "Kusi", "2026-03-28"]]
    note: "Tika has a streak of 3 (20th to 22nd) and another of 2 (25th and 26th). Kusi, one of 1."
  - rows:
      shifts: [[1, "Pituco", "2026-02-27"], [2, "Pituco", "2026-02-28"], [3, "Pituco", "2026-02-28"], [4, "Pituco", "2026-03-01"]]
    note: "The 28th is there twice and counts once. And 28 February to 1 March are consecutive days too: 3."
edge:
  - rows: { shifts: [] }
    tag: with no shifts
  - rows: { shifts: [[1, "Quilla", "2026-03-10"], [2, "Quilla", "2026-03-12"], [3, "Quilla", "2026-03-14"]] }
    tag: with no pair of consecutive days
  - rows: { shifts: [[1, "Tika", "2026-12-31"], [2, "Tika", "2027-01-01"], [3, "Tika", "2027-01-02"], [4, "Tika", "2026-12-31"]] }
    tag: with a streak across New Year
random:
  count: 40
  seed: 1010
  generate: |
    const bots = ["Chasqui", "Tika", "Kusi", "Quilla", "Pituco"];
    const n = rng.int(0, 30);
    const rows = [];
    for (let i = 0; i < n; i++) {
      const d = new Date(Date.UTC(2026, 1, 20 + rng.int(0, 20)));
      rows.push([i + 1, rng.pick(bots), d.toISOString().slice(0, 10)]);
    }
    return { shifts: rows };
wrong:
  - |
    SELECT robot, count(DISTINCT day) FROM shifts GROUP BY robot ORDER BY robot;
  - |
    WITH i AS (SELECT robot, julianday(day) - ROW_NUMBER() OVER (PARTITION BY robot ORDER BY day) AS island FROM shifts), r AS (SELECT robot, count(*) AS c FROM i GROUP BY robot, island) SELECT robot, max(c) FROM r GROUP BY robot ORDER BY robot;
  - |
    WITH d AS (SELECT DISTINCT robot, day FROM shifts), i AS (SELECT robot, julianday(day) - ROW_NUMBER() OVER (ORDER BY day) AS island FROM d), r AS (SELECT robot, count(*) AS c FROM i GROUP BY robot, island) SELECT robot, max(c) FROM r GROUP BY robot ORDER BY robot;
  - |
    WITH d AS (SELECT DISTINCT robot, day FROM shifts), i AS (SELECT robot, CAST(substr(day, 9, 2) AS INTEGER) - ROW_NUMBER() OVER (PARTITION BY robot ORDER BY day) AS island FROM d), r AS (SELECT robot, count(*) AS c FROM i GROUP BY robot, island) SELECT robot, max(c) FROM r GROUP BY robot ORDER BY robot;
```

## Final mission

```exercise
id: sql10-mision-silencio
type: mission
title: When the robots go quiet
prompt: |
  **Find the robots' silences since Friday 20: every time more than 25 minutes passed between two consecutive gyroscope readings of the same robot. Show the robot's name as `robot`, the reading before as `gap_from`, the one after as `gap_to` and the `minutes` (rounded), ordered by `gap_from`.** Then say which robot went quiet first.

  Readings arrive every 10 minutes; sometimes one gets lost (20 minutes), and that's normal. Compare with T-0412's visits: on the 24th from 01:38 to 02:16 and on the 26th from 01:52 to 02:31.

  When the query proves it and you answer, together with the judge, session 11 opens.
visual:
  - setting:
      case: sensores
  - figure:
      title: "The early morning of Tuesday 24, row by row"
      lanes:
        from: "00:00"
        to: "03:30"
        tick: 30
        bands: [{"from": "01:38", "to": "02:16", "label": "T-0412 inside"}]
        rows:
          - label: "Door"
            sub: "cards"
            bars:
              - {"from": "01:38", "to": "02:16", "label": "T-0412"}
            events: [{"at": "00:03", "label": "T-0533"}, {"at": "03:00", "label": "calibrates", "side": "left"}]
          - label: "Tika"
            sub: "readings"
            bars:
              - from: "01:32"
                to: "02:12"
                label: "silent"
                kind: "gap"
                by: "sql10-mision-silencio"
            events: [{"at": "03:02", "label": "out of range", "kind": "bad", "side": "left", "by": "sql9-caso-primera"}]
          - label: "Kusi"
            sub: "readings"
            bars:
              - from: "01:44"
                to: "02:24"
                label: "silent"
                kind: "gap"
                by: "sql10-mision-silencio"
            events: [{"at": "03:04", "label": "out of range", "kind": "bad", "side": "left", "by": "sql9-caso-primera"}]
  - figure:
      title: "The early morning of Thursday 26"
      lanes:
        from: "01:00"
        to: "03:30"
        tick: 30
        bands: [{"from": "01:52", "to": "02:31", "label": "T-0412 inside"}]
        rows:
          - label: "Door"
            sub: "cards"
            bars: [{"from": "01:52", "to": "02:31", "label": "T-0412"}]
            events: [{"at": "03:00", "label": "calibrates", "side": "left"}]
          - label: "Pituco"
            sub: "readings"
            bars:
              - from: "01:58"
                to: "02:38"
                label: "silent"
                kind: "gap"
                by: "sql10-mision-silencio"
            events: [{"at": "03:08", "label": "out of range", "kind": "bad", "side": "left", "by": "sql9-caso-primera"}]
starter: |
  SELECT robot_id, moment
  FROM readings
  WHERE sensor = 'gyroscope'
    AND moment >= '2026-03-20'
  ORDER BY robot_id, moment
  LIMIT 10;
solution: |
  WITH pairs AS (
    SELECT robot_id, moment,
           LAG(moment) OVER (PARTITION BY robot_id ORDER BY moment) AS before
    FROM readings
    WHERE sensor = 'gyroscope'
      AND moment >= '2026-03-20'
  )
  SELECT r.name AS robot, p.before AS gap_from, p.moment AS gap_to,
         round((julianday(p.moment) - julianday(p.before)) * 1440) AS minutes
  FROM pairs AS p
  JOIN robots AS r ON r.id = p.robot_id
  WHERE (julianday(p.moment) - julianday(p.before)) * 1440 > 25
  ORDER BY gap_from;
answer: Tika
answerLabel: Which robot went quiet first?
reveal: |
  **Tika**, from 01:32 to 02:12 on Tuesday 24; then **Kusi**, from 01:44 to 02:24, and **Pituco**, from 01:58 to 02:38 on Thursday 26. Three 40-minute silences, and in all three T-0412 was inside: someone plugged into each robot and restarted it. Meanwhile, Wilmer's new card was doing its usual rounds at midnight and four. **It wasn't Wilmer: someone used his lost card.** Carmen remembers that only two people know how to change the robots' firmware: herself and **Gonzalo Pumacayo**, who programmed it until February.
hints:
  - "`LAG(moment) OVER (PARTITION BY robot_id ORDER BY moment)` brings the same robot's previous reading. Compute it in a `WITH` and filter the minutes outside."
  - "Minutes between two moments: `(julianday(after) - julianday(before)) * 1440`. Each robot's first reading has `before` as NULL, and a comparison with NULL never passes `WHERE`."
tests:
  - name: the silences over 25 minutes, in order
    same: WITH x AS (SELECT robot_id, moment, LAG(moment) OVER (PARTITION BY robot_id ORDER BY moment) AS a FROM readings WHERE sensor = 'gyroscope' AND moment >= '2026-03-20') SELECT r.name, x.a, x.moment, round((julianday(x.moment) - julianday(x.a)) * 1440) FROM x JOIN robots AS r ON r.id = x.robot_id WHERE (julianday(x.moment) - julianday(x.a)) * 1440 > 25 ORDER BY x.a
    ordered: true
  - name: columns robot, gap_from, gap_to and minutes
    columns: [robot, gap_from, gap_to, minutes]
  - name: uses LAG or LEAD
    source: '\b(LAG|LEAD)\s*\('
```

## Expert challenge

```exercise
id: sql10-reto-hora
type: challenge
title: The last hour, not the last six
prompt: |
  **For Tika's gyroscope readings on Tuesday 24 between 01:00 and 03:30, show `moment`, `value`, `average`: the average of the readings in the last hour (from 3600 seconds before up to this one, inclusive), rounded to 2 decimals, and `row_count`: how many readings fell in that hour.** Sort by `moment`.

  For people who already code: `ROWS BETWEEN 5 PRECEDING AND CURRENT ROW` would be "the last six readings", and after the 01:32 silence those six would span more than an hour. `RANGE` with a number measures in units of the `ORDER BY`: sort by `unixepoch(moment)` (seconds) and use `RANGE BETWEEN 3600 PRECEDING AND CURRENT ROW`.
starter: |
  SELECT moment, value
  FROM readings
  WHERE robot_id = 3
    AND sensor = 'gyroscope'
    AND moment BETWEEN '2026-03-24 01:00' AND '2026-03-24 03:30'
  ORDER BY moment;
solution: |
  SELECT moment, value,
         round(avg(value) OVER last_hour, 2) AS average,
         count(*) OVER last_hour AS row_count
  FROM readings
  WHERE robot_id = 3
    AND sensor = 'gyroscope'
    AND moment BETWEEN '2026-03-24 01:00' AND '2026-03-24 03:30'
  WINDOW last_hour AS (ORDER BY unixepoch(moment) RANGE BETWEEN 3600 PRECEDING AND CURRENT ROW)
  ORDER BY moment;
hints:
  - "`WINDOW name AS (…)` defines a window once so several columns can use it with `OVER name`."
  - "Look at `row_count` at 02:12: only 4, because the silence left the hour almost empty."
tests:
  - name: average and row count of the last hour
    same: SELECT moment, value, round(avg(value) OVER (ORDER BY unixepoch(moment) RANGE BETWEEN 3600 PRECEDING AND CURRENT ROW), 2), count(*) OVER (ORDER BY unixepoch(moment) RANGE BETWEEN 3600 PRECEDING AND CURRENT ROW) FROM readings WHERE robot_id = 3 AND sensor = 'gyroscope' AND moment BETWEEN '2026-03-24 01:00' AND '2026-03-24 03:30' ORDER BY moment
    ordered: true
  - name: columns moment, value, average and row_count
    columns: [moment, value, average, row_count]
  - name: uses RANGE
    source: '\bRANGE\s+BETWEEN'
```
