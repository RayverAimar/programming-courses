# Sesión 16 — Transacciones y ACID

```session
case: taller
```

## El encargo

Martes 7 de abril. Carmen llega a la oficina con su voucher en la mano: el **viernes 20, a las 18:47**, pagó **S/ 120** en la ventanilla 2 para renovar su licencia hasta marzo de 2027. Pero el padrón dice que venció el **31 de marzo de 2026**. La renovación se perdió.

En la Oficina de Mercados trabajan dos registradores a la vez, cada uno en su ventanilla, sobre la misma base. Cuando dos personas escriben al mismo tiempo pueden pisarse. Las bases de datos tienen una herramienta para que eso no pase, la **transacción**, y la app vieja la usaba… a medias. Su **bitácora** guarda cada sentencia que envió, con la sesión, el usuario y el segundo exacto: ahí está la respuesta.

```escenario
case: taller
title: Dos ventanillas, una base
caption: "Las dos ventanillas escriben en el mismo servidor. La bitácora anota todo lo que cada sesión le pidió."
```

```expediente
title: Lo que dicen
cards:
  - name: Susana Salazar Pumacayo
    traits: { style: long, shirt: "#8a5cc4", glasses: false }
    role: Registradora, ventanilla 2
    rows: [["Usuario", "ssalazar"], ["Computadora", "VENT-2"]]
    quote: "Yo renové la licencia de la señora Carmen. La app me dijo «guardado»."
  - name: Alfredo Benavides Tello
    traits: { style: short, hair: "#121212", shirt: "#2f3a4a", glasses: true, beard: false }
    role: Registrador, ventanilla 1
    rows: [["Usuario", "abenavides"], ["Computadora", "VENT-1"]]
    quote: "A las seis y media ya me había ido. Delia sabe todas las claves."
  - name: Carmen Ríos Llanos
    traits: { style: bun, shirt: "#3f7cc4", glasses: true }
    role: Técnica de Loop, puesto 47
    rows: [["Pagó", "S/ 120, viernes 20, 18:47"]]
    quote: "Aquí está el voucher. Renové hasta 2027."
```

## Lo mínimo

Una **transacción** es un grupo de sentencias que la base trata como **una sola**: o se hacen todas, o ninguna. Se abre con **`BEGIN`** y se cierra con **`COMMIT`** (guardar todo) o **`ROLLBACK`** (deshacer todo). Sin `BEGIN`, cada sentencia es su propia transacción: eso se llama *autocommit*.

Las transacciones prometen cuatro cosas, que se recuerdan como **ACID**:

| letra | promesa | en el padrón |
|---|---|---|
| **A**tomicidad | todo o nada | un trámite y su cambio en el padrón se guardan juntos, o ninguno |
| **C**onsistencia | las reglas se cumplen al final | ninguna `CHECK`, `UNIQUE` o clave foránea queda rota |
| a**I**slamiento | las transacciones no se ven a medias entre sí | la ventanilla 1 no ve lo que la 2 todavía no confirma |
| **D**urabilidad | lo confirmado sobrevive a un apagón | después del `COMMIT`, está en el disco |

**Atomicidad, paso a paso.** Susana renueva una licencia: inserta el trámite y cambia el padrón. A la mitad, se va la luz. Dale a ▶:

```transaccion
title: Un apagón a la mitad
lanes: ["Ventanilla 2", "Lo que hace SQLite"]
steps:
  - lane: 0
    sql: BEGIN;
    db: "padrón: puesto 12 vence **2026-10-24** · trámites: 247"
    note: "Abre la transacción. Nada se escribe todavía en el archivo de la base."
  - lane: 0
    sql: "INSERT INTO tramites …;"
    sees: "ve su trámite nuevo (248)"
    note: "SQLite copia las páginas que va a tocar en el **diario** (un archivo aparte) y cambia su copia en memoria."
  - lane: 1
    sql: "⚡ se va la luz"
    note: "Nunca llegó el `COMMIT`."
  - lane: 1
    sql: "al volver: lee el diario"
    db: "padrón: puesto 12 vence **2026-10-24** · trámites: 247"
    note: "Al abrir la base, SQLite encuentra el diario de una transacción sin confirmar y **restaura las páginas originales**. El trámite a medias desaparece: atomicidad."
  - lane: 0
    sql: "BEGIN; INSERT …; UPDATE …; COMMIT;"
    db: "padrón: puesto 12 vence **2027-10-24** · trámites: 248"
    note: "Se repite entero. Con el `COMMIT`, SQLite escribe en el disco, espera a que el disco confirme y borra el diario: durabilidad."
caption: "En modo **WAL** la idea es la misma al revés: los cambios se anotan al final de un archivo `-wal` y un `COMMIT` es una marca; lo que no tiene marca se ignora."
```

