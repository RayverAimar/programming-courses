# Sesión 16 — Datos e historial

## El encargo

Arequipa, coliseo del colegio Independencia, a dos días de la final del Torneo Escolar de Robótica del Sur. El juego es "captura el banderín": cada ronda, los robots salen de la misma esquina y el primero que levanta un banderín gana el punto. La profesora Yolanda Quispe llegó a Loop con una USB y cara de pocos amigos: "Nuestro rival es Rocoto, el robot del colegio de Cayma. Nos ganó dos veces. Aquí están sus videos de todo el año, pasados a texto".

Son cientos de rondas, cada una una fila de movimientos: `"EEESSSEEN"`. Rocoto no improvisa: tiene costumbres. Pero nadie las ve leyendo cientos de filas. Hoy Chasqui aprende a **contar, agrupar y resumir un historial** con `Map` y `Set`, para adivinar qué hará Rocoto antes de que lo haga.

```escena
theme: museo
level: 4
dir: E
items: { a: banderín dorado, b: banderín azul, c: banderín rojo }
api: [move, path, cargo]
caption: La cancha del coliseo. Rocoto y Chasqui salen de la esquina de arriba; hay tres banderines. En esta ronda, Chasqui repite la ruta favorita de Rocoto y llega primero al dorado.
map: |
  #########
  #R......#
  #.##.##.#
  #....#a.#
  #.#.....#
  #b..#.c.#
  #########
program: |
  robot.seguirRuta(["E", "E", "E", "S", "S", "S", "E", "E", "N"]);
  robot.tomar();
  robot.decir("¡Te esperaba!");
```

## Lo mínimo

En la sesión 10 usaste `Set` para lo ya visitado y `Map` para guardar de dónde venías. Son también las dos herramientas para **resumir datos**: un `Set` dice qué valores distintos hay; un `Map` lleva una cuenta, o una lista, por cada clave.

```js run
const puertas = [3, 1, 3, 2, 3, 1];
console.log(new Set(puertas).size);
const veces = new Map();
for (const p of puertas) veces.set(p, (veces.get(p) ?? 0) + 1);
console.log(veces.get(3), [...veces.keys()].join(" "));
```

La línea de en medio es el patrón más útil de la sesión: **contar con un Map**. La primera vez que aparece una clave, `veces.get(p)` da `undefined`, `?? 0` lo vuelve 0, y se guarda 1. Míralo en cámara lenta:

```anima
title: Contar con un Map, una jugada por vuelta
code: |
  const historial = ["E", "S", "E", "E", "N", "E"];
  const conteo = new Map();
  for (let i = 0; i < historial.length; i++) {
    const mov = historial[i];
    conteo.set(mov, (conteo.get(mov) ?? 0) + 1);
  }
  console.log(conteo.get("E"));
cells: { of: historial, at: i }
show: [conteo, i]
notes:
  2: "Un Map vacío: todavía no hay ninguna clave."
  5: "Si mov ya estaba, suma 1 a su cuenta; si no, empieza en 1."
  7: "E salió 4 veces."
```

Con ese patrón y dos más tienes casi todo lo que pide un historial:

- **Distintos**: `new Set(lista)` quita repetidos; `.size` dice cuántos quedan y `[...conjunto]` los vuelve array.
- **Contar**: `conteo.set(k, (conteo.get(k) ?? 0) + 1)`. Al final, recorre `for (const [clave, veces] of conteo)` para encontrar la más frecuente. Un `Map` recuerda el orden en que entraron las claves, así que "la primera en aparecer" sale gratis en los empates.
- **Agrupar**: un `Map` de listas. Crea la lista la primera vez y luego agrega: `if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(x);`. Hoy también existe `Map.groupBy(lista, (x) => clave)`, que hace lo mismo en una línea.
- **Ventanas**: las últimas `k` jugadas son `historial.slice(-k)`. Para recorrer todas las ventanas de `k` seguidas, no vuelvas a sumar todo: **suma la que entra y resta la que sale**.
- **Claves compuestas**: para contar "qué hizo en la casilla (2, 3)" o "qué vino después de 3, 1", junta las partes en un texto: `` `${x},${y}` ``, `ventana.join(",")`.

> **Trampa común:** un array como clave no funciona. `vistas.add([2, 3])` y luego `vistas.has([2, 3])` da `false`, porque son **dos arrays distintos** que solo se parecen. Los `Map` y `Set` comparan los objetos por identidad, no por contenido. Usa una clave de texto: `"2,3"`.

<!-- legacy: group-by -->

<!-- mdn: map-vs-object set-vs-object group-by -->

## Práctica

