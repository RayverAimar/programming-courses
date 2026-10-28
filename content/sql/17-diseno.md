# Sesión 17 — Diseñar tablas: normalización, vistas y triggers

```session
case: taller
```

## El encargo

Miércoles 8 de abril. Edith tomó una decisión: la app vieja se jubila y Loop **diseña el padrón nuevo** desde cero. Para eso, Delia, la de sistemas, te pasa lo único que la oficina tenía antes de la app: **la planilla de Excel** donde cada registrador anotaba los puestos a mano, que alguien siguió llenando "por si acaso". La importaron tal cual a la tabla `planilla_puestos`.

Una hoja de cálculo deja escribir cualquier cosa en cualquier celda, y eso se nota: nombres escritos de tres maneras, dos rubros en una celda, el mismo puesto dos veces. Hoy aprenderás a **diseñar tablas** que no dejan que eso pase, a guardar consultas con nombre (**vistas**) y a que la base anote sola cada cambio (**triggers**). Y en esa planilla hay algo que nadie esperaba.

```escenario
case: taller
title: La oficina, con el archivador abierto
caption: "La planilla vivía en la computadora de sistemas y en una carpeta del archivador. Cada pista encontrada queda marcada en el plano."
```

```expediente
title: La planilla
cards:
  - name: Delia Lozano Yupanqui
    traits: { style: bun, shirt: "#3fa7a7", glasses: true }
    role: Sistemas, Municipalidad de Surquillo
    rows: [["Usuario", "dlozano"], ["Computadora", "SIS-01"]]
    quote: "La planilla la llenaban los registradores. Yo solo la importé."
  - name: Chasqui
    kind: chasqui
    role: Asistente de detective de Loop
    quote: "Una celda con dos datos es una pregunta que nadie puede hacer bien."
```

## Lo mínimo

**Diseñar** es decidir qué tablas existen, qué columnas tiene cada una, cuál es su **clave** y cómo se relacionan. La planilla tiene todo en una sola hoja. Mira cuatro filas:

```resultado
title: Cuatro filas de la planilla
query: |
  SELECT fila, puesto, pasillo, rubros, titular, dni, telefono, licencia
  FROM planilla_puestos
  WHERE puesto IN (1, 2, 5, 89)
  ORDER BY fila;
caption: "Dos rubros en una celda, un nombre en mayúsculas y el puesto 89 copiado dos veces. Si un titular tiene tres puestos, su teléfono está escrito tres veces: cámbialo en una fila y las otras dos mienten."
```

**Normalizar** es partir la hoja en tablas para que **cada dato viva en un solo lugar**. Las tres formas normales clásicas se leen como tres preguntas:

| forma normal | la pregunta | en la planilla | el arreglo |
|---|---|---|---|
| **1FN** | ¿cada celda tiene un solo valor? | `rubros = 'carnes, abarrotes'` | una tabla `puesto_rubros`: una fila por puesto y rubro |
| **2FN** | ¿cada columna depende de **toda** la clave? | en `puesto_rubros(puesto, rubro, pasillo)`, el pasillo depende solo del puesto | el pasillo va en `puestos` |
| **3FN** | ¿alguna columna depende de otra que no es la clave? | `telefono` depende del `dni`, no del puesto | una tabla `titulares` con el DNI, el nombre y el teléfono |

Cuando una tabla no está normalizada aparecen las **anomalías**: al **actualizar** (cambias el teléfono en una fila y no en las otras), al **insertar** (no puedes registrar a un titular sin inventarle un puesto) y al **borrar** (borras su único puesto y pierdes su teléfono). El diseño normalizado del padrón nuevo:

```esquema
title: El padrón nuevo, normalizado
schema: |
  CREATE TABLE titulares (id INTEGER PRIMARY KEY, dni TEXT NOT NULL UNIQUE, nombre TEXT NOT NULL, telefono TEXT, distrito TEXT);
  CREATE TABLE puestos_n (numero INTEGER PRIMARY KEY, pasillo TEXT NOT NULL);
  CREATE TABLE rubros (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL UNIQUE);
  CREATE TABLE puesto_rubros (puesto INTEGER REFERENCES puestos_n(numero), rubro_id INTEGER REFERENCES rubros(id), PRIMARY KEY (puesto, rubro_id));
  CREATE TABLE licencias_n (codigo TEXT PRIMARY KEY, puesto INTEGER NOT NULL REFERENCES puestos_n(numero), titular_id INTEGER NOT NULL REFERENCES titulares(id), vence TEXT NOT NULL);
caption: "Cada caja guarda una sola cosa. `puesto_rubros` resuelve la relación **muchos a muchos**: un puesto vende varios rubros y un rubro está en muchos puestos. Su clave son las dos columnas juntas."
```