**Savepoints.** Dentro de una transacción puedes marcar un punto con `SAVEPOINT nombre` y volver a él con `ROLLBACK TO nombre`, sin perder lo de antes. `RELEASE nombre` borra la marca.

```sql run
BEGIN;
UPDATE padron_puestos SET vence = '2027-10-24' WHERE puesto = 12;
SAVEPOINT antes_de_borrar;
DELETE FROM tramites WHERE puesto = 12;
ROLLBACK TO antes_de_borrar;
COMMIT;
SELECT puesto, vence, (SELECT COUNT(*) FROM tramites WHERE puesto = 12) AS tramites
FROM padron_puestos
WHERE puesto = 12;
```

**Aislamiento: lo que se ve entre dos sesiones.** Si dos transacciones corren a la vez, ¿qué ve cada una de la otra? Cuanto más aisladas, más seguras… y más esperan. El estándar describe cuatro **anomalías**:

```transaccion
title: Lectura sucia
lanes: ["Ventanilla 1", "Ventanilla 2"]
steps:
  - lane: 0
    sql: "BEGIN; UPDATE … SET vence = '2030-01-01' WHERE puesto = 8;"
    db: "puesto 8 vence **2026-05-11**"
    note: "La ventanilla 1 cambia una fecha, sin confirmar."
  - lane: 1
    sql: "SELECT vence … WHERE puesto = 8;"
    sees: "lee 2030-01-01"
    note: "Si el aislamiento lo permite (`READ UNCOMMITTED`), la ventanilla 2 lee un valor que **todavía no existe**."
  - lane: 0
    sql: ROLLBACK;
    db: "puesto 8 vence **2026-05-11**"
    note: "La ventanilla 1 se arrepiente. La 2 ya le dijo al comerciante que su licencia dura hasta 2030: leyó **basura**."
caption: "SQLite y PostgreSQL nunca permiten lecturas sucias."
```

```transaccion
title: Lectura que cambia
lanes: ["Ventanilla 1", "Ventanilla 2"]
steps:
  - lane: 0
    sql: "BEGIN; SELECT vence … WHERE puesto = 8;"
    sees: "lee 2026-05-11"
    db: "puesto 8 vence **2026-05-11**"
    note: "La ventanilla 1 empieza a revisar el puesto 8."
  - lane: 1
    sql: "UPDATE … SET vence = '2027-05-11' WHERE puesto = 8; (autocommit)"
    db: "puesto 8 vence **2027-05-11**"
    note: "La ventanilla 2 lo renueva y confirma."
  - lane: 0
    sql: "SELECT vence … WHERE puesto = 8;"
    sees: "con READ COMMITTED: 2027-05-11 · con REPEATABLE READ: 2026-05-11"
    note: "La **misma** consulta, dentro de la **misma** transacción, da otro resultado: lectura no repetible. Si en lugar de una fila cambia cuántas filas cumplen un `WHERE`, se llama **fila fantasma**."
```

| nivel (estándar), y quién lo usa por defecto | lectura sucia | no repetible | fantasma |
|---|---|---|---|
| `READ UNCOMMITTED`<br><small>casi nadie</small> | puede | puede | puede |
| `READ COMMITTED`<br><small>PostgreSQL, Oracle, SQL Server</small> | — | puede | puede |
| `REPEATABLE READ`<br><small>MySQL (InnoDB)</small> | — | — | puede (el estándar) |
| `SERIALIZABLE`<br><small>SQLite (siempre)</small> | — | — | — |

La cuarta anomalía no sale en la tabla porque ningún nivel la evita si la app lee **fuera** de la transacción: la **actualización perdida**. Dos sesiones leen la misma fila, cada una calcula su cambio y la escribe; la segunda pisa a la primera sin saberlo:

