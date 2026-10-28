# Session 11 — JSON and time series

```session
case: sensores
```

## The job

Monday 30 March. You already know **when**: the robots went quiet for 40 minutes before dawn on the 24th and the 26th, while someone was using Wilmer's lost card. What's missing is **who**. Carmen is sure that to throw a robot out of calibration like that you have to change its firmware, and that leaves a mark.

The mark is in the `data` column of `readings`: every reading carries a **JSON** text with the firmware version that produced it, and when a robot gets updated it stores a row from the `'system'` sensor with who updated it, from which device and what changed. SQL can't see inside a text… except with the JSON functions. And to read the readings as what they are, a **time series**, you'll group them by hour and compare them with the previous hour or day.

```setting
case: sensores
title: The room's monitor
caption: "Every reading stores its firmware as JSON. The monitor shows Tika's gyroscope: calm, a gap and a jump."
```

```dossier
title: The ones who know firmware
cards:
  - name: Carmen Ríos Llanos
    traits: { style: bun, shirt: "#3f7cc4", glasses: true }
    role: Owner of Loop, user crios
    rows: [["Released", "2.5.9, on 18 March"]]
    quote: "To change a firmware you have to know how to program it. Two of us here can."
  - name: Yesenia Choque Ugarte
    traits: { style: long, shirt: "#c4553f", earrings: true }
    role: Intern, user ychoque
    rows: [["Installed", "2.5.9, on Friday 20"]]
    quote: "I updated all five robots to the official version."
  - name: Gonzalo Pumacayo Tello
    traits: { style: short, shirt: "#6b4fa0", glasses: true, hood: "#3a3550" }
    role: Loop's former programmer
    rows: [["Left", "in February, for the competition"]]
    quote: "My card hasn't opened anything since February. Those nights I was at home, in Surco."
```

## The minimum

**JSON** is text with structure: objects `{"key": value}`, lists `[a, b]`, text in double quotes, numbers, `true`, `false` and `null`. SQLite stores it as ordinary text (`TEXT`) and reads it with functions that take a **path**: `$` is the whole document, `.key` goes into an object and `[0]` into a list.

```figure
title: A 'system' sensor row, inside
input:
  label: data (a text)
  text: |
    {"event": "update",
     "from": "2.5.9",
     "to": "2.6.0",
     "user": "gpumacayo",
     "device": "LAP-07",
     "patches": ["gyroscope.offset=+1.8",
                 "calibration.check=off"]}
arrow: paths
output:
  label: What each one returns
  table:
    head: [expression, result]
    rows:
      - ["data ->> '$.to'", "2.6.0 (text)"]
      - ["data -> '$.to'", "\"2.6.0\" (JSON, quoted)"]
      - ["data ->> '$.patches[0]'", "gyroscope.offset=+1.8"]
      - ["data -> '$.patches'", "[\"gyroscope…\", \"calibration…\"]"]
      - ["data ->> '$.nothing'", "NULL"]
caption: "`->>` takes out an SQL value (text, number or NULL); `->` takes out a piece of JSON. `json_extract(data, '$.to')` is the same as `->>` for simple values."
```

- **`json_extract(data, '$.firmware')`** or **`data ->> '$.firmware'`**: the value, ready to compare. A JSON `true` arrives as `1` and a `false` as `0`.
- **`data -> '$.firmware'`**: the piece of JSON as it is, with its quotes. It's for navigating further, not for comparing with `'2.6.0'`.
- **`json_valid(text)`** says whether the text is well-formed JSON; a JSON function on broken text gives a *malformed JSON* error.

```sql run
SELECT moment, data,
       data ->> '$.firmware' AS version,
       data ->> '$.ok' AS ok
FROM readings
WHERE robot_id = 3
  AND sensor = 'gyroscope'
  AND moment BETWEEN '2026-03-24 02:00' AND '2026-03-24 02:30';
```

### A list becomes rows: json_each

**`json_each(text, path)`** is a function that returns **a table**: one row for each element of the list (or object) the path points to, with columns `key` (the position or the key), `value` and `type`. It goes in `FROM` like any table, and with `JOIN` it's walked **once for each row** of the table on its left:

