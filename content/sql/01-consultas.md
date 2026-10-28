# Sesión 1 — Tus primeras consultas

```session
case: surquillo
```

## El encargo

Sábado 14 de marzo de 2026, siete de la mañana. Suena el teléfono de Loop: es **Carmen Ríos**, la técnica que atiende nuestro puesto de reparaciones, el **47 del Mercado N.º 1 de Surquillo**. Anoche dejó a **Wayra**, nuestro robot de reparto, cargando en el puesto, como siempre. Hoy lo encontró apagado y **sin su giroscopio**, la pieza que le dice hacia dónde está inclinado. Sin ella, Wayra no puede ni pararse derecho.

La comisaría de Surquillo tiene poca gente y muchos casos. La municipalidad le dio a Loop acceso de lectura a su base de datos, **los expedientes de Lima**: el padrón de personas, los vehículos, las tarjetas que se pasan en las puertas del mercado, las cámaras que leen placas, las denuncias, las llamadas. Son miles de filas. **Chasqui**, el primer robot de Loop, será tu asistente; tú harás las preguntas. Y en una base de datos las preguntas se hacen en **SQL**.

```escenario
case: surquillo
title: El Mercado N.º 1 de Surquillo, de noche
caption: "Visto desde arriba: los pasillos A–F con sus puestos, las tres puertas y las cámaras de la calle. Cada pista que encuentres aparece aquí con su número."
```

```expediente
title: El equipo
cards:
  - name: Chasqui
    kind: chasqui
    role: Asistente de detective de Loop
    quote: "Yo busco en la base; tú decides qué preguntar."
  - name: Carmen Ríos Llanos
    traits: { style: bun, shirt: "#3f7cc4", glasses: true }
    role: Técnica de Loop, puesto 47
    quote: "Para sacar ese giroscopio hay que saber lo que se hace."
  - name: Wayra
    kind: robot
    traits: { broken: true }
    role: Robot de reparto, la víctima
    quote: "…"
```

## Por qué existe SQL

```goals
- Contar quién inventó SQL, cuándo y qué problema resolvía
- Comparar SQL con una hoja de cálculo, con pandas y con una base NoSQL
- Saber dónde se usa SQL hoy y por qué este curso usa SQLite
```

Antes de la primera consulta, una pregunta justa: ¿por qué hay que aprender un idioma aparte para hablar con una base de datos? La respuesta empieza en un laboratorio de IBM en California, en 1970.

### El problema de 1970

<!-- photo: ibm-system-360 -->

Una **base de datos** es un programa que guarda muchísimos datos en disco (clientes, pedidos, pagos) y te los entrega cuando los pides. A fines de los sesenta, las empresas usaban bases **jerárquicas** o **en red**, como IMS de IBM. Ahí cada dato era un **registro**, una especie de ficha, y las fichas se unían con **punteros**: dentro de la ficha de un cliente iba anotado dónde estaba su primer pedido; dentro de ese pedido, dónde estaba el siguiente, y así. Para sacar algo, un programa (casi siempre en COBOL) tenía que **navegar**, ficha por ficha:

<!-- /photo -->

```red
title: Antes de SQL, el programa iba a buscar los datos
nodes:
  - { id: prog, icon: program, label: Programa en COBOL, sub: sabe el camino de memoria }
  - { id: cli, icon: record, label: Cliente 17, sub: Bodega Rosa }
  - { id: p1, icon: record, label: Pedido 1, sub: 3 sacos de arroz }
  - { id: p2, icon: record, label: Pedido 2, sub: 10 kg de azúcar }
  - { id: p3, icon: record, label: Pedido 3, sub: 2 cajas de fideos }
links:
  - { id: go, label: busca al cliente }
  - { id: k1, label: puntero, busy: cambió }
  - { id: k2, label: puntero, busy: cambió }
  - { id: k3, label: puntero }
steps:
  - phase: "Antes: navegar"
    at: prog
    note: "La pregunta: ¿qué pedidos hizo el cliente 17? En una base jerárquica, el programa tiene que ir a buscarlos él mismo, siguiendo un camino que el programador escribió paso a paso."
    show:
      label: El camino, escrito en el programa
      text: |
        ir al cliente 17
        seguir el puntero a su primer pedido
        mientras haya pedido:
            anotarlo
            seguir el puntero al siguiente
  - move: [prog, cli]
    packet: { kind: up, label: la búsqueda del programa }
    note: Primero, encontrar la ficha del cliente.
  - move: [cli, p1]
    packet: { kind: up, label: la búsqueda del programa }
    tags: { p1: anotado }
    note: En la ficha del cliente hay un **puntero**, la dirección de su primer pedido. El programa lo sigue y anota el pedido.
  - move: [p1, p2]
    packet: { kind: up, label: la búsqueda del programa }
    tags: { p1: anotado, p2: anotado }
    note: Del pedido 1 sale otro puntero al pedido 2.
  - move: [p2, p3]
    packet: { kind: up, label: la búsqueda del programa }
    tags: { p1: anotado, p2: anotado, p3: anotado }
    note: Y así hasta el último. Funciona, pero cada pregunta nueva es un camino nuevo que alguien tiene que programar.
  - phase: El problema
    at: prog
    busy: [k1, k2]
    tags: { prog: "el camino ya no sirve" }
    note: Si alguien reorganiza cómo se guardan las fichas (por ejemplo, para que una búsqueda sea más rápida), los caminos cambian y los programas que se los sabían de memoria se rompen. Había que reescribirlos.
  - phase: "Con SQL: describir"
    at: cli
    dim: [prog]
    dimLinks: [go, k1, k2, k3]
    note: Con la idea de Codd, escribes **qué** quieres y no el camino. El motor de la base decide cómo encontrarlo, y si los datos se reorganizan, tu pregunta sigue igual.
    show:
      - label: La pregunta, en SQL
        text: |
          SELECT *
          FROM pedidos
          WHERE cliente_id = 17;
      - label: La respuesta, una tabla
        table:
          head: [id, cliente_id, producto]
          rows: [["1", "17", "3 sacos de arroz"], ["2", "17", "10 kg de azúcar"], ["3", "17", "2 cajas de fideos"]]
```

