# Sesión 13 — Por dentro: páginas, B-trees e índices

```session
case: frio
```

## El encargo

Martes 31 de marzo, a primera hora. Quedan tres nombres en la pizarra: **Víctor Salazar**, **Rosa Ugarte** y **Nilton Palomino**. Anoche Chasqui quiso ver con quién habló el teléfono público **en todo diciembre**, no solo la noche del robo. Copió la caminata de la sesión 12, le quitó el filtro de horas, la estiró a **cuatro** llamadas y, para no escribir las aristas, juntó los dos sentidos en una sola condición:

```sql
WITH RECURSIVE red(numero, saltos) AS (
  SELECT '4723310', 0
  UNION
  SELECT CASE WHEN l.origen = r.numero THEN l.destino ELSE l.origen END, r.saltos + 1
  FROM red AS r
  JOIN llamadas_1998 AS l ON r.numero IN (l.origen, l.destino)
  WHERE r.saltos < 4
)
SELECT count(*) FROM red;
```

La consulta **no termina**: tendría que leer unos 300 millones de filas, y el Taller corta toda consulta a los 4 segundos (en un computador rápido le faltaría más de medio minuto). Y no está mal escrita: el resultado sería correcto. El problema es **cómo** la ejecuta SQLite. Para entenderlo hay que abrir la base de datos y mirar cómo guarda las filas. Hoy aprendes qué es una página, por qué una tabla es un árbol y qué hace un índice.

```escenario
case: frio
title: Lo que sabemos hasta ahora
caption: "Las marcas se encienden a medida que resuelves los pasos del caso."
```

```expediente
title: Los tres que estaban cerca del teléfono público
cards:
  - name: Víctor Salazar Montes
    traits: { style: short, shirt: "#5b6b7a", vest: "#2f3a4a" }
    role: Supervisor de caja, a 1 llamada
    rows: [["Empleado", "318"]]
    quote: "No conozco a ningún cerrajero y nunca he llamado a uno."
  - name: Rosa Ugarte Bustamante
    traits: { style: bun, hair: "#7a7a7a", shirt: "#8a5cc4", glasses: true }
    role: Jefa de Tesorería, a 2 llamadas
    rows: [["Empleado", "214"]]
    quote: "Esa noche me fui a dormir temprano y no escuché el teléfono."
  - name: Nilton Palomino Ríos
    traits: { style: curly, shirt: "#3fa7a7" }
    role: Cajero, a 2 llamadas
    rows: [["Empleado", "405"]]
    quote: "Estuve en una pollada en Breña con mi enamorada."
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

**El archivo son páginas.** Una base de SQLite es un solo archivo cortado en **páginas** del mismo tamaño. SQLite lee y escribe páginas enteras, nunca filas sueltas: el costo de una consulta se mide en **cuántas páginas tiene que leer**.

```sql run
PRAGMA page_size;
```

<!-- photo: hdd-open-wd -->

Son 4096 bytes. Una llamada ocupa unos 50, así que caben unas 90 por página: `llamadas_1998` ocupa unas **680 páginas**.

**Una tabla es un B-tree ordenado por `id`.** Las páginas no están sueltas: forman un **árbol**. Las **hojas** guardan las filas, en orden de `id` (el `rowid`). Las páginas de arriba guardan solo **claves divisorias**: "los `id` menores que 20 000, por aquí; los otros, por allá". Buscar un `id` es bajar de la raíz a una hoja, comparando:

<!-- /photo -->

```arbol
title: Buscar la llamada 35552 por su id
n: 27
step: 2222
fanout: 3
find: 35552
caption: "Dibujado con 3 claves por página. En el archivo real cada página interna guarda cientos de claves: con 680 hojas, el árbol tiene 3 niveles. Buscar por `id` lee **3 páginas**; recorrer la tabla, **680**."
```

**Sin índice, todo lo demás es un SCAN.** El árbol está ordenado por `id`, no por `origen`. Para encontrar las llamadas de un número SQLite no tiene más remedio que leer **todas** las hojas y mirar fila por fila. `EXPLAIN QUERY PLAN` delante de una consulta no la corre: dice **cómo** la correría.

```plan
title: "Sin índice: SCAN"
query: |
  SELECT inicio, destino FROM llamadas_1998
  WHERE origen = '4417825';
