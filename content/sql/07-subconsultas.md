# Sesión 7 — Subconsultas

```session
case: pagos
```

## El encargo

Miércoles 25 de marzo. Toda la plata de los adelantos termina en el celular de **Milagros Tello**, una cajera de Surquillo. Ella dio su declaración esta mañana: dice que Kevin y Brenda le **devolvían plata que les prestó**. Chasqui no le cree, pero una sospecha no es una prueba. Hay que saber **qué hace Milagros con la plata** y **cuánto** recibió en total.

Las preguntas de hoy tienen una pregunta adentro: "los pagos de Milagros **más grandes que su propio promedio**", "lo que recibió **de los números que cobraron adelantos**". Para escribirlas en una sola consulta, metes una consulta dentro de otra: una **subconsulta**.

```escenario
case: pagos
title: Lo que llevamos
caption: "Ya sabemos a dónde salta la plata. Hoy la seguimos un paso más."
```

```expediente
title: La declaración de Milagros
cards:
  - name: Milagros Tello Benavides
    traits: { style: bun, shirt: "#8a5cc4", earrings: true }
    role: Cajera, vive en Surquillo
    rows: [["Recibió", "14 pagos de los cobradores"], ["Declaró", "25 de marzo"]]
    quote: "Me devolvían plata que les presté, nada más."
```

## Lo mínimo

Una **subconsulta** es un `SELECT` entre paréntesis, adentro de otra consulta. Según lo que devuelve, va en distintos lugares:

- **Un solo valor** (una fila, una columna): una **subconsulta escalar**. Va donde iría un número: `WHERE monto > (SELECT avg(monto) FROM transferencias)`.
- **Una lista** (una columna, muchas filas): va después de **`IN`**. `WHERE telefono IN (SELECT a_telefono FROM transferencias WHERE mensaje LIKE 'adelanto%')`.
- **Una tabla entera**: va en el **`FROM`**, con un alias, y se usa como cualquier tabla. Se llama **tabla derivada**.

```sql run
SELECT nombre, telefono
FROM personas
WHERE telefono IN (
  SELECT a_telefono
  FROM transferencias
  WHERE mensaje LIKE 'adelanto%'
)
ORDER BY nombre;
```

Esas subconsultas **no dependen de la fila de afuera**: SQLite las calcula **una vez** y usa el resultado para todas las filas. Una subconsulta **correlacionada**, en cambio, menciona una columna de la consulta de afuera (`p.de`), así que su resultado cambia con cada fila y el motor **la vuelve a correr por cada fila**. Dale a ▶ y cuenta las veces:

```correlada
title: El promedio de cada pagador, fila por fila
query: |
  SELECT id, de, monto
  FROM pagos AS p
  WHERE monto > (SELECT avg(monto) FROM pagos AS q WHERE q.de = p.de)
  ORDER BY id;
tables:
  pagos:
    cols: [id, de, monto]
    rows: [[1, A, 20], [2, B, 300], [3, A, 50], [4, A, 80], [5, B, 100], [6, C, 40]]
outer: SELECT id, de, monto FROM pagos ORDER BY id
inner: SELECT avg(monto) FROM pagos AS q WHERE q.de = :de
keep: ":monto > :sub"
subLabel: promedio de su pagador
caption: "Cada fila compara su monto con el promedio **de su propio pagador**: A promedia 50, B 200 y C 40. La subconsulta corre seis veces, una por fila. Con seis filas da igual; con seis mil, en la sesión 14 verás cómo el planificador la convierte en un join."
```

**Una tabla derivada** es útil cuando primero quieres agrupar y después filtrar o unir el resultado:

```sql run
SELECT r.a_telefono, r.total
FROM (
  SELECT a_telefono, SUM(monto) AS total
  FROM transferencias
  GROUP BY a_telefono
) AS r
WHERE r.total > 4000
ORDER BY r.total DESC;
```

**`NOT IN` y el `NULL`, otra vez.** En la sesión 2 viste que `3 NOT IN (1, 2, NULL)` es `NULL`. Con una subconsulta es peor, porque no ves la lista. En `personas` hay teléfonos en `NULL`, así que esto devuelve **cero filas**, aunque hay números que no son de nadie:

```sql run
SELECT DISTINCT a_telefono
FROM transferencias
WHERE a_telefono NOT IN (SELECT telefono FROM personas);
```

