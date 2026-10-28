# Sesión 14 — El planificador y los joins por dentro

```session
case: frio
```

## El encargo

Martes 31 de marzo, en la noche. Haydée vuelve a Loop. En la pizarra hay dos relevos desde la misma casa, **4417825**, y una cerrajería de cajas fuertes a la que esa casa llamó cinco veces. La guía de 1998 dice que el teléfono estaba a nombre de **Gloria Tello de Salazar**, que no trabajaba en la fábrica: para saber quién del equipo vivía en esa casa hay que cruzar la guía con la **planilla**, que sí guarda el teléfono de cada empleado.

"Eso no basta", dice Haydée. "A mi papá lo condenaron con menos, pero yo no quiero hacerle a nadie lo que le hicieron a él." Tiene razón: la prueba tiene que ser **una sola consulta** que cruce todo a la vez: quién conocía la combinación (el árbol de la sesión 12), los relevos (la sesión 13) y la planilla. Cuatro tablas, dos de ellas enormes.

Cuando escribes un `JOIN`, no dices **cómo** juntar las filas: eso lo decide el **planificador** de SQLite, la parte que lee tu consulta y elige un plan entre muchos posibles. Hoy aprendes cómo elige, qué hace cuando no hay índice y cómo lo hacen otros motores.

```escenario
case: frio
title: Lo que queda por probar
caption: "La caseta, la puerta lateral y el teléfono público de enfrente. Falta probar, en una sola consulta, que esa casa hizo los relevos."
```

```expediente
title: Lo que dice la guía de 1998
cards:
  - name: Gloria Tello de Salazar
    traits: { style: bun, hair: "#1f1712", shirt: "#c49a3f" }
    role: Titular del teléfono 4417825
    rows: [["Dirección", "Calle Los Geranios 145, San Borja"], ["Tipo", "casa"]]
    quote: "(No declaró en 1998: nadie le preguntó.)"
  - name: Cerrajería El Candado
    kind: note
    role: Teléfono 4256641
    rows: [["Dirección", "Jr. Huánuco 1290, La Victoria"], ["Rubro", "cajas fuertes y llaves"]]
```

```figura
title: "Los teléfonos del caso"
table:
  head: ["número", "quién", "dónde"]
  rows:
    - ["4723310", "Teléfono público", "Av. México, frente a la fábrica"]
    - ["4721093", "Caseta de la fábrica", "donde Teodoro hacía la guardia"]
    - ["2715504", "Casa de Teodoro Llanos", "el vigilante"]
    - ["4417825", "Casa de Víctor Salazar", "empleado 318, supervisor de caja"]
    - ["4402216", "Casa de Rosa Ugarte", "empleada 214, jefa de Tesorería"]
    - ["2741958", "Casa de Nilton Palomino", "empleado 405, cajero"]
    - ["4256641", "Cerrajería El Candado", "Jr. Huánuco 1290, cajas fuertes y llaves"]
  by:
    - null
    - null
    - null
    - "sql13-caso-cerrajeria"
    - "sql13-caso-cerrajeria"
    - "sql13-caso-cerrajeria"
    - "sql13-caso-cerrajeria"
```

```figura
title: "La noche del robo, en orden"
timeline:
  - when: "Mar 15"
    title: "Rosa Ugarte cambia la combinación"
    text: "Solo ella y los 11 que dependen de ella la saben."
    by: "sql12-caso-combinacion"
  - when: "Mar 15 · 23:21"
    title: "Un primer relevo"
    text: "Una casa llama al público y, cinco minutos después, el público llama a la caseta."
    by: "sql13-mision-relevo"
  - when: "Vie 18 · 22:58"
    title: "La casa 4417825 llama a la cerrajería"
    text: "La quinta vez en diciembre."
    by: "sql13-caso-cerrajeria"
  - {"when": "23:36", "title": "La casa 4417825 llama al teléfono público", "by": "sql13-mision-relevo"}
  - when: "23:41"
    title: "El público llama a la caseta"
    text: "Dice ser un técnico enviado por la señora Ugarte."
  - when: "Sin hora"
    title: "Teodoro abre la puerta lateral"
    text: "El expediente no dice a qué hora."
  - when: "Sin hora"
    title: "Se abre la caja fuerte con la combinación"
    text: "Se llevan S/ 412 000."
  - when: "Sáb 19 · 00:52"
    title: "La caseta llama a Rosa y nadie contesta"
    text: "Dos llamadas, 00:52 y 00:55, de 0 segundos: Teodoro decía la verdad."
    by: "sql14-caso-caseta"
    now: true
  - when: "Cierre"
    title: "Quien organizó la llamada"
    text: "Víctor Salazar: su casa hizo los dos relevos."
    by: "sql14-mision-culpable"
    now: true
```

## Lo mínimo

