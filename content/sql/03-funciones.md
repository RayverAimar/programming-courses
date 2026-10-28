# Sesión 3 — Funciones: textos, fechas y CASE

```session
case: surquillo
```

## El encargo

Lunes 16 de marzo. Quedan tres sospechosos: **Renzo Huamaní**, **Lucía Paredes** y **Julio Ccahuana**, y los tres dieron su declaración. Renzo dice que salió "como a las once y diez"; Lucía, "pasadas las once"; Julio, "cerca de las once y media". Marleny vio el auto blanco como a las **22:45**.

Frente a la Puerta 3 hay una cámara de la municipalidad, la **CAM-SUR-03**, que lee las placas de los autos que pasan. El problema: sus datos están sucios. La cámara escribe las placas como las lee (`b7r415`, `D9K 731`, `C3M-208`) y guarda la hora **en UTC**, la hora de Greenwich, que va cinco horas adelante de Lima. Para cruzar esos datos con los de la Puerta 3 vas a tener que **transformarlos** dentro de la consulta: eso hacen las funciones.

```escenario
case: surquillo
title: La cámara frente a la Puerta 3
caption: "La CAM-SUR-03 mira hacia el Jr. Narciso de la Colina, por donde salen los autos de la Puerta 3."
```

```expediente
title: Lo que dicen los tres
cards:
  - name: Renzo Huamaní Cárdenas
    traits: { style: short, shirt: "#5b6b7a", tool: true }
    role: Proveedor de repuestos electrónicos
    rows: [["Auto", "Toyota Yaris blanco, B7R-415"]]
    quote: "Salí como a las once y diez y me fui directo a mi casa."
  - name: Lucía Paredes Soto
    traits: { style: long, shirt: "#e07a5f" }
    role: Juguería, puesto 12
    rows: [["Auto", "Kia Rio blanco, C3M-208"]]
    quote: "Me quedé haciendo inventario y salí pasadas las once."
  - name: Julio Ccahuana Ríos
    traits: { style: curly, shirt: "#c49a3f", beard: true }
    role: Proveedor de fruta
    rows: [["Auto", "Nissan Versa, D9K-731, color sin registrar"]]
    quote: "Salí cerca de las once y media, para Ate."
```

## Lo mínimo

Una **función** recibe valores y devuelve otro, fila por fila: puedes usarla en el `SELECT`, en el `WHERE` y en el `ORDER BY`. Hoy, tres familias.

**Textos.** `upper` y `lower` cambian mayúsculas (solo letras sin tilde), `trim` quita espacios de los extremos, `replace(t, 'a', 'b')` cambia cada `a` por `b`, `substr(t, inicio, largo)` corta un pedazo (se cuenta desde 1), `length` cuenta caracteres e `instr(t, 'x')` dice dónde aparece algo. `||` pega textos: `'B7R' || '-' || '415'`.

```esquema
tables: [avistamientos, camaras]
caption: "`avistamientos` guarda cada lectura de placa; `camara_id` dice qué cámara fue (la 3 es la CAM-SUR-03, frente a la Puerta 3)."
```

```sql run
SELECT placa,
       upper(replace(replace(placa, ' ', ''), '-', '')) AS limpia
FROM avistamientos
WHERE camara_id = 3
  AND placa LIKE '%7%'
ORDER BY id
LIMIT 6;
```

Las funciones se anidan como en matemáticas: primero quita los espacios, luego los guiones y al final pasa a mayúsculas. Ahora `b7r415`, `B7R-415` y `b7r 415` dan lo mismo: `B7R415`.

**Fechas y horas.** SQLite no tiene un tipo fecha: guarda texto `'AAAA-MM-DD HH:MM:SS'`, que se ordena bien, y lo calcula con `date`, `time`, `datetime` y `strftime`. Todas aceptan **modificadores** después del momento: `'-5 hours'`, `'+1 day'`, `'start of day'`. Para pasar de UTC a la hora de Lima, resta cinco horas:

```figura
title: La misma lectura, en dos relojes
input: { label: "momento_utc (lo que guarda la cámara)", value: "2026-03-14 03:48:31" }
arrow: "datetime(momento_utc, '-5 hours')"
output: { label: "Hora de Lima", value: "2026-03-13 22:48:31" }
steps:
  - "Lima está en UTC−5 todo el año (el Perú no cambia la hora en verano)."
  - "Ojo con la fecha: las 03:48 del sábado en UTC son las 22:48 del **viernes** en Lima."
```

`strftime('%H', m)` da solo la hora, `'%w'` el día de la semana (0 es domingo) y `julianday(a) - julianday(b)` la diferencia en días entre dos momentos (multiplica por 24 × 60 para tener minutos).

**Decidir y rellenar.** `CASE WHEN condición THEN valor … ELSE otro END` elige un valor según la fila. `COALESCE(a, b, …)` devuelve el primero que no sea `NULL`: `COALESCE(telefono, 'sin número')`. `CAST(x AS INTEGER)` convierte.

```sql run
SELECT momento,
       CASE
         WHEN time(momento) < '12:00' THEN 'mañana'
         WHEN time(momento) < '19:00' THEN 'tarde'
         ELSE 'noche'
       END AS turno
FROM ingresos_mercado
WHERE persona_id = 233
ORDER BY momento
LIMIT 4;
```

> **Trampa común:** un número guardado como texto se compara **letra por letra**: `'10' < '9'` es verdadero, porque `'1'` va antes que `'9'`. Las horas `'HH:MM'` funcionan como texto solo porque siempre tienen dos dígitos (`'09:05'`, no `'9:5'`). Si una columna mezcla números y textos, conviértela con `CAST` antes de comparar. Y si aplicas una función a la columna en el `WHERE`, como `datetime(momento_utc, '-5 hours') > …`, SQLite tiene que calcularla en **cada fila**: en la sesión 13 verás por qué eso le impide usar un índice.

<!-- legacy: dates -->

<!-- legacy: coalesce -->

<!-- legacy: case-when -->

<!-- mdn: dates coalesce case-when -->

## Práctica

```exercise
id: sql3-predice-texto
type: predict
title: Limpiar un texto
prompt: |
  ¿Qué devuelve?
code: |
  SELECT upper('b7r415'), replace('D9K 731', ' ', '-'), length('  hola ');
options:
  - "B7R415 | D9K-731 | 7"
  - "B7R415 | D9K-731 | 4"
  - "b7r415 | D9K-731 | 7"
  - "B7R-415 | D9K731 | 4"
answer: "B7R415 | D9K-731 | 7"
explain: |
  `length` cuenta **todos** los caracteres, también los espacios: dos al inicio, cuatro letras y uno al final son 7. Para no contarlos, `length(trim('  hola '))` da 4.
```

```exercise
id: sql3-predice-fecha
type: predict
title: Cinco horas atrás
prompt: |
  La cámara guardó `2026-03-14 03:48:31` en UTC. ¿Qué devuelve?
code: |
  SELECT datetime('2026-03-14 03:48:31', '-5 hours'), date('2026-03-14 03:48:31', '-5 hours');
options:
  - "2026-03-13 22:48:31 | 2026-03-13"
  - "2026-03-14 22:48:31 | 2026-03-14"
  - "2026-03-13 22:48:31 | 2026-03-14"
  - "2026-03-14 08:48:31 | 2026-03-14"
answer: "2026-03-13 22:48:31 | 2026-03-13"
explain: |
  Restar cinco horas a las 03:48 cruza la medianoche, y SQLite ajusta el día solo. `date` hace la misma cuenta pero devuelve solo la fecha.
```

```exercise
id: sql3-predice-texto-numero
type: predict
title: Diez contra nueve
prompt: |
  ¿Qué devuelve?
code: |
  SELECT '10' < '9', 10 < 9, CAST('10' AS INTEGER) < 9;
options:
  - "1 | 0 | 0"
  - "0 | 0 | 0"
  - "1 | 0 | 1"
  - "0 | 1 | 0"
answer: "1 | 0 | 0"
explain: |
  Como textos, `'10'` va antes que `'9'` porque se compara el primer carácter: `'1'` < `'9'`. Como números, 10 no es menor que 9. `CAST` convierte el texto en número y la comparación vuelve a tener sentido.
```