```

**Un índice es otro B-tree.** `CREATE INDEX idx_llamadas_origen ON llamadas_1998(origen)` arma un árbol aparte cuyas hojas guardan pares `(origen, rowid)` **ordenados por `origen`**. Buscar un número es bajar por ese árbol hasta la primera entrada con ese `origen`, leer las que siguen (están juntas) y, con cada `rowid`, ir a buscar la fila a la tabla.

```arbol
title: "El índice por origen: las entradas ordenadas por número"
keys: ["2398664", "2715504", "2716620", "2741958", "3302871", "4237750", "4239014", "4256641", "4402216", "4417825", "4645119", "4721000", "4721093", "4723310", "4761393", "4837265"]
fanout: 3
find: "4417825"
caption: "Cada entrada de la hoja guarda además el `rowid` de su fila, para saltar a la tabla."
```

```plan
title: "Con índice: SEARCH"
setup: CREATE INDEX idx_llamadas_origen ON llamadas_1998(origen);
query: |
  SELECT inicio, destino FROM llamadas_1998
  WHERE origen = '4417825';
```

Se lee de arriba abajo y de afuera hacia adentro. **SCAN** (rojo) lee la tabla entera; **SEARCH … USING INDEX** (verde) baja por un índice; **USING COVERING INDEX** significa que el índice tiene **todas** las columnas que pide la consulta y la tabla ni se abre; **USE TEMP B-TREE** es un árbol temporal que SQLite arma para ordenar o agrupar.

**Índices de varias columnas y el prefijo izquierdo.** Un índice `(destino, inicio)` está ordenado como una guía telefónica por apellido y nombre: primero por `destino` y, dentro de cada `destino`, por `inicio`. Sirve si la consulta fija **la primera columna**; la segunda solo ayuda después de la primera.

```figura
title: "¿Le sirve el índice (destino, inicio)?"
panes:
  - table:
      head: ["WHERE …", "¿lo usa?"]
      rows:
        - ["destino = '4721093'", "sí: SEARCH (destino=?)"]
        - ["destino = '4721093' AND inicio >= '1998-12-18'", "sí: SEARCH (destino=? AND inicio>?)"]
        - ["destino = '4721093' ORDER BY inicio", "sí, y ni siquiera ordena: ya están en orden"]
        - ["inicio >= '1998-12-18'", "no: SCAN (falta la primera columna)"]
        - ["date(inicio) = '1998-12-18'", "no: SCAN (una función esconde la columna)"]
```

**Funciones sobre la columna.** El índice guarda `inicio`, no `date(inicio)`. Si escribes `WHERE date(inicio) = '1998-12-18'`, SQLite tiene que calcular la función en cada fila: SCAN. La misma pregunta como **rango** sobre la columna desnuda sí usa el índice:

```plan
title: El mismo día, escrito como rango
setup: CREATE INDEX idx_llamadas_inicio ON llamadas_1998(inicio);
query: |
  SELECT count(*) FROM llamadas_1998
  WHERE inicio >= '1998-12-18' AND inicio < '1998-12-19';
```

**`LIKE` con prefijo.** `titular LIKE 'Cerraj%'` podría bajar por un índice hasta "Cerraj" y leer hasta que deje de empezar así. Pero `LIKE` no distingue mayúsculas, y un índice normal sí. SQLite solo lo aprovecha si el índice compara igual que `LIKE`: `CREATE INDEX … ON telefonos_1998(titular COLLATE NOCASE)`. Un `LIKE '%Candado%'`, con `%` al inicio, nunca puede usar un índice.

**El costo de `SELECT *`.** Con un índice `(destino, inicio, origen)`, `SELECT inicio, origen … WHERE destino = …` sale **entero del índice** (COVERING). Con `SELECT *`, cada entrada obliga a saltar a la tabla por las otras columnas. Pide solo lo que vas a leer.

**Y la consulta de Chasqui.** `r.numero IN (l.origen, l.destino)` es un `OR` entre **dos columnas distintas**: ningún índice por una sola columna responde las dos preguntas a la vez, así que SQLite hace un SCAN de las 60 000 llamadas **por cada número de la cola**. Con unos 5 000 números en la cola, son unos 300 millones de filas leídas.

```plan
title: El plan de la caminata de Chasqui
query: |
  WITH RECURSIVE red(numero, saltos) AS (
    SELECT '4723310', 0
    UNION
    SELECT CASE WHEN l.origen = r.numero THEN l.destino ELSE l.origen END, r.saltos + 1
    FROM red AS r
    JOIN llamadas_1998 AS l ON r.numero IN (l.origen, l.destino)
    WHERE r.saltos < 4
  )
  SELECT count(*) FROM red;
