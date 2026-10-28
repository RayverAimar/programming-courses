# Sesión 2 — Filtros, NULL y DISTINCT

```session
case: surquillo
```

## El encargo

Domingo 15 de marzo. En la pizarra de Loop hay cinco números de persona: **731, 905, 1046, 412 y 377**, las cinco salidas por la Puerta 3 después de que el giroscopio de Wayra dejara de responder. Cinco sospechosos son demasiados para la comisaría. Chasqui encontró que la vigilante, **Marleny Quispe**, dio su declaración el sábado: está en la tabla `entrevistas`, palabra por palabra.

Hoy vas a filtrar con más precisión: varias condiciones a la vez, listas de valores, textos que se parecen, y el dato más traicionero de SQL, el que significa **"no sabemos"**: `NULL`.

```escenario
case: surquillo
title: Lo que llevamos
caption: "Las pistas de la sesión 1 ya están en el mapa. Las de hoy aparecen al resolver el caso y la misión."
```

```expediente
title: Lo que sabemos de los cinco
cards:
  - name: "731"
    kind: unknown
    rows: [["Salió", "22:46:12"]]
  - name: "905"
    kind: unknown
    rows: [["Salió", "22:58:40"]]
  - name: "1046"
    kind: unknown
    rows: [["Salió", "23:04:05"]]
  - name: "412"
    kind: unknown
    rows: [["Salió", "23:12:51"]]
  - name: "377"
    kind: unknown
    rows: [["Salió", "23:21:30"]]
```

## Lo mínimo

`WHERE` acepta cualquier condición que dé verdadero o falso. Hoy se suman cinco herramientas:

- **`AND`, `OR`, `NOT`**, con paréntesis. `AND` se evalúa **antes** que `OR`, como la multiplicación antes que la suma.
- **`IN (…)`**: `persona_id IN (731, 905, 1046)` es lo mismo que tres `=` unidos con `OR`, pero se lee mejor.
- **`BETWEEN a AND b`**: entre `a` y `b`, **incluidos los dos extremos**.
- **`LIKE`** compara con un patrón: `%` es "cualquier cantidad de caracteres" y `_` es "exactamente uno". `nombre LIKE 'Marleny%'` encuentra a todas las Marleny. En SQLite, `LIKE` no distingue mayúsculas, pero solo en letras sin tilde: `'ó'` y `'Ó'` son distintas.
- **`DISTINCT`** quita las filas repetidas del resultado.

```figura
title: "Qué encuentra cada patrón"
table:
  head: ["patrón", "sí encuentra", "no encuentra"]
  rows:
    - ["`'Marleny%'`", "Marleny, Marleny Quispe", "Ana Marleny (hay algo antes)"]
    - ["`'M_rleny'`", "Marleny, Merleny", "Mrleny (falta un carácter), Marleny Quispe"]
    - ["`'%47%'`", "Puesto 47, 47, Local 4700", "Puesto 4 7"]
```

```sql run
SELECT nombre, distrito, telefono
FROM personas
WHERE nombre LIKE 'marleny%'
  AND distrito IN ('Surquillo', 'Miraflores', 'Barranco')
ORDER BY nombre;
```

### NULL: "no sabemos"

En la tabla `vehiculos`, algunos colores están vacíos: nadie los registró. Eso es `NULL`. No es cero, ni un texto vacío: es **un valor desconocido**. Y con un desconocido, las comparaciones tampoco se saben: `color = 'blanco'` no es verdadero ni falso cuando `color` es `NULL`, es **`NULL`**. SQL tiene una **lógica de tres valores**:

```logica
title: Verdadero, falso y desconocido
caption: "`WHERE` solo deja pasar las filas donde la condición es **TRUE**. Las que dan FALSE **o NULL** se van."
```

Por eso, para preguntar por un dato que falta se usa **`IS NULL`** (o `IS NOT NULL`), nunca `= NULL`. Mira cuántos autos aparecen con cada condición:

```sql run
SELECT 'blanco' AS caso, count(*) FROM vehiculos
WHERE color = 'blanco'
UNION ALL
SELECT 'no blanco', count(*) FROM vehiculos
WHERE color <> 'blanco'
UNION ALL
SELECT 'IS NULL', count(*) FROM vehiculos
WHERE color IS NULL
UNION ALL
SELECT 'todos', count(*) FROM vehiculos;
```

