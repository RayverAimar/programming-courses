# Sesión 4 — Agregar: grupos y totales

```session
case: surquillo
```

## El encargo

Martes 17 de marzo. Ya sabes que **Renzo Huamaní mintió**: su tarjeta marcó la salida a las 22:46 y la cámara vio su auto dos minutos después, no a las once y diez. Pero mentir no prueba que se llevó el giroscopio. Falta el **por qué**: un giroscopio de robot de reparto vale más de mil soles, y alguien tuvo que comprarlo.

La fiscalía le pasó a Loop dos tablas más: **`llamadas`** y **`transferencias`** (pagos de celular a celular): miles de filas cada una. Nadie las va a leer una por una. Hoy vas a **resumirlas**: contar, sumar y promediar por grupos, para que el patrón salte a la vista.

```escenario
case: surquillo
title: Lo que llevamos
caption: "Cinco pistas en el mapa: la noche del viernes ya se entiende. Lo que pasó después está en los teléfonos."
```

```expediente
title: Lo que sabemos hasta hoy
cards:
  - name: Renzo Huamaní Cárdenas
    traits: { style: short, shirt: "#5b6b7a", tool: true }
    role: Proveedor de repuestos electrónicos
    rows: [["Teléfono", "en `personas`"], ["Salió", "22:46:12, Puerta 3"], ["Su auto", "CAM-SUR-03, 22:48"]]
    quote: "Salí como a las once y diez y me fui directo a mi casa."
  - name: Chasqui
    kind: chasqui
    role: Asistente de Loop
    rows: [["Llamadas", "miles"], ["Pagos", "miles"]]
    quote: "No las voy a leer una por una. Mejor las resumimos."
```

```figura
title: "La noche del viernes 13, hora por hora"
timeline:
  - when: "Vie 19:30"
    title: "Wayra queda cargando"
    text: "Carmen la deja en el puesto 47."
    by: "sql1-caso-denuncia"
  - when: "22:41"
    title: "El giroscopio deja de responder"
    text: "La última lectura es de las 22:41:07."
    by: "sql1-caso-denuncia"
  - when: "≈ 22:45"
    title: "Marleny ve salir a alguien"
    text: "Una persona con capucha y una caja de herramientas sube a un auto blanco."
    by: "sql2-caso-entrevista"
  - when: "22:46"
    title: "Renzo pasa su tarjeta de salida"
    text: "Puerta 3. Después dirá que salió a las 23:10."
    by: "sql1-mision-salidas"
  - when: "22:48"
    title: "La cámara lee su placa"
    text: "CAM-SUR-03: b7r415, el auto de Renzo. Lucía pasa a las 23:14 y Julio a las 23:23."
    by: "sql3-mision-camara"
  - when: "22:52"
    title: "Renzo llama a Tito Vílchez"
    text: "Seis minutos después de salir."
    by: "sql4-caso-llamadas"
    now: true
  - when: "Sáb 14 y dom 15"
    title: "Tito le paga a Renzo"
    text: "Tres pagos que suman S/ 1350."
    by: "sql4-mision-culpable"
    now: true
```

## Lo mínimo

Hasta ahora cada consulta devolvía **filas**: una por cada fila que pasaba el `WHERE`. Una **función de agregación** hace otra cosa: recorre muchas filas y devuelve **un solo valor**. `COUNT(*)` cuenta filas, `SUM` suma, `AVG` promedia, `MIN` y `MAX` se quedan con el menor y el mayor.

```sql run
SELECT COUNT(*) AS filas,
       COUNT(telefono) AS con_telefono,
       COUNT(distrito) AS con_distrito,
       COUNT(DISTINCT distrito) AS distritos
FROM personas;
```

Tres conteos distintos sobre la misma tabla: `COUNT(*)` cuenta **filas**, `COUNT(columna)` cuenta los valores **que no son `NULL`** y `COUNT(DISTINCT columna)` cuenta los valores **distintos**, también sin `NULL`. Compara los tres primeros: la diferencia entre `filas` y `con_telefono` son las personas sin teléfono registrado.

### Por dentro: cada función guarda una cuenta