```transaccion
title: Actualización perdida
lanes: ["Sesión A", "Sesión B"]
steps:
  - lane: 0
    sql: "SELECT * … WHERE puesto = 30;"
    sees: "vence 2026-04-02, rubro: frutas"
    db: "puesto 30: vence **2026-04-02**"
    note: "A abre la ficha del puesto 30 (fuera de cualquier transacción) para cambiar el rubro."
  - lane: 1
    sql: "SELECT * … WHERE puesto = 30;"
    sees: "vence 2026-04-02"
    note: "B abre la misma ficha para renovar."
  - lane: 1
    sql: "BEGIN; UPDATE … SET vence = '2027-04-02' …; COMMIT;"
    db: "puesto 30: vence **2027-04-02**"
    note: "B renueva y confirma. Todo bien… por ahora."
  - lane: 0
    sql: "BEGIN; UPDATE … SET vence = '2026-04-02', rubro = 'verduras' …; COMMIT;"
    db: "puesto 30: vence **2026-04-02**"
    note: "A guarda **la ficha entera** como la leyó, con su cambio. La fecha vieja vuelve: la renovación de B **se perdió**, y las dos transacciones fueron perfectas."
caption: "El arreglo no es \"más transacción\": es escribir solo lo que cambias (`SET rubro = …`), o escribir solo si la fila sigue como la leíste (`WHERE … AND actualizado = 'lo que leí'`)."
```

**Cómo lo hace cada motor.** SQLite deja leer a muchos, pero **escribir a uno solo a la vez**: quien escribe toma un candado de toda la base, y quien llega después espera o recibe `SQLITE_BUSY`. Con WAL, los lectores no esperan a nadie: leen la foto de la base que había cuando empezaron. PostgreSQL usa **MVCC** (control de concurrencia multiversión): un `UPDATE` no pisa la fila, crea **una versión nueva** y marca la vieja como reemplazada; cada transacción ve las versiones que le corresponden. Por eso ahí muchos escriben a la vez, en filas distintas.

```figura
title: Dos maneras de compartir
panes:
  - label: SQLite (WAL)
    table:
      head: ["", "lee", "escribe"]
      rows:
        - ["Ventanilla 1", "su foto", "**candado de la base**"]
        - ["Ventanilla 2", "su foto", "espera su turno"]
  - label: PostgreSQL (MVCC)
    table:
      head: ["puesto 30", "creada por", "reemplazada por"]
      rows:
        - ["vence 2026-04-02", "trans. 812", "trans. 815"]
        - ["vence 2027-04-02", "trans. 815", "—"]
```

> **Trampa común:** un error **no** cierra la transacción. Si dentro de un `BEGIN` una sentencia falla (por un `UNIQUE`, por ejemplo), SQLite deshace **esa sentencia** y la transacción sigue abierta: tú decides si haces `ROLLBACK` o corriges y haces `COMMIT`. PostgreSQL es más estricto: después de un error, rechaza todo hasta que hagas `ROLLBACK`. Y si olvidas el `COMMIT`, al cerrar la conexión todo se deshace.

<!-- legacy: transactions -->

<!-- legacy: journal-wal -->

<!-- mdn: transactions journal-wal -->

## Práctica

```exercise
id: sql16-predice-rollback
type: predict
title: Me arrepentí
db: empty
setup: |
  CREATE TABLE cuentas (id INTEGER PRIMARY KEY, titular TEXT, saldo INTEGER);
  INSERT INTO cuentas VALUES (1, 'Carmen', 500), (2, 'Loop', 80);
prompt: |
  ¿Qué devuelve el `SELECT`?
code: |
  BEGIN;
  UPDATE cuentas SET saldo = saldo - 120 WHERE id = 1;
  UPDATE cuentas SET saldo = saldo + 120 WHERE id = 2;
  ROLLBACK;
  SELECT saldo FROM cuentas ORDER BY id;
options:
  - "500\n80"
  - "380\n200"
  - "380\n80"
  - "500\n200"
answer: "500\n80"
explain: |
  `ROLLBACK` deshace **todo** desde el `BEGIN`: las dos actualizaciones. Las cuentas quedan como estaban.
```

