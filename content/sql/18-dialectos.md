# Sesión 18 — SQLite, PostgreSQL y MySQL: el expediente final

```session
case: taller
```

## El encargo

Jueves 9 de abril. Dos noticias. La buena: Edith aprobó el diseño de Loop, y el padrón nuevo va a vivir en el servidor de la municipalidad, que corre **PostgreSQL**. La otra: la **Contraloría** abrió una investigación por los cuatro traspasos y manda sus consultas escritas para PostgreSQL. Tú trabajas en SQLite. Mismo SQL, distintos dialectos: lo que en uno es una línea, en otro es un error… o, peor, un resultado distinto sin aviso.

Y queda la última pregunta del expediente. Alfredo dice que se fue a las 18:30 y que alguien usó su cuenta. El teléfono de la planilla apunta a Delia; la computadora, a la ventanilla 1. Para cerrar el caso vas a cruzar **todos los expedientes**: las puertas del mercado y las llamadas del primer caso, los pagos del segundo y la bitácora de este.

```escenario
case: taller
title: El último día en la oficina
caption: "Cada número es una pista de este expediente. La última se enciende cuando la consulta final lo pruebe."
```

```expediente
title: Los que quedan
cards:
  - name: Alfredo Benavides Tello
    traits: { style: short, hair: "#121212", shirt: "#2f3a4a", glasses: true, beard: false }
    role: Registrador, ventanilla 1
    quote: "Revisen la puerta: salí a las seis y media."
  - name: Delia Lozano Yupanqui
    traits: { style: bun, shirt: "#3fa7a7", glasses: true }
    role: Sistemas
    quote: "Ese celular en la planilla es mío, sí. Yo no lo puse."
  - name: Yolanda Ugarte Montes
    traits: { style: curly, shirt: "#e07a5f", earrings: true }
    role: Titular de cuatro puestos (por ahora)
    quote: "Yo pagué por esos puestos. A quién, eso no le importa a nadie."
  - name: "Tito Vílchez Arias"
    traits: {"style": "curly", "shirt": "#c4553f"}
    role: "Comerciante de La Victoria; caso SUR-0314"
    rows: [["Antes", "compró el giroscopio de Wayra"], ["Apellidos", "Vílchez Arias"]]
```

```figura
title: "Los sospechosos, lado a lado"
table:
  head: ["persona", "cuenta y computadora", "dijo", "falta saber"]
  rows:
    - - "Alfredo"
      - "abenavides · VENT-1"
      - "«Salí a las 18:30; alguien usó mi usuario.»"
      - "¿Estaba en el mercado a las 18:52:40?"
    - ["Delia", "dlozano · SIS-01", "«Salí a las 18:20.»", "¿Estaba en el mercado a las 18:52:40?"]
    - - "Susana"
      - "ssalazar · VENT-2"
      - "«Yo renové la licencia de Carmen.»"
      - "Descartada: la sesión 328 pisó su renovación"
```

## Lo mínimo

SQL es un estándar, pero cada motor lo habla con su acento. Las diferencias que más muerden al pasar una consulta de un motor a otro:

| tema | SQLite (este curso) | PostgreSQL | MySQL |
|---|---|---|---|
| **tipos** | flexibles; `STRICT` opcional | estrictos: `'12' + 'a'` es error | estrictos a medias (avisa y convierte) |
| **clave que se numera** | `INTEGER PRIMARY KEY` | `GENERATED ALWAYS AS IDENTITY` (o `SERIAL`) | `AUTO_INCREMENT` |
| **pegar textos** | `a \|\| b` | `a \|\| b` | `CONCAT(a, b)` (`\|\|` es un `OR`) |
| **primeras filas** | `LIMIT 5` | `LIMIT 5` o `FETCH FIRST 5 ROWS ONLY` | `LIMIT 5` |
| **verdadero/falso** | `1` y `0` | `boolean`: `true`, `false` | `1` y `0` (`TINYINT(1)`) |
| **fechas** | texto + `date()`, `datetime(x, '-3 days')`, `julianday` | tipos `date`/`timestamp`: `x - INTERVAL '3 days'`, `x::date` | `DATE_SUB(x, INTERVAL 3 DAY)`, `DATE(x)` |
| **días entre fechas** | `julianday(a) - julianday(b)` | `a - b` (con `date`) | `DATEDIFF(a, b)` |
| **sin mayúsculas** | `LIKE` (solo ASCII) | `ILIKE` | `LIKE` (según la *collation*) |
| **5 / 2** | `2` | `2` | `2.5000` |
| **upsert** | `ON CONFLICT … DO UPDATE` | igual | `ON DUPLICATE KEY UPDATE` |
| **RETURNING** | sí (3.35) | sí | no (MariaDB sí) |
| **ventanas, CTE, recursivas** | sí (3.25, 3.8.3) | sí | sí desde 8.0 |
| **FULL JOIN** | sí (3.39) | sí | no |
| **comillas** | `'texto'`, `"columna"` | igual | `'texto'`, `` `columna` `` |