**Claves naturales y sustitutas.** Una clave **natural** ya existe en el mundo: el DNI, el código de licencia, el número de puesto. Una **sustituta** la inventa la base: `id INTEGER PRIMARY KEY`, que en SQLite es el `rowid` y se numera solo. Las naturales pueden cambiar (una licencia se renueva con código nuevo) o venir sucias; las sustitutas nunca cambian, pero no dicen nada. La costumbre sana: clave sustituta para unir tablas, y la natural **también**, con `UNIQUE`, para que la base no acepte dos titulares con el mismo DNI.

**Vistas.** `CREATE VIEW nombre AS SELECT …` guarda una consulta con nombre. No guarda datos: cada vez que la usas, SQLite vuelve a correr el `SELECT` con los datos de ese momento. Sirve para no repetir joins largos y para darle a cada usuario solo lo que debe ver.

```sql run
CREATE VIEW titulares_actuales AS
SELECT pp.puesto, p.nombre AS titular, pp.vence
FROM padron_puestos pp
JOIN personas p ON p.id = pp.titular_id;

SELECT * FROM titulares_actuales WHERE vence >= '2026-04-08' AND vence < '2026-05-31';
```

**Triggers.** Un **trigger** es SQL que la base corre sola cuando pasa algo en una tabla: `BEFORE` o `AFTER` un `INSERT`, `UPDATE` o `DELETE`, una vez por cada fila (`FOR EACH ROW`). Adentro, `OLD` es la fila como era y `NEW` como queda. El uso clásico es la **auditoría**: que nadie pueda cambiar el padrón sin dejar rastro, aunque la app se olvide de anotarlo. Dale a ▶:

```cambio
title: Un UPDATE que deja rastro
setup: |
  CREATE TABLE padron (puesto INTEGER PRIMARY KEY, titular TEXT, vence TEXT);
  CREATE TABLE auditoria (momento TEXT, puesto INTEGER, antes TEXT, despues TEXT);
  INSERT INTO padron VALUES (12, 'Lucía', '2026-10-24'), (47, 'Carmen', '2026-03-31'), (58, 'Nelly', '2027-02-05');
  CREATE TRIGGER audita_titular AFTER UPDATE OF titular ON padron
  FOR EACH ROW WHEN OLD.titular IS NOT NEW.titular
  BEGIN
    INSERT INTO auditoria VALUES ('2026-04-08 09:00', OLD.puesto, OLD.titular, NEW.titular);
  END;
sql: |
  UPDATE padron SET vence = '2027-03-31' WHERE puesto = 47;
  UPDATE padron SET titular = 'Yolanda' WHERE puesto IN (47, 58);
  UPDATE padron SET titular = 'Carmen' WHERE puesto = 47;
notes:
  - "Cambia `vence`, no `titular`: el trigger es `AFTER UPDATE OF titular`, así que ni se despierta."
  - "Dos filas cambian de titular: el trigger corre **dos veces**, una por fila, con su `OLD` y su `NEW`."
  - "Devolver el puesto también es un cambio, y también queda anotado."
caption: "La auditoría la escribe la base, no la app: aunque alguien se conecte por otro programa, el rastro queda."
```

**Cuándo desnormalizar.** A veces conviene repetir un dato a propósito: una tabla de reportes que se recalcula cada noche, o el total de un pedido guardado junto al pedido para no sumarlo cada vez. Es una decisión, no un descuido: alguien (un trigger, un proceso nocturno) tiene que mantener la copia al día.

> **Trampa común:** creer que una vista es una copia. `CREATE VIEW` no fotografía los datos: si mañana cambia el padrón, la vista muestra el cambio. Para una foto de verdad, `CREATE TABLE foto AS SELECT …`. Y otra: en un trigger, `NEW` en un `DELETE` y `OLD` en un `INSERT` no existen; en un `UPDATE` existen los dos.

<!-- legacy: autoincrement -->

<!-- mdn: autoincrement -->

## Práctica

