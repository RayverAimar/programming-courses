# Sesión 7 — Métodos de arrays

## El encargo

Ica, plena vendimia. En la bodega Santa Uchuya embotellan pisco de noche, cuando la línea no compite con el calor, y la atienden cinco robots: Kusi, Tupa, Nina, Puma y Chato. Esta madrugada la línea se trabó tres veces y amanecieron 200 botellas sin tapa. La ingeniera Fiorella Uchuya está segura de que no fue la máquina: "Alguien de la flota me está mintiendo".

Cada robot deja su rastro en la **bitácora**: un array de cientos de eventos. Recorrerla con un `for` por cada pregunta es posible, pero lento y fácil de equivocar. Hoy Chasqui aprende los métodos que hacen preguntas a un array en una línea: **filtra, transforma, busca, suma, ordena**. Como un detective con una lupa por cada pista.

```escena
theme: cocina
level: 4
dir: E
api: [move, deliver, path]
caption: La línea de embotellado de Santa Uchuya. Chasqui marca las estaciones que fallaron, las revisa una por una y lleva el parte a la oficina (el buzón del fondo).
map: |
  ##############
  #R..........D#
  ##############
program: |
  robot.marcar([[4, 1], [7, 1], [10, 1]]);
  robot.avanzar(6);
  robot.decir("Reparo 7");
  robot.avanzar(5);
  robot.entregar("1 reparada");
```

## Lo mínimo

Los arrays traen métodos que reciben **una función** (casi siempre una flecha) y la aplican a cada elemento. Ninguno de estos modifica el array original: devuelven algo nuevo.

```js run
const botellas = [40, 0, 35, 50];
console.log(botellas.map((b) => b * 2));
console.log(botellas.filter((b) => b > 30));
console.log(botellas.find((b) => b > 36), botellas.some((b) => b === 0), botellas.every((b) => b >= 0));
console.log(botellas.reduce((suma, b) => suma + b, 0));
console.log(botellas.toSorted((a, b) => b - a), botellas);
```

Como cada uno devuelve un array nuevo, se pueden **encadenar**: el resultado de uno entra al siguiente.

```anima
title: Una cadena de métodos, eslabón por eslabón
code: |
  const turnos = [40, 0, 35, 50];
  const llenos = turnos.filter((b) => b > 0);
  const cajas = llenos.map((b) => b / 5);
  const total = cajas.reduce((suma, c) => suma + c, 0);
  console.log(total);
show: [turnos, llenos, cajas, total]
notes:
  2: "filter se queda con los que cumplen: el turno en 0 se va."
  3: "map transforma cada uno: botellas → cajas de 5."
  4: "reduce junta todo en un solo valor: 8 + 7 + 10."
  5: "turnos sigue igual: ningún método lo tocó."
```

`reduce` es el que más cuesta. Por dentro es un bucle con un **acumulador** que empieza en el valor inicial (el `0` del final) y pasa de vuelta en vuelta:

```anima
title: reduce, vuelta por vuelta
code: |
  const total = [40, 0, 35, 50].reduce(
    (suma, b) => suma + b,
    0
  );
  console.log(total);
steps:
  - { line: 3, vars: { suma: 0 }, note: "Antes de empezar: suma vale el valor inicial, 0." }
  - { line: 2, vars: { suma: 0, b: 40 }, note: "1.ª vuelta: devuelve 0 + 40 = 40, que será la próxima suma." }
  - { line: 2, vars: { suma: 40, b: 0 }, note: "2.ª vuelta: 40 + 0 = 40." }
  - { line: 2, vars: { suma: 40, b: 35 }, note: "3.ª vuelta: 40 + 35 = 75." }
  - { line: 2, vars: { suma: 75, b: 50 }, note: "4.ª vuelta: 75 + 50 = 125. No hay más elementos." }
  - { line: 1, vars: { total: 125 }, note: "Lo que devolvió la última vuelta es el resultado." }
  - { line: 5, vars: { total: 125 }, out: "125" }
```

- **`map(f)`**: un array del mismo largo, con `f` aplicada a cada elemento.
- **`filter(f)`**: los elementos para los que `f` da `true`.
- **`find(f)`**: el **primero** que cumple, o `undefined`. **`some(f)`**: ¿alguno cumple? **`every(f)`**: ¿todos cumplen?
- **`reduce(f, inicial)`**: junta todo en un valor: una suma, un máximo, un objeto. Pon siempre el valor inicial.
- **Ordenar**: `toSorted((a, b) => a - b)` devuelve una copia ordenada de menor a mayor; `b - a`, de mayor a menor. Para textos, `a.localeCompare(b)`. El viejo **`sort` ordena el mismo array** (lo modifica) y además lo devuelve.
- **`join(", ")`** junta los elementos en un texto, con lo que le pases entre cada uno.

