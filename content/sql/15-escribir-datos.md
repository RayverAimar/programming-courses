# Sesión 15 — INSERT, UPDATE y DELETE

```session
case: taller
```

## El encargo

Lunes 6 de abril de 2026. Con cuatro expedientes cerrados, la Municipalidad de Surquillo confía en Loop. **Edith Choque**, la gerenta de Mercados, llama temprano: la oficina que administra las licencias del Mercado N.º 1 funciona con una app vieja que escribe en una base de datos, el **padrón de puestos**, y quiere que Loop la reemplace. Hasta hoy solo leías la base; desde hoy **escribes en ella**.

Esa misma mañana, **Carmen** recibe una notificación rara: según la municipalidad, el puesto 47, el de Loop, **ya no está a su nombre**. Ella nunca firmó nada. Antes de tocar una sola fila vas a aprender a escribir datos sin romper nada: un `UPDATE` sin `WHERE` cambia los 120 puestos de un golpe.

```escenario
case: taller
title: La Oficina de Mercados, segundo piso del Mercado N.º 1
caption: "La ventanilla 1 (Alfredo) y la ventanilla 2 (Susana) atienden al público; al fondo, el servidor del padrón y la computadora de sistemas. Chasqui instaló la laptop de Loop en la mesa del centro."
```

```expediente
title: Quién te recibe
cards:
  - name: Edith Choque Ramos
    traits: { style: bun, hair: "#7a7a7a", shirt: "#c43f84" }
    role: Gerenta de Mercados, Municipalidad de Surquillo
    quote: "El padrón es la ley del mercado: si ahí dice que el puesto es tuyo, es tuyo."
  - name: Carmen Ríos Llanos
    traits: { style: bun, shirt: "#3f7cc4", glasses: true }
    role: Técnica de Loop, puesto 47
    quote: "¿Traspaso? Yo no he traspasado nada. Ese puesto lo trabajo hace cinco años."
  - name: Chasqui
    kind: chasqui
    role: Asistente de detective de Loop
    quote: "Hasta ahora mirábamos. Hoy, si nos equivocamos, el error se queda guardado."
```

```figura
title: "Quién es quién en la oficina"
table:
  head: ["persona", "usuario", "ventanilla", "computadora"]
  rows:
    - ["Alfredo Benavides", "abenavides", "ventanilla 1", "VENT-1"]
    - ["Susana Salazar", "ssalazar", "ventanilla 2", "VENT-2"]
    - ["Delia Lozano", "dlozano", "sistemas", "SIS-01"]
caption: "Cada persona escribe en el padrón con su propio usuario y desde su propia computadora. Esta tabla es la que cruzarás con la bitácora."
```

## Lo mínimo

Leer no cambia nada; escribir sí. SQL tiene tres sentencias para cambiar filas, y las tres se parecen a un `SELECT`:

```esquema
title: El padrón y sus trámites
tables: [padron_puestos, tramites, personas]
caption: "`padron_puestos` tiene una fila por puesto: su titular, su licencia y cuándo vence. `tramites` guarda lo que se pidió en las ventanillas."
```

- **`INSERT INTO tabla (col1, col2) VALUES (v1, v2), (v3, v4);`** agrega filas. Las columnas que no nombras quedan en `NULL` (o en su `DEFAULT`). También puedes insertar el resultado de una consulta: `INSERT INTO t (a, b) SELECT x, y FROM … WHERE …`.
- **`UPDATE tabla SET col = expresión, otra = … WHERE condición;`** cambia las filas que cumplen el `WHERE`. La expresión puede usar el valor viejo: `SET pago = pago * 1.1`.
- **`DELETE FROM tabla WHERE condición;`** borra las filas que cumplen el `WHERE`.
- **Sin `WHERE`, `UPDATE` y `DELETE` tocan todas las filas.** El hábito que salva carreras: escribe primero `SELECT * FROM tabla WHERE …`, mira qué filas salen, y recién entonces cambia `SELECT *` por `UPDATE … SET …` o `DELETE`.
- **`RETURNING`** al final de cualquiera de las tres devuelve las filas que tocó, como un `SELECT`: `DELETE FROM … WHERE … RETURNING id, puesto;`.

