# Sesión 9 — Funciones de ventana

```session
case: sensores
```

## El encargo

Viernes 27 de marzo, 09:10. Carmen Ríos llega a Loop con tres robots que no funcionan: desde el martes, **Tika** choca con las paredes en su ronda nocturna y **Kusi** se recalienta en la cocina; desde el jueves, **Pituco** se va de lado en sus repartos por Barranco. Los tres duermen en la **sala de sensores**, donde cada noche, a las **03:00**, se calibran solos.

Desde el viernes 20, la sala guarda una lectura de cada robot **cada diez minutos** (giroscopio y temperatura) en `lecturas`, y la puerta registra cada tarjeta que la abre en una tabla nueva, `accesos`. Son miles de filas. Para encontrar "la primera lectura rara de **cada** robot" o "la última entrada de **cada** noche" no basta con agrupar: necesitas numerar filas **dentro de cada grupo sin perderlas**. Eso hacen las funciones de ventana.

```escenario
case: sensores
title: La sala de sensores de Loop
caption: "Los robots duermen sobre los pads de carga. Los racks guardan las lecturas y la puerta tiene un lector de tarjetas."
```

```expediente
title: Quién tiene tarjeta de la sala
cards:
  - name: Carmen Ríos Llanos
    traits: { style: bun, shirt: "#3f7cc4", glasses: true }
    role: Dueña de Loop, tarjeta T-0101
    rows: [["Horario", "lunes a sábado, de día"]]
    quote: "A las tres de la mañana los robots se calibran solos. Alguien les cambió la calibración."
  - name: Yesenia Choque Ugarte
    traits: { style: long, shirt: "#c4553f", earrings: true }
    role: Practicante, tarjeta T-0215
    rows: [["Horario", "lunes a viernes, 9 a 18"]]
    quote: "El viernes 20 actualicé los cinco robots."
  - name: Wilmer Zevallos Benavides
    traits: { style: cap, capColor: "#33507a", shirt: "#33507a" }
    role: Vigilante de la galería, tarjeta T-0412
    rows: [["Rondas", "medianoche y 4 a. m."]]
    quote: "Entro, miro que los robots estén cargando y salgo."
  - name: Kiara Montes Alvarado
    traits: { style: bun, shirt: "#3fa7a7", glasses: true }
    role: Técnica de Andina Robótica, tarjeta T-0388
    rows: [["Horario", "miércoles en la tarde"]]
    quote: "Yo solo calibro a Illa, que es de Andina."
```

## Lo mínimo

Con `GROUP BY` cada grupo se **aplasta** en una sola fila: sabes el promedio de cada robot, pero pierdes sus lecturas. Una **función de ventana** calcula sobre un grupo de filas, la "ventana", y **deja cada fila en su sitio**, con una columna nueva al lado. Se reconoce por la palabra `OVER`:

```sql
función(...) OVER (PARTITION BY columna ORDER BY otra)
```

- **`OVER ()`**, vacío: la ventana es todo el resultado. `count(*) OVER ()` pone el total de filas en cada fila.
- **`PARTITION BY`** parte las filas en grupos, como `GROUP BY`, pero sin aplastarlas: cada fila ve solo a las de su grupo.
- **`ORDER BY`** dentro de `OVER` ordena las filas **dentro de cada partición**. No ordena el resultado: para eso sigue el `ORDER BY` de siempre, al final.

```figura
title: El mismo promedio, de dos formas
panes:
  - label: "GROUP BY robot: 2 filas"
    table:
      head: [robot, promedio]
      rows: [["Kusi", "70.7"], ["Tika", "35.9"]]
  - label: "AVG(valor) OVER (PARTITION BY robot): las 4 filas siguen ahí"
    table:
      head: [robot, momento, valor, promedio]
      rows: [["Kusi", "12:04", "68.7", "70.7"], ["Kusi", "12:14", "72.7", "70.7"], ["Tika", "12:02", "35.6", "35.9"], ["Tika", "12:12", "36.1", "35.9"]]
caption: "`GROUP BY` devuelve un resumen por grupo. La ventana repite el resumen en cada fila de su grupo, así puedes comparar cada lectura con el promedio de su robot."
```