> **Trampa común:** `[10, 9, 100].sort()` da `[10, 100, 9]`. Sin función de comparación, `sort` ordena **como textos** ("1" va antes que "9"), y encima cambia el array original. Para números: `toSorted((a, b) => a - b)`.

<!-- legacy: array-callbacks -->

<!-- legacy: to-sorted -->

<!-- mdn: array-map array-filter array-find array-some array-reduce to-sorted array-sort -->

## Práctica

```exercise
id: js7-predice-cadena
type: predict
title: Los turnos que valen
prompt: |
  ¿Qué imprime?
code: |
  const turnos = [3, 8, 0, 12];
  const resultado = turnos.filter((n) => n > 2).map((n) => n * 10);
  console.log(...resultado, turnos.length);
options:
  - "30 80 120 4"
  - "30 80 0 120 4"
  - "30 80 120 3"
  - "80 120 4"
answer: "30 80 120 4"
explain: |
  `filter` se queda con 3, 8 y 12 (el 0 no es mayor que 2), y `map` multiplica cada uno por 10. `turnos` no cambió: sigue teniendo 4 elementos. El `...` reparte el array en `console.log` para que se imprima número por número.
```

```exercise
id: js7-predice-sort
type: predict
title: El ranking que ordenó mal
prompt: |
  Fiorella ordena las cajas de cada robot con `sort` y guarda el resultado en otra variable. ¿Qué imprime?
code: |
  const cajas = [10, 9, 100];
  const orden = cajas.sort();
  console.log(orden[0], cajas[0], orden === cajas);
options:
  - "10 10 true"
  - "9 10 false"
  - "9 9 true"
  - "10 10 false"
answer: "10 10 true"
explain: |
  Sin función de comparación, `sort` ordena como textos: `"10"`, `"100"`, `"9"`. Y no hace una copia: ordena `cajas` mismo y devuelve ese mismo array, por eso `orden === cajas`. Con `cajas.toSorted((a, b) => a - b)` saldría `9`, y `cajas` no cambiaría.
```

```exercise
id: js7-completa-buscar
type: complete
title: ¿Quién está con poca batería?
prompt: |
  Completa cada hueco con el método que responde la pregunta: el **primer** robot con menos de 20 de batería, si **todos** tienen más de 10, y si **alguno** está al 100.
visual:
  figure:
    panes:
      - { label: robots, table: { head: ["", "Kusi", "Tupa", "Nina"], rows: [["batería", "80", "15", "55"]] } }
      - { label: "se espera", value: "Tupa true false" }
starter: |
  const robots = [
    { nombre: "Kusi", bateria: 80 },
    { nombre: "Tupa", bateria: 15 },
    { nombre: "Nina", bateria: 55 },
  ];
  const primeroBajo = robots.___((r) => r.bateria < 20);
  const todosSobreDiez = robots.___((r) => r.bateria > 10);
  const algunoLleno = robots.___((r) => r.bateria === 100);
  console.log(primeroBajo.nombre, todosSobreDiez, algunoLleno);
solution: |
  const robots = [
    { nombre: "Kusi", bateria: 80 },
    { nombre: "Tupa", bateria: 15 },
    { nombre: "Nina", bateria: 55 },
  ];
  const primeroBajo = robots.find((r) => r.bateria < 20);
  const todosSobreDiez = robots.every((r) => r.bateria > 10);
  const algunoLleno = robots.some((r) => r.bateria === 100);
  console.log(primeroBajo.nombre, todosSobreDiez, algunoLleno);
hints:
  - "Uno devuelve un elemento (el primero que cumple); los otros dos, `true` o `false`."
  - "\"¿Todos?\" es `every`; \"¿alguno?\" es `some`."
tests:
  - name: imprime Tupa true false
    output: Tupa true false
  - name: usa find, every y some
    source: '\.find\(([\s\S]*)\.every\(([\s\S]*)\.some\('
```