```exercise
id: js16-predice-set
type: predict
title: Las puertas de Rocoto
prompt: |
  En seis rondas, Rocoto entró por estas puertas. ¿Qué imprime?
code: |
  const puertas = [3, 1, 3, 2, 1, 3];
  const distintas = new Set(puertas);
  console.log(distintas.size);
  console.log([...distintas].join(" "));
options:
  - "3\n3 1 2"
  - "6\n3 1 3 2 1 3"
  - "3\n1 2 3"
  - "4\n3 1 2"
answer: "3\n3 1 2"
explain: |
  Un `Set` guarda cada valor una sola vez: quedan 3, 1 y 2. Y los guarda **en el orden en que llegaron**, no ordenados: por eso sale `3 1 2`.
```

```exercise
id: js16-predice-clave
type: predict
title: La casilla que no aparece
prompt: |
  Chasqui anota las casillas donde vio a Rocoto. ¿Qué imprime?
code: |
  const vistas = new Set();
  vistas.add([2, 3]);
  vistas.add("2,3");
  console.log(vistas.has([2, 3]), vistas.has("2,3"), vistas.size);
options:
  - "true true 1"
  - "true true 2"
  - "false true 2"
  - "false false 2"
answer: "false true 2"
explain: |
  Cada `[2, 3]` que escribes es un array **nuevo**. El `Set` tiene el primero, y `has` pregunta por otro distinto que solo se le parece: `false`. Los textos, en cambio, se comparan por su contenido: `"2,3"` sí está. Por eso las coordenadas se guardan como texto.
```

```exercise
id: js16-completa-favorita
type: complete
title: La puerta favorita
prompt: |
  Cuenta cuántas veces usó Rocoto cada puerta y encuentra la que más usó.
visual:
  figure:
    input: { label: puertas, cells: [4, 2, 4, 7, 2, 4, 9, 4], highlight: [0, 2, 5, 7] }
    arrow: contar con un Map
    output: { label: conteo, table: { head: ["puerta", "veces"], rows: [["4", "4"], ["2", "2"], ["7", "1"], ["9", "1"]] } }
starter: |
  const puertas = [4, 2, 4, 7, 2, 4, 9, 4];
  const conteo = new Map();
  for (const puerta of puertas) {
    conteo.set(puerta, (conteo.___(puerta) ___ 0) + 1);
  }

  let favorita = null;
  for (const [puerta, veces] of conteo) {
    if (favorita === null || veces > conteo.get(favorita)) {
      favorita = ___;
    }
  }
  console.log(favorita, conteo.get(favorita));
solution: |
  const puertas = [4, 2, 4, 7, 2, 4, 9, 4];
  const conteo = new Map();
  for (const puerta of puertas) {
    conteo.set(puerta, (conteo.get(puerta) ?? 0) + 1);
  }

  let favorita = null;
  for (const [puerta, veces] of conteo) {
    if (favorita === null || veces > conteo.get(favorita)) {
      favorita = puerta;
    }
  }
  console.log(favorita, conteo.get(favorita));
hints:
  - "Para leer la cuenta actual de una clave se usa `get`; si no está, da `undefined`."
  - "`?? 0` cambia `undefined` por 0. Y la favorita es la `puerta` de esa vuelta."
tests:
  - name: la puerta 2 se contó dos veces
    expect: conteo.get(2) === 2
  - name: hay cuatro puertas distintas
    expect: conteo.size === 4
  - name: la favorita es la 4, con 4 veces
    output: 4 4
```

```exercise
id: js16-arregla-agrupar
type: fix
title: Las rondas que se borraban
prompt: |
  Este código agrupa las jugadas por ronda, pero cada ronda termina con **una sola** jugada. Debería imprimir `ESE SO`. Arréglalo.
visual:
  figure:
    input: { label: jugadas, table: { head: ["ronda", "mov"], rows: [["1", "E"], ["1", "S"], ["2", "S"], ["1", "E"], ["2", "O"]] } }
    arrow: agrupar por ronda
    output: { label: porRonda, cards: [{ title: "ronda 1", rows: [["movs", "E, S, E"]] }, { title: "ronda 2", rows: [["movs", "S, O"]] }] }
starter: |
  const jugadas = [
    { ronda: 1, mov: "E" }, { ronda: 1, mov: "S" }, { ronda: 2, mov: "S" },
    { ronda: 1, mov: "E" }, { ronda: 2, mov: "O" },
  ];

  const porRonda = new Map();
  for (const { ronda, mov } of jugadas) {
    porRonda.set(ronda, [mov]);
  }
  console.log(porRonda.get(1).join(""), porRonda.get(2).join(""));
solution: |
  const jugadas = [
    { ronda: 1, mov: "E" }, { ronda: 1, mov: "S" }, { ronda: 2, mov: "S" },
    { ronda: 1, mov: "E" }, { ronda: 2, mov: "O" },
  ];

  const porRonda = new Map();
  for (const { ronda, mov } of jugadas) {
    if (!porRonda.has(ronda)) {
      porRonda.set(ronda, []);
    }
    porRonda.get(ronda).push(mov);
  }
  console.log(porRonda.get(1).join(""), porRonda.get(2).join(""));
hints:
  - "`set(ronda, [mov])` crea una lista nueva en cada vuelta y pisa la anterior."
  - "Crea la lista solo si la ronda todavía no está (`has`), y después agrega con `push`."
tests:
  - name: imprime las dos rondas completas
    output: ESE SO
  - name: la ronda 1 tiene tres jugadas
    expect: porRonda.get(1).length === 3
```