```exercise
id: sql3-completa-placa
type: complete
title: Placas comparables
prompt: |
  Lista el `id`, la `placa` tal como la leyó la cámara y la placa **limpia** (sin espacios ni guiones, en mayúsculas) de las 8 primeras lecturas de la cámara 3, por `id`. Reemplaza los `___`.
starter: |
  SELECT id, placa,
         ___(replace(replace(placa, ' ', ''), ___, '')) AS limpia
  FROM avistamientos
  WHERE camara_id = 3
  ORDER BY id
  LIMIT 8;
solution: |
  SELECT id, placa,
         upper(replace(replace(placa, ' ', ''), '-', '')) AS limpia
  FROM avistamientos
  WHERE camara_id = 3
  ORDER BY id
  LIMIT 8;
hints:
  - El segundo `replace` quita los guiones; la función de afuera pasa a mayúsculas.
tests:
  - name: id, placa y placa limpia de las 8 primeras
    same: SELECT id, placa, upper(replace(replace(placa, ' ', ''), '-', '')) FROM avistamientos WHERE camara_id = 3 ORDER BY id LIMIT 8
    ordered: true
```

```exercise
id: sql3-arregla-zona
type: fix
title: La ventana corrida
prompt: |
  Esta consulta busca lo que leyó la cámara 3 entre las **22:41 y las 23:30 de Lima** del viernes, pero compara las horas de Lima con `momento_utc`, que está en UTC. Por eso trae otra ventana. Arréglala para que la hora de Lima sea la que se compara y la que se muestra (como `hora_lima`), en orden.
visual:
  figure:
    title: Dos relojes
    panes:
      - label: Lima (lo que buscas)
        value: "22:41 → 23:30"
      - label: UTC (lo que guarda la cámara)
        value: "03:41 → 04:30 del día siguiente"
starter: |
  SELECT placa, momento_utc AS hora_lima
  FROM avistamientos
  WHERE camara_id = 3
    AND momento_utc BETWEEN '2026-03-13 22:41' AND '2026-03-13 23:30:59'
  ORDER BY hora_lima;
solution: |
  SELECT placa, datetime(momento_utc, '-5 hours') AS hora_lima
  FROM avistamientos
  WHERE camara_id = 3
    AND datetime(momento_utc, '-5 hours') BETWEEN '2026-03-13 22:41' AND '2026-03-13 23:30:59'
  ORDER BY hora_lima;
hints:
  - "Convierte en los dos lugares: `datetime(momento_utc, '-5 hours')`."
tests:
  - name: las lecturas de la ventana, en hora de Lima y en orden
    same: SELECT placa, datetime(momento_utc, '-5 hours') FROM avistamientos WHERE camara_id = 3 AND datetime(momento_utc, '-5 hours') BETWEEN '2026-03-13 22:41' AND '2026-03-13 23:30:59' ORDER BY 2
    ordered: true
```

```exercise
id: sql3-escribe-turnos
type: write
title: Los turnos de la Puerta 3
prompt: |
  Para cada pasada de tarjeta por la **Puerta 3 el viernes 13**, muestra el `id`, el `momento` y el **turno**: `'mañana'` antes de las 12:00, `'tarde'` antes de las 19:00 y `'noche'` desde las 19:00. Llama `turno` a esa columna y ordena por `momento` y luego `id`.
starter: |
  SELECT id, momento
  FROM ingresos_mercado
  WHERE puerta = 3
  ORDER BY momento, id;
solution: |
  SELECT id, momento,
         CASE
           WHEN time(momento) < '12:00' THEN 'mañana'
           WHEN time(momento) < '19:00' THEN 'tarde'
           ELSE 'noche'
         END AS turno
  FROM ingresos_mercado
  WHERE puerta = 3 AND date(momento) = '2026-03-13'
  ORDER BY momento, id;
hints:
  - "`date(momento) = '2026-03-13'` se queda con el viernes; `time(momento)` da solo la hora."
  - "`CASE` revisa los `WHEN` en orden y se queda con el primero que se cumple, así que el segundo no necesita repetir `>= '12:00'`."
tests:
  - name: id, momento y turno de cada pasada del viernes
    same: SELECT id, momento, CASE WHEN time(momento) < '12:00' THEN 'mañana' WHEN time(momento) < '19:00' THEN 'tarde' ELSE 'noche' END FROM ingresos_mercado WHERE puerta = 3 AND momento >= '2026-03-13' AND momento < '2026-03-14' ORDER BY momento, id
    ordered: true
  - name: la columna se llama turno
    columns: [id, momento, turno]
  - name: usa CASE
    source: '\bCASE\b'
```