Por dentro, el motor hace lo mismo que con un `SELECT`: recorre la tabla, evalúa el `WHERE` fila por fila y, en cada fila que pasa, calcula los valores nuevos y la reescribe. Si **una sola** fila rompe una regla de la tabla, SQLite **deshace la sentencia entera**: nunca quedan cambios a medias. Dale a ▶:

```cambio
title: Tres sentencias sobre una tabla chiquita
setup: |
  CREATE TABLE licencias (puesto INTEGER PRIMARY KEY, titular TEXT NOT NULL, vence TEXT, pago REAL CHECK (pago >= 0));
  INSERT INTO licencias VALUES (12, 'Lucía', '2026-10-24', 120), (47, 'Carmen', '2026-03-31', 120), (58, 'Nelly', '2026-02-05', 90);
sql: |
  UPDATE licencias SET vence = '2027-03-31' WHERE puesto = 47 RETURNING puesto, vence;
  INSERT INTO licencias VALUES (121, 'Kike', '2027-01-15', 150), (47, 'Yolanda', '2026-03-31', 0);
  DELETE FROM licencias WHERE vence < '2026-04-06';
  UPDATE licencias SET pago = pago * 1.5;
expectError: true
notes:
  - "El `WHERE` deja pasar solo el puesto 47; su `vence` cambia y `RETURNING` devuelve la fila como quedó."
  - ""
  - "El `WHERE` encuentra un puesto con la licencia vencida (el 58) y lo borra."
  - "**Sin `WHERE`:** las dos filas que quedan pagan 50 % más. Fíjate qué fácil es."
caption: "La segunda sentencia trae dos filas: la del puesto 121 estaba bien, pero el 47 ya existía (es la **clave primaria**). SQLite no inserta ni la buena: la sentencia es **atómica**."
```

**Las reglas de la tabla** se escriben al crearla y la base las hace cumplir en cada `INSERT` y `UPDATE`:

| restricción | qué impide |
|---|---|
| `PRIMARY KEY` | dos filas con la misma clave (y en SQLite, `INTEGER PRIMARY KEY` es el `rowid`: se llena solo) |
| `NOT NULL` | dejar la columna vacía |
| `UNIQUE` | dos filas con el mismo valor en esa columna |
| `CHECK (condición)` | una fila que no cumple la condición, como `pago >= 0` |
| `REFERENCES otra(id)` | apuntar a una fila que no existe (**clave foránea**) |
| `DEFAULT valor` | (no impide nada) el valor cuando no lo das |

Dos rarezas de SQLite que conviene saber. Las claves foráneas **vienen apagadas**: hay que encenderlas en cada conexión con `PRAGMA foreign_keys = ON;`. Y los tipos son **flexibles**: en una columna `INTEGER` puedes guardar `'doce'` y SQLite lo acepta como texto. Si quieres tipos estrictos, como en PostgreSQL, crea la tabla con **`STRICT`** al final: `CREATE TABLE t (…) STRICT;`.

**UPSERT.** Con una restricción `UNIQUE` o `PRIMARY KEY`, un `INSERT` que choca puede convertirse en un `UPDATE`: `INSERT … ON CONFLICT (columna) DO UPDATE SET col = excluded.col`. `excluded` es la fila que intentabas insertar. Con `DO NOTHING`, la fila que choca simplemente no entra.

```sql run
SELECT pp.puesto, p.nombre AS titular, pp.vence, pp.actualizado, pp.actualizado_por
FROM padron_puestos pp
JOIN personas p ON p.id = pp.titular_id
WHERE pp.puesto BETWEEN 10 AND 14;
```