**Un JOIN en SQLite es un bucle dentro de otro.** Para `A JOIN B ON …`, SQLite toma una fila de la tabla de **afuera** y busca sus parejas en la de **adentro**; luego la siguiente fila de afuera, y así. Es el *nested loop* que viste en la sesión 5. Lo que decide si tarda 1 milisegundo o 10 segundos es **qué tabla va afuera** y **cómo se busca adentro**.

```algoritmo
title: "Bucle anidado: cada fila de afuera recorre toda la de adentro"
algo: nested
on: [destino, numero]
left: { name: llamadas, cols: [id, destino], rows: [[1, "4256641"], [2, "4723310"], [3, "4402216"], [4, "4256641"], [5, "4999999"], [6, "4721093"]] }
right: { name: telefonos, cols: [numero, titular], rows: [["4721093", "Caseta"], ["4256641", "El Candado"], ["4402216", "Rosa Ugarte"], ["4723310", "Público"], ["4417825", "Gloria Tello"]] }
caption: "6 filas afuera por 5 adentro: 30 comparaciones. Con 60 000 llamadas y 5000 teléfonos serían 300 millones."
```

**El orden lo elige el planificador, no tú.** Escribir las tablas al revés no cambia el plan: SQLite estima el costo de cada orden posible y se queda con el más barato. Para estimar usa lo que sabe: qué índices hay, qué columnas fija el `WHERE` y, si se lo diste, cuántas filas tiene cada tabla. Aquí el empleado 318 es **una** fila (se busca por su `id`), así que va afuera, y adentro se buscan sus llamadas por `origen`:

```plan
title: "empleados_1998 afuera: 1 fila; llamadas_1998 adentro, con índice"
setup: CREATE INDEX idx_llamadas_origen ON llamadas_1998(origen);
query: |
  SELECT e.nombre, l.inicio, l.destino
  FROM llamadas_1998 AS l
  JOIN empleados_1998 AS e ON l.origen = e.telefono
  WHERE e.id = 318;
caption: "Se escribió `llamadas_1998` primero, pero el plan empieza por `e`. La primera línea del plan es el bucle de afuera."
```

```figura
title: El mismo JOIN, dos órdenes posibles
panes:
  - label: "afuera e (1 fila), adentro l con índice"
    value: "1 × ~4 páginas"
  - label: "afuera l (60 000 filas), adentro e por id"
    value: "60 000 × 3 páginas"
```

**Sin índice, SQLite fabrica uno.** Si adentro no hay índice útil y el bucle de afuera tiene muchas filas, SQLite puede armar un **índice automático**: recorre la tabla de adentro una vez, construye un B-tree temporal con la columna del `ON` y lo usa para cada fila de afuera. Al terminar la consulta lo bota. En el plan dice `AUTOMATIC`:

```plan
title: "Un índice automático, armado para esta consulta y botado después"
query: |
  SELECT e.nombre, l.inicio
  FROM llamadas_1998 AS l
  JOIN empleados_1998 AS e ON l.origen = e.telefono
  WHERE l.inicio >= '1998-12-18 23:00';
```

Es una buena salida de emergencia, pero se paga **en cada ejecución**: leer la tabla entera y ordenarla. Por eso la caminata de la sesión 12 con `aristas` no se colgó en todo diciembre (SQLite indexó `aristas` sola) y la versión con `OR` sí: un `OR` entre dos columnas ni siquiera puede usar un índice automático.

**Otros motores tienen más algoritmos.** SQLite solo hace bucles anidados (con índice, con índice automático o sin nada). PostgreSQL, MySQL 8 y SQL Server además tienen:

- **Hash join**: recorre la tabla chica una vez y la reparte en **baldes** según una función hash de la clave; después cada fila de la grande calcula su balde y compara **solo** con lo que hay ahí. Ideal para juntar tablas grandes sin índice por igualdad.
- **Merge join**: si las dos tablas están **ordenadas** por la clave (por un índice o después de ordenarlas), avanza con un dedo en cada una, como quien junta dos listas ordenadas. Cada fila se mira casi una sola vez.

```algoritmo
title: "Hash join (PostgreSQL): construir los baldes, luego buscar"
algo: hash
buckets: 3
on: [destino, numero]
left: { name: llamadas, cols: [id, destino], rows: [[1, "4256641"], [2, "4723310"], [3, "4402216"], [4, "4256641"], [5, "4999999"], [6, "4721093"]] }
right: { name: telefonos, cols: [numero, titular], rows: [["4721093", "Caseta"], ["4256641", "El Candado"], ["4402216", "Rosa Ugarte"], ["4723310", "Público"], ["4417825", "Gloria Tello"]] }
```