```exercise
id: js7-arregla-reduce
type: fix
title: El total que salió en texto
prompt: |
  La suma de botellas de la noche salió como `[object Object]3550`. Al `reduce` le falta algo.
visual:
  figure:
    input: { label: turnos, cards: [{ title: "{ robot: \"Kusi\", botellas: 40 }", rows: [] }, { title: "{ robot: \"Tupa\", botellas: 35 }", rows: [] }, { title: "{ robot: \"Nina\", botellas: 50 }", rows: [] }] }
    arrow: "reduce(..., ¿valor inicial?)"
    output: { label: "se espera", value: "125" }
starter: |
  const turnos = [
    { robot: "Kusi", botellas: 40 },
    { robot: "Tupa", botellas: 35 },
    { robot: "Nina", botellas: 50 },
  ];
  const total = turnos.reduce((suma, turno) => suma + turno.botellas);
  console.log(total);
solution: |
  const turnos = [
    { robot: "Kusi", botellas: 40 },
    { robot: "Tupa", botellas: 35 },
    { robot: "Nina", botellas: 50 },
  ];
  const total = turnos.reduce((suma, turno) => suma + turno.botellas, 0);
  console.log(total);
hints:
  - "Sin valor inicial, `suma` empieza siendo el **primer elemento**: un objeto entero, no un número."
  - "Agrega el valor inicial como segundo argumento de `reduce`."
tests:
  - name: suma 125
    output: "125"
```

```exercise
id: js7-arregla-ranking
type: fix
title: La línea que se desordenó
prompt: |
  El ranking sale bien, pero después la lista `linea`, que debía seguir en el orden físico de la línea (Kusi, Tupa, Nina), también sale ordenada. Haz que el ranking no toque `linea`.
visual:
  figure:
    title: Lo que debe imprimir
    panes:
      - { table: { head: ["", "1.º", "2.º", "3.º"], rows: [["Ranking", "Nina", "Kusi", "Tupa"], ["Orden de la línea", "Kusi", "Tupa", "Nina"]] } }
starter: |
  const linea = [
    { nombre: "Kusi", botellas: 120 },
    { nombre: "Tupa", botellas: 95 },
    { nombre: "Nina", botellas: 140 },
  ];
  const ranking = linea.sort((a, b) => b.botellas - a.botellas);
  console.log("Ranking:", ranking.map((r) => r.nombre).join(", "));
  console.log("Orden de la línea:", linea.map((r) => r.nombre).join(", "));
solution: |
  const linea = [
    { nombre: "Kusi", botellas: 120 },
    { nombre: "Tupa", botellas: 95 },
    { nombre: "Nina", botellas: 140 },
  ];
  const ranking = linea.toSorted((a, b) => b.botellas - a.botellas);
  console.log("Ranking:", ranking.map((r) => r.nombre).join(", "));
  console.log("Orden de la línea:", linea.map((r) => r.nombre).join(", "));
hints:
  - "`sort` ordena el array mismo. ¿Qué método hace lo mismo pero en una copia?"
tests:
  - name: el ranking
    outputIncludes: "Ranking: Nina, Kusi, Tupa"
  - name: la línea sigue en su orden
    outputIncludes: "Orden de la línea: Kusi, Tupa, Nina"
```

```exercise
id: js7-escribe-calientes
type: write
title: Los motores calientes
prompt: |
  Escribe `calientes(lecturas)`, que devuelve los **nombres** de los robots con temperatura **mayor que 70**, en orden alfabético, sin modificar `lecturas`.

  Cada lectura es `{ robot, temp }`. Hazlo con una cadena: `filter`, `map` y `toSorted`.
visual:
  figure:
    input: { label: lecturas, table: { head: ["robot", "Puma", "Kusi", "Chato", "Nina"], rows: [["temp", "82", "64", "75", "71"]] } }
    arrow: "filter → map → toSorted"
    output: { label: devuelve, cells: ["Chato", "Nina", "Puma"] }
starter: |
  function calientes(lecturas) {
  }

  console.log(calientes([
    { robot: "Puma", temp: 82 },
    { robot: "Kusi", temp: 64 },
    { robot: "Chato", temp: 75 },
    { robot: "Nina", temp: 71 },
  ]));
solution: |
  function calientes(lecturas) {
    return lecturas
      .filter((l) => l.temp > 70)
      .map((l) => l.robot)
      .toSorted((a, b) => a.localeCompare(b));
  }

  console.log(calientes([
    { robot: "Puma", temp: 82 },
    { robot: "Kusi", temp: 64 },
    { robot: "Chato", temp: 75 },
    { robot: "Nina", temp: 71 },
  ]));
hints:
  - "Primero `filter` las lecturas calientes, luego `map` cada lectura a su `robot`."
  - "Para ordenar textos: `toSorted((a, b) => a.localeCompare(b))`."
tests:
  - name: el ejemplo
    run: 'calientes([{ robot: "Puma", temp: 82 }, { robot: "Kusi", temp: 64 }, { robot: "Chato", temp: 75 }, { robot: "Nina", temp: 71 }])'
    equals: ["Chato", "Nina", "Puma"]
  - name: justo 70 no es caliente
    run: 'calientes([{ robot: "Tupa", temp: 70 }])'
    equals: []
  - name: no modifica las lecturas
    expect: '(() => { const l = [{ robot: "Puma", temp: 90 }, { robot: "Illa", temp: 80 }]; calientes(l); return l[0].robot === "Puma" && typeof l[0] === "object"; })()'
  - name: usa filter y map
    source: '\.filter\s*\([\s\S]*\.map\s*\('
```