caption: "El `SCAN l` dentro del paso recursivo se repite por cada fila de la cola."
```

La salida es partir el `OR` en dos búsquedas, cada una con su índice. SQLite permite varias partes recursivas en un mismo `WITH`, unidas con `UNION`:

```sql run
CREATE INDEX idx_llamadas_origen ON llamadas_1998(origen);
CREATE INDEX idx_llamadas_destino ON llamadas_1998(destino);

WITH RECURSIVE red(numero, saltos) AS (
  SELECT '4723310', 0
  UNION
  SELECT l.destino, r.saltos + 1
  FROM red AS r JOIN llamadas_1998 AS l ON l.origen = r.numero
  WHERE r.saltos < 4
  UNION
  SELECT l.origen, r.saltos + 1
  FROM red AS r JOIN llamadas_1998 AS l ON l.destino = r.numero
  WHERE r.saltos < 4
)
SELECT count(DISTINCT numero) AS numeros FROM red;
```

```plan
title: "Con los dos índices: dos SEARCH, ningún SCAN"
setup: "CREATE INDEX idx_a ON llamadas_1998(origen); CREATE INDEX idx_b ON llamadas_1998(destino);"
query: |
  WITH RECURSIVE red(numero, saltos) AS (
    SELECT '4723310', 0
    UNION
    SELECT l.destino, r.saltos + 1 FROM red AS r JOIN llamadas_1998 AS l ON l.origen = r.numero WHERE r.saltos < 4
    UNION
    SELECT l.origen, r.saltos + 1 FROM red AS r JOIN llamadas_1998 AS l ON l.destino = r.numero WHERE r.saltos < 4
  )
  SELECT count(*) FROM red;
```

Ahora termina en milisegundos. Cada número de la cola baja por dos árboles y lee solo sus llamadas.

> **Trampa común:** un índice no es gratis. Ocupa páginas, y cada `INSERT`, `UPDATE` o `DELETE` tiene que actualizar **todos** los índices de la tabla. No indexes cada columna "por si acaso": indexa las columnas con las que **buscas** (`WHERE`, `JOIN … ON`), en el orden en que las fijas. Y mira el plan: si dice SCAN donde esperabas SEARCH, casi siempre es una función sobre la columna, un `OR`, un `LIKE '%…'` o un índice cuya primera columna no está en el `WHERE`.

<!-- legacy: explain-plan -->

<!-- mdn: explain-plan -->

## Práctica

```exercise
id: sql13-predice-objetos
type: predict
title: Un índice es un objeto más
prompt: |
  ¿Qué devuelve?
code: |
  CREATE INDEX idx_llamadas_origen ON llamadas_1998(origen);
  SELECT type, name FROM sqlite_master
  WHERE tbl_name = 'llamadas_1998'
  ORDER BY name;
options:
  - "index | idx_llamadas_origen\ntable | llamadas_1998"
  - "table | llamadas_1998"
  - "table | llamadas_1998\ncolumn | origen"
  - "index | llamadas_1998\ntable | idx_llamadas_origen"
answer: "index | idx_llamadas_origen\ntable | llamadas_1998"
explain: |
  `sqlite_master` es el catálogo: guarda cada tabla, índice, vista y trigger. El índice es un objeto propio, con su propio árbol de páginas, que pertenece a la tabla (`tbl_name`).
```

```exercise
id: sql13-predice-rango
type: predict
title: Un rango mal cerrado
prompt: |
  Alguien quiso cambiar `date(inicio) = '1998-12-18'` por un rango que pueda usar un índice. ¿Qué devuelve?
code: |
  SELECT
    (SELECT count(*) FROM llamadas_1998 WHERE date(inicio) = '1998-12-18'),
    (SELECT count(*) FROM llamadas_1998 WHERE inicio BETWEEN '1998-12-18' AND '1998-12-18');
options:
  - "1968 | 1968"
  - "1968 | 0"
  - "0 | 1968"
  - "1968 | 1"
