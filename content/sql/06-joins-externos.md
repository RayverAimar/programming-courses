# Sesión 6 — LEFT JOIN, autojoins y antijoins

```session
case: pagos
```

## El encargo

Martes 24 de marzo. Ayer quedaron tres cobradores con nombre, pero también una cuenta que no cierra: **nueve denuncias** de estafa hablan de un adelanto y tu consulta devolvió **siete filas**. Las denuncias de **Edwin Condori** e **Iván Choque** se perdieron en el camino. Y hay algo más: Chasqui cree que hubo víctimas que pagaron y **nunca denunciaron**, por vergüenza o porque eran apenas 300 soles.

Para ver lo que falta necesitas joins que no descarten filas: el **LEFT JOIN**. Para seguir la plata de un celular al siguiente, una tabla unida **consigo misma**. Y para encontrar a quien nunca hizo algo, un **antijoin**.

```escenario
case: pagos
title: Lo que llevamos
caption: "Las pistas de la sesión 5 ya están marcadas. Hoy aparecen las de los pagos perdidos."
```

```expediente
title: Las dos denuncias que se perdieron
cards:
  - name: Edwin Condori Pumacayo
    traits: { style: cap, capColor: "#c49a3f", shirt: "#c49a3f" }
    role: Electricista, Comas
    rows: [["Pagó", "S/ 500 por un scooter"], ["Denunció", "9 de marzo"]]
    quote: "El número no tenía foto ni nombre en Yape."
  - name: Iván Choque Medina
    traits: { style: short, shirt: "#3f7cc4" }
    role: Estudiante, San Juan de Lurigancho
    rows: [["Pagó", "S/ 320 por un iPhone 13"], ["Denunció", "16 de marzo"]]
    quote: "Me dijeron que lo recogiera en Gamarra."
```

## Lo mínimo

`JOIN` (que en realidad se llama **INNER JOIN**) solo deja las filas que encuentran pareja. **`LEFT JOIN`** deja **todas las filas de la izquierda**: las que encuentran pareja salen con ella, y las que no, salen igual, con **`NULL`** en todas las columnas de la derecha. Así ves lo que falta.

```junta
title: LEFT JOIN no descarta a nadie de la izquierda
query: |
  SELECT t.a_telefono, t.monto, c.nombre
  FROM transferencias AS t
  LEFT JOIN personas AS c ON c.telefono = t.a_telefono;
left:
  name: t
  cols: [a_telefono, monto]
  rows: [["911000001", 300], ["955000002", 450], ["911000001", 250], ["977000003", 500]]
right:
  name: c
  cols: [telefono, nombre]
  rows: [["911000001", "Rosa Quispe"], ["955000002", "Beto Ramos"], ["933000004", "Kike Soto"]]
on: [a_telefono, telefono]
type: left
caption: "El 977000003 no está en `personas`: con `JOIN` desaparecería; con `LEFT JOIN` sale con `NULL` en `nombre`. Kike no recibió nada y no sale: solo se conservan las filas de la **izquierda**."
```

**`RIGHT JOIN`** es lo mismo mirado desde la otra tabla (conserva toda la derecha) y **`FULL JOIN`** conserva las dos. SQLite los tiene desde la versión 3.39 (2022); en código viejo verás que se daban vuelta las tablas para escribir un `LEFT JOIN`.

**El filtro en `ON` o en `WHERE`.** Con `JOIN` da lo mismo. Con `LEFT JOIN`, no: una condición en el `ON` decide **con quién se empareja** cada fila (y si no encuentra a nadie, sale con `NULL`); una condición en el `WHERE` se aplica **después** y tacha filas, también las rellenadas con `NULL`.

```resultado
title: La condición en el ON
query: |
  SELECT p.nombre, e.cargo
  FROM personas AS p
  LEFT JOIN empleos AS e ON e.persona_id = p.id AND e.cargo = 'técnico'
  WHERE p.id IN (118, 164, 207)
  ORDER BY p.id;
caption: "Las tres personas salen. Las que no tienen un empleo de técnico quedan con `NULL`."
```

