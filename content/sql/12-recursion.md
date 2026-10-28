# Sesión 12 — WITH RECURSIVE

```session
case: frio
```

## El encargo

Lunes 30 de marzo de 2026. **Haydée Llanos**, enfermera en Surquillo, llega a Loop con una caja de cartón llena de papeles. Su papá, **Teodoro Llanos**, era vigilante nocturno de **Textil San Jacinto**, una fábrica de La Victoria. La noche del **viernes 18 de diciembre de 1998** alguien abrió la caja fuerte de la fábrica **con su combinación** y se llevó S/ 412 000, las gratificaciones de Navidad. Teodoro estaba solo en la caseta. Lo condenaron en 1999 y murió en 2021 sin que nadie le creyera.

"Él siempre dijo que esa noche lo llamaron para que dejara entrar a un técnico", dice Haydée. La municipalidad acaba de digitalizar el expediente: la **planilla** de la fábrica con el jefe de cada empleado, la **guía telefónica** de 1998, **cada llamada de diciembre** de la central de La Victoria (más de sesenta mil) y las **declaraciones** que se tomaron entonces. Las tablas terminan en `_1998`.

Para responder "¿quién depende de quién?" o "¿quién está a tres llamadas de este teléfono?" hay que seguir una cadena **sin saber cuántos eslabones tiene**. Un `JOIN` avanza un paso; hoy aprendes a avanzar todos los que hagan falta.

```escenario
case: frio
title: Textil San Jacinto, Av. México, diciembre de 1998
caption: "La caja fuerte estaba en Tesorería. Teodoro vigilaba desde la caseta de la puerta principal; frente a la fábrica había un teléfono público."
```

```expediente
title: Quiénes piden y quién quedó marcado
cards:
  - name: Haydée Llanos Quispe
    traits: { style: long, hair: "#3b2a1e", shirt: "#f4efe2", skin: "#a86f47" }
    role: Hija de Teodoro, enfermera
    rows: [["Pide", "limpiar el nombre de su papá"]]
    quote: "Mi papá llevaba once años en esa fábrica. No era un ladrón."
  - name: Teodoro Llanos Cusi
    traits: { style: cap, capColor: "#2f3a4a", shirt: "#2f3a4a", skin: "#a86f47", beard: true }
    role: Vigilante nocturno en 1998
    rows: [["Turno", "20:00 a 06:00, en la caseta"], ["Condena", "1999, como cómplice"]]
    quote: "Me llamaron de parte de la señora Ugarte. Yo solo abrí la puerta lateral."
```

```esquema
title: Las cuatro tablas del expediente de 1998
tables: [empleados_1998, telefonos_1998, llamadas_1998, declaraciones_1998]
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

Con lo que ya sabes, para ver quién depende de la jefa de Tesorería (la empleada **214**) haces un `JOIN` de `empleados_1998` consigo misma: `e.jefe_id = 214`. Eso da el primer nivel. Para el segundo, otro `JOIN`; para el tercero, otro más. Pero no sabes cuántos niveles hay, y cada uno es una consulta distinta.

Un **CTE recursivo** se nombra a sí mismo. Tiene dos partes unidas por `UNION ALL`:

```sql
WITH RECURSIVE nombre(columnas) AS (
  SELECT …            -- el ancla: las filas de partida
  UNION ALL
  SELECT …            -- la parte recursiva: lee de nombre
  FROM nombre …
  WHERE …             -- la condición que la hace terminar
)
SELECT … FROM nombre;
```

SQLite lo corre **por vueltas**. En la vuelta 0 corre el ancla y guarda sus filas. En cada vuelta siguiente corre la parte recursiva, pero `nombre` **no** es todo lo acumulado: son **solo las filas nuevas de la vuelta anterior**. Cuando una vuelta no produce ninguna fila nueva, se detiene, y el resultado es la unión de todas las vueltas. Míralo con la serie más simple, del 1 al 5:

```vueltas
title: Del 1 al 5, vuelta por vuelta
by: x
query: |
  WITH RECURSIVE n(x) AS (
    SELECT 1
    UNION ALL
    SELECT x + 1 FROM n
    WHERE x < 5
  )
  SELECT x FROM n;
