# Sesión 11 — JSON y series de tiempo

```session
case: sensores
```

## El encargo

Lunes 30 de marzo. Ya sabes **cuándo**: los robots se callaron 40 minutos las madrugadas del 24 y del 26, mientras alguien usaba la tarjeta perdida de Wilmer. Falta **quién**. Carmen está segura de que para descalibrar así a un robot hay que cambiarle el firmware, y eso deja huella.

La huella está en la columna `datos` de `lecturas`: cada lectura lleva un texto en **JSON** con la versión de firmware que la produjo, y cuando un robot se actualiza, guarda una fila del sensor `'sistema'` con quién lo actualizó, desde qué equipo y qué cambió. SQL no ve adentro de un texto… salvo con las funciones de JSON. Y para leer las lecturas como lo que son, una **serie de tiempo**, vas a agruparlas por hora y compararlas con la hora o el día anterior.

```escenario
case: sensores
title: El monitor de la sala
caption: "Cada lectura guarda su firmware en JSON. El monitor muestra el giroscopio de Tika: tranquilo, un hueco y un salto."
```

```expediente
title: Los que saben de firmware
cards:
  - name: Carmen Ríos Llanos
    traits: { style: bun, shirt: "#3f7cc4", glasses: true }
    role: Dueña de Loop, usuario crios
    rows: [["Publicó", "la 2.5.9, el 18 de marzo"]]
    quote: "Para cambiar un firmware hay que saber programarlo. Aquí lo sabemos hacer dos."
  - name: Yesenia Choque Ugarte
    traits: { style: long, shirt: "#c4553f", earrings: true }
    role: Practicante, usuario ychoque
    rows: [["Instaló", "la 2.5.9, el viernes 20"]]
    quote: "Actualicé los cinco robots a la versión oficial."
  - name: Gonzalo Pumacayo Tello
    traits: { style: short, shirt: "#6b4fa0", glasses: true, hood: "#3a3550" }
    role: Exprogramador de Loop
    rows: [["Se fue", "en febrero, a la competencia"]]
    quote: "Mi tarjeta no abre nada desde febrero. Esas noches estuve en mi casa, en Surco."
```

## Lo mínimo

**JSON** es texto con estructura: objetos `{"clave": valor}`, listas `[a, b]`, textos entre comillas dobles, números, `true`, `false` y `null`. SQLite lo guarda como texto común (`TEXT`) y lo lee con funciones que reciben una **ruta**: `$` es el documento entero, `.clave` entra a un objeto y `[0]` a una lista.

```figura
title: Una fila del sensor 'sistema', por dentro
input:
  label: datos (un texto)
  text: |
    {"evento": "actualizacion",
     "de": "2.5.9",
     "a": "2.6.0",
     "usuario": "gpumacayo",
     "equipo": "LAP-07",
     "parches": ["giroscopio.offset=+1.8",
                 "calibracion.verificar=no"]}
arrow: rutas
output:
  label: Lo que devuelve cada una
  table:
    head: [expresión, resultado]
    rows:
      - ["datos ->> '$.a'", "2.6.0 (texto)"]
      - ["datos -> '$.a'", "\"2.6.0\" (JSON, con comillas)"]
      - ["datos ->> '$.parches[0]'", "giroscopio.offset=+1.8"]
      - ["datos -> '$.parches'", "[\"giroscopio…\", \"calibracion…\"]"]
      - ["datos ->> '$.nada'", "NULL"]
caption: "`->>` saca un valor de SQL (texto, número o NULL); `->` saca un pedazo de JSON. `json_extract(datos, '$.a')` es lo mismo que `->>` para valores simples."
```

- **`json_extract(datos, '$.firmware')`** o **`datos ->> '$.firmware'`**: el valor, listo para comparar. Un `true` de JSON llega como `1` y un `false` como `0`.
- **`datos -> '$.firmware'`**: el pedazo de JSON tal cual, con sus comillas. Sirve para seguir navegando, no para comparar con `'2.6.0'`.
- **`json_valid(texto)`** dice si el texto es JSON bien formado; una función de JSON sobre un texto roto da error *malformed JSON*.

