# Sesión 5 — Unir tablas con JOIN

```session
case: pagos
```

## El encargo

Lunes 23 de marzo. El caso del giroscopio está cerrado y la comisaría de Surquillo trae otro: **Sonia Huamán**, profesora del barrio, vio un iPhone 13 baratísimo en Marketplace, pagó **S/ 300 de adelanto por Yape** para separarlo y nunca más supo del vendedor. No es la única: en marzo hay varias denuncias que cuentan lo mismo, en distritos distintos. Chasqui sospecha que es **una sola red**.

El problema es que lo que necesitas está repartido. La denuncia dice **quién denunció** (un número de persona), el padrón dice **el celular de esa persona** y los pagos están guardados **por celular**. Ninguna tabla tiene la respuesta sola: hay que **unirlas**. Eso hace `JOIN`.

```escenario
case: pagos
title: La red de los pagos
caption: "A la izquierda, los celulares de las víctimas; al centro, a dónde va la plata. Cada pista que encuentres se marca aquí."
```

```expediente
title: La primera denuncia
cards:
  - name: Sonia Huamán Ríos
    traits: { style: bun, shirt: "#3f7cc4", glasses: true }
    role: Docente, vive en Surquillo
    rows: [["Denunció", "5 de marzo"], ["Pagó", "S/ 300 de adelanto"], ["Por", "un iPhone 13"]]
    quote: "Le yapeé y me bloqueó a la media hora."
```

## Lo mínimo

**Una tabla es un conjunto de filas.** Cada fila es un hecho (una persona, una denuncia, un pago) y no tiene un orden propio. Para no confundir dos filas, cada tabla tiene una **clave primaria**: una columna que es distinta en cada fila, como `personas.id`. Y cuando una fila habla de otra, guarda su clave: `denuncias.denunciante_id` es el `id` de una persona. Esa columna se llama **clave foránea**. Así se conectan las tablas sin repetir datos: el nombre de Sonia está una sola vez, en `personas`.

```esquema
title: Tres tablas del caso
tables: [denuncias, personas, transferencias]
caption: "El eslabón marca la clave foránea `denunciante_id` → `personas.id`. `transferencias` no tiene clave foránea: se une a `personas` por el **celular**, porque un `JOIN` puede usar cualquier par de columnas con valores iguales."
```

`JOIN … ON` **empareja filas**: por cada fila de la tabla de la izquierda, busca las filas de la derecha que cumplen la condición del `ON`, y por cada pareja arma una fila nueva con las columnas de las dos. La fila que no encuentra pareja **no sale**. Dale a ▶:

```junta
title: Cada denuncia busca a su denunciante
query: |
  SELECT d.id, d.tipo, p.nombre
  FROM denuncias AS d
  JOIN personas AS p ON p.id = d.denunciante_id;
left:
  name: d
  cols: [id, tipo, denunciante_id]
  rows: [[101, estafa, 118], [102, robo, 640], [103, estafa, 164], [104, ruido, 9999]]
right:
  name: p
  cols: [id, nombre]
  rows: [[118, "Sonia Huamán Ríos"], [164, "Walter Mendoza Quispe"], [207, "Ximena Flores Aguilar"], [640, "Rocío Ramos Silva"]]
on: [denunciante_id, id]
type: inner
caption: "La denuncia 104 apunta a una persona que no existe: no sale. Ximena (207) no denunció nada: tampoco sale. SQLite compara cada fila de la izquierda con las de la derecha: es un **bucle anidado**, y en la sesión 14 verás cómo un índice le ahorra casi todas esas comparaciones."
```

```sql run
SELECT d.fecha, d.distrito, p.nombre, p.telefono
FROM denuncias AS d
JOIN personas AS p ON p.id = d.denunciante_id
WHERE d.tipo = 'estafa'
  AND d.descripcion LIKE '%adelanto%'
ORDER BY d.fecha;
```

Lo que necesitas para hoy:

- **Alias.** `denuncias AS d` le pone un nombre corto a la tabla. Cuando dos tablas tienen una columna con el mismo nombre (las dos tienen `id` y `distrito`), escribe de cuál es: `d.distrito`, `p.distrito`. Si no, SQLite responde *ambiguous column name*.
- **Más de dos tablas.** Cada `JOIN` une una tabla más al resultado que ya llevas: `denuncias` → `personas` → `transferencias`, cada uno con su `ON`.
- **`USING (col)`** es un atajo cuando la columna se llama igual en las dos tablas: `vehiculos JOIN licencias USING (persona_id)` es lo mismo que `ON vehiculos.persona_id = licencias.persona_id`.
- **`CROSS JOIN`** empareja **todo con todo**, sin condición: el **producto cartesiano**. Con 24 cámaras y 120 puestos salen 2880 filas. Casi nunca lo quieres; existe para armar combinaciones a propósito.

```figura
title: CROSS JOIN, todo con todo
panes:
  - label: "a (2 filas)"
    table: { head: [puerta], rows: [[1], [2]] }
  - label: "b (3 filas)"
    table: { head: [turno], rows: [[mañana], [tarde], [noche]] }
  - label: "a CROSS JOIN b (2 × 3 = 6 filas)"
    table: { head: [puerta, turno], rows: [[1, mañana], [1, tarde], [1, noche], [2, mañana], [2, tarde], [2, noche]] }
```

**Duplicados por multiplicación.** Si una fila de la izquierda encuentra **dos** parejas, sale **dos veces**. Kevin tuvo dos empleos: unirlo con `empleos` lo duplica, y si después sumas algo de Kevin, lo sumas dos veces.

```junta
title: Una fila con dos parejas sale dos veces
query: |
  SELECT p.nombre, e.cargo, e.hasta
  FROM personas AS p
  JOIN empleos AS e ON e.persona_id = p.id;
left:
  name: p
  cols: [id, nombre]
  rows: [[742, "Kevin Rojas Palomino"], [118, "Sonia Huamán Ríos"], [779, "Brenda Salazar Cusi"]]
right:
  name: e
  cols: [persona_id, cargo, hasta]
  rows: [[742, repartidor, "2025-10-31"], [742, repartidor, null], [779, repartidor, null]]
on: [id, persona_id]
type: inner
caption: "Kevin aparece dos veces, una por empleo. Sonia no tiene empleo registrado aquí y no sale."
```

> **Trampa común:** la forma antigua de unir es con comas, `FROM vehiculos, personas WHERE …`, y la condición de unión va mezclada con los filtros. Si te olvidas de ella, no hay error: sale el **producto cartesiano**, cada auto con cada persona, cientos de miles de filas. Escribe siempre `JOIN … ON`: la condición queda pegada a la tabla que une y es difícil olvidarla. Y antes de sumar después de un `JOIN`, pregúntate si alguna fila se pudo multiplicar.

<!-- legacy: comma-join -->

<!-- mdn: comma-join -->

## Práctica

```exercise
id: sql5-predice-cruz
type: predict
title: Todo con todo
prompt: |
  La tabla `camaras` tiene 24 filas. ¿Qué devuelve?
code: |
  SELECT count(*)
  FROM camaras AS a
  CROSS JOIN camaras AS b;
options:
  - "24"
  - "48"
  - "576"
  - "1"
answer: "576"
explain: |
  `CROSS JOIN` empareja cada una de las 24 filas de `a` con cada una de las 24 de `b`: 24 × 24 = 576. Se puede unir una tabla consigo misma; los alias `a` y `b` las distinguen.
```

```exercise
id: sql5-predice-multiplica
type: predict
title: Dos empleos, dos filas
prompt: |
  ¿Qué devuelve? (742 es Kevin Rojas, que tuvo dos empleos de repartidor.)
code: |
  SELECT p.nombre, e.cargo
  FROM personas AS p
  JOIN empleos AS e ON e.persona_id = p.id
  WHERE p.id = 742
  ORDER BY e.desde;
options:
  - |-
    Kevin Rojas Palomino | repartidor
  - |-
    Kevin Rojas Palomino | repartidor
    Kevin Rojas Palomino | repartidor
  - |-
    Kevin Rojas Palomino | NULL
  - |-
    Kevin Rojas Palomino | repartidor | repartidor
answer: |-
  Kevin Rojas Palomino | repartidor
  Kevin Rojas Palomino | repartidor
explain: |
  La fila de Kevin encuentra dos parejas en `empleos`, así que sale dos veces. `JOIN` no junta las parejas en una sola fila: arma una fila por pareja.
```