```

Fíjate en la última vuelta: con `x = 5`, el `WHERE x < 5` no deja pasar nada. **Sin esa condición, no termina nunca.**

**Series de fechas.** El mismo truco con `date(d, '+1 day')` arma un calendario. Sirve para lo que `GROUP BY` no puede: mostrar **también los días sin filas**. Las llamadas que recibió la caseta de la fábrica (`'4721093'`) la semana del robo:

```sql run
WITH RECURSIVE dias(dia) AS (
  SELECT '1998-12-14'
  UNION ALL
  SELECT date(dia, '+1 day') FROM dias
  WHERE dia < '1998-12-20'
)
SELECT dia,
       (SELECT count(*) FROM llamadas_1998
        WHERE destino = '4721093'
          AND inicio >= dia AND inicio < date(dia, '+1 day')) AS llamadas
FROM dias;
```

**Jerarquías.** El ancla es la persona de arriba; la parte recursiva busca a quienes tienen como jefe a alguien de la vuelta anterior, y lleva la cuenta del nivel:

```sql run
WITH RECURSIVE equipo(id, nombre, cargo, nivel) AS (
  SELECT id, nombre, cargo, 0
  FROM empleados_1998
  WHERE id = 214
  UNION ALL
  SELECT e.id, e.nombre, e.cargo, q.nivel + 1
  FROM empleados_1998 AS e
  JOIN equipo AS q ON e.jefe_id = q.id
)
SELECT * FROM equipo;
```

```vueltas
title: El equipo de la jefa de Tesorería, vuelta por vuelta
by: nivel
query: |
  WITH RECURSIVE equipo(id, nombre, nivel) AS (
    SELECT id, nombre, 0
    FROM empleados_1998
    WHERE id = 214
    UNION ALL
    SELECT e.id, e.nombre, q.nivel + 1
    FROM empleados_1998 AS e
    JOIN equipo AS q ON e.jefe_id = q.id
  )
  SELECT id, nombre, nivel FROM equipo;
caption: "Aquí no hace falta un `WHERE` que pare: en la vuelta 4 nadie tiene como jefe al practicante, y el `JOIN` no devuelve nada."
```

Para **subir** por la cadena (de un empleado hasta el gerente general) se cambia el sentido del `JOIN`: `e.id = q.jefe_id`, "el jefe de alguien de la vuelta anterior".

**Grafos.** Las llamadas no son un árbol: A llama a B, B a C y C de vuelta a A. Recorrer un grafo así tiene dos peligros: dar vueltas en círculo para siempre y explotar en caminos. Se controlan con dos cosas:

- un **límite de profundidad** (`WHERE r.saltos < 3`), y
- un **camino como texto** (`r.camino || '>' || numero`) para no volver a pisar un número que ya está en el camino: `instr(r.camino, numero) = 0`.

Como una llamada sirve en los dos sentidos, primero se arma `aristas` con cada llamada dos veces, `origen → destino` y `destino → origen`. Así se ve, la noche del robo, todo lo que estaba a dos llamadas de la caseta:

```sql run
WITH RECURSIVE
  aristas(a, b) AS (
    SELECT origen, destino FROM llamadas_1998
    WHERE inicio BETWEEN '1998-12-18 20:00' AND '1998-12-19 02:00'
    UNION ALL
    SELECT destino, origen FROM llamadas_1998
    WHERE inicio BETWEEN '1998-12-18 20:00' AND '1998-12-19 02:00'
  ),
  red(numero, saltos, camino) AS (
    SELECT '4721093', 0, '4721093'
    UNION ALL
    SELECT x.b, r.saltos + 1, r.camino || '>' || x.b
    FROM red AS r
    JOIN aristas AS x ON x.a = r.numero
    WHERE r.saltos < 2 AND instr(r.camino, x.b) = 0
  )
SELECT numero, saltos, camino FROM red;
```

El número `4402216` sale **dos veces**: hubo dos llamadas, y cada una es un camino distinto. Para quedarte con cada número una vez, agrupa y toma `MIN(saltos)`: la distancia más corta.

> **Trampa común:** una recursión sin salida no da error: corre hasta que la cortan (aquí, a los 4 segundos). Antes de correrla, pregúntate qué hace que una vuelta produzca **cero** filas: un `WHERE nivel < …`, un árbol que se acaba o el control del camino. Otra salida es escribir `UNION` en vez de `UNION ALL`: entonces SQLite descarta las filas que ya tiene y un ciclo se corta solo, pero solo si la fila repetida es idéntica (con una columna `saltos` que crece, nunca lo es).

SQLite saca las filas de una en una de una cola, en orden de llegada, así que recorre **a lo ancho**: primero todo el nivel 1, luego el 2. En PostgreSQL y MySQL 8 se escribe igual; SQL Server omite la palabra `RECURSIVE`, y en SQLite también es opcional.

<!-- legacy: recursive-cte -->

<!-- mdn: recursive-cte -->

## Práctica

```exercise
id: sql12-predice-serie
type: predict
title: Duplicar hasta pasarse
prompt: |
  ¿Qué devuelve?