```exercise
id: sql16-predice-savepoint
type: predict
title: Volver a la marca
db: empty
setup: |
  CREATE TABLE cuentas (id INTEGER PRIMARY KEY, titular TEXT, saldo INTEGER);
  INSERT INTO cuentas VALUES (1, 'Carmen', 500), (2, 'Loop', 80);
prompt: |
  ¿Qué devuelve el `SELECT`?
code: |
  BEGIN;
  UPDATE cuentas SET saldo = saldo - 100 WHERE id = 1;
  SAVEPOINT marca;
  UPDATE cuentas SET saldo = 0 WHERE id = 1;
  ROLLBACK TO marca;
  UPDATE cuentas SET saldo = saldo + 100 WHERE id = 2;
  COMMIT;
  SELECT saldo FROM cuentas ORDER BY id;
options:
  - "400\n180"
  - "0\n180"
  - "500\n80"
  - "400\n80"
answer: "400\n180"
explain: |
  `ROLLBACK TO marca` deshace solo lo que vino después de la marca (el saldo en 0). El primer `UPDATE` sigue en pie, el último también, y el `COMMIT` guarda los dos.
```

```exercise
id: sql16-completa-transferencia
type: complete
title: Una transferencia completa
db: empty
setup: |
  CREATE TABLE cuentas (id INTEGER PRIMARY KEY, titular TEXT, saldo REAL CHECK (saldo >= 0));
  INSERT INTO cuentas VALUES (1, 'Carmen', 500), (2, 'Loop', 80), (3, 'Municipalidad', 0);
prompt: |
  Carmen (cuenta 1) le paga **S/ 120** a la Municipalidad (cuenta 3). Las dos actualizaciones deben ir en **una transacción**. Reemplaza los `___`.
starter: |
  ___;
  UPDATE cuentas SET saldo = saldo - 120 WHERE id = ___;
  UPDATE cuentas SET saldo = saldo + 120 WHERE id = ___;
  ___;
  SELECT id, saldo FROM cuentas ORDER BY id;
solution: |
  BEGIN;
  UPDATE cuentas SET saldo = saldo - 120 WHERE id = 1;
  UPDATE cuentas SET saldo = saldo + 120 WHERE id = 3;
  COMMIT;
  SELECT id, saldo FROM cuentas ORDER BY id;
hints:
  - "La transacción se abre con `BEGIN` y se guarda con `COMMIT`."
tests:
  - name: Carmen tiene 380 y la Municipalidad 120
    db: SELECT (SELECT saldo FROM cuentas WHERE id = 1) = 380 AND (SELECT saldo FROM cuentas WHERE id = 3) = 120
  - name: la transacción quedó cerrada
    db: BEGIN; SELECT 1;
    msg: Falta cerrar la transacción con COMMIT.
  - name: usa BEGIN y COMMIT
    source: '\bBEGIN\b[\s\S]*\bCOMMIT\b'
```

```exercise
id: sql16-arregla-savepoint
type: fix
title: Deshacer de más
prompt: |
  Susana registra un **cambio de rubro** del puesto 12 y, en la misma transacción, iba a cambiar el titular… pero se equivocó de persona. Quiere **deshacer solo el cambio del titular** y guardar el trámite. Tal como está, el código deshace todo y el `COMMIT` falla. Arréglalo.
visual:
  figure:
    title: Lo que quería Susana
    panes:
      - label: Guardar
        value: "el trámite"
      - label: Deshacer
        value: "el UPDATE"
starter: |
  BEGIN;
  INSERT INTO tramites (puesto, tipo, solicitante_id, ventanilla, funcionario, presentado, estado, pago)
  VALUES (12, 'cambio de rubro', 412, 2, 'ssalazar', '2026-04-07 09:15:00', 'aprobado', 60);
  SAVEPOINT antes_del_padron;
  UPDATE padron_puestos SET titular_id = 413 WHERE puesto = 12;
  ROLLBACK;
  COMMIT;
solution: |
  BEGIN;
  INSERT INTO tramites (puesto, tipo, solicitante_id, ventanilla, funcionario, presentado, estado, pago)
  VALUES (12, 'cambio de rubro', 412, 2, 'ssalazar', '2026-04-07 09:15:00', 'aprobado', 60);
  SAVEPOINT antes_del_padron;
  UPDATE padron_puestos SET titular_id = 413 WHERE puesto = 12;
  ROLLBACK TO antes_del_padron;
  COMMIT;
hints:
  - "`ROLLBACK` a secas deshace toda la transacción, y después no hay nada que confirmar."
  - "Para volver a la marca: `ROLLBACK TO antes_del_padron;`."
tests:
  - name: el trámite quedó guardado
    db: SELECT COUNT(*) FROM tramites WHERE puesto = 12 AND presentado = '2026-04-07 09:15:00'
    equals: 1
  - name: el titular del puesto 12 sigue siendo la persona 412
    db: SELECT titular_id FROM padron_puestos WHERE puesto = 12
    equals: 412
```