```algoritmo
title: "Merge join (PostgreSQL): dos listas ordenadas, un dedo en cada una"
algo: merge
on: [destino, numero]
left: { name: llamadas, cols: [id, destino], rows: [[1, "4256641"], [2, "4723310"], [3, "4402216"], [4, "4256641"], [5, "4999999"], [6, "4721093"]] }
right: { name: telefonos, cols: [numero, titular], rows: [["4721093", "Caseta"], ["4256641", "El Candado"], ["4402216", "Rosa Ugarte"], ["4723310", "Público"], ["4417825", "Gloria Tello"]] }
```

En PostgreSQL, `EXPLAIN` muestra `Hash Join`, `Merge Join` o `Nested Loop`, y el planificador elige entre los tres según sus estadísticas.

**Ordenar y agrupar también cuesta.** Si el `ORDER BY` o el `GROUP BY` no coinciden con el orden de un índice, SQLite arma un **B-tree temporal** para ordenar: en el plan, `USE TEMP B-TREE`. Con un índice que ya trae las filas en ese orden, se lo ahorra:

```plan
title: "Agrupar sin índice: dos árboles temporales"
query: |
  SELECT origen, count(*) AS veces
  FROM llamadas_1998
  WHERE destino = '4721093'
  GROUP BY origen
  ORDER BY origen;
```

```plan
title: "Con el índice (destino, origen): ya vienen agrupadas y en orden"
setup: CREATE INDEX idx_llamadas_destino_origen ON llamadas_1998(destino, origen);
query: |
  SELECT origen, count(*) AS veces
  FROM llamadas_1998
  WHERE destino = '4721093'
  GROUP BY origen
  ORDER BY origen;
```

**ANALYZE: darle números al planificador.** Sin estadísticas, SQLite supone que cualquier índice por igualdad deja pocas filas. Con dos índices posibles, puede elegir mal. `ANALYZE` recorre las tablas y guarda en `sqlite_stat1` cuántas filas hay y cuántas trae, en promedio, cada valor de cada índice:

```plan
title: "Antes de ANALYZE: elige el índice por tipo"
setup: |
  CREATE INDEX idx_telefonos_distrito ON telefonos_1998(distrito);
  CREATE INDEX idx_telefonos_tipo ON telefonos_1998(tipo);
query: |
  SELECT numero FROM telefonos_1998
  WHERE tipo = 'casa' AND distrito = 'Breña';
```

```plan
title: "Después de ANALYZE: sabe que tipo = 'casa' trae miles de filas"
setup: |
  CREATE INDEX idx_telefonos_distrito ON telefonos_1998(distrito);
  CREATE INDEX idx_telefonos_tipo ON telefonos_1998(tipo);
  ANALYZE;
query: |
  SELECT numero FROM telefonos_1998
  WHERE tipo = 'casa' AND distrito = 'Breña';
```

```sql run
CREATE INDEX idx_telefonos_distrito ON telefonos_1998(distrito);
CREATE INDEX idx_telefonos_tipo ON telefonos_1998(tipo);
ANALYZE;
SELECT idx, stat FROM sqlite_stat1
WHERE tbl = 'telefonos_1998';
```

`'5135 1712'` se lee: 5135 filas en la tabla; cada valor de `tipo` trae, en promedio, 1712. El de `distrito`, unas 257. El planificador prefiere el más selectivo.

**Medir.** El plan dice **qué** hará; para saber **cuánto** tarda hay que medir con datos reales. En la consola de SQLite, `.timer on` antes de la consulta. En PostgreSQL, `EXPLAIN ANALYZE` corre la consulta y anota en cada paso las filas reales y los milisegundos. La regla: mide, cambia **una** cosa (un índice, `ANALYZE`, una condición reescrita), vuelve a medir.

> **Trampa común:** reordenar las tablas en el `FROM` "para que vaya más rápido" no hace nada: el planificador las reordena igual. Lo que cambia el plan es darle **opciones** (un índice que sirva a la condición) e **información** (`ANALYZE` después de cargar o cambiar muchos datos). Si de verdad quieres imponer el orden, SQLite respeta el orden escrito con `CROSS JOIN`; casi nunca hace falta, y si los datos cambian, el plan forzado se queda viejo.

<!-- legacy: join-hints -->

<!-- mdn: join-hints -->

## Práctica

```exercise
id: sql14-predice-orden
type: predict
title: El orden escrito no cambia nada
prompt: |
  ¿Qué devuelve?
code: |
  SELECT
    (SELECT count(*) FROM empleados_1998 AS e
     JOIN llamadas_1998 AS l ON l.origen = e.telefono
     WHERE e.id = 318),
    (SELECT count(*) FROM llamadas_1998 AS l
     JOIN empleados_1998 AS e ON l.origen = e.telefono
     WHERE e.id = 318);
options:
  - "12 | 12"
  - "12 | 60090"
  - "1 | 12"
  - "12 | 0"
answer: "12 | 12"
explain: |
  Un `INNER JOIN` es simétrico: el orden en que escribes las tablas no cambia el resultado, y tampoco el plan, porque el planificador elige el orden por su cuenta. La casa de Víctor hizo 12 llamadas en diciembre.
```