```sql run
SELECT momento, datos,
       datos ->> '$.firmware' AS version,
       datos ->> '$.ok' AS ok
FROM lecturas
WHERE robot_id = 3
  AND sensor = 'giroscopio'
  AND momento BETWEEN '2026-03-24 02:00' AND '2026-03-24 02:30';
```

### Una lista se vuelve filas: json_each

**`json_each(texto, ruta)`** es una función que devuelve **una tabla**: una fila por cada elemento de la lista (u objeto) que apunta la ruta, con columnas `key` (la posición o la clave), `value` y `type`. Se pone en el `FROM` como una tabla más, y con `JOIN` se recorre **una vez por cada fila** de la tabla de la izquierda:

```figura
title: json_each, una fila por elemento
input:
  label: "datos -> '$.parches' de una fila"
  text: '["giroscopio.offset=-1.6", "ventilador.umbral=75", "calibracion.verificar=no"]'
arrow: "JOIN json_each(datos, '$.parches')"
output:
  label: Lo que agrega el JOIN
  table:
    head: [key, value]
    rows: [["0", "giroscopio.offset=-1.6"], ["1", "ventilador.umbral=75"], ["2", "calibracion.verificar=no"]]
caption: "La fila de Kusi se repite tres veces, una por parche. Es un JOIN sin `ON`: la condición es que cada parche sale de **esa** fila."
```

```sql run
SELECT l.robot_id, l.momento, p.value AS parche
FROM lecturas AS l
JOIN json_each(l.datos, '$.parches') AS p
WHERE l.sensor = 'sistema'
  AND l.momento >= '2026-03-20';
```

Al revés, **`json_group_array(x)`** es un agregado que junta los valores de un grupo en una lista JSON, y **`json_group_object(clave, valor)`**, en un objeto. Desde SQLite 3.44 aceptan un `ORDER BY` adentro: `json_group_array(version ORDER BY momento)`.

### Series de tiempo: agrupar por hora y mirar atrás

Una serie de tiempo se lee en **cubetas** (*buckets*): todas las lecturas de una misma hora, o de un mismo día. `strftime('%Y-%m-%d %H:00', momento)` corta el momento a su hora; con `GROUP BY` sobre eso cuentas o promedias por hora. Si un robot reporta cada 10 minutos, cada hora debería tener **6** lecturas: una cubeta con menos es una hora con lecturas perdidas.

```resultado
title: Lecturas de Tika por hora, madrugada del 24
query: |
  SELECT strftime('%Y-%m-%d %H:00', momento) AS hora, count(*) AS lecturas
  FROM lecturas
  WHERE robot_id = 3
    AND sensor = 'giroscopio'
    AND momento BETWEEN '2026-03-24 00:00' AND '2026-03-24 05:59:59'
  GROUP BY hora
  ORDER BY hora;
caption: "A la 01:00 faltan dos lecturas y a las 02:00 una: el silencio de 40 minutos, partido entre dos horas."
```

Para **comparar con el periodo anterior**, pon una ventana encima del `GROUP BY`: `max(valor) - LAG(max(valor)) OVER (ORDER BY dia)` es el cambio contra el día de antes.

> **Trampa común:** una hora **sin ninguna** lectura no aparece en el `GROUP BY`: no hay filas que agrupar, así que no sale con `count = 0`, simplemente no sale. Para verla, compara cada cubeta con la anterior (`LAG(hora)`) y busca saltos de más de una hora, o arma una lista de todas las horas y únele las lecturas con `LEFT JOIN`; esa lista se genera con `WITH RECURSIVE`, en la sesión 12.

<!-- legacy: json-arrows -->

<!-- mdn: json-arrows -->

## Práctica

