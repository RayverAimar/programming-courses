# Sesión 8 — WITH y operaciones de conjuntos

```session
case: pagos
```

## El encargo

Jueves 26 de marzo. La plata de las 14 víctimas pasa por cuatro cobradores, llega a la caja de **Milagros Tello** y casi toda sale otra vez. En la pizarra quedan tres nombres que recibieron pagos grandes de ella: su casero (ya descartado), su hermano **Percy** y un comerciante de San Borja, **Gustavo Alvarado**, que hoy declaró: «Milagros me compra mercadería». Dos víctimas contaron que el vendedor les habló de **una tienda de celulares en Gamarra**.

Hoy toca cruzar todo lo que sabes en una sola consulta que se pueda leer: cada paso con su nombre (**`WITH`**) y listas que se juntan, se cruzan o se restan (**`UNION`**, **`INTERSECT`**, **`EXCEPT`**). Si la consulta de hoy lo prueba, la comisaría tiene a quién buscar.

```escenario
case: pagos
title: Lo que llevamos
caption: "Falta el último tramo: de la caja de Milagros hacia arriba."
```

```expediente
title: Los dos que quedan
cards:
  - name: Gustavo Alvarado Zevallos
    traits: { style: short, hair: "#3b2a1e", shirt: "#2f3a4a", glasses: true }
    role: Comerciante, San Borja
    rows: [["Recibió de Milagros", "S/ 4300 en tres pagos"]]
    quote: "Milagros me compra mercadería. Es todo lo que tengo con ella."
  - name: Percy Tello Benavides
    traits: { style: cap, capColor: "#4f9a6a", shirt: "#4f9a6a" }
    role: Mototaxista, hermano de Milagros
    rows: [["Recibió de Milagros", "S/ 1200, «préstamo mototaxi»"]]
    quote: "Yo no sé nada de celulares."
```

## Lo mínimo

Las subconsultas de la sesión 7 funcionan, pero cuando se anidan se leen **de adentro hacia afuera**. **`WITH`** les pone nombre y las ordena **de arriba abajo**, como pasos de una receta. Cada paso es una **CTE** (*common table expression*): una consulta con nombre que, dentro de esta consulta, se usa como una tabla. Un paso puede leer a los anteriores, y la consulta final lee a cualquiera.

```sql
WITH paso_uno AS (
  SELECT …
),
paso_dos AS (
  SELECT … FROM paso_uno …
)
SELECT … FROM paso_dos …;
```

```cte
title: Tres pasos con nombre
steps:
  - name: adelantos
    sql: |
      SELECT a_telefono, monto
      FROM transferencias
      WHERE mensaje LIKE 'adelanto%'
  - name: por_numero
    sql: |
      SELECT a_telefono, COUNT(*) AS cuantos, SUM(monto) AS total
      FROM adelantos
      GROUP BY a_telefono
final: |
  SELECT COALESCE(p.nombre, n.a_telefono) AS cobrador, n.cuantos, n.total
  FROM por_numero AS n
  LEFT JOIN personas AS p ON p.telefono = n.a_telefono
  ORDER BY n.total DESC;
caption: "Cada caja es una tabla que existe solo mientras corre la consulta. El chip no tiene nombre: `COALESCE` muestra su número."
```

Una CTE no guarda nada: es una forma de **escribir** la consulta. SQLite decide si la calcula una vez o la mezcla con el resto, como haría con una subconsulta. Su ventaja es que puedes **leerla, probar cada paso por separado** (`SELECT * FROM adelantos`) y **usar el mismo paso dos veces** sin copiarlo.

### Juntar, cruzar y restar listas

Dos consultas que devuelven **las mismas columnas** (misma cantidad, en el mismo orden) se pueden combinar como conjuntos:

- **`UNION`**: lo que está en una **o** en la otra, sin repetidos.
- **`UNION ALL`**: una debajo de la otra, **con** repetidos. Más rápida, porque no tiene que buscar duplicados.
- **`INTERSECT`**: lo que está en **las dos**.
- **`EXCEPT`**: lo que está en la primera **y no** en la segunda.