```resultado
title: La misma condición en el WHERE
query: |
  SELECT p.nombre, e.cargo
  FROM personas AS p
  LEFT JOIN empleos AS e ON e.persona_id = p.id
  WHERE p.id IN (118, 164, 207)
    AND e.cargo = 'técnico'
  ORDER BY p.id;
caption: "`WHERE e.cargo = 'técnico'` es `NULL` en las filas rellenadas, así que las tacha: el `LEFT JOIN` se volvió un `JOIN` común sin avisar."
```

**Una tabla consigo misma (autojoin).** Para preguntar "A le pagó a B, ¿y B le pagó a alguien después?", unes `transferencias` con `transferencias`, con dos alias: `t1` es el primer pago y `t2` el siguiente, y el `ON` dice cómo se encadenan: lo que recibió `t1` es lo que paga `t2`.

```figura
title: Un autojoin encadena filas de la misma tabla
panes:
  - label: "t1: un pago"
    table: { head: [de_telefono, a_telefono, momento], rows: [[A, B, "10:40"]] }
  - label: "t2: otro pago de la misma tabla"
    table: { head: [de_telefono, a_telefono, momento], rows: [[B, C, "11:52"]] }
  - label: "ON t2.de_telefono = t1.a_telefono"
    value: "A → B → C"
steps:
  - "El mismo `B` es quien recibe en `t1` y quien paga en `t2`."
  - "Una condición más acota el tiempo: `t2.momento BETWEEN t1.momento AND datetime(t1.momento, '+3 hours')`."
```

En los autojoins es común pedir `a.id < b.id`, para no emparejar una fila consigo misma ni sacar cada par dos veces:

```sql run
SELECT a.nombre, b.nombre, a.nacimiento
FROM personas AS a
JOIN personas AS b ON b.nacimiento = a.nacimiento AND a.id < b.id
WHERE a.distrito = 'Surquillo' AND b.distrito = 'Surquillo';
```

**Antijoin y semijoin.** A veces no quieres las parejas, sino saber **si existen**. Un **antijoin** se queda con las filas que **no** tienen pareja: `LEFT JOIN … WHERE derecha.id IS NULL`, o mejor, `NOT EXISTS (…)`. Un **semijoin** se queda con las que **sí** tienen, **una sola vez** aunque tengan varias: `EXISTS (…)`. Lo de adentro del `EXISTS` es una consulta que mira la fila de afuera; en la sesión 7 verás cómo corre.

```junta
title: NOT EXISTS, quien no tiene ninguna pareja
query: |
  SELECT v.nombre
  FROM victimas AS v
  WHERE NOT EXISTS (
    SELECT 1 FROM denuncias AS d
    WHERE d.denunciante_id = v.id
  );
left:
  name: v
  cols: [id, nombre]
  rows: [[1, Rosa], [2, Beto], [3, Nelly], [4, Kike]]
right:
  name: d
  cols: [id, denunciante_id]
  rows: [[301, 1], [302, 3], [303, 3]]
on: [id, denunciante_id]
type: anti
caption: "Beto y Kike nunca denunciaron: son los que salen."
```

```junta
title: EXISTS, quien tiene al menos una
query: |
  SELECT v.nombre
  FROM victimas AS v
  WHERE EXISTS (
    SELECT 1 FROM denuncias AS d
    WHERE d.denunciante_id = v.id
  );
left:
  name: v
  cols: [id, nombre]
  rows: [[1, Rosa], [2, Beto], [3, Nelly], [4, Kike]]
right:
  name: d
  cols: [id, denunciante_id]
  rows: [[301, 1], [302, 3], [303, 3]]
on: [id, denunciante_id]
type: semi
caption: "Nelly denunció dos veces y sale una sola vez. Con un `JOIN` común saldría dos."
```

