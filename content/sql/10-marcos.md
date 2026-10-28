# Sesión 10 — Marcos, acumulados, LAG y LEAD

```session
case: sensores
```

## El encargo

Sábado 28 de marzo. La tarjeta que entró de madrugada las dos veces del sabotaje, la **T-0412**, está a nombre de **Wilmer Zevallos**, el vigilante. Pero Wilmer tiene una historia: el lunes 23 denunció esa tarjeta como **perdida**, y desde esa noche hace sus rondas con una nueva, la **T-0533**.

Para saber si miente hay que medir **entre filas**: cuánto duró cada visita (de una `entrada` a la `salida` siguiente de la misma tarjeta) y si los robots dejaron de reportar mientras alguien estaba adentro (cuánto tiempo pasó entre una lectura y **la anterior**). Una fila sola no sabe nada de su vecina; una ventana con **marco**, sí.

```escenario
case: sensores
title: La sala, dos noches después
caption: "La puerta registra cada pasada de tarjeta y los racks, cada lectura. Entre fila y fila está lo que falta."
```

```expediente
title: Lo que dice Wilmer
cards:
  - name: Wilmer Zevallos Benavides
    traits: { style: cap, capColor: "#33507a", shirt: "#33507a" }
    role: Vigilante de la galería
    rows: [["Tarjeta vieja", "T-0412, denunciada perdida el lunes 23 a las 19:20"], ["Tarjeta nueva", "T-0533, desde el martes 24"]]
    quote: "Hago dos rondas: a medianoche y a las cuatro. A las dos de la mañana yo estoy en la caseta de la entrada."
```

```figura
title: "Las tarjetas de la sala"
table:
  head: ["tarjeta", "a nombre de", "estado"]
  rows:
    - ["T-0101", "Carmen Ríos", "en uso"]
    - ["T-0215", "Yesenia Choque", "en uso"]
    - ["T-0388", "Kiara Montes", "en uso"]
    - ["T-0412", "Wilmer Zevallos", "denunciada perdida el lunes 23"]
    - ["T-0533", "Wilmer Zevallos", "nueva, desde el martes 24"]
```

## Lo mínimo

En la sesión 9 la ventana era toda la partición. Pero una función de ventana también puede mirar solo **algunas** filas alrededor de la actual: su **marco** (*frame*). El marco se mueve con cada fila, como una lupa que recorre la tabla.

```sql
sum(valor) OVER (
  PARTITION BY robot_id
  ORDER BY momento
  ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
)
```

- **`ROWS BETWEEN a AND b`** cuenta filas: `2 PRECEDING` (dos atrás), `CURRENT ROW`, `1 FOLLOWING` (una adelante), `UNBOUNDED PRECEDING` (desde el inicio de la partición) y `UNBOUNDED FOLLOWING` (hasta el final).
- **Acumulado** (*running total*): `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`. El marco crece: cada fila suma todo lo anterior.
- **Media móvil**: `avg(...)` con `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW`. El marco tiene tres filas y avanza: suaviza el ruido sin esconder un cambio de verdad.

Dale a ▶ y mira cómo se mueve el marco de una media móvil sobre la temperatura de Kusi la mañana del martes 24:

```ventana
title: avg(valor) OVER (ORDER BY momento ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)
query: |
  SELECT momento, valor,
         avg(valor) OVER (ORDER BY momento
                          ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS media
  FROM lecturas
  WHERE robot_id = 4 AND sensor = 'temperatura';
table:
  cols: [momento, valor]
  rows:
    - ["10:34", 48.6]
    - ["10:44", 47.6]
    - ["10:54", 49.6]
    - ["11:04", 69.8]
    - ["11:14", 70.3]
    - ["11:24", 68.2]
    - ["11:34", 65.6]
order: momento
fn: avg
col: valor
frame: [-2, 0]
as: media
caption: "Las filas resaltadas son el marco: la actual y las dos de atrás. Al principio el marco tiene menos filas, porque no hay de dónde sacar más. A las 11:04 Kusi salta de 49.6 a 69.8 y la media lo acompaña en dos pasos."
```