```figura
title: Por qué NOT IN se queda vacío
input: { label: "a_telefono NOT IN (…, '969785259', NULL, …)", value: "'951207384' <> todos los teléfonos … AND '951207384' <> NULL" }
arrow: "TRUE AND … AND NULL"
output: { label: "Resultado", value: "NULL → la fila se va" }
steps:
  - "`NOT IN` es una cadena de `<>` unidos con `AND`. Uno solo de ellos contra `NULL` da `NULL`, y el `WHERE` descarta la fila."
  - "`NOT EXISTS (SELECT 1 FROM personas AS p WHERE p.telefono = t.a_telefono)` pregunta otra cosa: ¿hay alguna fila que coincida? Eso siempre es verdadero o falso."
```

> **Trampa común:** usa `NOT EXISTS` en vez de `NOT IN` cuando la lista sale de una columna que puede tener `NULL`. Y cuidado con las subconsultas escalares: si la tuya devuelve **más de una fila**, SQLite toma la primera sin avisar (PostgreSQL da error: *more than one row returned by a subquery*). Si esperas un solo valor, asegúrate con un `WHERE` por clave, un agregado o `LIMIT 1`.

<!-- legacy: not-exists -->

<!-- mdn: not-exists -->

## Práctica

```exercise
id: sql7-predice-escalar
type: predict
title: Dos preguntas en una fila
prompt: |
  Hay 24 cámaras; las de Surquillo tienen los `id` del 1 al 4. ¿Qué devuelve?
code: |
  SELECT (SELECT count(*) FROM camaras),
         (SELECT max(id) FROM camaras WHERE distrito = 'Surquillo');
options:
  - "24 | 4"
  - "24 | 24"
  - "4 | 24"
  - "24 | 1"
answer: "24 | 4"
explain: |
  Cada subconsulta escalar devuelve un valor y ocupa una columna. Un `SELECT` sin `FROM` también es válido en SQLite: calcula una sola fila.
```

```exercise
id: sql7-predice-null
type: predict
title: El NULL en la subconsulta
prompt: |
  `SELECT 1 UNION ALL SELECT NULL` es una lista con dos valores: 1 y `NULL`. ¿Qué devuelve?
code: |
  SELECT 5 NOT IN (SELECT 1 UNION ALL SELECT NULL),
         1 IN (SELECT 1 UNION ALL SELECT NULL),
         NOT EXISTS (SELECT 1 WHERE 5 = NULL);
options:
  - "NULL | 1 | 1"
  - "1 | 1 | 1"
  - "0 | 1 | 0"
  - "NULL | NULL | 1"
answer: "NULL | 1 | 1"
explain: |
  `5 NOT IN (1, NULL)` no se puede decidir: `NULL`. `1 IN (1, NULL)` encuentra el 1: verdadero. En el `EXISTS`, `5 = NULL` no es verdadero, así que la subconsulta no devuelve filas y `NOT EXISTS` es verdadero: nunca da `NULL`.
```

```exercise
id: sql7-completa-in
type: complete
title: Quiénes cobraron
prompt: |
  Lista el **nombre** de las personas cuyo teléfono **recibió al menos un adelanto**, en orden alfabético. Usa `IN` con una subconsulta. Reemplaza los `___`.
starter: |
  SELECT nombre
  FROM personas
  WHERE telefono ___ (
    SELECT ___
    FROM transferencias
    WHERE mensaje LIKE 'adelanto%'
  )
  ORDER BY nombre;
solution: |
  SELECT nombre
  FROM personas
  WHERE telefono IN (
    SELECT a_telefono
    FROM transferencias
    WHERE mensaje LIKE 'adelanto%'
  )
  ORDER BY nombre;
hints:
  - "La subconsulta devuelve la lista de teléfonos que **recibieron**: la columna `a_telefono`."
tests:
  - name: los cobradores con nombre, en orden
    same: SELECT DISTINCT p.nombre FROM personas AS p JOIN transferencias AS t ON t.a_telefono = p.telefono WHERE t.mensaje LIKE 'adelanto%' ORDER BY p.nombre
    ordered: true
  - name: usa IN con una subconsulta
    source: '\bIN\s*\(\s*SELECT\b'
```