`count(*)` cuenta filas (lo verás a fondo en la sesión 4) y `UNION ALL` pega varios resultados uno debajo de otro. Suma: los blancos más los no blancos **no** dan el total. Faltan justo los de color `NULL`: no son blancos ni no blancos, son desconocidos.

```resultado
title: Los autos de los cinco salientes
query: |
  SELECT persona_id, placa, color
  FROM vehiculos
  WHERE persona_id IN (731, 905, 1046, 412, 377);
caption: "Cuatro autos para cinco personas. El de la 377 no tiene color: `WHERE color = 'blanco'` lo descartaría, pero no sabemos si es blanco."
```

```figura
title: "Por qué `3 NOT IN (1, 2, NULL)` no devuelve nada"
table:
  head: ["paso", "queda"]
  rows:
    - ["`3 <> 1`", "VERDADERO"]
    - ["`3 <> 2`", "VERDADERO"]
    - ["`3 <> NULL`", "NULL (no se sabe)"]
    - ["Las tres unidas con `AND`", "**NULL**: la fila no pasa el `WHERE`"]
```

> **Trampa común:** `NOT IN` con un `NULL` en la lista no devuelve **nada**. `3 NOT IN (1, 2, NULL)` significa `3 <> 1 AND 3 <> 2 AND 3 <> NULL`, y lo último es `NULL`, así que todo es `NULL`. Si la lista viene de una columna que puede tener vacíos, quítalos antes (`WHERE … IS NOT NULL`) o usa `NOT EXISTS`, que verás en la sesión 7.

<!-- legacy: is-null -->

<!-- mdn: is-null -->

## Práctica

```exercise
id: sql2-predice-precedencia
type: predict
title: AND antes que OR
prompt: |
  En SQLite, `1` es verdadero y `0` es falso. ¿Qué devuelve?
code: |
  SELECT 1 OR 0 AND 0, (1 OR 0) AND 0;
options:
  - "1 | 0"
  - "0 | 0"
  - "1 | 1"
  - "0 | 1"
answer: "1 | 0"
explain: |
  `AND` va primero: `1 OR (0 AND 0)` es `1 OR 0`, verdadero. Con paréntesis cambia el orden: `(1 OR 0) AND 0` es `1 AND 0`, falso. Cuando mezcles `AND` y `OR`, pon paréntesis siempre.
```

```exercise
id: sql2-predice-null
type: predict
title: Comparar con lo desconocido
prompt: |
  ¿Qué devuelve cada columna?
code: |
  SELECT NULL = NULL, NULL IS NULL, 5 <> NULL, NULL OR 1, NULL AND 0;
options:
  - "NULL | 1 | NULL | 1 | 0"
  - "1 | 1 | 1 | 1 | 0"
  - "0 | 1 | 1 | 1 | 0"
  - "NULL | 1 | NULL | NULL | NULL"
answer: "NULL | 1 | NULL | 1 | 0"
explain: |
  Dos desconocidos no se pueden comparar: `NULL = NULL` es `NULL`, y lo mismo `5 <> NULL`. `IS NULL` sí responde: 1. Pero `NULL OR 1` es verdadero (sea lo que sea, con un verdadero basta) y `NULL AND 0` es falso (con un falso basta). Es la tabla de arriba.
```

```exercise
id: sql2-predice-notin
type: predict
title: El NULL que se cuela en la lista
prompt: |
  ¿Qué devuelve?
code: |
  SELECT 3 NOT IN (1, 2), 3 NOT IN (1, 2, NULL), 1 IN (1, NULL);
options:
  - "1 | NULL | 1"
  - "1 | 1 | 1"
  - "1 | 0 | NULL"
  - "1 | NULL | NULL"
answer: "1 | NULL | 1"
explain: |
  `3 NOT IN (1, 2, NULL)` pregunta si 3 es distinto de 1, de 2 **y** de un desconocido: no se sabe, `NULL`. En un `WHERE`, esa fila se iría. En cambio `1 IN (1, NULL)` encuentra el 1 y ya es verdadero.
```

```exercise
id: sql2-completa-in
type: complete
title: Las cámaras de dos distritos
prompt: |
  Lista el **código** de las cámaras de **Surquillo y Barranco**, ordenadas por código, usando `IN`. Reemplaza los `___`.
starter: |
  SELECT codigo
  FROM camaras
  WHERE distrito ___ (___, ___)
  ORDER BY codigo;
solution: |
  SELECT codigo
  FROM camaras
  WHERE distrito IN ('Surquillo', 'Barranco')
  ORDER BY codigo;
hints:
  - "`IN` va seguido de una lista entre paréntesis, separada por comas."
tests:
  - name: las cámaras de Surquillo y Barranco, ordenadas
    same: SELECT codigo FROM camaras WHERE distrito IN ('Surquillo', 'Barranco') ORDER BY codigo
    ordered: true
  - name: usa IN
    source: '\bIN\s*\('
```