**Pasar una consulta de un dialecto a otro**, pieza por pieza. Esta es una consulta de la Contraloría sobre licencias, en PostgreSQL. Dale a ▶:

```traduccion
title: De PostgreSQL a SQLite
from: PostgreSQL
to: SQLite
steps:
  - a: "SELECT puesto,"
    b: "SELECT puesto,"
    note: "Lo que es estándar pasa igual: `SELECT`, `FROM`, `WHERE`, joins, `GROUP BY`, `CASE`, `COALESCE`."
  - a: "       vence - DATE '2026-03-23' AS dias,"
    b: "       julianday(vence) - julianday('2026-03-23') AS dias,"
    note: "En PostgreSQL restar dos `date` da días. SQLite no tiene tipo fecha: `vence - '2026-03-23'` resta **números** (2026 − 2026 = 0) sin dar error. `julianday` convierte cada fecha en un número de días."
  - a: "       (vence < DATE '2026-04-23') AS urgente"
    b: "       vence < '2026-04-23' AS urgente"
    note: "PostgreSQL devuelve `true`/`false`; SQLite, `1`/`0`. Las fechas `'AAAA-MM-DD'` se comparan bien como texto."
  - a: "FROM padron_puestos"
    b: "FROM padron_puestos"
    note: ""
  - a: "WHERE estado ILIKE 'VIGENTE'"
    b: "WHERE lower(estado) = 'vigente'"
    note: "`ILIKE` no existe en SQLite. `LIKE` ya ignora mayúsculas en letras sin tilde, pero `lower(…)` lo dice claro y funciona en los tres."
  - a: "ORDER BY dias, puesto"
    b: "ORDER BY dias, puesto"
    note: ""
  - a: "FETCH FIRST 10 ROWS ONLY;"
    b: "LIMIT 10;"
    note: "`FETCH FIRST` es el estándar; SQLite y MySQL usan `LIMIT`. PostgreSQL entiende los dos."
caption: "La trampa más peligrosa no es la que da error, sino la que corre: `vence - '2026-03-23'` devuelve 0 en SQLite en cada fila."
```

Por qué tantas diferencias: SQLite nació para guardar datos **dentro** de un programa, sin servidor, y prefiere aceptar lo que le den (tipado dinámico, fechas como texto). PostgreSQL nació en una universidad para hacer cumplir el modelo relacional al pie de la letra (tipos estrictos, `boolean`, `interval`, MVCC). MySQL nació para que las webs de los noventa fueran rápidas, y arrastra decisiones de esa época (`||` como `OR`, divisiones decimales, *collations* que ignoran mayúsculas). Escribir **SQL portable** es elegir lo que los tres entienden igual:

```figura
title: La misma pregunta, tres dialectos
panes:
  - label: SQLite
    text: |
      SELECT puesto, titular_id
      FROM padron_puestos
      WHERE vence < date('2026-03-23', '+30 days')
      ORDER BY vence
      LIMIT 3;
  - label: PostgreSQL
    text: |
      SELECT puesto, titular_id
      FROM padron_puestos
      WHERE vence < DATE '2026-03-23' + 30
      ORDER BY vence
      FETCH FIRST 3 ROWS ONLY;
  - label: MySQL
    text: |
      SELECT puesto, titular_id
      FROM padron_puestos
      WHERE vence < DATE_ADD('2026-03-23', INTERVAL 30 DAY)
      ORDER BY vence
      LIMIT 3;
```