```ventana
title: "sum(valor) OVER (ORDER BY momento): el acumulado"
query: |
  SELECT momento, valor,
         sum(valor) OVER (ORDER BY momento) AS acumulado
  FROM fuera_de_rango;
table:
  cols: [momento, valor]
  rows:
    - ["02:58", 0]
    - ["03:08", 1]
    - ["03:18", 1]
    - ["03:28", 1]
    - ["03:38", 1]
order: momento
fn: sum
col: valor
as: acumulado
caption: "Sin `ROWS BETWEEN`, una ventana con `ORDER BY` va desde el inicio hasta la fila actual: el marco crece y el total se va sumando. Aquí `valor` es 1 si la lectura de Pituco está fuera de rango."
```

### El marco por defecto

Si no escribes el marco, SQL elige uno, y **depende de si hay `ORDER BY`**:

| la ventana tiene | el marco por defecto es | resultado |
|---|---|---|
| `OVER (PARTITION BY r)` | toda la partición | el total del grupo en cada fila |
| `OVER (PARTITION BY r ORDER BY m)` | `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` | un acumulado |

**`RANGE`** no cuenta filas: cuenta **valores** del `ORDER BY`. Con `RANGE`, las filas que empatan en el `ORDER BY` (las *pares*) entran juntas al marco, y `RANGE BETWEEN 3600 PRECEDING AND CURRENT ROW` sobre un número de segundos significa "la última hora", tenga las filas que tenga. Con **`ROWS`**, cada fila es una fila.

### LAG y LEAD: la fila de atrás y la de adelante

**`LAG(col)`** trae el valor de `col` de la fila **anterior** en el orden de la ventana; **`LEAD(col)`**, el de la **siguiente**. En la primera (o última) fila no hay vecina y devuelven `NULL`. Aceptan cuántas filas saltar y un valor por defecto: `LAG(valor, 1, 0)`. Restar `valor - LAG(valor)` da el **salto** entre dos lecturas: así se ve el momento exacto en que algo cambió.

```ventana
title: LAG(valor) OVER (ORDER BY momento)
query: |
  SELECT momento, valor,
         LAG(valor) OVER (ORDER BY momento) AS anterior
  FROM lecturas
  WHERE robot_id = 3 AND sensor = 'giroscopio';
table:
  cols: [momento, valor]
  rows:
    - ["02:32", -0.01]
    - ["02:42", -0.05]
    - ["02:52", -0.02]
    - ["03:02", 1.81]
    - ["03:12", 1.78]
order: momento
fn: lag
col: valor
as: anterior
caption: "Cada fila mira una hacia atrás. A las 03:02, el giroscopio de Tika vale 1.81 y el anterior, −0.02: un salto de 1.83 justo después de la calibración de las 03:00."
```

```sql run
SELECT momento, valor,
       round(valor - LAG(valor) OVER (ORDER BY momento), 2) AS salto
FROM lecturas
WHERE robot_id = 3
  AND sensor = 'giroscopio'
  AND momento BETWEEN '2026-03-24 02:30' AND '2026-03-24 03:30'
ORDER BY momento;
```

### Huecos e islas

Con `LAG` también se ven los **huecos**: si las lecturas llegan cada 10 minutos, `julianday(momento) - julianday(LAG(momento))` multiplicado por 1440 debería dar ~10. Un 40 dice que faltan tres lecturas.

El problema al revés, encontrar **islas** (rachas de días seguidos, lecturas seguidas fuera de rango), tiene un truco clásico: numera las filas de la racha con `ROW_NUMBER` y réstale ese número a la fecha. Mientras los días van seguidos, la fecha sube de uno en uno igual que el número, y la resta **no cambia**: esa resta es el nombre de la isla. Después, `GROUP BY` esa resta.

```figura
title: Días seguidos tienen la misma resta
panes:
  - table:
      head: [dia, "ROW_NUMBER()", "dia − n", isla]
      rows:
        - ["20", "1", "19", "A"]
        - ["21", "2", "19", "A"]
        - ["22", "3", "19", "A"]
        - ["25", "4", "21", "B"]
        - ["26", "5", "21", "B"]
        - ["28", "6", "22", "C"]
caption: "Faltan el 23, el 24 y el 27, y cada hueco cambia la resta. Tres islas: del 20 al 22 (3 días), del 25 al 26 (2) y el 28 (1). En SQLite la fecha se vuelve número con `julianday(dia)`."
```

