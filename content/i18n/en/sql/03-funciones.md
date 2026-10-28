# Session 3 — Functions: text, dates and CASE

```session
case: surquillo
```

## The job

Monday 16 March. Three suspects are left: **Renzo Huamaní**, **Lucía Paredes** and **Julio Ccahuana**, and all three gave statements. Renzo says he left "at about ten past eleven"; Lucía, "a bit after eleven"; Julio, "nearly half past eleven". Marleny saw the white car at about **22:45**.

Opposite Gate 3 there's a municipal camera, **CAM-SUR-03**, that reads the plates of passing cars. The problem: its data is dirty. The camera writes plates the way it reads them (`b7r415`, `D9K 731`, `C3M-208`) and stores the time **in UTC**, Greenwich time, five hours ahead of Lima. To cross that data with Gate 3's, you'll have to **transform** it inside the query: that's what functions do.

```setting
case: surquillo
title: The camera opposite Gate 3
caption: "CAM-SUR-03 looks onto Jr. Narciso de la Colina, where cars from Gate 3 drive out."
```

```dossier
title: What the three say
cards:
  - name: Renzo Huamaní Cárdenas
    traits: { style: short, shirt: "#5b6b7a", tool: true }
    role: Electronic spare-parts supplier
    rows: [["Car", "white Toyota Yaris, B7R-415"]]
    quote: "I left at about ten past eleven and went straight home."
  - name: Lucía Paredes Soto
    traits: { style: long, shirt: "#e07a5f" }
    role: Juice bar, stall 12
    rows: [["Car", "white Kia Rio, C3M-208"]]
    quote: "I stayed doing the stocktake and left a bit after eleven."
  - name: Julio Ccahuana Ríos
    traits: { style: curly, shirt: "#c49a3f", beard: true }
    role: Fruit supplier
    rows: [["Car", "Nissan Versa, D9K-731, colour not recorded"]]
    quote: "I left at nearly half past eleven, for Ate."
```

## The minimum

A **function** takes values and returns another, row by row: you can use it in `SELECT`, in `WHERE` and in `ORDER BY`. Today, three families.

**Text.** `upper` and `lower` change case (only letters without accents), `trim` removes spaces at both ends, `replace(t, 'a', 'b')` swaps every `a` for `b`, `substr(t, start, length)` cuts a piece (counting from 1), `length` counts characters and `instr(t, 'x')` says where something appears. `||` glues text: `'B7R' || '-' || '415'`.

```schema
tables: [sightings, cameras]
caption: "`sightings` keeps every plate reading; `camera_id` says which camera it was (number 3 is CAM-SUR-03, opposite Gate 3)."
```

```sql run
SELECT plate,
       upper(replace(replace(plate, ' ', ''), '-', '')) AS clean
FROM sightings
WHERE camera_id = 3
  AND plate LIKE '%7%'
ORDER BY id
LIMIT 6;
```

Functions nest like in maths: first remove the spaces, then the dashes, and finally go uppercase. Now `b7r415`, `B7R-415` and `b7r 415` all give the same thing: `B7R415`.

**Dates and times.** SQLite has no date type: it stores `'YYYY-MM-DD HH:MM:SS'` text, which sorts correctly, and computes with `date`, `time`, `datetime` and `strftime`. They all take **modifiers** after the moment: `'-5 hours'`, `'+1 day'`, `'start of day'`. To go from UTC to Lima time, subtract five hours:

```figure
title: The same reading, on two clocks
input: { label: "moment_utc (what the camera stores)", value: "2026-03-14 03:48:31" }
arrow: "datetime(moment_utc, '-5 hours')"
output: { label: "Lima time", value: "2026-03-13 22:48:31" }
steps:
  - "Lima is UTC−5 all year round (Peru doesn't change its clocks in summer)."
  - "Mind the date: 03:48 on Saturday in UTC is 22:48 on **Friday** in Lima."
```

`strftime('%H', m)` gives only the hour, `'%w'` the day of the week (0 is Sunday) and `julianday(a) - julianday(b)` the difference in days between two moments (multiply by 24 × 60 to get minutes).

**Deciding and filling in.** `CASE WHEN condition THEN value … ELSE other END` picks a value per row. `COALESCE(a, b, …)` returns the first one that isn't `NULL`: `COALESCE(phone, 'no number')`. `CAST(x AS INTEGER)` converts.