```exercise
id: sql7-arregla-not-in
type: fix
title: Números sin dueño
prompt: |
  Se busca **cada número que recibió plata y no es de nadie** en el padrón, una vez cada uno y ordenados. La consulta no devuelve nada, aunque ya sabes que el chip 951207384 es uno de ellos. Arréglala.
starter: |
  SELECT DISTINCT a_telefono
  FROM transferencias
  WHERE a_telefono NOT IN (SELECT telefono FROM personas)
  ORDER BY a_telefono;
solution: |
  SELECT DISTINCT t.a_telefono
  FROM transferencias AS t
  WHERE NOT EXISTS (
    SELECT 1 FROM personas AS p
    WHERE p.telefono = t.a_telefono
  )
  ORDER BY t.a_telefono;
hints:
  - "Algunas personas tienen el teléfono en `NULL`, y un solo `NULL` en la lista vuelve `NULL` todo el `NOT IN`."
  - "`NOT EXISTS (SELECT 1 FROM personas AS p WHERE p.telefono = t.a_telefono)`. Otra salida: `NOT IN (SELECT telefono FROM personas WHERE telefono IS NOT NULL)`."
tests:
  - name: los números sin dueño, una vez y en orden
    same: SELECT DISTINCT t.a_telefono FROM transferencias AS t LEFT JOIN personas AS p ON p.telefono = t.a_telefono WHERE p.id IS NULL ORDER BY 1
    ordered: true
```

```exercise
id: sql7-escribe-ultimo
type: write
title: El último adelanto de cada cobrador
prompt: |
  Para cada número que cobró adelantos, muestra su **último** adelanto: `a_telefono`, `monto` y `momento`, ordenado por `momento`. Usa una subconsulta correlacionada que busque el momento más reciente **de ese mismo número**.
visual:
  correlada:
    sketch: true
    query: |
      SELECT a_telefono, monto, momento
      FROM transferencias AS t
      WHERE momento = (SELECT max(momento) FROM transferencias AS u
                       WHERE u.a_telefono = t.a_telefono AND …)
    tables:
      t:
        cols: [a_telefono, monto, momento]
        rows: [["911", 300, "03-03"], ["955", 450, "03-04"], ["911", 250, "03-09"], ["955", 380, "03-05"]]
    outer: SELECT a_telefono, monto, momento FROM t
    inner: SELECT max(momento) FROM t AS u WHERE u.a_telefono = :a_telefono
    keep: ":momento = :sub"
    subLabel: max(momento) de su número
starter: |
  SELECT a_telefono, monto, momento
  FROM transferencias
  WHERE mensaje LIKE 'adelanto%'
  ORDER BY a_telefono, momento;
solution: |
  SELECT t.a_telefono, t.monto, t.momento
  FROM transferencias AS t
  WHERE t.mensaje LIKE 'adelanto%'
    AND t.momento = (
      SELECT max(u.momento)
      FROM transferencias AS u
      WHERE u.a_telefono = t.a_telefono
        AND u.mensaje LIKE 'adelanto%'
    )
  ORDER BY t.momento;
hints:
  - "La subconsulta mira a la fila de afuera: `WHERE u.a_telefono = t.a_telefono`. Así calcula el máximo de cada número, no el de todos."
  - No te olvides del `LIKE 'adelanto%'` también adentro, o el último pago de un número podría ser otro.
tests:
  - name: el último adelanto de cada número, por momento
    same: SELECT t.a_telefono, t.monto, t.momento FROM transferencias AS t JOIN (SELECT a_telefono, max(momento) AS m FROM transferencias WHERE mensaje LIKE 'adelanto%' GROUP BY a_telefono) AS u ON u.a_telefono = t.a_telefono AND u.m = t.momento ORDER BY t.momento
    ordered: true
```

```exercise
id: sql7-escribe-inquilinos
type: write
title: Los inquilinos de Teodoro
prompt: |
  Milagros le paga a **Teodoro Huanca Cruz** un "alquiler marzo". Lista el **nombre** de todas las personas que le pagaron a Teodoro con un mensaje que empieza con `alquiler`, en orden alfabético. Hazlo **solo con subconsultas**: una para el teléfono de Teodoro y otra para la lista de los que le pagaron.
starter: |
  SELECT telefono
  FROM personas
  WHERE nombre = 'Teodoro Huanca Cruz';
solution: |
  SELECT nombre
  FROM personas
  WHERE telefono IN (
    SELECT de_telefono
    FROM transferencias
    WHERE mensaje LIKE 'alquiler%'
      AND a_telefono = (SELECT telefono FROM personas WHERE nombre = 'Teodoro Huanca Cruz')
  )
  ORDER BY nombre;
hints:
  - "De adentro hacia afuera: `(SELECT telefono FROM personas WHERE nombre = 'Teodoro Huanca Cruz')` es un valor; úsalo en `a_telefono = (…)`."
  - "Esa consulta devuelve los `de_telefono` que le pagaron; afuera, `WHERE telefono IN (…)`."
tests:
  - name: quienes le pagaron alquiler a Teodoro, en orden
    same: SELECT DISTINCT p.nombre FROM personas AS p JOIN transferencias AS t ON t.de_telefono = p.telefono JOIN personas AS q ON q.telefono = t.a_telefono WHERE q.nombre = 'Teodoro Huanca Cruz' AND t.mensaje LIKE 'alquiler%' ORDER BY p.nombre
    ordered: true
  - name: sin JOIN, con subconsultas
    sourceNot: '\bJOIN\b'
```