```exercise
id: sql2-arregla-null
type: fix
title: Los autos sin color
prompt: |
  La comisaría pidió las **placas de los autos sin color registrado**, ordenadas. Esta consulta no devuelve ninguna fila, aunque hay varios. Arréglala.
starter: |
  SELECT placa
  FROM vehiculos
  WHERE color = NULL
  ORDER BY placa;
solution: |
  SELECT placa
  FROM vehiculos
  WHERE color IS NULL
  ORDER BY placa;
hints:
  - "`color = NULL` es siempre `NULL`, nunca verdadero."
tests:
  - name: las placas sin color, ordenadas
    same: SELECT placa FROM vehiculos WHERE color IS NULL ORDER BY placa
    ordered: true
```

```exercise
id: sql2-arregla-parentesis
type: fix
title: Robos y estafas de Surquillo
prompt: |
  Esta consulta debería traer el `id`, el `tipo` y el `distrito` de las denuncias de **robo o estafa en Surquillo**. Pero salen robos de todo Lima. Ejecútala, mira la columna `distrito` y arréglala.
starter: |
  SELECT id, tipo, distrito
  FROM denuncias
  WHERE tipo = 'robo' OR tipo = 'estafa' AND distrito = 'Surquillo'
  ORDER BY id;
solution: |
  SELECT id, tipo, distrito
  FROM denuncias
  WHERE (tipo = 'robo' OR tipo = 'estafa') AND distrito = 'Surquillo'
  ORDER BY id;
hints:
  - "`AND` se evalúa antes que `OR`: la consulta dice «robo en cualquier lado, o estafa en Surquillo»."
  - "Paréntesis alrededor del `OR`, o `tipo IN ('robo', 'estafa')`."
tests:
  - name: solo robos y estafas de Surquillo
    same: SELECT id, tipo, distrito FROM denuncias WHERE tipo IN ('robo', 'estafa') AND distrito = 'Surquillo' ORDER BY id
    ordered: true
```

```exercise
id: sql2-escribe-like
type: write
title: Las vigilantes de Surquillo
prompt: |
  Lista el **nombre** y el **teléfono** de las personas de **Surquillo** que trabajan de **vigilante** y cuyo nombre **empieza con M o con D**, ordenadas por nombre. Usa `LIKE`.
starter: |
  SELECT nombre, telefono
  FROM personas
  WHERE distrito = 'Surquillo';
solution: |
  SELECT nombre, telefono
  FROM personas
  WHERE distrito = 'Surquillo'
    AND ocupacion = 'vigilante'
    AND (nombre LIKE 'M%' OR nombre LIKE 'D%')
  ORDER BY nombre;
hints:
  - "`nombre LIKE 'M%'`: empieza con M y después cualquier cosa."
  - Las dos opciones de nombre van con `OR`, entre paréntesis, porque el resto va con `AND`.
tests:
  - name: las vigilantes con M o D, ordenadas
    same: SELECT nombre, telefono FROM personas WHERE distrito = 'Surquillo' AND ocupacion = 'vigilante' AND (nombre LIKE 'M%' OR nombre LIKE 'D%') ORDER BY nombre
    ordered: true
  - name: usa LIKE
    source: '\bLIKE\b'
```

```exercise
id: sql2-escribe-distinct
type: write
title: Qué pasó en Surquillo el viernes
prompt: |
  ¿Qué **tipos** de denuncia hubo en **Surquillo el viernes 13 de marzo**? Devuelve cada tipo **una sola vez**, en orden alfabético.
starter: |
  SELECT tipo
  FROM denuncias
  WHERE distrito = 'Surquillo';
solution: |
  SELECT DISTINCT tipo
  FROM denuncias
  WHERE distrito = 'Surquillo' AND fecha = '2026-03-13'
  ORDER BY tipo;
hints:
  - "`SELECT DISTINCT tipo` quita los repetidos."
tests:
  - name: cada tipo una vez, en orden
    same: SELECT DISTINCT tipo FROM denuncias WHERE distrito = 'Surquillo' AND fecha = '2026-03-13' ORDER BY tipo
    ordered: true
```

## El caso