**Contar después de multiplicar.** Si un `JOIN` duplica filas, `COUNT(*)` cuenta los duplicados. `COUNT(DISTINCT p.id)` cuenta personas distintas:

```sql run
SELECT COUNT(*) AS filas, COUNT(DISTINCT p.id) AS personas
FROM personas AS p
JOIN empleos AS e ON e.persona_id = p.id;
```

> **Trampa común:** un `LEFT JOIN` seguido de un `WHERE` sobre una columna de la tabla de la derecha (`WHERE e.cargo = 'técnico'`) borra justo las filas que el `LEFT JOIN` había rescatado, porque en ellas esa columna es `NULL`. Si la condición es para elegir pareja, va en el `ON`. Si de verdad quieres las filas sin pareja, pregunta por ellas con `IS NULL`, y hazlo sobre una columna que nunca es `NULL` en la derecha, como su clave.

<!-- legacy: left-join -->

<!-- mdn: left-join -->

## Práctica

```exercise
id: sql6-predice-left
type: predict
title: Sin empleo y con dos
prompt: |
  207 es Ximena Flores, que no tiene ningún empleo registrado; 742 es Kevin Rojas, que tuvo dos. ¿Qué devuelve?
code: |
  SELECT p.nombre, e.cargo
  FROM personas AS p
  LEFT JOIN empleos AS e ON e.persona_id = p.id
  WHERE p.id IN (207, 742)
  ORDER BY p.id, e.desde;
options:
  - |-
    Ximena Flores Aguilar | NULL
    Kevin Rojas Palomino | repartidor
    Kevin Rojas Palomino | repartidor
  - |-
    Kevin Rojas Palomino | repartidor
    Kevin Rojas Palomino | repartidor
  - |-
    Ximena Flores Aguilar | NULL
    Kevin Rojas Palomino | repartidor
  - |-
    Ximena Flores Aguilar |
    Kevin Rojas Palomino | repartidor
answer: |-
  Ximena Flores Aguilar | NULL
  Kevin Rojas Palomino | repartidor
  Kevin Rojas Palomino | repartidor
explain: |
  Ximena no encuentra pareja y, por ser `LEFT JOIN`, sale igual con `NULL`. Kevin encuentra dos y sale dos veces: el `LEFT JOIN` también multiplica.
```

```exercise
id: sql6-predice-on-where
type: predict
title: ON o WHERE
prompt: |
  Hay 24 cámaras y solo la 3 leyó la placa `b7r415`. ¿Qué devuelven las dos consultas?
code: |
  SELECT count(*)
  FROM camaras AS c
  LEFT JOIN avistamientos AS a ON a.camara_id = c.id AND a.placa = 'b7r415';

  SELECT count(*)
  FROM camaras AS c
  LEFT JOIN avistamientos AS a ON a.camara_id = c.id
  WHERE a.placa = 'b7r415';
options:
  - |-
    24
    1
  - |-
    1
    1
  - |-
    24
    24
  - |-
    1
    24
answer: |-
  24
  1
explain: |
  En la primera, la placa elige la pareja: la cámara 3 la encuentra y las otras 23 salen con `NULL`. En la segunda, el `LEFT JOIN` empareja cada cámara con todas sus lecturas y después el `WHERE` tacha todo lo que no es `b7r415`, también las 23 sin pareja.
```

```exercise
id: sql6-completa-sin-lecturas
type: complete
title: Robots en silencio
prompt: |
  Lista el **nombre** de los robots que **no tienen ninguna lectura** en `lecturas`, en orden alfabético. Usa un `LEFT JOIN` y quédate con las filas sin pareja. Reemplaza los `___`.
starter: |
  SELECT r.nombre
  FROM robots AS r
  ___ lecturas AS l ON l.robot_id = r.id
  WHERE l.id ___
  ORDER BY r.nombre;
solution: |
  SELECT r.nombre
  FROM robots AS r
  LEFT JOIN lecturas AS l ON l.robot_id = r.id
  WHERE l.id IS NULL
  ORDER BY r.nombre;
hints:
  - "Un robot sin lecturas sale del `LEFT JOIN` con `NULL` en todas las columnas de `l`, también en `l.id`, que en una lectura real nunca es `NULL`."
tests:
  - name: los robots sin lecturas, en orden
    same: SELECT r.nombre FROM robots AS r WHERE NOT EXISTS (SELECT 1 FROM lecturas AS l WHERE l.robot_id = r.id) ORDER BY r.nombre
    ordered: true
```