```sql run
SELECT 7 / 2 AS division,
       7 / 2.0 AS con_decimales,
       'Puesto ' || 47 AS texto,
       '2026-03-31' < '2026-04-01' AS comparar_fechas,
       julianday('2026-03-31') - julianday('2026-03-23') AS dias;
```

> **Trampa común:** la consulta que "funciona" en los dos motores pero dice otra cosa. `7 / 2` da 3 en SQLite y PostgreSQL, y 3.5 en MySQL. `'2026-03-20' - 7` da error en PostgreSQL, y en SQLite devuelve **2019**, un número, que comparado con un texto siempre pierde: `momento >= '2026-03-20' - 7` deja pasar **todas** las filas. Al portar, prueba con datos cuyo resultado ya conoces.

<!-- legacy: ilike -->

<!-- legacy: booleans -->

<!-- mdn: ilike booleans -->

## Práctica

```exercise
id: sql18-predice-tipos
type: predict
title: Lo que SQLite deja pasar
prompt: |
  ¿Qué devuelve en SQLite?
code: |
  SELECT 7 / 2, '3' + 4, 'a' || 1;
options:
  - "3 | 7 | a1"
  - "3.5 | 7 | a1"
  - "3 | 34 | a1"
  - "3 | 7 | 1"
answer: "3 | 7 | a1"
explain: |
  División entera, como en PostgreSQL (MySQL daría 3.5000). `'3' + 4`: SQLite convierte el texto en número y suma, 7 (PostgreSQL también, porque `'3'` no tiene tipo todavía; con una columna de texto sería un error). `||` pega textos: `'a1'`. En MySQL, `'a' || 1` sería un `OR` lógico y daría 1.
```

```exercise
id: sql18-predice-booleanos
type: predict
title: Verdadero más verdadero
prompt: |
  ¿Qué devuelve en SQLite?
code: |
  SELECT TRUE + TRUE, 5 > 3, typeof(5 > 3);
options:
  - "2 | 1 | integer"
  - "1 | 1 | boolean"
  - "2 | TRUE | boolean"
  - "1 | TRUE | integer"
answer: "2 | 1 | integer"
explain: |
  En SQLite, `TRUE` es solo otra forma de escribir 1, y una comparación devuelve el entero 1 o 0. En PostgreSQL, `TRUE + TRUE` es un error (no se suman booleanos) y `5 > 3` es `true`.
```

```exercise
id: sql18-completa-traduce
type: complete
title: Días que faltan
prompt: |
  La Contraloría manda esta consulta de PostgreSQL: los 5 puestos vigentes cuya licencia vence más pronto (desde el lunes 23 de marzo, la fecha de corte de su revisión), con los días que faltan.

  ```sql
  SELECT puesto, vence - DATE '2026-03-23' AS dias
  FROM padron_puestos
  WHERE estado = 'vigente' AND vence >= DATE '2026-03-23'
  ORDER BY dias, puesto
  FETCH FIRST 5 ROWS ONLY;
  ```

  Completa la versión de SQLite. Los días deben salir como enteros.
starter: |
  SELECT puesto,
         CAST(___(vence) - julianday('2026-03-23') AS ___) AS dias
  FROM padron_puestos
  WHERE estado = 'vigente' AND vence >= '2026-03-23'
  ORDER BY dias, puesto
  ___ 5;
solution: |
  SELECT puesto,
         CAST(julianday(vence) - julianday('2026-03-23') AS INTEGER) AS dias
  FROM padron_puestos
  WHERE estado = 'vigente' AND vence >= '2026-03-23'
  ORDER BY dias, puesto
  LIMIT 5;
hints:
  - "`julianday` convierte una fecha en días; la resta da un número con decimales (`8.0`), que `CAST(… AS INTEGER)` deja en 8."
  - "`FETCH FIRST 5 ROWS ONLY` en SQLite es `LIMIT 5`."
tests:
  - name: los cinco puestos con sus días, en orden
    same: SELECT puesto, CAST(julianday(vence) - julianday('2026-03-23') AS INTEGER) FROM padron_puestos WHERE estado = 'vigente' AND vence >= '2026-03-23' ORDER BY 2, puesto LIMIT 5
    ordered: true
```