```exercise
id: sql14-predice-estadistica
type: predict
title: Lo que guarda ANALYZE
prompt: |
  `telefonos_1998` tiene 5135 filas y `tipo` toma tres valores: `'casa'`, `'negocio'` y `'público'`. ¿Qué devuelve?
code: |
  CREATE INDEX idx_telefonos_tipo ON telefonos_1998(tipo);
  ANALYZE;
  SELECT stat FROM sqlite_stat1
  WHERE idx = 'idx_telefonos_tipo';
options:
  - "5135 1712"
  - "5135 3"
  - "3 1712"
  - "5135"
answer: "5135 1712"
explain: |
  El primer número es cuántas filas tiene la tabla; el segundo, cuántas filas trae en promedio un valor del índice: 5135 / 3, redondeado hacia arriba. Con eso el planificador sabe que `tipo = 'casa'` no filtra casi nada.
```

```exercise
id: sql14-completa-orden
type: complete
title: Sin ordenar aparte
prompt: |
  Lista las 5 últimas llamadas que recibió la caseta `'4721093'` en diciembre (`inicio` y `origen`), de la más reciente a la más antigua. Crea el índice que haga que el plan **no** necesite un `TEMP B-TREE` para ordenar. Reemplaza los `___`.
visual:
  plan:
    title: Hoy
    query: SELECT inicio, origen FROM llamadas_1998 WHERE destino = '4721093' ORDER BY inicio DESC LIMIT 5;
starter: |
  CREATE INDEX idx_llamadas_destino_inicio ON llamadas_1998(___, ___);

  SELECT inicio, origen
  FROM llamadas_1998
  WHERE destino = '4721093'
  ORDER BY inicio DESC
  LIMIT 5;
solution: |
  CREATE INDEX idx_llamadas_destino_inicio ON llamadas_1998(destino, inicio);

  SELECT inicio, origen
  FROM llamadas_1998
  WHERE destino = '4721093'
  ORDER BY inicio DESC
  LIMIT 5;
hints:
  - "Primero la columna que fija el `WHERE`; después la del `ORDER BY`. Un índice se puede leer al revés, así que `DESC` no necesita otro."
tests:
  - name: las cinco últimas, en orden
    same: SELECT inicio, origen FROM llamadas_1998 WHERE destino = '4721093' ORDER BY inicio DESC LIMIT 5
    ordered: true
  - name: no ordena aparte
    planNot: 'TEMP B-TREE'
  - name: busca con el índice
    plan: 'SEARCH llamadas_1998 USING INDEX'
```

```exercise
id: sql14-arregla-cross
type: fix
title: El orden forzado
prompt: |
  Ya hay un índice por `origen`. Alguien escribió `CROSS JOIN` "para que vaya más rápido", y eso obliga a SQLite a poner `llamadas_1998` afuera: recorre las 60 000 llamadas. Arréglala para que el planificador elija: el plan debe empezar buscando al empleado 318 por su `id` y luego buscar sus llamadas con el índice. El resultado no cambia.
setup: CREATE INDEX idx_llamadas_origen ON llamadas_1998(origen);
visual:
  plan:
    title: El plan forzado
    setup: CREATE INDEX idx_llamadas_origen ON llamadas_1998(origen);
    query: SELECT e.nombre, l.inicio, l.destino FROM llamadas_1998 AS l CROSS JOIN empleados_1998 AS e WHERE l.origen = e.telefono AND e.id = 318 ORDER BY l.inicio;
starter: |
  SELECT e.nombre, l.inicio, l.destino
  FROM llamadas_1998 AS l
  CROSS JOIN empleados_1998 AS e
  WHERE l.origen = e.telefono AND e.id = 318
  ORDER BY l.inicio;
solution: |
  SELECT e.nombre, l.inicio, l.destino
  FROM llamadas_1998 AS l
  JOIN empleados_1998 AS e ON l.origen = e.telefono
  WHERE e.id = 318
  ORDER BY l.inicio;
hints:
  - "Un `JOIN … ON` normal deja que el planificador elija el orden."
tests:
  - name: las mismas filas, en orden
    same: SELECT e.nombre, l.inicio, l.destino FROM llamadas_1998 l JOIN empleados_1998 e ON l.origen = e.telefono WHERE e.id = 318 ORDER BY l.inicio
    ordered: true
  - name: empieza por el empleado y busca sus llamadas con el índice
    plan: '^SEARCH e USING INTEGER PRIMARY KEY.* · SEARCH l USING INDEX'
```