```exercise
id: sql11-predice-flechas
type: predict
title: Una flecha o dos
prompt: |
  ¿Qué devuelve?
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
  `->` devuelve JSON, y un texto en JSON lleva sus comillas: `"2.6.0"`. `->>` devuelve el valor de SQL, sin comillas. Y SQLite no tiene booleanos: el `true` de JSON llega como `1`.
```

```exercise
id: sql11-predice-each
type: predict
title: Una lista hecha filas
prompt: |
  ¿Qué devuelve?
code: |
  SELECT key, value
  FROM json_each('["giroscopio.offset=+1.8", "calibracion.verificar=no"]');
options:
  - "0 | giroscopio.offset=+1.8\n1 | calibracion.verificar=no"
  - "1 | giroscopio.offset=+1.8\n2 | calibracion.verificar=no"
  - "0 | [\"giroscopio.offset=+1.8\", \"calibracion.verificar=no\"]"
  - "giroscopio.offset | +1.8\ncalibracion.verificar | no"
answer: "0 | giroscopio.offset=+1.8\n1 | calibracion.verificar=no"
explain: |
  Una fila por elemento. En una lista, `key` es la posición y empieza en **0**, como en JSON (y al revés que `substr`, que cuenta desde 1). `json_each` no parte los textos: el `=` es parte del valor.
```

```exercise
id: sql11-completa-version
type: complete
title: La versión de cada lectura
prompt: |
  Muestra el `momento` y la `version` de firmware (el valor de `firmware` dentro de `datos`, como texto) de cada lectura de giroscopio de Tika (`robot_id = 3`) del martes 24 entre las **02:00 y las 02:30**. Reemplaza los `___`.
starter: |
  SELECT momento,
         datos ___ '___' AS version
  FROM lecturas
  WHERE robot_id = 3
    AND sensor = 'giroscopio'
    AND momento BETWEEN '2026-03-24 02:00' AND '2026-03-24 02:30'
  ORDER BY momento;
solution: |
  SELECT momento,
         datos ->> '$.firmware' AS version
  FROM lecturas
  WHERE robot_id = 3
    AND sensor = 'giroscopio'
    AND momento BETWEEN '2026-03-24 02:00' AND '2026-03-24 02:30'
  ORDER BY momento;
hints:
  - "La flecha que devuelve un valor de SQL es `->>`, y la ruta empieza en `$`: `'$.firmware'`."
tests:
  - name: momento y versión, en orden
    same: SELECT momento, json_extract(datos, '$.firmware') FROM lecturas WHERE robot_id = 3 AND sensor = 'giroscopio' AND momento BETWEEN '2026-03-24 02:00' AND '2026-03-24 02:30' ORDER BY momento
    ordered: true
```

```exercise
id: sql11-arregla-comillas
type: fix
title: Ninguna con la 2.6.0
prompt: |
  Esta consulta cuenta, para cada robot, cuántas lecturas de giroscopio desde el viernes 20 vienen del firmware **2.6.0**. No devuelve nada, aunque Tika ya lleva días con esa versión. Arréglala; el resultado es `robot_id` y `lecturas`, por `robot_id`.
visual:
  figure:
    title: Lo que compara el WHERE
    panes:
      - label: "datos -> '$.firmware'"
        value: "\"2.6.0\""
      - label: "lo que busca"
        value: "2.6.0"
starter: |
  SELECT robot_id, count(*) AS lecturas
  FROM lecturas
  WHERE sensor = 'giroscopio'
    AND momento >= '2026-03-20'
    AND datos -> '$.firmware' = '2.6.0'
  GROUP BY robot_id
  ORDER BY robot_id;
solution: |
  SELECT robot_id, count(*) AS lecturas
  FROM lecturas
  WHERE sensor = 'giroscopio'
    AND momento >= '2026-03-20'
    AND datos ->> '$.firmware' = '2.6.0'
  GROUP BY robot_id
  ORDER BY robot_id;
hints:
  - "`->` devuelve `\"2.6.0\"`, con comillas, que no es igual a `'2.6.0'`. Usa la flecha doble."