```exercise
id: sql18-arregla-fecha
type: fix
title: Una resta que no avisa
prompt: |
  Alguien portó desde otro motor esta consulta: **los pagos que recibió Yolanda en los 7 días antes del viernes 20** (desde el viernes 13). En SQLite no da error… pero trae pagos de todo el mes. Ejecútala, mira las fechas y arréglala.
visual:
  figure:
    title: Lo que SQLite calcula
    input: { label: "La expresión", value: "'2026-03-20' - 7" }
    arrow: "texto → número"
    output: { label: "El resultado", value: "2019" }
    steps:
      - "SQLite convierte `'2026-03-20'` en número: lee hasta donde puede, **2026**, y le resta 7."
      - "En SQLite, un texto siempre es mayor que un número: `momento >= 2019` es verdadero en **todas** las filas."
starter: |
  SELECT t.momento, p.nombre, t.monto, t.mensaje
  FROM transferencias t
  JOIN personas p ON p.telefono = t.de_telefono
  WHERE t.a_telefono = (SELECT telefono FROM personas WHERE nombre = 'Yolanda Ugarte Montes')
    AND t.momento >= '2026-03-20' - 7
    AND t.momento < '2026-03-20'
  ORDER BY t.momento;
solution: |
  SELECT t.momento, p.nombre, t.monto, t.mensaje
  FROM transferencias t
  JOIN personas p ON p.telefono = t.de_telefono
  WHERE t.a_telefono = (SELECT telefono FROM personas WHERE nombre = 'Yolanda Ugarte Montes')
    AND t.momento >= datetime('2026-03-20', '-7 days')
    AND t.momento < '2026-03-20'
  ORDER BY t.momento;
hints:
  - "En SQLite, las fechas se mueven con modificadores: `datetime('2026-03-20', '-7 days')`."
tests:
  - name: solo los pagos del 13 al 19, en orden
    same: SELECT t.momento, p.nombre, t.monto, t.mensaje FROM transferencias t JOIN personas p ON p.telefono = t.de_telefono WHERE t.a_telefono = (SELECT telefono FROM personas WHERE nombre = 'Yolanda Ugarte Montes') AND t.momento >= '2026-03-13' AND t.momento < '2026-03-20' ORDER BY t.momento
    ordered: true
```

```exercise
id: sql18-escribe-portable
type: write
title: Una consulta para los tres motores
prompt: |
  La Contraloría correrá esta consulta en PostgreSQL y en MySQL. **Para cada usuario de la app, su `login`, el `nombre` de su dueño (o `'genérica'` si la cuenta no tiene persona) y cuántos trámites atendió en marzo de 2026 como `tramites`**, de más a menos trámites y, si empatan, por `login`.

  Escríbela **portable**: sin funciones que solo existen en SQLite (`ifnull`, `iif`, `strftime`, `datetime`, `julianday`, `group_concat`) y sin comillas dobles para textos.
starter: |
  SELECT login
  FROM usuarios;
solution: |
  SELECT u.login,
         COALESCE(p.nombre, 'genérica') AS nombre,
         COUNT(t.id) AS tramites
  FROM usuarios u
  LEFT JOIN personas p ON p.id = u.persona_id
  LEFT JOIN tramites t
    ON t.funcionario = u.login
   AND t.presentado >= '2026-03-01'
   AND t.presentado < '2026-04-01'
  GROUP BY u.login, p.nombre
  ORDER BY tramites DESC, u.login;
hints:
  - "Los usuarios sin trámites también salen (con 0): `LEFT JOIN`, y el filtro de fechas va en el `ON`, no en el `WHERE`."
  - "`COUNT(t.id)` cuenta solo los trámites que existen; `COALESCE` es estándar."
tests:
  - name: los cinco usuarios con sus trámites de marzo, en orden
    same: SELECT u.login, COALESCE(p.nombre, 'genérica'), COUNT(t.id) AS n FROM usuarios u LEFT JOIN personas p ON p.id = u.persona_id LEFT JOIN tramites t ON t.funcionario = u.login AND t.presentado >= '2026-03-01' AND t.presentado < '2026-04-01' GROUP BY u.login, p.nombre ORDER BY n DESC, u.login
    ordered: true
  - name: sin funciones exclusivas de SQLite
    sourceNot: '\b(ifnull|iif|strftime|datetime|julianday|group_concat)\s*\(|"'
    msg: Esa función o esas comillas no existen igual en PostgreSQL o MySQL.
  - name: columnas login, nombre y tramites
    columns: [login, nombre, tramites]
```