```exercise
id: sql14-escribe-agrupa
type: write
title: Quién llamó a la caseta, sin árboles temporales
prompt: |
  Cuenta cuántas veces llamó cada número a la caseta `'4721093'` en diciembre: columnas `origen` y `veces`, ordenado por `origen`. Crea **un** índice para que el plan no use ningún `TEMP B-TREE` (ni para agrupar ni para ordenar).
starter: |
  SELECT origen, count(*) AS veces
  FROM llamadas_1998
  WHERE destino = '4721093'
  GROUP BY origen
  ORDER BY origen;
solution: |
  CREATE INDEX idx_llamadas_destino_origen ON llamadas_1998(destino, origen);

  SELECT origen, count(*) AS veces
  FROM llamadas_1998
  WHERE destino = '4721093'
  GROUP BY origen
  ORDER BY origen;
hints:
  - "Dentro de un mismo `destino`, el índice `(destino, origen)` trae las filas ordenadas por `origen`: agruparlas es contarlas mientras pasan."
tests:
  - name: cuántas veces llamó cada número
    same: SELECT origen, count(*) FROM llamadas_1998 WHERE destino = '4721093' GROUP BY origen ORDER BY origen
    ordered: true
  - name: columnas origen y veces
    columns: [origen, veces]
  - name: sin árboles temporales
    planNot: 'TEMP B-TREE'
```

```exercise
id: sql14-escribe-analyze
type: write
title: Darle estadísticas
prompt: |
  Crea dos índices en `telefonos_1998`, uno por `distrito` y otro por `tipo`, y haz que la consulta de los teléfonos de casa en Breña (`numero`, en orden) use el índice **por distrito**, que es el que filtra más. No cambies la consulta: dale al planificador lo que le falta.
starter: |
  CREATE INDEX idx_telefonos_distrito ON telefonos_1998(distrito);
  CREATE INDEX idx_telefonos_tipo ON telefonos_1998(tipo);

  SELECT numero FROM telefonos_1998
  WHERE tipo = 'casa' AND distrito = 'Breña'
  ORDER BY numero;
solution: |
  CREATE INDEX idx_telefonos_distrito ON telefonos_1998(distrito);
  CREATE INDEX idx_telefonos_tipo ON telefonos_1998(tipo);
  ANALYZE;

  SELECT numero FROM telefonos_1998
  WHERE tipo = 'casa' AND distrito = 'Breña'
  ORDER BY numero;
hints:
  - "Sin estadísticas, SQLite cree que los dos índices filtran igual. Una sola palabra, entre los índices y la consulta."
tests:
  - name: los teléfonos de casa en Breña
    same: SELECT numero FROM telefonos_1998 WHERE tipo = 'casa' AND distrito = 'Breña' ORDER BY numero
    ordered: true
  - name: usa el índice por distrito
    plan: 'INDEX idx_telefonos_distrito'
```

## El caso

```exercise
id: sql14-caso-caseta
type: case
title: La llamada que nadie contestó
prompt: |
  **¿A quién llamó la caseta después de que el técnico se fue (entre las 00:40 y las 06:00 del sábado 19)?** Escribe el nombre completo de la persona.

  En 1998 nadie verificó esta parte de la declaración de Teodoro. Lista las llamadas que **salieron** de la caseta `'4721093'` en esa ventana, con el titular del número en `telefonos_1998` y, si es de alguien de la planilla, su nombre en `empleados_1998`. Antes de correrla, mira el plan con `EXPLAIN QUERY PLAN`: ¿qué tabla va afuera?
visual:
  - escenario:
      case: frio
  - esquema:
      tables: [llamadas_1998, telefonos_1998, empleados_1998]
starter: |
  -- Lo que dijo Teodoro
  SELECT texto
  FROM declaraciones_1998
  WHERE empleado_id = 590;
solution: |
  SELECT l.inicio, l.destino, l.duracion_s, t.titular, e.nombre, e.cargo
  FROM llamadas_1998 AS l
  LEFT JOIN telefonos_1998 AS t ON t.numero = l.destino
  LEFT JOIN empleados_1998 AS e ON e.telefono = l.destino
  WHERE l.origen = '4721093'
    AND l.inicio >= '1998-12-19 00:40'
    AND l.inicio < '1998-12-19 06:00'
  ORDER BY l.inicio;
answer: Rosa Ugarte Bustamante
answerLabel: ¿A quién llamó la caseta? (nombre completo)
reveal: |
  **Rosa Ugarte Bustamante**, la jefa de Tesorería, a las **00:52** y a las **00:55**: dos llamadas de **0 segundos**. Nadie contestó, como dijeron Teodoro ("nadie contestó") y Rosa ("no escuché el teléfono"). Teodoro decía la verdad, y llamó justo a quien el impostor había nombrado. Rosa queda descartada: su casa no hizo ninguna llamada esa noche. En el plan, `l` va afuera (filtrada por `origen` y la hora) y `t` y `e` se buscan adentro, con índices automáticos.
hints:
  - "`WHERE l.origen = '4721093' AND l.inicio >= '1998-12-19 00:40' AND l.inicio < '1998-12-19 06:00'`."
  - "`LEFT JOIN telefonos_1998 AS t ON t.numero = l.destino` y otro `LEFT JOIN` a `empleados_1998` por `telefono`."
```