El programa sabía el camino de memoria, y si el camino cambiaba, los programas se rompían.

<!-- photo: codd-1970-paper -->

**Edgar F. Codd**, un matemático británico que trabajaba en el laboratorio de IBM en San José, publicó en junio de 1970 el artículo *A Relational Model of Data for Large Shared Data Banks*. Su idea: guardar los datos como **relaciones** (tablas de filas y columnas, sin punteros a la vista) y pedirlos **describiendo qué quieres**, no cómo encontrarlo. El sistema decide el camino. A eso se le llama ser **declarativo**.

Codd escribió matemáticas, no un lenguaje. En 1974, **Donald Chamberlin** y **Raymond Boyce**, también de IBM, diseñaron uno que se leyera casi como inglés para el prototipo **System R**: lo llamaron **SEQUEL** (*Structured English Query Language*). Como "SEQUEL" ya era una marca registrada de una empresa aeronáutica británica, le quitaron las vocales: **SQL**. Por eso hay gente que dice "es-cu-ele" y gente que dice "sícuel"; las dos formas valen.

<!-- /photo -->

```figura
title: SQL en el tiempo
panes:
  - timeline:
      - when: "1970"
        title: "Codd, IBM"
        text: "El modelo relacional: tablas y preguntas declarativas"
      - when: "1974"
        title: "SEQUEL"
        text: "Chamberlin y Boyce, para System R"
      - when: "1979"
        title: "Oracle V2"
        text: "La primera base SQL que se vendió"
      - when: "1986"
        title: "Estándar ANSI"
        text: "SQL-86; ISO lo adopta en 1987"
      - when: "1996"
        title: "PostgreSQL"
        text: "Nace de POSTGRES, de la Universidad de Berkeley"
      - when: "2000"
        title: "SQLite"
        text: "D. Richard Hipp: una base sin servidor"
      - when: "2003"
        title: "SQL:2003"
        text: "Funciones de ventana en el estándar"
      - when: "2023"
        title: "SQL:2023"
        text: "JSON como tipo y consultas de grafos"
```

La primera empresa que vendió una base SQL no fue IBM sino una pequeña llamada Relational Software, que leyó los artículos de System R y sacó **Oracle V2** en 1979. En 1986 SQL se volvió **estándar** (ANSI, y un año después ISO). El estándar sigue creciendo: consultas recursivas en 1999, funciones de ventana en 2003, JSON en 2016. Las verás todas en este curso.

```idea
SQL nació para que pidas los datos diciendo qué quieres, no cómo ir a buscarlos: el motor elige el camino.
```

### SQLite, la base de este curso

En la primavera del año 2000, **D. Richard Hipp** escribía software para los destructores de la Marina de Estados Unidos, como contratista de General Dynamics. El programa dependía de un servidor de base de datos aparte, y cuando ese servidor no estaba disponible, el programa no podía hacer nada. Hipp se preguntó por qué una base de datos necesitaba un servidor y escribió una que no: **SQLite**, una biblioteca que guarda toda la base en **un solo archivo** y corre dentro del programa que la usa. La versión 1.0 salió en agosto de 2000, y su código es de **dominio público**.

Hoy SQLite está dentro de cada celular, de cada navegador y de miles de aplicaciones. El propio proyecto calcula que hay **más de un billón** (un millón de millones) de bases SQLite en uso. Este curso la usa porque corre en tu navegador sin instalar nada (compilada a WebAssembly) y porque es SQL de verdad: lo que aprendas aquí sirve en PostgreSQL o MySQL, y en cada sesión verás dónde cambian.