```conjuntos
title: Quién pagó y quién denunció
a:
  label: pagaron un adelanto
  query: |
    SELECT v.nombre FROM transferencias AS t
    JOIN personas AS v ON v.telefono = t.de_telefono
    WHERE t.mensaje LIKE 'adelanto%'
b:
  label: denunciaron la estafa
  query: |
    SELECT p.nombre FROM denuncias AS d
    JOIN personas AS p ON p.id = d.denunciante_id
    WHERE d.tipo = 'estafa' AND d.descripcion LIKE '%adelanto%'
caption: "Las 9 que denunciaron también pagaron. `EXCEPT` da las 5 que pagaron y callaron: el mismo resultado que el antijoin de la sesión 6, escrito como una resta."
```

Las reglas: los nombres de las columnas salen de la **primera** consulta; un `ORDER BY` va **una sola vez, al final**, y ordena el resultado combinado; y para estas operaciones dos `NULL` **sí** son iguales (a diferencia de `=`), así que `NULL INTERSECT NULL` da una fila.

**Vistas.** Si un paso te sirve en muchas consultas, puedes guardarlo en la base con `CREATE VIEW`. Una vista es una consulta con nombre que vive en la base (no guarda filas: se vuelve a calcular cada vez). En la sesión 17 diseñarás las tuyas.

```sql run
CREATE VIEW adelantos AS
SELECT de_telefono, a_telefono, monto, momento
FROM transferencias
WHERE mensaje LIKE 'adelanto%';

SELECT a_telefono, COUNT(*) AS cuantos
FROM adelantos
GROUP BY a_telefono
ORDER BY cuantos DESC;
```

> **Trampa común:** `UNION` borra repetidos, y a veces los repetidos son datos. Si juntas los montos que entraron y los que salieron de una cuenta para sumarlos, dos pagos de S/ 20 se vuelven uno con `UNION`. Usa **`UNION ALL`** siempre que quieras contar o sumar, y `UNION` solo cuando de verdad quieras una lista sin repetidos.

<!-- legacy: with-cte -->

<!-- mdn: with-cte -->

## Práctica

```exercise
id: sql8-predice-union
type: predict
title: Con o sin repetidos
prompt: |
  ¿Qué devuelven las dos consultas?
code: |
  SELECT 1 UNION SELECT 1 UNION SELECT 2;

  SELECT count(*) FROM (SELECT 1 UNION ALL SELECT 1 UNION ALL SELECT 2);
options:
  - |-
    1
    2
    3
  - |-
    1
    1
    2
    3
  - |-
    1
    2
    2
  - |-
    1
    2
    1
answer: |-
  1
  2
  3
explain: |
  `UNION` deja el 1 una sola vez: dos filas, 1 y 2. `UNION ALL` no quita nada: tres filas, y `count(*)` da 3.
```

```exercise
id: sql8-predice-null
type: predict
title: Dos desconocidos iguales
prompt: |
  En la sesión 2 viste que `NULL = NULL` es `NULL`. ¿Qué devuelve?
code: |
  SELECT count(*) FROM (SELECT NULL INTERSECT SELECT NULL);
options:
  - "1"
  - "0"
  - "NULL"
  - "2"
answer: "1"
explain: |
  Para las operaciones de conjuntos (y para `DISTINCT` y `GROUP BY`), dos `NULL` cuentan como la misma fila. Así que la intersección tiene una fila: `NULL`. Un `JOIN … ON a = b` en cambio nunca empareja dos `NULL`.
```

```exercise
id: sql8-completa-with
type: complete
title: Cuántos números cobran
prompt: |
  Con una CTE llamada `cobradores` que tenga **cada número que recibió un adelanto, una vez**, cuenta cuántos son. Reemplaza los `___`.
starter: |
  ___ cobradores ___ (
    SELECT DISTINCT a_telefono
    FROM transferencias
    WHERE mensaje LIKE 'adelanto%'
  )
  SELECT count(*) FROM ___;
solution: |
  WITH cobradores AS (
    SELECT DISTINCT a_telefono
    FROM transferencias
    WHERE mensaje LIKE 'adelanto%'
  )
  SELECT count(*) FROM cobradores;
hints:
  - "`WITH nombre AS ( consulta )` y después la consulta final, que usa `nombre` como una tabla."
tests:
  - name: cuenta los números que cobraron
    value: 4
  - name: usa WITH
    source: '\bWITH\s+cobradores\s+AS\b'
```