```exercise
id: sql17-predice-vista
type: predict
title: La vista no es una foto
db: empty
setup: |
  CREATE TABLE licencias (puesto INTEGER PRIMARY KEY, titular TEXT, vence TEXT);
  INSERT INTO licencias VALUES (12, 'Lucía', '2026-10-24'), (47, 'Carmen', '2026-03-31'), (58, 'Nelly', '2026-02-05');
  CREATE VIEW por_vencer AS SELECT puesto FROM licencias WHERE vence < '2026-04-01';
prompt: |
  `por_vencer` es una vista con los puestos que vencen antes de abril. ¿Qué devuelve el último `SELECT`?
code: |
  UPDATE licencias SET vence = '2027-03-31' WHERE puesto = 47;
  SELECT puesto FROM por_vencer;
options:
  - "58"
  - "47\n58"
  - "47"
  - "12\n58"
answer: "58"
explain: |
  La vista vuelve a correr su `SELECT` cada vez que la consultas, así que ve el cambio: el 47 ya vence en 2027 y sale de la lista. Solo queda el 58.
```

```exercise
id: sql17-predice-trigger
type: predict
title: ¿Cuántas veces corre?
db: empty
setup: |
  CREATE TABLE padron (puesto INTEGER PRIMARY KEY, titular TEXT, vence TEXT);
  CREATE TABLE auditoria (puesto INTEGER, antes TEXT, despues TEXT);
  INSERT INTO padron VALUES (12, 'Lucía', '2026-10-24'), (47, 'Carmen', '2026-03-31'), (58, 'Nelly', '2027-02-05');
  CREATE TRIGGER audita AFTER UPDATE ON padron
  FOR EACH ROW
  BEGIN
    INSERT INTO auditoria VALUES (OLD.puesto, OLD.vence, NEW.vence);
  END;
prompt: |
  El trigger anota cada `UPDATE` de `padron`. ¿Qué devuelve el `SELECT`?
code: |
  UPDATE padron SET vence = '2027-12-31' WHERE vence < '2027-01-01';
  UPDATE padron SET vence = vence WHERE puesto = 58;
  SELECT COUNT(*) FROM auditoria;
options:
  - "3"
  - "2"
  - "1"
  - "0"
answer: "3"
explain: |
  El primer `UPDATE` cambia dos filas (12 y 47): el trigger corre dos veces. El segundo "cambia" el 58 por el mismo valor, pero igual es un `UPDATE` de una fila, y este trigger no tiene `WHEN`: corre una vez más. Total, 3.
```

```exercise
id: sql17-completa-rubros
type: complete
title: Un rubro por fila
setup: |
  CREATE TABLE puesto_rubros (puesto INTEGER, rubro TEXT, PRIMARY KEY (puesto, rubro));
prompt: |
  Lleva la planilla a primera forma normal: llena `puesto_rubros` con **una fila por puesto y rubro**. La celda `'carnes, abarrotes'` se vuelve dos filas.

  El truco: convertir el texto en un arreglo JSON (`'["carnes"," abarrotes"]'`) y abrirlo con `json_each`, que da una fila por elemento en su columna `value`. Reemplaza los `___`.
visual:
  figure:
    title: De una celda a dos filas
    input: { label: planilla_puestos, table: { head: [puesto, rubros], rows: [["1", "carnes, abarrotes"]] } }
    arrow: "json_each + trim"
    output: { label: puesto_rubros, table: { head: [puesto, rubro], rows: [["1", "carnes"], ["1", "abarrotes"]] } }
starter: |
  INSERT INTO puesto_rubros (puesto, rubro)
  SELECT DISTINCT pl.puesto, ___(j.value)
  FROM planilla_puestos pl
  JOIN json_each('["' || replace(pl.rubros, ___, '","') || '"]') AS j;

  SELECT * FROM puesto_rubros WHERE puesto <= 3 ORDER BY puesto, rubro;
solution: |
  INSERT INTO puesto_rubros (puesto, rubro)
  SELECT DISTINCT pl.puesto, trim(j.value)
  FROM planilla_puestos pl
  JOIN json_each('["' || replace(pl.rubros, ',', '","') || '"]') AS j;

  SELECT * FROM puesto_rubros WHERE puesto <= 3 ORDER BY puesto, rubro;
hints:
  - "Cada coma se reemplaza por `\",\"`: cierra un texto y abre el siguiente."
  - "Después de la coma viene un espacio: `trim` lo quita."
  - "`DISTINCT` evita repetir un rubro del puesto 89, que está dos veces en la planilla."