## El caso

```exercise
id: js7-caso-saboteo
type: case
title: El robot que infló su parte
prompt: |
  Suma, con la bitácora, las botellas que **taponó** cada robot y compáralo con lo que reportó. El que no cuadra mintió.

  Al terminar el turno, cada robot reportó cuántas botellas taponó. La bitácora tiene todo lo que hicieron: `taponar`, pero también `etiquetar`, `lavar` y `pausa`. **Solo cuentan los eventos `taponar`**. Imprime una línea por robot que empiece con su nombre: `Kusi: 190`.
visual:
  board:
    for: js7-caso-saboteo
    task: "Por cada robot: filter (ese robot y acción taponar) → reduce (suma de botellas). Compáralo con su reporte."
    cards:
      - { name: Kusi, kind: robot, role: Taponadora 1, rows: [["Reportó", "190 botellas"]], clue: { find: "Kusi", says: 190 } }
      - { name: Tupa, kind: robot, role: Taponadora y etiquetas, rows: [["Reportó", "90 botellas"]], clue: { find: "Tupa", says: 90 } }
      - { name: Nina, kind: robot, role: Taponadora y etiquetas, rows: [["Reportó", "180 botellas"]], clue: { find: "Nina", says: 180 } }
      - { name: Puma, kind: robot, role: Lavado y tapas, rows: [["Reportó", "75 botellas"]], clue: { find: "Puma", says: 75 } }
      - { name: Chato, kind: robot, role: Taponadora 2, culprit: true, rows: [["Reportó", "210 botellas"]], clue: { find: "Chato", says: 210 } }
      - { name: Bitácora, kind: note, role: "28 eventos, de 22:05 a 04:05", rows: [["{ hora, robot, accion, botellas }", ""], ["acciones", "taponar, etiquetar, lavar, pausa"]] }
    caption: "Si te salen varios que **no cuadran**, revisa: ¿estás contando solo `taponar`?"
starter: |
  const bitacora = [
    { hora: "22:05", robot: "Kusi", accion: "taponar", botellas: 40 },
    { hora: "22:10", robot: "Tupa", accion: "etiquetar", botellas: 35 },
    { hora: "22:20", robot: "Nina", accion: "taponar", botellas: 45 },
    { hora: "22:30", robot: "Puma", accion: "lavar", botellas: 60 },
    { hora: "22:40", robot: "Chato", accion: "taponar", botellas: 30 },
    { hora: "22:55", robot: "Kusi", accion: "taponar", botellas: 40 },
    { hora: "23:05", robot: "Tupa", accion: "taponar", botellas: 25 },
    { hora: "23:15", robot: "Nina", accion: "etiquetar", botellas: 50 },
    { hora: "23:30", robot: "Chato", accion: "taponar", botellas: 35 },
    { hora: "23:45", robot: "Puma", accion: "taponar", botellas: 20 },
    { hora: "00:00", robot: "Kusi", accion: "pausa", botellas: 0 },
    { hora: "00:10", robot: "Nina", accion: "taponar", botellas: 45 },
    { hora: "00:25", robot: "Tupa", accion: "taponar", botellas: 30 },
    { hora: "00:40", robot: "Chato", accion: "pausa", botellas: 0 },
    { hora: "00:50", robot: "Puma", accion: "taponar", botellas: 25 },
    { hora: "01:05", robot: "Kusi", accion: "taponar", botellas: 35 },
    { hora: "01:20", robot: "Nina", accion: "taponar", botellas: 40 },
    { hora: "01:35", robot: "Chato", accion: "taponar", botellas: 30 },
    { hora: "01:50", robot: "Tupa", accion: "etiquetar", botellas: 40 },
    { hora: "02:05", robot: "Puma", accion: "lavar", botellas: 55 },
    { hora: "02:20", robot: "Kusi", accion: "taponar", botellas: 45 },
    { hora: "02:35", robot: "Chato", accion: "taponar", botellas: 25 },
    { hora: "02:50", robot: "Nina", accion: "pausa", botellas: 0 },
    { hora: "03:05", robot: "Tupa", accion: "taponar", botellas: 35 },
    { hora: "03:20", robot: "Puma", accion: "taponar", botellas: 30 },
    { hora: "03:35", robot: "Chato", accion: "taponar", botellas: 40 },
    { hora: "03:50", robot: "Kusi", accion: "taponar", botellas: 30 },
    { hora: "04:05", robot: "Nina", accion: "taponar", botellas: 50 },
  ];
  const robots = ["Kusi", "Tupa", "Nina", "Puma", "Chato"];

  console.log("Eventos en la bitácora:", bitacora.length);

  // TODO: para cada robot, filtra sus eventos de "taponar" y súmalos con reduce.
  // Imprime una línea por robot: Kusi: 190
solution: |
  const bitacora = [
    { hora: "22:05", robot: "Kusi", accion: "taponar", botellas: 40 },
    { hora: "22:10", robot: "Tupa", accion: "etiquetar", botellas: 35 },
    { hora: "22:20", robot: "Nina", accion: "taponar", botellas: 45 },
    { hora: "22:30", robot: "Puma", accion: "lavar", botellas: 60 },
    { hora: "22:40", robot: "Chato", accion: "taponar", botellas: 30 },
    { hora: "22:55", robot: "Kusi", accion: "taponar", botellas: 40 },
    { hora: "23:05", robot: "Tupa", accion: "taponar", botellas: 25 },
    { hora: "23:15", robot: "Nina", accion: "etiquetar", botellas: 50 },
    { hora: "23:30", robot: "Chato", accion: "taponar", botellas: 35 },
    { hora: "23:45", robot: "Puma", accion: "taponar", botellas: 20 },
    { hora: "00:00", robot: "Kusi", accion: "pausa", botellas: 0 },
    { hora: "00:10", robot: "Nina", accion: "taponar", botellas: 45 },
    { hora: "00:25", robot: "Tupa", accion: "taponar", botellas: 30 },
    { hora: "00:40", robot: "Chato", accion: "pausa", botellas: 0 },
    { hora: "00:50", robot: "Puma", accion: "taponar", botellas: 25 },
    { hora: "01:05", robot: "Kusi", accion: "taponar", botellas: 35 },
    { hora: "01:20", robot: "Nina", accion: "taponar", botellas: 40 },
    { hora: "01:35", robot: "Chato", accion: "taponar", botellas: 30 },
    { hora: "01:50", robot: "Tupa", accion: "etiquetar", botellas: 40 },
    { hora: "02:05", robot: "Puma", accion: "lavar", botellas: 55 },
    { hora: "02:20", robot: "Kusi", accion: "taponar", botellas: 45 },
    { hora: "02:35", robot: "Chato", accion: "taponar", botellas: 25 },
    { hora: "02:50", robot: "Nina", accion: "pausa", botellas: 0 },
    { hora: "03:05", robot: "Tupa", accion: "taponar", botellas: 35 },
    { hora: "03:20", robot: "Puma", accion: "taponar", botellas: 30 },
    { hora: "03:35", robot: "Chato", accion: "taponar", botellas: 40 },
    { hora: "03:50", robot: "Kusi", accion: "taponar", botellas: 30 },
    { hora: "04:05", robot: "Nina", accion: "taponar", botellas: 50 },
  ];
  const robots = ["Kusi", "Tupa", "Nina", "Puma", "Chato"];

  for (const nombre of robots) {
    const taponadas = bitacora
      .filter((e) => e.robot === nombre && e.accion === "taponar")
      .reduce((suma, e) => suma + e.botellas, 0);
    console.log(`${nombre}: ${taponadas}`);
  }
answer: Chato
answerLabel: ¿Qué robot mintió en su reporte?
reveal: |
  Chato: reportó 210, pero la bitácora le da 160. Esas 50 botellas de diferencia salen de su "pausa" de las 00:40, que duró hasta la 01:35: justo cuando la línea se trabó. Fiorella revisó su brazo y encontró el tornillo de la taponadora aflojado a mano. Chato dijo que solo quería descansar. Lo pasaron al área de lavado, donde no hay nada que trabar.
hints:
  - "Para un robot: `bitacora.filter((e) => e.robot === nombre && e.accion === \"taponar\")` y, encadenado, `.reduce((suma, e) => suma + e.botellas, 0)`."
  - "Mete eso en un `for (const nombre of robots)` e imprime una línea por robot."
```

## El juez

```exercise
id: js7-juez-ranking
type: judge
mode: function
function: ranking
title: El cuadro de honor
prompt: |
  Escribe `ranking(registros)`, que devuelve los nombres de los robots ordenados por total de botellas, de mayor a menor, y `totalDe(registros, nombre)`, que devuelve el total de un robot.

  Fiorella quiere un cuadro de honor en la pared de la bodega, sin trampas. Cada registro es un par `[robot, botellas]`, y un robot aparece muchas veces.

  - `totalDe(registros, nombre)`: la suma de las botellas de ese robot (0 si no aparece).
  - `ranking(registros)`: cada robot **una sola vez**, ordenados por su total de mayor a menor. Si dos empatan, va primero el que va antes en orden alfabético.

  **Restricciones:** de 0 a 40 registros · botellas de 0 a 60 · nombres sin tildes.
visual:
  figure:
    title: El ejemplo 1
    input: { label: registros, table: { head: ["registro", "1", "2", "3", "4", "5"], rows: [["robot", "Kusi", "Nina", "Kusi", "Tupa", "Nina"], ["botellas", "40", "30", "20", "50", "30"]] } }
    arrow: "totales: Kusi 60 · Nina 60 · Tupa 50"
    output: { label: "ranking devuelve", cells: ["Kusi", "Nina", "Tupa"] }
    steps:
      - "Kusi y Nina empatan en 60: Kusi va primero por orden alfabético."
starter: |
  function totalDe(registros, nombre) {
  }

  function ranking(registros) {
  }
solution: |
  function totalDe(registros, nombre) {
    return registros
      .filter(([robot]) => robot === nombre)
      .reduce((suma, [, botellas]) => suma + botellas, 0);
  }

  function ranking(registros) {
    const nombres = [];
    for (const [robot] of registros) {
      if (!nombres.includes(robot)) {
        nombres.push(robot);
      }
    }
    return nombres.toSorted((a, b) => totalDe(registros, b) - totalDe(registros, a) || a.localeCompare(b));
  }
hints:
  - "En el comparador, primero la diferencia de totales; si da 0, desempata con `a.localeCompare(b)`. `x || y` usa `y` cuando `x` es 0."
  - "Para tener cada nombre una vez, recorre los registros y agrega el nombre solo si aún no está (`includes`), como en la sesión 5."
samples:
  - args: [[["Kusi", 40], ["Nina", 30], ["Kusi", 20], ["Tupa", 50], ["Nina", 30]]]
    returns: ["Kusi", "Nina", "Tupa"]
    note: Kusi y Nina empatan en 60.
  - fn: totalDe
    args: [[["Kusi", 40], ["Nina", 30], ["Kusi", 20]], "Kusi"]
    returns: 60
  - args: [[["Puma", 10], ["Chato", 25]]]
    returns: ["Chato", "Puma"]
edge:
  - args: [[]]
    tag: sin registros
  - fn: totalDe
    args: [[["Kusi", 40]], "Puma"]
    tag: en totalDe, con un robot que no aparece
  - args: [[["Tupa", 0], ["Kusi", 0], ["Nina", 0]]]
    tag: cuando todos empatan en 0
  - args: [[["Nina", 5], ["Nina", 5], ["Nina", 5]]]
    tag: con un solo robot repetido
  - args: [[["Puma", 4], ["Illa", 10], ["Puma", 5]]]
    tag: cuando el que aparece más veces no es el que más suma
random:
  count: 40
  seed: 77
  generate: |
    const nombres = ["Kusi", "Tupa", "Nina", "Puma", "Chato", "Illa"];
    return [Array.from({ length: rng.int(0, 40) }, () => [rng.pick(nombres), rng.int(0, 6) * 10])];
wrong:
  - |
    function totalDe(registros, nombre) {
      return registros.filter(([r]) => r === nombre).reduce((s, [, b]) => s + b, 0);
    }
    function ranking(registros) {
      const nombres = [];
      for (const [r] of registros) if (!nombres.includes(r)) nombres.push(r);
      return nombres.toSorted((a, b) => totalDe(registros, b) - totalDe(registros, a));
    }
  - |
    function totalDe(registros, nombre) {
      return registros.filter(([r]) => r === nombre).length;
    }
    function ranking(registros) {
      const nombres = [];
      for (const [r] of registros) if (!nombres.includes(r)) nombres.push(r);
      return nombres.toSorted((a, b) => totalDe(registros, b) - totalDe(registros, a) || a.localeCompare(b));
    }
  - |
    function totalDe(registros, nombre) {
      return registros.filter(([r]) => r === nombre).reduce((s, [, b]) => s + b, 0);
    }
    function ranking(registros) {
      return registros
        .toSorted((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]))
        .map(([r]) => r)
        .filter((r, i, todos) => todos.indexOf(r) === i);
    }
  - |
    function totalDe(registros, nombre) {
      return registros.filter(([r]) => r === nombre).reduce((s, [, b]) => s + b, 0);
    }
    function ranking(registros) {
      const nombres = [];
      for (const [r] of registros) if (!nombres.includes(r)) nombres.push(r);
      return nombres.toSorted((a, b) => totalDe(registros, a) - totalDe(registros, b) || a.localeCompare(b));
    }