code: |
  WITH RECURSIVE n(x) AS (
    SELECT 1
    UNION ALL
    SELECT x * 2 FROM n WHERE x < 20
  )
  SELECT group_concat(x, ' ') FROM n;
options:
  - "1 2 4 8 16"
  - "1 2 4 8 16 32"
  - "2 4 8 16 32"
  - "1 2 4 8 16 32 64"
answer: "1 2 4 8 16 32"
explain: |
  El `WHERE` mira la fila **de la vuelta anterior**, no la nueva. Con `x = 16`, `16 < 20` se cumple y produce 32. Con `x = 32` ya no pasa nada y la recursión termina. El 32 sale aunque sea mayor que 20.
```

```exercise
id: sql12-predice-ciclo
type: predict
title: Un ciclo con UNION
prompt: |
  `x % 3 + 1` lleva 1 → 2 → 3 → 1 → … y no hay `WHERE`. ¿Qué devuelve?
code: |
  WITH RECURSIVE n(x) AS (
    SELECT 1
    UNION
    SELECT x % 3 + 1 FROM n
  )
  SELECT count(*) FROM n;
options:
  - "3"
  - "4"
  - "1"
  - "Nada: se cuelga hasta que lo cortan"
answer: "3"
explain: |
  Con `UNION` (sin `ALL`), SQLite descarta una fila que ya está en el resultado. En la cuarta vuelta vuelve a salir el 1, que ya estaba: no hay filas nuevas y se detiene. Con `UNION ALL` daría vueltas para siempre.
```

```exercise
id: sql12-completa-dias
type: complete
title: Un calendario con huecos
prompt: |
  Lista **cada día del 14 al 20 de diciembre de 1998** y cuántas llamadas **salieron del teléfono público** `'4723310'` ese día, también los días con cero. Llama `dia` y `llamadas` a las columnas, en orden. Reemplaza los `___`.
visual:
  figure:
    title: Lo que GROUP BY no muestra
    panes:
      - label: "GROUP BY date(inicio)"
        table: { head: [dia, llamadas], rows: [["1998-12-15", "…"], ["1998-12-18", "…"]] }
      - label: "Serie de días + conteo"
        table: { head: [dia, llamadas], rows: [["1998-12-14", "…"], ["1998-12-15", "…"], ["1998-12-16", "0"], ["…", "…"]] }
starter: |
  WITH RECURSIVE dias(dia) AS (
    SELECT '1998-12-14'
    UNION ALL
    SELECT ___(dia, '+1 day') FROM dias
    WHERE dia < ___
  )
  SELECT dia,
         (SELECT count(*) FROM llamadas_1998
          WHERE origen = '4723310'
            AND inicio >= dia AND inicio < date(dia, '+1 day')) AS llamadas
  FROM dias;
solution: |
  WITH RECURSIVE dias(dia) AS (
    SELECT '1998-12-14'
    UNION ALL
    SELECT date(dia, '+1 day') FROM dias
    WHERE dia < '1998-12-20'
  )
  SELECT dia,
         (SELECT count(*) FROM llamadas_1998
          WHERE origen = '4723310'
            AND inicio >= dia AND inicio < date(dia, '+1 day')) AS llamadas
  FROM dias;
hints:
  - "`date(dia, '+1 day')` da el día siguiente."
  - "La condición mira el día de la vuelta anterior: para que el último sea el 20, se sigue mientras `dia < '1998-12-20'`."
tests:
  - name: los siete días con su conteo
    same: WITH RECURSIVE d(x) AS (SELECT '1998-12-14' UNION ALL SELECT date(x, '+1 day') FROM d WHERE x < '1998-12-20') SELECT x, (SELECT count(*) FROM llamadas_1998 WHERE origen = '4723310' AND inicio >= x AND inicio < date(x, '+1 day')) FROM d
    ordered: true
  - name: columnas dia y llamadas
    columns: [dia, llamadas]