```exercise
id: sql3-escribe-coalesce
type: write
title: La lista de vigilantes
prompt: |
  Arma la lista de **vigilantes de Surquillo** con su **nombre limpio** (sin espacios sobrantes a los lados) y su contacto: el teléfono o, si no tiene, el texto `'sin número'`. Llama `nombre` y `contacto` a las columnas y ordena por nombre.
starter: |
  SELECT nombre, telefono
  FROM personas
  WHERE ocupacion = 'vigilante';
solution: |
  SELECT trim(nombre) AS nombre,
         COALESCE(telefono, 'sin número') AS contacto
  FROM personas
  WHERE ocupacion = 'vigilante' AND distrito = 'Surquillo'
  ORDER BY trim(nombre);
hints:
  - Hay un nombre con un espacio al final. `trim` lo quita.
  - "`COALESCE(telefono, 'sin número')`: el teléfono, o el texto si es `NULL`."
tests:
  - name: nombres limpios y contactos, en orden
    same: SELECT trim(nombre), COALESCE(telefono, 'sin número') FROM personas WHERE ocupacion = 'vigilante' AND distrito = 'Surquillo' ORDER BY trim(nombre)
    ordered: true
  - name: las columnas se llaman nombre y contacto
    columns: [nombre, contacto]
```

## El caso

```exercise
id: sql3-caso-camara
type: case
title: El primer auto después de las 22:41
prompt: |
  **¿De quién es el primer auto que leyó la CAM-SUR-03 después de las 22:41 (hora de Lima) del viernes 13?** Escribe el nombre completo del dueño.

  La cámara 3 es la CAM-SUR-03. Necesitas tres pasos: la primera lectura de la ventana (con la hora pasada a Lima), el dueño de esa placa en `vehiculos` (con la placa limpia de los dos lados, porque la cámara la escribe a su manera) y el nombre de esa persona en `personas`. Hoy copias a mano el resultado de una consulta a la siguiente; en la sesión 5 un `JOIN` lo hace solo.
visual:
  - escenario:
      case: surquillo
  - esquema:
      tables: [avistamientos, camaras, vehiculos, personas]
starter: |
  -- Paso 1: lo que leyó la cámara 3 esa noche (¡en UTC!)
  SELECT placa, momento_utc
  FROM avistamientos
  WHERE camara_id = 3
  ORDER BY momento_utc
  LIMIT 5;
solution: |
  SELECT placa, datetime(momento_utc, '-5 hours') AS hora_lima
  FROM avistamientos
  WHERE camara_id = 3
    AND datetime(momento_utc, '-5 hours') >= '2026-03-13 22:41'
  ORDER BY hora_lima
  LIMIT 1;

  SELECT persona_id, placa, marca, modelo
  FROM vehiculos
  WHERE replace(placa, '-', '') = upper('b7r415');

  SELECT nombre FROM personas WHERE id = 731;
answer: Renzo Huamaní Cárdenas
answerLabel: ¿De quién es el auto? (nombre completo)
reveal: |
  **Renzo Huamaní Cárdenas.** La cámara leyó `b7r415` a las 03:48:31 UTC, es decir, a las **22:48** del viernes en Lima: dos minutos después de que Renzo pasara su tarjeta en la Puerta 3. Y Renzo dijo que salió a las once y diez.
hints:
  - "La primera lectura de la ventana: `WHERE camara_id = 3 AND datetime(momento_utc, '-5 hours') >= '2026-03-13 22:41' ORDER BY momento_utc LIMIT 1`."
  - "En `vehiculos` la placa tiene guion y mayúsculas: compara `replace(placa, '-', '')` con `upper('b7r415')`."
```

## El juez