```sql run
SELECT robot_id, momento, valor,
       round(avg(valor) OVER (PARTITION BY robot_id), 1) AS promedio,
       count(*) OVER () AS total
FROM lecturas
WHERE sensor = 'temperatura'
  AND momento BETWEEN '2026-03-24 12:00' AND '2026-03-24 12:19:59'
ORDER BY robot_id, momento;
```

### Numerar filas: ROW_NUMBER, RANK y DENSE_RANK

Tres funciones solo existen como ventanas y sirven para poner puestos. Las tres miran el `ORDER BY` de la ventana y **vuelven a empezar en 1 en cada partición**. Dale a ▶ y mira cómo `ROW_NUMBER` numera las lecturas de cada robot por hora:

```ventana
title: ROW_NUMBER() OVER (PARTITION BY robot ORDER BY momento)
query: |
  SELECT robot, momento, valor,
         ROW_NUMBER() OVER (PARTITION BY robot ORDER BY momento) AS vez
  FROM lecturas;
table:
  cols: [robot, momento, valor]
  rows:
    - ["Tika", "03:02", 1.81]
    - ["Kusi", "03:04", -1.58]
    - ["Tika", "02:52", 0.03]
    - ["Kusi", "02:44", 0.02]
    - ["Tika", "03:12", 1.78]
    - ["Kusi", "03:14", -1.61]
partition: robot
order: momento
fn: row_number
as: vez
caption: "Primero el motor reparte las filas en particiones (una banda de color por robot) y las ordena por `momento`. Luego recorre cada partición y cuenta: 1, 2, 3… y vuelve a 1 en la siguiente."
```

¿Y si dos filas empatan en el `ORDER BY`? Ahí se separan:

- **`ROW_NUMBER()`** nunca repite: 1, 2, 3, 4. Entre dos empatadas elige **cualquiera**, así que agrega un desempate (`ORDER BY maxima DESC, robot`).
- **`RANK()`** da el mismo puesto a los empatados y **salta**: 1, 2, 3, 3, 5, como en una carrera.
- **`DENSE_RANK()`** da el mismo puesto y **no salta**: 1, 2, 3, 3, 4.

```ventana
title: RANK() OVER (ORDER BY maxima DESC)
query: |
  SELECT robot, maxima,
         RANK() OVER (ORDER BY maxima DESC) AS puesto
  FROM peor_del_dia;
table:
  cols: [robot, maxima]
  rows:
    - ["Chasqui", 0.07]
    - ["Tika", 1.86]
    - ["Kusi", 1.61]
    - ["Quilla", 0.07]
    - ["Pituco", 0.05]
order: maxima
desc: true
fn: rank
as: puesto
caption: "Sin `PARTITION BY`, la ventana es toda la tabla. Chasqui y Quilla empatan en 0.07: los dos son 3.º y Pituco queda 5.º, porque el 4.º puesto se lo comió el empate. Con `DENSE_RANK`, Pituco sería 4.º."
```

### Dónde corren las ventanas

Las ventanas se calculan **junto con el `SELECT`**: después de `FROM`, `WHERE`, `GROUP BY` y `HAVING`, y antes de `DISTINCT`, `ORDER BY` y `LIMIT`. Por eso una ventana solo ve las filas que sobrevivieron al `WHERE`, y por eso puede ir encima de un `GROUP BY` (`RANK() OVER (ORDER BY max(valor) DESC)`). Mira cuándo aparece la columna `puesto`:

```orden
title: La ventana nace en el paso SELECT
query: |
  SELECT robot, momento, valor,
         ROW_NUMBER() OVER (PARTITION BY robot ORDER BY valor DESC) AS puesto
  FROM lecturas
  WHERE sensor = 'temperatura'
  ORDER BY robot, puesto;
tables:
  lecturas:
    cols: [id, robot, sensor, momento, valor]
    rows:
      - [1, "Kusi", "temperatura", "12:04", 68.7]
      - [2, "Kusi", "giroscopio", "12:04", -1.6]
      - [3, "Tika", "temperatura", "12:02", 35.6]
      - [4, "Kusi", "temperatura", "12:14", 72.4]
      - [5, "Tika", "giroscopio", "12:02", 1.79]
      - [6, "Tika", "temperatura", "12:12", 36.1]
      - [7, "Kusi", "temperatura", "12:24", 71.9]
caption: "`WHERE` tacha los giroscopios; recién en el paso `SELECT` el motor parte lo que queda por robot, lo ordena por `valor` y numera. El `ORDER BY` del final solo acomoda el resultado."
```