answer: "1968 | 0"
explain: |
  `inicio` es texto como `'1998-12-18 22:05:11'`, que es **mayor** que `'1998-12-18'` (es más largo y empieza igual). `BETWEEN '1998-12-18' AND '1998-12-18'` solo acepta el texto exacto `'1998-12-18'`: ninguna fila. El rango correcto es `inicio >= '1998-12-18' AND inicio < '1998-12-19'`.
```

```exercise
id: sql13-completa-indice
type: complete
title: Que busque, no que recorra
prompt: |
  Crea un índice por `origen` y lista `inicio`, `destino` y `duracion_s` de todas las llamadas que hizo la casa `'4417825'` en diciembre, en orden de `inicio`. El plan tiene que decir **SEARCH … USING INDEX**. Reemplaza los `___`.
visual:
  plan:
    title: Hoy, sin índice
    query: SELECT inicio, destino, duracion_s FROM llamadas_1998 WHERE origen = '4417825' ORDER BY inicio;
starter: |
  CREATE ___ idx_llamadas_origen ___ llamadas_1998(___);

  SELECT inicio, destino, duracion_s
  FROM llamadas_1998
  WHERE origen = '4417825'
  ORDER BY inicio;
solution: |
  CREATE INDEX idx_llamadas_origen ON llamadas_1998(origen);

  SELECT inicio, destino, duracion_s
  FROM llamadas_1998
  WHERE origen = '4417825'
  ORDER BY inicio;
hints:
  - "`CREATE INDEX nombre ON tabla(columna)`."
tests:
  - name: las llamadas de 4417825, en orden
    same: SELECT inicio, destino, duracion_s FROM llamadas_1998 WHERE origen = '4417825' ORDER BY inicio
    ordered: true
  - name: el plan busca con el índice
    plan: 'SEARCH llamadas_1998 USING INDEX'
```

```exercise
id: sql13-arregla-funcion
type: fix
title: La función que esconde la columna
prompt: |
  Ya existe un índice por `inicio`. Esta consulta lista las llamadas del viernes 18 desde las 23:00 hasta la medianoche, pero su plan dice SCAN: las funciones `date` y `time` esconden la columna. Reescribe el `WHERE` como un rango sobre `inicio` para que el plan busque con `idx_llamadas_inicio`. El resultado no debe cambiar.
setup: CREATE INDEX idx_llamadas_inicio ON llamadas_1998(inicio);
visual:
  plan:
    title: El plan de hoy
    setup: CREATE INDEX idx_llamadas_inicio ON llamadas_1998(inicio);
    query: SELECT id, origen, destino, inicio FROM llamadas_1998 WHERE date(inicio) = '1998-12-18' AND time(inicio) >= '23:00' ORDER BY inicio, id;
starter: |
  SELECT id, origen, destino, inicio
  FROM llamadas_1998
  WHERE date(inicio) = '1998-12-18' AND time(inicio) >= '23:00'
  ORDER BY inicio, id;
solution: |
  SELECT id, origen, destino, inicio
  FROM llamadas_1998
  WHERE inicio >= '1998-12-18 23:00' AND inicio < '1998-12-19'
  ORDER BY inicio, id;
hints:
  - "Desde `'1998-12-18 23:00'` (incluido) hasta `'1998-12-19'` (sin incluir)."
tests:
  - name: las mismas llamadas, en orden
    same: SELECT id, origen, destino, inicio FROM llamadas_1998 WHERE date(inicio) = '1998-12-18' AND time(inicio) >= '23:00' ORDER BY inicio, id
    ordered: true
  - name: el plan busca con idx_llamadas_inicio
    plan: 'SEARCH llamadas_1998 USING (COVERING )?INDEX idx_llamadas_inicio'
```

```exercise
id: sql13-escribe-cubre
type: write
title: Un índice que basta
prompt: |
  Crea **un** índice y escribe la consulta que lista `inicio` y `origen` de **todas** las llamadas que recibió la caseta `'4721093'` en diciembre, en orden de `inicio`. El plan debe salir **entero del índice** (COVERING INDEX) y **sin** `TEMP B-TREE`: ni abrir la tabla ni ordenar aparte.
visual:
  figure:
    title: Lo que el índice tiene que guardar
    panes:
      - label: "WHERE"
        value: "destino = …"
      - label: "ORDER BY"
        value: "inicio"
      - label: "SELECT"
        value: "inicio, origen"
starter: |
  SELECT inicio, origen
  FROM llamadas_1998
  WHERE destino = '4721093'
  ORDER BY inicio;