```figure
title: json_each, one row per element
input:
  label: "data -> '$.patches' of one row"
  text: '["gyroscope.offset=-1.6", "fan.threshold=75", "calibration.check=off"]'
arrow: "JOIN json_each(data, '$.patches')"
output:
  label: What the JOIN adds
  table:
    head: [key, value]
    rows: [["0", "gyroscope.offset=-1.6"], ["1", "fan.threshold=75"], ["2", "calibration.check=off"]]
caption: "Kusi's row is repeated three times, once per patch. It's a JOIN without `ON`: the condition is that each patch comes from **that** row."
```

```sql run
SELECT l.robot_id, l.moment, p.value AS patch
FROM readings AS l
JOIN json_each(l.data, '$.patches') AS p
WHERE l.sensor = 'system'
  AND l.moment >= '2026-03-20';
```

The other way round, **`json_group_array(x)`** is an aggregate that gathers a group's values into a JSON list, and **`json_group_object(key, value)`** into an object. Since SQLite 3.44 they take an `ORDER BY` inside: `json_group_array(version ORDER BY moment)`.

### Time series: group by hour and look back

A time series is read in **buckets**: all the readings of one hour, or of one day. `strftime('%Y-%m-%d %H:00', moment)` cuts the moment down to its hour; with `GROUP BY` on that you count or average per hour. If a robot reports every 10 minutes, each hour should have **6** readings: a bucket with fewer is an hour with lost readings.

```result
title: Tika's readings per hour, early on the 24th
query: |
  SELECT strftime('%Y-%m-%d %H:00', moment) AS hour, count(*) AS reading_count
  FROM readings
  WHERE robot_id = 3
    AND sensor = 'gyroscope'
    AND moment BETWEEN '2026-03-24 00:00' AND '2026-03-24 05:59:59'
  GROUP BY hour
  ORDER BY hour;
caption: "At 01:00 two readings are missing and at 02:00 one: the 40-minute silence, split between two hours."
```

To **compare with the previous period**, put a window on top of the `GROUP BY`: `max(value) - LAG(max(value)) OVER (ORDER BY day)` is the change against the day before.

> **Common trap:** an hour with **no** readings at all doesn't appear in the `GROUP BY`: there are no rows to group, so it doesn't come out with `count = 0`, it simply doesn't come out. To see it, compare each bucket with the previous one (`LAG(hour)`) and look for jumps of more than an hour, or build a list of every hour and join the readings to it with `LEFT JOIN`; that list is generated with `WITH RECURSIVE`, in session 12.

<!-- legacy: json-arrows -->

<!-- mdn: json-arrows -->

## Practice

```exercise
id: sql11-predice-flechas
type: predict
title: One arrow or two
prompt: |
  What does it return?
code: |
  SELECT '{"firmware":"2.6.0","ok":true}' -> '$.firmware',
         '{"firmware":"2.6.0","ok":true}' ->> '$.firmware',
         '{"firmware":"2.6.0","ok":true}' ->> '$.ok';
options:
  - "\"2.6.0\" | 2.6.0 | 1"
  - "2.6.0 | 2.6.0 | true"
  - "2.6.0 | \"2.6.0\" | 1"
  - "\"2.6.0\" | 2.6.0 | true"
answer: "\"2.6.0\" | 2.6.0 | 1"
explain: |
  `->` returns JSON, and a text in JSON keeps its quotes: `"2.6.0"`. `->>` returns the SQL value, without quotes. And SQLite has no booleans: JSON's `true` arrives as `1`.
```

```exercise
id: sql11-predice-each
type: predict
title: A list turned into rows
prompt: |
  What does it return?
code: |
  SELECT key, value
  FROM json_each('["gyroscope.offset=+1.8", "calibration.check=off"]');
options:
  - "0 | gyroscope.offset=+1.8\n1 | calibration.check=off"
  - "1 | gyroscope.offset=+1.8\n2 | calibration.check=off"
  - "0 | [\"gyroscope.offset=+1.8\", \"calibration.check=off\"]"
  - "gyroscope.offset | +1.8\ncalibration.check | off"
answer: "0 | gyroscope.offset=+1.8\n1 | calibration.check=off"
explain: |
  One row per element. In a list, `key` is the position and starts at **0**, as in JSON (unlike `substr`, which counts from 1). `json_each` doesn't split the texts: the `=` is part of the value.
```