Para quedarte con **los primeros de cada grupo** (el *top-N por grupo*), calcula la ventana en un `WITH` y filtra afuera, cuando la columna ya existe:

```sql run
WITH puestos AS (
  SELECT robot_id, momento, valor,
         ROW_NUMBER() OVER (PARTITION BY robot_id ORDER BY valor DESC, momento) AS puesto
  FROM lecturas
  WHERE sensor = 'temperatura' AND momento >= '2026-03-20'
)
SELECT robot_id, momento, valor
FROM puestos
WHERE puesto = 1
ORDER BY robot_id;
```

> **Trampa común:** escribir `WHERE puesto = 1` en la misma consulta que calcula `puesto`. Cuando se evalúa el `WHERE`, la ventana todavía no existe, y SQLite responde *misuse of window function*. Calcula en un `WITH` (o una subconsulta en el `FROM`) y filtra afuera. Algunos motores, como DuckDB o Snowflake, tienen `QUALIFY` para filtrar ventanas en la misma consulta; SQLite, PostgreSQL y MySQL no.

Las funciones de ventana llegaron a SQLite en la versión 3.25 (2018), a MySQL en la 8.0 (2018) y a PostgreSQL mucho antes, en la 8.4 (2009). En una base vieja verás otros trucos para numerar:

<!-- legacy: window-functions -->

<!-- mdn: window-functions -->

## Práctica

```exercise
id: sql9-predice-rangos
type: predict
title: Empates en el podio
prompt: |
  ¿Qué devuelve?
code: |
  WITH t(robot, maxima) AS (
    VALUES ('Tika', 1.86), ('Kusi', 1.61), ('Chasqui', 0.07),
           ('Quilla', 0.07), ('Pituco', 0.05)
  )
  SELECT robot,
         RANK() OVER (ORDER BY maxima DESC) AS rk,
         DENSE_RANK() OVER (ORDER BY maxima DESC) AS dr
  FROM t
  ORDER BY maxima DESC, robot;
options:
  - "Tika | 1 | 1\nKusi | 2 | 2\nChasqui | 3 | 3\nQuilla | 3 | 3\nPituco | 5 | 4"
  - "Tika | 1 | 1\nKusi | 2 | 2\nChasqui | 3 | 3\nQuilla | 4 | 4\nPituco | 5 | 5"
  - "Tika | 1 | 1\nKusi | 2 | 2\nChasqui | 3 | 3\nQuilla | 3 | 3\nPituco | 4 | 5"
  - "Tika | 1 | 1\nKusi | 2 | 2\nChasqui | 3 | 3\nQuilla | 3 | 3\nPituco | 4 | 4"
answer: "Tika | 1 | 1\nKusi | 2 | 2\nChasqui | 3 | 3\nQuilla | 3 | 3\nPituco | 5 | 4"
explain: |
  Chasqui y Quilla empatan en 0.07 y comparten el 3.º puesto en las dos. Después, `RANK` salta al 5 (hubo cuatro robots antes que Pituco) y `DENSE_RANK` sigue con el 4 (hubo tres valores distintos antes).
```

```exercise
id: sql9-predice-where
type: predict
title: Solo Pituco
prompt: |
  Es la misma tabla, pero ahora el `WHERE` se queda con Pituco. ¿Qué devuelve?
code: |
  WITH t(robot, maxima) AS (
    VALUES ('Tika', 1.86), ('Kusi', 1.61), ('Chasqui', 0.07),
           ('Quilla', 0.07), ('Pituco', 0.05)
  )
  SELECT robot, RANK() OVER (ORDER BY maxima DESC) AS rk
  FROM t
  WHERE robot = 'Pituco';
options:
  - "Pituco | 1"
  - "Pituco | 5"
  - "Pituco | 4"
  - "Error: misuse of window function"
answer: "Pituco | 1"
explain: |
  El `WHERE` corre **antes** que la ventana: cuando `RANK` se calcula, solo queda una fila, y la única fila de una carrera llega primera. Si quieres el puesto de Pituco entre todos, calcula el ranking en un `WITH` y filtra afuera.
```