> **Trampa común:** `LAST_VALUE(valor) OVER (ORDER BY momento)` **no** da el último valor de la partición: da el de la fila actual. Con `ORDER BY` y sin marco, el marco termina en la fila actual (`… AND CURRENT ROW`), así que lo último que ve es ella misma. Para el último de verdad escribe el marco entero: `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`. `FIRST_VALUE` no tiene ese problema, porque el marco siempre empieza al inicio.

<!-- legacy: lag-lead -->

<!-- mdn: lag-lead -->

## Práctica

```exercise
id: sql10-predice-acumulado
type: predict
title: El acumulado con empates
prompt: |
  Dos filas tienen `k = 2`. Con el marco por defecto (`RANGE`), ¿qué devuelve?
code: |
  WITH t(k, v) AS (VALUES (1, 10), (2, 20), (2, 5), (3, 1))
  SELECT k, sum(v) OVER (ORDER BY k) AS acumulado
  FROM t
  ORDER BY k;
options:
  - "1 | 10\n2 | 35\n2 | 35\n3 | 36"
  - "1 | 10\n2 | 30\n2 | 35\n3 | 36"
  - "1 | 10\n2 | 20\n2 | 5\n3 | 1"
  - "1 | 36\n2 | 36\n2 | 36\n3 | 36"
answer: "1 | 10\n2 | 35\n2 | 35\n3 | 36"
explain: |
  `RANGE` mete juntas las filas que empatan en el `ORDER BY`: para las dos con `k = 2`, el marco llega hasta la última fila con `k = 2`, y las dos ven 10 + 20 + 5 = 35. Con `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`, una vería 30 y la otra 35 (en un orden que no controlas).
```

```exercise
id: sql10-predice-ultimo
type: predict
title: El último que no es el último
prompt: |
  ¿Qué devuelve?
code: |
  WITH t(k, v) AS (VALUES (1, 'a'), (2, 'b'), (3, 'c'))
  SELECT k, LAST_VALUE(v) OVER (ORDER BY k) AS ultimo
  FROM t
  ORDER BY k;
options:
  - "1 | a\n2 | b\n3 | c"
  - "1 | c\n2 | c\n3 | c"
  - "1 | a\n2 | a\n3 | a"
  - "1 | NULL\n2 | a\n3 | b"
answer: "1 | a\n2 | b\n3 | c"
explain: |
  Con `ORDER BY` y sin marco, el marco va del inicio **hasta la fila actual**. El último del marco es la fila actual, así que cada una se ve a sí misma. Con `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING` saldría `c` en las tres.
```

```exercise
id: sql10-completa-salto
type: complete
title: El salto de Tika
prompt: |
  Muestra cada lectura de giroscopio de Tika (`robot_id = 3`) del martes 24 entre las **02:30 y las 03:30**, con su `momento`, su `valor` y el `salto` desde la lectura anterior (`valor` menos el anterior, redondeado a 2 decimales). Reemplaza los `___`.
starter: |
  SELECT momento, valor,
         round(valor - ___(valor) OVER (___ BY momento), 2) AS salto
  FROM lecturas
  WHERE robot_id = 3
    AND sensor = 'giroscopio'
    AND momento BETWEEN '2026-03-24 02:30' AND '2026-03-24 03:30'
  ORDER BY momento;
solution: |
  SELECT momento, valor,
         round(valor - LAG(valor) OVER (ORDER BY momento), 2) AS salto
  FROM lecturas
  WHERE robot_id = 3
    AND sensor = 'giroscopio'
    AND momento BETWEEN '2026-03-24 02:30' AND '2026-03-24 03:30'
  ORDER BY momento;
hints:
  - "La función que mira la fila anterior es `LAG`, y la ventana se ordena con `ORDER BY`."
tests:
  - name: cada lectura con su salto, en orden
    same: SELECT momento, valor, round(valor - LAG(valor) OVER (ORDER BY momento), 2) FROM lecturas WHERE robot_id = 3 AND sensor = 'giroscopio' AND momento BETWEEN '2026-03-24 02:30' AND '2026-03-24 03:30' ORDER BY momento
    ordered: true
```