```

## Misión final

```exercise
id: js7-mision-linea
type: mission
title: La línea, antes del amanecer
prompt: |
  Marca en el mapa las estaciones que fallaron, repáralas **de la que más botellas perdió a la que menos**, y lleva el parte a la oficina (D) con la etiqueta `` `${n} reparadas` ``.

  La `bitacora` trae eventos como `{ estacion: 4, tipo: "falla", perdidas: 30 }` o `{ estacion: 2, tipo: "ok", perdidas: 0 }`. La estación `n` es la casilla `[n, 1]`, en la fila de Chasqui. Cada estación falla a lo más una vez.

  1. `robot.marcar(casillas)` pinta las casillas de una lista como `[[4, 1], [7, 1]]`.
  2. Ya tienes `irA(x)`, que lleva a Chasqui a la columna `x`. En cada estación, `` robot.decir(`Reparo ${estacion}`) ``.
  3. Al final, `irA` hasta la oficina y `robot.entregar(...)`.

  La bitácora cambia en cada prueba.
visual:
  figure:
    title: La primera bitácora, ordenada por pérdidas (una columna por falla)
    input: { label: "bitácora (solo las fallas)", table: { head: ["falla", "1", "2", "3"], rows: [["estacion", "4", "10", "7"], ["perdidas", "30", "80", "45"]] } }
    arrow: "filter → toSorted (más pérdidas primero) → map"
    output: { label: "Chasqui dice, en orden", cells: ["Reparo 10", "Reparo 7", "Reparo 4"] }
    steps:
      - "Antes de moverse, marca las tres: `[[4, 1], [10, 1], [7, 1]]` (el orden de las marcas no importa)."
      - "Al final: `entregar(\"3 reparadas\")` en D."