solution: |
  CREATE INDEX idx_llamadas_destino_inicio_origen ON llamadas_1998(destino, inicio, origen);

  SELECT inicio, origen
  FROM llamadas_1998
  WHERE destino = '4721093'
  ORDER BY inicio;
hints:
  - "Primero la columna que fijas en el `WHERE`, después la del `ORDER BY` (así ya salen ordenadas) y al final la que solo se lee."
tests:
  - name: las llamadas a la caseta, en orden
    same: SELECT inicio, origen FROM llamadas_1998 WHERE destino = '4721093' ORDER BY inicio
    ordered: true
  - name: el índice cubre la consulta
    plan: 'COVERING INDEX'
  - name: no ordena aparte
    planNot: 'TEMP B-TREE'
```

```exercise
id: sql13-escribe-like
type: write
title: Las cerrajerías de la guía
prompt: |
  Lista `numero` y `titular` de los teléfonos cuyo titular **empieza** con "cerraj", sin importar mayúsculas (en la guía hay "Cerrajería", "CERRAJERIA" y "cerrajería"), ordenados por `titular`. Crea el índice que permita que el plan **busque** en `telefonos_1998` en vez de recorrerla.
starter: |
  SELECT numero, titular
  FROM telefonos_1998
  WHERE titular LIKE 'cerraj%'
  ORDER BY titular;
solution: |
  CREATE INDEX idx_telefonos_titular ON telefonos_1998(titular COLLATE NOCASE);

  SELECT numero, titular
  FROM telefonos_1998
  WHERE titular LIKE 'cerraj%'
  ORDER BY titular;
hints:
  - "`LIKE` no distingue mayúsculas; el índice tiene que comparar igual: `titular COLLATE NOCASE`."
tests:
  - name: las cerrajerías, en orden
    same: SELECT numero, titular FROM telefonos_1998 WHERE titular LIKE 'cerraj%' ORDER BY titular
    ordered: true
  - name: el plan busca en telefonos_1998
    plan: 'SEARCH telefonos_1998 USING'
```

## El caso

```exercise
id: sql13-caso-cerrajeria
type: case
title: El técnico que nadie mandó
prompt: |
  **¿A qué cerrajería llamaron más veces, en diciembre, las casas de los tres sospechosos?** Escribe el nombre como sale en la guía.

  Teodoro dejó entrar a "un técnico de la caja fuerte". Víctor juró que no conoce a ningún cerrajero. Busca los teléfonos de casa de Víctor (318), Rosa (214) y Nilton (405) y, en `llamadas_1998`, a qué números de la guía cuyo titular empieza con "Cerraj" llamaron. Si la consulta tarda, ya sabes qué índice crear.
visual:
  - escenario:
      case: frio
  - esquema:
      tables: [empleados_1998, llamadas_1998, telefonos_1998]
starter: |
  -- Paso 1: los teléfonos de casa de los tres
  SELECT id, nombre, telefono
  FROM empleados_1998
  WHERE id IN (214, 318, 405);
solution: |
  SELECT t.titular, l.origen, count(*) AS llamadas
  FROM llamadas_1998 AS l
  JOIN telefonos_1998 AS t ON t.numero = l.destino
  WHERE l.origen IN ('4417825', '4402216', '2741958')
    AND t.titular LIKE 'Cerraj%'
  GROUP BY t.titular, l.origen
  ORDER BY llamadas DESC;
answer: Cerrajería El Candado
answerLabel: ¿A qué cerrajería llamaron más?
reveal: |
  **Cerrajería El Candado**, Jr. Huánuco 1290, "cajas fuertes y llaves". Recibió **cinco** llamadas de la casa **4417825** entre el 12 y el 18 de diciembre, la última a las 22:58 de la noche del robo. La otra llamada a una cerrajería fue de la casa de Rosa a la Cerrajería Lima, el 2 de diciembre, por la mañana. Esa casa es la de Víctor (lo viste en el paso 1), el que juró no conocer a ningún cerrajero. Falta probar que la llamada a la caseta salió de ahí.
hints:
  - "Los tres teléfonos: `4417825`, `4402216` y `2741958`. Une `llamadas_1998` con `telefonos_1998` por `t.numero = l.destino`."
  - "Filtra `t.titular LIKE 'Cerraj%'`, agrupa por titular y origen y ordena por la cuenta."