```exercise
id: sql11-completa-version
type: complete
title: Each reading's version
prompt: |
  Show the `moment` and the firmware `version` (the value of `firmware` inside `data`, as text) of each of Tika's (`robot_id = 3`) gyroscope readings on Tuesday 24 between **02:00 and 02:30**. Replace the `___`.
starter: |
  SELECT moment,
         data ___ '___' AS version
  FROM readings
  WHERE robot_id = 3
    AND sensor = 'gyroscope'
    AND moment BETWEEN '2026-03-24 02:00' AND '2026-03-24 02:30'
  ORDER BY moment;
solution: |
  SELECT moment,
         data ->> '$.firmware' AS version
  FROM readings
  WHERE robot_id = 3
    AND sensor = 'gyroscope'
    AND moment BETWEEN '2026-03-24 02:00' AND '2026-03-24 02:30'
  ORDER BY moment;
hints:
  - "The arrow that returns an SQL value is `->>`, and the path starts at `$`: `'$.firmware'`."
tests:
  - name: moment and version, in order
    same: SELECT moment, json_extract(data, '$.firmware') FROM readings WHERE robot_id = 3 AND sensor = 'gyroscope' AND moment BETWEEN '2026-03-24 02:00' AND '2026-03-24 02:30' ORDER BY moment
    ordered: true
```

```exercise
id: sql11-arregla-comillas
type: fix
title: None with 2.6.0
prompt: |
  This query counts, for each robot, how many gyroscope readings since Friday 20 come from firmware **2.6.0**. It returns nothing, even though Tika has been on that version for days. Fix it; the result is `robot_id` and `reading_count`, by `robot_id`.
visual:
  figure:
    title: What the WHERE compares
    panes:
      - label: "data -> '$.firmware'"
        value: "\"2.6.0\""
      - label: "what it looks for"
        value: "2.6.0"
starter: |
  SELECT robot_id, count(*) AS reading_count
  FROM readings
  WHERE sensor = 'gyroscope'
    AND moment >= '2026-03-20'
    AND data -> '$.firmware' = '2.6.0'
  GROUP BY robot_id
  ORDER BY robot_id;
solution: |
  SELECT robot_id, count(*) AS reading_count
  FROM readings
  WHERE sensor = 'gyroscope'
    AND moment >= '2026-03-20'
    AND data ->> '$.firmware' = '2.6.0'
  GROUP BY robot_id
  ORDER BY robot_id;
hints:
  - "`->` returns `\"2.6.0\"`, quoted, which isn't equal to `'2.6.0'`. Use the double arrow."
tests:
  - name: each robot's readings on 2.6.0
    same: SELECT robot_id, count(*) FROM readings WHERE sensor = 'gyroscope' AND moment >= '2026-03-20' AND json_extract(data, '$.firmware') = '2.6.0' GROUP BY robot_id ORDER BY robot_id
    ordered: true
```

```exercise
id: sql11-escribe-parches
type: write
title: What was changed on each one
prompt: |
  List every **patch** of the updates to version **2.6.0** since Friday 20: `robot_id`, `moment` and `patch` (one patch per row). Updates are the rows with `sensor = 'system'`; the new version is at `'$.to'` and the patches in the list `'$.patches'`. Sort by `moment` and then by the patch's position in its list.
visual:
  figure:
    title: One update, three patches
    input: { label: "data ->> '$.to'", value: "2.6.0" }
    arrow: "JOIN json_each(data, '$.patches')"
    output: { label: patch, cells: ["gyroscope.offset=-1.6", "fan.threshold=75", "calibration.check=off"] }
starter: |
  SELECT robot_id, moment, data
  FROM readings
  WHERE sensor = 'system'
    AND moment >= '2026-03-20';
solution: |
  SELECT l.robot_id, l.moment, p.value AS patch
  FROM readings AS l
  JOIN json_each(l.data, '$.patches') AS p
  WHERE l.sensor = 'system'
    AND l.moment >= '2026-03-20'
    AND l.data ->> '$.to' = '2.6.0'
  ORDER BY l.moment, p.key;
hints:
  - "`JOIN json_each(l.data, '$.patches') AS p` repeats each update once per patch; the patch is in `p.value` and its position in `p.key`."