```exercise
id: sql8-arregla-union
type: fix
title: La plata que se movió
prompt: |
  Se quiere **la suma de todos los montos que entraron o salieron de los tres cobradores con nombre** (Kevin, Brenda y Jhonatan) en marzo: cada pago cuenta una vez por cada lado en que aparece. La consulta junta las dos listas con `UNION` y la suma sale más baja de lo que es. Arréglala.
starter: |
  WITH red AS (
    SELECT telefono FROM personas
    WHERE nombre IN ('Kevin Rojas Palomino', 'Brenda Salazar Cusi', 'Jhonatan Ugarte Llanos')
  ),
  movimientos AS (
    SELECT monto FROM transferencias WHERE a_telefono IN (SELECT telefono FROM red)
    UNION
    SELECT monto FROM transferencias WHERE de_telefono IN (SELECT telefono FROM red)
  )
  SELECT SUM(monto) AS movido FROM movimientos;
solution: |
  WITH red AS (
    SELECT telefono FROM personas
    WHERE nombre IN ('Kevin Rojas Palomino', 'Brenda Salazar Cusi', 'Jhonatan Ugarte Llanos')
  ),
  movimientos AS (
    SELECT monto FROM transferencias WHERE a_telefono IN (SELECT telefono FROM red)
    UNION ALL
    SELECT monto FROM transferencias WHERE de_telefono IN (SELECT telefono FROM red)
  )
  SELECT SUM(monto) AS movido FROM movimientos;
hints:
  - "Los tres pagan menús y pasajes de los mismos montos (S/ 20, S/ 12…). Con `UNION`, dos montos iguales se vuelven uno."
tests:
  - name: suma todos los movimientos
    same: SELECT SUM(monto) FROM transferencias AS t JOIN personas AS p ON p.telefono = t.a_telefono OR p.telefono = t.de_telefono WHERE p.nombre IN ('Kevin Rojas Palomino', 'Brenda Salazar Cusi', 'Jhonatan Ugarte Llanos')
  - name: usa UNION ALL
    source: '\bUNION\s+ALL\b'
```

```exercise
id: sql8-escribe-intersect
type: write
title: Cobraron y le pagaron a la caja
prompt: |
  Lista **los números que recibieron algún adelanto y además le pagaron algo a Milagros Tello Benavides**, en orden. Usa `INTERSECT` entre dos consultas de una columna.
visual:
  figure:
    title: Dos listas de números
    panes:
      - label: "A: recibieron un adelanto"
        value: "SELECT a_telefono … 'adelanto%'"
      - label: "B: le pagaron a Milagros"
        value: "SELECT de_telefono … a_telefono = (Milagros)"
      - label: "A INTERSECT B"
        value: "?"
starter: |
  SELECT a_telefono
  FROM transferencias
  WHERE mensaje LIKE 'adelanto%';
solution: |
  SELECT a_telefono
  FROM transferencias
  WHERE mensaje LIKE 'adelanto%'
  INTERSECT
  SELECT de_telefono
  FROM transferencias
  WHERE a_telefono = (SELECT telefono FROM personas WHERE nombre = 'Milagros Tello Benavides')
  ORDER BY 1;
hints:
  - "La segunda lista: `SELECT de_telefono FROM transferencias WHERE a_telefono = (SELECT telefono FROM personas WHERE nombre = 'Milagros Tello Benavides')`."
  - "El `ORDER BY` va una vez, al final de todo."
tests:
  - name: los números de las dos listas, en orden
    same: SELECT DISTINCT t.a_telefono FROM transferencias AS t WHERE t.mensaje LIKE 'adelanto%' AND EXISTS (SELECT 1 FROM transferencias AS u JOIN personas AS m ON m.telefono = u.a_telefono WHERE m.nombre = 'Milagros Tello Benavides' AND u.de_telefono = t.a_telefono) ORDER BY 1
    ordered: true
  - name: usa INTERSECT
    source: '\bINTERSECT\b'
```