```exercise
id: sql6-arregla-camaras
type: fix
title: Las cámaras que no lo vieron
prompt: |
  Se quiere **cada una de las 24 cámaras** (`codigo`) con las lecturas de la placa de Renzo, **B7R-415** escrita como sea (`placa`), y las cámaras que nunca la leyeron con `NULL`. Ordena por `id` de la cámara y luego por momento. La consulta devuelve solo 3 filas: arréglala.
starter: |
  SELECT c.codigo, a.placa
  FROM camaras AS c
  LEFT JOIN avistamientos AS a ON a.camara_id = c.id
  WHERE upper(replace(replace(a.placa, ' ', ''), '-', '')) = 'B7R415'
  ORDER BY c.id, a.momento_utc;
solution: |
  SELECT c.codigo, a.placa
  FROM camaras AS c
  LEFT JOIN avistamientos AS a
    ON a.camara_id = c.id
   AND upper(replace(replace(a.placa, ' ', ''), '-', '')) = 'B7R415'
  ORDER BY c.id, a.momento_utc;
hints:
  - El `WHERE` tacha las filas donde `a.placa` es `NULL`, que son justo las cámaras sin pareja.
  - "La condición sobre la placa elige la pareja: muévela al `ON` con `AND`."
tests:
  - name: las 24 cámaras, con la placa o NULL
    same: SELECT c.codigo, a.placa FROM camaras AS c LEFT JOIN avistamientos AS a ON a.camara_id = c.id AND upper(replace(replace(a.placa, ' ', ''), '-', '')) = 'B7R415' ORDER BY c.id, a.momento_utc
    ordered: true
```

```exercise
id: sql6-escribe-sin-denuncia
type: write
title: Pagaron y no denunciaron
prompt: |
  Lista el **nombre** y el **monto** de las víctimas que pagaron un **adelanto** (el mensaje del pago empieza con `adelanto`) y **nunca hicieron una denuncia de estafa**, en orden alfabético. Usa `NOT EXISTS` o un `LEFT JOIN … IS NULL`.
visual:
  junta:
    left:
      name: victimas
      cols: [id, nombre]
      rows: [[118, Sonia], [512, "?"], [164, Walter]]
    right:
      name: denuncias
      cols: [id, denunciante_id]
      rows: [[11, 118], [12, 164]]
    on: [id, denunciante_id]
    type: anti
starter: |
  SELECT v.nombre, t.monto
  FROM transferencias AS t
  JOIN personas AS v ON v.telefono = t.de_telefono
  WHERE t.mensaje LIKE 'adelanto%'
  ORDER BY v.nombre;
solution: |
  SELECT v.nombre, t.monto
  FROM transferencias AS t
  JOIN personas AS v ON v.telefono = t.de_telefono
  WHERE t.mensaje LIKE 'adelanto%'
    AND NOT EXISTS (
      SELECT 1 FROM denuncias AS d
      WHERE d.denunciante_id = v.id AND d.tipo = 'estafa'
    )
  ORDER BY v.nombre;
hints:
  - "`NOT EXISTS (SELECT 1 FROM denuncias AS d WHERE d.denunciante_id = v.id AND d.tipo = 'estafa')`: no hay ninguna denuncia de estafa de esta persona."
  - "Con `LEFT JOIN`: `LEFT JOIN denuncias AS d ON d.denunciante_id = v.id AND d.tipo = 'estafa'` y `WHERE d.id IS NULL`. El tipo va en el `ON`."
tests:
  - name: las víctimas que no denunciaron, con su monto
    same: SELECT v.nombre, t.monto FROM transferencias AS t JOIN personas AS v ON v.telefono = t.de_telefono LEFT JOIN denuncias AS d ON d.denunciante_id = v.id AND d.tipo = 'estafa' WHERE t.mensaje LIKE 'adelanto%' AND d.id IS NULL ORDER BY v.nombre
    ordered: true
```