```

```exercise
id: sql12-arregla-cadena
type: fix
title: La cadena al revés
prompt: |
  Esta consulta quiere la **cadena de mando de Teodoro** (empleado 590): él, su jefe, el jefe de su jefe… hasta el gerente general, con el `nivel` (0 para Teodoro) y en orden de nivel. Pero solo devuelve a Teodoro. Arréglala.
visual:
  figure:
    title: Hacia dónde mira el JOIN
    panes:
      - label: "e.jefe_id = c.id (baja)"
        value: "¿quién tiene como jefe a Teodoro? nadie"
      - label: "e.id = c.jefe_id (sube)"
        value: "¿quién es el jefe de Teodoro?"
starter: |
  WITH RECURSIVE cadena(id, nombre, cargo, jefe_id, nivel) AS (
    SELECT id, nombre, cargo, jefe_id, 0
    FROM empleados_1998
    WHERE id = 590
    UNION ALL
    SELECT e.id, e.nombre, e.cargo, e.jefe_id, c.nivel + 1
    FROM empleados_1998 AS e
    JOIN cadena AS c ON e.jefe_id = c.id
  )
  SELECT nivel, id, nombre, cargo FROM cadena
  ORDER BY nivel;
solution: |
  WITH RECURSIVE cadena(id, nombre, cargo, jefe_id, nivel) AS (
    SELECT id, nombre, cargo, jefe_id, 0
    FROM empleados_1998
    WHERE id = 590
    UNION ALL
    SELECT e.id, e.nombre, e.cargo, e.jefe_id, c.nivel + 1
    FROM empleados_1998 AS e
    JOIN cadena AS c ON e.id = c.jefe_id
  )
  SELECT nivel, id, nombre, cargo FROM cadena
  ORDER BY nivel;
hints:
  - "La fila de la vuelta anterior es `c`. Su jefe es el empleado cuyo `id` es `c.jefe_id`."
tests:
  - name: de Teodoro al gerente general, en orden
    same: WITH RECURSIVE k(id, j, n) AS (SELECT id, jefe_id, 0 FROM empleados_1998 WHERE id = 590 UNION ALL SELECT e.id, e.jefe_id, k.n + 1 FROM empleados_1998 e JOIN k ON e.id = k.j) SELECT k.n, e.id, e.nombre, e.cargo FROM k JOIN empleados_1998 e ON e.id = k.id ORDER BY k.n
    ordered: true
```

```exercise
id: sql12-escribe-niveles
type: write
title: Cuánta gente hay en cada nivel
prompt: |
  Recorre **toda** la planilla desde el gerente general (el único con `jefe_id` en `NULL`, nivel 0) y devuelve cuántos empleados hay en cada nivel. Columnas `nivel` y `empleados`, ordenado por nivel.
visual:
  figure:
    title: "El organigrama, por pisos"
    caption: "Cada piso se calcula del anterior: eso es la parte recursiva."
    table:
      head: ["nivel", "quiénes", "depende de"]
      rows:
        - ["0", "el gerente general", "nadie (`jefe_id` es `NULL`)"]
        - ["1", "los gerentes", "el gerente general"]
        - ["2, 3, …", "jefes, supervisores, operarios…", "su jefe directo, un nivel más arriba"]
starter: |
  SELECT id, nombre, jefe_id
  FROM empleados_1998
  WHERE jefe_id IS NULL;
solution: |
  WITH RECURSIVE org(id, nivel) AS (
    SELECT id, 0 FROM empleados_1998 WHERE jefe_id IS NULL
    UNION ALL
    SELECT e.id, o.nivel + 1
    FROM empleados_1998 AS e
    JOIN org AS o ON e.jefe_id = o.id
  )
  SELECT nivel, count(*) AS empleados
  FROM org
  GROUP BY nivel
  ORDER BY nivel;
hints:
  - "El ancla es `WHERE jefe_id IS NULL`; la parte recursiva baja con `e.jefe_id = o.id`."
  - "Afuera del `WITH`, es un `GROUP BY nivel` de siempre."