tests:
  - name: las lecturas con 2.6.0 de cada robot
    same: SELECT robot_id, count(*) FROM lecturas WHERE sensor = 'giroscopio' AND momento >= '2026-03-20' AND json_extract(datos, '$.firmware') = '2.6.0' GROUP BY robot_id ORDER BY robot_id
    ordered: true
```

```exercise
id: sql11-escribe-parches
type: write
title: Qué le cambiaron a cada uno
prompt: |
  Lista cada **parche** de las actualizaciones a la versión **2.6.0** desde el viernes 20: `robot_id`, `momento` y `parche` (un parche por fila). Las actualizaciones son las filas con `sensor = 'sistema'`; la versión nueva está en `'$.a'` y los parches, en la lista `'$.parches'`. Ordena por `momento` y luego por la posición del parche en su lista.
visual:
  figure:
    title: Una actualización, tres parches
    input: { label: "datos ->> '$.a'", value: "2.6.0" }
    arrow: "JOIN json_each(datos, '$.parches')"
    output: { label: parche, cells: ["giroscopio.offset=-1.6", "ventilador.umbral=75", "calibracion.verificar=no"] }
starter: |
  SELECT robot_id, momento, datos
  FROM lecturas
  WHERE sensor = 'sistema'
    AND momento >= '2026-03-20';
solution: |
  SELECT l.robot_id, l.momento, p.value AS parche
  FROM lecturas AS l
  JOIN json_each(l.datos, '$.parches') AS p
  WHERE l.sensor = 'sistema'
    AND l.momento >= '2026-03-20'
    AND l.datos ->> '$.a' = '2.6.0'
  ORDER BY l.momento, p.key;
hints:
  - "`JOIN json_each(l.datos, '$.parches') AS p` repite cada actualización una vez por parche; el parche está en `p.value` y su posición en `p.key`."
tests:
  - name: un parche por fila, en orden
    same: SELECT l.robot_id, l.momento, p.value FROM lecturas AS l JOIN json_each(l.datos, '$.parches') AS p WHERE l.sensor = 'sistema' AND l.momento >= '2026-03-20' AND json_extract(l.datos, '$.a') = '2.6.0' ORDER BY l.momento, p.key
    ordered: true
  - name: usa json_each
    source: '\bjson_each\s*\('
```

```exercise
id: sql11-escribe-horas
type: write
title: Las horas incompletas
prompt: |
  Cuenta las lecturas de giroscopio de **Tika** (`robot_id = 3`) por hora, del viernes 20 en adelante, y muestra solo las horas con **menos de 6**: `hora` (como `'AAAA-MM-DD HH:00'`) y `lecturas`. Ordena por hora.
starter: |
  SELECT momento
  FROM lecturas
  WHERE robot_id = 3
    AND sensor = 'giroscopio'
    AND momento >= '2026-03-20'
  LIMIT 12;
solution: |
  SELECT strftime('%Y-%m-%d %H:00', momento) AS hora,
         count(*) AS lecturas
  FROM lecturas
  WHERE robot_id = 3
    AND sensor = 'giroscopio'
    AND momento >= '2026-03-20'
  GROUP BY hora
  HAVING count(*) < 6
  ORDER BY hora;
hints:
  - "`strftime('%Y-%m-%d %H:00', momento)` corta cada momento a su hora. Agrupa por eso y filtra los grupos con `HAVING`."
tests:
  - name: las horas con menos de 6 lecturas, en orden
    same: SELECT strftime('%Y-%m-%d %H:00', momento), count(*) FROM lecturas WHERE robot_id = 3 AND sensor = 'giroscopio' AND momento >= '2026-03-20' GROUP BY 1 HAVING count(*) < 6 ORDER BY 1
    ordered: true
  - name: columnas hora y lecturas
    columns: [hora, lecturas]