```exercise
id: sql6-escribe-exists
type: write
title: Vecinos de La Victoria que cobraron
prompt: |
  Lista el **nombre** de las personas que viven en **La Victoria** y recibieron **al menos un adelanto**, cada una **una sola vez**, en orden alfabético. Usa `EXISTS`.
starter: |
  SELECT p.nombre
  FROM personas AS p
  JOIN transferencias AS t ON t.a_telefono = p.telefono
  WHERE p.distrito = 'La Victoria'
    AND t.mensaje LIKE 'adelanto%'
  ORDER BY p.nombre;
solution: |
  SELECT p.nombre
  FROM personas AS p
  WHERE p.distrito = 'La Victoria'
    AND EXISTS (
      SELECT 1 FROM transferencias AS t
      WHERE t.a_telefono = p.telefono AND t.mensaje LIKE 'adelanto%'
    )
  ORDER BY p.nombre;
hints:
  - Corre la consulta de arriba: cada nombre sale una vez por adelanto. `EXISTS` solo pregunta si hay alguno.
tests:
  - name: cada persona una vez, en orden
    same: SELECT DISTINCT p.nombre FROM personas AS p JOIN transferencias AS t ON t.a_telefono = p.telefono WHERE p.distrito = 'La Victoria' AND t.mensaje LIKE 'adelanto%' ORDER BY p.nombre
    ordered: true
  - name: usa EXISTS
    source: '\bEXISTS\s*\('
```

## El caso

```exercise
id: sql6-caso-chip
type: case
title: Los dos pagos perdidos
prompt: |
  **¿A qué número fueron los adelantos de Edwin Condori e Iván Choque?** Escribe el número de celular.

  Abajo está la consulta de la misión de ayer. Cambia el `JOIN` que pierde filas por uno que no las pierda, y muestra también el celular que recibió cada pago (`t.a_telefono`).
visual:
  - escenario:
      case: pagos
  - figure:
      title: Nueve denuncias, siete filas
      panes:
        - label: "denuncias con adelanto"
          value: "9"
        - label: "filas con JOIN"
          value: "7"
        - label: "¿dónde están las otras 2?"
          value: "?"
starter: |
  SELECT d.fecha, v.nombre AS victima, t.monto, c.nombre AS cobrador
  FROM denuncias AS d
  JOIN personas AS v ON v.id = d.denunciante_id
  JOIN transferencias AS t ON t.de_telefono = v.telefono
  JOIN personas AS c ON c.telefono = t.a_telefono
  WHERE d.tipo = 'estafa'
    AND t.mensaje LIKE 'adelanto%'
  ORDER BY d.fecha;
solution: |
  SELECT d.fecha, v.nombre AS victima, t.monto, t.a_telefono, c.nombre AS cobrador
  FROM denuncias AS d
  JOIN personas AS v ON v.id = d.denunciante_id
  JOIN transferencias AS t ON t.de_telefono = v.telefono
  LEFT JOIN personas AS c ON c.telefono = t.a_telefono
  WHERE d.tipo = 'estafa'
    AND t.mensaje LIKE 'adelanto%'
  ORDER BY d.fecha;
answer: "951207384"
answerLabel: ¿A qué número fueron? (9 dígitos)
reveal: |
  **Al 951207384**, que no es de nadie en el padrón: es un **chip** comprado sin registrar. Por eso el último `JOIN` lo descartaba. Edwin le pagó S/ 500 el 6 de marzo e Iván S/ 320 el 10. Ya son **cuatro** números cobrando: Kevin, Brenda, Jhonatan y un chip anónimo.
hints:
  - "La fila se pierde en el último `JOIN`, el que busca al dueño del celular que recibió. Si nadie es dueño de ese número, no hay pareja."
  - "`LEFT JOIN personas AS c ON c.telefono = t.a_telefono` y agrega `t.a_telefono` al `SELECT`."
```