```exercise
id: js16-escribe-racha
type: write
title: La mejor racha
prompt: |
  Escribe `mejorRacha(puntos, k)`: la suma más alta de `k` rondas **seguidas**.

  `puntos` son los puntos de Rocoto ronda por ronda; `k` va de 1 al largo de la lista. Usa una ventana que se desliza: al moverla una casilla, **suma la ronda que entra y resta la que sale**, en vez de volver a sumar las `k`.
visual:
  figure:
    title: "mejorRacha([3, 1, 4, 1, 5, 9, 2, 6], 3)"
    panes:
      - { label: "ventana 1: 3 + 1 + 4 = 8", cells: [3, 1, 4, 1, 5, 9, 2, 6], highlight: [0, 1, 2] }
      - { label: "ventana 2: 8 + 1 − 3 = 6", cells: [3, 1, 4, 1, 5, 9, 2, 6], highlight: [1, 2, 3] }
      - { label: "la mejor: 9 + 2 + 6 = 17", cells: [3, 1, 4, 1, 5, 9, 2, 6], highlight: [5, 6, 7] }
starter: |
  function mejorRacha(puntos, k) {
  }

  console.log(mejorRacha([3, 1, 4, 1, 5, 9, 2, 6], 3));
solution: |
  function mejorRacha(puntos, k) {
    let ventana = 0;
    for (let i = 0; i < k; i++) {
      ventana += puntos[i];
    }
    let mejor = ventana;
    for (let i = k; i < puntos.length; i++) {
      ventana += puntos[i] - puntos[i - k];
      mejor = Math.max(mejor, ventana);
    }
    return mejor;
  }

  console.log(mejorRacha([3, 1, 4, 1, 5, 9, 2, 6], 3));
hints:
  - Suma las primeras `k` para tener la primera ventana; esa es también la mejor por ahora.
  - "Luego, desde `i = k`: la que entra es `puntos[i]` y la que sale es `puntos[i - k]`."
tests:
  - name: el ejemplo da 17
    run: mejorRacha([3, 1, 4, 1, 5, 9, 2, 6], 3)
    equals: 17
  - name: con k = 1, la ronda más alta
    run: mejorRacha([2, 5, 1], 1)
    equals: 5
  - name: con k igual al largo, todo
    run: mejorRacha([2, 5, 1], 3)
    equals: 8
  - name: la mejor racha está al principio
    run: mejorRacha([7, 7, 0, 0, 1], 2)
    equals: 14
```

```exercise
id: js16-escribe-despues
type: write
title: ¿Qué hace después?
prompt: |
  Escribe `despuesDe(movs, m)`: el movimiento que Rocoto hace **más veces justo después** de `m`.

  `movs` es un texto como `"EESESEN"`. Si hay empate, gana el que apareció primero; si `m` nunca va seguido de nada, devuelve `null`.

  `despuesDe("EESESEN", "E")` → `"S"`: después de cada E vinieron E, S, S y N.
visual:
  figure:
    input: { label: "movs", cells: ["E", "E", "S", "E", "S", "E", "N"], highlight: [1, 2, 4, 6] }
    arrow: "lo que viene justo después de cada E"
    output: { label: "conteo → devuelve \"S\"", table: { head: ["después de E", "veces"], rows: [["E", "1"], ["S", "2"], ["N", "1"]] } }
starter: |
  function despuesDe(movs, m) {
  }

  console.log(despuesDe("EESESEN", "E"));
solution: |
  function despuesDe(movs, m) {
    const conteo = new Map();
    for (let i = 0; i + 1 < movs.length; i++) {
      if (movs[i] === m) {
        const sig = movs[i + 1];
        conteo.set(sig, (conteo.get(sig) ?? 0) + 1);
      }
    }
    let mejor = null;
    for (const [mov, veces] of conteo) {
      if (mejor === null || veces > conteo.get(mejor)) {
        mejor = mov;
      }
    }
    return mejor;
  }

  console.log(despuesDe("EESESEN", "E"));
hints:
  - "Recorre con un índice hasta el penúltimo: el que viene después de `movs[i]` es `movs[i + 1]`."
  - "Cuenta en un `Map` y quédate con el mayor usando `>` estricto: así, en un empate, se queda el primero que entró."
tests:
  - name: después de E viene S
    run: despuesDe("EESESEN", "E")
    equals: S
  - name: empate, gana el primero
    run: despuesDe("ENES", "E")
    equals: N
  - name: una E al final no cuenta
    run: despuesDe("SSE", "E")
    equals: null
  - name: un movimiento que no aparece
    run: despuesDe("SSS", "N")
    equals: null
  - name: usa un Map
    source: 'new Map'
```