tests:
  - name: empleados por nivel
    same: WITH RECURSIVE o(id, n) AS (SELECT id, 0 FROM empleados_1998 WHERE jefe_id IS NULL UNION ALL SELECT e.id, o.n + 1 FROM empleados_1998 e JOIN o ON e.jefe_id = o.id) SELECT n, count(*) FROM o GROUP BY n ORDER BY n
    ordered: true
  - name: columnas nivel y empleados
    columns: [nivel, empleados]
  - name: usa WITH RECURSIVE
    source: '\bWITH\s+RECURSIVE\b'
```

```exercise
id: sql12-escribe-camino
type: write
title: El organigrama de Tesorería, como texto
prompt: |
  Para cada persona del equipo de la jefa de Tesorería (214, incluida ella) arma su **camino** desde Rosa: `'Rosa Ugarte Bustamante > Víctor Salazar Montes > Edwin Torres Mendoza'`, con `' > '` entre nombres. Devuelve solo la columna `camino`, ordenada por `camino`: así cada jefe queda justo encima de su gente.
starter: |
  WITH RECURSIVE equipo(id, nombre) AS (
    SELECT id, nombre FROM empleados_1998 WHERE id = 214
    UNION ALL
    SELECT e.id, e.nombre
    FROM empleados_1998 AS e
    JOIN equipo AS q ON e.jefe_id = q.id
  )
  SELECT nombre FROM equipo;
solution: |
  WITH RECURSIVE equipo(id, camino) AS (
    SELECT id, nombre FROM empleados_1998 WHERE id = 214
    UNION ALL
    SELECT e.id, q.camino || ' > ' || e.nombre
    FROM empleados_1998 AS e
    JOIN equipo AS q ON e.jefe_id = q.id
  )
  SELECT camino FROM equipo
  ORDER BY camino;
hints:
  - "La columna que viaja de vuelta en vuelta es el camino: en el ancla es el nombre de Rosa; en la parte recursiva, `q.camino || ' > ' || e.nombre`."
tests:
  - name: los doce caminos, en orden
    same: WITH RECURSIVE q(id, c) AS (SELECT id, nombre FROM empleados_1998 WHERE id = 214 UNION ALL SELECT e.id, q.c || ' > ' || e.nombre FROM empleados_1998 e JOIN q ON e.jefe_id = q.id) SELECT c FROM q ORDER BY c
    ordered: true
  - name: columna camino
    columns: [camino]
```

## El caso

```exercise
id: sql12-caso-combinacion
type: case
title: ¿Cuántos sabían la combinación?
prompt: |
  **¿Cuántas personas conocían la combinación de la caja fuerte la noche del robo?** Escribe el número.

  La caja se abrió sin forzarla. Busca en `declaraciones_1998` lo que se dijo sobre la **combinación**: una de las declaraciones dice exactamente quiénes la conocían. Después cuenta a esas personas en `empleados_1998`.

  Ojo: la columna `area` se llenaba a mano y no es confiable (hay "Tesoreria" sin tilde, áreas en blanco y gente de otras áreas anotada en Tesorería). Lo que no miente es quién es jefe de quién.
visual:
  - escenario:
      case: frio
  - esquema:
      tables: [declaraciones_1998, empleados_1998]
starter: |
  -- Paso 1: lo que se dijo de la combinación
  SELECT empleado_id, texto
  FROM declaraciones_1998
  WHERE texto LIKE '%combinación%';
solution: |
  WITH RECURSIVE equipo(id) AS (
    SELECT id FROM empleados_1998 WHERE id = 214
    UNION ALL
    SELECT e.id
    FROM empleados_1998 AS e
    JOIN equipo AS q ON e.jefe_id = q.id
  )
  SELECT count(*) AS conocian FROM equipo;
answer: "12"
answerLabel: ¿Cuántas personas conocían la combinación?
reveal: |
  **Doce.** Rosa Ugarte (214), jefa de Tesorería, cambió la combinación el martes 15 y dijo que solo la sabían ella y "todos los que dependen de mí, directa o indirectamente": dos supervisores, una asistente, siete cajeros y un practicante que depende de un cajero. Con `WHERE area = 'Tesorería'` habrías contado 9, con el mensajero Hugo adentro y tres personas del equipo afuera. Teodoro, el vigilante, **no** estaba entre los doce.
hints:
  - "La declaración de la empleada 214 lo dice: ella y todos los que dependen de ella. Es el árbol que empieza en 214."
  - "Recorre el árbol con `WITH RECURSIVE` y, afuera, `SELECT count(*)`."