```sql run
SELECT moment,
       CASE
         WHEN time(moment) < '12:00' THEN 'morning'
         WHEN time(moment) < '19:00' THEN 'afternoon'
         ELSE 'night'
       END AS shift
FROM market_entries
WHERE person_id = 233
ORDER BY moment
LIMIT 4;
```

> **Common trap:** a number stored as text is compared **character by character**: `'10' < '9'` is true, because `'1'` comes before `'9'`. `'HH:MM'` times work as text only because they always have two digits (`'09:05'`, not `'9:5'`). If a column mixes numbers and text, convert it with `CAST` before comparing. And if you apply a function to the column in `WHERE`, like `datetime(moment_utc, '-5 hours') > …`, SQLite has to compute it for **every row**: in session 13 you'll see why that stops it from using an index.

<!-- legacy: dates -->

<!-- legacy: coalesce -->

<!-- legacy: case-when -->

<!-- mdn: dates coalesce case-when -->

## Practice

```exercise
id: sql3-predice-texto
type: predict
title: Cleaning text
prompt: |
  What does it return?
code: |
  SELECT upper('b7r415'), replace('D9K 731', ' ', '-'), length('  hola ');
options:
  - "B7R415 | D9K-731 | 7"
  - "B7R415 | D9K-731 | 4"
  - "b7r415 | D9K-731 | 7"
  - "B7R-415 | D9K731 | 4"
answer: "B7R415 | D9K-731 | 7"
explain: |
  `length` counts **every** character, spaces included: two at the start, four letters and one at the end make 7. To leave them out, `length(trim('  hola '))` gives 4.
```

```exercise
id: sql3-predice-fecha
type: predict
title: Five hours back
prompt: |
  The camera stored `2026-03-14 03:48:31` in UTC. What does it return?
code: |
  SELECT datetime('2026-03-14 03:48:31', '-5 hours'), date('2026-03-14 03:48:31', '-5 hours');
options:
  - "2026-03-13 22:48:31 | 2026-03-13"
  - "2026-03-14 22:48:31 | 2026-03-14"
  - "2026-03-13 22:48:31 | 2026-03-14"
  - "2026-03-14 08:48:31 | 2026-03-14"
answer: "2026-03-13 22:48:31 | 2026-03-13"
explain: |
  Taking five hours from 03:48 crosses midnight, and SQLite adjusts the day by itself. `date` does the same sum but returns only the date.
```

```exercise
id: sql3-predice-texto-numero
type: predict
title: Ten against nine
prompt: |
  What does it return?
code: |
  SELECT '10' < '9', 10 < 9, CAST('10' AS INTEGER) < 9;
options:
  - "1 | 0 | 0"
  - "0 | 0 | 0"
  - "1 | 0 | 1"
  - "0 | 1 | 0"
answer: "1 | 0 | 0"
explain: |
  As text, `'10'` comes before `'9'` because the first character is compared: `'1'` < `'9'`. As numbers, 10 isn't less than 9. `CAST` turns the text into a number and the comparison makes sense again.
```

```exercise
id: sql3-completa-placa
type: complete
title: Comparable plates
prompt: |
  List the `id`, the `plate` as the camera read it and the **clean** plate (no spaces or dashes, uppercase) of camera 3's first 8 readings, by `id`. Replace the `___`.
starter: |
  SELECT id, plate,
         ___(replace(replace(plate, ' ', ''), ___, '')) AS clean
  FROM sightings
  WHERE camera_id = 3
  ORDER BY id
  LIMIT 8;
solution: |
  SELECT id, plate,
         upper(replace(replace(plate, ' ', ''), '-', '')) AS clean
  FROM sightings
  WHERE camera_id = 3
  ORDER BY id
  LIMIT 8;
hints:
  - The second `replace` removes the dashes; the outer function goes uppercase.
tests:
  - name: id, plate and clean plate of the first 8
    same: SELECT id, plate, upper(replace(replace(plate, ' ', ''), '-', '')) FROM sightings WHERE camera_id = 3 ORDER BY id LIMIT 8
    ordered: true
```