```exercise
id: sql2-caso-entrevista
type: case
title: Lo que vio Marleny
prompt: |
  **Encuentra la declaración de Marleny Quispe en `entrevistas` y léela: ¿de qué color era el auto al que se subió la persona?**

  La tabla `entrevistas` tiene `persona_id`, `fecha`, `caso` y `transcripcion`. No tiene el nombre: primero busca el `id` de Marleny en `personas` (con `LIKE`, porque no sabes su nombre completo), y después su entrevista. Otra forma: busca en las transcripciones las que mencionan la **Puerta 3**.
visual:
  expediente:
    cards:
      - name: Marleny Quispe Apaza
        traits: { style: cap, capColor: "#2f3a4a", shirt: "#2f3a4a" }
        role: Vigilante de noche del mercado
        rows: [["Turno", "19:55 a 06:05"], ["Ronda", "cada media hora"]]
        quote: "Yo lo vi todo desde el pasillo F."
starter: |
  -- Paso 1: el id de Marleny.
  SELECT id, nombre
  FROM personas
  WHERE nombre = 'Marleny';
solution: |
  SELECT persona_id, fecha, transcripcion
  FROM entrevistas
  WHERE transcripcion LIKE '%Puerta 3%';
answer: blanco
answerLabel: ¿De qué color era el auto?
reveal: |
  **Blanco.** Marleny vio a alguien con capucha y una caja de herramientas salir como a las 22:45 y subirse a un auto blanco. No vio la placa. Ahora toca ver qué autos tienen los cinco.
hints:
  - "`WHERE nombre = 'Marleny'` busca a alguien que se llame exactamente así. Prueba `nombre LIKE 'Marleny%'`."
  - "Con su `id`: `SELECT transcripcion FROM entrevistas WHERE persona_id = …`. O directo: `WHERE transcripcion LIKE '%Puerta 3%'`."
```

## El juez

Como en la sesión 1: tu consulta corre sobre las tablas del ejemplo y sobre bases ocultas. Este juez es sobre `NULL`, así que los casos ocultos están llenos de vacíos.

```exercise
id: sql2-juez-solo-correo
type: judge
title: Solo por correo
prompt: |
  **Devuelve el `id` y el `nombre` de los clientes a los que solo se puede escribir por correo: no tienen teléfono pero sí correo. Ordena por `id`.**

  Loop va a avisar a sus clientes que Wayra está en reparación. Los datos vienen de un formulario viejo: un dato que falta puede estar como `NULL` **o como texto vacío** `''`. Los dos cuentan como "no hay".

  **Tabla:** `clientes(id, nombre, telefono, correo)`.

  **Resultado:** `id` y `nombre`, ordenado por `id`.
schema: |
  CREATE TABLE clientes (id INTEGER, nombre TEXT, telefono TEXT, correo TEXT);
ordered: true
starter: |
  SELECT id, nombre
  FROM clientes
  WHERE telefono = NULL
  ORDER BY id;
solution: |
  SELECT id, nombre
  FROM clientes
  WHERE (telefono IS NULL OR telefono = '')
    AND correo IS NOT NULL AND correo <> ''
  ORDER BY id;
hints:
  - "«No tiene teléfono» son dos casos: `telefono IS NULL` o `telefono = ''`."
  - "`correo <> ''` ya es `NULL` cuando el correo es `NULL`, así que solo eso bastaría; escribir también `IS NOT NULL` lo deja claro."
samples:
  - rows:
      clientes: [[1, "Rosa", "987654321", "rosa@correo.pe"], [2, "Beto", null, "beto@correo.pe"], [3, "Nelly", "", "nelly@correo.pe"], [4, "Kike", null, null], [5, "Juana", null, ""]]
    note: Beto y Nelly no tienen teléfono (uno NULL, otro vacío) y sí correo. Kike y Juana no tienen ninguno de los dos.
  - rows:
      clientes: [[7, "Tito", "912345678", null]]
    note: "Tito tiene teléfono: no sale."
edge:
  - rows: { clientes: [] }
    tag: con la tabla vacía
  - rows: { clientes: [[1, "A", "", ""], [2, "B", null, null]] }
    tag: sin ningún dato de contacto
  - rows: { clientes: [[3, "C", "", "c@x.pe"], [1, "A", null, "a@x.pe"], [2, "B", "999", "b@x.pe"]] }
    tag: con los ids desordenados
random:
  count: 40
  seed: 202
  generate: |
    const names = ["Rosa", "Beto", "Nelly", "Kike", "Juana", "Tito", "Pancho", "Mechita", "Lucho", "Carmen"];
    const n = rng.int(0, 12);
    const ids = [];
    while (ids.length < n) { const k = rng.int(1, 60); if (!ids.includes(k)) ids.push(k); }
    const blank = () => rng.pick([null, "", null]);
    return { clientes: ids.map((id) => [id, rng.pick(names), rng.int(0, 2) ? blank() : `9${rng.int(10000000, 99999999)}`, rng.int(0, 3) ? `${id}@correo.pe` : blank()]) };
wrong:
  - |
    SELECT id, nombre FROM clientes WHERE telefono IS NULL AND correo IS NOT NULL ORDER BY id;
  - |
    SELECT id, nombre FROM clientes WHERE (telefono IS NULL OR telefono = '') AND correo IS NOT NULL ORDER BY id;
  - |
    SELECT id, nombre FROM clientes WHERE telefono IS NULL OR telefono = '' AND correo <> '' ORDER BY id;
```