## El caso

```exercise
id: sql18-caso-contraloria
type: case
title: La consulta de la Contraloría
prompt: |
  **La Contraloría quiere saber quién le pagó a Yolanda por el puesto 47 en los tres días antes y después del viernes 20. Pásala a SQLite, ejecútala y escribe el nombre de quien pagó.**

  Así llegó, en PostgreSQL (en el editor tal cual: dará error). Cambia `::date`, `ILIKE`, `INTERVAL` y `FETCH FIRST` por lo que entiende SQLite.
visual:
  - escenario:
      case: taller
  - traduccion:
      title: Lo que hay que cambiar
      from: PostgreSQL
      to: SQLite
      steps:
        - a: "t.momento::date"
          b: "date(t.momento)"
          note: "Convertir a fecha: en SQLite, la función `date`."
        - a: "nombre ILIKE 'yolanda ugarte%'"
          b: "lower(nombre) LIKE 'yolanda ugarte%'"
          note: "Sin `ILIKE`: `lower` + `LIKE`."
        - a: "TIMESTAMP '2026-03-20' - INTERVAL '3 days'"
          b: "datetime('2026-03-20', '-3 days')"
          note: "Mover una fecha: un modificador."
        - a: "FETCH FIRST 5 ROWS ONLY"
          b: "LIMIT 5"
          note: "Las primeras filas."
starter: |
  SELECT p.nombre, t.monto, t.momento::date AS dia, t.mensaje
  FROM transferencias t
  JOIN personas p ON p.telefono = t.de_telefono
  WHERE t.a_telefono = (SELECT telefono FROM personas WHERE nombre ILIKE 'yolanda ugarte%')
    AND t.mensaje ILIKE '%PUESTO 47%'
    AND t.momento BETWEEN TIMESTAMP '2026-03-20' - INTERVAL '3 days'
                      AND TIMESTAMP '2026-03-20' + INTERVAL '3 days'
  ORDER BY t.momento
  FETCH FIRST 5 ROWS ONLY;
solution: |
  SELECT p.nombre, t.monto, date(t.momento) AS dia, t.mensaje
  FROM transferencias t
  JOIN personas p ON p.telefono = t.de_telefono
  WHERE t.a_telefono = (SELECT telefono FROM personas WHERE lower(nombre) LIKE 'yolanda ugarte%')
    AND lower(t.mensaje) LIKE '%puesto 47%'
    AND t.momento BETWEEN datetime('2026-03-20', '-3 days')
                      AND datetime('2026-03-20', '+3 days')
  ORDER BY t.momento
  LIMIT 5;
answer: Abel Vílchez Arias
answerLabel: ¿Quién pagó por el puesto 47?
reveal: |
  **Abel Vílchez Arias**: S/ 3000 el jueves 19 por la noche, un día **antes** del traspaso, y S/ 2000 el sábado 21. Vílchez Arias, como **Tito Vílchez Arias**, el comerciante de La Victoria que le compró a Renzo el giroscopio de Wayra en el primer expediente: son hermanos. El puesto de Loop se lo vendieron a la familia que Loop destapó. Pero Yolanda solo cobró. ¿Quién hizo el traspaso?
hints:
  - "SQLite no entiende `::`: por eso el primer error. Empieza por `date(t.momento)`."
  - "`TIMESTAMP '2026-03-20' - INTERVAL '3 days'` es `datetime('2026-03-20', '-3 days')`."
```

## El juez