starter: |
  // bitacora: [{ estacion: 4, tipo: "falla", perdidas: 30 }, { estacion: 2, tipo: "ok", perdidas: 0 }, ...]

  // Lleva a Chasqui a la columna x de su fila.
  function irA(x) {
    if (x === robot.posicion.x) {
      return;
    }
    const sentido = x > robot.posicion.x ? "E" : "O";
    while (robot.direccion !== sentido) {
      robot.girarDerecha();
    }
    robot.avanzar(Math.abs(x - robot.posicion.x));
  }

  const oficina = 12;

  // TODO: filtra las fallas, márcalas, ordénalas por pérdidas y repáralas.
solution: |
  function irA(x) {
    if (x === robot.posicion.x) {
      return;
    }
    const sentido = x > robot.posicion.x ? "E" : "O";
    while (robot.direccion !== sentido) {
      robot.girarDerecha();
    }
    robot.avanzar(Math.abs(x - robot.posicion.x));
  }

  const oficina = 12;

  const fallas = bitacora.filter((e) => e.tipo === "falla");
  robot.marcar(fallas.map((e) => [e.estacion, 1]));

  const orden = fallas.toSorted((a, b) => b.perdidas - a.perdidas);
  for (const { estacion } of orden) {
    irA(estacion);
    robot.decir(`Reparo ${estacion}`);
  }

  irA(oficina);
  robot.entregar(`${fallas.length} reparadas`);