```

## El juez

```exercise
id: sql13-juez-un-dia
type: judge
title: Las llamadas de un día, sin funciones
prompt: |
  **Devuelve `id`, `destino` e `inicio` de las llamadas que hizo el número pedido en el día pedido, ordenadas por `inicio` y luego por `id`. Escribe la condición de modo que el índice `(origen, inicio)` pueda usarse: sin funciones sobre `inicio`.**

  La central quiere un reporte rápido sobre millones de llamadas, así que la tabla ya tiene el índice `idx_llamadas_origen_inicio ON llamadas(origen, inicio)`. `inicio` es texto `'AAAA-MM-DD HH:MM:SS'`. Una llamada que empieza a las `00:00:00` del día siguiente **no** es de ese día.

  **Tablas:** `llamadas(id, origen, destino, inicio)` (con el índice) y `pedido(numero, dia)`, con una sola fila; `dia` es `'AAAA-MM-DD'`.

  **Resultado:** `id`, `destino` e `inicio`, ordenado por `inicio` y luego `id`.
schema: |
  CREATE TABLE llamadas (id INTEGER, origen TEXT, destino TEXT, inicio TEXT);
  CREATE INDEX idx_llamadas_origen_inicio ON llamadas(origen, inicio);
  CREATE TABLE pedido (numero TEXT, dia TEXT);
ordered: true
starter: |
  SELECT id, destino, inicio
  FROM llamadas
  WHERE origen = (SELECT numero FROM pedido)
  ORDER BY inicio, id;
solution: |
  SELECT id, destino, inicio
  FROM llamadas
  WHERE origen = (SELECT numero FROM pedido)
    AND inicio >= (SELECT dia FROM pedido)
    AND inicio < (SELECT date(dia, '+1 day') FROM pedido)
  ORDER BY inicio, id;
hints:
  - "Las funciones sí pueden ir del **otro** lado: `inicio < date(dia, '+1 day')` deja a `inicio` desnuda."
  - "El día empieza en `dia` (incluido) y termina antes de `date(dia, '+1 day')` (sin incluir)."
tests:
  - name: no envuelve inicio en una función
    sourceNot: '\b(date|datetime|strftime|substr|time|julianday)\s*\(\s*(\w+\.)?inicio\b'
    msg: Una función sobre inicio impide usar el índice; compara inicio con un rango.
samples:
  - rows:
      llamadas: [[1, "4417825", "4256641", "1998-12-18 22:58:26"], [2, "4417825", "4723310", "1998-12-18 23:36:15"], [3, "4417825", "4256641", "1998-12-17 21:05:18"], [4, "4402216", "4721093", "1998-12-18 10:00:00"]]
      pedido: [["4417825", "1998-12-18"]]
    note: "Las llamadas 1 y 2 son del 18 y de ese número. La 3 es del 17 y la 4 es de otro número."
  - rows:
      llamadas: [[7, "100", "200", "1998-12-19 00:00:00"], [6, "100", "300", "1998-12-18 23:59:59"], [5, "100", "400", "1998-12-18 00:00:00"]]
      pedido: [["100", "1998-12-18"]]
    note: "Las 00:00:00 del 18 cuentan; las 00:00:00 del 19 ya no."
edge:
  - rows: { llamadas: [], pedido: [["100", "1998-12-18"]] }
    tag: sin llamadas
  - rows: { llamadas: [[2, "100", "201", "1998-12-18 23:59:30"], [1, "100", "200", "1998-12-18 23:59:30"], [3, "100", "202", "1998-12-19 00:00:00"]], pedido: [["100", "1998-12-18"]] }
    tag: alrededor de la medianoche, con empates
  - rows: { llamadas: [[1, "100", "200", "1998-12-31 23:10:00"], [2, "100", "200", "1999-01-01 00:00:00"]], pedido: [["100", "1998-12-31"]] }
    tag: en Año Nuevo
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
    return { llamadas: rows, pedido: [[rng.pick(nums), "1998-12-18"]] };
wrong:
  - |
    SELECT id, destino, inicio FROM llamadas WHERE origen = (SELECT numero FROM pedido) AND inicio BETWEEN (SELECT dia FROM pedido) AND (SELECT date(dia, '+1 day') || ' 00:00:00' FROM pedido) ORDER BY inicio, id;
  - |
    SELECT id, destino, inicio FROM llamadas WHERE origen = (SELECT numero FROM pedido) AND inicio >= (SELECT dia FROM pedido) AND inicio <= (SELECT dia || ' 23:59' FROM pedido) ORDER BY inicio, id;
  - |
    SELECT id, destino, inicio FROM llamadas WHERE origen = (SELECT numero FROM pedido) AND inicio >= (SELECT dia FROM pedido) AND inicio < (SELECT date(dia, '+1 day') FROM pedido) ORDER BY inicio;