```

```exercise
id: sql11-escribe-ayer
type: write
title: Contra el día anterior
prompt: |
  Para **Kusi** (`robot_id = 4`), muestra cada día desde el viernes 20 con su temperatura **máxima** (`maxima`) y el `cambio` contra la máxima del día anterior, redondeado a un decimal (el primer día no tiene anterior: `NULL`). Columnas `dia`, `maxima`, `cambio`, por día.
visual:
  figure:
    title: Un día contra el anterior
    panes:
      - cells: ["20: 41.9", "21: 42.3", "22: 41.8", "23: 42.4", "24: ?"]
        highlight: [3, 4]
starter: |
  SELECT date(momento) AS dia, max(valor) AS maxima
  FROM lecturas
  WHERE robot_id = 4
    AND sensor = 'temperatura'
    AND momento >= '2026-03-20'
  GROUP BY dia;
solution: |
  SELECT date(momento) AS dia,
         max(valor) AS maxima,
         round(max(valor) - LAG(max(valor)) OVER (ORDER BY date(momento)), 1) AS cambio
  FROM lecturas
  WHERE robot_id = 4
    AND sensor = 'temperatura'
    AND momento >= '2026-03-20'
  GROUP BY dia
  ORDER BY dia;
hints:
  - "La ventana corre después del `GROUP BY`, así que puede mirar la máxima del grupo anterior: `LAG(max(valor)) OVER (ORDER BY date(momento))`."
tests:
  - name: máxima y cambio de cada día
    same: WITH d AS (SELECT date(momento) AS x, max(valor) AS m FROM lecturas WHERE robot_id = 4 AND sensor = 'temperatura' AND momento >= '2026-03-20' GROUP BY x) SELECT x, m, round(m - LAG(m) OVER (ORDER BY x), 1) FROM d ORDER BY x
    ordered: true
  - name: columnas dia, maxima y cambio
    columns: [dia, maxima, cambio]
```

## El caso

```exercise
id: sql11-caso-version
type: case
title: La versión que nadie publicó
prompt: |
  **¿Qué versión de firmware aparece en las lecturas desde el viernes 20 y no está en la lista de versiones publicadas (`firmwares`)?**

  Saca la versión de cada lectura con `datos ->> '$.firmware'` y réstale las versiones de `firmwares` con `EXCEPT` (sesión 8). Ojo: las filas del sensor `'sistema'` no tienen `firmware`, y un `NULL` también "no está" en la lista.
visual:
  - escenario:
      case: sensores
  - esquema:
      tables: [lecturas, firmwares, personas]
starter: |
  SELECT robot_id, momento, datos
  FROM lecturas
  WHERE momento >= '2026-03-20'
  LIMIT 5;
solution: |
  SELECT DISTINCT datos ->> '$.firmware' AS version
  FROM lecturas
  WHERE momento >= '2026-03-20'
    AND datos ->> '$.firmware' IS NOT NULL
  EXCEPT
  SELECT version FROM firmwares;
answer: 2.6.0
answerLabel: ¿Qué versión?
reveal: |
  **2.6.0.** La lista de `firmwares` llega hasta la 2.5.9, la que publicó Carmen el 18 de marzo e instaló Yesenia el viernes 20: la actualización de Yesenia fue a la versión oficial. La 2.6.0 solo aparece en Tika, Kusi y Pituco, después de sus silencios de madrugada. Alguien escribió un firmware propio y lo instaló sin publicarlo.
hints:
  - "`SELECT DISTINCT datos ->> '$.firmware' … EXCEPT SELECT version FROM firmwares`. Las dos partes deben tener una columna."
  - "Si te sale un `NULL`, agrega `AND datos ->> '$.firmware' IS NOT NULL`."