```exercise
id: sql3-juez-placas
type: judge
title: Placas con formato
prompt: |
  **Devuelve, para cada lectura, su `id`, la placa con el formato oficial `AAA-999` y la hora de Lima; ordenado por la hora de Lima y luego por `id`.**

  La municipalidad quiere un reporte limpio de una cámara. La placa viene como la leyó la cámara: puede estar en minúsculas, sin guion, con un espacio en lugar del guion o con espacios a los lados. Una placa siempre tiene tres caracteres, luego tres dígitos. La hora está en UTC; Lima es UTC−5.

  **Tabla:** `lecturas(id, placa, momento_utc)`, con `momento_utc` como `'AAAA-MM-DD HH:MM:SS'`.

  **Resultado:** `id`, la placa formateada y la hora de Lima (`'AAAA-MM-DD HH:MM:SS'`), en ese orden.
schema: |
  CREATE TABLE lecturas (id INTEGER, placa TEXT, momento_utc TEXT);
ordered: true
starter: |
  SELECT id, placa, momento_utc
  FROM lecturas
  ORDER BY momento_utc;
solution: |
  SELECT id,
         substr(upper(replace(replace(trim(placa), ' ', ''), '-', '')), 1, 3) || '-' ||
         substr(upper(replace(replace(trim(placa), ' ', ''), '-', '')), 4, 3),
         datetime(momento_utc, '-5 hours') AS hora_lima
  FROM lecturas
  ORDER BY hora_lima, id;
hints:
  - "Primero limpia: `upper(replace(replace(trim(placa), ' ', ''), '-', ''))` da seis caracteres seguidos. Luego córtala con `substr(…, 1, 3)` y `substr(…, 4, 3)` y pégala con `||`."
  - Ordenar por la hora de Lima o por la de UTC da lo mismo; pero el `id` desempata.
samples:
  - rows:
      lecturas: [[1, "b7r415", "2026-03-14 03:48:31"], [2, "C3M-208", "2026-03-14 04:14:02"], [3, "D9K 731", "2026-03-14 04:23:47"]]
    note: "`b7r415` se vuelve `B7R-415`; las 03:48 UTC del sábado son las 22:48 del viernes."
  - rows:
      lecturas: [[5, " f2t664 ", "2026-03-01 00:10:00"], [4, "A4P-902", "2026-03-01 00:10:00"]]
    note: "Misma hora: sale primero el id 4. Y la medianoche UTC cae el día anterior en Lima."
edge:
  - rows: { lecturas: [] }
    tag: sin lecturas
  - rows: { lecturas: [[9, "x1y-234", "2026-01-01 04:59:59"], [8, "X1Y234", "2026-01-01 05:00:00"]] }
    tag: alrededor de la medianoche de Año Nuevo
random:
  count: 40
  seed: 303
  generate: |
    const L = "ABCDEFGHJKLMNPRSTUVWXYZ";
    const n = rng.int(0, 12);
    const rows = [];
    for (let i = 0; i < n; i++) {
      const p = `${rng.pick(L.split(""))}${rng.int(0, 9)}${rng.pick(L.split(""))}`;
      const d = String(rng.int(100, 999));
      const shape = rng.int(0, 4);
      const placa = shape === 0 ? `${p}-${d}` : shape === 1 ? `${p}${d}`.toLowerCase() : shape === 2 ? `${p} ${d}` : shape === 3 ? ` ${p.toLowerCase()}-${d} ` : `${p}${d}`;
      const two = (x) => String(x).padStart(2, "0");
      rows.push([i + 1, placa, `2026-03-${two(rng.int(1, 4))} ${two(rng.int(0, 6))}:${two(rng.pick([0, 15, 30, 45]))}:00`]);
    }
    return { lecturas: rows };
wrong:
  - |
    SELECT id, upper(replace(placa, ' ', '-')), datetime(momento_utc, '-5 hours') AS h FROM lecturas ORDER BY h, id;
  - |
    SELECT id, substr(replace(replace(placa, ' ', ''), '-', ''), 1, 3) || '-' || substr(replace(replace(placa, ' ', ''), '-', ''), 4, 3), datetime(momento_utc, '-5 hours') AS h FROM lecturas ORDER BY h, id;
  - |
    SELECT id, substr(upper(replace(replace(trim(placa), ' ', ''), '-', '')), 1, 3) || '-' || substr(upper(replace(replace(trim(placa), ' ', ''), '-', '')), 4, 3), datetime(momento_utc, '+5 hours') AS h FROM lecturas ORDER BY h, id;
  - |
    SELECT id, substr(upper(replace(replace(trim(placa), ' ', ''), '-', '')), 1, 3) || '-' || substr(upper(replace(replace(trim(placa), ' ', ''), '-', '')), 4, 3), datetime(momento_utc, '-5 hours') AS h FROM lecturas ORDER BY h;
```