## El juez

Como siempre, bases ocultas. Aquí hay números con varias llamadas a la misma hora exacta: lee bien cómo se desempata.

```exercise
id: sql14-juez-ultima
type: judge
title: La última llamada de cada número
prompt: |
  **Devuelve, para cada número que hizo llamadas, su última llamada: `origen`, `inicio` y `destino`. Ordena por `origen`.** Si un número tiene varias llamadas a la misma hora, y esa hora es la más reciente, la última es la de **mayor `id`**.

  La forma ingenua es una subconsulta correlacionada que, para cada fila, vuelve a buscar el máximo de su número: una búsqueda por fila. Escríbela con **`JOIN`** y **`GROUP BY`** (agrupando una vez), como le gusta al planificador. Los `id` no van en orden de tiempo.

  **Tabla:** `llamadas(id, origen, destino, inicio)`, con `id` único.

  **Resultado:** `origen`, `inicio`, `destino`, ordenado por `origen`.
schema: |
  CREATE TABLE llamadas (id INTEGER, origen TEXT, destino TEXT, inicio TEXT);
ordered: true
starter: |
  SELECT origen, MAX(inicio)
  FROM llamadas
  GROUP BY origen
  ORDER BY origen;
solution: |
  WITH ultima AS (
    SELECT origen, MAX(inicio) AS inicio
    FROM llamadas
    GROUP BY origen
  ),
  elegida AS (
    SELECT l.origen, MAX(l.id) AS id
    FROM llamadas AS l
    JOIN ultima AS u ON u.origen = l.origen AND u.inicio = l.inicio
    GROUP BY l.origen
  )
  SELECT l.origen, l.inicio, l.destino
  FROM llamadas AS l
  JOIN elegida AS e ON e.id = l.id
  ORDER BY l.origen;
hints:
  - "Primero, con `GROUP BY origen`, el `MAX(inicio)` de cada número. Después, un `JOIN` con la tabla para quedarte con las filas que tienen ese máximo."
  - "Si hay empate, agrupa otra vez y toma `MAX(id)`; al final, un `JOIN` por `id` trae el `destino`."
tests:
  - name: usa JOIN
    source: '\bJOIN\b'
    msg: Junta el máximo de cada número con la tabla usando JOIN.
  - name: usa GROUP BY
    source: '\bGROUP\s+BY\b'
samples:
  - rows:
      llamadas: [[1, "100", "200", "1998-12-18 22:58:26"], [2, "100", "300", "1998-12-18 23:36:15"], [3, "200", "100", "1998-12-17 10:00:00"], [4, "300", "100", "1998-12-19 00:52:08"], [5, "300", "200", "1998-12-19 00:55:40"]]
    note: "La última de 100 es la de las 23:36; 200 solo tiene una; la de 300 es la de las 00:55."
  - rows:
      llamadas: [[8, "100", "400", "1998-12-18 23:41:02"], [9, "100", "500", "1998-12-18 23:41:02"], [3, "100", "600", "1998-12-18 20:00:00"]]
    note: "Dos llamadas a las 23:41:02: gana la de mayor id, la 9."
edge:
  - rows: { llamadas: [] }
    tag: sin llamadas
  - rows: { llamadas: [[1, "100", "200", "1998-12-18 10:00:00"], [7, "100", "300", "1998-12-18 10:00:00"], [4, "100", "400", "1998-12-18 10:00:00"]] }
    tag: con tres llamadas a la misma hora
  - rows: { llamadas: [[10, "100", "200", "1998-12-18 09:00:00"], [2, "100", "300", "1998-12-18 11:00:00"]] }
    tag: con el id mayor en la llamada más antigua
random:
  count: 40
  seed: 1414
  generate: |
    const nums = ["100", "200", "300", "400", "500"];
    const times = ["1998-12-18 09:00:00", "1998-12-18 12:30:00", "1998-12-18 23:41:02", "1998-12-19 00:52:08"];
    const n = rng.int(0, 14);
    const ids = [];
    while (ids.length < n) { const k = rng.int(1, 60); if (!ids.includes(k)) ids.push(k); }
    ids.sort((a, b) => a - b);
    return { llamadas: ids.map((id) => [id, rng.pick(nums), rng.pick(nums), rng.pick(times)]) };
wrong:
  - |
    SELECT origen, MAX(inicio), destino FROM llamadas GROUP BY origen ORDER BY origen;
  - |
    SELECT l.origen, l.inicio, l.destino FROM llamadas l JOIN (SELECT origen, MAX(inicio) AS m FROM llamadas GROUP BY origen) u ON u.origen = l.origen AND u.m = l.inicio ORDER BY l.origen;
  - |
    SELECT l.origen, l.inicio, l.destino FROM llamadas l JOIN (SELECT origen, MAX(id) AS id FROM llamadas GROUP BY origen) u ON u.id = l.id ORDER BY l.origen;
```