tests:
  - name: 143 pares de puesto y rubro
    db: SELECT COUNT(*) FROM puesto_rubros
    equals: 143
  - name: ningún rubro tiene comas ni espacios sobrantes
    db: SELECT COUNT(*) = 0 FROM puesto_rubros WHERE rubro LIKE '%,%' OR rubro <> trim(rubro)
```

```exercise
id: sql17-arregla-trigger
type: fix
title: El antes y el después al revés
db: empty
setup: |
  CREATE TABLE padron (puesto INTEGER PRIMARY KEY, titular TEXT, vence TEXT);
  CREATE TABLE auditoria (puesto INTEGER, antes TEXT, despues TEXT);
  INSERT INTO padron VALUES (12, 'Lucía', '2026-10-24'), (47, 'Carmen', '2026-03-31');
prompt: |
  Este trigger debería anotar, en cada cambio de titular, quién era el titular **antes** y quién es **después**. Pero en la auditoría sale al revés. Arréglalo.

  El juez cambia el titular del puesto 47 de Carmen a Yolanda y revisa la auditoría.
starter: |
  CREATE TRIGGER audita_titular AFTER UPDATE OF titular ON padron
  FOR EACH ROW
  BEGIN
    INSERT INTO auditoria (puesto, antes, despues)
    VALUES (NEW.puesto, NEW.titular, OLD.titular);
  END;
solution: |
  CREATE TRIGGER audita_titular AFTER UPDATE OF titular ON padron
  FOR EACH ROW
  BEGIN
    INSERT INTO auditoria (puesto, antes, despues)
    VALUES (NEW.puesto, OLD.titular, NEW.titular);
  END;
hints:
  - "`OLD` es la fila como era antes del `UPDATE`; `NEW`, como queda."
tests:
  - name: anota Carmen antes y Yolanda después
    db: UPDATE padron SET titular = 'Yolanda' WHERE puesto = 47; SELECT antes = 'Carmen' AND despues = 'Yolanda' FROM auditoria WHERE puesto = 47;
```

```exercise
id: sql17-escribe-vista
type: write
title: La vista de la gerencia
prompt: |
  Edith quiere abrir cada mañana una lista de las licencias **que vencen en los próximos 60 días** (desde el lunes 6 de abril, incluido, hasta antes del 5 de junio). Crea la vista `por_renovar` con el `puesto`, el `nombre` del titular y la fecha `vence`, y termina con `SELECT * FROM por_renovar ORDER BY vence, puesto;`.
starter: |
  SELECT puesto, titular_id, vence
  FROM padron_puestos;
solution: |
  CREATE VIEW por_renovar AS
  SELECT pp.puesto, p.nombre, pp.vence
  FROM padron_puestos pp
  JOIN personas p ON p.id = pp.titular_id
  WHERE pp.vence >= '2026-04-06'
    AND pp.vence < '2026-06-05';

  SELECT * FROM por_renovar ORDER BY vence, puesto;
hints:
  - "`CREATE VIEW por_renovar AS SELECT …` y luego consúltala como si fuera una tabla."
tests:
  - name: la vista existe
    db: SELECT COUNT(*) FROM sqlite_schema WHERE type = 'view' AND name = 'por_renovar'
    equals: 1
  - name: las licencias por renovar, en orden
    same: SELECT pp.puesto, p.nombre, pp.vence FROM padron_puestos pp JOIN personas p ON p.id = pp.titular_id WHERE pp.vence >= '2026-04-06' AND pp.vence < '2026-06-05' ORDER BY pp.vence, pp.puesto
    ordered: true
```

```exercise
id: sql17-escribe-auditoria
type: write
title: Nadie cambia un titular sin dejar rastro
setup: |
  CREATE TABLE auditoria (momento TEXT, puesto INTEGER, antes INTEGER, despues INTEGER);
prompt: |
  Escribe el trigger `audita_titular` para el padrón real: **después** de cada `UPDATE` que cambie `titular_id` en `padron_puestos`, inserta en `auditoria` el `momento` (usa el `actualizado` de la fila nueva), el `puesto`, el titular de antes y el de después. Si el `UPDATE` toca otras columnas pero no el titular, no debe anotar nada.

  El juez probará tu trigger renovando un puesto y traspasando otro.
starter: |
  CREATE TRIGGER audita_titular AFTER UPDATE ON padron_puestos
  BEGIN
  END;
solution: |
  CREATE TRIGGER audita_titular AFTER UPDATE OF titular_id ON padron_puestos
  FOR EACH ROW WHEN OLD.titular_id IS NOT NEW.titular_id
  BEGIN
    INSERT INTO auditoria (momento, puesto, antes, despues)
    VALUES (NEW.actualizado, NEW.puesto, OLD.titular_id, NEW.titular_id);
  END;