```

## Misión final

```exercise
id: sql13-mision-relevo
type: mission
title: Los relevos hacia la caseta
prompt: |
  **Encuentra los "relevos" de diciembre: alguien llama a un teléfono público y, dentro de los 10 minutos siguientes, ese mismo teléfono público llama a la caseta `'4721093'`.** Muestra `origen` (quien llamó al público), `publico`, `suena` (cuando sonó el público) y `a_caseta` (cuando el público llamó a la caseta), ordenado por `suena`. Crea el índice que haga falta: el plan tiene que **buscar con tu índice**, no con uno automático. Después di cuántos relevos hubo.

  Es un autojoin de `llamadas_1998` (`a` entra al público, `b` sale del público hacia la caseta) más `telefonos_1998` para saber que el número del medio es un público (`tipo = 'público'`).

  Cuando la consulta lo pruebe y respondas, junto con el juez, se abre la sesión 14.
visual:
  - escenario:
      case: frio
  - network:
      title: "Un relevo: dos llamadas encadenadas"
      clockLabel: "Desde la primera llamada"
      clockMax: 600
      nodes:
        - {"id": "h", "icon": "person", "label": "Casa 4417825", "sub": "quien llama primero"}
        - id: "p"
          icon: "box"
          label: "Teléfono público 4723310"
          sub: "Av. México, frente a la fábrica"
        - {"id": "c", "icon": "person", "label": "Caseta 4721093", "sub": "Teodoro, de guardia"}
      links:
        - {"id": "a", "kind": "phone", "label": "llamada a", "busy": "sonando"}
        - {"id": "b", "kind": "phone", "label": "llamada b", "busy": "sonando"}
      steps:
        - phase: "Llamada a"
          move: ["h", "p"]
          packet: {"kind": "up", "label": "llamada a las 23:36:15"}
          busy: ["a"]
          clock: 0
          clockText: "0 s"
          note: "Viernes 18, 23:36:15: la casa llama al teléfono público. En `llamadas_1998` es la fila `a`."
        - phase: "Llamada b"
          move: ["p", "c"]
          packet: {"kind": "up", "label": "llamada a las 23:41:02"}
          busy: ["b"]
          clock: 287
          clockText: "4 min 47 s"
          note: "El mismo teléfono público llama a la caseta: es la fila `b`. Su `origen` es el `destino` de `a`."
        - phase: "Es un relevo"
          at: "p"
          tags: {"p": "menos de 10 min = relevo"}
          clock: 287
          clockText: "4 min 47 s"
          note: "Entre `a` y `b` pasaron menos de 10 minutos: `b.inicio BETWEEN a.inicio AND a.inicio + 10 minutos`. Eso es lo que cuenta tu consulta para todo diciembre."
starter: |
  SELECT a.origen, a.destino AS publico, a.inicio AS suena, b.inicio AS a_caseta
  FROM llamadas_1998 AS a
  JOIN llamadas_1998 AS b
    ON b.origen = a.destino
   AND b.inicio BETWEEN a.inicio AND datetime(a.inicio, '+10 minutes')
  JOIN telefonos_1998 AS t ON t.numero = a.destino
  WHERE b.destino = '4721093'
    AND t.tipo = 'público'
  ORDER BY suena;
solution: |
  CREATE INDEX idx_llamadas_destino_inicio ON llamadas_1998(destino, inicio);

  SELECT a.origen, a.destino AS publico, a.inicio AS suena, b.inicio AS a_caseta
  FROM llamadas_1998 AS a
  JOIN llamadas_1998 AS b
    ON b.origen = a.destino
   AND b.inicio BETWEEN a.inicio AND datetime(a.inicio, '+10 minutes')
  JOIN telefonos_1998 AS t ON t.numero = a.destino
  WHERE b.destino = '4721093'
    AND t.tipo = 'público'
  ORDER BY suena;