```exercise
id: sql9-completa-numera
type: complete
title: La primera, la segunda, la tercera
prompt: |
  Lista las pasadas por la puerta de la sala del **martes 24** con su `tarjeta`, su `momento` y un número `vez` que cuente las pasadas **de cada tarjeta** en orden de hora (la primera de cada tarjeta es 1). Ordena por tarjeta y momento. Reemplaza los `___`.
starter: |
  SELECT tarjeta, momento,
         ___() OVER (___ BY tarjeta ORDER BY ___) AS vez
  FROM accesos
  WHERE date(momento) = '2026-03-24'
  ORDER BY tarjeta, momento;
solution: |
  SELECT tarjeta, momento,
         ROW_NUMBER() OVER (PARTITION BY tarjeta ORDER BY momento) AS vez
  FROM accesos
  WHERE date(momento) = '2026-03-24'
  ORDER BY tarjeta, momento;
hints:
  - "La función que numera sin repetir es `ROW_NUMBER`; la que parte en grupos dentro de `OVER` es `PARTITION BY`."
tests:
  - name: cada pasada del 24 con su número dentro de su tarjeta
    same: SELECT tarjeta, momento, ROW_NUMBER() OVER (PARTITION BY tarjeta ORDER BY momento) FROM accesos WHERE date(momento) = '2026-03-24' ORDER BY tarjeta, momento
    ordered: true
```

```exercise
id: sql9-arregla-where
type: fix
title: El filtro que llega tarde
prompt: |
  Esta consulta quiere **la lectura de temperatura más alta de cada robot** desde el viernes 20 (si dos empatan, la más temprana), pero SQLite la rechaza. Arréglala para que devuelva `robot_id`, `momento` y `valor` de esas lecturas, ordenadas por `robot_id`.
visual:
  figure:
    title: Lo que pasa por dentro
    panes:
      - label: Orden de ejecución
        value: "FROM → WHERE → … → SELECT (aquí nace puesto)"
      - label: Lo que pide la consulta
        value: "WHERE puesto = 1"
starter: |
  SELECT robot_id, momento, valor,
         ROW_NUMBER() OVER (PARTITION BY robot_id ORDER BY valor DESC, momento) AS puesto
  FROM lecturas
  WHERE sensor = 'temperatura'
    AND momento >= '2026-03-20'
    AND puesto = 1
  ORDER BY robot_id;
solution: |
  WITH ranking AS (
    SELECT robot_id, momento, valor,
           ROW_NUMBER() OVER (PARTITION BY robot_id ORDER BY valor DESC, momento) AS puesto
    FROM lecturas
    WHERE sensor = 'temperatura'
      AND momento >= '2026-03-20'
  )
  SELECT robot_id, momento, valor
  FROM ranking
  WHERE puesto = 1
  ORDER BY robot_id;
hints:
  - "`puesto` se calcula en el paso `SELECT`, después del `WHERE`. Mueve el cálculo a un `WITH ranking AS (…)` y filtra `WHERE puesto = 1` en la consulta de afuera."
tests:
  - name: la lectura más alta de cada robot, por robot
    same: WITH x AS (SELECT robot_id, momento, valor, ROW_NUMBER() OVER (PARTITION BY robot_id ORDER BY valor DESC, momento) AS p FROM lecturas WHERE sensor = 'temperatura' AND momento >= '2026-03-20') SELECT robot_id, momento, valor FROM x WHERE p = 1 ORDER BY robot_id
    ordered: true
```