### Fortalezas y debilidades

La misma pregunta en cuatro herramientas: **las salidas por la Puerta 3 desde las 22:41, de la más temprana a la más tardía.**

```figura
title: La misma pregunta, cuatro maneras
panes:
  - label: SQL
    text: |
      SELECT persona_id, momento
      FROM ingresos_mercado
      WHERE puerta = 3
        AND sentido = 'salida'
        AND momento >= '2026-03-13 22:41'
      ORDER BY momento;
  - label: Hoja de cálculo
    text: |
      1. Abrir el archivo (si entra: un
         millón de filas es el tope).
      2. Filtro en "puerta": 3.
      3. Filtro en "sentido": salida.
      4. Filtro en "momento": desde…
      5. Ordenar por "momento".
      (Pasos con el mouse: nadie
       puede repetirlos igual.)
  - label: Python con pandas
    text: |
      df = pd.read_csv("ingresos.csv")
      salidas = df[(df.puerta == 3)
          & (df.sentido == "salida")
          & (df.momento >= "2026-03-13 22:41")]
      salidas.sort_values("momento")
  - label: MongoDB (NoSQL)
    text: |
      db.ingresos.find({
        puerta: 3, sentido: "salida",
        momento: { $gte: "2026-03-13 22:41" }
      }).sort({ momento: 1 })
```

```figura
title: SQL frente a otros
panes:
  - table:
      head: ["", "SQL", "Hoja de cálculo", "pandas", "NoSQL (documentos)"]
      rows:
        - ["Muchos datos", "**Millones de filas, con índices**", "Se pone lenta pronto", "Lo que quepa en memoria", "**Escala repartiendo entre servidores**"]
        - ["Repetir la pregunta", "**Es texto: se guarda y se repite**", "Clics, difícil de repetir", "Es código", "Es código"]
        - ["Varias personas a la vez", "**Transacciones (ACID)**", "Se pisan los cambios", "Un solo programa", "Depende del motor"]
        - ["Datos que cambian de forma", "Hay que diseñar las tablas", "**Lo que quieras**", "**Flexible**", "**Cada documento a su manera**"]
        - ["Gráficos y exploración", "Hay que exportar", "**Al toque**", "**Con matplotlib**", "Hay que exportar"]
```

**Fortalezas.**

- **Declarativo.** Dices *qué* filas quieres; el motor decide *cómo* encontrarlas, con índices y un planificador que lleva cincuenta años mejorando. La misma consulta sigue sirviendo si la tabla pasa de mil a mil millones de filas.
- **Un estándar.** SQLite, PostgreSQL, MySQL, SQL Server y Oracle hablan casi el mismo idioma. Lo que aprendes aquí lo usas en todos.
- **Datos que no se contradicen.** Claves, restricciones y transacciones protegen los datos aunque mil personas escriban al mismo tiempo.
- **Una consulta es texto.** Se guarda, se revisa, se repite mañana con los datos nuevos. Por eso la policía (y Chasqui) puede volver a correr tu consulta y llegar a lo mismo.

**Debilidades.**

- **Hay que diseñar antes.** Las tablas tienen columnas fijas; si los datos cambian de forma a cada rato, una base de documentos o un archivo JSON encajan mejor.
- **No todo cabe en una pregunta.** Para dibujar un gráfico o entrenar un modelo, sacas los datos con SQL y sigues en Python.
- **Cada motor tiene sus costumbres.** Las fechas, los textos y algunos nombres de funciones cambian entre motores. Lo verás en las cajas **"En código viejo verás…"**.
- **Se lee en un orden y se ejecuta en otro.** Escribes `SELECT` primero, pero el motor lo hace casi al final. Hoy mismo lo vas a ver paso a paso.

```exercise
id: sql1-origen-declarativo
type: predict
title: Qué y cómo
prompt: |
  Esta consulta le pide filas a una tabla. ¿Qué devuelve? Y una pregunta más: ¿dónde dice **cómo** buscarlas?
code: |
  SELECT codigo FROM camaras WHERE distrito = 'Surquillo' ORDER BY codigo DESC LIMIT 2;
options:
  - "CAM-SUR-04\nCAM-SUR-03"
  - "CAM-SUR-01\nCAM-SUR-02"
  - "CAM-SUR-03\nCAM-SUR-04"
  - "CAM-SUR-04"
answer: "CAM-SUR-04\nCAM-SUR-03"
explain: |
  Nada: solo dice **qué** (las cámaras de Surquillo, de mayor a menor código, las dos primeras). Cómo recorrer la tabla lo decide SQLite. `DESC` ordena de mayor a menor, y `LIMIT 2` corta después de ordenar.
```

### Dónde se usa hoy