hints:
  - "`AFTER UPDATE OF titular_id` despierta al trigger solo cuando el `UPDATE` nombra esa columna; `WHEN OLD.titular_id IS NOT NEW.titular_id` descarta los que la dejan igual."
  - "Adentro va un `INSERT INTO auditoria … VALUES (NEW.actualizado, NEW.puesto, OLD.titular_id, NEW.titular_id);`."
tests:
  - name: una renovación no deja rastro
    db: UPDATE padron_puestos SET vence = '2027-10-24', actualizado = '2026-04-08 09:00:00' WHERE puesto = 12; SELECT COUNT(*) FROM auditoria;
    equals: 0
  - name: un traspaso deja su fila con antes y después
    db: UPDATE padron_puestos SET titular_id = 58, actualizado = '2026-04-08 09:10:00' WHERE puesto = 3; SELECT momento = '2026-04-08 09:10:00' AND puesto = 3 AND antes = 51 AND despues = 58 FROM auditoria;
  - name: dos traspasos en un UPDATE dejan dos filas
    db: UPDATE padron_puestos SET titular_id = 412 WHERE puesto IN (5, 6); SELECT COUNT(*) FROM auditoria;
    equals: 3
```

## El caso

```exercise
id: sql17-caso-planilla
type: case
title: Un teléfono que no cuadra
prompt: |
  **Para pasar los titulares de la planilla a la tabla `titulares`, cada DNI debe tener un solo teléfono. Encuentra las filas de la planilla cuyo teléfono no coincide con el de esa persona en `personas` (unidas por DNI). Entre ellas hay cuatro puestos de Yolanda: ¿de quién es el teléfono que figura en esos cuatro?** Escribe el nombre completo.

  La mayoría de las diferencias son números viejos que nadie actualizó. Uno no.
visual:
  - escenario:
      case: taller
  - esquema:
      tables: [planilla_puestos, personas]
starter: |
  SELECT fila, puesto, titular, dni, telefono, editado
  FROM planilla_puestos
  ORDER BY fila
  LIMIT 10;
solution: |
  SELECT pl.puesto, pl.titular, pl.telefono AS en_planilla, p.telefono AS en_personas, pl.editado
  FROM planilla_puestos pl
  JOIN personas p ON p.dni = pl.dni
  WHERE pl.telefono <> p.telefono;

  SELECT nombre, telefono
  FROM personas
  WHERE telefono = (SELECT telefono FROM planilla_puestos WHERE puesto = 47);
answer: Delia Lozano Yupanqui
answerLabel: ¿De quién es el teléfono de los puestos de Yolanda?
reveal: |
  **Delia Lozano Yupanqui**, la de sistemas. Las cuatro filas de Yolanda se editaron el **20 de marzo** y todas tienen el celular de Delia como contacto. Los otros números distintos no son de nadie: son teléfonos viejos, la típica **anomalía de actualización** de una hoja sin normalizar. ¿Delia preparó los traspasos… o alguien quiere que parezca? Alfredo dijo que ella "sabe todas las claves".
hints:
  - "Une por DNI: `JOIN personas p ON p.dni = pl.dni`, y quédate con `WHERE pl.telefono <> p.telefono`."
  - "Busca de quién es ese número: `SELECT nombre FROM personas WHERE telefono = '…'`."
```

## El juez

```exercise
id: sql17-juez-normalizar
type: judge
title: De la hoja a dos tablas
prompt: |
  **Llena `titulares` y `asignaciones` a partir de la hoja: un titular por DNI y un titular por puesto, tomando siempre la fila editada más recientemente (si dos filas tienen la misma fecha, la de `fila` mayor).**

  La hoja tiene una fila por puesto, pero a veces el mismo puesto aparece dos veces (alguien lo copió de nuevo al editarlo), y el mismo titular aparece en varios puestos, a veces con el teléfono o el nombre cambiados. Lo más reciente manda.

  **Tablas:** `hoja(fila, puesto, dni, nombre, telefono, editado)`; `titulares(dni, nombre, telefono)` y `asignaciones(puesto, dni)` empiezan vacías.

  **Lo que se revisa:** el contenido de las dos tablas después de tu código (`titulares` con una `t` adelante, `asignaciones` con una `a`).