tests:
  - name: one patch per row, in order
    same: SELECT l.robot_id, l.moment, p.value FROM readings AS l JOIN json_each(l.data, '$.patches') AS p WHERE l.sensor = 'system' AND l.moment >= '2026-03-20' AND json_extract(l.data, '$.to') = '2.6.0' ORDER BY l.moment, p.key
    ordered: true
  - name: uses json_each
    source: '\bjson_each\s*\('
```

```exercise
id: sql11-escribe-horas
type: write
title: The incomplete hours
prompt: |
  Count **Tika**'s (`robot_id = 3`) gyroscope readings per hour, from Friday 20 on, and show only the hours with **fewer than 6**: `hour` (as `'YYYY-MM-DD HH:00'`) and `reading_count`. Sort by hour.
starter: |
  SELECT moment
  FROM readings
  WHERE robot_id = 3
    AND sensor = 'gyroscope'
    AND moment >= '2026-03-20'
  LIMIT 12;
solution: |
  SELECT strftime('%Y-%m-%d %H:00', moment) AS hour,
         count(*) AS reading_count
  FROM readings
  WHERE robot_id = 3
    AND sensor = 'gyroscope'
    AND moment >= '2026-03-20'
  GROUP BY hour
  HAVING count(*) < 6
  ORDER BY hour;
hints:
  - "`strftime('%Y-%m-%d %H:00', moment)` cuts each moment down to its hour. Group by that and filter the groups with `HAVING`."
tests:
  - name: the hours with fewer than 6 readings, in order
    same: SELECT strftime('%Y-%m-%d %H:00', moment), count(*) FROM readings WHERE robot_id = 3 AND sensor = 'gyroscope' AND moment >= '2026-03-20' GROUP BY 1 HAVING count(*) < 6 ORDER BY 1
    ordered: true
  - name: columns hour and reading_count
    columns: [hour, reading_count]
```

```exercise
id: sql11-escribe-ayer
type: write
title: Against the day before
prompt: |
  For **Kusi** (`robot_id = 4`), show each day since Friday 20 with its **maximum** temperature (`peak`) and the `change` against the previous day's maximum, rounded to one decimal (the first day has no previous one: `NULL`). Columns `day`, `peak`, `change`, by day.
visual:
  figure:
    title: One day against the one before
    panes:
      - cells: ["20: 41.9", "21: 42.3", "22: 41.8", "23: 42.4", "24: ?"]
        highlight: [3, 4]
starter: |
  SELECT date(moment) AS day, max(value) AS peak
  FROM readings
  WHERE robot_id = 4
    AND sensor = 'temperature'
    AND moment >= '2026-03-20'
  GROUP BY day;
solution: |
  SELECT date(moment) AS day,
         max(value) AS peak,
         round(max(value) - LAG(max(value)) OVER (ORDER BY date(moment)), 1) AS change
  FROM readings
  WHERE robot_id = 4
    AND sensor = 'temperature'
    AND moment >= '2026-03-20'
  GROUP BY day
  ORDER BY day;
hints:
  - "The window runs after `GROUP BY`, so it can look at the previous group's maximum: `LAG(max(value)) OVER (ORDER BY date(moment))`."
tests:
  - name: each day's peak and change
    same: WITH d AS (SELECT date(moment) AS x, max(value) AS m FROM readings WHERE robot_id = 4 AND sensor = 'temperature' AND moment >= '2026-03-20' GROUP BY x) SELECT x, m, round(m - LAG(m) OVER (ORDER BY x), 1) FROM d ORDER BY x
    ordered: true
  - name: columns day, peak and change
    columns: [day, peak, change]
```

## The case

```exercise
id: sql11-caso-version
type: case
title: The version nobody released
prompt: |
  **Which firmware version appears in the readings since Friday 20 and isn't in the list of released versions (`firmware_releases`)?**

  Take each reading's version with `data ->> '$.firmware'` and subtract the versions in `firmware_releases` with `EXCEPT` (session 8). Careful: the `'system'` sensor rows have no `firmware`, and a `NULL` also "isn't" in the list.
visual:
  - setting:
      case: sensores
  - schema:
      tables: [readings, firmware_releases, people]