```

## El juez

```exercise
id: sql11-juez-silencios
type: judge
title: Las horas en silencio
prompt: |
  **Devuelve cada silencio de un robot: la última hora con datos antes del silencio (`desde`), la primera hora con datos después (`hasta`) y cuántas horas enteras faltan (`horas`), ordenado por `desde`.**

  Un robot manda lecturas a cualquier minuto. Una hora "tiene datos" si hay al menos una lectura **válida** en ella: las que en `datos` tienen `"ok": true`. Las horas se escriben `'AAAA-MM-DD HH:00'`. Si no falta ninguna hora, el resultado está vacío.

  **Tabla:** `lecturas(id, momento, datos)`, con `momento` como `'AAAA-MM-DD HH:MM:SS'` y `datos` como `{"ok": true}` o `{"ok": false}`.

  **Resultado:** `desde`, `hasta`, `horas`.
schema: |
  CREATE TABLE lecturas (id INTEGER, momento TEXT, datos TEXT);
ordered: true
starter: |
  SELECT strftime('%Y-%m-%d %H:00', momento) AS hora, count(*)
  FROM lecturas
  GROUP BY hora;
solution: |
  WITH horas AS (
    SELECT DISTINCT strftime('%Y-%m-%d %H:00', momento) AS hora
    FROM lecturas
    WHERE datos ->> '$.ok' = 1
  ),
  pares AS (
    SELECT LAG(hora) OVER (ORDER BY hora) AS desde, hora AS hasta
    FROM horas
  )
  SELECT desde, hasta,
         CAST(round((julianday(hasta) - julianday(desde)) * 24) AS INTEGER) - 1 AS horas
  FROM pares
  WHERE (julianday(hasta) - julianday(desde)) * 24 > 1.5
  ORDER BY desde;
hints:
  - "Primero las horas con datos válidos: `SELECT DISTINCT strftime('%Y-%m-%d %H:00', momento) … WHERE datos ->> '$.ok' = 1`."
  - "Después, `LAG(hora)` trae la hora anterior con datos. Entre `01:00` y `04:00` hay 3 horas de distancia y faltan 2. `julianday` entiende `'AAAA-MM-DD HH:00'`."
samples:
  - rows:
      lecturas: [[1, "2026-03-24 00:10:00", "{\"ok\": true}"], [2, "2026-03-24 01:40:00", "{\"ok\": true}"], [3, "2026-03-24 04:05:00", "{\"ok\": true}"], [4, "2026-03-24 05:30:00", "{\"ok\": true}"]]
    note: "De la 01:00 a las 04:00 no hay nada: faltan las 02:00 y las 03:00."
  - rows:
      lecturas: [[1, "2026-03-23 23:50:00", "{\"ok\": true}"], [2, "2026-03-24 00:20:00", "{\"ok\": false}"], [3, "2026-03-24 01:15:00", "{\"ok\": true}"]]
    note: "La lectura de las 00:20 no es válida, así que la medianoche cuenta como hora sin datos, aunque cambie el día."
edge:
  - rows: { lecturas: [] }
    tag: sin lecturas
  - rows: { lecturas: [[1, "2026-03-24 10:00:00", "{\"ok\": true}"], [2, "2026-03-24 10:59:59", "{\"ok\": true}"], [3, "2026-03-24 11:00:00", "{\"ok\": true}"]] }
    tag: sin ningún silencio
  - rows: { lecturas: [[1, "2026-03-24 10:00:00", "{\"ok\": false}"], [2, "2026-03-24 12:00:00", "{\"ok\": false}"]] }
    tag: con ninguna lectura válida
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
    return { lecturas: rows };