## El caso

```exercise
id: js16-caso-espias
type: case
title: El espía que contó mal
prompt: |
  Calcula cuántas puertas **distintas** usó Rocoto en cada torneo y compáralo con lo que reportó el espía de ese torneo.

  La profesora Yolanda mandó cinco alumnos a espiar a Rocoto, uno por torneo. Cada uno volvió con un solo número: cuántas puertas distintas usó Rocoto allí. Uno de ellos contó mal, y la estrategia del equipo depende de esos números. ¿Quién fue?

  Imprime una línea por torneo, con el número al final: `Tacna: 4`. El tablero la compara con lo que reportó su espía.
visual:
  board:
    for: js16-caso-espias
    title: Lo que reportó cada espía
    task: Agrupa las jugadas por torneo, cuenta las puertas distintas de cada uno y compara.
    cards:
      - { name: Fiorella, kind: person, role: "Espió en Tacna", rows: [["Reportó", "4 puertas distintas"]], clue: { find: "Tacna", says: 4 } }
      - { name: Brayan, kind: person, role: "Espió en Moquegua", rows: [["Reportó", "3 puertas distintas"]], clue: { find: "Moquegua", says: 3 } }
      - { name: Ximena, kind: person, role: "Espió en Puno", rows: [["Reportó", "5 puertas distintas"]], clue: { find: "Puno", says: 5 } }
      - { name: Edwin, kind: person, role: "Espió en Cusco", culprit: true, rows: [["Reportó", "4 puertas distintas"]], clue: { find: "Cusco", says: 4 } }
      - { name: Milagros, kind: person, role: "Espió en Ica", rows: [["Reportó", "2 puertas distintas"]], clue: { find: "Ica", says: 2 } }
    caption: "Ojo: contar **jugadas** no es contar **puertas distintas**. Si todas las tarjetas dicen **No cuadra**, revisa qué estás contando."
starter: |
  const jugadas = [
    { torneo: "Tacna", puerta: 3 }, { torneo: "Puno", puerta: 1 }, { torneo: "Cusco", puerta: 7 },
    { torneo: "Ica", puerta: 2 }, { torneo: "Tacna", puerta: 5 }, { torneo: "Moquegua", puerta: 4 },
    { torneo: "Cusco", puerta: 2 }, { torneo: "Puno", puerta: 6 }, { torneo: "Tacna", puerta: 3 },
    { torneo: "Ica", puerta: 2 }, { torneo: "Cusco", puerta: 7 }, { torneo: "Moquegua", puerta: 4 },
    { torneo: "Puno", puerta: 1 }, { torneo: "Tacna", puerta: 8 }, { torneo: "Cusco", puerta: 9 },
    { torneo: "Ica", puerta: 6 }, { torneo: "Moquegua", puerta: 1 }, { torneo: "Puno", puerta: 9 },
    { torneo: "Cusco", puerta: 4 }, { torneo: "Tacna", puerta: 5 }, { torneo: "Puno", puerta: 3 },
    { torneo: "Moquegua", puerta: 4 }, { torneo: "Cusco", puerta: 2 }, { torneo: "Ica", puerta: 2 },
    { torneo: "Tacna", puerta: 1 }, { torneo: "Puno", puerta: 6 }, { torneo: "Cusco", puerta: 5 },
    { torneo: "Moquegua", puerta: 8 }, { torneo: "Puno", puerta: 4 }, { torneo: "Ica", puerta: 6 },
    { torneo: "Cusco", puerta: 9 }, { torneo: "Tacna", puerta: 3 }, { torneo: "Moquegua", puerta: 1 },
    { torneo: "Puno", puerta: 1 }, { torneo: "Cusco", puerta: 7 }, { torneo: "Ica", puerta: 2 },
  ];

  // Así se lee una jugada:
  const { torneo, puerta } = jugadas[0];
  console.log("Primera jugada:", torneo, "puerta", puerta);

  // TODO: agrupa las puertas por torneo en un Map (torneo → Set de puertas)
  // TODO: imprime una línea por torneo, así: Tacna: 4
solution: |
  const jugadas = [
    { torneo: "Tacna", puerta: 3 }, { torneo: "Puno", puerta: 1 }, { torneo: "Cusco", puerta: 7 },
    { torneo: "Ica", puerta: 2 }, { torneo: "Tacna", puerta: 5 }, { torneo: "Moquegua", puerta: 4 },
    { torneo: "Cusco", puerta: 2 }, { torneo: "Puno", puerta: 6 }, { torneo: "Tacna", puerta: 3 },
    { torneo: "Ica", puerta: 2 }, { torneo: "Cusco", puerta: 7 }, { torneo: "Moquegua", puerta: 4 },
    { torneo: "Puno", puerta: 1 }, { torneo: "Tacna", puerta: 8 }, { torneo: "Cusco", puerta: 9 },
    { torneo: "Ica", puerta: 6 }, { torneo: "Moquegua", puerta: 1 }, { torneo: "Puno", puerta: 9 },
    { torneo: "Cusco", puerta: 4 }, { torneo: "Tacna", puerta: 5 }, { torneo: "Puno", puerta: 3 },
    { torneo: "Moquegua", puerta: 4 }, { torneo: "Cusco", puerta: 2 }, { torneo: "Ica", puerta: 2 },
    { torneo: "Tacna", puerta: 1 }, { torneo: "Puno", puerta: 6 }, { torneo: "Cusco", puerta: 5 },
    { torneo: "Moquegua", puerta: 8 }, { torneo: "Puno", puerta: 4 }, { torneo: "Ica", puerta: 6 },
    { torneo: "Cusco", puerta: 9 }, { torneo: "Tacna", puerta: 3 }, { torneo: "Moquegua", puerta: 1 },
    { torneo: "Puno", puerta: 1 }, { torneo: "Cusco", puerta: 7 }, { torneo: "Ica", puerta: 2 },
  ];

  const porTorneo = new Map();
  for (const { torneo, puerta } of jugadas) {
    if (!porTorneo.has(torneo)) {
      porTorneo.set(torneo, new Set());
    }
    porTorneo.get(torneo).add(puerta);
  }

  const espias = { Tacna: ["Fiorella", 4], Moquegua: ["Brayan", 3], Puno: ["Ximena", 5], Cusco: ["Edwin", 4], Ica: ["Milagros", 2] };
  for (const [torneo, puertas] of porTorneo) {
    const [espia, reporto] = espias[torneo];
    const nota = reporto === puertas.size ? "bien" : `mal: ${espia} reportó ${reporto}`;
    console.log(`${torneo} (${nota}): ${puertas.size}`);
  }
answer: Edwin
answerLabel: ¿Qué espía contó mal? (su nombre)
reveal: |
  Edwin. En Cusco, Rocoto jugó 9 rondas por las puertas 7, 2, 9, 4 y 5: **cinco** distintas, no cuatro. Seguramente contó la 7 y la 2 sin ver que la 5 apareció una sola vez, casi al final. Los demás contaron bien: Tacna 3, 5, 8, 1; Moquegua 4, 1, 8; Puno 1, 6, 9, 3, 4; Ica 2, 6.
hints:
  - "Un `Map` de `Set`s: la primera vez que aparece un torneo, `set(torneo, new Set())`; después, `get(torneo).add(puerta)`."
  - "Al final, `for (const [torneo, puertas] of porTorneo)` y `puertas.size`."
```