```exercise
id: sql9-escribe-top3
type: write
title: Las tres más inestables
prompt: |
  Para cada robot, lista sus **tres lecturas de giroscopio más lejos de cero** (mayor valor absoluto) desde el viernes 20: `robot_id`, `momento`, `valor` y su `puesto` (1, 2, 3). Si dos empatan, va primero la más temprana. Ordena por `robot_id` y `puesto`.
visual:
  figure:
    title: Top 3 por robot
    panes:
      - label: "Partición robot_id = 3 (Tika), por |valor| de mayor a menor"
        cells: ["1.87", "1.87", "1.87", "1.86", "1.86", "…"]
        highlight: [0, 1, 2]
    caption: "Las tres primeras empatan en 1.87: las desempata la hora, y la cuarta queda fuera aunque valga casi lo mismo."
starter: |
  SELECT robot_id, momento, valor
  FROM lecturas
  WHERE sensor = 'giroscopio'
    AND momento >= '2026-03-20';
solution: |
  WITH ranking AS (
    SELECT robot_id, momento, valor,
           ROW_NUMBER() OVER (PARTITION BY robot_id ORDER BY abs(valor) DESC, momento) AS puesto
    FROM lecturas
    WHERE sensor = 'giroscopio'
      AND momento >= '2026-03-20'
  )
  SELECT robot_id, momento, valor, puesto
  FROM ranking
  WHERE puesto <= 3
  ORDER BY robot_id, puesto;
hints:
  - "Ordena la ventana por `abs(valor) DESC, momento`: `abs` quita el signo."
  - "Numera en un `WITH` y quédate afuera con `puesto <= 3`."
tests:
  - name: tres lecturas por robot, en orden
    same: WITH x AS (SELECT robot_id, momento, valor, ROW_NUMBER() OVER (PARTITION BY robot_id ORDER BY abs(valor) DESC, momento) AS p FROM lecturas WHERE sensor = 'giroscopio' AND momento >= '2026-03-20') SELECT robot_id, momento, valor, p FROM x WHERE p <= 3 ORDER BY robot_id, p
    ordered: true
  - name: usa una función de ventana
    source: '\bOVER\s*\('
```

```exercise
id: sql9-escribe-promedio
type: write
title: Cada lectura contra su robot
prompt: |
  Para las lecturas de **temperatura** del martes 24 entre las **12:00 y las 12:59:59**, muestra `robot_id`, `momento`, `valor` y `promedio`: el promedio de **su** robot en esa hora, redondeado a un decimal. Ordena por `robot_id` y `momento`. Tienen que salir las 30 lecturas, no un resumen.
starter: |
  SELECT robot_id, round(avg(valor), 1) AS promedio
  FROM lecturas
  WHERE sensor = 'temperatura'
    AND momento BETWEEN '2026-03-24 12:00' AND '2026-03-24 12:59:59'
  GROUP BY robot_id;
solution: |
  SELECT robot_id, momento, valor,
         round(avg(valor) OVER (PARTITION BY robot_id), 1) AS promedio
  FROM lecturas
  WHERE sensor = 'temperatura'
    AND momento BETWEEN '2026-03-24 12:00' AND '2026-03-24 12:59:59'
  ORDER BY robot_id, momento;
hints:
  - "`GROUP BY` aplasta las lecturas. Quítalo y convierte el promedio en ventana: `avg(valor) OVER (PARTITION BY robot_id)`."
tests:
  - name: las 30 lecturas con el promedio de su robot
    same: SELECT robot_id, momento, valor, round(avg(valor) OVER (PARTITION BY robot_id), 1) FROM lecturas WHERE sensor = 'temperatura' AND momento BETWEEN '2026-03-24 12:00' AND '2026-03-24 12:59:59' ORDER BY robot_id, momento
    ordered: true
  - name: columnas robot_id, momento, valor y promedio
    columns: [robot_id, momento, valor, promedio]
```

## El caso