```exercise
id: sql10-arregla-particion
type: fix
title: Dos robots en la misma media
prompt: |
  Esta consulta quiere la **media móvil de tres lecturas** de temperatura de **cada robot** (Tika y Kusi) el martes 24 entre las 10:00 y las 12:00, redondeada a un decimal. Pero los números de Tika salen inflados: el marco mezcla lecturas de Kusi. Arréglala.
visual:
  figure:
    title: Lo que ve el marco
    panes:
      - label: Sin PARTITION BY (mal)
        cells: ["Tika 34.6", "Kusi 48.7", "Tika 34.1"]
        highlight: [0, 1, 2]
      - label: Con PARTITION BY robot_id (bien)
        cells: ["Tika 34.6", "Tika 34.1", "Tika 35.8"]
        highlight: [0, 1, 2]
starter: |
  SELECT robot_id, momento, valor,
         round(avg(valor) OVER (ORDER BY momento
                                ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 1) AS media
  FROM lecturas
  WHERE robot_id IN (3, 4)
    AND sensor = 'temperatura'
    AND momento BETWEEN '2026-03-24 10:00' AND '2026-03-24 12:00'
  ORDER BY robot_id, momento;
solution: |
  SELECT robot_id, momento, valor,
         round(avg(valor) OVER (PARTITION BY robot_id ORDER BY momento
                                ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 1) AS media
  FROM lecturas
  WHERE robot_id IN (3, 4)
    AND sensor = 'temperatura'
    AND momento BETWEEN '2026-03-24 10:00' AND '2026-03-24 12:00'
  ORDER BY robot_id, momento;
hints:
  - "El `ORDER BY` del final no separa a los robots dentro de la ventana. Agrega `PARTITION BY robot_id` antes del `ORDER BY` de la ventana."
tests:
  - name: la media móvil de cada robot por separado
    same: SELECT robot_id, momento, valor, round(avg(valor) OVER (PARTITION BY robot_id ORDER BY momento ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 1) FROM lecturas WHERE robot_id IN (3, 4) AND sensor = 'temperatura' AND momento BETWEEN '2026-03-24 10:00' AND '2026-03-24 12:00' ORDER BY robot_id, momento
    ordered: true
```

```exercise
id: sql10-escribe-acumulado
type: write
title: Cuántas van fuera de rango
prompt: |
  Para las lecturas de giroscopio de **Pituco** (`robot_id = 11`) del jueves 26 entre las **02:30 y las 04:00**, muestra `momento`, `valor` y `fuera`: cuántas lecturas fuera de rango (valor absoluto mayor que 1) lleva **acumuladas** hasta esa fila, incluida. Ordena por `momento`.
visual:
  figure:
    title: Un contador que solo sube
    panes:
      - label: "abs(valor) > 1"
        cells: ["no", "no", "no", "sí", "sí", "sí"]
        highlight: [3, 4, 5]
      - label: fuera
        cells: ["0", "0", "0", "1", "2", "3"]
starter: |
  SELECT momento, valor
  FROM lecturas
  WHERE robot_id = 11
    AND sensor = 'giroscopio'
    AND momento BETWEEN '2026-03-26 02:30' AND '2026-03-26 04:00'
  ORDER BY momento;
solution: |
  SELECT momento, valor,
         sum(CASE WHEN abs(valor) > 1 THEN 1 ELSE 0 END)
           OVER (ORDER BY momento ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS fuera
  FROM lecturas
  WHERE robot_id = 11
    AND sensor = 'giroscopio'
    AND momento BETWEEN '2026-03-26 02:30' AND '2026-03-26 04:00'
  ORDER BY momento;
hints:
  - "`CASE WHEN abs(valor) > 1 THEN 1 ELSE 0 END` vale 1 en las lecturas fuera de rango. Súmalo con una ventana ordenada por `momento`."
tests:
  - name: el contador acumulado, en orden
    same: SELECT momento, valor, sum(CASE WHEN abs(valor) > 1 THEN 1 ELSE 0 END) OVER (ORDER BY momento) FROM lecturas WHERE robot_id = 11 AND sensor = 'giroscopio' AND momento BETWEEN '2026-03-26 02:30' AND '2026-03-26 04:00' ORDER BY momento
    ordered: true
  - name: columnas momento, valor y fuera
    columns: [momento, valor, fuera]
```