> **Trampa común:** el `UPDATE` sin `WHERE`. No hay "¿está seguro?": SQLite cambia todas las filas y te dice cuántas. Un pariente igual de peligroso es el **punto y coma suelto**: `UPDATE t SET x = 1; WHERE id = 5;` son dos sentencias, y la primera, sin `WHERE`, ya corrió cuando la segunda da error. En una base real eso no se deshace solo: por eso la próxima sesión aprenderás transacciones.

<!-- legacy: upsert -->

<!-- legacy: foreign-keys -->

<!-- mdn: upsert foreign-keys -->

## Práctica

```exercise
id: sql15-predice-sin-where
type: predict
title: El UPDATE sin WHERE
db: empty
setup: |
  CREATE TABLE puestos_nuevos (numero INTEGER PRIMARY KEY, rubro TEXT NOT NULL);
  INSERT INTO puestos_nuevos VALUES (1, 'frutas'), (2, 'pescado'), (3, 'frutas');
prompt: |
  La tabla `puestos_nuevos` tiene tres puestos: 1 y 3 venden frutas, 2 vende pescado. ¿Qué devuelve el último `SELECT`?
code: |
  UPDATE puestos_nuevos SET rubro = 'flores';
  SELECT rubro, COUNT(*) FROM puestos_nuevos GROUP BY rubro;
options:
  - "flores | 3"
  - "flores | 2\npescado | 1"
  - "flores | 1\nfrutas | 2"
  - "flores | 0"
answer: "flores | 3"
explain: |
  Sin `WHERE`, la condición es "todas las filas": los tres puestos pasan a vender flores, también el de pescado. SQLite no pregunta: hace el cambio y cuenta 3 filas cambiadas.
```

```exercise
id: sql15-predice-upsert
type: predict
title: Insertar o actualizar
db: empty
setup: |
  CREATE TABLE puestos_nuevos (numero INTEGER PRIMARY KEY, rubro TEXT NOT NULL);
  INSERT INTO puestos_nuevos VALUES (1, 'frutas'), (2, 'pescado'), (3, 'frutas');
prompt: |
  Misma tabla. ¿Qué devuelve?
code: |
  INSERT INTO puestos_nuevos (numero, rubro)
  VALUES (2, 'pollo'), (4, 'pan')
  ON CONFLICT (numero) DO UPDATE SET rubro = excluded.rubro;
  SELECT numero, rubro FROM puestos_nuevos ORDER BY numero;
options:
  - "1 | frutas\n2 | pollo\n3 | frutas\n4 | pan"
  - "1 | frutas\n2 | pescado\n3 | frutas\n4 | pan"
  - "1 | frutas\n2 | pescado\n2 | pollo\n3 | frutas\n4 | pan"
  - "1 | frutas\n2 | pollo\n3 | frutas"
answer: "1 | frutas\n2 | pollo\n3 | frutas\n4 | pan"
explain: |
  El puesto 2 ya existía: choca con la clave primaria y, en lugar de fallar, se convierte en un `UPDATE` con el rubro de la fila que intentabas insertar (`excluded.rubro`). El 4 no choca y entra normal.
```

```exercise
id: sql15-completa-alta
type: complete
title: Un puesto nuevo
prompt: |
  El mercado estrena el **puesto 121**, de abarrotes, a nombre de **Carmen Ríos** (persona `58`). Su licencia es `'LF-2026-0121'` y vence el **31 de marzo de 2027**. Agrégalo al padrón con estado `'vigente'`, `actualizado` igual a `'2026-04-06 09:30:00'` y `actualizado_por` igual a `'loop'`, y termina con un `SELECT` que lo muestre. Reemplaza cada `___`.
starter: |
  INSERT INTO padron_puestos (puesto, titular_id, licencia, vence, estado, actualizado, actualizado_por)
  VALUES (___, ___, 'LF-2026-0121', ___, 'vigente', '2026-04-06 09:30:00', 'loop');

  SELECT * FROM padron_puestos WHERE puesto = ___;
solution: |
  INSERT INTO padron_puestos (puesto, titular_id, licencia, vence, estado, actualizado, actualizado_por)
  VALUES (121, 58, 'LF-2026-0121', '2027-03-31', 'vigente', '2026-04-06 09:30:00', 'loop');

  SELECT * FROM padron_puestos WHERE puesto = 121;
hints:
  - "Las fechas van como texto `'AAAA-MM-DD'`; los números, sin comillas."
  - "No das el `id`: es `INTEGER PRIMARY KEY`, así que SQLite le pone el siguiente (121)."
tests:
  - name: el puesto 121 está en el padrón, a nombre de la persona 58
    db: SELECT COUNT(*) = 1 FROM padron_puestos WHERE puesto = 121 AND titular_id = 58 AND vence = '2027-03-31' AND licencia = 'LF-2026-0121'
  - name: solo agregaste una fila
    db: SELECT COUNT(*) FROM padron_puestos
    equals: 121
  - name: el SELECT final muestra el puesto nuevo
    rows: 1
```