```exercise
id: sql3-arregla-zona
type: fix
title: The shifted window
prompt: |
  This query looks for what camera 3 read between **22:41 and 23:30 Lima time** on Friday, but it compares Lima times with `moment_utc`, which is in UTC. So it brings another window. Fix it so the Lima time is what gets compared and shown (as `lima_time`), in order.
visual:
  figure:
    title: Two clocks
    panes:
      - label: Lima (what you want)
        value: "22:41 → 23:30"
      - label: UTC (what the camera stores)
        value: "03:41 → 04:30 the next day"
starter: |
  SELECT plate, moment_utc AS lima_time
  FROM sightings
  WHERE camera_id = 3
    AND moment_utc BETWEEN '2026-03-13 22:41' AND '2026-03-13 23:30:59'
  ORDER BY lima_time;
solution: |
  SELECT plate, datetime(moment_utc, '-5 hours') AS lima_time
  FROM sightings
  WHERE camera_id = 3
    AND datetime(moment_utc, '-5 hours') BETWEEN '2026-03-13 22:41' AND '2026-03-13 23:30:59'
  ORDER BY lima_time;
hints:
  - "Convert in both places: `datetime(moment_utc, '-5 hours')`."
tests:
  - name: the window's readings, in Lima time and in order
    same: SELECT plate, datetime(moment_utc, '-5 hours') FROM sightings WHERE camera_id = 3 AND datetime(moment_utc, '-5 hours') BETWEEN '2026-03-13 22:41' AND '2026-03-13 23:30:59' ORDER BY 2
    ordered: true
```

```exercise
id: sql3-escribe-turnos
type: write
title: Gate 3's shifts
prompt: |
  For each card swipe at **Gate 3 on Friday the 13th**, show the `id`, the `moment` and the **shift**: `'morning'` before 12:00, `'afternoon'` before 19:00 and `'night'` from 19:00. Call that column `shift` and sort by `moment`, then `id`.
starter: |
  SELECT id, moment
  FROM market_entries
  WHERE gate = 3
  ORDER BY moment, id;
solution: |
  SELECT id, moment,
         CASE
           WHEN time(moment) < '12:00' THEN 'morning'
           WHEN time(moment) < '19:00' THEN 'afternoon'
           ELSE 'night'
         END AS shift
  FROM market_entries
  WHERE gate = 3 AND date(moment) = '2026-03-13'
  ORDER BY moment, id;
hints:
  - "`date(moment) = '2026-03-13'` keeps Friday; `time(moment)` gives only the time."
  - "`CASE` checks the `WHEN`s in order and takes the first that holds, so the second needn't repeat `>= '12:00'`."
tests:
  - name: id, moment and shift of each swipe on Friday
    same: SELECT id, moment, CASE WHEN time(moment) < '12:00' THEN 'morning' WHEN time(moment) < '19:00' THEN 'afternoon' ELSE 'night' END FROM market_entries WHERE gate = 3 AND moment >= '2026-03-13' AND moment < '2026-03-14' ORDER BY moment, id
    ordered: true
  - name: the column is called shift
    columns: [id, moment, shift]
  - name: uses CASE
    source: '\bCASE\b'
```

```exercise
id: sql3-escribe-coalesce
type: write
title: The guards' list
prompt: |
  Build the list of **Surquillo's security guards** with their **clean name** (no stray spaces at the ends) and their contact: the phone or, if they have none, the text `'no number'`. Call the columns `name` and `contact` and sort by name.
starter: |
  SELECT name, phone
  FROM people
  WHERE occupation = 'security guard';
solution: |
  SELECT trim(name) AS name,
         COALESCE(phone, 'no number') AS contact
  FROM people
  WHERE occupation = 'security guard' AND district = 'Surquillo'
  ORDER BY trim(name);
hints:
  - One name has a space at the end. `trim` removes it.
  - "`COALESCE(phone, 'no number')`: the phone, or the text when it's `NULL`."
tests:
  - name: clean names and contacts, in order
    same: SELECT trim(name), COALESCE(phone, 'no number') FROM people WHERE occupation = 'security guard' AND district = 'Surquillo' ORDER BY trim(name)
    ordered: true
  - name: the columns are called name and contact
    columns: [name, contact]
```

## The case