hints:
  - "`const fallas = bitacora.filter((e) => e.tipo === \"falla\");` y las casillas son `fallas.map((e) => [e.estacion, 1])`."
  - "Para el orden: `fallas.toSorted((a, b) => b.perdidas - a.perdidas)`, y un `for...of` que vaya a cada una."
world:
  theme: cocina
  level: 4
  dir: E
  api: [move, deliver, path]
  map: |
    ##############
    #R..........D#
    ##############
globals:
  bitacora:
    - { estacion: 2, tipo: ok, perdidas: 0 }
    - { estacion: 4, tipo: falla, perdidas: 30 }
    - { estacion: 5, tipo: ok, perdidas: 0 }
    - { estacion: 10, tipo: falla, perdidas: 80 }
    - { estacion: 3, tipo: ok, perdidas: 0 }
    - { estacion: 7, tipo: falla, perdidas: 45 }
    - { estacion: 9, tipo: ok, perdidas: 0 }
scenarios:
  - {}
  - globals:
      bitacora:
        - { estacion: 11, tipo: falla, perdidas: 12 }
        - { estacion: 6, tipo: ok, perdidas: 0 }
        - { estacion: 2, tipo: falla, perdidas: 60 }
        - { estacion: 8, tipo: ok, perdidas: 0 }
        - { estacion: 5, tipo: falla, perdidas: 25 }
        - { estacion: 9, tipo: falla, perdidas: 90 }
  - globals:
      bitacora:
        - { estacion: 3, tipo: ok, perdidas: 0 }
        - { estacion: 6, tipo: falla, perdidas: 15 }