```exercise
id: sql10-escribe-primera
type: write
title: Contra la primera del día
prompt: |
  Para las lecturas de temperatura de **Kusi** (`robot_id = 4`) del martes 24 entre las **10:00 y las 13:00**, muestra `momento`, `valor` y `subida`: cuánto subió desde la **primera lectura de ese tramo**, redondeado a un decimal. Ordena por `momento`.
starter: |
  SELECT momento, valor
  FROM lecturas
  WHERE robot_id = 4
    AND sensor = 'temperatura'
    AND momento BETWEEN '2026-03-24 10:00' AND '2026-03-24 13:00'
  ORDER BY momento;
solution: |
  SELECT momento, valor,
         round(valor - FIRST_VALUE(valor) OVER (ORDER BY momento), 1) AS subida
  FROM lecturas
  WHERE robot_id = 4
    AND sensor = 'temperatura'
    AND momento BETWEEN '2026-03-24 10:00' AND '2026-03-24 13:00'
  ORDER BY momento;
hints:
  - "`FIRST_VALUE(valor) OVER (ORDER BY momento)` trae el valor de la primera fila del marco, que con el marco por defecto es siempre la primera del tramo."
tests:
  - name: la subida de cada lectura, en orden
    same: SELECT momento, valor, round(valor - FIRST_VALUE(valor) OVER (ORDER BY momento), 1) FROM lecturas WHERE robot_id = 4 AND sensor = 'temperatura' AND momento BETWEEN '2026-03-24 10:00' AND '2026-03-24 13:00' ORDER BY momento
    ordered: true
  - name: columnas momento, valor y subida
    columns: [momento, valor, subida]
```

## El caso

```exercise
id: sql10-caso-visitas
type: case
title: Cuánto duró cada visita
prompt: |
  **Calcula cuántos minutos duró cada visita a la sala que empezó de madrugada (entrada antes de las 06:00) y lista las que duraron más de 10 minutos, de la más larga a la más corta. ¿Cuántos minutos duró la más larga?**

  Una visita va de una `entrada` a la **siguiente** pasada de la misma tarjeta, que es su `salida`. Con `LEAD` sobre `accesos`, partido por tarjeta y ordenado por hora, cada entrada puede ver su salida. Para los minutos: `(julianday(salida) - julianday(entrada)) * 1440`.
visual:
  - escenario:
      case: sensores
  - ventana:
      title: LEAD(momento) OVER (PARTITION BY tarjeta ORDER BY momento)
      table:
        cols: [tarjeta, momento, sentido]
        rows:
          - ["T-0533", "00:03", "entrada"]
          - ["T-0533", "00:08", "salida"]
          - ["T-0533", "04:03", "entrada"]
          - ["T-0533", "04:07", "salida"]
      partition: tarjeta
      order: momento
      fn: lead
      col: momento
      as: salida
      caption: "Dos rondas de la T-0533, la tarjeta nueva de Wilmer. Cada fila mira la siguiente de su tarjeta: la entrada ve su salida; la última no tiene siguiente y queda en NULL."
starter: |
  -- Las pasadas de una tarjeta, en orden
  SELECT tarjeta, momento, sentido
  FROM accesos
  WHERE tarjeta = 'T-0533'
  ORDER BY momento
  LIMIT 4;
solution: |
  WITH visitas AS (
    SELECT tarjeta, momento, sentido,
           LEAD(momento) OVER (PARTITION BY tarjeta ORDER BY momento) AS salida
    FROM accesos
  )
  SELECT tarjeta, momento AS entrada, salida,
         round((julianday(salida) - julianday(momento)) * 1440) AS minutos
  FROM visitas
  WHERE sentido = 'entrada'
    AND time(momento) < '06:00'
    AND (julianday(salida) - julianday(momento)) * 1440 > 10
  ORDER BY minutos DESC;
answer: "39"
answerLabel: ¿Cuántos minutos duró la más larga?
reveal: |
  **39 minutos**, y las dos visitas largas son de la **T-0412**. Sus dos visitas de madrugada duran **38 minutos** (24 de marzo, 01:38 a 02:16) y **39 minutos** (26 de marzo, 01:52 a 02:31). Las rondas de Wilmer, con cualquiera de sus tarjetas, duran de 3 a 5 minutos. Y la T-0412 la había denunciado perdida el lunes 23, antes de la primera visita.
hints:
  - "Calcula `LEAD` sobre **todas** las pasadas: si filtras `sentido = 'entrada'` en la misma consulta, el `WHERE` corre antes y `LEAD` emparejaría cada entrada con la entrada siguiente. Filtra afuera, en la consulta que lee el `WITH`."
  - "En SQLite puedes escribir la condición de los minutos completa en el `WHERE` de afuera: `(julianday(salida) - julianday(momento)) * 1440 > 10`."
```