```

## El juez

Como en las sesiones anteriores: tu consulta corre sobre las tablas del ejemplo y sobre bases ocultas. Aquí las bases ocultas tienen ciclos, números que se llaman a sí mismos de vuelta y números sueltos.

```exercise
id: sql12-juez-tres-llamadas
type: judge
title: A tres llamadas
prompt: |
  **Devuelve cada número que está a 3 llamadas o menos del número de partida, con su distancia más corta. Ordena por distancia y luego por número.**

  Una llamada une a dos números **en los dos sentidos**: si A llamó a B, B está a 1 de A y A está a 1 de B. La distancia de un número es la menor cantidad de llamadas que hay que encadenar para llegar a él. El número de partida no sale en el resultado, aunque se pueda volver a él.

  **Tablas:** `llamadas(origen, destino)` y `partida(numero)`, que tiene una sola fila.

  **Resultado:** `numero` y su distancia (1, 2 o 3), ordenado por distancia y luego por `numero`.
schema: |
  CREATE TABLE llamadas (origen TEXT, destino TEXT);
  CREATE TABLE partida (numero TEXT);
ordered: true
starter: |
  SELECT destino, 1
  FROM llamadas
  WHERE origen = (SELECT numero FROM partida);
solution: |
  WITH RECURSIVE
    aristas(a, b) AS (
      SELECT origen, destino FROM llamadas
      UNION ALL
      SELECT destino, origen FROM llamadas
    ),
    red(numero, saltos) AS (
      SELECT numero, 0 FROM partida
      UNION
      SELECT x.b, r.saltos + 1
      FROM red AS r
      JOIN aristas AS x ON x.a = r.numero
      WHERE r.saltos < 3
    )
  SELECT numero, MIN(saltos) AS distancia
  FROM red
  WHERE numero <> (SELECT numero FROM partida)
  GROUP BY numero
  ORDER BY distancia, numero;
hints:
  - "Arma primero las aristas en los dos sentidos (`origen, destino` y `destino, origen` con `UNION ALL`) y camina sobre ellas con un límite `saltos < 3`."
  - "Un número puede alcanzarse por varios caminos: `GROUP BY numero` con `MIN(saltos)`. Y saca al de partida con un `WHERE`."
samples:
  - rows:
      llamadas: [["111", "222"], ["222", "333"], ["444", "333"], ["333", "555"], ["555", "666"]]
      partida: [["111"]]
    note: "222 está a 1; 333 a 2; 444 y 555 a 3 (444 llamó a 333, cuenta igual). 666 está a 4: no sale."
  - rows:
      llamadas: [["700", "800"], ["800", "900"], ["900", "700"]]
      partida: [["800"]]
    note: "Un triángulo: 700 y 900 están a 1. Volver a 800 no cuenta."
edge:
  - rows: { llamadas: [], partida: [["123"]] }
    tag: sin ninguna llamada
  - rows: { llamadas: [["100", "200"], ["300", "400"]], partida: [["999"]] }
    tag: con un número de partida que nadie llamó
  - rows: { llamadas: [["100", "200"], ["200", "100"], ["100", "200"], ["200", "300"], ["300", "100"]], partida: [["100"]] }
    tag: con llamadas repetidas y de vuelta
random:
  count: 40
  seed: 1212
  generate: |
    const pool = Array.from({ length: rng.int(4, 14) }, (_, i) => String(100 + i * 7));
    const m = rng.int(0, 22);
    const calls = [];
    for (let i = 0; i < m; i++) {
      const a = rng.pick(pool);
      let b = rng.pick(pool);
      if (b === a) b = pool[(pool.indexOf(a) + 1) % pool.length];
      calls.push([a, b]);
    }
    return { llamadas: calls, partida: [[rng.pick(pool)]] };