El motor no junta todas las filas en memoria para después calcular. Cada agregado es un **acumulador**: empieza vacío, mira las filas de una en una y actualiza un par de números. Al final entrega el resultado.

| función | qué guarda mientras recorre (y qué entrega) | sin filas o todo `NULL` |
|---|---|---|
| `COUNT(*)` | un contador, +1 por fila | `0` |
| `COUNT(col)` | un contador, +1 si `col` no es `NULL` | `0` |
| `SUM(col)` | la suma de los que no son `NULL` | `NULL` |
| `TOTAL(col)` | lo mismo, siempre como REAL | `0.0` |
| `AVG(col)` | **dos** números, la suma y cuántos sumó; al final divide | `NULL` |
| `MIN` / `MAX` | el menor (o mayor) visto hasta ahora | `NULL` |

Por eso `AVG` **ignora** los `NULL`: no los suma ni los cuenta. Si tres pagos valen 100, 200 y `NULL`, el promedio es 150, no 100.

### GROUP BY: un acumulador por grupo

**`GROUP BY columna`** reparte las filas en **grupos**, uno por cada valor distinto de esa columna, y corre los acumuladores **dentro de cada grupo**. El resultado tiene una fila por grupo. Dale a ▶ y mira cómo cae cada pago en su balde:

```grupos
title: Cada fila cae en el balde de su grupo
query: |
  SELECT a_telefono, COUNT(*), COUNT(mensaje), SUM(monto), AVG(monto)
  FROM transferencias
  GROUP BY a_telefono;
table:
  name: transferencias
  cols: [id, a_telefono, monto, mensaje]
  rows:
    - [1, "945534612", 80, "parlante"]
    - [2, "984486562", 450, "repuesto"]
    - [3, "938599037", 120, "celular usado"]
    - [4, "984486562", 500, null]
    - [5, "984486562", 400, "lo que faltaba"]
    - [6, "938599037", 60, null]
by: a_telefono
agg:
  - { fn: count }
  - { fn: count, col: mensaje }
  - { fn: sum, col: monto }
  - { fn: avg, col: monto }
caption: "Seis pagos, tres teléfonos que reciben. `COUNT(mensaje)` se salta los `NULL`; `AVG` guarda la suma y cuántos sumó, y divide recién al final."
```

Se puede agrupar por una **expresión**, no solo por una columna. `date(inicio)` convierte cada momento en su día, así que esto da una fila por día:

```sql run
SELECT date(inicio) AS dia,
       COUNT(*) AS llamadas,
       SUM(duracion_s) / 60 AS minutos
FROM llamadas
WHERE inicio BETWEEN '2026-03-12' AND '2026-03-15'
GROUP BY date(inicio)
ORDER BY dia;
```

Y por **varias** columnas: `GROUP BY de_telefono, a_telefono` hace un grupo por cada **par** de teléfonos.

### HAVING: filtrar grupos, no filas

`WHERE` decide qué **filas** entran a los grupos; corre antes de agrupar, así que todavía no hay sumas ni conteos que mirar. Para quedarte solo con algunos **grupos** según su suma o su conteo, usa **`HAVING`**, que corre después de `GROUP BY`. Mira el orden de ejecución con los dos filtros:

```orden
title: WHERE tacha filas, HAVING tacha grupos
query: |
  SELECT a_telefono, COUNT(*) AS pagos, SUM(monto) AS total
  FROM transferencias
  WHERE momento >= '2026-03-14'
  GROUP BY a_telefono
  HAVING SUM(monto) > 300
  ORDER BY total DESC;
tables:
  transferencias:
    cols: [id, a_telefono, monto, momento]
    rows:
      - [1, "945534612", 80, "2026-03-11 12:00"]
      - [2, "984486562", 450, "2026-03-14 11:05"]
      - [3, "938599037", 120, "2026-03-14 16:22"]
      - [4, "984486562", 500, "2026-03-14 18:40"]
      - [5, "945534612", 350, "2026-03-13 09:30"]
      - [6, "984486562", 400, "2026-03-15 09:12"]
      - [7, "938599037", 60, "2026-03-16 10:47"]
      - [8, "945534612", 210, "2026-03-15 20:05"]
      - [9, "945534612", 150, "2026-03-16 08:40"]
caption: "`WHERE` saca los pagos de antes del sábado 14. `GROUP BY` arma tres grupos. `HAVING` tacha el que no llega a S/ 300. Recién entonces `SELECT` calcula las columnas y `ORDER BY` ordena por el alias `total`."
```