```exercise
id: sql8-escribe-except
type: write
title: El antijoin como resta
prompt: |
  Lista el **nombre** de las personas que **pagaron un adelanto** pero **no hicieron ninguna denuncia de estafa**, en orden alfabético. Esta vez usa `EXCEPT`.
starter: |
  SELECT v.nombre
  FROM transferencias AS t
  JOIN personas AS v ON v.telefono = t.de_telefono
  WHERE t.mensaje LIKE 'adelanto%';
solution: |
  SELECT v.nombre
  FROM transferencias AS t
  JOIN personas AS v ON v.telefono = t.de_telefono
  WHERE t.mensaje LIKE 'adelanto%'
  EXCEPT
  SELECT p.nombre
  FROM denuncias AS d
  JOIN personas AS p ON p.id = d.denunciante_id
  WHERE d.tipo = 'estafa'
  ORDER BY 1;
hints:
  - "La segunda lista son los nombres de quienes denunciaron una estafa: `denuncias` unida a `personas`."
tests:
  - name: los que pagaron y no denunciaron, en orden
    same: SELECT v.nombre FROM transferencias AS t JOIN personas AS v ON v.telefono = t.de_telefono WHERE t.mensaje LIKE 'adelanto%' AND NOT EXISTS (SELECT 1 FROM denuncias AS d WHERE d.denunciante_id = v.id AND d.tipo = 'estafa') ORDER BY 1
    ordered: true
  - name: usa EXCEPT
    source: '\bEXCEPT\b'
```

## El caso

```exercise
id: sql8-caso-empresa
type: case
title: Dónde trabaja la red
prompt: |
  **¿En qué empresa trabajan hoy más integrantes de la red?** Escribe su razón social tal como aparece en `empresas`.

  Arma la red con `WITH`: un paso con los teléfonos de los cobradores (ya está abajo), otro que les sume el de Milagros con `UNION`, y la consulta final que una esos teléfonos con `personas`, sus empleos **actuales** (`hasta IS NULL`) y `empresas`, y cuente cuántos integrantes hay en cada una.
visual:
  - escenario:
      case: pagos
  - esquema:
      tables: [transferencias, personas, empleos, empresas]
starter: |
  WITH cobradores AS (
    SELECT DISTINCT a_telefono AS telefono
    FROM transferencias
    WHERE mensaje LIKE 'adelanto%'
  )
  SELECT * FROM cobradores;
solution: |
  WITH cobradores AS (
    SELECT DISTINCT a_telefono AS telefono
    FROM transferencias
    WHERE mensaje LIKE 'adelanto%'
  ),
  red AS (
    SELECT telefono FROM cobradores
    UNION
    SELECT telefono FROM personas WHERE nombre = 'Milagros Tello Benavides'
  )
  SELECT e.razon_social, e.distrito, COUNT(*) AS integrantes, group_concat(p.nombre, ', ') AS quienes
  FROM red
  JOIN personas AS p ON p.telefono = red.telefono
  JOIN empleos AS j ON j.persona_id = p.id AND j.hasta IS NULL
  JOIN empresas AS e ON e.id = j.empresa_id
  GROUP BY e.id
  ORDER BY integrantes DESC;
answer: Importaciones Ccori S.A.C.
answerLabel: ¿Qué empresa? (razón social completa)
reveal: |
  **Importaciones Ccori S.A.C.**, una vendedora de celulares de **La Victoria**, a pasos de Gamarra: ahí trabajan hoy **Kevin y Brenda** como repartidores y **Milagros** como cajera. Jhonatan trabaja en otra empresa y el chip no tiene dueño. La "tienda de celulares en Gamarra" de la que hablaron las víctimas existe. ¿Quién la dirige?
hints:
  - "El segundo paso: `red AS (SELECT telefono FROM cobradores UNION SELECT telefono FROM personas WHERE nombre = 'Milagros Tello Benavides')`."
  - "La final: `FROM red JOIN personas AS p … JOIN empleos AS j ON j.persona_id = p.id AND j.hasta IS NULL JOIN empresas AS e …`, agrupada por empresa."
```

## El juez

Como antes: el ejemplo y las bases ocultas. Aquí las dos listas tienen repetidos y vacíos.