```exercise
id: sql15-arregla-punto-coma
type: fix
title: El punto y coma de más
prompt: |
  La app nunca actualizó el estado de las licencias. Edith pide marcar como `'vencida'` las licencias **vigentes** que vencieron **antes del lunes 6 de abril**. Este código lo intenta, pero da error… y además deja el padrón peor que antes. Ejecútalo, mira cuántas filas cambió la primera sentencia y arréglalo.
visual:
  figure:
    title: Lo que el motor ve
    panes:
      - label: Sentencia 1
        text: "UPDATE padron_puestos\nSET estado = 'vencida';"
      - label: Sentencia 2 (error)
        text: "WHERE vence < '2026-04-06'\n  AND estado = 'vigente';"
starter: |
  UPDATE padron_puestos
  SET estado = 'vencida';
  WHERE vence < '2026-04-06'
    AND estado = 'vigente';
solution: |
  UPDATE padron_puestos
  SET estado = 'vencida'
  WHERE vence < '2026-04-06'
    AND estado = 'vigente';
hints:
  - "El `;` termina la sentencia. Todo lo que viene después es otra sentencia, y `WHERE …` sola no significa nada."
tests:
  - name: nueve licencias pasan a vencidas
    db: SELECT COUNT(*) FROM padron_puestos WHERE estado = 'vencida'
    equals: 9
  - name: ninguna licencia vigente quedó marcada como vencida
    db: SELECT COUNT(*) = 0 FROM padron_puestos WHERE estado = 'vencida' AND vence >= '2026-04-06'
  - name: las suspendidas siguen suspendidas
    db: SELECT COUNT(*) FROM padron_puestos WHERE estado = 'suspendida'
    equals: 24
```

```exercise
id: sql15-escribe-tarifas
type: write
title: Las tarifas del año
db: empty
setup: |
  CREATE TABLE tarifas (rubro TEXT PRIMARY KEY, monto REAL NOT NULL CHECK (monto > 0));
  INSERT INTO tarifas VALUES ('frutas', 80), ('pescado', 90), ('carnes', 90), ('reparaciones', 70);
prompt: |
  Edith manda las tarifas nuevas de la licencia: **pescado** pasa a **95** y aparece un rubro nuevo, **robótica**, a **150**. Escribe **un solo** `INSERT` con `ON CONFLICT` que haga las dos cosas (actualizar el que existe, insertar el nuevo) y termina con `SELECT rubro, monto FROM tarifas ORDER BY rubro;`.
starter: |
  INSERT INTO tarifas (rubro, monto)
  VALUES ('pescado', 95), ('robótica', 150);

  SELECT rubro, monto FROM tarifas ORDER BY rubro;
solution: |
  INSERT INTO tarifas (rubro, monto)
  VALUES ('pescado', 95), ('robótica', 150)
  ON CONFLICT (rubro) DO UPDATE SET monto = excluded.monto;

  SELECT rubro, monto FROM tarifas ORDER BY rubro;
hints:
  - "Tal como está, el `INSERT` choca con `pescado`, que ya existe, y SQLite no inserta ninguna de las dos filas."
  - "`ON CONFLICT (rubro) DO UPDATE SET monto = excluded.monto`: `excluded` es la fila que intentabas meter."
tests:
  - name: pescado cuesta 95 y robótica 150
    db: SELECT (SELECT monto FROM tarifas WHERE rubro = 'pescado') = 95 AND (SELECT monto FROM tarifas WHERE rubro = 'robótica') = 150
  - name: los demás rubros no cambian
    db: SELECT COUNT(*) FROM tarifas WHERE (rubro, monto) IN (VALUES ('frutas', 80), ('carnes', 90), ('reparaciones', 70))
    equals: 3
  - name: usa ON CONFLICT
    source: '\bON\s+CONFLICT\b'
```