Fíjate en el pago 5: S/ 350 al 945534612. `WHERE` lo saca **antes** de sumar, así que ese teléfono llega a `HAVING` con 360 y no con 710. Poner una condición en `WHERE` o en `HAVING` no es lo mismo.

### group_concat: juntar textos

`group_concat(col, separador)` es el agregado de los textos: pega los valores de cada grupo en uno solo. Sirve para **ver** qué hay dentro de cada grupo sin perder el resumen:

```sql run
SELECT camara_id,
       COUNT(*) AS lecturas,
       group_concat(placa, ', ') AS placas
FROM avistamientos
WHERE momento_utc BETWEEN '2026-03-14 03:40' AND '2026-03-14 04:30'
GROUP BY camara_id
ORDER BY lecturas DESC
LIMIT 4;
```

> **Trampa común:** en una consulta con `GROUP BY`, cada columna del `SELECT` debe estar en el `GROUP BY` o dentro de un agregado. `SELECT a_telefono, momento, COUNT(*) … GROUP BY a_telefono` no tiene sentido: un grupo tiene varios momentos, ¿cuál mostrar? PostgreSQL da error. **SQLite no**: devuelve el `momento` de **alguna** fila del grupo, sin avisar cuál. Esa "columna suelta" parece un dato y es casi al azar. La única excepción documentada: con un solo `MIN` o `MAX`, las columnas sueltas salen de la fila que tiene ese mínimo o máximo.

<!-- legacy: group-by-bare -->

<!-- legacy: group-concat -->

<!-- mdn: group-by-bare group-concat -->

## Práctica

```exercise
id: sql4-predice-conteos
type: predict
title: Tres maneras de contar
prompt: |
  El teléfono 959893795 hizo seis pagos en marzo; dos no tienen mensaje y tres fueron al mismo número. ¿Qué devuelve?
code: |
  SELECT COUNT(*), COUNT(mensaje), COUNT(DISTINCT a_telefono)
  FROM transferencias
  WHERE de_telefono = '959893795';
options:
  - "6 | 4 | 4"
  - "6 | 6 | 6"
  - "6 | 4 | 6"
  - "4 | 4 | 4"
answer: "6 | 4 | 4"
explain: |
  `COUNT(*)` cuenta las seis filas. `COUNT(mensaje)` se salta los dos `NULL`: 4. `COUNT(DISTINCT a_telefono)` cuenta números distintos: tres pagos van al mismo, así que son 4 destinos.
```

```exercise
id: sql4-predice-vacio
type: predict
title: Agregar nada
prompt: |
  Ningún pago supera los S/ 5000. ¿Qué devuelve?
code: |
  SELECT COUNT(*), SUM(monto), TOTAL(monto), AVG(monto)
  FROM transferencias
  WHERE monto > 5000;
options:
  - "0 | NULL | 0.0 | NULL"
  - "0 | 0 | 0 | 0"
  - "NULL | NULL | NULL | NULL"
  - "0 | 0 | 0.0 | NULL"
answer: "0 | NULL | 0.0 | NULL"
explain: |
  Sin filas, el contador queda en 0. `SUM` y `AVG` no vieron ningún valor y responden "no sé": `NULL`. `TOTAL` es la versión de SQLite que devuelve `0.0` en ese caso, útil cuando una suma vacía debe valer cero. Fíjate también en que, sin `GROUP BY`, un agregado **siempre** devuelve una fila, aunque no haya datos.
```

```exercise
id: sql4-predice-suelta
type: predict
title: La columna suelta
prompt: |
  `a_telefono` no está en ningún `GROUP BY` ni dentro de un agregado. ¿Qué hace SQLite?
code: |
  SELECT a_telefono, MAX(monto)
  FROM transferencias
  WHERE de_telefono = '959893795';
options:
  - "984486562 | 500.0"
  - "945534612 | 500.0"
  - "984486562 | 1350.0"
  - "Error: a_telefono debe estar en GROUP BY"
answer: "984486562 | 500.0"
explain: |
  Sin `GROUP BY`, todas las filas forman un solo grupo y sale una fila. SQLite acepta la columna suelta y, como hay un solo `MAX`, la toma de la fila del máximo: el pago de S/ 500 fue al 984486562. Con `SUM` o `AVG` en lugar de `MAX`, saldría el teléfono de una fila cualquiera. PostgreSQL rechazaría la consulta.
```