wrong:
  - |
    WITH RECURSIVE red(numero, saltos) AS (SELECT numero, 0 FROM partida UNION SELECT l.destino, r.saltos + 1 FROM red r JOIN llamadas l ON l.origen = r.numero WHERE r.saltos < 3) SELECT numero, MIN(saltos) AS d FROM red WHERE numero <> (SELECT numero FROM partida) GROUP BY numero ORDER BY d, numero;
  - |
    WITH RECURSIVE x(a, b) AS (SELECT origen, destino FROM llamadas UNION ALL SELECT destino, origen FROM llamadas), red(numero, saltos) AS (SELECT numero, 0 FROM partida UNION SELECT x.b, r.saltos + 1 FROM red r JOIN x ON x.a = r.numero WHERE r.saltos < 2) SELECT numero, MIN(saltos) AS d FROM red WHERE numero <> (SELECT numero FROM partida) GROUP BY numero ORDER BY d, numero;
  - |
    WITH RECURSIVE x(a, b) AS (SELECT origen, destino FROM llamadas UNION ALL SELECT destino, origen FROM llamadas), red(numero, saltos) AS (SELECT numero, 0 FROM partida UNION SELECT x.b, r.saltos + 1 FROM red r JOIN x ON x.a = r.numero WHERE r.saltos < 3) SELECT numero, MAX(saltos) AS d FROM red WHERE numero <> (SELECT numero FROM partida) GROUP BY numero ORDER BY d, numero;
  - |
    WITH RECURSIVE x(a, b) AS (SELECT origen, destino FROM llamadas UNION ALL SELECT destino, origen FROM llamadas), red(numero, saltos) AS (SELECT numero, 0 FROM partida UNION SELECT x.b, r.saltos + 1 FROM red r JOIN x ON x.a = r.numero WHERE r.saltos < 3) SELECT numero, MIN(saltos) AS d FROM red GROUP BY numero ORDER BY d, numero;
```

## Misión final

```exercise
id: sql12-mision-red
type: mission
title: A tres llamadas del teléfono público
prompt: |
  **Lista a los empleados que conocían la combinación (el equipo de la 214) cuyo teléfono de casa estaba a 3 llamadas o menos del teléfono público `'4723310'` la noche del robo, del viernes 18 a las 20:00 al sábado 19 a las 02:00.** Muestra `id`, `nombre`, `cargo` y `saltos` (la distancia más corta), ordenado por `saltos` y luego por `id`. Después di cuántos son.

  Teodoro dijo que la llamada que lo engañó entró a la caseta a las 23:41. La guía telefónica dice que vino del **teléfono público** de la Av. México, frente a la fábrica. Quien la organizó tuvo que hablar con ese teléfono, directo o a través de alguien.

  Cuando la consulta lo pruebe y respondas, junto con el juez, se abre la sesión 13.
visual:
  - escenario:
      case: frio
  - esquema:
      tables: [empleados_1998, llamadas_1998]
starter: |
  WITH RECURSIVE
    aristas(a, b) AS (
      SELECT origen, destino FROM llamadas_1998
      WHERE inicio BETWEEN '1998-12-18 20:00' AND '1998-12-19 02:00'
      UNION ALL
      SELECT destino, origen FROM llamadas_1998
      WHERE inicio BETWEEN '1998-12-18 20:00' AND '1998-12-19 02:00'
    )
  SELECT a, b FROM aristas
  WHERE a = '4723310';
solution: |
  WITH RECURSIVE
    equipo(id) AS (
      SELECT id FROM empleados_1998 WHERE id = 214
      UNION ALL
      SELECT e.id FROM empleados_1998 AS e JOIN equipo AS q ON e.jefe_id = q.id
    ),
    aristas(a, b) AS (
      SELECT origen, destino FROM llamadas_1998
      WHERE inicio BETWEEN '1998-12-18 20:00' AND '1998-12-19 02:00'
      UNION ALL
      SELECT destino, origen FROM llamadas_1998
      WHERE inicio BETWEEN '1998-12-18 20:00' AND '1998-12-19 02:00'
    ),
    red(numero, saltos, camino) AS (
      SELECT '4723310', 0, '4723310'
      UNION ALL
      SELECT x.b, r.saltos + 1, r.camino || '>' || x.b
      FROM red AS r
      JOIN aristas AS x ON x.a = r.numero
      WHERE r.saltos < 3 AND instr(r.camino, x.b) = 0
    )
  SELECT e.id, e.nombre, e.cargo, MIN(r.saltos) AS saltos
  FROM red AS r
  JOIN empleados_1998 AS e ON e.telefono = r.numero
  JOIN equipo AS q ON q.id = e.id
  GROUP BY e.id, e.nombre, e.cargo
  ORDER BY saltos, e.id;