```exercise
id: sql15-escribe-pendientes
type: write
title: Limpiar lo que nadie atendió
prompt: |
  En `tramites` hay trámites en estado `'pendiente'` desde enero. Edith decide **borrar los pendientes presentados antes del 1 de febrero de 2026** y quiere ver qué se borró: usa `RETURNING` para devolver el `id`, el `puesto`, el `tipo` y la fecha `presentado` de cada uno.

  Antes de borrar, escribe el `SELECT` con el mismo `WHERE` y mira qué sale.
starter: |
  SELECT id, puesto, tipo, presentado
  FROM tramites
  WHERE estado = 'pendiente';
solution: |
  DELETE FROM tramites
  WHERE estado = 'pendiente'
    AND presentado < '2026-02-01'
  RETURNING id, puesto, tipo, presentado;
hints:
  - "`'2026-02-01'` es menor que cualquier momento de febrero y mayor que todos los de enero."
  - "Cambia `SELECT id, puesto, tipo, presentado FROM` por `DELETE FROM` y pon `RETURNING id, puesto, tipo, presentado` al final."
tests:
  - name: devuelve los cinco trámites borrados
    same: DELETE FROM tramites WHERE estado = 'pendiente' AND presentado < '2026-02-01' RETURNING id, puesto, tipo, presentado
  - name: ya no hay pendientes de enero
    db: SELECT COUNT(*) FROM tramites WHERE estado = 'pendiente' AND presentado < '2026-02-01'
    equals: 0
  - name: los pendientes de febrero siguen ahí
    db: SELECT COUNT(*) FROM tramites WHERE estado = 'pendiente'
    equals: 9
```

## El caso

```exercise
id: sql15-caso-titular
type: case
title: ¿De quién es el puesto 47?
prompt: |
  **Busca el puesto 47 en el padrón y averigua a nombre de quién está hoy.** Escribe el nombre completo.

  `padron_puestos` guarda el `titular_id`; el nombre está en `personas`. Mira también `actualizado` y `actualizado_por`: dicen cuándo cambió la fila por última vez y quién la cambió.
visual:
  - escenario:
      case: taller
  - esquema:
      tables: [padron_puestos, personas]
starter: |
  SELECT *
  FROM padron_puestos
  LIMIT 5;
solution: |
  SELECT pp.puesto, p.nombre, pp.licencia, pp.vence, pp.actualizado, pp.actualizado_por
  FROM padron_puestos pp
  JOIN personas p ON p.id = pp.titular_id
  WHERE pp.puesto = 47;
answer: Yolanda Ugarte Montes
answerLabel: ¿A nombre de quién está el puesto 47?
reveal: |
  **Yolanda Ugarte Montes.** El cambio se hizo el **viernes 20 a las 18:52:40** con el usuario **abenavides**, el de la ventanilla 1, y la licencia ahora es `LF-2026-0047`. Carmen no conoce a Yolanda. Y hay algo más: la licencia de Carmen vencía el 31 de marzo… y para el padrón sigue venciendo ese día: ya está vencida.
hints:
  - "Une las dos tablas: `JOIN personas p ON p.id = pp.titular_id`."
  - "Filtra con `WHERE pp.puesto = 47`."
```

## El juez