```exercise
id: sql4-completa-puertas
type: complete
title: Las tres puertas del viernes
prompt: |
  Cuenta cuántas veces se pasó tarjeta en **cada puerta** el viernes 13. Muestra `puerta` y la cantidad como `pasadas`, ordenado por puerta. Reemplaza los `___`.
starter: |
  SELECT puerta, ___ AS pasadas
  FROM ingresos_mercado
  WHERE date(momento) = '2026-03-13'
  ___ puerta
  ORDER BY puerta;
solution: |
  SELECT puerta, COUNT(*) AS pasadas
  FROM ingresos_mercado
  WHERE date(momento) = '2026-03-13'
  GROUP BY puerta
  ORDER BY puerta;
hints:
  - Contar filas es `COUNT(*)`; una fila por puerta pide agrupar por puerta.
tests:
  - name: pasadas por puerta el viernes, en orden
    same: SELECT puerta, COUNT(*) FROM ingresos_mercado WHERE momento >= '2026-03-13' AND momento < '2026-03-14' GROUP BY puerta ORDER BY puerta
    ordered: true
  - name: las columnas se llaman puerta y pasadas
    columns: [puerta, pasadas]
```

```exercise
id: sql4-arregla-having
type: fix
title: Los teléfonos que más reciben
prompt: |
  Esta consulta quiere los teléfonos que recibieron **15 pagos o más** en marzo, de más a menos pagos (y por número si empatan). Pero SQLite responde con un error. Léelo, piensa en qué momento corre cada parte y arréglala.
visual:
  figure:
    title: Cuándo corre cada filtro
    panes:
      - label: WHERE
        value: "fila por fila, antes de agrupar: todavía no hay COUNT"
      - label: HAVING
        value: "grupo por grupo, después de GROUP BY: ya hay COUNT"
starter: |
  SELECT a_telefono, COUNT(*) AS recibidos
  FROM transferencias
  WHERE COUNT(*) >= 15
  GROUP BY a_telefono
  ORDER BY recibidos DESC, a_telefono;
solution: |
  SELECT a_telefono, COUNT(*) AS recibidos
  FROM transferencias
  GROUP BY a_telefono
  HAVING COUNT(*) >= 15
  ORDER BY recibidos DESC, a_telefono;
hints:
  - "`WHERE` mira filas sueltas, y una fila no tiene `COUNT`. La condición sobre el grupo va en `HAVING`, después del `GROUP BY`."
tests:
  - name: los teléfonos con 15 pagos o más, en orden
    same: SELECT a_telefono, COUNT(*) FROM transferencias GROUP BY a_telefono HAVING COUNT(*) >= 15 ORDER BY 2 DESC, 1
    ordered: true
  - name: usa HAVING
    source: '\bHAVING\b'
```

```exercise
id: sql4-escribe-dias
type: write
title: Tres días de llamadas
prompt: |
  Para el **jueves 12, el viernes 13 y el sábado 14 de marzo**, muestra una fila por día con el día como `dia`, cuántas llamadas hubo como `llamadas` y cuántas de ellas **no se contestaron** (duración 0) como `perdidas`. Ordena por día.
starter: |
  SELECT inicio, duracion_s
  FROM llamadas
  WHERE inicio BETWEEN '2026-03-12' AND '2026-03-15'
  ORDER BY inicio;
solution: |
  SELECT date(inicio) AS dia,
         COUNT(*) AS llamadas,
         SUM(CASE WHEN duracion_s = 0 THEN 1 ELSE 0 END) AS perdidas
  FROM llamadas
  WHERE date(inicio) BETWEEN '2026-03-12' AND '2026-03-14'
  GROUP BY date(inicio)
  ORDER BY dia;
hints:
  - "Agrupa por `date(inicio)`: así todas las llamadas del mismo día caen en el mismo grupo."
  - "Para contar solo algunas filas del grupo, suma un 1 por cada una que cumpla: `SUM(CASE WHEN duracion_s = 0 THEN 1 ELSE 0 END)`."
tests:
  - name: una fila por día, con llamadas y perdidas
    same: SELECT date(inicio), COUNT(*), SUM(duracion_s = 0) FROM llamadas WHERE inicio >= '2026-03-12' AND inicio < '2026-03-15' GROUP BY 1 ORDER BY 1
    ordered: true
  - name: las columnas se llaman dia, llamadas y perdidas
    columns: [dia, llamadas, perdidas]
  - name: agrupa con GROUP BY
    source: '\bGROUP\s+BY\b'
```