## El juez

Como antes, tu consulta corre sobre el ejemplo y sobre bases ocultas. Ojo: en algunas bases ocultas hay pedidos sin cliente (`cliente_id` en `NULL`) y pedidos sin monto.

```exercise
id: sql6-juez-sin-pedidos
type: judge
title: Clientes que nunca pidieron
prompt: |
  **Devuelve el `id` y el `nombre` de los clientes que no tienen ningún pedido, ordenados por `id`.**

  La juguería quiere mandarles un cupón a los clientes registrados que nunca pidieron nada. Los datos vienen de una caja vieja: hay pedidos sin cliente (`cliente_id` en `NULL`, una venta al paso) y pedidos con el monto vacío. Un pedido cuenta aunque no tenga monto.

  **Tablas:** `clientes(id, nombre)` y `pedidos(id, cliente_id, monto)`.

  **Resultado:** `id` y `nombre`, ordenado por `id`.
schema: |
  CREATE TABLE clientes (id INTEGER, nombre TEXT);
  CREATE TABLE pedidos (id INTEGER, cliente_id INTEGER, monto REAL);
ordered: true
starter: |
  SELECT c.id, c.nombre
  FROM clientes AS c
  JOIN pedidos AS p ON p.cliente_id = c.id
  ORDER BY c.id;
solution: |
  SELECT c.id, c.nombre
  FROM clientes AS c
  WHERE NOT EXISTS (
    SELECT 1 FROM pedidos AS p
    WHERE p.cliente_id = c.id
  )
  ORDER BY c.id;
hints:
  - "Es un antijoin: `NOT EXISTS (SELECT 1 FROM pedidos AS p WHERE p.cliente_id = c.id)`."
  - "Si usas `LEFT JOIN … IS NULL`, pregunta por `p.id`, no por `p.monto`: un pedido real puede tener el monto vacío. Y cuidado con `NOT IN` si `cliente_id` puede ser `NULL`."
samples:
  - rows:
      clientes: [[1, "Rosa"], [2, "Beto"], [3, "Nelly"], [4, "Kike"]]
      pedidos: [[10, 1, 12.5], [11, 3, null], [12, 1, 8.0]]
    note: "Rosa pidió dos veces y Nelly una (sin monto, pero pidió). Beto y Kike nunca."
  - rows:
      clientes: [[5, "Tito"], [6, "Juana"]]
      pedidos: [[20, null, 4.5], [21, 6, 9.0]]
    note: "El pedido 20 no tiene cliente: no es de Tito. Tito sale."
edge:
  - rows: { clientes: [[1, "A"], [2, "B"]], pedidos: [] }
    tag: sin ningún pedido
  - rows: { clientes: [], pedidos: [[1, 1, 5.0]] }
    tag: sin clientes
  - rows: { clientes: [[3, "C"], [1, "A"], [2, "B"]], pedidos: [[1, null, 2.0], [2, 2, null]] }
    tag: con un pedido sin cliente y otro sin monto
random:
  count: 40
  seed: 606
  generate: |
    const names = ["Rosa", "Beto", "Nelly", "Kike", "Juana", "Tito", "Pancho", "Mechita", "Lucho", "Carmen"];
    const nc = rng.int(0, 10), np = rng.int(0, 14);
    const ids = [];
    while (ids.length < nc) { const k = rng.int(1, 40); if (!ids.includes(k)) ids.push(k); }
    const clientes = ids.map((id) => [id, rng.pick(names)]);
    const pedidos = Array.from({ length: np }, (_, i) => [i + 1, rng.chance(0.2) ? null : rng.int(1, 45), rng.chance(0.25) ? null : rng.int(2, 40) / 2]);
    return { clientes, pedidos };
wrong:
  - |
    SELECT id, nombre FROM clientes WHERE id NOT IN (SELECT cliente_id FROM pedidos) ORDER BY id;
  - |
    SELECT c.id, c.nombre FROM clientes AS c LEFT JOIN pedidos AS p ON p.cliente_id = c.id WHERE p.monto IS NULL ORDER BY c.id;
  - |
    SELECT c.id, c.nombre FROM clientes AS c JOIN pedidos AS p ON p.cliente_id <> c.id ORDER BY c.id;
```