```exercise
id: sql5-completa-denunciante
type: complete
title: Quién denunció cada estafa
prompt: |
  Lista la `fecha` de cada denuncia de **estafa** y el **nombre** de quien la hizo, ordenadas por fecha y luego por `id` de la denuncia. Reemplaza los `___`.
starter: |
  SELECT d.fecha, p.nombre
  FROM denuncias AS d
  JOIN personas AS p ON ___ = ___
  WHERE d.tipo = 'estafa'
  ORDER BY d.fecha, d.id;
solution: |
  SELECT d.fecha, p.nombre
  FROM denuncias AS d
  JOIN personas AS p ON p.id = d.denunciante_id
  WHERE d.tipo = 'estafa'
  ORDER BY d.fecha, d.id;
hints:
  - "La denuncia guarda el `id` de la persona en `denunciante_id`."
tests:
  - name: fecha y nombre de cada estafa, en orden
    same: SELECT d.fecha, p.nombre FROM denuncias AS d JOIN personas AS p ON p.id = d.denunciante_id WHERE d.tipo = 'estafa' ORDER BY d.fecha, d.id
    ordered: true
```

```exercise
id: sql5-arregla-on
type: fix
title: Los nombres que no cuadran
prompt: |
  Esta consulta debería dar la `fecha`, el `lugar` y el **nombre de quien denunció** cada **robo en Miraflores**, por fecha y luego por `id`. Corre y salen nombres, pero no son los de quienes denunciaron. Arregla la condición del `ON`.
visual:
  figure:
    title: La columna que conecta
    panes:
      - label: "denuncias"
        table: { head: [id, tipo, denunciante_id], rows: [[57, robo, 812]] }
      - label: "personas"
        table: { head: [id, nombre], rows: [[57, "(alguien sin relación)"], [812, "(quien denunció)"]] }
starter: |
  SELECT d.fecha, d.lugar, p.nombre
  FROM denuncias AS d
  JOIN personas AS p ON p.id = d.id
  WHERE d.tipo = 'robo' AND d.distrito = 'Miraflores'
  ORDER BY d.fecha, d.id;
solution: |
  SELECT d.fecha, d.lugar, p.nombre
  FROM denuncias AS d
  JOIN personas AS p ON p.id = d.denunciante_id
  WHERE d.tipo = 'robo' AND d.distrito = 'Miraflores'
  ORDER BY d.fecha, d.id;
hints:
  - "`d.id` es el número de la denuncia, no de una persona. ¿Qué columna de `denuncias` apunta a `personas`?"
tests:
  - name: cada robo de Miraflores con quien lo denunció
    same: SELECT d.fecha, d.lugar, p.nombre FROM denuncias AS d JOIN personas AS p ON p.id = d.denunciante_id WHERE d.tipo = 'robo' AND d.distrito = 'Miraflores' ORDER BY d.fecha, d.id
    ordered: true
```

```exercise
id: sql5-arregla-coma
type: fix
title: Miles de autos amarillos
prompt: |
  La municipalidad pidió la **placa** y el **nombre del dueño** de los autos **amarillos** cuyos dueños viven en **Barranco**, por placa. La consulta usa la forma antigua con comas y devuelve una montaña de filas. Reescríbela con `JOIN … ON`.
starter: |
  SELECT v.placa, p.nombre
  FROM vehiculos AS v, personas AS p
  WHERE v.color = 'amarillo' AND p.distrito = 'Barranco'
  ORDER BY v.placa;
solution: |
  SELECT v.placa, p.nombre
  FROM vehiculos AS v
  JOIN personas AS p ON p.id = v.persona_id
  WHERE v.color = 'amarillo' AND p.distrito = 'Barranco'
  ORDER BY v.placa;
hints:
  - Le falta la condición que dice de quién es cada auto. Sin ella, cada auto amarillo sale con cada persona de Barranco.
  - "`JOIN personas AS p ON p.id = v.persona_id`."
tests:
  - name: placas amarillas de dueños de Barranco
    same: SELECT v.placa, p.nombre FROM vehiculos AS v JOIN personas AS p ON p.id = v.persona_id WHERE v.color = 'amarillo' AND p.distrito = 'Barranco' ORDER BY v.placa
    ordered: true
  - name: usa JOIN … ON
    source: '\bJOIN\b[\s\S]*\bON\b'
```