```exercise
id: sql8-juez-ambas-listas
type: judge
title: En las dos listas
prompt: |
  **Devuelve, una sola vez cada uno y ordenados, los teléfonos que aparecen en las dos listas.**

  Dos comisarías se mandaron sus listas de números sospechosos. Están sucias: hay números repetidos y filas con el teléfono vacío (`NULL`), que no son un número y no deben salir.

  **Tablas:** `lista_a(telefono)` y `lista_b(telefono)`.

  **Resultado:** una columna con cada teléfono que está en las dos listas, sin repetidos, ordenada.
schema: |
  CREATE TABLE lista_a (telefono TEXT);
  CREATE TABLE lista_b (telefono TEXT);
ordered: true
starter: |
  SELECT telefono FROM lista_a
  UNION
  SELECT telefono FROM lista_b
  ORDER BY telefono;
solution: |
  SELECT telefono FROM lista_a WHERE telefono IS NOT NULL
  INTERSECT
  SELECT telefono FROM lista_b
  ORDER BY telefono;
hints:
  - "`INTERSECT` ya quita los repetidos."
  - "Pero para `INTERSECT` dos `NULL` son iguales: si las dos listas tienen un vacío, saldría una fila `NULL`. Quítalos con `WHERE telefono IS NOT NULL`."
samples:
  - rows:
      lista_a: [["951207384"], ["913488521"], ["951207384"], [null]]
      lista_b: [["951207384"], ["946280187"], [null]]
    note: "El 951207384 está en las dos (dos veces en la A): sale una vez. El NULL está en las dos, pero no es un número."
  - rows:
      lista_a: [["900000003"], ["900000001"]]
      lista_b: [["900000001"], ["900000003"], ["900000002"]]
    note: "Ordenados: 900000001 y 900000003."
edge:
  - rows: { lista_a: [], lista_b: [["911111111"]] }
    tag: con la primera lista vacía
  - rows: { lista_a: [[null], [null]], lista_b: [[null]] }
    tag: con listas que solo tienen vacíos
  - rows: { lista_a: [["922222222"], ["922222222"]], lista_b: [["922222222"], ["922222222"]] }
    tag: con el mismo número repetido en las dos
random:
  count: 40
  seed: 808
  generate: |
    const nums = ["951207384", "913488521", "946280187", "928298796", "969785259", "981764539", "938684587", "900000001"];
    const one = () => (rng.chance(0.18) ? null : rng.pick(nums));
    return { lista_a: Array.from({ length: rng.int(0, 9) }, () => [one()]), lista_b: Array.from({ length: rng.int(0, 9) }, () => [one()]) };
wrong:
  - |
    SELECT telefono FROM lista_a INTERSECT SELECT telefono FROM lista_b ORDER BY telefono;
  - |
    SELECT a.telefono FROM lista_a AS a JOIN lista_b AS b ON b.telefono = a.telefono ORDER BY a.telefono;
  - |
    SELECT telefono FROM lista_a WHERE telefono IS NOT NULL UNION SELECT telefono FROM lista_b WHERE telefono IS NOT NULL ORDER BY telefono;
```

## Misión final