```exercise
id: sql16-escribe-renovacion
type: write
title: Renovar sin pisar a nadie
prompt: |
  Registra otra vez la renovación de Carmen, bien hecha: en **una transacción**, inserta el trámite (`puesto` 47, `tipo` `'renovación'`, `solicitante_id` 58, `ventanilla` 2, `funcionario` `'loop'`, `presentado` `'2026-04-07 10:00:00'`, `estado` `'aprobado'`, `pago` 120) y cambia **solo** la columna `vence` del puesto 47 a `'2027-03-31'`. No toques las otras columnas: si alguien las cambió, sus cambios se quedan.
starter: |
  UPDATE padron_puestos
  SET titular_id = 58, licencia = 'LF-2021-0047', vence = '2027-03-31', estado = 'vigente'
  WHERE puesto = 47;
solution: |
  BEGIN;
  INSERT INTO tramites (puesto, tipo, solicitante_id, ventanilla, funcionario, presentado, estado, pago)
  VALUES (47, 'renovación', 58, 2, 'loop', '2026-04-07 10:00:00', 'aprobado', 120);
  UPDATE padron_puestos
  SET vence = '2027-03-31'
  WHERE puesto = 47;
  COMMIT;
hints:
  - "El `UPDATE` del inicio es como el de la app vieja: escribe la ficha entera. Deja en el `SET` solo `vence`."
tests:
  - name: el puesto 47 vence el 31 de marzo de 2027
    db: SELECT vence FROM padron_puestos WHERE puesto = 47
    equals: "2027-03-31"
  - name: el trámite está registrado
    db: SELECT COUNT(*) FROM tramites WHERE puesto = 47 AND funcionario = 'loop' AND tipo = 'renovación'
    equals: 1
  - name: no tocaste el titular ni la licencia
    db: SELECT licencia FROM padron_puestos WHERE puesto = 47
    equals: LF-2026-0047
    msg: Cambia solo vence; el titular se discute en otro lado.
  - name: todo va en una transacción cerrada
    source: '\bBEGIN\b[\s\S]*\bCOMMIT\b'
```

```exercise
id: sql16-escribe-optimista
type: write
title: Escribir solo si nadie cambió la fila
setup: |
  UPDATE padron_puestos SET actualizado = '2026-02-11 10:22:05', vence = '2026-10-24' WHERE puesto = 12;
prompt: |
  Susana abrió la ficha del puesto 12 a las 9:00 y vio `actualizado = '2026-02-11 10:22:05'`. Ahora quiere renovarla: `vence` a `'2027-10-24'`, `actualizado` a `'2026-04-07 09:05:00'` y `actualizado_por` a `'ssalazar'`. Pero **solo si nadie cambió la fila desde que la leyó**: agrega esa condición al `WHERE` y devuelve con `RETURNING puesto, vence` lo que cambió. Si alguien se adelantó, el `UPDATE` no debe tocar nada (y `RETURNING` no devuelve filas: la app sabrá que tiene que volver a leer).

  Tu código se prueba dos veces: con la fila como Susana la leyó y con la fila cambiada por otra ventanilla.
starter: |
  UPDATE padron_puestos
  SET vence = '2027-10-24', actualizado = '2026-04-07 09:05:00', actualizado_por = 'ssalazar'
  WHERE puesto = 12;
solution: |
  UPDATE padron_puestos
  SET vence = '2027-10-24', actualizado = '2026-04-07 09:05:00', actualizado_por = 'ssalazar'
  WHERE puesto = 12
    AND actualizado = '2026-02-11 10:22:05'
  RETURNING puesto, vence;
hints:
  - "La condición es que `actualizado` siga siendo lo que leíste: `AND actualizado = '2026-02-11 10:22:05'`."
scenarios:
  - tests:
      - name: si nadie la tocó, la renueva
        db: SELECT vence FROM padron_puestos WHERE puesto = 12
        equals: "2027-10-24"
      - name: RETURNING devuelve el puesto renovado
        rows: 1
  - setup: |
      UPDATE padron_puestos SET vence = '2026-12-31', actualizado = '2026-04-07 09:02:41', actualizado_por = 'abenavides' WHERE puesto = 12;
    tests:
      - name: si la ventanilla 1 se adelantó, no pisa su cambio
        db: SELECT vence FROM padron_puestos WHERE puesto = 12
        equals: "2026-12-31"
      - name: RETURNING no devuelve filas
        rows: 0
```