```exercise
id: sql18-juez-traducir
type: judge
title: Traducir a SQLite
prompt: |
  **Escribe en SQLite la misma consulta que esta de PostgreSQL, con el mismo resultado sobre cualquier tabla.**

  ```sql
  SELECT puesto,
         vence - DATE '2026-03-23' AS dias,
         (vence < DATE '2026-04-23') AS urgente
  FROM licencias
  WHERE titular ILIKE '%quispe%'
  ORDER BY dias, puesto
  FETCH FIRST 10 ROWS ONLY;
  ```

  En SQLite, `urgente` sale como `1` o `0`, y `dias` como número de días (puede ser negativo si ya venció).

  **Tabla:** `licencias(puesto, titular, vence)`, con `vence` como `'AAAA-MM-DD'`. Los nombres no tienen tildes.

  **Resultado:** `puesto`, `dias` y `urgente`, en el orden pedido.
schema: |
  CREATE TABLE licencias (puesto INTEGER, titular TEXT, vence TEXT);
ordered: true
starter: |
  SELECT puesto, vence - '2026-03-23' AS dias, vence < '2026-04-23' AS urgente
  FROM licencias
  WHERE titular LIKE '%quispe%';
solution: |
  SELECT puesto,
         julianday(vence) - julianday('2026-03-23') AS dias,
         vence < '2026-04-23' AS urgente
  FROM licencias
  WHERE lower(titular) LIKE '%quispe%'
  ORDER BY dias, puesto
  LIMIT 10;
hints:
  - "Los días entre dos fechas: `julianday(vence) - julianday('2026-03-23')`."
  - "No olvides el `ORDER BY` con desempate ni el `LIMIT 10`."
samples:
  - rows:
      licencias: [[12, "Rosa Quispe Apaza", "2026-03-31"], [47, "Carmen Rios", "2026-04-30"], [8, "QUISPE MAMANI JUAN", "2026-03-20"], [30, "Elena Huaman Quispe", "2026-03-31"]]
    note: "Los tres Quispe, del que vence antes al que vence después; el 8 ya venció hace 3 días. Empatan 12 y 30: primero el 12."
edge:
  - rows: { licencias: [] }
    tag: con la tabla vacía
  - rows: { licencias: [[1, "Ana Quispe", "2026-04-23"], [2, "Ana Quispe", "2026-04-22"]] }
    tag: justo en el límite de urgente
  - rows: { licencias: [[1, "q quispe", "2027-03-23"], [2, "Q QUISPE", "2025-03-23"], [3, "Quispe", "2026-03-23"], [4, "QuIsPe", "2026-03-24"], [5, "quispe", "2026-03-25"], [6, "quispe", "2026-03-26"], [7, "quispe", "2026-03-27"], [8, "quispe", "2026-03-28"], [9, "quispe", "2026-03-29"], [10, "quispe", "2026-03-30"], [11, "quispe", "2026-03-31"], [12, "quispe", "2026-04-01"]] }
    tag: con más de diez resultados
random:
  count: 40
  seed: 1818
  generate: |
    const names = ["Rosa Quispe", "QUISPE JUAN", "Carmen Rios", "Elena Huaman", "Luis quispe", "Kike Mamani", "Quispe Apaza Nelly"];
    const n = rng.int(0, 16);
    const rows = [];
    for (let i = 0; i < n; i++) rows.push([rng.int(1, 120), rng.pick(names), `2026-0${rng.int(2, 6)}-${String(rng.int(1, 28)).padStart(2, "0")}`]);
    return { licencias: rows };
wrong:
  - |
    SELECT puesto, vence - '2026-03-23' AS dias, vence < '2026-04-23' AS urgente
    FROM licencias WHERE lower(titular) LIKE '%quispe%' ORDER BY dias, puesto LIMIT 10;
  - |
    SELECT puesto, julianday(vence) - julianday('2026-03-23') AS dias, vence < '2026-04-23' AS urgente
    FROM licencias WHERE lower(titular) LIKE '%quispe%' ORDER BY dias LIMIT 10;
  - |
    SELECT puesto, julianday(vence) - julianday('2026-03-23') AS dias, vence <= '2026-04-23' AS urgente
    FROM licencias WHERE lower(titular) LIKE '%quispe%' ORDER BY dias, puesto LIMIT 10;
  - |
    SELECT puesto, julianday(vence) - julianday('2026-03-23') AS dias, vence < '2026-04-23' AS urgente
    FROM licencias WHERE lower(titular) LIKE '%quispe%' ORDER BY dias, puesto;
```

## Misión final