## Misión final

```exercise
id: sql3-mision-camara
type: mission
title: Lo que la cámara vio
prompt: |
  **Lista las lecturas de la CAM-SUR-03 entre las 22:41 y las 23:30:59 del viernes 13 (hora de Lima) que corresponden a los autos de los tres sospechosos: B7R-415, C3M-208 y D9K-731.** Muestra la placa limpia con guion (`AAA-999`, como en `vehiculos`) como `placa` y la hora de Lima como `hora_lima`, en orden. Después di qué placa pasó primero.

  Compara con lo que vio Marleny (un auto blanco como a las 22:45) y con lo que dijo cada uno.

  Cuando la consulta lo pruebe y respondas, junto con el juez, se abre la sesión 4.
visual:
  - escenario:
      case: surquillo
  - figure:
      title: Los tres autos que buscas
      panes:
        - cards:
            - title: B7R-415
              rows: [["Dueño", "Renzo"], ["Color", "blanco"]]
            - title: C3M-208
              rows: [["Dueño", "Lucía"], ["Color", "blanco"]]
            - title: D9K-731
              rows: [["Dueño", "Julio"], ["Color", "NULL"]]
  - figure:
      title: "Lo que dijo cada uno y lo que dicen los datos"
      lanes:
        from: "22:30"
        to: "23:45"
        tick: 10
        bands: [{"from": "22:41", "to": "23:30", "label": "la ventana del caso"}]
        rows:
          - {"label": "Marleny", "sub": "vigilante", "events": [{"at": "22:45", "label": "ve un auto blanco"}]}
          - label: "Renzo"
            sub: "B7R-415"
            events:
              - {"at": "22:46", "label": "tarjeta", "side": "left"}
              - {"at": "22:48", "label": "cámara", "kind": "bad", "by": "sql3-mision-camara"}
              - {"at": "23:10", "label": "dice: salí", "kind": "said"}
          - label: "Lucía"
            sub: "C3M-208"
            events:
              - {"at": "23:05", "label": "dice: pasadas las 23", "kind": "said", "side": "left"}
              - {"at": "23:14", "label": "cámara", "kind": "ok", "by": "sql3-mision-camara"}
          - label: "Julio"
            sub: "D9K-731"
            events:
              - {"at": "23:23", "label": "cámara", "kind": "ok", "by": "sql3-mision-camara", "side": "left"}
              - {"at": "23:30", "label": "dice: ~23:30", "kind": "said", "side": "right"}
starter: |
  SELECT placa, momento_utc
  FROM avistamientos
  WHERE camara_id = 3
    AND placa IN ('B7R-415', 'C3M-208', 'D9K-731');
solution: |
  SELECT substr(upper(replace(replace(placa, ' ', ''), '-', '')), 1, 3) || '-' ||
         substr(upper(replace(replace(placa, ' ', ''), '-', '')), 4, 3) AS placa,
         datetime(momento_utc, '-5 hours') AS hora_lima
  FROM avistamientos
  WHERE camara_id = 3
    AND upper(replace(replace(placa, ' ', ''), '-', '')) IN ('B7R415', 'C3M208', 'D9K731')
    AND datetime(momento_utc, '-5 hours') BETWEEN '2026-03-13 22:41' AND '2026-03-13 23:30:59'
  ORDER BY hora_lima;
answer: B7R-415
answerLabel: ¿Qué placa pasó primero?
reveal: |
  **B7R-415, el auto de Renzo, a las 22:48.** Lucía pasó a las 23:14 y Julio a las 23:23: mucho después de lo que vio Marleny, y coincide con lo que contaron. Renzo dijo que salió a las once y diez, pero su tarjeta marcó 22:46 y la cámara lo vio dos minutos después. **Renzo mintió.** Falta saber por qué: eso, en la sesión 4.
hints:
  - "La consulta de antes no encuentra nada: con `placa IN ('B7R-415', …)` no coincide `b7r415`. Limpia la placa antes de comparar, y compara con las placas limpias: `'B7R415'`, …"
  - "Para mostrarla con guion: `substr(limpia, 1, 3) || '-' || substr(limpia, 4, 3)`."
tests:
  - name: las tres lecturas, con placa con guion y hora de Lima, en orden
    same: SELECT substr(upper(replace(replace(placa, ' ', ''), '-', '')), 1, 3) || '-' || substr(upper(replace(replace(placa, ' ', ''), '-', '')), 4, 3), datetime(momento_utc, '-5 hours') AS h FROM avistamientos WHERE camara_id = 3 AND upper(replace(replace(placa, ' ', ''), '-', '')) IN ('B7R415', 'C3M208', 'D9K731') AND h BETWEEN '2026-03-13 22:41' AND '2026-03-13 23:30:59' ORDER BY h
    ordered: true
  - name: las columnas se llaman placa y hora_lima
    columns: [placa, hora_lima]
```