## Misión final

```exercise
id: sql14-mision-culpable
type: mission
title: Una sola consulta, todas las pruebas
prompt: |
  **Escribe la consulta que prueba quién organizó la llamada a la caseta: el empleado que conocía la combinación (el equipo de la 214) y cuyo teléfono de casa hizo los relevos de diciembre (alguien llama a un público y, en menos de 10 minutos, ese público llama a la caseta `'4721093'`).** Muestra `id`, `nombre`, `cargo` y `relevos` (cuántos hizo). Crea los índices que hagan falta: el plan tiene que **buscar con un índice tuyo**. Después escribe su nombre.

  Es todo lo que ya sabes, junto: un `WITH RECURSIVE` para el equipo, un autojoin para los relevos y dos `JOIN` a la planilla. El planificador decidirá el orden; tú dale el índice.
visual:
  - escenario:
      case: frio
  - esquema:
      tables: [empleados_1998, llamadas_1998, telefonos_1998]
  - figure:
      title: "La noche del robo, en orden"
      timeline:
        - when: "Mar 15"
          title: "Rosa Ugarte cambia la combinación"
          text: "Solo ella y los 11 que dependen de ella la saben."
          by: "sql12-caso-combinacion"
        - when: "Mar 15 · 23:21"
          title: "Un primer relevo"
          text: "Una casa llama al público y, cinco minutos después, el público llama a la caseta."
          by: "sql13-mision-relevo"
        - when: "Vie 18 · 22:58"
          title: "La casa 4417825 llama a la cerrajería"
          text: "La quinta vez en diciembre."
          by: "sql13-caso-cerrajeria"
        - {"when": "23:36", "title": "La casa 4417825 llama al teléfono público", "by": "sql13-mision-relevo"}
        - when: "23:41"
          title: "El público llama a la caseta"
          text: "Dice ser un técnico enviado por la señora Ugarte."
        - when: "Sin hora"
          title: "Teodoro abre la puerta lateral"
          text: "El expediente no dice a qué hora."
        - when: "Sin hora"
          title: "Se abre la caja fuerte con la combinación"
          text: "Se llevan S/ 412 000."
        - when: "Sáb 19 · 00:52"
          title: "La caseta llama a Rosa y nadie contesta"
          text: "Dos llamadas, 00:52 y 00:55, de 0 segundos: Teodoro decía la verdad."
          by: "sql14-caso-caseta"
          now: true
        - when: "Cierre"
          title: "Quien organizó la llamada"
          text: "Víctor Salazar: su casa hizo los dos relevos."
          by: "sql14-mision-culpable"
          now: true
starter: |
  WITH relevos AS (
    SELECT a.origen, a.inicio
    FROM llamadas_1998 AS a
    JOIN llamadas_1998 AS b
      ON b.origen = a.destino
     AND b.inicio BETWEEN a.inicio AND datetime(a.inicio, '+10 minutes')
    JOIN telefonos_1998 AS t ON t.numero = a.destino
    WHERE b.destino = '4721093' AND t.tipo = 'público'
  )
  SELECT origen, count(*) AS relevos
  FROM relevos
  GROUP BY origen;
solution: |
  CREATE INDEX idx_llamadas_destino_inicio ON llamadas_1998(destino, inicio);

  WITH RECURSIVE
    equipo(id) AS (
      SELECT id FROM empleados_1998 WHERE id = 214
      UNION ALL
      SELECT e.id FROM empleados_1998 AS e JOIN equipo AS q ON e.jefe_id = q.id
    ),
    relevos AS (
      SELECT a.origen, a.inicio
      FROM llamadas_1998 AS a
      JOIN llamadas_1998 AS b
        ON b.origen = a.destino
       AND b.inicio BETWEEN a.inicio AND datetime(a.inicio, '+10 minutes')
      JOIN telefonos_1998 AS t ON t.numero = a.destino
      WHERE b.destino = '4721093' AND t.tipo = 'público'
    )
  SELECT e.id, e.nombre, e.cargo, count(*) AS relevos
  FROM relevos AS r
  JOIN empleados_1998 AS e ON e.telefono = r.origen
  JOIN equipo AS q ON q.id = e.id
  GROUP BY e.id, e.nombre, e.cargo;
answer: Víctor Salazar Montes
answerLabel: ¿Quién organizó la llamada a la caseta? (nombre completo)
reveal: |
  **Víctor Salazar Montes**, supervisor de caja, empleado 318. Conocía la combinación nueva porque dependía de Rosa Ugarte. Desde su casa (a nombre de su esposa, Gloria Tello) llamó cinco veces a la **Cerrajería El Candado**, especialista en cajas fuertes, aunque juró no conocer a ningún cerrajero. Y las dos noches de los relevos, el martes 15 y el viernes 18, su casa llamó al teléfono público de la Av. México y, minutos después, ese teléfono llamó a la caseta para anunciar "al técnico de parte de la señora Ugarte".

  Teodoro Llanos decía la verdad. Haydée se lleva una copia de esta consulta, del plan y de la pizarra a la fiscalía: el robo prescribió hace años, pero el nombre de su papá no. **Expediente cerrado.**
hints:
  - "Copia el `relevos` del starter dentro de un `WITH RECURSIVE` que también tenga `equipo` (el árbol de la 214, sesión 12)."
  - "Une `relevos` con `empleados_1998` por `telefono = origen` y con `equipo` por `id`; agrupa y cuenta. Y antes de todo, `CREATE INDEX … ON llamadas_1998(destino, inicio)`."
tests:
  - name: el empleado del equipo que hizo los relevos
    same: WITH RECURSIVE q(id) AS (SELECT id FROM empleados_1998 WHERE id = 214 UNION ALL SELECT e.id FROM empleados_1998 e JOIN q ON e.jefe_id = q.id) SELECT e.id, e.nombre, e.cargo, count(*) FROM llamadas_1998 a JOIN llamadas_1998 b ON b.origen = a.destino AND b.inicio BETWEEN a.inicio AND datetime(a.inicio, '+10 minutes') JOIN telefonos_1998 t ON t.numero = a.destino JOIN empleados_1998 e ON e.telefono = a.origen JOIN q ON q.id = e.id WHERE b.destino = '4721093' AND t.tipo = 'público' GROUP BY e.id
  - name: columnas id, nombre, cargo y relevos
    columns: [id, nombre, cargo, relevos]
  - name: cruza el equipo con WITH RECURSIVE
    source: '\bWITH\s+RECURSIVE\b'
  - name: el plan busca con tu índice (no uno automático)
    plan: 'USING (COVERING )?INDEX'
    msg: Crea un índice con CREATE INDEX antes de la consulta.
```