```exercise
id: sql18-mision-final
type: mission
title: El expediente final
prompt: |
  **Para cada persona con cuenta en la app del padrón, muestra su `nombre`; si estaba dentro del mercado a las 18:52:40 del viernes 20 (`en_el_mercado`: 1 si su última pasada de tarjeta de ese día hasta ese segundo fue una entrada, 0 si no); cuántos soles le transfirió Yolanda (`de_yolanda`, 0 si nada) y cuántas llamadas hubo entre los dos (`llamadas`, en cualquier dirección).** Ordena por nombre. Luego nombra a quien hizo los traspasos.

  La consulta cruza tres expedientes: `bitacora` y `usuarios` (este caso), `ingresos_mercado` y `llamadas` (las tablas del giroscopio de Wayra) y `transferencias` (la red de los pagos). Y la Contraloría la va a correr en PostgreSQL: escríbela **portable** (`CASE` en lugar de booleanos, `COALESCE`, sin funciones exclusivas de SQLite ni comillas dobles).
visual:
  - escenario:
      case: taller
  - figure:
      title: Tres preguntas por persona
      panes:
        - cards:
            - title: ¿Estaba ahí?
              rows: [["Tabla", "ingresos_mercado"], ["Última pasada", "hasta 18:52:40"]]
            - title: ¿Cobró?
              rows: [["Tabla", "transferencias"], ["De", "el celular de Yolanda"]]
            - title: ¿Hablaron?
              rows: [["Tabla", "llamadas"], ["Con", "el celular de Yolanda"]]
  - esquema:
      tables: [usuarios, personas, ingresos_mercado, transferencias, llamadas]
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
  SELECT u.login, p.nombre, p.telefono
  FROM usuarios u
  JOIN personas p ON p.id = u.persona_id;
solution: |
  WITH yolanda AS (
    SELECT telefono FROM personas WHERE nombre = 'Yolanda Ugarte Montes'
  ),
  equipo AS (
    SELECT p.id, p.nombre, p.telefono
    FROM usuarios u
    JOIN personas p ON p.id = u.persona_id
  )
  SELECT e.nombre,
         CASE WHEN (SELECT i.sentido
                    FROM ingresos_mercado i
                    WHERE i.persona_id = e.id
                      AND i.momento BETWEEN '2026-03-20 00:00:00' AND '2026-03-20 18:52:40'
                    ORDER BY i.momento DESC
                    LIMIT 1) = 'entrada' THEN 1 ELSE 0 END AS en_el_mercado,
         COALESCE((SELECT SUM(t.monto)
                   FROM transferencias t
                   WHERE t.de_telefono = (SELECT telefono FROM yolanda)
                     AND t.a_telefono = e.telefono), 0) AS de_yolanda,
         (SELECT COUNT(*)
          FROM llamadas l
          WHERE (l.origen = e.telefono AND l.destino = (SELECT telefono FROM yolanda))
             OR (l.destino = e.telefono AND l.origen = (SELECT telefono FROM yolanda))) AS llamadas
  FROM equipo e
  ORDER BY e.nombre;
answer: Alfredo Benavides Tello
answerLabel: ¿Quién hizo los traspasos?
reveal: |
  **Alfredo Benavides Tello.** Salió por la Puerta 1 a las **18:28**, como dijo… y **volvió a entrar por la Puerta 2 a las 18:41**. Cuatro minutos después, su sesión abrió la ficha del puesto 47; a las 18:52:40 la escribió con Yolanda de titular, y a las **18:53** la llamó. Delia había salido a las 18:20 y no volvió: su celular en la planilla lo puso Alfredo para desviar la mirada. Yolanda cobró **S/ 11 500** por los cuatro puestos (S/ 5000 de Abel Vílchez por el 47) y le pasó **S/ 7500** a Alfredo, disfrazados de "cuota de la junta" y "préstamo".

  Edith suspende a Alfredo, la Contraloría lleva el caso a la fiscalía y el puesto 47 vuelve a nombre de Carmen, con su renovación hasta 2027. El padrón nuevo, en PostgreSQL, tiene claves foráneas, `CHECK`, una auditoría con triggers y escrituras que no pisan a nadie.

  **Los cinco expedientes de Lima están cerrados.** Empezaste con un `SELECT *` sobre una tabla de denuncias; terminas leyendo planes, escribiendo transacciones, diseñando tablas y portando consultas entre motores. Chasqui apaga la laptop: «Ya no te hace falta que busque yo».
hints:
  - "Arma dos CTE: `yolanda` (su teléfono) y `equipo` (las personas de `usuarios`). Luego, una subconsulta correlacionada por pregunta."
  - "La última pasada: `SELECT i.sentido FROM ingresos_mercado i WHERE i.persona_id = e.id AND i.momento BETWEEN '2026-03-20 00:00:00' AND '2026-03-20 18:52:40' ORDER BY i.momento DESC LIMIT 1`, comparada con `'entrada'` dentro de un `CASE`."
tests:
  - name: las cuatro personas con sus tres respuestas, por nombre
    same: |
      SELECT p.nombre,
             CASE WHEN (SELECT i.sentido FROM ingresos_mercado i WHERE i.persona_id = p.id AND i.momento BETWEEN '2026-03-20 00:00:00' AND '2026-03-20 18:52:40' ORDER BY i.momento DESC LIMIT 1) = 'entrada' THEN 1 ELSE 0 END,
             COALESCE((SELECT SUM(t.monto) FROM transferencias t WHERE t.de_telefono = (SELECT telefono FROM personas WHERE nombre = 'Yolanda Ugarte Montes') AND t.a_telefono = p.telefono), 0),
             (SELECT COUNT(*) FROM llamadas l, personas y WHERE y.nombre = 'Yolanda Ugarte Montes' AND ((l.origen = p.telefono AND l.destino = y.telefono) OR (l.destino = p.telefono AND l.origen = y.telefono)))
      FROM usuarios u JOIN personas p ON p.id = u.persona_id
      ORDER BY p.nombre
    ordered: true
  - name: columnas nombre, en_el_mercado, de_yolanda y llamadas
    columns: [nombre, en_el_mercado, de_yolanda, llamadas]
  - name: portable a PostgreSQL
    sourceNot: '\b(ifnull|iif|strftime|datetime|julianday|group_concat)\s*\(|"'
    msg: La Contraloría corre PostgreSQL. Usa CASE, COALESCE y comparaciones de texto.
```