```exercise
id: sql5-escribe-tres
type: write
title: Autos blancos, licencias cargadas
prompt: |
  Lista la **placa**, el **nombre** del dueño y los **puntos** de su licencia de los autos **blancos** cuyos dueños tienen **más de 50 puntos** por faltas. Ordena de más puntos a menos y luego por placa. Necesitas tres tablas: `vehiculos`, `personas` y `licencias`.
visual:
  esquema:
    tables: [vehiculos, personas, licencias]
starter: |
  SELECT v.placa
  FROM vehiculos AS v
  WHERE v.color = 'blanco';
solution: |
  SELECT v.placa, p.nombre, l.puntos
  FROM vehiculos AS v
  JOIN personas AS p ON p.id = v.persona_id
  JOIN licencias AS l ON l.persona_id = p.id
  WHERE v.color = 'blanco' AND l.puntos > 50
  ORDER BY l.puntos DESC, v.placa;
hints:
  - "Un `JOIN` por tabla, cada uno con su `ON`: el auto con su dueño, el dueño con su licencia."
  - "`licencias` también se puede unir directo al auto: `l.persona_id = v.persona_id`. Da lo mismo."
tests:
  - name: placa, nombre y puntos, en orden
    same: SELECT v.placa, p.nombre, l.puntos FROM vehiculos AS v JOIN personas AS p ON p.id = v.persona_id JOIN licencias AS l ON l.persona_id = p.id WHERE v.color = 'blanco' AND l.puntos > 50 ORDER BY l.puntos DESC, v.placa
    ordered: true
```

## El caso