## El caso

```exercise
id: sql16-caso-renovacion
type: case
title: El voucher de Carmen
prompt: |
  **Busca en `tramites` la renovación del puesto 47 del viernes 20 y averigua quién la atendió.** Escribe su nombre completo.

  `funcionario` guarda el usuario de la app; `usuarios` dice de quién es cada usuario (`persona_id`), y el nombre está en `personas`.
visual:
  - escenario:
      case: taller
  - esquema:
      tables: [tramites, usuarios, personas]
starter: |
  SELECT *
  FROM tramites
  WHERE puesto = 47;
solution: |
  SELECT t.presentado, t.tipo, t.estado, t.pago, t.ventanilla, p.nombre
  FROM tramites t
  JOIN usuarios u ON u.login = t.funcionario
  JOIN personas p ON p.id = u.persona_id
  WHERE t.puesto = 47
    AND t.presentado LIKE '2026-03-20%'
  ORDER BY t.presentado;
answer: Susana Salazar Pumacayo
answerLabel: ¿Quién atendió la renovación?
reveal: |
  **Susana Salazar Pumacayo**, en la ventanilla 2, a las **18:47:31**: renovación aprobada y S/ 120 pagados. Carmen dice la verdad. Pero cinco minutos después, a las **18:52:39**, hay otro trámite del mismo puesto en la ventanilla 1: el traspaso a Yolanda. Si la renovación se aprobó, ¿por qué el padrón sigue diciendo 2026-03-31?
hints:
  - "Une `tramites` con `usuarios` por `u.login = t.funcionario`, y `usuarios` con `personas` por `p.id = u.persona_id`."
  - "`presentado LIKE '2026-03-20%'` deja solo los del viernes."
```

## El juez