## El juez

```exercise
id: sql10-juez-racha
type: judge
title: La racha más larga
prompt: |
  **Devuelve, para cada robot, su racha más larga de días seguidos con turno: `robot` y `dias`, ordenado por robot.**

  Loop premia la constancia. La tabla tiene un turno por fila, pero el sistema a veces registra el mismo turno dos veces (mismo robot, mismo día). Dos días son seguidos si el segundo es el día siguiente del primero.

  **Tabla:** `turnos(id, robot, dia)`, con `dia` como `'AAAA-MM-DD'`.

  **Resultado:** `robot` y el largo de su racha más larga, en días.
schema: |
  CREATE TABLE turnos (id INTEGER, robot TEXT, dia TEXT);
ordered: true
starter: |
  SELECT robot, count(*) AS dias
  FROM turnos
  GROUP BY robot
  ORDER BY robot;
solution: |
  WITH dias AS (
    SELECT DISTINCT robot, dia FROM turnos
  ),
  islas AS (
    SELECT robot, dia,
           julianday(dia) - ROW_NUMBER() OVER (PARTITION BY robot ORDER BY dia) AS isla
    FROM dias
  ),
  rachas AS (
    SELECT robot, count(*) AS largo
    FROM islas
    GROUP BY robot, isla
  )
  SELECT robot, max(largo) AS dias
  FROM rachas
  GROUP BY robot
  ORDER BY robot;
hints:
  - "Quita primero los repetidos con `SELECT DISTINCT robot, dia`. Después, `julianday(dia) - ROW_NUMBER() OVER (PARTITION BY robot ORDER BY dia)` es igual en todos los días de una misma racha."
  - "Cuenta los días de cada isla con `GROUP BY robot, isla` y quédate con el máximo de cada robot."
samples:
  - rows:
      turnos: [[1, "Tika", "2026-03-20"], [2, "Tika", "2026-03-21"], [3, "Tika", "2026-03-22"], [4, "Tika", "2026-03-25"], [5, "Tika", "2026-03-26"], [6, "Kusi", "2026-03-28"]]
    note: "Tika tiene una racha de 3 (20 al 22) y otra de 2 (25 y 26). Kusi, una de 1."
  - rows:
      turnos: [[1, "Pituco", "2026-02-27"], [2, "Pituco", "2026-02-28"], [3, "Pituco", "2026-02-28"], [4, "Pituco", "2026-03-01"]]
    note: "El 28 está dos veces y cuenta una. Y del 28 de febrero al 1 de marzo también son días seguidos: 3."
edge:
  - rows: { turnos: [] }
    tag: sin turnos
  - rows: { turnos: [[1, "Quilla", "2026-03-10"], [2, "Quilla", "2026-03-12"], [3, "Quilla", "2026-03-14"]] }
    tag: sin ningún par de días seguidos
  - rows: { turnos: [[1, "Tika", "2026-12-31"], [2, "Tika", "2027-01-01"], [3, "Tika", "2027-01-02"], [4, "Tika", "2026-12-31"]] }
    tag: con una racha que cruza el año nuevo
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
    return { turnos: rows };
wrong:
  - |
    SELECT robot, count(DISTINCT dia) FROM turnos GROUP BY robot ORDER BY robot;
  - |
    WITH i AS (SELECT robot, julianday(dia) - ROW_NUMBER() OVER (PARTITION BY robot ORDER BY dia) AS isla FROM turnos), r AS (SELECT robot, count(*) AS c FROM i GROUP BY robot, isla) SELECT robot, max(c) FROM r GROUP BY robot ORDER BY robot;
  - |
    WITH d AS (SELECT DISTINCT robot, dia FROM turnos), i AS (SELECT robot, julianday(dia) - ROW_NUMBER() OVER (ORDER BY dia) AS isla FROM d), r AS (SELECT robot, count(*) AS c FROM i GROUP BY robot, isla) SELECT robot, max(c) FROM r GROUP BY robot ORDER BY robot;
  - |
    WITH d AS (SELECT DISTINCT robot, dia FROM turnos), i AS (SELECT robot, CAST(substr(dia, 9, 2) AS INTEGER) - ROW_NUMBER() OVER (PARTITION BY robot ORDER BY dia) AS isla FROM d), r AS (SELECT robot, count(*) AS c FROM i GROUP BY robot, isla) SELECT robot, max(c) FROM r GROUP BY robot ORDER BY robot;
```