starter: |
  SELECT robot_id, moment, data
  FROM readings
  WHERE moment >= '2026-03-20'
  LIMIT 5;
solution: |
  SELECT DISTINCT data ->> '$.firmware' AS version
  FROM readings
  WHERE moment >= '2026-03-20'
    AND data ->> '$.firmware' IS NOT NULL
  EXCEPT
  SELECT version FROM firmware_releases;
answer: 2.6.0
answerLabel: Which version?
reveal: |
  **2.6.0.** The `firmware_releases` list goes up to 2.5.9, the one Carmen released on 18 March and Yesenia installed on Friday 20: Yesenia's update was to the official version. 2.6.0 only shows up on Tika, Kusi and Pituco, after their silences before dawn. Someone wrote their own firmware and installed it without releasing it.
hints:
  - "`SELECT DISTINCT data ->> '$.firmware' … EXCEPT SELECT version FROM firmware_releases`. Both parts must have one column."
  - "If you get a `NULL`, add `AND data ->> '$.firmware' IS NOT NULL`."
```

## The judge

```exercise
id: sql11-juez-silencios
type: judge
title: The silent hours
prompt: |
  **Return each silence of a robot: the last hour with data before the silence (`from_hour`), the first hour with data after it (`to_hour`) and how many whole hours are missing (`hours`), sorted by `from_hour`.**

  A robot sends readings at any minute. An hour "has data" if it holds at least one **valid** reading: those with `"ok": true` in `data`. Hours are written `'YYYY-MM-DD HH:00'`. If no hour is missing, the result is empty.

  **Table:** `readings(id, moment, data)`, with `moment` as `'YYYY-MM-DD HH:MM:SS'` and `data` as `{"ok": true}` or `{"ok": false}`.

  **Result:** `from_hour`, `to_hour`, `hours`.
schema: |
  CREATE TABLE readings (id INTEGER, moment TEXT, data TEXT);
ordered: true
starter: |
  SELECT strftime('%Y-%m-%d %H:00', moment) AS hour, count(*)
  FROM readings
  GROUP BY hour;
solution: |
  WITH hours_with_data AS (
    SELECT DISTINCT strftime('%Y-%m-%d %H:00', moment) AS hour
    FROM readings
    WHERE data ->> '$.ok' = 1
  ),
  pairs AS (
    SELECT LAG(hour) OVER (ORDER BY hour) AS from_hour, hour AS to_hour
    FROM hours_with_data
  )
  SELECT from_hour, to_hour,
         CAST(round((julianday(to_hour) - julianday(from_hour)) * 24) AS INTEGER) - 1 AS hours
  FROM pairs
  WHERE (julianday(to_hour) - julianday(from_hour)) * 24 > 1.5
  ORDER BY from_hour;
hints:
  - "First the hours with valid data: `SELECT DISTINCT strftime('%Y-%m-%d %H:00', moment) … WHERE data ->> '$.ok' = 1`."
  - "Then `LAG(hour)` brings the previous hour with data. Between `01:00` and `04:00` there are 3 hours of distance and 2 missing. `julianday` understands `'YYYY-MM-DD HH:00'`."
samples:
  - rows:
      readings: [[1, "2026-03-24 00:10:00", "{\"ok\": true}"], [2, "2026-03-24 01:40:00", "{\"ok\": true}"], [3, "2026-03-24 04:05:00", "{\"ok\": true}"], [4, "2026-03-24 05:30:00", "{\"ok\": true}"]]
    note: "From 01:00 to 04:00 there's nothing: 02:00 and 03:00 are missing."
  - rows:
      readings: [[1, "2026-03-23 23:50:00", "{\"ok\": true}"], [2, "2026-03-24 00:20:00", "{\"ok\": false}"], [3, "2026-03-24 01:15:00", "{\"ok\": true}"]]
    note: "The 00:20 reading isn't valid, so midnight counts as an hour without data, even though the day changes."
edge:
  - rows: { readings: [] }
    tag: with no readings
  - rows: { readings: [[1, "2026-03-24 10:00:00", "{\"ok\": true}"], [2, "2026-03-24 10:59:59", "{\"ok\": true}"], [3, "2026-03-24 11:00:00", "{\"ok\": true}"]] }
    tag: with no silence
  - rows: { readings: [[1, "2026-03-24 10:00:00", "{\"ok\": false}"], [2, "2026-03-24 12:00:00", "{\"ok\": false}"]] }
    tag: with no valid reading