```exercise
id: sql3-caso-camara
type: case
title: The first car after 22:41
prompt: |
  **Whose is the first car CAM-SUR-03 read after 22:41 (Lima time) on Friday the 13th?** Type the owner's full name.

  Camera 3 is CAM-SUR-03. You need three steps: the window's first reading (with the time turned into Lima time), the owner of that plate in `vehicles` (with the plate cleaned on both sides, since the camera writes it its own way) and that person's name in `people`. Today you copy the result of one query into the next by hand; in session 5 a `JOIN` does it for you.
visual:
  - setting:
      case: surquillo
  - schema:
      tables: [sightings, cameras, vehicles, people]
starter: |
  -- Step 1: what camera 3 read that night (in UTC!)
  SELECT plate, moment_utc
  FROM sightings
  WHERE camera_id = 3
  ORDER BY moment_utc
  LIMIT 5;
solution: |
  SELECT plate, datetime(moment_utc, '-5 hours') AS lima_time
  FROM sightings
  WHERE camera_id = 3
    AND datetime(moment_utc, '-5 hours') >= '2026-03-13 22:41'
  ORDER BY lima_time
  LIMIT 1;

  SELECT person_id, plate, make, model
  FROM vehicles
  WHERE replace(plate, '-', '') = upper('b7r415');

  SELECT name FROM people WHERE id = 731;
answer: Renzo Huamaní Cárdenas
answerLabel: Whose car is it? (full name)
reveal: |
  **Renzo Huamaní Cárdenas.** The camera read `b7r415` at 03:48:31 UTC, that is, at **22:48** on Friday in Lima: two minutes after Renzo swiped his card at Gate 3. And Renzo said he left at ten past eleven.
hints:
  - "The window's first reading: `WHERE camera_id = 3 AND datetime(moment_utc, '-5 hours') >= '2026-03-13 22:41' ORDER BY moment_utc LIMIT 1`."
  - "In `vehicles` the plate has a dash and capitals: compare `replace(plate, '-', '')` with `upper('b7r415')`."
```

## The judge

```exercise
id: sql3-juez-placas
type: judge
title: Formatted plates
prompt: |
  **Return, for each reading, its `id`, the plate in the official `AAA-999` format and the Lima time; sorted by Lima time, then by `id`.**

  The municipality wants a clean report from one camera. The plate comes as the camera read it: it may be lowercase, missing the dash, with a space instead of the dash or with spaces at the ends. A plate always has three characters, then three digits. The time is UTC; Lima is UTC−5.

  **Table:** `readings(id, plate, moment_utc)`, with `moment_utc` as `'YYYY-MM-DD HH:MM:SS'`.

  **Result:** `id`, the formatted plate and the Lima time (`'YYYY-MM-DD HH:MM:SS'`), in that order.
schema: |
  CREATE TABLE readings (id INTEGER, plate TEXT, moment_utc TEXT);
ordered: true
starter: |
  SELECT id, plate, moment_utc
  FROM readings
  ORDER BY moment_utc;
solution: |
  SELECT id,
         substr(upper(replace(replace(trim(plate), ' ', ''), '-', '')), 1, 3) || '-' ||
         substr(upper(replace(replace(trim(plate), ' ', ''), '-', '')), 4, 3),
         datetime(moment_utc, '-5 hours') AS lima_time
  FROM readings
  ORDER BY lima_time, id;
hints:
  - "Clean first: `upper(replace(replace(trim(plate), ' ', ''), '-', ''))` gives six characters in a row. Then cut it with `substr(…, 1, 3)` and `substr(…, 4, 3)` and glue it with `||`."
  - Sorting by Lima or UTC time gives the same order; but the `id` breaks ties.
samples:
  - rows:
      readings: [[1, "b7r415", "2026-03-14 03:48:31"], [2, "C3M-208", "2026-03-14 04:14:02"], [3, "D9K 731", "2026-03-14 04:23:47"]]
    note: "`b7r415` becomes `B7R-415`; 03:48 UTC on Saturday is 22:48 on Friday."
  - rows:
      readings: [[5, " f2t664 ", "2026-03-01 00:10:00"], [4, "A4P-902", "2026-03-01 00:10:00"]]
    note: "Same time: id 4 comes first. And UTC midnight falls on the previous day in Lima."
edge:
  - rows: { readings: [] }
    tag: with no readings
  - rows: { readings: [[9, "x1y-234", "2026-01-01 04:59:59"], [8, "X1Y234", "2026-01-01 05:00:00"]] }
    tag: around New Year's midnight
random:
  count: 40
  seed: 303
  generate: |
    const L = "ABCDEFGHJKLMNPRSTUVWXYZ";
    const n = rng.int(0, 12);
    const rows = [];
    for (let i = 0; i < n; i++) {
      const p = `${rng.pick(L.split(""))}${rng.int(0, 9)}${rng.pick(L.split(""))}`;
      const d = String(rng.int(100, 999));
      const shape = rng.int(0, 4);
      const plate = shape === 0 ? `${p}-${d}` : shape === 1 ? `${p}${d}`.toLowerCase() : shape === 2 ? `${p} ${d}` : shape === 3 ? ` ${p.toLowerCase()}-${d} ` : `${p}${d}`;
      const two = (x) => String(x).padStart(2, "0");
      rows.push([i + 1, plate, `2026-03-${two(rng.int(1, 4))} ${two(rng.int(0, 6))}:${two(rng.pick([0, 15, 30, 45]))}:00`]);
    }
    return { readings: rows };
wrong:
  - |
    SELECT id, upper(replace(plate, ' ', '-')), datetime(moment_utc, '-5 hours') AS h FROM readings ORDER BY h, id;
  - |
    SELECT id, substr(replace(replace(plate, ' ', ''), '-', ''), 1, 3) || '-' || substr(replace(replace(plate, ' ', ''), '-', ''), 4, 3), datetime(moment_utc, '-5 hours') AS h FROM readings ORDER BY h, id;
  - |
    SELECT id, substr(upper(replace(replace(trim(plate), ' ', ''), '-', '')), 1, 3) || '-' || substr(upper(replace(replace(trim(plate), ' ', ''), '-', '')), 4, 3), datetime(moment_utc, '+5 hours') AS h FROM readings ORDER BY h, id;
  - |
    SELECT id, substr(upper(replace(replace(trim(plate), ' ', ''), '-', '')), 1, 3) || '-' || substr(upper(replace(replace(trim(plate), ' ', ''), '-', '')), 4, 3), datetime(moment_utc, '-5 hours') AS h FROM readings ORDER BY h;
```