```exercise
id: sql8-mision-lider
type: mission
title: Quién está arriba
prompt: |
  **Con `WITH`, arma dos listas de teléfonos: quienes recibieron de Milagros pagos por encima de su propio promedio, y quienes trabajan hoy en Importaciones Ccori S.A.C. Devuelve el `nombre` de las personas cuyo teléfono está en las dos (con `INTERSECT`).** Después di quién es.

  La primera lista es el caso de la sesión 7; la segunda, el de hoy. Lo que está en las dos es alguien que **recibe la plata** y **trabaja con la red**.

  Cuando la consulta lo pruebe y respondas, junto con el juez, se cierra el expediente y se abre la sesión 9.
visual:
  - escenario:
      case: pagos
  - figure:
      title: Dos listas y su cruce
      panes:
        - label: "A: pagos grandes de Milagros"
          value: "Teodoro · Percy · ?"
        - label: "B: trabajan hoy en Importaciones Ccori"
          value: "Kevin · Brenda · Milagros · ?"
        - label: "A INTERSECT B"
          value: "?"
  - network:
      title: "El camino de la plata, de las víctimas hacia arriba"
      nodes:
        - {"id": "v", "icon": "person", "label": "14 víctimas", "sub": "S/ 5340 en adelantos"}
        - {"id": "c", "icon": "box", "label": "4 cobradores", "sub": "Kevin, Brenda, Jhonatan y un chip"}
        - {"id": "m", "icon": "person", "label": "Milagros Tello", "sub": "la caja"}
        - {"id": "g", "icon": "person", "label": "Gustavo Alvarado", "sub": "comerciante de San Borja"}
      links:
        - {"id": "l1", "label": "adelantos"}
        - {"id": "l2", "label": "en menos de 3 horas"}
        - {"id": "l3", "label": "pagos grandes"}
      steps:
        - at: "v"
          note: "Catorce víctimas pagan un adelanto por un celular o un scooter que nunca llega. Suman S/ 5340."
        - move: ["v", "c"]
          packet: {"kind": "up", "label": "S/ 5340"}
          note: "Cada adelanto cae en uno de cuatro cobradores: tres con nombre y un chip sin dueño."
        - at: "c"
          tags: {"c": "se quedan el 10 %"}
          note: "Cada cobrador se queda el 10 % y reenvía el resto, siempre a un mismo número."
        - move: ["c", "m"]
          packet: {"kind": "up", "label": "S/ 4806"}
          tags: {"c": "se quedan el 10 %"}
          note: "A la caja de Milagros llega el 90 %: S/ 4806."
        - move: ["m", "g"]
          packet: {"kind": "up", "label": "S/ 4300"}
          tags: {"g": "¿qué pinta en la red?"}
          note: "Casi todo vuelve a salir: tres pagos grandes a Gustavo, S/ 4300. Hoy averiguas si trabaja con la red."
starter: |
  WITH milagros AS (
    SELECT telefono FROM personas WHERE nombre = 'Milagros Tello Benavides'
  )
  SELECT a_telefono, monto
  FROM transferencias
  WHERE de_telefono = (SELECT telefono FROM milagros);
solution: |
  WITH milagros AS (
    SELECT telefono FROM personas WHERE nombre = 'Milagros Tello Benavides'
  ),
  pagos_grandes AS (
    SELECT a_telefono AS telefono
    FROM transferencias
    WHERE de_telefono = (SELECT telefono FROM milagros)
      AND monto > (SELECT avg(monto) FROM transferencias WHERE de_telefono = (SELECT telefono FROM milagros))
  ),
  ccori AS (
    SELECT p.telefono
    FROM empleos AS j
    JOIN empresas AS e ON e.id = j.empresa_id
    JOIN personas AS p ON p.id = j.persona_id
    WHERE e.razon_social = 'Importaciones Ccori S.A.C.'
      AND j.hasta IS NULL
  )
  SELECT nombre
  FROM personas
  WHERE telefono IN (
    SELECT telefono FROM pagos_grandes
    INTERSECT
    SELECT telefono FROM ccori
  );
answer: Gustavo Alvarado Zevallos
answerLabel: ¿Quién dirige la red? (nombre completo)
reveal: |
  **Gustavo Alvarado Zevallos, gerente de Importaciones Ccori S.A.C.** Es la única persona que está en las dos listas: recibió S/ 4300 de la caja (S/ 1800, S/ 1900 y S/ 600, siempre después de una tanda de adelantos y seguidos de una llamada con Milagros) y dirige la tienda donde trabajan la cajera y dos de los cobradores. Percy no trabaja ahí y Rocío Medina, la asistente, no recibió nada.

  La red: **14 víctimas** pagaron **S/ 5340**; cuatro números cobraron y se quedaron el 10 %; Milagros juntó **S/ 4806** y le pasó **S/ 4300** a su jefe. **Expediente EST-0323 cerrado.** La comisaría ya tiene la consulta que lo prueba.
hints:
  - "`pagos_grandes` es la consulta del caso de la sesión 7, devolviendo solo `a_telefono AS telefono`."
  - "`ccori`: `empleos` unida a `empresas` y `personas`, con `e.razon_social = 'Importaciones Ccori S.A.C.' AND j.hasta IS NULL`. La final: `WHERE telefono IN (SELECT telefono FROM pagos_grandes INTERSECT SELECT telefono FROM ccori)`."
tests:
  - name: el nombre de quien está en las dos listas
    same: SELECT p.nombre FROM personas AS p JOIN empleos AS j ON j.persona_id = p.id AND j.hasta IS NULL JOIN empresas AS e ON e.id = j.empresa_id WHERE e.razon_social = 'Importaciones Ccori S.A.C.' AND p.telefono IN (SELECT a_telefono FROM transferencias WHERE de_telefono = (SELECT telefono FROM personas WHERE nombre = 'Milagros Tello Benavides') AND monto > (SELECT avg(monto) FROM transferencias WHERE de_telefono = (SELECT telefono FROM personas WHERE nombre = 'Milagros Tello Benavides')))
  - name: usa WITH
    source: '\bWITH\b'
  - name: cruza las listas con INTERSECT
    source: '\bINTERSECT\b'
```