```exercise
id: sql4-escribe-recorrido
type: write
title: El recorrido de cada uno
prompt: |
  Para cada una de las cinco personas que salieron por la Puerta 3 el viernes (731, 905, 1046, 412 y 377), muestra su `persona_id`, cuántas veces pasó la tarjeta ese día como `pasadas` y **todas sus horas en una sola columna**, unidas con `' → '`, como `recorrido` (por ejemplo `21:58:03 → 22:46:12`). Ordena por `persona_id`.
starter: |
  SELECT persona_id, momento
  FROM ingresos_mercado
  WHERE persona_id IN (731, 905, 1046, 412, 377)
  ORDER BY persona_id, momento;
solution: |
  SELECT persona_id,
         COUNT(*) AS pasadas,
         group_concat(time(momento), ' → ') AS recorrido
  FROM ingresos_mercado
  WHERE persona_id IN (731, 905, 1046, 412, 377)
    AND date(momento) = '2026-03-13'
  GROUP BY persona_id
  ORDER BY persona_id;
hints:
  - "`time(momento)` da solo la hora; `group_concat(…, ' → ')` las junta dentro de cada grupo."
  - No olvides quedarte con el viernes 13 antes de agrupar.
tests:
  - name: pasadas y recorrido de los cinco
    same: SELECT persona_id, COUNT(*), group_concat(time(momento), ' → ') FROM ingresos_mercado WHERE persona_id IN (731, 905, 1046, 412, 377) AND date(momento) = '2026-03-13' GROUP BY persona_id ORDER BY persona_id
    ordered: true
  - name: las columnas se llaman persona_id, pasadas y recorrido
    columns: [persona_id, pasadas, recorrido]
```

## El caso

```exercise
id: sql4-caso-llamadas
type: case
title: Con quién hablaba Renzo
prompt: |
  **¿Con quién habló más veces Renzo entre el jueves 12 y el sábado 14 de marzo?** Escribe el nombre completo.

  En `llamadas` Renzo puede estar en `origen` (él llamó) o en `destino` (lo llamaron). Necesitas tres pasos: el teléfono de Renzo (id 731) en `personas`; sus llamadas de esos tres días agrupadas por **el otro número**, contadas y ordenadas de más a menos; y el nombre del dueño del número que gana.

  Ojo: en todo marzo, Renzo habla mucho con otra persona. La pregunta es solo por esos tres días.
visual:
  - escenario:
      case: surquillo
  - esquema:
      tables: [personas, llamadas]
starter: |
  -- Paso 1: el teléfono de Renzo
  SELECT nombre, telefono
  FROM personas
  WHERE id = 731;

  -- Paso 2: sus llamadas del 12 al 14, agrupadas por el otro número
  -- Paso 3: de quién es el número que más se repite
solution: |
  SELECT telefono FROM personas WHERE id = 731;

  SELECT CASE WHEN origen = '984486562' THEN destino ELSE origen END AS otro,
         COUNT(*) AS llamadas,
         SUM(duracion_s) AS segundos
  FROM llamadas
  WHERE (origen = '984486562' OR destino = '984486562')
    AND date(inicio) BETWEEN '2026-03-12' AND '2026-03-14'
  GROUP BY otro
  ORDER BY llamadas DESC;

  SELECT nombre FROM personas WHERE telefono = '959893795';
answer: Tito Vílchez Arias
answerLabel: ¿Con quién habló más? (nombre completo)
reveal: |
  **Tito Vílchez Arias**, comerciante de La Victoria: **cuatro llamadas** en tres días. Ninguna otra persona pasa de una. Y una de ellas es a las **22:52 del viernes**, seis minutos después de que Renzo saliera por la Puerta 3. En todo el mes, la que más habla con Renzo es Teresa Lozano, una electricista de Surquillo: sin el filtro de fechas, el grupo equivocado gana.
hints:
  - "El otro número es `destino` cuando Renzo llamó y `origen` cuando lo llamaron: `CASE WHEN origen = '984486562' THEN destino ELSE origen END`. Agrupa por esa expresión (o por su alias)."
  - "Pon los paréntesis: `(origen = '…' OR destino = '…') AND date(inicio) BETWEEN '2026-03-12' AND '2026-03-14'`. Sin ellos, `AND` va primero y se cuelan llamadas de otros días."
```