```exercise
id: sql15-juez-precios
type: judge
title: El precio más nuevo gana
prompt: |
  **Mezcla los precios nuevos en la tabla de precios: para cada producto debe quedar el precio con la fecha más reciente, venga de donde venga.**

  Cada mañana la asociación de comerciantes manda una lista con precios de referencia. A veces la lista trae un precio **más viejo** que el que ya tienes (alguien reenvió el mensaje de ayer), y a veces trae el mismo producto **dos veces**. Un producto que no estaba se agrega.

  **Tablas:** `precios(producto, precio, fecha)` con `producto` como clave primaria, y `nuevos(producto, precio, fecha)`, que puede repetir productos. Las fechas son `'AAAA-MM-DD'` y nunca se repiten para un mismo producto.

  **Lo que se revisa:** el contenido de `precios` después de tu código.
schema: |
  CREATE TABLE precios (producto TEXT PRIMARY KEY, precio REAL, fecha TEXT);
  CREATE TABLE nuevos (producto TEXT, precio REAL, fecha TEXT);
check: SELECT producto, precio, fecha FROM precios
starter: |
  INSERT INTO precios
  SELECT producto, precio, fecha FROM nuevos;
solution: |
  INSERT INTO precios (producto, precio, fecha)
  SELECT producto, precio, fecha FROM nuevos WHERE true
  ON CONFLICT (producto) DO UPDATE
    SET precio = excluded.precio, fecha = excluded.fecha
    WHERE excluded.fecha > precios.fecha;
hints:
  - "`ON CONFLICT (producto) DO UPDATE SET … WHERE excluded.fecha > precios.fecha` solo actualiza si lo que llega es más nuevo."
  - "Con `INSERT … SELECT … ON CONFLICT`, SQLite necesita que el `SELECT` tenga un `WHERE` (aunque sea `WHERE true`), para no confundir el `ON` del conflicto con el de un join."
samples:
  - rows:
      precios: [["limón", 4.5, "2026-03-20"], ["papa", 2.2, "2026-03-20"]]
      nuevos: [["limón", 5.0, "2026-03-23"], ["papa", 1.9, "2026-03-18"], ["ají", 6.0, "2026-03-23"]]
    note: "El limón se actualiza; el precio de la papa que llega es del 18, más viejo: se queda el del 20. El ají es nuevo."
  - rows:
      precios: [["camote", 3.0, "2026-03-01"]]
      nuevos: [["camote", 3.4, "2026-03-22"], ["camote", 3.2, "2026-03-21"]]
    note: "Llegan dos precios de camote: gana el del 22, aunque venga primero."
edge:
  - rows: { precios: [], nuevos: [] }
    tag: con las dos tablas vacías
  - rows: { precios: [["choclo", 2.0, "2026-03-10"]], nuevos: [] }
    tag: sin precios nuevos
  - rows: { precios: [], nuevos: [["olluco", 3.0, "2026-03-02"], ["olluco", 3.5, "2026-03-05"], ["olluco", 2.5, "2026-03-01"]] }
    tag: con un producto nuevo que llega tres veces
random:
  count: 40
  seed: 1515
  generate: |
    const items = ["limón", "papa", "camote", "ají", "choclo", "olluco", "yuca", "palta", "tomate", "cebolla"];
    const precios = [], nuevos = [];
    for (const it of items) {
      const days = [];
      while (days.length < 4) { const d = rng.int(1, 28); if (!days.includes(d)) days.push(d); }
      const fecha = (d) => `2026-03-${String(d).padStart(2, "0")}`;
      const price = () => rng.int(10, 90) / 10;
      let k = 0;
      if (rng.chance(0.6)) precios.push([it, price(), fecha(days[k++])]);
      const n = rng.int(0, 3);
      for (let i = 0; i < n; i++) nuevos.push([it, price(), fecha(days[k++])]);
    }
    for (let i = nuevos.length - 1; i > 0; i--) { const j = rng.int(0, i); [nuevos[i], nuevos[j]] = [nuevos[j], nuevos[i]]; }
    return { precios, nuevos };
wrong:
  - |
    INSERT INTO precios (producto, precio, fecha)
    SELECT producto, precio, fecha FROM nuevos WHERE true
    ON CONFLICT (producto) DO UPDATE SET precio = excluded.precio, fecha = excluded.fecha;
  - |
    INSERT OR REPLACE INTO precios (producto, precio, fecha)
    SELECT producto, precio, fecha FROM nuevos;
  - |
    INSERT OR IGNORE INTO precios (producto, precio, fecha)
    SELECT producto, precio, fecha FROM nuevos;
```