## Reto experto

```exercise
id: sql8-reto-embudo
type: challenge
title: El embudo de la plata
prompt: |
  **Arma el embudo de la red en tres filas: paso 1, las víctimas que pagaron adelantos; paso 2, los números que le pasaron plata a Milagros; paso 3, los empleados de Importaciones Ccori que recibieron plata de Milagros. Para cada paso, muestra su número como `paso`, cuántas personas o números distintos pagan o reciben en él como `cuantos` y el monto que se movió como `monto`.** Ordena por paso.

  Para quien ya programa: una CTE por paso y tres `SELECT` de una fila cada uno, unidos con `UNION ALL`. En el paso 1 se cuentan quienes pagan (`de_telefono`), en el 2 quienes le pagan a Milagros y en el 3 quienes reciben de ella.
starter: |
  WITH adelantos AS (
    SELECT de_telefono, a_telefono, monto
    FROM transferencias
    WHERE mensaje LIKE 'adelanto%'
  )
  SELECT 1 AS paso, COUNT(DISTINCT de_telefono) AS cuantos, SUM(monto) AS monto
  FROM adelantos;
solution: |
  WITH adelantos AS (
    SELECT de_telefono, a_telefono, monto
    FROM transferencias
    WHERE mensaje LIKE 'adelanto%'
  ),
  milagros AS (
    SELECT telefono FROM personas WHERE nombre = 'Milagros Tello Benavides'
  ),
  a_la_caja AS (
    SELECT de_telefono, monto
    FROM transferencias
    WHERE a_telefono = (SELECT telefono FROM milagros)
      AND de_telefono IN (SELECT a_telefono FROM adelantos)
  ),
  al_jefe AS (
    SELECT t.a_telefono, t.monto
    FROM transferencias AS t
    JOIN personas AS p ON p.telefono = t.a_telefono
    JOIN empleos AS j ON j.persona_id = p.id AND j.hasta IS NULL
    JOIN empresas AS e ON e.id = j.empresa_id
    WHERE t.de_telefono = (SELECT telefono FROM milagros)
      AND e.razon_social = 'Importaciones Ccori S.A.C.'
  )
  SELECT 1 AS paso, COUNT(DISTINCT de_telefono) AS cuantos, SUM(monto) AS monto FROM adelantos
  UNION ALL
  SELECT 2, COUNT(DISTINCT de_telefono), SUM(monto) FROM a_la_caja
  UNION ALL
  SELECT 3, COUNT(DISTINCT a_telefono), SUM(monto) FROM al_jefe
  ORDER BY paso;
hints:
  - "Cada paso es un `SELECT` de una sola fila con `COUNT(DISTINCT …)` y `SUM(monto)`; `UNION ALL` los apila."
  - "Los nombres de las columnas los pone el primer `SELECT`; los demás solo necesitan las mismas tres columnas en el mismo orden."
tests:
  - name: los tres pasos del embudo
    output: |-
      1 | 14 | 5340.0
      2 | 4 | 4806.0
      3 | 1 | 4300.0
  - name: columnas paso, cuantos y monto
    columns: [paso, cuantos, monto]
  - name: apila los pasos con UNION ALL
    source: '\bUNION\s+ALL\b'
```