## Final mission

```exercise
id: sql3-mision-camara
type: mission
title: What the camera saw
prompt: |
  **List CAM-SUR-03's readings between 22:41 and 23:30:59 on Friday the 13th (Lima time) that match the three suspects' cars: B7R-415, C3M-208 and D9K-731.** Show the clean plate with a dash (`AAA-999`, as in `vehicles`) as `plate` and the Lima time as `lima_time`, in order. Then say which plate passed first.

  Compare with what Marleny saw (a white car at about 22:45) and with what each one said.

  Once the query proves it and you answer, together with the judge, session 4 opens.
visual:
  - setting:
      case: surquillo
  - figure:
      title: The three cars you're after
      panes:
        - cards:
            - title: B7R-415
              rows: [["Owner", "Renzo"], ["Colour", "white"]]
            - title: C3M-208
              rows: [["Owner", "Lucía"], ["Colour", "white"]]
            - title: D9K-731
              rows: [["Owner", "Julio"], ["Colour", "NULL"]]
  - figure:
      title: "What each one said and what the data says"
      lanes:
        from: "22:30"
        to: "23:45"
        tick: 10
        bands: [{"from": "22:41", "to": "23:30", "label": "the case's window"}]
        rows:
          - {"label": "Marleny", "sub": "guard", "events": [{"at": "22:45", "label": "sees a white car"}]}
          - label: "Renzo"
            sub: "B7R-415"
            events:
              - {"at": "22:46", "label": "card", "side": "left"}
              - {"at": "22:48", "label": "camera", "kind": "bad", "by": "sql3-mision-camara"}
              - {"at": "23:10", "label": "says: I left", "kind": "said"}
          - label: "Lucía"
            sub: "C3M-208"
            events:
              - {"at": "23:05", "label": "says: past eleven", "kind": "said", "side": "left"}
              - {"at": "23:14", "label": "camera", "kind": "ok", "by": "sql3-mision-camara"}
          - label: "Julio"
            sub: "D9K-731"
            events:
              - {"at": "23:23", "label": "camera", "kind": "ok", "by": "sql3-mision-camara", "side": "left"}
              - {"at": "23:30", "label": "says: ~23:30", "kind": "said", "side": "right"}
starter: |
  SELECT plate, moment_utc
  FROM sightings
  WHERE camera_id = 3
    AND plate IN ('B7R-415', 'C3M-208', 'D9K-731');
solution: |
  SELECT substr(upper(replace(replace(plate, ' ', ''), '-', '')), 1, 3) || '-' ||
         substr(upper(replace(replace(plate, ' ', ''), '-', '')), 4, 3) AS plate,
         datetime(moment_utc, '-5 hours') AS lima_time
  FROM sightings
  WHERE camera_id = 3
    AND upper(replace(replace(plate, ' ', ''), '-', '')) IN ('B7R415', 'C3M208', 'D9K731')
    AND datetime(moment_utc, '-5 hours') BETWEEN '2026-03-13 22:41' AND '2026-03-13 23:30:59'
  ORDER BY lima_time;
answer: B7R-415
answerLabel: Which plate passed first?
reveal: |
  **B7R-415, Renzo's car, at 22:48.** Lucía passed at 23:14 and Julio at 23:23: well after what Marleny saw, and it matches what they said. Renzo said he left at ten past eleven, but his card read 22:46 and the camera saw him two minutes later. **Renzo lied.** What's left is to find out why: that's session 4.
hints:
  - "The query above finds nothing: `plate IN ('B7R-415', …)` doesn't match `b7r415`. Clean the plate before comparing, and compare with clean plates: `'B7R415'`, …"
  - "To show it with a dash: `substr(clean, 1, 3) || '-' || substr(clean, 4, 3)`."
tests:
  - name: the three readings, plate with a dash and Lima time, in order
    same: SELECT substr(upper(replace(replace(plate, ' ', ''), '-', '')), 1, 3) || '-' || substr(upper(replace(replace(plate, ' ', ''), '-', '')), 4, 3), datetime(moment_utc, '-5 hours') AS h FROM sightings WHERE camera_id = 3 AND upper(replace(replace(plate, ' ', ''), '-', '')) IN ('B7R415', 'C3M208', 'D9K731') AND h BETWEEN '2026-03-13 22:41' AND '2026-03-13 23:30:59' ORDER BY h
    ordered: true
  - name: the columns are called plate and lima_time
    columns: [plate, lima_time]
```