## Misión final

```exercise
id: sql10-mision-silencio
type: mission
title: Cuando los robots se callan
prompt: |
  **Encuentra los silencios de los robots desde el viernes 20: cada vez que entre dos lecturas de giroscopio seguidas de un mismo robot pasaron más de 25 minutos. Muestra el nombre del robot como `robot`, la lectura de antes como `desde`, la de después como `hasta` y los `minutos` (redondeados), en orden de `desde`.** Después di qué robot se calló primero.

  Las lecturas llegan cada 10 minutos; a veces se pierde una (20 minutos), y eso es normal. Compara con las visitas de la T-0412: el 24 de 01:38 a 02:16 y el 26 de 01:52 a 02:31.

  Cuando la consulta lo pruebe y respondas, junto con el juez, se abre la sesión 11.
visual:
  - escenario:
      case: sensores
  - figure:
      title: "La madrugada del martes 24, fila por fila"
      lanes:
        from: "00:00"
        to: "03:30"
        tick: 30
        bands: [{"from": "01:38", "to": "02:16", "label": "T-0412 adentro"}]
        rows:
          - label: "Puerta"
            sub: "tarjetas"
            bars:
              - {"from": "01:38", "to": "02:16", "label": "T-0412"}
            events: [{"at": "00:03", "label": "T-0533"}, {"at": "03:00", "label": "calibra", "side": "left"}]
          - label: "Tika"
            sub: "lecturas"
            bars:
              - from: "01:32"
                to: "02:12"
                label: "silencio"
                kind: "gap"
                by: "sql10-mision-silencio"
            events: [{"at": "03:02", "label": "descalibrada", "kind": "bad", "side": "left", "by": "sql9-caso-primera"}]
          - label: "Kusi"
            sub: "lecturas"
            bars:
              - from: "01:44"
                to: "02:24"
                label: "silencio"
                kind: "gap"
                by: "sql10-mision-silencio"
            events: [{"at": "03:04", "label": "descalibrada", "kind": "bad", "side": "left", "by": "sql9-caso-primera"}]
  - figure:
      title: "La madrugada del jueves 26"
      lanes:
        from: "01:00"
        to: "03:30"
        tick: 30
        bands: [{"from": "01:52", "to": "02:31", "label": "T-0412 adentro"}]
        rows:
          - label: "Puerta"
            sub: "tarjetas"
            bars: [{"from": "01:52", "to": "02:31", "label": "T-0412"}]
            events: [{"at": "03:00", "label": "calibra", "side": "left"}]
          - label: "Pituco"
            sub: "lecturas"
            bars:
              - from: "01:58"
                to: "02:38"
                label: "silencio"
                kind: "gap"
                by: "sql10-mision-silencio"
            events: [{"at": "03:08", "label": "descalibrado", "kind": "bad", "side": "left", "by": "sql9-caso-primera"}]
starter: |
  SELECT robot_id, momento
  FROM lecturas
  WHERE sensor = 'giroscopio'
    AND momento >= '2026-03-20'
  ORDER BY robot_id, momento
  LIMIT 10;
solution: |
  WITH pares AS (
    SELECT robot_id, momento,
           LAG(momento) OVER (PARTITION BY robot_id ORDER BY momento) AS antes
    FROM lecturas
    WHERE sensor = 'giroscopio'
      AND momento >= '2026-03-20'
  )
  SELECT r.nombre AS robot, p.antes AS desde, p.momento AS hasta,
         round((julianday(p.momento) - julianday(p.antes)) * 1440) AS minutos
  FROM pares AS p
  JOIN robots AS r ON r.id = p.robot_id
  WHERE (julianday(p.momento) - julianday(p.antes)) * 1440 > 25
  ORDER BY desde;
answer: Tika
answerLabel: ¿Qué robot se calló primero?
reveal: |
  **Tika**, de 01:32 a 02:12 del martes 24; después **Kusi**, de 01:44 a 02:24, y **Pituco**, de 01:58 a 02:38 del jueves 26. Tres silencios de 40 minutos, y en los tres la T-0412 estaba adentro: alguien conectó a cada robot y lo reinició. Mientras tanto, la tarjeta nueva de Wilmer hacía sus rondas de siempre a medianoche y a las cuatro. **Wilmer no fue: alguien usó su tarjeta perdida.** Carmen recuerda que solo dos personas saben cambiar el firmware de los robots: ella y **Gonzalo Pumacayo**, que lo programó hasta febrero.
hints:
  - "`LAG(momento) OVER (PARTITION BY robot_id ORDER BY momento)` trae la lectura anterior del mismo robot. Calcúlalo en un `WITH` y filtra los minutos afuera."
  - "Minutos entre dos momentos: `(julianday(despues) - julianday(antes)) * 1440`. La primera lectura de cada robot tiene `antes` en NULL, y una comparación con NULL nunca pasa el `WHERE`."
tests:
  - name: los silencios de más de 25 minutos, en orden
    same: WITH x AS (SELECT robot_id, momento, LAG(momento) OVER (PARTITION BY robot_id ORDER BY momento) AS a FROM lecturas WHERE sensor = 'giroscopio' AND momento >= '2026-03-20') SELECT r.nombre, x.a, x.momento, round((julianday(x.momento) - julianday(x.a)) * 1440) FROM x JOIN robots AS r ON r.id = x.robot_id WHERE (julianday(x.momento) - julianday(x.a)) * 1440 > 25 ORDER BY x.a
    ordered: true
  - name: columnas robot, desde, hasta y minutos
    columns: [robot, desde, hasta, minutos]
  - name: usa LAG o LEAD
    source: '\b(LAG|LEAD)\s*\('
```