## El juez

```exercise
id: sql4-juez-ventas
type: judge
title: Las ventas de cada día
prompt: |
  **Para cada puesto y cada día, devuelve el puesto, el día, cuántas ventas hubo y cuánto sumaron; solo los días en que el puesto llegó a S/ 100 o más; ordenado por día y luego por puesto.**

  La asociación de comerciantes quiere saber qué puestos tienen días buenos. Cada venta tiene su momento; a veces la caja no registró el monto (`NULL`): esa venta **cuenta** como venta, pero no suma.

  **Tabla:** `ventas(puesto, momento, monto)`, con `momento` como `'AAAA-MM-DD HH:MM:SS'`.

  **Resultado:** `puesto`, el día (`'AAAA-MM-DD'`), la cantidad de ventas y la suma de los montos, en ese orden.
schema: |
  CREATE TABLE ventas (puesto INTEGER, momento TEXT, monto REAL);
ordered: true
starter: |
  SELECT puesto, momento, monto
  FROM ventas
  ORDER BY momento;
solution: |
  SELECT puesto,
         date(momento) AS dia,
         COUNT(*) AS ventas,
         SUM(monto) AS total
  FROM ventas
  GROUP BY puesto, date(momento)
  HAVING SUM(monto) >= 100
  ORDER BY dia, puesto;
hints:
  - "Un grupo por puesto y por día: `GROUP BY puesto, date(momento)`."
  - "La condición es sobre la suma del grupo, así que va en `HAVING`. Y `COUNT(*)` cuenta también las ventas sin monto; `COUNT(monto)` no."
samples:
  - rows:
      ventas: [[47, "2026-03-13 08:15:00", 60], [12, "2026-03-13 09:02:00", 35], [47, "2026-03-13 17:40:00", 45], [12, "2026-03-13 18:30:00", 20]]
    note: "El puesto 47 suma 105 el viernes y entra; el 12 suma 55 y queda fuera."
  - rows:
      ventas: [[12, "2026-03-14 07:30:00", 80], [12, "2026-03-14 11:00:00", null], [12, "2026-03-14 19:10:00", 20], [3, "2026-03-13 10:00:00", 150]]
    note: "La venta sin monto cuenta (3 ventas) pero no suma (100). Exactamente 100 también entra."
edge:
  - rows: { ventas: [] }
    tag: sin ventas
  - rows: { ventas: [[58, "2026-03-15 09:00:00", null], [58, "2026-03-15 10:00:00", null]] }
    tag: un día en que la caja no registró ningún monto
  - rows: { ventas: [[47, "2026-03-13 23:59:59", 70], [47, "2026-03-14 00:00:00", 70], [47, "2026-03-14 00:30:00", 40]] }
    tag: ventas alrededor de la medianoche
random:
  count: 40
  seed: 404
  generate: |
    const two = (x) => String(x).padStart(2, "0");
    const n = rng.int(0, 24);
    const rows = [];
    for (let i = 0; i < n; i++) {
      const monto = rng.chance(0.12) ? null : rng.pick([rng.int(5, 60), rng.int(5, 60) + 0.5, 100, 50]);
      rows.push([rng.pick([3, 12, 47, 58]), `2026-03-${two(rng.int(12, 14))} ${two(rng.int(6, 23))}:${two(rng.int(0, 59))}:00`, monto]);
    }
    return { ventas: rows };
wrong:
  - |
    SELECT puesto, date(momento) AS dia, COUNT(*), SUM(monto) FROM ventas WHERE monto >= 100 GROUP BY puesto, date(momento) ORDER BY dia, puesto;
  - |
    SELECT puesto, date(momento) AS dia, COUNT(monto), SUM(monto) FROM ventas GROUP BY puesto, date(momento) HAVING SUM(monto) >= 100 ORDER BY dia, puesto;
  - |
    SELECT puesto, date(momento) AS dia, COUNT(*), SUM(monto) FROM ventas GROUP BY puesto, date(momento) HAVING SUM(monto) > 100 ORDER BY dia, puesto;
  - |
    SELECT puesto, date(momento) AS dia, COUNT(*), SUM(monto) FROM ventas GROUP BY puesto, momento HAVING SUM(monto) >= 100 ORDER BY dia, puesto;
  - |
    SELECT puesto, date(momento) AS dia, COUNT(*), SUM(monto) FROM ventas GROUP BY puesto HAVING SUM(monto) >= 100 ORDER BY dia, puesto;
```