## Misión final

```exercise
id: sql15-mision-devolver
type: mission
title: Devolver los puestos
prompt: |
  **Devuélvele cada puesto a su dueño cuando su último traspaso lo pidió la propia beneficiaria.** Un traspaso lo pide quien vende, nunca quien recibe: en `tramites`, un traspaso legítimo tiene `solicitante_id` distinto de `nuevo_titular_id`.

  Edith firmó la orden. Para cada puesto con un traspaso así:
  - `titular_id` vuelve a ser el dueño que figura en `puestos` (la lista de la asociación de comerciantes, `puestos.persona_id`, unida por `puestos.numero = padron_puestos.puesto`);
  - `actualizado` pasa a `'2026-04-06 10:00:00'` y `actualizado_por` a `'loop'`.

  Hazlo con **un solo `UPDATE`** y termina con `RETURNING puesto, titular_id`. Luego escribe cuántos puestos devolviste.
visual:
  - escenario:
      case: taller
  - esquema:
      tables: [padron_puestos, tramites, puestos]
starter: |
  -- Primero mira los traspasos sospechosos:
  SELECT puesto, solicitante_id, nuevo_titular_id, funcionario, presentado, pago
  FROM tramites
  WHERE tipo = 'traspaso';
solution: |
  UPDATE padron_puestos
  SET titular_id = (SELECT p.persona_id FROM puestos p WHERE p.numero = padron_puestos.puesto),
      actualizado = '2026-04-06 10:00:00',
      actualizado_por = 'loop'
  WHERE puesto IN (
    SELECT puesto FROM tramites
    WHERE tipo = 'traspaso'
      AND solicitante_id = nuevo_titular_id)
  RETURNING puesto, titular_id;
answer: "4"
answerLabel: ¿Cuántos puestos devolviste?
reveal: |
  **Cuatro: el 19, el 47, el 64 y el 102.** Los cuatro traspasos los pidió Yolanda Ugarte para sí misma, todos en la **ventanilla 1** con el usuario **abenavides**, el viernes 20 entre las 18:52 y las 18:58, y **sin pagar un sol** (un traspaso cuesta S/ 350). Tres personas pueden escribir en el padrón: Alfredo (ventanilla 1), Susana (ventanilla 2) y Delia (sistemas). Alfredo jura que a esa hora ya se había ido. Y la licencia de Carmen sigue diciendo que venció el 31 de marzo, aunque ella asegura que renovó.
hints:
  - "La lista de puestos a cambiar es una subconsulta: `WHERE puesto IN (SELECT puesto FROM tramites WHERE tipo = 'traspaso' AND solicitante_id = nuevo_titular_id)`."
  - "El dueño de cada puesto es una subconsulta correlacionada dentro del `SET`: `(SELECT p.persona_id FROM puestos p WHERE p.numero = padron_puestos.puesto)`."
tests:
  - name: el puesto 47 vuelve a Carmen (persona 58)
    db: SELECT titular_id FROM padron_puestos WHERE puesto = 47
    equals: 58
  - name: Yolanda ya no es titular de ningún puesto
    db: SELECT COUNT(*) FROM padron_puestos WHERE titular_id = (SELECT id FROM personas WHERE nombre = 'Yolanda Ugarte Montes')
    equals: 0
  - name: solo cambiaron los puestos de esos traspasos, marcados por Loop
    db: SELECT COUNT(*) FROM padron_puestos WHERE actualizado_por = 'loop' AND actualizado = '2026-04-06 10:00:00'
    equals: 4
  - name: los traspasos legítimos siguen como estaban
    db: SELECT titular_id FROM padron_puestos WHERE puesto = 23
    equals: 90
  - name: devuelve los puestos con RETURNING
    same: SELECT puesto, (SELECT persona_id FROM puestos WHERE numero = padron_puestos.puesto) FROM padron_puestos WHERE puesto IN (19, 47, 64, 102)
```