## Reto experto

```exercise
id: sql18-reto-distinct-on
type: challenge
title: DISTINCT ON, sin DISTINCT ON
prompt: |
  **La Contraloría pide el último trámite de cada puesto: `puesto`, `tipo`, `funcionario` y `presentado`, ordenado por puesto.** En PostgreSQL lo escribieron con una extensión que solo existe ahí:

  ```sql
  SELECT DISTINCT ON (puesto) puesto, tipo, funcionario, presentado
  FROM tramites
  ORDER BY puesto, presentado DESC;
  ```

  Para quien ya programa: `DISTINCT ON` se queda con la primera fila de cada grupo según el `ORDER BY`. Escríbelo en SQL estándar, que corre en SQLite, PostgreSQL y MySQL 8.
starter: |
  SELECT puesto, tipo, funcionario, MAX(presentado)
  FROM tramites
  GROUP BY puesto;
solution: |
  SELECT puesto, tipo, funcionario, presentado
  FROM (
    SELECT puesto, tipo, funcionario, presentado,
           ROW_NUMBER() OVER (PARTITION BY puesto ORDER BY presentado DESC) AS n
    FROM tramites
  ) AS ultimos
  WHERE n = 1
  ORDER BY puesto;
hints:
  - "`ROW_NUMBER() OVER (PARTITION BY puesto ORDER BY presentado DESC)` numera los trámites de cada puesto del más nuevo al más viejo."
  - "El `GROUP BY` con `MAX` del inicio funciona en SQLite por una rareza (las columnas sueltas), pero PostgreSQL lo rechaza: `tipo` no está en el `GROUP BY`."
tests:
  - name: el último trámite de cada puesto, por puesto
    same: SELECT puesto, tipo, funcionario, presentado FROM (SELECT *, ROW_NUMBER() OVER (PARTITION BY puesto ORDER BY presentado DESC) AS n FROM tramites) WHERE n = 1 ORDER BY puesto
    ordered: true
  - name: sin la rareza de las columnas sueltas
    sourceNot: '\bMAX\s*\(\s*presentado'
    msg: Ese GROUP BY solo funciona en SQLite.
```