schema: |
  CREATE TABLE hoja (fila INTEGER, puesto INTEGER, dni TEXT, nombre TEXT, telefono TEXT, editado TEXT);
  CREATE TABLE titulares (dni TEXT PRIMARY KEY, nombre TEXT, telefono TEXT);
  CREATE TABLE asignaciones (puesto INTEGER PRIMARY KEY, dni TEXT);
check: SELECT 't', dni, nombre, telefono FROM titulares UNION ALL SELECT 'a', puesto, dni, NULL FROM asignaciones
starter: |
  INSERT INTO titulares (dni, nombre, telefono)
  SELECT dni, nombre, telefono FROM hoja;
solution: |
  INSERT INTO titulares (dni, nombre, telefono)
  SELECT dni, nombre, telefono
  FROM (SELECT dni, nombre, telefono,
               ROW_NUMBER() OVER (PARTITION BY dni ORDER BY editado DESC, fila DESC) AS n
        FROM hoja)
  WHERE n = 1;

  INSERT INTO asignaciones (puesto, dni)
  SELECT puesto, dni
  FROM (SELECT puesto, dni,
               ROW_NUMBER() OVER (PARTITION BY puesto ORDER BY editado DESC, fila DESC) AS n
        FROM hoja)
  WHERE n = 1;
hints:
  - "`ROW_NUMBER() OVER (PARTITION BY dni ORDER BY editado DESC, fila DESC)` numera las filas de cada DNI de la más nueva a la más vieja: quédate con la 1."
  - "Haz lo mismo por puesto para `asignaciones`. Son dos `INSERT … SELECT`."
samples:
  - rows:
      hoja: [[1, 12, "40112233", "Lucía Paredes", "987111222", "2025-06-01"], [2, 30, "40112233", "Lucía Paredes Soto", "987333444", "2025-11-20"], [3, 47, "10203040", "Carmen Ríos", "955000111", "2025-03-02"]]
    note: "Lucía tiene dos puestos y dos teléfonos: vale la fila 2, la más reciente."
  - rows:
      hoja: [[1, 8, "22334455", "Nelly", "911000000", "2026-01-10"], [2, 8, "66778899", "Kike", "922000000", "2026-02-15"], [3, 9, "66778899", "KIKE", "933000000", "2026-02-15"]]
    note: "El puesto 8 pasó a Kike en febrero. Kike tiene dos filas del mismo día: gana la fila 3."
edge:
  - rows: { hoja: [] }
    tag: con la hoja vacía
  - rows: { hoja: [[5, 1, "11111111", "A", "900", "2026-01-01"], [4, 1, "11111111", "B", "901", "2026-01-01"]] }
    tag: con un puesto copiado el mismo día
random:
  count: 40
  seed: 1717
  generate: |
    const dnis = ["40112233", "10203040", "22334455", "66778899", "31415926", "27182818"];
    const names = ["Lucía", "Carmen", "Nelly", "Kike", "Beto", "Rosa"];
    const n = rng.int(0, 14);
    const hoja = [];
    for (let i = 1; i <= n; i++) {
      const k = rng.int(0, dnis.length - 1);
      const name = rng.chance(0.3) ? names[k].toUpperCase() : names[k];
      hoja.push([i, rng.int(1, 8), dnis[k], name, `9${rng.int(10, 99)}000${rng.int(100, 999)}`, `2026-0${rng.int(1, 3)}-${String(rng.int(1, 4)).padStart(2, "0")}`]);
    }
    for (let i = hoja.length - 1; i > 0; i--) { const j = rng.int(0, i); [hoja[i], hoja[j]] = [hoja[j], hoja[i]]; }
    return { hoja };
wrong:
  - |
    INSERT OR IGNORE INTO titulares (dni, nombre, telefono) SELECT dni, nombre, telefono FROM hoja ORDER BY fila;
    INSERT OR IGNORE INTO asignaciones (puesto, dni) SELECT puesto, dni FROM hoja ORDER BY fila;
  - |
    INSERT INTO titulares (dni, nombre, telefono)
    SELECT dni, nombre, telefono FROM (SELECT dni, nombre, telefono, ROW_NUMBER() OVER (PARTITION BY dni ORDER BY editado DESC) AS n FROM hoja) WHERE n = 1;
    INSERT INTO asignaciones (puesto, dni)
    SELECT puesto, dni FROM (SELECT puesto, dni, ROW_NUMBER() OVER (PARTITION BY puesto ORDER BY editado DESC) AS n FROM hoja) WHERE n = 1;
  - |
    INSERT INTO titulares (dni, nombre, telefono)
    SELECT dni, nombre, telefono FROM (SELECT dni, nombre, telefono, ROW_NUMBER() OVER (PARTITION BY dni ORDER BY editado DESC, fila DESC) AS n FROM hoja) WHERE n = 1;
    INSERT INTO asignaciones (puesto, dni)
    SELECT puesto, dni FROM (SELECT puesto, dni, ROW_NUMBER() OVER (PARTITION BY puesto ORDER BY editado, fila) AS n FROM hoja) WHERE n = 1;