## Reto experto

```exercise
id: sql15-reto-estricta
type: challenge
title: Un padrón que no se deja
prompt: |
  **Crea `padron_nuevo`, una tabla `STRICT` con reglas que impidan los errores del padrón viejo, enciende las claves foráneas y cópiale todo el padrón actual con `INSERT … SELECT`.**

  Columnas y reglas:
  - `puesto INTEGER PRIMARY KEY`, entre 1 y 200 (`CHECK`);
  - `titular_id INTEGER NOT NULL`, que apunte a `personas(id)`;
  - `licencia TEXT NOT NULL UNIQUE`;
  - `vence TEXT NOT NULL`, con forma de fecha `AAAA-MM-DD` (compárala con `date(vence)`);
  - `estado TEXT NOT NULL`, solo `'vigente'`, `'vencida'` o `'suspendida'`.

  Para quien ya programa: las reglas se prueban intentando romperlas. Después de tu código, el juez intentará meter un titular que no existe, una licencia repetida y una fecha `'31/03/2027'`, y las tres deben fallar.
starter: |
  CREATE TABLE padron_nuevo (
    puesto INTEGER PRIMARY KEY,
    titular_id INTEGER,
    licencia TEXT,
    vence TEXT,
    estado TEXT
  );
solution: |
  PRAGMA foreign_keys = ON;

  CREATE TABLE padron_nuevo (
    puesto INTEGER PRIMARY KEY CHECK (puesto BETWEEN 1 AND 200),
    titular_id INTEGER NOT NULL REFERENCES personas(id),
    licencia TEXT NOT NULL UNIQUE,
    vence TEXT NOT NULL CHECK (vence IS date(vence)),
    estado TEXT NOT NULL CHECK (estado IN ('vigente', 'vencida', 'suspendida'))
  ) STRICT;

  INSERT INTO padron_nuevo (puesto, titular_id, licencia, vence, estado)
  SELECT puesto, titular_id, licencia, vence, estado
  FROM padron_puestos;
hints:
  - "`PRAGMA foreign_keys = ON;` va antes de los `INSERT`: sin eso, SQLite no revisa las claves foráneas."
  - "`STRICT` va después del paréntesis de cierre. Ojo: `date('31/03/2027')` es `NULL`, y un `CHECK` que da `NULL` **deja pasar** la fila (solo rechaza `FALSE`). Compara con `IS`, que nunca da `NULL`: `CHECK (vence IS date(vence))`."
tests:
  - name: la tabla es STRICT
    db: SELECT strict FROM pragma_table_list WHERE name = 'padron_nuevo'
    equals: 1
  - name: copiaste los 120 puestos
    db: SELECT COUNT(*) FROM padron_nuevo
    equals: 120
  - name: rechaza un titular que no existe
    fails: INSERT INTO padron_nuevo VALUES (150, 99999, 'LF-2026-0150', '2027-01-01', 'vigente')
    error: FOREIGN KEY
  - name: rechaza una licencia repetida
    fails: INSERT INTO padron_nuevo VALUES (151, 58, 'LF-2020-0012', '2027-01-01', 'vigente')
    error: UNIQUE|FOREIGN
  - name: rechaza una fecha mal escrita
    fails: INSERT INTO padron_nuevo VALUES (152, 58, 'LF-2026-0152', '31/03/2027', 'vigente')
    error: CHECK
  - name: rechaza un estado inventado
    fails: INSERT INTO padron_nuevo VALUES (153, 58, 'LF-2026-0153', '2027-01-01', 'activo')
    error: CHECK
```