## El caso

```exercise
id: sql7-caso-grandes
type: case
title: Los pagos grandes de Milagros
prompt: |
  **¿Quién recibió más pagos de Milagros por encima del promedio de sus propios pagos?** Escribe su nombre completo.

  Milagros hace pagos chicos (menú, pasajes) y algunos grandes. Compara cada pago suyo con **su** promedio, calculado en una subconsulta, y une el resultado con `personas` para ver quién recibe. Lee también los mensajes.
visual:
  - escenario:
      case: pagos
  - figure:
      title: Una vara para medir
      input: { label: "pagos de Milagros", value: "15 · 3.5 · 900 · 1800 · …" }
      arrow: "monto > (SELECT avg(monto) …)"
      output: { label: "los que pasan la vara", value: "?" }
starter: |
  -- Los pagos que hizo Milagros en marzo
  SELECT momento, a_telefono, monto, mensaje
  FROM transferencias
  WHERE de_telefono = (SELECT telefono FROM personas WHERE nombre = 'Milagros Tello Benavides')
  ORDER BY momento;
solution: |
  SELECT t.momento, r.nombre, t.monto, t.mensaje
  FROM transferencias AS t
  JOIN personas AS r ON r.telefono = t.a_telefono
  WHERE t.de_telefono = (SELECT telefono FROM personas WHERE nombre = 'Milagros Tello Benavides')
    AND t.monto > (
      SELECT avg(monto) FROM transferencias
      WHERE de_telefono = (SELECT telefono FROM personas WHERE nombre = 'Milagros Tello Benavides')
    )
  ORDER BY t.momento;
answer: Gustavo Alvarado Zevallos
answerLabel: ¿Quién recibió más pagos grandes? (nombre completo)
reveal: |
  **Gustavo Alvarado Zevallos**, un comerciante de San Borja: S/ 1800 el 9 de marzo ("mercadería"), S/ 1900 el 16 (sin mensaje) y S/ 600 el 19 ("lo de la semana"). Su promedio es de S/ 471.79, así que también pasan la vara **Teodoro Huanca** (S/ 900, "alquiler marzo") y **Percy Tello**, su hermano (S/ 1200, "préstamo mototaxi"). Tres nombres nuevos en la pizarra.
hints:
  - "Su promedio: `(SELECT avg(monto) FROM transferencias WHERE de_telefono = …)`, con el teléfono de Milagros adentro."
  - "Para ver el nombre de quien recibe: `JOIN personas AS r ON r.telefono = t.a_telefono`."
```

## El juez

Como antes: el ejemplo y las bases ocultas. Hoy cada pago se compara con algo que depende de su propia fila.