```exercise
id: sql16-juez-transferencia
type: judge
title: Todo o nada
prompt: |
  **Ejecuta la orden de pago: mueve `monto` de la cuenta `de` a la cuenta `a`, pero solo si las dos cuentas existen, son distintas y la cuenta `de` tiene saldo suficiente. Si no se cumple algo, no cambia nada.**

  La caja de la asociación de comerciantes procesa una orden a la vez. Una transferencia a medias es lo peor que puede pasar: plata que sale de una cuenta y no llega a ninguna, o que llega sin haber salido. Una sola sentencia es atómica; dos sentencias sueltas, no.

  **Tablas:** `cuentas(id, saldo)` y `orden(de, a, monto)`, con exactamente una fila y `monto > 0`.

  **Lo que se revisa:** el contenido de `cuentas` después de tu código.
schema: |
  CREATE TABLE cuentas (id INTEGER PRIMARY KEY, saldo REAL);
  CREATE TABLE orden (de INTEGER, a INTEGER, monto REAL);
check: SELECT id, saldo FROM cuentas
starter: |
  UPDATE cuentas SET saldo = saldo - (SELECT monto FROM orden) WHERE id = (SELECT de FROM orden);
  UPDATE cuentas SET saldo = saldo + (SELECT monto FROM orden) WHERE id = (SELECT a FROM orden);
solution: |
  UPDATE cuentas
  SET saldo = saldo + CASE WHEN cuentas.id = o.de THEN -o.monto ELSE o.monto END
  FROM orden AS o
  WHERE cuentas.id IN (o.de, o.a)
    AND o.de <> o.a
    AND (SELECT COUNT(*) FROM cuentas c WHERE c.id IN (o.de, o.a)) = 2
    AND (SELECT c.saldo FROM cuentas c WHERE c.id = o.de) >= o.monto;
hints:
  - "`UPDATE cuentas SET … FROM orden AS o WHERE …` (SQLite 3.33, igual que PostgreSQL) te deja usar las columnas de la orden en el `SET` y en el `WHERE`."
  - "En una sola sentencia, las condiciones (existen las dos, saldo suficiente) se evalúan antes de cambiar nada: o cambian las dos filas, o ninguna."
samples:
  - rows:
      cuentas: [[1, 500], [2, 80], [3, 0]]
      orden: [[1, 3, 120]]
    note: "La cuenta 1 tiene saldo: pasan 120 a la 3."
  - rows:
      cuentas: [[1, 100], [2, 80]]
      orden: [[2, 1, 90]]
    note: "La cuenta 2 tiene 80 y quiere pagar 90: no cambia nada."
  - rows:
      cuentas: [[1, 500], [2, 80]]
      orden: [[1, 7, 50]]
    note: "La cuenta 7 no existe: la plata no puede salir de la 1."
edge:
  - rows: { cuentas: [[1, 100]], orden: [[1, 1, 30]] }
    tag: cuando una cuenta se paga a sí misma
  - rows: { cuentas: [[1, 100], [2, 0]], orden: [[1, 2, 100]] }
    tag: con el saldo exacto
  - rows: { cuentas: [[1, 100], [2, 0]], orden: [[9, 2, 10]] }
    tag: cuando la cuenta que paga no existe
random:
  count: 40
  seed: 1616
  generate: |
    const n = rng.int(1, 6);
    const cuentas = [];
    for (let i = 1; i <= n; i++) cuentas.push([i, rng.int(0, 50) * 10]);
    const de = rng.int(1, n + 1), a = rng.int(1, n + 1);
    return { cuentas, orden: [[de, a, rng.int(1, 30) * 10]] };
wrong:
  - |
    UPDATE cuentas
    SET saldo = saldo + CASE WHEN cuentas.id = o.de THEN -o.monto ELSE o.monto END
    FROM orden AS o
    WHERE cuentas.id IN (o.de, o.a) AND o.de <> o.a
      AND (SELECT c.saldo FROM cuentas c WHERE c.id = o.de) >= o.monto;
  - |
    UPDATE cuentas SET saldo = saldo - (SELECT monto FROM orden)
    WHERE id = (SELECT de FROM orden) AND saldo >= (SELECT monto FROM orden);
    UPDATE cuentas SET saldo = saldo + (SELECT monto FROM orden)
    WHERE id = (SELECT a FROM orden);
  - |
    UPDATE cuentas
    SET saldo = saldo + CASE WHEN cuentas.id = o.de THEN -o.monto ELSE o.monto END
    FROM orden AS o
    WHERE cuentas.id IN (o.de, o.a) AND o.de <> o.a
      AND (SELECT COUNT(*) FROM cuentas c WHERE c.id IN (o.de, o.a)) = 2
      AND (SELECT c.saldo FROM cuentas c WHERE c.id = o.de) > o.monto;
```

## Misión final

```exercise
id: sql16-mision-bitacora
type: mission
title: Lo que pasó entre las 18:40 y las 18:53
prompt: |
  **Lista, en orden, todo lo que la bitácora registró entre las 18:40 y las 18:53 del viernes 20: `momento`, `sesion`, `usuario`, `terminal` y `sentencia`.** Luego lee las sentencias como dos carriles, uno por sesión, y responde: ¿qué sesión pisó la renovación de Susana?

  Fíjate en qué leyó cada sesión y **cuándo**: la que escribe con datos viejos es la que pisa.
visual:
  - escenario:
      case: taller
  - transaccion:
      title: "Los dos carriles que vas a reconstruir"
      lanes: ["Ventanilla 2 (ssalazar)", "Ventanilla 1 (¿?)"]
      steps:
        - lane: 0
          sql: "SELECT … puesto = 47"
          note: "18:44 — Susana abre la ficha de Carmen."
        - lane: 1
          sql: "?"
          note: "¿Qué hace la otra sesión, y cuándo? Ejecuta tu consulta."
  - esquema:
      tables: [bitacora]
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
  SELECT momento, sesion, usuario, sentencia
  FROM bitacora
  WHERE puesto = 47;
solution: |
  SELECT momento, sesion, usuario, terminal, sentencia
  FROM bitacora
  WHERE momento BETWEEN '2026-03-20 18:40' AND '2026-03-20 18:53'
  ORDER BY momento;
answer: "328"
answerLabel: ¿Qué sesión pisó la renovación? (su número)
reveal: |
  **La sesión 328**, usuario **abenavides**, desde **VENT-1**. Leyó la ficha del puesto 47 a las **18:45:05**, cuando todavía vencía el 31 de marzo de 2026. Susana renovó y confirmó a las 18:47:33. A las **18:52:40**, la sesión 328 escribió la ficha **entera** como la había leído: Yolanda de titular y la fecha vieja. Una **actualización perdida** de manual, y Susana queda limpia. Pero Alfredo insiste: «Yo me fui a las 18:30. Alguien usó mi usuario».
hints:
  - "`WHERE momento BETWEEN '2026-03-20 18:40' AND '2026-03-20 18:53'`, ordenado por `momento`."
  - "Las filas `BEGIN` y `COMMIT` tienen `puesto` en `NULL`: si filtras por `puesto = 47`, desaparecen."
tests:
  - name: las diez sentencias de la ventana, en orden
    same: SELECT momento, sesion, usuario, terminal, sentencia FROM bitacora WHERE momento BETWEEN '2026-03-20 18:40' AND '2026-03-20 18:53' ORDER BY momento
    ordered: true
```