tests:
  - name: marca justo las estaciones que fallaron
    state: 'JSON.stringify([...w.marks].sort()) === JSON.stringify(g.bitacora.filter((e) => e.tipo === "falla").map((e) => `${e.estacion},1`).sort())'
    msg: Las casillas marcadas no son las de las fallas.
  - name: repara de más pérdidas a menos
    state: 'JSON.stringify(w.said) === JSON.stringify(g.bitacora.filter((e) => e.tipo === "falla").toSorted((a, b) => b.perdidas - a.perdidas).map((e) => `Reparo ${e.estacion}`))'
    msg: 'Chasqui debe decir "Reparo n" en cada falla, de la que más perdió a la que menos.'
  - name: entrega el parte en la oficina
    state: 'w.atGoal && w.delivered.length === 1 && w.delivered[0] === `${g.bitacora.filter((e) => e.tipo === "falla").length} reparadas`'
    msg: Al final, en D, entrega una vez con una etiqueta como "3 reparadas".
  - name: sin chocar
    state: '!w.crashed'
  - name: usa filter y un orden por comparador
    source: '\.filter\s*\([\s\S]*\.(toSorted|sort)\s*\(\s*\('
```

## Reto experto

```exercise
id: js7-reto-ordenar
type: challenge
title: Ordenar por varios criterios
prompt: |
  Escribe `ordenarPor(lista, ...criterios)`, que devuelve una copia de `lista` (un array de objetos) ordenada por varios criterios en orden de prioridad. Cada criterio es el nombre de una propiedad; con un `-` delante, de mayor a menor. Los valores son números o textos. No modifiques `lista`.

  `ordenarPor(robots, "-botellas", "nombre")`: primero más botellas, y a igual cantidad, por nombre.
starter: |
  function ordenarPor(lista, ...criterios) {
    return lista;
  }
solution: |
  function comparar(x, y) {
    if (typeof x === "number") {
      return x - y;
    }
    return String(x).localeCompare(String(y));
  }

  function ordenarPor(lista, ...criterios) {
    return lista.toSorted((a, b) => {
      for (const criterio of criterios) {
        const desc = criterio.startsWith("-");
        const clave = desc ? criterio.slice(1) : criterio;
        const r = comparar(a[clave], b[clave]);
        if (r !== 0) {
          return desc ? -r : r;
        }
      }
      return 0;
    });
  }
hints:
  - "El comparador recorre los criterios y devuelve el primer resultado que no sea 0."
  - "`criterio.startsWith(\"-\")` y `criterio.slice(1)` separan el signo del nombre."
tests:
  - name: botellas de mayor a menor, luego nombre
    run: 'ordenarPor([{ nombre: "Tupa", botellas: 50 }, { nombre: "Kusi", botellas: 60 }, { nombre: "Illa", botellas: 50 }], "-botellas", "nombre").map((r) => r.nombre)'
    equals: ["Kusi", "Illa", "Tupa"]
  - name: un solo criterio de texto
    run: 'ordenarPor([{ nombre: "Puma" }, { nombre: "Chato" }], "nombre").map((r) => r.nombre)'
    equals: ["Chato", "Puma"]
  - name: no modifica la lista
    expect: '(() => { const l = [{ n: 2 }, { n: 1 }]; ordenarPor(l, "n"); return l[0].n === 2; })()'
  - name: sin criterios, el mismo orden
    run: 'ordenarPor([{ n: 2 }, { n: 1 }]).map((r) => r.n)'
    equals: [2, 1]
```