```exercise
id: sql7-juez-sobre-promedio
type: judge
title: Más que de costumbre
prompt: |
  **Devuelve el `id`, el pagador (`de`) y el `monto` de los pagos que superan el promedio de los pagos de ese mismo pagador, ordenados por `id`.**

  Un banco quiere marcar los pagos raros: no los grandes en general, sino los grandes **para quien los hace**. S/ 300 es poco para una empresa y mucho para un estudiante. Algunos pagos tienen el monto vacío (`NULL`): no cuentan para el promedio y no se marcan.

  **Tabla:** `pagos(id, de, monto)`.

  **Resultado:** `id`, `de` y `monto`, ordenado por `id`.
schema: |
  CREATE TABLE pagos (id INTEGER, de TEXT, monto REAL);
ordered: true
starter: |
  SELECT id, de, monto
  FROM pagos
  WHERE monto > (SELECT avg(monto) FROM pagos)
  ORDER BY id;
solution: |
  SELECT p.id, p.de, p.monto
  FROM pagos AS p
  WHERE p.monto > (
    SELECT avg(q.monto) FROM pagos AS q
    WHERE q.de = p.de
  )
  ORDER BY p.id;
hints:
  - "El promedio tiene que ser **del mismo pagador**: la subconsulta necesita `WHERE q.de = p.de`, con un alias distinto para la tabla de adentro."
  - "`avg` ya ignora los `NULL`, y `NULL > algo` nunca es verdadero: no hace falta nada más para los montos vacíos."
samples:
  - rows:
      pagos: [[1, "A", 20], [2, "B", 300], [3, "A", 50], [4, "A", 80], [5, "B", 100], [6, "C", 40]]
    note: "A promedia 50, B 200 y C 40. Pasan el 4 (80 > 50) y el 2 (300 > 200). C tiene un solo pago, igual a su promedio: no pasa."
  - rows:
      pagos: [[1, "A", 10], [2, "A", null], [3, "A", 30]]
    note: "El promedio de A es 20 (el NULL no cuenta). Pasa solo el 3."
edge:
  - rows: { pagos: [] }
    tag: sin pagos
  - rows: { pagos: [[1, "A", 5], [2, "A", 5], [3, "B", 7]] }
    tag: con todos los pagos iguales a su promedio
  - rows: { pagos: [[1, "A", null], [2, "B", 10], [3, "B", 30], [4, "A", null]] }
    tag: con un pagador que solo tiene montos vacíos
random:
  count: 40
  seed: 707
  generate: |
    const n = rng.int(0, 16);
    return { pagos: Array.from({ length: n }, (_, i) => [i + 1, rng.pick(["A", "B", "C", "D"]), rng.chance(0.12) ? null : rng.int(1, 60) * 5]) };
wrong:
  - |
    SELECT id, de, monto FROM pagos WHERE monto > (SELECT avg(monto) FROM pagos) ORDER BY id;
  - |
    SELECT p.id, p.de, p.monto FROM pagos AS p WHERE p.monto >= (SELECT avg(q.monto) FROM pagos AS q WHERE q.de = p.de) ORDER BY p.id;
  - |
    SELECT p.id, p.de, p.monto FROM pagos AS p WHERE p.monto > (SELECT sum(q.monto) / count(*) FROM pagos AS q WHERE q.de = p.de) ORDER BY p.id;
```

## Misión final

```exercise
id: sql7-mision-dinero
type: mission
title: Cuánto llegó a la caja
prompt: |
  **En una sola fila, muestra cuánto recibió Milagros de los números que cobraron adelantos como `recibido`, el total de todos los adelantos como `adelantos` y qué porcentaje es lo primero de lo segundo, redondeado a un decimal, como `porcentaje`.** Después di cuánto recibió.

  Los números que cobraron adelantos salen de una subconsulta con `IN`; el total de adelantos, de una subconsulta escalar. Así la prueba no depende de que copies números a mano.

  Cuando la consulta lo pruebe y respondas, junto con el juez, se abre la sesión 8.
visual:
  - escenario:
      case: pagos
  - figure:
      title: De dónde sale cada número
      panes:
        - label: "recibido"
          value: "SUM de lo que le llegó a Milagros desde (SELECT a_telefono … 'adelanto%')"
        - label: "adelantos"
          value: "(SELECT SUM(monto) … 'adelanto%')"
        - label: "porcentaje"
          value: "100.0 × recibido / adelantos"
starter: |
  SELECT SUM(monto) AS recibido
  FROM transferencias
  WHERE a_telefono = (SELECT telefono FROM personas WHERE nombre = 'Milagros Tello Benavides');
solution: |
  SELECT SUM(monto) AS recibido,
         (SELECT SUM(monto) FROM transferencias WHERE mensaje LIKE 'adelanto%') AS adelantos,
         round(100.0 * SUM(monto) / (SELECT SUM(monto) FROM transferencias WHERE mensaje LIKE 'adelanto%'), 1) AS porcentaje
  FROM transferencias
  WHERE a_telefono = (SELECT telefono FROM personas WHERE nombre = 'Milagros Tello Benavides')
    AND de_telefono IN (SELECT a_telefono FROM transferencias WHERE mensaje LIKE 'adelanto%');
answer: "4806"
answerLabel: ¿Cuánto recibió Milagros de los cobradores? (en soles)
reveal: |
  **S/ 4806**, el **90 %** de los S/ 5340 que pagaron las 14 víctimas. Lo de arriba (lo que le "devolvían") no puede ser préstamos: es exactamente la parte de los adelantos que los cobradores no se quedaron. Y casi todo vuelve a salir. **Milagros es la caja.** Falta saber para quién trabaja.
hints:
  - "La consulta de arriba suma **todo** lo que recibió Milagros. Agrega `AND de_telefono IN (SELECT a_telefono FROM transferencias WHERE mensaje LIKE 'adelanto%')`."
  - "El total de adelantos va como columna: `(SELECT SUM(monto) FROM transferencias WHERE mensaje LIKE 'adelanto%') AS adelantos`. Multiplica por `100.0`, no por `100`, para no caer en la división entera."
tests:
  - name: recibido, adelantos y porcentaje en una fila
    same: SELECT SUM(monto), (SELECT SUM(monto) FROM transferencias WHERE mensaje LIKE 'adelanto%'), round(100.0 * SUM(monto) / (SELECT SUM(monto) FROM transferencias WHERE mensaje LIKE 'adelanto%'), 1) FROM transferencias WHERE a_telefono = (SELECT telefono FROM personas WHERE nombre = 'Milagros Tello Benavides') AND de_telefono IN (SELECT a_telefono FROM transferencias WHERE mensaje LIKE 'adelanto%')
  - name: las columnas se llaman recibido, adelantos y porcentaje
    columns: [recibido, adelantos, porcentaje]
  - name: usa IN con una subconsulta
    source: '\bIN\s*\(\s*SELECT\b'
```