```figura
title: Dónde vive SQL
panes:
  - table:
      head: ["Dónde", "Qué base", "Por qué encaja"]
      rows:
        - ["**Celulares y apps**", "SQLite", "Un archivo dentro de la app, sin servidor: contactos, mensajes, historial"]
        - ["**Navegadores**", "SQLite", "Historial, marcadores y cookies de Chrome, Firefox y Safari"]
        - ["**Sistemas web y bancos**", "PostgreSQL, MySQL, Oracle", "Muchos usuarios escribiendo a la vez sin perder un sol"]
        - ["**Análisis de datos**", "BigQuery, Snowflake, DuckDB", "Miles de millones de filas con el mismo SQL"]
        - ["**Loop**", "SQLite", "Tu progreso en este curso también vive en una base SQLite"]
```

SQL tiene más de cincuenta años y sigue entre lo más usado. En la encuesta de desarrolladores de **Stack Overflow 2025**, el 58.6 % de quienes respondieron dijo usar SQL, y en la de **2026**, el 58.4 %. En la lista de bases de datos de **2026**, **PostgreSQL** aparece primera (57.9 %) y **SQLite** segunda (42.1 %). Son fotos de un año: revisa la edición más reciente.

```recap
- Codd propuso el modelo relacional en IBM en 1970: tablas, y preguntas que dicen qué quieres, no cómo buscarlo.
- Chamberlin y Boyce diseñaron SEQUEL (1974) para System R; por una marca registrada quedó en SQL. Es estándar ANSI/ISO desde 1986–87.
- "SQLite (2000, D. Richard Hipp) es una base en un solo archivo, sin servidor, de dominio público: la más instalada del mundo."
- "Fortalezas: declarativo, estándar, datos protegidos, consultas repetibles. Debilidades: hay que diseñar antes, cada motor tiene sus costumbres, se escribe en un orden y se ejecuta en otro."
```

**Fuentes**