## Reto experto

```exercise
id: sql14-reto-ultima
type: challenge
title: La última llamada de cada uno de los doce
prompt: |
  **Para cada una de las 12 personas que conocían la combinación, devuelve `nombre`, `telefono` y `ultima` (el `inicio` de la última llamada que hizo su casa en diciembre, o `NULL` si no tiene teléfono o no llamó), ordenado por `nombre`.** El plan tiene que buscar las llamadas con un índice por `origen`, no recorrerlas.

  Para quien ya programa: `LEFT JOIN` para no perder a quien no tiene teléfono, `MAX` agrupado y un índice que haga que cada uno de los doce sea una búsqueda, no un SCAN de 60 000 filas.
starter: |
  WITH RECURSIVE equipo(id) AS (
    SELECT id FROM empleados_1998 WHERE id = 214
    UNION ALL
    SELECT e.id FROM empleados_1998 AS e JOIN equipo AS q ON e.jefe_id = q.id
  )
  SELECT e.nombre, e.telefono
  FROM equipo AS q
  JOIN empleados_1998 AS e ON e.id = q.id
  ORDER BY e.nombre;
solution: |
  CREATE INDEX idx_llamadas_origen_inicio ON llamadas_1998(origen, inicio);

  WITH RECURSIVE equipo(id) AS (
    SELECT id FROM empleados_1998 WHERE id = 214
    UNION ALL
    SELECT e.id FROM empleados_1998 AS e JOIN equipo AS q ON e.jefe_id = q.id
  )
  SELECT e.nombre, e.telefono, MAX(l.inicio) AS ultima
  FROM equipo AS q
  JOIN empleados_1998 AS e ON e.id = q.id
  LEFT JOIN llamadas_1998 AS l ON l.origen = e.telefono
  GROUP BY e.id, e.nombre, e.telefono
  ORDER BY e.nombre;
hints:
  - "Con un índice `(origen, inicio)`, el `MAX(inicio)` de cada teléfono está al final de su tramo del índice."
tests:
  - name: la última llamada de cada uno
    same: WITH RECURSIVE q(id) AS (SELECT id FROM empleados_1998 WHERE id = 214 UNION ALL SELECT e.id FROM empleados_1998 e JOIN q ON e.jefe_id = q.id) SELECT e.nombre, e.telefono, (SELECT MAX(inicio) FROM llamadas_1998 WHERE origen = e.telefono) FROM q JOIN empleados_1998 e ON e.id = q.id ORDER BY e.nombre
    ordered: true
  - name: columnas nombre, telefono y ultima
    columns: [nombre, telefono, ultima]
  - name: busca las llamadas con un índice por origen
    plan: 'USING (COVERING )?INDEX \w+ \(origen=\?'
```