## Reto experto

```exercise
id: sql7-reto-dependencia
type: challenge
title: Cuánto depende cada uno de Milagros
prompt: |
  **Para cada persona que recibió plata de Milagros en marzo, muestra su nombre como `nombre`, cuánto recibió de ella como `de_milagros`, cuánto recibió de todo el mundo en marzo como `total_marzo` y qué porcentaje de lo segundo es lo primero, redondeado a entero, como `porcentaje`.** Ordena de más a menos `de_milagros`.

  Para quien ya programa: una tabla derivada con lo que pagó Milagros agrupado por quien recibe, unida a `personas`, y una subconsulta correlacionada para el total de cada uno. Mira quién vive casi solo de la plata de Milagros.
starter: |
  SELECT a_telefono, monto
  FROM transferencias
  WHERE de_telefono = (SELECT telefono FROM personas WHERE nombre = 'Milagros Tello Benavides');
solution: |
  SELECT p.nombre,
         m.de_milagros,
         (SELECT SUM(x.monto) FROM transferencias AS x WHERE x.a_telefono = p.telefono) AS total_marzo,
         CAST(round(100.0 * m.de_milagros / (SELECT SUM(x.monto) FROM transferencias AS x WHERE x.a_telefono = p.telefono)) AS INTEGER) AS porcentaje
  FROM (
    SELECT a_telefono, SUM(monto) AS de_milagros
    FROM transferencias
    WHERE de_telefono = (SELECT telefono FROM personas WHERE nombre = 'Milagros Tello Benavides')
    GROUP BY a_telefono
  ) AS m
  JOIN personas AS p ON p.telefono = m.a_telefono
  ORDER BY m.de_milagros DESC;
hints:
  - "La tabla derivada: `(SELECT a_telefono, SUM(monto) AS de_milagros FROM transferencias WHERE de_telefono = … GROUP BY a_telefono) AS m`."
  - "El total de cada uno depende de su fila: `(SELECT SUM(x.monto) FROM transferencias AS x WHERE x.a_telefono = p.telefono)`."
tests:
  - name: lo que cada uno recibió de Milagros y de todos
    same: SELECT p.nombre, m.d, t.s, CAST(round(100.0 * m.d / t.s) AS INTEGER) FROM (SELECT a_telefono, SUM(monto) AS d FROM transferencias WHERE de_telefono = (SELECT telefono FROM personas WHERE nombre = 'Milagros Tello Benavides') GROUP BY a_telefono) AS m JOIN personas AS p ON p.telefono = m.a_telefono JOIN (SELECT a_telefono, SUM(monto) AS s FROM transferencias GROUP BY a_telefono) AS t ON t.a_telefono = m.a_telefono ORDER BY m.d DESC
    ordered: true
  - name: columnas nombre, de_milagros, total_marzo y porcentaje
    columns: [nombre, de_milagros, total_marzo, porcentaje]
```