## Misión final

```exercise
id: sql6-mision-salto
type: mission
title: A dónde salta la plata
prompt: |
  **Para cada adelanto, busca los pagos que hizo el celular que lo recibió en las tres horas siguientes. Muestra el monto del adelanto como `adelanto`, el monto que salió como `salida`, los minutos que pasaron entre los dos como `minutos` y el nombre de quien recibió la salida como `recibe`, ordenado por el momento del adelanto.** Después di a quién llega la plata.

  Es un autojoin: `t1` es el adelanto y `t2` el pago siguiente, de la misma tabla. Usa `LEFT JOIN` para el nombre de quien recibe, por si es otro chip.

  Cuando la consulta lo pruebe y respondas, junto con el juez, se abre la sesión 7.
visual:
  - escenario:
      case: pagos
  - network:
      title: "Un adelanto y lo que hace después"
      nodes:
        - {"id": "s", "icon": "person", "label": "Sonia", "sub": "la víctima"}
        - {"id": "b", "icon": "person", "label": "Brenda", "sub": "quien cobró (t1)"}
        - {"id": "x", "icon": "box", "label": "¿Quién?", "sub": "el siguiente pago (t2)"}
      links: [{"id": "a", "label": "adelanto"}, {"id": "b2", "label": "hasta 3 horas después"}]
      clockLabel: "Desde el adelanto"
      clockMax: 120
      steps:
        - {"at": "s", "clock": 0, "clockText": "0 min", "note": "3 de marzo, 19:12: Sonia manda S/ 300 como adelanto."}
        - move: ["s", "b"]
          packet: {"kind": "up", "label": "S/ 300, adelanto"}
          clock: 0
          clockText: "0 min"
          note: "El pago `t1` llega al celular de Brenda."
        - move: ["b", "x"]
          packet: {"kind": "up", "label": "S/ 270"}
          clock: 65
          clockText: "65 min"
          tags: {"x": "¿de quién es?"}
          note: "65 minutos después, ese mismo celular paga S/ 270 a otro número: el pago `t2`. Tu consulta lo hace con las 14 víctimas a la vez y con `LEFT JOIN` para el nombre."
starter: |
  SELECT t1.a_telefono, t1.monto, t1.momento
  FROM transferencias AS t1
  WHERE t1.mensaje LIKE 'adelanto%'
  ORDER BY t1.momento;
solution: |
  SELECT t1.monto AS adelanto,
         t2.monto AS salida,
         CAST(round((julianday(t2.momento) - julianday(t1.momento)) * 24 * 60) AS INTEGER) AS minutos,
         r.nombre AS recibe
  FROM transferencias AS t1
  JOIN transferencias AS t2
    ON t2.de_telefono = t1.a_telefono
   AND t2.momento BETWEEN t1.momento AND datetime(t1.momento, '+3 hours')
  LEFT JOIN personas AS r ON r.telefono = t2.a_telefono
  WHERE t1.mensaje LIKE 'adelanto%'
  ORDER BY t1.momento;
answer: Milagros Tello Benavides
answerLabel: ¿A quién llega la plata? (nombre completo)
reveal: |
  **A Milagros Tello Benavides.** Los 14 adelantos, de los cuatro cobradores (el chip también), saltan a su celular entre 48 y 140 minutos después, y siempre es **el 90 %**: de 300 salen 270, de 500 salen 450. Los cobradores se quedan con una comisión y pasan el resto. Milagros vive en Surquillo y trabaja de cajera. ¿Es ella la que manda, o solo la caja de alguien más?
hints:
  - "El `ON` del autojoin: `t2.de_telefono = t1.a_telefono AND t2.momento BETWEEN t1.momento AND datetime(t1.momento, '+3 hours')`."
  - "Los minutos: `(julianday(t2.momento) - julianday(t1.momento)) * 24 * 60`, redondeado y pasado a entero como en la sesión 3."
tests:
  - name: cada adelanto con el pago que sigue, por momento
    same: SELECT t1.monto, t2.monto, CAST(round((julianday(t2.momento) - julianday(t1.momento)) * 1440) AS INTEGER), r.nombre FROM transferencias AS t1 JOIN transferencias AS t2 ON t2.de_telefono = t1.a_telefono AND t2.momento BETWEEN t1.momento AND datetime(t1.momento, '+3 hours') LEFT JOIN personas AS r ON r.telefono = t2.a_telefono WHERE t1.mensaje LIKE 'adelanto%' ORDER BY t1.momento
    ordered: true
  - name: las columnas se llaman adelanto, salida, minutos y recibe
    columns: [adelanto, salida, minutos, recibe]
```