## Misión final

```exercise
id: sql4-mision-culpable
type: mission
title: Seguir la plata
prompt: |
  **Encuentra los pares de teléfonos (quien paga y quien recibe) que movieron más de S/ 1000 entre el viernes 13 y el domingo 15 de marzo.** Muestra `de_telefono`, `a_telefono`, cuántos pagos hubo como `pagos` y la suma como `total`. Después di quién recibió esa plata.

  La consulta de abajo busca pagos de más de S/ 1000 en esos días y no encuentra ninguno: nadie mandó tanto de una vez. Pero varios pagos chicos entre las mismas dos personas sí pueden sumar mucho.

  Cuando la consulta lo pruebe y respondas, junto con el juez, se abre la sesión 5.
visual:
  - escenario:
      case: surquillo
  - figure:
      title: Uno por uno, o sumados
      panes:
        - label: "WHERE monto > 1000"
          value: "mira cada pago solo: ninguno pasa"
        - label: "GROUP BY par + HAVING SUM(monto) > 1000"
          value: "suma los pagos de cada par y recién compara"
  - figure:
      title: "La noche del viernes 13, hora por hora"
      timeline:
        - when: "Vie 19:30"
          title: "Wayra queda cargando"
          text: "Carmen la deja en el puesto 47."
          by: "sql1-caso-denuncia"
        - when: "22:41"
          title: "El giroscopio deja de responder"
          text: "La última lectura es de las 22:41:07."
          by: "sql1-caso-denuncia"
        - when: "≈ 22:45"
          title: "Marleny ve salir a alguien"
          text: "Una persona con capucha y una caja de herramientas sube a un auto blanco."
          by: "sql2-caso-entrevista"
        - when: "22:46"
          title: "Renzo pasa su tarjeta de salida"
          text: "Puerta 3. Después dirá que salió a las 23:10."
          by: "sql1-mision-salidas"
        - when: "22:48"
          title: "La cámara lee su placa"
          text: "CAM-SUR-03: b7r415, el auto de Renzo. Lucía pasa a las 23:14 y Julio a las 23:23."
          by: "sql3-mision-camara"
        - when: "22:52"
          title: "Renzo llama a Tito Vílchez"
          text: "Seis minutos después de salir."
          by: "sql4-caso-llamadas"
          now: true
        - when: "Sáb 14 y dom 15"
          title: "Tito le paga a Renzo"
          text: "Tres pagos que suman S/ 1350."
          by: "sql4-mision-culpable"
          now: true
starter: |
  SELECT de_telefono, a_telefono, monto, momento
  FROM transferencias
  WHERE momento BETWEEN '2026-03-13' AND '2026-03-15 23:59:59'
    AND monto > 1000;
solution: |
  SELECT de_telefono, a_telefono,
         COUNT(*) AS pagos,
         SUM(monto) AS total
  FROM transferencias
  WHERE momento BETWEEN '2026-03-13' AND '2026-03-15 23:59:59'
  GROUP BY de_telefono, a_telefono
  HAVING SUM(monto) > 1000;

  -- ¿De quién es el número que recibe?
  SELECT nombre FROM personas WHERE telefono = '984486562';
answer: Renzo Huamaní Cárdenas
answerLabel: ¿Quién recibió la plata? (nombre completo)
reveal: |
  **Renzo Huamaní Cárdenas.** Entre el viernes y el domingo, un solo par pasa los mil soles: **Tito Vílchez le pagó a Renzo S/ 1350 en tres partes**, el sábado 14 a las 11:05 ("repuesto"), ese mismo día a las 18:40 y el domingo 15 ("lo que faltaba"). Los otros pagos de Tito no llegan a S/ 200.

  Todo encaja: Renzo sabía abrir un robot, salió por la Puerta 3 a las 22:46 con una caja de herramientas, mintió sobre la hora y llamó a Tito a las 22:52. Al día siguiente cobró el precio de un giroscopio. **Caso SUR-0314 cerrado.** Wayra recuperó su giroscopio en un puesto de La Victoria.
hints:
  - "Primero los días, con `WHERE`; después un grupo por par: `GROUP BY de_telefono, a_telefono`. La condición sobre la suma va en `HAVING SUM(monto) > 1000`."
  - "¿De quién es el número que recibe? Lo buscaste en el caso, o pregúntale a `personas`."
tests:
  - name: los pares que suman más de S/ 1000
    same: SELECT de_telefono, a_telefono, COUNT(*), SUM(monto) FROM transferencias WHERE momento >= '2026-03-13' AND momento < '2026-03-16' GROUP BY de_telefono, a_telefono HAVING SUM(monto) > 1000
  - name: las columnas se llaman de_telefono, a_telefono, pagos y total
    columns: [de_telefono, a_telefono, pagos, total]
  - name: filtra los grupos con HAVING
    source: '\bHAVING\b'
```