## Reto experto

```exercise
id: sql3-reto-dias
type: challenge
title: Los días del auto blanco
prompt: |
  **Lista todas las veces que alguna cámara leyó la placa de Renzo (B7R-415, en cualquier formato) en marzo: el `camara_id`, la hora de Lima como `hora_lima`, el nombre del día de la semana en castellano como `dia` y los minutos que pasaron desde las 22:41:07 del viernes 13 (redondeados a entero) como `minutos`.** Ordena por la hora.

  Para quien ya programa: `strftime('%w', …)` da el día de la semana como texto de `'0'` (domingo) a `'6'` (sábado), y `julianday` permite restar momentos. Los minutos pueden ser negativos.
starter: |
  SELECT camara_id, momento_utc
  FROM avistamientos
  WHERE placa = 'B7R-415';
solution: |
  SELECT camara_id,
         datetime(momento_utc, '-5 hours') AS hora_lima,
         CASE strftime('%w', momento_utc, '-5 hours')
           WHEN '0' THEN 'domingo' WHEN '1' THEN 'lunes' WHEN '2' THEN 'martes'
           WHEN '3' THEN 'miércoles' WHEN '4' THEN 'jueves' WHEN '5' THEN 'viernes'
           ELSE 'sábado'
         END AS dia,
         CAST(round((julianday(momento_utc, '-5 hours') - julianday('2026-03-13 22:41:07')) * 24 * 60) AS INTEGER) AS minutos
  FROM avistamientos
  WHERE upper(replace(replace(placa, ' ', ''), '-', '')) = 'B7R415'
  ORDER BY hora_lima;
hints:
  - "`CASE strftime('%w', momento_utc, '-5 hours') WHEN '0' THEN 'domingo' …` es la forma corta de `CASE`, que compara un valor con cada `WHEN`."
  - "`round` devuelve un REAL (`7.0`); `CAST(… AS INTEGER)` lo deja en `7`."
tests:
  - name: las lecturas de B7R-415 con día y minutos
    same: SELECT camara_id, datetime(momento_utc, '-5 hours'), CASE strftime('%w', momento_utc, '-5 hours') WHEN '0' THEN 'domingo' WHEN '1' THEN 'lunes' WHEN '2' THEN 'martes' WHEN '3' THEN 'miércoles' WHEN '4' THEN 'jueves' WHEN '5' THEN 'viernes' ELSE 'sábado' END, CAST(round((julianday(momento_utc, '-5 hours') - julianday('2026-03-13 22:41:07')) * 24 * 60) AS INTEGER) FROM avistamientos WHERE upper(replace(replace(placa, ' ', ''), '-', '')) = 'B7R415' ORDER BY 2
    ordered: true
  - name: columnas camara_id, hora_lima, dia y minutos
    columns: [camara_id, hora_lima, dia, minutos]
```