wrong:
  - |
    WITH h AS (SELECT DISTINCT strftime('%Y-%m-%d %H:00', momento) AS hora FROM lecturas), p AS (SELECT LAG(hora) OVER (ORDER BY hora) AS a, hora AS b FROM h) SELECT a, b, CAST(round((julianday(b) - julianday(a)) * 24) AS INTEGER) - 1 FROM p WHERE (julianday(b) - julianday(a)) * 24 > 1.5 ORDER BY a;
  - |
    WITH h AS (SELECT DISTINCT strftime('%Y-%m-%d %H:00', momento) AS hora FROM lecturas WHERE datos ->> '$.ok' = 1), p AS (SELECT LAG(hora) OVER (ORDER BY hora) AS a, hora AS b FROM h) SELECT a, b, CAST(round((julianday(b) - julianday(a)) * 24) AS INTEGER) FROM p WHERE (julianday(b) - julianday(a)) * 24 > 1.5 ORDER BY a;
  - |
    WITH h AS (SELECT DISTINCT strftime('%Y-%m-%d %H:00', momento) AS hora FROM lecturas WHERE datos ->> '$.ok' = 'true'), p AS (SELECT LAG(hora) OVER (ORDER BY hora) AS a, hora AS b FROM h) SELECT a, b, CAST(round((julianday(b) - julianday(a)) * 24) AS INTEGER) - 1 FROM p WHERE (julianday(b) - julianday(a)) * 24 > 1.5 ORDER BY a;
  - |
    WITH h AS (SELECT DISTINCT strftime('%H', momento) AS hora, date(momento) AS d FROM lecturas WHERE datos ->> '$.ok' = 1), p AS (SELECT d, LAG(hora) OVER (PARTITION BY d ORDER BY hora) AS a, hora AS b FROM h) SELECT d || ' ' || a || ':00', d || ' ' || b || ':00', b - a - 1 FROM p WHERE b - a > 1 ORDER BY 1;
```

## Misión final

```exercise
id: sql11-mision-culpable
type: mission
title: La firma en el firmware
prompt: |
  **Lista las actualizaciones a la versión 2.6.0 desde el viernes 20 con el nombre del robot (`robot`), el `momento`, el `usuario` que la instaló, el `equipo` y el nombre de la persona (`autor`) que firmó versiones publicadas con ese mismo usuario.** Ordena por momento. Después nombra al culpable.

  Las actualizaciones son filas de `lecturas` con `sensor = 'sistema'`: la versión nueva está en `'$.a'`, el usuario en `'$.usuario'` y el equipo en `'$.equipo'`. En `firmwares`, `notas` es un JSON con el `usuario` de quien programó cada versión publicada, y `autor_id` apunta a `personas`. Cuidado: una persona firmó muchas versiones, y un `JOIN` directo repetiría cada fila (sesión 5).

  Cuando la consulta lo pruebe y respondas, junto con el juez, se cierra el expediente y se abre la sesión 12.
visual:
  - escenario:
      case: sensores
  - esquema:
      tables: [lecturas, robots, firmwares, personas]
  - figure:
      title: El hilo que hay que seguir
      panes:
        - label: "lecturas.datos (sistema)"
          value: "usuario: ?"
        - label: "firmwares.notas"
          value: "usuario → autor_id"
        - label: personas
          value: "nombre"
starter: |
  SELECT robot_id, momento, datos
  FROM lecturas
  WHERE sensor = 'sistema'
    AND momento >= '2026-03-20';
solution: |
  WITH autores AS (
    SELECT DISTINCT notas ->> '$.usuario' AS usuario, autor_id
    FROM firmwares
  )
  SELECT r.nombre AS robot, l.momento,
         l.datos ->> '$.usuario' AS usuario,
         l.datos ->> '$.equipo' AS equipo,
         p.nombre AS autor
  FROM lecturas AS l
  JOIN robots AS r ON r.id = l.robot_id
  JOIN autores AS a ON a.usuario = l.datos ->> '$.usuario'
  JOIN personas AS p ON p.id = a.autor_id
  WHERE l.sensor = 'sistema'
    AND l.momento >= '2026-03-20'
    AND l.datos ->> '$.a' = '2.6.0'
  ORDER BY l.momento;