```exercise
id: sql9-caso-primera
type: case
title: La primera lectura rara
prompt: |
  **Para cada robot, encuentra su primera lectura de giroscopio fuera de rango (valor absoluto mayor que 1) desde el viernes 20. ¿Qué robot se descalibró otra noche que los demás?** Escribe su nombre.

  Un giroscopio sano marca casi cero (±0.1). Numera las lecturas fuera de rango de cada robot por hora y quédate con la primera; después pon el nombre del robot con `robots`.
visual:
  - escenario:
      case: sensores
  - esquema:
      tables: [lecturas, robots]
starter: |
  -- Las lecturas fuera de rango, en orden de hora
  SELECT robot_id, momento, valor
  FROM lecturas
  WHERE sensor = 'giroscopio'
    AND momento >= '2026-03-20'
    AND abs(valor) > 1
  ORDER BY momento
  LIMIT 5;
solution: |
  WITH fuera AS (
    SELECT robot_id, momento, valor,
           ROW_NUMBER() OVER (PARTITION BY robot_id ORDER BY momento) AS vez
    FROM lecturas
    WHERE sensor = 'giroscopio'
      AND momento >= '2026-03-20'
      AND abs(valor) > 1
  )
  SELECT r.nombre, f.momento, f.valor
  FROM fuera AS f
  JOIN robots AS r ON r.id = f.robot_id
  WHERE f.vez = 1;
answer: Pituco
answerLabel: ¿Qué robot se descalibró otra noche?
reveal: |
  **Pituco.** Tika (1.81) y Kusi (−1.58) se descalibran a las **03:02 y 03:04 del martes 24**, justo después de la calibración de las 03:00; Pituco (2.10), a las **03:08 del jueves 26**. Chasqui y Quilla nunca salen de rango. Fueron dos noches, y en las dos el daño aparece con la calibración. Alguien estuvo en la sala antes de las 03:00.
hints:
  - "`ROW_NUMBER() OVER (PARTITION BY robot_id ORDER BY momento)` numera las lecturas raras de cada robot; la primera es la 1."
  - "El primer `LIMIT 5` solo muestra a Tika y Kusi, porque tienen cientos de lecturas raras antes que Pituco. Por eso hace falta una por robot, no las primeras cinco."
```

## El juez

```exercise
id: sql9-juez-top3
type: judge
title: Las tres entregas más rápidas
prompt: |
  **Devuelve las tres entregas más rápidas de cada distrito: `distrito`, `robot` y `minutos`, ordenadas por distrito, luego por minutos y luego por robot.**

  La municipalidad premia a los robots de reparto más rápidos de cada distrito. Si dos entregas de un distrito tardaron lo mismo, va primero la del robot cuyo nombre va antes en el alfabeto, y solo entran tres por distrito aunque haya empates en el tercer puesto. Un distrito con menos de tres entregas sale con las que tenga.

  **Tabla:** `entregas(id, robot, distrito, minutos)`.

  **Resultado:** `distrito`, `robot`, `minutos`.
schema: |
  CREATE TABLE entregas (id INTEGER, robot TEXT, distrito TEXT, minutos INTEGER);
ordered: true
starter: |
  SELECT distrito, robot, minutos
  FROM entregas
  ORDER BY minutos
  LIMIT 3;
solution: |
  WITH ranking AS (
    SELECT distrito, robot, minutos,
           ROW_NUMBER() OVER (PARTITION BY distrito ORDER BY minutos, robot) AS puesto
    FROM entregas
  )
  SELECT distrito, robot, minutos
  FROM ranking
  WHERE puesto <= 3
  ORDER BY distrito, minutos, robot;
hints:
  - "`LIMIT 3` corta el resultado entero, no cada distrito. Numera dentro de cada distrito con `ROW_NUMBER() OVER (PARTITION BY distrito ORDER BY minutos, robot)`."
  - "`RANK` dejaría pasar a cuatro si hay empate en el tercer puesto; aquí entran tres."
samples:
  - rows:
      entregas: [[1, "Tika", "Surquillo", 18], [2, "Pituco", "Barranco", 25], [3, "Kusi", "Surquillo", 12], [4, "Quilla", "Surquillo", 30], [5, "Wayra", "Surquillo", 15], [6, "Chasqui", "Barranco", 22]]
    note: "Surquillo tiene cuatro entregas y queda fuera la de 30 minutos. Barranco solo tiene dos."
  - rows:
      entregas: [[1, "Tika", "Lince", 20], [2, "Kusi", "Lince", 20], [3, "Pituco", "Lince", 20], [4, "Chasqui", "Lince", 20]]
    note: "Cuatro empatados: entran Chasqui, Kusi y Pituco, por orden alfabético."
edge:
  - rows: { entregas: [] }
    tag: sin entregas
  - rows: { entregas: [[1, "Tika", "Rímac", 9]] }
    tag: con un solo distrito y una sola entrega
  - rows: { entregas: [[1, "Tika", "Ate", 40], [2, "Tika", "Ate", 10], [3, "Tika", "Ate", 25], [4, "Tika", "Ate", 10]] }
    tag: con un robot que hizo varias entregas en el mismo distrito
random:
  count: 40
  seed: 909
  generate: |
    const bots = ["Chasqui", "Wayra", "Tika", "Kusi", "Quilla", "Pituco", "Illa", "Sumaq"];
    const ds = ["Surquillo", "Barranco", "Miraflores", "Lince", "Rímac"];
    const n = rng.int(0, 25);
    const rows = [];
    for (let i = 0; i < n; i++) rows.push([i + 1, rng.pick(bots), rng.pick(ds), rng.int(5, 30)]);
    return { entregas: rows };
wrong:
  - |
    SELECT distrito, robot, minutos FROM entregas ORDER BY distrito, minutos, robot LIMIT 3;
  - |
    WITH r AS (SELECT distrito, robot, minutos, RANK() OVER (PARTITION BY distrito ORDER BY minutos) AS p FROM entregas) SELECT distrito, robot, minutos FROM r WHERE p <= 3 ORDER BY distrito, minutos, robot;
  - |
    WITH r AS (SELECT distrito, robot, minutos, ROW_NUMBER() OVER (PARTITION BY distrito ORDER BY minutos DESC, robot) AS p FROM entregas) SELECT distrito, robot, minutos FROM r WHERE p <= 3 ORDER BY distrito, minutos, robot;
  - |
    WITH r AS (SELECT distrito, robot, minutos, ROW_NUMBER() OVER (ORDER BY minutos, robot) AS p FROM entregas) SELECT distrito, robot, minutos FROM r WHERE p <= 3 ORDER BY distrito, minutos, robot;
```