## Misión final

```exercise
id: sql2-mision-autos
type: mission
title: ¿Quién pudo subirse a un auto blanco?
prompt: |
  **Lista los autos de los cinco salientes (731, 905, 1046, 412 y 377) que pueden ser el auto blanco que vio Marleny: los blancos y los que no tienen color registrado.** Muestra `persona_id`, `placa` y `color`. Después di cuántos sospechosos siguen en pie.

  Un auto sin color registrado **no se puede descartar**: no sabemos de qué color es. El que no tiene auto, o lo tiene de otro color, sí queda descartado.

  Cuando la consulta lo pruebe y respondas, junto con el juez, se abre la sesión 3.
visual:
  - escenario:
      case: surquillo
  - esquema:
      tables: [vehiculos]
starter: |
  SELECT persona_id, placa, color
  FROM vehiculos
  WHERE persona_id IN (731, 905, 1046, 412, 377)
    AND color = 'blanco';
solution: |
  SELECT persona_id, placa, color
  FROM vehiculos
  WHERE persona_id IN (731, 905, 1046, 412, 377)
    AND (color = 'blanco' OR color IS NULL);
answer: "3"
answerLabel: ¿Cuántos sospechosos siguen en pie?
reveal: |
  **Tres:** Renzo Huamaní (731) y Lucía Paredes (412) tienen auto blanco, y el de Julio Ccahuana (377) no tiene color registrado. Óscar (905) no tiene auto y el de Fiorella (1046) es rojo: descartados. Mira la pizarra: ya tienen nombre y cara.
hints:
  - "Las dos posibilidades van con `OR` y entre paréntesis: `(color = 'blanco' OR color IS NULL)`."
tests:
  - name: los autos blancos o sin color de los cinco
    same: SELECT persona_id, placa, color FROM vehiculos WHERE persona_id IN (731, 905, 1046, 412, 377) AND (color = 'blanco' OR color IS NULL)
  - name: pregunta por el color desconocido con IS NULL
    source: '\bIS\s+NULL\b'
    msg: Un color que falta se pregunta con IS NULL.
```

## Reto experto

```exercise
id: sql2-reto-descartados
type: challenge
title: Ni blancos ni rojos
prompt: |
  **Devuelve las placas de todos los autos que con seguridad no son ni blancos ni rojos, y aparte (en otra consulta) las de los que no se puede saber.** Cada consulta, ordenada por placa.

  Para quien ya programa: es el `NOT IN` con `NULL` de la trampa, pero al revés. Con `color NOT IN ('blanco', 'rojo')`, ¿dónde quedan los `NULL`? Escribe las dos consultas, una debajo de otra; el juez busca la de los desconocidos y revisa que la otra use `NOT IN`.
starter: |
  -- Con seguridad ni blancos ni rojos:

  -- No se puede saber:
solution: |
  SELECT placa FROM vehiculos
  WHERE color NOT IN ('blanco', 'rojo')
  ORDER BY placa;

  SELECT placa FROM vehiculos
  WHERE color IS NULL
  ORDER BY placa;
hints:
  - "`color NOT IN ('blanco', 'rojo')` es `NULL` cuando el color es `NULL`, así que esas filas ya no salen: la primera consulta está bien así."
tests:
  - name: una consulta trae los de color desconocido
    same: SELECT placa FROM vehiculos WHERE color IS NULL ORDER BY placa
    ordered: true
  - name: la otra usa NOT IN
    source: '\bNOT\s+IN\s*\('
```