## Expert challenge

```exercise
id: sql3-reto-dias
type: challenge
title: The white car's days
prompt: |
  **List every time a camera read Renzo's plate (B7R-415, in any format) in March: the `camera_id`, the Lima time as `lima_time`, the name of the weekday in English as `weekday` and the minutes since 22:41:07 on Friday the 13th (rounded to a whole number) as `minutes`.** Sort by time.

  For those who already code: `strftime('%w', …)` gives the weekday as text from `'0'` (Sunday) to `'6'` (Saturday), and `julianday` lets you subtract moments. Minutes may be negative.
starter: |
  SELECT camera_id, moment_utc
  FROM sightings
  WHERE plate = 'B7R-415';
solution: |
  SELECT camera_id,
         datetime(moment_utc, '-5 hours') AS lima_time,
         CASE strftime('%w', moment_utc, '-5 hours')
           WHEN '0' THEN 'Sunday' WHEN '1' THEN 'Monday' WHEN '2' THEN 'Tuesday'
           WHEN '3' THEN 'Wednesday' WHEN '4' THEN 'Thursday' WHEN '5' THEN 'Friday'
           ELSE 'Saturday'
         END AS weekday,
         CAST(round((julianday(moment_utc, '-5 hours') - julianday('2026-03-13 22:41:07')) * 24 * 60) AS INTEGER) AS minutes
  FROM sightings
  WHERE upper(replace(replace(plate, ' ', ''), '-', '')) = 'B7R415'
  ORDER BY lima_time;
hints:
  - "`CASE strftime('%w', moment_utc, '-5 hours') WHEN '0' THEN 'Sunday' …` is the short form of `CASE`, which compares one value with each `WHEN`."
  - "`round` returns a REAL (`7.0`); `CAST(… AS INTEGER)` makes it `7`."
tests:
  - name: B7R-415's readings with weekday and minutes
    same: SELECT camera_id, datetime(moment_utc, '-5 hours'), CASE strftime('%w', moment_utc, '-5 hours') WHEN '0' THEN 'Sunday' WHEN '1' THEN 'Monday' WHEN '2' THEN 'Tuesday' WHEN '3' THEN 'Wednesday' WHEN '4' THEN 'Thursday' WHEN '5' THEN 'Friday' ELSE 'Saturday' END, CAST(round((julianday(moment_utc, '-5 hours') - julianday('2026-03-13 22:41:07')) * 24 * 60) AS INTEGER) FROM sightings WHERE upper(replace(replace(plate, ' ', ''), '-', '')) = 'B7R415' ORDER BY 2
    ordered: true
  - name: columns camera_id, lima_time, weekday and minutes
    columns: [camera_id, lima_time, weekday, minutes]
```