## Misión final

```exercise
id: sql9-mision-ultimo
type: mission
title: El último antes de las tres
prompt: |
  **Para cada noche del 16 al 28 de marzo, encuentra la última entrada a la sala antes de las 03:00, la hora de la calibración: `dia`, `hora`, `tarjeta` y el `nombre` de la persona a la que pertenece la tarjeta, ordenado por día.** Después di a nombre de quién está la tarjeta que entró en la madrugada del martes 24, la última antes de las 03:00.

  Las entradas son las filas de `accesos` con `sentido = 'entrada'`; "antes de las 03:00" es `time(momento) < '03:00'`. Una noche se cuenta por la fecha de su madrugada: la entrada de la 01:38 del martes 24 es del día 24. Ojo con el nombre: es el de la persona a la que se le dio la tarjeta, no necesariamente quien la usó.

  Cuando la consulta lo pruebe y respondas, junto con el juez, se abre la sesión 10.
visual:
  - escenario:
      case: sensores
  - ventana:
      title: Una partición por noche, de la más tarde a la más temprana
      table:
        cols: [dia, hora, tarjeta]
        rows:
          - ["23", "00:02", "T-0412"]
          - ["23", "04:01", "T-0412"]
          - ["24", "00:03", "T-0533"]
          - ["24", "01:38", "T-0412"]
          - ["24", "04:03", "T-0533"]
      partition: dia
      order: hora
      desc: true
      fn: row_number
      as: puesto
      caption: "Las de las 04:00 también se numeran, pero el `WHERE` de tu consulta las saca antes."
starter: |
  SELECT tarjeta, persona_id, momento
  FROM accesos
  WHERE sentido = 'entrada'
  ORDER BY momento DESC
  LIMIT 1;
solution: |
  WITH noche AS (
    SELECT tarjeta, persona_id, momento,
           ROW_NUMBER() OVER (PARTITION BY date(momento) ORDER BY momento DESC) AS puesto
    FROM accesos
    WHERE sentido = 'entrada'
      AND time(momento) < '03:00'
  )
  SELECT date(n.momento) AS dia, time(n.momento) AS hora, n.tarjeta, p.nombre
  FROM noche AS n
  JOIN personas AS p ON p.id = n.persona_id
  WHERE n.puesto = 1
  ORDER BY dia;
answer: Wilmer Zevallos Benavides
answerLabel: ¿A nombre de quién está la tarjeta que entró el 24?
reveal: |
  **Wilmer Zevallos Benavides**, el vigilante. Casi todas las noches la última entrada antes de las 03:00 es su ronda de medianoche (00:02 a 00:06). Pero el **24 a la 01:38** y el **26 a la 01:52** entra su tarjeta **T-0412**, y esas son justo las madrugadas del sabotaje. Hay algo raro: desde el 24 sus rondas las hace con otra tarjeta, la **T-0533**. Kiara y Yesenia nunca entran de noche. ¿Por qué Wilmer tiene dos tarjetas? En la sesión 10, cuánto duró cada visita.
hints:
  - "La partición es la noche: `PARTITION BY date(momento)`. Y la última es la primera si ordenas `ORDER BY momento DESC` dentro de la ventana."
  - "Filtra `sentido = 'entrada'` y la hora en el `WHERE` de adentro (corre antes que la ventana) y `puesto = 1` en la consulta de afuera; ahí haz el `JOIN` con `personas`."
tests:
  - name: una fila por noche, con día, hora, tarjeta y nombre, en orden
    same: WITH x AS (SELECT tarjeta, persona_id, momento, ROW_NUMBER() OVER (PARTITION BY date(momento) ORDER BY momento DESC) AS p FROM accesos WHERE sentido = 'entrada' AND time(momento) < '03:00') SELECT date(x.momento), time(x.momento), x.tarjeta, pe.nombre FROM x JOIN personas AS pe ON pe.id = x.persona_id WHERE x.p = 1 ORDER BY 1
    ordered: true
  - name: columnas dia, hora, tarjeta y nombre
    columns: [dia, hora, tarjeta, nombre]
  - name: usa una función de ventana
    source: '\bOVER\s*\('
```