## Reto experto

```exercise
id: sql4-reto-horas
type: challenge
title: La Puerta 3, hora por hora
prompt: |
  **Para cada hora del viernes 13 en la Puerta 3, muestra la hora (`'05'`, `'06'`…) como `hora`, cuántas veces se pasó tarjeta como `pasadas`, cuántas personas distintas como `personas`, cuántas fueron entradas como `entradas` y cuántas salidas como `salidas`.** Ordena por hora.

  Para quien ya programa: es una tabla dinámica en una sola pasada. Cuenta "solo algunas filas" sumando un `CASE` que vale 1 o 0. Y compara `pasadas` con `personas`: donde no coinciden, el lector contó una tarjeta dos veces (o alguien entró y salió en la misma hora).
starter: |
  SELECT momento, persona_id, sentido
  FROM ingresos_mercado
  WHERE puerta = 3
  ORDER BY momento;
solution: |
  SELECT strftime('%H', momento) AS hora,
         COUNT(*) AS pasadas,
         COUNT(DISTINCT persona_id) AS personas,
         SUM(CASE WHEN sentido = 'entrada' THEN 1 ELSE 0 END) AS entradas,
         SUM(CASE WHEN sentido = 'salida' THEN 1 ELSE 0 END) AS salidas
  FROM ingresos_mercado
  WHERE puerta = 3 AND date(momento) = '2026-03-13'
  GROUP BY hora
  ORDER BY hora;
hints:
  - "`strftime('%H', momento)` da la hora con dos dígitos; agrupa por eso."
  - "`COUNT(DISTINCT persona_id)` no cuenta dos veces a la misma persona; `SUM(CASE WHEN sentido = 'entrada' THEN 1 ELSE 0 END)` cuenta solo las entradas."
tests:
  - name: una fila por hora con los cinco conteos
    same: SELECT strftime('%H', momento), COUNT(*), COUNT(DISTINCT persona_id), SUM(sentido = 'entrada'), SUM(sentido = 'salida') FROM ingresos_mercado WHERE puerta = 3 AND momento >= '2026-03-13' AND momento < '2026-03-14' GROUP BY 1 ORDER BY 1
    ordered: true
  - name: columnas hora, pasadas, personas, entradas y salidas
    columns: [hora, pasadas, personas, entradas, salidas]
```