- E. F. Codd, [A Relational Model of Data for Large Shared Data Banks](https://dl.acm.org/doi/10.1145/362384.362685), *Communications of the ACM* 13(6), 1970.
- D. D. Chamberlin, [Early History of SQL](https://ieeexplore.ieee.org/document/6359709), *IEEE Annals of the History of Computing*, 2012.
- SQLite, [Most Widely Deployed and Used Database Engine](https://www.sqlite.org/mostdeployed.html) y [About SQLite](https://www.sqlite.org/about.html); [SQLite en Wikipedia](https://es.wikipedia.org/wiki/SQLite) (origen en la Marina, 2000).
- PostgreSQL, [A Brief History of PostgreSQL](https://www.postgresql.org/docs/current/history.html).
- [Stack Overflow Developer Survey 2025](https://survey.stackoverflow.co/2025/technology) y [2026](https://survey.stackoverflow.co/2026/technology).

## Lo mínimo

Una base de datos guarda **tablas**: cada fila es una cosa (una persona, una denuncia, una pasada de tarjeta) y cada columna, un dato de esa cosa. Para preguntar usas **`SELECT`**: qué columnas quieres, **`FROM`** qué tabla, **`WHERE`** qué filas, **`ORDER BY`** en qué orden y **`LIMIT`** cuántas.

```esquema
title: Las dos tablas de hoy
tables: [denuncias, ingresos_mercado]
caption: "Cada caja es una tabla con sus columnas. La llave marca la **clave primaria** (`id`, distinta en cada fila) y el eslabón, una columna que apunta a otra tabla."
```

```sql run
SELECT fecha, hora, distrito, tipo
FROM denuncias
WHERE distrito = 'Miraflores'
ORDER BY fecha, hora
LIMIT 5;
```

Cambia `'Miraflores'` por otro distrito, o `LIMIT 5` por `LIMIT 10`, y vuelve a ejecutar. Lo que necesitas para hoy:

- **`SELECT *`** trae todas las columnas. Sirve para mirar una tabla, pero en una consulta de verdad nombra solo las que necesitas.
- **Textos entre comillas simples:** `'Surquillo'`. Los números van sin comillas: `puerta = 3`.
- **Comparar:** `=`, `<>` (distinto; también vale `!=`), `<`, `<=`, `>`, `>=`. Une condiciones con **`AND`**.
- **Fechas como texto:** aquí se guardan como `'2026-03-13 22:46:12'`. Como van de lo grande a lo chico (año, mes, día, hora), compararlas como texto funciona: `momento >= '2026-03-13 22:41'`.
- **`ORDER BY`** ordena de menor a mayor; **`DESC`** al revés. Puedes ordenar por varias columnas: `ORDER BY fecha DESC, hora DESC`.
- **`LIMIT n`** se queda con las primeras `n` filas; **`OFFSET k`** salta las primeras `k`.
- **Calcular y renombrar:** `SELECT placa, 2026 - anio AS antiguedad` crea una columna nueva con nombre propio.
- Las palabras de SQL no distinguen mayúsculas (`select` = `SELECT`), pero los textos sí: `'surquillo'` no es `'Surquillo'`. Un comentario empieza con `--`.

Lo raro de SQL: **se escribe en un orden y se ejecuta en otro**. Escribes `SELECT` primero, pero el motor empieza por `FROM` (de qué tabla), sigue con `WHERE` (qué filas quedan), y recién después calcula las columnas del `SELECT`, las ordena y corta. Dale a ▶ y mira qué filas quedan en cada paso:

```orden
title: Escrita en un orden, ejecutada en otro
query: |
  SELECT persona_id, momento
  FROM ingresos_mercado
  WHERE puerta = 3 AND sentido = 'salida'
  ORDER BY momento DESC
  LIMIT 3;
tables:
  ingresos_mercado:
    cols: [id, persona_id, puerta, momento, sentido]
    rows:
      - [1, 58, 1, "2026-03-13 06:02", "entrada"]
      - [2, 905, 3, "2026-03-13 20:12", "entrada"]
      - [3, 731, 3, "2026-03-13 21:58", "entrada"]
      - [4, 58, 2, "2026-03-13 19:31", "salida"]
      - [5, 731, 3, "2026-03-13 22:46", "salida"]
      - [6, 905, 3, "2026-03-13 22:58", "salida"]
      - [7, 412, 3, "2026-03-13 23:12", "salida"]
      - [8, 233, 1, "2026-03-13 19:55", "entrada"]
      - [9, 377, 3, "2026-03-13 23:21", "salida"]
caption: "Una versión chiquita de `ingresos_mercado`. `WHERE` tacha filas, `SELECT` se queda con dos columnas, `ORDER BY` las ordena y `LIMIT` corta."
```

> **Trampa común:** como `SELECT` se calcula después de `WHERE`, en el estándar de SQL (y en PostgreSQL) **no puedes usar en `WHERE` un alias que inventaste en `SELECT`**: `SELECT 2026 - anio AS antiguedad … WHERE antiguedad > 20` da error, porque cuando se evalúa `WHERE` esa columna todavía no existe. SQLite lo deja pasar como extensión, pero no te acostumbres: escribe la expresión completa, `WHERE 2026 - anio > 20`. En `ORDER BY` sí puedes usar el alias, porque se ejecuta después del `SELECT`.

<!-- legacy: limit -->

<!-- legacy: string-quotes -->

<!-- mdn: limit string-quotes -->

## Práctica

```exercise
id: sql1-predice-division
type: predict
title: Dividir en SQLite
prompt: |
  Chasqui quiere repartir 7 baterías entre 2 robots. ¿Qué devuelve esta consulta? (Un `SELECT` sin `FROM` calcula una sola fila.)
code: |
  SELECT 7 / 2, 7 / 2.0, 7 % 2;
options:
  - "3 | 3.5 | 1"
  - "3.5 | 3.5 | 1"
  - "3 | 3 | 1"
  - "3.5 | 3.5 | 0"
answer: "3 | 3.5 | 1"
explain: |
  Entre dos enteros, `/` en SQLite (y en PostgreSQL) es **división entera**: corta los decimales, `7 / 2` da 3. Si uno de los dos es un número con decimales (`2.0`), el resultado también: 3.5. `%` es el resto: 1. En MySQL, en cambio, `7 / 2` da 3.5000.
```

```exercise
id: sql1-predice-orden
type: predict
title: Ordenar y cortar
prompt: |
  ¿Qué devuelve? Fíjate en el orden en que SQLite hace las cosas.
code: |
  SELECT codigo
  FROM camaras
  WHERE distrito = 'Surquillo'
  ORDER BY codigo
  LIMIT 2 OFFSET 1;
options:
  - "CAM-SUR-02\nCAM-SUR-03"
  - "CAM-SUR-01\nCAM-SUR-02"
  - "CAM-SUR-03\nCAM-SUR-04"
  - "CAM-SUR-02"
answer: "CAM-SUR-02\nCAM-SUR-03"
explain: |
  Primero `WHERE` deja las cuatro cámaras de Surquillo, `ORDER BY` las ordena (01, 02, 03, 04), `OFFSET 1` salta la primera y `LIMIT 2` se queda con las dos siguientes.
```

```exercise
id: sql1-completa-camaras
type: complete
title: Las cámaras del distrito
prompt: |
  Lista el **código** y la **ubicación** de las cámaras de **Surquillo**. Reemplaza cada `___`.
starter: |
  SELECT codigo, ___
  FROM ___
  WHERE distrito = ___;
solution: |
  SELECT codigo, ubicacion
  FROM camaras
  WHERE distrito = 'Surquillo';
hints:
  - Las columnas y la tabla están en el panel Esquema (o escribe y deja que el editor te sugiera).
  - El distrito es un texto, así que va entre comillas simples.
tests:
  - name: las cuatro cámaras de Surquillo, con código y ubicación
    same: SELECT codigo, ubicacion FROM camaras WHERE distrito = 'Surquillo'
```

```exercise
id: sql1-arregla-coma
type: fix
title: La columna que desapareció
prompt: |
  Esta consulta debería mostrar el **número, el nombre y el rubro** de los puestos del **pasillo C**, ordenados por número. Pero salen solo dos columnas, y una se llama raro. Ejecútala, mira los encabezados y arréglala.
starter: |
  SELECT numero, nombre rubro
  FROM puestos
  WHERE pasillo = 'C'
  ORDER BY numero;
solution: |
  SELECT numero, nombre, rubro
  FROM puestos
  WHERE pasillo = 'C'
  ORDER BY numero;
hints:
  - "Mira el encabezado de la segunda columna: dice `rubro`, pero trae nombres de puestos."
  - Sin una coma entre dos nombres, el segundo se vuelve un alias del primero (`nombre rubro` es `nombre AS rubro`).
tests:
  - name: número, nombre y rubro del pasillo C, por número
    same: SELECT numero, nombre, rubro FROM puestos WHERE pasillo = 'C' ORDER BY numero
    ordered: true
    names: true
```

```exercise
id: sql1-escribe-recientes
type: write
title: Las últimas denuncias
prompt: |
  Escribe una consulta con la **fecha, la hora y el tipo** de las **5 denuncias más recientes de Surquillo**, de la más reciente a la más antigua.

  Cuidado: muchas denuncias tienen la misma fecha. Para desempatar, ordena también por hora.
visual:
  esquema:
    tables: [denuncias]
starter: |
  SELECT *
  FROM denuncias
  LIMIT 5;
solution: |
  SELECT fecha, hora, tipo
  FROM denuncias
  WHERE distrito = 'Surquillo'
  ORDER BY fecha DESC, hora DESC
  LIMIT 5;
hints:
  - "`ORDER BY fecha DESC, hora DESC`: primero por fecha y, si empatan, por hora."
  - "`LIMIT` va al final de todo."
tests:
  - name: las 5 más recientes, en orden
    same: SELECT fecha, hora, tipo FROM denuncias WHERE distrito = 'Surquillo' ORDER BY fecha DESC, hora DESC LIMIT 5
    ordered: true
  - name: solo las tres columnas pedidas
    columns: [fecha, hora, tipo]
```

```exercise
id: sql1-escribe-antiguedad
type: write
title: Los Toyota más viejos
prompt: |
  Lista la **placa**, el **modelo** y la **antigüedad** (2026 menos el año) de los vehículos **Toyota fabricados antes de 2007**. Llama `antiguedad` a la columna calculada y ordena de la más antigua a la más nueva; si empatan, por placa.
starter: |
  SELECT placa, modelo, anio
  FROM vehiculos
  WHERE marca = 'Toyota';
solution: |
  SELECT placa, modelo, 2026 - anio AS antiguedad
  FROM vehiculos
  WHERE marca = 'Toyota' AND anio < 2007
  ORDER BY antiguedad DESC, placa;
hints:
  - "`2026 - anio AS antiguedad` calcula y le pone nombre a la columna."
  - En `ORDER BY` sí puedes usar el alias, porque se ejecuta después del `SELECT`.
tests:
  - name: placa, modelo y antigüedad de los Toyota anteriores a 2007, en orden
    same: SELECT placa, modelo, 2026 - anio AS antiguedad FROM vehiculos WHERE marca = 'Toyota' AND anio < 2007 ORDER BY antiguedad DESC, placa
    ordered: true
  - name: la columna calculada se llama antiguedad
    columns: [placa, modelo, antiguedad]
```

## El caso

```exercise
id: sql1-caso-denuncia
type: case
title: La denuncia del puesto 47
prompt: |
  **Encuentra la denuncia de Carmen y léela: ¿cómo se llama la vigilante que vio salir a alguien?**

  Carmen fue a la comisaría el sábado 14 en la mañana. La tabla `denuncias` tiene trescientas, de todo Lima: filtra por **fecha** (`'2026-03-14'`) y **distrito**, mira qué tipo de denuncia es y lee la columna `descripcion` completa. Si es muy larga, pídele solo esa columna.
visual:
  expediente:
    cards:
      - name: Carmen Ríos Llanos
        traits: { style: bun, shirt: "#3f7cc4", glasses: true }
        role: Técnica de Loop, puesto 47
        rows: [["Fue a", "Comisaría de Surquillo"], ["Cuándo", "sábado 14, en la mañana"]]
        quote: "Lo dejé cargando a las siete y media de la noche. A las seis y cuarto de la mañana ya no tenía giroscopio."
starter: |
  -- Las denuncias empiezan así. Filtra las del sábado 14 en Surquillo.
  SELECT *
  FROM denuncias
  LIMIT 3;
solution: |
  SELECT hora, tipo, lugar, descripcion
  FROM denuncias
  WHERE fecha = '2026-03-14'
    AND distrito = 'Surquillo'
    AND tipo = 'robo'
    AND lugar LIKE '%47%';
answer: Marleny Quispe
answerLabel: ¿Cómo se llama la vigilante?
reveal: |
  **Marleny Quispe.** La denuncia dice además que el giroscopio dejó de responder a las **22:41** del viernes y que alguien salió apurado por la **Puerta 3**. Esa hora y esa puerta son tus primeras pistas: búscalas en la pizarra.
hints:
  - "`WHERE fecha = '2026-03-14' AND distrito = 'Surquillo'` deja siete denuncias. Mira las columnas `tipo` y `lugar`."
  - "Ya que sabes el `id` de la buena, `SELECT descripcion FROM denuncias WHERE id = …` te deja leerla entera."
```

## El juez

Un juez de SQL funciona como los de las competencias: tu consulta corre sobre las **tablas del ejemplo** y luego sobre decenas de **bases ocultas** que tienen las mismas tablas con otros datos. En cada una, tu resultado tiene que ser igual al esperado: las mismas filas y las mismas columnas. Así no basta con acertar los datos de ejemplo; la consulta tiene que ser correcta para cualquier dato.

- El **orden de las filas** solo cuenta cuando el enunciado lo pide (y entonces necesitas `ORDER BY`).
- Los **nombres de las columnas** no cuentan, salvo que el enunciado los pida; su orden sí.
- Las tablas de cada juez son suyas, chiquitas, y están en la pestaña **Esquema**.

```exercise
id: sql1-juez-madrugadores
type: judge
title: Los puestos madrugadores
prompt: |
  **Devuelve el número y el nombre de los puestos que abren antes de las 06:00, del que abre más temprano al que abre más tarde; si dos abren a la misma hora, primero el de número menor.**

  La asociación de comerciantes quiere saber quiénes ya están adentro cuando todavía está oscuro, para coordinar con la vigilancia.

  **Tabla:** `puestos(numero, nombre, abre)`. `abre` es un texto `'HH:MM'` (con cero adelante: `'05:30'`).

  **Resultado:** dos columnas, `numero` y `nombre`, en el orden pedido.
schema: |
  CREATE TABLE puestos (numero INTEGER, nombre TEXT, abre TEXT);
ordered: true
starter: |
  SELECT numero, nombre
  FROM puestos;
solution: |
  SELECT numero, nombre
  FROM puestos
  WHERE abre < '06:00'
  ORDER BY abre, numero;
hints:
  - Los textos `'HH:MM'` con cero adelante se comparan bien como texto, así que `abre < '06:00'` funciona.
  - Ordena primero por `abre` y, para desempatar, por `numero`.
samples:
  - rows:
      puestos: [[12, "Juguería Lucía", "06:30"], [47, "Loop", "05:45"], [3, "Pescados Don Beto", "04:30"], [21, "Flores Nelly", "05:45"], [8, "Abarrotes Kike", "07:00"]]
    note: Los puestos 47 y 21 abren a la misma hora; sale primero el 21.
  - rows:
      puestos: [[5, "Pollería Kusi", "06:00"], [9, "Verduras Rosa", "08:15"]]
    note: "Abrir a las 06:00 en punto no es abrir antes de las 06:00: no sale nadie."
edge:
  - rows: { puestos: [] }
    tag: con la tabla vacía
  - rows: { puestos: [[1, "Uno", "05:59"], [2, "Dos", "00:00"]] }
    tag: con la medianoche
  - rows: { puestos: [[30, "C", "05:00"], [10, "A", "05:00"], [20, "B", "05:00"]] }
    tag: con todos a la misma hora
random:
  count: 40
  seed: 101
  generate: |
    const names = ["Don Lucho", "Mamá Rosa", "Kike", "Nelly", "Beto", "Juana", "Pancho", "Mechita", "Tito", "Carmen"];
    const times = ["04:30", "05:00", "05:15", "05:45", "05:59", "06:00", "06:30", "07:00", "08:15"];
    const n = rng.int(0, 14);
    const used = new Set();
    const rows = [];
    for (let i = 0; i < n; i++) {
      let k = rng.int(1, 120);
      while (used.has(k)) k = rng.int(1, 120);
      used.add(k);
      rows.push([k, `${rng.pick(names)} ${k}`, rng.pick(times)]);
    }
    return { puestos: rows };
wrong:
  - |
    SELECT numero, nombre FROM puestos WHERE abre < '06:00' ORDER BY abre;
  - |
    SELECT numero, nombre FROM puestos WHERE abre <= '06:00' ORDER BY abre, numero;
  - |
    SELECT numero, nombre FROM puestos WHERE abre < '06:00' ORDER BY numero;
```

## Misión final

```exercise
id: sql1-mision-salidas
type: mission
title: Las salidas por la Puerta 3
prompt: |
  **Lista quién salió por la Puerta 3 entre las 22:41 y las 23:30 del viernes 13 (incluidos los segundos de las 23:30), de la salida más temprana a la más tardía.** Muestra `persona_id` y `momento`. Luego cuenta cuántas salidas hay.

  Wayra perdió el giroscopio a las 22:41 y Marleny vio salir a alguien por la Puerta 3. Miramos solo la hora siguiente al apagón, hasta las 23:30. La tabla `ingresos_mercado` guarda cada vez que alguien pasa su tarjeta por una puerta: `puerta`, `momento` (hora de Lima) y `sentido` (`'entrada'` o `'salida'`).

  Cuando la consulta lo pruebe, escribe la cantidad y se abre, junto con el juez, la sesión 2.
visual:
  - escenario:
      case: surquillo
      caption: "La Puerta 3 da al Jr. Narciso de la Colina, a la derecha del mercado."
  - esquema:
      tables: [ingresos_mercado]
starter: |
  SELECT *
  FROM ingresos_mercado
  WHERE puerta = 3
  LIMIT 20;
solution: |
  SELECT persona_id, momento
  FROM ingresos_mercado
  WHERE puerta = 3
    AND sentido = 'salida'
    AND momento >= '2026-03-13 22:41'
    AND momento < '2026-03-13 23:31'
  ORDER BY momento;
answer: "5"
answerLabel: ¿Cuántas salidas hubo en esa ventana?
reveal: |
  **Cinco.** Las personas 731, 905, 1046, 412 y 377 salieron por la Puerta 3 entre las 22:46 y las 23:21. Ya están en la pizarra como sospechosas; en la próxima sesión sabrás quiénes son y quién se subió a un auto blanco.
hints:
  - "Son tres condiciones sobre la puerta, el sentido y el momento, unidas con `AND`. Para el momento, dos comparaciones: desde `'2026-03-13 22:41'` y antes de `'2026-03-13 23:31'`."
  - "`'2026-03-13 23:30:59'` es menor que `'2026-03-13 23:31'`, así que `momento < '2026-03-13 23:31'` incluye los segundos de las 23:30."
tests:
  - name: las salidas por la Puerta 3 en esa ventana, en orden
    same: SELECT persona_id, momento FROM ingresos_mercado WHERE puerta = 3 AND sentido = 'salida' AND momento >= '2026-03-13 22:41' AND momento < '2026-03-13 23:31' ORDER BY momento
    ordered: true
  - name: la consulta ordena con ORDER BY
    source: '\bORDER\s+BY\b'
    msg: Sin ORDER BY no hay un orden garantizado.
```

## Reto experto

```exercise
id: sql1-reto-pagina
type: challenge
title: La segunda página
prompt: |
  **Devuelve la segunda página (filas 11 a 20) de todas las pasadas de tarjeta por la Puerta 3 desde las 20:00 del viernes 13 hasta antes de la medianoche, ordenadas por momento y, si empatan, por `id`.** Muestra `id`, `persona_id`, `momento` y `sentido`.

  Para quien ya programa: así pagina cualquier sistema que muestra resultados de diez en diez. Piensa en por qué hace falta el desempate por `id`.
visual:
  figure:
    title: Páginas de diez
    panes:
      - label: Todas las filas, ordenadas
        cells: ["1–10", "11–20", "21–30", "31–38"]
        highlight: [1]
        index: false
      - label: La página 2
        value: "LIMIT 10 OFFSET 10"
starter: |
  SELECT id, persona_id, momento, sentido
  FROM ingresos_mercado
  WHERE puerta = 3;
solution: |
  SELECT id, persona_id, momento, sentido
  FROM ingresos_mercado
  WHERE puerta = 3
    AND momento >= '2026-03-13 20:00'
    AND momento < '2026-03-14'
  ORDER BY momento, id
  LIMIT 10 OFFSET 10;
hints:
  - "`'2026-03-14'` es menor que cualquier momento del día 14 y mayor que todos los del 13."
  - Si dos filas tienen el mismo momento, sin desempate el motor puede devolverlas en cualquier orden, y una fila podría salir en dos páginas o en ninguna.
tests:
  - name: las filas 11 a 20, en orden
    same: SELECT id, persona_id, momento, sentido FROM ingresos_mercado WHERE puerta = 3 AND momento >= '2026-03-13 20:00' AND momento < '2026-03-14' ORDER BY momento, id LIMIT 10 OFFSET 10
    ordered: true
  - name: desempata por id
    source: 'ORDER\s+BY\s+momento\s*,\s*id\b'
    msg: Agrega id al ORDER BY para que el orden no dependa del motor.
```