## Reto experto

```exercise
id: sql16-reto-perdidas
type: challenge
title: Todas las actualizaciones perdidas de marzo
prompt: |
  **Encuentra en la bitácora todas las escrituras pisadas: un `UPDATE` de una sesión A sobre un puesto, seguido de un `UPDATE` de otra sesión B sobre el mismo puesto, cuando la última lectura (`SELECT`) que B hizo de ese puesto antes de escribir fue anterior a la escritura de A.** Devuelve `puesto`, `pisada` (la sesión A), `pisa` (la sesión B) y `momento` (el de la escritura de B), ordenado por `momento`.

  Para quien ya programa: es un autojoin de la bitácora consigo misma con una subconsulta correlacionada. La 328 no es la única: la app vieja pierde datos por diseño.
starter: |
  SELECT puesto, sesion, momento, sentencia
  FROM bitacora
  WHERE sentencia LIKE 'UPDATE%'
  ORDER BY puesto, momento;
solution: |
  SELECT w1.puesto, w1.sesion AS pisada, w2.sesion AS pisa, w2.momento
  FROM bitacora w1
  JOIN bitacora w2
    ON w2.puesto = w1.puesto
   AND w2.sesion <> w1.sesion
   AND w2.momento > w1.momento
  WHERE w1.sentencia LIKE 'UPDATE%'
    AND w2.sentencia LIKE 'UPDATE%'
    AND (SELECT max(r.momento)
         FROM bitacora r
         WHERE r.sesion = w2.sesion
           AND r.puesto = w2.puesto
           AND r.sentencia LIKE 'SELECT%'
           AND r.momento < w2.momento) < w1.momento
  ORDER BY w2.momento;
hints:
  - "Une la bitácora consigo misma: `w1` es la escritura que se pierde y `w2` la que la pisa (mismo puesto, otra sesión, más tarde)."
  - "La última lectura de B antes de escribir: `(SELECT max(r.momento) FROM bitacora r WHERE r.sesion = w2.sesion AND r.puesto = w2.puesto AND r.sentencia LIKE 'SELECT%' AND r.momento < w2.momento)`. Si es menor que `w1.momento`, B escribió con datos viejos."
tests:
  - name: las escrituras pisadas de marzo, en orden
    same: SELECT w1.puesto, w1.sesion, w2.sesion, w2.momento FROM bitacora w1 JOIN bitacora w2 ON w2.puesto = w1.puesto AND w2.sesion <> w1.sesion AND w2.momento > w1.momento WHERE w1.sentencia LIKE 'UPDATE%' AND w2.sentencia LIKE 'UPDATE%' AND (SELECT max(r.momento) FROM bitacora r WHERE r.sesion = w2.sesion AND r.puesto = w2.puesto AND r.sentencia LIKE 'SELECT%' AND r.momento < w2.momento) < w1.momento ORDER BY w2.momento
    ordered: true
  - name: columnas puesto, pisada, pisa y momento
    columns: [puesto, pisada, pisa, momento]
```