answer: Gonzalo Pumacayo Tello
answerLabel: ¿Quién saboteó los robots? (nombre completo)
reveal: |
  **Gonzalo Pumacayo Tello.** Las tres actualizaciones a la 2.6.0 (Tika a las 02:09 y Kusi a las 02:14 del martes 24; Pituco a las 02:29 del jueves 26) las hizo el usuario **gpumacayo** desde el equipo **LAP-07**: el mismo usuario con el que Gonzalo firmó 27 versiones del firmware hasta que se fue en febrero. Las tres ocurrieron mientras la tarjeta perdida de Wilmer estaba adentro, y sus parches movieron el giroscopio y apagaron la verificación de la calibración. Gonzalo dijo que esas noches estuvo en su casa y que su tarjeta ya no abría nada; no necesitaba la suya. **Expediente SEN-0327 cerrado.**
hints:
  - "Arma primero los usuarios de `firmwares` sin repetir: `WITH autores AS (SELECT DISTINCT notas ->> '$.usuario' AS usuario, autor_id FROM firmwares)`."
  - "Une las actualizaciones con `autores` por el usuario (`a.usuario = l.datos ->> '$.usuario'`) y con `personas` por `autor_id`. Filtra `l.datos ->> '$.a' = '2.6.0'`."
tests:
  - name: las tres actualizaciones con su autor, en orden
    same: SELECT r.nombre, l.momento, json_extract(l.datos, '$.usuario'), json_extract(l.datos, '$.equipo'), pe.nombre FROM lecturas AS l JOIN robots AS r ON r.id = l.robot_id JOIN (SELECT DISTINCT json_extract(notas, '$.usuario') AS u, autor_id FROM firmwares) AS f ON f.u = json_extract(l.datos, '$.usuario') JOIN personas AS pe ON pe.id = f.autor_id WHERE l.sensor = 'sistema' AND l.momento >= '2026-03-20' AND json_extract(l.datos, '$.a') = '2.6.0' ORDER BY l.momento
    ordered: true
  - name: columnas robot, momento, usuario, equipo y autor
    columns: [robot, momento, usuario, equipo, autor]
```

## Reto experto

```exercise
id: sql11-reto-historial
type: challenge
title: El historial de cada robot en una celda
prompt: |
  **Para cada robot con lecturas desde el viernes 20, arma su historial de firmware como una lista JSON con las versiones en el orden en que aparecieron por primera vez: columnas `robot` (su nombre) y `versiones`, por nombre de robot.** Las filas del sensor `'sistema'` no cuentan.

  Para quien ya programa: primero la primera aparición de cada versión en cada robot (`min(momento)` con `GROUP BY`), después `json_group_array(version ORDER BY desde)`. El `ORDER BY` dentro de un agregado existe en SQLite desde la 3.44; antes había que ordenar en una subconsulta y confiar en que el motor respetara ese orden.
starter: |
  SELECT robot_id, datos ->> '$.firmware' AS version
  FROM lecturas
  WHERE momento >= '2026-03-20'
  LIMIT 5;
solution: |
  WITH primeras AS (
    SELECT robot_id, datos ->> '$.firmware' AS version, min(momento) AS desde
    FROM lecturas
    WHERE momento >= '2026-03-20'
      AND sensor <> 'sistema'
    GROUP BY robot_id, version
  )
  SELECT r.nombre AS robot,
         json_group_array(p.version ORDER BY p.desde) AS versiones
  FROM primeras AS p
  JOIN robots AS r ON r.id = p.robot_id
  GROUP BY r.nombre
  ORDER BY r.nombre;
hints:
  - "Los robots sin sabotaje terminan en `[\"2.5.8\",\"2.5.9\"]`; los saboteados tienen una versión más."
tests:
  - name: el historial de cada robot
    same: WITH x AS (SELECT robot_id, json_extract(datos, '$.firmware') AS v, min(momento) AS d FROM lecturas WHERE momento >= '2026-03-20' AND sensor <> 'sistema' GROUP BY robot_id, v) SELECT r.nombre, json_group_array(x.v ORDER BY x.d) FROM x JOIN robots AS r ON r.id = x.robot_id GROUP BY r.nombre ORDER BY r.nombre
    ordered: true
  - name: columnas robot y versiones
    columns: [robot, versiones]
  - name: usa json_group_array
    source: '\bjson_group_array\s*\('
```