## Reto experto

```exercise
id: sql9-reto-inestable
type: challenge
title: El más inestable de cada día
prompt: |
  **Para cada día del 20 al 28 de marzo, lista el robot (o los robots, si empatan) con la lectura de giroscopio más lejos de cero de ese día: `dia`, `robot` (su nombre) y `maxima` (el mayor valor absoluto del día).** Ordena por día y robot.

  Para quien ya programa: una ventana puede ir encima de un `GROUP BY`, porque corre después. `RANK() OVER (PARTITION BY … ORDER BY max(abs(valor)) DESC)` ordena los grupos ya calculados; con `RANK`, los empatados comparten el 1.
starter: |
  SELECT date(momento) AS dia, robot_id, max(abs(valor)) AS maxima
  FROM lecturas
  WHERE sensor = 'giroscopio' AND momento >= '2026-03-20'
  GROUP BY dia, robot_id;
solution: |
  WITH diario AS (
    SELECT date(l.momento) AS dia, r.nombre AS robot, max(abs(l.valor)) AS maxima,
           RANK() OVER (PARTITION BY date(l.momento) ORDER BY max(abs(l.valor)) DESC) AS puesto
    FROM lecturas AS l
    JOIN robots AS r ON r.id = l.robot_id
    WHERE l.sensor = 'giroscopio' AND l.momento >= '2026-03-20'
    GROUP BY dia, r.nombre
  )
  SELECT dia, robot, maxima
  FROM diario
  WHERE puesto = 1
  ORDER BY dia, robot;
hints:
  - "Del 20 al 23 los empates en 0.07 o 0.08 son normales: son ruido. Desde el 24 manda uno solo."
tests:
  - name: el más inestable de cada día, con empates
    same: WITH d AS (SELECT date(l.momento) AS dia, r.nombre AS robot, max(abs(l.valor)) AS m, RANK() OVER (PARTITION BY date(l.momento) ORDER BY max(abs(l.valor)) DESC) AS p FROM lecturas AS l JOIN robots AS r ON r.id = l.robot_id WHERE l.sensor = 'giroscopio' AND l.momento >= '2026-03-20' GROUP BY dia, r.nombre) SELECT dia, robot, m FROM d WHERE p = 1 ORDER BY dia, robot
    ordered: true
  - name: columnas dia, robot y maxima
    columns: [dia, robot, maxima]
```