## Reto experto

```exercise
id: sql10-reto-hora
type: challenge
title: La última hora, no las últimas seis
prompt: |
  **Para las lecturas de giroscopio de Tika del martes 24 entre la 01:00 y las 03:30, muestra `momento`, `valor`, `media`: el promedio de las lecturas de la última hora (desde 3600 segundos antes hasta esta, incluida), redondeado a 2 decimales, y `filas`: cuántas lecturas entraron en esa hora.** Ordena por `momento`.

  Para quien ya programa: `ROWS BETWEEN 5 PRECEDING AND CURRENT ROW` serían "las últimas seis lecturas", y después del silencio de las 01:32 esas seis cubrirían más de una hora. `RANGE` con un número mide en unidades del `ORDER BY`: ordena por `unixepoch(momento)` (segundos) y usa `RANGE BETWEEN 3600 PRECEDING AND CURRENT ROW`.
starter: |
  SELECT momento, valor
  FROM lecturas
  WHERE robot_id = 3
    AND sensor = 'giroscopio'
    AND momento BETWEEN '2026-03-24 01:00' AND '2026-03-24 03:30'
  ORDER BY momento;
solution: |
  SELECT momento, valor,
         round(avg(valor) OVER hora, 2) AS media,
         count(*) OVER hora AS filas
  FROM lecturas
  WHERE robot_id = 3
    AND sensor = 'giroscopio'
    AND momento BETWEEN '2026-03-24 01:00' AND '2026-03-24 03:30'
  WINDOW hora AS (ORDER BY unixepoch(momento) RANGE BETWEEN 3600 PRECEDING AND CURRENT ROW)
  ORDER BY momento;
hints:
  - "`WINDOW nombre AS (…)` define una ventana una vez para usarla en varias columnas con `OVER nombre`."
  - "Mira `filas` a las 02:12: solo 4, porque el silencio dejó la hora casi vacía."
tests:
  - name: media y filas de la última hora
    same: SELECT momento, valor, round(avg(valor) OVER (ORDER BY unixepoch(momento) RANGE BETWEEN 3600 PRECEDING AND CURRENT ROW), 2), count(*) OVER (ORDER BY unixepoch(momento) RANGE BETWEEN 3600 PRECEDING AND CURRENT ROW) FROM lecturas WHERE robot_id = 3 AND sensor = 'giroscopio' AND momento BETWEEN '2026-03-24 01:00' AND '2026-03-24 03:30' ORDER BY momento
    ordered: true
  - name: columnas momento, valor, media y filas
    columns: [momento, valor, media, filas]
  - name: usa RANGE
    source: '\bRANGE\s+BETWEEN'
```