## El juez

```exercise
id: js16-juez-puerta
type: judge
mode: function
function: predicePuerta
title: La próxima puerta de Rocoto
prompt: |
  Devuelve la puerta (1 a 9) por la que Rocoto entrará en la próxima ronda, según su historial.

  En la final, cada ronda Rocoto entra a la cancha por una de nueve puertas, y Chasqui solo puede vigilar una. La profesora Yolanda tiene una regla para predecirlo, y quiere que Chasqui la aplique al vuelo con `predicePuerta(historial, k)`:

  1. Toma la **ventana**: las últimas `k` puertas del historial.
  2. Busca cada vez que esa misma secuencia de `k` puertas apareció **antes** y fue seguida por otra puerta. Cuenta qué puerta vino justo después.
  3. Devuelve la más contada. Empate: la de **número menor**.
  4. Si la ventana nunca apareció antes (o `k` es tan grande que no cabe), devuelve la puerta **más usada** de todo el historial. Empate: la menor.

  **Restricciones:** 1 ≤ largo del historial ≤ 3000 · 1 ≤ k ≤ 6 · puertas de 1 a 9.
visual:
  figure:
    title: El ejemplo 1, dibujado
    input: { label: "historial, k = 2: la ventana es 3, 1", cells: [3, 1, 4, 3, 1, 5, 3, 1, 4, 2, 3, 1], highlight: [0, 1, 3, 4, 6, 7, 10, 11] }
    arrow: "¿qué vino después de cada 3, 1 anterior?"
    output: { label: "devuelve 4", table: { head: ["3, 1 en la posición", "vino después"], rows: [["0", "4"], ["3", "5"], ["6", "4"], ["10 (es la ventana)", "nada todavía"]] } }
    steps:
      - "La ventana `3, 1` apareció tres veces antes. Después vino 4, 5 y 4."
      - "El 4 gana con 2 votos. La última aparición es la ventana misma: no tiene \"después\"."
starter: |
  function predicePuerta(historial, k) {
    return historial[historial.length - 1];
  }
solution: |
  function masContada(conteo) {
    let mejor = null;
    for (const [puerta, veces] of conteo) {
      if (mejor === null || veces > conteo.get(mejor) || (veces === conteo.get(mejor) && puerta < mejor)) {
        mejor = puerta;
      }
    }
    return mejor;
  }

  function predicePuerta(historial, k) {
    const n = historial.length;
    const ventana = historial.slice(-k).join(",");
    const siguientes = new Map();
    for (let i = 0; i + k < n; i++) {
      if (historial.slice(i, i + k).join(",") === ventana) {
        const sig = historial[i + k];
        siguientes.set(sig, (siguientes.get(sig) ?? 0) + 1);
      }
    }
    if (k < n && siguientes.size > 0) {
      return masContada(siguientes);
    }
    const total = new Map();
    for (const p of historial) {
      total.set(p, (total.get(p) ?? 0) + 1);
    }
    return masContada(total);
  }
hints:
  - "Convierte cada ventana en texto con `join(\",\")`: así dos ventanas iguales se comparan con `===` y sirven de clave."
  - "Las ventanas que se comparan empiezan en `i` y terminan antes de `n`: la condición `i + k < n` deja fuera la ventana final, que no tiene \"después\"."
samples:
  - args: [[3, 1, 4, 3, 1, 5, 3, 1, 4, 2, 3, 1], 2]
    returns: 4
    note: "Después de 3, 1 vino 4, 5 y 4."
  - args: [[2, 7, 2, 7], 3]
    returns: 2
    note: "La ventana 7, 2, 7 no apareció antes. La más usada: 2 y 7 empatan con 2 veces; gana la menor."
  - args: [[5], 1]
    returns: 5
    note: Una sola ronda.
edge:
  - args: [[1, 1, 1, 1], 2]
    tag: con ventanas que se pisan
  - args: [[4, 9, 4, 6, 4], 1]
    tag: con un empate entre lo que vino después
  - args: [[8, 3, 8, 3], 6]
    tag: con k más grande que el historial
  - args: [[6, 2, 9, 1], 1]
    tag: cuando la ventana nunca apareció
  - args: [[9, 9, 2, 9, 9, 2, 9, 9], 2]
    tag: cuando lo que más se usa no es lo que se predice
random:
  count: 40
  seed: 16
  generate: |
    const patron = rng.list(rng.int(2, 5), 1, 9);
    const n = rng.int(1, 3000);
    const historial = [];
    for (let i = 0; i < n; i++) {
      historial.push(rng.next() < 0.8 ? patron[i % patron.length] : rng.int(1, 9));
    }
    return [historial, rng.int(1, 6)];
wrong:
  - |
    function predicePuerta(historial, k) {
      const ventana = historial.slice(-k).join(",");
      const siguientes = new Map();
      for (let i = 0; i + k < historial.length; i++) {
        if (historial.slice(i, i + k).join(",") === ventana) {
          siguientes.set(historial[i + k], (siguientes.get(historial[i + k]) ?? 0) + 1);
        }
      }
      if (siguientes.size === 0) return historial[historial.length - 1];
      let mejor = null;
      for (const [p, v] of siguientes) if (mejor === null || v > siguientes.get(mejor) || (v === siguientes.get(mejor) && p < mejor)) mejor = p;
      return mejor;
    }
  - |
    function predicePuerta(historial, k) {
      const ventana = historial.slice(-k).join(",");
      const conteo = new Map();
      for (let i = 0; i + k < historial.length; i++) {
        if (historial.slice(i, i + k).join(",") === ventana) conteo.set(historial[i + k], (conteo.get(historial[i + k]) ?? 0) + 1);
      }
      if (conteo.size === 0) for (const p of historial) conteo.set(p, (conteo.get(p) ?? 0) + 1);
      let mejor = null;
      for (const [p, v] of conteo) if (mejor === null || v > conteo.get(mejor)) mejor = p;
      return mejor;
    }
  - |
    function predicePuerta(historial, k) {
      const ventana = historial.slice(-k).join(",");
      const conteo = new Map();
      for (let i = 0; i + k <= historial.length; i++) {
        if (historial.slice(i, i + k).join(",") === ventana) conteo.set(historial[i + k], (conteo.get(historial[i + k]) ?? 0) + 1);
      }
      let mejor = null;
      for (const [p, v] of conteo) if (mejor === null || v > conteo.get(mejor) || (v === conteo.get(mejor) && p < mejor)) mejor = p;
      return mejor;
    }
  - |
    function predicePuerta(historial, k) {
      const ultima = historial[historial.length - 1];
      const conteo = new Map();
      for (let i = 0; i + 1 < historial.length; i++) {
        if (historial[i] === ultima) conteo.set(historial[i + 1], (conteo.get(historial[i + 1]) ?? 0) + 1);
      }
      if (conteo.size === 0) for (const p of historial) conteo.set(p, (conteo.get(p) ?? 0) + 1);
      let mejor = null;
      for (const [p, v] of conteo) if (mejor === null || v > conteo.get(mejor) || (v === conteo.get(mejor) && p < mejor)) mejor = p;
      return mejor;
    }
```

## Misión final

```exercise
id: js16-mision-rocoto
type: mission
title: Llegar antes que Rocoto
prompt: |
  Predice la ruta de Rocoto con su historial, márcala en la cancha, recórrela y toma el banderín donde termina.

  `rondas` trae las rondas pasadas de Rocoto, cada una un texto de movimientos (`"N"`, `"E"`, `"S"`, `"O"`) desde la esquina donde está Chasqui. Rocoto es un robot de costumbres: **en cada casilla hace el movimiento que más veces hizo en esa casilla**. Su ruta predicha termina en la casilla donde nunca siguió de largo.

  1. Recorre cada ronda desde la salida y cuenta, **por casilla**, cuántas veces hizo cada movimiento: un `Map` de casilla (`"x,y"`) a otro `Map` de movimiento a veces.
  2. Desde la salida, sigue el movimiento más contado de cada casilla hasta llegar a una casilla sin movimientos.
  3. `robot.marcar(casillas)` pinta la ruta, `robot.seguirRuta(movimientos)` la recorre y `robot.tomar()` levanta el banderín. Solo le cabe uno.

  `paso(pos, mov)` te da la casilla vecina. En los datos no hay empates. Se prueba con tres historiales distintos.
visual:
  figure:
    title: Lo que se cuenta en una casilla
    panes:
      - { label: "rondas", text: "\"SSSS\"\n\"EEESSSEEN\"\n\"EEESSSEES\"\n\"SSSS\"\n…" }
      - { label: "en la salida (1,1)", table: { head: ["mov", "veces"], rows: [["S", "4"], ["E", "5"]] } }
      - { label: "ruta predicha", grid: ["#########", "#R......#", "#.##.##.#", "#....#a.#", "#.#.....#", "#b..#.c.#", "#########"], path: ["2,1", "3,1", "4,1", "4,2", "4,3", "4,4", "5,4", "6,4", "6,3"] }
starter: |
  const salida = robot.posicion;
  const clave = ({ x, y }) => `${x},${y}`;

  // Así se recorre la primera ronda, casilla por casilla:
  let pos = salida;
  for (const mov of rondas[0]) {
    console.log(clave(pos), "→", mov);
    pos = paso(pos, mov);
  }

  // TODO: cuenta los movimientos de todas las rondas, por casilla
  // TODO: predice la ruta, márcala, recórrela y toma el banderín
solution: |
  const salida = robot.posicion;
  const clave = ({ x, y }) => `${x},${y}`;

  const movsPorCasilla = new Map();
  for (const ronda of rondas) {
    let pos = salida;
    for (const mov of ronda) {
      const k = clave(pos);
      if (!movsPorCasilla.has(k)) {
        movsPorCasilla.set(k, new Map());
      }
      const conteo = movsPorCasilla.get(k);
      conteo.set(mov, (conteo.get(mov) ?? 0) + 1);
      pos = paso(pos, mov);
    }
  }

  const movimientos = [];
  const casillas = [];
  let pos = salida;
  while (movsPorCasilla.has(clave(pos))) {
    let mejor = null;
    for (const [mov, veces] of movsPorCasilla.get(clave(pos))) {
      if (mejor === null || veces > movsPorCasilla.get(clave(pos)).get(mejor)) {
        mejor = mov;
      }
    }
    movimientos.push(mejor);
    pos = paso(pos, mejor);
    casillas.push(pos);
  }

  robot.marcar(casillas);
  robot.seguirRuta(movimientos);
  robot.tomar();
hints:
  - "Es el patrón de agrupar con un Map dentro de otro: crea el Map de la casilla la primera vez (`has` / `set`) y cuenta dentro con `get(mov) ?? 0`."
  - "Para predecir: `while (movsPorCasilla.has(clave(pos)))`, elige el movimiento con más veces, guárdalo, avanza `pos` con `paso` y guarda la casilla."
world:
  theme: museo
  level: 4
  dir: E
  api: [move, path, cargo]
  capacity: 1
  items: { a: banderín dorado, b: banderín azul, c: banderín rojo }
  map: |
    #########
    #R......#
    #.##.##.#
    #....#a.#
    #.#.....#
    #b..#.c.#
    #########
helpers:
  - name: paso
    sig: "paso(pos, mov) → { x, y }"
    doc: "La casilla vecina de pos en la dirección mov (\"N\", \"E\", \"S\", \"O\")."
    code: "(pos, mov) => ({ x: pos.x + ({ E: 1, O: -1 }[mov] ?? 0), y: pos.y + ({ S: 1, N: -1 }[mov] ?? 0) })"
  - name: rondas
    sig: "rondas: string[]"
    doc: Las rondas pasadas de Rocoto, cada una un texto de movimientos desde la salida.
globals:
  rondas: ["SSSS", "EEESSSEEN", "EEESSSEES", "SSSS", "EEESSSEEN", "SSSS", "EEESSSEEN", "EEESSSEES", "SSSS"]
scenarios:
  - tests:
      - name: marca la ruta hacia el banderín dorado
        state: '["2,1", "3,1", "4,1", "4,2", "4,3", "4,4", "5,4", "6,4", "6,3"].every((k) => w.marks.includes(k)) && w.marks.every((k) => ["1,1", "2,1", "3,1", "4,1", "4,2", "4,3", "4,4", "5,4", "6,4", "6,3"].includes(k))'
        msg: Las casillas marcadas no son la ruta predicha. Ojo, el banderín más visitado (el azul) no es el de la ruta.
      - name: toma el banderín dorado
        state: 'w.inventory.length === 1 && w.inventory[0] === "banderín dorado"'
  - globals:
      rondas: ["EEESSSEES", "EEESSSEEN", "SSSS", "EEESSSEES", "EEEEEESSO", "EEESSSEES", "SSSS", "EEESSSEEN"]
    tests:
      - name: marca la ruta hacia el banderín rojo
        state: '["2,1", "3,1", "4,1", "4,2", "4,3", "4,4", "5,4", "6,4", "6,5"].every((k) => w.marks.includes(k)) && w.marks.every((k) => ["1,1", "2,1", "3,1", "4,1", "4,2", "4,3", "4,4", "5,4", "6,4", "6,5"].includes(k))'
        msg: Las casillas marcadas no son la ruta predicha.
      - name: toma el banderín rojo
        state: 'w.inventory.length === 1 && w.inventory[0] === "banderín rojo"'
  - globals:
      rondas: ["EEESSSEEN", "SSSS", "EEESSSEES", "SSSS", "EEEEEESSO", "SSSS", "EEESSSEEN", "SSSS", "SSSS"]
    tests:
      - name: marca la ruta hacia el banderín azul
        state: '["1,2", "1,3", "1,4", "1,5"].every((k) => w.marks.includes(k)) && w.marks.every((k) => ["1,1", "1,2", "1,3", "1,4", "1,5"].includes(k))'
        msg: Las casillas marcadas no son la ruta predicha.
      - name: toma el banderín azul
        state: 'w.inventory.length === 1 && w.inventory[0] === "banderín azul"'
tests:
  - name: cuenta con un Map
    source: 'new Map'
  - name: sin chocar
    state: '!w.crashed'
```

## Reto experto

```exercise
id: js16-reto-sinrepetir
type: challenge
title: La racha sin repetir
prompt: |
  Escribe `rachaSinRepetir(puertas)`: el largo del tramo **seguido** más largo en el que Rocoto no repitió ninguna puerta. Con `[1, 2, 1, 3, 4, 2, 2]` es 4 (`2, 1, 3, 4` o `1, 3, 4, 2`). Hazlo en una sola pasada: una ventana que crece por la derecha y, cuando entra una puerta repetida, salta por la izquierda. Un `Map` de puerta → última posición donde la viste te dice adónde saltar.
starter: |
  function rachaSinRepetir(puertas) {
    return 0;
  }

  console.log(rachaSinRepetir([1, 2, 1, 3, 4, 2, 2]));
solution: |
  function rachaSinRepetir(puertas) {
    const ultima = new Map();
    let inicio = 0;
    let mejor = 0;
    puertas.forEach((p, i) => {
      if (ultima.has(p) && ultima.get(p) >= inicio) {
        inicio = ultima.get(p) + 1;
      }
      ultima.set(p, i);
      mejor = Math.max(mejor, i - inicio + 1);
    });
    return mejor;
  }

  console.log(rachaSinRepetir([1, 2, 1, 3, 4, 2, 2]));
hints:
  - "Si la puerta ya está **dentro** de la ventana (su última posición es ≥ `inicio`), la ventana empieza justo después de esa posición."
tests:
  - name: el ejemplo da 4
    run: rachaSinRepetir([1, 2, 1, 3, 4, 2, 2])
    equals: 4
  - name: sin rondas, 0
    run: rachaSinRepetir([])
    equals: 0
  - name: todas iguales, 1
    run: rachaSinRepetir([5, 5, 5])
    equals: 1
  - name: todas distintas
    run: rachaSinRepetir([1, 2, 3, 4, 5, 6, 7, 8, 9])
    equals: 9
  - name: una repetida vieja no corta la ventana
    run: rachaSinRepetir([1, 2, 3, 1, 4, 5])
    equals: 5
  - name: es rápida con 100 000 rondas
    expect: '(() => { const l = Array.from({ length: 100000 }, (_, i) => (i * 7) % 9 + 1); return rachaSinRepetir(l) === 9; })()'
```