## Reto experto

```exercise
id: sql6-reto-devueltas
type: challenge
title: Llamadas devueltas
prompt: |
  **Encuentra las llamadas que fueron devueltas en menos de una hora: alguien llama y, dentro de los 60 minutos siguientes, el que recibió llama de vuelta al que llamó. Muestra el nombre de quien llamó primero como `llama`, el de quien devolvió como `devuelve` (o `NULL` si el número no es de nadie), la hora de la primera llamada como `inicio` y los minutos hasta la devolución como `minutos`. Ordena por `inicio`.**

  Para quien ya programa: es un autojoin sobre `llamadas` con la condición "cruzada" (`origen` con `destino` y al revés) más una ventana de tiempo, y dos `LEFT JOIN` a `personas`. Mira bien los nombres que salen.
starter: |
  SELECT origen, destino, inicio
  FROM llamadas
  ORDER BY inicio
  LIMIT 20;
solution: |
  SELECT p1.nombre AS llama,
         p2.nombre AS devuelve,
         a.inicio,
         CAST(round((julianday(b.inicio) - julianday(a.inicio)) * 24 * 60) AS INTEGER) AS minutos
  FROM llamadas AS a
  JOIN llamadas AS b
    ON b.origen = a.destino
   AND b.destino = a.origen
   AND b.inicio > a.inicio
   AND b.inicio <= datetime(a.inicio, '+1 hour')
  LEFT JOIN personas AS p1 ON p1.telefono = a.origen
  LEFT JOIN personas AS p2 ON p2.telefono = a.destino
  ORDER BY a.inicio;
hints:
  - "`b` devuelve la llamada `a` cuando `b.origen = a.destino AND b.destino = a.origen`, y empieza después de `a` pero antes de `datetime(a.inicio, '+1 hour')`."
  - "Quien devuelve es el destino de la primera llamada: `p2.telefono = a.destino`."
tests:
  - name: las llamadas devueltas en menos de una hora
    same: SELECT p1.nombre, p2.nombre, a.inicio, CAST(round((julianday(b.inicio) - julianday(a.inicio)) * 1440) AS INTEGER) FROM llamadas AS a JOIN llamadas AS b ON b.origen = a.destino AND b.destino = a.origen AND b.inicio > a.inicio AND b.inicio <= datetime(a.inicio, '+1 hour') LEFT JOIN personas AS p1 ON p1.telefono = a.origen LEFT JOIN personas AS p2 ON p2.telefono = a.destino ORDER BY a.inicio
    ordered: true
  - name: columnas llama, devuelve, inicio y minutos
    columns: [llama, devuelve, inicio, minutos]
```