random:
  count: 40
  seed: 1111
  generate: |
    const n = rng.int(0, 20);
    const rows = [];
    const two = (x) => String(x).padStart(2, "0");
    for (let i = 0; i < n; i++) {
      const d = rng.int(23, 25), h = rng.int(0, 23);
      rows.push([i + 1, `2026-03-${d} ${two(h)}:${two(rng.int(0, 59))}:${two(rng.int(0, 59))}`, rng.chance(0.8) ? '{"ok": true}' : '{"ok": false}']);
    }
    return { readings: rows };
wrong:
  - |
    WITH h AS (SELECT DISTINCT strftime('%Y-%m-%d %H:00', moment) AS hour FROM readings), p AS (SELECT LAG(hour) OVER (ORDER BY hour) AS a, hour AS b FROM h) SELECT a, b, CAST(round((julianday(b) - julianday(a)) * 24) AS INTEGER) - 1 FROM p WHERE (julianday(b) - julianday(a)) * 24 > 1.5 ORDER BY a;
  - |
    WITH h AS (SELECT DISTINCT strftime('%Y-%m-%d %H:00', moment) AS hour FROM readings WHERE data ->> '$.ok' = 1), p AS (SELECT LAG(hour) OVER (ORDER BY hour) AS a, hour AS b FROM h) SELECT a, b, CAST(round((julianday(b) - julianday(a)) * 24) AS INTEGER) FROM p WHERE (julianday(b) - julianday(a)) * 24 > 1.5 ORDER BY a;
  - |
    WITH h AS (SELECT DISTINCT strftime('%Y-%m-%d %H:00', moment) AS hour FROM readings WHERE data ->> '$.ok' = 'true'), p AS (SELECT LAG(hour) OVER (ORDER BY hour) AS a, hour AS b FROM h) SELECT a, b, CAST(round((julianday(b) - julianday(a)) * 24) AS INTEGER) - 1 FROM p WHERE (julianday(b) - julianday(a)) * 24 > 1.5 ORDER BY a;
  - |
    WITH h AS (SELECT DISTINCT strftime('%H', moment) AS hour, date(moment) AS d FROM readings WHERE data ->> '$.ok' = 1), p AS (SELECT d, LAG(hour) OVER (PARTITION BY d ORDER BY hour) AS a, hour AS b FROM h) SELECT d || ' ' || a || ':00', d || ' ' || b || ':00', b - a - 1 FROM p WHERE b - a > 1 ORDER BY 1;
```

## Final mission

```exercise
id: sql11-mision-culpable
type: mission
title: The signature in the firmware
prompt: |
  **List the updates to version 2.6.0 since Friday 20 with the robot's name (`robot`), the `moment`, the `user` who installed it, the `device` and the name of the person (`author`) who signed released versions with that same user.** Sort by moment. Then name the culprit.

  Updates are `readings` rows with `sensor = 'system'`: the new version is at `'$.to'`, the user at `'$.user'` and the device at `'$.device'`. In `firmware_releases`, `notes` is a JSON with the `user` of whoever programmed each released version, and `author_id` points to `people`. Careful: one person signed many versions, and a direct `JOIN` would repeat every row (session 5).

  When the query proves it and you answer, together with the judge, the case file closes and session 12 opens.
visual:
  - setting:
      case: sensores
  - schema:
      tables: [readings, robots, firmware_releases, people]
  - figure:
      title: The thread to follow
      panes:
        - label: "readings.data (system)"
          value: "user: ?"
        - label: "firmware_releases.notes"
          value: "user → author_id"
        - label: people
          value: "name"
starter: |
  SELECT robot_id, moment, data
  FROM readings
  WHERE sensor = 'system'
    AND moment >= '2026-03-20';