answer: "3"
answerLabel: ¿Cuántos de los doce estaban a tres llamadas o menos?
reveal: |
  **Tres.** **Víctor Salazar Montes**, supervisor de caja, a **1** llamada: su casa llamó al teléfono público. **Rosa Ugarte Bustamante**, la jefa, y **Nilton Palomino Ríos**, cajero, a **2**. Míralos en la pizarra. Estar cerca en el grafo no prueba nada: hay que ver **quién llamó a quién, cuándo y cuánto duró**. Para eso hace falta mirar todo diciembre, y ahí la consulta se vuelve lenta. Eso, en la sesión 13.
hints:
  - "Necesitas tres CTE en el mismo `WITH RECURSIVE`: `equipo` (el árbol de la 214), `aristas` (ya está) y `red`, que camina desde `'4723310'` con `saltos < 3` y el control del camino con `instr`."
  - "Al final, une `red` con `empleados_1998` por `telefono = numero` y con `equipo` por `id`, y agrupa para quedarte con `MIN(saltos)`."
tests:
  - name: los empleados del equipo a 3 llamadas o menos, con su distancia
    same: WITH RECURSIVE q(id) AS (SELECT id FROM empleados_1998 WHERE id = 214 UNION ALL SELECT e.id FROM empleados_1998 e JOIN q ON e.jefe_id = q.id), x(a, b) AS (SELECT origen, destino FROM llamadas_1998 WHERE inicio BETWEEN '1998-12-18 20:00' AND '1998-12-19 02:00' UNION ALL SELECT destino, origen FROM llamadas_1998 WHERE inicio BETWEEN '1998-12-18 20:00' AND '1998-12-19 02:00'), r(n, s) AS (SELECT '4723310', 0 UNION SELECT x.b, r.s + 1 FROM r JOIN x ON x.a = r.n WHERE r.s < 3) SELECT e.id, e.nombre, e.cargo, MIN(r.s) FROM r JOIN empleados_1998 e ON e.telefono = r.n JOIN q ON q.id = e.id GROUP BY e.id ORDER BY 4, 1
    ordered: true
  - name: columnas id, nombre, cargo y saltos
    columns: [id, nombre, cargo, saltos]
  - name: recorre el árbol y el grafo con WITH RECURSIVE
    source: '\bWITH\s+RECURSIVE\b'
```

## Reto experto

```exercise
id: sql12-reto-ruta
type: challenge
title: La ruta más corta, escrita
prompt: |
  **Devuelve el camino más corto, la noche del robo (18 a las 20:00 → 19 a las 02:00), entre el teléfono público `'4723310'` y la casa de Teodoro `'2715504'`, como texto: los números separados por `' > '`.** Una sola fila y una columna, `ruta`. Si hubiera varios caminos igual de cortos, el primero en orden alfabético.

  Para quien ya programa: es un BFS con camino. Camina desde el público, guarda el camino como texto, filtra los que terminan en `'2715504'` y quédate con el de menos saltos.
starter: |
  SELECT origen, destino, inicio
  FROM llamadas_1998
  WHERE destino = '2715504'
    AND inicio BETWEEN '1998-12-18 20:00' AND '1998-12-19 02:00';
solution: |
  WITH RECURSIVE
    aristas(a, b) AS (
      SELECT origen, destino FROM llamadas_1998
      WHERE inicio BETWEEN '1998-12-18 20:00' AND '1998-12-19 02:00'
      UNION ALL
      SELECT destino, origen FROM llamadas_1998
      WHERE inicio BETWEEN '1998-12-18 20:00' AND '1998-12-19 02:00'
    ),
    red(numero, saltos, ruta) AS (
      SELECT '4723310', 0, '4723310'
      UNION ALL
      SELECT x.b, r.saltos + 1, r.ruta || ' > ' || x.b
      FROM red AS r
      JOIN aristas AS x ON x.a = r.numero
      WHERE r.saltos < 4 AND instr(r.ruta, x.b) = 0
    )
  SELECT ruta FROM red
  WHERE numero = '2715504'
  ORDER BY saltos, ruta
  LIMIT 1;
hints:
  - "Pon un límite de saltos generoso (4) para que termine, y ordena al final por `saltos, ruta`."
tests:
  - name: la ruta más corta
    same: SELECT '4723310 > 4721093 > 2715504'
  - name: columna ruta
    columns: [ruta]
```