```

## Misión final

```exercise
id: sql17-mision-terminal
type: mission
title: ¿Desde qué computadora?
prompt: |
  **Crea la vista `escrituras_padron` con cada `UPDATE` que la bitácora registró sobre el padrón: `momento`, `puesto`, `usuario`, la `terminal` desde donde se envió y la `asignada` a ese usuario en `usuarios`. Luego consúltala para los puestos 19, 47, 64 y 102 del viernes 20, en orden.**

  Si Delia usó la cuenta de Alfredo, lo hizo desde algún lado. La terminal de cada sesión queda en la bitácora; la de cada usuario, en `usuarios`.
visual:
  - escenario:
      case: taller
  - esquema:
      tables: [bitacora, usuarios]
  - figure:
      title: "El viernes 20 de marzo, minuto a minuto"
      lanes:
        from: "18:10"
        to: "19:10"
        tick: 10
        bands: [{"from": "18:45", "to": "18:52:40", "label": "datos viejos", "by": "sql16-mision-bitacora"}]
        rows:
          - label: "Delia"
            sub: "SIS-01"
            bars: [{"from": "18:20", "to": "19:10", "label": "no volvió", "kind": "ok", "by": "sql18-mision-final"}]
            events:
              - at: "18:20"
                label: "dice: salí"
                kind: "said"
                side: "left"
                by: "sql15-mision-devolver"
          - label: "Alfredo"
            sub: "lo que dice"
            bars:
              - from: "18:30"
                to: "19:10"
                label: "dice: ya me había ido"
                kind: "said"
                by: "sql15-mision-devolver"
          - label: "Alfredo"
            sub: "los datos"
            bars: [{"from": "18:28", "to": "18:41", "label": "afuera", "kind": "soft", "by": "sql18-mision-final"}]
            events:
              - {"at": "18:41", "label": "vuelve", "kind": "bad", "side": "right", "by": "sql18-mision-final"}
              - {"at": "18:53", "label": "llama", "kind": "bad", "side": "right", "by": "sql18-mision-final"}
          - label: "Susana"
            sub: "VENT-2"
            events:
              - {"at": "18:44", "label": "lee", "side": "left", "by": "sql16-mision-bitacora"}
              - {"at": "18:47", "label": "renueva", "kind": "ok", "side": "right", "by": "sql16-caso-renovacion"}
          - label: "Sesión 328"
            sub: "VENT-1"
            events:
              - {"at": "18:45", "label": "lee", "side": "left", "by": "sql16-mision-bitacora"}
              - {"at": "18:52:40", "label": "pisa", "kind": "bad", "side": "left", "by": "sql16-mision-bitacora"}
              - {"at": "18:58", "label": "4 traspasos", "side": "right", "by": "sql15-mision-devolver"}
starter: |
  SELECT momento, puesto, usuario, terminal, sentencia
  FROM bitacora
  WHERE puesto = 47;
solution: |
  CREATE VIEW escrituras_padron AS
  SELECT b.momento, b.puesto, b.usuario, b.terminal, u.terminal AS asignada
  FROM bitacora b
  LEFT JOIN usuarios u ON u.login = b.usuario
  WHERE b.sentencia LIKE 'UPDATE padron_puestos%';

  SELECT *
  FROM escrituras_padron
  WHERE puesto IN (19, 47, 64, 102)
    AND momento LIKE '2026-03-20%'
  ORDER BY momento;
answer: VENT-1
answerLabel: ¿Desde qué computadora salieron los cuatro traspasos?
reveal: |
  **VENT-1**, la computadora de la **ventanilla 1**, la de Alfredo. Ese viernes, SIS-01 (la de Delia) no tocó el padrón: sus únicos usos de marzo son reportes. Para usar la cuenta de Alfredo, Delia habría tenido que sentarse en su silla, en la ventanilla, a las 18:52. El teléfono de la planilla empieza a parecer una trampa. Falta lo último: **¿quién estaba físicamente en la oficina?** Eso cruza todos los expedientes, en la sesión 18.