answer: "2"
answerLabel: ¿Cuántos relevos hubo en diciembre?
reveal: |
  **Dos**, y los dos desde la misma casa, **4417825**: el **martes 15** (23:21 → 23:26), la noche en que Teodoro dice que le "avisaron" del técnico, y el **viernes 18** (23:36 → 23:41), la llamada que lo engañó. Ni la casa de Rosa ni la de Nilton aparecen: Nilton queda descartado. Mira el plan: SQLite empieza por las llamadas **a la caseta** (pocas, gracias a tu índice) y, para cada una, busca en el mismo índice las que entraron al público justo antes.
hints:
  - "La consulta ya está bien: lo que falta es el índice. ¿Qué columnas fija el `WHERE` y el `ON`? `b.destino = '4721093'` y, para `a`, `a.destino = b.origen` con `a.inicio` en un rango."
  - "`CREATE INDEX idx_llamadas_destino_inicio ON llamadas_1998(destino, inicio);` sirve para los dos lados del autojoin."
tests:
  - name: los relevos hacia la caseta, en orden
    same: SELECT a.origen, a.destino, a.inicio, b.inicio FROM llamadas_1998 a JOIN llamadas_1998 b ON b.origen = a.destino AND b.inicio BETWEEN a.inicio AND datetime(a.inicio, '+10 minutes') JOIN telefonos_1998 t ON t.numero = a.destino WHERE b.destino = '4721093' AND t.tipo = 'público' ORDER BY a.inicio
    ordered: true
  - name: columnas origen, publico, suena y a_caseta
    columns: [origen, publico, suena, a_caseta]
  - name: el plan busca con tu índice (no uno automático)
    plan: 'USING (COVERING )?INDEX'
    msg: Crea un índice con CREATE INDEX antes de la consulta.
```

## Reto experto

```exercise
id: sql13-reto-or
type: challenge
title: La caminata de Chasqui, rápida
prompt: |
  **Devuelve cuántos números distintos están a 3 llamadas o menos del teléfono público `'4723310'` en todo diciembre (el número de partida incluido), con una consulta cuyo plan busque con índices tuyos en las dos direcciones.** Una fila y una columna, `numeros`.

  Para quien ya programa: es la consulta del encargo, con 3 llamadas en vez de 4. Parte el `OR` en dos partes recursivas, una que baja por un índice de `origen` y otra por uno de `destino`. Con `UNION` (no `UNION ALL`) un par `(numero, saltos)` repetido no se vuelve a expandir; afuera, cuenta números distintos.
starter: |
  WITH RECURSIVE red(numero, saltos) AS (
    SELECT '4723310', 0
    UNION
    SELECT CASE WHEN l.origen = r.numero THEN l.destino ELSE l.origen END, r.saltos + 1
    FROM red AS r
    JOIN llamadas_1998 AS l ON r.numero IN (l.origen, l.destino)
    WHERE r.saltos < 1
  )
  SELECT count(DISTINCT numero) AS numeros FROM red;
solution: |
  CREATE INDEX idx_llamadas_origen ON llamadas_1998(origen);
  CREATE INDEX idx_llamadas_destino ON llamadas_1998(destino);

  WITH RECURSIVE red(numero, saltos) AS (
    SELECT '4723310', 0
    UNION
    SELECT l.destino, r.saltos + 1
    FROM red AS r JOIN llamadas_1998 AS l ON l.origen = r.numero
    WHERE r.saltos < 3
    UNION
    SELECT l.origen, r.saltos + 1
    FROM red AS r JOIN llamadas_1998 AS l ON l.destino = r.numero
    WHERE r.saltos < 3
  )
  SELECT count(DISTINCT numero) AS numeros FROM red;
hints:
  - "El starter corre rápido solo porque llega a 1 salto. Con 3, el `OR` hace un SCAN por cada número de la cola."
tests:
  - name: cuántos números hay a 3 llamadas o menos
    same: WITH RECURSIVE x(a, b) AS (SELECT origen, destino FROM llamadas_1998 UNION ALL SELECT destino, origen FROM llamadas_1998), r(n, s) AS (SELECT '4723310', 0 UNION SELECT x.b, r.s + 1 FROM r JOIN x ON x.a = r.n WHERE r.s < 3) SELECT count(DISTINCT n) FROM r
  - name: busca con un índice de origen
    plan: 'USING (COVERING )?INDEX \w+ \(origen=\?\)'
  - name: y con uno de destino
    plan: 'USING (COVERING )?INDEX \w+ \(destino=\?\)'
```