```exercise
id: sql5-caso-adelanto
type: case
title: El adelanto de Sonia
prompt: |
  **¿A quién le pagó Sonia Huamán Ríos el adelanto?** Escribe el nombre completo de la persona dueña del celular que recibió la plata.

  Sigue la cadena: su denuncia, su celular en `personas`, su pago en `transferencias` (el mensaje del pago dice "adelanto") y, con el celular que lo recibió, otra vez `personas`. Puedes hacerlo en pasos o en una sola consulta: para usar `personas` dos veces, dale dos alias, uno para la víctima y otro para quien cobró.
visual:
  - escenario:
      case: pagos
  - network:
      title: "La cadena de Sonia, fila por fila"
      nodes:
        - {"id": "d", "icon": "table", "label": "denuncias", "sub": "la denuncia de Sonia"}
        - {"id": "v", "icon": "record", "label": "personas", "sub": "alias v: la víctima"}
        - {"id": "t", "icon": "table", "label": "transferencias", "sub": "su pago"}
        - {"id": "c", "icon": "record", "label": "personas", "sub": "alias c: quien cobró"}
      links:
        - {"id": "l1", "label": "denunciante_id = id"}
        - {"id": "l2", "label": "telefono = de_telefono"}
        - {"id": "l3", "label": "a_telefono = telefono"}
      steps:
        - phase: "1. La denuncia"
          at: "d"
          note: "Empiezas en `denuncias`: la denuncia 46 es de Sonia y guarda un número, `denunciante_id = 118`."
          show:
            label: "denuncias"
            table: {"head": ["id", "tipo", "denunciante_id"], "rows": [["46", "estafa", "118"]]}
        - phase: "2. La víctima"
          move: ["d", "v"]
          packet: {"kind": "local", "label": "118"}
          note: "Ese 118 es el `id` de una fila de `personas`. A esa copia de la tabla le pones el alias `v`: es Sonia, con su celular."
          show:
            label: "personas (v)"
            table: {"head": ["id", "nombre", "telefono"], "rows": [["118", "Sonia Huamán Ríos", "979065539"]]}
        - phase: "3. El pago"
          move: ["v", "t"]
          packet: {"kind": "local", "label": "979065539"}
          note: "Su celular es el `de_telefono` de un pago: 300 soles con el mensaje «adelanto iPhone 13». El pago trae también el celular que recibió."
          show:
            label: "transferencias"
            table: {"head": ["de_telefono", "a_telefono", "monto"], "rows": [["979065539", "913488521", "300"]]}
        - phase: "4. Quien cobró"
          move: ["t", "c"]
          packet: {"kind": "local", "label": "913488521"}
          note: "Ese `a_telefono` es el celular de otra fila de `personas`, la segunda copia, con alias `c`. ¿De quién es? Es lo que buscas."
          tags: {"c": "alias c: ¿quién?"}
          show:
            label: "personas (c)"
            table: {"head": ["id", "nombre", "telefono"], "rows": [["?", "?", "913488521"]]}
starter: |
  -- La denuncia de Sonia está aquí. ¿Quién es su denunciante?
  SELECT id, fecha, denunciante_id, descripcion
  FROM denuncias
  WHERE tipo = 'estafa' AND distrito = 'Surquillo'
  ORDER BY fecha;
solution: |
  SELECT v.nombre AS victima, t.monto, t.mensaje, c.nombre AS cobrador
  FROM denuncias AS d
  JOIN personas AS v ON v.id = d.denunciante_id
  JOIN transferencias AS t ON t.de_telefono = v.telefono
  JOIN personas AS c ON c.telefono = t.a_telefono
  WHERE v.nombre = 'Sonia Huamán Ríos'
    AND t.mensaje LIKE 'adelanto%';
answer: Brenda Salazar Cusi
answerLabel: ¿Quién recibió el adelanto? (nombre completo)
reveal: |
  **Brenda Salazar Cusi**, una repartidora de 20 años de La Victoria. El 3 de marzo a las 19:12, el celular de Sonia le mandó S/ 300 con el mensaje "adelanto iPhone 13". En la denuncia, Yape mostraba "Brenda S.": cuadra. Pero Sonia no fue la única. ¿A quiénes les pagaron los demás?
hints:
  - "Primero `v` (la víctima) con `ON v.id = d.denunciante_id`; luego sus pagos con `ON t.de_telefono = v.telefono`."
  - "Para el nombre de quien recibió: `JOIN personas AS c ON c.telefono = t.a_telefono`."
```

## El juez

Como en las sesiones anteriores: tu consulta corre sobre las tablas del ejemplo y sobre bases ocultas. Aquí hay dos tablas, y en los casos ocultos hay puestos con dueños que no existen y dueños con varios puestos.