hints:
  - "La vista: `CREATE VIEW escrituras_padron AS SELECT b.momento, b.puesto, b.usuario, b.terminal, u.terminal AS asignada FROM bitacora b LEFT JOIN usuarios u ON u.login = b.usuario WHERE b.sentencia LIKE 'UPDATE padron_puestos%';`"
  - "`LEFT JOIN` por si alguna sesión usó un usuario que no está en `usuarios`."
tests:
  - name: la vista escrituras_padron existe
    db: SELECT COUNT(*) FROM sqlite_schema WHERE type = 'view' AND name = 'escrituras_padron'
    equals: 1
  - name: la vista tiene una fila por cada UPDATE del padrón
    db: SELECT (SELECT COUNT(*) FROM escrituras_padron) = (SELECT COUNT(*) FROM bitacora WHERE sentencia LIKE 'UPDATE%')
  - name: las escrituras del viernes en esos puestos, en orden
    same: SELECT b.momento, b.puesto, b.usuario, b.terminal, u.terminal FROM bitacora b LEFT JOIN usuarios u ON u.login = b.usuario WHERE b.sentencia LIKE 'UPDATE%' AND b.puesto IN (19, 47, 64, 102) AND b.momento LIKE '2026-03-20%' ORDER BY b.momento
    ordered: true
```

## Reto experto

```exercise
id: sql17-reto-rechazo
type: challenge
title: Que la base diga que no
prompt: |
  **Escribe un trigger `BEFORE INSERT` sobre `tramites` que rechace, con `RAISE(ABORT, 'mensaje')`, los traspasos imposibles: los que pide la propia beneficiaria (`solicitante_id = nuevo_titular_id`) y los que no traen pago.** Los demás trámites deben entrar normalmente.

  Para quien ya programa: es validación en la base, no en la app. Así ninguna ventanilla, script ni usuario genérico puede saltársela. El juez intentará insertar un traspaso de Yolanda a Yolanda, uno con pago 0 y uno legítimo.
starter: |
  CREATE TRIGGER valida_traspaso BEFORE INSERT ON tramites
  BEGIN
    SELECT 1;
  END;
solution: |
  CREATE TRIGGER valida_traspaso BEFORE INSERT ON tramites
  FOR EACH ROW
  WHEN NEW.tipo = 'traspaso'
   AND (NEW.solicitante_id = NEW.nuevo_titular_id OR COALESCE(NEW.pago, 0) <= 0)
  BEGIN
    SELECT RAISE(ABORT, 'traspaso no válido: lo pide quien vende y se paga');
  END;
hints:
  - "La condición va en `WHEN NEW.tipo = 'traspaso' AND (…)`; adentro, `SELECT RAISE(ABORT, '…');` cancela el `INSERT`."
  - "Un pago `NULL` tampoco es un pago: `COALESCE(NEW.pago, 0) <= 0`."
tests:
  - name: rechaza un traspaso pedido por la beneficiaria
    fails: INSERT INTO tramites (puesto, tipo, solicitante_id, nuevo_titular_id, ventanilla, funcionario, presentado, estado, pago) VALUES (30, 'traspaso', 1144, 1144, 1, 'abenavides', '2026-04-08 10:00:00', 'aprobado', 350)
    error: traspaso
  - name: rechaza un traspaso sin pago
    fails: INSERT INTO tramites (puesto, tipo, solicitante_id, nuevo_titular_id, ventanilla, funcionario, presentado, estado, pago) VALUES (30, 'traspaso', 58, 1144, 1, 'abenavides', '2026-04-08 10:00:00', 'aprobado', NULL)
    error: traspaso
  - name: deja pasar un traspaso legítimo y una renovación
    db: INSERT INTO tramites (puesto, tipo, solicitante_id, nuevo_titular_id, ventanilla, funcionario, presentado, estado, pago) VALUES (30, 'traspaso', 58, 1144, 1, 'abenavides', '2026-04-08 10:00:00', 'aprobado', 350); INSERT INTO tramites (puesto, tipo, solicitante_id, ventanilla, funcionario, presentado, estado, pago) VALUES (31, 'renovación', 412, 2, 'ssalazar', '2026-04-08 10:05:00', 'aprobado', 0); SELECT COUNT(*) FROM tramites WHERE presentado >= '2026-03-25';
    equals: 2
```