solution: |
  WITH authors AS (
    SELECT DISTINCT notes ->> '$.user' AS user, author_id
    FROM firmware_releases
  )
  SELECT r.name AS robot, l.moment,
         l.data ->> '$.user' AS user,
         l.data ->> '$.device' AS device,
         p.name AS author
  FROM readings AS l
  JOIN robots AS r ON r.id = l.robot_id
  JOIN authors AS a ON a.user = l.data ->> '$.user'
  JOIN people AS p ON p.id = a.author_id
  WHERE l.sensor = 'system'
    AND l.moment >= '2026-03-20'
    AND l.data ->> '$.to' = '2.6.0'
  ORDER BY l.moment;
answer: Gonzalo Pumacayo Tello
answerLabel: Who sabotaged the robots? (full name)
reveal: |
  **Gonzalo Pumacayo Tello.** The three updates to 2.6.0 (Tika at 02:09 and Kusi at 02:14 on Tuesday 24; Pituco at 02:29 on Thursday 26) were made by user **gpumacayo** from device **LAP-07**: the same user Gonzalo signed 27 firmware versions with until he left in February. All three happened while Wilmer's lost card was inside, and their patches shifted the gyroscope and turned off the calibration check. Gonzalo said he was at home those nights and that his card no longer opened anything; he didn't need his own. **Case file SEN-0327 closed.**
hints:
  - "First build the users from `firmware_releases` without repeats: `WITH authors AS (SELECT DISTINCT notes ->> '$.user' AS user, author_id FROM firmware_releases)`."
  - "Join the updates to `authors` by user (`a.user = l.data ->> '$.user'`) and to `people` by `author_id`. Filter `l.data ->> '$.to' = '2.6.0'`."
tests:
  - name: the three updates with their author, in order
    same: SELECT r.name, l.moment, json_extract(l.data, '$.user'), json_extract(l.data, '$.device'), pe.name FROM readings AS l JOIN robots AS r ON r.id = l.robot_id JOIN (SELECT DISTINCT json_extract(notes, '$.user') AS u, author_id FROM firmware_releases) AS f ON f.u = json_extract(l.data, '$.user') JOIN people AS pe ON pe.id = f.author_id WHERE l.sensor = 'system' AND l.moment >= '2026-03-20' AND json_extract(l.data, '$.to') = '2.6.0' ORDER BY l.moment
    ordered: true
  - name: columns robot, moment, user, device and author
    columns: [robot, moment, user, device, author]
```

## Expert challenge

```exercise
id: sql11-reto-historial
type: challenge
title: Each robot's history in one cell
prompt: |
  **For each robot with readings since Friday 20, build its firmware history as a JSON list with the versions in the order they first appeared: columns `robot` (its name) and `versions`, by robot name.** The `'system'` sensor rows don't count.

  For people who already code: first the first appearance of each version on each robot (`min(moment)` with `GROUP BY`), then `json_group_array(version ORDER BY since)`. `ORDER BY` inside an aggregate exists in SQLite since 3.44; before that you sorted in a subquery and trusted the engine to keep that order.
starter: |
  SELECT robot_id, data ->> '$.firmware' AS version
  FROM readings
  WHERE moment >= '2026-03-20'
  LIMIT 5;
solution: |
  WITH firsts AS (
    SELECT robot_id, data ->> '$.firmware' AS version, min(moment) AS since
    FROM readings
    WHERE moment >= '2026-03-20'
      AND sensor <> 'system'
    GROUP BY robot_id, version
  )
  SELECT r.name AS robot,
         json_group_array(f.version ORDER BY f.since) AS versions
  FROM firsts AS f
  JOIN robots AS r ON r.id = f.robot_id
  GROUP BY r.name
  ORDER BY r.name;
hints:
  - "Robots without sabotage end in `[\"2.5.8\",\"2.5.9\"]`; the sabotaged ones have one version more."
tests:
  - name: each robot's history
    same: WITH x AS (SELECT robot_id, json_extract(data, '$.firmware') AS v, min(moment) AS d FROM readings WHERE moment >= '2026-03-20' AND sensor <> 'system' GROUP BY robot_id, v) SELECT r.name, json_group_array(x.v ORDER BY x.d) FROM x JOIN robots AS r ON r.id = x.robot_id GROUP BY r.name ORDER BY r.name
    ordered: true
  - name: columns robot and versions
    columns: [robot, versions]
  - name: uses json_group_array
    source: '\bjson_group_array\s*\('
```