```exercise
id: sql5-juez-puestos
type: judge
title: Cada puesto con el celular de su dueño
prompt: |
  **Devuelve el número de cada puesto, su nombre, el nombre de su dueño y el teléfono del dueño; ordenado por número de puesto.**

  La asociación del mercado quiere llamar a todos los dueños. Un puesto cuyo `dueno_id` no está en la tabla de dueños no sale (esos se revisan aparte). Un dueño puede tener varios puestos. Si un dueño no tiene teléfono, sale igual, con `NULL`.

  **Tablas:** `puestos(numero, nombre, dueno_id)` y `duenos(id, nombre, telefono)`. Los números de puesto no se repiten.

  **Resultado:** número, nombre del puesto, nombre del dueño y teléfono, en ese orden.
schema: |
  CREATE TABLE puestos (numero INTEGER, nombre TEXT, dueno_id INTEGER);
  CREATE TABLE duenos (id INTEGER, nombre TEXT, telefono TEXT);
ordered: true
starter: |
  SELECT numero, nombre
  FROM puestos
  ORDER BY numero;
solution: |
  SELECT p.numero, p.nombre, d.nombre, d.telefono
  FROM puestos AS p
  JOIN duenos AS d ON d.id = p.dueno_id
  ORDER BY p.numero;
hints:
  - "Las dos tablas tienen una columna `nombre`: con alias (`p.nombre`, `d.nombre`) no hay confusión."
  - "El dueño de un puesto es la fila de `duenos` cuyo `id` es el `dueno_id` del puesto."
samples:
  - rows:
      puestos: [[12, "Juguería Lucía", 3], [47, "Loop", 1], [5, "Frutas Don Julio", 3]]
      duenos: [[1, "Carmen", "987111222"], [2, "Rosa", "955000111"], [3, "Lucía", null]]
    note: "Lucía tiene dos puestos y sale dos veces. Rosa no tiene puesto y no sale. Lucía no tiene teléfono: sale con NULL."
  - rows:
      puestos: [[8, "Pescados Beto", 9], [3, "Abarrotes Nelly", 2]]
      duenos: [[2, "Nelly", "912345678"]]
    note: "El dueño 9 no existe: el puesto 8 no sale."
edge:
  - rows: { puestos: [], duenos: [[1, "Carmen", "987111222"]] }
    tag: sin puestos
  - rows: { puestos: [[1, "A", 5], [2, "B", 6]], duenos: [[1, "X", "9"]] }
    tag: sin ningún dueño encontrado
  - rows: { puestos: [[30, "C", 1], [10, "A", 1], [20, "B", 1]], duenos: [[1, "Solo", "900000001"]] }
    tag: con un solo dueño de todos los puestos, desordenados
random:
  count: 40
  seed: 505
  generate: |
    const names = ["Carmen", "Rosa", "Lucía", "Beto", "Nelly", "Tito", "Juana", "Kike", "Pancho", "Mechita"];
    const rubros = ["Frutas", "Pescados", "Abarrotes", "Flores", "Menú", "Quesos", "Jugos", "Pollos"];
    const nd = rng.int(0, 8), np = rng.int(0, 14);
    const duenos = Array.from({ length: nd }, (_, i) => [i + 1, rng.pick(names), rng.chance(0.2) ? null : `9${rng.int(10000000, 99999999)}`]);
    const nums = [];
    while (nums.length < np) { const k = rng.int(1, 120); if (!nums.includes(k)) nums.push(k); }
    const puestos = nums.map((n) => [n, `${rng.pick(rubros)} ${n}`, rng.int(1, nd + 2)]);
    return { puestos, duenos };
wrong:
  - |
    SELECT p.numero, p.nombre, d.nombre, d.telefono FROM puestos AS p, duenos AS d ORDER BY p.numero;
  - |
    SELECT p.numero, p.nombre, d.nombre, d.telefono FROM puestos AS p JOIN duenos AS d ON d.id = p.numero ORDER BY p.numero;
  - |
    SELECT p.numero, p.nombre, d.nombre, d.telefono FROM puestos AS p LEFT JOIN duenos AS d ON d.id = p.dueno_id ORDER BY p.numero;
  - |
    SELECT p.numero, p.nombre, d.nombre, d.telefono FROM puestos AS p JOIN duenos AS d ON d.id = p.dueno_id ORDER BY d.nombre;
```

## Misión final

```exercise
id: sql5-mision-cobradores
type: mission
title: Los que cobran
prompt: |
  **Para cada denuncia de estafa cuyo denunciante pagó un adelanto, muestra la fecha de la denuncia como `fecha`, el nombre de la víctima como `victima`, el monto pagado como `monto` y el nombre de quien lo recibió como `cobrador`, ordenado por fecha.** Después di quién cobró más adelantos.

  Es la cadena del caso, pero para todas las víctimas que denunciaron. Cuenta las filas que te salen y compáralas con las denuncias de estafa que mencionan un adelanto.

  Cuando la consulta lo pruebe y respondas, junto con el juez, se abre la sesión 6.
visual:
  - escenario:
      case: pagos
  - esquema:
      tables: [denuncias, personas, transferencias]
starter: |
  SELECT d.fecha, v.nombre AS victima
  FROM denuncias AS d
  JOIN personas AS v ON v.id = d.denunciante_id
  WHERE d.tipo = 'estafa'
  ORDER BY d.fecha;
solution: |
  SELECT d.fecha, v.nombre AS victima, t.monto, c.nombre AS cobrador
  FROM denuncias AS d
  JOIN personas AS v ON v.id = d.denunciante_id
  JOIN transferencias AS t ON t.de_telefono = v.telefono
  JOIN personas AS c ON c.telefono = t.a_telefono
  WHERE d.tipo = 'estafa'
    AND t.mensaje LIKE 'adelanto%'
  ORDER BY d.fecha;
answer: Kevin Rojas Palomino
answerLabel: ¿Quién cobró más adelantos? (nombre completo)
reveal: |
  **Kevin Rojas Palomino** cobró tres: los de Walter, Ximena y Raúl. Brenda Salazar cobró dos y **Jhonatan Ugarte**, un chofer de San Juan de Lurigancho, otros dos. Tres cobradores, tres jóvenes que prestan su Yape.

  Pero mira la cuenta: hay **nueve** denuncias de estafa que hablan de un adelanto y la consulta da **siete** filas. Las denuncias de Edwin Condori y de Iván Choque desaparecieron en algún `JOIN`. En la sesión 6 vas a ver dónde se perdieron.
hints:
  - "Son las cuatro tablas del caso, pero sin el filtro por Sonia: `WHERE d.tipo = 'estafa' AND t.mensaje LIKE 'adelanto%'`."
  - Para saber quién cobró más, cuenta cuántas veces aparece cada nombre en la columna `cobrador`.
tests:
  - name: cada denuncia con su víctima, monto y cobrador, por fecha
    same: SELECT d.fecha, v.nombre, t.monto, c.nombre FROM denuncias AS d JOIN personas AS v ON v.id = d.denunciante_id JOIN transferencias AS t ON t.de_telefono = v.telefono JOIN personas AS c ON c.telefono = t.a_telefono WHERE d.tipo = 'estafa' AND t.mensaje LIKE 'adelanto%' ORDER BY d.fecha
    ordered: true
  - name: las columnas se llaman fecha, victima, monto y cobrador
    columns: [fecha, victima, monto, cobrador]
  - name: une las tablas con JOIN
    source: '\bJOIN\b'
```

## Reto experto

```exercise
id: sql5-reto-multiplica
type: challenge
title: Sin contar dos veces
prompt: |
  **Para cada cobrador con nombre, muestra su nombre como `cobrador`, el cargo de su empleo actual como `cargo`, cuántos adelantos recibió en marzo como `adelantos` y cuánto suman como `total`, de mayor a menor total.** Cuenta todos los adelantos, no solo los denunciados.

  Para quien ya programa: es la trampa de la multiplicación. Kevin tiene dos filas en `empleos` (una terminó en 2025); si unes sin cuidado, cada adelanto suyo se cuenta dos veces. El empleo actual es el que tiene `hasta` en `NULL`.
starter: |
  SELECT c.nombre AS cobrador, e.cargo, t.monto
  FROM transferencias AS t
  JOIN personas AS c ON c.telefono = t.a_telefono
  JOIN empleos AS e ON e.persona_id = c.id
  WHERE t.mensaje LIKE 'adelanto%';
solution: |
  SELECT c.nombre AS cobrador, e.cargo,
         COUNT(*) AS adelantos,
         SUM(t.monto) AS total
  FROM transferencias AS t
  JOIN personas AS c ON c.telefono = t.a_telefono
  JOIN empleos AS e ON e.persona_id = c.id AND e.hasta IS NULL
  WHERE t.mensaje LIKE 'adelanto%'
  GROUP BY c.id, c.nombre, e.cargo
  ORDER BY total DESC;
hints:
  - "Corre la consulta de arriba con `WHERE c.nombre LIKE 'Kevin%'` y cuenta: cada adelanto sale dos veces."
  - "La condición `e.hasta IS NULL` puede ir en el `ON` o en el `WHERE`; con un `JOIN` normal da lo mismo (en la sesión 6 verás cuándo no)."
tests:
  - name: una fila por cobrador, sin duplicar
    same: SELECT c.nombre, e.cargo, COUNT(*), SUM(t.monto) FROM transferencias AS t JOIN personas AS c ON c.telefono = t.a_telefono JOIN empleos AS e ON e.persona_id = c.id WHERE e.hasta IS NULL AND t.mensaje LIKE 'adelanto%' GROUP BY c.id ORDER BY 4 DESC
    ordered: true
  - name: columnas cobrador, cargo, adelantos y total
    columns: [cobrador, cargo, adelantos, total]
```
